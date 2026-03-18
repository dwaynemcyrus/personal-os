import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { useNavigationActions } from '@/components/providers';
import { supabase } from '@/lib/supabase';
import { useDailyReviewsForWeek } from '../hooks/useReviews';
import type { WeeklyPlanItem } from '../types';
import { formatDisplayDate, formatWeekRange, todayIsoDate } from '../strategyUtils';
import { DailyReviewWizard } from '../reviews/DailyReviewWizard';
import { ViewShell, viewStyles } from './ViewShell';
import { StrategyEditor } from './StrategyEditor';
import styles from './WeeklyPlanDetailView.module.css';

type Props = { planId: string; onBack: () => void };

function useWeeklyPlan(planId: string) {
  return useQuery({
    queryKey: ['strategy', 'weekly-plan', planId],
    queryFn: async (): Promise<WeeklyPlanItem | null> => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', planId)
        .maybeSingle();
      if (error) throw error;
      return data as WeeklyPlanItem | null;
    },
    staleTime: 5 * 60_000,
  });
}

export function WeeklyPlanDetailView({ planId, onBack }: Props) {
  const { pushLayer } = useNavigationActions();
  const { data: plan, isLoading: planLoading } = useWeeklyPlan(planId);
  const { data: dailyReviews, isLoading: reviewsLoading } = useDailyReviewsForWeek(planId);
  const [isDailyReviewOpen, setIsDailyReviewOpen] = useState(false);

  const loading = planLoading || reviewsLoading;

  const range =
    plan?.period_start && plan?.period_end
      ? formatWeekRange(plan.period_start, plan.period_end)
      : '';
  const weekLabel = plan?.sort_order ? `Week ${plan.sort_order}` : 'Weekly Plan';

  const navigateToReview = (reviewId: string) => {
    pushLayer({ view: 'strategy-detail', strategyId: `document:${reviewId}` });
  };

  // Show "+" only when this plan covers today (so the daily review makes sense)
  const today = todayIsoDate();
  const isPlanCurrent =
    plan?.period_start != null &&
    plan?.period_end != null &&
    today >= plan.period_start &&
    today <= plan.period_end;

  const addButton = isPlanCurrent ? (
    <button
      type="button"
      className={viewStyles.addBtn}
      aria-label="Start daily review"
      onClick={() => setIsDailyReviewOpen(true)}
    >
      +
    </button>
  ) : undefined;

  return (
    <>
    <ViewShell title={range || weekLabel} onBack={onBack} rightSlot={addButton}>
      {loading && <p className={viewStyles.loadingState}>Loading…</p>}

      {!loading && plan && (
        <>
          <div className={styles.meta}>
            <span className={styles.weekLabel}>{weekLabel}</span>
            {range && <span className={styles.range}>{range}</span>}
          </div>

          <div className={viewStyles.divider} />
          <StrategyEditor itemId={plan.id} fallbackContent={plan.content} />

          {(dailyReviews ?? []).length > 0 && (
            <>
              <div className={viewStyles.divider} />
              <div className={viewStyles.sectionLabel}>Daily reviews</div>
              {(dailyReviews ?? []).map((review) => (
                <button
                  key={review.id}
                  type="button"
                  className={viewStyles.row}
                  onClick={() => navigateToReview(review.id)}
                >
                  <div className={viewStyles.rowBody}>
                    <div className={viewStyles.rowTitle}>
                      {formatDisplayDate(review.period_start)}
                    </div>
                    {review.progress != null && (
                      <div className={viewStyles.rowSubtitle}>Score: {review.progress}%</div>
                    )}
                  </div>
                  <div className={viewStyles.rowRight}>
                    <span className={viewStyles.rowChevron}>›</span>
                  </div>
                </button>
              ))}
            </>
          )}
        </>
      )}
    </ViewShell>

      {typeof document !== 'undefined' &&
        createPortal(
          <DailyReviewWizard
            open={isDailyReviewOpen}
            onOpenChange={setIsDailyReviewOpen}
          />,
          document.body,
        )}
    </>
  );
}
