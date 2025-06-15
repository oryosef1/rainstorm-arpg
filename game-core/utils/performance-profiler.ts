// RainStorm ARPG - Performance Profiler & Optimizer
// Advanced performance monitoring, analysis, and automatic optimization

export interface PerformanceMetric {
  id: string;
  name: string;
  category: 'cpu' | 'memory' | 'network' | 'render' | 'system' | 'custom';
  value: number;
  unit: string;
  timestamp: number;
  threshold?: PerformanceThreshold;
  metadata?: Record<string, any>;
}

export interface PerformanceThreshold {
  warning: number;
  critical: number;
  target: number;
}

export interface ProfileSession {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metrics: PerformanceMetric[];
  snapshots: PerformanceSnapshot[];
  optimizations: OptimizationAction[];
  summary: SessionSummary;
}

export interface PerformanceSnapshot {
  timestamp: number;
  cpu: CpuSnapshot;
  memory: MemorySnapshot;
  render: RenderSnapshot;
  network: NetworkSnapshot;
  custom: Record<string, any>;
}

export interface CpuSnapshot {
  usage: number;
  frequency: number;
  cores: number;
  processes: ProcessInfo[];
}

export interface ProcessInfo {
  name: string;
  pid: number;
  cpu: number;
  memory: number;
}

export interface MemorySnapshot {
  used: number;
  total: number;
  available: number;
  heap: HeapInfo;
  gc: GcInfo;
}

export interface HeapInfo {
  used: number;
  total: number;
  limit: number;
  fragmentation: number;
}

export interface GcInfo {
  collections: number;
  totalTime: number;
  averageTime: number;
  lastCollection: number;
}

export interface RenderSnapshot {
  fps: number;
  frameTime: number;
  drawCalls: number;
  triangles: number;
  textures: TextureInfo;
  shaders: ShaderInfo;
}

export interface TextureInfo {
  count: number;
  memory: number;
  largest: number;
  formats: Record<string, number>;
}

export interface ShaderInfo {
  count: number;
  compilations: number;
  switches: number;
  averageCompileTime: number;
}

export interface NetworkSnapshot {
  latency: number;
  throughput: number;
  connections: number;
  requests: RequestInfo[];
}

export interface RequestInfo {
  url: string;
  method: string;
  size: number;
  duration: number;
  status: number;
}

export interface OptimizationAction {
  id: string;
  type: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  category: string;
  applied: boolean;
  timestamp: number;
  before: Record<string, number>;
  after?: Record<string, number>;
  metadata?: Record<string, any>;
}

export interface SessionSummary {
  averageFps: number;
  minFps: number;
  maxFps: number;
  averageFrameTime: number;
  memoryPeak: number;
  memoryAverage: number;
  gcCount: number;
  totalGcTime: number;
  optimizationsApplied: number;
  performanceScore: number;
  bottlenecks: Bottleneck[];
}

export interface Bottleneck {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: number;
  recommendations: string[];
}

export interface ProfilerConfig {
  enableAutoOptimization: boolean;
  snapshotInterval: number;
  maxSnapshots: number;
  enableMemoryProfiling: boolean;
  enableCpuProfiling: boolean;
  enableRenderProfiling: boolean;
  enableNetworkProfiling: boolean;
  performanceThresholds: Record<string, PerformanceThreshold>;
  optimizationStrategies: OptimizationStrategy[];
}

export interface OptimizationStrategy {
  name: string;
  category: string;
  condition: (metrics: PerformanceMetric[]) => boolean;
  action: (profiler: PerformanceProfiler) => Promise<OptimizationAction>;
  priority: number;
  enabled: boolean;
}

export class PerformanceProfiler {
  private config: ProfilerConfig;
  private currentSession: ProfileSession | null = null;
  private sessions: Map<string, ProfileSession> = new Map();
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private snapshots: PerformanceSnapshot[] = [];
  private optimizers: Map<string, OptimizationStrategy> = new Map();
  private snapshotTimer: NodeJS.Timeout | null = null;
  private observerEntries: Map<string, PerformanceObserver> = new Map();
  private startTime: number = 0;

  constructor(config?: Partial<ProfilerConfig>) {
    this.config = {
      enableAutoOptimization: true,
      snapshotInterval: 1000, // 1 second
      maxSnapshots: 1000,
      enableMemoryProfiling: true,
      enableCpuProfiling: true,
      enableRenderProfiling: true,
      enableNetworkProfiling: true,
      performanceThresholds: this.getDefaultThresholds(),
      optimizationStrategies: [],
      ...config
    };

    this.initializeOptimizers();
    this.setupPerformanceObservers();
    
    console.log('🚀 Performance Profiler initialized with auto-optimization enabled');
  }

  // =============================================================================
  // PROFILING SESSION MANAGEMENT
  // =============================================================================

  public startProfiling(sessionName: string = 'default'): ProfileSession {
    if (this.currentSession) {
      this.stopProfiling();
    }

    const session: ProfileSession = {
      id: this.generateSessionId(),
      name: sessionName,
      startTime: performance.now(),
      metrics: [],
      snapshots: [],
      optimizations: [],
      summary: {
        averageFps: 0,
        minFps: Infinity,
        maxFps: 0,
        averageFrameTime: 0,
        memoryPeak: 0,
        memoryAverage: 0,
        gcCount: 0,
        totalGcTime: 0,
        optimizationsApplied: 0,
        performanceScore: 0,
        bottlenecks: []
      }
    };

    this.currentSession = session;
    this.sessions.set(session.id, session);
    this.startTime = performance.now();

    // Start automatic snapshots
    this.startSnapshotTimer();

    console.log(`📊 Started profiling session: ${sessionName} (${session.id})`);
    return session;
  }

  public stopProfiling(): ProfileSession | null {
    if (!this.currentSession) return null;

    const session = this.currentSession;
    session.endTime = performance.now();
    session.duration = session.endTime - session.startTime;

    // Stop snapshot timer
    this.stopSnapshotTimer();

    // Generate final snapshot
    this.captureSnapshot();

    // Calculate session summary
    this.calculateSessionSummary(session);

    // Apply final optimizations
    if (this.config.enableAutoOptimization) {
      this.runOptimizations(session);
    }

    console.log(`📊 Stopped profiling session: ${session.name} (${this.formatDuration(session.duration)})`);
    console.log(`📈 Performance score: ${session.summary.performanceScore.toFixed(2)}/100`);

    this.currentSession = null;
    return session;
  }

  // =============================================================================
  // METRIC COLLECTION
  // =============================================================================

  public recordMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): void {
    const fullMetric: PerformanceMetric = {
      id: this.generateMetricId(),
      timestamp: performance.now(),
      ...metric
    };

    // Add to current session
    if (this.currentSession) {
      this.currentSession.metrics.push(fullMetric);
    }

    // Add to global metrics
    if (!this.metrics.has(metric.name)) {
      this.metrics.set(metric.name, []);
    }
    this.metrics.get(metric.name)!.push(fullMetric);

    // Check thresholds and auto-optimize
    this.checkThresholds(fullMetric);
  }

  public recordFrameTime(frameTime: number): void {
    this.recordMetric({
      name: 'frame_time',
      category: 'render',
      value: frameTime,
      unit: 'ms',
      threshold: this.config.performanceThresholds.frame_time
    });

    const fps = 1000 / frameTime;
    this.recordMetric({
      name: 'fps',
      category: 'render',
      value: fps,
      unit: 'fps',
      threshold: this.config.performanceThresholds.fps
    });
  }

  public recordMemoryUsage(usage: number, type: string = 'heap'): void {
    this.recordMetric({
      name: `memory_${type}`,
      category: 'memory',
      value: usage,
      unit: 'MB',
      threshold: this.config.performanceThresholds.memory,
      metadata: { type }
    });
  }

  public recordCpuUsage(usage: number): void {
    this.recordMetric({
      name: 'cpu_usage',
      category: 'cpu',
      value: usage,
      unit: '%',
      threshold: this.config.performanceThresholds.cpu
    });
  }

  public recordNetworkLatency(latency: number): void {
    this.recordMetric({
      name: 'network_latency',
      category: 'network',
      value: latency,
      unit: 'ms',
      threshold: this.config.performanceThresholds.network_latency
    });
  }

  public recordCustomMetric(name: string, value: number, unit: string, metadata?: Record<string, any>): void {
    this.recordMetric({
      name,
      category: 'custom',
      value,
      unit,
      metadata
    });
  }

  // =============================================================================
  // SNAPSHOT CAPTURE
  // =============================================================================

  private captureSnapshot(): PerformanceSnapshot {
    const snapshot: PerformanceSnapshot = {
      timestamp: performance.now(),
      cpu: this.captureCpuSnapshot(),
      memory: this.captureMemorySnapshot(),
      render: this.captureRenderSnapshot(),
      network: this.captureNetworkSnapshot(),
      custom: this.captureCustomSnapshot()
    };

    this.snapshots.push(snapshot);
    
    if (this.currentSession) {
      this.currentSession.snapshots.push(snapshot);
    }

    // Limit snapshot history
    if (this.snapshots.length > this.config.maxSnapshots) {
      this.snapshots.splice(0, this.snapshots.length - this.config.maxSnapshots);
    }

    return snapshot;
  }

  private captureCpuSnapshot(): CpuSnapshot {
    // In a real implementation, this would use performance APIs
    return {
      usage: this.estimateCpuUsage(),
      frequency: 2400, // MHz
      cores: navigator.hardwareConcurrency || 4,
      processes: this.getActiveProcesses()
    };
  }

  private captureMemorySnapshot(): MemorySnapshot {
    const performance = (window.performance as any);
    const memory = performance.memory || {};
    
    return {
      used: memory.usedJSHeapSize || 0,
      total: memory.totalJSHeapSize || 0,
      available: memory.jsHeapSizeLimit || 0,
      heap: {
        used: memory.usedJSHeapSize || 0,
        total: memory.totalJSHeapSize || 0,
        limit: memory.jsHeapSizeLimit || 0,
        fragmentation: this.calculateFragmentation(memory)
      },
      gc: this.getGcInfo()
    };
  }

  private captureRenderSnapshot(): RenderSnapshot {
    return {
      fps: this.getCurrentFps(),
      frameTime: this.getCurrentFrameTime(),
      drawCalls: this.getDrawCalls(),
      triangles: this.getTriangleCount(),
      textures: this.getTextureInfo(),
      shaders: this.getShaderInfo()
    };
  }

  private captureNetworkSnapshot(): NetworkSnapshot {
    return {
      latency: this.getCurrentLatency(),
      throughput: this.getCurrentThroughput(),
      connections: this.getActiveConnections(),
      requests: this.getRecentRequests()
    };
  }

  private captureCustomSnapshot(): Record<string, any> {
    return {
      gameEntities: this.getEntityCount(),
      activeSystems: this.getActiveSystemCount(),
      audioSources: this.getAudioSourceCount(),
      particleSystems: this.getParticleSystemCount()
    };
  }

  // =============================================================================
  // OPTIMIZATION ENGINE
  // =============================================================================

  private initializeOptimizers(): void {
    // FPS Optimization
    this.optimizers.set('fps_optimizer', {
      name: 'FPS Optimizer',
      category: 'render',
      condition: (metrics) => this.getAverageFps(metrics) < 30,
      action: async () => this.optimizeFps(),
      priority: 100,
      enabled: true
    });

    // Memory Optimization
    this.optimizers.set('memory_optimizer', {
      name: 'Memory Optimizer',
      category: 'memory',
      condition: (metrics) => this.getAverageMemory(metrics) > 512, // 512MB
      action: async () => this.optimizeMemory(),
      priority: 90,
      enabled: true
    });

    // CPU Optimization
    this.optimizers.set('cpu_optimizer', {
      name: 'CPU Optimizer',
      category: 'cpu',
      condition: (metrics) => this.getAverageCpu(metrics) > 80, // 80%
      action: async () => this.optimizeCpu(),
      priority: 85,
      enabled: true
    });

    // Network Optimization
    this.optimizers.set('network_optimizer', {
      name: 'Network Optimizer',
      category: 'network',
      condition: (metrics) => this.getAverageLatency(metrics) > 200, // 200ms
      action: async () => this.optimizeNetwork(),
      priority: 70,
      enabled: true
    });

    console.log(`✅ Initialized ${this.optimizers.size} optimization strategies`);
  }

  private async runOptimizations(session: ProfileSession): Promise<void> {
    const strategies = Array.from(this.optimizers.values())
      .filter(s => s.enabled)
      .sort((a, b) => b.priority - a.priority);

    for (const strategy of strategies) {
      if (strategy.condition(session.metrics)) {
        try {
          console.log(`🔧 Running optimization: ${strategy.name}`);
          const optimization = await strategy.action(this);
          session.optimizations.push(optimization);
          session.summary.optimizationsApplied++;
        } catch (error) {
          console.warn(`⚠️ Optimization failed: ${strategy.name}`, error);
        }
      }
    }
  }

  private async optimizeFps(): Promise<OptimizationAction> {
    const before = { fps: this.getCurrentFps() };
    
    // Apply FPS optimizations
    this.reduceLodDetail();
    this.optimizeShaders();
    this.cullInvisibleObjects();
    
    const after = { fps: this.getCurrentFps() };
    
    return {
      id: this.generateOptimizationId(),
      type: 'fps_optimization',
      description: 'Applied FPS optimizations: reduced LOD detail, optimized shaders, culled invisible objects',
      impact: 'high',
      category: 'render',
      applied: true,
      timestamp: performance.now(),
      before,
      after
    };
  }

  private async optimizeMemory(): Promise<OptimizationAction> {
    const before = { memory: this.getCurrentMemoryUsage() };
    
    // Apply memory optimizations
    this.runGarbageCollection();
    this.clearUnusedTextures();
    this.optimizeAssetCache();
    
    const after = { memory: this.getCurrentMemoryUsage() };
    
    return {
      id: this.generateOptimizationId(),
      type: 'memory_optimization',
      description: 'Applied memory optimizations: garbage collection, cleared unused textures, optimized asset cache',
      impact: 'medium',
      category: 'memory',
      applied: true,
      timestamp: performance.now(),
      before,
      after
    };
  }

  private async optimizeCpu(): Promise<OptimizationAction> {
    const before = { cpu: this.estimateCpuUsage() };
    
    // Apply CPU optimizations
    this.reducePrecisionCalculations();
    this.optimizeUpdateLoops();
    this.useWorkerThreads();
    
    const after = { cpu: this.estimateCpuUsage() };
    
    return {
      id: this.generateOptimizationId(),
      type: 'cpu_optimization',
      description: 'Applied CPU optimizations: reduced precision calculations, optimized update loops, enabled worker threads',
      impact: 'medium',
      category: 'cpu',
      applied: true,
      timestamp: performance.now(),
      before,
      after
    };
  }

  private async optimizeNetwork(): Promise<OptimizationAction> {
    const before = { latency: this.getCurrentLatency() };
    
    // Apply network optimizations
    this.enableRequestCompression();
    this.implementRequestBatching();
    this.optimizeConnectionPooling();
    
    const after = { latency: this.getCurrentLatency() };
    
    return {
      id: this.generateOptimizationId(),
      type: 'network_optimization',
      description: 'Applied network optimizations: enabled compression, implemented request batching, optimized connection pooling',
      impact: 'low',
      category: 'network',
      applied: true,
      timestamp: performance.now(),
      before,
      after
    };
  }

  // =============================================================================
  // ANALYSIS & REPORTING
  // =============================================================================

  private calculateSessionSummary(session: ProfileSession): void {
    const fpsMetrics = session.metrics.filter(m => m.name === 'fps');
    const frameTimeMetrics = session.metrics.filter(m => m.name === 'frame_time');
    const memoryMetrics = session.metrics.filter(m => m.name.startsWith('memory_'));

    if (fpsMetrics.length > 0) {
      session.summary.averageFps = fpsMetrics.reduce((sum, m) => sum + m.value, 0) / fpsMetrics.length;
      session.summary.minFps = Math.min(...fpsMetrics.map(m => m.value));
      session.summary.maxFps = Math.max(...fpsMetrics.map(m => m.value));
    }

    if (frameTimeMetrics.length > 0) {
      session.summary.averageFrameTime = frameTimeMetrics.reduce((sum, m) => sum + m.value, 0) / frameTimeMetrics.length;
    }

    if (memoryMetrics.length > 0) {
      session.summary.memoryAverage = memoryMetrics.reduce((sum, m) => sum + m.value, 0) / memoryMetrics.length;
      session.summary.memoryPeak = Math.max(...memoryMetrics.map(m => m.value));
    }

    // Calculate performance score
    session.summary.performanceScore = this.calculatePerformanceScore(session);

    // Identify bottlenecks
    session.summary.bottlenecks = this.identifyBottlenecks(session);
  }

  private calculatePerformanceScore(session: ProfileSession): number {
    let score = 100;
    
    // FPS scoring (40% weight)
    if (session.summary.averageFps < 30) score -= 40;
    else if (session.summary.averageFps < 45) score -= 20;
    else if (session.summary.averageFps < 60) score -= 10;
    
    // Memory scoring (25% weight)
    if (session.summary.memoryPeak > 1024) score -= 25; // 1GB
    else if (session.summary.memoryPeak > 512) score -= 15; // 512MB
    else if (session.summary.memoryPeak > 256) score -= 5; // 256MB
    
    // Frame time scoring (20% weight)
    if (session.summary.averageFrameTime > 33) score -= 20; // >33ms = <30fps
    else if (session.summary.averageFrameTime > 22) score -= 10; // >22ms = <45fps
    else if (session.summary.averageFrameTime > 16) score -= 5; // >16ms = <60fps
    
    // Optimization bonus (15% weight)
    score += Math.min(session.summary.optimizationsApplied * 3, 15);
    
    return Math.max(0, Math.min(100, score));
  }

  private identifyBottlenecks(session: ProfileSession): Bottleneck[] {
    const bottlenecks: Bottleneck[] = [];
    
    // FPS bottleneck
    if (session.summary.averageFps < 30) {
      bottlenecks.push({
        type: 'fps',
        severity: 'critical',
        description: `Average FPS is ${session.summary.averageFps.toFixed(1)}, well below target of 60`,
        impact: 40,
        recommendations: [
          'Reduce rendering complexity',
          'Optimize shaders and materials',
          'Implement level-of-detail (LOD) systems',
          'Use object pooling for frequent allocations'
        ]
      });
    }
    
    // Memory bottleneck
    if (session.summary.memoryPeak > 512) {
      bottlenecks.push({
        type: 'memory',
        severity: session.summary.memoryPeak > 1024 ? 'critical' : 'high',
        description: `Memory peak reached ${session.summary.memoryPeak.toFixed(1)}MB`,
        impact: 25,
        recommendations: [
          'Implement asset streaming',
          'Use texture compression',
          'Optimize mesh data',
          'Clear unused resources regularly'
        ]
      });
    }
    
    return bottlenecks;
  }

  // =============================================================================
  // PERFORMANCE OBSERVERS
  // =============================================================================

  private setupPerformanceObservers(): void {
    if (typeof PerformanceObserver === 'undefined') return;

    // Frame timing
    try {
      const frameObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            this.recordFrameTime(entry.duration);
          }
        }
      });
      frameObserver.observe({ entryTypes: ['measure'] });
      this.observerEntries.set('frame', frameObserver);
    } catch (error) {
      console.warn('Failed to setup frame observer:', error);
    }

    // Navigation timing
    try {
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordMetric({
              name: 'page_load_time',
              category: 'network',
              value: navEntry.loadEventEnd - navEntry.navigationStart,
              unit: 'ms'
            });
          }
        }
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observerEntries.set('navigation', navObserver);
    } catch (error) {
      console.warn('Failed to setup navigation observer:', error);
    }
  }

  // =============================================================================
  // TIMER MANAGEMENT
  // =============================================================================

  private startSnapshotTimer(): void {
    this.snapshotTimer = setInterval(() => {
      this.captureSnapshot();
    }, this.config.snapshotInterval);
  }

  private stopSnapshotTimer(): void {
    if (this.snapshotTimer) {
      clearInterval(this.snapshotTimer);
      this.snapshotTimer = null;
    }
  }

  // =============================================================================
  // THRESHOLD CHECKING
  // =============================================================================

  private checkThresholds(metric: PerformanceMetric): void {
    if (!metric.threshold) return;

    if (metric.value >= metric.threshold.critical) {
      console.error(`🚨 Critical threshold exceeded: ${metric.name} = ${metric.value}${metric.unit}`);
      this.triggerOptimization(metric);
    } else if (metric.value >= metric.threshold.warning) {
      console.warn(`⚠️ Warning threshold exceeded: ${metric.name} = ${metric.value}${metric.unit}`);
    }
  }

  private triggerOptimization(metric: PerformanceMetric): void {
    if (!this.config.enableAutoOptimization) return;

    const strategy = Array.from(this.optimizers.values())
      .find(s => s.category === metric.category && s.enabled);

    if (strategy) {
      strategy.action(this).then(optimization => {
        if (this.currentSession) {
          this.currentSession.optimizations.push(optimization);
          this.currentSession.summary.optimizationsApplied++;
        }
        console.log(`✅ Applied emergency optimization: ${strategy.name}`);
      }).catch(error => {
        console.error(`❌ Emergency optimization failed: ${strategy.name}`, error);
      });
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  public getSession(sessionId: string): ProfileSession | undefined {
    return this.sessions.get(sessionId);
  }

  public getAllSessions(): ProfileSession[] {
    return Array.from(this.sessions.values());
  }

  public getCurrentSession(): ProfileSession | null {
    return this.currentSession;
  }

  public getMetrics(metricName?: string): PerformanceMetric[] {
    if (metricName) {
      return this.metrics.get(metricName) || [];
    }
    return Array.from(this.metrics.values()).flat();
  }

  public getLatestSnapshot(): PerformanceSnapshot | null {
    return this.snapshots[this.snapshots.length - 1] || null;
  }

  public getProfilerStats(): any {
    return {
      sessionsCount: this.sessions.size,
      snapshotsCount: this.snapshots.length,
      metricsCount: this.getMetrics().length,
      optimizersCount: this.optimizers.size,
      isActive: this.currentSession !== null
    };
  }

  public exportData(): any {
    return {
      sessions: this.getAllSessions(),
      metrics: Object.fromEntries(this.metrics),
      snapshots: this.snapshots,
      config: this.config
    };
  }

  public clearData(): void {
    this.sessions.clear();
    this.metrics.clear();
    this.snapshots.splice(0);
    console.log('🧹 Profiler data cleared');
  }

  // =============================================================================
  // HELPER METHODS (STUBS FOR COMPLEX IMPLEMENTATIONS)
  // =============================================================================

  private getDefaultThresholds(): Record<string, PerformanceThreshold> {
    return {
      fps: { warning: 45, critical: 30, target: 60 },
      frame_time: { warning: 22, critical: 33, target: 16 },
      memory: { warning: 512, critical: 1024, target: 256 },
      cpu: { warning: 70, critical: 90, target: 50 },
      network_latency: { warning: 150, critical: 300, target: 50 }
    };
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMetricId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateOptimizationId(): string {
    return `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }

  // Stub implementations for complex performance tracking
  private estimateCpuUsage(): number { return Math.random() * 60 + 20; }
  private getCurrentFps(): number { return Math.random() * 30 + 45; }
  private getCurrentFrameTime(): number { return 1000 / this.getCurrentFps(); }
  private getCurrentMemoryUsage(): number { return Math.random() * 200 + 100; }
  private getCurrentLatency(): number { return Math.random() * 100 + 50; }
  private getCurrentThroughput(): number { return Math.random() * 1000 + 500; }
  private getActiveConnections(): number { return Math.floor(Math.random() * 10) + 1; }
  private getDrawCalls(): number { return Math.floor(Math.random() * 500) + 100; }
  private getTriangleCount(): number { return Math.floor(Math.random() * 50000) + 10000; }
  private getEntityCount(): number { return Math.floor(Math.random() * 100) + 50; }
  private getActiveSystemCount(): number { return Math.floor(Math.random() * 20) + 10; }
  private getAudioSourceCount(): number { return Math.floor(Math.random() * 10) + 5; }
  private getParticleSystemCount(): number { return Math.floor(Math.random() * 15) + 5; }
  private getActiveProcesses(): ProcessInfo[] { return []; }
  private calculateFragmentation(memory: any): number { return Math.random() * 0.3; }
  private getGcInfo(): GcInfo { return { collections: 0, totalTime: 0, averageTime: 0, lastCollection: 0 }; }
  private getTextureInfo(): TextureInfo { return { count: 50, memory: 128, largest: 32, formats: {} }; }
  private getShaderInfo(): ShaderInfo { return { count: 25, compilations: 30, switches: 100, averageCompileTime: 5 }; }
  private getRecentRequests(): RequestInfo[] { return []; }
  private getAverageFps(metrics: PerformanceMetric[]): number { return metrics.filter(m => m.name === 'fps').reduce((sum, m) => sum + m.value, 0) / Math.max(1, metrics.filter(m => m.name === 'fps').length); }
  private getAverageMemory(metrics: PerformanceMetric[]): number { return metrics.filter(m => m.name.startsWith('memory_')).reduce((sum, m) => sum + m.value, 0) / Math.max(1, metrics.filter(m => m.name.startsWith('memory_')).length); }
  private getAverageCpu(metrics: PerformanceMetric[]): number { return metrics.filter(m => m.name === 'cpu_usage').reduce((sum, m) => sum + m.value, 0) / Math.max(1, metrics.filter(m => m.name === 'cpu_usage').length); }
  private getAverageLatency(metrics: PerformanceMetric[]): number { return metrics.filter(m => m.name === 'network_latency').reduce((sum, m) => sum + m.value, 0) / Math.max(1, metrics.filter(m => m.name === 'network_latency').length); }

  // Optimization implementation stubs
  private reduceLodDetail(): void { console.log('  - Reduced LOD detail'); }
  private optimizeShaders(): void { console.log('  - Optimized shaders'); }
  private cullInvisibleObjects(): void { console.log('  - Culled invisible objects'); }
  private runGarbageCollection(): void { console.log('  - Forced garbage collection'); }
  private clearUnusedTextures(): void { console.log('  - Cleared unused textures'); }
  private optimizeAssetCache(): void { console.log('  - Optimized asset cache'); }
  private reducePrecisionCalculations(): void { console.log('  - Reduced precision calculations'); }
  private optimizeUpdateLoops(): void { console.log('  - Optimized update loops'); }
  private useWorkerThreads(): void { console.log('  - Enabled worker threads'); }
  private enableRequestCompression(): void { console.log('  - Enabled request compression'); }
  private implementRequestBatching(): void { console.log('  - Implemented request batching'); }
  private optimizeConnectionPooling(): void { console.log('  - Optimized connection pooling'); }

  public destroy(): void {
    this.stopSnapshotTimer();
    
    // Disconnect observers
    for (const observer of this.observerEntries.values()) {
      observer.disconnect();
    }
    this.observerEntries.clear();
    
    this.clearData();
    console.log('💥 Performance Profiler destroyed');
  }
}

// =============================================================================
// UTILITY FUNCTION
// =============================================================================

export function createPerformanceProfiler(config?: Partial<ProfilerConfig>): PerformanceProfiler {
  const profiler = new PerformanceProfiler(config);
  
  // Store reference for debugging and dashboard access
  (window as any).performanceProfiler = profiler;
  
  return profiler;
}