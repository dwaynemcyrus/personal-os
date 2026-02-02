-- Add status and dates to projects

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'backlog' NOT NULL,
  ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;

-- Normalize existing rows
UPDATE projects
SET status = 'backlog'
WHERE status IS NULL
  OR status NOT IN ('backlog', 'next', 'active', 'hold');

-- Enforce allowed values
ALTER TABLE projects
  DROP CONSTRAINT IF EXISTS projects_status_check,
  ADD CONSTRAINT projects_status_check
    CHECK (status IN ('backlog', 'next', 'active', 'hold'));

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_due_date ON projects(due_date);
