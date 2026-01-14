import * as THREE from 'three';
import Game from '../../../Game.class';

export default class Wormhole {
  constructor() {
    this.game = Game.getInstance();
    this.scene = this.game.scene;
    this.time = this.game.time;

    // Config
    this.config = {
      speedLineCount: 400,
      lineSpeed: 40,
      // Cylinder parameters - lines arranged in a ring, not passing through center
      innerRadius: 20,
      outerRadius: 40,
      // Z range
      startZ: 30,
      endZ: -80,
    };

    this.speedLines = [];
    this.tunnelGroup = new THREE.Group();
    this.scene.add(this.tunnelGroup);

    // Dark blue background
    this.scene.background = new THREE.Color(0x001235);

    this.createSpeedLines();
  }

  createSpeedLines() {
    const colors = [
      new THREE.Color(0x00ffff), // Cyan
      new THREE.Color(0xff00aa), // Magenta
      new THREE.Color(0x00aaff), // Light blue
      new THREE.Color(0xfd2b85), // Pink
    ];

    for (let i = 0; i < this.config.speedLineCount; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const line = this.createSpeedLine(color);
      this.speedLines.push(line);
      this.tunnelGroup.add(line.mesh);
    }
  }

  createSpeedLine(color) {
    const length = 2 + Math.random() * 6;
    const thickness = 0.05 + Math.random() * 0.1;

    // Box aligned along Z axis
    const geometry = new THREE.BoxGeometry(thickness, thickness, length);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.9,
    });

    const mesh = new THREE.Mesh(geometry, material);

    // Position in cylindrical ring (X, Y) - NOT passing through center
    const angle = Math.random() * Math.PI * 2;
    const radius =
      this.config.innerRadius +
      Math.random() * (this.config.outerRadius - this.config.innerRadius);

    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    // Random Z position along the tunnel
    const z =
      this.config.startZ +
      Math.random() * (this.config.endZ - this.config.startZ);

    mesh.position.set(x, y, z);

    // No rotation - lines stay parallel to Z axis

    return {
      mesh,
      angle,
      radius,
      speed: this.config.lineSpeed * (0.5 + Math.random() * 0.5),
      baseOpacity: 0.6 + Math.random() * 0.4,
    };
  }

  update() {
    const delta = this.time.delta;

    for (const line of this.speedLines) {
      // Move along Z axis (positive to negative)
      line.mesh.position.z -= line.speed * delta;

      // Reset when past end
      if (line.mesh.position.z < this.config.endZ) {
        line.mesh.position.z = this.config.startZ;
      }

      // Fade based on Z position
      const zRange = this.config.startZ - this.config.endZ;
      const normalizedZ = (line.mesh.position.z - this.config.endZ) / zRange;

      // Fade in at start, fade out at end
      let opacity;
      if (normalizedZ > 0.9) {
        opacity = (1 - normalizedZ) * 10; // Fade in
      } else if (normalizedZ < 0.1) {
        opacity = normalizedZ * 10; // Fade out
      } else {
        opacity = 1;
      }
      line.mesh.material.opacity = opacity * line.baseOpacity;

      // Scale based on Z (smaller far away, larger close)
      const scale = 0.3 + normalizedZ * 0.7;
      line.mesh.scale.set(scale, scale, 1);
    }
  }

  dispose() {
    for (const line of this.speedLines) {
      line.mesh.geometry.dispose();
      line.mesh.material.dispose();
    }

    this.scene.remove(this.tunnelGroup);
  }
}
