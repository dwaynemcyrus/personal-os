import { v4 as uuidv4 } from 'uuid';
import type { AbstractPowerSyncDatabase } from '@powersync/web';
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

async function getNextVersionNumber(db: AbstractPowerSyncDatabase, noteId: string): Promise<number> {
  const rows = await db.getAll<{ version_number: number }>(
    'SELECT version_number FROM item_versions WHERE item_id = ? AND is_trashed = 0 ORDER BY version_number DESC LIMIT 1',
    [noteId]
  );
  return rows.length > 0 ? rows[0].version_number + 1 : 1;
}

export async function saveVersion(
  db: AbstractPowerSyncDatabase,
  noteId: string,
  content: string | null,
  properties: Record<string, unknown> | null,
  createdBy: 'auto' | 'manual',
  changeSummary?: string
): Promise<void> {
  const versionNumber = await getNextVersionNumber(db, noteId);
  const timestamp = nowIso();
  await insertItemVersion(db, {
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

export async function getVersions(db: AbstractPowerSyncDatabase, noteId: string): Promise<ItemVersionRow[]> {
  return db.getAll<ItemVersionRow>(
    'SELECT * FROM item_versions WHERE item_id = ? AND is_trashed = 0 ORDER BY created_at DESC',
    [noteId]
  );
}
