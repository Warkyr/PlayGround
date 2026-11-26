// art/enemies.js — procedural monster sprites
import { makeCanvas } from '../util.js';
import { drawCharacter, hexA } from './characters.js';

const W = 48, H = 48, BASE = 45;
const cache = new Map();
const silCache = new Map();

function px(g, c, x, y, w, h) { g.fillStyle = c; g.fillRect(x, y, w, h); }
function shadow(g, rx = 14, y = BASE) {
  g.fillStyle = 'rgba(0,0,0,.34)';
  g.beginPath(); g.ellipse(24, y, rx, 3.5, 0, 0, Math.PI * 2); g.fill();
}

const WOLF_PAL = {
  wolf: { o:'#18151e', fur:'#6a6a78', fur2:'#494956', belly:'#9a9aa8', eye:'#e05a4a', claw:'#d8d8e0' },
  icewolf: { o:'#1a2634', fur:'#c4d6e8', fur2:'#8aa8c0', belly:'#eef6ff', eye:'#6ad0ff', claw:'#ffffff' },
  hound: { o:'#160f18', fur:'#3a2a3a', fur2:'#241a28', belly:'#5a3a4a', eye:'#ff5a6a', claw:'#b08a9a' },
};

function drawWolf(g, p, big = false) {
  const s = big ? 1.08 : 1;
  shadow(g, 17);
  // tail
  px(g, p.o, 2, 16, 10, 8);
  px(g, p.fur2, 3, 17, 8, 5);
  px(g, p.fur, 3, 17, 4, 3);
  // back legs
  px(g, p.o, 12, 29, 6, 13);
  px(g, p.o, 28, 29, 6, 13);
  px(g, p.fur2, 13, 31, 4, 8);
  px(g, p.fur2, 29, 31, 4, 8);
  px(g, p.o, 11, 40, 7, 4);
  px(g, p.o, 27, 40, 7, 4);
  // body
  px(g, p.o, 8, 17, 28, 16);
  px(g, p.fur, 9, 18, 26, 13);
  px(g, p.fur2, 9, 27, 26, 3);
  px(g, p.belly, 14, 29, 16, 2);
  // back fur tufts
  px(g, p.fur, 10, 15, 4, 3);
  px(g, p.fur, 16, 14, 5, 3);
  px(g, p.fur, 24, 15, 4, 3);
  // front legs
  px(g, p.o, 17, 30, 6, 12);
  px(g, p.o, 23, 30, 6, 12);
  px(g, p.fur, 18, 31, 4, 8);
  px(g, p.fur, 24, 31, 4, 8);
  px(g, p.o, 16, 40, 7, 4);
  px(g, p.o, 22, 40, 7, 4);
  px(g, p.claw, 16, 42, 3, 1);
  px(g, p.claw, 22, 42, 3, 1);
  // head
  px(g, p.o, 31, 11, 13, 17);
  px(g, p.fur, 32, 12, 11, 14);
  px(g, p.fur2, 33, 22, 10, 3);
  // ears
  px(g, p.o, 31, 5, 5, 8);
  px(g, p.fur, 32, 6, 3, 6);
  px(g, p.o, 38, 5, 5, 8);
  px(g, p.fur, 39, 6, 3, 6);
  px(g, p.eye, 37, 16, 2, 2);
  px(g, '#fff', 37, 16, 1, 1);
  // snout
  px(g, p.o, 40, 19, 8, 9);
  px(g, p.fur, 41, 20, 6, 6);
  px(g, p.o, 45, 22, 2, 2);
  px(g, p.belly, 41, 26, 5, 1);
  px(g, '#fff', 42, 25, 1, 2);
  px(g, '#fff', 44, 25, 1, 2);
  // scars
  px(g, p.fur2, 34, 19, 3, 1);
}

function drawGolem(g) {
  shadow(g, 16, 45);
  const o = '#20242c', rock = '#5e6670', rock2 = '#454c56', rock3 = '#79828e', moss = '#5d7a4a';
  // legs
  px(g, o, 11, 32, 9, 13); px(g, rock2, 12, 33, 7, 11); px(g, rock3, 12, 33, 7, 2);
  px(g, o, 28, 32, 9, 13); px(g, rock2, 29, 33, 7, 11); px(g, rock3, 29, 33, 7, 2);
  px(g, o, 9, 42, 12, 4); px(g, o, 27, 42, 12, 4);
  // body
  px(g, o, 9, 13, 30, 21);
  px(g, rock, 10, 14, 28, 19);
  px(g, rock2, 10, 27, 28, 6);
  px(g, rock3, 12, 15, 10, 3);
  px(g, moss, 11, 14, 8, 2); px(g, moss, 28, 25, 6, 3); px(g, moss, 20, 31, 5, 2);
  // cracks
  px(g, rock2, 20, 17, 1, 5); px(g, rock2, 21, 21, 4, 1); px(g, rock2, 30, 18, 1, 4);
  // core
  px(g, '#3a2a12', 19, 20, 10, 7);
  px(g, '#c98a2a', 20, 21, 8, 5);
  px(g, '#ffe0a0', 22, 22, 4, 3);
  // arms
  px(g, o, 2, 17, 8, 17); px(g, rock, 3, 18, 6, 14); px(g, rock3, 3, 18, 6, 2);
  px(g, o, 38, 17, 8, 17); px(g, rock, 39, 18, 6, 14); px(g, rock3, 39, 18, 6, 2);
  px(g, o, 1, 32, 10, 8); px(g, rock2, 2, 33, 8, 6);
  px(g, o, 37, 32, 10, 8); px(g, rock2, 38, 33, 8, 6);
  // head
  px(g, o, 17, 5, 14, 11);
  px(g, rock, 18, 6, 12, 9);
  px(g, rock3, 19, 6, 8, 2);
  px(g, '#3a2a12', 19, 10, 10, 3);
  px(g, '#ffd27a', 20, 11, 2, 2); px(g, '#ffd27a', 26, 11, 2, 2);
  // shoulder rocks
  px(g, o, 6, 11, 9, 8); px(g, rock2, 7, 12, 7, 6);
  px(g, o, 33, 11, 9, 8); px(g, rock2, 34, 12, 7, 6);
}

function drawWraith(g, variant = 'purple') {
  const pal = variant === 'ember'
    ? { o:'#1a0c10', robe:'#5a1e24', robe2:'#3a1018', glow:'#ff8a4a', bone:'#e8d8c0', aura:'#ff6a3a' }
    : { o:'#120f1e', robe:'#3a2a5e', robe2:'#241a3e', glow:'#b795e8', bone:'#d8d0e0', aura:'#8a6ad8' };
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.fillStyle = hexA(pal.aura, 0.1);
  g.beginPath(); g.arc(24, 28, 19, 0, Math.PI * 2); g.fill();
  g.restore();
  shadow(g, 10, 46);
  // tattered cloak
  px(g, pal.o, 10, 12, 28, 32);
  px(g, pal.robe, 12, 14, 24, 26);
  px(g, pal.robe2, 12, 26, 24, 12);
  // tatters
  for (let i = 0; i < 5; i++) {
    const x = 11 + i * 5;
    px(g, pal.o, x, 37, 4, 5 + (i % 2) * 3);
    px(g, pal.robe2, x + 1, 37, 2, 3 + (i % 2) * 2);
  }
  // hood
  px(g, pal.o, 13, 7, 22, 14);
  px(g, pal.robe, 14, 8, 20, 12);
  px(g, '#0a0710', 16, 11, 16, 9);
  // skull
  px(g, pal.bone, 18, 13, 12, 8);
  px(g, '#0a0710', 20, 15, 3, 3);
  px(g, '#0a0710', 25, 15, 3, 3);
  px(g, pal.glow, 20, 16, 3, 1);
  px(g, pal.glow, 25, 16, 3, 1);
  px(g, pal.bone, 22, 20, 4, 1);
  // arms
  px(g, pal.o, 6, 20, 7, 12);
  px(g, pal.robe, 7, 21, 5, 10);
  px(g, pal.o, 35, 20, 7, 12);
  px(g, pal.robe, 36, 21, 5, 10);
  px(g, pal.bone, 6, 30, 3, 3);
  px(g, pal.bone, 39, 30, 3, 3);
  // floating orbs
  px(g, pal.glow, 5, 16, 2, 2);
  px(g, pal.glow, 41, 24, 2, 2);
  px(g, pal.glow, 30, 6, 2, 2);
}

function drawSentinel(g) {
  shadow(g, 18, 46);
  const o = '#1c2028', stone = '#6e747e', stone2 = '#515761', stone3 = '#8c929c', rune = '#7fe0d0';
  // legs
  px(g, o, 13, 32, 9, 13); px(g, stone2, 14, 33, 7, 11);
  px(g, o, 26, 32, 9, 13); px(g, stone2, 27, 33, 7, 11);
  px(g, o, 11, 43, 12, 3); px(g, o, 25, 43, 12, 3);
  // torso
  px(g, o, 10, 14, 28, 20);
  px(g, stone, 11, 15, 26, 18);
  px(g, stone3, 13, 16, 9, 3);
  px(g, stone2, 11, 29, 26, 4);
  // runes
  px(g, rune, 22, 19, 4, 2); px(g, rune, 21, 22, 6, 2); px(g, rune, 23, 25, 2, 3);
  px(g, rune, 14, 20, 2, 2); px(g, rune, 32, 20, 2, 2);
  // pauldrons
  px(g, o, 4, 12, 11, 10); px(g, stone, 5, 13, 9, 8); px(g, stone3, 5, 13, 9, 2);
  px(g, o, 33, 12, 11, 10); px(g, stone, 34, 13, 9, 8); px(g, stone3, 34, 13, 9, 2);
  // arms
  px(g, o, 4, 22, 8, 15); px(g, stone2, 5, 23, 6, 12);
  px(g, o, 36, 22, 8, 15); px(g, stone2, 37, 23, 6, 12);
  // helmet
  px(g, o, 16, 4, 16, 12);
  px(g, stone, 17, 5, 14, 10);
  px(g, stone3, 18, 5, 9, 2);
  px(g, '#151a22', 18, 9, 12, 3);
  px(g, rune, 19, 10, 2, 2); px(g, rune, 27, 10, 2, 2);
  // horns
  px(g, o, 13, 1, 4, 6); px(g, stone2, 14, 2, 2, 4);
  px(g, o, 31, 1, 4, 6); px(g, stone2, 32, 2, 2, 4);
  // sword
  px(g, '#2a2e36', 42, 10, 4, 30);
  px(g, '#b8c2cc', 43, 11, 2, 24);
  px(g, '#e8f0f8', 43, 12, 1, 18);
  px(g, '#8a94a0', 40, 32, 8, 3);
  px(g, rune, 43, 34, 2, 5);
  px(g, '#c9a44c', 42, 38, 4, 2);
}

function drawArauto(g) {
  shadow(g, 18, 46);
  const o = '#160b12', skin = '#4a1c26', skin2 = '#2e1018', ember = '#ff7a3a', ember2 = '#ffc05a', horn = '#d8c8b0';
  // wings
  g.save();
  g.globalAlpha = 0.9;
  for (const side of [-1, 1]) {
    g.save();
    g.translate(24, 0); g.scale(side, 1);
    px(g, o, 10, 10, 14, 4);
    px(g, skin2, 11, 11, 12, 2);
    px(g, o, 8, 12, 12, 10);
    px(g, skin2, 9, 13, 10, 7);
    px(g, o, 5, 16, 10, 14);
    px(g, skin2, 6, 17, 8, 11);
    px(g, ember, 7, 22, 5, 1);
    px(g, ember, 9, 26, 3, 1);
    g.restore();
  }
  g.restore();
  // legs
  px(g, o, 17, 32, 7, 13); px(g, skin, 18, 33, 5, 10);
  px(g, o, 25, 32, 7, 13); px(g, skin, 26, 33, 5, 10);
  px(g, o, 15, 42, 10, 3); px(g, o, 24, 42, 10, 3);
  // torso
  px(g, o, 14, 15, 20, 20);
  px(g, skin, 15, 16, 18, 18);
  px(g, skin2, 15, 28, 18, 5);
  // ember cracks
  px(g, ember, 19, 18, 1, 7); px(g, ember, 20, 21, 4, 1); px(g, ember, 28, 20, 1, 6);
  px(g, ember2, 24, 24, 3, 2); px(g, ember, 17, 26, 2, 2);
  // arms
  px(g, o, 10, 17, 6, 15); px(g, skin, 11, 18, 4, 12);
  px(g, o, 32, 17, 6, 15); px(g, skin, 33, 18, 4, 12);
  // claws
  px(g, horn, 10, 31, 2, 4); px(g, horn, 34, 31, 2, 4);
  // head
  px(g, o, 17, 5, 14, 12);
  px(g, skin, 18, 6, 12, 10);
  px(g, skin2, 18, 13, 12, 2);
  // horns
  px(g, o, 13, 2, 4, 8); px(g, horn, 14, 3, 2, 6);
  px(g, o, 31, 2, 4, 8); px(g, horn, 32, 3, 2, 6);
  // eyes
  px(g, '#0a0508', 19, 9, 4, 2); px(g, '#0a0508', 25, 9, 4, 2);
  px(g, ember2, 20, 9, 2, 2); px(g, ember2, 26, 9, 2, 2);
  // mouth
  px(g, '#0a0508', 21, 13, 6, 2);
  px(g, ember, 22, 13, 4, 1);
  // chest core
  px(g, '#2a0e0a', 21, 22, 6, 5);
  px(g, ember, 22, 23, 4, 3);
  px(g, ember2, 23, 24, 2, 1);
  // floating embers
  px(g, ember2, 8, 12, 2, 2); px(g, ember, 38, 18, 2, 2); px(g, ember2, 30, 3, 2, 2);
}

function drawSlime(g) {
  shadow(g, 13, 45);
  const o = '#123a2a', body = '#3f9a68', body2 = '#2a6e4a', hi = '#8ae0a8';
  px(g, o, 10, 27, 28, 17);
  px(g, o, 13, 22, 22, 8);
  px(g, body, 11, 28, 26, 14);
  px(g, body, 14, 23, 20, 7);
  px(g, body2, 11, 38, 26, 4);
  px(g, hi, 15, 25, 5, 3);
  px(g, hi, 14, 30, 2, 3);
  px(g, '#0a1a12', 18, 30, 3, 3);
  px(g, '#0a1a12', 27, 30, 3, 3);
  px(g, '#fff', 19, 30, 1, 1);
  px(g, '#fff', 28, 30, 1, 1);
  px(g, '#1a4a32', 21, 35, 6, 1);
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

// x,y = feet center. `scale` is normalized to a 28px reference height so
// humanoids and monsters keep the same visual weight in battle.
export function drawEnemy(g, id, x, y, scale = 6, time = 0, opts = {}) {
  const humanoids = { bandit:1, guard:1, jailer:1, champion:1, darkknight:1, dorian:1 };
  const bob = opts.bob === false ? 0 : Math.sin(time * 2 + (opts.phase || 0)) * scale * 0.3;
  if (humanoids[id]) {
    const map = { bandit:'bandit', guard:'guard', jailer:'jailer', champion:'champion', darkknight:'darkknight', dorian:'dorian' };
    drawCharacter(g, map[id], x, y + bob, 'right', 0, Math.round(scale), opts);
    return;
  }
  const spr = opts.flash ? getSil(id) : getEnemySprite(id);
  const s = scale * 28 / H;
  const w = W * s, h = H * s;
  const dx = Math.round(x - w / 2), dy = Math.round(y - h + bob);
  if (opts.alpha != null) g.globalAlpha = opts.alpha;
  g.drawImage(spr, dx, dy, w, h);
  if (opts.flash) {
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = (opts.alpha ?? 1) * 0.7;
    g.drawImage(spr, dx, dy, w, h);
    g.globalCompositeOperation = 'source-over';
  }
  g.globalAlpha = 1;
}

export function getEnemyThumb(id, size = 24) {
  const spr = getEnemySprite(id);
  const { c, g } = makeCanvas(size, size);
  g.imageSmoothingEnabled = false;
  g.drawImage(spr, 0, 0, size, size);
  return c;
}
