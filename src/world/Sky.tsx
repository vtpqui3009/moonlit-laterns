import { useMemo } from 'react'
import * as THREE from 'three'

export interface SkyColors {
  zenith: THREE.ColorRepresentation
  mid: THREE.ColorRepresentation
  horizon: THREE.ColorRepresentation
  /** Colour of the glow where the sun has just set. */
  sunGlow: THREE.ColorRepresentation
}

export const DUSK_SKY: SkyColors = {
  zenith: '#060a24',
  mid: '#1c2a5e',
  horizon: '#5a3f6e',
  sunGlow: '#ff8a4a',
}

/**
 * Gradient sky dome: deep indigo zenith → violet horizon, with a warm afterglow
 * toward the set sun. Uniforms are exposed so later stages can blend it to full night.
 */
export function Sky({
  colors = DUSK_SKY,
  sunDirection = [1, 0.05, -0.2] as [number, number, number],
  glowStrength = 1,
}: {
  colors?: SkyColors
  sunDirection?: [number, number, number]
  glowStrength?: number
}) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uZenith: { value: new THREE.Color(colors.zenith) },
          uMid: { value: new THREE.Color(colors.mid) },
          uHorizon: { value: new THREE.Color(colors.horizon) },
          uSunGlow: { value: new THREE.Color(colors.sunGlow) },
          uSunDir: { value: new THREE.Vector3(...sunDirection).normalize() },
          uGlow: { value: glowStrength },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            gl_Position = p.xyww; // always at the far plane
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uZenith, uMid, uHorizon, uSunGlow, uSunDir;
          uniform float uGlow;
          varying vec3 vDir;
          void main() {
            float h = clamp(vDir.y, -0.2, 1.0);
            vec3 col = mix(uHorizon, uMid, smoothstep(0.0, 0.22, h));
            col = mix(col, uZenith, smoothstep(0.18, 0.75, h));
            float sun = max(dot(normalize(vec3(vDir.x, 0.0, vDir.z)), normalize(vec3(uSunDir.x, 0.0, uSunDir.z))), 0.0);
            float band = exp(-max(h, 0.0) * 9.0);
            col += uSunGlow * pow(sun, 6.0) * band * 0.9 * uGlow;
            col += uSunGlow * pow(sun, 1.5) * band * 0.15 * uGlow;
            // below the horizon fade into the ground haze
            col = mix(col, uHorizon * 0.35, smoothstep(0.0, -0.15, h));
            gl_FragColor = vec4(col, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  return (
    <mesh material={material} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[400, 48, 24]} />
    </mesh>
  )
}
