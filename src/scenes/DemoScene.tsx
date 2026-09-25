import { ContactShadows } from '@react-three/drei'
import { Suspense } from 'react'
import { ModelSlot } from '../components/ModelSlot'
import { StarLantern } from '../lanterns/StarLantern'
import { BambooPole } from '../world/BambooPole'
import { Ground } from '../world/Ground'
import { LimeWall } from '../world/LimeWall'
import { LowTable } from '../world/LowTable'
import { NightEnvironment } from '../world/NightEnvironment'

/** Direction the last sunlight comes from: low, from the right, raking long shadows toward the wall. */
const SUN_DIR: [number, number, number] = [5.5, 1.35, 2.2]

/**
 * Step 1 demo: a single đèn ông sao hanging from a bamboo pole over a low table
 * in a tiled courtyard at dusk — to judge materials, light and soft shadows.
 */
export function DemoScene() {
  return (
    <>
      <color attach="background" args={['#070b20']} />
      <fog attach="fog" args={['#2b2046', 5, 20]} />

      {/* Last warm light of sunset: low-angle key light with soft shadows */}
      <directionalLight
        position={SUN_DIR}
        color="#ff9a5a"
        intensity={2.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-radius={5}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
      />
      {/* Cool twilight fill from the sky, warm bounce from the ground */}
      <hemisphereLight args={['#4a5ca8', '#3a2014', 0.55]} />
      <ambientLight color="#1d2a5a" intensity={0.15} />

      <Suspense fallback={null}>
        <NightEnvironment sunDirection={SUN_DIR} />
      </Suspense>

      <Ground size={80} />
      <LimeWall position={[0.4, 0, -2.3]} />
      <LowTable position={[0, 0, 0.1]} />
      <BambooPole position={[0.95, 0, -0.9]} tip={[-0.95, 2.05, 0.9]} />

      {/* Hero lantern — overridable with public/models/ong-sao.glb */}
      <ModelSlot id="ong-sao" position={[0, 2.05, 0]} fallback={<StarLantern radius={0.3} stringLength={0.22} seed={1} />} />

      {/* Two dimmer lanterns further back for depth (no shadow-casting lights) */}
      <ModelSlot
        id="ong-sao"
        position={[-1.9, 2.25, -1.6]}
        fallback={<StarLantern radius={0.22} stringLength={0.3} paperColor="#e8b21a" glowColor="#ff9a2a" lightColor="#ffb060" intensity={1.2} castLightShadow={false} seed={2} />}
      />
      <ModelSlot
        id="ong-sao"
        position={[2.1, 2.15, -1.7]}
        fallback={<StarLantern radius={0.2} stringLength={0.26} paperColor="#2a8a3e" glowColor="#8aff5a" lightColor="#c8ff9a" intensity={1} castLightShadow={false} seed={3} />}
      />

      <ContactShadows position={[0, 0.002, 0.1]} scale={4} resolution={512} blur={2.4} far={1.2} opacity={0.55} color="#120806" />
    </>
  )
}
