import { useMemo } from 'react';
import { useQuery } from '@powersync/react';
import type { NoteGroup } from './useGroupedNotes';

type GroupCounts = Record<NoteGroup, number>;

function getTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function useNoteGroupCounts(): GroupCounts {
  const today = getTodayIso();

  const { data: allRows } = useQuery<{ n: number }>(
    "SELECT COUNT(*) as n FROM items WHERE type = 'note' AND is_trashed = 0 AND inbox_at IS NULL"
  );
  const { data: todayRows } = useQuery<{ n: number }>(
    "SELECT COUNT(*) as n FROM items WHERE type = 'note' AND is_trashed = 0 AND inbox_at IS NULL AND (updated_at >= ? OR created_at >= ?)",
    [today, today]
  );
  const { data: todoRows } = useQuery<{ n: number }>(
    "SELECT COUNT(*) as n FROM items WHERE type = 'note' AND is_trashed = 0 AND inbox_at IS NULL AND content LIKE '%- [ ]%'"
  );
  const { data: pinnedRows } = useQuery<{ n: number }>(
    "SELECT COUNT(*) as n FROM items WHERE type = 'note' AND is_trashed = 0 AND inbox_at IS NULL AND is_pinned = 1"
  );
  const { data: trashRows } = useQuery<{ n: number }>(
    "SELECT COUNT(*) as n FROM items WHERE type = 'note' AND is_trashed = 1"
  );

  return useMemo<GroupCounts>(() => ({
    all: allRows[0]?.n ?? 0,
    today: todayRows[0]?.n ?? 0,
    todo: todoRows[0]?.n ?? 0,
    pinned: pinnedRows[0]?.n ?? 0,
    locked: 0,
    trash: trashRows[0]?.n ?? 0,
  }), [allRows, todayRows, todoRows, pinnedRows, trashRows]);
}
