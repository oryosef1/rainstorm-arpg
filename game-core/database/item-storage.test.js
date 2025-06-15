import ItemStorageSystem from './item-storage';
import MCPSetupSystem from './mcp-setup';

describe('ItemStorageSystem', () => {
  let storageSystem;
  let mcpSystem;
  let mockEntity;

  beforeEach(() => {
    mcpSystem = new MCPSetupSystem();
    storageSystem = new ItemStorageSystem(mcpSystem);
    
    // Create mock entity
    mockEntity = {
      id: 'test_entity_1',
      hasComponents: jest.fn().mockReturnValue(true),
      getComponent: jest.fn(),
      addComponent: jest.fn(),
      removeComponent: jest.fn()
    };

    storageSystem.addEntity(mockEntity);
  });

  afterEach(() => {
    storageSystem.cleanup();
  });

  describe('System Initialization', () => {
    test('should initialize correctly', () => {
      expect(storageSystem.name).toBe('ItemStorageSystem');
      expect(storageSystem.enabled).toBe(true);
      expect(storageSystem.priority).toBe(10);
      
      const metrics = storageSystem.getMetrics();
      expect(metrics.name).toBe('ItemStorageSystem');
      expect(metrics.entityCount).toBe(1);
    });

    test('should handle system lifecycle', () => {
      expect(() => {
        storageSystem.update(16.67); // 60 FPS
      }).not.toThrow();
    });
  });

  describe('Item Management', () => {
    test('should create items correctly', async () => {
      let itemCreated = false;
      
      storageSystem.on('itemCreated', (data) => {
        itemCreated = true;
        expect(data.item).toBeDefined();
        expect(data.item.name).toBe('Test Sword');
        expect(data.item.rarity).toBe('rare');
      });

      const itemId = await storageSystem.createItem({
        name: 'Test Sword',
        baseType: 'One Hand Sword',
        rarity: 'rare',
        itemLevel: 50,
        quality: 20
      });

      expect(itemId).toBeTruthy();
      expect(itemCreated).toBe(true);

      const item = storageSystem.getItem(itemId);
      expect(item).toBeTruthy();
      expect(item.name).toBe('Test Sword');
      expect(item.rarity).toBe('rare');
    });

    test('should update items correctly', async () => {
      const itemId = await storageSystem.createItem({
        name: 'Test Item',
        baseType: 'Test Base',
        value: 100
      });

      let itemUpdated = false;
      storageSystem.on('itemUpdated', (data) => {
        itemUpdated = true;
        expect(data.itemId).toBe(itemId);
        expect(data.updates.value).toBe(200);
      });

      const result = await storageSystem.updateItem(itemId, {
        value: 200,
        quality: 15
      });

      expect(result).toBe(true);
      expect(itemUpdated).toBe(true);

      const item = storageSystem.getItem(itemId);
      expect(item.value).toBe(200);
      expect(item.quality).toBe(15);
    });

    test('should delete items correctly', async () => {
      const itemId = await storageSystem.createItem({
        name: 'Delete Me',
        baseType: 'Test Base'
      });

      let itemDeleted = false;
      storageSystem.on('itemDeleted', (data) => {
        itemDeleted = true;
        expect(data.itemId).toBe(itemId);
      });

      const result = await storageSystem.deleteItem(itemId);
      expect(result).toBe(true);
      expect(itemDeleted).toBe(true);

      const item = storageSystem.getItem(itemId);
      expect(item).toBeNull();
    });

    test('should handle invalid item operations', async () => {
      // Test getting non-existent item
      const item = storageSystem.getItem('invalid_id');
      expect(item).toBeNull();

      // Test updating non-existent item
      const updateResult = await storageSystem.updateItem('invalid_id', { value: 100 });
      expect(updateResult).toBe(false);

      // Test deleting non-existent item
      const deleteResult = await storageSystem.deleteItem('invalid_id');
      expect(deleteResult).toBe(false);
    });
  });

  describe('Inventory Grid Management', () => {
    test('should create inventory grids', async () => {
      let gridCreated = false;
      
      storageSystem.on('gridCreated', (data) => {
        gridCreated = true;
        expect(data.grid.name).toBe('Test Inventory');
        expect(data.grid.width).toBe(10);
        expect(data.grid.height).toBe(8);
      });

      const gridId = await storageSystem.createInventoryGrid('character_1', {
        name: 'Test Inventory',
        type: 'inventory',
        width: 10,
        height: 8
      });

      expect(gridId).toBeTruthy();
      expect(gridCreated).toBe(true);

      const grids = storageSystem.getInventoryGrids('character_1');
      expect(grids.length).toBe(1);
      expect(grids[0].name).toBe('Test Inventory');
    });

    test('should create stash tabs', async () => {
      let stashCreated = false;
      
      storageSystem.on('stashTabCreated', (data) => {
        stashCreated = true;
        expect(data.stashTab.name).toBe('Premium Stash');
        expect(data.stashTab.currencyTab).toBe(true);
      });

      const stashId = await storageSystem.createStashTab('character_1', {
        name: 'Premium Stash',
        type: 'stash',
        currencyTab: true,
        purchased: true
      });

      expect(stashId).toBeTruthy();
      expect(stashCreated).toBe(true);

      const stashTabs = storageSystem.getStashTabs('character_1');
      expect(stashTabs.length).toBe(1);
      expect(stashTabs[0].currencyTab).toBe(true);
    });

    test('should handle grid slots correctly', async () => {
      const gridId = await storageSystem.createInventoryGrid('character_1', {
        width: 5,
        height: 3
      });

      const grids = storageSystem.getInventoryGrids('character_1');
      const grid = grids[0];

      expect(grid.items.length).toBe(15); // 5 * 3
      
      // All slots should be empty initially
      grid.items.forEach(slot => {
        expect(slot.item).toBeNull();
        expect(slot.reserved).toBe(false);
      });
    });
  });

  describe('Item Movement and Placement', () => {
    test('should auto-place items', async () => {
      // Create inventory grid
      const gridId = await storageSystem.createInventoryGrid('character_1', {
        width: 5,
        height: 5
      });

      // Create item
      const itemId = await storageSystem.createItem({
        name: 'Test Item',
        width: 1,
        height: 1,
        stackSize: 1
      });

      // Auto-place item
      const location = await storageSystem.autoPlaceItem(itemId, gridId);
      
      expect(location).toBeTruthy();
      expect(location.containerId).toBe(gridId);
      expect(location.x).toBe(0);
      expect(location.y).toBe(0);
    });

    test('should handle item movement', async () => {
      // Create two grids
      const grid1Id = await storageSystem.createInventoryGrid('character_1', {
        name: 'Grid 1',
        width: 5,
        height: 5
      });
      
      const grid2Id = await storageSystem.createInventoryGrid('character_1', {
        name: 'Grid 2',
        width: 5,
        height: 5
      });

      // Create item
      const itemId = await storageSystem.createItem({
        name: 'Moveable Item',
        width: 1,
        height: 1
      });

      let itemMoved = false;
      storageSystem.on('itemMoved', (data) => {
        itemMoved = true;
        expect(data.itemId).toBe(itemId);
      });

      const fromLocation = {
        type: 'inventory',
        containerId: grid1Id,
        x: 0,
        y: 0
      };

      const toLocation = {
        type: 'inventory',
        containerId: grid2Id,
        x: 1,
        y: 1
      };

      const result = await storageSystem.moveItem(itemId, fromLocation, toLocation, 1);
      expect(result).toBe(true);
      expect(itemMoved).toBe(true);
    });
  });

  describe('Search and Filtering', () => {
    beforeEach(async () => {
      // Create test items
      await storageSystem.createItem({
        name: 'Iron Sword',
        baseType: 'One Hand Sword',
        rarity: 'normal',
        itemLevel: 10
      });

      await storageSystem.createItem({
        name: 'Steel Armor',
        baseType: 'Body Armor',
        rarity: 'magic',
        itemLevel: 20
      });

      await storageSystem.createItem({
        name: 'Magic Wand',
        baseType: 'Wand',
        rarity: 'rare',
        itemLevel: 30,
        corrupted: true
      });
    });

    test('should search items by name', () => {
      const results = storageSystem.searchByName('sword');
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Iron Sword');
    });

    test('should search items by type', () => {
      const results = storageSystem.searchByType('One Hand Sword');
      expect(results.length).toBe(1);
      expect(results[0].baseType).toBe('One Hand Sword');
    });

    test('should filter items with complex filters', () => {
      const filter = {
        rarity: ['magic', 'rare'],
        minLevel: 15,
        maxLevel: 35
      };

      const results = storageSystem.searchItems('character_1', filter);
      expect(results.length).toBe(2); // Steel Armor and Magic Wand
    });

    test('should filter corrupted items', () => {
      const filter = {
        corrupted: true
      };

      const results = storageSystem.searchItems('character_1', filter);
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Magic Wand');
    });
  });

  describe('Currency Management', () => {
    test('should add currency correctly', () => {
      let currencyAdded = false;
      
      storageSystem.on('currencyAdded', (data) => {
        currencyAdded = true;
        expect(data.characterId).toBe('character_1');
        expect(data.currencyType).toBe('chaos_orb');
        expect(data.amount).toBe(10);
      });

      const result = storageSystem.addCurrency('character_1', 'chaos_orb', 10);
      expect(result).toBe(true);
      expect(currencyAdded).toBe(true);

      const amount = storageSystem.getCurrencyAmount('character_1', 'chaos_orb');
      expect(amount).toBe(10);
    });

    test('should remove currency correctly', () => {
      // Add currency first
      storageSystem.addCurrency('character_1', 'exalted_orb', 5);

      let currencyRemoved = false;
      storageSystem.on('currencyRemoved', (data) => {
        currencyRemoved = true;
        expect(data.characterId).toBe('character_1');
        expect(data.currencyType).toBe('exalted_orb');
        expect(data.amount).toBe(2);
      });

      const result = storageSystem.removeCurrency('character_1', 'exalted_orb', 2);
      expect(result).toBe(true);
      expect(currencyRemoved).toBe(true);

      const amount = storageSystem.getCurrencyAmount('character_1', 'exalted_orb');
      expect(amount).toBe(3);
    });

    test('should handle insufficient currency', () => {
      storageSystem.addCurrency('character_1', 'divine_orb', 2);

      const result = storageSystem.removeCurrency('character_1', 'divine_orb', 5);
      expect(result).toBe(false);

      const amount = storageSystem.getCurrencyAmount('character_1', 'divine_orb');
      expect(amount).toBe(2); // Should remain unchanged
    });

    test('should stack currency of same type', () => {
      storageSystem.addCurrency('character_1', 'chromatic_orb', 5);
      storageSystem.addCurrency('character_1', 'chromatic_orb', 3);

      const amount = storageSystem.getCurrencyAmount('character_1', 'chromatic_orb');
      expect(amount).toBe(8);
    });
  });

  describe('Storage Statistics', () => {
    beforeEach(async () => {
      // Create diverse items for statistics
      await storageSystem.createItem({
        name: 'Common Item',
        rarity: 'normal',
        itemLevel: 10,
        value: 5,
        sockets: [{ id: '1', colour: 'red', linkedTo: [] }]
      });

      await storageSystem.createItem({
        name: 'Rare Item',
        rarity: 'rare',
        itemLevel: 50,
        value: 100,
        corrupted: true,
        sockets: [
          { id: '1', colour: 'red', linkedTo: ['2'] },
          { id: '2', colour: 'green', linkedTo: ['1'] }
        ],
        links: [2]
      });

      await storageSystem.createItem({
        name: 'Unique Item',
        rarity: 'unique',
        itemLevel: 70,
        value: 500,
        sockets: [
          { id: '1', colour: 'blue', linkedTo: ['2', '3'] },
          { id: '2', colour: 'white', linkedTo: ['1', '3'] },
          { id: '3', colour: 'red', linkedTo: ['1', '2'] }
        ],
        links: [3]
      });
    });

    test('should provide accurate storage statistics', () => {
      const stats = storageSystem.getStorageStatistics('character_1');
      
      expect(stats.totalItems).toBe(3);
      expect(stats.rareItems).toBe(1);
      expect(stats.uniqueItems).toBe(1);
      expect(stats.corruptedItems).toBe(1);
      expect(stats.totalValue).toBe(605); // 5 + 100 + 500
      expect(stats.averageItemLevel).toBe(43.33); // (10 + 50 + 70) / 3
    });

    test('should calculate socket and link distributions', () => {
      const stats = storageSystem.getStorageStatistics('character_1');
      
      expect(stats.socketsDistribution[1]).toBe(1); // Common item
      expect(stats.socketsDistribution[2]).toBe(1); // Rare item
      expect(stats.socketsDistribution[3]).toBe(1); // Unique item
      
      expect(stats.linksDistribution[2]).toBe(1); // Rare item
      expect(stats.linksDistribution[3]).toBe(1); // Unique item
    });

    test('should provide optimization recommendations', () => {
      const optimization = storageSystem.getStorageOptimization('character_1');
      
      expect(optimization).toBeDefined();
      expect(optimization.efficiency).toBeGreaterThanOrEqual(0);
      expect(optimization.recommendations).toBeInstanceOf(Array);
      expect(optimization.valuableItems).toBeInstanceOf(Array);
      
      // Should identify valuable items
      const valuableItems = optimization.valuableItems;
      expect(valuableItems.some(item => item.value >= 100)).toBe(true);
    });
  });

  describe('Advanced Features', () => {
    test('should handle item stacking suggestions', async () => {
      // Create stackable items
      await storageSystem.createItem({
        name: 'Currency Item',
        baseType: 'Orb',
        stackSize: 5,
        maxStackSize: 10
      });

      await storageSystem.createItem({
        name: 'Currency Item',
        baseType: 'Orb',
        stackSize: 3,
        maxStackSize: 10
      });

      const optimization = storageSystem.getStorageOptimization('character_1');
      const consolidationRec = optimization.recommendations.find(r => r.type === 'consolidate');
      
      expect(consolidationRec).toBeDefined();
      expect(consolidationRec.description).toContain('stackable');
    });

    test('should track transaction history', async () => {
      const gridId = await storageSystem.createInventoryGrid('character_1', {
        width: 5,
        height: 5
      });

      const itemId = await storageSystem.createItem({
        name: 'Tracked Item',
        width: 1,
        height: 1
      });

      const fromLocation = {
        type: 'inventory',
        containerId: gridId,
        x: 0,
        y: 0
      };

      const toLocation = {
        type: 'inventory',
        containerId: gridId,
        x: 1,
        y: 1
      };

      await storageSystem.moveItem(itemId, fromLocation, toLocation, 1);

      const history = storageSystem.getTransactionHistory('character_1');
      expect(history.length).toBeGreaterThan(0);
      
      const transaction = history[0];
      expect(transaction.type).toBe('move');
      expect(transaction.itemId).toBe(itemId);
    });

    test('should handle specialized stash tabs', async () => {
      const currencyTabId = await storageSystem.createStashTab('character_1', {
        name: 'Currency Tab',
        currencyTab: true,
        specialFeatures: ['auto_sort', 'stack_currency']
      });

      const mapTabId = await storageSystem.createStashTab('character_1', {
        name: 'Map Tab',
        mapTab: true,
        specialFeatures: ['series_completion', 'bonus_tracking']
      });

      const stashTabs = storageSystem.getStashTabs('character_1');
      expect(stashTabs.length).toBe(2);
      
      const currencyTab = stashTabs.find(tab => tab.currencyTab);
      const mapTab = stashTabs.find(tab => tab.mapTab);
      
      expect(currencyTab).toBeDefined();
      expect(mapTab).toBeDefined();
      expect(currencyTab.specialFeatures).toContain('auto_sort');
      expect(mapTab.specialFeatures).toContain('series_completion');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid character IDs gracefully', () => {
      const grids = storageSystem.getInventoryGrids('invalid_character');
      expect(grids).toEqual([]);

      const stashTabs = storageSystem.getStashTabs('invalid_character');
      expect(stashTabs).toEqual([]);

      const stats = storageSystem.getStorageStatistics('invalid_character');
      expect(stats.totalItems).toBe(0);
    });

    test('should handle invalid currency operations gracefully', () => {
      const amount = storageSystem.getCurrencyAmount('invalid_character', 'chaos_orb');
      expect(amount).toBe(0);

      const removeResult = storageSystem.removeCurrency('invalid_character', 'chaos_orb', 5);
      expect(removeResult).toBe(false);
    });

    test('should handle invalid item placements gracefully', async () => {
      const itemId = await storageSystem.createItem({
        name: 'Large Item',
        width: 10,
        height: 10
      });

      const gridId = await storageSystem.createInventoryGrid('character_1', {
        width: 5,
        height: 5
      });

      const location = await storageSystem.autoPlaceItem(itemId, gridId);
      expect(location).toBeNull(); // Should not fit
    });

    test('should handle database errors gracefully', async () => {
      // Mock database error
      const originalExecuteQuery = storageSystem.mcpSystem.executeQuery;
      storageSystem.mcpSystem.executeQuery = jest.fn().mockRejectedValue(new Error('Database error'));

      // Should not throw error
      await expect(storageSystem.createItem({
        name: 'Error Item'
      })).resolves.toBeTruthy();

      // Restore original method
      storageSystem.mcpSystem.executeQuery = originalExecuteQuery;
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle large numbers of items efficiently', async () => {
      const startTime = Date.now();
      
      // Create many items
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(storageSystem.createItem({
          name: `Item ${i}`,
          baseType: 'Test Type',
          value: i
        }));
      }
      
      await Promise.all(promises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (2 seconds)
      expect(duration).toBeLessThan(2000);
      
      // Search should still be fast
      const searchStart = Date.now();
      const results = storageSystem.searchByName('Item');
      const searchEnd = Date.now();
      
      expect(results.length).toBe(100);
      expect(searchEnd - searchStart).toBeLessThan(100); // 100ms
    });

    test('should handle system updates without errors', () => {
      // Create some items and grids
      storageSystem.createItem({ name: 'Test Item' });
      storageSystem.createInventoryGrid('character_1', { width: 5, height: 5 });
      
      expect(() => {
        for (let i = 0; i < 100; i++) {
          storageSystem.update(16.67); // Simulate 100 frames
        }
      }).not.toThrow();
    });

    test('should cleanup properly', () => {
      // Add some data
      storageSystem.createItem({ name: 'Cleanup Test' });
      storageSystem.addCurrency('character_1', 'chaos_orb', 10);
      
      // Cleanup
      storageSystem.cleanup();
      
      // Verify everything is cleaned up
      const item = storageSystem.getItem('any_id');
      expect(item).toBeNull();
      
      const grids = storageSystem.getInventoryGrids('character_1');
      expect(grids).toEqual([]);
      
      const amount = storageSystem.getCurrencyAmount('character_1', 'chaos_orb');
      expect(amount).toBe(0);
    });
  });
});