import { useQuery } from '@powersync/react';
import type { ItemRow } from '@/lib/db';
import { isTodayNote } from '../noteUtils';

export type NoteGroup = 'all' | 'todo' | 'today' | 'locked' | 'pinned' | 'trash';

// Only fetch columns needed for list display; truncate content to avoid loading
// large note bodies into memory on every DB update.
const COLS = `id, title, filename, updated_at, created_at, is_pinned, is_trashed, inbox_at,
              SUBSTR(content, 1, 300) AS content`;

function buildQuery(group: NoteGroup): { sql: string; params: unknown[] } {
  if (group === 'locked') {
    return { sql: 'SELECT id FROM items WHERE 0', params: [] };
  }
  if (group === 'trash') {
    return {
      sql: `SELECT ${COLS} FROM items WHERE type = 'note' AND is_trashed = 1
            ORDER BY updated_at DESC`,
      params: [],
    };
  }
  if (group === 'pinned') {
    return {
      sql: `SELECT ${COLS} FROM items WHERE type = 'note' AND is_pinned = 1
            AND is_trashed = 0 AND inbox_at IS NULL
            ORDER BY updated_at DESC`,
      params: [],
    };
  }
  if (group === 'today') {
    const todayIso = new Date().toISOString().slice(0, 10);
    return {
      sql: `SELECT ${COLS} FROM items WHERE type = 'note' AND is_trashed = 0
            AND inbox_at IS NULL AND (updated_at >= ? OR created_at >= ?)
            ORDER BY updated_at DESC`,
      params: [todayIso, todayIso],
    };
  }
  if (group === 'todo') {
    return {
      sql: `SELECT ${COLS} FROM items WHERE type = 'note' AND is_trashed = 0
            AND inbox_at IS NULL AND content LIKE '%- [ ]%'
            ORDER BY is_pinned DESC, updated_at DESC`,
      params: [],
    };
  }
  // 'all'
  return {
    sql: `SELECT ${COLS} FROM items WHERE type = 'note' AND is_trashed = 0
          AND inbox_at IS NULL
          ORDER BY is_pinned DESC, updated_at DESC`,
    params: [],
  };
}

export function useGroupedNotes(group: NoteGroup): {
  notes: ItemRow[];
  isLoading: boolean;
} {
  const { sql, params } = buildQuery(group);
  const { data, isLoading } = useQuery<ItemRow>(sql, params);

  let notes = data;
  if (group === 'today') {
    notes = data.filter(isTodayNote);
  }

  return { notes, isLoading };
}
