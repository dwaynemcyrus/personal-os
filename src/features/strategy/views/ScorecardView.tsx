import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useActiveCycle } from '../hooks/useActiveCycle';
import { useWeeklyPlans } from '../hooks/useWeeklyPlans';
import { useAllLeadMeasures } from '../hooks/useGoals';
import { useTacticEntries } from '../hooks/useTacticEntries';
import type { WeeklyReviewItem, TacticEntryItem } from '../types';
import {
  formatWeekRange,
  todayIsoDate,
  calcWeekBounds,
  weekDays,
  frequencyMatchesDay,
  calcCurrentCycleWeek,
} from '../strategyUtils';
import { ViewShell, viewStyles } from './ViewShell';
import styles from './ScorecardView.module.css';

type Props = { onBack: () => void };

const DAY_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function useWeeklyReviewsForPlans(planIds: string[]) {
  return useQuery({
    queryKey: ['strategy', 'weekly-reviews-for-plans', planIds.join(',')],
    enabled: planIds.length > 0,
    queryFn: async (): Promise<WeeklyReviewItem[]> => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('type', 'weekly-review')
        .in('parent_id', planIds)
        .eq('is_trashed', false);
      if (error) throw error;
      return (data ?? []) as WeeklyReviewItem[];
    },
    staleTime: 60_000,
  });
}

function ScoreBar({ pct }: { pct: number }) {
  const color =
    pct >= 80 ? 'rgba(74, 163, 90, 0.8)' : pct >= 50 ? 'rgba(200, 162, 48, 0.8)' : 'rgba(200, 80, 80, 0.7)';
  return (
    <div className={styles.barTrack}>
      <div className={styles.barFill} style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export function ScorecardView({ onBack }: Props) {
  const { data: cycle, isLoading: cycleLoading } = useActiveCycle();
  const { data: plans, isLoading: plansLoading } = useWeeklyPlans(cycle?.id);
  const { data: allLms, isLoading: lmsLoading } = useAllLeadMeasures(cycle?.id);

  const planIds = useMemo(() => (plans ?? []).map((p) => p.id), [plans]);
  const allLmIds = useMemo(() => (allLms ?? []).map((lm) => lm.id), [allLms]);

  const { data: reviews, isLoading: reviewsLoading } = useWeeklyReviewsForPlans(planIds);

  const today = useMemo(() => todayIsoDate(), []);
  const { start: weekStart, end: weekEnd } = useMemo(() => calcWeekBounds(today), [today]);
  const days = useMemo(() => weekDays(today), [today]);

  const { data: tacticEntries, isLoading: entriesLoading } = useTacticEntries(
    allLmIds,
    weekStart,
    weekEnd,
  );

  const entryByLmDate = useMemo(() => {
    const m = new Map<string, Map<string, TacticEntryItem>>();
    (tacticEntries ?? []).forEach((e) => {
      if (!e.parent_id || !e.period_start) return;
      if (!m.has(e.parent_id)) m.set(e.parent_id, new Map());
      m.get(e.parent_id)!.set(e.period_start.slice(0, 10), e);
    });
    return m;
  }, [tacticEntries]);

  const reviewByPlanId = useMemo(
    () => new Map((reviews ?? []).map((r) => [r.parent_id, r])),
    [reviews],
  );

  // Current week score from tactic entries.
  // Show — (null) when no entries exist yet this week, even if tactics are scheduled.
  const currentWeekScore = useMemo(() => {
    if ((tacticEntries ?? []).length === 0) return null;
    let scheduled = 0;
    let completed = 0;
    (allLms ?? []).forEach((lm) => {
      days.forEach((dayIso, i) => {
        const dow = (i + 1) % 7; // Mon=1…Sun=0
        if (!frequencyMatchesDay(lm.frequency, dow)) return;
        scheduled++;
        const entry = entryByLmDate.get(lm.id)?.get(dayIso);
        if (entry?.completed) completed++;
      });
    });
    return scheduled > 0 ? Math.round((completed / scheduled) * 100) : null;
  }, [allLms, days, entryByLmDate, tacticEntries]);

  const currentWeekNum = cycle?.period_start ? calcCurrentCycleWeek(cycle.period_start) : null;

  // Cycle trend: map plans to their weekly review scores
  const scores = useMemo(
    () =>
      (plans ?? [])
        .filter((p) => p.period_start && p.period_end)
        .map((p) => {
          const review = reviewByPlanId.get(p.id);
          const score = review?.progress ?? null;
          return { plan: p, score };
        }),
    [plans, reviewByPlanId],
  );

  const completed = scores.filter((s) => s.score != null);
  const avg =
    completed.length > 0
      ? Math.round(completed.reduce((sum, s) => sum + s.score!, 0) / completed.length)
      : null;

  const loading = cycleLoading || plansLoading || reviewsLoading || lmsLoading || entriesLoading;
  const hasLms = (allLms ?? []).length > 0;

  return (
    <ViewShell title="Scorecard" onBack={onBack}>
      {loading && <p className={viewStyles.loadingState}>Loading…</p>}

      {!loading && !cycle && (
        <p className={viewStyles.emptyState}>No active cycle.</p>
      )}

      {!loading && cycle && (
        <>
          {/* Current week tactic grid */}
          {hasLms && (
            <>
              <div className={styles.currentWeekHeader}>
                {currentWeekNum != null ? `Week ${currentWeekNum}` : 'This week'}
                {currentWeekScore != null
                  ? ` · ${currentWeekScore}%`
                  : ' · —'}
              </div>

              <div className={styles.gridWrapper}>
                <div className={styles.gridHeaderRow}>
                  <div className={styles.gridName} />
                  {DAY_HEADERS.map((d, i) => (
                    <div key={i} className={styles.gridDayHeader}>{d}</div>
                  ))}
                </div>

                {(allLms ?? []).map((lm) => (
                  <div key={lm.id} className={styles.gridRow}>
                    <div className={styles.gridName}>{lm.title}</div>
                    {days.map((dayIso, i) => {
                      const dow = (i + 1) % 7;
                      const scheduled = frequencyMatchesDay(lm.frequency, dow);
                      if (!scheduled) {
                        return <div key={i} className={styles.gridCellNone} />;
                      }
                      const entry = entryByLmDate.get(lm.id)?.get(dayIso);
                      const done = entry?.completed ?? false;
                      return (
                        <div
                          key={i}
                          className={done ? styles.gridCellDone : styles.gridCellScheduled}
                        >
                          {done ? '✓' : '·'}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className={viewStyles.divider} />
            </>
          )}

          {/* Cycle trend */}
          {scores.length > 0 && (
            <>
              <div className={styles.trendLabel}>Cycle trend</div>

              {avg != null && (
                <div className={styles.avgCard}>
                  <div className={styles.avgLabel}>Cycle average</div>
                  <div className={styles.avgValue}>{avg}%</div>
                </div>
              )}

              {scores.map(({ plan, score }) => (
                <div key={plan.id} className={styles.weekRow}>
                  <div className={styles.weekInfo}>
                    <div className={styles.weekNum}>Week {plan.sort_order ?? '—'}</div>
                    <div className={styles.weekRange}>
                      {plan.period_start && plan.period_end
                        ? formatWeekRange(plan.period_start, plan.period_end)
                        : ''}
                    </div>
                  </div>
                  <div className={styles.weekScore}>
                    {score != null ? (
                      <>
                        <ScoreBar pct={score} />
                        <span className={styles.scorePct}>{score}%</span>
                      </>
                    ) : (
                      <span className={styles.noScore}>—</span>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}

          {!hasLms && scores.length === 0 && (
            <p className={viewStyles.emptyState}>No goals or weekly plans yet.</p>
          )}
        </>
      )}
    </ViewShell>
  );
}
