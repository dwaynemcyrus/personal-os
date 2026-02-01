-- Rename soft delete fields to trashed (Feb 1, 2026)

BEGIN;

-- Rename is_deleted -> is_trashed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sync_test' AND column_name = 'is_deleted'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sync_test' AND column_name = 'is_trashed'
  ) THEN
    ALTER TABLE sync_test RENAME COLUMN is_deleted TO is_trashed;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'is_deleted'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'is_trashed'
  ) THEN
    ALTER TABLE projects RENAME COLUMN is_deleted TO is_trashed;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'is_deleted'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'is_trashed'
  ) THEN
    ALTER TABLE tasks RENAME COLUMN is_deleted TO is_trashed;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notes' AND column_name = 'is_deleted'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notes' AND column_name = 'is_trashed'
  ) THEN
    ALTER TABLE notes RENAME COLUMN is_deleted TO is_trashed;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'habits' AND column_name = 'is_deleted'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'habits' AND column_name = 'is_trashed'
  ) THEN
    ALTER TABLE habits RENAME COLUMN is_deleted TO is_trashed;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'habit_completions' AND column_name = 'is_deleted'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'habit_completions' AND column_name = 'is_trashed'
  ) THEN
    ALTER TABLE habit_completions RENAME COLUMN is_deleted TO is_trashed;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_entries' AND column_name = 'is_deleted'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_entries' AND column_name = 'is_trashed'
  ) THEN
    ALTER TABLE time_entries RENAME COLUMN is_deleted TO is_trashed;
  END IF;
END $$;

-- Rename deleted_at -> trashed_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sync_test' AND column_name = 'deleted_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sync_test' AND column_name = 'trashed_at'
  ) THEN
    ALTER TABLE sync_test RENAME COLUMN deleted_at TO trashed_at;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'deleted_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'trashed_at'
  ) THEN
    ALTER TABLE projects RENAME COLUMN deleted_at TO trashed_at;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'deleted_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'trashed_at'
  ) THEN
    ALTER TABLE tasks RENAME COLUMN deleted_at TO trashed_at;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notes' AND column_name = 'deleted_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notes' AND column_name = 'trashed_at'
  ) THEN
    ALTER TABLE notes RENAME COLUMN deleted_at TO trashed_at;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'habits' AND column_name = 'deleted_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'habits' AND column_name = 'trashed_at'
  ) THEN
    ALTER TABLE habits RENAME COLUMN deleted_at TO trashed_at;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'habit_completions' AND column_name = 'deleted_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'habit_completions' AND column_name = 'trashed_at'
  ) THEN
    ALTER TABLE habit_completions RENAME COLUMN deleted_at TO trashed_at;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_entries' AND column_name = 'deleted_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_entries' AND column_name = 'trashed_at'
  ) THEN
    ALTER TABLE time_entries RENAME COLUMN deleted_at TO trashed_at;
  END IF;
END $$;

-- Backfill trashed_at when missing
UPDATE sync_test
  SET trashed_at = updated_at
  WHERE is_trashed = TRUE AND trashed_at IS NULL;

UPDATE projects
  SET trashed_at = updated_at
  WHERE is_trashed = TRUE AND trashed_at IS NULL;

UPDATE tasks
  SET trashed_at = updated_at
  WHERE is_trashed = TRUE AND trashed_at IS NULL;

UPDATE notes
  SET trashed_at = updated_at
  WHERE is_trashed = TRUE AND trashed_at IS NULL;

UPDATE habits
  SET trashed_at = updated_at
  WHERE is_trashed = TRUE AND trashed_at IS NULL;

UPDATE habit_completions
  SET trashed_at = updated_at
  WHERE is_trashed = TRUE AND trashed_at IS NULL;

UPDATE time_entries
  SET trashed_at = updated_at
  WHERE is_trashed = TRUE AND trashed_at IS NULL;

-- Rebuild indexes with new naming
DROP INDEX IF EXISTS idx_projects_is_deleted;
DROP INDEX IF EXISTS idx_tasks_is_deleted;
DROP INDEX IF EXISTS idx_notes_is_deleted;
DROP INDEX IF EXISTS idx_habits_is_deleted;
DROP INDEX IF EXISTS idx_habit_completions_is_deleted;
DROP INDEX IF EXISTS idx_time_entries_is_deleted;

CREATE INDEX IF NOT EXISTS idx_projects_is_trashed ON projects(is_trashed);
CREATE INDEX IF NOT EXISTS idx_tasks_is_trashed ON tasks(is_trashed);
CREATE INDEX IF NOT EXISTS idx_notes_is_trashed ON notes(is_trashed);
CREATE INDEX IF NOT EXISTS idx_habits_is_trashed ON habits(is_trashed);
CREATE INDEX IF NOT EXISTS idx_habit_completions_is_trashed ON habit_completions(is_trashed);
CREATE INDEX IF NOT EXISTS idx_time_entries_is_trashed ON time_entries(is_trashed);

COMMIT;
