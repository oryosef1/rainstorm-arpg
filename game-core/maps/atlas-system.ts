import { EventEmitter } from 'events';
import { ISystem, IEntity } from '../ecs/ecs-core';
import { SystemMetrics } from '../../types/ecs-types';
import { MapData } from './map-system';

export interface AtlasNode {
  id: string;
  name: string;
  mapId: string;
  tier: number;
  position: { x: number; y: number };
  connections: string[];
  unlocked: boolean;
  completed: boolean;
  bonusObjectives: BonusObjective[];
  requirements: NodeRequirement[];
  rewards: NodeReward[];
}

export interface BonusObjective {
  id: string;
  description: string;
  type: 'time_limit' | 'no_death' | 'kill_specific' | 'use_skill' | 'find_item';
  target?: string;
  value?: number;
  completed: boolean;
  reward: NodeReward;
}

export interface NodeRequirement {
  type: 'completion' | 'level' | 'quest' | 'item';
  target: string;
  value?: number;
}

export interface NodeReward {
  type: 'atlas_points' | 'map_drop' | 'currency' | 'item' | 'skill_point';
  amount: number;
  item?: string;
}

export interface AtlasPassiveNode {
  id: string;
  name: string;
  description: string;
  icon: string;
  position: { x: number; y: number };
  connections: string[];
  allocated: boolean;
  requirements: PassiveRequirement[];
  effects: PassiveEffect[];
  cost: number;
}

export interface PassiveRequirement {
  type: 'points' | 'node' | 'region';
  value: string | number;
}

export interface PassiveEffect {
  type: 'map_quantity' | 'map_rarity' | 'map_packsize' | 'boss_damage' | 
        'drop_chance' | 'experience' | 'movement_speed' | 'map_tier_chance';
  value: number;
  valueType: 'flat' | 'percentage';
  condition?: string;
}

export interface AtlasRegion {
  id: string;
  name: string;
  description: string;
  nodes: string[];
  specialization: RegionSpecialization | null;
  bonuses: RegionBonus[];
  unlocked: boolean;
}

export interface RegionSpecialization {
  type: 'breach' | 'essence' | 'harbinger' | 'abyss' | 'expedition' | 'ritual';
  level: number;
  effects: PassiveEffect[];
}

export interface RegionBonus {
  description: string;
  effect: PassiveEffect;
  requirement: string;
}

export interface AtlasProgression {
  totalPoints: number;
  spentPoints: number;
  availablePoints: number;
  unlockedRegions: string[];
  completedNodes: string[];
  passiveAllocations: string[];
  specializations: Record<string, number>;
}

export class AtlasSystem extends EventEmitter implements ISystem {
  readonly name: string = 'AtlasSystem';
  readonly requiredComponents: readonly string[] = ['Atlas', 'Player'];
  readonly entities: Set<IEntity> = new Set();
  readonly priority: number = 25;
  enabled: boolean = true;

  private atlasNodes: Map<string, AtlasNode> = new Map();
  private passiveNodes: Map<string, AtlasPassiveNode> = new Map();
  private regions: Map<string, AtlasRegion> = new Map();
  private progression: AtlasProgression;

  constructor() {
    super();
    this.progression = {
      totalPoints: 0,
      spentPoints: 0,
      availablePoints: 0,
      unlockedRegions: [],
      completedNodes: [],
      passiveAllocations: [],
      specializations: {}
    };
    
    this.initializeAtlas();
    this.initializePassiveTree();
    this.initializeRegions();
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

    // Update atlas progression state
    this.updateProgression();

    // Process atlas-related entities
    for (const entity of this.entities) {
      this.processAtlasEntity(entity, deltaTime);
    }
  }

  canProcess(entity: IEntity): boolean {
    return entity.hasComponents(this.requiredComponents);
  }

  cleanup(): void {
    this.entities.clear();
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

  // Atlas Node Management
  unlockNode(nodeId: string): boolean {
    const node = this.atlasNodes.get(nodeId);
    if (!node || node.unlocked) {
      return false;
    }

    // Check requirements
    if (!this.checkNodeRequirements(node)) {
      return false;
    }

    node.unlocked = true;
    this.unlockConnectedNodes(node);
    this.emit('nodeUnlocked', { nodeId, node });
    return true;
  }

  completeNode(nodeId: string, bonusObjectives: string[] = []): boolean {
    const node = this.atlasNodes.get(nodeId);
    if (!node || !node.unlocked || node.completed) {
      return false;
    }

    node.completed = true;
    this.progression.completedNodes.push(nodeId);

    // Process bonus objectives
    bonusObjectives.forEach(objectiveId => {
      const objective = node.bonusObjectives.find(obj => obj.id === objectiveId);
      if (objective) {
        objective.completed = true;
        this.grantReward(objective.reward);
      }
    });

    // Grant base rewards
    node.rewards.forEach(reward => this.grantReward(reward));

    this.emit('nodeCompleted', { nodeId, node, bonusObjectives });
    return true;
  }

  // Passive Tree Management
  allocatePassive(nodeId: string): boolean {
    const node = this.passiveNodes.get(nodeId);
    if (!node || node.allocated) {
      return false;
    }

    // Check requirements and points
    if (!this.checkPassiveRequirements(node) || this.progression.availablePoints < node.cost) {
      return false;
    }

    node.allocated = true;
    this.progression.spentPoints += node.cost;
    this.progression.availablePoints -= node.cost;
    this.progression.passiveAllocations.push(nodeId);

    // Apply passive effects
    this.applyPassiveEffects(node.effects);

    this.emit('passiveAllocated', { nodeId, node });
    return true;
  }

  deallocatePassive(nodeId: string): boolean {
    const node = this.passiveNodes.get(nodeId);
    if (!node || !node.allocated) {
      return false;
    }

    // Check if this would break connections to other allocated nodes
    if (!this.canDeallocateNode(nodeId)) {
      return false;
    }

    node.allocated = false;
    this.progression.spentPoints -= node.cost;
    this.progression.availablePoints += node.cost;
    this.progression.passiveAllocations = this.progression.passiveAllocations.filter(id => id !== nodeId);

    // Remove passive effects
    this.removePassiveEffects(node.effects);

    this.emit('passiveDeallocated', { nodeId, node });
    return true;
  }

  // Region Management
  unlockRegion(regionId: string): boolean {
    const region = this.regions.get(regionId);
    if (!region || region.unlocked) {
      return false;
    }

    // Check if enough nodes in region are completed
    const completedNodesInRegion = region.nodes.filter(nodeId => 
      this.progression.completedNodes.includes(nodeId)
    ).length;

    const requiredNodes = Math.ceil(region.nodes.length * 0.6); // 60% completion required
    if (completedNodesInRegion < requiredNodes) {
      return false;
    }

    region.unlocked = true;
    this.progression.unlockedRegions.push(regionId);

    this.emit('regionUnlocked', { regionId, region });
    return true;
  }

  specializeRegion(regionId: string, specializationType: RegionSpecialization['type']): boolean {
    const region = this.regions.get(regionId);
    if (!region || !region.unlocked) {
      return false;
    }

    const currentLevel = this.progression.specializations[`${regionId}_${specializationType}`] || 0;
    const maxLevel = 5;

    if (currentLevel >= maxLevel) {
      return false;
    }

    // Check if player has enough resources (atlas points, specific currency, etc.)
    const cost = this.getSpecializationCost(specializationType, currentLevel + 1);
    if (this.progression.availablePoints < cost) {
      return false;
    }

    // Apply specialization
    region.specialization = {
      type: specializationType,
      level: currentLevel + 1,
      effects: this.getSpecializationEffects(specializationType, currentLevel + 1)
    };

    this.progression.specializations[`${regionId}_${specializationType}`] = currentLevel + 1;
    this.progression.availablePoints -= cost;

    this.emit('regionSpecialized', { regionId, specializationType, level: currentLevel + 1 });
    return true;
  }

  // Atlas Progression Methods
  awardAtlasPoints(amount: number): void {
    this.progression.totalPoints += amount;
    this.progression.availablePoints += amount;
    this.emit('atlasPointsAwarded', { amount, total: this.progression.totalPoints });
  }

  getAtlasProgression(): AtlasProgression {
    return { ...this.progression };
  }

  getNodePath(fromNodeId: string, toNodeId: string): string[] {
    // Implement pathfinding algorithm to find route between nodes
    return this.findShortestPath(fromNodeId, toNodeId);
  }

  getRegionProgress(regionId: string): number {
    const region = this.regions.get(regionId);
    if (!region) return 0;

    const completedNodes = region.nodes.filter(nodeId => 
      this.progression.completedNodes.includes(nodeId)
    ).length;

    return completedNodes / region.nodes.length;
  }

  // Helper Methods
  private checkNodeRequirements(node: AtlasNode): boolean {
    return node.requirements.every(req => {
      switch (req.type) {
        case 'completion':
          return this.progression.completedNodes.includes(req.target);
        case 'level':
          // Check player level (would need player entity)
          return true; // Placeholder
        case 'quest':
          // Check quest completion
          return true; // Placeholder
        case 'item':
          // Check if player has required item
          return true; // Placeholder
        default:
          return false;
      }
    });
  }

  private checkPassiveRequirements(node: AtlasPassiveNode): boolean {
    return node.requirements.every(req => {
      switch (req.type) {
        case 'points':
          return this.progression.availablePoints >= (req.value as number);
        case 'node':
          return this.progression.passiveAllocations.includes(req.value as string);
        case 'region':
          return this.progression.unlockedRegions.includes(req.value as string);
        default:
          return false;
      }
    });
  }

  private unlockConnectedNodes(node: AtlasNode): void {
    node.connections.forEach(connectedNodeId => {
      const connectedNode = this.atlasNodes.get(connectedNodeId);
      if (connectedNode && !connectedNode.unlocked) {
        // Check if this node can be unlocked now
        this.unlockNode(connectedNodeId);
      }
    });
  }

  private canDeallocateNode(nodeId: string): boolean {
    // Check if deallocating this node would isolate other allocated nodes
    const node = this.passiveNodes.get(nodeId);
    if (!node) return false;

    // For now, allow deallocation if no other nodes depend on this one
    // This could be made more sophisticated with proper dependency checking
    return true;
  }

  private grantReward(reward: NodeReward): void {
    switch (reward.type) {
      case 'atlas_points':
        this.awardAtlasPoints(reward.amount);
        break;
      case 'map_drop':
        this.emit('mapDropAwarded', { amount: reward.amount });
        break;
      case 'currency':
        this.emit('currencyAwarded', { amount: reward.amount });
        break;
      case 'item':
        this.emit('itemAwarded', { item: reward.item, amount: reward.amount });
        break;
      case 'skill_point':
        this.emit('skillPointAwarded', { amount: reward.amount });
        break;
    }
  }

  private applyPassiveEffects(effects: PassiveEffect[]): void {
    effects.forEach(effect => {
      this.emit('passiveEffectApplied', { effect });
    });
  }

  private removePassiveEffects(effects: PassiveEffect[]): void {
    effects.forEach(effect => {
      this.emit('passiveEffectRemoved', { effect });
    });
  }

  private getSpecializationCost(type: RegionSpecialization['type'], level: number): number {
    const baseCosts = {
      breach: 10,
      essence: 12,
      harbinger: 15,
      abyss: 8,
      expedition: 18,
      ritual: 14
    };

    return baseCosts[type] * level;
  }

  private getSpecializationEffects(type: RegionSpecialization['type'], level: number): PassiveEffect[] {
    const effectTemplates = {
      breach: [
        { type: 'drop_chance' as const, value: level * 20, valueType: 'percentage' as const, condition: 'breach_encounter' }
      ],
      essence: [
        { type: 'drop_chance' as const, value: level * 25, valueType: 'percentage' as const, condition: 'essence_encounter' }
      ],
      harbinger: [
        { type: 'map_quantity' as const, value: level * 5, valueType: 'percentage' as const, condition: 'harbinger_encounter' }
      ],
      abyss: [
        { type: 'experience' as const, value: level * 10, valueType: 'percentage' as const, condition: 'abyss_encounter' }
      ],
      expedition: [
        { type: 'map_rarity' as const, value: level * 15, valueType: 'percentage' as const, condition: 'expedition_encounter' }
      ],
      ritual: [
        { type: 'map_packsize' as const, value: level * 8, valueType: 'percentage' as const, condition: 'ritual_encounter' }
      ]
    };

    return effectTemplates[type];
  }

  private findShortestPath(fromNodeId: string, toNodeId: string): string[] {
    // Implement Dijkstra's algorithm or A* for pathfinding
    const visited = new Set<string>();
    const queue = [{ nodeId: fromNodeId, path: [fromNodeId] }];

    while (queue.length > 0) {
      const { nodeId, path } = queue.shift()!;

      if (nodeId === toNodeId) {
        return path;
      }

      if (visited.has(nodeId)) {
        continue;
      }

      visited.add(nodeId);

      const node = this.atlasNodes.get(nodeId);
      if (node) {
        node.connections.forEach(connectedId => {
          if (!visited.has(connectedId)) {
            queue.push({
              nodeId: connectedId,
              path: [...path, connectedId]
            });
          }
        });
      }
    }

    return []; // No path found
  }

  private updateProgression(): void {
    // Update atlas progression based on current state
    // This could include checking for newly unlockable regions,
    // updating completion percentages, etc.
  }

  private processAtlasEntity(entity: IEntity, deltaTime: number): void {
    // Process entities that interact with the atlas system
    // This could include updating completion tracking,
    // processing map drops, etc.
  }

  // Initialize Methods
  private initializeAtlas(): void {
    // Initialize the atlas with base nodes
    const baseNodes: Partial<AtlasNode>[] = [
      {
        id: 'start_node',
        name: 'Beginning',
        mapId: 'crypt',
        tier: 1,
        position: { x: 0, y: 0 },
        connections: ['node_1', 'node_2'],
        unlocked: true,
        completed: false,
        bonusObjectives: [],
        requirements: [],
        rewards: [{ type: 'atlas_points', amount: 1 }]
      },
      {
        id: 'node_1',
        name: 'Ancient Ruins',
        mapId: 'ruins',
        tier: 2,
        position: { x: 100, y: 50 },
        connections: ['start_node', 'node_3'],
        unlocked: false,
        completed: false,
        bonusObjectives: [
          {
            id: 'speed_run',
            description: 'Complete in under 5 minutes',
            type: 'time_limit',
            value: 300,
            completed: false,
            reward: { type: 'atlas_points', amount: 2 }
          }
        ],
        requirements: [{ type: 'completion', target: 'start_node' }],
        rewards: [{ type: 'atlas_points', amount: 2 }]
      }
      // Add more nodes...
    ];

    baseNodes.forEach(nodeData => {
      const node: AtlasNode = {
        id: nodeData.id!,
        name: nodeData.name!,
        mapId: nodeData.mapId!,
        tier: nodeData.tier!,
        position: nodeData.position!,
        connections: nodeData.connections!,
        unlocked: nodeData.unlocked!,
        completed: nodeData.completed!,
        bonusObjectives: nodeData.bonusObjectives!,
        requirements: nodeData.requirements!,
        rewards: nodeData.rewards!
      };
      this.atlasNodes.set(node.id, node);
    });
  }

  private initializePassiveTree(): void {
    // Initialize passive skill tree for atlas
    const passiveNodes: Partial<AtlasPassiveNode>[] = [
      {
        id: 'map_quantity_start',
        name: 'Cartographer\'s Fortune',
        description: 'Maps have 10% increased Quantity',
        icon: 'quantity_icon',
        position: { x: 0, y: -50 },
        connections: ['map_quantity_2'],
        allocated: false,
        requirements: [],
        effects: [{ type: 'map_quantity', value: 10, valueType: 'percentage' }],
        cost: 1
      },
      {
        id: 'map_quantity_2',
        name: 'Bounty of Maps',
        description: 'Maps have 15% increased Quantity',
        icon: 'quantity_icon_2',
        position: { x: 0, y: -100 },
        connections: ['map_quantity_start', 'map_rarity_branch'],
        allocated: false,
        requirements: [{ type: 'node', value: 'map_quantity_start' }],
        effects: [{ type: 'map_quantity', value: 15, valueType: 'percentage' }],
        cost: 2
      }
      // Add more passive nodes...
    ];

    passiveNodes.forEach(nodeData => {
      const node: AtlasPassiveNode = {
        id: nodeData.id!,
        name: nodeData.name!,
        description: nodeData.description!,
        icon: nodeData.icon!,
        position: nodeData.position!,
        connections: nodeData.connections!,
        allocated: nodeData.allocated!,
        requirements: nodeData.requirements!,
        effects: nodeData.effects!,
        cost: nodeData.cost!
      };
      this.passiveNodes.set(node.id, node);
    });
  }

  private initializeRegions(): void {
    // Initialize atlas regions
    const regions: Partial<AtlasRegion>[] = [
      {
        id: 'valley_region',
        name: 'Verdant Valley',
        description: 'A lush region filled with natural wonders',
        nodes: ['start_node', 'node_1'],
        specialization: null,
        bonuses: [
          {
            description: 'Nature maps have increased monster pack size',
            effect: { type: 'map_packsize', value: 20, valueType: 'percentage' },
            requirement: 'Complete 5 nature-themed maps'
          }
        ],
        unlocked: true
      },
      {
        id: 'desert_region',
        name: 'Scorching Sands',
        description: 'A harsh desert region with hidden treasures',
        nodes: ['node_2', 'node_3'],
        specialization: null,
        bonuses: [
          {
            description: 'Desert maps have increased item rarity',
            effect: { type: 'map_rarity', value: 30, valueType: 'percentage' },
            requirement: 'Complete 8 desert-themed maps'
          }
        ],
        unlocked: false
      }
      // Add more regions...
    ];

    regions.forEach(regionData => {
      const region: AtlasRegion = {
        id: regionData.id!,
        name: regionData.name!,
        description: regionData.description!,
        nodes: regionData.nodes!,
        specialization: regionData.specialization!,
        bonuses: regionData.bonuses!,
        unlocked: regionData.unlocked!
      };
      this.regions.set(region.id, region);
    });
  }

  // Public API Methods
  getAllNodes(): AtlasNode[] {
    return Array.from(this.atlasNodes.values());
  }

  getNode(nodeId: string): AtlasNode | null {
    return this.atlasNodes.get(nodeId) || null;
  }

  getAllPassiveNodes(): AtlasPassiveNode[] {
    return Array.from(this.passiveNodes.values());
  }

  getPassiveNode(nodeId: string): AtlasPassiveNode | null {
    return this.passiveNodes.get(nodeId) || null;
  }

  getAllRegions(): AtlasRegion[] {
    return Array.from(this.regions.values());
  }

  getRegion(regionId: string): AtlasRegion | null {
    return this.regions.get(regionId) || null;
  }

  getUnlockedNodes(): AtlasNode[] {
    return Array.from(this.atlasNodes.values()).filter(node => node.unlocked);
  }

  getCompletedNodes(): AtlasNode[] {
    return Array.from(this.atlasNodes.values()).filter(node => node.completed);
  }

  getAllocatedPassives(): AtlasPassiveNode[] {
    return Array.from(this.passiveNodes.values()).filter(node => node.allocated);
  }

  resetAtlas(): void {
    // Reset all progress
    this.atlasNodes.forEach(node => {
      node.unlocked = node.id === 'start_node';
      node.completed = false;
      node.bonusObjectives.forEach(obj => obj.completed = false);
    });

    this.passiveNodes.forEach(node => {
      node.allocated = false;
    });

    this.progression = {
      totalPoints: 0,
      spentPoints: 0,
      availablePoints: 0,
      unlockedRegions: ['valley_region'],
      completedNodes: [],
      passiveAllocations: [],
      specializations: {}
    };

    this.emit('atlasReset');
  }
}

export default AtlasSystem;