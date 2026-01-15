uniform sampler2D uPositions;
uniform float uPixelRatio;
uniform float uSize;
uniform float uTime;

varying float vLife;
varying float vSize;

void main() {
  vec4 posData = texture2D(uPositions, uv);
  vLife = posData.a;

  vec4 mvPosition = modelViewMatrix * vec4(posData.xyz, 1.0);

  float lifeCurve = sin(vLife * 3.14159);
  float sizeFade = smoothstep(0.0, 0.1, vLife) * smoothstep(1.0, 0.5, vLife);

  float sizeVariation = 0.7 + 0.6 * fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);

  float size = uSize * uPixelRatio * sizeFade * sizeVariation * (1.0 + lifeCurve * 0.3);
  size *= (0.7 / -mvPosition.z);

  vSize = size;
  gl_PointSize = size;
  gl_Position = projectionMatrix * mvPosition;
}
