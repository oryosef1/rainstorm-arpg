// Feature Pod Template - Revolutionary conflict-free development
// Template for creating isolated, parallel-development-ready feature pods

import { EventBus, EventData, globalEventBus } from '../core/event-bus';
import { APIRegistry, APIContract, FeatureAPI, globalAPIRegistry } from '../core/api-registry';

export interface FeaturePodConfig {
  name: string;
  version: string;
  description: string;
  dependencies?: string[];
  eventBus?: EventBus;
  apiRegistry?: APIRegistry;
  autoRegister?: boolean;
  enableHealthChecks?: boolean;
  enableMetrics?: boolean;
  metadata?: Record<string, any>;
}

export interface FeaturePodMetrics {
  uptime: number;
  eventsEmitted: number;
  eventsReceived: number;
  apiCalls: number;
  errors: number;
  lastError?: { message: string; timestamp: number };
  performance: {
    averageEventProcessingTime: number;
    averageAPIResponseTime: number;
  };
}

export interface FeaturePodHealth {
  status: 'healthy' | 'degraded' | 'error' | 'initializing' | 'shutting-down';
  details: {
    dependencies: Record<string, 'available' | 'missing' | 'error'>;
    metrics: FeaturePodMetrics;
    lastHealthCheck: number;
  };
  message?: string;
}

/**
 * Base class for all feature pods
 * Provides conflict-free parallel development foundation
 */
export abstract class FeaturePod {
  protected config: FeaturePodConfig;
  protected eventBus: EventBus;
  protected apiRegistry: APIRegistry;
  protected isInitialized: boolean = false;
  protected isShuttingDown: boolean = false;
  protected startTime: number = Date.now();
  protected metrics: FeaturePodMetrics;
  protected eventListeners: Map<string, string> = new Map();
  
  // Abstract methods that must be implemented by each feature
  protected abstract initializeAPI(): FeatureAPI;
  protected abstract getAPIContract(): APIContract;
  protected abstract setupEventHandlers(): void;

  constructor(config: FeaturePodConfig) {
    this.config = {
      autoRegister: true,
      enableHealthChecks: true,
      enableMetrics: true,
      dependencies: [],
      ...config
    };

    this.eventBus = config.eventBus || globalEventBus;
    this.apiRegistry = config.apiRegistry || globalAPIRegistry;
    
    this.metrics = this.initializeMetrics();

    // Auto-initialize if configured
    if (this.config.autoRegister) {
      this.initialize().catch(error => {
        console.error(`❌ Failed to auto-initialize feature '${this.config.name}':`, error);
      });
    }
  }

  private initializeMetrics(): FeaturePodMetrics {
    return {
      uptime: 0,
      eventsEmitted: 0,
      eventsReceived: 0,
      apiCalls: 0,
      errors: 0,
      performance: {
        averageEventProcessingTime: 0,
        averageAPIResponseTime: 0
      }
    };
  }

  // === INITIALIZATION ===

  /**
   * Initialize the feature pod
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      throw new Error(`Feature '${this.config.name}' is already initialized`);
    }

    try {
      console.log(`🚀 Initializing feature pod '${this.config.name}' v${this.config.version}`);

      // Check dependencies
      await this.validateDependencies();

      // Setup event handlers
      this.setupEventHandlers();

      // Initialize API
      const api = this.initializeAPI();
      const contract = this.getAPIContract();

      // Wrap API with metrics if enabled
      const wrappedAPI = this.config.enableMetrics ? this.wrapAPIWithMetrics(api) : api;

      // Register with API registry
      await this.apiRegistry.registerFeature(this.config.name, wrappedAPI, contract);

      // Mark as initialized
      this.isInitialized = true;
      this.startTime = Date.now();

      // Emit initialization event
      this.emitEvent('feature.initialized', {
        feature: this.config.name,
        version: this.config.version,
        timestamp: Date.now()
      });

      console.log(`✅ Feature pod '${this.config.name}' initialized successfully`);

    } catch (error) {
      console.error(`❌ Failed to initialize feature '${this.config.name}':`, error);
      this.recordError(error as Error);
      throw error;
    }
  }

  /**
   * Shutdown the feature pod
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized || this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;

    try {
      console.log(`🛑 Shutting down feature pod '${this.config.name}'`);

      // Emit shutdown event
      this.emitEvent('feature.shutting-down', {
        feature: this.config.name,
        version: this.config.version,
        timestamp: Date.now()
      });

      // Remove event listeners
      for (const [eventName, listenerId] of this.eventListeners) {
        this.eventBus.off(eventName, this.config.name);
      }
      this.eventListeners.clear();

      // Unregister from API registry
      await this.apiRegistry.unregisterFeature(this.config.name);

      // Call custom shutdown logic
      await this.onShutdown();

      this.isInitialized = false;

      console.log(`✅ Feature pod '${this.config.name}' shutdown complete`);

    } catch (error) {
      console.error(`❌ Error during shutdown of feature '${this.config.name}':`, error);
      this.recordError(error as Error);
      throw error;
    } finally {
      this.isShuttingDown = false;
    }
  }

  /**
   * Override this method for custom shutdown logic
   */
  protected async onShutdown(): Promise<void> {
    // Default implementation - no custom shutdown logic
  }

  // === EVENT HANDLING ===

  /**
   * Emit an event (conflict-free communication)
   */
  protected emitEvent(eventName: string, data: any, metadata: Record<string, any> = {}): void {
    if (!this.isInitialized) {
      console.warn(`⚠️ Feature '${this.config.name}' tried to emit event before initialization`);
      return;
    }

    try {
      this.eventBus.emitSync(eventName, data, this.config.name, metadata);
      this.metrics.eventsEmitted++;
    } catch (error) {
      this.recordError(error as Error);
      throw error;
    }
  }

  /**
   * Listen to events (conflict-free communication)
   */
  protected listenToEvent(
    eventName: string, 
    handler: (event: EventData) => void | Promise<void>,
    options: { priority?: number; once?: boolean } = {}
  ): void {
    const wrappedHandler = this.config.enableMetrics ? 
      this.wrapEventHandler(handler) : 
      handler;

    const listenerId = this.eventBus.on(eventName, wrappedHandler, this.config.name, options);
    this.eventListeners.set(eventName, listenerId);
  }

  /**
   * Stop listening to specific event
   */
  protected stopListening(eventName: string): void {
    this.eventBus.off(eventName, this.config.name);
    this.eventListeners.delete(eventName);
  }

  private wrapEventHandler(handler: (event: EventData) => void | Promise<void>): (event: EventData) => Promise<void> {
    return async (event: EventData) => {
      const startTime = Date.now();
      
      try {
        await handler(event);
        this.metrics.eventsReceived++;
        
        // Update performance metrics
        const processingTime = Date.now() - startTime;
        this.updateEventProcessingTime(processingTime);
        
      } catch (error) {
        this.recordError(error as Error);
        throw error;
      }
    };
  }

  // === API WRAPPING ===

  private wrapAPIWithMetrics(api: FeatureAPI): FeatureAPI {
    const wrappedAPI: FeatureAPI = {};

    for (const [methodName, method] of Object.entries(api)) {
      if (typeof method === 'function') {
        wrappedAPI[methodName] = this.wrapAPIMethod(method, methodName);
      } else {
        wrappedAPI[methodName] = method;
      }
    }

    return wrappedAPI;
  }

  private wrapAPIMethod(method: Function, methodName: string): Function {
    return async (...args: any[]) => {
      if (!this.isInitialized) {
        throw new Error(`Feature '${this.config.name}' method '${methodName}' called before initialization`);
      }

      const startTime = Date.now();

      try {
        const result = await method.apply(this, args);
        
        this.metrics.apiCalls++;
        
        // Update performance metrics
        const responseTime = Date.now() - startTime;
        this.updateAPIResponseTime(responseTime);
        
        return result;
        
      } catch (error) {
        this.recordError(error as Error);
        throw error;
      }
    };
  }

  // === DEPENDENCY VALIDATION ===

  private async validateDependencies(): Promise<void> {
    if (!this.config.dependencies || this.config.dependencies.length === 0) {
      return;
    }

    const missingDependencies: string[] = [];

    for (const dependency of this.config.dependencies) {
      try {
        if (!this.apiRegistry.hasFeature(dependency)) {
          missingDependencies.push(dependency);
        }
      } catch (error) {
        missingDependencies.push(dependency);
      }
    }

    if (missingDependencies.length > 0) {
      throw new Error(`Missing dependencies for feature '${this.config.name}': ${missingDependencies.join(', ')}`);
    }
  }

  /**
   * Get dependency API safely
   */
  protected getDependency(dependencyName: string, version?: string): FeatureAPI {
    if (!this.config.dependencies?.includes(dependencyName)) {
      throw new Error(`'${dependencyName}' is not declared as a dependency of '${this.config.name}'`);
    }

    return this.apiRegistry.getFeature(dependencyName, version);
  }

  // === HEALTH CHECKS ===

  /**
   * Perform health check
   */
  async healthCheck(): Promise<FeaturePodHealth> {
    try {
      const dependencyStatus: Record<string, 'available' | 'missing' | 'error'> = {};

      // Check dependencies
      if (this.config.dependencies) {
        for (const dependency of this.config.dependencies) {
          try {
            if (this.apiRegistry.hasFeature(dependency)) {
              dependencyStatus[dependency] = 'available';
            } else {
              dependencyStatus[dependency] = 'missing';
            }
          } catch (error) {
            dependencyStatus[dependency] = 'error';
          }
        }
      }

      // Update uptime
      this.metrics.uptime = Date.now() - this.startTime;

      // Determine overall status
      let status: FeaturePodHealth['status'] = 'healthy';
      
      if (this.isShuttingDown) {
        status = 'shutting-down';
      } else if (!this.isInitialized) {
        status = 'initializing';
      } else if (this.metrics.errors > 0) {
        status = 'degraded';
      }

      // Check if any dependencies are missing or in error
      const hasDependencyIssues = Object.values(dependencyStatus).some(s => s !== 'available');
      if (hasDependencyIssues && status === 'healthy') {
        status = 'degraded';
      }

      const health: FeaturePodHealth = {
        status,
        details: {
          dependencies: dependencyStatus,
          metrics: { ...this.metrics },
          lastHealthCheck: Date.now()
        }
      };

      // Add custom health check logic
      const customHealth = await this.customHealthCheck();
      if (customHealth) {
        if (customHealth.status && customHealth.status !== 'healthy') {
          health.status = customHealth.status;
        }
        if (customHealth.message) {
          health.message = customHealth.message;
        }
      }

      return health;

    } catch (error) {
      this.recordError(error as Error);
      
      return {
        status: 'error',
        details: {
          dependencies: {},
          metrics: { ...this.metrics },
          lastHealthCheck: Date.now()
        },
        message: `Health check failed: ${(error as Error).message}`
      };
    }
  }

  /**
   * Override this method for custom health check logic
   */
  protected async customHealthCheck(): Promise<Partial<FeaturePodHealth> | null> {
    return null;
  }

  // === METRICS & MONITORING ===

  private recordError(error: Error): void {
    this.metrics.errors++;
    this.metrics.lastError = {
      message: error.message,
      timestamp: Date.now()
    };
  }

  private updateEventProcessingTime(processingTime: number): void {
    const currentAvg = this.metrics.performance.averageEventProcessingTime;
    const count = this.metrics.eventsReceived;
    
    this.metrics.performance.averageEventProcessingTime = 
      (currentAvg * (count - 1) + processingTime) / count;
  }

  private updateAPIResponseTime(responseTime: number): void {
    const currentAvg = this.metrics.performance.averageAPIResponseTime;
    const count = this.metrics.apiCalls;
    
    this.metrics.performance.averageAPIResponseTime = 
      (currentAvg * (count - 1) + responseTime) / count;
  }

  // === PUBLIC API ===

  /**
   * Get feature information
   */
  getFeatureInfo(): { name: string; version: string; status: string; uptime: number } {
    return {
      name: this.config.name,
      version: this.config.version,
      status: this.isInitialized ? 'active' : 'inactive',
      uptime: Date.now() - this.startTime
    };
  }

  /**
   * Get feature metrics
   */
  getMetrics(): FeaturePodMetrics {
    this.metrics.uptime = Date.now() - this.startTime;
    return { ...this.metrics };
  }

  /**
   * Check if feature is ready
   */
  isReady(): boolean {
    return this.isInitialized && !this.isShuttingDown;
  }

  /**
   * Get feature configuration
   */
  getConfig(): FeaturePodConfig {
    return { ...this.config };
  }
}

// Export example implementation template
export abstract class ExampleFeaturePod extends FeaturePod {
  // Example of how to implement required abstract methods
  
  protected initializeAPI(): FeatureAPI {
    return {
      // Define your public API methods here
      exampleMethod: this.exampleMethod.bind(this),
      
      // Health check is automatically added by the base class
      healthCheck: this.healthCheck.bind(this)
    };
  }

  protected getAPIContract(): APIContract {
    return {
      name: this.config.name,
      version: this.config.version,
      description: this.config.description,
      methods: {
        exampleMethod: {
          description: 'Example method implementation',
          parameters: [
            {
              name: 'input',
              type: 'string',
              required: true,
              description: 'Example input parameter'
            }
          ],
          returnType: 'Promise<string>'
        }
      },
      events: {
        emits: ['example.event.emitted'],
        listensTo: ['other.feature.event']
      },
      dependencies: this.config.dependencies || [],
      compatibility: ['1.x']
    };
  }

  protected setupEventHandlers(): void {
    // Example event handler setup
    this.listenToEvent('other.feature.event', this.handleOtherFeatureEvent.bind(this));
  }

  // Example API method
  private async exampleMethod(input: string): Promise<string> {
    // Your feature logic here
    
    // Example of emitting an event
    this.emitEvent('example.event.emitted', { input, output: `Processed: ${input}` });
    
    return `Processed: ${input}`;
  }

  // Example event handler
  private async handleOtherFeatureEvent(event: EventData): Promise<void> {
    console.log(`Feature '${this.config.name}' received event:`, event);
    // Handle the event
  }
}

// Export for CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FeaturePod, ExampleFeaturePod };
}