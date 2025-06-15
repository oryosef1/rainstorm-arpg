// Path of Exile style flask system with life/mana recovery and utility effects
// Auto-generated feature pod for conflict-free parallel development

import { FeaturePod } from '../../templates/feature-pod-template';
import { FeatureAPI, APIContract } from '../../core/api-registry';
import { EventData } from '../../core/event-bus';
import { FlaskSystemAPI } from './flask-system.api';
import { FlaskSystemEvents } from './flask-system.events';
import { FlaskSystemConfig } from './flask-system.config';

export class FlaskSystemPod extends FeaturePod {
  private api: FlaskSystemAPI;
  private events: FlaskSystemEvents;
  private featureConfig: FlaskSystemConfig;

  constructor(config: any = {}) {
    super({
      name: 'flask-system',
      version: '1.0.0',
      description: 'Path of Exile style flask system with life/mana recovery and utility effects',
      dependencies: ['inventory-system'],
      ...config
    });

    this.api = new FlaskSystemAPI(this);
    this.events = new FlaskSystemEvents(this);
    this.featureConfig = new FlaskSystemConfig(config);
  }

  // === FEATURE POD IMPLEMENTATION ===

  protected initializeAPI(): FeatureAPI {
    return {
      useFlask: this.api.useFlask.bind(this.api),
      getFlaskState: this.api.getFlaskState.bind(this.api),
      addCharges: this.api.addCharges.bind(this.api),
      setFlaskInSlot: this.api.setFlaskInSlot.bind(this.api),
      removeFlaskFromSlot: this.api.removeFlaskFromSlot.bind(this.api),
      getActiveEffects: this.api.getActiveEffects.bind(this.api),
      updateFlaskCharges: this.api.updateFlaskCharges.bind(this.api),
      healthCheck: this.healthCheck.bind(this)
    };
  }

  protected getAPIContract(): APIContract {
    return {
      name: 'flask-system',
      version: '1.0.0',
      description: 'Path of Exile style flask system with life/mana recovery and utility effects',
      methods: {
        useFlask: {
          description: 'Use a flask by slot number',
          parameters: [
            { name: 'slotNumber', type: 'number', required: true, description: 'Flask slot number (1-5)' }
          ],
          returnType: 'Promise<boolean>'
        },
        getFlaskState: {
          description: 'Get current state of all flask slots',
          parameters: [],
          returnType: 'FlaskSlotState[]'
        },
        addCharges: {
          description: 'Add charges to a specific flask',
          parameters: [
            { name: 'slotNumber', type: 'number', required: true, description: 'Flask slot number' },
            { name: 'charges', type: 'number', required: true, description: 'Number of charges to add' }
          ],
          returnType: 'Promise<boolean>'
        },
        setFlaskInSlot: {
          description: 'Set a flask in a specific slot',
          parameters: [
            { name: 'slotNumber', type: 'number', required: true, description: 'Flask slot number' },
            { name: 'flask', type: 'FlaskData', required: true, description: 'Flask to set in slot' }
          ],
          returnType: 'Promise<boolean>'
        },
        removeFlaskFromSlot: {
          description: 'Remove flask from a specific slot',
          parameters: [
            { name: 'slotNumber', type: 'number', required: true, description: 'Flask slot number' }
          ],
          returnType: 'Promise<boolean>'
        },
        getActiveEffects: {
          description: 'Get all currently active flask effects',
          parameters: [],
          returnType: 'ActiveFlaskEffect[]'
        },
        updateFlaskCharges: {
          description: 'Update flask charges based on game events',
          parameters: [
            { name: 'event', type: 'string', required: true, description: 'Event type (kill, crit, time)' },
            { name: 'amount', type: 'number', required: false, description: 'Charge amount for time-based recovery' }
          ],
          returnType: 'Promise<void>'
        }
      },
      events: {
        emits: ['flask.used', 'flask.effect.started', 'flask.effect.ended', 'flask.charges.gained', 'flask.empty'],
        listensTo: ['combat.enemy.killed', 'combat.critical.hit', 'character.health.changed', 'character.mana.changed']
      },
      dependencies: ['inventory-system'],
      compatibility: ['1.x']
    };
  }

  protected setupEventHandlers(): void {
    this.events.setupHandlers();
  }

  // === CUSTOM IMPLEMENTATION ===

  protected async customHealthCheck(): Promise<any> {
    return {
      status: 'healthy',
      message: 'Flask system is operational',
      details: {
        activeFlasks: this.api.getActiveFlaskCount(),
        activeEffects: this.api.getActiveEffectCount(),
        totalCharges: this.api.getTotalCharges(),
        memoryUsage: process.memoryUsage()
      }
    };
  }

  protected async onShutdown(): Promise<void> {
    console.log('🛑 Shutting down flask-system feature');
    await this.events.cleanup();
    this.api.clearAllEffects();
    this.api.clearCache();
  }

  // === PUBLIC METHODS ===

  getAPI(): FlaskSystemAPI {
    return this.api;
  }

  getEvents(): FlaskSystemEvents {
    return this.events;
  }

  getFeatureConfig(): FlaskSystemConfig {
    return this.featureConfig;
  }
}

// Export the pod class
export default FlaskSystemPod;

// Export for CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FlaskSystemPod };
}