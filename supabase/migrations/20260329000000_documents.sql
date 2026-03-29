-- Migration: documents table + companion tables
-- Adds the new markdown-first document system alongside the existing items table.

-- ── documents ─────────────────────────────────────────────────────────────────

CREATE TABLE documents (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  cuid            text        UNIQUE NOT NULL,
  type            text        NOT NULL,
  subtype         text,
  title           text,
  status          text,
  access          text        NOT NULL DEFAULT 'private',
  area            text,
  workbench       boolean     NOT NULL DEFAULT false,
  resources       jsonb       NOT NULL DEFAULT '[]',
  dependencies    jsonb       NOT NULL DEFAULT '[]',
  blocked         boolean     NOT NULL DEFAULT false,
  slug            text,
  published       boolean     NOT NULL DEFAULT false,
  tier            text,
  growth          text,
  rating          integer,
  processed       boolean,
  start_date      date,
  end_date        date,
  date_created    timestamptz,
  date_modified   timestamptz,
  date_trashed    timestamptz,
  tags            jsonb       NOT NULL DEFAULT '[]',
  content         text,
  frontmatter     jsonb,
  owner           uuid        REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX documents_type_idx          ON documents(type);
CREATE INDEX documents_type_subtype_idx  ON documents(type, subtype);
CREATE INDEX documents_status_idx        ON documents(status);
CREATE INDEX documents_owner_idx         ON documents(owner);
CREATE INDEX documents_date_trashed_idx  ON documents(date_trashed) WHERE date_trashed IS NULL;
CREATE INDEX documents_end_date_idx      ON documents(end_date)      WHERE end_date IS NOT NULL;
CREATE INDEX documents_updated_at_idx    ON documents(updated_at);

-- ── habit_logs ────────────────────────────────────────────────────────────────

CREATE TABLE habit_logs (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id   uuid    REFERENCES documents(id) ON DELETE CASCADE,
  date       date    NOT NULL,
  value      numeric,
  note       text,
  owner      uuid    REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX habit_logs_habit_id_idx ON habit_logs(habit_id);
CREATE INDEX habit_logs_date_idx     ON habit_logs(date);

-- ── finance_entries ───────────────────────────────────────────────────────────

CREATE TABLE finance_entries (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  finance_id    uuid    REFERENCES documents(id) ON DELETE CASCADE,
  entry_type    text    NOT NULL,
  date          date    NOT NULL,
  counterparty  text,
  category      text,
  currency      text,
  amount        numeric,
  amount_chf    numeric,
  cumulative    numeric,
  note          text,
  owner         uuid    REFERENCES auth.users(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX finance_entries_finance_id_idx ON finance_entries(finance_id);
CREATE INDEX finance_entries_date_idx       ON finance_entries(date);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE documents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_entries  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_owner" ON documents FOR ALL TO authenticated
  USING (owner = auth.uid()) WITH CHECK (owner = auth.uid());

CREATE POLICY "habit_logs_owner" ON habit_logs FOR ALL TO authenticated
  USING (owner = auth.uid()) WITH CHECK (owner = auth.uid());

CREATE POLICY "finance_entries_owner" ON finance_entries FOR ALL TO authenticated
  USING (owner = auth.uid()) WITH CHECK (owner = auth.uid());

-- ── Realtime ──────────────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE documents;
ALTER PUBLICATION supabase_realtime ADD TABLE habit_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE finance_entries;
