import {
  DISHES, UPGRADES, ROLES, OBJECTIVES, LEVEL_XP, MAX_LEVEL,
  fmtMoney, fmtStars, fmtClock, weekday, dishById, upgradeById
} from './data.js'
import { xpProgress } from './game.js'

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const stars = (n, max = 5) => {
  const full = Math.round(n)
  let out = ''
  for (let i = 0; i < max; i++) out += i < full ? '★' : '☆'
  return out
}
const starIcons = n => {
  let out = ''
  for (let i = 0; i < 5; i++) out += `<i class="${i < Math.round(n) ? 'on' : ''}">★</i>`
  return out
}

export class UI {
  constructor(game, renderer, audio) {
    this.game = game
    this.renderer = renderer
    this.audio = audio
    this.activeTab = 'menu'
    this.currentModal = null
    this.modalActions = {}
    this.lastFeedId = game.state.feed[0]?.id || 0
    this.lastMoney = game.state.money
    this.pauseSpeed = game.state.speed || 1
    this.headerT = 0
    this.tabT = 0
    this.toastCount = 0

    this.$ = id => document.getElementById(id)
    this.tabsEl = this.$('tabs')
    this.bodyEl = this.$('tab-body')
    this.root = this.$('modal-root')
    this.toastsEl = this.$('toasts')
    this.canvas = this.$('game')
    this.bind()
    this.renderTabs()
    this.renderTab(false)
    this.updateHeader(true)
    this.showIntro()
  }

  /* ---------------------------------------------------------------- events */
  bind() {
    this.tabsEl.addEventListener('click', e => {
      const btn = e.target.closest('[data-tab]')
      if (!btn) return
      this.activeTab = btn.dataset.tab
      this.audio.play('click')
      this.renderTabs()
      this.renderTab(false)
    })

    this.bodyEl.addEventListener('click', e => {
      const el = e.target.closest('[data-act]')
      if (!el) return
      this.handleAction(el.dataset.act, el.dataset.id, el)
    })

    this.$('btn-pause').addEventListener('click', () => { this.togglePause(); this.audio.play('click') })
    this.$('btn-sound').addEventListener('click', () => { this.toggleSound() })
    this.$('btn-help').addEventListener('click', () => { this.audio.play('click'); this.showHelp() })
    document.querySelectorAll('.speed-btn').forEach(b => b.addEventListener('click', () => {
      const sp = Number(b.dataset.speed)
      this.game.state.speed = sp
      this.pauseSpeed = sp
      this.audio.play('click')
      this.updateHeader(true)
    }))
    this.$('btn-clean').addEventListener('click', () => {
      const res = this.game.cleanFloor()
      this.feedback(res, '🧽')
      this.renderTab(true)
      this.updateHeader(true)
    })
    this.$('btn-newday').addEventListener('click', () => { this.nextDay() })

    this.canvas.addEventListener('pointermove', e => this.onCanvasMove(e))
    this.canvas.addEventListener('pointerleave', () => { this.renderer.hover = null; this.canvas.style.cursor = 'default' })
    this.canvas.addEventListener('click', e => this.onCanvasClick(e))

    window.addEventListener('keydown', e => {
      if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return
      if (this.currentModal) {
        if (e.key === 'Escape' && this.currentModal.closable) this.closeModal()
        return
      }
      if (e.key === ' ' || e.code === 'Space') { e.preventDefault(); this.togglePause(); this.audio.play('click') }
      else if (e.key === '1') { this.game.state.speed = 1; this.pauseSpeed = 1; this.updateHeader(true) }
      else if (e.key === '2') { this.game.state.speed = 2; this.pauseSpeed = 2; this.updateHeader(true) }
      else if (e.key === '4') { this.game.state.speed = 4; this.pauseSpeed = 4; this.updateHeader(true) }
      else if (e.key.toLowerCase() === 'h') this.showHelp()
    })

    this.root.addEventListener('click', e => {
      const actionEl = e.target.closest('[data-act]')
      if (actionEl && this.modalActions[actionEl.dataset.act]) {
        this.audio.play('click')
        this.modalActions[actionEl.dataset.act](actionEl)
        return
      }
      if (e.target.closest('[data-close]')) {
        if (this.currentModal?.closable) this.closeModal()
        return
      }
      if (e.target.classList.contains('modal-overlay') && this.currentModal?.closable) this.closeModal()
    })

    document.addEventListener('pointerdown', () => this.audio.init(), { once: true })
  }

  feedback(res, icon = '✨') {
    if (!res) return
    if (res.ok === false) {
      this.toast(res.msg || 'Não foi possível fazer isso.', 'bad', '⚠️')
      this.audio.play('error')
    } else {
      this.toast(res.msg || 'Feito!', 'good', icon)
      this.audio.play('cash')
    }
  }

  handleAction(act, id, el) {
    const g = this.game
    switch (act) {
      case 'price-': g.setPrice(id, -1); this.audio.play('click'); this.renderTab(true); break
      case 'price+': g.setPrice(id, 1); this.audio.play('click'); this.renderTab(true); break
      case 'toggle': this.feedback(g.toggleDish(id), '🍽️'); this.renderTab(true); break
      case 'unlock': this.feedback(g.unlockDish(id), dishById(id)?.emoji || '✨'); this.renderTab(true); break
      case 'buy-table': this.feedback(g.buyTable(), '🪑'); this.renderTab(true); break
      case 'buy-up': this.feedback(g.buyUpgrade(id), upgradeById(id)?.emoji || '⬆️'); this.renderTab(true); break
      case 'hire': this.feedback(g.hire(id), '🤝'); this.renderTab(true); break
      case 'refresh-cand': this.feedback(g.refreshCandidates(), '📋'); this.renderTab(true); break
      case 'fire': {
        const st = g.state.staff.find(s => s.id === id)
        if (!st) return
        this.openConfirm('Dispensar funcionário?', `${esc(st.name)} sairá da equipe imediatamente. Você pode contratar outra pessoa depois.`, () => {
          g.fire(id)
          this.toast(`${st.name} foi dispensado(a).`, 'warn', '👋')
          this.renderTab(true)
          this.updateHeader(true)
        }, { confirm: 'Dispensar', danger: true })
        break
      }
      case 'tab-goals': this.activeTab = 'goals'; this.renderTabs(); this.renderTab(false); break
      default: break
    }
  }

  /* ---------------------------------------------------------------- loop */
  tick(dt) {
    this.headerT += dt
    if (this.headerT > 0.1) { this.headerT = 0; this.updateHeader() }
    this.handlePending()
    this.checkFeed()
    this.tabT += dt
    if (this.tabT > 1.9 && !this.currentModal) { this.tabT = 0; this.renderTab(true) }
  }

  handlePending() {
    const p = this.game.state.pending
    if (!p || this.currentModal) return
    this.game.state.pending = null
    if (p.type === 'report') this.showReport()
    else if (p.type === 'levelup') this.showLevelUp(p)
    else if (p.type === 'event') this.showEvent(p.event)
    else if (p.type === 'gameover') this.showGameOver()
  }

  checkFeed() {
    const feed = this.game.state.feed
    if (!feed.length) return
    if (feed[0].id !== this.lastFeedId) {
      const items = []
      for (const f of feed) {
        if (f.id === this.lastFeedId) break
        items.push(f)
      }
      this.lastFeedId = feed[0].id
      items.slice(0, 2).reverse().forEach(f => this.toast(f.text, f.tone, f.icon))
      const f = feed[0]
      const tick = this.$('ticker')
      tick.innerHTML = `<span class="ticker-ico">${f.icon || '🍽️'}</span><span class="ticker-text">${esc(f.text)}</span>`
    }
  }

  clearToasts() {
    if (this.toastsEl) this.toastsEl.innerHTML = ''
  }

  toast(text, tone = '', icon = '') {
    const el = document.createElement('div')
    el.className = 'toast ' + tone
    const ico = icon || (tone === 'good' ? '✅' : tone === 'bad' ? '⚠️' : tone === 'warn' ? '✨' : '🍽️')
    const ti = document.createElement('span'); ti.className = 'ti'; ti.textContent = ico
    const tx = document.createElement('span'); tx.textContent = text
    el.append(ti, tx)
    this.toastsEl.appendChild(el)
    while (this.toastsEl.children.length > 3) this.toastsEl.firstChild.remove()
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320) }, 4000)
  }

  updateHeader(force = false) {
    const s = this.game.state
    const moneyEl = this.$('hud-money')
    const money = fmtMoney(s.money)
    if (moneyEl.textContent !== money) {
      moneyEl.textContent = money
      if (s.money !== this.lastMoney) {
        const box = this.$('stat-money')
        box.classList.remove('bump'); void box.offsetWidth; box.classList.add('bump')
      }
    }
    this.lastMoney = s.money
    this.$('hud-stars').textContent = fmtStars(s.reputation)
    this.$('hud-stars-icons').innerHTML = starIcons(s.reputation)
    this.$('hud-day').textContent = `Dia ${s.day} · ${weekday(s.day)}`
    this.$('hud-clock').textContent = fmtClock(s.clock)
    this.$('hud-level').textContent = s.level
    this.$('hud-xp').style.width = Math.round(xpProgress(s.level, s.xp) * 100) + '%'

    const pauseBtn = this.$('btn-pause')
    pauseBtn.textContent = s.speed === 0 ? '▶' : '⏸'
    pauseBtn.classList.toggle('active', s.speed === 0)
    pauseBtn.setAttribute('aria-label', s.speed === 0 ? 'Continuar' : 'Pausar')
    document.querySelectorAll('.speed-btn').forEach(b => b.classList.toggle('active', Number(b.dataset.speed) === s.speed))
    this.$('btn-sound').textContent = s.sound ? '🔊' : '🔇'

    const newDay = this.$('btn-newday')
    const showNewDay = s.phase === 'report'
    newDay.hidden = !showNewDay
    if (showNewDay) newDay.textContent = `▶ Abrir o dia ${s.day + 1}`

    const seated = s.customers.filter(c => ['deciding', 'awaiting', 'waitingFood', 'eating'].includes(c.state)).length
    const total = s.customers.filter(c => c.state !== 'leaving').length
    this.$('chip-customers').textContent = `👥 ${seated} na mesa · ${total} no salão`
    this.$('chip-queue').textContent = `⏳ ${s.queue.length} na fila`
    const dirt = this.$('chip-dirt')
    dirt.textContent = `🧽 Sujeira ${Math.round(s.dirt)}%`
    dirt.className = 'chip' + (s.dirt > 70 ? ' bad' : s.dirt > 45 ? ' warn' : '')
    this.$('chip-staff').textContent = `🧑‍🍳 ${s.staff.length}/${this.game.staffCap()} equipe`

    const clean = this.$('btn-clean')
    if (s.cleanCooldown > 0) {
      clean.disabled = true
      clean.innerHTML = `<span>🧹 Limpeza em andamento</span><b>${Math.ceil(s.cleanCooldown)} min</b>`
    } else {
      clean.disabled = s.money < 30
      clean.innerHTML = `<span>🧹 Limpar salão</span><b>R$ 30</b>`
    }

    const ribbon = this.$('event-ribbon')
    if (s.event) {
      ribbon.hidden = false
      this.$('event-emoji').textContent = s.event.emoji
      this.$('event-title').textContent = s.event.title
      this.$('event-desc').textContent = s.event.desc
    } else ribbon.hidden = true
  }

  togglePause() {
    const s = this.game.state
    if (s.speed === 0) s.speed = this.pauseSpeed || 1
    else { this.pauseSpeed = s.speed; s.speed = 0 }
    this.updateHeader(true)
  }

  toggleSound() {
    const s = this.game.state
    s.sound = !s.sound
    this.audio.setEnabled(s.sound)
    if (s.sound) this.audio.play('pop')
    this.updateHeader(true)
    this.toast(s.sound ? 'Som ligado.' : 'Som desligado.', '', s.sound ? '🔊' : '🔇')
  }

  /* ---------------------------------------------------------------- modal shell */
  openModal(html, opts = {}) {
    const closable = opts.closable !== false
    const closeBtn = closable ? '<button class="modal-close" data-close aria-label="Fechar">✕</button>' : ''
    this.root.innerHTML = `<div class="modal-overlay"><div class="modal ${opts.className || ''}" role="dialog" aria-modal="true">${closeBtn}${html}</div></div>`
    this.currentModal = { closable, onClose: opts.onClose }
    this.modalActions = opts.actions || {}
    this.game.blocked = true
    const focus = this.root.querySelector('[data-autofocus]')
    if (focus) setTimeout(() => focus.focus(), 30)
  }

  closeModal() {
    if (!this.currentModal) return
    const cb = this.currentModal.onClose
    this.currentModal = null
    this.modalActions = {}
    this.root.innerHTML = ''
    this.game.blocked = false
    this.updateHeader(true)
    this.renderTab(true)
    if (cb) cb()
  }

  openConfirm(title, text, onYes, opts = {}) {
    this.openModal(`
      <div class="modal-kicker">Atenção</div>
      <h2>${esc(title)}</h2>
      <p style="margin-top:8px">${text}</p>
      <div class="modal-actions">
        <button class="btn" data-act="no">Cancelar</button>
        <button class="btn ${opts.danger ? 'danger' : 'primary'}" data-act="yes" data-autofocus>${esc(opts.confirm || 'Confirmar')}</button>
      </div>`, {
      actions: {
        yes: () => { this.closeModal(); onYes() },
        no: () => this.closeModal()
      }
    })
  }

  /* ---------------------------------------------------------------- intro */
  showIntro() {
    const s = this.game.state
    const saved = this.game.loadedFromSave
    const primary = saved ? 'Continuar jogo' : 'Abrir o restaurante'
    const preview = ['pizza', 'carbonara', 'tiramisu'].map(id => {
      const d = dishById(id)
      return `<div class="preview-dish"><div class="pd-emoji">${d.emoji}</div><div><div class="pd-name">${d.name}</div><div class="pd-desc">${d.desc}</div></div><div class="pd-price">${fmtMoney(d.price)}</div></div>`
    }).join('')
    this.openModal(`
      <div class="intro-left">
        <div class="intro-logo">
          <div class="mark">🍽️</div>
          <div class="name">Sabor <em>&amp;</em> Cia<small>Tycoon de restaurante</small></div>
        </div>
        <div class="intro-title">Comande o <span>melhor</span><br>restaurante da cidade.</div>
        <p class="intro-copy">Contrate a equipe, monte o cardápio, ajuste os preços e cuide de cada detalhe. Clientes exigentes, críticos gastronômicos e noites de lotação esperam por você.</p>
        <div class="intro-features">
          <div class="feature"><span class="fi">🍽️</span><div><b>Cardápio vivo</b><span>10 receitas e preços estratégicos</span></div></div>
          <div class="feature"><span class="fi">👩‍🍳</span><div><b>Equipe própria</b><span>Cozinheiros, garçons e faxineiros</span></div></div>
          <div class="feature"><span class="fi">🏆</span><div><b>Reputação</b><span>Resenhas, estrelas e metas</span></div></div>
          <div class="feature"><span class="fi">🌙</span><div><b>Dias imprevisíveis</b><span>Eventos, críticos e inspeções</span></div></div>
        </div>
        <div class="intro-actions">
          <button class="btn primary" data-act="start" aria-label="${primary}" data-autofocus>▶ ${primary}</button>
          ${saved ? '<button class="btn" data-act="new">Novo jogo</button>' : ''}
        </div>
        ${saved ? `<div class="intro-save"><span>💾 Save encontrado: <b>Dia ${s.day}</b> · ${fmtMoney(s.money)} · ${fmtStars(s.reputation)}★</span><span>Continue de onde parou</span></div>` : ''}
        <div class="intro-foot">Funciona no computador e no celular · Salva automaticamente · Sem instalação</div>
      </div>
      <div class="intro-right">
        <span class="float-emoji a">🍕</span>
        <span class="float-emoji b">🍷</span>
        <div class="preview-card">
          <div class="pc-head"><span>Menu da casa</span><b>Sabor &amp; Cia</b></div>
          ${preview}
          <div class="preview-stars">★★★★★</div>
        </div>
        <div class="preview-card">
          <div class="pc-head"><span>Meta do chef</span><b>5 estrelas</b></div>
          <p class="preview-note" style="margin-top:6px">Sirva bem, mantenha o salão limpo e transforme o Sabor &amp; Cia no point favorito do bairro.</p>
        </div>
      </div>`, {
      className: 'intro',
      closable: false,
      actions: {
        start: () => {
          this.audio.init()
          this.audio.play('day')
          this.lastFeedId = this.game.state.feed[0]?.id || 0
          this.closeModal()
          this.game.blocked = false
          this.toast('Boa sorte, chef! O serviço começa agora.', 'good', '☀️')
          this.updateHeader(true)
          this.handlePending()
        },
        new: () => {
          this.game.restart()
          this.lastFeedId = this.game.state.feed[0]?.id || 0
          this.closeModal()
          this.game.blocked = false
          this.clearToasts()
          this.audio.play('day')
          this.toast('Novo restaurante aberto. Boa sorte!', 'good', '🚀')
          this.renderTab(false)
          this.updateHeader(true)
        }
      }
    })
  }

  /* ---------------------------------------------------------------- report */
  showReport() {
    const s = this.game.state
    const r = s.report
    if (!r) { this.game.blocked = false; return }
    const rows = [
      ['Receita dos pratos', r.revenue, 'g', '+'],
      ['Gorjetas', r.tips, 'g', '+'],
      ['Ingredientes', r.ingredients, 'r', '-'],
      ['Salários', r.wages, 'r', '-'],
      ['Aluguel', r.rent, 'r', '-']
    ]
    if (r.fine) rows.push(['Multa da inspeção', r.fine, 'r', '-'])
    if (r.bonus) rows.push(['Bônus da inspeção', r.bonus, 'g', '+'])
    const reviewHtml = (r.reviews || []).map(rv => `
      <div class="review-mini">
        <div class="rm-head"><b>${esc(rv.name)}</b><span>${'★'.repeat(rv.rating)}${'☆'.repeat(5 - rv.rating)} · ${fmtStars(rv.sat / 20)}</span></div>
        <p>${esc(rv.comment)}</p>
      </div>`).join('')
    const warning = s.money < 0 ? `<div class="report-note" style="border-left:3px solid var(--red)">Caixa negativo em ${fmtMoney(s.money)}. Cuidado: abaixo de -R$ 600 o restaurante fecha.</div>` : ''
    this.openModal(`
      <div class="modal-kicker">Fechamento · Dia ${r.day}</div>
      <h2>Fim do dia <span class="accent">${r.day}</span></h2>
      <p class="modal-sub">${r.event ? `${r.event.emoji} ${esc(r.event.title)}` : 'Um dia de serviço concluído.'}</p>
      <div class="report-hero">
        <div class="rh-emoji">${r.net >= 0 ? '📈' : '📉'}</div>
        <div class="report-net ${r.net < 0 ? 'neg' : ''}">${fmtMoney(r.net)}<small>lucro operacional</small></div>
        <div style="margin-left:auto;text-align:right">
          <div style="font-size:18px;color:var(--accent2);letter-spacing:1px">${'★'.repeat(Math.round(r.stars))}${'☆'.repeat(5 - Math.round(r.stars))}</div>
          <small style="font-size:9px;color:var(--muted2)">${fmtStars(r.stars)} de reputação</small>
        </div>
      </div>
      <div class="report-rows">
        ${rows.map(([label, val, tone, sign]) => `<div class="report-row"><span class="rr-dot ${tone}"></span><span>${label}</span><span class="rr-line"></span><b>${sign}${fmtMoney(Math.abs(val))}</b></div>`).join('')}
        <div class="report-row" style="margin-top:5px;padding-top:7px;border-top:1px solid var(--line)"><span class="rr-dot y"></span><span><b style="color:var(--cream)">Resultado do dia</b></span><span class="rr-line"></span><b style="color:${r.net >= 0 ? 'var(--green)' : 'var(--red)'}">${fmtMoney(r.net)}</b></div>
      </div>
      <div class="report-stats">
        <div class="stat-tile"><b>${r.served}</b><span>clientes</span></div>
        <div class="stat-tile"><b>${r.lost}</b><span>desistiram</span></div>
        <div class="stat-tile"><b>${r.avgSat ? Math.round(r.avgSat) + '%' : '—'}</b><span>satisfação</span></div>
        <div class="stat-tile"><b>${fmtMoney(s.money)}</b><span>caixa atual</span></div>
      </div>
      ${r.notes.map(n => `<div class="report-note">${esc(n)}</div>`).join('')}
      ${warning}
      ${reviewHtml ? `<div class="subhead" style="margin-top:12px"><h3>Últimas resenhas</h3></div>${reviewHtml}` : ''}
      <div class="modal-actions">
        <button class="btn primary" data-act="next-day" data-autofocus>▶ Abrir o dia ${r.day + 1}</button>
      </div>`, {
      className: 'wide',
      closable: false,
      actions: { 'next-day': () => this.nextDay() }
    })
    this.audio.play('day')
  }

  nextDay() {
    const g = this.game
    if (g.state.phase !== 'report') return
    g.nextDay()
    this.lastFeedId = g.state.feed[0]?.id || 0
    this.closeModal()
    if (g.state.phase === 'gameover') { this.handlePending(); return }
    this.audio.play('day')
    this.toast(`Dia ${g.state.day} começou. ${g.state.event ? g.state.event.title : 'Boa sorte!'}`, 'good', '☀️')
    this.renderTab(true)
    this.updateHeader(true)
    this.handlePending()
  }

  /* ---------------------------------------------------------------- level / event / gameover */
  showLevelUp(p) {
    const dishes = (p.dishes || []).map(id => {
      const d = dishById(id)
      if (!d) return ''
      return `<div class="unlock-row"><span class="ue">${d.emoji}</span><div><b>${d.name}</b><small>Disponível no cardápio por ${fmtMoney(d.unlock)}</small></div></div>`
    }).join('')
    this.openModal(`
      <div class="modal-kicker">Evolução</div>
      <div class="levelup-badge">🎖️</div>
      <h2 style="text-align:center">Nível <span class="accent">${p.level}</span></h2>
      <p style="text-align:center;margin-top:6px">Seu restaurante está crescendo! Bônus de <b style="color:var(--accent2)">${fmtMoney(p.bonus)}</b> e limite de equipe ampliado.</p>
      ${dishes ? `<div class="unlock-list"><div class="group-label">Novas receitas liberadas</div>${dishes}</div>` : ''}
      <div class="modal-actions"><button class="btn primary" data-act="ok" data-autofocus>Continuar</button></div>`, {
      actions: { ok: () => this.closeModal() }
    })
    this.audio.play('level')
  }

  showEvent(ev) {
    if (!ev) { this.game.blocked = false; return }
    const tags = []
    if (ev.flow && ev.flow !== 1) tags.push(`Fluxo ${ev.flow > 1 ? '+' : ''}${Math.round((ev.flow - 1) * 100)}%`)
    if (ev.patience) tags.push(`Paciência ${ev.patience > 0 ? '+' : ''}${ev.patience} min`)
    if (ev.ingredient) tags.push(`Ingredientes ${Math.round((ev.ingredient - 1) * 100)}% mais caros`)
    if (ev.critic) tags.push('Cliente especial às 19:00')
    if (ev.inspection) tags.push('Avaliação no fim do dia')
    if (ev.repEnd) tags.push(`Reputação +${ev.repEnd}`)
    this.openModal(`
      <div class="modal-kicker">Acontecimento do dia</div>
      <div class="event-modal-emoji">${ev.emoji}</div>
      <h2 style="text-align:center">${esc(ev.title)}</h2>
      <p style="text-align:center;margin-top:7px">${esc(ev.desc)}</p>
      <div class="event-tags">${tags.map(t => `<span>${esc(t)}</span>`).join('')}</div>
      <div class="modal-actions"><button class="btn primary" data-act="ok" data-autofocus>Estou pronto</button></div>`, {
      actions: { ok: () => this.closeModal() }
    })
    this.audio.play('bell')
  }

  showGameOver() {
    const s = this.game.state
    this.openModal(`
      <div class="modal-kicker">Fim da linha</div>
      <div class="gameover-emoji">💸</div>
      <h2 style="text-align:center">O restaurante <span class="accent">faliu</span></h2>
      <p style="text-align:center;margin-top:8px">As dívidas passaram do limite. Mas todo chef tem uma segunda chance — recomece com a experiência desta jornada.</p>
      <div class="report-stats" style="margin-top:16px">
        <div class="stat-tile"><b>${s.totalServed}</b><span>clientes servidos</span></div>
        <div class="stat-tile"><b>${fmtMoney(s.totalEarned)}</b><span>faturamento total</span></div>
        <div class="stat-tile"><b>${s.day}</b><span>dias no comando</span></div>
        <div class="stat-tile"><b>${fmtStars(s.reputation)}</b><span>estrelas</span></div>
      </div>
      <div class="modal-actions"><button class="btn primary" data-act="restart" data-autofocus>Recomeçar</button></div>`, {
      closable: false,
      actions: {
        restart: () => {
          this.game.restart()
          this.lastFeedId = this.game.state.feed[0]?.id || 0
          this.closeModal()
          this.game.blocked = false
          this.clearToasts()
          this.audio.play('day')
          this.toast('Um novo Sabor & Cia abre as portas!', 'good', '🚀')
          this.renderTab(false)
          this.updateHeader(true)
        }
      }
    })
    this.audio.play('error')
  }

  /* ---------------------------------------------------------------- help */
  showHelp() {
    this.openModal(`
      <div class="modal-kicker">Manual do chef</div>
      <h2>Como <span class="accent">jogar</span></h2>
      <div class="help-section">
        <h3>O objetivo</h3>
        <p>Transforme o Sabor &amp; Cia em um restaurante 5 estrelas. Cada dia vai das 11:00 às 23:00. Sirva clientes, ganhe dinheiro, suba de nível e cumpra as metas.</p>
      </div>
      <div class="help-section">
        <h3>O ciclo</h3>
        <ul>
          <li><b>Clientes</b> chegam, sentam, pedem, comem e pagam. Quem espera demais vai embora e deixa resenha ruim.</li>
          <li><b>Cozinheiros</b> preparam os pedidos. Cada estação permite um prato por vez.</li>
          <li><b>Garçons</b> anotam e entregam. Sem garçom, o pedido não anda.</li>
          <li><b>Faxineiros</b> limpam mesas e o salão. Sujeira alta derruba a satisfação.</li>
        </ul>
      </div>
      <div class="help-section">
        <h3>Dicas de ouro</h3>
        <ul>
          <li>Preço muito alto espanta clientes; muito baixo reduz o lucro. Fique perto do valor justo.</li>
          <li>Clique em uma mesa suja para limpá-la na hora (R$ 12).</li>
          <li>Mesas bloqueadas podem ser abertas clicando nelas no salão.</li>
          <li>Contrate um faxineiro antes de a sujeira passar de 45%.</li>
          <li>Use 2× e 4× para acelerar o serviço; pause quando precisar pensar.</li>
        </ul>
      </div>
      <div class="help-section">
        <h3>Atalhos</h3>
        <div class="help-keys">
          <div><kbd>Espaço</kbd> pausar / continuar</div>
          <div><kbd>1</kbd> <kbd>2</kbd> <kbd>4</kbd> velocidade</div>
          <div><kbd>H</kbd> ajuda</div>
          <div><kbd>Esc</kbd> fechar janelas</div>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn danger" data-act="reset-save">Apagar save e recomeçar</button>
        <button class="btn primary" data-act="ok" data-autofocus>Voltar ao salão</button>
      </div>`, {
      className: 'wide',
      actions: {
        ok: () => this.closeModal(),
        'reset-save': () => {
          this.openConfirm('Apagar todo o progresso?', 'Essa ação não pode ser desfeita. Seu restaurante voltará ao Dia 1 com o caixa inicial.', () => {
            this.game.restart()
            this.lastFeedId = this.game.state.feed[0]?.id || 0
            this.game.blocked = false
            this.audio.play('day')
            this.toast('Progresso apagado. Um novo começo!', 'warn', '🧨')
            this.renderTab(false)
            this.updateHeader(true)
          }, { confirm: 'Apagar e recomeçar', danger: true })
        }
      }
    })
  }

  /* ---------------------------------------------------------------- tabs */
  renderTabs() {
    this.tabsEl.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === this.activeTab))
  }

  renderTab(preserve = true) {
    const scroll = preserve ? this.bodyEl.scrollTop : 0
    this.bodyEl.innerHTML = this.tabHtml()
    this.bodyEl.scrollTop = scroll
  }

  tabHtml() {
    switch (this.activeTab) {
      case 'staff': return this.staffHtml()
      case 'upgrades': return this.upgradesHtml()
      case 'goals': return this.goalsHtml()
      case 'reviews': return this.reviewsHtml()
      default: return this.menuHtml()
    }
  }

  menuHtml() {
    const s = this.game.state
    const active = DISHES.filter(d => s.dishesUnlocked.includes(d.id) && s.menu[d.id].active).length
    let html = `<div class="panel-head"><h2>Cardápio</h2><span class="count">${active} ativos</span></div>
      <p class="hint">Ajuste preços e escolha os pratos do dia. Preço alto espanta; preço baixo reduz o lucro. O sabor vem da qualidade e do capricho.</p>`
    for (const d of DISHES) {
      const unlocked = s.dishesUnlocked.includes(d.id)
      const m = s.menu[d.id]
      if (unlocked) {
        const ratio = m.price / d.price
        const tag = ratio > 1.15 ? '<span class="tag bad">Caro</span>' : ratio < 0.9 ? '<span class="tag good">Barato</span>' : '<span class="tag">Justo</span>'
        html += `<div class="dish-card ${m.active ? '' : 'paused'}">
          <div class="dish-emoji">${d.emoji}</div>
          <div class="dish-main">
            <div class="dish-title"><b>${esc(d.name)}</b>${tag}</div>
            <div class="dish-desc">${esc(d.desc)}</div>
            <div class="dish-meta"><span>Custo ${fmtMoney(d.cost)}</span><span>${d.prep} min</span><span>Lucro ${fmtMoney(m.price - d.cost)}</span><span class="q">${stars(d.quality)}</span></div>
          </div>
          <div class="dish-controls">
            <div class="price-stepper">
              <button data-act="price-" data-id="${d.id}" aria-label="Diminuir preço">−</button>
              <span>${fmtMoney(m.price)}</span>
              <button data-act="price+" data-id="${d.id}" aria-label="Aumentar preço">+</button>
            </div>
            <button class="toggle ${m.active ? 'on' : ''}" data-act="toggle" data-id="${d.id}">${m.active ? 'No cardápio' : 'Pausado'}</button>
          </div>
        </div>`
      } else {
        const levelOk = s.level >= d.level
        const can = levelOk && s.money >= d.unlock
        html += `<div class="dish-card locked">
          <div class="dish-emoji" style="filter:grayscale(.7);opacity:.7">${d.emoji}</div>
          <div class="dish-main">
            <div class="dish-title"><b>${esc(d.name)}</b><span class="tag gold">Nível ${d.level}</span></div>
            <div class="dish-desc">${esc(d.desc)}</div>
            <div class="dish-meta"><span>Qualidade ${stars(d.quality)}</span><span>Venda sugerida ${fmtMoney(d.price)}</span></div>
          </div>
          <div class="lock-note">
            <small>${levelOk ? 'Receita' : `Chegue ao nível ${d.level}`}</small>
            <button class="btn sm ${can ? 'gold' : ''}" data-act="unlock" data-id="${d.id}" ${can ? '' : 'disabled'}>${levelOk ? fmtMoney(d.unlock) : '🔒'}</button>
          </div>
        </div>`
      }
    }
    return html
  }

  staffHtml() {
    const s = this.game.state
    const cap = this.game.staffCap()
    const counts = { cook: this.game.roleCount('cook'), waiter: this.game.roleCount('waiter'), cleaner: this.game.roleCount('cleaner') }
    let html = `<div class="panel-head"><h2>Equipe</h2><span class="count">${s.staff.length}/${cap}</span></div>
      <p class="hint">Cada função é essencial: cozinha sem cozinheiro não produz, salão sem garçom não serve. Suba de nível para aumentar o limite.</p>
      <div class="effect-strip">
        <span>👨‍🍳 <b>${counts.cook}</b>/${ROLES.cook.cap}</span>
        <span>🤵 <b>${counts.waiter}</b>/${ROLES.waiter.cap}</span>
        <span>🧹 <b>${counts.cleaner}</b>/${ROLES.cleaner.cap}</span>
        <span>💸 <b>${fmtMoney(this.game.wageTotal())}</b>/dia</span>
      </div>`
    if (!s.staff.length) {
      html += '<div class="empty">Nenhum funcionário. Contrate alguém abaixo para o serviço funcionar.</div>'
    } else {
      for (const st of s.staff) {
        const role = ROLES[st.role]
        html += `<div class="staff-card">
          <div class="staff-avatar">${role.emoji}</div>
          <div class="staff-info">
            <b>${esc(st.name)}</b>
            <div class="role">${role.name} · ${st.state === 'working' ? 'trabalhando' : st.state === 'walking' ? 'em serviço' : 'disponível'}</div>
            <div class="skill">${stars(st.skill)} <span style="color:var(--muted2);letter-spacing:0">habilidade</span></div>
            <div class="wage">Salário ${fmtMoney(st.wage)}/dia</div>
          </div>
          <div class="staff-actions"><button class="btn sm danger" data-act="fire" data-id="${st.id}">Dispensar</button></div>
        </div>`
      }
    }
    html += `<div class="subhead"><h3>Candidatos</h3><button class="mini-btn" data-act="refresh-cand">Novos · R$ 40</button></div>`
    if (!s.candidates.length) {
      html += '<div class="empty">Nenhum candidato no momento. Peça novos currículos ou espere o próximo dia.</div>'
    } else {
      for (const c of s.candidates) {
        const role = ROLES[c.role]
        const fullTeam = s.staff.length >= cap
        const fullRole = counts[c.role] >= role.cap
        const can = !fullTeam && !fullRole && s.money >= c.fee
        let note = `Contratação ${fmtMoney(c.fee)}`
        if (fullTeam) note = 'Equipe cheia'
        else if (fullRole) note = `Limite de ${role.plural.toLowerCase()}`
        html += `<div class="staff-card candidate-card">
          <div class="staff-avatar">${role.emoji}</div>
          <div class="staff-info">
            <b>${esc(c.name)}</b>
            <div class="role">${role.name} · ${stars(c.skill)}</div>
            <div class="wage">Salário ${fmtMoney(c.wage)}/dia · ${note}</div>
          </div>
          <div class="staff-actions">
            <div class="fee">${fmtMoney(c.fee)}</div>
            <button class="btn sm primary" data-act="hire" data-id="${c.id}" ${can ? '' : 'disabled'}>Contratar</button>
          </div>
        </div>`
      }
    }
    return html
  }

  upgradesHtml() {
    const s = this.game.state
    const flow = Math.round((s.upgrades.flyers * 8 + s.upgrades.social * 12))
    let html = `<div class="panel-head"><h2>Melhorias</h2><span class="count">${s.tablesUnlocked}/8 mesas</span></div>
      <p class="hint">Invista no salão, na cozinha e no marketing para atender mais gente com mais qualidade.</p>
      <div class="effect-strip">
        <span>✨ Charme <b>${Math.round(this.game.charm())}</b></span>
        <span>📈 Fluxo <b>+${flow}%</b></span>
        <span>😌 Paciência <b>+${Math.round(this.game.patienceBonus())} min</b></span>
      </div>`
    const cost = this.game.nextTableCost()
    const tPips = Array.from({ length: 8 }, (_, i) => `<i class="${i < s.tablesUnlocked ? 'on' : ''}"></i>`).join('')
    html += `<div class="up-card">
      <div class="up-emoji">🪑</div>
      <div class="up-info"><b>Mesas do salão</b><p>Abra mais uma mesa para atender mais clientes por dia.</p><div class="pips">${tPips}</div></div>
      <div class="up-buy">${cost == null ? '<small>Completo</small><button class="btn sm" disabled>Máximo</button>' : `<small>${fmtMoney(cost)}</small><button class="btn sm ${s.money >= cost ? 'gold' : ''}" data-act="buy-table" ${s.money >= cost ? '' : 'disabled'}>Abrir mesa</button>`}</div>
    </div>`
    const groups = ['Cozinha', 'Salão', 'Marketing', 'Equipe']
    for (const group of groups) {
      html += `<div class="group-label">${group}</div>`
      for (const u of UPGRADES.filter(x => x.group === group)) {
        const lvl = s.upgrades[u.id] || 0
        const maxed = lvl >= u.max
        const c = maxed ? null : u.costs[lvl]
        const pips = Array.from({ length: u.max }, (_, i) => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('')
        html += `<div class="up-card ${maxed ? 'maxed' : ''}">
          <div class="up-emoji">${u.emoji}</div>
          <div class="up-info"><b>${esc(u.name)} <span class="tag">${lvl}/${u.max}</span></b><p>${esc(u.desc)}</p><div class="pips">${pips}</div></div>
          <div class="up-buy">${maxed ? '<small>Completo</small><button class="btn sm" disabled>Máx</button>' : `<small>${fmtMoney(c)}</small><button class="btn sm ${s.money >= c ? 'primary' : ''}" data-act="buy-up" data-id="${u.id}" ${s.money >= c ? '' : 'disabled'}>Melhorar</button>`}</div>
        </div>`
      }
    }
    return html
  }

  goalsHtml() {
    const s = this.game.state
    let html = `<div class="panel-head"><h2>Metas</h2><span class="count">${OBJECTIVES.filter(o => s.objectives[o.id]?.done).length}/${OBJECTIVES.length}</span></div>
      <p class="hint">Complete metas para receber dinheiro extra e XP. As recompensas entram automaticamente no caixa.</p>`
    for (const o of OBJECTIVES) {
      const done = !!s.objectives[o.id]?.done
      const prog = Math.min(o.target, this.game.objectiveProgress(o))
      const pct = Math.min(100, (prog / o.target) * 100)
      let p = prog, t = o.target
      if (o.type === 'rep') { p = fmtStars(prog); t = fmtStars(o.target) }
      else if (o.type === 'dayProfit' || o.type === 'earned') { p = fmtMoney(prog); t = fmtMoney(o.target) }
      else { p = Math.floor(prog); t = o.target }
      html += `<div class="goal-card ${done ? 'done' : ''}">
        <div class="goal-ico">${done ? '✅' : o.icon}</div>
        <div>
          <div class="goal-top"><b>${esc(o.title)}</b><span class="goal-reward">${done ? 'Concluída' : '+' + fmtMoney(o.reward)}</span></div>
          <div class="goal-desc">${esc(o.desc)}</div>
          <div class="goal-progress"><i style="width:${pct}%"></i></div>
          <div class="goal-foot"><span>${p} / ${t}</span><span>${Math.round(pct)}%</span></div>
        </div>
      </div>`
    }
    html += `<div class="stats-grid">
      <div class="stat-tile"><b>${s.totalServed}</b><span>clientes servidos</span></div>
      <div class="stat-tile"><b>${fmtMoney(s.totalEarned)}</b><span>faturamento total</span></div>
      <div class="stat-tile"><b>${fmtMoney(s.bestDayProfit)}</b><span>melhor dia</span></div>
      <div class="stat-tile"><b>${fmtStars(s.reputation)}★</b><span>reputação atual</span></div>
    </div>`
    return html
  }

  reviewsHtml() {
    const s = this.game.state
    const rs = s.reviews
    const counts = [0, 0, 0, 0, 0]
    rs.forEach(r => { counts[Math.max(1, Math.min(5, r.rating)) - 1]++ })
    const maxC = Math.max(1, ...counts)
    let html = `<div class="panel-head"><h2>Resenhas</h2><span class="count">${rs.length} recentes</span></div>
      <div class="rating-hero">
        <div class="rating-big">${fmtStars(s.reputation)}</div>
        <div class="rating-meta">
          <div class="stars-lg">${stars(s.reputation)}</div>
          <small>${rs.length ? `${rs.length} avaliações recentes` : 'Ainda sem avaliações'}</small>
          <small>Reputação do restaurante</small>
        </div>
      </div>`
    if (rs.length) {
      html += '<div class="dist">'
      for (let star = 5; star >= 1; star--) {
        const n = counts[star - 1]
        html += `<div class="dist-row"><span>${star}</span><div class="dist-bar"><i style="width:${(n / maxC) * 100}%"></i></div><span>${n}</span></div>`
      }
      html += '</div>'
    }
    html += `<div class="stats-grid">
      <div class="stat-tile"><b>${s.totalServed}</b><span>clientes servidos</span></div>
      <div class="stat-tile"><b>${fmtMoney(s.totalEarned)}</b><span>faturamento total</span></div>
      <div class="stat-tile"><b>${fmtMoney(s.bestDayProfit)}</b><span>melhor dia</span></div>
      <div class="stat-tile"><b>${s.day}</b><span>dias no comando</span></div>
    </div>`
    if (!rs.length) {
      html += '<div class="empty">Nenhuma resenha ainda. Sirva os primeiros clientes para começar a construir sua reputação.</div>'
    } else {
      for (const r of rs.slice(0, 14)) {
        html += `<div class="review-item">
          <div class="review-head"><b>${esc(r.name)}</b><span class="rs">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span></div>
          <div class="review-head"><span class="rd">Dia ${r.day} · ${fmtClock(r.clock)} · satisfação ${r.sat}%</span><span class="rd">${r.tip ? '+' + fmtMoney(r.tip) + ' gorjeta' : ''}</span></div>
          <p>${esc(r.comment)}</p>
          <span class="dish-chip">${esc(r.dish)}${r.qty > 1 ? ' · ' + r.qty + ' pessoas' : ''}</span>
        </div>`
      }
    }
    return html
  }

  /* ---------------------------------------------------------------- canvas */
  worldPoint(ev) {
    const rect = this.canvas.getBoundingClientRect()
    const aspect = 960 / 600
    let w = rect.width, h = rect.height, ox = 0, oy = 0
    if (w / h > aspect) { w = h * aspect; ox = (rect.width - w) / 2 }
    else { h = w / aspect; oy = (rect.height - h) / 2 }
    return { x: ((ev.clientX - rect.left - ox) / w) * 960, y: ((ev.clientY - rect.top - oy) / h) * 600 }
  }

  tableAt(p) {
    return this.game.state.tables.find(t => Math.hypot(t.x - p.x, t.y - p.y) < (t.unlocked ? 48 : 44))
  }

  onCanvasMove(ev) {
    const p = this.worldPoint(ev)
    const t = this.tableAt(p)
    if (t) {
      this.renderer.hover = { tableId: t.id }
      const actionable = (!t.unlocked && t.slot === this.game.nextTableSlot()) || t.dirty
      this.canvas.style.cursor = actionable ? 'pointer' : 'default'
    } else {
      this.renderer.hover = null
      this.canvas.style.cursor = 'default'
    }
  }

  onCanvasClick(ev) {
    const p = this.worldPoint(ev)
    const t = this.tableAt(p)
    const g = this.game
    if (t) {
      if (!t.unlocked) {
        if (t.slot === g.nextTableSlot()) {
          this.feedback(g.buyTable(), '🪑')
          this.renderTab(true)
          this.updateHeader(true)
        } else {
          this.toast('As mesas são abertas em ordem. A próxima está destacada em dourado.', 'warn', '🔒')
        }
      } else if (t.dirty) {
        this.feedback(g.cleanTable(t, true), '🧽')
        this.renderTab(true)
        this.updateHeader(true)
      } else if (t.customerId) {
        const c = g.state.customers.find(x => x.id === t.customerId)
        if (c) this.toast(`Mesa de ${c.name} · satisfação ${Math.round(c.sat)}% · ${c.party} pessoa(s)`, c.sat < 45 ? 'bad' : 'warn', c.sat < 45 ? '😠' : '🍽️')
      } else {
        this.toast('Mesa livre esperando clientes.', '', '🪑')
      }
      return
    }
    const c = g.state.customers.find(x => Math.hypot(x.x - p.x, x.y - p.y) < 22)
    if (c) {
      const label = c.state === 'queued' ? `Paciência ${Math.max(0, Math.round(c.patience))} min` : `Satisfação ${Math.round(c.sat)}%`
      this.toast(`${c.name} · ${c.party} pessoa(s) · ${label}`, c.sat < 45 ? 'bad' : '', c.state === 'queued' ? '⏳' : '🙂')
    }
  }
}
