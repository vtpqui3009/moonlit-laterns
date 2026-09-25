import { useMemo } from 'react'
import { Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { mergeGeometries } from './starGeometry'
import { haloMaterial } from './materials'

/** Silk lantern profile (đèn lồng tròn) for LatheGeometry, height ≈ 1 unit. */
function silkProfile() {
  const pts: THREE.Vector2[] = []
  for (let i = 0; i <= 16; i++) {
    const t = i / 16
    const y = t - 0.5
    const r = Math.sin(Math.PI * t) * 0.46 + 0.1
    pts.push(new THREE.Vector2(r, y))
  }
  return pts
}

const cache = new Map<string, { silk: THREE.Material; halo: THREE.Material }>()
const geos = {
  silk: null as THREE.BufferGeometry | null,
  ribs: null as THREE.BufferGeometry | null,
}
function getGeos() {
  if (!geos.silk) {
    geos.silk = new THREE.LatheGeometry(silkProfile(), 24)
    // bamboo ribs that pinch the silk into segments
    const ribs: THREE.BufferGeometry[] = []
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2
      const curve = new THREE.CatmullRomCurve3(
        silkProfile().map((p) => new THREE.Vector3(Math.cos(a) * (p.x + 0.005), p.y, Math.sin(a) * (p.x + 0.005))),
      )
      ribs.push(new THREE.TubeGeometry(curve, 16, 0.008, 3, false))
    }
    geos.ribs = mergeGeometries(ribs)
  }
  return geos as { silk: THREE.BufferGeometry; ribs: THREE.BufferGeometry }
}

function mats(color: string) {
  let m = cache.get(color)
  if (!m) {
    m = {
      silk: new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.75,
        roughness: 0.55,
        side: THREE.DoubleSide,
      }),
      halo: haloMaterial(color, 0.22),
    }
    cache.set(color, m)
  }
  return m
}

const gold = new THREE.MeshStandardMaterial({ color: '#c89a3a', metalness: 0.8, roughness: 0.35 })
const rib = new THREE.MeshStandardMaterial({ color: '#2a1206', roughness: 0.8 })
const tassel = new THREE.MeshStandardMaterial({ color: '#c01a1a', roughness: 0.9 })

/**
 * Round silk lantern for garlands. Glows by emissive + halo only; give it a
 * real light via `withLight` sparingly (every light costs on every surface).
 */
export function RoundLantern({
  size = 0.42,
  color = '#e0231c',
  withLight = false,
  lightIntensity = 1.2,
}: {
  size?: number
  color?: string
  withLight?: boolean
  lightIntensity?: number
}) {
  const g = getGeos()
  const m = useMemo(() => mats(color), [color])
  return (
    <group scale={size}>
      <mesh geometry={g.silk} material={m.silk} castShadow />
      <mesh geometry={g.ribs} material={rib} />
      <mesh position={[0, 0.52, 0]} material={gold}>
        <cylinderGeometry args={[0.14, 0.18, 0.08, 12]} />
      </mesh>
      <mesh position={[0, -0.52, 0]} material={gold}>
        <cylinderGeometry args={[0.18, 0.14, 0.08, 12]} />
      </mesh>
      <mesh position={[0, -0.78, 0]} material={tassel}>
        <coneGeometry args={[0.06, 0.45, 8, 1, true]} />
      </mesh>
      <Billboard>
        <mesh material={m.halo} scale={3.2}>
          <planeGeometry />
        </mesh>
      </Billboard>
      {withLight && <pointLight color={color === '#e0231c' ? '#ff7040' : color} intensity={lightIntensity} distance={7} decay={2} />}
    </group>
  )
}
