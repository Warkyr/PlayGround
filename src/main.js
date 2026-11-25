/* =========================================================================
   AURORA PARTIDA — boot, state, input, scenes and main loop
   ========================================================================= */
'use strict';

const gameCanvas = document.getElementById('game');
const gameCtx = gameCanvas.getContext('2d');
gameCtx.imageSmoothingEnabled = true;

const SAVE_KEY = 'aurora_partida_save_v2';

/* --------------------------------------------------------------- runtime */
const G = {
  scene: 'title',
  time: 0,
  ux: 1,
  mobile: false,
  state: null,

  map: 'aldeia',
  mapCanvas: null,
  mapTheme: null,
  player: { x: 11, y: 13, dir: 'up', move: null, walk: 0 },
  npcs: [],
  objects: [],
  decor: [],
  lights: [],

  buttons: [],
  mouseX: -1,
  mouseY: -1,
  pressed: {},
  down: {},

  dialog: null,
  menu: null,
  battle: null,
  ending: null,
  banner: null,
  toasts: [],
  fade: null,
  fadeAlpha: 0,
  cutscene: false,
  title: { sel: 0, help: false, t: 0 },
  weather: null,
  lastSaveAt: 0
};

/* --------------------------------------------------------------- helpers */
function makeHero(id, level) {
  const def = HEROES[id];
  const lv = Math.max(1, level || 1);
  const h = {
    id,
    level: lv,
    xp: 0,
    hp: def.base.hp,
    maxHp: def.base.hp,
    mp: def.base.mp,
    maxMp: def.base.mp,
    atk: def.base.atk,
    def: def.base.def,
    mag: def.base.mag,
    spd: def.base.spd,
    skills: []
  };
  for (const s of def.skills) if (s.lvl <= lv && !h.skills.includes(s.id)) h.skills.push(s.id);
  return h;
}

function levelUpTo(hero, level) {
  let guard = 0;
  while (hero.level < level && guard++ < 40) {
    const need = Math.max(1, xpNeeded(hero.level) - hero.xp);
    grantXp(hero, need);
  }
}

function createState() {
  return {
    version: 2,
    act: 1,
    objective: 'Fale com Líria na praça da aldeia.',
    party: [makeHero('rowan', 1)],
    items: { pocao: 2, eter: 1 },
    gold: 35,
    flags: {},
    journal: ['Você chegou à Aldeia de Aurora para o Festival da Colheita.'],
    playTime: 0,
    kills: 0,
    map: 'aldeia',
    player: { x: 11, y: 13, dir: 'up' },
    opened: {},
    steps: 0
  };
}

function heroById(id) {
  if (!G.state) return null;
  return G.state.party.find(h => h.id === id) || null;
}

function setObjective(text, quiet) {
  if (!G.state) return;
  G.state.objective = text;
  if (!quiet) toast(text, { icon: '✦', dur: 3.6 });
}

function journal(text) {
  if (!G.state) return;
  G.state.journal.push(text);
  if (G.state.journal.length > 16) G.state.journal.shift();
}

function hasSave() {
  try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
}

function saveGame(silent) {
  if (!G.state) return false;
  try {
    if (G.scene === 'world') {
      G.state.map = G.map;
      G.state.player = { x: G.player.x, y: G.player.y, dir: G.player.dir };
    }
    G.state.savedAt = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 2, state: G.state }));
    G.lastSaveAt = G.time;
    if (!silent) toast('Jornada salva.', { icon: '✦' });
    return true;
  } catch (e) {
    if (!silent) toast('Não foi possível salvar.', { icon: '!', color: '#ffb0a0' });
    return false;
  }
}

function loadGame() {
  let parsed;
  try { parsed = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); }
  catch (e) { parsed = null; }
  if (!parsed || !parsed.state) { toast('Nenhum save encontrado.', { icon: '!' }); return false; }
  const s = parsed.state;
  s.flags = s.flags || {};
  s.items = s.items || {};
  s.journal = s.journal || [];
  s.party = Array.isArray(s.party) && s.party.length ? s.party : [makeHero('rowan', 1)];
  s.opened = s.opened || {};
  G.state = s;
  G.scene = 'world';
  G.dialog = null;
  G.menu = null;
  G.battle = null;
  G.ending = null;
  G.cutscene = false;
  document.body.classList.add('game-active');
  document.body.classList.remove('dialog-open', 'menu-open', 'hide-touch');
  const p = s.player || MAPS[s.map || 'aldeia'].spawn;
  loadMap(s.map || 'aldeia', p.x, p.y, p.dir || 'up', { silent: true, noSave: true });
  G.cutscene = false;
  showBanner(MAPS[G.map].name, MAPS[G.map].subtitle);
  return true;
}

function newGame() {
  G.state = createState();
  G.scene = 'world';
  G.dialog = null;
  G.menu = null;
  G.battle = null;
  G.ending = null;
  G.cutscene = false;
  G.banner = null;
  G.toasts = [];
  G.title.help = false;
  document.body.classList.add('game-active');
  document.body.classList.remove('dialog-open', 'menu-open', 'hide-touch');
  loadMap('aldeia', 11, 13, 'up', { silent: true });
  AUDIO.unlock();
  AUDIO.playTrack('village');
  saveGame(true);
  storyIntro();
}

function goTitle() {
  G.scene = 'title';
  G.dialog = null;
  G.menu = null;
  G.battle = null;
  G.ending = null;
  G.banner = null;
  G.toasts = [];
  G.cutscene = false;
  G.title = { sel: 0, help: false, t: 0 };
  document.body.classList.remove('game-active', 'dialog-open', 'menu-open', 'hide-touch');
  AUDIO.playTrack('title');
}

/* ------------------------------------------------------------- transitions */
function fadeOut(dur) {
  return new Promise(resolve => {
    G.fade = { phase: 'out', t: 0, dur: dur || .38, resolve };
  });
}
function fadeIn(dur) {
  return new Promise(resolve => {
    G.fadeAlpha = 1;
    G.fade = { phase: 'in', t: 0, dur: dur || .42, resolve };
  });
}
function updateFade(dt) {
  if (!G.fade) return;
  const f = G.fade;
  f.t += dt;
  const p = clamp(f.t / f.dur, 0, 1);
  if (f.phase === 'out') {
    G.fadeAlpha = p;
    if (p >= 1) {
      G.fadeAlpha = 1;
      G.fade = null;
      f.resolve();
    }
  } else {
    G.fadeAlpha = 1 - p;
    if (p >= 1) {
      G.fadeAlpha = 0;
      G.fade = null;
      f.resolve();
    }
  }
}

function drawFade(ctx) {
  if (G.fadeAlpha <= .001) return;
  ctx.save();
  ctx.globalAlpha = clamp(G.fadeAlpha, 0, 1);
  ctx.fillStyle = '#04060c';
  ctx.fillRect(0, 0, 960, 600);
  ctx.restore();
}

/* ------------------------------------------------------------------ title */
function titleOptions() {
  return [
    { label: 'NOVO JOGO', enabled: true, action: () => { AUDIO.sfx('confirm'); newGame(); } },
    { label: 'CONTINUAR', enabled: hasSave(), action: () => { AUDIO.sfx('confirm'); if (loadGame()) { AUDIO.playTrack(MAPS[G.map].music); } else AUDIO.sfx('error'); } },
    { label: 'COMO JOGAR', enabled: true, action: () => { G.title.help = true; AUDIO.sfx('confirm'); } }
  ];
}

function updateTitle() {
  G.title.t = (G.title.t || 0) + 1 / 60;
  if (G.title.help) {
    if (G.pressed.action || G.pressed.cancel) { G.title.help = false; AUDIO.sfx('cancel'); }
    return;
  }
  const opts = titleOptions();
  if (G.pressed.up) { G.title.sel = (G.title.sel + opts.length - 1) % opts.length; AUDIO.sfx('cursor'); }
  if (G.pressed.down) { G.title.sel = (G.title.sel + 1) % opts.length; AUDIO.sfx('cursor'); }
  if (G.pressed.action) {
    const o = opts[G.title.sel];
    if (o && o.enabled) o.action();
  }
  if (G.pressed.cancel) G.title.help = true;
}

function drawTitle(ctx) {
  const t = G.title.t;
  const sky = ctx.createLinearGradient(0, 0, 0, 600);
  sky.addColorStop(0, '#070b18');
  sky.addColorStop(.32, '#111a33');
  sky.addColorStop(.58, '#293557');
  sky.addColorStop(.78, '#6a4c62');
  sky.addColorStop(1, '#c07c62');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, 960, 600);

  // estrelas
  for (let i = 0; i < 90; i++) {
    const x = hash(i * 3.1) * 960;
    const y = hash(i * 7.3) * 380;
    const a = .15 + .65 * (Math.sin(t * .7 + i) * .5 + .5);
    ctx.fillStyle = `rgba(220,235,255,${a * .55})`;
    ctx.fillRect(x, y, i % 7 === 0 ? 2 : 1, i % 7 === 0 ? 2 : 1);
  }
  // aurora
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 4; i++) {
    const g = ctx.createLinearGradient(0, 90 + i * 22, 0, 300 + i * 22);
    g.addColorStop(0, 'rgba(90,220,190,0)');
    g.addColorStop(.45, `rgba(${80 + i * 30},${210 - i * 20},${210 + i * 10},${.05 + i * .012})`);
    g.addColorStop(1, 'rgba(120,90,220,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 190 + i * 26);
    ctx.bezierCurveTo(220, 60 + Math.sin(t * .12 + i) * 40, 520, 250 - i * 20, 960, 110 + i * 30);
    ctx.lineTo(960, 230 + i * 30);
    ctx.bezierCurveTo(620, 350, 280, 180, 0, 270 + i * 26);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // lua / sol nascente
  glow(ctx, 700, 258, 150, 'rgba(255,190,120,.22)', .8);
  ctx.fillStyle = 'rgba(255,225,175,.88)'; circle(ctx, 700, 258, 34); ctx.fill();

  // montanhas
  ctx.fillStyle = '#16192a';
  ctx.beginPath(); ctx.moveTo(0, 470); ctx.lineTo(140, 350); ctx.lineTo(280, 445); ctx.lineTo(430, 330);
  ctx.lineTo(600, 450); ctx.lineTo(760, 340); ctx.lineTo(960, 455); ctx.lineTo(960, 600); ctx.lineTo(0, 600); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#0e111b';
  ctx.beginPath(); ctx.moveTo(0, 520); ctx.lineTo(180, 425); ctx.lineTo(330, 515); ctx.lineTo(520, 410);
  ctx.lineTo(700, 520); ctx.lineTo(850, 450); ctx.lineTo(960, 520); ctx.lineTo(960, 600); ctx.lineTo(0, 600); ctx.closePath(); ctx.fill();

  // castelo distante
  ctx.fillStyle = '#090c13';
  ctx.fillRect(680, 398, 170, 100);
  ctx.fillRect(666, 380, 26, 120); ctx.fillRect(706, 356, 34, 144);
  ctx.fillRect(764, 372, 26, 128); ctx.fillRect(812, 386, 24, 114);
  for (let i = 0; i < 5; i++) {
    ctx.beginPath(); ctx.moveTo(680 + i * 34, 398); ctx.lineTo(697 + i * 34, 372); ctx.lineTo(714 + i * 34, 398); ctx.closePath(); ctx.fill();
  }
  // janelas
  ctx.fillStyle = 'rgba(255,190,100,.5)';
  ctx.fillRect(718, 404, 5, 10); ctx.fillRect(772, 414, 5, 10); ctx.fillRect(692, 430, 4, 8);

  // colina e herói
  ctx.fillStyle = '#0a0c12';
  ctx.beginPath(); ctx.moveTo(0, 600); ctx.lineTo(0, 505); ctx.quadraticCurveTo(170, 455, 330, 525); ctx.lineTo(380, 600); ctx.closePath(); ctx.fill();
  ctx.save();
  ctx.globalAlpha = .95;
  drawHumanoid(ctx, 190, 520, G.state && G.state.flags.hasBlade ? 'rowanHero' : 'rowan', 'right', 0, 2.15, { t });
  ctx.restore();

  // brasas
  for (let i = 0; i < 24; i++) {
    const x = (hash(i * 6.2) * 960 + t * 9 * (.3 + hash(i) * .6)) % 960;
    const y = 540 - ((t * 22 + i * 23) % 300);
    ctx.fillStyle = `rgba(240,160,90,${.08 + hash(i) * .2})`;
    ctx.fillRect(x, y, 1.6, 1.6);
  }

  // título
  const glowA = .55 + .18 * Math.sin(t * .8);
  ctx.save();
  ctx.globalAlpha = glowA;
  glow(ctx, 480, 138, 250, 'rgba(255,210,140,.16)', .8);
  ctx.restore();
  drawText(ctx, 'AURORA', 480, 108, { size: 54, align: 'center', font: F_SERIF, color: '#f2dfae', weight: 'bold', shadow: 'rgba(255,190,100,.35)', shadowBlur: 22 });
  spacedText(ctx, 'PARTIDA', 480, 160, 10, { size: 26, align: 'center', color: 'rgba(238,222,190,.92)', shadow: 'rgba(0,0,0,.8)', shadowBlur: 10 });
  diamond(ctx, 330, 190, 4, 'rgba(216,181,106,.65)');
  diamond(ctx, 630, 190, 4, 'rgba(216,181,106,.65)');
  ctx.strokeStyle = 'rgba(216,181,106,.32)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(348, 190); ctx.lineTo(612, 190); ctx.stroke();
  drawText(ctx, 'A Ascensão de Rowan', 480, 214, { size: 13, align: 'center', italic: true, color: 'rgba(235,225,205,.62)', font: F_SERIF });

  // menu
  const opts = titleOptions();
  opts.forEach((o, i) => {
    uiButton(ctx, 'title-' + i, 480 - 122, 300 + i * 54, 244, 42, o.label, {
      size: 13, enabled: o.enabled, active: G.title.sel === i,
      symbol: i === 0 ? '✦' : i === 1 ? '◈' : '?',
      onClick: () => { G.title.sel = i; o.action(); }
    });
  });

  drawText(ctx, 'Um RPG de turnos sobre traição, ruína e renascimento.', 480, 548, { size: 10, align: 'center', color: 'rgba(230,220,200,.42)', italic: true, font: F_SERIF });
  drawText(ctx, 'WASD / setas · Espaço · ESC', 480, 568, { size: 8.5, align: 'center', color: 'rgba(216,181,106,.35)' });

  if (G.title.help) drawTitleHelp(ctx);
}

function drawTitleHelp(ctx) {
  ctx.save();
  ctx.fillStyle = 'rgba(4,6,12,.78)'; ctx.fillRect(0, 0, 960, 600);
  panel(ctx, 150, 92, 660, 416, { r: 14, border: 'rgba(216,181,106,.66)', borderWidth: 2 });
  drawText(ctx, 'COMO JOGAR', 480, 136, { size: 23, align: 'center', font: F_SERIF, color: '#f2dfae', weight: 'bold' });
  diamond(ctx, 376, 158, 3.5, 'rgba(216,181,106,.6)'); diamond(ctx, 584, 158, 3.5, 'rgba(216,181,106,.6)');
  ctx.strokeStyle = 'rgba(216,181,106,.28)'; ctx.beginPath(); ctx.moveTo(396, 158); ctx.lineTo(564, 158); ctx.stroke();
  const lines = [
    ['Mover', 'WASD ou setas do teclado'],
    ['Interagir / avançar', 'Espaço, Enter ou Z'],
    ['Menu / voltar', 'ESC ou X'],
    ['Som', 'M'],
    ['Toque', 'Use o direcional e os botões A e ☰'],
    ['Batalhas', 'Escolha a ação de cada herói. Defender reduz o dano e recupera MP.'],
    ['Dica', 'Fale com todo mundo. Alguns segredos só aparecem para quem volta.']
  ];
  lines.forEach((l, i) => {
    const y = 196 + i * 38;
    drawText(ctx, l[0], 196, y, { size: 12, color: '#d8b56a', weight: 'bold' });
    ctx.save(); ctx.font = `11px ${F_BODY}`;
    const wrapped = wrapLines(ctx, l[1], 470);
    ctx.restore();
    wrapped.slice(0, 2).forEach((ln, j) => drawText(ctx, ln, 340, y + j * 15, { size: 11, color: 'rgba(238,228,206,.78)' }));
  });
  uiButton(ctx, 'help-close', 400, 452, 160, 36, 'VOLTAR', { size: 11, onClick: () => { G.title.help = false; AUDIO.sfx('cancel'); } });
  ctx.restore();
}

/* ------------------------------------------------------------- main update */
function update(dt) {
  G.time += dt;
  updateToasts(dt);
  updateFade(dt);
  if (G.banner) {
    G.banner.t += dt;
    if (G.banner.t >= G.banner.dur) G.banner = null;
  }

  if (G.pressed.mute) {
    const m = AUDIO.toggleMute();
    toast(m ? 'Som desativado' : 'Som ativado', { icon: '♪' });
  }

  if (G.scene === 'title') { updateTitle(); return; }

  if (G.dialog) { updateDialog(dt); return; }
  if (G.menu) { updateMenu(dt); return; }

  if (G.scene === 'world') {
    if (!G.cutscene && !G.fade) G.state.playTime += dt;
    updateWorld(dt);
  } else if (G.scene === 'battle') {
    updateBattle(dt);
  } else if (G.scene === 'ending') {
    updateEnding(dt);
  }
}

/* ---------------------------------------------------------------- drawing */
function draw() {
  G.buttons = [];
  gameCtx.clearRect(0, 0, 960, 600);

  if (G.scene === 'title') {
    drawTitle(gameCtx);
  } else if (G.scene === 'world') {
    drawWorld(gameCtx);
    drawHud(gameCtx);
    if (G.banner) drawBanner(gameCtx);
  } else if (G.scene === 'battle') {
    drawBattle(gameCtx);
  } else if (G.scene === 'ending') {
    drawEnding(gameCtx);
  }

  if (G.scene !== 'title' && G.scene !== 'ending') drawToasts(gameCtx);
  if (G.dialog) drawDialog(gameCtx);
  if (G.menu) drawMenu(gameCtx);
  drawFade(gameCtx);
}

/* ------------------------------------------------------------------ input */
const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  Space: 'action', Enter: 'action', NumpadEnter: 'action', KeyZ: 'action', KeyJ: 'action',
  Escape: 'cancel', KeyX: 'cancel', Backspace: 'cancel'
};

window.addEventListener('keydown', e => {
  AUDIO.unlock();
  if (e.code === 'KeyM') {
    if (!e.repeat) G.pressed.mute = true;
    e.preventDefault();
    return;
  }
  const k = KEYMAP[e.code];
  if (!k) return;
  e.preventDefault();
  if (!G.down[k]) G.pressed[k] = true;
  G.down[k] = true;
});
window.addEventListener('keyup', e => {
  const k = KEYMAP[e.code];
  if (k) { G.down[k] = false; e.preventDefault(); }
});
window.addEventListener('blur', () => { G.down = {}; });

function canvasPoint(ev) {
  const r = gameCanvas.getBoundingClientRect();
  return {
    x: (ev.clientX - r.left) * (960 / r.width),
    y: (ev.clientY - r.top) * (600 / r.height)
  };
}

gameCanvas.addEventListener('pointermove', ev => {
  const p = canvasPoint(ev);
  G.mouseX = p.x; G.mouseY = p.y;
});
gameCanvas.addEventListener('pointerleave', () => { G.mouseX = -1; G.mouseY = -1; });
gameCanvas.addEventListener('contextmenu', e => e.preventDefault());
gameCanvas.addEventListener('pointerdown', ev => {
  ev.preventDefault();
  AUDIO.unlock();
  const p = canvasPoint(ev);
  G.mouseX = p.x; G.mouseY = p.y;
  if (G.fade) return;

  if (G.scene === 'title') {
    if (G.title.help) {
      if (!handleUIButtons(p.x, p.y)) { G.title.help = false; AUDIO.sfx('cancel'); }
      return;
    }
    handleUIButtons(p.x, p.y);
    return;
  }
  if (G.scene === 'world') {
    if (G.dialog) { dialogPointer(p.x, p.y); return; }
    if (G.menu) { handleUIButtons(p.x, p.y); return; }
    if (handleUIButtons(p.x, p.y)) return;
    if (!G.cutscene) G.pressed.action = true;
    return;
  }
  if (G.scene === 'battle') {
    if (G.dialog) { dialogPointer(p.x, p.y); return; }
    battlePointer(p.x, p.y);
    return;
  }
  if (G.scene === 'ending') {
    if (handleUIButtons(p.x, p.y)) return;
  }
});

/* touch controls */
document.querySelectorAll('.tbtn[data-key]').forEach(btn => {
  const raw = btn.getAttribute('data-key');
  const key = raw === 'menu' ? 'cancel' : raw;
  const press = ev => {
    ev.preventDefault();
    AUDIO.unlock();
    if (!G.down[key]) G.pressed[key] = true;
    G.down[key] = true;
    btn.classList.add('held');
  };
  const release = ev => {
    if (ev) ev.preventDefault();
    G.down[key] = false;
    btn.classList.remove('held');
  };
  btn.addEventListener('pointerdown', press);
  btn.addEventListener('pointerup', release);
  btn.addEventListener('pointercancel', release);
  btn.addEventListener('pointerleave', release);
});

/* ---------------------------------------------------------------- viewport */
function resizeViewport() {
  const w = window.innerWidth || 960;
  G.mobile = w < 900 || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  G.ux = w < 620 ? 1.06 : 1;
}
window.addEventListener('resize', resizeViewport);
window.addEventListener('orientationchange', () => setTimeout(resizeViewport, 80));

/* -------------------------------------------------------------- main loop */
let lastFrame = performance.now();
function frame(now) {
  const dt = Math.min(.05, Math.max(0, (now - lastFrame) / 1000));
  lastFrame = now;
  update(dt);
  draw();
  G.pressed = {};
  requestAnimationFrame(frame);
}

function boot() {
  resizeViewport();
  goTitle();
  const loading = document.getElementById('loading');
  if (loading) {
    setTimeout(() => loading.classList.add('hidden'), 280);
    setTimeout(() => { if (loading.parentNode) loading.parentNode.removeChild(loading); }, 1100);
  }
  requestAnimationFrame(frame);
}

boot();
