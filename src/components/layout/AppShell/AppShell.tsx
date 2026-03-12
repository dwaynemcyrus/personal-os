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
import { CaptureModal } from '@/components/layout/CaptureModal/CaptureModal';
import { ContextSheet } from '@/components/layout/ContextSheet/ContextSheet';
import { FocusSheet } from '@/components/layout/FocusSheet';
import { InboxWizard } from '@/components/layout/InboxWizard/InboxWizard';
import { SheetManager } from '@/components/layout/SheetManager/SheetManager';
import { ToastHost } from '@/components/ui/Toast';
import { useTimer } from '@/features/timer';
import { useNavigationState, useNavigationActions } from '@/components/providers';
import type { NavigationLayer } from '@/lib/navigation/types';
import { BackIcon } from '@/components/ui/icons';
import styles from './AppShell.module.css';

type AppShellProps = {
  children: React.ReactNode;
  isInboxOpen: boolean;
  onInboxOpenChange: (open: boolean) => void;
};

const LONG_PRESS_MS = 500;

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
    case 'note-detail':
      return 'Note';
    case 'tasks-list':
    case 'task-detail':
      return 'Tasks';
    case 'plans-list':
    case 'plan-detail':
      return 'Plans';
    default:
      return 'Now';
  }
}

export function AppShell({ children, isInboxOpen, onInboxOpenChange }: AppShellProps) {
  const { stack } = useNavigationState();
  const { goBack } = useNavigationActions();
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isTaskDetailSheetOpen, setIsTaskDetailSheetOpen] = useState(false);
  const [isFocusOpen, setIsFocusOpen] = useState(false);
  const [isContextSheetOpen, setIsContextSheetOpen] = useState(false);

  const longPressTimerRef = useRef<number | undefined>(undefined);
  const longPressTriggeredRef = useRef(false);
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
  const isNoteDetail = topLayer?.view === 'note-detail';
  const isNotesRoute = isNotesList || isNoteDetail;
  const isTasksRoute = topLayer?.view.startsWith('task') ?? false;
  const isTaskDetailRoute = topLayer?.view === 'task-detail';
  const hideTopbar = isNotesList || isTasksRoute;
  const pageTitle = getPageTitle(topLayer);

  const handleBack = () => {
    goBack();
  };

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current !== undefined) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = undefined;
    }
  }, []);

  // --- FAB pointer event handlers ---

  const handleFabPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (isCommandOpen) return;
    if (isContextSheetOpen) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    longPressTriggeredRef.current = false;
    clearLongPressTimer();
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      setIsCommandOpen(true);
    }, LONG_PRESS_MS);
  };

  const handleFabPointerUp = () => {
    clearLongPressTimer();
  };

  const handleFabPointerCancel = () => {
    clearLongPressTimer();
    longPressTriggeredRef.current = false;
  };

  const handleFabClick = () => {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    clearLongPressTimer();
    if (isContextSheetOpen) {
      setIsContextSheetOpen(false);
      return;
    }
    setIsContextSheetOpen(true);
  };

  // --- Touch event handlers (mobile fallback) ---

  const hydrated = useHydrated();
  const touchEnabled =
    hydrated &&
    (window.matchMedia('(pointer: coarse)').matches ||
      window.matchMedia('(hover: none)').matches);

  const handleTouchStart = (event: React.TouchEvent<HTMLButtonElement>) => {
    if (isCommandOpen) return;
    if (isContextSheetOpen) return;
    const touch = event.touches[0];
    if (!touch) return;
    longPressTriggeredRef.current = false;
    clearLongPressTimer();
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      setIsCommandOpen(true);
    }, LONG_PRESS_MS);
  };

  const handleTouchEnd = () => {
    clearLongPressTimer();
  };

  const touchHandlers = touchEnabled
    ? {
        onTouchStart: handleTouchStart,
        onTouchEnd: handleTouchEnd,
      }
    : {};

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


  useEffect(() => {
    const handleTaskDetailOpenChange = (event: Event) => {
      const detail = (event as CustomEvent<{ open?: boolean }>).detail;
      setIsTaskDetailSheetOpen(Boolean(detail?.open));
    };

    window.addEventListener(
      'task-detail-sheet:open-change',
      handleTaskDetailOpenChange
    );
    return () => {
      window.removeEventListener(
        'task-detail-sheet:open-change',
        handleTaskDetailOpenChange
      );
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
            {isNoteDetail && headerSlot.right}
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
            isNoteDetail   ? styles['app-shell__content--note-detail']  : '',
            isNotesList    ? styles['app-shell__content--notes']         : '',
            isTasksRoute   ? styles['app-shell__content--tasks']         : '',
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
            {!isCommandOpen && !isTaskDetailRoute && !isTaskDetailSheetOpen && (
              <button
                type="button"
                className={styles['app-shell__fab']}
                aria-label={isContextSheetOpen ? 'Close context sheet' : 'Quick capture'}
                ref={fabRef}
                onClick={handleFabClick}
                onContextMenu={(e) => e.preventDefault()}
                onPointerDown={handleFabPointerDown}
                onPointerUp={handleFabPointerUp}
                onPointerCancel={handleFabPointerCancel}
                {...touchHandlers}
              >
                {isContextSheetOpen ? <FabCloseIcon /> : <FabIcon />}
              </button>
            )}

            <CaptureModal open={isCommandOpen} onOpenChange={setIsCommandOpen} />
            <InboxWizard open={isInboxOpen} onOpenChange={onInboxOpenChange} />
            <ContextSheet
              open={isContextSheetOpen}
              onOpenChange={setIsContextSheetOpen}
            />
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
