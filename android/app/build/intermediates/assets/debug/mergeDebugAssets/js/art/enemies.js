// art/enemies.js — procedural monster sprites
//
// Battle sprites use a deliberately minimal pixel-art language: one bold
// silhouette, two body tones and a single accent (eyes / core / rune). At the
// sizes used by the battle layout, extra cracks and trinkets turn into noise,
// so detail is kept to broad, readable shapes.
import { makeCanvas } from '../util.js';
import { drawCharacter, hexA } from './characters.js';

const W = 48, H = 48, BASE = 45;
const cache = new Map();
const silCache = new Map();

function px(g, c, x, y, w, h) { g.fillStyle = c; g.fillRect(x, y, w, h); }
function poly(g, c, pts) {
  g.fillStyle = c;
  g.beginPath();
  pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y));
  g.closePath();
  g.fill();
}
function shadow(g, rx = 14, y = BASE) {
  g.fillStyle = 'rgba(0,0,0,.32)';
  g.beginPath(); g.ellipse(24, y, rx, 3.5, 0, 0, Math.PI * 2); g.fill();
}

const WOLF_PAL = {
  wolf: { o:'#17141d', fur:'#767686', shade:'#4f4f5e', belly:'#a8a8b6', eye:'#ff6a52', claw:'#dedee8' },
  icewolf: { o:'#172532', fur:'#c8dbea', shade:'#8faec4', belly:'#f2f8ff', eye:'#6ad0ff', claw:'#ffffff' },
  hound: { o:'#160d14', fur:'#663a50', shade:'#412438', belly:'#8a5068', eye:'#ff5a6a', claw:'#c09aaa' },
};

function drawWolf(g, p, big = false) {
  if (big) {
    g.save();
    g.translate(24, 45);
    g.scale(1.06, 1.06);
    g.translate(-24, -45);
  }
  shadow(g, 17, 45);

  // Tail: one angular wedge behind the hips.
  poly(g, p.o, [[10, 19], [3, 12], [1, 8], [5, 7], [12, 17]]);
  poly(g, p.fur, [[9, 19], [4, 13], [3, 10], [6, 9], [11, 17]]);

  // Hind legs.
  px(g, p.o, 12, 29, 7, 16);
  px(g, p.shade, 13, 31, 4, 13);
  px(g, p.o, 11, 42, 9, 3);
  px(g, p.o, 19, 31, 6, 14);
  px(g, p.shade, 20, 33, 3, 11);
  px(g, p.o, 19, 43, 7, 2);

  // Body and chest.
  poly(g, p.o, [[9, 17], [35, 17], [39, 23], [38, 32], [31, 35], [14, 35], [9, 30]]);
  poly(g, p.fur, [[11, 18], [34, 18], [37, 23], [36, 31], [30, 33], [15, 33], [11, 29]]);
  px(g, p.shade, 15, 30, 19, 3);
  px(g, p.belly, 19, 31, 13, 1);
  px(g, p.shade, 12, 21, 5, 7);

  // Front legs.
  px(g, p.o, 28, 31, 7, 14);
  px(g, p.fur, 29, 33, 4, 11);
  px(g, p.o, 27, 43, 9, 2);
  px(g, p.o, 35, 32, 6, 13);
  px(g, p.fur, 36, 34, 3, 10);
  px(g, p.o, 34, 44, 8, 1);
  px(g, p.claw, 27, 44, 3, 1);
  px(g, p.claw, 34, 44, 3, 1);

  // Neck and head.
  poly(g, p.o, [[32, 14], [41, 14], [42, 26], [33, 26]]);
  poly(g, p.fur, [[33, 15], [40, 15], [41, 24], [34, 24]]);
  poly(g, p.o, [[35, 10], [45, 10], [46, 20], [43, 25], [36, 25]]);
  poly(g, p.fur, [[36, 11], [44, 11], [45, 19], [42, 24], [37, 24]]);

  // Ears: two clean triangles.
  poly(g, p.o, [[35, 10], [36, 3], [41, 10]]);
  poly(g, p.fur, [[36, 9], [37, 5], [40, 9]]);
  poly(g, p.o, [[41, 10], [44, 4], [46, 11]]);
  poly(g, p.fur, [[42, 9], [44, 6], [45, 10]]);

  // Snout and eye.
  px(g, p.o, 43, 18, 5, 7);
  px(g, p.fur, 44, 19, 3, 5);
  px(g, p.belly, 44, 23, 3, 1);
  px(g, p.o, 38, 14, 5, 3);
  px(g, p.eye, 40, 15, 2, 1);

  if (big) g.restore();
}

function drawGolem(g) {
  shadow(g, 18, 45);
  const o = '#20242c', rock = '#6a727e', light = '#8e98a4', dark = '#464e58', core = '#ffb84a';

  // Legs.
  px(g, o, 12, 31, 9, 14);
  px(g, dark, 13, 33, 7, 11);
  px(g, o, 11, 42, 11, 3);
  px(g, o, 27, 31, 9, 14);
  px(g, dark, 28, 33, 7, 11);
  px(g, o, 26, 42, 11, 3);

  // Torso: one broad slab.
  poly(g, o, [[10, 15], [38, 15], [40, 30], [36, 35], [12, 35], [8, 30]]);
  poly(g, rock, [[12, 16], [36, 16], [38, 29], [34, 33], [14, 33], [10, 29]]);
  px(g, dark, 12, 29, 24, 4);
  px(g, light, 14, 17, 8, 2);

  // Glowing core.
  px(g, o, 20, 20, 9, 7);
  px(g, '#7a4a18', 21, 21, 7, 5);
  px(g, core, 22, 22, 5, 3);
  px(g, '#ffe0a0', 23, 23, 2, 1);

  // Arms.
  px(g, o, 2, 17, 8, 17);
  px(g, rock, 3, 19, 6, 13);
  px(g, dark, 3, 31, 6, 2);
  px(g, o, 38, 17, 8, 17);
  px(g, rock, 39, 19, 6, 13);
  px(g, dark, 39, 31, 6, 2);

  // Head.
  poly(g, o, [[17, 5], [31, 5], [32, 15], [16, 15]]);
  poly(g, rock, [[18, 6], [30, 6], [31, 14], [17, 14]]);
  px(g, light, 19, 7, 7, 2);
  px(g, '#2a2016', 18, 11, 12, 3);
  px(g, core, 20, 12, 2, 1);
  px(g, core, 26, 12, 2, 1);

  // Shoulder rocks.
  px(g, o, 6, 11, 9, 8);
  px(g, dark, 7, 12, 7, 6);
  px(g, o, 33, 11, 9, 8);
  px(g, dark, 34, 12, 7, 6);
}

function drawWraith(g, variant = 'purple') {
  const pal = variant === 'ember'
    ? { o:'#190b0e', robe:'#5a2028', robe2:'#351018', glow:'#ff8a4a', bone:'#e8d8c0', aura:'#ff6a3a' }
    : { o:'#120f1e', robe:'#3e2d62', robe2:'#241a3e', glow:'#b795e8', bone:'#d8d0e0', aura:'#8a6ad8' };

  g.save();
  g.globalCompositeOperation = 'lighter';
  g.fillStyle = hexA(pal.aura, 0.09);
  g.beginPath(); g.arc(24, 27, 20, 0, Math.PI * 2); g.fill();
  g.restore();

  shadow(g, 11, 46);

  // Tapered cloak silhouette with three broad tatters.
  poly(g, pal.o, [[24, 5], [34, 9], [38, 20], [36, 33], [33, 44], [30, 40], [27, 45], [24, 41], [21, 45], [18, 40], [15, 44], [12, 33], [10, 20], [14, 9]]);
  poly(g, pal.robe, [[24, 8], [32, 11], [35, 21], [33, 33], [31, 40], [28, 37], [24, 41], [20, 37], [17, 40], [15, 33], [13, 21], [16, 11]]);
  poly(g, pal.robe2, [[14, 33], [17, 42], [20, 36], [23, 43], [25, 36], [28, 42], [31, 36], [34, 33]]);

  // Hood void and skull.
  poly(g, '#0a0710', [[24, 11], [31, 13], [31, 20], [24, 23], [17, 20], [17, 13]]);
  px(g, pal.bone, 20, 14, 8, 6);
  px(g, '#0a0710', 21, 16, 2, 2);
  px(g, '#0a0710', 25, 16, 2, 2);
  px(g, pal.glow, 21, 17, 2, 1);
  px(g, pal.glow, 25, 17, 2, 1);
  px(g, pal.bone, 23, 20, 2, 1);

  // Sleeves and hands.
  px(g, pal.o, 6, 20, 7, 13);
  px(g, pal.robe, 7, 22, 4, 9);
  px(g, pal.o, 35, 20, 7, 13);
  px(g, pal.robe, 36, 22, 4, 9);
  px(g, pal.bone, 7, 31, 3, 3);
  px(g, pal.bone, 38, 31, 3, 3);

  // Two floating motes, no more.
  px(g, pal.glow, 5, 15, 2, 2);
  px(g, pal.glow, 41, 25, 2, 2);
}

function drawSentinel(g) {
  shadow(g, 18, 46);
  const o = '#1c2028', stone = '#6e7682', light = '#9aa4b0', dark = '#4a525e', rune = '#7fe0d0', gold = '#c9a44c';

  // Legs.
  px(g, o, 13, 31, 8, 14);
  px(g, dark, 14, 33, 6, 11);
  px(g, o, 11, 42, 11, 3);
  px(g, o, 27, 31, 8, 14);
  px(g, dark, 28, 33, 6, 11);
  px(g, o, 26, 42, 11, 3);

  // Torso.
  poly(g, o, [[12, 14], [36, 14], [38, 31], [34, 36], [14, 36], [10, 31]]);
  poly(g, stone, [[13, 15], [35, 15], [36, 30], [33, 34], [15, 34], [12, 30]]);
  px(g, light, 15, 16, 8, 2);
  px(g, dark, 14, 30, 20, 3);

  // Chest rune.
  px(g, o, 20, 19, 8, 9);
  px(g, rune, 22, 21, 4, 2);
  px(g, rune, 21, 24, 6, 1);
  px(g, rune, 23, 25, 2, 2);

  // Pauldrons.
  poly(g, o, [[4, 13], [15, 13], [14, 23], [5, 23]]);
  poly(g, stone, [[5, 14], [14, 14], [13, 21], [6, 21]]);
  px(g, light, 6, 14, 6, 2);
  poly(g, o, [[33, 13], [44, 13], [43, 23], [34, 23]]);
  poly(g, stone, [[34, 14], [43, 14], [42, 21], [35, 21]]);
  px(g, light, 36, 14, 6, 2);

  // Arms.
  px(g, o, 5, 22, 7, 13);
  px(g, dark, 6, 24, 5, 10);
  px(g, o, 36, 22, 7, 13);
  px(g, dark, 37, 24, 5, 10);

  // Helmet.
  poly(g, o, [[16, 4], [32, 4], [32, 15], [16, 15]]);
  poly(g, stone, [[17, 5], [31, 5], [31, 14], [17, 14]]);
  px(g, light, 18, 6, 8, 2);
  px(g, '#151a22', 18, 9, 12, 3);
  px(g, rune, 20, 10, 2, 1);
  px(g, rune, 26, 10, 2, 1);

  // Sword.
  px(g, o, 42, 10, 4, 30);
  px(g, light, 43, 12, 2, 24);
  px(g, rune, 43, 34, 2, 4);
  px(g, gold, 42, 38, 4, 2);
}

function drawArauto(g) {
  shadow(g, 20, 46);
  const o = '#160b12', skin = '#7a2a34', dark = '#4a1822', ember = '#ff7a3a', ember2 = '#ffc05a', horn = '#d8c8b0';

  // Wings: two broad, notched silhouettes.
  for (const side of [-1, 1]) {
    g.save();
    g.translate(24, 0);
    g.scale(side, 1);
    poly(g, o, [[20, 15], [10, 7], [2, 11], [6, 18], [1, 25], [9, 24], [7, 33], [16, 25], [21, 25]]);
    poly(g, dark, [[19, 16], [10, 9], [4, 12], [8, 18], [4, 23], [10, 22], [9, 29], [17, 23], [20, 23]]);
    px(g, ember, 6, 17, 4, 1);
    g.restore();
  }

  // Legs.
  px(g, o, 18, 35, 6, 10);
  px(g, skin, 19, 36, 4, 7);
  px(g, o, 26, 35, 6, 10);
  px(g, skin, 27, 36, 4, 7);
  px(g, o, 17, 43, 8, 2);
  px(g, o, 25, 43, 8, 2);

  // Torso.
  poly(g, o, [[17, 15], [31, 15], [33, 31], [29, 38], [19, 38], [15, 31]]);
  poly(g, skin, [[18, 16], [30, 16], [31, 30], [28, 36], [20, 36], [17, 30]]);
  px(g, dark, 18, 29, 12, 4);

  // Chest core.
  px(g, '#2a0e0a', 21, 21, 6, 6);
  px(g, ember, 22, 22, 4, 4);
  px(g, ember2, 23, 23, 2, 1);

  // Arms and claws.
  px(g, o, 11, 17, 6, 16);
  px(g, skin, 12, 19, 4, 12);
  px(g, o, 31, 17, 6, 16);
  px(g, skin, 32, 19, 4, 12);
  px(g, horn, 11, 32, 2, 4);
  px(g, horn, 35, 32, 2, 4);

  // Head and horns.
  poly(g, o, [[18, 5], [30, 5], [31, 16], [17, 16]]);
  poly(g, skin, [[19, 6], [29, 6], [30, 15], [18, 15]]);
  px(g, dark, 19, 13, 10, 2);
  poly(g, o, [[14, 2], [18, 2], [19, 10], [15, 10]]);
  poly(g, horn, [[15, 3], [17, 3], [18, 9], [16, 9]]);
  poly(g, o, [[30, 2], [34, 2], [33, 10], [29, 10]]);
  poly(g, horn, [[31, 3], [33, 3], [32, 9], [30, 9]]);
  px(g, '#0a0508', 20, 9, 3, 2);
  px(g, '#0a0508', 25, 9, 3, 2);
  px(g, ember2, 21, 9, 1, 1);
  px(g, ember2, 26, 9, 1, 1);
  px(g, '#0a0508', 22, 13, 4, 1);
}

function drawSlime(g) {
  shadow(g, 14, 45);
  const o = '#123a2a', body = '#4aa870', light = '#8ae0a8', dark = '#2e7a52', eye = '#0a1a12';

  // Rounded dome, flat base.
  px(g, o, 10, 28, 28, 16);
  px(g, o, 13, 23, 22, 8);
  px(g, o, 17, 20, 14, 5);
  px(g, body, 11, 29, 26, 14);
  px(g, body, 14, 24, 20, 7);
  px(g, body, 18, 21, 12, 4);
  px(g, dark, 11, 39, 26, 4);
  px(g, light, 15, 25, 5, 3);
  px(g, light, 14, 31, 2, 4);

  // Eyes and a tiny mouth.
  px(g, eye, 18, 30, 3, 3);
  px(g, eye, 27, 30, 3, 3);
  px(g, '#fff', 19, 30, 1, 1);
  px(g, '#fff', 28, 30, 1, 1);
  px(g, dark, 22, 35, 4, 1);
}

const CUSTOM = {
  wolf: (g) => drawWolf(g, WOLF_PAL.wolf),
  icewolf: (g) => drawWolf(g, WOLF_PAL.icewolf, true),
  hound: (g) => drawWolf(g, WOLF_PAL.hound),
  golem: (g) => drawGolem(g),
  wraith: (g) => drawWraith(g, 'purple'),
  emberwraith: (g) => drawWraith(g, 'ember'),
  sentinel: (g) => drawSentinel(g),
  arauto: (g) => drawArauto(g),
  slime: (g) => drawSlime(g),
};

export const ENEMY_META = {
  wolf: { accent:'#9a9aa8' },
  icewolf: { accent:'#a8d8f0' },
  hound: { accent:'#a06a7a' },
  golem: { accent:'#c9a44c' },
  wraith: { accent:'#b795e8' },
  emberwraith: { accent:'#ff8a4a' },
  sentinel: { accent:'#7fe0d0' },
  arauto: { accent:'#ff7a3a' },
  slime: { accent:'#7ddba0' },
};

// Humanoid enemies are drawn from 20x28 character sprites at 1.35x, while the
// monster sheets are 48x48. Layout code needs these intrinsic sizes to keep
// sprites and their HP bars proportional on screen.
export const HUMANOID_ENEMIES = new Set(['bandit', 'guard', 'jailer', 'champion', 'darkknight', 'dorian']);

export function enemySpriteMetrics(id) {
  if (HUMANOID_ENEMIES.has(id)) return { w: 20 * 1.35, h: 28 * 1.35 };
  return { w: W, h: H };
}

export function enemyDrawnHeight(id, scale) {
  if (HUMANOID_ENEMIES.has(id)) return 28 * Math.round(scale * 1.35);
  return H * scale;
}

export function enemyDrawnWidth(id, scale) {
  if (HUMANOID_ENEMIES.has(id)) return 20 * Math.round(scale * 1.35);
  return W * scale;
}

export function getEnemySprite(id) {
  if (cache.has(id)) return cache.get(id);
  const { c, g } = makeCanvas(W, H);
  g.imageSmoothingEnabled = false;
  const fn = CUSTOM[id];
  if (fn) fn(g);
  else {
    // humanoid enemies use their character sprite scaled 2x
    const charId = id;
    g.save();
    g.imageSmoothingEnabled = false;
    g.drawImage(getCharSpriteForEnemy(charId), 4, 0, 40, 56);
    g.restore();
  }
  cache.set(id, c);
  return c;
}

// lazy import to avoid cycle at module init
import { getCharSprite } from './characters.js';
function getCharSpriteForEnemy(id) {
  const map = { bandit:'bandit', guard:'guard', jailer:'jailer', champion:'champion', darkknight:'darkknight', dorian:'dorian' };
  return getCharSprite(map[id] || 'bandit', 'right', 0);
}

function getSil(id) {
  if (silCache.has(id)) return silCache.get(id);
  const src = getEnemySprite(id);
  const { c, g } = makeCanvas(W, H);
  g.drawImage(src, 0, 0);
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = '#fff';
  g.fillRect(0, 0, W, H);
  silCache.set(id, c);
  return c;
}

// x,y = feet center. Humanoid ids are drawn from character sheets for crispness.
export function drawEnemy(g, id, x, y, scale = 6, time = 0, opts = {}) {
  const bob = opts.bob === false ? 0 : Math.sin(time * 2 + (opts.phase || 0)) * scale * 0.35;
  if (HUMANOID_ENEMIES.has(id)) {
    const map = { bandit:'bandit', guard:'guard', jailer:'jailer', champion:'champion', darkknight:'darkknight', dorian:'dorian' };
    const cs = Math.round(scale * 1.35);
    // Enemies stand on the right and face the party on the left.
    drawCharacter(g, map[id], x, y + bob, 'left', 0, cs, opts);
    return;
  }
  const spr = opts.flash ? getSil(id) : getEnemySprite(id);
  const w = W * scale, h = H * scale;
  const dy = Math.round(y - h + bob);
  // Mirror the sprite around its anchor so wolves and beasts also face the party.
  g.save();
  g.translate(x, 0);
  g.scale(-1, 1);
  if (opts.alpha != null) g.globalAlpha = opts.alpha;
  g.drawImage(spr, -w / 2, dy, w, h);
  if (opts.flash) {
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = (opts.alpha ?? 1) * 0.7;
    g.drawImage(spr, -w / 2, dy, w, h);
    g.globalCompositeOperation = 'source-over';
  }
  g.restore();
  g.globalAlpha = 1;
}

export function getEnemyThumb(id, size = 24) {
  const spr = getEnemySprite(id);
  const { c, g } = makeCanvas(size, size);
  g.imageSmoothingEnabled = false;
  g.drawImage(spr, 0, 0, size, size);
  return c;
}
