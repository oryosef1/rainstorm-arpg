import { EventEmitter } from 'events';
import { FlaskData, FlaskPrefix, FlaskSuffix, FlaskModifier } from './flask-system';
import { UtilityFlaskData } from './utility-flasks';

export interface FlaskQuality {
  level: number;
  bonus: number;
  maxLevel: number;
  costPerLevel: QualityCost;
  effects: QualityEffect[];
}

export interface QualityCost {
  currencyType: string;
  amount: number;
  scalingFactor: number;
}

export interface QualityEffect {
  type: 'recovery_amount' | 'duration' | 'charges' | 'effect_magnitude' | 'charge_recovery';
  bonusPerLevel: number;
  isPercentage: boolean;
  description: string;
}

export interface FlaskEnchantment {
  id: string;
  name: string;
  description: string;
  tier: number;
  type: 'labyrinth' | 'harvest' | 'beast' | 'corruption' | 'synthesis';
  effects: EnchantmentEffect[];
  requirements: EnchantmentRequirement[];
  conflictsWith: string[];
  weight: number;
}

export interface EnchantmentEffect {
  stat: string;
  value: number;
  valueType: 'flat' | 'percentage' | 'multiplier';
  condition?: string;
  duration?: number;
}

export interface EnchantmentRequirement {
  type: 'level' | 'quality' | 'flask_type' | 'base_type';
  value: string | number;
}

export interface FlaskCorruption {
  id: string;
  name: string;
  description: string;
  type: 'implicit' | 'explicit' | 'transform';
  effects: CorruptionEffect[];
  weight: number;
  destroyChance: number;
  noChangeChance: number;
}

export interface CorruptionEffect {
  type: 'add_modifier' | 'remove_modifier' | 'transform_base' | 'add_implicit';
  target?: string;
  modifier?: FlaskModifier;
  newBaseType?: string;
}

export interface FlaskCrafting {
  operation: 'reroll_prefixes' | 'reroll_suffixes' | 'add_prefix' | 'add_suffix' | 'remove_prefix' | 'remove_suffix' | 'divine_reroll' | 'augment' | 'annul';
  currencyRequired: CraftingCurrency[];
  successChance: number;
  description: string;
  targetRarity: ('normal' | 'magic' | 'rare')[];
}

export interface CraftingCurrency {
  type: string;
  amount: number;
  description: string;
}

export interface FlaskCustomization {
  flask: FlaskData | UtilityFlaskData;
  quality: FlaskQuality;
  enchantments: FlaskEnchantment[];
  isCorrupted: boolean;
  corruptionEffects: FlaskCorruption[];
  craftingHistory: CraftingOperation[];
  totalInvestment: Record<string, number>;
}

export interface CraftingOperation {
  operation: string;
  timestamp: number;
  cost: CraftingCurrency[];
  result: string;
  success: boolean;
}

export interface FlaskInvestmentTracker {
  flaskId: string;
  currencySpent: Record<string, number>;
  timeInvested: number;
  operationsPerformed: number;
  valueEstimate: number;
  profitLoss: number;
}

export class FlaskModifierSystem extends EventEmitter {
  private qualityTypes: Map<string, QualityEffect[]> = new Map();
  private enchantments: Map<string, FlaskEnchantment> = new Map();
  private corruptions: Map<string, FlaskCorruption> = new Map();
  private craftingOperations: Map<string, FlaskCrafting> = new Map();
  private customizedFlasks: Map<string, FlaskCustomization> = new Map();
  private investmentTrackers: Map<string, FlaskInvestmentTracker> = new Map();

  // Master crafting bench
  private masterCraftingBench: Map<string, FlaskModifier[]> = new Map();
  private unveiledModifiers: Map<string, FlaskModifier> = new Map();

  constructor() {
    super();
    this.initializeQualityTypes();
    this.initializeEnchantments();
    this.initializeCorruptions();
    this.initializeCraftingOperations();
    this.initializeMasterCrafting();
    console.log('🧪 Flask Modifier System initialized');
  }

  private initializeQualityTypes(): void {
    // Life Flask Quality Effects
    this.qualityTypes.set('life', [
      {
        type: 'recovery_amount',
        bonusPerLevel: 1,
        isPercentage: true,
        description: '+1% to Recovery Amount per 1% Quality'
      }
    ]);

    // Mana Flask Quality Effects
    this.qualityTypes.set('mana', [
      {
        type: 'recovery_amount',
        bonusPerLevel: 1,
        isPercentage: true,
        description: '+1% to Recovery Amount per 1% Quality'
      }
    ]);

    // Hybrid Flask Quality Effects
    this.qualityTypes.set('hybrid', [
      {
        type: 'recovery_amount',
        bonusPerLevel: 1,
        isPercentage: true,
        description: '+1% to Recovery Amount per 1% Quality'
      }
    ]);

    // Utility Flask Quality Effects
    this.qualityTypes.set('utility', [
      {
        type: 'duration',
        bonusPerLevel: 1,
        isPercentage: true,
        description: '+1% to Flask Effect Duration per 1% Quality'
      }
    ]);

    console.log(`🧪 Initialized ${this.qualityTypes.size} quality effect types`);
  }

  private initializeEnchantments(): void {
    // Labyrinth Enchantments
    this.enchantments.set('increased_recovery_speed', {
      id: 'increased_recovery_speed',
      name: 'Flask Effects have 25% increased Recovery Speed',
      description: 'Recovery from this flask is 25% faster',
      tier: 1,
      type: 'labyrinth',
      effects: [
        { stat: 'recovery_rate', value: 25, valueType: 'percentage' }
      ],
      requirements: [
        { type: 'flask_type', value: 'life' },
        { type: 'flask_type', value: 'mana' },
        { type: 'flask_type', value: 'hybrid' }
      ],
      conflictsWith: ['reduced_recovery_speed'],
      weight: 100
    });

    this.enchantments.set('increased_area_damage', {
      id: 'increased_area_damage',
      name: 'Flask Effects grant 15% increased Area Damage',
      description: 'Area skills deal 15% increased damage during flask effect',
      tier: 2,
      type: 'labyrinth',
      effects: [
        { stat: 'area_damage', value: 15, valueType: 'percentage', condition: 'during_flask_effect' }
      ],
      requirements: [
        { type: 'flask_type', value: 'utility' }
      ],
      conflictsWith: [],
      weight: 80
    });

    this.enchantments.set('immunity_to_bleeding', {
      id: 'immunity_to_bleeding',
      name: 'Flask Grants Immunity to Bleeding for 4 seconds',
      description: 'Grants immunity to bleeding and removes existing bleeding',
      tier: 2,
      type: 'labyrinth',
      effects: [
        { stat: 'immunity', value: 1, valueType: 'flat', condition: 'bleeding', duration: 4000 }
      ],
      requirements: [],
      conflictsWith: ['immunity_to_poison'],
      weight: 75
    });

    this.enchantments.set('charges_gained_when_hit', {
      id: 'charges_gained_when_hit',
      name: 'Flask gains 1 Charge when you are Hit by an Enemy',
      description: 'Defensive charge generation from taking damage',
      tier: 3,
      type: 'labyrinth',
      effects: [
        { stat: 'charge_gain_on_hit', value: 1, valueType: 'flat' }
      ],
      requirements: [],
      conflictsWith: [],
      weight: 60
    });

    // Harvest Enchantments
    this.enchantments.set('flask_effect_applies_to_minions', {
      id: 'flask_effect_applies_to_minions',
      name: 'Flask Effects also apply to your Minions',
      description: 'Minions also benefit from flask effects',
      tier: 4,
      type: 'harvest',
      effects: [
        { stat: 'effect_applies_to_minions', value: 1, valueType: 'flat' }
      ],
      requirements: [
        { type: 'flask_type', value: 'utility' }
      ],
      conflictsWith: [],
      weight: 25
    });

    this.enchantments.set('reused_at_end_of_effect', {
      id: 'reused_at_end_of_effect',
      name: 'Flask is Reused at the end of its Effect',
      description: 'Automatically reuses flask when effect expires if charges available',
      tier: 5,
      type: 'harvest',
      effects: [
        { stat: 'auto_reuse', value: 1, valueType: 'flat' }
      ],
      requirements: [],
      conflictsWith: [],
      weight: 15
    });

    console.log(`🧪 Initialized ${this.enchantments.size} flask enchantments`);
  }

  private initializeCorruptions(): void {
    this.corruptions.set('add_random_modifier', {
      id: 'add_random_modifier',
      name: 'Adds Random Modifier',
      description: 'Adds a random prefix or suffix',
      type: 'explicit',
      effects: [
        { type: 'add_modifier', target: 'random' }
      ],
      weight: 400,
      destroyChance: 0.25,
      noChangeChance: 0.25
    });

    this.corruptions.set('remove_random_modifier', {
      id: 'remove_random_modifier',
      name: 'Removes Random Modifier',
      description: 'Removes a random prefix or suffix',
      type: 'explicit',
      effects: [
        { type: 'remove_modifier', target: 'random' }
      ],
      weight: 300,
      destroyChance: 0.25,
      noChangeChance: 0.25
    });

    this.corruptions.set('transform_to_unique', {
      id: 'transform_to_unique',
      name: 'Transform to Unique Flask',
      description: 'Transforms flask into a unique version',
      type: 'transform',
      effects: [
        { type: 'transform_base', newBaseType: 'unique_variant' }
      ],
      weight: 50,
      destroyChance: 0.25,
      noChangeChance: 0.25
    });

    this.corruptions.set('add_implicit_modifier', {
      id: 'add_implicit_modifier',
      name: 'Adds Implicit Modifier',
      description: 'Adds a powerful implicit modifier',
      type: 'implicit',
      effects: [
        { 
          type: 'add_implicit',
          modifier: { type: 'effect_magnitude', value: 25, isPercentage: true }
        }
      ],
      weight: 150,
      destroyChance: 0.25,
      noChangeChance: 0.25
    });

    console.log(`🧪 Initialized ${this.corruptions.size} corruption outcomes`);
  }

  private initializeCraftingOperations(): void {
    this.craftingOperations.set('orb_of_transmutation', {
      operation: 'reroll_prefixes',
      currencyRequired: [{ type: 'orb_of_transmutation', amount: 1, description: 'Upgrades normal flask to magic' }],
      successChance: 1.0,
      description: 'Upgrades a normal flask to magic quality with random modifiers',
      targetRarity: ['normal']
    });

    this.craftingOperations.set('orb_of_alteration', {
      operation: 'reroll_suffixes',
      currencyRequired: [{ type: 'orb_of_alteration', amount: 1, description: 'Rerolls magic flask modifiers' }],
      successChance: 1.0,
      description: 'Rerolls the modifiers on a magic flask',
      targetRarity: ['magic']
    });

    this.craftingOperations.set('orb_of_alchemy', {
      operation: 'reroll_prefixes',
      currencyRequired: [{ type: 'orb_of_alchemy', amount: 1, description: 'Upgrades normal flask to rare' }],
      successChance: 1.0,
      description: 'Upgrades a normal flask to rare quality with random modifiers',
      targetRarity: ['normal']
    });

    this.craftingOperations.set('chaos_orb', {
      operation: 'divine_reroll',
      currencyRequired: [{ type: 'chaos_orb', amount: 1, description: 'Rerolls all modifiers on rare flask' }],
      successChance: 1.0,
      description: 'Rerolls all modifiers on a rare flask',
      targetRarity: ['rare']
    });

    this.craftingOperations.set('exalted_orb', {
      operation: 'add_prefix',
      currencyRequired: [{ type: 'exalted_orb', amount: 1, description: 'Adds new modifier to rare flask' }],
      successChance: 1.0,
      description: 'Adds a new random modifier to a rare flask',
      targetRarity: ['rare']
    });

    this.craftingOperations.set('orb_of_annulment', {
      operation: 'remove_prefix',
      currencyRequired: [{ type: 'orb_of_annulment', amount: 1, description: 'Removes random modifier' }],
      successChance: 1.0,
      description: 'Removes a random modifier from the flask',
      targetRarity: ['magic', 'rare']
    });

    this.craftingOperations.set('divine_orb', {
      operation: 'divine_reroll',
      currencyRequired: [{ type: 'divine_orb', amount: 1, description: 'Rerolls modifier values' }],
      successChance: 1.0,
      description: 'Rerolls the numeric values of all modifiers',
      targetRarity: ['magic', 'rare']
    });

    this.craftingOperations.set('blessed_orb', {
      operation: 'divine_reroll',
      currencyRequired: [{ type: 'blessed_orb', amount: 1, description: 'Rerolls implicit modifier values' }],
      successChance: 1.0,
      description: 'Rerolls the values of implicit modifiers',
      targetRarity: ['normal', 'magic', 'rare']
    });

    console.log(`🧪 Initialized ${this.craftingOperations.size} crafting operations`);
  }

  private initializeMasterCrafting(): void {
    // Master crafted modifiers (guaranteed but expensive)
    this.masterCraftingBench.set('prefix_charges', [
      { type: 'charges', value: 15, isPercentage: true },
      { type: 'charges', value: 20, isPercentage: true },
      { type: 'charges', value: 25, isPercentage: true }
    ]);

    this.masterCraftingBench.set('suffix_recovery', [
      { type: 'recovery_amount', value: 20, isPercentage: true },
      { type: 'recovery_amount', value: 25, isPercentage: true },
      { type: 'recovery_amount', value: 30, isPercentage: true }
    ]);

    this.masterCraftingBench.set('suffix_duration', [
      { type: 'duration', value: 20, isPercentage: true },
      { type: 'duration', value: 25, isPercentage: true },
      { type: 'duration', value: 30, isPercentage: true }
    ]);

    console.log(`🧪 Initialized ${this.masterCraftingBench.size} master crafting options`);
  }

  // Quality Management
  improveFlaskQuality(flaskId: string, qualityLevels: number, currencyType: string): boolean {
    const customization = this.customizedFlasks.get(flaskId);
    if (!customization) {
      return false;
    }

    const currentQuality = customization.quality.level;
    const maxQuality = customization.quality.maxLevel;
    const targetQuality = Math.min(currentQuality + qualityLevels, maxQuality);
    
    if (targetQuality === currentQuality) {
      return false; // Already at max or no improvement
    }

    // Calculate cost
    const totalCost = this.calculateQualityCost(currentQuality, targetQuality, customization.quality.costPerLevel);
    
    // Check if player has currency (would integrate with inventory system)
    if (!this.hasRequiredCurrency(currencyType, totalCost)) {
      this.emit('flask-quality-failed', { flaskId, reason: 'insufficient_currency', required: totalCost });
      return false;
    }

    // Apply quality improvement
    customization.quality.level = targetQuality;
    this.consumeCurrency(currencyType, totalCost);
    this.trackInvestment(flaskId, currencyType, totalCost);

    // Apply quality effects to flask
    this.applyQualityEffects(customization);

    this.emit('flask-quality-improved', {
      flaskId,
      oldQuality: currentQuality,
      newQuality: targetQuality,
      cost: totalCost,
      currencyType
    });

    return true;
  }

  private calculateQualityCost(currentLevel: number, targetLevel: number, costPerLevel: QualityCost): number {
    let totalCost = 0;
    for (let level = currentLevel + 1; level <= targetLevel; level++) {
      totalCost += costPerLevel.amount * Math.pow(costPerLevel.scalingFactor, level - 1);
    }
    return Math.ceil(totalCost);
  }

  private applyQualityEffects(customization: FlaskCustomization): void {
    const qualityEffects = this.qualityTypes.get(customization.flask.type);
    if (!qualityEffects) return;

    for (const effect of qualityEffects) {
      const totalBonus = effect.bonusPerLevel * customization.quality.level;
      this.applyEffectToFlask(customization.flask, effect.type, totalBonus, effect.isPercentage);
    }
  }

  // Enchantment System
  addEnchantment(flaskId: string, enchantmentId: string): boolean {
    const customization = this.customizedFlasks.get(flaskId);
    const enchantment = this.enchantments.get(enchantmentId);
    
    if (!customization || !enchantment) {
      return false;
    }

    // Check requirements
    if (!this.checkEnchantmentRequirements(customization.flask, enchantment)) {
      this.emit('enchantment-failed', { flaskId, enchantmentId, reason: 'requirements_not_met' });
      return false;
    }

    // Check conflicts
    const hasConflict = customization.enchantments.some(existing => 
      enchantment.conflictsWith.includes(existing.id) || existing.conflictsWith.includes(enchantmentId)
    );

    if (hasConflict) {
      this.emit('enchantment-failed', { flaskId, enchantmentId, reason: 'conflicting_enchantment' });
      return false;
    }

    // Add enchantment
    customization.enchantments.push(enchantment);
    this.applyEnchantmentEffects(customization.flask, enchantment);

    this.emit('enchantment-added', { flaskId, enchantment });
    return true;
  }

  private checkEnchantmentRequirements(flask: FlaskData | UtilityFlaskData, enchantment: FlaskEnchantment): boolean {
    return enchantment.requirements.every(req => {
      switch (req.type) {
        case 'level':
          return flask.level >= (req.value as number);
        case 'quality':
          return flask.quality >= (req.value as number);
        case 'flask_type':
          return flask.type === req.value;
        case 'base_type':
          return flask.baseType === req.value;
        default:
          return true;
      }
    });
  }

  private applyEnchantmentEffects(flask: FlaskData | UtilityFlaskData, enchantment: FlaskEnchantment): void {
    for (const effect of enchantment.effects) {
      this.applyEffectToFlask(flask, effect.stat as any, effect.value, effect.valueType === 'percentage');
    }
  }

  // Corruption System
  corruptFlask(flaskId: string): boolean {
    const customization = this.customizedFlasks.get(flaskId);
    if (!customization || customization.isCorrupted) {
      return false;
    }

    // Roll for corruption outcome
    const random = Math.random();
    let totalWeight = 0;
    const availableCorruptions = Array.from(this.corruptions.values());

    for (const corruption of availableCorruptions) {
      totalWeight += corruption.weight;
    }

    let currentWeight = 0;
    let selectedCorruption: FlaskCorruption | null = null;

    for (const corruption of availableCorruptions) {
      currentWeight += corruption.weight;
      if (random <= currentWeight / totalWeight) {
        selectedCorruption = corruption;
        break;
      }
    }

    if (!selectedCorruption) {
      return false;
    }

    // Check for destruction
    if (Math.random() < selectedCorruption.destroyChance) {
      this.destroyFlask(flaskId);
      this.emit('flask-corruption-destroyed', { flaskId, corruption: selectedCorruption });
      return true;
    }

    // Check for no change
    if (Math.random() < selectedCorruption.noChangeChance) {
      customization.isCorrupted = true;
      this.emit('flask-corruption-no-change', { flaskId, corruption: selectedCorruption });
      return true;
    }

    // Apply corruption effects
    this.applyCorruptionEffects(customization, selectedCorruption);
    customization.isCorrupted = true;
    customization.corruptionEffects.push(selectedCorruption);

    this.emit('flask-corruption-applied', { flaskId, corruption: selectedCorruption });
    return true;
  }

  private applyCorruptionEffects(customization: FlaskCustomization, corruption: FlaskCorruption): void {
    for (const effect of corruption.effects) {
      switch (effect.type) {
        case 'add_modifier':
          this.addRandomModifier(customization.flask);
          break;
        case 'remove_modifier':
          this.removeRandomModifier(customization.flask);
          break;
        case 'transform_base':
          this.transformFlaskBase(customization.flask, effect.newBaseType!);
          break;
        case 'add_implicit':
          this.addImplicitModifier(customization.flask, effect.modifier!);
          break;
      }
    }
  }

  private destroyFlask(flaskId: string): void {
    this.customizedFlasks.delete(flaskId);
    this.investmentTrackers.delete(flaskId);
  }

  // Crafting System
  craftFlask(flaskId: string, operationType: string): boolean {
    const customization = this.customizedFlasks.get(flaskId);
    const operation = this.craftingOperations.get(operationType);

    if (!customization || !operation) {
      return false;
    }

    // Check rarity requirements
    if (!operation.targetRarity.includes(customization.flask.rarity)) {
      this.emit('crafting-failed', { flaskId, operation: operationType, reason: 'invalid_rarity' });
      return false;
    }

    // Check currency requirements
    for (const currency of operation.currencyRequired) {
      if (!this.hasRequiredCurrency(currency.type, currency.amount)) {
        this.emit('crafting-failed', { flaskId, operation: operationType, reason: 'insufficient_currency' });
        return false;
      }
    }

    // Check success chance
    if (Math.random() > operation.successChance) {
      // Consume currency even on failure
      for (const currency of operation.currencyRequired) {
        this.consumeCurrency(currency.type, currency.amount);
        this.trackInvestment(flaskId, currency.type, currency.amount);
      }

      this.recordCraftingOperation(customization, operationType, operation.currencyRequired, false);
      this.emit('crafting-failed', { flaskId, operation: operationType, reason: 'random_failure' });
      return false;
    }

    // Apply crafting operation
    this.applyCraftingOperation(customization, operation);

    // Consume currency
    for (const currency of operation.currencyRequired) {
      this.consumeCurrency(currency.type, currency.amount);
      this.trackInvestment(flaskId, currency.type, currency.amount);
    }

    this.recordCraftingOperation(customization, operationType, operation.currencyRequired, true);
    this.emit('crafting-success', { flaskId, operation: operationType, result: customization.flask });
    return true;
  }

  private applyCraftingOperation(customization: FlaskCustomization, operation: FlaskCrafting): void {
    switch (operation.operation) {
      case 'reroll_prefixes':
        this.rerollPrefixes(customization.flask);
        break;
      case 'reroll_suffixes':
        this.rerollSuffixes(customization.flask);
        break;
      case 'add_prefix':
        this.addRandomPrefix(customization.flask);
        break;
      case 'add_suffix':
        this.addRandomSuffix(customization.flask);
        break;
      case 'remove_prefix':
        this.removeRandomPrefix(customization.flask);
        break;
      case 'remove_suffix':
        this.removeRandomSuffix(customization.flask);
        break;
      case 'divine_reroll':
        this.divineReroll(customization.flask);
        break;
      case 'augment':
        this.augmentFlask(customization.flask);
        break;
      case 'annul':
        this.annulFlask(customization.flask);
        break;
    }
  }

  // Master Crafting
  masterCraftModifier(flaskId: string, benchType: string, tier: number): boolean {
    const customization = this.customizedFlasks.get(flaskId);
    const modifiers = this.masterCraftingBench.get(benchType);

    if (!customization || !modifiers || tier >= modifiers.length) {
      return false;
    }

    const modifier = modifiers[tier];
    const cost = this.calculateMasterCraftCost(tier);

    if (!this.hasRequiredCurrency('crafting_bench_currency', cost)) {
      this.emit('master-craft-failed', { flaskId, reason: 'insufficient_currency' });
      return false;
    }

    // Add master crafted modifier
    this.addMasterCraftedModifier(customization.flask, modifier);
    this.consumeCurrency('crafting_bench_currency', cost);
    this.trackInvestment(flaskId, 'crafting_bench_currency', cost);

    this.emit('master-craft-applied', { flaskId, modifier, tier, cost });
    return true;
  }

  private calculateMasterCraftCost(tier: number): number {
    return Math.pow(2, tier) * 5; // Exponential scaling
  }

  // Investment Tracking
  private trackInvestment(flaskId: string, currencyType: string, amount: number): void {
    let tracker = this.investmentTrackers.get(flaskId);
    if (!tracker) {
      tracker = {
        flaskId,
        currencySpent: {},
        timeInvested: 0,
        operationsPerformed: 0,
        valueEstimate: 0,
        profitLoss: 0
      };
      this.investmentTrackers.set(flaskId, tracker);
    }

    tracker.currencySpent[currencyType] = (tracker.currencySpent[currencyType] || 0) + amount;
    tracker.operationsPerformed++;
    tracker.valueEstimate = this.estimateFlaskValue(flaskId);
    tracker.profitLoss = tracker.valueEstimate - this.calculateTotalInvestment(tracker);
  }

  private estimateFlaskValue(flaskId: string): number {
    const customization = this.customizedFlasks.get(flaskId);
    if (!customization) return 0;

    let baseValue = 1;
    
    // Quality value
    baseValue += customization.quality.level * 0.5;
    
    // Enchantment value
    baseValue += customization.enchantments.length * 10;
    
    // Modifier value
    baseValue += customization.flask.prefixes.length * 5;
    baseValue += customization.flask.suffixes.length * 5;
    
    // Rarity multiplier
    const rarityMultiplier = {
      'normal': 1,
      'magic': 2,
      'rare': 5,
      'unique': 10
    }[customization.flask.rarity] || 1;

    return baseValue * rarityMultiplier;
  }

  private calculateTotalInvestment(tracker: FlaskInvestmentTracker): number {
    return Object.values(tracker.currencySpent).reduce((sum, amount) => sum + amount, 0);
  }

  // Helper Methods
  private applyEffectToFlask(flask: FlaskData | UtilityFlaskData, effectType: string, value: number, isPercentage: boolean): void {
    // Apply effect to flask properties based on type
    switch (effectType) {
      case 'recovery_amount':
        if ('recoveryAmount' in flask && flask.recoveryAmount) {
          if (isPercentage) {
            flask.recoveryAmount *= (1 + value / 100);
          } else {
            flask.recoveryAmount += value;
          }
        }
        break;
      case 'duration':
        if ('buffDuration' in flask) {
          if (isPercentage) {
            flask.buffDuration *= (1 + value / 100);
          } else {
            flask.buffDuration += value;
          }
        }
        break;
      case 'charges':
        if (isPercentage) {
          flask.charges.maximum *= (1 + value / 100);
        } else {
          flask.charges.maximum += value;
        }
        break;
      case 'effect_magnitude':
        if ('buffMagnitude' in flask) {
          if (isPercentage) {
            flask.buffMagnitude *= (1 + value / 100);
          } else {
            flask.buffMagnitude += value;
          }
        }
        break;
    }
  }

  private hasRequiredCurrency(currencyType: string, amount: number): boolean {
    // This would integrate with the player's currency inventory
    return true; // Placeholder
  }

  private consumeCurrency(currencyType: string, amount: number): void {
    // This would remove currency from player's inventory
    this.emit('currency-consumed', { currencyType, amount });
  }

  private recordCraftingOperation(customization: FlaskCustomization, operation: string, cost: CraftingCurrency[], success: boolean): void {
    customization.craftingHistory.push({
      operation,
      timestamp: Date.now(),
      cost,
      result: success ? 'success' : 'failure',
      success
    });
  }

  // Crafting operation implementations
  private rerollPrefixes(flask: FlaskData | UtilityFlaskData): void {
    flask.prefixes = [];
    // Add random prefixes based on rarity
    // Implementation would generate new random prefixes
  }

  private rerollSuffixes(flask: FlaskData | UtilityFlaskData): void {
    flask.suffixes = [];
    // Add random suffixes based on rarity
    // Implementation would generate new random suffixes
  }

  private addRandomPrefix(flask: FlaskData | UtilityFlaskData): void {
    if (flask.prefixes.length < 3) {
      // Add random prefix
      // Implementation would select and add a random prefix
    }
  }

  private addRandomSuffix(flask: FlaskData | UtilityFlaskData): void {
    if (flask.suffixes.length < 3) {
      // Add random suffix
      // Implementation would select and add a random suffix
    }
  }

  private removeRandomPrefix(flask: FlaskData | UtilityFlaskData): void {
    if (flask.prefixes.length > 0) {
      const index = Math.floor(Math.random() * flask.prefixes.length);
      flask.prefixes.splice(index, 1);
    }
  }

  private removeRandomSuffix(flask: FlaskData | UtilityFlaskData): void {
    if (flask.suffixes.length > 0) {
      const index = Math.floor(Math.random() * flask.suffixes.length);
      flask.suffixes.splice(index, 1);
    }
  }

  private divineReroll(flask: FlaskData | UtilityFlaskData): void {
    // Reroll the values of existing modifiers
    // Implementation would reroll modifier values within their ranges
  }

  private augmentFlask(flask: FlaskData | UtilityFlaskData): void {
    // Add modifier of specific type
    // Implementation would add a modifier based on augment type
  }

  private annulFlask(flask: FlaskData | UtilityFlaskData): void {
    // Remove random modifier
    if (Math.random() < 0.5) {
      this.removeRandomPrefix(flask);
    } else {
      this.removeRandomSuffix(flask);
    }
  }

  private addRandomModifier(flask: FlaskData | UtilityFlaskData): void {
    if (Math.random() < 0.5) {
      this.addRandomPrefix(flask);
    } else {
      this.addRandomSuffix(flask);
    }
  }

  private removeRandomModifier(flask: FlaskData | UtilityFlaskData): void {
    if (Math.random() < 0.5) {
      this.removeRandomPrefix(flask);
    } else {
      this.removeRandomSuffix(flask);
    }
  }

  private transformFlaskBase(flask: FlaskData | UtilityFlaskData, newBaseType: string): void {
    // Transform to unique or different base type
    flask.baseType = newBaseType;
    flask.rarity = 'unique';
  }

  private addImplicitModifier(flask: FlaskData | UtilityFlaskData, modifier: FlaskModifier): void {
    // Add implicit modifier to flask
    // Implementation would add implicit modifier
  }

  private addMasterCraftedModifier(flask: FlaskData | UtilityFlaskData, modifier: FlaskModifier): void {
    // Add master crafted modifier (different from random modifiers)
    // Implementation would add the specific master modifier
  }

  // Public API Methods
  createFlaskCustomization(flask: FlaskData | UtilityFlaskData): string {
    const customization: FlaskCustomization = {
      flask,
      quality: {
        level: flask.quality,
        bonus: 0,
        maxLevel: 20,
        costPerLevel: {
          currencyType: 'glassblower_bauble',
          amount: 1,
          scalingFactor: 1.2
        },
        effects: this.qualityTypes.get(flask.type) || []
      },
      enchantments: [],
      isCorrupted: flask.corrupted || false,
      corruptionEffects: [],
      craftingHistory: [],
      totalInvestment: {}
    };

    this.customizedFlasks.set(flask.id, customization);
    return flask.id;
  }

  getFlaskCustomization(flaskId: string): FlaskCustomization | null {
    return this.customizedFlasks.get(flaskId) || null;
  }

  getInvestmentTracker(flaskId: string): FlaskInvestmentTracker | null {
    return this.investmentTrackers.get(flaskId) || null;
  }

  getAllAvailableEnchantments(flask: FlaskData | UtilityFlaskData): FlaskEnchantment[] {
    return Array.from(this.enchantments.values()).filter(enchantment => 
      this.checkEnchantmentRequirements(flask, enchantment)
    );
  }

  getAllCraftingOperations(): FlaskCrafting[] {
    return Array.from(this.craftingOperations.values());
  }

  getMasterCraftingOptions(): Map<string, FlaskModifier[]> {
    return new Map(this.masterCraftingBench);
  }

  getFlaskValueEstimate(flaskId: string): number {
    return this.estimateFlaskValue(flaskId);
  }

  // Cleanup
  destroy(): void {
    this.customizedFlasks.clear();
    this.investmentTrackers.clear();
    this.removeAllListeners();
    console.log('🧪 Flask Modifier System destroyed');
  }
}

export default FlaskModifierSystem;