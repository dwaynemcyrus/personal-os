

import { useEffect, useState } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import type { NoteDocument } from '@/lib/db';
import type { NoteGroup } from './useGroupedNotes';

function isTodayNote(note: NoteDocument): boolean {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayIso = todayStart.toISOString();
  return note.updated_at >= todayIso || note.created_at >= todayIso;
}

function isTodoNote(note: NoteDocument): boolean {
  return (note.content ?? '').includes('- [ ]');
}

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

    // Subscribe to all non-trashed, non-capture notes for most counts
    const subActive = db.notes
      .find({ selector: { is_trashed: false, inbox_at: null, note_type: null } })
      .$.subscribe((docs) => {
        const notes = docs.map((d) => d.toJSON() as NoteDocument);
        setCounts((prev) => ({
          ...prev,
          all: notes.length,
          today: notes.filter(isTodayNote).length,
          todo: notes.filter(isTodoNote).length,
          pinned: notes.filter((n) => n.is_pinned).length,
          locked: 0,
        }));
      });

    // Subscribe to trashed notes, excluding captures (they live in InboxWizard trash)
    const subTrash = db.notes
      .find({ selector: { is_trashed: true } })
      .$.subscribe((docs) => {
        const count = docs.filter((d) => d.note_type !== 'capture').length;
        setCounts((prev) => ({ ...prev, trash: count }));
      });

    return () => {
      subActive.unsubscribe();
      subTrash.unsubscribe();
    };
  }, [db, isReady]);

  return counts;
}
