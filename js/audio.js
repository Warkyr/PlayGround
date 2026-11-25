const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);

const THEMES = {
  title: { bpm: 54, root: 50, scale: [0, 2, 3, 7, 8, 10], pad: [0, 7, 12, 15], pattern: [0, 3, 7, 3, 10, 7, 3, 0], wave: 'sine', padWave: 'triangle', volume: .16 },
  village: { bpm: 78, root: 55, scale: [0, 2, 4, 7, 9, 12], pad: [0, 7, 12], pattern: [0, 4, 7, 9, 7, 4, 2, 4], wave: 'triangle', padWave: 'sine', volume: .14 },
  prison: { bpm: 48, root: 45, scale: [0, 1, 3, 5, 7, 8], pad: [0, 1, 7], pattern: [0, 3, 0, 5, 3, 0, 1, 0], wave: 'sawtooth', padWave: 'sine', volume: .11 },
  forest: { bpm: 66, root: 52, scale: [0, 2, 3, 7, 9, 10], pad: [0, 7, 12, 14], pattern: [0, 7, 3, 10, 7, 12, 10, 7], wave: 'sine', padWave: 'triangle', volume: .12 },
  camp: { bpm: 72, root: 53, scale: [0, 2, 4, 7, 9, 11], pad: [0, 7, 12], pattern: [0, 4, 7, 11, 9, 7, 4, 2], wave: 'triangle', padWave: 'sine', volume: .13 },
  castle: { bpm: 60, root: 46, scale: [0, 1, 4, 5, 7, 8], pad: [0, 5, 8, 12], pattern: [0, 5, 8, 4, 1, 8, 5, 0], wave: 'sawtooth', padWave: 'triangle', volume: .13 },
  battle: { bpm: 112, root: 48, scale: [0, 2, 3, 5, 7, 8, 10], pad: [0, 3, 7], pattern: [0, 7, 3, 10, 7, 12, 10, 7], wave: 'square', padWave: 'sawtooth', volume: .1 },
  boss: { bpm: 126, root: 43, scale: [0, 1, 3, 5, 7, 8, 11], pad: [0, 1, 7, 8], pattern: [0, 7, 1, 8, 3, 10, 7, 1], wave: 'sawtooth', padWave: 'square', volume: .11 },
  victory: { bpm: 96, root: 55, scale: [0, 2, 4, 7, 9, 12], pad: [0, 4, 7, 12], pattern: [0, 4, 7, 12, 7, 4, 0, 7], wave: 'triangle', padWave: 'sine', volume: .14 }
};

export class AudioManager {
  constructor() {
    this.enabled = true;
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.timer = null;
    this.theme = null;
    this.step = 0;
    this.nextTime = 0;
    this.nodes = new Set();
    this.delay = null;
  }

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -22;
      comp.ratio.value = 5;
      this.master = this.ctx.createGain();
      this.master.gain.value = this.enabled ? .55 : 0;
      this.master.connect(comp).connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = .22;
      this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = .5;
      this.sfxGain.connect(this.master);
      this.delay = this.ctx.createDelay(.5);
      this.delay.delayTime.value = .24;
      const fb = this.ctx.createGain();
      fb.gain.value = .28;
      this.delay.connect(fb).connect(this.delay);
      this.delay.connect(this.musicGain);
      this.applyEnabled();
      if (this.theme) this.playMusic(this.theme, true);
    } catch {
      this.ctx = null;
    }
  }

  setEnabled(on) {
    this.enabled = on;
    this.applyEnabled();
    if (on) this.unlock();
  }

  applyEnabled() {
    if (!this.master || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(this.enabled ? .55 : 0, now, .08);
  }

  playMusic(name, force = false) {
    if (!this.ctx) { this.theme = name; return; }
    if (!force && this.theme === name) return;
    this.stopMusic();
    this.theme = name;
    const theme = THEMES[name];
    if (!theme) return;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + .1;
    const play = () => {
      if (!this.ctx || this.theme !== name) return;
      while (this.nextTime < this.ctx.currentTime + .35) {
        this.scheduleStep(theme, this.step, this.nextTime);
        this.step++;
        this.nextTime += 60 / theme.bpm / 2;
      }
    };
    play();
    this.timer = setInterval(play, 120);
    // pad chord
    this.pad(theme);
  }

  stopMusic() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (this.musicGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.setTargetAtTime(0.0001, now, .12);
      const old = this.musicGain;
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0;
      this.musicGain.connect(this.master);
      setTimeout(() => {
        try { old.disconnect(); } catch {}
        if (this.musicGain) this.musicGain.gain.setTargetAtTime(.22, this.ctx.currentTime, .2);
      }, 700);
    }
    for (const node of this.nodes) {
      try { node.stop(this.ctx.currentTime + .5); } catch {}
    }
    this.nodes.clear();
  }

  scheduleStep(theme, step, time) {
    if (!this.ctx) return;
    const pattern = theme.pattern;
    const deg = pattern[step % pattern.length];
    const octave = step % 16 < 8 ? 0 : 12;
    const note = theme.root + theme.scale[deg % theme.scale.length] + octave;
    const dur = 60 / theme.bpm / 2;
    this.tone(NOTE(note), time, dur * .9, theme.wave, theme.volume * .24, this.musicGain, true);
    if (step % 4 === 0) {
      this.tone(NOTE(theme.root - 12), time, dur * 2.4, 'sine', theme.volume * .22, this.musicGain, false);
    }
    if (step % 8 === 4 && theme.pad.length > 2) {
      this.tone(NOTE(theme.root + theme.scale[theme.pad[2] % theme.scale.length] + 12), time, dur * 1.5, 'sine', theme.volume * .08, this.musicGain, true);
    }
  }

  pad(theme) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const root = theme.root;
    theme.pad.forEach((deg, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 600 + i * 120;
      osc.type = theme.padWave;
      osc.frequency.value = NOTE(root + theme.scale[deg % theme.scale.length] + (i === 0 ? -12 : 0));
      osc.detune.value = (i % 2 ? 4 : -4);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(theme.volume * .04, now + 1.8);
      gain.gain.setTargetAtTime(theme.volume * .025, now + 2.2, 1.8);
      osc.connect(filter).connect(gain).connect(this.musicGain);
      osc.start(now);
      this.nodes.add(osc);
    });
  }

  tone(freq, time, dur, type, volume, dest, echo = false) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = Math.max(800, freq * 5);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0002, volume), time + .015);
    gain.gain.exponentialRampToValueAtTime(.0001, time + dur);
    osc.connect(filter).connect(gain);
    gain.connect(dest);
    if (echo && this.delay) gain.connect(this.delay);
    osc.start(time);
    osc.stop(time + dur + .05);
    osc.onended = () => { try { osc.disconnect(); gain.disconnect(); filter.disconnect(); } catch {} };
  }

  sfx(name) {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;
    const map = {
      click: [520, .06, 'square', .07, 0],
      confirm: [660, .1, 'triangle', .09, 220],
      cancel: [280, .09, 'triangle', .07, -80],
      step: [160, .03, 'sine', .02, 0],
      blip: [720, .025, 'square', .018, 0],
      hit: [110, .18, 'sawtooth', .16, -50],
      slash: [780, .14, 'sawtooth', .11, -500],
      magic: [980, .32, 'sine', .09, 300],
      heal: [880, .38, 'sine', .08, 300],
      shield: [440, .3, 'triangle', .07, 180],
      hurt: [85, .2, 'square', .12, -40],
      victory: [523, .5, 'triangle', .12, 260],
      defeat: [130, .8, 'sawtooth', .12, -60],
      chest: [740, .18, 'triangle', .1, 180],
      levelup: [660, .55, 'sine', .11, 420],
      boss: [65, .6, 'sawtooth', .15, 10]
    };
    const s = map[name] || map.click;
    const [freq, dur, type, vol, bend] = s;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (bend) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + bend), t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(.0001, t + dur);
    osc.connect(gain).connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + dur + .02);
    if (name === 'victory' || name === 'levelup') {
      [0, 4, 7, 12].forEach((d, i) => {
        this.tone(NOTE(60 + d), t + i * .11, .35, 'triangle', .06, this.sfxGain, true);
      });
    }
  }
}
