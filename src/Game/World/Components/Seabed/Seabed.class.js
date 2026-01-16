import * as THREE from 'three';
import Game from '../../../Game.class';
import vertexShader from '../../../../Shaders/Seabed/vertex.glsl';
import fragmentShader from '../../../../Shaders/Seabed/fragment.glsl';

export default class Seabed {
  constructor() {
    this.game = Game.getInstance();
    this.scene = this.game.scene;
    this.time = this.game.time;

    this.config = {
      particleCount: 2 * 1000 * 1000,
      gridSize: 300,
      gridDepth: 300,
      depth: -20,
      centerZ: 0,
      noiseScale: 0.08,
      noiseHeight: 8.0,
      particleSize: 300.5,
      color1: new THREE.Color(0x0a4d6e),
      color2: new THREE.Color(0x1a7fa8),
      color3: new THREE.Color(0x2eb8e6),
      glowIntensity: 0.6,
      waveSpeed: 0.15,
      waveAmplitude: 0.8,
    };

    this.init();
    this.setDebug();
  }

  init() {
    this.createParticleGeometry();
    this.createParticleMaterial();
    this.particleSystem = new THREE.Points(this.geometry, this.material);
    this.particleSystem.frustumCulled = false;
    this.scene.add(this.particleSystem);
  }

  createParticleGeometry() {
    this.geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(this.config.particleCount * 3);
    const randoms = new Float32Array(this.config.particleCount);
    const gridCoords = new Float32Array(this.config.particleCount * 2);

    const gridSize = this.config.gridSize;
    const gridDepth = this.config.gridDepth;

    for (let i = 0; i < this.config.particleCount; i++) {
      const x = (Math.random() - 0.5) * gridSize;
      const z = (Math.random() - 0.5) * gridDepth + this.config.centerZ;

      positions[i * 3] = x;
      positions[i * 3 + 1] = this.config.depth;
      positions[i * 3 + 2] = z;

      randoms[i] = Math.random();
      gridCoords[i * 2] = x;
      gridCoords[i * 2 + 1] = z;
    }

    this.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );
    this.geometry.setAttribute(
      'aRandom',
      new THREE.BufferAttribute(randoms, 1)
    );
    this.geometry.setAttribute(
      'aGridCoord',
      new THREE.BufferAttribute(gridCoords, 2)
    );
  }

  createParticleMaterial() {
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uSize: { value: this.config.particleSize },
        uNoiseScale: { value: this.config.noiseScale },
        uNoiseHeight: { value: this.config.noiseHeight },
        uColor1: { value: this.config.color1 },
        uColor2: { value: this.config.color2 },
        uColor3: { value: this.config.color3 },
        uGlowIntensity: { value: this.config.glowIntensity },
        uWaveSpeed: { value: this.config.waveSpeed },
        uWaveAmplitude: { value: this.config.waveAmplitude },
        uFogColor: { 
          value: this.scene.fog ? this.scene.fog.color : new THREE.Color(0x121316) 
        },
        uFogNear: { value: this.scene.fog ? this.scene.fog.near : 40 },
        uFogFar: { value: this.scene.fog ? this.scene.fog.far : 300 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }

  update() {
    this.material.uniforms.uTime.value = this.time.elapsedTime;
    
    // Update fog uniforms if fog exists
    if (this.scene.fog) {
      this.material.uniforms.uFogColor.value.copy(this.scene.fog.color);
      this.material.uniforms.uFogNear.value = this.scene.fog.near;
      this.material.uniforms.uFogFar.value = this.scene.fog.far;
    }
  }

  setDebug() {
    if (!this.game.isDebugEnabled) return;

    const debug = this.game.debug;

    debug.add(
      this.config,
      'depth',
      { min: -100, max: 0, step: 1, label: 'Depth (Y)', onChange: () => this.updateDepth() },
      'Seabed'
    );

    debug.add(
      this.config,
      'centerZ',
      { min: -100, max: 100, step: 5, label: 'Center Z', onChange: () => this.updateDepth() },
      'Seabed'
    );

    debug.add(
      this.material.uniforms.uSize,
      'value',
      { min: 1, max: 10, step: 0.5, label: 'Particle Size' },
      'Seabed'
    );

    debug.add(
      this.material.uniforms.uNoiseScale,
      'value',
      { min: 0.01, max: 0.3, step: 0.01, label: 'Noise Scale' },
      'Seabed'
    );

    debug.add(
      this.material.uniforms.uNoiseHeight,
      'value',
      { min: 0, max: 20, step: 0.5, label: 'Noise Height' },
      'Seabed'
    );

    debug.add(
      this.material.uniforms.uWaveSpeed,
      'value',
      { min: 0, max: 1, step: 0.05, label: 'Wave Speed' },
      'Seabed'
    );

    debug.add(
      this.material.uniforms.uWaveAmplitude,
      'value',
      { min: 0, max: 3, step: 0.1, label: 'Wave Amplitude' },
      'Seabed'
    );

    debug.add(
      this.material.uniforms.uGlowIntensity,
      'value',
      { min: 0, max: 2, step: 0.1, label: 'Glow Intensity' },
      'Seabed'
    );

    debug.add(
      this.material.uniforms.uColor1,
      'value',
      { label: 'Color Deep' },
      'Seabed'
    );

    debug.add(
      this.material.uniforms.uColor2,
      'value',
      { label: 'Color Mid' },
      'Seabed'
    );

    debug.add(
      this.material.uniforms.uColor3,
      'value',
      { label: 'Color Peak' },
      'Seabed'
    );
  }

  updateDepth() {
    const positions = this.geometry.getAttribute('position');
    for (let i = 0; i < this.config.particleCount; i++) {
      positions.array[i * 3 + 1] = this.config.depth;
    }
    positions.needsUpdate = true;
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
    this.scene.remove(this.particleSystem);
  }
}
