import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { fbm1 } from '../lib/noise'
import { useSceneStore } from '../store/useSceneStore'
import { starFaceGeometry, starFrameGeometry, starTips, tasselGeometry } from './starGeometry'
import {
  bambooMaterial,
  flameMaterial,
  haloMaterial,
  makeCellophane,
  PAPER_GLOW,
  skipPointShadowMaterial,
  tasselMaterial,
} from './materials'

const TASSEL_COLORS = ['#f2c230', '#e0508a', '#3fae5a', '#f2c230', '#3d7fd1']

export interface StarLanternProps {
  /** Hanging point (top of the string) in parent space. */
  position?: [number, number, number]
  /** Tip radius in metres. */
  radius?: number
  /** Length of the string between hanging point and top tip. */
  stringLength?: number
  paperColor?: THREE.ColorRepresentation
  glowColor?: THREE.ColorRepresentation
  lightColor?: THREE.ColorRepresentation
  /** Candle intensity in candela (physically based lights). */
  intensity?: number
  /** Whether the candle PointLight casts (soft) shadows. Keep to a few lanterns. */
  castLightShadow?: boolean
  /** Enables the per-lantern PointLight at all (distant lanterns can rely on emissive + halo). */
  withLight?: boolean
  seed?: number
}

export function StarLantern({
  position = [0, 0, 0],
  radius = 0.32,
  stringLength = 0.25,
  paperColor = '#d81f26',
  glowColor = '#ff5a1f',
  lightColor = '#ff8a4c',
  intensity = 3,
  castLightShadow = true,
  withLight = true,
  seed = 1,
}: StarLanternProps) {
  const reducedMotion = useSceneStore((s) => s.reducedMotion)
  const depth = radius * 0.55

  const geo = useMemo(() => {
    const tips = starTips(radius)
    return {
      front: starFaceGeometry(radius, depth, 1),
      back: starFaceGeometry(radius, depth, -1),
      frame: starFrameGeometry(radius, depth, radius * 0.022),
      // fringes on the four lower tips; the top tip carries the string
      tassels: tips.slice(1).map((t, i) => tasselGeometry(t, radius * 0.75, 7, seed * 13 + i)),
    }
  }, [radius, depth, seed])

  const mats = useMemo(
    () => ({
      paper: makeCellophane(paperColor, glowColor),
      tassels: TASSEL_COLORS.map((c) => tasselMaterial(c)),
      flame: flameMaterial(),
      halo: haloMaterial(glowColor, 0.28),
      candle: new THREE.MeshStandardMaterial({ color: '#f3e6c8', roughness: 0.5, emissive: '#ffb070', emissiveIntensity: 0.4 }),
      string: new THREE.MeshStandardMaterial({ color: '#3a2a1c', roughness: 1 }),
    }),
    [paperColor, glowColor],
  )

  const pivot = useRef<THREE.Group>(null!)
  const spin = useRef<THREE.Group>(null!)
  const flame = useRef<THREE.Mesh>(null!)
  const light = useRef<THREE.PointLight>(null!)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    // Candle flicker: layered noise, never fully steady, never strobing.
    const f = 0.82 + 0.18 * fbm1(t * 5.3 + seed * 7.1, 3) + 0.05 * Math.sin(t * 23 + seed)
    const k = reducedMotion ? 0.95 + (f - 0.82) * 0.25 : f
    if (light.current) light.current.intensity = intensity * k
    mats.paper.emissiveIntensity = PAPER_GLOW * (0.85 + (k - 0.82) * 0.8)
    flame.current.scale.set(1, 0.85 + (k - 0.8) * 1.4, 1)

    if (reducedMotion) return
    // Wind: the lantern hangs from a string, so it pendulums around the hanging point
    // and slowly twists — gusts come from low-frequency noise.
    const gust = 0.6 + 0.4 * fbm1(t * 0.13 + seed)
    pivot.current.rotation.z = fbm1(t * 0.42 + seed * 3.3) * 0.09 * gust
    pivot.current.rotation.x = fbm1(t * 0.37 + seed * 5.1 + 40) * 0.05 * gust
    spin.current.rotation.y = Math.sin(t * 0.21 + seed) * 0.45 + fbm1(t * 0.3 + seed * 9) * 0.25
  })

  return (
    <group position={position}>
      <group ref={pivot}>
        {/* hanging string */}
        <mesh position={[0, -stringLength / 2, 0]} material={mats.string} castShadow>
          <cylinderGeometry args={[0.0025, 0.0025, stringLength, 5]} />
        </mesh>
        <group position={[0, -stringLength - radius, 0]}>
          <group ref={spin}>
            <mesh geometry={geo.front} material={mats.paper} castShadow customDistanceMaterial={skipPointShadowMaterial} />
            <mesh geometry={geo.back} material={mats.paper} castShadow customDistanceMaterial={skipPointShadowMaterial} />
            <mesh geometry={geo.frame} material={bambooMaterial()} castShadow receiveShadow />
            {geo.tassels.map((g, i) => (
              <mesh key={i} geometry={g} material={mats.tassels[i % mats.tassels.length]} castShadow />
            ))}
            {/* centre spacer (apex to apex) — no shadow, it sits right under the flame */}
            <mesh material={bambooMaterial()} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[radius * 0.02, radius * 0.02, depth * 1.95, 6]} />
            </mesh>
            {/* candle on the centre spacer */}
            <mesh position={[0, -radius * 0.08, 0]} material={mats.candle}>
              <cylinderGeometry args={[radius * 0.045, radius * 0.05, radius * 0.16, 12]} />
            </mesh>
            <mesh ref={flame} position={[0, radius * 0.03, 0]} material={mats.flame}>
              <sphereGeometry args={[radius * 0.035, 12, 8]} />
            </mesh>
          </group>
          <Billboard>
            <mesh material={mats.halo} renderOrder={10}>
              <planeGeometry args={[radius * 5, radius * 5]} />
            </mesh>
          </Billboard>
          {withLight && (
            <pointLight
              ref={light}
              position={[0, radius * 0.05, 0]}
              color={lightColor}
              intensity={intensity}
              decay={2}
              castShadow={castLightShadow}
              shadow-mapSize={[1024, 1024]}
              shadow-radius={6}
              shadow-bias={-0.002}
              shadow-normalBias={0.02}
              shadow-camera-near={0.03}
              shadow-camera-far={14}
            />
          )}
        </group>
      </group>
    </group>
  )
}
