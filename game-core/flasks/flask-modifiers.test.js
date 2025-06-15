import FlaskModifierSystem from './flask-modifiers';

describe('FlaskModifierSystem', () => {
  let modifierSystem;
  let mockFlask;

  beforeEach(() => {
    modifierSystem = new FlaskModifierSystem();
    
    // Create mock flask for testing
    mockFlask = {
      id: 'test_flask_1',
      name: 'Test Life Flask',
      type: 'life',
      baseType: 'Medium Life Flask',
      quality: 0,
      rarity: 'normal',
      level: 1,
      recoveryAmount: 150,
      charges: {
        current: 9,
        maximum: 9,
        chargesUsedPerUse: 9,
        chargeGainOnKill: 1,
        chargeGainOnCrit: 0,
        chargeRecovery: 0.28
      },
      effects: [],
      suffixes: [],
      prefixes: [],
      requirements: { level: 3 },
      itemLevel: 10,
      corrupted: false
    };
  });

  afterEach(() => {
    modifierSystem.destroy();
  });

  describe('Quality System', () => {
    test('should create flask customization', () => {
      const flaskId = modifierSystem.createFlaskCustomization(mockFlask);
      expect(flaskId).toBe(mockFlask.id);
      
      const customization = modifierSystem.getFlaskCustomization(flaskId);
      expect(customization).toBeTruthy();
      expect(customization?.flask).toBe(mockFlask);
      expect(customization?.quality.level).toBe(0);
      expect(customization?.quality.maxLevel).toBe(20);
    });

    test('should improve flask quality', () => {
      const flaskId = modifierSystem.createFlaskCustomization(mockFlask);
      
      let qualityImproved = false;
      modifierSystem.on('flask-quality-improved', (data) => {
        qualityImproved = true;
        expect(data.flaskId).toBe(flaskId);
        expect(data.newQuality).toBe(5);
        expect(data.oldQuality).toBe(0);
      });

      // Mock currency check to return true
      modifierSystem.hasRequiredCurrency = jest.fn().mockReturnValue(true);
      modifierSystem.consumeCurrency = jest.fn();

      const result = modifierSystem.improveFlaskQuality(flaskId, 5, 'glassblower_bauble');
      expect(result).toBe(true);
      expect(qualityImproved).toBe(true);

      const customization = modifierSystem.getFlaskCustomization(flaskId);
      expect(customization?.quality.level).toBe(5);
    });

    test('should not improve quality beyond maximum', () => {
      const flaskId = modifierSystem.createFlaskCustomization(mockFlask);
      
      // Mock currency check
      modifierSystem.hasRequiredCurrency = jest.fn().mockReturnValue(true);
      modifierSystem.consumeCurrency = jest.fn();

      // Try to improve beyond max level
      const result = modifierSystem.improveFlaskQuality(flaskId, 25, 'glassblower_bauble');
      expect(result).toBe(true);

      const customization = modifierSystem.getFlaskCustomization(flaskId);
      expect(customization?.quality.level).toBe(20); // Capped at max
    });

    test('should fail quality improvement with insufficient currency', () => {
      const flaskId = modifierSystem.createFlaskCustomization(mockFlask);
      
      let qualityFailed = false;
      modifierSystem.on('flask-quality-failed', (data) => {
        qualityFailed = true;
        expect(data.reason).toBe('insufficient_currency');
      });

      // Mock currency check to return false
      modifierSystem.hasRequiredCurrency = jest.fn().mockReturnValue(false);

      const result = modifierSystem.improveFlaskQuality(flaskId, 5, 'glassblower_bauble');
      expect(result).toBe(false);
      expect(qualityFailed).toBe(true);
    });
  });

  describe('Enchantment System', () => {
    test('should add valid enchantment', () => {
      const flaskId = modifierSystem.createFlaskCustomization(mockFlask);
      
      let enchantmentAdded = false;
      modifierSystem.on('enchantment-added', (data) => {
        enchantmentAdded = true;
        expect(data.flaskId).toBe(flaskId);
        expect(data.enchantment.id).toBe('increased_recovery_speed');
      });

      const result = modifierSystem.addEnchantment(flaskId, 'increased_recovery_speed');
      expect(result).toBe(true);
      expect(enchantmentAdded).toBe(true);

      const customization = modifierSystem.getFlaskCustomization(flaskId);
      expect(customization?.enchantments.length).toBe(1);
      expect(customization?.enchantments[0].id).toBe('increased_recovery_speed');
    });

    test('should reject conflicting enchantments', () => {
      const flaskId = modifierSystem.createFlaskCustomization(mockFlask);
      
      // Add first enchantment
      modifierSystem.addEnchantment(flaskId, 'immunity_to_bleeding');

      let enchantmentFailed = false;
      modifierSystem.on('enchantment-failed', (data) => {
        enchantmentFailed = true;
        expect(data.reason).toBe('conflicting_enchantment');
      });

      // Try to add conflicting enchantment
      const result = modifierSystem.addEnchantment(flaskId, 'immunity_to_poison');
      expect(result).toBe(false);
      expect(enchantmentFailed).toBe(true);
    });

    test('should get available enchantments for flask type', () => {
      const available = modifierSystem.getAllAvailableEnchantments(mockFlask);
      expect(available.length).toBeGreaterThan(0);
      
      // Should include life flask compatible enchantments
      const recoverySpeedEnchant = available.find(e => e.id === 'increased_recovery_speed');
      expect(recoverySpeedEnchant).toBeTruthy();
    });

    test('should fail enchantment with unmet requirements', () => {
      // Create flask that doesn't meet enchantment requirements
      const lowLevelFlask = { ...mockFlask, level: 1 };
      const flaskId = modifierSystem.createFlaskCustomization(lowLevelFlask);

      let enchantmentFailed = false;
      modifierSystem.on('enchantment-failed', (data) => {
        enchantmentFailed = true;
        expect(data.reason).toBe('requirements_not_met');
      });

      // Try to add enchantment with high level requirement
      const result = modifierSystem.addEnchantment(flaskId, 'flask_effect_applies_to_minions');
      expect(result).toBe(false);
      expect(enchantmentFailed).toBe(true);
    });
  });

  describe('Corruption System', () => {
    test('should corrupt flask successfully', () => {
      const flaskId = modifierSystem.createFlaskCustomization(mockFlask);
      
      let corruptionApplied = false;
      modifierSystem.on('flask-corruption-applied', (data) => {
        corruptionApplied = true;
        expect(data.flaskId).toBe(flaskId);
      });

      // Mock random to avoid destruction
      const originalRandom = Math.random;
      Math.random = jest.fn()
        .mockReturnValueOnce(0.5) // Select corruption
        .mockReturnValueOnce(0.9) // Avoid destruction
        .mockReturnValueOnce(0.9); // Avoid no change

      const result = modifierSystem.corruptFlask(flaskId);
      expect(result).toBe(true);

      const customization = modifierSystem.getFlaskCustomization(flaskId);
      expect(customization?.isCorrupted).toBe(true);

      Math.random = originalRandom;
    });

    test('should destroy flask on corruption failure', () => {
      const flaskId = modifierSystem.createFlaskCustomization(mockFlask);
      
      let flaskDestroyed = false;
      modifierSystem.on('flask-corruption-destroyed', (data) => {
        flaskDestroyed = true;
        expect(data.flaskId).toBe(flaskId);
      });

      // Mock random to cause destruction
      const originalRandom = Math.random;
      Math.random = jest.fn()
        .mockReturnValueOnce(0.5) // Select corruption
        .mockReturnValueOnce(0.1); // Trigger destruction

      const result = modifierSystem.corruptFlask(flaskId);
      expect(result).toBe(true);
      expect(flaskDestroyed).toBe(true);

      const customization = modifierSystem.getFlaskCustomization(flaskId);
      expect(customization).toBeNull();

      Math.random = originalRandom;
    });

    test('should not corrupt already corrupted flask', () => {
      const corruptedFlask = { ...mockFlask, corrupted: true };
      const flaskId = modifierSystem.createFlaskCustomization(corruptedFlask);
      
      const result = modifierSystem.corruptFlask(flaskId);
      expect(result).toBe(false);
    });
  });

  describe('Crafting System', () => {
    test('should craft flask with valid operation', () => {
      // Create magic flask for alteration
      const magicFlask = { ...mockFlask, rarity: 'magic', prefixes: [], suffixes: [] };
      const flaskId = modifierSystem.createFlaskCustomization(magicFlask);
      
      let craftingSuccess = false;
      modifierSystem.on('crafting-success', (data) => {
        craftingSuccess = true;
        expect(data.flaskId).toBe(flaskId);
        expect(data.operation).toBe('orb_of_alteration');
      });

      // Mock currency checks
      modifierSystem.hasRequiredCurrency = jest.fn().mockReturnValue(true);
      modifierSystem.consumeCurrency = jest.fn();

      const result = modifierSystem.craftFlask(flaskId, 'orb_of_alteration');
      expect(result).toBe(true);
      expect(craftingSuccess).toBe(true);
    });

    test('should fail crafting with insufficient currency', () => {
      const flaskId = modifierSystem.createFlaskCustomization(mockFlask);
      
      let craftingFailed = false;
      modifierSystem.on('crafting-failed', (data) => {
        craftingFailed = true;
        expect(data.reason).toBe('insufficient_currency');
      });

      // Mock currency check to return false
      modifierSystem.hasRequiredCurrency = jest.fn().mockReturnValue(false);

      const result = modifierSystem.craftFlask(flaskId, 'orb_of_transmutation');
      expect(result).toBe(false);
      expect(craftingFailed).toBe(true);
    });

    test('should fail crafting with wrong rarity', () => {
      const flaskId = modifierSystem.createFlaskCustomization(mockFlask);
      
      let craftingFailed = false;
      modifierSystem.on('crafting-failed', (data) => {
        craftingFailed = true;
        expect(data.reason).toBe('invalid_rarity');
      });

      // Try to use chaos orb on normal flask (requires rare)
      const result = modifierSystem.craftFlask(flaskId, 'chaos_orb');
      expect(result).toBe(false);
      expect(craftingFailed).toBe(true);
    });

    test('should get all crafting operations', () => {
      const operations = modifierSystem.getAllCraftingOperations();
      expect(operations.length).toBeGreaterThan(0);
      
      const transmutation = operations.find(op => op.operation === 'reroll_prefixes');
      expect(transmutation).toBeTruthy();
    });
  });

  describe('Master Crafting', () => {
    test('should apply master crafted modifier', () => {
      const flaskId = modifierSystem.createFlaskCustomization(mockFlask);
      
      let masterCraftApplied = false;
      modifierSystem.on('master-craft-applied', (data) => {
        masterCraftApplied = true;
        expect(data.flaskId).toBe(flaskId);
        expect(data.tier).toBe(0);
      });

      // Mock currency checks
      modifierSystem.hasRequiredCurrency = jest.fn().mockReturnValue(true);
      modifierSystem.consumeCurrency = jest.fn();

      const result = modifierSystem.masterCraftModifier(flaskId, 'prefix_charges', 0);
      expect(result).toBe(true);
      expect(masterCraftApplied).toBe(true);
    });

    test('should fail master crafting with insufficient currency', () => {
      const flaskId = modifierSystem.createFlaskCustomization(mockFlask);
      
      let masterCraftFailed = false;
      modifierSystem.on('master-craft-failed', (data) => {
        masterCraftFailed = true;
        expect(data.reason).toBe('insufficient_currency');
      });

      // Mock currency check to return false
      modifierSystem.hasRequiredCurrency = jest.fn().mockReturnValue(false);

      const result = modifierSystem.masterCraftModifier(flaskId, 'prefix_charges', 0);
      expect(result).toBe(false);
      expect(masterCraftFailed).toBe(true);
    });

    test('should get master crafting options', () => {
      const options = modifierSystem.getMasterCraftingOptions();
      expect(options.size).toBeGreaterThan(0);
      expect(options.has('prefix_charges')).toBe(true);
      expect(options.has('suffix_recovery')).toBe(true);
    });
  });

  describe('Investment Tracking', () => {
    test('should track investment and calculate value', () => {
      const flaskId = modifierSystem.createFlaskCustomization(mockFlask);
      
      // Mock currency operations
      modifierSystem.hasRequiredCurrency = jest.fn().mockReturnValue(true);
      modifierSystem.consumeCurrency = jest.fn();

      // Perform some operations
      modifierSystem.improveFlaskQuality(flaskId, 5, 'glassblower_bauble');
      modifierSystem.addEnchantment(flaskId, 'increased_recovery_speed');

      const tracker = modifierSystem.getInvestmentTracker(flaskId);
      expect(tracker).toBeTruthy();
      expect(tracker?.flaskId).toBe(flaskId);
      expect(tracker?.operationsPerformed).toBeGreaterThan(0);

      const value = modifierSystem.getFlaskValueEstimate(flaskId);
      expect(value).toBeGreaterThan(0);
    });

    test('should calculate profit/loss correctly', () => {
      const flaskId = modifierSystem.createFlaskCustomization(mockFlask);
      
      // Mock currency operations
      modifierSystem.hasRequiredCurrency = jest.fn().mockReturnValue(true);
      modifierSystem.consumeCurrency = jest.fn();

      // Perform expensive operation
      modifierSystem.improveFlaskQuality(flaskId, 10, 'glassblower_bauble');

      const tracker = modifierSystem.getInvestmentTracker(flaskId);
      expect(tracker?.profitLoss).toBeDefined();
      // Value calculation depends on implementation
    });
  });

  describe('Value Estimation', () => {
    test('should estimate flask value based on modifications', () => {
      const flaskId = modifierSystem.createFlaskCustomization(mockFlask);
      
      const initialValue = modifierSystem.getFlaskValueEstimate(flaskId);
      expect(initialValue).toBeGreaterThan(0);

      // Add quality
      const customization = modifierSystem.getFlaskCustomization(flaskId);
      if (customization) {
        customization.quality.level = 10;
      }

      const improvedValue = modifierSystem.getFlaskValueEstimate(flaskId);
      expect(improvedValue).toBeGreaterThan(initialValue);
    });

    test('should increase value with rarity', () => {
      const normalFlask = { ...mockFlask, rarity: 'normal' };
      const rareFlask = { ...mockFlask, rarity: 'rare' };

      const normalId = modifierSystem.createFlaskCustomization(normalFlask);
      const rareId = modifierSystem.createFlaskCustomization(rareFlask);

      const normalValue = modifierSystem.getFlaskValueEstimate(normalId);
      const rareValue = modifierSystem.getFlaskValueEstimate(rareId);

      expect(rareValue).toBeGreaterThan(normalValue);
    });
  });

  describe('System Lifecycle', () => {
    test('should handle system initialization', () => {
      expect(modifierSystem).toBeDefined();
      
      // Check that all subsystems are initialized
      const operations = modifierSystem.getAllCraftingOperations();
      expect(operations.length).toBeGreaterThan(0);

      const masterOptions = modifierSystem.getMasterCraftingOptions();
      expect(masterOptions.size).toBeGreaterThan(0);
    });

    test('should handle system cleanup', () => {
      const flaskId = modifierSystem.createFlaskCustomization(mockFlask);
      expect(modifierSystem.getFlaskCustomization(flaskId)).toBeTruthy();

      modifierSystem.destroy();

      // System should be cleaned up
      expect(modifierSystem.getFlaskCustomization(flaskId)).toBeNull();
    });
  });

  describe('Integration Features', () => {
    test('should handle currency consumption events', () => {
      let currencyConsumed = false;
      
      modifierSystem.on('currency-consumed', (data) => {
        currencyConsumed = true;
        expect(data.currencyType).toBeDefined();
        expect(data.amount).toBeGreaterThan(0);
      });

      const flaskId = modifierSystem.createFlaskCustomization(mockFlask);
      
      // Mock currency check to allow operation
      modifierSystem.hasRequiredCurrency = jest.fn().mockReturnValue(true);

      modifierSystem.improveFlaskQuality(flaskId, 1, 'glassblower_bauble');
      expect(currencyConsumed).toBe(true);
    });

    test('should provide comprehensive flask modification data', () => {
      const flaskId = modifierSystem.createFlaskCustomization(mockFlask);
      
      // Mock operations
      modifierSystem.hasRequiredCurrency = jest.fn().mockReturnValue(true);
      modifierSystem.consumeCurrency = jest.fn();

      // Apply various modifications
      modifierSystem.improveFlaskQuality(flaskId, 5, 'glassblower_bauble');
      modifierSystem.addEnchantment(flaskId, 'increased_recovery_speed');

      const customization = modifierSystem.getFlaskCustomization(flaskId);
      expect(customization?.quality.level).toBe(5);
      expect(customization?.enchantments.length).toBe(1);
      expect(customization?.craftingHistory.length).toBeGreaterThan(0);
      expect(customization?.isCorrupted).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid flask IDs gracefully', () => {
      const result = modifierSystem.improveFlaskQuality('invalid_id', 5, 'glassblower_bauble');
      expect(result).toBe(false);

      const customization = modifierSystem.getFlaskCustomization('invalid_id');
      expect(customization).toBeNull();
    });

    test('should handle invalid enchantment IDs gracefully', () => {
      const flaskId = modifierSystem.createFlaskCustomization(mockFlask);
      
      const result = modifierSystem.addEnchantment(flaskId, 'invalid_enchantment');
      expect(result).toBe(false);
    });

    test('should handle invalid crafting operations gracefully', () => {
      const flaskId = modifierSystem.createFlaskCustomization(mockFlask);
      
      const result = modifierSystem.craftFlask(flaskId, 'invalid_operation');
      expect(result).toBe(false);
    });
  });
});