uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;

varying vec2 vUv;
varying vec3 vPosition;

// Noise function for organic underwater movement
float noise(vec2 p) {
 return sin(p.x * 10.0 + uTime * 0.5) * sin(p.y * 10.0 + uTime * 0.3);
}

// Caustics pattern - simulates light refraction through water
float caustics(vec2 uv, float time) {
 vec2 p = uv * 8.0;
  float c = 0.0;
 c += sin(p.x * 2.0 + time * 1.5 + sin(p.y * 3.0 + time * 0.8));
 c += sin(p.y * 3.0 + time * 1.2 + sin(p.x * 2.5 + time * 0.5));
 c += sin((p.x + p.y) * 1.5 + time * 1.0);
 c += sin(length(p - vec2(sin(time * 0.3) * 2.0, cos(time * 0.4) * 2.0)) * 3.0 - time * 2.0);
  return c * 0.25 + 0.5;
}

void main() {
 vec2 uv = vUv;
  // Add wavy distortion for underwater feel
 float wave1 = sin(uv.x * 10.0 + uTime * 0.8) * 0.02;
 float wave2 = cos(uv.y * 8.0 + uTime * 0.6) * 0.02;
 vec2 distortedUv = uv + vec2(wave1, wave2);
  // Distance from center for radial effects
 vec2 center = vec2(0.5, 0.5);
 float dist = length(distortedUv - center);
  // Create flowing caustics pattern
 float causticsPattern = caustics(distortedUv, uTime);
  // Add animated rings that flow backward
 float rings = sin((dist * 15.0 - uTime * 1.5)) * 0.5 + 0.5;
  // Flowing vertical lines (like water currents)
 float currents = sin((uv.x * 20.0 + uTime * 2.0 + noise(uv * 2.0))) * 0.5 + 0.5;
  // Combine patterns with caustics dominating
 float pattern = causticsPattern * 0.6 + rings * 0.2 + currents * 0.2;
  // Create underwater color gradient
 vec3 color = mix(uColor1, uColor2, pattern);
  // Add bright caustic highlights
 float brightCaustics = pow(causticsPattern, 2.0);
 color = mix(color, uColor3, brightCaustics * 0.5);
  // Add depth-based color shift (darker in distance)
 float depthFade = smoothstep(0.0, 1.0, vUv.y);
 color = mix(color * 0.3, color, depthFade);
  // Add radial glow from center (light source effect)
 float centerGlow = 1.0 - smoothstep(0.0, 0.5, dist);
 color += uColor3 * centerGlow * 0.3;
  // Edge darkening for tunnel depth
 float edgeDarken = smoothstep(0.4, 0.5, dist);
 color *= 1.0 - edgeDarken * 0.5;
  // Fade at tube ends
 float fade = smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.85, vUv.y);
  // Add some shimmer/sparkle
 float shimmer = sin(uTime * 3.0 + dist * 20.0) * 0.1 + 0.9;
  gl_FragColor = vec4(color * shimmer, 0.7 * fade);
}
