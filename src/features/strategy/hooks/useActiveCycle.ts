import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { CycleOverviewItem } from '../types';

export function useActiveCycle() {
  return useQuery({
    queryKey: ['strategy', 'active-cycle'],
    queryFn: async (): Promise<CycleOverviewItem | null> => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('type', '12-week-overview')
        .eq('item_status', 'active')
        .eq('is_trashed', false)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as CycleOverviewItem | null;
    },
    staleTime: 5 * 60_000,
  });
}
