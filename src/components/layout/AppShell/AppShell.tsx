'use client';

import type React from 'react';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import { CaptureModal } from '@/components/layout/CaptureModal/CaptureModal';
import { FocusSheet } from '@/components/layout/FocusSheet';
import { InboxWizard } from '@/components/layout/InboxWizard/InboxWizard';
import { SheetManager } from '@/components/layout/SheetManager/SheetManager';
import { ToastHost } from '@/components/ui/Toast';
import { useTimer } from '@/features/timer';
import { useNavigationState, useNavigationActions } from '@/components/providers';
import type { NavigationContext } from '@/lib/navigation/types';
import styles from './AppShell.module.css';

type AppShellProps = {
  children: React.ReactNode;
};

type DragTarget = {
  id: string;
  context: NavigationContext;
  label: string;
  offset: [number, number];
};

const DRAG_TARGETS: DragTarget[] = [
  { id: 'execution', context: 'execution', label: 'Execution', offset: [-96, 0] },
  { id: 'thoughts', context: 'thoughts', label: 'Notes', offset: [96, 0] },
  { id: 'strategy', context: 'strategy', label: 'Strategy', offset: [0, -96] },
  { id: 'today', context: 'today', label: 'Home', offset: [0, 96] },
];

const CONTEXT_TITLES: Record<NavigationContext, string> = {
  today: 'Today',
  strategy: 'Strategy',
  thoughts: 'Thoughts',
  execution: 'Execution',
};

const LONG_PRESS_MS = 500;
const HIT_RADIUS = 48;

const triggerHaptic = () => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(10);
  }
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

export function AppShell({ children }: AppShellProps) {
  const { context, stack } = useNavigationState();
  const { switchContext, goBack, pushLayer } = useNavigationActions();
  const pathname = usePathname();
  const router = useRouter();
  const isNotesRoute = pathname?.startsWith('/notes') ?? false;
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isFocusOpen, setIsFocusOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);

  // Drag-to-navigate state
  const [dragActive, setDragActive] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [dragOrigin, setDragOrigin] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const [activeTarget, setActiveTarget] = useState<string | null>(null);

  // Drag refs
  const longPressTimerRef = useRef<number | undefined>(undefined);
  const dragPointerIdRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const fabRef = useRef<HTMLButtonElement>(null);
  const pointerStartRef = useRef({ x: 0, y: 0 });

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

  const isRoot = stack.length === 0;
  const pageTitle = CONTEXT_TITLES[context];

  const handleBack = () => {
    triggerHaptic();
    goBack();
  };

  const openContext = useCallback(
    (nextContext: NavigationContext) => {
      if (nextContext === 'thoughts') {
        router.push('/notes');
        return;
      }
      switchContext(nextContext);
    },
    [router, switchContext]
  );


  // --- Drag-to-navigate helpers ---

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current !== undefined) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = undefined;
    }
  }, []);

  const resetDragState = useCallback(() => {
    clearLongPressTimer();
    setDragActive(false);
    setActiveTarget(null);
    dragPointerIdRef.current = null;
  }, [clearLongPressTimer]);

  // Disable scroll/selection during drag
  useEffect(() => {
    if (!dragActive) return;
    const prevTouchAction = document.body.style.touchAction;
    const prevUserSelect = document.body.style.userSelect;
    document.body.style.touchAction = 'none';
    document.body.style.userSelect = 'none';
    return () => {
      document.body.style.touchAction = prevTouchAction;
      document.body.style.userSelect = prevUserSelect;
    };
  }, [dragActive]);

  const activateDrag = () => {
    if (isCommandOpen) return;
    if (!fabRef.current) return;
    const rect = fabRef.current.getBoundingClientRect();
    const origin = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    setDragOrigin(origin);
    setDragPosition({
      x: pointerStartRef.current.x,
      y: pointerStartRef.current.y,
    });
    setDragOffset({ ...dragOffsetRef.current });
    setDragActive(true);
    longPressTriggeredRef.current = true;
  };

  // --- Pointer event handlers ---

  const handleFabPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (isCommandOpen) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    longPressTriggeredRef.current = false;
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    const rect = event.currentTarget.getBoundingClientRect();
    dragOffsetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    dragPointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    clearLongPressTimer();
    longPressTimerRef.current = window.setTimeout(() => {
      activateDrag();
    }, LONG_PRESS_MS);
  };

  const handleFabPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragActive) {
      if (longPressTimerRef.current === undefined) return;
      pointerStartRef.current = { x: event.clientX, y: event.clientY };
      const rect = event.currentTarget.getBoundingClientRect();
      dragOffsetRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      return;
    }
    event.preventDefault();
    setDragPosition({ x: event.clientX, y: event.clientY });
    const hitTarget = DRAG_TARGETS.find((target) => {
      const [offsetX, offsetY] = target.offset;
      const centerX = dragOrigin.x + offsetX;
      const centerY = dragOrigin.y + offsetY;
      const distance = Math.hypot(event.clientX - centerX, event.clientY - centerY);
      return distance < HIT_RADIUS;
    });
    setActiveTarget(hitTarget?.id ?? null);
  };

  const handleFabPointerUp = () => {
    if (dragActive && activeTarget) {
      const target = DRAG_TARGETS.find((t) => t.id === activeTarget);
      if (target) {
        triggerHaptic();
        openContext(target.context);
      }
    }
    resetDragState();
  };

  const handleFabPointerCancel = () => {
    resetDragState();
  };

  const handleFabClick = () => {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    clearLongPressTimer();
    triggerHaptic();
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
    pointerStartRef.current = { x: touch.clientX, y: touch.clientY };
    const rect = event.currentTarget.getBoundingClientRect();
    dragOffsetRef.current = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
    clearLongPressTimer();
    longPressTimerRef.current = window.setTimeout(() => {
      activateDrag();
    }, LONG_PRESS_MS);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLButtonElement>) => {
    const touch = event.touches[0];
    if (!touch) return;
    if (!dragActive) {
      if (longPressTimerRef.current === undefined) return;
      pointerStartRef.current = { x: touch.clientX, y: touch.clientY };
      const rect = event.currentTarget.getBoundingClientRect();
      dragOffsetRef.current = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
      return;
    }
    setDragPosition({ x: touch.clientX, y: touch.clientY });
    const hitTarget = DRAG_TARGETS.find((target) => {
      const [offsetX, offsetY] = target.offset;
      const centerX = dragOrigin.x + offsetX;
      const centerY = dragOrigin.y + offsetY;
      const distance = Math.hypot(touch.clientX - centerX, touch.clientY - centerY);
      return distance < HIT_RADIUS;
    });
    setActiveTarget(hitTarget?.id ?? null);
  };

  const handleTouchEnd = () => {
    handleFabPointerUp();
  };

  const touchHandlers = touchEnabled
    ? {
        onTouchStart: handleTouchStart,
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd,
      }
    : {};

  // --- Other handlers ---

  const handleOpenFocus = () => {
    triggerHaptic();
    setIsFocusOpen(true);
  };

  useEffect(() => {
    const handleOpen = () => {
      triggerHaptic();
      setIsFocusOpen(true);
    };

    window.addEventListener('focus-sheet:open', handleOpen);
    return () => {
      window.removeEventListener('focus-sheet:open', handleOpen);
    };
  }, []);

  useEffect(() => {
    const handleOpenInbox = () => {
      triggerHaptic();
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

  // Elements that must remain interactive when a Radix modal dialog is open.
  // Radix sets `inert` on sibling elements of its portal (direct children of
  // <body>). By portaling the FAB, CaptureModal, and InboxWizard to <body>
  // they become siblings of the Radix portal — but since they're rendered
  // *after* the portal, they won't be inerted.
  const portalTarget = hydrated ? document.body : null;

  return (
    <>
      <ToastHost />
      <div className={styles['app-shell']}>
        <header className={`${styles['app-shell__topbar']} ${isNotesRoute ? styles['app-shell__topbar--hidden'] : ''}`}>
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
          <div className={styles['app-shell__topbar-title']}>{pageTitle}</div>
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
        {!isNotesRoute && <div className={styles['app-shell__topbar-spacer']} aria-hidden="true" />}

        <main className={`${styles['app-shell__content']} ${isNotesRoute ? styles['app-shell__content--notes'] : ''}`}>{children}</main>

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

        {/* Screen reader announcements for context changes */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {pageTitle} context
        </div>
      </div>

      {portalTarget && createPortal(
        <>
          <button
            type="button"
            className={`${styles['app-shell__fab']} ${
              dragActive ? styles['app-shell__fab--dragging'] : ''
            }`}
            aria-label="Quick capture"
            ref={fabRef}
            onClick={handleFabClick}
            onContextMenu={(e) => e.preventDefault()}
            onPointerDown={handleFabPointerDown}
            onPointerMove={handleFabPointerMove}
            onPointerUp={handleFabPointerUp}
            onPointerCancel={handleFabPointerCancel}
            {...touchHandlers}
            style={
              dragActive
                ? {
                    left: `${dragPosition.x - dragOffset.x}px`,
                    top: `${dragPosition.y - dragOffset.y}px`,
                    bottom: 'auto',
                    transform: 'none',
                  }
                : undefined
            }
          >
            +
          </button>

          {dragActive ? (
            <div className={styles['app-shell__targets-layer']} aria-hidden="true">
              {DRAG_TARGETS.map((target) => {
                const [offsetX, offsetY] = target.offset;
                return (
                  <div
                    key={target.id}
                    className={`${styles['app-shell__target']} ${
                      activeTarget === target.id ? styles['app-shell__target--active'] : ''
                    }`}
                    style={{
                      left: `${dragOrigin.x + offsetX}px`,
                      top: `${dragOrigin.y + offsetY}px`,
                    }}
                  >
                    {target.label}
                  </div>
                );
              })}
            </div>
          ) : null}

          <CaptureModal open={isCommandOpen} onOpenChange={setIsCommandOpen} />
          <InboxWizard open={isInboxOpen} onOpenChange={setIsInboxOpen} />
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
