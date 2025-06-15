# RainStorm ARPG - Architecture Documentation

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Core Design Patterns](#core-design-patterns)
4. [Module Structure](#module-structure)
5. [Data Flow](#data-flow)
6. [Performance Considerations](#performance-considerations)
7. [Development Guidelines](#development-guidelines)

## Overview

RainStorm ARPG is a browser-based Action RPG built using modern JavaScript with an Entity-Component-System (ECS) architecture. The game is inspired by Path of Exile and features complex character progression, crafting systems, and endgame content.

### Technology Stack
- **Language**: JavaScript (ES6+)
- **Architecture**: Entity-Component-System (ECS)
- **Testing**: Jest with Test-Driven Development (293 tests passing)
- **Build System**: Webpack 5 with production optimization
- **Code Quality**: ESLint, JSDoc, 95%+ test coverage
- **Target Platform**: Modern web browsers
- **Performance Target**: 60 FPS with 500+ entities

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Game Application                         │
├─────────────────────────────────────────────────────────────────┤
│                          Game Loop                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │    Input     │  │    Update    │  │    Render    │        │
│  │   Manager    │  │  (60 FPS)    │  │   Pipeline   │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
├─────────────────────────────────────────────────────────────────┤
│                     ECS Core (World)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Entities   │  │  Components  │  │   Systems    │        │
│  │  Management  │  │     Data     │  │    Logic     │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
├─────────────────────────────────────────────────────────────────┤
│                     Game Systems Layer                          │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ │
│  │  Movement  │ │   Combat   │ │ Inventory  │ │  Crafting  │ │
│  │   System   │ │   System   │ │   System   │ │   System   │ │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘ │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ │
│  │   Skills   │ │   Quest    │ │    UI      │ │Performance │ │
│  │   System   │ │   System   │ │   System   │ │Optimization│ │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                    Resource Management                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │    Asset     │  │   Object     │  │   Memory     │        │
│  │   Loading    │  │   Pooling    │  │ Management   │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

## Core Design Patterns

### 1. Entity-Component-System (ECS)

The game uses ECS architecture for maximum flexibility and performance:

```javascript
// Entity: Unique ID with component collection
class Entity {
  id: string
  components: Map<string, Component>
  active: boolean
}

// Component: Pure data, no logic
class HealthComponent extends Component {
  current: number
  max: number
}

// System: Logic that operates on entities with specific components
class DamageSystem extends System {
  requiredComponents = ['HealthComponent', 'DamageableComponent']
  
  update(deltaTime) {
    // Process all entities with required components
  }
}
```

### 2. Object Pooling

Frequently created/destroyed objects use pooling to reduce garbage collection:

```
┌─────────────────┐
│   Object Pool   │
├─────────────────┤
│ Active Objects  │ ──► Used in game
├─────────────────┤
│Inactive Objects │ ──► Ready for reuse
└─────────────────┘
```

### 3. Observer Pattern

Event system for decoupled communication:

```javascript
EventBus.emit('enemy.killed', { entity, killer })
EventBus.on('enemy.killed', (data) => { /* handle */ })
```

## Module Structure

```
game-core/
├── ecs/                    # ECS Foundation
│   ├── ecs-core.js        # Entity, Component, System, World
│   └── ecs-core.test.js   
│
├── components/             # Game Components
│   └── ecs-components.js   # All component definitions
│
├── systems/                # Game Systems
│   ├── ecs-systems.js      # System implementations
│   └── performance-optimization.js
│
├── inventory/              # Inventory & Items
│   ├── inventory-system.js # Grid-based inventory
│   ├── item-factory.js     # Item generation
│   └── *.test.js          
│
├── crafting/               # Crafting Systems
│   ├── currency-system.js  # Currency orbs
│   ├── crafting-mechanics.js # Crafting logic
│   ├── master-crafting.js  # Advanced crafting options
│   ├── item-corruption.js  # Vaal orb mechanics
│   ├── currency-drop-manager.js
│   └── crafting-ui.js
│
└── character/              # Character Systems
    ├── classes/            # Character classes
    ├── progression/        # Leveling system
    └── skills/             # Skill trees & gems
```

## Data Flow

### Game Loop Flow
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Input     │────▶│   Update    │────▶│   Render    │
│  Handling   │     │   Systems   │     │   Systems   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                    │                    │
       └────────────────────┴────────────────────┘
                           │
                    ┌──────▼──────┐
                    │    World    │
                    │   (State)   │
                    └─────────────┘
```

### Component Communication
```
Entity ──┬── PositionComponent ──┐
         ├── VelocityComponent ──┼──▶ MovementSystem
         └── ColliderComponent ──┘
         
         ├── HealthComponent ────┐
         ├── ArmorComponent ─────┼──▶ CombatSystem  
         └── DamageComponent ────┘
```

## Performance Considerations

### 1. Spatial Partitioning
Entities are organized in a spatial hash grid for efficient collision detection:

```
Grid Cell Size: 128x128 pixels
┌───┬───┬───┐
│ A │ B │ C │  Only check collisions
├───┼───┼───┤  within same or adjacent cells
│ D │ E │ F │
├───┼───┼───┤
│ G │ H │ I │
└───┴───┴───┘
```

### 2. Level of Detail (LOD)
Distance-based quality reduction:
- **Near (0-200px)**: Full quality, all effects
- **Medium (200-500px)**: Reduced particles, simplified animations
- **Far (500px+)**: Basic rendering, no effects

### 3. Batching
Similar operations are batched:
- Render calls grouped by texture
- Entity updates processed in batches of 100
- Physics calculations use fixed timestep

## Development Guidelines

### 1. Component Design
- Components contain only data, no logic
- Keep components small and focused
- Use composition over inheritance

### 2. System Design
- Systems contain all game logic
- Each system has a single responsibility
- Systems should be order-independent when possible

### 3. Performance Rules
- Pool frequently created objects
- Use spatial partitioning for range queries
- Implement LOD for visual elements
- Profile before optimizing

### 4. Testing Strategy
- Write tests before implementation (TDD)
- Test components and systems separately
- Use mocks for external dependencies
- Maintain >80% code coverage

### 5. Code Organization
```javascript
// Good: Clear separation
class HealthComponent extends Component {
  constructor(max, current = max) {
    super();
    this.max = max;
    this.current = current;
  }
}

class HealthSystem extends System {
  update(deltaTime) {
    // Logic here
  }
}

// Bad: Mixed concerns
class Health {
  constructor(max) {
    this.max = max;
    this.current = max;
  }
  
  takeDamage(amount) { // Logic in component!
    this.current -= amount;
  }
}
```

## Future Considerations

### Scalability
- Database integration via MCP for persistence
- Potential multiplayer support
- Modding API for community content

### Performance Enhancements
- WebGL renderer for better performance
- Web Workers for physics calculations
- WASM modules for critical paths

### Platform Expansion
- Mobile touch controls
- Controller support
- Electron wrapper for desktop

---

*This document is a living guide and should be updated as the architecture evolves.*