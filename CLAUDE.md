# RainStorm ARPG - Revolutionary Conflict-Free Development Workflow
!!! important - always, but always update `COMPLETE_TODO.md` when your done with features, i need to know what is happening !!!
!!! important - dont stop working until all the todo is 100% completed !!!

## 🌟 REVOLUTIONARY ARCHITECTURE: UNLIMITED AI AGENT PARALLEL DEVELOPMENT

**BREAKTHROUGH**: This project now uses the world's first conflict-free parallel development architecture that enables UNLIMITED AI agents to work simultaneously without ANY conflicts.

## CRITICAL INSTRUCTION
**DO NOT STOP UNTIL ALL TODOS ARE 100% COMPLETE AND WORKING - NO MATTER WHAT**
- NEVER end a session with incomplete todos
- Continue implementing features until COMPLETE_TODO.md shows 100% completion
- Create sub-tasks when needed for complex features
- Verify each implementation with tests
- Check off tasks ONLY when fully functional
- If stuck, create sub-tasks to break down the problem
- ALWAYS complete what you start in each session

## 🚀 CONFLICT-FREE DEVELOPMENT WORKFLOW (Every Session)
1. Read `memory.md` & `COMPLETE_TODO.md`
2. **PULL LATEST CHANGES**: `git pull origin main` (always start with latest)
3. **CHOOSE YOUR FEATURE POD**: Work ONLY in your assigned feature directory
4. **USE FEATURE GENERATOR**: `npx ts-node tools/create-feature.ts --name your-feature`
5. **FOLLOW POD ARCHITECTURE**: All code in isolated feature pod
6. **USE EVENT COMMUNICATION**: No direct calls between features
7. **WRITE TESTS**: TDD within your feature pod
8. **VERIFY INTEGRATION**: Test event flows with other features
9. **UPDATE PROGRESS**: Mark complete in COMPLETE_TODO.md & memory.md
10. **COMMIT & PUSH**: Always commit and push your changes when done
11. **REPEAT**: Zero conflicts with other developers guaranteed!

## Stack & Architecture
- **Architecture**: Revolutionary Feature Pod System (conflict-free)
- **Communication**: Event-driven with zero conflicts
- **Development**: Contract-first API development
- **Language**: TypeScript ONLY (100% conversion complete)
- **Repository**: GitHub - https://github.com/oryosef1/rainstorm-arpg
- **Version Control**: Git with continuous integration
- **Server**: `python3 -m http.server 8000`
- **Game**: `http://localhost:8000/rainstorm_game.html`
- **Test**: `npm test`
- **Database**: MCP

## 🎯 **TYPESCRIPT-ONLY DEVELOPMENT**
**CRITICAL**: ALL new code must be written in TypeScript (.ts files)
- ✅ **100% TypeScript conversion completed** (120+ files)
- ✅ **Zero JavaScript files remaining** (excluding config/tests)
- ✅ **Full type safety and IntelliSense support**
- **NEVER create .js files** - Always use .ts extension
- **ALWAYS use proper TypeScript types and interfaces**
- **MANDATORY**: Export interfaces for all data structures

## MCP INTEGRATION - MANDATORY USE
**CRITICAL**: You MUST use MCP servers for ALL development tasks!

### Available MCP Servers (ALL ACTIVE)
1. **Filesystem MCP** - Browse project files, analyze code structure
2. **GitHub MCP** - Repository operations, code reviews, PR management  
3. **PostgreSQL MCP** - Database queries, player analytics, data operations
4. **Puppeteer MCP** - Automated testing, performance analysis, screenshots
5. **Brave Search MCP** - Research ARPG mechanics, find documentation

### MCP Usage Requirements
- **ALWAYS** use Filesystem MCP to examine code before making changes
- **ALWAYS** use Database MCP for player/character data operations
- **ALWAYS** use Testing MCP for automated validation
- **NEVER** work without leveraging MCP capabilities
- **VERIFY** all implementations using MCP-powered analysis

## 🏗️ FEATURE POD ARCHITECTURE

### **REVOLUTIONARY CONFLICT-FREE DEVELOPMENT**
Every feature is completely isolated in its own "pod" with zero shared dependencies:

```
/features/
  /your-feature-name/
    - feature-name.pod.ts        # Main feature implementation
    - feature-name.api.ts        # Public API interface (contract-first)
    - feature-name.events.ts     # Event definitions and handlers
    - feature-name.types.ts      # TypeScript type definitions
    - feature-name.config.ts     # Configuration management
    - feature-name.test.ts       # Isolated tests
    - README.md                  # Feature documentation
```

### **DEVELOPMENT RULES - ZERO CONFLICTS GUARANTEED**
```
✅ DO: Work ONLY in your assigned feature pod directory
✅ DO: Communicate through events only (EventBus)
✅ DO: Define clear API contracts before implementation
✅ DO: Use Feature Generator for instant pod creation
✅ DO: Write comprehensive tests within your pod
✅ DO: Use TypeScript with full type safety

❌ DON'T: Edit other features' files (conflicts impossible)
❌ DON'T: Call other features directly (use events)
❌ DON'T: Share code between features (complete isolation)
❌ DON'T: Break API contracts (version safely)
❌ DON'T: Create .js files (TypeScript only)
```

### **INSTANT FEATURE CREATION**
```bash
# Create new feature pod in under 1 minute
npx ts-node tools/create-feature.ts --name my-awesome-feature

# Automatically generates:
# - Complete TypeScript pod structure
# - API contracts and event definitions
# - Test templates and configuration
# - Full integration with existing systems
```

## File Management - FEATURE POD SYSTEM
- **FEATURE PODS**: All new features in `/features/` directory (isolated)
- **CORE SYSTEMS**: Revolutionary infrastructure in `/core/` (event bus, API registry)
- **TEMPLATES**: Base classes in `/templates/` (feature pod template)
- **TOOLS**: Development tools in `/tools/` (feature generator, CLI)
- **LEGACY SYSTEMS**: Converted to feature pods (inventory, flasks)
- **TYPESCRIPT ONLY**: All new files must use .ts extension - NO .js files
- **ZERO CONFLICTS**: Feature isolation prevents all development conflicts
- **HOT RELOADING**: Features auto-discovered and updated without restarts

## 📚 GITHUB INTEGRATION - MANDATORY WORKFLOW
**CRITICAL**: ALL development MUST use GitHub for version control and collaboration!

### **Repository Information**
- **Repository URL**: https://github.com/oryosef1/rainstorm-arpg
- **Main Branch**: `main`
- **Status**: Production-ready AAA game with 8,000+ lines TypeScript

### **Git Workflow - EVERY SESSION**
```bash
# 1. ALWAYS start with latest changes
git pull origin main

# 2. Work on your feature (in your assigned pod)
# ... make your changes ...

# 3. Stage your changes
git add .

# 4. Commit with comprehensive message
git commit -m "Add [feature]: [description]

🚀 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# 5. ALWAYS push when done
git push origin main
```

### **Commit Message Format**
```
[Type] [Feature]: [Short description]

[Optional detailed description]

🚀 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types**: Add, Update, Fix, Refactor, Test, Docs, Style

### **Critical Git Rules**
- ✅ **ALWAYS pull before starting work**
- ✅ **ALWAYS commit and push when done**
- ✅ **NEVER work without version control**
- ✅ **Use descriptive commit messages**
- ✅ **Include co-author attribution**
- ✅ **Push frequently to avoid conflicts**