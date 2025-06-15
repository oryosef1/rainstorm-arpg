// Feature Generator - Automated feature pod creation tool
// Generates complete feature pods for conflict-free parallel development

import * as fs from 'fs/promises';
import * as path from 'path';

export interface FeatureGeneratorConfig {
  templatesDirectory?: string;
  featuresDirectory?: string;
  defaultVersion?: string;
  defaultAuthor?: string;
  enableGitInit?: boolean;
  enableNpmInit?: boolean;
  includeExamples?: boolean;
}

export interface FeatureSpec {
  name: string;
  version?: string;
  description: string;
  author?: string;
  category?: 'ui' | 'backend' | 'game' | 'utility' | 'integration';
  dependencies?: string[];
  apis?: MethodSpec[];
  events?: EventSpec[];
  includeTests?: boolean;
  includeConfig?: boolean;
  includeReadme?: boolean;
}

export interface MethodSpec {
  name: string;
  description: string;
  parameters: ParameterSpec[];
  returnType: string;
  async?: boolean;
}

export interface ParameterSpec {
  name: string;
  type: string;
  required: boolean;
  description: string;
  defaultValue?: any;
}

export interface EventSpec {
  name: string;
  description: string;
  data?: Record<string, string>;
  listen?: boolean; // true for listening, false for emitting
}

export interface GenerationResult {
  success: boolean;
  featurePath?: string;
  filesCreated?: string[];
  error?: string;
  warnings?: string[];
}

export class FeatureGenerator {
  private config: FeatureGeneratorConfig;

  constructor(config: FeatureGeneratorConfig = {}) {
    this.config = {
      templatesDirectory: config.templatesDirectory || './templates',
      featuresDirectory: config.featuresDirectory || './features',
      defaultVersion: config.defaultVersion || '1.0.0',
      defaultAuthor: config.defaultAuthor || 'AI Agent',
      enableGitInit: config.enableGitInit ?? false,
      enableNpmInit: config.enableNpmInit ?? true,
      includeExamples: config.includeExamples ?? true,
      ...config
    };

    console.log('🏗️ Feature Generator initialized');
  }

  // === FEATURE GENERATION ===

  /**
   * Generate a complete feature pod
   */
  async generateFeature(spec: FeatureSpec): Promise<GenerationResult> {
    try {
      console.log(`🚀 Generating feature: ${spec.name}`);

      // Validate spec
      this.validateFeatureSpec(spec);

      // Create feature directory
      const featurePath = await this.createFeatureDirectory(spec.name);

      // Generate files
      const filesCreated: string[] = [];
      const warnings: string[] = [];

      // 1. Generate pod file
      const podFile = await this.generatePodFile(featurePath, spec);
      filesCreated.push(podFile);

      // 2. Generate API file
      const apiFile = await this.generateAPIFile(featurePath, spec);
      filesCreated.push(apiFile);

      // 3. Generate events file
      const eventsFile = await this.generateEventsFile(featurePath, spec);
      filesCreated.push(eventsFile);

      // 4. Generate types file
      const typesFile = await this.generateTypesFile(featurePath, spec);
      filesCreated.push(typesFile);

      // 5. Generate test file (if requested)
      if (spec.includeTests !== false) {
        const testFile = await this.generateTestFile(featurePath, spec);
        filesCreated.push(testFile);
      }

      // 6. Generate config file (if requested)
      if (spec.includeConfig !== false) {
        const configFile = await this.generateConfigFile(featurePath, spec);
        filesCreated.push(configFile);
      }

      // 7. Generate README (if requested)
      if (spec.includeReadme !== false) {
        const readmeFile = await this.generateReadmeFile(featurePath, spec);
        filesCreated.push(readmeFile);
      }

      // 8. Generate package.json (if npm enabled)
      if (this.config.enableNpmInit) {
        const packageFile = await this.generatePackageJson(featurePath, spec);
        filesCreated.push(packageFile);
      }

      // 9. Initialize git (if enabled)
      if (this.config.enableGitInit) {
        try {
          await this.initializeGit(featurePath);
          warnings.push('Git repository initialized');
        } catch (error) {
          warnings.push(`Git initialization failed: ${(error as Error).message}`);
        }
      }

      console.log(`✅ Feature '${spec.name}' generated successfully at: ${featurePath}`);

      return {
        success: true,
        featurePath,
        filesCreated,
        warnings
      };

    } catch (error) {
      console.error(`❌ Failed to generate feature '${spec.name}':`, error);
      
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  private validateFeatureSpec(spec: FeatureSpec): void {
    if (!spec.name || typeof spec.name !== 'string') {
      throw new Error('Feature name is required and must be a string');
    }

    if (!spec.description || typeof spec.description !== 'string') {
      throw new Error('Feature description is required and must be a string');
    }

    // Validate name format (kebab-case)
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(spec.name)) {
      throw new Error('Feature name must be in kebab-case format (e.g., my-feature)');
    }

    // Validate APIs
    if (spec.apis) {
      for (const api of spec.apis) {
        this.validateMethodSpec(api);
      }
    }

    // Validate events
    if (spec.events) {
      for (const event of spec.events) {
        this.validateEventSpec(event);
      }
    }
  }

  private validateMethodSpec(method: MethodSpec): void {
    if (!method.name || !method.description || !method.returnType) {
      throw new Error(`Invalid method spec: ${JSON.stringify(method)}`);
    }

    for (const param of method.parameters) {
      if (!param.name || !param.type || !param.description) {
        throw new Error(`Invalid parameter spec: ${JSON.stringify(param)}`);
      }
    }
  }

  private validateEventSpec(event: EventSpec): void {
    if (!event.name || !event.description) {
      throw new Error(`Invalid event spec: ${JSON.stringify(event)}`);
    }
  }

  // === FILE GENERATION ===

  private async createFeatureDirectory(featureName: string): Promise<string> {
    const featurePath = path.join(this.config.featuresDirectory!, featureName);
    
    // Check if directory already exists
    try {
      await fs.access(featurePath);
      throw new Error(`Feature directory already exists: ${featurePath}`);
    } catch (error) {
      if ((error as any).code !== 'ENOENT') {
        throw error;
      }
    }

    // Create directory
    await fs.mkdir(featurePath, { recursive: true });
    
    return featurePath;
  }

  private async generatePodFile(featurePath: string, spec: FeatureSpec): Promise<string> {
    const className = this.toPascalCase(spec.name) + 'Pod';
    const fileName = `${spec.name}.pod.ts`;
    const filePath = path.join(featurePath, fileName);

    const content = `// ${spec.description}
// Auto-generated feature pod for conflict-free parallel development

import { FeaturePod } from '../../templates/feature-pod-template';
import { FeatureAPI, APIContract } from '../../core/api-registry';
import { EventData } from '../../core/event-bus';
import { ${className}API } from './${spec.name}.api';
import { ${className}Events } from './${spec.name}.events';
import { ${className}Config } from './${spec.name}.config';

export class ${className} extends FeaturePod {
  private api: ${className}API;
  private events: ${className}Events;
  private featureConfig: ${className}Config;

  constructor(config: any = {}) {
    super({
      name: '${spec.name}',
      version: '${spec.version || this.config.defaultVersion}',
      description: '${spec.description}',
      dependencies: ${JSON.stringify(spec.dependencies || [])},
      ...config
    });

    this.api = new ${className}API(this);
    this.events = new ${className}Events(this);
    this.featureConfig = new ${className}Config(config);
  }

  // === FEATURE POD IMPLEMENTATION ===

  protected initializeAPI(): FeatureAPI {
    return {${spec.apis ? spec.apis.map(api => `
      ${api.name}: this.api.${api.name}.bind(this.api)`).join(',') : ''}${spec.includeTests !== false ? ',\n      healthCheck: this.healthCheck.bind(this)' : ''}
    };
  }

  protected getAPIContract(): APIContract {
    return {
      name: '${spec.name}',
      version: '${spec.version || this.config.defaultVersion}',
      description: '${spec.description}',
      methods: {${spec.apis ? spec.apis.map(api => `
        ${api.name}: {
          description: '${api.description}',
          parameters: ${JSON.stringify(api.parameters.map(p => ({
            name: p.name,
            type: p.type,
            required: p.required,
            description: p.description,
            default: p.defaultValue
          })))},
          returnType: '${api.returnType}'
        }`).join(',') : ''}
      },
      events: {
        emits: [${spec.events ? spec.events.filter(e => !e.listen).map(e => `'${e.name}'`).join(', ') : ''}],
        listensTo: [${spec.events ? spec.events.filter(e => e.listen).map(e => `'${e.name}'`).join(', ') : ''}]
      },
      dependencies: ${JSON.stringify(spec.dependencies || [])},
      compatibility: ['1.x']
    };
  }

  protected setupEventHandlers(): void {
    this.events.setupHandlers();
  }

  // === CUSTOM IMPLEMENTATION ===

  protected async customHealthCheck(): Promise<any> {
    return {
      status: 'healthy',
      message: 'Feature is operational'
    };
  }

  protected async onShutdown(): Promise<void> {
    console.log('🛑 Shutting down ${spec.name} feature');
    await this.events.cleanup();
  }

  // === PUBLIC METHODS ===

  getAPI(): ${className}API {
    return this.api;
  }

  getEvents(): ${className}Events {
    return this.events;
  }

  getFeatureConfig(): ${className}Config {
    return this.featureConfig;
  }
}

// Export the pod class
export default ${className};

// Export for CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ${className} };
}`;

    await fs.writeFile(filePath, content, 'utf-8');
    console.log(`📄 Generated pod file: ${fileName}`);
    
    return filePath;
  }

  private async generateAPIFile(featurePath: string, spec: FeatureSpec): Promise<string> {
    const className = this.toPascalCase(spec.name) + 'API';
    const fileName = `${spec.name}.api.ts`;
    const filePath = path.join(featurePath, fileName);

    const content = `// ${spec.description} - API Implementation
// Auto-generated API class for conflict-free parallel development

import { FeaturePod } from '../../templates/feature-pod-template';
import { ${this.toPascalCase(spec.name)}Types } from './${spec.name}.types';

export class ${className} {
  private pod: FeaturePod;

  constructor(pod: FeaturePod) {
    this.pod = pod;
  }

  // === PUBLIC API METHODS ===
  ${spec.apis ? spec.apis.map(api => {
    const params = api.parameters.map(p => `${p.name}${p.required ? '' : '?'}: ${p.type}`).join(', ');
    const logParams = api.parameters.map(p => p.name).join(', ');
    const logStatement = api.parameters.length > 0 
      ? `console.log('${api.name} called with:', { ${logParams} });`
      : `console.log('${api.name} called');`;
    
    return `
  /**
   * ${api.description}
   */
  ${api.async ? 'async ' : ''}${api.name}(${params}): ${api.returnType} {
    try {
      // TODO: Implement ${api.name} logic
      ${logStatement}
      
      // Placeholder implementation
      ${api.returnType.includes('Promise') ? 'return Promise.resolve(' : 'return '}${this.getDefaultReturn(api.returnType)}${api.returnType.includes('Promise') ? ')' : ''};
    } catch (error) {
      console.error('❌ Error in ${api.name}:', error);
      throw error;
    }
  }`;
  }).join('') : ''}

  // === HELPER METHODS ===

  private validateInput(input: any, name: string): void {
    if (input === undefined || input === null) {
      throw new Error(`Invalid input: ${name} is required`);
    }
  }

  private async executeWithRetry<T>(operation: () => Promise<T>, retries: number = 3): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    throw new Error('Operation failed after retries');
  }
}

// Export for CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ${className} };
}`;

    await fs.writeFile(filePath, content, 'utf-8');
    console.log(`📄 Generated API file: ${fileName}`);
    
    return filePath;
  }

  private async generateEventsFile(featurePath: string, spec: FeatureSpec): Promise<string> {
    const className = this.toPascalCase(spec.name) + 'Events';
    const fileName = `${spec.name}.events.ts`;
    const filePath = path.join(featurePath, fileName);

    const content = `// ${spec.description} - Event Handling
// Auto-generated event handlers for conflict-free parallel development

import { FeaturePod } from '../../templates/feature-pod-template';
import { EventData } from '../../core/event-bus';
import { ${this.toPascalCase(spec.name)}Types } from './${spec.name}.types';

export class ${className} {
  private pod: FeaturePod;
  private listeners: Map<string, string> = new Map();

  constructor(pod: FeaturePod) {
    this.pod = pod;
  }

  // === EVENT SETUP ===

  setupHandlers(): void {
    ${spec.events ? spec.events.filter(e => e.listen).map(event => `
    // Listen to ${event.name}
    this.pod['listenToEvent']('${event.name}', this.handle${this.toPascalCase(event.name.replace(/\./g, '_'))}.bind(this));`).join('') : '// No event listeners configured'}
  }

  async cleanup(): Promise<void> {
    // Clean up event listeners
    for (const [eventName] of this.listeners) {
      this.pod['stopListening'](eventName);
    }
    this.listeners.clear();
  }

  // === EVENT EMITTERS ===${spec.events ? spec.events.filter(e => !e.listen).map(event => `

  /**
   * Emit ${event.description}
   */
  emit${this.toPascalCase(event.name.replace(/\./g, '_'))}(data: any): void {
    this.pod['emitEvent']('${event.name}', {
      ...data,
      timestamp: Date.now(),
      source: '${spec.name}'
    });
  }`).join('') : ''}

  // === EVENT HANDLERS ===${spec.events ? spec.events.filter(e => e.listen).map(event => `

  /**
   * Handle ${event.description}
   */
  private async handle${this.toPascalCase(event.name.replace(/\./g, '_'))}(event: EventData): Promise<void> {
    try {
      console.log('📡 ${spec.name} received event ${event.name}:', event.data);
      
      // TODO: Implement ${event.name} handler logic
      
    } catch (error) {
      console.error('❌ Error handling ${event.name}:', error);
      throw error;
    }
  }`).join('') : ''}

  // === HELPER METHODS ===

  private validateEventData(data: any, eventName: string): void {
    if (!data) {
      throw new Error(`Invalid event data for ${eventName}`);
    }
  }

  private createEventMetadata(additionalData: any = {}): any {
    return {
      feature: '${spec.name}',
      timestamp: Date.now(),
      ...additionalData
    };
  }
}

// Export for CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ${className} };
}`;

    await fs.writeFile(filePath, content, 'utf-8');
    console.log(`📄 Generated events file: ${fileName}`);
    
    return filePath;
  }

  private async generateTypesFile(featurePath: string, spec: FeatureSpec): Promise<string> {
    const className = this.toPascalCase(spec.name) + 'Types';
    const fileName = `${spec.name}.types.ts`;
    const filePath = path.join(featurePath, fileName);

    // Extract unique types from API parameters and return types
    const customTypes = new Set<string>();
    if (spec.apis) {
      for (const api of spec.apis) {
        // Add return type if custom
        if (api.returnType && !this.isBuiltInType(api.returnType)) {
          customTypes.add(api.returnType.replace(/Promise<|>/g, ''));
        }
        
        // Add parameter types if custom
        for (const param of api.parameters) {
          if (!this.isBuiltInType(param.type)) {
            customTypes.add(param.type);
          }
        }
      }
    }

    const content = `// ${spec.description} - Type Definitions
// Auto-generated TypeScript types for conflict-free parallel development

// === CORE INTERFACES ===

export interface ${className}Config {
  enabled?: boolean;
  maxRetries?: number;
  timeout?: number;
  debug?: boolean;
  [key: string]: any;
}

export interface ${className}State {
  isInitialized: boolean;
  lastUpdated: number;
  errorCount: number;
  isHealthy: boolean;
}

export interface ${className}Metrics {
  operationsCount: number;
  successCount: number;
  errorCount: number;
  averageResponseTime: number;
  lastOperationTime: number;
}

// === EVENT DATA TYPES ===${spec.events ? spec.events.map(event => `

export interface ${this.toPascalCase(event.name.replace(/\./g, '_'))}Data {
  timestamp: number;
  source: string;
  // TODO: Define specific data structure for ${event.name}
  [key: string]: any;
}`).join('') : ''}

// === API TYPES ===${spec.apis ? spec.apis.map(api => `

export interface ${this.toPascalCase(api.name)}Request {
  ${api.parameters.map(p => `${p.name}${p.required ? '' : '?'}: ${p.type};`).join('\n  ')}
}

export interface ${this.toPascalCase(api.name)}Response {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: number;
}`).join('') : ''}

// === CUSTOM TYPES ===
${Array.from(customTypes).map(type => `
export interface ${type} {
  // TODO: Define ${type} structure
  [key: string]: any;
}`).join('')}

// === UTILITY TYPES ===

export type ${className}Status = 'initializing' | 'ready' | 'busy' | 'error' | 'shutting-down';

export type ${className}LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type ${className}Operation = ${spec.apis ? spec.apis.map(api => `'${api.name}'`).join(' | ') : 'string'};

// === ERROR TYPES ===

export class ${className}Error extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly code: string = 'UNKNOWN_ERROR'
  ) {
    super(message);
    this.name = '${className}Error';
  }
}

// === HELPER FUNCTIONS ===

export function is${className}Error(error: any): error is ${className}Error {
  return error instanceof ${className}Error;
}

export function create${className}Config(overrides: Partial<${className}Config> = {}): ${className}Config {
  return {
    enabled: true,
    maxRetries: 3,
    timeout: 30000,
    debug: false,
    ...overrides
  };
}

// Export for CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ${className}Error,
    is${className}Error,
    create${className}Config
  };
}`;

    await fs.writeFile(filePath, content, 'utf-8');
    console.log(`📄 Generated types file: ${fileName}`);
    
    return filePath;
  }

  private async generateTestFile(featurePath: string, spec: FeatureSpec): Promise<string> {
    const className = this.toPascalCase(spec.name) + 'Pod';
    const fileName = `${spec.name}.test.ts`;
    const filePath = path.join(featurePath, fileName);

    const content = `// ${spec.description} - Test Suite
// Auto-generated tests for conflict-free parallel development

import { ${className} } from './${spec.name}.pod';
import { globalEventBus } from '../../core/event-bus';
import { globalAPIRegistry } from '../../core/api-registry';

describe('${className}', () => {
  let pod: ${className};
  
  beforeEach(() => {
    // Clean up registries
    globalAPIRegistry.clear();
    
    // Create fresh pod instance
    pod = new ${className}({
      eventBus: globalEventBus,
      apiRegistry: globalAPIRegistry
    });
  });
  
  afterEach(async () => {
    if (pod && pod.isReady()) {
      await pod.shutdown();
    }
  });

  describe('Initialization', () => {
    test('should initialize successfully', async () => {
      await pod.initialize();
      expect(pod.isReady()).toBe(true);
    });

    test('should register with API registry', async () => {
      await pod.initialize();
      expect(globalAPIRegistry.hasFeature('${spec.name}')).toBe(true);
    });

    test('should have correct feature info', () => {
      const info = pod.getFeatureInfo();
      expect(info.name).toBe('${spec.name}');
      expect(info.version).toBe('${spec.version || this.config.defaultVersion}');
    });
  });

  describe('Health Checks', () => {
    test('should pass health check when ready', async () => {
      await pod.initialize();
      const health = await pod.healthCheck();
      expect(health.status).toBe('healthy');
    });

    test('should provide health status before initialization', async () => {
      const health = await pod.healthCheck();
      expect(health.status).toBe('initializing');
    });
  });

  describe('API Methods', () => {${spec.apis ? spec.apis.map(api => `
    test('should have ${api.name} method', async () => {
      await pod.initialize();
      const api = globalAPIRegistry.getFeature('${spec.name}');
      expect(typeof api.${api.name}).toBe('function');
    });

    test('${api.name} should handle basic execution', async () => {
      await pod.initialize();
      const api = globalAPIRegistry.getFeature('${spec.name}');
      
      // TODO: Add meaningful test for ${api.name}
      ${api.parameters.length > 0 ? `const result = await api.${api.name}(${api.parameters.map(p => this.getTestValue(p.type)).join(', ')});` : `const result = await api.${api.name}();`}
      expect(result).toBeDefined();
    });`).join('') : ''}
  });

  describe('Event Handling', () => {${spec.events ? spec.events.filter(e => e.listen).map(event => `
    test('should listen to ${event.name} events', async () => {
      await pod.initialize();
      
      // TODO: Test event handling for ${event.name}
      const mockEventData = {
        timestamp: Date.now(),
        source: 'test',
        data: {}
      };
      
      // Emit test event
      globalEventBus.emitSync('${event.name}', mockEventData, 'test');
      
      // Add assertions based on expected behavior
      expect(true).toBe(true); // Placeholder
    });`).join('') : ''}
  });

  describe('Metrics', () => {
    test('should track metrics correctly', async () => {
      await pod.initialize();
      const metrics = pod.getMetrics();
      
      expect(metrics).toHaveProperty('uptime');
      expect(metrics).toHaveProperty('eventsEmitted');
      expect(metrics).toHaveProperty('eventsReceived');
      expect(metrics).toHaveProperty('apiCalls');
      expect(metrics).toHaveProperty('errors');
    });
  });

  describe('Shutdown', () => {
    test('should shutdown gracefully', async () => {
      await pod.initialize();
      expect(pod.isReady()).toBe(true);
      
      await pod.shutdown();
      expect(pod.isReady()).toBe(false);
    });

    test('should unregister from API registry on shutdown', async () => {
      await pod.initialize();
      expect(globalAPIRegistry.hasFeature('${spec.name}')).toBe(true);
      
      await pod.shutdown();
      expect(globalAPIRegistry.hasFeature('${spec.name}')).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle initialization errors gracefully', async () => {
      // Create pod with invalid config to trigger error
      const invalidPod = new ${className}({ invalidConfig: true });
      
      // TODO: Add specific error scenarios for your feature
      expect(true).toBe(true); // Placeholder
    });
  });
});

// === INTEGRATION TESTS ===

describe('${className} Integration', () => {
  test('should work with multiple instances', async () => {
    const pod1 = new ${className}({ name: '${spec.name}-1' });
    const pod2 = new ${className}({ name: '${spec.name}-2' });
    
    await pod1.initialize();
    await pod2.initialize();
    
    expect(pod1.isReady()).toBe(true);
    expect(pod2.isReady()).toBe(true);
    
    await pod1.shutdown();
    await pod2.shutdown();
  });

  test('should handle concurrent operations', async () => {
    await pod.initialize();
    
    // TODO: Add concurrent operation tests
    expect(true).toBe(true); // Placeholder
  });
});
`;

    await fs.writeFile(filePath, content, 'utf-8');
    console.log(`📄 Generated test file: ${fileName}`);
    
    return filePath;
  }

  private async generateConfigFile(featurePath: string, spec: FeatureSpec): Promise<string> {
    const className = this.toPascalCase(spec.name) + 'Config';
    const fileName = `${spec.name}.config.ts`;
    const filePath = path.join(featurePath, fileName);

    const content = `// ${spec.description} - Configuration
// Auto-generated configuration class for conflict-free parallel development

import { ${this.toPascalCase(spec.name)}Types } from './${spec.name}.types';

export class ${className} {
  private config: ${this.toPascalCase(spec.name)}Types.${className};
  
  constructor(userConfig: Partial<${this.toPascalCase(spec.name)}Types.${className}> = {}) {
    this.config = this.mergeWithDefaults(userConfig);
    this.validateConfig();
  }

  // === CONFIGURATION METHODS ===

  get<K extends keyof ${this.toPascalCase(spec.name)}Types.${className}>(key: K): ${this.toPascalCase(spec.name)}Types.${className}[K] {
    return this.config[key];
  }

  set<K extends keyof ${this.toPascalCase(spec.name)}Types.${className}>(key: K, value: ${this.toPascalCase(spec.name)}Types.${className}[K]): void {
    this.config[key] = value;
    this.validateConfig();
  }

  update(updates: Partial<${this.toPascalCase(spec.name)}Types.${className}>): void {
    this.config = { ...this.config, ...updates };
    this.validateConfig();
  }

  getAll(): ${this.toPascalCase(spec.name)}Types.${className} {
    return { ...this.config };
  }

  reset(): void {
    this.config = this.getDefaultConfig();
  }

  // === PRIVATE METHODS ===

  private mergeWithDefaults(userConfig: Partial<${this.toPascalCase(spec.name)}Types.${className}>): ${this.toPascalCase(spec.name)}Types.${className} {
    return {
      ...this.getDefaultConfig(),
      ...userConfig
    };
  }

  private getDefaultConfig(): ${this.toPascalCase(spec.name)}Types.${className} {
    return {
      enabled: true,
      maxRetries: 3,
      timeout: 30000,
      debug: process.env.NODE_ENV === 'development',
      
      // Feature-specific defaults
      ...this.getFeatureDefaults()
    };
  }

  private getFeatureDefaults(): Partial<${this.toPascalCase(spec.name)}Types.${className}> {
    return {
      // TODO: Add ${spec.name}-specific configuration defaults
    };
  }

  private validateConfig(): void {
    const errors: string[] = [];

    // Basic validation
    if (typeof this.config.enabled !== 'boolean') {
      errors.push('enabled must be a boolean');
    }

    if (typeof this.config.maxRetries !== 'number' || this.config.maxRetries < 0) {
      errors.push('maxRetries must be a non-negative number');
    }

    if (typeof this.config.timeout !== 'number' || this.config.timeout <= 0) {
      errors.push('timeout must be a positive number');
    }

    // Feature-specific validation
    this.validateFeatureConfig(errors);

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
  }

  private validateFeatureConfig(errors: string[]): void {
    // TODO: Add ${spec.name}-specific validation logic
  }

  // === UTILITY METHODS ===

  isEnabled(): boolean {
    return this.config.enabled;
  }

  isDebugMode(): boolean {
    return this.config.debug || false;
  }

  getTimeout(): number {
    return this.config.timeout;
  }

  getMaxRetries(): number {
    return this.config.maxRetries;
  }

  toJSON(): ${this.toPascalCase(spec.name)}Types.${className} {
    return this.getAll();
  }

  toString(): string {
    return JSON.stringify(this.config, null, 2);
  }
}

// Export for CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ${className} };
}`;

    await fs.writeFile(filePath, content, 'utf-8');
    console.log(`📄 Generated config file: ${fileName}`);
    
    return filePath;
  }

  private async generateReadmeFile(featurePath: string, spec: FeatureSpec): Promise<string> {
    const fileName = 'README.md';
    const filePath = path.join(featurePath, fileName);

    const content = `# ${this.toTitleCase(spec.name)}

${spec.description}

## Overview

This feature pod was auto-generated for conflict-free parallel development. It provides a complete, isolated implementation that can be developed and tested independently.

## Features

- ✅ **Conflict-Free Development**: Complete isolation from other features
- ✅ **Event-Driven Communication**: Safe inter-feature communication
- ✅ **Type-Safe APIs**: Full TypeScript support with contracts
- ✅ **Hot Reloading**: Automatic discovery and reloading
- ✅ **Health Monitoring**: Built-in health checks and metrics
- ✅ **Testing Ready**: Comprehensive test suite included

## API Methods
${spec.apis && spec.apis.length > 0 ? spec.apis.map(api => `
### \`${api.name}\`

${api.description}

**Parameters:**
${api.parameters.length > 0 ? api.parameters.map(p => `- \`${p.name}\` (${p.type}${p.required ? ', required' : ', optional'}): ${p.description}`).join('\n') : '- None'}

**Returns:** \`${api.returnType}\`

\`\`\`typescript
const api = globalAPIRegistry.getFeature('${spec.name}');
const result = await api.${api.name}(${api.parameters.map(p => p.name).join(', ')});
\`\`\``).join('\n') : '\nNo public API methods defined.'}

## Events
${spec.events && spec.events.length > 0 ? 
`
### Emitted Events
${spec.events.filter(e => !e.listen).map(e => `
- \`${e.name}\`: ${e.description}`).join('')}

### Listened Events
${spec.events.filter(e => e.listen).map(e => `
- \`${e.name}\`: ${e.description}`).join('')}
` : '\nNo events configured.'}

## Dependencies
${spec.dependencies && spec.dependencies.length > 0 ? 
spec.dependencies.map(dep => `- ${dep}`).join('\n') : 'No dependencies required.'}

## Usage

### Basic Usage

\`\`\`typescript
import { ${this.toPascalCase(spec.name)}Pod } from './${spec.name}.pod';
import { globalEventBus, globalAPIRegistry } from '../../core';

// Create and initialize the feature
const feature = new ${this.toPascalCase(spec.name)}Pod({
  eventBus: globalEventBus,
  apiRegistry: globalAPIRegistry
});

await feature.initialize();

// Use the API
const api = globalAPIRegistry.getFeature('${spec.name}');
// ... use api methods

// Shutdown when done
await feature.shutdown();
\`\`\`

### Configuration

\`\`\`typescript
const feature = new ${this.toPascalCase(spec.name)}Pod({
  // Custom configuration
  enabled: true,
  maxRetries: 5,
  timeout: 60000,
  debug: true
});
\`\`\`

### Event Handling

\`\`\`typescript
// Listen to events from this feature
globalEventBus.on('${spec.name}.event', (event) => {
  console.log('Received event:', event);
});

// Emit events to this feature
globalEventBus.emitSync('external.event', { data: 'example' }, 'external-source');
\`\`\`

## Testing

\`\`\`bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
\`\`\`

## Development

### File Structure

\`\`\`
${spec.name}/
├── ${spec.name}.pod.ts        # Main feature pod class
├── ${spec.name}.api.ts        # API implementation
├── ${spec.name}.events.ts     # Event handlers
├── ${spec.name}.types.ts      # TypeScript definitions
├── ${spec.name}.config.ts     # Configuration management
├── ${spec.name}.test.ts       # Test suite
├── package.json               # Dependencies and scripts
└── README.md                  # This documentation
\`\`\`

### Hot Reloading

This feature supports hot reloading during development. Any changes to the pod files will be automatically detected and the feature will be reloaded.

### Health Monitoring

The feature includes built-in health monitoring:

\`\`\`typescript
const health = await feature.healthCheck();
console.log('Health status:', health.status);
console.log('Metrics:', feature.getMetrics());
\`\`\`

## Version

- **Version:** ${spec.version || this.config.defaultVersion}
- **Author:** ${spec.author || this.config.defaultAuthor}
- **Generated:** ${new Date().toISOString()}

## Contributing

This feature was auto-generated using the Conflict-Free Parallel Development system. To modify:

1. Edit the implementation files directly
2. Add tests for new functionality
3. Update this README if needed
4. The feature will be automatically discovered and reloaded

## License

Generated for the RainStorm ARPG project.
`;

    await fs.writeFile(filePath, content, 'utf-8');
    console.log(`📄 Generated README file: ${fileName}`);
    
    return filePath;
  }

  private async generatePackageJson(featurePath: string, spec: FeatureSpec): Promise<string> {
    const fileName = 'package.json';
    const filePath = path.join(featurePath, fileName);

    const packageJson = {
      name: `@rainstorm/${spec.name}`,
      version: spec.version || this.config.defaultVersion,
      description: spec.description,
      main: `${spec.name}.pod.ts`,
      types: `${spec.name}.types.ts`,
      author: spec.author || this.config.defaultAuthor,
      license: 'MIT',
      keywords: [
        'rainstorm',
        'arpg',
        'feature-pod',
        'conflict-free',
        'parallel-development',
        spec.category || 'utility'
      ],
      scripts: {
        build: 'tsc',
        test: 'jest',
        'test:watch': 'jest --watch',
        'test:coverage': 'jest --coverage',
        lint: 'eslint . --ext .ts',
        'lint:fix': 'eslint . --ext .ts --fix',
        dev: 'ts-node-dev --respawn --transpile-only ' + `${spec.name}.pod.ts`
      },
      dependencies: {
        ...this.getBaseDependencies(),
        ...(spec.dependencies ? spec.dependencies.reduce((acc, dep) => {
          acc[dep] = '*';
          return acc;
        }, {} as Record<string, string>) : {})
      },
      devDependencies: {
        ...this.getDevDependencies()
      },
      jest: {
        preset: 'ts-jest',
        testEnvironment: 'node',
        roots: ['<rootDir>'],
        testMatch: ['**/*.test.ts'],
        collectCoverageFrom: [
          '*.ts',
          '!*.test.ts',
          '!*.types.ts'
        ],
        coverageReporters: ['text', 'lcov', 'html']
      },
      files: [
        `${spec.name}.pod.ts`,
        `${spec.name}.api.ts`,
        `${spec.name}.events.ts`,
        `${spec.name}.types.ts`,
        `${spec.name}.config.ts`,
        'README.md'
      ],
      engines: {
        node: '>=16.0.0'
      }
    };

    await fs.writeFile(filePath, JSON.stringify(packageJson, null, 2), 'utf-8');
    console.log(`📄 Generated package.json: ${fileName}`);
    
    return filePath;
  }

  private async initializeGit(featurePath: string): Promise<void> {
    // Git initialization would go here
    // For now, just create a .gitignore
    const gitignorePath = path.join(featurePath, '.gitignore');
    const gitignoreContent = `# Dependencies
node_modules/

# Build outputs
dist/
build/

# Test coverage
coverage/

# IDE files
.vscode/
.idea/

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local`;
    
    await fs.writeFile(gitignorePath, gitignoreContent, 'utf-8');
  }

  // === TEMPLATE MANAGEMENT ===

  getFeatureTemplate(templateName: string): Partial<FeatureSpec> {
    const templates: Record<string, Partial<FeatureSpec>> = {
      ui: {
        category: 'ui',
        apis: [
          {
            name: 'render',
            description: 'Render the UI component',
            parameters: [
              { name: 'props', type: 'any', required: true, description: 'Component properties' }
            ],
            returnType: 'Promise<HTMLElement>',
            async: true
          },
          {
            name: 'update',
            description: 'Update component state',
            parameters: [
              { name: 'state', type: 'any', required: true, description: 'New state object' }
            ],
            returnType: 'Promise<void>',
            async: true
          }
        ],
        events: [
          { name: 'ui.component.rendered', description: 'Component rendered successfully', listen: false },
          { name: 'ui.component.updated', description: 'Component state updated', listen: false },
          { name: 'ui.state.changed', description: 'Global UI state changed', listen: true }
        ]
      },
      backend: {
        category: 'backend',
        apis: [
          {
            name: 'processRequest',
            description: 'Process incoming request',
            parameters: [
              { name: 'request', type: 'any', required: true, description: 'Request object' }
            ],
            returnType: 'Promise<any>',
            async: true
          },
          {
            name: 'validateData',
            description: 'Validate request data',
            parameters: [
              { name: 'data', type: 'any', required: true, description: 'Data to validate' }
            ],
            returnType: 'Promise<boolean>',
            async: true
          }
        ],
        events: [
          { name: 'backend.request.processed', description: 'Request processed successfully', listen: false },
          { name: 'backend.error.occurred', description: 'Backend error occurred', listen: false },
          { name: 'system.shutdown.requested', description: 'System shutdown requested', listen: true }
        ]
      },
      game: {
        category: 'game',
        apis: [
          {
            name: 'update',
            description: 'Update game logic',
            parameters: [
              { name: 'deltaTime', type: 'number', required: true, description: 'Time since last update' }
            ],
            returnType: 'Promise<void>',
            async: true
          },
          {
            name: 'getState',
            description: 'Get current game state',
            parameters: [],
            returnType: 'any',
            async: false
          }
        ],
        events: [
          { name: 'game.state.updated', description: 'Game state updated', listen: false },
          { name: 'game.player.action', description: 'Player performed action', listen: true },
          { name: 'game.loop.tick', description: 'Game loop tick', listen: true }
        ]
      },
      utility: {
        category: 'utility',
        apis: [
          {
            name: 'execute',
            description: 'Execute utility function',
            parameters: [
              { name: 'input', type: 'any', required: true, description: 'Input data' }
            ],
            returnType: 'Promise<any>',
            async: true
          }
        ],
        events: [
          { name: 'utility.executed', description: 'Utility function executed', listen: false }
        ]
      }
    };

    return templates[templateName] || {};
  }

  async featureExists(featureName: string): Promise<boolean> {
    const featurePath = path.join(this.config.featuresDirectory!, featureName);
    try {
      await fs.access(featurePath);
      return true;
    } catch {
      return false;
    }
  }

  // === UTILITY METHODS ===

  private toPascalCase(str: string): string {
    return str
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  private toTitleCase(str: string): string {
    return str
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private isBuiltInType(type: string): boolean {
    const builtInTypes = [
      'string', 'number', 'boolean', 'any', 'void', 'null', 'undefined',
      'object', 'Array', 'Promise', 'Date', 'RegExp', 'Error'
    ];
    
    const cleanType = type.replace(/Promise<|>|\[\]/g, '');
    return builtInTypes.includes(cleanType);
  }

  private getDefaultReturn(returnType: string): string {
    if (returnType.includes('Promise<void>')) return 'undefined';
    if (returnType.includes('Promise<string>')) return '"result"';
    if (returnType.includes('Promise<number>')) return '42';
    if (returnType.includes('Promise<boolean>')) return 'true';
    if (returnType.includes('Promise<')) return '{}';
    if (returnType.includes('string')) return '"result"';
    if (returnType.includes('number')) return '42';
    if (returnType.includes('boolean')) return 'true';
    if (returnType.includes('void')) return 'undefined';
    return '{}';
  }

  private getTestValue(type: string): string {
    if (type.includes('string')) return '"test"';
    if (type.includes('number')) return '123';
    if (type.includes('boolean')) return 'true';
    return '{}';
  }

  private getBaseDependencies(): Record<string, string> {
    return {
      'typescript': '^5.0.0',
      'ts-node': '^10.9.0'
    };
  }

  private getDevDependencies(): Record<string, string> {
    return {
      '@types/node': '^20.0.0',
      '@types/jest': '^29.0.0',
      'jest': '^29.0.0',
      'ts-jest': '^29.0.0',
      'ts-node-dev': '^2.0.0',
      'eslint': '^8.0.0',
      '@typescript-eslint/eslint-plugin': '^6.0.0',
      '@typescript-eslint/parser': '^6.0.0'
    };
  }
}

// Export for CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FeatureGenerator };
}
      dependencies: ${JSON.stringify(spec.dependencies || [])},
      compatibility: ['1.x'],
      metadata: {
        category: '${spec.category || 'utility'}',
        author: '${spec.author || this.config.defaultAuthor}',
        generated: true,
        generatedAt: '${new Date().toISOString()}'
      }
    };
  }

  protected setupEventHandlers(): void {
    // Setup event listeners${spec.events ? spec.events.filter(e => e.listen).map(event => `
    this.listenToEvent('${event.name}', this.handle${this.toPascalCase(event.name.split('.').pop() || '')}.bind(this));`).join('') : ''}
  }

  // === EVENT HANDLERS ===${spec.events ? spec.events.filter(e => e.listen).map(event => `

  private async handle${this.toPascalCase(event.name.split('.').pop() || '')}(event: EventData): Promise<void> {
    // Handle ${event.description}
    console.log('📥 ${className} received ${event.name}:', event.data);
    
    // TODO: Implement event handling logic
  }`).join('') : ''}

  // === CUSTOM METHODS ===

  /**
   * Get feature configuration
   */
  getFeatureConfig(): ${className}Config {
    return this.featureConfig;
  }

  /**
   * Update feature configuration
   */
  updateConfig(newConfig: Partial<${className}Config>): void {
    this.featureConfig = { ...this.featureConfig, ...newConfig };
  }

  // === HEALTH CHECK ===

  protected async customHealthCheck(): Promise<any> {
    try {
      // Perform feature-specific health checks
      const apiHealthy = this.api.isHealthy();
      const eventsHealthy = this.events.isHealthy();
      
      return {
        status: apiHealthy && eventsHealthy ? 'healthy' : 'degraded',
        details: {
          api: apiHealthy ? 'healthy' : 'error',
          events: eventsHealthy ? 'healthy' : 'error',
          config: this.featureConfig ? 'loaded' : 'missing'
        }
      };
    } catch (error) {
      return {
        status: 'error',
        message: \`Health check failed: \${(error as Error).message}\`
      };
    }
  }
}

// Export for easy importing
export default ${className};

// Auto-instantiate if this is the main module
if (require.main === module) {
  const pod = new ${className}();
  console.log(\`🚀 \${pod.getFeatureInfo().name} pod started\`);
}
`;

    await fs.writeFile(filePath, content, 'utf-8');
    return filePath;
  }

  private async generateAPIFile(featurePath: string, spec: FeatureSpec): Promise<string> {
    const className = this.toPascalCase(spec.name) + 'API';
    const fileName = `${spec.name}.api.ts`;
    const filePath = path.join(featurePath, fileName);

    const content = `// ${spec.name} API - External interface for conflict-free communication
// Auto-generated API implementation

export class ${className} {
  private pod: any;

  constructor(pod: any) {
    this.pod = pod;
  }

  // === PUBLIC API METHODS ===${spec.apis ? spec.apis.map(api => `

  /**
   * ${api.description}
   */
  ${api.async !== false ? 'async ' : ''}${api.name}(${api.parameters.map(p => 
    `${p.name}${p.required ? '' : '?'}: ${p.type}${p.defaultValue !== undefined ? ` = ${JSON.stringify(p.defaultValue)}` : ''}`
  ).join(', ')}): ${api.async !== false ? `Promise<${api.returnType}>` : api.returnType} {
    try {
      // TODO: Implement ${api.name} logic
      console.log('🔧 ${className}.${api.name} called with:', { ${api.parameters.map(p => p.name).join(', ')} });
      
      // Example implementation:
      // const result = await this.processRequest({ ${api.parameters.map(p => p.name).join(', ')} });
      // return result;
      
      throw new Error('Method ${api.name} not implemented yet');
      
    } catch (error) {
      console.error('❌ Error in ${api.name}:', error);
      throw error;
    }
  }`).join('') : ''}

  // === UTILITY METHODS ===

  /**
   * Check if API is healthy
   */
  isHealthy(): boolean {
    try {
      // TODO: Implement health check logic
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get API statistics
   */
  getStats(): any {
    return {
      // TODO: Implement stats collection
      callCount: 0,
      lastCall: null,
      errors: 0
    };
  }
}
`;

    await fs.writeFile(filePath, content, 'utf-8');
    return filePath;
  }

  private async generateEventsFile(featurePath: string, spec: FeatureSpec): Promise<string> {
    const className = this.toPascalCase(spec.name) + 'Events';
    const fileName = `${spec.name}.events.ts`;
    const filePath = path.join(featurePath, fileName);

    const content = `// ${spec.name} Events - Event definitions and handling
// Auto-generated event management

export class ${className} {
  private pod: any;

  constructor(pod: any) {
    this.pod = pod;
  }

  // === EVENT DEFINITIONS ===

  static readonly EVENTS = {${spec.events ? spec.events.map(event => `
    ${event.name.toUpperCase().replace(/\./g, '_')}: '${event.name}'`).join(',') : ''}
  };

  // === EVENT EMITTERS ===${spec.events ? spec.events.filter(e => !e.listen).map(event => `

  /**
   * ${event.description}
   */
  emit${this.toPascalCase(event.name.split('.').pop() || '')}(data: ${event.data ? `{ ${Object.entries(event.data).map(([key, type]) => `${key}: ${type}`).join(', ')} }` : 'any'}): void {
    this.pod.emitEvent('${event.name}', data);
  }`).join('') : ''}

  // === EVENT UTILITIES ===

  /**
   * Check if events system is healthy
   */
  isHealthy(): boolean {
    try {
      // TODO: Implement event health check
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get event statistics
   */
  getEventStats(): any {
    return {
      // TODO: Implement event stats
      emitted: 0,
      received: 0,
      errors: 0
    };
  }
}
`;

    await fs.writeFile(filePath, content, 'utf-8');
    return filePath;
  }

  private async generateTypesFile(featurePath: string, spec: FeatureSpec): Promise<string> {
    const fileName = `${spec.name}.types.ts`;
    const filePath = path.join(featurePath, fileName);

    const content = `// ${spec.name} Types - Type definitions for conflict-free development
// Auto-generated TypeScript type definitions

// === FEATURE CONFIGURATION ===

export interface ${this.toPascalCase(spec.name)}Config {
  // TODO: Define configuration interface
  enabled?: boolean;
  debug?: boolean;
  [key: string]: any;
}

// === API DATA TYPES ===${spec.apis ? spec.apis.map(api => `

// ${api.description}
export interface ${this.toPascalCase(api.name)}Request {
  ${api.parameters.map(p => `${p.name}${p.required ? '' : '?'}: ${p.type};`).join('\n  ')}
}

export interface ${this.toPascalCase(api.name)}Response {
  // TODO: Define response structure
  success: boolean;
  data?: any;
  error?: string;
}`).join('') : ''}

// === EVENT DATA TYPES ===${spec.events ? spec.events.map(event => `

// ${event.description}
export interface ${this.toPascalCase(event.name.split('.').pop() || '')}EventData {
  ${event.data ? Object.entries(event.data).map(([key, type]) => `${key}: ${type};`).join('\n  ') : '// TODO: Define event data structure'}
}`).join('') : ''}

// === COMMON TYPES ===

export interface FeatureMetadata {
  name: string;
  version: string;
  description: string;
  category: string;
  author: string;
  generated: boolean;
  generatedAt: string;
}

export interface FeatureStatus {
  active: boolean;
  healthy: boolean;
  lastCheck: number;
  errors: number;
}

// === ERROR TYPES ===

export class ${this.toPascalCase(spec.name)}Error extends Error {
  constructor(message: string, public code?: string, public details?: any) {
    super(message);
    this.name = '${this.toPascalCase(spec.name)}Error';
  }
}

// === UTILITY TYPES ===

export type ${this.toPascalCase(spec.name)}EventNames = ${spec.events && spec.events.length > 0 ? 
  spec.events.map(e => `'${e.name}'`).join(' | ') : 'string'};

export type ${this.toPascalCase(spec.name)}APIMethod = ${spec.apis && spec.apis.length > 0 ? 
  spec.apis.map(a => `'${a.name}'`).join(' | ') : 'string'};
`;

    await fs.writeFile(filePath, content, 'utf-8');
    return filePath;
  }

  private async generateTestFile(featurePath: string, spec: FeatureSpec): Promise<string> {
    const className = this.toPascalCase(spec.name) + 'Pod';
    const fileName = `${spec.name}.test.ts`;
    const filePath = path.join(featurePath, fileName);

    const content = `// ${spec.name} Tests - Comprehensive test suite
// Auto-generated test implementation

import { ${className} } from './${spec.name}.pod';
import { EventBus } from '../../core/event-bus';
import { APIRegistry } from '../../core/api-registry';

describe('${className}', () => {
  let pod: ${className};
  let eventBus: EventBus;
  let apiRegistry: APIRegistry;

  beforeEach(async () => {
    // Create test environment
    eventBus = new EventBus({ enableDebugLogging: false });
    apiRegistry = new APIRegistry();
    
    // Create pod instance
    pod = new ${className}({
      eventBus,
      apiRegistry,
      autoRegister: false
    });
    
    // Initialize manually for testing
    await pod.initialize();
  });

  afterEach(async () => {
    // Cleanup
    if (pod && pod.isReady()) {
      await pod.shutdown();
    }
    eventBus.clear();
    apiRegistry.clear();
  });

  describe('Initialization', () => {
    test('should initialize successfully', () => {
      expect(pod.isReady()).toBe(true);
      
      const info = pod.getFeatureInfo();
      expect(info.name).toBe('${spec.name}');
      expect(info.version).toBe('${spec.version || this.config.defaultVersion}');
      expect(info.status).toBe('active');
    });

    test('should register with API registry', () => {
      expect(apiRegistry.hasFeature('${spec.name}')).toBe(true);
      
      const api = apiRegistry.getFeature('${spec.name}');
      expect(api).toBeDefined();
    });

    test('should have valid contract', () => {
      const contract = apiRegistry.getContract('${spec.name}');
      expect(contract.name).toBe('${spec.name}');
      expect(contract.version).toBe('${spec.version || this.config.defaultVersion}');
      expect(contract.description).toBe('${spec.description}');
    });
  });

  describe('API Methods', () => {${spec.apis ? spec.apis.map(api => `
    test('${api.name} should work correctly', async () => {
      const featureAPI = apiRegistry.getFeature('${spec.name}');
      
      // TODO: Implement test for ${api.name}
      expect(featureAPI.${api.name}).toBeDefined();
      expect(typeof featureAPI.${api.name}).toBe('function');
      
      // Test the method (uncomment when implemented)
      // const result = await featureAPI.${api.name}(/* test parameters */);
      // expect(result).toBeDefined();
    });`).join('') : ''}
  });

  describe('Event Handling', () => {${spec.events ? spec.events.filter(e => e.listen).map(event => `
    test('should handle ${event.name} event', async () => {
      // Emit test event
      eventBus.emitSync('${event.name}', {
        // TODO: Add test event data
      }, 'test-source');
      
      // Give some time for event processing
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // TODO: Verify event was handled correctly
    });`).join('') : ''}${spec.events ? spec.events.filter(e => !e.listen).map(event => `
    
    test('should emit ${event.name} event', async () => {
      let eventReceived = false;
      let eventData: any = null;
      
      // Listen for the event
      eventBus.on('${event.name}', (event) => {
        eventReceived = true;
        eventData = event.data;
      }, 'test-listener');
      
      // TODO: Trigger action that should emit the event
      // (implement when API methods are ready)
      
      // TODO: Verify event was emitted
      // expect(eventReceived).toBe(true);
      // expect(eventData).toBeDefined();
    });`).join('') : ''}
  });

  describe('Health Checks', () => {
    test('should pass health check when healthy', async () => {
      const health = await pod.healthCheck();
      
      expect(health.status).toBe('healthy');
      expect(health.details).toBeDefined();
      expect(health.details.metrics).toBeDefined();
    });

    test('should report metrics correctly', () => {
      const metrics = pod.getMetrics();
      
      expect(metrics.uptime).toBeGreaterThanOrEqual(0);
      expect(metrics.eventsEmitted).toBeGreaterThanOrEqual(0);
      expect(metrics.eventsReceived).toBeGreaterThanOrEqual(0);
      expect(metrics.apiCalls).toBeGreaterThanOrEqual(0);
      expect(metrics.errors).toBe(0);
    });
  });

  describe('Configuration', () => {
    test('should handle configuration updates', () => {
      const config = pod.getFeatureConfig();
      expect(config).toBeDefined();
      
      // TODO: Test configuration updates
      // pod.updateConfig({ newSetting: 'value' });
      // const updatedConfig = pod.getFeatureConfig();
      // expect(updatedConfig.newSetting).toBe('value');
    });
  });

  describe('Error Handling', () => {
    test('should handle errors gracefully', async () => {
      // TODO: Test error scenarios
      // Example: Test invalid API calls, missing dependencies, etc.
    });
  });

  describe('Shutdown', () => {
    test('should shutdown gracefully', async () => {
      expect(pod.isReady()).toBe(true);
      
      await pod.shutdown();
      
      expect(pod.isReady()).toBe(false);
      expect(apiRegistry.hasFeature('${spec.name}')).toBe(false);
    });
  });
});

// === INTEGRATION TESTS ===

describe('${className} Integration', () => {
  test('should integrate with other features', async () => {
    // TODO: Implement integration tests with dependencies
    ${spec.dependencies && spec.dependencies.length > 0 ? 
      spec.dependencies.map(dep => `// Test integration with ${dep}`).join('\n    ') : 
      '// No dependencies to test'}
  });

  test('should handle concurrent operations', async () => {
    // TODO: Test concurrent API calls and event handling
  });
});
`;

    await fs.writeFile(filePath, content, 'utf-8');
    return filePath;
  }

  private async generateConfigFile(featurePath: string, spec: FeatureSpec): Promise<string> {
    const className = this.toPascalCase(spec.name) + 'Config';
    const fileName = `${spec.name}.config.ts`;
    const filePath = path.join(featurePath, fileName);

    const content = `// ${spec.name} Configuration - Feature configuration management
// Auto-generated configuration implementation

export class ${className} {
  // === DEFAULT CONFIGURATION ===
  
  private static readonly DEFAULT_CONFIG = {
    enabled: true,
    debug: false,
    retryAttempts: 3,
    timeout: 30000, // 30 seconds
    cacheEnabled: true,
    cacheSize: 1000,
    
    // TODO: Add feature-specific configuration
    // Example configuration options:
    // maxConnections: 10,
    // refreshInterval: 60000,
    // enableNotifications: true,
  };

  // === CONFIGURATION PROPERTIES ===

  public enabled: boolean;
  public debug: boolean;
  public retryAttempts: number;
  public timeout: number;
  public cacheEnabled: boolean;
  public cacheSize: number;

  // TODO: Add typed properties for feature-specific config
  // public maxConnections: number;
  // public refreshInterval: number;
  // public enableNotifications: boolean;

  constructor(config: Partial<${className}> = {}) {
    // Merge with defaults
    const merged = { ...${className}.DEFAULT_CONFIG, ...config };
    
    // Assign properties
    this.enabled = merged.enabled;
    this.debug = merged.debug;
    this.retryAttempts = merged.retryAttempts;
    this.timeout = merged.timeout;
    this.cacheEnabled = merged.cacheEnabled;
    this.cacheSize = merged.cacheSize;

    // TODO: Assign feature-specific properties
    // this.maxConnections = merged.maxConnections;
    // this.refreshInterval = merged.refreshInterval;
    // this.enableNotifications = merged.enableNotifications;

    // Validate configuration
    this.validate();
  }

  // === CONFIGURATION VALIDATION ===

  private validate(): void {
    if (this.retryAttempts < 0 || this.retryAttempts > 10) {
      throw new Error('retryAttempts must be between 0 and 10');
    }

    if (this.timeout < 1000 || this.timeout > 300000) {
      throw new Error('timeout must be between 1 second and 5 minutes');
    }

    if (this.cacheSize < 0 || this.cacheSize > 100000) {
      throw new Error('cacheSize must be between 0 and 100000');
    }

    // TODO: Add feature-specific validation
    // if (this.maxConnections < 1 || this.maxConnections > 1000) {
    //   throw new Error('maxConnections must be between 1 and 1000');
    // }
  }

  // === CONFIGURATION METHODS ===

  /**
   * Update configuration with new values
   */
  update(newConfig: Partial<${className}>): void {
    Object.assign(this, newConfig);
    this.validate();
  }

  /**
   * Reset to default configuration
   */
  reset(): void {
    Object.assign(this, ${className}.DEFAULT_CONFIG);
  }

  /**
   * Get configuration as plain object
   */
  toObject(): Record<string, any> {
    return {
      enabled: this.enabled,
      debug: this.debug,
      retryAttempts: this.retryAttempts,
      timeout: this.timeout,
      cacheEnabled: this.cacheEnabled,
      cacheSize: this.cacheSize,
      
      // TODO: Add feature-specific properties
      // maxConnections: this.maxConnections,
      // refreshInterval: this.refreshInterval,
      // enableNotifications: this.enableNotifications,
    };
  }

  /**
   * Create configuration from environment variables
   */
  static fromEnvironment(): ${className} {
    const envConfig: Partial<${className}> = {};

    // Map environment variables to config
    if (process.env.${spec.name.toUpperCase().replace(/-/g, '_')}_ENABLED !== undefined) {
      envConfig.enabled = process.env.${spec.name.toUpperCase().replace(/-/g, '_')}_ENABLED === 'true';
    }

    if (process.env.${spec.name.toUpperCase().replace(/-/g, '_')}_DEBUG !== undefined) {
      envConfig.debug = process.env.${spec.name.toUpperCase().replace(/-/g, '_')}_DEBUG === 'true';
    }

    if (process.env.${spec.name.toUpperCase().replace(/-/g, '_')}_TIMEOUT !== undefined) {
      envConfig.timeout = parseInt(process.env.${spec.name.toUpperCase().replace(/-/g, '_')}_TIMEOUT);
    }

    // TODO: Add more environment variable mappings

    return new ${className}(envConfig);
  }

  /**
   * Validate external configuration object
   */
  static validate(config: any): config is Partial<${className}> {
    try {
      new ${className}(config);
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export default configuration
export const defaultConfig = new ${className}();

// Export configuration type
export type I${className} = ${className};
`;

    await fs.writeFile(filePath, content, 'utf-8');
    return filePath;
  }

  private async generateReadmeFile(featurePath: string, spec: FeatureSpec): Promise<string> {
    const fileName = 'README.md';
    const filePath = path.join(featurePath, fileName);

    const content = `# ${this.toTitleCase(spec.name)}

${spec.description}

## 🚀 Quick Start

\`\`\`typescript
import { ${this.toPascalCase(spec.name)}Pod } from './${spec.name}.pod';

// Create and initialize the feature
const ${this.toCamelCase(spec.name)} = new ${this.toPascalCase(spec.name)}Pod();
await ${this.toCamelCase(spec.name)}.initialize();

// Use the API${spec.apis && spec.apis.length > 0 ? `
const api = apiRegistry.getFeature('${spec.name}');
${spec.apis.slice(0, 2).map(api => `const result = await api.${api.name}(/* parameters */);`).join('\n')}` : ''}
\`\`\`

## 📋 Features

- ✅ **Conflict-Free Development**: Complete isolation with other features
- ✅ **Event-Driven Communication**: Zero coupling through event bus
- ✅ **Type-Safe API**: Full TypeScript support with contracts
- ✅ **Health Monitoring**: Built-in health checks and metrics
- ✅ **Hot Reloading**: Development-time hot reloading support
- ✅ **Auto-Discovery**: Automatic feature detection and loading

## 🔧 Configuration

\`\`\`typescript
const config = {
  enabled: true,
  debug: false,
  // Add feature-specific configuration
};

const pod = new ${this.toPascalCase(spec.name)}Pod(config);
\`\`\`

## 📡 API Reference

${spec.apis ? spec.apis.map(api => `### \`${api.name}\`

${api.description}

**Parameters:**
${api.parameters.map(p => `- \`${p.name}\` (${p.type}${p.required ? '' : ', optional'}): ${p.description}`).join('\n')}

**Returns:** \`${api.returnType}\`

\`\`\`typescript
${api.async !== false ? 'await ' : ''}api.${api.name}(${api.parameters.map(p => p.name).join(', ')});
\`\`\``).join('\n\n') : 'No public API methods defined.'}

## 📨 Events

### Emitted Events

${spec.events ? spec.events.filter(e => !e.listen).map(event => `- **\`${event.name}\`**: ${event.description}`).join('\n') : 'No events emitted.'}

### Listened Events

${spec.events ? spec.events.filter(e => e.listen).map(event => `- **\`${event.name}\`**: ${event.description}`).join('\n') : 'No events listened to.'}

## 🔗 Dependencies

${spec.dependencies && spec.dependencies.length > 0 ? 
  spec.dependencies.map(dep => `- \`${dep}\``).join('\n') : 
  'No dependencies required.'}

## 🧪 Testing

\`\`\`bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
\`\`\`

## 📊 Health Monitoring

\`\`\`typescript
// Check feature health
const health = await pod.healthCheck();
console.log('Health:', health.status);

// Get metrics
const metrics = pod.getMetrics();
console.log('Uptime:', metrics.uptime);
console.log('API Calls:', metrics.apiCalls);
\`\`\`

## 🔄 Development

### Hot Reloading

This feature supports hot reloading during development:

\`\`\`bash
# Start with hot reload
npm run dev:watch
\`\`\`

### Adding New Methods

1. Add method specification to the API contract
2. Implement the method in \`${spec.name}.api.ts\`
3. Add tests in \`${spec.name}.test.ts\`
4. Update this README

### Adding New Events

1. Define event in \`${spec.name}.events.ts\`
2. Add event handling logic if needed
3. Update the API contract
4. Add tests for event handling

## 📝 Generated Information

- **Generated**: ${new Date().toISOString()}
- **Generator Version**: ${this.config.defaultVersion}
- **Feature Version**: ${spec.version || this.config.defaultVersion}
- **Author**: ${spec.author || this.config.defaultAuthor}
- **Category**: ${spec.category || 'utility'}

## 🤝 Contributing

This feature was auto-generated using the Conflict-Free Feature Pod architecture. 

When contributing:
1. Only edit files in this feature directory
2. Communicate with other features through events only
3. Follow the established API contract
4. Add tests for new functionality
5. Update documentation

## 📄 License

Auto-generated feature pod - inherits project license.
`;

    await fs.writeFile(filePath, content, 'utf-8');
    return filePath;
  }

  private async generatePackageJson(featurePath: string, spec: FeatureSpec): Promise<string> {
    const fileName = 'package.json';
    const filePath = path.join(featurePath, fileName);

    const packageJson = {
      name: `@features/${spec.name}`,
      version: spec.version || this.config.defaultVersion,
      description: spec.description,
      main: `${spec.name}.pod.ts`,
      types: `${spec.name}.types.ts`,
      scripts: {
        start: `node ${spec.name}.pod.js`,
        test: "jest",
        "test:watch": "jest --watch",
        "test:coverage": "jest --coverage",
        build: "tsc",
        dev: `ts-node ${spec.name}.pod.ts`,
        lint: "eslint . --ext .ts",
        "lint:fix": "eslint . --ext .ts --fix"
      },
      keywords: [
        "feature-pod",
        "conflict-free",
        "parallel-development",
        spec.category || "utility",
        spec.name
      ],
      author: spec.author || this.config.defaultAuthor,
      license: "MIT",
      dependencies: {
        // Core dependencies
        "typescript": "^5.0.0",
        "ts-node": "^10.0.0"
      },
      devDependencies: {
        "@types/node": "^20.0.0",
        "@types/jest": "^29.0.0",
        "jest": "^29.0.0",
        "ts-jest": "^29.0.0",
        "eslint": "^8.0.0",
        "@typescript-eslint/eslint-plugin": "^6.0.0",
        "@typescript-eslint/parser": "^6.0.0"
      },
      // Feature-specific metadata
      feature: {
        name: spec.name,
        version: spec.version || this.config.defaultVersion,
        category: spec.category || "utility",
        dependencies: spec.dependencies || [],
        generated: true,
        generatedAt: new Date().toISOString(),
        apis: spec.apis?.map(api => api.name) || [],
        events: {
          emits: spec.events?.filter(e => !e.listen).map(e => e.name) || [],
          listensTo: spec.events?.filter(e => e.listen).map(e => e.name) || []
        }
      }
    };

    await fs.writeFile(filePath, JSON.stringify(packageJson, null, 2), 'utf-8');
    return filePath;
  }

  // === UTILITY METHODS ===

  private async initializeGit(featurePath: string): Promise<void> {
    const { spawn } = await import('child_process');
    
    return new Promise((resolve, reject) => {
      const git = spawn('git', ['init'], { cwd: featurePath });
      
      git.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Git init failed with code ${code}`));
        }
      });
      
      git.on('error', reject);
    });
  }

  private toPascalCase(str: string): string {
    return str.replace(/(^|-)([a-z])/g, (_, __, char) => char.toUpperCase());
  }

  private toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }

  private toTitleCase(str: string): string {
    return str.replace(/(-|^)([a-z])/g, (_, __, char) => ' ' + char.toUpperCase()).trim();
  }

  // === PUBLIC API ===

  /**
   * Generate multiple features from specifications
   */
  async generateFeatures(specs: FeatureSpec[]): Promise<GenerationResult[]> {
    const results: GenerationResult[] = [];
    
    for (const spec of specs) {
      const result = await this.generateFeature(spec);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Check if feature already exists
   */
  async featureExists(featureName: string): Promise<boolean> {
    const featurePath = path.join(this.config.featuresDirectory!, featureName);
    
    try {
      await fs.access(featurePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get generated feature template
   */
  getFeatureTemplate(category: string = 'utility'): Partial<FeatureSpec> {
    const templates: Record<string, Partial<FeatureSpec>> = {
      ui: {
        category: 'ui',
        apis: [
          {
            name: 'render',
            description: 'Render the UI component',
            parameters: [
              { name: 'container', type: 'HTMLElement', required: true, description: 'Container element' }
            ],
            returnType: 'void',
            async: false
          }
        ],
        events: [
          { name: 'ui.rendered', description: 'UI component rendered', listen: false },
          { name: 'ui.interaction', description: 'User interaction occurred', listen: false }
        ]
      },
      backend: {
        category: 'backend',
        apis: [
          {
            name: 'processRequest',
            description: 'Process incoming request',
            parameters: [
              { name: 'request', type: 'any', required: true, description: 'Request data' }
            ],
            returnType: 'Promise<any>',
            async: true
          }
        ],
        events: [
          { name: 'request.processed', description: 'Request processed successfully', listen: false }
        ]
      },
      game: {
        category: 'game',
        apis: [
          {
            name: 'update',
            description: 'Update game logic',
            parameters: [
              { name: 'deltaTime', type: 'number', required: true, description: 'Time since last update' }
            ],
            returnType: 'void',
            async: false
          }
        ],
        events: [
          { name: 'game.updated', description: 'Game logic updated', listen: false }
        ]
      }
    };

    return templates[category] || templates.utility;
  }
}

// Export for CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FeatureGenerator };
}