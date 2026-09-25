import { useMemo } from 'react'
import * as THREE from 'three'
import { limeWall } from '../lib/textures'
import { curvedRoofGeometry, gableGeometry, ridgeCurve } from './roofGeometry'
import { lacquerWood, roofTileNormal, roofTiles } from './worldTextures'

export interface HouseProps {
  position?: [number, number, number]
  rotation?: number
  width?: number
  depth?: number
  /** Warm light spilling from the open door (0 = dark house). */
  doorGlow?: number
  /** Add a real PointLight at the door (keep to a few houses: lights cost on every material). */
  withLight?: boolean
}

let shared: Record<string, THREE.Material> | null = null
function materials() {
  if (!shared) {
    shared = {
      wall: new THREE.MeshStandardMaterial({ map: limeWall(), roughness: 0.95, color: '#cfc2a8', side: THREE.DoubleSide }),
      tiles: new THREE.MeshStandardMaterial({ map: roofTiles(), normalMap: roofTileNormal(), roughness: 0.85, color: '#b89888' }),
      under: new THREE.MeshStandardMaterial({ color: '#2a160e', roughness: 1, side: THREE.BackSide }),
      ridge: new THREE.MeshStandardMaterial({ color: '#5a3020', roughness: 0.85 }),
      wood: new THREE.MeshStandardMaterial({ map: lacquerWood(), roughness: 0.7 }),
      door: new THREE.MeshStandardMaterial({ color: '#2a1206', emissive: '#ff8a3a', emissiveIntensity: 0.7 }),
      doorDark: new THREE.MeshStandardMaterial({ color: '#140a06', roughness: 1 }),
    }
  }
  return shared
}

/** A three-bay village house (nhà ba gian): lime walls, wooden door leaves, curved tile roof. */
export function House({ position = [0, 0, 0], rotation = 0, width = 7, depth = 4.2, doorGlow = 1, withLight = false }: HouseProps) {
  const eave = 2.3
  const ridge = 4.3
  const geo = useMemo(() => {
    const roof = curvedRoofGeometry({ width, depth, ridgeY: ridge, eaveY: eave, overhang: 0.7, curl: 0.25, sag: 0.18 }, 32, 10)
    return {
      roof: roof.geometry,
      eaves: roof.eaves,
      ridge: ridgeCurve(width / 2 + 0.4, ridge + 0.08, 0.35),
      gable: gableGeometry(depth / 2, eave, ridge),
    }
  }, [width, depth])
  const m = materials()

  return (
    <group position={position} rotation-y={rotation}>
      <mesh position={[0, eave / 2, 0]} material={m.wall} castShadow receiveShadow>
        <boxGeometry args={[width, eave, depth]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={geo.gable} position={[(s * width) / 2, 0, 0]} material={m.wall} castShadow receiveShadow />
      ))}
      {/* three bays of doors on the front; the middle one open and lit */}
      {[-1, 0, 1].map((b) => (
        <mesh
          key={b}
          position={[b * (width / 3), 0.95, depth / 2 + 0.01]}
          material={b === 0 && doorGlow > 0 ? m.door : m.doorDark}
        >
          <planeGeometry args={[1.3, 1.8]} />
        </mesh>
      ))}
      {withLight && doorGlow > 0 && (
        <pointLight position={[0, 1.2, depth / 2 + 0.6]} color="#ffa25a" intensity={2.5 * doorGlow} distance={6} decay={2} />
      )}
      <mesh geometry={geo.roof} material={m.tiles} castShadow receiveShadow />
      <mesh geometry={geo.roof} material={m.under} position={[0, -0.1, 0]} />
      {geo.eaves.map((c, i) => (
        <mesh key={i} material={m.ridge}>
          <tubeGeometry args={[c, 32, 0.06, 5, false]} />
        </mesh>
      ))}
      <mesh material={m.ridge} castShadow>
        <tubeGeometry args={[geo.ridge, 48, 0.11, 6, false]} />
      </mesh>
    </group>
  )
}
