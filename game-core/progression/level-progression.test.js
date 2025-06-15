/**
 * Level Progression Manager Tests
 * Comprehensive test suite for the level progression system
 */

const { LevelProgressionManager } = require('./level-progression');

describe('LevelProgressionManager', () => {
  let progressionManager;

  beforeEach(() => {
    progressionManager = new LevelProgressionManager();
  });

  describe('Experience Table', () => {
    test('should have experience requirements for all levels 1-100', () => {
      for (let level = 1; level <= 100; level++) {
        const exp = progressionManager.getExperienceForLevel(level);
        expect(typeof exp).toBe('number');
        expect(exp).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have level 1 require 0 experience', () => {
      const exp = progressionManager.getExperienceForLevel(1);
      expect(exp).toBe(0);
    });

    test('should have increasing experience requirements', () => {
      for (let level = 2; level <= 100; level++) {
        const currentExp = progressionManager.getExperienceForLevel(level);
        const previousExp = progressionManager.getExperienceForLevel(level - 1);
        expect(currentExp).toBeGreaterThan(previousExp);
      }
    });

    test('should have reasonable early game progression', () => {
      // Level 2 should be achievable quickly
      const level2Exp = progressionManager.getExperienceForLevel(2);
      expect(level2Exp).toBeLessThan(1000);
      
      // Level 10 should be moderate
      const level10Exp = progressionManager.getExperienceForLevel(10);
      expect(level10Exp).toBeGreaterThan(level2Exp);
      expect(level10Exp).toBeLessThan(50000);
    });

    test('should have steep late game progression', () => {
      const level60Exp = progressionManager.getExperienceForLevel(60);
      const level90Exp = progressionManager.getExperienceForLevel(90);
      
      // Level 90 should require significantly more than level 60
      expect(level90Exp).toBeGreaterThan(level60Exp * 10);
    });
  });

  describe('Total Experience Calculation', () => {
    test('should calculate total experience correctly', () => {
      const totalToLevel5 = progressionManager.getTotalExperienceForLevel(5);
      
      let manualTotal = 0;
      for (let i = 2; i <= 5; i++) {
        manualTotal += progressionManager.getExperienceForLevel(i);
      }
      
      expect(totalToLevel5).toBe(manualTotal);
    });

    test('should return 0 for level 1', () => {
      const total = progressionManager.getTotalExperienceForLevel(1);
      expect(total).toBe(0);
    });

    test('should have reasonable total experience for campaign levels', () => {
      const totalToLevel60 = progressionManager.getTotalExperienceForLevel(60);
      expect(totalToLevel60).toBeGreaterThan(0);
      expect(totalToLevel60).toBeLessThan(100000000); // Should be achievable
    });
  });

  describe('Level From Experience', () => {
    test('should return correct level for various experience amounts', () => {
      expect(progressionManager.getLevelFromExperience(0)).toBe(1);
      
      const level2Exp = progressionManager.getExperienceForLevel(2);
      expect(progressionManager.getLevelFromExperience(level2Exp)).toBe(2);
      
      const totalToLevel5 = progressionManager.getTotalExperienceForLevel(5);
      expect(progressionManager.getLevelFromExperience(totalToLevel5)).toBe(5);
    });

    test('should handle partial experience correctly', () => {
      const totalToLevel5 = progressionManager.getTotalExperienceForLevel(5);
      const halfwayToLevel6 = totalToLevel5 + (progressionManager.getExperienceForLevel(6) / 2);
      
      expect(progressionManager.getLevelFromExperience(halfwayToLevel6)).toBe(5);
    });

    test('should cap at level 100', () => {
      const massiveExp = 999999999999;
      expect(progressionManager.getLevelFromExperience(massiveExp)).toBeLessThanOrEqual(100);
    });
  });

  describe('Experience Progress', () => {
    test('should calculate progress correctly within a level', () => {
      const totalToLevel5 = progressionManager.getTotalExperienceForLevel(5);
      const level6Requirement = progressionManager.getExperienceForLevel(6);
      const quarterProgress = totalToLevel5 + (level6Requirement * 0.25);
      
      const progress = progressionManager.getExperienceProgress(quarterProgress, 5);
      
      expect(progress.current).toBe(level6Requirement * 0.25);
      expect(progress.required).toBe(level6Requirement);
      expect(progress.percentage).toBeCloseTo(25, 1);
    });

    test('should handle complete level progress', () => {
      const totalToLevel5 = progressionManager.getTotalExperienceForLevel(5);
      const progress = progressionManager.getExperienceProgress(totalToLevel5, 5);
      
      expect(progress.current).toBe(0);
      expect(progress.percentage).toBe(0);
    });

    test('should handle max level correctly', () => {
      const totalToLevel100 = progressionManager.getTotalExperienceForLevel(100);
      const progress = progressionManager.getExperienceProgress(totalToLevel100, 100);
      
      expect(progress.percentage).toBe(100);
    });
  });

  describe('Experience Application', () => {
    test('should apply base experience without penalties', () => {
      const character = { level: 10 };
      const result = progressionManager.applyExperience(character, 1000, 'test_area', 10);
      
      expect(result.baseExperience).toBe(1000);
      expect(result.finalExperience).toBeGreaterThan(0);
      expect(result.multiplier).toBeGreaterThan(0);
    });

    test('should apply level difference penalties', () => {
      const character = { level: 20 };
      const result = progressionManager.applyExperience(character, 1000, 'test_area', 10);
      
      // Should have penalty for being 10 levels higher
      expect(result.finalExperience).toBeLessThan(result.baseExperience);
      expect(result.penalties.levelDifference).toBeGreaterThan(0);
    });

    test('should apply bonuses for challenging content', () => {
      const character = { level: 10 };
      const result = progressionManager.applyExperience(character, 1000, 'test_area', 25);
      
      // Should have bonus for facing higher level content
      expect(result.finalExperience).toBeGreaterThan(result.baseExperience);
      expect(result.bonuses.levelChallenge).toBeGreaterThan(0);
    });

    test('should apply area bonuses', () => {
      const character = { level: 65 };
      const result = progressionManager.applyExperience(character, 1000, 'maps_tier_1_5', 65);
      
      // Maps should give bonus experience
      expect(result.bonuses.areaBonus).toBeGreaterThan(0);
    });

    test('should not give negative experience', () => {
      const character = { level: 50 };
      const result = progressionManager.applyExperience(character, 1000, 'act_1_areas', 5);
      
      expect(result.finalExperience).toBeGreaterThan(0);
    });
  });

  describe('Content Access Control', () => {
    test('should allow access to appropriate level content', () => {
      const access = progressionManager.canAccessContent('act_2', 10);
      expect(access.canAccess).toBe(true);
    });

    test('should deny access to high level content', () => {
      const access = progressionManager.canAccessContent('maps_system', 30);
      expect(access.canAccess).toBe(false);
      expect(access.reason).toBe('level_too_low');
      expect(access.required).toBe(60);
    });

    test('should provide correct requirements information', () => {
      const access = progressionManager.canAccessContent('act_5', 25);
      expect(access.canAccess).toBe(false);
      expect(access.current).toBe(25);
      expect(access.required).toBe(32);
    });
  });

  describe('Content Recommendations', () => {
    test('should recommend appropriate content for level', () => {
      const recommendations = progressionManager.getRecommendedContent(15);
      
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(rec => rec.content.includes('act_2'))).toBe(true);
    });

    test('should prioritize optimal content', () => {
      const recommendations = progressionManager.getRecommendedContent(20);
      const optimal = recommendations.filter(rec => rec.priority === 'optimal');
      const available = recommendations.filter(rec => rec.priority === 'available');
      
      expect(optimal.length).toBeGreaterThan(0);
      expect(recommendations[0].priority).toBe('optimal');
    });

    test('should handle endgame recommendations', () => {
      const recommendations = progressionManager.getRecommendedContent(70);
      expect(recommendations.some(rec => rec.content.includes('maps'))).toBe(true);
    });
  });

  describe('Skill Point Rewards', () => {
    test('should give skill points for every level', () => {
      for (let level = 1; level <= 100; level++) {
        const points = progressionManager.getSkillPointsForLevel(level);
        expect(points).toBeGreaterThanOrEqual(level);
      }
    });

    test('should give bonus points at specific levels', () => {
      const level8Points = progressionManager.getSkillPointsForLevel(8);
      const level7Points = progressionManager.getSkillPointsForLevel(7);
      
      // Level 8 should have bonus from act 1 completion
      expect(level8Points - level7Points).toBeGreaterThan(1);
    });

    test('should have reasonable total skill points at level 60', () => {
      const level60Points = progressionManager.getSkillPointsForLevel(60);
      expect(level60Points).toBeGreaterThan(60);
      expect(level60Points).toBeLessThan(120); // Should be balanced
    });
  });

  describe('Level Up Rewards', () => {
    test('should calculate rewards for single level up', () => {
      const rewards = progressionManager.calculateLevelUpRewards(7, 8);
      
      expect(rewards.skillPoints).toBeGreaterThan(0);
      expect(rewards.newContent).toBeDefined();
      expect(rewards.questBonuses).toBeDefined();
    });

    test('should calculate rewards for multiple level ups', () => {
      const rewards = progressionManager.calculateLevelUpRewards(5, 10);
      
      expect(rewards.skillPoints).toBeGreaterThan(5);
    });

    test('should detect new content unlocks', () => {
      const rewards = progressionManager.calculateLevelUpRewards(59, 60);
      
      expect(rewards.newContent.length).toBeGreaterThan(0);
      expect(rewards.newContent.some(content => content.content === 'maps_system')).toBe(true);
    });
  });

  describe('Content Warnings', () => {
    test('should warn about overleveled content', () => {
      const warnings = progressionManager.getContentWarnings('act_1', 15);
      
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0].type).toBe('warning');
    });

    test('should not warn about appropriate level content', () => {
      const warnings = progressionManager.getContentWarnings('act_2', 12);
      
      expect(warnings.length).toBe(0);
    });
  });

  describe('Area Bonuses', () => {
    test('should apply bonuses for appropriate level areas', () => {
      const bonus = progressionManager.getAreaBonus('maps_tier_1_5', 65);
      expect(bonus).toBeGreaterThan(1.0);
    });

    test('should not apply bonuses for inappropriate level areas', () => {
      const bonus = progressionManager.getAreaBonus('maps_tier_1_5', 30);
      expect(bonus).toBe(1.0);
    });

    test('should give higher bonuses for higher tier content', () => {
      const tier1Bonus = progressionManager.getAreaBonus('maps_tier_1_5', 65);
      const tier16Bonus = progressionManager.getAreaBonus('maps_tier_16', 80);
      
      expect(tier16Bonus).toBeGreaterThan(tier1Bonus);
    });
  });

  describe('Progression Statistics', () => {
    test('should provide complete progression statistics', () => {
      const stats = progressionManager.getProgressionStats();
      
      expect(stats.maxLevel).toBe(100);
      expect(stats.campaignLevels).toBe(60);
      expect(stats.endgameLevels).toBe(40);
      expect(stats.totalExperienceRequired).toBeGreaterThan(0);
      expect(stats.averageTimePerLevel).toBeDefined();
    });

    test('should have reasonable time estimates', () => {
      const stats = progressionManager.getProgressionStats();
      
      expect(stats.averageTimePerLevel.early).toContain('minutes');
      expect(stats.averageTimePerLevel.endgame).toContain('hours');
    });
  });

  describe('Edge Cases', () => {
    test('should handle invalid level gracefully', () => {
      expect(progressionManager.getExperienceForLevel(0)).toBe(0);
      expect(progressionManager.getExperienceForLevel(-5)).toBe(0);
      expect(progressionManager.getExperienceForLevel(150)).toBe(0);
    });

    test('should handle negative experience gracefully', () => {
      const character = { level: 10 };
      const result = progressionManager.applyExperience(character, -1000, 'test_area', 10);
      
      expect(result.finalExperience).toBeGreaterThanOrEqual(0);
    });

    test('should handle non-existent content gracefully', () => {
      const access = progressionManager.canAccessContent('invalid_content', 50);
      expect(access.canAccess).toBe(true);
      
      const warnings = progressionManager.getContentWarnings('invalid_area', 50);
      expect(warnings).toEqual([]);
    });

    test('should handle extreme level differences', () => {
      const character = { level: 1 };
      const result = progressionManager.applyExperience(character, 1000, 'test_area', 100);
      
      expect(result.finalExperience).toBeGreaterThan(0);
      expect(result.multiplier).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    test('should handle large numbers of level calculations efficiently', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        progressionManager.getLevelFromExperience(Math.random() * 1000000);
        progressionManager.getExperienceProgress(Math.random() * 1000000, Math.floor(Math.random() * 100) + 1);
      }
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
    });

    test('should handle experience application efficiently', () => {
      const startTime = Date.now();
      const character = { level: 50 };
      
      for (let i = 0; i < 500; i++) {
        progressionManager.applyExperience(character, 1000, 'test_area', Math.floor(Math.random() * 100) + 1);
      }
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(50); // Should be very fast
    });
  });
});