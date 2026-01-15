import Game from './Game/Game.class';
import ResourceLoader from './Game/Utils/ResourceLoader.class';
import ASSETS from './config/assets.js';

const isDebugMode =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('mode') === 'debug';

const loadingScreen = document.getElementById('loading-screen');
const loaderStatus = document.getElementById('loader-status');
const exploreButtons = document.getElementById('explore-buttons');
const btnWithMusic = document.getElementById('btn-with-music');
const btnWithoutMusic = document.getElementById('btn-without-music');
const uiLayer = document.getElementById('ui-layer');

const statDepth = document.getElementById('stat-depth');
const statSpeed = document.getElementById('stat-speed');
const statTime = document.getElementById('stat-time');
const depthBar = document.getElementById('depth-bar');
const speedBar = document.getElementById('speed-bar');
const coordDisplay = document.getElementById('coord-display');
const fpsDisplay = document.getElementById('fps-display');

const audioToggle = document.getElementById('audio-toggle');
const audioBtn = document.getElementById('audio-btn');
const audioLabel = document.getElementById('audio-label');
const audioIconOn = document.getElementById('audio-icon-on');
const audioIconOff = document.getElementById('audio-icon-off');

const bgm = new Audio('/assets/audio/bgm.mp3');
bgm.loop = true;
bgm.volume = 0.5;
let isAudioPlaying = false;

function setAudioState(playing) {
  isAudioPlaying = playing;
  if (playing) {
    bgm.play().catch((err) => console.warn('Audio play failed:', err));
    audioBtn.classList.remove('muted');
    audioLabel.classList.add('playing');
    audioLabel.textContent = 'SOUND ON';
    audioIconOn.style.display = 'block';
    audioIconOff.style.display = 'none';
  } else {
    bgm.pause();
    audioBtn.classList.add('muted');
    audioLabel.classList.remove('playing');
    audioLabel.textContent = 'SOUND OFF';
    audioIconOn.style.display = 'none';
    audioIconOff.style.display = 'block';
  }
}

function toggleAudio() {
  setAudioState(!isAudioPlaying);
}

if (audioToggle) {
  audioToggle.addEventListener('click', toggleAudio);
}

const resources = new ResourceLoader(ASSETS);

let gameStartTime = null;
let gameInstance = null;
let lastFrameTime = performance.now();
let frameCount = 0;
let fps = 60;

resources.on('progress', ({ id, itemsLoaded, itemsTotal, percent }) => {
  if (window.updateLoaderProgress) {
    window.updateLoaderProgress(percent);
  }

  if (isDebugMode) {
    console.log(
      `Loaded: "${id}" (${itemsLoaded}/${itemsTotal} — ${percent.toFixed(1)}%)`
    );
  }
});

resources.on('error', ({ id, url, itemsLoaded, itemsTotal }) => {
  console.error(
    `❌ Failed to load "${id}" at "${url}" (${itemsLoaded}/${itemsTotal})`
  );
});

resources.on('loaded', () => {
  if (isDebugMode) {
    console.log(
      Object.keys(resources.items).length
        ? '✅ Assets loaded!'
        : '☑️ No assets to load.'
    );
  }

  if (window.updateLoaderProgress) {
    window.updateLoaderProgress(100);
  }

  setTimeout(() => {
    exploreButtons.classList.add('visible');
  }, 500);

  gameInstance = new Game(
    document.getElementById('three'),
    resources,
    isDebugMode
  );
});

function enterExperience(withMusic) {
  loadingScreen.classList.add('hidden');
  uiLayer.classList.add('visible');
  gameStartTime = Date.now();
  startHUDUpdates();

  setAudioState(withMusic);

  if (window.textGlitch) {
    window.textGlitch.register(document.getElementById('hud-logo'));
    window.textGlitch.register(document.getElementById('hud-telemetry'));
    window.textGlitch.register(document.getElementById('hud-controls'));
    window.textGlitch.register(document.getElementById('hud-status'));
    window.textGlitch.start();
  }
}

if (btnWithMusic) {
  btnWithMusic.addEventListener('click', () => enterExperience(true));
}
if (btnWithoutMusic) {
  btnWithoutMusic.addEventListener('click', () => enterExperience(false));
}

function startHUDUpdates() {
  requestAnimationFrame(updateLoop);
}

function updateLoop(timestamp) {
  frameCount++;
  if (timestamp - lastFrameTime >= 1000) {
    fps = frameCount;
    frameCount = 0;
    lastFrameTime = timestamp;
    if (fpsDisplay) fpsDisplay.textContent = fps;
  }

  updateHUD();
  requestAnimationFrame(updateLoop);
}

function updateHUD() {
  if (gameStartTime && statTime) {
    const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
    const mins = Math.floor(elapsed / 60)
      .toString()
      .padStart(2, '0');
    const secs = (elapsed % 60).toString().padStart(2, '0');
    statTime.textContent = `${mins}:${secs}`;
  }

  // Simulated telemetry placeholder; hook into real game state for actual values.
  const t = Date.now();

  if (statDepth) {
    const depth = Math.floor(50 + Math.sin(t / 2000) * 30);
    statDepth.textContent = depth;
    if (depthBar) depthBar.style.width = `${(depth / 100) * 100}%`;
  }

  if (statSpeed) {
    const speed = (2 + Math.sin(t / 1500) * 1.5).toFixed(1);
    statSpeed.textContent = speed;
    if (speedBar) speedBar.style.width = `${(speed / 5) * 100}%`;
  }

  if (coordDisplay && gameInstance?.camera?.cameraInstance) {
    const pos = gameInstance.camera.cameraInstance.position;
    coordDisplay.textContent = `X:${pos.x.toFixed(0)} Y:${pos.y.toFixed(
      0
    )} Z:${pos.z.toFixed(0)}`;
  }
}
