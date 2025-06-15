// ECS Core System Tests
// Test-driven development for Entity-Component-System architecture

const { Entity, Component, System, World } = require('../game-core/ecs/ecs-core');

describe('Entity Component System Core', () => {
  
  describe('Entity', () => {
    let entity;

    beforeEach(() => {
      entity = new Entity();
    });

    test('should create entity with unique ID', () => {
      expect(entity).toBeValidEntity();
      expect(entity.id).toBeDefined();
      expect(typeof entity.id).toBe('string');
    });

    test('should start with empty components map', () => {
      expect(entity.components.size).toBe(0);
    });

    test('should be active by default', () => {
      expect(entity.active).toBe(true);
    });

    test('should add component successfully', () => {
      class TestComponent extends Component {}
      const component = new TestComponent();
      
      const result = entity.addComponent(component);
      
      expect(result).toBe(entity); // Fluent interface
      expect(entity.hasComponent('TestComponent')).toBe(true);
      expect(component.entity).toBe(entity);
    });

    test('should remove component successfully', () => {
      class TestComponent extends Component {}
      const component = new TestComponent();
      entity.addComponent(component);
      
      const result = entity.removeComponent('TestComponent');
      
      expect(result).toBe(entity);
      expect(entity.hasComponent('TestComponent')).toBe(false);
    });

    test('should get component by type', () => {
      class TestComponent extends Component {
        constructor() {
          super();
          this.value = 42;
        }
      }
      const component = new TestComponent();
      entity.addComponent(component);
      
      const retrieved = entity.getComponent('TestComponent');
      
      expect(retrieved).toBe(component);
      expect(retrieved.value).toBe(42);
    });

    test('should destroy entity properly', () => {
      class TestComponent extends Component {}
      entity.addComponent(new TestComponent());
      
      entity.destroy();
      
      expect(entity.active).toBe(false);
      expect(entity.components.size).toBe(0);
    });
  });

  describe('Component', () => {
    test('should create component with entity reference null', () => {
      const component = new Component();
      expect(component.entity).toBeNull();
    });
  });

  describe('System', () => {
    let system;

    beforeEach(() => {
      system = new System();
    });

    test('should create system with empty entities set', () => {
      expect(system.entities.size).toBe(0);
      expect(Array.isArray(system.requiredComponents)).toBe(true);
    });

    test('should add entity that matches requirements', () => {
      class TestComponent extends Component {}
      system.requiredComponents = ['TestComponent'];
      
      const entity = new Entity();
      entity.addComponent(new TestComponent());
      
      system.addEntity(entity);
      
      expect(system.entities.has(entity)).toBe(true);
    });

    test('should not add entity that does not match requirements', () => {
      class TestComponent extends Component {}
      class OtherComponent extends Component {}
      system.requiredComponents = ['TestComponent'];
      
      const entity = new Entity();
      entity.addComponent(new OtherComponent());
      
      system.addEntity(entity);
      
      expect(system.entities.has(entity)).toBe(false);
    });

    test('should remove entity successfully', () => {
      const entity = new Entity();
      system.entities.add(entity);
      
      system.removeEntity(entity);
      
      expect(system.entities.has(entity)).toBe(false);
    });

    test('should match requirements correctly', () => {
      class ComponentA extends Component {}
      class ComponentB extends Component {}
      system.requiredComponents = ['ComponentA', 'ComponentB'];
      
      const entityWithBoth = new Entity();
      entityWithBoth.addComponent(new ComponentA());
      entityWithBoth.addComponent(new ComponentB());
      
      const entityWithOne = new Entity();
      entityWithOne.addComponent(new ComponentA());
      
      expect(system.matchesRequirements(entityWithBoth)).toBe(true);
      expect(system.matchesRequirements(entityWithOne)).toBe(false);
    });
  });

  describe('World', () => {
    let world;

    beforeEach(() => {
      world = new World();
    });

    test('should create world with empty entities and systems', () => {
      expect(world.entities.size).toBe(0);
      expect(world.systems.size).toBe(0);
    });

    test('should create entity and add to world', () => {
      const entity = world.createEntity();
      
      expect(entity).toBeValidEntity();
      expect(world.entities.has(entity.id)).toBe(true);
    });

    test('should destroy entity and remove from world', () => {
      const entity = world.createEntity();
      const entityId = entity.id;
      
      world.destroyEntity(entityId);
      
      expect(world.entities.has(entityId)).toBe(false);
    });

    test('should add system and process existing entities', () => {
      class TestComponent extends Component {}
      class TestSystem extends System {
        constructor() {
          super();
          this.requiredComponents = ['TestComponent'];
        }
      }
      
      // Create entity with component first
      const entity = world.createEntity();
      entity.addComponent(new TestComponent());
      
      // Add system - should automatically include the entity
      const system = new TestSystem();
      world.addSystem(system, 'test');
      
      expect(system.entities.has(entity)).toBe(true);
    });

    test('should query entities by components', () => {
      class ComponentA extends Component {}
      class ComponentB extends Component {}
      
      const entity1 = world.createEntity();
      entity1.addComponent(new ComponentA());
      
      const entity2 = world.createEntity();
      entity2.addComponent(new ComponentA());
      entity2.addComponent(new ComponentB());
      
      const entity3 = world.createEntity();
      entity3.addComponent(new ComponentB());
      
      const results = world.queryEntities('ComponentA');
      expect(results).toHaveLength(2);
      expect(results).toContain(entity1);
      expect(results).toContain(entity2);
    });

    test('should update all systems', () => {
      class TestSystem extends System {
        constructor() {
          super();
          this.updateCalled = false;
        }
        update(deltaTime) {
          this.updateCalled = true;
          this.lastDeltaTime = deltaTime;
        }
      }
      
      const system = new TestSystem();
      world.addSystem(system, 'test');
      
      world.update(16);
      
      expect(system.updateCalled).toBe(true);
      expect(system.lastDeltaTime).toBe(16);
    });

    test('should clean up destroyed entities during update', () => {
      const entity = world.createEntity();
      entity.destroy(); // Mark as inactive
      
      world.update(16);
      
      expect(world.entities.has(entity.id)).toBe(false);
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete entity lifecycle', () => {
      const world = new World();
      
      // Create test components
      class PositionComponent extends Component {
        constructor(x, y) {
          super();
          this.x = x;
          this.y = y;
        }
      }
      
      class VelocityComponent extends Component {
        constructor(x, y) {
          super();
          this.x = x;
          this.y = y;
        }
      }
      
      // Create movement system
      class MovementSystem extends System {
        constructor() {
          super();
          this.requiredComponents = ['PositionComponent', 'VelocityComponent'];
        }
        
        update(deltaTime) {
          for (const entity of this.entities) {
            const pos = entity.getComponent('PositionComponent');
            const vel = entity.getComponent('VelocityComponent');
            pos.x += vel.x * deltaTime;
            pos.y += vel.y * deltaTime;
          }
        }
      }
      
      // Setup
      const entity = world.createEntity();
      entity.addComponent(new PositionComponent(0, 0));
      entity.addComponent(new VelocityComponent(1, 2));
      
      const system = new MovementSystem();
      world.addSystem(system, 'movement');
      
      // Test
      world.update(16);
      
      const position = entity.getComponent('PositionComponent');
      expect(position.x).toBe(16);
      expect(position.y).toBe(32);
    });
  });
});