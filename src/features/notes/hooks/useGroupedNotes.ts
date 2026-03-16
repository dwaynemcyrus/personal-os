import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ItemRow } from '@/lib/db';

export type NoteGroup = 'all' | 'todo' | 'today' | 'locked' | 'pinned' | 'trash';

// Only fetch columns needed for list display — content stays in item_content
const NOTE_LIST_COLS = 'id, title, filename, updated_at, created_at, is_pinned, is_trashed, inbox_at, has_todos';

export function useGroupedNotes(group: NoteGroup): {
  notes: ItemRow[];
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery({
    queryKey: ['notes', 'list', group],
    queryFn: async (): Promise<ItemRow[]> => {
      if (group === 'locked') return [];

      const todayIso = new Date().toISOString().slice(0, 10);
      let query = supabase
        .from('items')
        .select(NOTE_LIST_COLS)
        .eq('type', 'note');

      if (group === 'trash') {
        query = query.eq('is_trashed', true).order('updated_at', { ascending: false });
      } else if (group === 'pinned') {
        query = query
          .eq('is_pinned', true)
          .eq('is_trashed', false)
          .is('inbox_at', null)
          .order('updated_at', { ascending: false });
      } else if (group === 'today') {
        query = query
          .eq('is_trashed', false)
          .is('inbox_at', null)
          .or(`updated_at.gte.${todayIso},created_at.gte.${todayIso}`)
          .order('updated_at', { ascending: false });
      } else if (group === 'todo') {
        query = query
          .eq('is_trashed', false)
          .is('inbox_at', null)
          .eq('has_todos', true)
          .order('is_pinned', { ascending: false })
          .order('updated_at', { ascending: false });
      } else {
        // 'all'
        query = query
          .eq('is_trashed', false)
          .is('inbox_at', null)
          .order('is_pinned', { ascending: false })
          .order('updated_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as ItemRow[];
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  return { notes: data ?? [], isLoading };
}
