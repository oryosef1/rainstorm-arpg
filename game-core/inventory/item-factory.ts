// item-factory.ts - Item Generation and Factory System
import { EventEmitter } from 'events';

export enum ItemRarity {
  NORMAL = 'normal',
  MAGIC = 'magic',
  RARE = 'rare',
  UNIQUE = 'unique',
  LEGENDARY = 'legendary',
  CORRUPTED = 'corrupted'  // Special state that can apply to any rarity
}

export enum ItemType {
  WEAPON = 'weapon',
  ARMOR = 'armor',
  ACCESSORY = 'accessory',
  GEM = 'gem',
  CURRENCY = 'currency',
  FLASK = 'flask',
  MAP = 'map',
  MISC = 'misc'
}

export enum SocketColor {
  RED = 'red',      // Strength
  GREEN = 'green',  // Dexterity
  BLUE = 'blue',    // Intelligence
  WHITE = 'white'   // Any
}

export interface ItemRequirements {
  level: number;
  strength: number;
  dexterity: number;
  intelligence: number;
}

export interface DamageRange {
  min: number;
  max: number;
}

export interface ValueRange {
  min: number;
  max: number;
}

export interface AffixValues {
  [key: string]: number | ValueRange;
}

export interface Affix {
  type: 'prefix' | 'suffix';
  stat: string;
  tier: number;
  values: AffixValues;
  legendary?: boolean;
}

export interface AffixData {
  prefixes: Affix[];
  suffixes: Affix[];
}

export interface SocketData {
  count: number;
  colors: SocketColor[];
  links: number[];
}

export interface BaseItemData {
  name: string;
  subType: string;
  width: number;
  height: number;
  minLevel: number;
  maxLevel: number;
  baseDamage?: number;
  attackSpeed?: number;
  criticalChance?: number;
  baseArmor?: number;
  baseEvasion?: number;
  baseEnergyShield?: number;
}

export interface ItemData {
  id: string;
  name: string;
  type: ItemType;
  subType?: string;
  rarity: ItemRarity;
  width: number;
  height: number;
  itemLevel: number;
  requirements: ItemRequirements;
  stackable: boolean;
  stackSize: number;
  maxStackSize: number;
  weight: number;
  affixes: AffixData;
  sockets: SocketData | null;
  identified: boolean;
  corrupted: boolean;
  quality: number;
  baseDamage?: DamageRange;
  attackSpeed?: number;
  criticalChance?: number;
  baseArmor?: number;
  baseEvasion?: number;
  baseEnergyShield?: number;
  uniqueId?: string;
  fixedAffixes?: Affix[];
  flavorText?: string;
  legendaryEffect?: string;
  glowColor?: string;
  position?: { x: number; y: number };
}

export interface UniqueItemTemplate {
  name: string;
  uniqueId: string;
  type: ItemType;
  subType: string;
  width: number;
  height: number;
  requirements: Partial<ItemRequirements>;
  baseArmor?: number;
  baseEvasion?: number;
  baseEnergyShield?: number;
  fixedAffixes: Array<{
    stat: string;
    value: number | ValueRange | string;
  }>;
  flavorText: string;
}

export interface AffixTier {
  values: AffixValues;
}

export interface AffixTemplate {
  stat: string;
  minLevel: number;
  tiers: AffixTier[];
}

export interface AffixDatabase {
  prefix: {
    [itemType: string]: AffixTemplate[];
  };
  suffix: {
    [itemType: string]: AffixTemplate[];
  };
}

export interface TypeRequirement {
  strength?: number;
  dexterity?: number;
  intelligence?: number;
}

export interface SocketGenerationOptions {
  guaranteedSockets?: number;
  guaranteedLinks?: number;
}

export class ItemFactory extends EventEmitter {
  private affixDatabase: AffixDatabase;
  private uniqueDatabase: Record<string, UniqueItemTemplate>;
  private baseItemDatabase: Record<string, BaseItemData[]>;

  constructor() {
    super();
    this.affixDatabase = this.loadAffixDatabase();
    this.uniqueDatabase = this.loadUniqueDatabase();
    this.baseItemDatabase = this.loadBaseItemDatabase();
  }

  createItem(properties: Partial<ItemData> & { name: string }): ItemData {
    const item: ItemData = {
      id: properties.id || this.generateItemId(),
      name: properties.name,
      type: properties.type || ItemType.MISC,
      subType: properties.subType,
      rarity: properties.rarity || ItemRarity.NORMAL,
      width: properties.width || 1,
      height: properties.height || 1,
      itemLevel: properties.itemLevel || 1,
      requirements: properties.requirements || { level: 1, strength: 0, dexterity: 0, intelligence: 0 },
      stackable: properties.stackable || false,
      stackSize: properties.stackSize || 1,
      maxStackSize: properties.maxStackSize || (properties.type === ItemType.CURRENCY ? 20 : 1),
      weight: properties.weight || 0,
      affixes: properties.affixes || { prefixes: [], suffixes: [] },
      sockets: properties.sockets || null,
      identified: properties.identified !== undefined ? properties.identified : true,
      corrupted: properties.corrupted || false,
      quality: properties.quality || 0,
      ...properties
    };
    
    // Generate requirements if subType is provided
    if (item.subType && !properties.requirements) {
      this.generateRequirements(item);
    }

    this.emit('itemCreated', { item });
    return item;
  }

  createCurrencyItem(name: string, stackSize: number = 1): ItemData {
    return this.createItem({
      name,
      type: ItemType.CURRENCY,
      width: 1,
      height: 1,
      stackable: true,
      stackSize,
      maxStackSize: 20,
      weight: 0.1
    });
  }

  generateRandomWeapon(itemLevel: number, rarity: ItemRarity): ItemData {
    const baseType = this.selectRandomBaseItem(ItemType.WEAPON, itemLevel);
    const weapon = this.createItem({
      ...baseType,
      type: ItemType.WEAPON,
      itemLevel,
      rarity,
      baseDamage: this.calculateBaseDamage(baseType, itemLevel),
      attackSpeed: baseType.attackSpeed || 1.0,
      criticalChance: baseType.criticalChance || 5.0
    });

    this.applyAffixes(weapon, rarity, itemLevel);
    this.generateRequirements(weapon);

    return weapon;
  }

  generateRandomArmor(itemLevel: number, rarity: ItemRarity): ItemData {
    const baseType = this.selectRandomBaseItem(ItemType.ARMOR, itemLevel);
    const armor = this.createItem({
      ...baseType,
      type: ItemType.ARMOR,
      itemLevel,
      rarity,
      baseArmor: this.calculateBaseArmor(baseType, itemLevel),
      baseEvasion: baseType.baseEvasion || 0,
      baseEnergyShield: baseType.baseEnergyShield || 0
    });

    this.applyAffixes(armor, rarity, itemLevel);
    this.generateRequirements(armor);

    return armor;
  }

  createUniqueItem(uniqueName: string): ItemData {
    const template = this.uniqueDatabase[uniqueName.toLowerCase()];
    if (!template) {
      throw new Error(`Unknown unique item: ${uniqueName}`);
    }

    return this.createItem({
      ...template,
      rarity: ItemRarity.UNIQUE,
      uniqueId: template.uniqueId,
      fixedAffixes: template.fixedAffixes.map(affix => ({
        type: 'prefix' as const,
        stat: affix.stat,
        tier: 1,
        values: typeof affix.value === 'object' ? affix.value : { value: affix.value }
      })),
      flavorText: template.flavorText,
      identified: true
    });
  }

  createLegendaryItem(itemLevel: number, baseType: BaseItemData): ItemData {
    const legendary = this.createItem({
      ...baseType,
      rarity: ItemRarity.LEGENDARY,
      itemLevel: Math.max(60, itemLevel), // Legendary items are at least level 60
      quality: 20, // Legendary items always have max quality
      identified: false, // Need to identify to reveal properties
      legendaryEffect: this.rollLegendaryEffect(baseType.subType || 'weapon'),
      glowColor: this.getLegendaryGlowColor()
    });

    // Generate exceptional affixes for legendary items
    this.applyLegendaryAffixes(legendary, itemLevel);

    // Legendary items always have maximum sockets with guaranteed links
    if (legendary.type === ItemType.WEAPON || legendary.type === ItemType.ARMOR) {
      const maxSockets = this.calculateMaxSockets(legendary);
      legendary.sockets = this.generateSockets(legendary, {
        guaranteedSockets: maxSockets,
        guaranteedLinks: Math.max(5, maxSockets - 1) // At least 5-link
      });
    }

    return legendary;
  }

  rollLegendaryEffect(itemType: string): string {
    const effects: Record<string, string[]> = {
      weapon: [
        'Enemies killed explode, dealing 10% of their life as fire damage',
        'Critical strikes freeze enemies as though dealing 300% more damage',
        'Gain Rampage on kill',
        'Your hits intimidate enemies for 4 seconds'
      ],
      armor: [
        'You cannot be frozen',
        'Regenerate 2% of life per second',
        'Nearby enemies are blinded',
        '10% of damage taken gained as mana over 4 seconds'
      ],
      accessory: [
        'Grants level 20 Aspect of the Spider skill',
        'Enemies near you take 10% increased elemental damage',
        'You have Onslaught while you have Fortify',
        'Gain an Endurance, Frenzy or Power charge every 5 seconds'
      ]
    };

    const typeEffects = effects[itemType] || effects.accessory;
    return typeEffects[Math.floor(Math.random() * typeEffects.length)];
  }

  getLegendaryGlowColor(): string {
    const colors = ['#FFD700', '#FF4500', '#9400D3', '#00CED1'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  applyLegendaryAffixes(item: ItemData, itemLevel: number): void {
    const affixCount = this.rollAffixCount(ItemRarity.LEGENDARY);
    const limits = this.getMaxAffixes(ItemRarity.LEGENDARY);
    
    let prefixCount = 0;
    let suffixCount = 0;

    for (let i = 0; i < affixCount; i++) {
      const usePrefix = (Math.random() < 0.5 && prefixCount < limits.prefix) || suffixCount >= limits.suffix;
      
      if (usePrefix) {
        const prefix = this.rollLegendaryAffix('prefix', item.type, itemLevel);
        item.affixes.prefixes.push(prefix);
        prefixCount++;
      } else {
        const suffix = this.rollLegendaryAffix('suffix', item.type, itemLevel);
        item.affixes.suffixes.push(suffix);
        suffixCount++;
      }
    }
  }

  rollLegendaryAffix(type: 'prefix' | 'suffix', itemType: ItemType, itemLevel: number): Affix {
    // Legendary affixes are always top tier with enhanced values
    const affix = this.rollAffix(type, itemType, itemLevel);
    
    // Enhance the values by 20-50%
    const enhancement = 1.2 + Math.random() * 0.3;
    for (const key in affix.values) {
      if (typeof affix.values[key] === 'number') {
        affix.values[key] = Math.floor((affix.values[key] as number) * enhancement);
      } else if (typeof affix.values[key] === 'object' && 'min' in affix.values[key]) {
        const range = affix.values[key] as ValueRange;
        affix.values[key] = {
          min: Math.floor(range.min * enhancement),
          max: Math.floor(range.max * enhancement)
        };
      }
    }
    
    affix.legendary = true;
    return affix;
  }

  generateSockets(item: ItemData, options: SocketGenerationOptions = {}): SocketData {
    const maxSockets = this.calculateMaxSockets(item);
    let count = options.guaranteedSockets || this.rollSocketCount(maxSockets, item.itemLevel);
    
    // Ensure we have enough sockets for guaranteed links
    if (options.guaranteedLinks && count < options.guaranteedLinks) {
      count = Math.min(options.guaranteedLinks, maxSockets);
    }
    
    const sockets: SocketData = {
      count,
      colors: [],
      links: []
    };

    // Generate socket colors based on requirements
    for (let i = 0; i < count; i++) {
      sockets.colors.push(this.rollSocketColor(item.requirements));
    }

    // Generate links
    if (options.guaranteedLinks) {
      sockets.links = this.createLinkedSockets(count, options.guaranteedLinks);
    } else {
      sockets.links = this.rollSocketLinks(count, item.itemLevel);
    }

    return sockets;
  }

  rollItemRarity(itemLevel: number, rarityBonus: number = 0): ItemRarity {
    const roll = Math.random() * 100;
    const adjustedRoll = roll * (1 + rarityBonus / 100);
    
    // Legendary items are extremely rare and only drop at high levels
    if (itemLevel >= 60 && adjustedRoll > 199.8) return ItemRarity.LEGENDARY; // Made much rarer
    if (adjustedRoll > 99.5) return ItemRarity.UNIQUE;
    if (adjustedRoll > 90) return ItemRarity.RARE;
    if (adjustedRoll > 60) return ItemRarity.MAGIC;
    return ItemRarity.NORMAL;
  }

  addAffix(item: ItemData, affix: Affix): ItemData | null {
    const affixType = affix.type;
    
    // Initialize affixes if needed
    if (!item.affixes) {
      item.affixes = { prefixes: [], suffixes: [] };
    }
    if (!item.affixes.prefixes) {
      item.affixes.prefixes = [];
    }
    if (!item.affixes.suffixes) {
      item.affixes.suffixes = [];
    }
    
    const affixList = affixType === 'prefix' ? item.affixes.prefixes : item.affixes.suffixes;
    
    // Check affix limits
    const maxAffixes = this.getMaxAffixes(item.rarity);
    const maxForType = affixType === 'prefix' ? maxAffixes.prefix : maxAffixes.suffix;
    if (!maxForType || affixList.length >= maxForType) {
      return null;
    }

    // Add affix
    affixList.push(affix);

    // Update rarity if needed
    if (item.rarity === ItemRarity.NORMAL && (item.affixes.prefixes.length + item.affixes.suffixes.length) > 0) {
      item.rarity = ItemRarity.MAGIC;
    }

    return item;
  }

  rerollValues(item: ItemData): ItemData {
    const newItem = { ...item };
    // Deep clone affixes
    newItem.affixes = {
      prefixes: item.affixes.prefixes.map(affix => ({
        ...affix,
        values: this.rollAffixValues(affix)
      })),
      suffixes: item.affixes.suffixes.map(affix => ({
        ...affix,
        values: this.rollAffixValues(affix)
      }))
    };
    return newItem;
  }

  // Private helper methods
  private generateItemId(): string {
    return `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateBaseDamage(baseType: BaseItemData, itemLevel: number): DamageRange {
    const baseDamage = baseType.baseDamage || 5;
    const minDamage = Math.floor(baseDamage * (1 + itemLevel / 100));
    const maxDamage = Math.floor(minDamage * 1.5);
    return { min: minDamage, max: maxDamage };
  }

  private calculateBaseArmor(baseType: BaseItemData, itemLevel: number): number {
    const baseValue = baseType.baseArmor || 10;
    return Math.floor(baseValue * (1 + itemLevel / 50));
  }

  private selectRandomBaseItem(type: ItemType, itemLevel: number): BaseItemData {
    const validBases = this.baseItemDatabase[type].filter(base => 
      base.minLevel <= itemLevel && base.maxLevel >= itemLevel
    );
    if (validBases.length === 0) {
      // Return a default base item if none found
      return this.baseItemDatabase[type][0];
    }
    return validBases[Math.floor(Math.random() * validBases.length)];
  }

  private applyAffixes(item: ItemData, rarity: ItemRarity, itemLevel: number): void {
    const limits = this.getMaxAffixes(rarity);
    const totalAffixes = this.rollAffixCount(rarity);
    
    let prefixCount = 0;
    let suffixCount = 0;

    for (let i = 0; i < totalAffixes; i++) {
      const usePrefix = (Math.random() < 0.5 && prefixCount < limits.prefix) || suffixCount >= limits.suffix;
      
      if (usePrefix) {
        const prefix = this.rollAffix('prefix', item.type, itemLevel);
        item.affixes.prefixes.push(prefix);
        prefixCount++;
      } else {
        const suffix = this.rollAffix('suffix', item.type, itemLevel);
        item.affixes.suffixes.push(suffix);
        suffixCount++;
      }
    }
  }

  private getMaxAffixes(rarity: ItemRarity): { prefix: number; suffix: number } {
    switch (rarity) {
      case ItemRarity.NORMAL: return { prefix: 0, suffix: 0 };
      case ItemRarity.MAGIC: return { prefix: 1, suffix: 1 };
      case ItemRarity.RARE: return { prefix: 3, suffix: 3 };
      case ItemRarity.UNIQUE: return { prefix: 0, suffix: 0 }; // Fixed affixes
      case ItemRarity.LEGENDARY: return { prefix: 4, suffix: 4 }; // More than rare
      default: return { prefix: 0, suffix: 0 };
    }
  }

  private rollAffixCount(rarity: ItemRarity): number {
    switch (rarity) {
      case ItemRarity.NORMAL: return 0;
      case ItemRarity.MAGIC: return Math.random() < 0.5 ? 1 : 2;
      case ItemRarity.RARE: return 4 + Math.floor(Math.random() * 3); // 4-6
      case ItemRarity.LEGENDARY: return 6 + Math.floor(Math.random() * 3); // 6-8
      default: return 0;
    }
  }

  private rollAffix(type: 'prefix' | 'suffix', itemType: ItemType, itemLevel: number): Affix {
    if (!this.affixDatabase[type] || !this.affixDatabase[type][itemType]) {
      // Use a default affix if type not found
      return {
        type,
        stat: 'genericBonus',
        tier: 1,
        values: { value: Math.floor(Math.random() * 10) + 1 }
      };
    }
    
    const validAffixes = this.affixDatabase[type][itemType].filter(affix => 
      affix.minLevel <= itemLevel
    );
    
    if (validAffixes.length === 0) {
      return {
        type,
        stat: 'genericBonus',
        tier: 1,
        values: { value: Math.floor(Math.random() * 10) + 1 }
      };
    }
    
    const affix = validAffixes[Math.floor(Math.random() * validAffixes.length)];
    const tier = this.rollAffixTier(affix, itemLevel);
    
    return {
      type,
      stat: affix.stat,
      tier,
      values: this.rollAffixValues({ ...affix, tier })
    };
  }

  private rollAffixTier(affix: AffixTemplate, itemLevel: number): number {
    // Higher item levels can roll better tiers
    const maxTier = Math.min(affix.tiers.length, Math.floor(itemLevel / 20) + 1);
    return Math.floor(Math.random() * maxTier) + 1;
  }

  private rollAffixValues(affix: AffixTemplate & { tier: number }): AffixValues {
    const values: AffixValues = {};
    const tierData = affix.tiers ? affix.tiers[affix.tier - 1] : affix;
    
    for (const key in tierData.values) {
      const range = tierData.values[key];
      if (typeof range === 'object' && 'min' in range) {
        const valueRange = range as ValueRange;
        values[key] = valueRange.min + Math.floor(Math.random() * (valueRange.max - valueRange.min + 1));
      } else {
        values[key] = range as number;
      }
    }
    
    return values;
  }

  rerollAffixValues(affix: Affix): Affix {
    return {
      ...affix,
      values: this.rollAffixValues(affix as any)
    };
  }

  private generateRequirements(item: ItemData): void {
    const level = Math.max(1, Math.floor(item.itemLevel * 0.8));
    
    // Base requirements on item type
    let str = 0, dex = 0, int = 0;
    
    if (item.subType) {
      const typeReqs = this.getTypeRequirements(item.subType);
      str = typeReqs.strength || 0;
      dex = typeReqs.dexterity || 0;
      int = typeReqs.intelligence || 0;
    }

    // Scale with item level
    item.requirements = {
      level,
      strength: Math.floor(str * (1 + item.itemLevel / 100)),
      dexterity: Math.floor(dex * (1 + item.itemLevel / 100)),
      intelligence: Math.floor(int * (1 + item.itemLevel / 100))
    };
  }

  private getTypeRequirements(subType: string): TypeRequirement {
    const requirements: Record<string, TypeRequirement> = {
      // Weapons
      'sword': { strength: 20, dexterity: 20 },
      'axe': { strength: 30 },
      'mace': { strength: 35 },
      'dagger': { dexterity: 30, intelligence: 10 },
      'claw': { dexterity: 25, intelligence: 15 },
      'bow': { dexterity: 40 },
      'wand': { intelligence: 30 },
      'staff': { intelligence: 35, strength: 15 },
      
      // Armor
      'body_armor_str': { strength: 40 },
      'body_armor_dex': { dexterity: 40 },
      'body_armor_int': { intelligence: 40 },
      'helmet': { strength: 15, dexterity: 15 },
      'gloves': { dexterity: 20 },
      'boots': { strength: 10, dexterity: 10 }
    };
    
    return requirements[subType] || { strength: 0, dexterity: 0, intelligence: 0 };
  }

  private calculateMaxSockets(item: ItemData): number {
    const size = item.width * item.height;
    if (size >= 8) return 6;  // 2x4 or larger
    if (size >= 6) return 4;  // 2x3
    if (size >= 4) return 3;  // 2x2
    if (size >= 2) return 2;  // 1x2
    return 1;                 // 1x1
  }

  private rollSocketCount(maxSockets: number, itemLevel: number): number {
    const chance = Math.min(90, itemLevel);
    let sockets = 1;
    
    for (let i = 2; i <= maxSockets; i++) {
      if (Math.random() * 100 < chance - (i - 1) * 15) {
        sockets = i;
      } else {
        break;
      }
    }
    
    return sockets;
  }

  private rollSocketColor(requirements: ItemRequirements): SocketColor {
    const total = requirements.strength + requirements.dexterity + requirements.intelligence;
    if (total === 0) return SocketColor.WHITE;
    
    const roll = Math.random() * total;
    if (roll < requirements.strength) return SocketColor.RED;
    if (roll < requirements.strength + requirements.dexterity) return SocketColor.GREEN;
    return SocketColor.BLUE;
  }

  private createLinkedSockets(count: number, guaranteedLinks: number): number[] {
    const links = Array(count).fill(0).map((_, i) => i);
    
    // Create guaranteed link groups
    for (let i = 0; i < Math.min(guaranteedLinks, count) - 1; i++) {
      links[i + 1] = 0; // All link to first socket
    }
    
    return links;
  }

  private rollSocketLinks(count: number, itemLevel: number): number[] {
    const links = Array(count).fill(0).map((_, i) => i);
    const linkChance = Math.min(50, itemLevel / 2);
    
    for (let i = 1; i < count; i++) {
      if (Math.random() * 100 < linkChance) {
        links[i] = links[i - 1];
      }
    }
    
    return links;
  }

  // Database loaders (simplified for testing)
  private loadAffixDatabase(): AffixDatabase {
    return {
      prefix: {
        weapon: [
          {
            stat: 'addedPhysicalDamage',
            minLevel: 1,
            tiers: [
              { values: { min: { min: 1, max: 2 }, max: { min: 3, max: 5 } } },
              { values: { min: { min: 3, max: 5 }, max: { min: 7, max: 10 } } },
              { values: { min: { min: 5, max: 8 }, max: { min: 12, max: 15 } } }
            ]
          },
          {
            stat: 'increasedPhysicalDamage',
            minLevel: 5,
            tiers: [
              { values: { value: { min: 10, max: 20 } } },
              { values: { value: { min: 20, max: 35 } } },
              { values: { value: { min: 35, max: 50 } } }
            ]
          }
        ],
        armor: [
          {
            stat: 'addedArmor',
            minLevel: 1,
            tiers: [
              { values: { value: { min: 5, max: 10 } } },
              { values: { value: { min: 10, max: 20 } } },
              { values: { value: { min: 20, max: 35 } } }
            ]
          },
          {
            stat: 'increasedArmor',
            minLevel: 10,
            tiers: [
              { values: { value: { min: 10, max: 20 } } },
              { values: { value: { min: 20, max: 35 } } },
              { values: { value: { min: 35, max: 50 } } }
            ]
          }
        ],
        accessory: [
          {
            stat: 'addedLife',
            minLevel: 1,
            tiers: [
              { values: { value: { min: 10, max: 20 } } },
              { values: { value: { min: 20, max: 35 } } },
              { values: { value: { min: 35, max: 50 } } }
            ]
          }
        ]
      },
      suffix: {
        weapon: [
          {
            stat: 'attackSpeed',
            minLevel: 1,
            tiers: [
              { values: { value: { min: 5, max: 8 } } },
              { values: { value: { min: 8, max: 12 } } },
              { values: { value: { min: 12, max: 15 } } }
            ]
          },
          {
            stat: 'criticalChance',
            minLevel: 10,
            tiers: [
              { values: { value: { min: 10, max: 15 } } },
              { values: { value: { min: 15, max: 25 } } },
              { values: { value: { min: 25, max: 35 } } }
            ]
          }
        ],
        armor: [
          {
            stat: 'fireResistance',
            minLevel: 1,
            tiers: [
              { values: { value: { min: 10, max: 15 } } },
              { values: { value: { min: 15, max: 25 } } },
              { values: { value: { min: 25, max: 35 } } }
            ]
          },
          {
            stat: 'coldResistance',
            minLevel: 1,
            tiers: [
              { values: { value: { min: 10, max: 15 } } },
              { values: { value: { min: 15, max: 25 } } },
              { values: { value: { min: 25, max: 35 } } }
            ]
          }
        ],
        accessory: [
          {
            stat: 'allResistances',
            minLevel: 15,
            tiers: [
              { values: { value: { min: 5, max: 8 } } },
              { values: { value: { min: 8, max: 12 } } },
              { values: { value: { min: 12, max: 15 } } }
            ]
          }
        ]
      }
    };
  }

  private loadUniqueDatabase(): Record<string, UniqueItemTemplate> {
    return {
      'headhunter': {
        name: 'Headhunter',
        uniqueId: 'headhunter',
        type: ItemType.ACCESSORY,
        subType: 'belt',
        width: 2,
        height: 1,
        requirements: { level: 40 },
        fixedAffixes: [
          { stat: 'life', value: { min: 25, max: 40 } },
          { stat: 'strengthDexterity', value: { min: 40, max: 55 } },
          { stat: 'rareMonsterMods', value: 'When you Kill a Rare monster, you gain its mods for 20 seconds' }
        ],
        flavorText: 'A thrilling gift.'
      },
      'shavronne\'s wrappings': {
        name: 'Shavronne\'s Wrappings',
        uniqueId: 'shavronnes_wrappings',
        type: ItemType.ARMOR,
        subType: 'body_armor_int',
        width: 2,
        height: 3,
        requirements: { level: 62, intelligence: 146 },
        baseEnergyShield: 380,
        fixedAffixes: [
          { stat: 'energyShield', value: { min: 140, max: 200 } },
          { stat: 'lightningResistance', value: { min: 30, max: 40 } },
          { stat: 'chaosImmunity', value: 'Chaos Damage does not bypass Energy Shield' }
        ],
        flavorText: 'Shavronne\'s apparel became ever more extravagant as her body and soul became ever more corrupted.'
      }
    };
  }

  private loadBaseItemDatabase(): Record<string, BaseItemData[]> {
    return {
      weapon: [
        {
          name: 'Rusted Sword',
          subType: 'sword',
          width: 1,
          height: 3,
          minLevel: 1,
          maxLevel: 20,
          baseDamage: 5,
          attackSpeed: 1.4,
          criticalChance: 5
        },
        {
          name: 'Iron Sword',
          subType: 'sword',
          width: 1,
          height: 3,
          minLevel: 10,
          maxLevel: 40,
          baseDamage: 12,
          attackSpeed: 1.4,
          criticalChance: 5
        },
        {
          name: 'Steel Sword',
          subType: 'sword',
          width: 1,
          height: 3,
          minLevel: 30,
          maxLevel: 60,
          baseDamage: 25,
          attackSpeed: 1.4,
          criticalChance: 5
        },
        {
          name: 'Eternal Sword',
          subType: 'sword',
          width: 1,
          height: 3,
          minLevel: 50,
          maxLevel: 100,
          baseDamage: 45,
          attackSpeed: 1.4,
          criticalChance: 5
        },
        {
          name: 'Short Bow',
          subType: 'bow',
          width: 2,
          height: 3,
          minLevel: 1,
          maxLevel: 100,
          baseDamage: 8,
          attackSpeed: 1.5,
          criticalChance: 6
        },
        {
          name: 'Driftwood Wand',
          subType: 'wand',
          width: 1,
          height: 2,
          minLevel: 1,
          maxLevel: 100,
          baseDamage: 4,
          attackSpeed: 1.2,
          criticalChance: 7
        }
      ],
      armor: [
        {
          name: 'Plate Vest',
          subType: 'body_armor_str',
          width: 2,
          height: 3,
          minLevel: 1,
          maxLevel: 25,
          baseArmor: 20,
          baseEvasion: 0,
          baseEnergyShield: 0
        },
        {
          name: 'Scale Vest',
          subType: 'body_armor_str',
          width: 2,
          height: 3,
          minLevel: 20,
          maxLevel: 45,
          baseArmor: 65,
          baseEvasion: 0,
          baseEnergyShield: 0
        },
        {
          name: 'Full Plate',
          subType: 'body_armor_str',
          width: 2,
          height: 3,
          minLevel: 40,
          maxLevel: 100,
          baseArmor: 150,
          baseEvasion: 0,
          baseEnergyShield: 0
        },
        {
          name: 'Shabby Jerkin',
          subType: 'body_armor_dex',
          width: 2,
          height: 3,
          minLevel: 1,
          maxLevel: 25,
          baseArmor: 0,
          baseEvasion: 25,
          baseEnergyShield: 0
        },
        {
          name: 'Leather Tunic',
          subType: 'body_armor_dex',
          width: 2,
          height: 3,
          minLevel: 20,
          maxLevel: 45,
          baseArmor: 0,
          baseEvasion: 75,
          baseEnergyShield: 0
        },
        {
          name: 'Assassin\'s Garb',
          subType: 'body_armor_dex',
          width: 2,
          height: 3,
          minLevel: 40,
          maxLevel: 100,
          baseArmor: 0,
          baseEvasion: 180,
          baseEnergyShield: 0
        },
        {
          name: 'Simple Robe',
          subType: 'body_armor_int',
          width: 2,
          height: 3,
          minLevel: 1,
          maxLevel: 25,
          baseArmor: 0,
          baseEvasion: 0,
          baseEnergyShield: 15
        },
        {
          name: 'Scholar\'s Robe',
          subType: 'body_armor_int',
          width: 2,
          height: 3,
          minLevel: 20,
          maxLevel: 45,
          baseArmor: 0,
          baseEvasion: 0,
          baseEnergyShield: 50
        },
        {
          name: 'Occultist\'s Vestment',
          subType: 'body_armor_int',
          width: 2,
          height: 3,
          minLevel: 40,
          maxLevel: 100,
          baseArmor: 0,
          baseEvasion: 0,
          baseEnergyShield: 120
        }
      ],
      accessory: [
        {
          name: 'Iron Ring',
          subType: 'ring',
          width: 1,
          height: 1,
          minLevel: 1,
          maxLevel: 100
        },
        {
          name: 'Leather Belt',
          subType: 'belt',
          width: 2,
          height: 1,
          minLevel: 1,
          maxLevel: 100
        }
      ]
    };
  }
}

export default ItemFactory;