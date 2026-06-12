import { InputManager } from './InputManager.js';
import { Environment } from './Environment.js';
import { Player } from './Player.js';
import { TrafficManager } from './TrafficManager.js';

export class Game {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    
    this.input = new InputManager();
    this.env = new Environment(scene);
    this.player = new Player(scene, this.input);
    this.traffic = new TrafficManager(scene);

    this.state = 'START'; // START, PLAYING, GAME_OVER
    this.isPaused = false;
    this.cameraModeIndex = 0; // 0: 3rd, 1: 1st, 2: 2nd
    this.cameraModeNames = ['🎥 CAM: 3RD', '🎥 CAM: 1ST', '🎥 CAM: 2ND'];
    
    this.baseSpeed = 80;
    this.speed = this.baseSpeed;
    this.maxSpeed = 250;
    this.distance = 0;

    // UI Elements
    this.ui = {
      hud: document.getElementById('hud'),
      startMenu: document.getElementById('start-menu'),
      gameOverMenu: document.getElementById('game-over-menu'),
      score: document.getElementById('score'),
      speed: document.getElementById('speed'),
      finalScore: document.getElementById('final-score-val'),
      startBtn: document.getElementById('start-btn'),
      restartBtn: document.getElementById('restart-btn'),
    };

    this.initUI();
  }

  initUI() {
    this.ui.startBtn.addEventListener('click', () => this.startGame());
    this.ui.restartBtn.addEventListener('click', () => this.restartGame());

    const cameraBtn = document.getElementById('camera-btn');
    if (cameraBtn) {
      cameraBtn.addEventListener('click', () => {
        this.cameraModeIndex = (this.cameraModeIndex + 1) % 3;
        cameraBtn.innerText = this.cameraModeNames[this.cameraModeIndex];
      });
    }

    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        if (this.state === 'PLAYING') {
          this.isPaused = !this.isPaused;
          if (this.isPaused) {
            pauseBtn.innerText = "▶ RESUME";
            pauseBtn.classList.add('active');
          } else {
            pauseBtn.innerText = "⏸ PAUSE";
            pauseBtn.classList.remove('active');
          }
        }
      });
    }

    const menuBtn = document.getElementById('menu-btn');
    if (menuBtn) {
      menuBtn.addEventListener('click', () => {
        this.backToMenu();
      });
    }

    const togglePanelBtn = document.getElementById('toggle-panel-btn');
    const controlPanel = document.getElementById('control-panel');
    if (togglePanelBtn && controlPanel) {
      togglePanelBtn.addEventListener('click', () => {
        controlPanel.classList.toggle('closed');
      });
    }

    // Bind Control Panel Buttons
    const ctrlBtns = document.querySelectorAll('.ctrl-btn');
    ctrlBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = e.target.getAttribute('data-type');
        const val = e.target.getAttribute('data-val');

        // Update active class for the specific group
        const groupBtns = document.querySelectorAll(`.ctrl-btn[data-type="${type}"]`);
        groupBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        // Call environment methods
        if (type === 'time') this.env.setTime(val);
        if (type === 'season') this.env.setSeason(val);
        if (type === 'weather') this.env.setWeather(val);
        if (type === 'theme') this.env.setTheme(val);
      });
    });
  }

  startGame() {
    this.state = 'PLAYING';
    this.distance = 0;
    this.speed = this.baseSpeed;
    this.traffic.reset();
    
    this.ui.startMenu.classList.add('hidden');
    this.ui.gameOverMenu.classList.add('hidden');
    this.ui.hud.classList.remove('hidden');
  }

  restartGame() {
    this.player.mesh.position.x = 0;
    this.player.currentLane = 1;
    this.player.targetX = 0;
    this.startGame();
  }

  backToMenu() {
    this.state = 'START';
    this.isPaused = false;
    
    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) {
      pauseBtn.innerText = "⏸ PAUSE";
      pauseBtn.classList.remove('active');
    }

    this.ui.hud.classList.add('hidden');
    this.ui.gameOverMenu.classList.add('hidden');
    this.ui.startMenu.classList.remove('hidden');
  }

  gameOver() {
    this.state = 'GAME_OVER';
    this.ui.hud.classList.add('hidden');
    this.ui.gameOverMenu.classList.remove('hidden');
    this.ui.finalScore.innerText = Math.floor(this.distance);
  }

  update(dt) {
    if (this.state !== 'PLAYING') {
        // Still update camera to look nice in menu
        this.camera.position.x += (0 - this.camera.position.x) * dt * 5;
        return;
    }

    if (this.isPaused) return;

    // Speed up logic
    if (this.input.keys.up) {
      this.speed += 50 * dt;
    } else if (this.input.keys.down) {
      this.speed -= 100 * dt;
    } else {
      this.speed += 2 * dt; // gradual passive speed increase
    }

    this.speed = Math.max(this.baseSpeed, Math.min(this.speed, this.maxSpeed));
    this.distance += (this.speed / 10) * dt;

    this.ui.score.innerText = Math.floor(this.distance).toString().padStart(4, '0');
    this.ui.speed.innerText = Math.floor(this.speed).toString().padStart(3, '0');

    // Dynamic FOV based on speed
    const targetFov = 60 + (this.speed / this.maxSpeed) * 30;
    this.camera.fov += (targetFov - this.camera.fov) * dt * 2;
    this.camera.updateProjectionMatrix();

    // Camera modes logic
    if (this.cameraModeIndex === 0) {
      // 3rd Person
      const targetX = this.player.mesh.position.x * 0.3;
      this.camera.position.x += (targetX - this.camera.position.x) * dt * 5;
      this.camera.position.y += (8 - this.camera.position.y) * dt * 5;
      this.camera.position.z += (15 - this.camera.position.z) * dt * 5;
      this.camera.lookAt(this.camera.position.x, 0, -20);
    } else if (this.cameraModeIndex === 1) {
      // 1st Person (Cockpit)
      const targetX = this.player.mesh.position.x;
      this.camera.position.x += (targetX - this.camera.position.x) * dt * 10;
      this.camera.position.y += (1.8 - this.camera.position.y) * dt * 10;
      this.camera.position.z += (-1.0 - this.camera.position.z) * dt * 10;
      this.camera.lookAt(targetX, 1.5, -50);
      this.camera.rotation.z = this.player.mesh.rotation.z * 0.5;
    } else if (this.cameraModeIndex === 2) {
      // 2nd Person (Bumper/Hood)
      const targetX = this.player.mesh.position.x;
      this.camera.position.x += (targetX - this.camera.position.x) * dt * 10;
      this.camera.position.y += (1.0 - this.camera.position.y) * dt * 10;
      this.camera.position.z += (-3.0 - this.camera.position.z) * dt * 10;
      this.camera.lookAt(targetX, 1.0, -50);
      this.camera.rotation.z = this.player.mesh.rotation.z * 0.5;
    }

    // Update Entities
    this.env.update(this.speed, dt);
    this.player.update(dt);
    this.traffic.update(dt, this.speed, this.player.box);

    // Collision
    if (this.traffic.checkCollision(this.player.box)) {
      this.gameOver();
    }
  }
}
