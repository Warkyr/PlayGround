// art/scenes.js — title backdrop, battle arenas, particles
import { rand, randInt, hash2 } from '../util.js';
import { hexA } from './characters.js';

// ---------------- Effects ----------------
export class FX {
  constructor() {
    this.particles = [];
    this.numbers = [];
    this.slashes = [];
    this.rings = [];
    this.flash = null;
    this.shakeT = 0;
    this.shakeDur = 1;
    this.shakeMag = 0;
  }
  clear() { this.particles.length = 0; this.numbers.length = 0; this.slashes.length = 0; this.rings.length = 0; this.flash = null; this.shakeT = 0; }

  burst(x, y, opts = {}) {
    const n = opts.count ?? 16;
    const colors = opts.colors || [opts.color || '#ffcf7a'];
    for (let i = 0; i < n; i++) {
      const a = opts.angle != null ? opts.angle + rand(-opts.spread ?? -0.8, opts.spread ?? 0.8) : rand(0, Math.PI * 2);
      const sp = rand(opts.speedMin ?? 30, opts.speedMax ?? 140);
      this.particles.push({
        x, y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (opts.lift || 0),
        life: 0, max: rand(opts.lifeMin ?? 0.3, opts.lifeMax ?? 0.8),
        size: rand(opts.sizeMin ?? 2, opts.sizeMax ?? 5),
        color: colors[randInt(0, colors.length - 1)],
        gravity: opts.gravity ?? 90,
        glow: opts.glow ?? true,
        drag: opts.drag ?? 0.9,
      });
    }
  }

  number(x, y, text, opts = {}) {
    this.numbers.push({
      x, y, text, life: 0, max: opts.life ?? 0.95,
      color: opts.color || '#fff3cf', size: opts.size || 26,
      vy: opts.vy ?? -54, crit: !!opts.crit, sub: opts.sub || null,
    });
  }

  slash(x, y, angle, opts = {}) {
    this.slashes.push({
      x, y, angle, len: opts.len || 90, life: 0, max: opts.max || 0.32,
      color: opts.color || '#fff6d8', width: opts.width || 4,
    });
  }

  ring(x, y, opts = {}) {
    this.rings.push({
      x, y, r0: opts.r0 ?? 6, r1: opts.r1 ?? 70, life: 0, max: opts.max ?? 0.5,
      color: opts.color || '#ffcf7a', width: opts.width || 3,
    });
  }

  flashScreen(color = '#fff', alpha = 0.6, dur = 0.25) {
    this.flash = { color, alpha, life: 0, max: dur };
  }

  shake(mag = 8, dur = 0.35) {
    this.shakeMag = Math.max(this.shakeMag, mag);
    this.shakeT = Math.max(this.shakeT, dur);
    this.shakeDur = Math.max(this.shakeDur, dur);
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.max) { this.particles.splice(i, 1); continue; }
      p.vy += p.gravity * dt;
      p.vx *= Math.pow(p.drag, dt * 60);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    for (let i = this.numbers.length - 1; i >= 0; i--) {
      const n = this.numbers[i];
      n.life += dt;
      n.y += n.vy * dt;
      n.vy *= Math.pow(0.94, dt * 60);
      if (n.life >= n.max) this.numbers.splice(i, 1);
    }
    for (let i = this.slashes.length - 1; i >= 0; i--) {
      const s = this.slashes[i]; s.life += dt;
      if (s.life >= s.max) this.slashes.splice(i, 1);
    }
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i]; r.life += dt;
      if (r.life >= r.max) this.rings.splice(i, 1);
    }
    if (this.flash) { this.flash.life += dt; if (this.flash.life >= this.flash.max) this.flash = null; }
    if (this.shakeT > 0) this.shakeT = Math.max(0, this.shakeT - dt);
  }

  offset() {
    if (this.shakeT <= 0) return { x: 0, y: 0 };
    const k = this.shakeT / this.shakeDur;
    const m = this.shakeMag * k;
    return { x: rand(-m, m), y: rand(-m, m) };
  }

  draw(g) {
    g.save();
    for (const p of this.particles) {
      const t = 1 - p.life / p.max;
      g.globalAlpha = Math.min(1, t * 1.5);
      if (p.glow) g.globalCompositeOperation = 'lighter';
      g.fillStyle = p.color;
      const s = Math.max(1, p.size * (0.4 + t * 0.6));
      g.fillRect(p.x - s / 2, p.y - s / 2, s, s);
      if (p.glow) g.globalCompositeOperation = 'source-over';
    }
    for (const s of this.slashes) {
      const t = s.life / s.max;
      const a = Math.sin(t * Math.PI);
      g.save();
      g.translate(s.x, s.y); g.rotate(s.angle);
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = a;
      g.strokeStyle = s.color; g.lineWidth = s.width;
      g.beginPath(); g.arc(0, 0, s.len * 0.5, -0.9, 0.9); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = Math.max(1, s.width * 0.35);
      g.beginPath(); g.arc(0, 0, s.len * 0.5, -0.8, 0.8); g.stroke();
      g.restore();
    }
    for (const r of this.rings) {
      const t = r.life / r.max;
      g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = (1 - t) * 0.85;
      g.strokeStyle = r.color; g.lineWidth = r.width * (1 - t * 0.6);
      g.beginPath(); g.arc(r.x, r.y, r.r0 + (r.r1 - r.r0) * t, 0, Math.PI * 2); g.stroke();
      g.restore();
    }
    for (const n of this.numbers) {
      const t = n.life / n.max;
      const pop = t < 0.18 ? 0.6 + (t / 0.18) * 0.55 : 1.1 - (t - 0.18) * 0.12;
      g.save();
      g.globalAlpha = t > 0.65 ? 1 - (t - 0.65) / 0.35 : 1;
      g.translate(n.x, n.y);
      g.scale(pop, pop);
      g.font = `700 ${n.size}px "VT323", monospace`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = 5; g.strokeStyle = 'rgba(8,8,14,.85)';
      g.strokeText(n.text, 0, 0);
      g.fillStyle = n.color; g.fillText(n.text, 0, 0);
      if (n.crit) {
        g.font = `700 ${Math.max(10, n.size * 0.45)}px "Press Start 2P", monospace`;
        g.fillStyle = '#ffb84a'; g.strokeStyle = 'rgba(8,8,14,.8)'; g.lineWidth = 4;
        g.strokeText('CRÍTICO', 0, -n.size * 0.95);
        g.fillText('CRÍTICO', 0, -n.size * 0.95);
      }
      g.restore();
    }
    if (this.flash) {
      const t = this.flash.life / this.flash.max;
      g.save(); g.globalAlpha = this.flash.alpha * (1 - t);
      g.fillStyle = this.flash.color; g.fillRect(0, 0, g.canvas.width, g.canvas.height);
      g.restore();
    }
    g.restore();
  }
}

// ---------------- Battle backgrounds ----------------
const ARENA = {
  village: { top:'#1a2a44', mid:'#3a4a5a', low:'#6a5a44', ground:'#4a3e30', glow:'#ffcf7a', kind:'trees', sky:'dusk' },
  forest: { top:'#0e1e18', mid:'#1a3a2a', low:'#2a4a30', ground:'#243a26', glow:'#a8e0b0', kind:'trees', sky:'night' },
  night: { top:'#0a1224', mid:'#1a2a44', low:'#2a3450', ground:'#2a2c3a', glow:'#8ab8e0', kind:'town', sky:'night' },
  snow: { top:'#1a2e48', mid:'#4a6a88', low:'#a8c4d8', ground:'#c8d8e4', glow:'#d8f0ff', kind:'mountains', sky:'snow' },
  prison: { top:'#12100e', mid:'#2a221c', low:'#3a2e24', ground:'#2e2620', glow:'#ff9a4a', kind:'arches', sky:'dark' },
  shrine: { top:'#0a1420', mid:'#142a38', low:'#1e3e4a', ground:'#1a2e36', glow:'#7fe0d0', kind:'pillars', sky:'dark' },
  temple: { top:'#1a1a2a', mid:'#4a3e30', low:'#8a7450', ground:'#6a5a40', glow:'#ffd27a', kind:'pillars', sky:'dawn' },
  castle: { top:'#140a18', mid:'#2a1424', low:'#3a2030', ground:'#2a1a24', glow:'#ff6a4a', kind:'arches', sky:'dark' },
};

export function drawBattleBG(g, w, h, theme, time) {
  const a = ARENA[theme] || ARENA.forest;
  const compact = w < 780;
  // Horizon must sit above the enemy row so both sides stand on the same floor.
  const gy = h * (compact ? 0.42 : 0.52);
  const grd = g.createLinearGradient(0, 0, 0, h);
  grd.addColorStop(0, a.top);
  grd.addColorStop(0.55, a.mid);
  grd.addColorStop(1, a.low);
  g.fillStyle = grd; g.fillRect(0, 0, w, h);

  // moon / glow
  if (a.sky === 'night' || a.sky === 'dark') {
    const mx = w * 0.76, my = h * 0.2;
    g.save(); g.globalCompositeOperation = 'lighter';
    const mg = g.createRadialGradient(mx, my, 4, mx, my, 120);
    mg.addColorStop(0, 'rgba(200,220,255,.25)');
    mg.addColorStop(1, 'rgba(150,180,255,0)');
    g.fillStyle = mg; g.fillRect(mx - 130, my - 130, 260, 260);
    g.restore();
    g.fillStyle = 'rgba(220,232,255,.7)';
    g.beginPath(); g.arc(mx, my, 26, 0, Math.PI * 2); g.fill();
    g.fillStyle = a.top;
    g.beginPath(); g.arc(mx + 9, my - 5, 24, 0, Math.PI * 2); g.fill();
  }
  if (a.sky === 'dawn' || a.sky === 'snow') {
    g.save(); g.globalCompositeOperation = 'lighter';
    const sx = w * 0.2, sy = h * 0.1;
    const sg = g.createRadialGradient(sx, sy, 5, sx, sy, 280);
    sg.addColorStop(0, 'rgba(255,230,160,.22)');
    sg.addColorStop(1, 'rgba(255,180,100,0)');
    g.fillStyle = sg; g.fillRect(0, 0, w, h * 0.8);
    g.restore();
  }

  // far silhouettes
  if (a.kind === 'mountains') {
    g.fillStyle = 'rgba(30,50,70,.55)';
    for (let i = 0; i < 5; i++) {
      const bx = (i / 5) * w - 60;
      g.beginPath(); g.moveTo(bx, h * 0.62); g.lineTo(bx + w * 0.14, h * 0.28); g.lineTo(bx + w * 0.3, h * 0.62); g.closePath(); g.fill();
    }
    g.fillStyle = 'rgba(210,230,245,.35)';
    for (let i = 0; i < 5; i++) {
      const bx = (i / 5) * w - 60;
      g.beginPath(); g.moveTo(bx + w * 0.1, h * 0.4); g.lineTo(bx + w * 0.14, h * 0.28); g.lineTo(bx + w * 0.19, h * 0.42); g.closePath(); g.fill();
    }
  }
  if (a.kind === 'trees') {
    g.fillStyle = 'rgba(10,20,16,.5)';
    for (let i = 0; i < 12; i++) {
      const bx = (i / 12) * w + (i % 2) * 20;
      const bh = 90 + (i % 4) * 30;
      g.fillRect(bx + 12, gy - bh, 8, bh);
      g.beginPath(); g.arc(bx + 16, gy - bh, 38, 0, Math.PI * 2); g.fill();
    }
  }
  if (a.kind === 'arches') {
    const archY = gy - 14;
    g.strokeStyle = 'rgba(255,255,255,.055)'; g.lineWidth = 18;
    for (let i = 0; i < 4; i++) {
      const bx = w * 0.12 + i * w * 0.26;
      g.beginPath(); g.arc(bx, archY, 70, Math.PI, Math.PI * 2); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.04)';
      g.fillRect(bx - 80, archY, 18, gy - archY);
      g.fillRect(bx + 62, archY, 18, gy - archY);
    }
  }
  if (a.kind === 'pillars' || a.kind === 'town') {
    for (let i = 0; i < 5; i++) {
      const bx = w * 0.06 + i * w * 0.21;
      g.fillStyle = 'rgba(255,255,255,.045)';
      g.fillRect(bx, h * 0.18, w * 0.045, gy - h * 0.18);
      g.fillStyle = 'rgba(255,255,255,.07)';
      g.fillRect(bx - 6, h * 0.18, w * 0.045 + 12, 10);
    }
  }

  // ground
  const gg = g.createLinearGradient(0, gy, 0, h);
  gg.addColorStop(0, a.ground);
  gg.addColorStop(1, shade(a.ground, -0.4));
  g.fillStyle = gg; g.fillRect(0, gy, w, h - gy);
  // arena ellipse
  g.fillStyle = 'rgba(0,0,0,.18)';
  g.beginPath(); g.ellipse(w * 0.52, gy + 14, w * 0.42, 22, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = hexA(a.glow, 0.12); g.lineWidth = 1;
  g.beginPath(); g.ellipse(w * 0.52, gy + 12, w * 0.38, 16, 0, 0, Math.PI * 2); g.stroke();

  // fog
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) {
    const fx = ((time * (8 + i * 5) + i * 300) % (w + 400)) - 200;
    const fg = g.createRadialGradient(fx, gy + 30 + i * 14, 10, fx, gy + 30 + i * 14, 260);
    fg.addColorStop(0, hexA(a.glow, 0.035));
    fg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = fg; g.fillRect(fx - 260, gy - 80, 520, 260);
  }
  g.restore();

  // vignette
  const vg = g.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.9);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,.55)');
  g.fillStyle = vg; g.fillRect(0, 0, w, h);
}

function shade(hex, amt) {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.max(0, Math.min(255, Math.round(r * (1 + amt))));
  g = Math.max(0, Math.min(255, Math.round(g * (1 + amt))));
  b = Math.max(0, Math.min(255, Math.round(b * (1 + amt))));
  return `rgb(${r},${g},${b})`;
}

// ---------------- Title / ending backdrop ----------------
export function drawTitleBG(g, w, h, time, mode = 'title') {
  const dawn = mode === 'ending';
  const grd = g.createLinearGradient(0, 0, 0, h);
  if (dawn) {
    grd.addColorStop(0, '#1a2440');
    grd.addColorStop(0.42, '#5a4a6a');
    grd.addColorStop(0.66, '#c98a6a');
    grd.addColorStop(1, '#f0c48a');
  } else {
    grd.addColorStop(0, '#050a16');
    grd.addColorStop(0.5, '#0e1a30');
    grd.addColorStop(0.78, '#1a2438');
    grd.addColorStop(1, '#2a1e26');
  }
  g.fillStyle = grd; g.fillRect(0, 0, w, h);

  // stars
  for (let i = 0; i < 90; i++) {
    const x = hash2(i, 3) * w;
    const y = hash2(i, 7) * h * 0.6;
    const tw = 0.4 + Math.sin(time * 1.4 + i * 1.7) * 0.35;
    g.globalAlpha = tw * (dawn ? 0.25 : 0.85);
    g.fillStyle = i % 11 === 0 ? '#ffe6b0' : '#cfe0ff';
    const s = i % 17 === 0 ? 2 : 1;
    g.fillRect(x, y, s, s);
  }
  g.globalAlpha = 1;

  // moon
  const mx = w * 0.76, my = h * 0.22, mr = Math.min(w, h) * 0.065;
  g.save(); g.globalCompositeOperation = 'lighter';
  const mg = g.createRadialGradient(mx, my, mr * 0.4, mx, my, mr * 5);
  mg.addColorStop(0, dawn ? 'rgba(255,220,160,.28)' : 'rgba(210,225,255,.22)');
  mg.addColorStop(1, 'rgba(150,180,255,0)');
  g.fillStyle = mg; g.fillRect(mx - mr * 5, my - mr * 5, mr * 10, mr * 10);
  g.restore();
  g.fillStyle = dawn ? 'rgba(255,235,190,.85)' : 'rgba(228,236,255,.86)';
  g.beginPath(); g.arc(mx, my, mr, 0, Math.PI * 2); g.fill();
  g.fillStyle = dawn ? '#e8c890' : '#b8c4de';
  g.beginPath(); g.arc(mx - mr * 0.3, my - mr * 0.2, mr * 0.18, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(mx + mr * 0.25, my + mr * 0.3, mr * 0.12, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(mx + mr * 0.1, my - mr * 0.4, mr * 0.09, 0, Math.PI * 2); g.fill();

  // clouds
  g.save(); g.globalAlpha = dawn ? 0.25 : 0.16;
  for (let i = 0; i < 5; i++) {
    const cx = ((time * (4 + i * 2) + i * 340) % (w + 500)) - 250;
    const cy = h * (0.16 + i * 0.07);
    g.fillStyle = dawn ? '#f0c8a8' : '#8a9ac0';
    g.beginPath();
    g.ellipse(cx, cy, 150 + i * 30, 16 + i * 3, 0, 0, Math.PI * 2);
    g.ellipse(cx + 90, cy + 6, 100, 12, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();

  // distant mountains
  const mt = (offset, color, baseY, height) => {
    g.fillStyle = color; g.beginPath(); g.moveTo(-20, h);
    for (let x = -20; x <= w + 20; x += 60) {
      const n = hash2(Math.floor(x / 60) + offset, offset);
      g.lineTo(x, baseY - n * height);
    }
    g.lineTo(w + 20, h); g.closePath(); g.fill();
  };
  mt(2, dawn ? 'rgba(90,70,90,.55)' : 'rgba(16,24,42,.75)', h * 0.7, h * 0.24);
  mt(9, dawn ? 'rgba(70,55,70,.75)' : 'rgba(10,16,30,.9)', h * 0.78, h * 0.18);

  // castle silhouette
  const cx = w * 0.24, cy = h * 0.72, cs = Math.min(w, h) * 0.0016;
  g.fillStyle = dawn ? 'rgba(40,30,44,.8)' : 'rgba(5,8,16,.92)';
  const towers = [[-90, -150, 40, 170], [-40, -190, 34, 210], [40, -170, 38, 190], [92, -130, 34, 150], [140, -100, 30, 120]];
  towers.forEach(([dx, dy, tw, th]) => {
    g.fillRect(cx + dx * cs * 20, cy + dy * cs * 20, tw * cs * 20, th * cs * 20);
    g.beginPath();
    g.moveTo(cx + (dx - 6) * cs * 20, cy + dy * cs * 20);
    g.lineTo(cx + (dx + tw / 2) * cs * 20, cy + (dy - 50) * cs * 20);
    g.lineTo(cx + (dx + tw + 6) * cs * 20, cy + dy * cs * 20);
    g.fill();
  });
  g.fillStyle = 'rgba(255,190,90,.55)';
  for (let i = 0; i < 7; i++) {
    const wx = cx + (-80 + i * 32) * cs * 20;
    const wy = cy + (-110 + (i % 3) * 40) * cs * 20;
    g.fillRect(wx, wy, 4, 7);
  }

  // foreground cliff
  g.fillStyle = dawn ? 'rgba(30,24,32,.96)' : 'rgba(3,5,10,.98)';
  g.beginPath();
  g.moveTo(0, h);
  g.lineTo(0, h * 0.83);
  g.lineTo(w * 0.16, h * 0.79);
  g.lineTo(w * 0.32, h * 0.84);
  g.lineTo(w * 0.5, h * 0.8);
  g.lineTo(w * 0.7, h * 0.86);
  g.lineTo(w, h * 0.82);
  g.lineTo(w, h);
  g.closePath(); g.fill();

  // lone swordsman silhouette on the cliff
  const hx = w * 0.19, hy = h * 0.802;
  const s = Math.max(1, Math.min(w, h) / 340);
  g.save();
  g.translate(hx, hy);
  g.scale(s, s);
  const cape = Math.sin(time * 1.6) * 5;
  g.fillStyle = dawn ? 'rgba(18,14,22,.98)' : 'rgba(1,2,6,1)';
  g.fillRect(-5, -58, 11, 24); // torso
  g.fillRect(-7, -62, 15, 6); // shoulders
  g.fillRect(-5, -74, 10, 13); // head
  g.beginPath(); g.moveTo(-7, -58); g.lineTo(-18 - cape, -22); g.lineTo(-4, -30); g.closePath(); g.fill();
  g.fillRect(-6, -36, 5, 36); // leg
  g.fillRect(2, -36, 5, 36);
  g.fillRect(-2, -96, 3, 36); // sword
  g.fillRect(-6, -62, 9, 3);
  g.fillRect(2, -60, 9, 3);
  g.restore();

  // embers
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 34; i++) {
    const seed = i * 7.3;
    const x = (hash2(i, 1) * w + Math.sin(time * 0.5 + seed) * 30);
    const y = h - ((time * (18 + (i % 7) * 6) + hash2(i, 2) * h) % (h * 1.05));
    const a = 0.25 + Math.sin(time * 3 + seed) * 0.2;
    g.globalAlpha = Math.max(0.05, a);
    g.fillStyle = i % 3 === 0 ? '#ffd27a' : '#ff8a4a';
    const sz = 1 + (i % 3);
    g.fillRect(x, y, sz, sz);
  }
  g.restore();

  // horizon glow
  g.save(); g.globalCompositeOperation = 'lighter';
  const hg = g.createRadialGradient(w * 0.5, h * 0.72, 10, w * 0.5, h * 0.72, w * 0.5);
  hg.addColorStop(0, dawn ? 'rgba(255,190,120,.14)' : 'rgba(120,150,220,.07)');
  hg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = hg; g.fillRect(0, 0, w, h);
  g.restore();

  // vignette
  const vg = g.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, h * 1.05);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,.62)');
  g.fillStyle = vg; g.fillRect(0, 0, w, h);
}

export function drawVictoryGlow(g, w, h, time) {
  g.save(); g.globalCompositeOperation = 'lighter';
  const grd = g.createRadialGradient(w / 2, h * 0.5, 10, w / 2, h * 0.5, h * 0.7);
  grd.addColorStop(0, `rgba(255,220,140,${0.12 + Math.sin(time * 2) * 0.03})`);
  grd.addColorStop(1, 'rgba(255,180,80,0)');
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
  g.restore();
}
