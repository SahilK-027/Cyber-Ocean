uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform float uGlowIntensity;
uniform float uTime;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;

varying float vHeight;
varying float vRandom;
varying vec3 vPosition;
varying float vFogDepth;

void main() {
  // Circular particle shape with soft edges
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);
  
  if(dist > 0.5) {
    discard;
  }
  
  // Soft glow falloff
  float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
  alpha = pow(alpha, 1.5);
  
  // Color based on height
  float heightNorm = (vHeight + 5.0) / 10.0;
  heightNorm = clamp(heightNorm, 0.0, 1.0);
  
  vec3 color;
  if(heightNorm < 0.5) {
    color = mix(uColor1, uColor2, heightNorm * 2.0);
  } else {
    color = mix(uColor2, uColor3, (heightNorm - 0.5) * 2.0);
  }
  
  // Add pulsing glow to peaks
  float peakGlow = smoothstep(0.6, 1.0, heightNorm);
  float pulse = sin(uTime * 2.0 + vRandom * 6.28) * 0.5 + 0.5;
  color += uColor3 * peakGlow * pulse * uGlowIntensity;
  
  // Add random sparkle effect
  float sparkle = step(0.98, vRandom + sin(uTime * 3.0 + vPosition.x) * 0.02);
  color += vec3(0.5, 0.8, 1.0) * sparkle * 0.8;
  
  // Cyber grid lines effect
  float gridX = fract(vPosition.x * 0.5);
  float gridZ = fract(vPosition.z * 0.5);
  float grid = step(0.95, gridX) + step(0.95, gridZ);
  color += vec3(0.2, 0.6, 0.9) * grid * 0.3;
  
  // Final alpha with glow
  alpha *= (0.6 + uGlowIntensity * 0.4);
  
  // Apply fog
  float fogFactor = smoothstep(uFogNear, uFogFar, vFogDepth);
  vec3 finalColor = mix(color, uFogColor, fogFactor);
  float finalAlpha = alpha * (1.0 - fogFactor * 0.7);
  
  gl_FragColor = vec4(finalColor, finalAlpha);
}
