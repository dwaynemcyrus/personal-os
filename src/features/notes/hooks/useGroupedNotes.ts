import { useEffect, useState } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import type { ItemDocument } from '@/lib/db';
import { isTodayNote } from '../noteUtils';

export type NoteGroup = 'all' | 'todo' | 'today' | 'locked' | 'pinned' | 'trash';

function getTodayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

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

    const baseActive = { type: 'note' as const, is_trashed: false, inbox_at: null };

    const selector =
      group === 'trash'
        ? { type: 'note' as const, is_trashed: true }
        : group === 'pinned'
          ? { type: 'note' as const, is_pinned: true, is_trashed: false, inbox_at: null }
          : group === 'today'
            ? { ...baseActive, updated_at: { $gte: getTodayIso() } }
            : group === 'todo'
              ? { ...baseActive, content: { $regex: '- \\[ \\]' } }
              : baseActive;

    const subscription = db.items
      .find({
        selector,
        sort: [{ is_pinned: 'desc' }, { updated_at: 'desc' }, { id: 'asc' }],
      })
      .$.subscribe((docs) => {
        let result = docs.map((doc) => doc.toJSON() as ItemDocument);

        // 'today' pre-filter narrows by updated_at but also needs created_at check
        if (group === 'today') {
          result = result.filter(isTodayNote);
        }

        setNotes(result);
        setIsLoading(false);
      });

    return () => subscription.unsubscribe();
  }, [db, isReady, group]);

  return { notes, isLoading };
}
