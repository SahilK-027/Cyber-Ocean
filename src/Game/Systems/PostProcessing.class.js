import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';

import Game from '../Game.class';

import combinedVertexShader from '../../Shaders/PostProcessing/combined.vert.glsl';
import combinedFragmentShader from '../../Shaders/PostProcessing/combined.frag.glsl';

// Single combined post-processing shader pass (keeps the composer lightweight).
const CombinedShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uGlowIntensity: { value: 0.4 },
    uAberration: { value: 0.003 },
    uMouseInfluence: { value: new THREE.Vector2(0, 0) },
    uGrainIntensity: { value: 0.05 },
    uVignetteStrength: { value: 0.15 },
  },
  vertexShader: combinedVertexShader,
  fragmentShader: combinedFragmentShader,
};

export default class PostProcessing {
  constructor() {
    this.game = Game.getInstance();
    this.scene = this.game.scene;
    this.camera = this.game.camera.cameraInstance;
    this.renderer = this.game.renderer.rendererInstance;
    this.sizes = this.game.sizes;
    this.debug = this.game.debug;
    this.isDebugEnabled = this.game.isDebugEnabled;

    this.mouseVelocity = new THREE.Vector2(0, 0);

    this.composer = new EffectComposer(this.renderer);
    this.setupPasses();

    if (this.isDebugEnabled) {
      this.initTweakPane();
    }
  }

  setupPasses() {
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    this.combinedPass = new ShaderPass(CombinedShader);
    this.composer.addPass(this.combinedPass);

    const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);
    // this.composer.addPass(gammaCorrectionPass);
  }

  initTweakPane() {
    this.debug.add(
      this.combinedPass.uniforms.uGlowIntensity,
      'value',
      { min: 0, max: 2, step: 0.01, label: 'Glow Intensity' },
      'Post Processing'
    );
    this.debug.add(
      this.combinedPass.uniforms.uAberration,
      'value',
      { min: 0, max: 0.02, step: 0.001, label: 'Chromatic Aberration' },
      'Post Processing'
    );
    this.debug.add(
      this.combinedPass.uniforms.uGrainIntensity,
      'value',
      { min: 0, max: 0.3, step: 0.01, label: 'Film Grain' },
      'Post Processing'
    );
    this.debug.add(
      this.combinedPass.uniforms.uVignetteStrength,
      'value',
      { min: 0, max: 0.5, step: 0.01, label: 'Vignette' },
      'Post Processing'
    );
  }

  update(elapsedTime) {
    this.combinedPass.uniforms.uTime.value = elapsedTime;
    this.combinedPass.uniforms.uMouseInfluence.value.copy(this.mouseVelocity);
  }

  setMouseVelocity(velocity) {
    this.mouseVelocity.copy(velocity);
  }

  render() {
    this.composer.render();
  }

  resize() {
    this.composer.setSize(this.sizes.width, this.sizes.height);
  }

  dispose() {
    this.composer.dispose();
  }
}
