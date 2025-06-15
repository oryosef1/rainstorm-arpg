import { EventEmitter } from 'events';
import { ISystem, IEntity } from '../ecs/ecs-core';
import { SystemMetrics } from '../../types/ecs-types';

export interface ChargeType {
  id: string;
  name: string;
  description: string;
  category: 'flask' | 'power' | 'frenzy' | 'endurance' | 'spirit' | 'inspiration' | 'blood';
  maxCharges: number;
  duration: number;
  effects: ChargeEffect[];
  stackable: boolean;
  decayRate: number;
  visualEffect: string;
}

export interface ChargeEffect {
  type: 'damage' | 'speed' | 'defense' | 'critical' | 'recovery' | 'resistance' | 'utility';
  stat: string;
  value: number;
  valueType: 'flat' | 'percentage' | 'multiplier';
  perCharge: boolean;
  condition?: string;
}

export interface ChargeSource {
  id: string;
  name: string;
  description: string;
  type: 'combat' | 'passive' | 'skill' | 'item' | 'environmental' | 'consumable';
  triggers: ChargeTrigger[];
  chargeTypes: string[];
  baseAmount: number;
  cooldown: number;
  requirements: ChargeRequirement[];
}

export interface ChargeTrigger {
  event: 'kill' | 'critical_strike' | 'hit' | 'dodge' | 'block' | 'use_skill' | 'take_damage' | 'low_life' | 'time_elapsed';
  condition?: string;
  value?: number;
  chance: number;
  cooldown: number;
}

export interface ChargeRequirement {
  type: 'level' | 'skill' | 'item' | 'attribute' | 'quest' | 'character_class';
  target: string | number;
  value?: number;
}

export interface ChargeInstance {
  chargeType: string;
  currentCharges: number;
  source: string;
  startTime: number;
  lastGainTime: number;
  decayTimer: number;
  modifiers: ChargeModifier[];
}

export interface ChargeModifier {
  id: string;
  type: 'gain_rate' | 'max_charges' | 'duration' | 'effect_magnitude' | 'decay_rate';
  value: number;
  source: string;
  condition?: string;
}

export interface ChargeGenerationEvent {
  sourceId: string;
  chargeType: string;
  amount: number;
  trigger: string;
  timestamp: number;
  playerLevel: number;
  context: Record<string, any>;
}

export interface ChargeConsumption {
  id: string;
  name: string;
  description: string;
  chargeType: string;
  consumptionType: 'all' | 'partial' | 'per_use';
  amount: number;
  effects: ConsumptionEffect[];
  cooldown: number;
}

export interface ConsumptionEffect {
  type: 'damage' | 'healing' | 'buff' | 'debuff' | 'utility';
  magnitude: number;
  duration?: number;
  perChargeConsumed: boolean;
}

export interface ChargeEfficiency {
  sourceId: string;
  generationRate: number;
  averageUptime: number;
  consumptionRate: number;
  efficiency: number;
  recommendations: string[];
}

export class ChargeGenerationSystem extends EventEmitter implements ISystem {
  readonly name: string = 'ChargeGenerationSystem';
  readonly requiredComponents: readonly string[] = ['Character', 'Charges'];
  readonly entities: Set<IEntity> = new Set();
  readonly priority: number = 25;
  enabled: boolean = true;

  private chargeTypes: Map<string, ChargeType> = new Map();
  private chargeSources: Map<string, ChargeSource> = new Map();
  private chargeConsumptions: Map<string, ChargeConsumption> = new Map();
  private activeCharges: Map<string, ChargeInstance[]> = new Map();
  private chargeHistory: ChargeGenerationEvent[] = [];
  private globalModifiers: ChargeModifier[] = [];
  private entityCooldowns: Map<string, Map<string, number>> = new Map();

  constructor() {
    super();
    this.initializeChargeTypes();
    this.initializeChargeSources();
    this.initializeChargeConsumptions();
    console.log('⚡ Charge Generation System initialized');
  }

  addEntity(entity: IEntity): void {
    if (this.canProcess(entity)) {
      this.entities.add(entity);
      this.activeCharges.set(entity.id, []);
      this.entityCooldowns.set(entity.id, new Map());
      this.emit('entityAdded', { system: this.name, entity });
    }
  }

  removeEntity(entity: IEntity): void {
    if (this.entities.has(entity)) {
      this.entities.delete(entity);
      this.activeCharges.delete(entity.id);
      this.entityCooldowns.delete(entity.id);
      this.emit('entityRemoved', { system: this.name, entity });
    }
  }

  update(deltaTime: number): void {
    if (!this.enabled) return;

    const now = Date.now();

    // Update charge decay and expiration
    for (const [entityId, charges] of this.activeCharges) {
      this.updateChargeDecay(entityId, charges, deltaTime);
    }

    // Update cooldowns
    this.updateCooldowns(deltaTime);

    // Process charge-related entities
    for (const entity of this.entities) {
      this.processChargeEntity(entity, deltaTime);
    }

    // Clean up expired charges
    this.cleanupExpiredCharges();
  }

  canProcess(entity: IEntity): boolean {
    return entity.hasComponents(this.requiredComponents);
  }

  cleanup(): void {
    this.entities.clear();
    this.activeCharges.clear();
    this.entityCooldowns.clear();
    this.chargeHistory = [];
    this.emit('systemCleanup', { system: this.name });
  }

  getMetrics(): SystemMetrics {
    return {
      name: this.name,
      executionTime: 0,
      entityCount: this.entities.size,
      lastUpdate: Date.now(),
      averageTime: 0,
      maxTime: 0,
      minTime: 0
    };
  }

  // Charge Generation
  generateCharge(entityId: string, sourceId: string, trigger: string, context: Record<string, any> = {}): boolean {
    const source = this.chargeSources.get(sourceId);
    if (!source) return false;

    // Check trigger validity
    const validTrigger = source.triggers.find(t => t.event === trigger);
    if (!validTrigger) return false;

    // Check cooldown
    if (this.isOnCooldown(entityId, sourceId)) {
      return false;
    }

    // Check chance
    if (Math.random() > validTrigger.chance) {
      return false;
    }

    // Check trigger conditions
    if (!this.evaluateTriggerCondition(validTrigger, context)) {
      return false;
    }

    // Generate charges for each type
    let chargesGenerated = false;
    for (const chargeTypeId of source.chargeTypes) {
      const amount = this.calculateChargeAmount(source, chargeTypeId, context);
      if (this.addCharges(entityId, chargeTypeId, amount, sourceId)) {
        chargesGenerated = true;
      }
    }

    if (chargesGenerated) {
      // Set cooldown
      this.setCooldown(entityId, sourceId, source.cooldown);

      // Record generation event
      this.recordChargeGeneration(entityId, sourceId, trigger, source.chargeTypes, context);

      this.emit('chargeGenerated', {
        entityId,
        sourceId,
        trigger,
        chargeTypes: source.chargeTypes,
        context
      });
    }

    return chargesGenerated;
  }

  addCharges(entityId: string, chargeTypeId: string, amount: number, sourceId: string): boolean {
    const chargeType = this.chargeTypes.get(chargeTypeId);
    if (!chargeType || amount <= 0) return false;

    const entityCharges = this.activeCharges.get(entityId) || [];
    let chargeInstance = entityCharges.find(c => c.chargeType === chargeTypeId);

    if (!chargeInstance) {
      // Create new charge instance
      chargeInstance = {
        chargeType: chargeTypeId,
        currentCharges: 0,
        source: sourceId,
        startTime: Date.now(),
        lastGainTime: Date.now(),
        decayTimer: chargeType.duration,
        modifiers: []
      };
      entityCharges.push(chargeInstance);
    }

    // Calculate maximum charges with modifiers
    const maxCharges = this.calculateMaxCharges(chargeType, chargeInstance.modifiers);
    const actualAmount = Math.min(amount, maxCharges - chargeInstance.currentCharges);

    if (actualAmount > 0) {
      chargeInstance.currentCharges += actualAmount;
      chargeInstance.lastGainTime = Date.now();
      chargeInstance.decayTimer = chargeType.duration;

      this.emit('chargesAdded', {
        entityId,
        chargeType: chargeTypeId,
        amount: actualAmount,
        totalCharges: chargeInstance.currentCharges,
        sourceId
      });

      return true;
    }

    return false;
  }

  removeCharges(entityId: string, chargeTypeId: string, amount: number): boolean {
    const entityCharges = this.activeCharges.get(entityId) || [];
    const chargeInstance = entityCharges.find(c => c.chargeType === chargeTypeId);

    if (!chargeInstance || chargeInstance.currentCharges === 0) {
      return false;
    }

    const actualAmount = Math.min(amount, chargeInstance.currentCharges);
    chargeInstance.currentCharges -= actualAmount;

    this.emit('chargesRemoved', {
      entityId,
      chargeType: chargeTypeId,
      amount: actualAmount,
      totalCharges: chargeInstance.currentCharges
    });

    // Remove charge instance if empty
    if (chargeInstance.currentCharges === 0) {
      const index = entityCharges.indexOf(chargeInstance);
      entityCharges.splice(index, 1);
      
      this.emit('chargeInstanceExpired', {
        entityId,
        chargeType: chargeTypeId
      });
    }

    return true;
  }

  // Charge Consumption
  consumeCharges(entityId: string, consumptionId: string): boolean {
    const consumption = this.chargeConsumptions.get(consumptionId);
    if (!consumption) return false;

    const entityCharges = this.activeCharges.get(entityId) || [];
    const chargeInstance = entityCharges.find(c => c.chargeType === consumption.chargeType);

    if (!chargeInstance || chargeInstance.currentCharges === 0) {
      return false;
    }

    let consumedAmount = 0;
    switch (consumption.consumptionType) {
      case 'all':
        consumedAmount = chargeInstance.currentCharges;
        break;
      case 'partial':
        consumedAmount = Math.min(consumption.amount, chargeInstance.currentCharges);
        break;
      case 'per_use':
        consumedAmount = consumption.amount;
        break;
    }

    if (consumedAmount > chargeInstance.currentCharges) {
      return false;
    }

    // Apply consumption effects
    this.applyConsumptionEffects(entityId, consumption, consumedAmount);

    // Remove charges
    this.removeCharges(entityId, consumption.chargeType, consumedAmount);

    this.emit('chargesConsumed', {
      entityId,
      consumptionId,
      chargeType: consumption.chargeType,
      amount: consumedAmount
    });

    return true;
  }

  // Charge Effects
  getChargeEffects(entityId: string): Map<string, number> {
    const effects = new Map<string, number>();
    const entityCharges = this.activeCharges.get(entityId) || [];

    for (const chargeInstance of entityCharges) {
      const chargeType = this.chargeTypes.get(chargeInstance.chargeType);
      if (!chargeType) continue;

      for (const effect of chargeType.effects) {
        const key = `${effect.type}_${effect.stat}`;
        const existingValue = effects.get(key) || 0;
        
        let effectValue = effect.value;
        if (effect.perCharge) {
          effectValue *= chargeInstance.currentCharges;
        }

        // Apply effect based on value type
        switch (effect.valueType) {
          case 'flat':
            effects.set(key, existingValue + effectValue);
            break;
          case 'percentage':
            effects.set(key, existingValue + effectValue);
            break;
          case 'multiplier':
            effects.set(key, (existingValue || 1) * effectValue);
            break;
        }
      }
    }

    return effects;
  }

  getCurrentCharges(entityId: string, chargeTypeId?: string): Map<string, number> {
    const charges = new Map<string, number>();
    const entityCharges = this.activeCharges.get(entityId) || [];

    for (const chargeInstance of entityCharges) {
      if (!chargeTypeId || chargeInstance.chargeType === chargeTypeId) {
        charges.set(chargeInstance.chargeType, chargeInstance.currentCharges);
      }
    }

    return charges;
  }

  // Charge Modifiers
  addChargeModifier(entityId: string, modifier: ChargeModifier): void {
    const entityCharges = this.activeCharges.get(entityId) || [];
    
    // Add to global modifiers if no specific charge type
    if (!modifier.condition) {
      this.globalModifiers.push(modifier);
    } else {
      // Add to specific charge instances
      for (const chargeInstance of entityCharges) {
        if (this.evaluateModifierCondition(modifier, chargeInstance)) {
          chargeInstance.modifiers.push(modifier);
        }
      }
    }

    this.emit('chargeModifierAdded', { entityId, modifier });
  }

  removeChargeModifier(entityId: string, modifierId: string): void {
    // Remove from global modifiers
    this.globalModifiers = this.globalModifiers.filter(m => m.id !== modifierId);

    // Remove from charge instances
    const entityCharges = this.activeCharges.get(entityId) || [];
    for (const chargeInstance of entityCharges) {
      chargeInstance.modifiers = chargeInstance.modifiers.filter(m => m.id !== modifierId);
    }

    this.emit('chargeModifierRemoved', { entityId, modifierId });
  }

  // Analytics and Optimization
  getChargeEfficiency(entityId: string, sourceId: string): ChargeEfficiency {
    const events = this.chargeHistory.filter(e => 
      e.sourceId === sourceId && this.getEntityIdFromEvent(e) === entityId
    );

    if (events.length === 0) {
      return {
        sourceId,
        generationRate: 0,
        averageUptime: 0,
        consumptionRate: 0,
        efficiency: 0,
        recommendations: ['No data available']
      };
    }

    const timeSpan = Date.now() - events[0].timestamp;
    const generationRate = events.length / (timeSpan / 60000); // per minute
    
    // Calculate uptime (placeholder - would need actual tracking)
    const averageUptime = 0.5; // 50% uptime estimate
    
    const efficiency = generationRate * averageUptime;
    
    const recommendations = this.generateEfficiencyRecommendations(efficiency);

    return {
      sourceId,
      generationRate,
      averageUptime,
      consumptionRate: 0, // Would calculate from consumption events
      efficiency,
      recommendations
    };
  }

  getChargeStatistics(entityId: string): Record<string, any> {
    const entityCharges = this.activeCharges.get(entityId) || [];
    const stats: Record<string, any> = {};

    for (const chargeInstance of entityCharges) {
      const chargeType = this.chargeTypes.get(chargeInstance.chargeType);
      if (!chargeType) continue;

      stats[chargeInstance.chargeType] = {
        current: chargeInstance.currentCharges,
        maximum: this.calculateMaxCharges(chargeType, chargeInstance.modifiers),
        uptime: this.calculateUptime(chargeInstance),
        lastGain: Date.now() - chargeInstance.lastGainTime,
        source: chargeInstance.source,
        effects: chargeType.effects.length
      };
    }

    return stats;
  }

  // Private Helper Methods
  private updateChargeDecay(entityId: string, charges: ChargeInstance[], deltaTime: number): void {
    for (const chargeInstance of charges) {
      const chargeType = this.chargeTypes.get(chargeInstance.chargeType);
      if (!chargeType) continue;

      // Update decay timer
      chargeInstance.decayTimer -= deltaTime;

      // Apply decay if timer expired
      if (chargeInstance.decayTimer <= 0 && chargeType.decayRate > 0) {
        const decayAmount = Math.min(chargeType.decayRate, chargeInstance.currentCharges);
        this.removeCharges(entityId, chargeInstance.chargeType, decayAmount);
        
        // Reset decay timer
        chargeInstance.decayTimer = chargeType.duration;
      }
    }
  }

  private updateCooldowns(deltaTime: number): void {
    for (const [entityId, cooldowns] of this.entityCooldowns) {
      for (const [sourceId, endTime] of cooldowns) {
        if (Date.now() >= endTime) {
          cooldowns.delete(sourceId);
        }
      }
    }
  }

  private cleanupExpiredCharges(): void {
    for (const [entityId, charges] of this.activeCharges) {
      const activeCharges = charges.filter(c => c.currentCharges > 0);
      this.activeCharges.set(entityId, activeCharges);
    }
  }

  private isOnCooldown(entityId: string, sourceId: string): boolean {
    const cooldowns = this.entityCooldowns.get(entityId);
    if (!cooldowns) return false;

    const endTime = cooldowns.get(sourceId);
    return endTime ? Date.now() < endTime : false;
  }

  private setCooldown(entityId: string, sourceId: string, duration: number): void {
    let cooldowns = this.entityCooldowns.get(entityId);
    if (!cooldowns) {
      cooldowns = new Map();
      this.entityCooldowns.set(entityId, cooldowns);
    }

    cooldowns.set(sourceId, Date.now() + duration);
  }

  private evaluateTriggerCondition(trigger: ChargeTrigger, context: Record<string, any>): boolean {
    if (!trigger.condition) return true;

    // Evaluate condition based on context
    switch (trigger.condition) {
      case 'low_life':
        return (context.lifePercentage || 100) < (trigger.value || 35);
      case 'critical_hit':
        return context.isCritical === true;
      case 'enemy_type':
        return context.enemyType === trigger.value;
      case 'skill_type':
        return context.skillType === trigger.value;
      default:
        return true;
    }
  }

  private calculateChargeAmount(source: ChargeSource, chargeTypeId: string, context: Record<string, any>): number {
    let amount = source.baseAmount;

    // Apply context-based multipliers
    if (context.damageDealt) {
      amount += Math.floor(context.damageDealt / 1000); // Bonus charges for high damage
    }

    if (context.enemyLevel) {
      amount += Math.floor(context.enemyLevel / 10); // Bonus for higher level enemies
    }

    return Math.max(1, amount);
  }

  private calculateMaxCharges(chargeType: ChargeType, modifiers: ChargeModifier[]): number {
    let maxCharges = chargeType.maxCharges;

    for (const modifier of modifiers) {
      if (modifier.type === 'max_charges') {
        maxCharges += modifier.value;
      }
    }

    // Apply global modifiers
    for (const modifier of this.globalModifiers) {
      if (modifier.type === 'max_charges') {
        maxCharges += modifier.value;
      }
    }

    return Math.max(1, maxCharges);
  }

  private applyConsumptionEffects(entityId: string, consumption: ChargeConsumption, amount: number): void {
    for (const effect of consumption.effects) {
      let magnitude = effect.magnitude;
      if (effect.perChargeConsumed) {
        magnitude *= amount;
      }

      this.emit('consumptionEffectApplied', {
        entityId,
        effect: effect.type,
        magnitude,
        duration: effect.duration
      });
    }
  }

  private evaluateModifierCondition(modifier: ChargeModifier, chargeInstance: ChargeInstance): boolean {
    if (!modifier.condition) return true;

    // Evaluate condition based on charge instance
    return chargeInstance.chargeType === modifier.condition;
  }

  private calculateUptime(chargeInstance: ChargeInstance): number {
    const totalTime = Date.now() - chargeInstance.startTime;
    const activeTime = Date.now() - chargeInstance.lastGainTime;
    return totalTime > 0 ? activeTime / totalTime : 0;
  }

  private recordChargeGeneration(entityId: string, sourceId: string, trigger: string, chargeTypes: string[], context: Record<string, any>): void {
    const event: ChargeGenerationEvent = {
      sourceId,
      chargeType: chargeTypes[0], // Primary charge type
      amount: 1,
      trigger,
      timestamp: Date.now(),
      playerLevel: context.playerLevel || 1,
      context
    };

    this.chargeHistory.push(event);

    // Keep only recent history (last 1000 events)
    if (this.chargeHistory.length > 1000) {
      this.chargeHistory.shift();
    }
  }

  private getEntityIdFromEvent(event: ChargeGenerationEvent): string {
    // Extract entity ID from event context
    return event.context.entityId || 'unknown';
  }

  private generateEfficiencyRecommendations(efficiency: number): string[] {
    const recommendations: string[] = [];

    if (efficiency < 0.5) {
      recommendations.push('Consider investing in charge generation rate modifiers');
      recommendations.push('Look for equipment with "gain charges on kill" modifiers');
    }

    if (efficiency < 1.0) {
      recommendations.push('Try to maintain higher uptime on charge-generating activities');
      recommendations.push('Consider flask charge recovery rate improvements');
    }

    if (efficiency > 2.0) {
      recommendations.push('Excellent charge generation! Consider charge consumption skills');
    }

    return recommendations;
  }

  private processChargeEntity(entity: IEntity, deltaTime: number): void {
    // Process entities that generate or consume charges
    // This could include updating charge generation based on combat state
  }

  private initializeChargeTypes(): void {
    // Flask Charges
    this.chargeTypes.set('flask', {
      id: 'flask',
      name: 'Flask Charges',
      description: 'Charges used to activate flasks',
      category: 'flask',
      maxCharges: 0, // Variable based on flask type
      duration: 0, // No natural decay
      effects: [],
      stackable: true,
      decayRate: 0,
      visualEffect: 'flask_charge_glow'
    });

    // Power Charges
    this.chargeTypes.set('power', {
      id: 'power',
      name: 'Power Charges',
      description: 'Increases critical strike chance and spell damage',
      category: 'power',
      maxCharges: 3,
      duration: 10000, // 10 seconds
      effects: [
        { type: 'critical', stat: 'chance', value: 40, valueType: 'flat', perCharge: true },
        { type: 'damage', stat: 'spell', value: 8, valueType: 'percentage', perCharge: true }
      ],
      stackable: true,
      decayRate: 0,
      visualEffect: 'power_charge_aura'
    });

    // Frenzy Charges
    this.chargeTypes.set('frenzy', {
      id: 'frenzy',
      name: 'Frenzy Charges',
      description: 'Increases attack speed, cast speed, and movement speed',
      category: 'frenzy',
      maxCharges: 3,
      duration: 10000,
      effects: [
        { type: 'speed', stat: 'attack', value: 4, valueType: 'percentage', perCharge: true },
        { type: 'speed', stat: 'cast', value: 4, valueType: 'percentage', perCharge: true },
        { type: 'speed', stat: 'movement', value: 4, valueType: 'percentage', perCharge: true }
      ],
      stackable: true,
      decayRate: 0,
      visualEffect: 'frenzy_charge_glow'
    });

    // Endurance Charges
    this.chargeTypes.set('endurance', {
      id: 'endurance',
      name: 'Endurance Charges',
      description: 'Provides physical damage reduction and elemental resistances',
      category: 'endurance',
      maxCharges: 3,
      duration: 10000,
      effects: [
        { type: 'defense', stat: 'physical_reduction', value: 4, valueType: 'percentage', perCharge: true },
        { type: 'resistance', stat: 'all_elemental', value: 4, valueType: 'percentage', perCharge: true }
      ],
      stackable: true,
      decayRate: 0,
      visualEffect: 'endurance_charge_shield'
    });

    // Spirit Charges (custom)
    this.chargeTypes.set('spirit', {
      id: 'spirit',
      name: 'Spirit Charges',
      description: 'Increases mana regeneration and spell efficiency',
      category: 'spirit',
      maxCharges: 5,
      duration: 15000,
      effects: [
        { type: 'recovery', stat: 'mana_regen', value: 10, valueType: 'percentage', perCharge: true },
        { type: 'utility', stat: 'mana_cost', value: -5, valueType: 'percentage', perCharge: true }
      ],
      stackable: true,
      decayRate: 0,
      visualEffect: 'spirit_charge_wisps'
    });

    console.log(`⚡ Initialized ${this.chargeTypes.size} charge types`);
  }

  private initializeChargeSources(): void {
    // Flask charge sources
    this.chargeSources.set('flask_on_kill', {
      id: 'flask_on_kill',
      name: 'Flask Charges on Kill',
      description: 'Gain flask charges when killing enemies',
      type: 'combat',
      triggers: [
        { event: 'kill', chance: 1.0, cooldown: 0 }
      ],
      chargeTypes: ['flask'],
      baseAmount: 1,
      cooldown: 0,
      requirements: []
    });

    this.chargeSources.set('flask_on_crit', {
      id: 'flask_on_crit',
      name: 'Flask Charges on Critical Strike',
      description: 'Gain flask charges on critical strikes',
      type: 'combat',
      triggers: [
        { event: 'critical_strike', chance: 1.0, cooldown: 0 }
      ],
      chargeTypes: ['flask'],
      baseAmount: 1,
      cooldown: 0,
      requirements: []
    });

    // Power charge sources
    this.chargeSources.set('power_on_crit', {
      id: 'power_on_crit',
      name: 'Power Charge on Critical Strike',
      description: 'Gain power charge on critical strike',
      type: 'combat',
      triggers: [
        { event: 'critical_strike', chance: 0.4, cooldown: 0 }
      ],
      chargeTypes: ['power'],
      baseAmount: 1,
      cooldown: 0,
      requirements: []
    });

    this.chargeSources.set('power_on_kill', {
      id: 'power_on_kill',
      name: 'Power Charge on Kill',
      description: 'Gain power charge when killing enemies',
      type: 'combat',
      triggers: [
        { event: 'kill', chance: 0.25, cooldown: 0 }
      ],
      chargeTypes: ['power'],
      baseAmount: 1,
      cooldown: 0,
      requirements: []
    });

    // Frenzy charge sources
    this.chargeSources.set('frenzy_on_kill', {
      id: 'frenzy_on_kill',
      name: 'Frenzy Charge on Kill',
      description: 'Gain frenzy charge when killing enemies',
      type: 'combat',
      triggers: [
        { event: 'kill', chance: 0.25, cooldown: 0 }
      ],
      chargeTypes: ['frenzy'],
      baseAmount: 1,
      cooldown: 0,
      requirements: []
    });

    this.chargeSources.set('frenzy_on_hit', {
      id: 'frenzy_on_hit',
      name: 'Frenzy Charge on Hit',
      description: 'Small chance to gain frenzy charge when hitting enemies',
      type: 'combat',
      triggers: [
        { event: 'hit', chance: 0.1, cooldown: 1000 }
      ],
      chargeTypes: ['frenzy'],
      baseAmount: 1,
      cooldown: 1000,
      requirements: []
    });

    // Endurance charge sources
    this.chargeSources.set('endurance_on_block', {
      id: 'endurance_on_block',
      name: 'Endurance Charge on Block',
      description: 'Gain endurance charge when blocking attacks',
      type: 'combat',
      triggers: [
        { event: 'block', chance: 0.4, cooldown: 0 }
      ],
      chargeTypes: ['endurance'],
      baseAmount: 1,
      cooldown: 0,
      requirements: []
    });

    this.chargeSources.set('endurance_when_hit', {
      id: 'endurance_when_hit',
      name: 'Endurance Charge when Hit',
      description: 'Gain endurance charge when taking damage',
      type: 'combat',
      triggers: [
        { event: 'take_damage', chance: 0.2, cooldown: 2000 }
      ],
      chargeTypes: ['endurance'],
      baseAmount: 1,
      cooldown: 2000,
      requirements: []
    });

    // Spirit charge sources
    this.chargeSources.set('spirit_on_skill', {
      id: 'spirit_on_skill',
      name: 'Spirit Charge on Skill Use',
      description: 'Gain spirit charge when using mana skills',
      type: 'skill',
      triggers: [
        { event: 'use_skill', condition: 'mana_cost', chance: 0.3, cooldown: 500 }
      ],
      chargeTypes: ['spirit'],
      baseAmount: 1,
      cooldown: 500,
      requirements: []
    });

    this.chargeSources.set('spirit_low_mana', {
      id: 'spirit_low_mana',
      name: 'Spirit Charge on Low Mana',
      description: 'Gain spirit charge when mana is below 25%',
      type: 'passive',
      triggers: [
        { event: 'low_life', condition: 'low_mana', value: 25, chance: 1.0, cooldown: 3000 }
      ],
      chargeTypes: ['spirit'],
      baseAmount: 1,
      cooldown: 3000,
      requirements: []
    });

    console.log(`⚡ Initialized ${this.chargeSources.size} charge sources`);
  }

  private initializeChargeConsumptions(): void {
    // Power charge consumption
    this.chargeConsumptions.set('discharge_power', {
      id: 'discharge_power',
      name: 'Power Discharge',
      description: 'Consume all power charges for massive spell damage',
      chargeType: 'power',
      consumptionType: 'all',
      amount: 0,
      effects: [
        { type: 'damage', magnitude: 150, perChargeConsumed: true }
      ],
      cooldown: 5000
    });

    // Frenzy charge consumption
    this.chargeConsumptions.set('frenzy_attack', {
      id: 'frenzy_attack',
      name: 'Frenzied Attack',
      description: 'Consume frenzy charges for increased attack speed',
      chargeType: 'frenzy',
      consumptionType: 'partial',
      amount: 1,
      effects: [
        { type: 'buff', magnitude: 50, duration: 8000, perChargeConsumed: true }
      ],
      cooldown: 1000
    });

    // Endurance charge consumption
    this.chargeConsumptions.set('immortal_call', {
      id: 'immortal_call',
      name: 'Immortal Call',
      description: 'Consume endurance charges for temporary immunity',
      chargeType: 'endurance',
      consumptionType: 'all',
      amount: 0,
      effects: [
        { type: 'utility', magnitude: 1, duration: 1000, perChargeConsumed: true }
      ],
      cooldown: 10000
    });

    // Spirit charge consumption
    this.chargeConsumptions.set('spirit_burst', {
      id: 'spirit_burst',
      name: 'Spirit Burst',
      description: 'Consume spirit charges to restore mana',
      chargeType: 'spirit',
      consumptionType: 'partial',
      amount: 2,
      effects: [
        { type: 'healing', magnitude: 100, perChargeConsumed: true }
      ],
      cooldown: 3000
    });

    console.log(`⚡ Initialized ${this.chargeConsumptions.size} charge consumption skills`);
  }

  // Public API Methods
  getAllChargeTypes(): ChargeType[] {
    return Array.from(this.chargeTypes.values());
  }

  getChargeType(chargeTypeId: string): ChargeType | null {
    return this.chargeTypes.get(chargeTypeId) || null;
  }

  getAllChargeSources(): ChargeSource[] {
    return Array.from(this.chargeSources.values());
  }

  getChargeSource(sourceId: string): ChargeSource | null {
    return this.chargeSources.get(sourceId) || null;
  }

  getAllChargeConsumptions(): ChargeConsumption[] {
    return Array.from(this.chargeConsumptions.values());
  }

  getActiveChargesForEntity(entityId: string): ChargeInstance[] {
    return this.activeCharges.get(entityId) || [];
  }

  hasCharges(entityId: string, chargeTypeId: string, minAmount: number = 1): boolean {
    const charges = this.getCurrentCharges(entityId, chargeTypeId);
    const currentAmount = charges.get(chargeTypeId) || 0;
    return currentAmount >= minAmount;
  }

  getChargeHistory(): ChargeGenerationEvent[] {
    return [...this.chargeHistory];
  }

  clearChargeHistory(): void {
    this.chargeHistory = [];
  }

  // Utility Methods
  getTotalChargeCount(entityId: string): number {
    const entityCharges = this.activeCharges.get(entityId) || [];
    return entityCharges.reduce((total, charge) => total + charge.currentCharges, 0);
  }

  getChargeUptime(entityId: string, chargeTypeId: string): number {
    const entityCharges = this.activeCharges.get(entityId) || [];
    const chargeInstance = entityCharges.find(c => c.chargeType === chargeTypeId);
    return chargeInstance ? this.calculateUptime(chargeInstance) : 0;
  }

  resetCharges(entityId: string, chargeTypeId?: string): void {
    const entityCharges = this.activeCharges.get(entityId) || [];
    
    if (chargeTypeId) {
      const index = entityCharges.findIndex(c => c.chargeType === chargeTypeId);
      if (index >= 0) {
        entityCharges.splice(index, 1);
      }
    } else {
      this.activeCharges.set(entityId, []);
    }

    this.emit('chargesReset', { entityId, chargeType: chargeTypeId });
  }
}

export default ChargeGenerationSystem;