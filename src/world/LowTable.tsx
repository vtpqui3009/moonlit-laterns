import { useMemo } from 'react'
import * as THREE from 'three'
import { tableCloth, woodGrain } from '../lib/textures'

const TOP_W = 1.3
const TOP_D = 0.85
const TOP_H = 0.42

/**
 * Low wooden table (chõng/phản thấp) with a draped red cloth.
 * The cloth is a subdivided plane: anything beyond the table edge is folded
 * down and rippled so it hangs like fabric instead of a flat box.
 */
function drapedCloth(w: number, d: number, overhang: number) {
  const W = w + overhang * 2
  const D = d + overhang * 2
  const g = new THREE.PlaneGeometry(W, D, 90, 60)
  g.rotateX(-Math.PI / 2)
  const p = g.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i)
    const z = p.getZ(i)
    const ox = Math.max(0, Math.abs(x) - w / 2)
    const oz = Math.max(0, Math.abs(z) - d / 2)
    const o = Math.max(ox, oz)
    if (o <= 0) continue
    // gently rounded edge, then a vertical drop
    const bend = Math.min(o, 0.02)
    const drop = o - bend
    const folds = Math.sin((ox > oz ? z : x) * 38) * 0.012 * (drop / overhang)
    const nx = ox > 0 ? Math.sign(x) * (w / 2 + bend + drop * 0.12 + (ox >= oz ? folds : 0)) : x
    const nz = oz > 0 ? Math.sign(z) * (d / 2 + bend + drop * 0.12 + (oz > ox ? folds : 0)) : z
    p.setXYZ(i, nx, -bend * 0.5 - drop, nz)
  }
  g.computeVertexNormals()
  return g
}

export function LowTable({ position = [0, 0, 0] as [number, number, number] }) {
  const { cloth, mats } = useMemo(() => {
    const wood = woodGrain()
    return {
      cloth: drapedCloth(TOP_W, TOP_D, 0.2),
      mats: {
        wood: new THREE.MeshPhysicalMaterial({ map: wood, roughness: 0.45, clearcoat: 0.5, clearcoatRoughness: 0.35 }),
        cloth: new THREE.MeshPhysicalMaterial({
          map: tableCloth(),
          roughness: 0.9,
          sheen: 1,
          sheenRoughness: 0.5,
          sheenColor: new THREE.Color('#ff7a6a'),
          side: THREE.DoubleSide,
        }),
      },
    }
  }, [])

  const legs: [number, number][] = [
    [-TOP_W / 2 + 0.08, -TOP_D / 2 + 0.08],
    [TOP_W / 2 - 0.08, -TOP_D / 2 + 0.08],
    [-TOP_W / 2 + 0.08, TOP_D / 2 - 0.08],
    [TOP_W / 2 - 0.08, TOP_D / 2 - 0.08],
  ]

  return (
    <group position={position}>
      <mesh position={[0, TOP_H - 0.025, 0]} material={mats.wood} castShadow receiveShadow>
        <boxGeometry args={[TOP_W, 0.05, TOP_D]} />
      </mesh>
      {legs.map(([x, z], i) => (
        <mesh key={i} position={[x, (TOP_H - 0.05) / 2, z]} material={mats.wood} castShadow receiveShadow>
          <boxGeometry args={[0.07, TOP_H - 0.05, 0.07]} />
        </mesh>
      ))}
      <mesh geometry={cloth} position={[0, TOP_H + 0.004, 0]} material={mats.cloth} castShadow receiveShadow />
    </group>
  )
}

export const TABLE_TOP_HEIGHT = TOP_H
