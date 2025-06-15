# RainStorm ARPG - Development Guide

!!! **CRITICAL**: Always update `COMPLETE_TODO.md` when done with features !!!
!!! **CRITICAL**: Don't stop until all todos are 100% completed !!!

## 🚀 EVERY SESSION WORKFLOW
1. `git pull origin main` (always start fresh)
2. Read `COMPLETE_TODO.md` & choose your task
3. Work ONLY in your assigned feature pod
4. Update progress in `COMPLETE_TODO.md`
5. `git add . && git commit -m "message" && git push origin main`

## 🏗️ FEATURE POD SYSTEM
**RULE**: Work ONLY in `/features/your-feature/` - Zero conflicts guaranteed!

```
/features/your-feature/
  - feature.pod.ts     # Main code
  - feature.api.ts     # API interface  
  - feature.events.ts  # Event communication
  - feature.test.ts    # Tests
```

**Create new feature**: `npx ts-node tools/create-feature.ts --name your-feature`

## 📋 KEY RULES
- ✅ **TypeScript ONLY** - NO .js files
- ✅ **Feature Pods ONLY** - Complete isolation
- ✅ **Event communication** - No direct calls between features
- ✅ **Always test** - TDD required
- ✅ **Git workflow** - Pull → Work → Commit → Push

## 🔗 LINKS
- **Repository**: https://github.com/oryosef1/rainstorm-arpg
- **Game**: `http://localhost:8000/rainstorm_game.html`
- **Server**: `python3 -m http.server 8000`
- **Tests**: `npm test`

## 🎯 COMMIT FORMAT
```
Add [feature]: [description]

🚀 Generated with [Claude Code](https://claude.ai/code)
Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types**: Add, Update, Fix, Refactor, Test, Docs, Style