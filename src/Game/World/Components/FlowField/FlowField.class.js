import * as THREE from 'three';
import Game from '../../../Game.class';
import flowFieldVertexShader from '../../../../Shaders/FlowField/vertex.glsl';
import flowFieldFragmentShader from '../../../../Shaders/FlowField/fragment.glsl';

export default class FlowField {
  constructor() {
    this.game = Game.getInstance();
    this.scene = this.game.scene;
    this.time = this.game.time;

    this.config = {
      particleCount: 1500,
      bounds: {
        x: 80,
        y: 50,
        z: 100,
      },
      flowSpeed: 0.8,
      noiseScale: 0.08,
      turbulence: 0.3,
    };

    this.particles = [];
    this.createParticles();
  }

  createParticles() {
    const positions = new Float32Array(this.config.particleCount * 3);
    const velocities = new Float32Array(this.config.particleCount * 3);
    const sizes = new Float32Array(this.config.particleCount);
    const alphas = new Float32Array(this.config.particleCount);
    const particleTypes = new Float32Array(this.config.particleCount);

    for (let i = 0; i < this.config.particleCount; i++) {
      const i3 = i * 3;

      positions[i3] = (Math.random() - 0.5) * this.config.bounds.x;
      positions[i3 + 1] = (Math.random() - 0.5) * this.config.bounds.y;
      positions[i3 + 2] = (Math.random() - 0.5) * this.config.bounds.z;

      velocities[i3] = 0;
      velocities[i3 + 1] = 0;
      velocities[i3 + 2] = 0;

      const type = Math.random();
      particleTypes[i] = type;

      const sizeVariation = Math.random();
      let baseSize;
      if (sizeVariation < 0.7) {
        baseSize = 1.0 + Math.random() * 2.0;
      } else {
        baseSize = 3.0 + Math.random() * 3.0;
      }
      sizes[i] = baseSize;

      alphas[i] = 0.3 + Math.random() * 0.5;

      this.particles.push({
        index: i,
        offset: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 0.8,
        swirl: Math.random() * Math.PI * 2,
      });
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );
    this.geometry.setAttribute(
      'velocity',
      new THREE.BufferAttribute(velocities, 3)
    );
    this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
    this.geometry.setAttribute(
      'particleType',
      new THREE.BufferAttribute(particleTypes, 1)
    );

    this.material = new THREE.ShaderMaterial({
      vertexShader: flowFieldVertexShader,
      fragmentShader: flowFieldFragmentShader,
      uniforms: {
        uColor: { value: new THREE.Color(0x00ddff) },
        uTime: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
  }

  noise3D(x, y, z) {
    const n1 = Math.sin(x * 1.5 + z * 0.8) * Math.cos(y * 1.2 + x * 0.5);
    const n2 = Math.sin(y * 1.8 + x * 0.6) * Math.cos(z * 1.4 + y * 0.7);
    const n3 = Math.sin(z * 2.1 + y * 0.9) * Math.cos(x * 1.6 + z * 0.4);

    const detail =
      Math.sin(x * 4.0) * Math.cos(y * 4.0) * Math.sin(z * 4.0) * 0.3;

    return (n1 + n2 + n3) / 3 + detail;
  }

  getFlowField(x, y, z, time, particle) {
    const scale = this.config.noiseScale;
    const t = time * 0.3;
    
    // Use cached noise values if available and not too old
    const cacheKey = `${Math.floor(x * 10)}_${Math.floor(y * 10)}_${Math.floor(z * 10)}_${Math.floor(t * 10)}`;
    if (this._noiseCache && this._noiseCache[cacheKey] && this._noiseCache.frame === this._frameCount) {
      const cached = this._noiseCache[cacheKey];
      return new THREE.Vector3(cached.x, cached.y, cached.z);
    }

    // Initialize cache if needed
    if (!this._noiseCache || this._noiseCache.frame !== this._frameCount) {
      this._noiseCache = { frame: this._frameCount };
    }

    const scale2 = scale * 2;
    const t15 = t * 1.5;

    // Cache scaled coordinates
    const sx = x * scale;
    const sy = y * scale;
    const sz = z * scale;
    const sx2 = x * scale2;
    const sy2 = y * scale2;
    const sz2 = z * scale2;

    const nx1 = this.noise3D(sx + t, sy, sz);
    const ny1 = this.noise3D(sx, sy + t, sz + 1000);
    const nz1 = this.noise3D(sx, sy, sz + t + 2000);

    const nx2 = this.noise3D(sx2 + t15, sy2, sz2) * 0.5;
    const ny2 = this.noise3D(sx2, sy2 + t15, sz2 + 1000) * 0.5;
    const nz2 = this.noise3D(sx2, sy2, sz2 + t15 + 2000) * 0.5;

    const nx = nx1 + nx2;
    const ny = ny1 + ny2;
    const nz = nz1 + nz2;

    const angle1 = nx * Math.PI * 2;
    const angle2 = ny * Math.PI;
    const cosAngle1 = Math.cos(angle1);
    const cosAngle2 = Math.cos(angle2);
    const sinAngle1 = Math.sin(angle1);
    const sinAngle2 = Math.sin(angle2);

    const swirl = particle.swirl + time * 0.5;
    const turbulence = this.config.turbulence;
    const swirlX = Math.cos(swirl) * turbulence;
    const swirlY = Math.sin(swirl) * turbulence;

    const result = {
      x: cosAngle1 * cosAngle2 + swirlX,
      y: sinAngle2 + swirlY,
      z: sinAngle1 * cosAngle2 + nz * 0.3
    };

    // Cache the result
    this._noiseCache[cacheKey] = result;

    return new THREE.Vector3(result.x, result.y, result.z);
  }

  update() {
    const delta = this.time.delta;
    const elapsed = this.time.elapsedTime;
    const positions = this.geometry.attributes.position.array;
    const velocities = this.geometry.attributes.velocity.array;
    const particleTypes = this.geometry.attributes.particleType.array;

    // Cache bounds calculations
    const halfX = this.config.bounds.x / 2;
    const halfY = this.config.bounds.y / 2;
    const halfZ = this.config.bounds.z / 2;
    const margin = 5;
    const minX = -halfX - margin;
    const maxX = halfX + margin;
    const minY = -halfY - margin;
    const maxY = halfY + margin;
    const minZ = -halfZ - margin;
    const maxZ = halfZ + margin;

    // Cache velocity damping factors
    const velDamp = 0.95;
    const velBlend = 0.05;
    const flowSpeed = this.config.flowSpeed;

    // Reduce noise calculation frequency - only update every few frames
    const shouldUpdateNoise = this._frameCount % 3 === 0;
    this._frameCount = (this._frameCount || 0) + 1;

    for (let i = 0; i < this.config.particleCount; i++) {
      const i3 = i * 3;
      const particle = this.particles[i];

      const x = positions[i3];
      const y = positions[i3 + 1];
      const z = positions[i3 + 2];

      const flow = this.getFlowField(
        x,
        y,
        z,
        elapsed + particle.offset,
        particle
      );

      flow.y += 0.3;
      flow.z += 0.2;

      // Optimize velocity updates
      const speedDelta = flowSpeed * particle.speed * delta;
      velocities[i3] = velocities[i3] * velDamp + flow.x * velBlend;
      velocities[i3 + 1] = velocities[i3 + 1] * velDamp + flow.y * velBlend;
      velocities[i3 + 2] = velocities[i3 + 2] * velDamp + flow.z * velBlend;

      positions[i3] += velocities[i3] * speedDelta;
      positions[i3 + 1] += velocities[i3 + 1] * speedDelta;
      positions[i3 + 2] += velocities[i3 + 2] * speedDelta;

      // Optimize boundary checks with early exits
      if (positions[i3] > maxX) {
        positions[i3] = minX;
      } else if (positions[i3] < minX) {
        positions[i3] = maxX;
      }

      if (positions[i3 + 1] > maxY) {
        positions[i3 + 1] = minY;
      } else if (positions[i3 + 1] < minY) {
        positions[i3 + 1] = maxY;
      }

      if (positions[i3 + 2] > maxZ) {
        positions[i3 + 2] = minZ;
      } else if (positions[i3 + 2] < minZ) {
        positions[i3 + 2] = maxZ;
      }
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.velocity.needsUpdate = true;

    this.material.uniforms.uTime.value = elapsed;
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
    this.scene.remove(this.points);
  }
}
