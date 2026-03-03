# Forward — Codebase Issues & Improvements

> Reviewed on branch `feature/items-table` (2026-03-03).
> Issues are grouped by category and roughly ordered by severity within each section.

---

## 1. Bugs

### ~~1.1 Sync `DELETE` branch is dead code~~ ✓ fixed

---

### ~~1.2 `NoteList` shows inbox notes~~ ✓ fixed (deleted dead component)

---

### 1.3 `sync_rev` is never updated after a push
`src/lib/sync.ts:310`

`pushToSupabase` sends `revision: (doc.sync_rev ?? 0) + 1` to Supabase. But `sync_rev` on the local RxDB doc is never patched after a successful push, so every subsequent push for the same doc sends `revision: 1`. The revision counter is meaningless and conflict detection based on it will fail.

**Fix:** After a successful upsert, patch `sync_rev` on the local doc, or remove the revision field entirely if it isn't used for conflict resolution.

---

### 1.4 `nowLabel` / `nowIso` in `NowView` won't update across midnight
`src/App.tsx:80–91`

```ts
const nowLabel = useMemo(() => { ... }, []);
const nowIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
```

Both values are computed once on mount. If the app stays open past midnight, the date header and the today-note lookup remain stale.

**Fix:** Subscribe to a midnight boundary (e.g., `setTimeout` to the next midnight, or a clock hook) and recompute.

---

### 1.5 Console error SC34 (resolved in current commit, file left behind)
`tmp/console-error.md`

The file documents an `RxError SC34` ("indexed string field missing `maxLength`") for the `type` field. This is now fixed — `db.ts` sets `type: { type: 'string', maxLength: 20 }`. The tmp file should be deleted to avoid confusion.

---

## 2. Schema & Data Integrity

### 2.1 RLS policies are too permissive
`supabase/migrations/20260302000000_items_table.sql:186–195`

```sql
CREATE POLICY "authenticated_all" ON items FOR ALL TO authenticated USING (true);
```

Any authenticated user can read and write any row regardless of `owner`. For a personal-data app this is a security hole once the app is multi-user. All policies should be `USING (owner = auth.uid())` or `USING (owner IS NULL OR owner = auth.uid())`.

---

### 2.2 RxDB `items` schema lacks enum validation for common string fields
`src/lib/db.ts:229–230`

`item_status`, `priority`, `type`, `capture_source`, `content_type`, `read_status`, and `frequency` are stored as plain `{ type: 'string' }` in the RxDB JSON schema. `item_versions.created_by` and `time_entries.entry_type` do have enum arrays. The inconsistency means invalid values can be written to IndexedDB and only caught by Zod at the app layer.

**Fix:** Add `enum` arrays to these fields in the RxDB JSON schema to mirror the Zod constraints.

---

### 2.3 Migration strategy for `items` collection is dead code
`src/lib/db.ts:395–397`

```ts
const itemsMigrationStrategies = {
  1: (oldDoc) => migrateSyncV2Fields(oldDoc),
};
```

The `items` collection is brand-new in this branch — there is no pre-existing version 0 to migrate from. This strategy will never execute and is misleading.

**Fix:** Remove `itemsMigrationStrategies` and the `migrationStrategies` key from the `items` collection definition.

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
| `supabase/migrations/…_items_table.sql:186` | Policy names are identical across all tables (`"authenticated_all"`); consider prefixing with table name for clarity |
