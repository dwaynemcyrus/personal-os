import { useEffect, useState } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import type { ItemDocument } from '@/lib/db';
import { isTodayNote, isTodoNote } from '../noteUtils';

export type NoteGroup = 'all' | 'todo' | 'today' | 'locked' | 'pinned' | 'trash';

export function useGroupedNotes(group: NoteGroup): {
  notes: ItemDocument[];
  isLoading: boolean;
} {
  const { db, isReady } = useDatabase();
  const [notes, setNotes] = useState<ItemDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!db || !isReady) return;

    if (group === 'locked') {
      setNotes([]);
      setIsLoading(false);
      return;
    }

    const selector =
      group === 'trash'
        ? ({ type: 'note' as const, is_trashed: true })
        : group === 'pinned'
          ? ({ type: 'note' as const, is_pinned: true, is_trashed: false, inbox_at: null })
          : ({ type: 'note' as const, is_trashed: false, inbox_at: null });

    const subscription = db.items
      .find({
        selector,
        sort: [{ is_pinned: 'desc' }, { updated_at: 'desc' }, { id: 'asc' }],
      })
      .$.subscribe((docs) => {
        let result = docs.map((doc) => doc.toJSON() as ItemDocument);

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
