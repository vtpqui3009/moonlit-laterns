import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { lionCloth, lionPaint } from '../lanterns/lanternTextures'
import { fbm1, mulberry32 } from '../lib/noise'
import { useSceneStore } from '../store/useSceneStore'

const FUR_COLORS = ['#ffffff', '#f7e7b0', '#ffd23a', '#e8281e', '#ffffff']

/** Big papier-mâché skull: a sphere with a bulging brow and a flattened back. */
function skullGeometry() {
  const g = new THREE.SphereGeometry(1, 40, 28)
  const p = g.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i)
    const front = Math.max(0, v.z)
    const brow = Math.exp(-((v.y - 0.45) ** 2) * 12) * front * 0.18
    v.set(v.x * 0.37, v.y * 0.3 + brow, v.z * (v.z < 0 ? 0.26 : 0.34))
    p.setXYZ(i, v.x, v.y, v.z)
  }
  g.computeVertexNormals()
  return g
}

/** Fur: instanced ribbons with per-instance colours, seeded along a set of anchor curves. */
function useFur(count: number, place: (i: number, rnd: () => number, m: THREE.Matrix4) => void, seed: number) {
  const ref = useRef<THREE.InstancedMesh>(null!)
  useLayoutEffect(() => {
    const rnd = mulberry32(seed)
    const m = new THREE.Matrix4()
    const c = new THREE.Color()
    for (let i = 0; i < count; i++) {
      place(i, rnd, m)
      ref.current.setMatrixAt(i, m)
      ref.current.setColorAt(i, c.set(FUR_COLORS[Math.floor(rnd() * FUR_COLORS.length)]))
    }
    ref.current.instanceMatrix.needsUpdate = true
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
    ref.current.computeBoundingSphere()
  }, [count, place, seed])
  return ref
}

const furMat = new THREE.MeshStandardMaterial({ roughness: 0.9, side: THREE.DoubleSide })
const furGeo = new THREE.PlaneGeometry(0.03, 1, 1, 3).translate(0, -0.5, 0)

/**
 * Múa lân — the lion dance. A procedural lion head in painted papier-mâché
 * (giấy bồi) with a mirror on its brow, a horn, glowing eyes that blink, a
 * hinged jaw, fur mane and beard, trailing a silk body worn by two dancers.
 * The head bobs, nods and looks around; the jaw snaps; the cloth ripples.
 */
export function LionDance({ position = [0, 0, 0] as [number, number, number], facing = 0 }) {
  const reducedMotion = useSceneStore((s) => s.reducedMotion)
  const root = useRef<THREE.Group>(null!)
  const head = useRef<THREE.Group>(null!)
  const jaw = useRef<THREE.Group>(null!)
  const lids = useRef<(THREE.Mesh | null)[]>([])
  const cloth = useRef<THREE.Mesh>(null!)
  const legs = useRef<(THREE.Group | null)[]>([])

  const geo = useMemo(() => {
    const clothGeo = new THREE.PlaneGeometry(1.15, 2.3, 16, 40)
    clothGeo.rotateX(-Math.PI / 2)
    return {
      skull: skullGeometry(),
      cloth: clothGeo,
      clothRest: Float32Array.from(clothGeo.attributes.position.array as Float32Array),
      horn: new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.1, 0.02), new THREE.Vector3(0, 0.17, 0.08)]),
        10,
        0.025,
        8,
      ),
      lid: new THREE.SphereGeometry(0.082, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    }
  }, [])

  const mats = useMemo(() => {
    const paint = lionPaint()
    return {
      paint: new THREE.MeshPhysicalMaterial({ map: paint, bumpMap: paint, bumpScale: 0.6, roughness: 0.55, clearcoat: 0.3, clearcoatRoughness: 0.6 }),
      red: new THREE.MeshStandardMaterial({ color: '#c01818', roughness: 0.5 }),
      mouth: new THREE.MeshStandardMaterial({ color: '#3a0606', roughness: 0.8 }),
      teeth: new THREE.MeshStandardMaterial({ color: '#f4f0e0', roughness: 0.4 }),
      tongue: new THREE.MeshStandardMaterial({ color: '#e84a5a', roughness: 0.5 }),
      eye: new THREE.MeshStandardMaterial({ color: '#fff6d0', emissive: '#ffe08a', emissiveIntensity: 1.8, roughness: 0.2 }),
      pupil: new THREE.MeshStandardMaterial({ color: '#050505', roughness: 0.1, metalness: 0.2 }),
      lid: new THREE.MeshStandardMaterial({ color: '#f2b01e', roughness: 0.5, side: THREE.DoubleSide }),
      gold: new THREE.MeshStandardMaterial({ color: '#e0a830', metalness: 0.8, roughness: 0.3 }),
      mirror: new THREE.MeshStandardMaterial({ color: '#ffffff', metalness: 1, roughness: 0.05 }),
      cloth: new THREE.MeshStandardMaterial({ map: lionCloth(), roughness: 0.65, side: THREE.DoubleSide }),
      pants: new THREE.MeshStandardMaterial({ color: '#f0c030', roughness: 0.8 }),
      shoe: new THREE.MeshStandardMaterial({ color: '#111111', roughness: 0.6 }),
    }
  }, [])

  // mane around the face, beard under the jaw, tail tuft
  const mane = useFur(
    170,
    (i, rnd, m) => {
      const a = (i / 170) * Math.PI * 2
      const p = new THREE.Vector3(Math.cos(a) * 0.36, Math.sin(a) * 0.3, 0.08 + rnd() * 0.04)
      const out = new THREE.Vector3(Math.cos(a), Math.sin(a), -0.3).normalize()
      const down = new THREE.Vector3(0, -1, 0).lerp(out, 0.55).normalize()
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), down)
      q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd() * Math.PI))
      const len = 0.12 + rnd() * 0.16
      m.compose(p, q, new THREE.Vector3(1, len, 1))
    },
    601,
  )
  const beard = useFur(
    60,
    (_, rnd, m) => {
      const p = new THREE.Vector3((rnd() - 0.5) * 0.36, -0.08, 0.1 + rnd() * 0.18)
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.25 + rnd() * 0.2, rnd() * 3, (rnd() - 0.5) * 0.3))
      m.compose(p, q, new THREE.Vector3(1.2, 0.22 + rnd() * 0.22, 1))
    },
    607,
  )
  const brows = useFur(
    40,
    (i, rnd, m) => {
      const s = i < 20 ? 1 : -1
      const k = (i % 20) / 19
      const p = new THREE.Vector3(s * (0.05 + k * 0.17), 0.19 + Math.sin(k * Math.PI) * 0.03, 0.29 - k * 0.04)
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-1.2 - rnd() * 0.3, 0, s * (0.5 + rnd() * 0.4)))
      m.compose(p, q, new THREE.Vector3(1.4, 0.1 + rnd() * 0.05, 1))
    },
    613,
  )

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (reducedMotion) {
      jaw.current.rotation.x = 0.18
      return
    }
    // head: rhythmic bob to the drum, curious looks, occasional shake
    const beat = Math.sin(t * 2.6)
    const rear = Math.max(0, fbm1(t * 0.18 + 3)) * 0.35 // sometimes the lion rears up
    head.current.position.y = 1.02 + beat * 0.06 + rear
    head.current.rotation.x = -0.1 + Math.sin(t * 2.6 + 0.6) * 0.1 - rear * 0.4
    head.current.rotation.y = fbm1(t * 0.35) * 0.7
    head.current.rotation.z = fbm1(t * 0.9 + 11) * 0.18
    // jaw snaps now and then
    jaw.current.rotation.x = 0.06 + Math.pow(Math.max(0, Math.sin(t * 1.9)), 4) * 0.45
    // blink every ~3.3 s
    const blink = t % 3.3 < 0.14
    lids.current.forEach((l) => {
      if (l) l.rotation.x = blink ? 1.3 : -1.2
    })
    // the whole lion shuffles along a small figure-eight
    root.current.position.set(position[0] + Math.sin(t * 0.25) * 0.8, 0, position[2] + Math.sin(t * 0.5) * 0.35)
    root.current.rotation.y = facing + Math.cos(t * 0.25) * 0.35
    // dancers' legs: small quick steps
    legs.current.forEach((l, i) => {
      if (l) l.rotation.x = Math.sin(t * 5.2 + (i % 2) * Math.PI + (i > 1 ? 1.2 : 0)) * 0.35
    })
    // silk body ripples front to back and sways
    const pos = geo.cloth.attributes.position
    const rest = geo.clothRest
    for (let i = 0; i < pos.count; i++) {
      const x = rest[i * 3]
      const z = rest[i * 3 + 2] // +1.15 (behind the head) .. -1.15 (tail)
      const s = (1.15 - z) / 2.3 // 0 at the head, 1 at the tail
      const across = x / 0.575
      const back = 0.95 - s * 0.12 + Math.sin(s * 7 - t * 3.4) * 0.05 * (0.4 + s) + (s < 0.1 ? rear * (1 - s / 0.1) : 0)
      const drape = across * across * 0.55
      const sway = Math.sin(s * 3 - t * 1.6) * 0.08 * s
      pos.setXYZ(i, x * (1 + Math.abs(across) * 0.12) + sway, back - drape, z)
    }
    pos.needsUpdate = true
    geo.cloth.computeVertexNormals()
  })

  return (
    <group ref={root} position={position} rotation-y={facing}>
      {/* silk body, attached behind the head and extending backward */}
      <mesh ref={cloth} geometry={geo.cloth} material={mats.cloth} position={[0, 0, -1.2]} castShadow receiveShadow />

      {/* dancers' legs: front dancer under the head, rear dancer under the tail */}
      {[
        [-0.13, 0.05],
        [0.13, 0.05],
        [-0.13, -1.75],
        [0.13, -1.75],
      ].map(([x, z], i) => (
        <group
          key={i}
          ref={(el) => {
            legs.current[i] = el
          }}
          position={[x, 0.72, z]}
        >
          <mesh material={mats.pants} position={[0, -0.34, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.06, 0.68, 8]} />
          </mesh>
          <mesh material={mats.shoe} position={[0, -0.69, 0.05]} castShadow>
            <boxGeometry args={[0.1, 0.06, 0.2]} />
          </mesh>
        </group>
      ))}

      <group ref={head} position={[0, 1.02, 0]}>
        <mesh geometry={geo.skull} material={mats.paint} castShadow receiveShadow />
        {/* snout */}
        <mesh material={mats.paint} position={[0, -0.08, 0.2]} scale={[0.26, 0.11, 0.17]} castShadow>
          <sphereGeometry args={[1, 24, 16]} />
        </mesh>
        <mesh material={mats.red} position={[0, -0.02, 0.36]} scale={[0.05, 0.035, 0.03]}>
          <sphereGeometry args={[1, 12, 8]} />
        </mesh>
        {/* mouth cavity */}
        <mesh material={mats.mouth} position={[0, -0.15, 0.18]} rotation-x={-Math.PI / 2} scale={[0.2, 0.14, 1]}>
          <circleGeometry args={[1, 24]} />
        </mesh>
        {/* upper teeth */}
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={i} material={mats.teeth} position={[-0.14 + i * 0.04, -0.17, 0.28 - Math.abs(i - 3.5) * 0.012]}>
            <coneGeometry args={[0.013, 0.04, 5]} />
          </mesh>
        ))}
        {/* hinged lower jaw with tongue and beard */}
        <group ref={jaw} position={[0, -0.15, 0.04]}>
          <mesh material={mats.paint} position={[0, -0.04, 0.16]} scale={[0.25, 0.07, 0.2]} castShadow>
            <sphereGeometry args={[1, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          </mesh>
          <mesh material={mats.tongue} position={[0, -0.035, 0.18]} rotation-x={-Math.PI / 2} scale={[0.1, 0.12, 1]}>
            <circleGeometry args={[1, 16]} />
          </mesh>
          <instancedMesh ref={beard} args={[furGeo, furMat, 60]} castShadow />
        </group>
        {/* glowing eyes with blinking lids */}
        {[-1, 1].map((s, i) => (
          <group key={s} position={[s * 0.13, 0.08, 0.26]}>
            <mesh material={mats.eye} scale={0.075}>
              <sphereGeometry args={[1, 20, 14]} />
            </mesh>
            <mesh material={mats.pupil} position={[0, 0, 0.055]} scale={0.032}>
              <sphereGeometry args={[1, 14, 10]} />
            </mesh>
            <mesh
              ref={(el) => {
                lids.current[i] = el
              }}
              geometry={geo.lid}
              material={mats.lid}
              rotation-x={-1.2}
            />
          </group>
        ))}
        <instancedMesh ref={brows} args={[furGeo, furMat, 40]} />
        {/* forehead mirror (gương chiếu yêu) and horn */}
        <mesh material={mats.gold} position={[0, 0.2, 0.3]} rotation-x={-0.5}>
          <torusGeometry args={[0.055, 0.012, 8, 24]} />
        </mesh>
        <mesh material={mats.mirror} position={[0, 0.2, 0.302]} rotation-x={-0.5}>
          <circleGeometry args={[0.05, 24]} />
        </mesh>
        <mesh geometry={geo.horn} material={mats.gold} position={[0, 0.27, 0.22]} castShadow />
        {/* ears */}
        {[-1, 1].map((s) => (
          <mesh key={s} material={mats.red} position={[s * 0.27, 0.2, -0.02]} rotation={[0, 0, -s * 0.7]} castShadow>
            <coneGeometry args={[0.06, 0.16, 8]} />
          </mesh>
        ))}
        <instancedMesh ref={mane} args={[furGeo, furMat, 170]} castShadow />
        <pointLight position={[0, 0.08, 0.6]} color="#ffe6a0" intensity={0.3} distance={3} decay={2} />
      </group>
    </group>
  )
}
