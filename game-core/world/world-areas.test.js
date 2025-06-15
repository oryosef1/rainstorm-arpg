/**
 * World Areas System Tests
 * Comprehensive test suite for the world areas and waypoint system
 */

const { WorldAreasManager } = require('./world-areas.ts');

describe('WorldAreasManager', () => {
  let worldManager;

  beforeEach(() => {
    worldManager = new WorldAreasManager();
  });

  describe('Area Management', () => {
    test('should initialize with predefined areas', () => {
      const area = worldManager.getArea('town_act1');
      
      expect(area).toBeTruthy();
      expect(area.name).toBe('Lioneye\'s Watch');
      expect(area.act).toBe(1);
      expect(area.type).toBe('town');
      expect(area.hasWaypoint).toBe(true);
    });

    test('should return null for non-existent area', () => {
      const area = worldManager.getArea('non_existent_area');
      expect(area).toBeNull();
    });

    test('should get areas by act', () => {
      const act1Areas = worldManager.getAreasForAct(1);
      
      expect(act1Areas.length).toBeGreaterThan(0);
      expect(act1Areas.every(area => area.act === 1)).toBe(true);
      
      const townArea = act1Areas.find(area => area.id === 'town_act1');
      expect(townArea).toBeTruthy();
    });

    test('should have proper area connections', () => {
      const townArea = worldManager.getArea('town_act1');
      
      expect(townArea.connections).toBeDefined();
      expect(townArea.connections.length).toBeGreaterThan(0);
      
      const coastConnection = townArea.connections.find(conn => conn.areaId === 'coast');
      expect(coastConnection).toBeTruthy();
      expect(coastConnection.connectionType).toBe('exit');
    });
  });

  describe('Waypoint System', () => {
    test('should initialize with predefined waypoints', () => {
      const waypoint = worldManager.getWaypoint('wp_town_act1');
      
      expect(waypoint).toBeTruthy();
      expect(waypoint.name).toBe('Lioneye\'s Watch');
      expect(waypoint.areaId).toBe('town_act1');
      expect(waypoint.unlocked).toBe(false);
    });

    test('should unlock waypoints for players', () => {
      const playerId = 'test_player_1';
      const waypointId = 'wp_town_act1';
      
      const unlocked = worldManager.unlockWaypoint(playerId, waypointId);
      
      expect(unlocked).toBe(true);
      
      const unlockedWaypoints = worldManager.getUnlockedWaypoints(playerId);
      expect(unlockedWaypoints.length).toBe(1);
      expect(unlockedWaypoints[0].id).toBe(waypointId);
    });

    test('should not unlock same waypoint twice', () => {
      const playerId = 'test_player_1';
      const waypointId = 'wp_town_act1';
      
      const firstUnlock = worldManager.unlockWaypoint(playerId, waypointId);
      const secondUnlock = worldManager.unlockWaypoint(playerId, waypointId);
      
      expect(firstUnlock).toBe(true);
      expect(secondUnlock).toBe(false);
      
      const unlockedWaypoints = worldManager.getUnlockedWaypoints(playerId);
      expect(unlockedWaypoints.length).toBe(1);
    });

    test('should handle non-existent waypoints', () => {
      const playerId = 'test_player_1';
      const invalidWaypointId = 'wp_invalid';
      
      const unlocked = worldManager.unlockWaypoint(playerId, invalidWaypointId);
      expect(unlocked).toBe(false);
    });

    test('should allow travel to unlocked waypoints', () => {
      const playerId = 'test_player_1';
      const waypointId = 'wp_town_act1';
      
      // Unlock waypoint first
      worldManager.unlockWaypoint(playerId, waypointId);
      
      // Travel to waypoint
      const result = worldManager.travelToWaypoint(playerId, waypointId);
      
      expect(result.success).toBe(true);
      expect(result.areaId).toBe('town_act1');
      expect(result.message).toContain('Traveled to');
    });

    test('should prevent travel to locked waypoints', () => {
      const playerId = 'test_player_1';
      const waypointId = 'wp_mud_flats';
      
      // Don't unlock waypoint, try to travel
      const result = worldManager.travelToWaypoint(playerId, waypointId);
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Waypoint not unlocked');
    });
  });

  describe('Area Access Control', () => {
    test('should allow access to areas with met requirements', () => {
      const playerId = 'test_player_1';
      const areaId = 'town_act1';
      const playerLevel = 5;
      const completedQuests = new Set();
      
      const canAccess = worldManager.canAccessArea(playerId, areaId, playerLevel, completedQuests);
      expect(canAccess).toBe(true);
    });

    test('should deny access to areas with unmet level requirements', () => {
      const playerId = 'test_player_1';
      const areaId = 'town_act2';
      const playerLevel = 5; // Below required level of 8
      const completedQuests = new Set(['enemy_at_gate']);
      
      const canAccess = worldManager.canAccessArea(playerId, areaId, playerLevel, completedQuests);
      expect(canAccess).toBe(false);
    });

    test('should deny access to areas with unmet quest requirements', () => {
      const playerId = 'test_player_1';
      const areaId = 'town_act2';
      const playerLevel = 10;
      const completedQuests = new Set(); // Missing required quest
      
      const canAccess = worldManager.canAccessArea(playerId, areaId, playerLevel, completedQuests);
      expect(canAccess).toBe(false);
    });

    test('should allow access when all requirements are met', () => {
      const playerId = 'test_player_1';
      const areaId = 'town_act2';
      const playerLevel = 10;
      const completedQuests = new Set(['enemy_at_gate']);
      
      const canAccess = worldManager.canAccessArea(playerId, areaId, playerLevel, completedQuests);
      expect(canAccess).toBe(true);
    });
  });

  describe('Area Navigation', () => {
    test('should allow entering connected areas', () => {
      const playerId = 'test_player_1';
      const fromAreaId = 'town_act1';
      const toAreaId = 'coast';
      
      // Initialize player in starting area
      worldManager.initializePlayer(playerId);
      
      const result = worldManager.enterArea(playerId, fromAreaId, toAreaId);
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Entered');
      
      const currentArea = worldManager.getCurrentArea(playerId);
      expect(currentArea.id).toBe(toAreaId);
    });

    test('should prevent entering unconnected areas', () => {
      const playerId = 'test_player_1';
      const fromAreaId = 'town_act1';
      const toAreaId = 'town_act2'; // Not directly connected
      
      worldManager.initializePlayer(playerId);
      
      const result = worldManager.enterArea(playerId, fromAreaId, toAreaId);
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('No connection between areas');
    });

    test('should get connected areas', () => {
      const connections = worldManager.getConnectedAreas('town_act1');
      
      expect(connections.length).toBeGreaterThan(0);
      expect(connections.some(conn => conn.areaId === 'coast')).toBe(true);
    });

    test('should auto-unlock waypoints when entering areas', () => {
      const playerId = 'test_player_1';
      
      worldManager.initializePlayer(playerId);
      
      // Enter area with waypoint
      worldManager.enterArea(playerId, 'town_act1', 'coast');
      worldManager.enterArea(playerId, 'coast', 'mud_flats');
      
      const unlockedWaypoints = worldManager.getUnlockedWaypoints(playerId);
      const mudFlatsWaypoint = unlockedWaypoints.find(wp => wp.id === 'wp_mud_flats');
      
      expect(mudFlatsWaypoint).toBeTruthy();
    });
  });

  describe('Pathfinding', () => {
    test('should find direct path between connected areas', () => {
      const path = worldManager.findPath('town_act1', 'coast');
      
      expect(path).toEqual(['town_act1', 'coast']);
    });

    test('should find multi-step path', () => {
      const path = worldManager.findPath('town_act1', 'mud_flats');
      
      expect(path.length).toBeGreaterThan(2);
      expect(path[0]).toBe('town_act1');
      expect(path[path.length - 1]).toBe('mud_flats');
      expect(path.includes('coast')).toBe(true);
    });

    test('should return empty path for unreachable areas', () => {
      // Create a scenario where areas are not connected
      const path = worldManager.findPath('town_act1', 'non_existent_area');
      
      expect(path).toEqual([]);
    });

    test('should return self for same area path', () => {
      const path = worldManager.findPath('town_act1', 'town_act1');
      
      expect(path).toEqual(['town_act1']);
    });
  });

  describe('Player Initialization', () => {
    test('should initialize player in starting area', () => {
      const playerId = 'test_player_1';
      
      worldManager.initializePlayer(playerId);
      
      const currentArea = worldManager.getCurrentArea(playerId);
      expect(currentArea.id).toBe('town_act1');
      
      const unlockedWaypoints = worldManager.getUnlockedWaypoints(playerId);
      expect(unlockedWaypoints.length).toBe(1);
      expect(unlockedWaypoints[0].id).toBe('wp_town_act1');
    });

    test('should handle multiple players independently', () => {
      const player1Id = 'test_player_1';
      const player2Id = 'test_player_2';
      
      worldManager.initializePlayer(player1Id);
      worldManager.initializePlayer(player2Id);
      
      // Move player 1 to different area
      worldManager.enterArea(player1Id, 'town_act1', 'coast');
      
      const player1Area = worldManager.getCurrentArea(player1Id);
      const player2Area = worldManager.getCurrentArea(player2Id);
      
      expect(player1Area.id).toBe('coast');
      expect(player2Area.id).toBe('town_act1');
    });
  });

  describe('Instance Management', () => {
    test('should create area instances for players', () => {
      const playerId = 'test_player_1';
      const areaId = 'coast';
      
      const instance = worldManager.getOrCreateInstance(areaId, playerId);
      
      expect(instance.areaId).toBe(areaId);
      expect(instance.playersInside.has(playerId)).toBe(true);
      expect(instance.state).toBe('active');
      expect(typeof instance.seed).toBe('number');
    });

    test('should reuse existing instances', () => {
      const playerId = 'test_player_1';
      const areaId = 'coast';
      
      const instance1 = worldManager.getOrCreateInstance(areaId, playerId);
      const instance2 = worldManager.getOrCreateInstance(areaId, playerId);
      
      expect(instance1.id).toBe(instance2.id);
      expect(instance1.seed).toBe(instance2.seed);
    });
  });

  describe('World Map Data', () => {
    test('should provide world map data for UI', () => {
      const playerId = 'test_player_1';
      
      worldManager.initializePlayer(playerId);
      worldManager.unlockWaypoint(playerId, 'wp_mud_flats');
      
      const mapData = worldManager.getWorldMapData(playerId);
      
      expect(mapData.areas.length).toBeGreaterThan(0);
      expect(mapData.waypoints.length).toBeGreaterThan(0);
      expect(mapData.unlockedWaypoints.size).toBe(2); // town_act1 + mud_flats
      expect(mapData.currentArea).toBe('town_act1');
    });

    test('should show different data for different players', () => {
      const player1Id = 'test_player_1';
      const player2Id = 'test_player_2';
      
      worldManager.initializePlayer(player1Id);
      worldManager.initializePlayer(player2Id);
      
      // Give player 1 extra waypoint
      worldManager.unlockWaypoint(player1Id, 'wp_mud_flats');
      
      const map1 = worldManager.getWorldMapData(player1Id);
      const map2 = worldManager.getWorldMapData(player2Id);
      
      expect(map1.unlockedWaypoints.size).toBe(2);
      expect(map2.unlockedWaypoints.size).toBe(1);
    });
  });

  describe('Statistics', () => {
    test('should provide area statistics', () => {
      const stats = worldManager.getAreaStats();
      
      expect(stats.totalAreas).toBeGreaterThan(0);
      expect(stats.waypointCount).toBeGreaterThan(0);
      expect(stats.areasByAct.size).toBeGreaterThan(0);
      expect(stats.areasByAct.get(1)).toBeGreaterThan(0);
      expect(stats.activeInstances).toBe(0); // No instances created yet
    });

    test('should track active instances in statistics', () => {
      const playerId = 'test_player_1';
      
      worldManager.getOrCreateInstance('coast', playerId);
      worldManager.getOrCreateInstance('mud_flats', playerId);
      
      const stats = worldManager.getAreaStats();
      expect(stats.activeInstances).toBe(2);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid area IDs gracefully', () => {
      const playerId = 'test_player_1';
      
      const result = worldManager.enterArea(playerId, 'invalid_area', 'town_act1');
      expect(result.success).toBe(false);
      
      const currentArea = worldManager.getCurrentArea(playerId);
      expect(currentArea).toBeNull();
    });

    test('should handle uninitialized players gracefully', () => {
      const playerId = 'uninitialized_player';
      
      const currentArea = worldManager.getCurrentArea(playerId);
      expect(currentArea).toBeNull();
      
      const waypoints = worldManager.getUnlockedWaypoints(playerId);
      expect(waypoints).toEqual([]);
    });

    test('should handle invalid waypoint travel gracefully', () => {
      const playerId = 'test_player_1';
      
      const result = worldManager.travelToWaypoint(playerId, 'invalid_waypoint');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Waypoint not found');
    });
  });

  describe('Performance', () => {
    test('should handle large numbers of players efficiently', () => {
      const startTime = performance.now();
      
      // Initialize 100 players
      for (let i = 0; i < 100; i++) {
        worldManager.initializePlayer(`player_${i}`);
        worldManager.unlockWaypoint(`player_${i}`, 'wp_mud_flats');
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete in reasonable time (less than 100ms)
      expect(duration).toBeLessThan(100);
    });

    test('should handle pathfinding efficiently', () => {
      const startTime = performance.now();
      
      // Perform multiple pathfinding operations
      for (let i = 0; i < 50; i++) {
        worldManager.findPath('town_act1', 'southern_forest');
        worldManager.findPath('coast', 'town_act2');
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete in reasonable time (less than 50ms)
      expect(duration).toBeLessThan(50);
    });
  });
});