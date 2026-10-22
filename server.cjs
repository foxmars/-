'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { EventEmitter } = require('node:events');

const root = path.join(__dirname, 'dist');
const port = Number(process.env.PORT || 8787);
const rooms = new Map();
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png' };
const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

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
        if (bigLength > 1_048_576n) { this.socket.destroy(); return; }
        length = Number(bigLength); offset = 10;
      }
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

function leaveRoom(socket) {
  const room = rooms.get(socket.roomCode);
  if (!room) return;
  room.clients[socket.seat] = null;
  if (socket.seat === 0) {
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
    const host = room.clients[0];
    if (host) send(host, { type: 'playerLeft' });
    if (!host) rooms.delete(room.code);
  }
  socket.roomCode = null;
  socket.seat = null;
}

function handleMessage(socket, data) {
  let message;
  try { message = JSON.parse(data.toString()); }
  catch { sendError(socket, '消息格式错误。'); return; }
  if (!message || typeof message.type !== 'string') { sendError(socket, '无效请求。'); return; }

  if (message.type === 'create') {
    const password = message.password === undefined ? '' : message.password;
    if (typeof password !== 'string' || password.length > 64) { sendError(socket, '房间密码最多 64 个字符。'); return; }
    if (socket.roomCode) leaveRoom(socket);
    const code = makeCode();
    const passwordSalt = crypto.randomBytes(16);
    const room = { code, passwordSalt, passwordHash: hashRoomPassword(password, passwordSalt), clients: [socket, null], names: [cleanName(message.name), ''], characters: [String(message.character || 'pulse').slice(0, 16), 'ember'], started: false, createdAt: Date.now() };
    rooms.set(code, room);
    socket.roomCode = code;
    socket.seat = 0;
    send(socket, { type: 'created', code, seat: 0 });
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
    if (socket.roomCode === code && socket.seat === 1 && room.clients[1] === socket) {
      send(socket, { type: 'joined', code, seat: 1 });
      return;
    }
    // Joining the room you host cannot create another player slot on the same connection.
    if (socket.roomCode === code && socket.seat === 0 && room.clients[0] === socket) {
      sendError(socket, '你是这个房间的房主，请让另一位玩家用另一台设备或另一个浏览器加入。');
      return;
    }
    if (socket.roomCode) leaveRoom(socket);
    const guest = room.clients[1];
    if (guest && guest !== socket && guest.readyState === WebSocket.OPEN) { sendError(socket, '房间已满（已有另一位玩家加入）。'); return; }
    room.clients[1] = socket;
    room.names[1] = cleanName(message.name);
    room.characters[1] = String(message.character || 'ember').slice(0, 16);
    socket.roomCode = code;
    socket.seat = 1;
    send(socket, { type: 'joined', code, seat: 1 });
    send(room.clients[0], { type: 'playerJoined', name: room.names[1], character: room.characters[1] });
    return;
  }

  const room = rooms.get(socket.roomCode);
  if (!room || room.clients[socket.seat] !== socket) { sendError(socket, '请先创建或加入房间。'); return; }

  if (message.type === 'pause') {
    if (room.started && (message.state === 'paused' || message.state === 'playing')) send(room.clients[1 - socket.seat], { type: 'pause', state: message.state });
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
    send(room.clients[1 - socket.seat], { type: 'signal', data: message.data });
    return;
  } else if (message.type === 'frameInputs') {
    if (!room.started || !Array.isArray(message.frames) || message.frames.length > 8) return;
    const frames = message.frames.filter(frame => Array.isArray(frame) && Number.isSafeInteger(frame[0]) && frame[0] >= 0 && Number.isInteger(frame[1]) && frame[1] >= 0 && frame[1] <= 127);
    if (frames.length) send(room.clients[1 - socket.seat], { type: 'frameInputs', frames });
    return;
  }
  if (message.type === 'start') {
    if (socket.seat !== 0) { sendError(socket, '只有房主可以开始对战。'); return; }
    if (!room.clients[1] || room.clients[1].readyState !== WebSocket.OPEN) { sendError(socket, '等待另一位玩家加入后再开始。'); return; }
    room.started = true;
    broadcast(room, { type: 'started', room: room.code, characters: room.characters, names: room.names });
  } else if (message.type === 'input') {
    if (socket.seat !== 1 || !room.started) return;
    const allowed = new Set(['arrowleft', 'arrowright', 'arrowup', '1', '2', '3']);
    if (!allowed.has(message.key) || typeof message.down !== 'boolean') return;
    send(room.clients[0], { type: 'input', key: message.key, down: message.down });
  } else if (message.type === 'state') {
    if (socket.seat !== 0 || !room.started || !Array.isArray(message.fighters) || message.fighters.length !== 2) return;
    send(room.clients[1], { type: 'state', fighters: message.fighters, time: Number(message.time), state: String(message.state) });
  } else if (message.type === 'matchover') {
    if (socket.seat !== 0 || !room.started) return;
    room.started = false;
    send(room.clients[1], { type: 'matchover', winner: Number(message.winner) });
  } else if (message.type === 'rematch') {
    if (socket.seat === 1) send(room.clients[0], { type: 'rematchRequest' });
  } else if (message.type === 'leave') leaveRoom(socket);
}

const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  if (pathname === '/health') {
    response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end('ok');
    return;
  }
  const requested = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const file = path.resolve(root, requested);
  if (!file.startsWith(root + path.sep)) { response.writeHead(403); response.end('Forbidden'); return; }
  fs.readFile(file, (error, contents) => {
    if (error) { response.writeHead(404); response.end('Not found'); return; }
    response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
    response.end(contents);
  });
});

const webSockets = new WebSocketServer({ noServer: true, maxPayload: 32768, perMessageDeflate: false });
server.on('upgrade', (request, socket, head) => {
  if (new URL(request.url, 'http://localhost').pathname !== '/ws') { socket.write('HTTP/1.1 404 Not Found\r\n\r\n'); socket.destroy(); return; }
  webSockets.handleUpgrade(request, socket, head, client => webSockets.emit('connection', client, request));
});

webSockets.on('connection', client => {
  client.roomCode = null;
  client.seat = null;
  client.on('message', data => handleMessage(client, data));
  client.on('close', () => leaveRoom(client));
  client.on('error', () => leaveRoom(client));
});

const heartbeat = setInterval(() => {
  for (const client of webSockets.clients) {
    if (client.isAlive === false) { client.terminate(); continue; }
    client.isAlive = false;
    client.ping();
  }
  for (const [code, room] of rooms) {
    if (!room.clients[0] && !room.clients[1] && Date.now() - room.createdAt > 60_000) rooms.delete(code);
  }
}, 25_000);
webSockets.on('connection', client => {
  client.isAlive = true;
  client.on('pong', () => { client.isAlive = true; });
});

server.keepAliveTimeout = 65_000;
server.headersTimeout = 66_000;
server.listen(port, '0.0.0.0', () => console.log(`Neon Brawl server listening on ${port}`));
server.on('close', () => clearInterval(heartbeat));
