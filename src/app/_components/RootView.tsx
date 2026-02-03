/**
 * RootView
 *
 * Renders the appropriate view based on navigation context.
 * Single entry point for all context-based content.
 */

'use client';

import { useNavigationState } from '@/components/providers';
import { ExecutionView } from './ExecutionView';
import { KnowledgeView } from './KnowledgeView';
import { StrategyView } from './StrategyView';
import { useTimer } from '@/features/timer';
import styles from '../page.module.css';

function TodayView() {
  const { state, elapsedLabel, activityLabel, projectLabel } = useTimer();

  const statusLabel =
    state === 'running' ? 'Running' : state === 'paused' ? 'Paused' : 'Idle';
  const handleOpenFocus = () => {
    window.dispatchEvent(new CustomEvent('focus-sheet:open'));
  };

  return (
    <section className={styles.home}>
      <div className={styles['home__header']}>
        <p className={styles['home__eyebrow']}>Sunday, February 1</p>
        <h1 className={styles['home__title']}>Start with one clear win.</h1>
        <p className={styles['home__subtitle']}>
          Your focus list and timer will live here once Phase 4 lands.
        </p>
      </div>

      <button
        type="button"
        className={styles['home__focus-card']}
        onClick={handleOpenFocus}
        aria-label="Open focus timer"
      >
        <div className={styles['home__focus-header']}>
          <span className={styles['home__focus-label']}>Focus</span>
          <span className={styles['home__focus-status']} data-state={state}>
            {statusLabel}
          </span>
        </div>
        <div className={styles['home__focus-time']}>{elapsedLabel}</div>
        <div className={styles['home__focus-activity']}>
          {activityLabel}
        </div>
        {projectLabel ? (
          <div className={styles['home__focus-project']}>{projectLabel}</div>
        ) : null}
      </button>

      <div className={styles['home__card']}>
        <div className={styles['home__card-title']}>Next up</div>
        <p className={styles['home__card-body']}>
          Add tasks or habits from the command center to see them here.
        </p>
      </div>

      <div className={styles['home__pill-row']}>
        <span className={styles['home__pill']}>Focus</span>
        <span className={styles['home__pill']}>Plan</span>
        <span className={styles['home__pill']}>Reflect</span>
      </div>
    </section>
  );
}

export function RootView() {
  const { context } = useNavigationState();

  switch (context) {
    case 'execution':
      return <ExecutionView />;
    case 'knowledge':
      return <KnowledgeView />;
    case 'strategy':
      return <StrategyView />;
    case 'today':
    default:
      return <TodayView />;
  }
}
