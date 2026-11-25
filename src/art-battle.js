/* =========================================================================
   AURORA PARTIDA — characters, portraits helpers, enemy sprites
   ========================================================================= */
'use strict';

function drawHumanoid(ctx, cx, baseY, lookRef, dir, walk, scale, opts = {}) {
  const look = typeof lookRef === 'string' ? (LOOKS[lookRef] || LOOKS.rowan) : lookRef;
  const t = opts.t || 0;
  const facingUp = dir === 'up';
  const side = dir === 'left' || dir === 'right';
  const mirror = dir === 'left';
  const s = (scale || 1) * (look.small ? .8 : 1) * (look.big ? 1.16 : 1);
  const seed = opts.seed || 0;
  const step = Math.sin(walk || 0);
  const bob = Math.sin(t * 2.4 + seed) * .55;
  const capeSway = Math.sin(t * 2 + seed) * 1.6;

  ctx.save();
  ctx.translate(cx, baseY + bob);
  ctx.scale(mirror ? -s : s, s);

  // sombra
  ctx.fillStyle = 'rgba(4,7,12,.36)';
  ellipse(ctx, 0, 1, 10.5, 3.4); ctx.fill();

  // capa
  if (look.cape) {
    ctx.fillStyle = look.cape;
    ctx.beginPath();
    ctx.moveTo(-8, -25);
    ctx.quadraticCurveTo(-14 - capeSway, -14, -13 + capeSway * .4, -2);
    ctx.lineTo(-4, -4); ctx.lineTo(0, -1); ctx.lineTo(5, -5);
    ctx.quadraticCurveTo(10, -14, 8, -25); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.06)';
    ctx.beginPath(); ctx.moveTo(-8, -25); ctx.quadraticCurveTo(-11, -14, -9, -4); ctx.lineTo(-5, -5); ctx.closePath(); ctx.fill();
  }

  // arma nas costas
  if (look.weapon === 'sword') {
    ctx.save();
    ctx.rotate(-.42);
    ctx.fillStyle = '#3a2a20'; ctx.fillRect(7, -32, 3, 24);
    ctx.fillStyle = '#d8b56a'; ctx.fillRect(4.5, -35, 8, 3);
    ctx.fillStyle = '#7a5a30'; ctx.fillRect(7.5, -38, 1.8, 4);
    ctx.restore();
  }
  if (look.spear) {
    ctx.strokeStyle = '#6b5034'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(10, 1); ctx.lineTo(13, -46); ctx.stroke();
    ctx.fillStyle = '#b8c0ca';
    ctx.beginPath(); ctx.moveTo(13, -53); ctx.lineTo(16, -44); ctx.lineTo(13, -46); ctx.lineTo(10, -44); ctx.closePath(); ctx.fill();
  }

  // pernas
  const legA = side ? step * 2.2 : step * 1.8;
  const legB = -legA;
  if (!look.dress && !look.robe) {
    ctx.fillStyle = look.pants;
    rr(ctx, -6 + legA * .5, -12 + Math.max(0, legA), 5, 12 - Math.max(0, legA), 1.5); ctx.fill();
    rr(ctx, 1 - legB * .5, -12 + Math.max(0, legB), 5, 12 - Math.max(0, legB), 1.5); ctx.fill();
    ctx.fillStyle = '#2a211c';
    rr(ctx, -6.5 + legA * .5, -3 + Math.max(0, legA), 6, 3, 1); ctx.fill();
    rr(ctx, .5 - legB * .5, -3 + Math.max(0, legB), 6, 3, 1); ctx.fill();
  } else {
    ctx.fillStyle = '#2b2626';
    rr(ctx, -5, -7, 4, 7, 1.5); ctx.fill();
    rr(ctx, 1, -7, 4, 7, 1.5); ctx.fill();
  }

  // vestido / manto
  if (look.dress) {
    ctx.fillStyle = look.top;
    ctx.beginPath(); ctx.moveTo(-7, -27); ctx.lineTo(7, -27);
    ctx.quadraticCurveTo(9, -17, 12, -4); ctx.quadraticCurveTo(0, 0, -12, -4);
    ctx.quadraticCurveTo(-9, -17, -7, -27); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.10)';
    ctx.beginPath(); ctx.moveTo(-5, -24); ctx.quadraticCurveTo(-7, -12, -8, -5); ctx.lineTo(-4, -6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = look.accent;
    ctx.fillRect(-7, -14, 14, 1.6);
  }
  if (look.robe) {
    ctx.fillStyle = look.top;
    ctx.beginPath(); ctx.moveTo(-8, -27); ctx.lineTo(8, -27);
    ctx.quadraticCurveTo(10, -12, 11, 0); ctx.lineTo(-11, 0);
    ctx.quadraticCurveTo(-10, -12, -8, -27); ctx.closePath(); ctx.fill();
    ctx.fillStyle = look.accent; ctx.fillRect(-8, -15, 16, 2);
  }

  // tronco
  ctx.fillStyle = look.top;
  rr(ctx, -8, -28, 16, 18, 4); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.10)';
  rr(ctx, -6, -27, 5, 13, 2); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.16)';
  ctx.fillRect(4, -26, 3, 15);
  if (look.apron) {
    ctx.fillStyle = '#d8c9a8'; ctx.fillRect(-6, -20, 12, 14);
    ctx.fillStyle = 'rgba(120,90,60,.3)'; ctx.fillRect(-6, -20, 12, 2);
  }
  if (look.armor) {
    ctx.fillStyle = look.accent;
    rr(ctx, -8.5, -27, 17, 8, 3); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(-5, -26, 6, 2);
    ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(-7, -20, 14, 2);
    if (look.pauldron) {
      ctx.fillStyle = look.accent; circle(ctx, -8, -25, 3.4); ctx.fill(); circle(ctx, 8, -25, 3.4); ctx.fill();
    }
  }
  // cinto
  ctx.fillStyle = look.accent;
  ctx.fillRect(-8, -13, 16, 2.4);
  ctx.fillStyle = '#d8b56a'; ctx.fillRect(-1.4, -13.4, 2.8, 3);

  // braços
  const armSwing = side ? -step * 2.5 : step * 2;
  ctx.fillStyle = look.armor ? look.accent : look.top;
  rr(ctx, -10.5, -25 - armSwing * .2, 4, 11, 2); ctx.fill();
  rr(ctx, 6.5, -25 + armSwing * .2, 4, 11, 2); ctx.fill();
  ctx.fillStyle = look.skin;
  circle(ctx, -8.5, -13.8 - armSwing * .2, 2.2); ctx.fill();
  circle(ctx, 8.5, -13.8 + armSwing * .2, 2.2); ctx.fill();
  if (look.pauldron) {
    ctx.fillStyle = look.accent;
    circle(ctx, -9, -26, 4.2); ctx.fill(); circle(ctx, 9, -26, 4.2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.22)'; circle(ctx, -10, -27.5, 1.5); ctx.fill(); circle(ctx, 8, -27.5, 1.5); ctx.fill();
  }
  // cachecol
  if (look.scarf) {
    ctx.fillStyle = look.scarf;
    ctx.fillRect(-7.5, -29.5, 15, 3.4);
    ctx.beginPath(); ctx.moveTo(5, -28); ctx.quadraticCurveTo(10 + capeSway * .6, -24, 8 + capeSway, -18);
    ctx.lineTo(5.5, -19); ctx.quadraticCurveTo(7, -23, 3.5, -27); ctx.closePath(); ctx.fill();
  }

  // cabeça
  const headY = -34.5;
  ctx.fillStyle = look.skin;
  circle(ctx, 0, headY, 8.6); ctx.fill();
  if (side) { circle(ctx, -2.5, headY + 5, 1.6); ctx.fill(); }
  ctx.fillStyle = 'rgba(90,40,20,.10)';
  ellipse(ctx, 0, headY + 4.4, 7, 4); ctx.fill();

  // cabelo
  const hairStyle = look.style;
  ctx.fillStyle = look.hair;
  if (hairStyle !== 'bald' && hairStyle !== 'helmet') {
    if (facingUp) {
      circle(ctx, 0, headY - .5, 8.7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.10)'; circle(ctx, -3, headY - 4, 3.4); ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(-8.6, headY + 1);
      ctx.quadraticCurveTo(-9, headY - 10, 0, headY - 10.5);
      ctx.quadraticCurveTo(9, headY - 10, 8.6, headY + 1);
      ctx.quadraticCurveTo(4, headY - 3.6, 1.5, headY - 5.5);
      ctx.quadraticCurveTo(-2, headY - 2, -5, headY - 4);
      ctx.quadraticCurveTo(-7, headY - 2, -8.6, headY + 1);
      ctx.closePath(); ctx.fill();
      if (hairStyle === 'long') {
        ctx.beginPath(); ctx.moveTo(-8, headY);
        ctx.quadraticCurveTo(-12, headY + 8, -9, headY + 13); ctx.lineTo(-5, headY + 11);
        ctx.quadraticCurveTo(-7, headY + 5, -6, headY); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(8, headY);
        ctx.quadraticCurveTo(12, headY + 8, 9, headY + 13); ctx.lineTo(5, headY + 11);
        ctx.quadraticCurveTo(7, headY + 5, 6, headY); ctx.closePath(); ctx.fill();
      }
    }
  }
  if (hairStyle === 'beard') {
    ctx.fillStyle = look.hair;
    ctx.beginPath(); ctx.moveTo(-7, headY + 4);
    ctx.quadraticCurveTo(-5, headY + 12, 0, headY + 12);
    ctx.quadraticCurveTo(5, headY + 12, 7, headY + 4);
    ctx.quadraticCurveTo(3, headY + 7, 0, headY + 6);
    ctx.quadraticCurveTo(-3, headY + 7, -7, headY + 4); ctx.closePath(); ctx.fill();
  }
  if (hairStyle === 'helmet') {
    ctx.fillStyle = '#77818e';
    ctx.beginPath(); ctx.arc(0, headY - .5, 8.8, Math.PI, 0); ctx.lineTo(8.8, headY + 3);
    ctx.lineTo(5, headY + 5); ctx.lineTo(-5, headY + 5); ctx.lineTo(-8.8, headY + 3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#4d5661'; ctx.fillRect(-1.6, headY - 4, 3.2, 8);
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(-7, headY - 6, 5, 2);
  }
  // rosto
  if (!facingUp) {
    const eo = side ? 2 : 0;
    ctx.fillStyle = '#221a16';
    if (side) {
      ctx.fillRect(2.4, headY - .4, 1.8, 2.2);
      ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(2.6, headY - .2, .7, .8);
    } else {
      ctx.fillRect(-4.2, headY - .6, 1.9, 2.3);
      ctx.fillRect(2.3, headY - .6, 1.9, 2.3);
      ctx.fillStyle = 'rgba(255,255,255,.75)';
      ctx.fillRect(-3.9, headY - .3, .7, .8); ctx.fillRect(2.6, headY - .3, .7, .8);
    }
    ctx.strokeStyle = 'rgba(90,45,40,.7)'; ctx.lineWidth = 1;
    ctx.beginPath();
    if (look.tired) { ctx.moveTo(-3.8, headY + 4); ctx.lineTo(4, headY + 4); }
    else { ctx.moveTo(-2.2, headY + 4.2); ctx.quadraticCurveTo(.8, headY + 5.2, 3, headY + 4); }
    ctx.stroke();
    if (look.flower) {
      ctx.fillStyle = '#e8c878';
      for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; circle(ctx, 6.6 + Math.cos(a) * 2, headY - 6 + Math.sin(a) * 2, 1.3); ctx.fill(); }
    }
    if (look.crown) {
      ctx.fillStyle = '#e0bd72';
      ctx.beginPath(); ctx.moveTo(-7, headY - 7); ctx.lineTo(-5.5, headY - 13); ctx.lineTo(-2, headY - 9);
      ctx.lineTo(1, headY - 14); ctx.lineTo(4, headY - 9); ctx.lineTo(7, headY - 13); ctx.lineTo(7.5, headY - 7); ctx.closePath(); ctx.fill();
    }
  }
  ctx.restore();
}

/* --------------------------------------------------------- enemy sprites */
function drawWolfEnemy(ctx, t, scale, stark = false) {
  ctx.save();
  ctx.scale(scale, scale);
  const bob = Math.sin(t * 2.2) * 1.6;
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ellipse(ctx, 0, 2, 34, 8); ctx.fill();
  // cauda
  ctx.strokeStyle = stark ? '#5a5a78' : '#5a6478'; ctx.lineWidth = 8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(26, -28 + bob); ctx.quadraticCurveTo(48, -40 + Math.sin(t * 2) * 6, 43, -14); ctx.stroke();
  ctx.strokeStyle = 'rgba(160,175,210,.25)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(28, -30 + bob); ctx.quadraticCurveTo(46, -39, 42, -18); ctx.stroke();
  // corpo
  ctx.fillStyle = stark ? '#6a6a86' : '#697489';
  ellipse(ctx, 0, -28 + bob, 27, 16); ctx.fill();
  ctx.fillStyle = stark ? '#8a8aa6' : '#8a96ac';
  ellipse(ctx, -6, -33 + bob, 18, 10); ctx.fill();
  // patas
  ctx.fillStyle = '#4a5364';
  for (const [lx, ph] of [[-16, 0], [-6, 1.5], [14, 3], [23, 4.5]]) {
    const off = Math.sin(t * 3 + ph) * 2;
    rr(ctx, lx, -16 + bob, 5, 18 + off, 2); ctx.fill();
    ctx.fillStyle = '#333b49'; rr(ctx, lx - 1, -2 + bob + off, 7, 4, 1.5); ctx.fill();
    ctx.fillStyle = '#4a5364';
  }
  // cabeça
  ctx.fillStyle = stark ? '#7a7a96' : '#768198';
  ctx.save(); ctx.translate(-25, -40 + bob); ctx.rotate(-.12);
  ellipse(ctx, 0, 0, 14, 11); ctx.fill();
  // orelhas
  ctx.fillStyle = stark ? '#5a5a78' : '#596377';
  ctx.beginPath(); ctx.moveTo(-9, -6); ctx.lineTo(-12, -18); ctx.lineTo(-2, -9); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(4, -7); ctx.lineTo(4, -19); ctx.lineTo(11, -7); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(220,140,140,.35)';
  ctx.beginPath(); ctx.moveTo(-9.5, -8); ctx.lineTo(-11, -15); ctx.lineTo(-5, -9); ctx.closePath(); ctx.fill();
  // focinho
  ctx.fillStyle = stark ? '#8a8aa6' : '#8a96ac';
  ctx.beginPath(); ctx.moveTo(-6, -2); ctx.quadraticCurveTo(-19, 1, -22, 6);
  ctx.quadraticCurveTo(-15, 11, -4, 8); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#22252e'; ellipse(ctx, -21, 5, 3.4, 2.6); ctx.fill();
  // olhos
  ctx.fillStyle = stark ? '#e0e8ff' : '#f0b458';
  ctx.shadowColor = stark ? '#a0c0ff' : '#f0a030'; ctx.shadowBlur = 6;
  ellipse(ctx, -10, -3, 3.2, 2.1); ctx.fill();
  ellipse(ctx, 1, -4, 3, 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#1a1410'; ctx.fillRect(-11, -4, 1.2, 2.4); ctx.fillRect(0, -5, 1.2, 2.2);
  // dentes
  ctx.fillStyle = '#e8e0d0';
  for (let i = 0; i < 3; i++) {
    const tx = -14 + i * 3.4;
    ctx.beginPath(); ctx.moveTo(tx, 8); ctx.lineTo(tx + 1.4, 12); ctx.lineTo(tx + 2.6, 8); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  // marcas
  ctx.strokeStyle = 'rgba(20,24,32,.3)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-6, -42 + bob); ctx.lineTo(2, -36 + bob); ctx.moveTo(8, -38 + bob); ctx.lineTo(15, -31 + bob); ctx.stroke();
  if (stark) glow(ctx, 0, -32, 44, 'rgba(120,160,255,.14)', .8);
  ctx.restore();
}

function drawGuardianEnemy(ctx, t, scale) {
  ctx.save(); ctx.scale(scale, scale);
  const bob = Math.sin(t * 1.1) * 3;
  ctx.fillStyle = 'rgba(0,0,0,.4)'; ellipse(ctx, 0, 2, 44, 10); ctx.fill();
  // runas de fundo
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  glow(ctx, 0, -55, 70, 'rgba(140,220,255,.12)', .8);
  ctx.restore();
  // pernas
  ctx.fillStyle = '#6a6252';
  rr(ctx, -25, -20, 18, 22, 3); ctx.fill();
  rr(ctx, 8, -20, 18, 22, 3); ctx.fill();
  ctx.fillStyle = '#514a3e'; ctx.fillRect(-26, -22, 20, 4); ctx.fillRect(7, -22, 20, 4);
  // torso
  ctx.fillStyle = '#7c7460';
  ctx.beginPath();
  ctx.moveTo(-28, -28 + bob); ctx.lineTo(-20, -62 + bob); ctx.lineTo(0, -70 + bob);
  ctx.lineTo(22, -60 + bob); ctx.lineTo(28, -28 + bob); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#948a72';
  ctx.beginPath(); ctx.moveTo(-22, -34 + bob); ctx.lineTo(-16, -58 + bob); ctx.lineTo(4, -64 + bob); ctx.lineTo(12, -40 + bob); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(40,34,26,.5)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-12, -58 + bob); ctx.lineTo(-6, -44 + bob); ctx.lineTo(-14, -34 + bob); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(12, -55 + bob); ctx.lineTo(8, -42 + bob); ctx.lineTo(16, -34 + bob); ctx.stroke();
  // núcleo
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  glow(ctx, 0, -46 + bob, 25, 'rgba(120,220,255,.5)', .9);
  ctx.fillStyle = 'rgba(180,240,255,.95)'; circle(ctx, 0, -46 + bob, 6); ctx.fill();
  ctx.fillStyle = 'rgba(230,255,255,.9)'; circle(ctx, 0, -46 + bob, 2.6); ctx.fill();
  ctx.restore();
  // ombros/braços
  ctx.fillStyle = '#6a6252';
  for (const sideX of [-1, 1]) {
    const ax = sideX * 34, ay = -50 + bob + Math.sin(t * 1.6 + sideX) * 2;
    ctx.save(); ctx.translate(ax, ay);
    ctx.fillStyle = '#716956';
    ctx.beginPath(); ctx.moveTo(-8, -14); ctx.lineTo(10, -10); ctx.lineTo(12, 12); ctx.lineTo(-6, 16); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#8c8068';
    circle(ctx, 2, 4, 10); ctx.fill();
    ctx.fillStyle = '#a09680'; circle(ctx, 0, 0, 4); ctx.fill();
    ctx.strokeStyle = 'rgba(40,34,26,.45)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-4, -6); ctx.lineTo(4, 4); ctx.stroke();
    ctx.restore();
  }
  // cabeça
  ctx.fillStyle = '#7c7460';
  ctx.beginPath(); ctx.moveTo(-11, -66 + bob); ctx.lineTo(11, -66 + bob);
  ctx.lineTo(15, -78 + bob); ctx.lineTo(0, -86 + bob); ctx.lineTo(-15, -78 + bob); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#948a72'; ctx.fillRect(-9, -78 + bob, 18, 7);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = 'rgba(150,235,255,.95)';
  ctx.fillRect(-7, -77 + bob, 4, 2.4); ctx.fillRect(3, -77 + bob, 4, 2.4);
  ctx.restore();
  // musgo
  ctx.fillStyle = 'rgba(80,110,70,.35)';
  ellipse(ctx, -18, -34 + bob, 8, 4); ctx.fill();
  ellipse(ctx, 20, -24 + bob, 6, 3); ctx.fill();
  ctx.restore();
}

function drawHeraldEnemy(ctx, t, scale) {
  ctx.save(); ctx.scale(scale, scale);
  const bob = Math.sin(t * 1.4) * 3;
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ellipse(ctx, 0, 2, 48, 11); ctx.fill();
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  glow(ctx, 0, -78 + bob, 100, 'rgba(150,80,220,.22)', 1);
  ctx.restore();
  // asas de vazio
  for (const sideX of [-1, 1]) {
    ctx.save(); ctx.scale(sideX, 1);
    ctx.fillStyle = 'rgba(28,16,44,.92)';
    ctx.beginPath();
    ctx.moveTo(14, -100 + bob);
    ctx.quadraticCurveTo(52, -120 + Math.sin(t) * 4, 72, -84 + bob);
    ctx.quadraticCurveTo(58, -80 + bob, 54, -64 + bob);
    ctx.quadraticCurveTo(48, -72 + bob, 40, -58 + bob);
    ctx.quadraticCurveTo(34, -74 + bob, 22, -62 + bob);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(150,100,230,.35)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(18, -94 + bob); ctx.quadraticCurveTo(44, -104, 62, -82 + bob); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(22, -78 + bob); ctx.quadraticCurveTo(40, -84, 48, -68 + bob); ctx.stroke();
    ctx.restore();
  }
  // corpo
  ctx.fillStyle = '#241b33';
  ctx.beginPath();
  ctx.moveTo(-22, -34 + bob); ctx.lineTo(-18, -82 + bob); ctx.lineTo(0, -94 + bob);
  ctx.lineTo(20, -80 + bob); ctx.lineTo(23, -34 + bob); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#332447';
  ctx.beginPath(); ctx.moveTo(-14, -40 + bob); ctx.lineTo(-12, -76 + bob); ctx.lineTo(0, -86 + bob);
  ctx.lineTo(12, -74 + bob); ctx.lineTo(14, -40 + bob); ctx.closePath(); ctx.fill();
  // armadura dourada
  ctx.strokeStyle = '#b48ae0'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-14, -60 + bob); ctx.lineTo(0, -52 + bob); ctx.lineTo(14, -60 + bob); ctx.stroke();
  // núcleo
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  glow(ctx, 0, -62 + bob, 32, 'rgba(200,90,255,.5)', 1);
  ctx.fillStyle = 'rgba(240,180,255,.95)'; circle(ctx, 0, -62 + bob, 7); ctx.fill();
  ctx.fillStyle = '#fff'; circle(ctx, 0, -62 + bob, 2.6); ctx.fill();
  ctx.restore();
  // cabeça/coroa
  ctx.fillStyle = '#1a1326';
  ctx.beginPath(); ctx.moveTo(-11, -90 + bob); ctx.lineTo(-8, -106 + bob); ctx.lineTo(0, -98 + bob);
  ctx.lineTo(8, -106 + bob); ctx.lineTo(11, -90 + bob); ctx.closePath(); ctx.fill();
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = 'rgba(220,150,255,.95)';
  ctx.fillRect(-7, -97 + bob, 4, 2); ctx.fillRect(4, -97 + bob, 4, 2);
  ctx.restore();
  ctx.fillStyle = '#b48ae0';
  for (let i = 0; i < 5; i++) {
    const a = -1.9 + i * .55;
    ctx.save(); ctx.translate(Math.cos(a) * 18, -100 + bob + Math.sin(a) * 7); ctx.rotate(a + Math.PI / 2);
    ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(3, 4); ctx.lineTo(-3, 4); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  // espada colossal
  ctx.save(); ctx.translate(-34, -66 + bob); ctx.rotate(-.45);
  ctx.fillStyle = '#22182e'; ctx.fillRect(-3, -4, 6, 58);
  ctx.strokeStyle = 'rgba(180,140,240,.75)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(0, 54); ctx.stroke();
  ctx.fillStyle = '#b48ae0'; ctx.fillRect(-7, 54, 14, 4);
  ctx.fillStyle = 'rgba(230,200,255,.9)'; circle(ctx, 0, 0, 3); ctx.fill();
  ctx.restore();
  ctx.restore();
}

function drawMace(ctx, x, y, t) {
  ctx.save(); ctx.translate(x, y);
  ctx.rotate(.3 + Math.sin(t * 1.5) * .03);
  ctx.fillStyle = '#4b3a2c'; ctx.fillRect(-2, -40, 4, 44);
  ctx.fillStyle = '#6a6c72';
  ctx.beginPath(); ctx.moveTo(0, -56); ctx.lineTo(12, -48); ctx.lineTo(10, -34); ctx.lineTo(-10, -34); ctx.lineTo(-12, -48); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#8a8c92'; ctx.fillRect(-8, -46, 16, 8);
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5;
    ctx.fillStyle = '#5a5c62';
    circle(ctx, Math.cos(a) * 10, -44 + Math.sin(a) * 10, 2.4); ctx.fill();
  }
  ctx.restore();
}

function drawEnemySprite(ctx, kind, cx, baseY, scale, t, opts = {}) {
  const flip = opts.flip ? -1 : 1;
  ctx.save();
  ctx.translate(cx, baseY);
  if (flip === -1) ctx.scale(-1, 1);
  if (opts.hurt) ctx.rotate(Math.sin(t * 60) * .012);
  switch (kind) {
    case 'wolf':
      drawWolfEnemy(ctx, t, scale, opts.stark);
      break;
    case 'bandit':
      drawHumanoid(ctx, 0, 0, 'bandit', 'left', 0, scale * 1.45, { t });
      // adaga
      ctx.save(); ctx.translate(-34 * scale, -30 * scale); ctx.rotate(-.6);
      ctx.fillStyle = '#c8ccd4'; ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(3, 2); ctx.lineTo(-3, 2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#6a4a30'; ctx.fillRect(-2, 2, 4, 7);
      ctx.restore();
      break;
    case 'guard':
      drawHumanoid(ctx, 0, 0, 'guard', 'left', 0, scale * 1.5, { t });
      break;
    case 'warden': {
      const wardenLook = { ...LOOKS.warden, top: '#573f35', accent: '#7c5a48' };
      drawHumanoid(ctx, 0, 0, wardenLook, 'left', 0, scale * 1.5, { t });
      drawMace(ctx, -44 * scale, -8 * scale, t);
      // chifres
      ctx.fillStyle = '#c9bfae';
      ctx.beginPath(); ctx.moveTo(-8 * scale, -80 * scale); ctx.quadraticCurveTo(-24 * scale, -96 * scale, -18 * scale, -104 * scale);
      ctx.quadraticCurveTo(-10 * scale, -94 * scale, -2 * scale, -82 * scale); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(10 * scale, -80 * scale); ctx.quadraticCurveTo(26 * scale, -94 * scale, 20 * scale, -102 * scale);
      ctx.quadraticCurveTo(12 * scale, -92 * scale, 4 * scale, -82 * scale); ctx.closePath(); ctx.fill();
      break;
    }
    case 'kael': {
      const look = { ...LOOKS.kael, top: opts.corrupt ? '#3b2340' : '#8c2f38', cape: opts.corrupt ? '#24132e' : '#6e2029' };
      drawHumanoid(ctx, 0, 0, look, 'left', 0, scale * 1.65, { t });
      // espada grande
      ctx.save(); ctx.translate(-40 * scale, -22 * scale); ctx.rotate(.25);
      ctx.fillStyle = '#d8b56a'; ctx.fillRect(-3, -70, 6, 66);
      ctx.fillStyle = 'rgba(255,240,190,.5)'; ctx.fillRect(-1, -66, 1.6, 58);
      ctx.fillStyle = '#8a6a30'; ctx.fillRect(-11, 0, 22, 5);
      ctx.fillStyle = '#5a3a24'; ctx.fillRect(-2.4, 5, 4.8, 12);
      ctx.fillStyle = '#e8cf90'; circle(ctx, 0, 16, 3); ctx.fill();
      ctx.restore();
      if (opts.corrupt) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        glow(ctx, 0, -70, 70, 'rgba(160,90,220,.25)', .9);
        ctx.restore();
      }
      break;
    }
    case 'guardian':
      drawGuardianEnemy(ctx, t, scale);
      break;
    case 'echo': {
      const echoLook = {
        skin: '#8fb8c8', hair: '#5a7a8a', style: 'hero', top: '#3f6a7a', pants: '#2a4a55',
        accent: '#a8e0e8', scarf: '#7ab8c8', cape: '#2e5866', weapon: 'sword'
      };
      ctx.save();
      ctx.globalAlpha = .88;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      glow(ctx, 0, -50, 70, 'rgba(100,200,220,.2)', 1);
      ctx.restore();
      drawHumanoid(ctx, 0, 0, echoLook, 'left', 0, scale * 1.55, { t });
      ctx.restore();
      // partículas
      for (let i = 0; i < 9; i++) {
        const a = t * .6 + i * 1.7;
        const rr = 26 + (i % 4) * 11;
        ctx.fillStyle = `rgba(150,230,240,${.18 + .25 * Math.sin(t * 2 + i)})`;
        ctx.fillRect(Math.cos(a) * rr, -30 - (i * 7) % 60 + Math.sin(a * 2) * 8, 2.4, 2.4);
      }
      break;
    }
    case 'herald':
      drawHeraldEnemy(ctx, t, scale);
      break;
    default:
      drawHumanoid(ctx, 0, 0, 'guard', 'left', 0, scale * 1.4, { t });
  }
  ctx.restore();
}
