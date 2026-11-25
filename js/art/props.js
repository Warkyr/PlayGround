// art/props.js — town buildings, nature, furniture and dungeon decor
import { THEMES } from './tiles.js';
import { hash2 } from '../util.js';

export const PROP_DEFS = {
  house:   { w: 6, h: 4, solid: true, tall: true },
  hut:     { w: 4, h: 3, solid: true, tall: true },
  tower:   { w: 4, h: 5, solid: true, tall: true },
  tree:    { w: 2, h: 2, solid: true, baseOnly: true, tall: true },
  pine:    { w: 2, h: 2, solid: true, baseOnly: true, tall: true },
  deadtree:{ w: 1, h: 1, solid: true, tall: true },
  rock:    { w: 1, h: 1, solid: true },
  bush:    { w: 1, h: 1, solid: false },
  fence:   { w: 1, h: 1, solid: true },
  lamp:    { w: 1, h: 1, solid: true, tall: true },
  well:    { w: 2, h: 2, solid: true, tall: true },
  stall:   { w: 3, h: 2, solid: true, tall: true },
  crate:   { w: 1, h: 1, solid: true },
  barrel:  { w: 1, h: 1, solid: true },
  sign:    { w: 1, h: 1, solid: true, tall: true },
  grave:   { w: 1, h: 1, solid: true, tall: true },
  statue:  { w: 2, h: 2, solid: true, tall: true },
  pillar:  { w: 1, h: 2, solid: true, tall: true },
  throne:  { w: 3, h: 3, solid: true, tall: true },
  altar:   { w: 3, h: 2, solid: true, tall: true },
  campfire:{ w: 2, h: 2, solid: true, tall: true },
  banner:  { w: 1, h: 2, solid: true, tall: true },
  fountain:{ w: 3, h: 3, solid: true, tall: true },
  dummy:   { w: 1, h: 1, solid: true, tall: true },
  tent:    { w: 3, h: 2, solid: true, tall: true },
  gate:    { w: 4, h: 2, solid: true, tall: true },
  stairs:  { w: 2, h: 2, solid: false, tall: true },
  rubble:  { w: 1, h: 1, solid: true },
  crystal: { w: 1, h: 1, solid: true, tall: true },
  torch:   { w: 1, h: 1, solid: true, tall: true },
  table:   { w: 2, h: 1, solid: true },
  bed:     { w: 2, h: 2, solid: true },
  shelf:   { w: 2, h: 1, solid: true, tall: true },
  door:    { w: 1, h: 1, solid: false, tall: true },
  portal:  { w: 2, h: 2, solid: false, tall: true },
  bars:    { w: 3, h: 1, solid: true, tall: true },
  treeSnow:{ w: 2, h: 2, solid: true, baseOnly: true, tall: true },
  pineSnow:{ w: 2, h: 2, solid: true, baseOnly: true, tall: true },
};

export function propSize(p) {
  const d = PROP_DEFS[p.t] || { w: 1, h: 1 };
  return { w: p.w ?? d.w, h: p.h ?? d.h };
}

export function propBaseY(p) {
  const s = propSize(p);
  return (p.y + s.h) * 16;
}

export function propSolidRect(p) {
  const s = propSize(p);
  const d = PROP_DEFS[p.t] || {};
  if (d.solid === false) return null;
  if (d.baseOnly) return { x: p.x, y: p.y + s.h - 1, w: s.w, h: 1 };
  return { x: p.x, y: p.y, w: s.w, h: s.h };
}

function rect(g, c, x, y, w, h) { g.fillStyle = c; g.fillRect(x, y, w, h); }
function poly(g, c, pts) {
  g.fillStyle = c; g.beginPath();
  pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y));
  g.closePath(); g.fill();
}
function shadow(g, x, y, rx, ry, a = 0.32) {
  g.fillStyle = `rgba(0,0,0,${a})`;
  g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill();
}

function drawHouse(g, p, th, time, o) {
  const s = propSize(p);
  const W = s.w * 16, H = s.h * 16, x = p.x * 16, y = p.y * 16;
  const roofC = p.v === 'blue' ? '#3e5678' : p.v === 'thatch' ? '#8a7038' : th.roof;
  const roofD = p.v === 'blue' ? '#2a3c58' : p.v === 'thatch' ? '#6a5428' : th.roof2;
  shadow(g, x + W / 2, y + H - 3, W * 0.55, 6, 0.36);
  const wallTop = y + H * 0.36;
  // wall
  rect(g, th.plaster, x + 5, wallTop, W - 10, H - (wallTop - y) - 3);
  rect(g, th.wall2, x + 5, wallTop, W - 10, 2);
  // timber frame
  g.fillStyle = th.wood2;
  g.fillRect(x + 5, wallTop + 10, W - 10, 2);
  g.fillRect(x + 10, wallTop, 3, H - (wallTop - y) - 3);
  g.fillRect(x + W - 13, wallTop, 3, H - (wallTop - y) - 3);
  g.fillRect(x + W / 2 - 2, wallTop + 10, 3, H - (wallTop - y) - 12);
  // roof
  const over = 7;
  poly(g, roofD, [[x - over, y + H * 0.40], [x + 8, y - 12], [x + W - 8, y - 12], [x + W + over, y + H * 0.40]]);
  poly(g, roofC, [[x - over + 2, y + H * 0.39], [x + 9, y - 10], [x + W - 9, y - 10], [x + W + over - 2, y + H * 0.39]]);
  // shingles
  g.fillStyle = roofD;
  for (let i = 0; i < 5; i++) {
    const yy = y - 6 + i * (H * 0.44 / 5);
    g.fillRect(x + 4 + i * 2, yy, W - 8 - i * 4, 1);
  }
  g.fillStyle = 'rgba(255,255,255,.12)';
  g.fillRect(x + 12, y - 9, W - 24, 2);
  // chimney
  const chx = x + W - 20;
  rect(g, '#5a4a44', chx, y - 24, 9, 20);
  rect(g, '#6e5c54', chx + 1, y - 23, 7, 2);
  rect(g, '#3a2e2a', chx + 2, y - 25, 5, 2);
  if (time != null) {
    g.globalAlpha = 0.18;
    for (let i = 0; i < 4; i++) {
      const t = (time * 0.35 + i * 0.25 + (p.x * 0.13)) % 1;
      g.fillStyle = '#c8c8d0';
      g.beginPath();
      g.arc(chx + 4 + Math.sin(t * 5 + p.x) * 5, y - 28 - t * 34, 3 + t * 5, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
  }
  // door
  const dx = x + W / 2 - 7;
  rect(g, th.wood2, dx - 2, y + H - 22, 18, 20);
  rect(g, '#4a2e1a', dx, y + H - 20, 14, 18);
  rect(g, '#6e4728', dx + 1, y + H - 19, 12, 17);
  g.fillStyle = '#c9a44c'; g.fillRect(dx + 10, y + H - 11, 2, 2);
  // windows
  const glow = th.dark ? '#ffcf7a' : '#7a9aac';
  const wxs = [x + 14, x + W - 30];
  wxs.forEach((wx) => {
    rect(g, '#3a2a1e', wx - 2, wallTop + 16, 16, 14);
    rect(g, glow, wx, wallTop + 18, 12, 10);
    g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(wx + 1, wallTop + 19, 4, 2);
    g.fillStyle = '#3a2a1e'; g.fillRect(wx + 5, wallTop + 18, 1, 10); g.fillRect(wx, wallTop + 22, 12, 1);
    if (th.dark) {
      g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.1;
      g.fillStyle = '#ffb860'; g.beginPath(); g.arc(wx + 6, wallTop + 23, 16, 0, Math.PI * 2); g.fill(); g.restore();
    }
  });
  // flowers by door
  g.fillStyle = th.flower;
  g.fillRect(dx - 6, y + H - 5, 2, 2); g.fillRect(dx + 20, y + H - 6, 2, 2);
}

function drawTree(g, p, th, time, snowy) {
  const s = propSize(p);
  const cx = p.x * 16 + s.w * 8, base = (p.y + s.h) * 16;
  const phase = hash2(p.x, p.y) * 6.28;
  const sway = Math.round(Math.sin(time * 0.8 + phase) * 1);
  shadow(g, cx, base - 1, 12, 4, 0.3);
  // trunk
  rect(g, '#4a3220', cx - 3, base - 18, 6, 18);
  rect(g, '#5c4028', cx - 2, base - 17, 3, 15);
  const g1 = snowy ? '#d8e8f0' : th.grassDark;
  const g2 = snowy ? '#e8f4fa' : th.grass2;
  const g3 = snowy ? '#ffffff' : th.blade;
  const cy = base - 32;
  const blobs = [[-9, 2, 10], [9, 2, 10], [0, -7, 12], [-3, 9, 11], [4, 8, 10]];
  g.fillStyle = g1;
  blobs.forEach(([bx, by, r]) => { g.beginPath(); g.arc(cx + bx + sway, cy + by, r, 0, Math.PI * 2); g.fill(); });
  g.fillStyle = g2;
  blobs.forEach(([bx, by, r]) => { g.beginPath(); g.arc(cx + bx + sway - 1, cy + by - 2, r - 3, 0, Math.PI * 2); g.fill(); });
  g.fillStyle = g3;
  g.beginPath(); g.arc(cx - 4 + sway, cy - 6, 5, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(cx + 7 + sway, cy + 4, 3, 0, Math.PI * 2); g.fill();
  if (snowy) {
    g.fillStyle = '#ffffff';
    g.beginPath(); g.arc(cx - 7 + sway, cy - 3, 4, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(cx + 8 + sway, cy + 1, 3, 0, Math.PI * 2); g.fill();
  }
}

function drawPine(g, p, th, time, snowy) {
  const s = propSize(p);
  const cx = p.x * 16 + s.w * 8, base = (p.y + s.h) * 16;
  const phase = hash2(p.x, p.y) * 6.28;
  const sway = Math.round(Math.sin(time * 0.7 + phase) * 1);
  shadow(g, cx, base - 1, 11, 4, 0.3);
  rect(g, '#4a3220', cx - 2, base - 14, 4, 14);
  const c1 = snowy ? '#4a6a6a' : th.grassDark;
  const c2 = snowy ? '#6a8a8a' : th.grass2;
  const c3 = snowy ? '#ffffff' : th.blade;
  for (let i = 0; i < 4; i++) {
    const yy = base - 16 - i * 10;
    const w = 20 - i * 4;
    poly(g, c1, [[cx - w, yy], [cx + w, yy], [cx + sway, yy - 18]]);
    poly(g, c2, [[cx - w + 4, yy - 1], [cx + w - 4, yy - 1], [cx + sway, yy - 15]]);
    if (snowy) poly(g, c3, [[cx - w + 5, yy - 2], [cx + w - 5, yy - 2], [cx + sway, yy - 12]]);
    else { g.fillStyle = c3; g.fillRect(cx - 3 + sway, yy - 12, 2, 3); }
  }
}

function drawRock(g, p, th, time, snowy) {
  const x = p.x * 16, y = p.y * 16;
  shadow(g, x + 8, y + 14, 7, 3, 0.3);
  const base = snowy ? '#9aa8b8' : '#5e6670';
  const hi = snowy ? '#d8e4ee' : '#79828e';
  const dk = snowy ? '#7a8898' : '#454c56';
  poly(g, dk, [[x + 1, y + 14], [x + 3, y + 6], [x + 7, y + 2], [x + 13, y + 5], [x + 15, y + 12], [x + 12, y + 15], [x + 4, y + 15]]);
  poly(g, base, [[x + 3, y + 12], [x + 5, y + 6], [x + 9, y + 4], [x + 13, y + 7], [x + 13, y + 12], [x + 9, y + 13]]);
  g.fillStyle = hi; g.fillRect(x + 6, y + 5, 4, 2); g.fillRect(x + 9, y + 7, 2, 1);
  if (snowy) { g.fillStyle = '#fff'; g.fillRect(x + 6, y + 3, 5, 2); }
}

function drawBush(g, p, th) {
  const x = p.x * 16, y = p.y * 16;
  shadow(g, x + 8, y + 14, 6, 2, 0.25);
  g.fillStyle = th.grassDark;
  g.beginPath(); g.arc(x + 8, y + 10, 7, 0, Math.PI * 2); g.fill();
  g.fillStyle = th.grass2;
  g.beginPath(); g.arc(x + 7, y + 9, 5, 0, Math.PI * 2); g.fill();
  g.fillStyle = th.blade;
  g.fillRect(x + 4, y + 6, 2, 2);
  if (hash2(p.x, p.y) > 0.5) {
    g.fillStyle = '#c94a5a'; g.fillRect(x + 10, y + 8, 2, 2); g.fillRect(x + 6, y + 11, 2, 2);
  }
}

function drawFence(g, p, th) {
  const x = p.x * 16, y = p.y * 16;
  g.fillStyle = '#5c4028';
  g.fillRect(x + 1, y + 6, 3, 10); g.fillRect(x + 11, y + 6, 3, 10);
  g.fillRect(x, y + 8, 16, 2); g.fillRect(x, y + 12, 16, 2);
  g.fillStyle = '#7a5a38'; g.fillRect(x + 2, y + 7, 1, 8); g.fillRect(x + 12, y + 7, 1, 8);
}

function drawLamp(g, p, th, time) {
  const x = p.x * 16, y = p.y * 16;
  const lit = th.dark;
  if (lit) {
    g.save(); g.globalCompositeOperation = 'lighter';
    const grd = g.createRadialGradient(x + 8, y + 2, 1, x + 8, y + 2, 34);
    grd.addColorStop(0, 'rgba(255,190,90,.30)');
    grd.addColorStop(1, 'rgba(255,150,50,0)');
    g.fillStyle = grd; g.fillRect(x - 26, y - 32, 68, 68);
    g.restore();
  }
  g.fillStyle = '#2a2622'; g.fillRect(x + 7, y + 6, 3, 11);
  g.fillStyle = '#4a4038'; g.fillRect(x + 5, y + 15, 7, 2);
  g.fillStyle = '#3a322c'; g.fillRect(x + 4, y - 3, 9, 2); g.fillRect(x + 4, y + 6, 9, 2);
  g.fillStyle = lit ? '#ffd27a' : '#8a7a5a'; g.fillRect(x + 5, y, 7, 6);
  g.fillStyle = lit ? '#fff0b8' : '#b8a878'; g.fillRect(x + 7, y + 1, 3, 4);
  g.fillStyle = '#1a1614'; g.fillRect(x + 6, y - 2, 6, 2);
}

function drawWell(g, p, th) {
  const x = p.x * 16, y = p.y * 16;
  shadow(g, x + 16, y + 30, 15, 4, 0.3);
  g.fillStyle = '#5e5a52';
  g.beginPath(); g.ellipse(x + 16, y + 22, 15, 8, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#7a766c';
  g.beginPath(); g.ellipse(x + 16, y + 20, 13, 6, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#1e3442';
  g.beginPath(); g.ellipse(x + 16, y + 20, 10, 4, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#3a5a6a'; g.fillRect(x + 9, y + 18, 7, 1);
  // posts + roof
  g.fillStyle = '#5c4028'; g.fillRect(x + 4, y + 2, 3, 18); g.fillRect(x + 25, y + 2, 3, 18);
  poly(g, th.roof, [[x + 1, y + 4], [x + 16, y - 8], [x + 31, y + 4]]);
  poly(g, th.roof2, [[x + 1, y + 4], [x + 16, y - 8], [x + 16, y - 4]]);
  g.fillStyle = '#c9a44c'; g.fillRect(x + 15, y + 6, 2, 6);
  g.fillStyle = '#6e4728'; g.fillRect(x + 12, y + 12, 8, 6);
}

function drawStall(g, p, th) {
  const x = p.x * 16, y = p.y * 16;
  shadow(g, x + 24, y + 30, 22, 4, 0.3);
  g.fillStyle = '#5c4028'; g.fillRect(x + 2, y + 10, 3, 22); g.fillRect(x + 43, y + 10, 3, 22);
  // awning
  poly(g, '#8a3040', [[x - 2, y + 12], [x + 6, y + 1], [x + 42, y + 1], [x + 50, y + 12]]);
  for (let i = 0; i < 6; i++) {
    g.fillStyle = i % 2 ? '#e8dcc0' : '#8a3040';
    g.fillRect(x + 1 + i * 8, y + 2 + Math.abs(2 - i) * 2, 7, 9);
  }
  g.fillStyle = '#5a1e2a'; g.fillRect(x, y + 11, 50, 2);
  // counter
  g.fillStyle = '#6e4728'; g.fillRect(x + 3, y + 22, 42, 4);
  g.fillStyle = '#8a5c34'; g.fillRect(x + 3, y + 22, 42, 2);
  // goods
  g.fillStyle = '#c94a5a'; g.fillRect(x + 8, y + 18, 4, 4);
  g.fillStyle = '#e0a040'; g.fillRect(x + 15, y + 19, 4, 3);
  g.fillStyle = '#5a8a4a'; g.fillRect(x + 22, y + 18, 3, 4);
  g.fillStyle = '#8a6ac9'; g.fillRect(x + 29, y + 19, 4, 3);
  g.fillStyle = '#c9a44c'; g.fillRect(x + 37, y + 18, 3, 4);
  // bottles
  g.fillStyle = '#7ac0d0'; g.fillRect(x + 12, y + 16, 2, 2); g.fillRect(x + 26, y + 15, 2, 3);
}

function drawFountain(g, p, th, time) {
  const x = p.x * 16, y = p.y * 16;
  shadow(g, x + 24, y + 42, 22, 5, 0.3);
  g.fillStyle = '#5e6670';
  g.beginPath(); g.ellipse(x + 24, y + 34, 22, 11, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#767e88';
  g.beginPath(); g.ellipse(x + 24, y + 32, 20, 9, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#2a5a72';
  g.beginPath(); g.ellipse(x + 24, y + 32, 16, 7, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#4a8aa0';
  g.beginPath(); g.ellipse(x + 24, y + 31, 14, 5, 0, 0, Math.PI * 2); g.fill();
  // ripples
  g.strokeStyle = 'rgba(180,230,240,.5)'; g.lineWidth = 1;
  for (let i = 0; i < 2; i++) {
    const r = 4 + ((time * 6 + i * 8) % 12);
    g.beginPath(); g.ellipse(x + 24, y + 31, r, r * 0.4, 0, 0, Math.PI * 2); g.stroke();
  }
  // statue
  g.fillStyle = '#8a929c'; g.fillRect(x + 20, y + 12, 8, 14);
  g.fillStyle = '#a8b0ba'; g.fillRect(x + 21, y + 13, 5, 12);
  g.fillStyle = '#8a929c'; g.fillRect(x + 22, y + 6, 4, 7);
  g.fillStyle = '#c8d0d8'; g.fillRect(x + 23, y + 7, 2, 2);
  g.fillStyle = '#a8b0ba'; g.fillRect(x + 27, y + 10, 2, 10); // sword
  g.fillStyle = '#c9a44c'; g.fillRect(x + 26, y + 18, 4, 2);
  // water jet
  g.fillStyle = 'rgba(160,220,240,.6)';
  const jet = Math.sin(time * 3) * 2;
  g.fillRect(x + 23, y + 10 + jet, 2, 5);
  g.fillRect(x + 19 + jet, y + 16, 2, 4);
  g.fillRect(x + 28 - jet, y + 16, 2, 4);
}

function drawStatue(g, p, th, time) {
  const x = p.x * 16, y = p.y * 16;
  shadow(g, x + 16, y + 30, 14, 4, 0.3);
  g.fillStyle = '#5e6670'; g.fillRect(x + 4, y + 22, 24, 8);
  g.fillStyle = '#767e88'; g.fillRect(x + 4, y + 22, 24, 2);
  // knight
  g.fillStyle = '#8a94a0'; g.fillRect(x + 10, y + 6, 12, 17);
  g.fillStyle = '#a8b4c0'; g.fillRect(x + 11, y + 7, 8, 15);
  g.fillStyle = '#8a94a0'; g.fillRect(x + 12, y + 1, 8, 6);
  g.fillStyle = '#3a4450'; g.fillRect(x + 13, y + 3, 6, 2);
  g.fillStyle = '#c8d0d8'; g.fillRect(x + 24, y + 2, 2, 22); // sword
  g.fillStyle = '#c9a44c'; g.fillRect(x + 22, y + 15, 6, 2);
  g.fillStyle = '#6a7480'; g.fillRect(x + 7, y + 10, 3, 12); // shield
  g.fillStyle = '#c9a44c'; g.fillRect(x + 8, y + 14, 1, 4);
}

function drawPillar(g, p, th) {
  const x = p.x * 16, y = p.y * 16;
  shadow(g, x + 8, y + 30, 8, 3, 0.3);
  g.fillStyle = th.stone2; g.fillRect(x + 1, y + 26, 14, 4);
  g.fillStyle = th.stone; g.fillRect(x + 2, y + 2, 12, 25);
  g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(x + 3, y + 3, 3, 23);
  g.fillStyle = th.stone2; g.fillRect(x + 1, y, 14, 4);
  g.fillStyle = th.accent; g.fillRect(x + 4, y + 8, 2, 2); g.fillRect(x + 10, y + 16, 2, 2);
}

function drawThrone(g, p, th) {
  const x = p.x * 16, y = p.y * 16;
  shadow(g, x + 24, y + 44, 22, 5, 0.35);
  // dais
  g.fillStyle = '#3a3040'; g.fillRect(x + 2, y + 34, 44, 10);
  g.fillStyle = '#4a3e4e'; g.fillRect(x + 4, y + 32, 40, 8);
  g.fillStyle = '#5a4a5a'; g.fillRect(x + 8, y + 29, 32, 6);
  // back
  g.fillStyle = '#2a2230'; g.fillRect(x + 14, y + 2, 20, 28);
  g.fillStyle = '#3a2e40'; g.fillRect(x + 16, y + 4, 16, 24);
  g.fillStyle = '#6a2030'; g.fillRect(x + 19, y + 6, 10, 20);
  g.fillStyle = '#8a3040'; g.fillRect(x + 20, y + 7, 8, 16);
  // arms
  g.fillStyle = '#2a2230'; g.fillRect(x + 8, y + 22, 6, 12); g.fillRect(x + 34, y + 22, 6, 12);
  g.fillStyle = '#c9a44c'; g.fillRect(x + 8, y + 22, 6, 2); g.fillRect(x + 34, y + 22, 6, 2);
  // top spikes
  g.fillStyle = '#c9a44c'; g.fillRect(x + 22, y - 2, 4, 4); g.fillRect(x + 15, y + 2, 2, 3); g.fillRect(x + 31, y + 2, 2, 3);
}

function drawAltar(g, p, th, time) {
  const x = p.x * 16, y = p.y * 16;
  shadow(g, x + 24, y + 30, 22, 4, 0.32);
  g.fillStyle = th.stone2; g.fillRect(x + 4, y + 18, 40, 12);
  g.fillStyle = th.stone; g.fillRect(x + 6, y + 16, 36, 10);
  g.fillStyle = th.stone3 || '#8c929c'; g.fillRect(x + 6, y + 16, 36, 2);
  g.fillStyle = th.accent; g.fillRect(x + 10, y + 20, 2, 2); g.fillRect(x + 36, y + 20, 2, 2);
  // ember
  const pulse = 1 + Math.sin(time * 3) * 0.12;
  g.save(); g.globalCompositeOperation = 'lighter';
  const grd = g.createRadialGradient(x + 24, y + 10, 1, x + 24, y + 10, 22 * pulse);
  grd.addColorStop(0, 'rgba(255,220,140,.55)');
  grd.addColorStop(0.4, 'rgba(255,150,60,.22)');
  grd.addColorStop(1, 'rgba(255,120,40,0)');
  g.fillStyle = grd; g.fillRect(x, y - 16, 48, 48);
  g.restore();
  g.fillStyle = '#ffb84a'; g.fillRect(x + 22, y + 6, 4, 6);
  g.fillStyle = '#ffe6a0'; g.fillRect(x + 23, y + 5, 2, 4);
}

function drawCampfire(g, p, th, time) {
  const x = p.x * 16, y = p.y * 16;
  shadow(g, x + 16, y + 27, 14, 4, 0.35);
  // stones
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.fillStyle = i % 2 ? '#5e5a52' : '#4a4640';
    g.fillRect(x + 16 + Math.cos(a) * 11 - 2, y + 22 + Math.sin(a) * 5 - 1, 4, 3);
  }
  g.fillStyle = '#4a2e1a'; g.fillRect(x + 8, y + 18, 16, 3);
  g.fillStyle = '#6e4728'; g.fillRect(x + 9, y + 17, 14, 2);
  // flame
  const f = Math.sin(time * 9) * 2;
  g.save(); g.globalCompositeOperation = 'lighter';
  const grd = g.createRadialGradient(x + 16, y + 14, 1, x + 16, y + 14, 24);
  grd.addColorStop(0, 'rgba(255,190,80,.5)');
  grd.addColorStop(1, 'rgba(255,120,30,0)');
  g.fillStyle = grd; g.fillRect(x - 10, y - 12, 52, 52);
  g.restore();
  g.fillStyle = '#e85a2a'; g.fillRect(x + 12, y + 8 + f, 8, 10);
  g.fillStyle = '#ffb84a'; g.fillRect(x + 14, y + 6 + f, 4, 10);
  g.fillStyle = '#fff0b8'; g.fillRect(x + 15, y + 9 + f, 2, 5);
  g.fillStyle = 'rgba(255,180,80,.8)'; g.fillRect(x + 18, y + 1 + f, 2, 2);
}

function drawBanner(g, p, th) {
  const x = p.x * 16, y = p.y * 16;
  g.fillStyle = '#4a3a2a'; g.fillRect(x + 1, y + 1, 14, 2);
  g.fillStyle = th.dark ? '#6a2030' : '#7a2a3a';
  poly(g, th.dark ? '#6a2030' : '#7a2a3a', [[x + 3, y + 3], [x + 13, y + 3], [x + 13, y + 26], [x + 8, y + 22], [x + 3, y + 26]]);
  g.fillStyle = '#c9a44c'; g.fillRect(x + 7, y + 8, 2, 8); g.fillRect(x + 5, y + 11, 6, 2);
  g.fillStyle = '#e7c77b'; g.fillRect(x + 7, y + 6, 2, 2);
}

function drawDummy(g, p, th) {
  const x = p.x * 16, y = p.y * 16;
  shadow(g, x + 8, y + 15, 6, 2, 0.3);
  g.fillStyle = '#5c4028'; g.fillRect(x + 7, y + 6, 2, 9);
  g.fillStyle = '#8a6a3a'; g.fillRect(x + 3, y + 3, 10, 8);
  g.fillStyle = '#a88a5a'; g.fillRect(x + 4, y + 4, 8, 6);
  g.fillStyle = '#c9a44c'; g.fillRect(x + 7, y + 5, 2, 2);
  g.fillStyle = '#5c4028'; g.fillRect(x + 1, y + 6, 14, 2);
  g.fillStyle = '#c94a4a'; g.fillRect(x + 10, y + 9, 2, 2);
}

function drawTent(g, p, th) {
  const x = p.x * 16, y = p.y * 16;
  shadow(g, x + 24, y + 30, 22, 4, 0.3);
  poly(g, '#5a4a34', [[x + 2, y + 30], [x + 24, y - 2], [x + 46, y + 30]]);
  poly(g, '#6e5a3e', [[x + 5, y + 30], [x + 24, y + 1], [x + 43, y + 30]]);
  poly(g, '#4a3c2a', [[x + 20, y + 30], [x + 24, y + 10], [x + 28, y + 30]]);
  g.fillStyle = '#3a2e20'; g.fillRect(x + 2, y + 29, 44, 2);
  g.fillStyle = '#c9a44c'; g.fillRect(x + 23, y - 4, 2, 6);
}

function drawGate(g, p, th, opts) {
  const x = p.x * 16, y = p.y * 16;
  g.fillStyle = '#4a4640'; g.fillRect(x + 2, y + 4, 10, 28); g.fillRect(x + 52, y + 4, 10, 28);
  g.fillStyle = '#5e5a52'; g.fillRect(x + 3, y + 5, 8, 26); g.fillRect(x + 53, y + 5, 8, 26);
  g.fillStyle = '#3a3632'; g.fillRect(x, y, 64, 6);
  if (!opts.open) {
    g.fillStyle = '#2a2a30';
    for (let i = 0; i < 6; i++) g.fillRect(x + 13 + i * 7, y + 6, 2, 26);
    g.fillStyle = '#3a3a42';
    g.fillRect(x + 12, y + 14, 40, 2); g.fillRect(x + 12, y + 24, 40, 2);
    g.fillStyle = '#c9a44c'; g.fillRect(x + 29, y + 16, 6, 4);
  } else {
    g.fillStyle = 'rgba(255,210,130,.25)';
    g.fillRect(x + 13, y + 6, 38, 26);
  }
}

function drawStairs(g, p, th) {
  const x = p.x * 16, y = p.y * 16;
  for (let i = 0; i < 4; i++) {
    g.fillStyle = i % 2 ? th.stone2 : th.stone;
    g.fillRect(x + i * 2, y + 4 + i * 6, 32 - i * 4, 6);
    g.fillStyle = 'rgba(255,255,255,.08)';
    g.fillRect(x + i * 2, y + 4 + i * 6, 32 - i * 4, 1);
  }
  g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(x, y + 26, 32, 2);
}

function drawRubble(g, p, th) {
  const x = p.x * 16, y = p.y * 16;
  g.fillStyle = th.stone2; g.fillRect(x + 2, y + 8, 6, 6); g.fillRect(x + 9, y + 10, 5, 4); g.fillRect(x + 5, y + 4, 4, 5);
  g.fillStyle = th.stone; g.fillRect(x + 3, y + 8, 4, 2); g.fillRect(x + 9, y + 10, 3, 1);
  g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(x + 2, y + 14, 12, 2);
}

function drawCrystal(g, p, th, time) {
  const x = p.x * 16, y = p.y * 16;
  const pulse = 0.7 + Math.sin(time * 2.4 + p.x) * 0.2;
  g.save(); g.globalCompositeOperation = 'lighter';
  const grd = g.createRadialGradient(x + 8, y + 8, 1, x + 8, y + 8, 20);
  grd.addColorStop(0, `rgba(140,230,240,${0.3 * pulse})`);
  grd.addColorStop(1, 'rgba(80,160,200,0)');
  g.fillStyle = grd; g.fillRect(x - 12, y - 12, 40, 40);
  g.restore();
  g.fillStyle = '#5a8a9a'; g.fillRect(x + 5, y + 4, 5, 10);
  g.fillStyle = '#8ad0e0'; g.fillRect(x + 6, y + 5, 3, 8);
  g.fillStyle = '#c8f0f8'; g.fillRect(x + 6, y + 5, 1, 4);
  g.fillStyle = '#4a7a8a'; g.fillRect(x + 2, y + 8, 3, 6); g.fillRect(x + 11, y + 7, 3, 7);
}

function drawTorch(g, p, th, time) {
  const x = p.x * 16, y = p.y * 16;
  g.fillStyle = '#3a2a1e'; g.fillRect(x + 6, y + 6, 4, 9);
  g.fillStyle = '#5c4028'; g.fillRect(x + 5, y + 13, 6, 2);
  const f = Math.sin(time * 10 + p.x) * 1.5;
  g.save(); g.globalCompositeOperation = 'lighter';
  const grd = g.createRadialGradient(x + 8, y + 4, 1, x + 8, y + 4, 18);
  grd.addColorStop(0, 'rgba(255,200,100,.4)');
  grd.addColorStop(1, 'rgba(255,140,40,0)');
  g.fillStyle = grd; g.fillRect(x - 12, y - 16, 40, 40);
  g.restore();
  g.fillStyle = '#e86a2a'; g.fillRect(x + 6, y + 1 + f, 4, 6);
  g.fillStyle = '#ffd27a'; g.fillRect(x + 7, y + 2 + f, 2, 4);
}

function drawTable(g, p, th) {
  const x = p.x * 16, y = p.y * 16;
  g.fillStyle = '#5c4028'; g.fillRect(x + 2, y + 4, 28, 8);
  g.fillStyle = '#8a5c34'; g.fillRect(x + 2, y + 3, 28, 3);
  g.fillStyle = '#5c4028'; g.fillRect(x + 4, y + 11, 3, 4); g.fillRect(x + 25, y + 11, 3, 4);
  g.fillStyle = '#c9a44c'; g.fillRect(x + 9, y + 4, 3, 2);
}

function drawBed(g, p, th) {
  const x = p.x * 16, y = p.y * 16;
  g.fillStyle = '#5c4028'; g.fillRect(x + 1, y + 4, 30, 26);
  g.fillStyle = '#e8e0cc'; g.fillRect(x + 3, y + 6, 26, 10);
  g.fillStyle = '#8a3040'; g.fillRect(x + 3, y + 16, 26, 12);
  g.fillStyle = '#a83a4a'; g.fillRect(x + 3, y + 16, 26, 3);
  g.fillStyle = '#fff'; g.fillRect(x + 6, y + 8, 8, 4);
}

function drawShelf(g, p, th) {
  const x = p.x * 16, y = p.y * 16;
  g.fillStyle = '#4a3220'; g.fillRect(x + 1, y - 4, 30, 20);
  g.fillStyle = '#5c4028'; g.fillRect(x + 2, y - 3, 28, 18);
  g.fillStyle = '#3a2416';
  g.fillRect(x + 2, y + 2, 28, 1); g.fillRect(x + 2, y + 8, 28, 1); g.fillRect(x + 2, y + 13, 28, 1);
  const cols = ['#8a3040', '#3a5a8a', '#5a8a4a', '#8a6a3a', '#6a4a8a'];
  for (let i = 0; i < 8; i++) {
    g.fillStyle = cols[i % cols.length];
    g.fillRect(x + 4 + i * 3, y - 1 + (i % 2) * 6, 2, 5);
  }
}

function drawBars(g, p, th, opts) {
  const x = p.x * 16, y = p.y * 16;
  const w = propSize(p).w * 16;
  if (opts.open) {
    g.fillStyle = 'rgba(140,200,220,.12)';
    g.fillRect(x, y + 2, w, 12);
    g.fillStyle = '#3a3a42';
    g.fillRect(x, y, 2, 16); g.fillRect(x + w - 2, y, 2, 16);
    return;
  }
  g.fillStyle = '#2a2a30';
  for (let i = 0; i < Math.floor(w / 6); i++) g.fillRect(x + 3 + i * 6, y - 2, 2, 16);
  g.fillStyle = '#4a4a52';
  g.fillRect(x, y + 3, w, 2); g.fillRect(x, y + 11, w, 2);
  g.fillStyle = '#c9a44c'; g.fillRect(x + w / 2 - 2, y + 6, 4, 3);
}

function drawDoor(g, p, th) {  const x = p.x * 16, y = p.y * 16;
  g.fillStyle = '#2a1e14'; g.fillRect(x + 1, y - 4, 14, 20);
  g.fillStyle = '#4a2e1a'; g.fillRect(x + 2, y - 3, 12, 18);
  g.fillStyle = '#6e4728'; g.fillRect(x + 3, y - 2, 10, 16);
  g.fillStyle = '#c9a44c'; g.fillRect(x + 10, y + 7, 2, 2);
  g.fillStyle = '#3a2416'; g.fillRect(x + 3, y + 3, 10, 1); g.fillRect(x + 3, y + 10, 10, 1);
}

function drawPortal(g, p, th, time) {
  const x = p.x * 16, y = p.y * 16;
  const pulse = 0.65 + Math.sin(time * 2.2) * 0.2;
  g.save(); g.globalCompositeOperation = 'lighter';
  const grd = g.createRadialGradient(x + 16, y + 16, 2, x + 16, y + 16, 30);
  grd.addColorStop(0, `rgba(140,230,255,${0.32 * pulse})`);
  grd.addColorStop(1, 'rgba(90,140,255,0)');
  g.fillStyle = grd; g.fillRect(x - 14, y - 14, 60, 60);
  g.restore();
  g.strokeStyle = '#8ad0e0'; g.lineWidth = 2;
  g.beginPath(); g.ellipse(x + 16, y + 18, 13, 16, 0, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = `rgba(200,240,255,${pulse})`; g.lineWidth = 1;
  g.beginPath(); g.ellipse(x + 16, y + 18, 9, 12, 0, 0, Math.PI * 2); g.stroke();
  g.fillStyle = 'rgba(120,200,230,.15)';
  g.beginPath(); g.ellipse(x + 16, y + 18, 9, 12, 0, 0, Math.PI * 2); g.fill();
}

export function drawProp(g, p, themeName, time = 0, opts = {}) {
  const th = THEMES[themeName] || THEMES.village;
  const snowy = themeName === 'snow';
  switch (p.t) {
    case 'house': drawHouse(g, p, th, time, opts); break;
    case 'hut': drawHouse(g, p, th, time, opts); break;
    case 'tower': {
      const x = p.x * 16, y = p.y * 16;
      shadow(g, x + 32, y + 76, 24, 5, 0.35);
      g.fillStyle = th.stone2; g.fillRect(x + 8, y + 20, 48, 58);
      g.fillStyle = th.stone; g.fillRect(x + 10, y + 22, 44, 54);
      g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x + 12, y + 24, 6, 48);
      poly(g, th.roof, [[x + 2, y + 22], [x + 32, y - 16], [x + 62, y + 22]]);
      poly(g, th.roof2, [[x + 2, y + 22], [x + 32, y - 16], [x + 32, y + 8]]);
      g.fillStyle = '#ffcf7a'; g.fillRect(x + 28, y + 40, 8, 12);
      g.fillStyle = '#3a2a1e'; g.fillRect(x + 32, y + 40, 1, 12);
      g.fillStyle = '#c9a44c'; g.fillRect(x + 31, y - 20, 2, 8);
      break;
    }
    case 'tree': drawTree(g, p, th, time, false); break;
    case 'pine': drawPine(g, p, th, time, false); break;
    case 'treeSnow': drawTree(g, p, th, time, true); break;
    case 'pineSnow': drawPine(g, p, th, time, true); break;
    case 'deadtree': {
      const x = p.x * 16, y = p.y * 16;
      shadow(g, x + 8, y + 14, 6, 2, 0.3);
      g.fillStyle = '#3a3028'; g.fillRect(x + 6, y + 4, 3, 11);
      g.fillRect(x + 3, y + 2, 3, 2); g.fillRect(x + 9, y + 5, 3, 2); g.fillRect(x + 2, y + 1, 2, 2);
      g.fillRect(x + 8, y + 9, 4, 1);
      break;
    }
    case 'rock': drawRock(g, p, th, time, snowy); break;
    case 'bush': drawBush(g, p, th); break;
    case 'fence': drawFence(g, p, th); break;
    case 'lamp': drawLamp(g, p, th, time); break;
    case 'well': drawWell(g, p, th); break;
    case 'stall': drawStall(g, p, th); break;
    case 'crate': {
      const x = p.x * 16, y = p.y * 16;
      g.fillStyle = '#5c4028'; g.fillRect(x + 2, y + 3, 12, 12);
      g.fillStyle = '#7a5a38'; g.fillRect(x + 3, y + 4, 10, 10);
      g.fillStyle = '#4a3220'; g.fillRect(x + 3, y + 4, 10, 1); g.fillRect(x + 3, y + 13, 10, 1);
      g.fillRect(x + 7, y + 4, 1, 10); g.fillRect(x + 3, y + 8, 10, 1);
      break;
    }
    case 'barrel': {
      const x = p.x * 16, y = p.y * 16;
      g.fillStyle = '#4a3220'; g.fillRect(x + 3, y + 2, 10, 13);
      g.fillStyle = '#6e4a2a'; g.fillRect(x + 4, y + 3, 8, 11);
      g.fillStyle = '#3a3a40'; g.fillRect(x + 3, y + 5, 10, 2); g.fillRect(x + 3, y + 11, 10, 2);
      g.fillStyle = '#8a5c34'; g.fillRect(x + 5, y + 3, 2, 11);
      break;
    }
    case 'sign': {
      const x = p.x * 16, y = p.y * 16;
      g.fillStyle = '#5c4028'; g.fillRect(x + 7, y + 6, 2, 10);
      g.fillStyle = '#8a6a3a'; g.fillRect(x + 2, y, 12, 8);
      g.fillStyle = '#a8865a'; g.fillRect(x + 3, y + 1, 10, 6);
      g.fillStyle = '#4a3220'; g.fillRect(x + 5, y + 3, 6, 1); g.fillRect(x + 5, y + 5, 4, 1);
      break;
    }
    case 'grave': {
      const x = p.x * 16, y = p.y * 16;
      shadow(g, x + 8, y + 15, 6, 2, 0.3);
      g.fillStyle = '#5e6670'; g.fillRect(x + 3, y + 4, 10, 11);
      g.fillStyle = '#767e88'; g.fillRect(x + 4, y + 5, 8, 9);
      g.fillStyle = '#4a525c'; g.fillRect(x + 7, y + 7, 2, 5); g.fillRect(x + 5, y + 9, 6, 2);
      break;
    }
    case 'statue': drawStatue(g, p, th, time); break;
    case 'pillar': drawPillar(g, p, th); break;
    case 'throne': drawThrone(g, p, th); break;
    case 'altar': drawAltar(g, p, th, time); break;
    case 'campfire': drawCampfire(g, p, th, time); break;
    case 'banner': drawBanner(g, p, th); break;
    case 'fountain': drawFountain(g, p, th, time); break;
    case 'dummy': drawDummy(g, p, th); break;
    case 'tent': drawTent(g, p, th); break;
    case 'gate': drawGate(g, p, th, opts); break;
    case 'stairs': drawStairs(g, p, th); break;
    case 'rubble': drawRubble(g, p, th); break;
    case 'crystal': drawCrystal(g, p, th, time); break;
    case 'torch': drawTorch(g, p, th, time); break;
    case 'table': drawTable(g, p, th); break;
    case 'bed': drawBed(g, p, th); break;
    case 'shelf': drawShelf(g, p, th); break;
    case 'door': drawDoor(g, p, th); break;
    case 'bars': drawBars(g, p, th, opts); break;
    case 'portal': drawPortal(g, p, th, time); break;
    default: break;
  }
}

export function drawChest(g, x, y, open, time = 0) {
  const px = x * 16, py = y * 16;
  shadow(g, px + 8, py + 14, 7, 2, 0.3);
  g.fillStyle = '#3a2416'; g.fillRect(px + 2, py + 6, 12, 8);
  g.fillStyle = '#8a5c34'; g.fillRect(px + 3, py + 7, 10, 6);
  g.fillStyle = '#c9a44c'; g.fillRect(px + 3, py + 7, 10, 1); g.fillRect(px + 7, py + 7, 2, 6);
  if (open) {
    g.fillStyle = '#5c4028'; g.fillRect(px + 2, py + 1, 12, 4);
    g.fillStyle = '#ffe6a0'; g.fillRect(px + 4, py + 6, 8, 2);
  } else {
    g.fillStyle = '#6e4728'; g.fillRect(px + 2, py + 3, 12, 5);
    g.fillStyle = '#8a5c34'; g.fillRect(px + 3, py + 4, 10, 3);
    g.fillStyle = '#e7c77b'; g.fillRect(px + 7, py + 7, 2, 3);
  }
}
