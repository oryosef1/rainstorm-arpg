/**
 * World Areas ECS System for RainStorm ARPG
 * Manages world area navigation and waypoint system integration
 */

import { ISystem, IEntity, IWorld } from '../ecs/ecs-core';
import { WorldAreasManager } from '../world/world-areas';

interface AreaPositionComponent {
  areaId: string;
  x: number;
  y: number;
  lastAreaChange: number;
}

interface WaypointProgressComponent {
  unlockedWaypoints: Set<string>;
  lastWaypointUnlock: number;
  totalWaypointsDiscovered: number;
}

interface AreaTransitionComponent {
  isTransitioning: boolean;
  fromAreaId: string;
  toAreaId: string;
  transitionStartTime: number;
  transitionDuration: number;
}

interface QuestProgressComponent {
  completedQuests: Set<string>;
  activeQuests: Map<string, any>;
  questAreas: Set<string>;
}

interface SystemMetrics {
  name: string;
  executionTime: number;
  entityCount: number;
  lastUpdate: number;
  averageTime: number;
  maxTime: number;
  minTime: number;
}

class WorldAreasSystem implements ISystem {
  readonly name: string = 'WorldAreasSystem';
  readonly requiredComponents: readonly string[] = ['AreaPosition', 'Player'];
  readonly priority: number = 30;
  enabled: boolean = true;
  
  private entities: Set<IEntity> = new Set();
  private world: IWorld | null = null;
  private worldAreasManager: WorldAreasManager;
  private performanceMetrics: SystemMetrics;
  
  constructor() {
    this.worldAreasManager = new WorldAreasManager();
    this.performanceMetrics = {
      name: this.name,
      executionTime: 0,
      entityCount: 0,
      lastUpdate: 0,
      averageTime: 0,
      maxTime: 0,
      minTime: Infinity
    };
  }

  setWorld(world: IWorld): void {
    this.world = world;
  }

  addEntity(entity: IEntity): void {
    if (entity.hasComponents(this.requiredComponents)) {
      this.entities.add(entity);
      
      // Initialize player in world areas system
      const playerId = entity.getComponent('Player')?.id;
      if (playerId) {
        this.worldAreasManager.initializePlayer(playerId);
        
        // Add waypoint progress component if not exists
        if (!entity.hasComponent('WaypointProgress')) {
          entity.addComponent('WaypointProgress', {
            unlockedWaypoints: new Set(['wp_town_act1']),
            lastWaypointUnlock: Date.now(),
            totalWaypointsDiscovered: 1
          });
        }
        
        // Add area position component if not exists
        if (!entity.hasComponent('AreaPosition')) {
          entity.addComponent('AreaPosition', {
            areaId: 'town_act1',
            x: 0,
            y: 0,
            lastAreaChange: Date.now()
          });
        }
      }
    }
  }

  removeEntity(entity: IEntity): void {
    this.entities.delete(entity);
  }

  update(deltaTime: number): void {
    const startTime = performance.now();

    for (const entity of this.entities) {
      this.updatePlayerAreaNavigation(entity, deltaTime);
      this.updateWaypointDiscovery(entity, deltaTime);
      this.updateAreaTransitions(entity, deltaTime);
      this.updateQuestAreaIntegration(entity, deltaTime);
    }

    // Update performance metrics
    const executionTime = performance.now() - startTime;
    this.updatePerformanceMetrics(executionTime);
  }

  /**
   * Update player area navigation
   */
  private updatePlayerAreaNavigation(entity: IEntity, deltaTime: number): void {
    const areaPosition = entity.getComponent('AreaPosition');
    const player = entity.getComponent('Player');
    
    if (!areaPosition || !player) return;

    // Check if player has moved to a different area
    const currentArea = this.worldAreasManager.getCurrentArea(player.id);
    if (currentArea && currentArea.id !== areaPosition.areaId) {
      // Update area position
      areaPosition.areaId = currentArea.id;
      areaPosition.lastAreaChange = Date.now();
      
      // Trigger area enter event
      this.triggerAreaEnterEvent(entity, currentArea.id);
    }
  }

  /**
   * Update waypoint discovery system
   */
  private updateWaypointDiscovery(entity: IEntity, deltaTime: number): void {
    const areaPosition = entity.getComponent('AreaPosition');
    const waypointProgress = entity.getComponent('WaypointProgress');
    const player = entity.getComponent('Player');
    
    if (!areaPosition || !waypointProgress || !player) return;

    // Check if current area has an undiscovered waypoint
    const currentArea = this.worldAreasManager.getArea(areaPosition.areaId);
    if (currentArea?.hasWaypoint && currentArea.waypointId) {
      const waypointId = currentArea.waypointId;
      
      if (!waypointProgress.unlockedWaypoints.has(waypointId)) {
        // Check if player is close enough to discover waypoint
        const waypointData = this.worldAreasManager.getWaypoint(waypointId);
        if (waypointData && this.isPlayerNearWaypoint(areaPosition, waypointData)) {
          // Unlock waypoint
          if (this.worldAreasManager.unlockWaypoint(player.id, waypointId)) {
            waypointProgress.unlockedWaypoints.add(waypointId);
            waypointProgress.lastWaypointUnlock = Date.now();
            waypointProgress.totalWaypointsDiscovered++;
            
            // Trigger waypoint discovered event
            this.triggerWaypointDiscoveredEvent(entity, waypointId);
          }
        }
      }
    }
  }

  /**
   * Update area transitions
   */
  private updateAreaTransitions(entity: IEntity, deltaTime: number): void {
    const transition = entity.getComponent('AreaTransition');
    if (!transition || !transition.isTransitioning) return;

    const elapsed = Date.now() - transition.transitionStartTime;
    
    if (elapsed >= transition.transitionDuration) {
      // Complete transition
      transition.isTransitioning = false;
      
      // Update area position
      const areaPosition = entity.getComponent('AreaPosition');
      if (areaPosition) {
        areaPosition.areaId = transition.toAreaId;
        areaPosition.lastAreaChange = Date.now();
      }
      
      // Trigger transition complete event
      this.triggerAreaTransitionCompleteEvent(entity, transition.toAreaId);
    }
  }

  /**
   * Update quest area integration
   */
  private updateQuestAreaIntegration(entity: IEntity, deltaTime: number): void {
    const areaPosition = entity.getComponent('AreaPosition');
    const questProgress = entity.getComponent('QuestProgress');
    
    if (!areaPosition || !questProgress) return;

    const currentArea = this.worldAreasManager.getArea(areaPosition.areaId);
    if (!currentArea) return;

    // Check for quest area triggers
    for (const questArea of currentArea.questAreas) {
      if (!questProgress.questAreas.has(questArea)) {
        questProgress.questAreas.add(questArea);
        
        // Trigger quest area discovered event
        this.triggerQuestAreaDiscoveredEvent(entity, questArea);
      }
    }
  }

  /**
   * Check if player is near waypoint
   */
  private isPlayerNearWaypoint(areaPosition: AreaPositionComponent, waypoint: any): boolean {
    const distance = Math.sqrt(
      Math.pow(areaPosition.x - waypoint.coordinates.x, 2) +
      Math.pow(areaPosition.y - waypoint.coordinates.y, 2)
    );
    return distance < 50; // Waypoint activation radius
  }

  /**
   * Travel to waypoint
   */
  travelToWaypoint(entity: IEntity, waypointId: string): boolean {
    const player = entity.getComponent('Player');
    const waypointProgress = entity.getComponent('WaypointProgress');
    
    if (!player || !waypointProgress) return false;

    // Check if waypoint is unlocked
    if (!waypointProgress.unlockedWaypoints.has(waypointId)) {
      return false;
    }

    // Attempt travel
    const result = this.worldAreasManager.travelToWaypoint(player.id, waypointId);
    
    if (result.success && result.areaId) {
      // Start area transition
      const transition: AreaTransitionComponent = {
        isTransitioning: true,
        fromAreaId: entity.getComponent('AreaPosition')?.areaId || '',
        toAreaId: result.areaId,
        transitionStartTime: Date.now(),
        transitionDuration: 1000 // 1 second transition
      };
      
      entity.addComponent('AreaTransition', transition);
      return true;
    }

    return false;
  }

  /**
   * Enter connected area
   */
  enterConnectedArea(entity: IEntity, targetAreaId: string): boolean {
    const player = entity.getComponent('Player');
    const areaPosition = entity.getComponent('AreaPosition');
    const character = entity.getComponent('Character');
    const questProgress = entity.getComponent('QuestProgress');
    
    if (!player || !areaPosition || !character) return false;

    // Check if player can access the area
    const completedQuests = questProgress?.completedQuests || new Set();
    const canAccess = this.worldAreasManager.canAccessArea(
      player.id,
      targetAreaId,
      character.level,
      completedQuests
    );

    if (!canAccess) return false;

    // Attempt to enter area
    const result = this.worldAreasManager.enterArea(player.id, areaPosition.areaId, targetAreaId);
    
    if (result.success) {
      // Start area transition
      const transition: AreaTransitionComponent = {
        isTransitioning: true,
        fromAreaId: areaPosition.areaId,
        toAreaId: targetAreaId,
        transitionStartTime: Date.now(),
        transitionDuration: 2000 // 2 second transition for connected areas
      };
      
      entity.addComponent('AreaTransition', transition);
      return true;
    }

    return false;
  }

  /**
   * Get available area connections
   */
  getAvailableConnections(entity: IEntity): any[] {
    const areaPosition = entity.getComponent('AreaPosition');
    if (!areaPosition) return [];

    return this.worldAreasManager.getConnectedAreas(areaPosition.areaId);
  }

  /**
   * Get unlocked waypoints for player
   */
  getUnlockedWaypoints(entity: IEntity): any[] {
    const player = entity.getComponent('Player');
    if (!player) return [];

    return this.worldAreasManager.getUnlockedWaypoints(player.id);
  }

  /**
   * Get world map data for UI
   */
  getWorldMapData(entity: IEntity): any {
    const player = entity.getComponent('Player');
    if (!player) return null;

    return this.worldAreasManager.getWorldMapData(player.id);
  }

  /**
   * Trigger area enter event
   */
  private triggerAreaEnterEvent(entity: IEntity, areaId: string): void {
    if (this.world) {
      this.world.emit('area:enter', {
        entity,
        areaId,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Trigger waypoint discovered event
   */
  private triggerWaypointDiscoveredEvent(entity: IEntity, waypointId: string): void {
    if (this.world) {
      this.world.emit('waypoint:discovered', {
        entity,
        waypointId,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Trigger area transition complete event
   */
  private triggerAreaTransitionCompleteEvent(entity: IEntity, areaId: string): void {
    if (this.world) {
      this.world.emit('area:transition:complete', {
        entity,
        areaId,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Trigger quest area discovered event
   */
  private triggerQuestAreaDiscoveredEvent(entity: IEntity, questArea: string): void {
    if (this.world) {
      this.world.emit('quest:area:discovered', {
        entity,
        questArea,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(executionTime: number): void {
    this.performanceMetrics.executionTime = executionTime;
    this.performanceMetrics.entityCount = this.entities.size;
    this.performanceMetrics.lastUpdate = Date.now();
    
    // Update average, min, max times
    if (executionTime > this.performanceMetrics.maxTime) {
      this.performanceMetrics.maxTime = executionTime;
    }
    
    if (executionTime < this.performanceMetrics.minTime) {
      this.performanceMetrics.minTime = executionTime;
    }
    
    // Simple moving average
    this.performanceMetrics.averageTime = 
      (this.performanceMetrics.averageTime * 0.9) + (executionTime * 0.1);
  }

  canProcess(entity: IEntity): boolean {
    return entity.hasComponents(this.requiredComponents);
  }

  cleanup(): void {
    this.entities.clear();
  }

  getMetrics(): SystemMetrics {
    return { ...this.performanceMetrics };
  }
}

export { 
  WorldAreasSystem, 
  AreaPositionComponent, 
  WaypointProgressComponent, 
  AreaTransitionComponent,
  QuestProgressComponent
};