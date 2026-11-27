// audio.js — procedural chiptune music and SFX (WebAudio)
const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const CHORDS = {
  maj: [0, 4, 7], min: [0, 3, 7], dim: [0, 3, 6],
  maj7: [0, 4, 7, 11], min7: [0, 3, 7, 10], sus4: [0, 5, 7], aug: [0, 4, 8],
};
const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);

const TRACKS = {
  title: {
    bpm: 64, prog: [['A', 'min'], ['F', 'maj'], ['C', 'maj'], ['G', 'maj']],
    arp: [0, 1, 2, 1, 0, 2, 3, 2], arpOct: 12, pad: true, bassOct: -12,
    lead: [0, null, 4, null, 7, null, 4, null, 0, null, 4, null, 2, null, 0, null],
    leadType: 'triangle', drums: false, gain: 0.9,
  },
  village: {
    bpm: 100, prog: [['C', 'maj'], ['G', 'maj'], ['A', 'min'], ['F', 'maj']],
    arp: [0, 1, 2, 3, 2, 1, 2, 1], arpOct: 12, pad: true,
    lead: [4, null, 7, 9, null, 7, 4, null, 2, null, 4, 7, null, 4, 2, null],
    leadType: 'square', drums: 'light', gain: 0.75,
  },
  field: {
    bpm: 116, prog: [['D', 'min'], ['B', 'maj'], ['F', 'maj'], ['C', 'maj']],
    arp: [0, 2, 1, 3, 2, 1, 3, 1], arpOct: 12, pad: true,
    lead: [0, 2, 4, null, 7, 4, 2, null, 0, 4, 7, 9, 7, 4, 2, null],
    leadType: 'square', drums: 'light', gain: 0.75,
  },
  snow: {
    bpm: 84, prog: [['A', 'min'], ['E', 'min'], ['F', 'maj'], ['C', 'maj']],
    arp: [0, 1, 2, 1, 3, 2, 1, 2], arpOct: 24, pad: true, arpType: 'sine',
    lead: [7, null, null, 4, null, 2, null, null, 0, null, 2, null, 4, null, 7, null],
    leadType: 'triangle', drums: false, gain: 0.8,
  },
  shrine: {
    bpm: 68, prog: [['A', 'min'], ['F', 'maj'], ['D', 'min'], ['E', 'maj']],
    arp: [0, 2, 1, 2, 0, 2, 3, 2], arpOct: 12, pad: true, arpType: 'sine',
    lead: [0, null, 7, null, 4, null, 2, null, 0, null, 4, null, 7, null, 9, null],
    leadType: 'triangle', drums: false, gain: 0.7,
  },
  prison: {
    bpm: 58, prog: [['D', 'min'], ['B', 'maj'], ['G', 'min'], ['A', 'maj']],
    arp: [0, null, 1, null, 2, null, 1, null], arpOct: 12, pad: true, arpType: 'sine',
    lead: null, leadType: 'triangle', drums: false, gain: 0.85, sparse: true,
  },
  night: {
    bpm: 74, prog: [['D', 'min'], ['A', 'min'], ['B', 'maj'], ['A', 'maj']],
    arp: [0, 1, 2, 1, 3, 2, 1, 0], arpOct: 12, pad: true,
    lead: [0, null, 2, null, 3, null, 2, null, 0, null, -1, null, 0, null, null, null],
    leadType: 'triangle', drums: false, gain: 0.7,
  },
  castle: {
    bpm: 92, prog: [['G', 'min'], ['E', 'maj'], ['C', 'min'], ['D', 'maj']],
    arp: [0, 1, 2, 1, 0, 2, 3, 2], arpOct: 12, pad: true,
    lead: [0, null, 3, null, 7, null, 3, null, 0, null, 6, null, 7, null, 3, null],
    leadType: 'square', drums: 'heavy', gain: 0.72,
  },
  battle: {
    bpm: 150, prog: [['E', 'min'], ['C', 'maj'], ['G', 'maj'], ['D', 'maj']],
    arp: [0, 1, 2, 3, 2, 1, 0, 2], arpOct: 12, pad: false,
    lead: [0, 2, 4, 7, 4, 2, 4, null, 0, 2, 4, 7, 9, 7, 4, null],
    leadType: 'square', drums: 'full', gain: 0.72, bassDrive: true,
  },
  boss: {
    bpm: 138, prog: [['C', 'min'], ['A', 'maj'], ['F', 'min'], ['G', 'maj']],
    arp: [0, 2, 1, 2, 0, 3, 2, 1], arpOct: 12, pad: false,
    lead: [0, 0, 6, 7, 6, 0, 3, null, 0, 6, 7, 11, 7, 6, 3, null],
    leadType: 'sawtooth', drums: 'full', gain: 0.68, bassDrive: true,
  },
  victory: {
    bpm: 120, prog: [['C', 'maj'], ['F', 'maj'], ['G', 'maj'], ['C', 'maj']],
    arp: [0, 1, 2, 3, 2, 1, 2, 3], arpOct: 12, pad: true,
    lead: [0, 4, 7, 12, 7, 4, 7, 12, 7, 11, 14, 19, 14, 11, 7, null],
    leadType: 'square', drums: 'light', gain: 0.8, loop: false,
  },
  ending: {
    bpm: 78, prog: [['F', 'maj'], ['C', 'maj'], ['D', 'min'], ['B', 'maj']],
    arp: [0, 1, 2, 3, 2, 1, 0, 1], arpOct: 12, pad: true,
    lead: [0, null, 4, null, 7, null, 4, 2, 0, null, 4, null, 7, 9, 7, null],
    leadType: 'triangle', drums: false, gain: 0.8,
  },
};

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicBus = null;
    this.sfxBus = null;
    this.delay = null;
    this.track = null;
    this.step = 0;
    this.nextTime = 0;
    this.timer = null;
    this.muted = false;
    this.unlocked = false;
    this.noiseBuf = null;
    this.volume = 0.8;
  }

  unlock() {
    if (this.unlocked) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : this.volume;
      this.master.connect(this.ctx.destination);

      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = 0.34;
      this.musicBus.connect(this.master);

      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = 0.5;
      this.sfxBus.connect(this.master);

      // dreamy feedback delay for arps
      this.delay = this.ctx.createDelay(1.0);
      this.delay.delayTime.value = 0.32;
      const fb = this.ctx.createGain();
      fb.gain.value = 0.26;
      const wet = this.ctx.createGain();
      wet.gain.value = 0.16;
      this.delay.connect(fb); fb.connect(this.delay);
      this.delay.connect(wet); wet.connect(this.musicBus);

      this.noiseBuf = this.makeNoise();
      this.unlocked = true;
      if (this.pendingTrack) {
        const t = this.pendingTrack; this.pendingTrack = null;
        this.playMusic(t);
      }
    } catch (e) { console.warn('Audio unavailable', e); }
  }

  makeNoise() {
    const len = this.ctx.sampleRate * 1.2;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.linearRampToValueAtTime(m ? 0 : this.volume, this.ctx.currentTime + 0.12);
    }
  }

  toggleMuted() { this.setMuted(!this.muted); return this.muted; }

  playMusic(name, opts = {}) {
    if (!name) return;
    if (!this.unlocked) { this.pendingTrack = name; return; }
    if (this.track === name && !opts.restart) return;
    this.stopMusic(0.18);
    const tr = TRACKS[name];
    if (!tr) return;
    this.track = name;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.08;
    this.musicBus.gain.cancelScheduledValues(this.ctx.currentTime);
    this.musicBus.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    this.musicBus.gain.linearRampToValueAtTime(0.34, this.ctx.currentTime + 0.5);
    clearInterval(this.timer);
    this.timer = setInterval(() => this.schedule(), 45);
    this.schedule();
  }

  stopMusic(fade = 0.4) {
    if (!this.ctx) return;
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    if (this.musicBus) {
      this.musicBus.gain.cancelScheduledValues(this.ctx.currentTime);
      this.musicBus.gain.setValueAtTime(this.musicBus.gain.value || 0.0001, this.ctx.currentTime);
      this.musicBus.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + fade);
    }
    this.track = null;
  }

  schedule() {
    if (!this.ctx || !this.track) return;
    const tr = TRACKS[this.track];
    if (!tr) return;
    const stepDur = 60 / tr.bpm / 2; // eighth notes
    const total = tr.prog.length * 8;
    while (this.nextTime < this.ctx.currentTime + 0.2) {
      this.playStep(tr, this.step % total, this.nextTime, stepDur);
      this.step++;
      this.nextTime += stepDur;
      if (!tr.loop && this.step >= total) {
        this.stopMusic(1.4);
        break;
      }
    }
  }

  playStep(tr, step, t, dur) {
    const bar = Math.floor(step / 8);
    const beat = step % 8;
    const [rootName, quality] = tr.prog[bar % tr.prog.length];
    const root = 48 + SEMI[rootName];
    const tones = CHORDS[quality] || CHORDS.maj;
    const g = tr.gain || 0.7;

    // bass
    if (tr.bassDrive) {
      if (beat === 0 || beat === 2 || beat === 4 || beat === 6) {
        this.tone(midiToFreq(root - 24), t, dur * 0.8, 'triangle', 0.075 * g, 0.004, 0.05, this.musicBus);
      }
    } else if (beat === 0 || beat === 4 || (tr.sparse && beat === 3)) {
      this.tone(midiToFreq(root - 24), t, dur * 1.6, 'triangle', 0.06 * g, 0.01, 0.18, this.musicBus);
    }

    // pad
    if (tr.pad && beat === 0) {
      const padGain = tr.sparse ? 0.022 : 0.028;
      tones.forEach((iv, i) => {
        this.tone(midiToFreq(root + 12 + iv), t, dur * 8.2, 'sine', padGain * g, 0.5, 0.9, this.musicBus, 700 + i * 120);
      });
    }

    // arpeggio
    if (tr.arp) {
      const idx = tr.arp[beat];
      if (idx !== null) {
        const tone = tones[idx % tones.length] + (idx >= tones.length ? 12 : 0);
        const type = tr.arpType || 'triangle';
        const bus = this.delay;
        const gain = (tr.sparse ? 0.014 : 0.022) * g;
        this.tone(midiToFreq(root + (tr.arpOct || 12) + tone), t, dur * 0.85, type, gain, 0.006, 0.08, bus);
      }
    }

    // lead
    if (tr.lead && tr.lead[beat] !== null && tr.lead[beat] !== undefined) {
      const iv = tr.lead[beat];
      const type = tr.leadType || 'square';
      this.tone(midiToFreq(root + 24 + iv), t, dur * 1.05, type, 0.032 * g, 0.008, 0.1, this.musicBus, 2600);
    }

    // drums
    if (tr.drums && tr.drums !== false) {
      if (tr.drums === 'full' || tr.drums === 'heavy') {
        if (beat === 0 || beat === 3 || beat === 4) this.kick(t, tr.drums === 'heavy' ? 0.12 : 0.09);
        if (beat === 2 || beat === 6) this.snare(t, tr.drums === 'heavy' ? 0.05 : 0.038);
      }
      if (beat % 2 === 1) this.hat(t, tr.drums === 'full' ? 0.022 : 0.013);
    }
  }

  tone(freq, time, dur, type, gain, attack, release, dest, filterFreq) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, time);
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(gain, time + attack);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain * 0.55), time + Math.max(attack + 0.01, dur * 0.6));
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur + release);
    let node = o;
    if (filterFreq) {
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = filterFreq; f.Q.value = 0.4;
      node.connect(f); node = f;
    }
    node.connect(g);
    g.connect(dest || this.master);
    o.start(time);
    o.stop(time + dur + release + 0.05);
  }

  noise(time, dur, gain, filterType, filterFreq, dest) {
    if (!this.ctx || !this.noiseBuf) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = filterType || 'highpass'; f.frequency.value = filterFreq || 3000;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    src.connect(f); f.connect(g); g.connect(dest || this.sfxBus);
    src.start(time, Math.random() * 0.4);
    src.stop(time + dur + 0.02);
  }

  kick(t, gain = 0.1) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(120, t);
    o.frequency.exponentialRampToValueAtTime(38, t + 0.14);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.17);
    o.connect(g); g.connect(this.musicBus);
    o.start(t); o.stop(t + 0.2);
  }
  snare(t, gain = 0.04) {
    this.noise(t, 0.12, gain, 'bandpass', 1800, this.musicBus);
    this.tone(190, t, 0.05, 'triangle', gain * 0.6, 0.002, 0.03, this.musicBus);
  }
  hat(t, gain = 0.015) {
    this.noise(t, 0.035, gain, 'highpass', 7000, this.musicBus);
  }

  sfx(name) {
    if (!this.unlocked || this.muted) return;
    const now = this.ctx.currentTime + 0.005;
    const B = this.sfxBus;
    switch (name) {
      case 'cursor':
        this.tone(880, now, 0.035, 'square', 0.03, 0.002, 0.02, B, 5000); break;
      case 'confirm':
        this.tone(660, now, 0.05, 'square', 0.04, 0.002, 0.03, B, 5000);
        this.tone(990, now + 0.045, 0.08, 'square', 0.035, 0.002, 0.05, B, 5000); break;
      case 'cancel':
        this.tone(520, now, 0.05, 'square', 0.035, 0.002, 0.03, B, 4000);
        this.tone(340, now + 0.045, 0.09, 'square', 0.03, 0.002, 0.05, B, 4000); break;
      case 'text':
        this.tone(1250 + Math.random() * 220, now, 0.012, 'square', 0.008, 0.001, 0.008, B, 6000); break;
      case 'hit':
        this.noise(now, 0.13, 0.16, 'bandpass', 900, B);
        this.tone(150, now, 0.12, 'sawtooth', 0.07, 0.002, 0.08, B, 800); break;
      case 'crit':
        this.noise(now, 0.2, 0.2, 'bandpass', 1400, B);
        this.tone(240, now, 0.16, 'square', 0.08, 0.002, 0.1, B, 1200);
        this.tone(120, now + 0.03, 0.2, 'sawtooth', 0.06, 0.002, 0.1, B, 500); break;
      case 'miss':
        this.tone(300, now, 0.07, 'sine', 0.03, 0.002, 0.05, B, 2000); break;
      case 'fire':
        this.noise(now, 0.35, 0.14, 'lowpass', 900, B);
        this.tone(220, now, 0.28, 'sawtooth', 0.05, 0.005, 0.2, B, 600); break;
      case 'ice':
        [1800, 2200, 2700].forEach((f, i) => this.tone(f, now + i * 0.04, 0.2, 'sine', 0.028, 0.002, 0.15, B));
        this.noise(now, 0.25, 0.05, 'highpass', 5000, B); break;
      case 'holy':
        [523, 659, 784, 1046].forEach((f, i) => this.tone(f, now + i * 0.06, 0.5, 'triangle', 0.035, 0.01, 0.3, B));
        break;
      case 'dark':
        this.tone(110, now, 0.5, 'sawtooth', 0.05, 0.01, 0.35, B, 420);
        this.tone(116, now, 0.5, 'sawtooth', 0.04, 0.01, 0.35, B, 420); break;
      case 'heal':
        [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, now + i * 0.05, 0.25, 'sine', 0.03, 0.003, 0.15, B));
        break;
      case 'buff':
        [392, 523, 659].forEach((f, i) => this.tone(f, now + i * 0.05, 0.3, 'triangle', 0.035, 0.004, 0.2, B));
        break;
      case 'debuff':
        [523, 440, 349].forEach((f, i) => this.tone(f, now + i * 0.06, 0.3, 'triangle', 0.035, 0.004, 0.2, B));
        break;
      case 'chest':
        this.tone(784, now, 0.08, 'square', 0.03, 0.002, 0.05, B);
        this.tone(1046, now + 0.08, 0.1, 'square', 0.03, 0.002, 0.06, B);
        this.tone(1318, now + 0.17, 0.22, 'square', 0.025, 0.002, 0.15, B); break;
      case 'door':
        this.noise(now, 0.3, 0.06, 'lowpass', 500, B);
        this.tone(90, now, 0.25, 'sine', 0.04, 0.01, 0.15, B); break;
      case 'levelup':
        [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, now + i * 0.075, 0.35, 'square', 0.035, 0.003, 0.2, B, 6000));
        break;
      case 'victory':
        [523, 659, 784, 1046].forEach((f, i) => this.tone(f, now + i * 0.09, 0.4, 'square', 0.035, 0.004, 0.25, B, 6000));
        break;
      case 'defeat':
        [392, 330, 262, 196].forEach((f, i) => this.tone(f, now + i * 0.18, 0.5, 'triangle', 0.045, 0.01, 0.35, B));
        break;
      case 'save':
        this.tone(660, now, 0.06, 'sine', 0.03, 0.003, 0.04, B);
        this.tone(880, now + 0.08, 0.12, 'sine', 0.03, 0.003, 0.08, B); break;
      case 'step':
        this.noise(now, 0.03, 0.02, 'lowpass', 700, B); break;
      case 'guard':
        this.tone(300, now, 0.06, 'square', 0.03, 0.002, 0.04, B, 2000);
        this.noise(now, 0.06, 0.04, 'bandpass', 2500, B); break;
      case 'flee':
        this.noise(now, 0.2, 0.04, 'highpass', 2000, B); break;
      case 'transform':
        this.tone(80, now, 1.2, 'sawtooth', 0.08, 0.1, 0.8, B, 300);
        this.tone(84, now + 0.1, 1.1, 'sawtooth', 0.06, 0.1, 0.8, B, 300);
        this.noise(now, 1.0, 0.08, 'lowpass', 800, B); break;
      default: break;
    }
  }
}

export const audio = new AudioEngine();
