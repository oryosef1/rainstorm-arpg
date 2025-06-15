// crafting-mechanics.ts - Comprehensive Crafting System
import { ItemFactory } from '../inventory/item-factory';
import { CurrencySystem } from './currency-system';

export interface CraftingStats {
  totalAttempts: number;
  successCount: number;
  failureCount: number;
  currencySpent: {
    fossils: number;
    essences: number;
    harvestLifeforce: number;
    benchCurrency: Record<string, number>;
  };
}

export interface FossilType {
  name: string;
  description: string;
  guaranteedMods: string[];
  blockedMods: string[];
}

export interface EssenceTier {
  level: number;
  guaranteedValue: number;
}

export interface EssenceType {
  name: string;
  stat: string;
  itemTypes: string[];
  tiers: EssenceTier[];
}

export interface HarvestCraft {
  name: string;
  description: string;
  cost: { lifeforce: number };
}

export interface BenchRecipe {
  id: string;
  name: string;
  cost: { currency: string; amount: number };
}

export interface BenchRecipes {
  prefix: BenchRecipe[];
  suffix: BenchRecipe[];
  socket: BenchRecipe[];
  quality: BenchRecipe[];
  metamod: BenchRecipe[];
}

export interface CraftingResult {
  success: boolean;
  item?: any;
  error?: string;
  consequence?: string;
  cost?: { currency: string; amount: number };
}

export interface HarvestOptions {
  modType?: string;
  removeType?: string;
  addType?: string;
}

export interface TierRange {
  min: number;
  max: number;
}

export class CraftingMechanics {
  private itemFactory: ItemFactory;
  private currencySystem: CurrencySystem;
  private fossilTypes: Record<string, FossilType>;
  private essenceTypes: Record<string, EssenceType>;
  private harvestCrafts: Record<string, HarvestCraft>;
  private benchRecipes: BenchRecipes;
  private craftingStats: CraftingStats;

  constructor(itemFactory: ItemFactory, currencySystem: CurrencySystem) {
    this.itemFactory = itemFactory;
    this.currencySystem = currencySystem;
    this.fossilTypes = this.initializeFossils();
    this.essenceTypes = this.initializeEssences();
    this.harvestCrafts = this.initializeHarvestCrafts();
    this.benchRecipes = this.initializeBenchRecipes();
    this.craftingStats = {
      totalAttempts: 0,
      successCount: 0,
      failureCount: 0,
      currencySpent: {
        fossils: 0,
        essences: 0,
        harvestLifeforce: 0,
        benchCurrency: {}
      }
    };
  }

  calculateSuccessRate(item: any, operation: string): number {
    const baseRate: Record<string, number> = {
      upgrade: 0.8,
      fossil: 0.9,
      essence: 1.0,
      harvest: 0.85,
      bench: 1.0
    };

    const rate = baseRate[operation] || 0.7;
    const levelPenalty = Math.max(0, (item.itemLevel - 10) * 0.005);
    
    return Math.max(0.1, rate - levelPenalty);
  }

  getFailureConsequences(): string[] {
    return ['destroy', 'downgrade', 'corrupt', 'nothing'];
  }

  applyFailureConsequence(item: any, consequence: string): CraftingResult {
    switch (consequence) {
      case 'destroy':
        return { success: false, consequence: 'destroy', item: null };
      
      case 'downgrade':
        const rarityOrder = ['normal', 'magic', 'rare', 'unique'];
        const currentIndex = rarityOrder.indexOf(item.rarity);
        if (currentIndex > 0) {
          item.rarity = rarityOrder[currentIndex - 1];
          if (item.rarity === 'normal') {
            item.affixes = [];
          } else if (item.rarity === 'magic') {
            item.affixes = Array.isArray(item.affixes) ? item.affixes.slice(0, 2) : [];
          }
        }
        return { success: false, consequence: 'downgrade', item };
      
      case 'corrupt':
        item.corrupted = true;
        if (!item.affixes) item.affixes = [];
        if (Array.isArray(item.affixes)) {
          item.affixes.push({
            type: 'implicit',
            stat: 'corrupted',
            value: 1,
            description: 'Corrupted'
          });
        }
        return { success: false, consequence: 'corrupt', item };
      
      case 'nothing':
      default:
        return { success: false, consequence: 'nothing', item };
    }
  }

  private initializeFossils(): Record<string, FossilType> {
    return {
      PRISTINE_FOSSIL: {
        name: 'Pristine Fossil',
        description: 'More Life modifiers',
        guaranteedMods: ['life', 'lifeRegen', 'lifeLeech'],
        blockedMods: ['mana', 'energyShield']
      },
      DENSE_FOSSIL: {
        name: 'Dense Fossil',
        description: 'More Defence modifiers',
        guaranteedMods: ['armor', 'evasion', 'energyShield', 'block'],
        blockedMods: ['damage', 'criticalStrike']
      },
      SERRATED_FOSSIL: {
        name: 'Serrated Fossil',
        description: 'More Attack modifiers',
        guaranteedMods: ['physicalDamage', 'attackSpeed', 'accuracy'],
        blockedMods: ['spellDamage', 'castSpeed']
      },
      PRISMATIC_FOSSIL: {
        name: 'Prismatic Fossil',
        description: 'More Resistance modifiers',
        guaranteedMods: ['fireResistance', 'coldResistance', 'lightningResistance', 'chaosResistance'],
        blockedMods: ['damage']
      },
      BOUND_FOSSIL: {
        name: 'Bound Fossil',
        description: 'More Minion modifiers',
        guaranteedMods: ['minionDamage', 'minionLife', 'minionSpeed'],
        blockedMods: ['physicalDamage', 'spellDamage']
      },
      PERFECT_FOSSIL: {
        name: 'Perfect Fossil',
        description: 'Improved Quality',
        guaranteedMods: ['quality'],
        blockedMods: []
      }
    };
  }

  private initializeEssences(): Record<string, EssenceType> {
    const essenceTypes: Record<string, EssenceType> = {
      GREED: {
        name: 'Essence of Greed',
        stat: 'life',
        itemTypes: ['helmet', 'bodyArmor', 'shield'],
        tiers: []
      },
      CONTEMPT: {
        name: 'Essence of Contempt',
        stat: 'damage',
        itemTypes: ['weapon', 'gloves'],
        tiers: []
      },
      HATRED: {
        name: 'Essence of Hatred',
        stat: 'coldDamage',
        itemTypes: ['weapon', 'amulet', 'ring'],
        tiers: []
      },
      WOE: {
        name: 'Essence of Woe',
        stat: 'energyShield',
        itemTypes: ['helmet', 'bodyArmor', 'shield', 'boots'],
        tiers: []
      },
      FEAR: {
        name: 'Essence of Fear',
        stat: 'minionDamage',
        itemTypes: ['helmet', 'gloves', 'weapon'],
        tiers: []
      },
      ANGER: {
        name: 'Essence of Anger',
        stat: 'fireDamage',
        itemTypes: ['weapon', 'amulet', 'ring'],
        tiers: []
      },
      TORMENT: {
        name: 'Essence of Torment',
        stat: 'criticalStrike',
        itemTypes: ['weapon', 'gloves', 'amulet'],
        tiers: []
      },
      SORROW: {
        name: 'Essence of Sorrow',
        stat: 'mana',
        itemTypes: ['helmet', 'amulet', 'ring'],
        tiers: []
      }
    };

    Object.values(essenceTypes).forEach(essence => {
      essence.tiers = [];
      for (let i = 1; i <= 7; i++) {
        essence.tiers.push({
          level: i,
          guaranteedValue: i * 10
        });
      }
    });

    return essenceTypes;
  }

  private initializeHarvestCrafts(): Record<string, HarvestCraft> {
    return {
      augment: {
        name: 'Augment',
        description: 'Add a new modifier of a specific type',
        cost: { lifeforce: 100 }
      },
      remove: {
        name: 'Remove',
        description: 'Remove a modifier of a specific type',
        cost: { lifeforce: 150 }
      },
      removeAdd: {
        name: 'Remove/Add',
        description: 'Remove a modifier and add a new one',
        cost: { lifeforce: 200 }
      },
      reforge: {
        name: 'Reforge',
        description: 'Reforge with guaranteed modifier type',
        cost: { lifeforce: 75 }
      },
      divineValues: {
        name: 'Divine Values',
        description: 'Reroll numeric values',
        cost: { lifeforce: 50 }
      },
      socketColors: {
        name: 'Socket Colors',
        description: 'Reforge socket colors',
        cost: { lifeforce: 25 }
      }
    };
  }

  private initializeBenchRecipes(): BenchRecipes {
    return {
      prefix: [
        { id: 'craft_damage', name: '+% Physical Damage', cost: { currency: 'ORB_OF_AUGMENTATION', amount: 4 } },
        { id: 'craft_spell_damage', name: '+% Spell Damage', cost: { currency: 'ORB_OF_ALTERATION', amount: 4 } },
        { id: 'craft_life', name: '+# to Maximum Life', cost: { currency: 'ORB_OF_AUGMENTATION', amount: 3 } },
        { id: 'craft_mana', name: '+# to Maximum Mana', cost: { currency: 'ORB_OF_AUGMENTATION', amount: 2 } }
      ],
      suffix: [
        { id: 'craft_fire_res', name: '+% Fire Resistance', cost: { currency: 'ORB_OF_ALTERATION', amount: 2 } },
        { id: 'craft_cold_res', name: '+% Cold Resistance', cost: { currency: 'ORB_OF_ALTERATION', amount: 2 } },
        { id: 'craft_lightning_res', name: '+% Lightning Resistance', cost: { currency: 'ORB_OF_ALTERATION', amount: 2 } },
        { id: 'craft_all_res', name: '+% All Resistances', cost: { currency: 'CHAOS_ORB', amount: 1 } }
      ],
      socket: [
        { id: 'craft_sockets', name: 'Change Socket Count', cost: { currency: 'JEWELLERS_ORB', amount: 10 } },
        { id: 'craft_links', name: 'Change Socket Links', cost: { currency: 'ORB_OF_FUSING', amount: 10 } },
        { id: 'craft_colors', name: 'Change Socket Colors', cost: { currency: 'CHROMATIC_ORB', amount: 10 } }
      ],
      quality: [
        { id: 'craft_quality', name: 'Quality to 20%', cost: { currency: 'ORB_OF_ALCHEMY', amount: 10 } }
      ],
      metamod: [
        { id: 'prefixes_cannot_be_changed', name: 'Prefixes Cannot Be Changed', cost: { currency: 'EXALTED_ORB', amount: 2 } },
        { id: 'suffixes_cannot_be_changed', name: 'Suffixes Cannot Be Changed', cost: { currency: 'EXALTED_ORB', amount: 2 } },
        { id: 'cannot_roll_attack', name: 'Cannot Roll Attack Modifiers', cost: { currency: 'EXALTED_ORB', amount: 1 } },
        { id: 'cannot_roll_caster', name: 'Cannot Roll Caster Modifiers', cost: { currency: 'EXALTED_ORB', amount: 1 } }
      ]
    };
  }

  getFossilTypes(): Record<string, FossilType> {
    return this.fossilTypes;
  }

  getEssenceTypes(): Record<string, EssenceType> {
    return this.essenceTypes;
  }

  getHarvestCrafts(): Record<string, HarvestCraft> {
    return this.harvestCrafts;
  }

  getBenchRecipes(): BenchRecipes {
    return this.benchRecipes;
  }

  applyFossil(fossilType: string, item: any): CraftingResult {
    this.craftingStats.totalAttempts++;
    this.craftingStats.currencySpent.fossils++;

    const fossil = this.fossilTypes[fossilType];
    if (!fossil) {
      return { success: false, error: 'Invalid fossil type' };
    }

    const successRate = this.calculateSuccessRate(item, 'fossil');
    if (Math.random() > successRate) {
      this.craftingStats.failureCount++;
      const consequences = this.getFailureConsequences();
      const consequence = consequences[Math.floor(Math.random() * consequences.length)];
      return this.applyFailureConsequence(item, consequence);
    }

    this.craftingStats.successCount++;

    if (item.rarity === 'normal' || item.rarity === 'magic') {
      item.rarity = 'rare';
    }

    item.affixes = [];
    const affixCount = 4 + Math.floor(Math.random() * 3);

    const guaranteedMod = fossil.guaranteedMods[Math.floor(Math.random() * fossil.guaranteedMods.length)];
    item.affixes.push({
      type: Math.random() < 0.5 ? 'prefix' : 'suffix',
      stat: guaranteedMod,
      value: 20 + Math.floor(Math.random() * 50),
      tier: Math.floor(Math.random() * 3) + 1,
      fossilMod: true
    });

    const availableStats = this.getAvailableStats().filter(stat => 
      !fossil.blockedMods.includes(stat)
    );

    for (let i = 1; i < affixCount; i++) {
      const stat = availableStats[Math.floor(Math.random() * availableStats.length)];
      const type = i < affixCount / 2 ? 'prefix' : 'suffix';
      
      item.affixes.push({
        type,
        stat,
        value: 10 + Math.floor(Math.random() * 40),
        tier: Math.floor(Math.random() * 5) + 1
      });
    }

    return { success: true, item };
  }

  applyEssence(essenceType: string, tier: number, item: any): CraftingResult {
    this.craftingStats.totalAttempts++;
    this.craftingStats.currencySpent.essences++;

    const essence = this.essenceTypes[essenceType];
    if (!essence || tier < 1 || tier > 7) {
      return { success: false, error: 'Invalid essence or tier' };
    }

    if (!essence.itemTypes.includes(item.type)) {
      return { success: false, error: 'Essence cannot be applied to this item type' };
    }

    this.craftingStats.successCount++;

    item.rarity = 'rare';
    item.affixes = [];

    const guaranteedValue = essence.tiers[tier - 1].guaranteedValue;
    item.affixes.push({
      type: 'prefix',
      stat: essence.stat,
      value: guaranteedValue,
      tier: tier,
      essenceGuaranteed: true
    });

    const affixCount = 3 + Math.floor(Math.random() * 3);
    const availableStats = this.getAvailableStats();

    for (let i = 0; i < affixCount; i++) {
      const stat = availableStats[Math.floor(Math.random() * availableStats.length)];
      const type = i < affixCount / 2 ? 'prefix' : 'suffix';
      
      item.affixes.push({
        type,
        stat,
        value: 10 + Math.floor(Math.random() * 40),
        tier: Math.floor(Math.random() * 5) + 1
      });
    }

    return { success: true, item };
  }

  applyHarvestCraft(craftType: string, item: any, options: HarvestOptions = {}): CraftingResult {
    this.craftingStats.totalAttempts++;
    this.craftingStats.currencySpent.harvestLifeforce += this.harvestCrafts[craftType].cost.lifeforce;

    const successRate = this.calculateSuccessRate(item, 'harvest');
    if (Math.random() > successRate) {
      this.craftingStats.failureCount++;
      return { success: false, error: 'Harvest craft failed' };
    }

    this.craftingStats.successCount++;

    switch (craftType) {
      case 'augment':
        return this.harvestAugment(item, options.modType || '');
      case 'remove':
        return this.harvestRemove(item, options.modType || '');
      case 'removeAdd':
        return this.harvestRemoveAdd(item, options.removeType || '', options.addType || '');
      case 'reforge':
        return this.harvestReforge(item, options.modType || '');
      case 'divineValues':
        return this.harvestDivineValues(item);
      case 'socketColors':
        return this.harvestSocketColors(item);
      default:
        return { success: false, error: 'Invalid harvest craft type' };
    }
  }

  private harvestAugment(item: any, modType: string): CraftingResult {
    if (!item.affixes) item.affixes = [];
    if (item.affixes.length >= 6) {
      return { success: false, error: 'Item has maximum affixes' };
    }

    const modPool = this.getModsByType(modType);
    const newMod = modPool[Math.floor(Math.random() * modPool.length)];

    item.affixes.push({
      type: item.affixes.filter((a: any) => a.type === 'prefix').length < 3 ? 'prefix' : 'suffix',
      stat: newMod,
      value: 20 + Math.floor(Math.random() * 40),
      tier: Math.floor(Math.random() * 3) + 1,
      harvestCrafted: true
    });

    return { success: true, item };
  }

  private harvestRemove(item: any, modType: string): CraftingResult {
    if (!item.affixes || item.affixes.length === 0) {
      return { success: false, error: 'No affixes to remove' };
    }

    const matchingAffixes = item.affixes.filter((affix: any) => 
      affix.stat.toLowerCase().includes(modType.toLowerCase())
    );

    if (matchingAffixes.length === 0) {
      return { success: false, error: `No ${modType} modifiers found` };
    }

    const toRemove = matchingAffixes[Math.floor(Math.random() * matchingAffixes.length)];
    item.affixes = item.affixes.filter((affix: any) => affix !== toRemove);

    return { success: true, item };
  }

  private harvestRemoveAdd(item: any, removeType: string, addType: string): CraftingResult {
    const removeResult = this.harvestRemove(item, removeType);
    if (!removeResult.success) {
      return removeResult;
    }

    return this.harvestAugment(item, addType);
  }

  private harvestReforge(item: any, modType: string): CraftingResult {
    item.affixes = [];
    const affixCount = 4 + Math.floor(Math.random() * 3);

    const modPool = this.getModsByType(modType);
    const guaranteedMod = modPool[Math.floor(Math.random() * modPool.length)];

    item.affixes.push({
      type: 'prefix',
      stat: guaranteedMod,
      value: 25 + Math.floor(Math.random() * 35),
      tier: Math.floor(Math.random() * 3) + 1,
      harvestCrafted: true
    });

    const availableStats = this.getAvailableStats();
    for (let i = 1; i < affixCount; i++) {
      const stat = availableStats[Math.floor(Math.random() * availableStats.length)];
      const type = i < affixCount / 2 ? 'prefix' : 'suffix';
      
      item.affixes.push({
        type,
        stat,
        value: 10 + Math.floor(Math.random() * 40),
        tier: Math.floor(Math.random() * 5) + 1
      });
    }

    return { success: true, item };
  }

  private harvestDivineValues(item: any): CraftingResult {
    if (!item.affixes || item.affixes.length === 0) {
      return { success: false, error: 'No affixes to divine' };
    }

    item.affixes.forEach((affix: any) => {
      const tierRange = this.getTierRange(affix.tier);
      affix.value = tierRange.min + Math.floor(Math.random() * (tierRange.max - tierRange.min + 1));
    });

    return { success: true, item };
  }

  private harvestSocketColors(item: any): CraftingResult {
    if (!item.sockets || item.sockets.length === 0) {
      return { success: false, error: 'Item has no sockets' };
    }

    const colors = ['red', 'green', 'blue'];
    item.sockets.forEach((socket: any) => {
      socket.color = colors[Math.floor(Math.random() * colors.length)];
    });

    return { success: true, item };
  }

  applyBenchCraft(item: any, recipeId: string): CraftingResult {
    this.craftingStats.totalAttempts++;

    if (item.affixes && Array.isArray(item.affixes) && item.affixes.some((affix: any) => affix.benchCrafted)) {
      return { success: false, error: 'Item already has a bench craft' };
    }

    let recipe: BenchRecipe | null = null;
    let category: string | null = null;
    
    for (const [cat, recipes] of Object.entries(this.benchRecipes)) {
      const found = recipes.find(r => r.id === recipeId);
      if (found) {
        recipe = found;
        category = cat;
        break;
      }
    }

    if (!recipe) {
      return { success: false, error: 'Invalid recipe' };
    }

    if (!this.craftingStats.currencySpent.benchCurrency[recipe.cost.currency]) {
      this.craftingStats.currencySpent.benchCurrency[recipe.cost.currency] = 0;
    }
    this.craftingStats.currencySpent.benchCurrency[recipe.cost.currency] += recipe.cost.amount;

    this.craftingStats.successCount++;

    if (category === 'metamod') {
      if (!item.metamods) item.metamods = [];
      item.metamods.push(recipeId);
    } else {
      if (!item.affixes) item.affixes = [];
      
      const value = this.getBenchCraftValue(recipe.name);
      item.affixes.push({
        type: category === 'prefix' ? 'prefix' : 'suffix',
        stat: recipe.name,
        value: value,
        benchCrafted: true
      });
    }

    return { 
      success: true, 
      item,
      cost: recipe.cost
    };
  }

  private getModsByType(modType: string): string[] {
    const modPools: Record<string, string[]> = {
      fire: ['fireDamage', 'fireResistance', 'fireLeech', 'firePenetration'],
      cold: ['coldDamage', 'coldResistance', 'coldLeech', 'coldPenetration'],
      lightning: ['lightningDamage', 'lightningResistance', 'lightningLeech', 'lightningPenetration'],
      physical: ['physicalDamage', 'armor', 'physicalReduction'],
      life: ['life', 'lifeRegen', 'lifeLeech', 'lifeOnHit'],
      defense: ['armor', 'evasion', 'energyShield', 'block']
    };

    return modPools[modType] || ['damage', 'resistance', 'life'];
  }

  private getAvailableStats(): string[] {
    return [
      'damage', 'life', 'mana', 'armor', 'evasion',
      'fireResistance', 'coldResistance', 'lightningResistance',
      'attackSpeed', 'castSpeed', 'critChance', 'critMultiplier',
      'accuracy', 'movementSpeed', 'regen', 'leech'
    ];
  }

  private getTierRange(tier: number): TierRange {
    const ranges: Record<number, TierRange> = {
      1: { min: 10, max: 20 },
      2: { min: 20, max: 35 },
      3: { min: 35, max: 50 },
      4: { min: 50, max: 70 },
      5: { min: 70, max: 90 }
    };
    return ranges[tier] || ranges[1];
  }

  private getBenchCraftValue(craftName: string): number {
    if (craftName.includes('+%')) {
      return 10 + Math.floor(Math.random() * 20);
    } else if (craftName.includes('+#')) {
      return 20 + Math.floor(Math.random() * 40);
    }
    return 20;
  }

  getCraftingStats(): CraftingStats & { successRate: number } {
    return {
      ...this.craftingStats,
      successRate: this.craftingStats.totalAttempts > 0 
        ? this.craftingStats.successCount / this.craftingStats.totalAttempts 
        : 0
    };
  }

  resetStats(): void {
    this.craftingStats = {
      totalAttempts: 0,
      successCount: 0,
      failureCount: 0,
      currencySpent: {
        fossils: 0,
        essences: 0,
        harvestLifeforce: 0,
        benchCurrency: {}
      }
    };
  }
}

export default CraftingMechanics;