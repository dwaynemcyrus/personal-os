import type React from 'react';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { createPortal } from 'react-dom';
import { CaptureModal } from '@/components/layout/CaptureModal/CaptureModal';
import { ContextSheet } from '@/components/layout/ContextSheet/ContextSheet';
import { FocusSheet } from '@/components/layout/FocusSheet';
import { InboxWizard } from '@/components/layout/InboxWizard/InboxWizard';
import { SheetManager } from '@/components/layout/SheetManager/SheetManager';
import { ToastHost } from '@/components/ui/Toast';
import { useTimer } from '@/features/timer';
import { useNavigationState, useNavigationActions } from '@/components/providers';
import type { NavigationLayer } from '@/lib/navigation/types';
import styles from './AppShell.module.css';

type AppShellProps = {
  children: React.ReactNode;
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

export function AppShell({ children }: AppShellProps) {
  const { stack } = useNavigationState();
  const { goBack } = useNavigationActions();
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isFocusOpen, setIsFocusOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
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

  const topLayer = stack[stack.length - 1];
  const isRoot = stack.length === 0;
  const isNotesRoute = topLayer?.view.startsWith('note') ?? false;
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
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    longPressTriggeredRef.current = false;
    clearLongPressTimer();
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      setIsContextSheetOpen(true);
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
    setIsCommandOpen(true);
  };

  // --- Touch event handlers (mobile fallback) ---

  const hydrated = useHydrated();
  const touchEnabled =
    hydrated &&
    (window.matchMedia('(pointer: coarse)').matches ||
      window.matchMedia('(hover: none)').matches);

  const handleTouchStart = (event: React.TouchEvent<HTMLButtonElement>) => {
    if (isCommandOpen) return;
    const touch = event.touches[0];
    if (!touch) return;
    longPressTriggeredRef.current = false;
    clearLongPressTimer();
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      setIsContextSheetOpen(true);
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
    const handleOpenInbox = () => {
      setIsInboxOpen(true);
    };

    window.addEventListener('inbox-wizard:open', handleOpenInbox);
    return () => {
      window.removeEventListener('inbox-wizard:open', handleOpenInbox);
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
    <>
      <ToastHost />
      <div className={styles['app-shell']}>
        <header
          className={`${styles['app-shell__topbar']} ${
            isNotesRoute ? styles['app-shell__topbar--hidden'] : ''
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
                <BackIcon />
              </button>
            )}
          </div>
          <div className={styles['app-shell__topbar-title']} aria-hidden="true" />
          <div className={styles['app-shell__topbar-right']}>
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
        {!isNotesRoute && (
          <div className={styles['app-shell__topbar-spacer']} aria-hidden="true" />
        )}

        <main
          className={`${styles['app-shell__content']} ${
            isNotesRoute ? styles['app-shell__content--notes'] : ''
          }`}
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
            <button
              type="button"
              className={styles['app-shell__fab']}
              aria-label="Quick capture"
              ref={fabRef}
              onClick={handleFabClick}
              onContextMenu={(e) => e.preventDefault()}
              onPointerDown={handleFabPointerDown}
              onPointerUp={handleFabPointerUp}
              onPointerCancel={handleFabPointerCancel}
              {...touchHandlers}
            >
              +
            </button>

            <CaptureModal open={isCommandOpen} onOpenChange={setIsCommandOpen} />
            <InboxWizard open={isInboxOpen} onOpenChange={setIsInboxOpen} />
            <ContextSheet
              open={isContextSheetOpen}
              onOpenChange={setIsContextSheetOpen}
            />
          </>,
          portalTarget
        )}
    </>
  );
}

function BackIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={styles['app-shell__icon']}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 18l-6-6 6-6" />
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
