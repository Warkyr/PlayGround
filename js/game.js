import {
  MAPS, HEROES, ITEMS, UPGRADES, CHAPTERS, LORE, STARTING_STATE,
  makeMember, levelFromXp, ENCOUNTERS
} from './data.js';
import { AudioManager } from './audio.js';
import { Battle } from './battle.js';
import { drawTitleScene, drawWorld, drawPortrait } from './art.js';
import { storyMethods } from './story.js';
import { menuMethods } from './menus.js';

const TILE = 32;
const W = 1024;
const H = 576;
const SAVE_KEY = 'cinzas-de-valdoria-save-v1';
const wait = (ms) => new Promise(res => setTimeout(res, ms));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const SOLID_TILES = new Set(['T', 'R', 'H', 'D', '#', 'X', '~', 'W']);

export class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.audio = new AudioManager();
    this.scene = 'title';
    this.time = 0;
    this.lastT = performance.now();
    this.playTime = 0;
    this.steps = 0;
    this.battlesWon = 0;
    this.storyBusy = false;
    this.dialogueActive = false;
    this.dialogueState = null;
    this.menuOpen = false;
    this.shopOpen = false;
    this.chapterOpen = false;
    this.currentBattle = null;
    this.battle = null;
    this.followers = [];
    this.trail = [];
    this.hiddenNpcs = new Set();
    this.openedChests = new Set();
    this.firedTriggers = new Set();
    this.upgrades = {};
    this.loreUnlocked = new Set();
    this.keys = {};
    this.touchDirs = new Set();
    this.lastStepSound = 0;
    this.locationTimer = null;
    this.toastTimer = null;
    this.typeTimer = null;
    this.chapterTimer = null;
    this.shopMode = 'merchant';
    this.endingChoice = 'spare';
    this.defeatVisible = false;

    this.normalizeMaps();
    this.cacheElements();
    this.bindCoreUi();
    this.resetState();
    this.updateTitleScreen();
    this.updateControls();
    this.showTitle();
    this.startLoop();

    window.__cinzas = this;
    window.__CINZAS_READY__ = true;
  }

  normalizeMaps() {
    for (const map of Object.values(MAPS)) {
      const fill = map.id === 'prison' || map.id === 'castle' ? '#' : 'T';
      const rows = map.tiles.map(row => (row + fill.repeat(40)).slice(0, 32));
      while (rows.length < 18) rows.push(fill.repeat(32));
      map.tiles = rows.slice(0, 18);
    }
  }

  cacheElements() {
    const $ = id => document.getElementById(id);
    this.el = {
      title: $('title-screen'),
      hud: $('hud'),
      partyHud: $('party-hud'),
      objective: $('objective-text'),
      gold: $('gold-text'),
      locationCard: $('location-card'),
      locationRegion: $('location-region'),
      locationName: $('location-name'),
      interactHint: $('interact-hint'),
      touch: $('touch-controls'),
      dialogue: $('dialogue-layer'),
      dialogueFrame: document.querySelector('.dialogue-frame'),
      portraitWrap: $('portrait-wrap'),
      portrait: $('dialogue-portrait'),
      dialogueName: $('dialogue-name'),
      dialogueText: $('dialogue-text'),
      dialogueChoices: $('dialogue-choices'),
      dialogueContinue: $('dialogue-continue'),
      battleUi: $('battle-ui'),
      chapter: $('chapter-card'),
      chapterKicker: $('chapter-kicker'),
      chapterTitle: $('chapter-title'),
      chapterQuote: $('chapter-quote'),
      chapterContinue: $('chapter-continue'),
      menu: $('menu-overlay'),
      menuContent: $('menu-content'),
      shop: $('shop-overlay'),
      shopTitle: $('shop-title'),
      shopEyebrow: $('shop-eyebrow'),
      shopGold: $('shop-gold'),
      shopContent: $('shop-content'),
      shopFootnote: $('shop-footnote'),
      help: $('help-overlay'),
      defeat: $('defeat-overlay'),
      ending: $('ending-screen'),
      endingText: $('ending-text'),
      endingStats: $('ending-stats'),
      fade: $('fade-layer'),
      toast: $('toast'),
      continueBtn: $('continue-game'),
      soundBtn: $('sound-btn'),
      menuBtn: $('menu-btn')
    };
  }

  bindCoreUi() {
    document.getElementById('new-game').addEventListener('click', () => this.newGame());
    this.el.continueBtn.addEventListener('click', () => this.loadGame());
    document.getElementById('help-btn').addEventListener('click', () => this.showOverlay('help-overlay'));
    this.el.soundBtn.addEventListener('click', () => this.toggleSound());
    this.el.menuBtn.addEventListener('click', () => this.openMenu());
    document.getElementById('chapter-continue').addEventListener('click', () => this.finishChapter());
    document.getElementById('retry-battle').addEventListener('click', () => this.retryBattle());
    document.getElementById('defeat-title').addEventListener('click', () => this.returnToTitle());
    document.getElementById('ending-continue').addEventListener('click', () => this.returnToTitle());
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => this.closeOverlay(btn.dataset.close));
    });
    this.el.dialogue.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      this.advanceDialogue();
    });
    document.querySelectorAll('#dpad .dpad-btn').forEach(btn => {
      const dir = btn.dataset.dir;
      const down = (e) => {
        e.preventDefault();
        btn.classList.add('pressed');
        this.touchDirs.add(dir);
      };
      const up = (e) => {
        e.preventDefault();
        btn.classList.remove('pressed');
        this.touchDirs.delete(dir);
      };
      btn.addEventListener('pointerdown', down);
      btn.addEventListener('pointerup', up);
      btn.addEventListener('pointercancel', up);
      btn.addEventListener('pointerleave', up);
    });
    document.getElementById('touch-action').addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (this.chapterOpen) this.finishChapter();
      else if (this.dialogueActive) this.advanceDialogue();
      else if (this.scene === 'world' && !this.storyBusy) this.interact();
    });
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => { this.keys[e.key.toLowerCase()] = false; });
    window.addEventListener('blur', () => { this.keys = {}; this.touchDirs.clear(); });
    window.addEventListener('pointerdown', () => this.audio.unlock(), { once: true });
    window.addEventListener('keydown', () => this.audio.unlock(), { once: true });
    this.canvas.addEventListener('pointerdown', () => {
      if (this.scene === 'world' && !this.dialogueActive && !this.storyBusy) this.interact();
    });
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => this.switchMenuTab(tab.dataset.tab));
    });
    this.el.menu.addEventListener('click', (e) => {
      if (e.target === this.el.menu) this.closeOverlay('menu-overlay');
    });
    this.el.shop.addEventListener('click', (e) => {
      if (e.target === this.el.shop) this.closeOverlay('shop-overlay');
    });
  }

  resetState() {
    this.party = [makeMember('kael', 1)];
    this.gold = STARTING_STATE.gold;
    this.inventory = { ...STARTING_STATE.inventory };
    this.flags = {};
    this.chapter = 'prologue';
    this.objective = 'Fale com Lyra na fonte da praça.';
    this.mapId = 'bruma';
    this.mapDef = MAPS.bruma;
    this.player = this.makePlayer(5, 11, 'down');
    this.hiddenNpcs = new Set();
    this.openedChests = new Set();
    this.firedTriggers = new Set();
    this.upgrades = {};
    this.loreUnlocked = new Set();
    this.followers = [];
    this.trail = [];
    this.playTime = 0;
    this.steps = 0;
    this.battlesWon = 0;
    this.currentBattle = null;
    this.battle = null;
    this.endingChoice = 'spare';
    this.defeatVisible = false;
    this.scene = 'title';
    this.storyBusy = false;
    this.dialogueActive = false;
    this.menuOpen = false;
    this.shopOpen = false;
    this.chapterOpen = false;
    this.hideAllOverlays();
    this.updateHUD();
    this.updateControls();
  }

  makePlayer(x, y, dir = 'down') {
    return {
      x, y, dir,
      px: x * TILE + 16,
      py: y * TILE,
      fromPx: x * TILE + 16,
      fromPy: y * TILE,
      toPx: x * TILE + 16,
      toPy: y * TILE,
      moving: false,
      progress: 0,
      frame: 0,
      char: 'kael'
    };
  }

  startLoop() {
    const loop = (now) => {
      const dt = Math.min(.05, (now - this.lastT) / 1000 || 0);
      this.lastT = now;
      this.time += dt;
      if (this.scene === 'world' || this.scene === 'defeat') {
        this.playTime += dt;
        this.updateWorld(dt);
      }
      if (this.battle && this.scene === 'battle') {
        this.battle.update(dt);
      }
      this.draw();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  draw() {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    if (this.scene === 'title' || this.scene === 'ending') {
      drawTitleScene(ctx, this.time);
      return;
    }
    if (this.scene === 'battle' && this.battle) {
      this.battle.draw(ctx, this.time);
      return;
    }
    ctx.save();
    if (this.shakeAmount > 0) {
      ctx.translate((Math.random() - .5) * this.shakeAmount, (Math.random() - .5) * this.shakeAmount * .7);
      this.shakeAmount = Math.max(0, this.shakeAmount - 1.6);
    }
    drawWorld(ctx, this, this.time);
    ctx.restore();
  }

  /* ---------------------------------------------------------------- */
  /* Title / overlays                                                  */
  /* ---------------------------------------------------------------- */

  showTitle() {
    this.scene = 'title';
    this.el.title.classList.remove('hidden', 'leaving');
    this.el.hud.classList.add('hidden');
    this.el.touch.classList.add('hidden');
    this.el.dialogue.classList.add('hidden');
    this.el.battleUi?.classList.add('hidden');
    this.hideAllOverlays();
    this.updateTitleScreen();
    this.updateControls();
    this.audio.playMusic('title');
  }

  hideAllOverlays() {
    for (const id of ['menu-overlay', 'shop-overlay', 'help-overlay', 'chapter-card', 'ending-screen', 'defeat-overlay']) {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    }
    if (this.el.dialogue) this.el.dialogue.classList.add('hidden');
    if (this.el.fade) this.el.fade.classList.remove('visible', 'white');
  }

  updateTitleScreen() {
    const save = this.readSaveMeta();
    if (this.el.continueBtn) {
      this.el.continueBtn.disabled = !save;
      this.el.continueBtn.textContent = save ? `Continuar · ${save.chapterLabel || 'Capítulo salvo'}` : 'Continuar';
    }
    if (this.el.soundBtn) this.el.soundBtn.textContent = `Som: ${this.audio.enabled ? 'ligado' : 'desligado'}`;
  }

  showOverlay(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('hidden');
    if (id === 'help-overlay') this.storyBusy = true;
  }

  closeOverlay(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('hidden');
    if (id === 'help-overlay') this.storyBusy = false;
    if (id === 'menu-overlay') { this.menuOpen = false; }
    if (id === 'shop-overlay') { this.shopOpen = false; }
    this.updateControls();
  }

  toggleSound() {
    this.audio.unlock();
    this.audio.setEnabled(!this.audio.enabled);
    if (this.audio.enabled) this.audio.playMusic(this.scene === 'title' ? 'title' : this.musicForScene());
    this.updateTitleScreen();
    this.showToast(this.audio.enabled ? 'Som ativado' : 'Som desativado');
  }

  async newGame() {
    this.audio.unlock();
    this.audio.sfx('confirm');
    this.el.title.classList.add('leaving');
    this.showFade(true);
    await wait(650);
    this.el.title.classList.add('hidden');
    this.el.title.classList.remove('leaving');
    this.resetState();
    this.startMap('bruma', { x: 5, y: 11, dir: 'down' });
    this.scene = 'world';
    this.updateControls();
    this.audio.playMusic('village');
    this.showFade(false);
    await wait(450);
    await this.chapterCard('prologue');
    await this.showDialogue([
      { narration: true, text: 'Bruma, vila dos ferreiros. Noite da Colheita.' },
      { narration: true, text: 'O ar cheira a maçã assada, ferro quente e promessas que ninguém ousa dizer em voz alta.' },
      { speaker: 'Kael', portrait: 'kael', mood: 'smile', text: 'Três anos economizando para este anel. Se ela disser não, eu pelo menos morro com estilo.' },
      { narration: true, text: 'Ao longe, a fonte brilha. Lyra espera. Darian já está por perto, como sempre.' },
      { speaker: 'Kael', portrait: 'kael', text: 'Hoje eu peço Lyra em casamento. E amanhã... amanhã a gente sai de Bruma.' }
    ]);
    this.setObjective('Fale com Lyra na fonte da praça.');
    this.saveGame(true);
    this.updateControls();
  }

  readSaveMeta() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const save = JSON.parse(raw);
      const chapterLabel = CHAPTERS[save.chapter]?.title || 'Jornada';
      return { ...save, chapterLabel };
    } catch { return null; }
  }

  async loadGame() {
    const save = this.readSaveMeta();
    if (!save) return;
    this.audio.unlock();
    this.audio.sfx('confirm');
    this.el.title.classList.add('leaving');
    this.showFade(true);
    await wait(550);
    this.el.title.classList.add('hidden');
    this.el.title.classList.remove('leaving');
    this.restoreSave(save);
    this.scene = 'world';
    this.startMap(save.mapId, save.spawn);
    this.showFade(false);
    await wait(350);
    this.updateControls();
    this.audio.playMusic(this.musicForScene());
    this.showToast(`Bem-vindo de volta, ${this.party[0]?.name || 'Kael'}.`);
  }

  showFade(on) {
    this.el.fade.classList.toggle('visible', on);
  }

  async flashWhite(ms = 220) {
    this.el.fade.classList.add('white', 'visible');
    await wait(ms);
    this.el.fade.classList.remove('visible');
    await wait(520);
    this.el.fade.classList.remove('white');
  }

  shake(amount = 14) {
    this.shakeAmount = amount;
  }

  showToast(text, ms = 2300) {
    if (!text) return;
    this.el.toast.textContent = text;
    this.el.toast.classList.add('visible');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.el.toast.classList.remove('visible'), ms);
  }

  /* ---------------------------------------------------------------- */
  /* Map / movement                                                    */
  /* ---------------------------------------------------------------- */

  startMap(mapId, spawn) {
    this.mapId = mapId;
    this.mapDef = MAPS[mapId];
    const sp = spawn || this.mapDef.spawn;
    this.player = this.makePlayer(sp.x, sp.y, sp.dir || 'down');
    this.player.char = 'kael';
    this.scene = 'world';
    this.storyBusy = false;
    this.menuOpen = false;
    this.shopOpen = false;
    this.buildFollowers();
    this.updateHUD();
    this.updateControls();
    this.showLocationCard();
    this.updateInteractHint();
  }

  buildFollowers() {
    if (this.mapDef.noFollowers) {
      this.followers = [];
      return;
    }
    const ids = this.party.filter(m => m.id !== 'kael').map(m => m.id);
    const dx = this.player.dir === 'left' ? 1 : this.player.dir === 'right' ? -1 : 0;
    const dy = this.player.dir === 'up' ? 1 : this.player.dir === 'down' ? -1 : 0;
    this.trail = [];
    for (let i = 1; i <= Math.max(8, ids.length * 2 + 2); i++) {
      this.trail.push({
        x: this.player.px + dx * TILE * i,
        y: this.player.py + dy * TILE * i,
        dir: this.player.dir
      });
    }
    this.followers = ids.map((id, i) => ({
      id,
      char: id,
      px: this.trail[i]?.x ?? this.player.px,
      py: this.trail[i]?.y ?? this.player.py,
      dir: this.trail[i]?.dir ?? this.player.dir,
      frame: 0
    }));
  }

  updateFollowers(oldPx, oldPy, dir) {
    if (!this.followers.length) return;
    this.trail.unshift({ x: oldPx, y: oldPy, dir });
    if (this.trail.length > 16) this.trail.pop();
    this.followers.forEach((f, i) => {
      const p = this.trail[i] || this.trail[this.trail.length - 1];
      if (p) { f.px = p.x; f.py = p.y; f.dir = p.dir; f.frame = 0; }
    });
  }

  showLocationCard() {
    if (!this.mapDef) return;
    this.el.locationRegion.textContent = this.mapDef.region;
    this.el.locationName.textContent = this.mapDef.name;
    this.el.locationCard.classList.add('visible');
    clearTimeout(this.locationTimer);
    this.locationTimer = setTimeout(() => this.el.locationCard.classList.remove('visible'), 3800);
  }

  canControl() {
    return this.scene === 'world' && !this.storyBusy && !this.dialogueActive &&
      !this.menuOpen && !this.shopOpen && !this.chapterOpen && !this.defeatVisible;
  }

  updateWorld(dt) {
    if (!this.player) return;
    if (this.player.moving) {
      this.player.progress += dt / .145;
      const p = Math.min(1, this.player.progress);
      const e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      this.player.px = this.player.fromPx + (this.player.toPx - this.player.fromPx) * e;
      this.player.py = this.player.fromPy + (this.player.toPy - this.player.fromPy) * e;
      this.player.frame = 1;
      if (p >= 1) {
        const oldPx = this.player.fromPx;
        const oldPy = this.player.fromPy;
        this.player.moving = false;
        this.player.progress = 0;
        this.player.px = this.player.toPx;
        this.player.py = this.player.toPy;
        this.player.x = Math.round((this.player.px - 16) / TILE);
        this.player.y = Math.round(this.player.py / TILE);
        this.player.frame = 0;
        this.steps++;
        this.updateFollowers(oldPx, oldPy, this.player.dir);
        if (this.time - this.lastStepSound > .22) {
          this.audio.sfx('step');
          this.lastStepSound = this.time;
        }
        this.afterStep();
      }
    } else if (this.canControl()) {
      const dir = this.inputDirection();
      if (dir) {
        this.player.dir = dir;
        const [dx, dy] = this.dirVec(dir);
        const nx = this.player.x + dx;
        const ny = this.player.y + dy;
        if (this.canWalk(nx, ny)) this.startStep(nx, ny);
        else this.player.frame = 0;
      }
    }
    this.updateInteractHint();
  }

  inputDirection() {
    const k = this.keys;
    if (this.touchDirs.has('up') || k['w'] || k['arrowup']) return 'up';
    if (this.touchDirs.has('down') || k['s'] || k['arrowdown']) return 'down';
    if (this.touchDirs.has('left') || k['a'] || k['arrowleft']) return 'left';
    if (this.touchDirs.has('right') || k['d'] || k['arrowright']) return 'right';
    return null;
  }

  dirVec(dir) {
    return dir === 'up' ? [0, -1] : dir === 'down' ? [0, 1] : dir === 'left' ? [-1, 0] : [1, 0];
  }

  startStep(nx, ny) {
    const p = this.player;
    p.fromPx = p.px;
    p.fromPy = p.py;
    p.toPx = nx * TILE + 16;
    p.toPy = ny * TILE;
    p.moving = true;
    p.progress = 0;
    p.frame = 1;
  }

  canWalk(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= 32 || ty >= 18) return false;
    const ch = this.mapDef.tiles[ty]?.[tx] || '#';
    if (SOLID_TILES.has(ch)) return false;
    for (const p of this.mapDef.props) {
      if (!p.solid) continue;
      if (tx >= p.x && tx < p.x + (p.w || 1) && ty >= p.y && ty < p.y + (p.h || 1)) return false;
    }
    for (const n of this.mapDef.npcs) {
      if (this.hiddenNpcs.has(n.id)) continue;
      if (n.x === tx && n.y === ty) return false;
    }
    return true;
  }

  afterStep() {
    const px = this.player.x;
    const py = this.player.y;
    for (const t of this.mapDef.triggers || []) {
      if (this.firedTriggers.has(t.id)) continue;
      if (!this.triggerAllowed(t)) continue;
      if (px >= t.x && px < t.x + (t.w || 1) && py >= t.y && py < t.y + (t.h || 1)) {
        this.firedTriggers.add(t.id);
        this.runTrigger(t);
        return;
      }
    }
  }

  triggerAllowed(t) {
    if (t.action === 'toCamp') return !!this.flags.brannJoined;
    if (t.action === 'prisonEscape') return !!this.flags.wardenDefeated;
    if (t.action === 'darianBattle') return !!this.flags.vossDefeated && !this.flags.darianDefeated;
    if (t.action === 'lyraBattle') return !!this.flags.darianDefeated && !this.flags.lyraDefeated;
    return true;
  }

  runTrigger(t) {
    if (this.storyBusy) return;
    this.storyBusy = true;
    const actions = {
      prisonGuard1: () => this.storyPrisonGuard1(),
      prisonGuard2: () => this.storyPrisonGuard2(),
      wolves: () => this.storyWolves(),
      toCamp: () => this.storyEnterCamp(),
      prisonEscape: () => this.storyPrisonEscape(),
      vossBattle: () => this.storyVoss(),
      darianBattle: () => this.storyDarian(),
      lyraBattle: () => this.storyLyra()
    };
    const fn = actions[t.action];
    if (!fn) { this.storyBusy = false; return; }
    Promise.resolve(fn()).catch(err => {
      console.error(err);
      this.storyBusy = false;
      this.showToast('Algo interrompeu a história. Tente novamente.');
    }).finally(() => {
      if (this.scene !== 'battle') this.storyBusy = false;
      this.updateControls();
    });
  }

  facingTarget() {
    const [dx, dy] = this.dirVec(this.player.dir);
    return { x: this.player.x + dx, y: this.player.y + dy };
  }

  npcAt(tx, ty) {
    return this.mapDef.npcs.find(n => !this.hiddenNpcs.has(n.id) && n.x === tx && n.y === ty) || null;
  }

  propAt(tx, ty) {
    return this.mapDef.props.find(p => tx >= p.x && tx < p.x + (p.w || 1) && ty >= p.y && ty < p.y + (p.h || 1)) || null;
  }

  updateInteractHint() {
    if (!this.el.interactHint) return;
    if (!this.canControl()) {
      this.el.interactHint.classList.remove('visible');
      this.nearNpc = null;
      return;
    }
    const t = this.facingTarget();
    const npc = this.npcAt(t.x, t.y);
    const prop = this.propAt(t.x, t.y);
    let text = '';
    if (npc) {
      this.nearNpc = npc;
      text = `<kbd>E</kbd> conversar com ${npc.name}`;
    } else {
      this.nearNpc = null;
      if (prop) {
        if (prop.type === 'chest') text = '<kbd>E</kbd> abrir baú';
        else if (prop.type === 'forge') text = '<kbd>E</kbd> usar a forja';
        else if (prop.type === 'stall') text = '<kbd>E</kbd> negociar';
        else if (prop.type === 'campfire') text = '<kbd>E</kbd> descansar';
        else if (prop.type === 'bedroll') text = '<kbd>E</kbd> salvar e descansar';
        else if (prop.type === 'shrine') text = '<kbd>E</kbd> rezar';
        else if (prop.type === 'stairs') text = '<kbd>E</kbd> descer';
      }
    }
    this.el.interactHint.innerHTML = text;
    this.el.interactHint.classList.toggle('visible', !!text);
  }

  interact() {
    if (!this.canControl()) return;
    const t = this.facingTarget();
    const npc = this.npcAt(t.x, t.y);
    if (npc) { this.talkTo(npc); return; }
    const prop = this.propAt(t.x, t.y);
    if (prop) this.propAction(prop);
  }

  /* ---------------------------------------------------------------- */
  /* Dialogue                                                          */
  /* ---------------------------------------------------------------- */

  showDialogue(lines) {
    const normalized = lines.map(l => typeof l === 'string' ? { text: l } : l);
    return new Promise(resolve => {
      this.dialogueState = { lines: normalized, index: -1, resolve, typing: false, choices: false };
      this.dialogueActive = true;
      this.el.dialogue.classList.remove('hidden');
      this.el.dialogueChoices.innerHTML = '';
      this.updateControls();
      this.nextDialogueLine();
    });
  }

  nextDialogueLine() {
    const st = this.dialogueState;
    if (!st) return;
    st.index++;
    if (st.index >= st.lines.length) {
      this.endDialogue();
      return;
    }
    const line = st.lines[st.index];
    this.el.dialogueChoices.innerHTML = '';
    st.choices = false;
    const speaker = line.speaker || '';
    const portrait = line.portrait || (line.speaker ? this.portraitForName(line.speaker) : null);
    const narration = line.narration || !speaker;
    this.el.dialogueFrame.classList.toggle('narration', narration);
    this.el.portraitWrap.style.visibility = narration || !portrait ? 'hidden' : 'visible';
    this.el.dialogueName.textContent = speaker;
    this.el.dialogueName.style.display = speaker ? 'inline-block' : 'none';
    this.el.dialogueText.classList.toggle('narration', !!narration);
    this.el.dialogueContinue.textContent = line.choices ? '✦' : '▼';
    if (portrait && !narration) drawPortrait(this.el.portrait, portrait, line.mood || 'neutral');
    if (line.onShow) line.onShow();
    const full = line.text || '';
    let i = 0;
    clearInterval(this.typeTimer);
    st.typing = true;
    this.el.dialogueText.textContent = '';
    const speed = line.slow ? 42 : 17;
    this.typeTimer = setInterval(() => {
      i += 1;
      this.el.dialogueText.textContent = full.slice(0, i);
      if (i % 3 === 0) this.audio.sfx('blip');
      if (i >= full.length) {
        clearInterval(this.typeTimer);
        st.typing = false;
        this.finishTypewriter(line);
      }
    }, speed);
  }

  finishTypewriter(line) {
    const st = this.dialogueState;
    if (!st) return;
    st.typing = false;
    clearInterval(this.typeTimer);
    const l = line || st.lines[st.index];
    this.el.dialogueText.textContent = l?.text || '';
    if (l?.choices?.length) {
      st.choices = true;
      this.el.dialogueChoices.innerHTML = '';
      for (const choice of l.choices) {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.textContent = choice.text;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.audio.sfx('confirm');
          this.endDialogue(choice.value);
        });
        this.el.dialogueChoices.appendChild(btn);
      }
      this.el.dialogueContinue.textContent = '✦';
    }
  }

  advanceDialogue() {
    const st = this.dialogueState;
    if (!st) return;
    if (st.typing) {
      clearInterval(this.typeTimer);
      this.finishTypewriter();
      return;
    }
    if (st.choices) return;
    this.audio.sfx('click');
    this.nextDialogueLine();
  }

  endDialogue(value) {
    clearInterval(this.typeTimer);
    const st = this.dialogueState;
    this.dialogueState = null;
    this.dialogueActive = false;
    this.el.dialogue.classList.add('hidden');
    this.updateControls();
    if (st?.resolve) st.resolve(value);
  }

  portraitForName(name) {
    const map = {
      Kael: 'kael', Mira: 'mira', Brann: 'brann', Lyra: 'lyra', Darian: 'darian',
      'Dona Maren': 'elder', Tio: 'child', Nessa: 'merchant', 'Guarda da Vila': 'guard',
      'Carcereiro Gorr': 'guard', 'Inquisidor Voss': 'voss', 'Velho Orin': 'elder',
      'Ferreiro Tull': 'smith', Viajante: 'wanderer', Prisioneiro: 'prisoner'
    };
    return map[name] || null;
  }

  chapterCard(key) {
    const ch = CHAPTERS[key] || CHAPTERS.prologue;
    this.el.chapterKicker.textContent = ch.kicker;
    this.el.chapterTitle.textContent = ch.title;
    this.el.chapterQuote.textContent = ch.quote;
    this.el.chapter.classList.remove('hidden');
    this.chapterOpen = true;
    this.updateControls();
    return new Promise(resolve => {
      let done = false;
      this.chapterResolve = () => {
        if (done) return;
        done = true;
        this.el.chapter.classList.add('hidden');
        this.chapterOpen = false;
        this.chapterResolve = null;
        clearTimeout(this.chapterTimer);
        this.updateControls();
        resolve();
      };
      clearTimeout(this.chapterTimer);
      this.chapterTimer = setTimeout(() => this.finishChapter(), 8500);
    });
  }

  finishChapter() {
    if (this.chapterResolve) this.chapterResolve();
  }

  /* ---------------------------------------------------------------- */
  /* Battle runner                                                     */
  /* ---------------------------------------------------------------- */

  async battleSequence(encounter, onWin) {
    this.currentBattle = {
      encounter,
      onWin,
      snapshot: this.makeSnapshot()
    };
    this.storyBusy = true;
    const result = await this.runBattle(encounter, onWin);
    if (result !== 'defeat') this.storyBusy = false;
    return result;
  }

  async runBattle(encounter, onWin) {
    this.el.defeat.classList.add('hidden');
    this.defeatVisible = false;
    this.el.dialogue.classList.add('hidden');
    this.el.hud.classList.add('hidden');
    this.el.touch.classList.add('hidden');
    this.el.interactHint.classList.remove('visible');
    this.el.menuBtn.disabled = true;
    this.scene = 'battle';
    this.battle = new Battle(this, encounter);
    this.battle.bindUi();
    this.updateControls();
    const result = await this.battle.run();
    const battleHeroes = this.battle.heroes;
    this.battle = null;
    this.el.menuBtn.disabled = false;
    if (result === 'defeat') {
      this.scene = 'defeat';
      this.defeatVisible = true;
      this.storyBusy = true;
      this.el.defeat.classList.remove('hidden');
      this.updateControls();
      return 'defeat';
    }
    this.scene = 'world';
    this.defeatVisible = false;
    if (result === 'flee') this.syncPartyFromBattle(battleHeroes);
    this.updateHUD();
    this.updateControls();
    this.audio.playMusic(this.musicForScene());
    if (result === 'win') {
      this.battlesWon++;
      if (onWin) await onWin();
    }
    return result;
  }

  async retryBattle() {
    if (!this.currentBattle) { this.returnToTitle(); return; }
    this.el.defeat.classList.add('hidden');
    this.defeatVisible = false;
    this.restoreSnapshot(this.currentBattle.snapshot);
    this.storyBusy = true;
    this.scene = 'world';
    const result = await this.runBattle(this.currentBattle.encounter, this.currentBattle.onWin);
    if (result !== 'defeat') this.storyBusy = false;
  }

  makeSnapshot() {
    return {
      party: JSON.parse(JSON.stringify(this.party)),
      inventory: { ...this.inventory },
      gold: this.gold
    };
  }

  restoreSnapshot(snap) {
    this.party = JSON.parse(JSON.stringify(snap.party));
    this.inventory = { ...snap.inventory };
    this.gold = snap.gold;
    this.updateHUD();
  }

  syncPartyFromBattle(heroes) {
    for (const h of heroes) {
      const m = this.party.find(p => p.id === h.id);
      if (!m) continue;
      const hpDelta = Math.max(0, m.maxHp - (h.maxHp || m.maxHp));
      const mpDelta = Math.max(0, m.maxMp - (h.maxMp || m.maxMp));
      m.hp = clamp(Math.round((h.hp || 0) + hpDelta), 0, m.maxHp);
      m.mp = clamp(Math.round((h.mp || 0) + mpDelta), 0, m.maxMp);
    }
    this.updateHUD();
  }

  /* ---------------------------------------------------------------- */
  /* Save / load                                                       */
  /* ---------------------------------------------------------------- */

  saveGame(silent = false) {
    try {
      const save = {
        version: 1,
        timestamp: Date.now(),
        mapId: this.mapId,
        spawn: { x: this.player.x, y: this.player.y, dir: this.player.dir },
        party: this.party,
        gold: this.gold,
        inventory: this.inventory,
        flags: this.flags,
        chapter: this.chapter,
        objective: this.objective,
        hiddenNpcs: [...this.hiddenNpcs],
        openedChests: [...this.openedChests],
        firedTriggers: [...this.firedTriggers],
        upgrades: this.upgrades,
        loreUnlocked: [...this.loreUnlocked],
        playTime: this.playTime,
        steps: this.steps,
        battlesWon: this.battlesWon
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
      if (!silent) this.showToast('Progresso salvo.');
      this.updateTitleScreen();
      return true;
    } catch {
      if (!silent) this.showToast('Não foi possível salvar neste navegador.');
      return false;
    }
  }

  restoreSave(save) {
    this.party = save.party || [makeMember('kael', 1)];
    this.gold = save.gold || 0;
    this.inventory = save.inventory || { potion: 2 };
    this.flags = save.flags || {};
    this.chapter = save.chapter || 'prison';
    this.objective = save.objective || '';
    this.hiddenNpcs = new Set(save.hiddenNpcs || []);
    this.openedChests = new Set(save.openedChests || []);
    this.firedTriggers = new Set(save.firedTriggers || []);
    this.upgrades = save.upgrades || {};
    this.loreUnlocked = new Set(save.loreUnlocked || []);
    this.playTime = save.playTime || 0;
    this.steps = save.steps || 0;
    this.battlesWon = save.battlesWon || 0;
    this.updateHUD();
  }

  deleteSave() {
    try { localStorage.removeItem(SAVE_KEY); } catch {}
    this.updateTitleScreen();
  }

  /* ---------------------------------------------------------------- */
  /* Party / HUD                                                       */
  /* ---------------------------------------------------------------- */

  addPartyMember(id, level) {
    if (this.party.some(m => m.id === id)) return this.party.find(m => m.id === id);
    const lvl = level || Math.max(...this.party.map(m => m.level));
    const member = makeMember(id, lvl);
    this.party.push(member);
    this.updateHUD();
    this.buildFollowers();
    return member;
  }

  gainXp(id, amount) {
    const member = this.party.find(m => m.id === id);
    if (!member) return { levels: 0, member: null };
    member.xp = (member.xp || 0) + amount;
    const next = levelFromXp(member.xp);
    if (next <= member.level) return { levels: 0, member };
    const oldLevel = member.level;
    const oldMaxHp = member.maxHp;
    const oldMaxMp = member.maxMp;
    member.level = next;
    const fresh = makeMember(id, next);
    member.maxHp = fresh.maxHp;
    member.maxMp = fresh.maxMp;
    member.stats = fresh.stats;
    if (member.upgraded && UPGRADES[id]) {
      const up = UPGRADES[id].stats;
      for (const [k, v] of Object.entries(up)) {
        if (k === 'hp') member.maxHp += v;
        else if (k === 'mp') member.maxMp += v;
        else member.stats[k] = (member.stats[k] || 0) + v;
      }
    }
    member.hp = clamp(member.hp + (member.maxHp - oldMaxHp), 1, member.maxHp);
    member.mp = clamp(member.mp + (member.maxMp - oldMaxMp), 0, member.maxMp);
    return { levels: next - oldLevel, member };
  }

  addItem(id, count = 1) {
    this.inventory[id] = (this.inventory[id] || 0) + count;
  }

  healParty() {
    for (const m of this.party) {
      m.hp = m.maxHp;
      m.mp = m.maxMp;
    }
    this.updateHUD();
  }

  setObjective(text) {
    this.objective = text;
    this.el.objective.textContent = text;
  }

  updateHUD() {
    if (!this.el?.partyHud) return;
    this.el.partyHud.innerHTML = this.party.map(m => {
      const hp = Math.max(0, Math.round(m.hp / m.maxHp * 100));
      const mp = Math.max(0, Math.round(m.mp / m.maxMp * 100));
      return `<div class="party-card">
        <div class="p-avatar"><canvas width="40" height="40" data-hud="${m.id}"></canvas></div>
        <div><div class="p-name">${m.name}</div><div class="p-level">Nv. ${m.level} · ${m.role.split(' ')[0]}</div></div>
        <div class="p-bars"><div class="p-bar hp"><i style="width:${hp}%"></i></div><div class="p-bar mp"><i style="width:${mp}%"></i></div></div>
      </div>`;
    }).join('');
    for (const cv of this.el.partyHud.querySelectorAll('canvas[data-hud]')) {
      drawPortrait(cv, cv.dataset.hud);
    }
    this.el.objective.textContent = this.objective;
    this.el.gold.textContent = this.gold;
  }

  updateControls() {
    if (!this.el) return;
    const world = this.scene === 'world';
    this.el.hud.classList.toggle('hidden', !world);
    const touchOn = world && !this.dialogueActive && !this.menuOpen && !this.shopOpen && !this.chapterOpen;
    this.el.touch.classList.toggle('hidden', !touchOn);
    this.el.interactHint.classList.toggle('hidden', !world);
  }

  musicForScene() {
    if (this.scene === 'title' || this.scene === 'ending') return 'title';
    const map = this.mapDef?.id;
    return { bruma: 'village', prison: 'prison', forest: 'forest', camp: 'camp', castle: 'castle' }[map] || 'village';
  }

  npcMarker(id) {
    if (id === 'lyra') return !this.flags.betrayal && this.chapter === 'prologue';
    if (id === 'brann_forest') return !this.flags.brannJoined;
    if (id === 'brann_camp') return !this.flags.departed;
    if (id === 'voss' || id === 'darian_castle' || id === 'lyra_castle') return true;
    return false;
  }

  /* ---------------------------------------------------------------- */
  /* Input                                                             */
  /* ---------------------------------------------------------------- */

  onKeyDown(e) {
    const key = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) e.preventDefault();
    this.keys[key] = true;
    if (this.chapterOpen) {
      if (key === 'enter' || key === ' ' || key === 'e') this.finishChapter();
      return;
    }
    if (this.defeatVisible) {
      if (key === 'enter' || key === ' ') this.retryBattle();
      return;
    }
    if (this.dialogueActive) {
      if (key === 'enter' || key === ' ' || key === 'e') this.advanceDialogue();
      return;
    }
    if (this.menuOpen) {
      if (key === 'm' || key === 'escape') this.closeOverlay('menu-overlay');
      return;
    }
    if (this.shopOpen) {
      if (key === 'escape' || key === 'm') this.closeOverlay('shop-overlay');
      return;
    }
    if (this.scene === 'battle') return;
    if (this.scene === 'title') {
      if (key === 'enter') {
        if (this.readSaveMeta()) this.loadGame();
        else this.newGame();
      }
      return;
    }
    if (this.scene === 'ending') {
      if (key === 'enter' || key === ' ') this.returnToTitle();
      return;
    }
    if (this.scene !== 'world') return;
    if (key === 'e' || key === ' ') {
      if (!e.repeat) this.interact();
      return;
    }
    if (key === 'm' || key === 'escape') {
      this.openMenu();
    }
  }

  returnToTitle() {
    this.scene = 'title';
    this.storyBusy = false;
    this.defeatVisible = false;
    this.dialogueActive = false;
    this.dialogueState = null;
    this.menuOpen = false;
    this.shopOpen = false;
    this.chapterOpen = false;
    this.menuItemTarget = null;
    clearInterval(this.typeTimer);
    clearTimeout(this.chapterTimer);
    this.hideAllOverlays();
    if (this.el.battleUi) this.el.battleUi.classList.add('hidden');
    this.el.title.classList.remove('hidden', 'leaving');
    this.el.hud.classList.add('hidden');
    this.el.touch.classList.add('hidden');
    this.updateControls();
    this.updateTitleScreen();
    this.audio.playMusic('title');
  }
}

Object.assign(Game.prototype, storyMethods, menuMethods);
