import * as THREE from 'three'

export interface RoofSpec {
  /** Length along the ridge (x). */
  width: number
  /** Building depth (z), eave to eave without overhang. */
  depth: number
  ridgeY: number
  eaveY: number
  /** How far the roof extends past the walls. */
  overhang: number
  /** Corner lift (the curled "đao" of a đình roof), metres. */
  curl: number
  /** Concave sag of the slope, metres. */
  sag: number
}

/**
 * Vietnamese curved roof: two concave slopes whose corners lift upward.
 * Returns the tile surface with UVs (u across, v down the slope) plus the
 * eave curve for the fascia and corner hooks.
 */
export function curvedRoofGeometry(spec: RoofSpec, nx = 48, ns = 16) {
  const { width, depth, ridgeY, eaveY, overhang, curl, sag } = spec
  const X = width / 2 + overhang
  const Z = depth / 2 + overhang
  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  const eaves: THREE.Vector3[][] = [[], []]
  let base = 0
  for (const side of [1, -1]) {
    for (let j = 0; j <= ns; j++) {
      const s = j / ns
      for (let i = 0; i <= nx; i++) {
        const u = i / nx
        const x = -X + u * 2 * X
        const edge = Math.pow(Math.abs(x) / X, 5)
        const y = ridgeY - s * (ridgeY - eaveY) - sag * Math.sin(Math.PI * s) + curl * edge * (0.25 + 0.75 * s * s)
        const z = side * (s * Z + edge * s * overhang * 0.35)
        pos.push(x, y, z)
        uv.push(u * (width / 2.2), s * ((Z * 1.3) / 1.8))
        if (j === ns) eaves[side === 1 ? 0 : 1].push(new THREE.Vector3(x, y, z))
      }
    }
    for (let j = 0; j < ns; j++) {
      for (let i = 0; i < nx; i++) {
        const a = base + j * (nx + 1) + i
        const b = a + 1
        const c = a + nx + 1
        const d = c + 1
        if (side === 1) idx.push(a, c, b, b, c, d)
        else idx.push(a, b, c, b, d, c)
      }
    }
    base += (ns + 1) * (nx + 1)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  return { geometry: g, eaves: eaves.map((pts) => new THREE.CatmullRomCurve3(pts)) }
}

/** Ridge beam with upturned, curling ends. */
export function ridgeCurve(halfLength: number, y: number, lift: number) {
  const L = halfLength
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(-L - lift * 0.35, y + lift * 1.1, 0),
    new THREE.Vector3(-L - lift * 0.1, y + lift * 0.45, 0),
    new THREE.Vector3(-L + lift * 0.4, y + 0.02, 0),
    new THREE.Vector3(0, y, 0),
    new THREE.Vector3(L - lift * 0.4, y + 0.02, 0),
    new THREE.Vector3(L + lift * 0.1, y + lift * 0.45, 0),
    new THREE.Vector3(L + lift * 0.35, y + lift * 1.1, 0),
  ])
}

/** Triangular gable wall (đầu hồi) filling the roof end. */
export function gableGeometry(halfDepth: number, eaveY: number, ridgeY: number) {
  const shape = new THREE.Shape()
  shape.moveTo(-halfDepth, eaveY)
  shape.lineTo(halfDepth, eaveY)
  shape.lineTo(0, ridgeY)
  shape.closePath()
  const g = new THREE.ShapeGeometry(shape)
  g.rotateY(Math.PI / 2)
  return g
}
