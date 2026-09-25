import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { dryLeaf } from '../lanterns/lanternTextures'
import { fbm1, mulberry32 } from '../lib/noise'
import { useSceneStore } from '../store/useSceneStore'

interface Leaf {
  pos: THREE.Vector3
  vel: number
  spin: THREE.Vector3
  rot: THREE.Euler
  size: number
  rest: number // seconds left lying on the ground
  phase: number
}

/**
 * Dry banyan leaves drifting down across the sân đình: each falls slowly,
 * flutters (tumbling rotation), is pushed by a shared gusty wind, rests on
 * the tiles for a while, then is recycled back into the canopy.
 */
export function FallingLeaves({
  origin = [-9, 0, -1] as [number, number, number],
  spread = [9, 6] as [number, number],
  top = 9,
}) {
  const quality = useSceneStore((s) => s.quality)
  const reducedMotion = useSceneStore((s) => s.reducedMotion)
  const count = quality === 'high' ? 90 : 35
  const mesh = useRef<THREE.InstancedMesh>(null!)
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: dryLeaf(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.8 }),
    [],
  )
  const tint = useMemo(() => ['#e0a040', '#b87a30', '#d8c060', '#8a5a2a'].map((c) => new THREE.Color(c)), [])

  const leaves = useMemo<Leaf[]>(() => {
    const rnd = mulberry32(701)
    return Array.from({ length: count }, () => ({
      pos: new THREE.Vector3(origin[0] + (rnd() - 0.5) * spread[0], rnd() * top, origin[2] + (rnd() - 0.5) * spread[1]),
      vel: 0.35 + rnd() * 0.35,
      spin: new THREE.Vector3(rnd() * 3 - 1.5, rnd() * 2 - 1, rnd() * 3 - 1.5),
      rot: new THREE.Euler(rnd() * 6, rnd() * 6, rnd() * 6),
      size: 0.07 + rnd() * 0.06,
      rest: 0,
      phase: rnd() * 100,
    }))
  }, [count, origin, spread, top])

  const m = useMemo(() => new THREE.Matrix4(), [])
  const q = useMemo(() => new THREE.Quaternion(), [])
  const s = useMemo(() => new THREE.Vector3(), [])

  const write = () => {
    leaves.forEach((l, i) => {
      q.setFromEuler(l.rot)
      s.setScalar(l.size)
      m.compose(l.pos, q, s)
      mesh.current.setMatrixAt(i, m)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  }

  useLayoutEffect(() => {
    leaves.forEach((_, i) => mesh.current.setColorAt(i, tint[i % tint.length]))
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true
    write()
    mesh.current.computeBoundingSphere()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaves])

  useFrame(({ clock }, dt) => {
    if (reducedMotion) return
    const t = clock.elapsedTime
    const d = Math.min(dt, 0.05)
    const gust = 0.6 + 0.8 * Math.max(0, fbm1(t * 0.15))
    leaves.forEach((l) => {
      if (l.pos.y <= 0.02) {
        l.rest -= d
        if (l.rest <= 0) {
          l.pos.set(origin[0] + (Math.random() - 0.5) * spread[0], top - Math.random() * 2, origin[2] + (Math.random() - 0.5) * spread[1])
        }
        return
      }
      const flutter = Math.sin(t * 3 + l.phase)
      l.pos.y -= l.vel * d * (0.7 + 0.3 * Math.abs(flutter))
      l.pos.x += (gust * 0.8 + flutter * 0.3) * d
      l.pos.z += (fbm1(t * 0.3 + l.phase) * 0.6) * d
      l.rot.x += l.spin.x * d
      l.rot.y += l.spin.y * d
      l.rot.z += l.spin.z * d
      if (l.pos.y <= 0.02) {
        l.pos.y = 0.02
        l.rot.set(-Math.PI / 2 + (Math.random() - 0.5) * 0.3, 0, Math.random() * 6)
        l.rest = 4 + Math.random() * 8
      }
    })
    write()
  })

  return <instancedMesh ref={mesh} args={[undefined, mat, count]} castShadow frustumCulled={false}>
    <planeGeometry args={[1, 1]} />
  </instancedMesh>
}
