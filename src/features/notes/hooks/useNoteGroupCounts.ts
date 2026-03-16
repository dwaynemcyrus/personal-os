import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { NoteGroup } from './useGroupedNotes';

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
      const { data, error } = await supabase.rpc('get_note_counts');
      if (error) {
        // Fallback: return zeros if RPC not yet deployed
        console.warn('[useNoteGroupCounts] get_note_counts RPC error:', error);
        return { all: 0, today: 0, todo: 0, pinned: 0, trash: 0 };
      }
      return (data ?? { all: 0, today: 0, todo: 0, pinned: 0, trash: 0 }) as NoteCounts;
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
