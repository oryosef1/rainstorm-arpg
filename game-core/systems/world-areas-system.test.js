/**
 * World Areas ECS System Tests
 * Comprehensive test suite for the world areas ECS integration
 */

const { WorldAreasSystem } = require('./world-areas-system.js');
const { createMockEntity, createMockWorld } = require('../test-utils/mock-ecs');

describe('WorldAreasSystem', () => {
  let system;
  let mockWorld;
  let mockEntity;

  beforeEach(() => {
    system = new WorldAreasSystem();
    mockWorld = createMockWorld();
    mockEntity = createMockEntity();
    
    system.setWorld(mockWorld);
  });

  describe('System Initialization', () => {
    test('should initialize with correct properties', () => {
      expect(system.name).toBe('WorldAreasSystem');
      expect(system.requiredComponents).toContain('AreaPosition');
      expect(system.requiredComponents).toContain('Player');
      expect(system.priority).toBe(30);
      expect(system.enabled).toBe(true);
    });

    test('should start with empty entity set', () => {
      const metrics = system.getMetrics();
      expect(metrics.entityCount).toBe(0);
    });
  });

  describe('Entity Management', () => {
    test('should add entities with required components', () => {
      // Setup entity with required components
      mockEntity.addComponent('Player', { id: 'test_player_1', name: 'Test Player' });
      mockEntity.addComponent('AreaPosition', { areaId: 'town_act1', x: 0, y: 0, lastAreaChange: Date.now() });
      
      system.addEntity(mockEntity);
      
      const metrics = system.getMetrics();
      expect(metrics.entityCount).toBe(1);
    });

    test('should not add entities missing required components', () => {
      // Setup entity missing AreaPosition component
      mockEntity.addComponent('Player', { id: 'test_player_1', name: 'Test Player' });
      
      system.addEntity(mockEntity);
      
      const metrics = system.getMetrics();
      expect(metrics.entityCount).toBe(0);
    });

    test('should initialize player on entity addition', () => {
      mockEntity.addComponent('Player', { id: 'test_player_1', name: 'Test Player' });
      mockEntity.addComponent('AreaPosition', { areaId: 'town_act1', x: 0, y: 0, lastAreaChange: Date.now() });
      
      system.addEntity(mockEntity);
      
      // Check that waypoint progress component was added
      const waypointProgress = mockEntity.getComponent('WaypointProgress');
      expect(waypointProgress).toBeTruthy();
      expect(waypointProgress.unlockedWaypoints.has('wp_town_act1')).toBe(true);
      expect(waypointProgress.totalWaypointsDiscovered).toBe(1);
    });

    test('should remove entities correctly', () => {
      mockEntity.addComponent('Player', { id: 'test_player_1', name: 'Test Player' });
      mockEntity.addComponent('AreaPosition', { areaId: 'town_act1', x: 0, y: 0, lastAreaChange: Date.now() });
      
      system.addEntity(mockEntity);
      expect(system.getMetrics().entityCount).toBe(1);
      
      system.removeEntity(mockEntity);
      expect(system.getMetrics().entityCount).toBe(0);
    });
  });

  describe('Waypoint System Integration', () => {
    beforeEach(() => {
      mockEntity.addComponent('Player', { id: 'test_player_1', name: 'Test Player' });
      mockEntity.addComponent('AreaPosition', { areaId: 'mud_flats', x: 100, y: 150, lastAreaChange: Date.now() });
      mockEntity.addComponent('Character', { level: 5 });
      system.addEntity(mockEntity);
    });

    test('should discover waypoints when player is near', () => {
      // Simulate player being near waypoint coordinates
      const areaPosition = mockEntity.getComponent('AreaPosition');
      areaPosition.x = 105; // Near waypoint at (100, 150)
      areaPosition.y = 155;
      
      system.update(16.67); // ~60fps
      
      const waypointProgress = mockEntity.getComponent('WaypointProgress');
      expect(waypointProgress.unlockedWaypoints.has('wp_mud_flats')).toBe(true);
      expect(waypointProgress.totalWaypointsDiscovered).toBe(2); // town_act1 + mud_flats
    });

    test('should not discover waypoints when player is far', () => {
      // Simulate player being far from waypoint
      const areaPosition = mockEntity.getComponent('AreaPosition');
      areaPosition.x = 500; // Far from waypoint at (100, 150)
      areaPosition.y = 500;
      
      system.update(16.67);
      
      const waypointProgress = mockEntity.getComponent('WaypointProgress');
      expect(waypointProgress.unlockedWaypoints.has('wp_mud_flats')).toBe(false);
      expect(waypointProgress.totalWaypointsDiscovered).toBe(1); // Only town_act1
    });

    test('should emit waypoint discovered event', () => {
      const areaPosition = mockEntity.getComponent('AreaPosition');
      areaPosition.x = 100;
      areaPosition.y = 150;
      
      system.update(16.67);
      
      // Check that event was emitted
      expect(mockWorld.emit).toHaveBeenCalledWith('waypoint:discovered', expect.objectContaining({
        entity: mockEntity,
        waypointId: 'wp_mud_flats',
        timestamp: expect.any(Number)
      }));
    });

    test('should travel to unlocked waypoint', () => {
      // First unlock the waypoint
      const waypointProgress = mockEntity.getComponent('WaypointProgress');
      waypointProgress.unlockedWaypoints.add('wp_town_act1');
      
      const success = system.travelToWaypoint(mockEntity, 'wp_town_act1');
      
      expect(success).toBe(true);
      
      // Check that area transition was started
      const transition = mockEntity.getComponent('AreaTransition');
      expect(transition).toBeTruthy();
      expect(transition.isTransitioning).toBe(true);
      expect(transition.toAreaId).toBe('town_act1');
    });

    test('should not travel to locked waypoint', () => {
      // Try to travel to waypoint that's not unlocked
      const success = system.travelToWaypoint(mockEntity, 'wp_southern_forest');
      
      expect(success).toBe(false);
      
      // Check that no transition was started
      const transition = mockEntity.getComponent('AreaTransition');
      expect(transition).toBeFalsy();
    });

    test('should get unlocked waypoints for player', () => {
      const waypointProgress = mockEntity.getComponent('WaypointProgress');
      waypointProgress.unlockedWaypoints.add('wp_mud_flats');
      
      const waypoints = system.getUnlockedWaypoints(mockEntity);
      
      expect(waypoints.length).toBeGreaterThan(0);
      expect(waypoints.some(wp => wp.id === 'wp_town_act1')).toBe(true);
      expect(waypoints.some(wp => wp.id === 'wp_mud_flats')).toBe(true);
    });
  });

  describe('Area Transitions', () => {
    beforeEach(() => {
      mockEntity.addComponent('Player', { id: 'test_player_1', name: 'Test Player' });
      mockEntity.addComponent('AreaPosition', { areaId: 'town_act1', x: 0, y: 0, lastAreaChange: Date.now() });
      mockEntity.addComponent('Character', { level: 10 });
      system.addEntity(mockEntity);
    });

    test('should start area transition', () => {
      mockEntity.addComponent('QuestProgress', { 
        completedQuests: new Set(['enemy_at_gate']),
        activeQuests: new Map(),
        questAreas: new Set()
      });
      
      const success = system.enterConnectedArea(mockEntity, 'coast');
      
      expect(success).toBe(true);
      
      const transition = mockEntity.getComponent('AreaTransition');
      expect(transition).toBeTruthy();
      expect(transition.isTransitioning).toBe(true);
      expect(transition.fromAreaId).toBe('town_act1');
      expect(transition.toAreaId).toBe('coast');
    });

    test('should complete area transition after duration', () => {
      // Start transition
      const transition = {
        isTransitioning: true,
        fromAreaId: 'town_act1',
        toAreaId: 'coast',
        transitionStartTime: Date.now() - 2500, // 2.5 seconds ago
        transitionDuration: 2000 // 2 second duration
      };
      mockEntity.addComponent('AreaTransition', transition);
      
      system.update(16.67);
      
      // Check transition completed
      const updatedTransition = mockEntity.getComponent('AreaTransition');
      expect(updatedTransition.isTransitioning).toBe(false);
      
      const areaPosition = mockEntity.getComponent('AreaPosition');
      expect(areaPosition.areaId).toBe('coast');
      
      // Check event emission
      expect(mockWorld.emit).toHaveBeenCalledWith('area:transition:complete', expect.objectContaining({
        entity: mockEntity,
        areaId: 'coast'
      }));
    });

    test('should not complete transition before duration', () => {
      // Start recent transition
      const transition = {
        isTransitioning: true,
        fromAreaId: 'town_act1',
        toAreaId: 'coast',
        transitionStartTime: Date.now() - 500, // 0.5 seconds ago
        transitionDuration: 2000 // 2 second duration
      };
      mockEntity.addComponent('AreaTransition', transition);
      
      system.update(16.67);
      
      // Check transition still in progress
      const updatedTransition = mockEntity.getComponent('AreaTransition');
      expect(updatedTransition.isTransitioning).toBe(true);
      
      const areaPosition = mockEntity.getComponent('AreaPosition');
      expect(areaPosition.areaId).toBe('town_act1'); // Should still be in original area
    });

    test('should prevent entering unconnected areas', () => {
      const success = system.enterConnectedArea(mockEntity, 'town_act2');
      
      expect(success).toBe(false);
      
      const transition = mockEntity.getComponent('AreaTransition');
      expect(transition).toBeFalsy();
    });

    test('should prevent entering areas without proper level', () => {
      // Set character level too low for Act 2
      const character = mockEntity.getComponent('Character');
      character.level = 5; // Below required level of 8
      
      mockEntity.addComponent('QuestProgress', { 
        completedQuests: new Set(['enemy_at_gate']),
        activeQuests: new Map(),
        questAreas: new Set()
      });
      
      const success = system.enterConnectedArea(mockEntity, 'town_act2');
      
      expect(success).toBe(false);
    });
  });

  describe('Quest Area Integration', () => {
    beforeEach(() => {
      mockEntity.addComponent('Player', { id: 'test_player_1', name: 'Test Player' });
      mockEntity.addComponent('AreaPosition', { areaId: 'coast', x: 0, y: 0, lastAreaChange: Date.now() });
      mockEntity.addComponent('QuestProgress', { 
        completedQuests: new Set(),
        activeQuests: new Map(),
        questAreas: new Set()
      });
      system.addEntity(mockEntity);
    });

    test('should discover quest areas when entering', () => {
      system.update(16.67);
      
      const questProgress = mockEntity.getComponent('QuestProgress');
      expect(questProgress.questAreas.has('enemy_at_gate')).toBe(true);
      
      // Check event emission
      expect(mockWorld.emit).toHaveBeenCalledWith('quest:area:discovered', expect.objectContaining({
        entity: mockEntity,
        questArea: 'enemy_at_gate'
      }));
    });

    test('should not rediscover already known quest areas', () => {
      const questProgress = mockEntity.getComponent('QuestProgress');
      questProgress.questAreas.add('enemy_at_gate');
      
      // Clear mock calls
      mockWorld.emit.mockClear();
      
      system.update(16.67);
      
      // Should not emit event again
      expect(mockWorld.emit).not.toHaveBeenCalledWith('quest:area:discovered', expect.any(Object));
    });
  });

  describe('World Map Integration', () => {
    beforeEach(() => {
      mockEntity.addComponent('Player', { id: 'test_player_1', name: 'Test Player' });
      mockEntity.addComponent('AreaPosition', { areaId: 'town_act1', x: 0, y: 0, lastAreaChange: Date.now() });
      system.addEntity(mockEntity);
    });

    test('should provide world map data', () => {
      const mapData = system.getWorldMapData(mockEntity);
      
      expect(mapData).toBeTruthy();
      expect(mapData.areas.length).toBeGreaterThan(0);
      expect(mapData.waypoints.length).toBeGreaterThan(0);
      expect(mapData.unlockedWaypoints).toBeInstanceOf(Set);
      expect(mapData.currentArea).toBe('town_act1');
    });

    test('should get available connections', () => {
      const connections = system.getAvailableConnections(mockEntity);
      
      expect(connections.length).toBeGreaterThan(0);
      expect(connections.some(conn => conn.areaId === 'coast')).toBe(true);
    });

    test('should handle entity without required components', () => {
      const invalidEntity = createMockEntity();
      
      const mapData = system.getWorldMapData(invalidEntity);
      expect(mapData).toBeNull();
      
      const connections = system.getAvailableConnections(invalidEntity);
      expect(connections).toEqual([]);
    });
  });

  describe('Performance Monitoring', () => {
    test('should track performance metrics', () => {
      mockEntity.addComponent('Player', { id: 'test_player_1', name: 'Test Player' });
      mockEntity.addComponent('AreaPosition', { areaId: 'town_act1', x: 0, y: 0, lastAreaChange: Date.now() });
      system.addEntity(mockEntity);
      
      system.update(16.67);
      
      const metrics = system.getMetrics();
      
      expect(metrics.name).toBe('WorldAreasSystem');
      expect(metrics.entityCount).toBe(1);
      expect(metrics.executionTime).toBeGreaterThanOrEqual(0);
      expect(metrics.lastUpdate).toBeGreaterThan(0);
      expect(metrics.averageTime).toBeGreaterThanOrEqual(0);
    });

    test('should update min/max execution times', () => {
      mockEntity.addComponent('Player', { id: 'test_player_1', name: 'Test Player' });
      mockEntity.addComponent('AreaPosition', { areaId: 'town_act1', x: 0, y: 0, lastAreaChange: Date.now() });
      system.addEntity(mockEntity);
      
      // Run multiple updates
      for (let i = 0; i < 5; i++) {
        system.update(16.67);
      }
      
      const metrics = system.getMetrics();
      
      expect(metrics.maxTime).toBeGreaterThanOrEqual(0);
      expect(metrics.minTime).toBeLessThanOrEqual(metrics.maxTime);
      expect(metrics.averageTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Event Emission', () => {
    beforeEach(() => {
      mockEntity.addComponent('Player', { id: 'test_player_1', name: 'Test Player' });
      mockEntity.addComponent('AreaPosition', { areaId: 'town_act1', x: 0, y: 0, lastAreaChange: Date.now() });
      system.addEntity(mockEntity);
    });

    test('should emit area enter event on area change', () => {
      // Simulate area change by updating area position
      const areaPosition = mockEntity.getComponent('AreaPosition');
      areaPosition.areaId = 'coast';
      
      // Mock the world areas manager to return different current area
      const originalMethod = system.worldAreasManager.getCurrentArea;
      system.worldAreasManager.getCurrentArea = jest.fn(() => ({ id: 'coast' }));
      
      system.update(16.67);
      
      expect(mockWorld.emit).toHaveBeenCalledWith('area:enter', expect.objectContaining({
        entity: mockEntity,
        areaId: 'coast',
        timestamp: expect.any(Number)
      }));
      
      // Restore original method
      system.worldAreasManager.getCurrentArea = originalMethod;
    });

    test('should handle missing world gracefully', () => {
      system.setWorld(null);
      
      // Should not throw error when trying to emit events
      expect(() => {
        system.update(16.67);
      }).not.toThrow();
    });
  });

  describe('System Cleanup', () => {
    test('should cleanup entities', () => {
      mockEntity.addComponent('Player', { id: 'test_player_1', name: 'Test Player' });
      mockEntity.addComponent('AreaPosition', { areaId: 'town_act1', x: 0, y: 0, lastAreaChange: Date.now() });
      system.addEntity(mockEntity);
      
      expect(system.getMetrics().entityCount).toBe(1);
      
      system.cleanup();
      
      expect(system.getMetrics().entityCount).toBe(0);
    });

    test('should handle empty cleanup', () => {
      expect(() => {
        system.cleanup();
      }).not.toThrow();
      
      expect(system.getMetrics().entityCount).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle entity without player component', () => {
      mockEntity.addComponent('AreaPosition', { areaId: 'town_act1', x: 0, y: 0, lastAreaChange: Date.now() });
      
      expect(() => {
        system.addEntity(mockEntity);
      }).not.toThrow();
      
      expect(system.getMetrics().entityCount).toBe(0);
    });

    test('should handle corrupted area position data', () => {
      mockEntity.addComponent('Player', { id: 'test_player_1', name: 'Test Player' });
      mockEntity.addComponent('AreaPosition', { areaId: null, x: 'invalid', y: undefined });
      
      expect(() => {
        system.addEntity(mockEntity);
        system.update(16.67);
      }).not.toThrow();
    });

    test('should handle very large coordinate values', () => {
      mockEntity.addComponent('Player', { id: 'test_player_1', name: 'Test Player' });
      mockEntity.addComponent('AreaPosition', { 
        areaId: 'town_act1', 
        x: Number.MAX_SAFE_INTEGER, 
        y: Number.MAX_SAFE_INTEGER,
        lastAreaChange: Date.now()
      });
      system.addEntity(mockEntity);
      
      expect(() => {
        system.update(16.67);
      }).not.toThrow();
    });
  });
});