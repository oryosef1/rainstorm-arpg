// Feature Discovery System - Automatic feature detection and hot-reloading
// Enables unlimited parallel development with automatic feature integration

import * as fs from 'fs/promises';
import * as path from 'path';
import { EventBus, globalEventBus } from './event-bus';
import { APIRegistry, globalAPIRegistry } from './api-registry';
import { FeaturePod } from '../templates/feature-pod-template';

export interface FeatureDiscoveryConfig {
  featuresDirectory?: string;
  enableHotReload?: boolean;
  enableAutoLoad?: boolean;
  watchPatterns?: string[];
  excludePatterns?: string[];
  eventBus?: EventBus;
  apiRegistry?: APIRegistry;
  scanInterval?: number;
  loadTimeout?: number;
}

export interface DiscoveredFeature {
  name: string;
  path: string;
  version?: string;
  podFile: string;
  configFile?: string;
  lastModified: number;
  status: 'discovered' | 'loading' | 'loaded' | 'error' | 'unloaded';
  instance?: FeaturePod;
  error?: string;
  dependencies?: string[];
}

export interface FeatureLoadResult {
  success: boolean;
  feature?: DiscoveredFeature;
  error?: string;
  loadTime?: number;
}

export interface DiscoveryMetrics {
  totalFeatures: number;
  loadedFeatures: number;
  errorFeatures: number;
  discoveryTime: number;
  lastScan: number;
  hotReloads: number;
  loadErrors: Array<{ feature: string; error: string; timestamp: number }>;
}

export class FeatureDiscovery {
  private config: FeatureDiscoveryConfig;
  private eventBus: EventBus;
  private apiRegistry: APIRegistry;
  private discoveredFeatures: Map<string, DiscoveredFeature> = new Map();
  private fileWatchers: Map<string, any> = new Map();
  private isScanning: boolean = false;
  private metrics: DiscoveryMetrics;
  private scanInterval?: NodeJS.Timeout;

  constructor(config: FeatureDiscoveryConfig = {}) {
    this.config = {
      featuresDirectory: config.featuresDirectory || './features',
      enableHotReload: config.enableHotReload ?? true,
      enableAutoLoad: config.enableAutoLoad ?? true,
      watchPatterns: config.watchPatterns || ['**/*.pod.ts', '**/*.pod.js'],
      excludePatterns: config.excludePatterns || ['**/node_modules/**', '**/*.test.*', '**/dist/**'],
      scanInterval: config.scanInterval || 5000, // 5 seconds
      loadTimeout: config.loadTimeout || 30000, // 30 seconds
      ...config
    };

    this.eventBus = config.eventBus || globalEventBus;
    this.apiRegistry = config.apiRegistry || globalAPIRegistry;
    
    this.metrics = this.initializeMetrics();

    // Start automatic scanning if enabled
    if (this.config.enableAutoLoad) {
      this.startAutoDiscovery();
    }

    console.log('🔍 Feature Discovery System initialized');
  }

  private initializeMetrics(): DiscoveryMetrics {
    return {
      totalFeatures: 0,
      loadedFeatures: 0,
      errorFeatures: 0,
      discoveryTime: 0,
      lastScan: 0,
      hotReloads: 0,
      loadErrors: []
    };
  }

  // === AUTO DISCOVERY ===

  /**
   * Start automatic feature discovery
   */
  async startAutoDiscovery(): Promise<void> {
    console.log('🚀 Starting automatic feature discovery');

    // Initial scan
    await this.discoverFeatures();

    // Setup periodic scanning
    if (this.config.scanInterval && this.config.scanInterval > 0) {
      this.scanInterval = setInterval(async () => {
        await this.discoverFeatures();
      }, this.config.scanInterval);
    }

    // Setup file watching for hot reload
    if (this.config.enableHotReload) {
      await this.setupFileWatching();
    }
  }

  /**
   * Stop automatic discovery
   */
  async stopAutoDiscovery(): Promise<void> {
    console.log('🛑 Stopping automatic feature discovery');

    // Clear scan interval
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = undefined;
    }

    // Stop file watching
    await this.stopFileWatching();
  }

  // === FEATURE DISCOVERY ===

  /**
   * Discover all features in the features directory
   */
  async discoverFeatures(): Promise<DiscoveredFeature[]> {
    if (this.isScanning) {
      console.log('🔍 Discovery already in progress, skipping...');
      return Array.from(this.discoveredFeatures.values());
    }

    this.isScanning = true;
    const startTime = Date.now();

    try {
      console.log(`🔍 Scanning for features in: ${this.config.featuresDirectory}`);

      // Check if features directory exists
      try {
        await fs.access(this.config.featuresDirectory!);
      } catch (error) {
        console.warn(`⚠️ Features directory not found: ${this.config.featuresDirectory}`);
        return [];
      }

      // Scan for feature directories
      const featureDirectories = await this.scanFeatureDirectories();
      console.log(`📁 Found ${featureDirectories.length} potential feature directories`);

      // Process each directory
      const discoveries: DiscoveredFeature[] = [];
      
      for (const directory of featureDirectories) {
        try {
          const feature = await this.discoverFeatureInDirectory(directory);
          if (feature) {
            discoveries.push(feature);
            this.discoveredFeatures.set(feature.name, feature);
          }
        } catch (error) {
          console.error(`❌ Failed to discover feature in ${directory}:`, error);
        }
      }

      // Auto-load features if enabled
      if (this.config.enableAutoLoad) {
        await this.autoLoadFeatures(discoveries);
      }

      // Update metrics
      this.metrics.totalFeatures = this.discoveredFeatures.size;
      this.metrics.discoveryTime = Date.now() - startTime;
      this.metrics.lastScan = Date.now();

      console.log(`✅ Feature discovery completed: ${discoveries.length} features found in ${this.metrics.discoveryTime}ms`);

      // Emit discovery event
      this.eventBus.emitSync('discovery.features.scanned', {
        featuresFound: discoveries.length,
        totalTime: this.metrics.discoveryTime,
        features: discoveries.map(f => ({ name: f.name, status: f.status }))
      }, 'feature-discovery');

      return discoveries;

    } finally {
      this.isScanning = false;
    }
  }

  private async scanFeatureDirectories(): Promise<string[]> {
    const directories: string[] = [];
    
    try {
      const entries = await fs.readdir(this.config.featuresDirectory!, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const fullPath = path.join(this.config.featuresDirectory!, entry.name);
          
          // Check if directory should be excluded
          if (!this.shouldExcludeDirectory(fullPath)) {
            directories.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error scanning feature directories:', error);
    }

    return directories;
  }

  private shouldExcludeDirectory(dirPath: string): boolean {
    const relativePath = path.relative(this.config.featuresDirectory!, dirPath);
    
    for (const pattern of this.config.excludePatterns!) {
      // Simple pattern matching - in production, use a proper glob library
      if (relativePath.includes(pattern.replace(/\*\*/g, '').replace(/\*/g, ''))) {
        return true;
      }
    }
    
    return false;
  }

  private async discoverFeatureInDirectory(directory: string): Promise<DiscoveredFeature | null> {
    try {
      const featureName = path.basename(directory);
      
      // Look for pod file
      const podFile = await this.findPodFile(directory);
      if (!podFile) {
        return null;
      }

      // Get file stats
      const stats = await fs.stat(podFile);
      
      // Look for config file
      const configFile = await this.findConfigFile(directory);
      
      // Read version and dependencies from package.json if exists
      let version = '1.0.0';
      let dependencies: string[] = [];
      
      try {
        const packageJsonPath = path.join(directory, 'package.json');
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
        version = packageJson.version || version;
        dependencies = Object.keys(packageJson.dependencies || {});
      } catch (error) {
        // No package.json or invalid - use defaults
      }

      const feature: DiscoveredFeature = {
        name: featureName,
        path: directory,
        version,
        podFile,
        configFile,
        lastModified: stats.mtime.getTime(),
        status: 'discovered',
        dependencies
      };

      console.log(`📦 Discovered feature: ${featureName} v${version}`);
      return feature;

    } catch (error) {
      console.error(`❌ Error discovering feature in ${directory}:`, error);
      return null;
    }
  }

  private async findPodFile(directory: string): Promise<string | null> {
    const possibleNames = [
      `${path.basename(directory)}.pod.ts`,
      `${path.basename(directory)}.pod.js`,
      'index.pod.ts',
      'index.pod.js',
      'pod.ts',
      'pod.js'
    ];

    for (const fileName of possibleNames) {
      const filePath = path.join(directory, fileName);
      try {
        await fs.access(filePath);
        return filePath;
      } catch (error) {
        // File doesn't exist, try next
      }
    }

    return null;
  }

  private async findConfigFile(directory: string): Promise<string | null> {
    const possibleNames = [
      `${path.basename(directory)}.config.ts`,
      `${path.basename(directory)}.config.js`,
      'config.ts',
      'config.js',
      'feature.config.ts',
      'feature.config.js'
    ];

    for (const fileName of possibleNames) {
      const filePath = path.join(directory, fileName);
      try {
        await fs.access(filePath);
        return filePath;
      } catch (error) {
        // File doesn't exist, try next
      }
    }

    return null;
  }

  // === FEATURE LOADING ===

  /**
   * Auto-load discovered features
   */
  private async autoLoadFeatures(features: DiscoveredFeature[]): Promise<void> {
    for (const feature of features) {
      if (feature.status === 'discovered') {
        // Check if feature is already loaded
        const existing = this.discoveredFeatures.get(feature.name);
        if (existing && existing.status === 'loaded') {
          continue;
        }

        // Load the feature
        const result = await this.loadFeature(feature.name);
        if (!result.success) {
          console.error(`❌ Auto-load failed for feature '${feature.name}':`, result.error);
        }
      }
    }
  }

  /**
   * Load a specific feature
   */
  async loadFeature(featureName: string): Promise<FeatureLoadResult> {
    const startTime = Date.now();
    const feature = this.discoveredFeatures.get(featureName);

    if (!feature) {
      return {
        success: false,
        error: `Feature '${featureName}' not discovered`
      };
    }

    if (feature.status === 'loaded') {
      return {
        success: true,
        feature,
        loadTime: 0
      };
    }

    feature.status = 'loading';

    try {
      console.log(`⏳ Loading feature: ${featureName}`);

      // Load dependencies first
      if (feature.dependencies && feature.dependencies.length > 0) {
        await this.loadDependencies(feature.dependencies);
      }

      // Import the pod module
      const podModule = await this.importPodModule(feature.podFile);
      
      // Find the pod class
      const PodClass = this.findPodClass(podModule, featureName);
      
      // Load configuration if available
      const config = await this.loadFeatureConfig(feature);
      
      // Create pod instance
      const podInstance = new PodClass({
        name: featureName,
        version: feature.version || '1.0.0',
        description: `Auto-discovered feature: ${featureName}`,
        dependencies: feature.dependencies,
        ...config,
        eventBus: this.eventBus,
        apiRegistry: this.apiRegistry
      });

      // Wait for initialization (with timeout)
      await this.waitForInitialization(podInstance);

      feature.instance = podInstance;
      feature.status = 'loaded';
      
      const loadTime = Date.now() - startTime;

      // Update metrics
      this.metrics.loadedFeatures++;

      console.log(`✅ Feature '${featureName}' loaded successfully in ${loadTime}ms`);

      // Emit load event
      this.eventBus.emitSync('discovery.feature.loaded', {
        featureName,
        version: feature.version,
        loadTime
      }, 'feature-discovery');

      return {
        success: true,
        feature,
        loadTime
      };

    } catch (error) {
      feature.status = 'error';
      feature.error = (error as Error).message;
      
      // Update metrics
      this.metrics.errorFeatures++;
      this.metrics.loadErrors.push({
        feature: featureName,
        error: (error as Error).message,
        timestamp: Date.now()
      });

      console.error(`❌ Failed to load feature '${featureName}':`, error);

      return {
        success: false,
        error: (error as Error).message,
        loadTime: Date.now() - startTime
      };
    }
  }

  private async loadDependencies(dependencies: string[]): Promise<void> {
    for (const dependency of dependencies) {
      if (!this.apiRegistry.hasFeature(dependency)) {
        // Try to load the dependency if it's discovered
        if (this.discoveredFeatures.has(dependency)) {
          const result = await this.loadFeature(dependency);
          if (!result.success) {
            throw new Error(`Failed to load dependency '${dependency}': ${result.error}`);
          }
        } else {
          console.warn(`⚠️ Dependency '${dependency}' not found`);
        }
      }
    }
  }

  private async importPodModule(podFile: string): Promise<any> {
    try {
      // Clear require cache for hot reload
      if (require.cache[path.resolve(podFile)]) {
        delete require.cache[path.resolve(podFile)];
      }

      const module = await import(path.resolve(podFile));
      return module;
    } catch (error) {
      throw new Error(`Failed to import pod module: ${(error as Error).message}`);
    }
  }

  private findPodClass(module: any, featureName: string): any {
    // Look for exported pod class
    const possibleNames = [
      `${featureName}Pod`,
      `${featureName.charAt(0).toUpperCase() + featureName.slice(1)}Pod`,
      'Pod',
      'FeaturePod',
      'default'
    ];

    for (const name of possibleNames) {
      if (module[name] && typeof module[name] === 'function') {
        return module[name];
      }
    }

    throw new Error(`No pod class found in module. Expected one of: ${possibleNames.join(', ')}`);
  }

  private async loadFeatureConfig(feature: DiscoveredFeature): Promise<any> {
    if (!feature.configFile) {
      return {};
    }

    try {
      const configModule = await import(path.resolve(feature.configFile));
      return configModule.default || configModule.config || {};
    } catch (error) {
      console.warn(`⚠️ Failed to load config for feature '${feature.name}':`, error);
      return {};
    }
  }

  private async waitForInitialization(podInstance: FeaturePod): Promise<void> {
    const timeout = this.config.loadTimeout!;
    const startTime = Date.now();

    while (!podInstance.isReady() && (Date.now() - startTime) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!podInstance.isReady()) {
      throw new Error(`Feature initialization timed out after ${timeout}ms`);
    }
  }

  // === HOT RELOADING ===

  private async setupFileWatching(): Promise<void> {
    try {
      const chokidar = await import('chokidar');
      
      const watcher = chokidar.watch(this.config.featuresDirectory!, {
        persistent: true,
        ignoreInitial: true,
        ignored: this.config.excludePatterns
      });

      watcher.on('change', async (filePath: string) => {
        await this.handleFileChange(filePath);
      });

      watcher.on('add', async (filePath: string) => {
        await this.handleFileAdd(filePath);
      });

      watcher.on('unlink', async (filePath: string) => {
        await this.handleFileRemove(filePath);
      });

      console.log('👁️ File watching enabled for hot reload');

    } catch (error) {
      console.warn('⚠️ Could not setup file watching. Hot reload disabled.');
    }
  }

  private async stopFileWatching(): Promise<void> {
    for (const [path, watcher] of this.fileWatchers) {
      try {
        await watcher.close();
      } catch (error) {
        console.error(`❌ Error closing file watcher for ${path}:`, error);
      }
    }
    this.fileWatchers.clear();
  }

  private async handleFileChange(filePath: string): Promise<void> {
    const featureName = this.getFeatureNameFromPath(filePath);
    if (featureName) {
      console.log(`🔄 Hot reloading feature: ${featureName}`);
      await this.hotReloadFeature(featureName);
    }
  }

  private async handleFileAdd(filePath: string): Promise<void> {
    if (this.isPodFile(filePath)) {
      console.log(`➕ New feature pod detected: ${filePath}`);
      await this.discoverFeatures();
    }
  }

  private async handleFileRemove(filePath: string): Promise<void> {
    const featureName = this.getFeatureNameFromPath(filePath);
    if (featureName && this.isPodFile(filePath)) {
      console.log(`➖ Feature pod removed: ${featureName}`);
      await this.unloadFeature(featureName);
    }
  }

  private getFeatureNameFromPath(filePath: string): string | null {
    const relativePath = path.relative(this.config.featuresDirectory!, filePath);
    const parts = relativePath.split(path.sep);
    return parts.length > 0 ? parts[0] : null;
  }

  private isPodFile(filePath: string): boolean {
    return this.config.watchPatterns!.some(pattern => {
      // Simple pattern matching
      const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
      return regex.test(path.relative(this.config.featuresDirectory!, filePath));
    });
  }

  /**
   * Hot reload a feature
   */
  async hotReloadFeature(featureName: string): Promise<FeatureLoadResult> {
    try {
      // Unload existing feature
      await this.unloadFeature(featureName);
      
      // Rediscover the feature
      const feature = this.discoveredFeatures.get(featureName);
      if (feature) {
        // Update last modified time
        const stats = await fs.stat(feature.podFile);
        feature.lastModified = stats.mtime.getTime();
        feature.status = 'discovered';
      }

      // Reload the feature
      const result = await this.loadFeature(featureName);
      
      if (result.success) {
        this.metrics.hotReloads++;
        
        // Emit hot reload event
        this.eventBus.emitSync('discovery.feature.hot-reloaded', {
          featureName,
          timestamp: Date.now()
        }, 'feature-discovery');
      }

      return result;

    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Unload a feature
   */
  async unloadFeature(featureName: string): Promise<void> {
    const feature = this.discoveredFeatures.get(featureName);
    if (!feature || feature.status !== 'loaded') {
      return;
    }

    try {
      // Shutdown the pod instance
      if (feature.instance) {
        await feature.instance.shutdown();
        feature.instance = undefined;
      }

      feature.status = 'unloaded';
      this.metrics.loadedFeatures--;

      console.log(`✅ Feature '${featureName}' unloaded successfully`);

      // Emit unload event
      this.eventBus.emitSync('discovery.feature.unloaded', {
        featureName,
        timestamp: Date.now()
      }, 'feature-discovery');

    } catch (error) {
      console.error(`❌ Error unloading feature '${featureName}':`, error);
      feature.status = 'error';
      feature.error = (error as Error).message;
    }
  }

  // === PUBLIC API ===

  /**
   * Get discovery metrics
   */
  getMetrics(): DiscoveryMetrics {
    return { ...this.metrics };
  }

  /**
   * Get all discovered features
   */
  getDiscoveredFeatures(): DiscoveredFeature[] {
    return Array.from(this.discoveredFeatures.values());
  }

  /**
   * Get features by status
   */
  getFeaturesByStatus(status: DiscoveredFeature['status']): DiscoveredFeature[] {
    return Array.from(this.discoveredFeatures.values()).filter(f => f.status === status);
  }

  /**
   * Manual feature scan
   */
  async scanNow(): Promise<DiscoveredFeature[]> {
    return await this.discoverFeatures();
  }

  /**
   * Load all discovered features
   */
  async loadAllFeatures(): Promise<FeatureLoadResult[]> {
    const features = this.getFeaturesByStatus('discovered');
    const results: FeatureLoadResult[] = [];

    for (const feature of features) {
      const result = await this.loadFeature(feature.name);
      results.push(result);
    }

    return results;
  }

  /**
   * Get feature discovery health status
   */
  getHealthStatus(): { status: string; details: any } {
    const totalFeatures = this.metrics.totalFeatures;
    const loadedFeatures = this.metrics.loadedFeatures;
    const errorFeatures = this.metrics.errorFeatures;

    let status = 'healthy';
    if (errorFeatures > 0) {
      status = 'degraded';
    }
    if (loadedFeatures === 0 && totalFeatures > 0) {
      status = 'error';
    }

    return {
      status,
      details: {
        totalFeatures,
        loadedFeatures,
        errorFeatures,
        lastScan: this.metrics.lastScan,
        hotReloads: this.metrics.hotReloads,
        isScanning: this.isScanning
      }
    };
  }

  /**
   * Shutdown discovery system
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Feature Discovery System');

    // Stop auto discovery
    await this.stopAutoDiscovery();

    // Unload all features
    const loadedFeatures = this.getFeaturesByStatus('loaded');
    for (const feature of loadedFeatures) {
      await this.unloadFeature(feature.name);
    }

    this.discoveredFeatures.clear();

    console.log('✅ Feature Discovery System shutdown complete');
  }
}

// Global discovery instance
export const globalFeatureDiscovery = new FeatureDiscovery();

// Export for CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FeatureDiscovery, globalFeatureDiscovery };
}