import * as THREE from 'three'

/**
 * The film's "script": one continuous village world, four shots.
 * `cinema.p` is the playhead in stage units (0 → 3), written by the scroll
 * director and read every frame by the camera/lighting rigs (no React renders).
 */
export const cinema = {
  /** Smoothed playhead 0..3 (scroll-scrubbed). */
  p: 0,
  /** Normalised pointer (-1..1) for subtle parallax. */
  pointer: new THREE.Vector2(),
}

export interface Shot {
  id: string
  title: string
  caption: string
  camera: [number, number, number]
  target: [number, number, number]
  /** World point the depth of field focuses on. */
  focus: [number, number, number]
  /** Where the caption is pinned in 3D. */
  captionAt: [number, number, number]
}

export const SHOTS: Shot[] = [
  {
    id: 'hoang-hon',
    title: 'Hoàng hôn buông',
    caption:
      'Chiều rằm tháng Tám, nắng cuối ngày nhuộm vàng mái đình. Phía đông, vầng trăng vừa nhô lên sau lũy tre làng.',
    camera: [-4, 2.4, 18],
    target: [0.5, 4.2, -8],
    focus: [0, 3, -8],
    captionAt: [-6.5, 5.2, -2],
  },
  {
    id: 'mam-co',
    title: 'Mâm cỗ đoàn viên',
    caption:
      'Bánh nướng, bánh dẻo, mâm ngũ quả bày giữa sân. Cả nhà quây quần phá cỗ, chờ trăng lên đỉnh ngọn tre.',
    camera: [5.35, 1.22, 5.45],
    target: [3.3, 0.82, 2.85],
    focus: [3.45, 0.85, 2.95],
    captionAt: [2.35, 1.62, 4.2],
  },
  {
    id: 'ruoc-den',
    title: 'Rước đèn',
    caption:
      'Tùng dinh dinh, cắc tùng dinh dinh… Đèn ông sao, đèn cá chép nối đuôi nhau quanh sân đình, theo nhịp trống múa lân.',
    camera: [-5.2, 1.15, 13.2],
    target: [-1.6, 1.15, 5.2],
    focus: [-3.6, 1, 7.4],
    captionAt: [-6.2, 2.5, 5],
  },
  {
    id: 'trang-ram',
    title: 'Trăng rằm',
    caption:
      'Trăng tròn nhất năm soi xuống ao làng. Trung Thu là tết của trẻ em, và của những người được trở về bên nhau.',
    camera: [1, 1.7, 35],
    target: [0.5, 5, -12],
    focus: [0.5, 1.5, 16],
    captionAt: [-9, 3.2, 20],
  },
]

/** Extra waypoints between shots so the camera glides instead of cutting in a straight line. */
const BETWEEN: { camera: [number, number, number]; target: [number, number, number] }[] = [
  { camera: [0.5, 2.1, 11], target: [2.6, 1.2, 1.5] },
  { camera: [0.8, 1.55, 11.5], target: [-0.5, 1.1, 3.8] },
  { camera: [-3, 2.3, 24], target: [0, 5, -4] },
]

function interleave(key: 'camera' | 'target') {
  const pts: THREE.Vector3[] = []
  SHOTS.forEach((s, i) => {
    pts.push(new THREE.Vector3(...s[key]))
    if (i < BETWEEN.length) pts.push(new THREE.Vector3(...BETWEEN[i][key]))
  })
  return new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5)
}

export const CAMERA_PATH = interleave('camera')
export const TARGET_PATH = interleave('target')

/**
 * Maps the playhead to the camera path so the camera *lingers* on each shot
 * and eases between them (hold ~20% at each end of a segment).
 */
export function shotEase(p: number) {
  const i = Math.min(Math.floor(p), SHOTS.length - 2)
  const u = THREE.MathUtils.clamp(p - i, 0, 1)
  const t = THREE.MathUtils.smoothstep(u, 0.18, 0.82)
  const eased = t * t * (3 - 2 * t) // extra softness at both ends
  return i + eased
}

/** Stage units → curve parameter (shots sit at every second control point). */
export const pathT = (s: number) => s / (SHOTS.length - 1)

/** 0..1 weight of how much shot `i` is "on screen" at playhead p. */
export const shotWeight = (p: number, i: number, width = 0.5) =>
  THREE.MathUtils.clamp(1 - Math.abs(p - i) / width, 0, 1)

/** Night-ness 0 (sunset) → 1 (deep night) with a gentle curve. */
export const nightness = (p: number) => THREE.MathUtils.smoothstep(p, 0, 2.6)

export const MOON_DISTANCE = 210
const MOON_RISE = new THREE.Vector3(0.4, 0.11, -0.9).normalize()
const MOON_HIGH = new THREE.Vector3(0.06, 0.235, -0.97).normalize()

/** Direction to the moon: it climbs from the horizon (shot 1) to high in the sky (shot 4). */
export function moonDirection(p: number, out = new THREE.Vector3()) {
  const k = THREE.MathUtils.smoothstep(p, 0.15, 3)
  return out.copy(MOON_RISE).lerp(MOON_HIGH, k).normalize()
}

/** Sun just below/at the western horizon behind the camera of shot 1. */
export const SUN_DIRECTION = new THREE.Vector3(-0.62, 0.2, 0.76).normalize()

/** Piecewise-linear blend of a per-shot vector (focus points etc.) at playhead p. */
export function blendShots(p: number, key: 'focus' | 'camera' | 'target', out = new THREE.Vector3()) {
  const i = Math.min(Math.floor(p), SHOTS.length - 2)
  const u = THREE.MathUtils.clamp(shotEase(p) - i, 0, 1)
  return out.set(...SHOTS[i][key]).lerp(new THREE.Vector3(...SHOTS[i + 1][key]), u)
}
