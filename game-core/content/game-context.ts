// RainStorm ARPG - Game Context Manager
// Advanced parameter enrichment for Claude Content Engine

import { IWorld, IEntity } from '../ecs/ecs-core';

export interface PlayerProfile {
  level: number;
  characterClass: string;
  build: PlayerBuild;
  playstyle: PlaystyleAnalysis;
  progression: ProgressionMetrics;
  preferences: PlayerPreferences;
  recentActions: PlayerAction[];
  achievements: string[];
  statistics: PlayerStatistics;
}

export interface PlayerBuild {
  primaryAttribute: 'strength' | 'dexterity' | 'intelligence';
  secondaryAttribute: 'strength' | 'dexterity' | 'intelligence';
  skillPoints: SkillPointDistribution;
  passiveSkills: string[];
  equipment: EquipmentSummary;
  playstyle: 'melee' | 'ranged' | 'magic' | 'hybrid';
}

export interface PlaystyleAnalysis {
  combatPreference: 'aggressive' | 'defensive' | 'balanced';
  explorationLevel: 'thorough' | 'efficient' | 'speedrun';
  contentPreference: 'combat' | 'exploration' | 'story' | 'mixed';
  riskTolerance: 'low' | 'medium' | 'high';
  sessionLength: 'short' | 'medium' | 'long';
}

export interface ProgressionMetrics {
  currentArea: string;
  areasCompleted: string[];
  mainQuestProgress: number;
  sideQuestProgress: number;
  skillTreeProgress: number;
  timePlayedHours: number;
  deathCount: number;
  achievementProgress: number;
}

export interface PlayerPreferences {
  preferredDifficulty: 'easy' | 'normal' | 'hard' | 'extreme';
  preferredQuestTypes: string[];
  preferredItemTypes: string[];
  narrativeInterest: 'low' | 'medium' | 'high';
  loreInterest: 'low' | 'medium' | 'high';
  socialInteraction: 'minimal' | 'moderate' | 'extensive';
}

export interface WorldState {
  currentArea: AreaContext;
  globalEvents: WorldEvent[];
  regionStates: Map<string, RegionState>;
  economicState: EconomicContext;
  narrativeState: NarrativeContext;
  timeContext: TimeContext;
  weatherContext: WeatherContext;
}

export interface AreaContext {
  name: string;
  type: 'town' | 'dungeon' | 'wilderness' | 'special';
  level: number;
  difficulty: 'normal' | 'magic' | 'rare' | 'unique';
  theme: string;
  lore: AreaLore;
  availableNPCs: NPCContext[];
  pointsOfInterest: PointOfInterest[];
  dangerLevel: number;
  discoveryLevel: number;
}

export interface NarrativeContext {
  activeQuests: QuestContext[];
  completedQuests: QuestContext[];
  availableQuests: QuestContext[];
  narrativeArcs: NarrativeArc[];
  playerChoices: PlayerChoice[];
  relationshipStates: RelationshipState[];
  worldStateChanges: WorldStateChange[];
}

export interface ContentEnrichmentContext {
  player: PlayerProfile;
  world: WorldState;
  narrative: NarrativeContext;
  balance: BalanceContext;
  meta: MetaContext;
  recent: RecentContentContext;
}

export class GameContextManager {
  private world: IWorld | null = null;
  private playerTracker: PlayerProfileTracker;
  private worldStateTracker: WorldStateTracker;
  private narrativeTracker: NarrativeProgressTracker;
  private balanceAnalyzer: GameBalanceAnalyzer;
  private contentTracker: RecentContentTracker;
  private relationshipTracker: RelationshipTracker;

  constructor() {
    this.playerTracker = new PlayerProfileTracker();
    this.worldStateTracker = new WorldStateTracker();
    this.narrativeTracker = new NarrativeProgressTracker();
    this.balanceAnalyzer = new GameBalanceAnalyzer();
    this.contentTracker = new RecentContentTracker();
    this.relationshipTracker = new RelationshipTracker();

    console.log('🌍 Game Context Manager initialized - Ready to enrich content generation');
  }

  // =============================================================================
  // MAIN ENRICHMENT API
  // =============================================================================

  public async enrichParameters(contentType: string, baseParameters: Record<string, any>): Promise<Record<string, any>> {
    const startTime = performance.now();

    try {
      // Build comprehensive context
      const context = await this.buildContext();

      // Apply content-specific enrichment
      const enrichedParams = this.applyContentSpecificEnrichment(contentType, baseParameters, context);

      // Add meta-information
      const finalParams = this.addMetaContext(enrichedParams, context);

      const enrichmentTime = performance.now() - startTime;
      console.log(`🔍 Parameters enriched for ${contentType} in ${enrichmentTime.toFixed(2)}ms`);

      return finalParams;

    } catch (error) {
      console.error('❌ Failed to enrich parameters:', error);
      return baseParameters; // Return original parameters if enrichment fails
    }
  }

  // =============================================================================
  // CONTEXT BUILDING
  // =============================================================================

  private async buildContext(): Promise<ContentEnrichmentContext> {
    const [player, world, narrative, balance, recent] = await Promise.all([
      this.buildPlayerContext(),
      this.buildWorldContext(),
      this.buildNarrativeContext(),
      this.buildBalanceContext(),
      this.buildRecentContentContext()
    ]);

    return {
      player,
      world,
      narrative,
      balance,
      meta: this.buildMetaContext(),
      recent
    };
  }

  private async buildPlayerContext(): Promise<PlayerProfile> {
    return {
      level: this.playerTracker.getLevel(),
      characterClass: this.playerTracker.getCharacterClass(),
      build: this.playerTracker.analyzeBuild(),
      playstyle: this.playerTracker.analyzePlaystyle(),
      progression: this.playerTracker.getProgressionMetrics(),
      preferences: this.playerTracker.getPreferences(),
      recentActions: this.playerTracker.getRecentActions(50),
      achievements: this.playerTracker.getAchievements(),
      statistics: this.playerTracker.getStatistics()
    };
  }

  private async buildWorldContext(): Promise<WorldState> {
    return {
      currentArea: this.worldStateTracker.getCurrentArea(),
      globalEvents: this.worldStateTracker.getGlobalEvents(),
      regionStates: this.worldStateTracker.getRegionStates(),
      economicState: this.worldStateTracker.getEconomicState(),
      narrativeState: this.buildNarrativeContext(),
      timeContext: this.worldStateTracker.getTimeContext(),
      weatherContext: this.worldStateTracker.getWeatherContext()
    };
  }

  private async buildNarrativeContext(): Promise<NarrativeContext> {
    return {
      activeQuests: this.narrativeTracker.getActiveQuests(),
      completedQuests: this.narrativeTracker.getCompletedQuests(),
      availableQuests: this.narrativeTracker.getAvailableQuests(),
      narrativeArcs: this.narrativeTracker.getActiveArcs(),
      playerChoices: this.narrativeTracker.getPlayerChoices(),
      relationshipStates: this.relationshipTracker.getAllRelationships(),
      worldStateChanges: this.narrativeTracker.getWorldStateChanges()
    };
  }

  private async buildBalanceContext(): Promise<BalanceContext> {
    return this.balanceAnalyzer.analyzeCurrentBalance();
  }

  private async buildRecentContentContext(): Promise<RecentContentContext> {
    return this.contentTracker.getRecentContent();
  }

  private buildMetaContext(): MetaContext {
    return {
      timestamp: Date.now(),
      sessionTime: this.getSessionTime(),
      gameVersion: '1.0.0',
      difficulty: this.getCurrentDifficulty(),
      debugMode: this.isDebugMode()
    };
  }

  // =============================================================================
  // CONTENT-SPECIFIC ENRICHMENT
  // =============================================================================

  private applyContentSpecificEnrichment(
    contentType: string,
    baseParams: Record<string, any>,
    context: ContentEnrichmentContext
  ): Record<string, any> {
    const enrichers = {
      quest: this.enrichQuestParameters.bind(this),
      item: this.enrichItemParameters.bind(this),
      dialogue: this.enrichDialogueParameters.bind(this),
      lore: this.enrichLoreParameters.bind(this),
      area_content: this.enrichAreaContentParameters.bind(this),
      level_rewards: this.enrichLevelRewardParameters.bind(this)
    };

    const enricher = enrichers[contentType as keyof typeof enrichers];
    if (enricher) {
      return enricher(baseParams, context);
    }

    return this.enrichGenericParameters(baseParams, context);
  }

  private enrichQuestParameters(baseParams: any, context: ContentEnrichmentContext): any {
    return {
      ...baseParams,
      
      // Player Context
      playerLevel: context.player.level,
      playerClass: context.player.characterClass,
      playerBuild: context.player.build,
      recentPlayerActions: context.player.recentActions.slice(0, 10),
      playerPreferences: context.player.preferences,
      
      // World Context
      currentArea: context.world.currentArea.name,
      areaTheme: context.world.currentArea.theme,
      areaDifficulty: context.world.currentArea.difficulty,
      globalEvents: context.world.globalEvents,
      
      // Narrative Context
      activeQuests: context.narrative.activeQuests.map(q => ({ id: q.id, type: q.type })),
      completedQuests: context.narrative.completedQuests.map(q => ({ id: q.id, type: q.type })),
      narrativeArcs: context.narrative.narrativeArcs.map(arc => ({ id: arc.id, phase: arc.currentPhase })),
      playerChoices: context.narrative.playerChoices.slice(-5), // Last 5 choices
      
      // Balance Context
      questDensity: context.balance.questDensity,
      rewardBalance: context.balance.rewardBalance,
      difficultyProgression: context.balance.difficultyProgression,
      
      // Recent Content
      recentQuestTypes: context.recent.questTypes,
      recentThemes: context.recent.themes,
      recentRewards: context.recent.rewards,
      
      // Advanced Parameters
      questAppropriatenessScore: this.calculateQuestAppropriatenessScore(baseParams, context),
      narrativeWeight: this.calculateNarrativeWeight(baseParams, context),
      playerEngagementPrediction: this.predictPlayerEngagement('quest', context)
    };
  }

  private enrichItemParameters(baseParams: any, context: ContentEnrichmentContext): any {
    return {
      ...baseParams,
      
      // Player Context
      playerLevel: context.player.level,
      playerBuild: context.player.build,
      currentEquipment: context.player.build.equipment,
      recentLoot: this.getRecentLoot(context.player),
      
      // Balance Context
      itemPowerLevel: this.calculateAppropriateItemPower(context),
      rarityDistribution: context.balance.itemRarityDistribution,
      economicValue: this.calculateEconomicValue(baseParams, context),
      
      // Recent Content
      recentDrops: context.recent.itemDrops,
      dropHistory: this.getItemDropHistory(context.player),
      
      // Advanced Parameters
      buildRelevanceScore: this.calculateBuildRelevance(baseParams, context.player.build),
      upgradeNeed: this.assessUpgradeNeed(baseParams, context.player),
      marketDemand: this.calculateMarketDemand(baseParams, context)
    };
  }

  private enrichDialogueParameters(baseParams: any, context: ContentEnrichmentContext): any {
    const npcId = baseParams.npc?.id || baseParams.npcId;
    const relationship = this.relationshipTracker.getRelationship(context.player.level.toString(), npcId);

    return {
      ...baseParams,
      
      // Player Context
      playerLevel: context.player.level,
      playerReputation: this.calculatePlayerReputation(context),
      playerChoiceHistory: context.narrative.playerChoices,
      recentPlayerActions: context.player.recentActions.slice(0, 5),
      
      // Relationship Context
      relationshipLevel: relationship?.level || 0,
      relationshipType: relationship?.type || 'neutral',
      previousInteractions: relationship?.interactions || [],
      
      // Narrative Context
      activeQuests: context.narrative.activeQuests,
      worldEvents: context.world.globalEvents,
      areaContext: context.world.currentArea,
      
      // Recent Content
      recentDialogueTopics: context.recent.dialogueTopics,
      conversationHistory: this.getConversationHistory(npcId, context),
      
      // Advanced Parameters
      conversationRelevance: this.calculateConversationRelevance(baseParams, context),
      emotionalContext: this.assessEmotionalContext(baseParams, context),
      informationValue: this.calculateInformationValue(baseParams, context)
    };
  }

  private enrichLoreParameters(baseParams: any, context: ContentEnrichmentContext): any {
    return {
      ...baseParams,
      
      // World Context
      currentRegion: context.world.currentArea.name,
      historicalEvents: this.getRelevantHistoricalEvents(baseParams, context),
      culturalContext: this.getCulturalContext(baseParams, context),
      
      // Player Context
      loreInterest: context.player.preferences.loreInterest,
      discoveredLore: this.getDiscoveredLore(context.player),
      
      // Narrative Context
      narrativeRelevance: this.calculateLoreNarrativeRelevance(baseParams, context),
      
      // Recent Content
      recentLoreTopics: context.recent.loreTopics,
      
      // Advanced Parameters
      historicalAccuracy: this.calculateHistoricalAccuracy(baseParams, context),
      worldBuildingImpact: this.assessWorldBuildingImpact(baseParams, context)
    };
  }

  private enrichAreaContentParameters(baseParams: any, context: ContentEnrichmentContext): any {
    return {
      ...baseParams,
      
      // Area Context
      areaSize: context.world.currentArea.lore?.size || 'medium',
      areaHistory: context.world.currentArea.lore?.history || 'unknown',
      existingPOIs: context.world.currentArea.pointsOfInterest,
      
      // Player Context
      explorationLevel: context.player.playstyle.explorationLevel,
      discoveryPreference: this.getDiscoveryPreference(context.player),
      
      // Balance Context
      contentDensity: context.balance.areContentDensity,
      
      // Advanced Parameters
      explorationReward: this.calculateExplorationReward(baseParams, context),
      secretDensity: this.calculateSecretDensity(baseParams, context)
    };
  }

  private enrichLevelRewardParameters(baseParams: any, context: ContentEnrichmentContext): any {
    return {
      ...baseParams,
      
      // Player Context
      currentLevel: context.player.level,
      buildDirection: context.player.build,
      milestoneLevel: this.isMilestoneLevel(baseParams.newLevel),
      
      // Balance Context
      rewardBalance: context.balance.rewardBalance,
      powerProgression: context.balance.powerProgression,
      
      // Advanced Parameters
      buildSupport: this.calculateBuildSupport(baseParams, context),
      progressionGate: this.getNextProgressionGate(context)
    };
  }

  private enrichGenericParameters(baseParams: any, context: ContentEnrichmentContext): any {
    return {
      ...baseParams,
      playerLevel: context.player.level,
      worldState: context.world.currentArea.name,
      narrativePhase: this.getCurrentNarrativePhase(context),
      balanceState: context.balance.overall
    };
  }

  // =============================================================================
  // CALCULATION HELPERS
  // =============================================================================

  private calculateQuestAppropriatenessScore(params: any, context: ContentEnrichmentContext): number {
    let score = 0.5; // Base score
    
    // Level appropriateness
    if (params.playerLevel >= 1 && params.playerLevel <= 60) {
      score += 0.2;
    }
    
    // Theme consistency
    if (context.world.currentArea.theme && params.theme === context.world.currentArea.theme) {
      score += 0.2;
    }
    
    // Player preference alignment
    if (context.player.preferences.preferredQuestTypes.includes(params.questType)) {
      score += 0.1;
    }
    
    return Math.min(1.0, score);
  }

  private calculateNarrativeWeight(params: any, context: ContentEnrichmentContext): number {
    if (context.narrative.narrativeArcs.length === 0) return 0.3;
    
    const activeArcs = context.narrative.narrativeArcs.filter(arc => arc.isActive);
    return Math.min(1.0, activeArcs.length * 0.3);
  }

  private predictPlayerEngagement(contentType: string, context: ContentEnrichmentContext): number {
    let engagement = 0.5; // Base engagement
    
    // Based on playstyle
    if (contentType === 'quest' && context.player.playstyle.contentPreference === 'story') {
      engagement += 0.3;
    }
    
    // Based on session length
    if (context.player.playstyle.sessionLength === 'long') {
      engagement += 0.1;
    }
    
    // Based on recent activity
    const recentActionCount = context.player.recentActions.length;
    if (recentActionCount > 20) {
      engagement += 0.1;
    }
    
    return Math.min(1.0, engagement);
  }

  private addMetaContext(params: any, context: ContentEnrichmentContext): any {
    return {
      ...params,
      
      // Meta information for Claude
      generationContext: {
        playerEngaged: context.player.progression.timePlayedHours > 1,
        worldExplored: context.player.progression.areasCompleted.length > 3,
        narrativeInvested: context.narrative.activeQuests.length > 0,
        balancedProgression: context.balance.overall > 0.7
      },
      
      // Quality hints for Claude
      qualityExpectations: {
        loreConsistency: context.player.preferences.loreInterest === 'high' ? 0.9 : 0.7,
        narrativeDepth: context.player.preferences.narrativeInterest === 'high' ? 0.9 : 0.6,
        mechanicalBalance: 0.8,
        creativity: 0.75
      },
      
      // Context summary for Claude
      contextSummary: this.generateContextSummary(context)
    };
  }

  private generateContextSummary(context: ContentEnrichmentContext): string {
    const player = context.player;
    const world = context.world;
    const narrative = context.narrative;
    
    return `Player: Level ${player.level} ${player.characterClass} in ${world.currentArea.name}. ` +
           `Playstyle: ${player.playstyle.contentPreference}/${player.playstyle.explorationLevel}. ` +
           `Active quests: ${narrative.activeQuests.length}. ` +
           `Narrative arcs: ${narrative.narrativeArcs.length}.`;
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  public setWorld(world: IWorld): void {
    this.world = world;
    this.playerTracker.setWorld(world);
    this.worldStateTracker.setWorld(world);
  }

  public getPlayerProfile(): PlayerProfile | null {
    try {
      return this.buildPlayerContext() as any;
    } catch {
      return null;
    }
  }

  public getWorldState(): WorldState | null {
    try {
      return this.buildWorldContext() as any;
    } catch {
      return null;
    }
  }

  // Stub implementations for complex calculations
  private calculateAppropriateItemPower(context: any): number { return context.player.level * 10; }
  private calculateEconomicValue(params: any, context: any): number { return params.itemLevel * 100; }
  private getRecentLoot(player: any): any[] { return []; }
  private getItemDropHistory(player: any): any[] { return []; }
  private calculateBuildRelevance(params: any, build: any): number { return 0.8; }
  private assessUpgradeNeed(params: any, player: any): number { return 0.6; }
  private calculateMarketDemand(params: any, context: any): number { return 0.7; }
  private calculatePlayerReputation(context: any): number { return 50; }
  private getConversationHistory(npcId: string, context: any): any[] { return []; }
  private calculateConversationRelevance(params: any, context: any): number { return 0.8; }
  private assessEmotionalContext(params: any, context: any): string { return 'neutral'; }
  private calculateInformationValue(params: any, context: any): number { return 0.7; }
  private getRelevantHistoricalEvents(params: any, context: any): any[] { return []; }
  private getCulturalContext(params: any, context: any): any { return {}; }
  private getDiscoveredLore(player: any): string[] { return []; }
  private calculateLoreNarrativeRelevance(params: any, context: any): number { return 0.8; }
  private calculateHistoricalAccuracy(params: any, context: any): number { return 0.9; }
  private assessWorldBuildingImpact(params: any, context: any): number { return 0.7; }
  private getDiscoveryPreference(player: any): string { return 'balanced'; }
  private calculateExplorationReward(params: any, context: any): number { return 0.8; }
  private calculateSecretDensity(params: any, context: any): number { return 0.3; }
  private isMilestoneLevel(level: number): boolean { return level % 10 === 0; }
  private calculateBuildSupport(params: any, context: any): number { return 0.8; }
  private getNextProgressionGate(context: any): string { return 'next_area'; }
  private getCurrentNarrativePhase(context: any): string { return 'exploration'; }
  private getSessionTime(): number { return Date.now(); }
  private getCurrentDifficulty(): string { return 'normal'; }
  private isDebugMode(): boolean { return false; }

  public destroy(): void {
    this.playerTracker.destroy();
    this.worldStateTracker.destroy();
    this.narrativeTracker.destroy();
    console.log('💥 Game Context Manager destroyed');
  }
}

// =============================================================================
// SUPPORTING CLASSES (Stubs - would be fully implemented)
// =============================================================================

// These classes would have full implementations in the complete system
class PlayerProfileTracker {
  setWorld(world: IWorld): void {}
  getLevel(): number { return 25; }
  getCharacterClass(): string { return 'Marauder'; }
  analyzeBuild(): PlayerBuild { 
    return {
      primaryAttribute: 'strength',
      secondaryAttribute: 'dexterity',
      skillPoints: { strength: 30, dexterity: 20, intelligence: 10 },
      passiveSkills: ['increased_damage', 'life_leech'],
      equipment: { weapon: 'two_handed_sword', armor: 'heavy_armor' },
      playstyle: 'melee'
    };
  }
  analyzePlaystyle(): PlaystyleAnalysis {
    return {
      combatPreference: 'aggressive',
      explorationLevel: 'thorough',
      contentPreference: 'combat',
      riskTolerance: 'medium',
      sessionLength: 'medium'
    };
  }
  getProgressionMetrics(): ProgressionMetrics {
    return {
      currentArea: 'Corrupted Forest',
      areasCompleted: ['Starting Village', 'Goblin Caves'],
      mainQuestProgress: 0.4,
      sideQuestProgress: 0.6,
      skillTreeProgress: 0.3,
      timePlayedHours: 15,
      deathCount: 3,
      achievementProgress: 0.25
    };
  }
  getPreferences(): PlayerPreferences {
    return {
      preferredDifficulty: 'normal',
      preferredQuestTypes: ['combat', 'exploration'],
      preferredItemTypes: ['weapon', 'armor'],
      narrativeInterest: 'medium',
      loreInterest: 'low',
      socialInteraction: 'moderate'
    };
  }
  getRecentActions(count: number): PlayerAction[] { return []; }
  getAchievements(): string[] { return ['first_kill', 'area_explorer']; }
  getStatistics(): PlayerStatistics { return {} as any; }
  destroy(): void {}
}

class WorldStateTracker {
  setWorld(world: IWorld): void {}
  getCurrentArea(): AreaContext {
    return {
      name: 'Corrupted Forest',
      type: 'wilderness',
      level: 25,
      difficulty: 'normal',
      theme: 'dark_forest',
      lore: { history: 'ancient_corruption', significance: 'high' },
      availableNPCs: [],
      pointsOfInterest: [],
      dangerLevel: 6,
      discoveryLevel: 0.4
    };
  }
  getGlobalEvents(): WorldEvent[] { return []; }
  getRegionStates(): Map<string, RegionState> { return new Map(); }
  getEconomicState(): EconomicContext { return {} as any; }
  getTimeContext(): TimeContext { return {} as any; }
  getWeatherContext(): WeatherContext { return {} as any; }
  destroy(): void {}
}

class NarrativeProgressTracker {
  getActiveQuests(): QuestContext[] { return []; }
  getCompletedQuests(): QuestContext[] { return []; }
  getAvailableQuests(): QuestContext[] { return []; }
  getActiveArcs(): NarrativeArc[] { return []; }
  getPlayerChoices(): PlayerChoice[] { return []; }
  getWorldStateChanges(): WorldStateChange[] { return []; }
  destroy(): void {}
}

class GameBalanceAnalyzer {
  analyzeCurrentBalance(): BalanceContext {
    return {
      overall: 0.8,
      questDensity: 0.7,
      rewardBalance: 0.8,
      difficultyProgression: 0.9,
      itemRarityDistribution: { normal: 0.6, magic: 0.25, rare: 0.12, unique: 0.03 },
      areContentDensity: 0.75,
      powerProgression: 0.85
    };
  }
}

class RecentContentTracker {
  getRecentContent(): RecentContentContext {
    return {
      questTypes: ['combat', 'exploration'],
      themes: ['corruption', 'nature'],
      rewards: ['experience', 'items'],
      itemDrops: ['sword', 'armor'],
      dialogueTopics: ['corruption_source', 'village_help'],
      loreTopics: ['ancient_druids', 'forest_spirits']
    };
  }
}

class RelationshipTracker {
  getRelationship(playerId: string, npcId: string): any {
    return { level: 50, type: 'friendly', interactions: [] };
  }
  getAllRelationships(): RelationshipState[] { return []; }
}

// Type definitions (would be in separate files)
interface PlayerAction { action: string; timestamp: number; data: any; }
interface PlayerStatistics { [key: string]: any; }
interface SkillPointDistribution { strength: number; dexterity: number; intelligence: number; }
interface EquipmentSummary { [slot: string]: string; }
interface WorldEvent { id: string; type: string; active: boolean; }
interface RegionState { name: string; state: string; }
interface EconomicContext { [key: string]: any; }
interface TimeContext { [key: string]: any; }
interface WeatherContext { [key: string]: any; }
interface AreaLore { history: string; significance: string; size?: string; }
interface NPCContext { id: string; name: string; role: string; }
interface PointOfInterest { id: string; name: string; type: string; }
interface QuestContext { id: string; type: string; phase: string; }
interface NarrativeArc { id: string; currentPhase: string; isActive: boolean; }
interface PlayerChoice { id: string; choice: string; outcome: string; }
interface RelationshipState { playerId: string; npcId: string; level: number; }
interface WorldStateChange { id: string; change: string; impact: string; }
interface BalanceContext { 
  overall: number; 
  questDensity: number; 
  rewardBalance: number; 
  difficultyProgression: number;
  itemRarityDistribution: { [key: string]: number };
  areContentDensity: number;
  powerProgression: number;
}
interface MetaContext { 
  timestamp: number; 
  sessionTime: number; 
  gameVersion: string; 
  difficulty: string; 
  debugMode: boolean; 
}
interface RecentContentContext {
  questTypes: string[];
  themes: string[];
  rewards: string[];
  itemDrops: string[];
  dialogueTopics: string[];
  loreTopics: string[];
}

export function createGameContextManager(): GameContextManager {
  return new GameContextManager();
}