# Database Schema

Single source of truth for all tables and collections.

**Last updated:** February 1, 2026

---

## Supabase Tables

All tables follow these conventions:
- Primary key: `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
- Timestamps: `created_at` and `updated_at` (auto-updated via trigger)
- Soft delete: `is_trashed BOOLEAN DEFAULT FALSE` + `trashed_at TIMESTAMPTZ DEFAULT NULL`

---

### sync_test

**Purpose:** Proof of concept for sync functionality
```sql
CREATE TABLE sync_test (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_trashed BOOLEAN DEFAULT FALSE,
  trashed_at TIMESTAMPTZ DEFAULT NULL
);
```

---

### projects

**Purpose:** Top-level organizational units for tasks
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'backlog',
  start_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_trashed BOOLEAN DEFAULT FALSE,
  trashed_at TIMESTAMPTZ DEFAULT NULL
);
```

**Indexes:**
```sql
CREATE INDEX idx_projects_is_trashed ON projects(is_trashed);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_due_date ON projects(due_date);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
```

---

### tasks

**Purpose:** Actionable items, optionally linked to projects
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'backlog',
  completed BOOLEAN DEFAULT FALSE,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_trashed BOOLEAN DEFAULT FALSE,
  trashed_at TIMESTAMPTZ DEFAULT NULL
);
```

**Indexes:**
```sql
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_is_trashed ON tasks(is_trashed);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
```

---

### notes

**Purpose:** Long-form written content
```sql
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT,
  inbox_at TIMESTAMPTZ DEFAULT NULL,
  note_type TEXT DEFAULT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_trashed BOOLEAN DEFAULT FALSE,
  trashed_at TIMESTAMPTZ DEFAULT NULL
);
```

**Indexes:**
```sql
CREATE INDEX idx_notes_is_trashed ON notes(is_trashed);
CREATE INDEX idx_notes_updated_at ON notes(updated_at DESC);
CREATE INDEX idx_notes_is_pinned_updated_at ON notes(is_pinned DESC, updated_at DESC, id ASC);
```

---

### habits

**Purpose:** Recurring behaviors to track
```sql
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_trashed BOOLEAN DEFAULT FALSE,
  trashed_at TIMESTAMPTZ DEFAULT NULL
);
```

**Indexes:**
```sql
CREATE INDEX idx_habits_is_trashed ON habits(is_trashed);
```

---

### habit_completions

**Purpose:** Daily check-ins for habits
```sql
CREATE TABLE habit_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_trashed BOOLEAN DEFAULT FALSE,
  trashed_at TIMESTAMPTZ DEFAULT NULL,
  UNIQUE(habit_id, completed_date)
);
```

**Indexes:**
```sql
CREATE INDEX idx_habit_completions_habit_id ON habit_completions(habit_id);
CREATE INDEX idx_habit_completions_date ON habit_completions(completed_date DESC);
CREATE INDEX idx_habit_completions_is_trashed ON habit_completions(is_trashed);
```

**Notes:**
- UNIQUE constraint prevents duplicate completions per day
- CASCADE delete removes completions when habit is deleted

---

### time_entries

**Purpose:** Track time spent on tasks
```sql
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  session_id UUID,
  entry_type TEXT NOT NULL DEFAULT 'planned' CHECK (entry_type IN ('planned', 'unplanned')),
  label TEXT,
  label_normalized TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  stopped_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_trashed BOOLEAN DEFAULT FALSE,
  trashed_at TIMESTAMPTZ DEFAULT NULL,
  CONSTRAINT time_entries_unplanned_label_check
    CHECK (
      entry_type <> 'unplanned'
      OR (label IS NOT NULL AND label_normalized IS NOT NULL)
    )
);
```

**Indexes:**
```sql
CREATE INDEX idx_time_entries_task_id ON time_entries(task_id);
CREATE INDEX idx_time_entries_entry_type ON time_entries(entry_type);
CREATE INDEX idx_time_entries_session_id ON time_entries(session_id);
CREATE INDEX idx_time_entries_label_normalized ON time_entries(label_normalized);
CREATE INDEX idx_time_entries_started_at ON time_entries(started_at DESC);
CREATE INDEX idx_time_entries_is_trashed ON time_entries(is_trashed);
```

**Notes:**
- `stopped_at` is NULL for active timers
- `duration_seconds` calculated on stop
- `entry_type` is `planned` for task-linked entries and `unplanned` for unplanned activity
- `label` and `label_normalized` are required for `unplanned` entries
- `session_id` groups pause/resume segments

---

## Triggers

Auto-update `updated_at` timestamp:
```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER sync_test_updated_at
  BEFORE UPDATE ON sync_test
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER habits_updated_at
  BEFORE UPDATE ON habits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER habit_completions_updated_at
  BEFORE UPDATE ON habit_completions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER time_entries_updated_at
  BEFORE UPDATE ON time_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## Row Level Security (RLS)

**MVP:** Allow all operations (single user)
```sql
-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_test ENABLE ROW LEVEL SECURITY;

-- Allow all operations (single user)
CREATE POLICY "Allow all operations" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON habits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON habit_completions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON time_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON sync_test FOR ALL USING (true) WITH CHECK (true);
```

**Future:** When adding multi-user support, update policies to:
```sql
CREATE POLICY "Users see own data" ON projects
  FOR ALL USING (user_id = auth.uid());
```

---

## RxDB Collections

Each Supabase table has a matching RxDB collection defined in `src/lib/db.ts`.

**Schema requirements:**
- Must match Supabase columns exactly
- Primary key must be `id` (string, UUID format)
- All fields must specify type
- Use Zod for validation

**Example:**
```typescript
const projectSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  is_trashed: z.boolean(),
  trashed_at: z.string().nullable(),
});
```

---

## Relationships
```
projects (1) ──→ (N) tasks
tasks (1) ──→ (N) time_entries
habits (1) ──→ (N) habit_completions
```

**Foreign key actions:**
- `ON DELETE CASCADE` - Child records deleted (habit_completions)
- `ON DELETE SET NULL` - Reference nullified (tasks, time_entries)

---

## Migration Strategy

When adding new columns:

1. Add column to Supabase (nullable first)
2. Update RxDB schema (increment version)
3. Add migration logic in `src/lib/db.ts`
4. Deploy backend changes
5. Update frontend to use new field
6. Backfill data if needed
7. Make column NOT NULL (if required)

---

## Query Patterns

### Find active timer
```sql
SELECT * FROM time_entries 
WHERE stopped_at IS NULL 
AND is_trashed = FALSE 
LIMIT 1;
```

### Find unplanned entries
```sql
SELECT * FROM time_entries
WHERE entry_type = 'unplanned'
AND is_trashed = FALSE
ORDER BY started_at DESC;
```

### Find tasks for project
```sql
SELECT * FROM tasks 
WHERE project_id = $1 
AND is_trashed = FALSE 
ORDER BY created_at DESC;
```

### Calculate habit streak
```sql
SELECT COUNT(*) FROM habit_completions 
WHERE habit_id = $1 
AND is_trashed = FALSE 
AND completed_date >= CURRENT_DATE - INTERVAL '7 days';
```

### Total time on task
```sql
SELECT SUM(duration_seconds) FROM time_entries 
WHERE task_id = $1 
AND is_trashed = FALSE;
```
