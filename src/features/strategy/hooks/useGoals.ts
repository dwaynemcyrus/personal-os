import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { GoalItem, LeadMeasureItem } from '../types';

export type GoalWithMeasures = GoalItem & {
  leadMeasures: LeadMeasureItem[];
};

/** Fetches all goals for a cycle, each with their lead-measure children. */
export function useGoals(cycleId: string | null | undefined) {
  return useQuery({
    queryKey: ['strategy', 'goals', cycleId],
    enabled: !!cycleId,
    queryFn: async (): Promise<GoalWithMeasures[]> => {
      const { data: goalData, error } = await supabase
        .from('items')
        .select('*')
        .eq('type', '12-week-goal')
        .eq('parent_id', cycleId!)
        .eq('is_trashed', false)
        .order('created_at', { ascending: true });
      if (error) throw error;

      const goals = (goalData ?? []) as GoalItem[];
      if (goals.length === 0) return [];

      const goalIds = goals.map((g) => g.id);
      const { data: measureData, error: mError } = await supabase
        .from('items')
        .select('*')
        .eq('type', 'lead-measure')
        .in('parent_id', goalIds)
        .eq('is_trashed', false)
        .order('sort_order', { ascending: true, nullsFirst: false });
      if (mError) throw mError;

      const measures = (measureData ?? []) as LeadMeasureItem[];

      return goals.map((goal) => ({
        ...goal,
        leadMeasures: measures.filter((m) => m.parent_id === goal.id),
      }));
    },
    staleTime: 5 * 60_000,
  });
}

/** Fetches lead measures for a single goal. */
export function useLeadMeasures(goalId: string | null | undefined) {
  return useQuery({
    queryKey: ['strategy', 'lead-measures', goalId],
    enabled: !!goalId,
    queryFn: async (): Promise<LeadMeasureItem[]> => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('type', 'lead-measure')
        .eq('parent_id', goalId!)
        .eq('is_trashed', false)
        .order('sort_order', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as LeadMeasureItem[];
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Fetches all active lead measures across all goals in the active cycle.
 * Used by the daily review wizard and the Today view tactics surface.
 */
export function useAllLeadMeasures(cycleId: string | null | undefined) {
  return useQuery({
    queryKey: ['strategy', 'all-lead-measures', cycleId],
    enabled: !!cycleId,
    queryFn: async (): Promise<LeadMeasureItem[]> => {
      // First get active goal ids for the cycle
      const { data: goalData, error: gError } = await supabase
        .from('items')
        .select('id')
        .eq('type', '12-week-goal')
        .eq('parent_id', cycleId!)
        .eq('item_status', 'active')
        .eq('is_trashed', false);
      if (gError) throw gError;

      const goalIds = (goalData ?? []).map((g: { id: string }) => g.id);
      if (goalIds.length === 0) return [];

      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('type', 'lead-measure')
        .in('parent_id', goalIds)
        .eq('is_trashed', false)
        .order('sort_order', { ascending: true, nullsFirst: false });
      if (error) throw error;

      return (data ?? []) as LeadMeasureItem[];
    },
    staleTime: 5 * 60_000,
  });
}
