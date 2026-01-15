uniform sampler2D tDiffuse;
uniform float uTime;
uniform float uGlowIntensity;
uniform float uAberration;
uniform vec2 uMouseInfluence;
uniform float uGrainIntensity;
uniform float uVignetteStrength;

varying vec2 vUv;

float random(vec2 co) {
  return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 direction = vUv - 0.5;
  float dist = length(direction);

  float aberrationAmount = uAberration + length(uMouseInfluence) * 0.002;
  vec2 offset = direction * dist * aberrationAmount;

  float r = texture2D(tDiffuse, vUv + offset).r;
  vec2 ga = texture2D(tDiffuse, vUv).ga;
  float b = texture2D(tDiffuse, vUv - offset).b;

  vec3 color = vec3(r, ga.x, b);

  float luminance = dot(color, vec3(0.299, 0.587, 0.114));
  color += color * luminance * uGlowIntensity;

  vec2 uv = vUv * (1.0 - vUv.yx);
  float vignette = uv.x * uv.y * 15.0;
  vignette = pow(vignette, uVignetteStrength);
  color *= vignette;

  float grain = random(vUv + fract(uTime)) * 2.0 - 1.0;
  color += grain * uGrainIntensity;

  gl_FragColor = vec4(color, ga.y);
}
