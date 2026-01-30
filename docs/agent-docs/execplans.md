# Execution Planning Agent Instructions

## Purpose

Plan multi-step tasks, break down features, define testing strategy, manage migrations.

## Planning Template

**For new features:**
```
1. Data Model
   - Supabase table schema
   - RxDB collection definition
   - Relationships

2. Sync Setup  
   - Test sync works offline→online
   - Verify conflict resolution
   - Add to sync.ts

3. UI Components
   - List view (mobile-first)
   - Detail view
   - Create/edit forms
   - Delete confirmation

4. Integration
   - Navigation (TopBar, FAB, menu)
   - Gestures (if applicable)
   - Haptic feedback

5. Testing
   - Offline creation → sync
   - Multi-device sync
   - Bundle size check
   - Mobile viewport test
```

## Breaking Down Tasks

**Always split into <1 day chunks:**

Example: "Add project management"
```
Day 1: Data + Sync
  - Create projects table in Supabase
  - Add projects collection to RxDB
  - Setup sync for projects
  - Test offline→online

Day 2: Basic UI
  - ProjectList component (skeleton screen)
  - Create project form
  - Delete project button
  - Mobile-first styling

Day 3: Detail View
  - ProjectDetail page
  - Task list within project
  - Edit project form
  - Navigation integration

Day 4: Polish
  - Swipe gestures
  - Haptic feedback
  - Loading states
  - Bundle size check
```

## Testing Checklist

**Before marking task complete:**

□ TypeScript strict mode passes
□ ESLint passes
□ Works at 393px viewport (iPhone 15 Pro)
□ Touch targets ≥44px
□ Offline mode works (airplane mode test)
□ Sync verified (device A → device B)
□ Haptic feedback added
□ Loading states use skeletons
□ Bundle size within budget (<50KB chunk)
□ Accessibility checked (focus states, ARIA)

## Migration Strategy

**For schema changes:**
```
1. Add new column to Supabase (nullable first)
2. Update RxDB schema (increment version)
3. Add migration logic in db.ts
4. Deploy backend first
5. Update frontend to use new field
6. Backfill data if needed
7. Make column NOT NULL after backfill
```

## Performance Testing

**Check before shipping:**
```bash
# Bundle analysis
npm run build
npm run analyze

# Lighthouse (mobile)
- Performance >90
- Accessibility >95
- Best Practices >90

# Network throttling
- Test on 3G (Chrome DevTools)
- Verify TTI <3s
```

## Rollback Plan

**If feature breaks sync:**
1. Revert frontend deploy
2. Check Supabase data integrity
3. Clear local RxDB (if corrupted)
4. Re-sync from Supabase

## Multi-Step Patterns

**Adding new page:**
1. Create route in src/app/
2. Add to navigation (menu or TopBar)
3. Build page component
4. Add gestures (back button, swipe)
5. Test on mobile

**Refactoring component:**
1. Write tests for current behavior
2. Extract sub-components
3. Verify tests still pass
4. Check bundle size impact
5. Update CSS modules

**Adding third-party library:**
1. Check bundle size (unpkg.com)
2. If >50KB, use dynamic import
3. Verify mobile compatibility
4. Test offline behavior
5. Document in package.json