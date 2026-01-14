import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import vertexShader from '../../../../Shaders/Dolphin/vertex.glsl';
import fragmentShader from '../../../../Shaders/Dolphin/fragment.glsl';
import sparkleVertexShader from '../../../../Shaders/Dolphin/sparkleVertex.glsl';
import sparkleFragmentShader from '../../../../Shaders/Dolphin/sparkleFragment.glsl';
import Game from '../../../Game.class';

export default class Dolphin {
  constructor() {
    this.game = Game.getInstance();
    this.scene = this.game.scene;
    this.resources = this.game.resources;
    this.time = this.game.time;

    this.modelResource = this.resources.items.dolphinAnimatedModel;

    this.outset = 0.01;
    this._tmpBasePos = new THREE.Vector3();
    this._tmpSkinned = new THREE.Vector3();
    this._tmpLocalOut = new THREE.Vector3();
    this._tmpNormal = new THREE.Vector3();

    this.setMaterial();
    this.setModelInstance();
    this.setAnimation();
    this.setupSurfaceSampling();
    this.setDebug();
  }

  setMaterial() {
    this.material = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      // side: THREE.DoubleSide,
      // transparent: true,
      // depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uBaseColor: { value: new THREE.Color(0x00a5e8) },
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
    this.dolphin.position.set(0, 0, 0.75);
    this.dolphin.rotation.set(0, 0, 0);

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

    // Sparkle controls
    if (this.sparklesMaterial) {
      debug.add(
        this.sparklesMaterial.uniforms.uSize,
        'value',
        {
          min: 1,
          max: 50,
          step: 1,
          label: 'Sparkle Size',
        },
        'Dolphin'
      );

      debug.add(
        this.sparklesMaterial.uniforms.uColor1,
        'value',
        {
          label: 'Sparkle Color 1',
        },
        'Dolphin'
      );

      debug.add(
        this.sparklesMaterial.uniforms.uColor2,
        'value',
        {
          label: 'Sparkle Color 2',
        },
        'Dolphin'
      );

      debug.add(
        this,
        'connectionDistance',
        {
          min: 0.1,
          max: 1.0,
          step: 0.05,
          label: 'Connection Dist',
        },
        'Dolphin'
      );

      debug.add(
        this.linesMaterial,
        'opacity',
        {
          min: 0,
          max: 1,
          step: 0.1,
          label: 'Line Opacity',
        },
        'Dolphin'
      );
    }

    // Material controls
    const materialSettings = {
      wireframe: false,
      visible: true,
      sparklesVisible: true,
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

    debug.add(
      materialSettings,
      'sparklesVisible',
      {
        label: 'Sparkles Visible',
        onChange: (value) => {
          if (this.sparkles) this.sparkles.visible = value;
          if (this.lines) this.lines.visible = value;
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

    // Update sparkles to follow animated mesh
    if (this.sparkles && this.dolphinMesh) {
      this.updateSparklePositions();
    }

    if (this.sparklesMaterial?.uniforms.uTime) {
      this.sparklesMaterial.uniforms.uTime.value = this.time.elapsedTime;
    }
  }

  setupSurfaceSampling() {
    // Find the skinned mesh in the dolphin model
    this.dolphinMesh = null;
    this.dolphin.traverse((child) => {
      if (child.isSkinnedMesh) {
        this.dolphinMesh = child;
      }
    });

    if (!this.dolphinMesh) {
      console.warn('No skinned mesh found for surface sampling');
      return;
    }

    // Number of sparkle points - reduced for plexus effect
    this.sparkleCount = 1000;
    this.connectionDistance = 0.15; // Max distance for connecting lines

    // Create a sampler from the dolphin mesh
    this.sampler = new MeshSurfaceSampler(this.dolphinMesh)
      .setWeightAttribute(null)
      .build();

    // Sample points and store vertex indices for skinning
    this.sampledData = [];
    const tempPosition = new THREE.Vector3();
    const tempNormal = new THREE.Vector3();
    const geometry = this.dolphinMesh.geometry;
    const posAttr = geometry.getAttribute('position');

    for (let i = 0; i < this.sparkleCount; i++) {
      this.sampler.sample(tempPosition, tempNormal);

      // Find closest vertex index for bone transform
      let closestIndex = 0;
      let closestDist = Infinity;
      const searchVec = new THREE.Vector3();

      for (let v = 0; v < posAttr.count; v++) {
        searchVec.fromBufferAttribute(posAttr, v);
        const dist = searchVec.distanceToSquared(tempPosition);
        if (dist < closestDist) {
          closestDist = dist;
          closestIndex = v;
        }
      }

      this.sampledData.push({
        vertexIndex: closestIndex,
        offset: tempPosition
          .clone()
          .sub(new THREE.Vector3().fromBufferAttribute(posAttr, closestIndex)),
        normal: tempNormal.clone(),
        random: Math.random(),
        size: Math.random() * 0.5 + 0.5,
      });
    }

    // Create geometry for sparkles (nodes)
    const positions = new Float32Array(this.sparkleCount * 3);
    const randoms = new Float32Array(this.sparkleCount);
    const sizes = new Float32Array(this.sparkleCount);

    for (let i = 0; i < this.sparkleCount; i++) {
      randoms[i] = this.sampledData[i].random;
      sizes[i] = this.sampledData[i].size;
    }

    this.sparklesGeometry = new THREE.BufferGeometry();
    this.sparklesGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );
    this.sparklesGeometry.setAttribute(
      'aRandom',
      new THREE.BufferAttribute(randoms, 1)
    );
    this.sparklesGeometry.setAttribute(
      'aSize',
      new THREE.BufferAttribute(sizes, 1)
    );

    // Create material for sparkles (glowing nodes)
    this.sparklesMaterial = new THREE.ShaderMaterial({
      vertexShader: sparkleVertexShader,
      fragmentShader: sparkleFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 50.0 },
        uColor1: { value: new THREE.Color(0x103b72) },
        uColor2: { value: new THREE.Color(0x7c61ff) },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
    });

    // Create points (nodes)
    this.sparkles = new THREE.Points(
      this.sparklesGeometry,
      this.sparklesMaterial
    );
    this.sparkles.frustumCulled = false;

    // Create lines geometry for connections
    this.setupConnectionLines();

    // Add to scene (not dolphin, we'll update positions manually in world space)
    this.scene.add(this.sparkles);

    // Debug: check which skinning method is available
    console.log('SkinnedMesh methods:', {
      applyBoneTransform: !!this.dolphinMesh.applyBoneTransform,
      boneTransform: !!this.dolphinMesh.boneTransform,
      skeleton: !!this.dolphinMesh.skeleton,
      isSkinnedMesh: this.dolphinMesh.isSkinnedMesh,
    });

    // Initialize positions on first frame
    this.updateSparklePositions();
  }

  setupConnectionLines() {
    // Pre-calculate max possible connections
    const maxConnections = this.sparkleCount * 10; // Estimate
    this.linePositions = new Float32Array(maxConnections * 6); // 2 points per line, 3 coords each
    this.lineColors = new Float32Array(maxConnections * 6); // RGB for each vertex

    this.linesGeometry = new THREE.BufferGeometry();
    this.linesGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.linePositions, 3)
    );
    this.linesGeometry.setAttribute(
      'color',
      new THREE.BufferAttribute(this.lineColors, 3)
    );
    this.linesGeometry.setDrawRange(0, 0);

    this.linesMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.lines = new THREE.LineSegments(this.linesGeometry, this.linesMaterial);
    this.lines.frustumCulled = false;
    this.scene.add(this.lines);
  }

  updateSparklePositions() {
    if (!this.dolphinMesh || !this.sparklesGeometry) return;

    const positionAttribute = this.sparklesGeometry.getAttribute('position');

    // ensure skeleton/matrices are up-to-date
    if (this.dolphinMesh.skeleton) this.dolphinMesh.skeleton.update();
    this.dolphinMesh.updateMatrixWorld(true);

    // local reusable temps
    const basePos = this._tmpBasePos;
    const skinned = this._tmpSkinned;
    const localOut = this._tmpLocalOut;
    const normalV = this._tmpNormal;

    const posAttr = this.dolphinMesh.geometry.getAttribute('position');

    const skinnedPositions = []; // used to make connection lines

    // Loop sparkles
    for (let i = 0; i < this.sparkleCount; i++) {
      const data = this.sampledData[i];

      // read base vertex local position
      basePos.fromBufferAttribute(posAttr, data.vertexIndex);

      // compute local point offset along sampled normal (local space)
      if (data.normal) {
        normalV.copy(data.normal).normalize();
        localOut.copy(basePos).addScaledVector(normalV, this.outset);
      } else {
        // fallback: use stored offset (less ideal)
        localOut.copy(basePos).add(data.offset);
      }

      // Apply skinning transform. We use the vertexIndex as the skin weights anchor so
      // the offset follows the same bone blend as the vertex — a small approximation but works well.
      if (this.dolphinMesh.applyBoneTransform) {
        // newer API
        skinned.copy(localOut);
        this.dolphinMesh.applyBoneTransform(data.vertexIndex, skinned);
        skinned.applyMatrix4(this.dolphinMesh.matrixWorld);
      } else if (this.dolphinMesh.boneTransform) {
        // older API
        skinned.copy(localOut);
        this.dolphinMesh.boneTransform(data.vertexIndex, skinned);
        skinned.applyMatrix4(this.dolphinMesh.matrixWorld);
      } else {
        // fallback: world transform without skinning
        skinned.copy(localOut).applyMatrix4(this.dolphinMesh.matrixWorld);
      }

      // write to particles buffer (world coords)
      positionAttribute.array[i * 3] = skinned.x;
      positionAttribute.array[i * 3 + 1] = skinned.y;
      positionAttribute.array[i * 3 + 2] = skinned.z;

      skinnedPositions.push(skinned.clone()); // clone for distance tests later
    }

    positionAttribute.needsUpdate = true;

    // update connection lines
    this.updateConnectionLines(skinnedPositions);
  }

  updateConnectionLines(positions) {
    let lineIndex = 0;
    const color1 = this.sparklesMaterial.uniforms.uColor1.value;
    const color2 = this.sparklesMaterial.uniforms.uColor2.value;

    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dist = positions[i].distanceTo(positions[j]);

        if (dist < this.connectionDistance) {
          // Fade based on distance
          const alpha = 1.0 - dist / this.connectionDistance;

          // Line start point
          this.linePositions[lineIndex * 6] = positions[i].x;
          this.linePositions[lineIndex * 6 + 1] = positions[i].y;
          this.linePositions[lineIndex * 6 + 2] = positions[i].z;

          // Line end point
          this.linePositions[lineIndex * 6 + 3] = positions[j].x;
          this.linePositions[lineIndex * 6 + 4] = positions[j].y;
          this.linePositions[lineIndex * 6 + 5] = positions[j].z;

          // Colors with alpha baked in
          const mixedColor = color1
            .clone()
            .lerp(color2, this.sampledData[i].random);
          this.lineColors[lineIndex * 6] = mixedColor.r * alpha;
          this.lineColors[lineIndex * 6 + 1] = mixedColor.g * alpha;
          this.lineColors[lineIndex * 6 + 2] = mixedColor.b * alpha;

          this.lineColors[lineIndex * 6 + 3] = mixedColor.r * alpha;
          this.lineColors[lineIndex * 6 + 4] = mixedColor.g * alpha;
          this.lineColors[lineIndex * 6 + 5] = mixedColor.b * alpha;

          lineIndex++;

          // Safety check
          if (lineIndex >= this.linePositions.length / 6) break;
        }
      }
      if (lineIndex >= this.linePositions.length / 6) break;
    }

    this.linesGeometry.attributes.position.needsUpdate = true;
    this.linesGeometry.attributes.color.needsUpdate = true;
    this.linesGeometry.setDrawRange(0, lineIndex * 2);
  }
}
