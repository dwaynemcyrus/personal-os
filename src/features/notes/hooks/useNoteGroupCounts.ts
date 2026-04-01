import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { NoteGroup } from './useGroupedNotes';
import { isNotesListDocument, matchesNoteGroup } from './useGroupedNotes';
import type { DocumentRow } from '@/lib/db';

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
        .select('id, type, subtype, updated_at, created_at, date_trashed, content')
        .in('type', ['creation', 'transmission', 'journal']);
      if (error) throw error;

      const notes = ((data ?? []) as unknown as DocumentRow[]).filter(isNotesListDocument);
      return {
        all: notes.filter((note) => matchesNoteGroup(note, 'all')).length,
        today: notes.filter((note) => matchesNoteGroup(note, 'today')).length,
        todo: notes.filter((note) => matchesNoteGroup(note, 'todo')).length,
        pinned: notes.filter((note) => matchesNoteGroup(note, 'pinned')).length,
        trash: notes.filter((note) => matchesNoteGroup(note, 'trash')).length,
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
