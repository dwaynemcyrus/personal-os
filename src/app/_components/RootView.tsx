/**
 * RootView
 *
 * Renders the appropriate view based on navigation context.
 * Single entry point for all context-based content.
 */

'use client';

import { lazy, Suspense, useMemo } from 'react';
import { useNavigationState } from '@/components/providers';
import { useTimer } from '@/features/timer';
import styles from '../page.module.css';

// Lazy load context views for better performance
const ExecutionView = lazy(() =>
  import('./ExecutionView').then((mod) => ({ default: mod.ExecutionView }))
);
const KnowledgeView = lazy(() =>
  import('./KnowledgeView').then((mod) => ({ default: mod.KnowledgeView }))
);
const StrategyView = lazy(() =>
  import('./StrategyView').then((mod) => ({ default: mod.StrategyView }))
);

function TodayView() {
  const { state } = useTimer();

  const handleOpenFocus = () => {
    window.dispatchEvent(new CustomEvent('focus-sheet:open'));
  };

  const todayLabel = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  const inboxCount = 0;

  return (
    <section className={styles.home}>
      {/* ── Now ── */}
      <div>
        <h1 className={styles['home__now-title']}>Now</h1>
      </div>

      <button
        type="button"
        className={styles['home__now-card']}
        onClick={handleOpenFocus}
        aria-label="Open today's working surface"
      >
        <div>
          <div className={styles['home__now-date']}>{todayLabel}</div>
          <div className={styles['home__now-subtitle']}>
            Your daily working surface
          </div>
        </div>
        <div className={styles['home__now-button']}>Open Today</div>
      </button>

      {/* ── Inbox ── */}
      <div>
        <div className={styles['home__section-label']}>Inbox</div>
        <button
          type="button"
          className={styles['home__inbox-card']}
          onClick={handleOpenFocus}
          aria-label="Process inbox"
        >
          <div className={styles['home__inbox-text']}>
            <div className={styles['home__inbox-title']}>Process Inbox</div>
            <div className={styles['home__inbox-subtitle']}>
              Items waiting to be sorted
            </div>
          </div>
          <div className={styles['home__inbox-right']}>
            {inboxCount > 0 && (
              <span className={styles['home__inbox-badge']}>{inboxCount}</span>
            )}
            <span className={styles['home__inbox-arrow']}>&rsaquo;</span>
          </div>
        </button>
      </div>

      {/* ── Workbench ── */}
      <div>
        <div className={styles['home__section-label']}>Workbench</div>
        <div className={styles['home__workbench-empty']}>
          No pinned documents yet
        </div>
        <button
          type="button"
          className={styles['home__workbench-add']}
          onClick={handleOpenFocus}
          aria-label="Add to workbench"
        >
          + Add to Workbench
        </button>
      </div>
    </section>
  );
}

function LoadingFallback() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      Loading...
    </div>
  );
}

export function RootView() {
  const { context } = useNavigationState();

  switch (context) {
    case 'execution':
      return (
        <Suspense fallback={<LoadingFallback />}>
          <ExecutionView />
        </Suspense>
      );
    case 'knowledge':
      return (
        <Suspense fallback={<LoadingFallback />}>
          <KnowledgeView />
        </Suspense>
      );
    case 'strategy':
      return (
        <Suspense fallback={<LoadingFallback />}>
          <StrategyView />
        </Suspense>
      );
    case 'today':
    default:
      return <TodayView />;
  }
}
