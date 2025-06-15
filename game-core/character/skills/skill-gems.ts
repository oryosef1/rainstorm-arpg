// skill-gems.ts - Active Skill Gems System
import { IEntity } from '../../ecs/ecs-core';

export type SocketColor = 'red' | 'green' | 'blue' | 'white';
export type GemType = 'active' | 'support';

export interface GemRequirements {
  level: number;
  strength: number;
  dexterity: number;
  intelligence: number;
}

export interface GemStats {
  [key: string]: number;
}

export interface SkillSetup {
  activeGem: SkillGem;
  supportGems: SkillGem[];
  socketIndex: number;
}

export interface CharacterStats {
  [key: string]: number;
}

export class SkillGem {
  id: string;
  name: string;
  type: GemType;
  level: number;
  experience: number;
  maxLevel: number;
  requirements: GemRequirements;
  baseStats: GemStats;
  description: string;
  socketColor: SocketColor;
  tags: string[];
  qualityBonus: number;

  constructor(id: string, name: string, type: GemType, requirements: GemRequirements, stats: GemStats, description: string) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.level = 1;
    this.experience = 0;
    this.maxLevel = 20;
    this.requirements = requirements;
    this.baseStats = stats;
    this.description = description;
    this.socketColor = this.getSocketColor();
    this.tags = [];
    this.qualityBonus = 0;
  }

  getSocketColor(): SocketColor {
    if (this.requirements.strength >= this.requirements.dexterity && 
        this.requirements.strength >= this.requirements.intelligence) {
      return 'red';
    } else if (this.requirements.dexterity >= this.requirements.intelligence) {
      return 'green';
    } else {
      return 'blue';
    }
  }

  getCurrentStats(): GemStats {
    const stats = { ...this.baseStats };
    
    if (this.level > 1) {
      for (const [key, value] of Object.entries(stats)) {
        if (typeof value === 'number') {
          if (key === 'damage' || key.includes('damage') || key.includes('Speed') || key === 'radius') {
            stats[key] = Math.ceil(value * (1 + (this.level - 1) * 0.06));
          } else if (key.includes('Time')) {
            stats[key] = value;
          } else {
            stats[key] = Math.ceil(value * (1 + (this.level - 1) * 0.06));
          }
        }
      }
    }
    
    if (this.qualityBonus > 0) {
      const qualityMultiplier = 1 + (this.qualityBonus / 100);
      for (const [key, value] of Object.entries(stats)) {
        if (typeof value === 'number' && key.includes('damage')) {
          stats[key] = Math.floor(stats[key] * qualityMultiplier);
        }
      }
    }
    
    return stats;
  }

  canLevelUp(): boolean {
    return this.level < this.maxLevel && this.experience >= this.getExperienceToNext();
  }

  getExperienceToNext(): number {
    return Math.floor(1000 * Math.pow(1.1, this.level - 1));
  }

  addExperience(amount: number): boolean {
    this.experience += amount;
    
    while (this.canLevelUp()) {
      this.experience -= this.getExperienceToNext();
      this.level++;
      return true;
    }
    return false;
  }

  meetsRequirements(character: IEntity): boolean {
    const level = character.getComponent('Level');
    const attributes = character.getComponent('Attributes');
    
    if (!level || !attributes) return false;
    
    return level.current >= this.requirements.level &&
           attributes.strength >= this.requirements.strength &&
           attributes.dexterity >= this.requirements.dexterity &&
           attributes.intelligence >= this.requirements.intelligence;
  }

  clone(): SkillGem {
    const gem = new SkillGem(this.id, this.name, this.type, this.requirements, this.baseStats, this.description);
    gem.level = this.level;
    gem.experience = this.experience;
    gem.qualityBonus = this.qualityBonus;
    gem.tags = [...this.tags];
    return gem;
  }
}

export class Socket {
  color: SocketColor;
  position: { x: number; y: number };
  gem: SkillGem | null;
  linkedSockets: Socket[];

  constructor(color: SocketColor, x: number = 0, y: number = 0) {
    this.color = color;
    this.position = { x, y };
    this.gem = null;
    this.linkedSockets = [];
  }

  canSocketGem(gem: SkillGem): boolean {
    if (this.gem !== null) return false;
    return this.color === 'white' || this.color === gem.socketColor;
  }

  socketGem(gem: SkillGem): boolean {
    if (!this.canSocketGem(gem)) return false;
    this.gem = gem;
    return true;
  }

  unsocketGem(): SkillGem | null {
    const gem = this.gem;
    this.gem = null;
    return gem;
  }

  getLinkedSockets(): Socket[] {
    return this.linkedSockets.filter(socket => socket !== null);
  }

  isLinkedTo(otherSocket: Socket): boolean {
    return this.linkedSockets.includes(otherSocket);
  }
}

export class SocketGroup {
  sockets: Socket[];
  links: Array<[number, number]>;

  constructor(sockets: Socket[] = []) {
    this.sockets = sockets;
    this.links = [];
  }

  addSocket(socket: Socket): void {
    this.sockets.push(socket);
  }

  addLink(socketIndex1: number, socketIndex2: number): boolean {
    if (socketIndex1 >= this.sockets.length || socketIndex2 >= this.sockets.length) return false;
    
    const socket1 = this.sockets[socketIndex1];
    const socket2 = this.sockets[socketIndex2];
    
    if (!socket1.isLinkedTo(socket2)) {
      socket1.linkedSockets.push(socket2);
      socket2.linkedSockets.push(socket1);
      this.links.push([socketIndex1, socketIndex2]);
    }
    return true;
  }

  removeLink(socketIndex1: number, socketIndex2: number): void {
    const socket1 = this.sockets[socketIndex1];
    const socket2 = this.sockets[socketIndex2];
    
    socket1.linkedSockets = socket1.linkedSockets.filter(s => s !== socket2);
    socket2.linkedSockets = socket2.linkedSockets.filter(s => s !== socket1);
    
    this.links = this.links.filter(([i1, i2]) => 
      !((i1 === socketIndex1 && i2 === socketIndex2) || 
        (i1 === socketIndex2 && i2 === socketIndex1))
    );
  }

  getActiveSkillSetups(): SkillSetup[] {
    const setups: SkillSetup[] = [];
    
    for (let i = 0; i < this.sockets.length; i++) {
      const socket = this.sockets[i];
      if (socket.gem && socket.gem.type === 'active') {
        const supports = this.getLinkedSupports(i);
        setups.push({
          activeGem: socket.gem,
          supportGems: supports,
          socketIndex: i
        });
      }
    }
    
    return setups;
  }

  getLinkedSupports(activeSocketIndex: number): SkillGem[] {
    const supports: SkillGem[] = [];
    const activeSocket = this.sockets[activeSocketIndex];
    const activeGem = activeSocket.gem;
    
    if (!activeGem || activeGem.type !== 'active') return supports;
    
    for (const linkedSocket of activeSocket.getLinkedSockets()) {
      if (linkedSocket.gem && 
          linkedSocket.gem.type === 'support' &&
          this.supportsCanModify(linkedSocket.gem, activeGem)) {
        supports.push(linkedSocket.gem);
      }
    }
    
    return supports;
  }

  supportsCanModify(supportGem: SkillGem, activeGem: SkillGem): boolean {
    if (supportGem.tags.length === 0) return true;
    
    if (!activeGem.tags || activeGem.tags.length === 0) {
      return supportGem.tags.length === 0;
    }
    
    return supportGem.tags.some(tag => activeGem.tags.includes(tag));
  }
}

export class SkillGemDatabase {
  activeGems: Map<string, SkillGem>;
  supportGems: Map<string, SkillGem>;

  constructor() {
    this.activeGems = new Map();
    this.supportGems = new Map();
    this.initializeGems();
  }

  initializeGems(): void {
    // Active Skill Gems
    this.addActiveGem('fireball', 'Fireball', {
      level: 1,
      strength: 0,
      dexterity: 0,
      intelligence: 12
    }, {
      damage: 15,
      projectileSpeed: 200,
      manaCost: 6,
      castTime: 0.75,
      radius: 15
    }, 'Casts a fiery projectile that explodes on impact', ['spell', 'projectile', 'fire', 'aoe']);

    this.addActiveGem('ice_nova', 'Ice Nova', {
      level: 1,
      strength: 0,
      dexterity: 0,
      intelligence: 12
    }, {
      damage: 20,
      manaCost: 8,
      castTime: 0.7,
      radius: 25
    }, 'Creates an expanding ring of ice around the caster', ['spell', 'aoe', 'cold']);

    this.addActiveGem('lightning_bolt', 'Lightning Bolt', {
      level: 1,
      strength: 0,
      dexterity: 0,
      intelligence: 12
    }, {
      damage: 12,
      manaCost: 5,
      castTime: 0.5,
      chainCount: 3
    }, 'Casts a bolt of lightning that chains between enemies', ['spell', 'projectile', 'lightning', 'chaining']);

    this.addActiveGem('heavy_strike', 'Heavy Strike', {
      level: 1,
      strength: 12,
      dexterity: 0,
      intelligence: 0
    }, {
      damageMultiplier: 1.44,
      manaCost: 6,
      attackTime: 1.0
    }, 'Attacks with increased damage and knockback', ['attack', 'melee']);

    this.addActiveGem('double_strike', 'Double Strike', {
      level: 1,
      strength: 8,
      dexterity: 8,
      intelligence: 0
    }, {
      damageMultiplier: 0.91,
      attackCount: 2,
      manaCost: 5,
      attackTime: 0.8
    }, 'Performs two quick strikes in succession', ['attack', 'melee']);

    this.addActiveGem('burning_arrow', 'Burning Arrow', {
      level: 1,
      strength: 0,
      dexterity: 12,
      intelligence: 0
    }, {
      damageMultiplier: 1.2,
      burnDamage: 10,
      burnDuration: 4,
      manaCost: 4
    }, 'Fires an arrow that burns enemies over time', ['attack', 'projectile', 'bow', 'fire']);

    this.addActiveGem('split_arrow', 'Split Arrow', {
      level: 1,
      strength: 0,
      dexterity: 12,
      intelligence: 0
    }, {
      damageMultiplier: 0.7,
      projectileCount: 3,
      manaCost: 6
    }, 'Fires multiple arrows in a spread', ['attack', 'projectile', 'bow']);

    // Support Gems
    this.addSupportGem('added_fire_damage', 'Added Fire Damage Support', {
      level: 8,
      strength: 14,
      dexterity: 0,
      intelligence: 0
    }, {
      addedFireDamagePercent: 44,
      manaCostMultiplier: 1.2
    }, 'Supported skills have added fire damage', ['fire']);

    this.addSupportGem('added_cold_damage', 'Added Cold Damage Support', {
      level: 8,
      strength: 0,
      dexterity: 0,
      intelligence: 14
    }, {
      addedColdDamagePercent: 39,
      freezeChance: 10,
      manaCostMultiplier: 1.2
    }, 'Supported skills have added cold damage and freeze chance', ['cold']);

    this.addSupportGem('faster_casting', 'Faster Casting Support', {
      level: 8,
      strength: 0,
      dexterity: 0,
      intelligence: 14
    }, {
      castSpeedMultiplier: 1.44,
      manaCostMultiplier: 1.2
    }, 'Supported skills cast faster', ['spell']);

    this.addSupportGem('melee_physical_damage', 'Melee Physical Damage Support', {
      level: 8,
      strength: 14,
      dexterity: 0,
      intelligence: 0
    }, {
      physicalDamageMultiplier: 1.49,
      manaCostMultiplier: 1.25
    }, 'Supported skills deal more physical damage', ['attack', 'melee']);

    this.addSupportGem('pierce', 'Pierce Support', {
      level: 8,
      strength: 0,
      dexterity: 14,
      intelligence: 0
    }, {
      pierceChance: 100,
      pierceCount: 3,
      damageMultiplier: 0.9,
      manaCostMultiplier: 1.15
    }, 'Supported projectiles pierce through enemies', ['projectile']);

    this.addSupportGem('multistrike', 'Multistrike Support', {
      level: 38,
      strength: 14,
      dexterity: 14,
      intelligence: 0
    }, {
      attackRepeatCount: 2,
      damageMultiplier: 0.7,
      attackSpeedMultiplier: 1.94,
      manaCostMultiplier: 1.6
    }, 'Supported skills repeat twice more', ['attack', 'melee']);

    this.addSupportGem('spell_echo', 'Spell Echo Support', {
      level: 38,
      strength: 0,
      dexterity: 0,
      intelligence: 25
    }, {
      spellRepeatCount: 1,
      damageMultiplier: 0.7,
      castSpeedMultiplier: 1.69,
      manaCostMultiplier: 1.4
    }, 'Supported spells repeat an additional time', ['spell']);

    this.addSupportGem('critical_strikes', 'Increased Critical Strikes Support', {
      level: 8,
      strength: 0,
      dexterity: 14,
      intelligence: 0
    }, {
      criticalChanceMultiplier: 1.9,
      criticalMultiplierMultiplier: 1.3,
      manaCostMultiplier: 1.2
    }, 'Supported skills have increased critical strike chance and multiplier', []);
  }

  addActiveGem(id: string, name: string, requirements: GemRequirements, stats: GemStats, description: string, tags: string[] = []): void {
    const gem = new SkillGem(id, name, 'active', requirements, stats, description);
    gem.tags = tags;
    this.activeGems.set(id, gem);
  }

  addSupportGem(id: string, name: string, requirements: GemRequirements, stats: GemStats, description: string, tags: string[] = []): void {
    const gem = new SkillGem(id, name, 'support', requirements, stats, description);
    gem.tags = tags;
    this.supportGems.set(id, gem);
  }

  getActiveGem(id: string): SkillGem | undefined {
    return this.activeGems.get(id)?.clone();
  }

  getSupportGem(id: string): SkillGem | undefined {
    return this.supportGems.get(id)?.clone();
  }

  getAllActiveGems(): SkillGem[] {
    return Array.from(this.activeGems.values()).map(gem => gem.clone());
  }

  getAllSupportGems(): SkillGem[] {
    return Array.from(this.supportGems.values()).map(gem => gem.clone());
  }

  getGemsByClass(characterClass: string): SkillGem[] {
    const gems: SkillGem[] = [];
    const classGems: Record<string, string[]> = {
      'Marauder': ['heavy_strike', 'double_strike', 'melee_physical_damage', 'added_fire_damage'],
      'Ranger': ['burning_arrow', 'split_arrow', 'pierce', 'critical_strikes'],
      'Witch': ['fireball', 'ice_nova', 'lightning_bolt', 'faster_casting', 'added_cold_damage'],
      'Duelist': ['heavy_strike', 'double_strike', 'melee_physical_damage', 'critical_strikes'],
      'Templar': ['heavy_strike', 'fireball', 'added_fire_damage', 'faster_casting'],
      'Shadow': ['lightning_bolt', 'burning_arrow', 'critical_strikes', 'faster_casting'],
      'Scion': ['fireball', 'heavy_strike', 'burning_arrow', 'faster_casting']
    };

    const classGemIds = classGems[characterClass] || [];
    for (const gemId of classGemIds) {
      const activeGem = this.getActiveGem(gemId);
      if (activeGem) gems.push(activeGem);
      
      const supportGem = this.getSupportGem(gemId);
      if (supportGem) gems.push(supportGem);
    }

    return gems;
  }

  searchGems(query: string, type: 'all' | 'active' | 'support' = 'all'): SkillGem[] {
    const results: SkillGem[] = [];
    const lowerQuery = query.toLowerCase();
    
    const searchInGems = (gemMap: Map<string, SkillGem>) => {
      for (const gem of gemMap.values()) {
        if (gem.name.toLowerCase().includes(lowerQuery) ||
            gem.description.toLowerCase().includes(lowerQuery) ||
            gem.tags.some(tag => tag.includes(lowerQuery))) {
          results.push(gem.clone());
        }
      }
    };

    if (type === 'all' || type === 'active') {
      searchInGems(this.activeGems);
    }
    if (type === 'all' || type === 'support') {
      searchInGems(this.supportGems);
    }

    return results;
  }
}

export class SkillCalculator {
  static calculateSkillDamage(skillSetup: SkillSetup, characterStats: CharacterStats): GemStats {
    const { activeGem, supportGems } = skillSetup;
    let stats = { ...activeGem.getCurrentStats() };
    
    stats.tags = activeGem.tags;
    
    for (const supportGem of supportGems) {
      const supportStats = supportGem.getCurrentStats();
      stats = this.applySupportModifications(stats, supportStats);
    }
    
    stats = this.applyCharacterStats(stats, characterStats);
    
    return stats;
  }

  static applySupportModifications(skillStats: GemStats, supportStats: GemStats): GemStats {
    const modified = { ...skillStats };
    
    if (supportStats.damageMultiplier) {
      modified.damage = (modified.damage || 1) * supportStats.damageMultiplier;
    }
    if (supportStats.physicalDamageMultiplier) {
      modified.damage = (modified.damage || 1) * supportStats.physicalDamageMultiplier;
    }
    
    if (supportStats.castSpeedMultiplier) {
      modified.castTime = (modified.castTime || 1) / supportStats.castSpeedMultiplier;
    }
    if (supportStats.attackSpeedMultiplier) {
      modified.attackTime = (modified.attackTime || 1) / supportStats.attackSpeedMultiplier;
    }
    
    if (supportStats.manaCostMultiplier) {
      modified.manaCost = (modified.manaCost || 0) * supportStats.manaCostMultiplier;
    }
    
    const baseDamage = skillStats.damage || 0;
    if (supportStats.addedFireDamagePercent) {
      const addedFire = baseDamage * (supportStats.addedFireDamagePercent / 100);
      modified.addedFireDamage = addedFire;
      modified.damage = (modified.damage || 0) + addedFire;
    }
    if (supportStats.addedColdDamagePercent) {
      const addedCold = baseDamage * (supportStats.addedColdDamagePercent / 100);
      modified.addedColdDamage = addedCold;
      modified.damage = (modified.damage || 0) + addedCold;
    }
    
    if (supportStats.criticalChanceMultiplier) {
      modified.criticalChance = (modified.criticalChance || 0.05) * supportStats.criticalChanceMultiplier;
    }
    if (supportStats.criticalMultiplierMultiplier) {
      modified.criticalMultiplier = (modified.criticalMultiplier || 1.5) * supportStats.criticalMultiplierMultiplier;
    }
    
    if (supportStats.pierceChance) {
      modified.pierceChance = supportStats.pierceChance;
      modified.pierceCount = supportStats.pierceCount || 1;
    }
    if (supportStats.projectileCount) {
      modified.projectileCount = supportStats.projectileCount;
    }
    
    if (supportStats.attackRepeatCount) {
      modified.attackRepeatCount = supportStats.attackRepeatCount;
    }
    if (supportStats.spellRepeatCount) {
      modified.spellRepeatCount = supportStats.spellRepeatCount;
    }
    
    return modified;
  }

  static applyCharacterStats(skillStats: GemStats, characterStats: CharacterStats): GemStats {
    const modified = { ...skillStats };
    
    if (characterStats.spellDamageInc && skillStats.tags?.includes('spell')) {
      modified.damage = (modified.damage || 1) * (1 + characterStats.spellDamageInc / 100);
    }
    if (characterStats.attackDamageInc && skillStats.tags?.includes('attack')) {
      modified.damage = (modified.damage || 1) * (1 + characterStats.attackDamageInc / 100);
    }
    
    if (characterStats.castSpeedInc && skillStats.tags?.includes('spell')) {
      modified.castTime = (modified.castTime || 1) / (1 + characterStats.castSpeedInc / 100);
    }
    if (characterStats.attackSpeedInc && skillStats.tags?.includes('attack')) {
      modified.attackTime = (modified.attackTime || 1) / (1 + characterStats.attackSpeedInc / 100);
    }
    
    return modified;
  }

  static canUseSkill(skillSetup: SkillSetup, character: IEntity): boolean {
    const { activeGem } = skillSetup;
    const mana = character.getComponent('Mana');
    const calculatedStats = this.calculateSkillDamage(skillSetup, {});
    
    if (!mana || mana.current < calculatedStats.manaCost) {
      return false;
    }
    
    return activeGem.meetsRequirements(character);
  }
}

export default { SkillGem, Socket, SocketGroup, SkillGemDatabase, SkillCalculator };