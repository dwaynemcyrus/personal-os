# Changelog

## 0.19.0 - 2026-03-15
- Migrated entire data layer from RxDB to PowerSync for true offline-first SQLite sync
- Replaced all RxDB collections, subscriptions, and mutations with `useQuery`/`usePowerSync` SQL hooks
- Added PowerSync schema (`src/lib/powersync.ts`) covering items, item_links, item_versions, time_entries, and tags tables
- Added `SupabaseConnector` with `fetchCredentials` (Supabase JWT) and `uploadData` (upsert/update/delete to Supabase)
- Added `powersync/sync-rules.yaml` with per-user bucket definitions
- Replaced `DatabaseProvider` with `PowerSyncContext.Provider` wrapping `psDb` singleton
- Added centralized SQL helpers: `insertItem`, `patchItem`, `insertItemLink`, `insertItemVersion` in `src/lib/db.ts`
- Added domain type exports to `db.ts`: `ContentType`, `ReadStatus`, `ItemStatus`, `contentTypes`, `readStatuses`
- Renamed `slug` column to `filename` in Supabase (`items` table) via migration
- Fixed `uploadData` to include `id` in PUT upsert (PowerSync strips id from opData)
- Fixed note content lost on navigation — editor now saves on unmount if dirty
- Fixed Vercel build failure — increased workbox `maximumFileSizeToCacheInBytes` to 4 MiB for PowerSync WASM files
- Updated `vite.config.ts` with COOP/COEP headers, `optimizeDeps.exclude`, and `worker.format: 'es'` required by PowerSync
- Migrated `ProjectList`, `ProjectDetailSheet`, `SettingsSheet`, `SourceDetailSheet`, and all task/note/timer components to PowerSync

## 0.18.0 - 2026-03-02
- Fixed captures incorrectly appearing in Notes views (All, Today, Pinned, Context Sheet) — queries now filter on `inbox_at: null` and `note_type: null` to exclude inbox items
- Fixed `CaptureModal` immediately marking captures as `processed: true` — captures now start as `processed: false` with no result until the user acts in InboxWizard
- Fixed `InboxWizard` never updating the captures table — each action (Keep, To Task, To Project, To Source, Trash) now patches the corresponding capture record with `processed: true`, `result_type`, `result_id`, and `processed_at`
- Fixed critical sync regression on fresh databases — `replicateSupabase` pull modifier now strips Supabase-only columns (`owner`, `device_id`, `revision`) before documents reach `wrappedValidateZSchemaStorage`, which was silently rejecting all pulled rows and leaving production databases empty
- Added Settings button (gear icon) to home screen header — opens a sheet with a **Refresh & Sync** action that clears SW caches, deletes local RxDB IndexedDB databases, unregisters the service worker, and reloads; designed for iOS PWA recovery

## 0.17.0 - 2026-02-28
- Migrated sync from custom polling to the official RxDB Supabase Replication Plugin (`replicateSupabase`) with Realtime push, checkpoint-based pull, and automatic multi-tab leader election
- Added `owner`, `device_id`, `sync_rev`, and `deleted` fields to all 13 RxDB schemas and Supabase tables via migration
- Added `src/lib/device.ts` — stable device UUID persisted in localStorage
- Manual push kept for array/object fields (`tags`, `depends_on`, `properties`) due to plugin conflict; echo suppression prevents push-back loops
- Added `AuthProvider` wrapping the entire app — resolves session on load, renders `LoginView` when unauthenticated, exposes `signOut` via context
- Added `LoginView` — email/password sign-in screen using design tokens (`--gradient-login`, `--shadow-login`); fixes iOS PWA data-not-loading issue caused by isolated storage context
- Fixed PWA manifest conflict — removed manual `<link rel="manifest">` from `index.html` so VitePWA manages it exclusively; added `sizes="180x180"` to apple-touch-icon; added `purpose: 'any'` to manifest icons
- Added RLS policies to all 13 tables (`authenticated_all: FOR ALL TO authenticated USING (true)`) — previously captures, okrs, tags, and areas had RLS enabled with no policies, silently blocking all operations
- Fixed `CaptureModal` — now writes to the `captures` table (`source: 'quick'`, `result_type: 'note'`) before creating the inbox note; captures are fully tracked going forward
- Fixed Today's Note race condition — `handleNowNote` re-queries the DB immediately before insert, preventing duplicate daily notes when sync and user action overlap
- Redesigned `ProjectDetailSheet` layout and styles
- Renamed reserved RxDB field `revision` to `sync_rev` in local schema; Supabase column remains `revision`
- Removed reserved RxDB field `deleted` from local schema; pushed explicitly as `false` in Supabase upsert payload

## 0.16.0 - 2026-02-23
- Replaced task status model with a scheduling model (Today, Upcoming, Backlog, Someday, Waiting, Logbook) using start/due dates and flags
- Added When, Due Date, and metadata rows to task detail header; moved scheduling controls out of the body
- Added completion checkbox to task list items with a 4-second delayed removal, allowing accidental completions to be undone
- Added "Today" badge to task list rows when `start_date` equals today
- Removed filter button row and item dividers from task list views for a cleaner layout
- Removed app-shell topbar from all task views (tasks manage their own header)
- Fixed extra padding around task content area to match the notes layout
- Fixed nested Radix sheet dismiss closing the main task detail sheet on outside click
- Fixed task detail sub-sheet close (When, Due, Tags, Move) no longer propagates to parent sheet
- Swapped FAB triggers: tap now opens ContextSheet, long-press opens CaptureModal
- Added "Create new…" dropdown in ContextSheet Tasks tab to create a project or area inline with an auto-focused text input
- Reduced ContextSheet top/left/right margins from 48px to 24px
- Fixed area titles in ContextSheet Tasks tab to render at bold (700) weight with a hairline divider above each area group
- Fixed `db.projects.insert` missing required `area_id` and `okr_id` fields in ContextSheet, InboxWizard, and ProjectList
- Fixed Supabase 401 errors on hard refresh by guarding sync behind an auth session check; retries automatically when a session becomes available

## 0.15.0 - 2026-02-22
- Added projects and areas to the Tasks tab in ContextSheet, below the main filter rows
- Ungrouped projects listed first, then areas as bold headers with nested indented projects
- Tapping a project opens ProjectDetailSheet; tapping an area opens new AreaDetailSheet
- Added AreaDetailSheet — basic sheet with editable title and delete action
- ContextSheet now subscribes to db.projects, db.areas, and db.tasks with inline CRUD handlers

## 0.14.0 - 2026-02-22
- Added tags catalog — tags are now first-class entities persisted in a `tags` RxDB collection and Supabase table, surviving independently of any task or note
- Added tag edit mode in the Tags sheet — inline rename (blur to save) and silent delete with cascade across all tasks and notes
- Added "New Tag" creates a catalog entry before adding to the task
- Added Areas — new `areas` collection (RxDB + Supabase) with `area_id` FK on both tasks and projects
- Added "Move" meta button to task detail sheet replacing the Project select; opens a half-viewport centered sheet
- Move sheet: pinned search input, grouped view (ungrouped projects first, then areas with nested projects), flat filtered results when searching, "No Project" / "No Area" clear options, checkmark on current selection
- Task can be assigned to either a project or an area — selecting one clears the other
- Supabase migrations: `tags` table, `areas` table, `area_id` column on `tasks` and `projects`
- All `handleSaveTask` / `onSaveTask` signatures updated to include `areaId`

## 0.13.0 - 2026-02-20
- Migrated from Next.js to Vite — app is now a pure client-side SPA served as static files
- Replaced URL-based notes routing (`/notes/[group]/[noteId]`) with stack-based navigation
- Added `index.html`, `vite.config.ts`, `src/main.tsx`, `src/App.tsx` as new entry points
- Added `vite-plugin-pwa` replacing `next-pwa`; added `vitest` + `jsdom` for testing
- Replaced `NavigationLayer` union with new views: `notes-list`, `note-detail`, `tasks-list`, `task-detail`, `plans-list`, `plan-detail`
- Removed `NavigationContext` (`today/execution/thoughts/strategy`) and `SWITCH_CONTEXT` action
- Added `ContextSheet` — bottom sheet opened by FAB long-press with Notes/Tasks/Plans tabs; replaces radial drag-to-navigate
- Removed all `'use client'` directives and `next/*` imports across the codebase
- Moved `globals.css` to `src/styles/globals.css`; converted `next/font/local` to `@font-face` declarations
- Updated `NotesMobileShell` and `NotesDesktopShell` to read nav state directly (no Next.js children prop)
- Updated `CaptureModal`, `NoteDetailPage`, `NoteList`, `NotesList`, `NotesOverview` to use nav actions
- Updated `ProjectList` to use local state for project detail sheet (removed from nav layers)
- Deleted `src/app/` directory, `next.config.ts`, `next-env.d.ts`

## 0.12.0 - 2026-02-19
- Replaced SPA sheet-based notes navigation with URL-based routing via Next.js App Router (`/notes`, `/notes/[group]`, `/notes/[group]/[noteId]`)
- Added 3-pane desktop layout (overview 220px + list 300px + editor flex) and Framer Motion slide animations on mobile
- Added swipe-back gesture (80px threshold from left edge) on mobile note views
- Added `NotesOverview`, `NotesList`, `NoteDetailPage` full-page components replacing ThoughtsMenuSheet, ThoughtsListSheet, NoteDetailSheet
- Added `useGroupedNotes` and `useNoteGroupCounts` hooks with client-side filtering for all, todo, today, pinned, locked, and trash groups
- Rebuilt CodeMirror editor as full-page scrollable view using absolute positioning (fixes vertical scroll on iOS and macOS)
- Fixed wiki-link autocomplete stale closure by proxying through a ref at call time
- Fixed tag autocomplete not wired; now subscribes to live DB tags and inline `#tag` usage
- Merged CM editor `moreMenu` into the NoteEditor `⋮` dropdown with divider-separated sections
- Added checkbox toggle items for dark mode, raw markdown, read-only, writing mode, toolbar, word count, scroll past end, and frontmatter
- Added Find & Replace action to unified dropdown menu
- Changed word count to off by default
- Tightened dropdown item spacing (32px height, reduced gap and separator margins)
- Added `/notes` to PWA offline manifest entries
- Deleted ThoughtsMenuSheet, ThoughtsListSheet, NoteDetailSheet, ThoughtsView

## 0.11.2 - 2026-02-07
- Added strikethrough and 40% opacity styling for completed task content
- Added info button to note editor with sheet showing backlinks, unlinked mentions, and update timestamp
- Fixed editor not updating on remote sync by adding reactive content prop to CodeMirrorEditor
- Fixed slow initial load (~10s → ~1s) by parallelizing sync pull operations across all collections
- Disabled RxDB dev-mode console warnings
- Moved "Updated" timestamp from header to info sheet

## 0.11.1 - 2026-02-07
- Fixed iOS trackpad cursor navigation by switching instant render from replacement widgets to mark decorations
- Fixed checkbox rendering to show icons via CSS ::before while preserving cursor stability
- Fixed checkboxes to show raw markdown when cursor is on that line
- Fixed callouts to not inherit blockquote styles (removed border-left, padding-left, italic)
- Fixed callout spacing by hiding underlying cm-line elements
- Fixed iOS text selection handles not working by adding proper touch-action and user-select CSS
- Fixed accessibility warning by adding visually hidden SheetTitle to NoteDetailSheet
- Changed editor font to explicitly use New Atten at 16px
- Changed typewriter mode cursor position from 50% to 35% from top to compensate for on-screen keyboard

## 0.11.0 - 2026-02-07
- Added version history system with note_versions table (Supabase migration + RxDB schema)
- Added auto-save versions every 30 minutes during editing
- Added manual version save with Cmd+S keyboard shortcut
- Added version history UI with list, preview, and side-by-side compare views
- Added version restore with automatic pre-restore backup
- Added Obsidian-style callouts with 12 types (note, tip, warning, danger, info, success, question, quote, example, abstract, todo, bug)
- Added custom checkbox states: unchecked, checked, forwarded, cancelled, important, question, in-progress, irrelevant
- Added interactive checkboxes that cycle through states on click
- Added highlight syntax (==text==) with yellow background rendering
- Added footnote reference rendering ([^id] as superscript)

## 0.10.0 - 2026-02-07
- Added templates system with RxDB collection, Supabase sync, and template picker UI
- Added template variable replacement ({{date}}, {{time}}, {{title}}, {{year}}, {{month}}, {{day}}, {{weekday}})
- Added instant markdown rendering extension (Bear-like editing experience)
- Hides markdown syntax when cursor not on line, reveals on edit
- Supports headers, bold, italic, strikethrough, inline code, links
- Supports unordered lists, ordered lists, task lists with checkboxes
- Supports blockquotes with left border styling and horizontal rules
- Added typewriter mode (keeps cursor vertically centered while typing)
- Added focus mode with line/sentence/paragraph dimming levels
- Added focus intensity slider for controlling dim opacity
- Added Writing Mode settings sheet with mode selection UI
- Added keyboard shortcuts for focus modes (Cmd+Shift+T, Cmd+Shift+F)
- Integrated writing modes into NoteEditor with dynamic extension reconfiguration

## 0.9.2 - 2026-02-06
- Fixed TaskList filter buttons overflow on mobile by switching to flexbox with wrap
- Fixed touch targets in InboxWizard (closeButton, extractButton) to meet 44px minimum
- Fixed TaskDetailSheet form state not syncing when task prop changes
- Fixed incorrect ARIA pattern (tablist → group) for filter buttons
- Fixed hardcoded z-index in drag targets layer to use CSS variable
- Added CSS variables for success/warning border colors
- Replaced hardcoded colors in CaptureModal with CSS variables
- Replaced hardcoded colors in InboxWizard with CSS variables
- Replaced hardcoded colors in AppShell FAB with CSS variables
- Added fill="currentColor" to NoteEditor MoreIcon for proper color inheritance
- Added focus-visible outlines to buttons missing them
- Moved LoadingFallback inline styles to CSS module
- Consolidated and reorganized z-index variables

## 0.9.1 - 2026-02-04
- Made the note editor sheet full-viewport and right-sided to fully cover the list
- Added right-swipe dismiss with a 30% threshold and 48px edge exclusion
- Moved note editor actions into a Radix dropdown menu (Close + Trash)
- Fixed duplicate note editor sheet rendering during gesture transitions

## 0.9.0 - 2026-02-03
- Replaced Geist font with New Atten local font (5 weights + italics via next/font/local)
- Replaced iOS design tokens with warm paper aesthetic: paper (#f6f2ea) backgrounds, ink (#14110f) text, warm border alphas
- Removed dark mode support (light-only); removed `color-scheme: light dark`
- Updated all component styles (AppShell, Sheet, FocusSheet, CaptureModal, TaskList, TaskDetailSheet, ProjectList, ProjectDetailSheet, NoteList, NoteEditor) to use new token system
- Changed focus rings from blue to ink-900 across all interactive elements
- Changed primary buttons from blue to dark ink pill style (ink-900 bg, paper text)
- Changed danger buttons to use error-ink/error-border tokens
- Added hover transitions (border-color + shadow-hover) to cards and list items
- Rebuilt home page with Now / Inbox / Workbench sections matching design spec
- Updated section, execution, and offline page styles to warm palette
- Fixed CaptureModal z-index to use --z-modal token
- Removed dead AppShell __command styles

## 0.8.1 - 2026-02-03
- Rebuilt FAB with pointer-event drag-to-navigate using radial targets (Execution, Knowledge, Strategy)
- Fixed duplicate FAB rendering and click-after-hold bug by replacing ContextPicker with spec-based implementation
- Added touch event fallback handlers for reliable mobile drag
- Updated FAB visual to rounded-square with spec colors
- Fixed Turbopack dev server error by adding empty turbopack config for next-pwa compatibility

## 0.8.0 - 2026-02-03
- Migrated to single-page app architecture with context-based routing and navigation state machine
- Added sheet manager with gesture support for fluid view transitions
- Added FAB hold detection and context picker for quick navigation
- Converted notes, tasks, and project lists to SPA navigation
- Created context view components and refactored appshell for SPA navigation
- Added smooth animations, accessibility improvements, and performance optimizations
- Removed legacy route files

## 0.7.0 - 2026-02-03
- Added notes list with derived titles, snippets, and relative updated timestamps
- Added full note editor with debounced autosave, soft delete, and route detail view
- Added offline navigation support with service worker caching and /offline fallback
- Added offline note editor fallback for creating/editing notes without navigation
- Forced webpack builds to support next-pwa service worker generation

## 0.6.0 - 2026-02-03
- Added project list on Execution with status filters and open task counts
- Added project detail sheet with task list, status, and start/due dates
- Added quick-add tasks within project sheets
- Added inline clear buttons for project start/due dates
- Made task detail sheets compact by default

## 0.5.0 - 2026-02-02
- Added session-based time entry grouping with inline segment details and live totals on Execution
- Added unplanned activity suggestions and session metadata for time entries
- Added task list on Execution with quick-add, project display, detail sheet, and completion toggle
- Added task status model (backlog/next/waiting) with filters and status editing
- Updated base typography (14px base) and standardized inputs to 16px

## 0.4.1 - 2026-02-01
- Fixed DB initialization race so collections are registered before sync starts

## 0.4.0 - 2026-02-01
- Added focus timer with start/pause/resume/stop logic and single-active-timer enforcement
- Added fullscreen Focus Sheet with planned/log entry creation and stop-start confirmation
- Added `entry_type` + `label` to time entries for unplanned log tracking
- Added global focus status chip and Today focus summary card
- Added execution log list for unplanned activity entries

## 0.3.0 - 2026-02-01
- Added Phase 3 navigation shell with TopBar, slide-in menu, FAB, and command-center stub
- Added core routes for Strategy, Knowledge, and Execution with placeholder content
- Added Radix Sheet wrapper + framer-motion gestures to support the new shell
- Introduced design tokens and refreshed global styles for safe-area handling
- Replaced home page sync test UI with a Today-focused stub (sync tests remain under /dev)

## 0.2.2 - 2026-02-01
- Renamed soft-delete fields to `is_trashed` and `trashed_at` across RxDB schemas, sync, UI queries, and docs
- Added RxDB migration strategies for existing local data
- Added SQL migration to rename Supabase columns and indexes for trashed fields

## 0.2.1 - 2026-02-01
- Suppressed sync echo updates and skipped updated_at-only patches to stop list cycling across devices
- Added stable secondary sorting by id on list views to prevent visual jitter
- Paused polling while tabs are hidden and resume on visibility to reduce background churn
- Added npm test script for lint + type-check gates
- Streamlined AGENTS instructions to remove duplication and clarify rules

## 0.2.0 - 2026-01-31
- Phase 2 complete: standardized soft-delete fields (`is_deleted`, `deleted_at`) across schemas and docs, with Supabase table coverage and indexes
- Added RxDB collections/types with migration strategies and multi-collection sync support
- Expanded `/app/dev` CRUD validation for all collections and relationship checks
- Verified offline→online sync, soft-delete propagation, and multi-collection workflows
- Registered RxDB migration schema plugin to support collection migrations
- Adjusted `/dev` background surfaces for improved dark-mode readability

## 0.1.1 - 2026-01-31
- Added missing environment variables to vercel
- Test and confirmed ful sync functionality

## 0.1.0 - 2026-01-30
- Setup testing ground for sync setup
