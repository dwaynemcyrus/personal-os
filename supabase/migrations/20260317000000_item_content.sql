-- item_content table: separates note body text from item metadata
-- so list queries never load full content into memory

CREATE TABLE item_content (
  item_id    UUID PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
  content    TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  owner      UUID REFERENCES auth.users(id)
);

ALTER TABLE item_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "item_content_owner" ON item_content FOR ALL TO authenticated
  USING (owner = auth.uid()) WITH CHECK (owner = auth.uid());

-- Backfill from items.content
INSERT INTO item_content (item_id, content, updated_at, owner)
SELECT id, content, updated_at, owner FROM items WHERE content IS NOT NULL
ON CONFLICT (item_id) DO NOTHING;

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE item_content;

-- has_todos flag on items (avoids scanning content for todo items in list queries)
ALTER TABLE items ADD COLUMN IF NOT EXISTS has_todos BOOLEAN DEFAULT false;

-- Backfill has_todos from item_content
UPDATE items i
SET has_todos = true
FROM item_content ic
WHERE ic.item_id = i.id
  AND ic.content LIKE '%- [ ]%';

-- RPC to fetch all note group counts in one round-trip
CREATE OR REPLACE FUNCTION get_note_counts()
RETURNS json
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT json_build_object(
    'all',    (SELECT COUNT(*) FROM items WHERE type='note' AND is_trashed=false AND inbox_at IS NULL AND owner=auth.uid()),
    'today',  (SELECT COUNT(*) FROM items WHERE type='note' AND is_trashed=false AND inbox_at IS NULL AND owner=auth.uid() AND (updated_at::date >= CURRENT_DATE OR created_at::date >= CURRENT_DATE)),
    'todo',   (SELECT COUNT(*) FROM items WHERE type='note' AND is_trashed=false AND inbox_at IS NULL AND owner=auth.uid() AND has_todos=true),
    'pinned', (SELECT COUNT(*) FROM items WHERE type='note' AND is_trashed=false AND inbox_at IS NULL AND owner=auth.uid() AND is_pinned=true),
    'trash',  (SELECT COUNT(*) FROM items WHERE type='note' AND is_trashed=true AND owner=auth.uid())
  );
$$;
