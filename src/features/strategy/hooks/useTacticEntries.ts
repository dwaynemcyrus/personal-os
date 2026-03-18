import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { TacticEntryItem } from '../types';

/**
 * Fetches tactic entries for a set of lead measure ids within a date range.
 * Used by the scorecard (weekly grid + cycle trend) and the weekly review wizard.
 */
export function useTacticEntries(
  leadMeasureIds: string[],
  startDate: string,
  endDate: string,
) {
  return useQuery({
    queryKey: ['strategy', 'tactic-entries', leadMeasureIds.join(','), startDate, endDate],
    enabled: leadMeasureIds.length > 0,
    queryFn: async (): Promise<TacticEntryItem[]> => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('type', 'tactic-entry')
        .in('parent_id', leadMeasureIds)
        .eq('is_trashed', false)
        .gte('period_start', startDate)
        .lte('period_start', endDate)
        .order('period_start', { ascending: true });
      if (error) throw error;
      return (data ?? []) as TacticEntryItem[];
    },
    staleTime: 60_000,
  });
}

/** Fetches a single tactic entry for a lead measure on a specific date. */
export function useTacticEntryForDay(
  leadMeasureId: string | null | undefined,
  date: string,
) {
  return useQuery({
    queryKey: ['strategy', 'tactic-entry', leadMeasureId, date],
    enabled: !!leadMeasureId,
    queryFn: async (): Promise<TacticEntryItem | null> => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('type', 'tactic-entry')
        .eq('parent_id', leadMeasureId!)
        .eq('period_start', date)
        .eq('is_trashed', false)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as TacticEntryItem | null;
    },
    staleTime: 30_000,
  });
}
