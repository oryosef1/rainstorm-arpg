// RainStorm ARPG - Quest Generation Protocol
// Advanced quest generation with Claude integration and validation

import { ClaudeContentEngine, GeneratedContent } from './claude-engine';
import { GameContextManager } from './game-context';
import { IWorld, IEntity } from '../ecs/ecs-core';

export interface QuestObjective {
  id: string;
  type: 'investigate' | 'eliminate' | 'collect' | 'escort' | 'deliver' | 'survive' | 'craft' | 'discover';
  description: string;
  target: string;
  count: number;
  location: string;
  optional: boolean;
  prerequisites: string[];
  metadata: Record<string, any>;
}

export interface QuestRewards {
  experience: number;
  currency: Record<string, number>;
  items: QuestItemReward[];
  choices: QuestChoiceReward[];
  unlocks: string[];
  reputation: Record<string, number>;
}

export interface QuestItemReward {
  itemId: string;
  itemType: string;
  rarity: string;
  quantity: number;
  guaranteed: boolean;
  condition?: string;
}

export interface QuestChoiceReward {
  id: string;
  name: string;
  description: string;
  type: 'passive_skill' | 'attribute_point' | 'item' | 'unlock';
  value: any;
  exclusive: boolean;
}

export interface QuestDialogue {
  questGiver: string;
  introText: string;
  progressText: string[];
  completionText: string;
  failureText?: string;
  contextualResponses: Record<string, string>;
}

export interface GeneratedQuest {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  category: 'main' | 'side' | 'personal' | 'guild' | 'dynamic';
  objectives: QuestObjective[];
  rewards: QuestRewards;
  dialogue: QuestDialogue;
  prerequisites: string[];
  followupQuests: string[];
  loreConnections: string[];
  timeLimit?: number;
  level: number;
  difficulty: 'trivial' | 'easy' | 'normal' | 'hard' | 'extreme';
  estimatedDuration: number;
  tags: string[];
  metadata: QuestMetadata;
}

export interface QuestMetadata {
  generatedAt: number;
  generationType: 'triggered' | 'requested' | 'background';
  sourceEvent: string;
  playerContext: Record<string, any>;
  worldContext: Record<string, any>;
  balanceData: QuestBalanceData;
  qualityMetrics: QuestQualityMetrics;
}

export interface QuestBalanceData {
  experienceRatio: number;
  difficultyScore: number;
  lengthScore: number;
  rewardBalance: number;
  prerequisiteChain: number;
}

export interface QuestQualityMetrics {
  narrativeDepth: number;
  loreConsistency: number;
  objectiveClarity: number;
  rewardAppropriate: number;
  playerRelevance: number;
  overall: number;
}

export interface QuestGenerationRequest {
  type: 'area_based' | 'level_up' | 'completion_chain' | 'dynamic' | 'milestone';
  parameters: Record<string, any>;
  constraints: QuestConstraints;
  priority: 'low' | 'medium' | 'high' | 'critical';
  requester: string;
}

export interface QuestConstraints {
  maxObjectives: number;
  minObjectives: number;
  allowedTypes: string[];
  forbiddenTypes: string[];
  timeConstraints: boolean;
  levelRange: { min: number; max: number };
  themeRestrictions: string[];
  loreRequirements: string[];
}

export class QuestGenerator {
  private claudeEngine: ClaudeContentEngine;
  private gameContext: GameContextManager;
  private world: IWorld;
  private questTemplates: Map<string, QuestTemplate> = new Map();
  private questValidator: QuestValidator;
  private balanceCalculator: QuestBalanceCalculator;
  private narrativeTracker: QuestNarrativeTracker;
  private generationStats: QuestGenerationStats;

  constructor(claudeEngine: ClaudeContentEngine, gameContext: GameContextManager, world: IWorld) {
    this.claudeEngine = claudeEngine;
    this.gameContext = gameContext;
    this.world = world;
    this.questValidator = new QuestValidator();
    this.balanceCalculator = new QuestBalanceCalculator();
    this.narrativeTracker = new QuestNarrativeTracker();
    this.generationStats = new QuestGenerationStats();

    this.loadQuestTemplates();
    console.log('🗡️ Quest Generator initialized - Ready for infinite quest generation');
  }

  // =============================================================================
  // MAIN QUEST GENERATION API
  // =============================================================================

  public async generateQuest(request: QuestGenerationRequest): Promise<GeneratedQuest> {
    const startTime = performance.now();
    
    try {
      console.log(`📜 Generating ${request.type} quest with priority: ${request.priority}`);

      // Build comprehensive parameters for Claude
      const enrichedParams = await this.buildQuestParameters(request);

      // Generate quest content using Claude
      const generatedContent = await this.claudeEngine.generateContent('quest', enrichedParams, {
        priority: request.priority,
        requester: `quest_generator_${request.type}`
      });

      // Parse and structure the quest
      const structuredQuest = this.parseQuestContent(generatedContent, request);

      // Validate quest quality and balance
      const validation = await this.validateQuest(structuredQuest, request);
      if (validation.overall < 0.8) {
        console.warn(`⚠️ Quest quality below threshold (${validation.overall}), improving...`);
        structuredQuest.objectives = await this.improveQuestObjectives(structuredQuest.objectives, validation);
        structuredQuest.rewards = await this.improveQuestRewards(structuredQuest.rewards, validation);
      }

      // Calculate final balance metrics
      const balanceData = this.balanceCalculator.calculateQuestBalance(structuredQuest, enrichedParams);
      structuredQuest.metadata.balanceData = balanceData;
      structuredQuest.metadata.qualityMetrics = validation;

      // Track narrative connections
      this.narrativeTracker.trackQuestGeneration(structuredQuest, enrichedParams);

      // Update generation statistics
      const generationTime = performance.now() - startTime;
      this.generationStats.recordGeneration(request.type, generationTime, true);

      console.log(`✅ Quest generated: "${structuredQuest.title}" (${generationTime.toFixed(2)}ms)`);
      return structuredQuest;

    } catch (error) {
      const generationTime = performance.now() - startTime;
      this.generationStats.recordGeneration(request.type, generationTime, false);
      
      console.error(`❌ Quest generation failed:`, error);
      
      // Fallback to template-based generation
      return this.generateFallbackQuest(request);
    }
  }

  public async generateQuestChain(
    chainType: 'linear' | 'branching' | 'episodic',
    chainLength: number,
    baseRequest: QuestGenerationRequest
  ): Promise<GeneratedQuest[]> {
    const quests: GeneratedQuest[] = [];
    
    try {
      for (let i = 0; i < chainLength; i++) {
        const chainRequest: QuestGenerationRequest = {
          ...baseRequest,
          parameters: {
            ...baseRequest.parameters,
            chainPosition: i,
            chainLength: chainLength,
            chainType: chainType,
            previousQuests: quests.map(q => ({ id: q.id, title: q.title, outcomes: q.metadata }))
          }
        };

        const quest = await this.generateQuest(chainRequest);
        
        // Connect to previous quest if not the first
        if (i > 0) {
          quests[i - 1].followupQuests.push(quest.id);
          quest.prerequisites.push(quests[i - 1].id);
        }

        quests.push(quest);
      }

      console.log(`🔗 Generated quest chain: ${chainType} with ${quests.length} quests`);
      return quests;

    } catch (error) {
      console.error(`❌ Quest chain generation failed:`, error);
      throw error;
    }
  }

  // =============================================================================
  // QUEST PARAMETER BUILDING
  // =============================================================================

  private async buildQuestParameters(request: QuestGenerationRequest): Promise<Record<string, any>> {
    // Get enriched game context
    const context = await this.gameContext.enrichParameters('quest', request.parameters);

    // Add quest-specific enrichment
    const questSpecificParams = {
      ...context,
      
      // Quest generation context
      questType: request.type,
      generationPriority: request.priority,
      constraints: request.constraints,
      
      // Narrative context
      narrativeArcs: this.narrativeTracker.getActiveArcs(),
      questHistory: this.narrativeTracker.getRecentQuests(10),
      narrativeGaps: this.narrativeTracker.identifyNarrativeGaps(),
      
      // World building context
      unvisitedAreas: this.getUnvisitedAreas(context.player),
      discoveredLore: this.getDiscoveredLore(context.player),
      unmetNPCs: this.getUnmetNPCs(context.player),
      
      // Balance context
      experienceGap: this.calculateExperienceGap(context.player),
      itemGap: this.calculateItemGap(context.player),
      skillGap: this.calculateSkillGap(context.player),
      
      // Preference context
      preferredObjectives: this.analyzePreferredObjectives(context.player),
      avoidedContent: this.analyzeAvoidedContent(context.player),
      playtimeSession: this.estimateSessionTime(context.player),
      
      // Quality requirements
      qualityExpectations: {
        narrativeDepth: context.player.preferences.narrativeInterest === 'high' ? 0.9 : 0.7,
        loreConsistency: 0.95,
        objectiveClarity: 0.9,
        rewardBalance: 0.85,
        playerRelevance: 0.8
      }
    };

    return questSpecificParams;
  }

  // =============================================================================
  // QUEST CONTENT PARSING
  // =============================================================================

  private parseQuestContent(generatedContent: GeneratedContent, request: QuestGenerationRequest): GeneratedQuest {
    const content = generatedContent.content;
    
    const quest: GeneratedQuest = {
      id: content.id || this.generateQuestId(),
      title: content.title || 'Generated Quest',
      description: content.description || 'A quest generated for your adventure.',
      shortDescription: content.shortDescription || content.description?.substring(0, 100) + '...',
      category: this.determineQuestCategory(request.type),
      objectives: this.parseObjectives(content.objectives || []),
      rewards: this.parseRewards(content.rewards || {}),
      dialogue: this.parseDialogue(content.dialogue || {}),
      prerequisites: content.prerequisites || [],
      followupQuests: content.followup_quests || [],
      loreConnections: content.lore_connections || [],
      timeLimit: content.timeLimit,
      level: content.level || request.parameters.playerLevel || 1,
      difficulty: content.difficulty || 'normal',
      estimatedDuration: content.estimatedDuration || this.estimateQuestDuration(content.objectives),
      tags: this.generateQuestTags(content, request),
      metadata: {
        generatedAt: Date.now(),
        generationType: this.mapGenerationType(request.type),
        sourceEvent: request.parameters.sourceEvent || 'unknown',
        playerContext: request.parameters.playerContext || {},
        worldContext: request.parameters.worldContext || {},
        balanceData: {} as QuestBalanceData, // Will be filled later
        qualityMetrics: {} as QuestQualityMetrics // Will be filled later
      }
    };

    return quest;
  }

  private parseObjectives(objectives: any[]): QuestObjective[] {
    return objectives.map((obj, index) => ({
      id: obj.id || `objective_${index + 1}`,
      type: obj.type || 'investigate',
      description: obj.description || 'Complete the objective',
      target: obj.target || 'unknown',
      count: obj.count || 1,
      location: obj.location || 'Unknown Location',
      optional: obj.optional || false,
      prerequisites: obj.prerequisites || [],
      metadata: obj.metadata || {}
    }));
  }

  private parseRewards(rewards: any): QuestRewards {
    return {
      experience: rewards.experience || 1000,
      currency: rewards.currency || { chaos_orb: 1 },
      items: this.parseItemRewards(rewards.items || []),
      choices: this.parseChoiceRewards(rewards.choices || []),
      unlocks: rewards.unlocks || [],
      reputation: rewards.reputation || {}
    };
  }

  private parseItemRewards(items: any[]): QuestItemReward[] {
    return items.map(item => ({
      itemId: item.itemId || item.id || `reward_item_${Date.now()}`,
      itemType: item.itemType || item.type || 'generic',
      rarity: item.rarity || 'normal',
      quantity: item.quantity || 1,
      guaranteed: item.guaranteed !== false,
      condition: item.condition
    }));
  }

  private parseChoiceRewards(choices: any[]): QuestChoiceReward[] {
    return choices.map(choice => ({
      id: choice.id || `choice_${Date.now()}`,
      name: choice.name || 'Reward Choice',
      description: choice.description || 'A reward option',
      type: choice.type || 'passive_skill',
      value: choice.value,
      exclusive: choice.exclusive !== false
    }));
  }

  private parseDialogue(dialogue: any): QuestDialogue {
    return {
      questGiver: dialogue.quest_giver || dialogue.questGiver || 'unknown',
      introText: dialogue.intro_text || dialogue.introText || 'A quest awaits you.',
      progressText: dialogue.progress_text || dialogue.progressText || ['Continue your quest.'],
      completionText: dialogue.completion_text || dialogue.completionText || 'Quest completed!',
      failureText: dialogue.failure_text || dialogue.failureText,
      contextualResponses: dialogue.contextual_responses || dialogue.contextualResponses || {}
    };
  }

  // =============================================================================
  // QUEST VALIDATION
  // =============================================================================

  private async validateQuest(quest: GeneratedQuest, request: QuestGenerationRequest): Promise<QuestQualityMetrics> {
    return this.questValidator.validateQuest(quest, request);
  }

  private async improveQuestObjectives(objectives: QuestObjective[], validation: QuestQualityMetrics): Promise<QuestObjective[]> {
    // Improve objective clarity and variety
    if (validation.objectiveClarity < 0.8) {
      for (const objective of objectives) {
        if (objective.description.length < 20) {
          objective.description = await this.expandObjectiveDescription(objective);
        }
      }
    }

    return objectives;
  }

  private async improveQuestRewards(rewards: QuestRewards, validation: QuestQualityMetrics): Promise<QuestRewards> {
    // Improve reward balance and appropriateness
    if (validation.rewardAppropriate < 0.8) {
      rewards.experience = Math.floor(rewards.experience * 1.1);
      
      if (rewards.items.length === 0 && Math.random() < 0.5) {
        rewards.items.push({
          itemId: `improved_reward_${Date.now()}`,
          itemType: 'enhancement',
          rarity: 'magic',
          quantity: 1,
          guaranteed: true
        });
      }
    }

    return rewards;
  }

  // =============================================================================
  // FALLBACK GENERATION
  // =============================================================================

  private generateFallbackQuest(request: QuestGenerationRequest): GeneratedQuest {
    console.log(`🔄 Using fallback quest generation for type: ${request.type}`);
    
    const template = this.questTemplates.get(request.type) || this.questTemplates.get('default')!;
    
    return {
      id: this.generateQuestId(),
      title: template.title.replace('{area}', request.parameters.area || 'Unknown Area'),
      description: template.description,
      shortDescription: template.description.substring(0, 100) + '...',
      category: this.determineQuestCategory(request.type),
      objectives: template.objectives.map((obj, i) => ({
        id: `fallback_obj_${i + 1}`,
        type: obj.type,
        description: obj.description,
        target: obj.target,
        count: obj.count,
        location: request.parameters.area || 'Unknown',
        optional: false,
        prerequisites: [],
        metadata: {}
      })),
      rewards: {
        experience: (request.parameters.playerLevel || 1) * 1000,
        currency: { chaos_orb: 1 },
        items: [],
        choices: [],
        unlocks: [],
        reputation: {}
      },
      dialogue: {
        questGiver: 'unknown',
        introText: 'A quest has been prepared for you.',
        progressText: ['Continue with your objective.'],
        completionText: 'Quest completed successfully!',
        contextualResponses: {}
      },
      prerequisites: [],
      followupQuests: [],
      loreConnections: [],
      level: request.parameters.playerLevel || 1,
      difficulty: 'normal',
      estimatedDuration: 15,
      tags: ['fallback', request.type],
      metadata: {
        generatedAt: Date.now(),
        generationType: 'fallback',
        sourceEvent: 'fallback_generation',
        playerContext: {},
        worldContext: {},
        balanceData: {} as QuestBalanceData,
        qualityMetrics: {
          narrativeDepth: 0.5,
          loreConsistency: 0.7,
          objectiveClarity: 0.8,
          rewardAppropriate: 0.7,
          playerRelevance: 0.6,
          overall: 0.66
        }
      }
    };
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private loadQuestTemplates(): void {
    // Load predefined quest templates for fallback generation
    this.questTemplates.set('area_based', {
      title: 'Explore {area}',
      description: 'Investigate the mysteries of this new area.',
      objectives: [
        { type: 'investigate', description: 'Search for clues', target: 'investigation_point', count: 3 }
      ]
    });

    this.questTemplates.set('level_up', {
      title: 'Growing Stronger',
      description: 'Test your newfound abilities.',
      objectives: [
        { type: 'eliminate', description: 'Defeat enemies', target: 'enemy_group', count: 5 }
      ]
    });

    this.questTemplates.set('default', {
      title: 'Adventure Awaits',
      description: 'A quest designed for your current journey.',
      objectives: [
        { type: 'investigate', description: 'Complete the objective', target: 'quest_target', count: 1 }
      ]
    });
  }

  private generateQuestId(): string {
    return `quest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private determineQuestCategory(type: string): 'main' | 'side' | 'personal' | 'guild' | 'dynamic' {
    const categoryMap: Record<string, any> = {
      area_based: 'side',
      level_up: 'personal',
      completion_chain: 'main',
      dynamic: 'dynamic',
      milestone: 'personal'
    };
    return categoryMap[type] || 'side';
  }

  private mapGenerationType(type: string): 'triggered' | 'requested' | 'background' {
    return type === 'dynamic' ? 'background' : 'triggered';
  }

  private estimateQuestDuration(objectives: any[]): number {
    // Estimate duration based on objective types and count
    let duration = 0;
    for (const obj of objectives) {
      const baseDuration = {
        investigate: 5,
        eliminate: 3,
        collect: 2,
        escort: 10,
        deliver: 7,
        survive: 8,
        craft: 4,
        discover: 6
      }[obj.type] || 5;
      
      duration += baseDuration * (obj.count || 1);
    }
    return Math.max(5, Math.min(60, duration)); // 5-60 minutes
  }

  private generateQuestTags(content: any, request: QuestGenerationRequest): string[] {
    const tags = [request.type];
    
    if (content.region) tags.push(content.region.toLowerCase().replace(/\s+/g, '_'));
    if (content.theme) tags.push(content.theme);
    if (content.difficulty) tags.push(content.difficulty);
    
    return tags;
  }

  // Stub methods for complex implementations
  private getUnvisitedAreas(player: any): string[] { return ['northern_wastes', 'deep_caverns']; }
  private getDiscoveredLore(player: any): string[] { return ['ancient_history']; }
  private getUnmetNPCs(player: any): string[] { return ['mysterious_trader']; }
  private calculateExperienceGap(player: any): number { return 0.2; }
  private calculateItemGap(player: any): number { return 0.3; }
  private calculateSkillGap(player: any): number { return 0.1; }
  private analyzePreferredObjectives(player: any): string[] { return ['combat', 'exploration']; }
  private analyzeAvoidedContent(player: any): string[] { return ['escort']; }
  private estimateSessionTime(player: any): number { return 45; }
  private async expandObjectiveDescription(objective: QuestObjective): Promise<string> {
    return objective.description + ' - Follow the clues and investigate thoroughly.';
  }

  public getGenerationStats(): any {
    return this.generationStats.getStats();
  }

  public destroy(): void {
    this.questTemplates.clear();
    console.log('💥 Quest Generator destroyed');
  }
}

// =============================================================================
// SUPPORTING CLASSES
// =============================================================================

interface QuestTemplate {
  title: string;
  description: string;
  objectives: Array<{
    type: string;
    description: string;
    target: string;
    count: number;
  }>;
}

class QuestValidator {
  async validateQuest(quest: GeneratedQuest, request: QuestGenerationRequest): Promise<QuestQualityMetrics> {
    const metrics: QuestQualityMetrics = {
      narrativeDepth: this.assessNarrativeDepth(quest),
      loreConsistency: this.assessLoreConsistency(quest),
      objectiveClarity: this.assessObjectiveClarity(quest),
      rewardAppropriate: this.assessRewardAppropriate(quest),
      playerRelevance: this.assessPlayerRelevance(quest, request),
      overall: 0
    };

    metrics.overall = (
      metrics.narrativeDepth * 0.25 +
      metrics.loreConsistency * 0.20 +
      metrics.objectiveClarity * 0.20 +
      metrics.rewardAppropriate * 0.20 +
      metrics.playerRelevance * 0.15
    );

    return metrics;
  }

  private assessNarrativeDepth(quest: GeneratedQuest): number {
    let score = 0.5;
    if (quest.description.length > 100) score += 0.2;
    if (quest.loreConnections.length > 0) score += 0.2;
    if (quest.followupQuests.length > 0) score += 0.1;
    return Math.min(1.0, score);
  }

  private assessLoreConsistency(quest: GeneratedQuest): number {
    return 0.9; // Would implement proper lore checking
  }

  private assessObjectiveClarity(quest: GeneratedQuest): number {
    let score = 0;
    for (const obj of quest.objectives) {
      if (obj.description.length > 10) score += 0.3;
      if (obj.target !== 'unknown') score += 0.2;
    }
    return Math.min(1.0, score / quest.objectives.length);
  }

  private assessRewardAppropriate(quest: GeneratedQuest): number {
    const expectedXP = quest.level * 1000;
    const actualXP = quest.rewards.experience;
    const ratio = actualXP / expectedXP;
    return ratio >= 0.8 && ratio <= 1.5 ? 0.9 : 0.6;
  }

  private assessPlayerRelevance(quest: GeneratedQuest, request: QuestGenerationRequest): number {
    return 0.8; // Would implement player preference analysis
  }
}

class QuestBalanceCalculator {
  calculateQuestBalance(quest: GeneratedQuest, params: any): QuestBalanceData {
    return {
      experienceRatio: quest.rewards.experience / (quest.level * 1000),
      difficultyScore: this.calculateDifficultyScore(quest),
      lengthScore: quest.estimatedDuration / 30, // Normalized to 30 min baseline
      rewardBalance: this.calculateRewardBalance(quest),
      prerequisiteChain: quest.prerequisites.length
    };
  }

  private calculateDifficultyScore(quest: GeneratedQuest): number {
    const difficultyValues = { trivial: 0.2, easy: 0.4, normal: 0.6, hard: 0.8, extreme: 1.0 };
    return difficultyValues[quest.difficulty] || 0.6;
  }

  private calculateRewardBalance(quest: GeneratedQuest): number {
    return 0.8; // Would implement comprehensive reward analysis
  }
}

class QuestNarrativeTracker {
  private activeArcs: any[] = [];
  private recentQuests: GeneratedQuest[] = [];

  trackQuestGeneration(quest: GeneratedQuest, params: any): void {
    this.recentQuests.unshift(quest);
    if (this.recentQuests.length > 50) {
      this.recentQuests = this.recentQuests.slice(0, 50);
    }
  }

  getActiveArcs(): any[] { return this.activeArcs; }
  getRecentQuests(count: number): GeneratedQuest[] { return this.recentQuests.slice(0, count); }
  identifyNarrativeGaps(): string[] { return ['character_development', 'world_building']; }
}

class QuestGenerationStats {
  private stats = {
    totalGenerated: 0,
    successful: 0,
    failed: 0,
    averageTime: 0,
    totalTime: 0,
    typeBreakdown: new Map<string, number>()
  };

  recordGeneration(type: string, time: number, success: boolean): void {
    this.stats.totalGenerated++;
    this.stats.totalTime += time;
    this.stats.averageTime = this.stats.totalTime / this.stats.totalGenerated;

    if (success) {
      this.stats.successful++;
    } else {
      this.stats.failed++;
    }

    this.stats.typeBreakdown.set(type, (this.stats.typeBreakdown.get(type) || 0) + 1);
  }

  getStats(): any {
    return {
      ...this.stats,
      successRate: this.stats.totalGenerated > 0 ? this.stats.successful / this.stats.totalGenerated : 0,
      typeBreakdown: Object.fromEntries(this.stats.typeBreakdown)
    };
  }
}

export function createQuestGenerator(
  claudeEngine: ClaudeContentEngine,
  gameContext: GameContextManager,
  world: IWorld
): QuestGenerator {
  return new QuestGenerator(claudeEngine, gameContext, world);
}