import * as THREE from 'three'
import { mulberry32 } from '../lib/noise'

/**
 * Geometry for the đèn ông sao (5-pointed star lantern).
 *
 * A real ông sao is two bamboo pentagrams joined at their tips and pushed apart
 * at the centre by a short spacer; cellophane is stretched from the pentagram
 * outline to the spacer ends. That makes each face a shallow star pyramid, so
 * the body here is a faceted star bipyramid (flat-shaded, like folded paper).
 */

export const STAR_POINTS = 5
/** Inner radius ratio of a true pentagram: the tip-to-tip sticks pass exactly through the inner vertices. */
export const PENTAGRAM_RATIO = Math.cos((2 * Math.PI) / 5) / Math.cos(Math.PI / 5)

export function starOutline(R: number): THREE.Vector3[] {
  const r = R * PENTAGRAM_RATIO
  const pts: THREE.Vector3[] = []
  for (let i = 0; i < STAR_POINTS * 2; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / STAR_POINTS
    const rad = i % 2 === 0 ? R : r
    pts.push(new THREE.Vector3(Math.cos(a) * rad, Math.sin(a) * rad, 0))
  }
  return pts
}

export function starTips(R: number) {
  return starOutline(R).filter((_, i) => i % 2 === 0)
}

/** One face (front or back) of the paper body. */
export function starFaceGeometry(R: number, depth: number, side: 1 | -1) {
  const outline = starOutline(R)
  const apex = new THREE.Vector3(0, 0, depth * side)
  const pos: number[] = []
  const uv: number[] = []
  const pushV = (v: THREE.Vector3) => {
    pos.push(v.x, v.y, v.z)
    uv.push(v.x / (2 * R) + 0.5, v.y / (2 * R) + 0.5)
  }
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i]
    const b = outline[(i + 1) % outline.length]
    if (side === 1) {
      pushV(apex)
      pushV(a)
      pushV(b)
    } else {
      pushV(apex)
      pushV(b)
      pushV(a)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.computeVertexNormals() // non-indexed → crisp faceted paper folds
  return g
}

/** Bamboo frame: two pentagrams (front/back) and string lashings at the tips. */
export function starFrameGeometry(R: number, depth: number, stick = 0.007) {
  const tips = starTips(R)
  const parts: THREE.BufferGeometry[] = []
  const e = depth * 0.12 // the pentagrams sit slightly apart, meeting at the tips
  for (const z of [e, -e]) {
    for (let i = 0; i < STAR_POINTS; i++) {
      const a = tips[i].clone().setZ(0).multiplyScalar(1.05)
      const b = tips[(i + 2) % STAR_POINTS].clone().setZ(0).multiplyScalar(1.05)
      const mid = a.clone().lerp(b, 0.5).setZ(z)
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b)
      parts.push(new THREE.TubeGeometry(curve, 16, stick, 6, false))
    }
  }
  // string lashings where the sticks cross at the tips
  for (const t of tips) {
    const lash = new THREE.CylinderGeometry(stick * 1.9, stick * 1.9, stick * 5, 8)
    lash.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), t.clone().normalize()))
    lash.translate(t.x * 0.98, t.y * 0.98, 0)
    parts.push(lash)
  }
  return mergeGeometries(parts)
}

/** Crumpled paper fringe (tua rua) hanging from a tip, as flat ribbons. */
export function tasselGeometry(tip: THREE.Vector3, length: number, strands: number, seed: number) {
  const rnd = mulberry32(seed)
  const parts: THREE.BufferGeometry[] = []
  const out = tip.clone().setZ(0).normalize()
  for (let s = 0; s < strands; s++) {
    const spread = (rnd() - 0.5) * 0.9
    const dir = new THREE.Vector3(out.x * 0.55 + spread * out.y, out.y * 0.35 - 1, (rnd() - 0.5) * 0.5).normalize()
    const len = length * (0.7 + rnd() * 0.45)
    const p0 = tip.clone()
    const p1 = p0.clone().addScaledVector(out, len * 0.25).add(new THREE.Vector3(0, -len * 0.1, (rnd() - 0.5) * 0.03))
    const p2 = p0.clone().addScaledVector(dir, len * 0.7)
    const p3 = p0.clone().addScaledVector(dir, len).add(new THREE.Vector3(0, -len * 0.25, 0))
    const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3])
    parts.push(ribbonGeometry(curve, 0.006 + rnd() * 0.004, 12, rnd() * Math.PI))
  }
  return mergeGeometries(parts)
}

function ribbonGeometry(curve: THREE.Curve<THREE.Vector3>, width: number, segments: number, twist: number) {
  const pos: number[] = []
  const idx: number[] = []
  const up = new THREE.Vector3(0, 0, 1)
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const p = curve.getPoint(t)
    const tan = curve.getTangent(t)
    const side = new THREE.Vector3().crossVectors(tan, up).normalize()
    side.applyAxisAngle(tan, twist * t)
    const w = width * (1 - t * 0.3)
    pos.push(p.x - side.x * w, p.y - side.y * w, p.z - side.z * w, p.x + side.x * w, p.y + side.y * w, p.z + side.z * w)
    if (i < segments) {
      const a = i * 2
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

/** Minimal merge (positions/normals/uv) so each part is one draw call. */
export function mergeGeometries(geos: THREE.BufferGeometry[]) {
  const nonIndexed = geos.map((g) => (g.index ? g.toNonIndexed() : g))
  let count = 0
  for (const g of nonIndexed) count += g.attributes.position.count
  const pos = new Float32Array(count * 3)
  const nor = new Float32Array(count * 3)
  const uv = new Float32Array(count * 2)
  let o = 0
  for (const g of nonIndexed) {
    if (!g.attributes.normal) g.computeVertexNormals()
    const n = g.attributes.position.count
    pos.set(g.attributes.position.array as Float32Array, o * 3)
    nor.set(g.attributes.normal.array as Float32Array, o * 3)
    if (g.attributes.uv) uv.set(g.attributes.uv.array as Float32Array, o * 2)
    o += n
  }
  const out = new THREE.BufferGeometry()
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3))
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  out.computeBoundingSphere()
  return out
}
