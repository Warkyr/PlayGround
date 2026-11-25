// ui.js — DOM interface, dialogue, HUD, title and modals
import { Input, wait, clamp } from './util.js';
import { audio } from './audio.js';
import { getPortrait, getCharSprite, hexA } from './art.js';
import { CHAPTERS, ITEMS } from './data.js';

const $ = (sel) => document.querySelector(sel);

const SPEAKER_SPRITE = {
  'Kael': 'kael', 'Lyra': 'lyra', 'Dorian': 'dorian', 'Garrick': 'garrick', 'Mira': 'mira',
  'Anciã Maeve': 'elder', 'Maeve': 'elder', 'Tolan': 'merchant', 'Pip': 'child',
  'Brann': 'resistance', 'Sir Varek': 'champion', 'Varek': 'champion',
  'Guarda': 'guard', 'Guarda Real': 'guard', 'Carcereiro Groth': 'jailer',
  'Narrador': null, '???': null,
};

class Typewriter {
  constructor(el, text, speed = 15) {
    this.el = el; this.text = text; this.speed = speed;
    this.i = 0; this.done = false; this.timer = null;
    this.promise = new Promise((res) => { this._res = res; });
    this.tick();
  }
  tick() {
    if (this.done) return;
    if (this.i >= this.text.length) { this.finish(); return; }
    const ch = this.text[this.i++];
    this.el.textContent += ch;
    if (this.i % 3 === 0 && ch !== ' ') audio.sfx('text');
    let d = this.speed;
    if ('.,!?;:'.includes(ch)) d += 55;
    if (ch === '\n') d += 80;
    this.timer = setTimeout(() => this.tick(), d);
  }
  finish() {
    if (this.done) return;
    this.done = true;
    clearTimeout(this.timer);
    this.el.textContent = this.text;
    this._res();
  }
}

class UI {
  constructor() {
    this.titleActive = false;
    this.dialogueOpen = false;
    this.choiceOpen = false;
    this.screenOpen = false;
    this.partyKey = '';
    this.portraits = new Map();
    this.lastToast = 0;
  }

  init() {
    this.hud = $('#hud');
    this.dialogue = $('#dialogue');
    this.speaker = $('#speaker');
    this.dialogueText = $('#dialogue-text');
    this.advance = $('#dlg-advance');
    this.portraitCanvas = $('#portrait');
    this.screenLayer = $('#screen-layer');
    this.choiceLayer = $('#choice-layer');
    this.toastLayer = $('#toast-layer');
    this.fadeEl = $('#fade');
    this.touch = $('#touch-controls');
    this.hudParty = $('#hud-party');
    this.hudChapter = $('#hud-chapter');
    this.hudQuest = $('#hud-quest');
    this.hudGold = $('#hud-gold');

    // touch controls
    document.querySelectorAll('.dpad-btn').forEach((btn) => {
      const dir = btn.dataset.dir;
      const down = (e) => { e.preventDefault(); audio.unlock(); Input.touchDown(dir); };
      const up = (e) => { e.preventDefault(); Input.touchUp(dir); };
      btn.addEventListener('pointerdown', down);
      btn.addEventListener('pointerup', up);
      btn.addEventListener('pointercancel', up);
      btn.addEventListener('pointerleave', up);
      btn.addEventListener('contextmenu', (e) => e.preventDefault());
    });
    $('#touch-a').addEventListener('pointerdown', (e) => { e.preventDefault(); audio.unlock(); Input.dispatch('confirm'); });
    $('#touch-b').addEventListener('pointerdown', (e) => { e.preventDefault(); audio.unlock(); Input.dispatch('cancel'); });
    $('#hud-mute').addEventListener('click', () => { audio.unlock(); const m = audio.toggleMuted(); this.updateMuteIcon(m); });
    this.updateMuteIcon(audio.muted);

    const hint = $('#rotate-hint');
    const dismiss = () => { hint.classList.remove('on'); try { sessionStorage.setItem('rotateDismissed', '1'); } catch {} };
    $('#rotate-dismiss').addEventListener('click', dismiss);
    this.maybeRotateHint();

    window.addEventListener('resize', () => this.maybeRotateHint());
  }

  maybeRotateHint() {
    const hint = $('#rotate-hint');
    if (!hint) return;
    let dismissed = false;
    try { dismissed = sessionStorage.getItem('rotateDismissed') === '1'; } catch {}
    const portrait = window.innerHeight > window.innerWidth * 1.25;
    const small = window.innerWidth < 620;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    if (portrait && small && coarse && !dismissed && !this.titleActive) hint.classList.add('on');
    else hint.classList.remove('on');
  }

  updateMuteIcon(muted) {
    const b = $('#hud-mute');
    if (b) { b.textContent = muted ? '♪̸' : '♪'; b.style.opacity = muted ? '.55' : '1'; }
    const t = $('#title-sound');
    if (t) t.textContent = muted ? 'Som: Desligado' : 'Som: Ligado';
  }

  // ---------------- HUD ----------------
  showHUD(show) { this.hud.classList.toggle('hidden', !show); }

  setTouchVisible(show) {
    this.touch.classList.toggle('hidden', !show);
  }

  updateHUD(game) {
    this.hudChapter.textContent = game.chapterLabel || 'Capítulo I';
    this.hudQuest.textContent = game.quest || '—';
    this.hudGold.textContent = game.gold;
    const key = game.party.map((m) => m.id + m.level).join(',');
    if (key !== this.partyKey) {
      this.partyKey = key;
      this.hudParty.innerHTML = '';
      game.party.forEach((m) => {
        const card = document.createElement('div');
        card.className = 'party-card';
        card.dataset.id = m.id;
        const face = document.createElement('div');
        face.className = 'pc-face';
        const cv = document.createElement('canvas');
        cv.width = 60; cv.height = 60;
        cv.getContext('2d').drawImage(getPortrait(m.sprite, 72), 0, 0, 60, 60);
        face.appendChild(cv);
        const mid = document.createElement('div');
        mid.className = 'pc-mid';
        mid.innerHTML = `<div class="pc-name"><span>${m.name}</span><span class="pc-lvl">Nv ${m.level}</span></div>
          <div class="bar hp" data-hpbar><i></i></div>
          <div class="bar mp" data-mpbar><i></i></div>`;
        const num = document.createElement('div');
        num.className = 'pc-hpnum';
        num.innerHTML = `<span data-hp>${m.hp}</span>`;
        card.append(face, mid, num);
        this.hudParty.appendChild(card);
      });
    }
    game.party.forEach((m) => {
      const card = this.hudParty.querySelector(`[data-id="${m.id}"]`);
      if (!card) return;
      const hpBar = card.querySelector('[data-hpbar]');
      const mpBar = card.querySelector('[data-mpbar]');
      const pct = clamp(m.hp / m.maxHp, 0, 1);
      hpBar.querySelector('i').style.width = `${pct * 100}%`;
      hpBar.classList.toggle('warn', pct <= 0.5 && pct > 0.22);
      hpBar.classList.toggle('low', pct <= 0.22);
      mpBar.querySelector('i').style.width = `${clamp(m.mp / m.maxMp, 0, 1) * 100}%`;
      card.querySelector('[data-hp]').textContent = `${m.hp}`;
    });
  }

  setQuest(text) { this.hudQuest.textContent = text; }

  // ---------------- Dialogue ----------------
  portraitFor(speaker, explicit) {
    if (explicit === null) return null;
    if (explicit) return explicit;
    return SPEAKER_SPRITE[speaker] ?? null;
  }

  drawPortrait(id) {
    const c = this.portraitCanvas;
    const g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    if (id === null) {
      const p = getPortrait('narrator', 72);
      g.drawImage(p, 0, 0);
      return;
    }
    const p = getPortrait(id, 72);
    g.drawImage(p, 0, 0);
  }

  async say(speaker, text, portraitId, opts = {}) {
    if (this.dialogueOpen) await wait(120);
    this.dialogueOpen = true;
    this.dialogue.classList.remove('hidden');
    this.advance.classList.remove('on');
    this.speaker.textContent = speaker || '';
    this.speaker.style.display = speaker ? '' : 'none';
    const pid = this.portraitFor(speaker, portraitId);
    this.drawPortrait(pid);
    this.dialogueText.textContent = '';
    audio.unlock();

    const tw = new Typewriter(this.dialogueText, text, opts.speed || 15);
    let finishedTyping = false;
    tw.promise.then(() => {
      finishedTyping = true;
      this.advance.classList.add('on');
    });

    await new Promise((resolve) => {
      let closed = false;
      const close = () => {
        if (closed) return;
        closed = true;
        Input.pop(handler);
        this.dialogue.onclick = null;
        this.dialogue.classList.add('hidden');
        this.advance.classList.remove('on');
        this.dialogueOpen = false;
        audio.sfx('cursor');
        resolve();
      };
      const advance = () => {
        if (!finishedTyping) { tw.finish(); finishedTyping = true; this.advance.classList.add('on'); return; }
        close();
      };
      const handler = (action) => {
        if (action === 'confirm' || action === 'cancel' || action === 'menu') { advance(); return true; }
        return true;
      };
      Input.push(handler);
      this.dialogue.onclick = (e) => { e.preventDefault(); advance(); };
    });
  }

  async sayLines(lines, opts = {}) {
    for (const l of lines) {
      if (Array.isArray(l)) await this.say(l[0], l[1], l[2] ?? opts.portrait, opts);
      else await this.say(opts.speaker || 'Narrador', l, opts.portrait, opts);
    }
  }

  hideDialogue() {
    this.dialogue.classList.add('hidden');
    this.dialogueOpen = false;
  }

  // ---------------- Choice ----------------
  async choice(prompt, options) {
    if (this.choiceOpen) return null;
    this.choiceOpen = true;
    this.choiceLayer.innerHTML = '';
    this.choiceLayer.classList.add('on');
    const card = document.createElement('div');
    card.className = 'choice-card';
    if (prompt) {
      const p = document.createElement('p');
      p.className = 'choice-prompt';
      p.textContent = prompt;
      card.appendChild(p);
    }
    const list = document.createElement('div');
    list.className = 'choice-list';
    let sel = 0;
    const opts = options.map((o) => typeof o === 'string' ? { label: o, value: o } : o);
    const buttons = opts.map((o, i) => {
      const b = document.createElement('button');
      b.className = 'choice-btn' + (i === 0 ? ' sel' : '');
      b.innerHTML = `<span class="arrow">▶</span><span>${o.label}</span>`;
      b.addEventListener('mouseenter', () => setSel(i));
      b.addEventListener('click', () => choose(i));
      list.appendChild(b);
      return b;
    });
    card.appendChild(list);
    this.choiceLayer.appendChild(card);
    const setSel = (i) => {
      sel = (i + opts.length) % opts.length;
      buttons.forEach((b, j) => b.classList.toggle('sel', j === sel));
      audio.sfx('cursor');
    };
    return await new Promise((resolve) => {
      const finish = (i) => {
        Input.pop(handler);
        this.choiceLayer.classList.remove('on');
        this.choiceLayer.innerHTML = '';
        this.choiceOpen = false;
        audio.sfx('confirm');
        resolve(i < 0 ? null : (opts[i].value ?? i));
      };
      const choose = (i) => finish(i);
      const handler = (action) => {
        if (action === 'up') { setSel(sel - 1); return true; }
        if (action === 'down') { setSel(sel + 1); return true; }
        if (action === 'confirm') { finish(sel); return true; }
        if (action === 'cancel') { finish(-1); return true; }
        return true;
      };
      Input.push(handler);
    });
  }

  // ---------------- Screens ----------------
  openScreen(content, opts = {}) {
    this.screenLayer.classList.remove('hidden');
    this.screenLayer.classList.toggle('dim', opts.dim !== false);
    this.screenLayer.className = `screen-layer${opts.dim !== false ? ' dim' : ''}${opts.className ? ' ' + opts.className : ''}`;
    this.screenLayer.innerHTML = '';
    this.screenLayer.appendChild(content);
    this.screenOpen = true;
    return content;
  }

  closeScreen() {
    this.screenLayer.classList.add('hidden');
    this.screenLayer.innerHTML = '';
    this.screenLayer.className = 'hidden';
    this.screenOpen = false;
  }

  async modal({ kicker, title, sub, body, actions, className }) {
    const card = document.createElement('div');
    card.className = `modal-card ${className || ''}`;
    card.innerHTML = `
      ${kicker ? `<div class="modal-kicker">${kicker}</div>` : ''}
      ${title ? `<h2 class="modal-title">${title}</h2>` : ''}
      ${sub ? `<p class="modal-sub">${sub}</p>` : ''}
      ${body ? `<div class="modal-body">${body}</div>` : ''}
      <div class="modal-actions"></div>`;
    const act = card.querySelector('.modal-actions');
    const list = actions || [{ label: 'Continuar', value: 'ok', primary: true }];
    let sel = 0;
    const btns = list.map((a, i) => {
      const b = document.createElement('button');
      b.className = 'btn' + (a.primary ? ' primary' : '');
      b.textContent = a.label;
      b.addEventListener('mouseenter', () => setSel(i));
      b.addEventListener('click', () => finish(a.value));
      act.appendChild(b);
      return b;
    });
    const setSel = (i) => { sel = i; btns.forEach((b, j) => b.style.outline = j === sel ? '2px solid rgba(231,199,123,.7)' : ''); };
    setSel(0);
    this.openScreen(card, { dim: true });
    return await new Promise((resolve) => {
      const finish = (v) => {
        Input.pop(handler);
        this.closeScreen();
        audio.sfx('confirm');
        resolve(v);
      };
      const handler = (action) => {
        if (action === 'left') { setSel((sel - 1 + btns.length) % btns.length); return true; }
        if (action === 'right') { setSel((sel + 1) % btns.length); return true; }
        if (action === 'confirm') { finish(list[sel].value); return true; }
        if (action === 'cancel') {
          const cancel = list.find((a) => a.cancel);
          if (cancel) finish(cancel.value);
          return true;
        }
        return true;
      };
      Input.push(handler);
    });
  }

  toast(text, type = '', icon = '') {
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `${icon ? `<span class="ti">${icon}</span>` : ''}${text}`;
    this.toastLayer.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 420); }, 2400);
    while (this.toastLayer.children.length > 3) this.toastLayer.firstChild.remove();
  }

  // ---------------- Fades & cards ----------------
  async fadeOut(dur = 450) {
    this.fadeEl.style.transitionDuration = `${dur}ms`;
    this.fadeEl.classList.add('on');
    await wait(dur + 30);
  }
  async fadeIn(dur = 450) {
    this.fadeEl.style.transitionDuration = `${dur}ms`;
    this.fadeEl.classList.remove('on');
    await wait(dur + 30);
  }
  setBlack(on) {
    this.fadeEl.style.transitionDuration = '0ms';
    this.fadeEl.classList.toggle('on', on);
  }

  async chapterCard(chapter, opts = {}) {
    const el = document.createElement('div');
    el.className = 'chapter-card';
    el.innerHTML = `
      <div class="cc-kicker">Capítulo ${chapter.n}</div>
      <div class="cc-rule"></div>
      <div class="cc-title">${chapter.title}</div>
      <div class="cc-sub">${chapter.sub || ''}</div>`;
    $('#ui').appendChild(el);
    audio.sfx('save');
    await new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        Input.pop(handler);
        el.remove();
        resolve();
      };
      const handler = (a) => {
        if (a === 'confirm' || a === 'cancel' || a === 'menu') { finish(); return true; }
        return false;
      };
      Input.push(handler);
      el.style.pointerEvents = 'auto';
      el.addEventListener('click', finish);
      setTimeout(finish, opts.duration || 3400);
    });
  }

  // ---------------- Title ----------------
  async title(opts = {}) {
    this.titleActive = true;
    const hasSave = !!opts.save;
    const wrap = document.createElement('div');
    wrap.className = 'title-wrap';
    wrap.innerHTML = `
      <div class="title-inner">
        <div class="title-eyebrow">Uma lenda de cinzas e aurora</div>
        <div class="title-logo">
          <h1>LÂMINA<span class="small">DO AMANHECER</span></h1>
        </div>
        <div class="title-rule"><span>✦</span></div>
        <p class="title-sub">Traído pela amada e pelo melhor amigo.<br>Renascido na escuridão.</p>
        <div class="title-menu">
          <button class="title-btn" data-act="continue" ${hasSave ? '' : 'disabled'}>Continuar<span class="t-sub">${hasSave ? opts.saveLabel || '' : 'Nenhum progresso salvo'}</span></button>
          <button class="title-btn" data-act="new">Novo Jogo<span class="t-sub">Começar a jornada de Kael</span></button>
          <button class="title-btn" data-act="chronicles">Crônicas<span class="t-sub">O mundo de Valdoria</span></button>
          <button class="title-btn" data-act="credits">Créditos<span class="t-sub">Quem ergueu esta lenda</span></button>
          <button class="title-btn" data-act="sound" id="title-sound">Som: Ligado</button>
        </div>
        ${opts.completed ? '<div class="title-badge">✦ LENDA CONCLUÍDA ✦</div>' : ''}
      </div>
      <div class="title-foot">Um RPG de turnos · <span>✦</span> · Jogue com teclado, mouse ou toque</div>`;
    this.openScreen(wrap, { dim: false, className: 'title-layer' });
    this.updateMuteIcon(audio.muted);
    this.showHUD(false);
    this.setTouchVisible(false);

    const buttons = [...wrap.querySelectorAll('.title-btn')];
    let sel = buttons.findIndex((b) => !b.disabled);
    const setSel = (i) => {
      sel = i;
      buttons.forEach((b, j) => b.classList.toggle('sel', j === sel));
      if (!buttons[sel].disabled) audio.sfx('cursor');
    };
    setSel(sel);

    while (true) {
      const action = await new Promise((resolve) => {
        const finish = (a) => { Input.pop(handler); audio.sfx('confirm'); resolve(a); };
        const handler = (a) => {
          if (a === 'up') { let i = sel; do { i = (i - 1 + buttons.length) % buttons.length; } while (buttons[i].disabled); setSel(i); return true; }
          if (a === 'down') { let i = sel; do { i = (i + 1) % buttons.length; } while (buttons[i].disabled); setSel(i); return true; }
          if (a === 'confirm') { if (!buttons[sel].disabled) finish(buttons[sel].dataset.act); return true; }
          if (a === 'cancel') { return true; }
          return true;
        };
        Input.push(handler);
        buttons.forEach((b, i) => {
          b.addEventListener('mouseenter', () => { if (!b.disabled) setSel(i); });
          b.addEventListener('click', () => { if (!b.disabled) { setSel(i); finish(b.dataset.act); } });
        });
      });

      if (action === 'sound') {
        audio.unlock();
        const m = audio.toggleMuted();
        this.updateMuteIcon(m);
        continue;
      }
      if (action === 'chronicles') { await this.showChronicles(); continue; }
      if (action === 'credits') { await this.showCredits(); continue; }
      this.titleActive = false;
      this.closeScreen();
      this.maybeRotateHint();
      return action;
    }
  }

  async showChronicles() {
    const content = document.createElement('div');
    content.className = 'screen story-screen';
    content.innerHTML = `
      <div class="screen-head">
        <div class="screen-title">Crônicas de Valdoria</div>
        <button class="screen-close">Voltar</button>
      </div>
      <div class="screen-body">
        <p class="quote">"Toda luz lança uma sombra. Toda sombra, um dia, aprende a amanhecer."</p>
        <h3>O Reino</h3>
        <p>Valdoria vive do calor da <b>Brasa Eterna</b>, uma chama sagrada guardada em Brumalva desde a fundação do reino. Enquanto ela arder, as colheitas crescem e os invernos são brandos.</p>
        <h3>O Herói</h3>
        <p>Kael era apenas um lenhador. Amava Lyra, a filha do moleiro, e confiava em Dorian como a um irmão. Em uma única noite, perdeu os dois — e a liberdade.</p>
        <h3>A Queda</h3>
        <p>Acusado de roubar a Brasa Eterna, Kael foi lançado no Forte Abissal. Lá, no silêncio de três anos, encontrou um velho cavaleiro e uma verdade simples: a vingança o manteria preso. O dever o libertaria.</p>
        <h3>A Aurora</h3>
        <p>Dizem que a primeira luz do amanhecer não perdoa. Mas também não esquece. E aqueles que carregam a aurora no peito podem incendiar impérios — ou salvá-los.</p>
        <h3>Controles</h3>
        <p><b>Mover:</b> WASD / setas · <b>Interagir:</b> Espaço, Enter ou Z · <b>Menu:</b> Esc ou X<br><b>Toque:</b> use o direcional e os botões A/B na tela.</p>
      </div>`;
    this.openScreen(content, { dim: true });
    content.querySelector('.screen-close').addEventListener('click', () => this.closeScreen());
    await new Promise((resolve) => {
      const handler = (a) => { if (a === 'cancel' || a === 'confirm') { Input.pop(handler); this.closeScreen(); resolve(); return true; } return true; };
      Input.push(handler);
    });
  }

  async showCredits() {
    const content = document.createElement('div');
    content.className = 'screen story-screen';
    content.innerHTML = `
      <div class="screen-head">
        <div class="screen-title">Créditos</div>
        <button class="screen-close">Voltar</button>
      </div>
      <div class="screen-body">
        <h3>Lâmina do Amanhecer</h3>
        <p>Uma história de traição, cinzas e recomeço.</p>
        <div class="credits-grid">
          <div class="cred"><b>Direção & Roteiro</b><span>Estúdio Aurora</span></div>
          <div class="cred"><b>Design de Jogo</b><span>Estúdio Aurora</span></div>
          <div class="cred"><b>Arte & Pixel Art</b><span>Gerada proceduralmente em canvas</span></div>
          <div class="cred"><b>Trilha & Efeitos</b><span>Chiptune sintetizado via WebAudio</span></div>
          <div class="cred"><b>Programação</b><span>JavaScript puro, sem dependências</span></div>
          <div class="cred"><b>Agradecimento especial</b><span>Você, que chegou até o amanhecer</span></div>
        </div>
        <h3>Nota</h3>
        <p>Todos os personagens, lugares e acontecimentos são ficcionais. Nenhum sprite foi ferido durante a produção.</p>
      </div>`;
    this.openScreen(content, { dim: true });
    content.querySelector('.screen-close').addEventListener('click', () => this.closeScreen());
    await new Promise((resolve) => {
      const handler = (a) => { if (a === 'cancel' || a === 'confirm') { Input.pop(handler); this.closeScreen(); resolve(); return true; } return true; };
      Input.push(handler);
    });
  }

  // ---------------- Battle helpers ----------------
  battleEl() { return $('#battle-ui'); }
  showBattleUI(show) {
    const el = $('#battle-ui');
    el.classList.toggle('hidden', !show);
    if (!show) el.innerHTML = '';
    this.showHUD(!show);
  }

  // ---------------- Ending ----------------
  async ending(game) {
    const content = document.createElement('div');
    content.className = 'screen story-screen ending-screen';
    const forgiveness = game.flags.forgaveLyra
      ? 'Lyra permaneceu ao seu lado. Não como um troféu, mas como uma escolha — refeita todos os dias.'
      : 'Lyra partiu para curar as próprias feridas. Kael aprendeu que perdoar não é o mesmo que voltar.';
    content.innerHTML = `
      <div class="screen-head">
        <div class="screen-title">Fim</div>
      </div>
      <div class="screen-body">
        <p class="quote">"A aurora não apaga as cinzas. Ela só mostra que ainda há chão para recomeçar."</p>
        <h3>O Herói de Brumalva</h3>
        <p>Com a Brasa Eterna destruída, o inverno chegou a Valdoria. Mas, pela primeira vez em séculos, o sol nasceu sem pedir permissão a ninguém. Kael foi aclamado como a <b>Lâmina da Aurora</b> — não porque empunhava uma espada, mas porque escolheu proteger.</p>
        <p>${forgiveness}</p>
        <p>Mira fundou uma escola de magia onde antes havia medo. Maeve viu Brumalva florescer sem relíquia alguma. E no alto do Forte Abissal, alguém gravou um nome na pedra: <b>Garrick, o Guardião</b>.</p>
        <p>Dizem que, em noites claras, é possível ver uma luz dourada sobre o Pico do Amanhecer. Não é um tesouro. Não é uma arma. É apenas um homem que decidiu não se tornar aquilo que odiava.</p>
        <div class="reward-grid">
          <div class="reward-box"><div class="rb-label">Capítulos concluídos</div><div class="rb-val">VI / VI</div></div>
          <div class="reward-box"><div class="rb-label">Tempo de jornada</div><div class="rb-val">${game.playTimeLabel || '—'}</div></div>
          <div class="reward-box"><div class="rb-label">Nível de Kael</div><div class="rb-val">${game.party.find((m) => m.id === 'kael')?.level || '—'}</div></div>
          <div class="reward-box"><div class="rb-label">Batalhas vencidas</div><div class="rb-val">${game.battlesWon || 0}</div></div>
        </div>
        <div class="modal-actions"><button class="btn primary" id="ending-back">Voltar ao título</button></div>
      </div>`;
    this.openScreen(content, { dim: true });
    return await new Promise((resolve) => {
      const finish = () => {
        Input.pop(handler);
        this.closeScreen();
        resolve('title');
      };
      const handler = (a) => { if (a === 'confirm' || a === 'cancel') { finish(); return true; } return true; };
      Input.push(handler);
      content.querySelector('#ending-back').addEventListener('click', finish);
    });
  }
}

export const ui = new UI();
