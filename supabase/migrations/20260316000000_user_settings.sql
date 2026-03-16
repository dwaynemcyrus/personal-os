-- user_settings
-- One row per authenticated user, synced via RLS.
-- Stores template preferences and format strings.

CREATE TABLE IF NOT EXISTS user_settings (
  user_id                  UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_note_template_id   UUID        REFERENCES items(id) ON DELETE SET NULL,
  template_date_format     TEXT        NOT NULL DEFAULT 'YYYY-MM-DD',
  template_time_format     TEXT        NOT NULL DEFAULT 'HH:mm:ss',
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_settings_owner"
  ON user_settings
  FOR ALL
  TO authenticated
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
