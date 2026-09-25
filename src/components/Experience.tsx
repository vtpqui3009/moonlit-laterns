import { Canvas, useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { PerformanceMonitor, Stats } from '@react-three/drei'
import * as THREE from 'three'
import { CameraRig } from '../cinema/CameraRig'
import { Captions } from '../cinema/Captions'
import { LightingRig } from '../cinema/LightingRig'
import { PostFX } from '../cinema/PostFX'
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

/** Transmission (lantern cellophane) renders an extra scene pass; halve it on the low tier. */
function RendererTier() {
  const gl = useThree((s) => s.gl)
  const quality = useSceneStore((s) => s.quality)
  useEffect(() => {
    gl.transmissionResolutionScale = quality === 'high' ? 1 : 0.5
  }, [gl, quality])
  return null
}

const showStats = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('stats')

export default function Experience() {
  const quality = useSceneStore((s) => s.quality)
  const setQuality = useSceneStore((s) => s.setQuality)
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
        {/* if the frame rate stays low on the high tier, drop to the low tier once */}
        <PerformanceMonitor
          flipflops={1}
          onDecline={() => {
            if (useSceneStore.getState().quality === 'high') setQuality('low')
          }}
        />
        {showStats && <Stats />}
        <RendererTier />
        <ResponsiveLens />
        <CameraRig />
        <LightingRig />
        <World />
        <Captions />
        <PostFX />
      </Canvas>
    </div>
  )
}
