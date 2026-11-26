const countries = {
  US: { name: 'Estados Unidos', flag: '🇺🇸', gdp: 29.2, pop: 341, treasury: 3800, mil: 96, approval: 52, inflation: 2.8, unemployment: 4.1, debt: 121, growth: 2.7 },
  CA: { name: 'Canadá', flag: '🇨🇦', gdp: 2.24, pop: 41, treasury: 180, mil: 61, approval: 54, inflation: 2.5, unemployment: 6.5, debt: 107, growth: 1.8 },
  MX: { name: 'México', flag: '🇲🇽', gdp: 1.85, pop: 129, treasury: 95, mil: 58, approval: 48, inflation: 4.2, unemployment: 3.1, debt: 56, growth: 1.5 },
  BR: { name: 'Brasil', flag: '🇧🇷', gdp: 2.31, pop: 216, treasury: 220, mil: 73, approval: 55, inflation: 4.6, unemployment: 7.2, debt: 78, growth: 2.2 },
  AR: { name: 'Argentina', flag: '🇦🇷', gdp: 0.66, pop: 46, treasury: -18, mil: 42, approval: 38, inflation: 94, unemployment: 7.9, debt: 85, growth: -1.8 },
  CL: { name: 'Chile', flag: '🇨🇱', gdp: 0.34, pop: 20, treasury: 28, mil: 49, approval: 47, inflation: 4.2, unemployment: 8.4, debt: 42, growth: 2.4 },
  CO: { name: 'Colômbia', flag: '🇨🇴', gdp: 0.42, pop: 52, treasury: 22, mil: 64, approval: 43, inflation: 5.2, unemployment: 9.1, debt: 56, growth: 2.6 },
  PE: { name: 'Peru', flag: '🇵🇪', gdp: 0.29, pop: 34, treasury: 16, mil: 48, approval: 41, inflation: 3.1, unemployment: 6.8, debt: 33, growth: 3.1 },
  VE: { name: 'Venezuela', flag: '🇻🇪', gdp: 0.12, pop: 28, treasury: -8, mil: 51, approval: 32, inflation: 85, unemployment: 8.2, debt: 175, growth: -3.2 },
  EC: { name: 'Equador', flag: '🇪🇨', gdp: 0.12, pop: 18, treasury: 5, mil: 38, approval: 40, inflation: 3, unemployment: 4.7, debt: 58, growth: 1.8 },
  BO: { name: 'Bolívia', flag: '🇧🇴', gdp: 0.047, pop: 12, treasury: 2, mil: 34, approval: 43, inflation: 5.1, unemployment: 4.1, debt: 78, growth: 2 },
  PY: { name: 'Paraguai', flag: '🇵🇾', gdp: 0.045, pop: 7, treasury: 4, mil: 29, approval: 49, inflation: 4.2, unemployment: 5.7, debt: 40, growth: 3.8 },
  UY: { name: 'Uruguai', flag: '🇺🇾', gdp: 0.077, pop: 3.4, treasury: 8, mil: 31, approval: 57, inflation: 5.1, unemployment: 8.3, debt: 67, growth: 3.1 },
  GT: { name: 'Guatemala', flag: '🇬🇹', gdp: 0.111, pop: 18, treasury: -3, mil: 27, approval: 39, inflation: 4.1, unemployment: 2.9, debt: 28, growth: 3.5 },
  SV: { name: 'El Salvador', flag: '🇸🇻', gdp: 0.034, pop: 6.3, treasury: -2, mil: 25, approval: 46, inflation: 2.2, unemployment: 6, debt: 84, growth: 2.8 },
  HN: { name: 'Honduras', flag: '🇭🇳', gdp: 0.036, pop: 10.8, treasury: -1, mil: 24, approval: 36, inflation: 5.1, unemployment: 6.1, debt: 48, growth: 3.5 },
  NI: { name: 'Nicarágua', flag: '🇳🇮', gdp: 0.018, pop: 7, treasury: -2, mil: 23, approval: 35, inflation: 4.8, unemployment: 4.7, debt: 56, growth: 3 },
  CR: { name: 'Costa Rica', flag: '🇨🇷', gdp: 0.096, pop: 5.1, treasury: 6, mil: 12, approval: 52, inflation: 2.4, unemployment: 7.6, debt: 62, growth: 4.1 },
  PA: { name: 'Panamá', flag: '🇵🇦', gdp: 0.087, pop: 4.5, treasury: 5, mil: 18, approval: 50, inflation: 1.5, unemployment: 8.6, debt: 52, growth: 4.5 },
  GY: { name: 'Guiana', flag: '🇬🇾', gdp: 0.018, pop: 0.8, treasury: 3, mil: 20, approval: 51, inflation: 3.4, unemployment: 12.4, debt: 26, growth: 43 },
  SR: { name: 'Suriname', flag: '🇸🇷', gdp: 0.004, pop: 0.6, treasury: -1, mil: 17, approval: 42, inflation: 22, unemployment: 7.5, debt: 88, growth: -2.1 },
  GF: { name: 'Guiana Francesa', flag: '🇫🇷', gdp: 0.006, pop: 0.3, treasury: 1, mil: 15, approval: 55, inflation: 2.1, unemployment: 10, debt: 30, growth: 2.2 }
};

const monthNames = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

const state = {
  player: null,
  selected: null,
  month: 0,
  paused: false,
  speed: 1,
  zoom: 1,
  wars: new Set(),
  deals: new Set(),
  annexed: new Set(),
  relations: {},
  lastPolicy: {},
  stableMonths: 0,
  objectiveDone: false
};

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

let tickTimer = null;
let toastTimer = null;
let tipSuppressedUntil = 0;

function randomizeRelations() {
  Object.keys(countries).forEach(code => {
    state.relations[code] = code === 'US' ? 45 : 38 + Math.floor(Math.random() * 25);
  });
}

randomizeRelations();

function compactMoney(value) {
  const absolute = Math.abs(value);
  if (absolute >= 1000) return `${value < 0 ? '−' : ''}$${(absolute / 1000).toFixed(absolute >= 10000 ? 1 : 2)} tri`;
  if (absolute >= 1) return `${value < 0 ? '−' : ''}$${absolute.toFixed(0)} bi`;
  return `${value < 0 ? '−' : ''}$${(absolute * 1000).toFixed(0)} mi`;
}

function fmtGDP(value) {
  return value >= 1 ? `$${value.toFixed(value < 10 ? 2 : 1)} tri` : `$${Math.round(value * 1000)} bi`;
}

function stabilityOf(player) {
  const inflationPenalty = Math.max(0, player.inflation) * 0.3 + Math.max(0, player.inflation - 10) * 0.35;
  const unemploymentPenalty = Math.max(0, player.unemployment) * 0.8;
  const debtPenalty = Math.max(0, player.debt - 60) * 0.25;
  const growthPenalty = Math.max(0, -player.growth) * 2;
  const approvalBonus = (player.approval - 50) * 0.3;
  return Math.max(0, Math.min(100, Math.round(100 - inflationPenalty - unemploymentPenalty - debtPenalty - growthPenalty + approvalBonus)));
}

function normalizePlayer(player) {
  player.growth = Math.max(-8, Math.min(12, player.growth));
  player.approval = Math.max(5, Math.min(95, player.approval));
  player.unemployment = Math.max(1, player.unemployment);
  player.inflation = Math.max(0, player.inflation);
  player.debt = Math.max(0, player.debt);
}

function annexCost(code) {
  return Math.min(150, Math.max(12, Math.round(countries[code].gdp * 35)));
}

function dateText() {
  const year = 2026 + Math.floor(state.month / 12);
  const month = state.month % 12;
  return {
    short: `${monthNames[month]} ${year}`,
    long: `1 ${monthNames[month]} ${year}`,
    next: `1 ${monthNames[(month + 1) % 12]}`
  };
}

function makeCards() {
  const order = ['BR', 'US', 'MX', 'AR', 'CA', 'CL', 'CO', 'PE', 'VE', 'UY'];
  $('#countryCards').innerHTML = order.map(code => {
    const country = countries[code];
    return `<button type="button" class="country-card" data-start="${code}"><span class="emoji">${country.flag}</span><span><b>${country.name}</b><small>PIB ${fmtGDP(country.gdp)}</small></span></button>`;
  }).join('');
  $$('[data-start]').forEach(button => {
    button.onclick = () => startCampaign(button.dataset.start);
  });
}

function resetCampaign() {
  state.player = null;
  state.selected = null;
  state.month = 0;
  state.paused = false;
  state.speed = 1;
  state.zoom = 1;
  state.wars.clear();
  state.deals.clear();
  state.annexed.clear();
  state.lastPolicy = {};
  state.stableMonths = 0;
  state.objectiveDone = false;
  randomizeRelations();
  $$('.country').forEach(element => element.classList.remove('owned', 'at-war', 'selected', 'player-country'));
  $('#events').innerHTML = '<div class="event empty-event">Eventos do mandato aparecerão aqui.</div>';
  $('#mapTip').classList.add('hidden');
  hideToast();
  $('#actionsPanel').scrollTop = 0;
  $('#pauseBtn').textContent = 'Ⅱ';
  $('#pauseBtn').title = 'Pausar';
  $('#speedBtn').textContent = '1×';
  $('#speedBtn').title = 'Velocidade 1×';
  setRail('map');
  showPanel('overview');
  setZoom(1);
  scheduleTick();
}

function startCampaign(code) {
  if (!countries[code]) return;
  resetCampaign();
  const base = countries[code];
  state.player = {
    ...base,
    code,
    baseGrowth: base.growth,
    baseUnemployment: base.unemployment
  };
  state.selected = code;
  $(`.country[data-code="${code}"]`)?.classList.add('player-country');
  $('#countrySelect').classList.add('hidden');
  $('#closeSelect').classList.add('hidden');
  $('#campaignLabel').textContent = 'MANDATO · 2026';
  $('#footerFlag').textContent = state.player.flag;
  $('#footerCountry').textContent = state.player.name.toUpperCase();
  selectCountry(code);
  addEvent(`Mandato iniciado. ${state.player.name} assume o comando.`);
  updateUI();
  suppressTip();
}

function openCountrySelect() {
  const active = Boolean(state.player);
  $('#countrySelect').classList.remove('hidden');
  $('#closeSelect').classList.toggle('hidden', !active);
  $('#selectKicker').textContent = active ? 'NOVA CAMPANHA · 2026' : 'CAMPANHA · 2026';
  $('#selectHint').textContent = active ? 'ESCOLHER OUTRA NAÇÃO REINICIA O MANDATO' : 'SELECIONE PARA COMEÇAR';
  $('#mapTip').classList.add('hidden');
  hideToast();
}

function closeCountrySelect() {
  if (!state.player) return;
  $('#countrySelect').classList.add('hidden');
  suppressTip();
}

function selectCountry(code) {
  if (!countries[code]) return;

  if (state.player && state.annexed.has(code)) {
    toast(`${countries[code].name} já foi anexada ao seu território`);
    selectCountry(state.player.code);
    return;
  }

  state.selected = code;
  $$('.country').forEach(element => {
    element.classList.toggle('selected', element.dataset.code === code && !element.classList.contains('owned'));
  });

  const country = code === state.player?.code ? state.player : countries[code];
  const isPlayer = Boolean(state.player && code === state.player.code);
  $('#flag').textContent = country.flag;
  $('#nationName').textContent = country.name;

  if (!state.player) {
    $('#nationSub').textContent = 'Inicie uma campanha para governar';
  } else if (isPlayer) {
    $('#nationSub').textContent = 'NAÇÃO SOB SEU GOVERNO';
  } else {
    const status = state.wars.has(code) ? 'EM GUERRA' : state.deals.has(code) ? 'ACORDO COMERCIAL' : 'PAÍS INDEPENDENTE';
    $('#nationSub').textContent = `${status} · RELAÇÃO ${state.relations[code] ?? 50}`;
  }

  if (state.player && !isPlayer) {
    renderRelationActions(code);
    showPanel('actions');
    setRail('diplomacy');
    $('#selectedActions').classList.add('hidden');
    $('#relationActions').classList.remove('hidden');
    requestAnimationFrame(scrollToDiplomacy);
  } else {
    $('#relationActions').classList.add('hidden');
    $('#selectedActions').classList.remove('hidden');
    $('#selectedActions').textContent = state.player
      ? 'Sua nação. Use as políticas acima ou selecione outro país no mapa.'
      : 'Inicie uma campanha para governar';
    if (state.player) {
      $('#actionsPanel').scrollTop = 0;
      showPanel('overview');
    }
  }
}

function scrollToDiplomacy() {
  const panel = $('#actionsPanel');
  const heading = $('#diplomacyHeading');
  const actions = $('#relationActions');
  if (!panel || !heading || panel.classList.contains('hidden')) return;
  const panelRect = panel.getBoundingClientRect();
  const headingRect = heading.getBoundingClientRect();
  const padding = 6;
  let delta = Math.max(0, headingRect.top - panelRect.top - padding);

  if (actions && !actions.classList.contains('hidden')) {
    const actionsRect = actions.getBoundingClientRect();
    if (actionsRect.height <= panelRect.height - padding * 2) {
      const bottomOverflow = actionsRect.bottom - panelRect.top - (panelRect.height - padding);
      delta = Math.max(delta, bottomOverflow);
    } else {
      delta = Math.max(delta, actionsRect.top - panelRect.top - padding);
    }
  }

  panel.scrollTop += delta;
}

function renderRelationActions(code) {
  const country = countries[code];
  if (!country || !state.player) return;

  const atWar = state.wars.has(code);
  const hasDeal = state.deals.has(code);
  const canAnnex = atWar && state.player.mil > country.mil;
  const cost = annexCost(code);
  const tradeLabel = atWar ? 'Comércio suspenso' : hasDeal ? 'Acordo ativo ✓' : 'Acordo comercial ($5 bi)';
  const aidLabel = atWar ? 'Cooperação suspensa' : 'Propor cooperação ($8 bi)';
  const annexLabel = atWar
    ? canAnnex ? `Anexar território ($${cost} bi)` : 'Anexar (poder militar insuficiente)'
    : 'Anexar território (requer guerra)';
  const warAction = atWar
    ? '<button type="button" data-action="peace">Propor paz</button>'
    : '<button type="button" data-action="war" class="danger">Declarar guerra</button>';

  $('#relationActions').innerHTML = `
    <button type="button" data-action="trade" ${hasDeal || atWar ? 'disabled' : ''}>${tradeLabel}</button>
    <button type="button" data-action="aid" ${atWar ? 'disabled' : ''}>${aidLabel}</button>
    ${warAction}
    <button type="button" data-action="annex" class="danger" ${canAnnex ? '' : 'disabled'} title="${canAnnex ? 'Anexar território' : 'Declare guerra e tenha poder militar superior'}">${annexLabel}</button>`;

  $$('#relationActions [data-action]').forEach(button => {
    button.onclick = () => diplomacy(button.dataset.action, code);
  });
}

function spend(cost) {
  if (!state.player) return false;
  if (state.player.treasury < cost) {
    toast('Tesouro insuficiente para essa medida');
    return false;
  }
  state.player.treasury -= cost;
  return true;
}

function diplomacy(action, code) {
  if (!state.player || code === state.player.code) return;
  if (state.annexed.has(code)) {
    toast(`${countries[code].name} já faz parte do seu território`);
    return;
  }

  const country = countries[code];

  if (action === 'trade') {
    if (state.wars.has(code)) {
      toast('Comércio suspenso durante a guerra');
      return;
    }
    if (state.deals.has(code)) {
      toast('Já existe um acordo comercial com este país');
      return;
    }
    if (!spend(5)) return;
    state.deals.add(code);
    state.relations[code] = Math.min(100, (state.relations[code] ?? 50) + 8);
    state.player.gdp *= 1.002;
    state.player.growth += 0.05;
    normalizePlayer(state.player);
    addEvent(`Acordo comercial firmado com ${country.name}.`);
    toast('Acordo comercial firmado');
  } else if (action === 'aid') {
    if (state.wars.has(code)) {
      toast('Cooperação suspensa durante a guerra');
      return;
    }
    if (!spend(8)) return;
    state.relations[code] = Math.min(100, (state.relations[code] ?? 50) + 12);
    state.player.approval = Math.min(95, state.player.approval + 1);
    addEvent(`Missão de cooperação enviada a ${country.name}.`);
    toast('Cooperação diplomática proposta');
  } else if (action === 'war') {
    if (state.wars.has(code)) {
      toast('Já existe um conflito ativo com este país');
      return;
    }
    state.wars.add(code);
    state.deals.delete(code);
    state.relations[code] = Math.max(0, (state.relations[code] ?? 50) - 55);
    $(`.country[data-code="${code}"]`)?.classList.add('at-war');
    state.player.approval = Math.max(5, state.player.approval - 3);
    addEvent(`Estado de guerra declarado contra ${country.name}.`);
    toast(`Guerra declarada: ${country.name}`);
  } else if (action === 'peace') {
    if (!state.wars.has(code)) {
      toast('Não há guerra ativa com este país');
      return;
    }
    state.wars.delete(code);
    $(`.country[data-code="${code}"]`)?.classList.remove('at-war');
    state.relations[code] = Math.min(100, (state.relations[code] ?? 50) + 15);
    state.player.approval = Math.min(95, state.player.approval + 1);
    addEvent(`Acordo de paz assinado com ${country.name}.`);
    toast(`Paz firmada com ${country.name}`);
  } else if (action === 'annex') {
    if (!state.wars.has(code)) {
      toast('É preciso declarar guerra antes de anexar');
      return;
    }
    if (state.player.mil <= country.mil) {
      toast('Poder militar insuficiente para ocupar este país');
      return;
    }
    const cost = annexCost(code);
    if (!spend(cost)) return;
    state.annexed.add(code);
    state.wars.delete(code);
    state.deals.delete(code);
    state.player.gdp += country.gdp * 0.8;
    state.player.pop += country.pop;
    state.player.approval = Math.max(5, state.player.approval - 8);
    state.player.debt = Math.max(0, state.player.debt + 2);
    const element = $(`.country[data-code="${code}"]`);
    element?.classList.remove('at-war', 'selected');
    element?.classList.add('owned');
    addEvent(`${country.name} capitulou e foi anexada. A ocupação exige estabilidade.`);
    toast(`${country.name} anexada ao território`);
    updateUI();
    selectCountry(state.player.code);
    return;
  }

  updateUI();
  selectCountry(code);
}

function applyPolicy(key, cost, effect, message) {
  if (!state.player) {
    toast('Escolha uma nação para começar');
    return;
  }
  if (state.lastPolicy[key] === state.month) {
    toast('Esta medida já foi aplicada neste mês');
    return;
  }
  if (!spend(cost)) return;
  state.lastPolicy[key] = state.month;
  effect(state.player);
  normalizePlayer(state.player);
  addEvent(message);
  updateUI();
}

$('#stimulus').onclick = () => applyPolicy('stimulus', 20, player => {
  player.growth += 0.8;
  player.debt += 4;
  player.approval += 2;
  player.unemployment = Math.max(1, player.unemployment - 0.4);
}, 'Pacote de estímulo aprovado. Crescimento projetado em alta.');

$('#austerity').onclick = () => applyPolicy('austerity', 10, player => {
  player.debt = Math.max(0, player.debt - 3);
  const inflationCut = Math.min(6, Math.max(0.5, player.inflation * 0.35));
  player.inflation = Math.max(0, player.inflation - inflationCut);
  player.growth -= 0.6;
  player.approval -= 4;
}, 'Programa de ajuste fiscal implementado.');

$('#industry').onclick = () => applyPolicy('industry', 35, player => {
  player.gdp *= 1.015;
  player.unemployment = Math.max(1, player.unemployment - 1.2);
  player.growth += 0.5;
  player.debt += 3;
}, 'Plano industrial de longo prazo anunciado.');

function advanceMonth() {
  if (!state.player) return;
  state.month++;
  const player = state.player;
  const annualNet = (player.growth - 3.1) / 100;
  const monthlyBalance = player.gdp * 1000 * annualNet / 12;
  const warCount = state.wars.size;
  const warUpkeep = warCount * Math.max(0.05, player.gdp * 0.0004);
  const netBalance = monthlyBalance - warUpkeep;

  player.treasury += netBalance;
  if (warCount) player.approval = Math.max(5, player.approval - 0.15 * warCount);
  player.gdp *= 1 + player.growth / 1200;
  player.growth += (player.baseGrowth - player.growth) * 0.04;
  player.inflation += (3 - player.inflation) * 0.03 + (Math.random() - 0.5) * 0.12;
  player.unemployment += (player.baseUnemployment - player.unemployment) * 0.03 + (Math.random() - 0.5) * 0.09;
  player.approval = Math.max(5, Math.min(95, player.approval + (Math.random() - 0.51) * 0.25));
  player.debt = Math.max(0, player.debt + (netBalance < 0 ? Math.abs(netBalance) / (player.gdp * 1000) * 100 : -0.02));

  if (player.treasury < 0) {
    player.growth -= 0.08;
    player.approval -= 0.3;
  }

  normalizePlayer(player);

  const stability = stabilityOf(player);
  if (stability >= 70) {
    state.stableMonths++;
    if (state.stableMonths >= 12 && !state.objectiveDone) {
      state.objectiveDone = true;
      addEvent('Objetivo de mandato alcançado: economia estável por 12 meses.');
      toast('Objetivo de estabilização alcançado!');
    }
  } else {
    state.stableMonths = 0;
  }

  if (state.month % 12 === 0) {
    addEvent(`Relatório anual: PIB ${fmtGDP(player.gdp)}, crescimento de ${player.growth.toFixed(1)}%.`);
  }

  updateUI();
}

function updateUI() {
  if (!state.player) return;
  const player = state.player;
  const stability = stabilityOf(player);
  player.stability = stability;

  $('#topTreasury').textContent = compactMoney(player.treasury);
  $('#topGDP').textContent = fmtGDP(player.gdp);
  $('#topPop').textContent = `${player.pop.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`;
  $('#topStability').textContent = `${stability}/100`;
  $('#gdp').textContent = fmtGDP(player.gdp);
  $('#gdpGrowth').textContent = `${player.growth >= 0 ? '▲ +' : '▼ '}${Math.abs(player.growth).toFixed(1)}%`;
  $('#gdpGrowth').style.color = player.growth >= 0 ? '#9dba8b' : '#d68a78';
  $('#gdpCapita').textContent = `$${Math.round(player.gdp * 1e12 / (player.pop * 1e6)).toLocaleString('pt-BR')}`;
  $('#inflation').textContent = `${player.inflation.toFixed(1)}%`;
  $('#unemployment').textContent = `${player.unemployment.toFixed(1)}%`;
  $('#debt').textContent = `${player.debt.toFixed(0)}% do PIB`;
  $('#stability').textContent = stability;
  $('#stabilityRing').style.borderColor = stability >= 70 ? '#ad9c68' : stability >= 45 ? '#c08c5b' : '#c77765';
  $('#statusLabel').textContent = stability >= 70 ? 'ESTÁVEL' : stability >= 45 ? 'SOB PRESSÃO' : 'EM CRISE';
  $('#approval').textContent = `${Math.round(player.approval)}%`;
  $('#campaignLabel').textContent = `MANDATO · ${2026 + Math.floor(state.month / 12)}`;
  $('#objectiveProgress').textContent = state.objectiveDone ? 'CONCLUÍDO' : `${Math.min(state.stableMonths, 12)}/12 meses`;
  $('#objectiveLine').classList.toggle('done', state.objectiveDone);

  ['stimulus', 'austerity', 'industry'].forEach(key => {
    const button = $(`#${key}`);
    if (!button) return;
    const used = state.lastPolicy[key] === state.month;
    button.disabled = used;
    button.classList.toggle('used', used);
  });

  const dates = dateText();
  $('#dateLabel').textContent = dates.short;
  $('#dateLong').textContent = dates.long;
  $('.next-date b').textContent = dates.next;
  const progress = ((state.month % 12) + 1) / 12 * 100;
  $('.timeline-track span').style.width = `${progress}%`;
  $('.timeline-track i').style.left = `${progress}%`;
}

function addEvent(text) {
  const event = document.createElement('div');
  event.className = 'event';
  const date = document.createElement('small');
  date.textContent = `${dateText().short} · GOVERNO`;
  const body = document.createElement('span');
  body.textContent = text;
  event.append(date, body);
  const list = $('#events');
  if (list.querySelector('.empty-event')) list.innerHTML = '';
  list.prepend(event);
  while (list.children.length > 5) list.lastElementChild.remove();
}

function toast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.add('hidden'), 2600);
}

function hideToast() {
  $('#toast').classList.add('hidden');
  clearTimeout(toastTimer);
}

function setRail(view) {
  $$('.rail-button[data-view]').forEach(button => button.classList.toggle('active', button.dataset.view === view));
}

function showPanel(which) {
  $$('.panel-tab').forEach(button => button.classList.toggle('active', button.dataset.panel === which));
  $('#overviewPanel').classList.toggle('hidden', which !== 'overview');
  $('#actionsPanel').classList.toggle('hidden', which !== 'actions');
  if (which === 'overview') setRail('map');
}

function setZoom(zoom) {
  state.zoom = Math.max(0.75, Math.min(1.7, zoom));
  $('#mapZoom').style.transform = `scale(${state.zoom})`;
  $('#mapZoom').style.transformOrigin = 'center center';
  $('#zoomLabel').textContent = `${Math.round(state.zoom * 100)}%`;
}

function scheduleTick() {
  clearInterval(tickTimer);
  tickTimer = setInterval(() => {
    if (!state.player || state.paused || isOverlayOpen()) return;
    advanceMonth();
  }, 6000 / state.speed);
}

function isOverlayOpen() {
  if (window.matchMedia('(orientation:portrait) and (max-width:900px)').matches) return true;
  return !$('#countrySelect').classList.contains('hidden') || !$('#helpModal').classList.contains('hidden');
}

function togglePause() {
  if (!state.player) {
    toast('Escolha uma nação para começar');
    return;
  }
  state.paused = !state.paused;
  $('#pauseBtn').textContent = state.paused ? '▶' : 'Ⅱ';
  $('#pauseBtn').title = state.paused ? 'Retomar' : 'Pausar';
}

function cycleSpeed() {
  state.speed = state.speed === 1 ? 2 : state.speed === 2 ? 4 : 1;
  $('#speedBtn').textContent = `${state.speed}×`;
  $('#speedBtn').title = `Velocidade ${state.speed}×`;
  scheduleTick();
}

function openHelp() {
  hideToast();
  hideTip();
  $('#helpModal').classList.remove('hidden');
}

function closeHelp() {
  $('#helpModal').classList.add('hidden');
  suppressTip();
}

function suppressTip(duration = 700) {
  tipSuppressedUntil = performance.now() + duration;
  hideTip();
}

function showTip(code, clientX, clientY) {
  if (performance.now() < tipSuppressedUntil) return;
  const country = countries[code];
  if (!country) return;
  const tip = $('#mapTip');
  const isPlayer = Boolean(state.player && code === state.player.code);
  const status = isPlayer ? 'SUA NAÇÃO' : state.annexed.has(code) ? 'TERRITÓRIO ANEXADO' : state.wars.has(code) ? 'EM GUERRA' : state.deals.has(code) ? 'ACORDO COMERCIAL' : 'PAÍS INDEPENDENTE';
  const relation = !state.player || isPlayer || state.annexed.has(code) ? null : (state.relations[code] ?? 50);

  tip.innerHTML = '<b></b><span></span><span></span>';
  tip.querySelector('b').textContent = country.name;
  const spans = tip.querySelectorAll('span');
  spans[0].textContent = `PIB ${fmtGDP(country.gdp)} · POP ${country.pop.toLocaleString('pt-BR')} mi`;
  spans[1].textContent = relation === null ? status : `${status} · RELAÇÃO ${relation}`;
  tip.classList.remove('hidden');

  const stage = $('.map-stage').getBoundingClientRect();
  const tipWidth = tip.offsetWidth;
  const tipHeight = tip.offsetHeight;
  let x = clientX - stage.left + 14;
  let y = clientY - stage.top + 14;
  x = Math.max(8, Math.min(x, stage.width - tipWidth - 8));
  y = Math.max(8, Math.min(y, stage.height - tipHeight - 8));
  tip.style.left = `${x}px`;
  tip.style.top = `${y}px`;
}

function hideTip() {
  $('#mapTip').classList.add('hidden');
}

function bindCountries() {
  $$('.country').forEach(element => {
    const code = element.dataset.code;
    element.setAttribute('tabindex', '0');
    element.setAttribute('role', 'button');
    element.setAttribute('aria-label', countries[code]?.name || code);
    element.addEventListener('click', () => {
      hideTip();
      selectCountry(code);
    });
    element.addEventListener('pointerenter', event => showTip(code, event.clientX, event.clientY));
    element.addEventListener('pointermove', event => showTip(code, event.clientX, event.clientY));
    element.addEventListener('pointerleave', hideTip);
    element.addEventListener('focus', () => {
      const rect = element.getBoundingClientRect();
      showTip(code, rect.left + rect.width / 2, rect.top + rect.height / 2);
    });
    element.addEventListener('blur', hideTip);
    element.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        hideTip();
        selectCountry(code);
      }
    });
  });
}

$$('.panel-tab').forEach(button => {
  button.onclick = () => {
    if (button.dataset.panel === 'overview' && state.player && state.selected !== state.player.code) {
      selectCountry(state.player.code);
      return;
    }
    showPanel(button.dataset.panel);
    if (button.dataset.panel === 'actions' && state.player && state.selected === state.player.code) setRail('economy');
  };
});

$$('.rail-button[data-view]').forEach(button => {
  button.onclick = () => {
    const view = button.dataset.view;
    $$('.rail-button[data-view]').forEach(other => other.classList.toggle('active', other === button));
    if (view === 'map') {
      if (state.player && state.selected !== state.player.code) selectCountry(state.player.code);
      else showPanel('overview');
    } else if (view === 'economy') {
      if (state.player) selectCountry(state.player.code);
      showPanel('actions');
      setRail('economy');
    } else if (view === 'diplomacy') {
      showPanel('actions');
      if (!state.player) toast('Escolha uma nação para começar');
      else if (!state.selected || state.selected === state.player.code) toast('Selecione um país no mapa para negociar');
      else requestAnimationFrame(scrollToDiplomacy);
    } else if (view === 'military') {
      showPanel('actions');
      if (!state.player) toast('Escolha uma nação para começar');
      else if (!state.selected || state.selected === state.player.code) toast('Selecione um país no mapa para consultar opções militares');
      else requestAnimationFrame(scrollToDiplomacy);
    }
  };
});

$('#zoomIn').onclick = () => setZoom(state.zoom + 0.15);
$('#zoomOut').onclick = () => setZoom(state.zoom - 0.15);
$('#centerMap').onclick = () => setZoom(1);

$('#pauseBtn').onclick = togglePause;
$('#speedBtn').onclick = cycleSpeed;
$('#advanceBtn').onclick = () => {
  if (!state.player) {
    toast('Escolha uma nação para começar');
    return;
  }
  advanceMonth();
};

$('#homeBtn').onclick = openCountrySelect;
$('#closeSelect').onclick = closeCountrySelect;
$('#settingsBtn').onclick = openHelp;
$('#helpBtn').onclick = openHelp;
$('#closeHelp').onclick = closeHelp;
$('#closeHelpBottom').onclick = closeHelp;

$('#helpModal').addEventListener('click', event => {
  if (event.target.id === 'helpModal') closeHelp();
});

$('#countrySelect').addEventListener('click', event => {
  if (event.target.id === 'countrySelect') closeCountrySelect();
});

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (!$('#helpModal').classList.contains('hidden')) {
    closeHelp();
    return;
  }
  if (!$('#countrySelect').classList.contains('hidden')) {
    closeCountrySelect();
    return;
  }
  hideTip();
});

makeCards();
bindCountries();
scheduleTick();
