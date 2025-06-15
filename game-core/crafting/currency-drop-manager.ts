// currency-drop-manager.ts - Currency Drop System
import { CurrencySystem, CurrencyItem } from './currency-system';

export interface DropTable {
  currencyChance: number;
  quantityRange: { min: number; max: number };
  rarityWeights: { common: number; uncommon: number; rare: number; mythic: number };
}

export interface DropTables {
  normal: DropTable;
  magic: DropTable;
  rare: DropTable;
  unique: DropTable;
  boss: DropTable;
}

export interface DropStatistics {
  totalAttempts: number;
  successfulDrops: number;
  dropsByType: Record<string, number>;
  dropRate: number;
}

export interface CurrencyPools {
  common: string[];
  uncommon: string[];
  rare: string[];
  mythic: string[];
}

export type EnemyType = 'normal' | 'magic' | 'rare' | 'unique' | 'boss';

export class CurrencyDropManager {
  private currencySystem: CurrencySystem;
  private dropTables: DropTables;
  private specialEventMultiplier: number;
  private specialEventName: string | null;
  private statistics: {
    totalAttempts: number;
    successfulDrops: number;
    dropsByType: Record<string, number>;
  };

  constructor(currencySystem: CurrencySystem) {
    this.currencySystem = currencySystem;
    this.dropTables = this.initializeDropTables();
    this.specialEventMultiplier = 1.0;
    this.specialEventName = null;
    this.statistics = {
      totalAttempts: 0,
      successfulDrops: 0,
      dropsByType: {}
    };
  }

  private initializeDropTables(): DropTables {
    return {
      normal: {
        currencyChance: 0.05,
        quantityRange: { min: 1, max: 1 },
        rarityWeights: { common: 0.8, uncommon: 0.18, rare: 0.02, mythic: 0 }
      },
      magic: {
        currencyChance: 0.08,
        quantityRange: { min: 1, max: 2 },
        rarityWeights: { common: 0.7, uncommon: 0.25, rare: 0.05, mythic: 0 }
      },
      rare: {
        currencyChance: 0.12,
        quantityRange: { min: 1, max: 2 },
        rarityWeights: { common: 0.6, uncommon: 0.3, rare: 0.09, mythic: 0.01 }
      },
      unique: {
        currencyChance: 0.18,
        quantityRange: { min: 1, max: 3 },
        rarityWeights: { common: 0.5, uncommon: 0.35, rare: 0.13, mythic: 0.02 }
      },
      boss: {
        currencyChance: 0.35,
        quantityRange: { min: 2, max: 5 },
        rarityWeights: { common: 0.4, uncommon: 0.4, rare: 0.17, mythic: 0.03 }
      }
    };
  }

  getDropTables(): DropTables {
    return this.dropTables;
  }

  generateDrop(enemyType: EnemyType, areaLevel: number, itemQuantity: number = 1.0): CurrencyItem | null {
    this.statistics.totalAttempts++;
    
    const dropTable = this.dropTables[enemyType] || this.dropTables.normal;
    const effectiveChance = dropTable.currencyChance * itemQuantity * this.specialEventMultiplier;
    
    if (Math.random() > effectiveChance) {
      return null;
    }

    const currencyType = this.selectCurrencyType(dropTable.rarityWeights, areaLevel);
    if (!currencyType) {
      return null;
    }

    const quantity = this.calculateDropQuantity(dropTable.quantityRange, itemQuantity);
    const drop = this.currencySystem.createCurrencyItem(currencyType, quantity);
    
    this.statistics.successfulDrops++;
    this.statistics.dropsByType[currencyType] = (this.statistics.dropsByType[currencyType] || 0) + 1;
    
    return drop;
  }

  generateMultipleDrops(enemyType: EnemyType, areaLevel: number, itemQuantity: number = 1.0): CurrencyItem[] {
    const drops: CurrencyItem[] = [];
    const dropTable = this.dropTables[enemyType] || this.dropTables.normal;
    const maxDrops = dropTable.quantityRange.max;
    
    for (let i = 0; i < maxDrops; i++) {
      const drop = this.generateDrop(enemyType, areaLevel, itemQuantity);
      if (drop) {
        drops.push(drop);
      }
    }
    
    return drops;
  }

  private selectCurrencyType(rarityWeights: Record<string, number>, areaLevel: number): string | null {
    const roll = Math.random();
    let cumulative = 0;
    let selectedRarity: string | null = null;

    for (const [rarity, weight] of Object.entries(rarityWeights)) {
      cumulative += weight;
      if (roll <= cumulative) {
        selectedRarity = rarity;
        break;
      }
    }

    if (!selectedRarity) return null;

    if (selectedRarity === 'rare' && areaLevel < 30) {
      selectedRarity = 'uncommon';
    }
    if (selectedRarity === 'mythic' && areaLevel < 60) {
      selectedRarity = 'rare';
    }

    const availableCurrencies = this.getCurrencyPools()[selectedRarity as keyof CurrencyPools];
    if (!availableCurrencies || availableCurrencies.length === 0) {
      return null;
    }

    return availableCurrencies[Math.floor(Math.random() * availableCurrencies.length)];
  }

  private calculateDropQuantity(quantityRange: { min: number; max: number }, itemQuantity: number): number {
    const baseQuantity = Math.floor(Math.random() * 
      (quantityRange.max - quantityRange.min + 1)) + quantityRange.min;
    
    const bonusRoll = Math.random();
    let bonusQuantity = 0;
    
    if (bonusRoll < itemQuantity - 1) {
      bonusQuantity = Math.floor(itemQuantity);
    }
    
    return baseQuantity + bonusQuantity;
  }

  getCurrencyPools(): CurrencyPools {
    const pools: CurrencyPools = {
      common: [],
      uncommon: [],
      rare: [],
      mythic: []
    };

    const currencyTypes = this.currencySystem.getCurrencyTypes();
    
    for (const [currencyKey, currency] of Object.entries(currencyTypes)) {
      if (pools[currency.rarity]) {
        pools[currency.rarity].push(currencyKey);
      }
    }

    return pools;
  }

  getDropWeights(areaLevel: number): Record<string, number> {
    const baseWeights = {
      common: 100,
      uncommon: 50,
      rare: 10,
      mythic: 1
    };

    const weights = { ...baseWeights };

    if (areaLevel >= 30) {
      weights.rare += 5;
    }
    if (areaLevel >= 60) {
      weights.rare += 10;
      weights.mythic += 2;
    }
    if (areaLevel >= 80) {
      weights.rare += 15;
      weights.mythic += 3;
    }

    return weights;
  }

  setSpecialEvent(eventName: string, multiplier: number): void {
    this.specialEventName = eventName;
    this.specialEventMultiplier = multiplier;
  }

  clearSpecialEvent(): void {
    this.specialEventName = null;
    this.specialEventMultiplier = 1.0;
  }

  getDropStatistics(): DropStatistics {
    return {
      totalAttempts: this.statistics.totalAttempts,
      successfulDrops: this.statistics.successfulDrops,
      dropsByType: { ...this.statistics.dropsByType },
      dropRate: this.statistics.totalAttempts > 0 
        ? this.statistics.successfulDrops / this.statistics.totalAttempts 
        : 0
    };
  }

  resetStatistics(): void {
    this.statistics = {
      totalAttempts: 0,
      successfulDrops: 0,
      dropsByType: {}
    };
  }
}

export default CurrencyDropManager;