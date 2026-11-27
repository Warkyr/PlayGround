// Sabor & Cia — dados do jogo
export const V = { W: 960, H: 600, OPEN: 11 * 60, CLOSE: 23 * 60, MIN_PER_SEC: 3 }

export const TABLE_SLOTS = [
  { x: 150, y: 330, cap: 2 },
  { x: 390, y: 330, cap: 4 },
  { x: 630, y: 330, cap: 4 },
  { x: 870, y: 330, cap: 2 },
  { x: 150, y: 465, cap: 2 },
  { x: 390, y: 465, cap: 4 },
  { x: 630, y: 465, cap: 4 },
  { x: 870, y: 465, cap: 2 }
]
export const UNLOCK_ORDER = [1, 2, 5, 6, 0, 3, 4, 7]
export const TABLE_COSTS = [450, 750, 1150, 1700, 2400]
export const START_TABLES = 3

export const STOVES = [
  { x: 120, y: 152 }, { x: 250, y: 152 }, { x: 380, y: 152 }, { x: 470, y: 152 }
]
export const PASS_SLOTS = [
  { x: 315, y: 240 }, { x: 375, y: 240 }, { x: 435, y: 240 }, { x: 495, y: 240 }
]
export const PASS_PICK = { x: 405, y: 268 }
export const STAFF_HOMES = {
  cook: [{ x: 190, y: 200 }, { x: 315, y: 200 }, { x: 445, y: 200 }],
  waiter: [{ x: 560, y: 288 }, { x: 605, y: 288 }, { x: 650, y: 288 }, { x: 695, y: 288 }],
  cleaner: [{ x: 62, y: 288 }, { x: 102, y: 288 }]
}
export const QUEUE_SPOTS = [
  { x: 330, y: 548 }, { x: 390, y: 548 }, { x: 450, y: 548 },
  { x: 510, y: 548 }, { x: 570, y: 548 }, { x: 630, y: 548 }
]
export const ENTRY = { x: 480, y: 552 }
export const DOOR = { x: 480, y: 596 }
export const MAX_QUEUE = 8
export const LEVEL_XP = [0, 120, 320, 620, 1050, 1600, 2300, 3200, 4300, 5600, 7000]
export const MAX_LEVEL = 10

export const ROLES = {
  cook: { name: 'Cozinheiro', plural: 'Cozinha', emoji: '👨‍🍳', wage: 220, speed: 62, cap: 3, color: '#f5ead8' },
  waiter: { name: 'Garçom', plural: 'Salão', emoji: '🤵', wage: 160, speed: 82, cap: 4, color: '#2f2a2a' },
  cleaner: { name: 'Faxineiro', plural: 'Limpeza', emoji: '🧹', wage: 120, speed: 74, cap: 2, color: '#5b7fa6' }
}

export const DISHES = [
  { id: 'bruschetta', name: 'Bruschetta', emoji: '🍅', cost: 4, price: 16, prep: 3, quality: 2.6, appeal: 1.0, level: 1, desc: 'Pão rústico, tomate e manjericão.' },
  { id: 'salada', name: 'Salada Caesar', emoji: '🥗', cost: 6, price: 22, prep: 3, quality: 2.9, appeal: 0.95, level: 1, desc: 'Folhas frescas, frango e croutons.' },
  { id: 'carbonara', name: 'Carbonara', emoji: '🍝', cost: 8, price: 28, prep: 6, quality: 3.3, appeal: 1.2, level: 1, desc: 'Massa cremosa com bacon e parmesão.' },
  { id: 'burger', name: 'Burger Artesanal', emoji: '🍔', cost: 9, price: 30, prep: 5, quality: 3.1, appeal: 1.3, level: 1, desc: 'Blend 180g, cheddar e batatas.' },
  { id: 'pizza', name: 'Pizza Margherita', emoji: '🍕', cost: 11, price: 36, prep: 7, quality: 3.5, appeal: 1.4, level: 2, unlock: 400, desc: 'Massa fina, muçarela e basílico.' },
  { id: 'tiramisu', name: 'Tiramisù', emoji: '🍰', cost: 5, price: 20, prep: 2, quality: 3.4, appeal: 0.85, level: 2, unlock: 280, desc: 'Sobremesa italiana com café.' },
  { id: 'risotto', name: 'Risoto de Camarão', emoji: '🍤', cost: 14, price: 46, prep: 8, quality: 3.9, appeal: 1.1, level: 3, unlock: 700, desc: 'Arroz arbóreo e camarões.' },
  { id: 'sushi', name: 'Combinado Sushi', emoji: '🍣', cost: 16, price: 54, prep: 8, quality: 4.1, appeal: 1.2, level: 4, unlock: 1000, desc: 'Seleção do chef, 12 peças.' },
  { id: 'steak', name: 'Filé ao Molho', emoji: '🥩', cost: 19, price: 62, prep: 9, quality: 4.3, appeal: 1.25, level: 5, unlock: 1500, desc: 'Filé mignon com molho de vinho.' },
  { id: 'lobster', name: 'Lagosta do Chef', emoji: '🦞', cost: 26, price: 88, prep: 10, quality: 4.7, appeal: 1.15, level: 6, unlock: 2200, desc: 'Lagosta grelhada com manteiga.' }
]

export const UPGRADES = [
  { id: 'station', group: 'Cozinha', name: 'Estação extra', emoji: '🔥', desc: 'Mais um prato cozinhando ao mesmo tempo.', max: 3, costs: [550, 1100, 1900] },
  { id: 'oven', group: 'Cozinha', name: 'Forno turbo', emoji: '♨️', desc: '+0,35 de qualidade em todos os pratos.', max: 3, costs: [650, 1350, 2300] },
  { id: 'knives', group: 'Cozinha', name: 'Facas profissionais', emoji: '🔪', desc: 'Preparo 15% mais rápido por nível.', max: 3, costs: [380, 850, 1500] },
  { id: 'decor', group: 'Salão', name: 'Decoração', emoji: '🖼️', desc: '+7 de charme. Clientes mais felizes.', max: 4, costs: [280, 600, 1050, 1700] },
  { id: 'lighting', group: 'Salão', name: 'Iluminação', emoji: '💡', desc: '+5 de charme e clima aconchegante.', max: 3, costs: [320, 700, 1200] },
  { id: 'ac', group: 'Salão', name: 'Ar-condicionado', emoji: '❄️', desc: '+7 de paciência na fila.', max: 2, costs: [480, 950] },
  { id: 'music', group: 'Salão', name: 'Música ao vivo', emoji: '🎷', desc: '+3 de satisfação inicial.', max: 2, costs: [750, 1500] },
  { id: 'flyers', group: 'Marketing', name: 'Panfletos', emoji: '📄', desc: '+8% de fluxo de clientes.', max: 3, costs: [240, 480, 850] },
  { id: 'social', group: 'Marketing', name: 'Redes sociais', emoji: '📱', desc: '+12% de fluxo e reputação.', max: 3, costs: [550, 1100, 1850] },
  { id: 'training', group: 'Equipe', name: 'Treinamento', emoji: '🎓', desc: 'Toda a equipe 10% mais rápida.', max: 3, costs: [450, 1000, 1750] },
  { id: 'cleaning', group: 'Equipe', name: 'Kit de limpeza', emoji: '🧽', desc: 'A sujeira acumula 25% mais devagar.', max: 2, costs: [280, 650] }
]

export const EVENTS = [
  { id: 'happy', title: 'Happy Hour!', emoji: '🍻', tone: 'good', flow: 1.45, desc: 'O movimento vai bombar: +45% de clientes hoje.' },
  { id: 'rain', title: 'Noite de chuva', emoji: '🌧️', tone: 'bad', flow: 0.72, patience: -3, desc: 'Menos gente na rua: fluxo -28% e clientes mais impacientes.' },
  { id: 'critic', title: 'Crítico à vista', emoji: '⭐', tone: 'warn', critic: true, desc: 'Um crítico do jornal virá jantar. Uma noite impecável vale muito!' },
  { id: 'influencer', title: 'Influenciador', emoji: '📸', tone: 'good', flow: 1.2, repEnd: 0.12, desc: 'Um influenciador postou sobre o restaurante: +20% de fluxo.' },
  { id: 'supplier', title: 'Fornecedor em falta', emoji: '🚚', tone: 'bad', ingredient: 1.5, desc: 'Ingredientes custam 50% mais caro hoje.' },
  { id: 'festival', title: 'Festival na praça', emoji: '🎪', tone: 'warn', flow: 1.35, patience: -4, desc: 'A cidade está em festa: mais clientes, menos paciência.' },
  { id: 'inspection', title: 'Vigilância sanitária', emoji: '📋', tone: 'warn', inspection: true, desc: 'A fiscalização pode aparecer no fim do dia. Capriche na limpeza!' },
  { id: 'match', title: 'Jogo na TV', emoji: '📺', tone: 'warn', flow: 1.25, patience: -2, desc: 'Dia de jogo: salão cheio e clientes apressados.' }
]

export const OBJECTIVES = [
  { id: 'first', title: 'Primeiros clientes', desc: 'Sirva 5 clientes', icon: '🍽️', type: 'served', target: 5, reward: 150 },
  { id: 'warm', title: 'Casa cheia', desc: 'Sirva 20 clientes', icon: '🔥', type: 'served', target: 20, reward: 300 },
  { id: 'buzz', title: 'Boca a boca', desc: 'Alcance 3,5 estrelas', icon: '🌟', type: 'rep', target: 3.5, reward: 350 },
  { id: 'tables', title: 'Mais mesas', desc: 'Tenha 5 mesas abertas', icon: '🪑', type: 'tables', target: 5, reward: 400 },
  { id: 'clean', title: 'Time completo', desc: 'Contrate um faxineiro', icon: '🧹', type: 'hireCleaner', target: 1, reward: 220 },
  { id: 'profit', title: 'Dia lucrativo', desc: 'Lucro de R$ 1.000 em um dia', icon: '📈', type: 'dayProfit', target: 1000, reward: 500 },
  { id: 'star', title: 'Estrela guia', desc: 'Alcance 4,2 estrelas', icon: '✨', type: 'rep', target: 4.2, reward: 800 },
  { id: 'level', title: 'Chef experiente', desc: 'Alcance o nível 5', icon: '🎖️', type: 'level', target: 5, reward: 700 },
  { id: 'served100', title: 'Centenário', desc: 'Sirva 100 clientes', icon: '💯', type: 'served', target: 100, reward: 1200 },
  { id: 'earn', title: 'Império do sabor', desc: 'Fature R$ 20.000 no total', icon: '👑', type: 'earned', target: 20000, reward: 1800 }
]

export const NAMES = ['Bia', 'Rafa', 'Léo', 'Nina', 'Tom', 'Carla', 'Duda', 'Igor', 'Maya', 'Vini', 'Zeca', 'Lulu', 'Rita', 'Caio', 'Sofia', 'Juca', 'Bel', 'Davi', 'Eva', 'Nando', 'Pipa', 'Tati', 'Gus', 'Lila', 'Otto', 'Mel', 'Rui', 'Yara', 'Beto', 'Iris']
export const SURNAMES = ['S.', 'M.', 'L.', 'R.', 'C.', 'F.', 'A.', 'P.', 'T.', 'B.', 'N.', 'G.']
export const SHIRTS = ['#e2703a', '#4f86c6', '#7dbb6e', '#c95d7b', '#e0b24c', '#8b6fc4', '#4aa8a0', '#d96a5a', '#6f8f4e', '#b96a3c', '#5c7d9e', '#cf8b4a']
export const SKINS = ['#f2c9a4', '#e0ac7e', '#c98a5b', '#a96b42', '#7f4e2f', '#5d3821', '#f7d9bd']
export const HAIRS = ['#2b1d16', '#4a2d1c', '#6b4226', '#a5642f', '#d9b06a', '#8d8d8d', '#1b1b1b']

export const REVIEW_GOOD = [
  'Simplesmente perfeito! {dish} estava divino.',
  'Melhor restaurante do bairro, sem dúvida!',
  'Atendimento impecável e comida maravilhosa.',
  'Voltarei com certeza. {dish} é um espetáculo!',
  'Tudo no ponto, ambiente aconchegante. Amei!',
  'Uma experiência que vale cada centavo.'
]
export const REVIEW_OK = [
  'Comida boa, mas a espera foi um pouquinho longa.',
  'Gostei do {dish}. O salão podia estar mais limpo.',
  'Bom custo-benefício, atendimento simpático.',
  'Sabor honesto. Nada extraordinário, mas agradável.',
  'O {dish} salvou a noite. Voltaria.'
]
export const REVIEW_BAD = [
  'Demorou demais para chegar. Fiquei com fome e fui embora.',
  'A espera foi longa e o prato chegou frio.',
  'Atendimento lento e mesa suja. Não recomendo.',
  'Péssima experiência. Não volto.',
  'Fila enorme, ninguém aparecia para anotar o pedido.'
]

export function dishById(id) { return DISHES.find(d => d.id === id) }
export function upgradeById(id) { return UPGRADES.find(u => u.id === id) }
export function roleByKey(k) { return ROLES[k] }
export function fmtMoney(n) {
  const v = Math.round(n)
  return (v < 0 ? '-R$ ' : 'R$ ') + Math.abs(v).toLocaleString('pt-BR')
}
export function fmtStars(n) { return n.toFixed(1).replace('.', ',') }
export function fmtClock(min) {
  const h = Math.floor(min / 60) % 24
  const m = Math.floor(min % 60)
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0')
}
export function weekday(day) { return ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'][(day - 1) % 7] }
