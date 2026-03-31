import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ItemRow } from '@/lib/db';
import { isTodayNote, isTodoNote } from '../noteUtils';

export type NoteGroup = 'all' | 'todo' | 'today' | 'locked' | 'pinned' | 'trash';

const NOTE_LIST_COLS = 'id, title, filename, updated_at, created_at, is_pinned, is_trashed, inbox_at, tags, content';

export function useGroupedNotes(group: NoteGroup): {
  notes: ItemRow[];
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery({
    queryKey: ['notes', 'list', group],
    queryFn: async (): Promise<ItemRow[]> => {
      if (group === 'locked') return [];

      const { data, error } = await supabase
        .from('items')
        .select(NOTE_LIST_COLS)
        .eq('type', 'note')
        .order('updated_at', { ascending: false });
      if (error) throw error;

      const notes = ((data ?? []) as unknown as ItemRow[]).filter((note) => note.subtype !== 'template');

      const filtered = notes.filter((note) => {
        if (group === 'trash') return note.is_trashed;
        if (note.is_trashed || note.inbox_at) return false;
        if (group === 'pinned') return note.is_pinned;
        if (group === 'today') return isTodayNote(note);
        if (group === 'todo') return isTodoNote(note);
        return true;
      });

      return filtered.sort((a, b) => {
        if (group !== 'trash' && a.is_pinned !== b.is_pinned) {
          return a.is_pinned ? -1 : 1;
        }
        return (b.updated_at ?? '').localeCompare(a.updated_at ?? '');
      });
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  return { notes: data ?? [], isLoading };
}
