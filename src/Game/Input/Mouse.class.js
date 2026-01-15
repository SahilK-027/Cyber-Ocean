import * as THREE from 'three';
import EventEmitter from '../Utils/EventEmitter.class';

export default class Mouse extends EventEmitter {
  constructor() {
    super();

    // Raw mouse position (-1 to 1 normalized)
    this.mousePosition = new THREE.Vector2(0, 0);
    // Smoothed mouse position for parallax
    this.smoothedMousePosition = new THREE.Vector2(0, 0);
    // Smoothing factor (higher = faster response)
    this.smoothingFactor = 5;

    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener('mousemove', (event) => {
      // Normalize to -1 to 1 range
      this.mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mousePosition.y = (event.clientY / window.innerHeight) * 2 - 1;

      this.trigger('mousemove', [this.mousePosition]);
    });

    // Handle touch for mobile
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
    // Smooth interpolation towards target mouse position
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
