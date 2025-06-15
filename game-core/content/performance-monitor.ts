// RainStorm ARPG - Performance Monitoring and Caching System
// Advanced performance tracking and intelligent caching for content generation

import { GeneratedContent } from './claude-engine';
import { EventEmitter } from 'events';

export interface PerformanceMetrics {
  generationTime: number;
  validationTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  successRate: number;
  throughput: number;
  averageResponseTime: number;
  errorRate: number;
}

export interface CacheEntry {
  id: string;
  content: GeneratedContent;
  generatedAt: number;
  lastAccessed: number;
  accessCount: number;
  size: number;
  priority: number;
  expiresAt?: number;
  tags: string[];
  metadata: CacheEntryMetadata;
}

export interface CacheEntryMetadata {
  contentType: string;
  parameters: Record<string, any>;
  quality: number;
  generationCost: number;
  playerRelevance: number;
  reuseFrequency: number;
}

export interface CacheConfig {
  maxSize: number;
  maxMemory: number; // in MB
  defaultTTL: number; // in milliseconds
  enableIntelligentEviction: boolean;
  enablePreloading: boolean;
  enableCompression: boolean;
  enablePersistence: boolean;
  evictionStrategy: 'lru' | 'lfu' | 'intelligent' | 'priority';
}

export interface PerformanceConfig {
  enableMetrics: boolean;
  enableProfiling: boolean;
  enableAlerts: boolean;
  sampleRate: number;
  alertThresholds: AlertThresholds;
  reportingInterval: number;
}

export interface AlertThresholds {
  maxGenerationTime: number;
  minSuccessRate: number;
  maxMemoryUsage: number;
  maxErrorRate: number;
  minCacheHitRate: number;
}

export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  metric: string;
  threshold: number;
  actualValue: number;
  timestamp: number;
  message: string;
  resolved: boolean;
}

export interface PerformanceReport {
  timestamp: number;
  period: string;
  metrics: PerformanceMetrics;
  trends: PerformanceTrends;
  alerts: PerformanceAlert[];
  recommendations: string[];
  breakdown: ContentTypeBreakdown;
}

export interface PerformanceTrends {
  generationTime: TrendData;
  cacheHitRate: TrendData;
  memoryUsage: TrendData;
  throughput: TrendData;
}

export interface TrendData {
  current: number;
  previous: number;
  change: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface ContentTypeBreakdown {
  [contentType: string]: {
    count: number;
    averageTime: number;
    successRate: number;
    cacheHitRate: number;
    memoryUsage: number;
  };
}

export class PerformanceMonitor extends EventEmitter {
  private config: PerformanceConfig;
  private metrics: PerformanceMetrics;
  private alerts: Map<string, PerformanceAlert> = new Map();
  private samples: PerformanceSample[] = [];
  private reportHistory: PerformanceReport[] = [];
  private contentTypeStats: Map<string, ContentTypeStats> = new Map();
  private isMonitoring = false;
  private reportingTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<PerformanceConfig>) {
    super();

    this.config = {
      enableMetrics: true,
      enableProfiling: true,
      enableAlerts: true,
      sampleRate: 1.0, // 100% sampling
      alertThresholds: {
        maxGenerationTime: 5000, // 5 seconds
        minSuccessRate: 0.95, // 95%
        maxMemoryUsage: 100, // 100 MB
        maxErrorRate: 0.05, // 5%
        minCacheHitRate: 0.7 // 70%
      },
      reportingInterval: 60000, // 1 minute
      ...config
    };

    this.metrics = this.initializeMetrics();
    this.startMonitoring();

    console.log('📊 Performance Monitor initialized - Tracking content generation performance');
  }

  // =============================================================================
  // PERFORMANCE TRACKING
  // =============================================================================

  public recordGenerationStart(contentType: string, parameters: any): string {
    const operationId = this.generateOperationId();
    
    if (this.shouldSample()) {
      const sample: PerformanceSample = {
        id: operationId,
        contentType,
        parameters,
        startTime: performance.now(),
        memoryBefore: this.getMemoryUsage(),
        stage: 'generation_start'
      };
      
      this.samples.push(sample);
    }

    return operationId;
  }

  public recordGenerationEnd(
    operationId: string,
    success: boolean,
    content?: GeneratedContent,
    error?: Error
  ): void {
    const sample = this.samples.find(s => s.id === operationId);
    if (!sample) return;

    const endTime = performance.now();
    const generationTime = endTime - sample.startTime;
    const memoryAfter = this.getMemoryUsage();

    // Update sample
    sample.endTime = endTime;
    sample.generationTime = generationTime;
    sample.memoryAfter = memoryAfter;
    sample.memoryDelta = memoryAfter - sample.memoryBefore;
    sample.success = success;
    sample.error = error;
    sample.stage = 'generation_complete';

    // Update metrics
    this.updateMetrics(sample);

    // Update content type stats
    this.updateContentTypeStats(sample);

    // Check for alerts
    this.checkAlerts(sample);

    this.emit('generationComplete', {
      operationId,
      contentType: sample.contentType,
      generationTime,
      success,
      memoryDelta: sample.memoryDelta
    });
  }

  public recordCacheEvent(type: 'hit' | 'miss' | 'eviction', contentType: string, size?: number): void {
    const stats = this.getContentTypeStats(contentType);
    
    switch (type) {
      case 'hit':
        stats.cacheHits++;
        break;
      case 'miss':
        stats.cacheMisses++;
        break;
      case 'eviction':
        stats.cacheEvictions++;
        if (size) stats.memoryFreed += size;
        break;
    }

    this.updateCacheMetrics();

    this.emit('cacheEvent', { type, contentType, size });
  }

  public recordValidationTime(operationId: string, validationTime: number): void {
    const sample = this.samples.find(s => s.id === operationId);
    if (sample) {
      sample.validationTime = validationTime;
    }
  }

  // =============================================================================
  // METRICS CALCULATION
  // =============================================================================

  private updateMetrics(sample: PerformanceSample): void {
    if (!this.config.enableMetrics) return;

    // Update generation time
    const generationTimes = this.getRecentSamples(300000) // Last 5 minutes
      .map(s => s.generationTime)
      .filter(t => t !== undefined) as number[];
    
    if (generationTimes.length > 0) {
      this.metrics.averageResponseTime = generationTimes.reduce((a, b) => a + b, 0) / generationTimes.length;
    }

    // Update success rate
    const recentSamples = this.getRecentSamples(300000);
    const successCount = recentSamples.filter(s => s.success).length;
    this.metrics.successRate = recentSamples.length > 0 ? successCount / recentSamples.length : 1;

    // Update error rate
    this.metrics.errorRate = 1 - this.metrics.successRate;

    // Update throughput (operations per second)
    const throughputSamples = this.getRecentSamples(60000); // Last minute
    this.metrics.throughput = throughputSamples.length / 60;

    // Update memory usage
    this.metrics.memoryUsage = this.getMemoryUsage();
  }

  private updateCacheMetrics(): void {
    let totalHits = 0;
    let totalMisses = 0;

    for (const stats of this.contentTypeStats.values()) {
      totalHits += stats.cacheHits;
      totalMisses += stats.cacheMisses;
    }

    const totalAccesses = totalHits + totalMisses;
    this.metrics.cacheHitRate = totalAccesses > 0 ? totalHits / totalAccesses : 0;
  }

  private updateContentTypeStats(sample: PerformanceSample): void {
    const stats = this.getContentTypeStats(sample.contentType);
    
    stats.totalRequests++;
    if (sample.success) {
      stats.successfulRequests++;
    }
    
    if (sample.generationTime) {
      stats.totalGenerationTime += sample.generationTime;
      stats.averageGenerationTime = stats.totalGenerationTime / stats.successfulRequests;
    }

    if (sample.memoryDelta) {
      stats.totalMemoryUsed += sample.memoryDelta;
      stats.averageMemoryUsage = stats.totalMemoryUsed / stats.totalRequests;
    }
  }

  // =============================================================================
  // ALERT SYSTEM
  // =============================================================================

  private checkAlerts(sample: PerformanceSample): void {
    if (!this.config.enableAlerts) return;

    const thresholds = this.config.alertThresholds;

    // Check generation time
    if (sample.generationTime && sample.generationTime > thresholds.maxGenerationTime) {
      this.createAlert('critical', 'generation_time', thresholds.maxGenerationTime, sample.generationTime,
        `Generation time exceeded threshold: ${sample.generationTime}ms > ${thresholds.maxGenerationTime}ms`);
    }

    // Check success rate
    if (this.metrics.successRate < thresholds.minSuccessRate) {
      this.createAlert('warning', 'success_rate', thresholds.minSuccessRate, this.metrics.successRate,
        `Success rate below threshold: ${(this.metrics.successRate * 100).toFixed(1)}% < ${(thresholds.minSuccessRate * 100)}%`);
    }

    // Check memory usage
    if (this.metrics.memoryUsage > thresholds.maxMemoryUsage) {
      this.createAlert('warning', 'memory_usage', thresholds.maxMemoryUsage, this.metrics.memoryUsage,
        `Memory usage exceeded threshold: ${this.metrics.memoryUsage}MB > ${thresholds.maxMemoryUsage}MB`);
    }

    // Check error rate
    if (this.metrics.errorRate > thresholds.maxErrorRate) {
      this.createAlert('critical', 'error_rate', thresholds.maxErrorRate, this.metrics.errorRate,
        `Error rate exceeded threshold: ${(this.metrics.errorRate * 100).toFixed(1)}% > ${(thresholds.maxErrorRate * 100)}%`);
    }

    // Check cache hit rate
    if (this.metrics.cacheHitRate < thresholds.minCacheHitRate) {
      this.createAlert('info', 'cache_hit_rate', thresholds.minCacheHitRate, this.metrics.cacheHitRate,
        `Cache hit rate below threshold: ${(this.metrics.cacheHitRate * 100).toFixed(1)}% < ${(thresholds.minCacheHitRate * 100)}%`);
    }
  }

  private createAlert(
    type: 'warning' | 'critical' | 'info',
    metric: string,
    threshold: number,
    actualValue: number,
    message: string
  ): void {
    const alertId = `${metric}_${Date.now()}`;
    
    const alert: PerformanceAlert = {
      id: alertId,
      type,
      metric,
      threshold,
      actualValue,
      timestamp: Date.now(),
      message,
      resolved: false
    };

    this.alerts.set(alertId, alert);

    this.emit('alert', alert);

    console.warn(`🚨 Performance Alert [${type.toUpperCase()}]: ${message}`);
  }

  // =============================================================================
  // REPORTING
  // =============================================================================

  public generateReport(period = '1h'): PerformanceReport {
    const now = Date.now();
    const periodMs = this.parsePeriod(period);
    const startTime = now - periodMs;

    const periodSamples = this.samples.filter(s => s.startTime >= startTime);
    const metrics = this.calculatePeriodMetrics(periodSamples);
    const trends = this.calculateTrends(period);
    const breakdown = this.generateContentTypeBreakdown(periodSamples);
    const activeAlerts = Array.from(this.alerts.values()).filter(a => !a.resolved && a.timestamp >= startTime);

    const report: PerformanceReport = {
      timestamp: now,
      period,
      metrics,
      trends,
      alerts: activeAlerts,
      recommendations: this.generateRecommendations(metrics, trends, activeAlerts),
      breakdown
    };

    this.reportHistory.push(report);
    
    // Keep only last 24 hours of reports
    const cutoff = now - (24 * 60 * 60 * 1000);
    this.reportHistory = this.reportHistory.filter(r => r.timestamp >= cutoff);

    return report;
  }

  private calculatePeriodMetrics(samples: PerformanceSample[]): PerformanceMetrics {
    if (samples.length === 0) return this.initializeMetrics();

    const generationTimes = samples.map(s => s.generationTime).filter(t => t !== undefined) as number[];
    const validationTimes = samples.map(s => s.validationTime).filter(t => t !== undefined) as number[];
    const successCount = samples.filter(s => s.success).length;

    return {
      generationTime: generationTimes.length > 0 ? generationTimes.reduce((a, b) => a + b, 0) / generationTimes.length : 0,
      validationTime: validationTimes.length > 0 ? validationTimes.reduce((a, b) => a + b, 0) / validationTimes.length : 0,
      cacheHitRate: this.metrics.cacheHitRate,
      memoryUsage: this.metrics.memoryUsage,
      successRate: samples.length > 0 ? successCount / samples.length : 1,
      throughput: samples.length / (samples.length > 0 ? (Math.max(...samples.map(s => s.startTime)) - Math.min(...samples.map(s => s.startTime))) / 1000 : 1),
      averageResponseTime: generationTimes.length > 0 ? generationTimes.reduce((a, b) => a + b, 0) / generationTimes.length : 0,
      errorRate: samples.length > 0 ? (samples.length - successCount) / samples.length : 0
    };
  }

  private calculateTrends(period: string): PerformanceTrends {
    // Compare current period with previous period
    const currentReport = this.generateReport(period);
    const previousReport = this.findPreviousReport(period);

    return {
      generationTime: this.calculateTrend(
        currentReport.metrics.generationTime,
        previousReport?.metrics.generationTime || 0
      ),
      cacheHitRate: this.calculateTrend(
        currentReport.metrics.cacheHitRate,
        previousReport?.metrics.cacheHitRate || 0
      ),
      memoryUsage: this.calculateTrend(
        currentReport.metrics.memoryUsage,
        previousReport?.metrics.memoryUsage || 0
      ),
      throughput: this.calculateTrend(
        currentReport.metrics.throughput,
        previousReport?.metrics.throughput || 0
      )
    };
  }

  private calculateTrend(current: number, previous: number): TrendData {
    const change = current - previous;
    const percentChange = previous > 0 ? (change / previous) * 100 : 0;
    
    let trend: 'increasing' | 'decreasing' | 'stable';
    if (Math.abs(percentChange) < 5) {
      trend = 'stable';
    } else if (percentChange > 0) {
      trend = 'increasing';
    } else {
      trend = 'decreasing';
    }

    return {
      current,
      previous,
      change: percentChange,
      trend
    };
  }

  private generateContentTypeBreakdown(samples: PerformanceSample[]): ContentTypeBreakdown {
    const breakdown: ContentTypeBreakdown = {};

    const typeGroups = new Map<string, PerformanceSample[]>();
    for (const sample of samples) {
      if (!typeGroups.has(sample.contentType)) {
        typeGroups.set(sample.contentType, []);
      }
      typeGroups.get(sample.contentType)!.push(sample);
    }

    for (const [contentType, typeSamples] of typeGroups) {
      const stats = this.getContentTypeStats(contentType);
      const generationTimes = typeSamples.map(s => s.generationTime).filter(t => t !== undefined) as number[];
      const successCount = typeSamples.filter(s => s.success).length;

      breakdown[contentType] = {
        count: typeSamples.length,
        averageTime: generationTimes.length > 0 ? generationTimes.reduce((a, b) => a + b, 0) / generationTimes.length : 0,
        successRate: typeSamples.length > 0 ? successCount / typeSamples.length : 1,
        cacheHitRate: stats.cacheHits + stats.cacheMisses > 0 ? stats.cacheHits / (stats.cacheHits + stats.cacheMisses) : 0,
        memoryUsage: stats.averageMemoryUsage
      };
    }

    return breakdown;
  }

  private generateRecommendations(
    metrics: PerformanceMetrics,
    trends: PerformanceTrends,
    alerts: PerformanceAlert[]
  ): string[] {
    const recommendations: string[] = [];

    // Generation time recommendations
    if (metrics.generationTime > 2000) {
      recommendations.push('Consider optimizing content generation parameters to reduce generation time');
    }

    if (trends.generationTime.trend === 'increasing') {
      recommendations.push('Generation time is trending upward - monitor for performance degradation');
    }

    // Cache recommendations
    if (metrics.cacheHitRate < 0.6) {
      recommendations.push('Low cache hit rate - consider adjusting cache configuration or content parameters');
    }

    // Memory recommendations
    if (metrics.memoryUsage > 80) {
      recommendations.push('High memory usage - consider enabling cache compression or reducing cache size');
    }

    // Error rate recommendations
    if (metrics.errorRate > 0.02) {
      recommendations.push('Elevated error rate - review error logs and consider fallback mechanisms');
    }

    // Alert-based recommendations
    const criticalAlerts = alerts.filter(a => a.type === 'critical');
    if (criticalAlerts.length > 0) {
      recommendations.push('Critical alerts detected - immediate attention required');
    }

    return recommendations;
  }

  // =============================================================================
  // MONITORING LIFECYCLE
  // =============================================================================

  private startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;

    // Start periodic reporting
    if (this.config.reportingInterval > 0) {
      this.reportingTimer = setInterval(() => {
        const report = this.generateReport('1m');
        this.emit('periodicReport', report);
      }, this.config.reportingInterval);
    }

    console.log('📊 Performance monitoring started');
  }

  public stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    if (this.reportingTimer) {
      clearInterval(this.reportingTimer);
      this.reportingTimer = null;
    }

    console.log('📊 Performance monitoring stopped');
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private initializeMetrics(): PerformanceMetrics {
    return {
      generationTime: 0,
      validationTime: 0,
      cacheHitRate: 0,
      memoryUsage: 0,
      successRate: 1,
      throughput: 0,
      averageResponseTime: 0,
      errorRate: 0
    };
  }

  private getContentTypeStats(contentType: string): ContentTypeStats {
    if (!this.contentTypeStats.has(contentType)) {
      this.contentTypeStats.set(contentType, {
        totalRequests: 0,
        successfulRequests: 0,
        totalGenerationTime: 0,
        averageGenerationTime: 0,
        totalMemoryUsed: 0,
        averageMemoryUsage: 0,
        cacheHits: 0,
        cacheMisses: 0,
        cacheEvictions: 0,
        memoryFreed: 0
      });
    }
    return this.contentTypeStats.get(contentType)!;
  }

  private getRecentSamples(timeWindow: number): PerformanceSample[] {
    const cutoff = performance.now() - timeWindow;
    return this.samples.filter(s => s.startTime >= cutoff);
  }

  private shouldSample(): boolean {
    return Math.random() < this.config.sampleRate;
  }

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  private getMemoryUsage(): number {
    // In a real implementation, this would get actual memory usage
    // For now, return a placeholder value
    return 50; // MB
  }

  private parsePeriod(period: string): number {
    const unit = period.slice(-1);
    const value = parseInt(period.slice(0, -1));
    
    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 60 * 60 * 1000; // 1 hour default
    }
  }

  private findPreviousReport(period: string): PerformanceReport | null {
    const periodMs = this.parsePeriod(period);
    const targetTime = Date.now() - (periodMs * 2); // Two periods ago
    
    return this.reportHistory
      .filter(r => Math.abs(r.timestamp - targetTime) < periodMs / 2)
      .sort((a, b) => Math.abs(a.timestamp - targetTime) - Math.abs(b.timestamp - targetTime))[0] || null;
  }

  // =============================================================================
  // PUBLIC API
  // =============================================================================

  public getCurrentMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public getActiveAlerts(): PerformanceAlert[] {
    return Array.from(this.alerts.values()).filter(a => !a.resolved);
  }

  public resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      this.emit('alertResolved', alert);
      return true;
    }
    return false;
  }

  public getReportHistory(): PerformanceReport[] {
    return [...this.reportHistory];
  }

  public clearHistory(): void {
    this.samples = [];
    this.reportHistory = [];
    this.alerts.clear();
    console.log('📊 Performance history cleared');
  }

  public destroy(): void {
    this.stopMonitoring();
    this.clearHistory();
    this.removeAllListeners();
    console.log('💥 Performance Monitor destroyed');
  }
}

// =============================================================================
// INTELLIGENT CACHE SYSTEM
// =============================================================================

export class IntelligentCache extends EventEmitter {
  private config: CacheConfig;
  private cache: Map<string, CacheEntry> = new Map();
  private accessLog: AccessLogEntry[] = [];
  private evictionStrategy: EvictionStrategy;
  private compressionEnabled = false;
  private currentMemoryUsage = 0;
  private preloadQueue: PreloadRequest[] = [];
  private cacheStats: CacheStats;

  constructor(config?: Partial<CacheConfig>) {
    super();

    this.config = {
      maxSize: 1000,
      maxMemory: 100, // 100 MB
      defaultTTL: 3600000, // 1 hour
      enableIntelligentEviction: true,
      enablePreloading: true,
      enableCompression: false,
      enablePersistence: false,
      evictionStrategy: 'intelligent',
      ...config
    };

    this.evictionStrategy = this.createEvictionStrategy();
    this.cacheStats = new CacheStats();

    console.log('🗄️ Intelligent Cache initialized - Ready for smart content caching');
  }

  // =============================================================================
  // CACHE OPERATIONS
  // =============================================================================

  public async get(key: string): Promise<CacheEntry | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.cacheStats.recordMiss();
      this.emit('cacheMiss', { key });
      return null;
    }

    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.cacheStats.recordMiss();
      this.emit('cacheExpired', { key, entry });
      return null;
    }

    // Update access information
    entry.lastAccessed = Date.now();
    entry.accessCount++;
    
    this.logAccess(key, 'hit');
    this.cacheStats.recordHit();
    this.emit('cacheHit', { key, entry });

    return entry;
  }

  public async set(
    key: string,
    content: GeneratedContent,
    options: {
      ttl?: number;
      priority?: number;
      tags?: string[];
      metadata?: Partial<CacheEntryMetadata>;
    } = {}
  ): Promise<boolean> {
    try {
      const size = this.calculateContentSize(content);
      
      // Check if we need to make space
      if (this.cache.size >= this.config.maxSize || 
          this.currentMemoryUsage + size > this.config.maxMemory * 1024 * 1024) {
        await this.makeSpace(size);
      }

      const entry: CacheEntry = {
        id: key,
        content,
        generatedAt: Date.now(),
        lastAccessed: Date.now(),
        accessCount: 1,
        size,
        priority: options.priority || this.calculatePriority(content, options.metadata),
        expiresAt: options.ttl ? Date.now() + options.ttl : undefined,
        tags: options.tags || [],
        metadata: {
          contentType: content.type,
          parameters: {},
          quality: content.quality?.overall || 0.8,
          generationCost: content.generationTime || 0,
          playerRelevance: 0.8,
          reuseFrequency: 0,
          ...options.metadata
        }
      };

      // Apply compression if enabled
      if (this.config.enableCompression) {
        entry.content = await this.compressContent(entry.content);
      }

      this.cache.set(key, entry);
      this.currentMemoryUsage += size;
      this.cacheStats.recordSet();

      this.emit('cacheSet', { key, entry });

      return true;

    } catch (error) {
      console.error(`Failed to cache content for key ${key}:`, error);
      return false;
    }
  }

  public async delete(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (entry) {
      this.cache.delete(key);
      this.currentMemoryUsage -= entry.size;
      this.cacheStats.recordDelete();
      this.emit('cacheDelete', { key, entry });
      return true;
    }
    return false;
  }

  public async clear(): Promise<void> {
    const size = this.cache.size;
    this.cache.clear();
    this.currentMemoryUsage = 0;
    this.accessLog = [];
    this.cacheStats.recordClear();
    this.emit('cacheClear', { entriesRemoved: size });
    console.log(`🗄️ Cache cleared: ${size} entries removed`);
  }

  // =============================================================================
  // INTELLIGENT EVICTION
  // =============================================================================

  private async makeSpace(requiredSize: number): Promise<void> {
    const evictedEntries: CacheEntry[] = [];
    
    // Use intelligent eviction strategy
    const candidatesForEviction = this.evictionStrategy.selectEvictionCandidates(
      Array.from(this.cache.values()),
      requiredSize
    );

    for (const entry of candidatesForEviction) {
      this.cache.delete(entry.id);
      this.currentMemoryUsage -= entry.size;
      evictedEntries.push(entry);
      
      if (this.currentMemoryUsage + requiredSize <= this.config.maxMemory * 1024 * 1024) {
        break;
      }
    }

    if (evictedEntries.length > 0) {
      this.cacheStats.recordEvictions(evictedEntries.length);
      this.emit('cacheEviction', { evictedEntries });
      console.log(`🗄️ Evicted ${evictedEntries.length} entries to make space`);
    }
  }

  private createEvictionStrategy(): EvictionStrategy {
    switch (this.config.evictionStrategy) {
      case 'lru':
        return new LRUEvictionStrategy();
      case 'lfu':
        return new LFUEvictionStrategy();
      case 'priority':
        return new PriorityEvictionStrategy();
      case 'intelligent':
      default:
        return new IntelligentEvictionStrategy();
    }
  }

  // =============================================================================
  // PRELOADING SYSTEM
  // =============================================================================

  public async preload(contentType: string, parameters: any, priority = 5): Promise<void> {
    if (!this.config.enablePreloading) return;

    const request: PreloadRequest = {
      id: this.generatePreloadId(),
      contentType,
      parameters,
      priority,
      timestamp: Date.now()
    };

    this.preloadQueue.push(request);
    this.preloadQueue.sort((a, b) => b.priority - a.priority);

    this.emit('preloadQueued', request);
  }

  public async processPreloadQueue(): Promise<void> {
    if (this.preloadQueue.length === 0) return;

    const request = this.preloadQueue.shift()!;
    
    try {
      // This would integrate with the content generation system
      // For now, just emit an event
      this.emit('preloadRequest', request);
      
    } catch (error) {
      console.error('Preload failed:', error);
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private calculateContentSize(content: GeneratedContent): number {
    // Simple size calculation - in a real implementation, this would be more sophisticated
    return JSON.stringify(content).length;
  }

  private calculatePriority(content: GeneratedContent, metadata?: Partial<CacheEntryMetadata>): number {
    let priority = 5; // Base priority

    // Higher quality content gets higher priority
    if (content.quality?.overall) {
      priority += content.quality.overall * 3;
    }

    // Longer generation time means higher caching value
    if (content.generationTime && content.generationTime > 1000) {
      priority += Math.min(content.generationTime / 1000, 5);
    }

    // Player relevance affects priority
    if (metadata?.playerRelevance) {
      priority += metadata.playerRelevance * 2;
    }

    return Math.min(10, priority);
  }

  private async compressContent(content: GeneratedContent): Promise<GeneratedContent> {
    // Placeholder for content compression
    // In a real implementation, this would use actual compression algorithms
    return content;
  }

  private logAccess(key: string, type: 'hit' | 'miss'): void {
    this.accessLog.push({
      key,
      type,
      timestamp: Date.now()
    });

    // Keep only recent access logs
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    this.accessLog = this.accessLog.filter(log => log.timestamp >= cutoff);
  }

  private generatePreloadId(): string {
    return `preload_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  // =============================================================================
  // PUBLIC API
  // =============================================================================

  public getStats(): any {
    return {
      ...this.cacheStats.getStats(),
      currentSize: this.cache.size,
      maxSize: this.config.maxSize,
      memoryUsage: this.currentMemoryUsage,
      maxMemory: this.config.maxMemory * 1024 * 1024,
      memoryUtilization: (this.currentMemoryUsage / (this.config.maxMemory * 1024 * 1024)) * 100,
      preloadQueueSize: this.preloadQueue.length
    };
  }

  public getEntries(): CacheEntry[] {
    return Array.from(this.cache.values());
  }

  public getEntriesByTag(tag: string): CacheEntry[] {
    return Array.from(this.cache.values()).filter(entry => entry.tags.includes(tag));
  }

  public async invalidateByTag(tag: string): Promise<number> {
    const entries = this.getEntriesByTag(tag);
    
    for (const entry of entries) {
      await this.delete(entry.id);
    }

    console.log(`🗄️ Invalidated ${entries.length} entries with tag: ${tag}`);
    return entries.length;
  }

  public destroy(): void {
    this.clear();
    this.removeAllListeners();
    console.log('💥 Intelligent Cache destroyed');
  }
}

// =============================================================================
// SUPPORTING CLASSES AND INTERFACES
// =============================================================================

interface PerformanceSample {
  id: string;
  contentType: string;
  parameters: any;
  startTime: number;
  endTime?: number;
  generationTime?: number;
  validationTime?: number;
  memoryBefore: number;
  memoryAfter?: number;
  memoryDelta?: number;
  success?: boolean;
  error?: Error;
  stage: string;
}

interface ContentTypeStats {
  totalRequests: number;
  successfulRequests: number;
  totalGenerationTime: number;
  averageGenerationTime: number;
  totalMemoryUsed: number;
  averageMemoryUsage: number;
  cacheHits: number;
  cacheMisses: number;
  cacheEvictions: number;
  memoryFreed: number;
}

interface AccessLogEntry {
  key: string;
  type: 'hit' | 'miss';
  timestamp: number;
}

interface PreloadRequest {
  id: string;
  contentType: string;
  parameters: any;
  priority: number;
  timestamp: number;
}

// Eviction strategies
abstract class EvictionStrategy {
  abstract selectEvictionCandidates(entries: CacheEntry[], requiredSpace: number): CacheEntry[];
}

class LRUEvictionStrategy extends EvictionStrategy {
  selectEvictionCandidates(entries: CacheEntry[], requiredSpace: number): CacheEntry[] {
    return entries
      .sort((a, b) => a.lastAccessed - b.lastAccessed)
      .slice(0, Math.ceil(entries.length * 0.2));
  }
}

class LFUEvictionStrategy extends EvictionStrategy {
  selectEvictionCandidates(entries: CacheEntry[], requiredSpace: number): CacheEntry[] {
    return entries
      .sort((a, b) => a.accessCount - b.accessCount)
      .slice(0, Math.ceil(entries.length * 0.2));
  }
}

class PriorityEvictionStrategy extends EvictionStrategy {
  selectEvictionCandidates(entries: CacheEntry[], requiredSpace: number): CacheEntry[] {
    return entries
      .sort((a, b) => a.priority - b.priority)
      .slice(0, Math.ceil(entries.length * 0.2));
  }
}

class IntelligentEvictionStrategy extends EvictionStrategy {
  selectEvictionCandidates(entries: CacheEntry[], requiredSpace: number): CacheEntry[] {
    // Intelligent eviction considers multiple factors
    return entries
      .map(entry => ({
        entry,
        score: this.calculateEvictionScore(entry)
      }))
      .sort((a, b) => a.score - b.score) // Lower score = more likely to be evicted
      .slice(0, Math.ceil(entries.length * 0.2))
      .map(item => item.entry);
  }

  private calculateEvictionScore(entry: CacheEntry): number {
    const now = Date.now();
    const age = now - entry.generatedAt;
    const timeSinceAccess = now - entry.lastAccessed;
    
    let score = entry.priority * 10; // Base score from priority
    
    // Reduce score for frequently accessed items
    score += entry.accessCount;
    
    // Reduce score for recently accessed items
    score -= Math.max(0, 100 - (timeSinceAccess / 60000)); // Recent access bonus
    
    // Reduce score for high-quality content
    score += entry.metadata.quality * 20;
    
    // Reduce score for content that was expensive to generate
    score += Math.min(entry.metadata.generationCost / 100, 10);
    
    return score;
  }
}

class CacheStats {
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    clears: 0
  };

  recordHit(): void { this.stats.hits++; }
  recordMiss(): void { this.stats.misses++; }
  recordSet(): void { this.stats.sets++; }
  recordDelete(): void { this.stats.deletes++; }
  recordEvictions(count: number): void { this.stats.evictions += count; }
  recordClear(): void { this.stats.clears++; }

  getStats(): any {
    const totalAccesses = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: totalAccesses > 0 ? this.stats.hits / totalAccesses : 0,
      missRate: totalAccesses > 0 ? this.stats.misses / totalAccesses : 0
    };
  }
}

export function createPerformanceMonitor(config?: Partial<PerformanceConfig>): PerformanceMonitor {
  return new PerformanceMonitor(config);
}

export function createIntelligentCache(config?: Partial<CacheConfig>): IntelligentCache {
  return new IntelligentCache(config);
}