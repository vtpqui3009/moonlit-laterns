import { useMemo } from 'react'
import * as THREE from 'three'
import { limeWall } from '../lib/textures'

/** A stretch of old yellow lime-washed wall with a tiled coping — catches lantern glow and long sunset shadows. */
export function LimeWall({
  position = [0, 0, 0] as [number, number, number],
  width = 6,
  height = 2,
  thickness = 0.22,
}) {
  const mats = useMemo(() => {
    const map = limeWall()
    return {
      plaster: new THREE.MeshStandardMaterial({ map, roughness: 0.95, bumpMap: map, bumpScale: 1.2, color: '#d8d0c8' }),
      coping: new THREE.MeshStandardMaterial({ color: '#5a2c20', roughness: 0.8 }),
    }
  }, [])

  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]} material={mats.plaster} castShadow receiveShadow>
        <boxGeometry args={[width, height, thickness]} />
      </mesh>
      {/* tile coping on top */}
      <mesh position={[0, height + 0.05, 0]} material={mats.coping} castShadow receiveShadow>
        <boxGeometry args={[width + 0.1, 0.1, thickness + 0.14]} />
      </mesh>
      {Array.from({ length: Math.floor(width / 0.2) }, (_, i) => (
        <mesh
          key={i}
          position={[-width / 2 + 0.1 + i * 0.2, height + 0.12, 0]}
          rotation={[0, 0, Math.PI / 2]}
          material={mats.coping}
          castShadow
        >
          <cylinderGeometry args={[0.06, 0.06, 0.19, 8, 1, false, 0, Math.PI]} />
        </mesh>
      ))}
    </group>
  )
}
