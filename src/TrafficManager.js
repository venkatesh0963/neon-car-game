import * as THREE from 'three';

export class TrafficManager {
  constructor(scene) {
    this.scene = scene;
    this.vehicles = [];
    this.lanes = [-10, 0, 10];
    this.spawnTimer = 0;
    this.spawnInterval = 1.5; // seconds

    this.CAR_COLORS = [
      0xFF3B30, // Red
      0x00A2FF, // Blue
      0x00C853, // Green
      0xFFCC00, // Yellow
      0xFF9500, // Orange
      0xAF52DE, // Purple
      0xFFFFFF, // White
      0x111111, // Black
      0xD9D9D9, // Silver
      0xFFD700  // Gold
    ];
  }

  createVehicle() {
    const mesh = new THREE.Group();
    const colorHex = this.CAR_COLORS[Math.floor(Math.random() * this.CAR_COLORS.length)];

    // Materials
    const bodyMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.3, metalness: 0.6 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 0.9 });
    const rubberMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.9 });
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });

    // Chassis
    const chassisGeo = new THREE.BoxGeometry(2.4, 0.7, 4.8);
    const chassis = new THREE.Mesh(chassisGeo, bodyMat);
    chassis.position.y = 0.5;
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    mesh.add(chassis);

    // Cabin
    const cabinGeo = new THREE.BoxGeometry(1.8, 0.6, 2.4);
    const cabin = new THREE.Mesh(cabinGeo, glassMat);
    cabin.position.set(0, 1.15, -0.2);
    cabin.castShadow = true;
    mesh.add(cabin);

    // Wheels
    const createWheel = (x, z) => {
      const tireGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 12);
      const tire = new THREE.Mesh(tireGeo, rubberMat);
      tire.rotation.z = Math.PI / 2;
      tire.position.set(x, 0.35, z);
      tire.castShadow = true;
      return tire;
    };
    mesh.add(createWheel(1.25, -1.5));
    mesh.add(createWheel(-1.25, -1.5));
    mesh.add(createWheel(1.25, 1.5));
    mesh.add(createWheel(-1.25, 1.5));

    // Taillights
    const tlGeo = new THREE.BoxGeometry(0.6, 0.2, 0.1);
    const tlR = new THREE.Mesh(tlGeo, tailMat);
    tlR.position.set(0.8, 0.6, 2.41);
    mesh.add(tlR);
    const tlL = new THREE.Mesh(tlGeo, tailMat);
    tlL.position.set(-0.8, 0.6, 2.41);
    mesh.add(tlL);

    // Create a dummy detection box object since update logic expects one
    // But we don't add it to the mesh so it remains invisible
    mesh.userData.detectionBox = { color: { setHex: () => {} } };

    return mesh;
  }

  spawnVehicle() {
    const v = this.createVehicle();
    const laneIndex = Math.floor(Math.random() * 3);
    v.position.set(this.lanes[laneIndex], 0, -300); // spawn far ahead
    
    this.scene.add(v);
    this.vehicles.push({
      mesh: v,
      box: new THREE.Box3()
    });
  }

  update(dt, playerSpeed, playerBox) {
    this.spawnTimer += dt;
    
    // Faster player speed = faster spawn rate
    const currentSpawnInterval = Math.max(0.4, this.spawnInterval - (playerSpeed / 200));

    if (this.spawnTimer > currentSpawnInterval) {
      this.spawnTimer = 0;
      this.spawnVehicle();
    }

    const playerCenter = new THREE.Vector3();
    playerBox.getCenter(playerCenter);

    for (let i = this.vehicles.length - 1; i >= 0; i--) {
      const v = this.vehicles[i];
      
      const relativeSpeed = playerSpeed - 30; // Traffic drives at 30km/h
      
      v.mesh.position.z += relativeSpeed * dt;
      v.box.setFromObject(v.mesh);
      v.box.expandByScalar(-0.3); // leniency

      // Update detection box color based on distance to player
      const distance = v.mesh.position.distanceTo(playerCenter);
      const isSameLane = Math.abs(v.mesh.position.x - playerCenter.x) < 2.0;

      if (isSameLane && distance < 40 && v.mesh.position.z < playerCenter.z) {
        // Dangerous
        v.mesh.userData.detectionBox.color.setHex(0xFF3B30);
      } else if (isSameLane && distance < 100 && v.mesh.position.z < playerCenter.z) {
        // Caution
        v.mesh.userData.detectionBox.color.setHex(0xFFB300);
      } else {
        // Normal
        v.mesh.userData.detectionBox.color.setHex(0x5AB3FF);
      }

      // Remove if behind camera
      if (v.mesh.position.z > 20) {
        this.scene.remove(v.mesh);
        this.vehicles.splice(i, 1);
      }
    }
  }

  checkCollision(playerBox) {
    for (let v of this.vehicles) {
      if (playerBox.intersectsBox(v.box)) {
        return true;
      }
    }
    return false;
  }
  
  reset() {
    for (let v of this.vehicles) {
      this.scene.remove(v.mesh);
    }
    this.vehicles = [];
    this.spawnTimer = 0;
  }
}
