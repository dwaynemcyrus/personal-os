import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { DocumentRow } from '@/lib/db';

export type TemplateItem = Pick<DocumentRow, 'id' | 'type' | 'title' | 'subtype'>;

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
        .select('id, type, title, subtype')
        .eq('is_template', true)
        .is('date_trashed', null)
        .order('type', { ascending: true })
        .order('title', { ascending: true });
      if (error) throw error;
      return (data ?? []) as TemplateItem[];
    },
    staleTime: 60_000,
    enabled,
  });
}
