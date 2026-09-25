import { useMemo } from 'react'
import * as THREE from 'three'
import { courtyardTiles } from '../lib/textures'

/** Courtyard of worn terracotta tiles (sân gạch). Receives every shadow in the scene. */
export function Ground({ size = 40 }: { size?: number }) {
  const material = useMemo(() => {
    const t = courtyardTiles(size / 1.2) // 4 tiles per texture → 30 cm tiles
    return new THREE.MeshStandardMaterial({
      map: t.map,
      roughnessMap: t.roughnessMap,
      bumpMap: t.bumpMap,
      bumpScale: 1.5,
      roughness: 1,
      color: '#d8c4b8',
    })
  }, [size])

  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow material={material}>
      <planeGeometry args={[size, size]} />
    </mesh>
  )
}
