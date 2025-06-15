// TypeScript ECS Implementation Test
// Tests the new TypeScript ECS system

import { createWorld, Entity, Component } from '../game-core/ecs/ecs-core';
import { Position, Velocity, Sprite, Health } from '../game-core/components/ecs-components';
import { MovementSystem, RenderSystem } from '../game-core/systems/ecs-systems';

describe('TypeScript ECS Implementation', () => {
  let world: any;

  beforeEach(() => {
    world = createWorld();
  });

  afterEach(() => {
    world.cleanup();
  });

  test('should create world and entities', () => {
    expect(world).toBeDefined();
    expect(world.entities.size).toBe(0);

    const entity = world.createEntity();
    expect(entity).toBeDefined();
    expect(entity.id).toBeDefined();
    expect(world.entities.size).toBe(1);
  });

  test('should add and remove components', () => {
    const entity = world.createEntity();
    
    // Add Position component
    const position = new Position(entity.id, 10, 20, 0);
    entity.addComponent(position);
    
    expect(entity.hasComponent('Position')).toBe(true);
    expect(entity.getComponent('Position')).toBe(position);
    
    // Remove component
    entity.removeComponent('Position');
    expect(entity.hasComponent('Position')).toBe(false);
  });

  test('should validate component data', () => {
    const entity = world.createEntity();
    const position = new Position(entity.id, 10, 20, 0);
    
    expect(position.validate()).toBe(true);
    
    // Test invalid data
    position.x = NaN;
    expect(position.validate()).toBe(false);
  });

  test('should serialize and deserialize components', () => {
    const entity = world.createEntity();
    const position = new Position(entity.id, 10, 20, 5);
    
    const serialized = position.serialize();
    expect(serialized.x).toBe(10);
    expect(serialized.y).toBe(20);
    expect(serialized.z).toBe(5);
    
    const newPosition = new Position(entity.id);
    newPosition.deserialize(serialized);
    expect(newPosition.x).toBe(10);
    expect(newPosition.y).toBe(20);
    expect(newPosition.z).toBe(5);
  });

  test('should add systems and process entities', () => {
    const entity = world.createEntity();
    entity.addComponent(new Position(entity.id, 0, 0, 0));
    entity.addComponent(new Velocity(entity.id, 10, 10, 0));
    
    const movementSystem = new MovementSystem();
    world.addSystem(movementSystem);
    
    expect(world.systems.size).toBe(1);
    expect(movementSystem.entities.size).toBe(1);
    expect(movementSystem.entities.has(entity)).toBe(true);
  });

  test('should update movement system', () => {
    const entity = world.createEntity();
    const position = new Position(entity.id, 0, 0, 0);
    const velocity = new Velocity(entity.id, 10, 5, 0);
    
    entity.addComponent(position);
    entity.addComponent(velocity);
    
    const movementSystem = new MovementSystem();
    world.addSystem(movementSystem);
    
    // Update with deltaTime of 0.1 seconds
    world.update(0.1);
    
    // Position should have moved
    expect(position.x).toBeCloseTo(1.0, 1); // 10 * 0.1
    expect(position.y).toBeCloseTo(0.5, 1); // 5 * 0.1
  });

  test('should handle complex entity with multiple components', () => {
    const entity = world.createEntity();
    
    // Add multiple components
    entity.addComponent(new Position(entity.id, 100, 100, 0));
    entity.addComponent(new Velocity(entity.id, 0, 0, 0));
    entity.addComponent(new Sprite(entity.id, '#ff0000', 20));
    entity.addComponent(new Health(entity.id, 100));
    
    expect(entity.components.size).toBe(4);
    expect(entity.hasComponents(['Position', 'Velocity', 'Sprite', 'Health'])).toBe(true);
    expect(entity.hasComponents(['Position', 'Combat'])).toBe(false);
  });

  test('should track performance metrics', () => {
    const entity = world.createEntity();
    entity.addComponent(new Position(entity.id, 0, 0, 0));
    entity.addComponent(new Velocity(entity.id, 1, 1, 0));
    
    const movementSystem = new MovementSystem();
    world.addSystem(movementSystem);
    
    // Update to generate metrics
    world.update(0.016); // ~60fps
    
    const metrics = movementSystem.getMetrics();
    expect(metrics).toBeDefined();
    expect(metrics.name).toBe('MovementSystem');
    expect(metrics.entityCount).toBe(1);
    expect(metrics.executionTime).toBeGreaterThanOrEqual(0);
  });

  test('should emit and handle events', () => {
    let eventReceived = false;
    let eventData: any = null;

    world.on('test-event', (data: any) => {
      eventReceived = true;
      eventData = data;
    });

    world.emit('test-event', { message: 'Hello TypeScript!' });

    expect(eventReceived).toBe(true);
    expect(eventData.message).toBe('Hello TypeScript!');
  });
});