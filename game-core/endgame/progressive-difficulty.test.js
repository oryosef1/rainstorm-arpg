import ProgressiveDifficultySystem from './progressive-difficulty';

describe('ProgressiveDifficultySystem', () => {
  let difficultySystem;

  beforeEach(() => {
    difficultySystem = new ProgressiveDifficultySystem();
  });

  afterEach(() => {
    difficultySystem.cleanup();
  });

  describe('Difficulty Tier Management', () => {
    test('should initialize with difficulty tiers', () => {
      const tiers = difficultySystem.getAllDifficultyTiers();
      expect(tiers.length).toBe(4);
      
      const normalTier = difficultySystem.getDifficultyTier(1);
      const cruelTier = difficultySystem.getDifficultyTier(2);
      const mercilessTier = difficultySystem.getDifficultyTier(3);
      const mapsTier = difficultySystem.getDifficultyTier(4);
      
      expect(normalTier?.name).toBe('Normal');
      expect(cruelTier?.name).toBe('Cruel');
      expect(mercilessTier?.name).toBe('Merciless');
      expect(mapsTier?.name).toBe('Maps');
    });

    test('should start with normal tier unlocked', () => {
      const unlockedTiers = difficultySystem.getUnlockedTiers();
      expect(unlockedTiers.length).toBe(1);
      expect(unlockedTiers[0].level).toBe(1);
      expect(unlockedTiers[0].name).toBe('Normal');
    });

    test('should not allow setting locked difficulty tier', () => {
      const result = difficultySystem.setDifficultyTier(2);
      expect(result).toBe(false);
      
      const currentTier = difficultySystem.getCurrentDifficultyTier();
      expect(currentTier?.level).toBe(1);
    });

    test('should allow setting unlocked difficulty tier', () => {
      // Unlock cruel tier manually for testing
      const cruelTier = difficultySystem.getDifficultyTier(2);
      if (cruelTier) {
        cruelTier.unlocked = true;
        
        const result = difficultySystem.setDifficultyTier(2);
        expect(result).toBe(true);
        
        const currentTier = difficultySystem.getCurrentDifficultyTier();
        expect(currentTier?.level).toBe(2);
      }
    });

    test('should unlock next tier when requirements are met', () => {
      // Update requirements for cruel tier
      difficultySystem.updateRequirementProgress('level', 30);
      
      const unlocked = difficultySystem.unlockNextTier();
      expect(unlocked).toBe(true);
      
      const cruelTier = difficultySystem.getDifficultyTier(2);
      expect(cruelTier?.unlocked).toBe(true);
      
      const progression = difficultySystem.getDifficultyProgression();
      expect(progression.maxTierReached).toBe(2);
    });

    test('should not unlock next tier when requirements are not met', () => {
      const unlocked = difficultySystem.unlockNextTier();
      expect(unlocked).toBe(false);
      
      const cruelTier = difficultySystem.getDifficultyTier(2);
      expect(cruelTier?.unlocked).toBe(false);
    });
  });

  describe('Difficulty Scaling', () => {
    test('should have base scaling values', () => {
      const scaling = difficultySystem.getCurrentScaling();
      expect(scaling.monsterLife).toBe(1.0);
      expect(scaling.monsterDamage).toBe(1.0);
      expect(scaling.experienceMultiplier).toBe(1.0);
      expect(scaling.lootQuantity).toBe(1.0);
    });

    test('should apply scaling when difficulty tier changes', () => {
      let scalingApplied = false;
      
      difficultySystem.on('difficultyScalingApplied', () => {
        scalingApplied = true;
      });
      
      // Unlock and set cruel tier
      const cruelTier = difficultySystem.getDifficultyTier(2);
      if (cruelTier) {
        cruelTier.unlocked = true;
        difficultySystem.setDifficultyTier(2);
        
        expect(scalingApplied).toBe(true);
        
        const scaling = difficultySystem.getCurrentScaling();
        expect(scaling.monsterLife).toBeGreaterThan(1.0);
        expect(scaling.monsterDamage).toBeGreaterThan(1.0);
      }
    });

    test('should provide reward scaling information', () => {
      const rewardScaling = difficultySystem.getRewardScaling();
      expect(rewardScaling.experience).toBeDefined();
      expect(rewardScaling.loot).toBeDefined();
      expect(rewardScaling.currency).toBeDefined();
    });
  });

  describe('Tier Completion', () => {
    test('should complete tier and update progression', () => {
      let tierCompleted = false;
      
      difficultySystem.on('difficultyTierCompleted', (data) => {
        tierCompleted = true;
        expect(data.tier).toBe(1);
        expect(data.completionTime).toBe(60000);
        expect(data.score).toBe(1000);
      });
      
      difficultySystem.completeTier(1, 60000, 1000);
      
      expect(tierCompleted).toBe(true);
      
      const normalTier = difficultySystem.getDifficultyTier(1);
      expect(normalTier?.completed).toBe(true);
      expect(normalTier?.completionTime).toBe(60000);
      expect(normalTier?.bestScore).toBe(1000);
      
      const progression = difficultySystem.getDifficultyProgression();
      expect(progression.totalCompletions).toBe(1);
      expect(progression.totalAttempts).toBe(1);
    });

    test('should update best time and score', () => {
      difficultySystem.completeTier(1, 60000, 1000);
      difficultySystem.completeTier(1, 45000, 1200);
      
      const normalTier = difficultySystem.getDifficultyTier(1);
      expect(normalTier?.bestScore).toBe(1200);
      
      const progression = difficultySystem.getDifficultyProgression();
      expect(progression.bestOverallTime).toBe(45000);
    });

    test('should calculate average completion time', () => {
      difficultySystem.completeTier(1, 60000, 1000);
      difficultySystem.completeTier(1, 40000, 1100);
      
      const progression = difficultySystem.getDifficultyProgression();
      expect(progression.averageTime).toBe(50000);
    });
  });

  describe('Challenge System', () => {
    test('should initialize with challenges', () => {
      const challenges = difficultySystem.getAllChallenges();
      expect(challenges.length).toBeGreaterThan(0);
      
      const speedRun = difficultySystem.getChallenge('speed_run');
      const survival = difficultySystem.getChallenge('survival_gauntlet');
      const bossRush = difficultySystem.getChallenge('boss_rush');
      
      expect(speedRun?.name).toBe('Speed Run Challenge');
      expect(survival?.name).toBe('Survival Gauntlet');
      expect(bossRush?.name).toBe('Boss Rush');
    });

    test('should start challenge successfully', () => {
      let challengeStarted = false;
      
      difficultySystem.on('challengeStarted', (data) => {
        challengeStarted = true;
        expect(data.challengeId).toBe('speed_run');
      });
      
      const result = difficultySystem.startChallenge('speed_run');
      expect(result).toBe(true);
      expect(challengeStarted).toBe(true);
      
      const activeChallenge = difficultySystem.getActiveChallenge();
      expect(activeChallenge?.id).toBe('speed_run');
      expect(activeChallenge?.active).toBe(true);
    });

    test('should not start challenge when one is already active', () => {
      difficultySystem.startChallenge('speed_run');
      const result = difficultySystem.startChallenge('survival_gauntlet');
      expect(result).toBe(false);
    });

    test('should update challenge objectives', () => {
      difficultySystem.startChallenge('speed_run');
      
      let objectiveCompleted = false;
      difficultySystem.on('challengeObjectiveCompleted', () => {
        objectiveCompleted = true;
      });
      
      // Update progress towards killing 100 enemies
      difficultySystem.updateChallengeObjective('kill_100_enemies', 50);
      difficultySystem.updateChallengeObjective('kill_100_enemies', 50);
      
      expect(objectiveCompleted).toBe(true);
    });

    test('should end challenge when all objectives completed', () => {
      let challengeEnded = false;
      
      difficultySystem.on('challengeEnded', (data) => {
        challengeEnded = true;
        expect(data.successful).toBe(true);
      });
      
      difficultySystem.startChallenge('speed_run');
      difficultySystem.updateChallengeObjective('kill_100_enemies', 100);
      
      expect(challengeEnded).toBe(true);
      expect(difficultySystem.getActiveChallenge()).toBeNull();
    });

    test('should end challenge on timeout', (done) => {
      // Mock a very short duration challenge for testing
      const speedRun = difficultySystem.getChallenge('speed_run');
      if (speedRun) {
        speedRun.duration = 100; // 100ms
        
        difficultySystem.on('challengeEnded', (data) => {
          expect(data.successful).toBe(false);
          done();
        });
        
        difficultySystem.startChallenge('speed_run');
        
        // Wait for timeout
        setTimeout(() => {
          difficultySystem.update(16.67);
        }, 150);
      }
    });
  });

  describe('Endless Mode', () => {
    test('should start endless mode', () => {
      let endlessStarted = false;
      
      difficultySystem.on('endlessModeStarted', (data) => {
        endlessStarted = true;
        expect(data.scaling.waveNumber).toBe(1);
      });
      
      difficultySystem.startEndlessMode();
      expect(endlessStarted).toBe(true);
      
      const scaling = difficultySystem.getEndlessScaling();
      expect(scaling.waveNumber).toBe(1);
      expect(scaling.rewardMultiplier).toBe(1.0);
    });

    test('should advance waves and scale difficulty', () => {
      difficultySystem.startEndlessMode();
      
      let waveAdvanced = false;
      difficultySystem.on('endlessWaveAdvanced', (data) => {
        waveAdvanced = true;
        expect(data.wave).toBe(2);
      });
      
      difficultySystem.advanceEndlessWave();
      expect(waveAdvanced).toBe(true);
      
      const scaling = difficultySystem.getEndlessScaling();
      expect(scaling.waveNumber).toBe(2);
      expect(scaling.enemyHealthMultiplier).toBeGreaterThan(1.0);
      expect(scaling.rewardMultiplier).toBeGreaterThan(1.0);
    });

    test('should scale exponentially with wave number', () => {
      difficultySystem.startEndlessMode();
      
      // Advance multiple waves
      for (let i = 0; i < 10; i++) {
        difficultySystem.advanceEndlessWave();
      }
      
      const scaling = difficultySystem.getEndlessScaling();
      expect(scaling.waveNumber).toBe(11);
      expect(scaling.enemyHealthMultiplier).toBeGreaterThan(2.0);
      expect(scaling.enemyDamageMultiplier).toBeGreaterThan(2.0);
      expect(scaling.rewardMultiplier).toBeGreaterThan(3.0);
    });

    test('should end endless mode and grant rewards', () => {
      let endlessEnded = false;
      
      difficultySystem.on('endlessModeEnded', (data) => {
        endlessEnded = true;
        expect(data.finalWave).toBe(5);
        expect(data.score).toBe(1000);
      });
      
      difficultySystem.startEndlessMode();
      difficultySystem.endEndlessMode(5, 1000);
      
      expect(endlessEnded).toBe(true);
      
      const scaling = difficultySystem.getEndlessScaling();
      expect(scaling.waveNumber).toBe(1); // Reset
    });
  });

  describe('Leaderboard System', () => {
    test('should add entries to leaderboard', () => {
      difficultySystem.startChallenge('speed_run');
      
      let leaderboardUpdated = false;
      difficultySystem.on('leaderboardUpdated', (data) => {
        leaderboardUpdated = true;
        expect(data.challengeId).toBe('speed_run');
        expect(data.rank).toBe(1);
      });
      
      // Complete challenge to trigger leaderboard entry
      difficultySystem.updateChallengeObjective('kill_100_enemies', 100);
      
      expect(leaderboardUpdated).toBe(true);
      
      const leaderboard = difficultySystem.getLeaderboard('speed_run');
      expect(leaderboard.length).toBe(1);
    });

    test('should sort leaderboard by score', () => {
      const speedRun = difficultySystem.getChallenge('speed_run');
      if (speedRun) {
        // Manually add leaderboard entries for testing
        speedRun.leaderboard = [
          {
            playerId: 'player1',
            playerName: 'Player 1',
            score: 800,
            time: 120000,
            tier: 1,
            date: Date.now(),
            modifiers: []
          },
          {
            playerId: 'player2',
            playerName: 'Player 2',
            score: 1200,
            time: 90000,
            tier: 1,
            date: Date.now(),
            modifiers: []
          }
        ];
        
        speedRun.leaderboard.sort((a, b) => b.score - a.score);
        
        const leaderboard = difficultySystem.getLeaderboard('speed_run');
        expect(leaderboard[0].score).toBe(1200);
        expect(leaderboard[1].score).toBe(800);
      }
    });
  });

  describe('Requirement Tracking', () => {
    test('should update requirement progress', () => {
      let progressUpdated = false;
      
      difficultySystem.on('requirementProgressUpdated', (data) => {
        progressUpdated = true;
        expect(data.requirementType).toBe('level');
        expect(data.progress).toBe(25);
      });
      
      difficultySystem.updateRequirementProgress('level', 25);
      expect(progressUpdated).toBe(true);
      
      // Check that relevant requirements were updated
      const cruelTier = difficultySystem.getDifficultyTier(2);
      const levelReq = cruelTier?.requirements.find(req => req.type === 'level');
      expect(levelReq?.currentValue).toBe(25);
    });

    test('should mark requirements as completed when target reached', () => {
      difficultySystem.updateRequirementProgress('level', 35);
      
      const cruelTier = difficultySystem.getDifficultyTier(2);
      const levelReq = cruelTier?.requirements.find(req => req.type === 'level');
      expect(levelReq?.completed).toBe(true);
    });
  });

  describe('Reward System', () => {
    test('should grant tier rewards on completion', () => {
      let rewardGranted = false;
      
      difficultySystem.on('difficultyRewardGranted', (data) => {
        rewardGranted = true;
        expect(data.tier).toBe(1);
        expect(data.value).toBeGreaterThan(0);
      });
      
      difficultySystem.completeTier(1, 60000, 1000);
      expect(rewardGranted).toBe(true);
    });

    test('should grant streak bonuses', () => {
      let streakBonus = false;
      
      difficultySystem.on('streakBonusGranted', (data) => {
        streakBonus = true;
        expect(data.streak).toBeGreaterThanOrEqual(5);
      });
      
      // Complete multiple tiers quickly to build streak
      for (let i = 0; i < 6; i++) {
        difficultySystem.completeTier(1, 60000, 1000);
      }
      
      expect(streakBonus).toBe(true);
    });

    test('should grant challenge rewards', () => {
      let challengeReward = false;
      
      difficultySystem.on('challengeRewardGranted', (data) => {
        challengeReward = true;
        expect(data.score).toBeGreaterThan(0);
      });
      
      difficultySystem.startChallenge('speed_run');
      difficultySystem.updateChallengeObjective('kill_100_enemies', 100);
      
      expect(challengeReward).toBe(true);
    });
  });

  describe('System Performance', () => {
    test('should handle system lifecycle', () => {
      expect(difficultySystem.name).toBe('ProgressiveDifficultySystem');
      expect(difficultySystem.enabled).toBe(true);
      expect(difficultySystem.priority).toBe(15);
      
      const metrics = difficultySystem.getMetrics();
      expect(metrics.name).toBe('ProgressiveDifficultySystem');
      expect(metrics.entityCount).toBe(0);
    });

    test('should update without errors', () => {
      expect(() => {
        difficultySystem.update(16.67); // 60 FPS
      }).not.toThrow();
    });

    test('should update active challenge during update cycle', () => {
      difficultySystem.startChallenge('speed_run');
      
      expect(() => {
        difficultySystem.update(16.67);
      }).not.toThrow();
    });
  });

  describe('Progression Reset', () => {
    test('should reset progression completely', () => {
      // Make some progress first
      difficultySystem.updateRequirementProgress('level', 30);
      difficultySystem.unlockNextTier();
      difficultySystem.completeTier(1, 60000, 1000);
      
      let progressionReset = false;
      difficultySystem.on('progressionReset', () => {
        progressionReset = true;
      });
      
      difficultySystem.resetProgression();
      expect(progressionReset).toBe(true);
      
      const progression = difficultySystem.getDifficultyProgression();
      expect(progression.currentTier).toBe(1);
      expect(progression.maxTierReached).toBe(1);
      expect(progression.totalCompletions).toBe(0);
      
      const unlockedTiers = difficultySystem.getUnlockedTiers();
      expect(unlockedTiers.length).toBe(1);
      expect(unlockedTiers[0].level).toBe(1);
    });
  });

  describe('Event System', () => {
    test('should emit tier events', (done) => {
      let eventsReceived = 0;
      const expectedEvents = 2;
      
      difficultySystem.on('difficultyTierUnlocked', (data) => {
        expect(data.tier).toBe(2);
        eventsReceived++;
        if (eventsReceived === expectedEvents) done();
      });
      
      difficultySystem.on('difficultyTierChanged', (data) => {
        expect(data.tier).toBe(2);
        eventsReceived++;
        if (eventsReceived === expectedEvents) done();
      });
      
      difficultySystem.updateRequirementProgress('level', 30);
      difficultySystem.unlockNextTier();
      difficultySystem.setDifficultyTier(2);
    });

    test('should emit challenge events', (done) => {
      difficultySystem.on('challengeStarted', (data) => {
        expect(data.challengeId).toBe('speed_run');
        done();
      });
      
      difficultySystem.startChallenge('speed_run');
    });

    test('should emit endless mode events', (done) => {
      difficultySystem.on('endlessModeStarted', (data) => {
        expect(data.scaling).toBeDefined();
        done();
      });
      
      difficultySystem.startEndlessMode();
    });
  });
});