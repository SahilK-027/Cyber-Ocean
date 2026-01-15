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
      particleCount: 3000,
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

      // Random position within bounds
      positions[i3] = (Math.random() - 0.5) * this.config.bounds.x;
      positions[i3 + 1] = (Math.random() - 0.5) * this.config.bounds.y;
      positions[i3 + 2] = (Math.random() - 0.5) * this.config.bounds.z;

      // Initial velocity
      velocities[i3] = 0;
      velocities[i3 + 1] = 0;
      velocities[i3 + 2] = 0;

      // Random type for variation
      const type = Math.random();
      particleTypes[i] = type;

      // Varied sizes - mix of small and medium particles
      const sizeVariation = Math.random();
      let baseSize;
      if (sizeVariation < 0.7) {
        // 70% small particles
        baseSize = 1.0 + Math.random() * 2.0;
      } else {
        // 30% medium particles
        baseSize = 3.0 + Math.random() * 3.0;
      }
      sizes[i] = baseSize;

      // Varied alpha
      alphas[i] = 0.3 + Math.random() * 0.5;

      // Store particle data
      this.particles.push({
        index: i,
        offset: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 0.8,
        swirl: Math.random() * Math.PI * 2,
      });
    }

    // Create geometry
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
    this.geometry.setAttribute('particleType', new THREE.BufferAttribute(particleTypes, 1));

    // Create material
    this.material = new THREE.ShaderMaterial({
      vertexShader: flowFieldVertexShader,
      fragmentShader: flowFieldFragmentShader,
      uniforms: {
        uColor: { value: new THREE.Color(0x00ddff) }, // Single cyan color
        uTime: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    // Create points
    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
  }

  // Improved 3D noise with multiple octaves
  noise3D(x, y, z) {
    const n1 = Math.sin(x * 1.5 + z * 0.8) * Math.cos(y * 1.2 + x * 0.5);
    const n2 = Math.sin(y * 1.8 + x * 0.6) * Math.cos(z * 1.4 + y * 0.7);
    const n3 = Math.sin(z * 2.1 + y * 0.9) * Math.cos(x * 1.6 + z * 0.4);
    
    // Add higher frequency detail
    const detail = Math.sin(x * 4.0) * Math.cos(y * 4.0) * Math.sin(z * 4.0) * 0.3;
    
    return (n1 + n2 + n3) / 3 + detail;
  }

  getFlowField(x, y, z, time, particle) {
    const scale = this.config.noiseScale;
    const t = time * 0.3;

    // Multiple noise layers for complexity
    const nx1 = this.noise3D(x * scale + t, y * scale, z * scale);
    const ny1 = this.noise3D(x * scale, y * scale + t, z * scale + 1000);
    const nz1 = this.noise3D(x * scale, y * scale, z * scale + t + 2000);

    // Second layer with different frequency
    const nx2 = this.noise3D(x * scale * 2 + t * 1.5, y * scale * 2, z * scale * 2) * 0.5;
    const ny2 = this.noise3D(x * scale * 2, y * scale * 2 + t * 1.5, z * scale * 2 + 1000) * 0.5;
    const nz2 = this.noise3D(x * scale * 2, y * scale * 2, z * scale * 2 + t * 1.5 + 2000) * 0.5;

    // Combine layers
    const nx = nx1 + nx2;
    const ny = ny1 + ny2;
    const nz = nz1 + nz2;

    // Convert to direction with curl
    const angle1 = nx * Math.PI * 2;
    const angle2 = ny * Math.PI;
    
    // Add swirling motion
    const swirl = particle.swirl + time * 0.5;
    const swirlX = Math.cos(swirl) * this.config.turbulence;
    const swirlY = Math.sin(swirl) * this.config.turbulence;

    return new THREE.Vector3(
      Math.cos(angle1) * Math.cos(angle2) + swirlX,
      Math.sin(angle2) + swirlY,
      Math.sin(angle1) * Math.cos(angle2) + nz * 0.3
    );
  }

  update() {
    const delta = this.time.delta;
    const elapsed = this.time.elapsedTime;
    const positions = this.geometry.attributes.position.array;
    const velocities = this.geometry.attributes.velocity.array;
    const particleTypes = this.geometry.attributes.particleType.array;

    for (let i = 0; i < this.config.particleCount; i++) {
      const i3 = i * 3;
      const particle = this.particles[i];
      const type = particleTypes[i];

      const x = positions[i3];
      const y = positions[i3 + 1];
      const z = positions[i3 + 2];

      // Get flow field direction
      const flow = this.getFlowField(x, y, z, elapsed + particle.offset, particle);

      // Gentle upward drift and forward movement
      flow.y += 0.3;
      flow.z += 0.2;

      // Smooth velocity (momentum)
      velocities[i3] = velocities[i3] * 0.95 + flow.x * 0.05;
      velocities[i3 + 1] = velocities[i3 + 1] * 0.95 + flow.y * 0.05;
      velocities[i3 + 2] = velocities[i3 + 2] * 0.95 + flow.z * 0.05;

      // Apply velocity to position
      positions[i3] += velocities[i3] * this.config.flowSpeed * particle.speed * delta;
      positions[i3 + 1] += velocities[i3 + 1] * this.config.flowSpeed * particle.speed * delta;
      positions[i3 + 2] += velocities[i3 + 2] * this.config.flowSpeed * particle.speed * delta;

      // Wrap around bounds with smooth transition
      const margin = 5;
      if (positions[i3] > this.config.bounds.x / 2 + margin) {
        positions[i3] = -this.config.bounds.x / 2 - margin;
      } else if (positions[i3] < -this.config.bounds.x / 2 - margin) {
        positions[i3] = this.config.bounds.x / 2 + margin;
      }

      if (positions[i3 + 1] > this.config.bounds.y / 2 + margin) {
        positions[i3 + 1] = -this.config.bounds.y / 2 - margin;
      } else if (positions[i3 + 1] < -this.config.bounds.y / 2 - margin) {
        positions[i3 + 1] = this.config.bounds.y / 2 + margin;
      }

      if (positions[i3 + 2] > this.config.bounds.z / 2 + margin) {
        positions[i3 + 2] = -this.config.bounds.z / 2 - margin;
      } else if (positions[i3 + 2] < -this.config.bounds.z / 2 - margin) {
        positions[i3 + 2] = this.config.bounds.z / 2 + margin;
      }
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.velocity.needsUpdate = true;
    
    // Update shader time
    this.material.uniforms.uTime.value = elapsed;
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
    this.scene.remove(this.points);
  }
}
