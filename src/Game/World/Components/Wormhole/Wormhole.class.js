import * as THREE from 'three';
import Game from '../../../Game.class';
import wormholeVertexShader from '../../../../Shaders/Wormhole/vertex.glsl';
import wormholeFragmentShader from '../../../../Shaders/Wormhole/fragment.glsl';

export default class Wormhole {
  constructor() {
    this.game = Game.getInstance();
    this.scene = this.game.scene;
    this.time = this.game.time;
    this.debug = this.game.debug;
    this.isDebugEnabled = this.game.isDebugEnabled;

    // Config - centered around origin (where dolphin is)
    this.config = {
      // Speedlines - symmetric around origin
      speedLineCount: 200,
      lineSpeed: 12,
      innerRadius: 20,
      outerRadius: 40,
      startZ: 100,
      endZ: -100,

      // Speed line colors
      speedLineColor1: new THREE.Color(0x00ffff), // Cyan
      speedLineColor2: new THREE.Color(0x00a1ff), // Light blue
      speedLineColor3: new THREE.Color(0x91cdff), // Purple

      // Tube config
      tubeRadius: 50,
      tubeSegments: 70,
      tubeRadialSegments: 30,
      tubeLength: 1000,
      tubeSpeed: 0.02,
      curvePoints: 5,
    };

    this.speedLines = [];
    this.tunnelGroup = new THREE.Group();
    this.scene.add(this.tunnelGroup);

    // Dark blue background
    this.scene.background = new THREE.Color(0x001235);

    this.createSpeedLines();
    this.createTube();

    if (this.isDebugEnabled) {
      this.initDebugGUI();
    }
  }

  initDebugGUI() {
    const folderName = 'Speed Lines';

    this.debug.add(
      this.config,
      'speedLineColor1',
      {
        label: 'Color 1 (Cyan)',
        onChange: () => this.updateSpeedLineColors(),
      },
      folderName
    );

    this.debug.add(
      this.config,
      'speedLineColor2',
      {
        label: 'Color 2 (Blue)',
        onChange: () => this.updateSpeedLineColors(),
      },
      folderName
    );

    this.debug.add(
      this.config,
      'speedLineColor3',
      {
        label: 'Color 3 (Purple)',
        onChange: () => this.updateSpeedLineColors(),
      },
      folderName
    );

    this.debug.add(
      this.config,
      'lineSpeed',
      {
        min: 1,
        max: 30,
        step: 0.5,
        label: 'Line Speed',
        onChange: (value) => {
          for (const line of this.speedLines) {
            line.speed = value * (0.5 + Math.random() * 0.5);
          }
        },
      },
      folderName
    );
  }

  updateSpeedLineColors() {
    const colors = [
      this.config.speedLineColor1,
      this.config.speedLineColor2,
      this.config.speedLineColor3,
    ];

    for (const line of this.speedLines) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      line.mesh.material.color.copy(color);
    }
  }

  createTube() {
    // Create curve points centered around origin
    const halfLength = this.config.tubeLength / 2;
    const curvePoints = [];
    for (let i = 0; i < this.config.curvePoints; i++) {
      const t = i / (this.config.curvePoints - 1);
      const z = halfLength - (this.config.tubeLength * t); // Goes from +halfLength to -halfLength
      curvePoints.push(new THREE.Vector3(0, 0, z));
    }

    // Create the curve
    const curve = new THREE.CatmullRomCurve3(curvePoints);

    this.tubeGeometry = new THREE.TubeGeometry(
      curve,
      this.config.tubeSegments,
      this.config.tubeRadius,
      this.config.tubeRadialSegments,
      false
    );

    // Manually adjust the radius by modifying vertices
    const positions = this.tubeGeometry.attributes.position.array;
    const verticesPerSegment = this.config.tubeRadialSegments + 1;

    for (let i = 0; i < this.config.tubeSegments + 1; i++) {
      const u = i / this.config.tubeSegments;
      const radiusScale = 1 - u * 0.8; // Scale from 1.0 to 0.2

      for (let j = 0; j < verticesPerSegment; j++) {
        const index = (i * verticesPerSegment + j) * 3;

        // Get the center point of this segment
        const centerPoint = curve.getPointAt(Math.min(u, 1));

        // Scale the distance from center
        const x = positions[index];
        const y = positions[index + 1];

        // Calculate offset from center and scale it
        const offsetX = x - centerPoint.x;
        const offsetY = y - centerPoint.y;

        positions[index] = centerPoint.x + offsetX * radiusScale;
        positions[index + 1] = centerPoint.y + offsetY * radiusScale;
      }
    }

    this.tubeGeometry.attributes.position.needsUpdate = true;
    this.tubeGeometry.computeVertexNormals();

    // Create material with custom shader - underwater colors
    this.tubeMaterial = new THREE.ShaderMaterial({
      vertexShader: wormholeVertexShader,
      fragmentShader: wormholeFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color(0x001a33) }, // Deep ocean blue
        uColor2: { value: new THREE.Color(0x0066cc) }, // Medium ocean blue
        uColor3: { value: new THREE.Color(0x00ddff) }, // Bright cyan (caustics)
        fogColor: { value: this.scene.fog ? this.scene.fog.color : new THREE.Color(0x001235) },
        fogNear: { value: this.scene.fog ? this.scene.fog.near : 1 },
        fogFar: { value: this.scene.fog ? this.scene.fog.far : 100 },
      },
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      fog: true,
    });

    // Create mesh - centered at origin
    this.tubeMesh = new THREE.Mesh(this.tubeGeometry, this.tubeMaterial);
    this.scene.add(this.tubeMesh);
  }

  createSpeedLines() {
    const colors = [
      this.config.speedLineColor1,
      this.config.speedLineColor2,
      this.config.speedLineColor3,
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

      // Converge toward center as Z decreases (0.2 at far end, 1.0 at near end)
      const radiusScale = 0.2 + normalizedZ * 0.8;
      const currentRadius = line.radius * radiusScale;

      // Update X and Y position to converge
      line.mesh.position.x = Math.cos(line.angle) * currentRadius;
      line.mesh.position.y = Math.sin(line.angle) * currentRadius;

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

    // Update shader time uniform
    if (this.tubeMaterial && this.tubeMaterial.uniforms) {
      this.tubeMaterial.uniforms.uTime.value += delta;
      
      // Update fog uniforms
      if (this.scene.fog) {
        this.tubeMaterial.uniforms.fogColor.value.copy(this.scene.fog.color);
        this.tubeMaterial.uniforms.fogNear.value = this.scene.fog.near;
        this.tubeMaterial.uniforms.fogFar.value = this.scene.fog.far;
      }
    }
  }

  dispose() {
    for (const line of this.speedLines) {
      line.mesh.geometry.dispose();
      line.mesh.material.dispose();
    }
    // Dispose tube
    if (this.tubeMesh) {
      this.tubeGeometry.dispose();
      this.tubeMaterial.dispose();
      this.scene.remove(this.tubeMesh);
    }

    this.scene.remove(this.tunnelGroup);
  }
}
