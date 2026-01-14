varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

#include <skinning_pars_vertex>

void main() {
    #include <skinbase_vertex>
    #include <begin_vertex>
    #include <skinning_vertex>
    #include <project_vertex>
    
    vec4 modelPosition = modelMatrix * vec4(transformed, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    
    gl_Position = projectedPosition;

    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = viewPosition.xyz;
}
