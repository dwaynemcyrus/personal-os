import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { DocumentRow } from '@/lib/db';

export type TemplateItem = Pick<DocumentRow, 'id' | 'title' | 'subtype'>;

/**
 * Shared hook for fetching the list of global template documents.
 * Backed by the ['document-templates'] react-query cache key.
 */
export function useTemplates(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  return useQuery({
    queryKey: ['document-templates'],
    queryFn: async (): Promise<TemplateItem[]> => {
      const { data, error } = await supabase
        .from('items')
        .select('id, title, subtype')
        .eq('type', 'template')
        .is('date_trashed', null)
        .order('title', { ascending: true });
      if (error) throw error;
      return (data ?? []) as TemplateItem[];
    },
    staleTime: 60_000,
    enabled,
  });
}
