-- Create templates table for note templates
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  description TEXT,
  category TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_trashed BOOLEAN NOT NULL DEFAULT false,
  trashed_at TIMESTAMPTZ
);

-- Index for category grouping and ordering
CREATE INDEX IF NOT EXISTS templates_category_sort_idx ON templates (category, sort_order);

-- Index for filtering non-trashed templates
CREATE INDEX IF NOT EXISTS templates_is_trashed_idx ON templates (is_trashed) WHERE is_trashed = false;

-- Enable RLS
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- RLS policy for authenticated users
CREATE POLICY "Users can manage their own templates"
  ON templates
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default templates
INSERT INTO templates (id, title, content, description, category, sort_order)
VALUES
  (
    gen_random_uuid(),
    'Daily Note',
    E'# {{date}}\n\n## Tasks\n\n- [ ] \n\n## Notes\n\n\n## Reflections\n\n',
    'Daily journal and task planning',
    'daily',
    0
  ),
  (
    gen_random_uuid(),
    'Meeting Notes',
    E'# Meeting: {{title}}\n\n**Date:** {{date}}\n**Attendees:** \n\n## Agenda\n\n1. \n\n## Discussion\n\n\n## Action Items\n\n- [ ] \n\n## Next Steps\n\n',
    'Structured meeting notes with agenda and action items',
    'meeting',
    0
  ),
  (
    gen_random_uuid(),
    'Book Notes',
    E'# {{title}}\n\n**Author:** \n**Started:** {{date}}\n**Finished:** \n\n## Summary\n\n\n## Key Takeaways\n\n1. \n\n## Favorite Quotes\n\n> \n\n## Thoughts\n\n',
    'Template for book reading notes',
    'reading',
    0
  ),
  (
    gen_random_uuid(),
    'Project Brief',
    E'# Project: {{title}}\n\n**Created:** {{date}}\n**Status:** Planning\n\n## Objective\n\n\n## Scope\n\n### In Scope\n\n- \n\n### Out of Scope\n\n- \n\n## Milestones\n\n- [ ] \n\n## Resources\n\n\n## Notes\n\n',
    'Project planning and tracking template',
    'project',
    0
  );
