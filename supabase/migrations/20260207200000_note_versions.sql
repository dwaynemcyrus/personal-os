-- Note versions table for version history
CREATE TABLE note_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  content TEXT,
  properties JSONB,
  version_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by TEXT NOT NULL DEFAULT 'auto', -- 'auto' or 'manual'
  change_summary TEXT,
  is_trashed BOOLEAN DEFAULT FALSE NOT NULL,
  trashed_at TIMESTAMPTZ
);

-- Indexes for efficient querying
CREATE INDEX idx_note_versions_note_id ON note_versions(note_id);
CREATE INDEX idx_note_versions_created_at ON note_versions(created_at DESC);
CREATE INDEX idx_note_versions_note_version ON note_versions(note_id, version_number DESC);

-- Enable RLS
ALTER TABLE note_versions ENABLE ROW LEVEL SECURITY;

-- RLS policies (allow all for now, can be restricted later)
CREATE POLICY "Allow all operations on note_versions"
  ON note_versions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add updated_at trigger
CREATE TRIGGER update_note_versions_updated_at
  BEFORE UPDATE ON note_versions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
