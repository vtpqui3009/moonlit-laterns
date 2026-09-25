import { ContactShadows, Sparkles } from '@react-three/drei'
import { ModelSlot } from '../components/ModelSlot'
import { MamCo } from '../feast/MamCo'
import { chieuCoi } from '../feast/feastTextures'
import { KeoQuanLantern } from '../lanterns/KeoQuanLantern'
import { LanternGarland } from '../lanterns/LanternGarland'
import { LionDance } from '../procession/LionDance'
import { Procession } from '../procession/Procession'
import { FallingLeaves } from '../world/FallingLeaves'
import { FloatingLanterns } from '../world/FloatingLanterns'
import { WishLantern } from '../world/WishLantern'
import { StarLantern } from '../lanterns/StarLantern'
import { useSceneStore } from '../store/useSceneStore'
import { BambooGrove } from '../world/BambooGrove'
import { BambooPole } from '../world/BambooPole'
import { Banyan } from '../world/Banyan'
import { Dinh } from '../world/Dinh'
import { House } from '../world/House'
import { LowTable, TABLE_TOP_HEIGHT } from '../world/LowTable'
import { NightEnvironment } from '../world/NightEnvironment'
import { Pond } from '../world/Pond'
import { Terrain } from '../world/Terrain'

export const TABLE_POS: [number, number, number] = [3.5, 0, 3]

const HOUSES: { p: [number, number, number]; r: number; w?: number }[] = [
  { p: [17, 0, -10], r: -0.35 },
  { p: [-18, 0, 7], r: 1.3, w: 6 },
  { p: [17, 0, 10], r: -1.35 },
  { p: [-9, 0, -23], r: 0.1 },
  { p: [11, 0, -25], r: -0.2, w: 8 },
  { p: [-22, 0, -11], r: 0.9 },
  { p: [24, 0, -3], r: -1.1, w: 6 },
  { p: [-16, 0, 26], r: 2.1 },
  { p: [18, 0, 29], r: -2.3 },
]

function StrawMat() {
  const map = chieuCoi()
  return (
    <mesh rotation-x={-Math.PI / 2} position={[TABLE_POS[0], 0.016, TABLE_POS[2]]} rotation-z={-0.25} receiveShadow>
      <planeGeometry args={[2.4, 1.8]} />
      <meshStandardMaterial map={map} roughness={0.9} />
    </mesh>
  )
}

/** The whole village, built once; the camera travels through it. */
export function World() {
  const quality = useSceneStore((s) => s.quality)
  const still = useSceneStore((s) => s.reducedMotion)
  return (
    <>
      {/* suspends until the HDRI is in, together with the rest of the world (see Experience) */}
      <NightEnvironment />

      <Terrain />
      <ModelSlot id="dinh-lang" position={[0, 0, -9]} fallback={<Dinh />} />
      <ModelSlot id="cay-da" position={[-11.5, 0, -2.5]} fallback={<Banyan />} />
      {HOUSES.map((h, i) => (
        <House key={i} position={h.p} rotation={h.r} width={h.w} />
      ))}
      <BambooGrove radius={48} />
      <Pond />

      {/* Shot 2 — the Mid-Autumn feast in the courtyard */}
      <StrawMat />
      <group position={TABLE_POS} rotation-y={-0.25}>
        <LowTable />
        <ModelSlot id="mam-co" position={[0, TABLE_TOP_HEIGHT + 0.012, 0]} fallback={<MamCo />} />
        <ContactShadows position={[0, TABLE_TOP_HEIGHT + 0.006, 0]} scale={[1.5, 1]} resolution={512} blur={1.6} far={0.3} opacity={0.6} frames={1} color="#200806" />
        <BambooPole position={[0.95, 0, -0.75]} tip={[-0.7, 1.72, 0.75]} />
        <ModelSlot
          id="ong-sao"
          position={[0.25, 1.72, 0]}
          fallback={<StarLantern radius={0.26} stringLength={0.2} seed={1} intensity={2.4} shadowWhen={[0.4, 2.2]} />}
        />
        {/* đèn kéo quân hanging from a second pole on the far side */}
        <BambooPole position={[-1.45, 0, -1.05]} tip={[0.95, 1.6, 0.7]} />
        <mesh position={[-0.5, 1.47, -0.35]}>
          <cylinderGeometry args={[0.003, 0.003, 0.26, 3]} />
          <meshStandardMaterial color="#1a120c" />
        </mesh>
        <ModelSlot id="keo-quan" position={[-0.5, 1.12, -0.35]} fallback={<KeoQuanLantern />} />
      </group>

      {/* Shot 3 — the lantern procession and the lion dance */}
      <Procession />
      <ModelSlot id="dau-lan" position={[-3.7, 0, 7]} rotation-y={-0.35} scale={1.12} fallback={<LionDance />} />
      <FallingLeaves origin={[-8.5, 0, 0]} spread={[8, 7]} top={9} />
      <FloatingLanterns />
      <WishLantern />

      {/* lantern strings over the courtyard */}
      <LanternGarland from={[-6.8, 4.0, -3.4]} to={[-8.5, 4.2, 10.5]} sag={0.9} lights={0} seed={1} />
      <LanternGarland from={[6.8, 4.0, -3.4]} to={[8.5, 4.2, 10.5]} sag={0.9} lights={0} seed={3} />
      <LanternGarland from={[-8.5, 4.2, 10.5]} to={[8.5, 4.2, 10.5]} sag={0.6} spacing={1.7} lights={0} seed={5} />
      {[-8.5, 8.5].map((x) => (
        <mesh key={x} position={[x, 2.15, 10.5]} castShadow>
          <cylinderGeometry args={[0.05, 0.06, 4.3, 8]} />
          <meshStandardMaterial color="#6a5a3a" roughness={0.8} />
        </mesh>
      ))}

      {/* fireflies drifting over the courtyard and the pond */}
      <Sparkles count={quality === 'high' ? 70 : 25} scale={[18, 3, 16]} position={[0, 1.6, 3]} size={3} speed={still ? 0 : 0.25} opacity={0.9} color="#ffcf7a" noise={1.4} />
      <Sparkles count={quality === 'high' ? 50 : 18} scale={[22, 2, 12]} position={[1, 1, 24]} size={3} speed={still ? 0 : 0.2} opacity={0.8} color="#d8ff9a" noise={1} />
    </>
  )
}
