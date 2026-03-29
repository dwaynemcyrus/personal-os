-- Migration: consolidate schema — rename documents → items, drop legacy tables
--
-- Before:  documents (new schema), items (old schema), item_content,
--          item_versions, item_links, tags
-- After:   items (new schema, formerly documents), time_entries, user_settings,
--          habit_logs, finance_entries
--
-- habit_logs.habit_id and finance_entries.finance_id reference documents(id).
-- Postgres automatically retargets those FKs on rename — no manual work needed.
--
-- time_entries.item_id referenced the OLD items(id). Dropping old items CASCADE
-- removes that FK. We re-add it pointing to the renamed table.

-- ── 1. Drop unused legacy tables ──────────────────────────────────────────────

DROP TABLE IF EXISTS item_content  CASCADE;
DROP TABLE IF EXISTS item_versions CASCADE;
DROP TABLE IF EXISTS item_links    CASCADE;
DROP TABLE IF EXISTS tags          CASCADE;

-- ── 2. Drop old items table ───────────────────────────────────────────────────

DROP TABLE IF EXISTS items CASCADE;

-- ── 3. Rename documents → items ───────────────────────────────────────────────

ALTER TABLE documents RENAME TO items;

ALTER INDEX IF EXISTS documents_type_idx          RENAME TO items_type_idx;
ALTER INDEX IF EXISTS documents_type_subtype_idx  RENAME TO items_type_subtype_idx;
ALTER INDEX IF EXISTS documents_status_idx        RENAME TO items_status_idx;
ALTER INDEX IF EXISTS documents_owner_idx         RENAME TO items_owner_idx;
ALTER INDEX IF EXISTS documents_date_trashed_idx  RENAME TO items_date_trashed_idx;
ALTER INDEX IF EXISTS documents_end_date_idx      RENAME TO items_end_date_idx;
ALTER INDEX IF EXISTS documents_updated_at_idx    RENAME TO items_updated_at_idx;

ALTER POLICY "documents_owner" ON items RENAME TO "items_owner";

-- ── 4. Restore time_entries FK ────────────────────────────────────────────────

ALTER TABLE time_entries
  ADD CONSTRAINT time_entries_item_id_fkey
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL;

-- ── 5. Realtime publication ───────────────────────────────────────────────────
-- Table rename preserves the OID so the existing publication entry carries over.
-- Explicitly add in case it doesn't appear under the new name.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE items;
  END IF;
END $$;
