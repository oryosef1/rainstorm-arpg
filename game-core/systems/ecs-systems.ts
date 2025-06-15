// RainStorm ARPG - TypeScript System Implementations
// Enterprise-grade system implementations with full type safety

import { System, IEntity, EventBus } from '../ecs/ecs-core';
import { 
  Position, Velocity, Sprite, Health, Combat, Level, Attributes, 
  SkillTree, CampaignProgress, AreaLocation 
} from '../components/ecs-components';
import { 
  MovementSystemType, RenderSystemType, CombatSystemType, AISystemType,
  LevelingSystemType, InventorySystemType, CampaignSystemType, QuestSystemType,
  RenderContext, Vector2, Camera, Viewport
} from '../../types/system-types';

// Advanced Logging Integration
let gameLogger: any;
try {
  const { gameLogger: logger } = require('./logging-system.js');
  gameLogger = logger;
} catch (error) {
  // Fallback logger if logging system not available
  gameLogger = {
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
    logError: () => {},
    logPerformance: () => {}
  };
}

// =============================================================================
// CORE SYSTEMS
// =============================================================================

class MovementSystem extends System implements MovementSystemType {
  public readonly name = 'MovementSystem';
  public readonly requiredComponents = ['Position', 'Velocity'] as const;

  constructor() {
    super('MovementSystem', ['Position', 'Velocity'], 100);
  }

  update(deltaTime: number): void {
    const startTime = performance.now();
    
    try {
      for (const entity of this.entities) {
        this.updateMovement(entity, deltaTime);
      }
    } catch (error) {
      gameLogger.logError(error, {
        system: 'MovementSystem',
        deltaTime,
        entityCount: this.entities.size
      });
      throw error;
    } finally {
      const duration = performance.now() - startTime;
      gameLogger.logPerformance(this, duration, this.entities.size);
    }
  }

  updateMovement(entity: IEntity, deltaTime: number): void {
    const position = entity.getComponent<Position>('Position');
    const velocity = entity.getComponent<Velocity>('Velocity');

    if (!position || !velocity) return;

    this.applyVelocity(entity, deltaTime);
    this.checkBounds(entity);
  }

  applyVelocity(entity: IEntity, deltaTime: number): void {
    const position = entity.getComponent<Position>('Position');
    const velocity = entity.getComponent<Velocity>('Velocity');

    if (!position || !velocity) return;

    // Apply velocity
    position.move(
      velocity.x * deltaTime,
      velocity.y * deltaTime,
      velocity.z * deltaTime
    );

    // Apply damping
    velocity.x *= velocity.damping;
    velocity.y *= velocity.damping;
    velocity.z *= velocity.damping;
  }

  checkBounds(entity: IEntity): void {
    const position = entity.getComponent<Position>('Position');
    if (!position) return;

    // Simple boundary checking (can be expanded)
    const maxBound = 1000;
    const minBound = -1000;

    if (position.x > maxBound || position.x < minBound ||
        position.y > maxBound || position.y < minBound) {
      // Reset to last valid position
      position.setPosition(position.lastX, position.lastY, position.lastZ);
      
      // Stop movement
      const velocity = entity.getComponent<Velocity>('Velocity');
      if (velocity) {
        velocity.setVelocity(0, 0, 0);
      }
    }
  }
}

class RenderSystem extends System implements RenderSystemType {
  public readonly name = 'RenderSystem';
  public readonly requiredComponents = ['Position', 'Sprite'] as const;
  public culling: boolean = true;
  public viewport = { 
    x: 0, y: 0, width: 800, height: 600,
    contains: (point: Vector2) => point.x >= 0 && point.x <= 800 && point.y >= 0 && point.y <= 600,
    intersects: (bounds: any) => true // Simplified implementation
  };

  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;

  constructor(canvas?: HTMLCanvasElement) {
    super('RenderSystem', ['Position', 'Sprite'], 0);
    
    if (canvas) {
      this.canvas = canvas;
      this.context = canvas.getContext('2d');
    }
  }

  setCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.viewport.width = canvas.width;
    this.viewport.height = canvas.height;
  }

  update(deltaTime: number): void {
    // RenderSystem uses render() method instead
  }

  render(context: RenderContext): void {
    const startTime = performance.now();
    
    try {
      if (!this.context && !context.context) return;

      const ctx = context.context || this.context!;
      
      // Clear canvas
      ctx.clearRect(0, 0, context.viewport.width, context.viewport.height);

      // Sort entities by layer
      const sortedEntities = this.sortEntitiesByLayer(Array.from(this.entities));

      // Render each entity
      for (const entity of sortedEntities) {
        this.renderEntity(entity, context);
      }
    } catch (error) {
      gameLogger.logError(error, {
        system: 'RenderSystem',
        entityCount: this.entities.size
      });
      throw error;
    } finally {
      const duration = performance.now() - startTime;
      gameLogger.logPerformance(this, duration, this.entities.size);
    }
  }

  renderEntity(entity: IEntity, context: RenderContext): void {
    const position = entity.getComponent<Position>('Position');
    const sprite = entity.getComponent<Sprite>('Sprite');

    if (!position || !sprite || !sprite.visible) return;

    // Culling check
    if (this.culling && !this.isInViewport(position, context.viewport)) {
      return;
    }

    const ctx = context.context || this.context!;
    
    ctx.save();
    
    // Apply transformations
    ctx.globalAlpha = sprite.opacity;
    ctx.translate(position.x, position.y);
    if (sprite.rotation !== 0) {
      ctx.rotate(sprite.rotation);
    }

    // Set fill style
    ctx.fillStyle = sprite.color;

    // Render based on shape
    switch (sprite.shape) {
      case 'circle':
        this.renderCircle(ctx, sprite.size);
        break;
      case 'square':
        this.renderSquare(ctx, sprite.size);
        break;
      case 'triangle':
        this.renderTriangle(ctx, sprite.size);
        break;
      case 'custom':
        this.renderCustom(ctx, sprite);
        break;
    }

    ctx.restore();
  }

  private renderCircle(ctx: CanvasRenderingContext2D, size: number): void {
    ctx.beginPath();
    ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderSquare(ctx: CanvasRenderingContext2D, size: number): void {
    const halfSize = size / 2;
    ctx.fillRect(-halfSize, -halfSize, size, size);
  }

  private renderTriangle(ctx: CanvasRenderingContext2D, size: number): void {
    const halfSize = size / 2;
    ctx.beginPath();
    ctx.moveTo(0, -halfSize);
    ctx.lineTo(-halfSize, halfSize);
    ctx.lineTo(halfSize, halfSize);
    ctx.closePath();
    ctx.fill();
  }

  private renderCustom(ctx: CanvasRenderingContext2D, sprite: Sprite): void {
    if (sprite.texture) {
      // Render texture (would need image loading system)
      this.renderCircle(ctx, sprite.size); // Fallback
    } else {
      this.renderCircle(ctx, sprite.size); // Default fallback
    }
  }

  sortEntitiesByLayer(entities: IEntity[]): IEntity[] {
    return entities.sort((a, b) => {
      const spriteA = a.getComponent<Sprite>('Sprite');
      const spriteB = b.getComponent<Sprite>('Sprite');
      
      const layerA = spriteA?.layer || 0;
      const layerB = spriteB?.layer || 0;
      
      return layerA - layerB;
    });
  }

  private isInViewport(position: Position, viewport: Viewport): boolean {
    return position.x >= viewport.x - 50 &&
           position.x <= viewport.x + viewport.width + 50 &&
           position.y >= viewport.y - 50 &&
           position.y <= viewport.y + viewport.height + 50;
  }
}

class CombatSystem extends System implements CombatSystemType {
  public readonly name = 'CombatSystem';
  public readonly requiredComponents = ['Position', 'Combat', 'Health'] as const;

  constructor() {
    super('CombatSystem', ['Position', 'Combat', 'Health'], 80);
  }

  update(deltaTime: number): void {
    const startTime = performance.now();
    
    try {
      this.processCombat(deltaTime);
    } catch (error) {
      gameLogger.logError(error, {
        system: 'CombatSystem',
        deltaTime,
        entityCount: this.entities.size
      });
      throw error;
    } finally {
      const duration = performance.now() - startTime;
      gameLogger.logPerformance(this, duration, this.entities.size);
    }
  }

  processCombat(deltaTime: number): void {
    const combatEntities = Array.from(this.entities);
    
    for (let i = 0; i < combatEntities.length; i++) {
      for (let j = i + 1; j < combatEntities.length; j++) {
        const entity1 = combatEntities[i];
        const entity2 = combatEntities[j];
        
        if (entity1 && entity2 && this.areEnemies(entity1, entity2)) {
          this.handleCombatPair(entity1, entity2);
        }
      }
    }
  }

  handleCombatPair(entity1: IEntity, entity2: IEntity): void {
    if (this.checkRange(entity1, entity2)) {
      this.handleAttack(entity1, entity2);
    }
    
    if (this.checkRange(entity2, entity1)) {
      this.handleAttack(entity2, entity1);
    }
  }

  handleAttack(attacker: IEntity, target: IEntity): void {
    const attackerCombat = attacker.getComponent<Combat>('Combat');
    const targetHealth = target.getComponent<Health>('Health');

    if (!attackerCombat || !targetHealth) return;

    const currentTime = Date.now();
    if (!attackerCombat.canAttack(currentTime)) return;

    const attackResult = attackerCombat.attack(currentTime);
    if (attackResult.hit) {
      const damage = this.calculateDamage(attacker, target);
      const died = targetHealth.takeDamage(damage);

      // Emit damage event
      EventBus.getInstance().emit('damage', {
        attacker: attacker.id,
        target: target.id,
        damage,
        isCritical: attackResult.isCritical,
        weaponType: attackResult.weaponType
      });

      if (died) {
        this.handleDeath(target);
      }
    }
  }

  checkRange(attacker: IEntity, target: IEntity): boolean {
    const attackerPos = attacker.getComponent<Position>('Position');
    const targetPos = target.getComponent<Position>('Position');
    const attackerCombat = attacker.getComponent<Combat>('Combat');

    if (!attackerPos || !targetPos || !attackerCombat) return false;

    const distance = attackerPos.distanceTo(targetPos);
    return distance <= attackerCombat.range;
  }

  calculateDamage(attacker: IEntity, target: IEntity): number {
    const attackerCombat = attacker.getComponent<Combat>('Combat');
    if (!attackerCombat) return 0;

    let damage = attackerCombat.calculateDamage();

    // Apply attacker attribute bonuses
    const attackerAttributes = attacker.getComponent<Attributes>('Attributes');
    if (attackerAttributes) {
      damage += attackerAttributes.strength * 0.5;
    }

    // Apply target damage reduction (armor, etc.)
    // This would be expanded with proper armor/resistance systems

    return Math.max(1, Math.round(damage));
  }

  applyDamage(target: IEntity, damage: number): boolean {
    const health = target.getComponent<Health>('Health');
    if (!health) return false;

    return health.takeDamage(damage);
  }

  private areEnemies(entity1: IEntity, entity2: IEntity): boolean {
    // Simple check - could be expanded with faction system
    const ai1 = entity1.hasComponent('AI');
    const ai2 = entity2.hasComponent('AI');
    const player1 = entity1.hasComponent('CharacterClass');
    const player2 = entity2.hasComponent('CharacterClass');
    
    return (ai1 && player2) || (ai2 && player1);
  }

  private handleDeath(entity: IEntity): void {
    // Emit death event
    EventBus.getInstance().emit('entityDeath', {
      entityId: entity.id
    });

    // Award experience to nearby players
    this.awardExperienceForKill(entity);

    // Mark for destruction
    entity.active = false;
  }

  private awardExperienceForKill(deadEntity: IEntity): void {
    const deadEntityLevel = deadEntity.getComponent<Level>('Level');
    if (!deadEntityLevel) return;

    const baseExp = 50 + (deadEntityLevel.current * 10);

    // Find nearby players
    const deadPos = deadEntity.getComponent<Position>('Position');
    if (!deadPos) return;

    for (const entity of this.entities) {
      if (!entity.hasComponent('CharacterClass')) continue;

      const playerPos = entity.getComponent<Position>('Position');
      if (!playerPos) continue;

      const distance = deadPos.distanceTo(playerPos);
      if (distance <= 200) { // Experience range
        EventBus.getInstance().emit('experienceGain', {
          entity,
          amount: baseExp
        });
      }
    }
  }
}

class AISystem extends System implements AISystemType {
  public readonly name = 'AISystem';
  public readonly requiredComponents = ['Position', 'AI', 'Velocity'] as const;

  constructor() {
    super('AISystem', ['Position', 'AI', 'Velocity'], 70);
  }

  update(deltaTime: number): void {
    const startTime = performance.now();
    
    try {
      for (const entity of this.entities) {
        this.updateAI(entity, deltaTime);
      }
    } catch (error) {
      gameLogger.logError(error, {
        system: 'AISystem',
        deltaTime,
        entityCount: this.entities.size
      });
      throw error;
    } finally {
      const duration = performance.now() - startTime;
      gameLogger.logPerformance(this, duration, this.entities.size);
    }
  }

  updateAI(entity: IEntity, deltaTime: number): void {
    const ai = entity.getComponent('AI');
    if (!ai) return;

    this.processStateMachine(entity);
  }

  processStateMachine(entity: IEntity): void {
    const position = entity.getComponent<Position>('Position');
    const ai = entity.getComponent('AI') as any; // AI Component not implemented yet - use any for now
    const velocity = entity.getComponent<Velocity>('Velocity');

    if (!position || !ai || !velocity) return;

    switch (ai.state) {
      case 'idle':
        this.handleIdleState(entity, position, ai, velocity);
        break;
      case 'pursuing':
        this.handlePursuingState(entity, position, ai, velocity);
        break;
      case 'attacking':
        this.handleAttackingState(entity, position, ai, velocity);
        break;
      case 'fleeing':
        this.handleFleeingState(entity, position, ai, velocity);
        break;
      case 'patrolling':
        this.handlePatrollingState(entity, position, ai, velocity);
        break;
    }
  }

  private handleIdleState(entity: IEntity, position: Position, ai: any, velocity: Velocity): void {
    const targets = this.findTargets(entity);
    if (targets.length > 0) {
      ai.target = targets[0];
      ai.state = 'pursuing';
      ai.lastStateChange = Date.now();
    } else {
      // Idle movement dampening
      velocity.x *= 0.9;
      velocity.y *= 0.9;
    }
  }

  private handlePursuingState(entity: IEntity, position: Position, ai: any, velocity: Velocity): void {
    if (!ai.target || !ai.target.active) {
      ai.target = null;
      ai.state = 'idle';
      return;
    }

    const targetPos = ai.target.getComponent('Position') as Position;
    if (!targetPos) {
      ai.target = null;
      ai.state = 'idle';
      return;
    }

    const distance = position.distanceTo(targetPos);

    if (distance > ai.aggroRange * 1.5) {
      // Lost target
      ai.target = null;
      ai.state = 'idle';
      return;
    }

    if (distance <= 60) {
      ai.state = 'attacking';
      velocity.setVelocity(0, 0, 0);
    } else {
      // Move toward target
      const [dx, dy] = position.directionTo(targetPos);
      const speed = 100;
      velocity.setVelocity(dx * speed, dy * speed, 0);
    }
  }

  private handleAttackingState(entity: IEntity, position: Position, ai: any, velocity: Velocity): void {
    if (!ai.target || !ai.target.active) {
      ai.target = null;
      ai.state = 'idle';
      return;
    }

    const targetPos = ai.target.getComponent('Position') as Position;
    if (!targetPos) {
      ai.target = null;
      ai.state = 'idle';
      return;
    }

    const distance = position.distanceTo(targetPos);

    if (distance > 80) {
      ai.state = 'pursuing';
    } else {
      // Stop moving while attacking
      velocity.setVelocity(0, 0, 0);
    }
  }

  private handleFleeingState(entity: IEntity, position: Position, ai: any, velocity: Velocity): void {
    if (!ai.target) {
      ai.state = 'idle';
      return;
    }

    const targetPos = ai.target.getComponent('Position') as Position;
    if (!targetPos) {
      ai.target = null;
      ai.state = 'idle';
      return;
    }

    // Move away from target
    const [dx, dy] = position.directionTo(targetPos);
    const speed = 120; // Faster when fleeing
    velocity.setVelocity(-dx * speed, -dy * speed, 0);

    // Check if far enough away
    const distance = position.distanceTo(targetPos);
    if (distance > ai.aggroRange * 2) {
      ai.target = null;
      ai.state = 'idle';
    }
  }

  private handlePatrollingState(entity: IEntity, position: Position, ai: any, velocity: Velocity): void {
    // Simple patrol logic - would be expanded
    ai.state = 'idle';
  }

  findTargets(entity: IEntity): IEntity[] {
    const position = entity.getComponent<Position>('Position');
    const ai = entity.getComponent('AI') as any;
    
    if (!position || !ai) return [];

    const targets: IEntity[] = [];

    // Find nearby player entities
    for (const otherEntity of this.entities) {
      if (otherEntity === entity) continue;
      if (!otherEntity.hasComponent('CharacterClass')) continue;

      const otherPos = otherEntity.getComponent('Position') as Position;
      if (!otherPos) continue;

      const distance = position.distanceTo(otherPos);
      if (distance <= ai.aggroRange) {
        targets.push(otherEntity);
      }
    }

    // Sort by distance
    targets.sort((a, b) => {
      const posA = a.getComponent('Position') as Position;
      const posB = b.getComponent('Position') as Position;
      return position.distanceTo(posA) - position.distanceTo(posB);
    });

    return targets;
  }

  calculatePath(from: IEntity, to: IEntity): any[] {
    // Simplified pathfinding - would use A* or similar
    return [];
  }
}

class LevelingSystem extends System implements LevelingSystemType {
  public readonly name = 'LevelingSystem';
  public readonly requiredComponents = ['Level', 'SkillTree'] as const;

  constructor() {
    super('LevelingSystem', ['Level', 'SkillTree'], 60);
    
    // Subscribe to experience gain events
    EventBus.getInstance().subscribe('experienceGain', (event) => {
      const data = event.data as any;
      this.handleExperienceGain(data.entity, data.amount);
    });
  }

  update(deltaTime: number): void {
    const startTime = performance.now();
    
    try {
      // Process any queued events
      // Most work is done in event handlers
    } catch (error) {
      gameLogger.logError(error, {
        system: 'LevelingSystem',
        deltaTime,
        entityCount: this.entities.size
      });
      throw error;
    } finally {
      const duration = performance.now() - startTime;
      gameLogger.logPerformance(this, duration, this.entities.size);
    }
  }

  processEvents(events: any[]): void {
    // Implementation for processing batched events
  }

  handleExperienceGain(entity: IEntity, amount: number): void {
    const level = entity.getComponent<Level>('Level');
    const skillTree = entity.getComponent<SkillTree>('SkillTree');

    if (!level || !skillTree) return;

    const leveledUp = level.addExperience(amount);

    if (leveledUp) {
      this.levelUp(entity);
    }
  }

  levelUp(entity: IEntity): void {
    const level = entity.getComponent<Level>('Level');
    const skillTree = entity.getComponent<SkillTree>('SkillTree');
    
    if (!level || !skillTree) return;

    // Award skill points
    this.awardSkillPoints(entity, 1);

    // Award attribute points for character classes
    const attributes = entity.getComponent<Attributes>('Attributes');
    if (attributes) {
      attributes.availablePoints += 2;
    }

    // Update derived stats
    this.updateDerivedStats(entity);

    // Emit level up event
    EventBus.getInstance().emit('levelUp', {
      entity,
      newLevel: level.current
    });

    gameLogger.info('Player leveled up', {
      entityId: entity.id,
      newLevel: level.current,
      totalExperience: level.totalExperience
    });
  }

  awardSkillPoints(entity: IEntity, points: number): void {
    const skillTree = entity.getComponent<SkillTree>('SkillTree');
    if (skillTree) {
      skillTree.availablePoints += points;
    }
  }

  calculateExperienceRequired(level: number): number {
    // Exponential scaling formula
    return Math.floor(100 * Math.pow(level, 1.5));
  }

  private updateDerivedStats(entity: IEntity): void {
    const attributes = entity.getComponent<Attributes>('Attributes');
    const health = entity.getComponent<Health>('Health');
    
    if (attributes && health) {
      const derivedStats = attributes.calculateDerivedStats();
      health.setMaxHealth(derivedStats.health);
      health.heal(derivedStats.health); // Full heal on level up
    }
  }
}

// =============================================================================
// PLACEHOLDER SYSTEMS (to be implemented)
// =============================================================================

class InventorySystemPlaceholder extends System {
  public readonly name = 'InventorySystem';
  public readonly requiredComponents = ['Inventory'] as const;

  constructor() {
    super('InventorySystem', ['Inventory'], 50);
  }

  update(deltaTime: number): void {
    // Placeholder implementation
  }

  processEvents(events: any[]): void {
    // Placeholder implementation
  }

  handleItemPickup(entity: IEntity, item: any): boolean {
    return false; // Placeholder
  }

  handleItemDrop(entity: IEntity, item: any): boolean {
    return false; // Placeholder
  }

  handleItemUse(entity: IEntity, item: any): boolean {
    return false; // Placeholder
  }

  findSpaceForItem(entity: IEntity, item: any): any {
    return null; // Placeholder
  }
}

class CampaignSystemPlaceholder extends System {
  public readonly name = 'CampaignSystem';
  public readonly requiredComponents = ['CampaignProgress', 'Level'] as const;

  constructor() {
    super('CampaignSystem', ['CampaignProgress', 'Level'], 40);
  }

  update(deltaTime: number): void {
    // Placeholder implementation
  }

  processEvents(events: any[]): void {
    // Placeholder implementation
  }

  checkActProgress(entity: IEntity): void {
    // Placeholder implementation
  }

  completeAct(entity: IEntity, actId: number): void {
    // Placeholder implementation
  }

  unlockArea(entity: IEntity, areaId: string): void {
    // Placeholder implementation
  }

  canAccessAct(entity: IEntity, actId: number): boolean {
    return true; // Placeholder
  }

  getCurrentObjectives(entity: IEntity): any[] {
    return []; // Placeholder
  }
}

class QuestSystemPlaceholder extends System {
  public readonly name = 'QuestSystem';
  public readonly requiredComponents = ['CampaignProgress'] as const;

  constructor() {
    super('QuestSystem', ['CampaignProgress'], 30);
  }

  update(deltaTime: number): void {
    // Placeholder implementation
  }

  processEvents(events: any[]): void {
    // Placeholder implementation
  }

  startQuest(entity: IEntity, questId: string): boolean {
    return false; // Placeholder
  }

  completeQuest(entity: IEntity, questId: string): void {
    // Placeholder implementation
  }

  updateObjective(entity: IEntity, questId: string, objectiveId: string, progress: number): void {
    // Placeholder implementation
  }

  checkQuestCompletion(entity: IEntity, questId: string): boolean {
    return false; // Placeholder
  }

  grantRewards(entity: IEntity, rewards: any[]): void {
    // Placeholder implementation
  }
}

// =============================================================================
// SYSTEM FACTORY
// =============================================================================

class SystemFactory {
  private static factories: Map<string, () => System> = new Map();

  static register(name: string, factory: () => System): void {
    this.factories.set(name, factory);
  }

  static create(name: string): System | null {
    const factory = this.factories.get(name);
    return factory ? factory() : null;
  }

  static getAvailableSystems(): string[] {
    return Array.from(this.factories.keys());
  }
}

// Register system factories
SystemFactory.register('MovementSystem', () => new MovementSystem());
SystemFactory.register('RenderSystem', () => new RenderSystem());
SystemFactory.register('CombatSystem', () => new CombatSystem());
SystemFactory.register('AISystem', () => new AISystem());
SystemFactory.register('LevelingSystem', () => new LevelingSystem());
SystemFactory.register('InventorySystem', () => new InventorySystemPlaceholder());
SystemFactory.register('CampaignSystem', () => new CampaignSystemPlaceholder());
SystemFactory.register('QuestSystem', () => new QuestSystemPlaceholder());

// =============================================================================
// EXPORTS
// =============================================================================

export {
  MovementSystem, RenderSystem, CombatSystem, AISystem, LevelingSystem,
  InventorySystemPlaceholder as InventorySystem,
  CampaignSystemPlaceholder as CampaignSystem,
  QuestSystemPlaceholder as QuestSystem,
  SystemFactory
};