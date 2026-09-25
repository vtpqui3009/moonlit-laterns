import { cinema, nightness, shotWeight } from '../cinema/director'
import { CYMBAL_BAR, DRUM_BAR, STEP, STEPS_PER_BAR, TUNE } from './festivalTune'

/**
 * The night's soundscape, synthesised with WebAudio — no audio files needed:
 * an original, cheerful festival tune (plucked đàn tranh-like melody, sáo
 * flute, bass, lion-dance drums and chũm chọe cymbals) over crickets and a
 * soft wind. The drums swell as the procession passes.
 * If `public/audio/nhac-nen.mp3` exists, that track plays instead of the tune.
 * Browsers only allow sound after a tap, so `start()` is called from a click.
 */

const CUSTOM_TRACK = `${import.meta.env.BASE_URL}audio/nhac-nen.mp3`

// Vietnamese-sounding pentatonic (ngũ cung) around D: D E G A B
const PENTA = [293.66, 329.63, 392.0, 440.0, 493.88, 587.33, 659.25, 783.99]

class Ambience {
  private ctx: AudioContext | null = null
  private master!: GainNode
  private layers!: { wind: GainNode; crickets: GainNode; pad: GainNode; music: GainNode; drum: GainNode }
  private reverbIn!: GainNode
  private noise!: AudioBuffer
  private timer = 0
  private raf = 0
  private nextChirp = 0
  private nextStep = 0
  private step = 0
  private customTrack = false
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
    this.layers = { wind: mk(), crickets: mk(), pad: mk(), music: mk(), drum: mk() }
    this.layers.music.connect(this.reverbIn)
    this.layers.drum.connect(this.reverbIn)

    // white noise buffer shared by wind and percussion
    this.noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const data = this.noise.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1

    this.buildWind()
    this.buildPad()
    const t = ctx.currentTime
    this.nextChirp = t + 0.5
    this.nextStep = t + 0.8
    void this.tryCustomTrack()
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

  /** Dev/testing: a MediaStream of the final mix (for recording). */
  tap() {
    const dest = this.ctx!.createMediaStreamDestination()
    this.master.connect(dest)
    return dest.stream
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

  /** Lookahead scheduler for crickets and the festival tune. */
  private schedule() {
    const ctx = this.ctx!
    const ahead = ctx.currentTime + 0.25
    while (this.nextChirp < ahead) {
      this.chirp(this.nextChirp, Math.random() > 0.5 ? 4300 : 4750)
      this.nextChirp += 0.55 + Math.random() * 0.9
    }
    // the festival tune, one eighth note at a time
    while (this.nextStep < ahead) {
      if (!this.customTrack) this.playStep(this.step % TUNE.length, this.nextStep)
      this.step++
      this.nextStep += STEP
    }
  }

  private playStep(step: number, t: number) {
    for (const n of TUNE.melody) {
      if (n.step !== step) continue
      this.pluck(n.freq, t, n.len * STEP)
      if (n.flute) this.flute(n.freq * 2, t, n.len * STEP)
    }
    for (const b of TUNE.bass) if (b.step === step) this.bassNote(b.freq, t)
    const inBar = step % STEPS_PER_BAR
    const hit = DRUM_BAR[inBar]
    if (this.drumEnabled && hit) this.drum(hit, t)
    if (CYMBAL_BAR[inBar]) this.cymbal(t)
  }

  /** Plucked string (đàn tranh-like): bright attack that mellows quickly. */
  private pluck(freq: number, t: number, dur: number) {
    const ctx = this.ctx!
    const g = ctx.createGain()
    const decay = Math.min(dur + 0.35, 1.3)
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.22, t + 0.004)
    g.gain.exponentialRampToValueAtTime(0.0008, t + decay)
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.Q.value = 2
    lp.frequency.setValueAtTime(4200, t)
    lp.frequency.exponentialRampToValueAtTime(900, t + 0.25)
    lp.connect(g)
    g.connect(this.layers.music)
    for (const [type, mult, amp, detune] of [
      ['sawtooth', 1, 0.5, -4],
      ['triangle', 1, 0.8, 3],
      ['sine', 2, 0.25, 0],
    ] as [OscillatorType, number, number, number][]) {
      const o = ctx.createOscillator()
      o.type = type
      o.frequency.setValueAtTime(freq * mult * 1.012, t)
      o.frequency.exponentialRampToValueAtTime(freq * mult, t + 0.04) // the little "nhấn" of a plucked string
      o.detune.value = detune
      const og = ctx.createGain()
      og.gain.value = amp
      o.connect(og)
      og.connect(lp)
      o.start(t)
      o.stop(t + decay + 0.05)
    }
  }

  /** Bamboo flute (sáo): soft sine with breath and a late vibrato. */
  private flute(freq: number, t: number, dur: number) {
    const ctx = this.ctx!
    const len = Math.max(dur * 0.95, 0.15)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.045, t + 0.05)
    g.gain.setValueAtTime(0.045, t + len - 0.06)
    g.gain.linearRampToValueAtTime(0, t + len)
    g.connect(this.layers.music)
    const o = ctx.createOscillator()
    o.frequency.value = freq
    const vib = ctx.createOscillator()
    vib.frequency.value = 5.5
    const vibDepth = ctx.createGain()
    vibDepth.gain.setValueAtTime(0, t)
    vibDepth.gain.linearRampToValueAtTime(freq * 0.006, t + Math.min(0.25, len))
    vib.connect(vibDepth)
    vibDepth.connect(o.frequency)
    o.connect(g)
    // breath noise
    const air = ctx.createBufferSource()
    air.buffer = this.noise
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = freq * 2
    bp.Q.value = 6
    const ag = ctx.createGain()
    ag.gain.value = 0.25
    air.connect(bp)
    bp.connect(ag)
    ag.connect(g)
    for (const n of [o, vib]) {
      n.start(t)
      n.stop(t + len + 0.02)
    }
    air.start(t, Math.random())
    air.stop(t + len + 0.02)
  }

  private bassNote(freq: number, t: number) {
    const ctx = this.ctx!
    const o = ctx.createOscillator()
    o.type = 'triangle'
    o.frequency.value = freq
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.3, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.45)
    o.connect(g)
    g.connect(this.layers.music)
    o.start(t)
    o.stop(t + 0.5)
  }

  /** Chũm chọe: bright, short metallic noise. */
  private cymbal(t: number) {
    const ctx = this.ctx!
    const src = ctx.createBufferSource()
    src.buffer = this.noise
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 6500
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.16, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.14)
    src.connect(hp)
    hp.connect(g)
    g.connect(this.layers.drum)
    src.start(t, Math.random())
    src.stop(t + 0.16)
  }

  /** Use the viewer-supplied track (public/audio/nhac-nen.mp3) instead of the synthesised tune, if present. */
  private async tryCustomTrack() {
    try {
      const res = await fetch(CUSTOM_TRACK, { method: 'HEAD' })
      if (!res.ok || !(res.headers.get('content-type') ?? '').startsWith('audio')) return
      const el = new Audio(CUSTOM_TRACK)
      el.loop = true
      el.crossOrigin = 'anonymous'
      const src = this.ctx!.createMediaElementSource(el)
      src.connect(this.layers.music)
      await el.play()
      this.customTrack = true
    } catch {
      // no custom track — keep the synthesised tune
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
    set(this.layers.wind, 0.035 - n * 0.02)
    set(this.layers.crickets, 0.02 + n * 0.035)
    set(this.layers.pad, 0.012)
    set(this.layers.music, this.customTrack ? 0.9 : 0.55 + shotWeight(p, 3, 1) * 0.1)
    // the lion-dance drums are part of the tune, and swell when the procession passes
    set(this.layers.drum, this.customTrack ? 0 : 0.18 + shotWeight(p, 2, 1.1) * 0.3)
  }
}

export const ambience = new Ambience()

// Dev-only hooks: record the soundscape from automated tests.
if (import.meta.env.DEV) {
  ;(window as unknown as { __ambience: Ambience }).__ambience = ambience
}
