# Forward — Codebase Issues & Improvements

> Reviewed on branch `feature/items-table` (2026-03-03).
> Issues are grouped by category and roughly ordered by severity within each section.

---

## 1. Bugs

### ~~1.1 Sync `DELETE` branch is dead code~~ ✓ fixed

---

### ~~1.2 `NoteList` shows inbox notes~~ ✓ fixed (deleted dead component)

---

### ~~1.3 `sync_rev` is never updated after a push~~ ✓ fixed (field removed)

---

### ~~1.4 `nowLabel` / `nowIso` in `NowView` won't update across midnight~~ ✓ fixed

### ~~1.5 Console error SC34 (resolved in current commit, file left behind)~~ ✓ fixed

---

## 2. Schema & Data Integrity

### ~~2.1 RLS policies are too permissive~~ ✓ fixed

---

### ~~2.2 RxDB `items` schema lacks enum validation for common string fields~~ ✓ fixed

---

### ~~2.3 Migration strategy for `items` collection is dead code~~ ✓ fixed

---

### 2.4 `trashed_at` is required but semantically optional
`src/lib/db.ts:207–213`

`trashed_at` is in `baseRequired`, forcing every insert to supply `trashed_at: null`. Logically, a newly created doc is not trashed and shouldn't need this field at all. Making it required-but-null creates noise in every insert call.

**Fix:** Remove `trashed_at` from `baseRequired`; it is already nullable and can default to absent.

---

### 2.5 `tags` table not updated in new migration
`supabase/migrations/20260302000000_items_table.sql`

The migration drops all old domain tables and creates new ones, but `tags` is described as "kept as independent catalog" with no changes applied. The sync code includes `tags` in `collectionNames` and expects the `deleted` column to exist (used by `deletedField: 'deleted'`). If the previous migration (`20260227000000_sync_v2_fields.sql`) didn't add this column, syncing tags will fail. Realtime for `tags` is also not enabled in the new migration.

**Fix:** Verify the tags table has `deleted boolean NOT NULL DEFAULT false` and is added to the Realtime publication.

---

### 2.6 Missing RxDB indexes for common query patterns
`src/lib/db.ts:289–293`

The only indexes on `items` are `type` and `['type', 'is_trashed']`. Several high-frequency queries have no index support:

- `inbox_at: { $ne: null }` — used by inbox, NowView, InboxWizard
- `is_pinned: true` — used by workbench subscription and notes list sort
- `item_id` in `item_versions` and `time_entries` — these collections have no indexes at all

**Fix:** Add indexes: `['type', 'is_trashed', 'inbox_at']` for inbox queries; `item_id` on `item_versions` (already declared) and `time_entries`.

---

## 3. Code Duplication (DRY)

### 3.1 `nowIso` defined in five files

```ts
const nowIso = () => new Date().toISOString();
```

Appears in `App.tsx`, `NoteList.tsx`, `NotesList.tsx`, `TaskList.tsx`, `ProjectList.tsx`, `ContextSheet.tsx`, `NoteEditor.tsx`, `noteLinks.ts`. Should live once in `src/lib/time.ts` and be imported.

---

### 3.2 `isTodayNote` and `isTodoNote` duplicated

`src/features/notes/hooks/useGroupedNotes.ts:7–15`
`src/features/notes/hooks/useNoteGroupCounts.ts:6–14`

Both files define identical `isTodayNote` and `isTodoNote` functions. These belong in `src/features/notes/noteUtils.ts`.

---

### 3.3 Note-creation logic duplicated in `NoteList` and `NotesList`

`src/features/notes/NoteList/NoteList.tsx:55–79`
`src/features/notes/NotesList/NotesList.tsx:40–65`

Both components have identical `handleCreateNote` implementations (same fields, same defaults). Should be extracted to `useCreateNote()` or a shared helper.

---

### 3.4 Inline SVG icons scattered across files

`CloseIcon`, `GearIcon` in `App.tsx`; `BackIcon`, `PlusIcon` in `NotesList.tsx`. A shared `src/components/ui/Icon` directory or `src/components/ui/icons.tsx` would prevent icon definitions from living in feature-level files.

---

## 4. Architecture & Design

### ~~4.1 `NoteList` and `NotesList` are two confusingly named components~~ ✓ fixed (deleted dead component)

---

### 4.2 InboxWizard opened via global `CustomEvent`
`src/App.tsx:77`

```ts
window.dispatchEvent(new CustomEvent('inbox-wizard:open'));
```

This bypasses the navigation context entirely. The InboxWizard is already prop-driven (`open`, `onOpenChange`). The trigger should go through navigation state or a shared UI state hook, not a global event bus.

---

### 4.3 `useDatabase` called per-component instead of via context

Every component that needs the database calls `useDatabase()`, each maintaining its own `db` and `isReady` state. Since `getDatabase()` is a singleton, the DB is shared, but the ready-state check is duplicated across dozens of components. A `DatabaseContext` provider would centralize this and allow components to simply call `useDb()`.

---

### 4.4 `useIsDesktop` defined inline in `App.tsx`
`src/App.tsx:19–29`

This media-query hook is general-purpose and should live in `src/hooks/useIsDesktop.ts`.

---

### 4.5 `PlansView` is an inline placeholder in the top-level app file
`src/App.tsx:37–44`

Plans is a planned feature. The placeholder lives in `App.tsx` and should at minimum be moved to `src/features/plans/PlansView.tsx` to establish the correct file structure now.

---

### 4.6 Online resync pushes every document regardless of modification
`src/lib/sync.ts:281–291`

```ts
window.addEventListener('online', async () => {
  const allDocs = await collection.find().exec();
  for (const doc of allDocs) { await pushToSupabase(...) }
});
```

When connectivity is restored, every document across every collection is re-pushed to Supabase unconditionally. For large collections this is slow and creates unnecessary write load. The listener also accumulates on each `setupSync` call if the guard were ever bypassed.

**Fix:** Track a `last_synced_at` watermark and only push docs modified after the last successful sync. Also clean up the listener on teardown.

---

## 5. Performance

### 5.1 `getTaskBucketCounts` calls `getWindow()` six times per task
`src/features/tasks/taskBuckets.ts:188–200`

`getTaskBucketCounts` calls `matchesTaskFilter` six times per task; each invocation re-runs `getWindow()` which creates `new Date()` objects. For a task list with hundreds of tasks this adds up.

**Fix:** Call `getWindow()` once before the loop and pass the result into a version of `matchesTaskFilter` that accepts pre-computed window bounds.

---

### 5.2 `countVersions` loads all version documents to count
`src/lib/versions.ts:181–191`

All version documents are fetched into memory just to return `versions.length`. RxDB on Dexie supports `count()` queries — use that instead.

---

### 5.3 `syncNoteLinks` fetches all notes on every save
`src/lib/noteLinks.ts:32–40`

Every time a note is saved, `syncNoteLinks` fetches every non-trashed note to build a title→id map. This is O(n notes) per save. Consider caching the title map or only re-fetching when note titles change.

---

### 5.4 `useGroupedNotes` 'today' and 'todo' groups load all active notes
`src/features/notes/hooks/useGroupedNotes.ts:35–58`

Both groups subscribe to all non-trashed, non-inbox notes and filter in JavaScript. For 'todo' in particular, a cheaper approach would be an RxDB query with a regex or content filter if supported, or limit the subscription.

---

## 6. Incomplete / Unfinished Features

### 6.1 Locked notes not implemented
`src/features/notes/hooks/useGroupedNotes.ts:29–33`
`src/features/notes/NotesList/NotesList.tsx:70–73`

The 'locked' group always returns an empty array and shows a toast. Either implement the feature or remove the group from the UI until ready.

---

### 6.2 Plans view is a placeholder
`src/App.tsx:37–44`

The Plans navigation layer resolves to "Plans view coming soon." Establish the file structure and remove the string.

---

### 6.3 Workbench 4-note limit is copy-only, not enforced
`src/App.tsx:313`

The UI reads "Add 4 Notes Max" but no code enforces this. Users can pin any number of notes and the workbench will grow unbounded.

**Fix:** Enforce `is_pinned` can only be toggled on when `workbenchNotes.length < 4`, or remove the copy.

---

### 6.4 `findUnlinkedMentions`, `getBacklinks`, `getOutgoingLinks` have no UI
`src/lib/noteLinks.ts:103–254`

These three functions are fully implemented but not surfaced anywhere in the UI. They load all notes and do O(n) scans. Either build the backlinks/unlinked-mentions panel, or mark the functions clearly as `// TODO: unused — backlinks panel not yet built` to avoid future confusion.

---

## 7. Minor / Housekeeping

| File | Issue |
|------|-------|
| `src/hooks/useDatabase.ts:1–2` | Two leading blank lines before imports |
| `tmp/console-error.md` | Stale debug file should be deleted or gitignored |
| `src/App.tsx:191` | `'Your Workbench Empty'` — grammatically should be `'Your Workbench Is Empty'` |
| `src/lib/versions.ts:23–28` | `shouldAutoSaveVersion` can be simplified: `return now - (lastVersionSaveByNote.get(noteId) ?? 0) > AUTO_SAVE_INTERVAL_MS` |
| `src/features/tasks/taskBuckets.ts:68` | `getWindow()` is called in every `matchesTaskFilter` call — hoist to module-level or memoize per-render |
| ~~`supabase/migrations/…_items_table.sql:186`~~ | ~~Policy names are identical across all tables~~ ✓ fixed |
