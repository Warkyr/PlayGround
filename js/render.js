import { V, TABLE_SLOTS, UNLOCK_ORDER, STOVES, PASS_SLOTS, PASS_PICK, QUEUE_SPOTS, STAFF_HOMES, dishById, fmtMoney } from './data.js'

const TAU = Math.PI * 2
const C = {
  floorA: '#c99a63', floorB: '#c08f58', floorLine: '#a97645', floorGrain: '#b98450',
  wall: '#f1e2c8', wallShade: '#e2cda9', trim: '#b98a5a',
  kitchen: '#dfe8e1', kitchenLine: '#c5d4cb', counter: '#9c6b40', counterTop: '#c8a06c',
  table: '#9a6438', tableTop: '#c08a54', tableEdge: '#7d4e2b',
  chair: '#6a4326', chairTop: '#8a5a34',
  cream: '#f8ecd9', dark: '#2a1c14', gold: '#f2b544', green: '#7fc47a', red: '#e0604f'
}

function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rad, y)
  ctx.arcTo(x + w, y, x + w, y + h, rad)
  ctx.arcTo(x + w, y + h, x, y + h, rad)
  ctx.arcTo(x, y + h, x, y, rad)
  ctx.arcTo(x, y, x + w, y, rad)
  ctx.closePath()
}
function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill()
}
function emoji(ctx, text, x, y, size) {
  ctx.font = `${size}px "Noto Color Emoji", "Segoe UI Emoji", "Apple Color Emoji", sans-serif`
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(text, x, y)
}

export class Renderer {
  constructor(canvas, game) {
    this.canvas = canvas
    this.game = game
    this.ctx = canvas.getContext('2d')
    this.dpr = 1
    this.parts = []
    this.steamT = 0
    this.noteT = 0
    this.time = 0
    this.hover = null
    this.resize()
    window.addEventListener('resize', () => this.resize())
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.dpr = dpr
    this.canvas.width = Math.round(V.W * dpr)
    this.canvas.height = Math.round(V.H * dpr)
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  /* -------------------------------------------------------------- master */
  draw(now, dt) {
    const ctx = this.ctx
    const s = this.game.state
    this.time = now / 1000
    dt = Math.min(dt || 0.016, 0.05)
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    ctx.clearRect(0, 0, V.W, V.H)
    this.drawBackdrop()
    this.drawWalls()
    this.drawFloor()
    this.drawRug()
    this.drawWindows()
    this.drawKitchen()
    this.drawDecor()
    this.drawQueueSpots()
    this.drawTables()
    this.drawWalkingCustomers()
    this.drawStaff()
    this.drawBubbles()
    this.updateParticles(dt)
    this.drawParticles()
    this.drawFx(dt)
    this.drawLighting()
    this.drawVignette()
    this.drawHover()
  }

  /* -------------------------------------------------------------- scene */
  drawBackdrop() {
    const ctx = this.ctx
    const g = ctx.createLinearGradient(0, 0, 0, V.H)
    g.addColorStop(0, '#221711'); g.addColorStop(1, '#150e0a')
    ctx.fillStyle = g; ctx.fillRect(0, 0, V.W, V.H)
  }

  drawWalls() {
    const ctx = this.ctx
    // top wall
    const wg = ctx.createLinearGradient(0, 0, 0, 70)
    wg.addColorStop(0, '#f6e8d0'); wg.addColorStop(1, C.wall)
    ctx.fillStyle = wg; ctx.fillRect(0, 0, V.W, 70)
    ctx.fillStyle = C.wallShade; ctx.fillRect(0, 58, V.W, 12)
    ctx.fillStyle = C.trim; ctx.fillRect(0, 66, V.W, 4)
    // subway tiles behind kitchen
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 540, 66); ctx.clip()
    ctx.fillStyle = '#e7efe9'; ctx.fillRect(0, 0, 540, 66)
    ctx.strokeStyle = '#cfded5'; ctx.lineWidth = 1
    for (let y = 0; y < 66; y += 13) {
      ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(540, y + 0.5); ctx.stroke()
      const off = (Math.floor(y / 13) % 2) * 18
      for (let x = off; x < 540; x += 36) {
        ctx.beginPath(); ctx.moveTo(x + 0.5, y); ctx.lineTo(x + 0.5, y + 13); ctx.stroke()
      }
    }
    ctx.restore()
    // bottom wall + door
    const bg = ctx.createLinearGradient(0, 576, 0, 600)
    bg.addColorStop(0, '#6b4527'); bg.addColorStop(1, '#4a2e19')
    ctx.fillStyle = bg; ctx.fillRect(0, 576, V.W, 24)
    ctx.fillStyle = '#3a2313'; ctx.fillRect(0, 574, V.W, 3)
    // door
    ctx.fillStyle = '#2c1a0e'; ctx.fillRect(438, 572, 84, 28)
    ctx.fillStyle = '#6d4526'; ctx.fillRect(442, 575, 76, 25)
    ctx.fillStyle = '#e0b24c'; ctx.beginPath(); ctx.arc(510, 588, 2.5, 0, TAU); ctx.fill()
    // mat
    ctx.fillStyle = 'rgba(60,35,18,.55)'; rr(ctx, 438, 546, 84, 26, 6); ctx.fill()
    ctx.strokeStyle = 'rgba(255,220,160,.25)'; ctx.lineWidth = 2; rr(ctx, 442, 549, 76, 20, 5); ctx.stroke()
    ctx.fillStyle = 'rgba(255,235,200,.5)'; ctx.font = 'bold 9px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center'
    ctx.fillText('ENTRADA', 480, 562)
    // side skirting
    ctx.fillStyle = 'rgba(60,35,18,.35)'; ctx.fillRect(24, 70, 6, 506); ctx.fillRect(930, 70, 6, 506)
  }

  drawFloor() {
    const ctx = this.ctx
    // dining wood
    ctx.save(); ctx.beginPath(); ctx.rect(24, 70, 912, 506); ctx.clip()
    ctx.fillStyle = C.floorA; ctx.fillRect(24, 70, 912, 506)
    const h = 26
    for (let row = 0; row < 20; row++) {
      const y = 70 + row * h
      ctx.fillStyle = row % 2 ? C.floorA : C.floorB
      ctx.fillRect(24, y, 912, h)
      ctx.strokeStyle = C.floorLine; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(24, y + 0.5); ctx.lineTo(936, y + 0.5); ctx.stroke()
      const off = (row % 3) * 120
      ctx.strokeStyle = 'rgba(150,100,55,.5)'
      for (let x = 24 + off; x < 936; x += 240) {
        ctx.beginPath(); ctx.moveTo(x + 0.5, y); ctx.lineTo(x + 0.5, y + h); ctx.stroke()
      }
      // grain
      ctx.strokeStyle = 'rgba(120,80,40,.10)'
      ctx.beginPath(); ctx.moveTo(24, y + 9); ctx.bezierCurveTo(300, y + 6, 600, y + 13, 936, y + 8); ctx.stroke()
    }
    ctx.restore()
    // kitchen tile floor
    ctx.save(); ctx.beginPath(); ctx.rect(24, 70, 516, 170); ctx.clip()
    ctx.fillStyle = '#dfe8e1'; ctx.fillRect(24, 70, 516, 170)
    ctx.strokeStyle = '#c3d3c9'; ctx.lineWidth = 1
    for (let x = 24; x <= 540; x += 30) { ctx.beginPath(); ctx.moveTo(x + .5, 70); ctx.lineTo(x + .5, 240); ctx.stroke() }
    for (let y = 70; y <= 240; y += 30) { ctx.beginPath(); ctx.moveTo(24, y + .5); ctx.lineTo(540, y + .5); ctx.stroke() }
    ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(24, 70, 516, 3)
    ctx.restore()
    // kitchen counter / pass
    ctx.fillStyle = 'rgba(40,25,15,.25)'; rr(ctx, 24, 226, 516, 30, 8); ctx.fill()
    const cg = ctx.createLinearGradient(0, 226, 0, 250)
    cg.addColorStop(0, C.counterTop); cg.addColorStop(1, C.counter)
    ctx.fillStyle = cg; rr(ctx, 24, 226, 516, 24, 7); ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(30, 229, 504, 2)
    ctx.fillStyle = '#8a5b33'; rr(ctx, 24, 248, 516, 10, 4); ctx.fill()
    ctx.strokeStyle = 'rgba(60,35,18,.25)'; ctx.lineWidth = 1
    for (let x = 60; x < 540; x += 70) { ctx.beginPath(); ctx.moveTo(x, 250); ctx.lineTo(x, 256); ctx.stroke() }
    // dining edge highlight
    ctx.fillStyle = 'rgba(255,240,210,.12)'; ctx.fillRect(24, 258, 912, 2)
  }

  drawRug() {
    const ctx = this.ctx
    ctx.save()
    ctx.shadowColor = 'rgba(30,15,8,.25)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4
    ctx.fillStyle = '#a9503f'; rr(ctx, 292, 278, 444, 268, 18); ctx.fill()
    ctx.restore()
    ctx.strokeStyle = 'rgba(255,220,170,.35)'; ctx.lineWidth = 3; rr(ctx, 300, 286, 428, 252, 14); ctx.stroke()
    ctx.strokeStyle = 'rgba(70,25,18,.35)'; ctx.lineWidth = 2; rr(ctx, 308, 294, 412, 236, 11); ctx.stroke()
    // diamond pattern
    ctx.save(); ctx.beginPath(); rr(ctx, 292, 278, 444, 268, 18); ctx.clip()
    ctx.strokeStyle = 'rgba(255,225,180,.10)'; ctx.lineWidth = 2
    for (let x = 250; x < 780; x += 56) {
      for (let y = 260; y < 570; y += 56) {
        ctx.beginPath(); ctx.moveTo(x, y + 20); ctx.lineTo(x + 20, y); ctx.lineTo(x + 40, y + 20); ctx.lineTo(x + 20, y + 40); ctx.closePath(); ctx.stroke()
      }
    }
    ctx.restore()
  }

  drawWindows() {
    const ctx = this.ctx
    const hour = this.game.state.clock / 60
    let skyA = '#a9dcf2', skyB = '#e4f4fb'
    if (hour >= 16.5 && hour < 18.5) { skyA = '#f6a15c'; skyB = '#ffe0a8' }
    else if (hour >= 18.5 && hour < 20) { skyA = '#6b5b9e'; skyB = '#e2907a' }
    else if (hour >= 20) { skyA = '#17234d'; skyB = '#2e3f74' }
    for (let i = 0; i < 3; i++) {
      const x = 594 + i * 112, y = 10, w = 82, h = 48
      ctx.save()
      ctx.shadowColor = 'rgba(20,10,5,.35)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2
      ctx.fillStyle = '#7c5230'; rr(ctx, x - 5, y - 5, w + 10, h + 10, 5); ctx.fill()
      ctx.restore()
      const g = ctx.createLinearGradient(0, y, 0, y + h)
      g.addColorStop(0, skyA); g.addColorStop(1, skyB)
      ctx.fillStyle = g; ctx.fillRect(x, y, w, h)
      if (hour >= 20) {
        ctx.fillStyle = 'rgba(255,255,255,.85)'
        for (let k = 0; k < 5; k++) {
          const sx = x + 8 + ((i * 37 + k * 23) % (w - 16)), sy = y + 7 + ((k * 13 + i * 7) % (h - 16))
          ctx.beginPath(); ctx.arc(sx, sy, 1, 0, TAU); ctx.fill()
        }
        ctx.fillStyle = 'rgba(255,245,200,.9)'; ctx.beginPath(); ctx.arc(x + w - 16, y + 14, 5, 0, TAU); ctx.fill()
      } else {
        ctx.fillStyle = 'rgba(255,255,255,.45)'
        ctx.beginPath(); ctx.ellipse(x + 22 + i * 6, y + 18, 13, 6, 0, 0, TAU); ctx.fill()
        ctx.beginPath(); ctx.ellipse(x + 48, y + 30, 10, 5, 0, 0, TAU); ctx.fill()
      }
      // mullions
      ctx.strokeStyle = '#7c5230'; ctx.lineWidth = 3
      ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2); ctx.stroke()
      // sill
      ctx.fillStyle = '#8a5b33'; rr(ctx, x - 8, y + h + 3, w + 16, 6, 3); ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(x, y, w, 2)
    }
  }

  drawKitchen() {
    const ctx = this.ctx
    const s = this.game.state
    // fridge
    ctx.save(); ctx.shadowColor = 'rgba(20,10,5,.3)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3
    ctx.fillStyle = '#cfd9d4'; rr(ctx, 34, 100, 52, 96, 6); ctx.fill(); ctx.restore()
    ctx.strokeStyle = '#aebbb5'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(34, 140); ctx.lineTo(86, 140); ctx.stroke()
    ctx.fillStyle = '#9aa8a2'; rr(ctx, 76, 116, 4, 16, 2); ctx.fill(); rr(ctx, 76, 148, 4, 16, 2); ctx.fill()
    // hood
    ctx.fillStyle = '#b7c2bd'; ctx.beginPath(); ctx.moveTo(160, 16); ctx.lineTo(300, 16); ctx.lineTo(322, 62); ctx.lineTo(138, 62); ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#9aa8a2'; rr(ctx, 168, 20, 124, 5, 2); ctx.fill()
    ctx.fillStyle = '#8d9b95'; rr(ctx, 198, 62, 64, 7, 3); ctx.fill()
    // hanging pans
    ctx.strokeStyle = '#7d8a84'; ctx.lineWidth = 1.5
    for (let i = 0; i < 4; i++) {
      const x = 350 + i * 42
      ctx.beginPath(); ctx.moveTo(x, 14); ctx.lineTo(x, 28); ctx.stroke()
      ctx.fillStyle = ['#b06a44', '#7f8d87', '#c48a4d', '#6f7d77'][i]
      ctx.beginPath(); ctx.arc(x, 36, 11, 0, TAU); ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.arc(x - 3, 32, 3, 0, TAU); ctx.fill()
    }
    // shelf
    ctx.fillStyle = '#9c6b40'; rr(ctx, 480, 20, 50, 4, 2); ctx.fill()
    for (let i = 0; i < 3; i++) { ctx.fillStyle = ['#e0b24c', '#d96a5a', '#7dbb6e'][i]; rr(ctx, 486 + i * 14, 8, 9, 12, 2); ctx.fill() }
    // stoves
    const stations = 1 + s.upgrades.station
    const busy = s.staff.filter(x => x.role === 'cook' && x.task?.type === 'cook' && x.state === 'working')
    for (let i = 0; i < STOVES.length; i++) {
      const st = STOVES[i], active = i < stations
      ctx.save()
      ctx.shadowColor = 'rgba(20,10,5,.35)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 3
      ctx.fillStyle = active ? '#4b4a48' : '#6b6660'
      rr(ctx, st.x - 34, st.y - 26, 68, 52, 6); ctx.fill()
      ctx.restore()
      ctx.fillStyle = active ? '#5c5a57' : '#77716a'; rr(ctx, st.x - 30, st.y - 22, 60, 44, 4); ctx.fill()
      ctx.fillStyle = '#2c2b2a'
      ctx.beginPath(); ctx.arc(st.x - 14, st.y - 4, 11, 0, TAU); ctx.fill()
      ctx.beginPath(); ctx.arc(st.x + 14, st.y - 4, 11, 0, TAU); ctx.fill()
      if (!active) {
        ctx.fillStyle = 'rgba(30,30,30,.45)'; rr(ctx, st.x - 34, st.y - 26, 68, 52, 6); ctx.fill()
        emoji(ctx, '🔒', st.x, st.y - 2, 15)
      } else {
        const cooking = busy.find(b => b.station === i)
        // burners glow
        ctx.fillStyle = cooking ? 'rgba(255,140,50,.9)' : 'rgba(255,120,40,.45)'
        for (const dx of [-14, 14]) {
          ctx.beginPath(); ctx.arc(st.x + dx, st.y - 4, 6, 0, TAU); ctx.fill()
          ctx.strokeStyle = cooking ? '#ffcf7a' : '#b96a3c'; ctx.lineWidth = 2
          ctx.beginPath(); ctx.arc(st.x + dx, st.y - 4, 7.5, 0, TAU); ctx.stroke()
        }
        if (cooking) {
          // pot
          ctx.fillStyle = '#2f2f2f'; rr(ctx, st.x - 13, st.y - 22, 26, 14, 3); ctx.fill()
          ctx.fillStyle = '#444'; rr(ctx, st.x - 15, st.y - 24, 30, 4, 2); ctx.fill()
          ctx.fillStyle = 'rgba(255,255,255,.2)'; rr(ctx, st.x - 10, st.y - 20, 6, 3, 2); ctx.fill()
        }
      }
      // knobs
      ctx.fillStyle = active ? '#d8d2c8' : '#8a857e'
      for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(st.x - 16 + k * 16, st.y + 16, 2.4, 0, TAU); ctx.fill() }
    }
    // pass ready dishes
    for (const t of s.tables) {
      const o = t.order
      if (!o || o.state !== 'ready') continue
      const slot = PASS_SLOTS[Math.max(0, Math.min(PASS_SLOTS.length - 1, o.readySlot))]
      ctx.fillStyle = 'rgba(20,10,5,.22)'; ctx.beginPath(); ctx.ellipse(slot.x, slot.y + 3, 13, 5, 0, 0, TAU); ctx.fill()
      ctx.fillStyle = '#fdf8ef'; ctx.beginPath(); ctx.arc(slot.x, slot.y, 11, 0, TAU); ctx.fill()
      ctx.strokeStyle = '#e3d6c2'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(slot.x, slot.y, 11, 0, TAU); ctx.stroke()
      emoji(ctx, dishById(o.dishId)?.emoji || '🍽️', slot.x, slot.y + 1, 13)
      // ticket
      ctx.fillStyle = '#fff8e7'; ctx.save(); ctx.translate(slot.x + 15, slot.y - 8); ctx.rotate(0.12); ctx.fillRect(0, 0, 8, 11); ctx.restore()
    }
    // pick-up marker
    ctx.fillStyle = 'rgba(255,240,200,.25)'; ctx.font = 'bold 8px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center'
    ctx.fillText('PASS', PASS_PICK.x, PASS_PICK.y + 16)
  }

  drawDecor() {
    const ctx = this.ctx
    const s = this.game.state
    const d = s.upgrades.decor
    // plants
    const plants = [[46, 545], [914, 545], [46, 96], [914, 96]]
    for (let i = 0; i < Math.min(d, 4); i++) {
      const [x, y] = plants[i]
      ctx.fillStyle = 'rgba(30,20,10,.2)'; ctx.beginPath(); ctx.ellipse(x, y + 12, 16, 6, 0, 0, TAU); ctx.fill()
      ctx.fillStyle = '#b06a44'; ctx.beginPath(); ctx.moveTo(x - 11, y + 10); ctx.lineTo(x + 11, y + 10); ctx.lineTo(x + 7, y - 4); ctx.lineTo(x - 7, y - 4); ctx.closePath(); ctx.fill()
      const leaves = [[-10, -14], [0, -20], [10, -14], [-6, -8], [7, -7]]
      for (const [dx, dy] of leaves) {
        ctx.fillStyle = '#4f8a4a'; ctx.beginPath(); ctx.ellipse(x + dx, y + dy, 7, 10, dx * 0.06, 0, TAU); ctx.fill()
        ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.ellipse(x + dx - 2, y + dy - 3, 2.5, 4, 0, 0, TAU); ctx.fill()
      }
    }
    // wall paintings
    if (d >= 2) {
      for (const [x, y, col] of [[552, 16, '#c96a4e'], [560, 40, '#7d9a6a']]) {
        ctx.fillStyle = '#6b4527'; rr(ctx, x, y, 30, 24, 2); ctx.fill()
        ctx.fillStyle = col; rr(ctx, x + 3, y + 3, 24, 18, 1); ctx.fill()
        ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(x + 6, y + 7, 8, 6)
      }
    }
    // string lights
    if (s.upgrades.lighting >= 1) {
      ctx.strokeStyle = 'rgba(70,45,25,.7)'; ctx.lineWidth = 1.4
      for (let seg = 0; seg < 2; seg++) {
        const x0 = 560 + seg * 190, x1 = x0 + 180
        ctx.beginPath(); ctx.moveTo(x0, 74); ctx.quadraticCurveTo((x0 + x1) / 2, 92, x1, 74); ctx.stroke()
        for (let i = 1; i < 5; i++) {
          const t = i / 5
          const x = x0 + (x1 - x0) * t
          const y = 74 + 4 * 4 * t * (1 - t) * 4
          const glow = ctx.createRadialGradient(x, y, 0, x, y, 10)
          glow.addColorStop(0, 'rgba(255,220,130,.85)'); glow.addColorStop(1, 'rgba(255,220,130,0)')
          ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, 10, 0, TAU); ctx.fill()
          ctx.fillStyle = '#ffe6a3'; ctx.beginPath(); ctx.arc(x, y, 2.6, 0, TAU); ctx.fill()
        }
      }
    }
    // pendant lamps
    for (const x of [622, 776, 902]) {
      ctx.strokeStyle = '#3b2a1c'; ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.moveTo(x, 66); ctx.lineTo(x, 96); ctx.stroke()
      ctx.fillStyle = '#3b2a1c'; ctx.beginPath(); ctx.moveTo(x - 15, 108); ctx.lineTo(x + 15, 108); ctx.lineTo(x + 8, 94); ctx.lineTo(x - 8, 94); ctx.closePath(); ctx.fill()
      ctx.fillStyle = '#ffd98a'; ctx.beginPath(); ctx.ellipse(x, 108, 9, 3, 0, 0, TAU); ctx.fill()
    }
    // musician
    if (s.upgrades.music >= 1) {
      const x = 908, y = 548
      ctx.fillStyle = 'rgba(30,20,10,.2)'; ctx.beginPath(); ctx.ellipse(x, y + 3, 14, 5, 0, 0, TAU); ctx.fill()
      ctx.fillStyle = '#4a3b6b'; rr(ctx, x - 10, y - 30, 20, 30, 6); ctx.fill()
      ctx.fillStyle = '#e0ac7e'; ctx.beginPath(); ctx.arc(x, y - 38, 8, 0, TAU); ctx.fill()
      ctx.fillStyle = '#2b1d16'; ctx.beginPath(); ctx.arc(x, y - 41, 8.5, Math.PI, TAU); ctx.fill()
      ctx.strokeStyle = '#d8b45a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 9, y - 30); ctx.lineTo(x + 17, y - 20); ctx.stroke()
      emoji(ctx, '🎷', x + 18, y - 24, 13)
      if (Math.random() < 0.02) this.parts.push({ x: x + 18, y: y - 34, vx: rand(-8, 8), vy: -18, life: 2, max: 2, type: 'note', text: '♪', color: '#ffe6a3', size: 12 })
    }
  }

  drawQueueSpots() {
    const ctx = this.ctx
    ctx.save()
    for (const spot of QUEUE_SPOTS) {
      ctx.fillStyle = 'rgba(255,240,210,.09)'
      ctx.beginPath(); ctx.ellipse(spot.x, spot.y + 2, 15, 6, 0, 0, TAU); ctx.fill()
      ctx.strokeStyle = 'rgba(255,240,210,.18)'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.ellipse(spot.x, spot.y + 2, 15, 6, 0, 0, TAU); ctx.stroke()
    }
    ctx.restore()
  }

  /* -------------------------------------------------------------- tables */
  drawTables() {
    const s = this.game.state
    for (const t of s.tables) {
      if (!t.unlocked) { this.drawLockedTable(t); continue }
      const seated = s.customers.filter(c => c.tableId === t.id && ['deciding', 'awaiting', 'waitingFood', 'eating'].includes(c.state))
      // chairs
      for (let i = 0; i < t.cap; i++) {
        const p = this.seatPos(t, i)
        this.drawChair(p, p.x - t.x, p.y - t.y)
      }
      // table shadow + top
      ctxShadow(this.ctx, t.x, t.y + 8, 42, 16, 'rgba(30,15,5,.25)')
      this.ctx.fillStyle = C.tableEdge
      this.ctx.beginPath(); this.ctx.arc(t.x, t.y, 34, 0, TAU); this.ctx.fill()
      const tg = this.ctx.createRadialGradient(t.x - 8, t.y - 10, 4, t.x, t.y, 34)
      tg.addColorStop(0, '#d29b62'); tg.addColorStop(1, C.tableTop)
      this.ctx.fillStyle = tg
      this.ctx.beginPath(); this.ctx.arc(t.x, t.y, 31, 0, TAU); this.ctx.fill()
      this.ctx.strokeStyle = 'rgba(110,65,30,.35)'; this.ctx.lineWidth = 1.5
      this.ctx.beginPath(); this.ctx.arc(t.x, t.y, 22, 0, TAU); this.ctx.stroke()
      this.ctx.fillStyle = 'rgba(255,255,255,.12)'
      this.ctx.beginPath(); this.ctx.ellipse(t.x - 9, t.y - 11, 12, 6, -0.5, 0, TAU); this.ctx.fill()
      // plates / food
      if (seated.length) {
        const c = seated[0]
        for (let k = 0; k < c.party; k++) {
          const p = this.seatPos(t, c.seatStart + k)
          const dx = p.x - t.x, dy = p.y - t.y
          const len = Math.hypot(dx, dy) || 1
          const px = t.x + (dx / len) * 19, py = t.y + (dy / len) * 19
          this.ctx.fillStyle = 'rgba(40,25,12,.18)'; this.ctx.beginPath(); this.ctx.arc(px, py + 1.5, 7.5, 0, TAU); this.ctx.fill()
          this.ctx.fillStyle = '#fbf4e8'; this.ctx.beginPath(); this.ctx.arc(px, py, 7, 0, TAU); this.ctx.fill()
          this.ctx.strokeStyle = '#e2d2ba'; this.ctx.lineWidth = 1; this.ctx.beginPath(); this.ctx.arc(px, py, 7, 0, TAU); this.ctx.stroke()
          if (c.state === 'eating' || c.state === 'waitingFood') {
            const d = dishById(c.dishId)
            if (d && c.state === 'eating') emoji(this.ctx, d.emoji, px, py + 0.5, 9)
          }
        }
      }
      // seated people
      for (const c of seated) {
        for (let k = 0; k < c.party; k++) {
          const p = this.seatPos(t, c.seatStart + k)
          const dx = p.x - t.x, dy = p.y - t.y
          const len = Math.hypot(dx, dy) || 1
          const px = p.x - (dx / len) * 4, py = p.y - (dy / len) * 4
          this.drawPerson(px, py, {
            shirt: c.shirt, skin: c.skin, hair: c.hair, seated: true, phase: c.bob,
            isCritic: c.isCritic && k === 0, mood: c.state === 'eating' ? 'happy' : 'idle'
          })
        }
      }
      // dirty marker
      if (t.dirty) {
        this.ctx.save()
        this.ctx.translate(t.x, t.y)
        this.ctx.fillStyle = 'rgba(120,80,40,.55)'
        for (let i = 0; i < 4; i++) { this.ctx.beginPath(); this.ctx.arc(Math.cos(i * 1.7) * 12, Math.sin(i * 1.7) * 9, 2.2, 0, TAU); this.ctx.fill() }
        const fly = this.time * 3
        this.ctx.fillStyle = '#3a2a1a'
        this.ctx.beginPath(); this.ctx.arc(Math.cos(fly) * 20, -14 + Math.sin(fly * 1.4) * 5, 1.8, 0, TAU); this.ctx.fill()
        this.ctx.restore()
        const pulse = 0.5 + 0.5 * Math.sin(this.time * 4 + t.slot)
        this.drawBubble(t.x, t.y - 52, '🧽', 1 + pulse * 0.06)
      }
    }
  }

  seatPos(t, i) {
    const offs = t.cap === 2 ? [[-46, 0], [46, 0]] : [[-46, 0], [46, 0], [0, -46], [0, 46]]
    const [dx, dy] = offs[((i % t.cap) + t.cap) % t.cap]
    return { x: t.x + dx, y: t.y + dy }
  }

  drawChair(p, dx, dy) {
    const ctx = this.ctx
    const horizontal = Math.abs(dx) > Math.abs(dy)
    ctx.save()
    ctx.translate(p.x, p.y + 2)
    ctx.fillStyle = 'rgba(30,15,5,.2)'
    ctx.beginPath(); ctx.ellipse(0, 6, horizontal ? 13 : 10, horizontal ? 6 : 7, 0, 0, TAU); ctx.fill()
    ctx.fillStyle = C.chair
    rr(ctx, horizontal ? -13 : -10, horizontal ? -9 : -12, horizontal ? 26 : 20, horizontal ? 18 : 24, 5); ctx.fill()
    ctx.fillStyle = C.chairTop
    rr(ctx, horizontal ? -12 : -9, horizontal ? -8 : -11, horizontal ? 24 : 18, horizontal ? 15 : 21, 4); ctx.fill()
    // backrest outward
    ctx.fillStyle = '#4e301a'
    if (horizontal) {
      const side = dx > 0 ? 1 : -1
      rr(ctx, side > 0 ? 10 : -14, -9, 4, 18, 2); ctx.fill()
    } else {
      const side = dy > 0 ? 1 : -1
      rr(ctx, -10, side > 0 ? 9 : -13, 20, 4, 2); ctx.fill()
    }
    ctx.restore()
  }

  drawLockedTable(t) {
    const ctx = this.ctx
    const next = this.game.nextTableSlot()
    const isNext = t.slot === next
    ctx.save()
    ctx.setLineDash([5, 6])
    ctx.strokeStyle = isNext ? 'rgba(242,181,68,.65)' : 'rgba(255,240,210,.22)'
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(t.x, t.y, 33, 0, TAU); ctx.stroke()
    ctx.restore()
    emoji(ctx, '🔒', t.x, t.y - 3, isNext ? 17 : 13)
    if (isNext) {
      const cost = this.game.nextTableCost()
      ctx.fillStyle = 'rgba(25,16,10,.78)'; rr(ctx, t.x - 34, t.y + 30, 68, 18, 9); ctx.fill()
      ctx.strokeStyle = 'rgba(242,181,68,.5)'; ctx.lineWidth = 1; rr(ctx, t.x - 34, t.y + 30, 68, 18, 9); ctx.stroke()
      ctx.fillStyle = C.gold; ctx.font = 'bold 10px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(fmtMoney(cost), t.x, t.y + 39)
    }
  }

  /* -------------------------------------------------------------- people */
  drawPerson(x, y, o = {}) {
    const ctx = this.ctx
    const scale = o.seated ? 0.96 : 1
    const bob = o.seated ? 0 : Math.sin(this.time * (o.moving ? 9 : 2.2) + (o.phase || 0)) * (o.moving ? 1.5 : 0.6)
    const shirt = o.shirt || '#e2703a'
    const skin = o.skin || '#f2c9a4'
    const hair = o.hair || '#2b1d16'
    const role = o.role
    ctx.save()
    ctx.translate(x, y + bob)
    ctx.scale(scale, scale)
    // shadow
    ctx.fillStyle = 'rgba(30,15,5,.22)'
    ctx.beginPath(); ctx.ellipse(0, 2, o.seated ? 12 : 11, o.seated ? 4 : 5, 0, 0, TAU); ctx.fill()

    if (o.seated) {
      // compact seated body: head toward table, body outward
      ctx.fillStyle = shirt
      rr(ctx, -9, -9, 18, 25, 7); ctx.fill()
      // arms
      ctx.fillStyle = skin
      ctx.beginPath(); ctx.arc(-10, 0, 3.4, 0, TAU); ctx.fill()
      ctx.beginPath(); ctx.arc(10, 0, 3.4, 0, TAU); ctx.fill()
      // role outfit
      if (role === 'waiter') { ctx.fillStyle = '#2f2a2a'; rr(ctx, -8, -8, 16, 20, 5); ctx.fill(); ctx.fillStyle = '#f3e9d8'; ctx.fillRect(-4, -8, 8, 5) }
      if (role === 'cleaner') { ctx.fillStyle = '#5b7fa6'; rr(ctx, -8, -8, 16, 20, 5); ctx.fill() }
      // head
      ctx.fillStyle = skin
      ctx.beginPath(); ctx.arc(0, -19, 8.4, 0, TAU); ctx.fill()
      // hair
      ctx.fillStyle = hair
      ctx.beginPath(); ctx.arc(0, -21, 8.7, Math.PI * 1.02, TAU * 0.99); ctx.fill()
      ctx.fillStyle = hair
      ctx.beginPath(); ctx.ellipse(-7.6, -19, 2.4, 5.5, 0, 0, TAU); ctx.fill()
      ctx.beginPath(); ctx.ellipse(7.6, -19, 2.4, 5.5, 0, 0, TAU); ctx.fill()
      // face
      ctx.fillStyle = '#3b2a1e'
      ctx.beginPath(); ctx.arc(-2.8, -19, 1.1, 0, TAU); ctx.fill()
      ctx.beginPath(); ctx.arc(2.8, -19, 1.1, 0, TAU); ctx.fill()
      ctx.strokeStyle = 'rgba(80,40,25,.7)'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.arc(0, -15.4, 2.4, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke()
      // hats / accessories
      if (role === 'cook') {
        ctx.fillStyle = '#fdf8ee'; rr(ctx, -8, -33, 16, 8, 4); ctx.fill()
        ctx.beginPath(); ctx.arc(0, -33, 8, Math.PI, TAU); ctx.fill()
      }
      if (role === 'waiter') {
        ctx.fillStyle = '#c74b3c'; rr(ctx, -3.5, -10, 7, 4, 2); ctx.fill()
      }
      if (role === 'cleaner') {
        ctx.fillStyle = '#e6b84f'; rr(ctx, -8.5, -27, 17, 4, 2); ctx.fill()
      }
    } else {
      // legs
      const legPhase = Math.sin(this.time * 10 + (o.phase || 0))
      ctx.fillStyle = '#3c2b20'
      rr(ctx, -6, -15 + (o.moving ? Math.max(0, legPhase) * 2 : 0), 5, 16, 2.5); ctx.fill()
      rr(ctx, 1, -15 + (o.moving ? Math.max(0, -legPhase) * 2 : 0), 5, 16, 2.5); ctx.fill()
      // body
      ctx.fillStyle = shirt
      rr(ctx, -10, -37, 20, 26, 7); ctx.fill()
      // role outfit overlays
      if (role === 'cook') {
        ctx.fillStyle = '#f7f1e4'; rr(ctx, -9, -36, 18, 24, 6); ctx.fill()
        ctx.fillStyle = '#c74b3c'; ctx.fillRect(-2, -36, 4, 12)
        ctx.fillStyle = '#d9d1c1'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, -31 + i * 6, 1.1, 0, TAU); ctx.fill() }
      } else if (role === 'waiter') {
        ctx.fillStyle = '#f5ecdc'; rr(ctx, -9, -36, 18, 23, 6); ctx.fill()
        ctx.fillStyle = '#2f2a2a'; rr(ctx, -9, -26, 18, 14, 5); ctx.fill()
        ctx.fillStyle = '#c74b3c'; rr(ctx, -3, -36, 6, 4, 1.5); ctx.fill()
        ctx.fillStyle = '#2f2a2a'; ctx.fillRect(-6, -25, 12, 2)
      } else if (role === 'cleaner') {
        ctx.fillStyle = '#5b7fa6'; rr(ctx, -9, -35, 18, 23, 6); ctx.fill()
        ctx.fillStyle = '#3f5d7d'; ctx.fillRect(-8, -22, 16, 3)
      }
      // arms
      ctx.fillStyle = skin
      ctx.beginPath(); ctx.arc(-10, -28, 3.2, 0, TAU); ctx.fill()
      ctx.beginPath(); ctx.arc(10, -28, 3.2, 0, TAU); ctx.fill()
      // head
      ctx.fillStyle = skin
      ctx.beginPath(); ctx.arc(0, -47, 8.6, 0, TAU); ctx.fill()
      // hair
      ctx.fillStyle = hair
      ctx.beginPath(); ctx.arc(0, -49, 8.9, Math.PI * 1.02, TAU * 0.99); ctx.fill()
      ctx.beginPath(); ctx.ellipse(-7.8, -47, 2.3, 5.6, 0, 0, TAU); ctx.fill()
      ctx.beginPath(); ctx.ellipse(7.8, -47, 2.3, 5.6, 0, 0, TAU); ctx.fill()
      // face
      ctx.fillStyle = '#3b2a1e'
      ctx.beginPath(); ctx.arc(-2.8, -47, 1.1, 0, TAU); ctx.fill()
      ctx.beginPath(); ctx.arc(2.8, -47, 1.1, 0, TAU); ctx.fill()
      ctx.strokeStyle = 'rgba(80,40,25,.7)'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.arc(0, -43.4, 2.4, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke()
      // hats
      if (role === 'cook') {
        ctx.fillStyle = '#fdf8ee'; rr(ctx, -8.5, -62, 17, 7, 3); ctx.fill()
        ctx.beginPath(); ctx.arc(-5, -62, 4.5, Math.PI, TAU); ctx.fill()
        ctx.beginPath(); ctx.arc(0, -63, 5, Math.PI, TAU); ctx.fill()
        ctx.beginPath(); ctx.arc(5, -62, 4.5, Math.PI, TAU); ctx.fill()
        ctx.fillStyle = '#c74b3c'; ctx.fillRect(-8, -54, 16, 2.5)
      } else if (role === 'cleaner') {
        ctx.fillStyle = '#e6b84f'; rr(ctx, -8.5, -58, 17, 5, 2.5); ctx.fill()
        ctx.fillStyle = '#e6b84f'; rr(ctx, 4, -55, 10, 3, 1.5); ctx.fill()
      }
    }
    // held plate
    if (o.holding) {
      ctx.fillStyle = 'rgba(20,10,5,.2)'; ctx.beginPath(); ctx.ellipse(13, -23, 8, 3, 0, 0, TAU); ctx.fill()
      ctx.fillStyle = '#fbf4e8'; ctx.beginPath(); ctx.arc(13, -26, 8, 0, TAU); ctx.fill()
      ctx.strokeStyle = '#e2d2ba'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(13, -26, 8, 0, TAU); ctx.stroke()
      emoji(ctx, o.holding, 13, -25.5, 10)
    }
    // critic aura
    if (o.isCritic) {
      ctx.strokeStyle = 'rgba(242,181,68,.8)'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.ellipse(0, 1, 16, 7, 0, 0, TAU); ctx.stroke()
      emoji(ctx, '⭐', 0, o.seated ? -34 : -65, 12)
    }
    ctx.restore()
  }

  /* -------------------------------------------------------------- customers */
  drawWalkingCustomers() {
    const s = this.game.state
    for (const c of s.customers) {
      if (['entering', 'queued', 'toTable', 'leaving'].includes(c.state)) {
        this.drawPerson(c.x, c.y, {
          shirt: c.shirt, skin: c.skin, hair: c.hair, moving: c.state !== 'queued',
          phase: c.bob, isCritic: c.isCritic, mood: c.state === 'leaving' ? 'angry' : 'idle'
        })
      }
    }
  }

  drawBubbles() {
    const ctx = this.ctx
    const s = this.game.state
    for (const c of s.customers) {
      if (c.state === 'queued') {
        const t = s.tables.find(x => x.id === c.tableId)
        this.drawPatience(c)
        this.drawBubble(c.x, c.y - 66, '⏳', 1)
        continue
      }
      if (!['deciding', 'awaiting', 'waitingFood', 'eating', 'leaving'].includes(c.state)) continue
      let text = ''
      if (c.state === 'deciding' || c.state === 'awaiting') text = '📖'
      else if (c.state === 'waitingFood') text = dishById(c.dishId)?.emoji || '🍽️'
      else if (c.state === 'eating') text = c.sat > 65 ? '😋' : '😐'
      else if (c.state === 'leaving') text = c.paid ? (c.sat >= 76 ? '😋' : '😐') : '😠'
      if (!text) continue
      let bx, by
      if (c.tableId && c.state !== 'leaving') {
        const t = this.tableById(c.tableId)
        if (!t) continue
        const p = this.seatPos(t, c.seatStart)
        bx = p.x; by = p.y - 46
      } else {
        bx = c.x; by = c.y - 66
      }
      this.drawBubble(bx, by, text, 1)
      if (c.isCritic && c.state !== 'leaving') emoji(ctx, '⭐', bx + 20, by - 2, 12)
      if (c.sat < 30 && c.state !== 'leaving') emoji(ctx, '💢', bx + 18, by + 4, 11)
    }
  }

  tableById(id) { return this.game.state.tables.find(t => t.id === id) }

  drawPatience(c) {
    const ctx = this.ctx
    const total = Math.max(1, 18 + this.game.patienceBonus())
    const pct = Math.max(0, Math.min(1, c.patience / total))
    ctx.save()
    ctx.lineWidth = 3
    ctx.strokeStyle = 'rgba(20,10,5,.45)'
    ctx.beginPath(); ctx.arc(c.x, c.y - 60, 12, 0, TAU); ctx.stroke()
    ctx.strokeStyle = pct > 0.5 ? '#8fd07a' : pct > 0.25 ? '#f2b544' : '#e0604f'
    ctx.beginPath(); ctx.arc(c.x, c.y - 60, 12, -Math.PI / 2, -Math.PI / 2 + TAU * pct); ctx.stroke()
    ctx.restore()
  }

  drawBubble(x, y, text, scale = 1) {
    const ctx = this.ctx
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(scale, scale)
    ctx.fillStyle = 'rgba(20,10,5,.18)'
    rr(ctx, -15, -12, 30, 25, 8); ctx.fill()
    ctx.fillStyle = '#fffaf0'
    rr(ctx, -15, -14, 30, 25, 8); ctx.fill()
    ctx.beginPath(); ctx.moveTo(-4, 10); ctx.lineTo(2, 17); ctx.lineTo(6, 10); ctx.closePath(); ctx.fill()
    ctx.strokeStyle = 'rgba(120,80,50,.18)'; ctx.lineWidth = 1
    rr(ctx, -15, -14, 30, 25, 8); ctx.stroke()
    emoji(ctx, text, 0, -1, 14)
    ctx.restore()
  }

  /* -------------------------------------------------------------- staff */
  drawStaff() {
    const s = this.game.state
    for (const st of s.staff) {
      const holding = st.carrying ? dishById(st.carrying.dishId)?.emoji || '🍽️' : null
      this.drawPerson(st.x, st.y, {
        role: st.role, shirt: st.role === 'waiter' ? '#f5ecdc' : st.role === 'cook' ? '#f7f1e4' : '#5b7fa6',
        skin: '#e8b98d', hair: '#3b2718', moving: st.state === 'walking', phase: st.bob, holding
      })
      if (st.state === 'working') {
        const icon = st.task?.type === 'cook' ? '🔥' : st.task?.type === 'clean' || st.task?.type === 'sweep' ? '✨' : '⏳'
        this.ctx.globalAlpha = 0.85
        emoji(this.ctx, icon, st.x + 15, st.y - 58, 11)
        this.ctx.globalAlpha = 1
      }
    }
  }

  /* -------------------------------------------------------------- particles */
  updateParticles(dt) {
    const s = this.game.state
    this.steamT += dt
    if (this.steamT > 0.16) {
      this.steamT = 0
      const cooking = s.staff.filter(x => x.role === 'cook' && x.task?.type === 'cook' && x.state === 'working')
      for (const c of cooking) {
        const stove = STOVES[c.station] || STOVES[0]
        this.parts.push({ x: stove.x + rand(8, -8), y: stove.y - 30, vx: rand(8, -8), vy: -22, life: 1.3, max: 1.3, type: 'steam', size: rand(7, 4), color: '#fff' })
      }
      for (const t of s.tables) {
        if (t.order?.state === 'ready') {
          const slot = PASS_SLOTS[clamp(t.order.readySlot, 0, PASS_SLOTS.length - 1)]
          if (Math.random() < 0.4) this.parts.push({ x: slot.x + rand(6, -6), y: slot.y - 10, vx: rand(5, -5), vy: -14, life: 1, max: 1, type: 'steam', size: rand(5, 3), color: '#fff' })
        }
      }
    }
    for (const p of this.parts) {
      p.life -= dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      if (p.type === 'steam') p.size += dt * 7
      if (p.type === 'note') p.vy -= dt * 2
    }
    this.parts = this.parts.filter(p => p.life > 0)
  }

  drawParticles() {
    const ctx = this.ctx
    for (const p of this.parts) {
      const a = Math.max(0, p.life / p.max)
      ctx.globalAlpha = a * (p.type === 'steam' ? 0.35 : 0.85)
      if (p.type === 'steam') {
        ctx.fillStyle = p.color
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, TAU); ctx.fill()
      } else if (p.type === 'note') {
        ctx.fillStyle = p.color; ctx.font = `${p.size}px serif`; ctx.textAlign = 'center'
        ctx.fillText(p.text, p.x, p.y)
      } else {
        ctx.fillStyle = p.color
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, TAU); ctx.fill()
      }
    }
    ctx.globalAlpha = 1
  }

  drawFx(dt) {
    const ctx = this.ctx
    const list = this.game.fx
    for (const f of list) {
      f.life -= dt
      f.x += (f.vx || 0) * dt
      f.y += (f.vy || 0) * dt
      const a = Math.max(0, f.life / f.max)
      ctx.globalAlpha = Math.min(1, a * 1.6)
      if (f.kind === 'text') {
        ctx.font = 'bold 17px "Trebuchet MS", sans-serif'
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(35,20,10,.75)'
        ctx.strokeText(f.text, f.x, f.y)
        ctx.fillStyle = f.color
        ctx.fillText(f.text, f.x, f.y)
      } else if (f.kind === 'coin') {
        ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(f.x, f.y, 7, 0, TAU); ctx.fill()
        ctx.strokeStyle = '#b9862f'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(f.x, f.y, 7, 0, TAU); ctx.stroke()
        ctx.fillStyle = '#8a5f1c'; ctx.font = 'bold 9px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText('$', f.x, f.y + 0.5)
      } else if (f.kind === 'sparkle') {
        this.star(f.x, f.y, 4, f.color)
      } else if (f.kind === 'steam') {
        ctx.fillStyle = 'rgba(255,255,255,.6)'
        ctx.beginPath(); ctx.arc(f.x, f.y, 5, 0, TAU); ctx.fill()
      }
    }
    ctx.globalAlpha = 1
    this.game.fx = list.filter(f => f.life > 0)
  }

  star(x, y, r, color) {
    const ctx = this.ctx
    ctx.fillStyle = color
    ctx.beginPath()
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU - Math.PI / 2
      const rad = i % 2 === 0 ? r : r * 0.38
      if (i === 0) ctx.moveTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad)
      else ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad)
    }
    ctx.closePath(); ctx.fill()
  }

  /* -------------------------------------------------------------- lighting */
  drawLighting() {
    const ctx = this.ctx
    const h = this.game.state.clock / 60
    let dark = 0
    if (h >= 17 && h < 19) dark = (h - 17) / 2 * 0.10
    else if (h >= 19 && h < 21) dark = 0.10 + (h - 19) / 2 * 0.11
    else if (h >= 21) dark = 0.21
    if (dark > 0.001) {
      ctx.fillStyle = `rgba(18,16,48,${dark})`
      ctx.fillRect(0, 0, V.W, V.H)
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      const lights = [[622, 130, 190], [776, 130, 200], [902, 130, 170], [250, 150, 150]]
      for (const [x, y, r] of lights) {
        const g = ctx.createRadialGradient(x, y, 0, x, y, r)
        g.addColorStop(0, `rgba(255,205,120,${0.20 + dark * 0.5})`)
        g.addColorStop(0.5, `rgba(255,180,90,${0.07 + dark * 0.2})`)
        g.addColorStop(1, 'rgba(255,170,80,0)')
        ctx.fillStyle = g
        ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill()
      }
      ctx.restore()
    }
    // warm ambient tint
    const warm = ctx.createRadialGradient(480, 330, 80, 480, 330, 560)
    warm.addColorStop(0, 'rgba(255,200,120,0.05)')
    warm.addColorStop(1, 'rgba(255,160,80,0)')
    ctx.fillStyle = warm; ctx.fillRect(0, 0, V.W, V.H)
  }

  drawVignette() {
    const ctx = this.ctx
    const g = ctx.createRadialGradient(480, 320, 240, 480, 320, 640)
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(1, 'rgba(20,10,5,.38)')
    ctx.fillStyle = g; ctx.fillRect(0, 0, V.W, V.H)
  }

  drawHover() {
    if (!this.hover) return
    const t = this.game.state.tables.find(x => x.id === this.hover.tableId)
    if (!t) return
    const ctx = this.ctx
    const pulse = 0.5 + 0.5 * Math.sin(this.time * 6)
    let color = 'rgba(255,240,210,.6)', label = ''
    if (!t.unlocked) {
      if (t.slot === this.game.nextTableSlot()) {
        color = `rgba(242,181,68,${0.5 + pulse * 0.4})`
        label = `Abrir mesa · ${fmtMoney(this.game.nextTableCost())}`
      }
    } else if (t.dirty) {
      color = `rgba(127,196,122,${0.5 + pulse * 0.4})`
      label = 'Limpar mesa · R$ 12'
    } else if (t.customerId) {
      color = 'rgba(255,240,210,.45)'
      label = 'Mesa ocupada'
    }
    ctx.save()
    ctx.strokeStyle = color; ctx.lineWidth = 2.5
    ctx.beginPath(); ctx.arc(t.x, t.y, 39 + pulse * 2, 0, TAU); ctx.stroke()
    ctx.restore()
    if (label) {
      ctx.font = 'bold 10px "Trebuchet MS", sans-serif'
      const w = ctx.measureText(label).width + 16
      ctx.fillStyle = 'rgba(25,16,10,.85)'; rr(ctx, t.x - w / 2, t.y - 70, w, 18, 9); ctx.fill()
      ctx.strokeStyle = 'rgba(255,240,210,.18)'; ctx.lineWidth = 1; rr(ctx, t.x - w / 2, t.y - 70, w, 18, 9); ctx.stroke()
      ctx.fillStyle = '#f8ecd9'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(label, t.x, t.y - 61)
    }
  }
}

function ctxShadow(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill()
}
function rand(a = 1, b = 0) { return b + Math.random() * (a - b) }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)) }
