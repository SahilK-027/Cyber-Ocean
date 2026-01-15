attribute vec3 velocity;
attribute float size;
attribute float alpha;
attribute float particleType;

varying float vAlpha;
varying float vParticleType;
varying vec3 vVelocity;

void main() {
  vAlpha = alpha;
  vParticleType = particleType;
  vVelocity = velocity;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = size * (90.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
