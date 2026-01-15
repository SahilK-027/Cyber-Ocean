uniform vec3 uColor;
uniform float uTime;

varying float vAlpha;
varying float vParticleType;

void main() {
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);

  if(dist > 0.5) {
    discard;
  }

  float glow = smoothstep(0.5, 0.0, dist);
  float alpha = glow * vAlpha;

  float shimmer = sin(uTime * 2.0 + vParticleType * 100.0) * 0.15 + 0.85;
  alpha *= shimmer;

  gl_FragColor = vec4(uColor, alpha);
}
