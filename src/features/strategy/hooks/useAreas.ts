import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { AreaItem, AreaStatus } from '../types';

export function useAreas() {
  return useQuery({
    queryKey: ['strategy', 'areas'],
    queryFn: async (): Promise<AreaItem[]> => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('type', 'area')
        .eq('is_trashed', false)
        .order('title', { ascending: true });
      if (error) throw error;
      return (data ?? []) as AreaItem[];
    },
    staleTime: 60_000,
  });
}

/** Returns areas grouped by their cycle status. */
export function useAreasByStatus(areas: AreaItem[]) {
  const grouped: Record<AreaStatus, AreaItem[]> = {
    active: [],
    maintenance: [],
    waiting: [],
  };
  for (const area of areas) {
    const status = (area.item_status as AreaStatus) ?? 'waiting';
    if (status in grouped) {
      grouped[status].push(area);
    } else {
      grouped.waiting.push(area);
    }
  }
  return grouped;
}
