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
  }

  initVehicle() {
    this.mesh = new THREE.Group();
    
    // Generate a realistic car texture (Image) with a racing stripe and carbon fiber look
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Base paint (Deep Metallic Red)
    ctx.fillStyle = '#aa0000';
    ctx.fillRect(0, 0, 256, 256);
    
    // Carbon fiber center stripe
    ctx.fillStyle = '#111111';
    ctx.fillRect(100, 0, 56, 256);
    ctx.fillStyle = '#333333';
    for(let y=0; y<256; y+=4) {
      for(let x=100; x<156; x+=4) {
        ctx.fillRect(x + (y%8===0?2:0), y, 2, 2); // Checker pattern
      }
    }
    
    const paintTex = new THREE.CanvasTexture(canvas);
    paintTex.wrapS = THREE.RepeatWrapping;
    paintTex.wrapT = THREE.RepeatWrapping;

    // Materials
    const paintMat = new THREE.MeshStandardMaterial({ 
      map: paintTex,
      roughness: 0.2, // Very shiny
      metalness: 0.7, // Metallic paint
    });
    
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x050505,
      roughness: 0.05,
      metalness: 0.9,
    }); // Opaque highly reflective glass
    
    const rubberMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.9, roughness: 0.2 });
    const headlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const taillightMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const grilleMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.8 });
    const dashMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });

    // Helper to make sloped aerodynamic boxes
    const createSlopedBox = (w, h, d, topFrontSlope, topBackSlope) => {
       const geo = new THREE.BoxGeometry(w, h, d);
       const pos = geo.attributes.position.array;
       for(let i=0; i<pos.length; i+=3) {
          if (pos[i+1] > 0) { // Top vertices
             if (pos[i+2] > 0) { // Back (+Z)
                pos[i+2] -= topBackSlope;
                pos[i+1] -= topBackSlope * 0.2; // slight drop
             } else { // Front (-Z)
                pos[i+2] += topFrontSlope;
                pos[i+1] -= topFrontSlope * 0.2; // slight drop
             }
          }
       }
       geo.computeVertexNormals();
       return geo;
    };

    // Aerodynamic Chassis (Sloped front hood, slightly sloped rear)
    const chassisGeo = createSlopedBox(2.2, 0.6, 5.2, 0.8, 0.3);
    const chassis = new THREE.Mesh(chassisGeo, paintMat);
    chassis.position.y = 0.4;
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    this.mesh.add(chassis);
    
    // Front Grille
    const grille = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 0.1), grilleMat);
    grille.position.set(0, 0.3, -2.56);
    this.mesh.add(grille);

    // Aerodynamic Cabin / Roof
    const cabinGeo = createSlopedBox(1.7, 0.7, 2.6, 0.7, 0.6);
    const cabin = new THREE.Mesh(cabinGeo, glassMat); // Glass cabin
    cabin.position.set(0, 1.05, 0.2);
    cabin.castShadow = true;
    this.mesh.add(cabin);

    // Side Mirrors
    const mirrorGeo = new THREE.BoxGeometry(0.3, 0.2, 0.2);
    const mirrorR = new THREE.Mesh(mirrorGeo, paintMat);
    mirrorR.position.set(0.95, 0.9, -0.4);
    this.mesh.add(mirrorR);
    const mirrorL = new THREE.Mesh(mirrorGeo, paintMat);
    mirrorL.position.set(-0.95, 0.9, -0.4);
    this.mesh.add(mirrorL);

    // Wheels
    const createWheel = (x, z) => {
      const wheelGroup = new THREE.Group();
      
      const tireGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.35, 24); // smoother tires
      const tire = new THREE.Mesh(tireGeo, rubberMat);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      wheelGroup.add(tire);
      
      const rimGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.37, 12);
      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.rotation.z = Math.PI / 2;
      wheelGroup.add(rim);

      wheelGroup.position.set(x, 0.4, z);
      return wheelGroup;
    };

    this.mesh.add(createWheel(1.15, -1.6));  // Front Right
    this.mesh.add(createWheel(-1.15, -1.6)); // Front Left
    this.mesh.add(createWheel(1.15, 1.6));   // Rear Right
    this.mesh.add(createWheel(-1.15, 1.6));  // Rear Left

    // Aggressive Angled Headlights
    const hlGeo = new THREE.BoxGeometry(0.5, 0.1, 0.1);
    hlGeo.rotateY(Math.PI / 8); // Angled inward
    const hlRight = new THREE.Mesh(hlGeo, headlightMat);
    hlRight.position.set(0.7, 0.55, -2.5);
    this.mesh.add(hlRight);
    
    const hlGeo2 = new THREE.BoxGeometry(0.5, 0.1, 0.1);
    hlGeo2.rotateY(-Math.PI / 8);
    const hlLeft = new THREE.Mesh(hlGeo2, headlightMat);
    hlLeft.position.set(-0.7, 0.55, -2.5);
    this.mesh.add(hlLeft);

    // Headlight Glow
    const hlLight1 = new THREE.PointLight(0xffffee, 1.5, 12);
    hlLight1.position.set(0.7, 0.55, -2.8);
    this.mesh.add(hlLight1);
    const hlLight2 = new THREE.PointLight(0xffffee, 1.5, 12);
    hlLight2.position.set(-0.7, 0.55, -2.8);
    this.mesh.add(hlLight2);

    // Taillights
    const tlGeo = new THREE.BoxGeometry(0.7, 0.15, 0.1);
    const tlRight = new THREE.Mesh(tlGeo, taillightMat);
    tlRight.position.set(0.6, 0.6, 2.5);
    this.mesh.add(tlRight);
    
    const tlLeft = new THREE.Mesh(tlGeo, taillightMat);
    tlLeft.position.set(-0.6, 0.6, 2.5);
    this.mesh.add(tlLeft);
    
    // Dual Exhausts
    const exhaustGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.2, 8);
    exhaustGeo.rotateX(Math.PI / 2);
    const exhaust1 = new THREE.Mesh(exhaustGeo, rimMat);
    exhaust1.position.set(0.6, 0.25, 2.55);
    this.mesh.add(exhaust1);
    const exhaust2 = new THREE.Mesh(exhaustGeo, rimMat);
    exhaust2.position.set(-0.6, 0.25, 2.55);
    this.mesh.add(exhaust2);

    // Sports Racing Spoiler
    const spoilerGeo = new THREE.BoxGeometry(2.1, 0.05, 0.5);
    const spoiler = new THREE.Mesh(spoilerGeo, rimMat); // Carbon/Metal spoiler
    spoiler.position.set(0, 0.9, 2.4);
    this.mesh.add(spoiler);
    
    const strutGeo = new THREE.BoxGeometry(0.05, 0.2, 0.2);
    const strutR = new THREE.Mesh(strutGeo, grilleMat);
    strutR.position.set(0.6, 0.8, 2.4);
    this.mesh.add(strutR);
    const strutL = new THREE.Mesh(strutGeo, grilleMat);
    strutL.position.set(-0.6, 0.8, 2.4);
    this.mesh.add(strutL);

    // Interior / Dashboard
    const dashBoard = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 0.6), dashMat);
    dashBoard.position.set(0, 0.8, -0.6);
    this.mesh.add(dashBoard);

    // Steering Wheel (Left side driver)
    const wheelGeo = new THREE.TorusGeometry(0.2, 0.03, 8, 16);
    const steeringWheel = new THREE.Mesh(wheelGeo, dashMat);
    steeringWheel.rotation.x = Math.PI / 4;
    steeringWheel.position.set(-0.4, 0.95, -0.4);
    this.mesh.add(steeringWheel);

    // Set initial position
    // Set position AFTER calculating bounding box offset to avoid un-updated matrix issues
    this.scene.add(this.mesh);

    const tempBox = new THREE.Box3().setFromObject(this.mesh);
    this.carSize = new THREE.Vector3();
    tempBox.getSize(this.carSize);
    this.carSize.subScalar(0.6); // Leniency
    
    this.carCenterOffset = new THREE.Vector3();
    tempBox.getCenter(this.carCenterOffset); // Since mesh is at 0,0,0, center is the offset
    
    this.mesh.position.set(this.targetX, 0, 0);
    
    this.box = new THREE.Box3();
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

  update(dt, curveAmount = 0) {
    this.handleInput(dt);
    
    // Smooth transition to target lane
    this.mesh.position.x = THREE.MathUtils.lerp(this.mesh.position.x, this.targetX, dt * 10);
    
    // Tilt while turning
    const steerDiff = this.targetX - this.mesh.position.x;
    const tilt = steerDiff * 0.08; // Lean into the turn
    this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, tilt, dt * 15);
    
    // Yaw (turn) the car based on the road's curve PLUS active steering
    const curveYaw = -curveAmount * 1200; 
    const steerYaw = steerDiff * -0.06;
    const targetYaw = curveYaw + steerYaw; 
    this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, targetYaw, dt * 10);
    
    // Update bounding box (O(1) fast update)
    const center = this.mesh.position.clone().add(this.carCenterOffset);
    this.box.setFromCenterAndSize(center, this.carSize);
  }

  handleInput(dt) {
    const steerSpeed = 25; // units per second
    
    // Keyboard / D-Pad continuous steering
    if (this.input.keys.left) {
      this.targetX -= steerSpeed * dt; // Left is -X
    } 
    if (this.input.keys.right) {
      this.targetX += steerSpeed * dt; // Right is +X
    }

    // Retain screen taps for small nudges (mobile fallback)
    if (this.input.consumeSwipeLeft()) {
      this.targetX -= 3.0; // Nudge left
    }
    if (this.input.consumeSwipeRight()) {
      this.targetX += 3.0; // Nudge right
    }

    // Clamp to road bounds (Road width is 30, from -15 to +15)
    // Car width is ~2, so we clamp slightly inside the edges
    this.targetX = Math.max(-13.5, Math.min(13.5, this.targetX));
  }
}
