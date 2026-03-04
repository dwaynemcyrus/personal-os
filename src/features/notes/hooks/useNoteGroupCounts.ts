import { useEffect, useState } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import type { NoteGroup } from './useGroupedNotes';
import { isTodayNote, isTodoNote } from '../noteUtils';

type GroupCounts = Record<NoteGroup, number>;

export function useNoteGroupCounts(): GroupCounts {
  const { db, isReady } = useDatabase();
  const [counts, setCounts] = useState<GroupCounts>({
    all: 0,
    todo: 0,
    today: 0,
    locked: 0,
    pinned: 0,
    trash: 0,
  });

  useEffect(() => {
    if (!db || !isReady) return;

    // Active notes (not trashed, not in inbox)
    const subActive = db.items
      .find({ selector: { type: 'note', is_trashed: false, inbox_at: null } })
      .$.subscribe((docs) => {
        const notes = docs.map((d) => d.toJSON() as ItemDocument);
        setCounts((prev) => ({
          ...prev,
          all: notes.length,
          today: notes.filter(isTodayNote).length,
          todo: notes.filter(isTodoNote).length,
          pinned: notes.filter((n) => n.is_pinned).length,
          locked: 0,
        }));
      });

    // Trashed notes count
    const subTrash = db.items
      .find({ selector: { type: 'note', is_trashed: true } })
      .$.subscribe((docs) => {
        setCounts((prev) => ({ ...prev, trash: docs.length }));
      });

    return () => {
      subActive.unsubscribe();
      subTrash.unsubscribe();
    };
  }, [db, isReady]);

  return counts;
}
