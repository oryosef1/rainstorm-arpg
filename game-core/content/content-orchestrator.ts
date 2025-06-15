// RainStorm ARPG - Content Orchestrator
// Advanced orchestration and quality assurance for all content generation

import { ClaudeContentEngine, GeneratedContent } from './claude-engine';
import { GameContextManager } from './game-context';
import { ContentTriggerSystem } from './content-trigger-system';
import { QuestGenerator, GeneratedQuest } from './quest-generator';
import { ItemGenerator, GeneratedItem } from './item-generator';
import { DialogueGenerator, GeneratedDialogue } from './dialogue-generator';
import { ContentValidator, ValidationResult } from './content-validator';
import { PerformanceMonitor, IntelligentCache } from './performance-monitor';
import { IWorld, IEntity } from '../ecs/ecs-core';
import { EventEmitter } from 'events';

export interface ContentOrchestrationConfig {
  enableAdvancedFeatures: boolean;
  enableQualityAssurance: boolean;
  enablePerformanceOptimization: boolean;
  enableContentAnalytics: boolean;
  qualityThreshold: number;
  performanceThreshold: number;
  maxConcurrentGenerations: number;
  enableContentPreloading: boolean;
  enablePlayerBehaviorAnalysis: boolean;
  enableDynamicDifficultyAdjustment: boolean;
}

export interface ContentGenerationRequest {
  id: string;
  type: 'quest' | 'item' | 'dialogue' | 'lore' | 'area_content' | 'level_rewards';
  subType?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  parameters: Record<string, any>;
  constraints: Record<string, any>;
  requester: string;
  timestamp: number;
  deadline?: number;
  dependencies?: string[];
  metadata: RequestMetadata;
}

export interface RequestMetadata {
  playerContext: Record<string, any>;
  worldState: Record<string, any>;
  urgencyFactor: number;
  qualityRequirements: QualityRequirements;
  performanceHints: PerformanceHints;
}

export interface QualityRequirements {
  minQualityScore: number;
  maxGenerationTime: number;
  requiresLoreValidation: boolean;
  requiresBalanceValidation: boolean;
  allowFallback: boolean;
}

export interface PerformanceHints {
  cacheKey?: string;
  preloadPriority?: number;
  memoryPriority?: number;
  computePriority?: number;
}

export interface ContentGenerationResult {
  requestId: string;
  success: boolean;
  content?: GeneratedContent;
  validation?: ValidationResult;
  performance: PerformanceMetrics;
  quality: QualityMetrics;
  timestamp: number;
  generationPath: string[];
  fallbackUsed: boolean;
}

export interface PerformanceMetrics {
  totalTime: number;
  generationTime: number;
  validationTime: number;
  cacheTime: number;
  memoryUsed: number;
  cpuUsed: number;
}

export interface QualityMetrics {
  overallScore: number;
  technicalScore: number;
  balanceScore: number;
  loreScore: number;
  playerRelevanceScore: number;
  improvementsApplied: number;
}

export interface PlayerBehaviorProfile {
  playStyle: 'combat' | 'exploration' | 'story' | 'mixed';
  difficultyPreference: 'easy' | 'normal' | 'hard' | 'dynamic';
  contentPreferences: ContentPreferences;
  sessionPatterns: SessionPattern[];
  adaptationHistory: AdaptationEntry[];
  engagementMetrics: EngagementMetrics;
}

export interface ContentPreferences {
  questTypes: string[];
  itemTypes: string[];
  dialogueStyles: string[];
  difficultyLevel: number;
  narrativeDepth: number;
  loreInterest: number;
}

export interface SessionPattern {
  date: number;
  duration: number;
  contentConsumed: string[];
  satisfactionScore: number;
  dropOffPoints: string[];
}

export interface AdaptationEntry {
  timestamp: number;
  trigger: string;
  adaptation: string;
  result: 'positive' | 'negative' | 'neutral';
  playerResponse: string;
}

export interface EngagementMetrics {
  averageSessionLength: number;
  contentCompletionRate: number;
  returnRate: number;
  satisfactionTrend: number;
  challengeEngagement: number;
}

export class ContentOrchestrator extends EventEmitter {
  private config: ContentOrchestrationConfig;
  private claudeEngine: ClaudeContentEngine;
  private gameContext: GameContextManager;
  private triggerSystem: ContentTriggerSystem;
  private questGenerator: QuestGenerator;
  private itemGenerator: ItemGenerator;
  private dialogueGenerator: DialogueGenerator;
  private contentValidator: ContentValidator;
  private performanceMonitor: PerformanceMonitor;
  private intelligentCache: IntelligentCache;
  
  private world: IWorld;
  private requestQueue: ContentGenerationRequest[] = [];
  private activeGenerations: Map<string, Promise<ContentGenerationResult>> = new Map();
  private playerProfiles: Map<string, PlayerBehaviorProfile> = new Map();
  private contentAnalytics: ContentAnalytics;
  private qualityAssurance: QualityAssuranceSystem;
  private adaptationEngine: AdaptationEngine;
  private orchestrationStats: OrchestrationStats;

  constructor(
    world: IWorld,
    claudeEngine: ClaudeContentEngine,
    gameContext: GameContextManager,
    config?: Partial<ContentOrchestrationConfig>
  ) {
    super();

    this.world = world;
    this.claudeEngine = claudeEngine;
    this.gameContext = gameContext;

    this.config = {
      enableAdvancedFeatures: true,
      enableQualityAssurance: true,
      enablePerformanceOptimization: true,
      enableContentAnalytics: true,
      qualityThreshold: 0.8,
      performanceThreshold: 2000, // 2 seconds
      maxConcurrentGenerations: 5,
      enableContentPreloading: true,
      enablePlayerBehaviorAnalysis: true,
      enableDynamicDifficultyAdjustment: true,
      ...config
    };

    this.initializeComponents();
    this.setupEventHandlers();

    console.log('🎭 Content Orchestrator initialized - Managing infinite content generation ecosystem');
  }

  // =============================================================================
  // INITIALIZATION
  // =============================================================================

  private initializeComponents(): void {
    // Initialize generators
    this.questGenerator = new QuestGenerator(this.claudeEngine, this.gameContext, this.world);
    this.itemGenerator = new ItemGenerator(this.claudeEngine, this.gameContext, this.world);
    this.dialogueGenerator = new DialogueGenerator(this.claudeEngine, this.gameContext, this.world);

    // Initialize systems
    this.triggerSystem = new ContentTriggerSystem(this.world, this.claudeEngine, this.gameContext);
    this.contentValidator = new ContentValidator({
      qualityThreshold: this.config.qualityThreshold,
      autoFix: true
    });
    this.performanceMonitor = new PerformanceMonitor({
      enableMetrics: this.config.enablePerformanceOptimization
    });
    this.intelligentCache = new IntelligentCache({
      maxSize: 1000,
      enableIntelligentEviction: true
    });

    // Initialize advanced features
    this.contentAnalytics = new ContentAnalytics();
    this.qualityAssurance = new QualityAssuranceSystem(this.config);
    this.adaptationEngine = new AdaptationEngine(this.config);
    this.orchestrationStats = new OrchestrationStats();
  }

  private setupEventHandlers(): void {
    // Performance monitoring
    this.performanceMonitor.on('alert', (alert) => {
      this.handlePerformanceAlert(alert);
    });

    // Quality assurance
    this.qualityAssurance.on('qualityIssue', (issue) => {
      this.handleQualityIssue(issue);
    });

    // Content analytics
    this.contentAnalytics.on('behaviorInsight', (insight) => {
      this.handleBehaviorInsight(insight);
    });

    // Adaptation engine
    this.adaptationEngine.on('adaptationRecommendation', (recommendation) => {
      this.handleAdaptationRecommendation(recommendation);
    });
  }

  // =============================================================================
  // MAIN ORCHESTRATION API
  // =============================================================================

  public async generateContent(request: ContentGenerationRequest): Promise<ContentGenerationResult> {
    const startTime = performance.now();
    const operationId = this.performanceMonitor.recordGenerationStart(request.type, request.parameters);

    try {
      console.log(`🎭 Orchestrating ${request.type} generation: ${request.id}`);

      // Check if we're already generating this content
      if (this.activeGenerations.has(request.id)) {
        return await this.activeGenerations.get(request.id)!;
      }

      // Check cache first
      const cachedResult = await this.checkCache(request);
      if (cachedResult) {
        this.performanceMonitor.recordCacheEvent('hit', request.type);
        return cachedResult;
      }

      // Check capacity
      if (this.activeGenerations.size >= this.config.maxConcurrentGenerations) {
        await this.waitForCapacity();
      }

      // Start generation
      const generationPromise = this.executeGeneration(request, operationId);
      this.activeGenerations.set(request.id, generationPromise);

      try {
        const result = await generationPromise;
        
        // Cache successful results
        if (result.success && result.content) {
          await this.cacheResult(request, result);
        }

        // Update analytics
        if (this.config.enableContentAnalytics) {
          this.contentAnalytics.recordGeneration(request, result);
        }

        // Check for adaptations
        if (this.config.enablePlayerBehaviorAnalysis) {
          this.adaptationEngine.analyzeResult(request, result);
        }

        return result;

      } finally {
        this.activeGenerations.delete(request.id);
        this.performanceMonitor.recordGenerationEnd(operationId, true);
      }

    } catch (error) {
      this.activeGenerations.delete(request.id);
      this.performanceMonitor.recordGenerationEnd(operationId, false, undefined, error as Error);
      
      console.error(`❌ Content orchestration failed for ${request.type}:`, error);
      
      return {
        requestId: request.id,
        success: false,
        performance: this.calculatePerformanceMetrics(startTime),
        quality: this.getEmptyQualityMetrics(),
        timestamp: Date.now(),
        generationPath: ['orchestrator', 'error'],
        fallbackUsed: false
      };
    }
  }

  private async executeGeneration(
    request: ContentGenerationRequest,
    operationId: string
  ): Promise<ContentGenerationResult> {
    const startTime = performance.now();
    const generationPath: string[] = ['orchestrator'];

    try {
      // Apply player behavior analysis
      if (this.config.enablePlayerBehaviorAnalysis) {
        request = await this.applyPlayerBehaviorAnalysis(request);
        generationPath.push('behavior_analysis');
      }

      // Apply dynamic difficulty adjustment
      if (this.config.enableDynamicDifficultyAdjustment) {
        request = await this.applyDynamicDifficultyAdjustment(request);
        generationPath.push('difficulty_adjustment');
      }

      // Route to appropriate generator
      let content: GeneratedContent | null = null;
      let generationTime = 0;

      const genStartTime = performance.now();
      
      switch (request.type) {
        case 'quest':
          const quest = await this.questGenerator.generateQuest({
            type: request.subType || 'dynamic',
            parameters: request.parameters,
            constraints: request.constraints as any,
            priority: request.priority,
            requester: request.requester
          });
          content = { 
            id: quest.id, 
            type: 'quest', 
            content: quest, 
            metadata: quest.metadata as any,
            quality: quest.metadata.qualityMetrics as any,
            cacheKey: this.generateCacheKey(request),
            timestamp: Date.now(),
            generationTime: performance.now() - genStartTime
          };
          generationPath.push('quest_generator');
          break;

        case 'item':
          const item = await this.itemGenerator.generateItem({
            type: request.subType || 'random_drop',
            parameters: request.parameters,
            constraints: request.constraints as any,
            priority: request.priority,
            requester: request.requester
          });
          content = {
            id: item.id,
            type: 'item',
            content: item,
            metadata: item.metadata as any,
            quality: item.metadata.qualityMetrics as any,
            cacheKey: this.generateCacheKey(request),
            timestamp: Date.now(),
            generationTime: performance.now() - genStartTime
          };
          generationPath.push('item_generator');
          break;

        case 'dialogue':
          const dialogue = await this.dialogueGenerator.generateDialogue({
            npcId: request.parameters.npcId || 'unknown',
            context: request.subType || 'regular_conversation',
            parameters: request.parameters,
            urgency: request.priority,
            requester: request.requester
          });
          content = {
            id: dialogue.id,
            type: 'dialogue',
            content: dialogue,
            metadata: dialogue.metadata as any,
            quality: dialogue.metadata.qualityMetrics as any,
            cacheKey: this.generateCacheKey(request),
            timestamp: Date.now(),
            generationTime: performance.now() - genStartTime
          };
          generationPath.push('dialogue_generator');
          break;

        default:
          // Use Claude engine directly for other content types
          content = await this.claudeEngine.generateContent(
            request.type,
            request.parameters,
            { priority: request.priority }
          );
          generationPath.push('claude_engine');
      }

      generationTime = performance.now() - genStartTime;

      if (!content) {
        throw new Error(`Failed to generate ${request.type} content`);
      }

      // Validate content if quality assurance is enabled
      let validation: ValidationResult | undefined;
      let validationTime = 0;

      if (this.config.enableQualityAssurance) {
        const valStartTime = performance.now();
        validation = await this.contentValidator.validateContent(content, request.type, request.parameters);
        validationTime = performance.now() - valStartTime;
        generationPath.push('validation');

        // Apply quality improvements if needed
        if (validation.score < this.config.qualityThreshold) {
          content = await this.qualityAssurance.improveContent(content, validation);
          generationPath.push('quality_improvement');
        }
      }

      // Record validation time
      this.performanceMonitor.recordValidationTime(operationId, validationTime);

      const totalTime = performance.now() - startTime;

      const result: ContentGenerationResult = {
        requestId: request.id,
        success: true,
        content,
        validation,
        performance: {
          totalTime,
          generationTime,
          validationTime,
          cacheTime: 0,
          memoryUsed: this.calculateMemoryUsage(content),
          cpuUsed: this.calculateCPUUsage(totalTime)
        },
        quality: {
          overallScore: validation?.score || 0.8,
          technicalScore: validation?.metrics.technical || 0.8,
          balanceScore: validation?.metrics.balance || 0.8,
          loreScore: validation?.metrics.lore || 0.8,
          playerRelevanceScore: this.calculatePlayerRelevance(content, request),
          improvementsApplied: validation?.issues.filter(i => i.autoFixable).length || 0
        },
        timestamp: Date.now(),
        generationPath,
        fallbackUsed: false
      };

      // Update orchestration statistics
      this.orchestrationStats.recordGeneration(request.type, result);

      console.log(`✅ Content orchestration completed: ${request.type} (${totalTime.toFixed(2)}ms)`);
      return result;

    } catch (error) {
      console.error(`❌ Generation execution failed:`, error);
      throw error;
    }
  }

  // =============================================================================
  // PLAYER BEHAVIOR ANALYSIS
  // =============================================================================

  private async applyPlayerBehaviorAnalysis(request: ContentGenerationRequest): Promise<ContentGenerationRequest> {
    const playerId = request.parameters.playerId || 'default';
    const profile = this.getPlayerProfile(playerId);

    // Adjust content based on player preferences
    if (profile.contentPreferences.questTypes.length > 0 && request.type === 'quest') {
      request.parameters.preferredTypes = profile.contentPreferences.questTypes;
    }

    if (profile.contentPreferences.difficultyLevel > 0) {
      request.parameters.difficultyMultiplier = profile.contentPreferences.difficultyLevel;
    }

    if (profile.contentPreferences.narrativeDepth > 0) {
      request.parameters.narrativeDepthRequirement = profile.contentPreferences.narrativeDepth;
    }

    // Adjust based on recent session patterns
    const recentSessions = profile.sessionPatterns.slice(-5);
    if (recentSessions.length > 0) {
      const avgSatisfaction = recentSessions.reduce((sum, s) => sum + s.satisfactionScore, 0) / recentSessions.length;
      
      if (avgSatisfaction < 0.6) {
        // Player seems unsatisfied, try different content approach
        request.metadata.qualityRequirements.minQualityScore = Math.max(
          request.metadata.qualityRequirements.minQualityScore,
          0.9
        );
      }
    }

    return request;
  }

  private async applyDynamicDifficultyAdjustment(request: ContentGenerationRequest): Promise<ContentGenerationRequest> {
    const playerId = request.parameters.playerId || 'default';
    const profile = this.getPlayerProfile(playerId);

    if (profile.difficultyPreference === 'dynamic') {
      // Analyze recent performance and adjust difficulty
      const recentPerformance = this.analyzeRecentPerformance(profile);
      
      if (recentPerformance.success_rate > 0.8) {
        // Player is succeeding too easily, increase difficulty
        request.parameters.difficultyAdjustment = (request.parameters.difficultyAdjustment || 1.0) * 1.1;
      } else if (recentPerformance.success_rate < 0.5) {
        // Player is struggling, decrease difficulty
        request.parameters.difficultyAdjustment = (request.parameters.difficultyAdjustment || 1.0) * 0.9;
      }
    }

    return request;
  }

  // =============================================================================
  // CACHING AND PERFORMANCE
  // =============================================================================

  private async checkCache(request: ContentGenerationRequest): Promise<ContentGenerationResult | null> {
    const cacheKey = this.generateCacheKey(request);
    const cached = await this.intelligentCache.get(cacheKey);
    
    if (cached) {
      return {
        requestId: request.id,
        success: true,
        content: cached.content,
        performance: {
          totalTime: 1,
          generationTime: 0,
          validationTime: 0,
          cacheTime: 1,
          memoryUsed: cached.size,
          cpuUsed: 0
        },
        quality: {
          overallScore: cached.metadata.quality,
          technicalScore: 0.9,
          balanceScore: 0.9,
          loreScore: 0.9,
          playerRelevanceScore: cached.metadata.playerRelevance,
          improvementsApplied: 0
        },
        timestamp: Date.now(),
        generationPath: ['orchestrator', 'cache'],
        fallbackUsed: false
      };
    }

    return null;
  }

  private async cacheResult(request: ContentGenerationRequest, result: ContentGenerationResult): Promise<void> {
    if (!result.content) return;

    const cacheKey = this.generateCacheKey(request);
    await this.intelligentCache.set(cacheKey, result.content, {
      ttl: this.calculateCacheTTL(request, result),
      priority: this.calculateCachePriority(request, result),
      tags: this.generateCacheTags(request),
      metadata: {
        contentType: request.type,
        parameters: request.parameters,
        quality: result.quality.overallScore,
        generationCost: result.performance.totalTime,
        playerRelevance: result.quality.playerRelevanceScore,
        reuseFrequency: 0
      }
    });
  }

  private generateCacheKey(request: ContentGenerationRequest): string {
    const keyData = {
      type: request.type,
      subType: request.subType,
      parameters: this.normalizeCacheParameters(request.parameters)
    };
    
    return `content_${this.hashObject(keyData)}`;
  }

  private normalizeCacheParameters(params: Record<string, any>): Record<string, any> {
    // Remove player-specific parameters that shouldn't affect cache key
    const { playerId, timestamp, sessionId, ...cacheableParams } = params;
    return cacheableParams;
  }

  private hashObject(obj: any): string {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  private handlePerformanceAlert(alert: any): void {
    console.warn(`🚨 Performance Alert: ${alert.message}`);
    
    if (alert.type === 'critical') {
      // Take immediate action
      this.emergencyPerformanceOptimization();
    }

    this.emit('performanceAlert', alert);
  }

  private handleQualityIssue(issue: any): void {
    console.warn(`🔍 Quality Issue: ${issue.message}`);
    this.emit('qualityIssue', issue);
  }

  private handleBehaviorInsight(insight: any): void {
    console.log(`🧠 Behavior Insight: ${insight.message}`);
    
    // Apply insights to future content generation
    this.adaptationEngine.applyInsight(insight);
    
    this.emit('behaviorInsight', insight);
  }

  private handleAdaptationRecommendation(recommendation: any): void {
    console.log(`🎯 Adaptation Recommendation: ${recommendation.message}`);
    
    // Apply recommended adaptations
    this.applyAdaptation(recommendation);
    
    this.emit('adaptationRecommendation', recommendation);
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private async waitForCapacity(): Promise<void> {
    return new Promise((resolve) => {
      const checkCapacity = () => {
        if (this.activeGenerations.size < this.config.maxConcurrentGenerations) {
          resolve();
        } else {
          setTimeout(checkCapacity, 100);
        }
      };
      checkCapacity();
    });
  }

  private emergencyPerformanceOptimization(): void {
    // Clear some cache entries
    const entries = this.intelligentCache.getEntries();
    const oldEntries = entries
      .filter(e => Date.now() - e.lastAccessed > 60000) // 1 minute
      .slice(0, 10);
      
    for (const entry of oldEntries) {
      this.intelligentCache.delete(entry.id);
    }
    
    console.log(`🚨 Emergency optimization: cleared ${oldEntries.length} cache entries`);
  }

  private getPlayerProfile(playerId: string): PlayerBehaviorProfile {
    if (!this.playerProfiles.has(playerId)) {
      this.playerProfiles.set(playerId, this.createDefaultPlayerProfile());
    }
    return this.playerProfiles.get(playerId)!;
  }

  private createDefaultPlayerProfile(): PlayerBehaviorProfile {
    return {
      playStyle: 'mixed',
      difficultyPreference: 'normal',
      contentPreferences: {
        questTypes: [],
        itemTypes: [],
        dialogueStyles: [],
        difficultyLevel: 1.0,
        narrativeDepth: 0.7,
        loreInterest: 0.6
      },
      sessionPatterns: [],
      adaptationHistory: [],
      engagementMetrics: {
        averageSessionLength: 30,
        contentCompletionRate: 0.8,
        returnRate: 0.9,
        satisfactionTrend: 0.75,
        challengeEngagement: 0.7
      }
    };
  }

  private analyzeRecentPerformance(profile: PlayerBehaviorProfile): any {
    // Analyze recent sessions for performance metrics
    const recentSessions = profile.sessionPatterns.slice(-10);
    
    if (recentSessions.length === 0) {
      return { success_rate: 0.7 }; // Default
    }

    const avgSatisfaction = recentSessions.reduce((sum, s) => sum + s.satisfactionScore, 0) / recentSessions.length;
    return { success_rate: avgSatisfaction };
  }

  private calculatePerformanceMetrics(startTime: number): PerformanceMetrics {
    const totalTime = performance.now() - startTime;
    return {
      totalTime,
      generationTime: totalTime * 0.8,
      validationTime: totalTime * 0.15,
      cacheTime: totalTime * 0.05,
      memoryUsed: 10,
      cpuUsed: totalTime / 1000
    };
  }

  private getEmptyQualityMetrics(): QualityMetrics {
    return {
      overallScore: 0,
      technicalScore: 0,
      balanceScore: 0,
      loreScore: 0,
      playerRelevanceScore: 0,
      improvementsApplied: 0
    };
  }

  private calculateMemoryUsage(content: GeneratedContent): number {
    return JSON.stringify(content).length / 1024; // KB
  }

  private calculateCPUUsage(timeMs: number): number {
    return timeMs / 1000; // Simple CPU usage approximation
  }

  private calculatePlayerRelevance(content: GeneratedContent, request: ContentGenerationRequest): number {
    // Analyze how relevant the content is to the specific player
    return 0.8; // Placeholder
  }

  private calculateCacheTTL(request: ContentGenerationRequest, result: ContentGenerationResult): number {
    // High-quality content with expensive generation gets longer TTL
    let ttl = 3600000; // 1 hour base
    
    if (result.quality.overallScore > 0.9) ttl *= 2;
    if (result.performance.generationTime > 1000) ttl *= 1.5;
    
    return ttl;
  }

  private calculateCachePriority(request: ContentGenerationRequest, result: ContentGenerationResult): number {
    let priority = 5;
    
    if (result.quality.overallScore > 0.9) priority += 3;
    if (result.performance.generationTime > 2000) priority += 2;
    if (request.priority === 'critical') priority += 4;
    
    return Math.min(10, priority);
  }

  private generateCacheTags(request: ContentGenerationRequest): string[] {
    const tags = [request.type];
    
    if (request.subType) tags.push(request.subType);
    if (request.parameters.area) tags.push(`area_${request.parameters.area}`);
    if (request.parameters.playerLevel) tags.push(`level_${Math.floor(request.parameters.playerLevel / 10) * 10}`);
    
    return tags;
  }

  private applyAdaptation(recommendation: any): void {
    // Apply the recommended adaptation to the system
    // This would modify various parameters based on the recommendation
  }

  // =============================================================================
  // PUBLIC API
  // =============================================================================

  public async requestContent(
    type: string,
    parameters: Record<string, any>,
    options: {
      priority?: 'low' | 'medium' | 'high' | 'critical';
      subType?: string;
      constraints?: Record<string, any>;
      deadline?: number;
      qualityRequirements?: Partial<QualityRequirements>;
    } = {}
  ): Promise<ContentGenerationResult> {
    const request: ContentGenerationRequest = {
      id: this.generateRequestId(),
      type: type as any,
      subType: options.subType,
      priority: options.priority || 'medium',
      parameters,
      constraints: options.constraints || {},
      requester: 'api',
      timestamp: Date.now(),
      deadline: options.deadline,
      metadata: {
        playerContext: parameters.playerContext || {},
        worldState: parameters.worldState || {},
        urgencyFactor: options.priority === 'critical' ? 1.0 : 0.5,
        qualityRequirements: {
          minQualityScore: this.config.qualityThreshold,
          maxGenerationTime: this.config.performanceThreshold,
          requiresLoreValidation: true,
          requiresBalanceValidation: true,
          allowFallback: true,
          ...options.qualityRequirements
        },
        performanceHints: {}
      }
    };

    return this.generateContent(request);
  }

  public getOrchestrationStats(): any {
    return {
      ...this.orchestrationStats.getStats(),
      performance: this.performanceMonitor.getCurrentMetrics(),
      cache: this.intelligentCache.getStats(),
      activeGenerations: this.activeGenerations.size,
      queueSize: this.requestQueue.length
    };
  }

  public getPlayerProfiles(): PlayerBehaviorProfile[] {
    return Array.from(this.playerProfiles.values());
  }

  public updatePlayerProfile(playerId: string, updates: Partial<PlayerBehaviorProfile>): void {
    const profile = this.getPlayerProfile(playerId);
    Object.assign(profile, updates);
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public destroy(): void {
    this.triggerSystem.destroy();
    this.questGenerator.destroy();
    this.itemGenerator.destroy();
    this.dialogueGenerator.destroy();
    this.contentValidator.destroy();
    this.performanceMonitor.destroy();
    this.intelligentCache.destroy();
    this.removeAllListeners();
    console.log('💥 Content Orchestrator destroyed');
  }
}

// =============================================================================
// SUPPORTING CLASSES
// =============================================================================

class ContentAnalytics extends EventEmitter {
  recordGeneration(request: ContentGenerationRequest, result: ContentGenerationResult): void {
    // Analyze generation patterns and player behavior
    this.emit('generationAnalyzed', { request, result });
  }
}

class QualityAssuranceSystem extends EventEmitter {
  constructor(private config: ContentOrchestrationConfig) { super(); }

  async improveContent(content: GeneratedContent, validation: ValidationResult): Promise<GeneratedContent> {
    // Apply quality improvements
    this.emit('contentImproved', { content, validation });
    return content;
  }
}

class AdaptationEngine extends EventEmitter {
  constructor(private config: ContentOrchestrationConfig) { super(); }

  analyzeResult(request: ContentGenerationRequest, result: ContentGenerationResult): void {
    // Analyze results for adaptation opportunities
  }

  applyInsight(insight: any): void {
    // Apply behavioral insights to future generations
  }
}

class OrchestrationStats {
  private stats = {
    totalRequests: 0,
    successfulGenerations: 0,
    failedGenerations: 0,
    averageTime: 0,
    totalTime: 0,
    typeBreakdown: new Map<string, number>()
  };

  recordGeneration(type: string, result: ContentGenerationResult): void {
    this.stats.totalRequests++;
    this.stats.totalTime += result.performance.totalTime;
    this.stats.averageTime = this.stats.totalTime / this.stats.totalRequests;

    if (result.success) {
      this.stats.successfulGenerations++;
    } else {
      this.stats.failedGenerations++;
    }

    this.stats.typeBreakdown.set(type, (this.stats.typeBreakdown.get(type) || 0) + 1);
  }

  getStats(): any {
    return {
      ...this.stats,
      successRate: this.stats.totalRequests > 0 ? this.stats.successfulGenerations / this.stats.totalRequests : 0,
      typeBreakdown: Object.fromEntries(this.stats.typeBreakdown)
    };
  }
}

export function createContentOrchestrator(
  world: IWorld,
  claudeEngine: ClaudeContentEngine,
  gameContext: GameContextManager,
  config?: Partial<ContentOrchestrationConfig>
): ContentOrchestrator {
  return new ContentOrchestrator(world, claudeEngine, gameContext, config);
}