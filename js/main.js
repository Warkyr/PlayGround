// main.js — game boot, exploration, map rendering and session flow
import {
  Input, Store, clamp, lerp, wait, chance, pick, hash2, formatTime,
} from './util.js';
import { audio } from './audio.js';
import { ui } from './ui.js';
import {
  drawCharacter, drawProp, drawChest, propSolidRect, propBaseY,
  renderGround, tileWalkable, drawWaterShimmer, drawTitleBG, THEMES,
} from './art.js';
import {
  CHAPTERS, ITEMS, ENCOUNTERS, makeMember, levelUpMember, getMap, MAPS,
} from './data.js';
import { pauseMenu, shopMenu } from './ui-menus.js';
import { startBattle, getActiveBattle } from './battle.js';
import { drawBattleFrame } from './battle-ui.js';
import { runScript, hasScript, TITLE_EXIT } from './story.js';

const SAVE_KEY = 'lamina-do-amanhecer-v1';
const STEP_TIME = 0.145;
const DIRV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

const canvas = document.getElementById('game');
const g = canvas.getContext('2d');

let dpr = 1;
let VW = 0;
let VH = 0;
let mode = 'title';
let game = null;
let currentMap = null;
let groundCanvas = null;
let player = null;
let ambientType = 'dust';
let blockers = new Set();
let transitioning = false;
let sessionResolve = null;
let sessionEnded = false;
let lastFrame = 0;
let time = 0;
let hudTimer = 0;
let encounterSteps = 0;
let stepSound = 0;

// ------------------------------------------------------------------ utilities
function block(key) { blockers.add(key); }
function unblock(key) { blockers.delete(key); }
function isBusy() { return blockers.size > 0; }

function resize() {
  dpr = Math.min(2, window.devicePixelRatio || 1);
  VW = window.innerWidth;
  VH = window.innerHeight;
  canvas.width = Math.max(1, Math.round(VW * dpr));
  canvas.height = Math.max(1, Math.round(VH * dpr));
  canvas.style.width = `${VW}px`;
  canvas.style.height = `${VH}px`;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.imageSmoothingEnabled = false;
}

function computeZoom(map) {
  const base = Math.min(VW / (map.w * 16), VH / (map.h * 16)) * 1.06;
  return clamp(base, 2, 3.25);
}

function playerPixel() {
  const t = player.moving ? (1 - Math.pow(1 - player.t, 3)) : 1;
  const x = lerp(player.fromX, player.x, t);
  const y = lerp(player.fromY, player.y, t);
  return { x: x * 16 + 8, y: y * 16 + 16 };
}

function inRect(x, y, r) {
  return x >= r.x && x < r.x + (r.w || 1) && y >= r.y && y < r.y + (r.h || 1);
}

function npcPresent(n) { return !n.when || n.when(game); }
function chestPresent(c) { return !c.when || c.when(game); }

// ------------------------------------------------------------------ state
function newGame() {
  game = {
    flags: {}, triggers: {}, chests: {}, seen: {},
    party: [makeMember('kael', 1)],
    gold: 45,
    inventory: { potion: 3, ether: 1 },
    chapter: 0,
    chapterLabel: 'Capítulo I',
    quest: 'Encontre Lyra no centro da vila.',
    journal: [],
    playTime: 0,
    playTimeLabel: '0m',
    battlesWon: 0,
    completed: false,
    mapId: 'village',
    mapName: 'Brumalva',
  };
  const m = game.party[0];
  m.hp = m.maxHp;
  m.mp = m.maxMp;
  encounterSteps = 0;
  const map = MAPS.village;
  setMap('village', map.spawn.x, map.spawn.y, map.spawn.dir);
  ui.updateHUD(game);
}

function loadGame(save) {
  if (!save || save.version !== 1 || !Array.isArray(save.party) || !save.party.length) return false;
  game = {
    ...save,
    flags: save.flags || {},
    triggers: save.triggers || {},
    chests: save.chests || {},
    seen: save.seen || {},
    inventory: save.inventory || {},
    journal: save.journal || [],
    party: save.party,
    chapter: save.chapter || 0,
    gold: save.gold || 0,
    quest: save.quest || 'Encontre um caminho adiante.',
    playTime: save.playTime || 0,
    battlesWon: save.battlesWon || 0,
    completed: !!save.completed,
  };
  for (const m of game.party) {
    m.status = {};
    m.buffs = [];
    m.defending = false;
    m.hp = clamp(Number(m.hp) || 0, 0, m.maxHp);
    m.mp = clamp(Number(m.mp) || 0, 0, m.maxMp);
    if (!m.skills) m.skills = [];
  }
  const map = getMap(save.mapId) || MAPS.village;
  const p = save.player || {};
  setMap(map.id, Number.isFinite(p.x) ? p.x : map.spawn.x, Number.isFinite(p.y) ? p.y : map.spawn.y, p.dir || map.spawn.dir);
  game.chapterLabel = `Capítulo ${CHAPTERS[game.chapter]?.n || 'I'}`;
  game.playTimeLabel = formatTime(game.playTime);
  ui.updateHUD(game);
  return true;
}

function saveGame(silent = true) {
  if (!game || !player) return false;
  const data = {
    version: 1,
    flags: game.flags,
    triggers: game.triggers,
    chests: game.chests,
    seen: game.seen,
    party: game.party,
    gold: game.gold,
    inventory: game.inventory,
    chapter: game.chapter,
    quest: game.quest,
    journal: game.journal,
    playTime: game.playTime,
    battlesWon: game.battlesWon,
    completed: !!game.completed,
    mapId: game.mapId,
    mapName: game.mapName,
    player: { x: player.x, y: player.y, dir: player.dir },
  };
  const ok = Store.set(SAVE_KEY, data);
  if (ok && !silent) audio.sfx('save');
  return ok;
}

function readSave() {
  const save = Store.get(SAVE_KEY, null);
  if (!save || save.version !== 1) return null;
  save.label = `Capítulo ${CHAPTERS[save.chapter]?.n || 'I'} · ${save.mapName || 'Brumalva'}`;
  return save;
}

// ------------------------------------------------------------------ map
function setMap(id, x, y, dir = 'up') {
  const map = getMap(id) || MAPS.village;
  currentMap = map;
  player = {
    x, y, dir,
    fromX: x, fromY: y,
    moving: false, t: 1, frame: 0, walkPhase: 0,
  };
  groundCanvas = renderGround(map);
  ambientType = map.ambient || 'dust';
  encounterSteps = 0;
  game.mapId = map.id;
  game.mapName = map.name;
  audio.playMusic(map.bgm || 'field');
}

function solidAt(tx, ty) {
  if (!currentMap) return true;
  if (tx < 0 || ty < 0 || tx >= currentMap.w || ty >= currentMap.h) return true;
  const ch = (currentMap.ground[ty] || '')[tx];
  if (!tileWalkable(ch)) return true;

  for (const p of currentMap.props) {
    const r = propSolidRect(p);
    if (!r) continue;
    if (p.openFlag && game.flags[p.openFlag]) continue;
    if (tx >= r.x && tx < r.x + r.w && ty >= r.y && ty < r.y + r.h) return true;
  }
  for (const n of currentMap.npcs) {
    if (!npcPresent(n)) continue;
    if (n.x === tx && n.y === ty) return true;
  }
  for (const c of currentMap.chests) {
    if (!chestPresent(c)) continue;
    if (c.x === tx && c.y === ty) return true;
  }
  return false;
}

function tryMove(dir) {
  const [dx, dy] = DIRV[dir];
  const nx = player.x + dx;
  const ny = player.y + dy;
  if (solidAt(nx, ny)) {
    player.bump = 0.12;
    return;
  }
  player.fromX = player.x;
  player.fromY = player.y;
  player.x = nx;
  player.y = ny;
  player.moving = true;
  player.t = 0;
  stepSound++;
  if (stepSound % 2 === 0) audio.sfx('step');
}

function onStepComplete() {
  if (mode !== 'explore' || isBusy()) return;
  if (checkTriggers()) return;
  if (checkPortals()) return;
  checkEncounter();
}

function checkPortals() {
  if (transitioning) return false;
  for (const p of currentMap.portals) {
    if (p.when && !p.when(game)) continue;
    if (!inRect(player.x, player.y, p)) continue;
    audio.sfx('door');
    gotoMap(p.to, p.tx, p.ty, p.dir || 'up');
    return true;
  }
  return false;
}

function checkTriggers() {
  for (const t of currentMap.triggers) {
    if (game.triggers[t.id]) continue;
    if (t.when && !t.when(game)) continue;
    if (!inRect(player.x, player.y, t)) continue;
    game.triggers[t.id] = true;
    runStory(t.script);
    return true;
  }
  return false;
}

function checkEncounter() {
  const enc = currentMap.encounter;
  if (!enc) return;
  const ch = (currentMap.ground[player.y] || '')[player.x];
  if (!enc.tiles.includes(ch)) return;
  encounterSteps++;
  if (encounterSteps < (enc.minSteps || 10)) return;
  if (!chance(enc.rate || 0.05)) return;
  encounterSteps = 0;
  const groups = ENCOUNTERS[enc.groups] || [];
  if (!groups.length) return;
  const group = pick(groups);
  runBattle(group, { bg: currentMap.theme, intro: 'Uma emboscada no caminho!' }).then((res) => {
    if (res === 'title') endSession('title');
  });
}

// ------------------------------------------------------------------ movement loop
function updateExplore(dt) {
  if (mode !== 'explore' || isBusy() || !player) return;
  if (player.bump > 0) player.bump = Math.max(0, player.bump - dt);
  if (player.moving) {
    player.t += dt / STEP_TIME;
    // Continuous walk clock: keeps the 4-frame cycle flowing across tiles
    // instead of restarting it on every step.
    player.walkPhase += dt;
    if (player.t >= 1) {
      player.t = 1;
      player.moving = false;
      player.fromX = player.x;
      player.fromY = player.y;
      onStepComplete();
    }
    return;
  }
  let dir = null;
  if (Input.isDown('up')) dir = 'up';
  else if (Input.isDown('down')) dir = 'down';
  else if (Input.isDown('left')) dir = 'left';
  else if (Input.isDown('right')) dir = 'right';
  if (dir) {
    player.dir = dir;
    tryMove(dir);
  } else {
    player.walkPhase = 0;
  }
}

// ------------------------------------------------------------------ interaction
function interact() {
  if (!player || mode !== 'explore' || isBusy()) return;
  const [dx, dy] = DIRV[player.dir];
  const tx = player.x + dx;
  const ty = player.y + dy;

  const npc = currentMap.npcs.find((n) => npcPresent(n) && n.x === tx && n.y === ty);
  if (npc) {
    audio.sfx('confirm');
    if (npc.talk && hasScript(npc.talk)) runStory(npc.talk);
    else ui.say(npc.name || 'Narrador', '...');
    return;
  }

  const chest = currentMap.chests.find((c) => chestPresent(c) && c.x === tx && c.y === ty);
  if (chest) { openChest(chest); return; }

  const prop = currentMap.props.find((p) => p.x === tx && p.y === ty && p.t === 'sign');
  if (prop) {
    audio.sfx('confirm');
    ui.say('Narrador', 'A placa está gasta pelo tempo. Resta apenas uma palavra: “Aurora”.');
  }
}

function openChest(chest) {
  if (game.chests[chest.id]) { ui.toast('O baú está vazio.', '', '◈'); return; }
  if (chest.when && !chest.when(game)) { ui.toast('O baú está trancado.', 'red', '⚿'); return; }
  game.chests[chest.id] = true;
  const n = chest.n || 1;
  game.inventory[chest.item] = (game.inventory[chest.item] || 0) + n;
  const it = ITEMS[chest.item];
  audio.sfx('chest');
  ui.toast(`Encontrou ${it?.name || chest.item} ×${n}.`, 'gold', it?.icon || '◈');
  ui.updateHUD(game);
}

// ------------------------------------------------------------------ story context
const storyCtx = {
  chapter(index) {
    game.chapter = index;
    game.chapterLabel = `Capítulo ${CHAPTERS[index]?.n || 'I'}`;
    ui.updateHUD(game);
  },
  quest(text) {
    if (game.quest !== text) {
      for (const j of game.journal) j.active = false;
      game.journal.push({ chapter: CHAPTERS[game.chapter]?.n || 'I', text, active: true });
      if (game.journal.length > 16) game.journal.shift();
    }
    game.quest = text;
    ui.setQuest(text);
  },
  join(id, level) {
    if (game.party.some((m) => m.id === id)) { storyCtx.levelTo(id, level); return; }
    const m = makeMember(id, level);
    m.hp = m.maxHp;
    m.mp = m.maxMp;
    game.party.push(m);
    ui.updateHUD(game);
    ui.toast(`${m.name} entrou no grupo!`, 'gold', '✦');
    audio.sfx('levelup');
  },
  levelTo(id, level) {
    const m = game.party.find((x) => x.id === id);
    if (!m) return;
    while (m.level < level) levelUpMember(m, 1);
    m.hp = m.maxHp;
    m.mp = m.maxMp;
    ui.updateHUD(game);
  },
  healAll(pct = 1) {
    for (const m of game.party) {
      m.hp = Math.max(1, Math.round(m.maxHp * pct));
      m.mp = Math.round(m.maxMp * pct);
      m.status = {};
      m.buffs = [];
      m.defending = false;
    }
    ui.updateHUD(game);
  },
  give(id, n = 1) {
    game.inventory[id] = (game.inventory[id] || 0) + n;
    ui.updateHUD(game);
  },
  async shop(stock, title) { await openShop(stock, title); },
  async goto(id, x, y, dir, opts) { await gotoMap(id, x, y, dir, opts); },
  async battle(ids, opts) { return await runBattle(ids, opts); },
  async modal(opts) { return await ui.modal(opts); },
  async ending() {
    game.completed = true;
    game.playTimeLabel = formatTime(game.playTime);
    await ui.ending(game);
  },
  save() { saveGame(true); },
};

let storyId = 0;
async function runStory(name) {
  if (!name) return;
  const blocker = `story-${++storyId}`;
  block(blocker);
  try {
    const result = await runScript(name, game, storyCtx);
    if (result === 'title') {
      if (game.completed) saveGame(true);
      endSession('title');
      return;
    }
    if (!sessionEnded) saveGame(true);
  } catch (err) {
    if (err === TITLE_EXIT) { endSession('title'); return; }
    console.error('Story error:', name, err);
  } finally {
    unblock(blocker);
  }
}

async function gotoMap(id, x, y, dir = 'up', opts = {}) {
  if (transitioning) return;
  transitioning = true;
  block('transition');
  try {
    await ui.fadeOut(opts.fade ?? 420);
    setMap(id, x, y, dir);
    await wait(70);
    await ui.fadeIn(opts.fade ?? 420);
  } finally {
    unblock('transition');
    transitioning = false;
  }
  if (!opts.skipEnter) {
    const map = currentMap;
    const key = `enter:${map.id}`;
    if (map.onEnter && !game.seen[key]) {
      game.seen[key] = true;
      await runStory(map.onEnter);
    }
  }
}

async function runBattle(ids, opts = {}) {
  if (mode === 'battle') return 'ok';
  mode = 'battle';
  Input.exploreAction = null;
  ui.setTouchVisible(false);
  const bg = opts.bg || currentMap?.theme || 'forest';
  try {
    const res = await startBattle(game, ids, { ...opts, bg });
    if (res === 'title') { endSession('title'); return 'title'; }
    return res;
  } finally {
    if (!sessionEnded) {
      mode = 'explore';
      Input.exploreAction = exploreAction;
      ui.setTouchVisible(true);
      if (currentMap) audio.playMusic(currentMap.bgm || 'field');
      ui.updateHUD(game);
      saveGame(true);
    }
  }
}

async function openShop(stock, title) {
  if (mode !== 'explore' || isBusy()) return;
  block('shop');
  try {
    await shopMenu(game, stock, title);
  } finally {
    unblock('shop');
    ui.updateHUD(game);
  }
}

async function openPause() {
  if (mode !== 'explore' || isBusy()) return;
  block('pause');
  try {
    const result = await pauseMenu(game, { save: () => saveGame(true) });
    if (result === 'title') endSession('title');
  } finally {
    unblock('pause');
  }
}

function exploreAction(action) {
  if (mode !== 'explore' || isBusy()) return;
  if (action === 'confirm') interact();
  else if (action === 'cancel' || action === 'menu') openPause();
}

// ------------------------------------------------------------------ rendering
function drawWorld() {
  const map = currentMap;
  if (!map || !groundCanvas) return;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, VW, VH);

  const zoom = computeZoom(map);
  const vw = VW / zoom;
  const vh = VH / zoom;
  const pp = playerPixel();
  const mw = map.w * 16;
  const mh = map.h * 16;
  let camX = pp.x - vw / 2;
  let camY = pp.y - vh / 2;
  camX = mw <= vw ? (mw - vw) / 2 : clamp(camX, 0, mw - vw);
  camY = mh <= vh ? (mh - vh) / 2 : clamp(camY, 0, mh - vh);

  g.save();
  g.translate(-camX * zoom, -camY * zoom);
  g.scale(zoom, zoom);
  g.imageSmoothingEnabled = false;
  g.drawImage(groundCanvas, 0, 0);

  const drawables = [];

  for (const p of map.props) {
    if (p.hidden) continue;
    const open = p.openFlag ? !!game.flags[p.openFlag] : false;
    drawables.push({
      y: propBaseY(p),
      draw: () => drawProp(g, p, map.theme, time, { open }),
    });
  }
  for (const c of map.chests) {
    if (!chestPresent(c)) continue;
    drawables.push({
      y: (c.y + 1) * 16,
      draw: () => drawChest(g, c.x, c.y, !!game.chests[c.id], time),
    });
  }
  for (const n of map.npcs) {
    if (!npcPresent(n)) continue;
    drawables.push({
      y: (n.y + 1) * 16,
      draw: () => {
        const bob = Math.sin(time * 1.6 + n.x * 0.7) * 0.6;
        drawCharacter(g, n.sprite, n.x * 16 + 8, n.y * 16 + 16 + bob, n.dir || 'down', 0, 1);
      },
    });
  }

  const pp2 = playerPixel();
  // 4-frame cycle mapped to [contact L, passing, contact R, passing].
  // A 92ms cadence stays smooth on slower devices and still matches the step.
  const WALK_FRAMES = [1, 2, 3, 2];
  const walkingFrame = player.moving
    ? WALK_FRAMES[Math.floor(player.walkPhase / 0.092) % WALK_FRAMES.length]
    : 0;
  drawables.push({
    y: pp2.y,
    draw: () => drawCharacter(g, 'kael', pp2.x, pp2.y, player.dir, walkingFrame, 1, { alpha: 1 }),
  });
  drawables.sort((a, b) => a.y - b.y);
  for (const d of drawables) d.draw();

  g.restore();

  drawWaterShimmer(g, map, { x: camX, y: camY, w: vw, h: vh }, time, zoom);
  drawAmbient();
  drawLighting(camX, camY, zoom);
}

function drawAmbient() {
  const type = ambientType;
  g.save();
  if (type === 'snow') {
    for (let i = 0; i < 90; i++) {
      const x = ((hash2(i, 1) * VW + Math.sin(time * 0.5 + i) * 26) % VW + VW) % VW;
      const y = ((hash2(i, 2) * VH + time * (22 + (i % 5) * 9)) % VH + VH) % VH;
      g.globalAlpha = 0.35 + (i % 4) * 0.12;
      g.fillStyle = '#eaf6ff';
      const s = i % 7 === 0 ? 2 : 1;
      g.fillRect(x, y, s, s);
    }
  } else if (type === 'embers') {
    for (let i = 0; i < 38; i++) {
      const x = ((hash2(i, 3) * VW + Math.sin(time * 0.8 + i * 1.7) * 20) % VW + VW) % VW;
      const y = ((hash2(i, 4) * VH - time * (14 + (i % 6) * 7)) % VH + VH) % VH;
      g.globalAlpha = 0.22 + Math.sin(time * 2 + i) * 0.16;
      g.fillStyle = i % 3 === 0 ? '#ffd27a' : '#ff8a4a';
      g.fillRect(x, y, 2, 2);
    }
  } else if (type === 'fireflies') {
    for (let i = 0; i < 26; i++) {
      const x = ((hash2(i, 5) * VW + Math.sin(time * 0.6 + i) * 45) % VW + VW) % VW;
      const y = ((hash2(i, 6) * VH + Math.cos(time * 0.5 + i * 1.3) * 30) % VH + VH) % VH;
      g.globalAlpha = 0.3 + Math.sin(time * 2.4 + i * 1.9) * 0.28;
      g.fillStyle = '#c8ffb0';
      g.fillRect(x, y, 2, 2);
    }
  } else if (type === 'leaves') {
    for (let i = 0; i < 24; i++) {
      const x = ((hash2(i, 7) * VW + time * (12 + (i % 4) * 8)) % (VW + 40)) - 20;
      const y = ((hash2(i, 8) * VH + Math.sin(time * 0.9 + i) * 20) % VH + VH) % VH;
      g.globalAlpha = 0.28 + (i % 3) * 0.12;
      g.fillStyle = i % 2 ? '#a8c47a' : '#d8b46a';
      g.fillRect(x, y, 3, 2);
    }
  } else {
    for (let i = 0; i < 34; i++) {
      const x = ((hash2(i, 9) * VW + Math.sin(time * 0.3 + i) * 14) % VW + VW) % VW;
      const y = ((hash2(i, 10) * VH + Math.cos(time * 0.22 + i) * 16) % VH + VH) % VH;
      g.globalAlpha = 0.12 + (i % 4) * 0.05;
      g.fillStyle = '#d8d0b8';
      g.fillRect(x, y, 1, 1);
    }
  }
  g.restore();
}

function drawLighting(camX, camY, zoom) {
  const th = THEMES[currentMap.theme];
  if (!th?.dark) return;
  const pp = playerPixel();
  const px = (pp.x - camX) * zoom;
  const py = (pp.y - camY) * zoom;
  g.save();
  for (const p of currentMap.props) {
    if (!['torch', 'campfire', 'crystal', 'lamp', 'altar', 'portal'].includes(p.t)) continue;
    const wx = (p.x * 16 + 8 - camX) * zoom;
    const wy = (p.y * 16 + 8 - camY) * zoom;
    const radius = (p.t === 'campfire' ? 110 : p.t === 'lamp' ? 70 : 60) * zoom;
    const grd = g.createRadialGradient(wx, wy, 2, wx, wy, radius);
    grd.addColorStop(0, 'rgba(255,200,120,.22)');
    grd.addColorStop(1, 'rgba(255,180,90,0)');
    g.globalCompositeOperation = 'lighter';
    g.fillStyle = grd;
    g.fillRect(wx - radius, wy - radius, radius * 2, radius * 2);
  }
  g.restore();

  const grd = g.createRadialGradient(px, py, 60, px, py, Math.max(VW, VH) * 0.78);
  grd.addColorStop(0, 'rgba(2,4,10,0)');
  grd.addColorStop(0.55, 'rgba(2,4,10,.16)');
  grd.addColorStop(1, 'rgba(2,4,10,.6)');
  g.fillStyle = grd;
  g.fillRect(0, 0, VW, VH);
}

function drawTitle() {
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, VW, VH);
  drawTitleBG(g, VW, VH, time, game?.completed ? 'ending' : 'title');
}

// ------------------------------------------------------------------ frame loop
function loop(now) {
  const dt = lastFrame ? Math.min(0.05, (now - lastFrame) / 1000) : 0.016;
  lastFrame = now;
  time += dt;

  if (mode === 'title') {
    drawTitle();
  } else if (mode === 'battle') {
    const b = getActiveBattle();
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, VW, VH);
    if (b) {
      b.w = VW; b.h = VH; b.ctx = g;
      drawBattleFrame(b, now);
    }
  } else if (mode === 'explore' && game && currentMap) {
    game.playTime += dt;
    updateExplore(dt);
    drawWorld();
    hudTimer += dt;
    if (hudTimer > 0.25) {
      hudTimer = 0;
      game.playTimeLabel = formatTime(game.playTime);
      ui.updateHUD(game);
    }
  }
  requestAnimationFrame(loop);
}

// ------------------------------------------------------------------ session
function endSession(reason) {
  if (sessionEnded) return;
  sessionEnded = true;
  mode = 'title';
  blockers.clear();
  Input.exploreAction = null;
  if (sessionResolve) sessionResolve(reason);
}

async function startSession() {
  ui.updateHUD(game);
  const map = currentMap;
  const key = `enter:${map.id}`;
  if (map.onEnter && !game.seen[key]) {
    game.seen[key] = true;
    runStory(map.onEnter);
  }
}

// Development/debug hook: useful for QA without exposing it in the UI.
window.__lamina = {
  get game() { return game; },
  get mode() { return mode; },
  get player() { return player; },
  get map() { return currentMap; },
  get blockers() { return [...blockers]; },
  get input() { return Input; },
  get battle() { return getActiveBattle(); },
  newGame, loadGame, saveGame, readSave,
  gotoMap, runBattle, runStory, storyCtx,
};

async function boot() {
  resize();
  window.addEventListener('resize', resize);
  Input.init();
  ui.init();
  ui.updateMuteIcon(audio.muted);
  Input.exploreAction = exploreAction;

  const unlock = () => {
    audio.unlock();
    audio.playMusic('title');
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);

  requestAnimationFrame(loop);

  while (true) {
    const save = readSave();
    sessionEnded = false;
    sessionResolve = null;
    mode = 'title';
    blockers.clear();
    ui.showHUD(false);
    ui.setTouchVisible(false);
    audio.playMusic('title');
    const action = await ui.title({
      save: !!save,
      saveLabel: save?.label || '',
      completed: !!save?.completed,
    });

    if (action === 'continue' && save) {
      if (!loadGame(save)) newGame();
    } else {
      newGame();
    }

    mode = 'explore';
    ui.showHUD(true);
    ui.setTouchVisible(window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 820);
    ui.updateHUD(game);
    Input.exploreAction = exploreAction;

    const reason = await new Promise((resolve) => {
      sessionResolve = resolve;
      startSession();
    });
    ui.hideDialogue();
    ui.closeScreen();
    audio.stopMusic(0.5);
    if (reason === 'title') {
      await wait(120);
      continue;
    }
  }
}

boot();
