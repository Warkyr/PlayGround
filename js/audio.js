export class Audio {
  constructor() {
    this.ctx = null
    this.enabled = true
  }
  init() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext
        if (AC) this.ctx = new AC()
      } catch { this.ctx = null }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {})
  }
  setEnabled(v) {
    this.enabled = v
    if (v) this.init()
  }
  tone(freq, dur = 0.12, type = 'sine', vol = 0.035, delay = 0) {
    if (!this.enabled || !this.ctx) return
    const t0 = this.ctx.currentTime + delay
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t0)
    gain.gain.setValueAtTime(0.0001, t0)
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start(t0)
    osc.stop(t0 + dur + 0.02)
  }
  play(name) {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return
    switch (name) {
      case 'click': this.tone(520, 0.06, 'square', 0.018); break
      case 'cash': this.tone(880, 0.09, 'triangle', 0.03); this.tone(1320, 0.12, 'triangle', 0.025, 0.07); break
      case 'error': this.tone(180, 0.16, 'sawtooth', 0.025); break
      case 'bell': this.tone(1046, 0.22, 'sine', 0.035); this.tone(1568, 0.3, 'sine', 0.02, 0.06); break
      case 'level': [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.035, i * 0.08)); break
      case 'day': [392, 523, 659].forEach((f, i) => this.tone(f, 0.24, 'sine', 0.028, i * 0.1)); break
      case 'pop': this.tone(700, 0.07, 'sine', 0.02); break
      default: this.tone(600, 0.07, 'sine', 0.02)
    }
  }
}
