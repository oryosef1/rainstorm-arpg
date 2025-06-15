/**
 * Level Progression ECS System Tests
 * Comprehensive test suite for the level progression ECS integration
 */

const { LevelProgressionSystem } = require('./level-progression-system');
const { createMockEntity, createMockWorld } = require('../test-utils/mock-ecs');

describe('LevelProgressionSystem', () => {
  let system;
  let mockWorld;
  let mockEntity;

  beforeEach(() => {
    system = new LevelProgressionSystem();
    mockWorld = createMockWorld();
    mockEntity = createMockEntity();
    
    system.setWorld(mockWorld);
  });

  describe('System Initialization', () => {
    test('should initialize with correct properties', () => {
      expect(system.name).toBe('LevelProgressionSystem');
      expect(system.requiredComponents).toContain('Character');
      expect(system.requiredComponents).toContain('Experience');
      expect(system.requiredComponents).toContain('Player');
      expect(system.priority).toBe(20);
      expect(system.enabled).toBe(true);
    });

    test('should start with empty entity set', () => {
      const metrics = system.getMetrics();
      expect(metrics.entityCount).toBe(0);
    });

    test('should have initialized progression manager', () => {
      expect(system.progressionManager).toBeDefined();
    });
  });

  describe('Entity Management', () => {
    test('should add entities with required components', () => {
      mockEntity.addComponent('Player', { id: 'test_player_1', name: 'Test Player' });
      mockEntity.addComponent('Character', { 
        level: 1, 
        class: 'marauder',
        attributes: { strength: 23, dexterity: 14, intelligence: 14 }
      });
      mockEntity.addComponent('Experience', { total: 0, current: 0 });
      
      system.addEntity(mockEntity);
      
      const metrics = system.getMetrics();
      expect(metrics.entityCount).toBe(1);
    });

    test('should not add entities missing required components', () => {
      mockEntity.addComponent('Player', { id: 'test_player_1', name: 'Test Player' });
      mockEntity.addComponent('Character', { level: 1, class: 'marauder' });
      // Missing Experience component
      
      system.addEntity(mockEntity);
      
      const metrics = system.getMetrics();
      expect(metrics.entityCount).toBe(0);
    });

    test('should initialize experience component on entity addition', () => {
      mockEntity.addComponent('Player', { id: 'test_player_1', name: 'Test Player' });
      mockEntity.addComponent('Character', { level: 1, class: 'marauder' });
      mockEntity.addComponent('Experience', { total: 0, current: 0 });
      
      system.addEntity(mockEntity);
      
      const experience = mockEntity.getComponent('Experience');
      expect(experience.initialized).toBe(true);
      expect(experience.toNextLevel).toBeGreaterThan(0);
      expect(experience.lastLevelUp).toBeDefined();
      
      // Should add SkillPoints component
      const skillPoints = mockEntity.getComponent('SkillPoints');
      expect(skillPoints).toBeTruthy();
      expect(skillPoints.available).toBeGreaterThan(0);
    });

    test('should remove entities correctly', () => {
      mockEntity.addComponent('Player', { id: 'test_player_1', name: 'Test Player' });
      mockEntity.addComponent('Character', { level: 1, class: 'marauder' });
      mockEntity.addComponent('Experience', { total: 0, current: 0 });
      
      system.addEntity(mockEntity);
      expect(system.getMetrics().entityCount).toBe(1);
      
      system.removeEntity(mockEntity);
      expect(system.getMetrics().entityCount).toBe(0);
    });
  });

  describe('Experience System', () => {
    beforeEach(() => {
      mockEntity.addComponent('Player', { id: 'test_player_1', name: 'Test Player' });
      mockEntity.addComponent('Character', { 
        level: 5, 
        class: 'marauder',
        attributes: { strength: 25, dexterity: 16, intelligence: 16 }
      });
      mockEntity.addComponent('Experience', { total: 1000, current: 200 });
      mockEntity.addComponent('Health', { current: 100, maximum: 100 });
      mockEntity.addComponent('Mana', { current: 50, maximum: 50 });
      system.addEntity(mockEntity);
    });

    test('should award experience correctly', () => {
      const initialExp = mockEntity.getComponent('Experience').total;
      
      const success = system.awardExperience(mockEntity, 500, 'monster_kill', 'act_2', 5);
      
      expect(success).toBe(true);
      
      const experience = mockEntity.getComponent('Experience');
      expect(experience.total).toBeGreaterThan(initialExp);
      expect(experience.sessionGained).toBeGreaterThan(0);
    });

    test('should trigger experience gained event', () => {
      system.awardExperience(mockEntity, 500, 'monster_kill', 'act_2', 5);
      
      expect(mockWorld.emit).toHaveBeenCalledWith('character:experience_gained', 
        expect.objectContaining({
          entity: mockEntity,
          experience: expect.any(Object),
          source: 'monster_kill'
        })
      );
    });

    test('should apply level difference penalties', () => {
      // Award experience from much lower level content
      system.awardExperience(mockEntity, 1000, 'easy_monster', 'act_1', 1);
      
      const experience = mockEntity.getComponent('Experience');
      // Should have received less than 1000 due to level penalty
      expect(experience.sessionGained).toBeLessThan(1000);
    });

    test('should apply area bonuses', () => {
      // Award experience from appropriate endgame content
      const character = mockEntity.getComponent('Character');
      character.level = 65;
      
      system.awardExperience(mockEntity, 1000, 'map_monster', 'maps_tier_1_5', 65);
      
      const experience = mockEntity.getComponent('Experience');
      // Should have received bonus experience
      expect(experience.sessionGained).toBeGreaterThan(1000);
    });
  });

  describe('Level Up System', () => {
    beforeEach(() => {
      mockEntity.addComponent('Player', { id: 'test_player_1', name: 'Test Player' });
      mockEntity.addComponent('Character', { 
        level: 4, 
        class: 'marauder',
        attributes: { strength: 25, dexterity: 16, intelligence: 16 }
      });
      mockEntity.addComponent('Experience', { total: 0, current: 0 });
      mockEntity.addComponent('Health', { current: 80, maximum: 80 });
      mockEntity.addComponent('Mana', { current: 40, maximum: 40 });
      system.addEntity(mockEntity);
    });

    test('should process level up when enough experience gained', () => {
      const character = mockEntity.getComponent('Character');
      const initialLevel = character.level;
      
      // Give enough experience to level up
      const massiveExp = 100000;
      system.awardExperience(mockEntity, massiveExp, 'test', 'test_area', 5);
      
      // Process the update to check for level ups
      system.update(16.67);
      
      expect(character.level).toBeGreaterThan(initialLevel);
    });

    test('should trigger level up event', () => {
      // Give enough experience to level up
      system.awardExperience(mockEntity, 100000, 'test', 'test_area', 5);
      system.update(16.67);
      
      expect(mockWorld.emit).toHaveBeenCalledWith('character:level_up',
        expect.objectContaining({
          entity: mockEntity,
          oldLevel: expect.any(Number),
          newLevel: expect.any(Number),
          rewards: expect.any(Object)
        })
      );
    });

    test('should award skill points on level up', () => {
      const skillPoints = mockEntity.getComponent('SkillPoints');
      const initialPoints = skillPoints.available;
      
      // Give enough experience to level up
      system.awardExperience(mockEntity, 100000, 'test', 'test_area', 5);
      system.update(16.67);
      
      expect(skillPoints.available).toBeGreaterThan(initialPoints);
      expect(skillPoints.total).toBeGreaterThan(skillPoints.used + initialPoints);
    });

    test('should update character stats on level up', () => {
      const character = mockEntity.getComponent('Character');
      const health = mockEntity.getComponent('Health');
      const mana = mockEntity.getComponent('Mana');
      
      const initialStrength = character.attributes.strength;
      const initialMaxHealth = health.maximum;
      const initialMaxMana = mana.maximum;
      
      // Give enough experience to level up
      system.awardExperience(mockEntity, 100000, 'test', 'test_area', 5);
      system.update(16.67);
      
      // Stats should have increased
      expect(character.attributes.strength).toBeGreaterThan(initialStrength);
      expect(health.maximum).toBeGreaterThan(initialMaxHealth);
      expect(mana.maximum).toBeGreaterThan(initialMaxMana);
      
      // Should be fully healed/restored on level up
      expect(health.current).toBe(health.maximum);
      expect(mana.current).toBe(mana.maximum);
    });

    test('should apply class-specific bonuses', () => {
      const character = mockEntity.getComponent('Character');
      character.class = 'marauder'; // Strength-focused class
      
      const initialStrength = character.attributes.strength;
      const initialDexterity = character.attributes.dexterity;
      
      // Give enough experience to level up
      system.awardExperience(mockEntity, 100000, 'test', 'test_area', 5);
      system.update(16.67);
      
      const strengthGain = character.attributes.strength - initialStrength;
      const dexterityGain = character.attributes.dexterity - initialDexterity;
      
      // Marauder should gain more strength than dexterity
      expect(strengthGain).toBeGreaterThan(dexterityGain);
    });

    test('should handle multiple level ups in one update', () => {
      const character = mockEntity.getComponent('Character');
      const initialLevel = character.level;
      
      // Give massive experience to trigger multiple level ups
      system.awardExperience(mockEntity, 1000000, 'test', 'test_area', 5);
      system.update(16.67);
      
      // Should have gained multiple levels
      expect(character.level).toBeGreaterThan(initialLevel + 1);
    });

    test('should cap at level 100', () => {
      const character = mockEntity.getComponent('Character');
      character.level = 99;
      
      // Give massive experience
      system.awardExperience(mockEntity, 999999999, 'test', 'test_area', 5);
      system.update(16.67);
      
      expect(character.level).toBeLessThanOrEqual(100);
    });
  });

  describe('Content Access Control', () => {
    beforeEach(() => {
      mockEntity.addComponent('Player', { id: 'test_player_1', name: 'Test Player' });
      mockEntity.addComponent('Character', { level: 30, class: 'marauder' });
      mockEntity.addComponent('Experience', { total: 0, current: 0 });
      system.addEntity(mockEntity);
    });

    test('should allow access to appropriate content', () => {
      const access = system.canAccessContent(mockEntity, 'act_3');
      expect(access.canAccess).toBe(true);
    });

    test('should deny access to high level content', () => {
      const access = system.canAccessContent(mockEntity, 'maps_system');
      expect(access.canAccess).toBe(false);
      expect(access.reason).toBe('level_too_low');
    });

    test('should provide access information', () => {
      const access = system.canAccessContent(mockEntity, 'act_5');
      expect(access.canAccess).toBe(false);
      expect(access.required).toBe(32);
      expect(access.current).toBe(30);
    });
  });

  describe('Content Recommendations', () => {
    beforeEach(() => {
      mockEntity.addComponent('Player', { id: 'test_player_1', name: 'Test Player' });
      mockEntity.addComponent('Character', { level: 20, class: 'marauder' });
      mockEntity.addComponent('Experience', { total: 0, current: 0 });
      mockEntity.addComponent('AreaPosition', { areaId: 'act_2_area', x: 0, y: 0 });
      system.addEntity(mockEntity);
    });

    test('should provide content recommendations', () => {
      system.update(16.67);
      
      const recommendations = mockEntity.getComponent('ContentRecommendations');
      expect(recommendations).toBeTruthy();
      expect(recommendations.recommendations.length).toBeGreaterThan(0);
    });

    test('should validate progression gates', () => {
      const character = mockEntity.getComponent('Character');
      character.level = 50; // Overleveled for Act 2
      
      system.update(16.67);
      
      // Should trigger content warning
      expect(mockWorld.emit).toHaveBeenCalledWith('content:warning',
        expect.objectContaining({
          entity: mockEntity,
          warning: expect.any(Object)
        })
      );
    });
  });

  describe('Progression Statistics', () => {
    beforeEach(() => {
      mockEntity.addComponent('Player', { id: 'test_player_1', name: 'Test Player' });
      mockEntity.addComponent('Character', { level: 15, class: 'marauder' });
      mockEntity.addComponent('Experience', { 
        total: 5000, 
        current: 500, 
        toNextLevel: 1000,
        experienceRate: 100
      });
      system.addEntity(mockEntity);
    });

    test('should provide progression statistics', () => {
      const stats = system.getProgressionStats(mockEntity);
      
      expect(stats).toBeTruthy();
      expect(stats.level).toBe(15);
      expect(stats.experience.current).toBe(500);
      expect(stats.experience.toNextLevel).toBe(1000);
      expect(stats.experience.total).toBe(5000);
      expect(stats.skillPoints).toBeTruthy();
      expect(stats.recommendations).toBeTruthy();
    });

    test('should handle entities without skill points', () => {
      // Remove skill points component
      mockEntity.removeComponent('SkillPoints');
      
      const stats = system.getProgressionStats(mockEntity);
      expect(stats.skillPoints).toBeNull();
    });

    test('should return null for invalid entities', () => {
      const invalidEntity = createMockEntity();
      const stats = system.getProgressionStats(invalidEntity);
      expect(stats).toBeNull();
    });
  });

  describe('Performance Monitoring', () => {
    test('should track performance metrics', () => {
      mockEntity.addComponent('Player', { id: 'test_player_1', name: 'Test Player' });
      mockEntity.addComponent('Character', { level: 10, class: 'marauder' });
      mockEntity.addComponent('Experience', { total: 0, current: 0 });
      system.addEntity(mockEntity);
      
      system.update(16.67);
      
      const metrics = system.getMetrics();
      
      expect(metrics.name).toBe('LevelProgressionSystem');
      expect(metrics.entityCount).toBe(1);
      expect(metrics.executionTime).toBeGreaterThanOrEqual(0);
      expect(metrics.lastUpdate).toBeGreaterThan(0);
    });

    test('should update min/max execution times', () => {
      mockEntity.addComponent('Player', { id: 'test_player_1', name: 'Test Player' });
      mockEntity.addComponent('Character', { level: 10, class: 'marauder' });
      mockEntity.addComponent('Experience', { total: 0, current: 0 });
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

  describe('Event System', () => {
    beforeEach(() => {
      mockEntity.addComponent('Player', { id: 'test_player_1', name: 'Test Player' });
      mockEntity.addComponent('Character', { level: 10, class: 'marauder' });
      mockEntity.addComponent('Experience', { total: 0, current: 0 });
      system.addEntity(mockEntity);
    });

    test('should emit level up notification events', () => {
      system.awardExperience(mockEntity, 100000, 'test', 'test_area', 10);
      system.update(16.67);
      
      // Should emit UI notification
      expect(mockWorld.emit).toHaveBeenCalledWith('ui:level_up_notification',
        expect.objectContaining({
          entity: mockEntity,
          oldLevel: expect.any(Number),
          newLevel: expect.any(Number),
          rewards: expect.any(Object)
        })
      );
    });

    test('should emit content unlocked events', () => {
      // Level up to unlock new content
      const character = mockEntity.getComponent('Character');
      character.level = 59;
      
      system.awardExperience(mockEntity, 100000, 'test', 'test_area', 60);
      system.update(16.67);
      
      // Should emit content unlocked event for maps
      expect(mockWorld.emit).toHaveBeenCalledWith('content:unlocked',
        expect.objectContaining({
          entity: mockEntity,
          content: expect.any(Object)
        })
      );
    });

    test('should handle missing world gracefully', () => {
      system.setWorld(null);
      
      expect(() => {
        system.awardExperience(mockEntity, 1000, 'test', 'test_area', 10);
        system.update(16.67);
      }).not.toThrow();
    });
  });

  describe('System Cleanup', () => {
    test('should cleanup entities and pending level ups', () => {
      mockEntity.addComponent('Player', { id: 'test_player_1', name: 'Test Player' });
      mockEntity.addComponent('Character', { level: 10, class: 'marauder' });
      mockEntity.addComponent('Experience', { total: 0, current: 0 });
      system.addEntity(mockEntity);
      
      // Create pending level up
      system.pendingLevelUps.set('test_player_1', {
        entity: mockEntity,
        oldLevel: 10,
        newLevel: 11,
        rewards: {},
        timestamp: Date.now()
      });
      
      expect(system.getMetrics().entityCount).toBe(1);
      expect(system.pendingLevelUps.size).toBe(1);
      
      system.cleanup();
      
      expect(system.getMetrics().entityCount).toBe(0);
      expect(system.pendingLevelUps.size).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle corrupted experience data', () => {
      mockEntity.addComponent('Player', { id: 'test_player_1', name: 'Test Player' });
      mockEntity.addComponent('Character', { level: 10, class: 'marauder' });
      mockEntity.addComponent('Experience', { 
        total: 'invalid', 
        current: null, 
        toNextLevel: undefined 
      });
      
      expect(() => {
        system.addEntity(mockEntity);
        system.update(16.67);
      }).not.toThrow();
    });

    test('should handle missing character attributes', () => {
      mockEntity.addComponent('Player', { id: 'test_player_1', name: 'Test Player' });
      mockEntity.addComponent('Character', { level: 10, class: 'marauder' }); // No attributes
      mockEntity.addComponent('Experience', { total: 0, current: 0 });
      
      expect(() => {
        system.addEntity(mockEntity);
        system.awardExperience(mockEntity, 100000, 'test', 'test_area', 10);
        system.update(16.67);
      }).not.toThrow();
    });

    test('should handle invalid character class', () => {
      mockEntity.addComponent('Player', { id: 'test_player_1', name: 'Test Player' });
      mockEntity.addComponent('Character', { level: 10, class: 'invalid_class' });
      mockEntity.addComponent('Experience', { total: 0, current: 0 });
      
      expect(() => {
        system.addEntity(mockEntity);
        system.awardExperience(mockEntity, 100000, 'test', 'test_area', 10);
        system.update(16.67);
      }).not.toThrow();
    });

    test('should handle extreme experience values', () => {
      mockEntity.addComponent('Player', { id: 'test_player_1', name: 'Test Player' });
      mockEntity.addComponent('Character', { level: 10, class: 'marauder' });
      mockEntity.addComponent('Experience', { total: 0, current: 0 });
      system.addEntity(mockEntity);
      
      // Test with extreme values
      system.awardExperience(mockEntity, Number.MAX_SAFE_INTEGER, 'test', 'test_area', 10);
      system.awardExperience(mockEntity, -1000000, 'test', 'test_area', 10);
      
      expect(() => {
        system.update(16.67);
      }).not.toThrow();
    });
  });
});