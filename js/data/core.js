// data/core.js — characters, skills, items, enemies, balance

export const ELEMENTS = {
  none: { name: 'Físico', color: '#e8e0cc' },
  fire: { name: 'Fogo', color: '#ff8a4a' },
  ice: { name: 'Gelo', color: '#8ad8ff' },
  holy: { name: 'Sagrado', color: '#ffe6a0' },
  dark: { name: 'Sombra', color: '#b795e8' },
};

export const SKILLS = {
  // Kael
  golpe: { name: 'Golpe Poderoso', cost: 6, target: 'enemy', kind: 'phys', power: 1.85, element: 'none',
    desc: 'Um corte brutal que rasga armaduras.', fx: 'slash', sfx: 'hit' },
  grito: { name: 'Grito de Guerra', cost: 8, target: 'allAllies', kind: 'buff', buff: { stat: 'atk', mult: 1.3, turns: 3 },
    desc: 'Aumenta o ATQ de todos os aliados por 3 turnos.', fx: 'buff', sfx: 'buff' },
  investida: { name: 'Investida', cost: 9, target: 'enemy', kind: 'phys', power: 1.4, element: 'none',
    status: { id: 'stun', chance: 0.32, turns: 1 }, desc: 'Avança como um touro. Pode atordoar.', fx: 'slash', sfx: 'hit' },
  lamina: { name: 'Lâmina da Aurora', cost: 14, target: 'enemy', kind: 'phys', power: 2.15, element: 'holy',
    healSelf: 0.18, desc: 'Corte banhado em luz sagrada. Recupera parte do dano como HP.', fx: 'holy', sfx: 'holy' },
  aurora: { name: 'Julgamento da Aurora', cost: 26, target: 'allEnemies', kind: 'phys', power: 1.45, element: 'holy',
    desc: 'Uma onda de luz pura atinge todos os inimigos.', fx: 'holyAll', sfx: 'holy' },

  // Mira
  fogo: { name: 'Bola de Fogo', cost: 8, target: 'enemy', kind: 'mag', power: 1.75, element: 'fire',
    status: { id: 'burn', chance: 0.3, turns: 3 }, desc: 'Lança uma esfera flamejante. Pode queimar.', fx: 'fire', sfx: 'fire' },
  gelo: { name: 'Lança de Gelo', cost: 8, target: 'enemy', kind: 'mag', power: 1.6, element: 'ice',
    status: { id: 'stun', chance: 0.22, turns: 1 }, desc: 'Uma agulha glacial. Pode congelar o alvo.', fx: 'ice', sfx: 'ice' },
  cura: { name: 'Cura', cost: 7, target: 'ally', kind: 'heal', heal: 55, healMag: 2.2,
    desc: 'Restaura HP de um aliado.', fx: 'heal', sfx: 'heal' },
  barreira: { name: 'Barreira Arcana', cost: 10, target: 'allAllies', kind: 'buff', buff: { stat: 'def', mult: 1.4, turns: 3 },
    desc: 'Aumenta a DEF de todos os aliados por 3 turnos.', fx: 'shield', sfx: 'buff' },
  tempestade: { name: 'Tempestade Glacial', cost: 20, target: 'allEnemies', kind: 'mag', power: 1.35, element: 'ice',
    desc: 'Uma tempestade de gelo atinge todos os inimigos.', fx: 'iceAll', sfx: 'ice' },

  // Garrick
  muralha: { name: 'Muralha de Aço', cost: 8, target: 'allAllies', kind: 'buff', buff: { stat: 'def', mult: 1.5, turns: 3 },
    desc: 'Ergue a guarda. DEF de todos os aliados aumenta.', fx: 'shield', sfx: 'buff' },
  sismico: { name: 'Golpe Sísmico', cost: 14, target: 'allEnemies', kind: 'phys', power: 1.2, element: 'none',
    desc: 'Racha o chão sob todos os inimigos.', fx: 'quake', sfx: 'hit' },
  brado: { name: 'Brado do Guardião', cost: 8, target: 'allAllies', kind: 'buff', buff: { stat: 'atk', mult: 1.35, turns: 3 },
    desc: 'Um brado que inflama o ATQ dos aliados.', fx: 'buff', sfx: 'buff' },
  juramento: { name: 'Juramento de Ferro', cost: 12, target: 'self', kind: 'buff', buff: { stat: 'def', mult: 1.6, turns: 4 },
    regen: 0.12, desc: 'Garrick se protege e regenera HP por 4 turnos.', fx: 'shield', sfx: 'buff' },

  // Lyra
  cura_maior: { name: 'Cura Maior', cost: 12, target: 'ally', kind: 'heal', heal: 100, healMag: 2.6,
    desc: 'Uma prece que restaura muito HP.', fx: 'heal', sfx: 'heal' },
  bencao: { name: 'Bênção da Aurora', cost: 24, target: 'deadAlly', kind: 'revive', revive: 0.5,
    desc: 'Traz um aliado caído de volta com metade do HP.', fx: 'holy', sfx: 'holy' },
  luz: { name: 'Luz Purificadora', cost: 10, target: 'enemy', kind: 'mag', power: 1.9, element: 'holy',
    desc: 'Uma lança de luz sagrada.', fx: 'holy', sfx: 'holy' },
  prece: { name: 'Prece de Cura', cost: 14, target: 'allAllies', kind: 'buff', buff: { stat: 'regen', mult: 1, turns: 3 },
    desc: 'Todos os aliados regeneram HP por 3 turnos.', fx: 'heal', sfx: 'heal' },
  alvorada: { name: 'Alvorada', cost: 28, target: 'allAllies', kind: 'healAll', heal: 85, healMag: 1.7, cleanse: true,
    desc: 'Luz do amanhecer cura e purifica todos os aliados.', fx: 'holyAll', sfx: 'holy' },

  // Enemies
  mordida: { name: 'Mordida', cost: 0, target: 'enemy', kind: 'phys', power: 1.15, element: 'none', fx: 'slash', sfx: 'hit' },
  uivo: { name: 'Uivo Sanguinário', cost: 0, target: 'allAllies', kind: 'buff', buff: { stat: 'atk', mult: 1.25, turns: 3 }, fx: 'buff', sfx: 'buff' },
  presa_gelada: { name: 'Presa Congelante', cost: 0, target: 'enemy', kind: 'phys', power: 1.3, element: 'ice', status: { id: 'stun', chance: 0.25, turns: 1 }, fx: 'ice', sfx: 'ice' },
  rocha_punho: { name: 'Punho de Rocha', cost: 0, target: 'enemy', kind: 'phys', power: 1.35, element: 'none', fx: 'quake', sfx: 'hit' },
  terremoto: { name: 'Terremoto', cost: 0, target: 'allEnemies', kind: 'phys', power: 0.95, element: 'none', fx: 'quake', sfx: 'hit' },
  lanca: { name: 'Estocada', cost: 0, target: 'enemy', kind: 'phys', power: 1.15, element: 'none', status: { id: 'stun', chance: 0.18, turns: 1 }, fx: 'slash', sfx: 'hit' },
  clavao: { name: 'Clavão', cost: 0, target: 'enemy', kind: 'phys', power: 1.55, element: 'none', fx: 'slash', sfx: 'crit' },
  brasa: { name: 'Sopro de Brasa', cost: 0, target: 'allEnemies', kind: 'mag', power: 1.25, element: 'fire', status: { id: 'burn', chance: 0.35, turns: 3 }, fx: 'fireAll', sfx: 'fire' },
  golpe_sombrio: { name: 'Golpe Sombrio', cost: 0, target: 'enemy', kind: 'phys', power: 1.45, element: 'dark', drain: 0.3, fx: 'dark', sfx: 'dark' },
  lamento: { name: 'Lamento', cost: 0, target: 'allEnemies', kind: 'debuff', buff: { stat: 'atk', mult: 0.72, turns: 3 }, fx: 'debuff', sfx: 'debuff' },
  brasa_vento: { name: 'Vendaval de Brasas', cost: 0, target: 'allEnemies', kind: 'mag', power: 1.45, element: 'fire', status: { id: 'burn', chance: 0.4, turns: 3 }, fx: 'fireAll', sfx: 'fire' },
  rend: { name: 'Rasgo da Alma', cost: 0, target: 'enemy', kind: 'phys', power: 1.75, element: 'dark', fx: 'dark', sfx: 'dark' },
  regen_brasas: { name: 'Chamas Restauradoras', cost: 0, target: 'self', kind: 'heal', heal: 110, fx: 'fire', sfx: 'fire' },
  sentinela_quake: { name: 'Ira de Pedra', cost: 0, target: 'allEnemies', kind: 'phys', power: 1.1, element: 'none', fx: 'quake', sfx: 'hit' },
  golpe_arauto: { name: 'Garra do Arauto', cost: 0, target: 'enemy', kind: 'phys', power: 1.6, element: 'dark', drain: 0.2, fx: 'dark', sfx: 'dark' },
  inferno: { name: 'Inferno', cost: 0, target: 'allEnemies', kind: 'mag', power: 1.55, element: 'fire', status: { id: 'burn', chance: 0.5, turns: 3 }, fx: 'fireAll', sfx: 'fire' },
};

export const CHARACTERS = {
  kael: {
    name: 'Kael', role: 'Espadachim da Aurora', sprite: 'kael', accent: '#e7c77b',
    base: { hp: 120, mp: 24, atk: 16, def: 11, mag: 5, res: 7, spd: 10, lck: 6 },
    growth: { hp: 15, mp: 3, atk: 2.5, def: 1.5, mag: 0.4, res: 0.8, spd: 0.8, lck: 0.4 },
    skills: [['golpe', 1], ['grito', 3], ['investida', 5], ['lamina', 8], ['aurora', 12]],
    bio: 'Um lenhador de Brumalva que perdeu tudo — e decidiu não perder a si mesmo.',
  },
  mira: {
    name: 'Mira', role: 'Maga Errante', sprite: 'mira', accent: '#b795e8',
    base: { hp: 95, mp: 70, atk: 8, def: 8, mag: 24, res: 14, spd: 13, lck: 8 },
    growth: { hp: 8, mp: 5, atk: 0.5, def: 0.8, mag: 2.4, res: 1.2, spd: 0.8, lck: 0.5 },
    skills: [['fogo', 1], ['gelo', 1], ['cura', 1], ['barreira', 6], ['tempestade', 11]],
    bio: 'Sobrevivente da purga de magos. Esconde a dor atrás de piadas afiadas.',
  },
  garrick: {
    name: 'Garrick', role: 'Cavaleiro Caído', sprite: 'garrick', accent: '#a8c4e0',
    base: { hp: 200, mp: 30, atk: 24, def: 20, mag: 4, res: 10, spd: 7, lck: 4 },
    growth: { hp: 18, mp: 2, atk: 1.8, def: 1.8, mag: 0.2, res: 0.8, spd: 0.4, lck: 0.2 },
    skills: [['muralha', 1], ['brado', 1], ['sismico', 3], ['juramento', 6]],
    bio: 'O último cavaleiro da Velha Guarda. Encontrou um aluno no fundo do abismo.',
  },
  lyra: {
    name: 'Lyra', role: 'Sacerdotisa da Aurora', sprite: 'lyra', accent: '#bfe3a8',
    base: { hp: 130, mp: 65, atk: 10, def: 10, mag: 20, res: 16, spd: 11, lck: 9 },
    growth: { hp: 11, mp: 4, atk: 0.7, def: 1, mag: 2, res: 1.4, spd: 0.7, lck: 0.5 },
    skills: [['cura_maior', 1], ['luz', 1], ['bencao', 3], ['prece', 7], ['alvorada', 12]],
    bio: 'A voz que se calou por medo. Agora ela quer aprender a cantar de novo.',
  },
};

export const ITEMS = {
  potion: { name: 'Poção', icon: '♥', desc: 'Restaura 70 de HP de um aliado.', price: 30, target: 'ally', heal: 70 },
  potion2: { name: 'Poção Maior', icon: '♥', desc: 'Restaura 200 de HP de um aliado.', price: 90, target: 'ally', heal: 200 },
  ether: { name: 'Éter', icon: '✦', desc: 'Restaura 35 de MP de um aliado.', price: 60, target: 'ally', mp: 35 },
  antidote: { name: 'Antídoto', icon: '✚', desc: 'Cura queimadura e veneno.', price: 20, target: 'ally', cure: ['poison', 'burn'] },
  elixir: { name: 'Elixir', icon: '◈', desc: 'Restaura todo o HP e MP de um aliado.', price: 300, target: 'ally', full: true },
  bomb: { name: 'Bomba', icon: '✹', desc: 'Causa 55 de dano a todos os inimigos.', price: 80, target: 'allEnemies', damage: 55 },
  smoke: { name: 'Bomba de Fumaça', icon: '☁', desc: 'Fuga garantida de batalhas comuns.', price: 50, target: 'self', flee: true },
  locket: { name: 'Medalhão de Prata', icon: '◉', desc: 'O presente que Kael fez a Lyra. Ainda guarda o calor dela.', key: true },
  ember: { name: 'Brasa Eterna', icon: '✧', desc: 'O coração flamejante de Valdoria. Sussurra com uma voz que não é sua.', key: true },
  aurora: { name: 'Lâmina Aurora', icon: '†', desc: 'A espada de Garrick, banhada pela primeira luz do amanhecer.', key: true },
  cellkey: { name: 'Chave da Cela', icon: '⚿', desc: 'Ferro enferrujado. Abre o que o abismo trancou.', key: true },
};

export const ENEMIES = {
  wolf: { name: 'Lobo Cinzento', sprite: 'wolf', hp: 55, mp: 0, atk: 12, def: 6, mag: 3, res: 4, spd: 11, lck: 4,
    xp: 22, gold: 10, weak: ['fire'], resist: [], skills: ['mordida'], scale: 4.6, size: 0.78, accent: '#9a9aa8' },
  bandit: { name: 'Saqueador', sprite: 'bandit', hp: 85, mp: 0, atk: 15, def: 8, mag: 4, res: 5, spd: 10, lck: 5,
    xp: 34, gold: 18, weak: ['ice'], resist: [], skills: ['mordida', 'clavao'], scale: 4.2, size: 1, accent: '#c05a4a' },
  guard: { name: 'Guarda Real', sprite: 'guard', hp: 105, mp: 0, atk: 18, def: 13, mag: 5, res: 7, spd: 9, lck: 4,
    xp: 44, gold: 22, weak: ['ice'], resist: [], skills: ['lanca'], scale: 4.3, size: 1, accent: '#a8b0bc' },
  hound: { name: 'Cão das Sombras', sprite: 'hound', hp: 80, mp: 0, atk: 19, def: 7, mag: 4, res: 5, spd: 16, lck: 6,
    xp: 42, gold: 16, weak: ['holy'], resist: ['dark'], skills: ['mordida'], scale: 4.4, size: 0.76, accent: '#a06a7a' },
  icewolf: { name: 'Lobo Glacial', sprite: 'icewolf', hp: 150, mp: 0, atk: 24, def: 13, mag: 10, res: 12, spd: 14, lck: 5,
    xp: 72, gold: 32, weak: ['fire'], resist: ['ice'], skills: ['presa_gelada', 'mordida'], scale: 4.8, size: 0.9, accent: '#a8d8f0' },
  golem: { name: 'Golem de Rocha', sprite: 'golem', hp: 260, mp: 0, atk: 27, def: 26, mag: 6, res: 14, spd: 6, lck: 3,
    xp: 105, gold: 50, weak: ['ice'], resist: ['none'], skills: ['rocha_punho', 'terremoto'], scale: 5.2, size: 1.04, accent: '#c9a44c' },
  wraith: { name: 'Espectro', sprite: 'wraith', hp: 170, mp: 20, atk: 18, def: 10, mag: 24, res: 20, spd: 13, lck: 7,
    xp: 95, gold: 42, weak: ['holy'], resist: ['dark', 'ice'], skills: ['golpe_sombrio', 'lamento'], scale: 5, size: 0.98, accent: '#b795e8' },
  darkknight: { name: 'Cavaleiro Sombrio', sprite: 'darkknight', hp: 300, mp: 0, atk: 32, def: 24, mag: 10, res: 16, spd: 11, lck: 6,
    xp: 140, gold: 65, weak: ['holy'], resist: ['dark'], skills: ['clavao', 'golpe_sombrio'], scale: 4.4, size: 1.05, accent: '#b795e8' },
  jailer: { name: 'Carcereiro Groth', sprite: 'jailer', hp: 700, mp: 0, atk: 27, def: 18, mag: 4, res: 8, spd: 8, lck: 3,
    xp: 230, gold: 130, weak: ['ice'], resist: [], skills: ['clavao', 'terremoto'], scale: 5.4, size: 1.05, boss: true, accent: '#a06040' },
  sentinel: { name: 'Sentinela de Pedra', sprite: 'sentinel', hp: 1000, mp: 30, atk: 31, def: 27, mag: 22, res: 22, spd: 10, lck: 4,
    xp: 380, gold: 220, weak: ['holy'], resist: ['none'], skills: ['sentinela_quake', 'rocha_punho'], scale: 5.2, size: 1.18, boss: true, accent: '#7fe0d0' },
  champion: { name: 'Sir Varek, o Punho Carmesim', sprite: 'champion', hp: 1050, mp: 20, atk: 35, def: 25, mag: 12, res: 14, spd: 13, lck: 6,
    xp: 430, gold: 260, weak: ['ice'], resist: ['fire'], skills: ['clavao', 'lanca', 'brado'], scale: 4.6, size: 1.08, boss: true, accent: '#e35f72' },
  dorian: { name: 'Dorian, o Regente', sprite: 'dorian', hp: 1250, mp: 80, atk: 37, def: 25, mag: 30, res: 24, spd: 15, lck: 8,
    xp: 650, gold: 500, weak: ['holy'], resist: ['dark'], skills: ['golpe_sombrio', 'brasa_vento', 'lamento'], scale: 4.6, size: 1.15, boss: true, accent: '#e35f72' },
  arauto: { name: 'Arauto da Brasa', sprite: 'arauto', hp: 1900, mp: 999, atk: 45, def: 29, mag: 42, res: 28, spd: 16, lck: 8,
    xp: 1300, gold: 900, weak: ['holy'], resist: ['fire', 'dark'], skills: ['inferno', 'golpe_arauto', 'rend', 'regen_brasas'], scale: 5.6, size: 1.22, boss: true, accent: '#ff7a3a' },
};

export const ENCOUNTERS = {
  tutorial: [['wolf', 'wolf']],
  prison: [['guard'], ['guard', 'guard'], ['hound', 'guard']],
  mountain: [['icewolf', 'icewolf'], ['icewolf'], ['golem'], ['wraith'], ['wraith', 'icewolf']],
  night: [['guard', 'hound'], ['guard', 'guard'], ['hound', 'hound']],
  castle: [['darkknight', 'darkknight'], ['darkknight', 'wraith'], ['wraith', 'wraith']],
};

export function xpToNext(level) {
  return Math.round(20 * Math.pow(level, 1.35));
}

export function statsFor(id, level) {
  const c = CHARACTERS[id];
  const l = Math.max(1, level) - 1;
  const s = {};
  for (const k of ['hp', 'mp', 'atk', 'def', 'mag', 'res', 'spd', 'lck']) {
    s[k] = Math.round(c.base[k] + c.growth[k] * l);
  }
  return s;
}

export function makeMember(id, level) {
  const c = CHARACTERS[id];
  const stats = statsFor(id, level);
  return {
    id, name: c.name, role: c.role, sprite: c.sprite, accent: c.accent,
    level, xp: 0, hp: stats.hp, mp: stats.mp, maxHp: stats.hp, maxMp: stats.mp,
    atk: stats.atk, def: stats.def, mag: stats.mag, res: stats.res, spd: stats.spd, lck: stats.lck,
    skills: c.skills.filter(([, lv]) => lv <= level).map(([sid]) => sid),
    status: {}, buffs: [], defending: false,
  };
}

export function levelUpMember(m, levels = 1) {
  const gains = [];
  for (let i = 0; i < levels; i++) {
    const before = statsFor(m.id, m.level);
    m.level++;
    const after = statsFor(m.id, m.level);
    const diff = {};
    for (const k of Object.keys(after)) diff[k] = after[k] - before[k];
    m.maxHp = after.hp; m.maxMp = after.mp;
    m.atk = after.atk; m.def = after.def; m.mag = after.mag; m.res = after.res; m.spd = after.spd; m.lck = after.lck;
    m.hp = Math.min(m.maxHp, m.hp + diff.hp);
    m.mp = Math.min(m.maxMp, m.mp + diff.mp);
    const newSkills = CHARACTERS[m.id].skills.filter(([sid, lv]) => lv === m.level && !m.skills.includes(sid)).map(([sid]) => sid);
    m.skills.push(...newSkills);
    gains.push({ level: m.level, diff, newSkills });
  }
  return gains;
}

export const STATUS_INFO = {
  poison: { name: 'Veneno', icon: '☠', color: '#8ae08a' },
  burn: { name: 'Queimadura', icon: '✹', color: '#ff9a4a' },
  stun: { name: 'Atordoado', icon: '✶', color: '#ffd27a' },
  regen: { name: 'Regeneração', icon: '✚', color: '#7ddba0' },
  atkUp: { name: 'ATQ+', icon: '▲', color: '#ffb84a' },
  defUp: { name: 'DEF+', icon: '◆', color: '#8ac8ff' },
  atkDown: { name: 'ATQ-', icon: '▼', color: '#c08a8a' },
};

export const CHAPTERS = [
  { n: 'I', title: 'O Festival da Colheita', sub: 'Brumalva, fim do verão' },
  { n: 'II', title: 'A Noite da Traição', sub: 'O Santuário da Brasa' },
  { n: 'III', title: 'Três Anos no Abismo', sub: 'Forte Abissal' },
  { n: 'IV', title: 'O Caminho da Aurora', sub: 'Pico do Amanhecer' },
  { n: 'V', title: 'A Cidade Sem Sol', sub: 'Brumalva ocupada' },
  { n: 'VI', title: 'O Trono de Brasa', sub: 'Castelo de Valdoria' },
];
