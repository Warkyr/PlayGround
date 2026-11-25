/* =========================================================================
   AURORA PARTIDA — procedural chiptune score + SFX
   ========================================================================= */
'use strict';

const MUSIC_TRACKS = {
  title: {
    bpm: 62, type: 'triangle', pad: true, arp: true, drums: 'none',
    chords: [[45, 48, 52], [41, 45, 48], [43, 47, 50], [40, 43, 47]],
    lead: [69, null, 72, null, 71, null, 69, null, 67, null, 69, null, 72, null, 74, null,
           72, null, 69, null, 67, null, 64, null, 67, null, 69, null, 67, null, 64, null],
    bass: [33, null, null, null, null, null, 31, null, 29, null, null, null, null, null, 28, null]
  },
  village: {
    bpm: 86, type: 'triangle', pad: true, arp: true, drums: 'soft',
    chords: [[48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50]],
    lead: [72, null, 74, 76, null, 72, 69, null, 69, null, 72, 74, null, 69, 67, null,
           67, null, 69, 72, null, 69, 65, null, 67, null, 69, 72, null, 74, 72, null],
    bass: [36, null, 33, null, 36, null, 31, null, 33, null, 36, null, 31, null, 28, null]
  },
  fields: {
    bpm: 102, type: 'triangle', pad: true, arp: true, drums: 'soft',
    chords: [[50, 53, 57], [47, 50, 53], [43, 47, 50], [45, 48, 52]],
    lead: [74, 76, 77, 76, 74, null, 72, 74, 72, 69, 72, null, 74, 77, 76, null,
           72, 74, 76, 74, 72, null, 69, 67, 69, 72, 74, null, 72, null, null, null],
    bass: [38, null, 35, null, 38, null, 43, null, 45, null, 41, null, 38, null, 31, null]
  },
  capital: {
    bpm: 90, type: 'triangle', pad: true, arp: true, drums: 'soft',
    chords: [[48, 52, 55], [53, 57, 60], [50, 53, 57], [43, 47, 50]],
    lead: [72, null, 76, null, 79, 76, 72, null, 74, null, 77, null, 76, 74, 72, null,
           69, null, 72, null, 74, 76, 77, null, 76, null, 72, null, 69, null, 72, null],
    bass: [36, null, 36, null, 41, null, 41, null, 38, null, 38, null, 31, null, 31, null]
  },
  castle: {
    bpm: 74, type: 'sawtooth', pad: true, arp: false, drums: 'none',
    chords: [[45, 48, 52], [44, 47, 51], [43, 46, 50], [41, 44, 48]],
    lead: [69, null, null, 68, null, 67, null, null, 64, null, 67, null, 69, null, 71, null,
           68, null, null, 67, null, 64, null, null, 63, null, 64, null, 67, null, null, null],
    bass: [33, null, null, null, 32, null, null, null, 31, null, null, null, 29, null, null, null]
  },
  prison: {
    bpm: 56, type: 'sine', pad: true, arp: false, drums: 'none',
    chords: [[36, 39, 43], [35, 38, 42], [36, 39, 43], [33, 36, 40]],
    lead: [67, null, null, 66, null, null, 63, null, 61, null, null, 63, null, null, 60, null,
           null, null, 63, null, 66, null, null, 61, null, null, 60, null, 58, null, null, null],
    bass: [24, null, null, null, null, null, null, null, 23, null, null, null, null, null, null, null]
  },
  temple: {
    bpm: 68, type: 'triangle', pad: true, arp: true, drums: 'none',
    chords: [[50, 53, 57], [48, 52, 55], [46, 50, 53], [45, 48, 52]],
    lead: [74, null, 77, null, 81, null, 79, null, 77, null, 74, null, 72, null, 74, null,
           76, null, 79, null, 81, null, 84, null, 81, null, 79, null, 76, null, 72, null],
    bass: [38, null, null, null, 36, null, null, null, 34, null, null, null, 33, null, null, null]
  },
  battle: {
    bpm: 138, type: 'square', pad: false, arp: true, drums: 'battle',
    chords: [[45, 48, 52], [45, 48, 52], [43, 47, 50], [41, 44, 48]],
    lead: [69, 72, 76, 72, 69, 72, 76, 79, 76, 72, 69, 72, 74, 72, 69, 67,
           67, 71, 74, 71, 67, 71, 74, 76, 74, 71, 67, 64, 67, 69, 71, 72],
    bass: [33, 33, 40, 33, 31, 31, 38, 31, 29, 29, 36, 29, 28, 28, 35, 28]
  },
  boss: {
    bpm: 148, type: 'square', pad: true, arp: true, drums: 'battle',
    chords: [[41, 44, 48], [41, 44, 48], [40, 43, 47], [39, 42, 46]],
    lead: [65, 68, 72, 68, 65, 68, 72, 75, 72, 68, 65, 63, 65, 68, 72, 75,
           64, 67, 72, 67, 64, 67, 72, 76, 72, 67, 64, 62, 64, 67, 70, 72],
    bass: [29, 29, 36, 29, 29, 29, 36, 29, 28, 28, 35, 28, 27, 27, 34, 27]
  },
  ending: {
    bpm: 72, type: 'triangle', pad: true, arp: true, drums: 'none',
    chords: [[48, 52, 55], [53, 57, 60], [50, 53, 57], [43, 47, 50]],
    lead: [72, null, 76, 79, null, 76, 72, null, 74, null, 77, 81, null, 77, 74, null,
           76, null, 79, 84, null, 79, 76, null, 74, null, 72, 69, null, 72, 76, null],
    bass: [36, null, null, null, 41, null, null, null, 38, null, null, null, 31, null, null, null]
  }
};

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.noise = null;
    this.trackName = null;
    this.timer = null;
    this.step = 0;
    this.nextAt = 0;
    this.muted = false;
    try { this.muted = localStorage.getItem('aurora_muted') === '1'; } catch (e) {}
    this.pendingTrack = null;
  }

  init() {
    if (this.ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : .75;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = .34;
    this.musicGain.connect(this.master);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = .55;
    this.sfxGain.connect(this.master);
    // ruído
    const len = Math.floor(this.ctx.sampleRate * 1.2);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.noise = buf;
    return true;
  }

  unlock() {
    if (!this.init()) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (this.pendingTrack) { const t = this.pendingTrack; this.pendingTrack = null; this.playTrack(t); }
  }

  setMuted(m) {
    this.muted = m;
    try { localStorage.setItem('aurora_muted', m ? '1' : '0'); } catch (e) {}
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : .75, this.ctx.currentTime, .05);
  }

  toggleMute() { this.setMuted(!this.muted); return this.muted; }

  note(midi, when, dur, type, gain, opts = {}) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
    if (opts.detune) osc.detune.value = opts.detune;
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(gain, when + (opts.attack || .012));
    g.gain.exponentialRampToValueAtTime(gain * (opts.sustain || .6), when + dur * .55);
    g.gain.exponentialRampToValueAtTime(.0001, when + dur);
    let node = osc;
    if (opts.filter) {
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = opts.filter;
      f.Q.value = opts.q || .7;
      node.connect(f); node = f;
    }
    node.connect(g);
    g.connect(opts.bus || this.musicGain);
    osc.start(when);
    osc.stop(when + dur + .05);
  }

  perc(when, kind = 'hat', gain = .1) {
    if (!this.ctx || !this.noise) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();
    if (kind === 'hat') { f.type = 'highpass'; f.frequency.value = 7000; }
    else if (kind === 'snare') { f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 1.2; }
    else { f.type = 'lowpass'; f.frequency.value = 220; }
    src.connect(f); f.connect(g); g.connect(this.musicGain);
    const dur = kind === 'kick' ? .16 : .06;
    g.gain.setValueAtTime(gain, when);
    g.gain.exponentialRampToValueAtTime(.0001, when + dur);
    src.start(when);
    src.stop(when + dur);
  }

  playTrack(name) {
    if (!this.ctx) { this.pendingTrack = name; return; }
    if (this.trackName === name) return;
    this.stopMusic();
    const track = MUSIC_TRACKS[name];
    if (!track) return;
    this.trackName = name;
    this.track = track;
    this.step = 0;
    this.nextAt = this.ctx.currentTime + .12;
    this.timer = setInterval(() => this.schedule(), 70);
    this.schedule();
  }

  stopMusic() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.trackName = null;
    this.track = null;
  }

  schedule() {
    if (!this.ctx || !this.track) return;
    const t = this.track;
    const stepDur = 60 / t.bpm / 2;
    while (this.nextAt < this.ctx.currentTime + .28) {
      const step = this.step;
      const inBar = step % 8;
      const bar = Math.floor(step / 8) % t.chords.length;
      const chord = t.chords[bar];
      const when = this.nextAt;
      // pad
      if (t.pad && inBar === 0) {
        for (const n of chord) {
          this.note(n, when, stepDur * 7.5, 'sawtooth', .038, { filter: 850, attack: .18, sustain: .7 });
          this.note(n + 12, when, stepDur * 7.5, 'sine', .018, { attack: .2, sustain: .6 });
        }
      }
      // baixo
      const bnote = t.bass[step % t.bass.length];
      if (bnote != null) {
        this.note(bnote, when, stepDur * 1.7, 'sine', .15, { attack: .01 });
        this.note(bnote, when, stepDur * 1.7, 'triangle', .05, { attack: .01 });
      }
      // arpejo
      if (t.arp) {
        const arpNote = chord[step % chord.length] + 12;
        this.note(arpNote, when, stepDur * .9, 'triangle', .035, { filter: 3000, attack: .005 });
      }
      // melodia
      const ln = t.lead[step % t.lead.length];
      if (ln != null) {
        this.note(ln, when, stepDur * 1.55, t.type, t.type === 'square' ? .055 : .075, { filter: t.type === 'square' ? 2400 : 4000, attack: .008 });
        this.note(ln + 12, when, stepDur * .9, 'sine', .022);
      }
      // percussão
      if (t.drums !== 'none') {
        if (inBar % 2 === 0) this.perc(when, 'hat', t.drums === 'battle' ? .045 : .025);
        if (inBar === 0 || inBar === 4) this.perc(when, 'kick', t.drums === 'battle' ? .16 : .09);
        if (t.drums === 'battle' && (inBar === 2 || inBar === 6)) this.perc(when, 'snare', .07);
      }
      this.step++;
      this.nextAt += stepDur;
    }
  }

  sfx(name) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const bus = this.sfxGain;
    const beep = (freq, delay, dur, type = 'square', gain = .1, slide = 0) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + delay);
      if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * slide), now + delay + dur);
      g.gain.setValueAtTime(0, now + delay);
      g.gain.linearRampToValueAtTime(gain, now + delay + .006);
      g.gain.exponentialRampToValueAtTime(.0001, now + delay + dur);
      osc.connect(g); g.connect(bus);
      osc.start(now + delay); osc.stop(now + delay + dur + .03);
    };
    const noise = (delay, dur, freq, gain, type = 'bandpass') => {
      if (!this.noise) return;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noise;
      const f = this.ctx.createBiquadFilter();
      f.type = type; f.frequency.value = freq;
      const g = this.ctx.createGain();
      src.connect(f); f.connect(g); g.connect(bus);
      g.gain.setValueAtTime(gain, now + delay);
      g.gain.exponentialRampToValueAtTime(.0001, now + delay + dur);
      src.start(now + delay); src.stop(now + delay + dur);
    };
    switch (name) {
      case 'cursor': beep(880, 0, .05, 'square', .035); break;
      case 'confirm': beep(660, 0, .06, 'triangle', .09); beep(990, .05, .1, 'triangle', .075); break;
      case 'cancel': beep(440, 0, .07, 'triangle', .07); beep(330, .05, .1, 'triangle', .06); break;
      case 'talk': beep(520 + Math.random() * 80, 0, .025, 'triangle', .018); break;
      case 'hit': noise(0, .16, 900, .22); beep(140, 0, .12, 'sawtooth', .12, .5); break;
      case 'crit': noise(0, .25, 1200, .26); beep(180, 0, .2, 'square', .12, .4); beep(90, .04, .22, 'sawtooth', .1, .5); break;
      case 'slash': noise(0, .12, 2400, .12, 'highpass'); beep(740, 0, .08, 'sawtooth', .04, .5); break;
      case 'magic': beep(420, 0, .3, 'sine', .07, 2.4); beep(630, .05, .3, 'triangle', .04, 2); noise(.1, .3, 3000, .04, 'highpass'); break;
      case 'heal': [523, 659, 784, 1046].forEach((f, i) => beep(f, i * .07, .28, 'sine', .06)); break;
      case 'guard': beep(220, 0, .18, 'square', .06); noise(.02, .12, 600, .08, 'lowpass'); break;
      case 'chest': [784, 988, 1175, 1568].forEach((f, i) => beep(f, i * .06, .25, 'triangle', .05)); break;
      case 'levelup': [523, 659, 784, 1046, 1318].forEach((f, i) => beep(f, i * .09, .38, 'triangle', .075)); break;
      case 'defeat': beep(300, 0, .5, 'sawtooth', .08, .4); beep(200, .3, .6, 'sine', .08, .35); break;
      case 'victory': [523, 523, 523, 659, 784, 1046].forEach((f, i) => beep(f, i * .1, .4, 'triangle', .06)); break;
      case 'step': noise(0, .035, 500, .012, 'lowpass'); break;
      case 'error': beep(160, 0, .12, 'square', .05); break;
      case 'flee': beep(600, 0, .08, 'triangle', .05); beep(400, .06, .12, 'triangle', .05); break;
      case 'boss': beep(110, 0, .8, 'sawtooth', .1, .85); noise(.1, .6, 200, .12, 'lowpass'); break;
      default: break;
    }
  }
}

const AUDIO = new AudioEngine();
