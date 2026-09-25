import { Suspense, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { useAnimations, useGLTF } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import * as THREE from 'three'
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js'
import manifest from 'virtual:model-manifest'
import { SafeBoundary } from './SafeBoundary'

type GroupProps = ThreeElements['group']

export interface ModelSlotProps extends Omit<GroupProps, 'children' | 'id'> {
  /** File id: `public/models/<id>.glb` overrides the procedural fallback. */
  id: string
  /** Procedural model rendered when no .glb is provided (or it fails to load). */
  fallback: ReactNode
  /** Animation clip to play if the .glb has clips (defaults to the first). Changing it crossfades. */
  clip?: string
  /** Uniform scale applied only to the loaded .glb, to match the procedural size. */
  modelScale?: number
}

/**
 * A slot for one "hero" object. Drop a .glb with the matching id into
 * public/models/ and it replaces the procedural model — no code changes.
 */
export function ModelSlot({ id, fallback, clip, modelScale = 1, ...group }: ModelSlotProps) {
  const url = manifest[id]
  return (
    <group {...group}>
      {url ? (
        <SafeBoundary fallback={fallback} label={`ModelSlot models/${id}`}>
          <Suspense fallback={null}>
            <GltfModel url={`${import.meta.env.BASE_URL}${url}`} clip={clip} scale={modelScale} />
          </Suspense>
        </SafeBoundary>
      ) : (
        fallback
      )}
    </group>
  )
}

function GltfModel({ url, clip, scale }: { url: string; clip?: string; scale: number }) {
  const gltf = useGLTF(url)
  // SkeletonUtils.clone keeps skinned meshes working when the same file is used several times.
  const scene = useMemo(() => cloneSkinned(gltf.scene), [gltf.scene])
  const root = useRef<THREE.Group>(null!)
  const { actions, names } = useAnimations(gltf.animations, root)
  const current = useRef<THREE.AnimationAction | null>(null)

  useEffect(() => {
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = true
      mesh.receiveShadow = true
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      for (const m of mats) {
        const std = m as THREE.MeshStandardMaterial
        // emissive parts (lantern paper, lion eyes) should glow; keep them out of point-light shadows
        if (std.emissive && std.emissive.getHex() !== 0 && (std.transparent || (m as THREE.MeshPhysicalMaterial).transmission > 0)) {
          mesh.castShadow = false
        }
      }
    })
  }, [scene])

  // Crossfade between clips when `clip` changes.
  useEffect(() => {
    if (!names.length) return
    const next = actions[clip && actions[clip] ? clip : names[0]]
    if (!next || next === current.current) return
    next.reset().setEffectiveWeight(1).fadeIn(0.6).play()
    current.current?.fadeOut(0.6)
    current.current = next
  }, [actions, names, clip])

  return (
    <group ref={root} scale={scale}>
      <primitive object={scene} />
    </group>
  )
}
