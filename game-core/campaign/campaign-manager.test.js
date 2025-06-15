/**
 * Tests for Campaign Manager
 * Comprehensive test coverage for 10-Act campaign system
 */

const { CampaignManager } = require('./campaign-manager');

describe('CampaignManager', () => {
  let campaignManager;

  beforeEach(() => {
    campaignManager = new CampaignManager();
    campaignManager.initialize();
  });

  describe('Initialization', () => {
    test('should initialize successfully', () => {
      const newManager = new CampaignManager();
      expect(newManager.initialized).toBe(false);
      
      newManager.initialize();
      expect(newManager.initialized).toBe(true);
    });

    test('should not reinitialize if already initialized', () => {
      const actCountBefore = campaignManager.getAllActs().length;
      campaignManager.initialize(); // Second initialization
      const actCountAfter = campaignManager.getAllActs().length;
      
      expect(actCountBefore).toBe(actCountAfter);
    });

    test('should load all 10 acts', () => {
      const allActs = campaignManager.getAllActs();
      expect(allActs).toHaveLength(10);
      
      // Check that acts 1-10 are all present
      for (let i = 1; i <= 10; i++) {
        const act = campaignManager.getAct(i);
        expect(act).toBeDefined();
        expect(act.id).toBe(i);
      }
    });
  });

  describe('Act Definitions', () => {
    test('should have correct act structure', () => {
      const act1 = campaignManager.getAct(1);
      
      expect(act1).toHaveProperty('id', 1);
      expect(act1).toHaveProperty('name');
      expect(act1).toHaveProperty('description');
      expect(act1).toHaveProperty('levelRange');
      expect(act1).toHaveProperty('areas');
      expect(act1).toHaveProperty('requiredLevel');
      expect(act1).toHaveProperty('completionRewards');
    });

    test('should have progressive level requirements', () => {
      const acts = campaignManager.getAllActs();
      
      for (let i = 0; i < acts.length - 1; i++) {
        const currentAct = acts[i];
        const nextAct = acts[i + 1];
        
        expect(nextAct.requiredLevel).toBeGreaterThan(currentAct.requiredLevel);
        expect(nextAct.levelRange.min).toBeGreaterThanOrEqual(currentAct.levelRange.max);
      }
    });

    test('should have Act 1 accessible from level 1', () => {
      const act1 = campaignManager.getAct(1);
      expect(act1.requiredLevel).toBe(1);
      expect(act1.levelRange.min).toBe(1);
    });

    test('should have Act 10 as endgame with highest requirements', () => {
      const act10 = campaignManager.getAct(10);
      expect(act10.requiredLevel).toBe(60);
      expect(act10.completionRewards.endgameUnlock).toBe(true);
    });

    test('should return null for invalid act ID', () => {
      expect(campaignManager.getAct(0)).toBeNull();
      expect(campaignManager.getAct(11)).toBeNull();
      expect(campaignManager.getAct(-1)).toBeNull();
    });
  });

  describe('Act Accessibility', () => {
    test('should allow access to Act 1 regardless of level or completion', () => {
      expect(campaignManager.canAccessAct(1, new Set(), 1)).toBe(true);
      expect(campaignManager.canAccessAct(50, new Set([2, 3, 4]), 1)).toBe(true);
    });

    test('should require previous act completion for access', () => {
      const completedActs = new Set();
      
      // Cannot access Act 2 without completing Act 1
      expect(campaignManager.canAccessAct(20, completedActs, 2)).toBe(false);
      
      // Can access Act 2 after completing Act 1
      completedActs.add(1);
      expect(campaignManager.canAccessAct(20, completedActs, 2)).toBe(true);
    });

    test('should require minimum level for act access', () => {
      const completedActs = new Set([1]); // Act 1 completed
      
      // Level 7 cannot access Act 2 (requires level 8)
      expect(campaignManager.canAccessAct(7, completedActs, 2)).toBe(false);
      
      // Level 8 can access Act 2
      expect(campaignManager.canAccessAct(8, completedActs, 2)).toBe(true);
    });

    test('should handle complex progression scenarios', () => {
      const completedActs = new Set([1, 2, 3]); // Acts 1-3 completed
      
      // Can access Act 4 with sufficient level
      expect(campaignManager.canAccessAct(24, completedActs, 4)).toBe(true);
      
      // Cannot access Act 5 without completing Act 4
      expect(campaignManager.canAccessAct(32, completedActs, 5)).toBe(false);
      
      // Cannot access Act 6 even with high level (missing Act 4 and 5)
      expect(campaignManager.canAccessAct(50, completedActs, 6)).toBe(false);
    });
  });

  describe('Next Available Act', () => {
    test('should return Act 1 for new character', () => {
      const nextAct = campaignManager.getNextAvailableAct(1, new Set());
      expect(nextAct.id).toBe(1);
    });

    test('should return next sequential act when previous is completed', () => {
      const completedActs = new Set([1, 2]);
      const nextAct = campaignManager.getNextAvailableAct(20, completedActs);
      expect(nextAct.id).toBe(3);
    });

    test('should return null when all acts are completed', () => {
      const completedActs = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      const nextAct = campaignManager.getNextAvailableAct(70, completedActs);
      expect(nextAct).toBeNull();
    });

    test('should skip acts that require higher level', () => {
      const completedActs = new Set([1]); // Only Act 1 completed
      
      // Level 6 character - can't access Act 2 yet (requires level 8)
      const nextAct = campaignManager.getNextAvailableAct(6, completedActs);
      expect(nextAct).toBeNull();
    });

    test('should find the correct act when multiple are available', () => {
      const completedActs = new Set([1, 2, 3, 4]); // Acts 1-4 completed
      const nextAct = campaignManager.getNextAvailableAct(35, completedActs);
      expect(nextAct.id).toBe(5); // Should return Act 5
    });
  });

  describe('Campaign Statistics', () => {
    test('should calculate completion percentage correctly', () => {
      expect(campaignManager.getCompletionPercentage(new Set())).toBe(0);
      expect(campaignManager.getCompletionPercentage(new Set([1, 2, 3]))).toBe(30);
      expect(campaignManager.getCompletionPercentage(new Set([1, 2, 3, 4, 5]))).toBe(50);
      expect(campaignManager.getCompletionPercentage(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]))).toBe(100);
    });

    test('should provide comprehensive campaign stats', () => {
      const completedActs = new Set([1, 2, 3, 4]);
      const stats = campaignManager.getCampaignStats(completedActs);
      
      expect(stats.totalActs).toBe(10);
      expect(stats.completed).toBe(4);
      expect(stats.remaining).toBe(6);
      expect(stats.completionPercentage).toBe(40);
      expect(stats.isComplete).toBe(false);
    });

    test('should indicate completion when all acts are done', () => {
      const completedActs = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      const stats = campaignManager.getCampaignStats(completedActs);
      
      expect(stats.isComplete).toBe(true);
      expect(stats.completionPercentage).toBe(100);
    });

    test('should provide recommended level range', () => {
      const completedActs = new Set([1, 2]); // Acts 1-2 completed
      const levelRange = campaignManager.getRecommendedLevelRange(completedActs);
      
      const act3 = campaignManager.getAct(3);
      expect(levelRange).toEqual(act3.levelRange);
    });

    test('should recommend endgame levels when campaign is complete', () => {
      const completedActs = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      const levelRange = campaignManager.getRecommendedLevelRange(completedActs);
      
      expect(levelRange.min).toBe(60);
      expect(levelRange.max).toBe(100);
    });
  });

  describe('Area Management', () => {
    test('should provide area information', () => {
      const townAct1 = campaignManager.getArea('town_act1');
      expect(townAct1).toBeDefined();
      expect(townAct1.name).toBe('Lioneye\'s Watch');
      expect(townAct1.type).toBe('town');
    });

    test('should return null for invalid area ID', () => {
      const invalidArea = campaignManager.getArea('nonexistent_area');
      expect(invalidArea).toBeNull();
    });

    test('should get areas for specific act', () => {
      const act1Areas = campaignManager.getAreasForAct(1);
      expect(act1Areas.length).toBeGreaterThan(0);
      
      // Should include areas defined in Act 1
      const areaIds = act1Areas.map(area => area.id);
      expect(areaIds).toContain('town_act1');
    });

    test('should return empty array for invalid act', () => {
      const invalidActAreas = campaignManager.getAreasForAct(99);
      expect(invalidActAreas).toEqual([]);
    });
  });

  describe('Reward System', () => {
    test('should provide skill point rewards for each act', () => {
      const acts = campaignManager.getAllActs();
      
      acts.forEach(act => {
        expect(act.completionRewards).toHaveProperty('skillPoints');
        expect(act.completionRewards.skillPoints).toBeGreaterThan(0);
      });
    });

    test('should provide gem rewards for progression', () => {
      const acts = campaignManager.getAllActs();
      
      acts.forEach(act => {
        expect(act.completionRewards).toHaveProperty('gemRewards');
        expect(Array.isArray(act.completionRewards.gemRewards)).toBe(true);
        expect(act.completionRewards.gemRewards.length).toBeGreaterThan(0);
      });
    });

    test('should have escalating skill point rewards for later acts', () => {
      const act1 = campaignManager.getAct(1);
      const act10 = campaignManager.getAct(10);
      
      expect(act10.completionRewards.skillPoints).toBeGreaterThan(act1.completionRewards.skillPoints);
    });

    test('should unlock endgame access in final act', () => {
      const act10 = campaignManager.getAct(10);
      expect(act10.completionRewards.endgameUnlock).toBe(true);
    });
  });

  describe('Level Range Validation', () => {
    test('should have non-overlapping level ranges in sequence', () => {
      const acts = campaignManager.getAllActs();
      
      for (let i = 0; i < acts.length - 1; i++) {
        const currentAct = acts[i];
        const nextAct = acts[i + 1];
        
        // Next act should start at or after current act's max level
        expect(nextAct.levelRange.min).toBeGreaterThanOrEqual(currentAct.levelRange.max);
      }
    });

    test('should cover the full 1-60+ level progression', () => {
      const acts = campaignManager.getAllActs();
      const firstAct = acts[0];
      const lastAct = acts[acts.length - 1];
      
      expect(firstAct.levelRange.min).toBe(1);
      expect(lastAct.levelRange.max).toBeGreaterThanOrEqual(60);
    });
  });
});