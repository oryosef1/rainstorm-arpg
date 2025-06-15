// Agent Dashboard Pod - Main orchestration system for Claude Code integration
// Revolutionary AI development dashboard providing complete productivity suite

import { EventEmitter } from 'events';
import {
  DashboardConfig,
  EventBus,
  ClaudeConfig,
  ClaudeResult,
  ClaudeSession,
  Workflow,
  WorkflowContext,
  WorkflowExecution,
  PermissionProfile,
  DashboardError,
  DashboardState,
  SystemMetrics,
  RealtimeEvent,
  AuditLogEntry
} from './types/index.js';

// Import core services
import { ClaudeIntegration } from './services/claude-integration.js';
import { WorkflowEngine } from './services/workflow-engine.js';
import { RealtimeSystem } from './services/realtime-system.js';
import { PermissionManager } from './services/permission-system.js';
import { AgentDashboardAPI } from './agent-dashboard.api.js';

export class AgentDashboardPod extends EventEmitter implements EventBus {
  public readonly name: string = 'agent-dashboard';
  public readonly version: string = '1.0.0';
  public readonly dependencies: string[] = ['event-bus', 'permission-system'];
  
  public config: DashboardConfig;
  public api: AgentDashboardAPI;
  public eventBus: EventBus;
  
  // Core systems
  public claudeIntegration: ClaudeIntegration;
  public workflowEngine: WorkflowEngine;
  public realtimeSystem: RealtimeSystem;
  public permissionManager: PermissionManager;
  
  // State management
  private state: DashboardState;
  private monitoringInterval?: NodeJS.Timeout;
  private readonly startTime: number = Date.now();
  private isInitialized: boolean = false;
  
  constructor(config: Partial<DashboardConfig> = {}) {
    super();
    
    // Set up comprehensive configuration with defaults
    this.config = {
      debug: config.debug ?? true,
      enableRealtime: config.enableRealtime ?? true,
      permissions: {
        defaultProfile: config.permissions?.defaultProfile ?? 'trusted-developer',
        strictMode: config.permissions?.strictMode ?? false,
        auditLogging: config.permissions?.auditLogging ?? true,
        ...config.permissions
      },
      claude: {
        maxConcurrentSessions: config.claude?.maxConcurrentSessions ?? 10,
        defaultTimeout: config.claude?.defaultTimeout ?? 300000,
        enableSimulation: config.claude?.enableSimulation ?? true,
        ...config.claude
      },
      workflows: {
        enableVisualBuilder: config.workflows?.enableVisualBuilder ?? true,
        saveToStorage: config.workflows?.saveToStorage ?? true,
        maxConcurrentWorkflows: config.workflows?.maxConcurrentWorkflows ?? 5,
        defaultTimeout: config.workflows?.defaultTimeout ?? 600000,
        ...config.workflows
      },
      realtime: {
        enableMetrics: config.realtime?.enableMetrics ?? true,
        metricsInterval: config.realtime?.metricsInterval ?? 5000,
        eventRetention: config.realtime?.eventRetention ?? 1000,
        maxConnections: config.realtime?.maxConnections ?? 100,
        ...config.realtime
      },
      security: {
        sessionTimeout: config.security?.sessionTimeout ?? 3600000,
        ...config.security
      },
      ...config
    };
    
    // Initialize state
    this.state = {
      claude: {
        sessions: [],
        activeSessions: 0,
        isConnected: false,
        currentExecution: null,
        executionHistory: []
      },
      workflows: {
        activeWorkflows: [],
        templates: [],
        executionHistory: [],
        isBuilderOpen: false,
        selectedWorkflow: null
      },
      realtime: {
        connections: 0,
        isConnected: false,
        events: [],
        metrics: {
          cpu: 0,
          memory: 0,
          disk: 0,
          network: 0,
          activeConnections: 0,
          responseTime: 0,
          throughput: 0,
          timestamp: Date.now()
        },
        subscriptions: []
      },
      permissions: {
        activeSessions: [],
        profiles: [],
        auditLog: []
      },
      system: {
        health: 'healthy',
        alerts: [],
        performance: {
          responseTime: { average: 0, p50: 0, p95: 0, p99: 0 },
          throughput: { requestsPerSecond: 0, claudeExecutionsPerMinute: 0, workflowsPerHour: 0 },
          resources: { cpuUsage: 0, memoryUsage: 0, diskUsage: 0, networkIO: 0 },
          errors: { errorRate: 0, errorCount: 0 }
        },
        uptime: 0
      }
    };
    
    // Set up event bus
    this.eventBus = this;
    
    // Initialize core systems
    this.initializeCoreServices();
  }
  
  private initializeCoreServices(): void {
    try {
      // Initialize core services with proper TypeScript types
      this.claudeIntegration = new ClaudeIntegration(this.config.claude);
      this.workflowEngine = new WorkflowEngine(this.config.workflows);
      this.realtimeSystem = new RealtimeSystem(this.config.realtime);
      this.permissionManager = new PermissionManager(this.config.permissions);
      
      // Initialize API layer
      this.api = new AgentDashboardAPI({
        claudeIntegration: this.claudeIntegration,
        workflowEngine: this.workflowEngine,
        permissionManager: this.permissionManager,
        eventBus: this.eventBus
      });
      
      if (this.config.debug) {
        console.log('🔧 Core services initialized with TypeScript types');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to initialize core services:', message);
      throw new DashboardError('Service initialization failed', 'INIT_ERROR', { error: message });
    }
  }
  
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      throw new DashboardError('Dashboard already initialized', 'ALREADY_INITIALIZED');
    }
    
    try {
      console.log('🚀 Initializing Agent Dashboard Pod...');
      
      // Initialize all core systems
      await this.claudeIntegration.initialize();
      await this.workflowEngine.initialize();
      await this.realtimeSystem.initialize();
      await this.permissionManager.initialize?.();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Start monitoring systems
      this.startMonitoring();
      
      // Load initial data
      await this.loadInitialData();
      
      this.isInitialized = true;
      console.log('✅ Agent Dashboard Pod initialized successfully');
      
      // Emit initialization event
      this.emit('dashboard:initialized', {
        version: this.version,
        timestamp: Date.now(),
        features: ['claude-integration', 'workflow-engine', 'realtime-monitoring', 'permission-system']
      });
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to initialize Agent Dashboard:', message);
      this.emit('dashboard:error', { error: message });
      throw error;
    }
  }
  
  private setupEventListeners(): void {
    // Claude integration events
    this.claudeIntegration.on('session:created', this.handleClaudeSessionCreated.bind(this));
    this.claudeIntegration.on('session:ended', this.handleClaudeSessionEnded.bind(this));
    this.claudeIntegration.on('execution:started', this.handleClaudeExecutionStarted.bind(this));
    this.claudeIntegration.on('execution:completed', this.handleClaudeExecutionCompleted.bind(this));
    this.claudeIntegration.on('execution:error', this.handleClaudeExecutionError.bind(this));
    
    // Workflow engine events
    this.workflowEngine.on('workflow:started', this.handleWorkflowStarted.bind(this));
    this.workflowEngine.on('workflow:completed', this.handleWorkflowCompleted.bind(this));
    this.workflowEngine.on('workflow:failed', this.handleWorkflowFailed.bind(this));
    this.workflowEngine.on('workflow:step:completed', this.handleWorkflowStepCompleted.bind(this));
    
    // Permission system events
    this.permissionManager.on('session:created', this.handlePermissionSessionCreated.bind(this));
    this.permissionManager.on('operation:denied', this.handleOperationDenied.bind(this));
    this.permissionManager.on('security:alert', this.handleSecurityAlert.bind(this));
    
    // Real-time system events
    this.realtimeSystem.on('connection:established', this.handleRealtimeConnection.bind(this));
    this.realtimeSystem.on('connection:lost', this.handleRealtimeDisconnection.bind(this));
    this.realtimeSystem.on('metrics:updated', this.handleMetricsUpdate.bind(this));
    
    if (this.config.debug) {
      console.log('📡 Event listeners configured');
    }
  }
  
  private async loadInitialData(): Promise<void> {
    try {
      // Load workflow templates
      this.state.workflows.templates = await this.workflowEngine.getTemplates();
      
      // Load permission profiles
      this.state.permissions.profiles = this.permissionManager.getAllProfiles();
      
      // Initialize metrics
      this.updateSystemMetrics();
      
      if (this.config.debug) {
        console.log('📊 Initial data loaded');
      }
    } catch (error) {
      console.warn('⚠️ Some initial data could not be loaded');
    }
  }
  
  private startMonitoring(): void {
    if (!this.config.realtime?.enableMetrics) return;
    
    // Start system metrics monitoring
    this.monitoringInterval = setInterval(() => {
      this.updateSystemMetrics();
      this.broadcastMetrics();
    }, this.config.realtime.metricsInterval);
    
    if (this.config.debug) {
      console.log('📊 System monitoring started');
    }
  }
  
  // === CLAUDE CODE INTEGRATION ===
  
  public async executeClaude(config: ClaudeConfig): Promise<ClaudeResult> {
    try {
      // Validate permissions first
      const permissionValidation = await this.permissionManager.validatePermissions(
        config.permissions,
        config.profile
      );
      
      if (!permissionValidation.authorized) {
        throw new DashboardError(
          `Permission denied: ${permissionValidation.reason}`,
          'PERMISSION_DENIED',
          { denied: permissionValidation.denied }
        );
      }
      
      // Execute Claude task
      const result = await this.claudeIntegration.execute(config);
      
      // Update state
      this.state.claude.executionHistory.push({
        id: result.sessionId,
        sessionId: result.sessionId,
        specialist: config.specialist || 'feature-builder',
        profile: config.profile || 'trusted-developer',
        message: config.userPrompt,
        status: 'completed',
        result,
        timestamp: Date.now(),
        duration: result.duration
      });
      
      // Emit success event
      this.emit('claude:execution:completed', { config, result });
      
      return result;
      
    } catch (error) {
      const dashboardError = error instanceof DashboardError ? error : 
        new DashboardError(`Claude execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'CLAUDE_EXECUTION_ERROR');
      
      this.emit('claude:execution:error', { config, error: dashboardError });
      throw dashboardError;
    }
  }
  
  // === WORKFLOW EXECUTION ===
  
  public async executeWorkflow(workflow: Workflow, context: WorkflowContext): Promise<WorkflowExecution> {
    try {
      // Validate workflow
      const validation = await this.workflowEngine.validateWorkflow(workflow);
      if (!validation.valid) {
        throw new DashboardError(
          `Invalid workflow: ${validation.errors?.join(', ')}`,
          'WORKFLOW_VALIDATION_ERROR',
          { errors: validation.errors }
        );
      }
      
      // Check concurrent workflow limit
      if (this.state.workflows.activeWorkflows.length >= this.config.workflows.maxConcurrentWorkflows) {
        throw new DashboardError(
          'Maximum concurrent workflows reached',
          'WORKFLOW_LIMIT_EXCEEDED',
          { limit: this.config.workflows.maxConcurrentWorkflows }
        );
      }
      
      // Execute workflow
      const execution = await this.workflowEngine.executeWorkflow(workflow, context);
      
      // Track active workflow
      this.state.workflows.activeWorkflows.push(execution);
      
      // Emit started event
      this.emit('workflow:started', { workflow, execution });
      
      return execution;
      
    } catch (error) {
      const dashboardError = error instanceof DashboardError ? error :
        new DashboardError(`Workflow execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'WORKFLOW_EXECUTION_ERROR');
      
      this.emit('workflow:execution:error', { workflow, error: dashboardError });
      throw dashboardError;
    }
  }
  
  // === EVENT HANDLERS ===
  
  private handleClaudeSessionCreated(session: ClaudeSession): void {
    this.state.claude.sessions.push(session);
    this.state.claude.activeSessions = this.state.claude.sessions.length;
    this.emit('claude:session:created', { session });
  }
  
  private handleClaudeSessionEnded(sessionId: string): void {
    this.state.claude.sessions = this.state.claude.sessions.filter(s => s.id !== sessionId);
    this.state.claude.activeSessions = this.state.claude.sessions.length;
    this.emit('claude:session:ended', { sessionId });
  }
  
  private handleClaudeExecutionStarted(execution: any): void {
    this.state.claude.currentExecution = execution;
    this.emit('claude:execution:started', { execution });
  }
  
  private handleClaudeExecutionCompleted(result: any): void {
    this.state.claude.currentExecution = null;
    this.emit('claude:execution:completed', { result });
  }
  
  private handleClaudeExecutionError(error: any): void {
    this.state.claude.currentExecution = null;
    this.addSystemAlert('error', 'Claude Execution Failed', error.message);
  }
  
  private handleWorkflowStarted(execution: WorkflowExecution): void {
    this.emit('workflow:started', { execution });
  }
  
  private handleWorkflowCompleted(execution: WorkflowExecution): void {
    // Remove from active workflows
    this.state.workflows.activeWorkflows = this.state.workflows.activeWorkflows
      .filter(w => w.id !== execution.id);
    
    // Add to history
    this.state.workflows.executionHistory.push(execution);
    
    this.emit('workflow:completed', { execution });
  }
  
  private handleWorkflowFailed(execution: WorkflowExecution): void {
    // Remove from active workflows
    this.state.workflows.activeWorkflows = this.state.workflows.activeWorkflows
      .filter(w => w.id !== execution.id);
    
    // Add to history
    this.state.workflows.executionHistory.push(execution);
    
    this.addSystemAlert('error', 'Workflow Failed', `Workflow "${execution.workflowId}" failed: ${execution.error}`);
  }
  
  private handleWorkflowStepCompleted(data: any): void {
    this.emit('workflow:step:completed', data);
  }
  
  private handlePermissionSessionCreated(session: any): void {
    this.state.permissions.activeSessions.push(session);
    this.emit('permission:session:created', { session });
  }
  
  private handleOperationDenied(data: any): void {
    this.addSystemAlert('warning', 'Operation Denied', `Permission denied: ${data.reason}`);
  }
  
  private handleSecurityAlert(alert: any): void {
    this.addSystemAlert('error', 'Security Alert', alert.message);
  }
  
  private handleRealtimeConnection(connection: any): void {
    this.state.realtime.connections++;
    this.state.realtime.isConnected = true;
    this.emit('realtime:connection:established', { connection });
  }
  
  private handleRealtimeDisconnection(connectionId: string): void {
    this.state.realtime.connections = Math.max(0, this.state.realtime.connections - 1);
    this.state.realtime.isConnected = this.state.realtime.connections > 0;
    this.emit('realtime:connection:lost', { connectionId });
  }
  
  private handleMetricsUpdate(metrics: SystemMetrics): void {
    this.state.realtime.metrics = { ...this.state.realtime.metrics, ...metrics };
    this.emit('realtime:metrics:updated', { metrics });
  }
  
  // === SYSTEM MONITORING ===
  
  private updateSystemMetrics(): void {
    const now = Date.now();
    
    // Update system state
    this.state.system.uptime = now - this.startTime;
    
    // Update Claude metrics
    this.state.claude.activeSessions = this.state.claude.sessions.length;
    this.state.claude.isConnected = this.claudeIntegration.isConnected();
    
    // Update workflow metrics
    // Update realtime metrics
    this.state.realtime.metrics.timestamp = now;
    
    // Calculate system health
    this.updateSystemHealth();
  }
  
  private updateSystemHealth(): void {
    const sessionsHealthy = this.state.claude.activeSessions < this.config.claude.maxConcurrentSessions;
    const workflowsHealthy = this.state.workflows.activeWorkflows.length < this.config.workflows.maxConcurrentWorkflows;
    const connectionsHealthy = this.state.realtime.connections < this.config.realtime.maxConnections;
    
    if (sessionsHealthy && workflowsHealthy && connectionsHealthy) {
      this.state.system.health = 'healthy';
    } else if (this.state.claude.activeSessions > this.config.claude.maxConcurrentSessions * 0.8) {
      this.state.system.health = 'warning';
    } else {
      this.state.system.health = 'critical';
    }
  }
  
  private broadcastMetrics(): void {
    this.realtimeSystem.broadcast('metrics:update', this.state.realtime.metrics);
  }
  
  private addSystemAlert(level: 'info' | 'warning' | 'error' | 'critical', title: string, message: string): void {
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      level,
      title,
      message,
      timestamp: Date.now(),
      source: 'agent-dashboard',
      resolved: false
    };
    
    this.state.system.alerts.unshift(alert);
    
    // Keep only last 100 alerts
    if (this.state.system.alerts.length > 100) {
      this.state.system.alerts = this.state.system.alerts.slice(0, 100);
    }
    
    this.emit('system:alert', alert);
  }
  
  // === PUBLIC API ===
  
  public getState(): DashboardState {
    return { ...this.state };
  }
  
  public getSystemMetrics(): SystemMetrics {
    return this.state.realtime.metrics;
  }
  
  public getHealthCheck(): any {
    return {
      status: this.state.system.health,
      version: this.version,
      uptime: this.state.system.uptime,
      isInitialized: this.isInitialized,
      services: {
        claude: this.claudeIntegration.isConnected(),
        workflows: this.workflowEngine.isRunning(),
        realtime: this.realtimeSystem.isConnected(),
        permissions: this.permissionManager ? true : false
      },
      metrics: this.state.realtime.metrics,
      alerts: this.state.system.alerts.filter(a => !a.resolved).length
    };
  }
  
  // === EventBus Implementation ===
  
  public on(event: string, handler: (data: any) => void | Promise<void>): void {
    super.on(event, handler);
  }
  
  public off(event: string, handler: (data: any) => void | Promise<void>): void {
    super.off(event, handler);
  }
  
  public async emit(event: string, data: any): Promise<any> {
    return super.emit(event, data);
  }
  
  public removeAllListeners(): void {
    super.removeAllListeners();
  }
  
  // === CLEANUP ===
  
  public async shutdown(): Promise<void> {
    if (!this.isInitialized) return;
    
    console.log('🛑 Shutting down Agent Dashboard...');
    
    try {
      // Clear monitoring interval
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
        this.monitoringInterval = undefined;
      }
      
      // Shutdown all services
      await this.claudeIntegration.shutdown?.();
      await this.workflowEngine.shutdown?.();
      await this.realtimeSystem.shutdown?.();
      await this.permissionManager.cleanup?.();
      
      // Clear state
      this.state.claude.sessions = [];
      this.state.workflows.activeWorkflows = [];
      this.state.realtime.connections = 0;
      this.state.system.health = 'critical';
      
      this.isInitialized = false;
      
      // Emit shutdown event
      this.emit('dashboard:shutdown', { timestamp: Date.now() });
      
      console.log('✅ Agent Dashboard shutdown complete');
      
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      throw error;
    }
  }
}

// Export for module systems
export default AgentDashboardPod;