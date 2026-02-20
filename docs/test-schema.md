# Schema Spec & Data Model Plan

## Context
Before building out core features (capture → process, tasks, projects, OKR planning, habits), the data model needs to be defined and gaps filled. The existing 10 collections cover the basics but are missing `captures`, `okrs`, and several fields needed to connect the system together. This plan defines the full target schema and specifies exactly what needs to be added/changed. Output: `docs/schema.md` as the permanent source of truth.

---

## Audit Summary

| Collection | Status | Gap |
|---|---|---|
| `sync_test` | Legacy | Ignore |
| `projects` | Needs update | Missing `okr_id` |
| `tasks` | Needs update | Missing `content`, `priority`, `depends_on`, `okr_id` |
| `notes` | Needs update | `note_type` needs enum values; `okr_id` + `period` + `period_date` in properties |
| `habits` | Needs update | Missing `frequency`, `target`, `active`, `okr_id`, `streak`, `last_completed_at` |
| `habit_completions` | OK | Stable |
| `time_entries` | OK | Stable |
| `note_links` | OK | Stable |
| `templates` | OK | Stable |
| `note_versions` | OK | Stable |
| `captures` | **MISSING** | New collection needed |
| `okrs` | **MISSING** | New collection needed |

---

## Target Schema — All Collections

### `captures` (NEW)
Raw inbox items. Processed into notes, tasks, or projects then flagged done.

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| body | string | Raw capture text |
| source | string? | `'quick'` \| `'voice'` \| `'email'` \| null |
| processed | boolean | Default false |
| processed_at | ISO string? | |
| result_type | string? | `'note'` \| `'task'` \| `'project'` \| `'discarded'` |
| result_id | UUID? | ID of resulting record |
| created_at | ISO string | |
| updated_at | ISO string | |
| is_trashed | boolean | |
| trashed_at | ISO string? | |

---

### `okrs` (NEW)
Self-referencing hierarchy: yearly → 12-week cycle → objective → key result.

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| title | string | |
| description | string? | |
| type | enum | `'yearly'` \| `'12week'` \| `'objective'` \| `'key_result'` |
| parent_id | UUID? | Self-reference — null for yearly plans |
| period_start | ISO date? | e.g. `2026-01-01` |
| period_end | ISO date? | e.g. `2026-12-31` |
| status | enum | `'draft'` \| `'active'` \| `'complete'` \| `'abandoned'` |
| progress | integer | 0–100 |
| created_at | ISO string | |
| updated_at | ISO string | |
| is_trashed | boolean | |
| trashed_at | ISO string? | |

**Hierarchy:**
```
yearly (parent_id: null)
  └→ 12week (parent_id: yearly.id)
       └→ objective (parent_id: 12week.id)
            └→ key_result (parent_id: objective.id)
```

---

### `projects` (UPDATE → v3)
Add `okr_id`. All other fields unchanged.

| Field | Type | Notes |
|---|---|---|
| okr_id | UUID? | FK → okrs (key_result or objective level) |

---

### `tasks` (UPDATE → v3)
Add `content`, `priority`, `depends_on`, `okr_id`.

| Field | Type | Notes |
|---|---|---|
| content | string? | Markdown body — checklist lives here as `- [ ]` items |
| priority | integer? | 1=urgent, 2=high, 3=medium, 4=low |
| depends_on | string[]? | Array of task UUIDs this task is blocked by |
| okr_id | UUID? | Optional direct link to a key result |

---

### `habits` (UPDATE → v2)
Major additions needed.

| Field | Type | Notes |
|---|---|---|
| frequency | enum | `'daily'` \| `'weekdays'` \| `'weekly'` |
| target | integer | Times per period, default 1 |
| active | boolean | Default true |
| okr_id | UUID? | FK → okrs |
| streak | integer | Cached current streak, default 0 |
| last_completed_at | ISO string? | For streak display |

---

### `notes` (UPDATE → v6)
Formalize `note_type` and expand recognized property keys.

**`note_type` values:** `'note'` \| `'reference'` \| `'meeting'` \| `'journal'` \| `'plan'`

**`properties` recognized keys:**
| Key | Type | Notes |
|---|---|---|
| tags | string[] | |
| status | string | Custom status (draft, active, etc.) |
| project_id | UUID? | |
| okr_id | UUID? | Link to any OKR level |
| due_date | ISO date? | |
| priority | 1–5 integer | |
| period | string? | Plans only: `'weekly'` \| `'monthly'` \| `'quarterly'` \| `'annual'` |
| period_date | string? | Plans only: `'2026-W08'`, `'2026-03'`, `'2026-Q1'` |
| related_notes | UUID[] | |

---

### `habit_completions` — no changes
Stable. Consider adding optional `note` (string?) field in a future update for reflection text.

---

## Frontmatter Reference (CM editor → notes.properties)

```yaml
---
tags: [writing, ideas]
status: draft
project_id: uuid
okr_id: uuid
due_date: 2026-03-01
priority: 2
period: weekly           # plan notes only
period_date: 2026-W08    # plan notes only
related_notes: [uuid, uuid]
---
```

---

## Relationship Map

```
okrs (self-referencing hierarchy)
  └→ projects.okr_id
  └→ tasks.okr_id
  └→ habits.okr_id
  └→ notes.properties.okr_id

projects
  └→ tasks.project_id
  └→ time_entries (via tasks)

tasks
  └→ time_entries.task_id
  └→ tasks.depends_on[] (self-referencing dependencies)

notes
  └→ note_links (source + target)
  └→ note_versions

habits
  └→ habit_completions.habit_id

captures
  └→ result_id → notes | tasks | projects (after processing)
```

---

## Implementation Steps

### 1. Supabase migrations (3 files)
- `[ts]_captures.sql` — create captures table
- `[ts]_okrs.sql` — create okrs table with self-ref parent_id
- `[ts]_schema_additions.sql` — add columns to projects, tasks, habits

### 2. Update `src/lib/db.ts`
- Add `captureSchema` + `CaptureDocument` type
- Add `okrSchema` + `OkrDocument` type + `OkrType` enum
- Update `projectSchema` → v3 (add `okr_id`)
- Update `taskSchema` → v3 (add `content`, `priority`, `depends_on`, `okr_id`)
- Update `habitSchema` → v2 (add `frequency`, `target`, `active`, `okr_id`, `streak`, `last_completed_at`)
- Update `noteSchema` → v6 (expand properties shape)
- Add RxDB migration strategies for v2→v3 (projects, tasks) and v1→v2 (habits)
- Add `captures` + `okrs` to `DatabaseCollections`

### 3. Update `src/lib/sync.ts`
- Add `captures` and `okrs` to `collectionConfig`

### 4. Verify
- `npm run type-check` passes
- App loads without RxDB migration errors

---

## Files To Modify

| File | Change |
|---|---|
| `src/lib/db.ts` | New/updated schemas, types, migration strategies |
| `src/lib/sync.ts` | Add captures + okrs to sync config |
| `supabase/migrations/[ts]_captures.sql` | New |
| `supabase/migrations/[ts]_okrs.sql` | New |
| `supabase/migrations/[ts]_schema_additions.sql` | Add columns to projects, tasks, habits |
