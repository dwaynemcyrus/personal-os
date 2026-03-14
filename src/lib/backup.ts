import type { RxDatabase } from 'rxdb';
import type { DatabaseCollections } from './db';
import { nowIso } from './time';

const BACKUP_VERSION = 1;
const COLLECTIONS = [
  'items',
  'item_links',
  'item_versions',
  'time_entries',
  'tags',
] as const satisfies ReadonlyArray<keyof DatabaseCollections>;

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function createBackup(db: RxDatabase<DatabaseCollections>): Promise<void> {
  const data: Record<string, unknown[]> = {};

  for (const name of COLLECTIONS) {
    const docs = await db[name].find().exec();
    data[name] = docs.map((d) => d.toJSON());
  }

  const backup = {
    version: BACKUP_VERSION,
    exported_at: nowIso(),
    collections: data,
  };

  const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `personalos-backup-${dateStr}.json`);
}

export type RestoreResult = { restored: number };

export async function restoreBackup(
  db: RxDatabase<DatabaseCollections>,
  file: File,
  merge: boolean
): Promise<RestoreResult> {
  const text = await file.text();
  const backup = JSON.parse(text) as { collections?: Record<string, unknown[]> };
  if (!backup.collections) throw new Error('Invalid backup file — missing collections.');

  let restored = 0;

  if (!merge) {
    // Destructive: wipe all collections first
    for (const name of COLLECTIONS) {
      await db[name].find().remove();
    }
  }

  for (const name of COLLECTIONS) {
    const records = backup.collections[name] ?? [];
    if (!records.length) continue;

    if (merge) {
      for (const record of records as Record<string, unknown>[]) {
        const id = record.id as string;
        const existing = await db[name].findOne(id).exec();
        if (!existing) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (db[name] as any).insert(record).catch(() => {});
          restored++;
        }
      }
    } else {
      const result = await db[name].bulkInsert(records as never[]);
      restored += result.success.length;
    }
  }

  return { restored };
}
