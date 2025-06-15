import EndgameBossSystem from './endgame-bosses';

describe('EndgameBossSystem', () => {
  let bossSystem;

  beforeEach(() => {
    bossSystem = new EndgameBossSystem();
  });

  afterEach(() => {
    bossSystem.cleanup();
  });

  describe('Boss Management', () => {
    test('should initialize with endgame bosses', () => {
      const bosses = bossSystem.getAllBosses();
      expect(bosses.length).toBeGreaterThan(0);
      
      // Check for key bosses
      const shaperBoss = bossSystem.getBoss('the_shaper');
      const elderBoss = bossSystem.getBoss('the_elder');
      const sirusBoss = bossSystem.getBoss('sirus');
      const mavenBoss = bossSystem.getBoss('maven');
      
      expect(shaperBoss).toBeTruthy();
      expect(elderBoss).toBeTruthy();
      expect(sirusBoss).toBeTruthy();
      expect(mavenBoss).toBeTruthy();
    });

    test('should get bosses by tier', () => {
      const tier16Bosses = bossSystem.getBossesByTier(16);
      expect(tier16Bosses.length).toBeGreaterThan(0);
      
      const tier20Bosses = bossSystem.getBossesByTier(20);
      expect(tier20Bosses.length).toBeGreaterThan(0);
    });

    test('should get bosses by type', () => {
      const shaperBosses = bossSystem.getBossesByType('shaper');
      const elderBosses = bossSystem.getBossesByType('elder');
      const sirusBosses = bossSystem.getBossesByType('sirus');
      const mavenBosses = bossSystem.getBossesByType('maven');
      
      expect(shaperBosses.length).toBe(1);
      expect(elderBosses.length).toBe(1);
      expect(sirusBosses.length).toBe(1);
      expect(mavenBosses.length).toBe(1);
    });

    test('should track unlocked bosses', () => {
      const initialUnlocked = bossSystem.getUnlockedBosses();
      expect(initialUnlocked.length).toBe(0);
      
      // Mock unlock boss (would need requirement checking)
      const shaperBoss = bossSystem.getBoss('the_shaper');
      if (shaperBoss) {
        shaperBoss.unlocked = true;
        const unlockedBosses = bossSystem.getUnlockedBosses();
        expect(unlockedBosses.length).toBe(1);
        expect(unlockedBosses[0].id).toBe('the_shaper');
      }
    });
  });

  describe('Boss Encounters', () => {
    test('should not start encounter with locked boss', () => {
      const result = bossSystem.startBossEncounter('the_shaper');
      expect(result).toBe(false);
      expect(bossSystem.getActiveEncounter()).toBeNull();
    });

    test('should start encounter with unlocked boss', () => {
      // Mock unlock boss
      const shaperBoss = bossSystem.getBoss('the_shaper');
      if (shaperBoss) {
        shaperBoss.unlocked = true;
        
        const result = bossSystem.startBossEncounter('the_shaper');
        expect(result).toBe(true);
        
        const activeEncounter = bossSystem.getActiveEncounter();
        expect(activeEncounter).toBeTruthy();
        expect(activeEncounter?.bossId).toBe('the_shaper');
        expect(activeEncounter?.started).toBe(true);
        expect(activeEncounter?.completed).toBe(false);
      }
    });

    test('should end encounter successfully', () => {
      // Mock unlock and start encounter
      const shaperBoss = bossSystem.getBoss('the_shaper');
      if (shaperBoss) {
        shaperBoss.unlocked = true;
        bossSystem.startBossEncounter('the_shaper');
        
        bossSystem.endBossEncounter(true);
        
        expect(bossSystem.getActiveEncounter()).toBeNull();
        expect(shaperBoss.defeated).toBe(true);
      }
    });

    test('should track encounter statistics', () => {
      const shaperBoss = bossSystem.getBoss('the_shaper');
      if (shaperBoss) {
        shaperBoss.unlocked = true;
        
        expect(shaperBoss.attempts).toBe(0);
        bossSystem.startBossEncounter('the_shaper');
        expect(shaperBoss.attempts).toBe(1);
        
        bossSystem.endBossEncounter(false);
        bossSystem.startBossEncounter('the_shaper');
        expect(shaperBoss.attempts).toBe(2);
      }
    });
  });

  describe('Boss Mechanics', () => {
    beforeEach(() => {
      // Setup active encounter for mechanics testing
      const shaperBoss = bossSystem.getBoss('the_shaper');
      if (shaperBoss) {
        shaperBoss.unlocked = true;
        bossSystem.startBossEncounter('the_shaper');
      }
    });

    test('should trigger boss mechanics', () => {
      let mechanicTriggered = false;
      
      bossSystem.on('mechanicTriggered', () => {
        mechanicTriggered = true;
      });
      
      bossSystem.triggerBossMechanic('bullet_hell');
      expect(mechanicTriggered).toBe(true);
      
      const encounter = bossSystem.getActiveEncounter();
      expect(encounter?.activeMechanics.has('bullet_hell')).toBe(true);
    });

    test('should transition boss phases', () => {
      let phaseChanged = false;
      
      bossSystem.on('bossPhaseChanged', (data) => {
        phaseChanged = true;
        expect(data.phaseIndex).toBe(1);
      });
      
      bossSystem.transitionBossPhase(1);
      expect(phaseChanged).toBe(true);
      
      const encounter = bossSystem.getActiveEncounter();
      expect(encounter?.currentPhase).toBe(1);
    });

    test('should clear active mechanics on phase transition', () => {
      bossSystem.triggerBossMechanic('bullet_hell');
      const encounter = bossSystem.getActiveEncounter();
      expect(encounter?.activeMechanics.has('bullet_hell')).toBe(true);
      
      bossSystem.transitionBossPhase(1);
      expect(encounter?.activeMechanics.size).toBe(0);
    });
  });

  describe('Boss Health and Damage', () => {
    test('should update boss health', () => {
      const shaperBoss = bossSystem.getBoss('the_shaper');
      if (shaperBoss) {
        const initialHealth = shaperBoss.stats.health;
        const newHealth = initialHealth - 10000;
        
        bossSystem.updateBossHealth('the_shaper', newHealth);
        expect(shaperBoss.stats.health).toBe(newHealth);
      }
    });

    test('should deal damage to boss', () => {
      const shaperBoss = bossSystem.getBoss('the_shaper');
      if (shaperBoss) {
        shaperBoss.unlocked = true;
        bossSystem.startBossEncounter('the_shaper');
        
        const initialHealth = shaperBoss.stats.health;
        const damage = 5000;
        
        bossSystem.dealDamageToBoss('the_shaper', damage);
        expect(shaperBoss.stats.health).toBe(initialHealth - damage);
        
        const encounter = bossSystem.getActiveEncounter();
        expect(encounter?.playerDamageDealt).toBe(damage);
      }
    });

    test('should end encounter when boss health reaches zero', () => {
      let bossDefeated = false;
      
      bossSystem.on('bossDefeated', () => {
        bossDefeated = true;
      });
      
      const shaperBoss = bossSystem.getBoss('the_shaper');
      if (shaperBoss) {
        shaperBoss.unlocked = true;
        bossSystem.startBossEncounter('the_shaper');
        
        bossSystem.dealDamageToBoss('the_shaper', shaperBoss.stats.maxHealth);
        
        expect(bossDefeated).toBe(true);
        expect(shaperBoss.defeated).toBe(true);
        expect(bossSystem.getActiveEncounter()).toBeNull();
      }
    });

    test('should reset boss state', () => {
      const shaperBoss = bossSystem.getBoss('the_shaper');
      if (shaperBoss) {
        shaperBoss.unlocked = true;
        bossSystem.startBossEncounter('the_shaper');
        bossSystem.dealDamageToBoss('the_shaper', 50000);
        bossSystem.endBossEncounter(true);
        
        expect(shaperBoss.defeated).toBe(true);
        expect(shaperBoss.attempts).toBeGreaterThan(0);
        
        bossSystem.resetBoss('the_shaper');
        
        expect(shaperBoss.defeated).toBe(false);
        expect(shaperBoss.attempts).toBe(0);
        expect(shaperBoss.stats.health).toBe(shaperBoss.stats.maxHealth);
        expect(shaperBoss.bestTime).toBeUndefined();
      }
    });
  });

  describe('Boss Stats and Resistances', () => {
    test('should have proper boss resistances', () => {
      const shaperBoss = bossSystem.getBoss('the_shaper');
      if (shaperBoss) {
        const stats = bossSystem.getBossStats('the_shaper');
        expect(stats).toBeTruthy();
        expect(stats?.resistance.fire).toBe(40);
        expect(stats?.resistance.cold).toBe(40);
        expect(stats?.resistance.lightning).toBe(40);
        expect(stats?.resistance.chaos).toBe(75);
        expect(stats?.immunities).toContain('stun');
        expect(stats?.immunities).toContain('freeze');
      }
    });

    test('should have different stats per boss type', () => {
      const shaperStats = bossSystem.getBossStats('the_shaper');
      const elderStats = bossSystem.getBossStats('the_elder');
      const sirusStats = bossSystem.getBossStats('sirus');
      const mavenStats = bossSystem.getBossStats('maven');
      
      expect(shaperStats?.maxHealth).toBe(500000);
      expect(elderStats?.maxHealth).toBe(750000);
      expect(sirusStats?.maxHealth).toBe(1500000);
      expect(mavenStats?.maxHealth).toBe(2500000);
      
      // Check progression in damage
      expect(sirusStats?.damage).toBeGreaterThan(shaperStats?.damage || 0);
      expect(mavenStats?.damage).toBeGreaterThan(sirusStats?.damage || 0);
    });
  });

  describe('Boss Phases', () => {
    test('should have correct phase structure', () => {
      const shaperBoss = bossSystem.getBoss('the_shaper');
      expect(shaperBoss?.phases.length).toBe(3);
      
      const phase1 = shaperBoss?.phases[0];
      const phase2 = shaperBoss?.phases[1];
      const phase3 = shaperBoss?.phases[2];
      
      expect(phase1?.healthThreshold).toBe(1.0);
      expect(phase2?.healthThreshold).toBe(0.66);
      expect(phase3?.healthThreshold).toBe(0.33);
      
      expect(phase2?.transitionEffect).toBe('screen_shake');
      expect(phase3?.specialEffects).toContain('enrage');
    });

    test('should have unique mechanics per phase', () => {
      const sirusBoss = bossSystem.getBoss('sirus');
      expect(sirusBoss?.phases.length).toBe(4);
      
      const finalPhase = sirusBoss?.phases[3];
      expect(finalPhase?.mechanics).toContain('die_beam');
      expect(finalPhase?.mechanics).toContain('meteor_maze');
      expect(finalPhase?.mechanics).toContain('corridor_storm');
      expect(finalPhase?.specialEffects).toContain('reality_collapse');
    });
  });

  describe('Boss Rewards', () => {
    test('should have appropriate rewards per boss', () => {
      const shaperBoss = bossSystem.getBoss('the_shaper');
      const rewards = shaperBoss?.rewards;
      
      expect(rewards?.length).toBeGreaterThan(0);
      
      const uniqueReward = rewards?.find(r => r.type === 'unique_item');
      const atlasReward = rewards?.find(r => r.type === 'atlas_points');
      
      expect(uniqueReward).toBeTruthy();
      expect(uniqueReward?.name).toBe('Starforge');
      expect(uniqueReward?.rarity).toBe('very_rare');
      
      expect(atlasReward).toBeTruthy();
      expect(atlasReward?.rarity).toBe('guaranteed');
    });

    test('should have scaling rewards by boss difficulty', () => {
      const shaperRewards = bossSystem.getBoss('the_shaper')?.rewards;
      const mavenRewards = bossSystem.getBoss('maven')?.rewards;
      
      const shaperAtlasPoints = shaperRewards?.find(r => r.type === 'atlas_points')?.quantity || 0;
      const mavenAtlasPoints = mavenRewards?.find(r => r.type === 'atlas_points')?.quantity || 0;
      
      expect(mavenAtlasPoints).toBeGreaterThan(shaperAtlasPoints);
    });
  });

  describe('System Performance', () => {
    test('should handle system lifecycle', () => {
      expect(bossSystem.name).toBe('EndgameBossSystem');
      expect(bossSystem.enabled).toBe(true);
      expect(bossSystem.priority).toBe(20);
      
      const metrics = bossSystem.getMetrics();
      expect(metrics.name).toBe('EndgameBossSystem');
      expect(metrics.entityCount).toBe(0);
    });

    test('should update without errors when no active encounter', () => {
      expect(() => {
        bossSystem.update(16.67); // 60 FPS
      }).not.toThrow();
    });

    test('should update active encounter properly', () => {
      const shaperBoss = bossSystem.getBoss('the_shaper');
      if (shaperBoss) {
        shaperBoss.unlocked = true;
        bossSystem.startBossEncounter('the_shaper');
        
        expect(() => {
          bossSystem.update(16.67);
        }).not.toThrow();
      }
    });
  });

  describe('Event System', () => {
    test('should emit boss events', (done) => {
      let eventsReceived = 0;
      const expectedEvents = 2;
      
      bossSystem.on('bossEncounterStarted', (data) => {
        expect(data.bossId).toBe('the_shaper');
        eventsReceived++;
        if (eventsReceived === expectedEvents) done();
      });
      
      bossSystem.on('bossDefeated', (data) => {
        expect(data.boss.id).toBe('the_shaper');
        eventsReceived++;
        if (eventsReceived === expectedEvents) done();
      });
      
      const shaperBoss = bossSystem.getBoss('the_shaper');
      if (shaperBoss) {
        shaperBoss.unlocked = true;
        bossSystem.startBossEncounter('the_shaper');
        bossSystem.dealDamageToBoss('the_shaper', shaperBoss.stats.maxHealth);
      }
    });

    test('should emit mechanic events', (done) => {
      bossSystem.on('mechanicTriggered', (data) => {
        expect(data.mechanicId).toBe('bullet_hell');
        done();
      });
      
      const shaperBoss = bossSystem.getBoss('the_shaper');
      if (shaperBoss) {
        shaperBoss.unlocked = true;
        bossSystem.startBossEncounter('the_shaper');
        bossSystem.triggerBossMechanic('bullet_hell');
      }
    });
  });

  describe('Pinnacle Content', () => {
    test('should check pinnacle access requirements', () => {
      // These would typically be false until requirements are met
      const shaperAccess = bossSystem.checkPinnacleAccess('shaper_set');
      const mavenAccess = bossSystem.checkPinnacleAccess('maven_set');
      
      expect(typeof shaperAccess).toBe('boolean');
      expect(typeof mavenAccess).toBe('boolean');
    });

    test('should grant pinnacle fragments', () => {
      let fragmentGranted = false;
      
      bossSystem.on('pinnacleFragmentGranted', (data) => {
        fragmentGranted = true;
        expect(data.fragment).toBeTruthy();
      });
      
      bossSystem.grantPinnacleFragment('fragment_of_the_minotaur');
      expect(fragmentGranted).toBe(true);
    });
  });
});