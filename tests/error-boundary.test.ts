// Error Boundary & Recovery System Tests
// Tests automatic error detection, recovery, and system resilience

import { createWorld } from '../game-core/ecs/ecs-core';
import { Position, Velocity, Health } from '../game-core/components/ecs-components';
import { MovementSystem } from '../game-core/systems/ecs-systems';
import { ErrorBoundary, addErrorBoundary, ErrorContext, RecoveryStrategy } from '../game-core/utils/error-boundary';

// Mock system that can throw errors for testing
class TestErrorSystem {
  name = 'TestErrorSystem';
  requiredComponents = ['Position'] as const;
  entities = new Set();
  enabled = true;
  priority = 50;
  shouldThrowError = false;
  errorMessage = 'Test error';

  update(deltaTime: number): void {
    if (this.shouldThrowError) {
      throw new Error(this.errorMessage);
    }
  }

  addEntity(entity: any): void {
    this.entities.add(entity);
  }

  removeEntity(entity: any): void {
    this.entities.delete(entity);
  }

  canProcess(entity: any): boolean {
    return entity.hasComponent('Position');
  }

  cleanup(): void {
    this.entities.clear();
  }
}

// Custom recovery strategy for testing
class TestRecoveryStrategy implements RecoveryStrategy {
  name = 'TestRecovery';
  priority = 100;
  description = 'Test recovery strategy';
  recoveryAttempted = false;

  canHandle(error: Error, context: ErrorContext): boolean {
    return error.message === 'Test error';
  }

  async recover(error: Error, context: ErrorContext, world: any): Promise<boolean> {
    this.recoveryAttempted = true;
    return true;
  }
}

describe('Error Boundary & Recovery System', () => {
  let world: any;
  let errorBoundary: ErrorBoundary;
  let testSystem: TestErrorSystem;
  let originalConsoleError: any;
  let capturedLogs: string[] = [];

  beforeEach(() => {
    world = createWorld();
    testSystem = new TestErrorSystem();
    
    // Capture console logs
    originalConsoleError = console.error;
    capturedLogs = [];
    console.error = (...args) => {
      capturedLogs.push(args.join(' '));
    };

    // Create error boundary with test configuration
    errorBoundary = new ErrorBoundary(world, {
      maxErrorsPerMinute: 5,
      enableAutoRecovery: true,
      enableSystemIsolation: true,
      enableEntityQuarantine: true,
      logLevel: 'debug'
    });
  });

  afterEach(() => {
    console.error = originalConsoleError;
    errorBoundary.destroy();
    world.cleanup();
  });

  test('should create error boundary with default config', () => {
    const defaultBoundary = new ErrorBoundary(world);
    expect(defaultBoundary).toBeDefined();
    expect(defaultBoundary.getErrorHistory()).toHaveLength(0);
    defaultBoundary.destroy();
  });

  test('should capture and log errors', async () => {
    const error = new Error('Test error message');
    const context: ErrorContext = {
      timestamp: Date.now(),
      source: 'test'
    };

    await errorBoundary.handleError(error, context);

    const history = errorBoundary.getErrorHistory();
    expect(history).toHaveLength(1);
    expect(history[0].source).toBe('test');
    expect(capturedLogs.some(log => log.includes('Test error message'))).toBe(true);
  });

  test('should wrap system methods to catch errors', async () => {
    world.addSystem(testSystem);
    
    // Trigger error in system
    testSystem.shouldThrowError = true;
    
    // Update world - should catch the error
    world.update(0.016);
    
    // Wait for error handling
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const history = errorBoundary.getErrorHistory();
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].systemName).toBe('TestErrorSystem');
  });

  test('should track system health', () => {
    world.addSystem(testSystem);
    
    // Simulate normal operation
    world.update(0.016);
    
    const health = errorBoundary.getSystemHealth('TestErrorSystem') as any;
    expect(health).toBeDefined();
    expect(health.systemName).toBe('TestErrorSystem');
    expect(health.status).toBe('healthy');
    expect(health.errorCount).toBe(0);
  });

  test('should quarantine problematic entities', () => {
    const entity = world.createEntity();
    entity.addComponent(new Position(entity.id, 0, 0, 0));
    
    const movementSystem = new MovementSystem();
    world.addSystem(movementSystem);
    
    // Entity should be in system initially
    expect(movementSystem.entities.has(entity)).toBe(true);
    
    // Quarantine entity
    errorBoundary.quarantineEntity(entity.id, 'Test quarantine');
    
    // Entity should be removed from systems
    expect(movementSystem.entities.has(entity)).toBe(false);
    expect(errorBoundary.getQuarantinedEntities()).toContain(entity.id);
  });

  test('should release quarantined entities', () => {
    const entity = world.createEntity();
    entity.addComponent(new Position(entity.id, 0, 0, 0));
    entity.addComponent(new Velocity(entity.id, 1, 1, 0));
    
    const movementSystem = new MovementSystem();
    world.addSystem(movementSystem);
    
    // Quarantine and then release
    errorBoundary.quarantineEntity(entity.id, 'Test quarantine');
    expect(errorBoundary.getQuarantinedEntities()).toContain(entity.id);
    
    errorBoundary.releaseEntity(entity.id);
    expect(errorBoundary.getQuarantinedEntities()).not.toContain(entity.id);
    expect(movementSystem.entities.has(entity)).toBe(true);
  });

  test('should isolate failing systems', () => {
    world.addSystem(testSystem);
    expect(testSystem.enabled).toBe(true);
    
    errorBoundary.isolateSystem('TestErrorSystem', 'Test isolation');
    
    expect(testSystem.enabled).toBe(false);
    expect(errorBoundary.getIsolatedSystems()).toContain('TestErrorSystem');
    
    const health = errorBoundary.getSystemHealth('TestErrorSystem') as any;
    expect(health.status).toBe('isolated');
  });

  test('should restore isolated systems', () => {
    world.addSystem(testSystem);
    
    // Isolate then restore
    errorBoundary.isolateSystem('TestErrorSystem', 'Test isolation');
    expect(testSystem.enabled).toBe(false);
    
    errorBoundary.restoreSystem('TestErrorSystem');
    expect(testSystem.enabled).toBe(true);
    expect(errorBoundary.getIsolatedSystems()).not.toContain('TestErrorSystem');
    
    const health = errorBoundary.getSystemHealth('TestErrorSystem') as any;
    expect(health.status).toBe('healthy');
  });

  test('should attempt recovery with custom strategies', async () => {
    const testStrategy = new TestRecoveryStrategy();
    errorBoundary = new ErrorBoundary(world, {
      enableAutoRecovery: true,
      recoveryStrategies: [testStrategy]
    });

    const error = new Error('Test error');
    const context: ErrorContext = {
      timestamp: Date.now(),
      source: 'test'
    };

    await errorBoundary.handleError(error, context);
    
    expect(testStrategy.recoveryAttempted).toBe(true);
  });

  test('should detect error floods and enable emergency mode', async () => {
    const errors = [];
    
    // Create multiple errors quickly
    for (let i = 0; i < 10; i++) {
      const error = new Error(`Flood error ${i}`);
      const context: ErrorContext = {
        timestamp: Date.now(),
        source: 'flood'
      };
      errors.push(errorBoundary.handleError(error, context));
    }
    
    await Promise.all(errors);
    
    // Should have logged emergency mode activation
    expect(capturedLogs.some(log => log.includes('emergency mode'))).toBe(true);
  });

  test('should not isolate critical systems', () => {
    // Mock a critical system
    const criticalSystem = {
      name: 'RenderSystem',
      enabled: true,
      entities: new Set(),
      addEntity: () => {},
      removeEntity: () => {},
      canProcess: () => true,
      cleanup: () => {},
      update: () => {},
      requiredComponents: [],
      priority: 0
    };
    
    world.addSystem(criticalSystem);
    
    // Attempt to isolate critical system
    errorBoundary.isolateSystem('RenderSystem', 'Test isolation');
    
    // Should still be enabled
    expect(criticalSystem.enabled).toBe(true);
    expect(errorBoundary.getIsolatedSystems()).not.toContain('RenderSystem');
  });

  test('should clear error history', () => {
    const error = new Error('Test error');
    const context: ErrorContext = {
      timestamp: Date.now(),
      source: 'test'
    };

    errorBoundary.handleError(error, context);
    expect(errorBoundary.getErrorHistory()).toHaveLength(1);
    
    errorBoundary.clearErrorHistory();
    expect(errorBoundary.getErrorHistory()).toHaveLength(0);
  });

  test('should handle system performance degradation', () => {
    world.addSystem(testSystem);
    
    // Simulate slow system by directly updating health
    (errorBoundary as any).updateSystemHealth('TestErrorSystem', 60, 10); // 60ms execution time
    
    const health = errorBoundary.getSystemHealth('TestErrorSystem') as any;
    expect(health.status).toBe('degraded');
    expect(capturedLogs.some(log => log.includes('performance degradation'))).toBe(true);
  });

  test('should recover from performance degradation', () => {
    world.addSystem(testSystem);
    
    // First mark as degraded
    (errorBoundary as any).updateSystemHealth('TestErrorSystem', 60, 10);
    let health = errorBoundary.getSystemHealth('TestErrorSystem') as any;
    expect(health.status).toBe('degraded');
    
    // Then improve performance
    (errorBoundary as any).updateSystemHealth('TestErrorSystem', 15, 10);
    health = errorBoundary.getSystemHealth('TestErrorSystem') as any;
    expect(health.status).toBe('healthy');
  });

  test('should handle global errors', () => {
    const originalHandler = window.onerror;
    
    // Simulate global error
    if (window.onerror) {
      window.onerror('Test global error', 'test.js', 1, 1, new Error('Global error'));
    }
    
    const history = errorBoundary.getErrorHistory();
    expect(history.some(e => e.source === 'global')).toBe(true);
  });

  test('should handle unhandled promise rejections', () => {
    // Simulate unhandled promise rejection
    const event = new PromiseRejectionEvent('unhandledrejection', {
      promise: Promise.reject('Test rejection'),
      reason: 'Test rejection'
    } as any);
    
    window.dispatchEvent(event);
    
    // Give some time for the handler to process
    setTimeout(() => {
      const history = errorBoundary.getErrorHistory();
      expect(history.some(e => e.source === 'promise')).toBe(true);
    }, 10);
  });

  test('should provide system health for all systems', () => {
    world.addSystem(testSystem);
    world.addSystem(new MovementSystem());
    
    const allHealth = errorBoundary.getSystemHealth() as any[];
    expect(Array.isArray(allHealth)).toBe(true);
    expect(allHealth.length).toBeGreaterThanOrEqual(2);
  });

  test('should integrate with addErrorBoundary utility', () => {
    const boundary = addErrorBoundary(world, { logLevel: 'error' });
    expect(boundary).toBeInstanceOf(ErrorBoundary);
    expect((window as any).errorBoundary).toBe(boundary);
    boundary.destroy();
  });

  test('should handle component-specific errors', async () => {
    const entity = world.createEntity();
    entity.addComponent(new Position(entity.id, 0, 0, 0));
    
    const error = new Error('Component error');
    const context: ErrorContext = {
      timestamp: Date.now(),
      source: 'component',
      entityId: entity.id,
      componentType: 'Position'
    };

    await errorBoundary.handleError(error, context);
    
    const history = errorBoundary.getErrorHistory();
    expect(history[0].componentType).toBe('Position');
    expect(history[0].entityId).toBe(entity.id);
  });
});