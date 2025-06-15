import { EventEmitter } from 'events';
import { ISystem, IEntity } from '../ecs/ecs-core';
import { SystemMetrics } from '../../types/ecs-types';
import MCPSetupSystem, { CharacterSchema, ProgressionSchema, SkillSchema } from './mcp-setup';

export interface CharacterData {
  id: string;
  name: string;
  class: string;
  level: number;
  experience: number;
  attributes: CharacterAttributes;
  resources: CharacterResources;
  statistics: CharacterStatistics;
  equipment: EquipmentData;
  created: number;
  lastPlayed: number;
  playtime: number;
  hardcore: boolean;
  dead: boolean;
  league: string;
}

export interface CharacterAttributes {
  strength: number;
  dexterity: number;
  intelligence: number;
  life: number;
  mana: number;
  energyShield: number;
  accuracy: number;
  evasion: number;
  armor: number;
}

export interface CharacterResources {
  life: { current: number; maximum: number; reserved: number };
  mana: { current: number; maximum: number; reserved: number };
  energyShield: { current: number; maximum: number };
  flasks: FlaskData[];
  charges: ChargeData[];
}

export interface CharacterStatistics {
  damageDealt: number;
  damageTaken: number;
  monstersKilled: number;
  itemsFound: number;
  deaths: number;
  mapsCompleted: number;
  bossesKilled: number;
  questsCompleted: number;
  achievementsUnlocked: number;
}

export interface EquipmentData {
  weapon: ItemSlot;
  offhand: ItemSlot;
  helmet: ItemSlot;
  bodyArmor: ItemSlot;
  gloves: ItemSlot;
  boots: ItemSlot;
  belt: ItemSlot;
  rings: ItemSlot[];
  amulet: ItemSlot;
  flasks: ItemSlot[];
}

export interface ItemSlot {
  slotId: string;
  item: ItemReference | null;
  requirements: ItemRequirements;
}

export interface ItemReference {
  id: string;
  baseType: string;
  rarity: string;
  level: number;
  quality: number;
  sockets: SocketConfiguration[];
  modifiers: ItemModifier[];
  influences: string[];
  synthesised: boolean;
  fractured: boolean;
  corrupted: boolean;
  mirrored: boolean;
}

export interface SocketConfiguration {
  id: string;
  colour: 'red' | 'green' | 'blue' | 'white';
  linked: boolean;
  gem: GemReference | null;
}

export interface GemReference {
  id: string;
  baseType: string;
  level: number;
  quality: number;
  experience: number;
  corrupted: boolean;
  vaal: boolean;
  awakened: boolean;
}

export interface ItemModifier {
  id: string;
  type: 'implicit' | 'explicit' | 'crafted' | 'enchanted' | 'fractured' | 'synthesised';
  tier: number;
  values: number[];
  hybrid: boolean;
}

export interface ItemRequirements {
  level: number;
  strength: number;
  dexterity: number;
  intelligence: number;
}

export interface FlaskData {
  slotId: number;
  flask: ItemReference;
  charges: { current: number; maximum: number };
  effects: FlaskEffect[];
}

export interface FlaskEffect {
  id: string;
  type: string;
  magnitude: number;
  duration: number;
  remaining: number;
}

export interface ChargeData {
  type: string;
  current: number;
  maximum: number;
  effects: ChargeEffect[];
}

export interface ChargeEffect {
  stat: string;
  value: number;
  perCharge: boolean;
}

export interface SkillTreeData {
  characterId: string;
  allocatedNodes: PassiveNode[];
  availablePoints: number;
  usedPoints: number;
  refundPoints: number;
  keystones: string[];
  masteries: MasterySelection[];
  ascendancy: AscendancyData;
}

export interface PassiveNode {
  nodeId: string;
  allocated: boolean;
  timestamp: number;
  source: 'quest' | 'level' | 'book' | 'regret';
}

export interface MasterySelection {
  masteryId: string;
  selectedEffect: string;
  allocated: boolean;
}

export interface AscendancyData {
  class: string;
  allocatedNodes: string[];
  ascendancyPoints: { used: number; available: number };
}

export interface QuestProgress {
  characterId: string;
  quests: QuestData[];
  campaignProgress: CampaignProgress;
  sideQuests: SideQuestData[];
}

export interface QuestData {
  id: string;
  name: string;
  act: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'failed';
  objectives: QuestObjective[];
  rewards: QuestReward[];
  completedAt?: number;
}

export interface QuestObjective {
  id: string;
  description: string;
  type: 'kill' | 'collect' | 'talk' | 'area' | 'optional';
  target: string;
  current: number;
  required: number;
  completed: boolean;
}

export interface QuestReward {
  type: 'skillPoint' | 'item' | 'gem' | 'respec' | 'flask' | 'waypoint';
  item?: ItemReference;
  amount?: number;
  claimed: boolean;
}

export interface CampaignProgress {
  act: number;
  difficulty: string;
  areasUnlocked: string[];
  waypoints: string[];
  labyrinthsCompleted: string[];
  pantheonsUnlocked: string[];
}

export interface SideQuestData {
  id: string;
  name: string;
  optional: boolean;
  repeatable: boolean;
  status: string;
  requirements: string[];
  rewards: QuestReward[];
}

export interface SaveData {
  version: string;
  timestamp: number;
  character: CharacterData;
  skillTree: SkillTreeData;
  questProgress: QuestProgress;
  checksum: string;
}

export interface SaveOptions {
  compress: boolean;
  encrypt: boolean;
  backup: boolean;
  validationLevel: 'none' | 'basic' | 'full';
}

export class CharacterPersistenceSystem extends EventEmitter implements ISystem {
  readonly name: string = 'CharacterPersistenceSystem';
  readonly requiredComponents: readonly string[] = ['Character', 'Persistence'];
  readonly entities: Set<IEntity> = new Set();
  readonly priority: number = 5;
  enabled: boolean = true;

  private mcpSystem: MCPSetupSystem;
  private characters: Map<string, CharacterData> = new Map();
  private skillTrees: Map<string, SkillTreeData> = new Map();
  private questProgress: Map<string, QuestProgress> = new Map();
  private saveQueue: Map<string, SaveData> = new Map();
  private autoSaveInterval: NodeJS.Timeout | null = null;
  private lastSaveTime: Map<string, number> = new Map();

  constructor(mcpSystem: MCPSetupSystem) {
    super();
    this.mcpSystem = mcpSystem;
    this.initializeAutoSave();
    console.log('💾 Character Persistence System initialized');
  }

  addEntity(entity: IEntity): void {
    if (this.canProcess(entity)) {
      this.entities.add(entity);
      this.emit('entityAdded', { system: this.name, entity });
    }
  }

  removeEntity(entity: IEntity): void {
    if (this.entities.has(entity)) {
      this.entities.delete(entity);
      this.emit('entityRemoved', { system: this.name, entity });
    }
  }

  update(deltaTime: number): void {
    if (!this.enabled) return;

    // Process pending saves
    this.processSaveQueue();

    // Update entity persistence state
    for (const entity of this.entities) {
      this.updateEntityPersistence(entity, deltaTime);
    }
  }

  canProcess(entity: IEntity): boolean {
    return entity.hasComponents(this.requiredComponents);
  }

  cleanup(): void {
    this.stopAutoSave();
    this.entities.clear();
    this.characters.clear();
    this.skillTrees.clear();
    this.questProgress.clear();
    this.saveQueue.clear();
    this.emit('systemCleanup', { system: this.name });
  }

  getMetrics(): SystemMetrics {
    return {
      name: this.name,
      executionTime: 0,
      entityCount: this.entities.size,
      lastUpdate: Date.now(),
      averageTime: 0,
      maxTime: 0,
      minTime: 0
    };
  }

  // Character Management
  async createCharacter(characterData: Partial<CharacterData>): Promise<string> {
    const character: CharacterData = {
      id: this.generateCharacterId(),
      name: characterData.name || 'Unnamed',
      class: characterData.class || 'Marauder',
      level: 1,
      experience: 0,
      attributes: this.getStartingAttributes(characterData.class || 'Marauder'),
      resources: this.getStartingResources(),
      statistics: this.getEmptyStatistics(),
      equipment: this.getEmptyEquipment(),
      created: Date.now(),
      lastPlayed: Date.now(),
      playtime: 0,
      hardcore: characterData.hardcore || false,
      dead: false,
      league: characterData.league || 'Standard',
      ...characterData
    };

    // Initialize skill tree
    const skillTree = this.createStartingSkillTree(character.id, character.class);
    
    // Initialize quest progress
    const quests = this.createStartingQuestProgress(character.id);

    // Save to database
    await this.saveCharacterToDatabase(character);
    await this.saveSkillTreeToDatabase(skillTree);
    await this.saveQuestProgressToDatabase(quests);

    // Cache locally
    this.characters.set(character.id, character);
    this.skillTrees.set(character.id, skillTree);
    this.questProgress.set(character.id, quests);

    this.emit('characterCreated', { character });
    console.log(`💾 Character created: ${character.name} (${character.class})`);
    
    return character.id;
  }

  async loadCharacter(characterId: string): Promise<CharacterData | null> {
    try {
      // Check cache first
      if (this.characters.has(characterId)) {
        return this.characters.get(characterId)!;
      }

      // Load from database
      const character = await this.loadCharacterFromDatabase(characterId);
      const skillTree = await this.loadSkillTreeFromDatabase(characterId);
      const quests = await this.loadQuestProgressFromDatabase(characterId);

      if (character) {
        // Cache data
        this.characters.set(characterId, character);
        if (skillTree) this.skillTrees.set(characterId, skillTree);
        if (quests) this.questProgress.set(characterId, quests);

        this.emit('characterLoaded', { character });
        console.log(`💾 Character loaded: ${character.name}`);
        return character;
      }

      return null;
    } catch (error) {
      this.emit('characterLoadError', { characterId, error });
      console.error(`💾 Failed to load character ${characterId}:`, error);
      return null;
    }
  }

  async saveCharacter(characterId: string, options: SaveOptions = { compress: true, encrypt: false, backup: true, validationLevel: 'basic' }): Promise<boolean> {
    try {
      const character = this.characters.get(characterId);
      const skillTree = this.skillTrees.get(characterId);
      const quests = this.questProgress.get(characterId);

      if (!character) {
        throw new Error(`Character ${characterId} not found`);
      }

      // Create save data
      const saveData: SaveData = {
        version: '1.0.0',
        timestamp: Date.now(),
        character,
        skillTree: skillTree!,
        questProgress: quests!,
        checksum: this.calculateChecksum({ character, skillTree, quests })
      };

      // Validate save data
      if (options.validationLevel !== 'none') {
        await this.validateSaveData(saveData, options.validationLevel);
      }

      // Create backup if requested
      if (options.backup) {
        await this.createCharacterBackup(characterId);
      }

      // Save to database
      await this.saveCharacterToDatabase(character);
      if (skillTree) await this.saveSkillTreeToDatabase(skillTree);
      if (quests) await this.saveQuestProgressToDatabase(quests);

      this.lastSaveTime.set(characterId, Date.now());
      this.emit('characterSaved', { characterId, saveData });
      console.log(`💾 Character saved: ${character.name}`);
      
      return true;
    } catch (error) {
      this.emit('characterSaveError', { characterId, error });
      console.error(`💾 Failed to save character ${characterId}:`, error);
      return false;
    }
  }

  async deleteCharacter(characterId: string): Promise<boolean> {
    try {
      // Create final backup
      await this.createCharacterBackup(characterId);

      // Remove from database
      await this.deleteCharacterFromDatabase(characterId);

      // Remove from cache
      this.characters.delete(characterId);
      this.skillTrees.delete(characterId);
      this.questProgress.delete(characterId);
      this.lastSaveTime.delete(characterId);

      this.emit('characterDeleted', { characterId });
      console.log(`💾 Character deleted: ${characterId}`);
      
      return true;
    } catch (error) {
      this.emit('characterDeleteError', { characterId, error });
      console.error(`💾 Failed to delete character ${characterId}:`, error);
      return false;
    }
  }

  // Skill Tree Persistence
  async saveSkillTree(characterId: string, skillTree: SkillTreeData): Promise<boolean> {
    try {
      this.skillTrees.set(characterId, skillTree);
      await this.saveSkillTreeToDatabase(skillTree);
      
      this.emit('skillTreeSaved', { characterId, skillTree });
      return true;
    } catch (error) {
      this.emit('skillTreeSaveError', { characterId, error });
      return false;
    }
  }

  async loadSkillTree(characterId: string): Promise<SkillTreeData | null> {
    try {
      // Check cache first
      if (this.skillTrees.has(characterId)) {
        return this.skillTrees.get(characterId)!;
      }

      // Load from database
      const skillTree = await this.loadSkillTreeFromDatabase(characterId);
      if (skillTree) {
        this.skillTrees.set(characterId, skillTree);
      }

      return skillTree;
    } catch (error) {
      console.error(`💾 Failed to load skill tree for ${characterId}:`, error);
      return null;
    }
  }

  // Quest Progress Persistence
  async saveQuestProgress(characterId: string, questProgress: QuestProgress): Promise<boolean> {
    try {
      this.questProgress.set(characterId, questProgress);
      await this.saveQuestProgressToDatabase(questProgress);
      
      this.emit('questProgressSaved', { characterId, questProgress });
      return true;
    } catch (error) {
      this.emit('questProgressSaveError', { characterId, error });
      return false;
    }
  }

  async loadQuestProgress(characterId: string): Promise<QuestProgress | null> {
    try {
      // Check cache first
      if (this.questProgress.has(characterId)) {
        return this.questProgress.get(characterId)!;
      }

      // Load from database
      const questProgress = await this.loadQuestProgressFromDatabase(characterId);
      if (questProgress) {
        this.questProgress.set(characterId, questProgress);
      }

      return questProgress;
    } catch (error) {
      console.error(`💾 Failed to load quest progress for ${characterId}:`, error);
      return null;
    }
  }

  // Auto-save Management
  private initializeAutoSave(): void {
    this.autoSaveInterval = setInterval(() => {
      this.autoSaveAllCharacters();
    }, 30000); // Auto-save every 30 seconds
  }

  private stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  private async autoSaveAllCharacters(): Promise<void> {
    for (const characterId of this.characters.keys()) {
      const lastSave = this.lastSaveTime.get(characterId) || 0;
      const timeSinceLastSave = Date.now() - lastSave;
      
      // Auto-save if it's been more than 5 minutes since last save
      if (timeSinceLastSave > 300000) {
        await this.saveCharacter(characterId, { 
          compress: true, 
          encrypt: false, 
          backup: false, 
          validationLevel: 'basic' 
        });
      }
    }
  }

  // Database Operations
  private async saveCharacterToDatabase(character: CharacterData): Promise<void> {
    const sql = `
      INSERT INTO characters (id, name, class, level, experience, attributes, resources, statistics, equipment, created, last_played, playtime, hardcore, dead, league)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      name = VALUES(name), level = VALUES(level), experience = VALUES(experience),
      attributes = VALUES(attributes), resources = VALUES(resources), statistics = VALUES(statistics),
      equipment = VALUES(equipment), last_played = VALUES(last_played), playtime = VALUES(playtime),
      dead = VALUES(dead)
    `;

    const params = [
      character.id, character.name, character.class, character.level, character.experience,
      JSON.stringify(character.attributes), JSON.stringify(character.resources),
      JSON.stringify(character.statistics), JSON.stringify(character.equipment),
      character.created, character.lastPlayed, character.playtime,
      character.hardcore, character.dead, character.league
    ];

    await this.mcpSystem.executeQuery(sql, params);
  }

  private async loadCharacterFromDatabase(characterId: string): Promise<CharacterData | null> {
    const sql = 'SELECT * FROM characters WHERE id = ?';
    const result = await this.mcpSystem.executeQuery(sql, [characterId]);
    
    if (result.rows && result.rows.length > 0) {
      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        class: row.class,
        level: row.level,
        experience: row.experience,
        attributes: JSON.parse(row.attributes),
        resources: JSON.parse(row.resources),
        statistics: JSON.parse(row.statistics),
        equipment: JSON.parse(row.equipment),
        created: row.created,
        lastPlayed: row.last_played,
        playtime: row.playtime,
        hardcore: row.hardcore,
        dead: row.dead,
        league: row.league
      };
    }

    return null;
  }

  private async saveSkillTreeToDatabase(skillTree: SkillTreeData): Promise<void> {
    const sql = `
      INSERT INTO skills (character_id, allocated_nodes, available_points, used_points, refund_points, keystones, masteries, ascendancy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      allocated_nodes = VALUES(allocated_nodes), available_points = VALUES(available_points),
      used_points = VALUES(used_points), refund_points = VALUES(refund_points),
      keystones = VALUES(keystones), masteries = VALUES(masteries), ascendancy = VALUES(ascendancy)
    `;

    const params = [
      skillTree.characterId, JSON.stringify(skillTree.allocatedNodes),
      skillTree.availablePoints, skillTree.usedPoints, skillTree.refundPoints,
      JSON.stringify(skillTree.keystones), JSON.stringify(skillTree.masteries),
      JSON.stringify(skillTree.ascendancy)
    ];

    await this.mcpSystem.executeQuery(sql, params);
  }

  private async loadSkillTreeFromDatabase(characterId: string): Promise<SkillTreeData | null> {
    const sql = 'SELECT * FROM skills WHERE character_id = ?';
    const result = await this.mcpSystem.executeQuery(sql, [characterId]);
    
    if (result.rows && result.rows.length > 0) {
      const row = result.rows[0];
      return {
        characterId: row.character_id,
        allocatedNodes: JSON.parse(row.allocated_nodes),
        availablePoints: row.available_points,
        usedPoints: row.used_points,
        refundPoints: row.refund_points,
        keystones: JSON.parse(row.keystones),
        masteries: JSON.parse(row.masteries),
        ascendancy: JSON.parse(row.ascendancy)
      };
    }

    return null;
  }

  private async saveQuestProgressToDatabase(questProgress: QuestProgress): Promise<void> {
    const sql = `
      INSERT INTO progression (character_id, quests, campaign_progress, side_quests)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      quests = VALUES(quests), campaign_progress = VALUES(campaign_progress), side_quests = VALUES(side_quests)
    `;

    const params = [
      questProgress.characterId, JSON.stringify(questProgress.quests),
      JSON.stringify(questProgress.campaignProgress), JSON.stringify(questProgress.sideQuests)
    ];

    await this.mcpSystem.executeQuery(sql, params);
  }

  private async loadQuestProgressFromDatabase(characterId: string): Promise<QuestProgress | null> {
    const sql = 'SELECT * FROM progression WHERE character_id = ?';
    const result = await this.mcpSystem.executeQuery(sql, [characterId]);
    
    if (result.rows && result.rows.length > 0) {
      const row = result.rows[0];
      return {
        characterId: row.character_id,
        quests: JSON.parse(row.quests),
        campaignProgress: JSON.parse(row.campaign_progress),
        sideQuests: JSON.parse(row.side_quests)
      };
    }

    return null;
  }

  private async deleteCharacterFromDatabase(characterId: string): Promise<void> {
    const tables = ['characters', 'skills', 'progression', 'inventory', 'flasks', 'atlas', 'achievements'];
    
    for (const table of tables) {
      const sql = `DELETE FROM ${table} WHERE character_id = ? OR id = ?`;
      await this.mcpSystem.executeQuery(sql, [characterId, characterId]);
    }
  }

  // Helper Methods
  private generateCharacterId(): string {
    return `char_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  private getStartingAttributes(characterClass: string): CharacterAttributes {
    const baseAttributes: Record<string, CharacterAttributes> = {
      'Marauder': { strength: 32, dexterity: 14, intelligence: 14, life: 50, mana: 40, energyShield: 0, accuracy: 100, evasion: 50, armor: 10 },
      'Ranger': { strength: 14, dexterity: 32, intelligence: 14, life: 40, mana: 40, energyShield: 0, accuracy: 150, evasion: 100, armor: 5 },
      'Witch': { strength: 14, dexterity: 14, intelligence: 32, life: 38, mana: 60, energyShield: 15, accuracy: 100, evasion: 50, armor: 5 },
      'Duelist': { strength: 23, dexterity: 23, intelligence: 14, life: 45, mana: 40, energyShield: 0, accuracy: 125, evasion: 75, armor: 8 },
      'Templar': { strength: 23, dexterity: 14, intelligence: 23, life: 42, mana: 50, energyShield: 10, accuracy: 100, evasion: 50, armor: 8 },
      'Shadow': { strength: 14, dexterity: 23, intelligence: 23, life: 40, mana: 50, energyShield: 8, accuracy: 125, evasion: 80, armor: 5 },
      'Scion': { strength: 20, dexterity: 20, intelligence: 20, life: 42, mana: 45, energyShield: 5, accuracy: 110, evasion: 65, armor: 7 }
    };

    return baseAttributes[characterClass] || baseAttributes['Marauder'];
  }

  private getStartingResources(): CharacterResources {
    return {
      life: { current: 50, maximum: 50, reserved: 0 },
      mana: { current: 40, maximum: 40, reserved: 0 },
      energyShield: { current: 0, maximum: 0 },
      flasks: [],
      charges: []
    };
  }

  private getEmptyStatistics(): CharacterStatistics {
    return {
      damageDealt: 0,
      damageTaken: 0,
      monstersKilled: 0,
      itemsFound: 0,
      deaths: 0,
      mapsCompleted: 0,
      bossesKilled: 0,
      questsCompleted: 0,
      achievementsUnlocked: 0
    };
  }

  private getEmptyEquipment(): EquipmentData {
    const createSlot = (slotId: string): ItemSlot => ({
      slotId,
      item: null,
      requirements: { level: 1, strength: 0, dexterity: 0, intelligence: 0 }
    });

    return {
      weapon: createSlot('weapon'),
      offhand: createSlot('offhand'),
      helmet: createSlot('helmet'),
      bodyArmor: createSlot('bodyArmor'),
      gloves: createSlot('gloves'),
      boots: createSlot('boots'),
      belt: createSlot('belt'),
      rings: [createSlot('ring1'), createSlot('ring2')],
      amulet: createSlot('amulet'),
      flasks: Array.from({ length: 5 }, (_, i) => createSlot(`flask${i + 1}`))
    };
  }

  private createStartingSkillTree(characterId: string, characterClass: string): SkillTreeData {
    return {
      characterId,
      allocatedNodes: [],
      availablePoints: 0,
      usedPoints: 0,
      refundPoints: 0,
      keystones: [],
      masteries: [],
      ascendancy: {
        class: '',
        allocatedNodes: [],
        ascendancyPoints: { used: 0, available: 0 }
      }
    };
  }

  private createStartingQuestProgress(characterId: string): QuestProgress {
    return {
      characterId,
      quests: [],
      campaignProgress: {
        act: 1,
        difficulty: 'Normal',
        areasUnlocked: ['The_Twilight_Strand'],
        waypoints: [],
        labyrinthsCompleted: [],
        pantheonsUnlocked: []
      },
      sideQuests: []
    };
  }

  private calculateChecksum(data: any): string {
    // Simple checksum calculation
    const dataString = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  private async validateSaveData(saveData: SaveData, level: 'basic' | 'full'): Promise<void> {
    // Basic validation
    if (!saveData.character || !saveData.character.id) {
      throw new Error('Invalid character data');
    }

    if (level === 'full') {
      // Full validation - check data integrity
      const calculatedChecksum = this.calculateChecksum({
        character: saveData.character,
        skillTree: saveData.skillTree,
        quests: saveData.questProgress
      });

      if (calculatedChecksum !== saveData.checksum) {
        throw new Error('Data integrity check failed');
      }
    }
  }

  private async createCharacterBackup(characterId: string): Promise<void> {
    const character = this.characters.get(characterId);
    if (character) {
      const backupData = {
        character,
        skillTree: this.skillTrees.get(characterId),
        questProgress: this.questProgress.get(characterId),
        timestamp: Date.now()
      };

      // Save backup (would implement actual backup storage)
      console.log(`💾 Backup created for character: ${character.name}`);
    }
  }

  private processSaveQueue(): void {
    // Process any pending saves in the queue
    for (const [characterId, saveData] of this.saveQueue) {
      this.saveCharacter(characterId).then(() => {
        this.saveQueue.delete(characterId);
      });
    }
  }

  private updateEntityPersistence(entity: IEntity, deltaTime: number): void {
    // Update persistence state for entities
    // This could include tracking changes that need to be saved
  }

  // Public API Methods
  getLoadedCharacters(): CharacterData[] {
    return Array.from(this.characters.values());
  }

  getCharacter(characterId: string): CharacterData | null {
    return this.characters.get(characterId) || null;
  }

  isCharacterLoaded(characterId: string): boolean {
    return this.characters.has(characterId);
  }

  getLastSaveTime(characterId: string): number {
    return this.lastSaveTime.get(characterId) || 0;
  }

  async getAllCharacterIds(): Promise<string[]> {
    const sql = 'SELECT id FROM characters';
    const result = await this.mcpSystem.executeQuery(sql);
    return result.rows ? result.rows.map((row: any) => row.id) : [];
  }

  // Cleanup
  destroy(): void {
    this.cleanup();
    this.removeAllListeners();
    console.log('💾 Character Persistence System destroyed');
  }
}

export default CharacterPersistenceSystem;