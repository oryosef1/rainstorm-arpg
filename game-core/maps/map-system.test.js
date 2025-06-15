const { MapSystem } = require('./map-system');

// Mock ECS Core
jest.mock('../ecs/ecs-core', () => ({
  ISystem: class {},
  IEntity: class {
    hasComponents(components) {
      return true;
    }
  }
}));

describe('MapSystem', () => {
  let mapSystem;
  let mockEntity;

  beforeEach(() => {
    mapSystem = new MapSystem();
    mockEntity = {
      id: 'test-entity',
      hasComponents: jest.fn().mockReturnValue(true),
      getComponent: jest.fn()
    };
  });

  afterEach(() => {
    mapSystem.cleanup();
  });

  describe('Core System Functionality', () => {
    test('should initialize with correct properties', () => {
      expect(mapSystem.name).toBe('MapSystem');
      expect(mapSystem.requiredComponents).toEqual(['Map', 'Player']);
      expect(mapSystem.entities).toBeInstanceOf(Set);
      expect(mapSystem.priority).toBe(30);
      expect(mapSystem.enabled).toBe(true);
    });

    test('should implement ISystem interface', () => {
      expect(typeof mapSystem.addEntity).toBe('function');
      expect(typeof mapSystem.removeEntity).toBe('function');
      expect(typeof mapSystem.update).toBe('function');
      expect(typeof mapSystem.canProcess).toBe('function');
      expect(typeof mapSystem.cleanup).toBe('function');
      expect(typeof mapSystem.getMetrics).toBe('function');
    });

    test('should add entities that meet requirements', () => {
      mapSystem.addEntity(mockEntity);
      expect(mapSystem.entities.has(mockEntity)).toBe(true);
    });

    test('should remove entities', () => {
      mapSystem.addEntity(mockEntity);
      mapSystem.removeEntity(mockEntity);
      expect(mapSystem.entities.has(mockEntity)).toBe(false);
    });

    test('should check if entity can be processed', () => {
      expect(mapSystem.canProcess(mockEntity)).toBe(true);
      
      mockEntity.hasComponents.mockReturnValue(false);
      expect(mapSystem.canProcess(mockEntity)).toBe(false);
    });

    test('should return system metrics', () => {
      const metrics = mapSystem.getMetrics();
      expect(metrics).toHaveProperty('name', 'MapSystem');
      expect(metrics).toHaveProperty('executionTime');
      expect(metrics).toHaveProperty('entityCount');
      expect(metrics).toHaveProperty('lastUpdate');
    });

    test('should cleanup properly', () => {
      mapSystem.addEntity(mockEntity);
      mapSystem.cleanup();
      expect(mapSystem.entities.size).toBe(0);
    });
  });

  describe('Map Generation', () => {
    test('should generate map with correct structure', () => {
      const baseMapId = 'crypt';
      const tier = 5;
      
      const generatedMap = mapSystem.generateMap(baseMapId, tier);
      
      expect(generatedMap).toHaveProperty('id');
      expect(generatedMap).toHaveProperty('name');
      expect(generatedMap).toHaveProperty('tier', tier);
      expect(generatedMap).toHaveProperty('level');
      expect(generatedMap).toHaveProperty('modifiers');
      expect(generatedMap).toHaveProperty('quantity');
      expect(generatedMap).toHaveProperty('rarity');
      expect(generatedMap).toHaveProperty('packSize');
      expect(generatedMap).toHaveProperty('completion');
      
      expect(Array.isArray(generatedMap.modifiers)).toBe(true);
      expect(typeof generatedMap.level).toBe('number');
      expect(typeof generatedMap.quantity).toBe('number');
      expect(typeof generatedMap.rarity).toBe('number');
    });

    test('should generate different maps for different tiers', () => {
      const baseMapId = 'crypt';
      const map1 = mapSystem.generateMap(baseMapId, 1);
      const map2 = mapSystem.generateMap(baseMapId, 10);
      
      expect(map1.level).toBeLessThan(map2.level);
      expect(map1.tier).toBeLessThan(map2.tier);
    });

    test('should throw error for invalid base map', () => {
      expect(() => {
        mapSystem.generateMap('invalid_map', 5);
      }).toThrow('Base map invalid_map not found');
    });

    test('should generate map area from map data', () => {
      const baseMapId = 'crypt';
      const mapData = mapSystem.generateMap(baseMapId, 3);
      const area = mapSystem.generateMapArea(mapData);
      
      expect(area).toHaveProperty('id');
      expect(area).toHaveProperty('name');
      expect(area).toHaveProperty('layout');
      expect(area).toHaveProperty('monsters');
      expect(area).toHaveProperty('environment');
      expect(area).toHaveProperty('waypoints');
      expect(area).toHaveProperty('treasureChests');
      
      expect(Array.isArray(area.monsters)).toBe(true);
      expect(Array.isArray(area.waypoints)).toBe(true);
      expect(Array.isArray(area.treasureChests)).toBe(true);
    });
  });

  describe('Map Modifiers', () => {
    test('should generate modifiers based on tier', () => {
      const baseMapId = 'crypt';
      const lowTierMap = mapSystem.generateMap(baseMapId, 1);
      const highTierMap = mapSystem.generateMap(baseMapId, 15);
      
      // Higher tier maps should generally have more modifiers
      expect(highTierMap.modifiers.length).toBeGreaterThanOrEqual(lowTierMap.modifiers.length);
    });

    test('should not generate duplicate modifiers', () => {
      const baseMapId = 'crypt';
      const mapData = mapSystem.generateMap(baseMapId, 10);
      
      const modifierIds = mapData.modifiers.map(mod => mod.id);
      const uniqueIds = [...new Set(modifierIds)];
      
      expect(modifierIds.length).toBe(uniqueIds.length);
    });

    test('should only generate modifiers within tier limit', () => {
      const baseMapId = 'crypt';
      const tier = 3;
      const mapData = mapSystem.generateMap(baseMapId, tier);
      
      mapData.modifiers.forEach(modifier => {
        expect(modifier.tier).toBeLessThanOrEqual(tier);
      });
    });
  });

  describe('Area Layout Generation', () => {
    test('should generate valid layout types', () => {
      const baseMapId = 'crypt';
      const mapData = mapSystem.generateMap(baseMapId, 5);
      const area = mapSystem.generateMapArea(mapData);
      
      const validTypes = ['linear', 'branching', 'circular', 'maze', 'open'];
      expect(validTypes).toContain(area.layout.type);
      
      const validSizes = ['small', 'medium', 'large', 'massive'];
      expect(validSizes).toContain(area.layout.size);
      
      expect(typeof area.layout.rooms).toBe('number');
      expect(area.layout.rooms).toBeGreaterThan(0);
      expect(Array.isArray(area.layout.connections)).toBe(true);
      expect(Array.isArray(area.layout.specialRooms)).toBe(true);
    });

    test('should generate connections between rooms', () => {
      const baseMapId = 'crypt';
      const mapData = mapSystem.generateMap(baseMapId, 3);
      const area = mapSystem.generateMapArea(mapData);
      
      area.layout.connections.forEach(connection => {
        expect(connection).toHaveProperty('from');
        expect(connection).toHaveProperty('to');
        expect(connection).toHaveProperty('type');
        expect(connection).toHaveProperty('locked');
        
        const validConnectionTypes = ['door', 'passage', 'stairs', 'portal'];
        expect(validConnectionTypes).toContain(connection.type);
        expect(typeof connection.locked).toBe('boolean');
      });
    });

    test('should always include boss room in special rooms', () => {
      const baseMapId = 'crypt';
      const mapData = mapSystem.generateMap(baseMapId, 5);
      const area = mapSystem.generateMapArea(mapData);
      
      const bossRoom = area.layout.specialRooms.find(room => room.type === 'boss');
      expect(bossRoom).toBeDefined();
      expect(bossRoom.id).toBe('boss_room');
    });
  });

  describe('Monster Pack Generation', () => {
    test('should generate monster packs with valid properties', () => {
      const baseMapId = 'crypt';
      const mapData = mapSystem.generateMap(baseMapId, 4);
      const area = mapSystem.generateMapArea(mapData);
      
      expect(area.monsters.length).toBeGreaterThan(0);
      
      area.monsters.forEach(pack => {
        expect(pack).toHaveProperty('id');
        expect(pack).toHaveProperty('type');
        expect(pack).toHaveProperty('count');
        expect(pack).toHaveProperty('level');
        expect(pack).toHaveProperty('modifiers');
        expect(pack).toHaveProperty('position');
        expect(pack).toHaveProperty('patrolArea');
        
        expect(typeof pack.count).toBe('number');
        expect(pack.count).toBeGreaterThan(0);
        expect(typeof pack.level).toBe('number');
        expect(Array.isArray(pack.modifiers)).toBe(true);
        
        expect(pack.position).toHaveProperty('x');
        expect(pack.position).toHaveProperty('y');
        expect(pack.patrolArea).toHaveProperty('width');
        expect(pack.patrolArea).toHaveProperty('height');
      });
    });

    test('should scale monster level with map level', () => {
      const baseMapId = 'crypt';
      const mapData = mapSystem.generateMap(baseMapId, 8);
      const area = mapSystem.generateMapArea(mapData);
      
      area.monsters.forEach(pack => {
        expect(pack.level).toBeGreaterThanOrEqual(mapData.level - 1);
        expect(pack.level).toBeLessThanOrEqual(mapData.level + 2);
      });
    });
  });

  describe('Environment Generation', () => {
    test('should generate valid environment settings', () => {
      const baseMapId = 'crypt';
      const mapData = mapSystem.generateMap(baseMapId, 3);
      const area = mapSystem.generateMapArea(mapData);
      
      expect(area.environment).toHaveProperty('tileset');
      expect(area.environment).toHaveProperty('lighting');
      expect(area.environment).toHaveProperty('temperature');
      expect(area.environment).toHaveProperty('ambientSounds');
      
      const validLighting = ['bright', 'dim', 'dark', 'flickering'];
      expect(validLighting).toContain(area.environment.lighting);
      
      const validTemperatures = ['hot', 'warm', 'cool', 'cold', 'freezing'];
      expect(validTemperatures).toContain(area.environment.temperature);
      
      expect(Array.isArray(area.environment.ambientSounds)).toBe(true);
    });
  });

  describe('Waypoint Generation', () => {
    test('should generate waypoints with valid properties', () => {
      const baseMapId = 'crypt';
      const mapData = mapSystem.generateMap(baseMapId, 5);
      const area = mapSystem.generateMapArea(mapData);
      
      expect(area.waypoints.length).toBeGreaterThan(0);
      
      area.waypoints.forEach(waypoint => {
        expect(waypoint).toHaveProperty('id');
        expect(waypoint).toHaveProperty('name');
        expect(waypoint).toHaveProperty('position');
        expect(waypoint).toHaveProperty('unlocked');
        expect(waypoint).toHaveProperty('isPortal');
        
        expect(waypoint.position).toHaveProperty('x');
        expect(waypoint.position).toHaveProperty('y');
        expect(typeof waypoint.unlocked).toBe('boolean');
        expect(typeof waypoint.isPortal).toBe('boolean');
      });
    });

    test('should have first waypoint unlocked by default', () => {
      const baseMapId = 'crypt';
      const mapData = mapSystem.generateMap(baseMapId, 3);
      const area = mapSystem.generateMapArea(mapData);
      
      const firstWaypoint = area.waypoints[0];
      expect(firstWaypoint.unlocked).toBe(true);
    });
  });

  describe('Treasure Chest Generation', () => {
    test('should generate treasure chests with valid properties', () => {
      const baseMapId = 'crypt';
      const mapData = mapSystem.generateMap(baseMapId, 6);
      const area = mapSystem.generateMapArea(mapData);
      
      area.treasureChests.forEach(chest => {
        expect(chest).toHaveProperty('id');
        expect(chest).toHaveProperty('type');
        expect(chest).toHaveProperty('position');
        expect(chest).toHaveProperty('loot');
        expect(chest).toHaveProperty('locked');
        expect(chest).toHaveProperty('trapped');
        
        const validChestTypes = ['normal', 'rare', 'unique', 'strongbox'];
        expect(validChestTypes).toContain(chest.type);
        
        expect(chest.position).toHaveProperty('x');
        expect(chest.position).toHaveProperty('y');
        expect(typeof chest.locked).toBe('boolean');
        expect(typeof chest.trapped).toBe('boolean');
        
        expect(chest.loot).toHaveProperty('currency');
        expect(chest.loot).toHaveProperty('items');
        expect(chest.loot).toHaveProperty('experience');
        expect(Array.isArray(chest.loot.currency)).toBe(true);
        expect(Array.isArray(chest.loot.items)).toBe(true);
      });
    });

    test('should generate better loot for higher rarity chests', () => {
      const baseMapId = 'crypt';
      const mapData = mapSystem.generateMap(baseMapId, 5);
      
      // Generate multiple areas to get different chest types
      const areas = [];
      for (let i = 0; i < 10; i++) {
        areas.push(mapSystem.generateMapArea(mapData));
      }
      
      const allChests = areas.flatMap(area => area.treasureChests);
      const normalChests = allChests.filter(chest => chest.type === 'normal');
      const strongboxes = allChests.filter(chest => chest.type === 'strongbox');
      
      if (normalChests.length > 0 && strongboxes.length > 0) {
        const normalExp = normalChests[0].loot.experience;
        const strongboxExp = strongboxes[0].loot.experience;
        expect(strongboxExp).toBeGreaterThan(normalExp);
      }
    });
  });

  describe('Map Activation', () => {
    test('should activate and deactivate maps', () => {
      const baseMapId = 'crypt';
      const mapData = mapSystem.generateMap(baseMapId, 3);
      
      expect(mapSystem.getActiveMap()).toBeNull();
      
      mapSystem.activateMap(mapData);
      expect(mapSystem.getActiveMap()).toBe(mapData);
      
      mapSystem.deactivateMap();
      expect(mapSystem.getActiveMap()).toBeNull();
    });

    test('should emit events on map activation/deactivation', () => {
      const baseMapId = 'crypt';
      const mapData = mapSystem.generateMap(baseMapId, 3);
      
      const activatedHandler = jest.fn();
      const deactivatedHandler = jest.fn();
      
      mapSystem.on('mapActivated', activatedHandler);
      mapSystem.on('mapDeactivated', deactivatedHandler);
      
      mapSystem.activateMap(mapData);
      expect(activatedHandler).toHaveBeenCalledWith({
        map: mapData,
        area: expect.any(Object)
      });
      
      mapSystem.deactivateMap();
      expect(deactivatedHandler).toHaveBeenCalledWith({
        map: mapData
      });
    });
  });

  describe('Public API', () => {
    test('should get all available maps', () => {
      const allMaps = mapSystem.getAllMaps();
      expect(Array.isArray(allMaps)).toBe(true);
      expect(allMaps.length).toBeGreaterThan(0);
    });

    test('should get map by ID', () => {
      const allMaps = mapSystem.getAllMaps();
      const firstMap = allMaps[0];
      
      const retrievedMap = mapSystem.getMapById(firstMap.id);
      expect(retrievedMap).toBe(firstMap);
      
      const invalidMap = mapSystem.getMapById('invalid_id');
      expect(invalidMap).toBeNull();
    });

    test('should update map completion', () => {
      const allMaps = mapSystem.getAllMaps();
      const testMap = allMaps[0];
      
      const completionHandler = jest.fn();
      mapSystem.on('mapCompleted', completionHandler);
      
      mapSystem.updateMapCompletion(testMap.id, 'normal');
      
      expect(testMap.completion.normal).toBe(true);
      expect(completionHandler).toHaveBeenCalledWith({
        mapId: testMap.id,
        difficulty: 'normal'
      });
    });

    test('should get generated area by ID', () => {
      const baseMapId = 'crypt';
      const mapData = mapSystem.generateMap(baseMapId, 3);
      const area = mapSystem.generateMapArea(mapData);
      
      const retrievedArea = mapSystem.getGeneratedArea(area.id);
      expect(retrievedArea).toBe(area);
      
      const invalidArea = mapSystem.getGeneratedArea('invalid_id');
      expect(invalidArea).toBeNull();
    });
  });

  describe('Update Loop', () => {
    test('should update without errors when enabled', () => {
      expect(() => {
        mapSystem.update(16.67); // ~60 FPS
      }).not.toThrow();
    });

    test('should skip update when disabled', () => {
      mapSystem.enabled = false;
      
      // Should not throw even with active map
      const baseMapId = 'crypt';
      const mapData = mapSystem.generateMap(baseMapId, 3);
      mapSystem.activateMap(mapData);
      
      expect(() => {
        mapSystem.update(16.67);
      }).not.toThrow();
    });
  });

  describe('Event Emission', () => {
    test('should emit events for map generation', () => {
      const generatedHandler = jest.fn();
      mapSystem.on('mapGenerated', generatedHandler);
      
      const baseMapId = 'crypt';
      const mapData = mapSystem.generateMap(baseMapId, 5);
      
      expect(generatedHandler).toHaveBeenCalledWith({
        map: mapData
      });
    });

    test('should emit events for area generation', () => {
      const areaGeneratedHandler = jest.fn();
      mapSystem.on('areaGenerated', areaGeneratedHandler);
      
      const baseMapId = 'crypt';
      const mapData = mapSystem.generateMap(baseMapId, 3);
      const area = mapSystem.generateMapArea(mapData);
      
      expect(areaGeneratedHandler).toHaveBeenCalledWith({
        area: area
      });
    });
  });

  describe('Performance', () => {
    test('should handle multiple map generations efficiently', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        const baseMapId = 'crypt';
        const tier = (i % 15) + 1; // Cycle through tiers 1-15
        mapSystem.generateMap(baseMapId, tier);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should generate 100 maps in reasonable time (less than 1 second)
      expect(duration).toBeLessThan(1000);
    });

    test('should handle large area generation efficiently', () => {
      const baseMapId = 'crypt';
      const mapData = mapSystem.generateMap(baseMapId, 15); // High tier map
      
      const startTime = performance.now();
      mapSystem.generateMapArea(mapData);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      // Should generate complex area in reasonable time (less than 100ms)
      expect(duration).toBeLessThan(100);
    });
  });
});

// Performance Tests
describe('MapSystem Performance', () => {
  let mapSystem;

  beforeEach(() => {
    mapSystem = new MapSystem();
  });

  afterEach(() => {
    mapSystem.cleanup();
  });

  test('should maintain performance with many entities', () => {
    // Add many entities
    for (let i = 0; i < 1000; i++) {
      const mockEntity = {
        id: `entity-${i}`,
        hasComponents: jest.fn().mockReturnValue(true)
      };
      mapSystem.addEntity(mockEntity);
    }

    const startTime = performance.now();
    mapSystem.update(16.67);
    const endTime = performance.now();

    const duration = endTime - startTime;
    expect(duration).toBeLessThan(16); // Should complete in less than one frame
  });

  test('should efficiently generate maps in parallel', async () => {
    const mapPromises = [];
    
    for (let i = 0; i < 50; i++) {
      mapPromises.push(Promise.resolve().then(() => {
        return mapSystem.generateMap('crypt', (i % 10) + 1);
      }));
    }

    const startTime = performance.now();
    const maps = await Promise.all(mapPromises);
    const endTime = performance.now();

    expect(maps.length).toBe(50);
    expect(endTime - startTime).toBeLessThan(500); // Should complete in reasonable time
  });
});