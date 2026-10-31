'use strict';

// Online rooms simulate identical frame-numbered inputs on both players.
const originalStart = start;
const originalControls = controls;
const originalUpdate = update;
const originalFinish = finish;
const originalPause = pause;
// A short jitter buffer smooths normal packet variation without adding a
// large amount of fighting-game input latency.
const INPUT_DELAY = 6;
const onlineState = {
  socket: null,
  role: null,
  room: '',
  seat: 0,
  roster: null,
  teams: [0, 1],
  remoteBySeat: [],
  opponentCharacter: 'ember',
  hudAt: 0,
  characters: null,
  pc: null,
  dataChannel: null,
  pendingIce: [],
  localInputs: new Map(),
  remoteInputs: new Map(),
  inputHistory: [],
  captureFrame: 0,
  simFrame: 0,
  currentInputs: [0,0],
  latencyMs: null,
  inputDelay: INPUT_DELAY,
  targetInputDelay: INPUT_DELAY,
  lastScheduledFrame: INPUT_DELAY - 1,
  lastDelayAdjust: 0,
  lastRelayedFrame: -1,
  queuedButtons: 0
};
const onlineEl = selector => document.querySelector(selector);
const defaultServerAddress = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
const savedServer = localStorage.getItem('neon-brawl-server');
onlineEl('#server-url').value = savedServer || defaultServerAddress;
const hostRoomStorageKey = 'neon-brawl-host-room';
function savedHostRoom() {
  try {
    const saved = JSON.parse(localStorage.getItem(hostRoomStorageKey) || 'null');
    return saved?.code && /^[a-f0-9]{64}$/.test(saved.hostToken) ? saved : null;
  } catch { return null; }
}
function updateRecoverButton() {
  const saved = savedHostRoom();
  const button = onlineEl('#room-recover');
  button.hidden = !saved || onlineState.role === 'host';
  if (saved) button.textContent = `返回我的服务器 · ${saved.code}`;
}

function setRoomStatus(message, error = false) {
  const status = onlineEl('#room-status');
  status.textContent = message;
  status.style.color = error ? '#ff8d9e' : '#8ddfff';
  const badge = onlineEl('#network-status');
  badge.textContent = message;
  badge.title = message;
  badge.hidden = $('#mode').value !== 'online' || state !== 'playing';
}

function sendRoomMessage(message) {
  if (onlineState.socket?.readyState === WebSocket.OPEN) {
    onlineState.socket.send(JSON.stringify(message));
  }
}

function receiveFrameInputs(frames) {
  if (!Array.isArray(frames)) return;
  for (const pair of frames) {
    if (!Array.isArray(pair) || !Number.isSafeInteger(pair[0]) || !Number.isInteger(pair[1])) continue;
    if (pair[0] >= onlineState.simFrame - 2 && pair[0] <= onlineState.captureFrame + 120) {
      const bits = pair[1] & 255;
      onlineState.remoteInputs.set(pair[0], bits);
    }
  }
}
function receiveSeatInputs(seat, frames) {
  if (!Number.isInteger(seat) || seat === onlineState.seat || !Array.isArray(frames)) return;
  const buffer = onlineState.remoteBySeat[seat];
  if (!buffer) return;
  for (const [frame, bits] of frames) if (Number.isSafeInteger(frame) && frame >= onlineState.simFrame - 2 && frame <= onlineState.captureFrame + 120 && Number.isInteger(bits)) buffer.set(frame, bits & 255);
}
function onlineRoomSize() { return onlineState.characters?.length || 2; }
function frameInputPacket(frames) {
  const channel = onlineState.dataChannel;
  // Unordered, unreliable datagrams avoid waiting behind stale inputs.
  if (channel?.readyState === 'open' && channel.bufferedAmount < 4096) channel.send(JSON.stringify(frames));
  // Relay each new frame in parallel. If the direct path silently drops a
  // packet, the reliable WebSocket copy prevents lockstep from stalling.
  const fresh = frames.filter(([frame]) => frame > onlineState.lastRelayedFrame);
  if (fresh.length && onlineState.socket?.readyState === WebSocket.OPEN) {
    sendRoomMessage({ type: 'frameInputs', frames: fresh });
    onlineState.lastRelayedFrame = fresh[fresh.length - 1][0];
  }
}
function adaptInputDelay(rttMs) {
  if (!Number.isFinite(rttMs)) return;
  // RTT covers both directions, so reserve half an RTT plus two jitter frames.
  const wanted = Math.max(4, Math.min(12, Math.ceil(rttMs / (2000 / 60)) + 2));
  const now = Date.now();
  if (wanted > onlineState.inputDelay) {
    onlineState.inputDelay = wanted;
    onlineState.targetInputDelay = wanted;
    onlineState.lastDelayAdjust = now;
  } else if (wanted <= onlineState.inputDelay - 2 && now - onlineState.lastDelayAdjust > 12_000) {
    // Lowering the delay mid-round would retime already queued inputs. Apply
    // reductions at the next round reset instead.
    onlineState.targetInputDelay = wanted;
    onlineState.lastDelayAdjust = now;
  }
}
function bindDataChannel(channel) {
  onlineState.dataChannel = channel;
  channel.onmessage = event => { try { receiveFrameInputs(JSON.parse(event.data)); } catch {} };
  channel.onopen = () => setRoomStatus(`玩家直连已建立（通常走 UDP），同步缓冲 ${onlineState.inputDelay} 帧。`);
  channel.onclose = () => { if (onlineState.dataChannel === channel) onlineState.dataChannel = null; };
  channel.onerror = () => setRoomStatus('直连不稳定，正在通过服务器同步。', true);
}
async function processSignal(data) {
  const pc = onlineState.pc;
  if (!pc || !data) return;
  try {
    if (data.description) {
      await pc.setRemoteDescription(data.description);
      for (const candidate of onlineState.pendingIce.splice(0)) await pc.addIceCandidate(candidate);
      if (data.description.type === 'offer') {
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendRoomMessage({ type: 'signal', data: { description: pc.localDescription } });
      }
    } else if (data.candidate) {
      if (pc.remoteDescription) await pc.addIceCandidate(data.candidate);
      else onlineState.pendingIce.push(data.candidate);
    }
  } catch { setRoomStatus('正在切换到服务器转发连接…', true); }
}
async function startPeerConnection() {
  onlineState.pc?.close();
  onlineState.dataChannel = null;
  onlineState.pendingIce = [];
  if (!('RTCPeerConnection' in window)) { setRoomStatus('当前浏览器不支持 UDP 直连，使用服务器帧同步。'); return; }
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    iceCandidatePoolSize: 4
  });
  onlineState.pc = pc;
  pc.onicecandidate = event => { if (event.candidate) sendRoomMessage({ type: 'signal', data: { candidate: event.candidate } }); };
  pc.ondatachannel = event => bindDataChannel(event.channel);
  pc.onconnectionstatechange = () => {
    if (pc.connectionState === 'failed' || pc.connectionState === 'closed') setRoomStatus('UDP 直连不可用，使用服务器帧同步。');
  };
  if (onlineState.role === 'host') {
    bindDataChannel(pc.createDataChannel('frame-inputs', { ordered: false, maxRetransmits: 0 }));
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    sendRoomMessage({ type: 'signal', data: { description: pc.localDescription } });
  }
}
function captureInputBits() {
  const move = Number(keys.has(keybinds.right)) - Number(keys.has(keybinds.left));
  return (move < 0 ? 1 : move > 0 ? 2 : 0)
    | (pressed.has(keybinds.jump) ? 4 : 0)
    | (pressed.has('mouseattack') || pressed.has(keybinds.attack) ? 8 : 0)
    | (pressed.has('mouseheavy') || pressed.has(keybinds.heavy) ? 16 : 0)
    | (keys.has(keybinds.shield) ? 32 : 0)
    | (keys.has(keybinds.down) ? 64 : 0)
    | (pressed.has(keybinds.ultimate) ? 128 : 0);
}
function decodeInputBits(bits) {
  return { move: (bits & 3) === 1 ? -1 : (bits & 3) === 2 ? 1 : 0, j: !!(bits & 4), a: !!(bits & 24), h: !!(bits & 16), b: !!(bits & 32), down: !!(bits & 64), ult: !!(bits & 128) };
}
function resetFrameSync() {
  onlineState.inputDelay = onlineState.targetInputDelay;
  onlineState.localInputs.clear(); onlineState.remoteInputs.clear(); onlineState.inputHistory = [];
  onlineState.captureFrame = 0; onlineState.simFrame = 0; onlineState.currentInputs = [0,0];
  onlineState.latencyMs = null;
  onlineState.lastScheduledFrame = onlineState.inputDelay - 1;
  onlineState.lastRelayedFrame = -1;
  onlineState.queuedButtons = 0;
  for (let frame = 0; frame < onlineState.inputDelay; frame++) { onlineState.localInputs.set(frame, 0); onlineState.remoteInputs.set(frame, 0); }
  onlineState.remoteBySeat = Array.from({ length: onlineRoomSize() }, (_, seat) => seat === onlineState.seat ? null : new Map());
  for (const buffer of onlineState.remoteBySeat) if (buffer) for (let frame = 0; frame < onlineState.inputDelay; frame++) buffer.set(frame, 0);
}
function showOnlineTab(tab) {
  onlineEl('#rooms-view').hidden = tab !== 'rooms';
  onlineEl('#create-view').hidden = tab !== 'create';
  onlineEl('#room-lobby').hidden = tab !== 'lobby';
  onlineEl('#rooms-tab').classList.toggle('selected', tab === 'rooms');
  onlineEl('#create-tab').classList.toggle('selected', tab === 'create');
}
function renderRooms(rooms) {
  const list = onlineEl('#rooms-list');
  list.replaceChildren();
  if (!rooms.length) { list.textContent = '暂无公开服务器。'; return; }
  for (const room of rooms) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'room-item';
    const title = document.createElement('strong'), meta = document.createElement('span');
    title.textContent = room.name; meta.textContent = `${room.format.replace('v', ' vs ')} · ${room.players}/${room.maxPlayers} 人${room.started ? ' · 对战中' : ''}`;
    button.append(title, meta); button.disabled = room.started || room.players >= room.maxPlayers;
    button.onclick = () => { onlineEl('#room-code').value = room.code; onlineEl('#room-password').value = ''; openRoomSocket('join', room.code); };
    list.append(button);
  }
}
function renderRoster(message) {
  onlineState.roster = message;
  const room = message.room, seats = message.seats || [], list = onlineEl('#room-roster');
  onlineEl('#lobby-title').textContent = `${room.name} · ${room.format.replace('v', ' vs ')}`;
  onlineEl('#lobby-count').textContent = `${room.players}/${room.maxPlayers} 人 · ${room.code}`;
  list.replaceChildren();
  seats.forEach((player, seat) => {
    const item = document.createElement('div'); item.className = 'room-seat';
    const team = seat < Number(room.format[0]) ? 1 : 2;
    item.textContent = `队伍 ${team} · ${player ? `${player.name} / ${characters[player.character]?.name || '斗士'}` : '等待加入…'}`;
    if (seat === onlineState.seat) item.classList.add('you');
    list.append(item);
  });
  const ready = seats.every(Boolean);
  onlineEl('#room-start').hidden = onlineState.role !== 'host';
  onlineEl('#room-start').disabled = !ready;
  onlineEl('#room-start').textContent = ready ? '开始对战' : `等待玩家 ${room.players}/${room.maxPlayers}`;
}
function enterOnlineMode() {
  if (state === 'playing') return;
  onlineEl('.character-select').hidden = true;
  onlineEl('.selection-layout').hidden = true;
  onlineEl('.stats-layout').hidden = true;
  onlineEl('#online-panel').hidden = false;
  onlineEl('#overlay').hidden = false;
  onlineEl('#overlay .eyebrow').textContent = '在线服务器';
  onlineEl('#overlay h1').textContent = '服务器列表';
  onlineEl('#overlay p').textContent = '帧同步对战，优先 UDP 直连；网络受限时自动通过服务器转发。';
  onlineEl('#start').hidden = true;
  onlineEl('#localhelp').hidden = true;
  onlineEl('#mode').disabled = false;
  onlineState.role = null;
  onlineState.room = '';
  showOnlineTab('rooms');
  updateRecoverButton();
  connectRoomSocket();
}

function returnToModeMenu() {
  if (state === 'playing' && $('#mode').value === 'online') return;
  onlineEl('#online-panel').hidden = true;
  onlineEl('.character-select').hidden = false;
  onlineEl('.selection-layout').hidden = false;
  onlineEl('.stats-layout').hidden = false;
  onlineEl('#overlay').hidden = false;
  onlineEl('#overlay .eyebrow').textContent = '准备登场 · 选择角色';
  onlineEl('#overlay h1').textContent = '挑选你的斗士';
  onlineEl('#overlay p').textContent = '每位斗士拥有独特外观与专属招式手感。';
  onlineEl('#start').hidden = false;
  onlineEl('#start').innerHTML = '开始对战 <span>ENTER</span>';
  onlineEl('#start').onclick = () => state === 'paused' ? pause() : start();
  onlineEl('#p2label').textContent = $('#mode').value === 'cpu' ? '02 / 电脑' : '02 / 玩家';
  onlineEl('#localhelp').hidden = $('#mode').value !== 'local';
}

function openRoomSocket(action, code = '') {
  if (onlineState.socket && onlineState.socket.readyState === WebSocket.OPEN) {
    sendRoomMessage(roomRequest(action, code));
    return;
  }
  connectRoomSocket(() => sendRoomMessage(roomRequest(action, code)));
}
function roomRequest(action, code) {
  return { type: action, code, hostToken: action === 'recover' ? savedHostRoom()?.hostToken : undefined, name: onlineEl('#player-name').value.trim(), roomName: onlineEl('#room-name').value.trim(), format: onlineEl('#room-format').value, maxPlayers: Number(onlineEl('#room-capacity').value), character: selectedCharacter, password: onlineEl('#room-password').value };
}
function connectRoomSocket(onOpen) {
  if (onlineState.socket?.readyState === WebSocket.OPEN) { sendRoomMessage({ type: 'list' }); onOpen?.(); return; }
  if (onlineState.socket?.readyState === WebSocket.CONNECTING) {
    if (onOpen) onlineState.socket.addEventListener('open', onOpen, { once: true });
    return;
  }
  const address = onlineEl('#server-url').value.trim();
  if (!/^wss?:\/\//i.test(address)) {
    setRoomStatus('服务器地址必须以 ws:// 或 wss:// 开头。', true);
    return;
  }
  if (location.protocol === 'https:' && /^ws:\/\//i.test(address)) {
    setRoomStatus('当前网站使用 HTTPS，请填写服务器提供的 wss:// 安全地址。', true);
    return;
  }
  localStorage.setItem('neon-brawl-server', address);
  setRoomStatus('正在连接服务器…');
  let socket;
  try { socket = new WebSocket(address); }
  catch { setRoomStatus('服务器地址无效，无法连接。', true); return; }
  onlineState.socket = socket;
  socket.addEventListener('open', () => { sendRoomMessage({ type: 'list' }); onOpen?.(); setRoomStatus('已连接服务器。'); });
  socket.addEventListener('message', event => {
    let message;
    try { message = JSON.parse(event.data); } catch { return; }
    if (message.type === 'rooms') {
      renderRooms(message.rooms || []);
    } else if (message.type === 'roster') {
      renderRoster(message);
    } else if (message.type === 'created') {
      localStorage.setItem(hostRoomStorageKey, JSON.stringify({ code: message.code, hostToken: message.hostToken, server: onlineEl('#server-url').value.trim() }));
      onlineState.role = 'host';
      onlineState.seat = 0;
      onlineState.room = message.code;
      showOnlineTab('lobby');
      setRoomStatus(`房间 ${message.code} 已创建，等待玩家加入。`);
      onlineEl('#room-code').value = message.code;
      updateRecoverButton();
    } else if (message.type === 'recovered') {
      onlineState.role = 'host';
      onlineState.seat = 0;
      onlineState.room = message.code;
      showOnlineTab('lobby');
      setRoomStatus(`已返回房间 ${message.code}，可以继续等待或开始对战。`);
      onlineEl('#room-code').value = message.code;
      updateRecoverButton();
    } else if (message.type === 'joined') {
      onlineState.role = 'guest';
      onlineState.seat = message.seat;
      onlineState.room = message.code;
      showOnlineTab('lobby');
      setRoomStatus(`已加入房间 ${message.code}，等待房主开始。`);
      onlineEl('#start').hidden = true;
    } else if (message.type === 'playerJoined') {
      onlineState.opponentCharacter = characters[message.character] ? message.character : 'ember';
      setRoomStatus('玩家已加入。房主可以开始对战。');
      if (onlineState.role === 'host') {
        onlineEl('#start').hidden = false;
        onlineEl('#start').disabled = false;
        onlineEl('#start').textContent = '开始对战';
        onlineEl('#start').onclick = () => sendRoomMessage({ type: 'start' });
      }
    } else if (message.type === 'playerLeft') {
      state = 'ready';
      $('#mode').disabled = false;
      onlineEl('#overlay').hidden = false;
      showOnlineTab('lobby');
      setRoomStatus(message.message || '有玩家离开，对战已结束。等待新玩家加入。', true);
    } else if (message.type === 'rematchRequest' && onlineState.role === 'host') {
      setRoomStatus('对手想再来一局。确认后开始新一局。');
      onlineEl('#start').hidden = false;
      onlineEl('#start').disabled = false;
      onlineEl('#start').textContent = '开始下一局';
      onlineEl('#start').onclick = () => sendRoomMessage({ type: 'start' });
    } else if (message.type === 'started') {
      state = 'ready';
      onlineEl('#mode').value = 'online';
      onlineState.characters = (message.characters || ['pulse','ember']).map((id, index) => characters[id] ? id : (index ? 'ember' : 'pulse'));
      onlineState.teams = message.teams || [0, 1];
      start();
      if (onlineRoomSize() === 2) startPeerConnection().catch(() => setRoomStatus('UDP 直连建立失败，正在通过服务器帧同步。', true));
      else setRoomStatus(`${message.format.replace('v', ' vs ')} 对战开始 · ${onlineRoomSize()} 人`);

    } else if (message.type === 'frameInputs' && (onlineState.role === 'host' || onlineState.role === 'guest')) {
      if (onlineRoomSize() > 2) receiveSeatInputs(message.seat, message.frames);
      else receiveFrameInputs(message.frames);
    } else if (message.type === 'latencyPong' && Number.isFinite(message.sentAt)) {
      const rtt = Date.now() - message.sentAt;
      if (rtt >= 0 && rtt < 5000 && onlineState.dataChannel?.readyState !== 'open') {
        onlineState.latencyMs = rtt;
        adaptInputDelay(rtt);
        if ($('#mode').value === 'online' && state === 'playing') setRoomStatus(`服务器转发 · 往返约 ${rtt} ms · 缓冲 ${onlineState.inputDelay} 帧`);
      }
    } else if (message.type === 'signal') {
      processSignal(message.data);
    } else if (message.type === 'pause' && (onlineState.role === 'host' || onlineState.role === 'guest')) {
      if (message.state === 'paused' && state === 'playing') originalPause();
      else if (message.state === 'playing' && state === 'paused') originalPause();
    } else if (message.type === 'matchover' && onlineState.role === 'guest') {
      if (state !== 'over') finish(message.winner);
      onlineEl('#start').hidden = false;
      onlineEl('#start').onclick = () => start();
    } else if (message.type === 'error') {
      if (message.message?.startsWith('无法找回房间')) { localStorage.removeItem(hostRoomStorageKey); updateRecoverButton(); }
      setRoomStatus(message.message, true);
    }
  });
  socket.addEventListener('close', () => {
    if (onlineState.socket === socket) {
      onlineState.pc?.close(); onlineState.pc = null; onlineState.dataChannel = null;
      onlineState.socket = null;
      onlineState.role = null;
      updateRecoverButton();
      if ($('#mode').value === 'online') {
        if (state === 'playing' || state === 'paused') { state = 'ready'; $('#mode').disabled = false; onlineEl('#overlay').hidden = false; }
        showOnlineTab('rooms');
        setRoomStatus('与服务器的连接已断开，请刷新列表重连。', true);
      }
    }
  });
  socket.addEventListener('error', () => setRoomStatus('连接失败。请检查服务器地址和服务器是否在线。', true));
}

pause = function onlinePause() {
  if ($('#mode').value === 'online' && (onlineState.role === 'host' || onlineState.role === 'guest') && (state === 'playing' || state === 'paused')) {
    const next = state === 'playing' ? 'paused' : 'playing';
    originalPause();
    sendRoomMessage({ type: 'pause', state: next });
    return;
  }
  originalPause();
};
onlineEl('#pause').onclick = () => pause();

start = function onlineStart() {
  if ($('#mode').value !== 'online') return originalStart();
  if (onlineState.role === 'guest' && state === 'over') { sendRoomMessage({ type: 'rematch' }); setRoomStatus('已向房主申请再来一局。'); return; }
  if (onlineState.role !== 'host' && onlineState.role !== 'guest') return;
  originalStart();
  const chars = (onlineState.characters || (onlineState.role === 'host' ? [selectedCharacter, onlineState.opponentCharacter] : [onlineState.opponentCharacter, selectedCharacter])).map((id, index) => characters[id] ? id : (index ? 'ember' : 'pulse'));
  const slots = [0, 0];
  fighters = chars.map((character, seat) => {
    const team = onlineState.teams[seat] ?? (seat ? 1 : 0);
    return fighter(seat, character, team, slots[team]++);
  });
  resetFrameSync();
  if (onlineRoomSize() > 2) onlineTeamHud(); else hud();
  setRoomStatus('正在建立玩家直连…');
};
function onlineTeamHud() {
  for (const team of [0, 1]) {
    const members = fighters.filter(p => p.team === team);
    const alive = members.filter(p => p.lives > 0).length;
    syncFighterColor(team, members[0]?.character || 'pulse');
    onlineEl(`#p${team + 1}label`).textContent = `队伍 ${team + 1} · ${alive}/${members.length}`;
    onlineEl(`#name${team}`).textContent = members.map(p => characters[p.character]?.name || '斗士').join(' · ');
    onlineEl(`#d${team}`).innerHTML = `${Math.round(members.reduce((sum, p) => sum + p.dmg, 0))}<span>%</span>`;
    onlineEl(`#s${team}`).textContent = `${members.reduce((sum, p) => sum + Math.max(0, p.lives), 0)} 命`;
  }
  onlineEl('#timer').textContent = Math.floor(time / 60).toString().padStart(2, '0') + ':' + Math.ceil(time % 60).toString().padStart(2, '0');
}
const originalHud = hud;
hud = function onlineHud() { if ($('#mode').value === 'online' && onlineRoomSize() > 2 && fighters.length > 2) onlineTeamHud(); else originalHud(); };
controls = function onlineControls(p) {
  if ($('#mode').value !== 'online' || !onlineState.currentInputs) return originalControls(p);
  return decodeInputBits(onlineState.currentInputs[p.i] || 0);
};

update = function onlineUpdate() {
  if ($('#mode').value !== 'online' || (onlineState.role !== 'host' && onlineState.role !== 'guest') || state !== 'playing') {
    originalUpdate();
    return;
  }
  // A missing packet must not let captured inputs run ever farther ahead of
  // simulation. Keep a small queue and retain one-shot buttons while waiting.
  if (onlineState.captureFrame - onlineState.simFrame < onlineState.inputDelay + 3) {
    const capturedFrame = onlineState.captureFrame++;
    const frame = capturedFrame + onlineState.inputDelay;
    const bits = captureInputBits() | onlineState.queuedButtons;
    onlineState.queuedButtons = 0;
    // If the latency buffer grows during a round, fill the newly opened frame
    // numbers with held movement/shield state so lockstep never waits on a gap.
    const heldBits = (onlineState.localInputs.get(onlineState.lastScheduledFrame) || 0) & 99;
    for (let skipped = onlineState.lastScheduledFrame + 1; skipped < frame; skipped++) {
      onlineState.localInputs.set(skipped, heldBits);
      onlineState.inputHistory.push([skipped, heldBits]);
    }
    onlineState.localInputs.set(frame, bits);
    onlineState.inputHistory.push([frame, bits]);
    onlineState.lastScheduledFrame = frame;
    // Retain every input in the bounded backlog for direct-channel recovery.
    if (onlineState.inputHistory.length > 24) onlineState.inputHistory.splice(0, onlineState.inputHistory.length - 24);
  } else {
    onlineState.queuedButtons |= captureInputBits() & 156;
  }
  frameInputPacket(onlineState.inputHistory);
  pressed.clear();
  // After a stall, simulate at most three ready frames per display tick to
  // drain the backlog without making one render frame expensive.
  for (let step = 0; step < 3; step++) {
    const simFrame = onlineState.simFrame;
    if (!onlineState.localInputs.has(simFrame)) break;
    if (onlineRoomSize() > 2) {
      if (onlineState.remoteBySeat.some(buffer => buffer && !buffer.has(simFrame))) break;
      onlineState.currentInputs = onlineState.remoteBySeat.map((buffer, seat) => seat === onlineState.seat ? onlineState.localInputs.get(simFrame) : buffer.get(simFrame));
    } else {
      if (!onlineState.remoteInputs.has(simFrame)) break;
      const local = onlineState.localInputs.get(simFrame), remote = onlineState.remoteInputs.get(simFrame);
      onlineState.currentInputs = onlineState.role === 'host' ? [local, remote] : [remote, local];
    }
    const wasInHitstop = hitstop > 0;
    originalUpdate();
    // Hitstop lasts real display ticks, not accelerated catch-up steps.
    if (wasInHitstop) break;
    onlineState.simFrame++;
    if (hitstop > 0 || state !== 'playing') break;
    if (onlineState.captureFrame - onlineState.simFrame <= 1) break;
  }
  for (const old of onlineState.localInputs.keys()) if (old < onlineState.simFrame - 2) onlineState.localInputs.delete(old);
  for (const old of onlineState.remoteInputs.keys()) if (old < onlineState.simFrame - 2) onlineState.remoteInputs.delete(old);
  for (const buffer of onlineState.remoteBySeat) if (buffer) for (const old of buffer.keys()) if (old < onlineState.simFrame - 2) buffer.delete(old);
};
finish = function onlineFinish(winner) {
  if (state === 'over') return;
  originalFinish(winner);
  if ($('#mode').value === 'online' && onlineState.role === 'host') sendRoomMessage({ type: 'matchover', winner });
};

onlineEl('#mode').addEventListener('change', () => {
  if ($('#mode').value === 'online') enterOnlineMode();
  else {
    if (onlineState.socket) onlineState.socket.close();
    onlineState.pc?.close(); onlineState.pc = null; onlineState.dataChannel = null;
    onlineState.socket = null;
    onlineState.role = null;
    returnToModeMenu();
  }
});
if ($('#mode').value === 'online') enterOnlineMode();

// Show connection quality without making HUD DOM updates every simulation tick.
setInterval(() => {
  if ($('#mode').value === 'online' && onlineState.socket?.readyState === WebSocket.OPEN && onlineState.role && onlineState.dataChannel?.readyState !== 'open') {
    sendRoomMessage({ type: 'latencyPing', sentAt: Date.now() });
  }
}, 3000);
setInterval(() => {
  if ($('#mode').value !== 'online' || !onlineState.pc) return;
  const pc = onlineState.pc;
  pc.getStats().then(stats => {
    let pair = null;
    stats.forEach(report => {
      if (report.type === 'candidate-pair' && report.state === 'succeeded' && (report.nominated || report.selected) && Number.isFinite(report.currentRoundTripTime)) pair = report;
    });
    if (pair) {
      const rtt = Math.round(pair.currentRoundTripTime * 1000);
      onlineState.latencyMs = rtt;
      const local = stats.get(pair.localCandidateId), remote = stats.get(pair.remoteCandidateId);
      const viaRelay = local?.candidateType === 'relay' || remote?.candidateType === 'relay';
      adaptInputDelay(rtt);
      const path = viaRelay ? '经 TURN 中继' : '玩家直连';
      setRoomStatus(`${path} · WebRTC 往返约 ${rtt} ms · 缓冲 ${onlineState.inputDelay} 帧${rtt > 120 ? '，链路延迟偏高' : ''}`);
    }
  }).catch(() => {});
}, 3000);
onlineEl('#room-create').addEventListener('click', () => openRoomSocket('create'));
onlineEl('#room-recover').addEventListener('click', () => {
  const saved = savedHostRoom();
  if (!saved) { updateRecoverButton(); return; }
  onlineEl('#server-url').value = saved.server || defaultServerAddress;
  openRoomSocket('recover', saved.code);
});
onlineEl('#rooms-tab').onclick = () => { showOnlineTab('rooms'); sendRoomMessage({ type: 'list' }); };
onlineEl('#create-tab').onclick = () => showOnlineTab('create');
onlineEl('#rooms-refresh').onclick = () => { connectRoomSocket(); sendRoomMessage({ type: 'list' }); };
onlineEl('#room-start').onclick = () => sendRoomMessage({ type: 'start' });
const capacityFormats = { 2: '1v1', 3: '1v2', 4: '2v2', 5: '2v3', 6: '3v3' };
onlineEl('#room-capacity').onchange = () => { onlineEl('#room-format').value = capacityFormats[onlineEl('#room-capacity').value]; };
onlineEl('#room-format').onchange = () => { onlineEl('#room-capacity').value = String(onlineEl('#room-format').value.split('v').reduce((sum, n) => sum + Number(n), 0)); };
const onlineCharacterList = onlineEl('#online-characters');
for (const [id, role] of Object.entries(characters)) {
  const button = document.createElement('button'); button.type = 'button'; button.dataset.character = id;
  button.textContent = role.name; button.onclick = () => {
    selectedCharacter = id;
    for (const choice of onlineCharacterList.children) choice.classList.toggle('selected', choice === button);
    document.querySelectorAll('.character-select [data-character]').forEach(card => { const chosen = card.dataset.character === id; card.classList.toggle('selected', chosen); card.setAttribute('aria-pressed', String(chosen)); });
    sendRoomMessage({ type: 'character', character: id });
  };
  onlineCharacterList.append(button);
}
onlineCharacterList.querySelector('[data-character="pulse"]')?.classList.add('selected');
onlineEl('#room-join-button').addEventListener('click', () => {
  const code = onlineEl('#room-code').value.trim().toUpperCase();
  if (!code) { setRoomStatus('先输入房间码。', true); return; }
  openRoomSocket('join', code);
});
function leaveOnlineRoom() {
  sendRoomMessage({ type: 'leave' });
  if (onlineState.role === 'host') localStorage.removeItem(hostRoomStorageKey);
  onlineState.pc?.close(); onlineState.pc = null; onlineState.dataChannel = null;
  onlineState.role = null; onlineState.room = ''; onlineState.roster = null;
  onlineState.localInputs.clear(); onlineState.remoteInputs.clear(); onlineState.inputHistory = [];
  onlineEl('#start').hidden = true; onlineEl('#start').disabled = false;
  showOnlineTab('rooms'); sendRoomMessage({ type: 'list' });
  updateRecoverButton();
  setRoomStatus('已退出比赛并离开房间。');
}
onlineEl('#room-leave').addEventListener('click', leaveOnlineRoom);

window.addEventListener('beforeunload', () => {
  if (onlineState.socket?.readyState === WebSocket.OPEN) onlineState.socket.close();
  onlineState.pc?.close();
});
