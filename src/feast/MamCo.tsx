import { useMemo } from 'react'
import * as THREE from 'three'
import { mulberry32 } from '../lib/noise'
import { Candle } from '../lanterns/Candle'
import { useSceneStore } from '../store/useSceneStore'
import { banhDeoMaps, banhNuongMaps, peelNormal } from './feastTextures'

/* ---------- shared geometry ---------- */

function roundedSquare(size: number, r: number) {
  const s = size / 2
  const shape = new THREE.Shape()
  shape.moveTo(-s + r, -s)
  shape.lineTo(s - r, -s)
  shape.quadraticCurveTo(s, -s, s, -s + r)
  shape.lineTo(s, s - r)
  shape.quadraticCurveTo(s, s, s - r, s)
  shape.lineTo(-s + r, s)
  shape.quadraticCurveTo(-s, s, -s, s - r)
  shape.lineTo(-s, -s + r)
  shape.quadraticCurveTo(-s, -s, -s + r, -s)
  return shape
}

function flowerShape(radius: number, petals: number) {
  const shape = new THREE.Shape()
  const n = petals * 12
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2
    const r = radius * (0.9 + 0.1 * Math.abs(Math.cos((a * petals) / 2)))
    if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r)
    else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  return shape
}

/** Extrude a cake shape upright (y up) with the cap UVs spanning 0..1 across the top. */
function cakeGeometry(shape: THREE.Shape, height: number, bevel: number, span: number) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: height - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 4,
    curveSegments: 16,
  })
  const uv = g.attributes.uv
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / span + 0.5, uv.getY(i) / span + 0.5)
  g.rotateX(-Math.PI / 2)
  g.translate(0, bevel, 0)
  return g
}

function useFeastAssets() {
  return useMemo(() => {
    const nuong = banhNuongMaps()
    const deo = banhDeoMaps()
    const peel = peelNormal()
    const pomeloProfile = Array.from({ length: 20 }, (_, i) => {
      const t = i / 19
      const r = Math.pow(Math.sin(Math.PI * t), 0.75) * 0.085 * (1 - 0.28 * t) + (t > 0.95 ? 0.004 : 0)
      return new THREE.Vector2(Math.max(r, 0.0001), t * 0.17)
    })
    const plateProfile = [
      [0, 0],
      [0.06, 0],
      [0.065, 0.01],
      [0.035, 0.03],
      [0.03, 0.07],
      [0.16, 0.085],
      [0.2, 0.1],
      [0.19, 0.105],
      [0.15, 0.093],
      [0, 0.09],
    ].map(([x, y]) => new THREE.Vector2(x, y))
    const trayProfile = [
      [0, 0],
      [0.42, 0],
      [0.44, 0.012],
      [0.455, 0.045],
      [0.445, 0.048],
      [0.425, 0.02],
      [0, 0.016],
    ].map(([x, y]) => new THREE.Vector2(x, y))
    const cupProfile = [
      [0, 0],
      [0.018, 0],
      [0.02, 0.006],
      [0.028, 0.012],
      [0.034, 0.04],
      [0.031, 0.04],
      [0.025, 0.014],
      [0, 0.012],
    ].map(([x, y]) => new THREE.Vector2(x, y))
    const potProfile = [
      [0, 0],
      [0.045, 0],
      [0.065, 0.03],
      [0.068, 0.06],
      [0.05, 0.095],
      [0.026, 0.105],
      [0.03, 0.112],
      [0, 0.112],
    ].map(([x, y]) => new THREE.Vector2(x, y))
    const bananaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.05, 0.03, 0),
      new THREE.Vector3(0.1, 0.035, 0),
      new THREE.Vector3(0.15, 0.015, 0),
    ])
    return {
      geo: {
        nuong: cakeGeometry(roundedSquare(0.09, 0.012), 0.045, 0.008, 0.1),
        deo: cakeGeometry(flowerShape(0.048, 8), 0.04, 0.012, 0.1),
        pomelo: new THREE.LatheGeometry(pomeloProfile, 28),
        plate: new THREE.LatheGeometry(plateProfile, 36),
        tray: new THREE.LatheGeometry(trayProfile, 64),
        cup: new THREE.LatheGeometry(cupProfile, 20),
        pot: new THREE.LatheGeometry(potProfile, 24),
        banana: new THREE.TubeGeometry(bananaCurve, 16, 0.016, 8, false),
        sphere: new THREE.SphereGeometry(1, 24, 16),
        bract: new THREE.ConeGeometry(0.012, 0.035, 5),
        leaf: new THREE.CircleGeometry(1, 10),
      },
      mat: {
        nuong: new THREE.MeshPhysicalMaterial({
          map: nuong.map,
          roughnessMap: nuong.roughnessMap,
          normalMap: nuong.normalMap,
          normalScale: new THREE.Vector2(1.2, 1.2),
          roughness: 0.75,
          clearcoat: 0.25,
          clearcoatRoughness: 0.5,
          sheen: 0.4,
          sheenColor: new THREE.Color('#ffcf8a'),
        }),
        deo: new THREE.MeshPhysicalMaterial({
          map: deo.map,
          normalMap: deo.normalMap,
          roughness: 0.92,
          sheen: 1,
          sheenRoughness: 0.8,
          sheenColor: new THREE.Color('#ffffff'),
        }),
        deoPandan: new THREE.MeshPhysicalMaterial({
          map: deo.map,
          normalMap: deo.normalMap,
          color: '#b8dca0',
          roughness: 0.92,
          sheen: 1,
          sheenColor: new THREE.Color('#eaffd8'),
        }),
        brass: new THREE.MeshStandardMaterial({ color: '#a47a34', metalness: 0.9, roughness: 0.48 }),
        porcelain: new THREE.MeshPhysicalMaterial({ color: '#eef2f4', roughness: 0.15, clearcoat: 1 }),
        pomelo: new THREE.MeshPhysicalMaterial({ color: '#b4c24a', normalMap: peel, roughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.4 }),
        mandarin: new THREE.MeshPhysicalMaterial({ color: '#f0861a', normalMap: peel, roughness: 0.45, clearcoat: 0.4 }),
        persimmon: new THREE.MeshPhysicalMaterial({ color: '#e5661e', roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.2 }),
        banana: new THREE.MeshStandardMaterial({ color: '#e6c23a', roughness: 0.55 }),
        dragon: new THREE.MeshPhysicalMaterial({ color: '#d42a72', roughness: 0.4, clearcoat: 0.3 }),
        bract: new THREE.MeshStandardMaterial({ color: '#9cc23a', roughness: 0.5 }),
        grape: new THREE.MeshPhysicalMaterial({ color: '#3e1440', roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.35 }),
        leaf: new THREE.MeshStandardMaterial({ color: '#2f5a24', roughness: 0.6, side: THREE.DoubleSide }),
        stem: new THREE.MeshStandardMaterial({ color: '#3a2a14', roughness: 0.9 }),
      },
    }
  }, [])
}

type Assets = ReturnType<typeof useFeastAssets>

function Pomelo({ a, position }: { a: Assets; position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh geometry={a.geo.pomelo} material={a.mat.pomelo} castShadow receiveShadow />
      <mesh position={[0, 0.172, 0]} material={a.mat.stem}>
        <cylinderGeometry args={[0.004, 0.005, 0.02, 6]} />
      </mesh>
      <mesh geometry={a.geo.leaf} material={a.mat.leaf} position={[0.03, 0.178, 0]} rotation={[-1.2, 0.3, 0.4]} scale={[0.05, 0.022, 1]} castShadow />
    </group>
  )
}

function DragonFruit({ a, position }: { a: Assets; position: [number, number, number] }) {
  const bracts = useMemo(() => {
    const rnd = mulberry32(307)
    return Array.from({ length: 16 }, () => {
      const th = rnd() * Math.PI * 2
      const ph = 0.4 + rnd() * 2.2
      const n = new THREE.Vector3(Math.sin(ph) * Math.cos(th), Math.cos(ph) * 1.3, Math.sin(ph) * Math.sin(th))
      const p = n.clone().multiply(new THREE.Vector3(0.05, 0.065, 0.05)).multiplyScalar(0.98 / n.length())
      const up = new THREE.Vector3(0, 1, 0)
      const dir = n.clone().normalize().lerp(up, 0.6).normalize()
      return { p, q: new THREE.Quaternion().setFromUnitVectors(up, dir) }
    })
  }, [])
  return (
    <group position={position} rotation={[0.5, 0.3, 0.9]}>
      <mesh geometry={a.geo.sphere} material={a.mat.dragon} scale={[0.05, 0.065, 0.05]} castShadow receiveShadow />
      {bracts.map((b, i) => (
        <mesh key={i} geometry={a.geo.bract} material={a.mat.bract} position={b.p} quaternion={b.q} scale={[1, 1, 0.35]} />
      ))}
    </group>
  )
}

function Grapes({ a, position }: { a: Assets; position: [number, number, number] }) {
  const berries = useMemo(() => {
    const rnd = mulberry32(311)
    const out: [number, number, number][] = []
    for (let row = 0; row < 5; row++) {
      const n = 6 - row
      const r = 0.012 * n * 0.55
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + row
        out.push([Math.cos(a) * r + (rnd() - 0.5) * 0.004, 0.012 + row * 0.017, Math.sin(a) * r])
      }
    }
    return out
  }, [])
  return (
    <group position={position} rotation={[0, 0, Math.PI / 2 - 0.25]}>
      {berries.map((p, i) => (
        <mesh key={i} geometry={a.geo.sphere} material={a.mat.grape} position={p} scale={0.0115} castShadow />
      ))}
    </group>
  )
}

function Bananas({ a, position, rotation }: { a: Assets; position: [number, number, number]; rotation: number }) {
  return (
    <group position={position} rotation-y={rotation}>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh
          key={i}
          geometry={a.geo.banana}
          material={a.mat.banana}
          position={[0, 0.016 + (i % 2) * 0.02, (i - 2.5) * 0.024]}
          rotation={[0, (i - 2.5) * 0.12, 0]}
          castShadow
          receiveShadow
        />
      ))}
      <mesh material={a.mat.stem} position={[-0.008, 0.03, 0]} rotation-z={0.6}>
        <cylinderGeometry args={[0.012, 0.016, 0.04, 8]} />
      </mesh>
    </group>
  )
}

/**
 * Mâm cỗ Trung Thu: a brass tray with a raised plate of ngũ quả (pomelo,
 * bananas, persimmons, dragon fruit, grapes, mandarins), bánh nướng and bánh
 * dẻo, a small tea set and altar candles — everything casts soft shadows onto
 * the cloth.
 */
export function MamCo({ position = [0, 0, 0] as [number, number, number] }) {
  const a = useFeastAssets()
  const quality = useSceneStore((s) => s.quality)
  const cakes: { kind: 'nuong' | 'deo' | 'deoPandan'; p: [number, number, number]; r: number }[] = [
    { kind: 'nuong', p: [-0.24, 0.016, 0.18], r: 0.3 },
    { kind: 'nuong', p: [0.26, 0.016, 0.14], r: -0.4 },
    { kind: 'deo', p: [-0.06, 0.016, 0.3], r: 0 },
    { kind: 'deoPandan', p: [0.12, 0.016, 0.3], r: 0.5 },
    { kind: 'nuong', p: [-0.3, 0.016, -0.06], r: 0.9 },
    { kind: 'deo', p: [0.32, 0.016, -0.08], r: 0.2 },
  ]
  return (
    <group position={position}>
      <mesh geometry={a.geo.tray} material={a.mat.brass} castShadow receiveShadow />
      {cakes.map((c, i) => (
        <mesh key={i} geometry={a.geo[c.kind === 'nuong' ? 'nuong' : 'deo']} material={a.mat[c.kind]} position={c.p} rotation-y={c.r} castShadow receiveShadow />
      ))}
      {/* a bánh nướng cut open: salted egg yolk in the thập cẩm filling */}
      <group position={[0.02, 0.016, 0.16]} rotation-y={-0.2}>
        <mesh geometry={a.geo.nuong} material={a.mat.nuong} scale={[0.5, 1, 1]} position={[-0.024, 0, 0]} castShadow receiveShadow />
        <mesh position={[0, 0.0225, 0]} rotation-y={Math.PI / 2}>
          <planeGeometry args={[0.088, 0.038]} />
          <meshStandardMaterial color="#8a5a2a" roughness={0.9} />
        </mesh>
        <mesh position={[0.0005, 0.024, 0]} rotation-y={Math.PI / 2}>
          <circleGeometry args={[0.013, 20]} />
          <meshStandardMaterial color="#f2a31a" roughness={0.4} emissive="#6a3000" emissiveIntensity={0.2} />
        </mesh>
      </group>

      {/* raised fruit plate: ngũ quả */}
      <group position={[0, 0.016, -0.12]}>
        <mesh geometry={a.geo.plate} material={a.mat.brass} castShadow receiveShadow />
        <group position={[0, 0.095, 0]}>
          <Pomelo a={a} position={[0, 0, 0]} />
          <Bananas a={a} position={[-0.17, 0, -0.02]} rotation={0.2} />
          <DragonFruit a={a} position={[0.1, 0.05, 0.07]} />
          <Grapes a={a} position={[0.1, 0.01, -0.08]} />
          {[
            [-0.08, 0.035, 0.1],
            [0.02, 0.03, 0.13],
            [-0.12, 0.03, 0.03],
          ].map((p, i) => (
            <mesh key={i} geometry={a.geo.sphere} material={i === 1 ? a.mat.mandarin : a.mat.persimmon} position={p as [number, number, number]} scale={[0.037, 0.03, 0.037]} castShadow receiveShadow />
          ))}
        </group>
      </group>

      {/* tea set beside the tray */}
      <group position={[0.56, -0.012, 0.22]}>
        <mesh geometry={a.geo.pot} material={a.mat.porcelain} castShadow receiveShadow />
        <mesh position={[0.075, 0.06, 0]} rotation-z={-0.9} material={a.mat.porcelain} castShadow>
          <cylinderGeometry args={[0.006, 0.011, 0.07, 8]} />
        </mesh>
        <mesh position={[-0.066, 0.06, 0]} rotation-z={Math.PI / 2} material={a.mat.porcelain}>
          <torusGeometry args={[0.028, 0.006, 6, 16, Math.PI]} />
        </mesh>
        {[
          [-0.02, 0.14],
          [0.08, 0.12],
          [-0.11, 0.1],
        ].map(([x, z], i) => (
          <mesh key={i} geometry={a.geo.cup} material={a.mat.porcelain} position={[x, 0, z]} castShadow receiveShadow />
        ))}
      </group>

      {/* altar candles */}
      <Candle position={[-0.56, -0.012, -0.22]} height={0.16} seed={1} intensity={0.7} />
      <Candle position={[0.56, -0.012, -0.22]} height={0.13} seed={2} intensity={0.7} withLight={quality === 'high'} />
    </group>
  )
}
