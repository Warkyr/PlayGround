/* =========================================================================
   AURORA PARTIDA — data, maps, heroes, enemies, skills
   ========================================================================= */
'use strict';

const TILE = 40;
const MAP_W = 24;
const MAP_H = 15;
const WALKABLE = new Set(['.', ',', ':', 'p', 'P', 's', 'c', 'b', '*', 'G']);
const DIRS = {
  down:  { x: 0,  y: 1,  name: 'down'  },
  up:    { x: 0,  y: -1, name: 'up'    },
  left:  { x: -1, y: 0,  name: 'left'  },
  right: { x: 1,  y: 0,  name: 'right' }
};

const GAME_SUBTITLE = 'A Ascensão de Rowan';
const ACTS = {
  1: { label: 'ATO I', name: 'A Promessa' },
  2: { label: 'ATO II', name: 'O Abismo' },
  3: { label: 'ATO III', name: 'A Provação' },
  4: { label: 'ATO IV', name: 'A Aurora' }
};

/* ------------------------------------------------------------------ maps */
function blank(ch) {
  return Array.from({ length: MAP_H }, () => Array(MAP_W).fill(ch));
}
function put(g, x, y, ch) {
  if (y >= 0 && y < MAP_H && x >= 0 && x < MAP_W) g[y][x] = ch;
}
function rect(g, x, y, w, h, ch) {
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) put(g, xx, yy, ch);
}
function border(g, ch) {
  for (let x = 0; x < MAP_W; x++) { put(g, x, 0, ch); put(g, x, MAP_H - 1, ch); }
  for (let y = 0; y < MAP_H; y++) { put(g, 0, y, ch); put(g, MAP_W - 1, y, ch); }
}
function house(g, x, y) {
  rect(g, x, y, 5, 2, 'R');
  rect(g, x, y + 2, 5, 1, 'H');
  put(g, x + 2, y + 2, 'D');
}

function buildAldeia() {
  const g = blank('.');
  border(g, 'T');
  put(g, 11, 0, '.'); put(g, 12, 0, '.');
  // praça central e fonte
  rect(g, 5, 6, 10, 4, 'P');
  rect(g, 8, 7, 4, 2, 'f');
  // caminhos
  rect(g, 10, 1, 2, 5, 'p');
  rect(g, 3, 5, 18, 1, 'P');
  rect(g, 10, 10, 2, 4, 'p');
  // casas
  house(g, 2, 2);
  house(g, 17, 2);
  house(g, 2, 10);
  house(g, 17, 10);
  // detalhes
  [ [1,7],[1,12],[22,7],[22,12],[8,13],[15,13],[7,1],[16,1],[9,11],[14,11] ].forEach(([x, y]) => put(g, x, y, ','));
  [ [1,4],[22,4],[1,9],[22,9] ].forEach(([x, y]) => put(g, x, y, 'T'));
  return g;
}

function buildCampos() {
  const g = blank('.');
  border(g, 'T');
  put(g, 11, 0, '.'); put(g, 12, 0, '.');
  put(g, 11, 14, '.'); put(g, 12, 14, '.');
  // rio
  for (let y = 0; y < MAP_H; y++) { put(g, 6, y, 'w'); put(g, 7, y, 'w'); }
  // caminho principal
  rect(g, 10, 1, 2, 13, 'p');
  rect(g, 2, 10, 8, 1, 'p');
  put(g, 6, 10, 'b'); put(g, 7, 10, 'b');
  put(g, 6, 11, 'w'); put(g, 7, 11, 'w');
  put(g, 6, 9, 'w'); put(g, 7, 9, 'w');
  // capim alto
  rect(g, 2, 3, 4, 4, ':');
  rect(g, 13, 3, 5, 4, ':');
  rect(g, 15, 11, 5, 2, ':');
  rect(g, 2, 12, 4, 2, ':');
  rect(g, 12, 6, 3, 2, ':');
  // árvores
  [ [2,1],[5,1],[9,2],[20,1],[21,4],[3,9],[21,8],[3,13],[21,12],[13,13],[18,6] ].forEach(([x, y]) => put(g, x, y, 'T'));
  return g;
}

function buildCapital() {
  const g = blank('P');
  border(g, 'S');
  // castelo no topo
  rect(g, 1, 0, 22, 4, 'W');
  rect(g, 0, 0, 24, 1, 'S');
  put(g, 11, 4, 'G'); put(g, 12, 4, 'G');
  put(g, 11, 3, 'G'); put(g, 12, 3, 'G');
  // praça
  rect(g, 2, 5, 20, 9, 'P');
  rect(g, 4, 9, 4, 2, 'f');
  // rua sul
  rect(g, 10, 13, 4, 2, 'P');
  put(g, 11, 14, 'P'); put(g, 12, 14, 'P');
  // detalhes
  [ [1,6],[1,10],[22,6],[22,11],[3,13],[20,13] ].forEach(([x, y]) => put(g, x, y, ','));
  [ [3,6],[20,6],[1,8],[22,8] ].forEach(([x, y]) => put(g, x, y, 'T'));
  return g;
}

function buildCastelo() {
  const g = blank('s');
  border(g, 'W');
  rect(g, 8, 1, 8, 2, 's');
  rect(g, 11, 2, 2, 12, 'c');
  // colunas
  [ [4,4],[4,8],[4,12],[7,5],[7,9],[16,5],[16,9],[19,4],[19,8],[19,12] ].forEach(([x, y]) => put(g, x, y, 'o'));
  put(g, 11, 1, 'A'); put(g, 12, 1, 'A');
  put(g, 11, 14, 's'); put(g, 12, 14, 's');
  return g;
}

function buildCalabouco() {
  const g = blank('s');
  border(g, 'W');
  // celas superiores
  rect(g, 2, 1, 6, 3, 's');
  rect(g, 9, 1, 6, 3, 's');
  rect(g, 16, 1, 6, 3, 's');
  for (let x = 2; x <= 7; x++) put(g, x, 4, '|');
  for (let x = 9; x <= 14; x++) put(g, x, 4, '|');
  for (let x = 16; x <= 21; x++) put(g, x, 4, '|');
  put(g, 4, 4, 's'); put(g, 12, 4, 's'); put(g, 18, 4, 's');
  // corredor
  rect(g, 2, 5, 20, 9, 's');
  // escada / saída
  put(g, 20, 12, 'G'); put(g, 21, 12, 'G');
  return g;
}

function buildTemplo() {
  const g = blank('#');
  rect(g, 3, 3, 18, 11, 's');
  // cantos arredondados
  put(g, 3, 3, '#'); put(g, 20, 3, '#'); put(g, 3, 13, '#'); put(g, 20, 13, '#');
  rect(g, 11, 1, 2, 2, 's');
  [ [5,4],[18,4],[5,10],[18,10] ].forEach(([x, y]) => put(g, x, y, 'o'));
  put(g, 7, 7, '*'); put(g, 16, 7, '*');
  put(g, 11, 4, 'A'); put(g, 12, 4, 'A');
  put(g, 3, 8, 'C'); put(g, 20, 8, 'C');
  put(g, 11, 14, 's'); put(g, 12, 14, 's');
  return g;
}

/* ------------------------------------------------------------------ maps */
const MAPS = {
  aldeia: {
    id: 'aldeia', name: 'Aldeia de Aurora', subtitle: 'Onde o trigo aprende o nome do vento',
    theme: 'village', music: 'village', grid: buildAldeia(),
    spawn: { x: 11, y: 13, dir: 'up' },
    warps: [
      { x: 11, y: 0, to: 'campos', tx: 11, ty: 13, dir: 'up', label: 'Campos de Solmar' },
      { x: 12, y: 0, to: 'campos', tx: 12, ty: 13, dir: 'up', label: 'Campos de Solmar' }
    ],
    npcs: [
      { id: 'liria', x: 13, y: 8, dir: 'left', look: 'liria', solid: true },
      { id: 'kael', x: 5, y: 6, dir: 'right', look: 'kael', solid: true },
      { id: 'elder', x: 16, y: 7, dir: 'down', look: 'elder', solid: true },
      { id: 'child', x: 8, y: 11, dir: 'up', look: 'child', solid: true },
      { id: 'merchant', x: 16, y: 11, dir: 'down', look: 'merchant', solid: true }
    ],
    objects: [
      { id: 'flower_pot', type: 'sign', x: 14, y: 6, line: '“Bem-vindo a Aurora. Deixe suas mágoas no portão.”' },
      { id: 'chest_vila', type: 'chest', x: 22, y: 13, loot: { item: 'pocao', n: 2 } }
    ],
    decor: [
      { type: 'lantern', x: 7.2, y: 5.3 }, { type: 'lantern', x: 16.8, y: 5.3 },
      { type: 'lantern', x: 7.2, y: 9.6 }, { type: 'lantern', x: 16.8, y: 9.6 },
      { type: 'signpost', x: 10.7, y: 1.4 }
    ],
    lights: [ [8.0, 8.0, 120], [12.0, 8.0, 110], [7.4, 5.4, 80], [17.0, 5.4, 80], [11.9, 1.2, 70] ]
  },

  campos: {
    id: 'campos', name: 'Campos de Solmar', subtitle: 'O rio guarda o que o vento esquece',
    theme: 'fields', music: 'fields', grid: buildCampos(),
    spawn: { x: 11, y: 13, dir: 'up' },
    warps: [
      { x: 11, y: 14, to: 'aldeia', tx: 11, ty: 1, dir: 'down', label: 'Aldeia de Aurora' },
      { x: 12, y: 14, to: 'aldeia', tx: 12, ty: 1, dir: 'down', label: 'Aldeia de Aurora' },
      { x: 11, y: 0, to: 'capital', tx: 11, ty: 13, dir: 'up', label: 'Capital de Valdoria' },
      { x: 12, y: 0, to: 'capital', tx: 12, ty: 13, dir: 'up', label: 'Capital de Valdoria' }
    ],
    npcs: [],
    objects: [
      { id: 'flower_aurora', type: 'flower', x: 2, y: 8, when: s => !s.flags.hasFlower && !s.flags.gaveFlower },
      { id: 'chest_campos', type: 'chest', x: 21, y: 12, loot: { item: 'eter', n: 1 } },
      { id: 'bridge_sign', type: 'sign', x: 9, y: 11, line: '“Ponte do Solmar — Cuidado com os lobos ao norte do rio.”' }
    ],
    decor: [ { type: 'lantern', x: 10.4, y: 10.4 }, { type: 'signpost', x: 9.6, y: 11.4 } ],
    lights: [ [2.6, 8.4, 95], [10.4, 10.4, 60] ]
  },

  capital: {
    id: 'capital', name: 'Capital de Valdoria', subtitle: 'Onde todas as coroas pesam',
    theme: 'capital', music: 'capital', grid: buildCapital(),
    spawn: { x: 11, y: 13, dir: 'up' },
    warps: [
      { x: 11, y: 14, to: 'campos', tx: 11, ty: 1, dir: 'down', label: 'Campos de Solmar' },
      { x: 12, y: 14, to: 'campos', tx: 12, ty: 1, dir: 'down', label: 'Campos de Solmar' },
      { x: 11, y: 3, to: 'castelo', tx: 11, ty: 13, dir: 'up', label: 'Salão do Trono' },
      { x: 12, y: 3, to: 'castelo', tx: 12, ty: 13, dir: 'up', label: 'Salão do Trono' }
    ],
    npcs: [
      { id: 'liria_cap', x: 10, y: 12, dir: 'down', look: 'liria', solid: true, when: s => !s.flags.betrayed },
      { id: 'kael_cap', x: 15, y: 11, dir: 'left', look: 'kael', solid: true, when: s => !s.flags.betrayed },
      { id: 'merchant_cap', x: 6, y: 10, dir: 'right', look: 'merchant', solid: true, when: s => !s.flags.betrayed },
      { id: 'noble', x: 17, y: 9, dir: 'left', look: 'noble', solid: true, when: s => !s.flags.betrayed },
      { id: 'liria_ruins', x: 13, y: 12, dir: 'left', look: 'liria_ruins', solid: true, when: s => !!s.flags.darkCapital }
    ],
    objects: [
      { id: 'capital_sign', type: 'sign', x: 13, y: 13, line: '“Valdoria — sob a luz da Aurora, uma coroa, um povo, um juramento.”' },
      { id: 'chest_capital', type: 'chest', x: 2, y: 6, loot: { item: 'pocaoMaior', n: 1 } }
    ],
    decor: [
      { type: 'banner', x: 4, y: 5 }, { type: 'banner', x: 19, y: 5 },
      { type: 'lantern', x: 8.5, y: 7.4 }, { type: 'lantern', x: 15.5, y: 7.4 },
      { type: 'stall', x: 17, y: 7 }, { type: 'stall', x: 3, y: 8 },
      { type: 'fire', x: 5.5, y: 7.5, when: s => !!s.flags.darkCapital },
      { type: 'fire', x: 18.5, y: 10.5, when: s => !!s.flags.darkCapital },
      { type: 'rubble', x: 8, y: 6, when: s => !!s.flags.darkCapital }
    ],
    lights: [ [11.5, 4.0, 200], [5.8, 9.6, 90], [18.4, 7.0, 80] ]
  },

  castelo: {
    id: 'castelo', name: 'Salão do Trono', subtitle: 'O coração de Valdoria',
    theme: 'castle', music: 'castle', grid: buildCastelo(),
    spawn: { x: 11, y: 13, dir: 'up' },
    warps: [
      { x: 11, y: 14, to: 'capital', tx: 11, ty: 5, dir: 'down', label: 'Capital de Valdoria' },
      { x: 12, y: 14, to: 'capital', tx: 12, ty: 5, dir: 'down', label: 'Capital de Valdoria' }
    ],
    npcs: [
      { id: 'king', x: 11, y: 2, dir: 'down', look: 'king', solid: true, when: s => !s.flags.betrayed },
      { id: 'liria_hall', x: 14, y: 10, dir: 'up', look: 'liria', solid: true, when: s => !s.flags.betrayed },
      { id: 'kael_hall', x: 9, y: 9, dir: 'right', look: 'kael', solid: true, when: s => !s.flags.betrayed },
      { id: 'noble_a', x: 6, y: 8, dir: 'right', look: 'noble', solid: true, when: s => !s.flags.betrayed },
      { id: 'noble_b', x: 17, y: 8, dir: 'left', look: 'noble2', solid: true, when: s => !s.flags.betrayed },
      { id: 'guard_hall', x: 7, y: 12, dir: 'down', look: 'guard', solid: true, when: s => !s.flags.betrayed },
      { id: 'kael_final', x: 11, y: 4, dir: 'down', look: 'kael', solid: true, when: s => !!s.flags.darkCapital && !s.flags.kaelDefeated },
      { id: 'liria_final', x: 13, y: 10, dir: 'up', look: 'liria_ruins', solid: false, when: s => !!s.flags.darkCapital }
    ],
    objects: [],
    decor: [
      { type: 'banner', x: 3, y: 2 }, { type: 'banner', x: 20, y: 2 },
      { type: 'window', x: 2, y: 6 }, { type: 'window', x: 21, y: 6 },
      { type: 'window', x: 2, y: 10 }, { type: 'window', x: 21, y: 10 },
      { type: 'candle', x: 11, y: 3 }, { type: 'candle', x: 12, y: 3 },
      { type: 'rubble', x: 6, y: 13, when: s => !!s.flags.darkCapital },
      { type: 'fire', x: 4.5, y: 11, when: s => !!s.flags.darkCapital }
    ],
    lights: [ [11.5, 2.4, 180], [11.5, 7.5, 150], [11.5, 12.5, 120], [3.2, 6.0, 90], [20.8, 6.0, 90] ]
  },

  calabouco: {
    id: 'calabouco', name: 'O Abismo', subtitle: 'Onde o reino guarda o que prefere esquecer',
    theme: 'prison', music: 'prison', grid: buildCalabouco(),
    spawn: { x: 4, y: 2, dir: 'down' },
    warps: [],
    npcs: [
      { id: 'brann_cell', x: 12, y: 2, dir: 'down', look: 'brann', solid: true, when: s => !s.flags.escapedCell },
      { id: 'brann_free', x: 6, y: 7, dir: 'right', look: 'brann', solid: true, when: s => s.flags.escapedCell && !s.flags.brannJoined },
      { id: 'guard_a', x: 8, y: 7, dir: 'left', look: 'guard', solid: true, when: s => !s.flags.guardsDefeated },
      { id: 'guard_b', x: 15, y: 11, dir: 'up', look: 'guard2', solid: true, when: s => !s.flags.guardsDefeated },
      { id: 'warden', x: 19, y: 10, dir: 'left', look: 'warden', solid: true, when: s => s.flags.brannJoined && !s.flags.wardenDefeated }
    ],
    objects: [
      { id: 'chest_sword', type: 'story', x: 18, y: 9, label: 'Espada do seu pai', when: s => !s.flags.hasSwordParsed }
    ],
    decor: [
      { type: 'torch', x: 3, y: 6 }, { type: 'torch', x: 8, y: 6 }, { type: 'torch', x: 15, y: 6 },
      { type: 'torch', x: 21, y: 8 }, { type: 'torch', x: 3, y: 12 }, { type: 'torch', x: 12, y: 12 },
      { type: 'chains', x: 4, y: 2 }, { type: 'chains', x: 12, y: 2 }, { type: 'chains', x: 19, y: 2 },
      { type: 'crates', x: 9, y: 12 }, { type: 'crates', x: 17, y: 12 },
      { type: 'stairs', x: 20, y: 12 }
    ],
    lights: [ [3.5, 6.5, 95], [8.5, 6.5, 95], [15.5, 6.5, 95], [21.5, 8.5, 80], [3.5, 12.5, 80], [12.5, 12.5, 80], [20.5, 12.5, 100] ]
  },

  templo: {
    id: 'templo', name: 'Templo da Aurora', subtitle: 'O que o tempo não conseguiu esquecer',
    theme: 'temple', music: 'temple', grid: buildTemplo(),
    spawn: { x: 11, y: 13, dir: 'up' },
    warps: [],
    npcs: [
      { id: 'brann_temple', x: 9, y: 11, dir: 'right', look: 'brann', solid: true, when: s => !s.flags.hasBlade }
    ],
    objects: [],
    decor: [
      { type: 'candle', x: 11, y: 5 }, { type: 'candle', x: 12, y: 5 },
      { type: 'runeGlow', x: 7, y: 7 }, { type: 'runeGlow', x: 16, y: 7 }
    ],
    lights: [ [7.5, 7.5, 120], [16.5, 7.5, 120], [11.5, 4.5, 170], [11.5, 12.5, 100] ]
  }
};

/* ---------------------------------------------------------------- heroes */
const HEROES = {
  rowan: {
    id: 'rowan', name: 'Rowan', title: 'O Herói de Aurora', look: 'rowan',
    base: { hp: 68, mp: 24, atk: 12, def: 7, mag: 9, spd: 9 },
    growth: { hp: 14, mp: 5, atk: 3, def: 2, mag: 3, spd: 1 },
    skills: [
      { lvl: 1, id: 'golpeFirme' },
      { lvl: 2, id: 'chamaAurora' },
      { lvl: 4, id: 'bencaoAurora' },
      { lvl: 6, id: 'gritoHeroi' },
      { lvl: 8, id: 'julgamento' }
    ],
    color: '#9fd0ff'
  },
  brann: {
    id: 'brann', name: 'Brann', title: 'O Velho Capitão', look: 'brann',
    base: { hp: 98, mp: 18, atk: 14, def: 11, mag: 5, spd: 6 },
    growth: { hp: 17, mp: 3, atk: 3, def: 3, mag: 1, spd: 1 },
    skills: [
      { lvl: 1, id: 'investida' },
      { lvl: 1, id: 'muralha' },
      { lvl: 4, id: 'curaCampo' },
      { lvl: 7, id: 'golpeCapitao' }
    ],
    color: '#d8c9a2'
  }
};

/* ---------------------------------------------------------------- skills */
const SKILLS = {
  golpeFirme: {
    name: 'Golpe Firme', cost: 6, type: 'phys', target: 'enemy', mult: 1.95, fx: 'slash',
    desc: 'Um corte direto e honesto. Dano pesado em um inimigo.'
  },
  chamaAurora: {
    name: 'Chama da Aurora', cost: 12, type: 'mag', target: 'allEnemies', mult: 1.28, fx: 'fire',
    desc: 'Chamas douradas atingem todos os inimigos.'
  },
  bencaoAurora: {
    name: 'Bênção da Aurora', cost: 14, type: 'heal', target: 'ally', heal: 0.46, fx: 'heal',
    desc: 'Restaura 46% do HP de um aliado.'
  },
  gritoHeroi: {
    name: 'Grito do Herói', cost: 10, type: 'buffAtk', target: 'party', turns: 3, fx: 'buff',
    desc: 'Aumenta o ataque do grupo por 3 turnos.'
  },
  julgamento: {
    name: 'Julgamento', cost: 22, type: 'phys', target: 'enemy', mult: 3.0, fx: 'holy',
    desc: 'A lâmina da Aurora desce como um veredito.'
  },
  investida: {
    name: 'Investida', cost: 7, type: 'phys', target: 'enemy', mult: 1.7, fx: 'slash',
    desc: 'Um avanço brutal com o peso da armadura.'
  },
  muralha: {
    name: 'Muralha', cost: 12, type: 'buffDef', target: 'party', turns: 3, fx: 'buff',
    desc: 'Aumenta a defesa do grupo por 3 turnos.'
  },
  curaCampo: {
    name: 'Cura de Campo', cost: 12, type: 'heal', target: 'ally', heal: 0.36, fx: 'heal',
    desc: 'Curativos de campanha. Restaura 36% do HP.'
  },
  golpeCapitao: {
    name: 'Golpe do Capitão', cost: 20, type: 'phys', target: 'enemy', mult: 2.6, fx: 'slash',
    desc: 'A técnica que manteve a Guarda Real de pé por 30 anos.'
  }
};

/* ----------------------------------------------------------------- items */
const ITEMS = {
  pocao:      { name: 'Poção',        desc: 'Restaura 50 de HP.',        heal: 50,  price: 15, color: '#e08a8a' },
  pocaoMaior: { name: 'Poção Maior',  desc: 'Restaura 120 de HP.',       heal: 120, price: 40, color: '#f0a0a0' },
  eter:       { name: 'Éter',         desc: 'Restaura 18 de MP.',        mp: 18,    price: 30, color: '#8ab8e8' },
  elixir:     { name: 'Elixir',       desc: 'Restaura HP e MP por completo.', full: true, price: 100, color: '#f0d890' }
};

/* --------------------------------------------------------------- enemies */
const ENEMIES = {
  lobo: {
    name: 'Lobo Sombrio', kind: 'wolf', hp: 36, mp: 0, atk: 9, def: 3, mag: 2, spd: 9,
    xp: 15, gold: 7, size: 1, color: '#8f9ec0',
    skills: [
      { name: 'Mordida', type: 'phys', mult: 1.0, weight: 5, line: 'avança com os dentes à mostra' },
      { name: 'Uivo', type: 'buffAtk', weight: 1, line: 'uiva para a lua', buff: 0.25, turns: 3 }
    ],
    intro: 'Um rosnado rasga o silêncio.'
  },
  salteador: {
    name: 'Salteador', kind: 'bandit', hp: 56, mp: 0, atk: 12, def: 5, mag: 3, spd: 8,
    xp: 24, gold: 16, size: 1.04, color: '#b08a6a',
    skills: [
      { name: 'Facada', type: 'phys', mult: 1.15, weight: 5, line: 'ataca com a adaga' },
      { name: 'Areia nos olhos', type: 'debuffAtk', weight: 1, line: 'joga areia nos seus olhos', debuff: 0.2, turns: 2 }
    ],
    intro: '“Bolsa ou vida, herói.”'
  },
  guarda: {
    name: 'Guarda do Abismo', kind: 'guard', hp: 66, mp: 0, atk: 14, def: 7, mag: 4, spd: 7,
    xp: 32, gold: 13, size: 1.06, color: '#8593a8',
    skills: [
      { name: 'Estocada', type: 'phys', mult: 1.2, weight: 5, line: 'golpeia com a lança' },
      { name: 'Formação', type: 'buffDef', weight: 1, line: 'ergue o escudo', buff: 0.25, turns: 3 }
    ],
    intro: '“Pare aí, prisioneiro!”'
  },
  capataz: {
    name: 'Gorran, o Carcereiro', kind: 'warden', hp: 305, mp: 20, atk: 25, def: 10, mag: 8, spd: 6,
    xp: 120, gold: 85, size: 1.55, boss: true, color: '#c08a72',
    skills: [
      { name: 'Marreta', type: 'phys', mult: 1.35, weight: 4, line: 'desce a marreta' },
      { name: 'Terror', type: 'debuffAtk', weight: 1, line: 'ruge como uma fera', debuff: 0.25, turns: 2 },
      { name: 'Investida Pesada', type: 'phys', mult: 0.95, target: 'allEnemies', weight: 2, line: 'atravessa o corredor' }
    ],
    intro: '“Kael pagou bem para você apodrecer aqui, sabia?”'
  },
  eco: {
    name: 'Eco da Traição', kind: 'echo', hp: 270, mp: 30, atk: 27, def: 9, mag: 20, spd: 10,
    xp: 155, gold: 0, size: 1.32, boss: true, color: '#7fc8d8',
    skills: [
      { name: 'Lâmina Quebrada', type: 'phys', mult: 1.15, weight: 4, line: 'corta o ar com uma lembrança' },
      { name: 'Lamento', type: 'mag', mult: 1.2, target: 'allEnemies', weight: 2, line: 'sussurra tudo o que você perdeu' },
      { name: 'Abraço Vazio', type: 'drain', mult: 1.0, weight: 2, line: 'tenta roubar sua esperança' }
    ],
    intro: '“Você me amou, Rowan. E eu te vendi.”'
  },
  guardiao: {
    name: 'Guardião de Pedra', kind: 'guardian', hp: 430, mp: 0, atk: 34, def: 16, mag: 6, spd: 4,
    xp: 225, gold: 0, size: 1.75, boss: true, color: '#b0a58a',
    skills: [
      { name: 'Punho de Pedra', type: 'phys', mult: 1.5, weight: 4, line: 'desce um punho do tamanho de um escudo' },
      { name: 'Terremoto', type: 'phys', mult: 0.9, target: 'allEnemies', weight: 2, line: 'faz o templo tremer' },
      { name: 'Pele de Granito', type: 'buffDef', weight: 1, line: 'endurece a pele', buff: 0.3, turns: 3 }
    ],
    intro: '“PROVE QUE SUA CHAMA NÃO É SÓ RAIVA.”'
  },
  kael: {
    name: 'Kael, o Usurpador', kind: 'kael', hp: 380, mp: 40, atk: 30, def: 13, mag: 20, spd: 10,
    xp: 320, gold: 150, size: 1.42, boss: true, color: '#e0b866',
    skills: [
      { name: 'Lâmina Dourada', type: 'phys', mult: 1.3, weight: 4, line: 'corta com a espada do reino' },
      { name: 'Desprezo', type: 'debuffAtk', weight: 1, line: 'ri da sua inocência', debuff: 0.25, turns: 2 },
      { name: 'Golpe do Traidor', type: 'phys', mult: 2.0, weight: 2, line: 'ataca pelas costas, como sempre fez' }
    ],
    intro: '“Deveria ter ficado no buraco, Rowan.”'
  },
  arauto: {
    name: 'Arauto do Vazio', kind: 'herald', hp: 500, mp: 60, atk: 39, def: 17, mag: 30, spd: 9,
    xp: 500, gold: 250, size: 1.9, boss: true, color: '#b48ae0',
    skills: [
      { name: 'Onda do Vazio', type: 'mag', mult: 1.15, target: 'allEnemies', weight: 3, line: 'abre uma ferida no ar' },
      { name: 'Devorar Luz', type: 'drain', mult: 1.25, weight: 3, line: 'bebe a luz ao seu redor' },
      { name: 'Grito do Abismo', type: 'buffAtk', weight: 1, line: 'grita com mil vozes', buff: 0.3, turns: 3 }
    ],
    intro: '“SE EU NÃO POSSO TER O REINO... NINGUÉM TERÁ!”'
  }
};

/* --------------------------------------------------------------- helpers */
const LOOKS = {
  rowan:        { skin: '#d9a273', hair: '#3a2a24', style: 'hero', top: '#2f4d80', pants: '#2a2f45', accent: '#b94b4b', scarf: '#b94b4b' },
  rowanHero:    { skin: '#d9a273', hair: '#3a2a24', style: 'hero', top: '#34578f', pants: '#29324d', accent: '#e0bd72', scarf: '#c05050', cape: '#1b3563', weapon: 'sword', pauldron: true },
  liria:        { skin: '#f1c9a4', hair: '#8c3f30', style: 'long', top: '#8f6fb3', pants: '#6b5189', accent: '#f0c8a0', dress: true, flower: true },
  liria_ruins:  { skin: '#e8c2a0', hair: '#7d382b', style: 'long', top: '#6d557f', pants: '#493a5a', accent: '#c9b28a', dress: true, tired: true },
  kael:         { skin: '#e2b382', hair: '#c9a458', style: 'short', top: '#8c2f38', pants: '#3a2430', accent: '#e0bd72', cape: '#6e2029', weapon: 'sword', pauldron: true },
  brann:        { skin: '#c69a76', hair: '#b9b4aa', style: 'beard', top: '#5b6472', pants: '#3c424e', accent: '#8b8f96', armor: true, cape: '#333b48' },
  elder:        { skin: '#d2ae8a', hair: '#e2ddd0', style: 'beard', top: '#5b4d72', pants: '#433a54', accent: '#c4a96a', robe: true },
  child:        { skin: '#e8bd95', hair: '#6b4a32', style: 'short', top: '#7ba06b', pants: '#4b5c42', accent: '#e8d090', small: true },
  merchant:     { skin: '#d2a17c', hair: '#4a3528', style: 'short', top: '#8a6746', pants: '#4f3c2c', accent: '#e0c080', apron: true },
  noble:        { skin: '#e8c4a2', hair: '#5a4030', style: 'short', top: '#465a86', pants: '#2f3b57', accent: '#d8b56a', dress: true },
  noble2:       { skin: '#d6ac88', hair: '#3c2b22', style: 'short', top: '#6a4a58', pants: '#3a2b34', accent: '#c9a0b0', robe: true },
  bandit:       { skin: '#c49a76', hair: '#3a2a22', style: 'hood', top: '#4f4234', pants: '#33291f', accent: '#8a6a48', hood: '#3a2e26' },
  guard:        { skin: '#cfa280', hair: '#3a3028', style: 'helmet', top: '#606b7c', pants: '#3c4552', accent: '#a8b0ba', armor: true, spear: true },
  guard2:       { skin: '#b98f70', hair: '#2b241e', style: 'helmet', top: '#535e70', pants: '#343d49', accent: '#98a0aa', armor: true, spear: true },
  king:         { skin: '#d8b593', hair: '#e6e0d2', style: 'beard', top: '#5a3e78', pants: '#3d2c52', accent: '#e0bd72', robe: true, crown: true },
  warden:       { skin: '#b9866e', hair: '#3a2b26', style: 'bald', top: '#4e3a34', pants: '#332620', accent: '#8c5e4c', armor: true, big: true }
};

function xpNeeded(level) { return 40 + (level - 1) * 34; }
function fmtTime(sec) {
  const s = Math.max(0, Math.floor(sec));
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}
