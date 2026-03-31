import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { NoteGroup } from './useGroupedNotes';
import type { ItemRow } from '@/lib/db';
import { isTodayNote, isTodoNote } from '../noteUtils';

type GroupCounts = Record<NoteGroup, number>;

type NoteCounts = {
  all: number;
  today: number;
  todo: number;
  pinned: number;
  trash: number;
};

export function useNoteGroupCounts(): GroupCounts {
  const { data } = useQuery({
    queryKey: ['notes', 'counts'],
    queryFn: async (): Promise<NoteCounts> => {
      const { data, error } = await supabase
        .from('items')
        .select('id, updated_at, created_at, is_pinned, is_trashed, inbox_at, subtype, content')
        .eq('type', 'note');
      if (error) throw error;

      const notes = ((data ?? []) as unknown as ItemRow[]).filter((note) => note.subtype !== 'template');
      const activeNotes = notes.filter((note) => !note.is_trashed && !note.inbox_at);
      return {
        all: activeNotes.length,
        today: activeNotes.filter((note) => isTodayNote(note)).length,
        todo: activeNotes.filter((note) => isTodoNote(note)).length,
        pinned: activeNotes.filter((note) => note.is_pinned).length,
        trash: notes.filter((note) => note.is_trashed).length,
      };
    },
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

  return useMemo<GroupCounts>(() => ({
    all: data?.all ?? 0,
    today: data?.today ?? 0,
    todo: data?.todo ?? 0,
    pinned: data?.pinned ?? 0,
    locked: 0,
    trash: data?.trash ?? 0,
  }), [data]);
}
