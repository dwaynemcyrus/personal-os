-- Add properties JSONB column to notes table
ALTER TABLE notes ADD COLUMN IF NOT EXISTS properties JSONB DEFAULT NULL;

-- Create note_links table for wiki-link tracking
CREATE TABLE IF NOT EXISTS note_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  target_id UUID REFERENCES notes(id) ON DELETE SET NULL,
  target_title TEXT NOT NULL,
  header TEXT DEFAULT NULL,
  alias TEXT DEFAULT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_trashed BOOLEAN DEFAULT FALSE,
  trashed_at TIMESTAMPTZ DEFAULT NULL
);

-- Indexes for note_links
CREATE INDEX IF NOT EXISTS idx_note_links_source_id ON note_links(source_id);
CREATE INDEX IF NOT EXISTS idx_note_links_target_id ON note_links(target_id) WHERE target_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_note_links_is_trashed ON note_links(is_trashed);

-- Enable RLS on note_links
ALTER TABLE note_links ENABLE ROW LEVEL SECURITY;

-- Allow all operations (single user MVP)
CREATE POLICY "Allow all operations" ON note_links FOR ALL USING (true) WITH CHECK (true);
