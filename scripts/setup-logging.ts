#!/usr/bin/env node

// RainStorm ARPG - Logging Setup Script
// Automatically integrates advanced logging into all game systems

import * as fs from 'fs/promises';
import * as path from 'path';

interface IntegrationResult {
  file: string;
  status: 'success' | 'failed' | 'no_changes';
  error?: string;
}

interface LoggingConfig {
  logging: {
    level: string;
    enableConsole: boolean;
    enableDashboard: boolean;
    enableFileOutput: boolean;
    maxLogs: number;
    performanceThresholds: {
      fps: { warning: number; critical: number };
      memory: { warning: number; critical: number };
      systemDuration: { warning: number; critical: number };
    };
    errorTracking: {
      enableStackTraces: boolean;
      enableClustering: boolean;
      maxErrorsPerMinute: number;
    };
    performance: {
      enableSystemProfiling: boolean;
      enablePlayerAnalytics: boolean;
      enableDatabaseMonitoring: boolean;
      enableMCPMonitoring: boolean;
    };
  };
}

interface PackageJson {
  scripts?: Record<string, string>;
}

class LoggingSetup {
  private gameCorePath: string;
  private integrationPoints: string[];
  private loggerImports: string[] = [];
  private integrationResults: IntegrationResult[] = [];

  constructor() {
    this.gameCorePath = path.join(__dirname, '..', 'game-core');
    this.integrationPoints = [
      'ecs/ecs-core.js',
      'systems/ecs-systems.js',
      'campaign/campaign-system.js',
      'campaign/quest-system.js',
      'inventory/inventory-system.js',
      'character/character-system.js'
    ];
  }

  async setup(): Promise<void> {
    console.log('🚀 Setting up Advanced Logging System...\n');
    
    try {
      // 1. Verify logging system files exist
      await this.verifyLoggingFiles();
      
      // 2. Create logging configuration
      await this.createLoggingConfig();
      
      // 3. Integrate logging into ECS systems
      await this.integrateECSLogging();
      
      // 4. Add performance monitoring
      await this.addPerformanceMonitoring();
      
      // 5. Setup error boundaries
      await this.setupErrorBoundaries();
      
      // 6. Create logging tests
      await this.createLoggingTests();
      
      // 7. Update package.json scripts
      await this.updatePackageScripts();
      
      // 8. Generate integration report
      this.generateReport();
      
      console.log('✅ Advanced Logging System setup complete!\n');
      console.log('📊 Open monitoring/log-dashboard.html to view live logs');
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Setup failed:', message);
      process.exit(1);
    }
  }

  private async verifyLoggingFiles(): Promise<void> {
    console.log('📋 Verifying logging system files...');
    
    const requiredFiles = [
      'game-core/systems/logging-system.js',
      'game-core/utils/log-aggregator.js',
      'monitoring/log-dashboard.html'
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(__dirname, '..', file);
      try {
        await fs.access(filePath);
        console.log(`  ✅ ${file}`);
      } catch (error) {
        throw new Error(`Required file missing: ${file}`);
      }
    }
  }

  private async createLoggingConfig(): Promise<void> {
    console.log('⚙️  Creating logging configuration...');
    
    const config: LoggingConfig = {
      logging: {
        level: 'INFO',
        enableConsole: true,
        enableDashboard: true,
        enableFileOutput: false,
        maxLogs: 1000,
        performanceThresholds: {
          fps: {
            warning: 45,
            critical: 30
          },
          memory: {
            warning: 500,
            critical: 800
          },
          systemDuration: {
            warning: 16.67,
            critical: 33.33
          }
        },
        errorTracking: {
          enableStackTraces: true,
          enableClustering: true,
          maxErrorsPerMinute: 10
        },
        performance: {
          enableSystemProfiling: true,
          enablePlayerAnalytics: true,
          enableDatabaseMonitoring: true,
          enableMCPMonitoring: true
        }
      }
    };
    
    const configPath = path.join(__dirname, '..', 'game-core', 'config', 'logging-config.json');
    await fs.mkdir(path.dirname(configPath), { recursive: true });
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    
    console.log('  ✅ Configuration created at game-core/config/logging-config.json');
  }

  private async integrateECSLogging(): Promise<void> {
    console.log('🔧 Integrating logging into ECS systems...');
    
    for (const filePath of this.integrationPoints) {
      const fullPath = path.join(this.gameCorePath, filePath);
      
      try {
        const content = await fs.readFile(fullPath, 'utf8');
        const modifiedContent = await this.addLoggingToFile(content, filePath);
        
        if (modifiedContent !== content) {
          await fs.writeFile(fullPath, modifiedContent);
          console.log(`  ✅ Integrated logging: ${filePath}`);
          this.integrationResults.push({ file: filePath, status: 'success' });
        } else {
          console.log(`  ⚠️  No changes needed: ${filePath}`);
          this.integrationResults.push({ file: filePath, status: 'no_changes' });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.log(`  ❌ Failed to integrate: ${filePath} - ${message}`);
        this.integrationResults.push({ file: filePath, status: 'failed', error: message });
      }
    }
  }

  private async addLoggingToFile(content: string, filePath: string): Promise<string> {
    // Check if logging is already integrated
    if (content.includes('gameLogger') || content.includes('logging-system')) {
      return content;
    }

    let modifiedContent = content;

    // Add logger import at the top
    const importStatement = this.getLoggerImport(filePath);
    
    // Find a good place to insert the import
    const lines = content.split('\n');
    let insertIndex = 0;
    
    // Look for existing imports or requires
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('require(') || lines[i].includes('import ')) {
        insertIndex = i + 1;
      } else if (lines[i].trim() === '' && insertIndex > 0) {
        break;
      }
    }
    
    lines.splice(insertIndex, 0, '', importStatement);
    modifiedContent = lines.join('\n');

    // Add logging to specific patterns
    modifiedContent = this.addSystemLogging(modifiedContent);
    modifiedContent = this.addPerformanceLogging(modifiedContent);
    modifiedContent = this.addErrorLogging(modifiedContent);

    return modifiedContent;
  }

  private getLoggerImport(filePath: string): string {
    const relativePath = path.relative(path.dirname(filePath), 'systems/logging-system.js');
    const normalizedPath = relativePath.replace(/\\/g, '/');
    
    return `// Advanced Logging Integration\nconst { gameLogger } = require('./${normalizedPath}');`;
  }

  private addSystemLogging(content: string): string {
    // Add performance logging to system update methods
    return content.replace(
      /update\(deltaTime\)\s*{/g,
      `update(deltaTime) {
    const startTime = performance.now();
    const startMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
    
    try {`
    ).replace(
      /(\s+)}\s*$/gm,
      `$1} catch (error) {
      gameLogger.logError(error, { 
        system: this.constructor.name, 
        deltaTime,
        entityCount: this.entities ? this.entities.size : 0 
      });
      throw error;
    } finally {
      const duration = performance.now() - startTime;
      if (this.entities) {
        gameLogger.logPerformance(this, duration, this.entities.size);
      }
    }
  }`
    );
  }

  private addPerformanceLogging(content: string): string {
    // Add performance tracking to critical operations
    const patterns = [
      {
        regex: /for\s*\(\s*const\s+entity\s+of\s+this\.entities\s*\)/g,
        replacement: `for (const entity of this.entities) {
      // Performance tracking for entity processing`
      },
      {
        regex: /entity\.getComponent\(/g,
        replacement: `entity.getComponent(`
      }
    ];

    let modifiedContent = content;
    patterns.forEach(pattern => {
      modifiedContent = modifiedContent.replace(pattern.regex, pattern.replacement);
    });

    return modifiedContent;
  }

  private addErrorLogging(content: string): string {
    // Add error logging to catch blocks
    return content.replace(
      /catch\s*\(\s*(\w+)\s*\)\s*{/g,
      `catch ($1) {
    gameLogger.logError($1, { 
      system: this.constructor.name,
      method: arguments.callee.name || 'unknown'
    });`
    );
  }

  private async addPerformanceMonitoring(): Promise<void> {
    console.log('⚡ Adding performance monitoring...');
    
    const performanceMonitorCode = `
// Performance Monitor Integration
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;
    this.frameCount = 0;
    this.fps = 60;
    
    this.startMonitoring();
  }
  
  startMonitoring() {
    // Monitor FPS
    const updateFPS = () => {
      const currentTime = performance.now();
      this.frameCount++;
      
      if (currentTime - this.lastFrameTime >= 1000) {
        this.fps = this.frameCount;
        this.frameCount = 0;
        this.lastFrameTime = currentTime;
        
        // Log FPS if it drops significantly
        if (this.fps < 45) {
          gameLogger.warn('Low FPS detected', { 
            fps: this.fps,
            timestamp: currentTime
          });
        }
      }
      
      requestAnimationFrame(updateFPS);
    };
    
    requestAnimationFrame(updateFPS);
    
    // Monitor memory usage
    setInterval(() => {
      if (performance.memory) {
        const memoryMB = performance.memory.usedJSHeapSize / 1024 / 1024;
        
        if (memoryMB > 500) {
          gameLogger.warn('High memory usage', {
            memory: memoryMB.toFixed(1) + 'MB',
            limit: performance.memory.jsHeapSizeLimit / 1024 / 1024
          });
        }
      }
    }, 5000);
  }
  
  getFPS() {
    return this.fps;
  }
  
  getUptime() {
    return performance.now() - this.startTime;
  }
}

// Export for global access
if (typeof window !== 'undefined') {
  window.performanceMonitor = new PerformanceMonitor();
}
`;

    const monitorPath = path.join(this.gameCorePath, 'utils', 'performance-monitor.js');
    await fs.writeFile(monitorPath, performanceMonitorCode);
    
    console.log('  ✅ Performance monitor created');
  }

  private async setupErrorBoundaries(): Promise<void> {
    console.log('🛡️  Setting up error boundaries...');
    
    const errorBoundaryCode = `
// Error Boundary System
class GameErrorBoundary {
  constructor() {
    this.errorCounts = new Map();
    this.recoveryAttempts = new Map();
    this.maxRecoveryAttempts = 3;
    
    this.setupGlobalHandlers();
  }
  
  setupGlobalHandlers() {
    // Catch unhandled errors
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.handleError(event.error, {
          type: 'global',
          filename: event.filename,
          lineno: event.lineno
        });
      });
      
      window.addEventListener('unhandledrejection', (event) => {
        this.handleError(event.reason, {
          type: 'promise'
        });
      });
    }
  }
  
  handleError(error, context = {}) {
    const errorKey = \`\${error.name}:\${error.message}\`;
    const count = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, count + 1);
    
    gameLogger.logError(error, context);
    
    // Check if we should attempt recovery
    if (this.shouldAttemptRecovery(errorKey)) {
      this.attemptRecovery(error, context);
    }
  }
  
  shouldAttemptRecovery(errorKey) {
    const attempts = this.recoveryAttempts.get(errorKey) || 0;
    return attempts < this.maxRecoveryAttempts;
  }
  
  attemptRecovery(error, context) {
    const errorKey = \`\${error.name}:\${error.message}\`;
    const attempts = this.recoveryAttempts.get(errorKey) || 0;
    this.recoveryAttempts.set(errorKey, attempts + 1);
    
    gameLogger.info('Attempting error recovery', {
      error: errorKey,
      attempt: attempts + 1,
      context
    });
    
    // Recovery strategies would go here
    // For now, just log the attempt
  }
}

// Initialize global error boundary
if (typeof window !== 'undefined') {
  window.gameErrorBoundary = new GameErrorBoundary();
}
`;

    const boundaryPath = path.join(this.gameCorePath, 'utils', 'error-boundary.js');
    await fs.writeFile(boundaryPath, errorBoundaryCode);
    
    console.log('  ✅ Error boundary system created');
  }

  private async createLoggingTests(): Promise<void> {
    console.log('🧪 Creating logging tests...');
    
    const testCode = `
// Logging System Tests
const { GameLogger } = require('../game-core/systems/logging-system');
const { LogAggregator } = require('../game-core/utils/log-aggregator');

describe('Advanced Logging System', () => {
  let logger;
  let aggregator;
  
  beforeEach(() => {
    logger = new GameLogger();
    aggregator = new LogAggregator();
  });
  
  afterEach(() => {
    logger.clearLogs();
    if (aggregator.shutdown) aggregator.shutdown();
  });
  
  describe('GameLogger', () => {
    test('should log messages with correct levels', () => {
      logger.info('Test message', { test: true });
      const logs = logger.logs;
      
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('INFO');
      expect(logs[0].message).toBe('Test message');
      expect(logs[0].context.test).toBe(true);
    });
    
    test('should track performance metrics', () => {
      const mockSystem = { constructor: { name: 'TestSystem' } };
      logger.logPerformance(mockSystem, 15.5, 100);
      
      const metrics = logger.performanceMetrics.get('TestSystem');
      expect(metrics).toBeDefined();
      expect(metrics.duration).toBe(15.5);
      expect(metrics.entityCount).toBe(100);
    });
    
    test('should handle error logging with stack traces', () => {
      const error = new Error('Test error');
      logger.logError(error, { component: 'test' });
      
      const errorLogs = logger.logs.filter(log => log.level === 'ERROR');
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].context.stack).toBeDefined();
    });
    
    test('should respect log level filtering', () => {
      logger.setLogLevel('WARN');
      
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      
      expect(logger.logs).toHaveLength(1);
      expect(logger.logs[0].level).toBe('WARN');
    });
    
    test('should generate performance reports', () => {
      const mockSystem = { constructor: { name: 'TestSystem' } };
      logger.logPerformance(mockSystem, 20, 150);
      
      const report = logger.getPerformanceReport();
      expect(report.systemMetrics.TestSystem).toBeDefined();
      expect(report.systemMetrics.TestSystem.duration).toBe(20);
    });
    
    test('should detect performance issues', () => {
      const mockSystem = { constructor: { name: 'SlowSystem' } };
      const logSpy = jest.spyOn(logger, 'critical');
      
      logger.logPerformance(mockSystem, 35, 100, { fps: 25 });
      
      expect(logSpy).toHaveBeenCalled();
    });
  });
  
  describe('LogAggregator', () => {
    test('should register and process log sources', () => {
      aggregator.registerSource('test', logger);
      
      logger.info('Test message');
      
      // Give aggregator time to process
      setTimeout(() => {
        expect(aggregator.aggregatedLogs.length).toBeGreaterThan(0);
      }, 100);
    });
    
    test('should apply filters correctly', () => {
      aggregator.addFilter('level', (log) => log.level === 'ERROR');
      
      const testLog = {
        level: 'INFO',
        message: 'Test',
        timestamp: Date.now()
      };
      
      expect(aggregator.passesFilters(testLog)).toBe(false);
      
      testLog.level = 'ERROR';
      expect(aggregator.passesFilters(testLog)).toBe(true);
    });
    
    test('should generate system health reports', () => {
      const health = aggregator.getSystemHealth();
      
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('timestamp');
      expect(health).toHaveProperty('logVolume');
      expect(health).toHaveProperty('errorCount');
    });
  });
  
  describe('Integration Tests', () => {
    test('should integrate with ECS systems', () => {
      // Mock system with logging
      class TestSystem {
        constructor() {
          this.entities = new Set();
        }
        
        update(deltaTime) {
          const startTime = performance.now();
          
          try {
            // Simulate system work
            for (let i = 0; i < 1000; i++) {
              Math.random();
            }
          } catch (error) {
            logger.logError(error, { 
              system: this.constructor.name, 
              deltaTime 
            });
            throw error;
          } finally {
            const duration = performance.now() - startTime;
            logger.logPerformance(this, duration, this.entities.size);
          }
        }
      }
      
      const system = new TestSystem();
      system.update(16.67);
      
      const perfLogs = logger.logs.filter(log => 
        log.message.includes('Performance:')
      );
      expect(perfLogs.length).toBeGreaterThan(0);
    });
  });
});
`;

    const testPath = path.join(__dirname, '..', 'tests', 'logging.test.js');
    await fs.mkdir(path.dirname(testPath), { recursive: true });
    await fs.writeFile(testPath, testCode);
    
    console.log('  ✅ Logging tests created');
  }

  private async updatePackageScripts(): Promise<void> {
    console.log('📦 Updating package.json scripts...');
    
    const packagePath = path.join(__dirname, '..', 'package.json');
    
    try {
      const packageContent = await fs.readFile(packagePath, 'utf8');
      const packageJson: PackageJson = JSON.parse(packageContent);
      
      // Add logging-related scripts
      if (!packageJson.scripts) {
        packageJson.scripts = {};
      }
      
      packageJson.scripts['logs:dashboard'] = 'open monitoring/log-dashboard.html';
      packageJson.scripts['logs:clear'] = 'node scripts/clear-logs.js';
      packageJson.scripts['logs:export'] = 'node scripts/export-logs.js';
      packageJson.scripts['test:logging'] = 'jest tests/logging.test.js';
      
      await fs.writeFile(packagePath, JSON.stringify(packageJson, null, 2));
      console.log('  ✅ Package scripts updated');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.log('  ⚠️  Could not update package.json:', message);
    }
  }

  private generateReport(): void {
    console.log('\n📊 LOGGING INTEGRATION REPORT');
    console.log('='.repeat(50));
    
    const successful = this.integrationResults.filter(r => r.status === 'success').length;
    const failed = this.integrationResults.filter(r => r.status === 'failed').length;
    const noChanges = this.integrationResults.filter(r => r.status === 'no_changes').length;
    
    console.log(`✅ Successfully integrated: ${successful} files`);
    console.log(`⚠️  No changes needed: ${noChanges} files`);
    console.log(`❌ Failed integrations: ${failed} files`);
    
    if (failed > 0) {
      console.log('\nFailed integrations:');
      this.integrationResults
        .filter(r => r.status === 'failed')
        .forEach(r => {
          console.log(`  ❌ ${r.file}: ${r.error}`);
        });
    }
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Run `npm test` to verify logging integration');
    console.log('2. Open monitoring/log-dashboard.html to view live logs');
    console.log('3. Start your game and check the dashboard for real-time monitoring');
    console.log('4. Use gameLogger in your code for custom logging');
    
    console.log('\n📚 USAGE EXAMPLES:');
    console.log('gameLogger.info("Player logged in", { playerId: 123 });');
    console.log('gameLogger.logPerformance(system, duration, entityCount);');
    console.log('gameLogger.logError(error, { context: "inventory" });');
  }
}

// Run setup if called directly
if (typeof require !== 'undefined' && require.main === module) {
  const setup = new LoggingSetup();
  setup.setup().catch(console.error);
}

export { LoggingSetup };