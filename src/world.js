/* =========================================================================
   AURORA PARTIDA — overworld: maps, movement, props, interaction
   ========================================================================= */
'use strict';

const ENCOUNTER_TABLES = {
  campos: {
    rate: .17, tiles: [':'], minSteps: 9,
    groups: [['lobo'], ['lobo', 'lobo'], ['salteador'], ['lobo', 'salteador']],
    bg: 'forest'
  },
  capital: {
    rate: .08, tiles: ['P'], minSteps: 14,
    when: s => !!s.flags.darkCapital && !s.flags.kaelDefeated,
    groups: [['salteador', 'salteador'], ['guarda']],
    bg: 'plains'
  }
};

/* --------------------------------------------------------------- map load */
function loadMap(id, tx, ty, dir, opts) {
  opts = opts || {};
  const map = MAPS[id];
  if (!map) { console.error('Mapa desconhecido', id); return; }
  const s = G.state;
  const dark = s && s.flags.darkCapital && (id === 'capital' || id === 'castelo');
  const theme = dark ? 'ruined' : map.theme;

  G.map = id;
  G.mapTheme = theme;
  G.mapCanvas = bakeMap(map, theme);
  G.mapDark = !!dark;
  G.mapId = id;
  G.player = {
    x: tx == null ? map.spawn.x : tx,
    y: ty == null ? map.spawn.y : ty,
    dir: dir || map.spawn.dir || 'down',
    move: null,
    walk: 0
  };
  if (s) {
    s.map = id;
    s.player = { x: G.player.x, y: G.player.y, dir: G.player.dir };
  }
  refreshWorldEntities();
  const wantMusic = opts.music || (dark ? 'castle' : map.music);
  AUDIO.playTrack(wantMusic);
  if (!opts.silent) showBanner(map.name, map.subtitle);
}

function refreshWorldEntities() {
  const map = MAPS[G.map];
  if (!map) return;
  const s = G.state;
  G.npcs = (map.npcs || []).filter(n => !n.when || n.when(s)).map(n => ({ ...n }));
  G.objects = (map.objects || []).filter(o => !o.when || o.when(s)).map(o => {
    const key = G.map + ':' + o.id;
    return { ...o, opened: !!(s.opened && s.opened[key]) };
  });
  G.decor = (map.decor || []).filter(d => !d.when || d.when(s)).map(d => ({ ...d }));
  G.lights = map.lights || [];
}

/* -------------------------------------------------------------- collisions */
function tileAt(x, y) {
  const map = MAPS[G.map];
  if (!map || x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return null;
  return map.grid[y][x];
}

function npcAt(x, y) {
  return G.npcs.find(n => n.x === x && n.y === y) || null;
}
function objectAt(x, y) {
  return G.objects.find(o => o.x === x && o.y === y) || null;
}

function canWalk(x, y) {
  const ch = tileAt(x, y);
  if (!ch || !WALKABLE.has(ch)) return false;
  const npc = npcAt(x, y);
  if (npc && npc.solid !== false) return false;
  const obj = objectAt(x, y);
  if (obj && (obj.type === 'chest' || obj.type === 'story')) return false;
  return true;
}

/* ---------------------------------------------------------------- movement */
function updateWorld(dt) {
  if (!G.state) return;
  if (G.fade) return;

  if (G.pressed.cancel && !G.cutscene) {
    openPauseMenu();
    return;
  }
  if (G.cutscene) return;

  const p = G.player;
  if (p.move) {
    const m = p.move;
    m.t += dt;
    p.walk += dt * 11;
    const k = clamp(m.t / m.dur, 0, 1);
    p.x = lerp(m.fromX, m.toX, k);
    p.y = lerp(m.fromY, m.toY, k);
    if (k >= 1) {
      p.x = m.toX; p.y = m.toY; p.move = null;
      onPlayerStep(m.toX, m.toY);
    }
    return;
  }

  let dir = null;
  if (G.down.up) dir = 'up';
  else if (G.down.down) dir = 'down';
  else if (G.down.left) dir = 'left';
  else if (G.down.right) dir = 'right';
  if (dir) {
    p.dir = dir;
    const d = DIRS[dir];
    const nx = Math.round(p.x) + d.x;
    const ny = Math.round(p.y) + d.y;
    if (canWalk(nx, ny)) {
      p.move = { fromX: Math.round(p.x), fromY: Math.round(p.y), toX: nx, toY: ny, t: 0, dur: .145 };
      p.walk = 0;
    }
  }

  if (G.pressed.action && !G.cutscene) {
    tryInteract();
  }
}

function onPlayerStep(x, y) {
  const s = G.state;
  s.steps = (s.steps || 0) + 1;
  s.player = { x, y, dir: G.player.dir };
  if (s.steps % 3 === 0) AUDIO.sfx('step');

  const warp = (MAPS[G.map].warps || []).find(w => w.x === x && w.y === y);
  if (warp) {
    travelTo(warp.to, warp.tx, warp.ty, warp.dir, { label: warp.label });
    return;
  }

  const tileTriggered = typeof storyCheckTile === 'function' ? storyCheckTile(x, y) : false;
  if (!tileTriggered) {
    const prox = typeof storyCheckProximity === 'function' ? storyCheckProximity() : false;
    if (!prox) maybeEncounter();
  }
}

/* --------------------------------------------------------------- travel */
async function travelTo(mapId, tx, ty, dir, opts) {
  opts = opts || {};
  G.cutscene = true;
  await fadeOut(opts.fadeOut || .34);
  loadMap(mapId, tx, ty, dir, opts);
  await fadeIn(opts.fadeIn || .4);
  if (!opts.noStory && typeof storyOnEnterMap === 'function') {
    await storyOnEnterMap(mapId, opts);
  }
  G.cutscene = false;
}

/* -------------------------------------------------------------- encounters */
function maybeEncounter() {
  if (!G.state || G.scene !== 'world' || G.cutscene || G.dialog) return;
  const table = ENCOUNTER_TABLES[G.map];
  if (!table) return;
  if (table.when && !table.when(G.state)) return;
  const ch = tileAt(Math.round(G.player.x), Math.round(G.player.y));
  if (table.tiles && !table.tiles.includes(ch)) return;
  const steps = G.state.steps || 0;
  if (steps < (table.minSteps || 8)) return;
  if (steps - (G.state.lastEncounter || 0) < (table.minSteps || 8)) return;
  if (Math.random() > table.rate) return;
  G.state.lastEncounter = steps;
  const group = table.groups[Math.floor(Math.random() * table.groups.length)];
  if (typeof runRandomEncounter === 'function') runRandomEncounter(group, table.bg);
}

/* ------------------------------------------------------------- interaction */
function facingTile() {
  const p = G.player;
  const d = DIRS[p.dir] || DIRS.down;
  return { x: Math.round(p.x) + d.x, y: Math.round(p.y) + d.y };
}

function tryInteract() {
  if (!G.state || G.cutscene || G.dialog || G.menu) return;
  const f = facingTile();
  const npc = npcAt(f.x, f.y);
  if (npc) {
    refreshWorldEntities();
    if (typeof storyInteractNPC === 'function') storyInteractNPC(npc);
    return;
  }
  const obj = objectAt(f.x, f.y);
  if (obj) {
    if (typeof storyInteractObject === 'function') storyInteractObject(obj);
    return;
  }
  if (typeof storyInteractTile === 'function' && storyInteractTile(f.x, f.y)) return;
  // runas e altares também funcionam se o herói estiver em cima
  const p = G.player;
  if (typeof storyInteractTile === 'function') storyInteractTile(Math.round(p.x), Math.round(p.y));
}

function interactableAt(x, y) {
  if (npcAt(x, y)) return true;
  if (objectAt(x, y)) return true;
  if (typeof storyTilePrompt === 'function' && storyTilePrompt(x, y)) return true;
  return false;
}

/* ---------------------------------------------------------------- drawing */
function drawWorld(ctx) {
  const map = MAPS[G.map];
  if (!map || !G.mapCanvas) return;

  ctx.drawImage(G.mapCanvas, 0, 0);

  if (G.mapDark) {
    ctx.save();
    const burn = ctx.createLinearGradient(0, 0, 0, 600);
    burn.addColorStop(0, 'rgba(38,10,22,.18)');
    burn.addColorStop(.55, 'rgba(20,8,18,.30)');
    burn.addColorStop(1, 'rgba(8,4,12,.42)');
    ctx.fillStyle = burn; ctx.fillRect(0, 0, 960, 600);
    ctx.restore();
  }

  const amb = G.mapDark ? 'ruined' : map.theme;
  drawMapAmbience(ctx, amb, G.time, G.state);

  // objeto/entidade desenháveis ordenados por profundidade
  const drawables = [];
  for (const d of G.decor) {
    drawables.push({ y: (d.y + 1) * TILE - 4, kind: 'decor', ref: d });
  }
  for (const o of G.objects) {
    drawables.push({ y: (o.y + 1) * TILE - 4, kind: 'object', ref: o });
  }
  for (const n of G.npcs) {
    drawables.push({ y: (n.y + 1) * TILE - 3, kind: 'npc', ref: n });
  }
  drawables.push({ y: (G.player.y + 1) * TILE - 3, kind: 'player', ref: G.player });
  drawables.sort((a, b) => a.y - b.y);

  for (const item of drawables) {
    if (item.kind === 'decor') drawDecor(ctx, item.ref);
    else if (item.kind === 'object') drawWorldObject(ctx, item.ref);
    else if (item.kind === 'npc') drawNpc(ctx, item.ref);
    else drawPlayer(ctx);
  }

  drawLighting(ctx, map);
  drawInteractHint(ctx, map);
  vignette(ctx, G.mapDark ? .55 : .34);
}

function drawNpc(ctx, npc) {
  const cx = (npc.x + .5) * TILE;
  const baseY = (npc.y + 1) * TILE - 4;
  const look = npc.look || 'rowan';
  ctx.save();
  drawHumanoid(ctx, cx, baseY, look, npc.dir || 'down', 0, 1.56, { t: G.time, seed: npc.x * 3 + npc.y });
  ctx.restore();
  // aura sutil para personagens importantes
  if (npc.id === 'liria' || npc.id === 'liria_ruins' || npc.id === 'kael_final') {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, cx, baseY - 34, 32, npc.id === 'kael_final' ? 'rgba(255,180,80,.12)' : 'rgba(255,170,200,.10)', .6);
    ctx.restore();
  }
}

function drawPlayer(ctx) {
  const p = G.player;
  const k = p.move ? clamp(p.move.t / p.move.dur, 0, 1) : 0;
  const cx = (p.x + .5) * TILE;
  const baseY = (p.y + 1) * TILE - 3;
  const walk = p.move ? Math.sin(k * Math.PI) * 1.4 : 0;
  const look = G.state && G.state.flags.hasBlade ? 'rowanHero' : 'rowan';
  drawHumanoid(ctx, cx, baseY, look, p.dir, walk, 1.58, { t: G.time, seed: 7 });
  if (G.state && G.state.flags.hasBlade) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, cx, baseY - 36, 30, 'rgba(150,220,255,.10)', .5);
    ctx.restore();
  }
}

function drawWorldObject(ctx, o) {
  const cx = (o.x + .5) * TILE;
  const by = (o.y + 1) * TILE - 4;
  if (o.type === 'chest') {
    drawChest(ctx, cx, by, o.opened, G.time);
  } else if (o.type === 'flower') {
    drawFlower(ctx, cx, by - 10, G.time);
  } else if (o.type === 'story') {
    // pedestal com a espada do pai
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ellipse(ctx, cx, by + 2, 18, 5); ctx.fill();
    ctx.fillStyle = '#4a3a2c'; ctx.fillRect(cx - 14, by - 12, 28, 13);
    ctx.fillStyle = '#6b5138'; ctx.fillRect(cx - 12, by - 15, 24, 5);
    ctx.fillStyle = '#b8c8d8'; ctx.fillRect(cx - 1.5, by - 58, 3, 40);
    ctx.fillStyle = '#e8cf90'; ctx.fillRect(cx - 8, by - 22, 16, 4);
    ctx.fillStyle = '#8a5a30'; ctx.fillRect(cx - 2, by - 18, 4, 8);
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, cx, by - 40, 34, 'rgba(180,220,255,.18)', .7);
    ctx.restore();
  } else if (o.type === 'sign') {
    drawSignpost(ctx, cx, by - 2);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, cx, by - 24, 18, 'rgba(240,220,160,.07)', .5);
    ctx.restore();
  }
}

/* ------------------------------------------------------------------ props */
function drawDecor(ctx, d) {
  const cx = (d.x + .5) * TILE;
  const by = (d.y + 1) * TILE - 4;
  const t = G.time;
  switch (d.type) {
    case 'lantern': {
      ctx.save();
      ctx.fillStyle = '#2c261e'; ctx.fillRect(cx - 1.5, by - 34, 3, 34);
      ctx.fillStyle = '#4a3c28'; ctx.fillRect(cx - 8, by - 38, 16, 5);
      const flick = .65 + Math.sin(t * 4 + cx) * .16;
      ctx.fillStyle = `rgba(255,208,120,${flick})`;
      ctx.fillRect(cx - 3.5, by - 31, 7, 10);
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, cx, by - 26, 28, 'rgba(255,190,90,.23)', .9);
      ctx.restore();
      break;
    }
    case 'signpost':
      drawSignpost(ctx, cx, by);
      break;
    case 'banner': {
      ctx.save();
      const w = 18, h = 50;
      ctx.fillStyle = G.mapDark ? '#4a1e28' : '#6e2432';
      ctx.beginPath(); ctx.moveTo(cx - w / 2, by - 92);
      ctx.lineTo(cx + w / 2, by - 92); ctx.lineTo(cx + w / 2, by - 52);
      ctx.lineTo(cx, by - 42); ctx.lineTo(cx - w / 2, by - 52); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#d8b56a'; ctx.fillRect(cx - 9, by - 90, 18, 3);
      ctx.fillStyle = 'rgba(216,181,106,.8)'; diamond(ctx, cx, by - 70, 4, 'rgba(216,181,106,.8)');
      ctx.strokeStyle = 'rgba(255,240,200,.12)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx - 5, by - 86); ctx.lineTo(cx - 5, by - 54); ctx.stroke();
      ctx.restore();
      break;
    }
    case 'stall': {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ellipse(ctx, cx, by + 2, 30, 7); ctx.fill();
      ctx.fillStyle = '#5a4130'; ctx.fillRect(cx - 24, by - 34, 3, 36); ctx.fillRect(cx + 21, by - 34, 3, 36);
      const cols = ['#8f4e42', '#c9a86a', '#7a5548'];
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = cols[i % cols.length];
        ctx.beginPath(); ctx.moveTo(cx - 28 + i * 14, by - 48);
        ctx.lineTo(cx - 14 + i * 14, by - 48); ctx.lineTo(cx - 12 + i * 14, by - 35);
        ctx.lineTo(cx - 26 + i * 14, by - 35); ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = '#7a5a3a'; ctx.fillRect(cx - 22, by - 32, 44, 12);
      ctx.fillStyle = '#a8783e'; ctx.fillRect(cx - 18, by - 35, 8, 5); ctx.fillRect(cx + 2, by - 35, 7, 5);
      ctx.restore();
      break;
    }
    case 'fire': {
      ctx.save();
      for (let i = 0; i < 9; i++) {
        const a = t * (2.2 + i * .17) + i;
        const fx = cx + Math.sin(a) * (4 + i * 1.2);
        const fy = by - 8 - ((t * (18 + i * 2) + i * 13) % 30);
        ctx.fillStyle = `rgba(255,${110 + i * 12},60,${.5 - i * .035})`;
        ctx.beginPath(); ctx.ellipse(fx, fy, 5 - i * .35, 9 - i * .55, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#3a2418';
      ctx.fillRect(cx - 11, by - 5, 22, 4);
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, cx, by - 16, 52, 'rgba(255,130,50,.24)', .8);
      ctx.restore();
      break;
    }
    case 'rubble': {
      ctx.save();
      ctx.fillStyle = '#4a3f3a';
      for (let i = 0; i < 7; i++) {
        const rx = cx - 18 + hash(i * 4.1 + d.x) * 36;
        const ry = by - 2 - hash(i * 6.3 + d.y) * 10;
        ctx.fillRect(rx, ry, 4 + hash(i) * 7, 3 + hash(i + 2) * 4);
      }
      ctx.restore();
      break;
    }
    case 'window': {
      ctx.save();
      ctx.fillStyle = 'rgba(255,220,140,.16)';
      ctx.fillRect(cx - 10, by - 88, 20, 30);
      ctx.strokeStyle = 'rgba(216,181,106,.3)'; ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - 10, by - 88, 20, 30);
      ctx.beginPath(); ctx.moveTo(cx, by - 88); ctx.lineTo(cx, by - 58); ctx.moveTo(cx - 10, by - 74); ctx.lineTo(cx + 10, by - 74); ctx.stroke();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, cx, by - 73, 34, 'rgba(255,210,130,.10)', .6);
      ctx.restore();
      break;
    }
    case 'candle': {
      ctx.save();
      ctx.fillStyle = '#e8d8b0'; ctx.fillRect(cx - 2, by - 14, 4, 10);
      ctx.fillStyle = 'rgba(255,220,130,.95)'; ellipse(ctx, cx, by - 17, 2.1, 3.4); ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, cx, by - 18, 20, 'rgba(255,200,100,.2)', .8);
      ctx.restore();
      break;
    }
    case 'torch': {
      ctx.save();
      ctx.fillStyle = '#3d2a1c'; ctx.fillRect(cx - 2, by - 52, 4, 22);
      const f = .7 + Math.sin(t * 7 + cx) * .2;
      ctx.fillStyle = `rgba(255,160,70,${f})`;
      ctx.beginPath(); ctx.ellipse(cx, by - 58, 5, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(255,230,150,${f * .8})`;
      ctx.beginPath(); ctx.ellipse(cx, by - 60, 2.5, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, cx, by - 56, 42, 'rgba(255,150,60,.22)', .8);
      ctx.restore();
      break;
    }
    case 'chains': {
      ctx.save();
      ctx.strokeStyle = 'rgba(150,155,165,.5)'; ctx.lineWidth = 2;
      for (let c = 0; c < 2; c++) {
        const x = cx - 8 + c * 16;
        ctx.beginPath(); ctx.moveTo(x, by - 100); ctx.lineTo(x, by - 44);
        for (let i = 0; i < 8; i++) {
          ctx.beginPath(); ctx.arc(x, by - 96 + i * 7, 2.4, 0, Math.PI * 2); ctx.stroke();
        }
      }
      ctx.restore();
      break;
    }
    case 'crates': {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ellipse(ctx, cx, by + 2, 22, 5); ctx.fill();
      ctx.fillStyle = '#6b4b2e'; ctx.fillRect(cx - 19, by - 24, 22, 24); ctx.fillRect(cx + 2, by - 18, 18, 18);
      ctx.strokeStyle = 'rgba(230,200,150,.13)'; ctx.lineWidth = 1;
      ctx.strokeRect(cx - 19, by - 24, 22, 24); ctx.strokeRect(cx + 2, by - 18, 18, 18);
      ctx.beginPath(); ctx.moveTo(cx - 19, by - 24); ctx.lineTo(cx + 3, by); ctx.moveTo(cx + 3, by - 24); ctx.lineTo(cx - 19, by); ctx.stroke();
      ctx.restore();
      break;
    }
    case 'stairs': {
      ctx.save();
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i % 2 ? '#5b5560' : '#4b4650';
        ctx.fillRect(cx - 22 + i * 3, by - 6 - i * 5, 44 - i * 6, 5);
      }
      ctx.restore();
      break;
    }
    case 'runeGlow': {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, cx, by - 8, 44 + Math.sin(t * 2 + cx) * 4, 'rgba(130,220,255,.20)', .7);
      ctx.strokeStyle = 'rgba(150,230,255,.35)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.ellipse(cx, by - 8, 23, 8, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      break;
    }
    default:
      break;
  }
}

/* ----------------------------------------------------------------- lights */
function drawLighting(ctx, map) {
  const dark = map.theme === 'prison' || map.theme === 'temple' || map.theme === 'castle' || G.mapDark;
  if (!dark) return;
  ctx.save();
  ctx.fillStyle = G.mapDark ? 'rgba(10,5,14,.34)' : 'rgba(4,7,14,.34)';
  ctx.fillRect(0, 0, 960, 600);
  ctx.globalCompositeOperation = 'lighter';
  for (const L of G.lights) {
    const lx = (L[0] + .5) * TILE;
    const ly = (L[1] + .5) * TILE;
    const r = L[2] * (0.94 + Math.sin(G.time * 2 + L[0]) * .05);
    const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, r);
    g.addColorStop(0, G.mapDark ? 'rgba(255,130,70,.20)' : 'rgba(255,205,130,.17)');
    g.addColorStop(.55, G.mapDark ? 'rgba(200,70,50,.07)' : 'rgba(190,160,100,.06)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(lx, ly, r, 0, Math.PI * 2); ctx.fill();
  }
  for (const d of G.decor) {
    if (d.type === 'torch' || d.type === 'fire' || d.type === 'candle' || d.type === 'lantern') {
      const lx = (d.x + .5) * TILE;
      const ly = (d.y + .5) * TILE;
      const r = d.type === 'fire' ? 72 : d.type === 'torch' ? 64 : 48;
      const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, r);
      g.addColorStop(0, 'rgba(255,175,90,.18)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(lx, ly, r, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

function drawInteractHint(ctx, map) {
  if (G.dialog || G.cutscene) return;
  const f = facingTile();
  if (!interactableAt(f.x, f.y)) return;
  const cx = (f.x + .5) * TILE;
  const by = (f.y + 1) * TILE;
  const bob = Math.sin(G.time * 4) * 3;
  ctx.save();
  ctx.globalAlpha = .9;
  ctx.fillStyle = 'rgba(255,225,154,.92)';
  ctx.beginPath();
  ctx.moveTo(cx, by - 78 + bob);
  ctx.lineTo(cx - 6, by - 88 + bob);
  ctx.lineTo(cx + 6, by - 88 + bob);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,240,200,.35)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx - 2, by - 93 + bob, 7, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}
