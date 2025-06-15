const { CurrencyDropManager } = require('./currency-drop-manager');
const { CurrencySystem } = require('./currency-system');

describe('CurrencyDropManager', () => {
    let dropManager;
    let currencySystem;

    beforeEach(() => {
        currencySystem = new CurrencySystem();
        dropManager = new CurrencyDropManager(currencySystem);
    });

    describe('Drop Tables', () => {
        test('should have drop tables for different enemy types', () => {
            const tables = dropManager.getDropTables();
            
            expect(tables).toHaveProperty('normal');
            expect(tables).toHaveProperty('magic');
            expect(tables).toHaveProperty('rare');
            expect(tables).toHaveProperty('unique');
            expect(tables).toHaveProperty('boss');
        });

        test('boss enemies should have higher currency drop rates', () => {
            const normalRate = dropManager.getDropTables().normal.currencyChance;
            const bossRate = dropManager.getDropTables().boss.currencyChance;
            
            expect(bossRate).toBeGreaterThan(normalRate);
        });
    });

    describe('Drop Generation', () => {
        test('should generate currency drops based on enemy type and level', () => {
            const drops = [];
            
            for (let i = 0; i < 100; i++) {
                const drop = dropManager.generateDrop('boss', 50, 1.0);
                if (drop) drops.push(drop);
            }
            
            expect(drops.length).toBeGreaterThan(0);
            drops.forEach(drop => {
                expect(drop.type).toBe('currency');
                expect(drop.currencyType).toBeDefined();
            });
        });

        test('should respect area level restrictions', () => {
            const drops = [];
            
            for (let i = 0; i < 1000; i++) {
                const drop = dropManager.generateDrop('normal', 5, 1.0);
                if (drop && drop.currencyType) {
                    drops.push(drop);
                }
            }
            
            drops.forEach(drop => {
                const currency = currencySystem.getCurrencyTypes()[drop.currencyType];
                expect(['common', 'uncommon']).toContain(currency.rarity);
            });
        });

        test('should apply increased item quantity modifier', () => {
            let normalDrops = 0;
            let increasedDrops = 0;
            const iterations = 1000;
            
            for (let i = 0; i < iterations; i++) {
                if (dropManager.generateDrop('normal', 50, 1.0)) normalDrops++;
                if (dropManager.generateDrop('normal', 50, 2.0)) increasedDrops++;
            }
            
            expect(increasedDrops).toBeGreaterThan(normalDrops);
        });
    });

    describe('Drop Pools', () => {
        test('should have weighted currency pools by rarity', () => {
            const pools = dropManager.getCurrencyPools();
            
            expect(pools.common.length).toBeGreaterThan(0);
            expect(pools.uncommon.length).toBeGreaterThan(0);
            expect(pools.rare.length).toBeGreaterThan(0);
            expect(pools.mythic.length).toBeGreaterThan(0);
        });

        test('should calculate drop weights correctly', () => {
            const weights = dropManager.getDropWeights(50);
            
            expect(weights.common).toBeGreaterThan(weights.uncommon);
            expect(weights.uncommon).toBeGreaterThan(weights.rare);
            expect(weights.rare).toBeGreaterThan(weights.mythic);
        });
    });

    describe('Multi-Drop System', () => {
        test('should support multiple currency drops from single enemy', () => {
            const drops = dropManager.generateMultipleDrops('boss', 80, 1.5);
            
            expect(Array.isArray(drops)).toBe(true);
            expect(drops.length).toBeGreaterThanOrEqual(0);
            expect(drops.length).toBeLessThanOrEqual(5);
        });

        test('should increase drop count for higher rarity enemies', () => {
            let normalDropCount = 0;
            let bossDropCount = 0;
            const iterations = 100;
            
            for (let i = 0; i < iterations; i++) {
                normalDropCount += dropManager.generateMultipleDrops('normal', 50, 1.0).length;
                bossDropCount += dropManager.generateMultipleDrops('boss', 50, 1.0).length;
            }
            
            expect(bossDropCount).toBeGreaterThan(normalDropCount);
        });
    });

    describe('Special Drop Events', () => {
        test('should have increased drops during special events', () => {
            dropManager.setSpecialEvent('currencyWeekend', 2.0);
            
            let eventDrops = 0;
            const iterations = 1000;
            
            for (let i = 0; i < iterations; i++) {
                if (dropManager.generateDrop('normal', 50, 1.0)) eventDrops++;
            }
            
            dropManager.clearSpecialEvent();
            
            let normalDrops = 0;
            for (let i = 0; i < iterations; i++) {
                if (dropManager.generateDrop('normal', 50, 1.0)) normalDrops++;
            }
            
            expect(eventDrops).toBeGreaterThan(normalDrops);
        });
    });

    describe('Drop Statistics', () => {
        test('should track drop statistics', () => {
            for (let i = 0; i < 100; i++) {
                dropManager.generateDrop('normal', 50, 1.0);
            }
            
            const stats = dropManager.getDropStatistics();
            
            expect(stats).toHaveProperty('totalAttempts');
            expect(stats).toHaveProperty('successfulDrops');
            expect(stats).toHaveProperty('dropsByType');
            expect(stats.totalAttempts).toBe(100);
        });

        test('should calculate drop rates accurately', () => {
            for (let i = 0; i < 1000; i++) {
                dropManager.generateDrop('normal', 50, 1.0);
            }
            
            const stats = dropManager.getDropStatistics();
            const dropRate = stats.successfulDrops / stats.totalAttempts;
            
            expect(dropRate).toBeGreaterThan(0);
            expect(dropRate).toBeLessThan(1);
        });
    });
});