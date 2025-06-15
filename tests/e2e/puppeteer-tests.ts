/**
 * End-to-End Tests for RainStorm ARPG using Puppeteer MCP
 * Automated browser testing for game functionality
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import * as path from 'path';

interface GameState {
  world?: {
    entities: Map<string, any>;
    createEntity: () => any;
  };
  characterClasses?: Record<string, any>;
  inventorySystem?: any;
  itemFactory?: any;
  currencySystem?: any;
  HealthComponent?: any;
  PositionComponent?: any;
}

interface PerformanceMetrics {
  averageFPS: number;
  entityCount: number;
  memoryUsed: number;
  duration: number;
}

interface TestResults {
  gameLoading: boolean;
  characterCreation: boolean;
  inventorySystem: boolean;
  craftingSystem: boolean;
  performance: boolean;
}

export class GameE2ETests {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private gameUrl: string = 'http://localhost:8080'; // Development server

  async setup(): Promise<void> {
    console.log('🚀 Starting E2E test setup...');
    
    this.browser = await puppeteer.launch({
      headless: false, // Set to true for CI
      devtools: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security'
      ]
    });
    
    this.page = await this.browser.newPage();
    
    // Set viewport for consistent testing
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    // Enable console logging
    this.page.on('console', msg => {
      console.log('🎮 Game Console:', msg.text());
    });
    
    // Handle errors
    this.page.on('pageerror', error => {
      console.error('❌ Page Error:', error.message);
    });
  }

  async teardown(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }

  /**
   * Test 1: Game Loading and Initialization
   */
  async testGameLoading(): Promise<boolean> {
    console.log('🧪 Testing game loading...');
    
    if (!this.page) {
      console.error('Page not initialized');
      return false;
    }
    
    try {
      // Navigate to game
      await this.page.goto(this.gameUrl, { waitUntil: 'networkidle0' });
      
      // Wait for game canvas
      await this.page.waitForSelector('#game-canvas', { timeout: 10000 });
      
      // Check if game state is initialized
      const gameState = await this.page.evaluate(() => {
        return (window as any).gameState ? true : false;
      });
      
      if (!gameState) {
        throw new Error('Game state not initialized');
      }
      
      // Check FPS counter
      await this.page.waitForSelector('#fpsDisplay', { timeout: 5000 });
      
      const fps = await this.page.$eval('#fpsDisplay', el => el.textContent);
      console.log(`📊 Current FPS: ${fps}`);
      
      // Take screenshot
      await this.page.screenshot({ 
        path: 'tests/screenshots/game-loading.png',
        fullPage: true 
      });
      
      console.log('✅ Game loading test passed');
      return true;
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Game loading test failed:', message);
      await this.page.screenshot({ 
        path: 'tests/screenshots/game-loading-error.png' 
      });
      return false;
    }
  }

  /**
   * Test 2: Character Creation
   */
  async testCharacterCreation(): Promise<boolean> {
    console.log('🧪 Testing character creation...');
    
    if (!this.page) {
      console.error('Page not initialized');
      return false;
    }
    
    try {
      // Check if character classes are available
      const classes = await this.page.evaluate(() => {
        const gameState: GameState = (window as any).gameState;
        const classData = gameState?.characterClasses;
        return classData ? Object.keys(classData) : [];
      });
      
      console.log(`📋 Available classes: ${classes.join(', ')}`);
      
      if (classes.length < 7) {
        throw new Error('Not all character classes available');
      }
      
      // Create a test character
      const character = await this.page.evaluate(() => {
        const gameState: GameState = (window as any).gameState;
        const world = gameState.world;
        if (!world) throw new Error('World not available');
        
        const entity = world.createEntity();
        
        // Add character components
        const HealthComponent = gameState.HealthComponent;
        const PositionComponent = gameState.PositionComponent;
        
        if (HealthComponent) {
          entity.addComponent(new HealthComponent({ max: 100, current: 100 }));
        }
        
        if (PositionComponent) {
          entity.addComponent(new PositionComponent({ x: 400, y: 300 }));
        }
        
        return {
          id: entity.id,
          componentCount: entity.components.size
        };
      });
      
      console.log(`👤 Created character with ${character.componentCount} components`);
      
      // Take screenshot
      await this.page.screenshot({ 
        path: 'tests/screenshots/character-creation.png' 
      });
      
      console.log('✅ Character creation test passed');
      return true;
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Character creation test failed:', message);
      return false;
    }
  }

  /**
   * Test 3: Inventory System
   */
  async testInventorySystem(): Promise<boolean> {
    console.log('🧪 Testing inventory system...');
    
    if (!this.page) {
      console.error('Page not initialized');
      return false;
    }
    
    try {
      // Test inventory creation and item placement
      const inventoryTest = await this.page.evaluate(() => {
        const gameState: GameState = (window as any).gameState;
        const inventorySystem = gameState?.inventorySystem;
        const itemFactory = gameState?.itemFactory;
        
        if (!inventorySystem || !itemFactory) {
          return { success: false, error: 'Systems not available' };
        }
        
        try {
          // Create test inventory
          const world = gameState.world;
          if (!world) throw new Error('World not available');
          
          const entity = world.createEntity();
          const inventory = inventorySystem.createInventory(entity);
          
          // Generate test item
          const item = itemFactory.generateItem('weapon', 'sword', 50);
          
          // Try to place item
          const placed = inventorySystem.placeItem(inventory, item, 0, 0);
          
          return {
            success: true,
            inventorySize: inventory.width * inventory.height,
            itemPlaced: placed,
            itemName: item.name
          };
          
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          return { success: false, error: message };
        }
      });
      
      if (!inventoryTest.success) {
        throw new Error(inventoryTest.error);
      }
      
      console.log(`📦 Inventory test: ${inventoryTest.inventorySize} slots, item "${inventoryTest.itemName}" placed: ${inventoryTest.itemPlaced}`);
      
      console.log('✅ Inventory system test passed');
      return true;
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Inventory system test failed:', message);
      return false;
    }
  }

  /**
   * Test 4: Crafting System
   */
  async testCraftingSystem(): Promise<boolean> {
    console.log('🧪 Testing crafting system...');
    
    if (!this.page) {
      console.error('Page not initialized');
      return false;
    }
    
    try {
      const craftingTest = await this.page.evaluate(() => {
        const gameState: GameState = (window as any).gameState;
        const currencySystem = gameState?.currencySystem;
        const itemFactory = gameState?.itemFactory;
        
        if (!currencySystem || !itemFactory) {
          return { success: false, error: 'Crafting systems not available' };
        }
        
        try {
          // Create test item
          const item = itemFactory.generateItem('weapon', 'sword', 50);
          
          // Test currency application
          const result = currencySystem.applyCurrency('ORB_OF_ALCHEMY', item);
          
          return {
            success: result.success,
            itemRarity: result.item?.rarity,
            affixCount: result.item?.affixes?.length || 0
          };
          
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          return { success: false, error: message };
        }
      });
      
      if (!craftingTest.success) {
        throw new Error(craftingTest.error);
      }
      
      console.log(`⚒️ Crafting test: Item rarity: ${craftingTest.itemRarity}, Affixes: ${craftingTest.affixCount}`);
      
      console.log('✅ Crafting system test passed');
      return true;
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Crafting system test failed:', message);
      return false;
    }
  }

  /**
   * Test 5: Performance Testing
   */
  async testPerformance(): Promise<boolean> {
    console.log('🧪 Testing game performance...');
    
    if (!this.page) {
      console.error('Page not initialized');
      return false;
    }
    
    try {
      // Monitor performance for 10 seconds
      const metrics: PerformanceMetrics = await this.page.evaluate(() => {
        return new Promise<PerformanceMetrics>((resolve) => {
          const startTime = performance.now();
          const samples: number[] = [];
          
          function measureFrame() {
            const now = performance.now();
            const fps = 1000 / (now - (samples[samples.length - 1] || startTime));
            samples.push(now);
            
            if (now - startTime < 10000) { // 10 seconds
              requestAnimationFrame(measureFrame);
            } else {
              const avgFps = samples.length / ((now - startTime) / 1000);
              const gameState: GameState = (window as any).gameState;
              const entityCount = gameState?.world?.entities?.size || 0;
              
              resolve({
                averageFPS: Math.round(avgFps),
                entityCount: entityCount,
                memoryUsed: (performance as any).memory?.usedJSHeapSize || 0,
                duration: now - startTime
              });
            }
          }
          
          requestAnimationFrame(measureFrame);
        });
      });
      
      console.log('📊 Performance Metrics:');
      console.log(`   Average FPS: ${metrics.averageFPS}`);
      console.log(`   Entity Count: ${metrics.entityCount}`);
      console.log(`   Memory Used: ${Math.round(metrics.memoryUsed / 1024 / 1024)}MB`);
      console.log(`   Test Duration: ${Math.round(metrics.duration)}ms`);
      
      // Check if performance meets requirements
      if (metrics.averageFPS < 30) {
        throw new Error(`FPS too low: ${metrics.averageFPS} (expected >30)`);
      }
      
      console.log('✅ Performance test passed');
      return true;
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Performance test failed:', message);
      return false;
    }
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<TestResults> {
    console.log('🎮 Starting RainStorm ARPG E2E Tests');
    console.log('=====================================');
    
    await this.setup();
    
    const results: TestResults = {
      gameLoading: await this.testGameLoading(),
      characterCreation: await this.testCharacterCreation(),
      inventorySystem: await this.testInventorySystem(),
      craftingSystem: await this.testCraftingSystem(),
      performance: await this.testPerformance()
    };
    
    await this.teardown();
    
    // Summary
    const passed = Object.values(results).filter(r => r).length;
    const total = Object.keys(results).length;
    
    console.log('\n📊 Test Results Summary');
    console.log('=======================');
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`❌ Failed: ${total - passed}/${total}`);
    
    if (passed === total) {
      console.log('🎉 All tests passed!');
    } else {
      console.log('⚠️ Some tests failed - check logs above');
    }
    
    return results;
  }
}

// Run tests if called directly
if (typeof require !== 'undefined' && require.main === module) {
  const tests = new GameE2ETests();
  tests.runAllTests()
    .then(results => {
      const allPassed = Object.values(results).every(r => r);
      process.exit(allPassed ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    });
}

export { GameE2ETests };