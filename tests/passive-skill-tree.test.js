// Passive Skill Tree System Tests
// Test-driven development for skill tree functionality

const { SkillNode, PassiveSkillTree } = require('../game-core/character/skills/passive-skill-tree');
const { Entity, Component, System, World } = require('../game-core/ecs/ecs-core');
const { CharacterClass, SkillTree, Attributes, Level } = require('../game-core/components/ecs-components');

describe('Passive Skill Tree System', () => {
  let skillTree;
  let world;
  let testEntity;

  beforeEach(() => {
    skillTree = new PassiveSkillTree();
    world = new World();
    testEntity = world.createEntity();
    testEntity.addComponent(new CharacterClass('Marauder', 'strength', null));
    testEntity.addComponent(new SkillTree());
    testEntity.addComponent(new Attributes(23, 14, 14));
    testEntity.addComponent(new Level(1));
  });

  describe('SkillNode', () => {
    test('should create skill node with properties', () => {
      const node = new SkillNode(
        'test_node',
        'minor',
        'Test Node',
        [{ type: 'strength', value: 10 }],
        { x: 100, y: 200 },
        ['connected_node']
      );

      expect(node.id).toBe('test_node');
      expect(node.type).toBe('minor');
      expect(node.name).toBe('Test Node');
      expect(node.stats).toHaveLength(1);
      expect(node.position.x).toBe(100);
      expect(node.connections).toContain('connected_node');
      expect(node.allocated).toBe(false);
    });

    test('should check allocation requirements', () => {
      const node = new SkillNode('req_node', 'notable', 'Requirement Node', [], { x: 0, y: 0 });
      node.requirements = {
        level: 15,
        attributes: { strength: 30 }
      };

      const lowLevelEntity = world.createEntity();
      lowLevelEntity.addComponent(new Level(10));
      lowLevelEntity.addComponent(new Attributes(25, 14, 14));

      const highLevelEntity = world.createEntity();
      highLevelEntity.addComponent(new Level(20));
      highLevelEntity.addComponent(new Attributes(35, 14, 14));

      expect(node.canAllocate(lowLevelEntity)).toBe(false);
      expect(node.canAllocate(highLevelEntity)).toBe(true);
    });

    test('should return stat modifiers correctly', () => {
      const node = new SkillNode('stat_node', 'minor', 'Stat Node', [
        { type: 'strength', value: 10 },
        { type: 'life_inc', value: 8 }
      ], { x: 0, y: 0 });

      const modifiers = node.getStatModifiers();
      expect(modifiers).toHaveLength(2);
      expect(modifiers[0]).toEqual({
        type: 'strength',
        value: 10,
        source: 'Passive: Stat Node'
      });
    });
  });

  describe('PassiveSkillTree Creation', () => {
    test('should initialize with all class starting nodes', () => {
      expect(skillTree.nodes.size).toBeGreaterThan(50); // Should have many nodes
      
      const marauderStart = skillTree.getNode('marauder_start');
      const rangerStart = skillTree.getNode('ranger_start');
      const witchStart = skillTree.getNode('witch_start');

      expect(marauderStart).toBeDefined();
      expect(rangerStart).toBeDefined();
      expect(witchStart).toBeDefined();
      
      expect(marauderStart.classStartingNode).toBe(true);
      expect(marauderStart.stats[0].type).toBe('strength');
    });

    test('should have different node types', () => {
      const allNodes = skillTree.getAllNodes();
      
      const minorNodes = allNodes.filter(n => n.type === 'minor');
      const notableNodes = allNodes.filter(n => n.type === 'notable');
      const keystoneNodes = allNodes.filter(n => n.type === 'keystone');
      const masteryNodes = allNodes.filter(n => n.type === 'mastery');

      expect(minorNodes.length).toBeGreaterThan(10);
      expect(notableNodes.length).toBeGreaterThan(3);
      expect(keystoneNodes.length).toBeGreaterThan(3);
      expect(masteryNodes.length).toBeGreaterThan(1);
    });

    test('should have starting nodes mapped to classes', () => {
      expect(skillTree.startingNodes.get('Marauder')).toBe('marauder_start');
      expect(skillTree.startingNodes.get('Ranger')).toBe('ranger_start');
      expect(skillTree.startingNodes.get('Witch')).toBe('witch_start');
      expect(skillTree.startingNodes.get('Duelist')).toBe('duelist_start');
      expect(skillTree.startingNodes.get('Templar')).toBe('templar_start');
      expect(skillTree.startingNodes.get('Shadow')).toBe('shadow_start');
      expect(skillTree.startingNodes.get('Scion')).toBe('scion_start');
    });

    test('should have connected nodes', () => {
      const marauderStart = skillTree.getNode('marauder_start');
      expect(marauderStart.connections.length).toBeGreaterThan(0);

      const connectedNodes = skillTree.getConnectedNodes('marauder_start');
      expect(connectedNodes.length).toBeGreaterThan(0);
      expect(connectedNodes[0]).toBeInstanceOf(SkillNode);
    });
  });

  describe('Node Allocation', () => {
    test('should allow allocating starting node', () => {
      const entitySkillTree = testEntity.getComponent('SkillTree');
      entitySkillTree.availablePoints = 1;

      const result = skillTree.allocateNode('marauder_start', entitySkillTree);
      
      expect(result).toBe(true);
      expect(entitySkillTree.allocatedNodes.has('marauder_start')).toBe(true);
      expect(entitySkillTree.availablePoints).toBe(0);
    });

    test('should not allow allocating disconnected nodes', () => {
      const entitySkillTree = testEntity.getComponent('SkillTree');
      entitySkillTree.availablePoints = 1;

      // Try to allocate a node not connected to starting area
      const result = skillTree.allocateNode('witch_start', entitySkillTree);
      
      expect(result).toBe(false);
      expect(entitySkillTree.allocatedNodes.has('witch_start')).toBe(false);
      expect(entitySkillTree.availablePoints).toBe(1);
    });

    test('should allow allocating connected nodes after starting node', () => {
      const entitySkillTree = testEntity.getComponent('SkillTree');
      entitySkillTree.availablePoints = 2;

      // First allocate starting node
      skillTree.allocateNode('marauder_start', entitySkillTree);
      
      // Then allocate a connected node
      const marauderStart = skillTree.getNode('marauder_start');
      const firstConnection = marauderStart.connections[0];
      
      const result = skillTree.allocateNode(firstConnection, entitySkillTree);
      expect(result).toBe(true);
      expect(entitySkillTree.allocatedNodes.has(firstConnection)).toBe(true);
    });

    test('should not allow allocation without skill points', () => {
      const entitySkillTree = testEntity.getComponent('SkillTree');
      entitySkillTree.availablePoints = 0;

      const result = skillTree.allocateNode('marauder_start', entitySkillTree);
      
      expect(result).toBe(false);
      expect(entitySkillTree.allocatedNodes.has('marauder_start')).toBe(false);
    });

    test('should check if node can be allocated', () => {
      const entitySkillTree = testEntity.getComponent('SkillTree');
      
      // Starting node should be allocatable
      expect(skillTree.canAllocateNode('marauder_start', entitySkillTree.allocatedNodes, 'marauder_start')).toBe(true);
      
      // Random node should not be allocatable without connection
      expect(skillTree.canAllocateNode('witch_start', entitySkillTree.allocatedNodes, 'marauder_start')).toBe(false);
      
      // After allocating starting node, connected nodes should be allocatable
      entitySkillTree.allocatedNodes.add('marauder_start');
      const marauderStart = skillTree.getNode('marauder_start');
      const connectedNode = marauderStart.connections[0];
      
      expect(skillTree.canAllocateNode(connectedNode, entitySkillTree.allocatedNodes, 'marauder_start')).toBe(true);
    });
  });

  describe('Keystone Nodes', () => {
    test('should have chaos inoculation keystone', () => {
      const ciNode = skillTree.getNode('chaos_inoculation');
      
      expect(ciNode).toBeDefined();
      expect(ciNode.type).toBe('keystone');
      expect(ciNode.name).toBe('Chaos Inoculation');
      
      const maxLifeStat = ciNode.stats.find(s => s.type === 'maximum_life');
      const immuneStat = ciNode.stats.find(s => s.type === 'chaos_damage_immunity');
      
      expect(maxLifeStat.value).toBe(1);
      expect(immuneStat.value).toBe(true);
    });

    test('should have resolute technique keystone', () => {
      const rtNode = skillTree.getNode('resolute_technique');
      
      expect(rtNode).toBeDefined();
      expect(rtNode.type).toBe('keystone');
      expect(rtNode.name).toBe('Resolute Technique');
      
      const noCritStat = rtNode.stats.find(s => s.type === 'cannot_deal_critical_strikes');
      const neverMissStat = rtNode.stats.find(s => s.type === 'never_miss');
      
      expect(noCritStat.value).toBe(true);
      expect(neverMissStat.value).toBe(true);
    });
  });

  describe('Mastery System', () => {
    test('should have mastery nodes defined', () => {
      const lifeMastery = skillTree.getNode('life_mastery');
      const damageMastery = skillTree.getNode('damage_mastery');
      
      expect(lifeMastery).toBeDefined();
      expect(damageMastery).toBeDefined();
      expect(lifeMastery.type).toBe('mastery');
      expect(damageMastery.type).toBe('mastery');
    });

    test('should have mastery groups with options', () => {
      const lifeMasteryOptions = skillTree.masteryGroups.get('life_mastery');
      const damageMasteryOptions = skillTree.masteryGroups.get('damage_mastery');
      
      expect(lifeMasteryOptions).toBeDefined();
      expect(damageMasteryOptions).toBeDefined();
      expect(lifeMasteryOptions.length).toBeGreaterThan(2);
      expect(damageMasteryOptions.length).toBeGreaterThan(2);
      
      expect(lifeMasteryOptions[0]).toHaveProperty('name');
      expect(lifeMasteryOptions[0]).toHaveProperty('stat');
    });
  });

  describe('Stat Calculation', () => {
    test('should calculate total stats from allocated nodes', () => {
      const allocatedNodes = new Set(['marauder_start', 'str_minor_1']);
      const totalStats = skillTree.calculateTotalStats(allocatedNodes);
      
      expect(totalStats.get('strength')).toBeGreaterThan(10); // 5 from start + 10 from minor
      expect(totalStats.get('life')).toBe(10); // From starting node
    });

    test('should handle empty allocation', () => {
      const totalStats = skillTree.calculateTotalStats(new Set());
      expect(totalStats.size).toBe(0);
    });

    test('should accumulate same stat types', () => {
      // Create test nodes with overlapping stats
      skillTree.addNode('test_str_1', 'minor', 'Test Str 1', [{ type: 'strength', value: 5 }], { x: 0, y: 0 });
      skillTree.addNode('test_str_2', 'minor', 'Test Str 2', [{ type: 'strength', value: 8 }], { x: 20, y: 0 });
      
      const allocatedNodes = new Set(['test_str_1', 'test_str_2']);
      const totalStats = skillTree.calculateTotalStats(allocatedNodes);
      
      expect(totalStats.get('strength')).toBe(13); // 5 + 8
    });
  });

  describe('Search and Utility', () => {
    test('should search nodes by name', () => {
      const results = skillTree.searchNodes('Iron Grip');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toBe('Iron Grip');
    });

    test('should search nodes by stat type', () => {
      const results = skillTree.searchNodes('strength');
      expect(results.length).toBeGreaterThan(3);
      
      // Should find nodes that have strength stats
      const hasStrengthStat = results.some(node => 
        node.stats.some(stat => stat.type === 'strength')
      );
      expect(hasStrengthStat).toBe(true);
    });

    test('should return empty array for no matches', () => {
      const results = skillTree.searchNodes('nonexistent');
      expect(results).toEqual([]);
    });

    test('should get starting node for character class', () => {
      const startingNode = skillTree.getStartingNodeForClass(testEntity);
      expect(startingNode).toBe('marauder_start');
    });
  });

  describe('Tree Export/Import', () => {
    test('should export tree data', () => {
      const exportedData = skillTree.exportTree();
      
      expect(exportedData).toHaveProperty('nodes');
      expect(exportedData).toHaveProperty('startingNodes');
      expect(exportedData).toHaveProperty('masteryGroups');
      
      expect(Object.keys(exportedData.nodes).length).toBeGreaterThan(50);
      expect(exportedData.startingNodes.Marauder).toBe('marauder_start');
    });

    test('should import tree data correctly', () => {
      const originalData = skillTree.exportTree();
      const newTree = new PassiveSkillTree();
      
      // Clear the new tree and import
      newTree.nodes.clear();
      newTree.importTree(originalData);
      
      expect(newTree.nodes.size).toBe(skillTree.nodes.size);
      expect(newTree.startingNodes.get('Marauder')).toBe('marauder_start');
      
      const importedNode = newTree.getNode('marauder_start');
      const originalNode = skillTree.getNode('marauder_start');
      
      expect(importedNode.name).toBe(originalNode.name);
      expect(importedNode.type).toBe(originalNode.type);
    });
  });

  describe('Integration Tests', () => {
    test('should work with character progression', () => {
      const entitySkillTree = testEntity.getComponent('SkillTree');
      entitySkillTree.availablePoints = 5;

      // Allocate a path through the tree
      expect(skillTree.allocateNode('marauder_start', entitySkillTree)).toBe(true);
      
      const marauderStart = skillTree.getNode('marauder_start');
      const firstConnection = marauderStart.connections[0];
      expect(skillTree.allocateNode(firstConnection, entitySkillTree)).toBe(true);

      expect(entitySkillTree.allocatedNodes.size).toBe(2);
      expect(entitySkillTree.availablePoints).toBe(3);
    });

    test('should validate tree connectivity', () => {
      // Every non-starting node should be reachable from at least one starting node
      const allNodes = skillTree.getAllNodes();
      const startingNodeIds = Array.from(skillTree.startingNodes.values());
      
      for (const node of allNodes) {
        if (startingNodeIds.includes(node.id)) continue;
        
        // Node should either have connections or be part of generated grid
        expect(node.connections.length > 0 || node.id.includes('minor_grid')).toBe(true);
      }
    });

    test('should have reasonable tree size', () => {
      const totalNodes = skillTree.nodes.size;
      expect(totalNodes).toBeGreaterThan(100); // Should have substantial tree
      expect(totalNodes).toBeLessThan(2000); // But not excessive for testing
    });
  });
});