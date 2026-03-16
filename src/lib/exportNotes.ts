import { zipSync, type Zippable } from 'fflate';
import { supabase } from './supabase';
import type { ItemRow } from './db';
import { generateSlug } from './slug';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportNotesZip(
  onProgress?: (message: string) => void
): Promise<number> {
  // Load note metadata
  onProgress?.('Loading notes…');
  const { data: notes, error } = await supabase
    .from('items')
    .select('id, title, filename, updated_at')
    .eq('type', 'note')
    .eq('is_trashed', false)
    .order('updated_at', { ascending: false });
  if (error) throw error;

  const noteList = (notes ?? []) as Pick<ItemRow, 'id' | 'title' | 'filename' | 'updated_at'>[];

  // Load all note content from item_content
  const ids = noteList.map((n) => n.id);
  const contentMap = new Map<string, string>();
  if (ids.length > 0) {
    onProgress?.(`Loading content for ${noteList.length} notes…`);
    const { data: contents, error: contentError } = await supabase
      .from('item_content')
      .select('item_id, content')
      .in('item_id', ids);
    if (contentError) throw contentError;
    for (const row of contents ?? []) {
      if (row.content) contentMap.set(row.item_id, row.content);
    }
  }

  onProgress?.('Building ZIP…');
  const files: Zippable = {};
  const encoder = new TextEncoder();
  const filenameCounts = new Map<string, number>();

  for (const note of noteList) {
    const base = note.filename ?? generateSlug(note.title ?? 'untitled');
    const count = filenameCounts.get(base) ?? 0;
    filenameCounts.set(base, count + 1);
    const filename = count === 0 ? `${base}.md` : `${base}-${count}.md`;
    const content = contentMap.get(note.id) ?? '';
    files[filename] = [encoder.encode(content), { level: 0 }];
  }

  const zipped = zipSync(files);
  const blob = new Blob([zipped.buffer as ArrayBuffer], { type: 'application/zip' });
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `notes-${dateStr}.zip`);
  return noteList.length;
}
