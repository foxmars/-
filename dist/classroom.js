'use strict';

// Classmates are saved only in this browser. No names or scores enter room messages.
const classroomStorageKey = 'neonBrawlClassRosterV1';
const classroomDefaults = [
  { id: 'example-a', name: '同学 A', fitness: 5, chinese: 50, math: 50, english: 50, scoreScale: 100, style: 'pulse' },
  { id: 'example-b', name: '同学 B', fitness: 7, chinese: 80, math: 80, english: 80, scoreScale: 100, style: 'nova' }
];
const classroomStyles = ['pulse', 'nova', 'comet', 'titan', 'frost', 'volt', 'shade', 'gale', 'ember', 'terra', 'bramble', 'rivet'];
const classroomRating = value => Math.max(1, Math.min(10, Math.round(Number(value) || 5)));
const classroomScore = value => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
const classroomLevel = score => 1 + classroomScore(score) * .09;
function cleanClassmate(value) {
  if (!value || typeof value !== 'object') return null;
  const name = String(value.name || '').trim().slice(0, 12);
  if (!name) return null;
  return {
    id: String(value.id || '').slice(0, 48) || 'class-' + Math.random().toString(36).slice(2),
    name, fitness: classroomRating(value.fitness),
    chinese: classroomScore((value.chinese ?? value.grades ?? 5) * (value.scoreScale === 100 ? 1 : 10)),
    math: classroomScore((value.math ?? value.grades ?? 5) * (value.scoreScale === 100 ? 1 : 10)),
    english: classroomScore((value.english ?? value.grades ?? 5) * (value.scoreScale === 100 ? 1 : 10)),
    scoreScale: 100,
    style: classroomStyles.includes(value.style) ? value.style : 'pulse'
  };
}
let classRoster = classroomDefaults.map(item => ({ ...item }));
try {
  const saved = JSON.parse(localStorage.getItem(classroomStorageKey));
  if (Array.isArray(saved)) {
    const cleaned = saved.slice(0, 24).map(cleanClassmate).filter(Boolean);
    if (cleaned.length >= 2) classRoster = cleaned;
  }
} catch {}
let classP1 = classRoster[0].id;
let classP2 = classRoster[1].id;
let classVsP2 = false;
const classEl = selector => document.querySelector(selector);
const classProfile = id => classRoster.find(item => item.id === id) || classRoster[0];
const className = fighter => fighter.classmate?.name || characters[fighter.character]?.name || '斗士';
function classMultipliers(profile) {
  const c = classroomLevel(profile.chinese), m = classroomLevel(profile.math), e = classroomLevel(profile.english);
  return {
    speed: .72 + profile.fitness * .055,
    jump: .80 + profile.fitness * .04,
    power: .82 + m * .045,
    guard: 1.23 - e * .035,
    range: .9 + c * .02
  };
}
function classChartValues(profile) {
  const f = profile.fitness, c = classroomLevel(profile.chinese), m = classroomLevel(profile.math), e = classroomLevel(profile.english);
  return [3 + f * .7, 2 + f * .8, 2 + m * .8, 2 + e * .8, 2 + c * .8, 2 + (c + m + e) * .27]
    .map(value => Math.max(1, Math.min(10, Math.round(value))));
}
function renderClassChart(profile, owner, prefix) {
  renderRoleStats(profile.style, owner, prefix);
  const field = name => document.getElementById(prefix + '-' + name);
  const values = classChartValues(profile);
  field('name').textContent = profile.name + ' · ' + owner;
  field('trait').textContent = `体能 ${profile.fitness} · 语文 ${profile.chinese} · 数学 ${profile.math} · 英语 ${profile.english}。体能影响移动和跳跃；语文影响攻击范围，数学影响伤害，英语影响防御。沿用${characters[profile.style].name}招式。`;
  field('shape').setAttribute('points', values.map((value, index) => {
    const angle = (-90 + index * 60) * Math.PI / 180, radius = 78 * value / 10;
    return `${(160 + Math.cos(angle) * radius).toFixed(1)},${(126 + Math.sin(angle) * radius).toFixed(1)}`;
  }).join(' '));
  field('shape').setAttribute('fill', characters[profile.style].color + '55');
  field('shape').setAttribute('stroke', characters[profile.style].color);
  values.forEach((value, index) => { field('label-' + index).textContent = statAxes[index] + ' ' + value; });
}
function saveClassRoster() {
  try { localStorage.setItem(classroomStorageKey, JSON.stringify(classRoster)); } catch {}
}
function renderClassroom() {
  const edit = classEl('#classroom-edit-target'), currentEdit = edit.value;
  edit.replaceChildren(new Option('新增角色', ''), ...classRoster.map(item => new Option(item.name, item.id)));
  edit.value = classRoster.some(item => item.id === currentEdit) ? currentEdit : '';
  classEl('#classroom-delete').disabled = !edit.value || classRoster.length <= 2;
  for (const [slot, selected] of [['p1', classP1], ['p2', classP2]]) {
    const container = classEl('#classroom-' + slot);
    container.replaceChildren();
    for (const profile of classRoster) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'classroom-card' + (profile.id === selected ? ' selected' : '');
      card.setAttribute('aria-pressed', String(profile.id === selected));
      card.style.setProperty('--class-color', characters[profile.style].color);
      const avatar = document.createElement('span'); avatar.className = 'classroom-avatar'; avatar.textContent = profile.name.slice(0, 1);
      const name = document.createElement('strong'); name.textContent = profile.name;
      const details = document.createElement('small'); details.textContent = `体 ${profile.fitness} · 语 ${profile.chinese} · 数 ${profile.math} · 英 ${profile.english} · ${characters[profile.style].name}招式`;
      card.append(avatar, name, details);
      card.onclick = () => {
        if (slot === 'p1') classP1 = profile.id; else classP2 = profile.id;
        renderClassroom();
      };
      container.append(card);
    }
  }
  classEl('#classroom-p2-title').textContent = (classVsP2 ? 'PLAYER 2' : 'CPU') + ' · 选择同学';
  document.querySelectorAll('[data-classroom-opponent]').forEach(button => {
    const selected = (button.dataset.classroomOpponent === 'p2') === classVsP2;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  if (classEl('#mode').value === 'classroom') {
    renderClassChart(classProfile(classP1), '玩家 1', 'stat');
    renderClassChart(classProfile(classP2), classVsP2 ? '玩家 2' : 'CPU', 'p2-stat');
  }
}
function syncClassroomMode() {
  const option = classEl('#mode option[value="classroom"]');
  option.hidden = option.disabled = !secretMapUnlocked;
  if (!secretMapUnlocked && classEl('#mode').value === 'classroom') {
    classEl('#mode').value = 'cpu';
    classEl('#mode').dispatchEvent(new Event('change'));
    return;
  }
  const active = classEl('#mode').value === 'classroom';
  classEl('#classroom-panel').hidden = !active || !['ready', 'over'].includes(state);
  if (!active) return;
  classEl('.selection-layout').hidden = true;
  classEl('.stats-layout').hidden = false;
  classEl('.stats-layout').classList.add('dual-stats');
  classEl('#p2-stat-panel').hidden = false;
  classEl('#team-size-wrap').hidden = true;
  classEl('#survival-opponent').hidden = true;
  classEl('#cpu-select-wrap').hidden = true;
  classEl('#p2-select-wrap').hidden = true;
  classEl('#online-panel').hidden = true;
  classEl('#secret-panel').hidden = true;
  classEl('#start').hidden = false;
  classEl('#localhelp').hidden = !classVsP2;
  classEl('#round-rule').textContent = '班级对战 · 3 条命';
  classEl('#note').innerHTML = classVsP2 ? '班级对战：玩家 2 使用第二套键盘或手柄按键。<br>昵称和评分只保存在当前设备。' : '班级对战：选择两位同学，与 CPU 对战。<br>昵称和评分只保存在当前设备。';
  if (state === 'ready') {
    classEl('#overlay .eyebrow').textContent = '密语奖励 · 班级对战';
    classEl('#overlay h1').textContent = '班级对战';
    classEl('#overlay p').textContent = '编辑昵称和评分，选择两位同学上场。';
  }
  renderClassroom();
}

for (const id of classroomStyles) classEl('#classroom-style').append(new Option(characters[id].name, id));
for (const input of ['fitness']) classEl('#classroom-' + input).addEventListener('input', () => {
  classEl('#classroom-' + input + '-value').textContent = classEl('#classroom-' + input).value;
});
classEl('#classroom-edit-target').onchange = () => {
  const profile = classRoster.find(item => item.id === classEl('#classroom-edit-target').value);
  classEl('#classroom-name').value = profile?.name || '';
  classEl('#classroom-fitness').value = profile?.fitness || 5;
  for (const subject of ['chinese', 'math', 'english']) classEl('#classroom-' + subject).value = profile?.[subject] ?? 50;
  classEl('#classroom-style').value = profile?.style || 'pulse';
  classEl('#classroom-fitness-value').textContent = classEl('#classroom-fitness').value;
  classEl('#classroom-delete').disabled = !profile || classRoster.length <= 2;
};
classEl('#classroom-editor').onsubmit = event => {
  event.preventDefault();
  const name = classEl('#classroom-name').value.trim().slice(0, 12);
  if (!name) return;
  const id = classEl('#classroom-edit-target').value;
  if (!id && classRoster.length >= 24) { classEl('#classroom-status').textContent = '最多可保存 24 位角色。'; return; }
  const profile = cleanClassmate({ id: id || 'class-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6), name,
    fitness: classEl('#classroom-fitness').value,
    chinese: classEl('#classroom-chinese').value,
    math: classEl('#classroom-math').value,
    english: classEl('#classroom-english').value,
    scoreScale: 100,
    style: classEl('#classroom-style').value });
  const index = classRoster.findIndex(item => item.id === id);
  if (index >= 0) classRoster[index] = profile; else classRoster.push(profile);
  saveClassRoster(); renderClassroom();
  classEl('#classroom-edit-target').value = profile.id;
  classEl('#classroom-delete').disabled = classRoster.length <= 2;
  classEl('#classroom-status').textContent = `已保存 ${profile.name}。`;
};
classEl('#classroom-delete').onclick = () => {
  const id = classEl('#classroom-edit-target').value;
  if (!id || classRoster.length <= 2) return;
  classRoster = classRoster.filter(item => item.id !== id);
  if (classP1 === id) classP1 = classRoster[0].id;
  if (classP2 === id) classP2 = classRoster[1].id;
  saveClassRoster(); classEl('#classroom-edit-target').value = '';
  classEl('#classroom-edit-target').onchange(); renderClassroom();
  classEl('#classroom-status').textContent = '角色已删除。';
};
document.querySelectorAll('[data-classroom-opponent]').forEach(button => button.onclick = () => {
  classVsP2 = button.dataset.classroomOpponent === 'p2';
  syncClassroomMode();
});
classEl('#mode').addEventListener('change', syncClassroomMode);
classEl('#secret-panel').addEventListener('submit', () => syncClassroomMode());

const classOriginalStart = start;
start = function classroomStart() {
  if (classEl('#mode').value !== 'classroom') return classOriginalStart();
  if (victoryTimeout) return;
  const profile1 = classProfile(classP1), profile2 = classProfile(classP2);
  classOriginalStart();
  fighters = [profile1, profile2].map((profile, index) => {
    const person = fighter(index, profile.style, index);
    person.classmate = { ...profile };
    person.classmateStats = classMultipliers(profile);
    person.isHuman = index === 0 || classVsP2;
    return person;
  });
  classEl('#classroom-panel').hidden = true;
  classEl('#p2label').textContent = classVsP2 ? '02 / 玩家 2' : '02 / CPU';
  hud();
};
const classOriginalControls = controls;
controls = function classroomControls(person) {
  if (classEl('#mode').value !== 'classroom' || person.i === 0) return classOriginalControls(person);
  if (!classVsP2) return cpu(person, nearestOpponent(person));
  const pad = padStates[1];
  return {
    move: pad?.move || Number(keys.has(keybinds.p2right)) - Number(keys.has(keybinds.p2left)),
    j: pressed.has(keybinds.p2jump) || Boolean(pad?.j),
    ult: pressed.has(keybinds.p2ultimate) || Boolean(pad?.ult),
    a: pressed.has(keybinds.p2attack) || pressed.has(keybinds.p2heavy) || Boolean(pad?.a),
    h: pressed.has(keybinds.p2heavy) || Boolean(pad?.h),
    b: keys.has(keybinds.p2shield) || Boolean(pad?.b),
    down: keys.has(keybinds.p2down) || Boolean(pad?.down)
  };
};
const classOriginalHud = hud;
hud = function classroomHud() {
  classOriginalHud();
  if (classEl('#mode').value !== 'classroom') return;
  fighters.forEach((person, index) => {
    if (!person.classmate) return;
    classEl('#name' + index).textContent = className(person);
    classEl('#p' + (index + 1) + 'label').textContent = index ? classVsP2 ? '02 / 玩家 2' : '02 / CPU' : '01 / 玩家';
  });
};
const classOriginalDraw = draw;
draw = function classroomDraw() {
  classOriginalDraw();
  if (classEl('#mode').value !== 'classroom' || !['playing', 'over'].includes(state)) return;
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '700 17px system-ui, Microsoft YaHei, sans-serif';
  for (const person of fighters) {
    if (!person.classmate || person.lives <= 0) continue;
    const label = className(person), width = Math.max(58, ctx.measureText(label).width + 22);
    ctx.fillStyle = '#08152ddd'; ctx.fillRect(person.x - width / 2, person.y - 77, width, 27);
    ctx.fillStyle = characters[person.character].light; ctx.fillText(label, person.x, person.y - 63);
  }
  ctx.restore();
};
const classOriginalShow = show;
show = function classroomShow(...args) {
  classOriginalShow(...args);
  if (classEl('#mode').value === 'classroom') syncClassroomMode();
};
const classOriginalExitMatch = exitMatch;
exitMatch = function classroomExitMatch() {
  classOriginalExitMatch();
  if (classEl('#mode').value === 'classroom' && state === 'ready') syncClassroomMode();
};
syncClassroomMode();
