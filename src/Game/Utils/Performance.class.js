import { ThreePerf } from 'three-perf';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import Game from '../Game.class';

export default class PerformanceMonitor {
  constructor(renderer) {
    this.game = Game.getInstance();
    this.renderer = renderer;
    this.debug = this.game.debug;
    this.isDebugEnabled = this.game.isDebugEnabled;

    this.metrics = {
      fps: 0,
      frameTime: 0,
      memory: 0,
      drawCalls: 0,
      triangles: 0,
    };

    this.stats = new ThreePerf({
      domElement: document.body,
      renderer: this.renderer,
      showGraph: false,
      memory: true,
      anchorX: 'left',
      anchorY: 'top',
    });
    
    this.statsNative = new Stats();
    this.statsNative.dom.style.top = '70px';
    document.body.append(this.statsNative.dom);

    this.lastTime = performance.now();
    this.frameCount = 0;
    this.fpsUpdateInterval = 500;
    this.lastFpsUpdate = 0;

    if (this.isDebugEnabled) {
      this.initTweakPane();
    }
  }

  beginFrame() {
    if (this.stats.enabled) this.stats.begin();
  }

  endFrame() {
    if (this.stats.enabled) this.stats.end();
    this.statsNative.update();
    this.updateMetrics();
  }

  updateMetrics() {
    const now = performance.now();
    this.frameCount++;

    if (now - this.lastFpsUpdate >= this.fpsUpdateInterval) {
      const elapsed = now - this.lastFpsUpdate;
      this.metrics.fps = Math.round((this.frameCount * 1000) / elapsed);
      this.metrics.frameTime = parseFloat((elapsed / this.frameCount).toFixed(2));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }

    const info = this.renderer.info;
    this.metrics.drawCalls = info.render.calls;
    this.metrics.triangles = info.render.triangles;

    if (performance.memory) {
      this.metrics.memory = Math.round(performance.memory.usedJSHeapSize / 1048576);
    }
  }

  initTweakPane() {
    this.debug.addMonitor(this.metrics, 'fps', {
      label: 'FPS',
      graph: true,
      min: 0,
      max: 144,
    }, 'Performance');

    if (performance.memory) {
      this.debug.addMonitor(this.metrics, 'memory', {
        label: 'Memory (MB)',
      }, 'Performance');
    }

    this.debug.addSeparator('Performance');

    this.debug.add(this.stats, 'showGraph', { label: 'Perf Graph' }, 'Performance');
  }
}
