import { useMemo } from 'react'
import * as THREE from 'three'
import { limeWall, makeCanvas, toTexture, woodGrain } from '../lib/textures'
import { curvedRoofGeometry, gableGeometry, ridgeCurve } from './roofGeometry'
import { lacquerWood, roofTileNormal, roofTiles } from './worldTextures'

const W = 11
const D = 6.4
const EAVE = 3.3
const RIDGE = 6.6

function plaqueTexture() {
  const { c, ctx } = makeCanvas(512, 128)
  ctx.fillStyle = '#6e1410'
  ctx.fillRect(0, 0, 512, 128)
  ctx.strokeStyle = '#d9a441'
  ctx.lineWidth = 8
  ctx.strokeRect(8, 8, 496, 112)
  ctx.lineWidth = 2
  ctx.strokeRect(22, 22, 468, 84)
  ctx.fillStyle = '#f0c35a'
  ctx.font = '600 58px "Playfair Display", Georgia, serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('ĐÌNH LÀNG', 256, 68)
  return toTexture(c, true)
}

/**
 * The village communal house (đình làng): stone plinth, rows of lacquered
 * ironwood columns, open front with a glowing altar, and a sweeping tiled
 * roof with curled corners and "lưỡng long chầu nguyệt" on the ridge.
 */
export function Dinh({ position = [0, 0, 0] as [number, number, number] }) {
  const parts = useMemo(() => {
    const roof = curvedRoofGeometry({ width: W, depth: D, ridgeY: RIDGE, eaveY: EAVE, overhang: 1.5, curl: 0.9, sag: 0.35 })
    const tiles = roofTiles()
    const hooks = [-1, 1].flatMap((sx) =>
      [-1, 1].map((sz) => {
        const X = W / 2 + 1.5
        const eaveZ = D / 2 + 1.5 + 1.5 * 0.35
        const y = EAVE + 0.9
        return new THREE.CatmullRomCurve3([
          new THREE.Vector3(sx * (X - 0.8), y - 0.25, sz * (eaveZ - 0.2)),
          new THREE.Vector3(sx * X, y + 0.05, sz * eaveZ),
          new THREE.Vector3(sx * (X + 0.25), y + 0.6, sz * (eaveZ + 0.25)),
          new THREE.Vector3(sx * (X + 0.05), y + 0.95, sz * (eaveZ + 0.1)),
        ])
      }),
    )
    // two stylised dragons writhing toward the moon-pearl on the ridge
    const dragons = [-1, 1].map(
      (s) =>
        new THREE.CatmullRomCurve3(
          Array.from({ length: 9 }, (_, i) => {
            const t = i / 8
            return new THREE.Vector3(s * (3.4 - t * 2.7), RIDGE + 0.28 + Math.sin(t * Math.PI * 3) * 0.16 + t * 0.18, 0)
          }),
        ),
    )
    return {
      roof: roof.geometry,
      eaves: roof.eaves,
      ridge: ridgeCurve(W / 2 + 0.8, RIDGE + 0.12, 0.8),
      gable: gableGeometry(D / 2 + 0.3, EAVE + 0.2, RIDGE - 0.1),
      hooks,
      dragons,
      mats: {
        tiles: new THREE.MeshStandardMaterial({ map: tiles, normalMap: roofTileNormal(), roughness: 0.85, color: '#c9a898' }),
        under: new THREE.MeshStandardMaterial({ map: lacquerWood(), color: '#5a3020', roughness: 0.8, side: THREE.BackSide }),
        lacquer: new THREE.MeshPhysicalMaterial({ map: lacquerWood(), roughness: 0.4, clearcoat: 0.6, clearcoatRoughness: 0.3 }),
        plaster: new THREE.MeshStandardMaterial({ map: limeWall(), color: '#d8cdb8', roughness: 0.95, side: THREE.DoubleSide }),
        ridge: new THREE.MeshStandardMaterial({ color: '#6a3a26', roughness: 0.8 }),
        stone: new THREE.MeshStandardMaterial({ color: '#57544f', roughness: 0.95, map: woodGrain() }),
        pearl: new THREE.MeshStandardMaterial({ color: '#f3e3b0', emissive: '#ffcf7a', emissiveIntensity: 0.6, roughness: 0.4 }),
        dragon: new THREE.MeshStandardMaterial({ color: '#4d6a5a', roughness: 0.6, metalness: 0.2 }),
        plaque: new THREE.MeshStandardMaterial({ map: plaqueTexture(), roughness: 0.5, emissive: '#3a0a06', emissiveIntensity: 0.2 }),
        altar: new THREE.MeshStandardMaterial({ color: '#8a1a10', emissive: '#ff7a2a', emissiveIntensity: 0.9, roughness: 0.6 }),
        interior: new THREE.MeshStandardMaterial({ color: '#1a0c08', roughness: 1, side: THREE.BackSide }),
      },
    }
  }, [])

  const cols: [number, number, number][] = []
  for (const z of [D / 2 - 0.2, D / 2 - 2.2, -D / 2 + 2.2, -D / 2 + 0.2]) {
    for (let i = 0; i < 6; i++) {
      const x = -W / 2 + 0.4 + (i * (W - 0.8)) / 5
      const r = Math.abs(z) < 2 ? 0.2 : 0.16
      cols.push([x, z, r])
    }
  }

  return (
    <group position={position}>
      {/* stone plinth and steps */}
      <mesh position={[0, 0.25, 0]} material={parts.mats.stone} castShadow receiveShadow>
        <boxGeometry args={[W + 1.6, 0.5, D + 1.8]} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.08 + i * 0.0, D / 2 + 1.05 + (2 - i) * 0.28]} material={parts.mats.stone} castShadow receiveShadow>
          <boxGeometry args={[3.2, 0.16 + i * 0.17, 0.3]} />
        </mesh>
      ))}

      {/* ironwood columns */}
      {cols.map(([x, z, r], i) => (
        <mesh key={i} position={[x, 0.5 + (EAVE - 0.2) / 2, z]} material={parts.mats.lacquer} castShadow receiveShadow>
          <cylinderGeometry args={[r * 0.92, r, EAVE - 0.2, 14]} />
        </mesh>
      ))}
      {/* beams */}
      {[D / 2 - 0.2, -D / 2 + 0.2].map((z, i) => (
        <mesh key={i} position={[0, EAVE + 0.1, z]} material={parts.mats.lacquer} castShadow>
          <boxGeometry args={[W, 0.28, 0.24]} />
        </mesh>
      ))}

      {/* back and side walls, dark interior */}
      <mesh position={[0, 0.5 + 1.4, -D / 2 + 0.05]} material={parts.mats.plaster} receiveShadow castShadow>
        <boxGeometry args={[W - 0.2, 2.8, 0.2]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (W / 2 - 0.1), 0.5 + 1.4, 0]} material={parts.mats.plaster} receiveShadow castShadow>
          <boxGeometry args={[0.2, 2.8, D - 0.2]} />
        </mesh>
      ))}
      <mesh position={[0, 2.1, 0]} material={parts.mats.interior}>
        <boxGeometry args={[W - 0.6, 3.2, D - 0.8]} />
      </mesh>
      {/* altar glow in the back hall */}
      <mesh position={[0, 1.2, -D / 2 + 0.7]} material={parts.mats.altar}>
        <boxGeometry args={[2.6, 1.3, 0.6]} />
      </mesh>
      <pointLight position={[0, 2, -D / 2 + 1.8]} color="#ff9a4a" intensity={6} distance={9} decay={2} />

      {/* horizontal plaque */}
      <mesh position={[0, EAVE - 0.35, D / 2 - 0.05]} material={parts.mats.plaque}>
        <planeGeometry args={[2.4, 0.6]} />
      </mesh>

      {/* roof */}
      <mesh geometry={parts.roof} material={parts.mats.tiles} castShadow receiveShadow />
      <mesh geometry={parts.roof} material={parts.mats.under} position={[0, -0.14, 0]} />
      {parts.eaves.map((c, i) => (
        <mesh key={i} material={parts.mats.ridge} castShadow>
          <tubeGeometry args={[c, 64, 0.09, 6, false]} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={parts.gable} position={[s * (W / 2 - 0.05), 0, 0]} material={parts.mats.plaster} castShadow receiveShadow />
      ))}
      <mesh material={parts.mats.ridge} castShadow>
        <tubeGeometry args={[parts.ridge, 96, 0.17, 8, false]} />
      </mesh>
      {parts.hooks.map((c, i) => (
        <mesh key={i} material={parts.mats.ridge} castShadow>
          <tubeGeometry args={[c, 24, 0.1, 6, false]} />
        </mesh>
      ))}
      {/* lưỡng long chầu nguyệt */}
      <mesh position={[0, RIDGE + 0.75, 0]} material={parts.mats.pearl}>
        <sphereGeometry args={[0.32, 24, 16]} />
      </mesh>
      {parts.dragons.map((c, i) => (
        <mesh key={i} material={parts.mats.dragon} castShadow>
          <tubeGeometry args={[c, 48, 0.09, 6, false]} />
        </mesh>
      ))}
    </group>
  )
}

export const DINH_SIZE = { W, D, EAVE, RIDGE }
