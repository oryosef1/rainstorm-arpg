// Utility Flasks - Resistance, movement, and damage buffs
// Path of Exile inspired utility flasks with temporary buffs

import { EventEmitter } from 'events';
import { FlaskData, FlaskEffect, FlaskSuffix, FlaskPrefix, FlaskModifier } from './flask-system';

export interface UtilityFlaskData extends FlaskData {
  type: 'utility';
  utilityType: 'resistance' | 'movement' | 'damage' | 'defensive' | 'offensive';
  buffDuration: number;
  buffMagnitude: number;
  stackable: boolean;
  
  // Specific utility properties
  resistanceTypes?: ('fire' | 'cold' | 'lightning' | 'chaos')[];
  movementType?: 'speed' | 'quicksilver' | 'phase';
  damageType?: 'melee' | 'ranged' | 'spell' | 'critical';
  defensiveType?: 'armor' | 'evasion' | 'energy_shield' | 'block';
}

export interface UtilityFlaskInstance {
  flask: UtilityFlaskData;
  currentCharges: number;
  isActive: boolean;
  activeEffects: UtilityEffect[];
  cooldownEndTime: number;
  lastUsed: number;
  effectStartTime: number;
  effectEndTime: number;
}

export interface UtilityEffect {
  id: string;
  name: string;
  type: 'resistance' | 'movement' | 'damage' | 'defensive' | 'offensive';
  magnitude: number;
  duration: number;
  startTime: number;
  endTime: number;
  tags: string[];
  stackable: boolean;
  source: string;
  
  // Specific effect properties
  resistanceBonus?: Record<string, number>;
  movementSpeedBonus?: number;
  damageBonus?: Record<string, number>;
  defensiveBonus?: Record<string, number>;
  
  // Advanced properties
  conditionalBonuses?: ConditionalBonus[];
  timedEffects?: TimedEffect[];
}

export interface ConditionalBonus {
  condition: string;
  bonus: Record<string, number>;
  description: string;
}

export interface TimedEffect {
  delay: number;
  effect: Record<string, number>;
  description: string;
}

export class UtilityFlaskSystem extends EventEmitter {
  private utilityFlaskBases: Map<string, Partial<UtilityFlaskData>> = new Map();
  private utilityPrefixes: Map<string, FlaskPrefix> = new Map();
  private utilitySuffixes: Map<string, FlaskSuffix> = new Map();
  private activeUtilityEffects: Map<string, UtilityEffect> = new Map();

  constructor() {
    super();
    this.initializeUtilityFlaskBases();
    this.initializeUtilityModifiers();
    console.log('🧪 Utility Flask System initialized');
  }

  private initializeUtilityFlaskBases(): void {
    // Resistance Flasks
    this.utilityFlaskBases.set('ruby_flask', {
      name: 'Ruby Flask',
      type: 'utility',
      utilityType: 'resistance',
      baseType: 'Ruby Flask',
      buffDuration: 4000, // 4 seconds
      buffMagnitude: 50, // +50% fire resistance
      resistanceTypes: ['fire'],
      stackable: false,
      charges: {
        current: 40,
        maximum: 40,
        chargesUsedPerUse: 40,
        chargeGainOnKill: 2,
        chargeGainOnCrit: 0,
        chargeRecovery: 0.33
      },
      requirements: { level: 18 },
      effects: [
        {
          id: 'fire_resistance',
          name: 'Fire Resistance',
          type: 'resistance',
          magnitude: 50,
          duration: 4000,
          stackable: false,
          tags: ['resistance', 'fire']
        }
      ]
    });

    this.utilityFlaskBases.set('sapphire_flask', {
      name: 'Sapphire Flask',
      type: 'utility',
      utilityType: 'resistance',
      baseType: 'Sapphire Flask',
      buffDuration: 4000,
      buffMagnitude: 50,
      resistanceTypes: ['cold'],
      stackable: false,
      charges: {
        current: 40,
        maximum: 40,
        chargesUsedPerUse: 40,
        chargeGainOnKill: 2,
        chargeGainOnCrit: 0,
        chargeRecovery: 0.33
      },
      requirements: { level: 18 },
      effects: [
        {
          id: 'cold_resistance',
          name: 'Cold Resistance',
          type: 'resistance',
          magnitude: 50,
          duration: 4000,
          stackable: false,
          tags: ['resistance', 'cold']
        }
      ]
    });

    this.utilityFlaskBases.set('topaz_flask', {
      name: 'Topaz Flask',
      type: 'utility',
      utilityType: 'resistance',
      baseType: 'Topaz Flask',
      buffDuration: 4000,
      buffMagnitude: 50,
      resistanceTypes: ['lightning'],
      stackable: false,
      charges: {
        current: 40,
        maximum: 40,
        chargesUsedPerUse: 40,
        chargeGainOnKill: 2,
        chargeGainOnCrit: 0,
        chargeRecovery: 0.33
      },
      requirements: { level: 18 },
      effects: [
        {
          id: 'lightning_resistance',
          name: 'Lightning Resistance',
          type: 'resistance',
          magnitude: 50,
          duration: 4000,
          stackable: false,
          tags: ['resistance', 'lightning']
        }
      ]
    });

    this.utilityFlaskBases.set('amethyst_flask', {
      name: 'Amethyst Flask',
      type: 'utility',
      utilityType: 'resistance',
      baseType: 'Amethyst Flask',
      buffDuration: 4000,
      buffMagnitude: 35,
      resistanceTypes: ['chaos'],
      stackable: false,
      charges: {
        current: 35,
        maximum: 35,
        chargesUsedPerUse: 35,
        chargeGainOnKill: 2,
        chargeGainOnCrit: 0,
        chargeRecovery: 0.40
      },
      requirements: { level: 35 },
      effects: [
        {
          id: 'chaos_resistance',
          name: 'Chaos Resistance',
          type: 'resistance',
          magnitude: 35,
          duration: 4000,
          stackable: false,
          tags: ['resistance', 'chaos']
        }
      ]
    });

    // Movement Flasks
    this.utilityFlaskBases.set('quicksilver_flask', {
      name: 'Quicksilver Flask',
      type: 'utility',
      utilityType: 'movement',
      baseType: 'Quicksilver Flask',
      buffDuration: 4000,
      buffMagnitude: 40, // +40% movement speed
      movementType: 'quicksilver',
      stackable: false,
      charges: {
        current: 30,
        maximum: 30,
        chargesUsedPerUse: 30,
        chargeGainOnKill: 1,
        chargeGainOnCrit: 0,
        chargeRecovery: 0.50
      },
      requirements: { level: 4 },
      effects: [
        {
          id: 'movement_speed',
          name: 'Movement Speed',
          type: 'movement',
          magnitude: 40,
          duration: 4000,
          stackable: false,
          tags: ['movement', 'speed']
        }
      ]
    });

    this.utilityFlaskBases.set('quartz_flask', {
      name: 'Quartz Flask',
      type: 'utility',
      utilityType: 'movement',
      baseType: 'Quartz Flask',
      buffDuration: 4000,
      buffMagnitude: 10, // +10% attack and cast speed + phasing
      movementType: 'phase',
      stackable: false,
      charges: {
        current: 30,
        maximum: 30,
        chargesUsedPerUse: 30,
        chargeGainOnKill: 1,
        chargeGainOnCrit: 0,
        chargeRecovery: 0.50
      },
      requirements: { level: 27 },
      effects: [
        {
          id: 'phasing',
          name: 'Phasing',
          type: 'movement',
          magnitude: 1,
          duration: 4000,
          stackable: false,
          tags: ['movement', 'phasing']
        },
        {
          id: 'attack_cast_speed',
          name: 'Attack and Cast Speed',
          type: 'offensive',
          magnitude: 10,
          duration: 4000,
          stackable: false,
          tags: ['speed', 'attack', 'cast']
        }
      ]
    });

    // Damage Flasks
    this.utilityFlaskBases.set('granite_flask', {
      name: 'Granite Flask',
      type: 'utility',
      utilityType: 'defensive',
      baseType: 'Granite Flask',
      buffDuration: 4000,
      buffMagnitude: 3000, // +3000 armor
      defensiveType: 'armor',
      stackable: false,
      charges: {
        current: 30,
        maximum: 30,
        chargesUsedPerUse: 30,
        chargeGainOnKill: 1,
        chargeGainOnCrit: 0,
        chargeRecovery: 0.50
      },
      requirements: { level: 27 },
      effects: [
        {
          id: 'armor_bonus',
          name: 'Armor Bonus',
          type: 'defensive',
          magnitude: 3000,
          duration: 4000,
          stackable: false,
          tags: ['armor', 'defense']
        }
      ]
    });

    this.utilityFlaskBases.set('jade_flask', {
      name: 'Jade Flask',
      type: 'utility',
      utilityType: 'defensive',
      baseType: 'Jade Flask',
      buffDuration: 4000,
      buffMagnitude: 3000, // +3000 evasion
      defensiveType: 'evasion',
      stackable: false,
      charges: {
        current: 30,
        maximum: 30,
        chargesUsedPerUse: 30,
        chargeGainOnKill: 1,
        chargeGainOnCrit: 0,
        chargeRecovery: 0.50
      },
      requirements: { level: 27 },
      effects: [
        {
          id: 'evasion_bonus',
          name: 'Evasion Bonus',
          type: 'defensive',
          magnitude: 3000,
          duration: 4000,
          stackable: false,
          tags: ['evasion', 'defense']
        }
      ]
    });

    this.utilityFlaskBases.set('diamond_flask', {
      name: 'Diamond Flask',
      type: 'utility',
      utilityType: 'damage',
      baseType: 'Diamond Flask',
      buffDuration: 4000,
      buffMagnitude: 1, // Lucky critical strikes
      damageType: 'critical',
      stackable: false,
      charges: {
        current: 20,
        maximum: 20,
        chargesUsedPerUse: 20,
        chargeGainOnKill: 1,
        chargeGainOnCrit: 0,
        chargeRecovery: 0.67
      },
      requirements: { level: 27 },
      effects: [
        {
          id: 'lucky_crits',
          name: 'Lucky Critical Strikes',
          type: 'damage',
          magnitude: 1,
          duration: 4000,
          stackable: false,
          tags: ['critical', 'damage', 'lucky']
        }
      ]
    });

    this.utilityFlaskBases.set('sulphur_flask', {
      name: 'Sulphur Flask',
      type: 'utility',
      utilityType: 'damage',
      baseType: 'Sulphur Flask',
      buffDuration: 4000,
      buffMagnitude: 40, // +40% damage
      damageType: 'spell',
      stackable: false,
      charges: {
        current: 30,
        maximum: 30,
        chargesUsedPerUse: 30,
        chargeGainOnKill: 1,
        chargeGainOnCrit: 0,
        chargeRecovery: 0.50
      },
      requirements: { level: 35 },
      effects: [
        {
          id: 'spell_damage',
          name: 'Spell Damage',
          type: 'damage',
          magnitude: 40,
          duration: 4000,
          stackable: false,
          tags: ['spell', 'damage']
        },
        {
          id: 'consecrated_ground',
          name: 'Consecrated Ground',
          type: 'offensive',
          magnitude: 6, // 6% life regen
          duration: 4000,
          stackable: false,
          tags: ['ground', 'regen', 'holy']
        }
      ]
    });

    this.utilityFlaskBases.set('bismuth_flask', {
      name: 'Bismuth Flask',
      type: 'utility',
      utilityType: 'resistance',
      baseType: 'Bismuth Flask',
      buffDuration: 4000,
      buffMagnitude: 35, // +35% to all resistances
      resistanceTypes: ['fire', 'cold', 'lightning'],
      stackable: false,
      charges: {
        current: 40,
        maximum: 40,
        chargesUsedPerUse: 40,
        chargeGainOnKill: 2,
        chargeGainOnCrit: 0,
        chargeRecovery: 0.33
      },
      requirements: { level: 27 },
      effects: [
        {
          id: 'all_resistances',
          name: 'All Resistances',
          type: 'resistance',
          magnitude: 35,
          duration: 4000,
          stackable: false,
          tags: ['resistance', 'all']
        }
      ]
    });

    this.utilityFlaskBases.set('silver_flask', {
      name: 'Silver Flask',
      type: 'utility',
      utilityType: 'movement',
      baseType: 'Silver Flask',
      buffDuration: 4000,
      buffMagnitude: 1, // Onslaught
      movementType: 'speed',
      stackable: false,
      charges: {
        current: 30,
        maximum: 30,
        chargesUsedPerUse: 30,
        chargeGainOnKill: 1,
        chargeGainOnCrit: 0,
        chargeRecovery: 0.50
      },
      requirements: { level: 22 },
      effects: [
        {
          id: 'onslaught',
          name: 'Onslaught',
          type: 'movement',
          magnitude: 20, // +20% attack, cast and movement speed
          duration: 4000,
          stackable: false,
          tags: ['onslaught', 'speed', 'movement']
        }
      ]
    });

    this.utilityFlaskBases.set('aquamarine_flask', {
      name: 'Aquamarine Flask',
      type: 'utility',
      utilityType: 'defensive',
      baseType: 'Aquamarine Flask',
      buffDuration: 4000,
      buffMagnitude: 20, // +20% cold resistance + chill/freeze immunity
      resistanceTypes: ['cold'],
      stackable: false,
      charges: {
        current: 30,
        maximum: 30,
        chargesUsedPerUse: 30,
        chargeGainOnKill: 1,
        chargeGainOnCrit: 0,
        chargeRecovery: 0.50
      },
      requirements: { level: 27 },
      effects: [
        {
          id: 'cold_resistance_plus',
          name: 'Cold Resistance',
          type: 'resistance',
          magnitude: 20,
          duration: 4000,
          stackable: false,
          tags: ['resistance', 'cold']
        },
        {
          id: 'cold_immunity',
          name: 'Cold Ailment Immunity',
          type: 'defensive',
          magnitude: 1,
          duration: 4000,
          stackable: false,
          tags: ['immunity', 'cold', 'freeze', 'chill']
        }
      ]
    });

    console.log(`🧪 Initialized ${this.utilityFlaskBases.size} utility flask base types`);
  }

  private initializeUtilityModifiers(): void {
    // Utility Flask Prefixes
    this.utilityPrefixes.set('experimenter', {
      id: 'experimenter',
      name: 'Experimenter\'s',
      tier: 1,
      weight: 1000,
      effects: [
        { type: 'duration', value: 25, isPercentage: true }
      ]
    });

    this.utilityPrefixes.set('alchemist', {
      id: 'alchemist',
      name: 'Alchemist\'s',
      tier: 2,
      weight: 800,
      effects: [
        { type: 'effect_magnitude', value: 25, isPercentage: true }
      ]
    });

    this.utilityPrefixes.set('chemist_utility', {
      id: 'chemist_utility',
      name: 'Chemist\'s',
      tier: 3,
      weight: 800,
      effects: [
        { type: 'charges', value: 25, isPercentage: true },
        { type: 'effect_magnitude', value: -10, isPercentage: true }
      ]
    });

    this.utilityPrefixes.set('surgeon_utility', {
      id: 'surgeon_utility',
      name: 'Surgeon\'s',
      tier: 4,
      weight: 600,
      effects: [
        { type: 'charges', value: 1, isPercentage: false, condition: 'on_critical_strike' }
      ]
    });

    this.utilityPrefixes.set('saturated_utility', {
      id: 'saturated_utility',
      name: 'Saturated',
      tier: 5,
      weight: 400,
      effects: [
        { type: 'effect_magnitude', value: 15, isPercentage: true },
        { type: 'duration', value: -10, isPercentage: true }
      ]
    });

    // Utility Flask Suffixes
    this.utilitySuffixes.set('of_resistance', {
      id: 'of_resistance',
      name: 'of Resistance',
      tier: 1,
      weight: 1000,
      effects: [
        { type: 'effect_magnitude', value: 10, isPercentage: true }
      ]
    });

    this.utilitySuffixes.set('of_iron_skin', {
      id: 'of_iron_skin',
      name: 'of Iron Skin',
      tier: 2,
      weight: 800,
      effects: [
        { type: 'effect_magnitude', value: 100, isPercentage: true, condition: 'armor_flask' }
      ]
    });

    this.utilitySuffixes.set('of_reflexes', {
      id: 'of_reflexes',
      name: 'of Reflexes',
      tier: 2,
      weight: 800,
      effects: [
        { type: 'effect_magnitude', value: 100, isPercentage: true, condition: 'evasion_flask' }
      ]
    });

    this.utilitySuffixes.set('of_adrenaline', {
      id: 'of_adrenaline',
      name: 'of Adrenaline',
      tier: 3,
      weight: 600,
      effects: [
        { type: 'effect_magnitude', value: 25, isPercentage: true, condition: 'movement_flask' }
      ]
    });

    this.utilitySuffixes.set('of_the_rainbow', {
      id: 'of_the_rainbow',
      name: 'of the Rainbow',
      tier: 4,
      weight: 400,
      effects: [
        { type: 'effect_magnitude', value: 15, isPercentage: true, condition: 'resistance_flask' }
      ]
    });

    console.log(`🧪 Initialized ${this.utilityPrefixes.size} utility prefixes and ${this.utilitySuffixes.size} utility suffixes`);
  }

  // === UTILITY FLASK GENERATION ===

  generateUtilityFlask(baseType: string, itemLevel: number, rarity: 'normal' | 'magic' | 'rare' = 'normal'): UtilityFlaskData | null {
    const base = this.utilityFlaskBases.get(baseType);
    if (!base) {
      return null;
    }

    const flask: UtilityFlaskData = {
      id: this.generateFlaskId(),
      name: base.name!,
      description: '',
      type: 'utility',
      utilityType: base.utilityType!,
      baseType: base.baseType!,
      quality: 0,
      rarity,
      level: 1,
      buffDuration: base.buffDuration!,
      buffMagnitude: base.buffMagnitude!,
      stackable: base.stackable!,
      charges: { ...base.charges! },
      effects: base.effects ? [...base.effects] : [],
      suffixes: [],
      prefixes: [],
      requirements: { ...base.requirements! },
      itemLevel,
      resistanceTypes: base.resistanceTypes,
      movementType: base.movementType,
      damageType: base.damageType,
      defensiveType: base.defensiveType
    };

    // Apply rarity-based modifications
    if (rarity === 'magic') {
      this.applyUtilityMagicModifiers(flask);
    } else if (rarity === 'rare') {
      this.applyUtilityRareModifiers(flask);
    }

    this.updateUtilityFlaskDescription(flask);

    return flask;
  }

  private applyUtilityMagicModifiers(flask: UtilityFlaskData): void {
    const availableSuffixes = Array.from(this.utilitySuffixes.values())
      .filter(suffix => this.isModifierApplicable(suffix, flask));
    const availablePrefixes = Array.from(this.utilityPrefixes.values());

    if (Math.random() < 0.8 && availableSuffixes.length > 0) {
      const suffix = availableSuffixes[Math.floor(Math.random() * availableSuffixes.length)];
      flask.suffixes.push(suffix);
      flask.name = `${flask.name} ${suffix.name}`;
    }

    if (Math.random() < 0.6 && availablePrefixes.length > 0) {
      const prefix = availablePrefixes[Math.floor(Math.random() * availablePrefixes.length)];
      flask.prefixes.push(prefix);
      flask.name = `${prefix.name} ${flask.name}`;
    }
  }

  private applyUtilityRareModifiers(flask: UtilityFlaskData): void {
    const availableSuffixes = Array.from(this.utilitySuffixes.values())
      .filter(suffix => this.isModifierApplicable(suffix, flask));
    const availablePrefixes = Array.from(this.utilityPrefixes.values());

    // Add 1-3 suffixes
    const suffixCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < suffixCount && availableSuffixes.length > 0; i++) {
      const index = Math.floor(Math.random() * availableSuffixes.length);
      const suffix = availableSuffixes.splice(index, 1)[0];
      flask.suffixes.push(suffix);
    }

    // Add 1-3 prefixes
    const prefixCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < prefixCount && availablePrefixes.length > 0; i++) {
      const index = Math.floor(Math.random() * availablePrefixes.length);
      const prefix = availablePrefixes.splice(index, 1)[0];
      flask.prefixes.push(prefix);
    }

    // Generate rare flask name
    flask.name = this.generateRareUtilityFlaskName();
  }

  private isModifierApplicable(modifier: FlaskSuffix | FlaskPrefix, flask: UtilityFlaskData): boolean {
    for (const effect of modifier.effects) {
      if (effect.condition) {
        switch (effect.condition) {
          case 'armor_flask':
            return flask.defensiveType === 'armor';
          case 'evasion_flask':
            return flask.defensiveType === 'evasion';
          case 'movement_flask':
            return flask.utilityType === 'movement';
          case 'resistance_flask':
            return flask.utilityType === 'resistance';
          default:
            return true;
        }
      }
    }
    return true;
  }

  private generateRareUtilityFlaskName(): string {
    const prefixes = ['Vortex', 'Storm', 'Wraith', 'Phoenix', 'Dragon', 'Titan', 'Void', 'Spectral'];
    const suffixes = ['Guard', 'Ward', 'Shield', 'Barrier', 'Veil', 'Cloak', 'Mantle', 'Aegis'];

    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

    return `${prefix} ${suffix}`;
  }

  private updateUtilityFlaskDescription(flask: UtilityFlaskData): void {
    const descriptions: string[] = [];

    // Base effect description
    descriptions.push(this.getUtilityEffectDescription(flask));

    // Duration and charges
    descriptions.push(`${Math.floor(flask.buffDuration / 1000)} second duration`);
    descriptions.push(`Currently has ${flask.charges.current} of ${flask.charges.maximum} Charges`);
    descriptions.push(`Consumes ${flask.charges.chargesUsedPerUse} of ${flask.charges.maximum} Charges on use`);

    // Modifier descriptions
    for (const prefix of flask.prefixes) {
      for (const effect of prefix.effects) {
        descriptions.push(this.getUtilityModifierDescription(effect));
      }
    }

    for (const suffix of flask.suffixes) {
      for (const effect of suffix.effects) {
        descriptions.push(this.getUtilityModifierDescription(effect));
      }
    }

    flask.description = descriptions.join('\n');
  }

  private getUtilityEffectDescription(flask: UtilityFlaskData): string {
    switch (flask.utilityType) {
      case 'resistance':
        if (flask.resistanceTypes?.includes('fire') && flask.resistanceTypes?.includes('cold') && flask.resistanceTypes?.includes('lightning')) {
          return `+${flask.buffMagnitude}% to all Elemental Resistances`;
        } else if (flask.resistanceTypes?.length === 1) {
          const type = flask.resistanceTypes[0];
          return `+${flask.buffMagnitude}% to ${type.charAt(0).toUpperCase() + type.slice(1)} Resistance`;
        } else {
          return `+${flask.buffMagnitude}% to Resistances`;
        }

      case 'movement':
        if (flask.movementType === 'quicksilver') {
          return `+${flask.buffMagnitude}% increased Movement Speed`;
        } else if (flask.movementType === 'phase') {
          return `Grants Phasing`;
        } else {
          return `Grants Onslaught`;
        }

      case 'damage':
        if (flask.damageType === 'critical') {
          return `Lucky Critical Strike Chance`;
        } else {
          return `+${flask.buffMagnitude}% increased ${flask.damageType?.charAt(0).toUpperCase() + flask.damageType?.slice(1)} Damage`;
        }

      case 'defensive':
        if (flask.defensiveType === 'armor') {
          return `+${flask.buffMagnitude} to Armor`;
        } else if (flask.defensiveType === 'evasion') {
          return `+${flask.buffMagnitude} to Evasion Rating`;
        } else {
          return `+${flask.buffMagnitude} to ${flask.defensiveType?.charAt(0).toUpperCase() + flask.defensiveType?.slice(1)}`;
        }

      default:
        return `Grants ${flask.name} effect`;
    }
  }

  private getUtilityModifierDescription(modifier: FlaskModifier): string {
    switch (modifier.type) {
      case 'duration':
        return `${modifier.value > 0 ? '+' : ''}${modifier.value}${modifier.isPercentage ? '%' : ''} to Flask Duration`;
      case 'effect_magnitude':
        return `${modifier.value > 0 ? '+' : ''}${modifier.value}${modifier.isPercentage ? '%' : ''} to Flask Effect`;
      case 'charges':
        if (modifier.condition === 'on_critical_strike') {
          return `Gains ${modifier.value} Charge when you deal a Critical Strike`;
        }
        return `${modifier.value > 0 ? '+' : ''}${modifier.value}${modifier.isPercentage ? '%' : ''} to Maximum Charges`;
      default:
        return `${modifier.type}: ${modifier.value}${modifier.isPercentage ? '%' : ''}`;
    }
  }

  // === UTILITY FLASK EFFECTS ===

  applyUtilityFlaskEffect(flask: UtilityFlaskData): UtilityEffect[] {
    const now = Date.now();
    const appliedEffects: UtilityEffect[] = [];

    // Calculate modified duration and magnitude
    const duration = this.calculateUtilityDuration(flask);
    const magnitude = this.calculateUtilityMagnitude(flask);

    for (const baseEffect of flask.effects) {
      const effect: UtilityEffect = {
        id: `${baseEffect.id}_${now}_${Math.random().toString(36).substr(2, 5)}`,
        name: baseEffect.name,
        type: baseEffect.type,
        magnitude: this.applyMagnitudeModifiers(baseEffect.magnitude, magnitude, flask),
        duration,
        startTime: now,
        endTime: now + duration,
        tags: [...baseEffect.tags],
        stackable: baseEffect.stackable,
        source: flask.id
      };

      // Apply specific effect properties based on type
      this.applySpecificEffectProperties(effect, flask);

      appliedEffects.push(effect);
      this.activeUtilityEffects.set(effect.id, effect);

      // Emit events for specific effect types
      this.emitUtilityEffectEvents(effect, flask);

      // Schedule effect removal
      setTimeout(() => {
        this.removeUtilityEffect(effect.id);
      }, duration);
    }

    return appliedEffects;
  }

  private calculateUtilityDuration(flask: UtilityFlaskData): number {
    let duration = flask.buffDuration;

    // Apply duration modifiers
    for (const prefix of flask.prefixes) {
      for (const effect of prefix.effects) {
        if (effect.type === 'duration') {
          if (effect.isPercentage) {
            duration *= (1 + effect.value / 100);
          } else {
            duration += effect.value;
          }
        }
      }
    }

    // Apply quality bonus (20% quality = 20% increased duration)
    duration *= (1 + flask.quality / 100);

    return Math.floor(duration);
  }

  private calculateUtilityMagnitude(flask: UtilityFlaskData): number {
    let multiplier = 1.0;

    // Apply magnitude modifiers
    for (const prefix of flask.prefixes) {
      for (const effect of prefix.effects) {
        if (effect.type === 'effect_magnitude') {
          if (this.isModifierConditionMet(effect.condition, flask)) {
            multiplier *= (1 + effect.value / 100);
          }
        }
      }
    }

    for (const suffix of flask.suffixes) {
      for (const effect of suffix.effects) {
        if (effect.type === 'effect_magnitude') {
          if (this.isModifierConditionMet(effect.condition, flask)) {
            multiplier *= (1 + effect.value / 100);
          }
        }
      }
    }

    return multiplier;
  }

  private isModifierConditionMet(condition: string | undefined, flask: UtilityFlaskData): boolean {
    if (!condition) return true;

    switch (condition) {
      case 'armor_flask':
        return flask.defensiveType === 'armor';
      case 'evasion_flask':
        return flask.defensiveType === 'evasion';
      case 'movement_flask':
        return flask.utilityType === 'movement';
      case 'resistance_flask':
        return flask.utilityType === 'resistance';
      default:
        return true;
    }
  }

  private applyMagnitudeModifiers(baseMagnitude: number, multiplier: number, flask: UtilityFlaskData): number {
    return Math.floor(baseMagnitude * multiplier);
  }

  private applySpecificEffectProperties(effect: UtilityEffect, flask: UtilityFlaskData): void {
    switch (flask.utilityType) {
      case 'resistance':
        effect.resistanceBonus = {};
        if (flask.resistanceTypes) {
          for (const resistanceType of flask.resistanceTypes) {
            effect.resistanceBonus[resistanceType] = effect.magnitude;
          }
        }
        break;

      case 'movement':
        if (flask.movementType === 'quicksilver' || flask.movementType === 'speed') {
          effect.movementSpeedBonus = effect.magnitude;
        }
        break;

      case 'damage':
        effect.damageBonus = {};
        if (flask.damageType) {
          effect.damageBonus[flask.damageType] = effect.magnitude;
        }
        break;

      case 'defensive':
        effect.defensiveBonus = {};
        if (flask.defensiveType) {
          effect.defensiveBonus[flask.defensiveType] = effect.magnitude;
        }
        break;
    }
  }

  private emitUtilityEffectEvents(effect: UtilityEffect, flask: UtilityFlaskData): void {
    this.emit('utility-effect-applied', { effect, flask });

    // Emit specific events based on effect type
    switch (effect.type) {
      case 'resistance':
        this.emit('resistance-bonus-applied', {
          resistances: effect.resistanceBonus,
          duration: effect.duration,
          source: 'utility_flask'
        });
        break;

      case 'movement':
        this.emit('movement-bonus-applied', {
          speedBonus: effect.movementSpeedBonus,
          duration: effect.duration,
          source: 'utility_flask'
        });
        break;

      case 'damage':
        this.emit('damage-bonus-applied', {
          damageBonus: effect.damageBonus,
          duration: effect.duration,
          source: 'utility_flask'
        });
        break;

      case 'defensive':
        this.emit('defensive-bonus-applied', {
          defensiveBonus: effect.defensiveBonus,
          duration: effect.duration,
          source: 'utility_flask'
        });
        break;
    }
  }

  private removeUtilityEffect(effectId: string): void {
    const effect = this.activeUtilityEffects.get(effectId);
    if (effect) {
      this.activeUtilityEffects.delete(effectId);
      this.emit('utility-effect-removed', effect);

      // Emit specific removal events
      switch (effect.type) {
        case 'resistance':
          this.emit('resistance-bonus-removed', {
            resistances: effect.resistanceBonus,
            source: 'utility_flask'
          });
          break;

        case 'movement':
          this.emit('movement-bonus-removed', {
            speedBonus: effect.movementSpeedBonus,
            source: 'utility_flask'
          });
          break;

        case 'damage':
          this.emit('damage-bonus-removed', {
            damageBonus: effect.damageBonus,
            source: 'utility_flask'
          });
          break;

        case 'defensive':
          this.emit('defensive-bonus-removed', {
            defensiveBonus: effect.defensiveBonus,
            source: 'utility_flask'
          });
          break;
      }
    }
  }

  private generateFlaskId(): string {
    return `utility_flask_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  // === PUBLIC API ===

  getUtilityFlaskBases(): string[] {
    return Array.from(this.utilityFlaskBases.keys());
  }

  getActiveUtilityEffects(): UtilityEffect[] {
    return Array.from(this.activeUtilityEffects.values());
  }

  getUtilityEffectsByType(type: string): UtilityEffect[] {
    return Array.from(this.activeUtilityEffects.values())
      .filter(effect => effect.type === type);
  }

  getTotalResistanceBonus(): Record<string, number> {
    const total: Record<string, number> = {};
    
    for (const effect of this.activeUtilityEffects.values()) {
      if (effect.resistanceBonus) {
        for (const [resistance, bonus] of Object.entries(effect.resistanceBonus)) {
          total[resistance] = (total[resistance] || 0) + bonus;
        }
      }
    }
    
    return total;
  }

  getTotalMovementSpeedBonus(): number {
    let total = 0;
    
    for (const effect of this.activeUtilityEffects.values()) {
      if (effect.movementSpeedBonus) {
        total += effect.movementSpeedBonus;
      }
    }
    
    return total;
  }

  getTotalDamageBonus(damageType?: string): Record<string, number> {
    const total: Record<string, number> = {};
    
    for (const effect of this.activeUtilityEffects.values()) {
      if (effect.damageBonus) {
        for (const [type, bonus] of Object.entries(effect.damageBonus)) {
          if (!damageType || type === damageType) {
            total[type] = (total[type] || 0) + bonus;
          }
        }
      }
    }
    
    return total;
  }

  getTotalDefensiveBonus(): Record<string, number> {
    const total: Record<string, number> = {};
    
    for (const effect of this.activeUtilityEffects.values()) {
      if (effect.defensiveBonus) {
        for (const [defense, bonus] of Object.entries(effect.defensiveBonus)) {
          total[defense] = (total[defense] || 0) + bonus;
        }
      }
    }
    
    return total;
  }

  // === CLEANUP ===

  destroy(): void {
    // Clear all active effects
    for (const effectId of this.activeUtilityEffects.keys()) {
      this.removeUtilityEffect(effectId);
    }

    this.activeUtilityEffects.clear();
    this.removeAllListeners();

    console.log('🧪 Utility Flask System destroyed');
  }
}