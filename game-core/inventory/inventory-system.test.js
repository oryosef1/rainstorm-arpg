// inventory-system.test.js - Grid-Based Inventory System Tests
const { InventorySystem, InventoryComponent } = require('./inventory-system');
const { ItemFactory } = require('./item-factory');
const { Entity } = require('../ecs/ecs-core');

describe('Grid-Based Inventory System', () => {
    let inventorySystem;
    let itemFactory;
    let playerEntity;

    beforeEach(() => {
        inventorySystem = new InventorySystem();
        itemFactory = new ItemFactory();
        playerEntity = new Entity();
    });

    describe('Inventory Grid Creation', () => {
        test('should create standard inventory grid (12x5)', () => {
            const inventory = inventorySystem.createInventory(playerEntity, 12, 5);
            expect(inventory.width).toBe(12);
            expect(inventory.height).toBe(5);
            expect(inventory.slots.length).toBe(5);
            expect(inventory.slots[0].length).toBe(12);
        });

        test('should initialize all slots as empty', () => {
            const inventory = inventorySystem.createInventory(playerEntity, 12, 5);
            for (let y = 0; y < inventory.height; y++) {
                for (let x = 0; x < inventory.width; x++) {
                    expect(inventory.slots[y][x]).toBeNull();
                }
            }
        });

        test('should attach inventory component to entity', () => {
            inventorySystem.createInventory(playerEntity, 12, 5);
            expect(playerEntity.hasComponent('InventoryComponent')).toBe(true);
        });
    });

    describe('Item Placement', () => {
        test('should place 1x1 item in inventory', () => {
            const inventory = inventorySystem.createInventory(playerEntity, 12, 5);
            const item = itemFactory.createItem({
                name: 'Orb of Alchemy',
                width: 1,
                height: 1,
                type: 'currency'
            });

            const placed = inventorySystem.placeItem(inventory, item, 0, 0);
            expect(placed).toBe(true);
            expect(inventory.slots[0][0]).toBe(item.id);
            expect(inventory.items[item.id]).toBe(item);
        });

        test('should place 2x3 item in inventory', () => {
            const inventory = inventorySystem.createInventory(playerEntity, 12, 5);
            const item = itemFactory.createItem({
                name: 'Two-Handed Sword',
                width: 2,
                height: 3,
                type: 'weapon'
            });

            const placed = inventorySystem.placeItem(inventory, item, 0, 0);
            expect(placed).toBe(true);
            
            // Check all occupied slots
            for (let y = 0; y < 3; y++) {
                for (let x = 0; x < 2; x++) {
                    expect(inventory.slots[y][x]).toBe(item.id);
                }
            }
        });

        test('should not place item out of bounds', () => {
            const inventory = inventorySystem.createInventory(playerEntity, 12, 5);
            const item = itemFactory.createItem({
                name: 'Large Shield',
                width: 3,
                height: 3,
                type: 'armor'
            });

            const placed = inventorySystem.placeItem(inventory, item, 10, 3);
            expect(placed).toBe(false);
            expect(inventory.items[item.id]).toBeUndefined();
        });

        test('should not place item on occupied slots', () => {
            const inventory = inventorySystem.createInventory(playerEntity, 12, 5);
            const item1 = itemFactory.createItem({
                name: 'Ring',
                width: 1,
                height: 1,
                type: 'accessory'
            });
            const item2 = itemFactory.createItem({
                name: 'Amulet',
                width: 1,
                height: 1,
                type: 'accessory'
            });

            inventorySystem.placeItem(inventory, item1, 5, 2);
            const placed = inventorySystem.placeItem(inventory, item2, 5, 2);
            
            expect(placed).toBe(false);
            expect(inventory.slots[2][5]).toBe(item1.id);
        });

        test('should auto-place item in first available slot', () => {
            const inventory = inventorySystem.createInventory(playerEntity, 12, 5);
            const item = itemFactory.createItem({
                name: 'Health Potion',
                width: 1,
                height: 2,
                type: 'flask'
            });

            const placed = inventorySystem.autoPlaceItem(inventory, item);
            expect(placed).toBe(true);
            expect(inventory.slots[0][0]).toBe(item.id);
            expect(inventory.slots[1][0]).toBe(item.id);
        });
    });

    describe('Item Removal', () => {
        test('should remove item from inventory', () => {
            const inventory = inventorySystem.createInventory(playerEntity, 12, 5);
            const item = itemFactory.createItem({
                name: 'Scroll of Wisdom',
                width: 1,
                height: 1,
                type: 'currency'
            });

            inventorySystem.placeItem(inventory, item, 3, 2);
            const removed = inventorySystem.removeItem(inventory, item.id);
            
            expect(removed).toBe(item);
            expect(inventory.slots[2][3]).toBeNull();
            expect(inventory.items[item.id]).toBeUndefined();
        });

        test('should clear all slots occupied by multi-slot item', () => {
            const inventory = inventorySystem.createInventory(playerEntity, 12, 5);
            const item = itemFactory.createItem({
                name: 'Body Armor',
                width: 2,
                height: 3,
                type: 'armor'
            });

            inventorySystem.placeItem(inventory, item, 5, 1);
            inventorySystem.removeItem(inventory, item.id);
            
            for (let y = 1; y < 4; y++) {
                for (let x = 5; x < 7; x++) {
                    expect(inventory.slots[y][x]).toBeNull();
                }
            }
        });
    });

    describe('Item Movement', () => {
        test('should move item to new position', () => {
            const inventory = inventorySystem.createInventory(playerEntity, 12, 5);
            const item = itemFactory.createItem({
                name: 'Gem',
                width: 1,
                height: 1,
                type: 'gem'
            });

            inventorySystem.placeItem(inventory, item, 0, 0);
            const moved = inventorySystem.moveItem(inventory, item.id, 5, 3);
            
            expect(moved).toBe(true);
            expect(inventory.slots[0][0]).toBeNull();
            expect(inventory.slots[3][5]).toBe(item.id);
        });

        test('should not move item to occupied position', () => {
            const inventory = inventorySystem.createInventory(playerEntity, 12, 5);
            const item1 = itemFactory.createItem({
                name: 'Wand',
                width: 1,
                height: 2,
                type: 'weapon'
            });
            const item2 = itemFactory.createItem({
                name: 'Shield',
                width: 2,
                height: 2,
                type: 'armor'
            });

            inventorySystem.placeItem(inventory, item1, 0, 0);
            inventorySystem.placeItem(inventory, item2, 3, 0);
            
            const moved = inventorySystem.moveItem(inventory, item1.id, 3, 0);
            expect(moved).toBe(false);
            expect(inventory.slots[0][0]).toBe(item1.id);
        });
    });

    describe('Stack Management', () => {
        test('should stack identical currency items', () => {
            const inventory = inventorySystem.createInventory(playerEntity, 12, 5);
            const orb1 = itemFactory.createItem({
                name: 'Orb of Alchemy',
                width: 1,
                height: 1,
                type: 'currency',
                stackable: true,
                stackSize: 1
            });
            const orb2 = itemFactory.createItem({
                name: 'Orb of Alchemy',
                width: 1,
                height: 1,
                type: 'currency',
                stackable: true,
                stackSize: 1
            });

            inventorySystem.placeItem(inventory, orb1, 0, 0);
            const stacked = inventorySystem.tryStackItem(inventory, orb2, 0, 0);
            
            expect(stacked).toBe(true);
            expect(inventory.items[orb1.id].stackSize).toBe(2);
            expect(inventory.items[orb2.id]).toBeUndefined();
        });

        test('should respect maximum stack size', () => {
            const inventory = inventorySystem.createInventory(playerEntity, 12, 5);
            const orb = itemFactory.createItem({
                name: 'Orb of Alchemy',
                width: 1,
                height: 1,
                type: 'currency',
                stackable: true,
                stackSize: 20,
                maxStackSize: 20
            });
            const newOrb = itemFactory.createItem({
                name: 'Orb of Alchemy',
                width: 1,
                height: 1,
                type: 'currency',
                stackable: true,
                stackSize: 5
            });

            inventorySystem.placeItem(inventory, orb, 0, 0);
            const stacked = inventorySystem.tryStackItem(inventory, newOrb, 0, 0);
            
            expect(stacked).toBe(false);
            expect(inventory.items[orb.id].stackSize).toBe(20);
        });
    });

    describe('Inventory Queries', () => {
        test('should find all items of specific type', () => {
            const inventory = inventorySystem.createInventory(playerEntity, 12, 5);
            const weapon1 = itemFactory.createItem({ name: 'Sword', type: 'weapon', width: 1, height: 3 });
            const weapon2 = itemFactory.createItem({ name: 'Axe', type: 'weapon', width: 2, height: 3 });
            const armor = itemFactory.createItem({ name: 'Helmet', type: 'armor', width: 2, height: 2 });

            inventorySystem.placeItem(inventory, weapon1, 0, 0);
            inventorySystem.placeItem(inventory, weapon2, 2, 0);
            inventorySystem.placeItem(inventory, armor, 5, 0);

            const weapons = inventorySystem.findItemsByType(inventory, 'weapon');
            expect(weapons.length).toBe(2);
            expect(weapons.map(w => w.name)).toContain('Sword');
            expect(weapons.map(w => w.name)).toContain('Axe');
        });

        test('should check if inventory has space for item', () => {
            const inventory = inventorySystem.createInventory(playerEntity, 4, 2);
            
            // Fill inventory partially
            for (let x = 0; x < 3; x++) {
                for (let y = 0; y < 2; y++) {
                    const item = itemFactory.createItem({
                        name: `Item ${x},${y}`,
                        width: 1,
                        height: 1,
                        type: 'misc'
                    });
                    inventorySystem.placeItem(inventory, item, x, y);
                }
            }

            const smallItem = itemFactory.createItem({ name: 'Small', width: 1, height: 1 });
            const largeItem = itemFactory.createItem({ name: 'Large', width: 2, height: 2 });

            expect(inventorySystem.hasSpaceForItem(inventory, smallItem)).toBe(true);
            expect(inventorySystem.hasSpaceForItem(inventory, largeItem)).toBe(false);
        });

        test('should calculate inventory weight', () => {
            const inventory = inventorySystem.createInventory(playerEntity, 12, 5);
            const item1 = itemFactory.createItem({ name: 'Heavy Armor', weight: 50, width: 2, height: 3 });
            const item2 = itemFactory.createItem({ name: 'Sword', weight: 10, width: 1, height: 3 });
            const item3 = itemFactory.createItem({ name: 'Potion', weight: 0.5, width: 1, height: 2, stackSize: 5 });

            inventorySystem.placeItem(inventory, item1, 0, 0);
            inventorySystem.placeItem(inventory, item2, 3, 0);
            inventorySystem.placeItem(inventory, item3, 5, 0);

            const totalWeight = inventorySystem.calculateTotalWeight(inventory);
            expect(totalWeight).toBe(60.5 + 0.5 * 4); // 50 + 10 + (0.5 * 5)
        });
    });

    describe('Inventory Serialization', () => {
        test('should serialize inventory state', () => {
            const inventory = inventorySystem.createInventory(playerEntity, 12, 5);
            const item = itemFactory.createItem({
                name: 'Test Item',
                width: 2,
                height: 2,
                type: 'weapon'
            });
            inventorySystem.placeItem(inventory, item, 5, 2);

            const serialized = inventorySystem.serializeInventory(inventory);
            expect(serialized.width).toBe(12);
            expect(serialized.height).toBe(5);
            expect(serialized.items).toHaveLength(1);
            expect(serialized.items[0].position).toEqual({ x: 5, y: 2 });
        });

        test('should deserialize inventory state', () => {
            const serialized = {
                width: 12,
                height: 5,
                items: [{
                    item: {
                        id: 'test-id',
                        name: 'Test Item',
                        width: 2,
                        height: 2,
                        type: 'weapon'
                    },
                    position: { x: 5, y: 2 }
                }]
            };

            const inventory = inventorySystem.deserializeInventory(playerEntity, serialized);
            expect(inventory.width).toBe(12);
            expect(inventory.height).toBe(5);
            expect(inventory.slots[2][5]).toBe('test-id');
            expect(inventory.items['test-id'].name).toBe('Test Item');
        });
    });
});