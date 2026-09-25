import { Canvas, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useRef } from 'react'
import { PerformanceMonitor, Stats, useProgress } from '@react-three/drei'
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

/**
 * Once every asset is in, compile all shaders up front (with the final light
 * count) so the first seconds of the film don't stutter, then lift the veil.
 */
function Warmup() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const { active, progress } = useProgress()
  const started = useRef(false)
  useEffect(() => {
    const finish = () => useSceneStore.getState().set({ ready: true })
    const safety = setTimeout(finish, 20000)
    if (started.current || active || progress < 100) return () => clearTimeout(safety)
    started.current = true
    requestAnimationFrame(() => {
      gl.compileAsync(scene, camera)
        .catch(() => undefined)
        .finally(() => requestAnimationFrame(finish))
    })
    return () => clearTimeout(safety)
  }, [active, progress, gl, scene, camera])
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
        dpr={quality === 'high' ? [1, 1.5] : 1}
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
        {/* One boundary for the whole world: nothing renders until the HDRI has
            loaded, so every shader compiles once, already with the environment map
            (otherwise they compile without it, then all over again). Warmup sits
            inside so it runs right after the world has mounted. */}
        <Suspense fallback={null}>
          <World />
          <Captions />
          <Warmup />
        </Suspense>
        <PostFX />
      </Canvas>
    </div>
  )
}
