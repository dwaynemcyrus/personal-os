# Personal OS - Development Plan

## Current Status: MVP Phase - Sync Proof of Concept ✅

Last updated: February 4, 2026

---

## Phase 1: Foundation (CURRENT)

**Goal:** Get sync working reliably

### ✅ Completed
- [x] Supabase project setup
- [x] RxDB + Supabase sync for single table
- [x] Basic Next.js project structure
- [x] TypeScript strict mode
- [x] Agent files (architecture, frontend, execplans)

### 🚧 In Progress
- [x] Verify sync works offline→online
- [x] Test on two browser tabs
- [x] Test on mobile device

### ⏳ Next Up
- [x] Expand to full schema (projects, tasks, notes, habits, time_entries)
- [ ] Test sync for all tables

---

## Phase 2: Core Schema + Full Sync (with Minimal CRUD Validation)

**Goal:** All data models syncing correctly

### Day 1: Data Model + Docs
- [x] Update `docs/schema.md` conventions to use `is_trashed` (canonical) + `trashed_at`
- [x] Add `trashed_at TIMESTAMPTZ DEFAULT NULL` to **all** tables (including `habit_completions` and `sync_test`); set only on delete
- [x] Create/verify Supabase tables for: projects, tasks, notes, habits, habit_completions, time_entries
- [x] Add indexes for `is_trashed` + `trashed_at` where appropriate
- [x] Decide/confirm `trashed_at` default behavior (see risks)

### Day 2: RxDB Collections + Migrations
- [x] Define RxDB schemas for all collections (with `is_trashed` + `trashed_at`)
- [x] Add collection registration in `src/lib/db.ts`
- [x] Add migration strategy for any schema version bumps (greenfield, but keep structure)
- [x] Add shared TypeScript types per collection

### Day 3: Sync Expansion
- [x] Generalize sync logic to handle multiple collections (avoid duplicate polling/subscriptions)
- [x] Ensure soft deletes sync across devices (`is_trashed` + `trashed_at`)
- [x] Add per-collection pull/push with conflict resolution (LWW on `updated_at`)
- [x] Add offline→online recovery hooks

### Day 4: Minimal CRUD Validation UI
- [x] Add a single `/app/dev` validation page with minimal CRUD for each collection (create/list/update/delete)
- [x] Keep UI simple and mobile-first; use 44px touch targets
- [x] Validate relationships: tasks → projects, time_entries → tasks, habit_completions → habits
- [x] Add basic empty/loading states

### Day 5: Verification + Hardening
- [x] Test multi-table sync (create project → add task → sync both)
- [x] Verify referential integrity (task.project_id, time_entries.task_id, habit_completions.habit_id)
- [x] Test offline→online for each collection
- [x] Verify soft delete propagation across two tabs/devices
- [x] Run lint + type-check (add missing scripts if needed)

**Completion criteria:**
- Can create/edit/delete in each table offline
- Changes sync to Supabase when online
- No data loss after browser refresh
- Works across two devices

---

## Phase 3: Navigation Shell

**Goal:** App structure and navigation working

### Tasks
- [x] Create layout shell (TopBar, FAB, SlideMenu)
- [x] Implement menu button (top-left on home)
- [x] Implement back button (top-left on other pages)
- [x] Create slide-in menu (80% width, 3 sections)
- [x] Add FAB (bottom center)
- [x] Setup routes (/, /strategy, /knowledge, /execution)
- [x] Add safe area insets for iPhone

**Completion criteria:**
- Can navigate between all root pages
- Back button works based on depth
- Menu opens/closes smoothly
- FAB visible and tappable (44px minimum)

---

## Phase 4: Timer Feature

**Goal:** Start/stop timer, track time entries

### Tasks
- [x] Create Timer component
- [x] Start timer (insert time_entry with started_at)
- [x] Stop timer (update stopped_at, calculate duration)
- [x] Display elapsed time (update every second)
- [x] Persist active timer across refresh
- [x] Restore timer on app load
- [x] Add unplanned time labels + suggestions
- [x] Group time entries by session + date in Execution
- [x] Show session details inline (segments, project, type)
- [ ] Add haptic feedback on start/stop
- [x] Test sync (start on phone, see on desktop)

**Completion criteria:**
- Timer doesn't lose data on refresh
- Elapsed time accurate to the second
- Syncs across devices
- Works offline

---

## Phase 5: Task Management

**Goal:** Create/complete/delete tasks

### Tasks
- [x] TaskList component (mobile-first)
- [x] Create task form
- [x] Toggle task completion (checkbox)
- [x] Delete task (swipe or button)
- [x] Link tasks to projects
- [x] Filter tasks (all, active, completed)
- [x] Add to /execution page

**Completion criteria:**
- Can create tasks offline
- Completion syncs immediately
- Deletion works (soft delete)
- Tasks show under correct project

---

## Phase 6: Project Management

**Goal:** Organize tasks into projects

### Tasks
- [x] ProjectList component
- [x] Create project form
- [x] ProjectDetail page (shows tasks)
- [x] Edit project
- [x] Delete project
- [x] Add to /execution page
- [x] Project detail sheet enhancements (quick add, date clear, compact task detail sheet)

**Completion criteria:**
- Can create projects offline
- Can view tasks within project
- Edit/delete works
- Syncs across devices

---

## Phase 7: Note Taking

**Goal:** Create/edit notes with basic editor

### Tasks
- [x] NotesList component
- [x] Create note
- [x] Basic textarea editor (MVP)
- [x] Auto-save on blur (debounced)
- [x] Delete note
- [x] Add to /knowledge page
- [ ] Fullscreen note editor sheet (right swipe, 30% threshold, 48px edge exclusion)

**Completion criteria:**
- Can create notes offline
- Auto-save works (no manual save needed)
- Syncs content changes
- Works on mobile

**Later:** Replace textarea with CodeMirror

---

## Phase 8: Habit Tracking

**Goal:** Daily habit check-ins

### Tasks
- [ ] HabitList component
- [ ] Create habit
- [ ] Check habit for today
- [ ] Show last 7 days
- [ ] Streak counter
- [ ] Add to /execution page

**Completion criteria:**
- Can check habit offline
- Completion syncs
- Shows accurate streak
- Mobile-optimized UI

---

## Phase 9: Command Center (FAB)

**Goal:** Quick capture and search

### Tasks
- [ ] Command center sheet full screen (on FAB tap)
- [ ] Quick capture input
- [ ] Parse input (create task, note, etc.)
- [ ] Search functionality (across all content)
- [ ] Keyboard shortcuts
- [ ] Haptic feedback

**Completion criteria:**
- Opens instantly on FAB tap
- Can create task/note from single input
- Search finds results across all data
- Works offline

---

## Phase 10: FAB Navigation

**Goal:** Drag FAB to navigate

### Tasks
- [ ] FAB hold detection (500ms)
- [ ] Show 3 target zones (strategy, knowledge, execution)
- [ ] Drag mechanics (framer-motion)
- [ ] Visual feedback (zones highlight on drag)
- [ ] Navigate on drop to zone
- [ ] Haptic feedback on zone enter
- [ ] Cancel drag (drag outside zones)

**Completion criteria:**
- Hold FAB → zones appear
- Drag to zone → navigates
- Smooth animations
- Works on touch devices

---

## Phase 11: Gestures & Polish

**Goal:** Native app feel

### Tasks
- [ ] Pull-to-refresh (trigger sync)
- [ ] Swipe-to-go-back, swiping the full sheet to the right at 80% pull the auto pull triggers (like Bear app)
- [ ] Skeleton loading states (all lists)
- [ ] Offline indicator banner/chiklet
- [ ] Sync status indicator (subtle)
- [ ] Loading transitions
- [ ] Empty states

**Completion criteria:**
- Pull-to-refresh works on all list pages
- Swipe back works (not on home)
- All loading states use skeletons
- User always knows sync status
- Feels native on mobile

---

## Phase 12: CodeMirror Integration

**Goal:** Rich text editing for notes

### Tasks
- [ ] Install CodeMirror dependencies
- [ ] Create Editor component wrapper
- [ ] Add markdown support
- [ ] Syntax highlighting
- [ ] Auto-save integration
- [ ] Replace textarea in NoteEditor
- [ ] Test on mobile (keyboard handling)

**Completion criteria:**
- Editor loads <500ms
- Markdown preview works
- Auto-save doesn't interrupt typing
- Works on mobile keyboards

---

## Phase 13: Dark Mode

**Goal:** Support light and dark themes

### Tasks
- [ ] Setup CSS custom properties for themes
- [ ] Add theme toggle in menu
- [ ] Persist theme preference (localStorage)
- [ ] Update all components for dark mode
- [ ] Respect system preference
- [ ] Smooth transition animation

**Completion criteria:**
- Dark mode works everywhere
- No flashing on page load
- Persists across sessions
- Smooth transition

---

## Phase 14: PWA

**Goal:** Installable on mobile/desktop

### Tasks
- [x] Configure next-pwa
- [ ] Create manifest.json
- [ ] Add app icons (512x512, 192x192, etc.)
- [x] Service worker setup
- [x] Offline fallback page
- [ ] Install prompts
- [ ] Test installation on iOS and Android

### Offline Navigation (Current Focus)
- [x] Service worker for offline navigation
- [x] Dedicated /offline route
- [x] Precache core routes (/, /strategy, /knowledge, /execution)

**Completion criteria:**
- App installable from browser
- Works offline after install
- Icons show correctly
- Splash screen works

---

## Phase 15: Info Sheets

**Goal:** Stats and details per page

### Tasks
- [ ] Info button in TopBar (next to more button)
- [ ] ProjectInfo sheet (task count, time spent)
- [ ] HabitInfo sheet (streak, completion rate)
- [ ] TaskInfo sheet (time entries, created date)
- [ ] NoteInfo sheet (word count, created/updated)

**Completion criteria:**
- Info button shows when data available
- Sheet opens from bottom
- Shows relevant stats
- Mobile-optimized

---

## Backlog (Not Prioritized)

- [ ] Export/import data (JSON, CSV)
- [ ] Keyboard shortcuts (desktop)
- [ ] Undo/redo
- [ ] Tags/labels system
- [ ] Advanced search filters
- [ ] Analytics dashboard
- [ ] Charts/visualizations
- [ ] Multi-user (authentication)
- [ ] Real-time collaboration
- [ ] Recurring tasks
- [ ] Task templates
- [ ] Voice input
- [ ] Attachments/files

---

## Known Issues

_Track bugs and blockers here as they arise_

Example:
- [ ] Sync fails on large notes >1MB
- [ ] Timer loses seconds on slow network
- [ ] FAB overlaps keyboard on Android

---

## Decisions Log

### Why RxDB over PowerSync?
- Free and open source
- Simpler for single user
- More control over sync logic
- No licensing costs

### Why CSS Modules over Tailwind?
- Better for custom design system
- No utility class bloat
- More explicit styling
- Easier to maintain custom themes

### Why Radix UI over Headless UI?
- More components (30+ vs 10)
- Better accessibility defaults
- Framework agnostic
- Not tied to Tailwind

### Why Last-Write-Wins conflict resolution?
- Simple for MVP
- Works for single user
- Can upgrade to CRDTs later if needed
- Timestamp-based is reliable

### Why separate habits and habit_completions tables?
- Normalized data structure
- Easy to query completion history
- Can add metadata per completion
- Scales better than JSONB array
