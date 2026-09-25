import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { fbm1 } from '../lib/noise'
import { useSceneStore } from '../store/useSceneStore'
import { flameMaterial, haloMaterial } from './materials'

const wax = new THREE.MeshPhysicalMaterial({ color: '#b3161a', roughness: 0.45, sheen: 0.6, sheenColor: new THREE.Color('#ff8a6a') })
const brass = new THREE.MeshStandardMaterial({ color: '#b8893a', metalness: 0.9, roughness: 0.3 })
const holderProfile = [
  [0, 0],
  [0.045, 0],
  [0.05, 0.008],
  [0.02, 0.02],
  [0.012, 0.05],
  [0.016, 0.075],
  [0.03, 0.085],
  [0.032, 0.092],
  [0, 0.092],
].map(([x, y]) => new THREE.Vector2(x, y))
let holderGeo: THREE.LatheGeometry | null = null

/**
 * A red altar candle in a brass holder. The flame and its PointLight flicker
 * with layered noise — a slow breathing plus quick, small jitters.
 */
export function Candle({
  position = [0, 0, 0] as [number, number, number],
  height = 0.14,
  withLight = true,
  intensity = 0.6,
  seed = 1,
}) {
  holderGeo ??= new THREE.LatheGeometry(holderProfile, 20)
  const reducedMotion = useSceneStore((s) => s.reducedMotion)
  const flame = useRef<THREE.Group>(null!)
  const light = useRef<THREE.PointLight>(null!)
  const mats = useMemo(() => ({ flame: flameMaterial(), halo: haloMaterial('#ffb060', 0.35) }), [])
  const top = 0.092 + height

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const n = fbm1(t * 4.1 + seed * 13, 3)
    const f = reducedMotion ? 1 : 0.84 + 0.16 * n + 0.04 * Math.sin(t * 29 + seed)
    if (light.current) light.current.intensity = intensity * f
    flame.current.scale.set(1, 0.8 + f * 0.35, 1)
    if (!reducedMotion) flame.current.rotation.z = fbm1(t * 2.3 + seed * 7) * 0.12
    mats.halo.opacity = 0.28 + 0.1 * f
  })

  return (
    <group position={position}>
      <mesh geometry={holderGeo} material={brass} castShadow receiveShadow />
      <mesh position={[0, 0.092 + height / 2, 0]} material={wax} castShadow receiveShadow>
        <cylinderGeometry args={[0.013, 0.014, height, 16]} />
      </mesh>
      <group ref={flame} position={[0, top + 0.004, 0]}>
        <mesh position={[0, 0.012, 0]} scale={[0.6, 1.5, 0.6]} material={mats.flame}>
          <sphereGeometry args={[0.009, 10, 8]} />
        </mesh>
      </group>
      <Billboard position={[0, top + 0.02, 0]}>
        <mesh material={mats.halo} scale={0.16}>
          <planeGeometry />
        </mesh>
      </Billboard>
      {withLight && <pointLight ref={light} position={[0, top + 0.03, 0]} color="#ffa458" intensity={intensity} distance={4} decay={2} />}
    </group>
  )
}
