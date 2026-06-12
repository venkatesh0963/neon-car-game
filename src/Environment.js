import * as THREE from 'three';

export class Environment {
  constructor(scene) {
    this.scene = scene;
    
    this.roadWidth = 30;
    this.roadLength = 800;
    
    // State
    this.state = {
      time: 'night',
      season: 'summer',
      weather: 'clear'
    };

    // Interpolation Targets
    this.targets = {
      skyColor: new THREE.Color(0x050A1A),
      fogColor: new THREE.Color(0x00BFFF),
      ambientColor: new THREE.Color(0x00A2FF),
      lightIntensity: 0.3,
      fogFar: 1200,
      fogNear: 250
    };

    this.sceneryObjects = [];
    this.mountains = [];

    this.initLighting();
    this.initSkybox();
    this.initCelestial();
    this.initTerrain();
    this.initRoad();
    this.initScenery();
    this.initParticles();
    
    this.applyState();
  }

  initLighting() {
    this.ambientLight = new THREE.AmbientLight(this.targets.ambientColor, 0.6);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, this.targets.lightIntensity);
    this.dirLight.position.set(-100, 100, -100);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.camera.top = 100;
    this.dirLight.shadow.camera.bottom = -100;
    this.dirLight.shadow.camera.left = -100;
    this.dirLight.shadow.camera.right = 100;
    this.scene.add(this.dirLight);
  }

  initSkybox() {
    this.scene.background = this.targets.skyColor.clone();
    this.scene.fog = new THREE.Fog(this.targets.fogColor.clone(), this.targets.fogNear, this.targets.fogFar);
  }

  initCelestial() {
    const celestialGeo = new THREE.SphereGeometry(30, 32, 32);
    this.celestialMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, fog: false });
    this.celestial = new THREE.Mesh(celestialGeo, this.celestialMat);
    this.celestial.position.set(0, 150, -400);
    this.scene.add(this.celestial);
    
    this.targetCelestialColor = new THREE.Color(0xFFFFFF);
    this.targetCelestialPos = new THREE.Vector3(0, 150, -400);
  }

  initTerrain() {
    const grassGeo = new THREE.PlaneGeometry(400, this.roadLength);
    this.grassMat = new THREE.MeshLambertMaterial({ color: 0x00C853 });
    
    const grassL = new THREE.Mesh(grassGeo, this.grassMat);
    grassL.rotation.x = -Math.PI / 2;
    grassL.position.set(-215, -0.2, -this.roadLength / 2 + 50);
    grassL.receiveShadow = true;
    this.scene.add(grassL);

    const grassR = new THREE.Mesh(grassGeo, this.grassMat);
    grassR.rotation.x = -Math.PI / 2;
    grassR.position.set(215, -0.2, -this.roadLength / 2 + 50);
    grassR.receiveShadow = true;
    this.scene.add(grassR);
  }

  initRoad() {
    const roadGeometry = new THREE.PlaneGeometry(this.roadWidth, this.roadLength);
    const roadMaterial = new THREE.MeshLambertMaterial({ color: 0x1A1A1A });
    
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.z = -this.roadLength / 2 + 50;
    road.position.y = -0.1;
    road.receiveShadow = true;
    this.scene.add(road);

    this.laneDividers = [];
    const dividerGeo = new THREE.BoxGeometry(0.3, 0.1, 4);
    const dividerMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    
    for(let i=0; i<30; i++) {
      let divL = new THREE.Mesh(dividerGeo, dividerMat);
      divL.position.set(-this.roadWidth/6, 0.0, -i * 20);
      this.scene.add(divL);
      this.laneDividers.push(divL);

      let divR = new THREE.Mesh(dividerGeo, dividerMat);
      divR.position.set(this.roadWidth/6, 0.0, -i * 20);
      this.scene.add(divR);
      this.laneDividers.push(divR);
    }
  }

  initScenery() {
    for(let i=0; i<60; i++) {
      const tree = this.createTree();
      this.resetSceneryObject(tree, true);
      this.scene.add(tree);
      this.sceneryObjects.push({ mesh: tree, type: 'tree' });
    }

    const mountainGeo = new THREE.ConeGeometry(80, 150, 4);
    this.mountainMat = new THREE.MeshLambertMaterial({ color: 0x708090 });
    
    for(let i=0; i<10; i++) {
      const mountain = new THREE.Mesh(mountainGeo, this.mountainMat);
      mountain.position.x = (Math.random() > 0.5 ? 1 : -1) * (150 + Math.random() * 150);
      mountain.position.y = 50;
      mountain.position.z = -200 - Math.random() * 400;
      mountain.rotation.y = Math.random() * Math.PI;
      this.scene.add(mountain);
      this.mountains.push(mountain);
    }
  }

  createTree() {
    const group = new THREE.Group();
    const trunkGeo = new THREE.CylinderGeometry(0.5, 0.5, 2);
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1;
    trunk.castShadow = true;
    
    const leavesGeo = new THREE.ConeGeometry(3, 6, 5);
    const leavesMat = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const leaves = new THREE.Mesh(leavesGeo, leavesMat);
    leaves.position.y = 4;
    leaves.castShadow = true;
    
    group.add(trunk);
    group.add(leaves);
    
    // Store reference to leaves material to change colors later
    group.userData.leavesMat = leavesMat;
    return group;
  }

  resetSceneryObject(obj, initial = false) {
    const side = Math.random() > 0.5 ? 1 : -1;
    const distanceFromBody = 20 + Math.random() * 80;
    obj.position.x = side * distanceFromBody;
    if (initial) {
      obj.position.z = 50 - Math.random() * this.roadLength;
    } else {
      obj.position.z = -this.roadLength + 50;
    }
  }

  initParticles() {
    const particleCount = 2000;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);

    for(let i=0; i<particleCount * 3; i+=3) {
      particlePos[i] = (Math.random() - 0.5) * 100; // x
      particlePos[i+1] = Math.random() * 50; // y
      particlePos[i+2] = (Math.random() - 0.5) * 100 - 20; // z
    }
    
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    
    this.particleMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.2,
      transparent: true,
      opacity: 0.0
    });

    this.particleSystem = new THREE.Points(particleGeo, this.particleMat);
    this.scene.add(this.particleSystem);
  }

  // --- PUBLIC CONTROL METHODS ---

  setTime(time) {
    this.state.time = time;
    this.applyState();
  }

  setSeason(season) {
    this.state.season = season;
    this.applyState();
  }

  setWeather(weather) {
    this.state.weather = weather;
    this.applyState();
  }

  // --- STATE APPLICATION ---

  applyState() {
    // 1. Resolve Time Colors
    let sky = 0x87CEEB, fog = 0x87CEEB, amb = 0xffffff, intens = 1.0;
    switch(this.state.time) {
      case 'morning': sky = 0xA2C2E1; fog = 0xD4E6F1; amb = 0xFFD700; intens = 0.8; break;
      case 'noon': sky = 0x00BFFF; fog = 0x87CEEB; amb = 0xFFFFFF; intens = 1.2; break;
      case 'evening': sky = 0xFF7E00; fog = 0xFFB347; amb = 0xFF9500; intens = 0.7; break;
      case 'night': sky = 0x050A1A; fog = 0x00BFFF; amb = 0x00A2FF; intens = 0.3; break;
      case 'midnight': sky = 0x000000; fog = 0x050A1A; amb = 0x111111; intens = 0.1; break;
    }

    this.targets.skyColor.setHex(sky);
    this.targets.fogColor.setHex(fog);
    this.targets.ambientColor.setHex(amb);
    this.targets.lightIntensity = intens;

    // 2. Resolve Weather Modifiers
    this.targets.fogFar = 1200;
    this.targets.fogNear = 250;
    this.targetParticleOpacity = 0.0;
    this.particleMat.color.setHex(0xffffff);

    switch(this.state.weather) {
      case 'cloudy': this.targets.lightIntensity *= 0.6; break;
      case 'rain': this.targetParticleOpacity = 0.6; this.targets.lightIntensity *= 0.5; this.targets.fogFar = 600; break;
      case 'storm': this.targetParticleOpacity = 0.9; this.targets.lightIntensity *= 0.2; this.targets.fogFar = 300; this.targets.skyColor.setHex(0x111122); this.targets.fogColor.setHex(0x222233); break;
      case 'snow': this.targetParticleOpacity = 0.8; this.targets.fogFar = 400; break;
      case 'fog': this.targets.fogNear = 10; this.targets.fogFar = 150; break;
      case 'rainbow': this.targets.skyColor.setHex(0xFFD700); break;
    }

    // 3. Resolve Scenery Colors
    let leafColor = 0x228B22; // Default Summer/Green
    let grassColor = 0x00C853;
    let mountainColor = 0x708090;

    switch(this.state.season) {
      case 'spring': leafColor = 0xFFB7C5; grassColor = 0x90EE90; break;
      case 'summer': leafColor = 0x228B22; grassColor = 0x00C853; break;
      case 'autumn': leafColor = 0xFF8C00; grassColor = 0xBDB76B; break;
      case 'winter': leafColor = 0xFFFFFF; grassColor = 0xE0FFFF; mountainColor = 0xFFFFFF; break;
    }

    this.targetGrassColor = new THREE.Color(grassColor);
    this.targetLeafColor = new THREE.Color(leafColor);
    this.targetMountainColor = new THREE.Color(mountainColor);

    // 4. Resolve Celestial Body
    let celestialColor = 0xFFFFFF;
    let celestialY = 150;
    
    switch(this.state.time) {
      case 'morning': celestialColor = 0xFFEEAA; celestialY = 80; break;
      case 'noon': celestialColor = 0xFFEEAA; celestialY = 200; break;
      case 'evening': celestialColor = 0xFF8C00; celestialY = 40; break;
      case 'night': celestialColor = 0xEEEEFF; celestialY = 150; break;
      case 'midnight': celestialColor = 0xDDDDFF; celestialY = 200; break;
    }
    
    // Hide sun/moon if bad weather
    if (this.state.weather === 'cloudy' || this.state.weather === 'rain' || this.state.weather === 'storm' || this.state.weather === 'fog') {
      celestialY = -100;
    }

    this.targetCelestialColor.setHex(celestialColor);
    this.targetCelestialPos.set(0, celestialY, -400);
  }

  // --- UPDATE LOOP ---

  update(speed, dt) {
    // Lerp Environment Colors (Smooth 2-5 sec transitions)
    const lerpSpeed = dt * 1.0; // adjust for speed
    
    this.scene.background.lerp(this.targets.skyColor, lerpSpeed);
    this.scene.fog.color.lerp(this.targets.fogColor, lerpSpeed);
    this.ambientLight.color.lerp(this.targets.ambientColor, lerpSpeed);
    this.dirLight.intensity = THREE.MathUtils.lerp(this.dirLight.intensity, this.targets.lightIntensity, lerpSpeed);
    
    this.scene.fog.near = THREE.MathUtils.lerp(this.scene.fog.near, this.targets.fogNear, lerpSpeed);
    this.scene.fog.far = THREE.MathUtils.lerp(this.scene.fog.far, this.targets.fogFar, lerpSpeed);

    this.celestialMat.color.lerp(this.targetCelestialColor, lerpSpeed);
    this.celestial.position.lerp(this.targetCelestialPos, lerpSpeed);

    this.grassMat.color.lerp(this.targetGrassColor, lerpSpeed);
    this.mountainMat.color.lerp(this.targetMountainColor, lerpSpeed);

    for(let item of this.sceneryObjects) {
      if(item.type === 'tree') {
        item.mesh.userData.leavesMat.color.lerp(this.targetLeafColor, lerpSpeed);
      }
    }

    // Particles logic
    this.particleMat.opacity = THREE.MathUtils.lerp(this.particleMat.opacity, this.targetParticleOpacity, lerpSpeed);
    if (this.particleMat.opacity > 0.01) {
      const positions = this.particleSystem.geometry.attributes.position.array;
      for(let i=1; i<positions.length; i+=3) {
        // Fall down
        if (this.state.weather === 'snow') {
          positions[i] -= 10 * dt; // slow snow
          positions[i-1] += Math.sin(positions[i] * 0.1) * dt * 5; // drifting
        } else {
          positions[i] -= 80 * dt; // fast rain
        }

        // Reset if below ground
        if (positions[i] < 0) {
          positions[i] = 50;
        }
      }
      this.particleSystem.geometry.attributes.position.needsUpdate = true;
    }

    // Movement
    const movement = speed * dt;
    
    for(let divider of this.laneDividers) {
      divider.position.z += movement;
      if (divider.position.z > 20) {
        divider.position.z -= 600;
      }
    }
    
    for(let item of this.sceneryObjects) {
      item.mesh.position.z += movement;
      if (item.mesh.position.z > 50) {
        this.resetSceneryObject(item.mesh);
        // Instant color update on reset to prevent mismatched colors coming into view
        item.mesh.userData.leavesMat.color.copy(this.targetLeafColor);
      }
    }

    for(let mountain of this.mountains) {
      mountain.position.z += movement * 0.1;
      if (mountain.position.z > 100) {
        mountain.position.z -= 600;
        mountain.position.x = (Math.random() > 0.5 ? 1 : -1) * (150 + Math.random() * 150);
      }
    }
  }
}
