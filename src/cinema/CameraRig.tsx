import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { noise1 } from '../lib/noise'
import { useSceneStore } from '../store/useSceneStore'
import { CAMERA_PATH, cinema, pathT, shotEase, TARGET_PATH } from './director'

/**
 * Flies the camera along the spline through the four shots. The playhead is
 * already smoothed by GSAP's scrub; on top of that: a slow handheld drift and
 * a little pointer parallax, so the shot is never perfectly still.
 * With prefers-reduced-motion the camera cuts between the four fixed shots.
 */
export function CameraRig() {
  const reducedMotion = useSceneStore((s) => s.reducedMotion)
  const v = useMemo(
    () => ({ pos: new THREE.Vector3(), tgt: new THREE.Vector3(), right: new THREE.Vector3(), par: new THREE.Vector2() }),
    [],
  )

  useFrame(({ camera, clock }, dt) => {
    const s = reducedMotion ? Math.round(cinema.p) : shotEase(cinema.p)
    CAMERA_PATH.getPoint(pathT(s), v.pos)
    TARGET_PATH.getPoint(pathT(s), v.tgt)
    if (!reducedMotion) {
      const t = clock.elapsedTime
      v.pos.x += noise1(t * 0.11) * 0.08
      v.pos.y += noise1(t * 0.13 + 10) * 0.05
      v.tgt.x += noise1(t * 0.09 + 20) * 0.06
      // eased pointer parallax
      v.par.lerp(cinema.pointer, 1 - Math.exp(-dt * 2))
      v.right.subVectors(v.tgt, v.pos).cross(camera.up).normalize()
      v.pos.addScaledVector(v.right, v.par.x * 0.25).addScaledVector(camera.up, v.par.y * 0.12)
    }
    camera.position.copy(v.pos)
    camera.lookAt(v.tgt)
  })
  return null
}
