

import { useEffect, useState } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import type { NoteDocument } from '@/lib/db';

export type NoteGroup = 'all' | 'todo' | 'today' | 'locked' | 'pinned' | 'trash';

function isTodayNote(note: NoteDocument): boolean {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayIso = todayStart.toISOString();
  return note.updated_at >= todayIso || note.created_at >= todayIso;
}

function isTodoNote(note: NoteDocument): boolean {
  return (note.content ?? '').includes('- [ ]');
}

export function useGroupedNotes(group: NoteGroup): {
  notes: NoteDocument[];
  isLoading: boolean;
} {
  const { db, isReady } = useDatabase();
  const [notes, setNotes] = useState<NoteDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!db || !isReady) return;

    // Locked group has no real data
    if (group === 'locked') {
      setNotes([]);
      setIsLoading(false);
      return;
    }

    const selector =
      group === 'trash'
        ? { is_trashed: true }
        : group === 'pinned'
          ? { is_pinned: true, is_trashed: false }
          : { is_trashed: false };

    const subscription = db.notes
      .find({
        selector,
        sort: [{ is_pinned: 'desc' }, { updated_at: 'desc' }, { id: 'asc' }],
      })
      .$.subscribe((docs) => {
        let result = docs.map((doc) => doc.toJSON() as NoteDocument);

        if (group === 'today') {
          result = result.filter(isTodayNote);
        } else if (group === 'todo') {
          result = result.filter(isTodoNote);
        }

        setNotes(result);
        setIsLoading(false);
      });

    return () => subscription.unsubscribe();
  }, [db, isReady, group]);

  return { notes, isLoading };
}
