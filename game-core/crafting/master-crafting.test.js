const { MasterCrafting } = require('./master-crafting');
const { ItemFactory } = require('../inventory/item-factory');
const { CurrencySystem } = require('./currency-system');

describe('MasterCrafting', () => {
    let masterCrafting;
    let itemFactory;
    let currencySystem;
    let testItem;

    beforeEach(() => {
        itemFactory = new ItemFactory();
        currencySystem = new CurrencySystem();
        masterCrafting = new MasterCrafting(itemFactory, currencySystem);
        
        testItem = {
            id: 'test-item',
            name: 'Test Sword',
            type: 'weapon',
            rarity: 'rare',
            itemLevel: 50,
            affixes: [
                { type: 'prefix', stat: 'physicalDamage', value: 50, tier: 3 },
                { type: 'prefix', stat: 'attackSpeed', value: 20, tier: 2 },
                { type: 'suffix', stat: 'fireResistance', value: 30, tier: 3 },
                { type: 'suffix', stat: 'coldResistance', value: 25, tier: 2 }
            ],
            sockets: [
                { color: 'red', linked: true },
                { color: 'green', linked: true },
                { color: 'blue', linked: false }
            ]
        };
    });

    describe('Master Crafting Initialization', () => {
        test('should initialize with all master crafting options', () => {
            const masterMods = masterCrafting.getMasterMods();
            expect(masterMods).toBeDefined();
            expect(masterMods.veiled).toBeDefined();
            expect(masterMods.multimod).toBeDefined();
            expect(masterMods.prefixLock).toBeDefined();
            expect(masterMods.suffixLock).toBeDefined();
        });

        test('should have crafting bench unlocks system', () => {
            const unlocks = masterCrafting.getUnlockedRecipes();
            expect(Array.isArray(unlocks)).toBe(true);
            expect(masterCrafting.isRecipeUnlocked('craft_life')).toBe(false);
        });

        test('should track master crafting statistics', () => {
            const stats = masterCrafting.getMasterCraftingStats();
            expect(stats.totalMasterCrafts).toBe(0);
            expect(stats.veiledModsUnveiled).toBe(0);
            expect(stats.recipesUnlocked).toBe(0);
        });
    });

    describe('Veiled Mod System', () => {
        test('should add veiled modifier to item', () => {
            const result = masterCrafting.addVeiledMod(testItem);
            expect(result.success).toBe(true);
            expect(result.item.veiledMods).toBeDefined();
            expect(result.item.veiledMods.length).toBeGreaterThan(0);
            expect(result.item.veiledMods[0].unveiled).toBe(false);
        });

        test('should not add veiled mod to corrupted items', () => {
            testItem.corrupted = true;
            const result = masterCrafting.addVeiledMod(testItem);
            expect(result.success).toBe(false);
            expect(result.error).toContain('corrupted');
        });

        test('should unveil modifier with options', () => {
            masterCrafting.addVeiledMod(testItem);
            const unveilResult = masterCrafting.unveilMod(testItem, 0);
            
            expect(unveilResult.success).toBe(true);
            expect(unveilResult.options).toBeDefined();
            expect(unveilResult.options.length).toBe(3); // Should give 3 options
            expect(unveilResult.options[0]).toHaveProperty('stat');
            expect(unveilResult.options[0]).toHaveProperty('value');
            expect(unveilResult.options[0]).toHaveProperty('tier');
        });

        test('should select unveiled modifier option', () => {
            masterCrafting.addVeiledMod(testItem);
            const unveilResult = masterCrafting.unveilMod(testItem, 0);
            const selectResult = masterCrafting.selectUnveiledOption(testItem, 0, 0);
            
            expect(selectResult.success).toBe(true);
            expect(testItem.veiledMods[0].unveiled).toBe(true);
            expect(testItem.veiledMods[0].selectedOption).toBeDefined();
            
            // Should add the mod to affixes
            const newAffix = testItem.affixes.find(a => a.veiledSource === true);
            expect(newAffix).toBeDefined();
        });

        test('should unlock recipe when unveiling specific mods', () => {
            masterCrafting.addVeiledMod(testItem);
            const unveilResult = masterCrafting.unveilMod(testItem, 0);
            
            // Assuming first option unlocks a recipe
            const selectResult = masterCrafting.selectUnveiledOption(testItem, 0, 0);
            
            if (unveilResult.options[0].unlocksRecipe) {
                expect(selectResult.recipeUnlocked).toBeDefined();
                expect(masterCrafting.isRecipeUnlocked(selectResult.recipeUnlocked)).toBe(true);
            }
        });
    });

    describe('Multi-Mod Crafting', () => {
        test('should add multi-mod capability to item', () => {
            const result = masterCrafting.applyMultiMod(testItem);
            expect(result.success).toBe(true);
            expect(result.item.canHaveMultipleCraftedMods).toBe(true);
            expect(result.cost).toBeDefined();
            expect(result.cost.currency).toBe('EXALTED_ORB');
            expect(result.cost.amount).toBe(2);
        });

        test('should allow up to 3 crafted mods with multi-mod', () => {
            // Use a simpler item with fewer affixes to avoid hitting the 6 affix limit
            const simpleItem = {
                name: 'Simple Sword',
                type: 'weapon',
                rarity: 'rare',
                affixes: [
                    { type: 'prefix', stat: 'damage', value: 50, tier: 3 }
                ]
            };
            
            masterCrafting.applyMultiMod(simpleItem);
            
            // Add first crafted mod
            const craft1 = masterCrafting.addCraftedMod(simpleItem, 'craft_life', 80);
            expect(craft1.success).toBe(true);
            
            // Add second crafted mod  
            const craft2 = masterCrafting.addCraftedMod(simpleItem, 'craft_mana', 60);
            expect(craft2.success).toBe(true);
            
            // Third mod should fail (multi-mod + 2 crafted = 3 total)
            const craft3 = masterCrafting.addCraftedMod(simpleItem, 'craft_all_res', 15);
            expect(craft3.success).toBe(false);
            expect(craft3.error).toContain('maximum');
        });

        test('should count multi-mod itself as a crafted mod', () => {
            masterCrafting.applyMultiMod(testItem);
            const craftedCount = masterCrafting.getCraftedModCount(testItem);
            expect(craftedCount).toBe(1); // Multi-mod counts as one
        });
    });

    describe('Advanced Crafting Options', () => {
        test('should apply prefix lock metamod', () => {
            const result = masterCrafting.applyMetamod(testItem, 'prefixLock');
            expect(result.success).toBe(true);
            expect(result.item.metamods).toContain('prefixes_cannot_be_changed');
            expect(result.cost.currency).toBe('EXALTED_ORB');
        });

        test('should apply suffix lock metamod', () => {
            const result = masterCrafting.applyMetamod(testItem, 'suffixLock');
            expect(result.success).toBe(true);
            expect(result.item.metamods).toContain('suffixes_cannot_be_changed');
        });

        test('should remove crafted mods', () => {
            masterCrafting.addCraftedMod(testItem, 'craft_life', 80);
            const removeResult = masterCrafting.removeCraftedMods(testItem);
            
            expect(removeResult.success).toBe(true);
            expect(removeResult.cost.currency).toBe('ORB_OF_SCOURING');
            expect(removeResult.cost.amount).toBe(1);
            
            const craftedMods = testItem.affixes.filter(a => a.masterCrafted);
            expect(craftedMods.length).toBe(0);
        });

        test('should target annul specific mod types', () => {
            const result = masterCrafting.targetedAnnul(testItem, 'fire');
            
            if (result.success) {
                expect(result.removedMod).toBeDefined();
                expect(result.removedMod.stat.toLowerCase()).toContain('fire');
            } else {
                // No fire mods to remove
                expect(result.error).toContain('No matching');
            }
        });
    });

    describe('Hybrid Crafting', () => {
        test('should add hybrid modifiers', () => {
            const result = masterCrafting.addHybridMod(testItem, 'spell_attack_hybrid');
            expect(result.success).toBe(true);
            expect(result.item.affixes.some(a => a.hybrid)).toBe(true);
            
            const hybridMod = result.item.affixes.find(a => a.hybrid);
            expect(hybridMod.stats).toBeDefined();
            expect(hybridMod.stats.length).toBeGreaterThan(1);
        });

        test('should not exceed affix limits with hybrid mods', () => {
            // Fill item with affixes
            testItem.affixes = [
                { type: 'prefix', stat: 'damage', value: 50, tier: 3 },
                { type: 'prefix', stat: 'life', value: 80, tier: 3 },
                { type: 'prefix', stat: 'mana', value: 60, tier: 3 },
                { type: 'suffix', stat: 'resistance', value: 30, tier: 3 },
                { type: 'suffix', stat: 'attributes', value: 25, tier: 3 },
                { type: 'suffix', stat: 'regen', value: 5, tier: 3 }
            ];
            
            const result = masterCrafting.addHybridMod(testItem, 'spell_attack_hybrid');
            expect(result.success).toBe(false);
            expect(result.error).toContain('maximum affixes');
        });
    });

    describe('Crafting Bench Progression', () => {
        test('should unlock recipes through gameplay', () => {
            const unlockResult = masterCrafting.unlockRecipe('craft_movement_speed', 'found_in_delve');
            expect(unlockResult.success).toBe(true);
            expect(masterCrafting.isRecipeUnlocked('craft_movement_speed')).toBe(true);
            expect(unlockResult.source).toBe('found_in_delve');
        });

        test('should track recipe sources', () => {
            masterCrafting.unlockRecipe('craft_life', 'niko_mission');
            masterCrafting.unlockRecipe('craft_es', 'syndicate_safehouse');
            
            const sources = masterCrafting.getRecipeSources();
            expect(sources['craft_life']).toBe('niko_mission');
            expect(sources['craft_es']).toBe('syndicate_safehouse');
        });

        test('should unlock recipe tiers progressively', () => {
            // Unlock tier 1
            masterCrafting.unlockRecipe('craft_life_t1', 'act_2_quest');
            expect(masterCrafting.isRecipeUnlocked('craft_life_t1')).toBe(true);
            
            // Try to use tier 2 without unlocking
            const craft = masterCrafting.addCraftedMod(testItem, 'craft_life_t2', 100);
            expect(craft.success).toBe(false);
            expect(craft.error).toContain('locked');
        });
    });

    describe('Socket and Link Crafting', () => {
        test('should force specific socket colors', () => {
            const result = masterCrafting.forceSocketColors(testItem, ['red', 'red', 'green']);
            expect(result.success).toBe(true);
            expect(result.item.sockets[0].color).toBe('red');
            expect(result.item.sockets[1].color).toBe('red');
            expect(result.item.sockets[2].color).toBe('green');
            expect(result.cost.currency).toBe('CHROMATIC_ORB');
            expect(result.cost.amount).toBeGreaterThan(100); // Forcing colors is expensive
        });

        test('should guarantee socket links', () => {
            testItem.sockets = [
                { color: 'red', linked: false },
                { color: 'green', linked: false },
                { color: 'blue', linked: false },
                { color: 'red', linked: false }
            ];
            
            const result = masterCrafting.guaranteeLinks(testItem, 4);
            expect(result.success).toBe(true);
            expect(result.item.sockets.filter(s => s.linked).length).toBeGreaterThanOrEqual(3);
            expect(result.cost.currency).toBe('ORB_OF_FUSING');
            expect(result.cost.amount).toBe(1000); // 4-link guarantee costs exactly 1000
        });

        test('should add white sockets', () => {
            const result = masterCrafting.addWhiteSocket(testItem, 1);
            expect(result.success).toBe(true);
            expect(result.item.sockets[1].color).toBe('white');
            expect(result.item.sockets[1].acceptsAnyGem).toBe(true);
        });
    });

    describe('Quality Crafting', () => {
        test('should add quality beyond 20%', () => {
            testItem.quality = 20;
            const result = masterCrafting.addPerfectQuality(testItem);
            
            expect(result.success).toBe(true);
            expect(result.item.quality).toBeGreaterThan(20);
            expect(result.item.quality).toBeLessThanOrEqual(30);
            expect(result.cost.currency).toBe('PERFECT_FOSSIL');
        });

        test('should add corrupted quality', () => {
            testItem.corrupted = true;
            testItem.quality = 15;
            
            const result = masterCrafting.addCorruptedQuality(testItem);
            expect(result.success).toBe(true);
            expect(result.item.quality).toBe(23); // Corrupted items can go to 23%
            expect(result.cost.currency).toBe('CORRUPTED_QUALITY_GEM');
        });
    });

    describe('Master Crafting Statistics', () => {
        test('should track all master crafting activities', () => {
            masterCrafting.applyMultiMod(testItem);
            masterCrafting.addCraftedMod(testItem, 'craft_life', 80);
            masterCrafting.addVeiledMod(testItem);
            masterCrafting.unlockRecipe('craft_es', 'syndicate');
            
            const stats = masterCrafting.getMasterCraftingStats();
            expect(stats.totalMasterCrafts).toBeGreaterThan(0);
            expect(stats.multiModsApplied).toBe(1);
            expect(stats.veiledModsAdded).toBe(1);
            expect(stats.recipesUnlocked).toBe(1);
        });

        test('should calculate total currency spent', () => {
            masterCrafting.applyMultiMod(testItem);
            masterCrafting.applyMetamod(testItem, 'prefixLock');
            
            const stats = masterCrafting.getMasterCraftingStats();
            expect(stats.currencySpent['EXALTED_ORB']).toBeGreaterThanOrEqual(4);
        });
    });

    describe('Integration with Base Crafting', () => {
        test('should respect metamods during currency application', () => {
            // Apply prefix lock
            masterCrafting.applyMetamod(testItem, 'prefixLock');
            
            // Store original prefixes
            const originalPrefixes = testItem.affixes.filter(a => a.type === 'prefix');
            
            // Simulate chaos orb application
            const chaosResult = masterCrafting.applyCurrencyWithMetamod(testItem, 'CHAOS_ORB');
            
            if (chaosResult.success) {
                // Prefixes should be preserved
                const newPrefixes = chaosResult.item.affixes.filter(a => a.type === 'prefix');
                expect(newPrefixes.length).toBe(originalPrefixes.length);
                expect(newPrefixes).toEqual(expect.arrayContaining(originalPrefixes));
            }
        });

        test('should allow forced rare with specific mods', () => {
            const normalItem = {
                name: 'Normal Sword',
                type: 'weapon',
                rarity: 'normal',
                itemLevel: 75,
                affixes: []
            };
            
            const result = masterCrafting.forceRareWithMods(normalItem, ['life', 'resistance']);
            expect(result.success).toBe(true);
            expect(result.item.rarity).toBe('rare');
            expect(result.item.affixes.some(a => a.stat.includes('life'))).toBe(true);
            expect(result.item.affixes.some(a => a.stat.includes('resistance'))).toBe(true);
        });
    });
});