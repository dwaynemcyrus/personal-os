import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase';
import { insertItemVersion, type ItemVersionRow } from './db';
import { nowIso } from './time';

const AUTO_SAVE_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
const lastVersionSaveByNote = new Map<string, number>();

export function shouldAutoSaveVersion(noteId: string): boolean {
  const now = Date.now();
  const lastSave = lastVersionSaveByNote.get(noteId) ?? 0;
  return now - lastSave > AUTO_SAVE_INTERVAL_MS;
}

export function markVersionSaved(noteId: string): void {
  lastVersionSaveByNote.set(noteId, Date.now());
}

async function getNextVersionNumber(noteId: string): Promise<number> {
  const { data } = await supabase
    .from('item_versions')
    .select('version_number')
    .eq('item_id', noteId)
    .eq('is_trashed', false)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? data.version_number + 1 : 1;
}

export async function saveVersion(
  noteId: string,
  content: string | null,
  properties: Record<string, unknown> | null,
  createdBy: 'auto' | 'manual',
  changeSummary?: string
): Promise<void> {
  const versionNumber = await getNextVersionNumber(noteId);
  const timestamp = nowIso();
  await insertItemVersion({
    id: uuidv4(),
    item_id: noteId,
    content,
    properties: properties ? JSON.stringify(properties) : null,
    version_number: versionNumber,
    created_by: createdBy,
    change_summary: changeSummary ?? null,
    created_at: timestamp,
    updated_at: timestamp,
  });
  markVersionSaved(noteId);
}

export async function getVersions(noteId: string): Promise<ItemVersionRow[]> {
  const { data } = await supabase
    .from('item_versions')
    .select('*')
    .eq('item_id', noteId)
    .eq('is_trashed', false)
    .order('created_at', { ascending: false });
  return (data ?? []) as ItemVersionRow[];
}
