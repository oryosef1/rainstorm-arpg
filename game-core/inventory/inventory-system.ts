// inventory-system.ts - Grid-Based Inventory System (Path of Exile Style)
import { EventEmitter } from 'events';
import { IComponent, ISystem, IEntity } from '../ecs/ecs-core';
import { SystemMetrics } from '../../types/ecs-types';

export interface ItemData {
  id: string;
  name: string;
  type: string;
  width: number;
  height: number;
  weight?: number;
  stackable?: boolean;
  stackSize?: number;
  maxStackSize?: number;
  position?: { x: number; y: number };
  rarity?: string;
  value?: number;
}

export interface InventorySlot {
  itemId: string | null;
}

export interface EquipmentSlots {
  mainHand: ItemData | null;
  offHand: ItemData | null;
  helmet: ItemData | null;
  bodyArmor: ItemData | null;
  gloves: ItemData | null;
  boots: ItemData | null;
  belt: ItemData | null;
  amulet: ItemData | null;
  ringLeft: ItemData | null;
  ringRight: ItemData | null;
  flask1: ItemData | null;
  flask2: ItemData | null;
  flask3: ItemData | null;
  flask4: ItemData | null;
  flask5: ItemData | null;
}

export class InventoryComponent implements IComponent {
  readonly name: string = 'Inventory';
  width: number;
  height: number;
  slots: (string | null)[][];
  items: Record<string, ItemData>;

  constructor(width: number = 12, height: number = 5) {
    this.width = width;
    this.height = height;
    this.slots = Array(height).fill(null).map(() => Array(width).fill(null));
    this.items = {};
  }
}

export class InventorySystem extends EventEmitter implements ISystem {
  readonly name: string = 'InventorySystem';
  readonly requiredComponents: readonly string[] = ['Inventory'];
  readonly entities: Set<IEntity> = new Set();
  readonly priority: number = 50;
  enabled: boolean = true;

  constructor() {
    super();
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

    // Process inventory-related entities
    for (const entity of this.entities) {
      this.processInventoryEntity(entity, deltaTime);
    }
  }

  canProcess(entity: IEntity): boolean {
    return entity.hasComponents(this.requiredComponents);
  }

  cleanup(): void {
    this.entities.clear();
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

  private processInventoryEntity(entity: IEntity, deltaTime: number): void {
    // Process inventory-related logic for each entity
  }

  createInventory(entity: IEntity, width: number = 12, height: number = 5): InventoryComponent {
    const inventory = new InventoryComponent(width, height);
    entity.addComponent(inventory);
    return inventory;
  }

  placeItem(inventory: InventoryComponent, item: ItemData, x: number, y: number): boolean {
    if (!this.canPlaceItem(inventory, item, x, y)) {
      return false;
    }

    // Place item in all required slots
    for (let dy = 0; dy < item.height; dy++) {
      for (let dx = 0; dx < item.width; dx++) {
        inventory.slots[y + dy][x + dx] = item.id;
      }
    }

    // Store item reference
    inventory.items[item.id] = item;
    item.position = { x, y };

    this.emit('itemPlaced', { inventory, item, position: { x, y } });
    return true;
  }

  canPlaceItem(inventory: InventoryComponent, item: ItemData, x: number, y: number): boolean {
    // Check bounds
    if (x < 0 || y < 0 || x + item.width > inventory.width || y + item.height > inventory.height) {
      return false;
    }

    // Check if all required slots are empty
    for (let dy = 0; dy < item.height; dy++) {
      for (let dx = 0; dx < item.width; dx++) {
        if (inventory.slots[y + dy][x + dx] !== null) {
          return false;
        }
      }
    }

    return true;
  }

  autoPlaceItem(inventory: InventoryComponent, item: ItemData): boolean {
    // Try to find first available position
    for (let y = 0; y <= inventory.height - item.height; y++) {
      for (let x = 0; x <= inventory.width - item.width; x++) {
        if (this.canPlaceItem(inventory, item, x, y)) {
          return this.placeItem(inventory, item, x, y);
        }
      }
    }
    return false;
  }

  removeItem(inventory: InventoryComponent, itemId: string): ItemData | null {
    const item = inventory.items[itemId];
    if (!item || !item.position) {
      return null;
    }

    // Clear all slots occupied by item
    const { x, y } = item.position;
    for (let dy = 0; dy < item.height; dy++) {
      for (let dx = 0; dx < item.width; dx++) {
        inventory.slots[y + dy][x + dx] = null;
      }
    }

    // Remove item reference
    delete inventory.items[itemId];
    delete item.position;

    this.emit('itemRemoved', { inventory, item });
    return item;
  }

  moveItem(inventory: InventoryComponent, itemId: string, newX: number, newY: number): boolean {
    const item = inventory.items[itemId];
    if (!item) {
      return false;
    }

    // Remove from current position
    const oldPosition = item.position ? { ...item.position } : { x: 0, y: 0 };
    this.removeItem(inventory, itemId);

    // Try to place at new position
    if (this.placeItem(inventory, item, newX, newY)) {
      return true;
    }

    // If failed, restore to original position
    this.placeItem(inventory, item, oldPosition.x, oldPosition.y);
    return false;
  }

  tryStackItem(inventory: InventoryComponent, newItem: ItemData, x: number, y: number): boolean {
    if (!newItem.stackable) {
      return false;
    }

    const existingId = inventory.slots[y] && inventory.slots[y][x];
    if (!existingId) {
      return false;
    }

    const existingItem = inventory.items[existingId];
    if (!existingItem || existingItem.name !== newItem.name) {
      return false;
    }

    // Check if can stack
    const maxStack = existingItem.maxStackSize || 999;
    if ((existingItem.stackSize || 1) >= maxStack) {
      return false;
    }

    // Stack items
    const totalStack = (existingItem.stackSize || 1) + (newItem.stackSize || 1);
    if (totalStack <= maxStack) {
      existingItem.stackSize = totalStack;
      return true;
    } else {
      // Partial stack
      existingItem.stackSize = maxStack;
      newItem.stackSize = totalStack - maxStack;
      return false;
    }
  }

  findItemsByType(inventory: InventoryComponent, type: string): ItemData[] {
    return Object.values(inventory.items).filter(item => item.type === type);
  }

  hasSpaceForItem(inventory: InventoryComponent, item: ItemData): boolean {
    // Check if item can be placed anywhere
    for (let y = 0; y <= inventory.height - item.height; y++) {
      for (let x = 0; x <= inventory.width - item.width; x++) {
        if (this.canPlaceItem(inventory, item, x, y)) {
          return true;
        }
      }
    }
    return false;
  }

  calculateTotalWeight(inventory: InventoryComponent): number {
    return Object.values(inventory.items).reduce((total, item) => {
      const itemWeight = item.weight || 0;
      const quantity = item.stackSize || 1;
      return total + (itemWeight * quantity);
    }, 0);
  }

  serializeInventory(inventory: InventoryComponent): { width: number; height: number; items: Array<{ item: ItemData; position: { x: number; y: number } }> } {
    const items: Array<{ item: ItemData; position: { x: number; y: number } }> = [];
    const processedIds = new Set<string>();

    // Collect all items with their positions
    for (let y = 0; y < inventory.height; y++) {
      for (let x = 0; x < inventory.width; x++) {
        const itemId = inventory.slots[y][x];
        if (itemId && !processedIds.has(itemId)) {
          processedIds.add(itemId);
          const item = inventory.items[itemId];
          items.push({
            item: { ...item },
            position: { x, y }
          });
        }
      }
    }

    return {
      width: inventory.width,
      height: inventory.height,
      items
    };
  }

  deserializeInventory(entity: IEntity, data: { width: number; height: number; items: Array<{ item: ItemData; position: { x: number; y: number } }> }): InventoryComponent {
    const inventory = this.createInventory(entity, data.width, data.height);

    // Place all items
    for (const { item, position } of data.items) {
      this.placeItem(inventory, item, position.x, position.y);
    }

    return inventory;
  }

  // Visual helpers for UI
  getItemAtPosition(inventory: InventoryComponent, x: number, y: number): ItemData | null {
    const itemId = inventory.slots[y] && inventory.slots[y][x];
    return itemId ? inventory.items[itemId] : null;
  }

  getItemBounds(inventory: InventoryComponent, itemId: string): { x: number; y: number; width: number; height: number } | null {
    const item = inventory.items[itemId];
    if (!item || !item.position) {
      return null;
    }

    return {
      x: item.position.x,
      y: item.position.y,
      width: item.width,
      height: item.height
    };
  }

  // Inventory management helpers
  sortInventory(inventory: InventoryComponent): void {
    const items = Object.values(inventory.items);
    
    // Clear inventory
    this.clearInventory(inventory);

    // Sort items by type, then size
    items.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type.localeCompare(b.type);
      }
      return (b.width * b.height) - (a.width * a.height);
    });

    // Re-place items
    for (const item of items) {
      this.autoPlaceItem(inventory, item);
    }
  }

  clearInventory(inventory: InventoryComponent): Record<string, ItemData> {
    // Clear all slots
    for (let y = 0; y < inventory.height; y++) {
      for (let x = 0; x < inventory.width; x++) {
        inventory.slots[y][x] = null;
      }
    }

    // Clear item references but keep the items
    const items = { ...inventory.items };
    inventory.items = {};
    
    return items;
  }

  // Equipment slot management
  equipItem(entity: IEntity, item: ItemData, slot: keyof EquipmentSlots): ItemData | null {
    if (!entity.hasComponent('Equipment')) {
      entity.addComponent('Equipment', {
        slots: {
          mainHand: null,
          offHand: null,
          helmet: null,
          bodyArmor: null,
          gloves: null,
          boots: null,
          belt: null,
          amulet: null,
          ringLeft: null,
          ringRight: null,
          flask1: null,
          flask2: null,
          flask3: null,
          flask4: null,
          flask5: null
        } as EquipmentSlots
      });
    }

    const equipment = entity.getComponent('Equipment');
    const oldItem = equipment.slots[slot];
    equipment.slots[slot] = item;

    this.emit('itemEquipped', { entity, item, slot, oldItem });
    return oldItem;
  }

  unequipItem(entity: IEntity, slot: keyof EquipmentSlots): ItemData | null {
    if (!entity.hasComponent('Equipment')) {
      return null;
    }

    const equipment = entity.getComponent('Equipment');
    const item = equipment.slots[slot];
    equipment.slots[slot] = null;

    this.emit('itemUnequipped', { entity, item, slot });
    return item;
  }
}

export default InventorySystem;