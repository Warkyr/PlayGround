/* =========================================================================
   AURORA PARTIDA — renderer base: palettes, tiles, map baking, props
   ========================================================================= */
'use strict';

const F_SERIF = '"Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif';
const F_BODY = 'Verdana, "Trebuchet MS", Geneva, sans-serif';
const F_MONO = '"Courier New", Courier, monospace';

const PALETTES = {
  village: {
    grass: '#3d6044', grassD: '#35553b', tuft: '#5c8455', tuftD: '#2c4a33',
    flower: ['#e8d38a', '#e9a7bd', '#c9d8f0'],
    path: '#9a8058', pathD: '#7f6743', pathL: '#b3986c',
    stone: '#8b8875', stoneD: '#6f6c5b', stoneL: '#a5a18a',
    water: '#46748c', waterD: '#30576d', waterL: '#7fb3c4',
    roof: '#914f41', roofD: '#6d382f', roofL: '#ad6653',
    wall: '#d2bd94', wallD: '#a38f6b', timber: '#654b38',
    tree: '#2f5136', treeD: '#243f2a', treeL: '#48714a', trunk: '#5b4230',
    fog: 'rgba(38,62,86,0.18)', sky: '#1a2237', accent: '#e0bd72'
  },
  fields: {
    grass: '#3a5e40', grassD: '#325138', tuft: '#5a8650', tuftD: '#294630',
    flower: ['#e7d98e', '#e5b2c6', '#b9d7e8'],
    path: '#93794f', pathD: '#78613c', pathL: '#ad9365',
    stone: '#84806d', stoneD: '#676455', stoneL: '#9c9782',
    water: '#3f7590', waterD: '#2b556d', waterL: '#77b4c8',
    roof: '#8b5040', roofD: '#68382d', roofL: '#a4624e',
    wall: '#cbb68e', wallD: '#9d8966', timber: '#5f4634',
    tree: '#2b4c34', treeD: '#203a28', treeL: '#436a46', trunk: '#553d2b',
    fog: 'rgba(44,78,92,0.16)', sky: '#101a2b', accent: '#e0bd72'
  },
  capital: {
    grass: '#3d5a43', grassD: '#35503c', tuft: '#5b7f52', tuftD: '#2c4632',
    flower: ['#e8d38a', '#e6b0c2', '#c6d8ef'],
    path: '#918a76', pathD: '#736d5c', pathL: '#aaa38c',
    stone: '#8f8b78', stoneD: '#706d5e', stoneL: '#aaa58f',
    water: '#48768d', waterD: '#32596d', waterL: '#83b6c6',
    roof: '#8e5142', roofD: '#6b382e', roofL: '#a96652',
    wall: '#c9b892', wallD: '#9b8a68', timber: '#604735',
    tree: '#2f4e36', treeD: '#243d2a', treeL: '#476b48', trunk: '#58402e',
    fog: 'rgba(54,64,88,0.14)', sky: '#1b2034', accent: '#e0bd72'
  },
  castle: {
    grass: '#3d3a3c', grassD: '#333032', tuft: '#555152', tuftD: '#2b282a',
    flower: ['#d8b56a', '#c98a9a', '#8fa8c8'],
    path: '#4a4344', pathD: '#383233', pathL: '#5c5354',
    stone: '#494243', stoneD: '#373132', stoneL: '#5d5556',
    water: '#3d4c5a', waterD: '#2b3742', waterL: '#6c8292',
    roof: '#5b2a31', roofD: '#3f1c22', roofL: '#743840',
    wall: '#3b333c', wallD: '#2a242d', timber: '#6d5636',
    tree: '#2d3430', treeD: '#222825', treeL: '#3f4842', trunk: '#453736',
    rug: '#7c2c34', rugD: '#571d24', rugL: '#9c424a', gold: '#d8b56a',
    fog: 'rgba(50,36,60,0.22)', sky: '#181322', accent: '#e0bd72'
  },
  castleDark: {
    grass: '#302b32', grassD: '#282429', tuft: '#463f48', tuftD: '#201d21',
    flower: ['#9a7ab0', '#a05a70', '#6a7fa0'],
    path: '#3e363d', pathD: '#2e282e', pathL: '#50464e',
    stone: '#3d363f', stoneD: '#2e282f', stoneL: '#4f4752',
    water: '#343b50', waterD: '#232839', waterL: '#5d6a8a',
    roof: '#4a2029', roofD: '#2f1218', roofL: '#682d38',
    wall: '#312a36', wallD: '#221d26', timber: '#5d4638',
    tree: '#262a2c', treeD: '#1b1e20', treeL: '#353b3c', trunk: '#3b3032',
    rug: '#5e1e2a', rugD: '#3e111a', rugL: '#83303e', gold: '#b48ae0',
    fog: 'rgba(66,30,72,0.28)', sky: '#140e1e', accent: '#b48ae0'
  },
  prison: {
    grass: '#35373b', grassD: '#2d2f33', tuft: '#4b4e54', tuftD: '#26282b',
    flower: ['#8a8f80', '#8f7f80', '#7c8b96'],
    path: '#3a3c40', pathD: '#2c2e31', pathL: '#4b4e53',
    stone: '#3b3d41', stoneD: '#2d2f33', stoneL: '#4e5055',
    water: '#2f4a54', waterD: '#203740', waterL: '#52798a',
    roof: '#3c3030', roofD: '#2a2121', roofL: '#4f3e3e',
    wall: '#2c2d32', wallD: '#1f2024', timber: '#4b4038',
    tree: '#2a3030', treeD: '#1e2323', treeL: '#3c4545', trunk: '#3b3330',
    fog: 'rgba(10,14,20,0.32)', sky: '#080b11', accent: '#c08a72'
  },
  temple: {
    grass: '#384454', grassD: '#2d3846', tuft: '#4f6074', tuftD: '#26303c',
    flower: ['#8fe0ff', '#b9a8f0', '#e0d8a0'],
    path: '#4a5568', pathD: '#37404f', pathL: '#61708a',
    stone: '#4a5568', stoneD: '#384252', stoneL: '#62718a',
    water: '#355a7a', waterD: '#243f57', waterL: '#79b8d8',
    roof: '#39405c', roofD: '#272c42', roofL: '#4c5578',
    wall: '#222a3e', wallD: '#161c2b', timber: '#4e5a74',
    tree: '#28323a', treeD: '#1d252b', treeL: '#39474f', trunk: '#3d444a',
    fog: 'rgba(20,34,64,0.28)', sky: '#070b18', accent: '#8fe0ff'
  },
  ruined: {
    grass: '#3a3234', grassD: '#302a2c', tuft: '#544548', tuftD: '#261f21',
    flower: ['#c08a5a', '#a05a60', '#6a6a80'],
    path: '#5a4741', pathD: '#42332f', pathL: '#725c53',
    stone: '#5a4e48', stoneD: '#423936', stoneL: '#73645c',
    water: '#3c4148', waterD: '#282c31', waterL: '#6a747c',
    roof: '#5a2c26', roofD: '#3c1b18', roofL: '#7c3c32',
    wall: '#4a3d38', wallD: '#332926', timber: '#4f3a2d',
    tree: '#2c2724', treeD: '#201c1a', treeL: '#403834', trunk: '#332a26',
    fog: 'rgba(70,24,20,0.26)', sky: '#1a0f14', accent: '#e0a05a'
  }
};

/* ------------------------------------------------------------- primitives */
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function lerp(a, b, t) { return a + (b - a) * t; }
function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
function easeIn(t) { return t * t * t; }
function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}
function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); }
function ellipse(ctx, x, y, rx, ry) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); }
function line(ctx, x1, y1, x2, y2, color, width = 1) {
  ctx.strokeStyle = color; ctx.lineWidth = width;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}

function wrapLines(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (ctx.measureText(test).width > maxWidth && cur) { lines.push(cur); cur = w; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

function drawText(ctx, text, x, y, o = {}) {
  const size = o.size || 16;
  ctx.save();
  ctx.font = `${o.weight || ''} ${size}px ${o.font || F_BODY}`.trim();
  ctx.fillStyle = o.color || '#f4e9cf';
  ctx.textAlign = o.align || 'left';
  ctx.textBaseline = o.baseline || 'alphabetic';
  ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
  if (o.shadow) {
    ctx.shadowColor = o.shadow;
    ctx.shadowBlur = o.shadowBlur || 8;
  }
  if (o.stroke) {
    ctx.lineWidth = o.strokeWidth || 3;
    ctx.strokeStyle = o.stroke;
    ctx.lineJoin = 'round';
    ctx.strokeText(text, x, y);
  }
  ctx.fillText(text, x, y);
  ctx.restore();
}

function spacedText(ctx, text, x, y, spacing, o = {}) {
  ctx.save();
  ctx.font = `${o.weight || ''} ${o.size || 40}px ${o.font || F_SERIF}`.trim();
  ctx.textAlign = 'left'; ctx.textBaseline = o.baseline || 'alphabetic';
  ctx.fillStyle = o.color || '#e8d3a0';
  if (o.shadow) { ctx.shadowColor = o.shadow; ctx.shadowBlur = o.shadowBlur || 12; }
  let total = 0;
  for (const ch of text) total += ctx.measureText(ch).width + spacing;
  total -= spacing;
  let cx = o.align === 'center' ? x - total / 2 : o.align === 'right' ? x - total : x;
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    if (o.stroke) ctx.strokeText(ch, cx, y);
    cx += ctx.measureText(ch).width + spacing;
  }
  ctx.restore();
  return total;
}

function drawBar(ctx, x, y, w, h, pct, colA, colB, o = {}) {
  pct = clamp(pct, 0, 1);
  ctx.save();
  rr(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = o.bg || 'rgba(6,9,16,.8)';
  ctx.fill();
  if (pct > 0) {
    ctx.save();
    rr(ctx, x + 1, y + 1, Math.max(1, (w - 2) * pct), h - 2, (h - 2) / 2);
    ctx.clip();
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, colA); g.addColorStop(1, colB);
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,255,255,.22)';
    ctx.fillRect(x, y + 1, w, Math.max(1, h * 0.32));
    ctx.restore();
  }
  rr(ctx, x, y, w, h, h / 2);
  ctx.strokeStyle = o.border || 'rgba(216,181,106,.35)';
  ctx.lineWidth = 1; ctx.stroke();
  ctx.restore();
}

function panel(ctx, x, y, w, h, o = {}) {
  ctx.save();
  rr(ctx, x, y, w, h, o.r == null ? 10 : o.r);
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, o.top || 'rgba(20,26,44,.94)');
  g.addColorStop(1, o.bottom || 'rgba(8,11,20,.96)');
  ctx.fillStyle = g; ctx.fill();
  ctx.lineWidth = o.borderWidth || 1.5;
  ctx.strokeStyle = o.border || 'rgba(216,181,106,.55)';
  ctx.stroke();
  if (o.inner !== false) {
    rr(ctx, x + 3.5, y + 3.5, w - 7, h - 7, Math.max(2, (o.r == null ? 10 : o.r) - 3));
    ctx.strokeStyle = o.innerColor || 'rgba(255,236,190,.13)';
    ctx.lineWidth = 1; ctx.stroke();
  }
  if (o.ornaments !== false) {
    const cs = o.corner || 'rgba(216,181,106,.75)';
    for (const [cx, cy] of [[x + 9, y + 9], [x + w - 9, y + 9], [x + 9, y + h - 9], [x + w - 9, y + h - 9]]) {
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.PI / 4);
      ctx.fillStyle = cs; ctx.fillRect(-2.2, -2.2, 4.4, 4.4); ctx.restore();
    }
  }
  ctx.restore();
}

function diamond(ctx, x, y, r, color) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4);
  ctx.fillStyle = color; ctx.fillRect(-r, -r, r * 2, r * 2);
  ctx.restore();
}

function glow(ctx, x, y, r, color, alpha = 1) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function seeded(n) { return hash(n) - 0.5; }

/* ------------------------------------------------------------------ tiles */
function drawGrass(ctx, x, y, P, seed, variant) {
  const w = TILE, h = TILE;
  ctx.fillStyle = P.grass; ctx.fillRect(x, y, w, h);
  if (variant === 2) { ctx.fillStyle = 'rgba(255,255,255,.02)'; ctx.fillRect(x, y, w, h); }
  const n = 3 + Math.floor(hash(seed) * 3);
  for (let i = 0; i < n; i++) {
    const gx = x + 4 + hash(seed + i * 3.7) * (w - 8);
    const gy = y + 7 + hash(seed + i * 5.1) * (h - 12);
    ctx.strokeStyle = i % 2 ? P.tuft : P.tuftD;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(gx, gy + 3); ctx.quadraticCurveTo(gx - 1, gy, gx - 2, gy - 3);
    ctx.moveTo(gx, gy + 3); ctx.quadraticCurveTo(gx + 2, gy, gx + 3, gy - 3);
    ctx.stroke();
  }
  if (variant === 3) {
    const fx = x + 10 + hash(seed + 2) * 20, fy = y + 10 + hash(seed + 9) * 20;
    const cols = P.flower;
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2;
      ctx.fillStyle = cols[Math.floor(hash(seed + i) * cols.length)];
      circle(ctx, fx + Math.cos(a) * 2.2, fy + Math.sin(a) * 2.2, 1.7); ctx.fill();
    }
    ctx.fillStyle = '#f0d890'; circle(ctx, fx, fy, 1.3); ctx.fill();
  }
  if (variant === 4) {
    ctx.strokeStyle = P.tuftD; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x + 12, y + 30); ctx.lineTo(x + 12, y + 18);
    ctx.moveTo(x + 26, y + 32); ctx.lineTo(x + 26, y + 21); ctx.stroke();
  }
}

function drawTallGrass(ctx, x, y, P, seed) {
  drawGrass(ctx, x, y, P, seed, 1);
  ctx.save();
  ctx.strokeStyle = P.tuft; ctx.lineWidth = 1.6;
  for (let i = 0; i < 9; i++) {
    const gx = x + 3 + hash(seed + i * 2.3) * (TILE - 6);
    const gy = y + TILE - 2;
    const hgt = 13 + hash(seed + i * 7) * 15;
    ctx.strokeStyle = i % 3 === 0 ? P.tuftD : P.tuft;
    ctx.beginPath(); ctx.moveTo(gx, gy); ctx.quadraticCurveTo(gx - 3, gy - hgt * 0.6, gx - 5, gy - hgt); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(gx, gy); ctx.quadraticCurveTo(gx + 2, gy - hgt * 0.5, gx + 4, gy - hgt * 0.85); ctx.stroke();
  }
  ctx.restore();
}

function drawPath(ctx, x, y, P, seed, stoneish) {
  ctx.fillStyle = stoneish ? P.stone : P.path;
  ctx.fillRect(x, y, TILE, TILE);
  if (stoneish) {
    ctx.strokeStyle = 'rgba(0,0,0,.16)'; ctx.lineWidth = 1;
    const off = (Math.floor(x / TILE) % 2) * 10;
    ctx.beginPath();
    ctx.moveTo(x, y + 14); ctx.lineTo(x + TILE, y + 14);
    ctx.moveTo(x, y + 29); ctx.lineTo(x + TILE, y + 29);
    ctx.moveTo(x + 13 + off, y); ctx.lineTo(x + 13 + off, y + 14);
    ctx.moveTo(x + 27 - off, y + 14); ctx.lineTo(x + 27 - off, y + 29);
    ctx.moveTo(x + 8 + off, y + 29); ctx.lineTo(x + 8 + off, y + TILE);
    ctx.stroke();
  } else {
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i % 2 ? 'rgba(255,240,200,.10)' : 'rgba(40,26,14,.12)';
      ellipse(ctx, x + 5 + hash(seed + i * 2.1) * 30, y + 6 + hash(seed + i * 4.3) * 28, 2 + hash(seed + i) * 2.4, 1.3); ctx.fill();
    }
  }
  ctx.strokeStyle = 'rgba(20,14,8,.10)'; ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, TILE - 2, TILE - 2);
}

function drawWater(ctx, x, y, P, seed, t) {
  const g = ctx.createLinearGradient(x, y, x, y + TILE);
  g.addColorStop(0, P.water); g.addColorStop(1, P.waterD);
  ctx.fillStyle = g; ctx.fillRect(x, y, TILE, TILE);
  ctx.save();
  ctx.globalAlpha = .5;
  ctx.strokeStyle = P.waterL; ctx.lineWidth = 1.4;
  const ph = (t || 0) * 1.4 + seed;
  for (let i = 0; i < 3; i++) {
    const wy = y + 9 + i * 10 + Math.sin(ph + i * 1.8) * 2;
    const wx = x + 6 + ((Math.sin(ph * .6 + i) + 1) * 6);
    ctx.beginPath(); ctx.moveTo(wx, wy);
    ctx.quadraticCurveTo(wx + 8, wy - 2, wx + 16, wy); ctx.stroke();
  }
  ctx.restore();
}

function drawBridge(ctx, x, y, P) {
  ctx.fillStyle = P.waterD; ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = '#6b4d34'; ctx.fillRect(x, y, TILE, TILE);
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i % 2 ? '#7a583c' : '#624631';
    ctx.fillRect(x, y + i * 8, TILE, 7);
    ctx.fillStyle = 'rgba(20,12,6,.25)'; ctx.fillRect(x, y + i * 8 + 7, TILE, 1);
  }
  ctx.fillStyle = '#8f6a46'; ctx.fillRect(x, y, 3, TILE); ctx.fillRect(x + TILE - 3, y, 3, TILE);
  ctx.fillStyle = 'rgba(255,220,160,.07)'; ctx.fillRect(x + 3, y, 4, TILE);
}

function drawTree(ctx, x, y, P, seed) {
  drawGrass(ctx, x, y, P, seed, 0);
  ctx.save();
  ctx.fillStyle = 'rgba(10,16,12,.24)';
  ellipse(ctx, x + 20, y + 34, 16, 5); ctx.fill();
  ctx.fillStyle = P.trunk;
  ctx.fillRect(x + 17, y + 20, 6, 16);
  ctx.fillStyle = P.treeD;
  circle(ctx, x + 19, y + 13, 17); ctx.fill();
  ctx.fillStyle = P.tree;
  circle(ctx, x + 15, y + 10, 13); ctx.fill();
  circle(ctx, x + 26, y + 12, 12); ctx.fill();
  circle(ctx, x + 20, y + 20, 12); ctx.fill();
  ctx.fillStyle = P.treeL;
  circle(ctx, x + 14, y + 7, 7); ctx.fill();
  circle(ctx, x + 24, y + 6, 5.5); ctx.fill();
  circle(ctx, x + 26, y + 17, 5); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,220,.08)';
  circle(ctx, x + 11, y + 4, 4); ctx.fill();
  ctx.restore();
}

function drawBush(ctx, x, y, P, seed) {
  drawGrass(ctx, x, y, P, seed, 0);
  ctx.fillStyle = 'rgba(10,16,12,.2)'; ellipse(ctx, x + 20, y + 31, 13, 4); ctx.fill();
  ctx.fillStyle = P.treeD; circle(ctx, x + 14, y + 25, 9); ctx.fill(); circle(ctx, x + 26, y + 26, 8); ctx.fill();
  ctx.fillStyle = P.tree; circle(ctx, x + 20, y + 23, 10); ctx.fill(); circle(ctx, x + 27, y + 20, 6); ctx.fill();
  ctx.fillStyle = P.treeL; circle(ctx, x + 16, y + 19, 5); ctx.fill();
}

function drawHouseWall(ctx, x, y, P, seed, door) {
  ctx.fillStyle = P.wall; ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(x, y + TILE - 5, TILE, 5);
  // vigas de madeira
  ctx.fillStyle = P.timber;
  ctx.fillRect(x, y, 3, TILE); ctx.fillRect(x + TILE - 3, y, 3, TILE);
  ctx.fillRect(x, y + 3, TILE, 3);
  ctx.fillRect(x, y + TILE - 6, TILE, 3);
  if (door) {
    ctx.fillStyle = '#3a2618'; ctx.fillRect(x + 7, y + 8, 26, 30);
    ctx.fillStyle = '#5b3a22'; ctx.fillRect(x + 9, y + 10, 22, 28);
    ctx.fillStyle = 'rgba(255,220,150,.5)';
    ctx.fillRect(x + 12, y + 13, 16, 10);
    ctx.fillStyle = '#7c5a34'; ctx.fillRect(x + 19, y + 10, 2, 27);
    ctx.strokeStyle = 'rgba(20,10,4,.4)'; ctx.strokeRect(x + 9, y + 10, 22, 28);
    ctx.fillStyle = '#d8b56a'; circle(ctx, x + 27, y + 25, 1.6); ctx.fill();
  } else {
    // janela
    ctx.fillStyle = 'rgba(20,14,8,.65)'; ctx.fillRect(x + 10, y + 12, 20, 15);
    ctx.fillStyle = '#f2c977'; ctx.fillRect(x + 12, y + 14, 16, 11);
    ctx.fillStyle = 'rgba(255,255,220,.5)'; ctx.fillRect(x + 13, y + 15, 6, 4);
    ctx.fillStyle = P.timber; ctx.fillRect(x + 19, y + 12, 2, 15); ctx.fillRect(x + 10, y + 18, 20, 2);
    ctx.fillStyle = 'rgba(10,6,2,.35)'; ctx.fillRect(x + 8, y + 27, 24, 2);
  }
}

function drawRoof(ctx, x, y, P, seed) {
  ctx.fillStyle = P.roofD; ctx.fillRect(x, y, TILE, TILE);
  for (let row = 0; row < 4; row++) {
    const oy = y + row * 10;
    for (let col = -1; col < 4; col++) {
      const ox = x + col * 14 + (row % 2 ? 7 : 0);
      ctx.fillStyle = (row + col) % 2 ? P.roof : P.roofL;
      ctx.beginPath();
      ctx.moveTo(ox, oy + 1); ctx.lineTo(ox + 14, oy + 1); ctx.lineTo(ox + 14, oy + 7);
      ctx.quadraticCurveTo(ox + 7, oy + 12, ox, oy + 7); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(20,8,6,.3)'; ctx.lineWidth = 1; ctx.stroke();
    }
  }
  ctx.fillStyle = 'rgba(255,220,180,.08)'; ctx.fillRect(x, y, TILE, 4);
}

function drawFountainTile(ctx, x, y, P, seed) {
  ctx.fillStyle = P.stone; ctx.fillRect(x, y, TILE, TILE);
  ctx.strokeStyle = 'rgba(30,30,30,.22)'; ctx.strokeRect(x + 2, y + 2, TILE - 4, TILE - 4);
  ctx.fillStyle = P.waterD; ctx.fillRect(x + 4, y + 4, TILE - 8, TILE - 8);
  ctx.fillStyle = 'rgba(140,200,220,.18)'; ctx.fillRect(x + 6, y + 6, TILE - 12, 4);
}

function drawWall(ctx, x, y, P, seed, kind) {
  const big = kind === 'castle' || kind === 'prison';
  ctx.fillStyle = P.wall; ctx.fillRect(x, y, TILE, TILE);
  ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = 1.4;
  const bh = big ? 20 : 13;
  for (let row = 0; row < 2; row++) {
    const oy = y + row * bh;
    const off = row % 2 ? 10 : 0;
    ctx.strokeRect(x, oy, TILE, bh);
    ctx.beginPath(); ctx.moveTo(x + 20 + off, oy); ctx.lineTo(x + 20 + off, oy + bh); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,.04)'; ctx.fillRect(x, y, TILE, 3);
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(x, y + TILE - 4, TILE, 4);
  ctx.fillStyle = 'rgba(70,100,60,.15)';
  ellipse(ctx, x + 9 + hash(seed) * 20, y + 12 + hash(seed + 2) * 16, 6, 3); ctx.fill();
  if (kind === 'prison') {
    ctx.fillStyle = 'rgba(10,12,16,.22)'; ctx.fillRect(x + 12, y + 34, 3, 6);
  }
}

function drawBars(ctx, x, y, P) {
  ctx.fillStyle = P.stoneD; ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x, y + 8, TILE, 24);
  ctx.fillStyle = 'rgba(30,34,40,.9)'; ctx.fillRect(x, y, TILE, 8);
  for (let i = 0; i < 5; i++) {
    const bx = x + 4 + i * 8;
    ctx.fillStyle = '#7a818c'; ctx.fillRect(bx, y, 3, TILE);
    ctx.fillStyle = 'rgba(220,230,240,.35)'; ctx.fillRect(bx, y, 1, TILE);
    ctx.fillStyle = '#3b4048'; ctx.fillRect(bx + 2, y, 1, TILE);
  }
  ctx.fillStyle = '#59616c'; ctx.fillRect(x, y + 13, TILE, 3);
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(x, y + 13, TILE, 1);
}

function drawStoneFloor(ctx, x, y, P, seed) {
  ctx.fillStyle = P.stone; ctx.fillRect(x, y, TILE, TILE);
  ctx.strokeStyle = 'rgba(0,0,0,.24)'; ctx.lineWidth = 1;
  const off = (Math.floor(x / TILE) + Math.floor(y / TILE)) % 2 ? 10 : 0;
  ctx.beginPath();
  ctx.moveTo(x + 20 + off, y); ctx.lineTo(x + 20 + off, y + 20);
  ctx.moveTo(x, y + 20); ctx.lineTo(x + 20 + off, y + 20);
  ctx.moveTo(x + 20 + off, y + 20); ctx.lineTo(x + 20 + off, y + TILE);
  ctx.moveTo(x + 20 + off, y + 20); ctx.lineTo(x + TILE, y + 20);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.035)';
  ellipse(ctx, x + 10 + hash(seed) * 18, y + 8 + hash(seed + 1) * 22, 5, 2); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.10)';
  ellipse(ctx, x + 25 + hash(seed + 5) * 12, y + 24 + hash(seed + 4) * 12, 3, 1.4); ctx.fill();
}

function drawCarpet(ctx, x, y, P) {
  ctx.fillStyle = P.stone; ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = P.rug; ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = 'rgba(0,0,0,.12)';
  for (let i = 0; i < 4; i++) ctx.fillRect(x, y + i * 11, TILE, 1);
  ctx.fillStyle = P.gold || '#d8b56a';
  ctx.globalAlpha = .5;
  if (x % 80 === 0) ctx.fillRect(x + 2, y, 2, TILE);
  if ((x + TILE) % 80 === 0) ctx.fillRect(x + TILE - 4, y, 2, TILE);
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(255,230,180,.06)'; ctx.fillRect(x, y, TILE, 4);
}

function drawVoid(ctx, x, y, P, seed) {
  const g = ctx.createLinearGradient(x, y, x, y + TILE);
  g.addColorStop(0, '#0a0f1d'); g.addColorStop(1, '#0d1426');
  ctx.fillStyle = g; ctx.fillRect(x, y, TILE, TILE);
  for (let i = 0; i < 3; i++) {
    const sx = x + hash(seed + i * 3.3) * TILE;
    const sy = y + hash(seed + i * 7.7) * TILE;
    ctx.fillStyle = `rgba(200,220,255,${.16 + hash(seed + i) * .4})`;
    ctx.fillRect(sx, sy, 1.4, 1.4);
  }
  const nx = x + hash(seed + 11) * TILE, ny = y + hash(seed + 13) * TILE;
  if (hash(seed + 17) > .72) {
    const rg = ctx.createRadialGradient(nx, ny, 0, nx, ny, 12);
    rg.addColorStop(0, 'rgba(120,150,220,.20)'); rg.addColorStop(1, 'rgba(120,150,220,0)');
    ctx.fillStyle = rg; ctx.fillRect(x, y, TILE, TILE);
  }
}

function drawRune(ctx, x, y, P, seed, t) {
  drawStoneFloor(ctx, x, y, P, seed);
  const cx = x + 20, cy = y + 20;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, 0, 0, 22, 'rgba(120,220,255,.28)', .8);
  ctx.strokeStyle = 'rgba(150,230,255,.75)'; ctx.lineWidth = 1.6;
  circle(ctx, 0, 0, 13); ctx.stroke();
  ctx.rotate((t || 0) * .2 + seed);
  ctx.strokeStyle = 'rgba(190,240,255,.55)'; ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(0, 0, 9, i * 2.1, i * 2.1 + .9); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(180,240,255,.7)';
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + .5; ctx.fillRect(Math.cos(a) * 13 - 1, Math.sin(a) * 13 - 1, 2, 2); }
  ctx.restore();
}

function drawCrystal(ctx, x, y, P, seed, t) {
  drawStoneFloor(ctx, x, y, P, seed);
  ctx.save(); ctx.translate(x + 20, y + 32);
  glow(ctx, 0, -12, 22, 'rgba(120,220,255,.24)', .8);
  ctx.fillStyle = 'rgba(140,220,240,.8)';
  ctx.beginPath(); ctx.moveTo(0, -32); ctx.lineTo(9, -8); ctx.lineTo(4, 4); ctx.lineTo(-5, 3); ctx.lineTo(-9, -9); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(220,255,255,.45)';
  ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(3, -8); ctx.lineTo(0, 2); ctx.lineTo(-3, -8); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawPillar(ctx, x, y, P, seed) {
  drawStoneFloor(ctx, x, y, P, seed);
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(x + 4, y + 33, 32, 7);
  ctx.fillStyle = P.stoneD; ctx.fillRect(x + 8, y + 6, 24, 28);
  ctx.fillStyle = P.stoneL; ctx.fillRect(x + 10, y + 6, 6, 28);
  ctx.fillStyle = P.stone; ctx.fillRect(x + 16, y + 6, 14, 28);
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x + 28, y + 6, 4, 28);
  ctx.fillStyle = P.stoneL; ctx.fillRect(x + 5, y + 2, 30, 7); ctx.fillRect(x + 5, y + 32, 30, 6);
  ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x + 16, y + 10); ctx.lineTo(x + 16, y + 32); ctx.stroke();
}

function drawAltar(ctx, x, y, P, seed) {
  drawStoneFloor(ctx, x, y, P, seed);
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x + 5, y + 33, 30, 6);
  ctx.fillStyle = '#2e3340'; ctx.fillRect(x + 7, y + 12, 26, 22);
  ctx.fillStyle = '#454e60'; ctx.fillRect(x + 9, y + 12, 22, 7);
  ctx.fillStyle = P.gold || '#d8b56a'; ctx.fillRect(x + 9, y + 18, 22, 2);
  ctx.fillStyle = 'rgba(140,220,255,.6)'; ctx.fillRect(x + 12, y + 9, 16, 3);
  glow(ctx, x + 20, y + 10, 16, 'rgba(140,220,255,.3)', .7);
}

function drawGate(ctx, x, y, P, theme) {
  if (theme === 'prison') {
    // escada para cima
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i % 2 ? '#4a4d53' : '#3a3d42';
      ctx.fillRect(x + 4, y + 34 - i * 7, 32, 8);
      ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(x + 4, y + 34 - i * 7, 32, 1);
    }
    ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(x + 10, y + 2, 20, 10);
    glow(ctx, x + 20, y + 8, 16, 'rgba(255,210,140,.12)', .7);
  } else {
    ctx.fillStyle = '#2b2324'; ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = '#3d3030'; ctx.fillRect(x + 4, y + 4, 32, 36);
    ctx.fillStyle = '#211a1a';
    ctx.beginPath(); ctx.moveTo(x + 8, y + 40); ctx.lineTo(x + 8, y + 18); ctx.quadraticCurveTo(x + 20, y + 2, x + 32, y + 18); ctx.lineTo(x + 32, y + 40); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = P.gold; ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = 'rgba(200,180,120,.28)'; ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x + 10 + i * 5, y + 12); ctx.lineTo(x + 10 + i * 5, y + 40); ctx.stroke(); }
  }
}

function drawFence(ctx, x, y, P) {
  drawGrass(ctx, x, y, P, x + y, 0);
  ctx.fillStyle = '#6a5138';
  ctx.fillRect(x + 4, y + 18, 4, 18); ctx.fillRect(x + 18, y + 18, 4, 18); ctx.fillRect(x + 32, y + 18, 4, 18);
  ctx.fillRect(x, y + 22, TILE, 3); ctx.fillRect(x, y + 31, TILE, 3);
  ctx.fillStyle = 'rgba(255,240,200,.12)'; ctx.fillRect(x, y + 22, TILE, 1);
}

/* ------------------------------------------------------- static map baking */
function drawTile(ctx, ch, x, y, theme, t) {
  const P = PALETTES[theme] || PALETTES.village;
  const seed = x * 13.37 + y * 7.77;
  const variant = Math.floor(hash(seed) * 5);
  switch (ch) {
    case '.': drawGrass(ctx, x, y, P, seed, 0); break;
    case ',': drawGrass(ctx, x, y, P, seed, 3); break;
    case ':': drawTallGrass(ctx, x, y, P, seed); break;
    case 'p': drawPath(ctx, x, y, P, seed, false); break;
    case 'P': drawPath(ctx, x, y, P, seed, true); break;
    case 's': drawStoneFloor(ctx, x, y, P, seed); break;
    case 'c': drawCarpet(ctx, x, y, P); break;
    case 'w': drawWater(ctx, x, y, P, seed, t); break;
    case 'b': drawBridge(ctx, x, y, P); break;
    case 'T': drawTree(ctx, x, y, P, seed); break;
    case 't': drawBush(ctx, x, y, P, seed); break;
    case 'H': drawHouseWall(ctx, x, y, P, seed, false); break;
    case 'D': drawHouseWall(ctx, x, y, P, seed, true); break;
    case 'R': drawRoof(ctx, x, y, P, seed); break;
    case 'F': drawFence(ctx, x, y, P); break;
    case 'f': drawFountainTile(ctx, x, y, P, seed); break;
    case 'S': drawWall(ctx, x, y, P, seed, 'stone'); break;
    case 'W': drawWall(ctx, x, y, P, seed, theme === 'prison' ? 'prison' : 'castle'); break;
    case '|': drawBars(ctx, x, y, P); break;
    case '#': drawVoid(ctx, x, y, P, seed); break;
    case '*': drawRune(ctx, x, y, P, seed, t); break;
    case 'C': drawCrystal(ctx, x, y, P, seed, t); break;
    case 'o': drawPillar(ctx, x, y, P, seed); break;
    case 'A': drawAltar(ctx, x, y, P, seed); break;
    case 'G': drawGate(ctx, x, y, P, theme); break;
    case 'M': drawPath(ctx, x, y, P, seed, true); break;
    default: drawGrass(ctx, x, y, P, seed, 0);
  }
}

function bakeMap(map, theme) {
  const c = document.createElement('canvas');
  c.width = MAP_W * TILE; c.height = MAP_H * TILE;
  const ctx = c.getContext('2d');
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      drawTile(ctx, map.grid[y][x], x * TILE, y * TILE, theme, 0);
    }
  }
  // sombra nas bordas das casas e muros
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const ch = map.grid[y][x];
      if (ch === 'R' || ch === 'H' || ch === 'W' || ch === 'S' || ch === 'T') {
        const below = map.grid[y + 1] && map.grid[y + 1][x];
        if (below && !'RHWST|'.includes(below)) {
          ctx.fillStyle = 'rgba(4,8,12,.28)';
          ctx.fillRect(x * TILE, (y + 1) * TILE - 4, TILE, 5);
        }
      }
    }
  }
  return c;
}

/* ------------------------------------------------------- landmarks/props */
function drawFountainLandmark(ctx, lx, ly, t) {
  const cx = lx + 80, cy = ly + 40;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ellipse(ctx, cx, cy + 30, 80, 18); ctx.fill();
  // base
  ctx.fillStyle = '#6f6c5f'; ellipse(ctx, cx, cy + 8, 74, 34); ctx.fill();
  ctx.fillStyle = '#8b8875'; ellipse(ctx, cx, cy + 2, 74, 34); ctx.fill();
  ctx.fillStyle = '#a5a18a'; ellipse(ctx, cx, cy - 2, 66, 29); ctx.fill();
  ctx.fillStyle = '#3a6a84'; ellipse(ctx, cx, cy - 2, 58, 24); ctx.fill();
  // água
  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = `rgba(160,215,230,${.18 + .1 * Math.sin(t * 1.5 + i)})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.ellipse(cx, cy - 2, 20 + i * 11, 8 + i * 4.5, 0, 0, Math.PI * 2); ctx.stroke();
  }
  // coluna e estátua
  ctx.fillStyle = '#8b8875'; ctx.fillRect(cx - 7, cy - 42, 14, 40);
  ctx.fillStyle = '#a5a18a'; ctx.fillRect(cx - 5, cy - 42, 4, 40);
  ctx.fillStyle = '#b8b49c';
  circle(ctx, cx, cy - 52, 8); ctx.fill();
  ctx.fillRect(cx - 6, cy - 48, 12, 10);
  // jarro
  ctx.fillStyle = '#9a9680';
  ctx.beginPath(); ctx.moveTo(cx - 12, cy - 62); ctx.quadraticCurveTo(cx, cy - 72, cx + 12, cy - 62); ctx.lineTo(cx + 7, cy - 50); ctx.lineTo(cx - 7, cy - 50); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(180,230,240,.5)'; ctx.lineWidth = 1.6;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath(); ctx.moveTo(cx + i * 6, cy - 50 + Math.sin(t * 2 + i) * 1.5);
    ctx.quadraticCurveTo(cx + i * 9, cy - 30, cx + i * 7, cy - 10); ctx.stroke();
  }
  // brilho
  glow(ctx, cx, cy - 2, 55, 'rgba(120,200,220,.15)', .8);
  ctx.restore();
}

function drawThroneLandmark(ctx, x, y) {
  const cx = x + 40, base = y + 70;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ellipse(ctx, cx, base, 46, 12); ctx.fill();
  ctx.fillStyle = '#4a3d2c'; ctx.fillRect(cx - 32, base - 60, 64, 60);
  ctx.fillStyle = '#6b5738'; ctx.fillRect(cx - 26, base - 56, 52, 52);
  ctx.fillStyle = '#8c2c38'; ctx.fillRect(cx - 20, base - 66, 40, 58);
  ctx.fillStyle = '#a8404c'; ctx.fillRect(cx - 16, base - 62, 32, 38);
  ctx.fillStyle = '#d8b56a'; ctx.fillRect(cx - 22, base - 8, 44, 5);
  ctx.fillStyle = '#d8b56a'; ctx.fillRect(cx - 30, base - 70, 60, 6);
  for (let i = 0; i < 5; i++) diamond(ctx, cx - 24 + i * 12, base - 72, 3.2, '#e8cf90');
  ctx.restore();
}

function drawChest(ctx, x, y, open, t) {
  ctx.save();
  const bob = open ? 0 : Math.sin((t || 0) * 2.2 + x) * 0.6;
  ctx.translate(x, y + bob);
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ellipse(ctx, 0, 2, 15, 4.5); ctx.fill();
  ctx.fillStyle = '#5e3d24'; rr(ctx, -14, -19, 28, 20, 3); ctx.fill();
  ctx.fillStyle = '#7a5230'; rr(ctx, -13, -18, 26, 18, 2); ctx.fill();
  if (open) {
    ctx.fillStyle = '#2a1c12'; ctx.fillRect(-12, -18, 24, 8);
    ctx.fillStyle = '#8a6238'; rr(ctx, -15, -30, 30, 12, 4); ctx.fill();
    ctx.fillStyle = 'rgba(240,210,140,.18)'; glow(ctx, 0, -14, 24, 'rgba(255,220,150,.3)', .7);
  } else {
    ctx.fillStyle = '#8a6238'; rr(ctx, -15, -30, 30, 14, 5); ctx.fill();
    ctx.fillStyle = 'rgba(255,230,170,.14)'; ctx.fillRect(-12, -28, 8, 3);
  }
  ctx.fillStyle = '#d8b56a'; ctx.fillRect(-15, -19, 30, 3);
  ctx.fillStyle = '#e8cf90'; ctx.fillRect(-2, -21, 4, 7);
  ctx.fillStyle = '#3a2818'; ctx.fillRect(-1, -19, 2, 3);
  ctx.strokeStyle = 'rgba(30,18,8,.5)'; ctx.lineWidth = 1; rr(ctx, -14, -19, 28, 20, 3); ctx.stroke();
  ctx.restore();
}

function drawFlower(ctx, x, y, t) {
  ctx.save();
  ctx.translate(x, y);
  const bob = Math.sin((t || 0) * 2) * 1.2;
  glow(ctx, 0, -10 + bob, 26, 'rgba(240,220,150,.22)', .8);
  ctx.strokeStyle = '#4f7a4a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, 4); ctx.quadraticCurveTo(-2, -6, 0, -14 + bob); ctx.stroke();
  ctx.fillStyle = '#5f8a52';
  ellipse(ctx, -6, -2, 5, 2.4); ctx.fill();
  // pétalas
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3 + Math.sin(t * .8) * .1;
    ctx.fillStyle = i % 2 ? '#f2e2a0' : '#e8c878';
    ellipse(ctx, Math.cos(a) * 6, -16 + bob + Math.sin(a) * 6, 4.2, 2.6); ctx.fill();
  }
  ctx.fillStyle = '#fff6d0'; circle(ctx, 0, -16 + bob, 2.6); ctx.fill();
  ctx.fillStyle = 'rgba(240,220,150,.8)';
  for (let i = 0; i < 3; i++) {
    const a = t * 1.4 + i * 2.1;
    ctx.globalAlpha = .3 + .5 * (Math.sin(t * 3 + i) * .5 + .5);
    ctx.fillRect(Math.cos(a) * (10 + i * 4), -16 + Math.sin(a) * (8 + i * 2), 1.6, 1.6);
  }
  ctx.restore();
}

function drawSparkle(ctx, x, y, t, color = 'rgba(255,235,170,') {
  for (let i = 0; i < 3; i++) {
    const a = (t * .7 + i * 2.1) % (Math.PI * 2);
    const r = 8 + i * 3;
    ctx.fillStyle = color + (0.35 + 0.4 * Math.sin(t * 2.5 + i)) + ')';
    ctx.fillRect(x + Math.cos(a) * r, y + Math.sin(a) * r, 2, 2);
  }
}

function drawSignpost(ctx, x, y) {
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ellipse(ctx, x, y + 2, 10, 3); ctx.fill();
  ctx.fillStyle = '#5c4128'; ctx.fillRect(x - 2, y - 26, 4, 28);
  ctx.fillStyle = '#8a6a43'; ctx.fillRect(x - 13, y - 28, 26, 12);
  ctx.fillStyle = '#6b4e30'; ctx.fillRect(x - 13, y - 28, 26, 2);
  ctx.fillStyle = 'rgba(255,235,190,.35)'; ctx.fillRect(x - 9, y - 24, 14, 1);
}

/* --------------------------------------------------------------- portraits */
function drawPortrait(ctx, who, mood, x, y, w, h) {
  const look = LOOKS[who] || LOOKS.rowan;
  const palettes = {
    rowan: ['#2b3d5e', '#7a9ac0'], liria: ['#4b3348', '#c98aa8'], liria_ruins: ['#3a2d40', '#9a7a90'],
    kael: ['#4b2626', '#c09050'], brann: ['#323a46', '#b0a890'], king: ['#3a2d4a', '#b8a070'],
    guard: ['#2b3038', '#8a96a4'], elder: ['#3a3446', '#a09070'], child: ['#33452f', '#a8c090'],
    merchant: ['#453425', '#c0a070'], noble: ['#2f3a50', '#a0a8c0'], noble2: ['#3a2b34', '#b090a0']
  };
  const pal = palettes[who] || palettes.rowan;
  const bo = mood === 'angry' || mood === 'smirk' ? 'angry' : mood === 'sad' || mood === 'tears' ? 'sad' : 'neutral';
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  const bg = ctx.createRadialGradient(x + w * .5, y + h * .36, 6, x + w * .5, y + h * .5, w * .85);
  bg.addColorStop(0, pal[0]);
  bg.addColorStop(1, '#0c101c');
  ctx.fillStyle = bg; ctx.fillRect(x, y, w, h);
  // textura
  ctx.globalAlpha = .12;
  for (let i = 0; i < 18; i++) {
    ctx.fillStyle = i % 2 ? '#ffffff' : '#000000';
    ctx.fillRect(x + hash(i * 3.7) * w, y + hash(i * 5.1) * h, 1, 1);
  }
  ctx.globalAlpha = 1;
  // halo
  const hg = ctx.createRadialGradient(x + w * .52, y + h * .34, 4, x + w * .52, y + h * .34, w * .5);
  hg.addColorStop(0, 'rgba(255,235,190,.18)'); hg.addColorStop(1, 'rgba(255,235,190,0)');
  ctx.fillStyle = hg; ctx.fillRect(x, y, w, h);

  const sx = w / 100, sy = h / 120;
  ctx.translate(x, y); ctx.scale(sx, sy);
  const skin = look.skin, hair = look.hair;
  const hairStyle = look.style;

  // ombros / roupa
  ctx.fillStyle = look.cape || look.top;
  ctx.beginPath();
  ctx.moveTo(5, 120); ctx.quadraticCurveTo(9, 92, 32, 82);
  ctx.lineTo(68, 82); ctx.quadraticCurveTo(91, 92, 95, 120); ctx.closePath(); ctx.fill();
  ctx.fillStyle = look.top;
  ctx.beginPath();
  ctx.moveTo(15, 120); ctx.quadraticCurveTo(20, 96, 38, 88);
  ctx.lineTo(62, 88); ctx.quadraticCurveTo(80, 96, 85, 120); ctx.closePath(); ctx.fill();
  // gola
  ctx.fillStyle = look.accent;
  ctx.beginPath(); ctx.moveTo(38, 88); ctx.lineTo(50, 100); ctx.lineTo(62, 88); ctx.lineTo(56, 85); ctx.lineTo(50, 92); ctx.lineTo(44, 85); ctx.closePath(); ctx.fill();
  // pescoço
  ctx.fillStyle = skin;
  ctx.fillRect(44, 78, 12, 14);
  ctx.fillStyle = 'rgba(60,30,20,.18)'; ctx.fillRect(44, 86, 12, 6);

  // cabelo comprido atrás
  if (hairStyle === 'long') {
    ctx.fillStyle = hair;
    ctx.beginPath(); ctx.moveTo(28, 48); ctx.quadraticCurveTo(20, 74, 24, 96);
    ctx.quadraticCurveTo(34, 100, 34, 82); ctx.lineTo(39, 48); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(72, 48); ctx.quadraticCurveTo(80, 74, 76, 96);
    ctx.quadraticCurveTo(66, 100, 66, 82); ctx.lineTo(61, 48); ctx.closePath(); ctx.fill();
  }
  // cabeça
  ctx.fillStyle = skin;
  ellipse(ctx, 50, 58, 20, 24); ctx.fill();
  ctx.fillStyle = 'rgba(80,40,20,.10)';
  ellipse(ctx, 50, 69, 16, 10); ctx.fill();
  // orelhas
  ctx.fillStyle = skin;
  ellipse(ctx, 29, 60, 4, 6); ctx.fill();
  ellipse(ctx, 71, 60, 4, 6); ctx.fill();
  ctx.fillStyle = 'rgba(80,40,20,.25)';
  ctx.fillRect(30, 59, 1.6, 3); ctx.fillRect(69, 59, 1.6, 3);
  // cabelo
  ctx.fillStyle = hair;
  if (hairStyle === 'helmet') {
    ctx.fillStyle = '#6a727e';
    ctx.beginPath(); ctx.moveTo(28, 54); ctx.quadraticCurveTo(30, 26, 50, 26); ctx.quadraticCurveTo(70, 26, 72, 54);
    ctx.lineTo(68, 48); ctx.quadraticCurveTo(64, 36, 50, 34); ctx.quadraticCurveTo(36, 36, 32, 48); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#4a525c'; ctx.fillRect(48, 34, 4, 22);
    ctx.fillStyle = '#a8b0ba'; ctx.fillRect(28, 44, 44, 3);
  } else {
    ctx.beginPath();
    ctx.moveTo(28, 58); ctx.quadraticCurveTo(26, 30, 50, 28); ctx.quadraticCurveTo(74, 30, 72, 58);
    ctx.quadraticCurveTo(66, 44, 54, 42); ctx.quadraticCurveTo(48, 50, 40, 44);
    ctx.quadraticCurveTo(34, 48, 32, 60); ctx.closePath(); ctx.fill();
    if (hairStyle === 'hero' || hairStyle === 'short' || hairStyle === 'beard') {
      ctx.beginPath(); ctx.moveTo(30, 50); ctx.quadraticCurveTo(26, 66, 33, 78); ctx.lineTo(38, 72);
      ctx.quadraticCurveTo(34, 60, 38, 46); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(70, 50); ctx.quadraticCurveTo(74, 66, 67, 78); ctx.lineTo(62, 72);
      ctx.quadraticCurveTo(66, 60, 62, 46); ctx.closePath(); ctx.fill();
    }
    // franja
    ctx.beginPath(); ctx.moveTo(32, 46); ctx.quadraticCurveTo(38, 32, 52, 34);
    ctx.quadraticCurveTo(60, 35, 67, 47); ctx.quadraticCurveTo(58, 44, 52, 38);
    ctx.quadraticCurveTo(44, 44, 36, 48); ctx.closePath(); ctx.fill();
  }
  if (hairStyle === 'beard') {
    ctx.fillStyle = hair;
    ctx.beginPath(); ctx.moveTo(34, 68); ctx.quadraticCurveTo(38, 96, 50, 98);
    ctx.quadraticCurveTo(62, 96, 66, 68); ctx.quadraticCurveTo(58, 82, 50, 82);
    ctx.quadraticCurveTo(42, 82, 34, 68); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.28)';
    ctx.fillRect(46, 84, 2, 6); ctx.fillRect(52, 86, 2, 4);
  }
  if (look.flower) {
    ctx.fillStyle = '#e8c878';
    for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; circle(ctx, 66 + Math.cos(a) * 3, 40 + Math.sin(a) * 3, 2); ctx.fill(); }
    ctx.fillStyle = '#f8e8b0'; circle(ctx, 66, 40, 1.8); ctx.fill();
  }
  if (look.crown) {
    ctx.fillStyle = '#e0bd72';
    ctx.beginPath(); ctx.moveTo(34, 32); ctx.lineTo(38, 20); ctx.lineTo(44, 29); ctx.lineTo(50, 17);
    ctx.lineTo(56, 29); ctx.lineTo(62, 20); ctx.lineTo(66, 32); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#b08a3e'; ctx.fillRect(34, 30, 32, 4);
    ctx.fillStyle = '#c94b4b'; circle(ctx, 50, 32, 2); ctx.fill();
  }
  // olhos
  const eyeY = 59;
  const iris = who === 'liria' || who === 'liria_ruins' ? '#5a8a5a' : who === 'kael' ? '#c08a3a' : who === 'brann' ? '#6a7a8a' : who === 'guard' ? '#7a8a9a' : '#4a7a9a';
  if (mood !== 'pained') {
    ctx.fillStyle = '#f8f2e4';
    ellipse(ctx, 41, eyeY, 5, bo === 'angry' ? 2.6 : 3.6); ctx.fill();
    ellipse(ctx, 59, eyeY, 5, bo === 'angry' ? 2.6 : 3.6); ctx.fill();
    ctx.fillStyle = iris;
    circle(ctx, 41.5, eyeY + .5, 2.3); ctx.fill();
    circle(ctx, 58.5, eyeY + .5, 2.3); ctx.fill();
    ctx.fillStyle = '#1a1410';
    circle(ctx, 41.5, eyeY + .5, 1.2); ctx.fill();
    circle(ctx, 58.5, eyeY + .5, 1.2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.fillRect(40, eyeY - 1.4, 1.2, 1.2); ctx.fillRect(57, eyeY - 1.4, 1.2, 1.2);
    // pálpebra
    ctx.strokeStyle = 'rgba(50,30,24,.6)'; ctx.lineWidth = .8;
    ctx.beginPath(); ctx.moveTo(36, eyeY - 2.6); ctx.lineTo(46, eyeY - 2.6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(54, eyeY - 2.6); ctx.lineTo(64, eyeY - 2.6); ctx.stroke();
  } else {
    ctx.strokeStyle = 'rgba(40,28,24,.75)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(36, 59); ctx.quadraticCurveTo(41, 61, 46, 59); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(54, 59); ctx.quadraticCurveTo(59, 61, 64, 59); ctx.stroke();
  }
  // sobrancelhas
  ctx.strokeStyle = who === 'brann' ? '#c8c2b4' : hair;
  ctx.lineWidth = 2; ctx.lineCap = 'round';
  if (bo === 'angry') {
    ctx.beginPath(); ctx.moveTo(35, 52); ctx.lineTo(46, 55); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(65, 52); ctx.lineTo(54, 55); ctx.stroke();
  } else if (bo === 'sad') {
    ctx.beginPath(); ctx.moveTo(35, 54); ctx.lineTo(46, 51); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(65, 54); ctx.lineTo(54, 51); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(36, 52); ctx.lineTo(46, 53); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(64, 52); ctx.lineTo(54, 53); ctx.stroke();
  }
  // nariz
  ctx.strokeStyle = 'rgba(110,60,40,.45)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(50, 62); ctx.quadraticCurveTo(52, 66, 49, 67); ctx.stroke();
  // boca
  ctx.strokeStyle = 'rgba(120,55,50,.8)'; ctx.lineWidth = 1.6;
  ctx.beginPath();
  if (bo === 'sad') { ctx.moveTo(45, 76); ctx.quadraticCurveTo(50, 73, 55, 76); }
  else if (mood === 'smile') { ctx.moveTo(45, 73); ctx.quadraticCurveTo(50, 78, 55, 73); }
  else if (mood === 'smirk') { ctx.moveTo(45, 75); ctx.quadraticCurveTo(51, 77, 56, 72); }
  else if (bo === 'angry') { ctx.moveTo(45, 75); ctx.quadraticCurveTo(50, 73, 55, 75); }
  else { ctx.moveTo(46, 74); ctx.lineTo(54, 74); }
  ctx.stroke();
  // cicatriz / detalhes
  if (who === 'brann') {
    ctx.strokeStyle = 'rgba(120,70,60,.55)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(36, 46); ctx.lineTo(44, 66); ctx.stroke();
    ctx.fillStyle = '#2b2b30'; ctx.beginPath(); ctx.ellipse(59, 58, 4.6, 3.4, -.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1a1a1e'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(54, 56); ctx.lineTo(64, 60); ctx.stroke();
  }
  if (who === 'rowan' && mood !== 'smile') {
    ctx.strokeStyle = 'rgba(150,80,60,.35)'; ctx.lineWidth = .8;
    ctx.beginPath(); ctx.moveTo(61, 64); ctx.lineTo(64, 69); ctx.stroke();
  }
  if (mood === 'tears') {
    ctx.fillStyle = 'rgba(180,220,255,.75)';
    ellipse(ctx, 35, 66, 1.6, 3.2); ctx.fill();
    ellipse(ctx, 65, 66, 1.6, 3.2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(34.5, 65, 1, 1);
  }
  // luz lateral
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const lg = ctx.createLinearGradient(70, 0, 100, 0);
  lg.addColorStop(0, 'rgba(255,230,180,0)'); lg.addColorStop(1, 'rgba(255,230,180,.13)');
  ctx.fillStyle = lg; ctx.fillRect(0, 0, 100, 120);
  ctx.restore();
  // moldura
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = 'rgba(216,181,106,.5)'; ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
  ctx.restore();
}

/* ---------------------------------------------------------- item icons */
function drawItemIcon(ctx, key, x, y, size = 24) {
  const s = size / 24;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const it = ITEMS[key];
  if (it) {
    ctx.fillStyle = '#2a3446';
    rr(ctx, -7, -8, 14, 15, 4); ctx.fill();
    ctx.fillStyle = it.color;
    ctx.fillRect(-5, -2, 10, 8);
    ctx.fillStyle = '#c9c2a6'; ctx.fillRect(-3, -10, 6, 3);
    ctx.fillStyle = '#6b4f38'; ctx.fillRect(-2.5, -12, 5, 2);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-4, 0, 2, 5);
    ctx.strokeStyle = 'rgba(240,230,200,.55)'; ctx.lineWidth = 1; rr(ctx, -7, -8, 14, 15, 4); ctx.stroke();
  }
  ctx.restore();
}
