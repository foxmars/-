'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const { EventEmitter } = require('node:events');

const root = path.join(__dirname, 'dist');
const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || '0.0.0.0';
const maxWebSocketPayload = 32_768;
const rooms = new Map();
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png' };
const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const staticCache = new Map();

function serveStatic(request, response, file, contents) {
  let cached = staticCache.get(file);
  if (!cached) {
    const compressed = contents.length > 1024 ? zlib.gzipSync(contents, { level: 6 }) : null;
    cached = {
      contents,
      compressed: compressed && compressed.length < contents.length ? compressed : null,
      etag: '"' + crypto.createHash('sha1').update(contents).digest('hex') + '"'
    };
    staticCache.set(file, cached);
  }
  const isHtml = path.extname(file) === '.html';
  const headers = {
    'Content-Type': mime[path.extname(file)] || 'application/octet-stream',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': isHtml ? 'no-cache' : 'public, max-age=3600',
    'ETag': cached.etag,
    'Vary': 'Accept-Encoding'
  };
  if (request.headers['if-none-match'] === cached.etag) {
    response.writeHead(304, headers);
    response.end();
    return;
  }
  const useGzip = cached.compressed && /(?:^|,)\s*gzip\s*(?:;|,|$)/i.test(request.headers['accept-encoding'] || '');
  const body = useGzip ? cached.compressed : cached.contents;
  if (useGzip) headers['Content-Encoding'] = 'gzip';
  headers['Content-Length'] = body.length;
  response.writeHead(200, headers);
  response.end(request.method === 'HEAD' ? undefined : body);
}

class WebSocketPeer extends EventEmitter {
  constructor(socket, initialData = Buffer.alloc(0)) {
    super();
    this.socket = socket;
    // Send real-time control frames immediately and keep inactive paths warm.
    socket.setNoDelay(true);
    socket.setKeepAlive(true, 15_000);
    this.readyState = WebSocketPeer.OPEN;
    this.buffer = initialData;
    socket.on('data', chunk => { this.buffer = Buffer.concat([this.buffer, chunk]); this.consume(); });
    socket.on('close', () => { this.readyState = WebSocketPeer.CLOSED; this.emit('close'); });
    socket.on('error', error => this.emit('error', error));
    if (initialData.length) this.consume();
  }

  consume() {
    while (this.buffer.length >= 2) {
      const first = this.buffer[0], second = this.buffer[1];
      const opcode = first & 0x0f, masked = Boolean(second & 0x80);
      let length = second & 0x7f, offset = 2;
      if (length === 126) {
        if (this.buffer.length < 4) return;
        length = this.buffer.readUInt16BE(2); offset = 4;
      } else if (length === 127) {
        if (this.buffer.length < 10) return;
        const bigLength = this.buffer.readBigUInt64BE(2);
        if (bigLength > BigInt(maxWebSocketPayload)) { this.socket.destroy(); return; }
        length = Number(bigLength); offset = 10;
      }
      if (!masked || length > maxWebSocketPayload) { this.socket.destroy(); return; }
      const maskOffset = masked ? 4 : 0;
      if (this.buffer.length < offset + maskOffset + length) return;
      const mask = masked ? this.buffer.subarray(offset, offset + 4) : null;
      const start = offset + maskOffset;
      const payload = Buffer.from(this.buffer.subarray(start, start + length));
      this.buffer = this.buffer.subarray(start + length);
      if (mask) for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i % 4];
      if (opcode === 0x8) { this.writeFrame(0x8, payload); this.socket.end(); return; }
      if (opcode === 0x9) { this.writeFrame(0xA, payload); continue; }
      if (opcode === 0xA) { this.emit('pong'); continue; }
      if (opcode === 0x1 && (first & 0x80)) this.emit('message', payload);
    }
  }

  writeFrame(opcode, payload) {
    if (this.readyState !== WebSocketPeer.OPEN) return;
    const length = payload.length;
    let header;
    if (length < 126) { header = Buffer.from([0x80 | opcode, length]); }
    else if (length <= 0xffff) { header = Buffer.alloc(4); header[0] = 0x80 | opcode; header[1] = 126; header.writeUInt16BE(length, 2); }
    else { header = Buffer.alloc(10); header[0] = 0x80 | opcode; header[1] = 127; header.writeBigUInt64BE(BigInt(length), 2); }
    this.socket.write(Buffer.concat([header, payload]));
  }

  send(text) { this.writeFrame(0x1, Buffer.from(String(text))); }
  ping() { this.writeFrame(0x9, Buffer.alloc(0)); }
  close() { this.readyState = WebSocketPeer.CLOSING; this.writeFrame(0x8, Buffer.alloc(0)); this.socket.end(); }
  terminate() { this.socket.destroy(); }
}
WebSocketPeer.OPEN = 1;
WebSocketPeer.CLOSED = 3;

class WebSocketServer extends EventEmitter {
  constructor() { super(); this.clients = new Set(); }
  handleUpgrade(request, socket, head, callback) {
    const key = request.headers['sec-websocket-key'];
    if (!key || request.headers.upgrade?.toLowerCase() !== 'websocket') { socket.destroy(); return; }
    const accept = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
    socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + accept + '\r\n\r\n');
    const peer = new WebSocketPeer(socket, head);
    this.clients.add(peer);
    peer.on('close', () => this.clients.delete(peer));
    callback(peer);
  }
}
const WebSocket = WebSocketPeer;

function send(socket, payload) {
  if (socket?.readyState !== WebSocket.OPEN) return;
  // Skip obsolete state snapshots when a slow link has queued newer data.
  if (payload.type === 'state' && socket.socket.writableLength > 16_384) return;
  socket.send(JSON.stringify(payload));
}

function broadcast(room, payload) {
  for (const client of room.clients) send(client, payload);
}

function makeCode() {
  let code;
  do {
    code = Array.from({ length: 6 }, () => alphabet[crypto.randomInt(alphabet.length)]).join('');
  } while (rooms.has(code));
  return code;
}

function cleanName(value) {
  const name = String(value || '玩家').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, 18);
  return name || '玩家';
}

function sendError(socket, message) {
  send(socket, { type: 'error', message });
}

function hashRoomPassword(password, salt) {
  return crypto.createHash('sha256').update(salt).update(password, 'utf8').digest();
}

const formats = { '1v1': [1, 1], '1v2': [1, 2], '2v2': [2, 2], '2v3': [2, 3], '3v3': [3, 3] };
function roomSummary(room) {
  return { code: room.code, name: room.name, format: room.format, maxPlayers: room.maxPlayers,
    players: room.clients.filter(Boolean).length, locked: room.locked, started: room.started };
}
function roomRoster(room) {
  return { type: 'roster', room: roomSummary(room), teamNames: room.teamNames, seats: room.clients.map((client, seat) => client ?
    { seat, name: room.names[seat], character: room.characters[seat], team: room.teams[seat] } : null) };
}
function broadcastRoster(room) { broadcast(room, roomRoster(room)); }
function broadcastList() {
  const list = [...rooms.values()].filter(room => !room.locked).map(roomSummary);
  for (const client of webSockets.clients) if (client.wantsList) send(client, { type: 'rooms', rooms: list });
}
function availableSeat(room) {
  for (const team of [0, 1]) {
    const wanted = formats[room.format][team];
    const current = room.clients.reduce((count, client, seat) => count + (client && room.teams[seat] === team ? 1 : 0), 0);
    if (current >= wanted) continue;
    const seat = room.clients.findIndex(client => !client);
    if (seat >= 0) { room.teams[seat] = team; return seat; }
  }
  return -1;
}

function leaveRoom(socket, disconnected = false) {
  const room = rooms.get(socket.roomCode);
  if (!room) return;
  if (room.clients[socket.seat] !== socket) return;
  room.clients[socket.seat] = null;
  if (socket.seat === 0) {
    if (disconnected) {
      room.started = false;
      room.hostDisconnectedAt = Date.now();
      broadcast(room, { type: 'playerLeft', message: '房主暂时离线，等待房主返回。' });
      broadcastRoster(room);
      socket.roomCode = null;
      socket.seat = null;
      broadcastList();
      return;
    }
    for (const client of room.clients) {
      if (client) {
        client.roomCode = null;
        client.seat = null;
        send(client, { type: 'playerLeft', message: '房主已离开，房间关闭。' });
      }
    }
    rooms.delete(room.code);
  } else {
    room.started = false;
    broadcast(room, { type: 'playerLeft', seat: socket.seat });
    broadcastRoster(room);
  }
  socket.roomCode = null;
  socket.seat = null;
  broadcastList();
}

function handleMessage(socket, data) {
  let message;
  try { message = JSON.parse(data.toString()); }
  catch { sendError(socket, '消息格式错误。'); return; }
  if (!message || typeof message.type !== 'string') { sendError(socket, '无效请求。'); return; }

  if (message.type === 'list') {
    socket.wantsList = true;
    send(socket, { type: 'rooms', rooms: [...rooms.values()].filter(room => !room.locked).map(roomSummary) });
    return;
  }

  if (message.type === 'create') {
    const password = message.password === undefined ? '' : message.password;
    if (typeof password !== 'string' || password.length > 64) { sendError(socket, '房间密码最多 64 个字符。'); return; }
    if (socket.roomCode) leaveRoom(socket);
    const code = makeCode();
    const passwordSalt = crypto.randomBytes(16);
    const format = formats[message.format] ? message.format : '1v1';
    const required = formats[format][0] + formats[format][1];
    const maxPlayers = required;
    const clients = Array(maxPlayers).fill(null), names = Array(maxPlayers).fill(''), characters = Array(maxPlayers).fill('pulse');
    const teams = Array.from({ length: maxPlayers }, (_, seat) => seat < formats[format][0] ? 0 : 1);
    clients[0] = socket; names[0] = cleanName(message.name); characters[0] = String(message.character || 'pulse').slice(0, 16);
    const hostToken = crypto.randomBytes(32).toString('hex');
    const room = { code, name: cleanName(message.roomName || `${names[0]}的房间`), format, maxPlayers, locked: Boolean(password), passwordSalt, passwordHash: hashRoomPassword(password, passwordSalt), hostToken, hostDisconnectedAt: 0, clients, names, characters, teams, teamNames: ['队伍 1', '队伍 2'], started: false, createdAt: Date.now() };
    rooms.set(code, room);
    socket.roomCode = code;
    socket.seat = 0;
    send(socket, { type: 'created', code, seat: 0, hostToken });
    broadcastRoster(room); broadcastList();
    return;
  }

  if (message.type === 'recover') {
    const code = String(message.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    const room = rooms.get(code);
    const token = String(message.hostToken || '');
    if (!room || !/^[a-f0-9]{64}$/.test(token) || !crypto.timingSafeEqual(Buffer.from(token, 'hex'), Buffer.from(room.hostToken, 'hex'))) {
      sendError(socket, '无法找回房间，可能已关闭或恢复凭证无效。'); return;
    }
    if (socket.roomCode && room.clients[socket.seat] === socket && socket.seat !== 0) leaveRoom(socket);
    else if (socket.roomCode && socket.roomCode !== code) leaveRoom(socket);
    const oldHost = room.clients[0];
    if (oldHost && oldHost !== socket) {
      oldHost.roomCode = null;
      oldHost.seat = null;
      send(oldHost, { type: 'playerLeft', message: '房主已在另一个页面返回。' });
    }
    room.clients[0] = socket;
    room.hostDisconnectedAt = 0;
    room.started = false;
    room.names[0] = cleanName(message.name || room.names[0]);
    socket.roomCode = code;
    socket.seat = 0;
    send(socket, { type: 'recovered', code, seat: 0, hostToken: room.hostToken });
    broadcastRoster(room); broadcastList();
    return;
  }

  if (message.type === 'join') {
    const code = String(message.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    const room = rooms.get(code);
    if (!room) { sendError(socket, '房间不存在或已关闭。'); return; }
    const password = message.password === undefined ? '' : message.password;
    if (typeof password !== 'string' || password.length > 64) { sendError(socket, '房间密码最多 64 个字符。'); return; }
    const passwordHash = hashRoomPassword(password, room.passwordSalt);
    if (!crypto.timingSafeEqual(passwordHash, room.passwordHash)) { sendError(socket, '房间密码错误。'); return; }
    // A player may retry after a delayed acknowledgement; treat joining the same room as success.
    if (socket.roomCode === code && room.clients[socket.seat] === socket) {
      send(socket, { type: 'joined', code, seat: socket.seat });
      return;
    }
    // Joining the room you host cannot create another player slot on the same connection.
    if (socket.roomCode === code && socket.seat === 0 && room.clients[0] === socket) {
      sendError(socket, '你是这个房间的房主，请让另一位玩家用另一台设备或另一个浏览器加入。');
      return;
    }
    if (socket.roomCode) leaveRoom(socket);
    if (room.started) { sendError(socket, '对战已开始，请等待下一局。'); return; }
    const seat = availableSeat(room);
    if (seat < 0) { sendError(socket, '房间已满。'); return; }
    room.clients[seat] = socket;
    room.names[seat] = cleanName(message.name);
    room.characters[seat] = String(message.character || 'ember').slice(0, 16);
    socket.roomCode = code;
    socket.seat = seat;
    send(socket, { type: 'joined', code, seat });
    broadcastRoster(room); broadcastList();
    return;
  }

  const room = rooms.get(socket.roomCode);
  if (!room || room.clients[socket.seat] !== socket) { sendError(socket, '请先创建或加入房间。'); return; }

  if (message.type === 'character') {
    if (room.started) return;
    room.characters[socket.seat] = String(message.character || 'pulse').slice(0, 16);
    broadcastRoster(room);
    return;
  }

  if (message.type === 'teamName') {
    if (socket.seat !== 0 || room.started) { sendError(socket, '只有房主能创建或命名队伍。'); return; }
    const team = Number(message.team);
    const name = String(message.name || '').trim().slice(0, 16);
    if (![0, 1].includes(team) || !name) { sendError(socket, '请选择队伍并输入名称。'); return; }
    room.teamNames[team] = name;
    broadcastRoster(room);
    return;
  }
  if (message.type === 'team') {
    if (room.started) { sendError(socket, '对战中不能换队。'); return; }
    const seat = socket.seat === 0 ? Number(message.seat) : socket.seat;
    const team = Number(message.team);
    if (!Number.isInteger(seat) || seat < 0 || seat >= room.maxPlayers || !room.clients[seat] || ![0, 1].includes(team)) { sendError(socket, '无法调整这位玩家的队伍。'); return; }
    if (room.teams[seat] === team) return;
    if (room.teams.reduce((count, value, index) => count + (room.clients[index] && value === team ? 1 : 0), 0) >= formats[room.format][team]) { sendError(socket, '目标队伍人数已满。'); return; }
    room.teams[seat] = team;
    broadcastRoster(room);
    return;
  }

  if (message.type === 'pause') {
    if (room.started && (message.state === 'paused' || message.state === 'playing')) for (const client of room.clients) if (client && client !== socket) send(client, { type: 'pause', state: message.state });
    return;
  }
  if (message.type === 'latencyPing') {
    send(socket, { type: 'latencyPong', sentAt: Number(message.sentAt) || 0 });
    return;
  }
  if (message.type === 'signal') {
    if (!room.started || !message.data || typeof message.data !== 'object') return;
    let signalSize;
    try { signalSize = Buffer.byteLength(JSON.stringify(message.data)); } catch { return; }
    if (signalSize > 8192) return;
    if (room.maxPlayers === 2) send(room.clients[1 - socket.seat], { type: 'signal', data: message.data });
    return;
  } else if (message.type === 'frameInputs') {
    if (!room.started || !Array.isArray(message.frames) || message.frames.length > 8) return;
    const frames = message.frames.filter(frame => Array.isArray(frame) && Number.isSafeInteger(frame[0]) && frame[0] >= 0 && Number.isInteger(frame[1]) && frame[1] >= 0 && frame[1] <= 255);
    if (frames.length) for (const client of room.clients) if (client && client !== socket) send(client, { type: 'frameInputs', seat: socket.seat, frames });
    return;
  }
  if (message.type === 'start') {
    if (socket.seat !== 0) { sendError(socket, '只有房主可以开始对战。'); return; }
    const required = formats[room.format][0] + formats[room.format][1];
    if (room.clients.slice(0, required).some(client => !client || client.readyState !== WebSocket.OPEN)) { sendError(socket, `需要 ${required} 位玩家全部加入。`); return; }
    if (room.teams.filter(team => team === 0).length !== formats[room.format][0] || room.teams.filter(team => team === 1).length !== formats[room.format][1]) { sendError(socket, '请先按组队模式分配好双方人数。'); return; }
    room.started = true;
    broadcast(room, { type: 'started', room: room.code, characters: room.characters.slice(0, required), names: room.names.slice(0, required), teams: room.teams.slice(0, required), format: room.format });
    broadcastList();
  } else if (message.type === 'input') {
    if (socket.seat !== 1 || !room.started) return;
    const allowed = new Set(['arrowleft', 'arrowright', 'arrowup', '1', '2', '3']);
    if (!allowed.has(message.key) || typeof message.down !== 'boolean') return;
    send(room.clients[0], { type: 'input', key: message.key, down: message.down });
  } else if (message.type === 'state') {
    if (socket.seat !== 0 || !room.started || !Array.isArray(message.fighters) || message.fighters.length !== 2) return;
    for (const client of room.clients) if (client && client !== socket) send(client, { type: 'state', fighters: message.fighters, time: Number(message.time), state: String(message.state) });
  } else if (message.type === 'matchover') {
    if (socket.seat !== 0 || !room.started) return;
    room.started = false;
    for (const client of room.clients) if (client && client !== socket) send(client, { type: 'matchover', winner: Number(message.winner) });
    broadcastList();
  } else if (message.type === 'rematch') {
    if (socket.seat !== 0) send(room.clients[0], { type: 'rematchRequest' });
  } else if (message.type === 'leave') leaveRoom(socket);
}

const server = http.createServer((request, response) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
  catch { response.writeHead(400); response.end('Bad request'); return; }
  if (pathname === '/health') {
    response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end('ok');
    return;
  }
  const requested = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const file = path.resolve(root, requested);
  if (!file.startsWith(root + path.sep)) { response.writeHead(403); response.end('Forbidden'); return; }
  const cached = staticCache.get(file);
  if (cached) { serveStatic(request, response, file, cached.contents); return; }
  fs.readFile(file, (error, contents) => {
    if (error) { response.writeHead(404); response.end('Not found'); return; }
    serveStatic(request, response, file, contents);
  });
});

const webSockets = new WebSocketServer({ noServer: true, maxPayload: 32768, perMessageDeflate: false });
server.on('upgrade', (request, socket, head) => {
  let pathname;
  try { pathname = new URL(request.url, 'http://localhost').pathname; }
  catch { socket.destroy(); return; }
  if (pathname !== '/ws') { socket.write('HTTP/1.1 404 Not Found\r\n\r\n'); socket.destroy(); return; }
  webSockets.handleUpgrade(request, socket, head, client => webSockets.emit('connection', client, request));
});

webSockets.on('connection', client => {
  client.roomCode = null;
  client.seat = null;
  client.on('message', data => handleMessage(client, data));
  client.on('close', () => leaveRoom(client, true));
  client.on('error', () => leaveRoom(client, true));
});

const heartbeat = setInterval(() => {
  for (const client of webSockets.clients) {
    if (client.isAlive === false) { client.terminate(); continue; }
    client.isAlive = false;
    client.ping();
  }
  for (const [code, room] of rooms) {
    if (room.hostDisconnectedAt && Date.now() - room.hostDisconnectedAt > 5 * 60_000) {
      for (const client of room.clients) if (client) { client.roomCode = null; client.seat = null; send(client, { type: 'playerLeft', message: '房主未返回，房间已关闭。' }); }
      rooms.delete(code);
    } else if (room.clients.every(client => !client) && Date.now() - room.createdAt > 60_000 && !room.hostDisconnectedAt) rooms.delete(code);
  }
  broadcastList();
}, 25_000);
webSockets.on('connection', client => {
  client.isAlive = true;
  client.on('pong', () => { client.isAlive = true; });
});

server.keepAliveTimeout = 65_000;
server.headersTimeout = 66_000;
server.listen(port, host, () => console.log(`Neon Brawl server listening on ${host}:${port}`));
server.on('close', () => clearInterval(heartbeat));
