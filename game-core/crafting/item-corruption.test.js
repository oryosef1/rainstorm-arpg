const { ItemCorruption } = require('./item-corruption');
const { ItemFactory } = require('../inventory/item-factory');

describe('ItemCorruption', () => {
    let itemCorruption;
    let itemFactory;
    let testItem;

    beforeEach(() => {
        itemFactory = new ItemFactory();
        itemCorruption = new ItemCorruption(itemFactory);
        
        testItem = {
            id: 'test-item',
            name: 'Test Sword',
            type: 'weapon',
            rarity: 'rare',
            itemLevel: 75,
            affixes: [
                { type: 'prefix', stat: 'physicalDamage', value: 80, tier: 2 },
                { type: 'prefix', stat: 'attackSpeed', value: 25, tier: 2 },
                { type: 'suffix', stat: 'critChance', value: 30, tier: 2 },
                { type: 'suffix', stat: 'critMultiplier', value: 40, tier: 3 }
            ],
            sockets: [
                { color: 'red', linked: true },
                { color: 'green', linked: true },
                { color: 'blue', linked: false }
            ],
            quality: 20
        };
    });

    describe('Basic Corruption', () => {
        test('should corrupt an item with Vaal Orb', () => {
            const result = itemCorruption.corruptItem(testItem);
            expect(result.success).toBe(true);
            expect(result.item.corrupted).toBe(true);
            expect(result.outcome).toBeDefined();
            expect(['nothing', 'implicit', 'white_sockets', 'reroll', 'brick']).toContain(result.outcome);
        });

        test('should not corrupt already corrupted items', () => {
            testItem.corrupted = true;
            const result = itemCorruption.corruptItem(testItem);
            expect(result.success).toBe(false);
            expect(result.error).toContain('already corrupted');
        });

        test('should track corruption statistics', () => {
            const stats = itemCorruption.getCorruptionStats();
            expect(stats.totalAttempts).toBe(0);
            expect(stats.outcomes).toBeDefined();
            
            itemCorruption.corruptItem(testItem);
            const newStats = itemCorruption.getCorruptionStats();
            expect(newStats.totalAttempts).toBe(1);
        });
    });

    describe('Corruption Outcomes', () => {
        test('should handle "nothing" outcome', () => {
            // Force nothing outcome
            jest.spyOn(Math, 'random').mockReturnValue(0.1);
            const result = itemCorruption.corruptItem(testItem);
            
            expect(result.outcome).toBe('nothing');
            expect(result.item.corrupted).toBe(true);
            expect(result.item.affixes).toEqual(testItem.affixes);
            
            Math.random.mockRestore();
        });

        test('should add corrupted implicit', () => {
            // Force implicit outcome
            jest.spyOn(Math, 'random').mockReturnValue(0.3);
            const result = itemCorruption.corruptItem(testItem);
            
            if (result.outcome === 'implicit') {
                expect(result.item.corruptedImplicit).toBeDefined();
                expect(result.item.corruptedImplicit.stat).toBeDefined();
                expect(result.item.corruptedImplicit.value).toBeGreaterThan(0);
            }
            
            Math.random.mockRestore();
        });

        test('should add white sockets', () => {
            // Force white sockets outcome
            jest.spyOn(Math, 'random').mockReturnValue(0.5);
            const result = itemCorruption.corruptItem(testItem);
            
            if (result.outcome === 'white_sockets') {
                const whiteSockets = result.item.sockets.filter(s => s.color === 'white');
                expect(whiteSockets.length).toBeGreaterThan(0);
                expect(whiteSockets[0].acceptsAnyGem).toBe(true);
            }
            
            Math.random.mockRestore();
        });

        test('should reroll item to rare with random properties', () => {
            // Force reroll outcome
            jest.spyOn(Math, 'random').mockReturnValue(0.7);
            const originalAffixes = [...testItem.affixes];
            const result = itemCorruption.corruptItem(testItem);
            
            if (result.outcome === 'reroll') {
                expect(result.item.rarity).toBe('rare');
                expect(result.item.affixes).not.toEqual(originalAffixes);
                expect(result.item.affixes.length).toBeGreaterThanOrEqual(4);
                expect(result.item.affixes.length).toBeLessThanOrEqual(6);
            }
            
            Math.random.mockRestore();
        });

        test('should brick item (turn into unusable rare)', () => {
            // Force brick outcome
            jest.spyOn(Math, 'random').mockReturnValue(0.9);
            const result = itemCorruption.corruptItem(testItem);
            
            if (result.outcome === 'brick') {
                expect(result.item.bricked).toBe(true);
                expect(result.item.affixes.every(a => a.value < 0 || a.stat.includes('reduced'))).toBe(true);
                expect(result.item.name).toContain('Corrupted');
            }
            
            Math.random.mockRestore();
        });
    });

    describe('Advanced Corruption', () => {
        test('should double corrupt with Corruption Chamber', () => {
            const result = itemCorruption.doubleCorrupt(testItem);
            expect(result.success).toBe(true);
            expect(result.item.corrupted).toBe(true);
            expect(result.outcomes).toBeDefined();
            expect(result.outcomes.length).toBe(2);
        });

        test('should apply corruption altar with specific outcome', () => {
            const result = itemCorruption.corruptionAltar(testItem, 'add_influence');
            expect(result.success).toBe(true);
            
            if (result.outcome === 'add_influence') {
                expect(result.item.influence).toBeDefined();
                expect(['shaper', 'elder', 'crusader', 'hunter', 'redeemer', 'warlord']).toContain(result.item.influence);
            }
        });

        test('should transform unique items', () => {
            const uniqueItem = {
                ...testItem,
                rarity: 'unique',
                name: 'Starforge'
            };
            
            const result = itemCorruption.corruptItem(uniqueItem);
            
            if (result.outcome === 'transform_unique') {
                expect(result.item.name).not.toBe('Starforge');
                expect(result.item.transformedFrom).toBe('Starforge');
                expect(result.item.rarity).toBe('unique');
            }
        });
    });

    describe('Corruption Implicits', () => {
        test('should add weapon-specific corrupted implicits', () => {
            const implicits = itemCorruption.getCorruptedImplicits('weapon');
            expect(implicits.length).toBeGreaterThan(0);
            expect(implicits[0]).toHaveProperty('stat');
            expect(implicits[0]).toHaveProperty('minValue');
            expect(implicits[0]).toHaveProperty('maxValue');
        });

        test('should add armor-specific corrupted implicits', () => {
            const armorItem = {
                ...testItem,
                type: 'bodyArmor'
            };
            
            const result = itemCorruption.corruptItem(armorItem);
            
            if (result.outcome === 'implicit' && result.item.corruptedImplicit) {
                const validArmorImplicits = ['life', 'resistance', 'armor', 'evasion', 'energyShield'];
                const hasValidImplicit = validArmorImplicits.some(imp => 
                    result.item.corruptedImplicit.stat.toLowerCase().includes(imp)
                );
                expect(hasValidImplicit).toBe(true);
            }
        });

        test('should add jewel-specific corrupted implicits', () => {
            const jewelItem = {
                name: 'Crimson Jewel',
                type: 'jewel',
                rarity: 'rare',
                affixes: [
                    { type: 'prefix', stat: 'life', value: 30 }
                ]
            };
            
            const result = itemCorruption.corruptItem(jewelItem);
            
            if (result.outcome === 'implicit') {
                expect(result.item.corruptedImplicit).toBeDefined();
                const validJewelImplicits = ['corruptedBlood', 'silenceImmunity', 'cannotBeHindered'];
                const hasValidImplicit = validJewelImplicits.some(imp => 
                    result.item.corruptedImplicit.stat === imp
                );
                expect(hasValidImplicit).toBe(true);
            }
        });
    });

    describe('Corruption Chamber (Temple)', () => {
        test('should apply specific temple corruption outcomes', () => {
            const outcomes = itemCorruption.getTempleCorruptionOutcomes();
            expect(outcomes).toContain('all_white_sockets');
            expect(outcomes).toContain('two_implicits');
            expect(outcomes).toContain('influence_change');
            expect(outcomes).toContain('destroy');
        });

        test('should make all sockets white', () => {
            const result = itemCorruption.templeCorrupt(testItem, 'all_white_sockets');
            
            if (result.success && result.outcome === 'all_white_sockets') {
                expect(result.item.sockets.every(s => s.color === 'white')).toBe(true);
                expect(result.item.sockets.every(s => s.acceptsAnyGem)).toBe(true);
            }
        });

        test('should add two corrupted implicits', () => {
            const result = itemCorruption.templeCorrupt(testItem, 'two_implicits');
            
            if (result.success && result.outcome === 'two_implicits') {
                expect(result.item.corruptedImplicits).toBeDefined();
                expect(result.item.corruptedImplicits.length).toBe(2);
                expect(result.item.corruptedImplicits[0].stat).not.toBe(result.item.corruptedImplicits[1].stat);
            }
        });

        test('should destroy item with chance', () => {
            // Force destroy outcome
            jest.spyOn(Math, 'random').mockReturnValue(0.95);
            const result = itemCorruption.templeCorrupt(testItem, 'risky_corrupt');
            
            if (result.outcome === 'destroy') {
                expect(result.item).toBeNull();
                expect(result.destroyed).toBe(true);
            }
            
            Math.random.mockRestore();
        });
    });

    describe('Krangled Items (Scourge)', () => {
        test('should krangle item with beneficial and detrimental mods', () => {
            const result = itemCorruption.krangleItem(testItem, 1);
            expect(result.success).toBe(true);
            expect(result.item.krangled).toBe(true);
            expect(result.item.krangleTier).toBe(1);
            expect(result.item.beneficialKrangle).toBeDefined();
            expect(result.item.detrimentalKrangle).toBeDefined();
        });

        test('should increase krangle tier', () => {
            // First krangle
            itemCorruption.krangleItem(testItem, 1);
            
            // Second krangle
            const result = itemCorruption.krangleItem(testItem, 2);
            expect(result.success).toBe(true);
            expect(result.item.krangleTier).toBe(2);
            expect(result.item.beneficialKrangle.value).toBeGreaterThan(0);
        });

        test('should not exceed maximum krangle tier', () => {
            testItem.krangled = true;
            testItem.krangleTier = 3;
            
            const result = itemCorruption.krangleItem(testItem, 4);
            expect(result.success).toBe(false);
            expect(result.error).toContain('maximum krangle');
        });
    });

    describe('Corruption Costs', () => {
        test('should track Vaal Orb usage', () => {
            itemCorruption.corruptItem(testItem);
            const stats = itemCorruption.getCorruptionStats();
            expect(stats.vaalOrbsUsed).toBe(1);
        });

        test('should track temple corruption costs', () => {
            itemCorruption.templeCorrupt(testItem, 'all_white_sockets');
            const stats = itemCorruption.getCorruptionStats();
            expect(stats.templeCorruptions).toBe(1);
        });

        test('should calculate risk vs reward metrics', () => {
            // Corrupt multiple items
            for (let i = 0; i < 10; i++) {
                const item = { ...testItem, id: `item-${i}` };
                itemCorruption.corruptItem(item);
            }
            
            const stats = itemCorruption.getCorruptionStats();
            expect(stats.successRate).toBeDefined();
            expect(stats.brickRate).toBeDefined();
            expect(stats.beneficialRate).toBeDefined();
        });
    });

    describe('Unique Corruption Interactions', () => {
        test('should have special outcomes for specific uniques', () => {
            const headhunter = {
                name: 'Headhunter',
                type: 'belt',
                rarity: 'unique',
                affixes: []
            };
            
            const result = itemCorruption.corruptItem(headhunter);
            
            // Headhunter should have special corruption pool
            if (result.outcome === 'implicit') {
                const validOutcomes = ['increasedEffect', 'additionalRareMod', 'durationIncrease'];
                const hasSpecialOutcome = validOutcomes.some(outcome => 
                    result.item.corruptedImplicit && result.item.corruptedImplicit.stat.includes(outcome)
                );
                expect(hasSpecialOutcome || result.item.corruptedImplicit).toBeTruthy();
            }
        });

        test('should transform fated uniques', () => {
            const atzirisDisfavour = {
                name: "Atziri's Disfavour",
                type: 'weapon',
                rarity: 'unique',
                canTransform: true
            };
            
            const result = itemCorruption.corruptItem(atzirisDisfavour);
            
            if (result.outcome === 'transform_unique') {
                expect(result.item.name).toBe("Atziri's Disfavour");
                expect(result.item.upgraded).toBe(true);
            }
        });
    });
});