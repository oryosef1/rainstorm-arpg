/**
 * World Areas System for RainStorm ARPG
 * Manages world areas, waypoints, and area navigation
 */

interface AreaConnection {
  areaId: string;
  connectionType: 'entrance' | 'exit' | 'portal' | 'waypoint';
  requirements?: {
    level?: number;
    questComplete?: string;
    itemRequired?: string;
  };
}

interface WaypointData {
  id: string;
  name: string;
  areaId: string;
  unlocked: boolean;
  coordinates: { x: number; y: number };
  discoveredAt?: number;
}

interface AreaData {
  id: string;
  name: string;
  description: string;
  act: number;
  type: 'town' | 'dungeon' | 'wilderness' | 'boss_chamber' | 'special';
  levelRange: { min: number; max: number };
  monsterLevel: number;
  tileSet: string;
  hasWaypoint: boolean;
  waypointId?: string;
  connections: AreaConnection[];
  npcs: string[];
  questAreas: string[];
  environment: {
    lighting: 'bright' | 'dim' | 'dark' | 'magical';
    weather?: 'clear' | 'rain' | 'storm' | 'fog' | 'snow';
    atmosphere: 'peaceful' | 'tense' | 'hostile' | 'mystical';
    musicTrack: string;
  };
  features: {
    hasShops: boolean;
    hasStash: boolean;
    hasBench: boolean;
    isInstancedDungeon: boolean;
    maxPlayers: number;
    respawnEnemies: boolean;
  };
  accessibility: {
    requiredLevel: number;
    questRequirements: string[];
    itemRequirements: string[];
  };
}

interface AreaInstance {
  id: string;
  areaId: string;
  seed: number;
  createdAt: number;
  playersInside: Set<string>;
  enemies: Map<string, any>;
  loot: Map<string, any>;
  state: 'active' | 'inactive' | 'resetting';
}

class WorldAreasManager {
  private areas: Map<string, AreaData> = new Map();
  private waypoints: Map<string, WaypointData> = new Map();
  private areaInstances: Map<string, AreaInstance> = new Map();
  private playerWaypoints: Map<string, Set<string>> = new Map(); // playerId -> unlocked waypoint IDs
  private playerCurrentArea: Map<string, string> = new Map(); // playerId -> current area ID
  private areaGraph: Map<string, Set<string>> = new Map(); // area connections for pathfinding
  
  constructor() {
    this.initializeAreas();
    this.initializeWaypoints();
    this.buildAreaGraph();
  }

  /**
   * Initialize all world areas
   */
  private initializeAreas(): void {
    const areas: AreaData[] = [
      // Act 1 Areas
      {
        id: 'town_act1',
        name: 'Lioneye\'s Watch',
        description: 'A fortified outpost overlooking the coast',
        act: 1,
        type: 'town',
        levelRange: { min: 1, max: 10 },
        monsterLevel: 0,
        tileSet: 'coastal_town',
        hasWaypoint: true,
        waypointId: 'wp_town_act1',
        connections: [
          { areaId: 'coast', connectionType: 'exit' },
          { areaId: 'tidal_island', connectionType: 'portal' }
        ],
        npcs: ['helena', 'bestel', 'tarkleigh', 'nessa'],
        questAreas: ['enemy_at_gate', 'mercy_mission'],
        environment: {
          lighting: 'bright',
          weather: 'clear',
          atmosphere: 'peaceful',
          musicTrack: 'town_theme_1'
        },
        features: {
          hasShops: true,
          hasStash: true,
          hasBench: true,
          isInstancedDungeon: false,
          maxPlayers: 50,
          respawnEnemies: false
        },
        accessibility: {
          requiredLevel: 1,
          questRequirements: [],
          itemRequirements: []
        }
      },
      {
        id: 'coast',
        name: 'The Twilight Strand',
        description: 'A dark beach where exiles first wash ashore',
        act: 1,
        type: 'wilderness',
        levelRange: { min: 1, max: 3 },
        monsterLevel: 2,
        tileSet: 'dark_beach',
        hasWaypoint: false,
        connections: [
          { areaId: 'town_act1', connectionType: 'entrance' },
          { areaId: 'mud_flats', connectionType: 'exit' }
        ],
        npcs: [],
        questAreas: ['enemy_at_gate'],
        environment: {
          lighting: 'dim',
          weather: 'fog',
          atmosphere: 'tense',
          musicTrack: 'dark_ambient_1'
        },
        features: {
          hasShops: false,
          hasStash: false,
          hasBench: false,
          isInstancedDungeon: true,
          maxPlayers: 6,
          respawnEnemies: true
        },
        accessibility: {
          requiredLevel: 1,
          questRequirements: [],
          itemRequirements: []
        }
      },
      {
        id: 'mud_flats',
        name: 'The Mud Flats',
        description: 'Treacherous wetlands filled with hostile creatures',
        act: 1,
        type: 'wilderness',
        levelRange: { min: 2, max: 5 },
        monsterLevel: 4,
        tileSet: 'muddy_wetlands',
        hasWaypoint: true,
        waypointId: 'wp_mud_flats',
        connections: [
          { areaId: 'coast', connectionType: 'entrance' },
          { areaId: 'fetid_pool', connectionType: 'exit' },
          { areaId: 'submerged_passage', connectionType: 'exit' }
        ],
        npcs: [],
        questAreas: ['the_caged_brute'],
        environment: {
          lighting: 'dim',
          weather: 'rain',
          atmosphere: 'hostile',
          musicTrack: 'wilderness_theme_1'
        },
        features: {
          hasShops: false,
          hasStash: false,
          hasBench: false,
          isInstancedDungeon: true,
          maxPlayers: 6,
          respawnEnemies: true
        },
        accessibility: {
          requiredLevel: 2,
          questRequirements: [],
          itemRequirements: []
        }
      },
      {
        id: 'submerged_passage',
        name: 'The Submerged Passage',
        description: 'A flooded underground tunnel system',
        act: 1,
        type: 'dungeon',
        levelRange: { min: 3, max: 6 },
        monsterLevel: 5,
        tileSet: 'flooded_cave',
        hasWaypoint: false,
        connections: [
          { areaId: 'mud_flats', connectionType: 'entrance' },
          { areaId: 'flooded_depths', connectionType: 'exit' }
        ],
        npcs: [],
        questAreas: ['dweller_of_the_deep'],
        environment: {
          lighting: 'dark',
          atmosphere: 'hostile',
          musicTrack: 'cave_ambient_1'
        },
        features: {
          hasShops: false,
          hasStash: false,
          hasBench: false,
          isInstancedDungeon: true,
          maxPlayers: 6,
          respawnEnemies: true
        },
        accessibility: {
          requiredLevel: 3,
          questRequirements: [],
          itemRequirements: []
        }
      },
      // Act 2 Areas
      {
        id: 'town_act2',
        name: 'The Forest Encampment',
        description: 'A makeshift camp in the heart of the wilderness',
        act: 2,
        type: 'town',
        levelRange: { min: 8, max: 18 },
        monsterLevel: 0,
        tileSet: 'forest_camp',
        hasWaypoint: true,
        waypointId: 'wp_town_act2',
        connections: [
          { areaId: 'southern_forest', connectionType: 'exit' },
          { areaId: 'old_fields', connectionType: 'exit' }
        ],
        npcs: ['yeena', 'greust', 'silk', 'helena'],
        questAreas: ['great_white_beast', 'the_way_forward'],
        environment: {
          lighting: 'bright',
          weather: 'clear',
          atmosphere: 'peaceful',
          musicTrack: 'town_theme_2'
        },
        features: {
          hasShops: true,
          hasStash: true,
          hasBench: true,
          isInstancedDungeon: false,
          maxPlayers: 50,
          respawnEnemies: false
        },
        accessibility: {
          requiredLevel: 8,
          questRequirements: ['enemy_at_gate'],
          itemRequirements: []
        }
      },
      {
        id: 'southern_forest',
        name: 'The Southern Forest',
        description: 'Dense woodland teeming with dangerous wildlife',
        act: 2,
        type: 'wilderness',
        levelRange: { min: 8, max: 12 },
        monsterLevel: 10,
        tileSet: 'dense_forest',
        hasWaypoint: true,
        waypointId: 'wp_southern_forest',
        connections: [
          { areaId: 'town_act2', connectionType: 'entrance' },
          { areaId: 'forest_ruins', connectionType: 'exit' },
          { areaId: 'weaver_chambers', connectionType: 'exit' }
        ],
        npcs: [],
        questAreas: ['great_white_beast', 'sharp_and_cruel'],
        environment: {
          lighting: 'dim',
          weather: 'clear',
          atmosphere: 'mystical',
          musicTrack: 'forest_theme_1'
        },
        features: {
          hasShops: false,
          hasStash: false,
          hasBench: false,
          isInstancedDungeon: true,
          maxPlayers: 6,
          respawnEnemies: true
        },
        accessibility: {
          requiredLevel: 8,
          questRequirements: ['enemy_at_gate'],
          itemRequirements: []
        }
      }
    ];

    areas.forEach(area => {
      this.areas.set(area.id, area);
    });
  }

  /**
   * Initialize waypoint system
   */
  private initializeWaypoints(): void {
    const waypoints: WaypointData[] = [
      {
        id: 'wp_town_act1',
        name: 'Lioneye\'s Watch',
        areaId: 'town_act1',
        unlocked: false,
        coordinates: { x: 0, y: 0 }
      },
      {
        id: 'wp_mud_flats',
        name: 'The Mud Flats',
        areaId: 'mud_flats',
        unlocked: false,
        coordinates: { x: 100, y: 150 }
      },
      {
        id: 'wp_town_act2',
        name: 'The Forest Encampment',
        areaId: 'town_act2',
        unlocked: false,
        coordinates: { x: 200, y: 300 }
      },
      {
        id: 'wp_southern_forest',
        name: 'The Southern Forest',
        areaId: 'southern_forest',
        unlocked: false,
        coordinates: { x: 150, y: 400 }
      }
    ];

    waypoints.forEach(waypoint => {
      this.waypoints.set(waypoint.id, waypoint);
    });
  }

  /**
   * Build area connection graph for pathfinding
   */
  private buildAreaGraph(): void {
    this.areas.forEach(area => {
      const connections = new Set<string>();
      area.connections.forEach(conn => {
        connections.add(conn.areaId);
      });
      this.areaGraph.set(area.id, connections);
    });
  }

  /**
   * Get area by ID
   */
  getArea(areaId: string): AreaData | null {
    return this.areas.get(areaId) || null;
  }

  /**
   * Get all areas for an act
   */
  getAreasForAct(actNumber: number): AreaData[] {
    return Array.from(this.areas.values()).filter(area => area.act === actNumber);
  }

  /**
   * Get waypoint by ID
   */
  getWaypoint(waypointId: string): WaypointData | null {
    return this.waypoints.get(waypointId) || null;
  }

  /**
   * Get all unlocked waypoints for a player
   */
  getUnlockedWaypoints(playerId: string): WaypointData[] {
    const unlockedIds = this.playerWaypoints.get(playerId) || new Set();
    return Array.from(unlockedIds)
      .map(id => this.waypoints.get(id))
      .filter(Boolean) as WaypointData[];
  }

  /**
   * Unlock a waypoint for a player
   */
  unlockWaypoint(playerId: string, waypointId: string): boolean {
    const waypoint = this.waypoints.get(waypointId);
    if (!waypoint) return false;

    if (!this.playerWaypoints.has(playerId)) {
      this.playerWaypoints.set(playerId, new Set());
    }

    const playerWaypoints = this.playerWaypoints.get(playerId)!;
    if (!playerWaypoints.has(waypointId)) {
      playerWaypoints.add(waypointId);
      waypoint.discoveredAt = Date.now();
      return true;
    }

    return false;
  }

  /**
   * Check if player can access an area
   */
  canAccessArea(playerId: string, areaId: string, playerLevel: number, completedQuests: Set<string>): boolean {
    const area = this.areas.get(areaId);
    if (!area) return false;

    // Check level requirement
    if (playerLevel < area.accessibility.requiredLevel) return false;

    // Check quest requirements
    for (const questId of area.accessibility.questRequirements) {
      if (!completedQuests.has(questId)) return false;
    }

    return true;
  }

  /**
   * Travel to area via waypoint
   */
  travelToWaypoint(playerId: string, waypointId: string): { success: boolean; message: string; areaId?: string } {
    const waypoint = this.waypoints.get(waypointId);
    if (!waypoint) {
      return { success: false, message: 'Waypoint not found' };
    }

    const playerWaypoints = this.playerWaypoints.get(playerId);
    if (!playerWaypoints || !playerWaypoints.has(waypointId)) {
      return { success: false, message: 'Waypoint not unlocked' };
    }

    const area = this.areas.get(waypoint.areaId);
    if (!area) {
      return { success: false, message: 'Area not found' };
    }

    // Update player's current area
    this.playerCurrentArea.set(playerId, area.id);

    return {
      success: true,
      message: `Traveled to ${area.name}`,
      areaId: area.id
    };
  }

  /**
   * Enter area through connection
   */
  enterArea(playerId: string, fromAreaId: string, toAreaId: string): { success: boolean; message: string } {
    const fromArea = this.areas.get(fromAreaId);
    const toArea = this.areas.get(toAreaId);

    if (!fromArea || !toArea) {
      return { success: false, message: 'Area not found' };
    }

    // Check if connection exists
    const hasConnection = fromArea.connections.some(conn => conn.areaId === toAreaId);
    if (!hasConnection) {
      return { success: false, message: 'No connection between areas' };
    }

    // Update player's current area
    this.playerCurrentArea.set(playerId, toAreaId);

    // Auto-unlock waypoint if area has one
    if (toArea.hasWaypoint && toArea.waypointId) {
      this.unlockWaypoint(playerId, toArea.waypointId);
    }

    return {
      success: true,
      message: `Entered ${toArea.name}`
    };
  }

  /**
   * Get connected areas from current area
   */
  getConnectedAreas(areaId: string): AreaConnection[] {
    const area = this.areas.get(areaId);
    return area ? area.connections : [];
  }

  /**
   * Find path between areas
   */
  findPath(fromAreaId: string, toAreaId: string): string[] {
    if (fromAreaId === toAreaId) return [fromAreaId];

    const visited = new Set<string>();
    const queue: { areaId: string; path: string[] }[] = [{ areaId: fromAreaId, path: [fromAreaId] }];

    while (queue.length > 0) {
      const { areaId, path } = queue.shift()!;

      if (areaId === toAreaId) {
        return path;
      }

      if (visited.has(areaId)) continue;
      visited.add(areaId);

      const connections = this.areaGraph.get(areaId) || new Set();
      for (const connectedArea of connections) {
        if (!visited.has(connectedArea)) {
          queue.push({
            areaId: connectedArea,
            path: [...path, connectedArea]
          });
        }
      }
    }

    return []; // No path found
  }

  /**
   * Get player's current area
   */
  getCurrentArea(playerId: string): AreaData | null {
    const areaId = this.playerCurrentArea.get(playerId);
    return areaId ? this.areas.get(areaId) || null : null;
  }

  /**
   * Get area instance or create new one
   */
  getOrCreateInstance(areaId: string, playerId: string): AreaInstance {
    const instanceKey = `${areaId}_${playerId}`;
    
    if (!this.areaInstances.has(instanceKey)) {
      const instance: AreaInstance = {
        id: instanceKey,
        areaId,
        seed: Math.floor(Math.random() * 1000000),
        createdAt: Date.now(),
        playersInside: new Set([playerId]),
        enemies: new Map(),
        loot: new Map(),
        state: 'active'
      };
      this.areaInstances.set(instanceKey, instance);
    }

    return this.areaInstances.get(instanceKey)!;
  }

  /**
   * Get world map data for UI
   */
  getWorldMapData(playerId: string): {
    areas: AreaData[];
    waypoints: WaypointData[];
    unlockedWaypoints: Set<string>;
    currentArea: string | null;
  } {
    const unlockedWaypoints = this.playerWaypoints.get(playerId) || new Set();
    const currentArea = this.playerCurrentArea.get(playerId) || null;

    return {
      areas: Array.from(this.areas.values()),
      waypoints: Array.from(this.waypoints.values()),
      unlockedWaypoints,
      currentArea
    };
  }

  /**
   * Initialize player in starting area
   */
  initializePlayer(playerId: string): void {
    // Start in Act 1 town
    this.playerCurrentArea.set(playerId, 'town_act1');
    this.unlockWaypoint(playerId, 'wp_town_act1');
  }

  /**
   * Get area statistics
   */
  getAreaStats(): {
    totalAreas: number;
    areasByAct: Map<number, number>;
    waypointCount: number;
    activeInstances: number;
  } {
    const areasByAct = new Map<number, number>();
    
    this.areas.forEach(area => {
      const count = areasByAct.get(area.act) || 0;
      areasByAct.set(area.act, count + 1);
    });

    return {
      totalAreas: this.areas.size,
      areasByAct,
      waypointCount: this.waypoints.size,
      activeInstances: this.areaInstances.size
    };
  }
}

export { WorldAreasManager, AreaData, WaypointData, AreaConnection, AreaInstance };