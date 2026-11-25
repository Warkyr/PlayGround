import { ENEMIES, ENEMY_SKILLS, SKILLS, ITEMS } from './data.js';
import { drawBattleBackground, drawCharacter, drawEnemy, drawParticles, drawFloaters, drawPortrait, drawShadow } from './art.js';

const wait = (ms) => new Promise(res => setTimeout(res, ms));
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export class Battle {
  constructor(game, encounter) {
    this.game = game;
    this.encounter = encounter;
    this.background = encounter.background || 'castle';
    this.title = encounter.title || 'Batalha';
    this.heroes = game.party.map((m, i) => this.makeHero(m, i));
    this.enemies = encounter.enemies.map((e, i) => this.makeEnemy(e, i));
    this.round = 0;
    this.order = [];
    this.active = null;
    this.finished = false;
    this.result = null;
    this.busy = false;
    this.commandMode = 'root';
    this.pending = null;
    this.turnResolve = null;
    this.fx = { shake: 0, flash: 0, flashColor: '#fff', particles: [], floaters: [] };
    this.lastT = performance.now();
    this.message = '';
    this.barks = new Set();
    this.rewards = null;
    this.el = {
      ui: document.getElementById('battle-ui'),
      round: document.getElementById('battle-round'),
      order: document.getElementById('turn-order'),
      enemies: document.getElementById('battle-enemies'),
      message: document.getElementById('battle-message'),
      party: document.getElementById('battle-party'),
      actor: document.getElementById('battle-actor'),
      actorName: document.getElementById('battle-actor-name'),
      actorPortrait: document.getElementById('battle-actor-portrait'),
      actorHp: document.getElementById('actor-hp-bar'),
      actorMp: document.getElementById('actor-mp-bar'),
      actorHint: document.getElementById('battle-actor-hint'),
      commands: document.getElementById('battle-commands'),
      result: document.getElementById('battle-result')
    };
    this.onKey = this.onKey.bind(this);
    this.onCommandClick = (event) => {
      const btn = event.target.closest('.cmd-btn');
      if (btn && !btn.disabled) this.handleCommand(btn);
    };
  }

  makeHero(member, index) {
    return {
      side: 'hero', index, id: member.id, name: member.name, art: member.id,
      level: member.level,
      hp: member.hp, maxHp: member.maxHp,
      mp: member.mp, maxMp: member.maxMp,
      stats: { ...member.stats },
      skills: [...member.skills],
      alive: member.hp > 0,
      defending: false, taunt: 0, shield: 0,
      buffs: {}, statuses: {},
      lungeUntil: 0, flashUntil: 0, phase2: false
    };
  }

  makeEnemy(spec, index) {
    const def = ENEMIES[spec.id];
    const hpScale = this.encounter.hpScale || 1;
    const hp = Math.round(def.hp * hpScale);
    return {
      side: 'enemy', index, id: def.id, name: spec.name || def.name, art: def.art,
      hp, maxHp: hp, mp: def.mp, maxMp: def.mp,
      stats: { atk: def.atk, def: def.def, mag: def.mag, spd: def.spd, luck: 2 },
      skills: [...def.skills],
      xp: def.xp, gold: def.gold, boss: !!def.boss,
      alive: true, defending: false, taunt: 0, shield: 0,
      buffs: {}, statuses: {},
      lungeUntil: 0, flashUntil: 0, phase2: false
    };
  }

  async run() {
    this.el.ui.classList.remove('hidden');
    this.el.result.classList.add('hidden');
    this.game.audio.playMusic(this.encounter.boss ? 'boss' : 'battle');
    this.renderAll();
    this.setMessage(this.encounter.intro || 'A batalha começa!');
    await wait(1300);
    this.setMessage('');

    while (!this.finished) {
      this.round++;
      this.el.round.textContent = `RODADA ${this.round}`;
      this.buildOrder();
      this.renderAll();
      for (const unit of this.order) {
        if (this.finished) break;
        if (!unit.alive) continue;
        this.active = unit;
        this.renderAll();
        this.commandMode = 'root';
        this.pending = null;
        this.tickStart(unit);
        if (this.checkEnd()) break;
        if (!unit.alive) continue;

        if (unit.side === 'hero') {
          await this.heroTurn(unit);
        } else {
          await this.enemyTurn(unit);
        }
        if (this.checkEnd()) break;
        this.tickEnd(unit);
        this.renderAll();
        await wait(180);
      }
    }

    this.active = null;
    this.renderAll();
    if (this.result === 'win') {
      await this.victorySequence();
    }
    this.el.ui.classList.add('hidden');
    this.el.result.classList.add('hidden');
    this.el.commands.innerHTML = '';
    window.removeEventListener('keydown', this.onKey);
    this.el.commands.removeEventListener('click', this.onCommandClick);
    this.game.audio.playMusic(this.game.musicForScene());
    return this.result;
  }

  buildOrder() {
    this.order = [...this.heroes, ...this.enemies]
      .filter(u => u.alive)
      .sort((a, b) => this.speed(b) + Math.random() * 2 - (this.speed(a) + Math.random() * 2));
    this.renderOrder();
  }

  speed(unit) {
    let s = unit.stats.spd;
    if (unit.statuses.slow) s *= .65;
    if (unit.buffs.spd) s *= unit.buffs.spd.mult;
    return s;
  }

  eff(unit, stat) {
    let v = unit.stats[stat] || 0;
    if (unit.buffs[stat]) v *= unit.buffs[stat].mult;
    return v;
  }

  tickStart(unit) {
    unit.defending = false;
    for (const key of Object.keys(unit.buffs)) {
      unit.buffs[key].turns--;
      if (unit.buffs[key].turns <= 0) delete unit.buffs[key];
    }
    for (const key of Object.keys(unit.statuses)) {
      unit.statuses[key].turns--;
      if (unit.statuses[key].turns <= 0) delete unit.statuses[key];
    }
    if (unit.taunt > 0) unit.taunt--;
    if (unit.statuses.poison) {
      const dmg = Math.max(4, Math.round(unit.maxHp * .055));
      this.damageHp(unit, dmg);
      this.floatText(`-${dmg}`, unit, '#b9d47f', 18);
      this.addParticlesAt(unit, '#8db36b', 8);
      this.setMessage(`${unit.name} sofre com o veneno.`);
    }
    if (unit.statuses.burn) {
      const dmg = Math.max(5, Math.round(unit.maxHp * .07));
      this.damageHp(unit, dmg);
      this.floatText(`-${dmg}`, unit, '#ef9a65', 18);
      this.addParticlesAt(unit, '#e2683d', 10);
      this.setMessage(`${unit.name} queima nas cinzas.`);
    }
  }

  tickEnd(unit) {
    // Buffs decay at the start of the next turn. Nothing to do here.
  }

  async heroTurn(unit) {
    this.setMessage(`${unit.name}, é a sua vez.`);
    this.renderActor(unit);
    this.commandMode = 'root';
    this.renderCommands(unit);
    return new Promise(resolve => {
      this.turnResolve = resolve;
    });
  }

  async enemyTurn(unit) {
    this.setMessage(`${unit.name} se prepara...`);
    this.renderActor(unit);
    await wait(520);
    const skillId = this.chooseEnemySkill(unit);
    const skill = ENEMY_SKILLS[skillId];
    if (!skill) {
      await this.basicEnemyAttack(unit);
    } else {
      const targets = this.resolveEnemyTargets(unit, skill);
      await this.useSkill(unit, skill, targets);
    }
    this.setMessage('');
    if (!this.finished) {
      await wait(260);
    }
  }

  chooseEnemySkill(unit) {
    const usable = unit.skills.filter(id => {
      const sk = ENEMY_SKILLS[id];
      if (!sk) return false;
      if (sk.kind === 'buff') {
        const key = Object.keys(sk.buff || {})[0];
        if (unit.buffs[key] && unit.buffs[key].turns > 1) return false;
      }
      return true;
    });
    if (!usable.length) return 'attack';
    if (unit.boss && unit.phase2 && unit.id === 'lyra' && !this.barks.has('lyraRequiem') && Math.random() < .7) {
      this.barks.add('lyraRequiem');
      return 'requiem';
    }
    const weights = usable.map(id => {
      const sk = ENEMY_SKILLS[id];
      if (sk.kind === 'buff') return 1;
      if (sk.target === 'allEnemies') return 2;
      if (sk.kind === 'drain') return 2;
      return 4;
    });
    let total = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    for (let i = 0; i < usable.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return usable[i];
    }
    return usable[0];
  }

  resolveEnemyTargets(unit, skill) {
    const heroes = this.heroes.filter(h => h.alive);
    if (!heroes.length) return [];
    if (skill.target === 'self') return [unit];
    if (skill.target === 'allEnemies') return heroes;
    const taunting = heroes.filter(h => h.taunt > 0);
    if (taunting.length) return [pick(taunting)];
    if (Math.random() < .28) {
      return [heroes.slice().sort((a, b) => a.hp - b.hp)[0]];
    }
    return [pick(heroes)];
  }

  async basicEnemyAttack(unit) {
    const targets = this.resolveEnemyTargets(unit, { target: 'enemy' });
    const skill = { name: 'Ataque', kind: 'phys', power: 1, target: 'enemy' };
    await this.useSkill(unit, skill, targets);
  }

  onKey(e) {
    if (!this.active && !this.el.result.classList.contains('hidden')) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const btn = this.el.result.querySelector('button');
        if (btn) btn.click();
      }
      return;
    }
    if (!this.active || this.busy) return;
    if (e.key === 'Escape' || e.key === 'Backspace') {
      e.preventDefault();
      if (this.commandMode !== 'root') {
        this.commandMode = 'root';
        this.pending = null;
        this.renderCommands(this.active);
        this.game.audio.sfx('cancel');
      }
      return;
    }
    if (/^[1-9]$/.test(e.key)) {
      const btn = this.el.commands.querySelector(`[data-key="${e.key}"]`);
      if (btn && !btn.disabled) {
        e.preventDefault();
        btn.click();
      }
    }
  }

  attachKeys() {
    window.addEventListener('keydown', this.onKey);
  }

  setMessage(text) {
    this.message = text;
    if (text) {
      this.el.message.querySelector('span').textContent = text;
      this.el.message.classList.add('visible');
    } else {
      this.el.message.classList.remove('visible');
    }
  }

  renderAll() {
    this.renderEnemyCards();
    this.renderParty();
    this.renderOrder();
    this.renderActor(this.active);
    if (this.active && this.active.side === 'hero' && !this.busy) {
      this.renderCommands(this.active);
    }
  }

  renderEnemyCards() {
    this.el.enemies.innerHTML = this.enemies.map(e => {
      const pct = Math.max(0, Math.round(e.hp / e.maxHp * 100));
      const status = Object.keys(e.statuses).join(' · ');
      return `<div class="enemy-card ${e.alive ? '' : 'dead'}">
        <span class="e-name">${e.name}</span>
        <span class="e-hp"><i style="width:${pct}%"></i></span>
        ${status ? `<span class="e-status">${status}</span>` : ''}
      </div>`;
    }).join('');
  }

  renderParty() {
    this.el.party.innerHTML = this.heroes.map(h => {
      const hp = Math.max(0, Math.round(h.hp / h.maxHp * 100));
      const mp = Math.max(0, Math.round(h.mp / h.maxMp * 100));
      return `<div class="battle-party-card ${h === this.active ? 'active' : ''} ${h.alive ? '' : 'down'}">
        <div class="bp-avatar"><canvas width="40" height="40" data-avatar="${h.id}"></canvas></div>
        <div>
          <div class="bp-name">${h.name} <span style="opacity:.55">Nv.${h.level}</span></div>
          <div class="bp-hp"><i style="width:${hp}%"></i></div>
          <div class="bp-mp"><i style="width:${mp}%"></i></div>
        </div>
      </div>`;
    }).join('');
    for (const cv of this.el.party.querySelectorAll('canvas[data-avatar]')) {
      drawPortrait(cv, cv.dataset.avatar);
    }
  }

  renderOrder() {
    const living = [...this.heroes, ...this.enemies].filter(u => u.alive);
    const order = this.order.filter(u => u.alive);
    const current = this.active;
    this.el.order.innerHTML = order.map((u, i) => {
      const isCurrent = u === current;
      const label = u.side === 'hero' ? u.name : u.name.split(' ')[0];
      if (u.side === 'hero') {
        return `<div class="turn-chip ${isCurrent ? 'current' : ''}" title="${label}"><canvas width="28" height="28" data-chip="${u.id}"></canvas></div>`;
      }
      return `<div class="turn-chip enemy ${isCurrent ? 'current' : ''}" title="${label}">${label.charAt(0)}</div>`;
    }).join('');
    for (const cv of this.el.order.querySelectorAll('canvas[data-chip]')) {
      drawPortrait(cv, cv.dataset.chip);
    }
  }

  renderActor(unit) {
    if (!unit) {
      this.el.actorName.textContent = '—';
      this.el.actorHint.textContent = 'A batalha continua...';
      this.el.actorHp.style.width = '0%';
      this.el.actorMp.style.width = '0%';
      return;
    }
    this.el.actorName.textContent = `${unit.name}${unit.side === 'enemy' ? ' · INIMIGO' : ''}`;
    this.el.actorHint.textContent = unit.side === 'hero' ? 'Escolha uma ação' : 'Turno do inimigo';
    this.el.actorHp.style.width = `${Math.max(0, unit.hp / unit.maxHp * 100)}%`;
    this.el.actorMp.style.width = `${Math.max(0, unit.mp / Math.max(1, unit.maxMp) * 100)}%`;
    drawPortrait(this.el.actorPortrait, unit.side === 'hero' ? unit.id : this.enemyPortraitId(unit));
  }

  enemyPortraitId(unit) {
    return unit.id === 'inquisitor' ? 'voss' : unit.id === 'warden' ? 'guard' : unit.id;
  }

  renderCommands(unit) {
    if (!unit || unit.side !== 'hero') {
      this.el.commands.innerHTML = '';
      return;
    }
    this.el.commands.classList.remove('targeting');
    if (this.commandMode === 'root') {
      const canFlee = this.encounter.canFlee !== false;
      this.el.commands.innerHTML = `
        <button class="cmd-btn" data-key="1" data-act="attack"><span>Atacar</span><small>Golpe básico</small></button>
        <button class="cmd-btn" data-key="2" data-act="skills"><span>Habilidades</span><small>${unit.skills.length} técnicas</small></button>
        <button class="cmd-btn" data-key="3" data-act="items"><span>Itens</span><small>${this.itemCount()} disponíveis</small></button>
        <button class="cmd-btn" data-key="4" data-act="defend"><span>Defender</span><small>Reduz dano · +6 PM</small></button>
        ${canFlee ? '<button class="cmd-btn wide danger" data-key="5" data-act="flee"><span>Fugir</span><small>Tentar escapar da batalha</small></button>' : ''}
      `;
    } else if (this.commandMode === 'skills') {
      const rows = unit.skills.map((id, i) => {
        const sk = SKILLS[id];
        const disabled = unit.mp < sk.cost;
        return `<button class="cmd-btn ${disabled ? 'disabled' : ''}" data-key="${i + 1}" data-act="skill" data-id="${id}" ${disabled ? 'disabled' : ''}>
          <span>${sk.name}</span><small>${sk.cost ? `<span class="cost">${sk.cost} PM</span> · ` : ''}${sk.desc}</small>
        </button>`;
      });
      rows.push(`<button class="cmd-btn" data-key="9" data-act="back"><span>Voltar</span><small>Retornar às ações</small></button>`);
      this.el.commands.innerHTML = rows.join('');
    } else if (this.commandMode === 'items') {
      const entries = Object.entries(this.game.inventory).filter(([id, n]) => n > 0 && ITEMS[id] && ITEMS[id].kind !== 'material');
      if (!entries.length) {
        this.el.commands.innerHTML = `<button class="cmd-btn wide" data-key="1" data-act="back"><span>Mochila vazia</span><small>Voltar</small></button>`;
      } else {
        const rows = entries.map(([id, n], i) => {
          const it = ITEMS[id];
          return `<button class="cmd-btn" data-key="${i + 1}" data-act="item" data-id="${id}">
            <span>${it.name} <span style="color:#9c927f">×${n}</span></span><small>${it.desc}</small>
          </button>`;
        });
        rows.push(`<button class="cmd-btn" data-key="9" data-act="back"><span>Voltar</span><small>Retornar às ações</small></button>`);
        this.el.commands.innerHTML = rows.join('');
      }
    } else if (this.commandMode === 'target') {
      const action = this.pending;
      const targets = this.targetCandidates(action);
      if (!targets.length) {
        this.commandMode = 'root';
        this.pending = null;
        this.renderCommands(unit);
        return;
      }
      this.el.commands.classList.add('targeting');
      const rows = targets.map((t, i) => {
        const pct = Math.max(0, Math.round(t.hp / t.maxHp * 100));
        return `<button class="cmd-btn" data-key="${i + 1}" data-act="target" data-side="${t.side}" data-index="${t.index}">
          <span>${t.name}</span><small>${t.side === 'enemy' ? `Inimigo · ${pct}% PV` : `${t.alive ? `${pct}% PV` : 'Caído'} · ${t.mp}/${t.maxMp} PM`}</small>
        </button>`;
      });
      rows.push(`<button class="cmd-btn" data-key="9" data-act="back"><span>Voltar</span><small>Cancelar alvo</small></button>`);
      this.el.commands.innerHTML = rows.join('');
    }
  }

  itemCount() {
    return Object.entries(this.game.inventory)
      .filter(([id, n]) => n > 0 && ITEMS[id] && ITEMS[id].kind !== 'material')
      .reduce((a, [, n]) => a + n, 0);
  }

  targetCandidates(action) {
    if (!action) return [];
    if (action.type === 'attack') return this.enemies.filter(e => e.alive);
    if (action.type === 'skill') {
      const sk = SKILLS[action.id];
      if (!sk) return [];
      if (sk.target === 'enemy') return this.enemies.filter(e => e.alive);
      if (sk.target === 'ally') return this.heroes.filter(h => h.alive);
      if (sk.target === 'downedAlly') return this.heroes.filter(h => !h.alive);
      if (sk.target === 'allEnemies') return this.enemies.filter(e => e.alive);
      if (sk.target === 'allAllies') return this.heroes.filter(h => h.alive);
      return [];
    }
    if (action.type === 'item') {
      const it = ITEMS[action.id];
      if (!it) return [];
      if (it.kind === 'damageAll') return this.enemies.filter(e => e.alive);
      return this.heroes.filter(h => h.alive || it.kind === 'full');
    }
    return [];
  }

  handleCommand(btn) {
    if (!this.active || this.busy) return;
    const act = btn.dataset.act;
    const unit = this.active;
    if (act === 'back') {
      this.commandMode = 'root';
      this.pending = null;
      this.renderCommands(unit);
      this.game.audio.sfx('cancel');
      return;
    }
    if (act === 'attack') {
      this.pending = { type: 'attack' };
      this.commandMode = 'target';
      this.renderCommands(unit);
      this.game.audio.sfx('click');
      return;
    }
    if (act === 'skills') {
      this.commandMode = 'skills';
      this.renderCommands(unit);
      this.game.audio.sfx('click');
      return;
    }
    if (act === 'items') {
      this.commandMode = 'items';
      this.renderCommands(unit);
      this.game.audio.sfx('click');
      return;
    }
    if (act === 'defend') {
      this.executeHeroAction(unit, { type: 'defend' }, []);
      return;
    }
    if (act === 'flee') {
      this.executeHeroAction(unit, { type: 'flee' }, []);
      return;
    }
    if (act === 'skill') {
      const sk = SKILLS[btn.dataset.id];
      if (!sk || unit.mp < sk.cost) return;
      this.pending = { type: 'skill', id: btn.dataset.id };
      if (sk.target === 'self') {
        this.executeHeroAction(unit, this.pending, [unit]);
      } else if (sk.target === 'allEnemies' || sk.target === 'allAllies') {
        this.executeHeroAction(unit, this.pending, this.targetCandidates(this.pending));
      } else {
        this.commandMode = 'target';
        this.renderCommands(unit);
        this.game.audio.sfx('click');
      }
      return;
    }
    if (act === 'item') {
      const it = ITEMS[btn.dataset.id];
      if (!it || !this.game.inventory[btn.dataset.id]) return;
      this.pending = { type: 'item', id: btn.dataset.id };
      if (it.kind === 'damageAll') {
        this.executeHeroAction(unit, this.pending, this.enemies.filter(e => e.alive));
      } else {
        this.commandMode = 'target';
        this.renderCommands(unit);
        this.game.audio.sfx('click');
      }
      return;
    }
    if (act === 'target') {
      const side = btn.dataset.side;
      const index = Number(btn.dataset.index);
      const list = side === 'hero' ? this.heroes : this.enemies;
      const target = list[index];
      if (target) this.executeHeroAction(unit, this.pending, [target]);
    }
  }

  async executeHeroAction(unit, action, targets) {
    if (this.busy) return;
    this.busy = true;
    this.commandMode = 'root';
    this.pending = null;
    this.el.commands.innerHTML = '';
    try {
      if (action.type === 'defend') {
        unit.defending = true;
        unit.mp = Math.min(unit.maxMp, unit.mp + 6);
        this.setMessage(`${unit.name} ergue a guarda e recupera 6 PM.`);
        this.addParticlesAt(unit, '#8fb6d9', 10);
        this.renderParty();
        this.renderActor(unit);
        await wait(720);
      } else if (action.type === 'flee') {
        const chance = Math.min(.85, .48 + this.speed(unit) * .012);
        if (Math.random() < chance) {
          this.setMessage('Vocês escapam para as sombras...');
          this.game.audio.sfx('cancel');
          await wait(900);
          this.finished = true;
          this.result = 'flee';
        } else {
          this.setMessage('A fuga falha. Não há para onde correr.');
          await wait(800);
        }
      } else if (action.type === 'attack') {
        const sk = { name: 'Ataque', kind: 'phys', power: 1, target: 'enemy', fx: 'slash' };
        await this.useSkill(unit, sk, targets);
      } else if (action.type === 'skill') {
        const sk = SKILLS[action.id];
        if (!sk) return;
        if (unit.mp < sk.cost) {
          this.setMessage('PM insuficiente.');
          await wait(600);
        } else {
          unit.mp -= sk.cost;
          await this.useSkill(unit, sk, targets);
        }
      } else if (action.type === 'item') {
        await this.useItem(unit, action.id, targets);
      }
    } finally {
      this.busy = false;
      this.renderParty();
      this.renderEnemyCards();
      this.renderActor(unit);
      if (!this.finished) {
        this.setMessage('');
        if (this.turnResolve) {
          const resolve = this.turnResolve;
          this.turnResolve = null;
          resolve();
        }
      } else if (this.turnResolve) {
        const resolve = this.turnResolve;
        this.turnResolve = null;
        resolve();
      }
    }
  }

  async useSkill(actor, skill, targets) {
    if (!targets || !targets.length) return;
    const side = actor.side;
    this.setMessage(`${actor.name} usa ${skill.name}!`);
    actor.lungeUntil = performance.now() + 260;
    if (side === 'hero') {
      this.game.audio.sfx(skill.kind === 'magic' || skill.kind === 'heal' ? 'magic' : 'slash');
    } else {
      this.game.audio.sfx(skill.kind === 'magic' ? 'magic' : 'hit');
    }
    this.fx.shake = Math.max(this.fx.shake, skill.kind === 'phys' ? 5 : 3);
    await wait(280);

    if (skill.kind === 'phys' || skill.kind === 'magic') {
      const hits = skill.hits || 1;
      for (let h = 0; h < hits; h++) {
        for (const target of targets) {
          if (!target.alive) continue;
          const result = this.dealDamage(actor, target, skill);
          this.floatText(result.crit ? `CRÍTICO ${result.dmg}` : `${result.dmg}`, target, result.crit ? '#ffd06b' : '#f2e5cf', result.crit ? 26 : 21);
          this.addParticlesAt(target, skill.kind === 'magic' ? '#9f87d8' : '#d5b78a', result.crit ? 18 : 10);
          if (result.crit) this.fx.shake = 12;
          if (skill.fx === 'slash' || skill.fx === 'heavy') this.slashFx(target, skill.fx === 'heavy' ? '#e7b76b' : '#f2e4c9');
          if (skill.fx === 'dawn') this.slashFx(target, '#f4d48e');
          if (skill.fx === 'quake') {
            this.fx.shake = 14;
            this.addParticlesAt(target, '#a28560', 16);
          }
          this.checkBossPhase(target);
          if (!target.alive) this.markDead(target);
          this.renderEnemyCards();
          this.renderParty();
        }
        if (hits > 1) await wait(170);
      }
    } else if (skill.kind === 'heal' || skill.kind === 'healSelf') {
      const amount = skill.kind === 'healSelf'
        ? Math.round(actor.maxHp * skill.power)
        : Math.round(skill.power + this.eff(actor, 'mag') * 2.1);
      for (const target of targets) {
        if (!target.alive) continue;
        const before = target.hp;
        target.hp = Math.min(target.maxHp, target.hp + amount);
        const healed = target.hp - before;
        this.floatText(`+${healed}`, target, '#a8e29d', 23);
        this.addParticlesAt(target, '#8fd9a1', 14);
      }
      this.game.audio.sfx('heal');
    } else if (skill.kind === 'shield') {
      const amount = Math.round(skill.power + this.eff(actor, 'mag') * 2.2);
      for (const target of targets) {
        target.shield += amount;
        this.floatText(`+${amount} ESCUDO`, target, '#a8d8e8', 17);
        this.addParticlesAt(target, '#8bc6e8', 12);
      }
      this.game.audio.sfx('shield');
    } else if (skill.kind === 'buff') {
      for (const target of targets) {
        for (const [stat, mult] of Object.entries(skill.buff)) {
          if (stat === 'turns') continue;
          target.buffs[stat] = { mult, turns: skill.buff.turns };
        }
        this.floatText('▲ FORTALECIDO', target, '#e7c978', 16);
        this.addParticlesAt(target, '#e2b45e', 12);
      }
      this.game.audio.sfx('shield');
    } else if (skill.kind === 'taunt') {
      actor.taunt = 2;
      actor.defending = true;
      this.floatText('PROVOCAR', actor, '#e39a68', 17);
      this.addParticlesAt(actor, '#e2683d', 12);
      this.game.audio.sfx('shield');
    } else if (skill.kind === 'revive') {
      for (const target of targets) {
        if (target.alive) continue;
        target.alive = true;
        target.hp = Math.max(1, Math.round(target.maxHp * skill.power));
        this.floatText('RENASCER', target, '#f0d58d', 18);
        this.addParticlesAt(target, '#f0d58d', 22);
      }
      this.game.audio.sfx('levelup');
    } else if (skill.kind === 'drain') {
      for (const target of targets) {
        if (!target.alive) continue;
        const result = this.dealDamage(actor, target, skill);
        this.floatText(`${result.dmg}`, target, '#e4b8d3', 20);
        const heal = Math.round(result.dmg * .55);
        actor.hp = Math.min(actor.maxHp, actor.hp + heal);
        this.floatText(`+${heal}`, actor, '#c6a5d8', 17);
        this.addParticlesAt(target, '#a774a7', 14);
        this.addParticlesAt(actor, '#a774a7', 8);
        this.checkBossPhase(target);
        if (!target.alive) this.markDead(target);
      }
      this.game.audio.sfx('magic');
    } else if (skill.kind === 'debuff') {
      for (const target of targets) {
        target.statuses.slow = { turns: 3 };
        this.floatText('LENTO', target, '#9fb1d7', 16);
        this.addParticlesAt(target, '#738ab7', 12);
      }
      this.game.audio.sfx('magic');
    }

    if (skill.status) {
      for (const target of targets) {
        if (target.alive) {
          target.statuses[skill.status] = { turns: skill.statusTurns || 3 };
          this.floatText(skill.status.toUpperCase(), target, '#d99a6a', 14);
        }
      }
    }

    this.renderParty();
    this.renderEnemyCards();
    await wait(620);
  }

  async useItem(actor, itemId, targets) {
    const item = ITEMS[itemId];
    if (!item || !this.game.inventory[itemId]) return;
    this.game.inventory[itemId]--;
    if (this.game.inventory[itemId] <= 0) delete this.game.inventory[itemId];
    this.setMessage(`${actor.name} usa ${item.name}.`);
    this.game.audio.sfx(item.kind === 'damageAll' ? 'hit' : 'heal');
    await wait(260);
    if (item.kind === 'damageAll') {
      for (const target of targets) {
        if (!target.alive) continue;
        const dmg = Math.round(item.amount * rand(.9, 1.1));
        this.damageHp(target, dmg);
        this.floatText(`${dmg}`, target, '#efae6a', 22);
        this.addParticlesAt(target, '#e2683d', 14);
        this.checkBossPhase(target);
        if (!target.alive) this.markDead(target);
      }
      this.fx.shake = 10;
    } else {
      for (const target of targets) {
        if (item.kind === 'heal' && target.alive) {
          const before = target.hp;
          target.hp = Math.min(target.maxHp, target.hp + item.amount);
          this.floatText(`+${target.hp - before}`, target, '#a8e29d', 21);
        } else if (item.kind === 'mp' && target.alive) {
          const before = target.mp;
          target.mp = Math.min(target.maxMp, target.mp + item.amount);
          this.floatText(`+${target.mp - before} PM`, target, '#9cc8e9', 18);
        } else if (item.kind === 'full' && target.alive) {
          target.hp = target.maxHp;
          target.mp = target.maxMp;
          this.floatText('RESTAURADO', target, '#f0d58d', 18);
        } else if (item.kind === 'cure' && target.alive) {
          delete target.statuses.poison;
          delete target.statuses.burn;
          this.floatText('CURADO', target, '#b8d9a3', 17);
        }
        this.addParticlesAt(target, '#8fd9a1', 10);
      }
    }
    this.renderParty();
    this.renderEnemyCards();
    await wait(560);
  }

  dealDamage(actor, target, skill) {
    const magic = skill.kind === 'magic' || skill.kind === 'drain';
    const atk = magic ? this.eff(actor, 'mag') : this.eff(actor, 'atk');
    let def = magic ? target.stats.def * .32 : target.stats.def * .78;
    if (target.buffs.def) def *= target.buffs.def.mult;
    let base = atk * skill.power * (magic ? 2.25 : 2.05) - def;
    base = Math.max(4, base) * rand(.9, 1.1);
    const critChance = .045 + (actor.stats.luck || 0) * .006;
    const crit = Math.random() < critChance;
    if (crit) base *= 1.58;
    if (target.defending) base *= .48;
    let dmg = Math.max(1, Math.round(base));
    if (target.shield > 0) {
      const absorbed = Math.min(target.shield, dmg);
      target.shield -= absorbed;
      dmg -= absorbed;
      if (absorbed > 0) this.floatText(`-${absorbed} escudo`, target, '#9bcfe4', 14);
    }
    if (target.taunt > 0 && !target.defending) dmg = Math.round(dmg * .9);
    this.damageHp(target, dmg);
    target.flashUntil = performance.now() + 140;
    this.fx.flash = Math.max(this.fx.flash, .18);
    return { dmg, crit };
  }

  damageHp(unit, amount) {
    unit.hp = Math.max(0, unit.hp - amount);
    if (unit.hp <= 0 && unit.alive) {
      unit.alive = false;
      if (unit.side === 'hero') {
        this.setMessage(`${unit.name} cai. A chama vacila.`);
        this.game.audio.sfx('hurt');
      }
    }
  }

  markDead(unit) {
    if (unit.alive) return;
    this.addParticlesAt(unit, unit.side === 'enemy' ? '#d98a5b' : '#9b8d7a', 24);
    this.fx.shake = Math.max(this.fx.shake, 9);
    if (unit.side === 'enemy') this.game.audio.sfx('hit');
  }

  checkBossPhase(target) {
    if (target.side !== 'enemy' || !target.boss || target.phase2) return;
    if (target.hp <= target.maxHp * .5 && target.alive) {
      target.phase2 = true;
      target.buffs.atk = { mult: 1.25, turns: 99 };
      target.buffs.mag = { mult: 1.25, turns: 99 };
      target.buffs.spd = { mult: 1.15, turns: 99 };
      target.flashUntil = performance.now() + 300;
      this.fx.flash = .65;
      this.fx.shake = 20;
      this.game.audio.sfx('boss');
      if (target.id === 'warden') {
        this.setMessage('Gorr ruge. "O ABISMO NÃO DEVOLVE NINGUÉM!"');
      } else if (target.id === 'darian') {
        this.setMessage('Darian parte o próprio brasão. "Eu não vou voltar a ser sombra de ninguém!"');
      } else if (target.id === 'lyra') {
        this.setMessage('A Coroa desperta. "ENTÃO VENHA, CAVALEIRO DE CINZAS."');
      } else if (target.id === 'voss') {
        this.setMessage('Voss arranca a máscara. "A fé não precisa de rosto."');
      }
      this.addParticlesAt(target, '#e2683d', 34);
    }
  }

  slashFx(target, color) {
    const { x, y } = this.pos(target);
    for (let i = 0; i < 3; i++) {
      this.fx.particles.push({
        kind: 'slash', x: x + rand(-14, 14), y: y - 50 + rand(-18, 18),
        radius: rand(22, 44), a0: rand(-1.4, -.4), a1: rand(.4, 1.4),
        life: .34, maxLife: .34, color, size: rand(2, 4)
      });
    }
  }

  addParticles(x, y, color, count, spread = 30) {
    for (let i = 0; i < count; i++) {
      this.fx.particles.push({
        kind: 'dot', x: x + rand(-spread, spread), y: y - rand(10, 90),
        vx: rand(-90, 90), vy: rand(-120, -10), gravity: 180,
        life: rand(.35, .8), maxLife: .8, color, size: rand(1.5, 3.5)
      });
    }
  }

  addParticlesAt(unit, color, count, spread = 30) {
    const { x, y } = this.pos(unit);
    this.addParticles(x, y, color, count, spread);
  }

  ringFx(target, color) {
    const { x, y } = this.pos(target);
    this.fx.particles.push({ kind: 'ring', x, y: y - 40, radius: 80, life: .5, maxLife: .5, color });
  }

  floatText(text, unit, color, size = 20) {
    const { x, y } = this.pos(unit);
    this.fx.floaters.push({ text, x, y: y - 95, color, size, life: 1.1, maxLife: 1.1 });
  }

  pos(unit) {
    if (unit.side === 'hero') {
      const n = this.heroes.length;
      const start = 300 - (n - 1) * 55;
      return { x: start + unit.index * 110, y: 350 };
    }
    const n = this.enemies.length;
    const start = n === 1 ? 760 : n === 2 ? 700 : 640;
    return { x: start + unit.index * (n === 1 ? 0 : n === 2 ? 150 : 140), y: 352 };
  }

  checkEnd() {
    if (this.finished) return true;
    if (this.heroes.every(h => !h.alive)) {
      this.finished = true;
      this.result = 'defeat';
      this.setMessage('A escuridão toma o campo...');
      this.game.audio.sfx('defeat');
      return true;
    }
    if (this.enemies.every(e => !e.alive)) {
      this.finished = true;
      this.result = 'win';
      this.setMessage('Vitória!');
      return true;
    }
    return false;
  }

  async victorySequence() {
    this.setMessage('');
    this.game.audio.sfx('victory');
    const xp = this.enemies.reduce((a, e) => a + (e.xp || 0), 0);
    const gold = this.enemies.reduce((a, e) => a + (e.gold || 0), 0);
    const loot = {};
    for (const e of this.enemies) {
      if (e.boss) loot.shard = (loot.shard || 0) + (e.id === 'darian' ? 2 : 1);
    }
    const levelUps = [];
    for (const hero of this.heroes) {
      const res = this.game.gainXp(hero.id, xp);
      if (res.levels > 0) levelUps.push(`${hero.name} alcançou o nível ${res.member.level}!`);
      hero.level = res.member.level;
      hero.maxHp = res.member.maxHp;
      hero.maxMp = res.member.maxMp;
      hero.stats = { ...res.member.stats };
    }
    this.game.gold += gold;
    for (const [id, count] of Object.entries(loot)) this.game.addItem(id, count);
    this.game.syncPartyFromBattle(this.heroes);
    this.game.updateHUD();

    this.rewards = { xp, gold, loot, levelUps };
    this.el.result.innerHTML = `
      <div class="result-card">
        <span class="eyebrow">VITÓRIA</span>
        <h2>${this.encounter.title || 'Batalha vencida'}</h2>
        <p class="result-sub">${this.encounter.victory || 'O caminho se abre.'}</p>
        <div class="result-stats">
          <span><b>+${xp}</b> XP</span>
          <span><b>+${gold}</b> ouro</span>
          ${Object.entries(loot).map(([id, n]) => `<span><b>+${n}</b> ${ITEMS[id]?.name || id}</span>`).join('')}
        </div>
        ${levelUps.length ? `<div class="result-levelups">${levelUps.map(t => `<strong>✦</strong> ${t}`).join('<br>')}</div>` : '<div class="result-levelups" style="opacity:.65">A experiência fortalece o grupo.</div>'}
        <button class="primary-btn" id="battle-continue">Continuar</button>
      </div>`;
    this.el.result.classList.remove('hidden');
    await new Promise(resolve => {
      const btn = document.getElementById('battle-continue');
      if (btn) btn.addEventListener('click', resolve, { once: true });
      else resolve();
    });
    this.el.result.classList.add('hidden');
  }

  update(dt) {
    this.fx.shake = Math.max(0, this.fx.shake - dt * 35);
    this.fx.flash = Math.max(0, this.fx.flash - dt * 2.2);
    for (const p of this.fx.particles) {
      p.life -= dt;
      if (p.kind === 'dot') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += p.gravity * dt;
      }
    }
    this.fx.particles = this.fx.particles.filter(p => p.life > 0);
    for (const f of this.fx.floaters) {
      f.life -= dt;
      f.y -= dt * 34;
    }
    this.fx.floaters = this.fx.floaters.filter(f => f.life > 0);
  }

  draw(ctx, t) {
    const now = performance.now();
    ctx.save();
    if (this.fx.shake > .2) {
      ctx.translate(rand(-this.fx.shake, this.fx.shake), rand(-this.fx.shake * .6, this.fx.shake * .6));
    }
    drawBattleBackground(ctx, this.background, t);

    // active rings
    for (const u of [...this.heroes, ...this.enemies]) {
      if (!u.alive) continue;
      const { x, y } = this.pos(u);
      if (u === this.active) {
        ctx.save();
        ctx.globalAlpha = .45 + Math.sin(t * 4) * .12;
        ctx.strokeStyle = '#e2b45e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x, y + 2, 34, 9, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      if (u.taunt > 0) {
        ctx.save();
        ctx.globalAlpha = .35;
        ctx.strokeStyle = '#e2683d';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y - 40, 48 + Math.sin(t * 5) * 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      if (u.shield > 0) {
        ctx.save();
        ctx.globalAlpha = .3;
        ctx.strokeStyle = '#8bc6e8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(x, y - 38, 34, 52, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = .07;
        ctx.fillStyle = '#8bc6e8';
        ctx.fill();
        ctx.restore();
      }
    }

    // heroes
    for (const h of this.heroes) {
      const { x, y } = this.pos(h);
      let ox = 0;
      if (h.lungeUntil > now) ox = 16 * ((h.lungeUntil - now) / 260);
      const flash = h.flashUntil > now;
      if (!h.alive) {
        ctx.save();
        ctx.globalAlpha = .28;
        ctx.translate(x, y);
        ctx.rotate(-.45);
        drawCharacter(ctx, h.id, 0, 0, 'right', 0, 2, { battle: true, time: t });
        ctx.restore();
      } else {
        if (flash) ctx.filter = 'brightness(2.2) saturate(.2)';
        drawCharacter(ctx, h.id, x + ox, y, 'right', Math.floor(t * 2 + h.index) % 2, 2, { battle: true, time: t });
        ctx.filter = 'none';
      }
      this.drawStatusIcons(ctx, h, x, y - 94);
    }

    // enemies
    for (const e of this.enemies) {
      const { x, y } = this.pos(e);
      let ox = 0;
      if (e.lungeUntil > now) ox = -18 * ((e.lungeUntil - now) / 260);
      const flash = e.flashUntil > now;
      if (e.boss) {
        ctx.save();
        ctx.globalAlpha = e.alive ? .22 : .08;
        const g = ctx.createRadialGradient(x, y - 80, 10, x, y - 80, 120);
        g.addColorStop(0, e.id === 'lyra' ? '#b53b54' : '#d8a84f');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y - 80, 120, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      drawEnemy(ctx, e.art, x + ox, y, (ENEMIES[e.id].scale || 1) * 1.0, t, flash, 1, !e.alive);
      this.drawStatusIcons(ctx, e, x, y - (e.boss ? 170 : 100));
    }

    drawParticles(ctx, this.fx.particles);
    drawFloaters(ctx, this.fx.floaters);

    if (this.fx.flash > 0) {
      ctx.globalAlpha = Math.min(.7, this.fx.flash);
      ctx.fillStyle = this.fx.flashColor;
      ctx.fillRect(-40, -40, 1024 + 80, 576 + 80);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  drawStatusIcons(ctx, unit, x, y) {
    const icons = [];
    if (unit.statuses.poison) icons.push('☠');
    if (unit.statuses.burn) icons.push('✹');
    if (unit.statuses.slow) icons.push('❄');
    if (unit.buffs.atk) icons.push('▲');
    if (unit.buffs.def) icons.push('◆');
    if (!icons.length) return;
    ctx.save();
    ctx.font = '600 12px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(5,7,12,.72)';
    const text = icons.join(' ');
    const width = ctx.measureText(text).width + 12;
    ctx.fillRect(x - width / 2, y - 9, width, 18);
    ctx.fillStyle = '#f0d58d';
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  bindUi() {
    this.el.commands.addEventListener('click', this.onCommandClick);
    this.attachKeys();
  }
}
