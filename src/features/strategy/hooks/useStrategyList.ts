import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { CycleOverviewItem, StrategyListData, WeeklyPlanItem } from '../types';
import { todayIsoDate } from '../strategyUtils';

export function useStrategyList() {
  return useQuery({
    queryKey: ['strategy', 'list'],
    queryFn: async (): Promise<StrategyListData> => {
      const today = todayIsoDate();

      // 1. Active cycle
      const { data: cycleData } = await supabase
        .from('items')
        .select('*')
        .eq('type', '12-week-overview')
        .eq('item_status', 'active')
        .eq('is_trashed', false)
        .limit(1)
        .maybeSingle();
      const activeCycle = cycleData as CycleOverviewItem | null;

      // 2. Active goal count
      let goalCount = 0;
      if (activeCycle) {
        const { count } = await supabase
          .from('items')
          .select('id', { count: 'exact', head: true })
          .eq('type', '12-week-goal')
          .eq('parent_id', activeCycle.id)
          .eq('is_trashed', false);
        goalCount = count ?? 0;
      }

      // 3. Current week's weekly plan (covers today)
      const { data: planData } = await supabase
        .from('items')
        .select('*')
        .eq('type', 'weekly-plan')
        .eq('is_trashed', false)
        .lte('period_start', today)
        .gte('period_end', today)
        .limit(1)
        .maybeSingle();
      const currentWeekPlan = planData as WeeklyPlanItem | null;

      // 4. Weekly plan count for active cycle
      let weeklyPlanCount = 0;
      if (activeCycle) {
        const { count } = await supabase
          .from('items')
          .select('id', { count: 'exact', head: true })
          .eq('type', 'weekly-plan')
          .eq('parent_id', activeCycle.id)
          .eq('is_trashed', false);
        weeklyPlanCount = count ?? 0;
      }

      // 5. This week's scorecard score from weekly-review
      let currentWeekScore: number | null = null;
      if (currentWeekPlan) {
        const { data: reviewData } = await supabase
          .from('items')
          .select('progress')
          .eq('type', 'weekly-review')
          .eq('parent_id', currentWeekPlan.id)
          .eq('is_trashed', false)
          .limit(1)
          .maybeSingle();
        if (reviewData?.progress != null) {
          currentWeekScore = reviewData.progress;
        }
      }

      // 6. Total review count (all types, not filtered by cycle — counts all reviews for the badge)
      const { count: reviewCount } = await supabase
        .from('items')
        .select('id', { count: 'exact', head: true })
        .in('type', ['daily-review', 'weekly-review', '12-week-review', '13th-week-review', 'annual-review'])
        .eq('is_trashed', false);

      // 7. Life arena count
      const { count: areaCount } = await supabase
        .from('items')
        .select('id', { count: 'exact', head: true })
        .eq('type', 'area')
        .eq('is_trashed', false);

      // 8. Archived cycle count
      const { count: archivedCycleCount } = await supabase
        .from('items')
        .select('id', { count: 'exact', head: true })
        .eq('type', '12-week-overview')
        .eq('item_status', 'archived')
        .eq('is_trashed', false);

      return {
        activeCycle,
        currentWeekPlan,
        currentWeekScore,
        goalCount,
        weeklyPlanCount,
        reviewCount: reviewCount ?? 0,
        areaCount: areaCount ?? 0,
        archivedCycleCount: archivedCycleCount ?? 0,
      };
    },
    staleTime: 60_000,
  });
}
