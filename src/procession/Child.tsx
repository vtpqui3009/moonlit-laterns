import { forwardRef, useImperativeHandle, useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { bambooMaterial } from '../lanterns/materials'

export interface ChildHandle {
  root: THREE.Group
  /** Advance the walk cycle: phase in radians, 0..1 stride amount. */
  pose: (phase: number, stride: number) => void
}

const SKIN = new THREE.MeshStandardMaterial({ color: '#d7a07a', roughness: 0.7 })
const HAIR = new THREE.MeshStandardMaterial({ color: '#141010', roughness: 0.6 })
const SHOE = new THREE.MeshStandardMaterial({ color: '#2a1a12', roughness: 0.8 })
const clothCache = new Map<string, THREE.MeshStandardMaterial>()
const cloth = (c: string) => {
  let m = clothCache.get(c)
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.85 })
    clothCache.set(c, m)
  }
  return m
}

/**
 * A small stylised child (about 1.1 m) carrying a lantern on a bamboo stick.
 * Proportions are childlike (big head, short legs); the walk cycle is driven
 * from outside through `pose()` so the procession controls pacing.
 */
export const Child = forwardRef<
  ChildHandle,
  { shirt: string; pants: string; height?: number; hairStyle?: 0 | 1; children?: ReactNode }
>(function Child({ shirt, pants, height = 1.1, hairStyle = 0, children }, ref) {
  const root = useRef<THREE.Group>(null!)
  const body = useRef<THREE.Group>(null!)
  const legL = useRef<THREE.Group>(null!)
  const legR = useRef<THREE.Group>(null!)
  const armFree = useRef<THREE.Group>(null!)
  const armStick = useRef<THREE.Group>(null!)
  const s = height / 1.1

  const geo = useMemo(
    () => ({
      leg: new THREE.CapsuleGeometry(0.05, 0.3, 4, 8),
      torso: new THREE.CapsuleGeometry(0.13, 0.22, 4, 10),
      arm: new THREE.CapsuleGeometry(0.035, 0.26, 4, 8),
      head: new THREE.SphereGeometry(0.12, 20, 16),
      hair: new THREE.SphereGeometry(0.127, 20, 12, 0, Math.PI * 2, 0, hairStyle === 0 ? Math.PI * 0.55 : Math.PI * 0.62),
      shoe: new THREE.BoxGeometry(0.08, 0.05, 0.13),
      stick: new THREE.CylinderGeometry(0.009, 0.011, 1.05, 6),
    }),
    [hairStyle],
  )

  useImperativeHandle(ref, () => ({
    get root() {
      return root.current
    },
    pose(phase, stride) {
      const swing = Math.sin(phase) * 0.55 * stride
      legL.current.rotation.x = swing
      legR.current.rotation.x = -swing
      armFree.current.rotation.x = -swing * 0.8
      armStick.current.rotation.x = -1.05 + Math.sin(phase * 2) * 0.03 * stride
      body.current.position.y = Math.abs(Math.cos(phase)) * 0.025 * stride
      body.current.rotation.z = Math.sin(phase) * 0.03 * stride
    },
  }))

  return (
    <group ref={root} scale={s}>
      <group ref={body}>
        {/* legs (pivot at hips) */}
        {[
          [legL, -0.06],
          [legR, 0.06],
        ].map(([r, x], i) => (
          <group key={i} ref={r as React.RefObject<THREE.Group>} position={[x as number, 0.42, 0]}>
            <mesh geometry={geo.leg} material={cloth(pants)} position={[0, -0.19, 0]} castShadow />
            <mesh geometry={geo.shoe} material={SHOE} position={[0, -0.4, 0.02]} castShadow />
          </group>
        ))}
        <mesh geometry={geo.torso} material={cloth(shirt)} position={[0, 0.62, 0]} castShadow />
        <mesh geometry={geo.head} material={SKIN} position={[0, 0.93, 0]} castShadow />
        <mesh geometry={geo.hair} material={HAIR} position={[0, 0.94, -0.008]} rotation-x={-0.25} castShadow />
        {/* free arm swings */}
        <group ref={armFree} position={[-0.17, 0.76, 0]}>
          <mesh geometry={geo.arm} material={cloth(shirt)} position={[0, -0.15, 0]} castShadow />
        </group>
        {/* stick arm raised forward; lantern hangs from the stick tip */}
        <group ref={armStick} position={[0.17, 0.76, 0]} rotation-x={-1.05}>
          <mesh geometry={geo.arm} material={cloth(shirt)} position={[0, -0.15, 0]} castShadow />
          {/* hand: the stick leans forward-up at ~33° from vertical in world space */}
          <group position={[0, -0.31, 0.02]} rotation-x={1.6}>
            <mesh geometry={geo.stick} material={bambooMaterial()} position={[0, 0.45, 0]} castShadow />
            {/* hanging point at the stick tip, rotated back to world-level so the lantern hangs straight down */}
            <group position={[0, 0.96, 0]} rotation-x={-0.55}>
              {children}
            </group>
          </group>
        </group>
      </group>
    </group>
  )
})
