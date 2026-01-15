uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;

attribute float aRandom;
attribute float aSize;

varying float vRandom;

void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;

    float sizeVariation = aSize * (0.5 + 0.5 * sin(uTime * 2.0 + aRandom * 6.28));
    gl_PointSize = uSize * sizeVariation * uPixelRatio;
    gl_PointSize *= (2.0 / -viewPosition.z);
    gl_PointSize = max(gl_PointSize, 2.0);

    vRandom = aRandom;
}
