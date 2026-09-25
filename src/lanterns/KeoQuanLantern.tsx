import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSceneStore } from '../store/useSceneStore'
import { flicker } from './candleLight'
import { keoQuanPaper, keoQuanSilhouettes } from './lanternTextures'
import { bambooMaterial, flameMaterial } from './materials'

const SIDES = 6
const R = 0.22
const H = 0.42

/**
 * Đèn kéo quân — the "marching soldiers" lantern. Hot air from the candle turns
 * a paper impeller on top, which spins an inner drum of cut-out figures; their
 * silhouettes parade around the glowing hexagonal paper walls.
 */
export function KeoQuanLantern({ intensity = 1.6, seed = 4 }: { intensity?: number; seed?: number }) {
  const reducedMotion = useSceneStore((s) => s.reducedMotion)
  const drum = useRef<THREE.Group>(null!)
  const light = useRef<THREE.PointLight>(null!)

  const parts = useMemo(() => {
    const panelW = 2 * R * Math.sin(Math.PI / SIDES)
    const apothem = R * Math.cos(Math.PI / SIDES)
    const panels = Array.from({ length: SIDES }, (_, i) => {
      const a = (i / SIDES) * Math.PI * 2 + Math.PI / SIDES
      return { pos: [Math.cos(a) * apothem, 0, Math.sin(a) * apothem] as [number, number, number], rotY: -a + Math.PI / 2 }
    })
    const posts = Array.from({ length: SIDES }, (_, i) => {
      const a = (i / SIDES) * Math.PI * 2
      return [Math.cos(a) * R, 0, Math.sin(a) * R] as [number, number, number]
    })
    const ring = (y: number) => {
      const pts = Array.from({ length: SIDES + 1 }, (_, i) => {
        const a = (i / SIDES) * Math.PI * 2
        return new THREE.Vector3(Math.cos(a) * R, y, Math.sin(a) * R)
      })
      return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0), 36, 0.006, 4, false)
    }
    const blades = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2)
    return { panelW, panels, posts, rings: [ring(H / 2), ring(-H / 2)], blades }
  }, [])

  const mats = useMemo(() => {
    const silhouettes = keoQuanSilhouettes()
    silhouettes.repeat.set(1, 1)
    return {
      paper: new THREE.MeshStandardMaterial({
        map: keoQuanPaper(),
        emissive: '#ffb060',
        emissiveMap: keoQuanPaper(),
        emissiveIntensity: 0.55,
        transparent: true,
        opacity: 0.78,
        side: THREE.DoubleSide,
        roughness: 0.8,
        depthWrite: false,
      }),
      drum: new THREE.MeshBasicMaterial({ map: silhouettes, alphaTest: 0.5, side: THREE.DoubleSide, color: '#000000' }),
      blade: new THREE.MeshStandardMaterial({ color: '#f0e0c0', side: THREE.DoubleSide, roughness: 0.9 }),
      cap: new THREE.MeshStandardMaterial({ color: '#a01810', roughness: 0.6 }),
      flame: flameMaterial(),
    }
  }, [])

  useFrame(({ clock }, dt) => {
    const k = flicker(clock.elapsedTime, seed, reducedMotion)
    light.current.intensity = intensity * k
    mats.paper.emissiveIntensity = 0.55 * (0.85 + (k - 0.82) * 0.8)
    if (!reducedMotion) drum.current.rotation.y += dt * 0.55
  })

  return (
    <group>
      {parts.panels.map((p, i) => (
        <mesh key={i} position={p.pos} rotation-y={p.rotY} material={mats.paper} renderOrder={2}>
          <planeGeometry args={[parts.panelW, H]} />
        </mesh>
      ))}
      {parts.posts.map((p, i) => (
        <mesh key={i} position={p} material={bambooMaterial()} castShadow>
          <cylinderGeometry args={[0.006, 0.006, H + 0.02, 4]} />
        </mesh>
      ))}
      {parts.rings.map((g, i) => (
        <mesh key={i} geometry={g} material={bambooMaterial()} castShadow />
      ))}
      {/* red roof cap and bottom */}
      <mesh position={[0, H / 2 + 0.03, 0]} material={mats.cap} castShadow>
        <coneGeometry args={[R * 1.12, 0.07, SIDES, 1, true]} />
      </mesh>
      <mesh position={[0, -H / 2, 0]} rotation-x={-Math.PI / 2} material={mats.cap}>
        <circleGeometry args={[R, SIDES]} />
      </mesh>
      {/* spinning drum of paper figures + impeller */}
      <group ref={drum}>
        <mesh material={mats.drum}>
          <cylinderGeometry args={[R * 0.72, R * 0.72, H * 0.85, 32, 1, true]} />
        </mesh>
        <group position={[0, H * 0.42, 0]}>
          {parts.blades.map((a, i) => (
            <mesh key={i} material={mats.blade} rotation={[0.5, a, 0]} position={[Math.cos(a) * 0.06, 0, -Math.sin(a) * 0.06]}>
              <planeGeometry args={[0.1, 0.03]} />
            </mesh>
          ))}
        </group>
      </group>
      <mesh material={mats.flame} position={[0, -H * 0.3, 0]} scale={[0.6, 1.5, 0.6]}>
        <sphereGeometry args={[0.012, 10, 8]} />
      </mesh>
      <pointLight ref={light} position={[0, -H * 0.25, 0]} color="#ffb060" intensity={intensity} decay={2} distance={6} />
    </group>
  )
}

export const KEO_QUAN_HEIGHT = H
