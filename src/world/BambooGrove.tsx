import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mulberry32 } from '../lib/noise'
import { useSceneStore } from '../store/useSceneStore'
import { leafCard } from './worldTextures'

/**
 * Lũy tre làng — the bamboo hedge that rings every northern village.
 * Instanced culms arching outward with feathery leaf cards; mostly seen as a
 * dark lace silhouette against the sky, with the moon rising behind it.
 */
export function BambooGrove({
  center = [0, 0, 0] as [number, number, number],
  radius = 42,
  /** Angular gaps (radians, [from, to]) left open, e.g. for the view over the pond. */
  gaps = [] as [number, number][],
}) {
  const quality = useSceneStore((s) => s.quality)
  const clumps = quality === 'high' ? 90 : 50
  const perClump = 7
  const culmCount = clumps * perClump
  const leafCount = culmCount * (quality === 'high' ? 10 : 6)

  const culmGeo = useMemo(() => {
    // unit culm: 1 m tall, slight arch toward +x
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.03, 0.4, 0),
      new THREE.Vector3(0.12, 0.75, 0),
      new THREE.Vector3(0.3, 1, 0),
    ])
    return new THREE.TubeGeometry(curve, 12, 0.006, 5, false)
  }, [])
  const culmMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3d4a26', roughness: 0.8 }), [])
  const leafMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: leafCard(), alphaTest: 0.45, side: THREE.DoubleSide, color: '#9fb07a', roughness: 0.8 }),
    [],
  )
  const culms = useRef<THREE.InstancedMesh>(null!)
  const leaves = useRef<THREE.InstancedMesh>(null!)

  useLayoutEffect(() => {
    const rnd = mulberry32(131)
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const e = new THREE.Euler()
    const p = new THREE.Vector3()
    const s = new THREE.Vector3()
    let li = 0
    const inGap = (a: number) => gaps.some(([from, to]) => a > from && a < to)
    for (let c = 0; c < clumps; c++) {
      let a = (c / clumps) * Math.PI * 2 + rnd() * 0.05
      if (inGap(a)) a += Math.PI // move it to the opposite side instead
      const r = radius + (rnd() - 0.5) * 6
      const cx = center[0] + Math.cos(a) * r
      const cz = center[2] + Math.sin(a) * r
      for (let k = 0; k < perClump; k++) {
        const i = c * perClump + k
        const h = 9 + rnd() * 7
        const yaw = rnd() * Math.PI * 2
        e.set((rnd() - 0.5) * 0.15, yaw, (rnd() - 0.5) * 0.15)
        q.setFromEuler(e)
        p.set(cx + (rnd() - 0.5) * 1.6, 0, cz + (rnd() - 0.5) * 1.6)
        s.set(h, h, h)
        m.compose(p, q, s)
        culms.current.setMatrixAt(i, m)
        // leaf sprays along the upper half of the culm
        const dir = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw))
        const perLeaf = leafCount / culmCount
        for (let l = 0; l < perLeaf && li < leafCount; l++, li++) {
          const t = 0.45 + rnd() * 0.55
          const lp = p.clone().add(dir.clone().multiplyScalar(0.3 * t * t * t * h)).setY(h * t)
          lp.add(new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(1.4))
          e.set(rnd() * 3, rnd() * 3, rnd() * 3)
          q.setFromEuler(e)
          const k2 = 1 + rnd() * 1.2
          s.set(k2, k2 * 0.6, k2)
          m.compose(lp, q, s)
          leaves.current.setMatrixAt(li, m)
        }
      }
    }
    culms.current.instanceMatrix.needsUpdate = true
    leaves.current.instanceMatrix.needsUpdate = true
    culms.current.computeBoundingSphere()
    leaves.current.computeBoundingSphere()
  }, [center, clumps, culmCount, gaps, leafCount, radius])

  return (
    <group>
      <instancedMesh ref={culms} args={[culmGeo, culmMat, culmCount]} castShadow />
      <instancedMesh ref={leaves} args={[undefined, leafMat, leafCount]}>
        <planeGeometry args={[1, 1]} />
      </instancedMesh>
    </group>
  )
}
