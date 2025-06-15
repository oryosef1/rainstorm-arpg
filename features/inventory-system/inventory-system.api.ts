// Path of Exile style inventory management - API Implementation
// Auto-generated API class for conflict-free parallel development

import { FeaturePod } from '../../templates/feature-pod-template';
import { InventorySystemTypes } from './inventory-system.types';

export class InventorySystemAPI {
  private pod: FeaturePod;
  private inventoryGrid: Map<string, InventorySystemTypes.InventorySlot> = new Map();
  private equippedItems: Map<InventorySystemTypes.EquipmentSlotType, InventorySystemTypes.ItemData> = new Map();
  private nextItemId: number = 1;

  constructor(pod: FeaturePod) {
    this.pod = pod;
    this.initializeInventory();
  }

  // === PUBLIC API METHODS ===

  /**
   * Add item to inventory with automatic positioning
   */
  async addItem(item: InventorySystemTypes.ItemData, position?: InventorySystemTypes.GridPosition): Promise<boolean> {
    try {
      this.validateInput(item, 'item');
      
      // Generate ID if not provided
      if (!item.id) {
        item.id = `item_${this.nextItemId++}`;
      }

      // Find position automatically if not specified
      if (!position) {
        position = this.findAvailablePosition(item.width || 1, item.height || 1);
        if (!position) {
          console.warn('❌ Inventory is full');
          this.emitInventoryFull();
          return false;
        }
      }

      // Check if position is valid and available
      if (!this.isPositionAvailable(position, item.width || 1, item.height || 1)) {
        console.warn(`❌ Position ${position.x},${position.y} is not available`);
        return false;
      }

      // Place item in inventory grid
      this.placeItemInGrid(item, position);

      // Emit event
      this.emitItemAdded(item, position);

      console.log(`✅ Item ${item.id} added to inventory at position ${position.x},${position.y}`);
      return true;
    } catch (error) {
      console.error('❌ Error in addItem:', error);
      throw error;
    }
  }

  /**
   * Remove item from inventory by ID
   */
  async removeItem(itemId: string): Promise<boolean> {
    try {
      this.validateInput(itemId, 'itemId');

      const slot = this.findItemSlot(itemId);
      if (!slot) {
        console.warn(`❌ Item ${itemId} not found in inventory`);
        return false;
      }

      // Remove from grid
      this.removeItemFromGrid(itemId);

      // Emit event
      this.emitItemRemoved(itemId);

      console.log(`✅ Item ${itemId} removed from inventory`);
      return true;
    } catch (error) {
      console.error('❌ Error in removeItem:', error);
      throw error;
    }
  }

  /**
   * Get current inventory state
   */
  getInventoryState(): InventorySystemTypes.InventoryState {
    return {
      grid: Array.from(this.inventoryGrid.values()),
      equippedItems: Object.fromEntries(this.equippedItems),
      totalSlots: 60, // Standard PoE inventory size
      usedSlots: this.inventoryGrid.size,
      availableSlots: 60 - this.inventoryGrid.size
    };
  }

  /**
   * Equip item to equipment slot
   */
  async equipItem(itemId: string, slot: InventorySystemTypes.EquipmentSlotType): Promise<boolean> {
    try {
      this.validateInput(itemId, 'itemId');
      this.validateInput(slot, 'slot');

      const item = this.findItem(itemId);
      if (!item) {
        console.warn(`❌ Item ${itemId} not found`);
        return false;
      }

      // Check if item can be equipped in this slot
      if (!this.canEquipToSlot(item, slot)) {
        console.warn(`❌ Item ${itemId} cannot be equipped to ${slot} slot`);
        return false;
      }

      // Unequip existing item if any
      if (this.equippedItems.has(slot)) {
        await this.unequipItem(slot);
      }

      // Remove from inventory
      await this.removeItem(itemId);

      // Equip item
      this.equippedItems.set(slot, item);

      // Emit event
      this.emitItemEquipped(item, slot);

      console.log(`✅ Item ${itemId} equipped to ${slot} slot`);
      return true;
    } catch (error) {
      console.error('❌ Error in equipItem:', error);
      throw error;
    }
  }

  /**
   * Unequip item from equipment slot
   */
  async unequipItem(slot: InventorySystemTypes.EquipmentSlotType): Promise<boolean> {
    try {
      this.validateInput(slot, 'slot');

      const item = this.equippedItems.get(slot);
      if (!item) {
        console.warn(`❌ No item equipped in ${slot} slot`);
        return false;
      }

      // Remove from equipment
      this.equippedItems.delete(slot);

      // Try to add back to inventory
      const added = await this.addItem(item);
      if (!added) {
        // If can't add to inventory, re-equip
        this.equippedItems.set(slot, item);
        console.warn(`❌ Cannot unequip ${item.id} - inventory is full`);
        return false;
      }

      // Emit event
      this.emitItemUnequipped(item, slot);

      console.log(`✅ Item ${item.id} unequipped from ${slot} slot`);
      return true;
    } catch (error) {
      console.error('❌ Error in unequipItem:', error);
      throw error;
    }
  }

  /**
   * Move item to new position in inventory
   */
  async moveItem(itemId: string, newPosition: InventorySystemTypes.GridPosition): Promise<boolean> {
    try {
      this.validateInput(itemId, 'itemId');
      this.validateInput(newPosition, 'newPosition');

      const currentSlot = this.findItemSlot(itemId);
      if (!currentSlot) {
        console.warn(`❌ Item ${itemId} not found in inventory`);
        return false;
      }

      const item = currentSlot.item;
      
      // Check if new position is available (excluding current item)
      this.removeItemFromGrid(itemId);
      const isAvailable = this.isPositionAvailable(newPosition, item.width || 1, item.height || 1);
      
      if (!isAvailable) {
        // Restore item to original position
        this.placeItemInGrid(item, currentSlot.position);
        console.warn(`❌ Position ${newPosition.x},${newPosition.y} is not available`);
        return false;
      }

      // Place item at new position
      this.placeItemInGrid(item, newPosition);

      // Emit event
      this.emitItemMoved(item, currentSlot.position, newPosition);

      console.log(`✅ Item ${itemId} moved to position ${newPosition.x},${newPosition.y}`);
      return true;
    } catch (error) {
      console.error('❌ Error in moveItem:', error);
      throw error;
    }
  }

  // === HELPER METHODS ===

  private initializeInventory(): void {
    console.log('🔧 Initializing inventory system');
    // Initialize empty 12x5 grid (60 slots total)
    for (let x = 0; x < 12; x++) {
      for (let y = 0; y < 5; y++) {
        const key = `${x},${y}`;
        this.inventoryGrid.set(key, {
          position: { x, y },
          item: null,
          occupied: false
        });
      }
    }
  }

  private findAvailablePosition(width: number, height: number): InventorySystemTypes.GridPosition | null {
    for (let x = 0; x <= 12 - width; x++) {
      for (let y = 0; y <= 5 - height; y++) {
        if (this.isPositionAvailable({ x, y }, width, height)) {
          return { x, y };
        }
      }
    }
    return null;
  }

  private isPositionAvailable(position: InventorySystemTypes.GridPosition, width: number, height: number): boolean {
    for (let x = position.x; x < position.x + width; x++) {
      for (let y = position.y; y < position.y + height; y++) {
        const key = `${x},${y}`;
        const slot = this.inventoryGrid.get(key);
        if (!slot || slot.occupied) {
          return false;
        }
      }
    }
    return true;
  }

  private placeItemInGrid(item: InventorySystemTypes.ItemData, position: InventorySystemTypes.GridPosition): void {
    const width = item.width || 1;
    const height = item.height || 1;

    for (let x = position.x; x < position.x + width; x++) {
      for (let y = position.y; y < position.y + height; y++) {
        const key = `${x},${y}`;
        const slot = this.inventoryGrid.get(key);
        if (slot) {
          slot.item = (x === position.x && y === position.y) ? item : null; // Only store item in top-left slot
          slot.occupied = true;
        }
      }
    }
  }

  private removeItemFromGrid(itemId: string): void {
    for (const [key, slot] of this.inventoryGrid) {
      if (slot.item?.id === itemId) {
        const item = slot.item;
        const width = item.width || 1;
        const height = item.height || 1;

        // Clear all occupied slots for this item
        for (let x = slot.position.x; x < slot.position.x + width; x++) {
          for (let y = slot.position.y; y < slot.position.y + height; y++) {
            const clearKey = `${x},${y}`;
            const clearSlot = this.inventoryGrid.get(clearKey);
            if (clearSlot) {
              clearSlot.item = null;
              clearSlot.occupied = false;
            }
          }
        }
        break;
      }
    }
  }

  private findItemSlot(itemId: string): InventorySystemTypes.InventorySlot | null {
    for (const slot of this.inventoryGrid.values()) {
      if (slot.item?.id === itemId) {
        return slot;
      }
    }
    return null;
  }

  private findItem(itemId: string): InventorySystemTypes.ItemData | null {
    const slot = this.findItemSlot(itemId);
    return slot?.item || null;
  }

  private canEquipToSlot(item: InventorySystemTypes.ItemData, slot: InventorySystemTypes.EquipmentSlotType): boolean {
    // Basic slot compatibility check
    const slotMapping: Record<string, InventorySystemTypes.EquipmentSlotType[]> = {
      'weapon': ['mainHand', 'offHand'],
      'armor': ['chest', 'helmet', 'gloves', 'boots'],
      'ring': ['ring1', 'ring2'],
      'amulet': ['amulet'],
      'belt': ['belt']
    };

    const validSlots = slotMapping[item.type] || [];
    return validSlots.includes(slot);
  }

  // === EVENT EMITTERS ===

  private emitItemAdded(item: InventorySystemTypes.ItemData, position: InventorySystemTypes.GridPosition): void {
    const events = (this.pod as any).events as InventorySystemEvents;
    events.emitInventoryItemAdded({ item, position, timestamp: Date.now() });
  }

  private emitItemRemoved(itemId: string): void {
    const events = (this.pod as any).events as InventorySystemEvents;
    events.emitInventoryItemRemoved({ itemId, timestamp: Date.now() });
  }

  private emitItemMoved(item: InventorySystemTypes.ItemData, oldPosition: InventorySystemTypes.GridPosition, newPosition: InventorySystemTypes.GridPosition): void {
    const events = (this.pod as any).events as InventorySystemEvents;
    events.emitInventoryItemMoved({ item, oldPosition, newPosition, timestamp: Date.now() });
  }

  private emitItemEquipped(item: InventorySystemTypes.ItemData, slot: InventorySystemTypes.EquipmentSlotType): void {
    const events = (this.pod as any).events as InventorySystemEvents;
    events.emitInventoryItemEquipped({ item, slot, timestamp: Date.now() });
  }

  private emitItemUnequipped(item: InventorySystemTypes.ItemData, slot: InventorySystemTypes.EquipmentSlotType): void {
    const events = (this.pod as any).events as InventorySystemEvents;
    events.emitInventoryItemUnequipped({ item, slot, timestamp: Date.now() });
  }

  private emitInventoryFull(): void {
    const events = (this.pod as any).events as InventorySystemEvents;
    events.emitInventoryFull({ timestamp: Date.now() });
  }

  // === UTILITY METHODS ===

  getInventorySlotCount(): number {
    return this.inventoryGrid.size;
  }

  getEquippedItemCount(): number {
    return this.equippedItems.size;
  }

  clearCache(): void {
    // Clear any cached data
    console.log('🧹 Clearing inventory system cache');
  }

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
  module.exports = { InventorySystemAPI };
}