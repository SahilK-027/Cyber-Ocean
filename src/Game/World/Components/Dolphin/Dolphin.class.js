import * as THREE from 'three';
import vertexShader from '../../../../Shaders/Dolphin/vertex.glsl';
import fragmentShader from '../../../../Shaders/Dolphin/fragment.glsl';
import Game from '../../../Game.class';

export default class Dolphin {
  constructor() {
    this.game = Game.getInstance();
    this.scene = this.game.scene;
    this.resources = this.game.resources;
    this.time = this.game.time;

    this.modelResource = this.resources.items.dolphinAnimatedModel;

    this.setMaterial();
    this.setModelInstance();
    this.setAnimation();
  }

  setMaterial() {
    this.material = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
      },
    });
  }

  setModelInstance() {
    this.dolphin = this.modelResource.scene;

    this.dolphin.traverse((child) => {
      if (child.isMesh) {
        child.material = this.material;
      }
    });
    this.dolphin.position.set(0, 0.5, 0);

    this.scene.add(this.dolphin);
  }

  setAnimation() {
    this.animation = {};
    this.animation.mixer = new THREE.AnimationMixer(this.dolphin);

    if (
      this.modelResource.animations &&
      this.modelResource.animations.length > 0
    ) {
      this.animation.action = this.animation.mixer.clipAction(
        this.modelResource.animations[0]
      );
      this.animation.action.play();
    } else {
      console.warn('No animations found in dolphin model');
    }
  }

  update() {
    if (this.animation?.mixer) {
      this.animation.mixer.update(this.time.delta);
    }

    if (this.material.uniforms.uTime) {
      this.material.uniforms.uTime.value = this.time.elapsedTime;
    }
  }
}
