// Tests for Character Progression System
const { CharacterProgression, ExperienceSystem } = require('../game-core/character/progression/character-progression');
const { World, Entity, Component } = require('../game-core/ecs/ecs-core');
const { 
  Health, Mana, Level, Experience, Attributes, 
  CharacterClass, SkillTree 
} = require('../game-core/components/ecs-components');

describe('CharacterProgression', () => {
  let progression;
  let world;
  let entity;

  beforeEach(() => {
    progression = new CharacterProgression();
    world = new World();
    entity = world.createEntity();
    
    // Setup test entity with required components
    entity.addComponent(new Level(1));
    entity.addComponent(new Experience(0, 0));
    entity.addComponent(new Health(50, 50));
    entity.addComponent(new Mana(30, 30));
    entity.addComponent(new Attributes(10, 10, 10));
    entity.addComponent(new CharacterClass('Marauder', 'strength', null));
    entity.addComponent(new SkillTree());
  });

  describe('Experience Table', () => {
    test('should generate correct experience requirements', () => {
      expect(progression.getTotalExperienceForLevel(1)).toBe(0);
      expect(progression.getTotalExperienceForLevel(2)).toBeGreaterThan(0);
      expect(progression.getTotalExperienceForLevel(10)).toBeGreaterThan(
        progression.getTotalExperienceForLevel(9)
      );
    });

    test('should cap at level 60', () => {
      expect(progression.levelCap).toBe(60);
      expect(progression.experienceTable.length).toBe(60);
    });

    test('should have exponential scaling', () => {
      const level10 = progression.getTotalExperienceForLevel(10);
      const level20 = progression.getTotalExperienceForLevel(20);
      const level30 = progression.getTotalExperienceForLevel(30);
      
      // Each 10 levels should require significantly more XP
      expect(level20 - level10).toBeGreaterThan(level10);
      expect(level30 - level20).toBeGreaterThan(level20 - level10);
    });
  });

  describe('Level Up System', () => {
    test('should level up when enough experience is gained', () => {
      const experience = entity.getComponent('Experience');
      const level = entity.getComponent('Level');
      
      // Add enough XP for level 2
      const requiredXP = progression.getExperienceToNextLevel(1);
      experience.current = requiredXP;
      
      expect(progression.canLevelUp(entity)).toBe(true);
      
      const result = progression.levelUp(entity);
      expect(result).toBe(true);
      expect(level.current).toBe(2);
      expect(experience.current).toBe(0);
    });

    test('should award skill points on level up', () => {
      const experience = entity.getComponent('Experience');
      const skillTree = entity.getComponent('SkillTree');
      
      const initialPoints = skillTree.availablePoints;
      experience.current = progression.getExperienceToNextLevel(1);
      
      progression.levelUp(entity);
      
      expect(skillTree.availablePoints).toBe(initialPoints + 1);
    });

    test('should allocate attributes based on class', () => {
      const experience = entity.getComponent('Experience');
      const attributes = entity.getComponent('Attributes');
      const characterClass = entity.getComponent('CharacterClass');
      
      // Debug: check what allocation Marauder should get
      const defaultChoice = progression.getDefaultAttributeChoice(entity);
      expect(defaultChoice).toBe('strength_focus');
      expect(characterClass.name).toBe('Marauder');
      
      const initialStr = attributes.strength;
      const initialDex = attributes.dexterity;
      const initialInt = attributes.intelligence;
      
      experience.current = progression.getExperienceToNextLevel(1);
      
      // Marauder should get strength focus
      progression.levelUp(entity);
      
      // Marauder gets strength_focus allocation which gives +2 str
      expect(attributes.strength).toBe(initialStr + 2);
      expect(attributes.dexterity).toBe(initialDex); // Unchanged
      expect(attributes.intelligence).toBe(initialInt); // Unchanged
    });

    test('should update derived stats on level up', () => {
      const experience = entity.getComponent('Experience');
      const health = entity.getComponent('Health');
      const mana = entity.getComponent('Mana');
      
      const initialMaxHealth = health.maximum;
      const initialMaxMana = mana.maximum;
      
      experience.current = progression.getExperienceToNextLevel(1);
      progression.levelUp(entity);
      
      expect(health.maximum).toBeGreaterThan(initialMaxHealth);
      expect(mana.maximum).toBeGreaterThan(initialMaxMana);
    });
  });

  describe('Quest Rewards', () => {
    test('should award quest skill points', () => {
      const skillTree = entity.getComponent('SkillTree');
      const initialPoints = skillTree.availablePoints;
      
      const result = progression.awardQuestSkillPoints(entity, 'enemy_at_the_gate');
      
      expect(result).toBe(true);
      expect(skillTree.availablePoints).toBe(initialPoints + 1);
      expect(skillTree.questRewardsReceived.has('enemy_at_the_gate')).toBe(true);
    });

    test('should not award quest points twice', () => {
      const skillTree = entity.getComponent('SkillTree');
      
      progression.awardQuestSkillPoints(entity, 'enemy_at_the_gate');
      const pointsAfterFirst = skillTree.availablePoints;
      
      const result = progression.awardQuestSkillPoints(entity, 'enemy_at_the_gate');
      
      expect(result).toBe(false);
      expect(skillTree.availablePoints).toBe(pointsAfterFirst);
    });
  });

  describe('Progression Validation', () => {
    test('should validate correct progression state', () => {
      const errors = progression.validateProgression(entity);
      expect(errors).toHaveLength(0);
    });

    test('should detect invalid level', () => {
      const level = entity.getComponent('Level');
      level.current = 100; // Above cap
      
      const errors = progression.validateProgression(entity);
      expect(errors).toContain('Invalid level: 100');
    });
  });
});

describe('ExperienceSystem', () => {
  let expSystem;
  let world;
  let entity;

  beforeEach(() => {
    expSystem = new ExperienceSystem();
    world = new World();
    entity = world.createEntity();
    
    entity.addComponent(new Level(10));
    entity.addComponent(new Experience(0, 1000));
    entity.addComponent(new Health(100, 100));
    entity.addComponent(new Mana(50, 50));
    entity.addComponent(new Attributes(20, 15, 10));
    entity.addComponent(new CharacterClass('Ranger', 'dexterity', null));
    entity.addComponent(new SkillTree());
  });

  describe('Experience Calculation', () => {
    test('should calculate enemy experience based on level difference', () => {
      const characterLevel = 10;
      
      // Same level enemy
      const sameLevel = expSystem.calculateEnemyExperience(10, characterLevel);
      expect(sameLevel).toBeGreaterThan(0);
      
      // Lower level enemy (should give less XP)
      const lowerLevel = expSystem.calculateEnemyExperience(5, characterLevel);
      expect(lowerLevel).toBeLessThan(sameLevel);
      
      // Higher level enemy (should give more XP)
      const higherLevel = expSystem.calculateEnemyExperience(15, characterLevel);
      expect(higherLevel).toBeGreaterThan(sameLevel);
    });

    test('should apply diminishing returns for low level enemies', () => {
      const characterLevel = 20;
      
      const level15 = expSystem.calculateEnemyExperience(15, characterLevel);
      const level10 = expSystem.calculateEnemyExperience(10, characterLevel);
      const level5 = expSystem.calculateEnemyExperience(5, characterLevel);
      
      // XP should drop significantly for enemies much lower level
      expect(level10 / level15).toBeLessThan(0.7);
      expect(level5 / level10).toBeLessThan(0.5);
    });
  });

  describe('Experience Awards', () => {
    test('should award experience and trigger level ups', () => {
      const experience = entity.getComponent('Experience');
      const level = entity.getComponent('Level');
      
      const initialLevel = level.current;
      const initialXP = experience.total;
      
      // Award enough XP to level up
      const awarded = expSystem.awardExperience(entity, 10000, 'quest_completion');
      
      expect(awarded).toBeGreaterThan(0);
      expect(experience.total).toBe(initialXP + awarded);
      expect(level.current).toBeGreaterThan(initialLevel);
    });

    test('should apply source multipliers', () => {
      const enemyKillXP = expSystem.scaleExperienceByLevel(100, 10, 'enemy_kill');
      const questXP = expSystem.scaleExperienceByLevel(100, 10, 'quest_completion');
      const bossXP = expSystem.scaleExperienceByLevel(100, 10, 'boss_kill');
      
      expect(questXP).toBeGreaterThan(enemyKillXP);
      expect(bossXP).toBeGreaterThan(enemyKillXP);
    });
  });
});