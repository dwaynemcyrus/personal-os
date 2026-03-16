import { supabase } from './supabase';
import { nowIso } from './time';

const BACKUP_VERSION = 1;

const TABLES = [
  'items',
  'item_content',
  'item_links',
  'item_versions',
  'time_entries',
  'tags',
] as const;

// Tables deleted explicitly by owner.
// item_links / item_versions / item_content are omitted — they cascade from items.
// tags has no owner column so it uses a separate delete-all approach.
const OWNER_DELETE_TABLES = ['time_entries', 'items'] as const;

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function createBackup(
  onProgress?: (message: string) => void
): Promise<void> {
  const data: Record<string, unknown[]> = {};
  for (const table of TABLES) {
    onProgress?.(`Backing up ${table}…`);
    const { data: rows, error } = await supabase.from(table).select('*');
    if (error) throw error;
    data[table] = rows ?? [];
  }

  onProgress?.('Building backup file…');
  const backup = {
    version: BACKUP_VERSION,
    exported_at: nowIso(),
    collections: data,
  };

  const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
  const dateStr = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  downloadBlob(blob, `personalos-backup-${dateStr}.json`);
}

export async function wipeAllData(
  onProgress?: (message: string) => void
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated.');

  // Auto-backup before wiping
  await createBackup((msg) => onProgress?.(msg));

  // Delete tags (no owner column — single-user app, delete all)
  onProgress?.('Deleting tags…');
  const { error: tagsError } = await supabase.from('tags').delete().not('id', 'is', null);
  if (tagsError) throw tagsError;

  // Delete time_entries by owner, then items by owner.
  // Deleting items cascades to item_links, item_versions, item_content at the DB level.
  for (const table of OWNER_DELETE_TABLES) {
    onProgress?.(`Deleting ${table}…`);
    const { error } = await supabase.from(table).delete().eq('owner', user.id);
    if (error) throw error;
  }
}

export type RestoreResult = { restored: number };

// Tables whose primary key column is not 'id'
const ALT_PK: Partial<Record<typeof TABLES[number], string>> = {
  item_content: 'item_id',
};

export async function restoreBackup(
  file: File,
  merge: boolean,
  onProgress?: (message: string) => void
): Promise<RestoreResult> {
  onProgress?.('Reading backup file…');
  const text = await file.text();
  const backup = JSON.parse(text) as { collections?: Record<string, unknown[]> };
  if (!backup.collections) throw new Error('Invalid backup file — missing collections.');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated.');

  if (!merge) {
    // Destructive: wipe then re-insert, then reload
    await supabase.from('tags').delete().not('id', 'is', null);
    for (const table of OWNER_DELETE_TABLES) {
      onProgress?.(`Clearing ${table}…`);
      await supabase.from(table).delete().eq('owner', user.id);
    }

    let restored = 0;
    for (const table of TABLES) {
      const records = (backup.collections[table] ?? []) as Record<string, unknown>[];
      if (!records.length) continue;
      onProgress?.(`Restoring ${table} (${records.length} records)…`);
      const toInsert = table === 'items'
        ? records.map((r) => ({ ...r, tags: [...new Set([...((r.tags as string[]) ?? []), 'imported'])] }))
        : records;
      const { error } = await supabase.from(table).insert(toInsert);
      if (!error) restored += records.length;
    }

    window.location.reload();
    return { restored }; // unreachable
  }

  // Merge: insert only records not already present in Supabase
  let restored = 0;
  for (const table of TABLES) {
    const records = (backup.collections[table] ?? []) as Record<string, unknown>[];
    if (!records.length) continue;

    const pkCol = ALT_PK[table] ?? 'id';
    onProgress?.(`Merging ${table} (${records.length} records)…`);

    for (const record of records) {
      const pkValue = record[pkCol] as string;
      if (!pkValue) continue;
      const { data: existing } = await supabase
        .from(table)
        .select(pkCol)
        .eq(pkCol, pkValue)
        .maybeSingle();
      if (!existing) {
        const toInsert = table === 'items'
          ? { ...record, tags: [...new Set([...((record.tags as string[]) ?? []), 'imported'])] }
          : record;
        try { await supabase.from(table).insert(toInsert); } catch { /* ignore duplicate */ }
        restored++;
      }
    }
  }

  return { restored };
}
