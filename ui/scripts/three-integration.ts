/* =============================================================================
   RainStorm ARPG - Three.js 3D Integration
   Advanced 3D Character Models and Environmental Effects
   ============================================================================= */

import * as THREE from 'three';

export interface Character3DConfig {
  modelPath: string;
  animationPaths: string[];
  scale: number;
  position: THREE.Vector3;
  className: string;
  equipment: EquipmentSlot[];
}

export interface EquipmentSlot {
  type: 'helmet' | 'armor' | 'weapon' | 'shield' | 'boots' | 'gloves';
  modelPath: string;
  attachmentPoint: string;
  scale: number;
  position: THREE.Vector3;
  rotation: THREE.Vector3;
}

export interface EnvironmentConfig {
  skybox: string;
  lighting: LightingConfig;
  fog: FogConfig;
  postProcessing: PostProcessingConfig;
}

export interface LightingConfig {
  ambient: {
    color: number;
    intensity: number;
  };
  directional: {
    color: number;
    intensity: number;
    position: THREE.Vector3;
    castShadow: boolean;
  };
  point: Array<{
    color: number;
    intensity: number;
    position: THREE.Vector3;
    distance: number;
    decay: number;
  }>;
}

export interface FogConfig {
  enabled: boolean;
  color: number;
  near: number;
  far: number;
  density?: number;
}

export interface PostProcessingConfig {
  bloom: boolean;
  ssao: boolean;
  fxaa: boolean;
  colorGrading: boolean;
}

export class Character3DRenderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private mixer: THREE.AnimationMixer | null = null;
  private characterModel: THREE.Group | null = null;
  private equipment: Map<string, THREE.Object3D> = new Map();
  private animations: Map<string, THREE.AnimationAction> = new Map();
  private clock: THREE.Clock;
  private loader: THREE.GLTFLoader;

  constructor(container: HTMLElement, width: number, height: number) {
    // Initialize Three.js components
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.clock = new THREE.Clock();
    this.loader = new THREE.GLTFLoader();

    // Configure renderer
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    container.appendChild(this.renderer.domElement);

    // Setup default camera position
    this.camera.position.set(0, 1.6, 3);
    this.camera.lookAt(0, 1, 0);

    // Setup basic lighting
    this.setupDefaultLighting();

    // Start render loop
    this.animate();
  }

  private setupDefaultLighting(): void {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(ambientLight);

    // Main directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    this.scene.add(directionalLight);

    // Rim light for character definition
    const rimLight = new THREE.DirectionalLight(0x4444ff, 0.3);
    rimLight.position.set(-5, 5, -5);
    this.scene.add(rimLight);

    // Point lights for magical effects
    const magicLight1 = new THREE.PointLight(0xd3915f, 0.5, 10);
    magicLight1.position.set(2, 2, 2);
    this.scene.add(magicLight1);

    const magicLight2 = new THREE.PointLight(0x9a5b9f, 0.3, 8);
    magicLight2.position.set(-2, 1.5, -2);
    this.scene.add(magicLight2);
  }

  public async loadCharacter(config: Character3DConfig): Promise<void> {
    try {
      // Load main character model
      const gltf = await this.loadModel(config.modelPath);
      this.characterModel = gltf.scene;
      
      // Scale and position the model
      this.characterModel.scale.setScalar(config.scale);
      this.characterModel.position.copy(config.position);
      
      // Setup animations
      if (gltf.animations && gltf.animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(this.characterModel);
        
        gltf.animations.forEach((clip) => {
          const action = this.mixer!.clipAction(clip);
          this.animations.set(clip.name, action);
        });
        
        // Start idle animation by default
        this.playAnimation('idle', true);
      }

      // Enable shadows
      this.characterModel.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          
          // Enhance materials for ARPG aesthetic
          if (child.material) {
            this.enhanceMaterial(child.material as THREE.MeshStandardMaterial);
          }
        }
      });

      this.scene.add(this.characterModel);

      // Load equipment
      for (const equipment of config.equipment) {
        await this.loadEquipment(equipment);
      }

    } catch (error) {
      console.error('Failed to load character:', error);
    }
  }

  private async loadModel(path: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        path,
        (gltf) => resolve(gltf),
        (progress) => {
          console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
        },
        (error) => reject(error)
      );
    });
  }

  private async loadEquipment(equipment: EquipmentSlot): Promise<void> {
    try {
      const gltf = await this.loadModel(equipment.modelPath);
      const equipmentModel = gltf.scene;
      
      // Scale and position equipment
      equipmentModel.scale.setScalar(equipment.scale);
      equipmentModel.position.copy(equipment.position);
      equipmentModel.rotation.setFromVector3(equipment.rotation);

      // Find attachment point on character
      if (this.characterModel) {
        const attachmentPoint = this.characterModel.getObjectByName(equipment.attachmentPoint);
        if (attachmentPoint) {
          attachmentPoint.add(equipmentModel);
        } else {
          // Fallback to character root
          this.characterModel.add(equipmentModel);
        }
      }

      // Setup shadows and materials
      equipmentModel.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          
          if (child.material) {
            this.enhanceMaterial(child.material as THREE.MeshStandardMaterial);
          }
        }
      });

      this.equipment.set(equipment.type, equipmentModel);

    } catch (error) {
      console.error(`Failed to load equipment ${equipment.type}:`, error);
    }
  }

  private enhanceMaterial(material: THREE.MeshStandardMaterial): void {
    // Enhance materials for ARPG aesthetic
    material.envMapIntensity = 0.5;
    material.roughness = 0.7;
    material.metalness = 0.3;
    
    // Add subtle emissive glow for magical items
    if (material.name.includes('magic') || material.name.includes('legendary')) {
      material.emissive = new THREE.Color(0x2a1a3a);
      material.emissiveIntensity = 0.1;
    }
  }

  public playAnimation(name: string, loop: boolean = false): void {
    if (!this.animations.has(name)) {
      console.warn(`Animation '${name}' not found`);
      return;
    }

    // Stop all current animations
    this.animations.forEach((action) => {
      action.stop();
    });

    // Play the requested animation
    const action = this.animations.get(name)!;
    action.reset();
    action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
    action.play();
  }

  public crossFadeAnimation(from: string, to: string, duration: number = 0.5): void {
    if (!this.animations.has(from) || !this.animations.has(to)) {
      console.warn('One or both animations not found for crossfade');
      return;
    }

    const fromAction = this.animations.get(from)!;
    const toAction = this.animations.get(to)!;

    // Setup crossfade
    toAction.reset();
    toAction.setEffectiveWeight(0);
    toAction.play();

    // Perform crossfade
    fromAction.crossFadeTo(toAction, duration, true);
  }

  public updateEquipment(type: string, equipment: EquipmentSlot | null): void {
    // Remove existing equipment
    if (this.equipment.has(type)) {
      const existingEquipment = this.equipment.get(type)!;
      existingEquipment.parent?.remove(existingEquipment);
      this.equipment.delete(type);
    }

    // Add new equipment
    if (equipment) {
      this.loadEquipment(equipment);
    }
  }

  public setCameraPosition(position: THREE.Vector3, lookAt?: THREE.Vector3): void {
    this.camera.position.copy(position);
    if (lookAt) {
      this.camera.lookAt(lookAt);
    }
  }

  public setupEnvironment(config: EnvironmentConfig): void {
    // Setup skybox
    if (config.skybox) {
      const loader = new THREE.CubeTextureLoader();
      const skyboxTexture = loader.load([
        `${config.skybox}/px.jpg`, `${config.skybox}/nx.jpg`,
        `${config.skybox}/py.jpg`, `${config.skybox}/ny.jpg`,
        `${config.skybox}/pz.jpg`, `${config.skybox}/nz.jpg`
      ]);
      this.scene.background = skyboxTexture;
      this.scene.environment = skyboxTexture;
    }

    // Setup fog
    if (config.fog.enabled) {
      if (config.fog.density !== undefined) {
        this.scene.fog = new THREE.FogExp2(config.fog.color, config.fog.density);
      } else {
        this.scene.fog = new THREE.Fog(config.fog.color, config.fog.near, config.fog.far);
      }
    }

    // Update lighting
    this.updateLighting(config.lighting);
  }

  private updateLighting(lighting: LightingConfig): void {
    // Clear existing lights
    const lightsToRemove: THREE.Light[] = [];
    this.scene.traverse((object) => {
      if (object instanceof THREE.Light) {
        lightsToRemove.push(object);
      }
    });
    lightsToRemove.forEach(light => this.scene.remove(light));

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(lighting.ambient.color, lighting.ambient.intensity);
    this.scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(
      lighting.directional.color, 
      lighting.directional.intensity
    );
    directionalLight.position.copy(lighting.directional.position);
    directionalLight.castShadow = lighting.directional.castShadow;
    
    if (directionalLight.castShadow) {
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      directionalLight.shadow.camera.near = 0.5;
      directionalLight.shadow.camera.far = 50;
    }
    
    this.scene.add(directionalLight);

    // Add point lights
    lighting.point.forEach((pointConfig) => {
      const pointLight = new THREE.PointLight(
        pointConfig.color,
        pointConfig.intensity,
        pointConfig.distance,
        pointConfig.decay
      );
      pointLight.position.copy(pointConfig.position);
      this.scene.add(pointLight);
    });
  }

  public addSpellEffect(type: string, position: THREE.Vector3): void {
    switch (type) {
      case 'fire':
        this.createFireEffect(position);
        break;
      case 'ice':
        this.createIceEffect(position);
        break;
      case 'lightning':
        this.createLightningEffect(position);
        break;
      case 'magic':
        this.createMagicEffect(position);
        break;
    }
  }

  private createFireEffect(position: THREE.Vector3): void {
    // Create fire particle system
    const fireGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const fireMaterial = new THREE.MeshBasicMaterial({
      color: 0xff4444,
      transparent: true,
      opacity: 0.8
    });

    for (let i = 0; i < 20; i++) {
      const fireBall = new THREE.Mesh(fireGeometry, fireMaterial);
      fireBall.position.copy(position);
      fireBall.position.x += (Math.random() - 0.5) * 0.5;
      fireBall.position.y += Math.random() * 0.5;
      fireBall.position.z += (Math.random() - 0.5) * 0.5;
      
      this.scene.add(fireBall);

      // Animate fire particles
      const startPos = fireBall.position.clone();
      const targetPos = startPos.clone();
      targetPos.y += 1 + Math.random();
      
      const animateFireParticle = () => {
        fireBall.position.lerp(targetPos, 0.02);
        fireBall.material.opacity *= 0.98;
        
        if (fireBall.material.opacity > 0.01) {
          requestAnimationFrame(animateFireParticle);
        } else {
          this.scene.remove(fireBall);
        }
      };
      
      setTimeout(() => animateFireParticle(), i * 50);
    }
  }

  private createIceEffect(position: THREE.Vector3): void {
    // Create ice shard effect
    const iceGeometry = new THREE.ConeGeometry(0.05, 0.3, 6);
    const iceMaterial = new THREE.MeshStandardMaterial({
      color: 0x44aaff,
      transparent: true,
      opacity: 0.8,
      roughness: 0.1,
      metalness: 0.9
    });

    for (let i = 0; i < 12; i++) {
      const iceShard = new THREE.Mesh(iceGeometry, iceMaterial);
      iceShard.position.copy(position);
      
      const angle = (i / 12) * Math.PI * 2;
      const radius = 0.5;
      iceShard.position.x += Math.cos(angle) * radius;
      iceShard.position.z += Math.sin(angle) * radius;
      iceShard.rotation.z = angle;
      
      this.scene.add(iceShard);

      // Animate ice shards
      const targetY = position.y + 2;
      const animateIceShard = () => {
        iceShard.position.y += 0.05;
        iceShard.rotation.y += 0.1;
        iceShard.material.opacity *= 0.99;
        
        if (iceShard.position.y < targetY && iceShard.material.opacity > 0.01) {
          requestAnimationFrame(animateIceShard);
        } else {
          this.scene.remove(iceShard);
        }
      };
      
      setTimeout(() => animateIceShard(), i * 30);
    }
  }

  private createLightningEffect(position: THREE.Vector3): void {
    // Create lightning bolt effect
    const lightningMaterial = new THREE.LineBasicMaterial({
      color: 0xffff44,
      linewidth: 3
    });

    const points: THREE.Vector3[] = [];
    const startPos = position.clone();
    const endPos = position.clone();
    endPos.y += 3;

    // Create zigzag lightning path
    const segments = 10;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const point = startPos.clone().lerp(endPos, t);
      
      // Add random zigzag
      if (i > 0 && i < segments) {
        point.x += (Math.random() - 0.5) * 0.3;
        point.z += (Math.random() - 0.5) * 0.3;
      }
      
      points.push(point);
    }

    const lightningGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const lightning = new THREE.Line(lightningGeometry, lightningMaterial);
    this.scene.add(lightning);

    // Add lightning glow
    const glowLight = new THREE.PointLight(0xffff44, 2, 5);
    glowLight.position.copy(position);
    this.scene.add(glowLight);

    // Animate lightning
    let opacity = 1;
    const animateLightning = () => {
      opacity *= 0.95;
      lightning.material.opacity = opacity;
      glowLight.intensity *= 0.95;
      
      if (opacity > 0.01) {
        requestAnimationFrame(animateLightning);
      } else {
        this.scene.remove(lightning);
        this.scene.remove(glowLight);
      }
    };
    
    animateLightning();
  }

  private createMagicEffect(position: THREE.Vector3): void {
    // Create magical energy orb
    const orbGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const orbMaterial = new THREE.MeshStandardMaterial({
      color: 0xd3915f,
      emissive: 0xd3915f,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.8
    });

    const magicOrb = new THREE.Mesh(orbGeometry, orbMaterial);
    magicOrb.position.copy(position);
    this.scene.add(magicOrb);

    // Add magical particles around orb
    const particleGeometry = new THREE.SphereGeometry(0.02, 8, 8);
    const particleMaterial = new THREE.MeshBasicMaterial({
      color: 0x9a5b9f,
      transparent: true
    });

    const particles: THREE.Mesh[] = [];
    for (let i = 0; i < 30; i++) {
      const particle = new THREE.Mesh(particleGeometry, particleMaterial.clone());
      particle.position.copy(position);
      particles.push(particle);
      this.scene.add(particle);
    }

    // Animate magic effect
    let time = 0;
    const animateMagic = () => {
      time += 0.1;
      
      // Rotate and scale orb
      magicOrb.rotation.y += 0.05;
      magicOrb.scale.setScalar(1 + Math.sin(time) * 0.1);
      
      // Animate particles in spiral
      particles.forEach((particle, index) => {
        const angle = time + (index / particles.length) * Math.PI * 2;
        const radius = 0.5 + Math.sin(time + index) * 0.2;
        const height = Math.sin(time * 2 + index) * 0.3;
        
        particle.position.x = position.x + Math.cos(angle) * radius;
        particle.position.y = position.y + height;
        particle.position.z = position.z + Math.sin(angle) * radius;
        
        (particle.material as THREE.MeshBasicMaterial).opacity = 
          0.8 + Math.sin(time * 3 + index) * 0.2;
      });

      // Fade out effect
      magicOrb.material.opacity *= 0.998;
      
      if (magicOrb.material.opacity > 0.01) {
        requestAnimationFrame(animateMagic);
      } else {
        this.scene.remove(magicOrb);
        particles.forEach(particle => this.scene.remove(particle));
      }
    };
    
    animateMagic();
  }

  private animate(): void {
    // Update animations
    if (this.mixer) {
      this.mixer.update(this.clock.getDelta());
    }

    // Render scene
    this.renderer.render(this.scene, this.camera);

    // Continue animation loop
    requestAnimationFrame(() => this.animate());
  }

  public resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public dispose(): void {
    // Clean up resources
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });

    this.renderer.dispose();
  }
}

// Export utility functions for Three.js integration
export const ThreeUtils = {
  // Convert screen coordinates to 3D world coordinates
  screenTo3D(
    screenX: number, 
    screenY: number, 
    camera: THREE.Camera, 
    renderer: THREE.WebGLRenderer
  ): THREE.Vector3 {
    const rect = renderer.domElement.getBoundingClientRect();
    const x = ((screenX - rect.left) / rect.width) * 2 - 1;
    const y = -((screenY - rect.top) / rect.height) * 2 + 1;
    
    const vector = new THREE.Vector3(x, y, 0.5);
    vector.unproject(camera);
    
    return vector;
  },

  // Create material presets for different item rarities
  createRarityMaterial(rarity: string): THREE.MeshStandardMaterial {
    const materials: Record<string, any> = {
      common: { color: 0xc0c0c0, emissive: 0x000000 },
      magic: { color: 0x6666ff, emissive: 0x111144 },
      rare: { color: 0xffff00, emissive: 0x444400 },
      unique: { color: 0xff8800, emissive: 0x442200 },
      legendary: { color: 0xff6b35, emissive: 0x441a0d },
      mythic: { color: 0xe6e6fa, emissive: 0x2a2a3a }
    };

    const config = materials[rarity] || materials.common;
    return new THREE.MeshStandardMaterial({
      color: config.color,
      emissive: config.emissive,
      emissiveIntensity: 0.2,
      roughness: 0.6,
      metalness: 0.4
    });
  }
};