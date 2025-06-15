const { CurrencySystem } = require('./currency-system');
const { ItemFactory } = require('../inventory/item-factory');

describe('CurrencySystem', () => {
    let currencySystem;
    let itemFactory;

    beforeEach(() => {
        currencySystem = new CurrencySystem();
        itemFactory = new ItemFactory();
    });

    describe('Currency Types', () => {
        test('should define all currency orb types', () => {
            const currencies = currencySystem.getCurrencyTypes();
            
            expect(currencies).toHaveProperty('ORB_OF_ALCHEMY');
            expect(currencies).toHaveProperty('CHAOS_ORB');
            expect(currencies).toHaveProperty('EXALTED_ORB');
            expect(currencies).toHaveProperty('DIVINE_ORB');
            expect(currencies).toHaveProperty('ANNULMENT_ORB');
            expect(currencies).toHaveProperty('ANCIENT_ORB');
            expect(currencies).toHaveProperty('ORB_OF_TRANSMUTATION');
            expect(currencies).toHaveProperty('ORB_OF_ALTERATION');
            expect(currencies).toHaveProperty('ORB_OF_AUGMENTATION');
            expect(currencies).toHaveProperty('REGAL_ORB');
            expect(currencies).toHaveProperty('ORB_OF_SCOURING');
            expect(currencies).toHaveProperty('BLESSED_ORB');
            expect(currencies).toHaveProperty('ORB_OF_FUSING');
            expect(currencies).toHaveProperty('JEWELLERS_ORB');
            expect(currencies).toHaveProperty('CHROMATIC_ORB');
        });

        test('each currency should have proper metadata', () => {
            const currencies = currencySystem.getCurrencyTypes();
            
            Object.values(currencies).forEach(currency => {
                expect(currency).toHaveProperty('name');
                expect(currency).toHaveProperty('description');
                expect(currency).toHaveProperty('rarity');
                expect(currency).toHaveProperty('stackSize');
                expect(currency).toHaveProperty('effect');
                expect(['common', 'uncommon', 'rare', 'mythic']).toContain(currency.rarity);
                expect(currency.stackSize).toBeGreaterThan(0);
            });
        });
    });

    describe('Currency Item Creation', () => {
        test('should create currency item with proper properties', () => {
            const chaosOrb = currencySystem.createCurrencyItem('CHAOS_ORB', 5);
            
            expect(chaosOrb).toMatchObject({
                type: 'currency',
                currencyType: 'CHAOS_ORB',
                quantity: 5,
                maxStack: expect.any(Number),
                name: expect.any(String),
                description: expect.any(String)
            });
        });

        test('should not exceed max stack size', () => {
            const orb = currencySystem.createCurrencyItem('ORB_OF_ALCHEMY', 100);
            const maxStack = currencySystem.getCurrencyTypes().ORB_OF_ALCHEMY.stackSize;
            
            expect(orb.quantity).toBeLessThanOrEqual(maxStack);
        });

        test('should throw error for invalid currency type', () => {
            expect(() => {
                currencySystem.createCurrencyItem('INVALID_ORB', 1);
            }).toThrow('Invalid currency type');
        });
    });

    describe('Currency Effects on Items', () => {
        let testItem;

        beforeEach(() => {
            testItem = itemFactory.createItem({
                type: 'weapon',
                name: 'Iron Sword',
                rarity: 'normal',
                itemLevel: 10
            });
        });

        test('Orb of Alchemy should upgrade normal item to rare', () => {
            const result = currencySystem.applyCurrency('ORB_OF_ALCHEMY', testItem);
            
            expect(result.success).toBe(true);
            expect(result.item.rarity).toBe('rare');
            expect(result.item.affixes.length).toBeGreaterThanOrEqual(4);
        });

        test('Chaos Orb should reroll rare item affixes', () => {
            testItem.rarity = 'rare';
            testItem.affixes = [
                { type: 'prefix', stat: 'damage', value: 10 },
                { type: 'suffix', stat: 'critChance', value: 5 }
            ];
            
            const originalAffixes = [...testItem.affixes];
            const result = currencySystem.applyCurrency('CHAOS_ORB', testItem);
            
            expect(result.success).toBe(true);
            expect(result.item.rarity).toBe('rare');
            expect(result.item.affixes).not.toEqual(originalAffixes);
            expect(result.item.affixes.length).toBeGreaterThanOrEqual(4);
        });

        test('Exalted Orb should add affix to rare item', () => {
            testItem.rarity = 'rare';
            testItem.affixes = [
                { type: 'prefix', stat: 'damage', value: 10 },
                { type: 'suffix', stat: 'critChance', value: 5 }
            ];
            
            const originalAffixCount = testItem.affixes.length;
            const result = currencySystem.applyCurrency('EXALTED_ORB', testItem);
            
            expect(result.success).toBe(true);
            expect(result.item.affixes.length).toBe(originalAffixCount + 1);
            expect(result.item.affixes.length).toBeLessThanOrEqual(6);
        });

        test('Divine Orb should reroll affix values', () => {
            testItem.rarity = 'rare';
            testItem.affixes = [
                { type: 'prefix', stat: 'damage', value: 10, tier: 3, min: 5, max: 15 }
            ];
            
            const result = currencySystem.applyCurrency('DIVINE_ORB', testItem);
            
            expect(result.success).toBe(true);
            expect(result.item.affixes[0].stat).toBe('damage');
            expect(result.item.affixes[0].value).toBeGreaterThanOrEqual(5);
            expect(result.item.affixes[0].value).toBeLessThanOrEqual(15);
        });

        test('Annulment Orb should remove random affix', () => {
            testItem.rarity = 'rare';
            testItem.affixes = [
                { type: 'prefix', stat: 'damage', value: 10 },
                { type: 'suffix', stat: 'critChance', value: 5 }
            ];
            
            const originalCount = testItem.affixes.length;
            const result = currencySystem.applyCurrency('ANNULMENT_ORB', testItem);
            
            expect(result.success).toBe(true);
            expect(result.item.affixes.length).toBe(originalCount - 1);
        });

        test('Orb of Scouring should downgrade to normal', () => {
            testItem.rarity = 'rare';
            testItem.affixes = [{ type: 'prefix', stat: 'damage', value: 10 }];
            
            const result = currencySystem.applyCurrency('ORB_OF_SCOURING', testItem);
            
            expect(result.success).toBe(true);
            expect(result.item.rarity).toBe('normal');
            expect(result.item.affixes).toEqual([]);
        });

        test('currency should validate item type compatibility', () => {
            const currencyItem = currencySystem.createCurrencyItem('CHAOS_ORB', 1);
            
            const result = currencySystem.applyCurrency('CHAOS_ORB', currencyItem);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Cannot apply currency to currency items');
        });
    });

    describe('Socket Currency Effects', () => {
        let socketItem;

        beforeEach(() => {
            socketItem = itemFactory.createItem({
                type: 'armor',
                name: 'Iron Plate',
                rarity: 'normal',
                itemLevel: 20,
                sockets: [
                    { color: 'red', linked: false },
                    { color: 'green', linked: false }
                ]
            });
        });

        test('Orb of Fusing should modify socket links', () => {
            const result = currencySystem.applyCurrency('ORB_OF_FUSING', socketItem);
            
            expect(result.success).toBe(true);
            expect(result.item.sockets).toBeDefined();
        });

        test('Jewellers Orb should reroll socket count', () => {
            const originalSocketCount = socketItem.sockets.length;
            const result = currencySystem.applyCurrency('JEWELLERS_ORB', socketItem);
            
            expect(result.success).toBe(true);
            expect(result.item.sockets.length).toBeGreaterThanOrEqual(1);
            expect(result.item.sockets.length).toBeLessThanOrEqual(6);
        });

        test('Chromatic Orb should reroll socket colors', () => {
            const originalColors = socketItem.sockets.map(s => s.color);
            const result = currencySystem.applyCurrency('CHROMATIC_ORB', socketItem);
            
            expect(result.success).toBe(true);
            expect(result.item.sockets.length).toBe(originalColors.length);
            result.item.sockets.forEach(socket => {
                expect(['red', 'green', 'blue']).toContain(socket.color);
            });
        });
    });

    describe('Currency Drop System', () => {
        test('should calculate drop rates based on rarity', () => {
            const drops = currencySystem.getDropRates();
            
            expect(drops.common).toBeGreaterThan(drops.uncommon);
            expect(drops.uncommon).toBeGreaterThan(drops.rare);
            expect(drops.rare).toBeGreaterThan(drops.mythic);
        });

        test('should generate currency drops based on area level', () => {
            const lowLevelDrop = currencySystem.generateCurrencyDrop(10, 1.0);
            const highLevelDrop = currencySystem.generateCurrencyDrop(80, 1.0);
            
            if (lowLevelDrop && highLevelDrop) {
                const lowCurrency = currencySystem.getCurrencyTypes()[lowLevelDrop.currencyType];
                const highCurrency = currencySystem.getCurrencyTypes()[highLevelDrop.currencyType];
                
                expect(['common', 'uncommon']).toContain(lowCurrency.rarity);
            }
        });

        test('should respect increased item quantity modifier', () => {
            let dropCount = 0;
            const iterations = 1000;
            
            for (let i = 0; i < iterations; i++) {
                if (currencySystem.generateCurrencyDrop(50, 2.0)) {
                    dropCount++;
                }
            }
            
            expect(dropCount).toBeGreaterThan(iterations * 0.1);
        });
    });

    describe('Currency Stacking', () => {
        test('should merge currency stacks correctly', () => {
            const stack1 = currencySystem.createCurrencyItem('CHAOS_ORB', 10);
            const stack2 = currencySystem.createCurrencyItem('CHAOS_ORB', 8);
            
            const merged = currencySystem.mergeCurrencyStacks(stack1, stack2);
            
            expect(merged.quantity).toBe(18);
            expect(merged.currencyType).toBe('CHAOS_ORB');
        });

        test('should not merge different currency types', () => {
            const chaos = currencySystem.createCurrencyItem('CHAOS_ORB', 10);
            const exalted = currencySystem.createCurrencyItem('EXALTED_ORB', 5);
            
            expect(() => {
                currencySystem.mergeCurrencyStacks(chaos, exalted);
            }).toThrow('Cannot merge different currency types');
        });

        test('should respect max stack size when merging', () => {
            const maxStack = currencySystem.getCurrencyTypes().ORB_OF_ALTERATION.stackSize;
            const stack1 = currencySystem.createCurrencyItem('ORB_OF_ALTERATION', maxStack - 10);
            const stack2 = currencySystem.createCurrencyItem('ORB_OF_ALTERATION', 20);
            
            const result = currencySystem.mergeCurrencyStacks(stack1, stack2);
            
            expect(result.quantity).toBe(maxStack);
            expect(result.overflow).toBe(10);
        });
    });
});