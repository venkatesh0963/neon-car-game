import * as THREE from 'three';

export class Environment {
  constructor(scene) {
    this.scene = scene;
    
    this.roadWidth = 30;
    this.roadLength = 800;
    
    // State
    this.state = {
      time: 'noon',
      season: 'summer',
      weather: 'clear'
    };
    
    this.biome = 'nature';

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
    this.initBuildingMaterials();
    this.initScenery();
    this.initStreetLights();
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
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
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
    this.curveAmount = 0;
    this.targetCurveAmount = 0;
    this.curveTimer = 0;

    const grassGeo = new THREE.PlaneGeometry(400, this.roadLength, 1, 60);
    this.grassMat = new THREE.MeshLambertMaterial({ color: 0x00C853 });
    
    this.grassL = new THREE.Mesh(grassGeo, this.grassMat);
    this.grassL.rotation.x = -Math.PI / 2;
    this.grassL.position.set(-215, -0.2, -this.roadLength / 2 + 50);
    this.grassL.receiveShadow = true;
    this.scene.add(this.grassL);

    this.grassR = new THREE.Mesh(grassGeo, this.grassMat);
    this.grassR.rotation.x = -Math.PI / 2;
    this.grassR.position.set(215, -0.2, -this.roadLength / 2 + 50);
    this.grassR.receiveShadow = true;
    this.scene.add(this.grassR);
    
    // Ocean planes
    const oceanGeo = new THREE.PlaneGeometry(400, this.roadLength, 1, 60);
    this.oceanMat = new THREE.MeshLambertMaterial({ color: 0x1ca3ec });
    
    this.oceanL = new THREE.Mesh(oceanGeo, this.oceanMat);
    this.oceanL.rotation.x = -Math.PI / 2;
    this.oceanL.position.set(-300, -10, -this.roadLength / 2 + 50);
    this.scene.add(this.oceanL);

    this.oceanR = new THREE.Mesh(oceanGeo, this.oceanMat);
    this.oceanR.rotation.x = -Math.PI / 2;
    this.oceanR.position.set(300, -10, -this.roadLength / 2 + 50);
    this.scene.add(this.oceanR);
  }

  initRoad() {
    const roadGeometry = new THREE.PlaneGeometry(this.roadWidth, this.roadLength, 1, 60);
    const roadMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x1A1A1A,
      roughness: 0.8,
      metalness: 0.1
    });
    
    this.road = new THREE.Mesh(roadGeometry, roadMaterial);
    this.road.rotation.x = -Math.PI / 2;
    this.road.position.z = -this.roadLength / 2 + 50;
    this.road.position.y = -0.1;
    this.road.receiveShadow = true;
    this.scene.add(this.road);

    // Sidewalks
    const sidewalkGeo = new THREE.PlaneGeometry(4, this.roadLength, 1, 60);
    const sidewalkMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
    
    this.sidewalkL = new THREE.Mesh(sidewalkGeo, sidewalkMat);
    this.sidewalkL.rotation.x = -Math.PI / 2;
    this.sidewalkL.position.set(-this.roadWidth / 2 - 2, -0.05, -this.roadLength / 2 + 50);
    this.sidewalkL.receiveShadow = true;
    this.scene.add(this.sidewalkL);

    this.sidewalkR = new THREE.Mesh(sidewalkGeo, sidewalkMat);
    this.sidewalkR.rotation.x = -Math.PI / 2;
    this.sidewalkR.position.set(this.roadWidth / 2 + 2, -0.05, -this.roadLength / 2 + 50);
    this.sidewalkR.receiveShadow = true;
    this.scene.add(this.sidewalkR);
    
    // Save original X for bending
    [this.road, this.sidewalkL, this.sidewalkR, this.grassL, this.grassR, this.oceanL, this.oceanR].forEach(plane => {
        const pos = plane.geometry.attributes.position.array;
        plane.userData.originalX = new Float32Array(pos.length);
        for(let i=0; i<pos.length; i+=3) {
            plane.userData.originalX[i] = pos[i];
        }
    });

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

  initBuildingMaterials() {
    this.buildingMats = [];
    
    // We create one high-quality white/grayscale template texture.
    // We will clone this material and assign a random color for EVERY building.
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Main concrete/steel base (White so it can be tinted)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 512);
    
    const rows = 16;
    const cols = 8;
    const winW = 20;
    const winH = 22;
    const gapX = (256 - (cols * winW)) / (cols + 1);
    const gapY = (512 - (rows * winH)) / (rows + 1);
    
    for(let r=0; r<rows; r++) {
      for(let c=0; c<cols; c++) {
        const x = gapX + c*(winW+gapX);
        const y = gapY + r*(winH+gapY);

        // Deep Frame border
        ctx.fillStyle = '#cccccc';
        ctx.fillRect(x - 2, y - 2, winW + 4, winH + 4);

        const isLit = Math.random() > 0.6; // Most office windows are off at night
        
        if (isLit) {
          // Warm office light or bright white
          ctx.fillStyle = Math.random() > 0.8 ? '#ffffff' : '#fceea7'; 
        } else {
          // Dark glass reflection (neutral dark grey so it takes the building tint nicely)
          ctx.fillStyle = '#111111';
        }
        
        ctx.fillRect(x, y, winW, winH);
        
        // Inner window cross (Mullions)
        ctx.fillStyle = '#050505'; // Dark inner frame
        ctx.fillRect(x + winW/2 - 1, y, 2, winH); // Vertical
        ctx.fillRect(x, y + winH/2 - 1, winW, 2); // Horizontal
      }
    }
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 4;
    
    // Base template material
    this.baseBuildingMat = new THREE.MeshStandardMaterial({ 
      map: tex, 
      roughness: 0.3,
      metalness: 0.5,
      emissive: new THREE.Color(0xffffff),
      emissiveMap: tex,
      emissiveIntensity: 0.4
    });
  }

  initScenery() {
    for(let i=0; i<60; i++) {
      const item = { mesh: new THREE.Group(), type: 'none' };
      this.morphToTree(item);
      this.resetSceneryObject(item.mesh, true);
      this.scene.add(item.mesh);
      this.sceneryObjects.push(item);
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

  initStreetLights() {
    this.streetLights = [];
    this.poleMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    this.bulbMat = new THREE.MeshBasicMaterial({ color: 0x444444 });

    const poleGeo = new THREE.CylinderGeometry(0.2, 0.3, 15);
    const headGeo = new THREE.BoxGeometry(4, 0.5, 1);
    const planeGeo = new THREE.PlaneGeometry(3.5, 0.8);

    for(let i=0; i<10; i++) {
      const group = new THREE.Group();
      
      const pole = new THREE.Mesh(poleGeo, this.poleMat);
      pole.position.y = 7.5;
      group.add(pole);
      
      const isRight = i % 2 === 0;
      const xSign = isRight ? 1 : -1;
      
      const head = new THREE.Mesh(headGeo, this.poleMat);
      head.position.y = 15;
      head.position.x = xSign * -1.5; 
      group.add(head);

      const bulb = new THREE.Mesh(planeGeo, this.bulbMat);
      bulb.rotation.x = Math.PI / 2;
      bulb.position.y = 14.7;
      bulb.position.x = xSign * -1.5;
      group.add(bulb);

      const light = new THREE.SpotLight(0xFFEEDD, 0);
      light.position.set(xSign * -1.5, 14, 0);
      light.target.position.set(xSign * -15, 0, 0); // Aim at the road
      light.angle = Math.PI / 2.5; // Wide cone
      light.penumbra = 0.5; // Soft edges
      light.distance = 100;
      light.decay = 1.5;
      
      group.add(light);
      group.add(light.target);

      group.userData.light = light;

      group.position.x = xSign * 18;
      group.position.z = -i * 80;
      
      this.scene.add(group);
      this.streetLights.push(group);
    }
  }

  morphToBuilding(item) {
    if (item.type === 'building') return;
    
    while(item.mesh.children.length > 0){ 
        item.mesh.remove(item.mesh.children[0]); 
    }
    
    const bType = Math.random();
    const bGroup = new THREE.Group();
    
    // Dubai style colors: Gold, Silver/White, Blue glass, Cyan glass.
    const mat = this.baseBuildingMat.clone();
    const dubaiHues = [0.12, 0.55, 0.6, 0.0]; // Gold, Light Blue, Deep Blue, White
    const hue = dubaiHues[Math.floor(Math.random() * dubaiHues.length)] + (Math.random() * 0.05 - 0.025);
    const sat = Math.random() > 0.6 ? 0.7 + Math.random() * 0.3 : 0.05 + Math.random() * 0.1; 
    const lit = 0.3 + Math.random() * 0.5;
    mat.color.setHSL(hue, sat, lit);
    mat.metalness = 0.8 + Math.random() * 0.2; // Extra shiny for Dubai
    mat.roughness = 0.1;
    
    const roofBaseMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const materials = [mat, mat, roofBaseMat, roofBaseMat, mat, mat];
    
    if (bType > 0.85) {
      // SUPERTALL (Burj Khalifa style)
      const tiers = Math.floor(Math.random() * 3) + 4; // 4 to 6 tiers
      let currentWidth = 40 + Math.random() * 20;
      let currentDepth = 40 + Math.random() * 20;
      let yOffset = 0;

      for(let t=0; t<tiers; t++) {
        const height = 80 + Math.random() * 100;
        const geo = new THREE.BoxGeometry(currentWidth, height, currentDepth);
        const uvs = geo.attributes.uv;
        for(let i=0; i<uvs.count; i++) {
            uvs.setXY(i, uvs.getX(i) * (currentWidth / 15), uvs.getY(i) * (height / 15));
        }
        
        const tierMesh = new THREE.Mesh(geo, materials);
        tierMesh.position.y = yOffset + height / 2;
        tierMesh.receiveShadow = true;
        bGroup.add(tierMesh);
        
        yOffset += height;
        currentWidth *= (0.6 + Math.random() * 0.15);
        currentDepth *= (0.6 + Math.random() * 0.15);
      }
      
      const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 2, 80), new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.2 }));
      spire.position.y = yOffset + 40;
      bGroup.add(spire);

    } else if (bType > 0.4) {
      // Skyscraper with tiers
      const tiers = Math.floor(Math.random() * 3) + 1;
      let currentWidth = 20 + Math.random() * 15;
      let currentDepth = 20 + Math.random() * 15;
      let yOffset = 0;

      for(let t=0; t<tiers; t++) {
        const height = 40 + Math.random() * 60;
        const geo = new THREE.BoxGeometry(currentWidth, height, currentDepth);
        const uvs = geo.attributes.uv;
        for(let i=0; i<uvs.count; i++) {
            uvs.setXY(i, uvs.getX(i) * (currentWidth / 15), uvs.getY(i) * (height / 15));
        }
        
        const tierMesh = new THREE.Mesh(geo, materials);
        tierMesh.position.y = yOffset + height / 2;
        tierMesh.receiveShadow = true;
        bGroup.add(tierMesh);
        
        yOffset += height;
        currentWidth *= (0.7 + Math.random() * 0.2);
        currentDepth *= (0.7 + Math.random() * 0.2);
      }
      
      // Roof details
      if (Math.random() > 0.5) {
        const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 20), new THREE.MeshStandardMaterial({ color: 0x888888 }));
        antenna.position.y = yOffset + 10;
        bGroup.add(antenna);
      }
    } else if (bType > 0.3) {
      // Housing / Apartment Complex
      const width = 15 + Math.random() * 15;
      const height = 20 + Math.random() * 25;
      const depth = 15 + Math.random() * 15;
      
      const geo = new THREE.BoxGeometry(width, height, depth);
      const uvs = geo.attributes.uv;
      for(let i=0; i<uvs.count; i++) {
          uvs.setXY(i, uvs.getX(i) * (width / 15), uvs.getY(i) * (height / 15));
      }
      
      const building = new THREE.Mesh(geo, materials);
      building.position.y = height / 2;
      building.receiveShadow = true;
      bGroup.add(building);
      
      // Entrance awning
      const awningGeo = new THREE.BoxGeometry(8, 1, depth + 2);
      const awningMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
      const awning = new THREE.Mesh(awningGeo, awningMat);
      awning.position.y = 4;
      bGroup.add(awning);

      // Pitched roof
      if (Math.random() > 0.4) {
        const pRoofGeo = new THREE.ConeGeometry(width * 0.8, 8, 4);
        pRoofGeo.rotateY(Math.PI / 4);
        const pRoof = new THREE.Mesh(pRoofGeo, new THREE.MeshStandardMaterial({ color: 0x3a2c24 }));
        pRoof.position.y = height + 4;
        bGroup.add(pRoof);
      }
    } else {
      // Storefront Building
      const width = 20 + Math.random() * 20;
      const height = 12 + Math.random() * 8;
      const depth = 15 + Math.random() * 15;
      
      const geo = new THREE.BoxGeometry(width, height, depth);
      const uvs = geo.attributes.uv;
      for(let i=0; i<uvs.count; i++) {
          uvs.setXY(i, uvs.getX(i) * (width / 15), uvs.getY(i) * (height / 15));
      }
      
      const building = new THREE.Mesh(geo, materials);
      building.position.y = height / 2;
      building.receiveShadow = true;
      bGroup.add(building);
      
      // Glowing Storefront Sign Base
      const sColor = new THREE.Color().setHSL(Math.random(), 0.8 + Math.random() * 0.2, 0.5 + Math.random() * 0.2);
      
      const signGeo = new THREE.BoxGeometry(width * 0.9, 2.5, depth + 1.5);
      const signMat = new THREE.MeshStandardMaterial({ 
        color: 0x111111,
        emissive: new THREE.Color(sColor),
        emissiveIntensity: 2.5 // Increased to ensure it glows over the 1.5 threshold
      });
      const sign = new THREE.Mesh(signGeo, signMat);
      sign.position.y = 5; // Above the ground floor
      bGroup.add(sign);
      
      // Glass doors below sign
      const doorGeo = new THREE.BoxGeometry(width * 0.8, 5, depth + 1.2);
      const doorMat = new THREE.MeshStandardMaterial({ color: 0x05050a, roughness: 0.1, metalness: 0.8 });
      const doors = new THREE.Mesh(doorGeo, doorMat);
      doors.position.y = 2.5;
      bGroup.add(doors);
    }

    item.mesh.add(bGroup);
    item.type = 'building';
  }

  morphToTree(item) {
    if (item.type === 'tree') return;
    
    while(item.mesh.children.length > 0){ 
        item.mesh.remove(item.mesh.children[0]); 
    }
    
    const trunkGeo = new THREE.CylinderGeometry(0.5, 0.5, 2);
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1;
    trunk.castShadow = true;
    
    const leavesGeo = new THREE.ConeGeometry(3, 6, 5);
    const leavesMat = new THREE.MeshLambertMaterial({ color: this.targetLeafColor || 0x228B22 });
    const leaves = new THREE.Mesh(leavesGeo, leavesMat);
    leaves.position.y = 4;
    leaves.castShadow = true;
    
    item.mesh.add(trunk);
    item.mesh.add(leaves);
    
    item.mesh.userData.leavesMat = leavesMat;
    item.type = 'tree';
  }

  morphToPalmTree(item) {
    if (item.type === 'palm') return;
    
    while(item.mesh.children.length > 0){ 
        item.mesh.remove(item.mesh.children[0]); 
    }
    
    const height = 10 + Math.random() * 8;
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.6, height, 5);
    
    // Curve the trunk
    const posAttribute = trunkGeo.attributes.position;
    const bendDir = Math.random() > 0.5 ? 1 : -1;
    for (let i = 0; i < posAttribute.count; i++) {
        const y = posAttribute.getY(i);
        const normalizedY = (y + height / 2) / height;
        const bend = Math.pow(normalizedY, 2) * 2.0 * bendDir;
        posAttribute.setX(i, posAttribute.getX(i) + bend);
    }
    trunkGeo.computeVertexNormals();

    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x6b533d });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = height / 2;
    trunk.castShadow = true;
    item.mesh.add(trunk);
    
    const leavesMat = new THREE.MeshLambertMaterial({ color: 0x4caf50, side: THREE.DoubleSide });
    const numLeaves = 6 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numLeaves; i++) {
        const leafGeo = new THREE.PlaneGeometry(1.5, 6 + Math.random() * 2);
        leafGeo.translate(0, leafGeo.parameters.height / 2, 0); // origin at bottom
        
        const leaf = new THREE.Mesh(leafGeo, leavesMat);
        leaf.position.y = height - 0.5;
        // Curve leaf out
        leaf.rotation.x = Math.PI / 2.5 + Math.random() * 0.2;
        // Rotate around trunk
        leaf.rotation.y = (Math.PI * 2 / numLeaves) * i + Math.random();
        
        leaf.castShadow = true;
        item.mesh.add(leaf);
    }
    
    item.mesh.userData.leavesMat = leavesMat;
    item.type = 'palm';
  }

  morphToPillar(item) {
    if (item.type === 'pillar') return;
    
    while(item.mesh.children.length > 0){ 
        item.mesh.remove(item.mesh.children[0]); 
    }
    
    // Concrete pillar
    const geo = new THREE.BoxGeometry(4, 100, 6);
    const mat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    const pillar = new THREE.Mesh(geo, mat);
    pillar.position.y = 40; 
    pillar.castShadow = true;
    item.mesh.add(pillar);
    
    // Suspension cable
    const cableGeo = new THREE.CylinderGeometry(0.5, 0.5, 120);
    const cableMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    const cable = new THREE.Mesh(cableGeo, cableMat);
    cable.position.y = 40;
    cable.position.z = 30; // Extend backwards
    cable.rotation.x = Math.PI / 6; // Angle down towards the road
    item.mesh.add(cable);

    const cable2 = new THREE.Mesh(cableGeo, cableMat);
    cable2.position.y = 40;
    cable2.position.z = -30; // Extend forwards
    cable2.rotation.x = -Math.PI / 6;
    item.mesh.add(cable2);
    
    item.type = 'pillar';
  }

  setBiome(biome) {
    if (this.biome === biome) return;
    this.biome = biome;
    this.applyState();
  }

  resetSceneryObject(obj, initial = false) {
    const side = Math.random() > 0.5 ? 1 : -1;
    let distanceFromBody = 20 + Math.random() * 80;
    
    if (this.biome === 'city') {
      distanceFromBody = 40 + Math.random() * 80;
    } else if (this.biome === 'bridge') {
      distanceFromBody = 20; // Fixed distance directly adjacent to the road
    }
    
    obj.userData.baseX = side * distanceFromBody;
    obj.position.x = obj.userData.baseX;
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
      case 'noon': sky = 0x87CEFA; fog = 0x9ECBEB; amb = 0xDDDDDD; intens = 0.9; break;
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

    // Biome overrides
    if (this.biome === 'beach') {
      grassColor = 0xEEDC9A; // Sand color
      leafColor = 0x4caf50; // Palm leaf color
    } else if (this.biome === 'city') {
      grassColor = 0xE6D2B5; // Dubai Desert Sand
      mountainColor = 0xC2B280; // Sand Dunes
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

    // 5. Resolve Street Lights
    let streetLightIntensity = 0;
    let bulbColor = 0x444444;
    if (this.state.time === 'evening' || this.state.time === 'night' || this.state.time === 'midnight' || 
        this.state.weather === 'storm' || this.state.weather === 'rain' || this.state.weather === 'fog') {
      streetLightIntensity = 15.0; // High intensity for realistic asphalt illumination
      bulbColor = 0xFFFFAA; // Warm glow
    }
    
    this.targetStreetLightIntensity = streetLightIntensity;
    this.targetBulbColor = new THREE.Color(bulbColor);
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

    // Ocean and Ground animation
    let targetOceanLY = -10;
    let targetOceanRY = -10;
    let targetOceanLX = -300;
    let targetOceanRX = 300;
    let targetGrassY = -0.2;

    if (this.biome === 'beach') {
      targetOceanLY = -0.1;
      targetOceanLX = -300;
    } else if (this.biome === 'bridge') {
      targetOceanLY = -0.15;
      targetOceanRY = -0.15;
      targetOceanLX = -215; // Shift to road edge
      targetOceanRX = 215;  // Shift to road edge
      targetGrassY = -10;   // Hide grass completely
    }

    this.oceanL.position.y = THREE.MathUtils.lerp(this.oceanL.position.y, targetOceanLY, dt * 1.5);
    this.oceanL.position.x = THREE.MathUtils.lerp(this.oceanL.position.x, targetOceanLX, dt * 1.5);
    
    this.oceanR.position.y = THREE.MathUtils.lerp(this.oceanR.position.y, targetOceanRY, dt * 1.5);
    this.oceanR.position.x = THREE.MathUtils.lerp(this.oceanR.position.x, targetOceanRX, dt * 1.5);
    
    this.grassL.position.y = THREE.MathUtils.lerp(this.grassL.position.y, targetGrassY, dt * 1.5);
    this.grassR.position.y = THREE.MathUtils.lerp(this.grassR.position.y, targetGrassY, dt * 1.5);

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
    
    // Update road curve
    this.curveTimer += dt;
    // Slowly change target curve every few seconds
    if (Math.random() < 0.005) {
      this.targetCurveAmount = (Math.random() - 0.5) * 0.0002;
    }
    this.curveAmount = THREE.MathUtils.lerp(this.curveAmount, this.targetCurveAmount, dt * 0.2);

    // Bend the planes
    [this.road, this.sidewalkL, this.sidewalkR, this.grassL, this.grassR, this.oceanL, this.oceanR].forEach(plane => {
        const positions = plane.geometry.attributes.position.array;
        const originalX = plane.userData.originalX;
        for(let i=0; i<positions.length; i+=3) {
            const worldZ = plane.position.z - positions[i+1];
            // Only bend if in front of camera (z < 0)
            if (worldZ < 0) {
                const zDist = Math.abs(worldZ);
                positions[i] = originalX[i] + this.curveAmount * (zDist * zDist);
            } else {
                positions[i] = originalX[i];
            }
        }
        plane.geometry.attributes.position.needsUpdate = true;
    });
    
    for(let divider of this.laneDividers) {
      divider.position.z += movement;
      if (divider.position.z > 20) {
        divider.position.z -= 600;
      }
      
      // Apply curve to divider
      if (divider.position.z < 0) {
        const zDist = Math.abs(divider.position.z);
        const originalX = divider === this.laneDividers[this.laneDividers.indexOf(divider)] ? 
            (this.laneDividers.indexOf(divider) % 2 === 0 ? -this.roadWidth/6 : this.roadWidth/6) : 0;
        divider.position.x = originalX + this.curveAmount * (zDist * zDist);
      }
    }
    
    for(let item of this.sceneryObjects) {
      item.mesh.position.z += movement;
      
      // Curve
      if (item.mesh.position.z < 0) {
        const zDist = Math.abs(item.mesh.position.z);
        item.mesh.position.x = item.mesh.userData.baseX + this.curveAmount * (zDist * zDist);
      }

      if (item.mesh.position.z > 50) {
        this.resetSceneryObject(item.mesh);
        
        if (this.biome === 'city') {
          if (Math.random() > 0.85) {
            this.morphToPalmTree(item);
          } else {
            this.morphToBuilding(item);
          }
        } else if (this.biome === 'beach') {
          this.morphToPalmTree(item);
        } else if (this.biome === 'bridge') {
          this.morphToPillar(item);
        } else {
          this.morphToTree(item);
        }

        // Instant color update on reset to prevent mismatched colors coming into view
        if (item.type === 'tree') {
          item.mesh.userData.leavesMat.color.copy(this.targetLeafColor);
        }
      }
    }

    for(let mountain of this.mountains) {
      mountain.position.z += movement * 0.1;
      
      // Curve mountains too
      if (mountain.position.z < 0) {
        const zDist = Math.abs(mountain.position.z);
        if (mountain.userData.baseX === undefined) {
          mountain.userData.baseX = mountain.position.x;
        }
        mountain.position.x = mountain.userData.baseX + this.curveAmount * (zDist * zDist) * 0.5; // less curve for distant objects
      }

      const targetY = (this.biome === 'beach' || this.biome === 'bridge') ? -200 : 50;
      mountain.position.y = THREE.MathUtils.lerp(mountain.position.y, targetY, dt * 2.0);

      if (mountain.position.z > 100) {
        mountain.position.z -= 600;
        mountain.position.x = (Math.random() > 0.5 ? 1 : -1) * (150 + Math.random() * 150);
      }
    }

    // Street Lights
    this.bulbMat.color.lerp(this.targetBulbColor, lerpSpeed);
    for(let sl of this.streetLights) {
      sl.userData.light.intensity = THREE.MathUtils.lerp(sl.userData.light.intensity, this.targetStreetLightIntensity, lerpSpeed);
      sl.position.z += movement;
      if (sl.position.z > 20) {
        sl.position.z -= 800; // loop back
      }
    }
  }
}
