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
    this.setDebug();
  }

  setMaterial() {
    this.material = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uBaseColor: { value: new THREE.Color(0x57a0ff) },
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

  setDebug() {
    if (!this.game.isDebugEnabled) return;

    const debug = this.game.debug;

    // Base Color control
    debug.add(
      this.material.uniforms.uBaseColor,
      'value',
      {
        label: 'Base Color',
      },
      'Dolphin'
    );

    // Material controls
    const materialSettings = {
      wireframe: false,
      visible: true,
    };

    debug.add(
      materialSettings,
      'wireframe',
      {
        label: 'Wireframe',
        onChange: (value) => {
          this.material.wireframe = value;
        },
      },
      'Dolphin'
    );

    debug.add(
      materialSettings,
      'visible',
      {
        label: 'Visible',
        onChange: (value) => {
          this.dolphin.visible = value;
        },
      },
      'Dolphin'
    );

    // Animation controls
    if (this.animation?.action) {
      const animSettings = {
        timeScale: 1,
        paused: false,
      };

      debug.add(
        animSettings,
        'timeScale',
        {
          min: 0,
          max: 3,
          step: 0.1,
          label: 'Anim Speed',
          onChange: (value) => {
            this.animation.action.timeScale = value;
          },
        },
        'Dolphin'
      );

      debug.add(
        animSettings,
        'paused',
        {
          label: 'Pause Anim',
          onChange: (value) => {
            if (value) {
              this.animation.action.paused = true;
            } else {
              this.animation.action.paused = false;
            }
          },
        },
        'Dolphin'
      );
    }

    // Reset button
    debug.addButton(
      {
        label: 'Reset Transform',
        onClick: () => {
          this.dolphin.position.set(0, 0.5, 0);
          this.dolphin.rotation.set(0, 0, 0);
          this.dolphin.scale.set(1, 1, 1);
        },
      },
      'Dolphin'
    );
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
