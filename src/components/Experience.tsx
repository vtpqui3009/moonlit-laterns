import { Canvas, useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { DemoScene } from '../scenes/DemoScene'
import { useSceneStore } from '../store/useSceneStore'

/** Widen the lens on portrait screens so the hero stays in frame. */
function ResponsiveLens() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const aspect = useThree((s) => s.size.width / s.size.height)
  useEffect(() => {
    camera.fov = aspect < 0.8 ? 52 : aspect < 1.2 ? 44 : 38
    camera.updateProjectionMatrix()
  }, [aspect, camera])
  return null
}

export function Experience() {
  const quality = useSceneStore((s) => s.quality)
  return (
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
      camera={{ position: [2.3, 1.55, 3.1], fov: 38, near: 0.05, far: 600 }}
    >
      <ResponsiveLens />
      <DemoScene />
      <OrbitControls
        target={[0, 1.1, 0]}
        enableDamping
        dampingFactor={0.06}
        minDistance={1.4}
        maxDistance={9}
        maxPolarAngle={Math.PI * 0.49}
        enablePan={false}
      />
    </Canvas>
  )
}
