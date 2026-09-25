import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ModelSlot } from '../components/ModelSlot'
import { CarpLantern } from '../lanterns/CarpLantern'
import { RoundLantern } from '../lanterns/RoundLantern'
import { StarLantern } from '../lanterns/StarLantern'
import { mulberry32 } from '../lib/noise'
import { useSceneStore } from '../store/useSceneStore'
import { Child, type ChildHandle } from './Child'

/** The procession loops around the courtyard, passing in front of the đình and the camera of shot 3. */
export const PROCESSION_PATH = new THREE.CatmullRomCurve3(
  [
    [-7, 7],
    [-4, 9.3],
    [0, 9.6],
    [4, 8.8],
    [7, 6.2],
    [7.6, 1.2],
    [5.6, -2.1],
    [0, -2.7],
    [-5, -2.1],
    [-7.9, 1.4],
    [-8.1, 4.8],
  ].map(([x, z]) => new THREE.Vector3(x, 0.012, z)),
  true,
  'centripetal',
)
const LOOP = PROCESSION_PATH.getLength()

const SHIRTS = ['#c43a2a', '#f2c230', '#3a78c8', '#f4f0e6', '#d85a9a', '#3aa060', '#e87a2a', '#6a4ab8']
const PANTS = ['#1a1a2a', '#3a2a1a', '#20304a', '#2a2a2a']

type Kind = 'star' | 'carp' | 'round'
interface Walker {
  kind: Kind
  offset: number // metres behind the head of the procession
  wobbleAmp: number
  wobbleFreq: number
  wobblePhase: number
  shirt: string
  pants: string
  height: number
  hair: 0 | 1
  paper: string
  light: boolean
  shadow: boolean
  seed: number
}

function buildWalkers(count: number, lights: number, shadows: number): Walker[] {
  const rnd = mulberry32(503)
  const walkers: Walker[] = []
  // two groups with a gap, so some of the procession is always passing the camera
  const groupA = Math.ceil(count * 0.55)
  let d = 0
  for (let i = 0; i < count; i++) {
    if (i === groupA) d += LOOP * 0.5 - groupA * 1.25
    const kind: Kind = i % 3 === 1 ? 'carp' : i % 5 === 3 ? 'round' : 'star'
    walkers.push({
      kind,
      offset: d,
      wobbleAmp: 0.15 + rnd() * 0.25,
      wobbleFreq: 0.2 + rnd() * 0.25,
      wobblePhase: rnd() * Math.PI * 2,
      shirt: SHIRTS[Math.floor(rnd() * SHIRTS.length)],
      pants: PANTS[Math.floor(rnd() * PANTS.length)],
      height: 0.95 + rnd() * 0.3,
      hair: rnd() > 0.5 ? 1 : 0,
      paper: ['#d81f26', '#e8b21a', '#d81f26', '#2a9a4e', '#d8409a'][Math.floor(rnd() * 5)],
      light: false,
      shadow: false,
      seed: i + 10,
    })
    d += 1.2 + rnd() * 0.35
  }
  // spread real lights evenly through the procession; the first few also cast shadows
  const step = count / Math.max(1, lights)
  for (let k = 0; k < lights; k++) {
    const w = walkers[Math.min(count - 1, Math.floor(k * step))]
    w.light = true
    w.shadow = k < shadows && k % 2 === 0
  }
  return walkers
}

/**
 * Đoàn rước đèn: children walk in file along a Catmull-Rom loop, each at a
 * slightly different, gently varying pace (no drift, no collisions), with
 * lanterns that swing from their sticks. Every lit lantern is a moving warm
 * PointLight; a few cast soft moving shadows onto the courtyard.
 * With prefers-reduced-motion they stand still along the path, lanterns lit.
 */
export function Procession() {
  const quality = useSceneStore((s) => s.quality)
  const reducedMotion = useSceneStore((s) => s.reducedMotion)
  const walkers = useMemo(
    () => (quality === 'high' ? buildWalkers(16, 9, 5) : buildWalkers(10, 4, 1)),
    [quality],
  )
  const kids = useRef<(ChildHandle | null)[]>([])
  const v = useMemo(() => ({ p: new THREE.Vector3(), t: new THREE.Vector3() }), [])
  const SPEED = 0.55 // m/s — an unhurried children's walk

  useFrame(({ clock }) => {
    // reduced motion: a still frame of the procession, spread along the front of the courtyard
    const time = reducedMotion ? 11 : clock.elapsedTime
    walkers.forEach((w, i) => {
      const kid = kids.current[i]
      if (!kid) return
      const wobble = Math.sin(time * w.wobbleFreq + w.wobblePhase) * w.wobbleAmp
      const dist = (((time * SPEED - w.offset + wobble + 6) % LOOP) + LOOP) % LOOP
      const u = dist / LOOP
      PROCESSION_PATH.getPointAt(u, v.p)
      PROCESSION_PATH.getTangentAt(u, v.t)
      kid.root.position.copy(v.p)
      kid.root.rotation.y = Math.atan2(v.t.x, v.t.z)
      // stride phase follows distance walked, so feet don't slide
      const legLen = 0.42 * w.height
      kid.pose(reducedMotion ? 0 : (dist / (legLen * 1.9)) * Math.PI, reducedMotion ? 0 : 1)
    })
  })

  return (
    <group>
      {walkers.map((w, i) => (
        <Child
          key={i}
          ref={(el) => {
            kids.current[i] = el
          }}
          shirt={w.shirt}
          pants={w.pants}
          height={w.height}
          hairStyle={w.hair}
        >
          {w.kind === 'star' && (
            <ModelSlot
              id="ong-sao"
              scale={0.75}
              fallback={
                <StarLantern
                  radius={0.26}
                  stringLength={0.14}
                  paperColor={w.paper}
                  intensity={1.8}
                  withLight={w.light}
                  castLightShadow={w.shadow}
                  shadowWhen={[1.3, 3.2]}
                  seed={w.seed}
                />
              }
            />
          )}
          {w.kind === 'carp' && (
            <ModelSlot
              id="den-ca-chep"
              position={[0, -0.28, 0]}
              scale={0.7}
              rotation-y={-Math.PI / 2}
              fallback={<CarpLantern withLight={w.light} castLightShadow={w.shadow} shadowWhen={[1.3, 3.2]} seed={w.seed} intensity={1.8} />}
            />
          )}
          {w.kind === 'round' && (
            <group position={[0, -0.3, 0]}>
              <RoundLantern size={0.34} color={w.paper} withLight={w.light} lightIntensity={1.4} />
            </group>
          )}
        </Child>
      ))}
    </group>
  )
}
