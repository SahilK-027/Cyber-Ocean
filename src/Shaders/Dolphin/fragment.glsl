uniform float uTime;
uniform vec3 uBaseColor;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
    vec3 normal = normalize(vNormal);
    if(!gl_FrontFacing) {
        normal *= -1.0;
    }

    vec3 viewDirection = normalize(vPosition - cameraPosition);
    float fresnel = dot(viewDirection, normal) + 1.0;
    fresnel = pow(fresnel, 2.5);

    gl_FragColor = vec4(uBaseColor, fresnel);

    #include <colorspace_fragment>
}
