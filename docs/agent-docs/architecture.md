# Architecture Agent Instructions

## System Overview

**Stack:** Next.js 15 + RxDB + Supabase + Radix UI + CSS Modules
**Pattern:** Offline-first, optimistic UI, mobile-first
**Data flow:** User → RxDB (local) → Sync → Supabase (cloud)

## File Structure
```
src/
├── app/                    # Next.js routes (strategy|knowledge|execution)
├── components/
│   ├── ui/                # Radix wrappers (Button, Sheet, Dropdown)
│   ├── layout/            # Navigation, FAB, TopBar, SlideMenu
│   └── shared/            # Cross-feature components
├── features/              # Domain logic (timer, notes, tasks, projects, habits)
│   └── [feature]/
│       ├── components/    # Feature-specific UI
│       ├── hooks/         # useTimer, useNotes, etc.
│       └── utils/         # Feature utilities
├── lib/                   # Core (db.ts, supabase.ts, sync.ts)
├── hooks/                 # Global hooks (useDatabase)
└── styles/                # CSS variables, reset, utils
```

## Database Schema Rules

**Supabase tables must have:**
- `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
- `created_at TIMESTAMPTZ DEFAULT NOW()`
- `updated_at TIMESTAMPTZ DEFAULT NOW()` (with trigger)
- `is_deleted BOOLEAN DEFAULT FALSE` + `deleted_at TIMESTAMPTZ DEFAULT NULL` (soft delete for sync)

**RxDB collections must match** Supabase 1:1 for sync

**Example:**
```typescript
// Supabase
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id),
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

// RxDB schema
const taskSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    project_id: { type: 'string', maxLength: 36 },
    title: { type: 'string' },
    completed: { type: 'boolean' },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
    is_deleted: { type: 'boolean' },
    deleted_at: { type: ['string', 'null'], format: 'date-time' }
  },
  required: ['id', 'title', 'created_at', 'updated_at', 'is_deleted', 'deleted_at']
};
```

## Sync Architecture

**Pattern:** Optimistic updates + background sync
**Conflict resolution:** Last-write-wins (compare `updated_at`)
**Error handling:** Silent retry with exponential backoff

**Always:**
- Update RxDB first (user sees change immediately)
- Let sync.ts handle Supabase push
- Never await sync in UI code
- Show sync status indicator (non-blocking)

## Performance Budgets

**Bundle sizes:**
- Initial JS: <200KB gzipped
- Route chunks: <50KB each
- Use dynamic imports for: CodeMirror, charts, heavy UI

**Time-to-Interactive:**
- Mobile 3G: <3s
- Mobile 4G: <1.5s  
- Desktop: <1s

**Code splitting:**
```typescript
const Editor = dynamic(() => import('@/features/notes/components/Editor'), {
  ssr: false,
  loading: () => <EditorSkeleton />
});
```

## TypeScript Configuration

**Strict mode enabled:**
```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitReturns": true
}
```

**Type all RxDB documents:**
```typescript
type TaskDocument = {
  id: string;
  title: string;
  completed: boolean;
  // ... all fields
};
```

## CSS Architecture

**Variables:** `src/styles/variables.css` (spacing, colors, z-index)
**Reset:** `src/styles/reset.css` (normalize)
**Utils:** `src/styles/utils.css` (common patterns)

**Mobile-first breakpoints:**
```css
/* Default: 393px (iPhone 15 Pro) */
@media (min-width: 744px) { /* iPad Mini */ }
@media (min-width: 1024px) { /* Desktop */ }
```

**Safe areas:**
```css
padding-bottom: calc(var(--space-4) + env(safe-area-inset-bottom));
```

## Adding New Features

1. Plan data model (Supabase table + RxDB collection)
2. Add to `src/lib/db.ts` (collection definition)
3. Add to `src/lib/sync.ts` (sync setup)
4. Create feature folder: `src/features/[name]/`
5. Test sync offline→online before building UI

## Security

**RLS policies:** Allow all for single user (MVP)
**Later:** Add user_id column + auth when multi-user needed

## When to Refactor

**Triggers:**
- Component >200 lines
- Function >50 lines
- Duplicate logic in 3+ places
- Bundle chunk >50KB
