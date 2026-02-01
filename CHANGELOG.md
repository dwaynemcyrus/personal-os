# Changelog

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
