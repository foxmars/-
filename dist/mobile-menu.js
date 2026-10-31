'use strict';

// Keep the phone setup focused without changing the existing desktop controls.
(() => {
  const overlay = document.querySelector('#overlay');
  const mode = document.querySelector('#mode');
  const map = document.querySelector('#map-select');
  const mobile = matchMedia('(pointer:coarse)');
  const setup = document.createElement('section');
  setup.id = 'mobile-setup';
  setup.innerHTML = '<span class="mobile-step-count">步骤 1</span><h2>选择玩法</h2><label>对战模式<select id="mobile-mode" aria-label="对战模式"></select></label><div id="mobile-mode-options" aria-label="选择对战模式"></div><label>地图<select id="mobile-map" aria-label="地图"></select></label><div class="mobile-setup-options"><button id="mobile-sound" type="button">音效：关</button><button id="mobile-keybinds" type="button">按键设置</button></div>';
  const navigation = document.createElement('nav');
  navigation.id = 'mobile-wizard-nav';
  navigation.setAttribute('aria-label', '设置步骤');
  navigation.innerHTML = '<button id="mobile-back" type="button">上一步</button><span id="mobile-progress"></span><button id="mobile-next" type="button">下一步</button>';
  overlay.insertBefore(setup, overlay.firstChild);
  overlay.insertBefore(navigation, document.querySelector('#start'));

  const modeChoice = setup.querySelector('#mobile-mode');
  const mapChoice = setup.querySelector('#mobile-map');
  const back = navigation.querySelector('#mobile-back');
  const next = navigation.querySelector('#mobile-next');
  const progress = navigation.querySelector('#mobile-progress');
  for (const option of mode.options) if (!option.hidden && !option.disabled) modeChoice.add(new Option(option.textContent, option.value));
  const modeButtons = setup.querySelector('#mobile-mode-options');
  for (const option of modeChoice.options) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = option.textContent;
    button.dataset.mode = option.value;
    button.onclick = () => { modeChoice.value = option.value; modeChoice.dispatchEvent(new Event('change', { bubbles: true })); };
    modeButtons.append(button);
  }
  for (const option of map.options) if (!option.hidden && !option.disabled) mapChoice.add(new Option(option.textContent, option.value));

  let step = 1;
  let roleTitle = '挑选你的斗士';
  function finalStep() { return mode.value === 'online' ? 4 : mode.value === 'classroom' ? 2 : 3; }
  function render() {
    const active = mobile.matches && !overlay.hidden;
    document.body.dataset.mobileStep = active ? String(step) : '';
    document.body.dataset.mobileMode = active ? mode.value : '';
    modeChoice.value = mode.value;
    for (const button of modeButtons.children) {
      const selected = button.dataset.mode === mode.value;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    }
    mapChoice.value = map.value;
    setup.querySelector('#mobile-sound').textContent = document.querySelector('#sound').textContent;
    progress.textContent = `${step} / ${finalStep()}`;
    back.hidden = step === 1;
    next.hidden = step >= finalStep() || (mode.value === 'online' && step === 2);
    next.textContent = mode.value === 'online' ? step === 1 ? '下一步：选房间' : '下一步：选角色' : step === 1 ? '下一步：选角色' : '下一步：开始';
  }
  function moveTo(value) {
    if (mode.value === 'online') {
      overlay.querySelector('h1').textContent = value === 4 ? '选择角色并开始' : value === 3 ? '选择队伍' : '服务器列表';
    } else if (step === 2 && value === 3) {
      roleTitle = overlay.querySelector('h1').textContent;
      overlay.querySelector('h1').textContent = ({ cpu: '选择对手与规则', local: '选择玩家 2', range: '准备开始训练', survival: '设置擂台赛', online: '房间准备' })[mode.value] || '准备开始';
    } else if (step === 3 && value === 2) overlay.querySelector('h1').textContent = roleTitle;
    step = Math.max(1, Math.min(finalStep(), value));
    render();
    overlay.scrollTop = 0;
  }
  modeChoice.onchange = () => { mode.value = modeChoice.value; mode.dispatchEvent(new Event('change', { bubbles: true })); moveTo(1); };
  mapChoice.onchange = () => { map.value = mapChoice.value; map.dispatchEvent(new Event('change', { bubbles: true })); };
  setup.querySelector('#mobile-sound').onclick = () => { document.querySelector('#sound').click(); render(); };
  setup.querySelector('#mobile-keybinds').onclick = () => document.querySelector('#open-keybinds').click();
  back.onclick = () => {
    if (mode.value === 'online' && step === 3) document.querySelector('#room-leave').click();
    moveTo(step - 1);
  };
  next.onclick = () => moveTo(step + 1);
  mode.addEventListener('change', () => { step = 1; render(); });
  map.addEventListener('change', render);
  mobile.addEventListener('change', render);
  new MutationObserver(() => { if (!overlay.hidden) step = 1; render(); }).observe(overlay, { attributes: true, attributeFilter: ['hidden'] });
  const lobby = document.querySelector('#room-lobby');
  new MutationObserver(() => {
    if (mode.value !== 'online' || !mobile.matches || overlay.hidden) return;
    if (!lobby.hidden) moveTo(3);
    else if (step >= 3) moveTo(2);
  }).observe(lobby, { attributes: true, attributeFilter: ['hidden'] });

  function paginate(selector, pageSize) {
    const list = document.querySelector(selector);
    if (!list) return;
    const pager = document.createElement('div');
    pager.className = 'mobile-pager';
    pager.innerHTML = '<button type="button" aria-label="上一页">上一页</button><span></span><button type="button" aria-label="下一页">下一页</button>';
    list.after(pager);
    const [previous, label, following] = pager.children;
    let page = 0;
    function update() {
      const items = [...list.children];
      const visiblePerPage = mobile.matches && matchMedia('(orientation: landscape)').matches ? Math.ceil(pageSize / 2) : pageSize;
      const pages = Math.max(1, Math.ceil(items.length / visiblePerPage));
      page = Math.min(page, pages - 1);
      items.forEach((item, index) => item.classList.toggle('mobile-page-hidden', mobile.matches && (index < page * visiblePerPage || index >= (page + 1) * visiblePerPage)));
      pager.hidden = !mobile.matches || pages < 2;
      previous.disabled = page === 0;
      following.disabled = page >= pages - 1;
      label.textContent = `${page + 1} / ${pages}`;
    }
    previous.onclick = () => { page--; update(); };
    following.onclick = () => { page++; update(); };
    new MutationObserver(() => { page = 0; update(); }).observe(list, { childList: true });
    mobile.addEventListener('change', update);
    window.addEventListener('resize', update);
    update();
  }
  paginate('.selection-layout > .character-select', 6);
  paginate('#cpu-character-select', 6);
  paginate('#p2-character-select', 6);
  paginate('#rooms-list', 4);
  paginate('#online-characters', 8);
  window.addEventListener('keydown', event => {
    if (event.key !== 'Enter' || !mobile.matches || overlay.hidden || step >= finalStep() || event.target.matches('input,select,textarea')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    moveTo(step + 1);
  }, { capture: true });
  render();
})();
