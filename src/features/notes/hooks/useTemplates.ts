import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ItemRow } from '@/lib/db';

export type TemplateItem = Pick<ItemRow, 'id' | 'title'>;

/**
 * Shared hook for fetching the list of template notes.
 * Backed by the ['notes', 'templates'] react-query cache key.
 */
export function useTemplates(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  return useQuery({
    queryKey: ['notes', 'templates'],
    queryFn: async (): Promise<TemplateItem[]> => {
      const { data } = await supabase
        .from('items')
        .select('id, title')
        .eq('type', 'note')
        .eq('subtype', 'template')
        .eq('is_trashed', false)
        .order('title', { ascending: true });
      return (data ?? []) as TemplateItem[];
    },
    staleTime: 60_000,
    enabled,
  });
}
