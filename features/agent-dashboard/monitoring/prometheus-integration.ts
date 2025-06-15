// Prometheus Integration - Performance monitoring and metrics collection
// Implements performance monitoring from agent_dashboard_plan.md

import { EventEmitter } from 'events';
import { register, collectDefaultMetrics, Counter, Histogram, Gauge, Summary } from 'prom-client';
import { DashboardError } from '../types/index.js';

export interface PrometheusConfig {
  enabled: boolean;
  port: number;
  path: string;
  collectDefaultMetrics: boolean;
  prefix: string;
  labels: Record<string, string>;
  updateInterval: number;
}

export interface MetricDefinition {
  name: string;
  help: string;
  type: 'counter' | 'histogram' | 'gauge' | 'summary';
  labels?: string[];
  buckets?: number[];
  percentiles?: number[];
}

export interface PerformanceAlert {
  id: string;
  metric: string;
  threshold: number;
  currentValue: number;
  severity: 'warning' | 'critical';
  message: string;
  timestamp: Date;
}

export class PrometheusIntegration extends EventEmitter {
  private config: Required<PrometheusConfig>;
  private metrics: Map<string, any> = new Map();
  private server?: any;
  private alertRules: Map<string, any> = new Map();
  private activeAlerts: Map<string, PerformanceAlert> = new Map();
  private metricsUpdateInterval?: NodeJS.Timeout;
  
  // Core Dashboard Metrics
  private claudeExecutionCounter: Counter<string>;
  private claudeExecutionDuration: Histogram<string>;
  private claudeSessionsGauge: Gauge<string>;
  private claudeQueueLength: Gauge<string>;
  
  private workflowExecutionCounter: Counter<string>;
  private workflowExecutionDuration: Histogram<string>;
  private workflowStepsHistogram: Histogram<string>;
  private activeWorkflowsGauge: Gauge<string>;
  
  private realtimeConnectionsGauge: Gauge<string>;
  private realtimeMessagesCounter: Counter<string>;
  private realtimeLatencyHistogram: Histogram<string>;
  
  private permissionValidationCounter: Counter<string>;
  private permissionDeniedCounter: Counter<string>;
  private activePermissionSessions: Gauge<string>;
  
  private systemResourcesGauge: Gauge<string>;
  private errorRateCounter: Counter<string>;
  private responseTimeSummary: Summary<string>;
  
  constructor(config: Partial<PrometheusConfig> = {}) {
    super();
    
    this.config = {
      enabled: config.enabled ?? true,
      port: config.port ?? 9090,
      path: config.path ?? '/metrics',
      collectDefaultMetrics: config.collectDefaultMetrics ?? true,
      prefix: config.prefix ?? 'agent_dashboard_',
      labels: config.labels ?? { service: 'agent-dashboard' },
      updateInterval: config.updateInterval ?? 5000
    };
    
    this.initializeMetrics();
  }
  
  public async initialize(): Promise<void> {
    if (!this.config.enabled) {
      console.log('📊 Prometheus monitoring disabled');
      return;
    }
    
    try {
      console.log('📊 Initializing Prometheus Integration...');
      
      // Collect default Node.js metrics
      if (this.config.collectDefaultMetrics) {
        collectDefaultMetrics({
          prefix: this.config.prefix,
          register
        });
      }
      
      // Set up alert rules
      this.setupAlertRules();
      
      // Start metrics server
      await this.startMetricsServer();
      
      // Start metrics collection
      this.startMetricsCollection();
      
      console.log(`✅ Prometheus Integration initialized on port ${this.config.port}`);
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to initialize Prometheus Integration:', message);
      throw new DashboardError(`Prometheus initialization failed: ${message}`, 'PROMETHEUS_INIT_ERROR');
    }
  }
  
  private initializeMetrics(): void {
    const prefix = this.config.prefix;
    const defaultLabels = this.config.labels;
    
    // Claude Integration Metrics
    this.claudeExecutionCounter = new Counter({
      name: `${prefix}claude_executions_total`,
      help: 'Total number of Claude executions',
      labelNames: ['specialist', 'profile', 'status'],
      registers: [register]
    });
    
    this.claudeExecutionDuration = new Histogram({
      name: `${prefix}claude_execution_duration_seconds`,
      help: 'Duration of Claude executions in seconds',
      labelNames: ['specialist', 'profile'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120],
      registers: [register]
    });
    
    this.claudeSessionsGauge = new Gauge({
      name: `${prefix}claude_active_sessions`,
      help: 'Number of active Claude sessions',
      registers: [register]
    });
    
    this.claudeQueueLength = new Gauge({
      name: `${prefix}claude_queue_length`,
      help: 'Number of Claude executions in queue',
      registers: [register]
    });
    
    // Workflow Engine Metrics
    this.workflowExecutionCounter = new Counter({
      name: `${prefix}workflow_executions_total`,
      help: 'Total number of workflow executions',
      labelNames: ['status', 'workflow_type'],
      registers: [register]
    });
    
    this.workflowExecutionDuration = new Histogram({
      name: `${prefix}workflow_execution_duration_seconds`,
      help: 'Duration of workflow executions in seconds',
      labelNames: ['workflow_type'],
      buckets: [1, 5, 10, 30, 60, 300, 600, 1800, 3600],
      registers: [register]
    });
    
    this.workflowStepsHistogram = new Histogram({
      name: `${prefix}workflow_steps_total`,
      help: 'Number of steps in workflows',
      buckets: [1, 3, 5, 10, 20, 50, 100],
      registers: [register]
    });
    
    this.activeWorkflowsGauge = new Gauge({
      name: `${prefix}active_workflows`,
      help: 'Number of currently running workflows',
      registers: [register]
    });
    
    // Real-time System Metrics
    this.realtimeConnectionsGauge = new Gauge({
      name: `${prefix}realtime_connections`,
      help: 'Number of active real-time connections',
      registers: [register]
    });
    
    this.realtimeMessagesCounter = new Counter({
      name: `${prefix}realtime_messages_total`,
      help: 'Total number of real-time messages sent',
      labelNames: ['message_type'],
      registers: [register]
    });
    
    this.realtimeLatencyHistogram = new Histogram({
      name: `${prefix}realtime_message_latency_seconds`,
      help: 'Latency of real-time message delivery',
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2],
      registers: [register]
    });
    
    // Permission System Metrics
    this.permissionValidationCounter = new Counter({
      name: `${prefix}permission_validations_total`,
      help: 'Total number of permission validations',
      labelNames: ['profile', 'result'],
      registers: [register]
    });
    
    this.permissionDeniedCounter = new Counter({
      name: `${prefix}permission_denied_total`,
      help: 'Total number of denied permission requests',
      labelNames: ['profile', 'reason'],
      registers: [register]
    });
    
    this.activePermissionSessions = new Gauge({
      name: `${prefix}active_permission_sessions`,
      help: 'Number of active permission sessions',
      registers: [register]
    });
    
    // System Resource Metrics
    this.systemResourcesGauge = new Gauge({
      name: `${prefix}system_resources`,
      help: 'System resource utilization',
      labelNames: ['resource'],
      registers: [register]
    });
    
    // Error and Performance Metrics
    this.errorRateCounter = new Counter({
      name: `${prefix}errors_total`,
      help: 'Total number of errors',
      labelNames: ['component', 'error_type'],
      registers: [register]
    });
    
    this.responseTimeSummary = new Summary({
      name: `${prefix}response_time_seconds`,
      help: 'Response time of operations',
      labelNames: ['operation'],
      percentiles: [0.5, 0.9, 0.95, 0.99],
      registers: [register]
    });
    
    // Store metrics for easy access
    this.metrics.set('claude_executions', this.claudeExecutionCounter);
    this.metrics.set('claude_duration', this.claudeExecutionDuration);
    this.metrics.set('claude_sessions', this.claudeSessionsGauge);
    this.metrics.set('workflow_executions', this.workflowExecutionCounter);
    this.metrics.set('workflow_duration', this.workflowExecutionDuration);
    this.metrics.set('system_resources', this.systemResourcesGauge);
    
    console.log('📊 Prometheus metrics initialized');
  }
  
  private setupAlertRules(): void {
    // High error rate alert
    this.alertRules.set('high_error_rate', {
      metric: 'error_rate',
      threshold: 0.05, // 5% error rate
      severity: 'warning',
      message: 'Error rate is above 5%'
    });
    
    // High memory usage alert
    this.alertRules.set('high_memory_usage', {
      metric: 'memory_usage',
      threshold: 0.85, // 85% memory usage
      severity: 'critical',
      message: 'Memory usage is above 85%'
    });
    
    // Long Claude execution time alert
    this.alertRules.set('slow_claude_execution', {
      metric: 'claude_execution_time',
      threshold: 300, // 5 minutes
      severity: 'warning',
      message: 'Claude execution taking longer than 5 minutes'
    });
    
    // High queue length alert
    this.alertRules.set('high_queue_length', {
      metric: 'claude_queue_length',
      threshold: 20,
      severity: 'warning',
      message: 'Claude queue length is above 20'
    });
    
    // Low connection alert
    this.alertRules.set('low_realtime_connections', {
      metric: 'realtime_connections',
      threshold: 1,
      severity: 'warning',
      message: 'Real-time connections dropped below expected level'
    });
    
    console.log(`🚨 ${this.alertRules.size} alert rules configured`);
  }
  
  private async startMetricsServer(): Promise<void> {
    const express = require('express');
    const app = express();
    
    // Metrics endpoint
    app.get(this.config.path, async (req: any, res: any) => {
      try {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
      } catch (error) {
        res.status(500).end(error);
      }
    });
    
    // Health check endpoint
    app.get('/health', (req: any, res: any) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        metrics: this.metrics.size
      });
    });
    
    // Start server
    return new Promise((resolve, reject) => {
      this.server = app.listen(this.config.port, (error: any) => {
        if (error) {
          reject(error);
        } else {
          console.log(`📊 Prometheus metrics server started on port ${this.config.port}`);
          resolve(undefined);
        }
      });
    });
  }
  
  private startMetricsCollection(): void {
    this.metricsUpdateInterval = setInterval(() => {
      this.collectSystemMetrics();
      this.checkAlerts();
    }, this.config.updateInterval);
  }
  
  private collectSystemMetrics(): void {
    try {
      // Collect Node.js process metrics
      if (typeof process !== 'undefined' && process.memoryUsage) {
        const memUsage = process.memoryUsage();
        
        this.systemResourcesGauge.set(
          { resource: 'memory_heap_used' },
          memUsage.heapUsed / 1024 / 1024 // MB
        );
        
        this.systemResourcesGauge.set(
          { resource: 'memory_heap_total' },
          memUsage.heapTotal / 1024 / 1024 // MB
        );
        
        this.systemResourcesGauge.set(
          { resource: 'memory_external' },
          memUsage.external / 1024 / 1024 // MB
        );
      }
      
      // Collect CPU usage (simplified)
      if (typeof process !== 'undefined' && process.cpuUsage) {
        const cpuUsage = process.cpuUsage();
        this.systemResourcesGauge.set(
          { resource: 'cpu_user' },
          cpuUsage.user / 1000000 // Convert to seconds
        );
        
        this.systemResourcesGauge.set(
          { resource: 'cpu_system' },
          cpuUsage.system / 1000000 // Convert to seconds
        );
      }
      
      // Collect uptime
      if (typeof process !== 'undefined') {
        this.systemResourcesGauge.set(
          { resource: 'uptime' },
          process.uptime()
        );
      }
      
    } catch (error) {
      console.error('❌ Failed to collect system metrics:', error);
    }
  }
  
  private checkAlerts(): void {
    try {
      // Check each alert rule
      for (const [ruleId, rule] of this.alertRules.entries()) {
        const currentValue = this.getCurrentMetricValue(rule.metric);
        
        if (currentValue !== null && this.shouldTriggerAlert(rule, currentValue)) {
          this.triggerAlert(ruleId, rule, currentValue);
        } else if (this.activeAlerts.has(ruleId)) {
          this.resolveAlert(ruleId);
        }
      }
    } catch (error) {
      console.error('❌ Alert checking failed:', error);
    }
  }
  
  private getCurrentMetricValue(metricName: string): number | null {
    try {
      // Get current metric value based on metric name
      switch (metricName) {
        case 'memory_usage':
          if (typeof process !== 'undefined' && process.memoryUsage) {
            const usage = process.memoryUsage();
            return usage.heapUsed / usage.heapTotal;
          }
          break;
        case 'claude_queue_length':
          // This would be set by the Claude integration
          return this.getGaugeValue('claude_queue_length');
        case 'realtime_connections':
          return this.getGaugeValue('realtime_connections');
        default:
          return null;
      }
    } catch (error) {
      return null;
    }
    
    return null;
  }
  
  private getGaugeValue(metricName: string): number {
    // Get current gauge value from Prometheus registry
    const metric = register.getSingleMetric(this.config.prefix + metricName);
    if (metric && typeof metric.get === 'function') {
      const values = metric.get();
      if (values.values && values.values.length > 0) {
        return values.values[0].value;
      }
    }
    return 0;
  }
  
  private shouldTriggerAlert(rule: any, currentValue: number): boolean {
    return currentValue > rule.threshold;
  }
  
  private triggerAlert(ruleId: string, rule: any, currentValue: number): void {
    if (this.activeAlerts.has(ruleId)) return; // Alert already active
    
    const alert: PerformanceAlert = {
      id: ruleId,
      metric: rule.metric,
      threshold: rule.threshold,
      currentValue,
      severity: rule.severity,
      message: rule.message,
      timestamp: new Date()
    };
    
    this.activeAlerts.set(ruleId, alert);
    
    // Emit alert event
    this.emit('alert:triggered', alert);
    
    console.warn(`🚨 ALERT: ${alert.message} (${currentValue} > ${rule.threshold})`);
  }
  
  private resolveAlert(ruleId: string): void {
    const alert = this.activeAlerts.get(ruleId);
    if (alert) {
      this.activeAlerts.delete(ruleId);
      this.emit('alert:resolved', { ...alert, resolvedAt: new Date() });
      console.log(`✅ RESOLVED: Alert ${ruleId} has been resolved`);
    }
  }
  
  // === PUBLIC API FOR METRIC RECORDING ===
  
  public recordClaudeExecution(specialist: string, profile: string, duration: number, status: 'success' | 'error'): void {
    this.claudeExecutionCounter.inc({ specialist, profile, status });
    this.claudeExecutionDuration.observe({ specialist, profile }, duration / 1000);
  }
  
  public updateClaudeMetrics(activeSessions: number, queueLength: number): void {
    this.claudeSessionsGauge.set(activeSessions);
    this.claudeQueueLength.set(queueLength);
  }
  
  public recordWorkflowExecution(workflowType: string, duration: number, steps: number, status: 'success' | 'error'): void {
    this.workflowExecutionCounter.inc({ status, workflow_type: workflowType });
    this.workflowExecutionDuration.observe({ workflow_type: workflowType }, duration / 1000);
    this.workflowStepsHistogram.observe(steps);
  }
  
  public updateWorkflowMetrics(activeWorkflows: number): void {
    this.activeWorkflowsGauge.set(activeWorkflows);
  }
  
  public recordRealtimeMessage(messageType: string, latency?: number): void {
    this.realtimeMessagesCounter.inc({ message_type: messageType });
    if (latency !== undefined) {
      this.realtimeLatencyHistogram.observe(latency / 1000);
    }
  }
  
  public updateRealtimeConnections(connections: number): void {
    this.realtimeConnectionsGauge.set(connections);
  }
  
  public recordPermissionValidation(profile: string, result: 'granted' | 'denied', reason?: string): void {
    this.permissionValidationCounter.inc({ profile, result });
    if (result === 'denied' && reason) {
      this.permissionDeniedCounter.inc({ profile, reason });
    }
  }
  
  public updatePermissionSessions(activeSessions: number): void {
    this.activePermissionSessions.set(activeSessions);
  }
  
  public recordError(component: string, errorType: string): void {
    this.errorRateCounter.inc({ component, error_type: errorType });
  }
  
  public recordResponseTime(operation: string, responseTime: number): void {
    this.responseTimeSummary.observe({ operation }, responseTime / 1000);
  }
  
  public recordSystemResource(resource: string, value: number): void {
    this.systemResourcesGauge.set({ resource }, value);
  }
  
  // === CUSTOM METRICS ===
  
  public createCounter(definition: MetricDefinition): Counter<string> {
    const counter = new Counter({
      name: this.config.prefix + definition.name,
      help: definition.help,
      labelNames: definition.labels || [],
      registers: [register]
    });
    
    this.metrics.set(definition.name, counter);
    return counter;
  }
  
  public createGauge(definition: MetricDefinition): Gauge<string> {
    const gauge = new Gauge({
      name: this.config.prefix + definition.name,
      help: definition.help,
      labelNames: definition.labels || [],
      registers: [register]
    });
    
    this.metrics.set(definition.name, gauge);
    return gauge;
  }
  
  public createHistogram(definition: MetricDefinition): Histogram<string> {
    const histogram = new Histogram({
      name: this.config.prefix + definition.name,
      help: definition.help,
      labelNames: definition.labels || [],
      buckets: definition.buckets || [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [register]
    });
    
    this.metrics.set(definition.name, histogram);
    return histogram;
  }
  
  // === UTILITIES ===
  
  public getMetrics(): any {
    return register.metrics();
  }
  
  public getActiveAlerts(): PerformanceAlert[] {
    return Array.from(this.activeAlerts.values());
  }
  
  public getMetricsSummary(): any {
    return {
      totalMetrics: this.metrics.size,
      activeAlerts: this.activeAlerts.size,
      alertRules: this.alertRules.size,
      serverPort: this.config.port,
      isEnabled: this.config.enabled
    };
  }
  
  // === CLEANUP ===
  
  public async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Prometheus Integration...');
    
    if (this.metricsUpdateInterval) {
      clearInterval(this.metricsUpdateInterval);
    }
    
    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server.close(() => {
          console.log('📊 Prometheus metrics server stopped');
          resolve();
        });
      });
    }
    
    // Clear metrics
    register.clear();
    this.metrics.clear();
    this.activeAlerts.clear();
    this.alertRules.clear();
    
    console.log('✅ Prometheus Integration shutdown complete');
  }
}

export default PrometheusIntegration;