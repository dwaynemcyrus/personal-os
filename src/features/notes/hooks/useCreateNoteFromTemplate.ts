import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { insertItem } from '@/lib/db';
import { fetchUserSettings, DEFAULT_USER_SETTINGS } from '@/lib/userSettings';
import { replaceTemplateVariables } from '@/lib/templates';
import { nowIso, nowIsoSeconds, nowIsoSecondsFilename } from '@/lib/time';
import { generateSlug } from '@/lib/slug';

type CreateOptions = {
  /** Note title. Defaults to current ISO timestamp. */
  title?: string;
  /** Note filename. Defaults to slug of title. */
  filename?: string;
  /** Item subtype (e.g. 'daily:2026-03-17'). */
  subtype?: string | null;
};

/**
 * Creates a new note, optionally pre-populated with a resolved template.
 * Returns the new note's ID.
 *
 * Pass `templateId = null` for a blank note.
 */
export async function createNoteFromTemplate(
  templateId: string | null,
  opts: CreateOptions = {}
): Promise<string> {
  const noteId = uuidv4();
  const timestamp = nowIso();
  const noteTitle = opts.title ?? nowIsoSeconds();
  const noteFilename = opts.filename ?? (opts.title ? generateSlug(opts.title) : nowIsoSecondsFilename());

  let content = '';

  if (templateId) {
    // Fetch template content
    const { data: contentRow } = await supabase
      .from('item_content')
      .select('content')
      .eq('item_id', templateId)
      .maybeSingle();

    const rawTemplate = contentRow?.content ?? '';

    if (rawTemplate) {
      // Fetch user settings for date/time formats
      const settings = await fetchUserSettings();
      content = replaceTemplateVariables(rawTemplate, {
        title: noteTitle,
        date: new Date(),
        dateFormat: settings?.template_date_format ?? DEFAULT_USER_SETTINGS.template_date_format,
        timeFormat: settings?.template_time_format ?? DEFAULT_USER_SETTINGS.template_time_format,
      });
    }
  }

  await insertItem({
    id: noteId,
    type: 'note',
    parent_id: null,
    title: noteTitle,
    filename: noteFilename,
    content,
    inbox_at: null,
    subtype: opts.subtype ?? null,
    is_pinned: false,
    item_status: 'backlog',
    completed: false,
    is_next: false,
    is_someday: false,
    is_waiting: false,
    processed: false,
    created_at: timestamp,
    updated_at: timestamp,
  });

  queryClient.invalidateQueries({ queryKey: ['notes', 'list'] });
  queryClient.invalidateQueries({ queryKey: ['notes', 'counts'] });

  return noteId;
}
