import * as THREE from 'three';
import Game from '../Game.class';
import Lighting from './Components/Lighting/Lighting.class';
import Dolphin from './Components/Dolphin/Dolphin.class';
import Wormhole from './Components/Wormhole/Wormhole.class';

export default class World {
  constructor() {
    this.game = Game.getInstance();
    this.scene = this.game.scene;

    /**
     * Scene objects
     */
    this.scene.fog = new THREE.FogExp2(0x0a0a1a, 0.008);
    this.lighting = new Lighting({ helperEnabled: false });

    this.wormhole = new Wormhole();
    this.dolphin = new Dolphin();
  }

  update() {
    if (this.wormhole) {
      this.wormhole.update();
    }
    if (this.dolphin) {
      this.dolphin.update();
    }
  }
}
