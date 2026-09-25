import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useSceneStore } from '../store/useSceneStore'
import { cinema, SHOTS, shotWeight } from './director'

const v = new THREE.Vector3()

/**
 * Projects the caption's 3D anchor to the screen like drei's default, then
 * keeps the card inside the frame (16 px gutter) so it never gets cut off on
 * narrow or unusual aspect ratios.
 */
function clampedPosition(el: THREE.Object3D, camera: THREE.Camera, size: { width: number; height: number }) {
  v.setFromMatrixPosition(el.matrixWorld).project(camera)
  const x = (v.x * 0.5 + 0.5) * size.width
  const y = (-v.y * 0.5 + 0.5) * size.height
  const narrow = size.width < 600
  const w = Math.min(340, size.width * 0.78) + 20
  const h = narrow ? 210 : 190
  const bottomBar = narrow ? 90 : 24
  // on phones keep captions in the lower part of the frame, clear of the subject
  const minY = narrow ? size.height * 0.58 : 96
  return [
    THREE.MathUtils.clamp(x, 16, Math.max(16, size.width - w - 16)),
    THREE.MathUtils.clamp(y, minY, Math.max(minY, size.height - h - bottomBar)),
  ]
}

/**
 * One short line of meaning per shot, pinned to a point in the 3D world with
 * drei's Html, fading in only while that shot is on screen.
 */
export function Captions() {
  const refs = useRef<(HTMLDivElement | null)[]>([])
  const reducedMotion = useSceneStore((s) => s.reducedMotion)
  const letterOpen = useSceneStore((s) => s.letterOpen)
  useFrame(() => {
    // with reduced motion the camera cuts between shots, so captions cut with it
    const p = reducedMotion ? Math.round(cinema.p) : cinema.p
    refs.current.forEach((el, i) => {
      if (!el) return
      const w = letterOpen ? 0 : shotWeight(p, i, 0.42)
      const o = Math.min(1, w * 1.6)
      el.style.opacity = o.toFixed(3)
      el.style.transform = `translateY(${((1 - o) * 14).toFixed(1)}px)`
      el.style.visibility = o < 0.01 ? 'hidden' : 'visible'
    })
  })
  return (
    <>
      {SHOTS.map((s, i) => (
        <Html key={s.id} position={s.captionAt} calculatePosition={clampedPosition} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
          <div ref={(el) => {
            refs.current[i] = el
          }} className="caption" style={{ opacity: 0 }}>
            <p className="caption__index">{String(i + 1).padStart(2, '0')} / 04</p>
            <h2 className="caption__title">{s.title}</h2>
            <p className="caption__body">{s.caption}</p>
          </div>
        </Html>
      ))}
    </>
  )
}
