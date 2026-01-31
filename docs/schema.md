# Database Schema

Single source of truth for all tables and collections.

**Last updated:** January 30, 2026

---

## Supabase Tables

All tables follow these conventions:
- Primary key: `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
- Timestamps: `created_at` and `updated_at` (auto-updated via trigger)
- Soft delete: `deleted BOOLEAN DEFAULT FALSE`

---

### sync_test

**Purpose:** Proof of concept for sync functionality
```sql
CREATE TABLE sync_test (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted BOOLEAN DEFAULT FALSE
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  deleted BOOLEAN DEFAULT FALSE
);
```

**Indexes:**
```sql
CREATE INDEX idx_projects_deleted ON projects(deleted);
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
  completed BOOLEAN DEFAULT FALSE,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  deleted BOOLEAN DEFAULT FALSE
);
```

**Indexes:**
```sql
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_deleted ON tasks(deleted);
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  deleted BOOLEAN DEFAULT FALSE
);
```

**Indexes:**
```sql
CREATE INDEX idx_notes_deleted ON notes(deleted);
CREATE INDEX idx_notes_updated_at ON notes(updated_at DESC);
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
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  deleted BOOLEAN DEFAULT FALSE
);
```

**Indexes:**
```sql
CREATE INDEX idx_habits_deleted ON habits(deleted);
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
  UNIQUE(habit_id, completed_date)
);
```

**Indexes:**
```sql
CREATE INDEX idx_habit_completions_habit_id ON habit_completions(habit_id);
CREATE INDEX idx_habit_completions_date ON habit_completions(completed_date DESC);
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
  started_at TIMESTAMPTZ NOT NULL,
  stopped_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted BOOLEAN DEFAULT FALSE
);
```

**Indexes:**
```sql
CREATE INDEX idx_time_entries_task_id ON time_entries(task_id);
CREATE INDEX idx_time_entries_started_at ON time_entries(started_at DESC);
CREATE INDEX idx_time_entries_deleted ON time_entries(deleted);
```

**Notes:**
- `stopped_at` is NULL for active timers
- `duration_seconds` calculated on stop

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

-- Allow all operations (single user)
CREATE POLICY "Allow all operations" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON habits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON habit_completions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON time_entries FOR ALL USING (true) WITH CHECK (true);
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
  deleted: z.boolean(),
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
AND deleted = FALSE 
LIMIT 1;
```

### Find tasks for project
```sql
SELECT * FROM tasks 
WHERE project_id = $1 
AND deleted = FALSE 
ORDER BY created_at DESC;
```

### Calculate habit streak
```sql
SELECT COUNT(*) FROM habit_completions 
WHERE habit_id = $1 
AND completed_date >= CURRENT_DATE - INTERVAL '7 days';
```

### Total time on task
```sql
SELECT SUM(duration_seconds) FROM time_entries 
WHERE task_id = $1 
AND deleted = FALSE;
```