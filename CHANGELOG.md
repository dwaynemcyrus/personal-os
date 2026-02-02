# Changelog

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
