import { Environment, Stars } from '@react-three/drei'
import { SafeBoundary } from '../components/SafeBoundary'
import { useSceneStore } from '../store/useSceneStore'
import HDRI from './hdriUrl'
import { Moon } from './Moon'
import { Sky } from './Sky'

/**
 * Night image-based lighting + sky. The HDRI ("Dikhololo Night", Poly Haven,
 * CC0) is used only for reflections/IBL; the visible sky is our own dome,
 * star field and moon, all driven by the playhead.
 */
export function NightEnvironment() {
  const quality = useSceneStore((s) => s.quality)
  const still = useSceneStore((s) => s.reducedMotion)
  return (
    <>
      <SafeBoundary label="HDRI" fallback={null}>
        <Environment files={HDRI} environmentIntensity={0.4} environmentRotation={[0, Math.PI * 0.6, 0]} />
      </SafeBoundary>
      <Sky />
      <Stars radius={280} depth={60} count={quality === 'high' ? 5000 : 2000} factor={6} saturation={0.15} fade speed={still ? 0 : 0.3} />
      <Moon />
    </>
  )
}
