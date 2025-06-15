import { EventEmitter } from 'events';
import { ISystem, IEntity } from '../ecs/ecs-core';
import { SystemMetrics } from '../../types/ecs-types';

export interface DifficultyTier {
  id: string;
  name: string;
  level: number;
  description: string;
  requirements: DifficultyRequirement[];
  modifiers: DifficultyModifier[];
  rewards: DifficultyReward[];
  unlocked: boolean;
  completed: boolean;
  completionTime?: number;
  attempts: number;
  bestScore?: number;
}

export interface DifficultyRequirement {
  type: 'level' | 'atlas_completion' | 'boss_kills' | 'map_completion' | 'skill_points' | 'character_class';
  description: string;
  target: string | number;
  currentValue: number;
  targetValue: number;
  completed: boolean;
}

export interface DifficultyModifier {
  id: string;
  name: string;
  description: string;
  type: 'monster_stat' | 'player_stat' | 'environmental' | 'reward' | 'mechanical';
  category: 'buff' | 'debuff' | 'neutral';
  effects: ModifierEffect[];
  stackable: boolean;
  maxStacks?: number;
  currentStacks: number;
}

export interface ModifierEffect {
  stat: string;
  value: number;
  valueType: 'flat' | 'percentage' | 'multiplier';
  target: 'player' | 'monster' | 'environment' | 'loot' | 'experience';
  duration?: number;
  condition?: string;
}

export interface DifficultyReward {
  type: 'experience' | 'currency' | 'item' | 'skill_point' | 'atlas_point' | 'unique_reward';
  name: string;
  description: string;
  baseValue: number;
  scalingFactor: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary';
  dropChance: number;
  tierMultiplier: number;
}

export interface DifficultyScaling {
  monsterLife: number;
  monsterDamage: number;
  monsterSpeed: number;
  monsterResistance: number;
  experienceMultiplier: number;
  lootQuantity: number;
  lootRarity: number;
  currencyDropRate: number;
  uniqueDropChance: number;
}

export interface DifficultyProgression {
  currentTier: number;
  maxTierReached: number;
  totalCompletions: number;
  totalAttempts: number;
  averageTime: number;
  bestOverallTime: number;
  totalExperienceGained: number;
  totalRewardsEarned: number;
  streakBonuses: number;
  perfectRuns: number;
}

export interface DifficultyChallenge {
  id: string;
  name: string;
  description: string;
  type: 'time_attack' | 'survival' | 'boss_rush' | 'gauntlet' | 'endless' | 'puzzle';
  duration: number;
  objectives: ChallengeObjective[];
  modifiers: string[];
  rewards: DifficultyReward[];
  leaderboard: LeaderboardEntry[];
  active: boolean;
  startTime?: number;
  endTime?: number;
}

export interface ChallengeObjective {
  id: string;
  description: string;
  type: 'kill_count' | 'survive_time' | 'collect_items' | 'reach_location' | 'damage_dealt' | 'damage_taken';
  target: number;
  current: number;
  completed: boolean;
  reward: DifficultyReward;
}

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  score: number;
  time: number;
  tier: number;
  date: number;
  modifiers: string[];
}

export interface EndlessScaling {
  waveNumber: number;
  enemyLevelBonus: number;
  enemyHealthMultiplier: number;
  enemyDamageMultiplier: number;
  enemySpeedMultiplier: number;
  spawnRateMultiplier: number;
  eliteChance: number;
  bossChance: number;
  rewardMultiplier: number;
}

export class ProgressiveDifficultySystem extends EventEmitter implements ISystem {
  readonly name: string = 'ProgressiveDifficultySystem';
  readonly requiredComponents: readonly string[] = ['Difficulty', 'Player'];
  readonly entities: Set<IEntity> = new Set();
  readonly priority: number = 15;
  enabled: boolean = true;

  private difficultyTiers: Map<number, DifficultyTier> = new Map();
  private challenges: Map<string, DifficultyChallenge> = new Map();
  private progression: DifficultyProgression;
  private currentScaling: DifficultyScaling;
  private endlessScaling: EndlessScaling;
  private activeChallenge: DifficultyChallenge | null = null;
  private streakCount: number = 0;
  private lastCompletionTime: number = 0;

  constructor() {
    super();
    this.progression = {
      currentTier: 1,
      maxTierReached: 1,
      totalCompletions: 0,
      totalAttempts: 0,
      averageTime: 0,
      bestOverallTime: 0,
      totalExperienceGained: 0,
      totalRewardsEarned: 0,
      streakBonuses: 0,
      perfectRuns: 0
    };

    this.currentScaling = {
      monsterLife: 1.0,
      monsterDamage: 1.0,
      monsterSpeed: 1.0,
      monsterResistance: 0,
      experienceMultiplier: 1.0,
      lootQuantity: 1.0,
      lootRarity: 1.0,
      currencyDropRate: 1.0,
      uniqueDropChance: 1.0
    };

    this.endlessScaling = {
      waveNumber: 1,
      enemyLevelBonus: 0,
      enemyHealthMultiplier: 1.0,
      enemyDamageMultiplier: 1.0,
      enemySpeedMultiplier: 1.0,
      spawnRateMultiplier: 1.0,
      eliteChance: 0.05,
      bossChance: 0.01,
      rewardMultiplier: 1.0
    };

    this.initializeDifficultyTiers();
    this.initializeChallenges();
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

    // Update active challenge
    if (this.activeChallenge) {
      this.updateActiveChallenge(deltaTime);
    }

    // Update difficulty scaling based on current tier
    this.updateDifficultyScaling();

    // Process difficulty-related entities
    for (const entity of this.entities) {
      this.processDifficultyEntity(entity, deltaTime);
    }
  }

  canProcess(entity: IEntity): boolean {
    return entity.hasComponents(this.requiredComponents);
  }

  cleanup(): void {
    this.entities.clear();
    this.activeChallenge = null;
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

  // Difficulty Tier Management
  setDifficultyTier(tier: number): boolean {
    const difficultyTier = this.difficultyTiers.get(tier);
    if (!difficultyTier || !difficultyTier.unlocked) {
      return false;
    }

    this.progression.currentTier = tier;
    this.applyDifficultyModifiers(difficultyTier);
    this.emit('difficultyTierChanged', { tier, difficultyTier });
    return true;
  }

  unlockNextTier(): boolean {
    const nextTier = this.progression.maxTierReached + 1;
    const tier = this.difficultyTiers.get(nextTier);
    
    if (!tier) {
      return false;
    }

    // Check requirements
    if (!this.checkTierRequirements(tier)) {
      return false;
    }

    tier.unlocked = true;
    this.progression.maxTierReached = nextTier;
    this.emit('difficultyTierUnlocked', { tier: nextTier, difficultyTier: tier });
    return true;
  }

  completeTier(tier: number, completionTime: number, score: number): void {
    const difficultyTier = this.difficultyTiers.get(tier);
    if (!difficultyTier) return;

    difficultyTier.completed = true;
    difficultyTier.completionTime = completionTime;
    difficultyTier.attempts++;

    if (!difficultyTier.bestScore || score > difficultyTier.bestScore) {
      difficultyTier.bestScore = score;
    }

    // Update progression stats
    this.progression.totalCompletions++;
    this.progression.totalAttempts++;
    
    if (!this.progression.bestOverallTime || completionTime < this.progression.bestOverallTime) {
      this.progression.bestOverallTime = completionTime;
    }

    this.progression.averageTime = (this.progression.averageTime * (this.progression.totalCompletions - 1) + completionTime) / this.progression.totalCompletions;

    // Check for streak bonus
    this.updateStreakBonus(completionTime);

    // Grant rewards
    this.grantTierRewards(difficultyTier, score);

    // Try to unlock next tier
    this.unlockNextTier();

    this.emit('difficultyTierCompleted', { tier, difficultyTier, completionTime, score });
  }

  // Challenge System
  startChallenge(challengeId: string): boolean {
    const challenge = this.challenges.get(challengeId);
    if (!challenge || this.activeChallenge) {
      return false;
    }

    challenge.active = true;
    challenge.startTime = Date.now();
    challenge.endTime = challenge.startTime + challenge.duration;
    this.activeChallenge = challenge;

    // Reset objectives
    challenge.objectives.forEach(obj => {
      obj.current = 0;
      obj.completed = false;
    });

    // Apply challenge modifiers
    this.applyChallengeModifiers(challenge);

    this.emit('challengeStarted', { challengeId, challenge });
    return true;
  }

  endChallenge(successful: boolean): void {
    if (!this.activeChallenge) return;

    const challenge = this.activeChallenge;
    challenge.active = false;
    challenge.endTime = Date.now();

    if (successful) {
      const completionTime = challenge.endTime - (challenge.startTime || 0);
      const score = this.calculateChallengeScore(challenge);
      
      // Add to leaderboard
      this.addToLeaderboard(challenge, score, completionTime);
      
      // Grant rewards
      this.grantChallengeRewards(challenge, score);
    }

    // Remove challenge modifiers
    this.removeChallengeModifiers(challenge);

    this.activeChallenge = null;
    this.emit('challengeEnded', { challenge, successful });
  }

  updateChallengeObjective(objectiveId: string, progress: number): void {
    if (!this.activeChallenge) return;

    const objective = this.activeChallenge.objectives.find(obj => obj.id === objectiveId);
    if (!objective) return;

    objective.current = Math.min(objective.current + progress, objective.target);
    
    if (objective.current >= objective.target && !objective.completed) {
      objective.completed = true;
      this.grantObjectiveReward(objective);
      this.emit('challengeObjectiveCompleted', { objectiveId, objective });
    }

    // Check if all objectives are completed
    if (this.activeChallenge.objectives.every(obj => obj.completed)) {
      this.endChallenge(true);
    }
  }

  // Endless Mode
  startEndlessMode(): void {
    this.endlessScaling.waveNumber = 1;
    this.resetEndlessScaling();
    this.emit('endlessModeStarted', { scaling: this.endlessScaling });
  }

  advanceEndlessWave(): void {
    this.endlessScaling.waveNumber++;
    this.updateEndlessScaling();
    this.emit('endlessWaveAdvanced', { wave: this.endlessScaling.waveNumber, scaling: this.endlessScaling });
  }

  endEndlessMode(finalWave: number, score: number): void {
    const rewardMultiplier = this.endlessScaling.rewardMultiplier;
    this.grantEndlessRewards(finalWave, score, rewardMultiplier);
    this.resetEndlessScaling();
    this.emit('endlessModeEnded', { finalWave, score, rewardMultiplier });
  }

  // Scaling Calculations
  getMonsterScaling(): DifficultyScaling {
    return { ...this.currentScaling };
  }

  getRewardScaling(): { experience: number; loot: number; currency: number } {
    return {
      experience: this.currentScaling.experienceMultiplier,
      loot: this.currentScaling.lootQuantity * this.currentScaling.lootRarity,
      currency: this.currentScaling.currencyDropRate
    };
  }

  // Helper Methods
  private checkTierRequirements(tier: DifficultyTier): boolean {
    return tier.requirements.every(req => {
      switch (req.type) {
        case 'level':
          return req.currentValue >= req.targetValue;
        case 'atlas_completion':
          return req.currentValue >= req.targetValue;
        case 'boss_kills':
          return req.currentValue >= req.targetValue;
        case 'map_completion':
          return req.currentValue >= req.targetValue;
        case 'skill_points':
          return req.currentValue >= req.targetValue;
        case 'character_class':
          return req.completed;
        default:
          return false;
      }
    });
  }

  private applyDifficultyModifiers(tier: DifficultyTier): void {
    // Reset scaling to base values
    this.currentScaling = {
      monsterLife: 1.0,
      monsterDamage: 1.0,
      monsterSpeed: 1.0,
      monsterResistance: 0,
      experienceMultiplier: 1.0,
      lootQuantity: 1.0,
      lootRarity: 1.0,
      currencyDropRate: 1.0,
      uniqueDropChance: 1.0
    };

    // Apply tier modifiers
    tier.modifiers.forEach(modifier => {
      modifier.effects.forEach(effect => {
        this.applyScalingEffect(effect);
      });
    });

    this.emit('difficultyScalingApplied', { tier: tier.level, scaling: this.currentScaling });
  }

  private applyScalingEffect(effect: ModifierEffect): void {
    const scaling = this.currentScaling as any;
    
    if (!scaling[effect.stat]) return;

    switch (effect.valueType) {
      case 'flat':
        scaling[effect.stat] += effect.value;
        break;
      case 'percentage':
        scaling[effect.stat] *= (1 + effect.value / 100);
        break;
      case 'multiplier':
        scaling[effect.stat] *= effect.value;
        break;
    }
  }

  private updateDifficultyScaling(): void {
    const tier = this.difficultyTiers.get(this.progression.currentTier);
    if (tier) {
      this.applyDifficultyModifiers(tier);
    }
  }

  private updateStreakBonus(completionTime: number): void {
    const timeSinceLastCompletion = Date.now() - this.lastCompletionTime;
    const streakTimeLimit = 3600000; // 1 hour

    if (timeSinceLastCompletion <= streakTimeLimit) {
      this.streakCount++;
      this.progression.streakBonuses++;
    } else {
      this.streakCount = 1;
    }

    this.lastCompletionTime = Date.now();
    
    if (this.streakCount >= 5) {
      this.grantStreakBonus(this.streakCount);
    }
  }

  private grantTierRewards(tier: DifficultyTier, score: number): void {
    tier.rewards.forEach(reward => {
      const scaledValue = reward.baseValue * (1 + (tier.level - 1) * reward.scalingFactor) * reward.tierMultiplier;
      const shouldGrant = Math.random() < reward.dropChance;
      
      if (shouldGrant) {
        this.progression.totalRewardsEarned += scaledValue;
        this.emit('difficultyRewardGranted', { reward, value: scaledValue, tier: tier.level });
      }
    });
  }

  private grantStreakBonus(streakCount: number): void {
    const bonusMultiplier = 1 + (streakCount - 1) * 0.1; // 10% per streak level
    const bonusReward = {
      type: 'experience',
      name: 'Streak Bonus',
      description: `Bonus for ${streakCount} consecutive completions`,
      value: 1000 * bonusMultiplier
    };
    
    this.emit('streakBonusGranted', { streak: streakCount, reward: bonusReward });
  }

  private applyChallengeModifiers(challenge: DifficultyChallenge): void {
    challenge.modifiers.forEach(modifierId => {
      // Apply specific challenge modifiers
      this.emit('challengeModifierApplied', { modifierId, challengeId: challenge.id });
    });
  }

  private removeChallengeModifiers(challenge: DifficultyChallenge): void {
    challenge.modifiers.forEach(modifierId => {
      // Remove specific challenge modifiers
      this.emit('challengeModifierRemoved', { modifierId, challengeId: challenge.id });
    });
  }

  private calculateChallengeScore(challenge: DifficultyChallenge): number {
    let score = 0;
    const completionTime = (challenge.endTime || 0) - (challenge.startTime || 0);
    
    // Base score for completion
    score += 1000;
    
    // Time bonus (faster = higher score)
    const timeBonus = Math.max(0, challenge.duration - completionTime) / 1000;
    score += timeBonus;
    
    // Objective completion bonus
    const completedObjectives = challenge.objectives.filter(obj => obj.completed).length;
    score += completedObjectives * 500;
    
    return Math.floor(score);
  }

  private addToLeaderboard(challenge: DifficultyChallenge, score: number, time: number): void {
    const entry: LeaderboardEntry = {
      playerId: 'player_1', // Would get from player entity
      playerName: 'Player',
      score,
      time,
      tier: this.progression.currentTier,
      date: Date.now(),
      modifiers: [...challenge.modifiers]
    };

    challenge.leaderboard.push(entry);
    challenge.leaderboard.sort((a, b) => b.score - a.score);
    challenge.leaderboard = challenge.leaderboard.slice(0, 100); // Keep top 100

    this.emit('leaderboardUpdated', { challengeId: challenge.id, entry, rank: challenge.leaderboard.indexOf(entry) + 1 });
  }

  private grantChallengeRewards(challenge: DifficultyChallenge, score: number): void {
    challenge.rewards.forEach(reward => {
      const scoreMultiplier = score / 1000; // Base score of 1000
      const scaledValue = reward.baseValue * scoreMultiplier;
      this.emit('challengeRewardGranted', { reward, value: scaledValue, score });
    });
  }

  private grantObjectiveReward(objective: ChallengeObjective): void {
    this.emit('objectiveRewardGranted', { objective, reward: objective.reward });
  }

  private updateEndlessScaling(): void {
    const wave = this.endlessScaling.waveNumber;
    
    // Exponential scaling with wave number
    this.endlessScaling.enemyLevelBonus = Math.floor(wave / 5);
    this.endlessScaling.enemyHealthMultiplier = 1 + (wave - 1) * 0.15;
    this.endlessScaling.enemyDamageMultiplier = 1 + (wave - 1) * 0.10;
    this.endlessScaling.enemySpeedMultiplier = 1 + (wave - 1) * 0.05;
    this.endlessScaling.spawnRateMultiplier = 1 + (wave - 1) * 0.08;
    this.endlessScaling.eliteChance = Math.min(0.5, 0.05 + (wave - 1) * 0.02);
    this.endlessScaling.bossChance = Math.min(0.2, 0.01 + (wave - 1) * 0.005);
    this.endlessScaling.rewardMultiplier = 1 + (wave - 1) * 0.25;
  }

  private resetEndlessScaling(): void {
    this.endlessScaling.waveNumber = 1;
    this.endlessScaling.enemyLevelBonus = 0;
    this.endlessScaling.enemyHealthMultiplier = 1.0;
    this.endlessScaling.enemyDamageMultiplier = 1.0;
    this.endlessScaling.enemySpeedMultiplier = 1.0;
    this.endlessScaling.spawnRateMultiplier = 1.0;
    this.endlessScaling.eliteChance = 0.05;
    this.endlessScaling.bossChance = 0.01;
    this.endlessScaling.rewardMultiplier = 1.0;
  }

  private grantEndlessRewards(finalWave: number, score: number, multiplier: number): void {
    const baseReward = {
      type: 'experience',
      name: 'Endless Mode Completion',
      description: `Survived ${finalWave} waves`,
      value: finalWave * 100 * multiplier
    };
    
    this.emit('endlessRewardGranted', { finalWave, score, reward: baseReward });
  }

  private updateActiveChallenge(deltaTime: number): void {
    if (!this.activeChallenge) return;

    const currentTime = Date.now();
    const timeRemaining = (this.activeChallenge.endTime || 0) - currentTime;

    if (timeRemaining <= 0) {
      this.endChallenge(false); // Time expired
    }
  }

  private processDifficultyEntity(entity: IEntity, deltaTime: number): void {
    // Process entities affected by difficulty scaling
    // This could include updating monster stats, player rewards, etc.
  }

  private initializeDifficultyTiers(): void {
    const tiers: DifficultyTier[] = [
      {
        id: 'normal',
        name: 'Normal',
        level: 1,
        description: 'Standard difficulty for new exiles',
        requirements: [],
        modifiers: [],
        rewards: [
          {
            type: 'experience',
            name: 'Base Experience',
            description: 'Standard experience gain',
            baseValue: 100,
            scalingFactor: 0.1,
            rarity: 'common',
            dropChance: 1.0,
            tierMultiplier: 1.0
          }
        ],
        unlocked: true,
        completed: false,
        attempts: 0
      },
      {
        id: 'cruel',
        name: 'Cruel',
        level: 2,
        description: 'Increased monster difficulty with better rewards',
        requirements: [
          {
            type: 'level',
            description: 'Reach level 30',
            target: 30,
            currentValue: 0,
            targetValue: 30,
            completed: false
          }
        ],
        modifiers: [
          {
            id: 'cruel_monster_buff',
            name: 'Cruel Monster Enhancement',
            description: 'Monsters have increased life and damage',
            type: 'monster_stat',
            category: 'debuff',
            effects: [
              { stat: 'monsterLife', value: 50, valueType: 'percentage', target: 'monster' },
              { stat: 'monsterDamage', value: 25, valueType: 'percentage', target: 'monster' }
            ],
            stackable: false,
            currentStacks: 0
          }
        ],
        rewards: [
          {
            type: 'experience',
            name: 'Cruel Experience',
            description: '150% experience gain',
            baseValue: 150,
            scalingFactor: 0.15,
            rarity: 'common',
            dropChance: 1.0,
            tierMultiplier: 1.5
          },
          {
            type: 'currency',
            name: 'Currency Bonus',
            description: 'Increased currency drop rate',
            baseValue: 1,
            scalingFactor: 0.1,
            rarity: 'uncommon',
            dropChance: 0.8,
            tierMultiplier: 1.25
          }
        ],
        unlocked: false,
        completed: false,
        attempts: 0
      },
      {
        id: 'merciless',
        name: 'Merciless',
        level: 3,
        description: 'High difficulty with significant stat penalties',
        requirements: [
          {
            type: 'level',
            description: 'Reach level 50',
            target: 50,
            currentValue: 0,
            targetValue: 50,
            completed: false
          },
          {
            type: 'atlas_completion',
            description: 'Complete 25% of Atlas',
            target: 25,
            currentValue: 0,
            targetValue: 25,
            completed: false
          }
        ],
        modifiers: [
          {
            id: 'merciless_challenge',
            name: 'Merciless Challenge',
            description: 'Extreme monster enhancement with player penalties',
            type: 'monster_stat',
            category: 'debuff',
            effects: [
              { stat: 'monsterLife', value: 100, valueType: 'percentage', target: 'monster' },
              { stat: 'monsterDamage', value: 50, valueType: 'percentage', target: 'monster' },
              { stat: 'monsterSpeed', value: 25, valueType: 'percentage', target: 'monster' },
              { stat: 'monsterResistance', value: 25, valueType: 'flat', target: 'monster' }
            ],
            stackable: false,
            currentStacks: 0
          }
        ],
        rewards: [
          {
            type: 'experience',
            name: 'Merciless Experience',
            description: '200% experience gain',
            baseValue: 200,
            scalingFactor: 0.2,
            rarity: 'common',
            dropChance: 1.0,
            tierMultiplier: 2.0
          },
          {
            type: 'skill_point',
            name: 'Skill Point Reward',
            description: 'Passive skill point',
            baseValue: 1,
            scalingFactor: 0,
            rarity: 'rare',
            dropChance: 0.3,
            tierMultiplier: 1.0
          }
        ],
        unlocked: false,
        completed: false,
        attempts: 0
      },
      {
        id: 'maps',
        name: 'Maps',
        level: 4,
        description: 'Endgame map system with endless scaling',
        requirements: [
          {
            type: 'level',
            description: 'Reach level 60',
            target: 60,
            currentValue: 0,
            targetValue: 60,
            completed: false
          },
          {
            type: 'boss_kills',
            description: 'Defeat Act 10 Boss',
            target: 1,
            currentValue: 0,
            targetValue: 1,
            completed: false
          }
        ],
        modifiers: [
          {
            id: 'map_enhancement',
            name: 'Map Enhancement',
            description: 'Map-specific enhancements and rewards',
            type: 'reward',
            category: 'buff',
            effects: [
              { stat: 'lootQuantity', value: 100, valueType: 'percentage', target: 'loot' },
              { stat: 'lootRarity', value: 50, valueType: 'percentage', target: 'loot' },
              { stat: 'experienceMultiplier', value: 250, valueType: 'percentage', target: 'player' }
            ],
            stackable: false,
            currentStacks: 0
          }
        ],
        rewards: [
          {
            type: 'atlas_point',
            name: 'Atlas Points',
            description: 'Points for Atlas progression',
            baseValue: 1,
            scalingFactor: 0.5,
            rarity: 'common',
            dropChance: 1.0,
            tierMultiplier: 1.0
          },
          {
            type: 'unique_reward',
            name: 'Map Unique',
            description: 'Unique items from map bosses',
            baseValue: 1,
            scalingFactor: 0.1,
            rarity: 'very_rare',
            dropChance: 0.05,
            tierMultiplier: 1.0
          }
        ],
        unlocked: false,
        completed: false,
        attempts: 0
      }
    ];

    tiers.forEach(tier => {
      this.difficultyTiers.set(tier.level, tier);
    });
  }

  private initializeChallenges(): void {
    const challenges: DifficultyChallenge[] = [
      {
        id: 'speed_run',
        name: 'Speed Run Challenge',
        description: 'Complete objectives as quickly as possible',
        type: 'time_attack',
        duration: 300000, // 5 minutes
        objectives: [
          {
            id: 'kill_100_enemies',
            description: 'Kill 100 enemies',
            type: 'kill_count',
            target: 100,
            current: 0,
            completed: false,
            reward: {
              type: 'experience',
              name: 'Speed Kill Bonus',
              description: 'Bonus for fast kills',
              baseValue: 500,
              scalingFactor: 0.1,
              rarity: 'common',
              dropChance: 1.0,
              tierMultiplier: 1.0
            }
          }
        ],
        modifiers: ['speed_boost', 'damage_boost'],
        rewards: [
          {
            type: 'currency',
            name: 'Speed Reward',
            description: 'Currency for speed completion',
            baseValue: 10,
            scalingFactor: 0.2,
            rarity: 'uncommon',
            dropChance: 1.0,
            tierMultiplier: 1.0
          }
        ],
        leaderboard: [],
        active: false
      },
      {
        id: 'survival_gauntlet',
        name: 'Survival Gauntlet',
        description: 'Survive waves of increasingly difficult enemies',
        type: 'survival',
        duration: 600000, // 10 minutes
        objectives: [
          {
            id: 'survive_10_waves',
            description: 'Survive 10 waves',
            type: 'survive_time',
            target: 10,
            current: 0,
            completed: false,
            reward: {
              type: 'item',
              name: 'Survival Gear',
              description: 'Equipment for survivors',
              baseValue: 1,
              scalingFactor: 0,
              rarity: 'rare',
              dropChance: 1.0,
              tierMultiplier: 1.0
            }
          }
        ],
        modifiers: ['monster_waves', 'healing_reduction'],
        rewards: [
          {
            type: 'skill_point',
            name: 'Survival Mastery',
            description: 'Skill point for survival',
            baseValue: 1,
            scalingFactor: 0,
            rarity: 'rare',
            dropChance: 0.5,
            tierMultiplier: 1.0
          }
        ],
        leaderboard: [],
        active: false
      },
      {
        id: 'boss_rush',
        name: 'Boss Rush',
        description: 'Face multiple bosses in succession',
        type: 'boss_rush',
        duration: 900000, // 15 minutes
        objectives: [
          {
            id: 'defeat_5_bosses',
            description: 'Defeat 5 bosses',
            type: 'kill_count',
            target: 5,
            current: 0,
            completed: false,
            reward: {
              type: 'unique_reward',
              name: 'Boss Slayer Trophy',
              description: 'Trophy for defeating bosses',
              baseValue: 1,
              scalingFactor: 0,
              rarity: 'legendary',
              dropChance: 1.0,
              tierMultiplier: 1.0
            }
          }
        ],
        modifiers: ['boss_enhancement', 'loot_boost'],
        rewards: [
          {
            type: 'atlas_point',
            name: 'Boss Rush Points',
            description: 'Atlas points for boss defeats',
            baseValue: 5,
            scalingFactor: 0.5,
            rarity: 'rare',
            dropChance: 1.0,
            tierMultiplier: 1.0
          }
        ],
        leaderboard: [],
        active: false
      }
    ];

    challenges.forEach(challenge => {
      this.challenges.set(challenge.id, challenge);
    });
  }

  // Public API Methods
  getAllDifficultyTiers(): DifficultyTier[] {
    return Array.from(this.difficultyTiers.values());
  }

  getDifficultyTier(level: number): DifficultyTier | null {
    return this.difficultyTiers.get(level) || null;
  }

  getCurrentDifficultyTier(): DifficultyTier | null {
    return this.difficultyTiers.get(this.progression.currentTier) || null;
  }

  getUnlockedTiers(): DifficultyTier[] {
    return Array.from(this.difficultyTiers.values()).filter(tier => tier.unlocked);
  }

  getAllChallenges(): DifficultyChallenge[] {
    return Array.from(this.challenges.values());
  }

  getChallenge(challengeId: string): DifficultyChallenge | null {
    return this.challenges.get(challengeId) || null;
  }

  getActiveChallenge(): DifficultyChallenge | null {
    return this.activeChallenge;
  }

  getDifficultyProgression(): DifficultyProgression {
    return { ...this.progression };
  }

  getCurrentScaling(): DifficultyScaling {
    return { ...this.currentScaling };
  }

  getEndlessScaling(): EndlessScaling {
    return { ...this.endlessScaling };
  }

  getLeaderboard(challengeId: string): LeaderboardEntry[] {
    const challenge = this.challenges.get(challengeId);
    return challenge ? [...challenge.leaderboard] : [];
  }

  updateRequirementProgress(requirementType: string, progress: number): void {
    this.difficultyTiers.forEach(tier => {
      tier.requirements.forEach(req => {
        if (req.type === requirementType) {
          req.currentValue = Math.max(req.currentValue, progress);
          req.completed = req.currentValue >= req.targetValue;
        }
      });
    });

    this.emit('requirementProgressUpdated', { requirementType, progress });
  }

  resetProgression(): void {
    this.progression = {
      currentTier: 1,
      maxTierReached: 1,
      totalCompletions: 0,
      totalAttempts: 0,
      averageTime: 0,
      bestOverallTime: 0,
      totalExperienceGained: 0,
      totalRewardsEarned: 0,
      streakBonuses: 0,
      perfectRuns: 0
    };

    this.difficultyTiers.forEach(tier => {
      tier.unlocked = tier.level === 1;
      tier.completed = false;
      tier.attempts = 0;
      delete tier.completionTime;
      delete tier.bestScore;
    });

    this.emit('progressionReset');
  }
}

export default ProgressiveDifficultySystem;