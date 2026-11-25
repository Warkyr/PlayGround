/* =========================================================================
   AURORA PARTIDA — battle backdrops and scene atmosphere
   ========================================================================= */
'use strict';

function battleSky(ctx, top, mid, bottom) {
  const g = ctx.createLinearGradient(0, 0, 0, 600);
  g.addColorStop(0, top); g.addColorStop(.55, mid); g.addColorStop(1, bottom);
  ctx.fillStyle = g; ctx.fillRect(0, 0, 960, 600);
}

function drawStars(ctx, t, count, maxY = 330, seed = 1) {
  for (let i = 0; i < count; i++) {
    const x = hash(i * 4.7 + seed) * 960;
    const y = hash(i * 8.3 + seed * 2) * maxY;
    const tw = .25 + .55 * (Math.sin(t * 1.5 + i * 2.2) * .5 + .5);
    ctx.fillStyle = `rgba(220,235,255,${tw})`;
    ctx.fillRect(x, y, i % 7 === 0 ? 2 : 1.2, i % 7 === 0 ? 2 : 1.2);
  }
}

function drawPineLayer(ctx, baseY, color, spacing, scale, seed = 0) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, baseY);
  for (let x = -40; x < 1000; x += spacing) {
    const h = (44 + hash(x * .13 + seed) * 55) * scale;
    const w = (16 + hash(x * .31 + seed) * 16) * scale;
    ctx.lineTo(x, baseY - h);
    ctx.lineTo(x + w, baseY - h * .35);
    ctx.lineTo(x + w * .45, baseY - h * .34);
    ctx.lineTo(x + w * 1.3, baseY);
  }
  ctx.lineTo(1000, 600); ctx.lineTo(0, 600); ctx.closePath(); ctx.fill();
}

function drawForestBattle(ctx, t) {
  battleSky(ctx, '#0a1526', '#1b3348', '#2b3f3a');
  drawStars(ctx, t, 90, 300, 2);
  // lua
  glow(ctx, 770, 100, 110, 'rgba(220,235,255,.20)', .9);
  ctx.fillStyle = '#e8eef8'; circle(ctx, 770, 100, 38); ctx.fill();
  ctx.fillStyle = 'rgba(170,190,215,.45)'; circle(ctx, 758, 90, 7); ctx.fill(); circle(ctx, 782, 110, 5); ctx.fill(); circle(ctx, 762, 114, 3.5); ctx.fill();
  // montanhas
  ctx.fillStyle = '#131f2e';
  ctx.beginPath(); ctx.moveTo(0, 330); ctx.lineTo(140, 220); ctx.lineTo(260, 310); ctx.lineTo(420, 200); ctx.lineTo(600, 330); ctx.lineTo(760, 250); ctx.lineTo(960, 340); ctx.lineTo(960, 600); ctx.lineTo(0, 600); ctx.closePath(); ctx.fill();
  drawPineLayer(ctx, 400, '#0e1c20', 46, 1, 3);
  drawPineLayer(ctx, 430, '#12241f', 64, 1.3, 8);
  // névoa
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = `rgba(120,160,170,${.035 + i * .012})`;
    ctx.beginPath();
    ctx.ellipse(200 + i * 250 + Math.sin(t * .1 + i) * 20, 350 + i * 22, 300, 26, 0, 0, Math.PI * 2); ctx.fill();
  }
  // chão
  const gg = ctx.createLinearGradient(0, 400, 0, 600);
  gg.addColorStop(0, '#17281f'); gg.addColorStop(1, '#0d1712');
  ctx.fillStyle = gg; ctx.fillRect(0, 400, 960, 200);
  ctx.strokeStyle = 'rgba(80,120,80,.25)'; ctx.lineWidth = 1.4;
  for (let i = 0; i < 90; i++) {
    const gx = hash(i * 3.3) * 960, gy = 410 + hash(i * 7.1) * 185;
    ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + (hash(i) - .5) * 8, gy - 8 - hash(i * 2.2) * 16); ctx.stroke();
  }
  // feixes de lua
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const beam = ctx.createLinearGradient(740, 100, 600, 460);
  beam.addColorStop(0, 'rgba(180,215,255,.09)'); beam.addColorStop(1, 'rgba(180,215,255,0)');
  ctx.fillStyle = beam;
  ctx.beginPath(); ctx.moveTo(720, 120); ctx.lineTo(810, 120); ctx.lineTo(760, 470); ctx.lineTo(540, 470); ctx.closePath(); ctx.fill();
  ctx.restore();
  // vaga-lumes
  for (let i = 0; i < 26; i++) {
    const x = hash(i * 9.1) * 960, y = 270 + hash(i * 4.4) * 280;
    const a = .2 + .5 * (Math.sin(t * 1.6 + i) * .5 + .5);
    ctx.fillStyle = `rgba(220,230,140,${a})`;
    ctx.fillRect(x + Math.sin(t * .7 + i) * 12, y + Math.cos(t * .5 + i) * 8, 2, 2);
  }
  vignette(ctx, .55);
}

function drawDungeonBattle(ctx, t) {
  battleSky(ctx, '#0d0f14', '#171a20', '#101216');
  // parede de tijolos
  for (let y = 0; y < 430; y += 34) {
    for (let x = -(y % 68 === 0 ? 0 : 40); x < 960; x += 84) {
      ctx.fillStyle = (Math.floor(x / 84) + y / 34) % 2 ? '#21242b' : '#1d2027';
      ctx.fillRect(x + 2, y + 2, 80, 30);
      ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(x, y + 30, 84, 4);
      ctx.fillStyle = 'rgba(255,255,255,.02)'; ctx.fillRect(x + 2, y + 2, 78, 2);
    }
  }
  // arcos
  for (const ax of [130, 830]) {
    ctx.fillStyle = '#121419';
    ctx.beginPath(); ctx.moveTo(ax - 70, 430); ctx.lineTo(ax - 70, 190);
    ctx.quadraticCurveTo(ax, 60, ax + 70, 190); ctx.lineTo(ax + 70, 430); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#2e3138'; ctx.lineWidth = 7; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.04)'; ctx.lineWidth = 2; ctx.stroke();
  }
  // tochas
  for (const [tx, ty] of [[80, 210], [880, 210], [300, 160], [660, 160]]) {
    const fl = Math.sin(t * 8 + tx) * 3;
    ctx.fillStyle = '#3b2c20'; ctx.fillRect(tx - 2, ty, 4, 34);
    glow(ctx, tx, ty - 6, 90 + fl * 3, 'rgba(255,150,60,.24)', .9);
    ctx.fillStyle = '#ffb256';
    ctx.beginPath(); ctx.moveTo(tx - 8, ty - 2); ctx.quadraticCurveTo(tx, ty - 26 - fl, tx + 8, ty - 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffe0a0';
    ctx.beginPath(); ctx.moveTo(tx - 3, ty - 3); ctx.quadraticCurveTo(tx, ty - 16 - fl * .5, tx + 3, ty - 3); ctx.closePath(); ctx.fill();
  }
  // correntes
  ctx.strokeStyle = 'rgba(90,96,108,.35)'; ctx.lineWidth = 2;
  for (let i = 0; i < 16; i++) {
    ctx.beginPath(); ctx.arc(500 + i * 4, 120 + i * 2, 3, 0, Math.PI * 2); ctx.stroke();
  }
  // chão
  const pg = ctx.createLinearGradient(0, 410, 0, 600);
  pg.addColorStop(0, '#24262c'); pg.addColorStop(1, '#15171b');
  ctx.fillStyle = pg; ctx.fillRect(0, 410, 960, 190);
  ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(0, 425 + i * 32); ctx.lineTo(960, 425 + i * 32); ctx.stroke(); }
  for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(i * 140, 410); ctx.lineTo(i * 140 + 40, 600); ctx.stroke(); }
  // poças refletindo
  ctx.fillStyle = 'rgba(120,160,180,.05)';
  ellipse(ctx, 250, 540, 120, 14); ctx.fill();
  ellipse(ctx, 700, 500, 90, 10); ctx.fill();
  // poeira
  for (let i = 0; i < 30; i++) {
    const x = hash(i * 5.1) * 960, y = 150 + ((t * 8 + i * 33) % 400);
    ctx.fillStyle = `rgba(200,205,215,${.04 + hash(i) * .08})`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }
  vignette(ctx, .7);
}

function drawTempleBattle(ctx, t) {
  battleSky(ctx, '#050813', '#0b1226', '#131b33');
  drawStars(ctx, t, 130, 460, 7);
  // nebulosa
  const ng = ctx.createRadialGradient(640, 200, 20, 640, 200, 360);
  ng.addColorStop(0, 'rgba(90,90,190,.13)'); ng.addColorStop(1, 'rgba(90,90,190,0)');
  ctx.fillStyle = ng; ctx.fillRect(0, 0, 960, 600);
  // pilares flutuantes
  for (const [px, py, sc] of [[130, 250, 1], [830, 230, 1.1], [300, 140, .55], [700, 120, .5]]) {
    ctx.save(); ctx.translate(px, py + Math.sin(t * .5 + px) * 5); ctx.scale(sc, sc);
    ctx.fillStyle = '#2e3a52'; ctx.fillRect(-22, -110, 44, 220);
    ctx.fillStyle = '#43516e'; ctx.fillRect(-18, -106, 24, 212);
    ctx.fillStyle = 'rgba(140,220,255,.32)'; ctx.fillRect(-6, -80, 3, 70);
    ctx.fillStyle = '#232c40'; ctx.fillRect(-30, -120, 60, 12); ctx.fillRect(-30, 108, 60, 12);
    ctx.restore();
  }
  // raios de luz
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) {
    const g = ctx.createLinearGradient(480 + i * 40, 0, 480 + i * 40, 480);
    g.addColorStop(0, 'rgba(140,220,255,.09)'); g.addColorStop(1, 'rgba(140,220,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(400 + i * 90, 0); ctx.lineTo(440 + i * 90, 0); ctx.lineTo(560 + i * 70, 470); ctx.lineTo(300 + i * 70, 470); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  // plataforma
  ctx.fillStyle = 'rgba(0,0,0,.5)'; ellipse(ctx, 480, 540, 380, 70); ctx.fill();
  const tg = ctx.createLinearGradient(0, 420, 0, 600);
  tg.addColorStop(0, '#3d4a60'); tg.addColorStop(1, '#222c40');
  ctx.fillStyle = tg;
  ctx.beginPath(); ctx.ellipse(480, 490, 430, 105, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(140,220,255,.22)'; ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(480, 490, 120 + i * 70, 30 + i * 18, 0, 0, Math.PI * 2); ctx.stroke(); }
  // runas
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3 + t * .06;
    ctx.save(); ctx.translate(480 + Math.cos(a) * 250, 490 + Math.sin(a) * 62);
    ctx.globalCompositeOperation = 'lighter'; glow(ctx, 0, 0, 24, 'rgba(130,220,255,.22)', .9);
    ctx.strokeStyle = 'rgba(160,230,255,.45)'; ctx.lineWidth = 1.2; circle(ctx, 0, 0, 9); ctx.stroke();
    ctx.restore();
  }
  for (let i = 0; i < 40; i++) {
    const x = hash(i * 2.2) * 960, y = ((t * 12 + i * 41) % 500) + 60;
    ctx.fillStyle = `rgba(170,230,255,${.1 + hash(i * 3.3) * .3})`;
    ctx.fillRect(x, y, 1.6, 1.6);
  }
  vignette(ctx, .65);
}

function drawThroneBattle(ctx, t, corrupt = false) {
  // parede
  const bg = ctx.createLinearGradient(0, 0, 0, 430);
  if (corrupt) { bg.addColorStop(0, '#150d20'); bg.addColorStop(1, '#241428'); }
  else { bg.addColorStop(0, '#191322'); bg.addColorStop(1, '#2b1f2c'); }
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 960, 430);
  // janelas góticas
  for (const wx of [180, 480, 780]) {
    ctx.fillStyle = '#0d0a13';
    ctx.beginPath(); ctx.moveTo(wx - 48, 330); ctx.lineTo(wx - 48, 150);
    ctx.quadraticCurveTo(wx, 70, wx + 48, 150); ctx.lineTo(wx + 48, 330); ctx.closePath(); ctx.fill();
    const gg = ctx.createLinearGradient(wx, 100, wx, 330);
    if (corrupt) { gg.addColorStop(0, '#4a2058'); gg.addColorStop(.5, '#7a2a48'); gg.addColorStop(1, '#24112c'); }
    else { gg.addColorStop(0, '#3a3a78'); gg.addColorStop(.5, '#8a5a4a'); gg.addColorStop(1, '#2a2140'); }
    ctx.fillStyle = gg;
    ctx.beginPath(); ctx.moveTo(wx - 40, 326); ctx.lineTo(wx - 40, 154);
    ctx.quadraticCurveTo(wx, 82, wx + 40, 154); ctx.lineTo(wx + 40, 326); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#120d18'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(wx, 84); ctx.lineTo(wx, 328); ctx.moveTo(wx - 40, 200); ctx.lineTo(wx + 40, 200); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,220,160,.16)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(wx - 40, 240); ctx.lineTo(wx + 40, 240); ctx.stroke();
  }
  // colunas
  for (const px of [60, 900]) {
    ctx.fillStyle = '#221a28'; ctx.fillRect(px - 34, 90, 68, 350);
    ctx.fillStyle = '#332738'; ctx.fillRect(px - 26, 90, 24, 350);
    ctx.fillStyle = '#d8b56a'; ctx.fillRect(px - 38, 86, 76, 10); ctx.fillRect(px - 38, 420, 76, 12);
  }
  // lustres
  for (const lx of [300, 660]) {
    ctx.strokeStyle = 'rgba(160,140,120,.35)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, 90); ctx.stroke();
    ctx.fillStyle = '#3a2c22'; ellipse(ctx, lx, 96, 46, 10); ctx.fill();
    for (let i = -2; i <= 2; i++) {
      const fx = lx + i * 18;
      glow(ctx, fx, 88, 22, corrupt ? 'rgba(180,90,240,.22)' : 'rgba(255,190,100,.24)', .9);
      ctx.fillStyle = corrupt ? '#d090ff' : '#ffd890';
      ctx.beginPath(); ctx.moveTo(fx - 3, 88); ctx.quadraticCurveTo(fx, 76 + Math.sin(t * 9 + i) * 2, fx + 3, 88); ctx.closePath(); ctx.fill();
    }
  }
  // chão
  const fg = ctx.createLinearGradient(0, 420, 0, 600);
  fg.addColorStop(0, corrupt ? '#2a1826' : '#2f2420'); fg.addColorStop(1, '#120d12');
  ctx.fillStyle = fg; ctx.fillRect(0, 420, 960, 180);
  // tapete
  ctx.fillStyle = corrupt ? '#4a1020' : '#6e2028';
  ctx.beginPath(); ctx.moveTo(400, 420); ctx.lineTo(560, 420); ctx.lineTo(720, 600); ctx.lineTo(240, 600); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(216,181,106,.5)';
  ctx.beginPath(); ctx.moveTo(410, 420); ctx.lineTo(420, 420); ctx.lineTo(280, 600); ctx.lineTo(260, 600); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(540, 420); ctx.lineTo(550, 420); ctx.lineTo(700, 600); ctx.lineTo(680, 600); ctx.closePath(); ctx.fill();
  // rachaduras corruptas
  if (corrupt) {
    ctx.strokeStyle = 'rgba(200,90,255,.35)'; ctx.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      const sx = 100 + hash(i * 5.5) * 760, sy = 60 + hash(i * 2.2) * 340;
      ctx.beginPath(); ctx.moveTo(sx, sy);
      ctx.lineTo(sx + (hash(i) - .5) * 60, sy + 30);
      ctx.lineTo(sx + (hash(i + 2) - .5) * 90, sy + 70); ctx.stroke();
    }
    for (let i = 0; i < 30; i++) {
      const x = hash(i * 3.1) * 960, y = 500 - ((t * 30 + i * 20) % 300);
      ctx.fillStyle = `rgba(220,110,80,${.2 + hash(i) * .4})`;
      ctx.fillRect(x + Math.sin(t + i) * 8, y, 2, 2);
    }
  }
  vignette(ctx, .62);
}

function vignette(ctx, strength = .5) {
  const g = ctx.createRadialGradient(480, 300, 180, 480, 300, 620);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, 960, 600);
}

function drawBattleBackdrop(ctx, kind, t, opts = {}) {
  ctx.save();
  switch (kind) {
    case 'forest': drawForestBattle(ctx, t); break;
    case 'dungeon': drawDungeonBattle(ctx, t); break;
    case 'temple': drawTempleBattle(ctx, t); break;
    case 'throne': drawThroneBattle(ctx, t, !!opts.corrupt); break;
    case 'plains':
      battleSky(ctx, '#1d2b44', '#6a5670', '#d09a70');
      drawStars(ctx, t, 40, 200, 4);
      ctx.fillStyle = 'rgba(240,170,120,.18)'; circle(ctx, 760, 260, 90); ctx.fill();
      drawPineLayer(ctx, 390, '#2a2a38', 70, .8, 4);
      ctx.fillStyle = '#243424'; ctx.fillRect(0, 380, 960, 220);
      for (let i = 0; i < 60; i++) {
        const gx = hash(i * 3.3) * 960, gy = 400 + hash(i * 7.1) * 190;
        ctx.strokeStyle = 'rgba(120,150,90,.25)';
        ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + 3, gy - 12); ctx.stroke();
      }
      vignette(ctx, .5);
      break;
    default: drawForestBattle(ctx, t);
  }
  ctx.restore();
}

/* ambient overlay used in the overworld */
function drawMapAmbience(ctx, theme, t, state) {
  if (theme === 'village' || theme === 'fields') {
    ctx.save();
    const g = ctx.createLinearGradient(0, 0, 0, 280);
    g.addColorStop(0, 'rgba(255,170,80,.10)'); g.addColorStop(1, 'rgba(255,170,80,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 960, 280);
    ctx.restore();
    for (let i = 0; i < 16; i++) {
      const x = hash(i * 6.1) * 960;
      const y = 120 + hash(i * 3.7) * 400 + Math.sin(t * .5 + i) * 12;
      const a = .15 + .4 * (Math.sin(t * 1.2 + i * 1.7) * .5 + .5);
      ctx.fillStyle = `rgba(235,225,150,${a})`;
      ctx.fillRect(x, y, 1.8, 1.8);
    }
  }
  if (theme === 'capital') {
    for (let i = 0; i < 14; i++) {
      const x = (hash(i * 4.1) * 1000 + t * 10 * (.3 + hash(i) * .5)) % 1000;
      const y = 100 + hash(i * 7.7) * 440 + Math.sin(t + i) * 10;
      ctx.fillStyle = `rgba(245,225,180,${.1 + hash(i) * .12})`;
      ctx.fillRect(x, y, 1.6, 1.6);
    }
  }
  if (theme === 'castle' || theme === 'temple') {
    for (let i = 0; i < 20; i++) {
      const x = hash(i * 5.3) * 960;
      const y = 100 + ((t * 7 + i * 41) % 440);
      ctx.fillStyle = theme === 'temple' ? `rgba(150,225,255,${.1 + hash(i) * .2})` : `rgba(245,215,150,${.08 + hash(i) * .12})`;
      ctx.fillRect(x, y, 1.5, 1.5);
    }
  }
  if (theme === 'prison') {
    for (let i = 0; i < 22; i++) {
      const x = hash(i * 6.3) * 960;
      const y = 80 + ((t * 5 + i * 31) % 480);
      ctx.fillStyle = `rgba(200,205,215,${.03 + hash(i) * .07})`;
      ctx.fillRect(x, y, 1.5, 1.5);
    }
  }
  if (theme === 'ruined' || theme === 'castleDark') {
    for (let i = 0; i < 26; i++) {
      const x = hash(i * 3.9) * 960 + Math.sin(t * .8 + i) * 20;
      const y = 600 - ((t * 22 + i * 47) % 600);
      ctx.fillStyle = `rgba(240,120,70,${.15 + hash(i) * .4})`;
      ctx.fillRect(x, y, 2, 2);
    }
    const g = ctx.createLinearGradient(0, 0, 0, 600);
    g.addColorStop(0, 'rgba(80,20,10,.10)'); g.addColorStop(1, 'rgba(60,10,10,.24)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 960, 600);
  }
}
