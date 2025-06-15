// currency-system.ts - Currency System for Item Crafting
export type CurrencyRarity = 'common' | 'uncommon' | 'rare' | 'mythic';
export type CurrencyEffect = 
  | 'upgrade_to_magic' 
  | 'reroll_magic' 
  | 'augment_magic' 
  | 'upgrade_to_rare' 
  | 'reroll_rare' 
  | 'upgrade_magic_to_rare'
  | 'downgrade_to_normal' 
  | 'reroll_implicit' 
  | 'reroll_socket_colors' 
  | 'reroll_socket_count' 
  | 'reroll_socket_links'
  | 'add_affix_rare' 
  | 'reroll_values' 
  | 'remove_affix' 
  | 'reroll_unique';

export interface CurrencyType {
  name: string;
  description: string;
  rarity: CurrencyRarity;
  stackSize: number;
  effect: CurrencyEffect;
}

export interface CurrencyItem {
  type: 'currency';
  currencyType: string;
  quantity: number;
  maxStack: number;
  name: string;
  description: string;
  rarity: CurrencyRarity;
}

export interface CurrencyResult {
  success: boolean;
  item?: any;
  error?: string;
}

export interface Affix {
  type: 'prefix' | 'suffix';
  stat: string;
  value: number;
  tier: number;
  min?: number;
  max?: number;
}

export interface DropRates {
  common: number;
  uncommon: number;
  rare: number;
  mythic: number;
}

export class CurrencySystem {
  private currencyTypes: Record<string, CurrencyType>;
  private dropRates: DropRates;

  constructor() {
    this.currencyTypes = this.initializeCurrencyTypes();
    this.dropRates = {
      common: 0.15,
      uncommon: 0.08,
      rare: 0.03,
      mythic: 0.005
    };
  }

  private initializeCurrencyTypes(): Record<string, CurrencyType> {
    return {
      ORB_OF_TRANSMUTATION: {
        name: 'Orb of Transmutation',
        description: 'Upgrades a normal item to magic',
        rarity: 'common',
        stackSize: 40,
        effect: 'upgrade_to_magic'
      },
      ORB_OF_ALTERATION: {
        name: 'Orb of Alteration',
        description: 'Rerolls magic item affixes',
        rarity: 'common',
        stackSize: 30,
        effect: 'reroll_magic'
      },
      ORB_OF_AUGMENTATION: {
        name: 'Orb of Augmentation',
        description: 'Adds affix to magic item',
        rarity: 'common',
        stackSize: 30,
        effect: 'augment_magic'
      },
      ORB_OF_ALCHEMY: {
        name: 'Orb of Alchemy',
        description: 'Upgrades a normal item to rare',
        rarity: 'uncommon',
        stackSize: 20,
        effect: 'upgrade_to_rare'
      },
      CHAOS_ORB: {
        name: 'Chaos Orb',
        description: 'Rerolls rare item affixes',
        rarity: 'uncommon',
        stackSize: 20,
        effect: 'reroll_rare'
      },
      REGAL_ORB: {
        name: 'Regal Orb',
        description: 'Upgrades magic item to rare',
        rarity: 'uncommon',
        stackSize: 20,
        effect: 'upgrade_magic_to_rare'
      },
      ORB_OF_SCOURING: {
        name: 'Orb of Scouring',
        description: 'Downgrades item to normal',
        rarity: 'uncommon',
        stackSize: 30,
        effect: 'downgrade_to_normal'
      },
      BLESSED_ORB: {
        name: 'Blessed Orb',
        description: 'Rerolls implicit modifiers',
        rarity: 'uncommon',
        stackSize: 20,
        effect: 'reroll_implicit'
      },
      CHROMATIC_ORB: {
        name: 'Chromatic Orb',
        description: 'Rerolls socket colors',
        rarity: 'common',
        stackSize: 20,
        effect: 'reroll_socket_colors'
      },
      JEWELLERS_ORB: {
        name: "Jeweller's Orb",
        description: 'Rerolls socket count',
        rarity: 'uncommon',
        stackSize: 20,
        effect: 'reroll_socket_count'
      },
      ORB_OF_FUSING: {
        name: 'Orb of Fusing',
        description: 'Rerolls socket links',
        rarity: 'uncommon',
        stackSize: 20,
        effect: 'reroll_socket_links'
      },
      EXALTED_ORB: {
        name: 'Exalted Orb',
        description: 'Adds affix to rare item',
        rarity: 'rare',
        stackSize: 10,
        effect: 'add_affix_rare'
      },
      DIVINE_ORB: {
        name: 'Divine Orb',
        description: 'Rerolls numeric values of affixes',
        rarity: 'rare',
        stackSize: 10,
        effect: 'reroll_values'
      },
      ANNULMENT_ORB: {
        name: 'Annulment Orb',
        description: 'Removes random affix',
        rarity: 'rare',
        stackSize: 20,
        effect: 'remove_affix'
      },
      ANCIENT_ORB: {
        name: 'Ancient Orb',
        description: 'Rerolls unique item',
        rarity: 'mythic',
        stackSize: 10,
        effect: 'reroll_unique'
      }
    };
  }

  getCurrencyTypes(): Record<string, CurrencyType> {
    return this.currencyTypes;
  }

  createCurrencyItem(currencyType: string, quantity: number = 1): CurrencyItem {
    if (!this.currencyTypes[currencyType]) {
      throw new Error('Invalid currency type');
    }

    const currency = this.currencyTypes[currencyType];
    const actualQuantity = Math.min(quantity, currency.stackSize);

    return {
      type: 'currency',
      currencyType: currencyType,
      quantity: actualQuantity,
      maxStack: currency.stackSize,
      name: currency.name,
      description: currency.description,
      rarity: currency.rarity
    };
  }

  applyCurrency(currencyType: string, item: any): CurrencyResult {
    if (!this.currencyTypes[currencyType]) {
      return { success: false, error: 'Invalid currency type' };
    }

    if (item.type === 'currency') {
      return { success: false, error: 'Cannot apply currency to currency items' };
    }

    const currency = this.currencyTypes[currencyType];
    const effect = currency.effect;

    switch (effect) {
      case 'upgrade_to_magic':
        return this.upgradeToMagic(item);
      case 'reroll_magic':
        return this.rerollMagic(item);
      case 'augment_magic':
        return this.augmentMagic(item);
      case 'upgrade_to_rare':
        return this.upgradeToRare(item);
      case 'reroll_rare':
        return this.rerollRare(item);
      case 'upgrade_magic_to_rare':
        return this.upgradeMagicToRare(item);
      case 'downgrade_to_normal':
        return this.downgradeToNormal(item);
      case 'reroll_implicit':
        return this.rerollImplicit(item);
      case 'reroll_socket_colors':
        return this.rerollSocketColors(item);
      case 'reroll_socket_count':
        return this.rerollSocketCount(item);
      case 'reroll_socket_links':
        return this.rerollSocketLinks(item);
      case 'add_affix_rare':
        return this.addAffixToRare(item);
      case 'reroll_values':
        return this.rerollAffixValues(item);
      case 'remove_affix':
        return this.removeAffix(item);
      case 'reroll_unique':
        return this.rerollUnique(item);
      default:
        return { success: false, error: 'Unknown currency effect' };
    }
  }

  private upgradeToMagic(item: any): CurrencyResult {
    if (item.rarity !== 'normal') {
      return { success: false, error: 'Item must be normal rarity' };
    }

    item.rarity = 'magic';
    item.affixes = this.generateMagicAffixes();
    return { success: true, item };
  }

  private rerollMagic(item: any): CurrencyResult {
    if (item.rarity !== 'magic') {
      return { success: false, error: 'Item must be magic rarity' };
    }

    item.affixes = this.generateMagicAffixes();
    return { success: true, item };
  }

  private augmentMagic(item: any): CurrencyResult {
    if (item.rarity !== 'magic') {
      return { success: false, error: 'Item must be magic rarity' };
    }

    if (!item.affixes) item.affixes = [];
    if (item.affixes.length >= 2) {
      return { success: false, error: 'Magic item already has maximum affixes' };
    }

    const newAffix = this.generateRandomAffix(item.affixes.length === 0 ? 'prefix' : 'suffix');
    item.affixes.push(newAffix);
    return { success: true, item };
  }

  private upgradeToRare(item: any): CurrencyResult {
    if (item.rarity !== 'normal') {
      return { success: false, error: 'Item must be normal rarity' };
    }

    item.rarity = 'rare';
    item.affixes = this.generateRareAffixes();
    return { success: true, item };
  }

  private rerollRare(item: any): CurrencyResult {
    if (item.rarity !== 'rare') {
      return { success: false, error: 'Item must be rare rarity' };
    }

    item.affixes = this.generateRareAffixes();
    return { success: true, item };
  }

  private upgradeMagicToRare(item: any): CurrencyResult {
    if (item.rarity !== 'magic') {
      return { success: false, error: 'Item must be magic rarity' };
    }

    item.rarity = 'rare';
    const additionalAffixes = this.generateRareAffixes().slice(0, 2);
    item.affixes = [...(item.affixes || []), ...additionalAffixes];
    return { success: true, item };
  }

  private downgradeToNormal(item: any): CurrencyResult {
    item.rarity = 'normal';
    item.affixes = [];
    return { success: true, item };
  }

  private rerollImplicit(item: any): CurrencyResult {
    if (item.implicit) {
      const { min, max } = item.implicit;
      item.implicit.value = Math.floor(Math.random() * (max - min + 1)) + min;
    }
    return { success: true, item };
  }

  private rerollSocketColors(item: any): CurrencyResult {
    if (!item.sockets || item.sockets.length === 0) {
      return { success: false, error: 'Item has no sockets' };
    }

    const colors = ['red', 'green', 'blue'];
    item.sockets.forEach((socket: any) => {
      socket.color = colors[Math.floor(Math.random() * colors.length)];
    });
    return { success: true, item };
  }

  private rerollSocketCount(item: any): CurrencyResult {
    if (!item.sockets) {
      item.sockets = [];
    }

    const maxSockets = this.getMaxSockets(item);
    const newCount = Math.floor(Math.random() * maxSockets) + 1;
    
    item.sockets = [];
    for (let i = 0; i < newCount; i++) {
      item.sockets.push({
        color: this.getRandomSocketColor(),
        linked: false
      });
    }
    return { success: true, item };
  }

  private rerollSocketLinks(item: any): CurrencyResult {
    if (!item.sockets || item.sockets.length < 2) {
      return { success: false, error: 'Item needs at least 2 sockets' };
    }

    item.sockets.forEach((socket: any, index: number) => {
      if (index < item.sockets.length - 1) {
        socket.linked = Math.random() < 0.3;
      }
    });
    return { success: true, item };
  }

  private addAffixToRare(item: any): CurrencyResult {
    if (item.rarity !== 'rare') {
      return { success: false, error: 'Item must be rare rarity' };
    }

    if (!item.affixes) item.affixes = [];
    if (item.affixes.length >= 6) {
      return { success: false, error: 'Item already has maximum affixes' };
    }

    const prefixCount = item.affixes.filter((a: Affix) => a.type === 'prefix').length;
    const suffixCount = item.affixes.filter((a: Affix) => a.type === 'suffix').length;
    
    let type: 'prefix' | 'suffix';
    if (prefixCount >= 3) type = 'suffix';
    else if (suffixCount >= 3) type = 'prefix';
    else type = Math.random() < 0.5 ? 'prefix' : 'suffix';

    const newAffix = this.generateRandomAffix(type);
    item.affixes.push(newAffix);
    return { success: true, item };
  }

  private rerollAffixValues(item: any): CurrencyResult {
    if (!item.affixes || item.affixes.length === 0) {
      return { success: false, error: 'Item has no affixes' };
    }

    item.affixes.forEach((affix: any) => {
      if (affix.min !== undefined && affix.max !== undefined) {
        affix.value = Math.floor(Math.random() * (affix.max - affix.min + 1)) + affix.min;
      }
    });
    return { success: true, item };
  }

  private removeAffix(item: any): CurrencyResult {
    if (!item.affixes || item.affixes.length === 0) {
      return { success: false, error: 'Item has no affixes' };
    }

    const randomIndex = Math.floor(Math.random() * item.affixes.length);
    item.affixes.splice(randomIndex, 1);
    return { success: true, item };
  }

  private rerollUnique(item: any): CurrencyResult {
    if (item.rarity !== 'unique') {
      return { success: false, error: 'Item must be unique rarity' };
    }

    return { success: true, item };
  }

  private generateMagicAffixes(): Affix[] {
    const count = Math.random() < 0.5 ? 1 : 2;
    const affixes: Affix[] = [];
    
    if (count >= 1) {
      affixes.push(this.generateRandomAffix('prefix'));
    }
    if (count === 2) {
      affixes.push(this.generateRandomAffix('suffix'));
    }
    
    return affixes;
  }

  private generateRareAffixes(): Affix[] {
    const count = Math.floor(Math.random() * 3) + 4;
    const affixes: Affix[] = [];
    let prefixCount = 0;
    let suffixCount = 0;

    for (let i = 0; i < count; i++) {
      let type: 'prefix' | 'suffix';
      if (prefixCount >= 3) type = 'suffix';
      else if (suffixCount >= 3) type = 'prefix';
      else type = Math.random() < 0.5 ? 'prefix' : 'suffix';

      affixes.push(this.generateRandomAffix(type));
      
      if (type === 'prefix') prefixCount++;
      else suffixCount++;
    }

    return affixes;
  }

  private generateRandomAffix(type: 'prefix' | 'suffix'): Affix {
    const prefixStats = ['damage', 'life', 'mana', 'armor', 'evasion'];
    const suffixStats = ['critChance', 'attackSpeed', 'moveSpeed', 'resistance', 'regen'];
    
    const stats = type === 'prefix' ? prefixStats : suffixStats;
    const stat = stats[Math.floor(Math.random() * stats.length)];
    const tier = Math.floor(Math.random() * 5) + 1;
    const min = tier * 5;
    const max = tier * 10;
    const value = Math.floor(Math.random() * (max - min + 1)) + min;

    return {
      type,
      stat,
      value,
      tier,
      min,
      max
    };
  }

  private getMaxSockets(item: any): number {
    const type = item.type;
    if (type === 'weapon') return 6;
    if (type === 'armor') return 6;
    if (type === 'shield') return 3;
    if (type === 'helmet' || type === 'gloves' || type === 'boots') return 4;
    return 1;
  }

  private getRandomSocketColor(): string {
    const colors = ['red', 'green', 'blue'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  getDropRates(): DropRates {
    return this.dropRates;
  }

  generateCurrencyDrop(areaLevel: number, itemQuantity: number = 1.0): CurrencyItem | null {
    const roll = Math.random();
    const modifiedRoll = roll / itemQuantity;

    let rarityPool: Array<[string, CurrencyType]> = [];
    
    if (modifiedRoll < this.dropRates.common) {
      rarityPool = Object.entries(this.currencyTypes)
        .filter(([_, currency]) => currency.rarity === 'common');
    } else if (modifiedRoll < this.dropRates.uncommon) {
      rarityPool = Object.entries(this.currencyTypes)
        .filter(([_, currency]) => currency.rarity === 'uncommon');
    } else if (modifiedRoll < this.dropRates.rare && areaLevel >= 30) {
      rarityPool = Object.entries(this.currencyTypes)
        .filter(([_, currency]) => currency.rarity === 'rare');
    } else if (modifiedRoll < this.dropRates.mythic && areaLevel >= 60) {
      rarityPool = Object.entries(this.currencyTypes)
        .filter(([_, currency]) => currency.rarity === 'mythic');
    }

    if (rarityPool.length === 0) {
      return null;
    }

    const [currencyType] = rarityPool[Math.floor(Math.random() * rarityPool.length)];
    const quantity = Math.floor(Math.random() * 3) + 1;
    
    return this.createCurrencyItem(currencyType, quantity);
  }

  mergeCurrencyStacks(stack1: CurrencyItem, stack2: CurrencyItem): CurrencyItem & { overflow: number } {
    if (stack1.currencyType !== stack2.currencyType) {
      throw new Error('Cannot merge different currency types');
    }

    const totalQuantity = stack1.quantity + stack2.quantity;
    const maxStack = this.currencyTypes[stack1.currencyType].stackSize;
    const actualQuantity = Math.min(totalQuantity, maxStack);
    const overflow = totalQuantity - actualQuantity;

    const merged = this.createCurrencyItem(stack1.currencyType, actualQuantity);
    (merged as any).overflow = overflow;
    
    return merged as CurrencyItem & { overflow: number };
  }
}

export default CurrencySystem;