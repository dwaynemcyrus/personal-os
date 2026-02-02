-- Add status field for tasks

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'backlog' NOT NULL;

-- Normalize legacy values
UPDATE tasks
SET status = 'next'
WHERE status = 'active';

UPDATE tasks
SET status = 'backlog'
WHERE completed = true;

UPDATE tasks
SET status = 'backlog'
WHERE status IS NULL
  OR status NOT IN ('backlog', 'waiting', 'next');

-- Enforce allowed values
ALTER TABLE tasks
  DROP CONSTRAINT IF EXISTS tasks_status_check,
  ADD CONSTRAINT tasks_status_check
    CHECK (status IN ('backlog', 'waiting', 'next'));

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
