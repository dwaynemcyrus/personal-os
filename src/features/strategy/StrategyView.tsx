import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigationState, useNavigationActions } from '@/components/providers';
import { useStrategyList } from './hooks/useStrategyList';
import { calcCurrentCycleWeek } from './strategyUtils';
import { StrategyEmptyState } from './StrategyEmptyState';
import { StrategyDetailRouter } from './StrategyDetailRouter';
import { SetupWizard } from './wizard/SetupWizard';
import { CreateDocSheet } from './create/CreateDocSheet';
import { TransitionWizard } from './transition/TransitionWizard';
import { useTransitionState } from './hooks/useTransitionState';
import type { TransitionInfo } from './hooks/useTransitionState';
import { useLiveWeekScore } from './hooks/useLiveWeekScore';
import { StrategyMenuSheet } from './menu/StrategyMenuSheet';
import type { DocType } from './create/CreateDocSheet';
import styles from './StrategyView.module.css';

// ── Helpers ───────────────────────────────────────────────────────────────────

const TRANSITION_STEP_LABELS: Record<number, string> = {
  1: '12-Week Review',
  2: '13th-Week Review',
  3: 'Area Status',
  4: 'New Cycle',
  5: 'Goals',
};

function getStepLabel(step: number): string {
  return TRANSITION_STEP_LABELS[step] ?? `Step ${step}`;
}

// ── Plans list ────────────────────────────────────────────────────────────────

function PlansList({
  onOpenWizard,
  onOpenCreate,
  onOpenTransition,
  transitionInfo,
}: {
  onOpenWizard: () => void;
  onOpenCreate: () => void;
  onOpenTransition: () => void;
  transitionInfo: TransitionInfo;
}) {
  const { pushLayer } = useNavigationActions();
  const { data, isLoading } = useStrategyList();
  const liveWeekScore = useLiveWeekScore();
  const [manualStarted, setManualStarted] = useState(false);

  const activeCycle = data?.activeCycle ?? null;
  const showEmptyState = !isLoading && !activeCycle && (data?.areaCount ?? 0) === 0 && !manualStarted;

  // Derived subtitles
  const cycleSubtitle = (() => {
    if (!activeCycle) return null;
    const week = calcCurrentCycleWeek(activeCycle.period_start!);
    const clampedWeek = Math.min(week, 12);
    if (week > 12) return `${activeCycle.title} · Transition week`;
    return `${activeCycle.title} · Week ${clampedWeek} of 12`;
  })();

  const scorecardSubtitle = (() => {
    if (liveWeekScore != null) return `This week: ${liveWeekScore}%`;
    if (data?.currentWeekScore != null) return `This week: ${data.currentWeekScore}%`;
    if (activeCycle) return 'No score yet';
    return null;
  })();

  const navigate = (sectionId: string) => {
    pushLayer({ view: 'strategy-detail', strategyId: sectionId });
  };

  if (showEmptyState) {
    return (
      <StrategyEmptyState
        onGuidedSetup={onOpenWizard}
        onManualStart={() => setManualStarted(true)}
      />
    );
  }

  return (
    <div className={styles.list}>
      {transitionInfo.isDue && (
        <div className={styles.transitionBanner}>
          <div className={styles.transitionBannerBody}>
            <div className={styles.transitionBannerTitle}>
              {transitionInfo.cycleName ?? 'Cycle'} complete.
            </div>
            {transitionInfo.isInProgress && transitionInfo.currentStep > 0 && (
              <div className={styles.transitionBannerStep}>
                Step {transitionInfo.currentStep} of 5: {getStepLabel(transitionInfo.currentStep)}
              </div>
            )}
          </div>
          <button
            type="button"
            className={styles.transitionBannerBtn}
            onClick={onOpenTransition}
          >
            {transitionInfo.isInProgress ? 'Continue' : 'Start transition'}
          </button>
        </div>
      )}

      {activeCycle && (
        <>
          <button
            type="button"
            className={styles.row}
            onClick={() => navigate('current-cycle')}
          >
            <div className={styles.rowBody}>
              <div className={styles.rowTitle}>Current Cycle</div>
              {cycleSubtitle && <div className={styles.rowSubtitle}>{cycleSubtitle}</div>}
            </div>
            <div className={styles.rowRight}>
              <span className={styles.rowChevron}>›</span>
            </div>
          </button>

          <button
            type="button"
            className={styles.row}
            onClick={() => navigate('scorecard')}
          >
            <div className={styles.rowBody}>
              <div className={styles.rowTitle}>Scorecard</div>
              {scorecardSubtitle && (
                <div className={styles.rowSubtitle}>{scorecardSubtitle}</div>
              )}
            </div>
            <div className={styles.rowRight}>
              <span className={styles.rowChevron}>›</span>
            </div>
          </button>

          <div className={styles.divider} />
        </>
      )}

      <button
        type="button"
        className={styles.row}
        onClick={() => navigate('weekly-plans')}
      >
        <div className={styles.rowBody}>
          <div className={styles.rowTitle}>Weekly Plans</div>
        </div>
        <div className={styles.rowRight}>
          {(data?.weeklyPlanCount ?? 0) > 0 && (
            <span className={styles.rowCount}>{data!.weeklyPlanCount}</span>
          )}
          <span className={styles.rowChevron}>›</span>
        </div>
      </button>

      <button
        type="button"
        className={styles.row}
        onClick={() => navigate('reviews')}
      >
        <div className={styles.rowBody}>
          <div className={styles.rowTitle}>Reviews</div>
        </div>
        <div className={styles.rowRight}>
          {(data?.reviewCount ?? 0) > 0 && (
            <span className={styles.rowCount}>{data!.reviewCount}</span>
          )}
          <span className={styles.rowChevron}>›</span>
        </div>
      </button>

      <button
        type="button"
        className={styles.row}
        onClick={() => navigate('life-areas')}
      >
        <div className={styles.rowBody}>
          <div className={styles.rowTitle}>Life Areas</div>
        </div>
        <div className={styles.rowRight}>
          {(data?.areaCount ?? 0) > 0 && (
            <span className={styles.rowCount}>{data!.areaCount}</span>
          )}
          <span className={styles.rowChevron}>›</span>
        </div>
      </button>

      <button
        type="button"
        className={styles.row}
        onClick={() => navigate('archive')}
      >
        <div className={styles.rowBody}>
          <div className={styles.rowTitle}>Archive</div>
        </div>
        <div className={styles.rowRight}>
          {(data?.archivedCycleCount ?? 0) > 0 && (
            <span className={styles.rowCount}>{data!.archivedCycleCount}</span>
          )}
          <span className={styles.rowChevron}>›</span>
        </div>
      </button>

      <div className={styles.divider} />

      <button
        type="button"
        className={styles.createRow}
        onClick={onOpenCreate}
      >
        Create new…
      </button>

    </div>
  );
}

// ── Shell root ────────────────────────────────────────────────────────────────

export function StrategyView() {
  const { stack } = useNavigationState();
  const { pushLayer } = useNavigationActions();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isTransitionOpen, setIsTransitionOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [createInitialType, setCreateInitialType] = useState<DocType | undefined>(undefined);
  const transitionInfo = useTransitionState();
  const topLayer = stack[stack.length - 1];

  if (topLayer?.view === 'strategy-detail') {
    return <StrategyDetailRouter strategyId={topLayer.strategyId} />;
  }

  return (
    <>
      <div className={styles.shell}>
        <header className={styles.header}>
          <span />
          <span className={styles.headerTitle}>Plans</span>
          <button
            type="button"
            className={styles.headerAction}
            aria-label="Plans menu"
            onClick={() => setIsMenuOpen(true)}
          >
            <MenuIcon />
          </button>
        </header>

        <PlansList
          onOpenWizard={() => setIsWizardOpen(true)}
          onOpenCreate={() => setIsCreateOpen(true)}
          onOpenTransition={() => setIsTransitionOpen(true)}
          transitionInfo={transitionInfo}
        />
      </div>

      {typeof document !== 'undefined' &&
        createPortal(
          <SetupWizard open={isWizardOpen} onOpenChange={setIsWizardOpen} />,
          document.body,
        )}

      {typeof document !== 'undefined' &&
        createPortal(
          <CreateDocSheet
            open={isCreateOpen}
            onOpenChange={(open) => {
              setIsCreateOpen(open);
              if (!open) setCreateInitialType(undefined);
            }}
            initialType={createInitialType}
          />,
          document.body,
        )}

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
          <StrategyMenuSheet
            open={isMenuOpen}
            onOpenChange={setIsMenuOpen}
            onWizard={() => setIsWizardOpen(true)}
            onCreate={(type) => {
              setCreateInitialType(type);
              setIsCreateOpen(true);
            }}
            onTemplates={() => pushLayer({ view: 'strategy-detail', strategyId: 'templates' })}
          />,
          document.body,
        )}
    </>
  );
}

function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="currentColor"
      width="20"
      height="20"
    >
      <circle cx="10" cy="4" r="1.5" />
      <circle cx="10" cy="10" r="1.5" />
      <circle cx="10" cy="16" r="1.5" />
    </svg>
  );
}
