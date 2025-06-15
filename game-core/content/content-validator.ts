// RainStorm ARPG - Content Validation Framework
// Comprehensive validation system for all generated content types

import { GeneratedContent } from './claude-engine';
import { GeneratedQuest, QuestQualityMetrics } from './quest-generator';
import { GeneratedItem, ItemQualityMetrics } from './item-generator';
import { GeneratedDialogue, DialogueQualityMetrics } from './dialogue-generator';

export interface ValidationResult {
  valid: boolean;
  score: number;
  issues: ValidationIssue[];
  recommendations: string[];
  metrics: ValidationMetrics;
  autoFixApplied: boolean;
}

export interface ValidationIssue {
  type: 'critical' | 'warning' | 'suggestion';
  category: 'balance' | 'lore' | 'technical' | 'quality' | 'consistency';
  message: string;
  field?: string;
  suggestedFix?: string;
  autoFixable: boolean;
}

export interface ValidationMetrics {
  technical: number;
  balance: number;
  quality: number;
  consistency: number;
  lore: number;
  overall: number;
}

export interface ValidationConfig {
  strictMode: boolean;
  autoFix: boolean;
  qualityThreshold: number;
  balanceThreshold: number;
  loreThreshold: number;
  enableLoreChecking: boolean;
  enableBalanceChecking: boolean;
  enableTechnicalValidation: boolean;
}

export interface LoreDatabase {
  factions: Map<string, FactionLore>;
  locations: Map<string, LocationLore>;
  characters: Map<string, CharacterLore>;
  events: Map<string, EventLore>;
  items: Map<string, ItemLore>;
  concepts: Map<string, ConceptLore>;
}

export interface FactionLore {
  name: string;
  description: string;
  allies: string[];
  enemies: string[];
  territory: string[];
  beliefs: string[];
  history: string[];
  keyMembers: string[];
}

export interface LocationLore {
  name: string;
  type: 'city' | 'wilderness' | 'dungeon' | 'landmark';
  description: string;
  history: string;
  inhabitants: string[];
  connectedLocations: string[];
  significance: string;
  atmosphere: string;
}

export interface CharacterLore {
  name: string;
  role: string;
  background: string;
  personality: string[];
  relationships: Record<string, string>;
  location: string;
  faction?: string;
  secrets: string[];
}

export interface EventLore {
  name: string;
  timeframe: string;
  description: string;
  participants: string[];
  consequences: string[];
  locations: string[];
  significance: string;
}

export interface ItemLore {
  name: string;
  origin: string;
  significance: string;
  previousOwners: string[];
  powers: string[];
  legends: string[];
}

export interface ConceptLore {
  name: string;
  type: 'magic' | 'technology' | 'philosophy' | 'law' | 'custom';
  description: string;
  rules: string[];
  exceptions: string[];
  relatedConcepts: string[];
}

export class ContentValidator {
  private config: ValidationConfig;
  private loreDatabase: LoreDatabase;
  private questValidator: QuestContentValidator;
  private itemValidator: ItemContentValidator;
  private dialogueValidator: DialogueContentValidator;
  private balanceRules: BalanceRuleEngine;
  private loreChecker: LoreConsistencyChecker;
  private validationStats: ValidationStats;

  constructor(config?: Partial<ValidationConfig>) {
    this.config = {
      strictMode: false,
      autoFix: true,
      qualityThreshold: 0.8,
      balanceThreshold: 0.75,
      loreThreshold: 0.9,
      enableLoreChecking: true,
      enableBalanceChecking: true,
      enableTechnicalValidation: true,
      ...config
    };

    this.loreDatabase = this.initializeLoreDatabase();
    this.questValidator = new QuestContentValidator(this.config, this.loreDatabase);
    this.itemValidator = new ItemContentValidator(this.config, this.loreDatabase);
    this.dialogueValidator = new DialogueContentValidator(this.config, this.loreDatabase);
    this.balanceRules = new BalanceRuleEngine();
    this.loreChecker = new LoreConsistencyChecker(this.loreDatabase);
    this.validationStats = new ValidationStats();

    console.log('🔍 Content Validation Framework initialized - Ensuring quality content generation');
  }

  // =============================================================================
  // MAIN VALIDATION API
  // =============================================================================

  public async validateContent(
    content: GeneratedContent,
    contentType: string,
    parameters: Record<string, any>
  ): Promise<ValidationResult> {
    const startTime = performance.now();
    
    try {
      console.log(`🔍 Validating ${contentType} content: ${content.id}`);

      let result: ValidationResult;

      // Route to appropriate validator
      switch (contentType) {
        case 'quest':
          result = await this.questValidator.validate(content.content as GeneratedQuest, parameters);
          break;
        case 'item':
          result = await this.itemValidator.validate(content.content as GeneratedItem, parameters);
          break;
        case 'dialogue':
          result = await this.dialogueValidator.validate(content.content as GeneratedDialogue, parameters);
          break;
        default:
          result = await this.validateGenericContent(content, parameters);
      }

      // Apply additional validation layers
      if (this.config.enableLoreChecking) {
        const loreValidation = await this.loreChecker.validateLoreConsistency(content, contentType);
        result = this.mergeLoreValidation(result, loreValidation);
      }

      if (this.config.enableBalanceChecking) {
        const balanceValidation = await this.balanceRules.validateBalance(content, contentType, parameters);
        result = this.mergeBalanceValidation(result, balanceValidation);
      }

      // Auto-fix issues if enabled and possible
      if (this.config.autoFix && result.issues.some(issue => issue.autoFixable)) {
        result = await this.applyAutoFixes(content, result);
      }

      // Update validation statistics
      const validationTime = performance.now() - startTime;
      this.validationStats.recordValidation(contentType, validationTime, result.valid);

      console.log(`${result.valid ? '✅' : '❌'} Validation completed: ${contentType} (score: ${result.score.toFixed(2)}, ${validationTime.toFixed(2)}ms)`);
      
      return result;

    } catch (error) {
      console.error(`❌ Content validation failed for ${contentType}:`, error);
      
      // Return minimal validation result on error
      return {
        valid: false,
        score: 0,
        issues: [{
          type: 'critical',
          category: 'technical',
          message: `Validation error: ${error.message}`,
          autoFixable: false
        }],
        recommendations: ['Review content structure and retry validation'],
        metrics: {
          technical: 0,
          balance: 0,
          quality: 0,
          consistency: 0,
          lore: 0,
          overall: 0
        },
        autoFixApplied: false
      };
    }
  }

  public async validateBatch(
    contents: Array<{ content: GeneratedContent; type: string; parameters: Record<string, any> }>
  ): Promise<ValidationResult[]> {
    console.log(`🔍 Batch validating ${contents.length} content items`);
    
    const results: ValidationResult[] = [];
    
    for (const { content, type, parameters } of contents) {
      const result = await this.validateContent(content, type, parameters);
      results.push(result);
    }

    // Analyze batch consistency
    const batchConsistency = this.analyzeBatchConsistency(results);
    
    // Apply batch-level recommendations
    for (const result of results) {
      if (batchConsistency.issues.length > 0) {
        result.recommendations.push(...batchConsistency.recommendations);
      }
    }

    console.log(`✅ Batch validation completed: ${results.filter(r => r.valid).length}/${results.length} passed`);
    
    return results;
  }

  // =============================================================================
  // SPECIALIZED VALIDATION METHODS
  // =============================================================================

  private async validateGenericContent(content: GeneratedContent, parameters: any): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    const metrics: ValidationMetrics = {
      technical: 0.8,
      balance: 0.7,
      quality: 0.6,
      consistency: 0.7,
      lore: 0.8,
      overall: 0
    };

    // Basic structure validation
    if (!content.id) {
      issues.push({
        type: 'critical',
        category: 'technical',
        message: 'Content missing required ID field',
        field: 'id',
        suggestedFix: 'Generate unique ID',
        autoFixable: true
      });
      metrics.technical -= 0.3;
    }

    if (!content.type) {
      issues.push({
        type: 'critical',
        category: 'technical',
        message: 'Content missing type field',
        field: 'type',
        suggestedFix: 'Set content type',
        autoFixable: true
      });
      metrics.technical -= 0.3;
    }

    // Quality validation
    if (content.quality && content.quality.overall < this.config.qualityThreshold) {
      issues.push({
        type: 'warning',
        category: 'quality',
        message: `Content quality below threshold (${content.quality.overall})`,
        suggestedFix: 'Regenerate content with higher quality parameters',
        autoFixable: false
      });
      metrics.quality = content.quality.overall;
    }

    metrics.overall = (
      metrics.technical * 0.3 +
      metrics.balance * 0.2 +
      metrics.quality * 0.2 +
      metrics.consistency * 0.15 +
      metrics.lore * 0.15
    );

    return {
      valid: issues.filter(i => i.type === 'critical').length === 0,
      score: metrics.overall,
      issues,
      recommendations: this.generateRecommendations(issues, metrics),
      metrics,
      autoFixApplied: false
    };
  }

  // =============================================================================
  // VALIDATION MERGING
  // =============================================================================

  private mergeLoreValidation(baseResult: ValidationResult, loreValidation: any): ValidationResult {
    baseResult.issues.push(...loreValidation.issues);
    baseResult.metrics.lore = loreValidation.score;
    
    // Recalculate overall score
    baseResult.metrics.overall = this.calculateOverallScore(baseResult.metrics);
    baseResult.score = baseResult.metrics.overall;
    
    return baseResult;
  }

  private mergeBalanceValidation(baseResult: ValidationResult, balanceValidation: any): ValidationResult {
    baseResult.issues.push(...balanceValidation.issues);
    baseResult.metrics.balance = balanceValidation.score;
    
    // Recalculate overall score
    baseResult.metrics.overall = this.calculateOverallScore(baseResult.metrics);
    baseResult.score = baseResult.metrics.overall;
    
    return baseResult;
  }

  private calculateOverallScore(metrics: ValidationMetrics): number {
    return (
      metrics.technical * 0.25 +
      metrics.balance * 0.20 +
      metrics.quality * 0.20 +
      metrics.consistency * 0.20 +
      metrics.lore * 0.15
    );
  }

  // =============================================================================
  // AUTO-FIXING
  // =============================================================================

  private async applyAutoFixes(content: GeneratedContent, result: ValidationResult): Promise<ValidationResult> {
    let fixesApplied = 0;
    
    for (const issue of result.issues) {
      if (issue.autoFixable) {
        const fixed = await this.applyAutoFix(content, issue);
        if (fixed) {
          fixesApplied++;
        }
      }
    }

    if (fixesApplied > 0) {
      console.log(`🔧 Applied ${fixesApplied} auto-fixes to content ${content.id}`);
      
      // Remove fixed issues
      result.issues = result.issues.filter(issue => !issue.autoFixable);
      result.autoFixApplied = true;
      
      // Recalculate score after fixes
      if (result.issues.filter(i => i.type === 'critical').length === 0) {
        result.valid = true;
        result.score = Math.min(1.0, result.score + 0.1);
      }
    }

    return result;
  }

  private async applyAutoFix(content: GeneratedContent, issue: ValidationIssue): Promise<boolean> {
    try {
      switch (issue.field) {
        case 'id':
          if (!content.id) {
            content.id = `${content.type}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
            return true;
          }
          break;
        case 'type':
          if (!content.type) {
            content.type = 'generated_content';
            return true;
          }
          break;
        // Add more auto-fix cases as needed
      }
    } catch (error) {
      console.error(`Failed to apply auto-fix for ${issue.field}:`, error);
    }
    
    return false;
  }

  // =============================================================================
  // BATCH ANALYSIS
  // =============================================================================

  private analyzeBatchConsistency(results: ValidationResult[]): { issues: ValidationIssue[]; recommendations: string[] } {
    const issues: ValidationIssue[] = [];
    const recommendations: string[] = [];

    // Check for consistent quality across batch
    const qualityScores = results.map(r => r.score);
    const qualityVariance = this.calculateVariance(qualityScores);
    
    if (qualityVariance > 0.2) {
      issues.push({
        type: 'warning',
        category: 'consistency',
        message: 'High quality variance detected across batch',
        autoFixable: false
      });
      recommendations.push('Review generation parameters for consistency');
    }

    // Check for recurring issues
    const issueTypes = new Map<string, number>();
    for (const result of results) {
      for (const issue of result.issues) {
        const key = `${issue.category}_${issue.type}`;
        issueTypes.set(key, (issueTypes.get(key) || 0) + 1);
      }
    }

    for (const [issueKey, count] of issueTypes) {
      if (count >= results.length * 0.5) { // 50% or more have this issue
        recommendations.push(`Common issue detected: ${issueKey} - consider adjusting generation parameters`);
      }
    }

    return { issues, recommendations };
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private generateRecommendations(issues: ValidationIssue[], metrics: ValidationMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.technical < 0.7) {
      recommendations.push('Review content structure and ensure all required fields are present');
    }

    if (metrics.balance < this.config.balanceThreshold) {
      recommendations.push('Adjust content parameters for better game balance');
    }

    if (metrics.quality < this.config.qualityThreshold) {
      recommendations.push('Consider regenerating content with higher quality requirements');
    }

    if (metrics.lore < this.config.loreThreshold) {
      recommendations.push('Ensure content aligns with established game lore and world-building');
    }

    // Add issue-specific recommendations
    const criticalIssues = issues.filter(i => i.type === 'critical').length;
    if (criticalIssues > 0) {
      recommendations.push(`Address ${criticalIssues} critical issues before using content`);
    }

    return recommendations;
  }

  private initializeLoreDatabase(): LoreDatabase {
    return {
      factions: new Map(),
      locations: new Map(),
      characters: new Map(),
      events: new Map(),
      items: new Map(),
      concepts: new Map()
    };
  }

  public getValidationStats(): any {
    return this.validationStats.getStats();
  }

  public updateLoreDatabase(category: keyof LoreDatabase, key: string, data: any): void {
    this.loreDatabase[category].set(key, data);
    console.log(`📚 Updated lore database: ${category}/${key}`);
  }

  public destroy(): void {
    this.validationStats.clear();
    console.log('💥 Content Validator destroyed');
  }
}

// =============================================================================
// SPECIALIZED VALIDATORS
// =============================================================================

class QuestContentValidator {
  constructor(private config: ValidationConfig, private loreDB: LoreDatabase) {}

  async validate(quest: GeneratedQuest, parameters: any): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    const metrics: ValidationMetrics = {
      technical: 1.0,
      balance: 1.0,
      quality: 1.0,
      consistency: 1.0,
      lore: 1.0,
      overall: 0
    };

    // Technical validation
    if (!quest.title || quest.title.length < 5) {
      issues.push({
        type: 'critical',
        category: 'technical',
        message: 'Quest title too short or missing',
        field: 'title',
        autoFixable: true
      });
      metrics.technical -= 0.3;
    }

    if (!quest.objectives || quest.objectives.length === 0) {
      issues.push({
        type: 'critical',
        category: 'technical',
        message: 'Quest has no objectives',
        field: 'objectives',
        autoFixable: false
      });
      metrics.technical -= 0.5;
    }

    // Balance validation
    const expectedXP = quest.level * 1000;
    const actualXP = quest.rewards.experience;
    if (actualXP < expectedXP * 0.5 || actualXP > expectedXP * 2) {
      issues.push({
        type: 'warning',
        category: 'balance',
        message: `Quest XP reward out of balance (expected ~${expectedXP}, got ${actualXP})`,
        field: 'rewards.experience',
        autoFixable: true
      });
      metrics.balance -= 0.3;
    }

    // Quality validation
    if (quest.description.length < 50) {
      issues.push({
        type: 'suggestion',
        category: 'quality',
        message: 'Quest description could be more detailed',
        field: 'description',
        autoFixable: false
      });
      metrics.quality -= 0.2;
    }

    metrics.overall = this.calculateQuestScore(metrics);

    return {
      valid: issues.filter(i => i.type === 'critical').length === 0,
      score: metrics.overall,
      issues,
      recommendations: this.generateQuestRecommendations(quest, issues),
      metrics,
      autoFixApplied: false
    };
  }

  private calculateQuestScore(metrics: ValidationMetrics): number {
    return (metrics.technical + metrics.balance + metrics.quality + metrics.consistency + metrics.lore) / 5;
  }

  private generateQuestRecommendations(quest: GeneratedQuest, issues: ValidationIssue[]): string[] {
    const recommendations: string[] = [];
    
    if (quest.objectives.length === 1) {
      recommendations.push('Consider adding additional objectives for quest variety');
    }
    
    if (!quest.loreConnections || quest.loreConnections.length === 0) {
      recommendations.push('Add connections to existing game lore for better world integration');
    }
    
    return recommendations;
  }
}

class ItemContentValidator {
  constructor(private config: ValidationConfig, private loreDB: LoreDatabase) {}

  async validate(item: GeneratedItem, parameters: any): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    const metrics: ValidationMetrics = {
      technical: 1.0,
      balance: 1.0,
      quality: 1.0,
      consistency: 1.0,
      lore: 1.0,
      overall: 0
    };

    // Technical validation
    if (!item.name || item.name.length < 3) {
      issues.push({
        type: 'critical',
        category: 'technical',
        message: 'Item name too short or missing',
        field: 'name',
        autoFixable: true
      });
      metrics.technical -= 0.4;
    }

    if (!item.stats || Object.keys(item.stats).length === 0) {
      issues.push({
        type: 'critical',
        category: 'technical',
        message: 'Item has no stats',
        field: 'stats',
        autoFixable: false
      });
      metrics.technical -= 0.5;
    }

    // Balance validation
    const powerLevel = this.calculateItemPowerLevel(item);
    const expectedPower = item.itemLevel * 10;
    
    if (powerLevel > expectedPower * 1.5) {
      issues.push({
        type: 'warning',
        category: 'balance',
        message: 'Item may be overpowered for its level',
        autoFixable: true
      });
      metrics.balance -= 0.3;
    }

    // Quality validation
    if (item.rarity !== 'normal' && (!item.lore || item.lore.story.length < 20)) {
      issues.push({
        type: 'suggestion',
        category: 'quality',
        message: 'High rarity items should have detailed lore',
        field: 'lore',
        autoFixable: false
      });
      metrics.quality -= 0.2;
    }

    metrics.overall = this.calculateItemScore(metrics);

    return {
      valid: issues.filter(i => i.type === 'critical').length === 0,
      score: metrics.overall,
      issues,
      recommendations: this.generateItemRecommendations(item, issues),
      metrics,
      autoFixApplied: false
    };
  }

  private calculateItemPowerLevel(item: GeneratedItem): number {
    let power = 0;
    
    if (item.stats.damage) {
      const [min, max] = item.stats.damage.split('-').map(Number);
      power += (min + max) / 2;
    }
    
    if (item.stats.armor) power += item.stats.armor;
    if (item.stats.life) power += item.stats.life / 5;
    if (item.stats.mana) power += item.stats.mana / 10;
    
    return power;
  }

  private calculateItemScore(metrics: ValidationMetrics): number {
    return (metrics.technical + metrics.balance + metrics.quality + metrics.consistency + metrics.lore) / 5;
  }

  private generateItemRecommendations(item: GeneratedItem, issues: ValidationIssue[]): string[] {
    const recommendations: string[] = [];
    
    if (item.affixes.length === 0 && item.rarity !== 'normal') {
      recommendations.push('Add affixes appropriate for item rarity');
    }
    
    if (!item.visual.effects || item.visual.effects.length === 0) {
      recommendations.push('Consider adding visual effects for more appealing items');
    }
    
    return recommendations;
  }
}

class DialogueContentValidator {
  constructor(private config: ValidationConfig, private loreDB: LoreDatabase) {}

  async validate(dialogue: GeneratedDialogue, parameters: any): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    const metrics: ValidationMetrics = {
      technical: 1.0,
      balance: 1.0,
      quality: 1.0,
      consistency: 1.0,
      lore: 1.0,
      overall: 0
    };

    // Technical validation
    if (dialogue.nodes.size === 0) {
      issues.push({
        type: 'critical',
        category: 'technical',
        message: 'Dialogue has no conversation nodes',
        autoFixable: false
      });
      metrics.technical -= 0.6;
    }

    if (!dialogue.entryPoints.default) {
      issues.push({
        type: 'critical',
        category: 'technical',
        message: 'Dialogue missing default entry point',
        autoFixable: true
      });
      metrics.technical -= 0.3;
    }

    // Quality validation
    const avgResponseLength = this.calculateAverageResponseLength(dialogue);
    if (avgResponseLength < 20) {
      issues.push({
        type: 'suggestion',
        category: 'quality',
        message: 'Dialogue responses could be more detailed',
        autoFixable: false
      });
      metrics.quality -= 0.2;
    }

    // Consistency validation
    const moodVariety = this.calculateMoodVariety(dialogue);
    if (moodVariety < 2) {
      issues.push({
        type: 'suggestion',
        category: 'consistency',
        message: 'Dialogue could benefit from more emotional variety',
        autoFixable: false
      });
      metrics.consistency -= 0.1;
    }

    metrics.overall = this.calculateDialogueScore(metrics);

    return {
      valid: issues.filter(i => i.type === 'critical').length === 0,
      score: metrics.overall,
      issues,
      recommendations: this.generateDialogueRecommendations(dialogue, issues),
      metrics,
      autoFixApplied: false
    };
  }

  private calculateAverageResponseLength(dialogue: GeneratedDialogue): number {
    let totalLength = 0;
    let nodeCount = 0;
    
    for (const node of dialogue.nodes.values()) {
      totalLength += node.text.length;
      nodeCount++;
    }
    
    return nodeCount > 0 ? totalLength / nodeCount : 0;
  }

  private calculateMoodVariety(dialogue: GeneratedDialogue): number {
    const moods = new Set<string>();
    for (const node of dialogue.nodes.values()) {
      moods.add(node.metadata.mood);
    }
    return moods.size;
  }

  private calculateDialogueScore(metrics: ValidationMetrics): number {
    return (metrics.technical + metrics.balance + metrics.quality + metrics.consistency + metrics.lore) / 5;
  }

  private generateDialogueRecommendations(dialogue: GeneratedDialogue, issues: ValidationIssue[]): string[] {
    const recommendations: string[] = [];
    
    if (dialogue.services.length === 0) {
      recommendations.push('Consider adding NPC services to enhance player interaction');
    }
    
    let choiceCount = 0;
    for (const node of dialogue.nodes.values()) {
      choiceCount += node.choices.length;
    }
    
    if (choiceCount < dialogue.nodes.size) {
      recommendations.push('Add more player choices to improve dialogue interactivity');
    }
    
    return recommendations;
  }
}

// =============================================================================
// SPECIALIZED CHECKERS
// =============================================================================

class BalanceRuleEngine {
  async validateBalance(content: GeneratedContent, contentType: string, parameters: any): Promise<any> {
    const issues: ValidationIssue[] = [];
    let score = 1.0;

    // Implementation would check various balance rules
    // For now, return placeholder validation

    return {
      score,
      issues,
      recommendations: []
    };
  }
}

class LoreConsistencyChecker {
  constructor(private loreDB: LoreDatabase) {}

  async validateLoreConsistency(content: GeneratedContent, contentType: string): Promise<any> {
    const issues: ValidationIssue[] = [];
    let score = 0.9;

    // Implementation would check lore consistency
    // For now, return placeholder validation

    return {
      score,
      issues,
      recommendations: []
    };
  }
}

// =============================================================================
// STATISTICS TRACKING
// =============================================================================

class ValidationStats {
  private stats = {
    totalValidations: 0,
    passed: 0,
    failed: 0,
    averageTime: 0,
    totalTime: 0,
    contentTypeBreakdown: new Map<string, { total: number; passed: number }>(),
    issueCategories: new Map<string, number>()
  };

  recordValidation(contentType: string, time: number, passed: boolean): void {
    this.stats.totalValidations++;
    this.stats.totalTime += time;
    this.stats.averageTime = this.stats.totalTime / this.stats.totalValidations;

    if (passed) {
      this.stats.passed++;
    } else {
      this.stats.failed++;
    }

    const typeStats = this.stats.contentTypeBreakdown.get(contentType) || { total: 0, passed: 0 };
    typeStats.total++;
    if (passed) typeStats.passed++;
    this.stats.contentTypeBreakdown.set(contentType, typeStats);
  }

  getStats(): any {
    return {
      ...this.stats,
      passRate: this.stats.totalValidations > 0 ? this.stats.passed / this.stats.totalValidations : 0,
      contentTypeBreakdown: Object.fromEntries(
        Array.from(this.stats.contentTypeBreakdown.entries()).map(([type, stats]) => [
          type,
          { ...stats, passRate: stats.total > 0 ? stats.passed / stats.total : 0 }
        ])
      ),
      issueCategories: Object.fromEntries(this.stats.issueCategories)
    };
  }

  clear(): void {
    this.stats = {
      totalValidations: 0,
      passed: 0,
      failed: 0,
      averageTime: 0,
      totalTime: 0,
      contentTypeBreakdown: new Map(),
      issueCategories: new Map()
    };
  }
}

export function createContentValidator(config?: Partial<ValidationConfig>): ContentValidator {
  return new ContentValidator(config);
}