// Path of Exile style inventory management - Event Handling
// Auto-generated event handlers for conflict-free parallel development

import { FeaturePod } from '../../templates/feature-pod-template';
import { EventData } from '../../core/event-bus';
import { InventorySystemTypes } from './inventory-system.types';

export class InventorySystemEvents {
  private pod: FeaturePod;
  private listeners: Map<string, string> = new Map();

  constructor(pod: FeaturePod) {
    this.pod = pod;
  }

  // === EVENT SETUP ===

  setupHandlers(): void {
    // Listen to character.level.up
    this.pod['listenToEvent']('character.level.up', this.handleCharacterLevelUp.bind(this));
    
    // Listen to item.factory.created
    this.pod['listenToEvent']('item.factory.created', this.handleItemFactoryCreated.bind(this));
  }

  async cleanup(): Promise<void> {
    // Clean up event listeners
    for (const [eventName] of this.listeners) {
      this.pod['stopListening'](eventName);
    }
    this.listeners.clear();
  }

  // === EVENT EMITTERS ===

  /**
   * Emit Item was added to inventory
   */
  emitInventoryItemAdded(data: InventorySystemTypes.InventoryItemAddedData): void {
    this.pod['emitEvent']('inventory.item.added', {
      ...data,
      timestamp: Date.now(),
      source: 'inventory-system'
    });
  }

  /**
   * Emit Item was removed from inventory
   */
  emitInventoryItemRemoved(data: InventorySystemTypes.InventoryItemRemovedData): void {
    this.pod['emitEvent']('inventory.item.removed', {
      ...data,
      timestamp: Date.now(),
      source: 'inventory-system'
    });
  }

  /**
   * Emit Item was moved within inventory
   */
  emitInventoryItemMoved(data: InventorySystemTypes.InventoryItemMovedData): void {
    this.pod['emitEvent']('inventory.item.moved', {
      ...data,
      timestamp: Date.now(),
      source: 'inventory-system'
    });
  }

  /**
   * Emit Item was equipped
   */
  emitInventoryItemEquipped(data: InventorySystemTypes.InventoryItemEquippedData): void {
    this.pod['emitEvent']('inventory.item.equipped', {
      ...data,
      timestamp: Date.now(),
      source: 'inventory-system'
    });
  }

  /**
   * Emit Item was unequipped
   */
  emitInventoryItemUnequipped(data: InventorySystemTypes.InventoryItemUnequippedData): void {
    this.pod['emitEvent']('inventory.item.unequipped', {
      ...data,
      timestamp: Date.now(),
      source: 'inventory-system'
    });
  }

  /**
   * Emit Inventory is full
   */
  emitInventoryFull(data: InventorySystemTypes.InventoryFullData): void {
    this.pod['emitEvent']('inventory.full', {
      ...data,
      timestamp: Date.now(),
      source: 'inventory-system'
    });
  }

  // === EVENT HANDLERS ===

  /**
   * Handle Character leveled up
   */
  private async handleCharacterLevelUp(event: EventData): Promise<void> {
    try {
      console.log('📡 inventory-system received event character.level.up:', event.data);
      
      const levelUpData = event.data as InventorySystemTypes.CharacterLevelUpData;
      
      // TODO: Handle character level up - maybe expand inventory or update item requirements
      console.log(`🎉 Character leveled up from ${levelUpData.oldLevel} to ${levelUpData.newLevel}`);
      
      // Example: Check if any equipped items have level requirements that are now met
      await this.checkItemRequirements(levelUpData.newLevel);
      
    } catch (error) {
      console.error('❌ Error handling character.level.up:', error);
      throw error;
    }
  }

  /**
   * Handle New item was created
   */
  private async handleItemFactoryCreated(event: EventData): Promise<void> {
    try {
      console.log('📡 inventory-system received event item.factory.created:', event.data);
      
      const itemData = event.data as InventorySystemTypes.ItemFactoryCreatedData;
      
      // TODO: Auto-pickup or notify about new item creation
      console.log(`🆕 New item created: ${itemData.item.name} (${itemData.item.rarity})`);
      
      // Example: Try to auto-pickup the item if inventory has space
      await this.tryAutoPickup(itemData.item);
      
    } catch (error) {
      console.error('❌ Error handling item.factory.created:', error);
      throw error;
    }
  }

  // === HELPER METHODS ===

  private validateEventData(data: any, eventName: string): void {
    if (!data) {
      throw new Error(`Invalid event data for ${eventName}`);
    }
  }

  private createEventMetadata(additionalData: any = {}): any {
    return {
      feature: 'inventory-system',
      timestamp: Date.now(),
      ...additionalData
    };
  }

  private async checkItemRequirements(characterLevel: number): Promise<void> {
    try {
      // Get current inventory state
      const api = (this.pod as any).api;
      const inventoryState = api.getInventoryState();
      
      // Check equipped items for level requirements
      for (const [slot, item] of Object.entries(inventoryState.equippedItems)) {
        if (item && item.requirements) {
          const levelReq = item.requirements.find(req => req.type === 'level');
          if (levelReq && characterLevel >= levelReq.value) {
            console.log(`✅ Character can now use equipped ${item.name} in ${slot}`);
          }
        }
      }
      
      // Check inventory items
      for (const slot of inventoryState.grid) {
        if (slot.item && slot.item.requirements) {
          const levelReq = slot.item.requirements.find(req => req.type === 'level');
          if (levelReq && characterLevel >= levelReq.value) {
            console.log(`✅ Character can now use ${slot.item.name} from inventory`);
            // Emit notification event
            this.pod['emitEvent']('inventory.item.usable', {
              item: slot.item,
              characterLevel,
              timestamp: Date.now()
            });
          }
        }
      }
    } catch (error) {
      console.error('❌ Error checking item requirements:', error);
    }
  }

  private async tryAutoPickup(item: InventorySystemTypes.ItemData): Promise<void> {
    try {
      const api = (this.pod as any).api;
      const config = (this.pod as any).featureConfig;
      
      // Check if auto-pickup is enabled
      if (!config.get('autoPickup')) {
        return;
      }
      
      // Try to add item to inventory
      const success = await api.addItem(item);
      if (success) {
        console.log(`🎒 Auto-picked up: ${item.name}`);
        this.pod['emitEvent']('inventory.item.auto-picked', {
          item,
          timestamp: Date.now()
        });
      } else {
        console.warn(`⚠️ Could not auto-pickup ${item.name} - inventory full`);
        this.pod['emitEvent']('inventory.auto-pickup.failed', {
          item,
          reason: 'inventory_full',
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('❌ Error in auto-pickup:', error);
    }
  }
}

// Export for CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { InventorySystemEvents };
}