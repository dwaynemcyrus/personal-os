import type React from 'react';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { createPortal } from 'react-dom';
import { HeaderSlotCtx, type HeaderSlot } from './HeaderSlot';
import { CommandSheet } from '@/components/layout/CommandSheet/CommandSheet';
import { FocusSheet } from '@/components/layout/FocusSheet';
import { SheetManager } from '@/components/layout/SheetManager/SheetManager';
import { ToastHost } from '@/components/ui/Toast';
import { useTimer } from '@/features/timer';
import { useNavigationState, useNavigationActions } from '@/components/providers';
import type { NavigationLayer } from '@/lib/navigation/types';
import { BackIcon } from '@/components/ui/icons';
import styles from './AppShell.module.css';

type AppShellProps = {
  children: React.ReactNode;
};

const useHydrated = () =>
  useSyncExternalStore(
    (onStoreChange) => {
      const id = window.requestAnimationFrame(onStoreChange);
      return () => window.cancelAnimationFrame(id);
    },
    () => true,
    () => false
  );

function getPageTitle(topLayer: NavigationLayer | undefined): string {
  if (!topLayer) return 'Now';
  switch (topLayer.view) {
    case 'notes-list':
      return (
        { all: 'Notes', pinned: 'Pinned', today: 'Today', locked: 'Locked', todo: 'Todo', trash: 'Trash' }[
          topLayer.group
        ] ?? 'Notes'
      );
    case 'document-detail':
      return 'Document';
    case 'tasks-list':
    case 'task-detail':
      return 'Tasks';
    case 'strategy-detail':
      return 'Strategy';
    case 'settings':
      return 'Settings';
    default:
      return 'Now';
  }
}

export function AppShell({ children }: AppShellProps) {
  const { stack } = useNavigationState();
  const { goBack } = useNavigationActions();
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isFocusOpen, setIsFocusOpen] = useState(false);

  const fabRef = useRef<HTMLButtonElement>(null);

  const {
    state: focusState,
    elapsedLabel: focusElapsedLabel,
    activityLabel: focusActivityLabel,
    projectLabel: focusProjectLabel,
    isUnplanned: focusIsUnplanned,
    taskOptions,
    unplannedSuggestions,
    startEntry,
    pause,
    resume,
    stop,
  } = useTimer();

  const [headerSlot, setHeaderSlotState] = useState<HeaderSlot>({});
  const setSlot = useCallback((s: HeaderSlot) => setHeaderSlotState(s), []);

  const topLayer = stack[stack.length - 1];
  const isRoot = stack.length === 0;
  const isNotesList = topLayer?.view === 'notes-list';
  const isTasksRoute = topLayer?.view.startsWith('task') ?? false;
  const isTaskDetailRoute = topLayer?.view === 'task-detail';
  const isStrategyRoute = (import.meta.env.VITE_SHOW_STRATEGY === 'true') && topLayer?.view === 'strategy-detail';
  const isDocumentDetailRoute = topLayer?.view === 'document-detail';
  const isNewBucketRoute = topLayer?.view === 'actions' || topLayer?.view === 'writing' || topLayer?.view === 'reference' || topLayer?.view === 'inbox-list';
  const hideTopbar = isNotesList || isTasksRoute || isStrategyRoute || isDocumentDetailRoute || isNewBucketRoute;
  const pageTitle = getPageTitle(topLayer);

  const handleBack = () => {
    goBack();
  };

  const hydrated = useHydrated();

  // --- Other handlers ---

  const handleOpenFocus = () => {
    setIsFocusOpen(true);
  };

  useEffect(() => {
    const handleOpen = () => {
      setIsFocusOpen(true);
    };

    window.addEventListener('focus-sheet:open', handleOpen);
    return () => {
      window.removeEventListener('focus-sheet:open', handleOpen);
    };
  }, []);


  // Cmd/Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const focusStatusLabel = formatFocusStatus(focusState);
  const showFocusChip = focusState !== 'idle';

  const handleFabClick = () => setIsCommandOpen((prev) => !prev);

  const portalTarget = hydrated ? document.body : null;

  return (
    <HeaderSlotCtx.Provider value={{ setSlot }}>
    <>
      <ToastHost />
      <div className={styles['app-shell']}>
        <header
          className={`${styles['app-shell__topbar']} ${
            hideTopbar ? styles['app-shell__topbar--hidden'] : ''
          }`}
        >
          <div className={styles['app-shell__topbar-left']}>
            {!isRoot && (
              <button
                type="button"
                className={styles['app-shell__icon-button']}
                onClick={handleBack}
                aria-label="Go back"
              >
                <BackIcon className={styles['app-shell__icon']} />
              </button>
            )}
          </div>
          <div className={styles['app-shell__topbar-title']} aria-hidden="true" />
          <div className={styles['app-shell__topbar-right']}>
            {isDocumentDetailRoute && headerSlot.right}
            {showFocusChip ? (
              <button
                type="button"
                className={styles['app-shell__focus-chip']}
                data-status={focusState}
                onClick={handleOpenFocus}
                aria-label={`Open focus timer, ${focusStatusLabel}, ${focusElapsedLabel}`}
              >
                <span className={styles['app-shell__focus-time']}>
                  {focusElapsedLabel}
                </span>
                <span className={styles['app-shell__focus-status']}>
                  {focusStatusLabel}
                </span>
              </button>
            ) : null}
          </div>
        </header>
        {!hideTopbar && (
          <div className={styles['app-shell__topbar-spacer']} aria-hidden="true" />
        )}

        <main
          className={[
            styles['app-shell__content'],
            isDocumentDetailRoute ? styles['app-shell__content--note-detail'] : '',
            isNotesList      ? styles['app-shell__content--notes']         : '',
            isTasksRoute     ? styles['app-shell__content--tasks']         : '',
            isStrategyRoute  ? styles['app-shell__content--strategy']      : '',
          ].filter(Boolean).join(' ')}
        >
          {children}
        </main>

        <SheetManager />

        <FocusSheet
          key={isFocusOpen ? 'focus-open' : 'focus-closed'}
          open={isFocusOpen}
          onOpenChange={setIsFocusOpen}
          state={focusState}
          elapsedLabel={focusElapsedLabel}
          activityLabel={focusActivityLabel}
          projectLabel={focusProjectLabel}
          isUnplanned={focusIsUnplanned}
          taskOptions={taskOptions}
          unplannedSuggestions={unplannedSuggestions}
          onStart={startEntry}
          onPause={pause}
          onResume={resume}
          onStop={stop}
        />

        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {pageTitle}
        </div>
      </div>

      {portalTarget &&
        createPortal(
          <>
            {!isTaskDetailRoute && !isDocumentDetailRoute && !isNewBucketRoute && (
              <button
                type="button"
                className={styles['app-shell__fab']}
                aria-label={isCommandOpen ? 'Close' : 'Open command sheet'}
                ref={fabRef}
                onClick={handleFabClick}
              >
                {isCommandOpen ? <FabCloseIcon /> : <FabIcon />}
              </button>
            )}

            <CommandSheet open={isCommandOpen} onOpenChange={setIsCommandOpen} />
          </>,
          portalTarget
        )}
    </>
    </HeaderSlotCtx.Provider>
  );
}


function FabIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className={styles['app-shell__fab-icon']}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <circle cx="10" cy="10" r="7" />
    </svg>
  );
}

function FabCloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className={`${styles['app-shell__fab-icon']} ${styles['app-shell__fab-icon--close']}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    >
      <path d="M5 5l10 10" />
      <path d="M15 5L5 15" />
    </svg>
  );
}

function formatFocusStatus(state: 'idle' | 'running' | 'paused') {
  switch (state) {
    case 'running':
      return 'Running';
    case 'paused':
      return 'Paused';
    default:
      return 'Idle';
  }
}
