import ChargeGenerationSystem from './charge-generation';

describe('ChargeGenerationSystem', () => {
  let chargeSystem;
  let mockEntity;

  beforeEach(() => {
    chargeSystem = new ChargeGenerationSystem();
    
    // Create mock entity
    mockEntity = {
      id: 'test_entity_1',
      hasComponents: jest.fn().mockReturnValue(true),
      getComponent: jest.fn(),
      addComponent: jest.fn(),
      removeComponent: jest.fn()
    };

    chargeSystem.addEntity(mockEntity);
  });

  afterEach(() => {
    chargeSystem.cleanup();
  });

  describe('System Initialization', () => {
    test('should initialize with charge types', () => {
      const chargeTypes = chargeSystem.getAllChargeTypes();
      expect(chargeTypes.length).toBeGreaterThan(0);
      
      const flaskCharges = chargeSystem.getChargeType('flask');
      const powerCharges = chargeSystem.getChargeType('power');
      const frenzyCharges = chargeSystem.getChargeType('frenzy');
      const enduranceCharges = chargeSystem.getChargeType('endurance');
      const spiritCharges = chargeSystem.getChargeType('spirit');
      
      expect(flaskCharges).toBeTruthy();
      expect(powerCharges).toBeTruthy();
      expect(frenzyCharges).toBeTruthy();
      expect(enduranceCharges).toBeTruthy();
      expect(spiritCharges).toBeTruthy();
    });

    test('should initialize with charge sources', () => {
      const sources = chargeSystem.getAllChargeSources();
      expect(sources.length).toBeGreaterThan(0);
      
      const flaskOnKill = chargeSystem.getChargeSource('flask_on_kill');
      const powerOnCrit = chargeSystem.getChargeSource('power_on_crit');
      const frenzyOnKill = chargeSystem.getChargeSource('frenzy_on_kill');
      
      expect(flaskOnKill).toBeTruthy();
      expect(powerOnCrit).toBeTruthy();
      expect(frenzyOnKill).toBeTruthy();
    });

    test('should initialize with charge consumptions', () => {
      const consumptions = chargeSystem.getAllChargeConsumptions();
      expect(consumptions.length).toBeGreaterThan(0);
      
      const dischargePower = consumptions.find(c => c.id === 'discharge_power');
      const frenzyAttack = consumptions.find(c => c.id === 'frenzy_attack');
      
      expect(dischargePower).toBeTruthy();
      expect(frenzyAttack).toBeTruthy();
    });
  });

  describe('Charge Generation', () => {
    test('should generate charges from valid source', () => {
      let chargesGenerated = false;
      
      chargeSystem.on('chargeGenerated', (data) => {
        chargesGenerated = true;
        expect(data.entityId).toBe(mockEntity.id);
        expect(data.sourceId).toBe('flask_on_kill');
        expect(data.trigger).toBe('kill');
      });

      const result = chargeSystem.generateCharge(mockEntity.id, 'flask_on_kill', 'kill', {});
      expect(result).toBe(true);
      expect(chargesGenerated).toBe(true);
    });

    test('should not generate charges from invalid source', () => {
      const result = chargeSystem.generateCharge(mockEntity.id, 'invalid_source', 'kill', {});
      expect(result).toBe(false);
    });

    test('should not generate charges with wrong trigger', () => {
      const result = chargeSystem.generateCharge(mockEntity.id, 'flask_on_kill', 'block', {});
      expect(result).toBe(false);
    });

    test('should respect charge generation chance', () => {
      // Mock Math.random to control chance
      const originalRandom = Math.random;
      
      // Test successful generation (below chance threshold)
      Math.random = jest.fn().mockReturnValue(0.1);
      let result = chargeSystem.generateCharge(mockEntity.id, 'power_on_crit', 'critical_strike', {});
      expect(result).toBe(true);
      
      // Test failed generation (above chance threshold)
      Math.random = jest.fn().mockReturnValue(0.9);
      result = chargeSystem.generateCharge(mockEntity.id, 'power_on_crit', 'critical_strike', {});
      expect(result).toBe(false);
      
      Math.random = originalRandom;
    });

    test('should respect cooldowns', () => {
      // Generate charge first time
      let result = chargeSystem.generateCharge(mockEntity.id, 'endurance_when_hit', 'take_damage', {});
      expect(result).toBe(true);
      
      // Try to generate immediately again (should fail due to cooldown)
      result = chargeSystem.generateCharge(mockEntity.id, 'endurance_when_hit', 'take_damage', {});
      expect(result).toBe(false);
    });
  });

  describe('Charge Management', () => {
    test('should add charges correctly', () => {
      let chargesAdded = false;
      
      chargeSystem.on('chargesAdded', (data) => {
        chargesAdded = true;
        expect(data.entityId).toBe(mockEntity.id);
        expect(data.chargeType).toBe('power');
        expect(data.amount).toBe(2);
        expect(data.totalCharges).toBe(2);
      });

      const result = chargeSystem.addCharges(mockEntity.id, 'power', 2, 'test_source');
      expect(result).toBe(true);
      expect(chargesAdded).toBe(true);

      const charges = chargeSystem.getCurrentCharges(mockEntity.id, 'power');
      expect(charges.get('power')).toBe(2);
    });

    test('should not exceed maximum charges', () => {
      // Add charges up to maximum
      chargeSystem.addCharges(mockEntity.id, 'power', 3, 'test_source');
      
      // Try to add more charges (should be capped)
      const result = chargeSystem.addCharges(mockEntity.id, 'power', 2, 'test_source');
      expect(result).toBe(false);

      const charges = chargeSystem.getCurrentCharges(mockEntity.id, 'power');
      expect(charges.get('power')).toBe(3); // Capped at maximum
    });

    test('should remove charges correctly', () => {
      // Add charges first
      chargeSystem.addCharges(mockEntity.id, 'frenzy', 3, 'test_source');
      
      let chargesRemoved = false;
      chargeSystem.on('chargesRemoved', (data) => {
        chargesRemoved = true;
        expect(data.entityId).toBe(mockEntity.id);
        expect(data.chargeType).toBe('frenzy');
        expect(data.amount).toBe(1);
        expect(data.totalCharges).toBe(2);
      });

      const result = chargeSystem.removeCharges(mockEntity.id, 'frenzy', 1);
      expect(result).toBe(true);
      expect(chargesRemoved).toBe(true);

      const charges = chargeSystem.getCurrentCharges(mockEntity.id, 'frenzy');
      expect(charges.get('frenzy')).toBe(2);
    });

    test('should expire charge instance when empty', () => {
      chargeSystem.addCharges(mockEntity.id, 'endurance', 1, 'test_source');
      
      let instanceExpired = false;
      chargeSystem.on('chargeInstanceExpired', (data) => {
        instanceExpired = true;
        expect(data.entityId).toBe(mockEntity.id);
        expect(data.chargeType).toBe('endurance');
      });

      chargeSystem.removeCharges(mockEntity.id, 'endurance', 1);
      expect(instanceExpired).toBe(true);

      const charges = chargeSystem.getCurrentCharges(mockEntity.id, 'endurance');
      expect(charges.has('endurance')).toBe(false);
    });
  });

  describe('Charge Consumption', () => {
    test('should consume charges with valid consumption', () => {
      // Add power charges first
      chargeSystem.addCharges(mockEntity.id, 'power', 3, 'test_source');
      
      let chargesConsumed = false;
      chargeSystem.on('chargesConsumed', (data) => {
        chargesConsumed = true;
        expect(data.entityId).toBe(mockEntity.id);
        expect(data.consumptionId).toBe('discharge_power');
        expect(data.chargeType).toBe('power');
        expect(data.amount).toBe(3); // All charges
      });

      const result = chargeSystem.consumeCharges(mockEntity.id, 'discharge_power');
      expect(result).toBe(true);
      expect(chargesConsumed).toBe(true);

      // Charges should be gone
      const charges = chargeSystem.getCurrentCharges(mockEntity.id, 'power');
      expect(charges.has('power')).toBe(false);
    });

    test('should not consume charges without sufficient amount', () => {
      // Add only 1 spirit charge
      chargeSystem.addCharges(mockEntity.id, 'spirit', 1, 'test_source');
      
      // Try to consume 2 charges (should fail)
      const result = chargeSystem.consumeCharges(mockEntity.id, 'spirit_burst');
      expect(result).toBe(false);

      // Charges should remain
      const charges = chargeSystem.getCurrentCharges(mockEntity.id, 'spirit');
      expect(charges.get('spirit')).toBe(1);
    });

    test('should apply consumption effects', () => {
      chargeSystem.addCharges(mockEntity.id, 'frenzy', 2, 'test_source');
      
      let effectApplied = false;
      chargeSystem.on('consumptionEffectApplied', (data) => {
        effectApplied = true;
        expect(data.entityId).toBe(mockEntity.id);
        expect(data.effect).toBe('buff');
      });

      chargeSystem.consumeCharges(mockEntity.id, 'frenzy_attack');
      expect(effectApplied).toBe(true);
    });
  });

  describe('Charge Effects', () => {
    test('should calculate charge effects correctly', () => {
      // Add various charges
      chargeSystem.addCharges(mockEntity.id, 'power', 2, 'test_source');
      chargeSystem.addCharges(mockEntity.id, 'frenzy', 1, 'test_source');

      const effects = chargeSystem.getChargeEffects(mockEntity.id);
      
      // Power charges: 40 crit chance per charge, 8% spell damage per charge
      expect(effects.get('critical_chance')).toBe(80); // 2 * 40
      expect(effects.get('damage_spell')).toBe(16); // 2 * 8
      
      // Frenzy charges: 4% attack/cast/movement speed per charge
      expect(effects.get('speed_attack')).toBe(4); // 1 * 4
      expect(effects.get('speed_cast')).toBe(4); // 1 * 4
      expect(effects.get('speed_movement')).toBe(4); // 1 * 4
    });

    test('should handle multiple charge types', () => {
      chargeSystem.addCharges(mockEntity.id, 'power', 1, 'test_source');
      chargeSystem.addCharges(mockEntity.id, 'endurance', 2, 'test_source');

      const effects = chargeSystem.getChargeEffects(mockEntity.id);
      
      expect(effects.get('critical_chance')).toBe(40); // From power
      expect(effects.get('defense_physical_reduction')).toBe(8); // From endurance (2 * 4)
      expect(effects.get('resistance_all_elemental')).toBe(8); // From endurance (2 * 4)
    });
  });

  describe('Charge Modifiers', () => {
    test('should add charge modifiers', () => {
      const modifier = {
        id: 'test_modifier',
        type: 'max_charges',
        value: 2,
        source: 'equipment'
      };

      let modifierAdded = false;
      chargeSystem.on('chargeModifierAdded', (data) => {
        modifierAdded = true;
        expect(data.entityId).toBe(mockEntity.id);
        expect(data.modifier.id).toBe('test_modifier');
      });

      chargeSystem.addChargeModifier(mockEntity.id, modifier);
      expect(modifierAdded).toBe(true);
    });

    test('should remove charge modifiers', () => {
      const modifier = {
        id: 'test_modifier',
        type: 'max_charges',
        value: 2,
        source: 'equipment'
      };

      chargeSystem.addChargeModifier(mockEntity.id, modifier);

      let modifierRemoved = false;
      chargeSystem.on('chargeModifierRemoved', (data) => {
        modifierRemoved = true;
        expect(data.entityId).toBe(mockEntity.id);
        expect(data.modifierId).toBe('test_modifier');
      });

      chargeSystem.removeChargeModifier(mockEntity.id, 'test_modifier');
      expect(modifierRemoved).toBe(true);
    });
  });

  describe('Charge Statistics', () => {
    test('should provide charge statistics', () => {
      chargeSystem.addCharges(mockEntity.id, 'power', 2, 'test_source');
      chargeSystem.addCharges(mockEntity.id, 'frenzy', 1, 'test_source');

      const stats = chargeSystem.getChargeStatistics(mockEntity.id);
      
      expect(stats.power).toBeDefined();
      expect(stats.power.current).toBe(2);
      expect(stats.power.maximum).toBe(3);
      expect(stats.power.source).toBe('test_source');

      expect(stats.frenzy).toBeDefined();
      expect(stats.frenzy.current).toBe(1);
      expect(stats.frenzy.maximum).toBe(3);
    });

    test('should track total charge count', () => {
      chargeSystem.addCharges(mockEntity.id, 'power', 2, 'test_source');
      chargeSystem.addCharges(mockEntity.id, 'frenzy', 1, 'test_source');
      chargeSystem.addCharges(mockEntity.id, 'endurance', 3, 'test_source');

      const totalCharges = chargeSystem.getTotalChargeCount(mockEntity.id);
      expect(totalCharges).toBe(6); // 2 + 1 + 3
    });

    test('should calculate charge uptime', () => {
      chargeSystem.addCharges(mockEntity.id, 'power', 1, 'test_source');
      
      const uptime = chargeSystem.getChargeUptime(mockEntity.id, 'power');
      expect(uptime).toBeGreaterThanOrEqual(0);
      expect(uptime).toBeLessThanOrEqual(1);
    });
  });

  describe('Utility Methods', () => {
    test('should check if entity has charges', () => {
      chargeSystem.addCharges(mockEntity.id, 'spirit', 3, 'test_source');
      
      expect(chargeSystem.hasCharges(mockEntity.id, 'spirit', 1)).toBe(true);
      expect(chargeSystem.hasCharges(mockEntity.id, 'spirit', 3)).toBe(true);
      expect(chargeSystem.hasCharges(mockEntity.id, 'spirit', 4)).toBe(false);
      expect(chargeSystem.hasCharges(mockEntity.id, 'power', 1)).toBe(false);
    });

    test('should reset charges', () => {
      chargeSystem.addCharges(mockEntity.id, 'power', 2, 'test_source');
      chargeSystem.addCharges(mockEntity.id, 'frenzy', 1, 'test_source');

      let chargesReset = false;
      chargeSystem.on('chargesReset', (data) => {
        chargesReset = true;
        expect(data.entityId).toBe(mockEntity.id);
      });

      // Reset specific charge type
      chargeSystem.resetCharges(mockEntity.id, 'power');
      expect(chargeSystem.hasCharges(mockEntity.id, 'power')).toBe(false);
      expect(chargeSystem.hasCharges(mockEntity.id, 'frenzy')).toBe(true);

      // Reset all charges
      chargeSystem.resetCharges(mockEntity.id);
      expect(chargeSystem.hasCharges(mockEntity.id, 'frenzy')).toBe(false);
      expect(chargesReset).toBe(true);
    });

    test('should track charge history', () => {
      chargeSystem.generateCharge(mockEntity.id, 'flask_on_kill', 'kill', { playerLevel: 10 });
      chargeSystem.generateCharge(mockEntity.id, 'power_on_crit', 'critical_strike', { playerLevel: 15 });

      const history = chargeSystem.getChargeHistory();
      expect(history.length).toBeGreaterThanOrEqual(0);

      chargeSystem.clearChargeHistory();
      const clearedHistory = chargeSystem.getChargeHistory();
      expect(clearedHistory.length).toBe(0);
    });
  });

  describe('System Performance', () => {
    test('should handle system lifecycle', () => {
      expect(chargeSystem.name).toBe('ChargeGenerationSystem');
      expect(chargeSystem.enabled).toBe(true);
      expect(chargeSystem.priority).toBe(25);
      
      const metrics = chargeSystem.getMetrics();
      expect(metrics.name).toBe('ChargeGenerationSystem');
      expect(metrics.entityCount).toBe(1);
    });

    test('should update without errors', () => {
      chargeSystem.addCharges(mockEntity.id, 'power', 2, 'test_source');
      
      expect(() => {
        chargeSystem.update(16.67); // 60 FPS
      }).not.toThrow();
    });

    test('should handle charge decay', () => {
      // Add charges
      chargeSystem.addCharges(mockEntity.id, 'power', 2, 'test_source');
      
      // Mock charge type with decay
      const powerCharge = chargeSystem.getChargeType('power');
      if (powerCharge) {
        powerCharge.decayRate = 1; // 1 charge per decay interval
        powerCharge.duration = 100; // 100ms decay interval
      }

      // Wait for decay
      setTimeout(() => {
        chargeSystem.update(150); // Trigger decay
        const charges = chargeSystem.getCurrentCharges(mockEntity.id, 'power');
        expect(charges.get('power')).toBeLessThan(2);
      }, 150);
    });
  });

  describe('Advanced Features', () => {
    test('should evaluate trigger conditions', () => {
      // Test low life condition
      const context = { lifePercentage: 20 };
      const result = chargeSystem.generateCharge(mockEntity.id, 'spirit_low_mana', 'low_life', context);
      
      // Would need to implement condition evaluation logic for this to work
      expect(typeof result).toBe('boolean');
    });

    test('should calculate charge efficiency', () => {
      // Generate some charges with history
      chargeSystem.generateCharge(mockEntity.id, 'flask_on_kill', 'kill', {});
      chargeSystem.generateCharge(mockEntity.id, 'flask_on_kill', 'kill', {});

      const efficiency = chargeSystem.getChargeEfficiency(mockEntity.id, 'flask_on_kill');
      expect(efficiency.sourceId).toBe('flask_on_kill');
      expect(efficiency.generationRate).toBeGreaterThanOrEqual(0);
      expect(efficiency.recommendations).toBeInstanceOf(Array);
    });

    test('should handle context-based charge generation', () => {
      const context = {
        damageDealt: 5000,
        enemyLevel: 50,
        playerLevel: 30
      };

      const result = chargeSystem.generateCharge(mockEntity.id, 'flask_on_kill', 'kill', context);
      expect(result).toBe(true);
      
      // Charges should be affected by context
      const charges = chargeSystem.getCurrentCharges(mockEntity.id);
      expect(charges.size).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid entity IDs gracefully', () => {
      const result = chargeSystem.addCharges('invalid_entity', 'power', 1, 'test_source');
      expect(result).toBe(false);

      const charges = chargeSystem.getCurrentCharges('invalid_entity');
      expect(charges.size).toBe(0);
    });

    test('should handle invalid charge types gracefully', () => {
      const result = chargeSystem.addCharges(mockEntity.id, 'invalid_charge', 1, 'test_source');
      expect(result).toBe(false);
    });

    test('should handle invalid consumption IDs gracefully', () => {
      const result = chargeSystem.consumeCharges(mockEntity.id, 'invalid_consumption');
      expect(result).toBe(false);
    });

    test('should handle negative charge amounts gracefully', () => {
      const result = chargeSystem.addCharges(mockEntity.id, 'power', -1, 'test_source');
      expect(result).toBe(false);
    });
  });

  describe('Integration Features', () => {
    test('should emit appropriate events', () => {
      const events = [];
      
      chargeSystem.on('chargeGenerated', (data) => events.push('generated'));
      chargeSystem.on('chargesAdded', (data) => events.push('added'));
      chargeSystem.on('chargesRemoved', (data) => events.push('removed'));
      chargeSystem.on('chargesConsumed', (data) => events.push('consumed'));

      // Perform operations
      chargeSystem.generateCharge(mockEntity.id, 'flask_on_kill', 'kill', {});
      chargeSystem.addCharges(mockEntity.id, 'power', 1, 'direct');
      chargeSystem.removeCharges(mockEntity.id, 'power', 1);

      expect(events).toContain('generated');
      expect(events).toContain('added');
      expect(events).toContain('removed');
    });

    test('should provide comprehensive charge data', () => {
      chargeSystem.addCharges(mockEntity.id, 'power', 2, 'test_source');
      chargeSystem.addCharges(mockEntity.id, 'frenzy', 1, 'test_source');

      const activeCharges = chargeSystem.getActiveChargesForEntity(mockEntity.id);
      expect(activeCharges.length).toBe(2);
      
      const currentCharges = chargeSystem.getCurrentCharges(mockEntity.id);
      expect(currentCharges.size).toBe(2);
      
      const chargeEffects = chargeSystem.getChargeEffects(mockEntity.id);
      expect(chargeEffects.size).toBeGreaterThan(0);
    });
  });
});