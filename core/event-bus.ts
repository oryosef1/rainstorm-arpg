// Event Bus System - Revolutionary conflict-free communication
// Enables unlimited parallel development with zero conflicts

export interface EventData {
  name: string;
  data: any;
  source: string;
  timestamp: number;
  id: string;
  metadata?: Record<string, any>;
}

export interface EventListener {
  handler: (event: EventData) => void | Promise<void>;
  featureName: string;
  timestamp: number;
  priority?: number;
  once?: boolean;
}

export interface EventMiddleware {
  name: string;
  process: (event: EventData) => EventData | Promise<EventData>;
  priority: number;
}

export interface EventBusConfig {
  maxLogSize?: number;
  enableDebugLogging?: boolean;
  enablePerformanceMetrics?: boolean;
  middleware?: EventMiddleware[];
  globalErrorHandler?: (error: Error, event: EventData) => void;
}

export interface EventMetrics {
  totalEvents: number;
  eventsPerSecond: number;
  averageProcessingTime: number;
  errorRate: number;
  topEvents: Array<{ name: string; count: number }>;
  performanceByEvent: Map<string, { count: number; totalTime: number; avgTime: number }>;
}

export class EventBus {
  private listeners: Map<string, EventListener[]> = new Map();
  private eventLog: EventData[] = [];
  private middleware: EventMiddleware[] = [];
  private config: EventBusConfig;
  private metrics: EventMetrics;
  private startTime: number;
  private eventCounts: Map<string, number> = new Map();
  private performanceData: Map<string, number[]> = new Map();

  constructor(config: EventBusConfig = {}) {
    this.config = {
      maxLogSize: config.maxLogSize || 10000,
      enableDebugLogging: config.enableDebugLogging ?? true,
      enablePerformanceMetrics: config.enablePerformanceMetrics ?? true,
      middleware: config.middleware || [],
      ...config
    };

    this.startTime = Date.now();
    this.metrics = this.initializeMetrics();
    
    // Add default middleware
    this.addMiddleware({
      name: 'performance-tracker',
      priority: 1000,
      process: this.performanceTrackingMiddleware.bind(this)
    });

    this.addMiddleware({
      name: 'validation',
      priority: 2000,
      process: this.validationMiddleware.bind(this)
    });

    // Setup periodic metrics calculation
    this.startMetricsCalculation();

    if (this.config.enableDebugLogging) {
      console.log('🚀 Event Bus System initialized - Ready for conflict-free parallel development');
    }
  }

  private initializeMetrics(): EventMetrics {
    return {
      totalEvents: 0,
      eventsPerSecond: 0,
      averageProcessingTime: 0,
      errorRate: 0,
      topEvents: [],
      performanceByEvent: new Map()
    };
  }

  // === EVENT SUBSCRIPTION ===

  /**
   * Subscribe to events - Core of conflict-free communication
   */
  on(eventName: string, handler: (event: EventData) => void | Promise<void>, featureName: string, options: { priority?: number; once?: boolean } = {}): string {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }

    const listener: EventListener = {
      handler,
      featureName,
      timestamp: Date.now(),
      priority: options.priority || 0,
      once: options.once || false
    };

    const listeners = this.listeners.get(eventName)!;
    listeners.push(listener);
    
    // Sort by priority (higher priority first)
    listeners.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    const listenerId = `${featureName}_${eventName}_${Date.now()}`;

    if (this.config.enableDebugLogging) {
      console.log(`📡 Feature '${featureName}' subscribed to event '${eventName}' (priority: ${listener.priority})`);
    }

    return listenerId;
  }

  /**
   * Subscribe to event once only
   */
  once(eventName: string, handler: (event: EventData) => void | Promise<void>, featureName: string, priority: number = 0): string {
    return this.on(eventName, handler, featureName, { priority, once: true });
  }

  /**
   * Unsubscribe from events
   */
  off(eventName: string, featureName?: string): void {
    if (!this.listeners.has(eventName)) {
      return;
    }

    const listeners = this.listeners.get(eventName)!;
    
    if (featureName) {
      // Remove listeners for specific feature
      const filteredListeners = listeners.filter(l => l.featureName !== featureName);
      this.listeners.set(eventName, filteredListeners);
      
      if (this.config.enableDebugLogging) {
        console.log(`📡 Feature '${featureName}' unsubscribed from event '${eventName}'`);
      }
    } else {
      // Remove all listeners for event
      this.listeners.delete(eventName);
      
      if (this.config.enableDebugLogging) {
        console.log(`📡 All listeners removed for event '${eventName}'`);
      }
    }
  }

  // === EVENT EMISSION ===

  /**
   * Emit events - Zero-conflict communication between features
   */
  async emit(eventName: string, data: any, source: string, metadata: Record<string, any> = {}): Promise<void> {
    const startTime = Date.now();

    const event: EventData = {
      name: eventName,
      data,
      source,
      timestamp: startTime,
      id: this.generateEventId(),
      metadata
    };

    try {
      // Process through middleware pipeline
      const processedEvent = await this.processMiddleware(event);

      // Log event for debugging and metrics
      this.logEvent(processedEvent);

      // Notify all listeners
      await this.notifyListeners(processedEvent);

      // Update metrics
      this.updateMetrics(eventName, Date.now() - startTime);

      if (this.config.enableDebugLogging) {
        console.log(`📤 Event '${eventName}' emitted by '${source}' - ${this.getListenerCount(eventName)} listeners notified`);
      }

    } catch (error) {
      console.error(`❌ Error processing event '${eventName}':`, error);
      
      if (this.config.globalErrorHandler) {
        this.config.globalErrorHandler(error as Error, event);
      }
      
      throw error;
    }
  }

  /**
   * Emit event synchronously (non-blocking)
   */
  emitSync(eventName: string, data: any, source: string, metadata: Record<string, any> = {}): void {
    // Fire and forget - doesn't wait for listeners
    this.emit(eventName, data, source, metadata).catch(error => {
      console.error(`❌ Async error in event '${eventName}':`, error);
    });
  }

  // === MIDDLEWARE SYSTEM ===

  /**
   * Add middleware for event processing
   */
  addMiddleware(middleware: EventMiddleware): void {
    this.middleware.push(middleware);
    this.middleware.sort((a, b) => a.priority - b.priority);
    
    if (this.config.enableDebugLogging) {
      console.log(`🔧 Middleware '${middleware.name}' added (priority: ${middleware.priority})`);
    }
  }

  /**
   * Remove middleware
   */
  removeMiddleware(name: string): void {
    this.middleware = this.middleware.filter(m => m.name !== name);
    
    if (this.config.enableDebugLogging) {
      console.log(`🔧 Middleware '${name}' removed`);
    }
  }

  private async processMiddleware(event: EventData): Promise<EventData> {
    let processedEvent = event;

    for (const middleware of this.middleware) {
      try {
        processedEvent = await middleware.process(processedEvent);
      } catch (error) {
        console.error(`❌ Middleware '${middleware.name}' failed:`, error);
        throw error;
      }
    }

    return processedEvent;
  }

  private async performanceTrackingMiddleware(event: EventData): Promise<EventData> {
    if (!this.config.enablePerformanceMetrics) {
      return event;
    }

    // Track performance data
    if (!this.performanceData.has(event.name)) {
      this.performanceData.set(event.name, []);
    }

    return {
      ...event,
      metadata: {
        ...event.metadata,
        performanceTrackingStart: Date.now()
      }
    };
  }

  private async validationMiddleware(event: EventData): Promise<EventData> {
    // Validate event structure
    if (!event.name || typeof event.name !== 'string') {
      throw new Error('Event name must be a non-empty string');
    }

    if (!event.source || typeof event.source !== 'string') {
      throw new Error('Event source must be a non-empty string');
    }

    if (!event.id) {
      throw new Error('Event must have a unique ID');
    }

    return event;
  }

  // === EVENT PROCESSING ===

  private async notifyListeners(event: EventData): Promise<void> {
    const listeners = this.listeners.get(event.name);
    if (!listeners || listeners.length === 0) {
      return;
    }

    const promises: Promise<void>[] = [];

    for (const listener of listeners) {
      const promise = this.executeListener(listener, event);
      promises.push(promise);

      // Remove one-time listeners
      if (listener.once) {
        this.removeListener(event.name, listener);
      }
    }

    // Wait for all listeners to complete
    await Promise.allSettled(promises);
  }

  private async executeListener(listener: EventListener, event: EventData): Promise<void> {
    try {
      await listener.handler(event);
    } catch (error) {
      console.error(`❌ Error in listener for '${event.name}' from feature '${listener.featureName}':`, error);
      
      // Don't let one listener's error affect others
      if (this.config.globalErrorHandler) {
        this.config.globalErrorHandler(error as Error, event);
      }
    }
  }

  private removeListener(eventName: string, listenerToRemove: EventListener): void {
    const listeners = this.listeners.get(eventName);
    if (listeners) {
      const index = listeners.indexOf(listenerToRemove);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // === LOGGING & METRICS ===

  private logEvent(event: EventData): void {
    this.eventLog.push(event);

    // Maintain log size limit
    if (this.eventLog.length > this.config.maxLogSize!) {
      this.eventLog = this.eventLog.slice(-this.config.maxLogSize!);
    }
  }

  private updateMetrics(eventName: string, processingTime: number): void {
    this.metrics.totalEvents++;
    
    // Update event counts
    const currentCount = this.eventCounts.get(eventName) || 0;
    this.eventCounts.set(eventName, currentCount + 1);

    // Update performance data
    if (!this.performanceData.has(eventName)) {
      this.performanceData.set(eventName, []);
    }
    this.performanceData.get(eventName)!.push(processingTime);
  }

  private startMetricsCalculation(): void {
    setInterval(() => {
      this.calculateMetrics();
    }, 5000); // Update metrics every 5 seconds
  }

  private calculateMetrics(): void {
    const now = Date.now();
    const uptime = now - this.startTime;
    
    // Events per second
    this.metrics.eventsPerSecond = this.metrics.totalEvents / (uptime / 1000);

    // Average processing time
    const allTimes: number[] = [];
    for (const times of this.performanceData.values()) {
      allTimes.push(...times);
    }
    this.metrics.averageProcessingTime = allTimes.length > 0 
      ? allTimes.reduce((sum, time) => sum + time, 0) / allTimes.length 
      : 0;

    // Top events
    const sortedEvents = Array.from(this.eventCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
    this.metrics.topEvents = sortedEvents;

    // Performance by event
    this.metrics.performanceByEvent.clear();
    for (const [eventName, times] of this.performanceData.entries()) {
      if (times.length > 0) {
        const count = times.length;
        const totalTime = times.reduce((sum, time) => sum + time, 0);
        const avgTime = totalTime / count;
        
        this.metrics.performanceByEvent.set(eventName, {
          count,
          totalTime,
          avgTime
        });
      }
    }
  }

  // === UTILITY METHODS ===

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getListenerCount(eventName: string): number {
    return this.listeners.get(eventName)?.length || 0;
  }

  // === PUBLIC API ===

  /**
   * Get current event metrics
   */
  getMetrics(): EventMetrics {
    return { ...this.metrics };
  }

  /**
   * Get event log for debugging
   */
  getEventLog(limit?: number): EventData[] {
    if (limit) {
      return this.eventLog.slice(-limit);
    }
    return [...this.eventLog];
  }

  /**
   * Get active listeners
   */
  getActiveListeners(): Map<string, string[]> {
    const result = new Map<string, string[]>();
    
    for (const [eventName, listeners] of this.listeners.entries()) {
      const featureNames = listeners.map(l => l.featureName);
      result.set(eventName, featureNames);
    }
    
    return result;
  }

  /**
   * Health check for monitoring
   */
  getHealthStatus(): { status: string; metrics: EventMetrics; uptime: number } {
    return {
      status: 'healthy',
      metrics: this.getMetrics(),
      uptime: Date.now() - this.startTime
    };
  }

  /**
   * Wait for specific event
   */
  waitForEvent(eventName: string, timeout: number = 10000): Promise<EventData> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.off(eventName, 'wait-for-event');
        reject(new Error(`Timeout waiting for event '${eventName}'`));
      }, timeout);

      this.once(eventName, (event) => {
        clearTimeout(timeoutId);
        resolve(event);
      }, 'wait-for-event');
    });
  }

  /**
   * Clear all event data (for testing)
   */
  clear(): void {
    this.listeners.clear();
    this.eventLog = [];
    this.eventCounts.clear();
    this.performanceData.clear();
    this.metrics = this.initializeMetrics();
    
    if (this.config.enableDebugLogging) {
      console.log('🧹 Event Bus cleared');
    }
  }

  /**
   * Shutdown event bus
   */
  shutdown(): void {
    this.clear();
    console.log('🛑 Event Bus shutdown complete');
  }
}

// Global event bus instance for the application
export const globalEventBus = new EventBus({
  enableDebugLogging: true,
  enablePerformanceMetrics: true,
  maxLogSize: 10000
});

// Export for CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EventBus, globalEventBus };
}