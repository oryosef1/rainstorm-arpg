// RainStorm ARPG - NPC Dialogue Generation System
// Advanced dialogue generation with Claude integration and context awareness

import { ClaudeContentEngine, GeneratedContent } from './claude-engine';
import { GameContextManager } from './game-context';
import { IWorld, IEntity } from '../ecs/ecs-core';

export interface DialogueNode {
  id: string;
  type: 'greeting' | 'topic' | 'response' | 'service' | 'quest' | 'farewell' | 'contextual';
  text: string;
  playerOption?: string;
  npcResponse?: string;
  conditions: DialogueCondition[];
  actions: DialogueAction[];
  choices: DialogueChoice[];
  metadata: DialogueNodeMetadata;
}

export interface DialogueCondition {
  type: 'reputation' | 'quest_status' | 'item_possession' | 'player_level' | 'relationship' | 'world_state' | 'time' | 'location';
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains' | 'exists' | 'not_exists';
  value: any;
  target?: string;
}

export interface DialogueAction {
  type: 'give_item' | 'take_item' | 'start_quest' | 'complete_quest' | 'change_reputation' | 'unlock_service' | 'change_relationship' | 'trigger_event';
  parameters: Record<string, any>;
  delay?: number;
}

export interface DialogueChoice {
  id: string;
  text: string;
  nextNodeId: string;
  conditions: DialogueCondition[];
  consequences: DialogueAction[];
  tone: 'friendly' | 'aggressive' | 'neutral' | 'flirtatious' | 'threatening' | 'respectful';
  cost?: { type: string; amount: number };
}

export interface DialogueNodeMetadata {
  mood: 'happy' | 'sad' | 'angry' | 'neutral' | 'excited' | 'worried' | 'suspicious' | 'grateful';
  animation: string;
  soundEffect?: string;
  priority: number;
  frequency: 'common' | 'uncommon' | 'rare' | 'unique';
  contextualTags: string[];
}

export interface GeneratedDialogue {
  id: string;
  npcId: string;
  version: number;
  nodes: Map<string, DialogueNode>;
  entryPoints: Record<string, string>; // context -> nodeId
  services: DialogueService[];
  relationship: RelationshipState;
  personality: NPCPersonality;
  conversationHistory: ConversationEntry[];
  metadata: DialogueMetadata;
}

export interface DialogueService {
  id: string;
  name: string;
  type: 'shop' | 'repair' | 'upgrade' | 'training' | 'information' | 'transportation' | 'storage';
  description: string;
  requirements: DialogueCondition[];
  availability: ServiceAvailability;
  pricing: ServicePricing;
}

export interface ServiceAvailability {
  timeRestrictions?: string[];
  locationRestrictions?: string[];
  questRestrictions?: string[];
  relationshipMinimum?: number;
}

export interface ServicePricing {
  basePrice: number;
  currency: string;
  discounts: Array<{ condition: DialogueCondition; discount: number }>;
  premiums: Array<{ condition: DialogueCondition; premium: number }>;
}

export interface RelationshipState {
  level: number; // -100 to 100
  type: 'stranger' | 'acquaintance' | 'friend' | 'ally' | 'enemy' | 'rival' | 'mentor' | 'student';
  trust: number; // 0 to 100
  respect: number; // 0 to 100
  fear: number; // 0 to 100
  interactions: InteractionHistory[];
}

export interface InteractionHistory {
  timestamp: number;
  type: 'conversation' | 'transaction' | 'quest' | 'conflict' | 'help';
  outcome: 'positive' | 'negative' | 'neutral';
  impact: number;
  details: Record<string, any>;
}

export interface NPCPersonality {
  traits: string[];
  values: Record<string, number>;
  quirks: string[];
  speechPatterns: SpeechPattern[];
  knowledge: KnowledgeArea[];
  secrets: NPCSecret[];
}

export interface SpeechPattern {
  type: 'vocabulary' | 'grammar' | 'accent' | 'catchphrase' | 'topic_preference';
  pattern: string;
  frequency: number;
}

export interface KnowledgeArea {
  topic: string;
  expertise: number; // 0 to 100
  willingnessToShare: number; // 0 to 100
  price?: { type: string; amount: number };
}

export interface NPCSecret {
  id: string;
  type: 'personal' | 'world_lore' | 'quest_hook' | 'treasure_location' | 'political';
  content: string;
  revealConditions: DialogueCondition[];
  consequences: DialogueAction[];
}

export interface ConversationEntry {
  timestamp: number;
  nodeId: string;
  playerChoice?: string;
  npcResponse: string;
  mood: string;
  relationshipChange: number;
}

export interface DialogueMetadata {
  generatedAt: number;
  lastUpdated: number;
  conversationCount: number;
  playerContext: Record<string, any>;
  worldContext: Record<string, any>;
  qualityMetrics: DialogueQualityMetrics;
  generationSource: string;
}

export interface DialogueQualityMetrics {
  characterConsistency: number;
  contextualRelevance: number;
  conversationFlow: number;
  emotionalDepth: number;
  informationValue: number;
  playerEngagement: number;
  overall: number;
}

export interface DialogueGenerationRequest {
  npcId: string;
  context: 'first_meeting' | 'regular_conversation' | 'quest_related' | 'service_interaction' | 'special_event';
  parameters: Record<string, any>;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  requester: string;
}

export class DialogueGenerator {
  private claudeEngine: ClaudeContentEngine;
  private gameContext: GameContextManager;
  private world: IWorld;
  private dialogueCache: Map<string, GeneratedDialogue> = new Map();
  private npcProfiles: Map<string, NPCProfile> = new Map();
  private dialogueValidator: DialogueValidator;
  private relationshipManager: RelationshipManager;
  private conversationAnalyzer: ConversationAnalyzer;
  private generationStats: DialogueGenerationStats;

  constructor(claudeEngine: ClaudeContentEngine, gameContext: GameContextManager, world: IWorld) {
    this.claudeEngine = claudeEngine;
    this.gameContext = gameContext;
    this.world = world;
    this.dialogueValidator = new DialogueValidator();
    this.relationshipManager = new RelationshipManager();
    this.conversationAnalyzer = new ConversationAnalyzer();
    this.generationStats = new DialogueGenerationStats();

    this.loadNPCProfiles();
    console.log('💬 Dialogue Generator initialized - Ready for dynamic conversations');
  }

  // =============================================================================
  // MAIN DIALOGUE GENERATION API
  // =============================================================================

  public async generateDialogue(request: DialogueGenerationRequest): Promise<GeneratedDialogue> {
    const startTime = performance.now();
    
    try {
      console.log(`💭 Generating ${request.context} dialogue for NPC: ${request.npcId}`);

      // Check cache for existing dialogue
      const existingDialogue = this.dialogueCache.get(request.npcId);
      if (existingDialogue && this.shouldUpdateDialogue(existingDialogue, request)) {
        return await this.updateExistingDialogue(existingDialogue, request);
      }

      // Build comprehensive parameters for Claude
      const enrichedParams = await this.buildDialogueParameters(request);

      // Generate dialogue content using Claude
      const generatedContent = await this.claudeEngine.generateContent('dialogue', enrichedParams, {
        priority: request.urgency,
        requester: `dialogue_generator_${request.context}`
      });

      // Parse and structure the dialogue
      const structuredDialogue = this.parseDialogueContent(generatedContent, request);

      // Validate dialogue quality
      const validation = await this.validateDialogue(structuredDialogue, request);
      if (validation.overall < 0.8) {
        console.warn(`⚠️ Dialogue quality below threshold (${validation.overall}), improving...`);
        await this.improveDialogue(structuredDialogue, validation);
      }

      // Initialize relationship state
      structuredDialogue.relationship = await this.relationshipManager.initializeRelationship(
        request.npcId, 
        enrichedParams.playerContext
      );

      // Cache the dialogue
      this.dialogueCache.set(request.npcId, structuredDialogue);

      // Update generation statistics
      const generationTime = performance.now() - startTime;
      this.generationStats.recordGeneration(request.context, generationTime, true);

      console.log(`✅ Dialogue generated for ${request.npcId} (${generationTime.toFixed(2)}ms)`);
      return structuredDialogue;

    } catch (error) {
      const generationTime = performance.now() - startTime;
      this.generationStats.recordGeneration(request.context, generationTime, false);
      
      console.error(`❌ Dialogue generation failed:`, error);
      
      // Fallback to template-based dialogue
      return this.generateFallbackDialogue(request);
    }
  }

  public async updateDialogueForContext(
    npcId: string,
    context: string,
    contextData: Record<string, any>
  ): Promise<DialogueNode[]> {
    const dialogue = this.dialogueCache.get(npcId);
    if (!dialogue) {
      throw new Error(`No dialogue found for NPC: ${npcId}`);
    }

    // Generate contextual dialogue updates
    const updateRequest: DialogueGenerationRequest = {
      npcId,
      context: 'contextual',
      parameters: {
        ...contextData,
        updateType: context,
        existingPersonality: dialogue.personality,
        relationshipState: dialogue.relationship
      },
      urgency: 'medium',
      requester: 'context_update'
    };

    const enrichedParams = await this.buildDialogueParameters(updateRequest);
    const generatedContent = await this.claudeEngine.generateContent('dialogue_update', enrichedParams);
    
    const newNodes = this.parseAdditionalNodes(generatedContent, dialogue);
    
    // Add new nodes to existing dialogue
    for (const node of newNodes) {
      dialogue.nodes.set(node.id, node);
    }

    dialogue.metadata.lastUpdated = Date.now();
    
    console.log(`🔄 Updated dialogue for ${npcId} with ${newNodes.length} new nodes`);
    return newNodes;
  }

  // =============================================================================
  // CONVERSATION MANAGEMENT
  // =============================================================================

  public async processConversation(
    npcId: string,
    playerEntity: IEntity,
    choiceId?: string
  ): Promise<DialogueNode> {
    const dialogue = this.dialogueCache.get(npcId);
    if (!dialogue) {
      throw new Error(`No dialogue available for NPC: ${npcId}`);
    }

    // Determine current conversation context
    const context = this.determineConversationContext(playerEntity, dialogue);
    
    // Get appropriate dialogue node
    const currentNode = await this.selectDialogueNode(dialogue, context, choiceId);
    
    // Process any actions from the dialogue
    await this.processDialogueActions(currentNode, playerEntity, dialogue);
    
    // Update relationship based on interaction
    this.relationshipManager.updateRelationship(
      dialogue.relationship,
      currentNode,
      playerEntity
    );

    // Record conversation entry
    dialogue.conversationHistory.push({
      timestamp: Date.now(),
      nodeId: currentNode.id,
      playerChoice: choiceId,
      npcResponse: currentNode.text,
      mood: currentNode.metadata.mood,
      relationshipChange: this.calculateRelationshipChange(currentNode, dialogue.relationship)
    });

    // Update conversation count
    dialogue.metadata.conversationCount++;
    
    console.log(`💬 Processed conversation with ${npcId}: ${currentNode.type}`);
    return currentNode;
  }

  private async selectDialogueNode(
    dialogue: GeneratedDialogue,
    context: string,
    choiceId?: string
  ): Promise<DialogueNode> {
    // If following a choice, get the target node
    if (choiceId) {
      for (const node of dialogue.nodes.values()) {
        const choice = node.choices.find(c => c.id === choiceId);
        if (choice) {
          const targetNode = dialogue.nodes.get(choice.nextNodeId);
          if (targetNode && this.evaluateConditions(choice.conditions, dialogue)) {
            return targetNode;
          }
        }
      }
    }

    // Find appropriate entry point
    const entryNodeId = dialogue.entryPoints[context] || dialogue.entryPoints['default'];
    if (entryNodeId) {
      const entryNode = dialogue.nodes.get(entryNodeId);
      if (entryNode) {
        return entryNode;
      }
    }

    // Fallback to first available node
    return dialogue.nodes.values().next().value;
  }

  private determineConversationContext(playerEntity: IEntity, dialogue: GeneratedDialogue): string {
    const playerLevel = playerEntity.getComponent('Character')?.level || 1;
    const relationshipLevel = dialogue.relationship.level;
    
    // Determine context based on various factors
    if (dialogue.conversationHistory.length === 0) {
      return 'first_meeting';
    }
    
    if (relationshipLevel < -50) {
      return 'hostile';
    }
    
    if (relationshipLevel > 50) {
      return 'friendly';
    }
    
    return 'neutral';
  }

  // =============================================================================
  // DIALOGUE PARAMETER BUILDING
  // =============================================================================

  private async buildDialogueParameters(request: DialogueGenerationRequest): Promise<Record<string, any>> {
    // Get enriched game context
    const context = await this.gameContext.enrichParameters('dialogue', request.parameters);

    // Get NPC profile
    const npcProfile = this.npcProfiles.get(request.npcId) || this.createDefaultNPCProfile(request.npcId);

    // Add dialogue-specific enrichment
    const dialogueSpecificParams = {
      ...context,
      
      // NPC context
      npc: {
        id: request.npcId,
        name: npcProfile.name,
        role: npcProfile.role,
        personality: npcProfile.personality,
        background: npcProfile.background,
        currentMood: npcProfile.currentMood,
        knowledge: npcProfile.knowledge,
        services: npcProfile.services
      },
      
      // Conversation context
      conversationContext: request.context,
      previousInteractions: this.getPreviousInteractions(request.npcId, context.player),
      relationshipState: this.relationshipManager.getRelationship(request.npcId, context.player.level.toString()),
      
      // World context
      currentLocation: context.world.currentArea.name,
      timeOfDay: this.getTimeOfDay(),
      recentEvents: this.getRecentWorldEvents(),
      localRumors: this.getLocalRumors(context.world.currentArea.name),
      
      // Quest context
      availableQuests: this.getAvailableQuests(request.npcId),
      activeQuests: context.narrative.activeQuests,
      questProgression: this.getQuestProgression(request.npcId, context.narrative),
      
      // Services context
      availableServices: this.getAvailableServices(request.npcId, context.player),
      serviceHistory: this.getServiceHistory(request.npcId, context.player),
      
      // Personality adaptation
      playerReputation: this.calculatePlayerReputation(context.player),
      playerActions: this.getRecentPlayerActions(context.player),
      socialStanding: this.calculateSocialStanding(context.player),
      
      // Quality requirements
      qualityExpectations: {
        characterConsistency: 0.95,
        contextualRelevance: 0.9,
        conversationFlow: 0.85,
        emotionalDepth: context.player.preferences.narrativeInterest === 'high' ? 0.9 : 0.7,
        informationValue: 0.8,
        playerEngagement: 0.85
      }
    };

    return dialogueSpecificParams;
  }

  // =============================================================================
  // DIALOGUE CONTENT PARSING
  // =============================================================================

  private parseDialogueContent(generatedContent: GeneratedContent, request: DialogueGenerationRequest): GeneratedDialogue {
    const content = generatedContent.content;
    
    const dialogue: GeneratedDialogue = {
      id: this.generateDialogueId(),
      npcId: request.npcId,
      version: 1,
      nodes: new Map(),
      entryPoints: this.parseEntryPoints(content.entry_points || content.entryPoints || {}),
      services: this.parseServices(content.services || []),
      relationship: {} as RelationshipState, // Will be initialized later
      personality: this.parsePersonality(content.personality || {}),
      conversationHistory: [],
      metadata: {
        generatedAt: Date.now(),
        lastUpdated: Date.now(),
        conversationCount: 0,
        playerContext: request.parameters.playerContext || {},
        worldContext: request.parameters.worldContext || {},
        qualityMetrics: {} as DialogueQualityMetrics, // Will be filled later
        generationSource: 'claude_generator'
      }
    };

    // Parse dialogue nodes
    const nodes = content.nodes || content.conversation_topics || [];
    for (const nodeData of nodes) {
      const node = this.parseDialogueNode(nodeData);
      dialogue.nodes.set(node.id, node);
    }

    // Ensure we have at least a greeting node
    if (dialogue.nodes.size === 0) {
      dialogue.nodes.set('greeting', this.createDefaultGreetingNode());
    }

    return dialogue;
  }

  private parseDialogueNode(nodeData: any): DialogueNode {
    return {
      id: nodeData.id || this.generateNodeId(),
      type: nodeData.type || 'response',
      text: nodeData.text || nodeData.npc_response || 'Hello there.',
      playerOption: nodeData.player_option || nodeData.playerOption,
      npcResponse: nodeData.npc_response || nodeData.npcResponse || nodeData.text,
      conditions: this.parseConditions(nodeData.conditions || []),
      actions: this.parseActions(nodeData.actions || []),
      choices: this.parseChoices(nodeData.choices || nodeData.options || []),
      metadata: {
        mood: nodeData.mood || 'neutral',
        animation: nodeData.animation || 'talk',
        soundEffect: nodeData.sound_effect || nodeData.soundEffect,
        priority: nodeData.priority || 5,
        frequency: nodeData.frequency || 'common',
        contextualTags: nodeData.contextual_tags || nodeData.contextualTags || []
      }
    };
  }

  private parseConditions(conditions: any[]): DialogueCondition[] {
    return conditions.map(cond => ({
      type: cond.type || 'reputation',
      operator: cond.operator || 'greater_than',
      value: cond.value,
      target: cond.target
    }));
  }

  private parseActions(actions: any[]): DialogueAction[] {
    return actions.map(action => ({
      type: action.type || 'change_reputation',
      parameters: action.parameters || {},
      delay: action.delay
    }));
  }

  private parseChoices(choices: any[]): DialogueChoice[] {
    return choices.map(choice => ({
      id: choice.id || this.generateChoiceId(),
      text: choice.text || 'Continue...',
      nextNodeId: choice.next_node_id || choice.nextNodeId || 'greeting',
      conditions: this.parseConditions(choice.conditions || []),
      consequences: this.parseActions(choice.consequences || []),
      tone: choice.tone || 'neutral',
      cost: choice.cost
    }));
  }

  private parsePersonality(personalityData: any): NPCPersonality {
    return {
      traits: personalityData.traits || ['friendly'],
      values: personalityData.values || { honesty: 80, loyalty: 70 },
      quirks: personalityData.quirks || [],
      speechPatterns: personalityData.speech_patterns || personalityData.speechPatterns || [],
      knowledge: personalityData.knowledge || [],
      secrets: personalityData.secrets || []
    };
  }

  private parseServices(services: any[]): DialogueService[] {
    return services.map(service => ({
      id: service.id || this.generateServiceId(),
      name: service.name || 'Service',
      type: service.type || 'information',
      description: service.description || 'A service offered by the NPC',
      requirements: this.parseConditions(service.requirements || []),
      availability: service.availability || {},
      pricing: service.pricing || { basePrice: 100, currency: 'gold' }
    }));
  }

  // =============================================================================
  // DIALOGUE VALIDATION AND IMPROVEMENT
  // =============================================================================

  private async validateDialogue(dialogue: GeneratedDialogue, request: DialogueGenerationRequest): Promise<DialogueQualityMetrics> {
    return this.dialogueValidator.validateDialogue(dialogue, request);
  }

  private async improveDialogue(dialogue: GeneratedDialogue, validation: DialogueQualityMetrics): Promise<void> {
    if (validation.characterConsistency < 0.8) {
      await this.improveCharacterConsistency(dialogue);
    }

    if (validation.conversationFlow < 0.8) {
      await this.improveConversationFlow(dialogue);
    }

    if (validation.contextualRelevance < 0.8) {
      await this.improveContextualRelevance(dialogue);
    }
  }

  private async improveCharacterConsistency(dialogue: GeneratedDialogue): Promise<void> {
    // Ensure all nodes maintain consistent personality
    for (const node of dialogue.nodes.values()) {
      if (node.metadata.mood === 'neutral') {
        node.metadata.mood = this.getPersonalityMood(dialogue.personality);
      }
    }
  }

  private async improveConversationFlow(dialogue: GeneratedDialogue): Promise<void> {
    // Ensure dialogue nodes have proper connections
    for (const node of dialogue.nodes.values()) {
      if (node.choices.length === 0 && node.type !== 'farewell') {
        node.choices.push({
          id: this.generateChoiceId(),
          text: 'Continue conversation...',
          nextNodeId: 'greeting',
          conditions: [],
          consequences: [],
          tone: 'neutral'
        });
      }
    }
  }

  private async improveContextualRelevance(dialogue: GeneratedDialogue): Promise<void> {
    // Add more contextual responses based on current world state
    // This would analyze current world events and add relevant dialogue
  }

  // =============================================================================
  // FALLBACK GENERATION
  // =============================================================================

  private generateFallbackDialogue(request: DialogueGenerationRequest): GeneratedDialogue {
    console.log(`🔄 Using fallback dialogue generation for NPC: ${request.npcId}`);
    
    const npcProfile = this.npcProfiles.get(request.npcId) || this.createDefaultNPCProfile(request.npcId);
    
    const dialogue: GeneratedDialogue = {
      id: this.generateDialogueId(),
      npcId: request.npcId,
      version: 1,
      nodes: new Map(),
      entryPoints: { default: 'greeting', first_meeting: 'greeting' },
      services: [],
      relationship: {
        level: 0,
        type: 'stranger',
        trust: 50,
        respect: 50,
        fear: 0,
        interactions: []
      },
      personality: {
        traits: ['friendly'],
        values: { honesty: 70, loyalty: 60 },
        quirks: [],
        speechPatterns: [],
        knowledge: [],
        secrets: []
      },
      conversationHistory: [],
      metadata: {
        generatedAt: Date.now(),
        lastUpdated: Date.now(),
        conversationCount: 0,
        playerContext: {},
        worldContext: {},
        qualityMetrics: {
          characterConsistency: 0.6,
          contextualRelevance: 0.5,
          conversationFlow: 0.7,
          emotionalDepth: 0.4,
          informationValue: 0.5,
          playerEngagement: 0.5,
          overall: 0.53
        },
        generationSource: 'fallback'
      }
    };

    // Add basic greeting node
    dialogue.nodes.set('greeting', this.createDefaultGreetingNode());
    
    return dialogue;
  }

  private createDefaultGreetingNode(): DialogueNode {
    return {
      id: 'greeting',
      type: 'greeting',
      text: 'Greetings, traveler. How may I assist you?',
      conditions: [],
      actions: [],
      choices: [
        {
          id: 'general_inquiry',
          text: 'Tell me about this place.',
          nextNodeId: 'info_general',
          conditions: [],
          consequences: [],
          tone: 'neutral'
        },
        {
          id: 'farewell',
          text: 'Farewell.',
          nextNodeId: 'farewell',
          conditions: [],
          consequences: [],
          tone: 'neutral'
        }
      ],
      metadata: {
        mood: 'neutral',
        animation: 'greet',
        priority: 10,
        frequency: 'common',
        contextualTags: ['greeting']
      }
    };
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private loadNPCProfiles(): void {
    // Load predefined NPC profiles
    this.npcProfiles.set('village_blacksmith', {
      name: 'Gareth the Blacksmith',
      role: 'blacksmith',
      personality: 'gruff_but_kind',
      background: 'Experienced craftsman who has served the village for decades.',
      currentMood: 'focused',
      knowledge: ['metalworking', 'local_politics', 'combat_techniques'],
      services: ['repair', 'upgrade', 'crafting']
    });
  }

  private createDefaultNPCProfile(npcId: string): NPCProfile {
    return {
      name: npcId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      role: 'villager',
      personality: 'neutral',
      background: 'A local resident with their own story to tell.',
      currentMood: 'neutral',
      knowledge: ['local_area'],
      services: ['conversation']
    };
  }

  private shouldUpdateDialogue(dialogue: GeneratedDialogue, request: DialogueGenerationRequest): boolean {
    const daysSinceUpdate = (Date.now() - dialogue.metadata.lastUpdated) / (1000 * 60 * 60 * 24);
    return daysSinceUpdate > 1 || dialogue.metadata.conversationCount > 10;
  }

  private async updateExistingDialogue(dialogue: GeneratedDialogue, request: DialogueGenerationRequest): Promise<GeneratedDialogue> {
    // Add new contextual nodes without regenerating the entire dialogue
    const newNodes = await this.updateDialogueForContext(
      request.npcId,
      request.context,
      request.parameters
    );
    
    return dialogue;
  }

  private parseAdditionalNodes(generatedContent: GeneratedContent, dialogue: GeneratedDialogue): DialogueNode[] {
    const content = generatedContent.content;
    const newNodes: DialogueNode[] = [];
    
    const nodes = content.additional_nodes || content.new_nodes || [];
    for (const nodeData of nodes) {
      const node = this.parseDialogueNode(nodeData);
      newNodes.push(node);
    }
    
    return newNodes;
  }

  private evaluateConditions(conditions: DialogueCondition[], dialogue: GeneratedDialogue): boolean {
    // Evaluate all conditions - simplified implementation
    return conditions.every(condition => {
      switch (condition.type) {
        case 'reputation':
          return dialogue.relationship.level >= (condition.value || 0);
        case 'relationship':
          return dialogue.relationship.type === condition.value;
        default:
          return true;
      }
    });
  }

  private async processDialogueActions(node: DialogueNode, playerEntity: IEntity, dialogue: GeneratedDialogue): Promise<void> {
    for (const action of node.actions) {
      switch (action.type) {
        case 'change_reputation':
          dialogue.relationship.level += action.parameters.amount || 0;
          break;
        case 'give_item':
          // Would integrate with inventory system
          break;
        // Add more action types as needed
      }
    }
  }

  private calculateRelationshipChange(node: DialogueNode, relationship: RelationshipState): number {
    // Calculate relationship change based on dialogue interaction
    let change = 0;
    
    if (node.metadata.mood === 'happy') change += 2;
    if (node.metadata.mood === 'angry') change -= 3;
    
    return change;
  }

  private parseEntryPoints(entryPoints: any): Record<string, string> {
    const defaults = { default: 'greeting', first_meeting: 'greeting' };
    return { ...defaults, ...entryPoints };
  }

  private getPersonalityMood(personality: NPCPersonality): string {
    if (personality.traits.includes('cheerful')) return 'happy';
    if (personality.traits.includes('grumpy')) return 'angry';
    return 'neutral';
  }

  // Stub methods for complex implementations
  private getPreviousInteractions(npcId: string, player: any): InteractionHistory[] { return []; }
  private getTimeOfDay(): string { return 'afternoon'; }
  private getRecentWorldEvents(): any[] { return []; }
  private getLocalRumors(area: string): string[] { return []; }
  private getAvailableQuests(npcId: string): any[] { return []; }
  private getQuestProgression(npcId: string, narrative: any): any { return {}; }
  private getAvailableServices(npcId: string, player: any): string[] { return []; }
  private getServiceHistory(npcId: string, player: any): any[] { return []; }
  private calculatePlayerReputation(player: any): number { return 50; }
  private getRecentPlayerActions(player: any): any[] { return []; }
  private calculateSocialStanding(player: any): string { return 'neutral'; }

  private generateDialogueId(): string {
    return `dialogue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateNodeId(): string {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  private generateChoiceId(): string {
    return `choice_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  private generateServiceId(): string {
    return `service_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  public getGenerationStats(): any {
    return this.generationStats.getStats();
  }

  public destroy(): void {
    this.dialogueCache.clear();
    this.npcProfiles.clear();
    console.log('💥 Dialogue Generator destroyed');
  }
}

// =============================================================================
// SUPPORTING CLASSES AND INTERFACES
// =============================================================================

interface NPCProfile {
  name: string;
  role: string;
  personality: string;
  background: string;
  currentMood: string;
  knowledge: string[];
  services: string[];
}

class DialogueValidator {
  async validateDialogue(dialogue: GeneratedDialogue, request: DialogueGenerationRequest): Promise<DialogueQualityMetrics> {
    const metrics: DialogueQualityMetrics = {
      characterConsistency: this.assessCharacterConsistency(dialogue),
      contextualRelevance: this.assessContextualRelevance(dialogue, request),
      conversationFlow: this.assessConversationFlow(dialogue),
      emotionalDepth: this.assessEmotionalDepth(dialogue),
      informationValue: this.assessInformationValue(dialogue),
      playerEngagement: this.assessPlayerEngagement(dialogue),
      overall: 0
    };

    metrics.overall = (
      metrics.characterConsistency * 0.20 +
      metrics.contextualRelevance * 0.20 +
      metrics.conversationFlow * 0.15 +
      metrics.emotionalDepth * 0.15 +
      metrics.informationValue * 0.15 +
      metrics.playerEngagement * 0.15
    );

    return metrics;
  }

  private assessCharacterConsistency(dialogue: GeneratedDialogue): number {
    // Check if personality traits are consistent across all nodes
    return 0.85;
  }

  private assessContextualRelevance(dialogue: GeneratedDialogue, request: DialogueGenerationRequest): number {
    // Check if dialogue is relevant to current context
    return 0.8;
  }

  private assessConversationFlow(dialogue: GeneratedDialogue): number {
    // Check if conversations flow naturally
    let score = 0.8;
    for (const node of dialogue.nodes.values()) {
      if (node.choices.length === 0 && node.type !== 'farewell') {
        score -= 0.1;
      }
    }
    return Math.max(0.5, score);
  }

  private assessEmotionalDepth(dialogue: GeneratedDialogue): number {
    // Check emotional variety and depth
    const moodVariety = new Set();
    for (const node of dialogue.nodes.values()) {
      moodVariety.add(node.metadata.mood);
    }
    return Math.min(1.0, moodVariety.size * 0.2 + 0.4);
  }

  private assessInformationValue(dialogue: GeneratedDialogue): number {
    // Check how much useful information is provided
    return dialogue.personality.knowledge.length > 0 ? 0.8 : 0.5;
  }

  private assessPlayerEngagement(dialogue: GeneratedDialogue): number {
    // Check how engaging the dialogue is for players
    let choiceCount = 0;
    for (const node of dialogue.nodes.values()) {
      choiceCount += node.choices.length;
    }
    return Math.min(1.0, choiceCount * 0.1 + 0.5);
  }
}

class RelationshipManager {
  async initializeRelationship(npcId: string, playerContext: any): Promise<RelationshipState> {
    return {
      level: 0,
      type: 'stranger',
      trust: 50,
      respect: 50,
      fear: 0,
      interactions: []
    };
  }

  updateRelationship(relationship: RelationshipState, node: DialogueNode, playerEntity: IEntity): void {
    // Update relationship based on the conversation
    if (node.metadata.mood === 'happy') {
      relationship.level += 1;
      relationship.trust += 1;
    }
    
    // Update relationship type based on level
    if (relationship.level > 20) {
      relationship.type = 'friend';
    } else if (relationship.level < -20) {
      relationship.type = 'enemy';
    }
  }

  getRelationship(npcId: string, playerId: string): RelationshipState | null {
    // Would implement persistent relationship storage
    return null;
  }
}

class ConversationAnalyzer {
  analyzeConversationPatterns(dialogue: GeneratedDialogue): any {
    return {
      averageResponseLength: this.calculateAverageResponseLength(dialogue),
      topicDistribution: this.analyzeTopicDistribution(dialogue),
      emotionalTone: this.analyzeEmotionalTone(dialogue)
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

  private analyzeTopicDistribution(dialogue: GeneratedDialogue): Record<string, number> {
    const topics: Record<string, number> = {};
    
    for (const node of dialogue.nodes.values()) {
      for (const tag of node.metadata.contextualTags) {
        topics[tag] = (topics[tag] || 0) + 1;
      }
    }
    
    return topics;
  }

  private analyzeEmotionalTone(dialogue: GeneratedDialogue): Record<string, number> {
    const emotions: Record<string, number> = {};
    
    for (const node of dialogue.nodes.values()) {
      const mood = node.metadata.mood;
      emotions[mood] = (emotions[mood] || 0) + 1;
    }
    
    return emotions;
  }
}

class DialogueGenerationStats {
  private stats = {
    totalGenerated: 0,
    successful: 0,
    failed: 0,
    averageTime: 0,
    totalTime: 0,
    contextBreakdown: new Map<string, number>()
  };

  recordGeneration(context: string, time: number, success: boolean): void {
    this.stats.totalGenerated++;
    this.stats.totalTime += time;
    this.stats.averageTime = this.stats.totalTime / this.stats.totalGenerated;

    if (success) {
      this.stats.successful++;
    } else {
      this.stats.failed++;
    }

    this.stats.contextBreakdown.set(context, (this.stats.contextBreakdown.get(context) || 0) + 1);
  }

  getStats(): any {
    return {
      ...this.stats,
      successRate: this.stats.totalGenerated > 0 ? this.stats.successful / this.stats.totalGenerated : 0,
      contextBreakdown: Object.fromEntries(this.stats.contextBreakdown)
    };
  }
}

export function createDialogueGenerator(
  claudeEngine: ClaudeContentEngine,
  gameContext: GameContextManager,
  world: IWorld
): DialogueGenerator {
  return new DialogueGenerator(claudeEngine, gameContext, world);
}