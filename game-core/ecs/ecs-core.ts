// ecs-core.ts - Entity Component System Core
export interface IComponent {
  readonly name: string;
  entity?: IEntity;
}

export interface IEntity {
  readonly id: string;
  active: boolean;
  components: Map<string, IComponent>;
  
  addComponent(component: IComponent): IEntity;
  removeComponent(componentType: string | Function): IEntity;
  getComponent(componentName: string): IComponent | undefined;
  hasComponent(componentName: string): boolean;
  hasComponents(componentNames: readonly string[]): boolean;
}

export interface ISystem {
  readonly name: string;
  readonly requiredComponents: readonly string[];
  readonly entities: Set<IEntity>;
  readonly priority: number;
  enabled: boolean;
  
  addEntity(entity: IEntity): void;
  removeEntity(entity: IEntity): void;
  update(deltaTime: number): void;
  canProcess(entity: IEntity): boolean;
  cleanup(): void;
}

export interface IWorld {
  readonly entities: Set<IEntity>;
  readonly systems: Map<string, ISystem>;
  
  createEntity(): IEntity;
  destroyEntity(entity: IEntity): void;
  addSystem(system: ISystem): void;
  removeSystem(systemName: string): void;
  getSystem(systemName: string): ISystem | undefined;
  update(deltaTime: number): void;
  cleanup(): void;
}

export class Entity implements IEntity {
  readonly id: string;
  active: boolean;
  components: Map<string, IComponent>;

  constructor() {
    this.id = crypto.randomUUID();
    this.components = new Map();
    this.active = true;
  }

  addComponent(component: IComponent): IEntity {
    this.components.set(component.name, component);
    if (component.entity === undefined) {
      (component as any).entity = this;
    }
    return this;
  }

  removeComponent(componentType: string | Function): IEntity {
    const componentName = typeof componentType === 'string' ? componentType : componentType.name;
    this.components.delete(componentName);
    return this;
  }

  getComponent(componentName: string): IComponent | undefined {
    return this.components.get(componentName);
  }

  hasComponent(componentName: string): boolean {
    return this.components.has(componentName);
  }

  hasComponents(componentNames: readonly string[]): boolean {
    return componentNames.every(name => this.hasComponent(name));
  }
}

export abstract class Component implements IComponent {
  abstract readonly name: string;
  entity?: IEntity;
}

export abstract class System implements ISystem {
  abstract readonly name: string;
  abstract readonly requiredComponents: readonly string[];
  readonly entities: Set<IEntity> = new Set();
  abstract readonly priority: number;
  enabled: boolean = true;

  addEntity(entity: IEntity): void {
    if (this.canProcess(entity)) {
      this.entities.add(entity);
    }
  }

  removeEntity(entity: IEntity): void {
    this.entities.delete(entity);
  }

  abstract update(deltaTime: number): void;

  canProcess(entity: IEntity): boolean {
    return entity.hasComponents(this.requiredComponents);
  }

  cleanup(): void {
    this.entities.clear();
  }
}

export class World implements IWorld {
  readonly entities: Set<IEntity> = new Set();
  readonly systems: Map<string, ISystem> = new Map();

  createEntity(): IEntity {
    const entity = new Entity();
    this.entities.add(entity);
    
    for (const system of this.systems.values()) {
      system.addEntity(entity);
    }
    
    return entity;
  }

  destroyEntity(entity: IEntity): void {
    this.entities.delete(entity);
    
    for (const system of this.systems.values()) {
      system.removeEntity(entity);
    }
  }

  addSystem(system: ISystem): void {
    this.systems.set(system.name, system);
    
    for (const entity of this.entities) {
      system.addEntity(entity);
    }
  }

  removeSystem(systemName: string): void {
    const system = this.systems.get(systemName);
    if (system) {
      system.cleanup();
      this.systems.delete(systemName);
    }
  }

  getSystem(systemName: string): ISystem | undefined {
    return this.systems.get(systemName);
  }

  update(deltaTime: number): void {
    const sortedSystems = Array.from(this.systems.values())
      .filter(system => system.enabled)
      .sort((a, b) => a.priority - b.priority);
    
    for (const system of sortedSystems) {
      system.update(deltaTime);
    }
  }

  cleanup(): void {
    for (const system of this.systems.values()) {
      system.cleanup();
    }
    this.systems.clear();
    this.entities.clear();
  }
}

export default { Entity, Component, System, World };