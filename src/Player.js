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
    
    // Materials
    const paintMat = new THREE.MeshStandardMaterial({ 
      color: 0x111111, // Dark grey/black paint
      roughness: 0.1,
      metalness: 0.8,
    });
    
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x000000,
      roughness: 0.0,
      metalness: 1.0,
      transparent: true,
      opacity: 0.7
    });
    
    const rubberMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.2 });
    const headlightMat = new THREE.MeshBasicMaterial({ color: 0xffffee });
    const taillightMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const dashMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });

    // Chassis Base
    const chassisGeo = new THREE.BoxGeometry(2.4, 0.6, 5.2);
    const chassis = new THREE.Mesh(chassisGeo, paintMat);
    chassis.position.y = 0.4;
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    this.mesh.add(chassis);

    // Cabin / Roof
    // Pushed back (+z) to give it a long hood (sports car look)
    const cabinGeo = new THREE.BoxGeometry(1.9, 0.7, 2.6);
    const cabin = new THREE.Mesh(cabinGeo, paintMat);
    cabin.position.set(0, 1.05, 0.4);
    cabin.castShadow = true;
    this.mesh.add(cabin);

    // Windshield (Front, facing -Z)
    const windshieldGeo = new THREE.PlaneGeometry(1.8, 1.2);
    const windshield = new THREE.Mesh(windshieldGeo, glassMat);
    windshield.rotation.x = -Math.PI / 3;
    windshield.position.set(0, 1.0, -0.7);
    this.mesh.add(windshield);
    
    // Rear Window (Back, facing +Z)
    const rearWinGeo = new THREE.PlaneGeometry(1.8, 1.0);
    const rearWin = new THREE.Mesh(rearWinGeo, glassMat);
    rearWin.rotation.x = Math.PI / 2.5;
    rearWin.position.set(0, 1.0, 1.6);
    this.mesh.add(rearWin);

    // Wheels
    const createWheel = (x, z) => {
      const wheelGroup = new THREE.Group();
      
      const tireGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
      const tire = new THREE.Mesh(tireGeo, rubberMat);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      wheelGroup.add(tire);
      
      const rimGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.32, 8);
      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.rotation.z = Math.PI / 2;
      wheelGroup.add(rim);

      wheelGroup.position.set(x, 0.4, z);
      return wheelGroup;
    };

    this.mesh.add(createWheel(1.2, -1.6));  // Front Right
    this.mesh.add(createWheel(-1.2, -1.6)); // Front Left
    this.mesh.add(createWheel(1.2, 1.6));   // Rear Right
    this.mesh.add(createWheel(-1.2, 1.6));  // Rear Left

    // Headlights (Front, -Z)
    const hlGeo = new THREE.BoxGeometry(0.5, 0.15, 0.1);
    const hlRight = new THREE.Mesh(hlGeo, headlightMat);
    hlRight.position.set(0.8, 0.5, -2.61);
    this.mesh.add(hlRight);
    
    const hlLeft = new THREE.Mesh(hlGeo, headlightMat);
    hlLeft.position.set(-0.8, 0.5, -2.61);
    this.mesh.add(hlLeft);

    // Headlight Glow (Point Lights pointing forward)
    const hlLight1 = new THREE.PointLight(0xffffee, 1, 10);
    hlLight1.position.set(0.8, 0.5, -2.8);
    this.mesh.add(hlLight1);
    const hlLight2 = new THREE.PointLight(0xffffee, 1, 10);
    hlLight2.position.set(-0.8, 0.5, -2.8);
    this.mesh.add(hlLight2);

    // Taillights (Rear, +Z)
    const tlGeo = new THREE.BoxGeometry(0.6, 0.15, 0.1);
    const tlRight = new THREE.Mesh(tlGeo, taillightMat);
    tlRight.position.set(0.8, 0.6, 2.61);
    this.mesh.add(tlRight);
    
    const tlLeft = new THREE.Mesh(tlGeo, taillightMat);
    tlLeft.position.set(-0.8, 0.6, 2.61);
    this.mesh.add(tlLeft);

    // Spoiler (Rear, +Z)
    const spoilerGeo = new THREE.BoxGeometry(2.2, 0.05, 0.4);
    const spoiler = new THREE.Mesh(spoilerGeo, paintMat);
    spoiler.position.set(0, 0.9, 2.4);
    this.mesh.add(spoiler);
    
    const strutGeo = new THREE.BoxGeometry(0.05, 0.2, 0.2);
    const strutR = new THREE.Mesh(strutGeo, paintMat);
    strutR.position.set(0.7, 0.8, 2.4);
    this.mesh.add(strutR);
    const strutL = new THREE.Mesh(strutGeo, paintMat);
    strutL.position.set(-0.7, 0.8, 2.4);
    this.mesh.add(strutL);

    // Interior / Dashboard (for 1st person view)
    // Dash is near the windshield (-Z side of cabin)
    const dashBoard = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.4, 0.6), dashMat);
    dashBoard.position.set(0, 0.8, -0.6);
    this.mesh.add(dashBoard);

    // Steering Wheel (Left side driver)
    const wheelGeo = new THREE.TorusGeometry(0.2, 0.03, 8, 16);
    const steeringWheel = new THREE.Mesh(wheelGeo, dashMat);
    steeringWheel.rotation.x = Math.PI / 4;
    steeringWheel.position.set(-0.4, 0.95, -0.4);
    this.mesh.add(steeringWheel);

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
