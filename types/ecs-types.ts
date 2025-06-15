// ecs-types.ts - TypeScript Type Definitions for ECS
export interface SystemMetrics {
  name: string;
  executionTime: number;
  entityCount: number;
  lastUpdate: number;
  averageTime: number;
  maxTime: number;
  minTime: number;
}

export interface ComponentData {
  [key: string]: any;
}

export interface EntityData {
  id: string;
  active: boolean;
  components: Record<string, ComponentData>;
}

export interface WorldState {
  entities: EntityData[];
  systems: string[];
  timestamp: number;
}

export interface GameConfig {
  maxEntities: number;
  maxSystems: number;
  targetFPS: number;
  enableMetrics: boolean;
}

export type EntityFilter = (entity: any) => boolean;
export type SystemUpdate = (deltaTime: number) => void;
export type ComponentValidator = (component: any) => boolean;