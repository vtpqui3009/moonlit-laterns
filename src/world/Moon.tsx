import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { cinema, MOON_DISTANCE, moonDirection } from '../cinema/director'
import { haloTexture } from '../lib/textures'
import { haloRing, moonTexture } from './worldTextures'

const RISING = new THREE.Color('#ffae6a')
const HIGH = new THREE.Color('#fff3d6')

/**
 * The moon: a textured disc kept at "infinity" (it follows the camera), with an
 * inner glow, a wide soft corona and the faint 22° halo ring (quầng trăng).
 * Colours are HDR (> 1) so Bloom makes it truly radiant. It rises from an
 * orange disc at the horizon to a white-gold full moon high in the sky.
 */
export function Moon() {
  const group = useRef<THREE.Group>(null!)
  const radius = MOON_DISTANCE * Math.tan(THREE.MathUtils.degToRad(3.2))
  const mats = useMemo(
    () => ({
      disc: new THREE.MeshBasicMaterial({ map: moonTexture(), fog: false, toneMapped: false }),
      glow: new THREE.MeshBasicMaterial({
        map: haloTexture(),
        fog: false,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
      corona: new THREE.MeshBasicMaterial({
        map: haloTexture(),
        fog: false,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
      ring: new THREE.MeshBasicMaterial({
        map: haloRing(),
        fog: false,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    }),
    [],
  )
  const dir = useMemo(() => new THREE.Vector3(), [])
  const tint = useMemo(() => new THREE.Color(), [])

  useFrame(({ camera }) => {
    const p = cinema.p
    moonDirection(p, dir)
    group.current.position.copy(camera.position).addScaledVector(dir, MOON_DISTANCE)
    group.current.lookAt(camera.position)
    const rise = THREE.MathUtils.smoothstep(p, 0, 2.4)
    tint.copy(RISING).lerp(HIGH, rise)
    // brighter as the sky darkens; near the horizon it is dimmed by haze
    const lum = 1.2 + rise * 2.6
    mats.disc.color.copy(tint).multiplyScalar(lum)
    mats.glow.color.copy(tint).multiplyScalar(0.5 + rise * 0.9)
    mats.corona.color.copy(tint).multiplyScalar(0.05 + rise * 0.1)
    mats.ring.opacity = rise * 0.16
    // near the horizon the moon looks bigger (moon illusion)
    group.current.scale.setScalar(1.35 - rise * 0.35)
  })

  return (
    <group ref={group} renderOrder={-0.5}>
      <mesh material={mats.corona} scale={radius * 14}>
        <planeGeometry />
      </mesh>
      <mesh material={mats.glow} scale={radius * 4.2}>
        <planeGeometry />
      </mesh>
      <mesh material={mats.ring} scale={(MOON_DISTANCE * Math.tan(THREE.MathUtils.degToRad(22)) * 2) / 0.8}>
        <planeGeometry />
      </mesh>
      <mesh material={mats.disc} position={[0, 0, 0.1]}>
        <circleGeometry args={[radius, 64]} />
      </mesh>
    </group>
  )
}
