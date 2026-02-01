# Changelog

## 0.3.1 - 2026-02-01
- Switched to a single internal scroll container with a fixed TopBar (native app-style shell)
- Locked document scrolling to prevent full-page browser scroll

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
