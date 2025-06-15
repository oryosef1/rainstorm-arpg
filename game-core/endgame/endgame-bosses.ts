import { EventEmitter } from 'events';
import { ISystem, IEntity } from '../ecs/ecs-core';
import { SystemMetrics } from '../../types/ecs-types';

export interface EndgameBoss {
  id: string;
  name: string;
  tier: number;
  level: number;
  description: string;
  lore: string;
  type: 'guardian' | 'elder' | 'shaper' | 'conqueror' | 'maven' | 'sirus' | 'pinnacle';
  difficulty: 'normal' | 'awakened' | 'uber';
  requirements: BossRequirement[];
  mechanics: BossMechanic[];
  phases: BossPhase[];
  rewards: BossReward[];
  unlocked: boolean;
  defeated: boolean;
  attempts: number;
  bestTime?: number;
  stats: BossStats;
}

export interface BossRequirement {
  type: 'atlas_completion' | 'item' | 'quest' | 'watchstone' | 'maven_witness' | 'shaper_fragment';
  description: string;
  target?: string;
  amount?: number;
  completed: boolean;
}

export interface BossMechanic {
  id: string;
  name: string;
  description: string;
  type: 'damage' | 'movement' | 'summon' | 'environmental' | 'debuff' | 'transformation';
  triggerCondition: string;
  cooldown: number;
  damage?: number;
  duration?: number;
  effects: MechanicEffect[];
}

export interface MechanicEffect {
  type: 'damage_over_time' | 'stun' | 'slow' | 'teleport' | 'invulnerable' | 'enrage' | 'curse';
  value: number;
  duration: number;
  element?: 'fire' | 'cold' | 'lightning' | 'chaos' | 'physical';
}

export interface BossPhase {
  id: string;
  name: string;
  healthThreshold: number;
  mechanics: string[];
  specialEffects: string[];
  duration?: number;
  transitionEffect?: string;
}

export interface BossReward {
  type: 'unique_item' | 'atlas_points' | 'watchstone' | 'maven_orb' | 'awakened_gem' | 'fragment' | 'currency';
  name: string;
  description: string;
  rarity: 'guaranteed' | 'common' | 'uncommon' | 'rare' | 'very_rare';
  dropChance: number;
  baseType?: string;
  tier?: number;
  quantity?: number;
}

export interface BossStats {
  health: number;
  maxHealth: number;
  damage: number;
  resistance: {
    fire: number;
    cold: number;
    lightning: number;
    chaos: number;
    physical: number;
  };
  immunities: string[];
  speed: number;
  criticalChance: number;
  criticalMultiplier: number;
}

export interface BossEncounter {
  bossId: string;
  started: boolean;
  completed: boolean;
  startTime?: number;
  endTime?: number;
  currentPhase: number;
  activeMechanics: Set<string>;
  playerDamageDealt: number;
  damageTaken: number;
  deaths: number;
}

export interface PinnacleBossConfig {
  id: string;
  name: string;
  unlockConditions: string[];
  fragments: PinnacleFragment[];
  setBonus: SetBonusEffect[];
}

export interface PinnacleFragment {
  id: string;
  name: string;
  description: string;
  source: string;
  dropChance: number;
}

export interface SetBonusEffect {
  name: string;
  description: string;
  effect: string;
  value: number;
}

export class EndgameBossSystem extends EventEmitter implements ISystem {
  readonly name: string = 'EndgameBossSystem';
  readonly requiredComponents: readonly string[] = ['Boss', 'Player'];
  readonly entities: Set<IEntity> = new Set();
  readonly priority: number = 20;
  enabled: boolean = true;

  private bosses: Map<string, EndgameBoss> = new Map();
  private encounters: Map<string, BossEncounter> = new Map();
  private pinnacleConfigs: Map<string, PinnacleBossConfig> = new Map();
  private activeEncounter: BossEncounter | null = null;

  constructor() {
    super();
    this.initializeEndgameBosses();
    this.initializePinnacleConfigs();
  }

  addEntity(entity: IEntity): void {
    if (this.canProcess(entity)) {
      this.entities.add(entity);
      this.emit('entityAdded', { system: this.name, entity });
    }
  }

  removeEntity(entity: IEntity): void {
    if (this.entities.has(entity)) {
      this.entities.delete(entity);
      this.emit('entityRemoved', { system: this.name, entity });
    }
  }

  update(deltaTime: number): void {
    if (!this.enabled) return;

    // Update active boss encounter
    if (this.activeEncounter) {
      this.updateBossEncounter(this.activeEncounter, deltaTime);
    }

    // Process boss-related entities
    for (const entity of this.entities) {
      this.processBossEntity(entity, deltaTime);
    }
  }

  canProcess(entity: IEntity): boolean {
    return entity.hasComponents(this.requiredComponents);
  }

  cleanup(): void {
    this.entities.clear();
    this.activeEncounter = null;
    this.encounters.clear();
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

  // Boss Management
  startBossEncounter(bossId: string): boolean {
    const boss = this.bosses.get(bossId);
    if (!boss || !boss.unlocked) {
      return false;
    }

    // Check requirements
    if (!this.checkBossRequirements(boss)) {
      return false;
    }

    // Create new encounter
    const encounter: BossEncounter = {
      bossId,
      started: true,
      completed: false,
      startTime: Date.now(),
      currentPhase: 0,
      activeMechanics: new Set(),
      playerDamageDealt: 0,
      damageTaken: 0,
      deaths: 0
    };

    this.encounters.set(`${bossId}_${Date.now()}`, encounter);
    this.activeEncounter = encounter;
    boss.attempts++;

    this.emit('bossEncounterStarted', { bossId, encounter });
    return true;
  }

  endBossEncounter(successful: boolean): void {
    if (!this.activeEncounter) return;

    const encounter = this.activeEncounter;
    const boss = this.bosses.get(encounter.bossId);
    
    encounter.completed = true;
    encounter.endTime = Date.now();
    
    if (successful && boss) {
      boss.defeated = true;
      const fightDuration = encounter.endTime - (encounter.startTime || 0);
      
      if (!boss.bestTime || fightDuration < boss.bestTime) {
        boss.bestTime = fightDuration;
      }

      // Grant rewards
      this.grantBossRewards(boss, encounter);
      this.emit('bossDefeated', { boss, encounter, duration: fightDuration });
    }

    this.activeEncounter = null;
    this.emit('bossEncounterEnded', { encounter, successful });
  }

  unlockBoss(bossId: string): boolean {
    const boss = this.bosses.get(bossId);
    if (!boss || boss.unlocked) {
      return false;
    }

    if (!this.checkBossRequirements(boss)) {
      return false;
    }

    boss.unlocked = true;
    this.emit('bossUnlocked', { bossId, boss });
    return true;
  }

  // Boss Mechanics
  triggerBossMechanic(mechanicId: string): void {
    if (!this.activeEncounter) return;

    const boss = this.bosses.get(this.activeEncounter.bossId);
    if (!boss) return;

    const mechanic = boss.mechanics.find(m => m.id === mechanicId);
    if (!mechanic) return;

    // Check if mechanic can be triggered
    if (this.activeEncounter.activeMechanics.has(mechanicId)) {
      return; // Already active
    }

    this.activeEncounter.activeMechanics.add(mechanicId);
    
    // Apply mechanic effects
    this.applyMechanicEffects(mechanic);
    
    // Schedule mechanic end
    setTimeout(() => {
      this.activeEncounter?.activeMechanics.delete(mechanicId);
      this.emit('mechanicEnded', { mechanicId, mechanic });
    }, mechanic.duration || 5000);

    this.emit('mechanicTriggered', { mechanicId, mechanic, encounter: this.activeEncounter });
  }

  transitionBossPhase(phaseIndex: number): void {
    if (!this.activeEncounter) return;

    const boss = this.bosses.get(this.activeEncounter.bossId);
    if (!boss || phaseIndex >= boss.phases.length) return;

    this.activeEncounter.currentPhase = phaseIndex;
    const phase = boss.phases[phaseIndex];

    // Clear existing mechanics
    this.activeEncounter.activeMechanics.clear();

    // Apply phase transition effects
    if (phase.transitionEffect) {
      this.emit('phaseTransition', { 
        phase, 
        transitionEffect: phase.transitionEffect, 
        encounter: this.activeEncounter 
      });
    }

    this.emit('bossPhaseChanged', { phaseIndex, phase, encounter: this.activeEncounter });
  }

  // Pinnacle Boss System
  checkPinnacleAccess(configId: string): boolean {
    const config = this.pinnacleConfigs.get(configId);
    if (!config) return false;

    return config.unlockConditions.every(condition => {
      return this.evaluateUnlockCondition(condition);
    });
  }

  grantPinnacleFragment(fragmentId: string): void {
    const fragment = this.findFragmentById(fragmentId);
    if (fragment) {
      this.emit('pinnacleFragmentGranted', { fragment });
    }
  }

  // Helper Methods
  private checkBossRequirements(boss: EndgameBoss): boolean {
    return boss.requirements.every(req => {
      switch (req.type) {
        case 'atlas_completion':
          // Check atlas completion percentage
          return true; // Placeholder
        case 'item':
          // Check if player has required item
          return true; // Placeholder
        case 'quest':
          // Check quest completion
          return true; // Placeholder
        case 'watchstone':
          // Check watchstone count
          return true; // Placeholder
        case 'maven_witness':
          // Check maven witnessing requirements
          return true; // Placeholder
        case 'shaper_fragment':
          // Check shaper fragments
          return true; // Placeholder
        default:
          return false;
      }
    });
  }

  private updateBossEncounter(encounter: BossEncounter, deltaTime: number): void {
    const boss = this.bosses.get(encounter.bossId);
    if (!boss) return;

    // Update boss health and check for phase transitions
    const currentPhase = boss.phases[encounter.currentPhase];
    if (currentPhase) {
      const healthPercent = boss.stats.health / boss.stats.maxHealth;
      
      // Check for phase transition
      if (healthPercent <= currentPhase.healthThreshold && 
          encounter.currentPhase < boss.phases.length - 1) {
        this.transitionBossPhase(encounter.currentPhase + 1);
      }
    }

    // Trigger mechanics based on conditions
    this.evaluateMechanicTriggers(boss, encounter);
  }

  private evaluateMechanicTriggers(boss: EndgameBoss, encounter: BossEncounter): void {
    const currentPhase = boss.phases[encounter.currentPhase];
    if (!currentPhase) return;

    currentPhase.mechanics.forEach(mechanicId => {
      const mechanic = boss.mechanics.find(m => m.id === mechanicId);
      if (mechanic && this.shouldTriggerMechanic(mechanic, encounter)) {
        this.triggerBossMechanic(mechanicId);
      }
    });
  }

  private shouldTriggerMechanic(mechanic: BossMechanic, encounter: BossEncounter): boolean {
    // Evaluate trigger conditions
    switch (mechanic.triggerCondition) {
      case 'health_threshold':
        return true; // Implement health threshold logic
      case 'time_elapsed':
        return true; // Implement time-based triggers
      case 'player_distance':
        return true; // Implement distance-based triggers
      case 'damage_taken':
        return true; // Implement damage-based triggers
      default:
        return false;
    }
  }

  private applyMechanicEffects(mechanic: BossMechanic): void {
    mechanic.effects.forEach(effect => {
      this.emit('mechanicEffectApplied', { effect, mechanic });
    });
  }

  private grantBossRewards(boss: EndgameBoss, encounter: BossEncounter): void {
    boss.rewards.forEach(reward => {
      const shouldGrant = Math.random() < reward.dropChance;
      if (shouldGrant || reward.rarity === 'guaranteed') {
        this.emit('bossRewardGranted', { reward, boss, encounter });
      }
    });
  }

  private processBossEntity(entity: IEntity, deltaTime: number): void {
    // Process entities that interact with boss system
    // This could include updating boss health, applying damage, etc.
  }

  private evaluateUnlockCondition(condition: string): boolean {
    // Evaluate specific unlock conditions for pinnacle bosses
    // This would check various game state conditions
    return true; // Placeholder
  }

  private findFragmentById(fragmentId: string): PinnacleFragment | null {
    for (const config of this.pinnacleConfigs.values()) {
      const fragment = config.fragments.find(f => f.id === fragmentId);
      if (fragment) return fragment;
    }
    return null;
  }

  private initializeEndgameBosses(): void {
    const endgameBosses: EndgameBoss[] = [
      {
        id: 'the_shaper',
        name: 'The Shaper',
        tier: 16,
        level: 84,
        description: 'The architect of worlds and reality itself',
        lore: 'Once mortal, The Shaper has transcended to become a god-like entity capable of reshaping reality. His mastery over the Atlas threatens all existence.',
        type: 'shaper',
        difficulty: 'normal',
        requirements: [
          {
            type: 'shaper_fragment',
            description: 'Collect all 4 Shaper fragments',
            amount: 4,
            completed: false
          }
        ],
        mechanics: [
          {
            id: 'bullet_hell',
            name: 'Shaper Bullet Hell',
            description: 'Fires a barrage of projectiles across the arena',
            type: 'damage',
            triggerCondition: 'health_threshold',
            cooldown: 15000,
            damage: 5000,
            duration: 8000,
            effects: [
              { type: 'damage_over_time', value: 500, duration: 3000, element: 'cold' }
            ]
          },
          {
            id: 'teleport_slam',
            name: 'Reality Slam',
            description: 'Teleports to player location and slams',
            type: 'movement',
            triggerCondition: 'player_distance',
            cooldown: 20000,
            damage: 8000,
            effects: [
              { type: 'stun', value: 1, duration: 2000 }
            ]
          },
          {
            id: 'clone_phase',
            name: 'Shaper Clones',
            description: 'Summons multiple clones of himself',
            type: 'summon',
            triggerCondition: 'health_threshold',
            cooldown: 45000,
            duration: 15000,
            effects: [
              { type: 'invulnerable', value: 1, duration: 2000 }
            ]
          }
        ],
        phases: [
          {
            id: 'phase_1',
            name: 'Initial Phase',
            healthThreshold: 1.0,
            mechanics: ['bullet_hell', 'teleport_slam'],
            specialEffects: ['shaper_beam']
          },
          {
            id: 'phase_2',
            name: 'Clone Phase',
            healthThreshold: 0.66,
            mechanics: ['bullet_hell', 'clone_phase'],
            specialEffects: ['reality_distortion'],
            transitionEffect: 'screen_shake'
          },
          {
            id: 'phase_3',
            name: 'Final Phase',
            healthThreshold: 0.33,
            mechanics: ['bullet_hell', 'teleport_slam', 'clone_phase'],
            specialEffects: ['enrage', 'increased_speed']
          }
        ],
        rewards: [
          {
            type: 'unique_item',
            name: 'Starforge',
            description: 'The Shaper\'s legendary sword',
            rarity: 'very_rare',
            dropChance: 0.05,
            baseType: 'two_handed_sword'
          },
          {
            type: 'atlas_points',
            name: 'Atlas Points',
            description: 'Points for atlas progression',
            rarity: 'guaranteed',
            dropChance: 1.0,
            quantity: 10
          },
          {
            type: 'fragment',
            name: 'Shaper\'s Orb',
            description: 'Upgrades maps to Shaper tier',
            rarity: 'guaranteed',
            dropChance: 1.0
          }
        ],
        unlocked: false,
        defeated: false,
        attempts: 0,
        stats: {
          health: 500000,
          maxHealth: 500000,
          damage: 4000,
          resistance: {
            fire: 40,
            cold: 40,
            lightning: 40,
            chaos: 75,
            physical: 25
          },
          immunities: ['stun', 'freeze'],
          speed: 100,
          criticalChance: 15,
          criticalMultiplier: 200
        }
      },
      {
        id: 'the_elder',
        name: 'The Elder',
        tier: 16,
        level: 84,
        description: 'Ancient entity of decay and corruption',
        lore: 'The Elder is an ancient cosmic horror that seeks to consume all reality. Its tentacles spread corruption throughout the Atlas.',
        type: 'elder',
        difficulty: 'normal',
        requirements: [
          {
            type: 'atlas_completion',
            description: 'Complete Elder questline',
            completed: false
          }
        ],
        mechanics: [
          {
            id: 'tentacle_slam',
            name: 'Tentacle Slam',
            description: 'Massive tentacles emerge from the ground',
            type: 'environmental',
            triggerCondition: 'time_elapsed',
            cooldown: 12000,
            damage: 6000,
            effects: [
              { type: 'slow', value: 50, duration: 4000 }
            ]
          },
          {
            id: 'corruption_aura',
            name: 'Corruption Aura',
            description: 'Spreads corrupting energy around the arena',
            type: 'debuff',
            triggerCondition: 'health_threshold',
            cooldown: 30000,
            duration: 20000,
            effects: [
              { type: 'damage_over_time', value: 800, duration: 20000, element: 'chaos' }
            ]
          }
        ],
        phases: [
          {
            id: 'elder_phase_1',
            name: 'Awakening',
            healthThreshold: 1.0,
            mechanics: ['tentacle_slam'],
            specialEffects: ['elder_presence']
          },
          {
            id: 'elder_phase_2',
            name: 'Corruption',
            healthThreshold: 0.5,
            mechanics: ['tentacle_slam', 'corruption_aura'],
            specialEffects: ['spreading_corruption']
          }
        ],
        rewards: [
          {
            type: 'unique_item',
            name: 'Voidfletcher',
            description: 'The Elder\'s corrupted quiver',
            rarity: 'rare',
            dropChance: 0.1,
            baseType: 'quiver'
          },
          {
            type: 'atlas_points',
            name: 'Atlas Points',
            description: 'Points for atlas progression',
            rarity: 'guaranteed',
            dropChance: 1.0,
            quantity: 8
          }
        ],
        unlocked: false,
        defeated: false,
        attempts: 0,
        stats: {
          health: 750000,
          maxHealth: 750000,
          damage: 5000,
          resistance: {
            fire: 30,
            cold: 30,
            lightning: 30,
            chaos: 90,
            physical: 40
          },
          immunities: ['chaos_damage'],
          speed: 80,
          criticalChance: 10,
          criticalMultiplier: 150
        }
      },
      {
        id: 'sirus',
        name: 'Sirus, Awakener of Worlds',
        tier: 18,
        level: 86,
        description: 'The most powerful conqueror, corrupted by the Atlas',
        lore: 'Once a proud exile and Atlas explorer, Sirus has been consumed by the Atlas\'s power and seeks to unmake all existence.',
        type: 'sirus',
        difficulty: 'awakened',
        requirements: [
          {
            type: 'atlas_completion',
            description: 'Defeat all 4 Conquerors',
            amount: 4,
            completed: false
          },
          {
            type: 'watchstone',
            description: 'Socket 20 Watchstones',
            amount: 20,
            completed: false
          }
        ],
        mechanics: [
          {
            id: 'die_beam',
            name: 'Die Beam',
            description: 'Devastating beam that crosses the arena',
            type: 'damage',
            triggerCondition: 'health_threshold',
            cooldown: 25000,
            damage: 15000,
            effects: [
              { type: 'damage_over_time', value: 2000, duration: 5000 }
            ]
          },
          {
            id: 'meteor_maze',
            name: 'Meteor Maze',
            description: 'Creates a maze of meteor impacts',
            type: 'environmental',
            triggerCondition: 'health_threshold',
            cooldown: 40000,
            duration: 15000,
            effects: [
              { type: 'teleport', value: 1, duration: 500 }
            ]
          },
          {
            id: 'corridor_storm',
            name: 'Corridor Storm',
            description: 'Summons rotating beam corridors',
            type: 'environmental',
            triggerCondition: 'time_elapsed',
            cooldown: 35000,
            duration: 12000,
            effects: []
          }
        ],
        phases: [
          {
            id: 'sirus_phase_1',
            name: 'The Awakener Stirs',
            healthThreshold: 1.0,
            mechanics: ['die_beam'],
            specialEffects: ['sirus_presence']
          },
          {
            id: 'sirus_phase_2',
            name: 'Meteor Apocalypse',
            healthThreshold: 0.75,
            mechanics: ['die_beam', 'meteor_maze'],
            specialEffects: ['reality_breakdown']
          },
          {
            id: 'sirus_phase_3',
            name: 'Storm of Annihilation',
            healthThreshold: 0.5,
            mechanics: ['die_beam', 'corridor_storm'],
            specialEffects: ['space_distortion']
          },
          {
            id: 'sirus_final',
            name: 'The End of All',
            healthThreshold: 0.25,
            mechanics: ['die_beam', 'meteor_maze', 'corridor_storm'],
            specialEffects: ['enrage', 'reality_collapse']
          }
        ],
        rewards: [
          {
            type: 'awakened_gem',
            name: 'Awakened Support Gem',
            description: 'Powerful awakened support gem',
            rarity: 'rare',
            dropChance: 0.25
          },
          {
            type: 'unique_item',
            name: 'Saviour',
            description: 'Sirus\'s legendary sword',
            rarity: 'very_rare',
            dropChance: 0.02,
            baseType: 'one_handed_sword'
          },
          {
            type: 'atlas_points',
            name: 'Atlas Points',
            description: 'Points for atlas progression',
            rarity: 'guaranteed',
            dropChance: 1.0,
            quantity: 15
          }
        ],
        unlocked: false,
        defeated: false,
        attempts: 0,
        stats: {
          health: 1500000,
          maxHealth: 1500000,
          damage: 8000,
          resistance: {
            fire: 50,
            cold: 50,
            lightning: 50,
            chaos: 80,
            physical: 50
          },
          immunities: ['stun', 'slow', 'freeze'],
          speed: 120,
          criticalChance: 25,
          criticalMultiplier: 300
        }
      },
      {
        id: 'maven',
        name: 'The Maven',
        tier: 20,
        level: 88,
        description: 'Cosmic entity that witnesses and judges conflicts',
        lore: 'The Maven is an ancient cosmic being that observes conflicts across realities. She has grown bored and now seeks to create the ultimate challenge.',
        type: 'maven',
        difficulty: 'uber',
        requirements: [
          {
            type: 'maven_witness',
            description: 'Maven must witness 100 boss fights',
            amount: 100,
            completed: false
          },
          {
            type: 'item',
            description: 'Maven\'s Writ',
            target: 'mavens_writ',
            completed: false
          }
        ],
        mechanics: [
          {
            id: 'memory_game',
            name: 'Memory Game',
            description: 'Players must follow a sequence of safe zones',
            type: 'environmental',
            triggerCondition: 'health_threshold',
            cooldown: 60000,
            duration: 30000,
            effects: []
          },
          {
            id: 'brain_damage',
            name: 'Cascade of Pain',
            description: 'Overlapping areas of damage',
            type: 'damage',
            triggerCondition: 'time_elapsed',
            cooldown: 20000,
            damage: 12000,
            effects: [
              { type: 'damage_over_time', value: 1500, duration: 8000 }
            ]
          },
          {
            id: 'maven_heal',
            name: 'Maven\'s Healing',
            description: 'Maven heals herself during the fight',
            type: 'environmental',
            triggerCondition: 'health_threshold',
            cooldown: 80000,
            effects: []
          }
        ],
        phases: [
          {
            id: 'maven_opening',
            name: 'The Witness Awakens',
            healthThreshold: 1.0,
            mechanics: ['brain_damage'],
            specialEffects: ['maven_presence']
          },
          {
            id: 'maven_memory',
            name: 'Test of Memory',
            healthThreshold: 0.7,
            mechanics: ['memory_game', 'brain_damage'],
            specialEffects: ['reality_shifting']
          },
          {
            id: 'maven_challenge',
            name: 'Ultimate Challenge',
            healthThreshold: 0.4,
            mechanics: ['memory_game', 'brain_damage', 'maven_heal'],
            specialEffects: ['time_dilation', 'space_warping']
          }
        ],
        rewards: [
          {
            type: 'maven_orb',
            name: 'Maven\'s Orb',
            description: 'Elevates Atlas passive skills',
            rarity: 'guaranteed',
            dropChance: 1.0
          },
          {
            type: 'unique_item',
            name: 'Doryani\'s Prototype',
            description: 'The Maven\'s experimental armor',
            rarity: 'very_rare',
            dropChance: 0.03,
            baseType: 'body_armor'
          },
          {
            type: 'atlas_points',
            name: 'Atlas Points',
            description: 'Points for atlas progression',
            rarity: 'guaranteed',
            dropChance: 1.0,
            quantity: 25
          }
        ],
        unlocked: false,
        defeated: false,
        attempts: 0,
        stats: {
          health: 2500000,
          maxHealth: 2500000,
          damage: 10000,
          resistance: {
            fire: 75,
            cold: 75,
            lightning: 75,
            chaos: 90,
            physical: 75
          },
          immunities: ['stun', 'slow', 'freeze', 'curse'],
          speed: 150,
          criticalChance: 30,
          criticalMultiplier: 400
        }
      }
    ];

    endgameBosses.forEach(boss => {
      this.bosses.set(boss.id, boss);
    });
  }

  private initializePinnacleConfigs(): void {
    const pinnacleConfigs: PinnacleBossConfig[] = [
      {
        id: 'shaper_set',
        name: 'Shaper Fragment Set',
        unlockConditions: [
          'complete_tier_15_maps',
          'kill_shaper_guardians'
        ],
        fragments: [
          {
            id: 'fragment_of_the_minotaur',
            name: 'Fragment of the Minotaur',
            description: 'Obtained from the Minotaur Guardian',
            source: 'Maze of the Minotaur',
            dropChance: 1.0
          },
          {
            id: 'fragment_of_the_chimera',
            name: 'Fragment of the Chimera',
            description: 'Obtained from the Chimera Guardian',
            source: 'Pit of the Chimera',
            dropChance: 1.0
          },
          {
            id: 'fragment_of_the_hydra',
            name: 'Fragment of the Hydra',
            description: 'Obtained from the Hydra Guardian',
            source: 'Lair of the Hydra',
            dropChance: 1.0
          },
          {
            id: 'fragment_of_the_phoenix',
            name: 'Fragment of the Phoenix',
            description: 'Obtained from the Phoenix Guardian',
            source: 'Forge of the Phoenix',
            dropChance: 1.0
          }
        ],
        setBonus: [
          {
            name: 'Guardian Slayer',
            description: 'Access to The Shaper\'s Realm',
            effect: 'unlock_shaper_fight',
            value: 1
          }
        ]
      },
      {
        id: 'maven_set',
        name: 'Maven Invitation Set',
        unlockConditions: [
          'maven_witness_100_fights',
          'complete_atlas_regions'
        ],
        fragments: [
          {
            id: 'mavens_writ',
            name: 'Maven\'s Writ',
            description: 'Invitation to face The Maven',
            source: 'Maven Witnessing',
            dropChance: 0.1
          }
        ],
        setBonus: [
          {
            name: 'The Witnessed',
            description: 'Able to challenge The Maven',
            effect: 'unlock_maven_fight',
            value: 1
          }
        ]
      }
    ];

    pinnacleConfigs.forEach(config => {
      this.pinnacleConfigs.set(config.id, config);
    });
  }

  // Public API Methods
  getAllBosses(): EndgameBoss[] {
    return Array.from(this.bosses.values());
  }

  getBoss(bossId: string): EndgameBoss | null {
    return this.bosses.get(bossId) || null;
  }

  getUnlockedBosses(): EndgameBoss[] {
    return Array.from(this.bosses.values()).filter(boss => boss.unlocked);
  }

  getDefeatedBosses(): EndgameBoss[] {
    return Array.from(this.bosses.values()).filter(boss => boss.defeated);
  }

  getBossesByTier(tier: number): EndgameBoss[] {
    return Array.from(this.bosses.values()).filter(boss => boss.tier === tier);
  }

  getBossesByType(type: EndgameBoss['type']): EndgameBoss[] {
    return Array.from(this.bosses.values()).filter(boss => boss.type === type);
  }

  getActiveEncounter(): BossEncounter | null {
    return this.activeEncounter;
  }

  getBossStats(bossId: string): BossStats | null {
    const boss = this.bosses.get(bossId);
    return boss ? boss.stats : null;
  }

  updateBossHealth(bossId: string, newHealth: number): void {
    const boss = this.bosses.get(bossId);
    if (boss) {
      boss.stats.health = Math.max(0, Math.min(newHealth, boss.stats.maxHealth));
      this.emit('bossHealthChanged', { bossId, health: boss.stats.health, maxHealth: boss.stats.maxHealth });
    }
  }

  dealDamageToBoss(bossId: string, damage: number): void {
    const boss = this.bosses.get(bossId);
    if (boss && this.activeEncounter) {
      boss.stats.health = Math.max(0, boss.stats.health - damage);
      this.activeEncounter.playerDamageDealt += damage;
      
      if (boss.stats.health === 0) {
        this.endBossEncounter(true);
      }
      
      this.emit('bossHealthChanged', { bossId, damage, health: boss.stats.health });
    }
  }

  resetBoss(bossId: string): void {
    const boss = this.bosses.get(bossId);
    if (boss) {
      boss.stats.health = boss.stats.maxHealth;
      boss.defeated = false;
      boss.attempts = 0;
      delete boss.bestTime;
      this.emit('bossReset', { bossId, boss });
    }
  }
}

export default EndgameBossSystem;