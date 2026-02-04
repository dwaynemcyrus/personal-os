ALTER TABLE notes ADD COLUMN IF NOT EXISTS note_type TEXT DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_notes_note_type ON notes(note_type) WHERE note_type IS NOT NULL;
