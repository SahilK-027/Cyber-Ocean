import * as THREE from 'three';
import Game from '../Game.class';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export default class Camera {
  constructor(fov = 35, near = 0.1, far = 1000) {
    this.game = Game.getInstance();
    this.canvas = this.game.canvas;
    this.sizes = this.game.sizes;
    this.scene = this.game.scene;
    this.debug = this.game.debug;
    this.isDebugEnabled = this.game.isDebugEnabled;

    this.idealRatio = 16 / 9;
    this.ratioOverflow = 0;
    this.initialCameraPosition = new THREE.Vector3(4.0, 0.8, 3.4);
    this.baseMaxDistance = 8;

    this.parallaxAmplitude = 0.2;
    this.parallaxEasingSpeed = 10;
    this.parallaxOffset = new THREE.Vector2(0, 0);

    this.floatTime = 0;
    this.floatAmplitude = {
      x: 0.033,
      y: 0.055,
      z: 0.066,
    };
    this.floatFrequency = {
      x: 0.3,
      y: 0.5,
      z: 0.6,
    };
    this.rotationAmplitude = {
      x: 0.008,
      y: 0.005,
      z: 0.01,
    };
    this.rotationFrequency = {
      x: 0.4,
      y: 0.25,
      z: 0.35,
    };

    this.randomness = {
      enabled: true,
      intensity: 0.5,
      speed: 0.8,
    };
    this.noiseOffsets = {
      x: Math.random() * 1000,
      y: Math.random() * 1000,
      z: Math.random() * 1000,
      rotX: Math.random() * 1000,
      rotY: Math.random() * 1000,
      rotZ: Math.random() * 1000,
    };

    this.setCameraGroup();
    this.setPerspectiveCameraInstance(fov, near, far);
    this.setOrbitControls();
    this.updateCameraForAspectRatio();

    if (this.isDebugEnabled) {
      this.initDebugGUI();
    }
  }

  // Lightweight smooth noise used to avoid importing a full noise library.
  smoothNoise(t, offset) {
    const x = t + offset;
    return (
      Math.sin(x * 1.0) * 0.5 +
      Math.sin(x * 2.3) * 0.25 +
      Math.sin(x * 4.1) * 0.125 +
      Math.sin(x * 7.9) * 0.0625
    );
  }

  initDebugGUI() {
    const folderName = 'Camera Float';

    this.debug.add(
      this.floatAmplitude,
      'x',
      {
        min: 0,
        max: 0.2,
        step: 0.001,
        label: 'Float Amp X',
      },
      folderName
    );
    this.debug.add(
      this.floatAmplitude,
      'y',
      {
        min: 0,
        max: 0.2,
        step: 0.001,
        label: 'Float Amp Y',
      },
      folderName
    );
    this.debug.add(
      this.floatAmplitude,
      'z',
      {
        min: 0,
        max: 0.1,
        step: 0.001,
        label: 'Float Amp Z',
      },
      folderName
    );

    this.debug.add(
      this.floatFrequency,
      'x',
      {
        min: 0.05,
        max: 1,
        step: 0.01,
        label: 'Float Freq X',
      },
      folderName
    );
    this.debug.add(
      this.floatFrequency,
      'y',
      {
        min: 0.05,
        max: 1,
        step: 0.01,
        label: 'Float Freq Y',
      },
      folderName
    );
    this.debug.add(
      this.floatFrequency,
      'z',
      {
        min: 0.05,
        max: 1,
        step: 0.01,
        label: 'Float Freq Z',
      },
      folderName
    );

    this.debug.add(
      this.rotationAmplitude,
      'x',
      {
        min: 0,
        max: 0.05,
        step: 0.001,
        label: 'Rot Amp X (Pitch)',
      },
      folderName
    );
    this.debug.add(
      this.rotationAmplitude,
      'y',
      {
        min: 0,
        max: 0.05,
        step: 0.001,
        label: 'Rot Amp Y (Yaw)',
      },
      folderName
    );
    this.debug.add(
      this.rotationAmplitude,
      'z',
      {
        min: 0,
        max: 0.05,
        step: 0.001,
        label: 'Rot Amp Z (Roll)',
      },
      folderName
    );

    this.debug.add(
      this.rotationFrequency,
      'x',
      {
        min: 0.05,
        max: 1,
        step: 0.01,
        label: 'Rot Freq X',
      },
      folderName
    );
    this.debug.add(
      this.rotationFrequency,
      'y',
      {
        min: 0.05,
        max: 1,
        step: 0.01,
        label: 'Rot Freq Y',
      },
      folderName
    );
    this.debug.add(
      this.rotationFrequency,
      'z',
      {
        min: 0.05,
        max: 1,
        step: 0.01,
        label: 'Rot Freq Z',
      },
      folderName
    );

    this.debug.add(
      this.randomness,
      'enabled',
      {
        label: 'Randomness',
      },
      folderName
    );
    this.debug.add(
      this.randomness,
      'intensity',
      {
        min: 0,
        max: 1,
        step: 0.01,
        label: 'Random Intensity',
      },
      folderName
    );
    this.debug.add(
      this.randomness,
      'speed',
      {
        min: 0.1,
        max: 2,
        step: 0.01,
        label: 'Random Speed',
      },
      folderName
    );

    this.debug.add(
      this,
      'parallaxAmplitude',
      {
        min: 0,
        max: 0.5,
        step: 0.01,
        label: 'Parallax Amp',
      },
      folderName
    );
    this.debug.add(
      this,
      'parallaxEasingSpeed',
      {
        min: 1,
        max: 20,
        step: 0.5,
        label: 'Parallax Easing',
      },
      folderName
    );
  }

  setCameraGroup() {
    this.cameraGroup = new THREE.Group();
    this.scene.add(this.cameraGroup);
  }

  setPerspectiveCameraInstance(fov, near, far) {
    const aspectRatio = this.sizes.width / this.sizes.height;
    this.cameraInstance = new THREE.PerspectiveCamera(
      fov,
      aspectRatio,
      near,
      far
    );
    this.cameraInstance.position.copy(this.initialCameraPosition);
    this.cameraGroup.add(this.cameraInstance);
  }

  setOrbitControls() {
    this.controls = new OrbitControls(this.cameraInstance, this.canvas);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.enableZoom = true;
    this.controls.enableRotate = true;
    this.controls.maxDistance = this.baseMaxDistance;
    this.controls.maxPolarAngle = Math.PI / 1.5;
    this.controls.minPolarAngle = Math.PI / 4;
    this.controls.minDistance = 4;
  }

  updateCameraForAspectRatio() {
    const currentRatio = this.sizes.width / this.sizes.height;
    this.ratioOverflow = Math.max(1, this.idealRatio / currentRatio) - 1;

    const baseDistance = this.initialCameraPosition.length();
    const additionalDistance = baseDistance * this.ratioOverflow * 0.27;
    const direction = this.initialCameraPosition.clone().normalize();
    const newDistance = baseDistance + additionalDistance;
    const adjustedPosition = direction.multiplyScalar(newDistance);

    this.cameraInstance.position.copy(adjustedPosition);
    this.controls.maxDistance = Math.max(this.baseMaxDistance, newDistance);
  }

  resize() {
    const aspectRatio = this.sizes.width / this.sizes.height;
    this.cameraInstance.aspect = aspectRatio;
    this.cameraInstance.updateProjectionMatrix();
    this.updateCameraForAspectRatio();
  }

  update(mouseManager, deltaTime) {
    this.controls.update();

    if (deltaTime) {
      this.floatTime += deltaTime;

      let noiseX = 0,
        noiseY = 0,
        noiseZ = 0;
      let noiseRotX = 0,
        noiseRotY = 0,
        noiseRotZ = 0;

      if (this.randomness.enabled) {
        const noiseTime = this.floatTime * this.randomness.speed;
        const intensity = this.randomness.intensity;

        noiseX =
          this.smoothNoise(noiseTime, this.noiseOffsets.x) *
          this.floatAmplitude.x *
          intensity;
        noiseY =
          this.smoothNoise(noiseTime, this.noiseOffsets.y) *
          this.floatAmplitude.y *
          intensity;
        noiseZ =
          this.smoothNoise(noiseTime, this.noiseOffsets.z) *
          this.floatAmplitude.z *
          intensity;

        noiseRotX =
          this.smoothNoise(noiseTime * 0.7, this.noiseOffsets.rotX) *
          this.rotationAmplitude.x *
          intensity;
        noiseRotY =
          this.smoothNoise(noiseTime * 0.6, this.noiseOffsets.rotY) *
          this.rotationAmplitude.y *
          intensity;
        noiseRotZ =
          this.smoothNoise(noiseTime * 0.8, this.noiseOffsets.rotZ) *
          this.rotationAmplitude.z *
          intensity;
      }

      const floatX =
        Math.sin(this.floatTime * this.floatFrequency.x * Math.PI * 2) *
          this.floatAmplitude.x +
        Math.sin(this.floatTime * this.floatFrequency.x * 1.7 * Math.PI * 2) *
          this.floatAmplitude.x *
          0.3 +
        noiseX;

      const floatY =
        Math.sin(this.floatTime * this.floatFrequency.y * Math.PI * 2) *
          this.floatAmplitude.y +
        Math.sin(this.floatTime * this.floatFrequency.y * 0.6 * Math.PI * 2) *
          this.floatAmplitude.y *
          0.5 +
        noiseY;

      const floatZ =
        Math.sin(this.floatTime * this.floatFrequency.z * Math.PI * 2) *
          this.floatAmplitude.z +
        noiseZ;

      const rotX =
        Math.sin(this.floatTime * this.rotationFrequency.x * Math.PI * 2) *
          this.rotationAmplitude.x +
        noiseRotX;
      const rotY =
        Math.sin(this.floatTime * this.rotationFrequency.y * Math.PI * 2) *
          this.rotationAmplitude.y +
        noiseRotY;
      const rotZ =
        Math.sin(this.floatTime * this.rotationFrequency.z * Math.PI * 2) *
          this.rotationAmplitude.z +
        noiseRotZ;

      let parallaxX = 0;
      let parallaxY = 0;

      if (mouseManager) {
        parallaxX =
          mouseManager.smoothedMousePosition.x * this.parallaxAmplitude;
        parallaxY =
          -mouseManager.smoothedMousePosition.y * this.parallaxAmplitude;
      }

      const targetX = parallaxX + floatX;
      const targetY = parallaxY + floatY;
      const targetZ = floatZ;

      this.cameraGroup.position.x +=
        (targetX - this.cameraGroup.position.x) *
        this.parallaxEasingSpeed *
        deltaTime;
      this.cameraGroup.position.y +=
        (targetY - this.cameraGroup.position.y) *
        this.parallaxEasingSpeed *
        deltaTime;
      this.cameraGroup.position.z +=
        (targetZ - this.cameraGroup.position.z) *
        this.parallaxEasingSpeed *
        deltaTime;

      this.cameraGroup.rotation.x = rotX;
      this.cameraGroup.rotation.y = rotY;
      this.cameraGroup.rotation.z = rotZ;

      // Normalized parallax offset for shader use (world-to-view approximation).
      const fov = this.cameraInstance.fov * (Math.PI / 180);
      const distance = this.cameraInstance.position.length();
      const height = 2 * Math.tan(fov / 2) * distance;
      const width = height * this.cameraInstance.aspect;

      this.parallaxOffset.x = (this.cameraGroup.position.x / width) * 2;
      this.parallaxOffset.y = (this.cameraGroup.position.y / height) * 2;
    }
  }
}
