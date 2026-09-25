import * as THREE from 'three'
import { mulberry32 } from '../lib/noise'
import { cached, makeCanvas, toTexture } from '../lib/textures'

/** Carp scales painted on cellophane: bright centres, darker scale outlines, glow toward the belly. */
export function carpScales() {
  return cached('carpScales', () => {
    const S = 256
    const { c, ctx } = makeCanvas(S, S)
    const g = ctx.createLinearGradient(0, 0, 0, S)
    g.addColorStop(0, '#6a3010')
    g.addColorStop(0.5, '#f0e0c0')
    g.addColorStop(1, '#ffffff')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, S, S)
    ctx.strokeStyle = 'rgba(90,20,0,0.55)'
    ctx.lineWidth = 2
    const r = 14
    for (let row = 0; row < S / (r * 0.9) + 1; row++) {
      for (let col = 0; col < S / (r * 1.6) + 1; col++) {
        const x = col * r * 1.6 + (row % 2) * r * 0.8
        const y = row * r * 0.9
        ctx.beginPath()
        ctx.arc(x, y, r, 0.15 * Math.PI, 0.85 * Math.PI)
        ctx.stroke()
      }
    }
    return toTexture(c, true, 1)
  })
}

/**
 * The inner drum of a đèn kéo quân: black paper cut-outs of generals on
 * horseback, flag bearers and soldiers — their shadows march round the lantern.
 */
export function keoQuanSilhouettes() {
  return cached('keoQuan', () => {
    const rnd = mulberry32(401)
    const W = 1024
    const H = 256
    const { c, ctx } = makeCanvas(W, H)
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#000'
    ctx.strokeStyle = '#000'
    ctx.lineCap = 'round'
    const ground = H * 0.86
    const figures = 6
    for (let i = 0; i < figures; i++) {
      const x = (i + 0.5) * (W / figures)
      ctx.save()
      ctx.translate(x, 0)
      if (i % 2 === 0) {
        // general on a galloping horse
        ctx.beginPath()
        ctx.ellipse(0, ground - 70, 46, 22, -0.08, 0, Math.PI * 2)
        ctx.fill()
        ctx.lineWidth = 7
        for (const [lx, ang] of [
          [-30, 0.5],
          [-18, -0.3],
          [22, 0.4],
          [34, -0.5],
        ]) {
          ctx.beginPath()
          ctx.moveTo(lx, ground - 60)
          ctx.lineTo(lx + Math.sin(ang) * 40, ground - 8)
          ctx.stroke()
        }
        // neck & head
        ctx.lineWidth = 16
        ctx.beginPath()
        ctx.moveTo(34, ground - 80)
        ctx.lineTo(58, ground - 116)
        ctx.stroke()
        ctx.beginPath()
        ctx.ellipse(66, ground - 118, 16, 8, 0.5, 0, Math.PI * 2)
        ctx.fill()
        // tail
        ctx.lineWidth = 6
        ctx.beginPath()
        ctx.moveTo(-44, ground - 78)
        ctx.quadraticCurveTo(-72, ground - 70, -66, ground - 40)
        ctx.stroke()
        // rider with spear and pennant
        ctx.beginPath()
        ctx.ellipse(-2, ground - 112, 13, 24, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(0, ground - 146, 11, 0, Math.PI * 2)
        ctx.fill()
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.moveTo(-20, ground - 90)
        ctx.lineTo(40, ground - 200)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(40, ground - 200)
        ctx.lineTo(10, ground - 190)
        ctx.lineTo(34, ground - 176)
        ctx.fill()
      } else {
        // foot soldier carrying a big flag
        ctx.beginPath()
        ctx.ellipse(0, ground - 58, 12, 26, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(0, ground - 94, 11, 0, Math.PI * 2)
        ctx.fill()
        ctx.lineWidth = 7
        ctx.beginPath()
        ctx.moveTo(-4, ground - 36)
        ctx.lineTo(-16 - rnd() * 6, ground)
        ctx.moveTo(4, ground - 36)
        ctx.lineTo(16 + rnd() * 6, ground)
        ctx.stroke()
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.moveTo(8, ground - 60)
        ctx.lineTo(8, ground - 200)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(8, ground - 200)
        ctx.lineTo(58, ground - 185)
        ctx.lineTo(8, ground - 160)
        ctx.fill()
      }
      ctx.restore()
    }
    ctx.fillRect(0, ground, W, 6)
    const t = toTexture(c, true)
    t.wrapT = THREE.ClampToEdgeWrapping
    return t
  })
}

/** Outer paper of the kéo quân: warm rice paper with a red painted border on each panel. */
export function keoQuanPaper() {
  return cached('keoQuanPaper', () => {
    const S = 256
    const { c, ctx } = makeCanvas(S, S)
    const g = ctx.createRadialGradient(S / 2, S / 2, 10, S / 2, S / 2, S * 0.7)
    g.addColorStop(0, '#fff6e0')
    g.addColorStop(1, '#e8c890')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, S, S)
    ctx.strokeStyle = '#b02010'
    ctx.lineWidth = 14
    ctx.strokeRect(0, 0, S, S)
    ctx.lineWidth = 3
    ctx.strokeRect(18, 18, S - 36, S - 36)
    const t = toTexture(c, true)
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
    return t
  })
}

/** Papier-mâché paint for the lion head: bands of red, gold and green with scale and cloud motifs. */
export function lionPaint() {
  return cached('lionPaint', () => {
    const rnd = mulberry32(419)
    const W = 512
    const H = 256
    const { c, ctx } = makeCanvas(W, H)
    const bands = ['#c81e1e', '#f2b01e', '#c81e1e', '#1e8a4a', '#f2b01e', '#c81e1e']
    bands.forEach((col, i) => {
      ctx.fillStyle = col
      ctx.fillRect(0, (i * H) / bands.length, W, H / bands.length + 1)
    })
    // gold scale pattern on the crown
    ctx.strokeStyle = 'rgba(255,220,120,0.8)'
    ctx.lineWidth = 2
    for (let y = 0; y < H * 0.35; y += 12) {
      for (let x = (y / 12) % 2 ? 8 : 0; x < W; x += 16) {
        ctx.beginPath()
        ctx.arc(x, y, 8, 0, Math.PI)
        ctx.stroke()
      }
    }
    // cloud swirls
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'
    ctx.lineWidth = 3
    for (let i = 0; i < 26; i++) {
      const x = rnd() * W
      const y = H * 0.4 + rnd() * H * 0.55
      ctx.beginPath()
      for (let k = 0; k < 30; k++) {
        const a = k * 0.35
        const r = k * 0.6
        if (k === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r)
      }
      ctx.stroke()
    }
    // paper fibre noise
    for (let i = 0; i < 6000; i++) {
      ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'
      ctx.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 2, 1)
    }
    return toTexture(c, true)
  })
}

/** Silk body cloth of the lion: rows of scales in red and gold, fringed edge. */
export function lionCloth() {
  return cached('lionCloth', () => {
    const W = 512
    const H = 256
    const { c, ctx } = makeCanvas(W, H)
    ctx.fillStyle = '#b8161a'
    ctx.fillRect(0, 0, W, H)
    const r = 16
    for (let row = 0; row < H / (r * 0.8) + 1; row++) {
      for (let col = 0; col < W / (r * 1.6) + 1; col++) {
        const x = col * r * 1.6 + (row % 2) * r * 0.8
        const y = row * r * 0.8
        const g = ctx.createRadialGradient(x, y - 4, 2, x, y, r)
        g.addColorStop(0, row % 3 === 0 ? '#ffd55a' : '#f06a2a')
        g.addColorStop(1, '#8a0e12')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI)
        ctx.fill()
      }
    }
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, H - 14, W, 14)
    return toTexture(c, true)
  })
}

/** A single dry leaf with alpha, for the falling-leaf particles. */
export function dryLeaf() {
  return cached('dryLeaf', () => {
    const S = 64
    const { c, ctx } = makeCanvas(S, S)
    ctx.clearRect(0, 0, S, S)
    ctx.fillStyle = '#c8902a'
    ctx.beginPath()
    ctx.moveTo(S / 2, 4)
    ctx.quadraticCurveTo(S - 6, S / 2, S / 2, S - 4)
    ctx.quadraticCurveTo(6, S / 2, S / 2, 4)
    ctx.fill()
    ctx.strokeStyle = 'rgba(90,50,10,0.7)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(S / 2, 6)
    ctx.lineTo(S / 2, S - 6)
    ctx.stroke()
    const t = toTexture(c, true)
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
    return t
  })
}
