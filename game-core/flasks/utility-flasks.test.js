// Utility Flask System Tests

const { UtilityFlaskSystem } = require('./utility-flasks');

describe('UtilityFlaskSystem', () => {
  let utilitySystem;

  beforeEach(() => {
    utilitySystem = new UtilityFlaskSystem();
  });

  afterEach(() => {
    if (utilitySystem) {
      utilitySystem.destroy();
    }
  });

  describe('Initialization', () => {
    test('should initialize utility flask bases', () => {
      const bases = utilitySystem.getUtilityFlaskBases();
      expect(bases.length).toBeGreaterThan(0);
      expect(bases).toContain('ruby_flask');
      expect(bases).toContain('quicksilver_flask');
      expect(bases).toContain('granite_flask');
      expect(bases).toContain('diamond_flask');
    });
  });

  describe('Resistance Flask Generation', () => {
    test('should generate Ruby Flask correctly', () => {
      const flask = utilitySystem.generateUtilityFlask('ruby_flask', 18, 'normal');
      
      expect(flask).toBeTruthy();
      expect(flask.name).toBe('Ruby Flask');
      expect(flask.utilityType).toBe('resistance');
      expect(flask.resistanceTypes).toContain('fire');
      expect(flask.buffMagnitude).toBe(50);
      expect(flask.buffDuration).toBe(4000);
      expect(flask.charges.maximum).toBe(40);
    });

    test('should generate Bismuth Flask with all resistances', () => {
      const flask = utilitySystem.generateUtilityFlask('bismuth_flask', 27, 'normal');
      
      expect(flask).toBeTruthy();
      expect(flask.name).toBe('Bismuth Flask');
      expect(flask.resistanceTypes).toEqual(['fire', 'cold', 'lightning']);
      expect(flask.buffMagnitude).toBe(35);
    });

    test('should generate Sapphire Flask for cold resistance', () => {
      const flask = utilitySystem.generateUtilityFlask('sapphire_flask', 18, 'normal');
      
      expect(flask).toBeTruthy();
      expect(flask.resistanceTypes).toContain('cold');
      expect(flask.utilityType).toBe('resistance');
    });

    test('should generate Topaz Flask for lightning resistance', () => {
      const flask = utilitySystem.generateUtilityFlask('topaz_flask', 18, 'normal');
      
      expect(flask).toBeTruthy();
      expect(flask.resistanceTypes).toContain('lightning');
    });

    test('should generate Amethyst Flask for chaos resistance', () => {
      const flask = utilitySystem.generateUtilityFlask('amethyst_flask', 35, 'normal');
      
      expect(flask).toBeTruthy();
      expect(flask.resistanceTypes).toContain('chaos');
      expect(flask.buffMagnitude).toBe(35);
    });
  });

  describe('Movement Flask Generation', () => {
    test('should generate Quicksilver Flask correctly', () => {
      const flask = utilitySystem.generateUtilityFlask('quicksilver_flask', 4, 'normal');
      
      expect(flask).toBeTruthy();
      expect(flask.name).toBe('Quicksilver Flask');
      expect(flask.utilityType).toBe('movement');
      expect(flask.movementType).toBe('quicksilver');
      expect(flask.buffMagnitude).toBe(40);
      expect(flask.charges.maximum).toBe(30);
    });

    test('should generate Silver Flask with Onslaught', () => {
      const flask = utilitySystem.generateUtilityFlask('silver_flask', 22, 'normal');
      
      expect(flask).toBeTruthy();
      expect(flask.name).toBe('Silver Flask');
      expect(flask.movementType).toBe('speed');
      expect(flask.effects[0].name).toBe('Onslaught');
    });

    test('should generate Quartz Flask with phasing', () => {
      const flask = utilitySystem.generateUtilityFlask('quartz_flask', 27, 'normal');
      
      expect(flask).toBeTruthy();
      expect(flask.movementType).toBe('phase');
      expect(flask.effects.some(e => e.name === 'Phasing')).toBe(true);
    });
  });

  describe('Defensive Flask Generation', () => {
    test('should generate Granite Flask correctly', () => {
      const flask = utilitySystem.generateUtilityFlask('granite_flask', 27, 'normal');
      
      expect(flask).toBeTruthy();
      expect(flask.name).toBe('Granite Flask');
      expect(flask.utilityType).toBe('defensive');
      expect(flask.defensiveType).toBe('armor');
      expect(flask.buffMagnitude).toBe(3000);
    });

    test('should generate Jade Flask for evasion', () => {
      const flask = utilitySystem.generateUtilityFlask('jade_flask', 27, 'normal');
      
      expect(flask).toBeTruthy();
      expect(flask.defensiveType).toBe('evasion');
      expect(flask.buffMagnitude).toBe(3000);
    });

    test('should generate Aquamarine Flask with cold immunity', () => {
      const flask = utilitySystem.generateUtilityFlask('aquamarine_flask', 27, 'normal');
      
      expect(flask).toBeTruthy();
      expect(flask.effects.some(e => e.name === 'Cold Ailment Immunity')).toBe(true);
    });
  });

  describe('Damage Flask Generation', () => {
    test('should generate Diamond Flask correctly', () => {
      const flask = utilitySystem.generateUtilityFlask('diamond_flask', 27, 'normal');
      
      expect(flask).toBeTruthy();
      expect(flask.name).toBe('Diamond Flask');
      expect(flask.utilityType).toBe('damage');
      expect(flask.damageType).toBe('critical');
      expect(flask.effects[0].name).toBe('Lucky Critical Strikes');
    });

    test('should generate Sulphur Flask with spell damage', () => {
      const flask = utilitySystem.generateUtilityFlask('sulphur_flask', 35, 'normal');
      
      expect(flask).toBeTruthy();
      expect(flask.damageType).toBe('spell');
      expect(flask.effects.some(e => e.name === 'Spell Damage')).toBe(true);
      expect(flask.effects.some(e => e.name === 'Consecrated Ground')).toBe(true);
    });
  });

  describe('Magic and Rare Flask Generation', () => {
    test('should generate magic utility flask with modifiers', () => {
      // Generate multiple flasks to test randomness
      let hasModifiers = false;
      
      for (let i = 0; i < 10; i++) {
        const flask = utilitySystem.generateUtilityFlask('ruby_flask', 20, 'magic');
        
        if (flask.suffixes.length > 0 || flask.prefixes.length > 0) {
          hasModifiers = true;
          expect(flask.rarity).toBe('magic');
          break;
        }
      }
      
      expect(hasModifiers).toBe(true);
    });

    test('should generate rare utility flask with multiple modifiers', () => {
      const flask = utilitySystem.generateUtilityFlask('granite_flask', 30, 'rare');
      
      expect(flask).toBeTruthy();
      expect(flask.rarity).toBe('rare');
      expect(flask.suffixes.length + flask.prefixes.length).toBeGreaterThanOrEqual(2);
      expect(flask.name).not.toBe('Granite Flask'); // Should have rare name
    });

    test('should return null for invalid base type', () => {
      const flask = utilitySystem.generateUtilityFlask('invalid_utility_flask', 1);
      expect(flask).toBeNull();
    });
  });

  describe('Flask Effect Application', () => {
    test('should apply resistance flask effects correctly', (done) => {
      const flask = utilitySystem.generateUtilityFlask('ruby_flask', 18);
      
      utilitySystem.on('resistance-bonus-applied', (data) => {
        expect(data.resistances.fire).toBe(50);
        expect(data.duration).toBe(4000);
        expect(data.source).toBe('utility_flask');
        done();
      });
      
      const effects = utilitySystem.applyUtilityFlaskEffect(flask);
      expect(effects.length).toBeGreaterThan(0);
    });

    test('should apply movement flask effects correctly', (done) => {
      const flask = utilitySystem.generateUtilityFlask('quicksilver_flask', 4);
      
      utilitySystem.on('movement-bonus-applied', (data) => {
        expect(data.speedBonus).toBe(40);
        expect(data.duration).toBe(4000);
        expect(data.source).toBe('utility_flask');
        done();
      });
      
      utilitySystem.applyUtilityFlaskEffect(flask);
    });

    test('should apply defensive flask effects correctly', (done) => {
      const flask = utilitySystem.generateUtilityFlask('granite_flask', 27);
      
      utilitySystem.on('defensive-bonus-applied', (data) => {
        expect(data.defensiveBonus.armor).toBe(3000);
        expect(data.duration).toBe(4000);
        expect(data.source).toBe('utility_flask');
        done();
      });
      
      utilitySystem.applyUtilityFlaskEffect(flask);
    });

    test('should apply damage flask effects correctly', (done) => {
      const flask = utilitySystem.generateUtilityFlask('sulphur_flask', 35);
      
      utilitySystem.on('damage-bonus-applied', (data) => {
        expect(data.damageBonus.spell).toBe(40);
        expect(data.duration).toBe(4000);
        expect(data.source).toBe('utility_flask');
        done();
      });
      
      utilitySystem.applyUtilityFlaskEffect(flask);
    });
  });

  describe('Effect Modifiers', () => {
    test('should apply duration modifiers correctly', () => {
      const flask = utilitySystem.generateUtilityFlask('ruby_flask', 18);
      
      // Add Experimenter's prefix (+25% duration)
      flask.prefixes.push({
        id: 'experimenter',
        name: 'Experimenter\'s',
        tier: 1,
        weight: 1000,
        effects: [
          { type: 'duration', value: 25, isPercentage: true }
        ]
      });
      
      const effects = utilitySystem.applyUtilityFlaskEffect(flask);
      const expectedDuration = 4000 * 1.25; // +25% duration
      
      expect(effects[0].duration).toBe(expectedDuration);
    });

    test('should apply magnitude modifiers correctly', () => {
      const flask = utilitySystem.generateUtilityFlask('granite_flask', 27);
      
      // Add "of Iron Skin" suffix (+100% effect for armor flasks)
      flask.suffixes.push({
        id: 'of_iron_skin',
        name: 'of Iron Skin',
        tier: 2,
        weight: 800,
        effects: [
          { type: 'effect_magnitude', value: 100, isPercentage: true, condition: 'armor_flask' }
        ]
      });
      
      const effects = utilitySystem.applyUtilityFlaskEffect(flask);
      const expectedMagnitude = 3000 * 2; // +100% effect
      
      expect(effects[0].magnitude).toBe(expectedMagnitude);
    });

    test('should apply quality bonus to duration', () => {
      const flask = utilitySystem.generateUtilityFlask('quicksilver_flask', 4);
      flask.quality = 20; // 20% quality
      
      const effects = utilitySystem.applyUtilityFlaskEffect(flask);
      const expectedDuration = 4000 * 1.20; // +20% from quality
      
      expect(effects[0].duration).toBe(expectedDuration);
    });
  });

  describe('Active Effect Tracking', () => {
    test('should track active utility effects', () => {
      const flask = utilitySystem.generateUtilityFlask('ruby_flask', 18);
      
      const initialEffects = utilitySystem.getActiveUtilityEffects();
      expect(initialEffects).toHaveLength(0);
      
      utilitySystem.applyUtilityFlaskEffect(flask);
      
      const activeEffects = utilitySystem.getActiveUtilityEffects();
      expect(activeEffects.length).toBeGreaterThan(0);
    });

    test('should filter effects by type', () => {
      const resistanceFlask = utilitySystem.generateUtilityFlask('ruby_flask', 18);
      const movementFlask = utilitySystem.generateUtilityFlask('quicksilver_flask', 4);
      
      utilitySystem.applyUtilityFlaskEffect(resistanceFlask);
      utilitySystem.applyUtilityFlaskEffect(movementFlask);
      
      const resistanceEffects = utilitySystem.getUtilityEffectsByType('resistance');
      const movementEffects = utilitySystem.getUtilityEffectsByType('movement');
      
      expect(resistanceEffects.length).toBeGreaterThan(0);
      expect(movementEffects.length).toBeGreaterThan(0);
    });

    test('should remove effects after duration', (done) => {
      const flask = utilitySystem.generateUtilityFlask('ruby_flask', 18);
      flask.buffDuration = 100; // Short duration for testing
      
      utilitySystem.on('utility-effect-removed', (effect) => {
        expect(effect.name).toBe('Fire Resistance');
        done();
      });
      
      utilitySystem.applyUtilityFlaskEffect(flask);
    });
  });

  describe('Bonus Calculations', () => {
    test('should calculate total resistance bonus', () => {
      const rubyFlask = utilitySystem.generateUtilityFlask('ruby_flask', 18);
      const topazFlask = utilitySystem.generateUtilityFlask('topaz_flask', 18);
      
      utilitySystem.applyUtilityFlaskEffect(rubyFlask);
      utilitySystem.applyUtilityFlaskEffect(topazFlask);
      
      const totalBonus = utilitySystem.getTotalResistanceBonus();
      
      expect(totalBonus.fire).toBe(50);
      expect(totalBonus.lightning).toBe(50);
    });

    test('should calculate total movement speed bonus', () => {
      const quicksilverFlask = utilitySystem.generateUtilityFlask('quicksilver_flask', 4);
      
      utilitySystem.applyUtilityFlaskEffect(quicksilverFlask);
      
      const totalBonus = utilitySystem.getTotalMovementSpeedBonus();
      expect(totalBonus).toBe(40);
    });

    test('should calculate total damage bonus', () => {
      const sulphurFlask = utilitySystem.generateUtilityFlask('sulphur_flask', 35);
      
      utilitySystem.applyUtilityFlaskEffect(sulphurFlask);
      
      const totalBonus = utilitySystem.getTotalDamageBonus();
      expect(totalBonus.spell).toBe(40);
    });

    test('should calculate total defensive bonus', () => {
      const graniteFlask = utilitySystem.generateUtilityFlask('granite_flask', 27);
      const jadeFlask = utilitySystem.generateUtilityFlask('jade_flask', 27);
      
      utilitySystem.applyUtilityFlaskEffect(graniteFlask);
      utilitySystem.applyUtilityFlaskEffect(jadeFlask);
      
      const totalBonus = utilitySystem.getTotalDefensiveBonus();
      
      expect(totalBonus.armor).toBe(3000);
      expect(totalBonus.evasion).toBe(3000);
    });
  });

  describe('Flask Description Generation', () => {
    test('should generate correct description for resistance flask', () => {
      const flask = utilitySystem.generateUtilityFlask('ruby_flask', 18);
      
      expect(flask.description).toContain('+50% to Fire Resistance');
      expect(flask.description).toContain('4 second duration');
      expect(flask.description).toContain('Currently has 40 of 40 Charges');
    });

    test('should generate correct description for all resistance flask', () => {
      const flask = utilitySystem.generateUtilityFlask('bismuth_flask', 27);
      
      expect(flask.description).toContain('+35% to all Elemental Resistances');
    });

    test('should generate correct description for movement flask', () => {
      const flask = utilitySystem.generateUtilityFlask('quicksilver_flask', 4);
      
      expect(flask.description).toContain('+40% increased Movement Speed');
    });

    test('should generate correct description for defensive flask', () => {
      const flask = utilitySystem.generateUtilityFlask('granite_flask', 27);
      
      expect(flask.description).toContain('+3000 to Armor');
    });
  });

  describe('Events', () => {
    test('should emit utility-effect-applied event', (done) => {
      const flask = utilitySystem.generateUtilityFlask('ruby_flask', 18);
      
      utilitySystem.on('utility-effect-applied', (data) => {
        expect(data.effect).toBeTruthy();
        expect(data.flask).toBeTruthy();
        expect(data.effect.name).toBe('Fire Resistance');
        done();
      });
      
      utilitySystem.applyUtilityFlaskEffect(flask);
    });

    test('should emit specific resistance bonus events', (done) => {
      const flask = utilitySystem.generateUtilityFlask('bismuth_flask', 27);
      
      utilitySystem.on('resistance-bonus-applied', (data) => {
        expect(data.resistances.fire).toBe(35);
        expect(data.resistances.cold).toBe(35);
        expect(data.resistances.lightning).toBe(35);
        done();
      });
      
      utilitySystem.applyUtilityFlaskEffect(flask);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid flask base gracefully', () => {
      const flask = utilitySystem.generateUtilityFlask('invalid_base', 1);
      expect(flask).toBeNull();
    });

    test('should handle null flask in applyUtilityFlaskEffect', () => {
      expect(() => utilitySystem.applyUtilityFlaskEffect(null)).not.toThrow();
    });
  });

  describe('Complex Interactions', () => {
    test('should handle multiple resistance flasks of same type', () => {
      const flask1 = utilitySystem.generateUtilityFlask('ruby_flask', 18);
      const flask2 = utilitySystem.generateUtilityFlask('ruby_flask', 18);
      
      utilitySystem.applyUtilityFlaskEffect(flask1);
      utilitySystem.applyUtilityFlaskEffect(flask2);
      
      // Since fire resistance effects are not stackable, only one should be active
      const fireEffects = utilitySystem.getUtilityEffectsByType('resistance')
        .filter(e => e.resistanceBonus && e.resistanceBonus.fire);
      
      expect(fireEffects.length).toBeGreaterThan(0);
    });

    test('should handle Quartz Flask multiple effects', () => {
      const flask = utilitySystem.generateUtilityFlask('quartz_flask', 27);
      
      const effects = utilitySystem.applyUtilityFlaskEffect(flask);
      
      // Quartz Flask should apply both phasing and attack/cast speed
      expect(effects.length).toBe(2);
      expect(effects.some(e => e.name === 'Phasing')).toBe(true);
      expect(effects.some(e => e.name === 'Attack and Cast Speed')).toBe(true);
    });
  });
});