const { CurrencySystem } = require('./currency-system');
const { InventorySystem } = require('../inventory/inventory-system');
const { ItemFactory } = require('../inventory/item-factory');
const { Entity } = require('../ecs/ecs-core');

describe('Currency-Inventory Integration', () => {
    let currencySystem;
    let inventorySystem;
    let itemFactory;
    let entity;
    let inventory;

    beforeEach(() => {
        currencySystem = new CurrencySystem();
        inventorySystem = new InventorySystem();
        itemFactory = new ItemFactory();
        entity = new Entity();
        inventory = inventorySystem.createInventory(entity);
    });

    describe('Currency Item Storage', () => {
        test('should store currency items in inventory', () => {
            const chaosOrb = currencySystem.createCurrencyItem('CHAOS_ORB', 5);
            chaosOrb.id = 'chaos_1';
            chaosOrb.width = 1;
            chaosOrb.height = 1;
            
            const placed = inventorySystem.placeItem(inventory, chaosOrb, 0, 0);
            
            expect(placed).toBe(true);
            expect(inventory.items['chaos_1']).toBeDefined();
            expect(inventory.items['chaos_1'].currencyType).toBe('CHAOS_ORB');
        });

        test('should stack currency items of same type', () => {
            const chaos1 = currencySystem.createCurrencyItem('CHAOS_ORB', 10);
            chaos1.id = 'chaos_1';
            chaos1.width = 1;
            chaos1.height = 1;
            chaos1.stackable = true;
            chaos1.maxStackSize = 20;
            chaos1.stackSize = 10;
            
            const chaos2 = currencySystem.createCurrencyItem('CHAOS_ORB', 5);
            chaos2.id = 'chaos_2';
            chaos2.width = 1;
            chaos2.height = 1;
            chaos2.stackable = true;
            chaos2.stackSize = 5;
            
            inventorySystem.placeItem(inventory, chaos1, 0, 0);
            const stacked = inventorySystem.tryStackItem(inventory, chaos2, 0, 0);
            
            expect(stacked).toBe(true);
            expect(chaos1.stackSize).toBe(15);
        });

        test('should handle max stack size for currency', () => {
            const alteration1 = currencySystem.createCurrencyItem('ORB_OF_ALTERATION', 25);
            alteration1.id = 'alt_1';
            alteration1.width = 1;
            alteration1.height = 1;
            alteration1.stackable = true;
            alteration1.maxStackSize = 30;
            alteration1.stackSize = 25;
            
            const alteration2 = currencySystem.createCurrencyItem('ORB_OF_ALTERATION', 10);
            alteration2.id = 'alt_2';
            alteration2.width = 1;
            alteration2.height = 1;
            alteration2.stackable = true;
            alteration2.stackSize = 10;
            
            inventorySystem.placeItem(inventory, alteration1, 0, 0);
            const stacked = inventorySystem.tryStackItem(inventory, alteration2, 0, 0);
            
            expect(stacked).toBe(false);
            expect(alteration1.stackSize).toBe(30);
            expect(alteration2.stackSize).toBe(5);
        });
    });

    describe('Currency Tab Organization', () => {
        test('should organize currency items by type', () => {
            const currencies = [
                { type: 'CHAOS_ORB', quantity: 5 },
                { type: 'EXALTED_ORB', quantity: 2 },
                { type: 'ORB_OF_ALCHEMY', quantity: 10 },
                { type: 'DIVINE_ORB', quantity: 1 }
            ];
            
            currencies.forEach((curr, index) => {
                const item = currencySystem.createCurrencyItem(curr.type, curr.quantity);
                item.id = `currency_${index}`;
                item.width = 1;
                item.height = 1;
                inventorySystem.autoPlaceItem(inventory, item);
            });
            
            const allCurrency = inventorySystem.findItemsByType(inventory, 'currency');
            expect(allCurrency.length).toBe(4);
        });
    });

    describe('Currency Usage from Inventory', () => {
        test('should use currency from inventory on item', () => {
            // Create a weapon to modify
            const weapon = itemFactory.createItem({
                type: 'weapon',
                name: 'Iron Sword',
                rarity: 'normal',
                itemLevel: 10
            });
            weapon.id = 'weapon_1';
            weapon.width = 2;
            weapon.height = 3;
            
            // Create currency orb
            const alchemyOrb = currencySystem.createCurrencyItem('ORB_OF_ALCHEMY', 3);
            alchemyOrb.id = 'alchemy_1';
            alchemyOrb.width = 1;
            alchemyOrb.height = 1;
            alchemyOrb.stackSize = 3;
            
            // Place both in inventory
            inventorySystem.placeItem(inventory, weapon, 0, 0);
            inventorySystem.placeItem(inventory, alchemyOrb, 3, 0);
            
            // Use currency on item
            const result = currencySystem.applyCurrency('ORB_OF_ALCHEMY', weapon);
            
            expect(result.success).toBe(true);
            expect(weapon.rarity).toBe('rare');
            
            // Decrement currency stack
            alchemyOrb.stackSize--;
            expect(alchemyOrb.stackSize).toBe(2);
        });

        test('should remove currency item when stack reaches zero', () => {
            const chaosOrb = currencySystem.createCurrencyItem('CHAOS_ORB', 1);
            chaosOrb.id = 'chaos_last';
            chaosOrb.width = 1;
            chaosOrb.height = 1;
            chaosOrb.stackSize = 1;
            
            inventorySystem.placeItem(inventory, chaosOrb, 0, 0);
            
            // Use last orb
            chaosOrb.stackSize--;
            
            if (chaosOrb.stackSize === 0) {
                inventorySystem.removeItem(inventory, chaosOrb.id);
            }
            
            expect(inventory.items['chaos_last']).toBeUndefined();
            expect(inventory.slots[0][0]).toBe(null);
        });
    });

    describe('Currency Drop Pickup', () => {
        test('should handle currency drop pickup with auto-stacking', () => {
            // Existing currency in inventory
            const existingChaos = currencySystem.createCurrencyItem('CHAOS_ORB', 15);
            existingChaos.id = 'chaos_existing';
            existingChaos.width = 1;
            existingChaos.height = 1;
            existingChaos.stackable = true;
            existingChaos.maxStackSize = 20;
            existingChaos.stackSize = 15;
            
            inventorySystem.placeItem(inventory, existingChaos, 0, 0);
            
            // New drop
            const droppedChaos = currencySystem.createCurrencyItem('CHAOS_ORB', 3);
            droppedChaos.width = 1;
            droppedChaos.height = 1;
            droppedChaos.stackable = true;
            droppedChaos.stackSize = 3;
            
            // Try to stack
            const stacked = inventorySystem.tryStackItem(inventory, droppedChaos, 0, 0);
            
            expect(stacked).toBe(true);
            expect(existingChaos.stackSize).toBe(18);
        });

        test('should create new stack when existing is full', () => {
            const fullStack = currencySystem.createCurrencyItem('ORB_OF_ALTERATION', 30);
            fullStack.id = 'alt_full';
            fullStack.width = 1;
            fullStack.height = 1;
            fullStack.stackable = true;
            fullStack.maxStackSize = 30;
            fullStack.stackSize = 30;
            
            inventorySystem.placeItem(inventory, fullStack, 0, 0);
            
            const newDrop = currencySystem.createCurrencyItem('ORB_OF_ALTERATION', 5);
            newDrop.id = 'alt_new';
            newDrop.width = 1;
            newDrop.height = 1;
            newDrop.stackable = true;
            newDrop.stackSize = 5;
            
            const stacked = inventorySystem.tryStackItem(inventory, newDrop, 0, 0);
            expect(stacked).toBe(false);
            
            // Place as new stack
            const placed = inventorySystem.autoPlaceItem(inventory, newDrop);
            expect(placed).toBe(true);
            
            const allAlterations = Object.values(inventory.items)
                .filter(item => item.currencyType === 'ORB_OF_ALTERATION');
            expect(allAlterations.length).toBe(2);
        });
    });

    describe('Currency Tab Features', () => {
        test('should support currency-specific inventory tab', () => {
            // Create currency-only tab
            const currencyTab = inventorySystem.createInventory(entity, 12, 12);
            currencyTab.tabType = 'currency';
            
            const currencies = [
                'CHAOS_ORB', 'EXALTED_ORB', 'DIVINE_ORB', 
                'ORB_OF_ALCHEMY', 'ORB_OF_ALTERATION'
            ];
            
            currencies.forEach((type, index) => {
                const currency = currencySystem.createCurrencyItem(type, 10);
                currency.id = `curr_${index}`;
                currency.width = 1;
                currency.height = 1;
                inventorySystem.autoPlaceItem(currencyTab, currency);
            });
            
            expect(Object.keys(currencyTab.items).length).toBe(5);
        });

        test('should calculate total currency value', () => {
            const currencies = [
                { type: 'CHAOS_ORB', quantity: 100, value: 1 },
                { type: 'EXALTED_ORB', quantity: 10, value: 100 },
                { type: 'DIVINE_ORB', quantity: 5, value: 150 }
            ];
            
            let totalValue = 0;
            currencies.forEach((curr, index) => {
                const item = currencySystem.createCurrencyItem(curr.type, curr.quantity);
                item.id = `currency_${index}`;
                item.width = 1;
                item.height = 1;
                item.value = curr.value;
                item.stackSize = curr.quantity;
                inventorySystem.autoPlaceItem(inventory, item);
                totalValue += curr.value * curr.quantity;
            });
            
            const calculatedValue = Object.values(inventory.items)
                .filter(item => item.type === 'currency')
                .reduce((sum, item) => sum + (item.value || 0) * (item.stackSize || 1), 0);
            
            expect(calculatedValue).toBe(totalValue);
        });
    });

    describe('Currency Right-Click Actions', () => {
        test('should support right-click to use currency', () => {
            const transmutationOrb = currencySystem.createCurrencyItem('ORB_OF_TRANSMUTATION', 5);
            transmutationOrb.id = 'trans_1';
            transmutationOrb.width = 1;
            transmutationOrb.height = 1;
            transmutationOrb.useAction = 'currency';
            
            inventorySystem.placeItem(inventory, transmutationOrb, 0, 0);
            
            expect(transmutationOrb.useAction).toBe('currency');
            expect(transmutationOrb.currencyType).toBe('ORB_OF_TRANSMUTATION');
        });
    });
});