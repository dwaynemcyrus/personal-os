-- Migration: align canonical items schema to Schema Reference 3.0
-- Source of truth: docs/_new/Schema Reference 3.0 — Personal OS.md
--
-- Paywall is intentionally temporary: until user tiers exist, paywall means
-- "authenticated read". Write access remains owner-only, with one exception:
-- seeded template rows may have owner = NULL, so authenticated users can edit
-- those shared defaults in-app.

ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS is_template boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS medium text,
  ADD COLUMN IF NOT EXISTS format text,
  ADD COLUMN IF NOT EXISTS asset_type text,
  ADD COLUMN IF NOT EXISTS for_sale boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sold boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS exhibited boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS price numeric,
  ADD COLUMN IF NOT EXISTS deal_value numeric,
  ADD COLUMN IF NOT EXISTS lag_target numeric,
  ADD COLUMN IF NOT EXISTS lag_actual numeric,
  ADD COLUMN IF NOT EXISTS attendees numeric,
  ADD COLUMN IF NOT EXISTS total_sent numeric,
  ADD COLUMN IF NOT EXISTS total_comments numeric,
  ADD COLUMN IF NOT EXISTS total_responses numeric,
  ADD COLUMN IF NOT EXISTS chapter_count numeric,
  ADD COLUMN IF NOT EXISTS series_position numeric,
  ADD COLUMN IF NOT EXISTS episode numeric,
  ADD COLUMN IF NOT EXISTS season numeric,
  ADD COLUMN IF NOT EXISTS date_delivered timestamptz,
  ADD COLUMN IF NOT EXISTS contacted_last date,
  ADD COLUMN IF NOT EXISTS next_follow_up date,
  ADD COLUMN IF NOT EXISTS frequency jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS stack jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS modules jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS be_and_feel jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS chains jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS platforms jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS author text,
  ADD COLUMN IF NOT EXISTS bookmark text,
  ADD COLUMN IF NOT EXISTS certificate_link text,
  ADD COLUMN IF NOT EXISTS collection text,
  ADD COLUMN IF NOT EXISTS contact_status text,
  ADD COLUMN IF NOT EXISTS contact_type text,
  ADD COLUMN IF NOT EXISTS course text,
  ADD COLUMN IF NOT EXISTS cover_alt_text text,
  ADD COLUMN IF NOT EXISTS cover_link text,
  ADD COLUMN IF NOT EXISTS currency text,
  ADD COLUMN IF NOT EXISTS currency_primary text,
  ADD COLUMN IF NOT EXISTS currency_secondary text,
  ADD COLUMN IF NOT EXISTS date text,
  ADD COLUMN IF NOT EXISTS deal_status text,
  ADD COLUMN IF NOT EXISTS delivery text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS dimensions text,
  ADD COLUMN IF NOT EXISTS duration_target text,
  ADD COLUMN IF NOT EXISTS genre text,
  ADD COLUMN IF NOT EXISTS institution text,
  ADD COLUMN IF NOT EXISTS instructor text,
  ADD COLUMN IF NOT EXISTS isbn text,
  ADD COLUMN IF NOT EXISTS issue text,
  ADD COLUMN IF NOT EXISTS lag_measure text,
  ADD COLUMN IF NOT EXISTS lag_unit text,
  ADD COLUMN IF NOT EXISTS manuscript text,
  ADD COLUMN IF NOT EXISTS month text,
  ADD COLUMN IF NOT EXISTS month_expenses_chf text,
  ADD COLUMN IF NOT EXISTS month_profit_chf text,
  ADD COLUMN IF NOT EXISTS month_revenue_chf text,
  ADD COLUMN IF NOT EXISTS mood text,
  ADD COLUMN IF NOT EXISTS outcome text,
  ADD COLUMN IF NOT EXISTS platform text,
  ADD COLUMN IF NOT EXISTS principle text,
  ADD COLUMN IF NOT EXISTS problem text,
  ADD COLUMN IF NOT EXISTS project text,
  ADD COLUMN IF NOT EXISTS recording_link text,
  ADD COLUMN IF NOT EXISTS repo text,
  ADD COLUMN IF NOT EXISTS score_overall text,
  ADD COLUMN IF NOT EXISTS series text,
  ADD COLUMN IF NOT EXISTS solution text,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS subtitle text,
  ADD COLUMN IF NOT EXISTS target text,
  ADD COLUMN IF NOT EXISTS theme text,
  ADD COLUMN IF NOT EXISTS unit text,
  ADD COLUMN IF NOT EXISTS url text,
  ADD COLUMN IF NOT EXISTS week text,
  ADD COLUMN IF NOT EXISTS year text;

ALTER TABLE public.items
  ALTER COLUMN resources SET DEFAULT '[]'::jsonb,
  ALTER COLUMN dependencies SET DEFAULT '[]'::jsonb,
  ALTER COLUMN tags SET DEFAULT '[]'::jsonb,
  ALTER COLUMN frontmatter SET DEFAULT '{}'::jsonb;

UPDATE public.items
SET frontmatter = '{}'::jsonb
WHERE frontmatter IS NULL;

ALTER TABLE public.items
  ALTER COLUMN frontmatter SET NOT NULL;

ALTER TABLE public.items
  ALTER COLUMN rating TYPE numeric
  USING rating::numeric;

ALTER TABLE public.habit_logs
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.finance_entries
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS items_type_idx ON public.items(type);
CREATE INDEX IF NOT EXISTS items_subtype_idx ON public.items(subtype);
CREATE INDEX IF NOT EXISTS items_status_idx ON public.items(status);
CREATE INDEX IF NOT EXISTS items_area_idx ON public.items(area);
CREATE INDEX IF NOT EXISTS items_workbench_idx ON public.items(workbench);
CREATE INDEX IF NOT EXISTS items_date_created_idx ON public.items(date_created);
CREATE INDEX IF NOT EXISTS items_date_trashed_idx ON public.items(date_trashed);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class AS table_class
    JOIN pg_index AS index_def
      ON index_def.indrelid = table_class.oid
    JOIN pg_attribute AS attr
      ON attr.attrelid = table_class.oid
     AND attr.attnum = ANY(index_def.indkey)
    WHERE table_class.relname = 'items'
      AND index_def.indnatts = 1
      AND attr.attname = 'cuid'
  ) THEN
    CREATE INDEX items_cuid_idx ON public.items(cuid);
  END IF;
END $$;

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "items_owner" ON public.items;
DROP POLICY IF EXISTS "items_select_by_access" ON public.items;
DROP POLICY IF EXISTS "items_insert_owner" ON public.items;
DROP POLICY IF EXISTS "items_update_owner" ON public.items;
DROP POLICY IF EXISTS "items_delete_owner" ON public.items;

CREATE POLICY "items_select_by_access"
ON public.items
FOR SELECT
TO public
USING (
  owner = auth.uid()
  OR access = 'public'
  OR (access = 'paywall' AND auth.role() = 'authenticated')
);

CREATE POLICY "items_insert_owner"
ON public.items
FOR INSERT
TO authenticated
WITH CHECK (owner = auth.uid());

CREATE POLICY "items_update_owner"
ON public.items
FOR UPDATE
TO authenticated
USING (
  owner = auth.uid()
  OR (is_template = true AND owner IS NULL AND auth.role() = 'authenticated')
)
WITH CHECK (
  owner = auth.uid()
  OR (is_template = true AND owner IS NULL AND auth.role() = 'authenticated')
);

CREATE POLICY "items_delete_owner"
ON public.items
FOR DELETE
TO authenticated
USING (
  owner = auth.uid()
  OR (is_template = true AND owner IS NULL AND auth.role() = 'authenticated')
);

DROP POLICY IF EXISTS "habit_logs_owner" ON public.habit_logs;
DROP POLICY IF EXISTS "habit_logs_select_via_item_access" ON public.habit_logs;
DROP POLICY IF EXISTS "habit_logs_insert_owner" ON public.habit_logs;
DROP POLICY IF EXISTS "habit_logs_update_owner" ON public.habit_logs;
DROP POLICY IF EXISTS "habit_logs_delete_owner" ON public.habit_logs;

CREATE POLICY "habit_logs_select_via_item_access"
ON public.habit_logs
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public.items
    WHERE items.id = habit_logs.habit_id
      AND (
        items.owner = auth.uid()
        OR items.access = 'public'
        OR (items.access = 'paywall' AND auth.role() = 'authenticated')
      )
  )
);

CREATE POLICY "habit_logs_insert_owner"
ON public.habit_logs
FOR INSERT
TO authenticated
WITH CHECK (owner = auth.uid());

CREATE POLICY "habit_logs_update_owner"
ON public.habit_logs
FOR UPDATE
TO authenticated
USING (owner = auth.uid())
WITH CHECK (owner = auth.uid());

CREATE POLICY "habit_logs_delete_owner"
ON public.habit_logs
FOR DELETE
TO authenticated
USING (owner = auth.uid());

DROP POLICY IF EXISTS "finance_entries_owner" ON public.finance_entries;
DROP POLICY IF EXISTS "finance_entries_select_via_item_access" ON public.finance_entries;
DROP POLICY IF EXISTS "finance_entries_insert_owner" ON public.finance_entries;
DROP POLICY IF EXISTS "finance_entries_update_owner" ON public.finance_entries;
DROP POLICY IF EXISTS "finance_entries_delete_owner" ON public.finance_entries;

CREATE POLICY "finance_entries_select_via_item_access"
ON public.finance_entries
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public.items
    WHERE items.id = finance_entries.finance_id
      AND (
        items.owner = auth.uid()
        OR items.access = 'public'
        OR (items.access = 'paywall' AND auth.role() = 'authenticated')
      )
  )
);

CREATE POLICY "finance_entries_insert_owner"
ON public.finance_entries
FOR INSERT
TO authenticated
WITH CHECK (owner = auth.uid());

CREATE POLICY "finance_entries_update_owner"
ON public.finance_entries
FOR UPDATE
TO authenticated
USING (owner = auth.uid())
WITH CHECK (owner = auth.uid());

CREATE POLICY "finance_entries_delete_owner"
ON public.finance_entries
FOR DELETE
TO authenticated
USING (owner = auth.uid());
