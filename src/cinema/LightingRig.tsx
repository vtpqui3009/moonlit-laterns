import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useSceneStore } from '../store/useSceneStore'
import { blendShots, cinema, moonDirection, nightness, SUN_DIRECTION } from './director'

const c = (hex: string) => new THREE.Color(hex)
const PALETTE = {
  hemiSky: [c('#7a80c0'), c('#1c2a60')],
  hemiGround: [c('#5a3220'), c('#0a0a14')],
  ambient: [c('#3a3060'), c('#101c44')],
  fog: [c('#6a5078'), c('#0b1330')],
}

/**
 * Time passes as you scroll: the low orange sun fades out, the hemisphere and
 * fog sink from dusky violet into deep blue, and the moon light grows into the
 * main source. Directional shadow cameras follow the current shot's focus so
 * shadows stay sharp wherever the camera is.
 */
export function LightingRig() {
  const quality = useSceneStore((s) => s.quality)
  const scene = useThree((s) => s.scene)
  const sun = useRef<THREE.DirectionalLight>(null!)
  const moon = useRef<THREE.DirectionalLight>(null!)
  const hemi = useRef<THREE.HemisphereLight>(null!)
  const ambient = useRef<THREE.AmbientLight>(null!)
  const fog = useMemo(() => new THREE.Fog('#6a5078', 14, 95), [])
  const v = useMemo(() => ({ focus: new THREE.Vector3(), dir: new THREE.Vector3() }), [])
  const shadowSize = quality === 'high' ? 2048 : 1024

  useEffect(() => {
    scene.fog = fog
    scene.add(sun.current.target, moon.current.target)
    return () => {
      scene.fog = null
    }
  }, [scene, fog])

  useFrame(() => {
    const p = cinema.p
    const n = nightness(p)
    blendShots(p, 'focus', v.focus)

    // sunset key light
    const sunK = 1 - THREE.MathUtils.smoothstep(p, 0.25, 1.3)
    sun.current.intensity = 2.6 * sunK
    sun.current.position.copy(v.focus).addScaledVector(SUN_DIRECTION, 45)
    sun.current.target.position.copy(v.focus)
    sun.current.shadow.autoUpdate = sunK > 0.01

    // moon key light — grows into the dominant source
    moonDirection(p, v.dir)
    moon.current.intensity = 0.12 + 1.35 * THREE.MathUtils.smoothstep(p, 0.6, 3)
    moon.current.position.copy(v.focus).addScaledVector(v.dir, 60)
    moon.current.target.position.copy(v.focus)
    const wide = THREE.MathUtils.smoothstep(p, 2, 3)
    const half = THREE.MathUtils.lerp(12, 26, wide)
    const cam = moon.current.shadow.camera
    if (cam.right !== half) {
      cam.left = -half
      cam.right = half
      cam.top = half
      cam.bottom = -half
      cam.updateProjectionMatrix()
    }

    hemi.current.color.copy(PALETTE.hemiSky[0]).lerp(PALETTE.hemiSky[1], n)
    hemi.current.groundColor.copy(PALETTE.hemiGround[0]).lerp(PALETTE.hemiGround[1], n)
    hemi.current.intensity = THREE.MathUtils.lerp(0.9, 0.35, n)
    ambient.current.color.copy(PALETTE.ambient[0]).lerp(PALETTE.ambient[1], n)
    ambient.current.intensity = THREE.MathUtils.lerp(0.25, 0.18, n)
    fog.color.copy(PALETTE.fog[0]).lerp(PALETTE.fog[1], n)
    fog.near = THREE.MathUtils.lerp(16, 22, wide)
    fog.far = THREE.MathUtils.lerp(95, 120, wide)
    scene.environmentIntensity = THREE.MathUtils.lerp(0.55, 0.3, n)
  })

  return (
    <>
      <directionalLight
        ref={sun}
        color="#ff9550"
        castShadow
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-radius={5}
        shadow-bias={-0.0005}
        shadow-normalBias={0.04}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-camera-near={1}
        shadow-camera-far={110}
      />
      <directionalLight
        ref={moon}
        color="#ffeccc"
        castShadow
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-radius={7}
        shadow-bias={-0.0006}
        shadow-normalBias={0.05}
        shadow-camera-near={1}
        shadow-camera-far={140}
      />
      <hemisphereLight ref={hemi} />
      <ambientLight ref={ambient} />
    </>
  )
}
