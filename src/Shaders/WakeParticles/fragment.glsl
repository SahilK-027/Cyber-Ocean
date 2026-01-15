uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform float uTime;

varying float vLife;
varying float vSize;

void main() {
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center);

  if(dist > 0.5)
    discard;

  float core = exp(-dist * 6.0);
  float glow = exp(-dist * 3.0);
  float alpha = mix(glow, core, 0.5);

  float lifeFade = smoothstep(0.0, 0.15, vLife) * smoothstep(1.0, 0.4, vLife);
  alpha *= lifeFade * 0.8;

  vec3 color;
  if(vLife < 0.5) {
    color = mix(uColor1, uColor2, vLife * 2.0);
  } else {
    color = mix(uColor2, uColor3, (vLife - 0.5) * 2.0);
  }

  float shimmer = sin(uTime * 8.0 + vLife * 20.0) * 0.1 + 0.9;

  color *= 1.8 * shimmer;

  gl_FragColor = vec4(color, alpha);
}
