// util.js — small helpers, input, storage
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
export const randInt = (a, b) => Math.floor(rand(a, b + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const chance = (p) => Math.random() < p;
export const wait = (ms) => new Promise((res) => setTimeout(res, ms));
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function hash2(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177 | 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function formatTime(sec) {
  sec = Math.floor(sec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}

// ---------------- Input ----------------
const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  Space: 'confirm', Enter: 'confirm', KeyZ: 'confirm', KeyE: 'confirm', KeyJ: 'confirm',
  Escape: 'cancel', KeyX: 'cancel', Backspace: 'cancel', KeyK: 'cancel',
  KeyM: 'menu',
};

export const Input = {
  held: new Set(),
  touchHeld: new Set(),
  handlers: [],
  exploreAction: null,
  enabled: true,
  repeatAt: 0,

  init() {
    window.addEventListener('keydown', (e) => {
      const action = KEYMAP[e.code];
      if (!action) return;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
      if (e.repeat) {
        const dir = ['up','down','left','right'].includes(action);
        if (!dir) return;
        const now = performance.now();
        if (now - this.repeatAt < 110) return;
        this.repeatAt = now;
      }
      this.held.add(action);
      this.dispatch(action, e);
    });
    window.addEventListener('keyup', (e) => {
      const action = KEYMAP[e.code];
      if (action) this.held.delete(action);
    });
    window.addEventListener('blur', () => { this.held.clear(); this.touchHeld.clear(); });
  },

  dispatch(action, e) {
    if (!this.enabled) return;
    for (let i = this.handlers.length - 1; i >= 0; i--) {
      const h = this.handlers[i];
      if (h(action, e)) return;
    }
    if (this.exploreAction) this.exploreAction(action, e);
  },

  push(fn) { this.handlers.push(fn); return () => this.pop(fn); },
  pop(fn) {
    const i = this.handlers.lastIndexOf(fn);
    if (i >= 0) this.handlers.splice(i, 1);
  },
  clear() { this.handlers.length = 0; },

  isDown(action) {
    if (this.held.has(action) || this.touchHeld.has(action)) return true;
    if (action === 'up') return this.held.has('ArrowUp');
    return false;
  },

  touchDown(dir) {
    this.touchHeld.add(dir);
    this.dispatch(dir);
  },
  touchUp(dir) { this.touchHeld.delete(dir); },
  clearTouch() { this.touchHeld.clear(); },
};

// ---------------- Storage ----------------
export const Store = {
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { return false; }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch {}
  },
};

// ---------------- Canvas helpers ----------------
export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  return { c, g };
}

export function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
