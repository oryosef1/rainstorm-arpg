/**
 * Tests for Campaign Components
 * Test coverage for CampaignProgress and AreaLocation components
 */

const { CampaignProgress, AreaLocation } = require('./ecs-components');

describe('CampaignProgress Component', () => {
  let campaignProgress;

  beforeEach(() => {
    campaignProgress = new CampaignProgress();
  });

  describe('Initialization', () => {
    test('should initialize with default values', () => {
      expect(campaignProgress.currentAct).toBe(1);
      expect(campaignProgress.completedActs.size).toBe(0);
      expect(campaignProgress.unlockedAreas.has('town_act1')).toBe(true);
      expect(campaignProgress.activeQuests.size).toBe(0);
      expect(campaignProgress.completedQuests.size).toBe(0);
      expect(campaignProgress.totalSkillPointsEarned).toBe(0);
      expect(campaignProgress.campaignStartTime).toBeLessThanOrEqual(Date.now());
    });

    test('should start with town_act1 unlocked', () => {
      expect(campaignProgress.isAreaUnlocked('town_act1')).toBe(true);
      expect(campaignProgress.isAreaUnlocked('prison_ship')).toBe(false);
    });
  });

  describe('Act Completion', () => {
    test('should complete an act successfully', () => {
      const skillPoints = 2;
      const areaUnlocks = ['prison_ship', 'mud_flats'];

      campaignProgress.completeAct(1, skillPoints, areaUnlocks);

      expect(campaignProgress.isActCompleted(1)).toBe(true);
      expect(campaignProgress.totalSkillPointsEarned).toBe(skillPoints);
      expect(campaignProgress.currentAct).toBe(2);
      
      areaUnlocks.forEach(areaId => {
        expect(campaignProgress.isAreaUnlocked(areaId)).toBe(true);
      });
    });

    test('should not advance current act if completing a previous act', () => {
      campaignProgress.currentAct = 3;
      campaignProgress.completeAct(1, 2, []);

      expect(campaignProgress.isActCompleted(1)).toBe(true);
      expect(campaignProgress.currentAct).toBe(3); // Should not change
    });

    test('should not advance past act 10', () => {
      campaignProgress.currentAct = 10;
      campaignProgress.completeAct(10, 5, []);

      expect(campaignProgress.currentAct).toBe(10);
      expect(campaignProgress.isActCompleted(10)).toBe(true);
    });

    test('should accumulate skill points from multiple acts', () => {
      campaignProgress.completeAct(1, 2, []);
      campaignProgress.completeAct(2, 2, []);
      campaignProgress.completeAct(3, 2, []);

      expect(campaignProgress.totalSkillPointsEarned).toBe(6);
    });
  });

  describe('Quest Management', () => {
    test('should start a quest successfully', () => {
      const questId = 'kill_10_enemies';
      const questData = {
        title: 'Slay the Beasts',
        description: 'Kill 10 enemies',
        objectives: ['kill_enemies'],
        rewards: { experience: 100 }
      };

      campaignProgress.startQuest(questId, questData);

      expect(campaignProgress.activeQuests.has(questId)).toBe(true);
      const quest = campaignProgress.activeQuests.get(questId);
      expect(quest.title).toBe(questData.title);
      expect(quest.startTime).toBeLessThanOrEqual(Date.now());
      expect(quest.progress).toEqual({});
    });

    test('should update quest progress', () => {
      const questId = 'kill_10_enemies';
      campaignProgress.startQuest(questId, { title: 'Test Quest' });

      campaignProgress.updateQuestProgress(questId, 'enemiesKilled', 5);
      campaignProgress.updateQuestProgress(questId, 'areasVisited', 2);

      const quest = campaignProgress.activeQuests.get(questId);
      expect(quest.progress.enemiesKilled).toBe(5);
      expect(quest.progress.areasVisited).toBe(2);
    });

    test('should complete a quest successfully', () => {
      const questId = 'test_quest';
      campaignProgress.startQuest(questId, { title: 'Test Quest' });

      const completedQuest = campaignProgress.completeQuest(questId);

      expect(completedQuest).toBeDefined();
      expect(completedQuest.completionTime).toBeLessThanOrEqual(Date.now());
      expect(campaignProgress.activeQuests.has(questId)).toBe(false);
      expect(campaignProgress.completedQuests.has(questId)).toBe(true);
    });

    test('should return null when completing non-existent quest', () => {
      const result = campaignProgress.completeQuest('non_existent_quest');
      expect(result).toBeNull();
    });

    test('should not update progress for non-existent quest', () => {
      campaignProgress.updateQuestProgress('non_existent_quest', 'progress', 100);
      // Should not throw error, just silently ignore
      expect(campaignProgress.activeQuests.size).toBe(0);
    });
  });

  describe('Campaign Statistics', () => {
    test('should calculate completion percentage correctly', () => {
      expect(campaignProgress.getCompletionPercentage()).toBe(0);

      campaignProgress.completeAct(1, 2, []);
      expect(campaignProgress.getCompletionPercentage()).toBe(10);

      campaignProgress.completeAct(2, 2, []);
      campaignProgress.completeAct(3, 2, []);
      expect(campaignProgress.getCompletionPercentage()).toBe(30);

      // Complete all acts
      for (let i = 4; i <= 10; i++) {
        campaignProgress.completeAct(i, 2, []);
      }
      expect(campaignProgress.getCompletionPercentage()).toBe(100);
    });

    test('should track campaign playtime', () => {
      const startTime = campaignProgress.campaignStartTime;
      const playtime = campaignProgress.getCampaignPlaytime();

      expect(playtime).toBeGreaterThanOrEqual(0);
      expect(playtime).toBe(Date.now() - startTime);
    });
  });

  describe('Area Management', () => {
    test('should check area unlock status', () => {
      expect(campaignProgress.isAreaUnlocked('town_act1')).toBe(true);
      expect(campaignProgress.isAreaUnlocked('unknown_area')).toBe(false);

      campaignProgress.completeAct(1, 2, ['prison_ship']);
      expect(campaignProgress.isAreaUnlocked('prison_ship')).toBe(true);
    });
  });
});

describe('AreaLocation Component', () => {
  let areaLocation;

  beforeEach(() => {
    areaLocation = new AreaLocation('test_area', 1);
  });

  describe('Initialization', () => {
    test('should initialize with default values', () => {
      expect(areaLocation.areaId).toBe('test_area');
      expect(areaLocation.actNumber).toBe(1);
      expect(areaLocation.waypointDiscovered).toBe(false);
      expect(areaLocation.discoveredExits.size).toBe(0);
      expect(areaLocation.visitCount).toBe(0);
      expect(areaLocation.firstVisitTime).toBeNull();
      expect(areaLocation.lastVisitTime).toBeNull();
      expect(areaLocation.enemiesKilled).toBe(0);
      expect(areaLocation.timeSpent).toBe(0);
    });

    test('should initialize with default parameters', () => {
      const defaultArea = new AreaLocation();
      expect(defaultArea.areaId).toBe('town_act1');
      expect(defaultArea.actNumber).toBe(1);
    });
  });

  describe('Area Entry', () => {
    test('should record first visit correctly', () => {
      areaLocation.enter();

      expect(areaLocation.visitCount).toBe(1);
      expect(areaLocation.firstVisitTime).toBeLessThanOrEqual(Date.now());
      expect(areaLocation.lastVisitTime).toBeLessThanOrEqual(Date.now());
      expect(areaLocation.firstVisitTime).toBe(areaLocation.lastVisitTime);
    });

    test('should record multiple visits correctly', () => {
      const firstVisitTime = Date.now() - 1000;
      areaLocation.firstVisitTime = firstVisitTime;

      areaLocation.enter();
      areaLocation.enter();

      expect(areaLocation.visitCount).toBe(2);
      expect(areaLocation.firstVisitTime).toBe(firstVisitTime);
      expect(areaLocation.lastVisitTime).toBeGreaterThan(firstVisitTime);
    });
  });

  describe('Discovery System', () => {
    test('should discover waypoint', () => {
      expect(areaLocation.waypointDiscovered).toBe(false);
      
      areaLocation.discoverWaypoint();
      expect(areaLocation.waypointDiscovered).toBe(true);
    });

    test('should discover exits', () => {
      expect(areaLocation.discoveredExits.size).toBe(0);

      areaLocation.discoverExit('area_north');
      areaLocation.discoverExit('area_south');

      expect(areaLocation.discoveredExits.has('area_north')).toBe(true);
      expect(areaLocation.discoveredExits.has('area_south')).toBe(true);
      expect(areaLocation.discoveredExits.size).toBe(2);
    });

    test('should not duplicate discovered exits', () => {
      areaLocation.discoverExit('area_north');
      areaLocation.discoverExit('area_north'); // Duplicate

      expect(areaLocation.discoveredExits.size).toBe(1);
    });
  });

  describe('Activity Tracking', () => {
    test('should record enemy kills', () => {
      expect(areaLocation.enemiesKilled).toBe(0);

      areaLocation.recordEnemyKill();
      areaLocation.recordEnemyKill();
      areaLocation.recordEnemyKill();

      expect(areaLocation.enemiesKilled).toBe(3);
    });

    test('should track time spent', () => {
      expect(areaLocation.timeSpent).toBe(0);

      areaLocation.addTimeSpent(1000);
      areaLocation.addTimeSpent(2000);

      expect(areaLocation.timeSpent).toBe(3000);
    });
  });

  describe('Exploration Status', () => {
    test('should detect full exploration correctly', () => {
      const expectedExits = ['area_north', 'area_south'];

      // Not fully explored initially
      expect(areaLocation.isFullyExplored(expectedExits)).toBe(false);

      // Discover waypoint only
      areaLocation.discoverWaypoint();
      expect(areaLocation.isFullyExplored(expectedExits)).toBe(false);

      // Discover some exits
      areaLocation.discoverExit('area_north');
      expect(areaLocation.isFullyExplored(expectedExits)).toBe(false);

      // Discover all exits
      areaLocation.discoverExit('area_south');
      expect(areaLocation.isFullyExplored(expectedExits)).toBe(true);
    });

    test('should handle empty exit list', () => {
      areaLocation.discoverWaypoint();
      expect(areaLocation.isFullyExplored([])).toBe(true);
    });
  });

  describe('Statistics', () => {
    test('should provide comprehensive exploration stats', () => {
      areaLocation.enter();
      areaLocation.discoverWaypoint();
      areaLocation.discoverExit('area_north');
      areaLocation.recordEnemyKill();
      areaLocation.addTimeSpent(5000);

      const stats = areaLocation.getExplorationStats();

      expect(stats.visitCount).toBe(1);
      expect(stats.timeSpent).toBe(5000);
      expect(stats.enemiesKilled).toBe(1);
      expect(stats.waypointDiscovered).toBe(true);
      expect(stats.exitsDiscovered).toBe(1);
      expect(stats.firstVisit).toBeLessThanOrEqual(Date.now());
      expect(stats.lastVisit).toBeLessThanOrEqual(Date.now());
    });

    test('should handle stats for unvisited area', () => {
      const stats = areaLocation.getExplorationStats();

      expect(stats.visitCount).toBe(0);
      expect(stats.firstVisit).toBeNull();
      expect(stats.lastVisit).toBeNull();
      expect(stats.timeSpent).toBe(0);
      expect(stats.enemiesKilled).toBe(0);
      expect(stats.waypointDiscovered).toBe(false);
      expect(stats.exitsDiscovered).toBe(0);
    });
  });
});