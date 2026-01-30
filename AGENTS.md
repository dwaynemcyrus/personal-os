# Codex CLI Agent Instructions

## Agent Roles

### @architecture
**Use for:** Schema changes, new features, performance issues, sync logic, major refactors
**File:** architecture.md
**Triggers:** "add new table", "change database", "optimize performance", "refactor sync"

### @frontend  
**Use for:** UI components, styling, gestures, navigation, accessibility
**File:** frontend.md
**Triggers:** "create component", "add button", "style page", "fix layout", "add gesture"

### @execplans
**Use for:** Multi-step tasks, feature planning, migration strategies
**File:** execplans.md  
**Triggers:** "plan out", "how should I", "what's the best way to", tasks >3 steps

## Quick Decision Tree

**Adding UI?** → @frontend
**Changing data structure?** → @architecture  
**Multi-day task?** → @execplans first, then @architecture or @frontend
**Bug fix?** → Check which layer (UI = @frontend, data = @architecture)
**Performance issue?** → @architecture
**New page/route?** → @frontend (UI) + @architecture (if new data needed)

## Core Rules (All Agents)

1. **Mobile-first always** - Design for iPhone 15 Pro (393px), scale up
2. **RxDB is source of truth** - Never bypass with direct Supabase queries
3. **Optimistic UI** - Update local DB immediately, sync in background
4. **TypeScript strict mode** - No `any`, no implicit returns
5. **Accessibility required** - 44px touch targets, ARIA labels, focus states
6. **Test sync first** - Any data change must verify sync works offline→online
7. **Bundle size matters** - Dynamic import for >50KB components
8. **Haptic feedback** - Add tactile response to interactions (10ms vibrate)

## File Placement Rules

**Components:** `src/components/[ui|layout|shared]/ComponentName/`
**Features:** `src/features/[timer|notes|tasks|projects|habits]/`
**Pages:** `src/app/[strategy|knowledge|execution]/`
**Styles:** `src/styles/` (variables.css, reset.css, utils.css)
**Lib:** `src/lib/` (db.ts, supabase.ts, sync.ts only)

## When to Escalate

**Ask human if:**
- Breaking change to sync logic
- New third-party dependency >100KB
- Architectural pattern change
- Performance budget exceeded (>200KB initial bundle)
- Multi-device conflict resolution needed beyond last-write-wins

## Common Patterns

**Create new feature:**
1. @execplans - Plan data model + UI flow
2. @architecture - Add RxDB collection + Supabase table  
3. @frontend - Build UI components
4. Test offline→online sync

**Add new page:**
1. @frontend - Create route in src/app/
2. @frontend - Build page component
3. @architecture - Add TopBar/navigation integration (if needed)

**Fix bug:**
1. Identify layer (data vs UI)
2. Route to @architecture or @frontend
3. Verify fix doesn't break sync

## Code Quality Gates

Before committing:
- Run `npm run type-check`
- Run `eslint --fix`  
- Test on mobile viewport (393px)
- Verify offline functionality
- Check bundle size impact

## Naming Conventions

**Files:** PascalCase for components (`Button.tsx`, `Button.module.css`)
**CSS:** BEM in modules (`.button`, `.button--primary`, `.button__icon`)
**Functions:** camelCase (`handleSubmit`, `fetchTasks`)
**Constants:** UPPER_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`)
**Types:** PascalCase with descriptive names (`TaskDocument`, `SyncStatus`)

## Task-specific routines and documentation are in `./docs/agent-docs/`
- ./docs/agent-docs/execplans.md - use for planning large tasks
- ./docs/agent-docs/frontend.md - use for frontend tasks
- ./docs/agent-docs/architecture.md - use for features that require major architectural changes