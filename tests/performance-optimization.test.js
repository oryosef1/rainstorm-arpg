// Performance Optimization Tests
const { PerformanceManager, ObjectPool, OptimizedSystem } = require('../game-core/systems/performance-optimization');

describe('PerformanceManager', () => {
  let perfManager;

  beforeEach(() => {
    perfManager = new PerformanceManager();
  });

  test('should initialize with correct defaults', () => {
    expect(perfManager.targetFPS).toBe(60);
    expect(perfManager.targetFrameTime).toBe(1000 / 60);
    expect(perfManager.cullingEnabled).toBe(true);
    expect(perfManager.lodEnabled).toBe(true);
  });

  test('should track frame performance', () => {
    // Simulate frame timing
    perfManager.lastFrameTime = 0;
    perfManager.startFrame();
    expect(perfManager.frameHistory.length).toBe(1);
    
    // Add more frames
    for (let i = 0; i < 10; i++) {
      perfManager.lastFrameTime = i * 16; // 60 FPS timing
      perfManager.startFrame();
    }
    
    expect(perfManager.frameHistory.length).toBe(11);
    expect(perfManager.performanceMetrics.averageFPS).toBeGreaterThan(0);
  });

  test('should create spatial grid correctly', () => {
    const mockEntities = [
      { getComponent: () => ({ x: 100, y: 100 }) },
      { getComponent: () => ({ x: 200, y: 200 }) },
      { getComponent: () => ({ x: 150, y: 150 }) }
    ];

    const grid = perfManager.createSpatialGrid(mockEntities, 128);
    expect(grid.size).toBeGreaterThan(0);
  });

  test('should cull entities outside viewport', () => {
    const mockEntities = [
      { 
        getComponent: (name) => {
          if (name === 'Position') return { x: 100, y: 100 };
          if (name === 'Sprite') return { visible: true };
          return null;
        }
      },
      { 
        getComponent: (name) => {
          if (name === 'Position') return { x: 1000, y: 1000 }; // Outside viewport
          if (name === 'Sprite') return { visible: true };
          return null;
        }
      }
    ];

    const camera = { x: 0, y: 0 };
    const visibleEntities = perfManager.cullEntitiesForRendering(mockEntities, camera);
    
    expect(visibleEntities.length).toBeLessThan(mockEntities.length);
  });

  test('should adjust quality based on performance', () => {
    // Simulate poor performance
    perfManager.performanceMetrics.averageFPS = 30;
    perfManager.adjustQualityBasedOnPerformance();
    
    expect(perfManager.cullingEnabled).toBe(true);
    expect(perfManager.lodEnabled).toBe(true);
    expect(perfManager.batchSize).toBe(50);
  });
});

describe('ObjectPool', () => {
  let pool;

  beforeEach(() => {
    pool = new ObjectPool(() => ({ active: false, value: 0 }), 5);
  });

  test('should create initial pool objects', () => {
    expect(pool.pool.length).toBe(5);
    expect(pool.used.size).toBe(0);
  });

  test('should get and release objects correctly', () => {
    const obj1 = pool.get();
    expect(obj1).toBeDefined();
    expect(pool.used.size).toBe(1);
    expect(pool.pool.length).toBe(4);

    pool.release(obj1);
    expect(pool.used.size).toBe(0);
    expect(pool.pool.length).toBe(5);
    expect(obj1.active).toBe(false);
  });

  test('should create new objects when pool is exhausted', () => {
    // Get all objects from pool
    const objects = [];
    for (let i = 0; i < 6; i++) {
      objects.push(pool.get());
    }

    expect(pool.used.size).toBe(6);
    expect(pool.pool.length).toBe(0);
  });

  test('should provide accurate stats', () => {
    const obj = pool.get();
    const stats = pool.getStats();
    
    expect(stats.poolSize).toBe(4);
    expect(stats.usedCount).toBe(1);
    expect(stats.totalCreated).toBe(5);
  });
});

describe('OptimizedSystem', () => {
  let system;

  beforeEach(() => {
    system = new OptimizedSystem();
  });

  test('should initialize with correct defaults', () => {
    expect(system.updateInterval).toBe(16);
    expect(system.enabled).toBe(true);
    expect(system.priority).toBe(1);
  });

  test('should respect update frequency', () => {
    system.setUpdateFrequency(30); // 30 FPS
    expect(system.updateInterval).toBe(1000 / 30);
  });

  test('should skip updates when disabled', () => {
    system.enabled = false;
    expect(system.shouldUpdate(Date.now())).toBe(false);
  });

  test('should update when enough time has passed', () => {
    const now = Date.now();
    system.lastUpdate = now - 20; // 20ms ago
    expect(system.shouldUpdate(now)).toBe(true);
  });

  test('should not update when not enough time has passed', () => {
    const now = Date.now();
    system.lastUpdate = now - 10; // 10ms ago (less than 16ms interval)
    expect(system.shouldUpdate(now)).toBe(false);
  });
});

describe('Performance Integration', () => {
  test('should handle hundreds of entities efficiently', () => {
    const perfManager = new PerformanceManager();
    
    // Create 500 mock entities
    const entities = [];
    for (let i = 0; i < 500; i++) {
      entities.push({
        id: i,
        getComponent: (name) => {
          if (name === 'Position') return { x: Math.random() * 1000, y: Math.random() * 1000 };
          if (name === 'Sprite') return { visible: true, lodLevel: 'high' };
          return null;
        }
      });
    }

    const startTime = performance.now();
    
    // Simulate processing all entities
    const grid = perfManager.createSpatialGrid(entities);
    const camera = { x: 400, y: 300 };
    const visibleEntities = perfManager.cullEntitiesForRendering(entities, camera);
    perfManager.applyLevelOfDetail(visibleEntities, camera);
    
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    
    // Processing 500 entities should be fast (< 20ms, allowing for CI variability)
    expect(processingTime).toBeLessThan(20);
    expect(visibleEntities.length).toBeLessThan(entities.length);
  });

  test('should maintain stable performance under load', () => {
    const perfManager = new PerformanceManager();
    
    // Mock performance.now to control timing
    const originalNow = performance.now;
    let mockTime = 0;
    performance.now = jest.fn(() => mockTime);
    
    // Simulate 60 frames of consistent 16.67ms timing
    for (let i = 0; i < 60; i++) {
      mockTime = i * 16.67;
      perfManager.startFrame();
    }
    
    const metrics = perfManager.getPerformanceReport();
    expect(metrics.averageFPS).toBeGreaterThan(50); // Reasonable FPS range
    expect(metrics.frameDrops).toBe(0);
    
    // Restore original performance.now
    performance.now = originalNow;
  });
});