// game-engine.ts - Main game engine connecting ECS systems to HTML5 Canvas
import { World, IWorld } from '../ecs/ecs-core';
import { GameRenderer } from './game-renderer';
import { InputManager } from './input-manager';

export interface IGameEngine {
  start(): void;
  stop(): void;
  update(deltaTime: number): void;
  render(): void;
  isRunning(): boolean;
  getFPS(): number;
  getFrameTime(): number;
  getAverageFPS(): number;
  resetPerformanceStats(): void;
  getWorld(): IWorld;
  setWorld(world: IWorld): void;
  getCanvas(): HTMLCanvasElement;
  getRenderer(): GameRenderer;
}

export class GameEngine implements IGameEngine {
  private canvas: HTMLCanvasElement;
  private world: IWorld;
  private renderer: GameRenderer;
  private inputManager: InputManager;
  
  private running: boolean = false;
  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;
  
  // Performance tracking
  private currentFPS: number = 0;
  private frameTime: number = 0;
  private fpsHistory: number[] = [];
  private maxFPSHistory: number = 60; // Track last 60 frames for average
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.world = new World();
    this.renderer = new GameRenderer(canvas);
    this.inputManager = new InputManager(canvas);
    
    // Bind methods to preserve 'this' context
    this.gameLoop = this.gameLoop.bind(this);
  }

  start(): void {
    if (this.running) {
      return; // Already running
    }
    
    this.running = true;
    this.lastFrameTime = performance.now();
    this.resetPerformanceStats();
    
    // Initialize input system
    this.inputManager.enable();
    
    // Start the game loop
    this.gameLoop();
  }

  stop(): void {
    if (!this.running) {
      return; // Already stopped
    }
    
    this.running = false;
    
    // Cancel animation frame if active
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Cleanup systems
    this.inputManager.disable();
    this.world.cleanup();
  }

  private gameLoop(): void {
    if (!this.running) {
      return;
    }

    try {
      const currentTime = performance.now();
      const deltaTime = currentTime - this.lastFrameTime;
      
      // Update game state
      this.update(deltaTime);
      
      // Render frame
      this.render();
      
      this.lastFrameTime = currentTime;
      
      // Schedule next frame
      this.animationFrameId = requestAnimationFrame(this.gameLoop);
      
    } catch (error) {
      console.error('Game loop error:', error);
      this.stop(); // Stop on critical errors
    }
  }

  update(deltaTime: number): void {
    try {
      // Update frame time tracking
      this.frameTime = deltaTime;
      
      // Calculate FPS
      if (deltaTime > 0) {
        this.currentFPS = 1000 / deltaTime;
        
        // Track FPS history for averaging
        this.fpsHistory.push(this.currentFPS);
        if (this.fpsHistory.length > this.maxFPSHistory) {
          this.fpsHistory.shift();
        }
      } else {
        this.currentFPS = 0;
      }
      
      // Update world systems
      this.world.update(deltaTime);
      
      // Update input system
      this.inputManager.update(deltaTime);
      
    } catch (error) {
      console.error('Update error:', error);
      this.stop();
    }
  }

  render(): void {
    try {
      // Clear canvas
      const context = this.canvas.getContext('2d');
      if (context) {
        context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
      
      // Render world
      this.renderer.render(this.world);
      
    } catch (error) {
      console.error('Render error:', error);
      // Don't stop on render errors, just log them
    }
  }

  isRunning(): boolean {
    return this.running;
  }

  getFPS(): number {
    return Math.round(this.currentFPS);
  }

  getFrameTime(): number {
    return this.frameTime;
  }

  getAverageFPS(): number {
    if (this.fpsHistory.length === 0) {
      return 0;
    }
    
    const sum = this.fpsHistory.reduce((acc, fps) => acc + fps, 0);
    return Math.round(sum / this.fpsHistory.length);
  }

  resetPerformanceStats(): void {
    this.currentFPS = 0;
    this.frameTime = 0;
    this.fpsHistory = [];
  }

  getWorld(): IWorld {
    return this.world;
  }

  setWorld(world: IWorld): void {
    // Cleanup old world if running
    if (this.running) {
      this.world.cleanup();
    }
    
    this.world = world;
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  getRenderer(): GameRenderer {
    return this.renderer;
  }

  // Additional utility methods for debugging and monitoring
  getEntityCount(): number {
    return this.world.entities.size;
  }

  getSystemCount(): number {
    return this.world.systems.size;
  }

  getPerformanceInfo(): {
    fps: number;
    averageFPS: number;
    frameTime: number;
    entityCount: number;
    systemCount: number;
    isRunning: boolean;
  } {
    return {
      fps: this.getFPS(),
      averageFPS: this.getAverageFPS(),
      frameTime: this.getFrameTime(),
      entityCount: this.getEntityCount(),
      systemCount: this.getSystemCount(),
      isRunning: this.isRunning()
    };
  }
}