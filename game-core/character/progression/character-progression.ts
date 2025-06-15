// character-progression.ts - Character Progression System
import { IEntity } from '../../ecs/ecs-core';

export interface QuestReward {
  quest: string;
  skillPoints: number;
}

export interface ActRewards {
  [actKey: string]: QuestReward[];
}

export interface AttributeAllocation {
  strength: number;
  dexterity: number;
  intelligence: number;
}

export interface AttributeChoices {
  [key: string]: AttributeAllocation;
}

export interface LevelUpChoices {
  attributeAllocation?: string;
}

export interface ProgressionMilestone {
  level: number;
  rewards: string[];
  description: string;
}

export interface ProgressionMilestones {
  [key: string]: ProgressionMilestone;
}

export interface ProgressionStats {
  level: number;
  totalExperience: number;
  currentLevelExperience: number;
  experienceToNext: number;
  progressToNextLevel: number;
  skillPointsAllocated: number;
  skillPointsAvailable: number;
  questRewardsReceived: number;
}

export class CharacterProgression {
  levelCap: number;
  baseAttributesPerLevel: number;
  baseSkillPointsPerLevel: number;
  questSkillPointRewards: ActRewards;
  experienceTable: number[];
  attributeChoices: AttributeChoices;

  constructor() {
    this.levelCap = 60;
    this.baseAttributesPerLevel = 2;
    this.baseSkillPointsPerLevel = 1;
    this.questSkillPointRewards = this.initializeQuestRewards();
    this.experienceTable = this.generateExperienceTable();
    
    this.attributeChoices = {
      'strength_focus': { strength: 2, dexterity: 0, intelligence: 0 },
      'dexterity_focus': { strength: 0, dexterity: 2, intelligence: 0 },
      'intelligence_focus': { strength: 0, dexterity: 0, intelligence: 2 },
      'balanced_str_dex': { strength: 1, dexterity: 1, intelligence: 0 },
      'balanced_str_int': { strength: 1, dexterity: 0, intelligence: 1 },
      'balanced_dex_int': { strength: 0, dexterity: 1, intelligence: 1 },
      'balanced_all': { strength: 1, dexterity: 0, intelligence: 1 }
    };
  }

  generateExperienceTable(): number[] {
    const table = [0]; // Level 1 requires 0 XP
    
    for (let level = 2; level <= this.levelCap; level++) {
      const baseXP = Math.floor(level * level * 15 + level * 50);
      const scalingFactor = Math.pow(1.08, level - 1);
      const requiredXP = Math.floor(baseXP * scalingFactor);
      
      table.push(requiredXP);
    }
    
    return table;
  }

  initializeQuestRewards(): ActRewards {
    return {
      act1: [
        { quest: 'enemy_at_the_gate', skillPoints: 1 },
        { quest: 'mercy_mission', skillPoints: 1 },
        { quest: 'breaking_some_eggs', skillPoints: 1 }
      ],
      act2: [
        { quest: 'sharp_and_cruel', skillPoints: 1 },
        { quest: 'the_way_forward', skillPoints: 1 },
        { quest: 'intruders_in_black', skillPoints: 1 }
      ],
      act3: [
        { quest: 'fixture_of_fate', skillPoints: 1 },
        { quest: 'sever_the_right_hand', skillPoints: 1 }
      ],
      act4: [
        { quest: 'the_eternal_nightmare', skillPoints: 2 }
      ],
      act5: [
        { quest: 'in_service_to_science', skillPoints: 1 },
        { quest: 'kitava_the_insatiable', skillPoints: 1 }
      ],
      act6: [
        { quest: 'the_cloven_one', skillPoints: 1 },
        { quest: 'the_puppet_mistress', skillPoints: 1 }
      ],
      act7: [
        { quest: 'the_master_of_a_million_faces', skillPoints: 1 },
        { quest: 'kishara_star_of_the_desert', skillPoints: 1 }
      ],
      act8: [
        { quest: 'reflection_of_terror', skillPoints: 1 },
        { quest: 'love_is_dead', skillPoints: 1 }
      ],
      act9: [
        { quest: 'the_ruler_of_highgate', skillPoints: 1 },
        { quest: 'queen_of_the_sands', skillPoints: 1 }
      ],
      act10: [
        { quest: 'vilenta_vengeance', skillPoints: 1 },
        { quest: 'kitava_the_destroyer', skillPoints: 2 }
      ]
    };
  }

  getTotalExperienceForLevel(level: number): number {
    if (level <= 1) return 0;
    if (level > this.levelCap) level = this.levelCap;
    
    let totalXP = 0;
    for (let i = 2; i <= level; i++) {
      totalXP += this.experienceTable[i - 1];
    }
    return totalXP;
  }

  getExperienceToNextLevel(currentLevel: number): number {
    if (currentLevel >= this.levelCap) return 0;
    return this.experienceTable[currentLevel];
  }

  canLevelUp(entity: IEntity): boolean {
    const level = entity.getComponent('Level');
    const experience = entity.getComponent('Experience');
    
    if (!level || !experience || level.current >= this.levelCap) {
      return false;
    }
    
    const requiredXP = this.getExperienceToNextLevel(level.current);
    return experience.current >= requiredXP;
  }

  levelUp(entity: IEntity, choices: LevelUpChoices = {}): boolean {
    if (!this.canLevelUp(entity)) return false;
    
    const level = entity.getComponent('Level');
    const experience = entity.getComponent('Experience');
    const attributes = entity.getComponent('Attributes');
    const skillTree = entity.getComponent('SkillTree');
    
    const requiredXP = this.getExperienceToNextLevel(level.current);
    experience.current -= requiredXP;
    level.current += 1;
    
    skillTree.availablePoints += this.baseSkillPointsPerLevel;
    
    const attributeChoice = choices.attributeAllocation || this.getDefaultAttributeChoice(entity);
    this.allocateAttributes(attributes, attributeChoice);
    
    this.updateDerivedStats(entity);
    
    const event = new CustomEvent('characterLevelUp', {
      detail: { 
        entity, 
        newLevel: level.current,
        choices 
      }
    });
    if (typeof document !== 'undefined') {
      document.dispatchEvent(event);
    }
    
    return true;
  }

  getDefaultAttributeChoice(entity: IEntity): string {
    const characterClass = entity.getComponent('CharacterClass');
    
    const classDefaults: Record<string, string> = {
      'Marauder': 'strength_focus',
      'Ranger': 'dexterity_focus', 
      'Witch': 'intelligence_focus',
      'Duelist': 'balanced_str_dex',
      'Templar': 'balanced_str_int',
      'Shadow': 'balanced_dex_int',
      'Scion': 'balanced_all'
    };
    
    return classDefaults[characterClass?.name] || 'balanced_all';
  }

  allocateAttributes(attributes: any, choiceKey: string): void {
    const allocation = this.attributeChoices[choiceKey];
    if (!allocation) {
      console.warn(`Unknown attribute allocation choice: ${choiceKey}`);
      return;
    }
    
    attributes.strength += allocation.strength;
    attributes.dexterity += allocation.dexterity;
    attributes.intelligence += allocation.intelligence;
  }

  updateDerivedStats(entity: IEntity): void {
    const attributes = entity.getComponent('Attributes');
    const health = entity.getComponent('Health');
    const mana = entity.getComponent('Mana');
    const level = entity.getComponent('Level');
    
    const maxLife = 40 + (level.current * 6) + Math.floor(attributes.strength * 0.5);
    health.maximum = maxLife;
    health.current = Math.min(health.current, maxLife);
    
    const maxMana = 30 + (level.current * 4) + Math.floor(attributes.intelligence * 0.5);
    mana.maximum = maxMana;
    mana.current = Math.min(mana.current, maxMana);
  }

  awardQuestSkillPoints(entity: IEntity, questId: string): boolean {
    const skillTree = entity.getComponent('SkillTree');
    if (!skillTree) return false;
    
    let reward: QuestReward | null = null;
    for (const act of Object.values(this.questSkillPointRewards)) {
      const found = act.find(q => q.quest === questId);
      if (found) {
        reward = found;
        break;
      }
    }
    
    if (!reward) return false;
    
    if (skillTree.questRewardsReceived.has(questId)) {
      return false;
    }
    
    skillTree.availablePoints += reward.skillPoints;
    skillTree.questRewardsReceived.add(questId);
    
    const event = new CustomEvent('questSkillPointAwarded', {
      detail: { 
        entity, 
        questId, 
        skillPoints: reward.skillPoints 
      }
    });
    if (typeof document !== 'undefined') {
      document.dispatchEvent(event);
    }
    
    return true;
  }

  getTotalSkillPointsAtLevel(level: number, completedQuests: Set<string> = new Set()): number {
    let totalPoints = level;
    
    for (const act of Object.values(this.questSkillPointRewards)) {
      for (const quest of act) {
        if (completedQuests.has(quest.quest)) {
          totalPoints += quest.skillPoints;
        }
      }
    }
    
    return totalPoints;
  }

  getProgressionMilestones(): ProgressionMilestones {
    return {
      level_10: {
        level: 10,
        rewards: ['Equipment upgrade quest'],
        description: 'Basic gameplay mastery'
      },
      level_20: {
        level: 20,
        rewards: ['Advanced skill gems unlocked'],
        description: 'Intermediate character development'
      },
      level_30: {
        level: 30,
        rewards: ['Lab access for Ascendancy'],
        description: 'Ascendancy class selection'
      },
      level_40: {
        level: 40,
        rewards: ['Cruel difficulty unlocked'],
        description: 'Advanced gameplay challenges'
      },
      level_50: {
        level: 50,
        rewards: ['Merciless difficulty unlocked'],
        description: 'Expert gameplay mastery'
      },
      level_60: {
        level: 60,
        rewards: ['Endgame mapping access'],
        description: 'Ready for endgame content'
      }
    };
  }

  validateProgression(entity: IEntity): string[] {
    const level = entity.getComponent('Level');
    const experience = entity.getComponent('Experience');
    const skillTree = entity.getComponent('SkillTree');
    
    const errors: string[] = [];
    
    if (level.current < 1 || level.current > this.levelCap) {
      errors.push(`Invalid level: ${level.current}`);
    }
    
    const totalXPRequired = this.getTotalExperienceForLevel(level.current);
    if (experience.total < totalXPRequired) {
      errors.push(`Insufficient total XP for level ${level.current}`);
    }
    
    const maxSkillPoints = this.getTotalSkillPointsAtLevel(level.current, skillTree.questRewardsReceived);
    const allocatedPoints = skillTree.allocatedNodes.size;
    const availablePoints = skillTree.availablePoints;
    
    if (allocatedPoints + availablePoints > maxSkillPoints) {
      errors.push(`Too many skill points: ${allocatedPoints + availablePoints} > ${maxSkillPoints}`);
    }
    
    return errors;
  }

  getProgressionStats(entity: IEntity): ProgressionStats {
    const level = entity.getComponent('Level');
    const experience = entity.getComponent('Experience');
    const skillTree = entity.getComponent('SkillTree');
    
    const currentLevelXP = this.getTotalExperienceForLevel(level.current);
    const nextLevelXP = this.getTotalExperienceForLevel(level.current + 1);
    const progressToNext = nextLevelXP > 0 ? 
      (experience.total - currentLevelXP) / (nextLevelXP - currentLevelXP) * 100 : 100;
    
    return {
      level: level.current,
      totalExperience: experience.total,
      currentLevelExperience: experience.total - currentLevelXP,
      experienceToNext: nextLevelXP - experience.total,
      progressToNextLevel: Math.max(0, Math.min(100, progressToNext)),
      skillPointsAllocated: skillTree.allocatedNodes.size,
      skillPointsAvailable: skillTree.availablePoints,
      questRewardsReceived: skillTree.questRewardsReceived.size
    };
  }
}

export class ExperienceSystem {
  baseExperienceMultiplier: number;
  progressionManager: CharacterProgression;

  constructor() {
    this.baseExperienceMultiplier = 1.0;
    this.progressionManager = new CharacterProgression();
  }

  awardExperience(entity: IEntity, amount: number, source: string = 'unknown'): number {
    const experience = entity.getComponent('Experience');
    const level = entity.getComponent('Level');
    
    if (!experience || !level) return 0;
    
    const scaledAmount = this.scaleExperienceByLevel(amount, level.current, source);
    
    experience.current += scaledAmount;
    experience.total += scaledAmount;
    
    while (this.progressionManager.canLevelUp(entity)) {
      this.progressionManager.levelUp(entity);
    }
    
    const event = new CustomEvent('experienceGained', {
      detail: { 
        entity, 
        amount: scaledAmount,
        source,
        newTotal: experience.total
      }
    });
    if (typeof document !== 'undefined') {
      document.dispatchEvent(event);
    }
    
    return scaledAmount;
  }

  scaleExperienceByLevel(baseAmount: number, characterLevel: number, source: string): number {
    const sourceMultipliers: Record<string, number> = {
      'enemy_kill': 1.0,
      'quest_completion': 1.2,
      'boss_kill': 1.5,
      'exploration': 0.8,
      'crafting': 0.6
    };
    
    const sourceMultiplier = sourceMultipliers[source] || 1.0;
    return Math.floor(baseAmount * sourceMultiplier * this.baseExperienceMultiplier);
  }

  calculateEnemyExperience(enemyLevel: number, characterLevel: number): number {
    const baseFactor = 10;
    const levelDifference = enemyLevel - characterLevel;
    
    let scalingFactor = 1.0;
    if (levelDifference < -5) {
      scalingFactor = Math.max(0.1, 1.0 + (levelDifference + 5) * 0.1);
    } else if (levelDifference > 5) {
      scalingFactor = 1.0 + Math.min(levelDifference - 5, 10) * 0.15;
    }
    
    return Math.floor(baseFactor * enemyLevel * scalingFactor);
  }
}

export default { CharacterProgression, ExperienceSystem };