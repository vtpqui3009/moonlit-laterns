import { Environment, Sparkles, Stars } from '@react-three/drei'
import { useSceneStore } from '../store/useSceneStore'
import { Sky } from './Sky'

const HDRI = `${import.meta.env.BASE_URL}hdri/night_1k.exr`

/**
 * Night-time image based lighting + sky.
 * The HDRI ("Dikhololo Night", Poly Haven, CC0) is used only for reflections/IBL,
 * dimmed and tinted blue; the visible sky is our own gradient dome + star field.
 */
export function NightEnvironment({ sunDirection }: { sunDirection: [number, number, number] }) {
  const quality = useSceneStore((s) => s.quality)
  return (
    <>
      <Environment files={HDRI} environmentIntensity={0.35} environmentRotation={[0, Math.PI * 0.6, 0]} />
      <Sky sunDirection={sunDirection} />
      <Stars radius={180} depth={60} count={quality === 'high' ? 4000 : 1500} factor={5} saturation={0.2} fade speed={0.4} />
      {/* fireflies / drifting sparks */}
      <Sparkles
        count={quality === 'high' ? 60 : 24}
        scale={[7, 2.5, 5]}
        position={[0, 1.4, 0]}
        size={2.2}
        speed={0.25}
        opacity={0.8}
        color="#ffc27a"
        noise={1.2}
      />
    </>
  )
}
