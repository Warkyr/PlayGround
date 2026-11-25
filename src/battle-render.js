/* =========================================================================
   AURORA PARTIDA — battle presentation
   ========================================================================= */
'use strict';

function battleLungeOffset(sprite, time) {
  if (sprite.lungeAt == null || time < sprite.lungeAt) return 0;
  const p = (time - sprite.lungeAt) / (sprite.lungeDur || .36);
  if (p >= 1) return 0;
  return Math.sin(p * Math.PI) * (sprite.lungeDir || 1) * 46;
}

function drawEnemyHpBar(ctx, e, x, y, w) {
  const pct = e.hp / e.maxHp;
  ctx.save();
  ctx.font = `bold 9px ${F_BODY}`;
  drawText(ctx, e.name, x, y - 4, { size: 9, align: 'center', color: e.boss ? '#f0d090' : 'rgba(240,230,210,.8)', weight: 'bold' });
  drawBar(ctx, x - w / 2, y, w, 5, pct, e.enraged ? '#ff8a5a' : '#e0a050', e.enraged ? '#a82020' : '#805020', { border: 'rgba(255,230,180,.2)' });
  ctx.restore();
}

function drawBattleEffects(ctx, a) {
  for (const f of a.effects) {
    const p = f.t / f.dur;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.max(0, 1 - p);
    if (f.type === 'slash') {
      ctx.strokeStyle = '#fff3cf'; ctx.lineWidth = 5 * (1 - p) + 1;
      ctx.beginPath();
      ctx.arc(f.x, f.y + 10, 46 + p * 24, -1.1 + p * .2, .5 + p * .2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,220,150,.6)'; ctx.lineWidth = 12;
      ctx.beginPath(); ctx.arc(f.x, f.y + 10, 50 + p * 20, -1 + p * .2, .45 + p * .2); ctx.stroke();
    } else if (f.type === 'fire') {
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = `rgba(255,170,70,${.5 - p * .4})`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(f.x, f.y + 30 - p * 40, 20 + p * 60 + i * 12, 8 + p * 20, 0, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255,200,90,.5)';
      for (let i = 0; i < 12; i++) {
        const an = i * 2.1 + p * 3;
        ctx.fillRect(f.x + Math.cos(an) * (20 + p * 50), f.y + 20 - p * 80 + Math.sin(an) * 20, 2, 2);
      }
    } else if (f.type === 'holy') {
      const grad = ctx.createLinearGradient(f.x, f.y - 260, f.x, f.y + 80);
      grad.addColorStop(0, 'rgba(255,250,210,0)');
      grad.addColorStop(.5, `rgba(255,245,190,${.6 * (1 - p)})`);
      grad.addColorStop(1, 'rgba(255,245,190,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(f.x - 26 + Math.sin(p * 9) * 4, f.y - 260, 52, 340);
      ctx.strokeStyle = 'rgba(255,255,230,.8)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(f.x, f.y + 20, 60 * p + 10, 0, Math.PI * 2); ctx.stroke();
    } else if (f.type === 'heal') {
      for (let i = 0; i < 8; i++) {
        const an = i * .8;
        ctx.fillStyle = `rgba(150,240,170,${.55 * (1 - p)})`;
        ctx.fillRect(f.x + Math.cos(an) * 34, f.y + 40 - p * 90 + Math.sin(an) * 20, 3, 3);
      }
      ctx.strokeStyle = 'rgba(160,240,180,.5)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(f.x, f.y + 38, 40 + p * 20, 12 + p * 6, 0, 0, Math.PI * 2); ctx.stroke();
    } else if (f.type === 'shield') {
      ctx.strokeStyle = 'rgba(150,210,255,.7)'; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= 6; i++) {
        const an = i * Math.PI / 3 - Math.PI / 2;
        const r = 26 + p * 10;
        const px = f.x + Math.cos(an) * r, py = f.y + 10 + Math.sin(an) * r;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke();
    } else if (f.type === 'buff') {
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = `rgba(255,220,130,${.6 - i * .15})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(f.x, f.y + 30 - i * 18 - p * 14, 16 + i * 10, 6 + i * 3, 0, 0, Math.PI * 2); ctx.stroke();
      }
    } else if (f.type === 'dark') {
      ctx.fillStyle = `rgba(150,60,180,${.45 * (1 - p)})`;
      for (let i = 0; i < 5; i++) {
        const an = i * 1.3 + p * 2;
        ctx.beginPath(); ctx.ellipse(f.x + Math.cos(an) * 30, f.y + 20 + Math.sin(an) * 20, 20 + p * 20, 8, an, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      ctx.strokeStyle = f.color + 'rgba(255,255,255,.2)';
      ctx.strokeStyle = 'rgba(255,230,170,.55)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(f.x, f.y + 20, 20 + p * (f.r || 50), 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }
  // partículas
  for (const p of a.particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - p.t / p.life);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
    ctx.restore();
  }
  // números
  for (const p of a.popups) {
    const alpha = p.t < .1 ? p.t / .1 : Math.max(0, 1 - (p.t - .55) / .45);
    ctx.save();
    ctx.globalAlpha = clamp(alpha, 0, 1);
    const sz = p.big ? 30 : 20;
    drawText(ctx, p.text, p.x, p.y, {
      size: sz, align: 'center', color: p.color, weight: 'bold',
      stroke: 'rgba(10,8,12,.8)', strokeWidth: 4, shadow: 'rgba(0,0,0,.7)', shadowBlur: 6
    });
    ctx.restore();
  }
}

function drawEnemyTargetMarker(ctx, a, s, active) {
  const bob = Math.sin(a.time * 5) * 3;
  const y = s.baseY - (s.unit.boss ? 200 : 105) - 26 + bob;
  ctx.save();
  ctx.fillStyle = active ? '#ffe19a' : 'rgba(216,181,106,.4)';
  ctx.beginPath(); ctx.moveTo(s.x, y + 16); ctx.lineTo(s.x - 9, y); ctx.lineTo(s.x + 9, y); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,240,200,.7)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.ellipse(s.x, s.baseY + 2, 40, 10, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

function drawBattlePanel(ctx, a) {
  const ch = a.chooser;
  const ux = G.ux;
  const px = 20, py = 430, pw = 920, ph = 158;
  panel(ctx, px, py, pw, ph, {
    r: 12, top: 'rgba(17,23,39,.97)', bottom: 'rgba(7,10,18,.98)',
    border: 'rgba(216,181,106,.6)', borderWidth: 2
  });
  // divisor
  line(ctx, 330, py + 10, 330, py + ph - 10, 'rgba(216,181,106,.16)', 1);
  line(ctx, 666, py + 10, 666, py + ph - 10, 'rgba(216,181,106,.16)', 1);

  // status do grupo
  const active = ch ? ch.hero : (a.mode === 'command' ? a.activeHero : null);
  a.partyHitboxes = [];
  G.state.party.forEach((h, i) => {
    const ry = py + 12 + i * 70;
    const isActive = active === h;
    const isDead = h.hp <= 0;
    ctx.save();
    rr(ctx, px + 10, ry, 306, 62, 7);
    ctx.fillStyle = isActive ? 'rgba(60,78,116,.38)' : 'rgba(12,16,27,.55)';
    ctx.fill();
    if (isActive) { ctx.strokeStyle = 'rgba(240,216,154,.55)'; ctx.lineWidth = 1.5; ctx.stroke(); }
    ctx.restore();
    const hit = a.chooser && a.chooser.mode === 'target' && a.chooser.targetSide === 'ally' && a.chooser.targetIdx === i;
    if (hit) {
      ctx.save(); rr(ctx, px + 10, ry, 306, 62, 7);
      ctx.strokeStyle = 'rgba(255,220,140,.95)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    }
    drawText(ctx, h.name, px + 24, ry + 19, { size: 13.5 * ux, color: isDead ? '#7a7468' : HEROES[h.id].color, weight: 'bold' });
    drawText(ctx, `Nv.${h.level}`, px + 130, ry + 19, { size: 9.5, color: 'rgba(220,210,190,.5)' });
    if (h.guard) drawText(ctx, '⛨', px + 164, ry + 19, { size: 11, color: '#9fc8ff' });
    if (h.atkUp > 0) drawText(ctx, 'ATQ↑', px + 180, ry + 19, { size: 8, color: '#ffd080' });
    if (h.atkDown > 0) drawText(ctx, 'ATQ↓', px + 204, ry + 19, { size: 8, color: '#c090e0' });
    drawBar(ctx, px + 24, ry + 27, 226, 10, h.hp / h.maxHp, '#8fe09a', '#3e8a52');
    drawText(ctx, `${h.hp}/${h.maxHp}`, px + 254, ry + 36, { size: 8.5, color: 'rgba(220,240,220,.75)', align: 'right' });
    drawBar(ctx, px + 24, ry + 43, 226, 7, h.mp / h.maxMp, '#8fc0f0', '#3d5e9a');
    drawText(ctx, `${h.mp}/${h.maxMp}`, px + 254, ry + 49, { size: 7.5, color: 'rgba(210,225,245,.65)', align: 'right' });
    a.partyHitboxes.push({ x: px + 10, y: ry, w: 306, h: 62, index: i });
    if (isDead) {
      ctx.save(); ctx.globalAlpha = .45; ctx.fillStyle = '#05070c';
      rr(ctx, px + 10, ry, 306, 62, 7); ctx.fill(); ctx.restore();
      drawText(ctx, 'CAÍDO', px + 274, ry + 36, { size: 8, color: '#a06060', align: 'right' });
    }
  });

  // painel central
  const mx = px + 326, my = py + 12, mw = 322, mh = ph - 24;
  if (a.mode === 'victory' || a.mode === 'defeat') {
    drawText(ctx, 'FIM DO COMBATE', mx + 10, my + 22, { size: 11, color: 'rgba(216,181,106,.6)' });
    return;
  }
  if (!ch) {
    drawText(ctx, a.fled ? 'FUGINDO...' : 'O COMBATE CONTINUA...', mx + 8, my + 24, { size: 11, color: 'rgba(220,210,190,.5)' });
    if (a.turn) drawText(ctx, `Turno ${a.turn}`, mx + mw - 12, my + 24, { size: 10, color: 'rgba(216,181,106,.55)', align: 'right' });
    return;
  }
  const hero = ch.hero;
  drawText(ctx, `${hero.name.toUpperCase()}`, mx + 6, my + 18, { size: 11, color: HEROES[hero.id].color, weight: 'bold' });
  drawText(ctx, ch.mode === 'target' ? 'ESCOLHA O ALVO' : ch.mode === 'skill' ? 'HABILIDADES' : ch.mode === 'item' ? 'ITENS' : 'AÇÃO', mx + mw - 8, my + 18, { size: 9, color: 'rgba(216,181,106,.7)', align: 'right', weight: 'bold' });

  if (ch.mode === 'command') {
    const opts = commandOptions(a);
    opts.forEach((cmd, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const bx = mx + col * 158, by = my + 30 + row * 36;
      uiButton(ctx, 'cmd-' + i, bx, by, 148, 30, `${cmd.symbol} ${cmd.label}`, {
        size: 10.5 * (G.mobile ? 1.2 : 1), active: ch.idx === i, enabled: !cmd.disabled,
        onClick: () => battlePickCommand(a, i)
      });
    });
    if (ch.msg) drawText(ctx, ch.msg, mx + 8, my + mh - 4, { size: 9, color: '#ffb0a0' });
  } else if (ch.mode === 'skill') {
    const ids = [...new Set(hero.skills)];
    ids.forEach((id, i) => {
      const sk = SKILLS[id];
      const by = my + 28 + i * 26;
      const disabled = hero.mp < sk.cost;
      uiButton(ctx, 'sk-' + id, mx, by, 310, 24, `${sk.name}`, {
        size: 10 * (G.mobile ? 1.15 : 1), active: ch.skillIdx === i, enabled: !disabled,
        onClick: () => { ch.skillIdx = i; battlePickSkill(a, id); }
      });
      drawText(ctx, `${sk.cost} MP`, mx + 300, by + 16, { size: 8.5, color: disabled ? '#7a5454' : '#9fc8f0', align: 'right' });
    });
    if (ch.msg) drawText(ctx, ch.msg, mx + 6, my + mh - 4, { size: 9, color: '#ffb0a0' });
    uiButton(ctx, 'sk-back', mx + 240, my + mh - 24, 68, 20, 'Voltar', { size: 8.5, onClick: () => battleBack(a) });
    if (hero.skills.length) {
      drawText(ctx, SKILLS[[...new Set(hero.skills)][ch.skillIdx]]?.desc || '', mx + 4, my + mh - 6, { size: 8.5, color: 'rgba(220,212,190,.45)' });
    }
  } else if (ch.mode === 'item') {
    const keys = Object.keys(G.state.items).filter(k => G.state.items[k] > 0);
    if (!keys.length) drawText(ctx, 'Nenhum item.', mx + 8, my + 50, { size: 11, color: 'rgba(220,210,190,.5)', italic: true });
    keys.forEach((k, i) => {
      const it = ITEMS[k];
      const by = my + 30 + i * 32;
      uiButton(ctx, 'itm-' + k, mx, by, 310, 28, `${it.name}  x${G.state.items[k]}`, {
        size: 10, active: ch.itemIdx === i, onClick: () => { ch.itemIdx = i; battlePickItem(a, k); }
      });
    });
    uiButton(ctx, 'itm-back', mx + 240, my + mh - 24, 68, 20, 'Voltar', { size: 8.5, onClick: () => battleBack(a) });
    if (keys.length) drawText(ctx, ITEMS[keys[ch.itemIdx]]?.desc || '', mx + 4, my + mh - 6, { size: 8.5, color: 'rgba(220,212,190,.45)' });
  } else if (ch.mode === 'target') {
    const list = ch.targetSide === 'enemy' ? a.enemies : a.party;
    list.forEach((u, i) => {
      const valid = ch.targetSide === 'enemy' ? (!u.dead && u.hp > 0) : u.hp > 0;
      if (!valid) return;
      const row = ch.targetSide === 'enemy' ? a.enemies.filter((e, j) => j < i && (!e.dead && e.hp > 0)).length : a.party.filter((h, j) => j < i && h.hp > 0).length;
      const by = my + 32 + row * 30;
      const label = `${u.name}${ch.targetSide === 'enemy' ? `  ${u.hp}/${u.maxHp}` : `  ${u.hp}/${u.maxHp} HP`}`;
      uiButton(ctx, 'tgt-' + i, mx, by, 310, 26, label, {
        size: 9.5 * (G.mobile ? 1.15 : 1), active: ch.targetIdx === i, onClick: () => battlePickTarget(a, i)
      });
    });
    uiButton(ctx, 'tgt-back', mx + 240, my + mh - 24, 68, 20, 'Voltar', { size: 8.5, onClick: () => battleBack(a) });
  }

  // registro
  const lx = px + 676;
  drawText(ctx, 'REGISTRO', lx, py + 20, { size: 8.5, color: 'rgba(216,181,106,.55)', weight: 'bold' });
  const logs = a.log.slice(-3);
  logs.forEach((l, i) => {
    ctx.save(); ctx.font = `${10.5 * (G.mobile ? 1.1 : 1)}px ${F_BODY}`;
    const lns = wrapLines(ctx, l.text, 246);
    drawText(ctx, lns[0], lx, py + 38 + i * 38, { size: 10.5, color: l.color });
    if (lns[1]) drawText(ctx, lns[1], lx, py + 50 + i * 38, { size: 10.5, color: l.color });
    ctx.restore();
  });
  if (!a.log.length) drawText(ctx, 'O destino aguarda.', lx, py + 44, { size: 10, color: 'rgba(220,210,190,.35)', italic: true });
}

function drawBattleTop(ctx, a) {
  const ux = G.ux;
  drawText(ctx, `TURNO ${a.turn}`, 26, 34, { size: 11 * ux, color: 'rgba(216,181,106,.7)', weight: 'bold' });
  line(ctx, 26, 42, 96, 42, 'rgba(216,181,106,.25)', 1);
  const boss = a.enemies.find(e => e.boss && !e.dead) || a.enemies.find(e => e.boss);
  if (boss) {
    const w = 430, x = 480 - w / 2, y = 26;
    drawText(ctx, boss.name.toUpperCase(), 480, y - 6, { size: 11 * ux, align: 'center', color: '#f0d090', weight: 'bold', shadow: 'rgba(0,0,0,.8)' });
    drawBar(ctx, x, y + 4, w, 11, boss.hp / boss.maxHp, boss.enraged ? '#ff8050' : '#d8b05a', boss.enraged ? '#8a1a1a' : '#7a5220', { border: 'rgba(240,220,170,.5)' });
    drawText(ctx, `${Math.max(0, boss.hp)} / ${boss.maxHp}`, 480, y + 13, { size: 7.5, align: 'center', color: 'rgba(255,245,220,.8)', weight: 'bold' });
  }
}

function drawBattleAnnounce(ctx, a) {
  if (!a.announce) return;
  const an = a.announce;
  const p = an.t / an.dur;
  const alpha = p < .12 ? p / .12 : p > .8 ? (1 - p) / .2 : 1;
  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  const bg = ctx.createLinearGradient(0, 200, 0, 360);
  bg.addColorStop(0, 'rgba(5,8,15,0)');
  bg.addColorStop(.25, 'rgba(5,8,15,.86)');
  bg.addColorStop(.75, 'rgba(5,8,15,.86)');
  bg.addColorStop(1, 'rgba(5,8,15,0)');
  ctx.fillStyle = bg; ctx.fillRect(0, 190, 960, 180);
  ctx.strokeStyle = 'rgba(216,181,106,.55)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(220, 272); ctx.lineTo(740, 272); ctx.stroke();
  diamond(ctx, 208, 272, 3.5, 'rgba(216,181,106,.8)'); diamond(ctx, 752, 272, 3.5, 'rgba(216,181,106,.8)');
  spacedText(ctx, an.title, 480, 246, 3, { size: 32, align: 'center', color: '#f2dfae', shadow: 'rgba(255,180,90,.25)', shadowBlur: 16 });
  drawText(ctx, an.line, 480, 298, { size: 12.5, align: 'center', italic: true, color: 'rgba(235,225,205,.75)', font: F_SERIF });
  ctx.restore();
}

function drawBattleVictory(ctx, a) {
  if (a.mode !== 'victory' || !a.rewards) return;
  const t = a.rewardT || 0;
  ctx.save();
  ctx.fillStyle = 'rgba(4,6,12,.68)'; ctx.fillRect(0, 0, 960, 600);
  const w = 560, h = 380, x = 480 - w / 2, y = 300 - h / 2 + 10;
  panel(ctx, x, y, w, h, { r: 14, border: 'rgba(240,216,154,.7)', borderWidth: 2, top: 'rgba(19,26,42,.98)', bottom: 'rgba(8,11,19,.99)' });
  drawText(ctx, '✦  VITÓRIA  ✦', 480, y + 52, { size: 28, align: 'center', font: F_SERIF, color: '#f2dfae', weight: 'bold', shadow: 'rgba(255,210,120,.35)', shadowBlur: 14 });
  drawText(ctx, 'A aurora resiste.', 480, y + 74, { size: 11, align: 'center', italic: true, color: 'rgba(230,220,200,.5)', font: F_SERIF });
  diamond(ctx, 340, y + 92, 3, 'rgba(216,181,106,.5)'); diamond(ctx, 620, y + 92, 3, 'rgba(216,181,106,.5)');
  const rw = a.rewards;
  drawText(ctx, `+${rw.xp} XP`, 200, y + 128, { size: 17, color: '#9fd0ff', weight: 'bold' });
  drawText(ctx, `+${rw.gold} moedas`, 200, y + 152, { size: 14, color: '#e8cf90', weight: 'bold' });
  let yy = y + 186;
  for (const lu of rw.levelUps) {
    drawText(ctx, `${lu.hero.name} alcançou o nível ${lu.level}!`, 200, yy, { size: 12, color: '#ffe1a0', weight: 'bold' });
    yy += 19;
    for (const sk of lu.learned) {
      drawText(ctx, `Nova habilidade: ${SKILLS[sk].name}`, 216, yy, { size: 10, color: 'rgba(220,230,250,.75)' });
      yy += 16;
    }
    if (yy > y + 280) break;
  }
  if (!rw.levelUps.length) {
    drawText(ctx, 'O grupo descansa por um instante.', 200, yy, { size: 11, color: 'rgba(230,220,200,.55)', italic: true });
  }
  if (rw.loot && rw.loot.length) {
    const l = rw.loot[rw.loot.length - 1];
    drawText(ctx, `Encontrado: ${ITEMS[l.item].name}`, 640, y + 128, { size: 10, color: 'rgba(230,220,200,.65)', align: 'right' });
  }
  uiButton(ctx, 'battle-continue', 480 - 90, y + h - 60, 180, 40, 'CONTINUAR', {
    size: 12, onClick: () => closeVictory(a)
  });
  ctx.restore();
}

function drawBattleDefeat(ctx, a) {
  if (a.mode !== 'defeat') return;
  ctx.save();
  ctx.fillStyle = 'rgba(3,4,8,.82)'; ctx.fillRect(0, 0, 960, 600);
  const w = 540, h = 300, x = 480 - w / 2, y = 300 - h / 2;
  panel(ctx, x, y, w, h, { r: 14, border: 'rgba(150,90,90,.55)', borderWidth: 2, top: 'rgba(26,16,22,.98)', bottom: 'rgba(8,6,10,.99)' });
  drawText(ctx, 'A ESCURIDÃO O ENVOLVE', 480, y + 54, { size: 22, align: 'center', font: F_SERIF, color: '#d8a0a0', weight: 'bold' });
  drawText(ctx, 'A aurora é teimosa. Tente novamente.', 480, y + 82, { size: 11, align: 'center', italic: true, color: 'rgba(230,210,210,.5)', font: F_SERIF });
  uiButton(ctx, 'def-retry', x + 90, y + 130, 360, 42, 'TENTAR NOVAMENTE', {
    size: 12, active: a.defeatIndex === 0, onClick: () => chooseDefeat(a, 'retry')
  });
  uiButton(ctx, 'def-title', x + 90, y + 186, 360, 42, 'VOLTAR AO TÍTULO', {
    size: 12, danger: true, active: a.defeatIndex === 1, onClick: () => chooseDefeat(a, 'title')
  });
  drawText(ctx, 'O progresso até o último save será mantido.', 480, y + 258, { size: 9, align: 'center', color: 'rgba(230,210,210,.35)' });
  ctx.restore();
}

function drawBattle(ctx) {
  const a = G.battle;
  if (!a) return;
  ctx.save();
  if (a.shake > .5) {
    ctx.translate((Math.random() - .5) * a.shake, (Math.random() - .5) * a.shake);
  }
  drawBattleBackdrop(ctx, a.config.bg, a.time, { corrupt: a.usedPhase2 });

  // prefabs de posição
  a.enemySpritesPrefab = a.enemies.map((e, i) => {
    const pos = enemySpritePos(a, i);
    return { unit: e, x: pos.x, baseY: pos.baseY, scale: (e.size || 1) * 1.28, index: i };
  });
  a.partySpritesPrefab = a.party.map((h, i) => {
    const pos = partySpritePos(i);
    return { unit: h, x: pos.x, baseY: pos.baseY, scale: 1.62, index: i };
  });

  // inimigos
  a.enemyHitboxes = [];
  for (const s of a.enemySpritesPrefab) {
    const e = s.unit;
    if (e.dead && a.time - e.deathAt > .7) continue;
    const deathP = e.dead ? clamp((a.time - e.deathAt) / .7, 0, 1) : 0;
    const lx = battleLungeOffset(s, a.time);
    ctx.save();
    if (e.dead) ctx.globalAlpha = 1 - deathP;
    const hurt = a.time - e.flashAt < .18;
    ctx.translate(lx + (hurt ? (Math.random() - .5) * 8 : 0), deathP * 22);
    drawEnemySprite(ctx, e.kind, s.x, s.baseY, s.scale, a.time, { stark: e.enraged, corrupt: e.key === 'kael' && a.usedPhase2, flip: false });
    if (hurt) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, s.x, s.baseY - 70 * s.scale, 80 * s.scale, 'rgba(255,230,190,.25)', .9);
      ctx.restore();
    }
    ctx.restore();
    if (!e.dead) {
      drawEnemyHpBar(ctx, e, s.x, s.baseY + 12, Math.min(150, 90 * s.scale));
      a.enemyHitboxes.push({ x: s.x - 70 * s.scale, y: s.baseY - 150 * s.scale, w: 140 * s.scale, h: 160 * s.scale, index: s.index });
    }
    if (a.chooser && a.chooser.mode === 'target' && a.chooser.targetSide === 'enemy' && a.chooser.targetIdx === s.index && !e.dead) {
      drawEnemyTargetMarker(ctx, a, s, true);
    }
  }

  // heróis
  for (const s of a.partySpritesPrefab) {
    const h = s.unit;
    const lx = battleLungeOffset(s, a.time);
    const hurt = a.time - h.flashAt < .18;
    const dead = h.hp <= 0;
    ctx.save();
    if (dead) ctx.globalAlpha = .4;
    ctx.translate(lx + (hurt ? (Math.random() - .5) * 7 : 0), 0);
    const look = h.id === 'rowan' && G.state.flags.hasBlade ? 'rowanHero' : HEROES[h.id].look;
    drawHumanoid(ctx, s.x, s.baseY, look, 'right', 0, s.scale, { t: a.time, seed: s.index * 2 });
    ctx.restore();
  }

  drawBattleEffects(ctx, a);
  drawBattleTop(ctx, a);
  drawBattlePanel(ctx, a);
  drawBattleAnnounce(ctx, a);

  if (a.mode === 'victory') drawBattleVictory(ctx, a);
  if (a.mode === 'defeat') drawBattleDefeat(ctx, a);

  if (a.flash > 0) {
    ctx.save(); ctx.globalAlpha = a.flash * .6;
    ctx.fillStyle = '#fff6e0'; ctx.fillRect(0, 0, 960, 600);
    ctx.restore();
  }
  ctx.restore();
}
