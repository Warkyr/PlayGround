const TILE = 32;
const W = 1024;
const H = 576;

const C = {
  ink: '#080a11',
  grass: '#2c4636',
  grass2: '#34523d',
  grass3: '#253b2d',
  path: '#6e5a41',
  path2: '#7d684b',
  path3: '#5c4a36',
  stone: '#3b3d49',
  stone2: '#484b59',
  stone3: '#2c2e38',
  wood: '#5c3f2c',
  wood2: '#7a5438',
  roof: '#71333a',
  roof2: '#8e4146',
  roof3: '#4d242c',
  iron: '#717785',
  iron2: '#a4aab5',
  gold: '#d8a84f',
  gold2: '#f1d391',
  skin: '#c98e64',
  skin2: '#a96e4d',
  water: '#315d73',
  water2: '#4f8ba0',
  crimson: '#8f2f3f',
  teal: '#3b827a',
  white: '#e9e1ce'
};

function hash(x, y, s = 0) {
  const n = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453123;
  return n - Math.floor(n);
}
function r(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}
function glow(ctx, x, y, radius, color, alpha = 1) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, color);
  g.addColorStop(0.45, color.replace(/[\d.]+\)$/, `${0.28 * alpha})`));
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* World tiles                                                         */
/* ------------------------------------------------------------------ */

function drawTile(ctx, ch, tx, ty, t) {
  const x = tx * TILE;
  const y = ty * TILE;
  const n = hash(tx, ty);
  const n2 = hash(tx, ty, 7);

  if (ch === 'T') {
    drawGrass(ctx, x, y, n, t);
    r(ctx, x + 13, y + 18, 6, 13, '#3b2a20');
    r(ctx, x + 14, y + 18, 2, 13, '#553a29');
    ellipse(ctx, x + 16, y + 13, 17, 13, '#1c3428');
    ellipse(ctx, x + 10, y + 10, 11, 9, '#24432f');
    ellipse(ctx, x + 22, y + 9, 10, 8, '#2d5038');
    ellipse(ctx, x + 16, y + 5, 12, 8, '#31573b');
    r(ctx, x + 10, y + 5, 2, 2, '#3d6846');
    r(ctx, x + 22, y + 8, 2, 2, '#3d6846');
    r(ctx, x + 15, y + 16, 3, 7, '#1b2f24');
    return;
  }
  if (ch === ',') {
    r(ctx, x, y, TILE, TILE, C.path);
    for (let i = 0; i < 4; i++) {
      const px = x + hash(tx + i, ty, 3) * 30;
      const py = y + hash(tx, ty + i, 4) * 30;
      r(ctx, px, py, 2, 2, i % 2 ? C.path2 : C.path3);
    }
    if (n > .7) {
      r(ctx, x + 7 + n * 8, y + 22, 5, 2, '#514231');
      r(ctx, x + 9 + n * 8, y + 20, 2, 4, '#514231');
    }
    return;
  }
  if (ch === 'f') {
    drawGrass(ctx, x, y, n, t);
    const colors = ['#d8b45c', '#c46f74', '#e3d7b4'];
    for (let i = 0; i < 3; i++) {
      const px = x + 6 + hash(tx + i, ty, 2) * 20;
      const py = y + 8 + hash(tx, ty + i, 6) * 18;
      r(ctx, px, py, 2, 2, colors[i % 3]);
      r(ctx, px + 2, py + 2, 1, 1, '#d9c6a0');
    }
    return;
  }
  if (ch === 'R') {
    r(ctx, x, y, TILE, TILE, C.roof3);
    for (let ry = 0; ry < 4; ry++) {
      for (let rx = 0; rx < 4; rx++) {
        const off = (ry % 2) * 4;
        r(ctx, x + rx * 8 + off, y + ry * 8, 7, 6, (rx + ry) % 2 ? C.roof : C.roof2);
        r(ctx, x + rx * 8 + off, y + ry * 8 + 6, 7, 1, '#3d1e25');
      }
    }
    r(ctx, x, y + 31, TILE, 1, '#2a151b');
    return;
  }
  if (ch === 'H') {
    r(ctx, x, y, TILE, TILE, '#b19a78');
    r(ctx, x, y + 24, TILE, 8, '#4e3b2d');
    r(ctx, x, y, 4, TILE, '#4e3b2d');
    r(ctx, x + 28, y, 4, TILE, '#4e3b2d');
    r(ctx, x + 2, y + 10, 28, 4, '#6e543a');
    for (let i = 0; i < 3; i++) r(ctx, x + 8 + i * 8, y + 6, 3, 3, '#8f7859');
    return;
  }
  if (ch === 'D') {
    r(ctx, x, y, TILE, TILE, '#4a3326');
    r(ctx, x + 3, y + 3, 26, 29, '#67462e');
    r(ctx, x + 6, y + 6, 20, 26, '#7a5437');
    r(ctx, x + 14, y + 6, 2, 26, '#4f3525');
    r(ctx, x + 22, y + 18, 3, 3, C.gold);
    r(ctx, x, y, TILE, 3, '#2f2118');
    return;
  }
  if (ch === '#') {
    r(ctx, x, y, TILE, TILE, C.stone3);
    for (let ry = 0; ry < 3; ry++) {
      const off = (ry % 2) * 8;
      for (let rx = -1; rx < 3; rx++) {
        r(ctx, x + rx * 16 + off, y + ry * 11, 15, 10, (rx + ry) % 2 ? C.stone : C.stone2);
        r(ctx, x + rx * 16 + off, y + ry * 11, 15, 1, '#5b5e6c');
      }
    }
    return;
  }
  if (ch === '_') {
    r(ctx, x, y, TILE, TILE, '#343641');
    for (let ry = 0; ry < 2; ry++) {
      for (let rx = 0; rx < 2; rx++) {
        r(ctx, x + rx * 16, y + ry * 16, 15, 15, (rx + ry) % 2 ? '#3d3f4b' : '#383a45');
      }
    }
    if (n > .6) {
      ctx.strokeStyle = '#292b34';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 8 + n * 8, y + 4);
      ctx.lineTo(x + 14 + n * 8, y + 12);
      ctx.lineTo(x + 12 + n * 8, y + 20);
      ctx.stroke();
    }
    if (n2 > .8) r(ctx, x + 6, y + 20, 8, 2, '#292b34');
    return;
  }
  if (ch === 'X') {
    r(ctx, x, y, TILE, TILE, '#24262e');
    for (let i = 0; i < 3; i++) {
      r(ctx, x + 4 + i * 10, y, 3, TILE, '#5c616e');
      r(ctx, x + 4 + i * 10, y, 1, TILE, '#8d929d');
    }
    r(ctx, x, y + 2, TILE, 3, '#4b4e59');
    r(ctx, x, y + 27, TILE, 3, '#4b4e59');
    return;
  }
  if (ch === '~') {
    const g = ctx.createLinearGradient(x, y, x, y + TILE);
    g.addColorStop(0, '#274d61');
    g.addColorStop(1, '#1c3849');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, TILE, TILE);
    const w1 = Math.sin(t * 1.6 + tx * .8) * 4;
    const w2 = Math.cos(t * 1.2 + ty) * 5;
    r(ctx, x + 4 + w1, y + 9, 16, 2, '#4f8297');
    r(ctx, x + 13 + w2, y + 21, 12, 1, '#3d7189');
    r(ctx, x + 8, y + 27, 6, 1, '#5e96aa');
    return;
  }
  if (ch === 'b') {
    r(ctx, x, y, TILE, TILE, '#315d73');
    r(ctx, x + 1, y + 2, TILE - 2, 28, '#6a4b30');
    for (let i = 0; i < 4; i++) r(ctx, x + 2 + i * 8, y + 3, 1, 26, '#4b3422');
    r(ctx, x, y + 2, TILE, 2, '#8a6742');
    return;
  }
  if (ch === 'P') {
    r(ctx, x, y, TILE, TILE, '#722b35');
    r(ctx, x + 3, y, 26, TILE, '#8e3540');
    r(ctx, x, y, 2, TILE, '#c3964d');
    r(ctx, x + 30, y, 2, TILE, '#c3964d');
    for (let i = 0; i < 3; i++) r(ctx, x + 7 + i * 8, y + 6, 1, 20, '#a6464d');
    return;
  }
  if (ch === 'S') {
    r(ctx, x, y, TILE, TILE, '#2c2e38');
    for (let i = 0; i < 4; i++) {
      r(ctx, x + 2 + i * 2, y + 4 + i * 7, 28 - i * 4, 6, i % 2 ? '#525563' : '#464956');
      r(ctx, x + 2 + i * 2, y + 4 + i * 7, 28 - i * 4, 1, '#6a6d7b');
    }
    return;
  }
  if (ch === '=') {
    drawGrass(ctx, x, y, n, t);
    r(ctx, x, y + 13, TILE, 4, '#6b4a30');
    r(ctx, x, y + 13, TILE, 1, '#8e6641');
    r(ctx, x + 4, y + 8, 4, 18, '#543923');
    r(ctx, x + 24, y + 8, 4, 18, '#543923');
    return;
  }
  drawGrass(ctx, x, y, n, t);
}

function drawGrass(ctx, x, y, n, t) {
  r(ctx, x, y, TILE, TILE, n > .5 ? C.grass : C.grass2);
  if (n > .82) r(ctx, x, y, TILE, TILE, C.grass3);
  for (let i = 0; i < 4; i++) {
    const px = x + 4 + hash(x + i, y, 2) * 24;
    const py = y + 5 + hash(x, y + i, 3) * 22;
    r(ctx, px, py, 1, 3, n > .45 ? '#416b4b' : '#294433');
    if (i % 2) r(ctx, px + 2, py + 1, 1, 2, '#456f4e');
  }
}

/* ------------------------------------------------------------------ */
/* World props                                                         */
/* ------------------------------------------------------------------ */

export function drawProp(ctx, p, t, opened = false) {
  const x = p.x * TILE;
  const y = p.y * TILE;
  const w = (p.w || 1) * TILE;
  const h = (p.h || 1) * TILE;
  switch (p.type) {
    case 'fountain': {
      r(ctx, x + 4, y + 28, w - 8, h - 28, '#474b57');
      r(ctx, x + 8, y + 34, w - 16, h - 40, '#2d4c5c');
      ellipse(ctx, x + w / 2, y + 38, w / 2 - 6, 11, '#5a5e6b');
      ellipse(ctx, x + w / 2, y + 38, w / 2 - 11, 7, '#376d81');
      const wv = Math.sin(t * 2) * 2;
      r(ctx, x + 28 + wv, y + 37, 22, 1, '#69a2b1');
      r(ctx, x + 50 - wv, y + 41, 18, 1, '#4f899e');
      r(ctx, x + w / 2 - 5, y + 8, 10, 30, '#565a68');
      r(ctx, x + w / 2 - 2, y + 4, 4, 30, '#6b6f7d');
      ellipse(ctx, x + w / 2, y + 9, 8, 5, '#777b88');
      glow(ctx, x + w / 2, y + 14, 32, 'rgba(111,190,197,0.45)', .55);
      break;
    }
    case 'lamp': {
      r(ctx, x + 14, y + 7, 4, 27, '#3b2b22');
      r(ctx, x + 10, y + 3, 12, 9, '#59422d');
      r(ctx, x + 12, y + 5, 8, 6, '#e3a85d');
      glow(ctx, x + 16, y + 8, 58, 'rgba(238,171,84,0.6)', .8);
      break;
    }
    case 'stall': {
      r(ctx, x + 2, y + 17, w - 4, h - 17, '#5b402c');
      for (let i = 0; i < 4; i++) r(ctx, x + 4 + i * 15, y + 18, 2, 14, '#3c2a1e');
      for (let i = 0; i < 4; i++) {
        r(ctx, x + i * 16, y + 2, 15, 9, i % 2 ? '#b6a27d' : (p.color === 'green' ? '#477d65' : '#9a3e45'));
      }
      r(ctx, x, y + 10, w, 3, '#31231a');
      r(ctx, x + 8, y + 14, 7, 5, '#b9823e');
      r(ctx, x + 18, y + 14, 6, 4, '#8f4b38');
      r(ctx, x + 40, y + 14, 7, 5, '#5d7d50');
      break;
    }
    case 'barrels': {
      r(ctx, x + 8, y + 11, 15, 18, '#5b3d28');
      r(ctx, x + 9, y + 12, 13, 16, '#765035');
      r(ctx, x + 8, y + 15, 15, 2, '#3c2a1c');
      r(ctx, x + 8, y + 24, 15, 2, '#3c2a1c');
      break;
    }
    case 'crate': {
      r(ctx, x + 8, y + 12, 17, 17, '#6b4b2e');
      r(ctx, x + 9, y + 13, 15, 15, '#825d3a');
      r(ctx, x + 9, y + 20, 15, 2, '#523822');
      r(ctx, x + 15, y + 13, 2, 15, '#523822');
      break;
    }
    case 'banner': {
      r(ctx, x + 12, y, 2, 8, '#7e6337');
      r(ctx, x + 6, y + 7, 15, 30, p.color === 'crimson' ? '#742b35' : '#8b6529');
      ctx.beginPath();
      ctx.moveTo(x + 6, y + 37);
      ctx.lineTo(x + 13.5, y + 44);
      ctx.lineTo(x + 21, y + 37);
      ctx.fillStyle = p.color === 'crimson' ? '#742b35' : '#8b6529';
      ctx.fill();
      r(ctx, x + 11, y + 15, 5, 5, '#d8b25d');
      r(ctx, x + 13, y + 13, 1, 9, '#d8b25d');
      break;
    }
    case 'torch': {
      r(ctx, x + 13, y + 12, 5, 16, '#3c2b21');
      r(ctx, x + 9, y + 24, 13, 4, '#29221d');
      const fl = Math.sin(t * 10 + p.x) * 2;
      ellipse(ctx, x + 16, y + 8 + fl * .3, 5, 8, '#e87737');
      ellipse(ctx, x + 16, y + 7 + fl * .3, 3, 6, '#ffd47a');
      glow(ctx, x + 16, y + 9, 72, 'rgba(239,120,54,0.55)', .9);
      break;
    }
    case 'chest': {
      r(ctx, x + 6, y + 13, 21, 15, '#5a3b25');
      r(ctx, x + 7, y + 14, 19, 13, '#7a5331');
      r(ctx, x + 6, y + 12, 21, 7, '#6a462b');
      r(ctx, x + 7, y + 13, 19, 5, '#8d623a');
      r(ctx, x + 13, y + 18, 6, 5, '#d2a64d');
      r(ctx, x + 15, y + 19, 2, 3, '#4c321c');
      if (!opened) {
        glow(ctx, x + 16, y + 18, 28, 'rgba(237,194,94,0.42)', .5);
        const bob = Math.sin(t * 3 + p.x) * 1;
        r(ctx, x + 14, y + 2 + bob, 4, 4, '#f3d58d');
      }
      break;
    }
    case 'chains': {
      r(ctx, x + 5, y + 5, 2, 19, '#555966');
      r(ctx, x + 11, y + 3, 2, 22, '#494d59');
      r(ctx, x + 17, y + 7, 2, 16, '#606572');
      r(ctx, x + 24, y + 2, 2, 24, '#4f535f');
      break;
    }
    case 'stairs': {
      r(ctx, x, y + 10, TILE, 22, '#1f2129');
      for (let i = 0; i < 4; i++) r(ctx, x + 3 + i * 2, y + 12 + i * 5, 26 - i * 4, 4, '#565a67');
      break;
    }
    case 'ruin': {
      r(ctx, x, y + 8, w, 20, '#454854');
      r(ctx, x + 4, y + 2, 12, 28, '#565967');
      r(ctx, x + 19, y + 6, 10, 22, '#3c3f4a');
      r(ctx, x, y + 26, w, 3, '#2b2d35');
      break;
    }
    case 'log': {
      r(ctx, x + 2, y + 19, w - 4, 9, '#5a3c28');
      r(ctx, x + 2, y + 20, w - 4, 3, '#795135');
      ellipse(ctx, x + w - 4, y + 23, 4, 5, '#3b281c');
      break;
    }
    case 'campfire': {
      r(ctx, x + 4, y + 23, 24, 4, '#3d2a20');
      r(ctx, x + 9, y + 19, 15, 5, '#5b3b28');
      ellipse(ctx, x + 16, y + 21, 10, 5, '#2e241d');
      const fl = Math.sin(t * 9) * 2;
      ellipse(ctx, x + 16, y + 15, 6, 9 + fl, '#d75c31');
      ellipse(ctx, x + 16, y + 14, 4, 7 + fl * .5, '#f3a347');
      ellipse(ctx, x + 16, y + 13, 2, 4, '#ffe0a0');
      glow(ctx, x + 16, y + 16, 80, 'rgba(232,112,53,0.6)', .8);
      break;
    }
    case 'shrine': {
      r(ctx, x + 4, y + 15, 24, 14, '#4d505c');
      r(ctx, x + 7, y + 9, 18, 8, '#626573');
      r(ctx, x + 14, y + 3, 4, 8, '#d5ad5c');
      r(ctx, x + 12, y + 5, 8, 2, '#d5ad5c');
      glow(ctx, x + 16, y + 11, 32, 'rgba(108,199,181,0.4)', .6);
      break;
    }
    case 'sign': {
      r(ctx, x + 14, y + 15, 3, 17, '#513822');
      r(ctx, x + 5, y + 7, 22, 12, '#765131');
      r(ctx, x + 7, y + 9, 18, 8, '#8d6740');
      r(ctx, x + 9, y + 11, 12, 1, '#4b3320');
      r(ctx, x + 9, y + 14, 8, 1, '#4b3320');
      break;
    }
    case 'tent': {
      ctx.beginPath();
      ctx.moveTo(x + 4, y + h);
      ctx.lineTo(x + w / 2, y + 2);
      ctx.lineTo(x + w - 4, y + h);
      ctx.closePath();
      ctx.fillStyle = p.color === 'crimson' ? '#70313a' : '#356d67';
      ctx.fill();
      ctx.strokeStyle = '#241c1a';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y + 4);
      ctx.lineTo(x + w / 2 + 10, y + h);
      ctx.strokeStyle = '#d2b67d';
      ctx.lineWidth = 1;
      ctx.stroke();
      r(ctx, x + w / 2 - 8, y + h - 14, 16, 14, '#1a1719');
      break;
    }
    case 'forge': {
      r(ctx, x + 2, y + 20, 28, 12, '#3b3d48');
      r(ctx, x + 7, y + 8, 18, 13, '#555966');
      r(ctx, x + 11, y + 11, 10, 5, '#2a2c34');
      const fl = Math.sin(t * 8) * 2;
      ellipse(ctx, x + 16, y + 17, 8, 4, '#d75b2c');
      ellipse(ctx, x + 16, y + 16, 4, 3, '#ffbe58');
      glow(ctx, x + 16, y + 17, 42, 'rgba(232,99,44,0.55)', .7);
      break;
    }
    case 'bedroll': {
      r(ctx, x + 3, y + 17, 26, 11, '#4d3a2e');
      r(ctx, x + 4, y + 18, 24, 8, '#7a5a40');
      r(ctx, x + 7, y + 15, 14, 5, '#c8b28c');
      break;
    }
    case 'throne': {
      r(ctx, x + 4, y + 12, 24, 20, '#5b3424');
      r(ctx, x + 7, y + 15, 18, 16, '#773f2a');
      r(ctx, x + 2, y - 2, 28, 15, '#3e241a');
      r(ctx, x + 6, y + 1, 20, 11, '#673725');
      r(ctx, x + 11, y - 9, 10, 9, '#b98a43');
      r(ctx, x + 13, y - 13, 6, 5, '#d8a84f');
      r(ctx, x + 15, y - 17, 2, 5, '#d8a84f');
      break;
    }
    case 'carpet': {
      const px = p.x * TILE;
      const py = p.y * TILE;
      r(ctx, px, py, w, h, '#7b2b36');
      r(ctx, px + 4, py, w - 8, h, '#963742');
      r(ctx, px, py, 3, h, '#b78a45');
      r(ctx, px + w - 3, py, 3, h, '#b78a45');
      break;
    }
    case 'pillar': {
      r(ctx, x + 7, y + 3, 18, 29, '#484b57');
      r(ctx, x + 9, y + 3, 14, 29, '#5d606d');
      r(ctx, x + 5, y, 22, 5, '#6c6f7b');
      r(ctx, x + 4, y + 29, 24, 3, '#30323b');
      r(ctx, x + 11, y + 7, 2, 18, '#717481');
      break;
    }
    case 'brazier': {
      r(ctx, x + 12, y + 22, 8, 9, '#4b4d58');
      r(ctx, x + 7, y + 18, 18, 5, '#6d6f7a');
      const fl = Math.sin(t * 7 + p.x) * 2;
      ellipse(ctx, x + 16, y + 13, 7, 8, '#d95f34');
      ellipse(ctx, x + 16, y + 12, 4, 6, '#f7b351');
      glow(ctx, x + 16, y + 13, 60, 'rgba(232,100,47,0.55)', .8);
      break;
    }
    case 'statue': {
      r(ctx, x + 7, y + 21, 18, 10, '#444752');
      r(ctx, x + 9, y + 8, 14, 15, '#5a5d69');
      ellipse(ctx, x + 16, y + 6, 5, 5, '#6a6d79');
      r(ctx, x + 12, y + 10, 8, 9, '#6b6e7a');
      r(ctx, x + 15, y + 22, 2, 9, '#6b6e7a');
      break;
    }
    default:
      break;
  }
}

/* ------------------------------------------------------------------ */
/* Characters                                                          */
/* ------------------------------------------------------------------ */

const PALETTES = {
  kael: { hair: '#2b2020', hair2: '#45302b', skin: C.skin, cloth: '#343b4a', cloth2: '#4a5264', accent: '#9d3540', cape: '#5c2029', metal: '#8f96a3' },
  mira: { hair: '#7b3b2b', hair2: '#a45b3e', skin: '#c98b69', cloth: '#24554f', cloth2: '#337a70', accent: '#d3a84e', cape: '#1d433f', metal: '#aeb6bd' },
  brann: { hair: '#8e8a80', hair2: '#b9b3a5', skin: '#b97b55', cloth: '#4b4034', cloth2: '#6a5944', accent: '#a8743f', cape: '#3b322a', metal: '#7a7f8a' },
  lyra: { hair: '#d9d2c7', hair2: '#f1e9db', skin: '#d8a27d', cloth: '#5c2435', cloth2: '#803146', accent: '#d4a44f', cape: '#3c1723', metal: '#d7bd7f' },
  darian: { hair: '#b98a46', hair2: '#ddb467', skin: '#c98e64', cloth: '#2f4664', cloth2: '#3e5d82', accent: '#c9a04d', cape: '#21344c', metal: '#b6bcc7' },
  elder: { hair: '#b9b3a5', hair2: '#ddd6c7', skin: '#b77b56', cloth: '#4a3b2e', cloth2: '#66523e', accent: '#a77e42', cape: '#352a21', metal: '#8a8e99' },
  child: { hair: '#5b3927', hair2: '#7c4f33', skin: '#cf956d', cloth: '#5e7149', cloth2: '#7d925e', accent: '#c79d50', cape: '#435135', metal: '#8a8e99' },
  merchant: { hair: '#3e2b24', hair2: '#5a3d2d', skin: '#c78c67', cloth: '#5d3e2e', cloth2: '#7e543b', accent: '#b9903f', cape: '#483023', metal: '#8a8e99' },
  guard: { hair: '#3b2a22', hair2: '#543c2b', skin: '#c18a64', cloth: '#3e424d', cloth2: '#5b616e', accent: '#8d2e3a', cape: '#2d3039', metal: '#9da3ae' },
  prisoner: { hair: '#4b3428', hair2: '#654735', skin: '#b77d59', cloth: '#4e4b43', cloth2: '#666157', accent: '#6b5a44', cape: '#3e3b34', metal: '#7b7e87' },
  smith: { hair: '#3e2c22', hair2: '#5c4030', skin: '#b57853', cloth: '#453b33', cloth2: '#665446', accent: '#a36f3d', cape: '#332b25', metal: '#7e828d' },
  wanderer: { hair: '#4c4a45', hair2: '#6d6a63', skin: '#ad7654', cloth: '#364238', cloth2: '#4e5f50', accent: '#8c7b54', cape: '#28322b', metal: '#7b7e87' },
  voss: { hair: '#d6d0c5', hair2: '#f0e9dc', skin: '#b98563', cloth: '#2f2733', cloth2: '#4a3c4e', accent: '#c6a24e', cape: '#221b27', metal: '#c5a453' }
};

function drawWeapon(ctx, id, dir, t, battle = false) {
  if (id === 'kael' || id === 'darian') {
    r(ctx, 8, -19, 2, 17, '#d9d6c9');
    r(ctx, 9, -18, 1, 15, '#8d909c');
    r(ctx, 6, -5, 6, 2, id === 'darian' ? '#d6b261' : '#80593a');
    r(ctx, 7, -3, 4, 5, '#3a2b22');
    if (battle) {
      r(ctx, 8, -24, 2, 6, '#e6e2d5');
    }
  } else if (id === 'brann') {
    r(ctx, 9, -16, 3, 18, '#5a3b28');
    r(ctx, 7, -22, 8, 8, '#7d818d');
    r(ctx, 8, -21, 6, 3, '#a3a8b3');
  } else if (id === 'mira') {
    r(ctx, 8, -13, 1, 9, '#d3d8de');
    r(ctx, 7, -4, 3, 2, '#9a6d37');
  } else if (id === 'lyra') {
    r(ctx, 8, -28, 1, 26, '#d9bb72');
    ellipse(ctx, 8.5, -29, 2, 3, '#f0d58d');
  }
}

export function drawCharacter(ctx, id, x, y, dir = 'down', frame = 0, scale = 1, opts = {}) {
  const p = PALETTES[id] || PALETTES.kael;
  const bob = opts.idle ? Math.sin((opts.time || 0) * 3 + x) * .7 : (frame === 1 ? -1 : 0);
  const walk = frame === 1 ? 1 : frame === 2 ? -1 : 0;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(scale, scale);
  if (dir === 'left') ctx.scale(-1, 1);
  ctx.imageSmoothingEnabled = false;

  // shadow
  ellipse(ctx, 0, 1, 11, 4, 'rgba(0,0,0,0.38)');

  const isChild = id === 'child';
  const bodyScale = id === 'brann' ? 1.18 : isChild ? .72 : 1;
  ctx.save();
  ctx.scale(bodyScale, bodyScale);
  if (isChild) ctx.translate(0, 5);

  // legs
  r(ctx, -6 + walk, -8 + bob, 4, 9, '#2a2220');
  r(ctx, 2 - walk, -8 + bob, 4, 9, '#2a2220');
  r(ctx, -7 + walk, -2 + bob, 5, 3, '#191717');
  r(ctx, 2 - walk, -2 + bob, 5, 3, '#191717');

  // cape / back cloth
  if (id !== 'child') {
    ctx.beginPath();
    ctx.moveTo(-7, -22 + bob);
    ctx.lineTo(7, -22 + bob);
    ctx.lineTo(9 + (frame === 1 ? 1 : 0), -6 + bob);
    ctx.lineTo(-9 - (frame === 1 ? 1 : 0), -6 + bob);
    ctx.closePath();
    ctx.fillStyle = p.cape;
    ctx.fill();
  }

  // torso
  r(ctx, -7, -23 + bob, 14, 16, p.cloth);
  r(ctx, -6, -22 + bob, 12, 13, p.cloth2);
  r(ctx, -5, -20 + bob, 10, 3, p.accent);
  r(ctx, -2, -19 + bob, 4, 11, p.cloth);
  r(ctx, -7, -9 + bob, 14, 3, '#2b2522');

  // belt / metal
  if (id === 'guard' || id === 'darian' || id === 'kael') {
    r(ctx, -6, -12 + bob, 12, 3, p.metal);
    r(ctx, -5, -11 + bob, 3, 2, p.accent);
  }

  // arms
  if (dir === 'left' || dir === 'right') {
    r(ctx, 4, -21 + bob, 4, 12, p.cloth);
    r(ctx, 5, -10 + bob, 4, 3, p.skin);
  } else {
    r(ctx, -10, -21 + bob, 4, 12, p.cloth);
    r(ctx, 6, -21 + bob, 4, 12, p.cloth);
    r(ctx, -10, -10 + bob, 4, 3, p.skin);
    r(ctx, 6, -10 + bob, 4, 3, p.skin);
  }

  // head
  r(ctx, -5, -32 + bob, 10, 10, p.skin);
  r(ctx, -6, -33 + bob, 12, 4, p.hair);
  r(ctx, -6, -31 + bob, 3, 6, p.hair2);
  if (id === 'lyra') {
    r(ctx, -8, -31 + bob, 3, 16, p.hair2);
    r(ctx, 6, -31 + bob, 3, 16, p.hair);
    r(ctx, -4, -35 + bob, 8, 2, '#d7b15d');
    r(ctx, -1, -37 + bob, 2, 3, '#f0d58d');
  }
  if (id === 'brann') {
    r(ctx, -6, -24 + bob, 12, 7, p.hair);
    r(ctx, -4, -22 + bob, 8, 5, p.hair2);
  }
  if (id === 'mira' && dir !== 'up') {
    r(ctx, -7, -34 + bob, 14, 5, p.cloth);
    r(ctx, -7, -29 + bob, 3, 10, p.cloth);
    r(ctx, 5, -29 + bob, 3, 10, p.cloth);
  }
  if (id === 'guard') {
    r(ctx, -6, -35 + bob, 12, 6, p.metal);
    r(ctx, -3, -37 + bob, 6, 3, p.accent);
  }
  if (id === 'darian') {
    r(ctx, -5, -35 + bob, 10, 3, p.metal);
    r(ctx, -2, -37 + bob, 4, 3, p.accent);
  }

  // face
  if (dir !== 'up') {
    if (dir === 'left' || dir === 'right') {
      r(ctx, 1, -28 + bob, 2, 2, '#1a1718');
      r(ctx, 2, -26 + bob, 2, 1, p.skin);
    } else {
      r(ctx, -3, -28 + bob, 2, 2, '#1a1718');
      r(ctx, 1, -28 + bob, 2, 2, '#1a1718');
      if (id === 'lyra') r(ctx, -1, -25 + bob, 2, 1, '#8d4d4d');
      else if (id === 'kael') r(ctx, -1, -25 + bob, 2, 1, '#704032');
      else r(ctx, -1, -25 + bob, 2, 1, '#8f5c45');
    }
  }

  // hood / cloak collar
  if (id === 'mira') {
    r(ctx, -8, -24 + bob, 16, 3, p.cloth);
    r(ctx, -1, -23 + bob, 2, 11, p.accent);
  }
  if (id === 'voss') {
    r(ctx, -7, -23 + bob, 14, 3, p.accent);
  }

  // scars / details
  if (id === 'kael') {
    r(ctx, -4, -29 + bob, 1, 3, '#8b5e4b');
    r(ctx, 5, -30 + bob, 3, 2, '#3d2a22');
  }

  drawWeapon(ctx, id, dir, opts.time || 0, opts.battle);
  ctx.restore();
  ctx.restore();
}

export function drawShadow(ctx, x, y, rx = 13, ry = 4) {
  ellipse(ctx, x, y, rx, ry, 'rgba(0,0,0,0.35)');
}

/* ------------------------------------------------------------------ */
/* Portraits                                                           */
/* ------------------------------------------------------------------ */

export function drawPortrait(canvas, id, mood = 'neutral') {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const p = PALETTES[id] || PALETTES.kael;
  ctx.clearRect(0, 0, w, h);
  ctx.imageSmoothingEnabled = false;
  const bg = ctx.createRadialGradient(w * .5, h * .32, 4, w * .5, h * .45, w * .8);
  bg.addColorStop(0, '#3b4053');
  bg.addColorStop(.55, '#171b27');
  bg.addColorStop(1, '#080b12');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // backdrop emblem
  ctx.save();
  ctx.globalAlpha = .13;
  ctx.strokeStyle = '#e2b45e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(w * .5, h * .45, w * .37, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w * .5, h * .13);
  ctx.lineTo(w * .5, h * .8);
  ctx.moveTo(w * .2, h * .45);
  ctx.lineTo(w * .8, h * .45);
  ctx.stroke();
  ctx.restore();

  const s = w / 144;
  ctx.save();
  ctx.scale(s, s);
  ctx.translate(0, 2);

  // shoulders
  ctx.beginPath();
  ctx.moveTo(18, 144);
  ctx.lineTo(26, 102);
  ctx.quadraticCurveTo(72, 80, 118, 102);
  ctx.lineTo(126, 144);
  ctx.closePath();
  ctx.fillStyle = p.cape;
  ctx.fill();
  ctx.strokeStyle = '#0b0d14';
  ctx.lineWidth = 3;
  ctx.stroke();

  // body
  ctx.beginPath();
  ctx.moveTo(37, 144);
  ctx.lineTo(41, 106);
  ctx.quadraticCurveTo(72, 91, 103, 106);
  ctx.lineTo(107, 144);
  ctx.closePath();
  ctx.fillStyle = p.cloth;
  ctx.fill();
  ctx.strokeStyle = '#11131b';
  ctx.lineWidth = 3;
  ctx.stroke();

  // collar
  ctx.beginPath();
  ctx.moveTo(46, 107);
  ctx.lineTo(72, 121);
  ctx.lineTo(98, 107);
  ctx.lineTo(90, 98);
  ctx.lineTo(72, 108);
  ctx.lineTo(54, 98);
  ctx.closePath();
  ctx.fillStyle = p.cloth2;
  ctx.fill();
  ctx.strokeStyle = p.accent;
  ctx.lineWidth = 2;
  ctx.stroke();

  // neck
  r(ctx, 63, 87, 18, 22, p.skin);
  r(ctx, 64, 86, 16, 4, '#a96e4d');

  // ears
  ellipse(ctx, 47, 71, 5, 8, p.skin);
  ellipse(ctx, 97, 71, 5, 8, p.skin);

  // head
  ctx.beginPath();
  ctx.ellipse(72, 65, 28, 34, 0, 0, Math.PI * 2);
  ctx.fillStyle = p.skin;
  ctx.fill();
  ctx.strokeStyle = '#2a1b19';
  ctx.lineWidth = 2;
  ctx.stroke();

  // hair back
  ctx.beginPath();
  ctx.ellipse(72, 47, 32, 22, 0, Math.PI, Math.PI * 2);
  ctx.lineTo(102, 63);
  ctx.quadraticCurveTo(98, 36, 72, 31);
  ctx.quadraticCurveTo(46, 36, 42, 63);
  ctx.closePath();
  ctx.fillStyle = p.hair;
  ctx.fill();

  // hair fringe
  ctx.beginPath();
  ctx.moveTo(44, 53);
  ctx.quadraticCurveTo(49, 29, 72, 30);
  ctx.quadraticCurveTo(94, 30, 100, 51);
  ctx.lineTo(92, 44);
  ctx.lineTo(86, 54);
  ctx.lineTo(79, 43);
  ctx.lineTo(70, 52);
  ctx.lineTo(63, 42);
  ctx.lineTo(55, 52);
  ctx.lineTo(48, 45);
  ctx.closePath();
  ctx.fillStyle = p.hair2;
  ctx.fill();
  ctx.strokeStyle = p.hair;
  ctx.lineWidth = 2;
  ctx.stroke();

  if (id === 'lyra') {
    // long silver hair
    ctx.fillStyle = p.hair;
    ctx.fillRect(39, 58, 9, 57);
    ctx.fillRect(96, 58, 9, 57);
    r(ctx, 36, 58, 4, 35, p.hair2);
    r(ctx, 104, 58, 4, 35, p.hair2);
    // circlet
    r(ctx, 50, 40, 44, 4, '#d8b15c');
    r(ctx, 69, 34, 6, 8, '#f2d790');
    r(ctx, 70, 30, 4, 6, '#f2d790');
    r(ctx, 67, 38, 10, 2, '#f2d790');
  }
  if (id === 'mira') {
    // hood
    ctx.beginPath();
    ctx.moveTo(39, 80);
    ctx.quadraticCurveTo(35, 28, 72, 24);
    ctx.quadraticCurveTo(109, 28, 105, 80);
    ctx.lineTo(96, 63);
    ctx.quadraticCurveTo(96, 37, 72, 35);
    ctx.quadraticCurveTo(48, 37, 48, 63);
    ctx.closePath();
    ctx.fillStyle = p.cloth;
    ctx.fill();
    ctx.strokeStyle = '#122c2b';
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  if (id === 'brann') {
    // beard
    ctx.beginPath();
    ctx.moveTo(48, 74);
    ctx.quadraticCurveTo(53, 104, 72, 110);
    ctx.quadraticCurveTo(91, 104, 96, 74);
    ctx.quadraticCurveTo(87, 88, 72, 88);
    ctx.quadraticCurveTo(57, 88, 48, 74);
    ctx.closePath();
    ctx.fillStyle = p.hair2;
    ctx.fill();
    ctx.strokeStyle = '#777267';
    ctx.lineWidth = 2;
    ctx.stroke();
    r(ctx, 65, 87, 14, 3, '#d0c6b5');
  }
  if (id === 'kael') {
    // scar
    ctx.strokeStyle = '#9a5c4c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(85, 57);
    ctx.lineTo(90, 73);
    ctx.stroke();
    // scarf
    ctx.fillStyle = p.accent;
    ctx.fillRect(50, 100, 44, 8);
  }
  if (id === 'darian') {
    // golden laurel
    ctx.strokeStyle = '#d8b15c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(72, 57, 34, Math.PI * 1.12, Math.PI * 1.88);
    ctx.stroke();
    r(ctx, 69, 28, 6, 5, '#d8b15c');
  }

  // eyebrows
  ctx.strokeStyle = p.hair;
  ctx.lineWidth = 3;
  const browY = mood === 'angry' ? 56 : mood === 'sad' ? 60 : 58;
  ctx.beginPath();
  ctx.moveTo(55, browY);
  ctx.lineTo(65, browY - (mood === 'angry' ? 2 : 0));
  ctx.moveTo(79, browY - (mood === 'angry' ? 2 : 0));
  ctx.lineTo(89, browY);
  ctx.stroke();

  // eyes
  const eyeY = 66;
  ctx.fillStyle = '#f1e8d4';
  ctx.beginPath();
  ctx.ellipse(60, eyeY, 5, 3.4, 0, 0, Math.PI * 2);
  ctx.ellipse(84, eyeY, 5, 3.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = id === 'lyra' ? '#80506d' : id === 'mira' ? '#3f8e85' : '#3d5a58';
  ctx.beginPath();
  ctx.arc(61, eyeY, 2.6, 0, Math.PI * 2);
  ctx.arc(85, eyeY, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111016';
  ctx.beginPath();
  ctx.arc(61, eyeY, 1.2, 0, Math.PI * 2);
  ctx.arc(85, eyeY, 1.2, 0, Math.PI * 2);
  ctx.fill();
  // eyeliner
  ctx.strokeStyle = '#3d2624';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(54, eyeY - 4);
  ctx.quadraticCurveTo(60, eyeY - 7, 66, eyeY - 3);
  ctx.moveTo(78, eyeY - 3);
  ctx.quadraticCurveTo(84, eyeY - 7, 90, eyeY - 4);
  ctx.stroke();

  // nose
  ctx.strokeStyle = '#9b6249';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(72, 68);
  ctx.lineTo(69, 79);
  ctx.lineTo(74, 81);
  ctx.stroke();

  // mouth
  ctx.strokeStyle = mood === 'smile' ? '#8a4b45' : '#8b5548';
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (mood === 'smile') {
    ctx.arc(72, 88, 9, .2, Math.PI - .2);
  } else if (mood === 'sad') {
    ctx.arc(72, 95, 8, Math.PI + .3, Math.PI * 2 - .3);
  } else {
    ctx.moveTo(64, 90);
    ctx.lineTo(80, 90);
  }
  ctx.stroke();

  ctx.restore();

  // frame
  const v = ctx.createRadialGradient(w / 2, h / 2, w * .2, w / 2, h / 2, w * .75);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,.55)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(216,168,79,.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, w - 2, h - 2);
}

/* ------------------------------------------------------------------ */
/* Title scene                                                         */
/* ------------------------------------------------------------------ */

const stars = Array.from({ length: 110 }, (_, i) => ({
  x: hash(i, 3, 1) * W,
  y: hash(i, 7, 2) * H * .58,
  s: .6 + hash(i, 11, 3) * 1.7,
  p: hash(i, 13, 4) * 6
}));

export function drawTitleScene(ctx, t) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#060913');
  sky.addColorStop(.42, '#121b33');
  sky.addColorStop(.7, '#252438');
  sky.addColorStop(1, '#0c0b10');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // aurora
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = .12;
  const aur = ctx.createLinearGradient(0, 0, W, H * .5);
  aur.addColorStop(0, 'transparent');
  aur.addColorStop(.35, '#3e7d8d');
  aur.addColorStop(.65, '#6d4c7d');
  aur.addColorStop(1, 'transparent');
  ctx.fillStyle = aur;
  ctx.beginPath();
  ctx.ellipse(W * .55, H * .2, W * .62, H * .2, -.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  for (const s of stars) {
    const a = .35 + Math.sin(t * .8 + s.p) * .25;
    ctx.globalAlpha = a;
    r(ctx, s.x, s.y, s.s, s.s, '#dfe7f5');
  }
  ctx.globalAlpha = 1;

  // moon
  glow(ctx, 740, 135, 170, 'rgba(183,198,223,0.22)', 1);
  ellipse(ctx, 740, 135, 57, 57, '#c7ccd8');
  ellipse(ctx, 748, 130, 55, 55, '#d9dce2');
  ellipse(ctx, 722, 119, 11, 7, 'rgba(140,145,158,.25)');
  ellipse(ctx, 759, 156, 8, 5, 'rgba(140,145,158,.2)');

  // clouds
  ctx.save();
  ctx.globalAlpha = .18;
  for (let i = 0; i < 5; i++) {
    const cx = ((t * 7 + i * 250) % (W + 300)) - 150;
    const cy = 190 + i * 28;
    const g = ctx.createLinearGradient(cx - 130, cy, cx + 130, cy);
    g.addColorStop(0, 'transparent');
    g.addColorStop(.5, '#72809b');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 140, 13, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // distant mountains
  ctx.beginPath();
  ctx.moveTo(0, 420);
  ctx.lineTo(120, 300);
  ctx.lineTo(220, 372);
  ctx.lineTo(340, 250);
  ctx.lineTo(450, 380);
  ctx.lineTo(590, 280);
  ctx.lineTo(720, 390);
  ctx.lineTo(860, 265);
  ctx.lineTo(1024, 400);
  ctx.lineTo(1024, 576);
  ctx.lineTo(0, 576);
  ctx.closePath();
  const mg = ctx.createLinearGradient(0, 250, 0, 576);
  mg.addColorStop(0, '#171d2b');
  mg.addColorStop(1, '#0a0c13');
  ctx.fillStyle = mg;
  ctx.fill();

  // castle silhouette
  ctx.save();
  ctx.translate(W * .52, 300);
  const castle = [
    [-96, 110, 20, 110], [-76, 92, 18, 128], [-58, 112, 18, 108],
    [-40, 60, 22, 160], [-18, 84, 18, 136], [0, 36, 26, 184],
    [26, 84, 18, 136], [44, 62, 22, 158], [66, 108, 18, 112],
    [84, 90, 18, 130], [102, 110, 20, 110]
  ];
  for (const [x, y, w, h] of castle) {
    r(ctx, x, y, w, h, '#0b0d15');
    ctx.beginPath();
    ctx.moveTo(x - 3, y);
    ctx.lineTo(x + w / 2, y - 18);
    ctx.lineTo(x + w + 3, y);
    ctx.closePath();
    ctx.fillStyle = '#0b0d15';
    ctx.fill();
  }
  // towers
  r(ctx, -12, 12, 50, 60, '#0b0d15');
  ctx.beginPath();
  ctx.moveTo(-17, 12);
  ctx.lineTo(13, -22);
  ctx.lineTo(43, 12);
  ctx.closePath();
  ctx.fillStyle = '#0b0d15';
  ctx.fill();
  // windows
  for (let i = 0; i < 14; i++) {
    const wx = -82 + (i * 37) % 170;
    const wy = 128 + (i * 17) % 55;
    r(ctx, wx, wy, 3, 5, i % 3 ? 'rgba(216,168,79,.4)' : 'rgba(226,104,61,.4)');
  }
  // moonlit rim
  ctx.strokeStyle = 'rgba(139,158,196,.16)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-58, 112); ctx.lineTo(-58, 58);
  ctx.moveTo(44, 62); ctx.lineTo(44, 10);
  ctx.stroke();
  ctx.restore();

  // valley fog
  const fog = ctx.createLinearGradient(0, 390, 0, 576);
  fog.addColorStop(0, 'rgba(38,48,67,0)');
  fog.addColorStop(.55, 'rgba(38,48,67,.5)');
  fog.addColorStop(1, 'rgba(10,12,18,.9)');
  ctx.fillStyle = fog;
  ctx.fillRect(0, 360, W, H - 360);

  // foreground cliff
  ctx.beginPath();
  ctx.moveTo(0, 576);
  ctx.lineTo(0, 485);
  ctx.lineTo(90, 455);
  ctx.lineTo(210, 472);
  ctx.lineTo(320, 450);
  ctx.lineTo(430, 500);
  ctx.lineTo(560, 478);
  ctx.lineTo(700, 520);
  ctx.lineTo(860, 490);
  ctx.lineTo(1024, 512);
  ctx.lineTo(1024, 576);
  ctx.closePath();
  ctx.fillStyle = '#07090e';
  ctx.fill();

  // lone hero silhouette
  ctx.save();
  ctx.translate(208, 480);
  ctx.scale(2.05, 2.05);
  ctx.globalAlpha = .95;
  r(ctx, -7, -25, 14, 18, '#05070b');
  r(ctx, -6, -33, 12, 10, '#05070b');
  r(ctx, -8, -20, 3, 16, '#05070b');
  r(ctx, 5, -20, 3, 16, '#05070b');
  r(ctx, -6, -7, 5, 9, '#05070b');
  r(ctx, 1, -7, 5, 9, '#05070b');
  // cape
  ctx.beginPath();
  ctx.moveTo(-7, -25);
  ctx.lineTo(-15, -4);
  ctx.lineTo(-8, -8);
  ctx.lineTo(0, -3);
  ctx.lineTo(7, -8);
  ctx.lineTo(8, -25);
  ctx.fillStyle = '#0a0c13';
  ctx.fill();
  // sword
  r(ctx, 9, -30, 2, 34, '#10121a');
  r(ctx, 7, -8, 6, 2, '#10121a');
  // ember rim
  ctx.strokeStyle = 'rgba(226,104,61,.32)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-6, -33);
  ctx.lineTo(-7, -20);
  ctx.lineTo(7, -20);
  ctx.stroke();
  ctx.restore();

  // embers
  for (let i = 0; i < 70; i++) {
    const speed = .08 + hash(i, 21, 5) * .16;
    const ex = (hash(i, 31, 6) * W + t * (4 + hash(i, 32, 7) * 10)) % W;
    const ey = (H + 100 - ((t * 18 * speed + hash(i, 33, 8) * H) % (H + 120)));
    const a = .2 + hash(i, 34, 9) * .55;
    ctx.globalAlpha = a;
    r(ctx, ex, ey, 1.3, 1.3, i % 5 === 0 ? '#f0c06a' : '#d96b3f');
  }
  ctx.globalAlpha = 1;

  // bottom vignette
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * .28, W / 2, H / 2, W * .72);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,.62)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
}

/* ------------------------------------------------------------------ */
/* World renderer                                                      */
/* ------------------------------------------------------------------ */

export function drawWorld(ctx, game, t) {
  const map = game.mapDef;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, W, H);
  const rows = map.tiles.length;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < map.tiles[y].length; x++) {
      drawTile(ctx, map.tiles[y][x], x, y, t);
    }
  }

  // flat props (carpet) under everything
  for (const p of map.props) if (p.type === 'carpet') drawProp(ctx, p, t);

  const drawables = [];
  for (const p of map.props) {
    if (p.type === 'carpet') continue;
    drawables.push({ kind: 'prop', p, y: (p.y + (p.h || 1)) * TILE });
  }

  const hidden = game.hiddenNpcs || new Set();
  for (const npc of map.npcs) {
    if (hidden.has(npc.id)) continue;
    drawables.push({ kind: 'npc', npc, y: npc.y * TILE + 29 });
  }
  if (game.followers) {
    for (const f of game.followers) {
      drawables.push({ kind: 'follower', f, y: f.py + 29 });
    }
  }
  drawables.push({ kind: 'player', y: game.player.py + 29 });
  drawables.sort((a, b) => a.y - b.y);

  for (const d of drawables) {
    if (d.kind === 'prop') {
      const opened = game.openedChests && game.openedChests.has(d.p.id);
      drawProp(ctx, d.p, t, opened);
    } else if (d.kind === 'npc') {
      const n = d.npc;
      const frame = Math.sin(t * 1.4 + n.x) > .96 ? 1 : 0;
      drawCharacter(ctx, n.char, n.x * TILE + 16, n.y * TILE + 30, n.dir, frame, 1, { idle: true, time: t });
      // quest marker
      if (game.npcMarker && game.npcMarker(n.id)) {
        const bob = Math.sin(t * 4) * 3;
        r(ctx, n.x * TILE + 14, n.y * TILE - 12 + bob, 4, 4, '#f1d391');
        r(ctx, n.x * TILE + 15, n.y * TILE - 15 + bob, 2, 6, '#f1d391');
        glow(ctx, n.x * TILE + 16, n.y * TILE - 10 + bob, 18, 'rgba(238,194,94,.5)', .6);
      }
      // name on proximity
      if (game.nearNpc && game.nearNpc.id === n.id) {
        ctx.save();
        ctx.font = '600 10px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(5,7,12,.75)';
        ctx.fillRect(n.x * TILE + 1, n.y * TILE - 10, 30, 13);
        ctx.fillStyle = '#ecd9ae';
        ctx.fillText(n.name, n.x * TILE + 16, n.y * TILE + 1);
        ctx.restore();
      }
    } else if (d.kind === 'follower') {
      drawCharacter(ctx, d.f.char, d.f.px, d.f.py + 30, d.f.dir, d.f.frame, 1, { idle: true, time: t });
    } else {
      const pl = game.player;
      drawCharacter(ctx, pl.char, pl.px, pl.py + 30, pl.dir, pl.frame, 1, { idle: !pl.moving, time: t });
      // companion marker
      if (pl.moving) {
        ctx.globalAlpha = .22;
        for (let i = 1; i < 3; i++) {
          ellipse(ctx, pl.px - (pl.dir === 'left' ? i * 4 : pl.dir === 'right' ? -i * 4 : 0), pl.py + 29, 8 - i * 2, 2, '#d8b25d');
        }
        ctx.globalAlpha = 1;
      }
    }
  }

  drawWorldAmbient(ctx, map.ambient, t);
}

function drawWorldAmbient(ctx, ambient, t) {
  if (ambient === 'night') {
    ctx.fillStyle = 'rgba(10,17,44,.28)';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 26; i++) {
      const x = (hash(i, 41, 1) * W + t * (2 + hash(i, 42, 2) * 4)) % W;
      const y = (hash(i, 43, 3) * H + t * 3) % H;
      ctx.globalAlpha = .2 + hash(i, 44, 4) * .4;
      r(ctx, x, y, 1, 1, '#e6c37c');
    }
  } else if (ambient === 'prison') {
    ctx.fillStyle = 'rgba(5,7,14,.34)';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 22; i++) {
      const x = (hash(i, 51, 1) * W + t * 3) % W;
      const y = (hash(i, 52, 2) * H + t * 5) % H;
      ctx.globalAlpha = .1 + hash(i, 53, 3) * .2;
      r(ctx, x, y, 1, 1, '#d8c7a4');
    }
  } else if (ambient === 'forest') {
    ctx.fillStyle = 'rgba(9,23,22,.16)';
    ctx.fillRect(0, 0, W, H);
    const mist = ctx.createLinearGradient(0, 280, 0, 576);
    mist.addColorStop(0, 'rgba(91,126,111,0)');
    mist.addColorStop(.55, 'rgba(91,126,111,.1)');
    mist.addColorStop(1, 'rgba(9,19,18,.32)');
    ctx.fillStyle = mist;
    ctx.fillRect(0, 250, W, 326);
    for (let i = 0; i < 24; i++) {
      const x = (hash(i, 61, 1) * W + Math.sin(t * .6 + i) * 18) % W;
      const y = (hash(i, 62, 2) * H + Math.cos(t * .8 + i) * 12) % H;
      const a = .25 + Math.sin(t * 2.2 + i) * .2;
      ctx.globalAlpha = a;
      r(ctx, x, y, 2, 2, '#b9e2a6');
      glow(ctx, x, y, 10, 'rgba(185,226,166,.2)', .3);
    }
  } else if (ambient === 'camp') {
    ctx.fillStyle = 'rgba(28,18,24,.16)';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 32; i++) {
      const x = (hash(i, 71, 1) * W + Math.sin(t * .7 + i) * 20) % W;
      const y = (hash(i, 72, 2) * H - t * (5 + hash(i, 73, 3) * 10)) % H;
      ctx.globalAlpha = .25 + hash(i, 74, 4) * .4;
      r(ctx, x, y < 0 ? y + H : y, 1.4, 1.4, i % 3 ? '#e7a44f' : '#d5643c');
    }
  } else if (ambient === 'castle') {
    ctx.fillStyle = 'rgba(18,7,14,.25)';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 24; i++) {
      const x = (hash(i, 81, 1) * W + t * 2) % W;
      const y = (hash(i, 82, 2) * H + t * 4) % H;
      ctx.globalAlpha = .08 + hash(i, 83, 3) * .18;
      r(ctx, x, y, 1, 1, '#e4c49c');
    }
  }
  ctx.globalAlpha = 1;
}

/* ------------------------------------------------------------------ */
/* Battle background                                                   */
/* ------------------------------------------------------------------ */

export function drawBattleBackground(ctx, bg, t) {
  ctx.clearRect(0, 0, W, H);
  if (bg === 'prison') {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0b0d15');
    g.addColorStop(.5, '#1b1b25');
    g.addColorStop(1, '#090a10');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // arches
    for (let i = 0; i < 4; i++) {
      const x = 90 + i * 260;
      ctx.fillStyle = '#232530';
      ctx.beginPath();
      ctx.moveTo(x, 390);
      ctx.lineTo(x, 190);
      ctx.arc(x + 60, 190, 60, Math.PI, 0);
      ctx.lineTo(x + 120, 390);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#353846';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    // bars
    for (let i = 0; i < 18; i++) {
      const x = 40 + i * 58;
      r(ctx, x, 80, 3, 300, '#171922');
    }
    // torches
    for (const x of [150, 500, 870]) {
      r(ctx, x - 2, 180, 4, 42, '#3c2b21');
      ellipse(ctx, x, 172, 7, 10, '#d45f31');
      ellipse(ctx, x, 171, 4, 6, '#f6b453');
      glow(ctx, x, 175, 110, 'rgba(231,106,47,.4)', .7);
    }
    // floor
    const fg = ctx.createLinearGradient(0, 390, 0, H);
    fg.addColorStop(0, '#2a2b34');
    fg.addColorStop(1, '#101117');
    ctx.fillStyle = fg;
    ctx.fillRect(0, 390, W, H - 390);
    for (let i = 0; i < 12; i++) {
      ctx.strokeStyle = 'rgba(104,107,120,.12)';
      ctx.beginPath();
      ctx.moveTo(0, 420 + i * 18);
      ctx.lineTo(W, 420 + i * 18);
      ctx.stroke();
    }
  } else if (bg === 'forest') {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0b1420');
    g.addColorStop(.55, '#1a2c2d');
    g.addColorStop(1, '#0a100f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    glow(ctx, 780, 110, 180, 'rgba(188,205,222,.22)', 1);
    ellipse(ctx, 780, 110, 45, 45, '#c6ced6');
    // trees
    for (let i = 0; i < 16; i++) {
      const x = i * 72 + (i % 3) * 15;
      const h = 260 + (i % 4) * 55;
      ctx.fillStyle = '#101c1a';
      ctx.fillRect(x + 28, 390 - h * .35, 18, h * .55);
      ctx.beginPath();
      ctx.ellipse(x + 36, 200 - (i % 3) * 20, 58, 95, 0, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 ? '#12231f' : '#162a24';
      ctx.fill();
    }
    // mist
    for (let i = 0; i < 4; i++) {
      const y = 300 + i * 55;
      const a = .06 + i * .02;
      ctx.fillStyle = `rgba(145,180,167,${a})`;
      ctx.beginPath();
      ctx.ellipse(W / 2 + Math.sin(t * .2 + i) * 100, y, 520, 20, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    const fg = ctx.createLinearGradient(0, 390, 0, H);
    fg.addColorStop(0, '#1b2a24');
    fg.addColorStop(1, '#080d0c');
    ctx.fillStyle = fg;
    ctx.fillRect(0, 390, W, H - 390);
    for (let i = 0; i < 34; i++) {
      const x = hash(i, 91, 1) * W;
      const y = 420 + hash(i, 92, 2) * 120;
      r(ctx, x, y, 1, 4, '#3b5944');
    }
  } else {
    // castle throne hall
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#12080e');
    g.addColorStop(.5, '#241119');
    g.addColorStop(1, '#09070a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // stained glass
    for (let i = 0; i < 3; i++) {
      const x = 280 + i * 240;
      ctx.fillStyle = '#160c13';
      ctx.beginPath();
      ctx.moveTo(x, 290);
      ctx.lineTo(x, 90);
      ctx.arc(x + 50, 90, 50, Math.PI, 0);
      ctx.lineTo(x + 100, 290);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#5d3136';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.fillStyle = 'rgba(143,47,63,.35)';
      ctx.beginPath();
      ctx.arc(x + 50, 120, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(216,168,79,.25)';
      ctx.beginPath();
      ctx.arc(x + 50, 180, 16, 0, Math.PI * 2);
      ctx.fill();
    }
    // pillars
    for (const x of [80, 944]) {
      const pg = ctx.createLinearGradient(x - 25, 0, x + 25, 0);
      pg.addColorStop(0, '#1d1117');
      pg.addColorStop(.5, '#4a2a30');
      pg.addColorStop(1, '#1d1117');
      ctx.fillStyle = pg;
      ctx.fillRect(x - 25, 40, 50, 360);
      r(ctx, x - 35, 38, 70, 20, '#563138');
      r(ctx, x - 32, 382, 64, 14, '#3e2228');
    }
    // throne silhouette
    ctx.fillStyle = '#170b10';
    ctx.beginPath();
    ctx.moveTo(440, 360);
    ctx.lineTo(440, 260);
    ctx.lineTo(470, 250);
    ctx.lineTo(480, 210);
    ctx.lineTo(500, 240);
    ctx.lineTo(544, 240);
    ctx.lineTo(564, 210);
    ctx.lineTo(574, 250);
    ctx.lineTo(604, 260);
    ctx.lineTo(604, 360);
    ctx.closePath();
    ctx.fill();
    // braziers
    for (const x of [180, 844]) {
      r(ctx, x - 5, 330, 10, 60, '#2c1b1f');
      ellipse(ctx, x, 326, 24, 8, '#4c2a2e');
      ellipse(ctx, x, 314, 11, 17, '#d15b35');
      ellipse(ctx, x, 310, 6, 10, '#f3b253');
      glow(ctx, x, 314, 110, 'rgba(232,94,47,.38)', .75);
    }
    // carpet
    const cg = ctx.createLinearGradient(0, 390, 0, H);
    cg.addColorStop(0, '#5d2029');
    cg.addColorStop(1, '#2a0f15');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.moveTo(400, 390);
    ctx.lineTo(624, 390);
    ctx.lineTo(740, H);
    ctx.lineTo(284, H);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(202,157,77,.35)';
    ctx.lineWidth = 2;
    ctx.stroke();
    // floor
    const fg = ctx.createLinearGradient(0, 390, 0, H);
    fg.addColorStop(0, 'rgba(26,15,19,.2)');
    fg.addColorStop(1, '#09070a');
    ctx.fillStyle = fg;
    ctx.fillRect(0, 390, W, H - 390);
  }

  // atmospheric dust
  for (let i = 0; i < 38; i++) {
    const x = (hash(i, 101, 1) * W + t * (3 + hash(i, 102, 2) * 5)) % W;
    const y = (hash(i, 103, 3) * H + Math.sin(t * .4 + i) * 14 + H) % H;
    ctx.globalAlpha = .08 + hash(i, 104, 4) * .2;
    r(ctx, x, y, 1.2, 1.2, '#e4cda7');
  }
  ctx.globalAlpha = 1;
}

/* ------------------------------------------------------------------ */
/* Enemies                                                             */
/* ------------------------------------------------------------------ */

export function drawEnemy(ctx, art, x, y, scale, t, flash = false, alpha = 1, dead = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  if (dead) {
    ctx.rotate(-.5);
    ctx.globalAlpha = .28;
  } else {
    ctx.globalAlpha = alpha;
  }
  if (flash) ctx.filter = 'brightness(2.2) saturate(.2)';
  const bob = dead ? 0 : Math.sin(t * 2.2 + x * .01) * 3;
  ctx.translate(0, bob);

  if (art === 'guard') drawGuard(ctx, t);
  else if (art === 'wolf') drawWolf(ctx, t);
  else if (art === 'warden') drawWarden(ctx, t);
  else if (art === 'inquisitor') drawInquisitor(ctx, t);
  else if (art === 'darian') drawDarian(ctx, t);
  else if (art === 'lyra') drawLyra(ctx, t);
  else drawShadowEnemy(ctx, t);

  ctx.restore();
}

function drawGuard(ctx, t) {
  ellipse(ctx, 0, 2, 34, 9, 'rgba(0,0,0,.4)');
  // spear
  r(ctx, 37, -110, 3, 112, '#6b4a30');
  ctx.beginPath();
  ctx.moveTo(38, -126);
  ctx.lineTo(31, -105);
  ctx.lineTo(45, -105);
  ctx.closePath();
  ctx.fillStyle = '#b8bdc7';
  ctx.fill();
  // legs
  r(ctx, -21, -36, 14, 37, '#30323b');
  r(ctx, 7, -36, 14, 37, '#30323b');
  r(ctx, -25, -4, 20, 7, '#1b1c23');
  r(ctx, 5, -4, 20, 7, '#1b1c23');
  // body armor
  ctx.beginPath();
  ctx.moveTo(-29, -91);
  ctx.lineTo(29, -91);
  ctx.lineTo(24, -35);
  ctx.lineTo(-24, -35);
  ctx.closePath();
  ctx.fillStyle = '#454a56';
  ctx.fill();
  ctx.strokeStyle = '#1b1d24';
  ctx.lineWidth = 3;
  ctx.stroke();
  r(ctx, -22, -83, 44, 12, '#626875');
  r(ctx, -3, -87, 6, 52, '#353943');
  // shoulders
  ellipse(ctx, -31, -85, 11, 13, '#5c616d');
  ellipse(ctx, 31, -85, 11, 13, '#5c616d');
  // arms
  r(ctx, -39, -80, 11, 45, '#3e424e');
  r(ctx, 27, -80, 11, 45, '#3e424e');
  // helmet
  ellipse(ctx, 0, -104, 17, 19, '#5a5f6c');
  r(ctx, -17, -108, 34, 9, '#707684');
  r(ctx, -12, -98, 24, 4, '#2b2d35');
  r(ctx, -9, -100, 6, 3, '#e0b35b');
  r(ctx, 3, -100, 6, 3, '#e0b35b');
  // crest
  r(ctx, -3, -124, 6, 17, '#8d2f3b');
  // shield
  ctx.beginPath();
  ctx.ellipse(-36, -52, 14, 20, -.1, 0, Math.PI * 2);
  ctx.fillStyle = '#3a3d47';
  ctx.fill();
  ctx.strokeStyle = '#9ba1ac';
  ctx.lineWidth = 2;
  ctx.stroke();
  r(ctx, -38, -56, 4, 10, '#a78a4e');
}

function drawWolf(ctx, t) {
  ellipse(ctx, 0, 2, 36, 8, 'rgba(0,0,0,.4)');
  // tail
  ctx.beginPath();
  ctx.moveTo(-30, -42);
  ctx.quadraticCurveTo(-56, -62, -48, -30);
  ctx.quadraticCurveTo(-40, -22, -27, -33);
  ctx.fillStyle = '#3d4149';
  ctx.fill();
  // legs
  r(ctx, -22, -30, 8, 31, '#2c3037');
  r(ctx, -7, -29, 8, 30, '#343941');
  r(ctx, 12, -31, 8, 32, '#2c3037');
  r(ctx, 25, -28, 8, 29, '#343941');
  // body
  ctx.beginPath();
  ctx.ellipse(0, -50, 33, 22, -.08, 0, Math.PI * 2);
  ctx.fillStyle = '#444951';
  ctx.fill();
  ctx.strokeStyle = '#202329';
  ctx.lineWidth = 3;
  ctx.stroke();
  // fur
  for (let i = 0; i < 7; i++) {
    const fx = -24 + i * 9;
    ctx.beginPath();
    ctx.moveTo(fx, -67);
    ctx.lineTo(fx + 4, -76);
    ctx.lineTo(fx + 8, -66);
    ctx.fillStyle = i % 2 ? '#555b64' : '#383d44';
    ctx.fill();
  }
  // head
  ctx.beginPath();
  ctx.ellipse(34, -63, 22, 17, .08, 0, Math.PI * 2);
  ctx.fillStyle = '#4a4f57';
  ctx.fill();
  ctx.strokeStyle = '#202329';
  ctx.stroke();
  // ears
  ctx.beginPath();
  ctx.moveTo(20, -76); ctx.lineTo(23, -94); ctx.lineTo(33, -78); ctx.closePath();
  ctx.fillStyle = '#3d424a'; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(38, -78); ctx.lineTo(46, -94); ctx.lineTo(51, -74); ctx.closePath();
  ctx.fillStyle = '#3d424a'; ctx.fill();
  // snout
  ctx.beginPath();
  ctx.ellipse(53, -56, 15, 10, .1, 0, Math.PI * 2);
  ctx.fillStyle = '#555a62'; ctx.fill();
  ellipse(ctx, 66, -58, 4, 3, '#15171c');
  // eyes
  r(ctx, 35, -69, 5, 3, '#e9b24f');
  r(ctx, 46, -70, 5, 3, '#e9b24f');
  glow(ctx, 38, -68, 13, 'rgba(233,178,79,.4)', .5);
  glow(ctx, 49, -69, 13, 'rgba(233,178,79,.4)', .5);
  // teeth
  r(ctx, 55, -51, 3, 4, '#e6ddc9');
  r(ctx, 61, -51, 2, 3, '#e6ddc9');
}

function drawWarden(ctx, t) {
  ellipse(ctx, 0, 3, 52, 12, 'rgba(0,0,0,.48)');
  // hammer
  r(ctx, 48, -150, 7, 150, '#4a3222');
  r(ctx, 30, -164, 44, 32, '#6c717d');
  r(ctx, 36, -158, 32, 20, '#8d929c');
  r(ctx, 42, -154, 20, 5, '#c4a257');
  // legs
  r(ctx, -34, -52, 24, 54, '#2b2d35');
  r(ctx, 10, -52, 24, 54, '#2b2d35');
  r(ctx, -40, -4, 31, 9, '#17181e');
  r(ctx, 9, -4, 31, 9, '#17181e');
  // body
  ctx.beginPath();
  ctx.moveTo(-48, -126);
  ctx.lineTo(48, -126);
  ctx.lineTo(38, -48);
  ctx.lineTo(-38, -48);
  ctx.closePath();
  ctx.fillStyle = '#3d404a';
  ctx.fill();
  ctx.strokeStyle = '#17191f';
  ctx.lineWidth = 4;
  ctx.stroke();
  r(ctx, -36, -116, 72, 16, '#555a66');
  r(ctx, -6, -122, 12, 74, '#2e3038');
  // chains
  for (let i = 0; i < 5; i++) ellipse(ctx, -36 + i * 18, -60 + (i % 2) * 4, 4, 6, '#777c87');
  // shoulders
  ellipse(ctx, -52, -117, 20, 20, '#555a65');
  ellipse(ctx, 52, -117, 20, 20, '#555a65');
  // arms
  r(ctx, -66, -110, 20, 62, '#454a55');
  r(ctx, 46, -110, 20, 62, '#454a55');
  // head
  ellipse(ctx, 0, -145, 27, 27, '#4c505b');
  r(ctx, -27, -155, 54, 12, '#6c717d');
  // horns
  ctx.beginPath();
  ctx.moveTo(-22, -162); ctx.lineTo(-38, -190); ctx.lineTo(-13, -168); ctx.closePath();
  ctx.fillStyle = '#8b8f99'; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(22, -162); ctx.lineTo(38, -190); ctx.lineTo(13, -168); ctx.closePath();
  ctx.fillStyle = '#8b8f99'; ctx.fill();
  // eyes
  r(ctx, -14, -150, 8, 4, '#e16a3b');
  r(ctx, 6, -150, 8, 4, '#e16a3b');
  glow(ctx, -10, -148, 22, 'rgba(225,106,59,.45)', .7);
  glow(ctx, 10, -148, 22, 'rgba(225,106,59,.45)', .7);
  // jaw
  r(ctx, -13, -137, 26, 6, '#292b33');
  for (let i = 0; i < 5; i++) r(ctx, -10 + i * 5, -137, 2, 5, '#b8b3a5');
  // belt
  r(ctx, -42, -76, 84, 9, '#6d4a2f');
  r(ctx, -8, -78, 16, 13, '#c19a4d');
}

function drawInquisitor(ctx, t) {
  const float = Math.sin(t * 1.8) * 6;
  ctx.translate(0, float);
  ellipse(ctx, 0, 2 - float, 38, 10, 'rgba(0,0,0,.42)');
  // staff
  r(ctx, 48, -158, 4, 160, '#3a2c2a');
  ellipse(ctx, 50, -164, 12, 12, '#d9ad54');
  ellipse(ctx, 50, -164, 7, 7, '#f5d78e');
  glow(ctx, 50, -164, 45, 'rgba(238,194,94,.5)', .7);
  // robe
  ctx.beginPath();
  ctx.moveTo(-38, -118);
  ctx.quadraticCurveTo(-55, -60, -62, -2);
  ctx.lineTo(62, -2);
  ctx.quadraticCurveTo(55, -60, 38, -118);
  ctx.closePath();
  ctx.fillStyle = '#2d2533';
  ctx.fill();
  ctx.strokeStyle = '#151119';
  ctx.lineWidth = 4;
  ctx.stroke();
  // inner robe
  ctx.beginPath();
  ctx.moveTo(-17, -116);
  ctx.lineTo(17, -116);
  ctx.lineTo(25, -2);
  ctx.lineTo(-25, -2);
  ctx.closePath();
  ctx.fillStyle = '#4a3b4f';
  ctx.fill();
  // trim
  ctx.strokeStyle = '#c8a34f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-27, -96);
  ctx.quadraticCurveTo(0, -82, 27, -96);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-42, -54);
  ctx.quadraticCurveTo(0, -40, 42, -54);
  ctx.stroke();
  // shoulders
  ellipse(ctx, -36, -110, 17, 13, '#3c3142');
  ellipse(ctx, 36, -110, 17, 13, '#3c3142');
  // arms
  r(ctx, -48, -106, 12, 54, '#2b2430');
  r(ctx, 36, -106, 12, 54, '#2b2430');
  // mask
  ellipse(ctx, 0, -137, 25, 28, '#d6c9b1');
  ctx.beginPath();
  ctx.moveTo(-18, -137);
  ctx.lineTo(18, -137);
  ctx.lineTo(12, -117);
  ctx.lineTo(-12, -117);
  ctx.closePath();
  ctx.fillStyle = '#b9ab93';
  ctx.fill();
  // eye slits
  r(ctx, -14, -142, 10, 3, '#1a1418');
  r(ctx, 4, -142, 10, 3, '#1a1418');
  glow(ctx, -9, -140, 14, 'rgba(238,194,94,.55)', .6);
  glow(ctx, 9, -140, 14, 'rgba(238,194,94,.55)', .6);
  // halo
  ctx.strokeStyle = 'rgba(216,168,79,.55)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, -173, 34, 9, 0, 0, Math.PI * 2);
  ctx.stroke();
  // hood
  ctx.beginPath();
  ctx.moveTo(-27, -155);
  ctx.quadraticCurveTo(0, -188, 27, -155);
  ctx.lineTo(20, -147);
  ctx.quadraticCurveTo(0, -168, -20, -147);
  ctx.closePath();
  ctx.fillStyle = '#241d29';
  ctx.fill();
}

function drawDarian(ctx, t) {
  ellipse(ctx, 0, 3, 42, 11, 'rgba(0,0,0,.45)');
  // cape
  ctx.beginPath();
  ctx.moveTo(-26, -123);
  ctx.quadraticCurveTo(-66, -70, -52, -6);
  ctx.lineTo(-20, -20);
  ctx.lineTo(0, -6);
  ctx.lineTo(20, -20);
  ctx.lineTo(52, -6);
  ctx.quadraticCurveTo(66, -70, 26, -123);
  ctx.closePath();
  ctx.fillStyle = '#1d3048';
  ctx.fill();
  ctx.strokeStyle = '#111a27';
  ctx.lineWidth = 3;
  ctx.stroke();
  // sword
  r(ctx, 44, -138, 4, 112, '#e2e0d7');
  r(ctx, 45, -136, 2, 106, '#9fa4af');
  r(ctx, 35, -30, 22, 4, '#d3ac5a');
  r(ctx, 42, -26, 8, 16, '#3b2a1e');
  // legs
  r(ctx, -21, -48, 14, 49, '#3c4655');
  r(ctx, 7, -48, 14, 49, '#3c4655');
  r(ctx, -25, -4, 20, 7, '#171a20');
  r(ctx, 5, -4, 20, 7, '#171a20');
  // armor
  ctx.beginPath();
  ctx.moveTo(-28, -112);
  ctx.lineTo(28, -112);
  ctx.lineTo(24, -44);
  ctx.lineTo(-24, -44);
  ctx.closePath();
  ctx.fillStyle = '#7d8592';
  ctx.fill();
  ctx.strokeStyle = '#2b303a';
  ctx.lineWidth = 3;
  ctx.stroke();
  r(ctx, -22, -104, 44, 14, '#a9b0ba');
  r(ctx, -5, -108, 10, 62, '#5e6673');
  r(ctx, -20, -72, 40, 8, '#d0a955');
  // shoulders
  ellipse(ctx, -33, -106, 16, 16, '#a1a8b3');
  ellipse(ctx, 33, -106, 16, 16, '#a1a8b3');
  // arms
  r(ctx, -42, -100, 13, 50, '#737b88');
  r(ctx, 29, -100, 13, 50, '#737b88');
  // head
  ellipse(ctx, 0, -129, 18, 21, '#c98e64');
  r(ctx, -18, -137, 36, 9, '#d8b15c');
  r(ctx, -14, -144, 28, 8, '#b98a46');
  r(ctx, -3, -150, 6, 8, '#d8b15c');
  r(ctx, -8, -152, 16, 3, '#f0d58d');
  // eyes
  r(ctx, -10, -132, 6, 2, '#27303c');
  r(ctx, 4, -132, 6, 2, '#27303c');
  // smirk
  r(ctx, 2, -122, 8, 1, '#8a5144');
  // emblem
  r(ctx, -7, -90, 14, 14, '#d0a955');
  r(ctx, -3, -86, 6, 6, '#1d3048');
}

function drawLyra(ctx, t) {
  const float = Math.sin(t * 1.4) * 8;
  ctx.translate(0, float);
  ellipse(ctx, 0, 4 - float, 44, 12, 'rgba(0,0,0,.42)');
  // ash wings
  ctx.save();
  ctx.globalAlpha = .62;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * 20, -120);
    ctx.quadraticCurveTo(side * 96, -160, side * 102, -74);
    ctx.quadraticCurveTo(side * 75, -82, side * 70, -48);
    ctx.quadraticCurveTo(side * 46, -64, side * 28, -40);
    ctx.closePath();
    const wg = ctx.createLinearGradient(side * 20, -150, side * 100, -40);
    wg.addColorStop(0, 'rgba(122,65,90,.9)');
    wg.addColorStop(1, 'rgba(35,20,34,.1)');
    ctx.fillStyle = wg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(208,164,79,.22)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
  // dress
  ctx.beginPath();
  ctx.moveTo(-26, -115);
  ctx.quadraticCurveTo(-52, -50, -72, 4);
  ctx.lineTo(72, 4);
  ctx.quadraticCurveTo(52, -50, 26, -115);
  ctx.closePath();
  ctx.fillStyle = '#3c1723';
  ctx.fill();
  ctx.strokeStyle = '#170a10';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-12, -112);
  ctx.lineTo(12, -112);
  ctx.lineTo(30, 4);
  ctx.lineTo(-30, 4);
  ctx.closePath();
  ctx.fillStyle = '#64253a';
  ctx.fill();
  // gold trim
  ctx.strokeStyle = '#d1a64e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-35, -70);
  ctx.quadraticCurveTo(0, -48, 35, -70);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-48, -20);
  ctx.quadraticCurveTo(0, 2, 48, -20);
  ctx.stroke();
  // arms
  r(ctx, -38, -112, 10, 60, '#4c1c2c');
  r(ctx, 28, -112, 10, 60, '#4c1c2c');
  // hands
  ellipse(ctx, -33, -50, 6, 8, '#d8a27d');
  ellipse(ctx, 33, -50, 6, 8, '#d8a27d');
  // chest heart
  glow(ctx, 0, -88, 50, 'rgba(226,104,61,.65)', .8);
  ellipse(ctx, 0, -88, 10, 12, '#e2683d');
  ellipse(ctx, 0, -88, 5, 7, '#f5c46b');
  // neck / head
  r(ctx, -7, -125, 14, 14, '#d8a27d');
  ellipse(ctx, 0, -143, 19, 22, '#d8a27d');
  // hair
  ctx.beginPath();
  ctx.ellipse(0, -150, 24, 17, 0, Math.PI, Math.PI * 2);
  ctx.lineTo(24, -126);
  ctx.quadraticCurveTo(17, -145, 0, -147);
  ctx.quadraticCurveTo(-17, -145, -24, -126);
  ctx.closePath();
  ctx.fillStyle = '#e6dfd3';
  ctx.fill();
  r(ctx, -25, -144, 7, 40, '#d9d2c7');
  r(ctx, 18, -144, 7, 40, '#d9d2c7');
  // crown
  ctx.beginPath();
  ctx.moveTo(-16, -166);
  ctx.lineTo(-10, -178);
  ctx.lineTo(-3, -168);
  ctx.lineTo(3, -181);
  ctx.lineTo(9, -168);
  ctx.lineTo(16, -178);
  ctx.lineTo(18, -163);
  ctx.closePath();
  ctx.fillStyle = '#d8a84f';
  ctx.fill();
  ctx.strokeStyle = '#7a5120';
  ctx.lineWidth = 1;
  ctx.stroke();
  // eyes
  r(ctx, -10, -146, 7, 3, '#4c2434');
  r(ctx, 3, -146, 7, 3, '#4c2434');
  glow(ctx, -7, -144, 12, 'rgba(232,122,80,.45)', .6);
  glow(ctx, 7, -144, 12, 'rgba(232,122,80,.45)', .6);
  // lips
  r(ctx, -4, -134, 8, 2, '#8e3f4a');
  // floating ash
  for (let i = 0; i < 8; i++) {
    const a = t * .6 + i * .8;
    const ax = Math.cos(a) * (30 + i * 3);
    const ay = -60 - (i * 13) % 90 + Math.sin(a) * 10;
    ctx.globalAlpha = .3 + (i % 3) * .15;
    r(ctx, ax, ay, 2, 2, '#e29a62');
  }
  ctx.globalAlpha = 1;
}

function drawShadowEnemy(ctx, t) {
  ellipse(ctx, 0, 2, 30, 8, 'rgba(0,0,0,.4)');
  ctx.beginPath();
  ctx.ellipse(0, -45, 30, 45, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#2b2335';
  ctx.fill();
  r(ctx, -12, -55, 6, 4, '#e2683d');
  r(ctx, 7, -55, 6, 4, '#e2683d');
}

/* ------------------------------------------------------------------ */
/* Battle effects                                                      */
/* ------------------------------------------------------------------ */

export function drawParticles(ctx, particles) {
  for (const p of particles) {
    const a = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = a;
    if (p.kind === 'slash') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.size;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius || 40, p.a0 || -.8, p.a1 || .8);
      ctx.stroke();
    } else if (p.kind === 'ring') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = a * .7;
      ctx.beginPath();
      ctx.arc(p.x, p.y, (1 - a) * (p.radius || 60) + 4, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
  }
  ctx.globalAlpha = 1;
}

export function drawFloaters(ctx, floaters) {
  ctx.save();
  ctx.textAlign = 'center';
  for (const f of floaters) {
    const a = Math.max(0, f.life / f.maxLife);
    ctx.globalAlpha = a;
    ctx.font = `700 ${f.size || 22}px Cinzel, Georgia, serif`;
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(5,6,10,.9)';
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.restore();
}

export { TILE, W, H, C };
