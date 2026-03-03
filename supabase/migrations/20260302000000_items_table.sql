-- Migration: Unified items table
-- Drops all old domain tables and replaces with a single self-referencing items table.
-- Data is intentionally discarded (all content was dummy data).

-- ── Drop old tables ───────────────────────────────────────────────────────────

DROP TABLE IF EXISTS note_links CASCADE;
DROP TABLE IF EXISTS note_versions CASCADE;
DROP TABLE IF EXISTS captures CASCADE;
DROP TABLE IF EXISTS sources CASCADE;
DROP TABLE IF EXISTS habit_completions CASCADE;
DROP TABLE IF EXISTS habits CASCADE;
DROP TABLE IF EXISTS okrs CASCADE;
DROP TABLE IF EXISTS templates CASCADE;
DROP TABLE IF EXISTS time_entries CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS areas CASCADE;
-- tags: kept as independent catalog

-- ── Unified items table ───────────────────────────────────────────────────────

CREATE TABLE items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Discriminator
  type text NOT NULL,
  -- area | plan | objective | key_result | project | task | note
  -- | capture | source | habit | habit_entry | template

  -- Hierarchy (single parent for all types)
  parent_id uuid REFERENCES items(id) ON DELETE SET NULL,

  -- ── Common ────────────────────────────────────────────────────────────────
  title text,
  content text,
  tags text[] DEFAULT '{}',
  is_pinned boolean NOT NULL DEFAULT false,
  item_status text NOT NULL DEFAULT 'active',
  -- inbox | active | backlog | someday | complete | archived
  priority text,
  -- low | medium | high | urgent

  -- ── Scheduling (tasks, projects) ──────────────────────────────────────────
  due_date timestamptz,
  start_date timestamptz,
  completed boolean NOT NULL DEFAULT false,
  is_next boolean NOT NULL DEFAULT false,
  is_someday boolean NOT NULL DEFAULT false,
  is_waiting boolean NOT NULL DEFAULT false,
  waiting_note text,
  waiting_started_at timestamptz,
  depends_on uuid[] DEFAULT '{}',

  -- ── Note-specific ─────────────────────────────────────────────────────────
  inbox_at timestamptz,
  subtype text,
  -- 'daily' for daily notes; arbitrary subtype string for others

  -- ── Source-specific ───────────────────────────────────────────────────────
  url text,
  content_type text,
  -- audio | video | text | live
  read_status text,
  -- inbox | reading | read

  -- ── OKR / planning ────────────────────────────────────────────────────────
  period_start timestamptz,
  period_end timestamptz,
  progress integer CHECK (progress IS NULL OR (progress >= 0 AND progress <= 100)),

  -- ── Habit ─────────────────────────────────────────────────────────────────
  frequency text,
  -- daily | weekdays | weekly
  target integer,
  active boolean,
  streak integer DEFAULT 0,
  last_completed_at timestamptz,

  -- ── Capture ───────────────────────────────────────────────────────────────
  body text,
  capture_source text,
  -- quick | voice | email
  processed boolean NOT NULL DEFAULT false,
  processed_at timestamptz,
  result_type text,
  result_id uuid REFERENCES items(id) ON DELETE SET NULL,

  -- ── Template ──────────────────────────────────────────────────────────────
  description text,
  category text,
  sort_order integer,

  -- ── Soft delete ───────────────────────────────────────────────────────────
  is_trashed boolean NOT NULL DEFAULT false,
  trashed_at timestamptz,

  -- ── Sync ──────────────────────────────────────────────────────────────────
  owner uuid REFERENCES auth.users(id),
  device_id text,
  revision integer DEFAULT 0,
  deleted boolean NOT NULL DEFAULT false,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX items_type_idx ON items(type);
CREATE INDEX items_type_trashed_idx ON items(type, is_trashed);
CREATE INDEX items_parent_id_idx ON items(parent_id);
CREATE INDEX items_updated_at_idx ON items(updated_at);
CREATE INDEX items_inbox_at_idx ON items(inbox_at) WHERE inbox_at IS NOT NULL;

-- ── Item links (replaces note_links) ─────────────────────────────────────────

CREATE TABLE item_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  target_id uuid REFERENCES items(id) ON DELETE SET NULL,
  target_title text NOT NULL,
  header text,
  alias text,
  position integer NOT NULL DEFAULT 0,
  is_trashed boolean NOT NULL DEFAULT false,
  trashed_at timestamptz,
  owner uuid REFERENCES auth.users(id),
  device_id text,
  revision integer DEFAULT 0,
  deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX item_links_source_id_idx ON item_links(source_id);

-- ── Item versions (replaces note_versions) ───────────────────────────────────

CREATE TABLE item_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  content text,
  properties jsonb,
  version_number integer NOT NULL,
  created_by text NOT NULL,
  -- auto | manual
  change_summary text,
  is_trashed boolean NOT NULL DEFAULT false,
  trashed_at timestamptz,
  owner uuid REFERENCES auth.users(id),
  device_id text,
  revision integer DEFAULT 0,
  deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX item_versions_item_id_idx ON item_versions(item_id);

-- ── Time entries (task_id renamed to item_id) ─────────────────────────────────

CREATE TABLE time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES items(id) ON DELETE SET NULL,
  session_id uuid,
  entry_type text NOT NULL DEFAULT 'planned',
  -- planned | unplanned
  label text,
  label_normalized text,
  started_at timestamptz NOT NULL,
  stopped_at timestamptz,
  duration_seconds integer,
  is_trashed boolean NOT NULL DEFAULT false,
  trashed_at timestamptz,
  owner uuid REFERENCES auth.users(id),
  device_id text,
  revision integer DEFAULT 0,
  deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_all" ON items FOR ALL TO authenticated USING (true);

ALTER TABLE item_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_all" ON item_links FOR ALL TO authenticated USING (true);

ALTER TABLE item_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_all" ON item_versions FOR ALL TO authenticated USING (true);

ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_all" ON time_entries FOR ALL TO authenticated USING (true);

-- ── Realtime ──────────────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE items;
ALTER PUBLICATION supabase_realtime ADD TABLE item_links;
ALTER PUBLICATION supabase_realtime ADD TABLE item_versions;
ALTER PUBLICATION supabase_realtime ADD TABLE time_entries;
