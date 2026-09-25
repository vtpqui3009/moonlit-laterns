// Small, dependency-free 1D gradient noise (Perlin-style) for organic motion:
// lantern sway, candle flicker, wind gusts. Output range ≈ [-1, 1].

const PERM = new Uint8Array(512)
{
  const p = new Uint8Array(256)
  for (let i = 0; i < 256; i++) p[i] = i
  // Deterministic shuffle (mulberry32) so motion is identical between reloads.
  let s = 0x9e3779b9
  const rnd = () => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[p[i], p[j]] = [p[j], p[i]]
  }
  for (let i = 0; i < 512; i++) PERM[i] = p[i & 255]
}

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)
const grad = (h: number, x: number) => ((h & 1) === 0 ? x : -x) * (1 + (h & 7) / 8)

export function noise1(x: number): number {
  const i = Math.floor(x)
  const f = x - i
  const a = grad(PERM[i & 255], f)
  const b = grad(PERM[(i + 1) & 255], f - 1)
  return (a + (b - a) * fade(f)) * 1.1
}

/** Fractal noise: a few octaves layered for gusty, natural variation. */
export function fbm1(x: number, octaves = 3): number {
  let sum = 0
  let amp = 0.5
  let freq = 1
  let norm = 0
  for (let o = 0; o < octaves; o++) {
    sum += noise1(x * freq + o * 17.3) * amp
    norm += amp
    amp *= 0.5
    freq *= 2.03
  }
  return sum / norm
}

/** Seeded PRNG for procedural geometry / textures. */
export function mulberry32(seed: number) {
  let s = seed
  return () => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
