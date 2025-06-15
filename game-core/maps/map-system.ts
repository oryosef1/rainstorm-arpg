import { EventEmitter } from 'events';
import { ISystem, IEntity } from '../ecs/ecs-core';
import { SystemMetrics } from '../../types/ecs-types';

export interface MapModifier {
  id: string;
  name: string;
  description: string;
  type: 'prefix' | 'suffix';
  tier: number;
  effects: ModifierEffect[];
  rarityWeight: number;
}

export interface ModifierEffect {
  type: 'monster_damage' | 'monster_life' | 'monster_speed' | 'player_resistance' | 
        'item_rarity' | 'item_quantity' | 'experience' | 'curse' | 'elemental';
  value: number;
  valueType: 'flat' | 'percentage';
  element?: 'fire' | 'cold' | 'lightning' | 'chaos';
}

export interface MapData {
  id: string;
  name: string;
  tier: number;
  level: number;
  layout: string;
  boss: string;
  baseType: string;
  modifiers: MapModifier[];
  quantity: number;
  rarity: number;
  packSize: number;
  isShaped: boolean;
  isElder: boolean;
  isShaper: boolean;
  completion: {
    normal: boolean;
    magic: boolean;
    rare: boolean;
    unique: boolean;
  };
}

export interface MapArea {
  id: string;
  name: string;
  description: string;
  layout: AreaLayout;
  monsters: MonsterPack[];
  environment: EnvironmentSettings;
  waypoints: WaypointData[];
  treasureChests: TreasureChest[];
}

export interface AreaLayout {
  type: 'linear' | 'branching' | 'circular' | 'maze' | 'open';
  size: 'small' | 'medium' | 'large' | 'massive';
  rooms: number;
  connections: Connection[];
  specialRooms: SpecialRoom[];
}

export interface MonsterPack {
  id: string;
  type: string;
  count: number;
  level: number;
  modifiers: string[];
  position: { x: number; y: number };
  patrolArea: { width: number; height: number };
}

export interface EnvironmentSettings {
  tileset: string;
  lighting: 'bright' | 'dim' | 'dark' | 'flickering';
  weather?: 'rain' | 'snow' | 'fog' | 'storm';
  temperature: 'hot' | 'warm' | 'cool' | 'cold' | 'freezing';
  ambientSounds: string[];
}

export interface WaypointData {
  id: string;
  name: string;
  position: { x: number; y: number };
  unlocked: boolean;
  isPortal: boolean;
}

export interface TreasureChest {
  id: string;
  type: 'normal' | 'rare' | 'unique' | 'strongbox';
  position: { x: number; y: number };
  loot: LootTable;
  locked: boolean;
  trapped: boolean;
}

export interface LootTable {
  currency: { type: string; min: number; max: number }[];
  items: { baseType: string; rarity: string; chance: number }[];
  experience: number;
}

export interface Connection {
  from: string;
  to: string;
  type: 'door' | 'passage' | 'stairs' | 'portal';
  locked: boolean;
  keyRequired?: string;
}

export interface SpecialRoom {
  id: string;
  type: 'boss' | 'treasure' | 'shrine' | 'portal' | 'vendor';
  position: { x: number; y: number };
  requirements: string[];
  rewards: any[];
}

export class MapSystem extends EventEmitter implements ISystem {
  readonly name: string = 'MapSystem';
  readonly requiredComponents: readonly string[] = ['Map', 'Player'];
  readonly entities: Set<IEntity> = new Set();
  readonly priority: number = 30;
  enabled: boolean = true;

  private maps: Map<string, MapData> = new Map();
  private activeMap: MapData | null = null;
  private generatedAreas: Map<string, MapArea> = new Map();
  private mapModifiers: MapModifier[] = [];

  constructor() {
    super();
    this.initializeMapModifiers();
    this.initializeBaseMaps();
  }

  addEntity(entity: IEntity): void {
    if (this.canProcess(entity)) {
      this.entities.add(entity);
      this.emit('entityAdded', { system: this.name, entity });
    }
  }

  removeEntity(entity: IEntity): void {
    if (this.entities.has(entity)) {
      this.entities.delete(entity);
      this.emit('entityRemoved', { system: this.name, entity });
    }
  }

  update(deltaTime: number): void {
    if (!this.enabled) return;

    // Update active map state
    if (this.activeMap) {
      this.updateMapState(deltaTime);
    }

    // Process map-related entities
    for (const entity of this.entities) {
      this.processMapEntity(entity, deltaTime);
    }
  }

  canProcess(entity: IEntity): boolean {
    return entity.hasComponents(this.requiredComponents);
  }

  cleanup(): void {
    this.entities.clear();
    this.activeMap = null;
    this.generatedAreas.clear();
    this.emit('systemCleanup', { system: this.name });
  }

  getMetrics(): SystemMetrics {
    return {
      name: this.name,
      executionTime: 0,
      entityCount: this.entities.size,
      lastUpdate: Date.now(),
      averageTime: 0,
      maxTime: 0,
      minTime: 0
    };
  }

  // Map Generation and Management
  generateMap(baseMapId: string, tier: number): MapData {
    const baseMap = this.maps.get(baseMapId);
    if (!baseMap) {
      throw new Error(`Base map ${baseMapId} not found`);
    }

    const generatedMap: MapData = {
      ...baseMap,
      id: `${baseMapId}_${Date.now()}`,
      tier,
      level: this.calculateMapLevel(tier),
      modifiers: this.generateMapModifiers(tier),
      quantity: this.calculateQuantity(tier),
      rarity: this.calculateRarity(tier),
      packSize: this.calculateMapPackSize(tier),
      completion: {
        normal: false,
        magic: false,
        rare: false,
        unique: false
      }
    };

    this.emit('mapGenerated', { map: generatedMap });
    return generatedMap;
  }

  generateMapArea(mapData: MapData): MapArea {
    const layout = this.generateAreaLayout(mapData);
    const monsters = this.generateMonsterPacks(mapData, layout);
    const environment = this.generateEnvironment(mapData);
    const waypoints = this.generateWaypoints(layout);
    const treasureChests = this.generateTreasureChests(mapData, layout);

    const area: MapArea = {
      id: `area_${mapData.id}`,
      name: `${mapData.name} Area`,
      description: `A ${mapData.tier} tier area with various challenges`,
      layout,
      monsters,
      environment,
      waypoints,
      treasureChests
    };

    this.generatedAreas.set(area.id, area);
    this.emit('areaGenerated', { area });
    return area;
  }

  activateMap(mapData: MapData): void {
    this.activeMap = mapData;
    const area = this.generateMapArea(mapData);
    this.emit('mapActivated', { map: mapData, area });
  }

  deactivateMap(): void {
    if (this.activeMap) {
      this.emit('mapDeactivated', { map: this.activeMap });
      this.activeMap = null;
    }
  }

  // Map Modifier System
  private generateMapModifiers(tier: number): MapModifier[] {
    const modifierCount = Math.min(Math.floor(tier / 2) + Math.random() * 3, 6);
    const selectedModifiers: MapModifier[] = [];
    const availableModifiers = this.mapModifiers.filter(mod => mod.tier <= tier);

    for (let i = 0; i < modifierCount; i++) {
      const weightedModifiers = availableModifiers.filter(mod => 
        !selectedModifiers.find(selected => selected.id === mod.id)
      );
      
      if (weightedModifiers.length === 0) break;

      const totalWeight = weightedModifiers.reduce((sum, mod) => sum + mod.rarityWeight, 0);
      let random = Math.random() * totalWeight;

      for (const modifier of weightedModifiers) {
        random -= modifier.rarityWeight;
        if (random <= 0) {
          selectedModifiers.push(modifier);
          break;
        }
      }
    }

    return selectedModifiers;
  }

  private generateAreaLayout(mapData: MapData): AreaLayout {
    const layouts = ['linear', 'branching', 'circular', 'maze', 'open'] as const;
    const sizes = ['small', 'medium', 'large', 'massive'] as const;
    
    const type = layouts[Math.floor(Math.random() * layouts.length)];
    const size = sizes[Math.min(Math.floor(mapData.tier / 3), sizes.length - 1)];
    
    const roomCount = this.calculateRoomCount(type, size);
    const connections = this.generateConnections(roomCount, type);
    const specialRooms = this.generateSpecialRooms(roomCount, mapData.tier);

    return {
      type,
      size,
      rooms: roomCount,
      connections,
      specialRooms
    };
  }

  private generateMonsterPacks(mapData: MapData, layout: AreaLayout): MonsterPack[] {
    const packs: MonsterPack[] = [];
    const basePackCount = Math.floor(layout.rooms * 1.5);
    const bonusPackCount = Math.floor(mapData.packSize / 20);
    const totalPacks = basePackCount + bonusPackCount;

    for (let i = 0; i < totalPacks; i++) {
      const pack: MonsterPack = {
        id: `pack_${i}`,
        type: this.selectMonsterType(mapData),
        count: this.calculatePackSize(mapData),
        level: mapData.level + Math.floor(Math.random() * 3) - 1,
        modifiers: this.generateMonsterModifiers(mapData),
        position: {
          x: Math.random() * 1000,
          y: Math.random() * 1000
        },
        patrolArea: {
          width: 50 + Math.random() * 100,
          height: 50 + Math.random() * 100
        }
      };
      packs.push(pack);
    }

    return packs;
  }

  private generateEnvironment(mapData: MapData): EnvironmentSettings {
    const tilesets = ['dungeon', 'cave', 'forest', 'ruins', 'laboratory', 'temple'];
    const lightingOptions = ['bright', 'dim', 'dark', 'flickering'] as const;
    const temperatures = ['hot', 'warm', 'cool', 'cold', 'freezing'] as const;

    return {
      tileset: tilesets[Math.floor(Math.random() * tilesets.length)],
      lighting: lightingOptions[Math.floor(Math.random() * lightingOptions.length)],
      temperature: temperatures[Math.floor(Math.random() * temperatures.length)],
      ambientSounds: ['dripping', 'echo', 'wind', 'machinery']
    };
  }

  private generateWaypoints(layout: AreaLayout): WaypointData[] {
    const waypoints: WaypointData[] = [];
    const waypointCount = Math.max(1, Math.floor(layout.rooms / 5));

    for (let i = 0; i < waypointCount; i++) {
      waypoints.push({
        id: `waypoint_${i}`,
        name: `Waypoint ${i + 1}`,
        position: {
          x: Math.random() * 1000,
          y: Math.random() * 1000
        },
        unlocked: i === 0, // First waypoint is always unlocked
        isPortal: false
      });
    }

    return waypoints;
  }

  private generateTreasureChests(mapData: MapData, layout: AreaLayout): TreasureChest[] {
    const chests: TreasureChest[] = [];
    const chestCount = Math.floor(layout.rooms * 0.3) + Math.floor(mapData.rarity / 50);

    for (let i = 0; i < chestCount; i++) {
      const chestTypes = ['normal', 'rare', 'unique', 'strongbox'] as const;
      const type = chestTypes[Math.floor(Math.random() * chestTypes.length)];

      chests.push({
        id: `chest_${i}`,
        type,
        position: {
          x: Math.random() * 1000,
          y: Math.random() * 1000
        },
        loot: this.generateLootTable(mapData, type),
        locked: Math.random() < 0.3,
        trapped: Math.random() < 0.2
      });
    }

    return chests;
  }

  // Helper Methods
  private calculateMapLevel(tier: number): number {
    return 60 + tier * 2; // Base level 60, +2 per tier
  }

  private calculateQuantity(tier: number): number {
    return 100 + tier * 10 + Math.floor(Math.random() * 50);
  }

  private calculateRarity(tier: number): number {
    return Math.floor(tier * 15) + Math.floor(Math.random() * 100);
  }

  private calculateMapPackSize(tier: number): number {
    return 100 + tier * 5 + Math.floor(Math.random() * 30);
  }

  private calculateRoomCount(type: AreaLayout['type'], size: AreaLayout['size']): number {
    const baseRooms = {
      linear: { small: 3, medium: 5, large: 8, massive: 12 },
      branching: { small: 5, medium: 8, large: 12, massive: 18 },
      circular: { small: 4, medium: 6, large: 10, massive: 15 },
      maze: { small: 8, medium: 15, large: 25, massive: 40 },
      open: { small: 2, medium: 3, large: 5, massive: 8 }
    };

    return baseRooms[type][size] + Math.floor(Math.random() * 3);
  }

  private generateConnections(roomCount: number, type: AreaLayout['type']): Connection[] {
    const connections: Connection[] = [];
    
    // Generate connections based on layout type
    switch (type) {
      case 'linear':
        for (let i = 0; i < roomCount - 1; i++) {
          connections.push({
            from: `room_${i}`,
            to: `room_${i + 1}`,
            type: 'passage',
            locked: false
          });
        }
        break;
      
      case 'branching':
        // Create main path with branches
        for (let i = 0; i < Math.floor(roomCount * 0.6); i++) {
          connections.push({
            from: `room_${i}`,
            to: `room_${i + 1}`,
            type: 'passage',
            locked: false
          });
        }
        // Add branches
        for (let i = Math.floor(roomCount * 0.6); i < roomCount; i++) {
          const connectTo = Math.floor(Math.random() * Math.floor(roomCount * 0.6));
          connections.push({
            from: `room_${connectTo}`,
            to: `room_${i}`,
            type: 'door',
            locked: Math.random() < 0.3
          });
        }
        break;
      
      // Add other layout types as needed
      default:
        // Default linear connection
        for (let i = 0; i < roomCount - 1; i++) {
          connections.push({
            from: `room_${i}`,
            to: `room_${i + 1}`,
            type: 'passage',
            locked: false
          });
        }
    }

    return connections;
  }

  private generateSpecialRooms(roomCount: number, tier: number): SpecialRoom[] {
    const specialRooms: SpecialRoom[] = [];
    
    // Always have a boss room
    specialRooms.push({
      id: 'boss_room',
      type: 'boss',
      position: { x: 500, y: 900 },
      requirements: [],
      rewards: []
    });

    // Add treasure rooms based on tier
    const treasureRoomCount = Math.floor(tier / 5) + 1;
    for (let i = 0; i < treasureRoomCount; i++) {
      specialRooms.push({
        id: `treasure_${i}`,
        type: 'treasure',
        position: { 
          x: Math.random() * 1000, 
          y: Math.random() * 1000 
        },
        requirements: [],
        rewards: []
      });
    }

    return specialRooms;
  }

  private selectMonsterType(mapData: MapData): string {
    const monsterTypes = [
      'skeleton', 'zombie', 'golem', 'beast', 'demon', 
      'undead', 'construct', 'elemental', 'humanoid'
    ];
    return monsterTypes[Math.floor(Math.random() * monsterTypes.length)];
  }

  private calculatePackSize(mapData: MapData): number {
    const baseSize = 3 + Math.floor(mapData.tier / 3);
    const packSizeBonus = Math.floor(mapData.packSize / 25);
    return baseSize + packSizeBonus + Math.floor(Math.random() * 3);
  }

  private generateMonsterModifiers(mapData: MapData): string[] {
    const modifiers = ['fast', 'strong', 'resistant', 'magical', 'armored'];
    const modifierCount = Math.floor(mapData.tier / 4) + (Math.random() < 0.5 ? 1 : 0);
    
    const selected: string[] = [];
    for (let i = 0; i < modifierCount && i < modifiers.length; i++) {
      const availableModifiers = modifiers.filter(mod => !selected.includes(mod));
      if (availableModifiers.length > 0) {
        selected.push(availableModifiers[Math.floor(Math.random() * availableModifiers.length)]);
      }
    }
    
    return selected;
  }

  private generateLootTable(mapData: MapData, chestType: TreasureChest['type']): LootTable {
    const baseValue = mapData.tier * 10;
    const rarityMultiplier = {
      normal: 1,
      rare: 2,
      unique: 3,
      strongbox: 4
    }[chestType];

    return {
      currency: [
        { type: 'orb_of_alchemy', min: 1, max: 3 * rarityMultiplier },
        { type: 'chaos_orb', min: 0, max: rarityMultiplier },
        { type: 'orb_of_fusing', min: 1, max: 2 * rarityMultiplier }
      ],
      items: [
        { baseType: 'weapon', rarity: 'magic', chance: 0.7 },
        { baseType: 'armor', rarity: 'rare', chance: 0.3 * rarityMultiplier },
        { baseType: 'accessory', rarity: 'unique', chance: 0.1 * rarityMultiplier }
      ],
      experience: baseValue * rarityMultiplier * 100
    };
  }

  private updateMapState(deltaTime: number): void {
    // Update map-specific state like monster spawns, environmental effects, etc.
    // This would include things like:
    // - Spawning new monster packs
    // - Updating environmental hazards
    // - Managing map events
    // - Tracking completion progress
  }

  private processMapEntity(entity: IEntity, deltaTime: number): void {
    // Process entities that interact with the map system
    // This could include:
    // - Player movement through areas
    // - Monster AI within map bounds
    // - Interactive objects like chests and waypoints
  }

  private initializeMapModifiers(): void {
    this.mapModifiers = [
      {
        id: 'monster_damage_prefix',
        name: 'of Brutality',
        description: 'Monsters deal increased damage',
        type: 'prefix',
        tier: 1,
        effects: [{ type: 'monster_damage', value: 25, valueType: 'percentage' }],
        rarityWeight: 100
      },
      {
        id: 'monster_life_prefix',
        name: 'of Vitality',
        description: 'Monsters have increased life',
        type: 'prefix',
        tier: 1,
        effects: [{ type: 'monster_life', value: 40, valueType: 'percentage' }],
        rarityWeight: 100
      },
      {
        id: 'item_quantity_suffix',
        name: 'of Plenty',
        description: 'Increased item quantity',
        type: 'suffix',
        tier: 2,
        effects: [{ type: 'item_quantity', value: 30, valueType: 'percentage' }],
        rarityWeight: 80
      },
      {
        id: 'item_rarity_suffix',
        name: 'of Fortune',
        description: 'Increased item rarity',
        type: 'suffix',
        tier: 3,
        effects: [{ type: 'item_rarity', value: 50, valueType: 'percentage' }],
        rarityWeight: 60
      }
      // Add more modifiers as needed
    ];
  }

  private initializeBaseMaps(): void {
    // Initialize base map templates
    const baseMaps = [
      {
        id: 'crypt',
        name: 'Ancient Crypt',
        tier: 1,
        level: 60,
        layout: 'linear',
        boss: 'Skeleton Lord',
        baseType: 'dungeon'
      },
      {
        id: 'cave',
        name: 'Twisted Cave',
        tier: 2,
        level: 62,
        layout: 'branching',
        boss: 'Cave Beast',
        baseType: 'cave'
      },
      {
        id: 'ruins',
        name: 'Forgotten Ruins',
        tier: 3,
        level: 64,
        layout: 'maze',
        boss: 'Ancient Guardian',
        baseType: 'ruins'
      }
      // Add more base maps
    ];

    baseMaps.forEach(baseMap => {
      const mapData: MapData = {
        ...baseMap,
        modifiers: [],
        quantity: 100,
        rarity: 0,
        packSize: 100,
        isShaped: false,
        isElder: false,
        isShaper: false,
        completion: {
          normal: false,
          magic: false,
          rare: false,
          unique: false
        }
      };
      this.maps.set(baseMap.id, mapData);
    });
  }

  // Public API Methods
  getAllMaps(): MapData[] {
    return Array.from(this.maps.values());
  }

  getActiveMap(): MapData | null {
    return this.activeMap;
  }

  getMapById(id: string): MapData | null {
    return this.maps.get(id) || null;
  }

  getGeneratedArea(areaId: string): MapArea | null {
    return this.generatedAreas.get(areaId) || null;
  }

  updateMapCompletion(mapId: string, difficulty: keyof MapData['completion']): void {
    const map = this.maps.get(mapId);
    if (map) {
      map.completion[difficulty] = true;
      this.emit('mapCompleted', { mapId, difficulty });
    }
  }
}

export default MapSystem;