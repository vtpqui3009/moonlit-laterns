import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { noise1 } from '../lib/noise'
import { useSceneStore } from '../store/useSceneStore'
import { RoundLantern } from './RoundLantern'

const COLORS = ['#e0231c', '#f0a020', '#e0231c', '#d8409a', '#e0231c', '#3aa0d0']

/**
 * A sagging string of silk lanterns (dây đèn lồng) strung across the courtyard.
 * Each lantern swings a little on its own hook.
 */
export function LanternGarland({
  from,
  to,
  sag = 0.8,
  spacing = 1.3,
  lights = 2,
  seed = 1,
}: {
  from: [number, number, number]
  to: [number, number, number]
  sag?: number
  spacing?: number
  /** How many lanterns along the string get a real PointLight. */
  lights?: number
  seed?: number
}) {
  const reducedMotion = useSceneStore((s) => s.reducedMotion)
  const { curve, points } = useMemo(() => {
    const a = new THREE.Vector3(...from)
    const b = new THREE.Vector3(...to)
    const mid = a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, -sag, 0))
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b)
    const n = Math.max(2, Math.floor(curve.getLength() / spacing))
    const points = Array.from({ length: n - 1 }, (_, i) => curve.getPointAt((i + 1) / n))
    return { curve, points }
  }, [from, to, sag, spacing])
  const lightEvery = lights > 0 ? Math.max(1, Math.floor(points.length / lights)) : Infinity

  const swings = useRef<(THREE.Group | null)[]>([])
  useFrame(({ clock }) => {
    if (reducedMotion) return
    const t = clock.elapsedTime
    swings.current.forEach((g, i) => {
      if (!g) return
      g.rotation.z = noise1(t * 0.5 + i * 3.1 + seed * 10) * 0.12
      g.rotation.x = noise1(t * 0.43 + i * 1.7 + seed * 20) * 0.08
    })
  })

  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 48, 0.008, 4, false]} />
        <meshStandardMaterial color="#1a120c" roughness={1} />
      </mesh>
      {points.map((p, i) => (
        <group key={i} position={p}>
          <group
            ref={(el) => {
              swings.current[i] = el
            }}
          >
            <mesh position={[0, -0.12, 0]}>
              <cylinderGeometry args={[0.004, 0.004, 0.24, 3]} />
              <meshStandardMaterial color="#1a120c" />
            </mesh>
            <group position={[0, -0.45, 0]}>
              <RoundLantern
                size={0.4 + ((i * 7 + seed) % 3) * 0.05}
                color={COLORS[(i + seed) % COLORS.length]}
                withLight={i % lightEvery === Math.floor(lightEvery / 2) && Math.floor(i / lightEvery) < lights}
              />
            </group>
          </group>
        </group>
      ))}
    </group>
  )
}
