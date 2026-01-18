import * as THREE from 'three';
import Game from '../Game.class';
import Lighting from './Components/Lighting/Lighting.class';
import Dolphin from './Components/Dolphin/Dolphin.class';
import Wormhole from './Components/Wormhole/Wormhole.class';
import FlowField from './Components/FlowField/FlowField.class';
import WakeParticles from './Components/WakeParticles/WakeParticles.class';
import Seabed from './Components/Seabed/Seabed.class';

export default class World {
  constructor() {
    this.game = Game.getInstance();
    this.scene = this.game.scene;
    this.scene.fog = new THREE.Fog(0x121316, 60, 180);

    this.lighting = new Lighting({ helperEnabled: false });

    this.seabed = new Seabed();
    this.wormhole = new Wormhole();
    this.flowField = new FlowField();
    this.dolphin = new Dolphin();
    this.wakeParticles = new WakeParticles(this.dolphin);
  }

  update() {
    // Get camera frustum for culling
    const camera = this.game.camera.cameraInstance;
    const frustum = new THREE.Frustum();
    const cameraMatrix = new THREE.Matrix4();
    cameraMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(cameraMatrix);

    // Update order optimized: simpler systems first, complex ones last
    if (this.seabed) {
      this.seabed.update();
    }
    if (this.wormhole) {
      this.wormhole.update();
    }
    if (this.flowField) {
      // Only update FlowField if visible
      if (this.flowField.points && frustum.intersectsObject(this.flowField.points)) {
        this.flowField.update();
      }
    }
    if (this.dolphin) {
      this.dolphin.update();
    }
    if (this.wakeParticles) {
      this.wakeParticles.update();
    }
  }
}
