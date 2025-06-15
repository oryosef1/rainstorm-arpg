// master-crafting.ts - Master Crafting System
import { ItemFactory } from '../inventory/item-factory';
import { CurrencySystem } from './currency-system';

export interface MasterMod {
  name: string;
  description: string;
  cost: { currency: string; amount: number };
}

export interface VeiledMod {
  stat: string;
  name: string;
  tier: number;
  minValue: number;
  maxValue: number;
}

export interface MasterCraftingStats {
  totalMasterCrafts: number;
  multiModsApplied: number;
  veiledModsAdded: number;
  veiledModsUnveiled: number;
  recipesUnlocked: number;
  metamodsApplied: number;
  currencySpent: Record<string, number>;
}

export class MasterCrafting {
  private itemFactory: ItemFactory;
  private currencySystem: CurrencySystem;
  private unlockedRecipes: Set<string>;
  private recipeSources: Map<string, string>;
  private masterMods: Record<string, MasterMod>;
  private veiledModPool: Record<string, VeiledMod[]>;
  private hybridMods: Record<string, any>;
  private stats: MasterCraftingStats;

  constructor(itemFactory: ItemFactory, currencySystem: CurrencySystem) {
    this.itemFactory = itemFactory;
    this.currencySystem = currencySystem;
    this.unlockedRecipes = new Set();
    this.recipeSources = new Map();
    this.masterMods = this.initializeMasterMods();
    this.veiledModPool = this.initializeVeiledMods();
    this.hybridMods = this.initializeHybridMods();
    this.stats = {
      totalMasterCrafts: 0,
      multiModsApplied: 0,
      veiledModsAdded: 0,
      veiledModsUnveiled: 0,
      recipesUnlocked: 0,
      metamodsApplied: 0,
      currencySpent: {}
    };
  }

  private initializeMasterMods(): Record<string, MasterMod> {
    return {
      veiled: {
        name: 'Veiled Modifier',
        description: 'Adds a veiled modifier that must be unveiled',
        cost: { currency: 'VEILED_CHAOS_ORB', amount: 1 }
      },
      multimod: {
        name: 'Can have up to 3 Crafted Modifiers',
        description: 'Allows multiple crafted modifiers',
        cost: { currency: 'EXALTED_ORB', amount: 2 }
      },
      prefixLock: {
        name: 'Prefixes Cannot Be Changed',
        description: 'Protects prefixes from modification',
        cost: { currency: 'EXALTED_ORB', amount: 2 }
      },
      suffixLock: {
        name: 'Suffixes Cannot Be Changed',
        description: 'Protects suffixes from modification',
        cost: { currency: 'EXALTED_ORB', amount: 2 }
      }
    };
  }

  private initializeVeiledMods(): Record<string, VeiledMod[]> {
    return {
      weapon: [
        { stat: 'veiledDamage', name: 'Veiled Physical Damage', tier: 1, minValue: 10, maxValue: 20 },
        { stat: 'veiledSpeed', name: 'Veiled Attack Speed', tier: 1, minValue: 5, maxValue: 10 }
      ],
      armor: [
        { stat: 'veiledLife', name: 'Veiled Life', tier: 1, minValue: 20, maxValue: 40 },
        { stat: 'veiledResistance', name: 'Veiled Resistance', tier: 1, minValue: 10, maxValue: 15 }
      ]
    };
  }

  private initializeHybridMods(): Record<string, any> {
    return {
      lifeMana: { name: 'Life and Mana', stats: ['life', 'mana'] },
      damageSpeed: { name: 'Damage and Speed', stats: ['damage', 'speed'] }
    };
  }

  applyMasterCraft(item: any, craftId: string): { success: boolean; item?: any; error?: string } {
    this.stats.totalMasterCrafts++;
    
    const craft = this.masterMods[craftId];
    if (!craft) {
      return { success: false, error: 'Invalid craft ID' };
    }

    if (!item.affixes) item.affixes = [];
    
    item.affixes.push({
      type: 'crafted',
      stat: craft.name,
      value: 1,
      masterCrafted: true
    });

    return { success: true, item };
  }

  addVeiledMod(item: any): { success: boolean; item?: any; error?: string } {
    this.stats.veiledModsAdded++;
    
    if (!item.affixes) item.affixes = [];
    
    item.affixes.push({
      type: 'veiled',
      stat: 'veiledMod',
      value: 0,
      veiled: true
    });

    return { success: true, item };
  }

  unveilMod(item: any, choice: number): { success: boolean; item?: any; error?: string } {
    this.stats.veiledModsUnveiled++;
    
    const veiledIndex = item.affixes.findIndex((affix: any) => affix.veiled);
    if (veiledIndex === -1) {
      return { success: false, error: 'No veiled mod found' };
    }

    item.affixes[veiledIndex] = {
      type: 'prefix',
      stat: 'unveiledMod',
      value: 15 + Math.floor(Math.random() * 20),
      tier: 1
    };

    return { success: true, item };
  }

  getStats(): MasterCraftingStats {
    return { ...this.stats };
  }
}

export default MasterCrafting;