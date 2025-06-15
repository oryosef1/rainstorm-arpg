// Flask System Tests

const { FlaskSystem } = require('./flask-system');

describe('FlaskSystem', () => {
  let flaskSystem;

  beforeEach(() => {
    flaskSystem = new FlaskSystem({
      maxFlaskSlots: 5,
      globalCooldown: 100,
      chargeRecoveryRate: 1.0
    });
  });

  afterEach(() => {
    if (flaskSystem) {
      flaskSystem.destroy();
    }
  });

  describe('Initialization', () => {
    test('should initialize with correct number of flask slots', () => {
      const slots = flaskSystem.getFlaskSlots();
      expect(slots).toHaveLength(5);
      
      slots.forEach((slot, index) => {
        expect(slot.slotId).toBe(index);
        expect(slot.flask).toBeNull();
        expect(slot.enabled).toBe(true);
        expect(slot.keybind).toBe(`${index + 1}`);
      });
    });

    test('should have flask base types available', () => {
      const bases = flaskSystem.getFlaskBases();
      expect(bases.length).toBeGreaterThan(0);
      expect(bases).toContain('small_life_flask');
      expect(bases).toContain('medium_mana_flask');
      expect(bases).toContain('small_hybrid_flask');
    });
  });

  describe('Flask Generation', () => {
    test('should generate normal flask correctly', () => {
      const flask = flaskSystem.generateFlask('small_life_flask', 1, 'normal');
      
      expect(flask).toBeTruthy();
      expect(flask.name).toBe('Small Life Flask');
      expect(flask.type).toBe('life');
      expect(flask.rarity).toBe('normal');
      expect(flask.recoveryAmount).toBe(70);
      expect(flask.charges.maximum).toBe(7);
      expect(flask.suffixes).toHaveLength(0);
      expect(flask.prefixes).toHaveLength(0);
    });

    test('should generate magic flask with modifiers', () => {
      // Generate multiple flasks to test randomness
      let hasModifiers = false;
      
      for (let i = 0; i < 10; i++) {
        const flask = flaskSystem.generateFlask('medium_life_flask', 10, 'magic');
        
        if (flask.suffixes.length > 0 || flask.prefixes.length > 0) {
          hasModifiers = true;
          expect(flask.rarity).toBe('magic');
          break;
        }
      }
      
      expect(hasModifiers).toBe(true);
    });

    test('should generate rare flask with multiple modifiers', () => {
      const flask = flaskSystem.generateFlask('large_life_flask', 20, 'rare');
      
      expect(flask).toBeTruthy();
      expect(flask.rarity).toBe('rare');
      expect(flask.suffixes.length + flask.prefixes.length).toBeGreaterThanOrEqual(2);
      expect(flask.name).not.toBe('Large Life Flask'); // Should have rare name
    });

    test('should return null for invalid base type', () => {
      const flask = flaskSystem.generateFlask('invalid_flask', 1);
      expect(flask).toBeNull();
    });
  });

  describe('Flask Equipment', () => {
    test('should equip flask to slot', () => {
      const flask = flaskSystem.generateFlask('small_life_flask', 1);
      const result = flaskSystem.equipFlask(0, flask);
      
      expect(result).toBe(true);
      
      const slot = flaskSystem.getFlaskSlot(0);
      expect(slot.flask).toBeTruthy();
      expect(slot.flask.flask.id).toBe(flask.id);
      expect(slot.flask.currentCharges).toBe(flask.charges.current);
    });

    test('should not equip to invalid slot', () => {
      const flask = flaskSystem.generateFlask('small_life_flask', 1);
      const result = flaskSystem.equipFlask(10, flask);
      
      expect(result).toBe(false);
    });

    test('should unequip flask from slot', () => {
      const flask = flaskSystem.generateFlask('small_mana_flask', 1);
      flaskSystem.equipFlask(1, flask);
      
      const unequipped = flaskSystem.unequipFlask(1);
      
      expect(unequipped).toBeTruthy();
      expect(unequipped.id).toBe(flask.id);
      
      const slot = flaskSystem.getFlaskSlot(1);
      expect(slot.flask).toBeNull();
    });

    test('should return null when unequipping empty slot', () => {
      const result = flaskSystem.unequipFlask(0);
      expect(result).toBeNull();
    });
  });

  describe('Flask Usage', () => {
    test('should use flask and apply recovery', (done) => {
      const flask = flaskSystem.generateFlask('small_life_flask', 1);
      flaskSystem.equipFlask(0, flask);
      
      flaskSystem.on('life-recovery', (data) => {
        expect(data.amount).toBe(70);
        expect(data.source).toBe('flask');
        expect(data.instant).toBe(true);
        done();
      });
      
      const result = flaskSystem.useFlask(0);
      expect(result).toBe(true);
    });

    test('should consume charges when using flask', () => {
      const flask = flaskSystem.generateFlask('medium_mana_flask', 1);
      flaskSystem.equipFlask(0, flask);
      
      const initialCharges = flaskSystem.getFlaskSlot(0).flask.currentCharges;
      flaskSystem.useFlask(0);
      const finalCharges = flaskSystem.getFlaskSlot(0).flask.currentCharges;
      
      expect(finalCharges).toBe(initialCharges - flask.charges.chargesUsedPerUse);
    });

    test('should not use flask with insufficient charges', () => {
      const flask = flaskSystem.generateFlask('small_life_flask', 1);
      flaskSystem.equipFlask(0, flask);
      
      // Manually set charges to 0
      flaskSystem.getFlaskSlot(0).flask.currentCharges = 0;
      
      const result = flaskSystem.useFlask(0);
      expect(result).toBe(false);
    });

    test('should not use flask on empty slot', () => {
      const result = flaskSystem.useFlask(0);
      expect(result).toBe(false);
    });

    test('should respect global cooldown', () => {
      const flask1 = flaskSystem.generateFlask('small_life_flask', 1);
      const flask2 = flaskSystem.generateFlask('small_mana_flask', 1);
      
      flaskSystem.equipFlask(0, flask1);
      flaskSystem.equipFlask(1, flask2);
      
      // Use first flask
      const result1 = flaskSystem.useFlask(0);
      expect(result1).toBe(true);
      
      // Try to use second flask immediately (should fail due to global cooldown)
      const result2 = flaskSystem.useFlask(1);
      expect(result2).toBe(false);
    });
  });

  describe('Hybrid Flasks', () => {
    test('should recover both life and mana from hybrid flask', (done) => {
      const flask = flaskSystem.generateFlask('small_hybrid_flask', 15);
      flaskSystem.equipFlask(0, flask);
      
      let lifeRecovered = false;
      let manaRecovered = false;
      
      flaskSystem.on('life-recovery', (data) => {
        expect(data.amount).toBe(60); // 60% of 100
        lifeRecovered = true;
        if (manaRecovered) done();
      });
      
      flaskSystem.on('mana-recovery', (data) => {
        expect(data.amount).toBe(40); // 40% of 100
        manaRecovered = true;
        if (lifeRecovered) done();
      });
      
      flaskSystem.useFlask(0);
    });
  });

  describe('Charge Management', () => {
    test('should gain charges on enemy kill', () => {
      const flask = flaskSystem.generateFlask('small_life_flask', 1);
      flaskSystem.equipFlask(0, flask);
      
      // Use flask to reduce charges
      flaskSystem.useFlask(0);
      const chargesAfterUse = flaskSystem.getFlaskSlot(0).flask.currentCharges;
      
      // Simulate enemy kill
      flaskSystem.onEnemyKilled(1);
      const chargesAfterKill = flaskSystem.getFlaskSlot(0).flask.currentCharges;
      
      expect(chargesAfterKill).toBe(chargesAfterUse + 1);
    });

    test('should not exceed maximum charges', () => {
      const flask = flaskSystem.generateFlask('small_life_flask', 1);
      flaskSystem.equipFlask(0, flask);
      
      const maxCharges = flask.charges.maximum;
      
      // Try to gain charges when already at max
      for (let i = 0; i < 5; i++) {
        flaskSystem.onEnemyKilled(1);
      }
      
      const currentCharges = flaskSystem.getFlaskSlot(0).flask.currentCharges;
      expect(currentCharges).toBe(maxCharges);
    });

    test('should gain charges on critical strike with Surgeon prefix', () => {
      const flask = flaskSystem.generateFlask('medium_life_flask', 1);
      
      // Manually add Surgeon's prefix
      flask.prefixes.push({
        id: 'surgeons',
        name: 'Surgeon\'s',
        tier: 4,
        weight: 600,
        effects: [
          { type: 'charges', value: 1, isPercentage: false, condition: 'on_critical_strike' }
        ]
      });
      
      flaskSystem.equipFlask(0, flask);
      
      // Use flask to reduce charges
      flaskSystem.useFlask(0);
      const chargesAfterUse = flaskSystem.getFlaskSlot(0).flask.currentCharges;
      
      // Simulate critical strike
      flaskSystem.onCriticalStrike();
      const chargesAfterCrit = flaskSystem.getFlaskSlot(0).flask.currentCharges;
      
      expect(chargesAfterCrit).toBe(chargesAfterUse + 1);
    });
  });

  describe('Flask Modifiers', () => {
    test('should apply recovery amount modifiers', () => {
      const flask = flaskSystem.generateFlask('small_life_flask', 1);
      
      // Add "of Saturated" suffix (+25% recovery)
      flask.suffixes.push({
        id: 'of_saturated',
        name: 'of Saturated',
        tier: 3,
        weight: 1000,
        effects: [
          { type: 'recovery_amount', value: 25, isPercentage: true }
        ]
      });
      
      flaskSystem.equipFlask(0, flask);
      
      flaskSystem.on('life-recovery', (data) => {
        // 70 base * 1.25 = 87.5, floored to 87
        expect(data.amount).toBe(87);
      });
      
      flaskSystem.useFlask(0);
    });

    test('should apply quality bonus to recovery', () => {
      const flask = flaskSystem.generateFlask('small_life_flask', 1);
      flask.quality = 20; // 20% quality = 20% more recovery
      
      flaskSystem.equipFlask(0, flask);
      
      flaskSystem.on('life-recovery', (data) => {
        // 70 base * 1.20 = 84
        expect(data.amount).toBe(84);
      });
      
      flaskSystem.useFlask(0);
    });

    test('should grant immunity effects', (done) => {
      const flask = flaskSystem.generateFlask('small_life_flask', 1);
      
      // Add "of Heat" suffix (immunity to freeze and chill)
      flask.suffixes.push({
        id: 'of_heat',
        name: 'of Heat',
        tier: 5,
        weight: 600,
        effects: [
          { type: 'immunity', value: 1, isPercentage: false, condition: 'freeze' },
          { type: 'immunity', value: 1, isPercentage: false, condition: 'chill' }
        ]
      });
      
      flaskSystem.equipFlask(0, flask);
      
      let immunityCount = 0;
      flaskSystem.on('immunity-granted', (data) => {
        expect(['freeze', 'chill']).toContain(data.type);
        expect(data.duration).toBe(4000);
        expect(data.source).toBe('flask');
        immunityCount++;
        
        if (immunityCount === 2) {
          done();
        }
      });
      
      flaskSystem.useFlask(0);
    });
  });

  describe('Keybind Management', () => {
    test('should set custom keybind', () => {
      const result = flaskSystem.setKeybind(0, 'q');
      expect(result).toBe(true);
      
      const slot = flaskSystem.getFlaskSlot(0);
      expect(slot.keybind).toBe('q');
    });

    test('should not set keybind for invalid slot', () => {
      const result = flaskSystem.setKeybind(10, 'q');
      expect(result).toBe(false);
    });

    test('should toggle slot enabled state', () => {
      const slot = flaskSystem.getFlaskSlot(0);
      expect(slot.enabled).toBe(true);
      
      const result1 = flaskSystem.toggleSlotEnabled(0);
      expect(result1).toBe(false);
      expect(slot.enabled).toBe(false);
      
      const result2 = flaskSystem.toggleSlotEnabled(0);
      expect(result2).toBe(true);
      expect(slot.enabled).toBe(true);
    });
  });

  describe('Events', () => {
    test('should emit flask-used event', (done) => {
      const flask = flaskSystem.generateFlask('small_life_flask', 1);
      flaskSystem.equipFlask(0, flask);
      
      flaskSystem.on('flask-used', (data) => {
        expect(data.slotId).toBe(0);
        expect(data.flask).toBeTruthy();
        expect(data.chargesRemaining).toBe(0); // 7 charges used, 0 remaining
        expect(data.timestamp).toBeGreaterThan(0);
        done();
      });
      
      flaskSystem.useFlask(0);
    });

    test('should emit flask-equipped and flask-unequipped events', (done) => {
      const flask = flaskSystem.generateFlask('small_mana_flask', 1);
      
      let equipped = false;
      
      flaskSystem.on('flask-equipped', (data) => {
        expect(data.slotId).toBe(1);
        expect(data.flask.id).toBe(flask.id);
        equipped = true;
      });
      
      flaskSystem.on('flask-unequipped', (data) => {
        expect(data.slotId).toBe(1);
        expect(data.flask.id).toBe(flask.id);
        expect(equipped).toBe(true);
        done();
      });
      
      flaskSystem.equipFlask(1, flask);
      flaskSystem.unequipFlask(1);
    });

    test('should emit charge-related events', (done) => {
      const flask = flaskSystem.generateFlask('small_life_flask', 1);
      flaskSystem.equipFlask(0, flask);
      
      // Use flask to reduce charges
      flaskSystem.useFlask(0);
      
      flaskSystem.on('flask-charges-gained', (data) => {
        expect(data.slotId).toBe(0);
        expect(data.gainAmount).toBe(1);
        expect(data.source).toBe('kill');
        done();
      });
      
      flaskSystem.onEnemyKilled(1);
    });
  });

  describe('Active Effects', () => {
    test('should track active effects', () => {
      const activeEffects = flaskSystem.getActiveEffects();
      expect(Array.isArray(activeEffects)).toBe(true);
      expect(activeEffects).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle null flask gracefully', () => {
      expect(() => flaskSystem.equipFlask(0, null)).not.toThrow();
    });

    test('should handle invalid slot access gracefully', () => {
      const slot = flaskSystem.getFlaskSlot(-1);
      expect(slot).toBeUndefined();
      
      const result = flaskSystem.useFlask(-1);
      expect(result).toBe(false);
    });
  });
});