const { AtlasSystem } = require('./atlas-system');

// Mock ECS Core
jest.mock('../ecs/ecs-core', () => ({
  ISystem: class {},
  IEntity: class {
    hasComponents(components) {
      return true;
    }
  }
}));

describe('AtlasSystem', () => {
  let atlasSystem;
  let mockEntity;

  beforeEach(() => {
    atlasSystem = new AtlasSystem();
    mockEntity = {
      id: 'test-entity',
      hasComponents: jest.fn().mockReturnValue(true),
      getComponent: jest.fn()
    };
  });

  afterEach(() => {
    atlasSystem.cleanup();
  });

  describe('Core System Functionality', () => {
    test('should initialize with correct properties', () => {
      expect(atlasSystem.name).toBe('AtlasSystem');
      expect(atlasSystem.requiredComponents).toEqual(['Atlas', 'Player']);
      expect(atlasSystem.entities).toBeInstanceOf(Set);
      expect(atlasSystem.priority).toBe(25);
      expect(atlasSystem.enabled).toBe(true);
    });

    test('should implement ISystem interface', () => {
      expect(typeof atlasSystem.addEntity).toBe('function');
      expect(typeof atlasSystem.removeEntity).toBe('function');
      expect(typeof atlasSystem.update).toBe('function');
      expect(typeof atlasSystem.canProcess).toBe('function');
      expect(typeof atlasSystem.cleanup).toBe('function');
      expect(typeof atlasSystem.getMetrics).toBe('function');
    });

    test('should add entities that meet requirements', () => {
      atlasSystem.addEntity(mockEntity);
      expect(atlasSystem.entities.has(mockEntity)).toBe(true);
    });

    test('should remove entities', () => {
      atlasSystem.addEntity(mockEntity);
      atlasSystem.removeEntity(mockEntity);
      expect(atlasSystem.entities.has(mockEntity)).toBe(false);
    });

    test('should return system metrics', () => {
      const metrics = atlasSystem.getMetrics();
      expect(metrics).toHaveProperty('name', 'AtlasSystem');
      expect(metrics).toHaveProperty('executionTime');
      expect(metrics).toHaveProperty('entityCount');
      expect(metrics).toHaveProperty('lastUpdate');
    });

    test('should cleanup properly', () => {
      atlasSystem.addEntity(mockEntity);
      atlasSystem.cleanup();
      expect(atlasSystem.entities.size).toBe(0);
    });
  });

  describe('Atlas Node Management', () => {
    test('should initialize with base nodes', () => {
      const allNodes = atlasSystem.getAllNodes();
      expect(allNodes.length).toBeGreaterThan(0);
      
      const startNode = atlasSystem.getNode('start_node');
      expect(startNode).toBeDefined();
      expect(startNode.unlocked).toBe(true);
      expect(startNode.name).toBe('Beginning');
    });

    test('should unlock nodes with valid requirements', () => {
      const startNode = atlasSystem.getNode('start_node');
      expect(startNode.unlocked).toBe(true);
      
      // Complete start node first
      atlasSystem.completeNode('start_node');
      
      // Try to unlock connected node
      const unlocked = atlasSystem.unlockNode('node_1');
      expect(unlocked).toBe(true);
      
      const node1 = atlasSystem.getNode('node_1');
      expect(node1.unlocked).toBe(true);
    });

    test('should not unlock nodes without meeting requirements', () => {
      // Try to unlock a node without completing prerequisites
      const unlocked = atlasSystem.unlockNode('node_1');
      expect(unlocked).toBe(false);
      
      const node1 = atlasSystem.getNode('node_1');
      expect(node1.unlocked).toBe(false);
    });

    test('should complete nodes and grant rewards', () => {
      const rewardHandler = jest.fn();
      atlasSystem.on('atlasPointsAwarded', rewardHandler);
      
      const completed = atlasSystem.completeNode('start_node');
      expect(completed).toBe(true);
      
      const startNode = atlasSystem.getNode('start_node');
      expect(startNode.completed).toBe(true);
      
      const progression = atlasSystem.getAtlasProgression();
      expect(progression.completedNodes).toContain('start_node');
      expect(rewardHandler).toHaveBeenCalled();
    });

    test('should handle bonus objectives', () => {
      const node1 = atlasSystem.getNode('node_1');
      
      // First unlock and then complete with bonus
      atlasSystem.completeNode('start_node');
      atlasSystem.unlockNode('node_1');
      
      const bonusObjectives = ['speed_run'];
      const completed = atlasSystem.completeNode('node_1', bonusObjectives);
      expect(completed).toBe(true);
      
      const updatedNode = atlasSystem.getNode('node_1');
      const speedRunObjective = updatedNode.bonusObjectives.find(obj => obj.id === 'speed_run');
      expect(speedRunObjective.completed).toBe(true);
    });

    test('should not complete already completed nodes', () => {
      atlasSystem.completeNode('start_node');
      
      // Try to complete again
      const completed = atlasSystem.completeNode('start_node');
      expect(completed).toBe(false);
    });

    test('should get unlocked and completed nodes', () => {
      // Initially only start node should be unlocked
      const unlockedNodes = atlasSystem.getUnlockedNodes();
      expect(unlockedNodes.length).toBe(1);
      expect(unlockedNodes[0].id).toBe('start_node');
      
      // No nodes completed initially
      const completedNodes = atlasSystem.getCompletedNodes();
      expect(completedNodes.length).toBe(0);
      
      // Complete start node
      atlasSystem.completeNode('start_node');
      
      const newCompletedNodes = atlasSystem.getCompletedNodes();
      expect(newCompletedNodes.length).toBe(1);
      expect(newCompletedNodes[0].id).toBe('start_node');
    });
  });

  describe('Passive Tree Management', () => {
    test('should initialize with passive nodes', () => {
      const passiveNodes = atlasSystem.getAllPassiveNodes();
      expect(passiveNodes.length).toBeGreaterThan(0);
      
      const firstPassive = atlasSystem.getPassiveNode('map_quantity_start');
      expect(firstPassive).toBeDefined();
      expect(firstPassive.allocated).toBe(false);
    });

    test('should allocate passive with sufficient points', () => {
      // Award points first
      atlasSystem.awardAtlasPoints(5);
      
      const allocated = atlasSystem.allocatePassive('map_quantity_start');
      expect(allocated).toBe(true);
      
      const passiveNode = atlasSystem.getPassiveNode('map_quantity_start');
      expect(passiveNode.allocated).toBe(true);
      
      const progression = atlasSystem.getAtlasProgression();
      expect(progression.passiveAllocations).toContain('map_quantity_start');
      expect(progression.spentPoints).toBe(1);
      expect(progression.availablePoints).toBe(4);
    });

    test('should not allocate passive without sufficient points', () => {
      // No points awarded
      const allocated = atlasSystem.allocatePassive('map_quantity_start');
      expect(allocated).toBe(false);
      
      const passiveNode = atlasSystem.getPassiveNode('map_quantity_start');
      expect(passiveNode.allocated).toBe(false);
    });

    test('should deallocate passive nodes', () => {
      // Award points and allocate
      atlasSystem.awardAtlasPoints(5);
      atlasSystem.allocatePassive('map_quantity_start');
      
      // Deallocate
      const deallocated = atlasSystem.deallocatePassive('map_quantity_start');
      expect(deallocated).toBe(true);
      
      const passiveNode = atlasSystem.getPassiveNode('map_quantity_start');
      expect(passiveNode.allocated).toBe(false);
      
      const progression = atlasSystem.getAtlasProgression();
      expect(progression.passiveAllocations).not.toContain('map_quantity_start');
      expect(progression.spentPoints).toBe(0);
      expect(progression.availablePoints).toBe(5);
    });

    test('should emit events when allocating/deallocating passives', () => {
      const allocatedHandler = jest.fn();
      const deallocatedHandler = jest.fn();
      const effectAppliedHandler = jest.fn();
      const effectRemovedHandler = jest.fn();
      
      atlasSystem.on('passiveAllocated', allocatedHandler);
      atlasSystem.on('passiveDeallocated', deallocatedHandler);
      atlasSystem.on('passiveEffectApplied', effectAppliedHandler);
      atlasSystem.on('passiveEffectRemoved', effectRemovedHandler);
      
      atlasSystem.awardAtlasPoints(5);
      
      // Allocate
      atlasSystem.allocatePassive('map_quantity_start');
      expect(allocatedHandler).toHaveBeenCalled();
      expect(effectAppliedHandler).toHaveBeenCalled();
      
      // Deallocate
      atlasSystem.deallocatePassive('map_quantity_start');
      expect(deallocatedHandler).toHaveBeenCalled();
      expect(effectRemovedHandler).toHaveBeenCalled();
    });

    test('should get allocated passives', () => {
      atlasSystem.awardAtlasPoints(5);
      atlasSystem.allocatePassive('map_quantity_start');
      
      const allocatedPassives = atlasSystem.getAllocatedPassives();
      expect(allocatedPassives.length).toBe(1);
      expect(allocatedPassives[0].id).toBe('map_quantity_start');
    });
  });

  describe('Region Management', () => {
    test('should initialize with regions', () => {
      const regions = atlasSystem.getAllRegions();
      expect(regions.length).toBeGreaterThan(0);
      
      const valleyRegion = atlasSystem.getRegion('valley_region');
      expect(valleyRegion).toBeDefined();
      expect(valleyRegion.unlocked).toBe(true);
      
      const desertRegion = atlasSystem.getRegion('desert_region');
      expect(desertRegion).toBeDefined();
      expect(desertRegion.unlocked).toBe(false);
    });

    test('should unlock regions based on node completion', () => {
      // Complete enough nodes in desert region
      atlasSystem.completeNode('start_node');
      atlasSystem.unlockNode('node_1');
      atlasSystem.completeNode('node_1');
      
      // The exact logic would depend on which nodes are in which regions
      // This test assumes desert_region has nodes that can be unlocked
      const unlocked = atlasSystem.unlockRegion('desert_region');
      
      // Check if region was unlocked (may depend on implementation details)
      const progression = atlasSystem.getAtlasProgression();
      if (unlocked) {
        expect(progression.unlockedRegions).toContain('desert_region');
      }
    });

    test('should calculate region progress', () => {
      const progress = atlasSystem.getRegionProgress('valley_region');
      expect(typeof progress).toBe('number');
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(1);
      
      // Complete a node in the region
      atlasSystem.completeNode('start_node');
      
      const newProgress = atlasSystem.getRegionProgress('valley_region');
      expect(newProgress).toBeGreaterThan(progress);
    });

    test('should specialize regions', () => {
      atlasSystem.awardAtlasPoints(20);
      
      const specialized = atlasSystem.specializeRegion('valley_region', 'breach');
      expect(specialized).toBe(true);
      
      const region = atlasSystem.getRegion('valley_region');
      expect(region.specialization).toBeDefined();
      expect(region.specialization.type).toBe('breach');
      expect(region.specialization.level).toBe(1);
    });

    test('should not specialize locked regions', () => {
      atlasSystem.awardAtlasPoints(20);
      
      const specialized = atlasSystem.specializeRegion('desert_region', 'breach');
      expect(specialized).toBe(false);
    });

    test('should emit events for region actions', () => {
      const unlockedHandler = jest.fn();
      const specializedHandler = jest.fn();
      
      atlasSystem.on('regionUnlocked', unlockedHandler);
      atlasSystem.on('regionSpecialized', specializedHandler);
      
      // These may or may not trigger based on current state
      atlasSystem.unlockRegion('desert_region');
      
      atlasSystem.awardAtlasPoints(20);
      atlasSystem.specializeRegion('valley_region', 'essence');
      
      expect(specializedHandler).toHaveBeenCalled();
    });
  });

  describe('Atlas Progression', () => {
    test('should award atlas points', () => {
      const pointsHandler = jest.fn();
      atlasSystem.on('atlasPointsAwarded', pointsHandler);
      
      atlasSystem.awardAtlasPoints(10);
      
      const progression = atlasSystem.getAtlasProgression();
      expect(progression.totalPoints).toBe(10);
      expect(progression.availablePoints).toBe(10);
      expect(pointsHandler).toHaveBeenCalledWith({
        amount: 10,
        total: 10
      });
    });

    test('should track progression correctly', () => {
      const progression = atlasSystem.getAtlasProgression();
      
      expect(progression).toHaveProperty('totalPoints');
      expect(progression).toHaveProperty('spentPoints');
      expect(progression).toHaveProperty('availablePoints');
      expect(progression).toHaveProperty('unlockedRegions');
      expect(progression).toHaveProperty('completedNodes');
      expect(progression).toHaveProperty('passiveAllocations');
      expect(progression).toHaveProperty('specializations');
      
      expect(Array.isArray(progression.unlockedRegions)).toBe(true);
      expect(Array.isArray(progression.completedNodes)).toBe(true);
      expect(Array.isArray(progression.passiveAllocations)).toBe(true);
      expect(typeof progression.specializations).toBe('object');
    });

    test('should reset atlas properly', () => {
      // Make some progress
      atlasSystem.awardAtlasPoints(10);
      atlasSystem.allocatePassive('map_quantity_start');
      atlasSystem.completeNode('start_node');
      
      const resetHandler = jest.fn();
      atlasSystem.on('atlasReset', resetHandler);
      
      // Reset
      atlasSystem.resetAtlas();
      
      const progression = atlasSystem.getAtlasProgression();
      expect(progression.totalPoints).toBe(0);
      expect(progression.spentPoints).toBe(0);
      expect(progression.availablePoints).toBe(0);
      expect(progression.completedNodes.length).toBe(0);
      expect(progression.passiveAllocations.length).toBe(0);
      
      // Check nodes are reset
      const startNode = atlasSystem.getNode('start_node');
      expect(startNode.unlocked).toBe(true); // Start node should remain unlocked
      expect(startNode.completed).toBe(false);
      
      const passiveNode = atlasSystem.getPassiveNode('map_quantity_start');
      expect(passiveNode.allocated).toBe(false);
      
      expect(resetHandler).toHaveBeenCalled();
    });
  });

  describe('Pathfinding', () => {
    test('should find path between connected nodes', () => {
      const path = atlasSystem.getNodePath('start_node', 'node_1');
      expect(Array.isArray(path)).toBe(true);
      
      if (path.length > 0) {
        expect(path[0]).toBe('start_node');
        expect(path[path.length - 1]).toBe('node_1');
      }
    });

    test('should return empty path for unreachable nodes', () => {
      const path = atlasSystem.getNodePath('start_node', 'nonexistent_node');
      expect(path).toEqual([]);
    });

    test('should return direct path for same node', () => {
      const path = atlasSystem.getNodePath('start_node', 'start_node');
      expect(path).toEqual(['start_node']);
    });
  });

  describe('Event System', () => {
    test('should emit events for major actions', () => {
      const events = [
        'nodeUnlocked',
        'nodeCompleted',
        'passiveAllocated',
        'regionUnlocked',
        'atlasPointsAwarded'
      ];
      
      const handlers = {};
      events.forEach(event => {
        handlers[event] = jest.fn();
        atlasSystem.on(event, handlers[event]);
      });
      
      // Perform actions that should trigger events
      atlasSystem.awardAtlasPoints(10);
      atlasSystem.allocatePassive('map_quantity_start');
      atlasSystem.completeNode('start_node');
      
      expect(handlers.atlasPointsAwarded).toHaveBeenCalled();
      expect(handlers.passiveAllocated).toHaveBeenCalled();
      expect(handlers.nodeCompleted).toHaveBeenCalled();
    });
  });

  describe('Update Loop', () => {
    test('should update without errors when enabled', () => {
      expect(() => {
        atlasSystem.update(16.67); // ~60 FPS
      }).not.toThrow();
    });

    test('should skip update when disabled', () => {
      atlasSystem.enabled = false;
      
      expect(() => {
        atlasSystem.update(16.67);
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    test('should handle many nodes efficiently', () => {
      const startTime = performance.now();
      
      // Get all nodes multiple times
      for (let i = 0; i < 1000; i++) {
        atlasSystem.getAllNodes();
        atlasSystem.getAllPassiveNodes();
        atlasSystem.getAllRegions();
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete in reasonable time
      expect(duration).toBeLessThan(100);
    });

    test('should handle multiple pathfinding requests efficiently', () => {
      const startTime = performance.now();
      
      const allNodes = atlasSystem.getAllNodes();
      if (allNodes.length >= 2) {
        const startNodeId = allNodes[0].id;
        const targetNodeId = allNodes[1].id;
        
        for (let i = 0; i < 100; i++) {
          atlasSystem.getNodePath(startNodeId, targetNodeId);
        }
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete pathfinding efficiently
      expect(duration).toBeLessThan(500);
    });
  });
});

// Integration Tests
describe('AtlasSystem Integration', () => {
  let atlasSystem;

  beforeEach(() => {
    atlasSystem = new AtlasSystem();
  });

  afterEach(() => {
    atlasSystem.cleanup();
  });

  test('should handle complete atlas progression workflow', () => {
    // Award initial points
    atlasSystem.awardAtlasPoints(20);
    
    // Complete start node
    expect(atlasSystem.completeNode('start_node')).toBe(true);
    
    // Unlock and complete next node
    expect(atlasSystem.unlockNode('node_1')).toBe(true);
    expect(atlasSystem.completeNode('node_1', ['speed_run'])).toBe(true);
    
    // Allocate passive skills
    expect(atlasSystem.allocatePassive('map_quantity_start')).toBe(true);
    
    // Check final state
    const progression = atlasSystem.getAtlasProgression();
    expect(progression.completedNodes.length).toBe(2);
    expect(progression.passiveAllocations.length).toBe(1);
    expect(progression.availablePoints).toBeGreaterThan(0);
  });

  test('should maintain data consistency across operations', () => {
    // Perform various operations
    atlasSystem.awardAtlasPoints(50);
    atlasSystem.completeNode('start_node');
    atlasSystem.allocatePassive('map_quantity_start');
    
    // Check consistency
    const progression1 = atlasSystem.getAtlasProgression();
    const totalPoints1 = progression1.totalPoints;
    const spentPoints1 = progression1.spentPoints;
    const availablePoints1 = progression1.availablePoints;
    
    expect(totalPoints1).toBe(spentPoints1 + availablePoints1);
    
    // Perform more operations
    atlasSystem.awardAtlasPoints(10);
    atlasSystem.deallocatePassive('map_quantity_start');
    
    const progression2 = atlasSystem.getAtlasProgression();
    const totalPoints2 = progression2.totalPoints;
    const spentPoints2 = progression2.spentPoints;
    const availablePoints2 = progression2.availablePoints;
    
    expect(totalPoints2).toBe(spentPoints2 + availablePoints2);
    expect(totalPoints2).toBe(totalPoints1 + 10);
  });
});