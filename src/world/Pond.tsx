import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Reflector } from 'three/examples/jsm/objects/Reflector.js'
import * as THREE from 'three'
import { cinema } from '../cinema/director'
import { mulberry32 } from '../lib/noise'
import { makeCanvas, toTexture } from '../lib/textures'
import { useSceneStore } from '../store/useSceneStore'

export const POND = { x: 1, z: 24.5, rx: 12, rz: 7 }

function rippleTexture() {
  const rnd = mulberry32(151)
  const { c, ctx } = makeCanvas(256, 256)
  ctx.fillStyle = '#808080'
  ctx.fillRect(0, 0, 256, 256)
  ctx.filter = 'blur(3px)'
  for (let i = 0; i < 160; i++) {
    ctx.strokeStyle = `rgba(${rnd() > 0.5 ? 255 : 0},${rnd() > 0.5 ? 255 : 0},${rnd() > 0.5 ? 255 : 0},0.25)`
    ctx.lineWidth = 2 + rnd() * 4
    ctx.beginPath()
    ctx.ellipse(rnd() * 256, rnd() * 256, 10 + rnd() * 40, 3 + rnd() * 6, 0, 0, Math.PI * 2)
    ctx.stroke()
  }
  const t = toTexture(c, false, 3)
  return t
}

/**
 * Ao làng — the village pond. A blurred planar reflection (drei
 * MeshReflectorMaterial) mirrors the full moon and every lantern on the bank;
 * a slow ripple map breaks the reflection into shimmering streaks.
 */
export function Pond() {
  const quality = useSceneStore((s) => s.quality)
  const ripple = useMemo(() => rippleTexture(), [])
  const water = useRef<THREE.Group>(null!)
  const lotus = useMemo(() => {
    const rnd = mulberry32(163)
    return Array.from({ length: 22 }, () => {
      const a = rnd() * Math.PI * 2
      const r = 0.55 + rnd() * 0.4
      return {
        x: POND.x + Math.cos(a) * POND.rx * r,
        z: POND.z + Math.sin(a) * POND.rz * r,
        s: 0.35 + rnd() * 0.35,
        rot: rnd() * Math.PI * 2,
      }
    })
  }, [])
  const lotusGeo = useMemo(() => new THREE.CircleGeometry(1, 20, 0.25, Math.PI * 2 - 0.5), [])
  const lotusMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1c3016', roughness: 0.95, side: THREE.DoubleSide }), [])
  const reeds = useMemo(() => {
    const rnd = mulberry32(171)
    const geos: { x: number; z: number; h: number; lean: number; rot: number }[] = []
    for (let i = 0; i < 160; i++) {
      const a = rnd() * Math.PI * 2
      const r = 1.0 + rnd() * 0.12
      geos.push({ x: POND.x + Math.cos(a) * POND.rx * r, z: POND.z + Math.sin(a) * POND.rz * r, h: 0.6 + rnd() * 0.9, lean: (rnd() - 0.5) * 0.4, rot: rnd() * 6 })
    }
    return geos
  }, [])

  useFrame(() => {
    // skip the (expensive) reflection render while the pond is off-screen
    water.current.visible = cinema.p > 1.6
  })

  return (
    <group>
      {/* muddy bank */}
      <mesh rotation-x={-Math.PI / 2} position={[POND.x, 0.02, POND.z]} scale={[POND.rx + 1.2, POND.rz + 1.2, 1]} receiveShadow>
        <circleGeometry args={[1, 64]} />
        <meshStandardMaterial color="#1e1a14" roughness={1} />
      </mesh>
      <group ref={water}>
        <MoonWater quality={quality} ripple={ripple} />
      </group>
      {lotus.map((l, i) => (
        <mesh key={i} geometry={lotusGeo} material={lotusMat} rotation={[-Math.PI / 2, 0, l.rot]} position={[l.x, 0.05, l.z]} scale={l.s} receiveShadow />
      ))}
      <Reeds reeds={reeds} />
    </group>
  )
}

function Reeds({ reeds }: { reeds: { x: number; z: number; h: number; lean: number; rot: number }[] }) {
  const ref = useRef<THREE.InstancedMesh>(null!)
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    reeds.forEach((r, i) => {
      q.setFromEuler(new THREE.Euler(r.lean, r.rot, r.lean * 0.5))
      m.compose(new THREE.Vector3(r.x, r.h / 2, r.z), q, new THREE.Vector3(1, r.h, 1))
      ref.current.setMatrixAt(i, m)
    })
    ref.current.instanceMatrix.needsUpdate = true
    ref.current.computeBoundingSphere()
  }, [reeds])
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, reeds.length]} castShadow>
      <cylinderGeometry args={[0.004, 0.012, 1, 3]} />
      <meshStandardMaterial color="#39401f" roughness={0.9} />
    </instancedMesh>
  )
}

/**
 * Moonlit water: a planar Reflector with a custom shader. The mirrored image is
 * sampled several times along the vertical, so bright sources (moon, lanterns)
 * stretch into the long shimmering streaks you see on a real pond; a scrolling
 * ripple map wobbles them, and a Fresnel term keeps the water dark underfoot.
 */
function MoonWater({ quality, ripple }: { quality: string; ripple: THREE.Texture }) {
  const reflector = useMemo(() => {
    const res = quality === 'high' ? 1024 : 512
    const geo = new THREE.CircleGeometry(1, 96)
    const r = new Reflector(geo, {
      textureWidth: res,
      textureHeight: res,
      clipBias: 0.003,
      shader: {
        name: 'MoonWater',
        uniforms: {
          color: { value: new THREE.Color('#9fb4d8') },
          tDiffuse: { value: null },
          textureMatrix: { value: null },
          tRipple: { value: ripple },
          uTime: { value: 0 },
          uDeep: { value: new THREE.Color('#02050c') },
        },
        vertexShader: /* glsl */ `
          uniform mat4 textureMatrix;
          varying vec4 vUv;
          varying vec2 vLocal;
          varying vec3 vWorld;
          void main() {
            vUv = textureMatrix * vec4(position, 1.0);
            vLocal = position.xy;
            vec4 w = modelMatrix * vec4(position, 1.0);
            vWorld = w.xyz;
            gl_Position = projectionMatrix * viewMatrix * w;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 color;
          uniform vec3 uDeep;
          uniform sampler2D tDiffuse;
          uniform sampler2D tRipple;
          uniform float uTime;
          varying vec4 vUv;
          varying vec2 vLocal;
          varying vec3 vWorld;
          void main() {
            vec2 rp = vWorld.xz * 0.12;
            vec2 n1 = texture2D(tRipple, rp + vec2(uTime * 0.012, uTime * 0.007)).rg - 0.5;
            vec2 n2 = texture2D(tRipple, rp * 2.3 - vec2(uTime * 0.009, -uTime * 0.013)).rg - 0.5;
            vec2 n = (n1 + n2 * 0.6);
            vec4 uv = vUv;
            uv.x += n.x * 0.035 * uv.w;
            uv.y += n.y * 0.012 * uv.w;
            // vertical streak: gather along the reflected vertical
            vec3 acc = vec3(0.0);
            float wsum = 0.0;
            for (int i = -4; i <= 4; i++) {
              float fi = float(i);
              float w = exp(-fi * fi * 0.12);
              vec4 o = uv;
              o.y += fi * 0.012 * uv.w;
              acc += texture2DProj(tDiffuse, o).rgb * w;
              wsum += w;
            }
            vec3 refl = acc / wsum;
            vec3 viewDir = normalize(cameraPosition - vWorld);
            float fresnel = 0.25 + 0.75 * pow(1.0 - max(viewDir.y, 0.0), 4.0);
            vec3 col = mix(uDeep, refl * color, fresnel);
            // soft fade at the bank
            float edge = smoothstep(1.0, 0.86, length(vLocal));
            gl_FragColor = vec4(mix(uDeep * 0.6, col, edge), 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      },
    })
    r.rotation.x = -Math.PI / 2
    r.position.set(POND.x, 0.04, POND.z)
    r.scale.set(POND.rx, POND.rz, 1)
    return r
  }, [quality, ripple])

  useFrame(({ clock }) => {
    ;(reflector.material as THREE.ShaderMaterial).uniforms.uTime.value = clock.elapsedTime
  })

  return <primitive object={reflector} />
}
