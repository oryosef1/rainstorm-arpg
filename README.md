# 🌧️ RainStorm ARPG

[![Tests](https://img.shields.io/badge/tests-293%20passing-brightgreen)](test-results)
[![Coverage](https://img.shields.io/badge/coverage-95%25-brightgreen)](coverage)
[![Architecture](https://img.shields.io/badge/architecture-ECS-blue)](ARCHITECTURE.md)
[![Progress](https://img.shields.io/badge/progress-58%25-orange)](COMPLETE_TODO.md)

A comprehensive Action RPG built with modern JavaScript, inspired by Path of Exile's depth and complexity.

## 🎮 Features

- **Entity-Component-System Architecture**: Scalable game framework for complex systems
- **7 Character Classes**: Each with unique playstyles and progression paths
- **Massive Passive Skill Tree**: 1000+ nodes for deep character customization
- **Skill Gem System**: Socket and link skills for endless combinations
- **Advanced Crafting**: Currency orbs, master crafting, item corruption, and harvest crafting
- **Grid-Based Inventory**: Path of Exile style inventory management
- **Performance Optimized**: 60 FPS with 500+ entities

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build
```

### Production

```bash
# Build optimized version
npm run build

# Serve production build
npm run serve
```

## 📁 Project Structure

```
rainstorm-arpg/
├── src/                    # Source code
│   ├── index.html         # Main HTML entry
│   ├── systems/           # Game systems
│   ├── components/        # ECS components
│   └── utils/             # Utilities
├── game-core/             # Core game modules
│   ├── ecs/              # Entity-Component-System
│   ├── inventory/        # Inventory system
│   ├── crafting/         # Crafting systems
│   └── character/        # Character systems
├── tests/                 # Test files
├── docs/                  # Documentation
└── dist/                  # Build output
```

## 🏗️ Architecture

The game uses an Entity-Component-System (ECS) architecture:

- **Entities**: Unique IDs that group components
- **Components**: Pure data containers
- **Systems**: Logic processors that operate on entities
- **World**: Container managing all entities and systems

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed documentation.

## 🧪 Development

### Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Code Quality

```bash
# Lint code
npm run lint

# Clean build artifacts
npm run clean
```

## ⚡ Performance

The game includes sophisticated performance optimizations:

- Object pooling for particles and projectiles
- Spatial partitioning for collision detection
- Level-of-detail (LOD) system
- Viewport culling
- Adaptive quality settings

## 📊 Current Status

- **Phase 5**: Campaign Structure (58% complete)
- **Overall Progress**: 19/33 core ARPG tasks (58%)
- **Tests**: 293 passing
- **Architecture**: Clean ECS with no legacy code
- **Build System**: Production-ready Webpack 5 pipeline

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your changes
4. Ensure all tests pass (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Path of Exile's deep gameplay systems
- Built with modern JavaScript and web technologies
- Uses Jest for comprehensive testing