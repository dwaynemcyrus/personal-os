import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigationActions } from '@/components/providers';
import { useActiveCycle } from '../hooks/useActiveCycle';
import { useWeeklyPlans } from '../hooks/useWeeklyPlans';
import { formatWeekRange, todayIsoDate, isWeeklyPlanDue } from '../strategyUtils';
import { CreateDocSheet } from '../create/CreateDocSheet';
import { ViewShell, viewStyles } from './ViewShell';
import styles from './WeeklyPlansListView.module.css';

type Props = { onBack: () => void };

export function WeeklyPlansListView({ onBack }: Props) {
  const { pushLayer } = useNavigationActions();
  const { data: cycle, isLoading: cycleLoading } = useActiveCycle();
  const { data: plans, isLoading: plansLoading } = useWeeklyPlans(cycle?.id);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const loading = cycleLoading || plansLoading;
  const today = todayIsoDate();
  const showSaturdayNudge = !loading && isWeeklyPlanDue(plans ?? [], today);

  const navigate = (planId: string) => {
    pushLayer({ view: 'strategy-detail', strategyId: `weekly-plan:${planId}` });
  };

  const addButton = (
    <button
      type="button"
      className={viewStyles.addBtn}
      aria-label="Add weekly plan"
      onClick={() => setIsCreateOpen(true)}
    >
      +
    </button>
  );

  return (
    <>
    <ViewShell title="Weekly Plans" onBack={onBack} rightSlot={addButton}>
      {loading && <p className={viewStyles.loadingState}>Loading…</p>}

      {showSaturdayNudge && (
        <div className={styles.nudgeBanner}>
          <div className={styles.nudgeBody}>
            <div className={styles.nudgeTitle}>Plan next week</div>
            <div className={styles.nudgeHint}>No plan for next week yet.</div>
          </div>
          <button
            type="button"
            className={styles.nudgeBtn}
            onClick={() => setIsCreateOpen(true)}
          >
            Create →
          </button>
        </div>
      )}

      {!loading && (plans ?? []).length === 0 && (
        <p className={viewStyles.emptyState}>No weekly plans yet.</p>
      )}

      {!loading &&
        (plans ?? []).map((plan) => {
          const isCurrent =
            plan.period_start != null &&
            plan.period_end != null &&
            today >= plan.period_start &&
            today <= plan.period_end;
          const range =
            plan.period_start && plan.period_end
              ? formatWeekRange(plan.period_start, plan.period_end)
              : '';
          return (
            <button
              key={plan.id}
              type="button"
              className={viewStyles.row}
              onClick={() => navigate(plan.id)}
            >
              <div className={viewStyles.rowBody}>
                <div className={viewStyles.rowTitle}>
                  Week {plan.sort_order ?? '?'}
                  {isCurrent ? ' · Current' : ''}
                </div>
                {range && <div className={viewStyles.rowSubtitle}>{range}</div>}
              </div>
              <div className={viewStyles.rowRight}>
                <span className={viewStyles.rowChevron}>›</span>
              </div>
            </button>
          );
        })}
    </ViewShell>

      {typeof document !== 'undefined' &&
        createPortal(
          <CreateDocSheet
            open={isCreateOpen}
            onOpenChange={setIsCreateOpen}
            initialType="weekly-plan"
            context={{ cycleId: cycle?.id }}
            onCreated={(id) => {
              setIsCreateOpen(false);
              navigate(id);
            }}
          />,
          document.body,
        )}
    </>
  );
}
