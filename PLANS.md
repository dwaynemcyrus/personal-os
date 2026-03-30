# Personal OS - Rebuild Plan
`codex resume 019c264c-af4c-7763-b52e-ab053833111a`

## Primary Reference

- Rebuild brief: `docs/_new/v1-rebuild-brief.md`

## Current Direction

This repository is now on a deliberate v1 rebuild path.

V1 will:

- standardize fully on the new document model
- keep the existing Vite SPA shell
- preserve the structural UI/UX patterns from legacy notes, tasks, and projects
- rebuild in very small chunks
- remove dependency on legacy schema assumptions

V1 will not:

- continue the old RxDB/legacy-items architecture
- preserve dropped legacy tables as active dependencies
- do broad mixed refactors
- port old feature code unchanged

---

## Current Reality

The repo currently contains two overlapping systems:

1. New document-model surfaces
   - Home
   - Command sheet
   - Inbox
   - Document detail
   - Actions
   - Writing
   - Reference

2. Legacy schema-dependent surfaces
   - notes
   - tasks
   - projects
   - strategy
   - backup / restore / import / export

The rebuild exists to converge these into one coherent product.

---

## Product Principles

- Build from the visual language in `ContextSheet`
- Preserve the interaction structure of legacy notes, tasks, and projects
- Use the new `items` document model as the only source of truth
- Favor small diffs over ambitious rewrites
- Keep the app working after every chunk
- Prefer explicit verification over assumptions

---

## Preservation Targets

### Notes

Preserve:

- grouped entry points
- list/detail split on desktop
- mobile list-to-detail behavior
- row density and metadata treatment
- focused editor experience

Rebuild against:

- canonical document rows
- canonical frontmatter parsing
- canonical content storage

### Tasks

Preserve:

- bucketed navigation
- chip-based filtering
- dense task rows
- scheduling affordances
- rich task detail sheet

Rebuild against:

- `action:task` documents
- canonical status and date fields

### Projects

Preserve:

- project list
- project detail sheet
- quick-add task flow
- grouped hierarchy behavior where still valid

Rebuild against:

- `action:project` documents
- shared action model with tasks

---

## Active Plan

## Chunk 0 - Freeze The Canonical Contract

**Goal:** Make the rebuild direction explicit so all future work follows the same architecture.

### Scope

- rewrite `PLANS.md`
- maintain the rebuild brief in `docs/_new/v1-rebuild-brief.md`
- document the canonical v1 direction before more implementation work lands

### Exit Conditions

- planning docs describe the same architecture
- old roadmap language is removed from the main plan
- future work can reference one current plan

### Verification

- manual doc review

### Status

- [x] completed

---

## Chunk 1 - Harden The New Document Core

**Goal:** Make the current document-model app surfaces stable enough to serve as the base for all future rebuild work.

### Focus Areas

- canonical `items` create/update helpers
- query invalidation consistency
- document editor save behavior
- Home, Command, Inbox, Actions, Writing, Reference, Document Detail coherence
- navigation restore for the new views

### Files Likely To Change

- `src/lib/db.ts`
- `src/lib/navigation/paths.ts`
- `src/App.tsx`
- `src/features/home/HomeView.tsx`
- `src/components/layout/CommandSheet/CommandSheet.tsx`
- `src/features/inbox/InboxListView.tsx`
- `src/features/documents/DocumentDetailView.tsx`
- `src/features/actions/ActionsView.tsx`
- `src/features/writing/WritingView.tsx`
- `src/features/reference/ReferenceView.tsx`

### Exit Conditions

- the new primary surfaces behave consistently on one schema
- refresh and direct navigation work for the new v1 views
- no active v1 path in this chunk relies on legacy helpers

### Verification

- `npm run type-check`
- `npm run lint`
- `npm run build`
- manual flow checks for:
  - sign in
  - daily note open/create
  - command capture to inbox
  - open document from recent/search
  - open inbox list
  - open actions/writing/reference

### Status

- [ ] next

---

## Chunk 2 - Rebuild Notes On The Canonical Model

**Goal:** Preserve the legacy notes UX structure while removing dependency on legacy tables and columns.

### Preserve

- overview to list to detail structure
- grouped note entry points
- mobile/desktop shell split
- editor-focused detail view

### Replace

- `item_content`
- `item_links`
- `item_versions`
- legacy note metadata assumptions

### Files Likely To Change

- `src/features/notes/**/*`
- `src/components/editor/**/*`
- `src/lib/documentRaw.ts`
- `src/lib/templates.ts`
- `src/lib/markdown/**/*`

### Exit Conditions

- notes list and detail are powered by the canonical document model
- the preserved notes UX remains recognizable
- no active note flow depends on dropped legacy tables

### Verification

- `npm run type-check`
- `npm run lint`
- `npm run build`
- manual note flow checks for:
  - open grouped notes views
  - open a note
  - edit and save
  - create from template
  - trash and restore behavior

### Status

- [ ] pending

---

## Chunk 3 - Rebuild Tasks As `action:task`

**Goal:** Preserve legacy task UX while moving task behavior onto canonical action documents.

### Preserve

- task buckets
- chip filters
- row density
- checkbox completion flow
- task detail sheet
- scheduling fields

### Replace

- `item_status`
- `is_someday`
- `is_waiting`
- other legacy task-only schema fields where they conflict with the new model

### Files Likely To Change

- `src/features/tasks/**/*`
- `src/features/actions/**/*`
- `src/lib/db.ts`
- `src/lib/templates.ts`

### Exit Conditions

- task list and detail work on canonical action documents
- today/upcoming/backlog/someday behavior is defined on the new model
- the UI preserves the current task feel

### Verification

- `npm run type-check`
- `npm run lint`
- `npm run build`
- manual task flow checks for:
  - create task
  - edit task
  - complete/uncomplete task
  - schedule task
  - move across filters

### Status

- [ ] pending

---

## Chunk 4 - Rebuild Projects As `action:project`

**Goal:** Preserve project list/detail UX while standardizing projects on the canonical action model.

### Preserve

- project list
- project detail sheet
- quick-add tasks inside project detail
- grouped/hierarchical presentation where still useful

### Files Likely To Change

- `src/features/projects/**/*`
- `src/features/actions/**/*`
- `src/features/tasks/**/*`

### Exit Conditions

- project list and project detail work on canonical documents
- project/task relationship is coherent with the rebuilt task model
- preserved project UX remains intact

### Verification

- `npm run type-check`
- `npm run lint`
- `npm run build`
- manual project flow checks for:
  - create project
  - edit project
  - quick-add task
  - open linked tasks from project context

### Status

- [ ] pending

---

## Chunk 5 - Rewrite Portability And Trust Features

**Goal:** Make personal data import/export/backup/restore trustworthy on the canonical schema.

### Focus Areas

- backup
- restore
- wipe
- markdown export
- markdown import

### Files Likely To Change

- `src/lib/backup.ts`
- `src/lib/exportNotes.ts`
- `src/lib/importNotes.ts`
- `src/features/settings/SettingsPage.tsx`

### Exit Conditions

- no portability feature depends on dropped legacy tables
- exported data reflects the canonical markdown document model
- restore behavior is understandable and safe

### Verification

- `npm run type-check`
- `npm run lint`
- `npm run build`
- manual checks for:
  - export a document set
  - re-import exported markdown
  - create backup
  - validate restore path on a test dataset

### Status

- [ ] pending

---

## Chunk 6 - Reassess Strategy After Core Stabilization

**Goal:** Keep strategy code hidden and out of the critical path until the core rebuild is stable.

### Rules

- strategy stays hidden by default
- no new strategy work until chunks 1-5 are stable
- strategy can be ported later only if it fits the canonical document model cleanly

### Exit Conditions

- strategy is clearly deprioritized without being deleted
- no core v1 decision is blocked by strategy work

### Verification

- manual review of visibility and routing behavior

### Status

- [ ] pending

---

## Chunk 7 - Remove Or Quarantine Remaining Legacy Paths

**Goal:** End the rebuild with one understandable architecture.

### Focus Areas

- delete dead code where safe
- isolate transitional code where immediate deletion is too risky
- remove stale docs
- remove legacy helpers that no longer serve the rebuilt app

### Exit Conditions

- active v1 code has one clear architectural story
- dead or misleading paths are no longer mixed into primary flows

### Verification

- `npm run type-check`
- `npm run lint`
- `npm run build`
- final manual architecture review

### Status

- [ ] pending

---

## Quality Gates

For any chunk that touches logic, routing, state, or data behavior:

- run `npm run type-check`
- run `npm run lint`
- run `npm run build`
- run or add tests when the behavior is failure-prone

For documentation-only chunks:

- manual review is acceptable

Current repo status:

- `type-check` passes
- `build` passes
- `lint` currently fails
- `test` currently has no test files

That means part of the rebuild path must include restoring meaningful quality gates.

---

## Risks To Watch

- preserving UX too literally and accidentally re-importing legacy schema assumptions
- mixing old and new task/project models during the transition
- rebuilding notes without first defining the canonical metadata contract
- leaving settings portability broken too late into the rebuild
- relying on stale docs instead of current code and migrations

---

## Immediate Working Rule

From this point forward:

- preserve legacy UX patterns
- rebuild on the new document model only
- move in small chunks
- verify every chunk
- do not widen scope silently
