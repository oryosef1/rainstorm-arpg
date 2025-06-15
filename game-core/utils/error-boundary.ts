// RainStorm ARPG - Error Boundary & Recovery System
// Automatic error detection, recovery, and system resilience

import { IWorld, IEntity, ISystem } from '../ecs/ecs-core';
import { SystemMetrics } from '../../types/ecs-types';

export interface ErrorContext {
  timestamp: number;
  source: string;
  entityId?: string | undefined;
  systemName?: string | undefined;
  componentType?: string | undefined;
  stack?: string | undefined;
  metadata?: Record<string, any> | undefined;
}

export interface RecoveryStrategy {
  name: string;
  priority: number;
  canHandle(error: Error, context: ErrorContext): boolean;
  recover(error: Error, context: ErrorContext, world: IWorld): Promise<boolean>;
  description: string;
}

export interface ErrorBoundaryConfig {
  maxErrorsPerMinute: number;
  enableAutoRecovery: boolean;
  enableSystemIsolation: boolean;
  enableEntityQuarantine: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  recoveryStrategies: RecoveryStrategy[];
}

export interface SystemHealth {
  systemName: string;
  errorCount: number;
  lastError?: Date;
  status: 'healthy' | 'degraded' | 'critical' | 'isolated';
  executionTime: number;
  entityCount: number;
  recoveryAttempts: number;
}

export class ErrorBoundary {
  private world: IWorld;
  private config: ErrorBoundaryConfig;
  private errorHistory: ErrorContext[] = [];
  private systemHealth: Map<string, SystemHealth> = new Map();
  private quarantinedEntities: Set<string> = new Set();
  private isolatedSystems: Set<string> = new Set();
  private recoveryStrategies: RecoveryStrategy[] = [];
  private originalErrorHandler: any = null;

  constructor(world: IWorld, config?: Partial<ErrorBoundaryConfig>) {
    this.world = world;
    this.config = {
      maxErrorsPerMinute: 10,
      enableAutoRecovery: true,
      enableSystemIsolation: true,
      enableEntityQuarantine: true,
      logLevel: 'warn',
      recoveryStrategies: [],
      ...config
    };

    this.setupDefaultRecoveryStrategies();
    this.setupErrorHandlers();
    this.startHealthMonitoring();
    
    this.log('ErrorBoundary initialized with auto-recovery enabled', 'info');
  }

  private setupDefaultRecoveryStrategies(): void {
    this.recoveryStrategies = [
      new SystemRestartStrategy(),
      new EntityQuarantineStrategy(),
      new ComponentResetStrategy(),
      new SystemIsolationStrategy(),
      new GracefulDegradationStrategy(),
      ...this.config.recoveryStrategies
    ];

    // Sort by priority (higher = more important)
    this.recoveryStrategies.sort((a, b) => b.priority - a.priority);
  }

  private setupErrorHandlers(): void {
    // Capture global errors
    this.originalErrorHandler = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      this.handleError(error || new Error(String(message)), {
        timestamp: Date.now(),
        source: 'global',
        stack: `${source}:${lineno}:${colno}`,
        metadata: { message, source, lineno, colno }
      });

      // Call original handler if it exists
      if (this.originalErrorHandler) {
        if (typeof this.originalErrorHandler === 'function') {
          // @ts-ignore - Complex type handling for window.onerror
          return this.originalErrorHandler(message, source, lineno, colno, error);
        }
      }
      return false;
    };

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(new Error(String(event.reason)), {
        timestamp: Date.now(),
        source: 'promise',
        stack: event.reason?.stack,
        metadata: { reason: event.reason }
      });
    });

    // Wrap system update methods to catch errors
    this.wrapSystemMethods();
  }

  private wrapSystemMethods(): void {
    for (const [name, system] of this.world.systems) {
      this.wrapSystemUpdate(system, name);
    }

    // Listen for new systems being added
    this.world.on('systemAdded', (data: any) => {
      const system = this.world.getSystem(data.systemName);
      if (system) {
        this.wrapSystemUpdate(system, data.systemName);
      }
    });
  }

  private wrapSystemUpdate(system: ISystem, systemName: string): void {
    if ('_errorBoundaryWrapped' in system) return; // Already wrapped

    const originalUpdate = system.update.bind(system);
    
    system.update = (deltaTime: number) => {
      try {
        const startTime = performance.now();
        originalUpdate(deltaTime);
        const endTime = performance.now();
        
        this.updateSystemHealth(systemName, endTime - startTime, system.entities.size);
      } catch (error) {
        this.handleSystemError(error as Error, systemName, system);
      }
    };

    (system as any)._errorBoundaryWrapped = true;
  }

  private updateSystemHealth(systemName: string, executionTime: number, entityCount: number): void {
    let health = this.systemHealth.get(systemName);
    if (!health) {
      health = {
        systemName,
        errorCount: 0,
        status: 'healthy',
        executionTime: 0,
        entityCount: 0,
        recoveryAttempts: 0
      };
      this.systemHealth.set(systemName, health);
    }

    health.executionTime = executionTime;
    health.entityCount = entityCount;

    // Check for performance degradation
    if (executionTime > 50) { // More than 50ms
      health.status = 'degraded';
      this.log(`System ${systemName} showing performance degradation: ${executionTime.toFixed(2)}ms`, 'warn');
    } else if (health.status === 'degraded' && executionTime < 20) {
      health.status = 'healthy';
      this.log(`System ${systemName} performance recovered`, 'info');
    }
  }

  private handleSystemError(error: Error, systemName: string, system: ISystem): void {
    const context: ErrorContext = {
      timestamp: Date.now(),
      source: 'system',
      systemName,
      stack: error.stack || undefined,
      metadata: {
        entityCount: system.entities.size,
        systemEnabled: system.enabled
      }
    };

    this.handleError(error, context);
  }

  public async handleError(error: Error, context: ErrorContext): Promise<void> {
    // Add to error history
    this.errorHistory.push(context);
    
    // Keep only recent errors (last 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    this.errorHistory = this.errorHistory.filter(e => e.timestamp > fiveMinutesAgo);

    // Update system health if this is a system error
    if (context.systemName) {
      const health = this.systemHealth.get(context.systemName);
      if (health) {
        health.errorCount++;
        health.lastError = new Date();
        health.status = health.errorCount > 5 ? 'critical' : 'degraded';
      }
    }

    this.log(`Error captured: ${error.message}`, 'error', context);

    // Check if we're getting too many errors
    if (this.isErrorFlood()) {
      this.log('Error flood detected - enabling emergency mode', 'error');
      this.enableEmergencyMode();
      return;
    }

    // Attempt recovery if enabled
    if (this.config.enableAutoRecovery) {
      await this.attemptRecovery(error, context);
    }

    // Notify dashboard if available
    this.notifyDashboard('error', { error: error.message, context });
  }

  private isErrorFlood(): boolean {
    const oneMinuteAgo = Date.now() - 60 * 1000;
    const recentErrors = this.errorHistory.filter(e => e.timestamp > oneMinuteAgo);
    return recentErrors.length > this.config.maxErrorsPerMinute;
  }

  private async attemptRecovery(error: Error, context: ErrorContext): Promise<void> {
    this.log(`Attempting recovery for error: ${error.message}`, 'info');

    for (const strategy of this.recoveryStrategies) {
      if (strategy.canHandle(error, context)) {
        try {
          this.log(`Trying recovery strategy: ${strategy.name}`, 'info');
          const success = await strategy.recover(error, context, this.world);
          
          if (success) {
            this.log(`Recovery successful using strategy: ${strategy.name}`, 'info');
            this.notifyDashboard('recovery', { 
              strategy: strategy.name, 
              context,
              success: true 
            });
            return;
          }
        } catch (recoveryError) {
          this.log(`Recovery strategy ${strategy.name} failed: ${recoveryError}`, 'warn');
        }
      }
    }

    this.log('All recovery strategies failed', 'error');
    this.notifyDashboard('recovery', { context, success: false });
  }

  private enableEmergencyMode(): void {
    this.log('Entering emergency mode - isolating all systems', 'error');

    // Disable all non-critical systems
    for (const [name, system] of this.world.systems) {
      if (!this.isCriticalSystem(name)) {
        system.enabled = false;
        this.isolatedSystems.add(name);
        this.log(`Isolated system: ${name}`, 'warn');
      }
    }

    // Clear error history to prevent recursive emergency mode
    this.errorHistory = [];
  }

  private isCriticalSystem(systemName: string): boolean {
    // Define which systems are critical and should never be disabled
    const criticalSystems = ['RenderSystem', 'InputSystem'];
    return criticalSystems.includes(systemName);
  }

  public quarantineEntity(entityId: string, reason: string): void {
    if (this.config.enableEntityQuarantine) {
      this.quarantinedEntities.add(entityId);
      
      // Remove entity from all systems
      for (const system of this.world.systems.values()) {
        const entity = this.world.getEntity(entityId);
        if (entity && system.entities.has(entity)) {
          system.removeEntity(entity);
        }
      }

      this.log(`Entity ${entityId} quarantined: ${reason}`, 'warn');
      this.notifyDashboard('quarantine', { entityId, reason });
    }
  }

  public releaseEntity(entityId: string): void {
    if (this.quarantinedEntities.has(entityId)) {
      this.quarantinedEntities.delete(entityId);
      
      // Re-add entity to appropriate systems
      const entity = this.world.getEntity(entityId);
      if (entity) {
        for (const system of this.world.systems.values()) {
          if (system.canProcess(entity)) {
            system.addEntity(entity);
          }
        }
      }

      this.log(`Entity ${entityId} released from quarantine`, 'info');
      this.notifyDashboard('release', { entityId });
    }
  }

  public isolateSystem(systemName: string, reason: string): void {
    if (this.config.enableSystemIsolation && !this.isCriticalSystem(systemName)) {
      const system = this.world.getSystem(systemName);
      if (system) {
        system.enabled = false;
        this.isolatedSystems.add(systemName);
        
        const health = this.systemHealth.get(systemName);
        if (health) {
          health.status = 'isolated';
        }

        this.log(`System ${systemName} isolated: ${reason}`, 'warn');
        this.notifyDashboard('isolate', { systemName, reason });
      }
    }
  }

  public restoreSystem(systemName: string): void {
    if (this.isolatedSystems.has(systemName)) {
      const system = this.world.getSystem(systemName);
      if (system) {
        system.enabled = true;
        this.isolatedSystems.delete(systemName);
        
        const health = this.systemHealth.get(systemName);
        if (health) {
          health.status = 'healthy';
          health.errorCount = 0;
          health.recoveryAttempts++;
        }

        this.log(`System ${systemName} restored`, 'info');
        this.notifyDashboard('restore', { systemName });
      }
    }
  }

  private startHealthMonitoring(): void {
    setInterval(() => {
      this.performHealthCheck();
    }, 10000); // Every 10 seconds
  }

  private performHealthCheck(): void {
    const now = Date.now();
    const healthReport: any = {
      timestamp: now,
      systems: [],
      quarantinedEntities: this.quarantinedEntities.size,
      isolatedSystems: this.isolatedSystems.size,
      errorCount: this.errorHistory.length
    };

    for (const [name, health] of this.systemHealth) {
      // Check if system has been error-free for a while
      if (health.lastError && now - health.lastError.getTime() > 60000) { // 1 minute
        if (health.status !== 'healthy' && health.status !== 'isolated') {
          health.status = 'healthy';
          health.errorCount = 0;
          this.log(`System ${name} automatically marked as healthy`, 'info');
        }
      }

      healthReport.systems.push({
        name,
        status: health.status,
        errorCount: health.errorCount,
        executionTime: health.executionTime,
        entityCount: health.entityCount
      });
    }

    this.notifyDashboard('healthCheck', healthReport);
  }

  public getSystemHealth(systemName?: string): SystemHealth | SystemHealth[] {
    if (systemName) {
      return this.systemHealth.get(systemName) || {
        systemName,
        errorCount: 0,
        status: 'healthy',
        executionTime: 0,
        entityCount: 0,
        recoveryAttempts: 0
      };
    }
    return Array.from(this.systemHealth.values());
  }

  public getErrorHistory(): ErrorContext[] {
    return [...this.errorHistory];
  }

  public clearErrorHistory(): void {
    this.errorHistory = [];
    this.log('Error history cleared', 'info');
  }

  public getQuarantinedEntities(): string[] {
    return Array.from(this.quarantinedEntities);
  }

  public getIsolatedSystems(): string[] {
    return Array.from(this.isolatedSystems);
  }

  private log(message: string, level: 'debug' | 'info' | 'warn' | 'error', context?: ErrorContext): void {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const configLevel = levels[this.config.logLevel];
    const messageLevel = levels[level];

    if (messageLevel >= configLevel) {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] [ErrorBoundary] [${level.toUpperCase()}] ${message}`;
      
      switch (level) {
        case 'error':
          console.error(logMessage, context);
          break;
        case 'warn':
          console.warn(logMessage, context);
          break;
        case 'info':
          console.info(logMessage, context);
          break;
        case 'debug':
          console.debug(logMessage, context);
          break;
      }
    }
  }

  private notifyDashboard(type: string, data: any): void {
    // Notify dashboard if integration is available
    if ((window as any).dashboardIntegration) {
      (window as any).dashboardIntegration.logEvent(`errorBoundary_${type}`, data);
    }
  }

  public destroy(): void {
    // Restore original error handler
    if (this.originalErrorHandler) {
      window.onerror = this.originalErrorHandler;
    } else {
      window.onerror = null;
    }

    // Clear all data
    this.errorHistory = [];
    this.systemHealth.clear();
    this.quarantinedEntities.clear();
    this.isolatedSystems.clear();
  }
}

// =============================================================================
// RECOVERY STRATEGIES
// =============================================================================

class SystemRestartStrategy implements RecoveryStrategy {
  name = 'SystemRestart';
  priority = 90;
  description = 'Restart a failing system';

  canHandle(error: Error, context: ErrorContext): boolean {
    return context.source === 'system' && !!context.systemName;
  }

  async recover(error: Error, context: ErrorContext, world: IWorld): Promise<boolean> {
    if (!context.systemName) return false;

    const system = world.getSystem(context.systemName);
    if (!system) return false;

    try {
      // Disable system temporarily
      system.enabled = false;
      
      // Clear system entities
      system.cleanup();
      
      // Re-enable after short delay
      await new Promise(resolve => setTimeout(resolve, 100));
      system.enabled = true;
      
      // Re-add entities that match system requirements
      for (const entity of world.entities.values()) {
        if (system.canProcess(entity)) {
          system.addEntity(entity);
        }
      }

      return true;
    } catch (e) {
      return false;
    }
  }
}

class EntityQuarantineStrategy implements RecoveryStrategy {
  name = 'EntityQuarantine';
  priority = 80;
  description = 'Quarantine problematic entities';

  canHandle(error: Error, context: ErrorContext): boolean {
    return !!context.entityId;
  }

  async recover(error: Error, context: ErrorContext, world: IWorld): Promise<boolean> {
    if (!context.entityId) return false;

    const entity = world.getEntity(context.entityId);
    if (!entity) return false;

    try {
      // Remove entity from all systems temporarily
      for (const system of world.systems.values()) {
        if (system.entities.has(entity)) {
          system.removeEntity(entity);
        }
      }

      // Mark entity as inactive
      entity.active = false;

      return true;
    } catch (e) {
      return false;
    }
  }
}

class ComponentResetStrategy implements RecoveryStrategy {
  name = 'ComponentReset';
  priority = 70;
  description = 'Reset problematic components to default state';

  canHandle(error: Error, context: ErrorContext): boolean {
    return !!context.componentType && !!context.entityId;
  }

  async recover(error: Error, context: ErrorContext, world: IWorld): Promise<boolean> {
    if (!context.entityId || !context.componentType) return false;

    const entity = world.getEntity(context.entityId);
    if (!entity) return false;

    try {
      const component = entity.getComponent(context.componentType);
      if (component && 'reset' in component && typeof component.reset === 'function') {
        (component as any).reset();
        return true;
      }
      
      // If no reset method, try to remove and re-add component
      entity.removeComponent(context.componentType);
      return true;
    } catch (e) {
      return false;
    }
  }
}

class SystemIsolationStrategy implements RecoveryStrategy {
  name = 'SystemIsolation';
  priority = 60;
  description = 'Temporarily isolate a failing system';

  canHandle(error: Error, context: ErrorContext): boolean {
    return context.source === 'system' && !!context.systemName;
  }

  async recover(error: Error, context: ErrorContext, world: IWorld): Promise<boolean> {
    if (!context.systemName) return false;

    const system = world.getSystem(context.systemName);
    if (!system) return false;

    try {
      // Disable system for 30 seconds
      system.enabled = false;
      
      setTimeout(() => {
        system.enabled = true;
      }, 30000);

      return true;
    } catch (e) {
      return false;
    }
  }
}

class GracefulDegradationStrategy implements RecoveryStrategy {
  name = 'GracefulDegradation';
  priority = 50;
  description = 'Reduce system complexity to maintain stability';

  canHandle(error: Error, context: ErrorContext): boolean {
    return true; // Can handle any error as last resort
  }

  async recover(error: Error, context: ErrorContext, world: IWorld): Promise<boolean> {
    try {
      // Reduce entity count by removing oldest entities
      const entities = Array.from(world.entities.values());
      if (entities.length > 100) {
        const entitiesToRemove = entities.slice(0, entities.length - 100);
        for (const entity of entitiesToRemove) {
          world.destroyEntity(entity.id);
        }
      }

      // Disable non-essential systems temporarily
      const nonEssentialSystems = ['ParticleSystem', 'AudioSystem', 'AnalyticsSystem'];
      for (const systemName of nonEssentialSystems) {
        const system = world.getSystem(systemName);
        if (system) {
          system.enabled = false;
          setTimeout(() => {
            system.enabled = true;
          }, 60000); // Re-enable after 1 minute
        }
      }

      return true;
    } catch (e) {
      return false;
    }
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function addErrorBoundary(world: IWorld, config?: Partial<ErrorBoundaryConfig>): ErrorBoundary {
  const errorBoundary = new ErrorBoundary(world, config);
  
  // Store reference for debugging and dashboard access
  (window as any).errorBoundary = errorBoundary;
  
  return errorBoundary;
}