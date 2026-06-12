import * as THREE from 'three';

export class Player {
  constructor(scene, input) {
    this.scene = scene;
    this.input = input;

    this.lanes = [-10, 0, 10]; // X positions of 3 lanes
    this.currentLane = 1; // Middle lane
    this.targetX = this.lanes[this.currentLane];

    this.canChangeLane = true;
    
    this.initVehicle();
    this.initAIPath();
  }

  initVehicle() {
    this.mesh = new THREE.Group();
    
    // Chassis - Pure White (#FFFFFF)
    const bodyGeo = new THREE.BoxGeometry(2.5, 1, 5);
    const bodyMat = new THREE.MeshLambertMaterial({ 
      color: 0xFFFFFF
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.5;
    body.castShadow = true;
    
    // Cockpit / Highlights - Silver (#D9D9D9)
    const cockpitGeo = new THREE.BoxGeometry(1.8, 0.8, 2.5);
    const cockpitMat = new THREE.MeshLambertMaterial({
      color: 0xD9D9D9
    });
    const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
    cockpit.position.set(0, 1.2, -0.5);

    // Accent LEDs - Electric Blue (#00A2FF)
    const accentGeo = new THREE.BoxGeometry(2.6, 0.1, 5.1);
    const accentMat = new THREE.MeshBasicMaterial({ color: 0x00A2FF });
    const accent = new THREE.Mesh(accentGeo, accentMat);
    accent.position.y = 0.2;

    this.mesh.add(body);
    this.mesh.add(cockpit);
    this.mesh.add(accent);

    // Set initial position
    this.mesh.position.set(this.targetX, 0, 0);
    this.scene.add(this.mesh);

    // Bounding box for collisions
    this.box = new THREE.Box3().setFromObject(this.mesh);
  }

  initAIPath() {
    this.pathGroup = new THREE.Group();

    // Route Guidance Path Core: Electric Blue (#00A2FF)
    const coreGeo = new THREE.PlaneGeometry(1.8, 120);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x00A2FF,
      transparent: true,
      opacity: 0.15,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const corePath = new THREE.Mesh(coreGeo, coreMat);
    corePath.rotation.x = -Math.PI / 2;
    corePath.position.y = 0.05;
    corePath.position.z = -60;

    // Future Path Prediction: Cyan Glow (#00FFFF)
    const glowGeo = new THREE.PlaneGeometry(2.6, 120);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x00FFFF,
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const glowPath = new THREE.Mesh(glowGeo, glowMat);
    glowPath.rotation.x = -Math.PI / 2;
    glowPath.position.y = 0.04;
    glowPath.position.z = -60;

    this.pathGroup.add(corePath);
    this.pathGroup.add(glowPath);

    this.scene.add(this.pathGroup);
  }

  update(dt) {
    this.handleInput();
    
    // Smooth transition to target lane
    this.mesh.position.x = THREE.MathUtils.lerp(this.mesh.position.x, this.targetX, dt * 10);
    
    // Tilt while turning
    const tilt = (this.targetX - this.mesh.position.x) * -0.05;
    this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, tilt, dt * 15);

    // Update AI Path position to match target lane smoothly
    this.pathGroup.position.x = THREE.MathUtils.lerp(this.pathGroup.position.x, this.targetX, dt * 8);
    
    // Update bounding box
    this.box.setFromObject(this.mesh);
    this.box.expandByScalar(-0.3);
  }

  handleInput() {
    if ((this.input.keys.left || this.input.consumeSwipeLeft()) && this.canChangeLane) {
      if (this.currentLane > 0) {
        this.currentLane--;
        this.targetX = this.lanes[this.currentLane];
      }
      this.canChangeLane = false;
    } else if ((this.input.keys.right || this.input.consumeSwipeRight()) && this.canChangeLane) {
      if (this.currentLane < 2) {
        this.currentLane++;
        this.targetX = this.lanes[this.currentLane];
      }
      this.canChangeLane = false;
    }

    if (!this.input.keys.left && !this.input.keys.right) {
      this.canChangeLane = true;
    }
  }
}
