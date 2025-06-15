// Path of Exile style inventory management - Configuration
// Auto-generated configuration class for conflict-free parallel development

import { InventorySystemTypes } from './inventory-system.types';

export class InventorySystemConfig {
  private config: InventorySystemTypes.InventorySystemConfig;
  
  constructor(userConfig: Partial<InventorySystemTypes.InventorySystemConfig> = {}) {
    this.config = this.mergeWithDefaults(userConfig);
    this.validateConfig();
  }

  // === CONFIGURATION METHODS ===

  get<K extends keyof InventorySystemTypes.InventorySystemConfig>(key: K): InventorySystemTypes.InventorySystemConfig[K] {
    return this.config[key];
  }

  set<K extends keyof InventorySystemTypes.InventorySystemConfig>(key: K, value: InventorySystemTypes.InventorySystemConfig[K]): void {
    this.config[key] = value;
    this.validateConfig();
  }

  update(updates: Partial<InventorySystemTypes.InventorySystemConfig>): void {
    this.config = { ...this.config, ...updates };
    this.validateConfig();
  }

  getAll(): InventorySystemTypes.InventorySystemConfig {
    return { ...this.config };
  }

  reset(): void {
    this.config = this.getDefaultConfig();
  }

  // === PRIVATE METHODS ===

  private mergeWithDefaults(userConfig: Partial<InventorySystemTypes.InventorySystemConfig>): InventorySystemTypes.InventorySystemConfig {
    return {
      ...this.getDefaultConfig(),
      ...userConfig
    };
  }

  private getDefaultConfig(): InventorySystemTypes.InventorySystemConfig {
    return {
      enabled: true,
      maxRetries: 3,
      timeout: 30000,
      debug: process.env.NODE_ENV === 'development',
      
      // Feature-specific defaults
      ...this.getFeatureDefaults()
    };
  }

  private getFeatureDefaults(): Partial<InventorySystemTypes.InventorySystemConfig> {
    return {
      // Inventory grid configuration
      gridWidth: 12,
      gridHeight: 5,
      
      // Auto-features
      autoSort: false,
      stackableItems: true,
      autoPickup: false,
      
      // Item management
      allowItemDrop: true,
      confirmItemDestroy: true,
      highlightUsableItems: true,
      
      // Performance
      cacheInventoryState: true,
      batchUpdates: true,
      maxCacheSize: 1000,
      
      // UI preferences
      showItemTooltips: true,
      showGridLines: true,
      enableDragAndDrop: true,
      snapToGrid: true,
      
      // Accessibility
      colorBlindSupport: false,
      highContrastMode: false,
      screenReaderSupport: false
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
    // Grid size validation
    if (this.config.gridWidth && (typeof this.config.gridWidth !== 'number' || this.config.gridWidth < 1)) {
      errors.push('gridWidth must be a positive number');
    }

    if (this.config.gridHeight && (typeof this.config.gridHeight !== 'number' || this.config.gridHeight < 1)) {
      errors.push('gridHeight must be a positive number');
    }

    // Cache size validation
    if (this.config.maxCacheSize && (typeof this.config.maxCacheSize !== 'number' || this.config.maxCacheSize < 1)) {
      errors.push('maxCacheSize must be a positive number');
    }

    // Boolean validations
    const booleanFields = [
      'autoSort', 'stackableItems', 'autoPickup', 'allowItemDrop', 
      'confirmItemDestroy', 'highlightUsableItems', 'cacheInventoryState', 
      'batchUpdates', 'showItemTooltips', 'showGridLines', 'enableDragAndDrop', 
      'snapToGrid', 'colorBlindSupport', 'highContrastMode', 'screenReaderSupport'
    ];

    for (const field of booleanFields) {
      if (this.config[field] !== undefined && typeof this.config[field] !== 'boolean') {
        errors.push(`${field} must be a boolean`);
      }
    }
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

  getGridSize(): { width: number; height: number } {
    return {
      width: this.config.gridWidth || 12,
      height: this.config.gridHeight || 5
    };
  }

  getTotalSlots(): number {
    const { width, height } = this.getGridSize();
    return width * height;
  }

  isAutoSortEnabled(): boolean {
    return this.config.autoSort || false;
  }

  isStackingEnabled(): boolean {
    return this.config.stackableItems !== false;
  }

  isAutoPickupEnabled(): boolean {
    return this.config.autoPickup || false;
  }

  shouldCacheState(): boolean {
    return this.config.cacheInventoryState !== false;
  }

  shouldBatchUpdates(): boolean {
    return this.config.batchUpdates !== false;
  }

  getMaxCacheSize(): number {
    return this.config.maxCacheSize || 1000;
  }

  // === UI PREFERENCES ===

  shouldShowTooltips(): boolean {
    return this.config.showItemTooltips !== false;
  }

  shouldShowGridLines(): boolean {
    return this.config.showGridLines !== false;
  }

  isDragAndDropEnabled(): boolean {
    return this.config.enableDragAndDrop !== false;
  }

  shouldSnapToGrid(): boolean {
    return this.config.snapToGrid !== false;
  }

  // === ACCESSIBILITY ===

  isColorBlindSupportEnabled(): boolean {
    return this.config.colorBlindSupport || false;
  }

  isHighContrastModeEnabled(): boolean {
    return this.config.highContrastMode || false;
  }

  isScreenReaderSupportEnabled(): boolean {
    return this.config.screenReaderSupport || false;
  }

  // === ITEM MANAGEMENT ===

  isItemDropAllowed(): boolean {
    return this.config.allowItemDrop !== false;
  }

  shouldConfirmItemDestroy(): boolean {
    return this.config.confirmItemDestroy !== false;
  }

  shouldHighlightUsableItems(): boolean {
    return this.config.highlightUsableItems !== false;
  }

  // === EXPORT METHODS ===

  toJSON(): InventorySystemTypes.InventorySystemConfig {
    return this.getAll();
  }

  toString(): string {
    return JSON.stringify(this.config, null, 2);
  }

  // === PRESETS ===

  loadPreset(presetName: 'default' | 'hardcore' | 'casual' | 'speedrun'): void {
    const presets = {
      default: this.getDefaultConfig(),
      
      hardcore: {
        ...this.getDefaultConfig(),
        autoPickup: false,
        confirmItemDestroy: true,
        highlightUsableItems: true,
        autoSort: false
      },
      
      casual: {
        ...this.getDefaultConfig(),
        autoPickup: true,
        autoSort: true,
        confirmItemDestroy: false,
        highlightUsableItems: true
      },
      
      speedrun: {
        ...this.getDefaultConfig(),
        autoPickup: true,
        autoSort: true,
        confirmItemDestroy: false,
        batchUpdates: true,
        cacheInventoryState: true,
        showGridLines: false,
        showItemTooltips: false
      }
    };

    this.config = presets[presetName];
    this.validateConfig();
    console.log(`📋 Loaded inventory configuration preset: ${presetName}`);
  }

  saveCustomPreset(name: string): void {
    // In a real implementation, this would save to localStorage or a config file
    console.log(`💾 Saved custom inventory preset: ${name}`);
  }
}

// Export for CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { InventorySystemConfig };
}