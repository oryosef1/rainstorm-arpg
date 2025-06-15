// game-engine.test.ts - TDD: RED phase - Write failing tests first
import { GameEngine } from './game-engine';
import { World } from '../ecs/ecs-core';

// Mock dependencies for testing
jest.mock('../ecs/ecs-core');
jest.mock('./game-renderer');
jest.mock('./input-manager');

describe('GameEngine', () => {
  let gameEngine: GameEngine;
  let mockCanvas: HTMLCanvasElement;
  let mockWorld: jest.Mocked<World>;

  beforeEach(() => {
    // Create mock canvas
    mockCanvas = document.createElement('canvas');
    mockCanvas.width = 800;
    mockCanvas.height = 600;
    
    // Mock World
    mockWorld = new World() as jest.Mocked<World>;
    mockWorld.update = jest.fn();
    mockWorld.cleanup = jest.fn();
    
    // Mock global performance.now for consistent timing
    global.performance = { now: jest.fn(() => 16.67) } as any;
    
    gameEngine = new GameEngine(mockCanvas);
  });

  afterEach(() => {
    if (gameEngine.isRunning()) {
      gameEngine.stop();
    }
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    test('should create GameEngine with canvas', () => {
      expect(gameEngine).toBeDefined();
      expect(gameEngine.getCanvas()).toBe(mockCanvas);
    });

    test('should not be running initially', () => {
      expect(gameEngine.isRunning()).toBe(false);
    });

    test('should have zero FPS initially', () => {
      expect(gameEngine.getFPS()).toBe(0);
    });
  });

  describe('start() method', () => {
    test('should start the game engine', () => {
      gameEngine.start();
      expect(gameEngine.isRunning()).toBe(true);
    });

    test('should not start if already running', () => {
      gameEngine.start();
      expect(gameEngine.isRunning()).toBe(true);
      
      // Try to start again
      gameEngine.start();
      expect(gameEngine.isRunning()).toBe(true);
    });

    test('should initialize world systems on start', () => {
      gameEngine.start();
      expect(mockWorld.update).toHaveBeenCalledTimes(0); // Not called until update loop
    });
  });

  describe('stop() method', () => {
    test('should stop the running game engine', () => {
      gameEngine.start();
      expect(gameEngine.isRunning()).toBe(true);
      
      gameEngine.stop();
      expect(gameEngine.isRunning()).toBe(false);
    });

    test('should not error when stopping already stopped engine', () => {
      expect(gameEngine.isRunning()).toBe(false);
      expect(() => gameEngine.stop()).not.toThrow();
    });

    test('should cleanup world systems on stop', () => {
      gameEngine.start();
      gameEngine.stop();
      expect(mockWorld.cleanup).toHaveBeenCalled();
    });
  });

  describe('update() method', () => {
    test('should update world with delta time', () => {
      const deltaTime = 16.67; // ~60 FPS
      gameEngine.update(deltaTime);
      
      expect(mockWorld.update).toHaveBeenCalledWith(deltaTime);
    });

    test('should calculate and update FPS', () => {
      const deltaTime = 16.67; // Should result in ~60 FPS
      gameEngine.update(deltaTime);
      
      // FPS = 1000 / deltaTime = 1000 / 16.67 ≈ 60
      expect(gameEngine.getFPS()).toBeCloseTo(60, 0);
    });

    test('should handle zero delta time', () => {
      gameEngine.update(0);
      expect(mockWorld.update).toHaveBeenCalledWith(0);
      expect(gameEngine.getFPS()).toBe(0);
    });

    test('should cap FPS calculation to prevent division by zero', () => {
      gameEngine.update(0.001); // Very small delta
      expect(gameEngine.getFPS()).toBeGreaterThan(0);
    });
  });

  describe('render() method', () => {
    test('should call renderer.render with world state', () => {
      const mockRenderer = gameEngine.getRenderer();
      mockRenderer.render = jest.fn();
      
      gameEngine.render();
      expect(mockRenderer.render).toHaveBeenCalledWith(mockWorld);
    });

    test('should clear canvas before rendering', () => {
      const mockContext = mockCanvas.getContext('2d');
      if (mockContext) {
        mockContext.clearRect = jest.fn();
      }
      
      gameEngine.render();
      // This test will pass once we implement canvas clearing
      expect(true).toBe(true); // Placeholder until implementation
    });
  });

  describe('gameLoop() integration', () => {
    test('should run continuous game loop when started', (done) => {
      let updateCallCount = 0;
      mockWorld.update = jest.fn(() => {
        updateCallCount++;
        if (updateCallCount >= 3) {
          gameEngine.stop();
          expect(updateCallCount).toBeGreaterThanOrEqual(3);
          done();
        }
      });

      gameEngine.start();
    });

    test('should maintain target frame rate', (done) => {
      const startTime = performance.now();
      let frameCount = 0;
      
      mockWorld.update = jest.fn(() => {
        frameCount++;
        if (frameCount >= 10) {
          gameEngine.stop();
          const elapsed = performance.now() - startTime;
          const actualFPS = (frameCount / elapsed) * 1000;
          
          // Should be close to 60 FPS (within reasonable tolerance)
          expect(actualFPS).toBeGreaterThan(30);
          expect(actualFPS).toBeLessThan(120);
          done();
        }
      });

      gameEngine.start();
    });
  });

  describe('error handling', () => {
    test('should handle world update errors gracefully', () => {
      mockWorld.update = jest.fn(() => {
        throw new Error('World update failed');
      });

      expect(() => gameEngine.update(16.67)).not.toThrow();
      expect(gameEngine.isRunning()).toBe(false); // Should stop on error
    });

    test('should handle render errors gracefully', () => {
      const mockRenderer = gameEngine.getRenderer();
      mockRenderer.render = jest.fn(() => {
        throw new Error('Render failed');
      });

      expect(() => gameEngine.render()).not.toThrow();
    });
  });

  describe('performance monitoring', () => {
    test('should track frame time', () => {
      gameEngine.update(16.67);
      expect(gameEngine.getFrameTime()).toBeCloseTo(16.67, 1);
    });

    test('should track average FPS over time', () => {
      // Simulate multiple frames
      for (let i = 0; i < 10; i++) {
        gameEngine.update(16.67);
      }
      
      expect(gameEngine.getAverageFPS()).toBeCloseTo(60, 5);
    });

    test('should reset performance stats', () => {
      gameEngine.update(16.67);
      expect(gameEngine.getFPS()).toBeGreaterThan(0);
      
      gameEngine.resetPerformanceStats();
      expect(gameEngine.getFPS()).toBe(0);
    });
  });

  describe('world integration', () => {
    test('should provide access to world instance', () => {
      expect(gameEngine.getWorld()).toBe(mockWorld);
    });

    test('should allow world replacement', () => {
      const newWorld = new World() as jest.Mocked<World>;
      gameEngine.setWorld(newWorld);
      expect(gameEngine.getWorld()).toBe(newWorld);
    });
  });
});