import { cinema, nightness, shotWeight } from '../cinema/director'

/**
 * The night's soundscape, synthesised with WebAudio — no audio files:
 * crickets, a soft wind, a warm pentatonic pad, wind-chime notes, and the
 * lion-dance drum ("tùng dinh dinh, cắc tùng dinh dinh") that swells as the
 * procession passes. Layer volumes follow the playhead.
 * Browsers only allow sound after a tap, so `start()` is called from a click.
 */

// Vietnamese-sounding pentatonic (ngũ cung) around D: D E G A B
const PENTA = [293.66, 329.63, 392.0, 440.0, 493.88, 587.33, 659.25, 783.99]

class Ambience {
  private ctx: AudioContext | null = null
  private master!: GainNode
  private layers!: { wind: GainNode; crickets: GainNode; pad: GainNode; chimes: GainNode; drum: GainNode }
  private reverbIn!: GainNode
  private noise!: AudioBuffer
  private timer = 0
  private raf = 0
  private nextChirp = 0
  private nextChime = 0
  private nextBeat = 0
  private beat = 0
  private drumEnabled = true
  private muted = false

  start(opts: { drum: boolean }) {
    if (this.ctx) {
      void this.ctx.resume()
      return
    }
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    this.ctx = ctx
    this.drumEnabled = opts.drum
    this.master = ctx.createGain()
    this.master.gain.value = 0
    this.master.connect(ctx.destination)
    this.master.gain.setTargetAtTime(this.muted ? 0 : 0.9, ctx.currentTime, 1.5)

    // a small feedback-delay "courtyard" space for chimes and drum
    this.reverbIn = ctx.createGain()
    const delay = ctx.createDelay(1)
    delay.delayTime.value = 0.23
    const fb = ctx.createGain()
    fb.gain.value = 0.35
    const damp = ctx.createBiquadFilter()
    damp.type = 'lowpass'
    damp.frequency.value = 2200
    this.reverbIn.connect(delay)
    delay.connect(damp)
    damp.connect(fb)
    fb.connect(delay)
    const wet = ctx.createGain()
    wet.gain.value = 0.5
    damp.connect(wet)
    wet.connect(this.master)

    const mk = () => {
      const g = ctx.createGain()
      g.gain.value = 0
      g.connect(this.master)
      return g
    }
    this.layers = { wind: mk(), crickets: mk(), pad: mk(), chimes: mk(), drum: mk() }
    this.layers.chimes.connect(this.reverbIn)
    this.layers.drum.connect(this.reverbIn)

    // white noise buffer shared by wind and percussion
    this.noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const data = this.noise.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1

    this.buildWind()
    this.buildPad()
    const t = ctx.currentTime
    this.nextChirp = t + 0.5
    this.nextChime = t + 2
    this.nextBeat = t + 0.2
    this.timer = window.setInterval(() => this.schedule(), 90)
    const tick = () => {
      this.mix()
      this.raf = requestAnimationFrame(tick)
    }
    tick()
    document.addEventListener('visibilitychange', this.onVisibility)
  }

  setMuted(muted: boolean) {
    this.muted = muted
    if (!this.ctx) return
    this.master.gain.setTargetAtTime(muted ? 0 : 0.9, this.ctx.currentTime, 0.3)
  }

  /** A single low, long bell — for releasing the wish lantern. */
  bell() {
    if (!this.ctx) return
    const t = this.ctx.currentTime + 0.05
    this.bellNote(PENTA[0] / 2, t, 0.35, 6, this.master)
    this.bellNote(PENTA[3], t + 0.6, 0.12, 4, this.master)
    this.bellNote(PENTA[5], t + 1.2, 0.1, 4, this.master)
  }

  stop() {
    clearInterval(this.timer)
    cancelAnimationFrame(this.raf)
    document.removeEventListener('visibilitychange', this.onVisibility)
    void this.ctx?.close()
    this.ctx = null
  }

  private onVisibility = () => {
    if (!this.ctx) return
    if (document.hidden) void this.ctx.suspend()
    else void this.ctx.resume()
  }

  private buildWind() {
    const ctx = this.ctx!
    const src = ctx.createBufferSource()
    src.buffer = this.noise
    src.loop = true
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 380
    lp.Q.value = 0.7
    // slow gusts: an LFO sweeping the filter
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.07
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 180
    lfo.connect(lfoGain)
    lfoGain.connect(lp.frequency)
    src.connect(lp)
    lp.connect(this.layers.wind)
    src.start()
    lfo.start()
  }

  private buildPad() {
    const ctx = this.ctx!
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 900
    lp.connect(this.layers.pad)
    for (const [f, type, g] of [
      [146.83, 'sine', 0.5],
      [220.0, 'triangle', 0.22],
      [293.66, 'sine', 0.25],
      [329.63, 'sine', 0.12],
    ] as [number, OscillatorType, number][]) {
      const o = ctx.createOscillator()
      o.type = type
      o.frequency.value = f
      o.detune.value = (Math.random() - 0.5) * 8
      const og = ctx.createGain()
      og.gain.value = g
      // gentle tremolo so the pad breathes
      const trem = ctx.createOscillator()
      trem.frequency.value = 0.08 + Math.random() * 0.1
      const tg = ctx.createGain()
      tg.gain.value = g * 0.4
      trem.connect(tg)
      tg.connect(og.gain)
      o.connect(og)
      og.connect(lp)
      o.start()
      trem.start()
    }
  }

  /** Lookahead scheduler for crickets, chimes and the drum pattern. */
  private schedule() {
    const ctx = this.ctx!
    const ahead = ctx.currentTime + 0.25
    while (this.nextChirp < ahead) {
      this.chirp(this.nextChirp, Math.random() > 0.5 ? 4300 : 4750)
      this.nextChirp += 0.55 + Math.random() * 0.9
    }
    while (this.nextChime < ahead) {
      const n = PENTA[Math.floor(Math.random() * PENTA.length)]
      this.bellNote(n * 2, this.nextChime, 0.1 + Math.random() * 0.08, 3.2, this.layers.chimes)
      if (Math.random() > 0.6) this.bellNote(n * 3, this.nextChime + 0.18, 0.05, 2.5, this.layers.chimes)
      this.nextChime += 2.4 + Math.random() * 4
    }
    // tùng dinh dinh · cắc tùng dinh dinh (8th notes at ~104 bpm)
    const step = 60 / 104 / 2
    const pattern = ['tung', 'dinh', 'dinh', '-', 'cac', 'tung', 'dinh', 'dinh']
    while (this.nextBeat < ahead) {
      const hit = pattern[this.beat % pattern.length]
      if (this.drumEnabled && hit !== '-') this.drum(hit as 'tung' | 'dinh' | 'cac', this.nextBeat)
      this.beat++
      this.nextBeat += step
    }
  }

  private chirp(t: number, freq: number) {
    const ctx = this.ctx!
    const o = ctx.createOscillator()
    o.frequency.value = freq
    const g = ctx.createGain()
    g.gain.value = 0
    const pulses = 3 + Math.floor(Math.random() * 3)
    for (let i = 0; i < pulses; i++) {
      const s = t + i * 0.045
      g.gain.setValueAtTime(0, s)
      g.gain.linearRampToValueAtTime(0.18, s + 0.008)
      g.gain.linearRampToValueAtTime(0, s + 0.03)
    }
    const pan = ctx.createStereoPanner()
    pan.pan.value = Math.random() * 1.6 - 0.8
    o.connect(g)
    g.connect(pan)
    pan.connect(this.layers.crickets)
    o.start(t)
    o.stop(t + pulses * 0.045 + 0.05)
  }

  private bellNote(freq: number, t: number, level: number, decay: number, out: AudioNode) {
    const ctx = this.ctx!
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(level, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay)
    g.connect(out)
    if (out === this.master) g.connect(this.reverbIn)
    // bell: fundamental + inharmonic partial
    for (const [mult, amp] of [
      [1, 1],
      [2.76, 0.35],
      [5.4, 0.12],
    ]) {
      const o = ctx.createOscillator()
      o.frequency.value = freq * mult
      const og = ctx.createGain()
      og.gain.value = amp
      o.connect(og)
      og.connect(g)
      o.start(t)
      o.stop(t + decay)
    }
  }

  private drum(kind: 'tung' | 'dinh' | 'cac', t: number) {
    const ctx = this.ctx!
    if (kind === 'cac') {
      // rim click: short filtered noise
      const src = ctx.createBufferSource()
      src.buffer = this.noise
      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = 2600
      bp.Q.value = 3
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.5, t)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.06)
      src.connect(bp)
      bp.connect(g)
      g.connect(this.layers.drum)
      src.start(t, Math.random())
      src.stop(t + 0.08)
      return
    }
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    const [f0, f1, level, len] = kind === 'tung' ? [120, 55, 0.9, 0.5] : [220, 150, 0.35, 0.18]
    o.frequency.setValueAtTime(f0, t)
    o.frequency.exponentialRampToValueAtTime(f1, t + len * 0.6)
    g.gain.setValueAtTime(level, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + len)
    o.connect(g)
    g.connect(this.layers.drum)
    o.start(t)
    o.stop(t + len + 0.02)
  }

  /** Layer volumes follow the film: wind at dusk, crickets and pad deepen at night, drum near the procession. */
  private mix() {
    const ctx = this.ctx!
    const p = cinema.p
    const n = nightness(p)
    const t = ctx.currentTime
    const set = (g: GainNode, v: number) => g.gain.setTargetAtTime(v, t, 0.6)
    set(this.layers.wind, 0.05 - n * 0.025)
    set(this.layers.crickets, 0.05 + n * 0.08)
    set(this.layers.pad, 0.035 + n * 0.03)
    set(this.layers.chimes, 0.5 + shotWeight(p, 3, 1) * 0.3)
    set(this.layers.drum, this.drumEnabled ? 0.03 + shotWeight(p, 2, 1.1) * 0.22 : 0)
  }
}

export const ambience = new Ambience()
