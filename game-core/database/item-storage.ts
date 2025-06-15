import { EventEmitter } from 'events';
import { ISystem, IEntity } from '../ecs/ecs-core';
import { SystemMetrics } from '../../types/ecs-types';
import MCPSetupSystem from './mcp-setup';

export interface StorageItem {
  id: string;
  baseType: string;
  name: string;
  rarity: 'normal' | 'magic' | 'rare' | 'unique' | 'legendary' | 'relic';
  itemLevel: number;
  quality: number;
  corrupted: boolean;
  synthesised: boolean;
  fractured: boolean;
  mirrored: boolean;
  identified: boolean;
  sockets: ItemSocket[];
  links: number[];
  properties: ItemProperty[];
  requirements: ItemRequirements;
  modifiers: ItemModifier[];
  flavourText?: string;
  stackSize: number;
  maxStackSize: number;
  width: number;
  height: number;
  iconPath: string;
  value: number;
  vendorPrice: number;
}

export interface ItemSocket {
  id: string;
  colour: 'red' | 'green' | 'blue' | 'white' | 'abyssal';
  linkedTo: string[];
  supportGem?: SupportGem;
  activeGem?: ActiveGem;
}

export interface SupportGem {
  id: string;
  name: string;
  level: number;
  quality: number;
  experience: number;
  maxLevel: number;
  supportTags: string[];
  effects: GemEffect[];
}

export interface ActiveGem {
  id: string;
  name: string;
  level: number;
  quality: number;
  experience: number;
  maxLevel: number;
  manaCost: number;
  cooldown: number;
  tags: string[];
  effects: GemEffect[];
}

export interface GemEffect {
  type: string;
  value: number;
  scaling: 'linear' | 'exponential' | 'diminishing';
  perLevel: boolean;
}

export interface ItemProperty {
  name: string;
  values: PropertyValue[];
  displayMode: 'nameValue' | 'progress' | 'separate';
}

export interface PropertyValue {
  value: string;
  valueType: 'augmented' | 'unaugmented' | 'corrupted' | 'crafted';
}

export interface ItemModifier {
  id: string;
  type: 'implicit' | 'explicit' | 'crafted' | 'enchanted' | 'fractured' | 'synthesised' | 'corrupted' | 'scourged';
  tier: number;
  values: number[];
  ranges: [number, number][];
  magnitudes: number[];
  stat: string;
  translation: string;
  hybrid: boolean;
}

export interface ItemRequirements {
  level: number;
  strength: number;
  dexterity: number;
  intelligence: number;
  characterClass?: string[];
}

export interface InventoryGrid {
  id: string;
  characterId: string;
  type: 'inventory' | 'stash' | 'equipment' | 'currency' | 'divination' | 'essence' | 'fragment' | 'map' | 'unique' | 'premium';
  name: string;
  width: number;
  height: number;
  colour: string;
  public: boolean;
  items: InventorySlot[];
  metadata: GridMetadata;
}

export interface InventorySlot {
  x: number;
  y: number;
  item: StorageItem | null;
  reserved: boolean;
  highlighted: boolean;
}

export interface GridMetadata {
  tabIndex: number;
  folder?: string;
  specialized: boolean;
  premium: boolean;
  removeOnly: boolean;
  mapSeries?: string;
  specializedType?: string;
}

export interface StashTab extends InventoryGrid {
  purchased: boolean;
  mtxId?: string;
  specialFeatures: string[];
  quadTab: boolean;
  mapTab: boolean;
  currencyTab: boolean;
  essenceTab: boolean;
  divinationTab: boolean;
  fragmentTab: boolean;
  deliriumTab: boolean;
  metamorphTab: boolean;
  blightTab: boolean;
}

export interface CurrencyStack {
  currencyType: string;
  amount: number;
  stackSize: number;
  value: number;
  rarity: string;
}

export interface SearchFilter {
  name?: string;
  type?: string;
  rarity?: string[];
  minLevel?: number;
  maxLevel?: number;
  corrupted?: boolean;
  modifiers?: string[];
  sockets?: SocketFilter;
  price?: PriceFilter;
  category?: string;
}

export interface SocketFilter {
  minSockets: number;
  maxSockets: number;
  minLinks: number;
  maxLinks: number;
  colours: string[];
}

export interface PriceFilter {
  minPrice: number;
  maxPrice: number;
  currency: string;
}

export interface ItemTransaction {
  id: string;
  type: 'move' | 'split' | 'merge' | 'vendor' | 'craft' | 'drop' | 'pickup' | 'trade';
  itemId: string;
  fromLocation: ItemLocation;
  toLocation: ItemLocation;
  quantity: number;
  timestamp: number;
  playerId: string;
  cost?: number;
  currency?: string;
}

export interface ItemLocation {
  type: 'inventory' | 'stash' | 'equipment' | 'ground' | 'vendor' | 'crafting';
  containerId: string;
  x?: number;
  y?: number;
  slot?: string;
}

export interface StorageStatistics {
  totalItems: number;
  totalValue: number;
  uniqueTypes: number;
  averageItemLevel: number;
  currencyValue: number;
  rareItems: number;
  uniqueItems: number;
  corruptedItems: number;
  socketsDistribution: Record<number, number>;
  linksDistribution: Record<number, number>;
  categoryDistribution: Record<string, number>;
}

export interface StorageOptimization {
  efficiency: number;
  recommendations: OptimizationRecommendation[];
  wastedSpace: number;
  itemConsolidation: ConsolidationSuggestion[];
  valuableItems: StorageItem[];
  duplicates: StorageItem[][];
}

export interface OptimizationRecommendation {
  type: 'consolidate' | 'vendor' | 'move' | 'upgrade' | 'organize';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  potentialSaving: number;
  items: string[];
  action: string;
}

export interface ConsolidationSuggestion {
  items: StorageItem[];
  targetLocation: ItemLocation;
  spaceSaved: number;
  efficiency: number;
}

export class ItemStorageSystem extends EventEmitter implements ISystem {
  readonly name: string = 'ItemStorageSystem';
  readonly requiredComponents: readonly string[] = ['Inventory', 'Storage'];
  readonly entities: Set<IEntity> = new Set();
  readonly priority: number = 10;
  enabled: boolean = true;

  private mcpSystem: MCPSetupSystem;
  private inventoryGrids: Map<string, InventoryGrid> = new Map();
  private stashTabs: Map<string, StashTab> = new Map();
  private items: Map<string, StorageItem> = new Map();
  private currencyStacks: Map<string, CurrencyStack[]> = new Map();
  private itemTransactions: ItemTransaction[] = [];
  private searchIndexes: Map<string, Set<string>> = new Map();
  private autoSort: boolean = true;
  private compression: boolean = true;

  constructor(mcpSystem: MCPSetupSystem) {
    super();
    this.mcpSystem = mcpSystem;
    this.initializeDefaultGrids();
    this.initializeSearchIndexes();
    console.log('📦 Item Storage System initialized');
  }

  addEntity(entity: IEntity): void {
    if (this.canProcess(entity)) {
      this.entities.add(entity);
      this.emit('entityAdded', { system: this.name, entity });
    }
  }

  removeEntity(entity: IEntity): void {
    if (this.entities.has(entity)) {
      this.entities.delete(entity);
      this.emit('entityRemoved', { system: this.name, entity });
    }
  }

  update(deltaTime: number): void {
    if (!this.enabled) return;

    // Auto-sort inventories if enabled
    if (this.autoSort) {
      this.performAutoSort();
    }

    // Update item degradation
    this.updateItemDegradation(deltaTime);

    // Process storage-related entities
    for (const entity of this.entities) {
      this.processStorageEntity(entity, deltaTime);
    }

    // Clean up expired transactions
    this.cleanupExpiredTransactions();
  }

  canProcess(entity: IEntity): boolean {
    return entity.hasComponents(this.requiredComponents);
  }

  cleanup(): void {
    this.entities.clear();
    this.inventoryGrids.clear();
    this.stashTabs.clear();
    this.items.clear();
    this.currencyStacks.clear();
    this.itemTransactions = [];
    this.searchIndexes.clear();
    this.emit('systemCleanup', { system: this.name });
  }

  getMetrics(): SystemMetrics {
    return {
      name: this.name,
      executionTime: 0,
      entityCount: this.entities.size,
      lastUpdate: Date.now(),
      averageTime: 0,
      maxTime: 0,
      minTime: 0
    };
  }

  // Item Management
  async createItem(itemData: Partial<StorageItem>): Promise<string> {
    const item: StorageItem = {
      id: this.generateItemId(),
      baseType: itemData.baseType || 'Unknown',
      name: itemData.name || 'Unnamed Item',
      rarity: itemData.rarity || 'normal',
      itemLevel: itemData.itemLevel || 1,
      quality: itemData.quality || 0,
      corrupted: itemData.corrupted || false,
      synthesised: itemData.synthesised || false,
      fractured: itemData.fractured || false,
      mirrored: itemData.mirrored || false,
      identified: itemData.identified || true,
      sockets: itemData.sockets || [],
      links: itemData.links || [],
      properties: itemData.properties || [],
      requirements: itemData.requirements || { level: 1, strength: 0, dexterity: 0, intelligence: 0 },
      modifiers: itemData.modifiers || [],
      stackSize: itemData.stackSize || 1,
      maxStackSize: itemData.maxStackSize || 1,
      width: itemData.width || 1,
      height: itemData.height || 1,
      iconPath: itemData.iconPath || 'default_icon.png',
      value: itemData.value || 0,
      vendorPrice: itemData.vendorPrice || 0,
      ...itemData
    };

    // Store item
    this.items.set(item.id, item);

    // Update search indexes
    this.updateSearchIndexes(item);

    // Save to database
    await this.saveItemToDatabase(item);

    this.emit('itemCreated', { item });
    console.log(`📦 Item created: ${item.name} (${item.rarity})`);

    return item.id;
  }

  async deleteItem(itemId: string): Promise<boolean> {
    const item = this.items.get(itemId);
    if (!item) return false;

    // Remove from all containers
    this.removeItemFromAllContainers(itemId);

    // Remove from cache
    this.items.delete(itemId);

    // Remove from search indexes
    this.removeFromSearchIndexes(item);

    // Delete from database
    await this.deleteItemFromDatabase(itemId);

    this.emit('itemDeleted', { itemId });
    console.log(`📦 Item deleted: ${itemId}`);

    return true;
  }

  getItem(itemId: string): StorageItem | null {
    return this.items.get(itemId) || null;
  }

  async updateItem(itemId: string, updates: Partial<StorageItem>): Promise<boolean> {
    const item = this.items.get(itemId);
    if (!item) return false;

    // Apply updates
    Object.assign(item, updates);

    // Update search indexes
    this.updateSearchIndexes(item);

    // Save to database
    await this.saveItemToDatabase(item);

    this.emit('itemUpdated', { itemId, updates });
    return true;
  }

  // Inventory Grid Management
  async createInventoryGrid(characterId: string, gridData: Partial<InventoryGrid>): Promise<string> {
    const grid: InventoryGrid = {
      id: this.generateGridId(),
      characterId,
      type: gridData.type || 'inventory',
      name: gridData.name || 'Inventory',
      width: gridData.width || 12,
      height: gridData.height || 5,
      colour: gridData.colour || 'default',
      public: gridData.public || false,
      items: this.createEmptySlots(gridData.width || 12, gridData.height || 5),
      metadata: gridData.metadata || {
        tabIndex: 0,
        specialized: false,
        premium: false,
        removeOnly: false
      },
      ...gridData
    };

    this.inventoryGrids.set(grid.id, grid);
    await this.saveGridToDatabase(grid);

    this.emit('gridCreated', { grid });
    console.log(`📦 Inventory grid created: ${grid.name} (${grid.width}x${grid.height})`);

    return grid.id;
  }

  async createStashTab(characterId: string, tabData: Partial<StashTab>): Promise<string> {
    const stashTab: StashTab = {
      id: this.generateGridId(),
      characterId,
      type: tabData.type || 'stash',
      name: tabData.name || 'Stash Tab',
      width: tabData.width || 12,
      height: tabData.height || 12,
      colour: tabData.colour || 'default',
      public: tabData.public || false,
      items: this.createEmptySlots(tabData.width || 12, tabData.height || 12),
      metadata: tabData.metadata || {
        tabIndex: 0,
        specialized: false,
        premium: false,
        removeOnly: false
      },
      purchased: tabData.purchased || false,
      specialFeatures: tabData.specialFeatures || [],
      quadTab: tabData.quadTab || false,
      mapTab: tabData.mapTab || false,
      currencyTab: tabData.currencyTab || false,
      essenceTab: tabData.essenceTab || false,
      divinationTab: tabData.divinationTab || false,
      fragmentTab: tabData.fragmentTab || false,
      deliriumTab: tabData.deliriumTab || false,
      metamorphTab: tabData.metamorphTab || false,
      blightTab: tabData.blightTab || false,
      ...tabData
    };

    this.stashTabs.set(stashTab.id, stashTab);
    await this.saveStashTabToDatabase(stashTab);

    this.emit('stashTabCreated', { stashTab });
    console.log(`📦 Stash tab created: ${stashTab.name} (${stashTab.type})`);

    return stashTab.id;
  }

  // Item Movement and Placement
  async moveItem(itemId: string, fromLocation: ItemLocation, toLocation: ItemLocation, quantity: number = 1): Promise<boolean> {
    const item = this.items.get(itemId);
    if (!item) return false;

    // Validate movement
    if (!this.canMoveItem(item, fromLocation, toLocation, quantity)) {
      return false;
    }

    // Remove from source
    const removed = await this.removeItemFromLocation(itemId, fromLocation, quantity);
    if (!removed) return false;

    // Add to destination
    const added = await this.addItemToLocation(item, toLocation, quantity);
    if (!added) {
      // Rollback - add back to source
      await this.addItemToLocation(item, fromLocation, quantity);
      return false;
    }

    // Record transaction
    this.recordTransaction({
      id: this.generateTransactionId(),
      type: 'move',
      itemId,
      fromLocation,
      toLocation,
      quantity,
      timestamp: Date.now(),
      playerId: item.id // Would get from context
    });

    this.emit('itemMoved', { itemId, fromLocation, toLocation, quantity });
    return true;
  }

  async autoPlaceItem(itemId: string, preferredGridId?: string): Promise<ItemLocation | null> {
    const item = this.items.get(itemId);
    if (!item) return null;

    // Try preferred grid first
    if (preferredGridId) {
      const location = this.findAvailableSlot(preferredGridId, item);
      if (location) {
        await this.addItemToLocation(item, location, item.stackSize);
        return location;
      }
    }

    // Try all available grids
    for (const grid of this.inventoryGrids.values()) {
      const location = this.findAvailableSlot(grid.id, item);
      if (location) {
        await this.addItemToLocation(item, location, item.stackSize);
        return location;
      }
    }

    return null;
  }

  // Search and Filtering
  searchItems(characterId: string, filter: SearchFilter): StorageItem[] {
    const results: StorageItem[] = [];
    
    for (const item of this.items.values()) {
      if (this.matchesFilter(item, filter)) {
        results.push(item);
      }
    }

    // Sort by relevance
    return this.sortSearchResults(results, filter);
  }

  searchByName(name: string): StorageItem[] {
    const lowercaseName = name.toLowerCase();
    const matchingIds = this.searchIndexes.get('name') || new Set();
    
    return Array.from(matchingIds)
      .map(id => this.items.get(id))
      .filter(item => item && item.name.toLowerCase().includes(lowercaseName)) as StorageItem[];
  }

  searchByType(type: string): StorageItem[] {
    const matchingIds = this.searchIndexes.get(`type:${type}`) || new Set();
    return Array.from(matchingIds)
      .map(id => this.items.get(id))
      .filter(item => item !== undefined) as StorageItem[];
  }

  // Storage Statistics and Analytics
  getStorageStatistics(characterId: string): StorageStatistics {
    const characterItems = this.getCharacterItems(characterId);
    
    const stats: StorageStatistics = {
      totalItems: characterItems.length,
      totalValue: characterItems.reduce((sum, item) => sum + item.value, 0),
      uniqueTypes: new Set(characterItems.map(item => item.baseType)).size,
      averageItemLevel: characterItems.reduce((sum, item) => sum + item.itemLevel, 0) / characterItems.length || 0,
      currencyValue: this.calculateCurrencyValue(characterId),
      rareItems: characterItems.filter(item => item.rarity === 'rare').length,
      uniqueItems: characterItems.filter(item => item.rarity === 'unique').length,
      corruptedItems: characterItems.filter(item => item.corrupted).length,
      socketsDistribution: this.calculateSocketsDistribution(characterItems),
      linksDistribution: this.calculateLinksDistribution(characterItems),
      categoryDistribution: this.calculateCategoryDistribution(characterItems)
    };

    return stats;
  }

  getStorageOptimization(characterId: string): StorageOptimization {
    const characterItems = this.getCharacterItems(characterId);
    const recommendations: OptimizationRecommendation[] = [];
    
    // Find vendor trash
    const vendorTrash = characterItems.filter(item => 
      item.rarity === 'normal' && item.value < 5 && !this.isValueableBase(item)
    );
    
    if (vendorTrash.length > 0) {
      recommendations.push({
        type: 'vendor',
        priority: 'medium',
        description: `Vendor ${vendorTrash.length} low-value items`,
        potentialSaving: vendorTrash.reduce((sum, item) => sum + item.vendorPrice, 0),
        items: vendorTrash.map(item => item.id),
        action: 'Vendor these items for currency'
      });
    }

    // Find consolidation opportunities
    const stackableItems = this.findStackableItems(characterItems);
    if (stackableItems.length > 0) {
      recommendations.push({
        type: 'consolidate',
        priority: 'high',
        description: `Consolidate ${stackableItems.length} stackable items`,
        potentialSaving: stackableItems.length * 0.5, // Space saving
        items: stackableItems.map(item => item.id),
        action: 'Stack identical items together'
      });
    }

    // Find duplicates
    const duplicates = this.findDuplicateItems(characterItems);

    const efficiency = this.calculateStorageEfficiency(characterId);
    const wastedSpace = this.calculateWastedSpace(characterId);

    return {
      efficiency,
      recommendations,
      wastedSpace,
      itemConsolidation: this.getConsolidationSuggestions(characterItems),
      valuableItems: characterItems
        .filter(item => item.value > 100 || item.rarity === 'unique')
        .sort((a, b) => b.value - a.value)
        .slice(0, 10),
      duplicates
    };
  }

  // Currency Management
  addCurrency(characterId: string, currencyType: string, amount: number): boolean {
    let stacks = this.currencyStacks.get(characterId) || [];
    let existingStack = stacks.find(stack => stack.currencyType === currencyType);

    if (existingStack) {
      existingStack.amount += amount;
    } else {
      existingStack = {
        currencyType,
        amount,
        stackSize: this.getCurrencyStackSize(currencyType),
        value: this.getCurrencyValue(currencyType),
        rarity: this.getCurrencyRarity(currencyType)
      };
      stacks.push(existingStack);
    }

    this.currencyStacks.set(characterId, stacks);
    this.emit('currencyAdded', { characterId, currencyType, amount });
    return true;
  }

  removeCurrency(characterId: string, currencyType: string, amount: number): boolean {
    const stacks = this.currencyStacks.get(characterId) || [];
    const existingStack = stacks.find(stack => stack.currencyType === currencyType);

    if (!existingStack || existingStack.amount < amount) {
      return false;
    }

    existingStack.amount -= amount;
    
    if (existingStack.amount === 0) {
      const index = stacks.indexOf(existingStack);
      stacks.splice(index, 1);
    }

    this.emit('currencyRemoved', { characterId, currencyType, amount });
    return true;
  }

  getCurrencyAmount(characterId: string, currencyType: string): number {
    const stacks = this.currencyStacks.get(characterId) || [];
    const stack = stacks.find(s => s.currencyType === currencyType);
    return stack ? stack.amount : 0;
  }

  // Database Operations
  private async saveItemToDatabase(item: StorageItem): Promise<void> {
    const sql = `
      INSERT INTO items (id, character_id, base_type, name, rarity, item_level, quality, corrupted, 
                        synthesised, fractured, mirrored, identified, sockets, links, properties, 
                        requirements, modifiers, stack_size, max_stack_size, width, height, 
                        icon_path, value, vendor_price, flavour_text)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      name = VALUES(name), rarity = VALUES(rarity), quality = VALUES(quality),
      corrupted = VALUES(corrupted), stack_size = VALUES(stack_size), value = VALUES(value)
    `;

    const params = [
      item.id, '', item.baseType, item.name, item.rarity, item.itemLevel, item.quality,
      item.corrupted, item.synthesised, item.fractured, item.mirrored, item.identified,
      JSON.stringify(item.sockets), JSON.stringify(item.links), JSON.stringify(item.properties),
      JSON.stringify(item.requirements), JSON.stringify(item.modifiers),
      item.stackSize, item.maxStackSize, item.width, item.height,
      item.iconPath, item.value, item.vendorPrice, item.flavourText || ''
    ];

    await this.mcpSystem.executeQuery(sql, params);
  }

  private async saveGridToDatabase(grid: InventoryGrid): Promise<void> {
    const sql = `
      INSERT INTO inventory_grids (id, character_id, type, name, width, height, colour, public, items, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      name = VALUES(name), items = VALUES(items), metadata = VALUES(metadata)
    `;

    const params = [
      grid.id, grid.characterId, grid.type, grid.name, grid.width, grid.height,
      grid.colour, grid.public, JSON.stringify(grid.items), JSON.stringify(grid.metadata)
    ];

    await this.mcpSystem.executeQuery(sql, params);
  }

  private async saveStashTabToDatabase(stashTab: StashTab): Promise<void> {
    const sql = `
      INSERT INTO stash_tabs (id, character_id, type, name, width, height, colour, public, items, 
                             metadata, purchased, special_features, quad_tab, map_tab, currency_tab,
                             essence_tab, divination_tab, fragment_tab)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      name = VALUES(name), items = VALUES(items), metadata = VALUES(metadata)
    `;

    const params = [
      stashTab.id, stashTab.characterId, stashTab.type, stashTab.name, 
      stashTab.width, stashTab.height, stashTab.colour, stashTab.public,
      JSON.stringify(stashTab.items), JSON.stringify(stashTab.metadata),
      stashTab.purchased, JSON.stringify(stashTab.specialFeatures),
      stashTab.quadTab, stashTab.mapTab, stashTab.currencyTab,
      stashTab.essenceTab, stashTab.divinationTab, stashTab.fragmentTab
    ];

    await this.mcpSystem.executeQuery(sql, params);
  }

  private async deleteItemFromDatabase(itemId: string): Promise<void> {
    const sql = 'DELETE FROM items WHERE id = ?';
    await this.mcpSystem.executeQuery(sql, [itemId]);
  }

  // Helper Methods
  private initializeDefaultGrids(): void {
    // Default inventory would be created per character
    console.log('📦 Default grids system initialized');
  }

  private initializeSearchIndexes(): void {
    this.searchIndexes.set('name', new Set());
    this.searchIndexes.set('type', new Set());
    this.searchIndexes.set('rarity', new Set());
    console.log('📦 Search indexes initialized');
  }

  private createEmptySlots(width: number, height: number): InventorySlot[] {
    const slots: InventorySlot[] = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        slots.push({
          x, y,
          item: null,
          reserved: false,
          highlighted: false
        });
      }
    }
    return slots;
  }

  private generateItemId(): string {
    return `item_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  private generateGridId(): string {
    return `grid_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  private generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  private updateSearchIndexes(item: StorageItem): void {
    // Add to name index
    this.searchIndexes.get('name')?.add(item.id);
    
    // Add to type index
    this.searchIndexes.get(`type:${item.baseType}`)?.add(item.id);
    
    // Add to rarity index
    this.searchIndexes.get(`rarity:${item.rarity}`)?.add(item.id);
  }

  private removeFromSearchIndexes(item: StorageItem): void {
    this.searchIndexes.get('name')?.delete(item.id);
    this.searchIndexes.get(`type:${item.baseType}`)?.delete(item.id);
    this.searchIndexes.get(`rarity:${item.rarity}`)?.delete(item.id);
  }

  private canMoveItem(item: StorageItem, from: ItemLocation, to: ItemLocation, quantity: number): boolean {
    // Validate item exists and quantity is valid
    if (!item || quantity <= 0 || quantity > item.stackSize) return false;
    
    // Check if destination has space
    return this.hasSpaceForItem(to.containerId, item, quantity);
  }

  private hasSpaceForItem(gridId: string, item: StorageItem, quantity: number): boolean {
    const grid = this.inventoryGrids.get(gridId) || this.stashTabs.get(gridId);
    if (!grid) return false;

    return this.findAvailableSlot(gridId, item) !== null;
  }

  private findAvailableSlot(gridId: string, item: StorageItem): ItemLocation | null {
    const grid = this.inventoryGrids.get(gridId) || this.stashTabs.get(gridId);
    if (!grid) return null;

    // Find first available space that fits the item
    for (let y = 0; y <= grid.height - item.height; y++) {
      for (let x = 0; x <= grid.width - item.width; x++) {
        if (this.canPlaceItemAt(grid, x, y, item)) {
          return {
            type: grid.type === 'stash' ? 'stash' : 'inventory',
            containerId: gridId,
            x, y
          };
        }
      }
    }

    return null;
  }

  private canPlaceItemAt(grid: InventoryGrid, x: number, y: number, item: StorageItem): boolean {
    for (let dy = 0; dy < item.height; dy++) {
      for (let dx = 0; dx < item.width; dx++) {
        const slot = grid.items.find(s => s.x === x + dx && s.y === y + dy);
        if (!slot || slot.item !== null || slot.reserved) {
          return false;
        }
      }
    }
    return true;
  }

  private async removeItemFromLocation(itemId: string, location: ItemLocation, quantity: number): Promise<boolean> {
    // Implementation would remove item from specified location
    return true; // Placeholder
  }

  private async addItemToLocation(item: StorageItem, location: ItemLocation, quantity: number): Promise<boolean> {
    // Implementation would add item to specified location
    return true; // Placeholder
  }

  private removeItemFromAllContainers(itemId: string): void {
    // Remove item from all inventory grids and stash tabs
    for (const grid of this.inventoryGrids.values()) {
      grid.items.forEach(slot => {
        if (slot.item?.id === itemId) {
          slot.item = null;
        }
      });
    }

    for (const stash of this.stashTabs.values()) {
      stash.items.forEach(slot => {
        if (slot.item?.id === itemId) {
          slot.item = null;
        }
      });
    }
  }

  private matchesFilter(item: StorageItem, filter: SearchFilter): boolean {
    if (filter.name && !item.name.toLowerCase().includes(filter.name.toLowerCase())) {
      return false;
    }
    
    if (filter.type && item.baseType !== filter.type) {
      return false;
    }
    
    if (filter.rarity && !filter.rarity.includes(item.rarity)) {
      return false;
    }
    
    if (filter.minLevel && item.itemLevel < filter.minLevel) {
      return false;
    }
    
    if (filter.maxLevel && item.itemLevel > filter.maxLevel) {
      return false;
    }
    
    if (filter.corrupted !== undefined && item.corrupted !== filter.corrupted) {
      return false;
    }

    return true;
  }

  private sortSearchResults(results: StorageItem[], filter: SearchFilter): StorageItem[] {
    return results.sort((a, b) => {
      // Sort by relevance (name match first, then value)
      if (filter.name) {
        const aNameMatch = a.name.toLowerCase().includes(filter.name.toLowerCase());
        const bNameMatch = b.name.toLowerCase().includes(filter.name.toLowerCase());
        if (aNameMatch && !bNameMatch) return -1;
        if (!aNameMatch && bNameMatch) return 1;
      }
      
      return b.value - a.value; // Higher value first
    });
  }

  private getCharacterItems(characterId: string): StorageItem[] {
    return Array.from(this.items.values()).filter(item => {
      // Check if item belongs to character (would need character association)
      return true; // Placeholder
    });
  }

  private calculateCurrencyValue(characterId: string): number {
    const stacks = this.currencyStacks.get(characterId) || [];
    return stacks.reduce((total, stack) => total + (stack.amount * stack.value), 0);
  }

  private calculateSocketsDistribution(items: StorageItem[]): Record<number, number> {
    const distribution: Record<number, number> = {};
    items.forEach(item => {
      const sockets = item.sockets.length;
      distribution[sockets] = (distribution[sockets] || 0) + 1;
    });
    return distribution;
  }

  private calculateLinksDistribution(items: StorageItem[]): Record<number, number> {
    const distribution: Record<number, number> = {};
    items.forEach(item => {
      const maxLinks = Math.max(...item.links, 0);
      distribution[maxLinks] = (distribution[maxLinks] || 0) + 1;
    });
    return distribution;
  }

  private calculateCategoryDistribution(items: StorageItem[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    items.forEach(item => {
      const category = this.getItemCategory(item);
      distribution[category] = (distribution[category] || 0) + 1;
    });
    return distribution;
  }

  private getItemCategory(item: StorageItem): string {
    // Categorize items based on base type
    if (item.baseType.includes('Weapon')) return 'Weapons';
    if (item.baseType.includes('Armor')) return 'Armor';
    if (item.baseType.includes('Ring')) return 'Accessories';
    if (item.baseType.includes('Flask')) return 'Flasks';
    if (item.baseType.includes('Gem')) return 'Gems';
    return 'Miscellaneous';
  }

  private isValueableBase(item: StorageItem): boolean {
    // Determine if item base is valuable even at normal rarity
    const valuableBases = ['Eternal Orb', 'Mirror of Kalandra', 'Headhunter'];
    return valuableBases.includes(item.baseType);
  }

  private findStackableItems(items: StorageItem[]): StorageItem[] {
    return items.filter(item => 
      item.maxStackSize > 1 && 
      item.stackSize < item.maxStackSize &&
      items.some(other => 
        other.id !== item.id && 
        other.baseType === item.baseType && 
        other.stackSize < other.maxStackSize
      )
    );
  }

  private findDuplicateItems(items: StorageItem[]): StorageItem[][] {
    const groups = new Map<string, StorageItem[]>();
    
    items.forEach(item => {
      const key = `${item.baseType}_${item.rarity}_${item.itemLevel}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    });

    return Array.from(groups.values()).filter(group => group.length > 1);
  }

  private calculateStorageEfficiency(characterId: string): number {
    const grids = Array.from(this.inventoryGrids.values())
      .concat(Array.from(this.stashTabs.values()))
      .filter(grid => grid.characterId === characterId);

    let totalSlots = 0;
    let usedSlots = 0;

    grids.forEach(grid => {
      totalSlots += grid.width * grid.height;
      usedSlots += grid.items.filter(slot => slot.item !== null).length;
    });

    return totalSlots > 0 ? usedSlots / totalSlots : 0;
  }

  private calculateWastedSpace(characterId: string): number {
    // Calculate space that could be optimized
    return 0; // Placeholder
  }

  private getConsolidationSuggestions(items: StorageItem[]): ConsolidationSuggestion[] {
    return []; // Placeholder - would analyze item placement efficiency
  }

  private getCurrencyStackSize(currencyType: string): number {
    const stackSizes: Record<string, number> = {
      'chaos_orb': 10,
      'exalted_orb': 10,
      'divine_orb': 10,
      'chromatic_orb': 20,
      'jewellers_orb': 20,
      'fusing_orb': 20
    };
    return stackSizes[currencyType] || 1;
  }

  private getCurrencyValue(currencyType: string): number {
    const values: Record<string, number> = {
      'chaos_orb': 1,
      'exalted_orb': 60,
      'divine_orb': 200,
      'chromatic_orb': 0.1,
      'jewellers_orb': 0.2,
      'fusing_orb': 0.5
    };
    return values[currencyType] || 0;
  }

  private getCurrencyRarity(currencyType: string): string {
    const rarities: Record<string, string> = {
      'scroll_of_wisdom': 'common',
      'chromatic_orb': 'common',
      'chaos_orb': 'uncommon',
      'exalted_orb': 'rare',
      'divine_orb': 'very_rare',
      'mirror_of_kalandra': 'legendary'
    };
    return rarities[currencyType] || 'common';
  }

  private recordTransaction(transaction: ItemTransaction): void {
    this.itemTransactions.push(transaction);
    
    // Keep only recent transactions (last 1000)
    if (this.itemTransactions.length > 1000) {
      this.itemTransactions.shift();
    }
  }

  private performAutoSort(): void {
    // Auto-sort logic would go here
    // Sort by type, rarity, value etc.
  }

  private updateItemDegradation(deltaTime: number): void {
    // Update item condition, durability etc.
  }

  private processStorageEntity(entity: IEntity, deltaTime: number): void {
    // Process entities with storage components
  }

  private cleanupExpiredTransactions(): void {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    this.itemTransactions = this.itemTransactions.filter(tx => tx.timestamp > cutoff);
  }

  // Public API Methods
  getInventoryGrids(characterId: string): InventoryGrid[] {
    return Array.from(this.inventoryGrids.values())
      .filter(grid => grid.characterId === characterId);
  }

  getStashTabs(characterId: string): StashTab[] {
    return Array.from(this.stashTabs.values())
      .filter(tab => tab.characterId === characterId);
  }

  getTransactionHistory(characterId: string): ItemTransaction[] {
    return this.itemTransactions.filter(tx => tx.playerId === characterId);
  }

  // Cleanup
  destroy(): void {
    this.cleanup();
    this.removeAllListeners();
    console.log('📦 Item Storage System destroyed');
  }
}

export default ItemStorageSystem;