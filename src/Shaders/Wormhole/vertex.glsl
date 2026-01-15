varying vec2 vUv;
varying vec3 vPosition;
varying float vFogDepth;

void main() {
  vUv = uv;
  vPosition = position;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vFogDepth = -mvPosition.z;
  gl_Position = projectionMatrix * mvPosition;
}