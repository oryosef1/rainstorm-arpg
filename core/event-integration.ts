// Event Integration System - Connect all ARPG features through events
// Enables seamless communication between all game systems

import { EventBus, globalEventBus } from './event-bus';
import { APIRegistry, globalAPIRegistry } from './api-registry';

export interface EventIntegrationConfig {
  enableLogging?: boolean;
  enableMetrics?: boolean;
  enableValidation?: boolean;
  retryFailedEvents?: boolean;
  maxRetries?: number;
  eventTimeout?: number;
}

export interface EventFlow {
  id: string;
  name: string;
  description: string;
  trigger: EventTrigger;
  handlers: EventHandler[];
  enabled: boolean;
}

export interface EventTrigger {
  eventName: string;
  sourceFilter?: string[];
  dataFilter?: (data: any) => boolean;
}

export interface EventHandler {
  targetFeature: string;
  targetMethod?: string;
  targetEvent?: string;
  dataTransform?: (data: any) => any;
  condition?: (data: any) => boolean;
  priority?: number;
}

export interface EventFlowMetrics {
  flowId: string;
  triggeredCount: number;
  successCount: number;
  errorCount: number;
  averageProcessingTime: number;
  lastTriggered: number;
  lastError?: { message: string; timestamp: number };
}

export class EventIntegrationSystem {
  private config: EventIntegrationConfig;
  private eventBus: EventBus;
  private apiRegistry: APIRegistry;
  private eventFlows: Map<string, EventFlow> = new Map();
  private flowMetrics: Map<string, EventFlowMetrics> = new Map();
  private isInitialized: boolean = false;

  constructor(config: EventIntegrationConfig = {}) {
    this.config = {
      enableLogging: true,
      enableMetrics: true,
      enableValidation: true,
      retryFailedEvents: true,
      maxRetries: 3,
      eventTimeout: 5000,
      ...config
    };

    this.eventBus = globalEventBus;
    this.apiRegistry = globalAPIRegistry;
  }

  // === INITIALIZATION ===

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('🔄 Initializing Event Integration System...');

    // Setup core ARPG event flows
    this.setupCoreEventFlows();

    // Setup global event monitoring
    this.setupEventMonitoring();

    this.isInitialized = true;
    console.log('✅ Event Integration System initialized');
  }

  // === CORE ARPG EVENT FLOWS ===

  private setupCoreEventFlows(): void {
    // === CHARACTER PROGRESSION FLOWS ===
    
    this.addEventFlow({
      id: 'character-level-up-flow',
      name: 'Character Level Up Integration',
      description: 'Handle character level up across all systems',
      trigger: {
        eventName: 'character.level.up'
      },
      handlers: [
        {
          targetFeature: 'inventory-system',
          dataTransform: (data) => ({ characterLevel: data.newLevel, oldLevel: data.oldLevel })
        },
        {
          targetFeature: 'flask-system', 
          dataTransform: (data) => ({ characterLevel: data.newLevel })
        },
        {
          targetFeature: 'skill-tree-system',
          dataTransform: (data) => ({ newLevel: data.newLevel, skillPoints: data.newLevel - data.oldLevel })
        }
      ],
      enabled: true
    });

    // === COMBAT FLOWS ===
    
    this.addEventFlow({
      id: 'enemy-killed-flow',
      name: 'Enemy Killed Integration',
      description: 'Handle enemy kills for flask charges, experience, and loot',
      trigger: {
        eventName: 'combat.enemy.killed'
      },
      handlers: [
        {
          targetFeature: 'flask-system',
          targetMethod: 'updateFlaskCharges',
          dataTransform: (data) => ({ event: 'kill', enemy: data.enemy })
        },
        {
          targetFeature: 'character-progression',
          targetMethod: 'gainExperience', 
          dataTransform: (data) => ({ experience: data.enemy.experienceReward })
        },
        {
          targetFeature: 'loot-system',
          targetMethod: 'dropLoot',
          dataTransform: (data) => ({ enemy: data.enemy, dropPosition: data.position })
        }
      ],
      enabled: true
    });

    this.addEventFlow({
      id: 'critical-hit-flow',
      name: 'Critical Hit Integration', 
      description: 'Handle critical hits for flask charges and effects',
      trigger: {
        eventName: 'combat.critical.hit'
      },
      handlers: [
        {
          targetFeature: 'flask-system',
          targetMethod: 'updateFlaskCharges',
          dataTransform: (data) => ({ event: 'crit', damage: data.damage })
        },
        {
          targetFeature: 'skill-system',
          targetEvent: 'skill.critical.triggered',
          dataTransform: (data) => ({ damage: data.damage, target: data.target })
        }
      ],
      enabled: true
    });

    // === ITEM SYSTEM FLOWS ===
    
    this.addEventFlow({
      id: 'item-created-flow',
      name: 'Item Creation Integration',
      description: 'Handle new item creation across systems',
      trigger: {
        eventName: 'item.factory.created'
      },
      handlers: [
        {
          targetFeature: 'inventory-system',
          condition: (data) => data.autoPickup === true,
          dataTransform: (data) => ({ item: data.item })
        },
        {
          targetFeature: 'loot-filter-system',
          targetMethod: 'evaluateItem',
          dataTransform: (data) => ({ item: data.item })
        }
      ],
      enabled: true
    });

    this.addEventFlow({
      id: 'item-equipped-flow',
      name: 'Item Equipment Integration',
      description: 'Handle item equipment changes',
      trigger: {
        eventName: 'inventory.item.equipped'
      },
      handlers: [
        {
          targetFeature: 'character-stats',
          targetMethod: 'recalculateStats',
          dataTransform: (data) => ({ equippedItem: data.item, slot: data.slot })
        },
        {
          targetFeature: 'skill-system', 
          targetMethod: 'updateSkillRequirements',
          dataTransform: (data) => ({ item: data.item })
        },
        {
          targetFeature: 'flask-system',
          condition: (data) => data.item.type === 'flask',
          targetMethod: 'setFlaskInSlot',
          dataTransform: (data) => ({ flask: data.item, slot: this.getFlaskSlotFromEquipmentSlot(data.slot) })
        }
      ],
      enabled: true
    });

    // === HEALTH/MANA FLOWS ===
    
    this.addEventFlow({
      id: 'health-changed-flow',
      name: 'Health Change Integration',
      description: 'Handle health changes for auto-flask usage',
      trigger: {
        eventName: 'character.health.changed'
      },
      handlers: [
        {
          targetFeature: 'flask-system',
          condition: (data) => {
            const healthPercentage = data.newHealth / data.maxHealth;
            return healthPercentage < 0.3 && data.changeReason === 'damage';
          },
          targetMethod: 'autoUseHealthFlask',
          dataTransform: (data) => ({ 
            currentHealth: data.newHealth, 
            maxHealth: data.maxHealth,
            urgency: 'high'
          })
        },
        {
          targetFeature: 'ui-system',
          targetEvent: 'ui.health.update',
          dataTransform: (data) => ({ 
            health: data.newHealth, 
            maxHealth: data.maxHealth,
            changeType: data.changeReason
          })
        }
      ],
      enabled: true
    });

    this.addEventFlow({
      id: 'mana-changed-flow',
      name: 'Mana Change Integration',
      description: 'Handle mana changes for auto-flask usage',
      trigger: {
        eventName: 'character.mana.changed'
      },
      handlers: [
        {
          targetFeature: 'flask-system',
          condition: (data) => {
            const manaPercentage = data.newMana / data.maxMana;
            return manaPercentage < 0.2 && data.changeReason === 'skill';
          },
          targetMethod: 'autoUseManaFlask',
          dataTransform: (data) => ({ 
            currentMana: data.newMana, 
            maxMana: data.maxMana,
            urgency: 'medium'
          })
        },
        {
          targetFeature: 'ui-system',
          targetEvent: 'ui.mana.update', 
          dataTransform: (data) => ({ 
            mana: data.newMana, 
            maxMana: data.maxMana,
            changeType: data.changeReason
          })
        }
      ],
      enabled: true
    });

    // === FLASK SYSTEM FLOWS ===
    
    this.addEventFlow({
      id: 'flask-used-flow',
      name: 'Flask Usage Integration',
      description: 'Handle flask usage effects',
      trigger: {
        eventName: 'flask.used'
      },
      handlers: [
        {
          targetFeature: 'character-stats',
          condition: (data) => data.flask.type === 'utility',
          targetMethod: 'applyTemporaryEffects',
          dataTransform: (data) => ({ effects: data.flask.effects, duration: data.flask.duration })
        },
        {
          targetFeature: 'ui-system',
          targetEvent: 'ui.flask.used',
          dataTransform: (data) => ({ flask: data.flask, slot: data.slotNumber })
        }
      ],
      enabled: true
    });

    // === SKILL SYSTEM FLOWS ===
    
    this.addEventFlow({
      id: 'skill-used-flow',
      name: 'Skill Usage Integration',
      description: 'Handle skill usage across systems',
      trigger: {
        eventName: 'skill.used'
      },
      handlers: [
        {
          targetFeature: 'character-stats',
          targetMethod: 'consumeMana',
          dataTransform: (data) => ({ manaCost: data.skill.manaCost })
        },
        {
          targetFeature: 'flask-system',
          condition: (data) => data.skill.manaCost > 0,
          targetEvent: 'character.mana.changed',
          dataTransform: (data) => ({ 
            changeReason: 'skill',
            manaCost: data.skill.manaCost
          })
        }
      ],
      enabled: true
    });

    console.log(`🔗 Setup ${this.eventFlows.size} core ARPG event flows`);
  }

  // === EVENT FLOW MANAGEMENT ===

  addEventFlow(flow: EventFlow): void {
    this.eventFlows.set(flow.id, flow);
    this.flowMetrics.set(flow.id, {
      flowId: flow.id,
      triggeredCount: 0,
      successCount: 0,
      errorCount: 0,
      averageProcessingTime: 0,
      lastTriggered: 0
    });

    // Register event listener for this flow
    this.eventBus.on(flow.trigger.eventName, async (event) => {
      await this.processEventFlow(flow, event);
    }, 'event-integration-system');

    if (this.config.enableLogging) {
      console.log(`➕ Added event flow: ${flow.name}`);
    }
  }

  removeEventFlow(flowId: string): void {
    const flow = this.eventFlows.get(flowId);
    if (flow) {
      this.eventBus.off(flow.trigger.eventName, 'event-integration-system');
      this.eventFlows.delete(flowId);
      this.flowMetrics.delete(flowId);
      
      if (this.config.enableLogging) {
        console.log(`➖ Removed event flow: ${flow.name}`);
      }
    }
  }

  enableEventFlow(flowId: string): void {
    const flow = this.eventFlows.get(flowId);
    if (flow) {
      flow.enabled = true;
      if (this.config.enableLogging) {
        console.log(`✅ Enabled event flow: ${flow.name}`);
      }
    }
  }

  disableEventFlow(flowId: string): void {
    const flow = this.eventFlows.get(flowId);
    if (flow) {
      flow.enabled = false;
      if (this.config.enableLogging) {
        console.log(`⏸️ Disabled event flow: ${flow.name}`);
      }
    }
  }

  // === EVENT PROCESSING ===

  private async processEventFlow(flow: EventFlow, event: any): Promise<void> {
    if (!flow.enabled) {
      return;
    }

    const startTime = Date.now();
    const metrics = this.flowMetrics.get(flow.id)!;
    metrics.triggeredCount++;
    metrics.lastTriggered = startTime;

    try {
      // Check source filter
      if (flow.trigger.sourceFilter && !flow.trigger.sourceFilter.includes(event.source)) {
        return;
      }

      // Check data filter
      if (flow.trigger.dataFilter && !flow.trigger.dataFilter(event.data)) {
        return;
      }

      if (this.config.enableLogging) {
        console.log(`🔄 Processing event flow: ${flow.name} (triggered by ${event.eventName})`);
      }

      // Process all handlers
      const handlerPromises = flow.handlers.map(handler => this.processEventHandler(handler, event));
      await Promise.allSettled(handlerPromises);

      // Update metrics
      const processingTime = Date.now() - startTime;
      metrics.successCount++;
      metrics.averageProcessingTime = (metrics.averageProcessingTime * (metrics.successCount - 1) + processingTime) / metrics.successCount;

      if (this.config.enableLogging) {
        console.log(`✅ Event flow completed: ${flow.name} (${processingTime}ms)`);
      }

    } catch (error) {
      metrics.errorCount++;
      metrics.lastError = {
        message: (error as Error).message,
        timestamp: Date.now()
      };

      console.error(`❌ Event flow failed: ${flow.name}`, error);

      if (this.config.retryFailedEvents) {
        // Implement retry logic if needed
      }
    }
  }

  private async processEventHandler(handler: EventHandler, event: any): Promise<void> {
    try {
      // Check condition
      if (handler.condition && !handler.condition(event.data)) {
        return;
      }

      // Transform data
      let transformedData = event.data;
      if (handler.dataTransform) {
        transformedData = handler.dataTransform(event.data);
      }

      // Check if target feature exists
      if (!this.apiRegistry.hasFeature(handler.targetFeature)) {
        console.warn(`⚠️ Target feature not found: ${handler.targetFeature}`);
        return;
      }

      // Get target feature API
      const targetAPI = this.apiRegistry.getFeature(handler.targetFeature);

      if (handler.targetMethod) {
        // Call method on target feature
        if (typeof targetAPI[handler.targetMethod] === 'function') {
          await targetAPI[handler.targetMethod](transformedData);
        } else {
          console.warn(`⚠️ Method not found: ${handler.targetFeature}.${handler.targetMethod}`);
        }
      } else if (handler.targetEvent) {
        // Emit event to target feature
        this.eventBus.emitSync(handler.targetEvent, transformedData, 'event-integration-system');
      }

    } catch (error) {
      console.error(`❌ Event handler failed: ${handler.targetFeature}`, error);
      throw error;
    }
  }

  // === MONITORING ===

  private setupEventMonitoring(): void {
    if (!this.config.enableLogging) {
      return;
    }

    // Monitor all events for debugging
    this.eventBus.on('*', (event) => {
      console.log(`📡 Event: ${event.eventName} from ${event.source} -> ${this.getEventFlowsForEvent(event.eventName).length} flows`);
    }, 'event-integration-monitor', { priority: -1000 }); // Low priority to run last
  }

  private getEventFlowsForEvent(eventName: string): EventFlow[] {
    return Array.from(this.eventFlows.values()).filter(flow => 
      flow.enabled && flow.trigger.eventName === eventName || flow.trigger.eventName === '*'
    );
  }

  // === UTILITY METHODS ===

  private getFlaskSlotFromEquipmentSlot(equipmentSlot: string): number {
    const mapping: Record<string, number> = {
      'flask1': 1,
      'flask2': 2,
      'flask3': 3,
      'flask4': 4,
      'flask5': 5
    };
    return mapping[equipmentSlot] || 1;
  }

  // === PUBLIC API ===

  getEventFlows(): EventFlow[] {
    return Array.from(this.eventFlows.values());
  }

  getFlowMetrics(): EventFlowMetrics[] {
    return Array.from(this.flowMetrics.values());
  }

  getFlowMetricsById(flowId: string): EventFlowMetrics | undefined {
    return this.flowMetrics.get(flowId);
  }

  async testEventFlow(flowId: string, testData: any): Promise<void> {
    const flow = this.eventFlows.get(flowId);
    if (!flow) {
      throw new Error(`Event flow not found: ${flowId}`);
    }

    console.log(`🧪 Testing event flow: ${flow.name}`);
    
    // Create mock event
    const mockEvent = {
      eventName: flow.trigger.eventName,
      source: 'test-system',
      data: testData,
      timestamp: Date.now()
    };

    await this.processEventFlow(flow, mockEvent);
  }

  getHealthStatus(): { status: string; details: any } {
    const totalFlows = this.eventFlows.size;
    const enabledFlows = Array.from(this.eventFlows.values()).filter(f => f.enabled).length;
    const totalErrors = Array.from(this.flowMetrics.values()).reduce((sum, m) => sum + m.errorCount, 0);

    return {
      status: totalErrors === 0 ? 'healthy' : 'degraded',
      details: {
        totalFlows,
        enabledFlows,
        totalErrors,
        isInitialized: this.isInitialized
      }
    };
  }

  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Event Integration System');
    
    // Remove all event listeners
    for (const flow of this.eventFlows.values()) {
      this.eventBus.off(flow.trigger.eventName, 'event-integration-system');
    }
    
    this.eventFlows.clear();
    this.flowMetrics.clear();
    this.isInitialized = false;
    
    console.log('✅ Event Integration System shutdown complete');
  }
}

// Global event integration instance
export const globalEventIntegration = new EventIntegrationSystem({
  enableLogging: true,
  enableMetrics: true,
  enableValidation: true,
  retryFailedEvents: true,
  maxRetries: 3,
  eventTimeout: 5000
});

// Export for CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EventIntegrationSystem, globalEventIntegration };
}