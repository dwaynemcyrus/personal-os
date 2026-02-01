-- Add entry_type + label support for planned vs log time entries

ALTER TABLE time_entries
  ADD COLUMN IF NOT EXISTS entry_type TEXT,
  ADD COLUMN IF NOT EXISTS label TEXT;

UPDATE time_entries
SET entry_type = 'planned'
WHERE entry_type IS NULL;

ALTER TABLE time_entries
  ADD CONSTRAINT time_entries_entry_type_check
    CHECK (entry_type IN ('planned', 'log')),
  ADD CONSTRAINT time_entries_log_label_check
    CHECK (entry_type <> 'log' OR (label IS NOT NULL AND length(trim(label)) > 0));

ALTER TABLE time_entries
  ALTER COLUMN entry_type SET NOT NULL,
  ALTER COLUMN entry_type SET DEFAULT 'planned';

CREATE INDEX IF NOT EXISTS idx_time_entries_entry_type
  ON time_entries(entry_type);
