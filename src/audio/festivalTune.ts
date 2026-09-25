/**
 * "Đêm hội" — an original, cheerful Mid-Autumn tune in the Vietnamese
 * pentatonic (D E F# A B), written for this project. Eighth-note grid,
 * 16 bars in an A B A C form, looping.
 */

export const BPM = 116
/** Seconds per eighth note. */
export const STEP = 60 / BPM / 2
export const STEPS_PER_BAR = 8

const NOTE: Record<string, number> = {
  A3: 220.0,
  B3: 246.94,
  D4: 293.66,
  E4: 329.63,
  'F#4': 369.99,
  A4: 440.0,
  B4: 493.88,
  D5: 587.33,
  E5: 659.25,
  'F#5': 739.99,
  A5: 880.0,
}

// "note:length-in-eighths", bars separated by |
const PHRASES = {
  A: 'D5:2 B4:1 A4:1 B4:2 D5:2 | E5:2 D5:1 B4:1 A4:4 | B4:2 A4:1 F#4:1 A4:2 B4:2 | D5:2 E5:1 D5:1 B4:4',
  B: 'A4:2 A4:1 B4:1 D5:2 D5:2 | E5:1 F#5:1 E5:1 D5:1 B4:4 | A4:2 F#4:1 E4:1 F#4:2 A4:2 | B4:2 A4:1 F#4:1 D4:4',
  C: 'F#5:2 E5:1 D5:1 E5:2 D5:2 | B4:1 D5:1 B4:1 A4:1 F#4:4 | E4:2 F#4:1 A4:1 B4:2 A4:2 | F#4:2 E4:1 E4:1 D4:4',
}
const FORM: (keyof typeof PHRASES)[] = ['A', 'B', 'A', 'C']
/** Bass root per bar (root on beat 1, fifth-ish on beat 3). */
const BASS: Record<keyof typeof PHRASES, [string, string][]> = {
  A: [['D4', 'A3'], ['A3', 'E4'], ['B3', 'F#4'], ['D4', 'A3']],
  B: [['A3', 'E4'], ['B3', 'F#4'], ['A3', 'E4'], ['D4', 'A3']],
  C: [['D4', 'A3'], ['B3', 'F#4'], ['A3', 'E4'], ['D4', 'A3']],
}

export interface TuneEvent {
  step: number
  freq: number
  len: number
  /** Doubled by the bamboo flute (sáo) in the B and C sections. */
  flute: boolean
}

function build() {
  const melody: TuneEvent[] = []
  const bass: { step: number; freq: number }[] = []
  let step = 0
  FORM.forEach((section) => {
    const flute = section !== 'A'
    PHRASES[section].split('|').forEach((bar, b) => {
      const barStart = step
      for (const tok of bar.trim().split(/\s+/)) {
        const [name, len] = tok.split(':')
        melody.push({ step, freq: NOTE[name], len: Number(len), flute })
        step += Number(len)
      }
      const [root, fifth] = BASS[section][b]
      bass.push({ step: barStart, freq: NOTE[root] / 2 }, { step: barStart + 4, freq: NOTE[fifth] / 2 })
    })
  })
  return { melody, bass, length: step }
}

export const TUNE = build()

/** Lion-dance percussion for one bar: tùng · cắc tùng tùng · cắc dinh. */
export const DRUM_BAR: ('tung' | 'dinh' | 'cac' | null)[] = ['tung', null, 'cac', 'tung', 'tung', null, 'cac', 'dinh']
/** Chũm chọe (small cymbals) on the off-beats. */
export const CYMBAL_BAR = [false, false, true, false, false, false, true, false]
