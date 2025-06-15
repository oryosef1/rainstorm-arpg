// RainStorm ARPG - Item Generation System
// Advanced item generation with Claude integration and balance validation

import { ClaudeContentEngine, GeneratedContent } from './claude-engine';
import { GameContextManager } from './game-context';
import { IWorld, IEntity } from '../ecs/ecs-core';

export interface ItemAffix {
  id: string;
  type: 'prefix' | 'suffix';
  name: string;
  tier: number;
  description: string;
  effect: string;
  values: Record<string, number>;
  rarity: 'normal' | 'magic' | 'rare' | 'unique';
  levelRequirement: number;
  tags: string[];
}

export interface ItemRequirements {
  level: number;
  strength?: number;
  dexterity?: number;
  intelligence?: number;
  questCompletion?: string[];
  reputation?: Record<string, number>;
  location?: string;
}

export interface ItemStats {
  damage?: string;
  armor?: number;
  energyShield?: number;
  criticalChance?: number;
  criticalMultiplier?: number;
  attackSpeed?: number;
  accuracy?: number;
  evasion?: number;
  blockChance?: number;
  movementSpeed?: number;
  life?: number;
  mana?: number;
  resistances?: Record<string, number>;
}

export interface ItemVisual {
  model: string;
  texture: string;
  colorPrimary: string;
  colorSecondary?: string;
  effects: string[];
  glowIntensity: number;
  particleEffects?: string[];
  soundEffects?: string[];
}

export interface ItemLore {
  title: string;
  story: string;
  origin: string;
  previousOwners?: string[];
  historicalSignificance?: string;
  mysteries?: string[];
}

export interface GeneratedItem {
  id: string;
  name: string;
  baseType: string;
  itemClass: 'weapon' | 'armor' | 'accessory' | 'consumable' | 'material' | 'quest';
  subType: string;
  itemLevel: number;
  rarity: 'normal' | 'magic' | 'rare' | 'unique' | 'legendary';
  quality: number;
  stats: ItemStats;
  affixes: ItemAffix[];
  requirements: ItemRequirements;
  durability: { current: number; maximum: number };
  value: { vendor: number; market: number; trade: number };
  visual: ItemVisual;
  lore?: ItemLore;
  tags: string[];
  metadata: ItemMetadata;
}

export interface ItemMetadata {
  generatedAt: number;
  generationType: 'drop' | 'craft' | 'reward' | 'unique';
  sourceEvent: string;
  playerContext: Record<string, any>;
  dropSource?: string;
  balanceData: ItemBalanceData;
  qualityMetrics: ItemQualityMetrics;
  craftingInfo?: CraftingInfo;
}

export interface ItemBalanceData {
  powerLevel: number;
  tierAppropriate: boolean;
  statBalance: number;
  economicValue: number;
  rarityJustified: boolean;
  buildRelevance: number;
}

export interface ItemQualityMetrics {
  statCoherence: number;
  loreQuality: number;
  visualAppeal: number;
  mechanicalBalance: number;
  playerRelevance: number;
  overall: number;
}

export interface CraftingInfo {
  materials: Array<{ id: string; quantity: number }>;
  skill: string;
  skillLevel: number;
  craftingTime: number;
  successChance: number;
}

export interface ItemGenerationRequest {
  type: 'random_drop' | 'boss_drop' | 'chest_loot' | 'craft_result' | 'quest_reward' | 'vendor_stock';
  parameters: Record<string, any>;
  constraints: ItemConstraints;
  priority: 'low' | 'medium' | 'high' | 'critical';
  requester: string;
}

export interface ItemConstraints {
  itemClass?: 'weapon' | 'armor' | 'accessory' | 'consumable';
  subTypes?: string[];
  rarityRange: { min: string; max: string };
  levelRange: { min: number; max: number };
  statFocus?: string[];
  forbiddenAffixes?: string[];
  valueRange?: { min: number; max: number };
  themeRestrictions?: string[];
}

export class ItemGenerator {
  private claudeEngine: ClaudeContentEngine;
  private gameContext: GameContextManager;
  private world: IWorld;
  private itemTemplates: Map<string, ItemTemplate> = new Map();
  private affixDatabase: Map<string, ItemAffix> = new Map();
  private itemValidator: ItemValidator;
  private balanceCalculator: ItemBalanceCalculator;
  private economyManager: ItemEconomyManager;
  private generationStats: ItemGenerationStats;

  constructor(claudeEngine: ClaudeContentEngine, gameContext: GameContextManager, world: IWorld) {
    this.claudeEngine = claudeEngine;
    this.gameContext = gameContext;
    this.world = world;
    this.itemValidator = new ItemValidator();
    this.balanceCalculator = new ItemBalanceCalculator();
    this.economyManager = new ItemEconomyManager();
    this.generationStats = new ItemGenerationStats();

    this.loadItemTemplates();
    this.loadAffixDatabase();
    console.log('⚔️ Item Generator initialized - Ready for infinite item generation');
  }

  // =============================================================================
  // MAIN ITEM GENERATION API
  // =============================================================================

  public async generateItem(request: ItemGenerationRequest): Promise<GeneratedItem> {
    const startTime = performance.now();
    
    try {
      console.log(`🎲 Generating ${request.type} item with rarity: ${request.constraints.rarityRange?.max || 'any'}`);

      // Build comprehensive parameters for Claude
      const enrichedParams = await this.buildItemParameters(request);

      // Generate item content using Claude
      const generatedContent = await this.claudeEngine.generateContent('item', enrichedParams, {
        priority: request.priority,
        requester: `item_generator_${request.type}`
      });

      // Parse and structure the item
      const structuredItem = this.parseItemContent(generatedContent, request);

      // Apply affixes and calculate final stats
      await this.applyAffixes(structuredItem, enrichedParams);

      // Validate item quality and balance
      const validation = await this.validateItem(structuredItem, request);
      if (validation.overall < 0.75) {
        console.warn(`⚠️ Item quality below threshold (${validation.overall}), improving...`);
        await this.improveItem(structuredItem, validation);
      }

      // Calculate economic value
      this.economyManager.calculateItemValue(structuredItem);

      // Calculate final balance metrics
      const balanceData = this.balanceCalculator.calculateItemBalance(structuredItem, enrichedParams);
      structuredItem.metadata.balanceData = balanceData;
      structuredItem.metadata.qualityMetrics = validation;

      // Update generation statistics
      const generationTime = performance.now() - startTime;
      this.generationStats.recordGeneration(request.type, generationTime, true);

      console.log(`✅ Item generated: "${structuredItem.name}" (${structuredItem.rarity}, ${generationTime.toFixed(2)}ms)`);
      return structuredItem;

    } catch (error) {
      const generationTime = performance.now() - startTime;
      this.generationStats.recordGeneration(request.type, generationTime, false);
      
      console.error(`❌ Item generation failed:`, error);
      
      // Fallback to template-based generation
      return this.generateFallbackItem(request);
    }
  }

  public async generateItemSet(
    setName: string,
    setPieces: number,
    setTheme: string,
    baseRequest: ItemGenerationRequest
  ): Promise<GeneratedItem[]> {
    const items: GeneratedItem[] = [];
    
    try {
      for (let i = 0; i < setPieces; i++) {
        const setRequest: ItemGenerationRequest = {
          ...baseRequest,
          parameters: {
            ...baseRequest.parameters,
            setName: setName,
            setIndex: i,
            setPieces: setPieces,
            setTheme: setTheme,
            setBonus: this.calculateSetBonus(i + 1, setPieces)
          }
        };

        const item = await this.generateItem(setRequest);
        
        // Add set identification
        item.tags.push(`set_${setName.toLowerCase().replace(/\s+/g, '_')}`);
        item.name = `${item.name} (${setName} Set)`;
        
        items.push(item);
      }

      console.log(`🛡️ Generated item set: ${setName} with ${items.length} pieces`);
      return items;

    } catch (error) {
      console.error(`❌ Item set generation failed:`, error);
      throw error;
    }
  }

  // =============================================================================
  // ITEM PARAMETER BUILDING
  // =============================================================================

  private async buildItemParameters(request: ItemGenerationRequest): Promise<Record<string, any>> {
    // Get enriched game context
    const context = await this.gameContext.enrichParameters('item', request.parameters);

    // Add item-specific enrichment
    const itemSpecificParams = {
      ...context,
      
      // Item generation context
      itemType: request.type,
      generationPriority: request.priority,
      constraints: request.constraints,
      
      // Player equipment context
      currentEquipment: this.analyzeCurrentEquipment(context.player),
      equipmentGaps: this.identifyEquipmentGaps(context.player),
      upgradeOpportunities: this.findUpgradeOpportunities(context.player),
      
      // Build optimization context
      primaryStat: this.identifyPrimaryStat(context.player.build),
      secondaryStat: this.identifySecondaryStat(context.player.build),
      avoidedStats: this.identifyAvoidedStats(context.player.build),
      
      // Economic context
      marketTrends: this.economyManager.getMarketTrends(),
      playerWealth: this.assessPlayerWealth(context.player),
      vendorInventory: this.getVendorInventory(context.world.currentArea),
      
      // Drop source context
      dropSource: this.analyzeDropSource(request.parameters),
      sourceRarity: this.calculateSourceRarity(request.parameters),
      magicFind: this.calculateMagicFind(context.player),
      
      // Quality requirements
      qualityExpectations: {
        statCoherence: 0.8,
        loreQuality: context.player.preferences.loreInterest === 'high' ? 0.9 : 0.6,
        visualAppeal: 0.75,
        mechanicalBalance: 0.85,
        playerRelevance: 0.8
      }
    };

    return itemSpecificParams;
  }

  // =============================================================================
  // ITEM CONTENT PARSING
  // =============================================================================

  private parseItemContent(generatedContent: GeneratedContent, request: ItemGenerationRequest): GeneratedItem {
    const content = generatedContent.content;
    
    const item: GeneratedItem = {
      id: content.id || this.generateItemId(),
      name: content.name || 'Generated Item',
      baseType: content.base_type || content.baseType || 'unknown',
      itemClass: this.determineItemClass(content.base_type || content.baseType),
      subType: content.sub_type || content.subType || content.base_type || 'generic',
      itemLevel: content.item_level || content.itemLevel || request.parameters.playerLevel || 1,
      rarity: content.rarity || 'normal',
      quality: content.quality || 100,
      stats: this.parseItemStats(content.stats || {}),
      affixes: [], // Will be populated later
      requirements: this.parseRequirements(content.requirements || {}),
      durability: { 
        current: content.durability?.current || 100, 
        maximum: content.durability?.maximum || 100 
      },
      value: { vendor: 0, market: 0, trade: 0 }, // Will be calculated later
      visual: this.parseVisual(content.visual || {}),
      lore: content.lore ? this.parseLore(content.lore) : undefined,
      tags: this.generateItemTags(content, request),
      metadata: {
        generatedAt: Date.now(),
        generationType: this.mapGenerationType(request.type),
        sourceEvent: request.parameters.sourceEvent || 'unknown',
        playerContext: request.parameters.playerContext || {},
        dropSource: request.parameters.dropSource,
        balanceData: {} as ItemBalanceData, // Will be filled later
        qualityMetrics: {} as ItemQualityMetrics // Will be filled later
      }
    };

    return item;
  }

  private parseItemStats(stats: any): ItemStats {
    return {
      damage: stats.damage,
      armor: stats.armor,
      energyShield: stats.energy_shield || stats.energyShield,
      criticalChance: stats.critical_chance || stats.criticalChance,
      criticalMultiplier: stats.critical_multiplier || stats.criticalMultiplier,
      attackSpeed: stats.attack_speed || stats.attackSpeed,
      accuracy: stats.accuracy,
      evasion: stats.evasion,
      blockChance: stats.block_chance || stats.blockChance,
      movementSpeed: stats.movement_speed || stats.movementSpeed,
      life: stats.life,
      mana: stats.mana,
      resistances: stats.resistances || {}
    };
  }

  private parseRequirements(requirements: any): ItemRequirements {
    return {
      level: requirements.level || 1,
      strength: requirements.strength,
      dexterity: requirements.dexterity,
      intelligence: requirements.intelligence,
      questCompletion: requirements.quest_completion || requirements.questCompletion,
      reputation: requirements.reputation,
      location: requirements.location
    };
  }

  private parseVisual(visual: any): ItemVisual {
    return {
      model: visual.model || 'default',
      texture: visual.texture || 'default',
      colorPrimary: visual.color_primary || visual.colorPrimary || '#ffffff',
      colorSecondary: visual.color_secondary || visual.colorSecondary,
      effects: visual.effects || [],
      glowIntensity: visual.glow_intensity || visual.glowIntensity || 0,
      particleEffects: visual.particle_effects || visual.particleEffects,
      soundEffects: visual.sound_effects || visual.soundEffects
    };
  }

  private parseLore(lore: any): ItemLore {
    return {
      title: lore.title || 'Ancient Artifact',
      story: lore.story || 'This item holds secrets of the past.',
      origin: lore.origin || 'Unknown',
      previousOwners: lore.previous_owners || lore.previousOwners,
      historicalSignificance: lore.historical_significance || lore.historicalSignificance,
      mysteries: lore.mysteries
    };
  }

  // =============================================================================
  // AFFIX SYSTEM
  // =============================================================================

  private async applyAffixes(item: GeneratedItem, params: any): Promise<void> {
    const rarityAffixCounts = {
      normal: 0,
      magic: Math.floor(Math.random() * 2) + 1, // 1-2 affixes
      rare: Math.floor(Math.random() * 4) + 3, // 3-6 affixes
      unique: Math.floor(Math.random() * 6) + 4, // 4-9 affixes
      legendary: Math.floor(Math.random() * 8) + 6 // 6-13 affixes
    };

    const affixCount = rarityAffixCounts[item.rarity] || 0;
    
    if (affixCount > 0) {
      const availableAffixes = this.getAvailableAffixes(item, params);
      const selectedAffixes = this.selectAffixes(availableAffixes, affixCount, item);
      
      for (const affix of selectedAffixes) {
        item.affixes.push(affix);
        this.applyAffixToStats(item, affix);
      }
    }
  }

  private getAvailableAffixes(item: GeneratedItem, params: any): ItemAffix[] {
    const available: ItemAffix[] = [];
    
    for (const affix of this.affixDatabase.values()) {
      if (this.isAffixApplicable(affix, item, params)) {
        available.push(affix);
      }
    }

    return available.sort(() => Math.random() - 0.5); // Shuffle
  }

  private isAffixApplicable(affix: ItemAffix, item: GeneratedItem, params: any): boolean {
    // Check level requirement
    if (affix.levelRequirement > item.itemLevel) return false;
    
    // Check item class compatibility
    if (affix.tags.length > 0) {
      const itemTags = [item.itemClass, item.subType, ...item.tags];
      if (!affix.tags.some(tag => itemTags.includes(tag))) return false;
    }
    
    // Check rarity compatibility
    const rarityOrder = ['normal', 'magic', 'rare', 'unique', 'legendary'];
    const itemRarityIndex = rarityOrder.indexOf(item.rarity);
    const affixRarityIndex = rarityOrder.indexOf(affix.rarity);
    
    return affixRarityIndex <= itemRarityIndex;
  }

  private selectAffixes(available: ItemAffix[], count: number, item: GeneratedItem): ItemAffix[] {
    const selected: ItemAffix[] = [];
    const usedNames = new Set<string>();
    
    // Try to balance prefixes and suffixes
    const prefixCount = Math.ceil(count / 2);
    const suffixCount = count - prefixCount;
    
    // Select prefixes
    const prefixes = available.filter(a => a.type === 'prefix');
    for (let i = 0; i < prefixCount && selected.length < count; i++) {
      const affix = this.selectBestAffix(prefixes, item, usedNames);
      if (affix) {
        selected.push(affix);
        usedNames.add(affix.name);
      }
    }
    
    // Select suffixes
    const suffixes = available.filter(a => a.type === 'suffix');
    for (let i = 0; i < suffixCount && selected.length < count; i++) {
      const affix = this.selectBestAffix(suffixes, item, usedNames);
      if (affix) {
        selected.push(affix);
        usedNames.add(affix.name);
      }
    }

    return selected;
  }

  private selectBestAffix(affixes: ItemAffix[], item: GeneratedItem, usedNames: Set<string>): ItemAffix | null {
    const available = affixes.filter(a => !usedNames.has(a.name));
    if (available.length === 0) return null;
    
    // Simple random selection (could be improved with build analysis)
    return available[Math.floor(Math.random() * available.length)];
  }

  private applyAffixToStats(item: GeneratedItem, affix: ItemAffix): void {
    // Apply affix values to item stats
    for (const [statName, value] of Object.entries(affix.values)) {
      switch (statName) {
        case 'damage_percent':
          if (item.stats.damage) {
            const [min, max] = item.stats.damage.split('-').map(Number);
            const newMin = Math.floor(min * (1 + value / 100));
            const newMax = Math.floor(max * (1 + value / 100));
            item.stats.damage = `${newMin}-${newMax}`;
          }
          break;
        case 'life':
          item.stats.life = (item.stats.life || 0) + value;
          break;
        case 'mana':
          item.stats.mana = (item.stats.mana || 0) + value;
          break;
        case 'armor':
          item.stats.armor = (item.stats.armor || 0) + value;
          break;
        // Add more stat applications as needed
      }
    }
  }

  // =============================================================================
  // ITEM VALIDATION
  // =============================================================================

  private async validateItem(item: GeneratedItem, request: ItemGenerationRequest): Promise<ItemQualityMetrics> {
    return this.itemValidator.validateItem(item, request);
  }

  private async improveItem(item: GeneratedItem, validation: ItemQualityMetrics): Promise<void> {
    // Improve item based on validation issues
    if (validation.statCoherence < 0.7) {
      // Improve stat coherence
      await this.improveStatCoherence(item);
    }

    if (validation.mechanicalBalance < 0.7) {
      // Improve mechanical balance
      await this.improveMechanicalBalance(item);
    }

    if (validation.playerRelevance < 0.7) {
      // Improve player relevance
      await this.improvePlayerRelevance(item);
    }
  }

  private async improveStatCoherence(item: GeneratedItem): Promise<void> {
    // Remove conflicting stats and ensure synergy
    if (item.itemClass === 'weapon' && item.stats.armor) {
      delete item.stats.armor; // Weapons shouldn't have armor
    }
  }

  private async improveMechanicalBalance(item: GeneratedItem): Promise<void> {
    // Adjust values to be more balanced for the item level
    const levelMultiplier = item.itemLevel / 50; // Normalize to level 50
    
    if (item.stats.life && item.stats.life > item.itemLevel * 50) {
      item.stats.life = Math.floor(item.itemLevel * 30 * (1 + Math.random() * 0.5));
    }
  }

  private async improvePlayerRelevance(item: GeneratedItem): Promise<void> {
    // Make item more relevant to current player needs
    // This would analyze player's current gear and adjust accordingly
  }

  // =============================================================================
  // FALLBACK GENERATION
  // =============================================================================

  private generateFallbackItem(request: ItemGenerationRequest): GeneratedItem {
    console.log(`🔄 Using fallback item generation for type: ${request.type}`);
    
    const template = this.itemTemplates.get(request.constraints.itemClass || 'weapon') || 
                    this.itemTemplates.get('weapon')!;
    
    const level = request.parameters.playerLevel || 1;
    
    return {
      id: this.generateItemId(),
      name: template.nameTemplate.replace('{adjective}', 'Sturdy').replace('{base}', template.baseType),
      baseType: template.baseType,
      itemClass: template.itemClass,
      subType: template.baseType,
      itemLevel: level,
      rarity: 'normal',
      quality: 100,
      stats: this.generateFallbackStats(template.itemClass, level),
      affixes: [],
      requirements: { level: level },
      durability: { current: 100, maximum: 100 },
      value: { vendor: level * 10, market: level * 15, trade: level * 12 },
      visual: {
        model: 'default',
        texture: 'default',
        colorPrimary: '#888888',
        effects: [],
        glowIntensity: 0
      },
      tags: ['fallback', template.itemClass],
      metadata: {
        generatedAt: Date.now(),
        generationType: 'fallback',
        sourceEvent: 'fallback_generation',
        playerContext: {},
        balanceData: {
          powerLevel: 0.5,
          tierAppropriate: true,
          statBalance: 0.7,
          economicValue: 0.6,
          rarityJustified: true,
          buildRelevance: 0.5
        },
        qualityMetrics: {
          statCoherence: 0.8,
          loreQuality: 0.3,
          visualAppeal: 0.5,
          mechanicalBalance: 0.7,
          playerRelevance: 0.5,
          overall: 0.56
        }
      }
    };
  }

  private generateFallbackStats(itemClass: string, level: number): ItemStats {
    const stats: ItemStats = {};
    
    switch (itemClass) {
      case 'weapon':
        const baseDamage = level * 8;
        stats.damage = `${Math.floor(baseDamage * 0.8)}-${Math.floor(baseDamage * 1.2)}`;
        stats.criticalChance = 5;
        stats.accuracy = level * 10;
        break;
      case 'armor':
        stats.armor = level * 12;
        stats.life = level * 20;
        break;
      case 'accessory':
        stats.life = level * 15;
        stats.mana = level * 10;
        break;
    }
    
    return stats;
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private loadItemTemplates(): void {
    this.itemTemplates.set('weapon', {
      nameTemplate: '{adjective} {base}',
      baseType: 'sword',
      itemClass: 'weapon'
    });

    this.itemTemplates.set('armor', {
      nameTemplate: '{adjective} {base}',
      baseType: 'armor',
      itemClass: 'armor'
    });

    this.itemTemplates.set('accessory', {
      nameTemplate: '{adjective} {base}',
      baseType: 'ring',
      itemClass: 'accessory'
    });
  }

  private loadAffixDatabase(): void {
    // Load sample affixes
    this.affixDatabase.set('enhanced_damage', {
      id: 'enhanced_damage',
      type: 'prefix',
      name: 'Enhanced',
      tier: 1,
      description: 'Increased Physical Damage',
      effect: '+{value}% Physical Damage',
      values: { damage_percent: 15 },
      rarity: 'magic',
      levelRequirement: 1,
      tags: ['weapon']
    });

    this.affixDatabase.set('of_life', {
      id: 'of_life',
      type: 'suffix',
      name: 'of Life',
      tier: 1,
      description: 'Increased Life',
      effect: '+{value} to Life',
      values: { life: 25 },
      rarity: 'magic',
      levelRequirement: 1,
      tags: ['armor', 'accessory']
    });
  }

  private generateItemId(): string {
    return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private determineItemClass(baseType: string): 'weapon' | 'armor' | 'accessory' | 'consumable' | 'material' | 'quest' {
    const weaponTypes = ['sword', 'bow', 'staff', 'dagger', 'axe', 'mace'];
    const armorTypes = ['helmet', 'chestplate', 'gloves', 'boots', 'shield'];
    const accessoryTypes = ['ring', 'amulet', 'belt'];
    
    if (weaponTypes.some(type => baseType.includes(type))) return 'weapon';
    if (armorTypes.some(type => baseType.includes(type))) return 'armor';
    if (accessoryTypes.some(type => baseType.includes(type))) return 'accessory';
    
    return 'weapon'; // Default
  }

  private mapGenerationType(type: string): 'drop' | 'craft' | 'reward' | 'unique' {
    const typeMap: Record<string, any> = {
      random_drop: 'drop',
      boss_drop: 'drop',
      chest_loot: 'drop',
      craft_result: 'craft',
      quest_reward: 'reward',
      vendor_stock: 'drop'
    };
    return typeMap[type] || 'drop';
  }

  private generateItemTags(content: any, request: ItemGenerationRequest): string[] {
    const tags = [request.type];
    
    if (content.theme) tags.push(content.theme);
    if (content.rarity) tags.push(content.rarity);
    if (request.parameters.dropSource) tags.push(request.parameters.dropSource);
    
    return tags;
  }

  private calculateSetBonus(piecesWorn: number, totalPieces: number): Record<string, any> {
    return {
      twoSet: piecesWorn >= 2 ? { damage_percent: 10 } : null,
      fourSet: piecesWorn >= 4 ? { life: 50, mana: 30 } : null,
      fullSet: piecesWorn >= totalPieces ? { all_resistances: 20 } : null
    };
  }

  // Stub methods for complex implementations
  private analyzeCurrentEquipment(player: any): any { return {}; }
  private identifyEquipmentGaps(player: any): string[] { return ['weapon', 'armor']; }
  private findUpgradeOpportunities(player: any): string[] { return ['boots', 'gloves']; }
  private identifyPrimaryStat(build: any): string { return 'strength'; }
  private identifySecondaryStat(build: any): string { return 'dexterity'; }
  private identifyAvoidedStats(build: any): string[] { return ['intelligence']; }
  private assessPlayerWealth(player: any): number { return 1000; }
  private getVendorInventory(area: any): any[] { return []; }
  private analyzeDropSource(params: any): string { return params.dropSource || 'unknown'; }
  private calculateSourceRarity(params: any): number { return 0.1; }
  private calculateMagicFind(player: any): number { return 50; }

  public getGenerationStats(): any {
    return this.generationStats.getStats();
  }

  public destroy(): void {
    this.itemTemplates.clear();
    this.affixDatabase.clear();
    console.log('💥 Item Generator destroyed');
  }
}

// =============================================================================
// SUPPORTING CLASSES AND INTERFACES
// =============================================================================

interface ItemTemplate {
  nameTemplate: string;
  baseType: string;
  itemClass: string;
}

class ItemValidator {
  async validateItem(item: GeneratedItem, request: ItemGenerationRequest): Promise<ItemQualityMetrics> {
    const metrics: ItemQualityMetrics = {
      statCoherence: this.assessStatCoherence(item),
      loreQuality: this.assessLoreQuality(item),
      visualAppeal: this.assessVisualAppeal(item),
      mechanicalBalance: this.assessMechanicalBalance(item),
      playerRelevance: this.assessPlayerRelevance(item, request),
      overall: 0
    };

    metrics.overall = (
      metrics.statCoherence * 0.25 +
      metrics.loreQuality * 0.15 +
      metrics.visualAppeal * 0.15 +
      metrics.mechanicalBalance * 0.25 +
      metrics.playerRelevance * 0.20
    );

    return metrics;
  }

  private assessStatCoherence(item: GeneratedItem): number {
    // Check if stats make sense together
    let score = 0.8;
    
    if (item.itemClass === 'weapon' && item.stats.armor) score -= 0.3;
    if (item.itemClass === 'armor' && item.stats.damage) score -= 0.3;
    
    return Math.max(0, score);
  }

  private assessLoreQuality(item: GeneratedItem): number {
    if (!item.lore) return 0.3;
    return item.lore.story.length > 50 ? 0.8 : 0.5;
  }

  private assessVisualAppeal(item: GeneratedItem): number {
    let score = 0.5;
    if (item.visual.effects.length > 0) score += 0.2;
    if (item.visual.glowIntensity > 0) score += 0.1;
    if (item.visual.colorPrimary !== '#ffffff') score += 0.2;
    return Math.min(1.0, score);
  }

  private assessMechanicalBalance(item: GeneratedItem): number {
    // Simple balance check based on item level
    const expectedPower = item.itemLevel * 10;
    let actualPower = 0;
    
    if (item.stats.damage) {
      const [min, max] = item.stats.damage.split('-').map(Number);
      actualPower += (min + max) / 2;
    }
    if (item.stats.armor) actualPower += item.stats.armor;
    if (item.stats.life) actualPower += item.stats.life / 5;
    
    const ratio = actualPower / expectedPower;
    return ratio >= 0.7 && ratio <= 1.5 ? 0.9 : 0.6;
  }

  private assessPlayerRelevance(item: GeneratedItem, request: ItemGenerationRequest): number {
    return 0.8; // Would implement player needs analysis
  }
}

class ItemBalanceCalculator {
  calculateItemBalance(item: GeneratedItem, params: any): ItemBalanceData {
    return {
      powerLevel: this.calculatePowerLevel(item),
      tierAppropriate: this.checkTierAppropriate(item),
      statBalance: this.calculateStatBalance(item),
      economicValue: this.calculateEconomicBalance(item),
      rarityJustified: this.checkRarityJustified(item),
      buildRelevance: this.calculateBuildRelevance(item, params)
    };
  }

  private calculatePowerLevel(item: GeneratedItem): number {
    return 0.7; // Would implement comprehensive power calculation
  }

  private checkTierAppropriate(item: GeneratedItem): boolean {
    return true; // Would implement tier checking
  }

  private calculateStatBalance(item: GeneratedItem): number {
    return 0.8; // Would implement stat balance analysis
  }

  private calculateEconomicBalance(item: GeneratedItem): number {
    return 0.75; // Would implement economic balance check
  }

  private checkRarityJustified(item: GeneratedItem): boolean {
    return true; // Would implement rarity justification check
  }

  private calculateBuildRelevance(item: GeneratedItem, params: any): number {
    return 0.7; // Would implement build relevance analysis
  }
}

class ItemEconomyManager {
  calculateItemValue(item: GeneratedItem): void {
    const baseValue = item.itemLevel * 10;
    const rarityMultiplier = { normal: 1, magic: 2, rare: 4, unique: 8, legendary: 16 }[item.rarity] || 1;
    
    item.value.vendor = Math.floor(baseValue * rarityMultiplier * 0.25);
    item.value.market = Math.floor(baseValue * rarityMultiplier);
    item.value.trade = Math.floor(baseValue * rarityMultiplier * 0.8);
  }

  getMarketTrends(): any {
    return { weapon_demand: 'high', armor_demand: 'medium', accessory_demand: 'low' };
  }
}

class ItemGenerationStats {
  private stats = {
    totalGenerated: 0,
    successful: 0,
    failed: 0,
    averageTime: 0,
    totalTime: 0,
    typeBreakdown: new Map<string, number>(),
    rarityBreakdown: new Map<string, number>()
  };

  recordGeneration(type: string, time: number, success: boolean): void {
    this.stats.totalGenerated++;
    this.stats.totalTime += time;
    this.stats.averageTime = this.stats.totalTime / this.stats.totalGenerated;

    if (success) {
      this.stats.successful++;
    } else {
      this.stats.failed++;
    }

    this.stats.typeBreakdown.set(type, (this.stats.typeBreakdown.get(type) || 0) + 1);
  }

  getStats(): any {
    return {
      ...this.stats,
      successRate: this.stats.totalGenerated > 0 ? this.stats.successful / this.stats.totalGenerated : 0,
      typeBreakdown: Object.fromEntries(this.stats.typeBreakdown),
      rarityBreakdown: Object.fromEntries(this.stats.rarityBreakdown)
    };
  }
}

export function createItemGenerator(
  claudeEngine: ClaudeContentEngine,
  gameContext: GameContextManager,
  world: IWorld
): ItemGenerator {
  return new ItemGenerator(claudeEngine, gameContext, world);
}