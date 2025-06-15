// Active Skill Gems System Tests
// Test-driven development for skill gem functionality

const { 
  SkillGem, Socket, SocketGroup, SkillGemDatabase, SkillCalculator 
} = require('../game-core/character/skills/skill-gems');

describe('Skill Gems System', () => {
  let gemDB;
  let testGem;
  let testSocket;

  beforeEach(() => {
    gemDB = new SkillGemDatabase();
    testGem = new SkillGem(
      'test_fireball',
      'Test Fireball',
      'active',
      { level: 1, strength: 0, dexterity: 0, intelligence: 12 },
      { damage: 15, manaCost: 6, castTime: 0.75 },
      'A test fireball spell'
    );
    testSocket = new Socket('blue', 0, 0);
  });

  describe('SkillGem', () => {
    test('should create skill gem with correct properties', () => {
      expect(testGem.id).toBe('test_fireball');
      expect(testGem.name).toBe('Test Fireball');
      expect(testGem.type).toBe('active');
      expect(testGem.level).toBe(1);
      expect(testGem.socketColor).toBe('blue');
      expect(testGem.baseStats.damage).toBe(15);
    });

    test('should determine socket color from requirements', () => {
      const redGem = new SkillGem('test_str', 'Test Str', 'active', 
        { level: 1, strength: 15, dexterity: 5, intelligence: 5 }, {}, '');
      const greenGem = new SkillGem('test_dex', 'Test Dex', 'active',
        { level: 1, strength: 5, dexterity: 15, intelligence: 5 }, {}, '');
      const blueGem = new SkillGem('test_int', 'Test Int', 'active',
        { level: 1, strength: 5, dexterity: 5, intelligence: 15 }, {}, '');

      expect(redGem.socketColor).toBe('red');
      expect(greenGem.socketColor).toBe('green');
      expect(blueGem.socketColor).toBe('blue');
    });

    test('should scale stats with gem level', () => {
      testGem.level = 5;
      const currentStats = testGem.getCurrentStats();
      
      // 6% increase per level: level 5 = 24% increase
      expect(currentStats.damage).toBe(Math.ceil(15 * 1.24));
      expect(currentStats.manaCost).toBe(Math.ceil(6 * 1.24));
    });

    test('should apply quality bonus to damage stats', () => {
      testGem.qualityBonus = 20; // 20% quality
      const currentStats = testGem.getCurrentStats();
      
      expect(currentStats.damage).toBe(Math.floor(15 * 1.2)); // 20% quality bonus
    });

    test('should handle experience and leveling', () => {
      expect(testGem.canLevelUp()).toBe(false);
      
      testGem.addExperience(1000);
      expect(testGem.level).toBe(2);
      expect(testGem.canLevelUp()).toBe(false);
      
      testGem.addExperience(1100); // Enough for level 3
      expect(testGem.level).toBe(3);
    });

    test('should check requirements correctly', () => {
      const mockCharacter = {
        getComponent: (type) => {
          if (type === 'Level') return { current: 1 };
          if (type === 'Attributes') return { strength: 10, dexterity: 10, intelligence: 15 };
          return null;
        }
      };

      expect(testGem.meetsRequirements(mockCharacter)).toBe(true);

      const lowIntCharacter = {
        getComponent: (type) => {
          if (type === 'Level') return { current: 1 };
          if (type === 'Attributes') return { strength: 10, dexterity: 10, intelligence: 5 };
          return null;
        }
      };

      expect(testGem.meetsRequirements(lowIntCharacter)).toBe(false);
    });

    test('should clone correctly', () => {
      testGem.level = 3;
      testGem.experience = 500;
      testGem.qualityBonus = 10;
      testGem.tags = ['spell', 'fire'];

      const cloned = testGem.clone();
      
      expect(cloned.id).toBe(testGem.id);
      expect(cloned.level).toBe(3);
      expect(cloned.experience).toBe(500);
      expect(cloned.qualityBonus).toBe(10);
      expect(cloned.tags).toEqual(['spell', 'fire']);
      expect(cloned).not.toBe(testGem); // Different instances
    });
  });

  describe('Socket', () => {
    test('should create socket with correct properties', () => {
      expect(testSocket.color).toBe('blue');
      expect(testSocket.position.x).toBe(0);
      expect(testSocket.position.y).toBe(0);
      expect(testSocket.gem).toBeNull();
      expect(testSocket.linkedSockets).toEqual([]);
    });

    test('should socket compatible gems', () => {
      expect(testSocket.canSocketGem(testGem)).toBe(true);
      expect(testSocket.socketGem(testGem)).toBe(true);
      expect(testSocket.gem).toBe(testGem);
    });

    test('should reject incompatible gems', () => {
      const redGem = new SkillGem('test_red', 'Test Red', 'active',
        { level: 1, strength: 15, dexterity: 0, intelligence: 0 }, {}, '');
      
      expect(testSocket.canSocketGem(redGem)).toBe(false);
      expect(testSocket.socketGem(redGem)).toBe(false);
      expect(testSocket.gem).toBeNull();
    });

    test('should allow white sockets to accept any gem', () => {
      const whiteSocket = new Socket('white', 0, 0);
      const redGem = new SkillGem('test_red', 'Test Red', 'active',
        { level: 1, strength: 15, dexterity: 0, intelligence: 0 }, {}, '');
      
      expect(whiteSocket.canSocketGem(redGem)).toBe(true);
      expect(whiteSocket.canSocketGem(testGem)).toBe(true);
    });

    test('should not allow socketing when occupied', () => {
      testSocket.socketGem(testGem);
      
      const anotherGem = testGem.clone();
      expect(testSocket.canSocketGem(anotherGem)).toBe(false);
      expect(testSocket.socketGem(anotherGem)).toBe(false);
    });

    test('should unsocket gems correctly', () => {
      testSocket.socketGem(testGem);
      
      const unsocketed = testSocket.unsocketGem();
      expect(unsocketed).toBe(testGem);
      expect(testSocket.gem).toBeNull();
    });
  });

  describe('SocketGroup', () => {
    let socketGroup;
    let socket1, socket2, socket3;

    beforeEach(() => {
      socket1 = new Socket('blue', 0, 0);
      socket2 = new Socket('red', 20, 0);
      socket3 = new Socket('green', 40, 0);
      socketGroup = new SocketGroup([socket1, socket2, socket3]);
    });

    test('should create socket group with sockets', () => {
      expect(socketGroup.sockets.length).toBe(3);
      expect(socketGroup.links).toEqual([]);
    });

    test('should add links between sockets', () => {
      expect(socketGroup.addLink(0, 1)).toBe(true);
      expect(socketGroup.links).toContainEqual([0, 1]);
      expect(socket1.isLinkedTo(socket2)).toBe(true);
      expect(socket2.isLinkedTo(socket1)).toBe(true);
    });

    test('should remove links between sockets', () => {
      socketGroup.addLink(0, 1);
      socketGroup.removeLink(0, 1);
      
      expect(socketGroup.links).toEqual([]);
      expect(socket1.isLinkedTo(socket2)).toBe(false);
      expect(socket2.isLinkedTo(socket1)).toBe(false);
    });

    test('should find active skill setups', () => {
      const activeGem = gemDB.getActiveGem('fireball');
      const supportGem = gemDB.getSupportGem('faster_casting');
      
      // Create fresh sockets to ensure no conflicts
      const freshSocketGroup = new SocketGroup([
        new Socket('blue', 0, 0),
        new Socket('blue', 20, 0)
      ]);
      
      // Socket gems
      freshSocketGroup.sockets[0].socketGem(activeGem);
      freshSocketGroup.sockets[1].socketGem(supportGem);
      freshSocketGroup.addLink(0, 1);
      
      const setups = freshSocketGroup.getActiveSkillSetups();
      expect(setups.length).toBe(1);
      expect(setups[0].activeGem).toBe(activeGem);
      expect(setups[0].supportGems.length).toBe(1);
      expect(setups[0].supportGems[0]).toBe(supportGem);
    });

    test('should respect support gem compatibility', () => {
      const activeGem = gemDB.getActiveGem('heavy_strike'); // melee attack
      const spellSupport = gemDB.getSupportGem('faster_casting'); // spell only
      const meleeSupport = gemDB.getSupportGem('melee_physical_damage'); // melee compatible
      
      // Create fresh socket group with correct colors
      const compatSocketGroup = new SocketGroup([
        new Socket('red', 0, 0),    // For heavy strike (strength gem)
        new Socket('blue', 20, 0),  // For faster casting (spell support)
        new Socket('red', 40, 0)    // For melee physical damage (strength support)
      ]);
      
      compatSocketGroup.sockets[0].socketGem(activeGem);
      compatSocketGroup.sockets[1].socketGem(spellSupport);
      compatSocketGroup.sockets[2].socketGem(meleeSupport);
      compatSocketGroup.addLink(0, 1);
      compatSocketGroup.addLink(0, 2);
      
      const setups = compatSocketGroup.getActiveSkillSetups();
      expect(setups.length).toBe(1);
      expect(setups[0].supportGems.length).toBe(1);
      expect(setups[0].supportGems[0].id).toBe('melee_physical_damage');
    });
  });

  describe('SkillGemDatabase', () => {
    test('should initialize with active and support gems', () => {
      expect(gemDB.getAllActiveGems().length).toBeGreaterThan(5);
      expect(gemDB.getAllSupportGems().length).toBeGreaterThan(5);
    });

    test('should retrieve specific gems', () => {
      const fireball = gemDB.getActiveGem('fireball');
      const fasterCasting = gemDB.getSupportGem('faster_casting');
      
      expect(fireball).toBeDefined();
      expect(fireball.name).toBe('Fireball');
      expect(fireball.type).toBe('active');
      
      expect(fasterCasting).toBeDefined();
      expect(fasterCasting.name).toBe('Faster Casting Support');
      expect(fasterCasting.type).toBe('support');
    });

    test('should return cloned gems', () => {
      const fireball1 = gemDB.getActiveGem('fireball');
      const fireball2 = gemDB.getActiveGem('fireball');
      
      expect(fireball1).not.toBe(fireball2); // Different instances
      expect(fireball1.id).toBe(fireball2.id); // Same data
    });

    test('should get gems by character class', () => {
      const marauderGems = gemDB.getGemsByClass('Marauder');
      const witchGems = gemDB.getGemsByClass('Witch');
      
      expect(marauderGems.length).toBeGreaterThan(0);
      expect(witchGems.length).toBeGreaterThan(0);
      
      const hasHeavyStrike = marauderGems.some(gem => gem.id === 'heavy_strike');
      const hasFireball = witchGems.some(gem => gem.id === 'fireball');
      
      expect(hasHeavyStrike).toBe(true);
      expect(hasFireball).toBe(true);
    });

    test('should search gems by query', () => {
      const fireGems = gemDB.searchGems('fire');
      const spellGems = gemDB.searchGems('spell', 'active');
      
      expect(fireGems.length).toBeGreaterThan(0);
      expect(spellGems.length).toBeGreaterThan(0);
      
      const hasFireball = fireGems.some(gem => gem.id === 'fireball');
      expect(hasFireball).toBe(true);
    });
  });

  describe('SkillCalculator', () => {
    test('should calculate skill damage with support gems', () => {
      const activeGem = gemDB.getActiveGem('fireball');
      const supportGem = gemDB.getSupportGem('added_fire_damage');
      
      const skillSetup = {
        activeGem,
        supportGems: [supportGem]
      };
      
      const stats = SkillCalculator.calculateSkillDamage(skillSetup, {});
      
      expect(stats.damage).toBeGreaterThan(activeGem.getCurrentStats().damage);
      expect(stats.addedFireDamage).toBeGreaterThan(0);
      expect(stats.manaCost).toBeGreaterThan(activeGem.getCurrentStats().manaCost);
    });

    test('should apply character stats', () => {
      const activeGem = gemDB.getActiveGem('fireball');
      activeGem.tags = ['spell', 'fire'];
      
      const skillSetup = { activeGem, supportGems: [] };
      const characterStats = { spellDamageInc: 50 }; // 50% increased spell damage
      
      const stats = SkillCalculator.calculateSkillDamage(skillSetup, characterStats);
      
      expect(Math.floor(stats.damage)).toBe(Math.floor(activeGem.getCurrentStats().damage * 1.5));
    });

    test('should handle multiple support gem modifications', () => {
      const activeGem = gemDB.getActiveGem('fireball');
      const addedFire = gemDB.getSupportGem('added_fire_damage');
      const fasterCasting = gemDB.getSupportGem('faster_casting');
      
      const skillSetup = {
        activeGem,
        supportGems: [addedFire, fasterCasting]
      };
      
      const stats = SkillCalculator.calculateSkillDamage(skillSetup, {});
      
      expect(stats.castTime).toBeLessThan(activeGem.getCurrentStats().castTime);
      expect(stats.addedFireDamage).toBeGreaterThan(0);
      expect(stats.manaCost).toBeGreaterThan(activeGem.getCurrentStats().manaCost);
    });

    test('should check if character can use skill', () => {
      const activeGem = gemDB.getActiveGem('fireball');
      const skillSetup = { activeGem, supportGems: [] };
      
      const mockCharacter = {
        getComponent: (type) => {
          if (type === 'Level') return { current: 1 };
          if (type === 'Attributes') return { strength: 10, dexterity: 10, intelligence: 15 };
          if (type === 'Mana') return { current: 20, maximum: 50 };
          return null;
        }
      };
      
      expect(SkillCalculator.canUseSkill(skillSetup, mockCharacter)).toBe(true);
      
      const lowManaCharacter = {
        getComponent: (type) => {
          if (type === 'Level') return { current: 1 };
          if (type === 'Attributes') return { strength: 10, dexterity: 10, intelligence: 15 };
          if (type === 'Mana') return { current: 2, maximum: 50 }; // Not enough mana
          return null;
        }
      };
      
      expect(SkillCalculator.canUseSkill(skillSetup, lowManaCharacter)).toBe(false);
    });
  });

  describe('Integration Tests', () => {
    test('should create complete skill setup', () => {
      const socketGroup = new SocketGroup([
        new Socket('blue', 0, 0),
        new Socket('blue', 20, 0),
        new Socket('red', 40, 0)
      ]);
      
      const fireball = gemDB.getActiveGem('fireball');
      const fasterCasting = gemDB.getSupportGem('faster_casting');
      const addedFire = gemDB.getSupportGem('added_fire_damage');
      
      socketGroup.sockets[0].socketGem(fireball);
      socketGroup.sockets[1].socketGem(fasterCasting);
      socketGroup.sockets[2].socketGem(addedFire);
      
      socketGroup.addLink(0, 1);
      socketGroup.addLink(0, 2);
      
      const setups = socketGroup.getActiveSkillSetups();
      expect(setups.length).toBe(1);
      
      const skillStats = SkillCalculator.calculateSkillDamage(setups[0], {});
      expect(skillStats.castTime).toBeLessThan(fireball.getCurrentStats().castTime);
      expect(skillStats.addedFireDamage).toBeGreaterThan(0);
    });

    test('should handle gem leveling in setup', () => {
      const fireball = gemDB.getActiveGem('fireball');
      fireball.addExperience(5000); // Level up multiple times
      
      const baseDamage = fireball.baseStats.damage;
      const currentDamage = fireball.getCurrentStats().damage;
      
      expect(currentDamage).toBeGreaterThan(baseDamage);
      expect(fireball.level).toBeGreaterThan(1);
    });

    test('should respect socket color restrictions', () => {
      const redSocket = new Socket('red', 0, 0);
      const blueGem = gemDB.getActiveGem('fireball'); // Intelligence gem = blue
      const redGem = gemDB.getActiveGem('heavy_strike'); // Strength gem = red
      
      expect(redSocket.canSocketGem(blueGem)).toBe(false);
      expect(redSocket.canSocketGem(redGem)).toBe(true);
    });
  });
});