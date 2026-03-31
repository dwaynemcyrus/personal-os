-- Migration: canonical item history table

CREATE TABLE item_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  snapshot text NOT NULL,
  snapshot_format text NOT NULL DEFAULT 'raw_markdown',
  created_by text NOT NULL,
  change_summary text,
  source_updated_at timestamptz,
  is_trashed boolean NOT NULL DEFAULT false,
  trashed_at timestamptz,
  owner uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT item_history_snapshot_format_check
    CHECK (snapshot_format IN ('raw_markdown')),
  CONSTRAINT item_history_created_by_check
    CHECK (created_by IN ('auto', 'manual', 'restore_guard'))
);

CREATE INDEX item_history_item_id_created_at_idx
  ON item_history(item_id, created_at DESC);

CREATE INDEX item_history_owner_created_at_idx
  ON item_history(owner, created_at DESC);

ALTER TABLE item_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "item_history_owner" ON item_history FOR ALL TO authenticated
  USING (owner = auth.uid()) WITH CHECK (owner = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE item_history;
