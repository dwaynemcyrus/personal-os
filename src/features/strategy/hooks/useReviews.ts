import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type {
  DailyReviewItem,
  WeeklyReviewItem,
  CycleReviewItem,
  ThirteenthWeekReviewItem,
  AnnualReviewItem,
} from '../types';

export type ReviewsData = {
  dailyReviews: DailyReviewItem[];
  weeklyReviews: WeeklyReviewItem[];
  cycleReviews: CycleReviewItem[];
  thirteenthWeekReviews: ThirteenthWeekReviewItem[];
  annualReviews: AnnualReviewItem[];
};

/**
 * Fetches the most recent reviews of each type.
 * Pass a higher limit to fetch more (e.g. when "Show all..." is expanded).
 */
export function useReviews(limit = 10) {
  return useQuery({
    queryKey: ['strategy', 'reviews', limit],
    queryFn: async (): Promise<ReviewsData> => {
      const [daily, weekly, cycle, thirteenth, annual] = await Promise.all([
        supabase
          .from('items')
          .select('*')
          .eq('type', 'daily-review')
          .eq('is_trashed', false)
          .order('period_start', { ascending: false })
          .limit(limit),
        supabase
          .from('items')
          .select('*')
          .eq('type', 'weekly-review')
          .eq('is_trashed', false)
          .order('period_start', { ascending: false })
          .limit(limit),
        supabase
          .from('items')
          .select('*')
          .eq('type', '12-week-review')
          .eq('is_trashed', false)
          .order('period_start', { ascending: false })
          .limit(limit),
        supabase
          .from('items')
          .select('*')
          .eq('type', '13th-week-review')
          .eq('is_trashed', false)
          .order('period_start', { ascending: false })
          .limit(limit),
        supabase
          .from('items')
          .select('*')
          .eq('type', 'annual-review')
          .eq('is_trashed', false)
          .order('period_start', { ascending: false })
          .limit(limit),
      ]);

      return {
        dailyReviews: (daily.data ?? []) as DailyReviewItem[],
        weeklyReviews: (weekly.data ?? []) as WeeklyReviewItem[],
        cycleReviews: (cycle.data ?? []) as CycleReviewItem[],
        thirteenthWeekReviews: (thirteenth.data ?? []) as ThirteenthWeekReviewItem[],
        annualReviews: (annual.data ?? []) as AnnualReviewItem[],
      };
    },
    staleTime: 60_000,
  });
}

/** Fetches daily reviews for a specific weekly plan (used by weekly review wizard). */
export function useDailyReviewsForWeek(weeklyPlanId: string | null | undefined) {
  return useQuery({
    queryKey: ['strategy', 'daily-reviews-for-week', weeklyPlanId],
    enabled: !!weeklyPlanId,
    queryFn: async (): Promise<DailyReviewItem[]> => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('type', 'daily-review')
        .eq('parent_id', weeklyPlanId!)
        .eq('is_trashed', false)
        .order('period_start', { ascending: true });
      if (error) throw error;
      return (data ?? []) as DailyReviewItem[];
    },
    staleTime: 60_000,
  });
}
