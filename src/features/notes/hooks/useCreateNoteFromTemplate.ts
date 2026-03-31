import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { insertItem } from '@/lib/db';
import { nowIso, nowIsoSeconds, nowIsoSecondsFilename } from '@/lib/time';
import { generateSlug } from '@/lib/slug';
import { resolveTemplateBody } from '@/hooks/useDocumentTemplate';

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
    const { data: templateRow, error } = await supabase
      .from('items')
      .select('id, content')
      .eq('type', 'template')
      .eq('id', templateId)
      .is('date_trashed', null)
      .maybeSingle();

    if (error) throw error;
    if (!templateRow) throw new Error('Selected template no longer exists.');

    content = await resolveTemplateBody(templateRow.content ?? '', {
      title: opts.title ?? '',
    });
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
  queryClient.invalidateQueries({ queryKey: ['document-templates'] });

  return noteId;
}
