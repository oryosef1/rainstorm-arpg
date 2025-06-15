/**
 * Tests for Campaign System
 * Comprehensive test coverage for campaign progression and management
 */

const { CampaignSystem } = require('./campaign-system');
const { CampaignProgress, AreaLocation } = require('../components/ecs-components');
const { Entity, World, System } = require('../ecs/ecs-core');

// Mock Level component for testing
class Level {
  constructor(current = 1) {
    this.current = current;
  }
}

// Mock Experience component for testing
class Experience {
  constructor() {
    this.current = 0;
    this.total = 0;
  }
}

// Mock SkillTree component for testing
class SkillTree {
  constructor() {
    this.availablePoints = 0;
    this.allocatedNodes = new Set();
  }
}

describe('CampaignSystem', () => {
  let campaignSystem;
  let world;
  let testEntity;

  beforeEach(() => {
    campaignSystem = new CampaignSystem();
    world = new World();
    
    // Create test entity with required components
    testEntity = world.createEntity();
    testEntity.addComponent(new CampaignProgress());
    testEntity.addComponent(new Level(1));
    testEntity.addComponent(new Experience());
    testEntity.addComponent(new SkillTree());
    
    // Add entity to system
    campaignSystem.addEntity(testEntity);
  });

  describe('System Initialization', () => {
    test('should initialize with correct required components', () => {
      expect(campaignSystem.requiredComponents).toContain('CampaignProgress');
      expect(campaignSystem.requiredComponents).toContain('Level');
    });

    test('should initialize campaign manager', () => {
      expect(campaignSystem.campaignManager).toBeDefined();
      expect(campaignSystem.campaignManager.initialized).toBe(true);
    });

    test('should set up event listeners', () => {
      // Event listeners are set up in constructor
      expect(campaignSystem.setupEventListeners).toBeDefined();
    });
  });

  describe('Character Progression', () => {
    test('should process character campaign progression', () => {
      const campaignProgress = testEntity.getComponent('CampaignProgress');
      const level = testEntity.getComponent('Level');
      
      // Character should start at Act 1
      expect(campaignProgress.currentAct).toBe(1);
      
      // Update system
      campaignSystem.processCharacterProgression(testEntity);
      
      // Should still be at Act 1 with level 1
      expect(campaignProgress.currentAct).toBe(1);
    });

    test('should unlock higher acts when level requirements are met', () => {
      const campaignProgress = testEntity.getComponent('CampaignProgress');
      const level = testEntity.getComponent('Level');
      
      // Complete Act 1
      campaignProgress.completeAct(1, 2, []);
      
      // Set level to 8 (Act 2 requirement)
      level.current = 8;
      
      campaignSystem.processCharacterProgression(testEntity);
      
      // Should now be able to access Act 2 areas
      expect(campaignProgress.currentAct).toBe(2);
    });

    test('should check act accessibility based on level and completion', () => {
      const campaignProgress = testEntity.getComponent('CampaignProgress');
      const level = testEntity.getComponent('Level');
      
      // Set high level
      level.current = 50;
      
      // Complete first few acts
      campaignProgress.completeAct(1, 2, []);
      campaignProgress.completeAct(2, 2, []);
      
      campaignSystem.checkActAccessibility(testEntity);
      
      // Should unlock areas for accessible acts
      expect(campaignProgress.unlockedAreas.size).toBeGreaterThan(1);
    });
  });

  describe('Act Management', () => {
    test('should unlock act areas when act becomes accessible', () => {
      const campaignProgress = testEntity.getComponent('CampaignProgress');
      
      campaignSystem.unlockAct(testEntity, 2);
      
      // Should unlock Act 2 areas
      const act2Areas = campaignSystem.campaignManager.getAct(2).areas;
      act2Areas.forEach(areaId => {
        expect(campaignProgress.isAreaUnlocked(areaId)).toBe(true);
      });
    });

    test('should handle act completion correctly', () => {
      const campaignProgress = testEntity.getComponent('CampaignProgress');
      const skillTree = testEntity.getComponent('SkillTree');
      const initialSkillPoints = skillTree.availablePoints;

      campaignSystem.completeActInternal(testEntity, 1);

      // Should complete the act
      expect(campaignProgress.isActCompleted(1)).toBe(true);
      
      // Should advance to next act
      expect(campaignProgress.currentAct).toBe(2);
      
      // Should award skill points
      expect(skillTree.availablePoints).toBeGreaterThan(initialSkillPoints);
    });

    test('should handle endgame unlock for Act 10', () => {
      let endgameUnlocked = false;
      document.addEventListener('endgameUnlocked', () => {
        endgameUnlocked = true;
      });

      campaignSystem.completeActInternal(testEntity, 10);

      expect(endgameUnlocked).toBe(true);
    });
  });

  describe('Quest Integration', () => {
    test('should handle quest completion', () => {
      const mockEvent = {
        detail: {
          entity: testEntity,
          questId: 'test_quest',
          rewards: {
            experience: 100,
            skillPoints: 1
          }
        }
      };

      const campaignProgress = testEntity.getComponent('CampaignProgress');
      
      // Start the quest first
      campaignProgress.startQuest('test_quest', { title: 'Test Quest' });

      const experience = testEntity.getComponent('Experience');
      const skillTree = testEntity.getComponent('SkillTree');
      const initialExp = experience.current;
      const initialSkillPoints = skillTree.availablePoints;

      campaignSystem.handleQuestCompleted(mockEvent);

      // Should complete the quest
      expect(campaignProgress.completedQuests.has('test_quest')).toBe(true);
      expect(campaignProgress.activeQuests.has('test_quest')).toBe(false);

      // Should apply rewards
      expect(experience.current).toBe(initialExp + 100);
      expect(skillTree.availablePoints).toBe(initialSkillPoints + 1);
    });

    test('should check for act completion when main quest is completed', () => {
      const campaignProgress = testEntity.getComponent('CampaignProgress');
      campaignProgress.currentAct = 1;

      let actCompleted = false;
      document.addEventListener('actCompletedInternal', () => {
        actCompleted = true;
      });

      campaignSystem.checkActCompletion(testEntity, 'act_1_main');

      expect(actCompleted).toBe(true);
      expect(campaignProgress.isActCompleted(1)).toBe(true);
    });
  });

  describe('Area Management', () => {
    test('should handle area entry', () => {
      const mockEvent = {
        detail: {
          entity: testEntity,
          areaId: 'prison_ship'
        }
      };

      const campaignProgress = testEntity.getComponent('CampaignProgress');
      
      campaignSystem.handleAreaEntered(mockEvent);

      // Should unlock area if accessible
      expect(campaignProgress.isAreaUnlocked('prison_ship')).toBe(true);
    });

    test('should update area location on entry', () => {
      const areaLocation = new AreaLocation();
      testEntity.addComponent(areaLocation);

      const mockEvent = {
        detail: {
          entity: testEntity,
          areaId: 'new_area'
        }
      };

      campaignSystem.handleAreaEntered(mockEvent);

      expect(areaLocation.areaId).toBe('new_area');
      expect(areaLocation.visitCount).toBe(1);
    });

    test('should track enemy kills in areas', () => {
      const areaLocation = new AreaLocation();
      testEntity.addComponent(areaLocation);

      const mockEvent = {
        detail: {
          entity: testEntity,
          enemy: { type: 'skeleton' }
        }
      };

      campaignSystem.handleEnemyKilled(mockEvent);

      expect(areaLocation.enemiesKilled).toBe(1);
    });
  });

  describe('Reward System', () => {
    test('should apply quest rewards correctly', () => {
      const rewards = {
        experience: 500,
        skillPoints: 2,
        items: [{ name: 'Test Sword' }]
      };

      const experience = testEntity.getComponent('Experience');
      const skillTree = testEntity.getComponent('SkillTree');
      const initialExp = experience.current;
      const initialSkillPoints = skillTree.availablePoints;

      campaignSystem.applyQuestRewards(testEntity, rewards);

      expect(experience.current).toBe(initialExp + 500);
      expect(skillTree.availablePoints).toBe(initialSkillPoints + 2);
    });

    test('should apply act completion rewards', () => {
      const rewards = {
        skillPoints: 3,
        gemRewards: ['fireball', 'ice_bolt']
      };

      const skillTree = testEntity.getComponent('SkillTree');
      const campaignProgress = testEntity.getComponent('CampaignProgress');
      const initialSkillPoints = skillTree.availablePoints;
      const initialTotalSkillPoints = campaignProgress.totalSkillPointsEarned;

      campaignSystem.applyActRewards(testEntity, rewards);

      expect(skillTree.availablePoints).toBe(initialSkillPoints + 3);
      expect(campaignProgress.totalSkillPointsEarned).toBe(initialTotalSkillPoints + 3);
    });
  });

  describe('State Validation', () => {
    test('should validate campaign state consistency', () => {
      const campaignProgress = testEntity.getComponent('CampaignProgress');
      const level = testEntity.getComponent('Level');
      
      // Set invalid state (high act, low level)
      campaignProgress.currentAct = 5;
      level.current = 1;

      campaignSystem.validateCampaignState(testEntity);

      // Should reset to valid act
      expect(campaignProgress.currentAct).toBeLessThan(5);
    });

    test('should maintain valid progression', () => {
      const campaignProgress = testEntity.getComponent('CampaignProgress');
      const level = testEntity.getComponent('Level');
      
      // Valid progression
      level.current = 20;
      campaignProgress.completeAct(1, 2, []);
      campaignProgress.completeAct(2, 2, []);
      campaignProgress.currentAct = 3;

      const initialAct = campaignProgress.currentAct;
      campaignSystem.validateCampaignState(testEntity);

      // Should maintain valid state
      expect(campaignProgress.currentAct).toBe(initialAct);
    });
  });

  describe('Statistics', () => {
    test('should provide comprehensive campaign statistics', () => {
      const campaignProgress = testEntity.getComponent('CampaignProgress');
      
      // Add some progression
      campaignProgress.completeAct(1, 2, []);
      campaignProgress.completeAct(2, 2, []);
      campaignProgress.startQuest('test_quest', { title: 'Test' });

      const stats = campaignSystem.getCampaignStats(testEntity);

      expect(stats).toHaveProperty('totalActs', 10);
      expect(stats).toHaveProperty('completed', 2);
      expect(stats).toHaveProperty('totalSkillPointsEarned', 4);
      expect(stats).toHaveProperty('activeQuests', 1);
      expect(stats).toHaveProperty('completedQuests', 0);
      expect(stats).toHaveProperty('playtime');
      expect(stats.completionPercentage).toBe(20);
    });

    test('should return null for entity without campaign progress', () => {
      const entityWithoutProgress = world.createEntity();
      entityWithoutProgress.addComponent(new Level(1));

      const stats = campaignSystem.getCampaignStats(entityWithoutProgress);
      expect(stats).toBeNull();
    });
  });

  describe('Event Dispatching', () => {
    test('should dispatch custom events', () => {
      let eventReceived = false;
      let eventDetail = null;

      document.addEventListener('testEvent', (event) => {
        eventReceived = true;
        eventDetail = event.detail;
      });

      campaignSystem.dispatchEvent('testEvent', { test: 'data' });

      expect(eventReceived).toBe(true);
      expect(eventDetail).toEqual({ test: 'data' });
    });
  });

  describe('System Update Loop', () => {
    test('should update all entities in system', () => {
      const entity2 = world.createEntity();
      entity2.addComponent(new CampaignProgress());
      entity2.addComponent(new Level(10));
      campaignSystem.addEntity(entity2);

      expect(campaignSystem.entities.size).toBe(2);

      // Update should process all entities without errors
      expect(() => {
        campaignSystem.update(16); // 60 FPS delta time
      }).not.toThrow();
    });
  });
});