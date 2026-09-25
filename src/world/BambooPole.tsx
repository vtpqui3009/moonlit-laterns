import { useMemo } from 'react'
import * as THREE from 'three'
import { bambooMaterial } from '../lanterns/materials'

/**
 * A curved bamboo pole (cần tre) planted in a glazed clay pot (chum sành),
 * bending over so a lantern can hang from its tip.
 * `tip` is where the pole ends, relative to the pot position.
 */
export function BambooPole({
  position = [0, 0, 0] as [number, number, number],
  tip = [-0.9, 2.05, 0.2] as [number, number, number],
}) {
  const { pole, nodes, pot } = useMemo(() => {
    const [tx, ty, tz] = tip
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.1, 0),
      new THREE.Vector3(0.02, ty * 0.55, 0),
      new THREE.Vector3(tx * 0.35, ty * 0.97, tz * 0.4),
      new THREE.Vector3(tx, ty, tz),
    ])
    const nodePts = Array.from({ length: 7 }, (_, i) => {
      const t = (i + 1) / 8
      return { p: curve.getPointAt(t), tan: curve.getTangentAt(t) }
    })
    const profile = [
      [0.0, 0],
      [0.13, 0],
      [0.17, 0.05],
      [0.2, 0.16],
      [0.19, 0.26],
      [0.14, 0.34],
      [0.12, 0.37],
      [0.13, 0.39],
      [0.11, 0.39],
      [0.1, 0.36],
    ].map(([r, y]) => new THREE.Vector2(r, y))
    return { pole: new THREE.TubeGeometry(curve, 64, 0.02, 10, false), nodes: nodePts, pot: new THREE.LatheGeometry(profile, 40) }
  }, [tip])

  const potMat = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: '#4a2e1f', roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.3 }),
    [],
  )
  const soilMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2a1d14', roughness: 1 }), [])

  return (
    <group position={position}>
      <mesh geometry={pole} material={bambooMaterial()} castShadow receiveShadow />
      {nodes.map(({ p, tan }, i) => (
        <mesh
          key={i}
          position={p}
          quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan)}
          material={bambooMaterial()}
          castShadow
        >
          <cylinderGeometry args={[0.024, 0.024, 0.012, 10]} />
        </mesh>
      ))}
      <mesh geometry={pot} material={potMat} castShadow receiveShadow />
      <mesh position={[0, 0.355, 0]} rotation-x={-Math.PI / 2} material={soilMat} receiveShadow>
        <circleGeometry args={[0.1, 20]} />
      </mesh>
    </group>
  )
}
