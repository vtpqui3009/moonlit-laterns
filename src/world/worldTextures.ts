import * as THREE from 'three'
import { mulberry32 } from '../lib/noise'
import { cached, heightToNormal, makeCanvas, toTexture } from '../lib/textures'

/** Clay roof tiles (ngói ta / ngói mũi hài) running down the slope, weathered with moss. */
export function roofTiles() {
  return cached('roofTiles', () => {
    const rnd = mulberry32(61)
    const W = 512
    const H = 512
    const col = makeCanvas(W, H)
    const hgt = makeCanvas(W, H)
    const cols = 16
    const rows = 12
    const cw = W / cols
    const rh = H / rows
    col.ctx.fillStyle = '#3a1a12'
    col.ctx.fillRect(0, 0, W, H)
    hgt.ctx.fillStyle = '#000'
    hgt.ctx.fillRect(0, 0, W, H)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * cw + (r % 2 ? cw / 2 : 0)
        const y = r * rh
        const l = 28 + rnd() * 12
        col.ctx.fillStyle = `hsl(${10 + rnd() * 10}, ${40 + rnd() * 20}%, ${l}%)`
        // "mũi hài" tile: rectangle with a rounded lower edge
        const draw = (ctx: CanvasRenderingContext2D) => {
          ctx.beginPath()
          ctx.moveTo(x + 1, y)
          ctx.lineTo(x + cw - 1, y)
          ctx.lineTo(x + cw - 1, y + rh * 0.8)
          ctx.quadraticCurveTo(x + cw / 2, y + rh * 1.25, x + 1, y + rh * 0.8)
          ctx.closePath()
          ctx.fill()
        }
        draw(col.ctx)
        // wrap horizontally
        if (x + cw > W) {
          col.ctx.save()
          col.ctx.translate(-W, 0)
          draw(col.ctx)
          col.ctx.restore()
        }
        const g = hgt.ctx.createLinearGradient(0, y, 0, y + rh * 1.2)
        g.addColorStop(0, '#303030')
        g.addColorStop(1, '#e0e0e0')
        hgt.ctx.fillStyle = g
        draw(hgt.ctx)
        // moss & soot
        if (rnd() > 0.55) {
          col.ctx.fillStyle = `rgba(${40 + rnd() * 30},${55 + rnd() * 30},${25},${0.25 + rnd() * 0.35})`
          col.ctx.beginPath()
          col.ctx.arc(x + rnd() * cw, y + rh * (0.3 + rnd() * 0.5), 3 + rnd() * 8, 0, Math.PI * 2)
          col.ctx.fill()
        }
      }
    }
    const map = toTexture(col.c, true)
    const normalMap = toTexture(heightToNormal(hgt.c, 4), false)
    ;(map as THREE.Texture & { userData: object }).userData = { normalMap }
    return map
  })
}

export function roofTileNormal() {
  return (roofTiles().userData as { normalMap: THREE.Texture }).normalMap
}

/**
 * Full-moon disc. The maria are painted loosely — and, as every Vietnamese child
 * is told, the dark shape is chú Cuội sitting under his cây đa.
 */
export function moonTexture() {
  return cached('moon', () => {
    const rnd = mulberry32(71)
    const S = 512
    const { c, ctx } = makeCanvas(S, S)
    const g = ctx.createRadialGradient(S * 0.45, S * 0.42, 0, S / 2, S / 2, S / 2)
    g.addColorStop(0, '#fffaf0')
    g.addColorStop(0.7, '#f6e9c8')
    g.addColorStop(1, '#e0c98e')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, S, S)
    // maria (soft grey-blue blotches)
    ctx.filter = 'blur(10px)'
    for (let i = 0; i < 16; i++) {
      ctx.fillStyle = `rgba(150,150,160,${0.12 + rnd() * 0.14})`
      ctx.beginPath()
      ctx.ellipse(S * (0.25 + rnd() * 0.5), S * (0.2 + rnd() * 0.55), 20 + rnd() * 60, 16 + rnd() * 45, rnd() * 3, 0, Math.PI * 2)
      ctx.fill()
    }
    // the banyan silhouette, very faint
    ctx.filter = 'blur(6px)'
    ctx.fillStyle = 'rgba(120,120,135,0.28)'
    ctx.beginPath()
    ctx.ellipse(S * 0.6, S * 0.38, 70, 48, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(S * 0.585, S * 0.4, 22, 110)
    ctx.beginPath()
    ctx.ellipse(S * 0.52, S * 0.62, 18, 26, 0, 0, Math.PI * 2)
    ctx.fill()
    // craters
    ctx.filter = 'blur(1px)'
    for (let i = 0; i < 90; i++) {
      const x = S * 0.5 + (rnd() - 0.5) * S * 0.9
      const y = S * 0.5 + (rnd() - 0.5) * S * 0.9
      const r = 2 + rnd() * rnd() * 16
      ctx.strokeStyle = `rgba(255,255,255,${0.1 + rnd() * 0.25})`
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = `rgba(140,135,130,${0.08 + rnd() * 0.12})`
      ctx.fill()
    }
    ctx.filter = 'none'
    const t = toTexture(c, true)
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
    return t
  })
}

/** Village earth: packed dirt, trampled grass and fallen leaves, for everything outside the courtyard. */
export function fieldGround(repeat: number) {
  const t = cached('field', () => {
    const rnd = mulberry32(83)
    const S = 512
    const { c, ctx } = makeCanvas(S, S)
    ctx.fillStyle = '#2b2a1a'
    ctx.fillRect(0, 0, S, S)
    for (let i = 0; i < 2600; i++) {
      const grass = rnd() > 0.45
      ctx.fillStyle = grass
        ? `hsla(${70 + rnd() * 40}, ${30 + rnd() * 25}%, ${14 + rnd() * 14}%, ${0.5 + rnd() * 0.5})`
        : `hsla(${25 + rnd() * 15}, ${25 + rnd() * 20}%, ${16 + rnd() * 12}%, ${0.4 + rnd() * 0.4})`
      if (grass) {
        const x = rnd() * S
        const y = rnd() * S
        ctx.fillRect(x, y, 1 + rnd() * 1.5, 3 + rnd() * 6)
      } else {
        ctx.beginPath()
        ctx.arc(rnd() * S, rnd() * S, 1 + rnd() * 5, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    return toTexture(c, true)
  })
  t.repeat.set(repeat, repeat)
  return t
}

/** A small cluster of banyan leaves with alpha, for instanced leaf cards. */
export function leafCard() {
  return cached('leafCard', () => {
    const rnd = mulberry32(97)
    const S = 128
    const { c, ctx } = makeCanvas(S, S)
    ctx.clearRect(0, 0, S, S)
    for (let i = 0; i < 9; i++) {
      const x = S * (0.2 + rnd() * 0.6)
      const y = S * (0.2 + rnd() * 0.6)
      const a = rnd() * Math.PI * 2
      const l = 18 + rnd() * 16
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(a)
      ctx.fillStyle = `hsl(${95 + rnd() * 30}, ${35 + rnd() * 20}%, ${18 + rnd() * 16}%)`
      ctx.beginPath()
      ctx.ellipse(0, 0, l, l * 0.48, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(200,220,150,0.25)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(-l, 0)
      ctx.lineTo(l, 0)
      ctx.stroke()
      ctx.restore()
    }
    const t = toTexture(c, true)
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
    return t
  })
}

/** Carved, lacquered ironwood (gỗ lim) for the đình columns and beams. */
export function lacquerWood() {
  return cached('lacquer', () => {
    const rnd = mulberry32(101)
    const { c, ctx } = makeCanvas(256, 256)
    ctx.fillStyle = '#4a1c12'
    ctx.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 120; i++) {
      ctx.strokeStyle = rnd() > 0.5 ? `rgba(120,50,30,${0.2 + rnd() * 0.3})` : `rgba(20,6,4,${0.2 + rnd() * 0.3})`
      ctx.lineWidth = 0.5 + rnd() * 2
      const x = rnd() * 256
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.bezierCurveTo(x + rnd() * 6 - 3, 90, x + rnd() * 6 - 3, 170, x, 256)
      ctx.stroke()
    }
    return toTexture(c, true)
  })
}

/** Soft ring for the 22° lunar halo (quầng trăng). */
export function haloRing() {
  return cached('haloRing', () => {
    const S = 256
    const { c, ctx } = makeCanvas(S, S)
    const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2)
    g.addColorStop(0, 'rgba(255,255,255,0)')
    g.addColorStop(0.72, 'rgba(255,255,255,0)')
    g.addColorStop(0.8, 'rgba(255,236,200,0.55)')
    g.addColorStop(0.84, 'rgba(200,220,255,0.35)')
    g.addColorStop(0.95, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, S, S)
    const t = toTexture(c, true)
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
    return t
  })
}
