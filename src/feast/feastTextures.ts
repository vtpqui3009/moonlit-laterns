import * as THREE from 'three'
import { mulberry32 } from '../lib/noise'
import { cached, heightToNormal, makeCanvas, toTexture } from '../lib/textures'

/**
 * Bánh nướng top: egg-washed golden crust, darker at the rim, with an embossed
 * scalloped border and a four-petal medallion. Returns colour, roughness
 * (glazed top is shinier than the matte crumbs) and a normal map for the relief.
 */
export function banhNuongMaps() {
  const key = 'banhNuong'
  const S = 256
  const build = () => {
    const rnd = mulberry32(211)
    const col = makeCanvas(S, S)
    const rough = makeCanvas(S, S)
    const hgt = makeCanvas(S, S)
    // colour: golden centre → caramel edges
    const g = col.ctx.createRadialGradient(S / 2, S / 2, 10, S / 2, S / 2, S * 0.72)
    g.addColorStop(0, '#d99a45')
    g.addColorStop(0.55, '#b86f28')
    g.addColorStop(1, '#6e3a14')
    col.ctx.fillStyle = g
    col.ctx.fillRect(0, 0, S, S)
    for (let i = 0; i < 1400; i++) {
      col.ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,220,150,0.08)' : 'rgba(80,30,5,0.1)'
      col.ctx.fillRect(rnd() * S, rnd() * S, 1 + rnd() * 2, 1 + rnd() * 2)
    }
    // relief
    hgt.ctx.fillStyle = '#404040'
    hgt.ctx.fillRect(0, 0, S, S)
    hgt.ctx.filter = 'blur(2px)'
    hgt.ctx.strokeStyle = '#d0d0d0'
    hgt.ctx.lineWidth = 7
    const scallops = 28
    hgt.ctx.beginPath()
    for (let i = 0; i <= scallops * 8; i++) {
      const a = (i / (scallops * 8)) * Math.PI * 2
      const r = S * 0.38 + Math.abs(Math.sin(a * scallops * 0.5)) * 8
      const x = S / 2 + Math.cos(a) * r
      const y = S / 2 + Math.sin(a) * r
      if (i === 0) hgt.ctx.moveTo(x, y)
      else hgt.ctx.lineTo(x, y)
    }
    hgt.ctx.stroke()
    hgt.ctx.lineWidth = 5
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + Math.PI / 4
      hgt.ctx.beginPath()
      hgt.ctx.ellipse(S / 2 + Math.cos(a) * 30, S / 2 + Math.sin(a) * 30, 26, 13, a, 0, Math.PI * 2)
      hgt.ctx.stroke()
    }
    hgt.ctx.beginPath()
    hgt.ctx.arc(S / 2, S / 2, 12, 0, Math.PI * 2)
    hgt.ctx.fillStyle = '#e0e0e0'
    hgt.ctx.fill()
    hgt.ctx.filter = 'none'
    // raised relief catches more egg-wash → lighter & glossier
    col.ctx.globalCompositeOperation = 'screen'
    col.ctx.globalAlpha = 0.35
    col.ctx.drawImage(hgt.c, 0, 0)
    col.ctx.globalAlpha = 1
    col.ctx.globalCompositeOperation = 'source-over'
    rough.ctx.fillStyle = '#707070'
    rough.ctx.fillRect(0, 0, S, S)
    rough.ctx.globalCompositeOperation = 'difference'
    rough.ctx.globalAlpha = 0.5
    rough.ctx.drawImage(hgt.c, 0, 0)
    return {
      map: toTexture(col.c, true),
      roughnessMap: toTexture(rough.c, false),
      normalMap: toTexture(heightToNormal(hgt.c, 5), false),
    }
  }
  const map = cached(key + ':map', () => {
    const b = build()
    ;(b.map as THREE.Texture).userData = b
    return b.map
  })
  return map.userData as { map: THREE.Texture; roughnessMap: THREE.Texture; normalMap: THREE.Texture }
}

/** Bánh dẻo: soft, powdery glutinous-rice skin with a pressed flower mould. */
export function banhDeoMaps() {
  const map = cached('banhDeo', () => {
    const rnd = mulberry32(223)
    const S = 256
    const col = makeCanvas(S, S)
    const hgt = makeCanvas(S, S)
    col.ctx.fillStyle = '#efe9dc'
    col.ctx.fillRect(0, 0, S, S)
    for (let i = 0; i < 2000; i++) {
      col.ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.25)' : 'rgba(200,190,170,0.15)'
      col.ctx.fillRect(rnd() * S, rnd() * S, 1, 1)
    }
    hgt.ctx.fillStyle = '#505050'
    hgt.ctx.fillRect(0, 0, S, S)
    hgt.ctx.filter = 'blur(3px)'
    hgt.ctx.fillStyle = '#c0c0c0'
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2
      hgt.ctx.beginPath()
      hgt.ctx.ellipse(S / 2 + Math.cos(a) * 48, S / 2 + Math.sin(a) * 48, 30, 14, a, 0, Math.PI * 2)
      hgt.ctx.fill()
    }
    hgt.ctx.beginPath()
    hgt.ctx.arc(S / 2, S / 2, 20, 0, Math.PI * 2)
    hgt.ctx.fill()
    const t = toTexture(col.c, true)
    t.userData = { map: t, normalMap: toTexture(heightToNormal(hgt.c, 3), false) }
    return t
  })
  return map.userData as { map: THREE.Texture; normalMap: THREE.Texture }
}

/** Pitted citrus peel (bưởi, quýt) → normal map. */
export function peelNormal() {
  return cached('peel', () => {
    const rnd = mulberry32(229)
    const S = 256
    const { c, ctx } = makeCanvas(S, S)
    ctx.fillStyle = '#909090'
    ctx.fillRect(0, 0, S, S)
    for (let i = 0; i < 2500; i++) {
      ctx.fillStyle = `rgba(0,0,0,${0.2 + rnd() * 0.3})`
      ctx.beginPath()
      ctx.arc(rnd() * S, rnd() * S, 0.6 + rnd() * 1.4, 0, Math.PI * 2)
      ctx.fill()
    }
    return toTexture(heightToNormal(c, 2.5), false, 2)
  })
}

/** Woven sedge sleeping mat (chiếu cói) with a red border pattern. */
export function chieuCoi() {
  return cached('chieu', () => {
    const rnd = mulberry32(233)
    const S = 512
    const { c, ctx } = makeCanvas(S, S)
    ctx.fillStyle = '#c9a86a'
    ctx.fillRect(0, 0, S, S)
    for (let y = 0; y < S; y += 4) {
      ctx.fillStyle = `rgba(${120 + rnd() * 40},${90 + rnd() * 30},${40},0.35)`
      ctx.fillRect(0, y, S, 2)
    }
    for (let x = 0; x < S; x += 16) {
      ctx.fillStyle = 'rgba(90,60,20,0.18)'
      ctx.fillRect(x, 0, 2, S)
    }
    ctx.strokeStyle = '#9c2a1c'
    ctx.lineWidth = 10
    ctx.strokeRect(30, 30, S - 60, S - 60)
    ctx.lineWidth = 4
    ctx.strokeRect(52, 52, S - 104, S - 104)
    for (let i = 0; i < 12; i++) {
      const x = 80 + i * ((S - 160) / 11)
      ctx.fillStyle = '#9c2a1c'
      ctx.save()
      ctx.translate(x, 41)
      ctx.rotate(Math.PI / 4)
      ctx.fillRect(-5, -5, 10, 10)
      ctx.restore()
    }
    return toTexture(c, true)
  })
}
