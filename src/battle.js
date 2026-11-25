/* =========================================================================
   AURORA PARTIDA — turn-based battle logic
   ========================================================================= */
'use strict';

const BATTLE_COMMANDS = [
  { id: 'attack', label: 'Atacar', symbol: '⚔' },
  { id: 'skill', label: 'Habilidade', symbol: '✦' },
  { id: 'item', label: 'Item', symbol: '✚' },
  { id: 'guard', label: 'Defender', symbol: '⛨' },
  { id: 'flee', label: 'Fugir', symbol: '➜' }
];

function deepCopy(v) { return JSON.parse(JSON.stringify(v)); }
function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

function makeEnemy(key) {
  const d = ENEMIES[key];
  if (!d) throw new Error('Unknown enemy ' + key);
  return {
    key, name: d.name, kind: d.kind, hp: d.hp, maxHp: d.hp, mp: d.mp, maxMp: d.mp,
    atk: d.atk, def: d.def, mag: d.mag, spd: d.spd,
    xp: d.xp, gold: d.gold, size: d.size, boss: !!d.boss, color: d.color,
    atkUp: 0, defUp: 0, guard: false, enraged: false,
    dead: false, deathAt: 0, flashAt: -99, lungeAt: -99, lungeDir: 1,
    lastSkill: '', intro: d.intro
  };
}

function startBattle(opts) {
  return new Promise(async (resolve) => {
    const prevTrack = AUDIO.trackName;
    const config = Object.assign({ canFlee: true, bg: 'forest' }, opts);
    const snapshot = { party: deepCopy(G.state.party), items: deepCopy(G.state.items) };
    G.scene = 'battle';
    document.body.classList.add('hide-touch');
    const arena = {
      config, snapshot, prevTrack, resolved: false,
      time: 0, turn: 1, party: G.state.party,
      enemies: config.enemies.map(makeEnemy),
      chooser: null, acceptInput: false, activeHero: null,
      log: [], popups: [], effects: [], particles: [],
      shake: 0, flash: 0, mode: 'intro', announce: null,
      totalXp: 0, totalGold: 0, rewards: null, victoryResolve: null,
      defeatResolve: null, defeatIndex: 0, fled: false, usedPhase2: false,
      introT: 0, toTitle: false, targetHint: ''
    };
    G.battle = arena;
    const boss = arena.enemies.some(e => e.boss);
    AUDIO.playTrack(boss ? 'boss' : 'battle');
    for (const h of arena.party) { h.guard = false; h.atkUp = 0; h.defUp = 0; h.atkDown = 0; }
    arena.announce = {
      title: config.title || (boss ? arena.enemies[0].name.toUpperCase() : 'EMBOSCADA'),
      line: config.quote || (boss ? arena.enemies[0].intro : (arena.enemies[0].intro || 'Inimigos bloqueiam o caminho.')),
      t: 0, dur: 2.4
    };
    if (boss) AUDIO.sfx('boss');

    try {
      const result = await battleRun(arena);
      cleanupBattle(arena, result);
      if (arena.toTitle) { if (typeof goTitle === 'function') goTitle(); }
      resolve(result);
    } catch (err) {
      console.error('Battle error', err);
      cleanupBattle(arena, 'error');
      resolve('error');
    }
  });
}

function cleanupBattle(arena, result) {
  if (G.battle === arena) G.battle = null;
  if (G.scene === 'battle') G.scene = 'world';
  document.body.classList.remove('hide-touch');
  for (const h of G.state.party) { h.guard = false; h.atkUp = 0; h.defUp = 0; h.atkDown = 0; }
  if (arena.bg !== 'none') {
    const music = arena.config.restoreMusic || (G.map && MAPS[G.map] ? MAPS[G.map].music : 'village');
    AUDIO.playTrack(music || 'village');
  }
  if (result === 'win') { try { if (typeof saveGame === 'function') saveGame(true); } catch (e) {} }
}

async function battleRun(arena) {
  await wait(arena.config.fastIntro ? 300 : 900);
  arena.mode = 'fight';
  while (true) {
    arena.turnStart = true;
    for (const h of arena.party) h.guard = false;
    arena.acceptInput = false;
    arena.chooser = null;
    for (const h of arena.enemies) h.guard = false;
    const actions = [];
    arena.mode = 'command';
    let aborted = false;
    for (const hero of arena.party) {
      if (hero.hp <= 0) continue;
      if (arena.fled) { aborted = true; break; }
      const action = await chooseAction(arena, hero);
      if (arena.fled) { aborted = true; break; }
      if (action) actions.push(action);
    }
    arena.activeHero = null;
    arena.chooser = null;
    arena.acceptInput = false;
    if (arena.fled) return 'flee';
    arena.mode = 'anim';
    for (const action of actions) {
      if (arena.fled) return 'flee';
      if (action.actor.hp <= 0) continue;
      if (allEnemiesDead(arena)) break;
      await executeAction(arena, action);
    }
    if (arena.fled) return 'flee';
    if (allEnemiesDead(arena)) {
      if (arena.config.phase2 && !arena.usedPhase2) {
        await runPhase2(arena);
        continue;
      }
      return await victory(arena);
    }
    if (allPartyDead(arena)) {
      const choice = await showDefeat(arena);
      if (choice === 'retry') {
        resetForRetry(arena);
        continue;
      }
      return 'lose';
    }
    // turno inimigo
    arena.mode = 'enemy';
    for (const enemy of arena.enemies) {
      if (enemy.dead) continue;
      if (allPartyDead(arena)) break;
      await enemyAct(arena, enemy);
      await wait(arena.config.enemyDelay || 260);
    }
    // status
    for (const u of [...arena.party, ...arena.enemies]) {
      if (u.atkUp > 0) u.atkUp--;
      if (u.defUp > 0) u.defUp--;
      if (u.atkDown > 0) u.atkDown--;
    }
    if (allPartyDead(arena)) {
      const choice = await showDefeat(arena);
      if (choice === 'retry') { resetForRetry(arena); continue; }
      return 'lose';
    }
    arena.turn++;
    await wait(220);
  }
}

function resetForRetry(arena) {
  const s = arena.snapshot;
  for (let i = 0; i < G.state.party.length; i++) {
    Object.assign(G.state.party[i], deepCopy(s.party[i]));
  }
  arena.party = G.state.party;
  G.state.items = deepCopy(s.items);
  arena.enemies = arena.config.enemies.map(makeEnemy);
  arena.turn = 1; arena.usedPhase2 = false; arena.fled = false;
  arena.mode = 'fight'; arena.acceptInput = false; arena.chooser = null;
  arena.popups = []; arena.effects = []; arena.particles = []; arena.log = [];
  arena.totalXp = 0; arena.totalGold = 0; arena.rewards = null;
  for (const h of arena.party) { h.guard = false; h.atkUp = 0; h.defUp = 0; h.atkDown = 0; }
  arena.announce = { title: 'DE NOVO', line: 'A aurora não desiste tão fácil.', t: 0, dur: 1.6 };
}

function allEnemiesDead(a) { return a.enemies.every(e => e.dead || e.hp <= 0); }
function allPartyDead(a) { return a.party.every(h => h.hp <= 0); }
function livingEnemies(a) { return a.enemies.filter(e => !e.dead && e.hp > 0); }
function livingParty(a) { return a.party.filter(h => h.hp > 0); }

/* -------------------------------------------------------------- escolhas */
function chooseAction(arena, hero) {
  return new Promise(resolve => {
    arena.activeHero = hero;
    arena.acceptInput = true;
    arena.chooser = {
      hero, resolve, mode: 'command', idx: 0, skillIdx: 0, itemIdx: 0,
      targetSide: 'enemy', targetIdx: 0, pending: null, prevMode: 'command', msg: ''
    };
    arena.mode = 'command';
  });
}

function resolveChoice(arena, action) {
  if (!arena.chooser) return;
  const r = arena.chooser.resolve;
  arena.chooser = null;
  arena.acceptInput = false;
  r(action);
}

function commandOptions(arena) {
  return BATTLE_COMMANDS.map(c => ({
    ...c,
    disabled: c.id === 'flee' && (!arena.config.canFlee || arena.enemies.some(e => e.boss && !e.dead))
  }));
}

function battlePickCommand(arena, idx) {
  const ch = arena.chooser;
  if (!ch || !arena.acceptInput) return;
  const opts = commandOptions(arena);
  const cmd = opts[idx];
  if (!cmd) return;
  if (cmd.disabled) {
    AUDIO.sfx('error');
    ch.msg = cmd.id === 'flee' ? 'Não há fuga deste confronto.' : 'Indisponível.';
    return;
  }
  AUDIO.sfx('confirm');
  if (cmd.id === 'attack') {
    if (!livingEnemies(arena).length) return;
    startTargeting(arena, 'enemy', (target) => ({ kind: 'attack', actor: ch.hero, target }));
  } else if (cmd.id === 'skill') {
    ch.prevMode = 'command'; ch.mode = 'skill'; ch.skillIdx = 0;
  } else if (cmd.id === 'item') {
    ch.prevMode = 'command'; ch.mode = 'item'; ch.itemIdx = 0;
  } else if (cmd.id === 'guard') {
    resolveChoice(arena, { kind: 'guard', actor: ch.hero });
  } else if (cmd.id === 'flee') {
    resolveChoice(arena, { kind: 'flee', actor: ch.hero });
  }
}

function startTargeting(arena, side, confirmFn) {
  const ch = arena.chooser;
  if (!ch) return;
  ch.prevMode = ch.mode;
  ch.mode = 'target';
  ch.targetSide = side;
  ch.targetIdx = firstAliveIndex(arena, side);
  ch.confirmTarget = confirmFn;
  AUDIO.sfx('cursor');
}

function firstAliveIndex(arena, side) {
  if (side === 'enemy') return arena.enemies.findIndex(e => !e.dead && e.hp > 0);
  return arena.party.findIndex(h => h.hp > 0);
}

function battlePickSkill(arena, id) {
  const ch = arena.chooser;
  if (!ch) return;
  const sk = SKILLS[id];
  if (!sk) return;
  if (ch.hero.mp < sk.cost) { AUDIO.sfx('error'); ch.msg = 'MP insuficiente.'; return; }
  AUDIO.sfx('confirm');
  ch.pending = { kind: 'skill', skillId: id, actor: ch.hero };
  if (sk.target === 'enemy') {
    startTargeting(arena, 'enemy', (target) => ({ ...ch.pending, target }));
  } else if (sk.target === 'ally') {
    startTargeting(arena, 'ally', (target) => ({ ...ch.pending, target }));
  } else {
    resolveChoice(arena, { ...ch.pending });
  }
}

function battlePickItem(arena, key) {
  const ch = arena.chooser;
  if (!ch) return;
  if (!G.state.items[key]) return;
  AUDIO.sfx('confirm');
  ch.pending = { kind: 'item', itemKey: key, actor: ch.hero };
  startTargeting(arena, 'ally', (target) => ({ ...ch.pending, target }));
}

function battlePickTarget(arena, index) {
  const ch = arena.chooser;
  if (!ch || ch.mode !== 'target') return;
  if (ch.targetSide === 'enemy') {
    const e = arena.enemies[index];
    if (!e || e.dead) return;
  } else {
    const h = arena.party[index];
    if (!h || h.hp <= 0) return;
  }
  ch.targetIdx = index;
  AUDIO.sfx('confirm');
  const target = ch.targetSide === 'enemy' ? arena.enemies[index] : arena.party[index];
  const action = ch.confirmTarget ? ch.confirmTarget(target) : null;
  if (action) resolveChoice(arena, action);
}

function battleBack(arena) {
  const ch = arena.chooser;
  if (!ch) return;
  AUDIO.sfx('cancel');
  if (ch.mode === 'target') {
    ch.mode = ch.prevMode === 'target' ? 'command' : (ch.prevMode || 'command');
    ch.pending = null;
    ch.msg = '';
  } else if (ch.mode === 'skill' || ch.mode === 'item') {
    ch.mode = 'command';
    ch.pending = null;
    ch.msg = '';
  }
}

function battleKeyboard(arena) {
  const ch = arena.chooser;
  if (!ch || !arena.acceptInput) return;
  const p = G.pressed;
  if (ch.mode === 'command') {
    const n = BATTLE_COMMANDS.length;
    if (p.left) { ch.idx = ch.idx % 2 === 1 ? ch.idx - 1 : ch.idx; AUDIO.sfx('cursor'); }
    if (p.right) { ch.idx = ch.idx % 2 === 0 && ch.idx + 1 < n ? ch.idx + 1 : ch.idx; AUDIO.sfx('cursor'); }
    if (p.up) { if (ch.idx - 2 >= 0) ch.idx -= 2; else ch.idx = Math.max(0, n - 1 - (n % 2 === 0 ? 0 : 0)); AUDIO.sfx('cursor'); }
    if (p.down) { if (ch.idx + 2 < n) ch.idx += 2; AUDIO.sfx('cursor'); }
    if (p.action) battlePickCommand(arena, ch.idx);
    if (p.cancel) AUDIO.sfx('cancel');
  } else if (ch.mode === 'skill') {
    const ids = [...new Set(ch.hero.skills)];
    if (p.up) { ch.skillIdx = (ch.skillIdx + ids.length - 1) % ids.length; AUDIO.sfx('cursor'); }
    if (p.down) { ch.skillIdx = (ch.skillIdx + 1) % ids.length; AUDIO.sfx('cursor'); }
    if (p.action) battlePickSkill(arena, ids[ch.skillIdx]);
    if (p.cancel) battleBack(arena);
  } else if (ch.mode === 'item') {
    const keys = Object.keys(G.state.items).filter(k => G.state.items[k] > 0);
    if (!keys.length) { if (p.cancel) battleBack(arena); return; }
    if (p.up) { ch.itemIdx = (ch.itemIdx + keys.length - 1) % keys.length; AUDIO.sfx('cursor'); }
    if (p.down) { ch.itemIdx = (ch.itemIdx + 1) % keys.length; AUDIO.sfx('cursor'); }
    if (p.action) battlePickItem(arena, keys[ch.itemIdx]);
    if (p.cancel) battleBack(arena);
  } else if (ch.mode === 'target') {
    const list = ch.targetSide === 'enemy' ? arena.enemies : arena.party;
    const alive = list.map((u, i) => ({ u, i })).filter(o => ch.targetSide === 'enemy' ? (!o.u.dead && o.u.hp > 0) : o.u.hp > 0);
    if (!alive.length) { battleBack(arena); return; }
    let pos = alive.findIndex(o => o.i === ch.targetIdx);
    if (pos < 0) pos = 0;
    if (p.left || p.up) { pos = (pos + alive.length - 1) % alive.length; AUDIO.sfx('cursor'); }
    if (p.right || p.down) { pos = (pos + 1) % alive.length; AUDIO.sfx('cursor'); }
    ch.targetIdx = alive[pos].i;
    if (p.action) battlePickTarget(arena, ch.targetIdx);
    if (p.cancel) battleBack(arena);
  }
}

/* -------------------------------------------------------------- combate */
function calcHit(arena, attacker, target, mult, type) {
  const atk = type === 'mag' ? attacker.mag : attacker.atk;
  let buff = 1;
  if (attacker.atkUp > 0) buff += .3;
  if (attacker.atkDown > 0) buff -= .25;
  if (attacker.enraged) buff += .18;
  const raw = atk * mult * buff * (.9 + Math.random() * .2);
  const armor = type === 'mag' ? target.def * .4 : target.def * .55;
  let dmg = Math.max(1, Math.round(raw - armor));
  if (target.guard) dmg = Math.max(1, Math.round(dmg * .5));
  if (target.defUp > 0) dmg = Math.max(1, Math.round(dmg * .78));
  return dmg;
}

function spriteOf(arena, unit) {
  return [...arena.partySpritesPrefab || [], ...arena.enemySpritesPrefab || []].find(s => s.unit === unit);
}

function popup(arena, x, y, text, color, big) {
  arena.popups.push({ x, y, text, color: color || '#fff', t: 0, dur: 1, vy: big ? 52 : 38, big: !!big });
}

function addParticles(arena, x, y, color, n = 12, spread = 1) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = (30 + Math.random() * 130) * spread;
    arena.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30, life: .5 + Math.random() * .5, t: 0, color, size: 1.5 + Math.random() * 2.5 });
  }
}

function addEffect(arena, type, x, y, color, opts = {}) {
  arena.effects.push({ type, x, y, color, t: 0, dur: opts.dur || .6, r: opts.r || 40, angle: opts.angle || 0 });
}

function enemySpritePos(arena, index) {
  const n = arena.enemies.length;
  const boss = n === 1;
  const spacing = boss ? 0 : (n === 2 ? 170 : 150);
  return { x: boss ? 690 : 690 + (index - (n - 1) / 2) * spacing, baseY: 372 };
}

function partySpritePos(index) {
  return { x: 160 + index * 92, baseY: 424 };
}

function logBattle(arena, text, color) {
  arena.log.push({ text, color: color || 'rgba(240,232,212,.8)', t: 0 });
  if (arena.log.length > 5) arena.log.shift();
}

function hitUnit(arena, unit, dmg, isEnemy, sourceName) {
  if (unit.hp <= 0) dmg = 0;
  unit.hp = Math.max(0, unit.hp - dmg);
  unit.flashAt = arena.time;
  const pos = isEnemy
    ? (arena.enemySpritesPrefab.find(s => s.unit === unit) || { x: 690, baseY: 350 })
    : (arena.partySpritesPrefab.find(s => s.unit === unit) || { x: 170, baseY: 410 });
  popup(arena, pos.x + (isEnemy ? 0 : 10), pos.baseY - (isEnemy ? 90 * (unit.size || 1) : 70), String(dmg), isEnemy ? '#ffe7b0' : '#ff9a8a', dmg > 60);
  addParticles(arena, pos.x, pos.baseY - (isEnemy ? 70 * (unit.size || 1) : 50), isEnemy ? '#ffd890' : '#ff9a8a', 12);
  arena.shake = Math.min(18, 7 + dmg * .12);
  if (dmg > 0) AUDIO.sfx(dmg > 55 ? 'crit' : 'hit');
  if (unit.hp <= 0 && !unit.dead) {
    unit.dead = true;
    unit.deathAt = arena.time;
    if (isEnemy) {
      logBattle(arena, `${unit.name} foi derrotado.`, '#e8cf90');
      addParticles(arena, pos.x, pos.baseY - 60, '#d8c090', 26, 1.4);
      AUDIO.sfx('defeat');
    } else {
      logBattle(arena, `${unit.name} caiu.`, '#ff8a8a');
    }
  }
}

function healUnit(arena, unit, amount, isEnemy) {
  const before = unit.hp;
  unit.hp = Math.min(unit.maxHp, unit.hp + amount);
  const healed = unit.hp - before;
  const pos = isEnemy
    ? (arena.enemySpritesPrefab.find(s => s.unit === unit) || { x: 690, baseY: 350 })
    : (arena.partySpritesPrefab.find(s => s.unit === unit) || { x: 170, baseY: 410 });
  popup(arena, pos.x + 8, pos.baseY - (isEnemy ? 85 : 60), '+' + healed, '#9fe8a8');
  addParticles(arena, pos.x, pos.baseY - 40, '#9fe8a8', 14);
  AUDIO.sfx('heal');
}

async function lungeAt(arena, unit, isEnemy) {
  const sprites = isEnemy ? arena.enemySpritesPrefab : arena.partySpritesPrefab;
  const s = sprites.find(sp => sp.unit === unit);
  if (!s) return;
  s.lungeAt = arena.time;
  s.lungeDur = .36;
  s.lungeDir = isEnemy ? -1 : 1;
  await wait(140);
}

function skillTargets(arena, action) {
  const sk = SKILLS[action.skillId];
  if (!sk) return [];
  if (sk.target === 'allEnemies') return livingEnemies(arena);
  if (sk.target === 'party') return livingParty(arena);
  if (sk.target === 'self') return [action.actor];
  if (sk.target === 'ally') return action.target && action.target.hp > 0 ? [action.target] : [];
  return action.target && !action.target.dead ? [action.target] : [];
}

async function executeAction(arena, action) {
  if (!action) return;
  const actor = action.actor;
  if (!actor || actor.hp <= 0) return;
  arena.mode = 'anim';
  const isHero = arena.party.includes(actor);
  if (action.kind === 'guard') {
    actor.guard = true;
    const pos = arena.partySpritesPrefab.find(s => s.unit === actor) || { x: 170, baseY: 410 };
    addEffect(arena, 'shield', pos.x, pos.baseY - 42, 'rgba(150,210,255,', { dur: .8 });
    logBattle(arena, `${actor.name} se protege.`, '#b8d8f0');
    AUDIO.sfx('guard');
    await wait(420);
    return;
  }
  if (action.kind === 'flee') {
    if (!arena.config.canFlee || arena.enemies.some(e => e.boss && !e.dead)) {
      logBattle(arena, 'Não há fuga deste confronto!', '#ffb0a0');
      AUDIO.sfx('error');
      await wait(360);
      return;
    }
    AUDIO.sfx('flee');
    logBattle(arena, 'Você tenta fugir...', '#d8d0b8');
    await wait(380);
    if (Math.random() < .62) {
      arena.fled = true;
      logBattle(arena, 'A fuga foi bem-sucedida.', '#e8cf90');
      arena.announce = { title: 'FUGA', line: 'A poeira esconde seus passos.', t: 0, dur: 1.2 };
      await wait(500);
    } else {
      logBattle(arena, 'A fuga falhou!', '#ffb0a0');
      await wait(320);
    }
    return;
  }
  if (action.kind === 'item') {
    const it = ITEMS[action.itemKey];
    if (!it || !G.state.items[action.itemKey]) return;
    G.state.items[action.itemKey]--;
    if (G.state.items[action.itemKey] <= 0) delete G.state.items[action.itemKey];
    const target = action.target && action.target.hp > 0 ? action.target : actor;
    if (it.full) { target.hp = target.maxHp; target.mp = target.maxMp; addEffect(arena, 'heal', 170, 360, 'rgba(160,240,180,'); }
    else if (it.heal) healUnit(arena, target, it.heal, false);
    else if (it.mp) { target.mp = Math.min(target.maxMp, target.mp + it.mp); popup(arena, 180, 330, '+' + it.mp + ' MP', '#9fc8ff'); }
    logBattle(arena, `${actor.name} usou ${it.name}.`, '#c8e8d0');
    AUDIO.sfx('heal');
    await wait(500);
    return;
  }
  if (action.kind === 'attack') {
    let target = action.target;
    if (!target || target.dead) target = livingEnemies(arena)[0];
    if (!target) return;
    await lungeAt(arena, actor, false);
    addEffect(arena, 'slash', arena.enemySpritesPrefab.find(s => s.unit === target)?.x || 690, 280, 'rgba(255,240,200,');
    AUDIO.sfx('slash');
    await wait(120);
    const dmg = calcHit(arena, actor, target, 1, 'phys');
    hitUnit(arena, target, dmg, true);
    logBattle(arena, `${actor.name} ataca ${target.name} — ${dmg} de dano.`, '#f0e4c8');
    await wait(380);
    return;
  }
  if (action.kind === 'skill') {
    const sk = SKILLS[action.skillId];
    if (!sk || actor.mp < sk.cost) { logBattle(arena, 'MP insuficiente.', '#ffb0a0'); await wait(250); return; }
    actor.mp -= sk.cost;
    const targets = skillTargets(arena, action);
    if (!targets.length) return;
    logBattle(arena, `${actor.name} usa ${sk.name}!`, '#ffe1a0');
    if (sk.type === 'heal') {
      const t = targets[0];
      const amount = Math.round(t.maxHp * (sk.heal || .4)) + Math.round(actor.mag * 1.2);
      addEffect(arena, 'heal', 170, 350, 'rgba(150,240,170,', { dur: .9, r: 70 });
      AUDIO.sfx('heal');
      healUnit(arena, t, amount, false);
      await wait(600);
      return;
    }
    if (sk.type === 'buffAtk' || sk.type === 'buffDef') {
      for (const t of targets) {
        if (sk.type === 'buffAtk') t.atkUp = sk.turns || 3;
        else t.defUp = sk.turns || 3;
        const pos = arena.partySpritesPrefab.find(s => s.unit === t) || { x: 180, baseY: 400 };
        addEffect(arena, 'buff', pos.x, pos.baseY - 45, 'rgba(255,220,130,', { dur: .9, r: 55 });
      }
      popup(arena, 180, 300, sk.type === 'buffAtk' ? 'ATQ ↑' : 'DEF ↑', '#ffe19a');
      AUDIO.sfx('magic');
      await wait(650);
      return;
    }
    // ataques mágicos/físicos
    if (sk.target === 'enemy') await lungeAt(arena, actor, false);
    for (const t of targets) {
      const pos = arena.enemySpritesPrefab.find(s => s.unit === t);
      if (sk.fx === 'fire') addEffect(arena, 'fire', pos ? pos.x : 690, 300, 'rgba(255,170,70,', { dur: .9, r: 80 });
      else if (sk.fx === 'holy') addEffect(arena, 'holy', pos ? pos.x : 690, 280, 'rgba(255,245,190,', { dur: 1.1, r: 90 });
      else addEffect(arena, 'burst', pos ? pos.x : 690, 300, 'rgba(255,220,120,', { dur: .7, r: 60 });
      const dmg = calcHit(arena, actor, t, sk.mult || 1.5, sk.type === 'mag' ? 'mag' : 'phys');
      hitUnit(arena, t, dmg, true);
      logBattle(arena, `${t.name} sofre ${dmg} de dano.`, '#ffe1a0');
    }
    AUDIO.sfx('magic');
    await wait(520);
    return;
  }
}

async function enemyAct(arena, enemy) {
  if (enemy.dead || enemy.hp <= 0) return;
  const def = ENEMIES[enemy.key];
  const skills = def.skills || [];
  let sk;
  // evita repetir a mesma habilidade três vezes
  const options = skills.filter(s => s.name !== enemy.lastSkill || Math.random() < .25);
  let total = 0;
  for (const s of (options.length ? options : skills)) total += s.weight || 1;
  let roll = Math.random() * total;
  for (const s of (options.length ? options : skills)) { roll -= s.weight || 1; if (roll <= 0) { sk = s; break; } }
  if (!sk) sk = skills[0];
  if (!sk) {
    const target = pickPartyTarget(arena);
    if (!target) return;
    const dmg = calcHit(arena, enemy, target, 1, 'phys');
    await lungeAt(arena, enemy, true);
    hitUnit(arena, target, dmg, false);
    logBattle(arena, `${enemy.name} ataca ${target.name} — ${dmg} de dano.`, '#ffcfcf');
    await wait(380);
    return;
  }
  enemy.lastSkill = sk.name;
  logBattle(arena, `${enemy.name} ${sk.line || 'ataca'}!`, '#ffcfcf');
  if (sk.type === 'buffAtk') {
    enemy.atkUp = sk.turns || 3;
    addEffect(arena, 'buff', 690, 300, 'rgba(255,140,100,', { dur: .8, r: 60 });
    popup(arena, 690, 250, 'ATQ ↑', '#ffb08a');
    AUDIO.sfx('magic');
    await wait(480);
    return;
  }
  if (sk.type === 'buffDef') {
    enemy.defUp = sk.turns || 3;
    addEffect(arena, 'shield', 690, 300, 'rgba(140,190,255,', { dur: .8 });
    popup(arena, 690, 250, 'DEF ↑', '#9fc8ff');
    AUDIO.sfx('guard');
    await wait(450);
    return;
  }
  if (sk.type === 'debuffAtk') {
    const target = pickPartyTarget(arena);
    if (!target) return;
    target.atkDown = sk.turns || 2;
    addEffect(arena, 'burst', 170, 340, 'rgba(180,140,220,', { dur: .8, r: 50 });
    popup(arena, 180, 300, 'ATQ ↓', '#c8a8f0');
    logBattle(arena, `${target.name} está enfraquecido.`, '#c8a8f0');
    AUDIO.sfx('magic');
    await wait(480);
    return;
  }
  const targets = sk.target === 'allEnemies' ? livingParty(arena) : [pickPartyTarget(arena)].filter(Boolean);
  if (!targets.length) return;
  await lungeAt(arena, enemy, true);
  for (const t of targets) {
    const dmg = calcHit(arena, enemy, t, sk.mult || 1, sk.type === 'mag' ? 'mag' : 'phys');
    addEffect(arena, sk.type === 'mag' ? 'dark' : 'slash', 160, 350, 'rgba(200,120,200,', { dur: .6, r: 60 });
    hitUnit(arena, t, dmg, false, enemy.name);
    logBattle(arena, `${t.name} sofre ${dmg} de dano.`, '#ffcfcf');
    if (sk.type === 'drain') {
      healUnit(arena, enemy, Math.round(dmg * .5), true);
    }
  }
  if (targets.length > 1) addEffect(arena, 'burst', 220, 320, 'rgba(220,140,180,', { dur: .8, r: 120 });
  AUDIO.sfx(sk.type === 'mag' ? 'magic' : 'slash');
  await wait(500);
}

function pickPartyTarget(arena) {
  const alive = livingParty(arena);
  if (!alive.length) return null;
  if (Math.random() < .4) return alive.reduce((a, b) => a.hp / a.maxHp < b.hp / b.maxHp ? a : b);
  return alive[Math.floor(Math.random() * alive.length)];
}

/* --------------------------------------------------------------- vitória */
function grantXp(hero, amount) {
  const def = HEROES[hero.id];
  const ups = [];
  hero.xp += amount;
  while (hero.xp >= xpNeeded(hero.level)) {
    hero.xp -= xpNeeded(hero.level);
    hero.level++;
    hero.maxHp += def.growth.hp;
    hero.maxMp += def.growth.mp;
    hero.atk += def.growth.atk;
    hero.def += def.growth.def;
    hero.mag += def.growth.mag;
    hero.spd += def.growth.spd;
    hero.hp = hero.maxHp;
    hero.mp = hero.maxMp;
    const learned = [];
    for (const s of def.skills) {
      if (s.lvl === hero.level && !hero.skills.includes(s.id)) {
        hero.skills.push(s.id);
        learned.push(s.id);
      }
    }
    ups.push({ hero, level: hero.level, learned });
  }
  return ups;
}

async function victory(arena) {
  arena.mode = 'victory';
  arena.acceptInput = false;
  const xp = arena.enemies.reduce((s, e) => s + (e.xp || 0), 0) + (arena.extraXp || 0);
  const gold = arena.enemies.reduce((s, e) => s + (e.gold || 0), 0);
  const levelUps = [];
  for (const hero of arena.party) {
    if (hero.hp <= 0) hero.hp = 1;
    levelUps.push(...grantXp(hero, xp));
  }
  G.state.gold = (G.state.gold || 0) + gold;
  G.state.kills = (G.state.kills || 0) + arena.enemies.length;
  const loot = [];
  if (arena.config.loot) {
    for (const l of arena.config.loot) {
      G.state.items[l.item] = (G.state.items[l.item] || 0) + (l.n || 1);
      loot.push(l);
    }
  } else if (Math.random() < .3) {
    const key = Math.random() < .6 ? 'pocao' : 'eter';
    G.state.items[key] = (G.state.items[key] || 0) + 1;
    loot.push({ item: key, n: 1 });
  }
  arena.rewards = { xp, gold, levelUps, loot };
  arena.rewardT = 0;
  AUDIO.sfx('victory');
  if (!arena.config.noMusicStop) AUDIO.stopMusic();
  await wait(500);
  await new Promise(res => { arena.victoryResolve = res; });
  return 'win';
}

function closeVictory(arena) {
  if (arena.mode !== 'victory' || !arena.victoryResolve) return;
  const r = arena.victoryResolve;
  arena.victoryResolve = null;
  AUDIO.sfx('confirm');
  r();
}

function showDefeat(arena) {
  return new Promise(res => {
    arena.mode = 'defeat';
    arena.acceptInput = false;
    arena.defeatResolve = res;
    arena.defeatIndex = 0;
    arena.defeatT = 0;
    AUDIO.stopMusic();
    AUDIO.sfx('defeat');
  });
}

function chooseDefeat(arena, choice) {
  if (!arena.defeatResolve) return;
  const r = arena.defeatResolve;
  arena.defeatResolve = null;
  if (choice === 'retry') { AUDIO.sfx('confirm'); r('retry'); }
  else { arena.toTitle = true; r('title'); }
}

async function runPhase2(arena) {
  arena.usedPhase2 = true;
  arena.acceptInput = false;
  arena.mode = 'anim';
  const p2 = arena.config.phase2;
  AUDIO.stopMusic();
  AUDIO.sfx('boss');
  arena.flash = 1;
  arena.shake = 20;
  await wait(700);
  for (const line of (p2.dialogue || [])) {
    await say(line.speaker, line.text, { mood: line.mood || 'angry' });
  }
  arena.enemies = p2.enemies.map(makeEnemy);
  arena.extraXp = (arena.extraXp || 0) + (p2.bonusXp || 0);
  if (p2.heal) {
    for (const h of arena.party) {
      if (h.hp > 0) h.hp = Math.min(h.maxHp, h.hp + Math.round(h.maxHp * p2.heal));
      h.atkUp = Math.max(h.atkUp, 3);
    }
  }
  arena.announce = {
    title: p2.banner || 'SEGUNDA FASE',
    line: p2.quote || 'A escuridão muda de forma.',
    t: 0, dur: 2.6
  };
  arena.turn++;
  AUDIO.playTrack('boss');
  await wait(1000);
  arena.mode = 'fight';
}

function updateBattle(dt) {
  const arena = G.battle;
  if (!arena) return;
  arena.time += dt;
  if (arena.announce) {
    arena.announce.t += dt;
    if (arena.announce.t > arena.announce.dur) arena.announce = null;
  }
  if (arena.shake > 0) arena.shake = Math.max(0, arena.shake - dt * 30);
  if (arena.flash > 0) arena.flash = Math.max(0, arena.flash - dt * 2.2);
  for (const p of arena.popups) { p.t += dt; p.y -= p.vy * dt; }
  arena.popups = arena.popups.filter(p => p.t < p.dur);
  for (const e of arena.effects) e.t += dt;
  arena.effects = arena.effects.filter(e => e.t < e.dur);
  for (const p of arena.particles) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 220 * dt; }
  arena.particles = arena.particles.filter(p => p.t < p.life);
  for (const l of arena.log) l.t += dt;

  if (G.dialog) return;
  if (arena.mode === 'victory') {
    arena.rewardT = (arena.rewardT || 0) + dt;
    if (arena.rewardT > .5 && (G.pressed.action || G.pressed.cancel)) closeVictory(arena);
    return;
  }
  if (arena.mode === 'defeat') {
    if (G.pressed.up) { arena.defeatIndex = 0; AUDIO.sfx('cursor'); }
    if (G.pressed.down) { arena.defeatIndex = 1; AUDIO.sfx('cursor'); }
    if (G.pressed.action) chooseDefeat(arena, arena.defeatIndex === 0 ? 'retry' : 'title');
    return;
  }
  if (!arena.acceptInput) return;
  battleKeyboard(arena);
}

function battlePointer(x, y) {
  const arena = G.battle;
  if (!arena) return;
  if (arena.mode === 'victory') { handleUIButtons(x, y); return; }
  if (arena.mode === 'defeat') { handleUIButtons(x, y); return; }
  if (handleUIButtons(x, y)) return;
  const ch = arena.chooser;
  if (!ch || ch.mode !== 'target') return;
  const hits = arena.enemyHitboxes || [];
  for (const h of hits) {
    if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) {
      battlePickTarget(arena, h.index);
      return;
    }
  }
  const phits = arena.partyHitboxes || [];
  for (const h of phits) {
    if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) {
      battlePickTarget(arena, h.index);
      return;
    }
  }
}
