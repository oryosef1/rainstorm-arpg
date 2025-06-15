// Script to create inventory system feature pod
import { FeatureGenerator, FeatureSpec } from './tools/feature-generator';

async function createInventoryFeature() {
  const generator = new FeatureGenerator({
    featuresDirectory: './features',
    enableNpmInit: true,
    enableGitInit: false,
    includeExamples: true
  });

  const spec: FeatureSpec = {
    name: 'inventory-system',
    description: 'Path of Exile style inventory management with grid-based layout and socket support',
    category: 'game',
    version: '1.0.0',
    author: 'AI Agent',
    dependencies: [],
    apis: [
      {
        name: 'addItem',
        description: 'Add item to inventory with automatic positioning',
        parameters: [
          { name: 'item', type: 'ItemData', required: true, description: 'Item to add to inventory' },
          { name: 'position', type: 'GridPosition', required: false, description: 'Specific position to place item' }
        ],
        returnType: 'Promise<boolean>',
        async: true
      },
      {
        name: 'removeItem',
        description: 'Remove item from inventory by ID',
        parameters: [
          { name: 'itemId', type: 'string', required: true, description: 'ID of item to remove' }
        ],
        returnType: 'Promise<boolean>',
        async: true
      },
      {
        name: 'getInventoryState',
        description: 'Get current inventory state',
        parameters: [],
        returnType: 'InventoryState',
        async: false
      },
      {
        name: 'equipItem',
        description: 'Equip item to equipment slot',
        parameters: [
          { name: 'itemId', type: 'string', required: true, description: 'ID of item to equip' },
          { name: 'slot', type: 'EquipmentSlot', required: true, description: 'Equipment slot to equip to' }
        ],
        returnType: 'Promise<boolean>',
        async: true
      },
      {
        name: 'unequipItem',
        description: 'Unequip item from equipment slot',
        parameters: [
          { name: 'slot', type: 'EquipmentSlot', required: true, description: 'Equipment slot to unequip from' }
        ],
        returnType: 'Promise<boolean>',
        async: true
      },
      {
        name: 'moveItem',
        description: 'Move item to new position in inventory',
        parameters: [
          { name: 'itemId', type: 'string', required: true, description: 'ID of item to move' },
          { name: 'newPosition', type: 'GridPosition', required: true, description: 'New position for item' }
        ],
        returnType: 'Promise<boolean>',
        async: true
      }
    ],
    events: [
      { name: 'inventory.item.added', description: 'Item was added to inventory', listen: false },
      { name: 'inventory.item.removed', description: 'Item was removed from inventory', listen: false },
      { name: 'inventory.item.moved', description: 'Item was moved within inventory', listen: false },
      { name: 'inventory.item.equipped', description: 'Item was equipped', listen: false },
      { name: 'inventory.item.unequipped', description: 'Item was unequipped', listen: false },
      { name: 'inventory.full', description: 'Inventory is full', listen: false },
      { name: 'character.level.up', description: 'Character leveled up', listen: true },
      { name: 'item.factory.created', description: 'New item was created', listen: true }
    ],
    includeTests: true,
    includeConfig: true,
    includeReadme: true
  };

  const result = await generator.generateFeature(spec);
  
  if (result.success) {
    console.log('✅ Inventory System feature pod created successfully!');
    console.log(`📁 Location: ${result.featurePath}`);
  } else {
    console.error('❌ Failed to create feature:', result.error);
  }
}

createInventoryFeature().catch(console.error);