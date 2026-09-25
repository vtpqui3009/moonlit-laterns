import { useMemo } from 'react'
import * as THREE from 'three'
import { courtyardTiles } from '../lib/textures'
import { fieldGround } from './worldTextures'

export const COURTYARD = { x: 0, z: 3.2, w: 19, d: 17 }

/** Village ground: trampled earth everywhere, and the tiled courtyard (sân đình) in front of the đình. */
export function Terrain() {
  const mats = useMemo(() => {
    const t = courtyardTiles(1)
    for (const tex of [t.map, t.roughnessMap, t.bumpMap]) tex.repeat.set(COURTYARD.w / 1.2, COURTYARD.d / 1.2)
    return {
      field: new THREE.MeshStandardMaterial({ map: fieldGround(60), roughness: 1, color: '#9a9080' }),
      tiles: new THREE.MeshStandardMaterial({
        map: t.map,
        roughnessMap: t.roughnessMap,
        bumpMap: t.bumpMap,
        bumpScale: 1.5,
        roughness: 1,
        color: '#d8c4b8',
      }),
      curb: new THREE.MeshStandardMaterial({ color: '#4a4640', roughness: 0.95 }),
    }
  }, [])

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} material={mats.field} receiveShadow>
        <planeGeometry args={[240, 240]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[COURTYARD.x, 0.012, COURTYARD.z]} material={mats.tiles} receiveShadow>
        <planeGeometry args={[COURTYARD.w, COURTYARD.d]} />
      </mesh>
      {/* stone curb around the courtyard */}
      {[
        [COURTYARD.x, COURTYARD.z + COURTYARD.d / 2, COURTYARD.w + 0.3, 0.3],
        [COURTYARD.x - COURTYARD.w / 2, COURTYARD.z, 0.3, COURTYARD.d],
        [COURTYARD.x + COURTYARD.w / 2, COURTYARD.z, 0.3, COURTYARD.d],
      ].map(([x, z, w, d], i) => (
        <mesh key={i} position={[x, 0.06, z]} material={mats.curb} receiveShadow castShadow>
          <boxGeometry args={[w, 0.12, d]} />
        </mesh>
      ))}
    </group>
  )
}
