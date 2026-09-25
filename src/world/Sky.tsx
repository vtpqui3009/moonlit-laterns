import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { cinema, moonDirection, nightness, SUN_DIRECTION } from '../cinema/director'

const DUSK = { zenith: '#0c1640', mid: '#34407a', horizon: '#b0708a', antiTwilight: '#e89aa8', sunGlow: '#ff8a4a' }
const NIGHT = { zenith: '#02040f', mid: '#08112e', horizon: '#1a2450', antiTwilight: '#1a2450', sunGlow: '#1a1a38' }

/**
 * Sky dome driven by the playhead: sunset afterglow in the west, the pink
 * "Belt of Venus" band in the east where the moon rises, sinking into
 * indigo night, with a soft moon glow in the sky around the moon.
 */
export function Sky() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uZenith: { value: new THREE.Color() },
          uMid: { value: new THREE.Color() },
          uHorizon: { value: new THREE.Color() },
          uAnti: { value: new THREE.Color() },
          uSunGlow: { value: new THREE.Color() },
          uSunDir: { value: SUN_DIRECTION.clone() },
          uMoonDir: { value: new THREE.Vector3() },
          uMoonGlow: { value: 0 },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            gl_Position = p.xyww;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uZenith, uMid, uHorizon, uAnti, uSunGlow, uSunDir, uMoonDir;
          uniform float uMoonGlow;
          varying vec3 vDir;
          void main() {
            vec3 d = normalize(vDir);
            float h = clamp(d.y, -0.2, 1.0);
            vec3 col = mix(uHorizon, uMid, smoothstep(0.0, 0.25, h));
            col = mix(col, uZenith, smoothstep(0.2, 0.8, h));
            vec2 horiz = normalize(d.xz);
            float sun = max(dot(horiz, normalize(uSunDir.xz)), 0.0);
            float band = exp(-max(h, 0.0) * 8.0);
            col += uSunGlow * (pow(sun, 8.0) * 0.9 + pow(sun, 2.0) * 0.2) * band;
            // anti-twilight arch opposite the sun
            float anti = max(dot(horiz, -normalize(uSunDir.xz)), 0.0);
            col = mix(col, uAnti, pow(anti, 2.0) * exp(-abs(h - 0.08) * 14.0) * 0.55);
            // moonlit sky
            float m = max(dot(d, normalize(uMoonDir)), 0.0);
            col += vec3(1.0, 0.92, 0.75) * (pow(m, 60.0) * 0.35 + pow(m, 8.0) * 0.06) * uMoonGlow;
            col = mix(col, uHorizon * 0.4, smoothstep(0.0, -0.12, h));
            gl_FragColor = vec4(col, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      }),
    [],
  )

  const a = useMemo(() => new THREE.Color(), [])
  const b = useMemo(() => new THREE.Color(), [])
  useFrame(() => {
    const n = nightness(cinema.p)
    const u = material.uniforms
    const mix = (key: keyof typeof DUSK, target: THREE.Color) => target.copy(a.set(DUSK[key])).lerp(b.set(NIGHT[key]), n)
    mix('zenith', u.uZenith.value)
    mix('mid', u.uMid.value)
    mix('horizon', u.uHorizon.value)
    mix('antiTwilight', u.uAnti.value)
    mix('sunGlow', u.uSunGlow.value)
    moonDirection(cinema.p, u.uMoonDir.value)
    u.uMoonGlow.value = 0.4 + n * 0.8
  })

  return (
    <mesh material={material} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[450, 48, 24]} />
    </mesh>
  )
}
