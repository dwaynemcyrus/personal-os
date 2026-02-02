-- Add session grouping + unplanned labels for time entries

ALTER TABLE time_entries
  ADD COLUMN IF NOT EXISTS session_id UUID,
  ADD COLUMN IF NOT EXISTS label_normalized TEXT;

-- Drop old check constraints if they exist
ALTER TABLE time_entries
  DROP CONSTRAINT IF EXISTS time_entries_entry_type_check,
  DROP CONSTRAINT IF EXISTS time_entries_log_label_check;

-- Rename entry type values
UPDATE time_entries
SET entry_type = 'unplanned'
WHERE entry_type = 'log';

-- Backfill normalized labels for unplanned entries
UPDATE time_entries
SET label_normalized = lower(trim(label))
WHERE entry_type = 'unplanned'
  AND label IS NOT NULL
  AND label_normalized IS NULL;

-- Recreate constraints with new semantics
ALTER TABLE time_entries
  ADD CONSTRAINT time_entries_entry_type_check
    CHECK (entry_type IN ('planned', 'unplanned')),
  ADD CONSTRAINT time_entries_unplanned_label_check
    CHECK (
      entry_type <> 'unplanned'
      OR (
        label IS NOT NULL
        AND label_normalized IS NOT NULL
        AND length(trim(label_normalized)) > 0
      )
    );

CREATE INDEX IF NOT EXISTS idx_time_entries_session_id
  ON time_entries(session_id);

CREATE INDEX IF NOT EXISTS idx_time_entries_label_normalized
  ON time_entries(label_normalized);
