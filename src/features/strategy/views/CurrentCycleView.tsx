import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigationActions } from '@/components/providers';
import { useActiveCycle } from '../hooks/useActiveCycle';
import { useGoals } from '../hooks/useGoals';
import { calcCurrentCycleWeek, formatDisplayDate } from '../strategyUtils';
import { CreateDocSheet } from '../create/CreateDocSheet';
import { ViewShell, viewStyles } from './ViewShell';
import styles from './CurrentCycleView.module.css';

type Props = { onBack: () => void };

export function CurrentCycleView({ onBack }: Props) {
  const { pushLayer } = useNavigationActions();
  const { data: cycle, isLoading } = useActiveCycle();
  const { data: goals, isLoading: goalsLoading } = useGoals(cycle?.id);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const loading = isLoading || goalsLoading;

  const weekNum = cycle?.period_start ? calcCurrentCycleWeek(cycle.period_start) : null;
  const clampedWeek = weekNum != null ? Math.min(weekNum, 12) : null;
  const subtitle = weekNum != null
    ? (weekNum > 12 ? 'Transition week' : `Week ${clampedWeek} of 12`)
    : '';

  const navigateToGoal = (goalId: string) => {
    pushLayer({ view: 'strategy-detail', strategyId: `goal:${goalId}` });
  };

  const addButton = cycle ? (
    <button
      type="button"
      className={viewStyles.addBtn}
      aria-label="Add goal"
      onClick={() => setIsCreateOpen(true)}
    >
      +
    </button>
  ) : undefined;

  return (
    <>
    <ViewShell title="Current Cycle" onBack={onBack} rightSlot={addButton}>
      {loading && <p className={viewStyles.loadingState}>Loading…</p>}

      {!loading && !cycle && (
        <p className={viewStyles.emptyState}>No active cycle.</p>
      )}

      {!loading && cycle && (
        <>
          <div className={styles.cycleCard}>
            <div className={styles.cycleName}>{cycle.title}</div>
            <div className={styles.cycleMeta}>
              {formatDisplayDate(cycle.period_start)} – {formatDisplayDate(cycle.period_end)}
            </div>
            {subtitle && <div className={styles.cycleWeek}>{subtitle}</div>}
          </div>

          <div className={viewStyles.divider} />

          {(goals ?? []).length === 0 ? (
            <p className={viewStyles.emptyState}>No goals yet.</p>
          ) : (
            <>
              <div className={viewStyles.sectionLabel}>Goals</div>
              {(goals ?? []).map((goal) => (
                <button
                  key={goal.id}
                  type="button"
                  className={viewStyles.row}
                  onClick={() => navigateToGoal(goal.id)}
                >
                  <div className={viewStyles.rowBody}>
                    <div className={viewStyles.rowTitle}>{goal.title}</div>
                    {goal.description && (
                      <div className={viewStyles.rowSubtitle}>{goal.description}</div>
                    )}
                    {goal.leadMeasures.length > 0 && (
                      <div className={styles.tacticPills}>
                        {goal.leadMeasures.map((lm) => (
                          <span key={lm.id} className={styles.tacticPill}>
                            {lm.title}
                          </span>
                        ))}
                      </div>
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
          <CreateDocSheet
            open={isCreateOpen}
            onOpenChange={setIsCreateOpen}
            initialType="12-week-goal"
            context={{ cycleId: cycle?.id }}
            onCreated={(id) => {
              setIsCreateOpen(false);
              pushLayer({ view: 'strategy-detail', strategyId: `goal:${id}` });
            }}
          />,
          document.body,
        )}
    </>
  );
}
