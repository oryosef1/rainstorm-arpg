// RainStorm ARPG - Dashboard Demo Script
// Demonstrates the real-time development dashboard with live data

interface World {
  entities: Map<string, Entity>;
  systems: Map<string, any>;
  createEntity(id: string): Entity;
  addSystem(system: any): void;
  update(deltaTime: number): void;
  cleanup(): void;
}

interface Entity {
  id: string;
  components: Map<string, any>;
  addComponent(component: any): void;
  getComponent(name: string): any;
}

interface DashboardIntegration {
  logEvent(type: string, data: any): void;
  destroy(): void;
}

interface Position {
  new(id: string, x: number, y: number, z: number): any;
}

interface Velocity {
  new(id: string, x: number, y: number, z: number): any;
  setVelocity(x: number, y: number, z: number): void;
}

interface Health {
  new(id: string, health: number): any;
}

interface Combat {
  new(id: string, attack: number): any;
}

interface Sprite {
  new(id: string, color: string, size: number): any;
}

export class DashboardDemo {
  private world: World | null = null;
  private dashboardIntegration: DashboardIntegration | null = null;
  private running: boolean = false;
  private entityCount: number = 0;

  async start(): Promise<void> {
    console.log('🚀 Starting RainStorm ARPG Dashboard Demo...');
    
    try {
      // Import the compiled TypeScript modules
      const { createWorld } = await import('../dist/game-core/ecs/ecs-core.js');
      const { Position, Velocity, Health, Combat, Sprite } = await import('../dist/game-core/components/ecs-components.js');
      const { MovementSystem, RenderSystem, CombatSystem, AISystem } = await import('../dist/game-core/systems/ecs-systems.js');
      const { addDashboardIntegration } = await import('../dist/game-core/utils/dashboard-integration.js');
      
      // Create the ECS world
      this.world = createWorld();
      
      // Add systems
      this.setupSystems({ MovementSystem, RenderSystem, CombatSystem, AISystem });
      
      // Add dashboard integration
      this.dashboardIntegration = addDashboardIntegration(this.world, {
        updateFrequency: 500, // Update every 500ms
        autoOpen: true
      });
      
      // Create initial entities
      this.createInitialEntities({ Position, Velocity, Health, Combat, Sprite });
      
      // Start the game loop
      this.startGameLoop();
      
      // Set up demo scenario
      this.startDemoScenario({ Position, Velocity, Health, Combat, Sprite });
      
      console.log('✅ Dashboard demo started! Check the dashboard window.');
      console.log('📊 Dashboard features:');
      console.log('  - Real-time entity monitoring');
      console.log('  - System performance tracking');
      console.log('  - Live performance graphs');
      console.log('  - Error and warning capture');
      console.log('  - Memory usage monitoring');
      console.log('  - Interactive entity management');
    } catch (error) {
      console.error('Failed to start dashboard demo:', error);
    }
  }

  private setupSystems(systems: any): void {
    if (!this.world) return;
    
    // Add core systems
    this.world.addSystem(new systems.MovementSystem());
    this.world.addSystem(new systems.RenderSystem());
    this.world.addSystem(new systems.CombatSystem());
    this.world.addSystem(new systems.AISystem());
    
    console.log(`✅ Added ${this.world.systems.size} systems to the world`);
  }

  private createInitialEntities(components: any): void {
    if (!this.world) return;
    
    const { Position, Velocity, Health, Combat, Sprite } = components;
    
    // Create player entity
    const player = this.world.createEntity('player');
    player.addComponent(new Position(player.id, 400, 300, 0));
    player.addComponent(new Velocity(player.id, 0, 0, 0));
    player.addComponent(new Health(player.id, 100));
    player.addComponent(new Combat(player.id, 25));
    player.addComponent(new Sprite(player.id, '#00ff00', 16));

    // Create some enemies
    for (let i = 0; i < 5; i++) {
      const enemy = this.world.createEntity(`enemy_${i}`);
      const x = 200 + Math.random() * 400;
      const y = 150 + Math.random() * 300;
      
      enemy.addComponent(new Position(enemy.id, x, y, 0));
      enemy.addComponent(new Velocity(enemy.id, 
        (Math.random() - 0.5) * 50, 
        (Math.random() - 0.5) * 50, 0
      ));
      enemy.addComponent(new Health(enemy.id, 50 + Math.random() * 50));
      enemy.addComponent(new Combat(enemy.id, 10 + Math.random() * 15));
      enemy.addComponent(new Sprite(enemy.id, '#ff0000', 12));
    }

    // Create some neutral entities
    for (let i = 0; i < 10; i++) {
      const neutral = this.world.createEntity(`neutral_${i}`);
      const x = 100 + Math.random() * 600;
      const y = 100 + Math.random() * 400;
      
      neutral.addComponent(new Position(neutral.id, x, y, 0));
      neutral.addComponent(new Velocity(neutral.id, 
        (Math.random() - 0.5) * 30, 
        (Math.random() - 0.5) * 30, 0
      ));
      neutral.addComponent(new Sprite(neutral.id, '#0088ff', 8));
    }

    this.entityCount = this.world.entities.size;
    console.log(`✅ Created ${this.entityCount} initial entities`);
  }

  private startGameLoop(): void {
    if (!this.world) return;
    
    this.running = true;
    let lastTime = performance.now();
    
    const gameLoop = (currentTime: number) => {
      if (!this.running || !this.world) return;
      
      const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
      lastTime = currentTime;
      
      // Update the world
      this.world.update(deltaTime);
      
      // Continue the loop
      requestAnimationFrame(gameLoop);
    };
    
    requestAnimationFrame(gameLoop);
    console.log('✅ Game loop started');
  }

  private startDemoScenario(components: any): void {
    // Create new entities periodically
    setInterval(() => {
      if (this.world && this.world.entities.size < 30) {
        this.createRandomEntity(components);
      }
    }, 3000);

    // Randomly modify entities
    setInterval(() => {
      this.modifyRandomEntity();
    }, 2000);

    // Simulate errors occasionally
    setInterval(() => {
      if (Math.random() < 0.3) {
        this.simulateError();
      }
    }, 10000);

    // Log performance info
    setInterval(() => {
      this.logPerformanceInfo();
    }, 5000);

    console.log('✅ Demo scenario started');
  }

  private createRandomEntity(components: any): void {
    if (!this.world) return;
    
    const { Position, Velocity, Sprite, Health } = components;
    const entityId = `dynamic_${Date.now()}`;
    const entity = this.world.createEntity(entityId);
    
    // Random position
    const x = Math.random() * 800;
    const y = Math.random() * 600;
    
    entity.addComponent(new Position(entity.id, x, y, 0));
    entity.addComponent(new Velocity(entity.id, 
      (Math.random() - 0.5) * 40, 
      (Math.random() - 0.5) * 40, 0
    ));
    
    // Random color
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    entity.addComponent(new Sprite(entity.id, color, 6 + Math.random() * 10));
    
    // Sometimes add health
    if (Math.random() > 0.5) {
      entity.addComponent(new Health(entity.id, 20 + Math.random() * 80));
    }

    console.log(`Created dynamic entity: ${entityId}`);
    
    if (this.dashboardIntegration) {
      this.dashboardIntegration.logEvent('entity_created', {
        entityId,
        type: 'dynamic',
        componentCount: entity.components.size
      });
    }
  }

  private modifyRandomEntity(): void {
    if (!this.world) return;
    
    const entities = Array.from(this.world.entities.values());
    if (entities.length === 0) return;
    
    const entity = entities[Math.floor(Math.random() * entities.length)];
    const velocity = entity.getComponent('Velocity');
    
    if (velocity) {
      // Change direction
      velocity.setVelocity(
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 60,
        0
      );
      
      if (this.dashboardIntegration) {
        this.dashboardIntegration.logEvent('entity_modified', {
          entityId: entity.id,
          action: 'velocity_change'
        });
      }
    }
  }

  private simulateError(): void {
    const errorTypes = [
      'Simulated network timeout',
      'Mock asset loading failure',
      'Test physics collision error',
      'Simulated AI pathfinding issue'
    ];
    
    const error = errorTypes[Math.floor(Math.random() * errorTypes.length)];
    console.error(`Demo Error: ${error}`);
    
    if (Math.random() > 0.7) {
      console.warn(`Demo Warning: Performance spike detected in ${error}`);
    }
  }

  private logPerformanceInfo(): void {
    if (!this.world) return;
    
    const entityCount = this.world.entities.size;
    const systemCount = this.world.systems.size;
    
    // Memory usage for Node.js environment
    let memoryUsageMB = 0;
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memoryUsage = process.memoryUsage();
      memoryUsageMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    } else if ('performance' in globalThis && (performance as any).memory) {
      // Browser environment
      memoryUsageMB = Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024);
    }
    
    console.log('📊 Performance Update:');
    console.log(`  Entities: ${entityCount}`);
    console.log(`  Systems: ${systemCount}`);
    console.log(`  Memory: ${memoryUsageMB}MB`);
    
    if (this.dashboardIntegration) {
      this.dashboardIntegration.logEvent('performance_update', {
        entityCount,
        systemCount,
        memoryUsageMB
      });
    }
  }

  stop(): void {
    this.running = false;
    
    if (this.dashboardIntegration) {
      this.dashboardIntegration.destroy();
    }
    
    if (this.world) {
      this.world.cleanup();
    }
    
    console.log('🛑 Dashboard demo stopped');
  }
}

// Global reference for debugging
let demo: DashboardDemo | null = null;

// Auto-start demo if run directly
if (typeof require !== 'undefined' && require.main === module) {
  demo = new DashboardDemo();
  demo.start().catch(console.error);
  
  // Graceful shutdown
  if (typeof process !== 'undefined') {
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down dashboard demo...');
      if (demo) {
        demo.stop();
      }
      process.exit(0);
    });
  }
}

export { DashboardDemo };