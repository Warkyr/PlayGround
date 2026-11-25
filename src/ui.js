/* =========================================================================
   AURORA PARTIDA — UI: HUD, diálogos, menus, telas
   ========================================================================= */
'use strict';

const SPEAKER_STYLE = {
  'Narrador': { color: '#cbbf9f', portrait: null, italic: true },
  'Rowan': { color: '#9fd0ff', portrait: 'rowan' },
  'Líria': { color: '#ffb3cd', portrait: 'liria' },
  'Líria (ruínas)': { color: '#d8a0b8', portrait: 'liria_ruins' },
  'Kael': { color: '#ffcc7a', portrait: 'kael' },
  'Brann': { color: '#d8c9a2', portrait: 'brann' },
  'Rei Alaric': { color: '#e8d08a', portrait: 'king' },
  'Gorran': { color: '#e0a08a', portrait: 'warden' },
  'Eco': { color: '#9fe0e8', portrait: 'eco' },
  'Guarda': { color: '#b8c0cc', portrait: 'guard' },
  'Voz': { color: '#c9b8e0', portrait: null, italic: true },
  'Sistema': { color: '#9fe0c0', portrait: null }
};

function speakerInfo(name, opts = {}) {
  const s = SPEAKER_STYLE[name] || { color: '#f4e9cf', portrait: null };
  return {
    color: opts.color || s.color,
    portrait: opts.portrait !== undefined ? opts.portrait : s.portrait,
    italic: opts.italic !== undefined ? opts.italic : s.italic
  };
}

/* --------------------------------------------------------------- buttons */
function uiButton(ctx, id, x, y, w, h, label, opts = {}) {
  const enabled = opts.enabled !== false;
  const hover = enabled && G.mouseX >= x && G.mouseX <= x + w && G.mouseY >= y && G.mouseY <= y + h;
  const active = opts.active || hover;
  ctx.save();
  rr(ctx, x, y, w, h, opts.r == null ? 8 : opts.r);
  const g = ctx.createLinearGradient(x, y, x, y + h);
  if (!enabled) { g.addColorStop(0, 'rgba(30,34,44,.55)'); g.addColorStop(1, 'rgba(14,17,24,.55)'); }
  else if (opts.danger) { g.addColorStop(0, active ? 'rgba(94,38,38,.96)' : 'rgba(56,24,28,.9)'); g.addColorStop(1, 'rgba(24,12,16,.94)'); }
  else if (active) { g.addColorStop(0, 'rgba(72,84,116,.96)'); g.addColorStop(1, 'rgba(27,34,54,.97)'); }
  else { g.addColorStop(0, 'rgba(25,32,50,.92)'); g.addColorStop(1, 'rgba(11,15,26,.95)'); }
  ctx.fillStyle = g; ctx.fill();
  ctx.lineWidth = active ? 2 : 1.2;
  ctx.strokeStyle = !enabled ? 'rgba(120,120,130,.25)' : active ? 'rgba(240,216,154,.9)' : 'rgba(216,181,106,.42)';
  ctx.stroke();
  if (active && enabled) {
    const hg = ctx.createLinearGradient(x, y, x + w, y);
    hg.addColorStop(0, 'rgba(255,225,160,.08)'); hg.addColorStop(.5, 'rgba(255,225,160,.02)'); hg.addColorStop(1, 'rgba(255,225,160,0)');
    ctx.fillStyle = hg; ctx.fill();
  }
  ctx.restore();
  const fs = opts.size || 16;
  drawText(ctx, label, x + w / 2, y + h / 2 + fs * .35, {
    size: fs, align: 'center', color: !enabled ? 'rgba(200,195,180,.32)' : active ? '#fff0c8' : '#e5d7b8',
    weight: opts.weight || 'bold', font: opts.font || F_BODY, shadow: active ? 'rgba(255,220,150,.35)' : null, shadowBlur: 10
  });
  if (opts.symbol) {
    drawText(ctx, opts.symbol, x + 18, y + h / 2 + fs * .35, { size: fs * 1.05, align: 'center', color: active ? '#ffe1a0' : 'rgba(216,181,106,.6)' });
  }
  G.buttons.push({ id, x, y, w, h, cb: enabled ? opts.onClick : null, enabled });
}

function handleUIButtons(x, y) {
  for (let i = G.buttons.length - 1; i >= 0; i--) {
    const b = G.buttons[i];
    if (b.enabled === false || !b.cb) continue;
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
      AUDIO.sfx('confirm');
      b.cb();
      return true;
    }
  }
  return false;
}

/* ------------------------------------------------------------------- HUD */
function drawHud(ctx) {
  if (G.scene !== 'world') return;
  const s = G.state;
  const ux = G.ux;
  const x = 24, y = 20, w = Math.min(400, 360 * ux), h = 62 * ux;
  ctx.save();
  panel(ctx, x, y, w, h, { r: 8, border: 'rgba(216,181,106,.4)', ornaments: false, top: 'rgba(13,18,32,.82)', bottom: 'rgba(8,11,20,.72)' });
  const act = ACTS[s.act] || ACTS[1];
  drawText(ctx, `${act.label} · ${act.name.toUpperCase()}`, x + 16, y + 20 * ux, { size: 10.5 * ux, color: '#d8b56a', weight: 'bold' });
  const obj = s.objective || 'Explore Valdoria.';
  ctx.font = `${13 * ux}px ${F_BODY}`;
  const lines = wrapLines(ctx, obj, w - 32);
  drawText(ctx, lines[0], x + 16, y + 39 * ux, { size: 13 * ux, color: '#f0e4c8' });
  if (lines[1]) drawText(ctx, lines[1], x + 16, y + 53 * ux, { size: 11.5 * ux, color: 'rgba(240,228,200,.6)' });
  // moedas
  const goldText = `${s.gold}`;
  ctx.font = `bold ${12 * ux}px ${F_BODY}`;
  const gw = ctx.measureText(goldText).width + 40;
  drawText(ctx, '◈', x + w - gw + 8, y + 19 * ux, { size: 13 * ux, color: '#e8cf90' });
  drawText(ctx, goldText, x + w - gw + 24, y + 19 * ux, { size: 12 * ux, color: '#e8cf90', weight: 'bold' });
  ctx.restore();

  // botões no canto superior direito
  const bx = 960 - 24 - 44 * ux;
  const by = 20;
  uiButton(ctx, 'hud-menu', bx - 52 * ux, by, 44 * ux, 40 * ux, '☰', { size: 18 * ux, onClick: openPauseMenu });
  uiButton(ctx, 'hud-mute', bx, by, 44 * ux, 40 * ux, AUDIO.muted ? '🔇' : '♪', { size: 16 * ux, onClick: () => { const m = AUDIO.toggleMute(); toast(m ? 'Som desativado' : 'Som ativado'); } });
  if (s.flags && s.flags.hasBlade) {
    drawText(ctx, 'LÂMINA DA AURORA', 960 - 24, by + 58 * ux, { size: 8.5 * ux, color: 'rgba(180,230,255,.55)', align: 'right', weight: 'bold' });
  }
}

function showBanner(title, sub) {
  G.banner = { title, sub, t: 0, dur: 3.4 };
}

function drawBanner(ctx) {
  if (!G.banner) return;
  const b = G.banner;
  const life = b.t / b.dur;
  const a = life < .12 ? life / .12 : life > .8 ? (1 - life) / .2 : 1;
  ctx.save();
  ctx.globalAlpha = clamp(a, 0, 1);
  ctx.fillStyle = 'rgba(6,9,16,.55)';
  ctx.fillRect(0, 64, 960, 92);
  ctx.strokeStyle = 'rgba(216,181,106,.35)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(220, 68); ctx.lineTo(740, 68); ctx.moveTo(220, 152); ctx.lineTo(740, 152); ctx.stroke();
  drawText(ctx, b.title.toUpperCase(), 480, 112, { size: 26, align: 'center', font: F_SERIF, color: '#f2dfae', shadow: 'rgba(0,0,0,.8)', weight: 'bold' });
  if (b.sub) drawText(ctx, b.sub, 480, 136, { size: 11, align: 'center', color: 'rgba(230,220,198,.6)', italic: true, font: F_SERIF });
  diamond(ctx, 208, 110, 4, 'rgba(216,181,106,.7)');
  diamond(ctx, 752, 110, 4, 'rgba(216,181,106,.7)');
  ctx.restore();
}

/* ---------------------------------------------------------------- toasts */
function toast(text, opts = {}) {
  G.toasts.push({ text, t: 0, dur: opts.dur || 2.8, color: opts.color || '#f0e4c8', icon: opts.icon || '◆' });
  if (G.toasts.length > 4) G.toasts.shift();
}

function updateToasts(dt) {
  for (const t of G.toasts) t.t += dt;
  G.toasts = G.toasts.filter(t => t.t < t.dur);
}

function drawToasts(ctx) {
  let y = 96;
  for (const t of G.toasts) {
    const a = t.t < .18 ? t.t / .18 : t.t > t.dur - .4 ? (t.dur - t.t) / .4 : 1;
    const size = 12 * G.ux;
    ctx.save();
    ctx.font = `bold ${size}px ${F_BODY}`;
    const w = Math.min(640, ctx.measureText(t.text).width + 76);
    ctx.globalAlpha = clamp(a, 0, 1);
    panel(ctx, 480 - w / 2, y, w, 36 * G.ux, { r: 18, ornaments: false, top: 'rgba(20,26,42,.94)', bottom: 'rgba(10,13,22,.94)' });
    drawText(ctx, t.icon, 480 - w / 2 + 20, y + 23 * G.ux, { size: 13 * G.ux, color: '#d8b56a' });
    drawText(ctx, t.text, 480 - w / 2 + 40, y + 23 * G.ux, { size, color: t.color });
    ctx.restore();
    y += 42 * G.ux;
  }
}

/* --------------------------------------------------------------- diálogo */
function say(speaker, text, opts = {}) {
  return new Promise(resolve => {
    const info = speakerInfo(speaker, opts);
    G.dialog = {
      speaker, text: String(text), opts, info,
      chars: 0, t: 0, options: null, sel: 0, resolve, ability: opts.ability || null
    };
    document.body.classList.add('dialog-open');
    G.sfxTalkTick = 0;
  });
}

function ask(speaker, text, options, opts = {}) {
  return new Promise(resolve => {
    const info = speakerInfo(speaker, opts);
    G.dialog = {
      speaker, text: String(text), opts, info,
      chars: 0, t: 0, options, sel: 0, resolve: (i) => resolve(i)
    };
    document.body.classList.add('dialog-open');
    G.sfxTalkTick = 0;
  });
}

function closeDialog() {
  const d = G.dialog;
  if (!d) return;
  G.dialog = null;
  document.body.classList.remove('dialog-open');
  if (d.resolve) {
    if (d.options) d.resolve(d.sel);
    else d.resolve();
  }
}

function dialogAdvance() {
  const d = G.dialog;
  if (!d) return;
  if (d.chars < d.text.length) { d.chars = d.text.length; return; }
  if (d.options) { closeDialog(); return; }
  closeDialog();
}

function updateDialog(dt) {
  const d = G.dialog;
  if (!d) return;
  d.t += dt;
  const speed = d.opts.speed || 46;
  if (d.chars < d.text.length) {
    d.chars = Math.min(d.text.length, d.chars + dt * speed);
    G.sfxTalkTick = (G.sfxTalkTick || 0) + dt * speed;
    if (G.sfxTalkTick > 7) { AUDIO.sfx('talk'); G.sfxTalkTick = 0; }
  }
  if (d.options && d.chars >= d.text.length) {
    if (G.pressed.up) { d.sel = (d.sel + d.options.length - 1) % d.options.length; AUDIO.sfx('cursor'); }
    if (G.pressed.down) { d.sel = (d.sel + 1) % d.options.length; AUDIO.sfx('cursor'); }
    if (G.pressed.action) {
      AUDIO.sfx('confirm');
      const idx = d.sel;
      G.dialog = null;
      document.body.classList.remove('dialog-open');
      d.resolve(idx);
      return;
    }
  } else if (G.pressed.action) {
    dialogAdvance();
  }
  if (G.pressed.cancel && !d.options) dialogAdvance();
}

function drawDialog(ctx) {
  const d = G.dialog;
  if (!d) return;
  const ux = G.ux;
  const portrait = d.info.portrait && d.opts.noPortrait !== true;
  const hasOpts = !!d.options;
  const boxH = (hasOpts ? 225 : 172) * (G.mobile ? 1.15 : 1);
  const boxW = 864;
  const bx = (960 - boxW) / 2;
  const by = 600 - boxH - 24;
  // escurece levemente
  ctx.save();
  ctx.fillStyle = 'rgba(4,6,12,.28)';
  ctx.fillRect(0, 0, 960, 600);
  ctx.restore();

  panel(ctx, bx, by, boxW, boxH, {
    r: 12, top: 'rgba(16,22,38,.97)', bottom: 'rgba(7,10,19,.98)',
    border: 'rgba(216,181,106,.62)', borderWidth: 2
  });

  let textX = bx + 34;
  let textW = boxW - 68;
  if (portrait) {
    const pw = 118 * (G.mobile ? 1.05 : 1), ph = boxH - 34;
    const px = bx + 20, py = by + 17;
    drawPortrait(ctx, d.info.portrait, d.opts.mood || 'neutral', px, py, pw, ph);
    textX = px + pw + 26;
    textW = bx + boxW - textX - 32;
    // placa do nome
    const nameW = Math.max(110, ctx.measureText(d.speaker).width + 56);
    panel(ctx, textX - 6, by - 14, nameW, 30, { r: 6, ornaments: false, top: 'rgba(30,34,50,.98)', bottom: 'rgba(15,18,28,.98)', border: 'rgba(216,181,106,.65)' });
    drawText(ctx, d.speaker, textX + 14, by + 7, { size: 13 * ux, weight: 'bold', color: d.info.color });
  } else {
    if (d.speaker !== 'Narrador') {
      const nameW = Math.max(110, ctx.measureText(d.speaker).width + 56);
      panel(ctx, textX - 6, by - 14, nameW, 30, { r: 6, ornaments: false, top: 'rgba(30,34,50,.98)', bottom: 'rgba(15,18,28,.98)', border: 'rgba(216,181,106,.65)' });
      drawText(ctx, d.speaker, textX + 14, by + 7, { size: 13 * ux, weight: 'bold', color: d.info.color });
    }
  }

  const fontSize = (d.info.italic ? 16.5 : 16.5) * (G.mobile ? 1.28 : 1);
  const lineH = fontSize * 1.62;
  ctx.save();
  ctx.font = `${d.info.italic ? 'italic' : ''} ${fontSize}px ${d.info.italic ? F_SERIF : F_BODY}`.trim();
  const lines = wrapLines(ctx, d.text, textW);
  const fullText = lines.join('');
  let visible = Math.floor(d.chars);
  // reconstrói visível preservando quebras
  let remaining = Math.floor(d.chars);
  let ty = by + (hasOpts ? 42 : 50) * (G.mobile ? 1.1 : 1);
  for (const ln of lines) {
    if (remaining <= 0) break;
    const part = ln.slice(0, remaining);
    remaining -= ln.length + 1;
    drawText(ctx, part, textX, ty, {
      size: fontSize, color: d.info.italic ? 'rgba(232,222,200,.92)' : '#f2e7cd',
      font: d.info.italic ? F_SERIF : F_BODY, weight: d.info.italic ? '' : 'normal'
    });
    ty += lineH;
  }
  ctx.restore();

  if (d.chars >= d.text.length && !hasOpts) {
    const bounce = Math.sin(d.t * 4) * 2;
    drawText(ctx, '▼', bx + boxW - 34, by + boxH - 20 + bounce, { size: 14, color: 'rgba(216,181,106,.85)', align: 'center' });
  }

  if (hasOpts && d.chars >= d.text.length) {
    const oy = by + boxH - d.options.length * 42 - 16;
    d.options.forEach((opt, i) => {
      const oy2 = oy + i * 42;
      const active = i === d.sel;
      uiButton(ctx, 'dlg-opt-' + i, textX, oy2, Math.min(textW, 520), 34, opt, {
        size: 13.5 * ux, active, onClick: () => { G.dialog = null; document.body.classList.remove('dialog-open'); d.resolve(i); AUDIO.sfx('confirm'); }
      });
    });
  }
}

function dialogPointer(x, y) {
  if (!G.dialog) return;
  if (handleUIButtons(x, y)) return;
  if (G.dialog.options && G.dialog.chars < G.dialog.text.length) { G.dialog.chars = G.dialog.text.length; return; }
  dialogAdvance();
}

/* ------------------------------------------------------------- pause menu */
function openPauseMenu() {
  if (G.scene !== 'world' || G.dialog) return;
  G.menu = { tab: 0, sel: 0, itemSel: 0 };
  document.body.classList.add('menu-open');
  AUDIO.sfx('confirm');
}

function closeMenu() {
  G.menu = null;
  document.body.classList.remove('menu-open');
  AUDIO.sfx('cancel');
}

function updateMenu(dt) {
  const m = G.menu;
  if (!m) return;
  const tabs = ['Status', 'Itens', 'Diário', 'Opções'];
  if (G.pressed.left) { m.tab = (m.tab + tabs.length - 1) % tabs.length; AUDIO.sfx('cursor'); }
  if (G.pressed.right) { m.tab = (m.tab + 1) % tabs.length; AUDIO.sfx('cursor'); }
  if (G.pressed.up) { m.sel = Math.max(0, m.sel - 1); AUDIO.sfx('cursor'); }
  if (G.pressed.down) { m.sel++; AUDIO.sfx('cursor'); }
  if (G.pressed.cancel) closeMenu();
  if (G.pressed.action) { /* botões tratam do clique */ }
}

function drawMenu(ctx) {
  const s = G.state;
  const m = G.menu;
  if (!m) return;
  ctx.save();
  ctx.fillStyle = 'rgba(3,5,10,.72)';
  ctx.fillRect(0, 0, 960, 600);
  const ux = G.ux;
  panel(ctx, 70, 46, 820, 508, { r: 14, border: 'rgba(216,181,106,.6)', borderWidth: 2 });
  drawText(ctx, 'DIÁRIO DE JORNADA', 104, 86, { size: 20 * (G.mobile ? 1.25 : 1), color: '#f0dfb8', font: F_SERIF, weight: 'bold' });
  drawText(ctx, 'Aurora Partida', 104, 106, { size: 10.5, color: 'rgba(216,181,106,.6)', italic: true, font: F_SERIF });
  // tabs
  const tabs = ['Status', 'Itens', 'Diário', 'Opções'];
  tabs.forEach((t, i) => {
    const tx = 104 + i * 132;
    uiButton(ctx, 'tab-' + i, tx, 124, 116, 36, t, {
      size: 12.5 * ux, active: i === m.tab, onClick: () => { m.tab = i; m.sel = 0; AUDIO.sfx('cursor'); }
    });
  });
  // close
  uiButton(ctx, 'menu-close', 802, 58, 62, 34, '✕', { size: 15, onClick: closeMenu });

  const cx = 104, cy = 180, cw = 752, ch = 344;
  ctx.save();
  rr(ctx, cx, cy, cw, ch, 8); ctx.fillStyle = 'rgba(6,9,17,.55)'; ctx.fill();
  ctx.strokeStyle = 'rgba(216,181,106,.16)'; ctx.stroke();
  ctx.restore();

  if (m.tab === 0) drawMenuStatus(ctx, cx, cy, cw, ch);
  else if (m.tab === 1) drawMenuItems(ctx, cx, cy, cw, ch);
  else if (m.tab === 2) drawMenuJournal(ctx, cx, cy, cw, ch);
  else drawMenuOptions(ctx, cx, cy, cw, ch);

  drawText(ctx, '← → abas   ↑ ↓ navegar   ESC fechar', 480, 538, { size: 9.5, color: 'rgba(220,210,190,.35)', align: 'center' });
  ctx.restore();
}

function drawMiniHero(ctx, hero, x, y, w, h) {
  const def = HEROES[hero.id];
  const look = hero.id === 'rowan' && G.state.flags.hasBlade ? 'rowanHero' : def.look;
  panel(ctx, x, y, w, h, { r: 8, ornaments: false, top: 'rgba(20,27,44,.8)', bottom: 'rgba(10,14,24,.8)' });
  drawPortrait(ctx, def.look, 'neutral', x + 12, y + 12, 78, h - 24);
  const tx = x + 104;
  drawText(ctx, hero.name, tx, y + 32, { size: 18, color: def.color, font: F_SERIF, weight: 'bold' });
  drawText(ctx, `${def.title} · Nv. ${hero.level}`, tx, y + 50, { size: 10, color: 'rgba(230,220,200,.55)' });
  drawBar(ctx, tx, y + 64, w - tx + x - 24, 12, hero.hp / hero.maxHp, '#7fd08a', '#3f8f52');
  drawText(ctx, `HP ${hero.hp}/${hero.maxHp}`, tx + 2, y + 74, { size: 8.5, color: '#dff0d8' });
  drawBar(ctx, tx, y + 84, w - tx + x - 24, 10, hero.mp / hero.maxMp, '#8fb8f0', '#4768a8');
  drawText(ctx, `MP ${hero.mp}/${hero.maxMp}`, tx + 2, y + 92, { size: 8, color: '#d8e6f8' });
  drawText(ctx, `ATQ ${hero.atk}   DEF ${hero.def}   MAG ${hero.mag}`, tx, y + 114, { size: 9.5, color: 'rgba(235,225,205,.72)' });
  drawText(ctx, `XP ${hero.xp}/${xpNeeded(hero.level)}`, tx, y + 129, { size: 8.5, color: 'rgba(216,181,106,.6)' });
  // skills
  const skills = hero.skills || [];
  skills.slice(0, 4).forEach((sk, i) => {
    const sx = tx + (i % 2) * ((w - 120) / 2), sy = y + h - 46 + Math.floor(i / 2) * 17;
    drawText(ctx, `· ${SKILLS[sk].name}`, sx, sy, { size: 8.8, color: 'rgba(190,210,235,.7)' });
  });
}

function drawMenuStatus(ctx, x, y, w, h) {
  const party = G.state.party;
  const cw = (w - 36) / 2;
  party.forEach((hero, i) => drawMiniHero(ctx, hero, x + 12 + i * (cw + 12), y + 12, cw, 178));
  const infoY = y + 204;
  drawText(ctx, 'CAMINHO DO HERÓI', x + 16, infoY + 10, { size: 10, color: '#d8b56a', weight: 'bold' });
  const act = ACTS[G.state.act] || ACTS[1];
  drawText(ctx, `${act.label} — ${act.name}`, x + 16, infoY + 32, { size: 15, color: '#f0e4c8', font: F_SERIF });
  ctx.save();
  ctx.font = `12px ${F_BODY}`;
  const lines = wrapLines(ctx, G.state.objective || '', w - 40);
  lines.slice(0, 2).forEach((ln, i) => drawText(ctx, ln, x + 16, infoY + 54 + i * 18, { size: 12, color: 'rgba(235,225,205,.75)' }));
  ctx.restore();
  drawText(ctx, `Tempo de jornada: ${fmtTime(G.state.playTime)}`, x + w - 20, infoY + 34, { size: 11, color: 'rgba(216,181,106,.7)', align: 'right' });
  drawText(ctx, `Inimigos derrotados: ${G.state.kills || 0}`, x + w - 20, infoY + 52, { size: 10, color: 'rgba(216,181,106,.45)', align: 'right' });
}

function drawMenuItems(ctx, x, y, w, h) {
  const items = G.state.items;
  const keys = Object.keys(items).filter(k => items[k] > 0);
  const m = G.menu;
  if (!keys.length) {
    drawText(ctx, 'A bolsa está vazia.', x + 20, y + 40, { size: 14, color: 'rgba(230,220,200,.5)', italic: true });
    return;
  }
  m.sel = clamp(m.sel, 0, keys.length - 1);
  keys.forEach((k, i) => {
    const iy = y + 14 + i * 44;
    const active = i === m.sel;
    const it = ITEMS[k];
    if (active) {
      rr(ctx, x + 10, iy, w - 20, 38, 6);
      ctx.fillStyle = 'rgba(60,72,104,.32)'; ctx.fill();
      ctx.strokeStyle = 'rgba(216,181,106,.45)'; ctx.stroke();
    }
    drawItemIcon(ctx, k, x + 32, iy + 19, 24);
    drawText(ctx, it.name, x + 60, iy + 22, { size: 13, color: active ? '#fff0c8' : '#e8ddc4', weight: active ? 'bold' : '' });
    drawText(ctx, `x${items[k]}`, x + w - 54, iy + 22, { size: 13, color: '#d8b56a', align: 'right', weight: 'bold' });
    if (active) {
      drawText(ctx, it.desc, x + 60, iy + 34, { size: 9, color: 'rgba(230,220,200,.5)' });
      uiButton(ctx, 'use-item', x + w - 200, iy + 34, 104, 26, 'USAR', {
        size: 10, onClick: () => useOutOfBattle(k)
      });
    }
    G.buttons.push({ id: 'item-' + i, x: x + 10, y: iy, w: w - 20, h: 38, cb: () => { m.sel = i; AUDIO.sfx('cursor'); } });
  });
  const selKey = keys[m.sel];
  drawText(ctx, 'Itens podem ser usados fora de batalha.', x + 20, y + h - 18, { size: 9.5, color: 'rgba(230,220,200,.32)', italic: true });
}

function useOutOfBattle(key) {
  const s = G.state;
  if (!s.items[key]) return;
  const hero = s.party.find(h => h.hp > 0) || s.party[0];
  const it = ITEMS[key];
  if (it.full) { hero.hp = hero.maxHp; hero.mp = hero.maxMp; }
  else if (it.heal) hero.hp = Math.min(hero.maxHp, hero.hp + it.heal);
  else if (it.mp) hero.mp = Math.min(hero.maxMp, hero.mp + it.mp);
  s.items[key]--;
  if (s.items[key] <= 0) delete s.items[key];
  toast(`${hero.name} usou ${it.name}.`, { icon: '✚' });
  AUDIO.sfx('heal');
  G.menu.sel = 0;
}

function drawMenuJournal(ctx, x, y, w, h) {
  const s = G.state;
  const act = ACTS[s.act] || ACTS[1];
  drawText(ctx, `${act.label} — ${act.name}`, x + 20, y + 30, { size: 16, color: '#f0dfb8', font: F_SERIF, weight: 'bold' });
  ctx.save();
  ctx.font = `13px ${F_BODY}`;
  const lines = wrapLines(ctx, s.objective || 'Sem objetivo.', w - 40);
  lines.slice(0, 3).forEach((ln, i) => drawText(ctx, ln, x + 20, y + 58 + i * 20, { size: 13, color: '#e8ddc4' }));
  ctx.restore();
  drawText(ctx, 'REGISTRO', x + 20, y + 128, { size: 9.5, color: '#d8b56a', weight: 'bold' });
  const log = (s.journal || []).slice(-4);
  log.forEach((j, i) => {
    drawText(ctx, '◆', x + 22, y + 150 + i * 20, { size: 8, color: 'rgba(216,181,106,.5)' });
    ctx.save(); ctx.font = `10px ${F_BODY}`;
    const lns = wrapLines(ctx, j, w - 60);
    drawText(ctx, lns[0], x + 36, y + 150 + i * 20, { size: 10, color: 'rgba(230,220,200,.6)' });
    ctx.restore();
  });
  // controles
  drawText(ctx, 'CONTROLES', x + 20, y + h - 72, { size: 9.5, color: '#d8b56a', weight: 'bold' });
  drawText(ctx, 'WASD / setas — andar     Espaço / Enter — interagir', x + 20, y + h - 54, { size: 10, color: 'rgba(230,220,200,.55)' });
  drawText(ctx, 'ESC / X — menu     M — som     Toque — botões na tela', x + 20, y + h - 38, { size: 10, color: 'rgba(230,220,200,.55)' });
}

function drawMenuOptions(ctx, x, y, w, h) {
  const s = G.state;
  const lines = [
    ['Salvar jornada', () => { if (saveGame()) toast('Jornada salva.', { icon: '✦' }); }],
    [AUDIO.muted ? 'Som: desligado' : 'Som: ligado', () => { AUDIO.toggleMute(); AUDIO.sfx('cursor'); }]
  ];
  lines.forEach(([label, cb], i) => {
    uiButton(ctx, 'opt-' + i, x + 20, y + 24 + i * 54, 260, 42, label, { size: 13, onClick: cb, symbol: i === 0 ? '✦' : '♪' });
  });
  uiButton(ctx, 'opt-title', x + 20, y + 24 + 2 * 54, 260, 42, 'Voltar ao título', {
    size: 13, danger: true, onClick: () => {
      if (confirm('Voltar ao título? Progresso não salvo será perdido.')) { closeMenu(); goTitle(); }
    }
  });
  drawText(ctx, 'DICA', x + 324, y + 38, { size: 9.5, color: '#d8b56a', weight: 'bold' });
  const tips = [
    'Use Poções antes de chefes — e guarde um Elixir para emergências.',
    'Defender reduz o dano recebido pela metade e recupera um pouco de MP.',
    'A Lâmina da Aurora só responde a quem escolhe proteger, não vingar.',
    'O save é automático nos momentos importantes. Você também pode salvar aqui.'
  ];
  tips.forEach((t, i) => {
    ctx.save(); ctx.font = `10.5px ${F_BODY}`;
    const lns = wrapLines(ctx, t, w - 360);
    lns.slice(0, 2).forEach((ln, j) => drawText(ctx, ln, x + 324, y + 62 + i * 48 + j * 15, { size: 10.5, color: 'rgba(230,220,200,.6)' }));
    ctx.restore();
  });
  drawText(ctx, `Tempo: ${fmtTime(s.playTime)}   ·   Nível: ${s.party[0].level}`, x + 324, y + h - 24, { size: 10, color: 'rgba(216,181,106,.5)' });
}

/* ---------------------------------------------------------------- ending */
function startEnding(choice) {
  G.scene = 'ending';
  G.dialog = null;
  G.menu = null;
  document.body.classList.remove('dialog-open', 'menu-open');
  document.body.classList.add('hide-touch');
  G.ending = { choice, t: 0, shown: 0 };
  AUDIO.playTrack('ending');
  saveGame(true);
}

function drawEnding(ctx) {
  const t = G.ending.t;
  // céu do amanhecer
  const sky = ctx.createLinearGradient(0, 0, 0, 600);
  sky.addColorStop(0, '#17203f');
  sky.addColorStop(.35, '#4a3a5c');
  sky.addColorStop(.62, '#b06a5e');
  sky.addColorStop(.78, '#e0a070');
  sky.addColorStop(1, '#f2caa0');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, 960, 600);
  // sol
  const sunY = 390 - Math.min(80, t * 8);
  glow(ctx, 480, sunY, 200, 'rgba(255,210,140,.35)', .9);
  ctx.fillStyle = 'rgba(255,235,190,.92)'; circle(ctx, 480, sunY, 56); ctx.fill();
  // nuvens
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = `rgba(255,210,180,${.08 + i * .01})`;
    ctx.beginPath(); ctx.ellipse(100 + i * 160 + Math.sin(t * .05 + i) * 30, 240 + i * 18, 130, 16, 0, 0, Math.PI * 2); ctx.fill();
  }
  // montanhas
  ctx.fillStyle = '#3a3448';
  ctx.beginPath(); ctx.moveTo(0, 470); ctx.lineTo(160, 360); ctx.lineTo(300, 450); ctx.lineTo(470, 340); ctx.lineTo(660, 455); ctx.lineTo(800, 370); ctx.lineTo(960, 460); ctx.lineTo(960, 600); ctx.lineTo(0, 600); ctx.closePath(); ctx.fill();
  // vila
  ctx.fillStyle = '#241f2c';
  ctx.fillRect(560, 450, 220, 30);
  for (let i = 0; i < 6; i++) {
    const hx = 575 + i * 34, hh = 24 + (i % 3) * 9;
    ctx.fillRect(hx, 470 - hh, 24, hh);
    ctx.beginPath(); ctx.moveTo(hx - 4, 470 - hh); ctx.lineTo(hx + 12, 470 - hh - 14); ctx.lineTo(hx + 28, 470 - hh); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,210,130,.5)'; ctx.fillRect(hx + 8, 456 - hh * .3, 4, 4); ctx.fillStyle = '#241f2c';
  }
  // colina e herói
  ctx.fillStyle = '#1a1722';
  ctx.beginPath(); ctx.moveTo(0, 600); ctx.lineTo(0, 500); ctx.quadraticCurveTo(120, 440, 260, 500); ctx.lineTo(340, 600); ctx.closePath(); ctx.fill();
  drawHumanoid(ctx, 210, 505, G.state.flags.hasBlade ? 'rowanHero' : 'rowan', 'right', 0, 1.7, { t });
  // pássaros
  for (let i = 0; i < 5; i++) {
    const bx = 620 + i * 55 + Math.sin(t * .4 + i) * 20;
    const by = 180 + Math.sin(t * .6 + i) * 12 + i * 14;
    ctx.strokeStyle = 'rgba(40,30,40,.45)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(bx - 6, by); ctx.quadraticCurveTo(bx - 2, by - 4, bx, by); ctx.quadraticCurveTo(bx + 3, by - 4, bx + 7, by); ctx.stroke();
  }
  // painel
  const e = G.ending;
  const alpha = clamp((t - .4) / 1.2, 0, 1);
  ctx.save(); ctx.globalAlpha = alpha;
  panel(ctx, 70, 56, 820, 488, { r: 14, top: 'rgba(10,13,24,.90)', bottom: 'rgba(7,9,16,.94)', border: 'rgba(216,181,106,.55)' });
  drawText(ctx, 'FIM', 480, 106, { size: 12, color: 'rgba(216,181,106,.65)', align: 'center', weight: 'bold' });
  spacedText(ctx, 'AURORA PARTIDA', 480, 156, 6, { size: 34, align: 'center', color: '#f2dfae', shadow: 'rgba(255,200,120,.25)', shadowBlur: 18 });
  drawText(ctx, 'A Ascensão de Rowan', 480, 180, { size: 12, color: 'rgba(230,220,200,.55)', align: 'center', italic: true, font: F_SERIF });
  diamond(ctx, 400, 200, 3.5, 'rgba(216,181,106,.5)');
  diamond(ctx, 560, 200, 3.5, 'rgba(216,181,106,.5)');
  ctx.strokeStyle = 'rgba(216,181,106,.3)'; ctx.beginPath(); ctx.moveTo(416, 200); ctx.lineTo(544, 200); ctx.stroke();

  const lines = e.choice === 0 ? [
    'O reino me chamou de herói. Ergueram estátuas, cantaram canções.',
    'Eu deixei. Não porque acredito nas canções, mas porque as crianças precisam de histórias onde a dor não vence.',
    'Líria partiu para a costa, onde o amanhecer chega mais cedo. Eu não a impedi.',
    'Alguns dizem que perdoar é esquecer. Eu nunca esqueci. Só escolhi não deixar a ferida decidir por mim.',
    'Toda aurora começa no escuro.'
  ] : [
    'O reino me chamou de herói. Ergueram estátuas, cantaram canções.',
    'Eu deixei. Não porque acredito nas canções, mas porque as crianças precisam de histórias onde a dor não vence.',
    'Líria partiu para a costa, onde o amanhecer chega mais cedo. Levei comigo a certeza de que o amor que senti foi verdadeiro — e que isso bastava.',
    'Kael foi enterrado sem nome. Eu não fui ao funeral. Algumas dívidas se pagam ficando vivo.',
    'Toda aurora começa no escuro.'
  ];
  const shown = Math.min(lines.length, Math.floor((t - 1.5) / 1.1) + 1);
  for (let i = 0; i < shown; i++) {
    ctx.save(); ctx.font = `italic ${13.5}px ${F_SERIF}`;
    const lns = wrapLines(ctx, lines[i], 620);
    const oa = clamp((t - 1.5 - i * 1.1) / .6, 0, 1);
    ctx.globalAlpha = oa;
    lns.forEach((ln, j) => drawText(ctx, ln, 480, 242 + i * 38 + j * 20, { size: 13.5, color: i === lines.length - 1 ? '#f2dfae' : 'rgba(238,228,206,.82)', align: 'center', font: F_SERIF }));
    ctx.restore();
  }
  // stats
  if (t > 2.5) {
    const s = G.state;
    drawText(ctx, `Nível ${s.party[0].level}   ·   ${s.kills || 0} inimigos derrotados   ·   ${fmtTime(s.playTime)} de jornada`, 480, 470, { size: 10, color: 'rgba(216,181,106,.55)', align: 'center' });
  }
  ctx.restore();

  if (t > 3.4) {
    uiButton(ctx, 'end-replay', 340, 500, 130, 38, 'REJOGAR', { size: 11, onClick: () => { AUDIO.sfx('confirm'); newGame(true); } });
    uiButton(ctx, 'end-title', 490, 500, 130, 38, 'TÍTULO', { size: 11, onClick: () => { AUDIO.sfx('confirm'); goTitle(); } });
  }
  drawText(ctx, 'Obrigado por jogar.', 480, 568, { size: 9.5, color: 'rgba(30,25,30,.55)', align: 'center' });
}

function updateEnding(dt) {
  if (!G.ending) return;
  G.ending.t += dt;
  if (G.pressed.cancel && G.ending.t > 3.4) goTitle();
}
