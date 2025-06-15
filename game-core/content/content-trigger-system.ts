// RainStorm ARPG - Content Trigger System
// ECS-integrated automatic content generation triggers

import { IWorld, IEntity, ISystem } from '../ecs/ecs-core';
import { ClaudeContentEngine } from './claude-engine';
import { GameContextManager } from './game-context';

export interface ContentTrigger {
  id: string;
  type: 'area_enter' | 'level_up' | 'quest_complete' | 'chest_open' | 'npc_interact' | 'boss_defeated' | 'item_acquired' | 'skill_learned' | 'milestone_reached';
  conditions: TriggerCondition[];
  contentTypes: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  cooldown: number;
  lastTriggered: number;
  enabled: boolean;
  metadata: Record<string, any>;
}

export interface TriggerCondition {
  type: 'level_range' | 'area_type' | 'quest_status' | 'item_count' | 'skill_points' | 'time_played' | 'player_state';
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
  value: any;
  target?: string;
}

export interface TriggerEvent {
  triggerType: string;
  entity: IEntity;
  data: Record<string, any>;
  timestamp: number;
  context: any;
}

export interface ContentGenerationResult {
  triggerId: string;
  contentType: string;
  generatedContent: any;
  integrationSuccess: boolean;
  generationTime: number;
  timestamp: number;
}

export class ContentTriggerSystem implements ISystem {
  public name = 'ContentTriggerSystem';
  public enabled = true;
  public entities: Set<IEntity> = new Set();
  public requiredComponents: string[] = [];

  private world: IWorld;
  private claudeEngine: ClaudeContentEngine;
  private gameContext: GameContextManager;
  private triggers: Map<string, ContentTrigger> = new Map();
  private triggerHandlers: Map<string, (event: TriggerEvent) => Promise<void>> = new Map();
  private eventQueue: TriggerEvent[] = [];
  private integrationHandlers: Map<string, (content: any, context: any) => Promise<boolean>> = new Map();
  private triggerStats: Map<string, TriggerStats> = new Map();
  private isProcessing = false;

  constructor(world: IWorld, claudeEngine: ClaudeContentEngine, gameContext: GameContextManager) {
    this.world = world;
    this.claudeEngine = claudeEngine;
    this.gameContext = gameContext;

    this.setupDefaultTriggers();
    this.setupTriggerHandlers();
    this.setupIntegrationHandlers();
    this.setupWorldEventListeners();

    console.log('🎯 Content Trigger System initialized - Ready for automatic content generation');
  }

  // =============================================================================
  // ECS SYSTEM IMPLEMENTATION
  // =============================================================================

  public canProcess(entity: IEntity): boolean {
    // This system processes all entities that can trigger content generation
    return entity.hasComponent('Player') || 
           entity.hasComponent('NPC') || 
           entity.hasComponent('Chest') || 
           entity.hasComponent('Area') ||
           entity.hasComponent('Quest');
  }

  public addEntity(entity: IEntity): void {
    this.entities.add(entity);
  }

  public removeEntity(entity: IEntity): void {
    this.entities.delete(entity);
  }

  public update(deltaTime: number): void {
    if (!this.enabled) return;

    // Process event queue
    this.processEventQueue();

    // Check for automatic triggers
    this.checkAutomaticTriggers(deltaTime);

    // Update trigger cooldowns
    this.updateTriggerCooldowns(deltaTime);
  }

  public cleanup(): void {
    this.entities.clear();
    this.eventQueue = [];
  }

  // =============================================================================
  // TRIGGER SETUP AND MANAGEMENT
  // =============================================================================

  private setupDefaultTriggers(): void {
    const defaultTriggers: ContentTrigger[] = [
      {
        id: 'area_enter_quest_generation',
        type: 'area_enter',
        conditions: [
          { type: 'level_range', operator: 'greater_than', value: 1 },
          { type: 'area_type', operator: 'not_contains', value: 'town' }
        ],
        contentTypes: ['quest', 'area_content'],
        priority: 'high',
        cooldown: 300000, // 5 minutes
        lastTriggered: 0,
        enabled: true,
        metadata: { description: 'Generate quests when entering new areas' }
      },
      {
        id: 'level_up_rewards',
        type: 'level_up',
        conditions: [
          { type: 'level_range', operator: 'greater_than', value: 1 }
        ],
        contentTypes: ['level_rewards', 'item'],
        priority: 'high',
        cooldown: 0, // No cooldown for level ups
        lastTriggered: 0,
        enabled: true,
        metadata: { description: 'Generate rewards and opportunities on level up' }
      },
      {
        id: 'chest_loot_generation',
        type: 'chest_open',
        conditions: [],
        contentTypes: ['item'],
        priority: 'medium',
        cooldown: 1000, // 1 second
        lastTriggered: 0,
        enabled: true,
        metadata: { description: 'Generate contextual loot for chests' }
      },
      {
        id: 'npc_dialogue_generation',
        type: 'npc_interact',
        conditions: [],
        contentTypes: ['dialogue'],
        priority: 'medium',
        cooldown: 30000, // 30 seconds per NPC
        lastTriggered: 0,
        enabled: true,
        metadata: { description: 'Generate dynamic dialogue for NPCs' }
      },
      {
        id: 'boss_defeated_rewards',
        type: 'boss_defeated',
        conditions: [],
        contentTypes: ['item', 'quest', 'lore'],
        priority: 'critical',
        cooldown: 0, // No cooldown for boss defeats
        lastTriggered: 0,
        enabled: true,
        metadata: { description: 'Generate special rewards and follow-up content for boss defeats' }
      },
      {
        id: 'quest_completion_followup',
        type: 'quest_complete',
        conditions: [],
        contentTypes: ['quest', 'dialogue', 'lore'],
        priority: 'medium',
        cooldown: 60000, // 1 minute
        lastTriggered: 0,
        enabled: true,
        metadata: { description: 'Generate follow-up content after quest completion' }
      },
      {
        id: 'milestone_celebration',
        type: 'milestone_reached',
        conditions: [
          { type: 'level_range', operator: 'equals', value: 0, target: 'level_mod_10' } // Every 10 levels
        ],
        contentTypes: ['quest', 'item', 'lore'],
        priority: 'high',
        cooldown: 0,
        lastTriggered: 0,
        enabled: true,
        metadata: { description: 'Generate special content for milestone achievements' }
      }
    ];

    for (const trigger of defaultTriggers) {
      this.triggers.set(trigger.id, trigger);
      this.triggerStats.set(trigger.id, {
        totalTriggers: 0,
        successfulGenerations: 0,
        failedGenerations: 0,
        averageGenerationTime: 0,
        lastTriggeredTime: 0
      });
    }

    console.log(`✅ Initialized ${defaultTriggers.length} default content triggers`);
  }

  private setupTriggerHandlers(): void {
    this.triggerHandlers.set('area_enter', this.handleAreaEnter.bind(this));
    this.triggerHandlers.set('level_up', this.handleLevelUp.bind(this));
    this.triggerHandlers.set('quest_complete', this.handleQuestComplete.bind(this));
    this.triggerHandlers.set('chest_open', this.handleChestOpen.bind(this));
    this.triggerHandlers.set('npc_interact', this.handleNPCInteract.bind(this));
    this.triggerHandlers.set('boss_defeated', this.handleBossDefeated.bind(this));
    this.triggerHandlers.set('item_acquired', this.handleItemAcquired.bind(this));
    this.triggerHandlers.set('skill_learned', this.handleSkillLearned.bind(this));
    this.triggerHandlers.set('milestone_reached', this.handleMilestoneReached.bind(this));
  }

  private setupIntegrationHandlers(): void {
    this.integrationHandlers.set('quest', this.integrateQuestContent.bind(this));
    this.integrationHandlers.set('item', this.integrateItemContent.bind(this));
    this.integrationHandlers.set('dialogue', this.integrateDialogueContent.bind(this));
    this.integrationHandlers.set('lore', this.integrateLoreContent.bind(this));
    this.integrationHandlers.set('area_content', this.integrateAreaContent.bind(this));
    this.integrationHandlers.set('level_rewards', this.integrateLevelRewards.bind(this));
  }

  private setupWorldEventListeners(): void {
    // Listen for world events that should trigger content generation
    this.world.on('areaEntered', (data: any) => {
      this.queueTriggerEvent('area_enter', data.entity, data);
    });

    this.world.on('levelUp', (data: any) => {
      this.queueTriggerEvent('level_up', data.entity, data);
    });

    this.world.on('questCompleted', (data: any) => {
      this.queueTriggerEvent('quest_complete', data.entity, data);
    });

    this.world.on('chestOpened', (data: any) => {
      this.queueTriggerEvent('chest_open', data.entity, data);
    });

    this.world.on('npcInteraction', (data: any) => {
      this.queueTriggerEvent('npc_interact', data.entity, data);
    });

    this.world.on('bossDefeated', (data: any) => {
      this.queueTriggerEvent('boss_defeated', data.entity, data);
    });
  }

  // =============================================================================
  // EVENT PROCESSING
  // =============================================================================

  private queueTriggerEvent(triggerType: string, entity: IEntity, data: Record<string, any>): void {
    const event: TriggerEvent = {
      triggerType,
      entity,
      data,
      timestamp: Date.now(),
      context: {}
    };

    this.eventQueue.push(event);
    console.log(`📋 Queued trigger event: ${triggerType} for entity ${entity.id}`);
  }

  private async processEventQueue(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) return;

    this.isProcessing = true;

    try {
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift()!;
        await this.processTriggerEvent(event);
      }
    } catch (error) {
      console.error('❌ Error processing trigger event queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processTriggerEvent(event: TriggerEvent): Promise<void> {
    // Find matching triggers
    const matchingTriggers = this.findMatchingTriggers(event);

    for (const trigger of matchingTriggers) {
      if (this.canTrigger(trigger)) {
        await this.executeTrigger(trigger, event);
      }
    }
  }

  private findMatchingTriggers(event: TriggerEvent): ContentTrigger[] {
    const matching: ContentTrigger[] = [];

    for (const trigger of this.triggers.values()) {
      if (trigger.type === event.triggerType && trigger.enabled) {
        if (this.evaluateTriggerConditions(trigger, event)) {
          matching.push(trigger);
        }
      }
    }

    return matching.sort((a, b) => this.getPriorityValue(b.priority) - this.getPriorityValue(a.priority));
  }

  private evaluateTriggerConditions(trigger: ContentTrigger, event: TriggerEvent): boolean {
    if (trigger.conditions.length === 0) return true;

    return trigger.conditions.every(condition => this.evaluateCondition(condition, event));
  }

  private evaluateCondition(condition: TriggerCondition, event: TriggerEvent): boolean {
    const entity = event.entity;
    const data = event.data;

    switch (condition.type) {
      case 'level_range':
        const level = this.getEntityLevel(entity);
        return this.compareValues(level, condition.operator, condition.value);

      case 'area_type':
        const areaType = data.area?.type || data.areaType;
        return this.compareValues(areaType, condition.operator, condition.value);

      case 'quest_status':
        const questStatus = data.questStatus || data.status;
        return this.compareValues(questStatus, condition.operator, condition.value);

      case 'item_count':
        const itemCount = this.getEntityItemCount(entity, condition.target);
        return this.compareValues(itemCount, condition.operator, condition.value);

      case 'skill_points':
        const skillPoints = this.getEntitySkillPoints(entity);
        return this.compareValues(skillPoints, condition.operator, condition.value);

      case 'time_played':
        const timePlayed = this.getEntityTimePlayed(entity);
        return this.compareValues(timePlayed, condition.operator, condition.value);

      case 'player_state':
        const playerState = this.getPlayerState(entity);
        return this.compareValues(playerState, condition.operator, condition.value);

      default:
        return true;
    }
  }

  private compareValues(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected;
      case 'greater_than':
        return actual > expected;
      case 'less_than':
        return actual < expected;
      case 'contains':
        return Array.isArray(actual) ? actual.includes(expected) : String(actual).includes(String(expected));
      case 'not_contains':
        return Array.isArray(actual) ? !actual.includes(expected) : !String(actual).includes(String(expected));
      default:
        return true;
    }
  }

  private canTrigger(trigger: ContentTrigger): boolean {
    const now = Date.now();
    return now - trigger.lastTriggered >= trigger.cooldown;
  }

  private async executeTrigger(trigger: ContentTrigger, event: TriggerEvent): Promise<void> {
    const startTime = performance.now();
    trigger.lastTriggered = Date.now();

    const stats = this.triggerStats.get(trigger.id)!;
    stats.totalTriggers++;
    stats.lastTriggeredTime = trigger.lastTriggered;

    try {
      console.log(`🎯 Executing trigger: ${trigger.id} for ${event.triggerType}`);

      // Call the appropriate handler
      const handler = this.triggerHandlers.get(trigger.type);
      if (handler) {
        await handler(event);
      }

      // Generate content for each content type
      for (const contentType of trigger.contentTypes) {
        await this.generateAndIntegrateContent(contentType, trigger, event);
      }

      const executionTime = performance.now() - startTime;
      stats.averageGenerationTime = (stats.averageGenerationTime * (stats.totalTriggers - 1) + executionTime) / stats.totalTriggers;
      stats.successfulGenerations++;

      console.log(`✅ Trigger executed successfully: ${trigger.id} (${executionTime.toFixed(2)}ms)`);

    } catch (error) {
      console.error(`❌ Trigger execution failed: ${trigger.id}`, error);
      stats.failedGenerations++;
    }
  }

  private async generateAndIntegrateContent(
    contentType: string,
    trigger: ContentTrigger,
    event: TriggerEvent
  ): Promise<void> {
    try {
      // Build parameters for content generation
      const parameters = await this.buildContentParameters(contentType, trigger, event);

      // Generate content using Claude Engine
      const generatedContent = await this.claudeEngine.generateContent(contentType, parameters, {
        priority: trigger.priority,
        requester: `trigger_${trigger.id}`
      });

      // Integrate content into the game world
      const integrationHandler = this.integrationHandlers.get(contentType);
      if (integrationHandler) {
        const success = await integrationHandler(generatedContent.content, {
          trigger,
          event,
          entity: event.entity
        });

        if (success) {
          console.log(`🔗 Integrated ${contentType} content from trigger ${trigger.id}`);
        } else {
          console.warn(`⚠️ Failed to integrate ${contentType} content from trigger ${trigger.id}`);
        }
      } else {
        console.warn(`⚠️ No integration handler for content type: ${contentType}`);
      }

    } catch (error) {
      console.error(`❌ Content generation/integration failed for ${contentType}:`, error);
    }
  }

  // =============================================================================
  // TRIGGER HANDLERS
  // =============================================================================

  private async handleAreaEnter(event: TriggerEvent): Promise<void> {
    const entity = event.entity;
    const area = event.data.area || event.data;

    console.log(`🚪 Player entered area: ${area.name || 'Unknown'}`);

    // Additional area-specific logic can be added here
    // This is called before content generation
  }

  private async handleLevelUp(event: TriggerEvent): Promise<void> {
    const entity = event.entity;
    const newLevel = event.data.newLevel || event.data.level;

    console.log(`⬆️ Player reached level: ${newLevel}`);

    // Check for milestone levels
    if (newLevel % 10 === 0) {
      this.queueTriggerEvent('milestone_reached', entity, {
        ...event.data,
        milestoneType: 'level',
        milestoneValue: newLevel
      });
    }
  }

  private async handleQuestComplete(event: TriggerEvent): Promise<void> {
    const quest = event.data.quest || event.data;
    console.log(`✅ Quest completed: ${quest.title || quest.id || 'Unknown'}`);
  }

  private async handleChestOpen(event: TriggerEvent): Promise<void> {
    const chest = event.data.chest || event.data;
    console.log(`📦 Chest opened: ${chest.type || 'unknown'} in ${chest.area || 'unknown area'}`);
  }

  private async handleNPCInteract(event: TriggerEvent): Promise<void> {
    const npc = event.data.npc || event.data;
    console.log(`💬 NPC interaction: ${npc.name || npc.id || 'Unknown'}`);
  }

  private async handleBossDefeated(event: TriggerEvent): Promise<void> {
    const boss = event.data.boss || event.data;
    console.log(`👹 Boss defeated: ${boss.name || boss.id || 'Unknown'}`);
  }

  private async handleItemAcquired(event: TriggerEvent): Promise<void> {
    const item = event.data.item || event.data;
    console.log(`📋 Item acquired: ${item.name || item.id || 'Unknown'}`);
  }

  private async handleSkillLearned(event: TriggerEvent): Promise<void> {
    const skill = event.data.skill || event.data;
    console.log(`🎓 Skill learned: ${skill.name || skill.id || 'Unknown'}`);
  }

  private async handleMilestoneReached(event: TriggerEvent): Promise<void> {
    const milestone = event.data;
    console.log(`🏆 Milestone reached: ${milestone.milestoneType} ${milestone.milestoneValue}`);
  }

  // =============================================================================
  // CONTENT INTEGRATION HANDLERS
  // =============================================================================

  private async integrateQuestContent(content: any, context: any): Promise<boolean> {
    try {
      // Add quest to the quest system
      const questSystem = this.world.getSystem('QuestSystem');
      if (questSystem && 'addGeneratedQuest' in questSystem) {
        (questSystem as any).addGeneratedQuest(content);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private async integrateItemContent(content: any, context: any): Promise<boolean> {
    try {
      // Add item to appropriate container or inventory
      const inventorySystem = this.world.getSystem('InventorySystem');
      if (inventorySystem && 'addGeneratedItem' in inventorySystem) {
        (inventorySystem as any).addGeneratedItem(content, context);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private async integrateDialogueContent(content: any, context: any): Promise<boolean> {
    try {
      // Update NPC dialogue
      const npcSystem = this.world.getSystem('NPCSystem');
      if (npcSystem && 'updateNPCDialogue' in npcSystem) {
        (npcSystem as any).updateNPCDialogue(context.event.data.npc, content);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private async integrateLoreContent(content: any, context: any): Promise<boolean> {
    try {
      // Add lore to the lore system
      const loreSystem = this.world.getSystem('LoreSystem');
      if (loreSystem && 'addGeneratedLore' in loreSystem) {
        (loreSystem as any).addGeneratedLore(content);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private async integrateAreaContent(content: any, context: any): Promise<boolean> {
    try {
      // Add area content to the current area
      const areaSystem = this.world.getSystem('AreaSystem');
      if (areaSystem && 'addAreaContent' in areaSystem) {
        (areaSystem as any).addAreaContent(content);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private async integrateLevelRewards(content: any, context: any): Promise<boolean> {
    try {
      // Apply level-up rewards
      const playerSystem = this.world.getSystem('PlayerSystem');
      if (playerSystem && 'applyLevelRewards' in playerSystem) {
        (playerSystem as any).applyLevelRewards(context.entity, content);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private async buildContentParameters(
    contentType: string,
    trigger: ContentTrigger,
    event: TriggerEvent
  ): Promise<Record<string, any>> {
    const baseParams = {
      triggerType: trigger.type,
      triggerId: trigger.id,
      entityId: event.entity.id,
      timestamp: event.timestamp,
      ...event.data
    };

    // Add entity-specific parameters
    if (event.entity.hasComponent('Player')) {
      const character = event.entity.getComponent('Character');
      baseParams.playerLevel = character?.level || 1;
      baseParams.characterClass = character?.class || 'unknown';
    }

    return baseParams;
  }

  private checkAutomaticTriggers(deltaTime: number): void {
    // Check for time-based or condition-based automatic triggers
    // This could include periodic content generation, or triggers based on game state
  }

  private updateTriggerCooldowns(deltaTime: number): void {
    // Cooldowns are handled by checking lastTriggered time
    // This method could be used for more complex cooldown logic
  }

  private getPriorityValue(priority: string): number {
    const values = { low: 1, medium: 2, high: 3, critical: 4 };
    return values[priority as keyof typeof values] || 2;
  }

  // Entity helper methods
  private getEntityLevel(entity: IEntity): number {
    const character = entity.getComponent('Character');
    return character?.level || 1;
  }

  private getEntityItemCount(entity: IEntity, itemType?: string): number {
    const inventory = entity.getComponent('Inventory');
    if (!inventory) return 0;
    
    if (itemType) {
      return inventory.items?.filter((item: any) => item.type === itemType).length || 0;
    }
    
    return inventory.items?.length || 0;
  }

  private getEntitySkillPoints(entity: IEntity): number {
    const skillTree = entity.getComponent('SkillTree');
    return skillTree?.availablePoints || 0;
  }

  private getEntityTimePlayed(entity: IEntity): number {
    const player = entity.getComponent('Player');
    return player?.timePlayed || 0;
  }

  private getPlayerState(entity: IEntity): string {
    // Return current player state (combat, exploration, idle, etc.)
    return 'exploration'; // Simplified
  }

  // =============================================================================
  // PUBLIC API
  // =============================================================================

  public addTrigger(trigger: ContentTrigger): void {
    this.triggers.set(trigger.id, trigger);
    this.triggerStats.set(trigger.id, {
      totalTriggers: 0,
      successfulGenerations: 0,
      failedGenerations: 0,
      averageGenerationTime: 0,
      lastTriggeredTime: 0
    });
    console.log(`✅ Added content trigger: ${trigger.id}`);
  }

  public removeTrigger(triggerId: string): boolean {
    const removed = this.triggers.delete(triggerId);
    this.triggerStats.delete(triggerId);
    if (removed) {
      console.log(`🗑️ Removed content trigger: ${triggerId}`);
    }
    return removed;
  }

  public enableTrigger(triggerId: string): boolean {
    const trigger = this.triggers.get(triggerId);
    if (trigger) {
      trigger.enabled = true;
      console.log(`✅ Enabled trigger: ${triggerId}`);
      return true;
    }
    return false;
  }

  public disableTrigger(triggerId: string): boolean {
    const trigger = this.triggers.get(triggerId);
    if (trigger) {
      trigger.enabled = false;
      console.log(`❌ Disabled trigger: ${triggerId}`);
      return true;
    }
    return false;
  }

  public manualTrigger(triggerType: string, entity: IEntity, data: Record<string, any> = {}): void {
    this.queueTriggerEvent(triggerType, entity, { ...data, manual: true });
    console.log(`🎯 Manual trigger queued: ${triggerType}`);
  }

  public getTriggerStats(): Array<{ id: string; stats: TriggerStats }> {
    return Array.from(this.triggerStats.entries()).map(([id, stats]) => ({ id, stats }));
  }

  public getTriggerById(triggerId: string): ContentTrigger | undefined {
    return this.triggers.get(triggerId);
  }

  public getAllTriggers(): ContentTrigger[] {
    return Array.from(this.triggers.values());
  }

  public clearEventQueue(): void {
    this.eventQueue = [];
    console.log('🧹 Trigger event queue cleared');
  }

  public destroy(): void {
    this.clearEventQueue();
    this.triggers.clear();
    this.triggerStats.clear();
    this.entities.clear();
    console.log('💥 Content Trigger System destroyed');
  }
}

// =============================================================================
// SUPPORTING INTERFACES
// =============================================================================

interface TriggerStats {
  totalTriggers: number;
  successfulGenerations: number;
  failedGenerations: number;
  averageGenerationTime: number;
  lastTriggeredTime: number;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function createContentTriggerSystem(
  world: IWorld,
  claudeEngine: ClaudeContentEngine,
  gameContext: GameContextManager
): ContentTriggerSystem {
  return new ContentTriggerSystem(world, claudeEngine, gameContext);
}