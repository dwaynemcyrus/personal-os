/**
 * StrategyHomeSection — strategy-aware surface for the Today (NowView) page.
 *
 * Shows:
 *   1. Cycle transition banner — when the active cycle is past its end date
 *      or a transition is already in progress.
 *   2. Today's tactics — lead measures scheduled for today, with completion
 *      indicators. Tapping any row opens the DailyReviewWizard.
 *   3. Saturday nudge — when today is Saturday and no plan exists for next week.
 *
 * Renders its own portals for TransitionWizard and DailyReviewWizard so that
 * App.tsx doesn't need to import any strategy-specific wizard logic.
 */

import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigationActions } from '@/components/providers';
import { useTransitionState } from './hooks/useTransitionState';
import { useActiveCycle } from './hooks/useActiveCycle';
import { useGoals, useAllLeadMeasures } from './hooks/useGoals';
import { useWeeklyPlans } from './hooks/useWeeklyPlans';
import { useTacticEntries } from './hooks/useTacticEntries';
import { TransitionWizard } from './transition/TransitionWizard';
import { DailyReviewWizard } from './reviews/DailyReviewWizard';
import {
  todayIsoDate,
  filterLeadMeasuresByDay,
  isWeeklyPlanDue,
} from './strategyUtils';
import type { TacticEntryItem } from './types';
import styles from './StrategyHomeSection.module.css';

const STEP_LABELS: Record<number, string> = {
  1: '12-Week Review',
  2: '13th-Week Review',
  3: 'Arena Status',
  4: 'New Cycle',
  5: 'Goals',
};

export function StrategyHomeSection() {
  const { pushLayer } = useNavigationActions();
  const transitionInfo = useTransitionState();
  const { data: cycle } = useActiveCycle();

  const today = useMemo(() => todayIsoDate(), []);
  const todayDate = useMemo(() => new Date(`${today}T12:00:00`), [today]);
  // 0=Sun…6=Sat
  const dayOfWeek = todayDate.getDay();

  const { data: allLms } = useAllLeadMeasures(cycle?.id);
  const { data: goals } = useGoals(cycle?.id);
  const { data: plans } = useWeeklyPlans(cycle?.id);

  // Today's lead measures
  const todayLms = useMemo(
    () => filterLeadMeasuresByDay(allLms ?? [], dayOfWeek),
    [allLms, dayOfWeek],
  );
  const todayLmIds = useMemo(() => todayLms.map((lm) => lm.id), [todayLms]);

  // Tactic entries for today (to show completion state)
  const { data: todayEntries } = useTacticEntries(todayLmIds, today, today);

  const entryByLmId = useMemo(() => {
    const m = new Map<string, TacticEntryItem>();
    (todayEntries ?? []).forEach((e) => {
      if (e.parent_id) m.set(e.parent_id, e);
    });
    return m;
  }, [todayEntries]);

  // Goal name lookup
  const goalNameById = useMemo(() => {
    const m = new Map<string, string>();
    (goals ?? []).forEach((g) => m.set(g.id, g.title ?? ''));
    return m;
  }, [goals]);

  // Group today's lms by goal
  const tacticsByGoal = useMemo(() => {
    const groups = new Map<string, typeof todayLms>();
    todayLms.forEach((lm) => {
      if (!lm.parent_id) return;
      if (!groups.has(lm.parent_id)) groups.set(lm.parent_id, []);
      groups.get(lm.parent_id)!.push(lm);
    });
    return groups;
  }, [todayLms]);

  const showSaturdayNudge = !transitionInfo.isDue && isWeeklyPlanDue(plans ?? [], today);

  const [isTransitionOpen, setIsTransitionOpen] = useState(false);
  const [isDailyReviewOpen, setIsDailyReviewOpen] = useState(false);

  // Don't render anything while loading to avoid layout shift
  if (transitionInfo.isLoading) return null;

  const showTransitionBanner = transitionInfo.isDue;
  const showTactics = !!cycle && !transitionInfo.isDue;

  if (!showTransitionBanner && !showTactics && !showSaturdayNudge) return null;

  const stepLabel =
    transitionInfo.isInProgress && transitionInfo.currentStep > 0
      ? `Step ${transitionInfo.currentStep} of 5: ${STEP_LABELS[transitionInfo.currentStep] ?? ''}`
      : null;

  return (
    <>
      <div className={styles.section}>
        {showTransitionBanner && (
          <div className={styles.transitionBanner}>
            <div className={styles.bannerBody}>
              <div className={styles.bannerTitle}>
                🎯 {transitionInfo.cycleName ?? 'Cycle'} complete.
              </div>
              {stepLabel && (
                <div className={styles.bannerStep}>{stepLabel}</div>
              )}
            </div>
            <button
              type="button"
              className={styles.bannerBtn}
              onClick={() => setIsTransitionOpen(true)}
            >
              {transitionInfo.isInProgress ? 'Continue' : 'Start'}
            </button>
          </div>
        )}

        {showSaturdayNudge && (
          <div className={styles.transitionBanner}>
            <div className={styles.bannerBody}>
              <div className={styles.bannerTitle}>Plan next week</div>
              <div className={styles.bannerStep}>No weekly plan yet.</div>
            </div>
            <button
              type="button"
              className={styles.bannerBtn}
              onClick={() =>
                pushLayer({ view: 'strategy-detail', strategyId: 'weekly-plans' })
              }
            >
              Create →
            </button>
          </div>
        )}

        {showTactics && (
          <>
            <div className={styles.sectionLabel}>Today&apos;s tactics</div>

            {todayLms.length === 0 ? (
              <button
                type="button"
                className={styles.link}
                onClick={() => setIsDailyReviewOpen(true)}
              >
                Daily Review
                <span className={styles.linkArrow} aria-hidden="true">&rsaquo;</span>
              </button>
            ) : (
              <div className={styles.tacticsList}>
                {[...tacticsByGoal.entries()].map(([goalId, lms]) => (
                  <div key={goalId} className={styles.tacticGoalGroup}>
                    <div className={styles.tacticGoalLabel}>
                      {goalNameById.get(goalId) ?? ''}
                    </div>
                    {lms.map((lm) => {
                      const entry = entryByLmId.get(lm.id);
                      const done = entry?.completed ?? false;
                      return (
                        <button
                          key={lm.id}
                          type="button"
                          className={styles.tacticRow}
                          onClick={() => setIsDailyReviewOpen(true)}
                        >
                          <span
                            className={done ? styles.tacticCheckDone : styles.tacticCheck}
                            aria-hidden="true"
                          >
                            {done ? '✓' : '○'}
                          </span>
                          <span className={styles.tacticTitle}>{lm.title}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}

                <button
                  type="button"
                  className={styles.reviewLink}
                  onClick={() => setIsDailyReviewOpen(true)}
                >
                  Daily Review
                  <span className={styles.linkArrow} aria-hidden="true">&rsaquo;</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {typeof document !== 'undefined' &&
        transitionInfo.fromCycleId &&
        createPortal(
          <TransitionWizard
            open={isTransitionOpen}
            onOpenChange={setIsTransitionOpen}
            cycleId={transitionInfo.fromCycleId}
            cycleName={transitionInfo.cycleName ?? 'Cycle'}
            cycleIndex={transitionInfo.cycleIndex}
            stateId={transitionInfo.stateId}
            initialStep={transitionInfo.currentStep || 1}
            initialCompletedSteps={transitionInfo.completedSteps}
          />,
          document.body,
        )}

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
