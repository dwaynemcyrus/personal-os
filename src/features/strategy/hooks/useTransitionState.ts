import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { todayIsoDate } from '../strategyUtils';
import type { CompletedSteps } from '../strategyMutations';

export type TransitionInfo = {
  isLoading: boolean;
  isDue: boolean;
  isInProgress: boolean;
  stateId: string | null;
  fromCycleId: string | null;
  cycleName: string | null;
  cycleIndex: number;
  currentStep: number;
  completedSteps: CompletedSteps;
};

type TransitionQueryResult = {
  cycle: { id: string; title: string; period_end: string | null } | null;
  state: {
    id: string;
    parent_id: string | null;
    sort_order: number | null;
    body: string | null;
    title: string | null;
  } | null;
};

export function useTransitionState(): TransitionInfo {
  const { data, isLoading } = useQuery({
    queryKey: ['strategy', 'transition-state'],
    queryFn: async (): Promise<TransitionQueryResult> => {
      const { data: cycleData } = await supabase
        .from('items')
        .select('id, title, period_end')
        .eq('type', '12-week-overview')
        .eq('item_status', 'active')
        .eq('is_trashed', false)
        .limit(1)
        .maybeSingle();

      const { data: stateData } = await supabase
        .from('items')
        .select('id, parent_id, sort_order, body, title')
        .eq('type', 'cycle-transition-state')
        .eq('subtype', 'active')
        .eq('is_trashed', false)
        .limit(1)
        .maybeSingle();

      return {
        cycle: cycleData as TransitionQueryResult['cycle'],
        state: stateData as TransitionQueryResult['state'],
      };
    },
    staleTime: 30_000,
  });

  const today = todayIsoDate();
  const cycle = data?.cycle ?? null;
  const state = data?.state ?? null;

  const isDue =
    (cycle != null && today > (cycle.period_end ?? '')) || state != null;

  const currentStep = state?.sort_order ?? 0;

  let completedSteps: CompletedSteps = {};
  if (state?.body) {
    try {
      completedSteps = JSON.parse(state.body).completed_steps ?? {};
    } catch {
      // ignore parse errors
    }
  }

  // Derive cycle index from title e.g. "12-Week 2026-2" → 2
  const cycleIndex =
    cycle?.title
      ? parseInt(cycle.title.match(/-(\d+)$/)?.[1] ?? '1', 10) || 1
      : 1;

  // Extract cycle name: from active cycle or from state item title
  const cycleName =
    cycle?.title ??
    (state?.title ? state.title.replace(/^Transition: /, '') : null);

  return {
    isLoading,
    isDue,
    isInProgress: state != null,
    stateId: state?.id ?? null,
    fromCycleId: state?.parent_id ?? cycle?.id ?? null,
    cycleName,
    cycleIndex,
    currentStep,
    completedSteps,
  };
}
