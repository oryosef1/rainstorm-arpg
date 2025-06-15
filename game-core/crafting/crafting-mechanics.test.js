const { CraftingMechanics } = require('./crafting-mechanics');
const { ItemFactory } = require('../inventory/item-factory');
const { CurrencySystem } = require('./currency-system');

describe('CraftingMechanics', () => {
    let craftingMechanics;
    let itemFactory;
    let currencySystem;

    beforeEach(() => {
        itemFactory = new ItemFactory();
        currencySystem = new CurrencySystem();
        craftingMechanics = new CraftingMechanics(itemFactory, currencySystem);
    });

    describe('Risk/Reward System', () => {
        test('should calculate crafting success rates based on item level', () => {
            const lowItem = { itemLevel: 10, rarity: 'normal' };
            const midItem = { itemLevel: 50, rarity: 'normal' };
            const highItem = { itemLevel: 80, rarity: 'normal' };

            const lowRate = craftingMechanics.calculateSuccessRate(lowItem, 'upgrade');
            const midRate = craftingMechanics.calculateSuccessRate(midItem, 'upgrade');
            const highRate = craftingMechanics.calculateSuccessRate(highItem, 'upgrade');

            expect(lowRate).toBeGreaterThan(midRate);
            expect(midRate).toBeGreaterThan(highRate);
            expect(highRate).toBeGreaterThan(0);
        });

        test('should have failure consequences', () => {
            const item = itemFactory.createItem({
                type: 'weapon',
                name: 'Test Sword',
                rarity: 'rare',
                itemLevel: 50
            });

            const failures = craftingMechanics.getFailureConsequences();
            
            expect(failures).toContain('destroy');
            expect(failures).toContain('downgrade');
            expect(failures).toContain('corrupt');
            expect(failures).toContain('nothing');
        });

        test('should apply failure consequences correctly', () => {
            const item = itemFactory.createItem({
                type: 'weapon',
                name: 'Test Sword',
                rarity: 'rare',
                itemLevel: 50
            });

            const result = craftingMechanics.applyFailureConsequence(item, 'downgrade');
            
            expect(result.success).toBe(false);
            expect(result.consequence).toBe('downgrade');
            expect(result.item.rarity).toBe('magic');
        });
    });

    describe('Fossil Crafting', () => {
        test('should define fossil types', () => {
            const fossils = craftingMechanics.getFossilTypes();
            
            expect(fossils).toHaveProperty('PRISTINE_FOSSIL');
            expect(fossils).toHaveProperty('DENSE_FOSSIL');
            expect(fossils).toHaveProperty('SERRATED_FOSSIL');
            expect(fossils).toHaveProperty('PRISMATIC_FOSSIL');
            expect(fossils).toHaveProperty('BOUND_FOSSIL');
            expect(fossils).toHaveProperty('PERFECT_FOSSIL');
        });

        test('fossils should have specific mod pools', () => {
            const fossils = craftingMechanics.getFossilTypes();
            
            Object.values(fossils).forEach(fossil => {
                expect(fossil).toHaveProperty('name');
                expect(fossil).toHaveProperty('description');
                expect(fossil).toHaveProperty('guaranteedMods');
                expect(fossil).toHaveProperty('blockedMods');
                expect(Array.isArray(fossil.guaranteedMods)).toBe(true);
                expect(Array.isArray(fossil.blockedMods)).toBe(true);
            });
        });

        test('should apply fossil crafting with guaranteed mods', () => {
            // Mock Math.random for consistent results
            const originalRandom = Math.random;
            Math.random = jest.fn(() => 0.1);
            
            const item = itemFactory.createItem({
                type: 'armor',
                name: 'Test Armor',
                rarity: 'normal',
                itemLevel: 50
            });

            const result = craftingMechanics.applyFossil('PRISTINE_FOSSIL', item);
            
            Math.random = originalRandom;
            
            expect(result.success).toBe(true);
            expect(result.item.rarity).toBe('rare');
            
            const hasPristineMod = result.item.affixes.some(affix => 
                affix.stat === 'life' || affix.stat === 'lifeRegen'
            );
            expect(hasPristineMod).toBe(true);
        });

        test('should block specific mods with fossils', () => {
            // Mock Math.random for consistent results
            const originalRandom = Math.random;
            Math.random = jest.fn(() => 0.1);
            
            const item = itemFactory.createItem({
                type: 'weapon',
                name: 'Test Weapon',
                rarity: 'normal',
                itemLevel: 50,
                affixes: []
            });

            const result = craftingMechanics.applyFossil('BOUND_FOSSIL', item);
            
            Math.random = originalRandom;
            
            expect(result.success).toBe(true);
            
            const hasBlockedMod = result.item.affixes.some(affix => 
                affix.stat === 'physicalDamage'
            );
            expect(hasBlockedMod).toBe(false);
        });
    });

    describe('Essence Crafting', () => {
        test('should define essence types and tiers', () => {
            const essences = craftingMechanics.getEssenceTypes();
            
            expect(essences).toHaveProperty('GREED');
            expect(essences).toHaveProperty('CONTEMPT');
            expect(essences).toHaveProperty('HATRED');
            expect(essences).toHaveProperty('WOE');
            expect(essences).toHaveProperty('FEAR');
            expect(essences).toHaveProperty('ANGER');
            expect(essences).toHaveProperty('TORMENT');
            expect(essences).toHaveProperty('SORROW');
        });

        test('each essence should have multiple tiers', () => {
            const essences = craftingMechanics.getEssenceTypes();
            
            Object.values(essences).forEach(essence => {
                expect(essence).toHaveProperty('tiers');
                expect(essence.tiers.length).toBeGreaterThanOrEqual(7);
                
                essence.tiers.forEach((tier, index) => {
                    expect(tier).toHaveProperty('level');
                    expect(tier).toHaveProperty('guaranteedValue');
                    expect(tier.level).toBe(index + 1);
                });
            });
        });

        test('should guarantee specific mod with essence', () => {
            const item = itemFactory.createItem({
                type: 'helmet',
                name: 'Test Helmet',
                rarity: 'normal',
                itemLevel: 50
            });

            const result = craftingMechanics.applyEssence('GREED', 5, item);
            
            expect(result.success).toBe(true);
            expect(result.item.rarity).toBe('rare');
            
            const guaranteedMod = result.item.affixes.find(affix => 
                affix.essenceGuaranteed === true
            );
            expect(guaranteedMod).toBeDefined();
            expect(guaranteedMod.value).toBeGreaterThanOrEqual(30);
        });
    });

    describe('Harvest Crafting', () => {
        test('should define harvest craft types', () => {
            const harvestCrafts = craftingMechanics.getHarvestCrafts();
            
            expect(harvestCrafts).toHaveProperty('augment');
            expect(harvestCrafts).toHaveProperty('remove');
            expect(harvestCrafts).toHaveProperty('removeAdd');
            expect(harvestCrafts).toHaveProperty('reforge');
            expect(harvestCrafts).toHaveProperty('divineValues');
            expect(harvestCrafts).toHaveProperty('socketColors');
        });

        test('should augment item with specific mod type', () => {
            // Mock Math.random to ensure success
            const originalRandom = Math.random;
            Math.random = jest.fn(() => 0.1); // Low value ensures success
            
            const item = {
                type: 'weapon',
                name: 'Test Weapon',
                rarity: 'rare',
                itemLevel: 50,
                affixes: [
                    { type: 'prefix', stat: 'damage', value: 50 }
                ]
            };

            const result = craftingMechanics.applyHarvestCraft('augment', item, {
                modType: 'fire'
            });
            
            Math.random = originalRandom; // Restore
            
            expect(result.success).toBe(true);
            
            const fireMod = result.item.affixes.find(affix => 
                affix.stat.includes('fire')
            );
            expect(fireMod).toBeDefined();
        });

        test('should remove specific mod type', () => {
            // Mock Math.random for consistent results
            const originalRandom = Math.random;
            Math.random = jest.fn(() => 0.1);
            
            const item = {
                type: 'armor',
                name: 'Test Armor',
                rarity: 'rare',
                itemLevel: 50,
                affixes: [
                    { type: 'prefix', stat: 'armor', value: 100 },
                    { type: 'prefix', stat: 'coldResistance', value: 30 },
                    { type: 'suffix', stat: 'fireResistance', value: 25 }
                ]
            };

            const result = craftingMechanics.applyHarvestCraft('remove', item, {
                modType: 'cold'
            });
            
            Math.random = originalRandom;
            
            expect(result.success).toBe(true);
            
            const coldMod = result.item.affixes.find(affix => 
                affix.stat.includes('cold')
            );
            expect(coldMod).toBeUndefined();
            expect(result.item.affixes.length).toBe(2);
        });

        test('should remove and add in one operation', () => {
            // Mock Math.random for consistent results
            const originalRandom = Math.random;
            Math.random = jest.fn(() => 0.1);
            
            const item = itemFactory.createItem({
                type: 'gloves',
                name: 'Test Gloves',
                rarity: 'rare',
                itemLevel: 50,
                affixes: [
                    { type: 'prefix', stat: 'armor', value: 50 },
                    { type: 'suffix', stat: 'fireResistance', value: 20 }
                ]
            });

            const initialFireValue = item.affixes[1].value;
            const result = craftingMechanics.applyHarvestCraft('removeAdd', item, {
                removeType: 'fire',
                addType: 'lightning'
            });
            
            Math.random = originalRandom;
            
            expect(result.success).toBe(true);
            
            const fireMod = result.item.affixes.find(affix => 
                affix.stat.includes('fire')
            );
            const lightningMod = result.item.affixes.find(affix => 
                affix.stat.includes('lightning')
            );
            
            expect(fireMod).toBeUndefined();
            expect(lightningMod).toBeDefined();
        });
    });

    describe('Crafting Bench Recipes', () => {
        test('should have recipe categories', () => {
            const recipes = craftingMechanics.getBenchRecipes();
            
            expect(recipes).toHaveProperty('prefix');
            expect(recipes).toHaveProperty('suffix');
            expect(recipes).toHaveProperty('socket');
            expect(recipes).toHaveProperty('quality');
            expect(recipes).toHaveProperty('metamod');
        });

        test('should apply bench craft with cost', () => {
            const item = itemFactory.createItem({
                type: 'weapon',
                name: 'Test Weapon',
                rarity: 'rare',
                itemLevel: 50,
                affixes: [
                    { type: 'prefix', stat: 'damage', value: 100 }
                ]
            });

            const recipe = craftingMechanics.getBenchRecipes().prefix[0];
            const result = craftingMechanics.applyBenchCraft(item, recipe.id);
            
            expect(result.success).toBe(true);
            expect(result.cost).toBeDefined();
            expect(result.cost.currency).toBeDefined();
            expect(result.cost.amount).toBeGreaterThan(0);
            
            const benchCrafted = result.item.affixes.find(affix => 
                affix.benchCrafted === true
            );
            expect(benchCrafted).toBeDefined();
        });

        test('should respect metamod crafts', () => {
            const item = itemFactory.createItem({
                type: 'armor',
                name: 'Test Armor',
                rarity: 'rare',
                itemLevel: 50,
                affixes: [
                    { type: 'prefix', stat: 'armor', value: 200 },
                    { type: 'suffix', stat: 'resistance', value: 30 }
                ]
            });

            // Apply "Prefixes Cannot Be Changed" metamod
            const metamodResult = craftingMechanics.applyBenchCraft(item, 'prefixes_cannot_be_changed');
            expect(metamodResult.success).toBe(true);
            
            // Try to modify with chaos orb
            const chaosResult = currencySystem.applyCurrency('CHAOS_ORB', metamodResult.item);
            
            // Check that prefixes are preserved
            const hasOriginalPrefix = chaosResult.item.affixes.some(affix => 
                affix.type === 'prefix' && affix.stat === 'armor' && affix.value === 200
            );
            expect(hasOriginalPrefix).toBe(true);
        });

        test('should limit bench crafts per item', () => {
            const item = {
                type: 'ring',
                name: 'Test Ring',
                rarity: 'rare',
                itemLevel: 50,
                affixes: []
            };

            const recipe1 = craftingMechanics.getBenchRecipes().prefix[0];
            const recipe2 = craftingMechanics.getBenchRecipes().prefix[1];
            
            const result1 = craftingMechanics.applyBenchCraft(item, recipe1.id);
            expect(result1.success).toBe(true);
            
            const result2 = craftingMechanics.applyBenchCraft(result1.item, recipe2.id);
            expect(result2.success).toBe(false);
            expect(result2.error).toContain('already has a bench craft');
        });
    });

    describe('Crafting Statistics', () => {
        test('should track crafting attempts and successes', () => {
            const item = itemFactory.createItem({
                type: 'weapon',
                name: 'Test Weapon',
                rarity: 'normal',
                itemLevel: 50
            });

            for (let i = 0; i < 10; i++) {
                craftingMechanics.applyFossil('SERRATED_FOSSIL', item);
            }

            const stats = craftingMechanics.getCraftingStats();
            
            expect(stats.totalAttempts).toBe(10);
            expect(stats.successCount).toBeGreaterThan(0);
            expect(stats.failureCount).toBeGreaterThanOrEqual(0);
            expect(stats.successRate).toBeGreaterThan(0);
            expect(stats.successRate).toBeLessThanOrEqual(1);
        });

        test('should track currency spent', () => {
            const item = itemFactory.createItem({
                type: 'armor',
                name: 'Test Armor',
                rarity: 'normal',
                itemLevel: 50
            });

            craftingMechanics.resetStats();
            
            // Apply some crafts
            craftingMechanics.applyFossil('DENSE_FOSSIL', item);
            craftingMechanics.applyEssence('HATRED', 3, item);
            
            const stats = craftingMechanics.getCraftingStats();
            
            expect(stats.currencySpent).toBeDefined();
            expect(stats.currencySpent.fossils).toBeGreaterThan(0);
            expect(stats.currencySpent.essences).toBeGreaterThan(0);
        });
    });
});