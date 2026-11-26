// data/maps.js — handcrafted tile maps and placements
import { mulberry32 } from '../util.js';

const fill = (w, h, ch) => Array.from({ length: h }, () => Array(w).fill(ch));
const setRect = (rows, x, y, w, h, ch) => {
  for (let yy = y; yy < y + h; yy++) {
    if (!rows[yy]) continue;
    for (let xx = x; xx < x + w; xx++) if (rows[yy][xx] !== undefined) rows[yy][xx] = ch;
  }
};
const line = (rows, x1, y1, x2, y2, ch, width = 2) => {
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
  for (let i = 0; i <= steps; i++) {
    const t = steps ? i / steps : 0;
    const x = Math.round(x1 + (x2 - x1) * t);
    const y = Math.round(y1 + (y2 - y1) * t);
    setRect(rows, x - Math.floor(width / 2), y - Math.floor(width / 2), width, width, ch);
  }
};
const carve = (rows, pts, width = 2, ch = 'p') => {
  for (let i = 0; i < pts.length - 1; i++) line(rows, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], ch, width);
};
const strings = (rows) => rows.map((r) => r.join(''));

function scatter(rows, count, seed, w, h, ch = ',', avoid = []) {
  const rng = mulberry32(seed);
  for (let i = 0; i < count; i++) {
    const x = 1 + Math.floor(rng() * (w - 2));
    const y = 1 + Math.floor(rng() * (h - 2));
    if (rows[y][x] === '.' || rows[y][x] === 'S') rows[y][x] = ch;
  }
}

function borderTrees(map, seed, opts = {}) {
  const rng = mulberry32(seed);
  const skip = opts.skip || [];
  const isSkipped = (x, y) => skip.some(([sx, sy, sw, sh]) => x >= sx && x < sx + sw && y >= sy && y < sy + sh);
  const kinds = opts.kinds || ['tree', 'pine'];
  for (let x = 0; x < map.w; x += 2) {
    for (const y of [0, 1, map.h - 2, map.h - 1]) {
      if (isSkipped(x, y)) continue;
      if (rng() < 0.72) map.props.push({ t: kinds[Math.floor(rng() * kinds.length)], x, y: Math.min(y, map.h - 2) });
    }
  }
  for (let y = 2; y < map.h - 2; y += 2) {
    for (const x of [0, 1, map.w - 2, map.w - 1]) {
      if (isSkipped(x, y)) continue;
      if (rng() < 0.72) map.props.push({ t: kinds[Math.floor(rng() * kinds.length)], x, y });
    }
  }
}

// ---------------------------------------------------------------- VILLAGE
const villageRows = fill(30, 20, '.');
setRect(villageRows, 9, 9, 12, 5, 'p');
setRect(villageRows, 14, 2, 2, 17, 'p');
scatter(villageRows, 34, 7, 30, 20, ',');

export const VILLAGE = {
  id: 'village', name: 'Brumalva', theme: 'village', bgm: 'village', ambient: 'leaves',
  w: 30, h: 20, ground: strings(villageRows), spawn: { x: 14, y: 18, dir: 'up' },
  props: [
    { t: 'house', x: 3, y: 2 }, { t: 'house', x: 21, y: 2, v: 'blue' },
    { t: 'house', x: 3, y: 14, v: 'thatch' }, { t: 'house', x: 21, y: 14 },
    { t: 'fountain', x: 11, y: 10 },
    { t: 'stall', x: 17, y: 10 },
    { t: 'lamp', x: 9, y: 8 }, { t: 'lamp', x: 20, y: 8 }, { t: 'lamp', x: 9, y: 14 }, { t: 'lamp', x: 20, y: 14 },
    { t: 'sign', x: 12, y: 17 }, { t: 'dummy', x: 6, y: 12 },
    { t: 'crate', x: 20, y: 12 }, { t: 'barrel', x: 21, y: 12 },
    { t: 'well', x: 25, y: 8 },
    { t: 'bush', x: 2, y: 8 }, { t: 'bush', x: 27, y: 10 }, { t: 'bush', x: 12, y: 6 },
  ],
  npcs: [
    { id: 'lyra', sprite: 'lyra', x: 16, y: 11, dir: 'down', name: 'Lyra', talk: 'lyra_festival' },
    { id: 'dorian', sprite: 'dorian', x: 14, y: 7, dir: 'down', name: 'Dorian', talk: 'dorian_village' },
    { id: 'elder', sprite: 'elder', x: 8, y: 9, dir: 'right', name: 'Anciã Maeve', talk: 'elder_village' },
    { id: 'merchant', sprite: 'merchant', x: 18, y: 12, dir: 'down', name: 'Tolan', talk: 'merchant_village' },
    { id: 'child', sprite: 'child', x: 19, y: 14, dir: 'left', name: 'Pip', talk: 'child_village', wander: 2 },
    { id: 'garrick', sprite: 'garrick', x: 8, y: 13, dir: 'right', name: 'Garrick', talk: 'garrick_village' },
    { id: 'blacksmith', sprite: 'villager1', x: 12, y: 15, dir: 'up', name: 'Haldor', talk: 'blacksmith_village' },
    { id: 'villager2', sprite: 'villager2', x: 23, y: 12, dir: 'left', name: 'Lavadeira', talk: 'villager_village', wander: 1 },
    { id: 'guard', sprite: 'guard', x: 16, y: 2, dir: 'down', name: 'Guarda', talk: 'guard_gate' },
  ],
  portals: [
    { x: 14, y: 0, w: 2, h: 1, to: 'forest', tx: 12, ty: 16, dir: 'up', when: (g) => g.flags.northOpen },
  ],
  chests: [{ id: 'v_chest1', x: 27, y: 16, item: 'potion', n: 2 }],
  triggers: [
    { id: 'wolves', x: 12, y: 3, w: 6, h: 2, script: 'wolves_attack', once: true, when: (g) => g.flags.festivalDone },
  ],
  onEnter: 'village_intro',
};
borderTrees(VILLAGE, 11, { skip: [[12, 0, 6, 2], [12, 18, 6, 2]] });

// ---------------------------------------------------------------- FOREST
const forestRows = fill(26, 18, '.');
carve(forestRows, [[12, 17], [12, 14], [8, 11], [12, 8], [12, 3], [13, 0]], 2);
setRect(forestRows, 0, 9, 26, 2, '~');
setRect(forestRows, 11, 9, 3, 2, 'b');
scatter(forestRows, 26, 21, 26, 18, ',');
// tall grass pockets
setRect(forestRows, 3, 12, 4, 3, '"');
setRect(forestRows, 18, 12, 5, 3, '"');
setRect(forestRows, 4, 4, 4, 2, '"');
setRect(forestRows, 18, 4, 4, 3, '"');
setRect(forestRows, 9, 15, 3, 2, 'p');

export const FOREST = {
  id: 'forest', name: 'Bosque dos Sussurros', theme: 'forest', bgm: 'field', ambient: 'fireflies',
  w: 26, h: 18, ground: strings(forestRows), spawn: { x: 12, y: 16, dir: 'up' },
  props: [
    { t: 'rock', x: 5, y: 8 }, { t: 'rock', x: 19, y: 8 }, { t: 'rock', x: 16, y: 15 },
    { t: 'deadtree', x: 15, y: 5 }, { t: 'deadtree', x: 6, y: 14 },
    { t: 'bush', x: 10, y: 12 }, { t: 'bush', x: 17, y: 10 }, { t: 'bush', x: 9, y: 6 },
    { t: 'tree', x: 4, y: 2 }, { t: 'tree', x: 20, y: 2 }, { t: 'pine', x: 3, y: 15 }, { t: 'pine', x: 21, y: 14 },
    { t: 'lamp', x: 12, y: 15 },
  ],
  npcs: [],
  portals: [{ x: 12, y: 0, w: 2, h: 1, to: 'shrine', tx: 9, ty: 12, dir: 'up' }],
  chests: [{ id: 'f_chest1', x: 21, y: 15, item: 'ether', n: 2 }],
  triggers: [
    { id: 'forest_follow', x: 10, y: 13, w: 4, h: 2, script: 'forest_night', once: true },
  ],
};
borderTrees(FOREST, 23, { skip: [[11, 0, 4, 2], [10, 16, 5, 2]] });

// ---------------------------------------------------------------- SHRINE
const shrineRows = fill(20, 14, '#');
setRect(shrineRows, 2, 1, 16, 11, '=');
setRect(shrineRows, 9, 4, 2, 8, 'c');
setRect(shrineRows, 8, 3, 4, 1, 'c');
setRect(shrineRows, 8, 12, 4, 2, '=');

export const SHRINE = {
  id: 'shrine', name: 'Santuário da Brasa', theme: 'shrine', bgm: 'shrine', ambient: 'dust',
  w: 20, h: 14, ground: strings(shrineRows), spawn: { x: 9, y: 12, dir: 'up' },
  props: [
    { t: 'altar', x: 8, y: 2 }, { t: 'pillar', x: 4, y: 4 }, { t: 'pillar', x: 15, y: 4 },
    { t: 'pillar', x: 4, y: 9 }, { t: 'pillar', x: 15, y: 9 },
    { t: 'banner', x: 2, y: 1 }, { t: 'banner', x: 17, y: 1 },
    { t: 'torch', x: 2, y: 6 }, { t: 'torch', x: 17, y: 6 },
    { t: 'crystal', x: 6, y: 7 }, { t: 'crystal', x: 13, y: 7 },
  ],
  npcs: [],
  portals: [{ x: 9, y: 13, w: 2, h: 1, to: 'forest', tx: 12, ty: 2, dir: 'down' }],
  chests: [],
  triggers: [],
  onEnter: 'shrine_traitor',
};

// ---------------------------------------------------------------- PRISON
const prisonRows = fill(26, 18, '#');
setRect(prisonRows, 1, 7, 24, 9, 'u');
for (const cx of [1, 6, 11, 16, 21]) {
  setRect(prisonRows, cx, 1, 4, 6, 'u');
  setRect(prisonRows, cx + 1, 6, 3, 1, 'u');
}
setRect(prisonRows, 21, 14, 3, 2, 'u');

export const PRISON = {
  id: 'prison', name: 'Forte Abissal', theme: 'prison', bgm: 'prison', ambient: 'dust',
  w: 26, h: 18, ground: strings(prisonRows), spawn: { x: 7, y: 4, dir: 'down' },
  props: [
    { t: 'bars', x: 2, y: 6, openFlag: 'cellOpen' }, { t: 'bars', x: 7, y: 6, openFlag: 'cellOpen' },
    { t: 'bed', x: 1, y: 1 }, { t: 'bed', x: 6, y: 1 }, { t: 'bed', x: 16, y: 1 },
    { t: 'crate', x: 4, y: 4 }, { t: 'crate', x: 9, y: 3 }, { t: 'barrel', x: 3, y: 5 },
    { t: 'torch', x: 5, y: 6 }, { t: 'torch', x: 10, y: 6 }, { t: 'torch', x: 15, y: 6 }, { t: 'torch', x: 20, y: 6 },
    { t: 'torch', x: 1, y: 12 }, { t: 'torch', x: 24, y: 12 },
    { t: 'table', x: 12, y: 12 }, { t: 'crate', x: 14, y: 12 }, { t: 'barrel', x: 14, y: 13 },
    { t: 'stairs', x: 21, y: 13 }, { t: 'rubble', x: 8, y: 15 }, { t: 'rubble', x: 18, y: 14 },
    { t: 'banner', x: 1, y: 8 }, { t: 'banner', x: 24, y: 8 },
  ],
  npcs: [
    { id: 'garrick', sprite: 'garrick', x: 8, y: 4, dir: 'down', name: 'Garrick', talk: 'garrick_cell', when: (g) => !g.flags.garrickFree },
  ],
  portals: [{ x: 22, y: 15, w: 1, h: 1, to: 'mountain', tx: 13, ty: 17, dir: 'up', when: (g) => g.flags.prisonEscape }],
  chests: [
    { id: 'p_chest1', x: 18, y: 3, item: 'potion2', n: 2, when: (g) => g.flags.cellOpen },
    { id: 'p_chest2', x: 3, y: 15, item: 'ether', n: 2 },
  ],
  triggers: [
    { id: 'guards', x: 7, y: 8, w: 5, h: 3, script: 'prison_guards', once: true, when: (g) => g.flags.cellOpen },
    { id: 'jailer', x: 14, y: 8, w: 6, h: 5, script: 'prison_jailer', once: true, when: (g) => g.flags.prisonGuardsDown },
    { id: 'escape', x: 21, y: 14, w: 3, h: 2, script: 'prison_escape', once: true, when: (g) => g.flags.jailerDown },
  ],
  onEnter: 'prison_wake',
};

// ---------------------------------------------------------------- MOUNTAIN
const mountainRows = fill(28, 20, 'S');
carve(mountainRows, [[13, 19], [13, 16], [8, 14], [8, 11], [14, 9], [18, 6], [14, 4], [14, 1]], 2);
setRect(mountainRows, 4, 8, 3, 2, 'i');
setRect(mountainRows, 19, 13, 3, 2, 'i');
setRect(mountainRows, 22, 3, 3, 2, 'i');
setRect(mountainRows, 16, 11, 4, 3, 'p');

export const MOUNTAIN = {
  id: 'mountain', name: 'Pico do Amanhecer', theme: 'snow', bgm: 'snow', ambient: 'snow',
  w: 28, h: 20, ground: strings(mountainRows), spawn: { x: 13, y: 18, dir: 'up' },
  props: [
    { t: 'campfire', x: 17, y: 13 },
    { t: 'rock', x: 4, y: 12 }, { t: 'rock', x: 10, y: 7 }, { t: 'rock', x: 16, y: 6 }, { t: 'rock', x: 21, y: 10 },
    { t: 'rock', x: 5, y: 16 }, { t: 'rock', x: 22, y: 17 }, { t: 'crystal', x: 12, y: 11 }, { t: 'crystal', x: 17, y: 8 },
    { t: 'pineSnow', x: 3, y: 3 }, { t: 'pineSnow', x: 23, y: 3 }, { t: 'pineSnow', x: 5, y: 5 }, { t: 'pineSnow', x: 24, y: 14 },
    { t: 'treeSnow', x: 2, y: 17 }, { t: 'deadtree', x: 9, y: 16 }, { t: 'tent', x: 19, y: 14 },
    { t: 'statue', x: 11, y: 2 }, { t: 'statue', x: 15, y: 2 },
  ],
  npcs: [],
  portals: [{ x: 13, y: 0, w: 2, h: 1, to: 'temple', tx: 9, ty: 12, dir: 'up', when: (g) => g.flags.sentinelDown }],
  chests: [
    { id: 'm_chest1', x: 24, y: 16, item: 'potion2', n: 2 },
    { id: 'm_chest2', x: 4, y: 6, item: 'ether', n: 2 },
  ],
  triggers: [
    { id: 'mira', x: 8, y: 12, w: 3, h: 2, script: 'mountain_mira', once: true },
    { id: 'sentinel', x: 12, y: 3, w: 5, h: 2, script: 'mountain_sentinel', once: true, when: (g) => g.flags.metMira },
  ],
  encounter: { tiles: ['S', 'p'], rate: 0.055, minSteps: 14, groups: 'mountain' },
};
borderTrees(MOUNTAIN, 31, { kinds: ['pineSnow', 'treeSnow'], skip: [[12, 0, 4, 2], [11, 18, 5, 2]] });

// ---------------------------------------------------------------- TEMPLE
const templeRows = fill(20, 14, '#');
setRect(templeRows, 2, 1, 16, 11, '=');
setRect(templeRows, 9, 3, 2, 9, 'c');
setRect(templeRows, 7, 2, 6, 1, 'c');
setRect(templeRows, 8, 11, 4, 2, '=');

export const TEMPLE = {
  id: 'temple', name: 'Santuário da Aurora', theme: 'temple', bgm: 'shrine', ambient: 'dust',
  w: 20, h: 14, ground: strings(templeRows), spawn: { x: 9, y: 12, dir: 'up' },
  props: [
    { t: 'altar', x: 8, y: 2 }, { t: 'pillar', x: 4, y: 4 }, { t: 'pillar', x: 15, y: 4 },
    { t: 'pillar', x: 4, y: 8 }, { t: 'pillar', x: 15, y: 8 },
    { t: 'banner', x: 2, y: 1 }, { t: 'banner', x: 17, y: 1 },
    { t: 'statue', x: 2, y: 10 }, { t: 'statue', x: 16, y: 10 },
    { t: 'crystal', x: 6, y: 6 }, { t: 'crystal', x: 13, y: 6 },
    { t: 'portal', x: 9, y: 0 },
  ],
  npcs: [
    { id: 'mira', sprite: 'mira', x: 11, y: 9, dir: 'up', name: 'Mira', talk: 'mira_temple', when: (g) => !g.flags.blessed },
  ],
  portals: [{ x: 9, y: 1, w: 2, h: 1, to: 'village_night', tx: 14, ty: 18, dir: 'up', when: (g) => g.flags.blessed }],
  chests: [{ id: 't_chest1', x: 3, y: 11, item: 'elixir', n: 1, when: (g) => g.flags.blessed }],
  triggers: [],
  onEnter: 'temple_blessing',
};

// ---------------------------------------------------------------- VILLAGE NIGHT
const nightRows = fill(30, 20, '.');
setRect(nightRows, 9, 9, 12, 5, 'p');
setRect(nightRows, 14, 2, 2, 17, 'p');
scatter(nightRows, 20, 7, 30, 20, ',');

export const VILLAGE_NIGHT = {
  id: 'village_night', name: 'Brumalva Ocupada', theme: 'night', bgm: 'night', ambient: 'embers',
  w: 30, h: 20, ground: strings(nightRows), spawn: { x: 14, y: 18, dir: 'up' },
  props: [
    { t: 'house', x: 3, y: 2, v: 'blue' }, { t: 'house', x: 21, y: 2, v: 'blue' },
    { t: 'house', x: 3, y: 14 }, { t: 'house', x: 21, y: 14, v: 'thatch' },
    { t: 'fountain', x: 11, y: 10 },
    { t: 'lamp', x: 9, y: 8 }, { t: 'lamp', x: 20, y: 8 }, { t: 'lamp', x: 9, y: 14 }, { t: 'lamp', x: 20, y: 14 },
    { t: 'campfire', x: 10, y: 15 },
    { t: 'sign', x: 12, y: 17 }, { t: 'banner', x: 24, y: 6 }, { t: 'banner', x: 5, y: 6 },
    { t: 'rubble', x: 17, y: 15 }, { t: 'rubble', x: 8, y: 7 }, { t: 'deadtree', x: 26, y: 9 },
    { t: 'crate', x: 9, y: 15 }, { t: 'barrel', x: 12, y: 15 },
    { t: 'tent', x: 4, y: 11 }, { t: 'gate', x: 21, y: 6, openFlag: 'manorOpen' },
  ],
  npcs: [
    { id: 'elder', sprite: 'elder', x: 8, y: 16, dir: 'right', name: 'Anciã Maeve', talk: 'night_elder' },
    { id: 'resistance', sprite: 'resistance', x: 6, y: 16, dir: 'right', name: 'Brann', talk: 'night_resistance' },
    { id: 'smith', sprite: 'villager3', x: 13, y: 14, dir: 'left', name: 'Ferreira Anka', talk: 'blacksmith_night' },
    { id: 'guard1', sprite: 'guard', x: 12, y: 10, dir: 'down', name: 'Guarda Ocupante', talk: 'night_guard', when: (g) => !g.flags.nightGuardDown },
    { id: 'guard2', sprite: 'guard', x: 18, y: 14, dir: 'left', name: 'Guarda Ocupante', talk: 'night_guard', when: (g) => !g.flags.nightGuardDown },
    { id: 'varek', sprite: 'champion', x: 19, y: 9, dir: 'down', name: 'Sir Varek', talk: 'night_varek', when: (g) => g.flags.talkedResistance && !g.flags.varekDown },
    { id: 'lyra', sprite: 'lyra', x: 22, y: 8, dir: 'down', name: 'Lyra', talk: 'night_lyra', when: (g) => g.flags.varekDown && !g.flags.lyraJoined },
  ],
  portals: [{ x: 14, y: 0, w: 2, h: 1, to: 'castle', tx: 11, ty: 16, dir: 'up', when: (g) => g.flags.lyraJoined }],
  chests: [{ id: 'n_chest1', x: 27, y: 16, item: 'elixir', n: 1, when: (g) => g.flags.talkedResistance }],
  triggers: [],
  encounter: { tiles: ['p'], rate: 0.045, minSteps: 18, groups: 'night' },
  onEnter: 'night_arrival',
};
borderTrees(VILLAGE_NIGHT, 17, { kinds: ['deadtree', 'tree'], skip: [[12, 0, 6, 2], [12, 18, 6, 2]] });

// ---------------------------------------------------------------- CASTLE
const castleRows = fill(24, 18, '#');
setRect(castleRows, 1, 1, 22, 16, 'u');
setRect(castleRows, 10, 2, 4, 15, 'c');
setRect(castleRows, 8, 1, 8, 1, 'u');
setRect(castleRows, 11, 16, 2, 1, 'u');

export const CASTLE = {
  id: 'castle', name: 'Castelo de Valdoria', theme: 'castle', bgm: 'castle', ambient: 'embers',
  w: 24, h: 18, ground: strings(castleRows), spawn: { x: 11, y: 16, dir: 'up' },
  props: [
    { t: 'throne', x: 10, y: 1 }, { t: 'banner', x: 7, y: 2 }, { t: 'banner', x: 16, y: 2 },
    { t: 'pillar', x: 3, y: 4 }, { t: 'pillar', x: 3, y: 8 }, { t: 'pillar', x: 3, y: 12 },
    { t: 'pillar', x: 20, y: 4 }, { t: 'pillar', x: 20, y: 8 }, { t: 'pillar', x: 20, y: 12 },
    { t: 'statue', x: 4, y: 2 }, { t: 'statue', x: 18, y: 2 },
    { t: 'torch', x: 1, y: 5 }, { t: 'torch', x: 22, y: 5 }, { t: 'torch', x: 1, y: 11 }, { t: 'torch', x: 22, y: 11 },
    { t: 'rubble', x: 6, y: 14 }, { t: 'rubble', x: 17, y: 6 }, { t: 'crystal', x: 5, y: 15 }, { t: 'crystal', x: 18, y: 15 },
  ],
  npcs: [
    { id: 'dorian', sprite: 'dorian', x: 11, y: 4, dir: 'down', name: 'Dorian', talk: 'final_dorian', when: (g) => g.flags.castleKnightsDown && !g.flags.dorianDown },
  ],
  portals: [],
  chests: [
    { id: 'c_chest1', x: 3, y: 14, item: 'elixir', n: 1 },
    { id: 'c_chest2', x: 20, y: 14, item: 'potion2', n: 3 },
  ],
  triggers: [
    { id: 'knights', x: 8, y: 8, w: 8, h: 4, script: 'castle_knights', once: true },
    { id: 'final', x: 9, y: 3, w: 6, h: 3, script: 'final_battle', once: true, when: (g) => g.flags.castleKnightsDown },
  ],
  onEnter: 'castle_arrival',
};

export const MAPS = {
  village: VILLAGE, forest: FOREST, shrine: SHRINE, prison: PRISON,
  mountain: MOUNTAIN, temple: TEMPLE, village_night: VILLAGE_NIGHT, castle: CASTLE,
};

export function getMap(id) { return MAPS[id]; }
