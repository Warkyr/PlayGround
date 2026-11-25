// battle.js — turn-based combat engine
import { Input, wait, clamp, rand, chance, pick } from './util.js';
import { audio } from './audio.js';
import { ui } from './ui.js';
import {
  SKILLS, ITEMS, ENEMIES, STATUS_INFO, ELEMENTS,
  xpToNext, levelUpMember,
} from './data.js';
import {
  setupBattleUI, teardownBattleUI, logMsg, syncHUD, commandMenu,
  skillMenu, itemMenu, targetMenu, drawBattleFrame, battleActorPos, elementColor,
} from './battle-ui.js';

let activeBattle = null;
export function getActiveBattle() { return activeBattle; }

const ARENA_AMBIENT = {
  snow: 'snow', castle: 'embers', night: 'embers', prison: 'embers', shrine: 'dust', temple: 'dust',
};

function makeEnemy(id, index, scale = 1) {
  const d = ENEMIES[id] || ENEMIES.wolf;
  const hp = Math.max(1, Math.round(d.hp * scale));
  return {
    id, name: d.name, isEnemy: true, level: d.boss ? 12 : 3,
    hp, maxHp: hp, mp: d.mp || 0, maxMp: d.mp || 0,
    atk: Math.round(d.atk * scale), def: Math.round(d.def * scale),
    mag: Math.round(d.mag * scale), res: Math.round(d.res * scale),
    spd: d.spd, lck: d.lck,
    xp: d.xp, gold: d.gold, weak: d.weak || [], resist: d.resist || [],
    skills: [...(d.skills || [])], boss: !!d.boss, accent: d.accent,
    scaleBase: d.scale || 5, status: {}, buffs: [], defending: false,
    anim: null, flashT: 0, deadT: 0, bobPhase: index * 1.7,
    x: 0, y: 0, scale: d.scale || 5,
  };
}

function statMult(actor, stat) {
  let m = 1;
  for (const b of actor.buffs || []) {
    if (b.stat === stat && b.turns > 0) m *= b.mult;
  }
  return m;
}

function healActor(actor, amount) {
  const before = actor.hp;
  actor.hp = Math.min(actor.maxHp, actor.hp + Math.max(0, Math.round(amount)));
  return actor.hp - before;
}

function effectColor(fx) {
  switch (fx) {
    case 'fire': case 'fireAll': return '#ff9a4a';
    case 'ice': case 'iceAll': return '#8ad8ff';
    case 'holy': case 'holyAll': return '#ffe6a0';
    case 'dark': return '#b795e8';
    case 'heal': return '#7ddba0';
    case 'buff': case 'shield': return '#ffd27a';
    case 'debuff': return '#c08a8a';
    default: return '#fff3cf';
  }
}

function fxFor(state, fx, targets, source) {
  if (!state.fx) return;
  const color = effectColor(fx);
  const all = fx && fx.endsWith('All');
  const list = all ? targets : targets.slice(0, 3);
  for (const t of list) {
    if (!t) continue;
    const p = battleActorPos(t);
    if (fx === 'slash') {
      state.fx.slash(p.x, p.y, rand(-0.7, 0.7), { len: 110, color });
    } else if (fx === 'quake') {
      state.fx.ring(p.x, p.y + 20, { r0: 10, r1: 90, color: '#c9a44c', width: 4 });
      state.fx.burst(p.x, p.y + 20, { count: 16, colors: ['#9a8258', '#6e5c42'], speedMin: 30, speedMax: 130, gravity: 140 });
    } else if (fx === 'heal') {
      state.fx.burst(p.x, p.y, { count: 14, colors: ['#7ddba0', '#d8ffe0'], speedMin: 15, speedMax: 55, gravity: -50, glow: true });
      state.fx.ring(p.x, p.y, { r0: 8, r1: 55, color });
    } else if (fx === 'shield' || fx === 'buff') {
      state.fx.ring(p.x, p.y, { r0: 8, r1: 52, color });
      state.fx.burst(p.x, p.y, { count: 12, colors: [color, '#ffffff'], speedMin: 10, speedMax: 60, gravity: -30 });
    } else if (fx === 'debuff') {
      state.fx.burst(p.x, p.y, { count: 14, colors: ['#c08a8a', '#8a6a8a'], speedMin: 10, speedMax: 60, gravity: 40 });
    } else {
      state.fx.burst(p.x, p.y, { count: all ? 12 : 20, colors: [color, '#ffffff'], speedMin: 30, speedMax: 160, gravity: 40, glow: true });
      state.fx.ring(p.x, p.y, { r0: 6, r1: all ? 60 : 80, color });
    }
  }
  if (fx === 'quake') state.fx.shake(7, 0.28);
  if (fx === 'holyAll') state.fx.flashScreen('#ffe6a0', 0.25, 0.3);
  if (source) {
    const p = battleActorPos(source);
    if (fx === 'slash') state.fx.slash(p.x + 20, p.y, -0.4, { len: 70, color: '#fff6d8' });
  }
}

function computeDamage(state, attacker, target, sk) {
  const magic = sk.kind === 'mag';
  const atkStat = (magic ? attacker.mag : attacker.atk) * statMult(attacker, 'atk');
  const defStat = (magic ? target.res : target.def) * statMult(target, 'def');
  let base = atkStat * (sk.power || 1) - defStat * 0.62;
  base = Math.max(2, base) * rand(0.9, 1.1);
  let mult = 1;
  const element = sk.element || 'none';
  if ((target.weak || []).includes(element)) mult *= 1.55;
  if ((target.resist || []).includes(element)) mult *= 0.55;
  if (target.defending) mult *= 0.5;
  const crit = chance(0.04 + (attacker.lck || 0) * 0.006);
  if (crit) mult *= 1.65;
  return { amount: Math.max(1, Math.round(base * mult)), crit, element };
}

function damageTarget(state, source, target, amount, opts = {}) {
  if (!target || target.hp <= 0) return 0;
  target.hp = Math.max(0, target.hp - amount);
  target.flashT = 0.24;
  const p = battleActorPos(target);
  state.fx.number(p.x, p.y, String(amount), {
    color: opts.color || elementColor(opts.element || 'none'),
    crit: !!opts.crit,
    size: opts.crit ? 34 : 26,
  });
  if (opts.crit) {
    state.fx.ring(p.x, p.y, { r0: 8, r1: 70, color: '#ffe6a0', width: 4 });
    state.fx.shake(6, 0.22);
  }
  if (target.hp <= 0) {
    logMsg(state, `${target.name} cai.`);
    target.status = {};
    target.buffs = [];
    target.defending = false;
    audio.sfx('defeat');
  }
  return amount;
}

function healTarget(state, target, amount) {
  if (!target) return 0;
  const healed = healActor(target, amount);
  if (healed > 0) {
    const p = battleActorPos(target);
    state.fx.number(p.x, p.y, `+${healed}`, { color: '#8affb0', size: 24 });
  }
  return healed;
}

function opponentsOf(state, actor) {
  return actor.isEnemy ? state.allies : state.enemies;
}
function alliesOf(state, actor) {
  return actor.isEnemy ? state.enemies : state.allies;
}

function resolveTargets(state, actor, sk, chosen) {
  const opp = opponentsOf(state, actor);
  const allies = alliesOf(state, actor);
  switch (sk.target) {
    case 'enemy': {
      if (chosen) return [chosen];
      const alive = opp.filter((a) => a.hp > 0);
      return alive.length ? [pick(alive)] : [];
    }
    case 'allEnemies': return opp.filter((a) => a.hp > 0);
    case 'ally': {
      if (chosen) return [chosen];
      const alive = allies.filter((a) => a.hp > 0);
      alive.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
      return alive.length ? [alive[0]] : [];
    }
    case 'allAllies': return allies.filter((a) => a.hp > 0);
    case 'self': return [actor];
    case 'deadAlly': {
      if (chosen) return [chosen];
      const dead = allies.filter((a) => a.hp <= 0);
      return dead.length ? [dead[0]] : [];
    }
    default: return [];
  }
}

function applyBuff(actor, buff) {
  if (!buff) return;
  actor.buffs = (actor.buffs || []).filter((b) => !(b.stat === buff.stat && b.mult === buff.mult));
  actor.buffs.push({ stat: buff.stat, mult: buff.mult, turns: buff.turns });
}

async function performSkill(state, actor, sid, chosen = null, auto = false) {
  const sk = SKILLS[sid];
  if (!sk) return;
  if (sk.cost && actor.mp < sk.cost) {
    if (!auto) ui.toast('MP insuficiente.', 'red', '✦');
    return;
  }
  if (sk.cost) actor.mp = Math.max(0, actor.mp - sk.cost);
  state.phase = 'action';
  state.current = actor;
  actor.anim = { t: 0, dur: 0.34, dx: actor.isEnemy ? -30 : 34 };
  audio.sfx(sk.sfx || 'hit');
  logMsg(state, `${actor.name} usa <b>${sk.name}</b>!`);
  syncHUD(state);
  await wait(300);

  const targets = resolveTargets(state, actor, sk, chosen);
  fxFor(state, sk.fx, targets.length ? targets : [actor], actor);

  if (sk.kind === 'phys' || sk.kind === 'mag') {
    for (const target of targets) {
      const { amount, crit, element } = computeDamage(state, actor, target, sk);
      damageTarget(state, actor, target, amount, { crit, element });
      if (sk.drain) healTarget(state, actor, amount * sk.drain);
      if (sk.healSelf) healTarget(state, actor, amount * sk.healSelf);
      if (sk.status && target.hp > 0 && chance(sk.status.chance || 0)) {
        target.status[sk.status.id] = { turns: sk.status.turns || 1 };
        const info = STATUS_INFO[sk.status.id];
        logMsg(state, `${target.name} sofre ${info?.name || sk.status.id}.`);
      }
    }
    if (sk.kind === 'mag') await wait(140);
  } else if (sk.kind === 'heal' || sk.kind === 'healAll') {
    const power = (sk.heal || 0) + (actor.mag || 0) * (sk.healMag || 0);
    for (const target of targets) {
      if (target.hp <= 0) continue;
      healTarget(state, target, power);
      if (sk.cleanse) target.status = {};
    }
    audio.sfx('heal');
  } else if (sk.kind === 'revive') {
    for (const target of targets) {
      if (target.hp > 0) continue;
      target.hp = Math.max(1, Math.round(target.maxHp * (sk.revive || 0.5)));
      target.status = {};
      target.buffs = [];
      const p = battleActorPos(target);
      state.fx.ring(p.x, p.y, { r0: 10, r1: 80, color: '#ffe6a0', width: 4 });
      state.fx.number(p.x, p.y, 'RENASCER', { color: '#ffe6a0', size: 22 });
      logMsg(state, `${target.name} retorna à luz.`);
    }
    audio.sfx('holy');
  } else if (sk.kind === 'buff' || sk.kind === 'debuff') {
    for (const target of targets) {
      applyBuff(target, sk.buff);
      if (sk.regen) target.buffs.push({ stat: 'regen', mult: sk.regen, turns: sk.buff?.turns || 3 });
    }
    audio.sfx(sk.sfx || 'buff');
  }

  syncHUD(state);
  await wait(340);
}

async function basicAttack(state, actor, target) {
  const sk = { name: 'Ataque', kind: 'phys', power: 1, element: 'none', fx: 'slash', sfx: 'hit' };
  state.phase = 'action';
  state.current = actor;
  actor.anim = { t: 0, dur: 0.3, dx: actor.isEnemy ? -30 : 34 };
  audio.sfx('hit');
  logMsg(state, `${actor.name} ataca!`);
  syncHUD(state);
  await wait(250);
  fxFor(state, 'slash', [target], actor);
  const { amount, crit, element } = computeDamage(state, actor, target, sk);
  damageTarget(state, actor, target, amount, { crit, element });
  syncHUD(state);
  await wait(320);
}

async function pickPlayerTarget(state, actor, sk) {
  if (sk.target === 'enemy') {
    return await targetMenu(state, { side: 'enemy' });
  }
  if (sk.target === 'ally') {
    return await targetMenu(state, { side: 'ally' });
  }
  if (sk.target === 'deadAlly') {
    const dead = state.allies.filter((m) => m.hp <= 0);
    if (!dead.length) { ui.toast('Nenhum aliado caído.', 'red', '✚'); return undefined; }
    const t = await targetMenu(state, { side: 'ally', allowDead: true });
    if (!t) return null;
    if (t.hp > 0) { ui.toast('Escolha um aliado caído.', 'red', '✚'); return undefined; }
    return t;
  }
  return null;
}

async function useBattleItem(state, actor, id) {
  const it = ITEMS[id];
  const game = state.game;
  if (!it || !game.inventory[id]) return false;
  let targets = [];
  if (it.target === 'ally') {
    const t = await targetMenu(state, { side: 'ally', allowDead: false });
    if (!t) return false;
    targets = [t];
  } else if (it.target === 'allEnemies') {
    targets = state.enemies.filter((e) => e.hp > 0);
  } else {
    targets = [actor];
  }
  logMsg(state, `${actor.name} usa <b>${it.name}</b>.`);
  if (it.heal) {
    for (const t of targets) {
      if (t.hp >= t.maxHp) { ui.toast(`${t.name} já está com HP cheio.`, '', '♥'); return false; }
      healTarget(state, t, it.heal);
    }
  }
  if (it.mp) {
    for (const t of targets) {
      if (t.mp >= t.maxMp) { ui.toast(`${t.name} já está com MP cheio.`, '', '✦'); return false; }
      t.mp = Math.min(t.maxMp, t.mp + it.mp);
      const p = battleActorPos(t);
      state.fx.number(p.x, p.y, `+${it.mp} MP`, { color: '#8ac8ff', size: 20 });
    }
  }
  if (it.cure) for (const t of targets) t.status = {};
  if (it.full) {
    for (const t of targets) {
      t.hp = t.maxHp; t.mp = t.maxMp; t.status = {};
      const p = battleActorPos(t);
      state.fx.ring(p.x, p.y, { r0: 10, r1: 70, color: '#ffe6a0', width: 3 });
    }
  }
  if (it.damage) {
    for (const t of targets) {
      damageTarget(state, actor, t, it.damage, { color: '#ff9a4a' });
      state.fx.burst(battleActorPos(t).x, battleActorPos(t).y, { count: 18, colors: ['#ff9a4a', '#ffd27a'], speedMin: 40, speedMax: 170 });
    }
    state.fx.shake(6, 0.25);
  }
  if (it.flee) {
    state.fleeResult = true;
    logMsg(state, 'A fumaça cobre a fuga.');
    audio.sfx('flee');
  }
  game.inventory[id]--;
  if (game.inventory[id] <= 0) delete game.inventory[id];
  audio.sfx(it.heal ? 'heal' : it.damage ? 'fire' : 'buff');
  syncHUD(state);
  await wait(320);
  return true;
}

async function allyTurn(state, actor) {
  while (true) {
    state.phase = 'command';
    state.current = actor;
    syncHUD(state);
    const cmd = await commandMenu(state, actor);
    if (cmd === 'attack') {
      state.phase = 'target';
      const target = await targetMenu(state, { side: 'enemy' });
      if (!target) continue;
      await basicAttack(state, actor, target);
      return;
    }
    if (cmd === 'skill') {
      const sid = await skillMenu(state, actor);
      if (!sid) continue;
      const sk = SKILLS[sid];
      if (actor.mp < sk.cost) { ui.toast('MP insuficiente.', 'red', '✦'); continue; }
      state.phase = 'target';
      const target = await pickPlayerTarget(state, actor, sk);
      if (target === null) continue;
      await performSkill(state, actor, sid, target);
      return;
    }
    if (cmd === 'item') {
      const id = await itemMenu(state, state.game);
      if (!id) continue;
      const used = await useBattleItem(state, actor, id);
      if (used) return;
      continue;
    }
    if (cmd === 'defend') {
      actor.defending = true;
      audio.sfx('guard');
      logMsg(state, `${actor.name} ergue a guarda.`);
      const p = battleActorPos(actor);
      state.fx.ring(p.x, p.y, { r0: 8, r1: 50, color: '#8ac8ff' });
      syncHUD(state);
      await wait(260);
      return;
    }
    if (cmd === 'flee') {
      if (!state.canFlee) {
        ui.toast('Não é possível fugir desta batalha.', 'red', '➜');
        continue;
      }
      const ok = chance(0.55 + (actor.lck || 0) * 0.01);
      audio.sfx(ok ? 'flee' : 'cancel');
      if (ok) {
        state.fleeResult = true;
        logMsg(state, 'O grupo escapa.');
        await wait(400);
        return 'flee';
      }
      logMsg(state, 'A fuga falhou!');
      await wait(300);
      return;
    }
  }
}

async function enemyTurn(state, actor) {
  const usable = actor.skills.map((id) => ({ id, sk: SKILLS[id] })).filter((s) => s.sk);
  let choice = null;
  if (actor.hp < actor.maxHp * 0.42) {
    choice = usable.find((s) => s.sk.kind === 'heal');
  }
  if (!choice && chance(0.16)) choice = { id: null, sk: { name: 'Ataque', kind: 'phys', power: 1, element: 'none', fx: 'slash', sfx: 'hit' } };
  if (!choice) choice = usable.length ? pick(usable) : null;
  if (!choice) {
    const target = pick(state.allies.filter((a) => a.hp > 0));
    if (target) await basicAttack(state, actor, target);
    return;
  }
  if (!choice.id) {
    const target = pick(state.allies.filter((a) => a.hp > 0));
    if (target) await basicAttack(state, actor, target);
    return;
  }
  await performSkill(state, actor, choice.id, null, true);
}

function tickStart(state, actor) {
  actor.defending = false;
  if (actor.status.burn) {
    const dmg = Math.max(1, Math.round(actor.maxHp * 0.055));
    damageTarget(state, null, actor, dmg, { color: '#ff9a4a' });
    logMsg(state, `${actor.name} queima (${dmg}).`);
  }
  if (actor.status.poison) {
    const dmg = Math.max(1, Math.round(actor.maxHp * 0.07));
    damageTarget(state, null, actor, dmg, { color: '#8ae08a' });
    logMsg(state, `${actor.name} sofre com o veneno (${dmg}).`);
  }
  const regenBuffs = (actor.buffs || []).filter((b) => b.stat === 'regen');
  for (const b of regenBuffs) {
    const healed = healActor(actor, actor.maxHp * (b.mult || 0.06));
    if (healed > 0) {
      const p = battleActorPos(actor);
      state.fx.number(p.x, p.y, `+${healed}`, { color: '#8affb0', size: 20 });
    }
  }
  if (actor.status.stun && actor.status.stun.turns > 0) {
    actor.status.stun.turns--;
    if (actor.status.stun.turns <= 0) delete actor.status.stun;
    logMsg(state, `${actor.name} está atordoado e perde o turno.`);
    return true;
  }
  return false;
}

function endTurnStatus(actor) {
  for (const id of Object.keys(actor.status || {})) {
    if (id === 'stun') continue;
    actor.status[id].turns--;
    if (actor.status[id].turns <= 0) delete actor.status[id];
  }
  for (const b of actor.buffs || []) b.turns--;
  actor.buffs = (actor.buffs || []).filter((b) => b.turns > 0);
}

function beginRound(state) {
  state.round++;
  const combatants = [
    ...state.allies.filter((a) => a.hp > 0),
    ...state.enemies.filter((e) => e.hp > 0),
  ];
  state.order = combatants.sort((a, b) => (b.spd + rand(0, 4)) - (a.spd + rand(0, 4)));
  state.turnIndex = 0;
}

function allDead(list) { return list.every((a) => a.hp <= 0); }

async function runBattleLoop(state) {
  state.round = 0;
  state.turnIndex = 0;
  state.order = [];
  while (true) {
    if (allDead(state.enemies)) return 'victory';
    if (allDead(state.allies)) return 'defeat';
    if (state.fleeResult) return 'flee';
    if (!state.order.length || state.turnIndex >= state.order.length) beginRound(state);
    const actor = state.order[state.turnIndex];
    if (!actor) { state.turnIndex++; continue; }
    if (actor.hp <= 0) { state.turnIndex++; continue; }
    state.current = actor;
    state.phase = actor.isEnemy ? 'enemy' : 'command';
    syncHUD(state);
    await wait(actor.isEnemy ? 260 : 90);
    const skipped = tickStart(state, actor);
    syncHUD(state);
    if (!skipped) {
      if (actor.isEnemy) await enemyTurn(state, actor);
      else {
        const r = await allyTurn(state, actor);
        if (r === 'flee') return 'flee';
      }
    }
    endTurnStatus(actor);
    syncHUD(state);
    state.turnIndex++;
    await wait(120);
    if (allDead(state.enemies)) return 'victory';
    if (allDead(state.allies)) return 'defeat';
    if (state.fleeResult) return 'flee';
  }
}

function resetBattle(state) {
  state.enemies = state.enemyIds.map((id, i) => makeEnemy(id, i, state.enemyScale));
  for (const m of state.allies) {
    m.hp = m.maxHp;
    m.mp = m.maxMp;
    m.status = {};
    m.buffs = [];
    m.defending = false;
    m.flashT = 0;
    m.anim = null;
  }
  state.logMsgs = [];
  state.order = [];
  state.turnIndex = 0;
  state.round = 0;
  state.current = null;
  state.phase = 'command';
  state.fleeResult = false;
  if (state.fx) state.fx.clear();
  setupBattleUI(state);
}

async function victory(state) {
  const game = state.game;
  const xp = state.enemies.reduce((n, e) => n + (e.xp || 0), 0);
  const gold = state.enemies.reduce((n, e) => n + (e.gold || 0), 0);
  game.gold += gold;
  game.battlesWon = (game.battlesWon || 0) + 1;
  const levelUps = [];
  for (const m of game.party) {
    if (m.hp <= 0) m.hp = Math.max(1, Math.round(m.maxHp * 0.15));
    m.xp += xp;
    while (m.xp >= xpToNext(m.level) && m.level < 60) {
      m.xp -= xpToNext(m.level);
      const gains = levelUpMember(m, 1);
      levelUps.push({ member: m, gains });
    }
  }
  for (const m of game.party) {
    m.status = {}; m.buffs = []; m.defending = false; m.flashT = 0; m.anim = null;
  }
  audio.playMusic('victory', { restart: true });
  audio.sfx('victory');
  const lvHtml = levelUps.length
    ? `<div class="levelup-list">${levelUps.map(({ member, gains }) => {
        const g = gains[0];
        const newSkills = g.newSkills.map((sid) => SKILLS[sid]?.name).filter(Boolean);
        return `<div class="levelup-row"><b>${member.name}</b> alcançou o nível ${member.level}!${newSkills.length ? `<span class="newskill">Nova habilidade: ${newSkills.join(', ')}</span>` : ''}</div>`;
      }).join('')}</div>`
    : '';
  await ui.modal({
    kicker: 'Vitória',
    title: 'A aurora resiste',
    sub: `+${xp} XP · +${gold} ◈`,
    body: `<p style="font-size:18px;color:#c9c5b8;text-align:center">A poeira baixa. O caminho continua.</p>${lvHtml}`,
    actions: [{ label: 'Continuar', value: 'ok', primary: true }],
  });
  if (levelUps.length) audio.sfx('levelup');
  syncHUD(state);
  ui.updateHUD(game);
}

async function defeat(state) {
  audio.playMusic('defeat', { restart: true });
  audio.sfx('defeat');
  const choice = await ui.modal({
    kicker: 'Derrota',
    title: 'A aurora se apagou',
    sub: 'Mas o amanhecer insiste.',
    body: '<p style="font-size:18px;color:#c9c5b8;text-align:center">Kael cai. Por um instante, não há mais nada — só o eco de uma promessa.<br><br>Você pode tentar novamente ou voltar ao título.</p>',
    actions: [
      { label: 'Tentar novamente', value: 'retry', primary: true },
      { label: 'Voltar ao título', value: 'title', cancel: true },
    ],
  });
  return choice;
}

export async function startBattle(game, ids, opts = {}) {
  const state = {
    game,
    allies: game.party,
    enemies: [],
    enemyIds: ids,
    enemyScale: opts.scale || 1,
    ctx: document.getElementById('game').getContext('2d'),
    w: window.innerWidth, h: window.innerHeight,
    bg: opts.bg || 'forest',
    ambient: opts.ambient || ARENA_AMBIENT[opts.bg] || 'dust',
    canFlee: opts.canFlee !== false,
    time: 0, lastTime: 0,
    current: null, phase: 'command', round: 0,
    order: [], turnIndex: 0,
    log: [], logMsgs: [],
    fx: null, hoverTarget: null,
    fleeResult: false,
  };
  activeBattle = state;
  state.enemies = ids.map((id, i) => makeEnemy(id, i, state.enemyScale));
  setupBattleUI(state);
  audio.playMusic(opts.boss ? 'boss' : 'battle', { restart: true });
  logMsg(state, opts.intro || 'O inimigo bloqueia o caminho!');
  syncHUD(state);
  await wait(450);

  let outcome = 'ok';
  while (true) {
    const result = await runBattleLoop(state);
    if (result === 'victory') {
      await victory(state);
      break;
    }
    if (result === 'flee') {
      audio.sfx('flee');
      logMsg(state, 'O grupo recua.');
      await wait(400);
      outcome = 'flee';
      break;
    }
    const choice = await defeat(state);
    if (choice === 'retry') {
      resetBattle(state);
      audio.playMusic(opts.boss ? 'boss' : 'battle', { restart: true });
      logMsg(state, 'A aurora responde. Levante-se.');
      syncHUD(state);
      await wait(500);
      continue;
    }
    teardownBattleUI();
    activeBattle = null;
    return 'title';
  }

  teardownBattleUI();
  activeBattle = null;
  audio.stopMusic(0.3);
  return outcome;
}
