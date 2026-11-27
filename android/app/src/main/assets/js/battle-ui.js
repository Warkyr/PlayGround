// battle-ui.js — battle DOM menus, HUD and canvas rendering
import { Input, wait, clamp, rand, randInt, chance } from './util.js';
import { audio } from './audio.js';
import { ui } from './ui.js';
import { drawBattleBG, drawEnemy, drawCharacter, getPortrait, getEnemyThumb, FX, enemySpriteMetrics } from './art.js';
import { SKILLS, ITEMS, STATUS_INFO, ELEMENTS } from './data.js';

const el = (sel) => document.querySelector(sel);
const elem = (tag, cls, html) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
};

export function setupBattleUI(state) {
  const root = el('#battle-ui');
  root.classList.remove('hidden');
  root.innerHTML = `
    <div class="battle-log" id="battle-log"></div>
    <div class="turn-order" id="turn-order"></div>
    <div class="boss-hud hidden" id="boss-hud">
      <div class="bh-top"><span id="boss-name"></span><span id="boss-hp"></span></div>
      <div class="bar boss"><i id="boss-fill"></i></div>
    </div>
    <div class="battle-party" id="battle-party"></div>
    <div class="battle-command" id="battle-command"></div>
    <div id="battle-target-layer"></div>`;
  state.ui = {
    root,
    log: el('#battle-log'),
    order: el('#turn-order'),
    party: el('#battle-party'),
    command: el('#battle-command'),
    target: el('#battle-target-layer'),
    boss: el('#boss-hud'),
    bossName: el('#boss-name'),
    bossHp: el('#boss-hp'),
    bossFill: el('#boss-fill'),
  };
  ui.showHUD(false);
  ui.setTouchVisible(false);
  ui.hideDialogue();
  state.log = [];
  state.logMsgs = [];
  syncHUD(state);
}

export function teardownBattleUI() {
  const root = el('#battle-ui');
  root.classList.add('hidden');
  root.innerHTML = '';
  ui.showHUD(true);
}

export function logMsg(state, text) {
  state.logMsgs.push(text);
  if (state.logMsgs.length > 3) state.logMsgs.shift();
  const box = state.ui.log;
  box.innerHTML = state.logMsgs.map((m, i) => `<p${i === state.logMsgs.length - 1 ? ' class="last"' : ''}>${m}</p>`).join('');
}

export function layoutBattle(state) {
  const w = state.w || window.innerWidth;
  const h = state.h || window.innerHeight;
  const compact = w < 780;
  const portrait = h > w * 1.15;
  const n = state.enemies.length;
  // Enemy ground line sits farther back than the party, but never so high that
  // sprites collide with the battle log / turn order.
  const groundY = portrait ? h * 0.36 : compact ? h * 0.48 : h * 0.56;
  const topLimit = portrait ? 112 : compact ? 88 : 108;
  const x0 = portrait ? w * 0.36 : compact ? w * 0.54 : w * 0.52;
  const x1 = portrait ? w * 0.96 : w * 0.92;

  // 1) Choose a target height in screen terms (bosses slightly larger).
  // 2) Fit the whole group into the available width, shrinking if necessary.
  // 3) Anchor every enemy at a shared ground line so they feel grounded.
  const metrics = state.enemies.map((e) => enemySpriteMetrics(e.id));
  const gap = n > 1 ? Math.min(26, (x1 - x0) * 0.045) : 0;
  state.enemies.forEach((e, i) => {
    const boss = !!e.boss;
    const targetH = clamp(
      h * (boss ? (portrait ? 0.24 : 0.28) : (portrait ? 0.155 : 0.20)),
      compact ? 56 : 80,
      boss ? 250 : 185,
    );
    const maxH = groundY - topLimit;
    const height = Math.max(40, Math.min(targetH, maxH));
    e.scale = height / metrics[i].h;
  });
  let totalW = 0;
  state.enemies.forEach((e, i) => {
    e.drawW = metrics[i].w * e.scale;
    e.drawH = metrics[i].h * e.scale;
    totalW += e.drawW + (i ? gap : 0);
  });
  const availW = x1 - x0;
  if (totalW > availW && totalW > 0) {
    const shrink = availW / totalW;
    state.enemies.forEach((e, i) => {
      e.scale *= shrink;
      e.drawW *= shrink;
      e.drawH *= shrink;
    });
    totalW = availW;
  }
  let cursor = (x0 + x1) / 2 - totalW / 2;
  state.enemies.forEach((e, i) => {
    e.x = cursor + e.drawW / 2;
    cursor += e.drawW + gap;
    e.y = groundY + (n > 1 && !portrait ? (i % 2) * h * 0.012 : 0);
  });

  const alive = state.allies.filter((m) => m.hp > 0);
  const px0 = compact ? w * 0.13 : w * 0.2;
  const px1 = compact ? w * 0.43 : w * 0.43;
  const py = compact ? h * 0.52 : h * 0.67;
  alive.forEach((m, i) => {
    m.bx = alive.length === 1 ? (px0 + px1) / 2 : px0 + (px1 - px0) * (i / (alive.length - 1));
    m.by = py + (i % 2) * (compact ? 8 : 14);
    m.bs = compact ? 4.2 : 5.4;
  });
}

export function syncHUD(state) {
  if (!state.ui) return;
  layoutBattle(state);
  const party = state.ui.party;
  party.innerHTML = state.allies.map((m) => `
    <div class="battle-unit ${state.current === m ? 'active' : ''} ${m.hp <= 0 ? 'dead' : ''}" data-ally="${m.id}">
      <div class="bu-face"><canvas width="48" height="48" data-face="${m.id}"></canvas></div>
      <div>
        <div class="bu-name">${m.name}<span>Nv ${m.level}</span></div>
        <div class="bu-bars">
          <div class="bar hp ${m.hp / m.maxHp <= 0.25 ? 'low' : m.hp / m.maxHp <= 0.5 ? 'warn' : ''}"><i style="width:${clamp(m.hp / m.maxHp, 0, 1) * 100}%"></i></div>
          <div class="bar mp"><i style="width:${clamp(m.mp / m.maxMp, 0, 1) * 100}%"></i></div>
        </div>
        <div class="bu-status">${statusPips(m)}</div>
      </div>
    </div>`).join('');
  state.allies.forEach((m) => {
    const cv = party.querySelector(`[data-face="${m.id}"]`);
    if (cv) cv.getContext('2d').drawImage(getPortrait(m.sprite, 72), 0, 0, 48, 48);
  });
  // turn order
  const order = state.order || [];
  const start = state.turnIndex || 0;
  const upcoming = [];
  for (let i = 0; i < order.length && upcoming.length < 6; i++) {
    const a = order[(start + i) % order.length];
    if (a.hp > 0) upcoming.push(a);
  }
  state.ui.order.innerHTML = upcoming.map((a, i) => {
    const isEnemy = a.isEnemy;
    return `<div class="turn-chip ${isEnemy ? 'enemy' : ''} ${i === 0 ? 'now' : ''}" title="${a.name}">
      <canvas width="32" height="32" data-turn="${i}"></canvas><span>${(a.name || '?').split(' ')[0].slice(0, 5)}</span>
    </div>`;
  }).join('');
  upcoming.forEach((a, i) => {
    const cv = state.ui.order.querySelector(`[data-turn="${i}"]`);
    if (!cv) return;
    const g = cv.getContext('2d');
    if (a.isEnemy) g.drawImage(getEnemyThumb(a.id, 32), 0, 0);
    else g.drawImage(getPortrait(a.sprite, 72), 0, 0, 32, 32);
  });
  // boss bar
  const boss = state.enemies.find((e) => e.boss && e.hp > 0);
  if (boss) {
    state.ui.boss.classList.remove('hidden');
    state.ui.bossName.textContent = boss.name;
    state.ui.bossHp.textContent = `${Math.max(0, boss.hp)} / ${boss.maxHp}`;
    state.ui.bossFill.style.width = `${clamp(boss.hp / boss.maxHp, 0, 1) * 100}%`;
  } else {
    state.ui.boss.classList.add('hidden');
  }
}

export function statusPips(actor) {
  const pips = [];
  for (const [id, st] of Object.entries(actor.status || {})) {
    if (st.turns > 0) {
      const inf = STATUS_INFO[id];
      if (inf) pips.push(`<span class="status-pip" title="${inf.name}">${inf.icon}</span>`);
    }
  }
  for (const b of actor.buffs || []) {
    if (b.turns > 0) {
      const key = b.stat === 'atk' ? (b.mult >= 1 ? 'atkUp' : 'atkDown') : 'defUp';
      const inf = STATUS_INFO[key];
      pips.push(`<span class="status-pip" title="${inf.name}">${inf.icon}</span>`);
    }
  }
  return pips.join('');
}

// ---------------- Menus ----------------
function finishMenu(handler, resolve, value) {
  // Resolve only once and always remove this menu's keyboard handler.
  // In nested menus (item -> ally target), stale handlers could advance
  // or cancel the wrong action on the next key press.
  if (handler.__battleMenuFinished) return;
  handler.__battleMenuFinished = true;
  Input.pop(handler);
  resolve(value);
}

export function commandMenu(state, actor) {
  return new Promise((resolve) => {
    const root = state.ui.command;
    const items = [
      { label: 'Atacar', icon: '⚔', key: '1', value: 'attack', desc: 'Um golpe básico com a arma equipada.' },
      { label: 'Habilidade', icon: '✦', key: '2', value: 'skill', desc: 'Gaste MP para usar uma técnica especial.' },
      { label: 'Item', icon: '◈', key: '3', value: 'item', desc: 'Use um item da mochila.' },
      { label: 'Defender', icon: '◆', key: '4', value: 'defend', desc: 'Reduz o dano recebido até seu próximo turno.' },
      { label: 'Fugir', icon: '➜', key: '5', value: 'flee', desc: state.canFlee ? 'Tente escapar da batalha.' : 'Não é possível fugir desta batalha.', disabled: !state.canFlee },
    ];
    root.classList.add('with-party');
    root.innerHTML = `<div class="cmd-head"><span>${actor.name.toUpperCase()} · Nv ${actor.level}</span><span class="hint">↑↓ escolher</span></div>
      <div class="cmd-grid" id="cmd-grid"></div>
      <div class="cmd-desc" id="cmd-desc"></div>
      <div class="cmd-footer">
        <button class="cmd-confirm" id="cmd-confirm">✓ Confirmar <span class="key">Enter</span></button>
      </div>`;
    const grid = el('#cmd-grid');
    const desc = el('#cmd-desc');
    let sel = 0;
    // Only toggle classes / update text here: rebuilding the grid on hover
    // destroyed the hovered button and caused an endless mouseenter loop.
    const paint = () => {
      grid.querySelectorAll('.cmd-btn').forEach((b, i) => b.classList.toggle('sel', i === sel));
      desc.innerHTML = `<b>${items[sel].label}</b> — ${items[sel].desc}`;
    };
    grid.innerHTML = items.map((it, i) => `<button class="cmd-btn ${i === sel ? 'sel' : ''}" data-i="${i}" ${it.disabled ? 'disabled' : ''}>
        <span>${it.icon}</span><span>${it.label}</span><span class="key">${it.key}</span></button>`).join('');
    const choose = (i) => {
      if (!items[i] || items[i].disabled) return;
      audio.sfx('confirm');
      root.classList.remove('with-party');
      root.innerHTML = '';
      finishMenu(handler, resolve, items[i].value);
    };
    grid.querySelectorAll('.cmd-btn').forEach((b, i) => {
      b.addEventListener('mouseenter', () => {
        if (items[i].disabled || sel === i) return;
        sel = i; paint(); audio.sfx('cursor');
      });
      b.addEventListener('click', () => choose(i));
    });
    el('#cmd-confirm').addEventListener('click', () => choose(sel));
    const handler = (a) => {
      if (a === 'left' || a === 'up') { sel = (sel + (a === 'up' ? items.length - 2 : items.length - 1)) % items.length; paint(); audio.sfx('cursor'); return true; }
      if (a === 'right' || a === 'down') { sel = (sel + (a === 'down' ? 2 : 1)) % items.length; paint(); audio.sfx('cursor'); return true; }
      if (a === 'confirm') { choose(sel); return true; }
      if (a === 'cancel') { return true; }
      return true;
    };
    Input.push(handler);
    paint();
  });
}

export function skillMenu(state, actor) {
  return new Promise((resolve) => {
    const root = state.ui.command;
    const skills = actor.skills.map((sid) => ({ sid, sk: SKILLS[sid] })).filter((s) => s.sk);
    root.innerHTML = `<div class="cmd-head"><span>HABILIDADES · ${actor.name.toUpperCase()}</span><span class="hint">MP ${actor.mp}/${actor.maxMp}</span></div>
      <div class="skill-list" id="skill-list"></div>
      <div class="cmd-desc" id="cmd-desc"></div>
      <div class="cmd-footer">
        <button class="cmd-confirm" id="cmd-confirm">✓ Confirmar <span class="key">Enter</span></button>
        <button class="cmd-back" id="cmd-back">✕ Voltar</button>
      </div>`;
    const list = el('#skill-list');
    const desc = el('#cmd-desc');
    let sel = 0;
    const paint = () => {
      list.querySelectorAll('.skill-row').forEach((row, i) => row.classList.toggle('sel', i === sel));
      const cur = skills[sel];
      desc.innerHTML = cur ? `<b>${cur.sk.name}</b> — ${cur.sk.desc}` : 'Retornar às ações.';
    };
    list.innerHTML = skills.map((s, i) => `<div class="skill-row ${i === sel ? 'sel' : ''} ${actor.mp < s.sk.cost ? 'disabled' : ''}" data-i="${i}">
        <span>${s.sk.name}</span><span class="cost">${s.sk.cost} MP</span></div>`).join('') +
      `<div class="skill-row ${sel === skills.length ? 'sel' : ''}" data-i="${skills.length}"><span>Voltar</span><span class="cost">—</span></div>`;
    const back = () => { audio.sfx('cancel'); finishMenu(handler, resolve, null); };
    const choose = (i) => {
      if (i >= skills.length) { back(); return; }
      if (actor.mp < skills[i].sk.cost) { audio.sfx('cancel'); ui.toast('MP insuficiente.', 'red', '✦'); return; }
      audio.sfx('confirm');
      finishMenu(handler, resolve, skills[i].sid);
    };
    list.querySelectorAll('.skill-row').forEach((row, i) => {
      row.addEventListener('mouseenter', () => {
        if (sel === i) return;
        sel = i; paint(); audio.sfx('cursor');
      });
      row.addEventListener('click', () => choose(i));
    });
    el('#cmd-confirm').addEventListener('click', () => choose(sel));
    el('#cmd-back').addEventListener('click', back);
    const handler = (a) => {
      if (a === 'up') { sel = (sel - 1 + skills.length + 1) % (skills.length + 1); paint(); audio.sfx('cursor'); return true; }
      if (a === 'down') { sel = (sel + 1) % (skills.length + 1); paint(); audio.sfx('cursor'); return true; }
      if (a === 'confirm') { choose(sel); return true; }
      if (a === 'cancel') { back(); return true; }
      return true;
    };
    Input.push(handler);
    paint();
  });
}

export function itemMenu(state, game) {
  return new Promise((resolve) => {
    const root = state.ui.command;
    const ids = Object.keys(game.inventory).filter((id) => ITEMS[id] && !ITEMS[id].key && game.inventory[id] > 0);
    root.innerHTML = `<div class="cmd-head"><span>ITENS</span><span class="hint">↑↓ escolher</span></div>
      <div class="skill-list" id="item-list"></div><div class="cmd-desc" id="cmd-desc"></div>
      <div class="cmd-footer">
        <button class="cmd-confirm" id="cmd-confirm">✓ Confirmar <span class="key">Enter</span></button>
        <button class="cmd-back" id="cmd-back">✕ Voltar</button>
      </div>`;
    const list = el('#item-list');
    const desc = el('#cmd-desc');
    let sel = 0;
    const paint = () => {
      list.querySelectorAll('.skill-row').forEach((row, i) => row.classList.toggle('sel', i === sel));
      const cur = ids[sel];
      desc.innerHTML = cur ? ITEMS[cur].desc : 'Retornar às ações.';
    };
    list.innerHTML = ids.length ? ids.map((id, i) => `<div class="skill-row ${i === sel ? 'sel' : ''}" data-i="${i}">
        <span>${ITEMS[id].icon} ${ITEMS[id].name} <span style="color:var(--muted);font-size:14px">x${game.inventory[id]}</span></span><span class="cost">—</span></div>`).join('') +
      `<div class="skill-row ${sel === ids.length ? 'sel' : ''}" data-i="${ids.length}"><span>Voltar</span><span class="cost">—</span></div>`
      : `<div class="skill-row sel"><span>Mochila vazia</span></div><div class="skill-row" data-i="0"><span>Voltar</span></div>`;
    const back = () => { audio.sfx('cancel'); finishMenu(handler, resolve, null); };
    const choose = (i) => {
      if (!ids.length || i >= ids.length) { back(); return; }
      audio.sfx('confirm');
      finishMenu(handler, resolve, ids[i]);
    };
    list.querySelectorAll('.skill-row').forEach((row, i) => {
      row.addEventListener('mouseenter', () => {
        if (sel === i) return;
        sel = i; paint(); audio.sfx('cursor');
      });
      row.addEventListener('click', () => choose(i));
    });
    el('#cmd-confirm').addEventListener('click', () => choose(sel));
    el('#cmd-back').addEventListener('click', back);
    const handler = (a) => {
      if (a === 'up') { sel = (sel - 1 + ids.length + 1) % (ids.length + 1); paint(); audio.sfx('cursor'); return true; }
      if (a === 'down') { sel = (sel + 1) % (ids.length + 1); paint(); audio.sfx('cursor'); return true; }
      if (a === 'confirm') { choose(sel); return true; }
      if (a === 'cancel') { back(); return true; }
      return true;
    };
    Input.push(handler);
    paint();
  });
}

export function targetMenu(state, opts = {}) {
  const side = opts.side || 'enemy';
  const pool = side === 'enemy' ? state.enemies : state.allies;
  const list = pool.filter((a) => opts.onlyDead ? a.hp <= 0 : opts.allowDead ? true : a.hp > 0);
  return new Promise((resolve) => {
    const layer = state.ui.target;
    if (!list.length) { resolve(null); return; }
    let sel = 0;
    const cleanup = () => { state.hoverTarget = null; layer.innerHTML = ''; };
    layer.innerHTML = `<div class="target-layer">
      <div class="target-cards">${list.map((a, i) => `
        <button class="target-card ${i === sel ? 'sel' : ''}" data-i="${i}">
          <div class="tc-name">${a.name}</div>
          <div class="tc-sub">${side === 'enemy' ? (a.hp > 0 ? 'Vivo' : 'Caído') : `${a.hp}/${a.maxHp} HP`}</div>
          ${side === 'enemy' ? `<div class="bar hp"><i style="width:${clamp(a.hp / a.maxHp, 0, 1) * 100}%"></i></div>` : ''}
        </button>`).join('')}</div>
      <div class="target-actions">
        <button class="cmd-confirm" id="target-confirm">✓ Confirmar</button>
        <button class="cmd-back" id="target-back">✕ Voltar</button>
      </div></div>`;
    const cards = layer.querySelectorAll('.target-card');
    const paint = () => {
      cards.forEach((b, i) => b.classList.toggle('sel', i === sel));
      state.hoverTarget = list[sel] || null;
    };
    const choose = (i) => {
      if (!list[i]) return;
      if (side === 'enemy' && list[i].hp <= 0) { audio.sfx('cancel'); return; }
      audio.sfx('confirm');
      cleanup();
      finishMenu(handler, resolve, list[i]);
    };
    const back = () => { audio.sfx('cancel'); cleanup(); finishMenu(handler, resolve, null); };
    cards.forEach((b, i) => {
      b.addEventListener('mouseenter', () => {
        if (sel === i) return;
        sel = i; paint(); audio.sfx('cursor');
      });
      b.addEventListener('click', () => choose(i));
    });
    el('#target-confirm').addEventListener('click', () => choose(sel));
    el('#target-back').addEventListener('click', back);
    const handler = (a) => {
      if (a === 'left' || a === 'up') { sel = (sel - 1 + list.length) % list.length; paint(); audio.sfx('cursor'); return true; }
      if (a === 'right' || a === 'down') { sel = (sel + 1) % list.length; paint(); audio.sfx('cursor'); return true; }
      if (a === 'confirm') { choose(sel); return true; }
      if (a === 'cancel') { back(); return true; }
      return true;
    };
    Input.push(handler);
    paint();
  });
}

// ---------------- Rendering ----------------
export function drawBattleFrame(state, now) {
  const dt = state.lastTime ? Math.min(0.05, (now - state.lastTime) / 1000) : 0.016;
  state.lastTime = now;
  state.time += dt;
  const g = state.ctx;
  const w = state.w = window.innerWidth;
  const h = state.h = window.innerHeight;
  if (!state.fx) state.fx = new FX();
  state.fx.update(dt);
  layoutBattle(state);

  // ambient particles
  state.ambientTimer = (state.ambientTimer || 0) + dt;
  const rate = state.ambient === 'snow' ? 0.05 : state.ambient === 'embers' ? 0.08 : 0.18;
  while (state.ambientTimer > rate) {
    state.ambientTimer -= rate;
    if (state.ambient === 'snow') {
      state.fx.particles.push({ x: rand(0, w), y: -10, vx: rand(-12, 12), vy: rand(30, 70), life: 0, max: rand(4, 8), size: rand(1, 3), color: '#e8f4ff', gravity: 4, glow: false, drag: 1 });
    } else if (state.ambient === 'embers') {
      state.fx.particles.push({ x: rand(0, w), y: h * 0.9, vx: rand(-10, 10), vy: rand(-50, -20), life: 0, max: rand(1.5, 3.5), size: rand(1, 3), color: chance(0.5) ? '#ff9a4a' : '#ffd27a', gravity: -6, glow: true, drag: 0.99 });
    } else {
      state.fx.particles.push({ x: rand(0, w), y: rand(0, h), vx: rand(-6, 6), vy: rand(-6, 6), life: 0, max: rand(2, 5), size: rand(1, 2), color: '#c8d0e0', gravity: 0, glow: false, drag: 1 });
    }
  }

  // update actor animations
  const all = [...state.enemies, ...state.allies];
  for (const a of all) {
    if (a.flashT > 0) a.flashT = Math.max(0, a.flashT - dt);
    if (a.anim) {
      a.anim.t += dt;
      if (a.anim.t >= a.anim.dur) a.anim = null;
    }
  }

  const shake = state.fx.offset();
  g.save();
  g.translate(shake.x, shake.y);
  drawBattleBG(g, w, h, state.bg, state.time);

  // party sprites
  const alive = state.allies.filter((m) => m.hp > 0);
  for (const m of alive) {
    let dx = 0, dy = 0;
    if (m.anim) {
      const p = Math.sin(clamp(m.anim.t / m.anim.dur, 0, 1) * Math.PI);
      dx = (m.anim.dx || 34) * p;
      dy = -6 * p;
    }
    const bob = Math.sin(state.time * 2 + (m.id.length)) * 1.2;
    drawCharacter(g, m.sprite, m.bx + dx, m.by + bob + dy, 'right', 0, m.bs, { flash: m.flashT > 0 });
    if (state.current === m && state.phase === 'command') {
      g.fillStyle = 'rgba(231,199,123,.85)';
      const ay = m.by - 28 * m.bs - 18 + Math.sin(state.time * 4) * 3;
      g.beginPath(); g.moveTo(m.bx, ay); g.lineTo(m.bx - 7, ay - 9); g.lineTo(m.bx + 7, ay - 9); g.closePath(); g.fill();
    }
  }
  // dead allies
  for (const m of state.allies.filter((x) => x.hp <= 0)) {
    g.save(); g.globalAlpha = 0.28; g.translate(0, 10);
    drawCharacter(g, m.sprite, m.bx, m.by, 'right', 0, m.bs, { alpha: 0.7 });
    g.restore();
  }

  // enemies
  for (const e of state.enemies) {
    if (e.hp <= 0 && !e.deadDrawn) continue;
    let dx = 0, dy = 0;
    if (e.anim) {
      const p = Math.sin(clamp(e.anim.t / e.anim.dur, 0, 1) * Math.PI);
      dx = (e.anim.dx || -34) * p;
    }
    if (e.hp <= 0) {
      g.save(); g.globalAlpha = Math.max(0, 0.35 - (e.deadT || 0) * 0.1);
      drawEnemy(g, e.id, e.x, e.y + 8, e.scale, state.time, { alpha: 0.35, bob: false });
      g.restore();
      e.deadT = (e.deadT || 0) + dt;
      continue;
    }
    drawEnemy(g, e.id, e.x + dx, e.y, e.scale, state.time, { flash: e.flashT > 0, phase: e.bobPhase });
    // HP bar — anchored to the sprite's real drawn height so it never floats.
    // Bosses already have the top strip, so skip the duplicate world-space bar.
    const bw = clamp((e.drawW || e.scale * 30) * 0.92, 64, 190);
    const bx = e.x - bw / 2, by = e.y - (e.drawH || e.scale * 48) - 18;
    if (!e.boss) {
      g.fillStyle = 'rgba(4,7,14,.8)';
      g.fillRect(bx - 2, by - 2, bw + 4, 14);
      g.fillStyle = '#3a1520'; g.fillRect(bx, by, bw, 6);
      const pct = clamp(e.hp / e.maxHp, 0, 1);
      const grd = g.createLinearGradient(bx, by, bx + bw, by);
      grd.addColorStop(0, '#8e2737'); grd.addColorStop(0.6, '#e35f72'); grd.addColorStop(1, '#ff9aa7');
      g.fillStyle = grd; g.fillRect(bx, by, bw * pct, 6);
      g.strokeStyle = 'rgba(231,199,123,.35)'; g.lineWidth = 1; g.strokeRect(bx + 0.5, by + 0.5, bw - 1, 5);
      g.font = '700 13px "VT323", monospace';
      g.textAlign = 'center'; g.textBaseline = 'bottom';
      g.fillStyle = 'rgba(8,8,14,.8)'; g.fillText(e.name, e.x + 1, by - 4);
      g.fillStyle = '#e8e0cc'; g.fillText(e.name, e.x, by - 5);
    }
    // target marker
    if (state.hoverTarget === e) {
      g.fillStyle = '#ffe6a3';
      const ay = by - 20 + Math.sin(state.time * 6) * 3;
      g.beginPath(); g.moveTo(e.x, ay + 10); g.lineTo(e.x - 8, ay); g.lineTo(e.x + 8, ay); g.closePath(); g.fill();
    }
  }
  // ally target marker
  if (state.hoverTarget && !state.hoverTarget.isEnemy) {
    const m = state.hoverTarget;
    g.strokeStyle = 'rgba(255,230,163,.9)'; g.lineWidth = 3;
    g.beginPath(); g.ellipse(m.bx, m.by, 30, 8, 0, 0, Math.PI * 2); g.stroke();
  }

  state.fx.draw(g);
  g.restore();
}

export function battleActorPos(actor) {
  if (actor.isEnemy) {
    const h = actor.drawH || actor.scale * 48;
    return { x: actor.x, y: actor.y - h * 0.55, h };
  }
  return { x: actor.bx, y: actor.by - actor.bs * 14, h: actor.bs * 28 };
}

export function elementColor(element) {
  return ELEMENTS[element]?.color || '#fff3cf';
}
