import type * as THREE from 'three'
import { fbm1 } from '../lib/noise'

/** Candle flicker factor ≈ 0.8–1.05: slow breathing noise plus a small fast jitter. */
export function flicker(t: number, seed: number, reducedMotion: boolean) {
  const f = 0.82 + 0.18 * fbm1(t * 5.3 + seed * 7.1, 3) + 0.05 * Math.sin(t * 23 + seed)
  return reducedMotion ? 0.95 + (f - 0.82) * 0.25 : f
}

/**
 * Point-light shadows re-render six cube faces every frame. Only refresh them
 * while the playhead is in the range where this light is on screen; otherwise
 * the last shadow map is kept (the shader count never changes, so no recompiles).
 */
export function gateShadow(light: THREE.PointLight | null, p: number, range?: [number, number]) {
  if (!light || !light.castShadow || !range) return
  light.shadow.autoUpdate = p >= range[0] && p <= range[1]
}
