import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { cinema, moonDirection } from '../cinema/director'
import { flameMaterial, haloMaterial } from '../lanterns/materials'
import { fbm1 } from '../lib/noise'
import { useSceneStore } from '../store/useSceneStore'

const START = new THREE.Vector3(0.9, 0.35, 29.5)
const RISE_SECONDS = 16

/** Paper sky-lantern profile: open at the bottom, domed on top. */
function lanternProfile() {
  return Array.from({ length: 14 }, (_, i) => {
    const t = i / 13
    const r = t < 0.85 ? 0.17 + Math.sin(t * Math.PI * 0.6) * 0.1 : 0.25 * Math.cos(((t - 0.85) / 0.15) * (Math.PI / 2)) + 0.001
    return new THREE.Vector2(r, t * 0.62)
  })
}

/**
 * Đèn ước — released from the pond when the viewer taps "Thả đèn ước": a warm
 * paper lantern that drifts up toward the full moon, swaying, slowly shrinking
 * into a point of light. Glows via emissive + halo + bloom (no extra light,
 * so no shader recompiles when it appears).
 */
export function WishLantern() {
  const letterOpen = useSceneStore((s) => s.letterOpen)
  const group = useRef<THREE.Group>(null!)
  const t0 = useRef<number | null>(null)
  const geo = useMemo(() => new THREE.LatheGeometry(lanternProfile(), 24), [])
  const mats = useMemo(
    () => ({
      paper: new THREE.MeshStandardMaterial({
        color: '#ffcf8a',
        emissive: '#ff9a3a',
        emissiveIntensity: 2.2,
        side: THREE.DoubleSide,
        roughness: 0.8,
        transparent: true,
      }),
      flame: flameMaterial(),
      halo: haloMaterial('#ffb060', 0.5),
    }),
    [],
  )
  const dir = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ clock }) => {
    const g = group.current
    if (!letterOpen) {
      t0.current = null
      g.visible = false
      return
    }
    if (t0.current === null) t0.current = clock.elapsedTime
    const s = Math.min(1, (clock.elapsedTime - t0.current) / RISE_SECONDS)
    const e = s * s * (3 - 2 * s) * 0.6 + s * 0.4
    moonDirection(cinema.p, dir)
    g.visible = true
    g.position.copy(START).addScaledVector(dir, e * 70)
    g.position.y += Math.sin(s * Math.PI) * 1.5
    g.position.x += fbm1(clock.elapsedTime * 0.3) * 0.6 * s
    g.rotation.z = fbm1(clock.elapsedTime * 0.5 + 3) * 0.12
    g.rotation.y = clock.elapsedTime * 0.2
    const fade = 1 - THREE.MathUtils.smoothstep(s, 0.75, 1)
    mats.paper.opacity = fade
    mats.halo.opacity = 0.5 * fade
    mats.paper.emissiveIntensity = 2.2 * (0.9 + 0.1 * Math.sin(clock.elapsedTime * 7))
  })

  return (
    <group ref={group} visible={false}>
      <mesh geometry={geo} material={mats.paper} />
      <mesh material={mats.flame} position={[0, 0.05, 0]} scale={[0.8, 1.6, 0.8]}>
        <sphereGeometry args={[0.03, 10, 8]} />
      </mesh>
      <Billboard position={[0, 0.3, 0]}>
        <mesh material={mats.halo} scale={2.4}>
          <planeGeometry />
        </mesh>
      </Billboard>
    </group>
  )
}
