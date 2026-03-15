import { zipSync, type Zippable } from 'fflate';
import type { AbstractPowerSyncDatabase } from '@powersync/web';
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

export async function exportNotesZip(db: AbstractPowerSyncDatabase): Promise<number> {
  const notes = await db.getAll<ItemRow>(
    'SELECT * FROM items WHERE type = ? AND is_trashed = 0 ORDER BY updated_at DESC',
    ['note']
  );

  const files: Zippable = {};
  const encoder = new TextEncoder();
  const filenameCounts = new Map<string, number>();

  for (const note of notes) {
    const base = note.filename ?? generateSlug(note.title ?? 'untitled');
    const count = filenameCounts.get(base) ?? 0;
    filenameCounts.set(base, count + 1);
    const filename = count === 0 ? `${base}.md` : `${base}-${count}.md`;
    files[filename] = [encoder.encode(note.content ?? ''), { level: 0 }];
  }

  const zipped = zipSync(files);
  const blob = new Blob([zipped.buffer as ArrayBuffer], { type: 'application/zip' });
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `notes-${dateStr}.zip`);
  return notes.length;
}
