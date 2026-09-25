import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { flameMaterial, haloMaterial } from '../lanterns/materials'
import { fbm1, mulberry32 } from '../lib/noise'
import { useSceneStore } from '../store/useSceneStore'
import { POND } from './Pond'
import { cinema } from '../cinema/director'

/**
 * Hoa đăng — paper lotus lanterns set afloat on the pond. They drift on slow
 * noise currents and bob; their flames glow (no real lights — the water
 * reflection and bloom do the work).
 */
export function FloatingLanterns({ count = 9 }) {
  const reducedMotion = useSceneStore((s) => s.reducedMotion)
  const items = useMemo(() => {
    const rnd = mulberry32(809)
    const drifting = Array.from({ length: count }, (_, i) => ({
      a: rnd() * Math.PI * 2,
      r: 0.2 + rnd() * 0.55,
      seed: i * 7.3,
      color: ['#ffb6c8', '#fff0e0', '#ffd0a0'][i % 3],
      pair: 0,
    }))
    // two lanterns that find each other in front of the camera as the full moon rises
    const pair = [-1, 1].map((side, k) => ({ a: 0, r: 0, seed: 91 + k * 13, color: k ? '#ffb6c8' : '#fff0e0', pair: side }))
    return [...drifting, ...pair]
  }, [count])
  const petals = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.quadraticCurveTo(0.05, 0.06, 0, 0.13)
    shape.quadraticCurveTo(-0.05, 0.06, 0, 0)
    return new THREE.ShapeGeometry(shape, 8)
  }, [])
  const mats = useMemo(
    () =>
      ['#ffb6c8', '#fff0e0', '#ffd0a0'].reduce(
        (acc, c) => {
          acc[c] = new THREE.MeshStandardMaterial({ color: c, emissive: '#ff9a50', emissiveIntensity: 0.9, side: THREE.DoubleSide, roughness: 0.7 })
          return acc
        },
        {} as Record<string, THREE.MeshStandardMaterial>,
      ),
    [],
  )
  const flame = useMemo(() => flameMaterial(), [])
  const halo = useMemo(() => haloMaterial('#ffa050', 0.35), [])
  const refs = useRef<(THREE.Group | null)[]>([])

  useFrame(({ clock }) => {
    const t = reducedMotion ? 0 : clock.elapsedTime
    items.forEach((it, i) => {
      const g = refs.current[i]
      if (!g) return
      if (it.pair) {
        // far apart at dusk, side by side under the full moon
        const k = THREE.MathUtils.smoothstep(cinema.p, 2.3, 3)
        const gap = THREE.MathUtils.lerp(6, 0.34, k)
        const bob = Math.sin(t * 1.1 + it.seed) * 0.01
        g.position.set(POND.x + 0.2 + it.pair * gap * 0.5 + fbm1(t * 0.05 + it.seed) * 0.3 * (1 - k), 0.05 + bob, POND.z + 3.2 + fbm1(t * 0.04 + it.seed) * 0.4 * (1 - k))
        g.rotation.set(0, t * 0.04 + it.seed, 0)
        return
      }
      const a = it.a + fbm1(t * 0.02 + it.seed) * 1.2 + t * 0.01
      const r = it.r + fbm1(t * 0.03 + it.seed + 40) * 0.12
      g.position.set(POND.x + Math.cos(a) * POND.rx * r, 0.05 + Math.sin(t * 1.3 + it.seed) * 0.01, POND.z + Math.sin(a) * POND.rz * r)
      g.rotation.set(Math.sin(t * 1.1 + it.seed) * 0.05, t * 0.05 + it.seed, Math.cos(t * 0.9 + it.seed) * 0.05)
    })
  })

  return (
    <group>
      {items.map((it, i) => (
        <group
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
        >
          {/* two rings of petals */}
          {Array.from({ length: 16 }, (_, k) => {
            const outer = k < 8
            const a = ((k % 8) / 8) * Math.PI * 2 + (outer ? 0 : Math.PI / 8)
            return (
              <group key={k} rotation-y={Math.PI / 2 - a}>
                <mesh geometry={petals} material={mats[it.color]} position={[0, 0.005, 0.03]} rotation-x={outer ? 1.0 : 0.55} scale={outer ? 1.2 : 0.9} />
              </group>
            )
          })}
          <mesh material={flame} position={[0, 0.07, 0]} scale={[0.6, 1.4, 0.6]}>
            <sphereGeometry args={[0.012, 8, 6]} />
          </mesh>
          <Billboard position={[0, 0.08, 0]}>
            <mesh material={halo} scale={0.45}>
              <planeGeometry />
            </mesh>
          </Billboard>
        </group>
      ))}
    </group>
  )
}
