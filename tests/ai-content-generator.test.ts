// AI-Powered Content Generation Tests
// Tests advanced procedural content generation using AI techniques

import { 
  AIContentGenerator, 
  createAIContentGenerator, 
  ContentTemplate, 
  GeneratedContent, 
  ContentConstraints,
  AIGeneratorConfig 
} from '../game-core/utils/ai-content-generator';

describe('AI-Powered Content Generation', () => {
  let generator: AIContentGenerator;
  let originalConsoleLog: any;
  let capturedLogs: string[] = [];

  beforeEach(() => {
    // Capture console logs
    originalConsoleLog = console.log;
    capturedLogs = [];
    console.log = (...args) => {
      capturedLogs.push(args.join(' '));
    };

    generator = new AIContentGenerator({
      enableAdvancedGeneration: true,
      maxGenerationTime: 5000,
      qualityThreshold: 0.5,
      enableQualityFiltering: true,
      enableContentCaching: true,
      enableLearning: true
    });
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    generator.destroy();
  });

  test('should create AI content generator with default config', () => {
    const gen = createAIContentGenerator();
    expect(gen).toBeInstanceOf(AIContentGenerator);
    expect((window as any).aiContentGenerator).toBe(gen);
    gen.destroy();
  });

  test('should register and retrieve content templates', () => {
    const template: ContentTemplate = {
      id: 'test-level',
      type: 'level',
      name: 'Test Level Template',
      parameters: { width: 30, height: 30 },
      constraints: {
        minComplexity: 1,
        maxComplexity: 5,
        difficulty: 'medium',
        themes: ['dungeon'],
        excludedElements: [],
        requiredElements: ['entrance', 'exit'],
        balanceFactors: { combat: 0.6, exploration: 0.4 }
      },
      aiModel: 'level_markov',
      version: '1.0.0'
    };

    generator.registerTemplate(template);
    
    const retrieved = generator.getTemplate('test-level');
    expect(retrieved).toEqual(template);
    
    const allTemplates = generator.getAllTemplates();
    expect(allTemplates).toHaveLength(1);
    expect(allTemplates[0]).toEqual(template);
  });

  test('should generate level content', async () => {
    const template: ContentTemplate = {
      id: 'dungeon-level',
      type: 'level',
      name: 'Dungeon Level',
      parameters: {},
      constraints: {
        minComplexity: 2,
        maxComplexity: 8,
        difficulty: 'medium',
        themes: ['dungeon'],
        excludedElements: [],
        requiredElements: [],
        balanceFactors: {}
      },
      aiModel: 'level_markov',
      version: '1.0.0'
    };

    generator.registerTemplate(template);
    
    const content = await generator.generateContent('dungeon-level', {
      width: 25,
      height: 25,
      difficulty: 'medium'
    });

    expect(content).toBeDefined();
    expect(content.type).toBe('level');
    expect(content.template).toBe('dungeon-level');
    expect(content.content).toBeDefined();
    expect(content.content.width).toBe(25);
    expect(content.content.height).toBe(25);
    expect(content.content.layout).toBeDefined();
    expect(content.quality).toBeDefined();
    expect(content.quality.overall).toBeGreaterThan(0);
    expect(content.generationTime).toBeGreaterThan(0);
  });

  test('should generate quest content', async () => {
    const template: ContentTemplate = {
      id: 'adventure-quest',
      type: 'quest',
      name: 'Adventure Quest',
      parameters: {},
      constraints: {
        minComplexity: 1,
        maxComplexity: 6,
        difficulty: 'medium',
        themes: ['adventure'],
        excludedElements: [],
        requiredElements: [],
        balanceFactors: {}
      },
      aiModel: 'quest_neural',
      version: '1.0.0'
    };

    generator.registerTemplate(template);
    
    const content = await generator.generateContent('adventure-quest', {
      type: 'fetch',
      difficulty: 'hard',
      theme: 'mystery'
    });

    expect(content).toBeDefined();
    expect(content.type).toBe('quest');
    expect(content.content.type).toBe('fetch');
    expect(content.content.difficulty).toBe('hard');
    expect(content.content.name).toBeDefined();
    expect(content.content.description).toBeDefined();
    expect(content.content.objectives).toBeDefined();
    expect(content.content.rewards).toBeDefined();
  });

  test('should generate item content', async () => {
    const template: ContentTemplate = {
      id: 'magical-item',
      type: 'item',
      name: 'Magical Item',
      parameters: {},
      constraints: {
        minComplexity: 1,
        maxComplexity: 4,
        difficulty: 'medium',
        themes: ['magic'],
        excludedElements: [],
        requiredElements: [],
        balanceFactors: { power: 0.7, rarity: 0.3 }
      },
      aiModel: 'item_rules',
      version: '1.0.0'
    };

    generator.registerTemplate(template);
    
    const content = await generator.generateContent('magical-item', {
      type: 'weapon',
      rarity: 'rare',
      level: 10
    });

    expect(content).toBeDefined();
    expect(content.type).toBe('item');
    expect(content.content.type).toBe('weapon');
    expect(content.content.rarity).toBe('rare');
    expect(content.content.level).toBe(10);
    expect(content.content.name).toBeDefined();
    expect(content.content.stats).toBeDefined();
    expect(content.content.modifiers).toBeDefined();
    expect(content.content.value).toBeGreaterThan(0);
  });

  test('should generate narrative content', async () => {
    const template: ContentTemplate = {
      id: 'story-narrative',
      type: 'narrative',
      name: 'Story Narrative',
      parameters: {},
      constraints: {
        minComplexity: 2,
        maxComplexity: 7,
        difficulty: 'medium',
        themes: ['fantasy'],
        excludedElements: [],
        requiredElements: [],
        balanceFactors: {}
      },
      aiModel: 'narrative_hybrid',
      version: '1.0.0'
    };

    generator.registerTemplate(template);
    
    const content = await generator.generateContent('story-narrative', {
      type: 'story',
      tone: 'epic',
      length: 'medium'
    });

    expect(content).toBeDefined();
    expect(content.type).toBe('narrative');
    expect(content.content.type).toBe('story');
    expect(content.content.tone).toBe('epic');
    expect(content.content.content).toBeDefined();
    expect(content.content.characters).toBeDefined();
    expect(content.content.plot).toBeDefined();
  });

  test('should generate character content', async () => {
    const template: ContentTemplate = {
      id: 'npc-character',
      type: 'character',
      name: 'NPC Character',
      parameters: {},
      constraints: {
        minComplexity: 1,
        maxComplexity: 5,
        difficulty: 'medium',
        themes: ['fantasy'],
        excludedElements: [],
        requiredElements: [],
        balanceFactors: {}
      },
      aiModel: 'character_hybrid',
      version: '1.0.0'
    };

    generator.registerTemplate(template);
    
    const content = await generator.generateContent('npc-character', {
      class: 'mage',
      level: 5,
      personality: 'wise'
    });

    expect(content).toBeDefined();
    expect(content.type).toBe('character');
    expect(content.content.class).toBe('mage');
    expect(content.content.level).toBe(5);
    expect(content.content.name).toBeDefined();
    expect(content.content.stats).toBeDefined();
    expect(content.content.backstory).toBeDefined();
  });

  test('should generate dialogue content', async () => {
    const template: ContentTemplate = {
      id: 'npc-dialogue',
      type: 'dialogue',
      name: 'NPC Dialogue',
      parameters: {},
      constraints: {
        minComplexity: 1,
        maxComplexity: 3,
        difficulty: 'easy',
        themes: ['conversation'],
        excludedElements: [],
        requiredElements: [],
        balanceFactors: {}
      },
      aiModel: 'dialogue_markov',
      version: '1.0.0'
    };

    generator.registerTemplate(template);
    
    const content = await generator.generateContent('npc-dialogue', {
      speaker: 'merchant',
      context: 'greeting',
      emotion: 'friendly'
    });

    expect(content).toBeDefined();
    expect(content.type).toBe('dialogue');
    expect(content.content.speaker).toBe('merchant');
    expect(content.content.context).toBe('greeting');
    expect(content.content.lines).toBeDefined();
    expect(content.content.responses).toBeDefined();
  });

  test('should use content caching', async () => {
    const template: ContentTemplate = {
      id: 'cached-level',
      type: 'level',
      name: 'Cached Level',
      parameters: {},
      constraints: {
        minComplexity: 1,
        maxComplexity: 3,
        difficulty: 'easy',
        themes: ['simple'],
        excludedElements: [],
        requiredElements: [],
        balanceFactors: {}
      },
      aiModel: 'level_markov',
      version: '1.0.0'
    };

    generator.registerTemplate(template);
    
    const params = { width: 20, height: 20 };
    
    // First generation
    const startTime1 = performance.now();
    const content1 = await generator.generateContent('cached-level', params);
    const time1 = performance.now() - startTime1;
    
    // Second generation (should use cache)
    const startTime2 = performance.now();
    const content2 = await generator.generateContent('cached-level', params);
    const time2 = performance.now() - startTime2;
    
    expect(content1.id).toBe(content2.id); // Same cached content
    expect(time2).toBeLessThan(time1); // Faster due to caching
  });

  test('should force regeneration when requested', async () => {
    const template: ContentTemplate = {
      id: 'force-regen',
      type: 'item',
      name: 'Force Regeneration Item',
      parameters: {},
      constraints: {
        minComplexity: 1,
        maxComplexity: 2,
        difficulty: 'easy',
        themes: ['basic'],
        excludedElements: [],
        requiredElements: [],
        balanceFactors: {}
      },
      aiModel: 'item_rules',
      version: '1.0.0'
    };

    generator.registerTemplate(template);
    
    const params = { type: 'sword', level: 1 };
    
    const content1 = await generator.generateContent('force-regen', params);
    const content2 = await generator.generateContent('force-regen', params, { 
      forceRegenerate: true 
    });
    
    expect(content1.id).not.toBe(content2.id); // Different content IDs
  });

  test('should retry generation for quality threshold', async () => {
    const template: ContentTemplate = {
      id: 'quality-test',
      type: 'quest',
      name: 'Quality Test Quest',
      parameters: {},
      constraints: {
        minComplexity: 1,
        maxComplexity: 2,
        difficulty: 'easy',
        themes: ['test'],
        excludedElements: [],
        requiredElements: [],
        balanceFactors: {}
      },
      aiModel: 'quest_neural',
      version: '1.0.0'
    };

    generator.registerTemplate(template);
    
    const content = await generator.generateContent('quality-test', {}, {
      maxAttempts: 2,
      qualityThreshold: 0.1 // Low threshold for testing
    });
    
    expect(content).toBeDefined();
    expect(content.quality.overall).toBeGreaterThan(0);
  });

  test('should handle generation failures gracefully', async () => {
    const template: ContentTemplate = {
      id: 'invalid-template',
      type: 'invalid' as any, // Invalid type
      name: 'Invalid Template',
      parameters: {},
      constraints: {
        minComplexity: 1,
        maxComplexity: 1,
        difficulty: 'easy',
        themes: [],
        excludedElements: [],
        requiredElements: [],
        balanceFactors: {}
      },
      aiModel: 'invalid_model',
      version: '1.0.0'
    };

    generator.registerTemplate(template);
    
    await expect(
      generator.generateContent('invalid-template')
    ).rejects.toThrow();
  });

  test('should throw error for non-existent template', async () => {
    await expect(
      generator.generateContent('non-existent')
    ).rejects.toThrow('Template not found: non-existent');
  });

  test('should retrieve generated content', async () => {
    const template: ContentTemplate = {
      id: 'retrieve-test',
      type: 'item',
      name: 'Retrieve Test',
      parameters: {},
      constraints: {
        minComplexity: 1,
        maxComplexity: 1,
        difficulty: 'easy',
        themes: ['test'],
        excludedElements: [],
        requiredElements: [],
        balanceFactors: {}
      },
      aiModel: 'item_rules',
      version: '1.0.0'
    };

    generator.registerTemplate(template);
    
    const content = await generator.generateContent('retrieve-test');
    
    const retrieved = generator.getGeneratedContent(content.id);
    expect(retrieved).toEqual(content);
    
    const allGenerated = generator.getAllGeneratedContent();
    expect(allGenerated).toContain(content);
  });

  test('should provide generation statistics', async () => {
    const template: ContentTemplate = {
      id: 'stats-test',
      type: 'level',
      name: 'Stats Test',
      parameters: {},
      constraints: {
        minComplexity: 1,
        maxComplexity: 1,
        difficulty: 'easy',
        themes: ['test'],
        excludedElements: [],
        requiredElements: [],
        balanceFactors: {}
      },
      aiModel: 'level_markov',
      version: '1.0.0'
    };

    generator.registerTemplate(template);
    await generator.generateContent('stats-test');
    
    const stats = generator.getGenerationStats();
    
    expect(stats.templatesCount).toBe(1);
    expect(stats.generatedCount).toBe(1);
    expect(stats.modelsCount).toBeGreaterThan(0);
    expect(stats.averageQuality).toBeGreaterThan(0);
  });

  test('should clear content cache', async () => {
    const template: ContentTemplate = {
      id: 'cache-clear-test',
      type: 'item',
      name: 'Cache Clear Test',
      parameters: {},
      constraints: {
        minComplexity: 1,
        maxComplexity: 1,
        difficulty: 'easy',
        themes: ['test'],
        excludedElements: [],
        requiredElements: [],
        balanceFactors: {}
      },
      aiModel: 'item_rules',
      version: '1.0.0'
    };

    generator.registerTemplate(template);
    
    // Generate content to populate cache
    await generator.generateContent('cache-clear-test');
    
    let stats = generator.getGenerationStats();
    expect(stats.cacheSize).toBeGreaterThan(0);
    
    generator.clearCache();
    
    stats = generator.getGenerationStats();
    expect(stats.cacheSize).toBe(0);
  });

  test('should generate level with specific parameters', async () => {
    const template: ContentTemplate = {
      id: 'param-level',
      type: 'level',
      name: 'Parameterized Level',
      parameters: {},
      constraints: {
        minComplexity: 2,
        maxComplexity: 5,
        difficulty: 'medium',
        themes: ['dungeon'],
        excludedElements: [],
        requiredElements: [],
        balanceFactors: {}
      },
      aiModel: 'level_markov',
      version: '1.0.0'
    };

    generator.registerTemplate(template);
    
    const content = await generator.generateContent('param-level', {
      width: 40,
      height: 30,
      roomCount: 8,
      difficulty: 'hard',
      theme: 'cave'
    });

    expect(content.content.width).toBe(40);
    expect(content.content.height).toBe(30);
    expect(content.content.difficulty).toBe('hard');
    expect(content.content.theme).toBe('cave');
    expect(content.content.rooms).toBeDefined();
    expect(content.content.layout).toBeDefined();
    expect(Array.isArray(content.content.layout)).toBe(true);
    expect(content.content.layout.length).toBe(30); // height
    expect(content.content.layout[0].length).toBe(40); // width
  });

  test('should generate item with modifiers', async () => {
    const template: ContentTemplate = {
      id: 'modifier-item',
      type: 'item',
      name: 'Modifier Item',
      parameters: {},
      constraints: {
        minComplexity: 2,
        maxComplexity: 4,
        difficulty: 'medium',
        themes: ['enchanted'],
        excludedElements: [],
        requiredElements: ['modifiers'],
        balanceFactors: {}
      },
      aiModel: 'item_rules',
      version: '1.0.0'
    };

    generator.registerTemplate(template);
    
    const content = await generator.generateContent('modifier-item', {
      type: 'weapon',
      rarity: 'epic',
      level: 15
    });

    expect(content.content.modifiers).toBeDefined();
    expect(Array.isArray(content.content.modifiers)).toBe(true);
    expect(content.content.stats).toBeDefined();
    expect(content.content.value).toBeGreaterThan(0);
    expect(content.content.enchantments).toBeDefined();
    expect(content.metadata.complexity).toBeGreaterThan(0);
  });

  test('should generate quest with objectives', async () => {
    const template: ContentTemplate = {
      id: 'objective-quest',
      type: 'quest',
      name: 'Objective Quest',
      parameters: {},
      constraints: {
        minComplexity: 3,
        maxComplexity: 6,
        difficulty: 'hard',
        themes: ['adventure'],
        excludedElements: [],
        requiredElements: ['objectives'],
        balanceFactors: {}
      },
      aiModel: 'quest_neural',
      version: '1.0.0'
    };

    generator.registerTemplate(template);
    
    const content = await generator.generateContent('objective-quest', {
      type: 'escort',
      difficulty: 'extreme'
    });

    expect(content.content.objectives).toBeDefined();
    expect(Array.isArray(content.content.objectives)).toBe(true);
    expect(content.content.rewards).toBeDefined();
    expect(content.content.requirements).toBeDefined();
    expect(content.content.estimatedTime).toBeGreaterThan(0);
    expect(content.metadata.estimatedPlayTime).toBeGreaterThan(0);
  });

  test('should maintain content quality metrics', async () => {
    const template: ContentTemplate = {
      id: 'quality-metrics',
      type: 'narrative',
      name: 'Quality Metrics Test',
      parameters: {},
      constraints: {
        minComplexity: 2,
        maxComplexity: 4,
        difficulty: 'medium',
        themes: ['fantasy'],
        excludedElements: [],
        requiredElements: [],
        balanceFactors: {}
      },
      aiModel: 'narrative_hybrid',
      version: '1.0.0'
    };

    generator.registerTemplate(template);
    
    const content = await generator.generateContent('quality-metrics');

    expect(content.quality).toBeDefined();
    expect(content.quality.coherence).toBeGreaterThanOrEqual(0);
    expect(content.quality.coherence).toBeLessThanOrEqual(1);
    expect(content.quality.balance).toBeGreaterThanOrEqual(0);
    expect(content.quality.balance).toBeLessThanOrEqual(1);
    expect(content.quality.originality).toBeGreaterThanOrEqual(0);
    expect(content.quality.originality).toBeLessThanOrEqual(1);
    expect(content.quality.engagement).toBeGreaterThanOrEqual(0);
    expect(content.quality.engagement).toBeLessThanOrEqual(1);
    expect(content.quality.technical).toBeGreaterThanOrEqual(0);
    expect(content.quality.technical).toBeLessThanOrEqual(1);
    expect(content.quality.overall).toBeGreaterThanOrEqual(0);
    expect(content.quality.overall).toBeLessThanOrEqual(1);
  });

  test('should handle different content types correctly', async () => {
    const types = ['level', 'quest', 'item', 'narrative', 'character', 'dialogue'];
    
    for (const type of types) {
      const template: ContentTemplate = {
        id: `test-${type}`,
        type: type as any,
        name: `Test ${type}`,
        parameters: {},
        constraints: {
          minComplexity: 1,
          maxComplexity: 2,
          difficulty: 'easy',
          themes: ['test'],
          excludedElements: [],
          requiredElements: [],
          balanceFactors: {}
        },
        aiModel: `${type}_model`,
        version: '1.0.0'
      };

      generator.registerTemplate(template);
      
      const content = await generator.generateContent(`test-${type}`);
      
      expect(content.type).toBe(type);
      expect(content.content).toBeDefined();
      expect(content.quality).toBeDefined();
    }
  });

  test('should handle template constraints', async () => {
    const template: ContentTemplate = {
      id: 'constrained-content',
      type: 'level',
      name: 'Constrained Content',
      parameters: {},
      constraints: {
        minComplexity: 3,
        maxComplexity: 7,
        difficulty: 'hard',
        themes: ['challenge'],
        excludedElements: ['easy_enemies'],
        requiredElements: ['boss_room', 'treasure'],
        balanceFactors: { combat: 0.8, puzzle: 0.2 }
      },
      aiModel: 'level_markov',
      version: '1.0.0'
    };

    generator.registerTemplate(template);
    
    const content = await generator.generateContent('constrained-content');
    
    expect(content.metadata.complexity).toBeGreaterThanOrEqual(3);
    expect(content.metadata.complexity).toBeLessThanOrEqual(7);
    expect(content.content.difficulty).toBe('hard');
    expect(content.metadata.tags).toContain('challenge');
  });
});