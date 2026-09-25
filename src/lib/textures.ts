import * as THREE from 'three'
import { mulberry32 } from './noise'

// Procedural canvas textures. Everything is generated once and cached, so the
// scene has real surface detail (paper crinkles, bamboo fibre, brick wear)
// without shipping large image files.

export const textureCache = new Map<string, THREE.Texture>()

export function cached<T extends THREE.Texture>(key: string, make: () => T): T {
  let tex = textureCache.get(key) as T | undefined
  if (!tex) {
    tex = make()
    textureCache.set(key, tex)
  }
  return tex
}

export function makeCanvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  return { c, ctx }
}

export function toTexture(c: HTMLCanvasElement, color: boolean, repeat = 1) {
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(repeat, repeat)
  t.anisotropy = 8
  t.needsUpdate = true
  return t
}

/** Converts a grayscale height canvas into a tangent-space normal map. */
export function heightToNormal(src: HTMLCanvasElement, strength: number) {
  const w = src.width
  const h = src.height
  const data = src.getContext('2d')!.getImageData(0, 0, w, h).data
  const { c, ctx } = makeCanvas(w, h)
  const out = ctx.createImageData(w, h)
  const H = (x: number, y: number) => data[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (H(x + 1, y) - H(x - 1, y)) * strength
      const dy = (H(x, y + 1) - H(x, y - 1)) * strength
      const len = Math.hypot(dx, dy, 1)
      const i = (y * w + x) * 4
      out.data[i] = ((-dx / len) * 0.5 + 0.5) * 255
      out.data[i + 1] = ((dy / len) * 0.5 + 0.5) * 255
      out.data[i + 2] = (1 / len) * 255
      out.data[i + 3] = 255
    }
  }
  ctx.putImageData(out, 0, 0)
  return c
}

/** Crinkled cellophane ("giấy kính") – random creases + fine grain → normal map. */
export function cellophaneNormal() {
  return cached('cellophaneNormal', () => {
    const rnd = mulberry32(7)
    const { c, ctx } = makeCanvas(256, 256)
    ctx.fillStyle = '#808080'
    ctx.fillRect(0, 0, 256, 256)
    ctx.filter = 'blur(1.2px)'
    for (let i = 0; i < 70; i++) {
      const x = rnd() * 256
      const y = rnd() * 256
      const a = rnd() * Math.PI
      const len = 30 + rnd() * 140
      ctx.strokeStyle = rnd() > 0.5 ? `rgba(255,255,255,${0.15 + rnd() * 0.25})` : `rgba(0,0,0,${0.15 + rnd() * 0.25})`
      ctx.lineWidth = 1 + rnd() * 3
      ctx.beginPath()
      ctx.moveTo(x - Math.cos(a) * len, y - Math.sin(a) * len)
      ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len)
      ctx.stroke()
    }
    ctx.filter = 'none'
    return toTexture(heightToNormal(c, 3), false, 2)
  })
}

/** Radial glow – bright at the candle, fading toward the star tips (emissiveMap). */
export function lanternGlow() {
  return cached('lanternGlow', () => {
    const { c, ctx } = makeCanvas(256, 256)
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
    g.addColorStop(0, '#ffffff')
    g.addColorStop(0.2, '#d8b89a')
    g.addColorStop(0.55, '#6a4634')
    g.addColorStop(1, '#2a1a12')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 256, 256)
    const t = toTexture(c, true)
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
    return t
  })
}

/** Soft additive halo sprite used around flames and lanterns. */
export function haloTexture() {
  return cached('halo', () => {
    const { c, ctx } = makeCanvas(128, 128)
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.2, 'rgba(255,255,255,0.45)')
    g.addColorStop(0.5, 'rgba(255,255,255,0.12)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
    const t = toTexture(c, true)
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
    return t
  })
}

/** Split-bamboo strip: longitudinal fibres along U, with colour variation. */
export function bambooTextures() {
  return cached('bamboo', () => {
    const rnd = mulberry32(11)
    const { c, ctx } = makeCanvas(256, 64)
    ctx.fillStyle = '#b8935a'
    ctx.fillRect(0, 0, 256, 64)
    for (let i = 0; i < 90; i++) {
      const y = rnd() * 64
      const light = rnd() > 0.5
      ctx.strokeStyle = light ? `rgba(235,205,150,${0.2 + rnd() * 0.3})` : `rgba(90,60,25,${0.15 + rnd() * 0.3})`
      ctx.lineWidth = 0.5 + rnd() * 1.5
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.bezierCurveTo(85, y + rnd() * 2 - 1, 170, y + rnd() * 2 - 1, 256, y)
      ctx.stroke()
    }
    // darker nodes
    for (const x of [60, 190]) {
      const g = ctx.createLinearGradient(x - 6, 0, x + 6, 0)
      g.addColorStop(0, 'rgba(80,50,20,0)')
      g.addColorStop(0.5, 'rgba(80,50,20,0.55)')
      g.addColorStop(1, 'rgba(80,50,20,0)')
      ctx.fillStyle = g
      ctx.fillRect(x - 6, 0, 12, 64)
    }
    return toTexture(c, true)
  }) as THREE.CanvasTexture
}

/** Aged terracotta courtyard tiles (gạch Bát Tràng) — returns colour, roughness, bump. */
export function courtyardTiles(repeat: number) {
  const key = 'tiles'
  const base = cached(key + ':map', () => buildTiles().map)
  const rough = cached(key + ':rough', () => buildTiles().rough)
  const bump = cached(key + ':bump', () => buildTiles().bump)
  for (const t of [base, rough, bump]) t.repeat.set(repeat, repeat)
  return { map: base, roughnessMap: rough, bumpMap: bump }
}

let tilesBuilt: { map: THREE.Texture; rough: THREE.Texture; bump: THREE.Texture } | null = null
function buildTiles() {
  if (tilesBuilt) return tilesBuilt
  const rnd = mulberry32(23)
  const N = 4
  const S = 512
  const cell = S / N
  const grout = 5
  const col = makeCanvas(S, S)
  const rough = makeCanvas(S, S)
  const bump = makeCanvas(S, S)
  col.ctx.fillStyle = '#3b2a22'
  col.ctx.fillRect(0, 0, S, S)
  rough.ctx.fillStyle = '#f0f0f0'
  rough.ctx.fillRect(0, 0, S, S)
  bump.ctx.fillStyle = '#000'
  bump.ctx.fillRect(0, 0, S, S)
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const x = i * cell + grout / 2
      const y = j * cell + grout / 2
      const w = cell - grout
      const hue = 12 + rnd() * 10
      const light = 30 + rnd() * 10
      col.ctx.fillStyle = `hsl(${hue}, ${45 + rnd() * 15}%, ${light}%)`
      col.ctx.fillRect(x, y, w, w)
      // wear: mottled blotches and moss in corners
      for (let k = 0; k < 40; k++) {
        const r = 3 + rnd() * 16
        col.ctx.fillStyle = rnd() > 0.7 ? `rgba(40,45,20,${rnd() * 0.18})` : `rgba(${rnd() > 0.5 ? 255 : 0},${rnd() > 0.5 ? 220 : 0},${rnd() > 0.5 ? 180 : 0},${rnd() * 0.07})`
        col.ctx.beginPath()
        col.ctx.arc(x + rnd() * w, y + rnd() * w, r, 0, Math.PI * 2)
        col.ctx.fill()
      }
      const r = 175 + rnd() * 60
      rough.ctx.fillStyle = `rgb(${r},${r},${r})`
      rough.ctx.fillRect(x, y, w, w)
      const b = 180 + rnd() * 60
      bump.ctx.fillStyle = `rgb(${b},${b},${b})`
      bump.ctx.fillRect(x + 1, y + 1, w - 2, w - 2)
      // chips on tile edges
      for (let k = 0; k < 6; k++) {
        bump.ctx.fillStyle = '#202020'
        const ex = rnd() > 0.5 ? x + (rnd() > 0.5 ? 0 : w - 4) : x + rnd() * w
        const ey = rnd() > 0.5 ? y + rnd() * w : y + (rnd() > 0.5 ? 0 : w - 4)
        bump.ctx.beginPath()
        bump.ctx.arc(ex, ey, 1 + rnd() * 4, 0, Math.PI * 2)
        bump.ctx.fill()
      }
    }
  }
  tilesBuilt = {
    map: toTexture(col.c, true),
    rough: toTexture(rough.c, false),
    bump: toTexture(bump.c, false),
  }
  return tilesBuilt
}

/** Weathered yellow lime-wash wall (tường vôi vàng) with damp stains at the base. */
export function limeWall() {
  return cached('limeWall', () => {
    const rnd = mulberry32(31)
    const W = 512
    const H = 256
    const { c, ctx } = makeCanvas(W, H)
    ctx.fillStyle = '#b89250'
    ctx.fillRect(0, 0, W, H)
    for (let i = 0; i < 400; i++) {
      const r = 2 + rnd() * 14
      ctx.fillStyle = rnd() > 0.5 ? `rgba(240,215,140,${rnd() * 0.05})` : `rgba(110,80,30,${rnd() * 0.05})`
      ctx.beginPath()
      ctx.arc(rnd() * W, rnd() * H, r, 0, Math.PI * 2)
      ctx.fill()
    }
    // damp band + moss near the ground
    const g = ctx.createLinearGradient(0, H * 0.55, 0, H)
    g.addColorStop(0, 'rgba(60,55,30,0)')
    g.addColorStop(0.7, 'rgba(60,60,30,0.45)')
    g.addColorStop(1, 'rgba(40,50,25,0.75)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
    // drip streaks
    for (let i = 0; i < 40; i++) {
      const x = rnd() * W
      const y = rnd() * H * 0.3
      const len = 30 + rnd() * 120
      const sg = ctx.createLinearGradient(0, y, 0, y + len)
      sg.addColorStop(0, 'rgba(80,60,30,0.07)')
      sg.addColorStop(1, 'rgba(80,60,30,0)')
      ctx.fillStyle = sg
      ctx.fillRect(x, y, 2 + rnd() * 5, len)
    }
    return toTexture(c, true)
  })
}

/** Dark lacquered wood grain (mặt phản gỗ). */
export function woodGrain() {
  return cached('wood', () => {
    const rnd = mulberry32(41)
    const { c, ctx } = makeCanvas(512, 128)
    ctx.fillStyle = '#4a2a18'
    ctx.fillRect(0, 0, 512, 128)
    for (let i = 0; i < 140; i++) {
      const y = rnd() * 128
      ctx.strokeStyle = rnd() > 0.5 ? `rgba(120,70,40,${0.2 + rnd() * 0.3})` : `rgba(25,12,6,${0.2 + rnd() * 0.35})`
      ctx.lineWidth = 0.5 + rnd() * 2
      ctx.beginPath()
      ctx.moveTo(0, y)
      for (let x = 0; x <= 512; x += 32) ctx.lineTo(x, y + Math.sin(x * 0.02 + i) * 2 + rnd())
      ctx.stroke()
    }
    return toTexture(c, true)
  })
}

/** Red tablecloth with a gold key-pattern border (khăn trải mâm). */
export function tableCloth() {
  return cached('cloth', () => {
    const rnd = mulberry32(53)
    const S = 1024
    const { c, ctx } = makeCanvas(S, S)
    ctx.fillStyle = '#7d1418'
    ctx.fillRect(0, 0, S, S)
    // woven fibre noise
    for (let i = 0; i < 9000; i++) {
      ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,120,110,0.05)' : 'rgba(0,0,0,0.07)'
      ctx.fillRect(rnd() * S, rnd() * S, 1 + rnd() * 3, 1)
    }
    // gold borders, placed where the cloth drapes over the table edge
    const band = (inset: number, width: number) => {
      ctx.strokeStyle = '#d6a64a'
      ctx.lineWidth = width
      ctx.strokeRect(inset, inset, S - inset * 2, S - inset * 2)
    }
    band(70, 6)
    band(96, 3)
    // meander (hồi văn) band
    ctx.strokeStyle = '#d6a64a'
    ctx.lineWidth = 3
    const step = 24
    for (let side = 0; side < 4; side++) {
      ctx.save()
      ctx.translate(S / 2, S / 2)
      ctx.rotate((side * Math.PI) / 2)
      ctx.translate(-S / 2, -S / 2)
      for (let x = 110; x < S - 110; x += step) {
        ctx.beginPath()
        ctx.moveTo(x, 40)
        ctx.lineTo(x, 28)
        ctx.lineTo(x + step * 0.7, 28)
        ctx.lineTo(x + step * 0.7, 52)
        ctx.lineTo(x + step * 0.3, 52)
        ctx.lineTo(x + step * 0.3, 40)
        ctx.stroke()
      }
      ctx.restore()
    }
    // centre medallion (moon + clouds motif)
    ctx.strokeStyle = 'rgba(214,166,74,0.7)'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(S / 2, S / 2, 150, 0, Math.PI * 2)
    ctx.stroke()
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(S / 2, S / 2, 132, 0, Math.PI * 2)
    ctx.stroke()
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2
      ctx.beginPath()
      ctx.arc(S / 2 + Math.cos(a) * 190, S / 2 + Math.sin(a) * 190, 22, a + 0.6, a + Math.PI * 1.6)
      ctx.stroke()
    }
    const t = toTexture(c, true)
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
    return t
  })
}
