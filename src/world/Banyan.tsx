import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mulberry32 } from '../lib/noise'
import { mergeGeometries } from '../lanterns/starGeometry'
import { useSceneStore } from '../store/useSceneStore'
import { leafCard } from './worldTextures'

/**
 * Cây đa đầu làng — the old banyan at the corner of the courtyard:
 * a buttressed trunk of fused stems, heavy limbs, curtains of aerial roots
 * and a canopy of instanced leaf cards that sway together in the wind.
 */
export function Banyan({ position = [0, 0, 0] as [number, number, number], seed = 5 }) {
  const quality = useSceneStore((s) => s.quality)
  const leafCount = quality === 'high' ? 2600 : 1100

  const { wood, roots, clumps } = useMemo(() => {
    const rnd = mulberry32(seed)
    const stems: THREE.BufferGeometry[] = []
    const rootGeos: THREE.BufferGeometry[] = []
    const clumps: { c: THREE.Vector3; r: THREE.Vector3 }[] = []
    // fused trunk: several stems twisting together, flaring into root buttresses
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + rnd() * 0.4
      const pts = [
        new THREE.Vector3(Math.cos(a) * 1.5, 0, Math.sin(a) * 1.5),
        new THREE.Vector3(Math.cos(a + 0.4) * 0.55, 1.2, Math.sin(a + 0.4) * 0.55),
        new THREE.Vector3(Math.cos(a + 0.9) * 0.45, 3.2, Math.sin(a + 0.9) * 0.45),
        new THREE.Vector3(Math.cos(a + 1.2) * 0.6, 4.6, Math.sin(a + 1.2) * 0.6),
      ]
      stems.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.34 + rnd() * 0.1, 8, false))
    }
    // limbs
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + rnd() * 0.5
      const reach = 4 + rnd() * 3.5
      const up = 6.5 + rnd() * 3
      const start = new THREE.Vector3(Math.cos(a) * 0.4, 4.2 + rnd() * 0.8, Math.sin(a) * 0.4)
      const mid = new THREE.Vector3(Math.cos(a) * reach * 0.5, up - 1 + rnd(), Math.sin(a) * reach * 0.5)
      const end = new THREE.Vector3(Math.cos(a + 0.2) * reach, up + rnd() * 1.5, Math.sin(a + 0.2) * reach)
      const limb = new THREE.CatmullRomCurve3([start, mid, end])
      stems.push(new THREE.TubeGeometry(limb, 20, 0.28 - i * 0.012, 7, false))
      clumps.push({ c: end.clone().add(new THREE.Vector3(0, 0.8, 0)), r: new THREE.Vector3(3 + rnd() * 1.5, 1.8 + rnd(), 3 + rnd() * 1.5) })
      // aerial roots hanging from the limb
      for (let k = 0; k < 5; k++) {
        const p = limb.getPoint(0.35 + rnd() * 0.6)
        const len = p.y - (rnd() > 0.7 ? 0 : 1 + rnd() * 3)
        const sway = new THREE.Vector3(rnd() - 0.5, 0, rnd() - 0.5).multiplyScalar(0.3)
        const root = new THREE.CatmullRomCurve3([p, p.clone().add(sway).setY(p.y - len * 0.5), p.clone().add(sway.multiplyScalar(1.6)).setY(p.y - len)])
        rootGeos.push(new THREE.TubeGeometry(root, 10, 0.025 + rnd() * 0.03, 4, false))
      }
    }
    clumps.push({ c: new THREE.Vector3(0, 9.5, 0), r: new THREE.Vector3(4, 2.2, 4) })
    return { wood: mergeGeometries(stems), roots: mergeGeometries(rootGeos), clumps }
  }, [seed])

  const leaves = useRef<THREE.InstancedMesh>(null!)
  const canopy = useRef<THREE.Group>(null!)
  const leafMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: leafCard(),
        alphaTest: 0.45,
        side: THREE.DoubleSide,
        roughness: 0.75,
        color: '#b8c8a0',
      }),
    [],
  )
  const barkMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4a4038', roughness: 0.95 }), [])

  useLayoutEffect(() => {
    const rnd = mulberry32(seed + 99)
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const e = new THREE.Euler()
    const s = new THREE.Vector3()
    const p = new THREE.Vector3()
    for (let i = 0; i < leafCount; i++) {
      const cl = clumps[i % clumps.length]
      // point in a squashed ellipsoid, denser at the shell
      const u = Math.pow(rnd(), 0.35)
      const th = rnd() * Math.PI * 2
      const ph = Math.acos(2 * rnd() - 1)
      p.set(Math.sin(ph) * Math.cos(th), Math.cos(ph) * 0.8, Math.sin(ph) * Math.sin(th)).multiply(cl.r).multiplyScalar(u).add(cl.c)
      e.set(rnd() * Math.PI, rnd() * Math.PI, rnd() * Math.PI)
      q.setFromEuler(e)
      const k = 0.9 + rnd() * 0.8
      s.set(k, k, k)
      m.compose(p, q, s)
      leaves.current.setMatrixAt(i, m)
    }
    leaves.current.instanceMatrix.needsUpdate = true
    leaves.current.computeBoundingSphere()
  }, [clumps, leafCount, seed])

  const reducedMotion = useSceneStore((s) => s.reducedMotion)
  useFrame(({ clock }) => {
    if (reducedMotion) return
    const t = clock.elapsedTime
    canopy.current.rotation.z = Math.sin(t * 0.35) * 0.006 + Math.sin(t * 0.9) * 0.002
    canopy.current.rotation.x = Math.sin(t * 0.27 + 1) * 0.005
  })

  return (
    <group position={position}>
      <mesh geometry={wood} material={barkMat} castShadow receiveShadow />
      <group ref={canopy}>
        <mesh geometry={roots} material={barkMat} castShadow />
        <instancedMesh ref={leaves} args={[undefined, undefined, leafCount]} material={leafMat} castShadow receiveShadow>
          <planeGeometry args={[1, 1]} />
        </instancedMesh>
      </group>
    </group>
  )
}
