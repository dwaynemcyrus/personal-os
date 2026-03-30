# V1 Rebuild Brief

## Purpose

This document captures:

- what the application is today
- what is currently broken or structurally unsafe
- what must be preserved from the legacy product
- what v1 will standardize on
- how to rebuild in very small chunks without losing desired behavior

This is the working brief for completing v1.

---

## Final V1 Direction

V1 will fully standardize on the new document model:

- one canonical `items` table using the new markdown-first document schema
- direct Supabase reads and writes against that schema
- raw markdown plus frontmatter as the document editing model
- no dependency on the legacy `item_content`, `item_links`, `item_versions`, or `tags` tables
- no dependency on legacy `is_trashed`, `item_status`, `inbox_at`, `filename`, or `has_todos` columns

We are not preserving the legacy data model.

We are preserving the structural UI/UX patterns from legacy notes, tasks, and projects.

---

## Design Basis To Preserve

The visual and interaction basis for v1 should build from the `ContextSheet` system and its surrounding surfaces:

- fonts
- color direction
- chip/filter treatment
- spacing rhythm
- row layouts
- sheet layouts
- list-to-detail interaction model

This means the rebuild should keep the feel of the existing product, especially:

- Notes:
  overview/list/detail structure, grouped entry points, lightweight row metadata, focused editor flow
- Tasks:
  filter chips, dense actionable rows, task detail sheet structure, scheduling/status affordances
- Projects:
  project list, grouped hierarchy, project detail sheet, quick-add task flow inside project detail

We are preserving UX structure, not the legacy backend contract.

---

## What The App Is Today

The live app is currently a Vite single-page app with:

- React 19
- Supabase auth and data access
- React Query
- stack-based in-app navigation
- PWA build via Vite

The current runtime truth is in:

- `src/main.tsx`
- `src/App.tsx`
- `src/lib/navigation/*`
- `vite.config.ts`

The README and several older docs still describe a Next.js + RxDB architecture, but that is no longer the actual runtime shape of the app.

---

## What Already Works In The New Model

These parts are already aligned with the new document-centric direction:

- Home entry surface
- Daily note create/open flow
- Command sheet capture into inbox documents
- generic document creation helpers
- generic document detail editor
- Actions view shell
- Writing view shell
- Reference view shell
- Inbox list shell

These are the strongest foundations for v1 and should remain the center of the rebuild.

---

## Primary Structural Problem

The codebase is currently split between two worlds:

1. New document-model code
   - uses the new `items` schema
   - treats documents as markdown-first rows
   - powers Home, Command, Document Detail, Actions, Writing, Reference, Inbox

2. Legacy feature code
   - still expects old `items` columns and companion tables
   - still depends on `item_content`, `item_links`, `item_versions`, `tags`
   - still powers large parts of notes, tasks, projects, strategy, backup/import/export

The latest schema migrations explicitly drop the legacy companion tables and replace old `items` with the new schema. That means the legacy feature layer is not a safe base for v1 completion.

This is the central issue to fix.

---

## What Is Broken Or Unsafe

### 1. Legacy feature surfaces are tied to removed schema

Large parts of:

- notes
- tasks
- projects
- strategy
- settings backup/restore/import/export

still rely on the old schema shape.

That creates runtime failure risk and makes the codebase hard to reason about.

### 2. Documentation is out of sync with the actual app

Several docs still describe:

- Next.js routing
- RxDB as the active source of truth
- custom sync layers that no longer exist

This is dangerous because it points implementation work at the wrong architecture.

### 3. Quality gates are incomplete

Current validation state:

- `npm run type-check` passes
- `npm run build` passes
- `npm run lint` fails
- `npm run test` fails because there are no tests

So the app can compile, but it is not protected by reliable linting or tests yet.

### 4. Navigation restoration is only partially wired

The stack navigator can generate paths for several new v1 views, but path restoration does not fully map them back in. This makes refresh/deep-link behavior incomplete for the new surfaces.

### 5. Some globally referenced UI systems are no longer integrated

The repository still contains capture, inbox wizard, context sheet, source detail, project detail, and other legacy interaction systems that are not the main mounted path for the app anymore.

Some of them should be preserved as patterns.
Some should be retired.
Right now they are intermixed.

---

## What Must Be Preserved From Legacy

These are the important legacy assets to keep during the rebuild.

### Notes UX to preserve

- grouped entry points
- list/detail split on desktop
- mobile list to detail transition
- note row density and metadata style
- focused markdown editing flow
- filename/properties style where it still makes sense in the new model
- backlinks/version/template concepts, but only if rebuilt on the canonical schema

### Tasks UX to preserve

- task bucket navigation and chip-based filtering
- clear differentiation of today, upcoming, backlog, someday, waiting, logbook
- fast row-level completion
- rich task detail sheet
- scheduling fields and date pickers
- parent linking to projects or higher-order containers

### Projects UX to preserve

- project list as a first-class view
- grouped/project hierarchy structure
- project detail sheet
- quick-add tasks inside project detail
- project metadata editing in place

### Structural shell patterns to preserve

- `ContextSheet` visual language
- sheet presentation style
- chip controls
- row sizing and spacing
- existing typography and color behavior where it already feels intentional

---

## What Should Not Be Preserved

These should not survive into the finished v1 architecture:

- legacy data helpers as canonical write paths
- split content storage assumptions built around `item_content`
- dependence on dropped tables
- duplicate implementations of the same concept across old and new systems
- old architecture assumptions copied forward from stale docs
- rebuilding on top of schema compatibility shims

V1 should converge, not accumulate more adapters.

---

## Rebuild Principles

### 1. Standardize on one canonical model first

Before rebuilding feature depth, define and enforce the new canonical `items` document contract in code.

This includes:

- shared TypeScript types
- shared create/update helpers
- frontmatter mapping rules
- canonical status/type/subtype conventions

### 2. Port UX patterns, not legacy table assumptions

When preserving notes/tasks/projects, preserve:

- interaction patterns
- visual structure
- information hierarchy

Do not preserve:

- old field names
- old table layout
- old write helpers

### 3. Work in very small chunks

Each chunk should:

- have one clear goal
- touch a narrow set of files
- have explicit verification
- leave the app in a working state

Avoid broad refactors.
Avoid mixed migrations.
Avoid partial concept rewrites across many surfaces at once.

### 4. Finish one canonical path before duplicating it elsewhere

For example:

- define canonical action documents first
- port task/project UI onto that model second
- remove legacy task/project dependency paths after the new path is proven

### 5. Keep the app usable throughout

The rebuild should keep the main shell working at every step:

- auth
- home
- command sheet
- inbox
- document detail

Those are the stability anchors.

---

## Recommended Chunk Sequence

### Chunk 0. Freeze the canonical architecture in docs and types

Goal:
Document the v1 data contract and stop further drift.

Do:

- document the canonical `items`-based model
- define the allowed document types/subtypes/status values for v1
- mark legacy tables and helpers as transitional only

Why:
Without this, the rebuild will keep mixing old and new assumptions.

### Chunk 1. Harden the new document core

Goal:
Make Home, Command, Inbox, Document Detail, Actions, Writing, and Reference the unquestionably correct v1 foundation.

Do:

- normalize create/update helpers
- tighten query keys and invalidation
- complete navigation restore for new views
- verify command capture and daily note flows

Why:
This gives the rebuild a reliable core before porting preserved UX from legacy features.

### Chunk 2. Rebuild Notes on the canonical model

Goal:
Preserve the legacy notes UX structure while moving fully onto the new document schema.

Do:

- rebuild grouped notes overview/list/detail against the canonical `items` fields
- decide which note-only metadata survives in frontmatter vs promoted columns
- rebuild editor affordances only if they can work on the new schema

Why:
Notes are high-value and currently deeply entangled with dropped tables.

### Chunk 3. Rebuild Tasks as action documents

Goal:
Preserve the current task UX while standardizing tasks as `action:task` documents.

Do:

- map task buckets onto canonical fields
- port task list and task detail sheet
- preserve scheduling/status behavior
- preserve completion flow and row density

Why:
The current task UI is worth keeping, but the underlying contract is legacy.

### Chunk 4. Rebuild Projects as action documents

Goal:
Preserve project list/detail UX while standardizing projects as `action:project` documents.

Do:

- port project list
- port project detail sheet
- preserve quick-add task flow
- preserve hierarchy/grouping behavior where it still fits the new model

Why:
Projects and tasks should share one coherent action model.

### Chunk 5. Rewrite settings portability features

Goal:
Make import/export/backup/restore trustworthy again.

Do:

- rebuild backup/restore around the canonical schema
- rebuild note export/import around canonical markdown documents
- remove references to dropped tables

Why:
For a personal system, portability and trust are part of v1.

### Chunk 6. Reassess strategy preservation

Goal:
Keep strategy code only if it can be cleanly ported after the core rebuild.

Do:

- leave strategy hidden by default
- preserve code in place
- only resume strategy work once document, notes, tasks, projects, and settings are stable

Why:
Strategy is valuable, but it is not on the critical path for a trustworthy daily driver.

### Chunk 7. Remove or isolate remaining legacy paths

Goal:
End with one understandable architecture.

Do:

- delete dead paths or clearly quarantine them
- remove stale docs
- remove schema shims that are no longer needed

Why:
A clean v1 cannot depend on ambiguous transitional layers.

---

## Success Criteria For The Rebuild

The rebuild is successful when:

- the app uses one canonical data model
- preserved UX from notes, tasks, and projects is clearly visible in the rebuilt product
- no active v1 surface depends on dropped legacy tables
- import/export/backup flows are trustworthy
- lint passes
- tests exist for the most failure-prone core flows
- the codebase reads as one coherent system, not two competing generations

---

## Immediate Working Rule

From this point forward:

- use the new document model as the source of truth
- preserve legacy UI structure deliberately
- do not preserve legacy schema assumptions
- land work in small, verifiable chunks

That is the safest path to a clean v1 rebuild.
