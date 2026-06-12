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

    // Solid Body
    const bodyGeo = new THREE.BoxGeometry(2.5, 1.2, 5);
    const bodyMat = new THREE.MeshLambertMaterial({ 
      color: colorHex
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.6;
    body.castShadow = true;
    body.receiveShadow = true;
    
    // Glowing LED Accents matching the body color
    const accentGeo = new THREE.BoxGeometry(2.6, 0.1, 5.1);
    const accentMat = new THREE.MeshBasicMaterial({ 
      color: colorHex
    });
    const accent = new THREE.Mesh(accentGeo, accentMat);
    accent.position.y = 0.3;

    // Detection Box Outline (will be colored dynamically)
    const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(3.0, 1.6, 5.6));
    const lineMat = new THREE.LineBasicMaterial({ color: 0x5AB3FF, transparent: true, opacity: 0.8 });
    const detectionBox = new THREE.LineSegments(edges, lineMat);
    detectionBox.position.y = 0.6;

    mesh.add(body);
    mesh.add(accent);
    mesh.add(detectionBox);

    mesh.userData.detectionBox = lineMat; // Store reference to update color

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
