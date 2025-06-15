// passive-skill-tree.ts - Comprehensive Passive Skill Tree System
import { IComponent, IEntity } from '../../ecs/ecs-core';

export interface StatModifier {
  type: string;
  value: number | boolean;
}

export interface NodePosition {
  x: number;
  y: number;
}

export interface NodeRequirements {
  level?: number;
  attributes?: {
    [key: string]: number;
  };
}

export interface MasteryOption {
  name: string;
  stat: StatModifier;
}

export interface TreeData {
  nodes: Record<string, NodeData>;
  startingNodes: Record<string, string>;
  masteryGroups: Record<string, MasteryOption[]>;
}

export interface NodeData {
  id: string;
  type: NodeType;
  name: string;
  stats: StatModifier[];
  position: NodePosition;
  connections: string[];
  requirements: NodeRequirements;
}

export type NodeType = 'minor' | 'notable' | 'keystone' | 'mastery' | 'ascendancy';

export class SkillNode {
  id: string;
  type: NodeType;
  name: string;
  stats: StatModifier[];
  position: NodePosition;
  connections: string[];
  allocated: boolean;
  requirements: NodeRequirements;
  classStartingNode: boolean;

  constructor(id: string, type: NodeType, name: string, stats: StatModifier[], position: NodePosition, connections: string[] = []) {
    this.id = id;
    this.type = type;
    this.name = name;
    this.stats = stats;
    this.position = position;
    this.connections = connections;
    this.allocated = false;
    this.requirements = {};
    this.classStartingNode = false;
  }

  canAllocate(character: IEntity): boolean {
    if (this.requirements.level && character.getComponent('Level')?.current < this.requirements.level) {
      return false;
    }

    if (this.requirements.attributes) {
      const attrs = character.getComponent('Attributes');
      if (!attrs) return false;
      
      for (const [attr, required] of Object.entries(this.requirements.attributes)) {
        if ((attrs as any)[attr] < required) {
          return false;
        }
      }
    }

    return true;
  }

  getStatModifiers(): Array<StatModifier & { source: string }> {
    return this.stats.map(stat => ({
      type: stat.type,
      value: stat.value,
      source: `Passive: ${this.name}`
    }));
  }
}

export class PassiveSkillTree {
  nodes: Map<string, SkillNode>;
  startingNodes: Map<string, string>;
  masteryGroups: Map<string, MasteryOption[]>;

  constructor() {
    this.nodes = new Map();
    this.startingNodes = new Map();
    this.masteryGroups = new Map();
    this.initializeTree();
  }

  initializeTree(): void {
    this.createClassStartingNodes();
    this.createMinorNodes();
    this.createNotableNodes();
    this.createKeystoneNodes();
    this.createMasteryNodes();
    this.createConnections();
  }

  createClassStartingNodes(): void {
    // Marauder start (Strength - bottom left)
    this.addNode('marauder_start', 'minor', 'Marauder Start', [
      { type: 'strength', value: 5 },
      { type: 'life', value: 10 }
    ], { x: 200, y: 600 }, [], true);

    // Ranger start (Dexterity - bottom right)  
    this.addNode('ranger_start', 'minor', 'Ranger Start', [
      { type: 'dexterity', value: 5 },
      { type: 'life', value: 10 }
    ], { x: 600, y: 600 }, [], true);

    // Witch start (Intelligence - top)
    this.addNode('witch_start', 'minor', 'Witch Start', [
      { type: 'intelligence', value: 5 },
      { type: 'mana', value: 10 }
    ], { x: 400, y: 100 }, [], true);

    // Duelist start (Str/Dex hybrid - bottom center)
    this.addNode('duelist_start', 'minor', 'Duelist Start', [
      { type: 'strength', value: 3 },
      { type: 'dexterity', value: 3 },
      { type: 'life', value: 8 }
    ], { x: 400, y: 550 }, [], true);

    // Templar start (Str/Int hybrid - left center)
    this.addNode('templar_start', 'minor', 'Templar Start', [
      { type: 'strength', value: 3 },
      { type: 'intelligence', value: 3 },
      { type: 'mana', value: 8 }
    ], { x: 300, y: 350 }, [], true);

    // Shadow start (Dex/Int hybrid - right center)
    this.addNode('shadow_start', 'minor', 'Shadow Start', [
      { type: 'dexterity', value: 3 },
      { type: 'intelligence', value: 3 },
      { type: 'energy_shield', value: 5 }
    ], { x: 500, y: 350 }, [], true);

    // Scion start (center - access to all)
    this.addNode('scion_start', 'minor', 'Scion Start', [
      { type: 'strength', value: 2 },
      { type: 'dexterity', value: 2 },
      { type: 'intelligence', value: 2 }
    ], { x: 400, y: 350 }, [], true);

    // Map starting nodes to classes
    this.startingNodes.set('Marauder', 'marauder_start');
    this.startingNodes.set('Ranger', 'ranger_start');
    this.startingNodes.set('Witch', 'witch_start');
    this.startingNodes.set('Duelist', 'duelist_start');
    this.startingNodes.set('Templar', 'templar_start');
    this.startingNodes.set('Shadow', 'shadow_start');
    this.startingNodes.set('Scion', 'scion_start');
  }

  createMinorNodes(): void {
    // Strength area minor nodes
    this.addNode('str_minor_1', 'minor', '+10 to Strength', [
      { type: 'strength', value: 10 }
    ], { x: 180, y: 580 });

    this.addNode('str_minor_2', 'minor', '8% increased Melee Damage', [
      { type: 'melee_damage_inc', value: 8 }
    ], { x: 160, y: 560 });

    this.addNode('str_minor_3', 'minor', '6% increased Life', [
      { type: 'life_inc', value: 6 }
    ], { x: 220, y: 580 });

    // Dexterity area minor nodes
    this.addNode('dex_minor_1', 'minor', '+10 to Dexterity', [
      { type: 'dexterity', value: 10 }
    ], { x: 620, y: 580 });

    this.addNode('dex_minor_2', 'minor', '8% increased Attack Speed', [
      { type: 'attack_speed_inc', value: 8 }
    ], { x: 640, y: 560 });

    this.addNode('dex_minor_3', 'minor', '8% increased Movement Speed', [
      { type: 'movement_speed_inc', value: 8 }
    ], { x: 580, y: 580 });

    // Intelligence area minor nodes
    this.addNode('int_minor_1', 'minor', '+10 to Intelligence', [
      { type: 'intelligence', value: 10 }
    ], { x: 380, y: 120 });

    this.addNode('int_minor_2', 'minor', '10% increased Spell Damage', [
      { type: 'spell_damage_inc', value: 10 }
    ], { x: 420, y: 120 });

    this.addNode('int_minor_3', 'minor', '6% increased Mana', [
      { type: 'mana_inc', value: 6 }
    ], { x: 400, y: 140 });

    // Life cluster minor nodes
    this.addNode('life_minor_1', 'minor', '8% increased Life', [
      { type: 'life_inc', value: 8 }
    ], { x: 350, y: 400 });

    this.addNode('life_minor_2', 'minor', '5% increased Life', [
      { type: 'life_inc', value: 5 }
    ], { x: 370, y: 420 });

    this.generateMinorNodeGrid();
  }

  generateMinorNodeGrid(): void {
    const nodeTypes = [
      { name: '+5 to Strength', stats: [{ type: 'strength', value: 5 }] },
      { name: '+5 to Dexterity', stats: [{ type: 'dexterity', value: 5 }] },
      { name: '+5 to Intelligence', stats: [{ type: 'intelligence', value: 5 }] },
      { name: '4% increased Life', stats: [{ type: 'life_inc', value: 4 }] },
      { name: '6% increased Mana', stats: [{ type: 'mana_inc', value: 6 }] },
      { name: '4% increased Damage', stats: [{ type: 'damage_inc', value: 4 }] },
      { name: '3% increased Attack Speed', stats: [{ type: 'attack_speed_inc', value: 3 }] },
      { name: '3% increased Cast Speed', stats: [{ type: 'cast_speed_inc', value: 3 }] }
    ];

    const gridNodes: Array<{ id: string; x: number; y: number }> = [];
    let nodeCounter = 1;
    
    // First pass: create all grid nodes
    for (let x = 150; x <= 650; x += 40) {
      for (let y = 150; y <= 550; y += 40) {
        if (this.isPositionOccupied(x, y, 30)) continue;

        const nodeType = nodeTypes[nodeCounter % nodeTypes.length];
        const nodeId = `minor_grid_${nodeCounter}`;
        this.addNode(nodeId, 'minor', nodeType.name, nodeType.stats, { x, y });
        gridNodes.push({ id: nodeId, x, y });
        nodeCounter++;

        if (nodeCounter > 1000) break;
      }
      if (nodeCounter > 1000) break;
    }
    
    // Second pass: connect grid nodes to nearby nodes
    for (const gridNode of gridNodes) {
      this.connectGridNodeToNearby(gridNode.id, gridNode.x, gridNode.y);
    }
  }
  
  connectGridNodeToNearby(nodeId: string, x: number, y: number): void {
    const maxDistance = 60;
    const nearbyNodes: Array<{ id: string; distance: number }> = [];
    
    for (const [otherId, otherNode] of this.nodes.entries()) {
      if (otherId === nodeId) continue;
      
      const distance = Math.sqrt(
        Math.pow(otherNode.position.x - x, 2) + Math.pow(otherNode.position.y - y, 2)
      );
      
      if (distance <= maxDistance) {
        nearbyNodes.push({ id: otherId, distance });
      }
    }
    
    nearbyNodes.sort((a, b) => a.distance - b.distance);
    const connectionsToMake = Math.min(3, nearbyNodes.length);
    
    for (let i = 0; i < connectionsToMake; i++) {
      this.connectNodes(nodeId, [nearbyNodes[i].id]);
    }
  }

  createNotableNodes(): void {
    this.addNode('iron_grip', 'notable', 'Iron Grip', [
      { type: 'strength', value: 20 },
      { type: 'projectile_attack_damage_inc', value: 15 },
      { type: 'melee_damage_inc', value: 15 }
    ], { x: 250, y: 500 });

    this.addNode('thick_skin', 'notable', 'Thick Skin', [
      { type: 'life_inc', value: 20 },
      { type: 'physical_damage_reduction', value: 4 }
    ], { x: 300, y: 480 });

    this.addNode('elemental_adaptation', 'notable', 'Elemental Adaptation', [
      { type: 'fire_resistance', value: 15 },
      { type: 'cold_resistance', value: 15 },
      { type: 'lightning_resistance', value: 15 }
    ], { x: 400, y: 200 });

    this.addNode('coordination', 'notable', 'Coordination', [
      { type: 'dexterity', value: 20 },
      { type: 'attack_speed_inc', value: 12 },
      { type: 'movement_speed_inc', value: 6 }
    ], { x: 550, y: 500 });

    this.addNode('mental_rapidity', 'notable', 'Mental Rapidity', [
      { type: 'intelligence', value: 20 },
      { type: 'cast_speed_inc', value: 12 },
      { type: 'mana_regeneration_inc', value: 25 }
    ], { x: 450, y: 200 });

    this.addNode('blood_magic', 'notable', 'Blood Magic', [
      { type: 'life_inc', value: 15 },
      { type: 'spend_life_instead_of_mana', value: true }
    ], { x: 200, y: 450 });
  }

  createKeystoneNodes(): void {
    this.addNode('chaos_inoculation', 'keystone', 'Chaos Inoculation', [
      { type: 'maximum_life', value: 1 },
      { type: 'chaos_damage_immunity', value: true },
      { type: 'energy_shield_inc', value: 15 }
    ], { x: 400, y: 250 });

    this.addNode('resolute_technique', 'keystone', 'Resolute Technique', [
      { type: 'cannot_deal_critical_strikes', value: true },
      { type: 'never_miss', value: true }
    ], { x: 150, y: 400 });

    this.addNode('elemental_overload', 'keystone', 'Elemental Overload', [
      { type: 'critical_strikes_deal_no_extra_damage', value: true },
      { type: 'elemental_damage_inc_if_crit_recently', value: 40 }
    ], { x: 350, y: 150 });

    this.addNode('acrobatics', 'keystone', 'Acrobatics', [
      { type: 'dodge_chance', value: 30 },
      { type: 'armour_and_energy_shield_inc', value: -50 }
    ], { x: 550, y: 450 });

    this.addNode('eldritch_battery', 'keystone', 'Eldritch Battery', [
      { type: 'energy_shield_protects_mana', value: true },
      { type: 'energy_shield_recharge_rate_inc', value: 50 }
    ], { x: 450, y: 300 });
  }

  createMasteryNodes(): void {
    this.addNode('life_mastery', 'mastery', 'Life Mastery', [], { x: 350, y: 450 });
    this.addNode('damage_mastery', 'mastery', 'Damage Mastery', [], { x: 400, y: 300 });
    this.addNode('elemental_mastery', 'mastery', 'Elemental Mastery', [], { x: 450, y: 250 });

    this.masteryGroups.set('life_mastery', [
      { name: 'Skills Cost Life instead of Mana', stat: { type: 'spend_life_instead_of_mana', value: true } },
      { name: '15% increased Life Recovery Rate', stat: { type: 'life_recovery_rate_inc', value: 15 } },
      { name: '+50 to maximum Life', stat: { type: 'life', value: 50 } },
      { name: 'Regenerate 1% of Life per second', stat: { type: 'life_regeneration_per_second', value: 1 } }
    ]);

    this.masteryGroups.set('damage_mastery', [
      { name: '40% increased Damage if you haven\'t been Hit Recently', stat: { type: 'damage_inc_if_not_hit_recently', value: 40 } },
      { name: 'Penetrate 8% Resistances', stat: { type: 'penetration', value: 8 } },
      { name: '20% chance to Intimidate Enemies on Hit', stat: { type: 'intimidate_chance', value: 20 } },
      { name: 'Non-Damaging Ailments have double Effect', stat: { type: 'ailment_effect_inc', value: 100 } }
    ]);
  }

  createConnections(): void {
    this.connectNodes('marauder_start', ['str_minor_1', 'str_minor_3']);
    this.connectNodes('str_minor_1', ['str_minor_2', 'iron_grip']);
    this.connectNodes('iron_grip', ['thick_skin']);

    this.connectNodes('ranger_start', ['dex_minor_1', 'dex_minor_3']);
    this.connectNodes('dex_minor_1', ['dex_minor_2', 'coordination']);

    this.connectNodes('witch_start', ['int_minor_1', 'int_minor_2']);
    this.connectNodes('int_minor_1', ['mental_rapidity']);
    this.connectNodes('int_minor_2', ['elemental_adaptation']);

    this.connectNodes('scion_start', ['life_minor_1', 'templar_start', 'shadow_start']);
    this.connectNodes('life_minor_1', ['life_minor_2', 'life_mastery']);

    this.createPathBetweenClasses();
    this.ensureNotableConnections();
    this.ensureKeystoneConnections();
    this.ensureMasteryConnections();
  }
  
  ensureNotableConnections(): void {
    const notableNodes = ['iron_grip', 'thick_skin', 'elemental_adaptation', 'coordination', 'mental_rapidity', 'blood_magic'];
    
    for (const nodeId of notableNodes) {
      const node = this.nodes.get(nodeId);
      if (node && node.connections.length === 0) {
        this.connectToNearestNodes(nodeId, node.position.x, node.position.y, 2);
      }
    }
  }
  
  ensureKeystoneConnections(): void {
    const keystoneNodes = ['chaos_inoculation', 'resolute_technique', 'elemental_overload', 'acrobatics', 'eldritch_battery'];
    
    for (const nodeId of keystoneNodes) {
      const node = this.nodes.get(nodeId);
      if (node && node.connections.length === 0) {
        this.connectToNearestNodes(nodeId, node.position.x, node.position.y, 1);
      }
    }
  }
  
  ensureMasteryConnections(): void {
    const masteryNodes = ['life_mastery', 'damage_mastery', 'elemental_mastery'];
    
    for (const nodeId of masteryNodes) {
      const node = this.nodes.get(nodeId);
      if (node && node.connections.length === 0) {
        this.connectToNearestNodes(nodeId, node.position.x, node.position.y, 1);
      }
    }
  }
  
  connectToNearestNodes(nodeId: string, x: number, y: number, maxConnections: number = 2): void {
    const nearbyNodes: Array<{ id: string; distance: number }> = [];
    
    for (const [otherId, otherNode] of this.nodes.entries()) {
      if (otherId === nodeId) continue;
      
      const distance = Math.sqrt(
        Math.pow(otherNode.position.x - x, 2) + Math.pow(otherNode.position.y - y, 2)
      );
      
      if (distance <= 80) {
        nearbyNodes.push({ id: otherId, distance });
      }
    }
    
    nearbyNodes.sort((a, b) => a.distance - b.distance);
    const connectionsToMake = Math.min(maxConnections, nearbyNodes.length);
    
    for (let i = 0; i < connectionsToMake; i++) {
      this.connectNodes(nodeId, [nearbyNodes[i].id]);
    }
  }

  createPathBetweenClasses(): void {
    this.addNode('path_str_to_center', 'minor', '5% increased Life', [
      { type: 'life_inc', value: 5 }
    ], { x: 300, y: 500 });

    this.connectNodes('thick_skin', ['path_str_to_center']);
    this.connectNodes('path_str_to_center', ['life_minor_1']);
  }

  addNode(id: string, type: NodeType, name: string, stats: StatModifier[], position: NodePosition, connections: string[] = [], isStarting: boolean = false): void {
    const node = new SkillNode(id, type, name, stats, position, connections);
    node.classStartingNode = isStarting;
    this.nodes.set(id, node);
  }

  connectNodes(nodeId1: string, nodeIds: string[]): void {
    const node1 = this.nodes.get(nodeId1);
    if (!node1) return;

    for (const nodeId2 of nodeIds) {
      const node2 = this.nodes.get(nodeId2);
      if (!node2) continue;

      if (!node1.connections.includes(nodeId2)) {
        node1.connections.push(nodeId2);
      }
      if (!node2.connections.includes(nodeId1)) {
        node2.connections.push(nodeId1);
      }
    }
  }

  isPositionOccupied(x: number, y: number, radius: number = 20): boolean {
    for (const node of this.nodes.values()) {
      const distance = Math.sqrt(
        Math.pow(node.position.x - x, 2) + Math.pow(node.position.y - y, 2)
      );
      if (distance < radius) return true;
    }
    return false;
  }

  canAllocateNode(nodeId: string, allocatedNodes: Set<string>, startingNodeId: string): boolean {
    const node = this.nodes.get(nodeId);
    if (!node || allocatedNodes.has(nodeId)) return false;

    if (nodeId === startingNodeId && !allocatedNodes.has(startingNodeId)) {
      return true;
    }

    return node.connections.some(connectedId => allocatedNodes.has(connectedId));
  }

  allocateNode(nodeId: string, skillTree: any): boolean {
    if (skillTree.availablePoints <= 0) return false;
    
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    const startingNodeId = this.getStartingNodeForClass(skillTree.entity);
    if (!this.canAllocateNode(nodeId, skillTree.allocatedNodes, startingNodeId)) {
      return false;
    }

    skillTree.allocatedNodes.add(nodeId);
    skillTree.availablePoints--;
    node.allocated = true;

    return true;
  }

  getStartingNodeForClass(entity: IEntity): string {
    const characterClass = entity.getComponent('CharacterClass');
    return this.startingNodes.get(characterClass?.name) || '';
  }

  getNode(nodeId: string): SkillNode | undefined {
    return this.nodes.get(nodeId);
  }

  getAllNodes(): SkillNode[] {
    return Array.from(this.nodes.values());
  }

  getConnectedNodes(nodeId: string): SkillNode[] {
    const node = this.nodes.get(nodeId);
    if (!node) return [];
    
    return node.connections.map(id => this.nodes.get(id)).filter(Boolean) as SkillNode[];
  }

  calculateTotalStats(allocatedNodeIds: Set<string>): Map<string, number> {
    const totalStats = new Map<string, number>();

    for (const nodeId of allocatedNodeIds) {
      const node = this.nodes.get(nodeId);
      if (!node) continue;

      for (const stat of node.stats) {
        if (typeof stat.value === 'number') {
          const current = totalStats.get(stat.type) || 0;
          totalStats.set(stat.type, current + stat.value);
        }
      }
    }

    return totalStats;
  }

  searchNodes(query: string): SkillNode[] {
    const results: SkillNode[] = [];
    const lowerQuery = query.toLowerCase();

    for (const node of this.nodes.values()) {
      if (node.name.toLowerCase().includes(lowerQuery)) {
        results.push(node);
        continue;
      }

      for (const stat of node.stats) {
        if (stat.type.toLowerCase().includes(lowerQuery)) {
          results.push(node);
          break;
        }
      }
    }

    return results;
  }

  exportTree(): TreeData {
    const treeData: TreeData = {
      nodes: {},
      startingNodes: Object.fromEntries(this.startingNodes),
      masteryGroups: Object.fromEntries(this.masteryGroups)
    };

    for (const [id, node] of this.nodes) {
      treeData.nodes[id] = {
        id: node.id,
        type: node.type,
        name: node.name,
        stats: node.stats,
        position: node.position,
        connections: node.connections,
        requirements: node.requirements
      };
    }

    return treeData;
  }

  importTree(treeData: TreeData): void {
    this.nodes.clear();
    this.startingNodes.clear();
    this.masteryGroups.clear();

    for (const [id, nodeData] of Object.entries(treeData.nodes)) {
      const node = new SkillNode(
        nodeData.id,
        nodeData.type,
        nodeData.name,
        nodeData.stats,
        nodeData.position,
        nodeData.connections
      );
      node.requirements = nodeData.requirements || {};
      this.nodes.set(id, node);
    }

    this.startingNodes = new Map(Object.entries(treeData.startingNodes));
    this.masteryGroups = new Map(Object.entries(treeData.masteryGroups));
  }
}

export default PassiveSkillTree;