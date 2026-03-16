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

// Delete order: children before parents to avoid FK violations
const DELETE_ORDER = [
  'item_links',
  'item_versions',
  'item_content',
  'time_entries',
  'tags',
  'items',
] as const;

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
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `personalos-backup-${dateStr}.json`);
}

export type RestoreResult = { restored: number };

export async function restoreBackup(
  file: File,
  merge: boolean
): Promise<RestoreResult> {
  const text = await file.text();
  const backup = JSON.parse(text) as { collections?: Record<string, unknown[]> };
  if (!backup.collections) throw new Error('Invalid backup file — missing collections.');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated.');

  if (!merge) {
    // Destructive: wipe Supabase then re-insert, then reload
    for (const table of DELETE_ORDER) {
      await supabase.from(table).delete().eq('owner', user.id);
    }

    let restored = 0;
    for (const table of TABLES) {
      const records = (backup.collections[table] ?? []) as Record<string, unknown>[];
      if (!records.length) continue;
      const { error } = await supabase.from(table).insert(records);
      if (!error) restored += records.length;
    }

    window.location.reload();
    return { restored }; // unreachable
  }

  // Merge: insert only records not already in Supabase
  let restored = 0;
  for (const table of TABLES) {
    const records = (backup.collections[table] ?? []) as Record<string, unknown>[];
    for (const record of records) {
      const id = record.id as string;
      const { data: existing } = await supabase.from(table).select('id').eq('id', id).single();
      if (!existing) {
        try { await supabase.from(table).insert(record); } catch { /* ignore duplicate */ }
        restored++;
      }
    }
  }

  return { restored };
}
