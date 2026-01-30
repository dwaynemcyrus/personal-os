# Personal OS

Mobile-first personal productivity system with offline-first sync.

## Stack

- **Next.js 15** - React framework with App Router
- **RxDB** - Offline-first local database
- **Supabase** - PostgreSQL backend + real-time sync
- **Radix UI** - Accessible component primitives
- **CSS Modules** - Component-scoped styling with BEM
- **TypeScript** - Strict mode enabled
- **Framer Motion** - Smooth gestures and animations

## Features

- ⏱️ Time tracking with stopwatch
- 📋 Project and task management
- 📝 Note taking with rich text editor
- ✅ Habit tracking with streaks
- 🔄 Offline-first with automatic sync
- 📱 Mobile-optimized (iPhone-first design)
- 🎨 Dark mode support
- ⚡ Fast and responsive (PWA-ready)

## Setup

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)

### 1. Install dependencies
```bash
npm install
```

### 2. Setup Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor
3. Run the schema from `docs/schema.md`
4. Go to Project Settings → API
5. Copy your Project URL and anon public key

### 3. Configure environment

Create `.env.local` in project root:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development Workflow

### Using Codex CLI Agents

This project uses specialized agents for different types of work:
```bash
# For UI components and styling
codex @frontend "create Button component with primary and secondary variants"

# For database schema and sync logic
codex @architecture "add projects table and setup sync"

# For planning complex features
codex @execplans "plan out habit tracking feature"

# General work (auto-routes to appropriate agent)
codex "add a delete button to the task list"
```

See `agents.md` for detailed agent documentation.

### Project Structure
```
personal-os/
├── src/
│   ├── app/                    # Next.js routes
│   │   ├── strategy/          # Projects and planning
│   │   ├── knowledge/         # Notes and documents
│   │   ├── execution/         # Tasks and habits
│   │   └── page.tsx           # Home (Today view)
│   ├── components/
│   │   ├── ui/                # Radix wrappers (Button, Sheet, etc.)
│   │   ├── layout/            # Navigation, FAB, TopBar
│   │   └── shared/            # Reusable components
│   ├── features/              # Domain logic
│   │   ├── timer/
│   │   ├── notes/
│   │   ├── tasks/
│   │   ├── projects/
│   │   └── habits/
│   ├── lib/                   # Core utilities
│   │   ├── db.ts             # RxDB setup
│   │   ├── supabase.ts       # Supabase client
│   │   └── sync.ts           # Sync logic
│   ├── hooks/                 # Global React hooks
│   └── styles/                # CSS variables and globals
├── docs/                      # Documentation
│   ├── schema.md             # Database schema reference
│   ├── design-tokens.md      # Design system
│   └── components.md         # Component inventory
├── agents.md                  # Codex agent instructions
├── architecture.md            # Architecture guidelines
├── frontend.md               # Frontend guidelines
├── execplans.md              # Planning guidelines
└── PLANS.md                  # Development roadmap
```

### Key Development Files

- **PLANS.md** - Current roadmap and progress tracking
- **docs/schema.md** - Single source of truth for database schema
- **docs/design-tokens.md** - CSS variables and design system
- **agents.md** - How to work with Codex CLI agents

## Testing

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
npm run lint:fix  # Auto-fix issues
```

### Build
```bash
npm run build
```

### Manual Testing Checklist

Before committing features:

- [ ] Works offline (test in airplane mode)
- [ ] Syncs across browser tabs (open two tabs)
- [ ] Persists after browser refresh
- [ ] Works at mobile viewport (393px)
- [ ] Touch targets are ≥44px
- [ ] TypeScript strict mode passes
- [ ] ESLint passes with no warnings

## Deployment

### Deploy Frontend (Vercel)
```bash
npx vercel
```

Or connect your GitHub repo to Vercel for automatic deployments.

### Backend (Supabase)

Supabase is already hosted. No deployment needed.

## Architecture

### Offline-First Pattern
```
User Action
    ↓
Update RxDB (local) ← User sees change immediately
    ↓
Sync to Supabase (background) ← Automatic, non-blocking
    ↓
Update other devices ← Pull changes on interval
```

### Data Flow

1. User creates/edits data
2. RxDB updates local IndexedDB instantly
3. `sync.ts` pushes to Supabase in background
4. Other devices poll Supabase for changes
5. RxDB pulls and merges new data

### Conflict Resolution

**Strategy:** Last-write-wins (based on `updated_at` timestamp)

Simple and reliable for single-user apps. Can be upgraded to CRDTs if multi-user support is added.

## Mobile-First Design

**Target devices:**
- iPhone 15 Pro (393px width)
- iPhone 15 Pro Max (430px width)
- iPad Mini (744px width)

**Design principles:**
- 44px minimum touch targets
- 16px minimum font size (prevents iOS zoom)
- Safe area insets for iPhone notch/home indicator
- Gestures: swipe, pull-to-refresh, drag
- Haptic feedback on interactions

## Performance

**Budgets:**
- Initial bundle: <200KB gzipped
- Route chunks: <50KB each
- Time-to-Interactive (mobile 3G): <3s

**Optimizations:**
- Dynamic imports for heavy components
- Code splitting by route
- Optimistic UI updates (no loading spinners)
- IndexedDB for instant local reads

## Contributing

This is a personal project, but if you're interested:

1. Check `PLANS.md` for current priorities
2. Use Codex agents for consistency
3. Follow patterns in `architecture.md` and `frontend.md`
4. Test offline functionality
5. Ensure mobile-first design

## Current Status

See `PLANS.md` for detailed roadmap and progress.

**Phase:** MVP - Sync Proof of Concept ✅

**Next up:** Expand to full schema (Phase 2)

## License

MIT

## Support

For issues or questions, open a GitHub issue.