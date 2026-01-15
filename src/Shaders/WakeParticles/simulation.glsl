vec4 permute(vec4 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float permute(float x) {
  return floor(mod(((x * 34.0) + 1.0) * x, 289.0));
}

vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

float taylorInvSqrt(float r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

vec4 grad4(float j, vec4 ip) {
  const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);
  vec4 p, s;
  p.xyz = floor(fract(vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;
  p.w = 1.5 - dot(abs(p.xyz), ones.xyz);
  s = vec4(lessThan(p, vec4(0.0)));
  p.xyz = p.xyz + (s.xyz * 2.0 - 1.0) * s.www;
  return p;
}

float simplexNoise4d(vec4 v) {
  const vec2 C = vec2(0.138196601125010504, 0.309016994374947451);

  vec4 i = floor(v + dot(v, C.yyyy));
  vec4 x0 = v - i + dot(i, C.xxxx);

  vec4 i0;
  vec3 isX = step(x0.yzw, x0.xxx);
  vec3 isYZ = step(x0.zww, x0.yyz);
  i0.x = isX.x + isX.y + isX.z;
  i0.yzw = 1.0 - isX;
  i0.y += isYZ.x + isYZ.y;
  i0.zw += 1.0 - isYZ.xy;
  i0.z += isYZ.z;
  i0.w += 1.0 - isYZ.z;

  vec4 i3 = clamp(i0, 0.0, 1.0);
  vec4 i2 = clamp(i0 - 1.0, 0.0, 1.0);
  vec4 i1 = clamp(i0 - 2.0, 0.0, 1.0);

  vec4 x1 = x0 - i1 + C.xxxx;
  vec4 x2 = x0 - i2 + 2.0 * C.xxxx;
  vec4 x3 = x0 - i3 + 3.0 * C.xxxx;
  vec4 x4 = x0 - 1.0 + 4.0 * C.xxxx;

  i = mod(i, 289.0);
  float j0 = permute(permute(permute(permute(i.w) + i.z) + i.y) + i.x);
  vec4 j1 = permute(permute(permute(permute(i.w + vec4(i1.w, i2.w, i3.w, 1.0)) +
    i.z + vec4(i1.z, i2.z, i3.z, 1.0)) +
    i.y + vec4(i1.y, i2.y, i3.y, 1.0)) +
    i.x + vec4(i1.x, i2.x, i3.x, 1.0));

  vec4 ip = vec4(1.0 / 294.0, 1.0 / 49.0, 1.0 / 7.0, 0.0);

  vec4 p0 = grad4(j0, ip);
  vec4 p1 = grad4(j1.x, ip);
  vec4 p2 = grad4(j1.y, ip);
  vec4 p3 = grad4(j1.z, ip);
  vec4 p4 = grad4(j1.w, ip);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  p4 *= taylorInvSqrt(dot(p4, p4));

  vec3 m0 = max(0.6 - vec3(dot(x0, x0), dot(x1, x1), dot(x2, x2)), 0.0);
  vec2 m1 = max(0.6 - vec2(dot(x3, x3), dot(x4, x4)), 0.0);
  m0 = m0 * m0;
  m1 = m1 * m1;

  return 49.0 * (dot(m0 * m0, vec3(dot(p0, x0), dot(p1, x1), dot(p2, x2))) +
    dot(m1 * m1, vec2(dot(p3, x3), dot(p4, x4))));
}

vec3 curlNoise(vec3 p, float time) {
  float e = 0.1;

  float n1 = simplexNoise4d(vec4(p + vec3(e, 0, 0), time));
  float n2 = simplexNoise4d(vec4(p - vec3(e, 0, 0), time));
  float n3 = simplexNoise4d(vec4(p + vec3(0, e, 0), time));
  float n4 = simplexNoise4d(vec4(p - vec3(0, e, 0), time));
  float n5 = simplexNoise4d(vec4(p + vec3(0, 0, e), time));
  float n6 = simplexNoise4d(vec4(p - vec3(0, 0, e), time));

  float x = (n4 - n3) - (n6 - n5);
  float y = (n6 - n5) - (n2 - n1);
  float z = (n2 - n1) - (n4 - n3);

  return normalize(vec3(x, y, z));
}

uniform float uTime;
uniform float uDeltaTime;
uniform sampler2D uSpawnPoints;
uniform float uBackwardSpeed;
uniform float uTurbulence;
uniform float uSpread;
uniform float uCurlStrength;
uniform float uSpiralIntensity;
uniform float uBuoyancy;
uniform float uDrag;
uniform vec3 uDolphinPosition;

void main() {
  float time = uTime * 0.25;
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 particle = texture2D(uParticles, uv);
  vec4 spawnPoint = texture2D(uSpawnPoints, uv);

  float seed = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
  float seed2 = fract(sin(dot(uv, vec2(94.322, 18.765))) * 28461.2847);

  if(particle.a >= 1.0) {
    particle.xyz = spawnPoint.xyz;
    particle.xyz += (vec3(seed, seed2, fract(seed + seed2)) - 0.5) * 0.1;
    particle.a = fract(particle.a) * 0.05;
  } else {
    float speedVariation = 0.7 + seed * 0.6;
    vec3 current = vec3(0.0, 0.0, -uBackwardSpeed * speedVariation);

    vec3 curl = curlNoise(particle.xyz * 0.4, time) * uCurlStrength;

    vec3 curl2 = curlNoise(particle.xyz * 1.2, time * 1.5) * uCurlStrength * 0.3;

    float buoyancy = uBuoyancy * (0.8 + seed * 0.4);

    vec3 toCenter = particle.xyz - uDolphinPosition;
    float distXY = length(toCenter.xy);
    vec3 spiral = vec3(0.0);

    if(distXY > 0.05) {
      vec2 tangent = vec2(-toCenter.y, toCenter.x) / distXY;
      float spiralStr = uSpiralIntensity / (distXY * 0.5 + 0.3);
      spiralStr *= 1.0 + sin(toCenter.z * 1.5 + time * 2.0) * 0.4;
      spiral.xy = tangent * spiralStr;
    }

    float zDist = particle.z - uDolphinPosition.z;
    vec3 spread = vec3(0.0);
    if(distXY > 0.01 && zDist < 0.0) {
      float spreadFactor = smoothstep(0.0, -5.0, zDist) * uSpread;
      spread.xy = normalize(toCenter.xy) * spreadFactor;
    }

    float wave = sin(time * 3.0 + seed * 6.28 + particle.z * 0.8) * 0.08;
    float wave2 = cos(time * 2.3 + seed2 * 6.28 + particle.x * 1.2) * 0.05;

    vec3 velocity = current;
    velocity += (curl + curl2) * uTurbulence;
    velocity += spiral;
    velocity += spread;
    velocity.y += buoyancy + wave;
    velocity.x += wave2;

    velocity *= uDrag;

    particle.xyz += velocity * uDeltaTime;

    float ageFactor = 0.18 + smoothstep(0.0, -12.0, zDist) * 0.12;
    particle.a += uDeltaTime * ageFactor;
  }

  gl_FragColor = particle;
}
