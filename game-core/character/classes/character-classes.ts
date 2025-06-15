// RainStorm ARPG - Character Classes System
// Complete character class definitions with attributes, bonuses, and starting configurations

export interface CharacterAttributes {
  strength: number;
  dexterity: number;
  intelligence: number;
}

export interface StartingEquipment {
  weapon: string;
  armor: string;
}

export interface CharacterClassDefinition {
  name: string;
  description: string;
  primaryAttribute: keyof CharacterAttributes;
  secondaryAttribute: keyof CharacterAttributes | null;
  startingAttributes: CharacterAttributes;
  startingLife: number;
  startingMana: number;
  lifePerLevel: number;
  manaPerLevel: number;
  skillTreeStartNode: string;
  startingSkillGems: string[];
  classQuests: string[];
  ascendancyClasses: string[];
  favoredWeaponTypes: string[];
  startingEquipment: StartingEquipment;
}

export class CharacterClassData {
  private classes: Map<string, CharacterClassDefinition>;

  constructor() {
    this.classes = new Map();
    this.initializeClasses();
  }

  private initializeClasses(): void {
    // Marauder - Pure Strength
    this.classes.set('Marauder', {
      name: 'Marauder',
      description: 'A mighty warrior focused on melee combat and raw physical power',
      primaryAttribute: 'strength',
      secondaryAttribute: null,
      startingAttributes: {
        strength: 23,
        dexterity: 14,
        intelligence: 14
      },
      startingLife: 54,
      startingMana: 40,
      lifePerLevel: 12,
      manaPerLevel: 4,
      skillTreeStartNode: 'marauder_start',
      startingSkillGems: ['Heavy Strike', 'Melee Physical Damage Support'],
      classQuests: ['The Caged Brute', 'Breaking Some Eggs', 'The Siren\'s Cadence'],
      ascendancyClasses: ['Juggernaut', 'Berserker', 'Chieftain'],
      favoredWeaponTypes: ['Two Handed Maces', 'Two Handed Axes', 'Two Handed Swords'],
      startingEquipment: {
        weapon: 'Driftwood Club',
        armor: 'Strapped Leather'
      }
    });

    // Ranger - Pure Dexterity  
    this.classes.set('Ranger', {
      name: 'Ranger',
      description: 'A swift archer who strikes from afar with bow and arrow',
      primaryAttribute: 'dexterity',
      secondaryAttribute: null,
      startingAttributes: {
        strength: 14,
        dexterity: 23,
        intelligence: 14
      },
      startingLife: 44,
      startingMana: 40,
      lifePerLevel: 8,
      manaPerLevel: 4,
      skillTreeStartNode: 'ranger_start',
      startingSkillGems: ['Burning Arrow', 'Pierce Support'],
      classQuests: ['Enemy at the Gate', 'The Great White Beast', 'The Ribbon Spool'],
      ascendancyClasses: ['Deadeye', 'Raider', 'Pathfinder'],
      favoredWeaponTypes: ['Bows', 'Claws', 'One Handed Swords'],
      startingEquipment: {
        weapon: 'Crude Bow',
        armor: 'Simple Robe'
      }
    });

    // Witch - Pure Intelligence
    this.classes.set('Witch', {
      name: 'Witch',
      description: 'A powerful sorceress who wields the elements through spells',
      primaryAttribute: 'intelligence',
      secondaryAttribute: null,
      startingAttributes: {
        strength: 14,
        dexterity: 14,
        intelligence: 23
      },
      startingLife: 38,
      startingMana: 60,
      lifePerLevel: 6,
      manaPerLevel: 8,
      skillTreeStartNode: 'witch_start',
      startingSkillGems: ['Fireball', 'Added Lightning Damage Support'],
      classQuests: ['A Fixture of Fate', 'The Root of the Problem', 'The Eternal Nightmare'],
      ascendancyClasses: ['Necromancer', 'Elementalist', 'Occultist'],
      favoredWeaponTypes: ['Wands', 'Staves', 'Daggers'],
      startingEquipment: {
        weapon: 'Driftwood Wand',
        armor: 'Simple Robe'
      }
    });

    // Duelist - Strength/Dexterity Hybrid
    this.classes.set('Duelist', {
      name: 'Duelist',  
      description: 'A master of blade and finesse, combining strength with agility',
      primaryAttribute: 'strength',
      secondaryAttribute: 'dexterity',
      startingAttributes: {
        strength: 20,
        dexterity: 20,
        intelligence: 11
      },
      startingLife: 50,
      startingMana: 35,
      lifePerLevel: 10,
      manaPerLevel: 3,
      skillTreeStartNode: 'duelist_start',
      startingSkillGems: ['Double Strike', 'Melee Splash Support'],
      classQuests: ['The Way Forward', 'Breaking the Seal', 'The Gemling Queen'],
      ascendancyClasses: ['Gladiator', 'Champion', 'Slayer'],
      favoredWeaponTypes: ['One Handed Swords', 'Thrusting One Handed Swords', 'One Handed Axes'],
      startingEquipment: {
        weapon: 'Rusted Sword',
        armor: 'Scale Vest'
      }
    });

    // Templar - Strength/Intelligence Hybrid
    this.classes.set('Templar', {
      name: 'Templar',
      description: 'A holy warrior who combines physical might with divine magic',
      primaryAttribute: 'strength',
      secondaryAttribute: 'intelligence',
      startingAttributes: {
        strength: 20,
        dexterity: 11,
        intelligence: 20
      },
      startingLife: 50,
      startingMana: 50,
      lifePerLevel: 10,
      manaPerLevel: 6,
      skillTreeStartNode: 'templar_start',
      startingSkillGems: ['Glacial Hammer', 'Added Cold Damage Support'],
      classQuests: ['The Caged Brute', 'Breaking Some Eggs', 'The Siren\'s Cadence'],
      ascendancyClasses: ['Guardian', 'Hierophant', 'Inquisitor'],
      favoredWeaponTypes: ['Staves', 'Two Handed Maces', 'One Handed Maces'],
      startingEquipment: {
        weapon: 'Driftwood Maul',
        armor: 'Plate Vest'
      }
    });

    // Shadow - Dexterity/Intelligence Hybrid
    this.classes.set('Shadow', {
      name: 'Shadow',
      description: 'An assassin who strikes from the darkness with critical precision',
      primaryAttribute: 'dexterity',
      secondaryAttribute: 'intelligence',
      startingAttributes: {
        strength: 11,
        dexterity: 20,
        intelligence: 20
      },
      startingLife: 42,
      startingMana: 50,
      lifePerLevel: 7,
      manaPerLevel: 6,
      skillTreeStartNode: 'shadow_start',
      startingSkillGems: ['Viper Strike', 'Added Chaos Damage Support'],
      classQuests: ['Enemy at the Gate', 'The Great White Beast', 'The Ribbon Spool'],
      ascendancyClasses: ['Assassin', 'Trickster', 'Saboteur'],
      favoredWeaponTypes: ['Claws', 'Daggers', 'Wands'],
      startingEquipment: {
        weapon: 'Glass Shank',
        armor: 'Shabby Jerkin'
      }
    });

    // Scion - Balanced Hybrid (Access to all)
    this.classes.set('Scion', {
      name: 'Scion',
      description: 'A versatile exile with access to the entire passive skill tree',
      primaryAttribute: 'strength',
      secondaryAttribute: 'dexterity',
      startingAttributes: {
        strength: 17,
        dexterity: 17,
        intelligence: 17
      },
      startingLife: 46,
      startingMana: 45,
      lifePerLevel: 9,
      manaPerLevel: 5,
      skillTreeStartNode: 'scion_start',
      startingSkillGems: ['Spectral Throw', 'Lesser Multiple Projectiles Support'],
      classQuests: ['The Caged Brute', 'A Fixture of Fate', 'The Eternal Nightmare'],
      ascendancyClasses: ['Ascendant'],
      favoredWeaponTypes: ['All Weapon Types'],
      startingEquipment: {
        weapon: 'Rusted Sword',
        armor: 'Simple Robe'
      }
    });
  }

  getClass(className: string): CharacterClassDefinition | null {
    return this.classes.get(className) || null;
  }

  getAllClasses(): CharacterClassDefinition[] {
    return Array.from(this.classes.values());
  }

  getClassNames(): string[] {
    return Array.from(this.classes.keys());
  }

  // Utility methods for character creation
  calculateStartingLife(className: string): number {
    const classData = this.getClass(className);
    if (!classData) return 50; // Default
    
    return classData.startingLife;
  }

  calculateStartingMana(className: string): number {
    const classData = this.getClass(className);
    if (!classData) return 40; // Default
    
    return classData.startingMana;
  }

  calculateLifeAtLevel(className: string, level: number): number {
    const classData = this.getClass(className);
    if (!classData) return 50 + (level - 1) * 8; // Default progression
    
    return classData.startingLife + (level - 1) * classData.lifePerLevel;
  }

  calculateManaAtLevel(className: string, level: number): number {
    const classData = this.getClass(className);
    if (!classData) return 40 + (level - 1) * 4; // Default progression
    
    return classData.startingMana + (level - 1) * classData.manaPerLevel;
  }

  getAttributeGrowth(className: string): { [key in keyof CharacterAttributes]: number } {
    const classData = this.getClass(className);
    if (!classData) {
      return { strength: 0.5, dexterity: 0.5, intelligence: 0.5 }; // Default growth
    }

    // Classes get more growth in their primary attributes
    const growth = { strength: 0.3, dexterity: 0.3, intelligence: 0.3 };
    
    growth[classData.primaryAttribute] += 0.4; // Primary gets +0.4 per level
    if (classData.secondaryAttribute) {
      growth[classData.secondaryAttribute] += 0.2; // Secondary gets +0.2 per level
    }

    return growth;
  }

  calculateAttributesAtLevel(className: string, level: number): CharacterAttributes {
    const classData = this.getClass(className);
    if (!classData) {
      return { strength: 14, dexterity: 14, intelligence: 14 }; // Default
    }

    const growth = this.getAttributeGrowth(className);
    const levelsGained = level - 1;

    return {
      strength: Math.floor(classData.startingAttributes.strength + levelsGained * growth.strength),
      dexterity: Math.floor(classData.startingAttributes.dexterity + levelsGained * growth.dexterity),
      intelligence: Math.floor(classData.startingAttributes.intelligence + levelsGained * growth.intelligence)
    };
  }

  // Get recommended builds for each class
  getRecommendedBuilds(className: string): string[] {
    const builds: Record<string, string[]> = {
      'Marauder': [
        'Pure Melee Warrior - Two-handed weapons with heavy armor',
        'Tank Defender - Shield and one-handed with maximum defense',
        'Berserker - High damage melee with life leech'
      ],
      'Ranger': [
        'Bow Specialist - Pure archery with critical strikes',
        'Dual Wield Fighter - Fast attacks with claws or swords',
        'Trapper - Mines and traps for area control'
      ],
      'Witch': [
        'Elemental Caster - Fire, ice, and lightning spells',
        'Summoner - Minions and auras for crowd control',
        'Curse Support - Debuffs and energy shield focus'
      ],
      'Duelist': [
        'Weapon Master - Versatile melee with various weapons',
        'Gladiator - Arena fighter with bleed and block',
        'Damage Dealer - Pure DPS with critical strikes'
      ],
      'Templar': [
        'Battle Mage - Spells and melee combat hybrid',
        'Support Paladin - Auras and party buffs',
        'Divine Caster - Holy magic and energy shield'
      ],
      'Shadow': [
        'Assassin - Critical strikes and poison damage',
        'Spell Assassin - Spell critical strikes and power charges',
        'Saboteur - Traps, mines, and area denial'
      ],
      'Scion': [
        'Hybrid Fighter - Balanced approach to all combat styles',
        'Ascendancy Mixer - Combines multiple ascendancy benefits',
        'Specialist - Focus on any particular playstyle'
      ]
    };

    return builds[className] || ['Versatile Build - Adapt to any playstyle'];
  }

  // Validate class selection
  isValidClass(className: string): boolean {
    return this.classes.has(className);
  }

  // Get class compatibility with weapons
  getWeaponCompatibility(className: string, weaponType: string): 'excellent' | 'good' | 'poor' {
    const classData = this.getClass(className);
    if (!classData) return 'poor';

    if (classData.favoredWeaponTypes.includes(weaponType)) {
      return 'excellent';
    }

    // Check if weapon type matches primary attribute
    const strWeapons = ['Maces', 'Two Handed Maces', 'Axes', 'Two Handed Axes', 'Swords', 'Two Handed Swords'];
    const dexWeapons = ['Bows', 'Claws', 'Daggers', 'Thrusting One Handed Swords'];
    const intWeapons = ['Wands', 'Staves'];

    if (classData.primaryAttribute === 'strength' && strWeapons.some(w => weaponType.includes(w))) {
      return 'good';
    }
    if (classData.primaryAttribute === 'dexterity' && dexWeapons.some(w => weaponType.includes(w))) {
      return 'good';
    }
    if (classData.primaryAttribute === 'intelligence' && intWeapons.some(w => weaponType.includes(w))) {
      return 'good';
    }

    return 'poor';
  }

  // Get starting passive skills based on class
  getStartingPassiveSkills(className: string): string[] {
    const skillMap: Record<string, string[]> = {
      'Marauder': ['Melee Damage', 'Life', 'Strength'],
      'Ranger': ['Projectile Damage', 'Evasion', 'Dexterity'],
      'Witch': ['Spell Damage', 'Energy Shield', 'Intelligence'],
      'Duelist': ['Melee Damage', 'Attack Speed', 'Accuracy'],
      'Templar': ['Spell Damage', 'Life', 'Elemental Damage'],
      'Shadow': ['Critical Strikes', 'Chaos Damage', 'Energy Shield'],
      'Scion': ['Balanced Growth', 'Versatility', 'All Attributes']
    };

    return skillMap[className] || [];
  }
}

export default CharacterClassData;