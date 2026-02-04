ALTER TABLE notes
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_notes_is_pinned_updated_at
  ON notes (is_pinned DESC, updated_at DESC, id ASC);
