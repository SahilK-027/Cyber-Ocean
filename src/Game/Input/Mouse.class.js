import * as THREE from 'three';
import EventEmitter from '../Utils/EventEmitter.class';

export default class Mouse extends EventEmitter {
  constructor() {
    super();

    this.mousePosition = new THREE.Vector2(0, 0);
    this.smoothedMousePosition = new THREE.Vector2(0, 0);
    this.smoothingFactor = 5;

    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener('mousemove', (event) => {
      this.mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mousePosition.y = (event.clientY / window.innerHeight) * 2 - 1;

      this.trigger('mousemove', [this.mousePosition]);
    });

    window.addEventListener('touchmove', (event) => {
      if (event.touches.length > 0) {
        const touch = event.touches[0];
        this.mousePosition.x = (touch.clientX / window.innerWidth) * 2 - 1;
        this.mousePosition.y = (touch.clientY / window.innerHeight) * 2 - 1;

        this.trigger('touchmove', [this.mousePosition]);
      }
    });
  }

  update(deltaTime) {
    this.smoothedMousePosition.x +=
      (this.mousePosition.x - this.smoothedMousePosition.x) *
      this.smoothingFactor *
      deltaTime;
    this.smoothedMousePosition.y +=
      (this.mousePosition.y - this.smoothedMousePosition.y) *
      this.smoothingFactor *
      deltaTime;
  }
}
