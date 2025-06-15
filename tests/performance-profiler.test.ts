// Performance Profiler & Optimizer Tests
// Tests advanced performance monitoring, analysis, and automatic optimization

import { 
  PerformanceProfiler, 
  createPerformanceProfiler, 
  PerformanceMetric, 
  ProfileSession, 
  OptimizationAction,
  ProfilerConfig 
} from '../game-core/utils/performance-profiler';

// Mock performance APIs for testing
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 50 * 1024 * 1024,
    totalJSHeapSize: 100 * 1024 * 1024,
    jsHeapSizeLimit: 200 * 1024 * 1024
  }
};

// Mock window objects for testing
const mockWindow = {
  performance: mockPerformance,
  PerformanceObserver: jest.fn().mockImplementation((callback) => ({
    observe: jest.fn(),
    disconnect: jest.fn()
  })),
  setInterval: jest.fn(),
  clearInterval: jest.fn()
};

// Mock global performance
(global as any).performance = mockPerformance;
(global as any).window = mockWindow;
(global as any).PerformanceObserver = mockWindow.PerformanceObserver;
(global as any).setInterval = jest.fn((callback, interval) => {
  return setTimeout(callback, interval);
});
(global as any).clearInterval = jest.fn();

describe('Performance Profiler & Optimizer', () => {
  let profiler: PerformanceProfiler;
  let originalConsoleLog: any;
  let capturedLogs: string[] = [];

  beforeEach(() => {
    // Capture console logs
    originalConsoleLog = console.log;
    capturedLogs = [];
    console.log = (...args) => {
      capturedLogs.push(args.join(' '));
    };

    // Reset mocks
    jest.clearAllMocks();
    
    profiler = new PerformanceProfiler({
      enableAutoOptimization: true,
      snapshotInterval: 100, // Faster for testing
      maxSnapshots: 10,
      enableMemoryProfiling: true,
      enableCpuProfiling: true,
      enableRenderProfiling: true,
      enableNetworkProfiling: true
    });
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    profiler.destroy();
  });

  test('should create performance profiler with default config', () => {
    const prof = createPerformanceProfiler();
    expect(prof).toBeInstanceOf(PerformanceProfiler);
    expect((window as any).performanceProfiler).toBe(prof);
    prof.destroy();
  });

  test('should start and stop profiling sessions', () => {
    const session = profiler.startProfiling('test-session');
    
    expect(session).toBeDefined();
    expect(session.name).toBe('test-session');
    expect(session.startTime).toBeGreaterThan(0);
    expect(session.endTime).toBeUndefined();
    expect(session.metrics).toEqual([]);
    expect(session.snapshots).toEqual([]);
    expect(profiler.getCurrentSession()).toBe(session);

    const stoppedSession = profiler.stopProfiling();
    
    expect(stoppedSession).toBe(session);
    expect(stoppedSession?.endTime).toBeGreaterThan(0);
    expect(stoppedSession?.duration).toBeGreaterThan(0);
    expect(profiler.getCurrentSession()).toBeNull();
  });

  test('should record performance metrics correctly', () => {
    profiler.startProfiling('metrics-test');
    
    profiler.recordMetric({
      name: 'test_metric',
      category: 'custom',
      value: 100,
      unit: 'ms'
    });

    const session = profiler.getCurrentSession();
    expect(session?.metrics).toHaveLength(1);
    expect(session?.metrics[0].name).toBe('test_metric');
    expect(session?.metrics[0].value).toBe(100);
    expect(session?.metrics[0].unit).toBe('ms');
    expect(session?.metrics[0].timestamp).toBeGreaterThan(0);
    expect(session?.metrics[0].id).toBeDefined();
  });

  test('should record frame time and fps metrics', () => {
    profiler.startProfiling('frame-test');
    
    profiler.recordFrameTime(16.67); // 60 FPS
    
    const session = profiler.getCurrentSession();
    expect(session?.metrics).toHaveLength(2); // frame_time and fps
    
    const frameTimeMetric = session?.metrics.find(m => m.name === 'frame_time');
    const fpsMetric = session?.metrics.find(m => m.name === 'fps');
    
    expect(frameTimeMetric?.value).toBe(16.67);
    expect(frameTimeMetric?.unit).toBe('ms');
    expect(fpsMetric?.value).toBeCloseTo(60, 1);
    expect(fpsMetric?.unit).toBe('fps');
  });

  test('should record memory usage metrics', () => {
    profiler.startProfiling('memory-test');
    
    profiler.recordMemoryUsage(128, 'heap');
    profiler.recordMemoryUsage(64, 'texture');
    
    const session = profiler.getCurrentSession();
    expect(session?.metrics).toHaveLength(2);
    
    const heapMetric = session?.metrics.find(m => m.name === 'memory_heap');
    const textureMetric = session?.metrics.find(m => m.name === 'memory_texture');
    
    expect(heapMetric?.value).toBe(128);
    expect(heapMetric?.metadata?.type).toBe('heap');
    expect(textureMetric?.value).toBe(64);
    expect(textureMetric?.metadata?.type).toBe('texture');
  });

  test('should record CPU and network metrics', () => {
    profiler.startProfiling('cpu-network-test');
    
    profiler.recordCpuUsage(75);
    profiler.recordNetworkLatency(150);
    
    const session = profiler.getCurrentSession();
    const cpuMetric = session?.metrics.find(m => m.name === 'cpu_usage');
    const latencyMetric = session?.metrics.find(m => m.name === 'network_latency');
    
    expect(cpuMetric?.value).toBe(75);
    expect(cpuMetric?.unit).toBe('%');
    expect(latencyMetric?.value).toBe(150);
    expect(latencyMetric?.unit).toBe('ms');
  });

  test('should record custom metrics', () => {
    profiler.startProfiling('custom-test');
    
    profiler.recordCustomMetric('entities_count', 50, 'count', { 
      type: 'game_objects' 
    });
    
    const session = profiler.getCurrentSession();
    const customMetric = session?.metrics.find(m => m.name === 'entities_count');
    
    expect(customMetric?.value).toBe(50);
    expect(customMetric?.unit).toBe('count');
    expect(customMetric?.category).toBe('custom');
    expect(customMetric?.metadata?.type).toBe('game_objects');
  });

  test('should capture performance snapshots automatically', (done) => {
    const session = profiler.startProfiling('snapshot-test');
    
    // Wait for at least one snapshot to be captured
    setTimeout(() => {
      expect(session.snapshots.length).toBeGreaterThan(0);
      
      const snapshot = session.snapshots[0];
      expect(snapshot.timestamp).toBeGreaterThan(0);
      expect(snapshot.cpu).toBeDefined();
      expect(snapshot.memory).toBeDefined();
      expect(snapshot.render).toBeDefined();
      expect(snapshot.network).toBeDefined();
      expect(snapshot.custom).toBeDefined();
      
      // Check CPU snapshot structure
      expect(snapshot.cpu.usage).toBeGreaterThanOrEqual(0);
      expect(snapshot.cpu.cores).toBeGreaterThan(0);
      expect(snapshot.cpu.frequency).toBeGreaterThan(0);
      
      // Check memory snapshot structure
      expect(snapshot.memory.used).toBeGreaterThanOrEqual(0);
      expect(snapshot.memory.heap).toBeDefined();
      expect(snapshot.memory.gc).toBeDefined();
      
      done();
    }, 150); // Wait for snapshot interval
  });

  test('should calculate session summary correctly', () => {
    const session = profiler.startProfiling('summary-test');
    
    // Add some metrics
    profiler.recordFrameTime(20); // 50 FPS
    profiler.recordFrameTime(16.67); // 60 FPS
    profiler.recordFrameTime(33.33); // 30 FPS
    profiler.recordMemoryUsage(200);
    profiler.recordMemoryUsage(300);
    
    const stoppedSession = profiler.stopProfiling();
    
    expect(stoppedSession?.summary.averageFps).toBeGreaterThan(40);
    expect(stoppedSession?.summary.averageFps).toBeLessThan(50);
    expect(stoppedSession?.summary.minFps).toBeCloseTo(30, 0);
    expect(stoppedSession?.summary.maxFps).toBeCloseTo(60, 0);
    expect(stoppedSession?.summary.averageFrameTime).toBeGreaterThan(20);
    expect(stoppedSession?.summary.averageFrameTime).toBeLessThan(26);
    expect(stoppedSession?.summary.memoryAverage).toBe(250);
    expect(stoppedSession?.summary.memoryPeak).toBe(300);
    expect(stoppedSession?.summary.performanceScore).toBeGreaterThan(0);
    expect(stoppedSession?.summary.performanceScore).toBeLessThanOrEqual(100);
  });

  test('should identify performance bottlenecks', () => {
    const session = profiler.startProfiling('bottleneck-test');
    
    // Create low FPS scenario
    for (let i = 0; i < 10; i++) {
      profiler.recordFrameTime(50); // 20 FPS
    }
    
    // Create high memory usage
    profiler.recordMemoryUsage(800); // 800MB
    
    const stoppedSession = profiler.stopProfiling();
    
    expect(stoppedSession?.summary.bottlenecks.length).toBeGreaterThan(0);
    
    const fpsBottleneck = stoppedSession?.summary.bottlenecks.find(b => b.type === 'fps');
    expect(fpsBottleneck).toBeDefined();
    expect(fpsBottleneck?.severity).toBe('critical');
    expect(fpsBottleneck?.recommendations.length).toBeGreaterThan(0);
    
    const memoryBottleneck = stoppedSession?.summary.bottlenecks.find(b => b.type === 'memory');
    expect(memoryBottleneck).toBeDefined();
    expect(memoryBottleneck?.severity).toBe('high');
  });

  test('should trigger automatic optimizations', (done) => {
    const session = profiler.startProfiling('optimization-test');
    
    // Trigger FPS optimization by recording low FPS
    for (let i = 0; i < 10; i++) {
      profiler.recordFrameTime(50); // 20 FPS - below 30 FPS threshold
    }
    
    profiler.stopProfiling();
    
    // Check if optimizations were applied
    setTimeout(() => {
      expect(session.optimizations.length).toBeGreaterThan(0);
      
      const fpsOptimization = session.optimizations.find(o => o.type === 'fps_optimization');
      expect(fpsOptimization).toBeDefined();
      expect(fpsOptimization?.applied).toBe(true);
      expect(fpsOptimization?.impact).toBe('high');
      expect(fpsOptimization?.before).toBeDefined();
      expect(fpsOptimization?.after).toBeDefined();
      
      done();
    }, 100);
  });

  test('should trigger memory optimization', (done) => {
    const session = profiler.startProfiling('memory-optimization-test');
    
    // Trigger memory optimization by recording high memory usage
    for (let i = 0; i < 10; i++) {
      profiler.recordMemoryUsage(600); // 600MB - above 512MB threshold
    }
    
    profiler.stopProfiling();
    
    setTimeout(() => {
      const memoryOptimization = session.optimizations.find(o => o.type === 'memory_optimization');
      expect(memoryOptimization).toBeDefined();
      expect(memoryOptimization?.impact).toBe('medium');
      
      done();
    }, 100);
  });

  test('should trigger CPU optimization', (done) => {
    const session = profiler.startProfiling('cpu-optimization-test');
    
    // Trigger CPU optimization by recording high CPU usage
    for (let i = 0; i < 10; i++) {
      profiler.recordCpuUsage(85); // 85% - above 80% threshold
    }
    
    profiler.stopProfiling();
    
    setTimeout(() => {
      const cpuOptimization = session.optimizations.find(o => o.type === 'cpu_optimization');
      expect(cpuOptimization).toBeDefined();
      expect(cpuOptimization?.impact).toBe('medium');
      
      done();
    }, 100);
  });

  test('should trigger network optimization', (done) => {
    const session = profiler.startProfiling('network-optimization-test');
    
    // Trigger network optimization by recording high latency
    for (let i = 0; i < 10; i++) {
      profiler.recordNetworkLatency(250); // 250ms - above 200ms threshold
    }
    
    profiler.stopProfiling();
    
    setTimeout(() => {
      const networkOptimization = session.optimizations.find(o => o.type === 'network_optimization');
      expect(networkOptimization).toBeDefined();
      expect(networkOptimization?.impact).toBe('low');
      
      done();
    }, 100);
  });

  test('should handle threshold warnings and critical alerts', () => {
    profiler.startProfiling('threshold-test');
    
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;
    const warnings: string[] = [];
    const errors: string[] = [];
    
    console.warn = (...args) => warnings.push(args.join(' '));
    console.error = (...args) => errors.push(args.join(' '));
    
    // Record metric with warning threshold
    profiler.recordMetric({
      name: 'test_warning',
      category: 'custom',
      value: 75,
      unit: 'ms',
      threshold: { warning: 50, critical: 100, target: 30 }
    });
    
    // Record metric with critical threshold
    profiler.recordMetric({
      name: 'test_critical',
      category: 'custom',
      value: 150,
      unit: 'ms',
      threshold: { warning: 50, critical: 100, target: 30 }
    });
    
    expect(warnings.length).toBeGreaterThan(0);
    expect(errors.length).toBeGreaterThan(0);
    expect(warnings[0]).toContain('Warning threshold exceeded');
    expect(errors[0]).toContain('Critical threshold exceeded');
    
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
  });

  test('should export and import profiler data', () => {
    const session = profiler.startProfiling('export-test');
    profiler.recordFrameTime(16.67);
    profiler.recordMemoryUsage(128);
    profiler.recordCustomMetric('test', 42, 'units');
    profiler.stopProfiling();
    
    const exportedData = profiler.exportData();
    
    expect(exportedData.sessions).toHaveLength(1);
    expect(exportedData.sessions[0]).toBe(session);
    expect(exportedData.metrics).toBeDefined();
    expect(exportedData.snapshots.length).toBeGreaterThanOrEqual(0);
    expect(exportedData.config).toBeDefined();
    
    // Check metrics export
    expect(Object.keys(exportedData.metrics).length).toBeGreaterThan(0);
  });

  test('should manage profiler stats correctly', () => {
    profiler.startProfiling('stats-test');
    profiler.recordFrameTime(16.67);
    profiler.recordMemoryUsage(128);
    
    const stats = profiler.getProfilerStats();
    
    expect(stats.sessionsCount).toBe(1);
    expect(stats.snapshotsCount).toBeGreaterThanOrEqual(0);
    expect(stats.metricsCount).toBeGreaterThan(0);
    expect(stats.optimizersCount).toBeGreaterThan(0);
    expect(stats.isActive).toBe(true);
    
    profiler.stopProfiling();
    
    const updatedStats = profiler.getProfilerStats();
    expect(updatedStats.isActive).toBe(false);
  });

  test('should retrieve sessions and metrics', () => {
    const session1 = profiler.startProfiling('session1');
    profiler.recordFrameTime(20);
    profiler.stopProfiling();
    
    const session2 = profiler.startProfiling('session2');
    profiler.recordFrameTime(16.67);
    profiler.stopProfiling();
    
    // Test session retrieval
    expect(profiler.getSession(session1.id)).toBe(session1);
    expect(profiler.getSession(session2.id)).toBe(session2);
    expect(profiler.getAllSessions()).toHaveLength(2);
    
    // Test metrics retrieval
    const fpsMetrics = profiler.getMetrics('fps');
    expect(fpsMetrics.length).toBe(2);
    
    const allMetrics = profiler.getMetrics();
    expect(allMetrics.length).toBeGreaterThan(2); // fps + frame_time metrics
  });

  test('should handle multiple concurrent sessions', () => {
    const session1 = profiler.startProfiling('session1');
    profiler.recordFrameTime(20);
    
    // Starting new session should stop previous one
    const session2 = profiler.startProfiling('session2');
    
    expect(profiler.getCurrentSession()).toBe(session2);
    expect(session1.endTime).toBeDefined();
    expect(session1.duration).toBeGreaterThan(0);
  });

  test('should clear profiler data', () => {
    profiler.startProfiling('clear-test');
    profiler.recordFrameTime(16.67);
    profiler.recordMemoryUsage(128);
    profiler.stopProfiling();
    
    expect(profiler.getAllSessions()).toHaveLength(1);
    expect(profiler.getMetrics().length).toBeGreaterThan(0);
    
    profiler.clearData();
    
    expect(profiler.getAllSessions()).toHaveLength(0);
    expect(profiler.getMetrics()).toHaveLength(0);
  });

  test('should get latest snapshot', () => {
    profiler.startProfiling('snapshot-latest-test');
    
    // Initially no snapshots
    expect(profiler.getLatestSnapshot()).toBeNull();
    
    // Wait for snapshot to be captured
    setTimeout(() => {
      const latestSnapshot = profiler.getLatestSnapshot();
      expect(latestSnapshot).toBeDefined();
      expect(latestSnapshot?.timestamp).toBeGreaterThan(0);
    }, 150);
  });

  test('should limit snapshot history', () => {
    const limitedProfiler = new PerformanceProfiler({
      maxSnapshots: 3,
      snapshotInterval: 10
    });
    
    limitedProfiler.startProfiling('limited-snapshots');
    
    // Wait for more snapshots than the limit
    setTimeout(() => {
      const snapshots = (limitedProfiler as any).snapshots;
      expect(snapshots.length).toBeLessThanOrEqual(3);
      limitedProfiler.destroy();
    }, 100);
  });

  test('should calculate performance score correctly', () => {
    // Test perfect performance
    const perfectSession = profiler.startProfiling('perfect');
    for (let i = 0; i < 10; i++) {
      profiler.recordFrameTime(16.67); // 60 FPS
      profiler.recordMemoryUsage(100); // 100MB
    }
    const perfectResult = profiler.stopProfiling();
    expect(perfectResult?.summary.performanceScore).toBeGreaterThan(80);
    
    // Test poor performance
    const poorSession = profiler.startProfiling('poor');
    for (let i = 0; i < 10; i++) {
      profiler.recordFrameTime(50); // 20 FPS
      profiler.recordMemoryUsage(1200); // 1.2GB
    }
    const poorResult = profiler.stopProfiling();
    expect(poorResult?.summary.performanceScore).toBeLessThan(50);
  });

  test('should handle destroyed profiler gracefully', () => {
    profiler.startProfiling('destroy-test');
    profiler.recordFrameTime(16.67);
    
    profiler.destroy();
    
    // Should not throw errors after destruction
    expect(() => {
      profiler.recordFrameTime(20);
      profiler.getProfilerStats();
    }).not.toThrow();
  });

  test('should setup performance observers correctly', () => {
    // Check that PerformanceObserver was called during initialization
    expect(mockWindow.PerformanceObserver).toHaveBeenCalled();
    
    // Verify observers were configured
    const calls = (mockWindow.PerformanceObserver as jest.Mock).mock.calls;
    expect(calls.length).toBeGreaterThan(0);
  });

  test('should handle performance observer errors gracefully', () => {
    const failingObserver = jest.fn().mockImplementation(() => {
      throw new Error('Observer setup failed');
    });
    
    const originalConsoleWarn = console.warn;
    const warnings: string[] = [];
    console.warn = (...args) => warnings.push(args.join(' '));
    
    (global as any).PerformanceObserver = failingObserver;
    
    // Should not throw when observer setup fails
    expect(() => {
      new PerformanceProfiler();
    }).not.toThrow();
    
    console.warn = originalConsoleWarn;
    (global as any).PerformanceObserver = mockWindow.PerformanceObserver;
  });

  test('should calculate session duration correctly', () => {
    const profiler2 = new PerformanceProfiler();
    
    // Test that sessions have valid durations
    const session1 = profiler2.startProfiling('duration-test');
    
    // Add small delay to ensure measurable duration
    const startTime = performance.now();
    const result1 = profiler2.stopProfiling();
    const actualDuration = performance.now() - startTime;
    
    expect(result1?.duration).toBeGreaterThan(0);
    expect(result1?.duration).toBeCloseTo(actualDuration, -1); // Within 10ms
    expect(result1?.startTime).toBeDefined();
    expect(result1?.endTime).toBeDefined();
    expect(result1?.endTime! - result1?.startTime!).toBeCloseTo(result1?.duration!, 0);
    
    profiler2.destroy();
  });
});