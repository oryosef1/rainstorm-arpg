/* =============================================================================
   RainStorm ARPG - Advanced Particle System
   JavaScript/TypeScript Implementation for Dynamic Visual Effects
   ============================================================================= */

export interface ParticleConfig {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  gravity?: number;
  fade?: boolean;
  glow?: boolean;
  type?: 'spark' | 'smoke' | 'magic' | 'ember' | 'lightning' | 'ice';
}

export interface ParticleSystemConfig {
  maxParticles: number;
  emissionRate: number;
  particleLife: number;
  startSize: number;
  endSize: number;
  startColor: string;
  endColor: string;
  gravity: number;
  wind: number;
  spread: number;
  speed: number;
  fadeOut: boolean;
  glowEffect: boolean;
  type: 'fire' | 'ice' | 'lightning' | 'magic' | 'smoke' | 'sparkle' | 'explosion';
}

export class Particle {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public life: number;
  public maxLife: number;
  public size: number;
  public startSize: number;
  public endSize: number;
  public color: string;
  public startColor: string;
  public endColor: string;
  public alpha: number;
  public gravity: number;
  public fade: boolean;
  public glow: boolean;
  public type: string;
  public rotation: number;
  public rotationSpeed: number;

  constructor(config: ParticleConfig & Partial<ParticleSystemConfig>) {
    this.x = config.x;
    this.y = config.y;
    this.vx = config.vx;
    this.vy = config.vy;
    this.life = config.life;
    this.maxLife = config.maxLife;
    this.size = config.size;
    this.startSize = config.startSize || config.size;
    this.endSize = config.endSize || config.size * 0.1;
    this.color = config.color;
    this.startColor = config.startColor || config.color;
    this.endColor = config.endColor || config.color;
    this.alpha = config.alpha;
    this.gravity = config.gravity || 0;
    this.fade = config.fade || false;
    this.glow = config.glow || false;
    this.type = config.type || 'spark';
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.2;
  }

  update(deltaTime: number): void {
    // Update position
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    
    // Apply gravity
    this.vy += this.gravity * deltaTime;
    
    // Update rotation
    this.rotation += this.rotationSpeed * deltaTime;
    
    // Update life
    this.life -= deltaTime;
    
    // Calculate life ratio
    const lifeRatio = 1 - (this.life / this.maxLife);
    
    // Update size based on life
    this.size = this.startSize + (this.endSize - this.startSize) * lifeRatio;
    
    // Update alpha if fading
    if (this.fade) {
      this.alpha = Math.max(0, 1 - lifeRatio);
    }
    
    // Update color interpolation
    this.updateColor(lifeRatio);
  }

  private updateColor(lifeRatio: number): void {
    // Simple color interpolation for common particle types
    switch (this.type) {
      case 'fire':
        if (lifeRatio < 0.3) {
          this.color = '#ffff44'; // Yellow
        } else if (lifeRatio < 0.7) {
          this.color = '#ff8800'; // Orange
        } else {
          this.color = '#ff4444'; // Red
        }
        break;
      case 'ice':
        this.color = `rgba(68, 170, 255, ${this.alpha})`;
        break;
      case 'lightning':
        this.color = lifeRatio < 0.5 ? '#ffffff' : '#ffff44';
        break;
      case 'magic':
        this.color = `rgba(211, 145, 95, ${this.alpha})`;
        break;
      default:
        this.color = this.startColor;
    }
  }

  isDead(): boolean {
    return this.life <= 0 || this.alpha <= 0;
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    
    // Set alpha
    ctx.globalAlpha = this.alpha;
    
    // Apply glow effect
    if (this.glow) {
      ctx.shadowColor = this.color;
      ctx.shadowBlur = this.size * 2;
    }
    
    // Translate and rotate
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    
    // Render based on type
    this.renderParticle(ctx);
    
    ctx.restore();
  }

  private renderParticle(ctx: CanvasRenderingContext2D): void {
    switch (this.type) {
      case 'spark':
        this.renderSpark(ctx);
        break;
      case 'smoke':
        this.renderSmoke(ctx);
        break;
      case 'magic':
        this.renderMagic(ctx);
        break;
      case 'ember':
        this.renderEmber(ctx);
        break;
      case 'lightning':
        this.renderLightning(ctx);
        break;
      case 'ice':
        this.renderIce(ctx);
        break;
      default:
        this.renderDefault(ctx);
    }
  }

  private renderSpark(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Add spark trail
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-this.size * 2, 0);
    ctx.lineTo(this.size * 2, 0);
    ctx.stroke();
  }

  private renderSmoke(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderMagic(ctx: CanvasRenderingContext2D): void {
    // Render magical sparkle
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Add cross pattern
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-this.size, 0);
    ctx.lineTo(this.size, 0);
    ctx.moveTo(0, -this.size);
    ctx.lineTo(0, this.size);
    ctx.stroke();
  }

  private renderEmber(ctx: CanvasRenderingContext2D): void {
    // Render glowing ember
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderLightning(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    
    // Draw zigzag lightning pattern
    ctx.beginPath();
    ctx.moveTo(-this.size, -this.size);
    ctx.lineTo(0, 0);
    ctx.lineTo(this.size, -this.size);
    ctx.lineTo(0, this.size);
    ctx.stroke();
  }

  private renderIce(ctx: CanvasRenderingContext2D): void {
    // Render crystalline ice particle
    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    ctx.moveTo(0, -this.size);
    ctx.lineTo(this.size * 0.7, -this.size * 0.3);
    ctx.lineTo(this.size * 0.7, this.size * 0.3);
    ctx.lineTo(0, this.size);
    ctx.lineTo(-this.size * 0.7, this.size * 0.3);
    ctx.lineTo(-this.size * 0.7, -this.size * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  private renderDefault(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private config: ParticleSystemConfig;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private isActive: boolean = true;

  constructor(canvas: HTMLCanvasElement, config: Partial<ParticleSystemConfig> = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    
    this.config = {
      maxParticles: 100,
      emissionRate: 30, // particles per second
      particleLife: 2000, // milliseconds
      startSize: 3,
      endSize: 0.5,
      startColor: '#ffffff',
      endColor: '#ffffff',
      gravity: 50,
      wind: 0,
      spread: Math.PI / 4,
      speed: 100,
      fadeOut: true,
      glowEffect: true,
      type: 'magic',
      ...config
    };
  }

  public setConfig(config: Partial<ParticleSystemConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public emit(x: number, y: number, count: number = 1): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.config.maxParticles) {
        // Remove oldest particle
        this.particles.shift();
      }

      const angle = (Math.random() - 0.5) * this.config.spread;
      const speed = this.config.speed * (0.5 + Math.random() * 0.5);
      
      const particle = new Particle({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + (Math.random() - 0.5) * speed * 0.5,
        life: this.config.particleLife * (0.5 + Math.random() * 0.5),
        maxLife: this.config.particleLife,
        size: this.config.startSize * (0.5 + Math.random() * 0.5),
        color: this.config.startColor,
        alpha: 1,
        gravity: this.config.gravity,
        fade: this.config.fadeOut,
        glow: this.config.glowEffect,
        type: this.config.type,
        startSize: this.config.startSize,
        endSize: this.config.endSize,
        startColor: this.config.startColor,
        endColor: this.config.endColor
      });

      this.particles.push(particle);
    }
  }

  public update(deltaTime: number): void {
    if (!this.isActive) return;

    // Update all particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.update(deltaTime / 1000); // Convert to seconds

      // Remove dead particles
      if (particle.isDead()) {
        this.particles.splice(i, 1);
      }
    }
  }

  public render(): void {
    if (!this.isActive) return;

    // Clear previous frame
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Render all particles
    for (const particle of this.particles) {
      particle.render(this.ctx);
    }
  }

  public animate(currentTime: number = performance.now()): void {
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.render();

    if (this.isActive) {
      requestAnimationFrame((time) => this.animate(time));
    }
  }

  public start(): void {
    this.isActive = true;
    this.animate();
  }

  public stop(): void {
    this.isActive = false;
  }

  public clear(): void {
    this.particles = [];
  }

  public getParticleCount(): number {
    return this.particles.length;
  }

  // Preset particle effects
  public createFireEffect(x: number, y: number): void {
    this.setConfig({
      type: 'fire',
      startColor: '#ffff44',
      endColor: '#ff4444',
      gravity: -30,
      speed: 60,
      spread: Math.PI / 3,
      particleLife: 1500,
      glowEffect: true
    });
    this.emit(x, y, 15);
  }

  public createIceEffect(x: number, y: number): void {
    this.setConfig({
      type: 'ice',
      startColor: '#44aaff',
      endColor: '#ffffff',
      gravity: 20,
      speed: 40,
      spread: Math.PI / 6,
      particleLife: 2000,
      glowEffect: true
    });
    this.emit(x, y, 10);
  }

  public createLightningEffect(x: number, y: number): void {
    this.setConfig({
      type: 'lightning',
      startColor: '#ffffff',
      endColor: '#ffff44',
      gravity: 0,
      speed: 80,
      spread: Math.PI / 8,
      particleLife: 500,
      glowEffect: true
    });
    this.emit(x, y, 8);
  }

  public createMagicEffect(x: number, y: number): void {
    this.setConfig({
      type: 'magic',
      startColor: '#d3915f',
      endColor: '#9a5b9f',
      gravity: -10,
      speed: 50,
      spread: Math.PI / 2,
      particleLife: 2500,
      glowEffect: true
    });
    this.emit(x, y, 20);
  }

  public createExplosionEffect(x: number, y: number): void {
    this.setConfig({
      type: 'ember',
      startColor: '#ffffff',
      endColor: '#ff4444',
      gravity: 30,
      speed: 120,
      spread: Math.PI * 2,
      particleLife: 1000,
      glowEffect: true
    });
    this.emit(x, y, 30);
  }

  public createHealEffect(x: number, y: number): void {
    this.setConfig({
      type: 'magic',
      startColor: '#44ff44',
      endColor: '#ffffff',
      gravity: -20,
      speed: 30,
      spread: Math.PI / 4,
      particleLife: 2000,
      glowEffect: true
    });
    this.emit(x, y, 12);
  }
}

// Particle effect manager for game integration
export class ParticleEffectManager {
  private systems: Map<string, ParticleSystem> = new Map();
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  public createSystem(id: string, config?: Partial<ParticleSystemConfig>): ParticleSystem {
    const system = new ParticleSystem(this.canvas, config);
    this.systems.set(id, system);
    return system;
  }

  public getSystem(id: string): ParticleSystem | undefined {
    return this.systems.get(id);
  }

  public removeSystem(id: string): void {
    const system = this.systems.get(id);
    if (system) {
      system.stop();
      this.systems.delete(id);
    }
  }

  public playEffect(effectType: string, x: number, y: number): void {
    const systemId = `${effectType}_${Date.now()}`;
    const system = this.createSystem(systemId);

    switch (effectType) {
      case 'fire':
        system.createFireEffect(x, y);
        break;
      case 'ice':
        system.createIceEffect(x, y);
        break;
      case 'lightning':
        system.createLightningEffect(x, y);
        break;
      case 'magic':
        system.createMagicEffect(x, y);
        break;
      case 'explosion':
        system.createExplosionEffect(x, y);
        break;
      case 'heal':
        system.createHealEffect(x, y);
        break;
    }

    system.start();

    // Auto-cleanup after effect completes
    setTimeout(() => {
      this.removeSystem(systemId);
    }, 5000);
  }

  public update(deltaTime: number): void {
    for (const system of this.systems.values()) {
      system.update(deltaTime);
    }
  }

  public render(): void {
    for (const system of this.systems.values()) {
      system.render();
    }
  }

  public clearAll(): void {
    for (const system of this.systems.values()) {
      system.clear();
    }
  }
}