export const GAME_TITLE = 'Cinzas de Valdoria';

export const HEROES = {
  kael: {
    id: 'kael',
    name: 'Kael',
    fullName: 'Kael Varyn',
    role: 'Cavaleiro das Cinzas',
    color: '#d9a441',
    base: { hp: 126, mp: 30, atk: 18, def: 10, mag: 6, spd: 12, luck: 6 },
    growth: { hp: 15, mp: 4, atk: 3.2, def: 2.1, mag: 1, spd: 1.1, luck: .6 },
    skills: ['slash', 'dawnblade', 'warcry', 'lastbreath'],
    intro: 'Um ferreiro que aprendeu a forjar esperança dentro do inferno.',
    weapon: 'Ferro do Abismo'
  },
  mira: {
    id: 'mira',
    name: 'Mira',
    fullName: 'Mira Vael',
    role: 'Lâmina da Resistência',
    color: '#6cc7b5',
    base: { hp: 94, mp: 54, atk: 11, def: 8, mag: 18, spd: 15, luck: 8 },
    growth: { hp: 10, mp: 7, atk: 1.7, def: 1.7, mag: 3.2, spd: 1.1, luck: .8 },
    skills: ['heal', 'shieldlight', 'sacredflame', 'revive'],
    intro: 'Uma espiã que trocou a liberdade pela chance de derrubar a Coroa.',
    weapon: 'Adaga da Maré'
  },
  brann: {
    id: 'brann',
    name: 'Brann',
    fullName: 'Brann Kade',
    role: 'Muralha da Resistência',
    color: '#c97a4a',
    base: { hp: 178, mp: 28, atk: 21, def: 17, mag: 4, spd: 7, luck: 4 },
    growth: { hp: 22, mp: 2, atk: 3.1, def: 3.1, mag: .7, spd: .5, luck: .4 },
    skills: ['taunt', 'hammerfall', 'earthquake', 'bastion'],
    intro: 'Um veterano que enterrou seu pelotão e carrega a culpa como armadura.',
    weapon: 'Martelo Rachado'
  }
};

export const SKILLS = {
  strike: {
    name: 'Golpe Firme', cost: 0, target: 'enemy', kind: 'phys', power: 1,
    desc: 'Um ataque direto e sem desperdício.'
  },
  slash: {
    name: 'Golpe Cinza', cost: 6, target: 'enemy', kind: 'phys', power: 1.6,
    desc: 'Corta com a fúria contida de três anos.', fx: 'slash'
  },
  dawnblade: {
    name: 'Lâmina do Amanhecer', cost: 15, target: 'allEnemies', kind: 'phys', power: 1.05,
    desc: 'Um arco de luz atinge todos os inimigos.', fx: 'dawn'
  },
  warcry: {
    name: 'Grito de Guerra', cost: 8, target: 'self', kind: 'buff',
    buff: { atk: 1.35, turns: 3 }, desc: 'Aumenta o próprio ATQ por 3 turnos.', fx: 'buff'
  },
  lastbreath: {
    name: 'Último Suspiro', cost: 18, target: 'self', kind: 'healSelf', power: .38,
    desc: 'Recupera 38% dos PV e queima o medo.', fx: 'heal'
  },
  heal: {
    name: 'Cura', cost: 8, target: 'ally', kind: 'heal', power: 32,
    desc: 'Restaura PV de um aliado.', fx: 'heal'
  },
  shieldlight: {
    name: 'Luz Protetora', cost: 10, target: 'ally', kind: 'shield', power: 44,
    desc: 'Cria um escudo que absorve dano.', fx: 'shield'
  },
  sacredflame: {
    name: 'Chama Sagrada', cost: 13, target: 'allEnemies', kind: 'magic', power: 1.05,
    desc: 'Fogo prateado consome todos os inimigos.', fx: 'holy'
  },
  revive: {
    name: 'Chamado da Aurora', cost: 26, target: 'downedAlly', kind: 'revive', power: .55,
    desc: 'Traz um aliado caído de volta com 55% dos PV.', fx: 'revive'
  },
  taunt: {
    name: 'Provocar', cost: 6, target: 'self', kind: 'taunt',
    desc: 'Atrai ataques inimigos por 2 turnos e reduz o dano.', fx: 'taunt'
  },
  hammerfall: {
    name: 'Martelo da Montanha', cost: 10, target: 'enemy', kind: 'phys', power: 1.85,
    desc: 'Um golpe capaz de rachar pedra.', fx: 'heavy'
  },
  earthquake: {
    name: 'Terremoto', cost: 17, target: 'allEnemies', kind: 'phys', power: .95,
    desc: 'Sacode o campo e atinge todos os inimigos.', fx: 'quake'
  },
  bastion: {
    name: 'Baluarte', cost: 12, target: 'allAllies', kind: 'buff',
    buff: { def: 1.35, turns: 3 }, desc: 'Aumenta a DEF de todo o grupo por 3 turnos.', fx: 'buff'
  }
};

export const ITEMS = {
  potion: { name: 'Poção de Cura', desc: 'Restaura 48 PV de um aliado.', price: 25, kind: 'heal', amount: 48, icon: '♥' },
  hipotion: { name: 'Poção Maior', desc: 'Restaura 110 PV de um aliado.', price: 60, kind: 'heal', amount: 110, icon: '♥' },
  ether: { name: 'Éter', desc: 'Restaura 28 PM de um aliado.', price: 42, kind: 'mp', amount: 28, icon: '✦' },
  antidote: { name: 'Antídoto', desc: 'Cura veneno e queimadura.', price: 18, kind: 'cure', icon: '✧' },
  bomb: { name: 'Bomba de Cinzas', desc: 'Causa 58 de dano a todos os inimigos.', price: 38, kind: 'damageAll', amount: 58, icon: '✹' },
  elixir: { name: 'Elixir da Forja', desc: 'Restaura todos os PV e PM de um aliado.', price: 140, kind: 'full', icon: '❖' },
  shard: { name: 'Fragmento de Cinza', desc: 'Cristal endurecido pelo fogo da Coroa. Usado na forja.', price: 0, kind: 'material', icon: '◆' }
};

export const UPGRADES = {
  kael: {
    id: 'kael',
    name: 'Lâmina do Amanhecer',
    cost: 190,
    shards: 2,
    desc: 'Uma espada forjada com cinza e luz. +9 ATQ, +3 VEL.',
    stats: { atk: 9, spd: 3 }
  },
  mira: {
    id: 'mira',
    name: 'Cetro da Alvorada',
    cost: 170,
    shards: 2,
    desc: 'Cristal que amplifica a magia de Mira. +10 MAG, +16 PM.',
    stats: { mag: 10, mp: 16 }
  },
  brann: {
    id: 'brann',
    name: 'Martelo do Titã',
    cost: 180,
    shards: 2,
    desc: 'Pesado o bastante para partir uma coroa. +10 ATQ, +5 DEF.',
    stats: { atk: 10, def: 5 }
  }
};

export const ENEMIES = {
  guard: {
    id: 'guard', name: 'Guarda do Abismo', art: 'guard', hp: 82, mp: 0, atk: 13, def: 7, mag: 3, spd: 9,
    xp: 34, gold: 19, scale: 1, skills: ['spear', 'guardstance'], desc: 'Um carcereiro que vendeu a alma por um salário.'
  },
  wolf: {
    id: 'wolf', name: 'Lobo de Cinza', art: 'wolf', hp: 68, mp: 0, atk: 15, def: 4, mag: 2, spd: 17,
    xp: 28, gold: 12, scale: .9, skills: ['bite', 'howl'], desc: 'Faminto o bastante para caçar até a própria sombra.'
  },
  warden: {
    id: 'warden', name: 'Carcereiro Gorr', art: 'warden', hp: 340, mp: 30, atk: 20, def: 11, mag: 5, spd: 7,
    xp: 140, gold: 95, scale: 1.3, boss: true, skills: ['hammer', 'quake', 'lockdown'], desc: 'O punho de ferro do Abismo.'
  },
  voss: {
    id: 'voss', name: 'Inquisidor Voss', art: 'inquisitor', hp: 420, mp: 60, atk: 23, def: 12, mag: 19, spd: 11,
    xp: 220, gold: 160, scale: 1.22, boss: true, skills: ['judgment', 'purge', 'siphon'], desc: 'O olho que vigia o trono e a mão que queima hereges.'
  },
  darian: {
    id: 'darian', name: 'Darian, o Campeão', art: 'darian', hp: 620, mp: 50, atk: 27, def: 15, mag: 10, spd: 14,
    xp: 340, gold: 240, scale: 1.3, boss: true, skills: ['royalslash', 'lionroar', 'crosscut', 'crownsiphon'], desc: 'O melhor amigo que trocou a lealdade por uma coroa.'
  },
  lyra: {
    id: 'lyra', name: 'Lyra, Dama das Cinzas', art: 'lyra', hp: 760, mp: 120, atk: 20, def: 13, mag: 27, spd: 16,
    xp: 0, gold: 0, scale: 1.35, boss: true, skills: ['ashbolt', 'crownnova', 'siphon', 'requiem'], desc: 'A mulher que Kael amou — agora coroada pelo vazio.'
  }
};

export const ENEMY_SKILLS = {
  spear: { name: 'Estocada', kind: 'phys', power: 1, target: 'enemy' },
  guardstance: { name: 'Postura de Guarda', kind: 'buff', buff: { def: 1.25, turns: 2 }, target: 'self' },
  bite: { name: 'Mordida', kind: 'phys', power: 1.1, target: 'enemy' },
  howl: { name: 'Uivo Faminto', kind: 'buff', buff: { atk: 1.25, turns: 3 }, target: 'self' },
  hammer: { name: 'Martelo do Carcereiro', kind: 'phys', power: 1.35, target: 'enemy' },
  quake: { name: 'Impacto Sísmico', kind: 'phys', power: .8, target: 'allEnemies' },
  lockdown: { name: 'Algemas de Ferro', kind: 'debuff', status: 'slow', target: 'enemy' },
  judgment: { name: 'Julgamento', kind: 'magic', power: 1.35, target: 'enemy' },
  purge: { name: 'Fogo Purificador', kind: 'magic', power: .9, target: 'allEnemies' },
  siphon: { name: 'Sifão de Cinzas', kind: 'drain', power: .9, target: 'enemy' },
  royalslash: { name: 'Lâmina Real', kind: 'phys', power: 1.45, target: 'enemy' },
  lionroar: { name: 'Rugido do Campeão', kind: 'buff', buff: { atk: 1.3, def: 1.2, turns: 3 }, target: 'self' },
  crosscut: { name: 'Corte Cruzado', kind: 'phys', power: .85, target: 'enemy', hits: 2 },
  crownsiphon: { name: 'Dízimo da Coroa', kind: 'drain', power: .7, target: 'enemy' },
  ashbolt: { name: 'Lança de Cinza', kind: 'magic', power: 1.2, target: 'enemy' },
  crownnova: { name: 'Nova da Coroa', kind: 'magic', power: .95, target: 'allEnemies' },
  requiem: { name: 'Réquiem de Valdoria', kind: 'magic', power: 1.7, target: 'allEnemies' }
};

export const ENCOUNTERS = {
  prison_guards_1: {
    background: 'prison', title: 'O Corredor dos Carcereiros',
    enemies: [{ id: 'guard', name: 'Guarda do Abismo' }],
    intro: 'Um carcereiro bloqueia o corredor, arrastando a lança pelo chão.',
    victory: 'A chave do corredor cai da mão do guarda.',
    canFlee: false
  },
  prison_guards_2: {
    background: 'prison', title: 'A Porta de Ferro',
    enemies: [{ id: 'guard', name: 'Guarda I' }, { id: 'guard', name: 'Guarda II' }],
    intro: 'Dois guardas erguem os escudos. O caminho para fora passa por eles.',
    victory: 'O eco da luta se espalha pelo Abismo.',
    canFlee: false
  },
  warden: {
    background: 'prison', title: 'O Punho do Abismo', boss: true,
    enemies: [{ id: 'warden' }],
    intro: 'Gorr gira o martelo como se fosse um brinquedo. "Três anos, rato. E ainda não aprendeu a ficar quieto."',
    victory: 'O Carcereiro cai. A última porta do Abismo se abre.',
    canFlee: false
  },
  wolves: {
    background: 'forest', title: 'Uivos na Estrada',
    enemies: [{ id: 'wolf', name: 'Lobo de Cinza' }, { id: 'wolf', name: 'Lobo Faminto' }],
    intro: 'Dois pares de olhos acendem entre as árvores. O cheiro de sangue é mais forte que o medo.',
    victory: 'A matilha recua. Alguém aplaude na escuridão.',
    canFlee: false
  },
  voss: {
    background: 'castle', title: 'O Olho da Coroa', boss: true,
    enemies: [{ id: 'voss' }],
    intro: '"Kael Varyn. O morto que esqueceu de morrer." Voss ergue o cajado. "A Coroa não tolera milagres."',
    victory: 'Voss se ajoelha. Pela primeira vez, o castelo parece sentir medo.',
    canFlee: false
  },
  darian: {
    background: 'castle', title: 'O Campeão da Coroa', boss: true,
    enemies: [{ id: 'darian' }],
    intro: 'Darian desce do trono sem pressa. "Eu sabia que você voltaria. Você sempre foi previsível, Kael."',
    victory: 'A espada de Darian se parte. O silêncio que se segue é mais pesado que o aço.',
    canFlee: false
  },
  lyra: {
    background: 'castle', title: 'A Dama das Cinzas', boss: true, final: true,
    enemies: [{ id: 'lyra' }],
    intro: 'Lyra flutua acima do trono, o Coração de Valdoria pulsando em seu peito. "Você veio pelo seu final de conto de fadas, Kael?"',
    victory: 'O Coração racha. Pela primeira vez em três anos, Lyra parece apenas uma mulher.',
    canFlee: false
  }
};

export const CHAPTERS = {
  prologue: {
    kicker: 'PRÓLOGO', title: 'A Noite da Colheita',
    quote: 'Toda lenda começa com uma promessa. Algumas promessas são feitas para quebrar.'
  },
  prison: {
    kicker: 'CAPÍTULO I', title: 'O Abismo',
    quote: 'O ferro não faz um homem. Ele apenas revela o que já estava dentro.'
  },
  forest: {
    kicker: 'CAPÍTULO II', title: 'Cinzas e Estradas',
    quote: 'Vingança é uma chama que consome a mão. Justiça é a forja que molda o aço.'
  },
  camp: {
    kicker: 'CAPÍTULO III', title: 'A Chama da Resistência',
    quote: 'Nenhum herói nasce sozinho. Até a lâmina mais afiada precisa de uma mão.'
  },
  castle: {
    kicker: 'CAPÍTULO IV', title: 'O Trono de Cinzas',
    quote: 'A coroa mais pesada não é feita de ouro. É feita daquilo que você escolhe carregar.'
  }
};

export const LORE = {
  heart: {
    title: 'O Coração de Valdoria',
    text: 'Uma relíquia encontrada sob a antiga capital. Dizem que ela transforma desejo em poder — e poder em fome. A Coroa de Cinzas foi forjada ao redor dela para conter sua vontade.'
  },
  prison: {
    title: 'O Abismo',
    text: 'Prisão escavada no leito de um vulcão extinto. Não há grades para todos os condenados: alguns simplesmente esquecem que existe um lado de fora.'
  },
  resistance: {
    title: 'A Resistência',
    text: 'Camponeses, soldados desertores e ladrões unidos por uma única certeza: Valdoria não pertence a uma coroa que se alimenta de seu povo.'
  },
  darian: {
    title: 'Darian, o Campeão',
    text: 'Filho de um ferreiro e de uma lavadeira, cresceu à sombra de Kael. A Coroa lhe ofereceu o que a amizade nunca pôde: um palco só seu.'
  },
  lyra: {
    title: 'Lyra, a Dama das Cinzas',
    text: 'Nobre de nascimento, prisioneira das expectativas. Quando o Coração sussurrou que ela poderia ser mais que um contrato de casamento, Lyra escolheu ouvir.'
  }
};

export function xpForLevel(level) {
  if (level <= 1) return 0;
  return Math.round(55 * Math.pow(level - 1, 1.55));
}

export function levelFromXp(xp) {
  let level = 1;
  while (level < 12 && xp >= xpForLevel(level + 1)) level++;
  return level;
}

export function makeMember(id, level = 1) {
  const def = HEROES[id];
  const l = Math.max(1, Math.min(12, level));
  const g = def.growth;
  return {
    id,
    name: def.name,
    fullName: def.fullName,
    role: def.role,
    level: l,
    xp: xpForLevel(l),
    hp: Math.round(def.base.hp + g.hp * (l - 1)),
    maxHp: Math.round(def.base.hp + g.hp * (l - 1)),
    mp: Math.round(def.base.mp + g.mp * (l - 1)),
    maxMp: Math.round(def.base.mp + g.mp * (l - 1)),
    stats: {
      atk: Math.round(def.base.atk + g.atk * (l - 1)),
      def: Math.round(def.base.def + g.def * (l - 1)),
      mag: Math.round(def.base.mag + g.mag * (l - 1)),
      spd: Math.round(def.base.spd + g.spd * (l - 1)),
      luck: Math.round(def.base.luck + g.luck * (l - 1))
    },
    skills: [...def.skills],
    weapon: def.weapon,
    upgraded: false
  };
}

// Map legend:
// T tree · . grass · , path · f flowers · R roof · H house wall · D door
// # stone wall · _ stone floor · X iron bars · ~ water · b bridge · P carpet
// S stairs · = fence · C torch (prop) · * rubble · o column
export const MAPS = {
  bruma: {
    id: 'bruma',
    region: 'BRUMA',
    name: 'Vila dos Ferreiros',
    ambient: 'night',
    spawn: { x: 5, y: 11, dir: 'down' },
    tiles: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'T..............................T',
      'T..RRRRRR...RRRRRR....RRRRRRR..T',
      'T..RRRRRR...RRRRRR....RRRRRRR..T',
      'T..HHHHHH...HHHDHH....HHHHHHH..T',
      'T..HHDHHH...HHHHHH....HHHHDHH..T',
      'T...,,,......,,,,......,,,,,...T',
      'T...,,,,,,,,,,,,,,,,,,,,,,,,...T',
      'T...,,,,,,,,,,,,,,,,,,,,,,,,...T',
      'T...,,,,,,,,,,,,,,,,,,,,,,,,...T',
      'T...,,,,,,,,,,,,,,,,,,,,,,,,...T',
      'T...,,,,,,,,,,,,,,,,,,,,,,,,...T',
      'T...,,,,....,,,,,,,,....,,,,...T',
      'T...,,,,....,,,,,,,,....,,,,...T',
      'T..f...........................T',
      'T..............................T',
      'T..f........................f..T',
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT'
    ],
    props: [
      { type: 'fountain', x: 14, y: 7, w: 4, h: 3, solid: true },
      { type: 'lamp', x: 9, y: 7, solid: true },
      { type: 'lamp', x: 20, y: 7, solid: true },
      { type: 'lamp', x: 9, y: 13, solid: true },
      { type: 'lamp', x: 24, y: 13, solid: true },
      { type: 'stall', x: 7, y: 12, w: 2, h: 1, solid: true, color: 'red' },
      { type: 'stall', x: 23, y: 12, w: 2, h: 1, solid: true, color: 'green' },
      { type: 'barrels', x: 9, y: 5, solid: true },
      { type: 'crate', x: 24, y: 5, solid: true },
      { type: 'banner', x: 3, y: 4, solid: false, color: 'gold' },
      { type: 'banner', x: 28, y: 4, solid: false, color: 'crimson' }
    ],
    npcs: [
      { id: 'lyra', x: 16, y: 11, dir: 'up', char: 'lyra', name: 'Lyra' },
      { id: 'darian', x: 12, y: 10, dir: 'right', char: 'darian', name: 'Darian' },
      { id: 'maren', x: 8, y: 15, dir: 'down', char: 'elder', name: 'Dona Maren' },
      { id: 'tio', x: 20, y: 15, dir: 'left', char: 'child', name: 'Tio' },
      { id: 'nessa', x: 7, y: 11, dir: 'right', char: 'merchant', name: 'Nessa' },
      { id: 'guard', x: 26, y: 8, dir: 'left', char: 'guard', name: 'Guarda da Vila' }
    ]
  },
  prison: {
    id: 'prison',
    region: 'O ABISMO',
    name: 'Fortaleza de Ferro',
    ambient: 'prison',
    spawn: { x: 4, y: 8, dir: 'right' },
    tiles: [
      '################################',
      '#______________________________#',
      '#_XXXXXX___XXXXXX___XXXXXX_____#',
      '#_X....X___X....X___X....X_____#',
      '#_X....X___X....X___X....X_____#',
      '#_XXXXXX___XXXXXX___XXXXXX_____#',
      '#______________________________#',
      '#____C_____C______C_____C______#',
      '#______________________________#',
      '#_XXXXXX___XXXXXX___XXXXXX_____#',
      '#_X....X___X....X___X....X_____#',
      '#_X....X___X....X___X....X_____#',
      '#_XXXXXX___XXXXXX___XXXXXX_____#',
      '#______________________________#',
      '#____C_____C______C_____C______#',
      '#______________________________#',
      '#______________________________#',
      '##############################S#'
    ],
    props: [
      { type: 'torch', x: 4, y: 7, solid: true },
      { type: 'torch', x: 10, y: 7, solid: true },
      { type: 'torch', x: 17, y: 7, solid: true },
      { type: 'torch', x: 23, y: 7, solid: true },
      { type: 'torch', x: 4, y: 14, solid: true },
      { type: 'torch', x: 10, y: 14, solid: true },
      { type: 'torch', x: 17, y: 14, solid: true },
      { type: 'torch', x: 23, y: 14, solid: true },
      { type: 'chest', x: 3, y: 15, solid: true, id: 'prisonChest1', loot: { gold: 40, potion: 1 } },
      { type: 'chest', x: 29, y: 15, solid: true, id: 'prisonChest2', loot: { hipotion: 1, shard: 1 } },
      { type: 'chains', x: 3, y: 2, solid: false },
      { type: 'chains', x: 11, y: 2, solid: false },
      { type: 'chains', x: 19, y: 2, solid: false },
      { type: 'stairs', x: 30, y: 17, solid: false }
    ],
    npcs: [
      { id: 'mira_prison', x: 6, y: 8, dir: 'left', char: 'mira', name: 'Mira' },
      { id: 'prisoner', x: 8, y: 10, dir: 'right', char: 'prisoner', name: 'Prisioneiro' },
      { id: 'warden', x: 27, y: 8, dir: 'left', char: 'guard', name: 'Carcereiro Gorr' }
    ],
    triggers: [
      { id: 'guard1', x: 12, y: 6, w: 3, h: 5, action: 'prisonGuard1' },
      { id: 'guard2', x: 20, y: 6, w: 3, h: 5, action: 'prisonGuard2' },
      { id: 'escape', x: 30, y: 17, w: 1, h: 1, action: 'prisonEscape' }
    ]
  },
  forest: {
    id: 'forest',
    region: 'VALDORIA',
    name: 'Estrada das Cinzas',
    ambient: 'forest',
    spawn: { x: 2, y: 9, dir: 'right' },
    tiles: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'T..TTT....TTTT....TTTT....TTTT.T',
      'T..TTT....TTTT....TTTT....TTTT.T',
      'T.........TTTT....TTTT.........T',
      'T..TTT...........TTTT....TTT...T',
      'T..TTT....TTTT...........TTT...T',
      'T.........TTTT....TTTT.........T',
      'T..,,,,,,,,,,,,,,,,,,,,,,,,,,..T',
      'T..,....TTT....TTT....TTT....,.T',
      'T..,....TTT....TTT....TTT....,.T',
      'T..,,,,,,,,,,,,,,,,,,,,,,,,,,,.T',
      'T....TTT....TTT....TTT........,T',
      'T....TTT....TTT....TTT........,T',
      'T.............................,T',
      'T..f.......................f...,T',
      'T..............................T',
      'T..............................T',
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT'
    ],
    props: [
      { type: 'chest', x: 16, y: 4, solid: true, id: 'forestChest1', loot: { gold: 55, ether: 1, shard: 1 } },
      { type: 'ruin', x: 6, y: 2, w: 2, h: 1, solid: true },
      { type: 'ruin', x: 26, y: 13, w: 2, h: 1, solid: true },
      { type: 'log', x: 12, y: 13, w: 2, h: 1, solid: true },
      { type: 'campfire', x: 23, y: 12, solid: true },
      { type: 'shrine', x: 19, y: 3, solid: true },
      { type: 'sign', x: 4, y: 8, solid: true },
      { type: 'fireflies', x: 12, y: 5, w: 8, h: 8, solid: false }
    ],
    npcs: [
      { id: 'brann_forest', x: 24, y: 9, dir: 'left', char: 'brann', name: 'Brann' },
      { id: 'wanderer', x: 8, y: 12, dir: 'down', char: 'wanderer', name: 'Viajante' }
    ],
    triggers: [
      { id: 'wolves', x: 10, y: 7, w: 3, h: 4, action: 'wolves' },
      { id: 'toCamp', x: 28, y: 7, w: 3, h: 6, action: 'toCamp' }
    ]
  },
  camp: {
    id: 'camp',
    region: 'RESISTÊNCIA',
    name: 'Acampamento da Brasa',
    ambient: 'camp',
    spawn: { x: 4, y: 11, dir: 'right' },
    tiles: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'T..............................T',
      'T....TTTT..............TTTT....T',
      'T....TTTT..............TTTT....T',
      'T..............................T',
      'T..TTT....TTT....TTT....TTT....T',
      'T..............................T',
      'T..............................T',
      'T....,,,,,,,,,,,,,,,,,,,,,,,,..T',
      'T....,......................,..T',
      'T....,......................,..T',
      'T....,,,,,,,,,,,,,,,,,,,,,,,,..T',
      'T..............................T',
      'T..TTT....TTT....TTT....TTT....T',
      'T..............................T',
      'T..............................T',
      'T..............................T',
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT'
    ],
    props: [
      { type: 'tent', x: 5, y: 4, w: 3, h: 2, solid: true, color: 'teal' },
      { type: 'tent', x: 23, y: 4, w: 3, h: 2, solid: true, color: 'crimson' },
      { type: 'forge', x: 8, y: 5, w: 2, h: 2, solid: true, id: 'forge' },
      { type: 'stall', x: 16, y: 5, w: 2, h: 1, solid: true, color: 'gold', id: 'merchant' },
      { type: 'campfire', x: 15, y: 10, solid: true, id: 'campfire' },
      { type: 'bedroll', x: 5, y: 9, w: 1, h: 1, solid: false, id: 'savebed' },
      { type: 'banner', x: 13, y: 3, solid: false, color: 'crimson' },
      { type: 'banner', x: 19, y: 3, solid: false, color: 'gold' },
      { type: 'crate', x: 10, y: 12, solid: true },
      { type: 'barrels', x: 19, y: 12, solid: true },
      { type: 'log', x: 13, y: 11, w: 2, h: 1, solid: true },
      { type: 'log', x: 17, y: 11, w: 2, h: 1, solid: true }
    ],
    npcs: [
      { id: 'mira_camp', x: 11, y: 9, dir: 'right', char: 'mira', name: 'Mira' },
      { id: 'brann_camp', x: 22, y: 9, dir: 'left', char: 'brann', name: 'Brann' },
      { id: 'orin', x: 17, y: 12, dir: 'up', char: 'elder', name: 'Velho Orin' },
      { id: 'smith', x: 10, y: 7, dir: 'down', char: 'smith', name: 'Ferreiro Tull' },
      { id: 'merchant_camp', x: 16, y: 7, dir: 'down', char: 'merchant', name: 'Nessa' }
    ]
  },
  castle: {
    id: 'castle',
    region: 'VALDORIA',
    name: 'Palácio da Coroa',
    ambient: 'castle',
    spawn: { x: 16, y: 16, dir: 'up' },
    tiles: [
      '################################',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '################################'
    ],
    props: [
      { type: 'throne', x: 15, y: 2, w: 2, h: 1, solid: true },
      { type: 'carpet', x: 15, y: 3, w: 2, h: 14, solid: false },
      { type: 'pillar', x: 4, y: 4, solid: true },
      { type: 'pillar', x: 27, y: 4, solid: true },
      { type: 'pillar', x: 4, y: 9, solid: true },
      { type: 'pillar', x: 27, y: 9, solid: true },
      { type: 'pillar', x: 4, y: 14, solid: true },
      { type: 'pillar', x: 27, y: 14, solid: true },
      { type: 'brazier', x: 9, y: 4, solid: true },
      { type: 'brazier', x: 22, y: 4, solid: true },
      { type: 'brazier', x: 9, y: 12, solid: true },
      { type: 'brazier', x: 22, y: 12, solid: true },
      { type: 'banner', x: 7, y: 2, solid: false, color: 'crimson' },
      { type: 'banner', x: 24, y: 2, solid: false, color: 'crimson' },
      { type: 'statue', x: 12, y: 2, solid: true },
      { type: 'statue', x: 19, y: 2, solid: true }
    ],
    npcs: [
      { id: 'voss', x: 16, y: 12, dir: 'down', char: 'voss', name: 'Inquisidor Voss' },
      { id: 'darian_castle', x: 16, y: 6, dir: 'down', char: 'darian', name: 'Darian' },
      { id: 'lyra_castle', x: 16, y: 4, dir: 'down', char: 'lyra', name: 'Lyra' }
    ],
    triggers: [
      { id: 'vossTrigger', x: 1, y: 13, w: 30, h: 2, action: 'vossBattle' },
      { id: 'darianTrigger', x: 1, y: 7, w: 30, h: 2, action: 'darianBattle' },
      { id: 'lyraTrigger', x: 1, y: 5, w: 30, h: 1, action: 'lyraBattle' }
    ]
  }
};

export const STARTING_STATE = {
  gold: 65,
  inventory: { potion: 2, antidote: 1, shard: 0 },
  party: ['kael']
};
