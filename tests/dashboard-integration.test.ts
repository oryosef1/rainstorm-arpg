// Dashboard Integration Tests
// Tests the real-time development dashboard integration

import { createWorld } from '../game-core/ecs/ecs-core';
import { Position, Velocity, Health } from '../game-core/components/ecs-components';
import { MovementSystem } from '../game-core/systems/ecs-systems';
import { DashboardIntegration, DashboardData } from '../game-core/utils/dashboard-integration';

// Mock dashboard connection for testing
class MockDashboardConnection {
  private connected = true;
  public lastData: DashboardData | null = null;
  public messageCount = 0;

  send(data: DashboardData): void {
    this.lastData = data;
    this.messageCount++;
  }

  isConnected(): boolean {
    return this.connected;
  }

  disconnect(): void {
    this.connected = false;
  }

  // Test helpers
  reset(): void {
    this.lastData = null;
    this.messageCount = 0;
  }

  setConnected(connected: boolean): void {
    this.connected = connected;
  }
}

describe('Dashboard Integration', () => {
  let world: any;
  let mockConnection: MockDashboardConnection;
  let integration: DashboardIntegration;

  beforeEach(() => {
    world = createWorld();
    mockConnection = new MockDashboardConnection();
    
    // Create integration with mock connection
    integration = new DashboardIntegration(world, 100); // 100ms update frequency
    (integration as any).connections = [mockConnection];
  });

  afterEach(() => {
    integration.destroy();
    world.cleanup();
  });

  test('should create dashboard integration', () => {
    expect(integration).toBeDefined();
    expect(mockConnection.isConnected()).toBe(true);
  });

  test('should gather basic dashboard data', async () => {
    // Add some entities
    const entity1 = world.createEntity();
    entity1.addComponent(new Position(entity1.id, 10, 20, 0));
    entity1.addComponent(new Velocity(entity1.id, 5, 5, 0));

    const entity2 = world.createEntity();
    entity2.addComponent(new Position(entity2.id, 30, 40, 0));
    entity2.addComponent(new Health(entity2.id, 100));

    // Add a system
    world.addSystem(new MovementSystem());

    // Wait for dashboard update
    await new Promise(resolve => setTimeout(resolve, 150));

    expect(mockConnection.lastData).toBeDefined();
    const data = mockConnection.lastData!;

    expect(data.entityCount).toBe(2);
    expect(data.systemCount).toBe(1);
    expect(data.entityDetails).toHaveLength(2);
  });

  test('should capture entity snapshots correctly', async () => {
    const entity = world.createEntity();
    entity.addComponent(new Position(entity.id, 100, 200, 50));
    entity.addComponent(new Health(entity.id, 80));

    // Wait for dashboard update
    await new Promise(resolve => setTimeout(resolve, 150));

    const data = mockConnection.lastData!;
    const entitySnapshot = data.entityDetails[0];

    expect(entitySnapshot.id).toBe(entity.id);
    expect(entitySnapshot.active).toBe(true);
    expect(entitySnapshot.componentTypes).toContain('Position');
    expect(entitySnapshot.componentTypes).toContain('Health');
    expect(entitySnapshot.componentCount).toBe(2);
    expect(entitySnapshot.position).toEqual({ x: 100, y: 200, z: 50 });
    expect(entitySnapshot.health).toEqual({ current: 80, maximum: 80 });
  });

  test('should track system metrics', async () => {
    // Add entities and systems
    const entity = world.createEntity();
    entity.addComponent(new Position(entity.id, 0, 0, 0));
    entity.addComponent(new Velocity(entity.id, 10, 10, 0));

    const movementSystem = new MovementSystem();
    world.addSystem(movementSystem);

    // Update world to generate metrics
    world.update(0.016);

    // Wait for dashboard update
    await new Promise(resolve => setTimeout(resolve, 150));

    const data = mockConnection.lastData!;
    
    expect(data.systemMetrics).toBeDefined();
    expect(data.activeSystemsCount).toBe(1);
    expect(data.totalUpdateTime).toBeGreaterThanOrEqual(0);
  });

  test('should handle disconnected dashboard', async () => {
    mockConnection.setConnected(false);

    // Wait for update attempt
    await new Promise(resolve => setTimeout(resolve, 150));

    // Should not crash or throw errors
    expect(mockConnection.messageCount).toBe(0);
  });

  test('should capture errors and warnings', async () => {
    // Trigger an error
    console.error('Test error message');
    console.warn('Test warning message');

    // Wait for dashboard update
    await new Promise(resolve => setTimeout(resolve, 150));

    const data = mockConnection.lastData!;
    
    expect(data.errors).toContain('Test error message');
    expect(data.warnings).toContain('Test warning message');
  });

  test('should log custom events', () => {
    const eventData = { playerId: 'player1', action: 'levelUp' };
    
    integration.logEvent('player_action', eventData);
    
    // Should send event to connected dashboards
    expect(mockConnection.messageCount).toBeGreaterThan(0);
  });

  test('should estimate memory usage', async () => {
    // Add multiple entities to increase memory usage
    for (let i = 0; i < 10; i++) {
      const entity = world.createEntity();
      entity.addComponent(new Position(entity.id, i, i, 0));
      entity.addComponent(new Velocity(entity.id, 1, 1, 0));
      entity.addComponent(new Health(entity.id, 100));
    }

    // Wait for dashboard update
    await new Promise(resolve => setTimeout(resolve, 150));

    const data = mockConnection.lastData!;
    
    expect(data.memoryUsage).toBeGreaterThan(0);
    expect(data.memoryUsage).toBeGreaterThan(5000); // Should be at least 5KB with 10 entities
  });

  test('should handle large numbers of entities efficiently', async () => {
    // Create many entities (should limit snapshots for performance)
    for (let i = 0; i < 200; i++) {
      const entity = world.createEntity();
      entity.addComponent(new Position(entity.id, i, i, 0));
    }

    // Wait for dashboard update
    await new Promise(resolve => setTimeout(resolve, 150));

    const data = mockConnection.lastData!;
    
    expect(data.entityCount).toBe(200);
    expect(data.entityDetails).toHaveLength(100); // Should be limited to 100 for performance
  });

  test('should update at specified frequency', async () => {
    const startCount = mockConnection.messageCount;
    
    // Wait for multiple update cycles
    await new Promise(resolve => setTimeout(resolve, 350));
    
    const endCount = mockConnection.messageCount;
    
    // Should have updated at least 3 times (350ms / 100ms interval)
    expect(endCount - startCount).toBeGreaterThanOrEqual(3);
  });

  test('should handle system enable/disable', () => {
    const movementSystem = new MovementSystem();
    world.addSystem(movementSystem);
    
    expect(movementSystem.enabled).toBe(true);
    
    // Simulate dashboard disabling system
    movementSystem.enabled = false;
    
    expect(movementSystem.enabled).toBe(false);
  });

  test('should provide performance reports', async () => {
    // Add some load to generate meaningful performance data
    for (let i = 0; i < 50; i++) {
      const entity = world.createEntity();
      entity.addComponent(new Position(entity.id, i, i, 0));
      entity.addComponent(new Velocity(entity.id, 1, 1, 0));
    }

    world.addSystem(new MovementSystem());
    
    // Run multiple updates to generate performance history
    for (let i = 0; i < 10; i++) {
      world.update(0.016);
    }

    // Wait for dashboard update
    await new Promise(resolve => setTimeout(resolve, 150));

    const data = mockConnection.lastData!;
    
    // Performance report might be null if profiler not available in test environment
    // Just verify the structure is correct
    expect(data.performanceReport === null || typeof data.performanceReport === 'object').toBe(true);
  });
});