// item-corruption.ts - Item Corruption System
import { ItemFactory } from '../inventory/item-factory';

export interface CorruptionOutcome {
  weight: number;
  description: string;
}

export interface CorruptedImplicit {
  stat: string;
  name: string;
  minValue: number;
  maxValue: number;
}

export interface CorruptionStats {
  totalAttempts: number;
  vaalOrbsUsed: number;
  templeCorruptions: number;
  outcomes: {
    nothing: number;
    implicit: number;
    white_sockets: number;
    reroll: number;
    brick: number;
    transform_unique: number;
    destroy: number;
  };
  successfulCorruptions: number;
  brickedItems: number;
  destroyedItems: number;
}

export class ItemCorruption {
  private itemFactory: ItemFactory;
  private corruptionOutcomes: Record<string, CorruptionOutcome>;
  private corruptedImplicits: Record<string, CorruptedImplicit[]>;
  private krangleMods: Record<string, any>;
  private stats: CorruptionStats;

  constructor(itemFactory: ItemFactory) {
    this.itemFactory = itemFactory;
    this.corruptionOutcomes = this.initializeCorruptionOutcomes();
    this.corruptedImplicits = this.initializeCorruptedImplicits();
    this.krangleMods = this.initializeKrangleMods();
    this.stats = {
      totalAttempts: 0,
      vaalOrbsUsed: 0,
      templeCorruptions: 0,
      outcomes: {
        nothing: 0,
        implicit: 0,
        white_sockets: 0,
        reroll: 0,
        brick: 0,
        transform_unique: 0,
        destroy: 0
      },
      successfulCorruptions: 0,
      brickedItems: 0,
      destroyedItems: 0
    };
  }

  private initializeCorruptionOutcomes(): Record<string, CorruptionOutcome> {
    return {
      nothing: { weight: 25, description: 'Item becomes corrupted with no change' },
      implicit: { weight: 25, description: 'Add a corrupted implicit modifier' },
      white_sockets: { weight: 25, description: 'Some sockets turn white' },
      reroll: { weight: 20, description: 'Reroll item to random rare' },
      brick: { weight: 5, description: 'Item becomes unusable (bricked)' }
    };
  }

  private initializeCorruptedImplicits(): Record<string, CorruptedImplicit[]> {
    return {
      weapon: [
        { stat: 'corruptedPhysicalDamage', name: '+% Physical Damage', minValue: 15, maxValue: 30 },
        { stat: 'corruptedAttackSpeed', name: '+% Attack Speed', minValue: 8, maxValue: 12 },
        { stat: 'corruptedCritChance', name: '+% Critical Strike Chance', minValue: 20, maxValue: 40 }
      ],
      bodyArmor: [
        { stat: 'corruptedLife', name: '+# Maximum Life', minValue: 40, maxValue: 60 },
        { stat: 'corruptedAllRes', name: '+% to all Resistances', minValue: 4, maxValue: 8 },
        { stat: 'corruptedPhysReduction', name: '% Physical Damage Reduction', minValue: 3, maxValue: 5 }
      ]
    };
  }

  private initializeKrangleMods(): Record<string, any> {
    return {
      beneficial: [
        { name: 'Increased Damage', value: { min: 10, max: 20 } },
        { name: 'Increased Life', value: { min: 20, max: 40 } }
      ],
      detrimental: [
        { name: 'Reduced Movement Speed', value: { min: -10, max: -5 } },
        { name: 'Increased Mana Cost', value: { min: 10, max: 25 } }
      ]
    };
  }

  vaalOrb(item: any): { success: boolean; item?: any; outcome?: string; error?: string } {
    this.stats.totalAttempts++;
    this.stats.vaalOrbsUsed++;

    if (item.corrupted) {
      return { success: false, error: 'Item is already corrupted' };
    }

    const outcome = this.selectCorruptionOutcome();
    this.stats.outcomes[outcome as keyof typeof this.stats.outcomes]++;

    switch (outcome) {
      case 'nothing':
        item.corrupted = true;
        return { success: true, item, outcome: 'nothing' };

      case 'implicit':
        item.corrupted = true;
        this.addCorruptedImplicit(item);
        this.stats.successfulCorruptions++;
        return { success: true, item, outcome: 'implicit' };

      case 'white_sockets':
        item.corrupted = true;
        this.addWhiteSockets(item);
        this.stats.successfulCorruptions++;
        return { success: true, item, outcome: 'white_sockets' };

      case 'reroll':
        item.corrupted = true;
        this.rerollToRare(item);
        return { success: true, item, outcome: 'reroll' };

      case 'brick':
        item.corrupted = true;
        item.bricked = true;
        this.stats.brickedItems++;
        return { success: true, item, outcome: 'brick' };

      default:
        return { success: false, error: 'Unknown corruption outcome' };
    }
  }

  private selectCorruptionOutcome(): string {
    const totalWeight = Object.values(this.corruptionOutcomes).reduce((sum, outcome) => sum + outcome.weight, 0);
    let roll = Math.random() * totalWeight;

    for (const [outcome, data] of Object.entries(this.corruptionOutcomes)) {
      roll -= data.weight;
      if (roll <= 0) {
        return outcome;
      }
    }

    return 'nothing';
  }

  private addCorruptedImplicit(item: any): void {
    const implicits = this.corruptedImplicits[item.type] || this.corruptedImplicits.weapon;
    const implicitData = implicits[Math.floor(Math.random() * implicits.length)];
    const value = Math.floor(Math.random() * (implicitData.maxValue - implicitData.minValue + 1)) + implicitData.minValue;

    if (!item.corruptedImplicits) item.corruptedImplicits = [];
    item.corruptedImplicits.push({
      stat: implicitData.stat,
      name: implicitData.name,
      value: value
    });
  }

  private addWhiteSockets(item: any): void {
    if (!item.sockets || item.sockets.length === 0) return;

    const socketCount = Math.min(item.sockets.length, Math.floor(Math.random() * 3) + 1);
    for (let i = 0; i < socketCount; i++) {
      const randomIndex = Math.floor(Math.random() * item.sockets.length);
      item.sockets[randomIndex].color = 'white';
    }
  }

  private rerollToRare(item: any): void {
    item.rarity = 'rare';
    item.affixes = this.generateRandomAffixes();
  }

  private generateRandomAffixes(): any[] {
    const affixes = [];
    const affixCount = 4 + Math.floor(Math.random() * 3);

    for (let i = 0; i < affixCount; i++) {
      affixes.push({
        type: i < affixCount / 2 ? 'prefix' : 'suffix',
        stat: 'randomStat',
        value: 10 + Math.floor(Math.random() * 30),
        tier: Math.floor(Math.random() * 5) + 1
      });
    }

    return affixes;
  }

  getStats(): CorruptionStats {
    return { ...this.stats };
  }
}

export default ItemCorruption;