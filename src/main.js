import './style.css';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

import { Game } from './Game.js';

const app = document.getElementById('app');

// Scene setup
const scene = new THREE.Scene();

// Camera setup
const getW = () => app.clientWidth || window.innerWidth;
const getH = () => app.clientHeight || window.innerHeight;

const camera = new THREE.PerspectiveCamera(60, getW() / getH(), 0.1, 1000);
// Position camera slightly above and behind the player (player is at z=0)
camera.position.set(0, 8, 15);
camera.lookAt(0, 0, -20);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(getW(), getH());
const pixelRatio = Math.min(window.devicePixelRatio, 1.5); // Cap to 1.5 to prevent lag on 4K/Retina displays
renderer.setPixelRatio(pixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
app.appendChild(renderer.domElement);

// Post-processing setup with MSAA (Multisampled Anti-Aliasing for WebGL2)
const renderTarget = new THREE.WebGLRenderTarget(
  getW() * pixelRatio, 
  getH() * pixelRatio, 
  { samples: 2 } // 2x MSAA is enough for crispness while maintaining 60fps
);

const composer = new EffectComposer(renderer, renderTarget);

const renderScene = new RenderPass(scene, camera);
composer.addPass(renderScene);

// Resolution, strength, radius, threshold
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(getW() * pixelRatio, getH() * pixelRatio), 
  0.6, 0.5, 1.5 // Increased threshold to 1.5 (so only super-bright HDR things glow)
);
composer.addPass(bloomPass);

const outputPass = new OutputPass();
composer.addPass(outputPass);

// Game Instance
const game = new Game(scene, camera);

// Resize handler
window.addEventListener('resize', () => {
  const w = getW();
  const h = getH();
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  
  const pr = renderer.getPixelRatio();
  renderTarget.setSize(w * pr, h * pr);
  composer.setSize(w, h);
});

// Animation Loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  
  // Cap dt to prevent huge jumps if tab is inactive
  const safeDt = Math.min(dt, 0.1);

  game.update(safeDt);
  
  composer.render();
}

animate();
