import * as THREE from 'three'
import { bambooTextures, cellophaneNormal, haloTexture, lanternGlow } from '../lib/textures'

/** Base emissive strength of lantern paper (flicker modulates around it). */
export const PAPER_GLOW = 1.05

/**
 * Coloured cellophane ("giấy kính") stretched over the lantern frame.
 * transmission → the frame and candle are visible through the paper;
 * emissive (with a radial map) → the paper glows from within, brightest near the candle.
 */
export function makeCellophane(color: THREE.ColorRepresentation, glow: THREE.ColorRepresentation) {
  return new THREE.MeshPhysicalMaterial({
    color,
    emissive: glow,
    emissiveMap: lanternGlow(),
    emissiveIntensity: PAPER_GLOW,
    transmission: 0.55,
    thickness: 0.04,
    attenuationColor: new THREE.Color(glow),
    attenuationDistance: 0.35,
    ior: 1.45,
    roughness: 0.32,
    metalness: 0,
    clearcoat: 0.7,
    clearcoatRoughness: 0.22,
    normalMap: cellophaneNormal(),
    normalScale: new THREE.Vector2(0.35, 0.35),
    side: THREE.DoubleSide,
  })
}

let bamboo: THREE.MeshStandardMaterial | null = null
export function bambooMaterial() {
  if (!bamboo) {
    const map = bambooTextures()
    bamboo = new THREE.MeshStandardMaterial({
      color: '#e8cf9a',
      map,
      roughness: 0.72,
      metalness: 0,
      bumpMap: map,
      bumpScale: 0.4,
    })
  }
  return bamboo
}

/** Thin coloured paper for tassels (tua rua). */
export function tasselMaterial(color: THREE.ColorRepresentation) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.85,
    emissive: color,
    emissiveIntensity: 0.12,
    side: THREE.DoubleSide,
  })
}

export function flameMaterial() {
  return new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 2.4, 1.0), toneMapped: false })
}

export function haloMaterial(color: THREE.ColorRepresentation, opacity: number) {
  return new THREE.MeshBasicMaterial({
    map: haloTexture(),
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  })
}

/**
 * Point-light shadows (cube maps) must ignore the paper, otherwise the candle
 * light would be trapped inside the lantern. Directional/spot shadows still use
 * the normal depth path, so the lantern body casts a proper shadow at sunset.
 */
export const skipPointShadowMaterial = new THREE.ShaderMaterial({
  vertexShader: 'void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: 'void main(){ gl_FragColor = vec4(1.0); discard; }',
})
