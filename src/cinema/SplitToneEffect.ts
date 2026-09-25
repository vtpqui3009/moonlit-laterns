import { BlendFunction, Effect } from 'postprocessing'
import * as THREE from 'three'

const fragmentShader = /* glsl */ `
  uniform vec3 uShadow;
  uniform vec3 uHighlight;
  uniform float uBalance;
  uniform float uAmount;
  uniform vec3 uLift;

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec3 c = inputColor.rgb;
    float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
    float w = smoothstep(0.0, 1.0, clamp(l * 1.6 + uBalance, 0.0, 1.0));
    vec3 tint = mix(uShadow, uHighlight, w);
    // soft-light style tint: strongest in the mid-tones, never clips the whites
    vec3 graded = c + (tint - 0.5) * uAmount * (1.0 - abs(2.0 * clamp(l, 0.0, 1.0) - 1.0));
    // lifted, blue-tinted blacks — the "night film stock" look
    graded = graded + uLift * (1.0 - clamp(l * 4.0, 0.0, 1.0));
    outputColor = vec4(max(graded, 0.0), inputColor.a);
  }
`

/**
 * Split-tone colour grading: cool indigo in the shadows, warm lantern-amber in
 * the highlights — the two colours of a Trung Thu night — plus lifted,
 * blue-tinted blacks. Uniforms are animated per shot by the PostFX director.
 */
export class SplitToneEffect extends Effect {
  constructor() {
    super('SplitToneEffect', fragmentShader, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, THREE.Uniform>([
        ['uShadow', new THREE.Uniform(new THREE.Color('#3050a0'))],
        ['uHighlight', new THREE.Uniform(new THREE.Color('#ffb060'))],
        ['uBalance', new THREE.Uniform(0)],
        ['uAmount', new THREE.Uniform(0.3)],
        ['uLift', new THREE.Uniform(new THREE.Color('#050a1a'))],
      ]),
    })
  }
  get u() {
    return this.uniforms as Map<string, THREE.Uniform>
  }
}
