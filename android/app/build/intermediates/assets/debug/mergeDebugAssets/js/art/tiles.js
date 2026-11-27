// art/tiles.js — terrain themes and ground pre-rendering
import { makeCanvas, hash2 } from '../util.js';

export const THEMES = {
  village: {
    grass:'#3f6b3c', grass2:'#4a7a44', grassDark:'#315631', blade:'#5d8f50', flower:'#f2e6a8', flower2:'#d8a0c8',
    path:'#9a8258', path2:'#8a724b', pathDark:'#73603e', pebble:'#b09a72',
    water:'#2b5e7d', water2:'#3b7a98', waterLight:'#8fd4e6',
    stone:'#767986', stone2:'#62656f', wood:'#8a5c34', wood2:'#6e4728',
    wall:'#8a7a62', wall2:'#6e5f4a', roof:'#9a4444', roof2:'#6e2c2c', plaster:'#c9b894', accent:'#e7c77b',
    sky:'#7fb0c9',
  },
  forest: {
    grass:'#2f5236', grass2:'#3a6340', grassDark:'#233f2a', blade:'#4d7d50', flower:'#c9e0a8', flower2:'#8ab0e0',
    path:'#6e5c42', path2:'#5c4c36', pathDark:'#4a3d2c', pebble:'#8a7658',
    water:'#234c66', water2:'#2f6480', waterLight:'#78b8cc',
    stone:'#5e6570', stone2:'#4a505a', wood:'#6e4a2a', wood2:'#523620',
    wall:'#5e5a4a', wall2:'#464234', roof:'#6e3a34', roof2:'#4c2624', plaster:'#8a8068', accent:'#a8c47a',
    sky:'#3a5a4a',
  },
  night: {
    grass:'#26384a', grass2:'#2d4254', grassDark:'#1c2a38', blade:'#3c5568', flower:'#a8c4d8', flower2:'#8a9ac8',
    path:'#4e4a56', path2:'#413e4a', pathDark:'#34323c', pebble:'#5e5a68',
    water:'#1c3850', water2:'#254a68', waterLight:'#6a9cb8',
    stone:'#4a4c58', stone2:'#3a3c46', wood:'#4e3a2a', wood2:'#3a2a1e',
    wall:'#4a4450', wall2:'#38323e', roof:'#4a2a34', roof2:'#32202a', plaster:'#6a6472', accent:'#e7c77b',
    sky:'#0c1424', dark:true,
  },
  snow: {
    grass:'#c8d6e2', grass2:'#d8e4ee', grassDark:'#a8bccc', blade:'#e8f2fa', flower:'#ffffff', flower2:'#a8d0e8',
    path:'#9aa8b8', path2:'#8a98a8', pathDark:'#788698', pebble:'#b8c4d0',
    water:'#4a7a9a', water2:'#5a8aaa', waterLight:'#c8ecff',
    stone:'#7a8490', stone2:'#646e7a', wood:'#6a5040', wood2:'#503c30',
    wall:'#8a94a0', wall2:'#6e7884', roof:'#5a6a80', roof2:'#425268', plaster:'#a8b4c0', accent:'#a8d8f0',
    sky:'#c8e0f0',
  },
  prison: {
    grass:'#3a3a36', grass2:'#42423c', grassDark:'#2e2e2a', blade:'#4a4a42', flower:'#6a6a58', flower2:'#5a5a50',
    path:'#4a4844', path2:'#3e3c38', pathDark:'#32302c', pebble:'#5a5852',
    water:'#2a3a42', water2:'#354a54', waterLight:'#6a8a96',
    stone:'#4e4e52', stone2:'#3e3e42', wood:'#5a4432', wood2:'#42301f',
    wall:'#46464c', wall2:'#34343a', roof:'#3a3a40', roof2:'#28282e', plaster:'#56564e', accent:'#a88a5a',
    sky:'#14161c', dark:true,
  },
  shrine: {
    grass:'#2a3a44', grass2:'#324450', grassDark:'#1e2c34', blade:'#3e5460', flower:'#8ac0c8', flower2:'#6a9aa8',
    path:'#4a4e5a', path2:'#3e424c', pathDark:'#323640', pebble:'#5a5e6a',
    water:'#254a5a', water2:'#2e5a6e', waterLight:'#7ac0d0',
    stone:'#525a66', stone2:'#414852', wood:'#5a4a36', wood2:'#423422',
    wall:'#464e5a', wall2:'#343a44', roof:'#3a4450', roof2:'#2a323c', plaster:'#6a727e', accent:'#7fe0d0',
    sky:'#101a28', dark:true,
  },
  temple: {
    grass:'#8a806a', grass2:'#968c76', grassDark:'#766c58', blade:'#a89e88', flower:'#e8d8a8', flower2:'#c8b888',
    path:'#b8a888', path2:'#a89878', pathDark:'#968868', pebble:'#c8b898',
    water:'#3a6a7a', water2:'#4a7e8e', waterLight:'#a8e0e8',
    stone:'#a89a80', stone2:'#8e8068', wood:'#7a5a3a', wood2:'#5c4228',
    wall:'#9a8a70', wall2:'#7e6e56', roof:'#8a6a4a', roof2:'#6a4e34', plaster:'#c8b898', accent:'#ffd27a',
    sky:'#e8d8b0',
  },
  castle: {
    grass:'#3a3038', grass2:'#443844', grassDark:'#2e2630', blade:'#4e4250', flower:'#8a6a7a', flower2:'#6a5a7a',
    path:'#4a3e48', path2:'#3e3440', pathDark:'#322a34', pebble:'#5a4e58',
    water:'#2a2a3a', water2:'#34344a', waterLight:'#7a6a9a',
    stone:'#4a3e4e', stone2:'#3a3040', wood:'#5a3a3a', wood2:'#42282a',
    wall:'#443848', wall2:'#322a36', roof:'#4a2030', roof2:'#321420', plaster:'#5a4a5a', accent:'#e35f72',
    sky:'#180e20', dark:true,
  },
  // Warm timber-and-plaster interiors used by the enterable village houses.
  interior: {
    grass:'#5a4a36', grass2:'#66543e', grassDark:'#46382a', blade:'#7a6448', flower:'#c9a44c', flower2:'#a8865a',
    path:'#8a6a44', path2:'#7a5a38', pathDark:'#5e442a', pebble:'#a88a62',
    water:'#3a5a6a', water2:'#4a6a7a', waterLight:'#a8d0e0',
    stone:'#9a8a72', stone2:'#766650', wood:'#8a6238', wood2:'#5e4026',
    wall:'#5a3e2a', wall2:'#3e2a1c', roof:'#7a4a3a', roof2:'#5a3428', plaster:'#c9b894', accent:'#e7c77b',
    sky:'#1a1410',
  },
};

const WALK = new Set(['.', ',', '"', 'p', 's', 'w', 'W', 'b', 'S', 'i', 'c', '=', 'u', 'd', 'f', 'g']);
export function tileWalkable(ch) { return WALK.has(ch); }
export function tileIsWater(ch) { return ch === '~'; }
export function tileIsEncounter(ch) { return ch === '"'; }

function baseRect(g, c, x, y, w, h) { g.fillStyle = c; g.fillRect(x, y, w, h); }

function drawGrass(g, th, x, y, hash, tall = false) {
  baseRect(g, tall ? th.grassDark : th.grass, x, y, 16, 16);
  const h2 = hash2(x, y + 7);
  // subtle patches
  baseRect(g, th.grass2, x + (hash > 0.5 ? 0 : 8), y + 0, 8, 8);
  baseRect(g, th.grass2, x + (hash > 0.5 ? 8 : 0), y + 8, 8, 8);
  // blades
  const n = tall ? 7 : 3;
  for (let i = 0; i < n; i++) {
    const bx = x + 1 + Math.floor(hash2(x + i * 3, y + i) * 14);
    const by = y + 2 + Math.floor(hash2(x + i, y + i * 5) * 12);
    g.fillStyle = i % 3 === 0 ? th.blade : th.grassDark;
    g.fillRect(bx, by, 1, 2 + (i % 2));
    if (i % 2 === 0) g.fillRect(bx + 1, by + 1, 1, 1);
  }
  if (tall) {
    for (let i = 0; i < 5; i++) {
      const bx = x + 1 + Math.floor(hash2(x + i * 7, y + 3) * 14);
      g.fillStyle = th.blade;
      g.fillRect(bx, y + 5 + (i % 4), 1, 5);
    }
  }
  if (h2 > 0.93) {
    g.fillStyle = th.flower;
    g.fillRect(x + 5, y + 7, 2, 2);
    g.fillStyle = th.flower2;
    g.fillRect(x + 10, y + 11, 2, 2);
  }
}

function drawFlowers(g, th, x, y, hash) {
  drawGrass(g, th, x, y, hash);
  const c = hash > 0.5 ? th.flower : th.flower2;
  const spots = [[4, 5], [10, 8], [7, 12]];
  spots.forEach(([fx, fy], i) => {
    g.fillStyle = c; g.fillRect(x + fx, y + fy, 2, 2);
    g.fillStyle = '#fff6d8'; g.fillRect(x + fx, y + fy, 1, 1);
  });
}

function drawPath(g, th, x, y, hash) {
  baseRect(g, th.path, x, y, 16, 16);
  baseRect(g, th.path2, x, y + 8, 16, 8);
  g.fillStyle = th.pathDark;
  g.fillRect(x, y, 16, 1); g.fillRect(x, y + 15, 16, 1);
  if (hash > 0.55) {
    g.fillStyle = th.pebble;
    g.fillRect(x + Math.floor(hash * 12) + 2, y + Math.floor(hash2(x, y) * 12) + 2, 2, 2);
  }
  if (hash > 0.85) { g.fillStyle = th.pathDark; g.fillRect(x + 3, y + 9, 3, 1); }
}

function drawStoneFloor(g, th, x, y, hash, dark = false) {
  const base = dark ? th.stone2 : th.stone;
  const line = th.stone2;
  baseRect(g, base, x, y, 16, 16);
  g.fillStyle = line;
  g.fillRect(x, y + 15, 16, 1); g.fillRect(x + 15, y, 1, 16);
  g.fillRect(x, y + 7, 16, 1); g.fillRect(x + 7, y, 1, 7); g.fillRect(x + 11, y + 8, 1, 7);
  g.fillStyle = 'rgba(255,255,255,.06)';
  g.fillRect(x + 1, y + 1, 6, 1); g.fillRect(x + 12, y + 9, 3, 1);
  if (hash > 0.8) { g.fillStyle = line; g.fillRect(x + 3, y + 10, 4, 1); }
}

function drawWood(g, th, x, y, hash) {
  baseRect(g, th.wood, x, y, 16, 16);
  g.fillStyle = th.wood2;
  g.fillRect(x, y + 3, 16, 1); g.fillRect(x, y + 7, 16, 1); g.fillRect(x, y + 11, 16, 1); g.fillRect(x, y + 15, 16, 1);
  g.fillStyle = 'rgba(255,255,255,.07)';
  g.fillRect(x + 2, y + 1, 5, 1); g.fillRect(x + 9, y + 5, 5, 1);
  g.fillStyle = th.wood2;
  g.fillRect(x + 4, y + 4, 1, 3); g.fillRect(x + 11, y + 8, 1, 3); g.fillRect(x + 7, y + 12, 1, 3);
}

function drawPlank(g, th, x, y, hash) {
  baseRect(g, th.wood, x, y, 16, 16);
  // Two broad boards per tile. Long horizontal seams and grain read as timber;
  // vertical joints are deliberately rare so the floor does not look like brick.
  g.fillStyle = th.wood2;
  g.fillRect(x, y + 7, 16, 1);
  g.fillRect(x, y + 15, 16, 1);
  g.fillStyle = 'rgba(0,0,0,.12)';
  g.fillRect(x + 3, y + 3, 7, 1);
  g.fillRect(x + 6, y + 11, 6, 1);
  g.fillStyle = 'rgba(255,255,255,.09)';
  g.fillRect(x + 2, y + 1, 5, 1);
  g.fillRect(x + 9, y + 9, 4, 1);
  if (hash > 0.82) {
    g.fillStyle = th.wood2;
    g.fillRect(x + 4, y + 5, 3, 1);
    g.fillRect(x + 5, y + 4, 1, 3);
  }
  if (hash > 0.92) {
    g.fillStyle = 'rgba(0,0,0,.10)';
    g.fillRect(x, y, 1, 7);
    g.fillRect(x + 15, y + 8, 1, 7);
  }
}

function drawWater(g, th, x, y, hash, time = 0) {
  baseRect(g, th.water, x, y, 16, 16);
  baseRect(g, th.water2, x, y + 4, 16, 8);
  g.fillStyle = th.waterLight;
  const w1 = 3 + Math.floor(hash * 5);
  g.globalAlpha = 0.35;
  g.fillRect(x + 2, y + 3, w1, 1);
  g.fillRect(x + 9, y + 8, 4, 1);
  g.fillRect(x + 4, y + 12, 5, 1);
  g.globalAlpha = 1;
}

function drawBridge(g, th, x, y, hash) {
  baseRect(g, th.wood, x, y, 16, 16);
  g.fillStyle = th.wood2;
  for (let i = 0; i < 4; i++) g.fillRect(x + 1, y + i * 4 + 3, 14, 1);
  g.fillStyle = '#3a3a3a';
  g.fillRect(x, y, 2, 16); g.fillRect(x + 14, y, 2, 16);
  g.fillStyle = '#6a6a6a';
  g.fillRect(x + 1, y + 1, 1, 1); g.fillRect(x + 1, y + 13, 1, 1);
}

function drawSnow(g, th, x, y, hash) {
  baseRect(g, th.grass, x, y, 16, 16);
  baseRect(g, th.grass2, x + (hash > 0.5 ? 0 : 8), y, 8, 16);
  g.fillStyle = th.grassDark;
  g.globalAlpha = 0.25;
  g.fillRect(x + 1, y + 12, 6, 1); g.fillRect(x + 9, y + 5, 4, 1);
  g.globalAlpha = 1;
  if (hash > 0.9) { g.fillStyle = '#ffffff'; g.fillRect(x + 4, y + 6, 2, 2); g.fillRect(x + 11, y + 11, 1, 1); }
  g.fillStyle = 'rgba(160,200,230,.18)';
  g.fillRect(x + 2, y + 2, 2, 2);
}

function drawIce(g, th, x, y, hash) {
  baseRect(g, '#b8d8e8', x, y, 16, 16);
  baseRect(g, '#c8e4f2', x, y + 6, 16, 10);
  g.fillStyle = '#8ab8d0';
  g.fillRect(x + 3, y + 4, 1, 5); g.fillRect(x + 4, y + 8, 4, 1);
  g.fillRect(x + 10, y + 2, 1, 6); g.fillRect(x + 8, y + 7, 3, 1);
  g.fillStyle = '#eefaff';
  g.fillRect(x + 6, y + 10, 3, 1);
}

function drawCarpet(g, th, x, y, hash) {
  baseRect(g, '#5a1e2a', x, y, 16, 16);
  baseRect(g, '#6e2634', x + 2, y, 12, 16);
  g.fillStyle = '#c9a44c';
  g.fillRect(x, y, 2, 16); g.fillRect(x + 14, y, 2, 16);
  g.fillStyle = '#8a3040';
  g.fillRect(x + 5, y + 4, 6, 1); g.fillRect(x + 5, y + 11, 6, 1);
  g.fillStyle = '#e0c070';
  if ((x / 16 + y / 16) % 2 === 0) { g.fillRect(x + 7, y + 7, 2, 2); }
}

function drawWall(g, th, x, y, hash) {
  baseRect(g, th.wall2, x, y, 16, 16);
  // brick courses
  g.fillStyle = th.wall;
  for (let row = 0; row < 4; row++) {
    const off = (row % 2) * 4;
    for (let col = -1; col < 3; col++) {
      const bx = x + col * 8 + off;
      const by = y + row * 4;
      g.fillRect(Math.max(x, bx + 1), by + 1, Math.min(7, x + 16 - Math.max(x, bx + 1)), 3);
    }
  }
  g.fillStyle = 'rgba(255,255,255,.06)';
  g.fillRect(x + 1, y + 1, 6, 1);
  if (hash > 0.75) { g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x + 9, y + 9, 5, 2); }
}

function drawDungeon(g, th, x, y, hash) {
  baseRect(g, '#3a3a40', x, y, 16, 16);
  baseRect(g, '#34343a', x, y + 8, 16, 8);
  g.fillStyle = '#2a2a30';
  g.fillRect(x, y + 15, 16, 1); g.fillRect(x + 15, y, 1, 16); g.fillRect(x + 7, y, 1, 8);
  if (hash > 0.7) { g.fillStyle = '#4a4a50'; g.fillRect(x + 3, y + 4, 4, 1); }
  if (hash > 0.9) { g.fillStyle = '#4a5a3a'; g.fillRect(x + 10, y + 11, 3, 2); }
}

function drawDirt(g, th, x, y, hash) {
  baseRect(g, th.path2, x, y, 16, 16);
  g.fillStyle = th.pathDark;
  g.fillRect(x + 2, y + 6, 3, 1); g.fillRect(x + 10, y + 12, 4, 1);
  g.fillStyle = th.pebble;
  if (hash > 0.6) g.fillRect(x + 6, y + 3, 1, 1);
}

function drawVoid(g, x, y) { baseRect(g, '#04060a', x, y, 16, 16); }

export function renderGround(map) {
  const th = THEMES[map.theme] || THEMES.village;
  const { c, g } = makeCanvas(map.w * 16, map.h * 16);
  g.imageSmoothingEnabled = false;
  for (let y = 0; y < map.h; y++) {
    const row = map.ground[y] || '';
    for (let x = 0; x < map.w; x++) {
      const ch = row[x] || '#';
      const px = x * 16, py = y * 16;
      const hash = hash2(x * 3 + 1, y * 5 + 2);
      switch (ch) {
        case '.': drawGrass(g, th, px, py, hash); break;
        case ',': drawFlowers(g, th, px, py, hash); break;
        case '"': drawGrass(g, th, px, py, hash, true); break;
        case 'p': drawPath(g, th, px, py, hash); break;
        case 's': drawStoneFloor(g, th, px, py, hash, false); break;
        case '=': drawStoneFloor(g, th, px, py, hash, true); break;
        case 'w': drawWood(g, th, px, py, hash); break;
        case 'W': drawPlank(g, th, px, py, hash); break;
        case '~': drawWater(g, th, px, py, hash); break;
        case 'b': drawBridge(g, th, px, py, hash); break;
        case 'S': drawSnow(g, th, px, py, hash); break;
        case 'i': drawIce(g, th, px, py, hash); break;
        case 'c': drawCarpet(g, th, px, py, hash); break;
        case '#': drawWall(g, th, px, py, hash); break;
        case 'u': drawDungeon(g, th, px, py, hash); break;
        case 'd': drawDirt(g, th, px, py, hash); break;
        case 'f': drawGrass(g, th, px, py, hash, true); break;
        case 'X': drawVoid(g, px, py); break;
        default: drawGrass(g, th, px, py, hash);
      }
    }
  }
  // soft ambient overlays
  if (th.dark) {
    g.fillStyle = 'rgba(4,8,20,.18)';
    g.fillRect(0, 0, c.width, c.height);
  }
  if (map.theme === 'forest') {
    g.fillStyle = 'rgba(30,60,30,.10)';
    g.fillRect(0, 0, c.width, c.height);
  }
  return c;
}

export function drawWaterShimmer(g, map, cam, time, zoom) {
  const th = THEMES[map.theme] || THEMES.village;
  const x0 = Math.max(0, Math.floor(cam.x / 16));
  const y0 = Math.max(0, Math.floor(cam.y / 16));
  const x1 = Math.min(map.w - 1, Math.ceil((cam.x + cam.w) / 16));
  const y1 = Math.min(map.h - 1, Math.ceil((cam.y + cam.h) / 16));
  g.save();
  g.globalAlpha = 0.35;
  g.fillStyle = th.waterLight;
  for (let y = y0; y <= y1; y++) {
    const row = map.ground[y] || '';
    for (let x = x0; x <= x1; x++) {
      if (row[x] !== '~') continue;
      const phase = hash2(x, y) * 6.28;
      const off = Math.sin(time * 1.8 + phase) * 3;
      const wx = (x * 16 + 3 + off) * zoom - cam.x * zoom;
      const wy = (y * 16 + 6 + Math.cos(time * 1.2 + phase) * 2) * zoom - cam.y * zoom;
      g.fillRect(Math.round(wx), Math.round(wy), 5 * zoom, Math.max(1, Math.round(zoom * 0.7)));
    }
  }
  g.restore();
}
