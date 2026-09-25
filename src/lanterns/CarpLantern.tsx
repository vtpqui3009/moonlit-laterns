import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { cinema } from '../cinema/director'
import { fbm1 } from '../lib/noise'
import { useSceneStore } from '../store/useSceneStore'
import { flicker, gateShadow } from './candleLight'
import { carpScales } from './lanternTextures'
import { bambooMaterial, flameMaterial, haloMaterial, skipPointShadowMaterial } from './materials'

const L = 0.62 // nose to tail root

/** Lathe profile of the fish body along +y (nose at y = 0). */
function bodyProfile() {
  return Array.from({ length: 24 }, (_, i) => {
    const t = i / 23
    const r = 0.15 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.72)), 0.85) + (t > 0.97 ? 0.028 : 0.0001)
    return new THREE.Vector2(Math.max(r, 0.0001), t * L)
  })
}

function finShape(kind: 'tail' | 'dorsal' | 'pectoral') {
  const s = new THREE.Shape()
  if (kind === 'tail') {
    s.moveTo(0, 0)
    s.bezierCurveTo(0.12, 0.06, 0.2, 0.2, 0.3, 0.24)
    s.quadraticCurveTo(0.22, 0.05, 0.26, 0)
    s.quadraticCurveTo(0.22, -0.05, 0.3, -0.24)
    s.bezierCurveTo(0.2, -0.2, 0.12, -0.06, 0, 0)
  } else if (kind === 'dorsal') {
    s.moveTo(0, 0)
    s.quadraticCurveTo(0.08, 0.14, 0.26, 0.1)
    s.quadraticCurveTo(0.3, 0.04, 0.34, 0)
    s.lineTo(0, 0)
  } else {
    s.moveTo(0, 0)
    s.quadraticCurveTo(0.05, -0.08, 0.14, -0.1)
    s.quadraticCurveTo(0.08, -0.02, 0, 0)
  }
  return new THREE.ShapeGeometry(s, 12)
}

/**
 * Đèn cá chép — carp lantern: a translucent orange body with painted scales,
 * bamboo hoops, a flowing forked tail and fins, big eyes and whiskers. It
 * hangs from the tip of a carrying stick; the tail swishes as if swimming.
 */
export function CarpLantern({
  intensity = 2.2,
  castLightShadow = false,
  withLight = true,
  shadowWhen,
  seed = 1,
  color = '#ff5a1a',
}: {
  intensity?: number
  castLightShadow?: boolean
  withLight?: boolean
  shadowWhen?: [number, number]
  seed?: number
  color?: string
}) {
  const reducedMotion = useSceneStore((s) => s.reducedMotion)
  const geo = useMemo(() => {
    const body = new THREE.LatheGeometry(bodyProfile(), 28)
    body.rotateZ(-Math.PI / 2) // lathe axis y → x (nose at x = 0)
    body.translate(-L / 2, 0, 0)
    body.rotateY(Math.PI) // nose at +x, tail root at -x
    const hoops = [0.2, 0.42, 0.64, 0.84].map((t) => {
      const r = bodyProfile()[Math.round(t * 23)].x
      const g = new THREE.TorusGeometry(r + 0.004, 0.006, 5, 24)
      g.rotateY(Math.PI / 2)
      g.translate(L / 2 - t * L, 0, 0)
      return g
    })
    const whisker = (s: number) =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(L / 2 - 0.01, -0.03, s * 0.03),
          new THREE.Vector3(L / 2 + 0.06, -0.06, s * 0.07),
          new THREE.Vector3(L / 2 + 0.1, -0.02, s * 0.1),
        ]),
        10,
        0.003,
        3,
      )
    return {
      body,
      hoops,
      tail: finShape('tail'),
      dorsal: finShape('dorsal'),
      pectoral: finShape('pectoral'),
      whiskers: [whisker(1), whisker(-1)],
    }
  }, [])

  const mats = useMemo(() => {
    const scales = carpScales()
    return {
      body: new THREE.MeshPhysicalMaterial({
        color,
        emissive: color,
        emissiveMap: scales,
        emissiveIntensity: 1.5,
        map: scales,
        transmission: 0.35,
        thickness: 0.05,
        roughness: 0.35,
        clearcoat: 0.6,
        side: THREE.DoubleSide,
      }),
      fin: new THREE.MeshStandardMaterial({
        color: '#ffb02a',
        emissive: '#ff7a10',
        emissiveIntensity: 0.9,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        roughness: 0.5,
      }),
      eye: new THREE.MeshStandardMaterial({ color: '#fff8e8', roughness: 0.3, emissive: '#ffffff', emissiveIntensity: 0.2 }),
      pupil: new THREE.MeshStandardMaterial({ color: '#0a0a0a', roughness: 0.2 }),
      flame: flameMaterial(),
      halo: haloMaterial('#ff7a2a', 0.25),
    }
  }, [color])

  const tail = useRef<THREE.Group>(null!)
  const fins = useRef<THREE.Group>(null!)
  const light = useRef<THREE.PointLight>(null!)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const k = flicker(t, seed, reducedMotion)
    if (light.current) light.current.intensity = intensity * k
    mats.body.emissiveIntensity = 1.5 * (0.85 + (k - 0.82) * 0.8)
    gateShadow(light.current, cinema.p, shadowWhen)
    if (reducedMotion) return
    // swimming: tail swish with a little irregularity, pectorals paddle
    tail.current.rotation.y = Math.sin(t * 3.2 + seed) * 0.45 + fbm1(t * 0.8 + seed) * 0.15
    fins.current.rotation.x = Math.sin(t * 4 + seed) * 0.3
  })

  return (
    <group>
      <mesh geometry={geo.body} material={mats.body} castShadow customDistanceMaterial={skipPointShadowMaterial} />
      {geo.hoops.map((g, i) => (
        <mesh key={i} geometry={g} material={bambooMaterial()} castShadow />
      ))}
      <group ref={tail} position={[-L / 2 + 0.01, 0, 0]}>
        <mesh geometry={geo.tail} material={mats.fin} rotation-y={Math.PI} castShadow />
      </group>
      <mesh geometry={geo.dorsal} material={mats.fin} position={[0.12, 0.13, 0]} rotation-y={Math.PI} castShadow />
      <group ref={fins} position={[0.15, -0.09, 0]}>
        <mesh geometry={geo.pectoral} material={mats.fin} position={[0, 0, 0.1]} rotation={[0.5, Math.PI, 0]} />
        <mesh geometry={geo.pectoral} material={mats.fin} position={[0, 0, -0.1]} rotation={[-0.5, Math.PI, 0]} />
      </group>
      {[1, -1].map((s) => (
        <group key={s} position={[L / 2 - 0.08, 0.035, s * 0.085]}>
          <mesh material={mats.eye} scale={0.03}>
            <sphereGeometry args={[1, 14, 10]} />
          </mesh>
          <mesh material={mats.pupil} position={[0.012, 0.004, s * 0.022]} scale={0.014}>
            <sphereGeometry args={[1, 10, 8]} />
          </mesh>
        </group>
      ))}
      {geo.whiskers.map((g, i) => (
        <mesh key={i} geometry={g} material={mats.fin} />
      ))}
      <mesh material={mats.flame} position={[0.05, -0.02, 0]} scale={[0.6, 1.4, 0.6]}>
        <sphereGeometry args={[0.012, 10, 8]} />
      </mesh>
      <Billboard>
        <mesh material={mats.halo} scale={1.2}>
          <planeGeometry />
        </mesh>
      </Billboard>
      {withLight && (
        <pointLight
          ref={light}
          position={[0.05, 0, 0]}
          color="#ff8a3a"
          intensity={intensity}
          decay={2}
          castShadow={castLightShadow}
          shadow-mapSize={[512, 512]}
          shadow-radius={6}
          shadow-bias={-0.002}
          shadow-normalBias={0.02}
          shadow-camera-near={0.05}
          shadow-camera-far={12}
        />
      )}
    </group>
  )
}
