import { Canvas, useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import * as THREE from 'three'
import { CameraRig } from '../cinema/CameraRig'
import { Captions } from '../cinema/Captions'
import { LightingRig } from '../cinema/LightingRig'
import { SHOTS } from '../cinema/director'
import { World } from '../scenes/World'
import { useSceneStore } from '../store/useSceneStore'

/** Widen the lens on portrait screens so each shot's subject stays in frame. */
function ResponsiveLens() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const aspect = useThree((s) => s.size.width / s.size.height)
  useEffect(() => {
    camera.fov = aspect < 0.8 ? 58 : aspect < 1.2 ? 48 : 40
    camera.updateProjectionMatrix()
  }, [aspect, camera])
  return null
}

export function Experience() {
  const quality = useSceneStore((s) => s.quality)
  return (
    <div className="stage">
      <Canvas
        // three r18x removed PCFSoftShadowMap (it now logs a warning and falls back);
        // PCFShadowMap + shadow.radius is the soft-PCF path (Vogel-disk filtering).
        shadows={{ enabled: true, type: THREE.PCFShadowMap }}
        dpr={quality === 'high' ? [1, 2] : [1, 1.5]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.05
          gl.outputColorSpace = THREE.SRGBColorSpace
        }}
        camera={{ position: SHOTS[0].camera, fov: 40, near: 0.05, far: 700 }}
      >
        <ResponsiveLens />
        <CameraRig />
        <LightingRig />
        <World />
        <Captions />
      </Canvas>
    </div>
  )
}
