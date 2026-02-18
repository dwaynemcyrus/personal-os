# Changelog

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
