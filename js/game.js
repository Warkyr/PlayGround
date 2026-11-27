import {
  V, TABLE_SLOTS, UNLOCK_ORDER, TABLE_COSTS, START_TABLES, STOVES, PASS_SLOTS, PASS_PICK,
  STAFF_HOMES, QUEUE_SPOTS, ENTRY, DOOR, MAX_QUEUE, LEVEL_XP, MAX_LEVEL, ROLES, DISHES,
  UPGRADES, EVENTS, OBJECTIVES, NAMES, SURNAMES, SHIRTS, SKINS, HAIRS,
  REVIEW_GOOD, REVIEW_OK, REVIEW_BAD, dishById, upgradeById
} from './data.js'

const SAVE_KEY = 'sabor-cia-save-v1'
export const rand = (a = 1, b = 0) => b + Math.random() * (a - b)
export const pick = arr => arr[Math.floor(Math.random() * arr.length)]
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)

export function emptyStats(money = 0) {
  return { revenue: 0, tips: 0, ingredients: 0, served: 0, lost: 0, satSum: 0, satCount: 0, startMoney: money }
}
export function wageFor(role, skill) {
  return Math.round(ROLES[role].wage * (0.75 + 0.17 * skill) / 5) * 5
}
export function xpProgress(level, xp) {
  if (level >= MAX_LEVEL) return 1
  const lo = LEVEL_XP[level - 1], hi = LEVEL_XP[level]
  return clamp((xp - lo) / (hi - lo), 0, 1)
}

export class Game {
  constructor() {
    this.state = null
    this.fx = []
    this.blocked = true
    this.nextId = 1
    this.objTimer = 0
    this.saveTimer = 0
    this.newGame(false, false)
    this.loadedFromSave = false
    if (this.hasSave() && this.load()) this.loadedFromSave = true
  }

  /* ------------------------------------------------------------------ setup */
  newGame(announce = true, persist = true) {
    this.nextId = 1
    const menu = {}
    for (const d of DISHES) menu[d.id] = { price: d.price, active: ['bruschetta', 'salada', 'carbonara', 'burger'].includes(d.id) }
    this.state = {
      money: 1100, day: 1, clock: V.OPEN, speed: 1, phase: 'playing', sound: true,
      level: 1, xp: 0, reputation: 3.0, totalServed: 0, totalEarned: 0, bestDayProfit: 0,
      tablesUnlocked: START_TABLES,
      dishesUnlocked: ['bruschetta', 'salada', 'carbonara', 'burger'],
      menu, upgrades: Object.fromEntries(UPGRADES.map(u => [u.id, 0])),
      dirt: 8, cleanCooldown: 0, stats: emptyStats(1100), reviews: [], feed: [],
      objectives: {}, candidates: [], event: null, criticSpawned: false, spawnAcc: 0,
      report: null, history: [], pending: null, tutorialDone: false,
      tables: this.buildTables(), staff: [], customers: [], queue: []
    }
    this.makeInitialStaff()
    this.state.candidates = this.generateCandidates(3)
    this.log('Bem-vindo ao Sabor & Cia! Abra o restaurante e faça a clientela feliz.', '🍽️', 'good')
    if (persist) this.save()
    if (announce) this.log('Novo jogo iniciado. Boa sorte, chef!', '🚀', 'good')
  }

  buildTables() {
    return TABLE_SLOTS.map((slot, i) => ({
      id: 't' + i, slot: i, x: slot.x, y: slot.y, cap: slot.cap,
      unlocked: UNLOCK_ORDER.slice(0, START_TABLES).includes(i),
      customerId: null, order: null, dirty: false
    }))
  }

  makeStaff(role, name, skill, x, y) {
    const home = pick(STAFF_HOMES[role])
    return {
      id: 's' + (this.nextId++), name, role, skill, wage: wageFor(role, skill),
      x: x ?? home.x, y: y ?? home.y, state: 'idle', task: null, target: null,
      timer: 0, carrying: null, station: -1, bob: rand(6), level: 1, xp: 0
    }
  }

  makeInitialStaff() {
    this.state.staff.push(this.makeStaff('cook', 'Rafa', 3))
    this.state.staff.push(this.makeStaff('waiter', 'Bia', 3))
  }

  generateCandidates(n = 3) {
    const roles = ['cook', 'waiter', 'waiter', 'cleaner']
    const out = []
    for (let i = 0; i < n; i++) {
      const role = pick(roles)
      const skill = clamp(Math.round(rand(5.4, 1.2)), 1, 5)
      const wage = wageFor(role, skill)
      out.push({
        id: 'c' + (this.nextId++), name: pick(NAMES) + ' ' + pick(SURNAMES),
        role, skill, wage, fee: wage * 2
      })
    }
    return out
  }

  /* ------------------------------------------------------------------ stats */
  charm() {
    const u = this.state.upgrades
    return u.decor * 7 + u.lighting * 5 + this.state.tablesUnlocked * 0.5
  }
  patienceBonus() {
    const u = this.state.upgrades
    return u.ac * 7 + this.charm() * 0.22 + (this.state.event?.patience || 0)
  }
  staffSpeed(s) {
    return (0.82 + s.skill * 0.075) * (1 + this.state.upgrades.training * 0.1)
  }
  staffCap() { return 3 + Math.floor((this.state.level - 1) / 2) }
  roleCount(role) { return this.state.staff.filter(s => s.role === role).length }
  wageTotal() { return this.state.staff.reduce((a, s) => a + s.wage, 0) }
  rent() { return 180 + this.state.tablesUnlocked * 25 }
  ingredientMult() { return this.state.event?.ingredient || 1 }
  activeDishes() {
    return DISHES.filter(d => this.state.dishesUnlocked.includes(d.id) && this.state.menu[d.id].active)
  }
  nextTableSlot() { return this.state.tablesUnlocked < 8 ? UNLOCK_ORDER[this.state.tablesUnlocked] : -1 }
  nextTableCost() { return this.state.tablesUnlocked < 8 ? TABLE_COSTS[this.state.tablesUnlocked - START_TABLES] : null }
  qualityFor(dishId, cook) {
    const d = dishById(dishId)
    let q = d.quality + this.state.upgrades.oven * 0.35 + this.state.upgrades.training * 0.04
    q += ((cook ? cook.skill : 2) - 2) * 0.12
    return clamp(q, 1, 5)
  }

  spawnRate() {
    const s = this.state
    const repFactor = 0.6 + s.reputation * 0.2
    const marketing = 1 + s.upgrades.flyers * 0.08 + s.upgrades.social * 0.12
    const h = s.clock / 60
    let tod = 0.8
    if (h >= 12 && h < 14.5) tod = 1.55
    else if (h >= 18 && h < 21.5) tod = 1.7
    else if (h >= 11 && h < 12) tod = 0.9
    else if (h >= 14.5 && h < 17) tod = 0.65
    else if (h >= 21.5) tod = 0.72
    const weekend = [0, 6].includes((s.day - 1) % 7) ? 1.12 : 1
    return 0.062 * repFactor * marketing * tod * weekend * (s.event?.flow || 1)
  }

  log(text, icon = '✨', tone = '') {
    const s = this.state
    s.feed.unshift({ id: this.nextId++, text, icon, tone, day: s.day, clock: s.clock })
    if (s.feed.length > 10) s.feed.length = 10
  }

  addFx(kind, x, y, text = '', color = '#fff', life = 1.6) {
    this.fx.push({ kind, x, y, text, color, life, max: life, vx: rand(18, -18), vy: kind === 'text' ? -32 : rand(-10, -28), size: kind === 'text' ? 17 : 12 })
  }

  /* ------------------------------------------------------------------ day */
  startDay(event = null) {
    const s = this.state
    s.clock = V.OPEN
    s.spawnAcc = 0
    s.criticSpawned = false
    s.cleanCooldown = 0
    s.stats = emptyStats(s.money)
    s.customers = []
    s.queue = []
    for (const t of s.tables) { t.customerId = null; t.order = null; t.dirty = false }
    for (const st of s.staff) {
      const home = pick(STAFF_HOMES[st.role])
      st.x = home.x; st.y = home.y; st.state = 'idle'; st.task = null; st.target = null
      st.timer = 0; st.carrying = null; st.station = -1
    }
    s.event = event
    s.pending = null
    s.phase = 'playing'
    s.dirt = clamp(s.dirt - 12, 0, 100)
    this.save()
  }

  pickEvent() {
    const last = this.state.event?.id
    const pool = EVENTS.filter(e => e.id !== last && !(e.id === 'inspection' && this.state.day < 3))
    return pick(pool)
  }

  nextDay() {
    const s = this.state
    if (s.phase !== 'report') return
    if (s.money < -600) {
      s.phase = 'gameover'
      s.pending = { type: 'gameover' }
      return
    }
    s.day++
    s.candidates = this.generateCandidates(3)
    const ev = Math.random() < 0.62 ? this.pickEvent() : null
    this.startDay(ev)
    if (ev) s.pending = { type: 'event', event: ev }
    this.log(`Dia ${s.day} começou. ${ev ? ev.title + '!' : 'Boa sorte no serviço!'}`, ev ? ev.emoji : '☀️', ev?.tone || '')
  }

  endDay() {
    const s = this.state
    if (s.phase !== 'playing') return
    for (const c of [...s.customers]) {
      if (c.state === 'eating') this.finishMeal(c, true)
      else if (c.state === 'queued' || c.state === 'entering') s.stats.lost++
    }
    s.customers = []
    s.queue = []
    for (const t of s.tables) { t.customerId = null; t.order = null; t.dirty = false }
    s.clock = V.CLOSE
    const wages = this.wageTotal()
    const rent = this.rent()
    let fine = 0, bonus = 0
    const notes = []
    const ev = s.event
    if (ev?.inspection) {
      if (s.dirt > 45) {
        fine = 300
        s.reputation = clamp(s.reputation - 0.25, 1, 5)
        notes.push('A fiscalização encontrou o salão sujo: multa de R$ 300.')
        this.log('Vigilância sanitária aplicou multa de R$ 300!', '📋', 'bad')
      } else {
        bonus = 120
        s.reputation = clamp(s.reputation + 0.08, 1, 5)
        notes.push('Salão aprovado na inspeção: bônus de R$ 120.')
        this.log('Inspeção aprovada! Bônus de R$ 120.', '📋', 'good')
      }
    }
    if (ev?.repEnd) {
      s.reputation = clamp(s.reputation + ev.repEnd, 1, 5)
      notes.push('O influenciador rendeu +0,12 de reputação.')
    }
    s.money -= wages + rent + fine
    s.money += bonus
    const st = s.stats
    const net = st.revenue + st.tips - st.ingredients - wages - rent - fine + bonus
    s.bestDayProfit = Math.max(s.bestDayProfit, net)
    s.report = {
      day: s.day, revenue: st.revenue, tips: st.tips, ingredients: st.ingredients,
      wages, rent, fine, bonus, net, served: st.served, lost: st.lost,
      avgSat: st.satCount ? st.satSum / st.satCount : 0,
      stars: s.reputation, event: ev ? { title: ev.title, emoji: ev.emoji } : null,
      notes, reviews: s.reviews.slice(0, 3)
    }
    s.history.push({ day: s.day, net, served: st.served, stars: s.reputation })
    if (s.history.length > 30) s.history.shift()
    s.phase = 'report'
    s.pending = { type: 'report' }
    this.checkObjectives()
    this.save()
  }

  /* ------------------------------------------------------------------ update */
  update(dtReal) {
    const s = this.state
    if (this.blocked || s.phase !== 'playing' || s.speed === 0) return
    let rem = Math.min(dtReal, 0.08) * V.MIN_PER_SEC * s.speed
    while (rem > 0.0001 && s.phase === 'playing') {
      const step = Math.min(rem, 0.22)
      this.simulate(step)
      rem -= step
    }
  }

  simulate(dt) {
    const s = this.state
    s.clock += dt
    if (s.cleanCooldown > 0) s.cleanCooldown = Math.max(0, s.cleanCooldown - dt)
    if (s.clock >= V.CLOSE) { this.endDay(); return }

    // critic arrival
    if (s.event?.critic && !s.criticSpawned && s.clock >= 19 * 60) {
      s.criticSpawned = true
      this.spawnCustomer({ critic: true })
      this.log('O crítico gastronômico acabou de entrar. Capriche!', '⭐', 'warn')
    }

    // spawn
    s.spawnAcc += this.spawnRate() * dt
    while (s.spawnAcc >= 1) {
      s.spawnAcc -= 1
      this.trySpawn()
    }

    // baseline dirt
    s.dirt = clamp(s.dirt + 0.012 * dt * (1 - this.state.upgrades.cleaning * 0.25), 0, 100)

    for (const c of [...s.customers]) this.updateCustomer(c, dt)
    s.customers = s.customers.filter(c => c.state !== 'gone')
    this.refreshQueue()
    this.trySeatQueue()
    for (const st of [...s.staff]) this.updateStaff(st, dt)

    this.objTimer += dt
    if (this.objTimer >= 0.6) { this.objTimer = 0; this.checkObjectives() }
    this.saveTimer += dt
    if (this.saveTimer > 15) { this.saveTimer = 0; this.save() }
  }

  trySpawn() {
    const s = this.state
    if (s.queue.length >= MAX_QUEUE + 2) {
      s.stats.lost++
      if (Math.random() < 0.18) this.log('A fila está lotada. Um cliente desistiu de entrar.', '🚶', 'bad')
      return
    }
    this.spawnCustomer()
  }

  spawnCustomer(opts = {}) {
    const s = this.state
    let party = 1
    if (!opts.critic) {
      const r = Math.random()
      party = r < 0.45 ? 1 : r < 0.8 ? 2 : 3
    }
    const c = {
      id: 'u' + (this.nextId++),
      name: pick(NAMES) + ' ' + pick(SURNAMES),
      party, x: DOOR.x + rand(8, -8), y: DOOR.y,
      state: 'entering', tableId: null, seatStart: 0,
      sat: clamp(78 + this.charm() * 0.45 + s.upgrades.music * 3 + rand(4, -4) + (opts.critic ? 6 : 0), 55, 100),
      patience: 0, timer: 0, dishId: null, bubble: '', waitMins: 0, foodWait: 0,
      shirt: pick(SHIRTS), skin: pick(SKINS), hair: pick(HAIRS), mood: '🙂',
      isCritic: !!opts.critic, paid: false, quality: 0, bill: 0, queueIdx: -1,
      bob: rand(6), target: { x: ENTRY.x + rand(10, -10), y: ENTRY.y }
    }
    c.patience = 24 + this.patienceBonus() + rand(4, -2)
    s.customers.push(c)
  }

  /* ------------------------------------------------------------------ customers */
  updateCustomer(c, dt) {
    const s = this.state
    if (c.state === 'entering' || c.state === 'toTable' || c.state === 'leaving') {
      const sp = c.state === 'leaving' ? 62 : 55
      if (this.moveTo(c, c.target.x, c.target.y, dt, sp)) {
        if (c.state === 'entering') {
          const table = this.findFreeTable(c.party)
          if (table) this.seatParty(c, table)
          else {
            c.state = 'queued'
            c.patience = 24 + this.patienceBonus() + rand(4, -2)
            c.bubble = '⏳'
            s.queue.push(c)
          }
        } else if (c.state === 'toTable') {
          const t = this.tableById(c.tableId)
          c.state = 'deciding'
          c.timer = 1.6 + Math.random() * 2.2
          c.bubble = '📖'
          if (t) { const p = this.seatPos(t, c.seatStart); c.x = p.x; c.y = p.y }
        } else {
          c.state = 'gone'
        }
      }
      return
    }
    if (c.state === 'queued') {
      c.patience -= dt
      c.sat -= dt * 0.12
      if (c.patience <= 0) { this.leaveAngry(c, 'fila'); return }
      return
    }
    const table = this.tableById(c.tableId)
    if (!table) { this.leaveAngry(c, 'mesa'); return }

    if (c.state === 'deciding') {
      c.timer -= dt
      c.sat -= dt * 0.1
      if (c.timer <= 0) this.placeOrder(c, table)
    } else if (c.state === 'awaiting') {
      c.sat -= dt * (0.2 + (s.dirt / 100) * 0.4)
      if (c.sat <= 12) this.leaveAngry(c, 'atendimento')
    } else if (c.state === 'waitingFood') {
      c.foodWait += dt
      c.sat -= dt * (0.4 + (s.dirt / 100) * 0.5)
      if (c.sat <= 12) this.leaveAngry(c, 'comida')
    } else if (c.state === 'eating') {
      c.timer -= dt
      if (c.timer <= 0) this.finishMeal(c)
    }
  }

  refreshQueue() {
    const s = this.state
    s.queue = s.queue.filter(c => c.state === 'queued' && s.customers.includes(c))
    s.queue.forEach((c, i) => {
      c.queueIdx = i
      const spot = QUEUE_SPOTS[Math.min(i, QUEUE_SPOTS.length - 1)]
      c.target.x = spot.x
      c.target.y = spot.y
      if (Math.hypot(c.x - spot.x, c.y - spot.y) > 2) this.moveTo(c, spot.x, spot.y, 0.05, 46)
      else { c.x = spot.x; c.y = spot.y }
    })
  }

  findFreeTable(party) {
    const free = this.state.tables.filter(t => t.unlocked && !t.customerId && !t.dirty && t.cap >= party)
    if (!free.length) return null
    free.sort((a, b) => a.cap - b.cap)
    return free[0]
  }

  seatParty(c, table) {
    table.customerId = c.id
    table.order = null
    c.tableId = table.id
    c.state = 'toTable'
    c.seatStart = Math.floor(Math.random() * table.cap)
    const p = this.seatPos(table, c.seatStart)
    c.target = { x: p.x, y: p.y }
    c.bubble = ''
  }

  seatPos(table, i) {
    const offs = table.cap === 2
      ? [[-46, 0], [46, 0]]
      : [[-46, 0], [46, 0], [0, -46], [0, 46]]
    const [dx, dy] = offs[((i % table.cap) + table.cap) % table.cap]
    return { x: table.x + dx, y: table.y + dy }
  }

  tableById(id) { return this.state.tables.find(t => t.id === id) }

  trySeatQueue() {
    const s = this.state
    if (!s.queue.length) return
    for (const c of [...s.queue]) {
      const table = this.findFreeTable(c.party)
      if (!table) break
      s.queue = s.queue.filter(q => q !== c)
      this.seatParty(c, table)
      c.patience = 0
    }
  }

  chooseDish() {
    const list = this.activeDishes()
    if (!list.length) return DISHES[0]
    const weights = list.map(d => {
      const p = this.state.menu[d.id].price
      return d.appeal * Math.pow(d.price / p, 1.6)
    })
    let total = weights.reduce((a, b) => a + b, 0)
    let r = Math.random() * total
    for (let i = 0; i < list.length; i++) {
      r -= weights[i]
      if (r <= 0) return list[i]
    }
    return list[list.length - 1]
  }

  placeOrder(c, table) {
    const dish = this.chooseDish()
    const menu = this.state.menu[dish.id]
    const qty = c.party
    table.order = {
      id: 'o' + (this.nextId++), tableId: table.id, customerId: c.id,
      dishId: dish.id, qty, price: menu.price, cost: dish.cost * qty,
      prepTime: dish.prep * (1 + 0.15 * (qty - 1)),
      state: 'awaiting', cookId: null, readySlot: -1, waiterId: null, delivererId: null
    }
    c.dishId = dish.id
    c.state = 'awaiting'
    c.bubble = '📖'
    c.waitMins = 0
  }

  finishMeal(c, force = false) {
    const s = this.state
    if (c.state !== 'eating' && !force) return
    const table = this.tableById(c.tableId)
    const d = dishById(c.dishId)
    if (d) {
      const ratio = this.state.menu[d.id].price / d.price
      if (ratio > 1.15) c.sat -= (ratio - 1.15) * 26
      else if (ratio < 0.9) c.sat += 4
    }
    c.sat = clamp(c.sat, 0, 100)
    const bill = c.bill || (d ? this.state.menu[d.id].price * c.party : 0)
    const tip = Math.round(bill * clamp((c.sat - 70) / 100, 0, 0.4) * 0.45)
    s.money += bill + tip
    s.totalEarned += bill + tip
    s.stats.revenue += bill
    s.stats.tips += tip
    s.stats.served++
    s.stats.satSum += c.sat
    s.stats.satCount++
    s.totalServed++
    c.paid = true
    const rating = c.sat >= 90 ? 5 : c.sat >= 76 ? 4 : c.sat >= 60 ? 3 : c.sat >= 40 ? 2 : 1
    this.applyRating(c, rating, bill, tip)
    if (table) {
      table.customerId = null
      table.order = null
      table.dirty = true
      s.dirt = clamp(s.dirt + 0.55 * c.party * (1 - s.upgrades.cleaning * 0.25), 0, 100)
      this.addFx('text', table.x, table.y - 40, `+${bill + tip}`, '#ffe08a', 1.9)
      this.addFx('coin', table.x, table.y - 20, '', '#ffd166', 1.1)
    }
    c.state = 'leaving'
    c.bubble = rating >= 4 ? '😋' : '😐'
    c.target = { x: DOOR.x, y: DOOR.y + 20 }
    this.addXp(5 + c.party * 2 + (rating === 5 ? 4 : 0))
    this.checkObjectives()
    this.maybeCriticOutcome(c)
    if (rating === 5 && Math.random() < 0.35) this.log(`${c.name} deu 5 estrelas: "${pick(REVIEW_GOOD).replace('{dish}', d?.name || 'o prato')}"`, '🌟', 'good')
  }

  applyRating(c, rating, bill, tip) {
    const s = this.state
    s.reputation = clamp(s.reputation + (rating - s.reputation) * 0.075, 1, 5)
    const d = dishById(c.dishId)
    let comment
    if (rating >= 5) comment = pick(REVIEW_GOOD).replace('{dish}', d?.name || 'prato')
    else if (rating >= 4) comment = pick(REVIEW_OK).replace('{dish}', d?.name || 'prato')
    else if (rating >= 3) comment = pick(REVIEW_OK).replace('{dish}', d?.name || 'prato')
    else comment = pick(REVIEW_BAD)
    if (s.dirt > 62 && rating <= 4) comment += ' O salão estava bem sujo.'
    if (c.foodWait > 24 && rating <= 3) comment = 'A comida demorou ' + Math.round(c.foodWait) + ' minutos para chegar. Inaceitável.'
    s.reviews.unshift({
      id: 'r' + (this.nextId++), name: c.name, rating, comment,
      dish: d?.name || '—', qty: c.party, day: s.day, clock: s.clock, sat: Math.round(c.sat), tip
    })
    if (s.reviews.length > 50) s.reviews.length = 50
  }

  leaveAngry(c, reason) {
    const s = this.state
    const wasSeated = !!c.tableId && ['deciding', 'awaiting', 'waitingFood', 'eating'].includes(c.state)
    const table = this.tableById(c.tableId)
    if (table && table.customerId === c.id) {
      table.customerId = null
      table.order = null
      if (c.state === 'eating') table.dirty = true
    }
    s.stats.lost++
    if (wasSeated || Math.random() < 0.5) {
      const rating = c.isCritic ? 1 : (Math.random() < 0.5 ? 1 : 2)
      s.reputation = clamp(s.reputation + (rating - s.reputation) * 0.06, 1, 5)
      s.reviews.unshift({
        id: 'r' + (this.nextId++), name: c.name, rating,
        comment: reason === 'fila' ? 'Desisti de esperar na fila. Fui embora.' : 'Demorou demais e fui embora sem ser atendido.',
        dish: '—', qty: c.party, day: s.day, clock: s.clock, sat: Math.round(c.sat), tip: 0
      })
      if (s.reviews.length > 50) s.reviews.length = 50
    }
    if (c.isCritic) {
      s.reputation = clamp(s.reputation - 0.35, 1, 5)
      this.log('O crítico foi embora irritado. A reputação sofreu.', '⭐', 'bad')
    }
    c.state = 'leaving'
    c.bubble = '😠'
    c.target = { x: DOOR.x + rand(8, -8), y: DOOR.y + 20 }
    if (table) this.addFx('text', table.x, table.y - 36, '😠', '#ff8a7a', 1.4)
    if (Math.random() < 0.25) this.log(`${c.name} foi embora sem ser atendido.`, '😠', 'bad')
  }

  maybeCriticOutcome(c) {
    if (!c.isCritic) return
    const s = this.state
    if (c.sat >= 85) {
      s.money += 450
      s.totalEarned += 450
      s.reputation = clamp(s.reputation + 0.45, 1, 5)
      this.log('O crítico amou! +R$ 450 e reputação em alta.', '⭐', 'good')
      this.addFx('text', 480, 300, 'CRÍTICO APROVOU!', '#ffd166', 3)
    } else {
      s.reputation = clamp(s.reputation - 0.35, 1, 5)
      this.log('O crítico saiu decepcionado. Reputação em queda.', '⭐', 'bad')
    }
  }

  moveTo(e, tx, ty, dt, speed) {
    const dx = tx - e.x, dy = ty - e.y
    const d = Math.hypot(dx, dy)
    const step = speed * dt
    if (d <= step || d < 1) { e.x = tx; e.y = ty; return true }
    e.x += (dx / d) * step
    e.y += (dy / d) * step
    e.bob += step * 0.18
    e.dir = dx < 0 ? -1 : 1
    return false
  }

  /* ------------------------------------------------------------------ staff */
  freeStaff(s) {
    s.task = null
    s.target = null
    s.timer = 0
    s.station = -1
    s.state = 'idle'
  }

  isClaimed(tableId, types) {
    return this.state.staff.some(st => st.task && st.task.tableId === tableId && types.includes(st.task.type))
  }

  assignTask(s) {
    const st = this.state
    if (s.role === 'cook') {
      const stations = 1 + st.upgrades.station
      const busy = st.staff.filter(x => x.task?.type === 'cook').length
      if (busy >= stations) return
      const used = st.staff.filter(x => x.task?.type === 'cook').map(x => x.station)
      let station = 0
      while (used.includes(station) && station < stations) station++
      if (station >= stations) return
      for (const t of st.tables) {
        const o = t.order
        if (o && o.state === 'queued' && !o.cookId) {
          o.cookId = s.id
          s.task = { type: 'cook', tableId: t.id, orderId: o.id, phase: 'go' }
          s.station = station
          s.state = 'walking'
          s.target = { x: STOVES[station].x, y: STOVES[station].y + 38 }
          return
        }
      }
      return
    }

    if (s.role === 'waiter') {
      for (const t of st.tables) {
        const o = t.order
        if (o && o.state === 'ready' && !o.delivererId && !this.isClaimed(t.id, ['deliver'])) {
          o.delivererId = s.id
          s.task = { type: 'deliver', tableId: t.id, orderId: o.id, phase: 'pickup' }
          s.state = 'walking'
          const slot = PASS_SLOTS[clamp(o.readySlot, 0, PASS_SLOTS.length - 1)]
          s.target = { x: slot.x, y: slot.y + 26 }
          return
        }
      }
      for (const t of st.tables) {
        const o = t.order
        if (o && o.state === 'awaiting' && !o.waiterId && !this.isClaimed(t.id, ['take'])) {
          o.waiterId = s.id
          s.task = { type: 'take', tableId: t.id, phase: 'go' }
          s.state = 'walking'
          s.target = this.tableApproach(t)
          return
        }
      }
      for (const t of st.tables) {
        if (t.unlocked && t.dirty && !this.isClaimed(t.id, ['clean'])) {
          s.task = { type: 'clean', tableId: t.id, phase: 'go' }
          s.state = 'walking'
          s.target = this.tableApproach(t)
          return
        }
      }
      return
    }

    if (s.role === 'cleaner') {
      for (const t of st.tables) {
        if (t.unlocked && t.dirty && !this.isClaimed(t.id, ['clean'])) {
          s.task = { type: 'clean', tableId: t.id, phase: 'go' }
          s.state = 'walking'
          s.target = this.tableApproach(t)
          return
        }
      }
      if (st.dirt > 10 && !st.staff.some(x => x.task?.type === 'sweep')) {
        s.task = { type: 'sweep', phase: 'go' }
        s.state = 'walking'
        s.target = { x: rand(880, 80), y: rand(540, 280) }
      }
    }
  }

  tableApproach(t) {
    return { x: t.x, y: t.y + (t.cap === 4 ? 62 : 52) }
  }

  updateStaff(s, dt) {
    if (s.state === 'walking') {
      const sp = ROLES[s.role].speed * this.staffSpeed(s)
      if (this.moveTo(s, s.target.x, s.target.y, dt, sp)) this.staffArrive(s)
    } else if (s.state === 'working') {
      s.timer -= dt
      if (s.timer <= 0) this.staffWorkDone(s)
    } else if (s.state === 'idle') {
      this.assignTask(s)
    }
  }

  staffArrive(s) {
    const st = this.state
    const task = s.task
    if (!task) { this.freeStaff(s); return }
    const table = this.tableById(task.tableId)
    if (task.type === 'cook') {
      const o = table?.order
      if (!o || o.id !== task.orderId || o.state !== 'queued') {
        if (o && o.cookId === s.id) o.cookId = null
        this.freeStaff(s); return
      }
      o.state = 'cooking'
      o.cookSkill = s.skill
      const amount = Math.round(o.cost * this.ingredientMult())
      st.money -= amount
      st.stats.ingredients += amount
      s.state = 'working'
      s.timer = o.prepTime * (1 - 0.15 * st.upgrades.knives) / this.staffSpeed(s)
      return
    }
    if (task.type === 'take') {
      const o = table?.order
      const c = st.customers.find(x => x.id === o?.customerId)
      if (o && o.state === 'awaiting' && c) {
        o.state = 'queued'
        o.waiterId = null
        c.state = 'waitingFood'
        c.waitMins = 0
        const d = dishById(o.dishId)
        c.bubble = d ? d.emoji : '🍽️'
        c.sat = clamp(c.sat + 2, 0, 100)
      } else if (o && o.waiterId === s.id) {
        o.waiterId = null
      }
      this.freeStaff(s)
      return
    }
    if (task.type === 'deliver') {
      if (task.phase === 'pickup') {
        const o = table?.order
        if (o && o.id === task.orderId && o.state === 'ready') {
          o.state = 'carried'
          s.carrying = o
          task.phase = 'serve'
          s.state = 'walking'
          s.target = this.tableApproach(table)
          return
        }
        if (o && o.delivererId === s.id) o.delivererId = null
        this.freeStaff(s)
        return
      }
      const o = s.carrying
      if (o) {
        const c = st.customers.find(x => x.id === o.customerId)
        if (c && table) {
          const quality = this.qualityFor(o.dishId, { skill: o.cookSkill ?? 2 })
          c.quality = quality
          c.sat = clamp(c.sat + (quality - 2.5) * 10, 0, 100)
          c.state = 'eating'
          c.timer = 8 + c.party * 4 + rand(5)
          c.bubble = dishById(o.dishId)?.emoji || '🍽️'
          c.bill = o.price * o.qty
          table.order = null
          this.addFx('sparkle', table.x, table.y - 10, '', '#ffe08a', 0.8)
        } else if (table && table.order && table.order.id === o.id) {
          table.order.state = 'ready'
          table.order.delivererId = null
        }
      }
      s.carrying = null
      this.freeStaff(s)
      return
    }
    if (task.type === 'clean') {
      if (!table || !table.dirty) { this.freeStaff(s); return }
      s.state = 'working'
      s.timer = 2.2 / this.staffSpeed(s)
      return
    }
    if (task.type === 'sweep') {
      s.state = 'working'
      s.timer = 3 / this.staffSpeed(s)
    }
  }

  staffWorkDone(s) {
    const st = this.state
    const task = s.task
    if (!task) { this.freeStaff(s); return }
    if (task.type === 'cook') {
      const table = this.tableById(task.tableId)
      const o = table?.order
      if (o && o.id === task.orderId && o.state === 'cooking') {
        o.state = 'ready'
        o.cookId = null
        o.cookSkill = s.skill
        const used = st.tables.filter(t => t.order && t.order.state === 'ready' && t.order.readySlot >= 0).map(t => t.order.readySlot)
        let slot = 0
        while (used.includes(slot) && slot < PASS_SLOTS.length) slot++
        o.readySlot = slot < PASS_SLOTS.length ? slot : 0
        this.addFx('steam', PASS_SLOTS[o.readySlot].x, PASS_SLOTS[o.readySlot].y - 4, '', '#fff', 1.4)
      }
      this.freeStaff(s)
      return
    }
    if (task.type === 'clean') {
      const table = this.tableById(task.tableId)
      if (table) { table.dirty = false; st.dirt = clamp(st.dirt - 4.5, 0, 100) }
      this.freeStaff(s)
      return
    }
    if (task.type === 'sweep') {
      st.dirt = clamp(st.dirt - 7, 0, 100)
      this.addFx('sparkle', s.x, s.y, '', '#cfe8ff', 0.7)
      this.freeStaff(s)
    }
  }

  /* ------------------------------------------------------------------ actions */
  buyTable() {
    const cost = this.nextTableCost()
    if (cost == null) return { ok: false, msg: 'Todas as mesas já estão abertas.' }
    if (this.state.money < cost) return { ok: false, msg: 'Dinheiro insuficiente para abrir a mesa.' }
    const slot = this.nextTableSlot()
    const t = this.state.tables.find(x => x.slot === slot)
    if (!t) return { ok: false, msg: 'Mesa indisponível.' }
    this.state.money -= cost
    t.unlocked = true
    this.state.tablesUnlocked++
    this.log(`Nova mesa aberta! (${this.state.tablesUnlocked}/8)`, '🪑', 'good')
    this.checkObjectives()
    this.save()
    return { ok: true, msg: 'Mesa aberta!' }
  }

  cleanTable(table, manual = false) {
    if (!table || !table.dirty) return { ok: false, msg: 'Esta mesa já está limpa.' }
    if (manual) {
      if (this.state.money < 12) return { ok: false, msg: 'Dinheiro insuficiente.' }
      this.state.money -= 12
      table.dirty = false
      this.state.dirt = clamp(this.state.dirt - 3, 0, 100)
      this.addFx('sparkle', table.x, table.y, '', '#cfe8ff', 0.7)
      return { ok: true, msg: 'Mesa limpa!' }
    }
    table.dirty = false
    return { ok: true }
  }

  cleanFloor() {
    const s = this.state
    if (s.cleanCooldown > 0) return { ok: false, msg: 'A equipe ainda está terminando a limpeza.' }
    if (s.money < 30) return { ok: false, msg: 'Dinheiro insuficiente.' }
    s.money -= 30
    s.dirt = clamp(s.dirt - 30, 0, 100)
    s.cleanCooldown = 90
    this.log('Salão limpo com reforço extra.', '🧽', 'good')
    this.addFx('sparkle', 480, 380, '', '#cfe8ff', 0.8)
    this.save()
    return { ok: true, msg: 'Salão limpo!' }
  }

  setPrice(dishId, delta) {
    const d = dishById(dishId)
    const m = this.state.menu[dishId]
    if (!d || !m) return { ok: false }
    const lo = Math.round(d.price * 0.6), hi = Math.round(d.price * 1.6)
    m.price = clamp(m.price + delta, lo, hi)
    this.save()
    return { ok: true }
  }

  toggleDish(dishId) {
    const m = this.state.menu[dishId]
    if (!m) return { ok: false }
    if (m.active && this.activeDishes().length <= 1) return { ok: false, msg: 'Mantenha pelo menos um prato ativo no cardápio.' }
    m.active = !m.active
    this.save()
    return { ok: true, msg: m.active ? 'Prato ativado.' : 'Prato pausado.' }
  }

  unlockDish(dishId) {
    const s = this.state
    const d = dishById(dishId)
    if (!d || s.dishesUnlocked.includes(dishId)) return { ok: false }
    if (s.level < d.level) return { ok: false, msg: `Chegue ao nível ${d.level} para desbloquear.` }
    if (s.money < d.unlock) return { ok: false, msg: 'Dinheiro insuficiente para a receita.' }
    s.money -= d.unlock
    s.dishesUnlocked.push(dishId)
    if (this.activeDishes().length < 5) s.menu[dishId].active = true
    this.log(`Nova receita no cardápio: ${d.name}!`, d.emoji, 'good')
    this.checkObjectives()
    this.save()
    return { ok: true, msg: `${d.name} desbloqueado!` }
  }

  buyUpgrade(id) {
    const s = this.state
    const u = upgradeById(id)
    if (!u) return { ok: false }
    const lvl = s.upgrades[id] || 0
    if (lvl >= u.max) return { ok: false, msg: 'Melhoria já está no máximo.' }
    const cost = u.costs[lvl]
    if (s.money < cost) return { ok: false, msg: 'Dinheiro insuficiente.' }
    s.money -= cost
    s.upgrades[id] = lvl + 1
    if (id === 'social') s.reputation = clamp(s.reputation + 0.05, 1, 5)
    this.log(`${u.name} melhorado para nível ${lvl + 1}.`, u.emoji, 'good')
    this.checkObjectives()
    this.save()
    return { ok: true, msg: `${u.name} nível ${lvl + 1}!` }
  }

  hire(candidateId) {
    const s = this.state
    const cand = s.candidates.find(c => c.id === candidateId)
    if (!cand) return { ok: false, msg: 'Candidato indisponível.' }
    if (s.staff.length >= this.staffCap()) return { ok: false, msg: `Limite de ${this.staffCap()} funcionários. Suba de nível para contratar mais.` }
    if (this.roleCount(cand.role) >= ROLES[cand.role].cap) return { ok: false, msg: `Limite de ${ROLES[cand.role].plural} atingido.` }
    if (s.money < cand.fee) return { ok: false, msg: 'Dinheiro insuficiente para a contratação.' }
    s.money -= cand.fee
    const st = this.makeStaff(cand.role, cand.name, cand.skill)
    s.staff.push(st)
    s.candidates = s.candidates.filter(c => c.id !== candidateId)
    this.log(`${cand.name} contratado(a) como ${ROLES[cand.role].name}.`, ROLES[cand.role].emoji, 'good')
    this.checkObjectives()
    this.save()
    return { ok: true, msg: `${cand.name} entrou para a equipe!` }
  }

  fire(staffId) {
    const s = this.state
    const st = s.staff.find(x => x.id === staffId)
    if (!st) return { ok: false }
    s.staff = s.staff.filter(x => x.id !== staffId)
    for (const t of s.tables) {
      const o = t.order
      if (!o) continue
      if (o.cookId === staffId) { o.state = 'queued'; o.cookId = null }
      if (o.delivererId === staffId) { o.state = 'ready'; o.delivererId = null; o.readySlot = o.readySlot >= 0 ? o.readySlot : 0 }
      if (o.waiterId === staffId && o.state === 'awaiting') o.waiterId = null
    }
    this.log(`${st.name} foi dispensado(a).`, '👋', 'warn')
    this.save()
    return { ok: true }
  }

  refreshCandidates() {
    const s = this.state
    if (s.money < 40) return { ok: false, msg: 'Dinheiro insuficiente (R$ 40).' }
    s.money -= 40
    s.candidates = this.generateCandidates(3)
    this.log('Novos candidatos chegaram para entrevista.', '📋', '')
    this.save()
    return { ok: true }
  }

  addXp(n) {
    const s = this.state
    s.xp += n
    while (s.level < MAX_LEVEL && s.xp >= LEVEL_XP[s.level]) {
      s.level++
      const bonus = 100 + s.level * 40
      s.money += bonus
      const dishes = DISHES.filter(d => d.level === s.level && !s.dishesUnlocked.includes(d.id))
      this.log(`Nível ${s.level} alcançado! Bônus de R$ ${bonus}.`, '🎖️', 'good')
      s.pending = { type: 'levelup', level: s.level, bonus, dishes: dishes.map(d => d.id) }
      this.addFx('text', 480, 240, `NÍVEL ${s.level}`, '#ffd166', 2.6)
    }
    if (s.xp > LEVEL_XP[MAX_LEVEL - 1]) s.xp = LEVEL_XP[MAX_LEVEL - 1]
  }

  objectiveProgress(o) {
    const s = this.state
    switch (o.type) {
      case 'served': return s.totalServed
      case 'rep': return s.reputation
      case 'tables': return s.tablesUnlocked
      case 'hireCleaner': return this.roleCount('cleaner') > 0 ? 1 : 0
      case 'dayProfit': return s.bestDayProfit
      case 'level': return s.level
      case 'earned': return s.totalEarned
      default: return 0
    }
  }

  checkObjectives() {
    const s = this.state
    for (const o of OBJECTIVES) {
      if (s.objectives[o.id]?.done) continue
      if (this.objectiveProgress(o) >= o.target) {
        s.objectives[o.id] = { done: true, day: s.day }
        s.money += o.reward
        this.log(`Meta concluída: ${o.title}! +R$ ${o.reward}`, o.icon, 'good')
        this.addXp(40)
        this.addFx('sparkle', 480, 200, '', '#ffd166', 1.2)
      }
    }
  }

  /* ------------------------------------------------------------------ save */
  serialize() {
    const s = this.state
    return {
      v: 1,
      money: s.money, day: s.day, clock: s.clock, level: s.level, xp: s.xp,
      reputation: s.reputation, totalServed: s.totalServed, totalEarned: s.totalEarned,
      bestDayProfit: s.bestDayProfit, tablesUnlocked: s.tablesUnlocked,
      dishesUnlocked: s.dishesUnlocked, menu: s.menu, upgrades: s.upgrades,
      dirt: s.dirt, cleanCooldown: s.cleanCooldown, objectives: s.objectives,
      candidates: s.candidates, sound: s.sound, stats: s.stats, reviews: s.reviews.slice(0, 50),
      feed: s.feed.slice(0, 10), event: s.event, criticSpawned: s.criticSpawned,
      spawnAcc: s.spawnAcc, report: s.report, history: s.history, phase: s.phase,
      nextId: this.nextId,
      tables: s.tables.map(t => ({ slot: t.slot, unlocked: t.unlocked, customerId: t.customerId, dirty: t.dirty, order: t.order ? { ...t.order } : null })),
      staff: s.staff.map(x => ({ id: x.id, name: x.name, role: x.role, skill: x.skill, wage: x.wage, x: x.x, y: x.y, level: x.level, xp: x.xp })),
      customers: s.customers.map(c => ({ ...c })),
      queue: s.queue.map(c => c.id)
    }
  }

  save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.serialize())) } catch { /* storage indisponível */ }
  }

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      if (!raw) return false
      const d = JSON.parse(raw)
      if (!d || d.v !== 1) return false
      const fresh = this.buildTables()
      const tables = fresh.map(t => {
        const sv = (d.tables || []).find(x => x.slot === t.slot)
        if (!sv) return t
        return { ...t, unlocked: !!sv.unlocked, dirty: !!sv.dirty, customerId: sv.customerId ?? null, order: sv.order ? { ...sv.order } : null }
      })
      const state = {
        ...this.state, ...d,
        tables, staff: [], customers: [], queue: [],
        speed: 1, pending: null, phase: d.phase === 'report' ? 'report' : d.phase === 'gameover' ? 'gameover' : 'playing'
      }
      state.staff = (d.staff || []).map(sv => ({
        ...sv, state: 'idle', task: null, target: null, timer: 0, carrying: null, station: -1, bob: rand(6)
      }))
      state.customers = (d.customers || []).map(c => ({ ...c }))
      state.queue = (d.queue || []).map(id => state.customers.find(c => c.id === id)).filter(Boolean)
      for (const t of state.tables) {
        if (!t.order) continue
        const c = state.customers.find(x => x.id === t.order.customerId)
        if (!c) { t.order = null; t.customerId = null; continue }
        if (t.order.state === 'cooking') { t.order.state = 'queued'; t.order.cookId = null }
        else if (t.order.state === 'carried') { t.order.state = 'ready'; t.order.delivererId = null }
        else if (t.order.state === 'served') t.order = null
      }
      for (const c of state.customers) {
        const t = state.tables.find(x => x.id === c.tableId)
        if (c.state === 'entering') c.target = { x: ENTRY.x, y: ENTRY.y }
        else if (c.state === 'leaving') c.target = { x: DOOR.x, y: DOOR.y + 20 }
        else if (c.state === 'toTable' && t) { const p = this.seatPos(t, c.seatStart); c.target = { x: p.x, y: p.y } }
        else if (['deciding', 'awaiting', 'waitingFood', 'eating'].includes(c.state) && (!t || t.customerId !== c.id)) {
          c.state = 'leaving'; c.target = { x: DOOR.x, y: DOOR.y + 20 }
        }
      }
      this.state = state
      this.nextId = Math.max(d.nextId || 1, 1)
      if (state.phase === 'report') state.pending = { type: 'report' }
      else if (state.phase === 'gameover') state.pending = { type: 'gameover' }
      this.fx = []
      return true
    } catch { return false }
  }

  hasSave() {
    try { return !!localStorage.getItem(SAVE_KEY) } catch { return false }
  }

  restart() {
    this.newGame()
    this.state.pending = null
    this.blocked = true
    this.save()
  }
}
