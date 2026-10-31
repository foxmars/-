'use strict';

// Keep the phone setup focused without changing the existing desktop controls.
(() => {
  const overlay = document.querySelector('#overlay');
  const mode = document.querySelector('#mode');
  const map = document.querySelector('#map-select');
  const mobile = matchMedia('(pointer:coarse)');
  const setup = document.createElement('section');
  setup.id = 'mobile-setup';
  setup.innerHTML = '<span class="mobile-step-count">步骤 1</span><h2>先选玩法和地图</h2><label>对战模式<select id="mobile-mode" aria-label="对战模式"></select></label><label>地图<select id="mobile-map" aria-label="地图"></select></label><div class="mobile-setup-options"><button id="mobile-sound" type="button">音效：关</button><button id="mobile-keybinds" type="button">按键设置</button></div>';
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
  for (const option of map.options) if (!option.hidden && !option.disabled) mapChoice.add(new Option(option.textContent, option.value));

  let step = 1;
  let roleTitle = '挑选你的斗士';
  function finalStep() { return mode.value === 'online' || mode.value === 'classroom' ? 2 : 3; }
  function render() {
    const active = mobile.matches && !overlay.hidden;
    document.body.dataset.mobileStep = active ? String(step) : '';
    document.body.dataset.mobileMode = active ? mode.value : '';
    modeChoice.value = mode.value;
    mapChoice.value = map.value;
    setup.querySelector('#mobile-sound').textContent = document.querySelector('#sound').textContent;
    progress.textContent = `${step} / ${finalStep()}`;
    back.hidden = step === 1;
    next.hidden = step >= finalStep();
    next.textContent = mode.value === 'online' ? '下一步：选房间' : step === 1 ? '下一步：选角色' : '下一步：开始';
  }
  function moveTo(value) {
    if (step === 2 && value === 3) {
      roleTitle = overlay.querySelector('h1').textContent;
      overlay.querySelector('h1').textContent = ({ cpu: '选择对手与规则', local: '选择玩家 2', range: '准备开始训练', survival: '设置擂台赛' })[mode.value] || '准备开始';
    } else if (step === 3 && value === 2) overlay.querySelector('h1').textContent = roleTitle;
    step = Math.max(1, Math.min(finalStep(), value));
    render();
    overlay.scrollTop = 0;
  }
  modeChoice.onchange = () => { mode.value = modeChoice.value; mode.dispatchEvent(new Event('change', { bubbles: true })); moveTo(1); };
  mapChoice.onchange = () => { map.value = mapChoice.value; map.dispatchEvent(new Event('change', { bubbles: true })); };
  setup.querySelector('#mobile-sound').onclick = () => { document.querySelector('#sound').click(); render(); };
  setup.querySelector('#mobile-keybinds').onclick = () => document.querySelector('#open-keybinds').click();
  back.onclick = () => moveTo(step - 1);
  next.onclick = () => moveTo(step + 1);
  mode.addEventListener('change', () => { step = 1; render(); });
  map.addEventListener('change', render);
  mobile.addEventListener('change', render);
  new MutationObserver(() => { if (!overlay.hidden) step = 1; render(); }).observe(overlay, { attributes: true, attributeFilter: ['hidden'] });
  window.addEventListener('keydown', event => {
    if (event.key !== 'Enter' || !mobile.matches || overlay.hidden || step >= finalStep() || event.target.matches('input,select,textarea')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    moveTo(step + 1);
  }, { capture: true });
  render();
})();
