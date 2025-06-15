// Flask System - Life/Mana recovery and charge mechanics
// Path of Exile inspired flask system with instant recovery and charges

import { EventEmitter } from 'events';

export interface FlaskData {
  id: string;
  name: string;
  description: string;
  type: 'life' | 'mana' | 'hybrid' | 'utility';
  baseType: string;
  quality: number;
  rarity: 'normal' | 'magic' | 'rare' | 'unique';
  level: number;
  
  // Recovery properties
  recoveryAmount?: number;
  recoveryType?: 'instant' | 'gradual';
  recoveryDuration?: number;
  
  // Charge mechanics
  charges: {
    current: number;
    maximum: number;
    chargesUsedPerUse: number;
    chargeGainOnKill: number;
    chargeGainOnCrit: number;
    chargeRecovery: number; // charges per second
  };
  
  // Effects and modifiers
  effects: FlaskEffect[];
  suffixes: FlaskSuffix[];
  prefixes: FlaskPrefix[];
  
  // Usage restrictions
  requirements: {
    level: number;
    attributes?: {
      strength?: number;
      dexterity?: number;
      intelligence?: number;
    };
  };
  
  // Item properties
  itemLevel: number;
  corrupted?: boolean;
  mirrored?: boolean;
  synthesised?: boolean;
  fractured?: boolean;
}

export interface FlaskEffect {
  id: string;
  name: string;
  type: 'recovery' | 'buff' | 'immunity' | 'utility';
  magnitude: number;
  duration: number;
  stackable: boolean;
  tags: string[];
}

export interface FlaskSuffix {
  id: string;
  name: string;
  tier: number;
  effects: FlaskModifier[];
  weight: number;
}

export interface FlaskPrefix {
  id: string;
  name: string;
  tier: number;
  effects: FlaskModifier[];
  weight: number;
}

export interface FlaskModifier {
  type: 'recovery_amount' | 'recovery_rate' | 'duration' | 'charges' | 'effect_magnitude' | 'immunity' | 'resistance';
  value: number;
  isPercentage: boolean;
  condition?: string;
}

export interface FlaskInstance {
  flask: FlaskData;
  currentCharges: number;
  isActive: boolean;
  activeEffects: ActiveFlaskEffect[];
  cooldownEndTime: number;
  lastUsed: number;
}

export interface ActiveFlaskEffect {
  effectId: string;
  startTime: number;
  endTime: number;
  magnitude: number;
  source: string;
  tags: string[];
}

export interface FlaskSlot {
  slotId: number;
  flask: FlaskInstance | null;
  keybind: string;
  enabled: boolean;
}

export interface FlaskSystemConfig {
  maxFlaskSlots: number;
  globalCooldown: number;
  chargeRecoveryRate: number;
  maxActiveEffects: number;
  allowFlaskMacros: boolean;
}

export class FlaskSystem extends EventEmitter {
  private config: FlaskSystemConfig;
  private flaskSlots: Map<number, FlaskSlot> = new Map();
  private activeEffects: Map<string, ActiveFlaskEffect> = new Map();
  private globalCooldownEndTime: number = 0;
  private chargeRecoveryInterval: NodeJS.Timeout | null = null;
  
  // Flask templates for generation
  private flaskBases: Map<string, Partial<FlaskData>> = new Map();
  private flaskSuffixes: Map<string, FlaskSuffix> = new Map();
  private flaskPrefixes: Map<string, FlaskPrefix> = new Map();

  constructor(config: Partial<FlaskSystemConfig> = {}) {
    super();
    
    this.config = {
      maxFlaskSlots: config.maxFlaskSlots || 5,
      globalCooldown: config.globalCooldown || 200, // 200ms global cooldown
      chargeRecoveryRate: config.chargeRecoveryRate || 1.0,
      maxActiveEffects: config.maxActiveEffects || 20,
      allowFlaskMacros: config.allowFlaskMacros || false,
      ...config
    };
    
    this.initializeFlaskSlots();
    this.initializeFlaskTemplates();
    this.startChargeRecovery();
    
    console.log('🧪 Flask System initialized');
  }
  
  private initializeFlaskSlots(): void {
    const defaultKeybinds = ['1', '2', '3', '4', '5'];
    
    for (let i = 0; i < this.config.maxFlaskSlots; i++) {
      this.flaskSlots.set(i, {
        slotId: i,
        flask: null,
        keybind: defaultKeybinds[i] || `${i + 1}`,
        enabled: true
      });
    }
  }
  
  private initializeFlaskTemplates(): void {
    // Life Flask bases
    this.flaskBases.set('small_life_flask', {
      name: 'Small Life Flask',
      type: 'life',
      baseType: 'Small Life Flask',
      recoveryAmount: 70,
      recoveryType: 'instant',
      charges: {
        current: 7,
        maximum: 7,
        chargesUsedPerUse: 7,
        chargeGainOnKill: 1,
        chargeGainOnCrit: 0,
        chargeRecovery: 0.33
      },
      requirements: { level: 1 }
    });
    
    this.flaskBases.set('medium_life_flask', {
      name: 'Medium Life Flask',
      type: 'life',
      baseType: 'Medium Life Flask',
      recoveryAmount: 150,
      recoveryType: 'instant',
      charges: {
        current: 9,
        maximum: 9,
        chargesUsedPerUse: 9,
        chargeGainOnKill: 1,
        chargeGainOnCrit: 0,
        chargeRecovery: 0.28
      },
      requirements: { level: 3 }
    });
    
    this.flaskBases.set('large_life_flask', {
      name: 'Large Life Flask',
      type: 'life',
      baseType: 'Large Life Flask',
      recoveryAmount: 250,
      recoveryType: 'instant',
      charges: {
        current: 12,
        maximum: 12,
        chargesUsedPerUse: 12,
        chargeGainOnKill: 1,
        chargeGainOnCrit: 0,
        chargeRecovery: 0.25
      },
      requirements: { level: 6 }
    });
    
    this.flaskBases.set('greater_life_flask', {
      name: 'Greater Life Flask',
      type: 'life',
      baseType: 'Greater Life Flask',
      recoveryAmount: 360,
      recoveryType: 'instant',
      charges: {
        current: 15,
        maximum: 15,
        chargesUsedPerUse: 15,
        chargeGainOnKill: 1,
        chargeGainOnCrit: 0,
        chargeRecovery: 0.23
      },
      requirements: { level: 12 }
    });
    
    this.flaskBases.set('grand_life_flask', {
      name: 'Grand Life Flask',
      type: 'life',
      baseType: 'Grand Life Flask',
      recoveryAmount: 640,
      recoveryType: 'instant',
      charges: {
        current: 20,
        maximum: 20,
        chargesUsedPerUse: 20,
        chargeGainOnKill: 1,
        chargeGainOnCrit: 0,
        chargeRecovery: 0.20
      },
      requirements: { level: 24 }
    });
    
    this.flaskBases.set('giant_life_flask', {
      name: 'Giant Life Flask',
      type: 'life',
      baseType: 'Giant Life Flask',
      recoveryAmount: 1200,
      recoveryType: 'instant',
      charges: {
        current: 25,
        maximum: 25,
        chargesUsedPerUse: 25,
        chargeGainOnKill: 1,
        chargeGainOnCrit: 0,
        chargeRecovery: 0.18
      },
      requirements: { level: 42 }
    });
    
    this.flaskBases.set('colossal_life_flask', {
      name: 'Colossal Life Flask',
      type: 'life',
      baseType: 'Colossal Life Flask',
      recoveryAmount: 2400,
      recoveryType: 'instant',
      charges: {
        current: 30,
        maximum: 30,
        chargesUsedPerUse: 30,
        chargeGainOnKill: 1,
        chargeGainOnCrit: 0,
        chargeRecovery: 0.15
      },
      requirements: { level: 60 }
    });
    
    // Mana Flask bases
    this.flaskBases.set('small_mana_flask', {
      name: 'Small Mana Flask',
      type: 'mana',
      baseType: 'Small Mana Flask',
      recoveryAmount: 50,
      recoveryType: 'instant',
      charges: {
        current: 5,
        maximum: 5,
        chargesUsedPerUse: 5,
        chargeGainOnKill: 1,
        chargeGainOnCrit: 0,
        chargeRecovery: 0.40
      },
      requirements: { level: 1 }
    });
    
    this.flaskBases.set('medium_mana_flask', {
      name: 'Medium Mana Flask',
      type: 'mana',
      baseType: 'Medium Mana Flask',
      recoveryAmount: 100,
      recoveryType: 'instant',
      charges: {
        current: 7,
        maximum: 7,
        chargesUsedPerUse: 7,
        chargeGainOnKill: 1,
        chargeGainOnCrit: 0,
        chargeRecovery: 0.36
      },
      requirements: { level: 3 }
    });
    
    this.flaskBases.set('large_mana_flask', {
      name: 'Large Mana Flask',
      type: 'mana',
      baseType: 'Large Mana Flask',
      recoveryAmount: 170,
      recoveryType: 'instant',
      charges: {
        current: 9,
        maximum: 9,
        chargesUsedPerUse: 9,
        chargeGainOnKill: 1,
        chargeGainOnCrit: 0,
        chargeRecovery: 0.33
      },
      requirements: { level: 6 }
    });
    
    this.flaskBases.set('greater_mana_flask', {
      name: 'Greater Mana Flask',
      type: 'mana',
      baseType: 'Greater Mana Flask',
      recoveryAmount: 250,
      recoveryType: 'instant',
      charges: {
        current: 12,
        maximum: 12,
        chargesUsedPerUse: 12,
        chargeGainOnKill: 1,
        chargeGainOnCrit: 0,
        chargeRecovery: 0.30
      },
      requirements: { level: 12 }
    });
    
    this.flaskBases.set('grand_mana_flask', {
      name: 'Grand Mana Flask',
      type: 'mana',
      baseType: 'Grand Mana Flask',
      recoveryAmount: 350,
      recoveryType: 'instant',
      charges: {
        current: 15,
        maximum: 15,
        chargesUsedPerUse: 15,
        chargeGainOnKill: 1,
        chargeGainOnCrit: 0,
        chargeRecovery: 0.27
      },
      requirements: { level: 24 }
    });
    
    this.flaskBases.set('giant_mana_flask', {
      name: 'Giant Mana Flask',
      type: 'mana',
      baseType: 'Giant Mana Flask',
      recoveryAmount: 480,
      recoveryType: 'instant',
      charges: {
        current: 18,
        maximum: 18,
        chargesUsedPerUse: 18,
        chargeGainOnKill: 1,
        chargeGainOnCrit: 0,
        chargeRecovery: 0.25
      },
      requirements: { level: 42 }
    });
    
    this.flaskBases.set('colossal_mana_flask', {
      name: 'Colossal Mana Flask',
      type: 'mana',
      baseType: 'Colossal Mana Flask',
      recoveryAmount: 700,
      recoveryType: 'instant',
      charges: {
        current: 21,
        maximum: 21,
        chargesUsedPerUse: 21,
        chargeGainOnKill: 1,
        chargeGainOnCrit: 0,
        chargeRecovery: 0.22
      },
      requirements: { level: 60 }
    });
    
    // Hybrid Flask bases
    this.flaskBases.set('small_hybrid_flask', {
      name: 'Small Hybrid Flask',
      type: 'hybrid',
      baseType: 'Small Hybrid Flask',
      recoveryAmount: 100, // Combined life+mana
      recoveryType: 'instant',
      charges: {
        current: 10,
        maximum: 10,
        chargesUsedPerUse: 10,
        chargeGainOnKill: 1,
        chargeGainOnCrit: 0,
        chargeRecovery: 0.30
      },
      requirements: { level: 15 }
    });
    
    this.flaskBases.set('medium_hybrid_flask', {
      name: 'Medium Hybrid Flask',
      type: 'hybrid',
      baseType: 'Medium Hybrid Flask',
      recoveryAmount: 200,
      recoveryType: 'instant',
      charges: {
        current: 15,
        maximum: 15,
        chargesUsedPerUse: 15,
        chargeGainOnKill: 1,
        chargeGainOnCrit: 0,
        chargeRecovery: 0.25
      },
      requirements: { level: 30 }
    });
    
    this.flaskBases.set('large_hybrid_flask', {
      name: 'Large Hybrid Flask',
      type: 'hybrid',
      baseType: 'Large Hybrid Flask',
      recoveryAmount: 350,
      recoveryType: 'instant',
      charges: {
        current: 20,
        maximum: 20,
        chargesUsedPerUse: 20,
        chargeGainOnKill: 1,
        chargeGainOnCrit: 0,
        chargeRecovery: 0.20
      },
      requirements: { level: 50 }
    });

    this.initializeFlaskModifiers();
    
    console.log(`🧪 Initialized ${this.flaskBases.size} flask base types`);
  }
  
  private initializeFlaskModifiers(): void {
    // Flask Suffixes (recovery bonuses)
    this.flaskSuffixes.set('of_seething', {
      id: 'of_seething',
      name: 'of Seething',
      tier: 1,
      weight: 1000,
      effects: [
        { type: 'recovery_amount', value: 50, isPercentage: true },
        { type: 'recovery_rate', value: -66, isPercentage: true }
      ]
    });
    
    this.flaskSuffixes.set('of_bubbling', {
      id: 'of_bubbling',
      name: 'of Bubbling',
      tier: 2,
      weight: 1000,
      effects: [
        { type: 'recovery_amount', value: 25, isPercentage: true },
        { type: 'recovery_rate', value: -33, isPercentage: true }
      ]
    });
    
    this.flaskSuffixes.set('of_saturated', {
      id: 'of_saturated',
      name: 'of Saturated',
      tier: 3,
      weight: 1000,
      effects: [
        { type: 'recovery_amount', value: 25, isPercentage: true }
      ]
    });
    
    this.flaskSuffixes.set('of_dampening', {
      id: 'of_dampening',
      name: 'of Dampening',
      tier: 4,
      weight: 800,
      effects: [
        { type: 'charges', value: 20, isPercentage: true }
      ]
    });
    
    this.flaskSuffixes.set('of_curing', {
      id: 'of_curing',
      name: 'of Curing',
      tier: 5,
      weight: 600,
      effects: [
        { type: 'immunity', value: 1, isPercentage: false, condition: 'poison' }
      ]
    });
    
    this.flaskSuffixes.set('of_heat', {
      id: 'of_heat',
      name: 'of Heat',
      tier: 5,
      weight: 600,
      effects: [
        { type: 'immunity', value: 1, isPercentage: false, condition: 'freeze' },
        { type: 'immunity', value: 1, isPercentage: false, condition: 'chill' }
      ]
    });
    
    this.flaskSuffixes.set('of_grounding', {
      id: 'of_grounding',
      name: 'of Grounding',
      tier: 5,
      weight: 600,
      effects: [
        { type: 'immunity', value: 1, isPercentage: false, condition: 'shock' }
      ]
    });
    
    this.flaskSuffixes.set('of_dousing', {
      id: 'of_dousing',
      name: 'of Dousing',
      tier: 5,
      weight: 600,
      effects: [
        { type: 'immunity', value: 1, isPercentage: false, condition: 'ignite' }
      ]
    });
    
    this.flaskSuffixes.set('of_warding', {
      id: 'of_warding',
      name: 'of Warding',
      tier: 6,
      weight: 400,
      effects: [
        { type: 'immunity', value: 1, isPercentage: false, condition: 'curse' }
      ]
    });
    
    this.flaskSuffixes.set('of_staunching', {
      id: 'of_staunching',
      name: 'of Staunching',
      tier: 5,
      weight: 600,
      effects: [
        { type: 'immunity', value: 1, isPercentage: false, condition: 'bleeding' }
      ]
    });

    // Flask Prefixes (charge and duration bonuses)
    this.flaskPrefixes.set('perpetual', {
      id: 'perpetual',
      name: 'Perpetual',
      tier: 1,
      weight: 1000,
      effects: [
        { type: 'charges', value: 15, isPercentage: true }
      ]
    });
    
    this.flaskPrefixes.set('ample', {
      id: 'ample',
      name: 'Ample',
      tier: 2,
      weight: 1000,
      effects: [
        { type: 'charges', value: 10, isPercentage: true }
      ]
    });
    
    this.flaskPrefixes.set('chemists', {
      id: 'chemists',
      name: 'Chemist\'s',
      tier: 3,
      weight: 800,
      effects: [
        { type: 'charges', value: 25, isPercentage: true },
        { type: 'recovery_amount', value: -10, isPercentage: true }
      ]
    });
    
    this.flaskPrefixes.set('surgeons', {
      id: 'surgeons',
      name: 'Surgeon\'s',
      tier: 4,
      weight: 600,
      effects: [
        { type: 'charges', value: 1, isPercentage: false, condition: 'on_critical_strike' }
      ]
    });
    
    this.flaskPrefixes.set('avengers', {
      id: 'avengers',
      name: 'Avenger\'s',
      tier: 5,
      weight: 400,
      effects: [
        { type: 'charges', value: 1, isPercentage: false, condition: 'on_critical_strike' },
        { type: 'charges', value: -5, isPercentage: true }
      ]
    });
    
    console.log(`🧪 Initialized ${this.flaskSuffixes.size} suffixes and ${this.flaskPrefixes.size} prefixes`);
  }
  
  // === FLASK USAGE ===
  
  useFlask(slotId: number): boolean {
    const slot = this.flaskSlots.get(slotId);
    if (!slot || !slot.flask || !slot.enabled) {
      return false;
    }
    
    const flask = slot.flask;
    const now = Date.now();
    
    // Check global cooldown
    if (now < this.globalCooldownEndTime) {
      this.emit('flask-on-cooldown', { slotId, flask });
      return false;
    }
    
    // Check flask cooldown
    if (now < flask.cooldownEndTime) {
      this.emit('flask-on-cooldown', { slotId, flask });
      return false;
    }
    
    // Check charges
    if (flask.currentCharges < flask.flask.charges.chargesUsedPerUse) {
      this.emit('flask-insufficient-charges', { slotId, flask });
      return false;
    }
    
    // Use flask
    this.activateFlask(slotId);
    return true;
  }
  
  private activateFlask(slotId: number): void {
    const slot = this.flaskSlots.get(slotId)!;
    const flask = slot.flask!;
    const now = Date.now();
    
    // Consume charges
    flask.currentCharges -= flask.flask.charges.chargesUsedPerUse;
    
    // Apply recovery effects
    this.applyFlaskRecovery(flask);
    
    // Apply buff effects
    this.applyFlaskEffects(flask);
    
    // Set cooldowns
    flask.cooldownEndTime = now + 250; // Individual flask cooldown
    this.globalCooldownEndTime = now + this.config.globalCooldown;
    flask.lastUsed = now;
    flask.isActive = true;
    
    this.emit('flask-used', {
      slotId,
      flask,
      chargesRemaining: flask.currentCharges,
      timestamp: now
    });
    
    console.log(`🧪 Used ${flask.flask.name} - ${flask.currentCharges}/${flask.flask.charges.maximum} charges remaining`);
  }
  
  private applyFlaskRecovery(flask: FlaskInstance): void {
    const recoveryAmount = this.calculateRecoveryAmount(flask);
    
    if (flask.flask.type === 'life') {
      this.emit('life-recovery', { amount: recoveryAmount, source: 'flask', instant: true });
    } else if (flask.flask.type === 'mana') {
      this.emit('mana-recovery', { amount: recoveryAmount, source: 'flask', instant: true });
    } else if (flask.flask.type === 'hybrid') {
      const lifeAmount = Math.floor(recoveryAmount * 0.6);
      const manaAmount = Math.floor(recoveryAmount * 0.4);
      this.emit('life-recovery', { amount: lifeAmount, source: 'flask', instant: true });
      this.emit('mana-recovery', { amount: manaAmount, source: 'flask', instant: true });
    }
  }
  
  private calculateRecoveryAmount(flask: FlaskInstance): number {
    let amount = flask.flask.recoveryAmount || 0;
    
    // Apply modifiers from suffixes and prefixes
    for (const suffix of flask.flask.suffixes) {
      for (const effect of suffix.effects) {
        if (effect.type === 'recovery_amount') {
          if (effect.isPercentage) {
            amount *= (1 + effect.value / 100);
          } else {
            amount += effect.value;
          }
        }
      }
    }
    
    for (const prefix of flask.flask.prefixes) {
      for (const effect of prefix.effects) {
        if (effect.type === 'recovery_amount') {
          if (effect.isPercentage) {
            amount *= (1 + effect.value / 100);
          } else {
            amount += effect.value;
          }
        }
      }
    }
    
    // Apply quality bonus (20% quality = 20% more recovery)
    amount *= (1 + flask.flask.quality / 100);
    
    return Math.floor(amount);
  }
  
  private applyFlaskEffects(flask: FlaskInstance): void {
    const now = Date.now();
    
    // Apply immunity effects
    for (const suffix of flask.flask.suffixes) {
      for (const effect of suffix.effects) {
        if (effect.type === 'immunity' && effect.condition) {
          this.emit('immunity-granted', {
            type: effect.condition,
            duration: 4000, // 4 seconds default immunity
            source: 'flask'
          });
        }
      }
    }
    
    // Handle utility flask effects (will be implemented in utility flasks)
    if (flask.flask.type === 'utility') {
      for (const effect of flask.flask.effects) {
        this.applyUtilityEffect(effect, flask);
      }
    }
  }
  
  private applyUtilityEffect(effect: FlaskEffect, flask: FlaskInstance): void {
    const now = Date.now();
    
    const activeEffect: ActiveFlaskEffect = {
      effectId: effect.id,
      startTime: now,
      endTime: now + effect.duration,
      magnitude: effect.magnitude,
      source: flask.flask.id,
      tags: effect.tags
    };
    
    // Remove existing effect if not stackable
    if (!effect.stackable) {
      for (const [id, existing] of this.activeEffects) {
        if (existing.effectId === effect.id) {
          this.activeEffects.delete(id);
          this.emit('flask-effect-removed', existing);
        }
      }
    }
    
    const effectId = `${effect.id}_${now}_${Math.random().toString(36).substr(2, 5)}`;
    this.activeEffects.set(effectId, activeEffect);
    flask.activeEffects.push(activeEffect);
    
    this.emit('flask-effect-applied', activeEffect);
    
    // Schedule effect removal
    setTimeout(() => {
      this.removeActiveEffect(effectId);
    }, effect.duration);
  }
  
  private removeActiveEffect(effectId: string): void {
    const effect = this.activeEffects.get(effectId);
    if (effect) {
      this.activeEffects.delete(effectId);
      this.emit('flask-effect-removed', effect);
      
      // Remove from flask instance
      for (const slot of this.flaskSlots.values()) {
        if (slot.flask) {
          slot.flask.activeEffects = slot.flask.activeEffects.filter(e => e !== effect);
        }
      }
    }
  }
  
  // === CHARGE MANAGEMENT ===
  
  private startChargeRecovery(): void {
    this.chargeRecoveryInterval = setInterval(() => {
      this.recoverCharges();
    }, 1000); // Recover charges every second
  }
  
  private recoverCharges(): void {
    const now = Date.now();
    
    for (const slot of this.flaskSlots.values()) {
      if (slot.flask) {
        const flask = slot.flask;
        const maxCharges = flask.flask.charges.maximum;
        
        if (flask.currentCharges < maxCharges) {
          const baseRecovery = flask.flask.charges.chargeRecovery * this.config.chargeRecoveryRate;
          const recovery = this.calculateChargeRecovery(flask, baseRecovery);
          
          flask.currentCharges = Math.min(maxCharges, flask.currentCharges + recovery);
          
          if (flask.currentCharges === maxCharges) {
            this.emit('flask-charges-full', { slotId: slot.slotId, flask });
          }
        }
        
        // Deactivate flask if no active effects
        if (flask.isActive && flask.activeEffects.length === 0) {
          flask.isActive = false;
        }
      }
    }
    
    // Clean up expired effects
    this.cleanupExpiredEffects();
  }
  
  private calculateChargeRecovery(flask: FlaskInstance, baseRecovery: number): number {
    let recovery = baseRecovery;
    
    // Apply modifiers from prefixes and suffixes
    for (const prefix of flask.flask.prefixes) {
      for (const effect of prefix.effects) {
        if (effect.type === 'charges') {
          if (effect.isPercentage) {
            recovery *= (1 + effect.value / 100);
          }
        }
      }
    }
    
    return recovery;
  }
  
  private cleanupExpiredEffects(): void {
    const now = Date.now();
    const expiredEffects: string[] = [];
    
    for (const [id, effect] of this.activeEffects) {
      if (now >= effect.endTime) {
        expiredEffects.push(id);
      }
    }
    
    for (const id of expiredEffects) {
      this.removeActiveEffect(id);
    }
  }
  
  // === CHARGE GAIN EVENTS ===
  
  onEnemyKilled(enemyLevel: number): void {
    for (const slot of this.flaskSlots.values()) {
      if (slot.flask) {
        const flask = slot.flask;
        const gainAmount = flask.flask.charges.chargeGainOnKill;
        
        if (gainAmount > 0) {
          flask.currentCharges = Math.min(
            flask.flask.charges.maximum,
            flask.currentCharges + gainAmount
          );
          
          this.emit('flask-charges-gained', {
            slotId: slot.slotId,
            flask,
            gainAmount,
            source: 'kill'
          });
        }
      }
    }
  }
  
  onCriticalStrike(): void {
    for (const slot of this.flaskSlots.values()) {
      if (slot.flask) {
        const flask = slot.flask;
        let gainAmount = flask.flask.charges.chargeGainOnCrit;
        
        // Check for Surgeon's prefix
        for (const prefix of flask.flask.prefixes) {
          for (const effect of prefix.effects) {
            if (effect.type === 'charges' && effect.condition === 'on_critical_strike') {
              gainAmount += effect.value;
            }
          }
        }
        
        if (gainAmount > 0) {
          flask.currentCharges = Math.min(
            flask.flask.charges.maximum,
            flask.currentCharges + gainAmount
          );
          
          this.emit('flask-charges-gained', {
            slotId: slot.slotId,
            flask,
            gainAmount,
            source: 'critical_strike'
          });
        }
      }
    }
  }
  
  // === FLASK MANAGEMENT ===
  
  equipFlask(slotId: number, flask: FlaskData): boolean {
    if (slotId < 0 || slotId >= this.config.maxFlaskSlots) {
      return false;
    }
    
    const slot = this.flaskSlots.get(slotId)!;
    
    // Create flask instance
    const flaskInstance: FlaskInstance = {
      flask,
      currentCharges: flask.charges.current,
      isActive: false,
      activeEffects: [],
      cooldownEndTime: 0,
      lastUsed: 0
    };
    
    slot.flask = flaskInstance;
    
    this.emit('flask-equipped', { slotId, flask });
    console.log(`🧪 Equipped ${flask.name} in slot ${slotId + 1}`);
    
    return true;
  }
  
  unequipFlask(slotId: number): FlaskData | null {
    const slot = this.flaskSlots.get(slotId);
    if (!slot || !slot.flask) {
      return null;
    }
    
    const flask = slot.flask.flask;
    
    // Remove any active effects from this flask
    for (const effect of slot.flask.activeEffects) {
      this.removeActiveEffect(`${effect.effectId}_${effect.startTime}`);
    }
    
    slot.flask = null;
    
    this.emit('flask-unequipped', { slotId, flask });
    console.log(`🧪 Unequipped ${flask.name} from slot ${slotId + 1}`);
    
    return flask;
  }
  
  generateFlask(baseType: string, itemLevel: number, rarity: 'normal' | 'magic' | 'rare' = 'normal'): FlaskData | null {
    const base = this.flaskBases.get(baseType);
    if (!base) {
      return null;
    }
    
    const flask: FlaskData = {
      id: this.generateFlaskId(),
      name: base.name!,
      description: '',
      type: base.type!,
      baseType: base.baseType!,
      quality: 0,
      rarity,
      level: 1,
      recoveryAmount: base.recoveryAmount,
      recoveryType: base.recoveryType,
      recoveryDuration: base.recoveryDuration,
      charges: { ...base.charges! },
      effects: base.effects || [],
      suffixes: [],
      prefixes: [],
      requirements: { ...base.requirements! },
      itemLevel
    };
    
    // Apply rarity-based modifications
    if (rarity === 'magic') {
      this.applyMagicModifiers(flask);
    } else if (rarity === 'rare') {
      this.applyRareModifiers(flask);
    }
    
    this.updateFlaskDescription(flask);
    
    return flask;
  }
  
  private applyMagicModifiers(flask: FlaskData): void {
    // Magic flasks can have 1 prefix and 1 suffix
    const availableSuffixes = Array.from(this.flaskSuffixes.values());
    const availablePrefixes = Array.from(this.flaskPrefixes.values());
    
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
  
  private applyRareModifiers(flask: FlaskData): void {
    // Rare flasks can have up to 3 prefixes and 3 suffixes
    const availableSuffixes = Array.from(this.flaskSuffixes.values());
    const availablePrefixes = Array.from(this.flaskPrefixes.values());
    
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
    flask.name = this.generateRareFlaskName();
  }
  
  private generateRareFlaskName(): string {
    const prefixes = ['Demon\'s', 'Viper\'s', 'Storm', 'Blood', 'Shadow', 'Iron', 'Golden', 'Crystal'];
    const suffixes = ['Bite', 'Call', 'Roar', 'Song', 'Whisper', 'Scream', 'Touch', 'Grasp'];
    
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    
    return `${prefix} ${suffix}`;
  }
  
  private updateFlaskDescription(flask: FlaskData): void {
    const descriptions: string[] = [];
    
    // Recovery description
    if (flask.recoveryAmount) {
      if (flask.type === 'life') {
        descriptions.push(`Recovers ${flask.recoveryAmount} Life instantly`);
      } else if (flask.type === 'mana') {
        descriptions.push(`Recovers ${flask.recoveryAmount} Mana instantly`);
      } else if (flask.type === 'hybrid') {
        const life = Math.floor(flask.recoveryAmount * 0.6);
        const mana = Math.floor(flask.recoveryAmount * 0.4);
        descriptions.push(`Recovers ${life} Life and ${mana} Mana instantly`);
      }
    }
    
    // Charges description
    descriptions.push(`Currently has ${flask.charges.current} of ${flask.charges.maximum} Charges`);
    descriptions.push(`Consumes ${flask.charges.chargesUsedPerUse} of ${flask.charges.maximum} Charges on use`);
    
    // Modifier descriptions
    for (const prefix of flask.prefixes) {
      for (const effect of prefix.effects) {
        descriptions.push(this.getModifierDescription(effect));
      }
    }
    
    for (const suffix of flask.suffixes) {
      for (const effect of suffix.effects) {
        descriptions.push(this.getModifierDescription(effect));
      }
    }
    
    flask.description = descriptions.join('\n');
  }
  
  private getModifierDescription(modifier: FlaskModifier): string {
    switch (modifier.type) {
      case 'recovery_amount':
        return `${modifier.value > 0 ? '+' : ''}${modifier.value}${modifier.isPercentage ? '%' : ''} to Recovery Amount`;
      case 'recovery_rate':
        return `${modifier.value > 0 ? '+' : ''}${modifier.value}${modifier.isPercentage ? '%' : ''} to Recovery Rate`;
      case 'charges':
        if (modifier.condition === 'on_critical_strike') {
          return `Gains ${modifier.value} Charge when you deal a Critical Strike`;
        }
        return `${modifier.value > 0 ? '+' : ''}${modifier.value}${modifier.isPercentage ? '%' : ''} to Maximum Charges`;
      case 'immunity':
        return `Immunity to ${modifier.condition} during flask effect`;
      default:
        return `${modifier.type}: ${modifier.value}${modifier.isPercentage ? '%' : ''}`;
    }
  }
  
  private generateFlaskId(): string {
    return `flask_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }
  
  // === PUBLIC API ===
  
  getFlaskSlots(): FlaskSlot[] {
    return Array.from(this.flaskSlots.values());
  }
  
  getFlaskSlot(slotId: number): FlaskSlot | undefined {
    return this.flaskSlots.get(slotId);
  }
  
  getActiveEffects(): ActiveFlaskEffect[] {
    return Array.from(this.activeEffects.values());
  }
  
  getFlaskBases(): string[] {
    return Array.from(this.flaskBases.keys());
  }
  
  setKeybind(slotId: number, keybind: string): boolean {
    const slot = this.flaskSlots.get(slotId);
    if (slot) {
      slot.keybind = keybind;
      this.emit('keybind-changed', { slotId, keybind });
      return true;
    }
    return false;
  }
  
  toggleSlotEnabled(slotId: number): boolean {
    const slot = this.flaskSlots.get(slotId);
    if (slot) {
      slot.enabled = !slot.enabled;
      this.emit('slot-toggled', { slotId, enabled: slot.enabled });
      return slot.enabled;
    }
    return false;
  }
  
  // === CLEANUP ===
  
  destroy(): void {
    if (this.chargeRecoveryInterval) {
      clearInterval(this.chargeRecoveryInterval);
    }
    
    this.activeEffects.clear();
    this.flaskSlots.clear();
    this.removeAllListeners();
    
    console.log('🧪 Flask System destroyed');
  }
}