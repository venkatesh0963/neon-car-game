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
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
// Position camera slightly above and behind the player (player is at z=0)
camera.position.set(0, 8, 15);
camera.lookAt(0, 0, -20);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
const pixelRatio = Math.min(window.devicePixelRatio, 1.5); // Cap to 1.5 to prevent lag on 4K/Retina displays
renderer.setPixelRatio(pixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
app.appendChild(renderer.domElement);

// Post-processing setup with MSAA (Multisampled Anti-Aliasing for WebGL2)
const renderTarget = new THREE.WebGLRenderTarget(
  window.innerWidth * pixelRatio, 
  window.innerHeight * pixelRatio, 
  { samples: 2 } // 2x MSAA is enough for crispness while maintaining 60fps
);

const composer = new EffectComposer(renderer, renderTarget);

const renderScene = new RenderPass(scene, camera);
composer.addPass(renderScene);

// Resolution, strength, radius, threshold
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth * pixelRatio, window.innerHeight * pixelRatio), 
  0.6, 0.5, 1.5 // Increased threshold to 1.5 (so only super-bright HDR things glow)
);
composer.addPass(bloomPass);

const outputPass = new OutputPass();
composer.addPass(outputPass);

// Game Instance
const game = new Game(scene, camera);

// Resize handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  
  const pixelRatio = renderer.getPixelRatio();
  renderTarget.setSize(window.innerWidth * pixelRatio, window.innerHeight * pixelRatio);
  composer.setSize(window.innerWidth, window.innerHeight);
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
