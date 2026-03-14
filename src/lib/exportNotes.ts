import { zipSync, type Zippable } from 'fflate';
import type { RxDatabase } from 'rxdb';
import type { DatabaseCollections } from './db';
import { generateSlug } from './slug';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportNotesZip(db: RxDatabase<DatabaseCollections>): Promise<number> {
  const docs = await db.items.find({
    selector: { type: 'note', is_trashed: false },
    sort: [{ updated_at: 'desc' }],
  }).exec();

  const files: Zippable = {};
  const encoder = new TextEncoder();
  const slugCounts = new Map<string, number>();

  for (const doc of docs) {
    const note = doc.toJSON();
    const base = note.slug ?? generateSlug(note.title ?? 'untitled');
    const count = slugCounts.get(base) ?? 0;
    slugCounts.set(base, count + 1);
    const filename = count === 0 ? `${base}.md` : `${base}-${count}.md`;
    files[filename] = [encoder.encode(note.content ?? ''), { level: 0 }];
  }

  const zipped = zipSync(files);
  const blob = new Blob([zipped.buffer as ArrayBuffer], { type: 'application/zip' });
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `notes-${dateStr}.zip`);
  return docs.length;
}
