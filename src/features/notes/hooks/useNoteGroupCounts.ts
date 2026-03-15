import { useMemo } from 'react';
import { useQuery } from '@powersync/react';
import type { ItemRow } from '@/lib/db';
import type { NoteGroup } from './useGroupedNotes';
import { isTodayNote, isTodoNote } from '../noteUtils';

type GroupCounts = Record<NoteGroup, number>;

export function useNoteGroupCounts(): GroupCounts {
  const { data: activeNotes } = useQuery<ItemRow>(
    "SELECT * FROM items WHERE type = 'note' AND is_trashed = 0 AND inbox_at IS NULL"
  );
  const { data: trashNotes } = useQuery<{ id: string }>(
    "SELECT id FROM items WHERE type = 'note' AND is_trashed = 1"
  );

  return useMemo<GroupCounts>(() => ({
    all: activeNotes.length,
    today: activeNotes.filter(isTodayNote).length,
    todo: activeNotes.filter(isTodoNote).length,
    pinned: activeNotes.filter((n) => n.is_pinned === 1).length,
    locked: 0,
    trash: trashNotes.length,
  }), [activeNotes, trashNotes]);
}
