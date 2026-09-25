import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  Bloom,
  BrightnessContrast,
  ChromaticAberration,
  DepthOfField,
  EffectComposer,
  Noise,
  ToneMapping,
  Vignette,
} from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode, type BloomEffect, type DepthOfFieldEffect } from 'postprocessing'
import * as THREE from 'three'
import { useSceneStore } from '../store/useSceneStore'
import { blendShots, cinema, nightness } from './director'
import { SplitToneEffect } from './SplitToneEffect'

/** Per-shot lens & grade: [bloom intensity, DOF sharp range (m), bokeh scale]. */
const LENS: [number, number, number][] = [
  [0.75, 14, 2.2], // wide dusk shot
  [0.85, 2.4, 3.6], // close-up on the feast — shallow focus
  [1.15, 5, 3], // procession at child height
  [1.7, 45, 1.2], // full moon — let it radiate
]

function lerpLens(p: number, k: 0 | 1 | 2) {
  const i = Math.min(Math.floor(p), LENS.length - 2)
  const u = THREE.MathUtils.smoothstep(p - i, 0.15, 0.85)
  return THREE.MathUtils.lerp(LENS[i][k], LENS[i + 1][k], u)
}

/**
 * Cinematic finishing: depth of field that pulls focus to each shot's subject,
 * bloom (strongest on the full moon), ACES tone mapping, split-tone grade,
 * a whisper of chromatic aberration, vignette and very fine film grain.
 * The low tier drops DOF and chromatic aberration.
 */
export function PostFX() {
  const quality = useSceneStore((s) => s.quality)
  const high = quality === 'high'
  const bloom = useRef<BloomEffect>(null!)
  const dof = useRef<DepthOfFieldEffect>(null!)
  const grade = useMemo(() => new SplitToneEffect(), [])
  const focus = useMemo(() => new THREE.Vector3(), [])
  const warm = useMemo(() => ({ dusk: new THREE.Color('#ffa65a'), night: new THREE.Color('#ffb870') }), [])
  const cool = useMemo(() => ({ dusk: new THREE.Color('#6a4a9a'), night: new THREE.Color('#2a4aa0') }), [])
  const caOffset = useMemo(() => new THREE.Vector2(0.0007, 0.0005), [])

  useFrame(() => {
    const p = cinema.p
    const n = nightness(p)
    if (bloom.current) bloom.current.intensity = lerpLens(p, 0)
    if (dof.current) {
      blendShots(p, 'focus', focus)
      dof.current.target = focus
      dof.current.cocMaterial.worldFocusRange = lerpLens(p, 1)
      dof.current.bokehScale = lerpLens(p, 2)
    }
    const u = grade.u
    ;(u.get('uHighlight')!.value as THREE.Color).copy(warm.dusk).lerp(warm.night, n)
    ;(u.get('uShadow')!.value as THREE.Color).copy(cool.dusk).lerp(cool.night, n)
    u.get('uAmount')!.value = 0.22 + n * 0.12
    u.get('uBalance')!.value = -0.1 + n * 0.05
  })

  return (
    <EffectComposer multisampling={high ? 4 : 0}>
      {high && <DepthOfField ref={dof} target={[0, 0, 0]} worldFocusRange={10} bokehScale={2} resolutionScale={0.5} />}
      <Bloom ref={bloom} mipmapBlur luminanceThreshold={0.95} luminanceSmoothing={0.25} intensity={0.9} radius={0.78} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <primitive object={grade} />
      <BrightnessContrast brightness={0.01} contrast={0.06} />
      {high && <ChromaticAberration offset={caOffset} radialModulation modulationOffset={0.35} />}
      <Vignette offset={0.28} darkness={0.62} />
      <Noise premultiply blendFunction={BlendFunction.ADD} opacity={0.06} />
    </EffectComposer>
  )
}
