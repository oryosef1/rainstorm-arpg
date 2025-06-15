// Character Classes System Tests
// Test-driven development for character class functionality

const { CharacterClassData } = require('../game-core/character/classes/character-classes');
const { Entity, Component, System, World } = require('../game-core/ecs/ecs-core');
const { 
  Position, Velocity, Health, Mana, Attributes, Level, CharacterClass,
  SkillTree, SkillGems, Inventory, Equipment, Combat, Sprite
} = require('../game-core/components/ecs-components');

describe('Character Classes System', () => {
  let classData;

  beforeEach(() => {
    classData = new CharacterClassData();
  });

  describe('CharacterClassData', () => {
    test('should initialize with all 7 character classes', () => {
      const classes = classData.getAllClasses();
      expect(classes).toHaveLength(7);
      
      const classNames = classes.map(cls => cls.name);
      expect(classNames).toContain('Marauder');
      expect(classNames).toContain('Ranger');
      expect(classNames).toContain('Witch');
      expect(classNames).toContain('Duelist');
      expect(classNames).toContain('Templar');
      expect(classNames).toContain('Shadow');
      expect(classNames).toContain('Scion');
    });

    test('should get specific class data', () => {
      const marauder = classData.getClass('Marauder');
      
      expect(marauder).toBeDefined();
      expect(marauder.name).toBe('Marauder');
      expect(marauder.primaryAttribute).toBe('strength');
      expect(marauder.secondaryAttribute).toBeNull();
      expect(marauder.startingAttributes.strength).toBe(23);
    });

    test('should validate class choices correctly', () => {
      expect(classData.validateClassChoice('Marauder')).toBe(true);
      expect(classData.validateClassChoice('InvalidClass')).toBe(false);
    });

    test('should filter classes by primary attribute', () => {
      const strClasses = classData.getClassesByAttribute('strength');
      const dexClasses = classData.getClassesByAttribute('dexterity');
      const intClasses = classData.getClassesByAttribute('intelligence');

      expect(strClasses).toHaveLength(3); // Marauder, Duelist, Templar
      expect(dexClasses).toHaveLength(2); // Ranger, Shadow
      expect(intClasses).toHaveLength(1); // Witch
    });

    test('should calculate attribute bonuses correctly', () => {
      const level5Bonuses = classData.calculateAttributeBonuses('Marauder', 5);
      
      expect(level5Bonuses).toBeDefined();
      expect(level5Bonuses.strength).toBe(8); // 2 per level * 4 levels
      expect(level5Bonuses.dexterity).toBe(0); // No secondary attribute
      expect(level5Bonuses.life).toBe(102); // 54 + (12 * 4)
      expect(level5Bonuses.mana).toBe(56); // 40 + (4 * 4)
    });

    test('should calculate hybrid class bonuses correctly', () => {
      const level5Bonuses = classData.calculateAttributeBonuses('Duelist', 5);
      
      expect(level5Bonuses.strength).toBe(8); // Primary: 2 per level * 4
      expect(level5Bonuses.dexterity).toBe(4); // Secondary: 1 per level * 4
      expect(level5Bonuses.intelligence).toBe(0);
    });

    test('should return null for invalid class in bonus calculation', () => {
      const bonuses = classData.calculateAttributeBonuses('InvalidClass', 5);
      expect(bonuses).toBeNull();
    });
  });

  describe('Character Class Properties', () => {
    test('Marauder should have correct properties', () => {
      const marauder = classData.getClass('Marauder');
      
      expect(marauder.primaryAttribute).toBe('strength');
      expect(marauder.secondaryAttribute).toBeNull();
      expect(marauder.startingAttributes.strength).toBe(23);
      expect(marauder.startingLife).toBe(54);
      expect(marauder.ascendancyClasses).toContain('Juggernaut');
      expect(marauder.favoredWeaponTypes).toContain('Two Handed Maces');
    });

    test('Witch should have correct properties', () => {
      const witch = classData.getClass('Witch');
      
      expect(witch.primaryAttribute).toBe('intelligence');
      expect(witch.secondaryAttribute).toBeNull();
      expect(witch.startingAttributes.intelligence).toBe(23);
      expect(witch.startingMana).toBe(60);
      expect(witch.ascendancyClasses).toContain('Necromancer');
      expect(witch.favoredWeaponTypes).toContain('Wands');
    });

    test('Scion should have special properties', () => {
      const scion = classData.getClass('Scion');
      
      expect(scion.favoredWeaponTypes).toContain('All');
      expect(scion.specialAbilities.skillTreeAccess).toBe('full');
      expect(scion.specialAbilities.ascendancyPoints).toBe(7);
      expect(scion.startingAttributes.strength).toBe(17);
      expect(scion.startingAttributes.dexterity).toBe(17);
      expect(scion.startingAttributes.intelligence).toBe(17);
    });

    test('hybrid classes should have secondary attributes', () => {
      const duelist = classData.getClass('Duelist');
      const templar = classData.getClass('Templar');
      const shadow = classData.getClass('Shadow');
      const scion = classData.getClass('Scion');

      expect(duelist.secondaryAttribute).toBe('dexterity');
      expect(templar.secondaryAttribute).toBe('intelligence');
      expect(shadow.secondaryAttribute).toBe('intelligence');
      
      // Scion is special - balanced access to all attributes
      expect(scion.primaryAttribute).toBe('balanced');
      expect(scion.secondaryAttribute).toBe(null);
    });
  });

  describe('Character Entity Creation', () => {
    let world;

    beforeEach(() => {
      world = new World();
    });

    test('should create character entity with all required components', () => {
      const entity = classData.createCharacterEntity(world, 'Marauder');
      
      expect(entity).toBeValidEntity();
      expect(entity.hasComponent('Position')).toBe(true);
      expect(entity.hasComponent('Health')).toBe(true);
      expect(entity.hasComponent('Mana')).toBe(true);
      expect(entity.hasComponent('Attributes')).toBe(true);
      expect(entity.hasComponent('Level')).toBe(true);
      expect(entity.hasComponent('CharacterClass')).toBe(true);
      expect(entity.hasComponent('SkillTree')).toBe(true);
      expect(entity.hasComponent('Inventory')).toBe(true);
      expect(entity.hasComponent('Equipment')).toBe(true);
    });

    test('should set correct starting attributes for Marauder', () => {
      const entity = classData.createCharacterEntity(world, 'Marauder');
      const attributes = entity.getComponent('Attributes');
      const health = entity.getComponent('Health');
      const characterClass = entity.getComponent('CharacterClass');

      expect(attributes.strength).toBe(23);
      expect(attributes.dexterity).toBe(14);
      expect(attributes.intelligence).toBe(14);
      expect(health.maximum).toBe(54);
      expect(characterClass.name).toBe('Marauder');
    });

    test('should set correct starting attributes for Witch', () => {
      const entity = classData.createCharacterEntity(world, 'Witch');
      const attributes = entity.getComponent('Attributes');
      const mana = entity.getComponent('Mana');
      
      expect(attributes.intelligence).toBe(23);
      expect(attributes.strength).toBe(14);
      expect(attributes.dexterity).toBe(14);
      expect(mana.maximum).toBe(60);
    });

    test('should throw error for invalid class', () => {
      expect(() => {
        classData.createCharacterEntity(world, 'InvalidClass');
      }).toThrow('Unknown character class: InvalidClass');
    });

    test('should set initial skill points correctly', () => {
      const entity = classData.createCharacterEntity(world, 'Ranger');
      const skillTree = entity.getComponent('SkillTree');
      
      expect(skillTree.availablePoints).toBe(1);
    });

    test('should assign class-specific colors', () => {
      const marauder = classData.createCharacterEntity(world, 'Marauder');
      const witch = classData.createCharacterEntity(world, 'Witch');
      
      const marauderSprite = marauder.getComponent('Sprite');
      const witchSprite = witch.getComponent('Sprite');
      
      expect(marauderSprite.color).toBe('#ff4444'); // Red
      expect(witchSprite.color).toBe('#4444ff');    // Blue
    });
  });

  describe('Utility Functions', () => {
    test('should get class colors correctly', () => {
      expect(classData.getClassColor('Marauder')).toBe('#ff4444');
      expect(classData.getClassColor('Ranger')).toBe('#44ff44');
      expect(classData.getClassColor('Witch')).toBe('#4444ff');
      expect(classData.getClassColor('InvalidClass')).toBe('#ffffff');
    });

    test('should provide recommended builds for each class', () => {
      const marauderBuilds = classData.getRecommendedBuilds('Marauder');
      const witchBuilds = classData.getRecommendedBuilds('Witch');
      
      expect(marauderBuilds).toContain('Two-Handed Weapon Slam Build');
      expect(witchBuilds).toContain('Elemental Caster Build');
      expect(classData.getRecommendedBuilds('InvalidClass')).toEqual([]);
    });
  });

  describe('Integration Tests', () => {
    test('should create characters that work with leveling system', () => {
      const world = new World();
      const entity = classData.createCharacterEntity(world, 'Duelist');
      
      const level = entity.getComponent('Level');
      const skillTree = entity.getComponent('SkillTree');
      const initialPoints = skillTree.availablePoints;
      
      // Simulate level up
      const leveledUp = level.addExperience(level.experienceToNext);
      
      expect(leveledUp).toBe(true);
      expect(level.current).toBe(2);
      
      // Skill points should increase (handled by LevelingSystem)
      // This would be tested in integration with the LevelingSystem
    });

    test('should create inventory with proper dimensions', () => {
      const world = new World();
      const entity = classData.createCharacterEntity(world, 'Shadow');
      const inventory = entity.getComponent('Inventory');
      
      expect(inventory.width).toBe(12);
      expect(inventory.height).toBe(12);
      expect(inventory.grid).toHaveLength(144); // 12 * 12
    });

    test('should work with combat system setup', () => {
      const world = new World();
      const entity = classData.createCharacterEntity(world, 'Templar');
      const combat = entity.getComponent('Combat');
      
      expect(combat.attackDamage).toBe(10);
      expect(combat.criticalChance).toBe(0.05);
      expect(typeof combat.canAttack).toBe('function');
    });
  });
});