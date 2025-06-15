// API Registry System - Contract-first feature management
// Enables safe feature registration and discovery with version control

export interface APIContract {
  name: string;
  version: string;
  description: string;
  methods: Record<string, MethodContract>;
  events: {
    emits: string[];
    listensTo: string[];
  };
  dependencies: string[];
  compatibility: string[];
  metadata?: Record<string, any>;
}

export interface MethodContract {
  description: string;
  parameters: ParameterContract[];
  returnType: string;
  throws?: string[];
  deprecated?: boolean;
  since?: string;
}

export interface ParameterContract {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default?: any;
}

export interface FeatureAPI {
  [methodName: string]: (...args: any[]) => any;
}

export interface RegisteredFeature {
  name: string;
  api: FeatureAPI;
  contract: APIContract;
  registeredAt: number;
  lastAccessed: number;
  accessCount: number;
  status: 'active' | 'inactive' | 'deprecated' | 'error';
  version: string;
  healthCheck?: () => Promise<{ status: string; details?: any }>;
}

export interface RegistryConfig {
  enableVersioning?: boolean;
  enableAccessTracking?: boolean;
  enableHealthChecks?: boolean;
  enableContractValidation?: boolean;
  enableDeprecationWarnings?: boolean;
  contractValidationLevel?: 'strict' | 'moderate' | 'lenient';
}

export interface RegistryMetrics {
  totalFeatures: number;
  activeFeatures: number;
  deprecatedFeatures: number;
  totalMethodCalls: number;
  averageResponseTime: number;
  popularFeatures: Array<{ name: string; accessCount: number }>;
  healthStatus: Map<string, string>;
}

export class APIRegistry {
  private features: Map<string, RegisteredFeature> = new Map();
  private contracts: Map<string, APIContract> = new Map();
  private versionMap: Map<string, Map<string, RegisteredFeature>> = new Map();
  private methodCallMetrics: Map<string, { count: number; totalTime: number }> = new Map();
  private config: RegistryConfig;
  private metrics: RegistryMetrics;

  constructor(config: RegistryConfig = {}) {
    this.config = {
      enableVersioning: config.enableVersioning ?? true,
      enableAccessTracking: config.enableAccessTracking ?? true,
      enableHealthChecks: config.enableHealthChecks ?? true,
      enableContractValidation: config.enableContractValidation ?? true,
      enableDeprecationWarnings: config.enableDeprecationWarnings ?? true,
      contractValidationLevel: config.contractValidationLevel || 'moderate',
      ...config
    };

    this.metrics = this.initializeMetrics();
    
    // Start health check monitoring
    if (this.config.enableHealthChecks) {
      this.startHealthCheckMonitoring();
    }

    console.log('🏗️ API Registry initialized - Ready for conflict-free feature registration');
  }

  private initializeMetrics(): RegistryMetrics {
    return {
      totalFeatures: 0,
      activeFeatures: 0,
      deprecatedFeatures: 0,
      totalMethodCalls: 0,
      averageResponseTime: 0,
      popularFeatures: [],
      healthStatus: new Map()
    };
  }

  // === FEATURE REGISTRATION ===

  /**
   * Register a feature pod with the registry
   */
  async registerFeature(name: string, api: FeatureAPI, contract: APIContract): Promise<void> {
    try {
      // Validate contract if enabled
      if (this.config.enableContractValidation) {
        await this.validateContract(contract);
        await this.validateAPI(api, contract);
      }

      // Check for version conflicts
      if (this.config.enableVersioning) {
        this.validateVersionCompatibility(name, contract.version);
      }

      // Create registered feature
      const registeredFeature: RegisteredFeature = {
        name,
        api: this.wrapAPIWithMetrics(api, name),
        contract,
        registeredAt: Date.now(),
        lastAccessed: Date.now(),
        accessCount: 0,
        status: 'active',
        version: contract.version,
        healthCheck: api.healthCheck
      };

      // Register feature
      this.features.set(name, registeredFeature);
      this.contracts.set(name, contract);

      // Handle versioning
      if (this.config.enableVersioning) {
        this.registerVersion(name, contract.version, registeredFeature);
      }

      // Update metrics
      this.updateRegistrationMetrics();

      console.log(`✅ Feature '${name}' v${contract.version} registered successfully`);
      
      // Validate dependencies
      if (contract.dependencies.length > 0) {
        await this.validateDependencies(contract.dependencies);
      }

    } catch (error) {
      console.error(`❌ Failed to register feature '${name}':`, error);
      throw error;
    }
  }

  /**
   * Unregister a feature from the registry
   */
  async unregisterFeature(name: string, version?: string): Promise<void> {
    const key = version ? `${name}@${version}` : name;
    const feature = this.features.get(key);

    if (!feature) {
      throw new Error(`Feature '${key}' not found`);
    }

    // Check if other features depend on this one
    const dependentFeatures = this.findDependentFeatures(name);
    if (dependentFeatures.length > 0) {
      throw new Error(`Cannot unregister '${name}' - dependencies: ${dependentFeatures.join(', ')}`);
    }

    // Remove from registry
    this.features.delete(key);
    this.contracts.delete(key);

    // Remove from version map
    if (this.config.enableVersioning && this.versionMap.has(name)) {
      this.versionMap.get(name)!.delete(version || feature.version);
      if (this.versionMap.get(name)!.size === 0) {
        this.versionMap.delete(name);
      }
    }

    // Update metrics
    this.updateRegistrationMetrics();

    console.log(`✅ Feature '${key}' unregistered successfully`);
  }

  // === FEATURE ACCESS ===

  /**
   * Get feature API safely with access tracking
   */
  getFeature(name: string, version?: string): FeatureAPI {
    const key = version ? `${name}@${version}` : name;
    const feature = this.features.get(key);

    if (!feature) {
      throw new Error(`Feature '${key}' not found. Available features: ${Array.from(this.features.keys()).join(', ')}`);
    }

    if (feature.status !== 'active') {
      if (feature.status === 'deprecated' && this.config.enableDeprecationWarnings) {
        console.warn(`⚠️ Feature '${key}' is deprecated. Consider upgrading.`);
      } else if (feature.status === 'error') {
        throw new Error(`Feature '${key}' is in error state`);
      }
    }

    // Update access tracking
    if (this.config.enableAccessTracking) {
      feature.lastAccessed = Date.now();
      feature.accessCount++;
    }

    return feature.api;
  }

  /**
   * Get feature by latest version
   */
  getLatestFeature(name: string): FeatureAPI {
    if (!this.versionMap.has(name)) {
      throw new Error(`Feature '${name}' not found`);
    }

    const versions = this.versionMap.get(name)!;
    const latestVersion = this.getLatestVersion(Array.from(versions.keys()));
    
    return this.getFeature(name, latestVersion);
  }

  /**
   * Check if feature exists
   */
  hasFeature(name: string, version?: string): boolean {
    const key = version ? `${name}@${version}` : name;
    return this.features.has(key);
  }

  /**
   * Get feature contract
   */
  getContract(name: string, version?: string): APIContract {
    const key = version ? `${name}@${version}` : name;
    const contract = this.contracts.get(key);

    if (!contract) {
      throw new Error(`Contract for feature '${key}' not found`);
    }

    return contract;
  }

  // === CONTRACT VALIDATION ===

  private async validateContract(contract: APIContract): Promise<void> {
    const errors: string[] = [];

    // Basic structure validation
    if (!contract.name || typeof contract.name !== 'string') {
      errors.push('Contract name must be a non-empty string');
    }

    if (!contract.version || typeof contract.version !== 'string') {
      errors.push('Contract version must be a non-empty string');
    }

    if (!contract.description || typeof contract.description !== 'string') {
      errors.push('Contract description must be a non-empty string');
    }

    // Validate version format (semver)
    const versionRegex = /^\d+\.\d+\.\d+(?:-[a-zA-Z0-9-]+)?$/;
    if (contract.version && !versionRegex.test(contract.version)) {
      errors.push('Contract version must follow semantic versioning (e.g., 1.0.0)');
    }

    // Validate methods
    if (!contract.methods || typeof contract.methods !== 'object') {
      errors.push('Contract must define methods object');
    } else {
      for (const [methodName, methodContract] of Object.entries(contract.methods)) {
        this.validateMethodContract(methodName, methodContract, errors);
      }
    }

    // Validate events
    if (!contract.events || typeof contract.events !== 'object') {
      errors.push('Contract must define events object');
    } else {
      if (!Array.isArray(contract.events.emits)) {
        errors.push('Contract events.emits must be an array');
      }
      if (!Array.isArray(contract.events.listensTo)) {
        errors.push('Contract events.listensTo must be an array');
      }
    }

    // Validate dependencies
    if (!Array.isArray(contract.dependencies)) {
      errors.push('Contract dependencies must be an array');
    }

    if (errors.length > 0) {
      throw new Error(`Contract validation failed:\n${errors.join('\n')}`);
    }
  }

  private validateMethodContract(methodName: string, methodContract: MethodContract, errors: string[]): void {
    if (!methodContract.description) {
      errors.push(`Method '${methodName}' must have a description`);
    }

    if (!Array.isArray(methodContract.parameters)) {
      errors.push(`Method '${methodName}' parameters must be an array`);
    } else {
      for (const param of methodContract.parameters) {
        if (!param.name || !param.type) {
          errors.push(`Method '${methodName}' parameter must have name and type`);
        }
      }
    }

    if (!methodContract.returnType) {
      errors.push(`Method '${methodName}' must specify return type`);
    }
  }

  private async validateAPI(api: FeatureAPI, contract: APIContract): Promise<void> {
    const errors: string[] = [];

    // Check that all contract methods exist in API
    for (const methodName of Object.keys(contract.methods)) {
      if (typeof api[methodName] !== 'function') {
        errors.push(`API missing method '${methodName}' defined in contract`);
      }
    }

    // Strict mode: Check that API doesn't have extra methods
    if (this.config.contractValidationLevel === 'strict') {
      for (const methodName of Object.keys(api)) {
        if (typeof api[methodName] === 'function' && !contract.methods[methodName]) {
          errors.push(`API has undocumented method '${methodName}'`);
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(`API validation failed:\n${errors.join('\n')}`);
    }
  }

  // === VERSION MANAGEMENT ===

  private validateVersionCompatibility(name: string, version: string): void {
    if (!this.versionMap.has(name)) {
      return; // First version of this feature
    }

    const existingVersions = Array.from(this.versionMap.get(name)!.keys());
    
    // Check for duplicate versions
    if (existingVersions.includes(version)) {
      throw new Error(`Version '${version}' of feature '${name}' already exists`);
    }

    // Check semantic versioning compatibility
    const isBackwardCompatible = this.checkBackwardCompatibility(version, existingVersions);
    if (!isBackwardCompatible) {
      console.warn(`⚠️ Version '${version}' of feature '${name}' may break backward compatibility`);
    }
  }

  private registerVersion(name: string, version: string, feature: RegisteredFeature): void {
    if (!this.versionMap.has(name)) {
      this.versionMap.set(name, new Map());
    }

    this.versionMap.get(name)!.set(version, feature);
  }

  private checkBackwardCompatibility(newVersion: string, existingVersions: string[]): boolean {
    // Simple semantic versioning check
    const [newMajor] = newVersion.split('.').map(Number);
    
    for (const existingVersion of existingVersions) {
      const [existingMajor] = existingVersion.split('.').map(Number);
      
      if (newMajor > existingMajor) {
        return false; // Major version bump indicates breaking changes
      }
    }
    
    return true;
  }

  private getLatestVersion(versions: string[]): string {
    return versions.sort((a, b) => {
      const aParts = a.split('.').map(Number);
      const bParts = b.split('.').map(Number);
      
      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aPart = aParts[i] || 0;
        const bPart = bParts[i] || 0;
        
        if (aPart !== bPart) {
          return bPart - aPart; // Descending order
        }
      }
      
      return 0;
    })[0];
  }

  // === DEPENDENCY MANAGEMENT ===

  private async validateDependencies(dependencies: string[]): Promise<void> {
    const missingDependencies: string[] = [];

    for (const dependency of dependencies) {
      if (!this.hasFeature(dependency)) {
        missingDependencies.push(dependency);
      }
    }

    if (missingDependencies.length > 0) {
      console.warn(`⚠️ Missing dependencies: ${missingDependencies.join(', ')}`);
    }
  }

  private findDependentFeatures(featureName: string): string[] {
    const dependents: string[] = [];

    for (const [name, contract] of this.contracts.entries()) {
      if (contract.dependencies.includes(featureName)) {
        dependents.push(name);
      }
    }

    return dependents;
  }

  // === API WRAPPING FOR METRICS ===

  private wrapAPIWithMetrics(api: FeatureAPI, featureName: string): FeatureAPI {
    if (!this.config.enableAccessTracking) {
      return api;
    }

    const wrappedAPI: FeatureAPI = {};

    for (const [methodName, method] of Object.entries(api)) {
      if (typeof method === 'function') {
        wrappedAPI[methodName] = this.wrapMethod(method, featureName, methodName);
      } else {
        wrappedAPI[methodName] = method;
      }
    }

    return wrappedAPI;
  }

  private wrapMethod(method: Function, featureName: string, methodName: string): Function {
    return async (...args: any[]) => {
      const startTime = Date.now();
      const methodKey = `${featureName}.${methodName}`;

      try {
        const result = await method.apply(this, args);
        
        // Update metrics
        this.updateMethodMetrics(methodKey, Date.now() - startTime);
        
        return result;
      } catch (error) {
        this.updateMethodMetrics(methodKey, Date.now() - startTime, true);
        throw error;
      }
    };
  }

  private updateMethodMetrics(methodKey: string, executionTime: number, isError: boolean = false): void {
    if (!this.methodCallMetrics.has(methodKey)) {
      this.methodCallMetrics.set(methodKey, { count: 0, totalTime: 0 });
    }

    const metrics = this.methodCallMetrics.get(methodKey)!;
    metrics.count++;
    metrics.totalTime += executionTime;

    this.metrics.totalMethodCalls++;
  }

  // === HEALTH CHECKING ===

  private startHealthCheckMonitoring(): void {
    setInterval(async () => {
      await this.performHealthChecks();
    }, 30000); // Check every 30 seconds
  }

  private async performHealthChecks(): Promise<void> {
    for (const [name, feature] of this.features.entries()) {
      if (feature.healthCheck && typeof feature.healthCheck === 'function') {
        try {
          const health = await feature.healthCheck();
          this.metrics.healthStatus.set(name, health.status);
          
          if (health.status !== 'healthy') {
            feature.status = 'error';
            console.warn(`⚠️ Feature '${name}' health check failed:`, health);
          } else if (feature.status === 'error') {
            feature.status = 'active';
            console.log(`✅ Feature '${name}' recovered`);
          }
        } catch (error) {
          this.metrics.healthStatus.set(name, 'error');
          feature.status = 'error';
          console.error(`❌ Health check failed for feature '${name}':`, error);
        }
      }
    }
  }

  // === METRICS & MONITORING ===

  private updateRegistrationMetrics(): void {
    this.metrics.totalFeatures = this.features.size;
    this.metrics.activeFeatures = Array.from(this.features.values())
      .filter(f => f.status === 'active').length;
    this.metrics.deprecatedFeatures = Array.from(this.features.values())
      .filter(f => f.status === 'deprecated').length;

    // Calculate popular features
    const sortedFeatures = Array.from(this.features.entries())
      .sort((a, b) => b[1].accessCount - a[1].accessCount)
      .slice(0, 10)
      .map(([name, feature]) => ({ name, accessCount: feature.accessCount }));
    
    this.metrics.popularFeatures = sortedFeatures;

    // Calculate average response time
    const allTimes = Array.from(this.methodCallMetrics.values());
    if (allTimes.length > 0) {
      const totalTime = allTimes.reduce((sum, metric) => sum + metric.totalTime, 0);
      const totalCalls = allTimes.reduce((sum, metric) => sum + metric.count, 0);
      this.metrics.averageResponseTime = totalCalls > 0 ? totalTime / totalCalls : 0;
    }
  }

  // === PUBLIC API ===

  /**
   * Get registry metrics
   */
  getMetrics(): RegistryMetrics {
    this.updateRegistrationMetrics();
    return { ...this.metrics };
  }

  /**
   * Get all registered features
   */
  getAllFeatures(): string[] {
    return Array.from(this.features.keys());
  }

  /**
   * Get features by status
   */
  getFeaturesByStatus(status: 'active' | 'inactive' | 'deprecated' | 'error'): string[] {
    return Array.from(this.features.entries())
      .filter(([_, feature]) => feature.status === status)
      .map(([name]) => name);
  }

  /**
   * Get feature information
   */
  getFeatureInfo(name: string, version?: string): RegisteredFeature | undefined {
    const key = version ? `${name}@${version}` : name;
    return this.features.get(key);
  }

  /**
   * Get registry health status
   */
  getHealthStatus(): { status: string; totalFeatures: number; healthyFeatures: number } {
    const healthyCount = Array.from(this.metrics.healthStatus.values())
      .filter(status => status === 'healthy').length;
    
    return {
      status: healthyCount === this.features.size ? 'healthy' : 'degraded',
      totalFeatures: this.features.size,
      healthyFeatures: healthyCount
    };
  }

  /**
   * Clear registry (for testing)
   */
  clear(): void {
    this.features.clear();
    this.contracts.clear();
    this.versionMap.clear();
    this.methodCallMetrics.clear();
    this.metrics = this.initializeMetrics();
    
    console.log('🧹 API Registry cleared');
  }
}

// Global registry instance
export const globalAPIRegistry = new APIRegistry({
  enableVersioning: true,
  enableAccessTracking: true,
  enableHealthChecks: true,
  enableContractValidation: true,
  contractValidationLevel: 'moderate'
});

// Export for CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { APIRegistry, globalAPIRegistry };
}