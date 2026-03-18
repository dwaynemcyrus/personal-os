import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { WeeklyPlanItem } from '../types';
import { todayIsoDate } from '../strategyUtils';

/** Fetches all weekly plans for a given cycle, ordered by cycle week. */
export function useWeeklyPlans(cycleId: string | null | undefined) {
  return useQuery({
    queryKey: ['strategy', 'weekly-plans', cycleId],
    enabled: !!cycleId,
    queryFn: async (): Promise<WeeklyPlanItem[]> => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('type', 'weekly-plan')
        .eq('parent_id', cycleId!)
        .eq('is_trashed', false)
        .order('sort_order', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as WeeklyPlanItem[];
    },
    staleTime: 60_000,
  });
}

/** Fetches the weekly plan whose date range covers today. */
export function useCurrentWeekPlan() {
  const today = todayIsoDate();
  return useQuery({
    queryKey: ['strategy', 'current-week-plan', today],
    queryFn: async (): Promise<WeeklyPlanItem | null> => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('type', 'weekly-plan')
        .eq('is_trashed', false)
        .lte('period_start', today)
        .gte('period_end', today)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as WeeklyPlanItem | null;
    },
    staleTime: 5 * 60_000,
  });
}
