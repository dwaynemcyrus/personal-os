'use client';

import type React from 'react';
import { useCallback, useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/Sheet';
import { CaptureModal } from '@/components/layout/CaptureModal/CaptureModal';
import { FocusSheet } from '@/components/layout/FocusSheet';
import { SheetManager } from '@/components/layout/SheetManager/SheetManager';
import { useTimer } from '@/features/timer';
import { useNavigationState, useNavigationActions } from '@/components/providers';
import type { NavigationContext } from '@/lib/navigation/types';
import styles from './AppShell.module.css';

type AppShellProps = {
  children: React.ReactNode;
};

type NavItem = {
  context: NavigationContext;
  label: string;
  description: string;
};

type DragTarget = {
  id: string;
  context: NavigationContext;
  label: string;
  offset: [number, number];
};

const NAV_ITEMS: NavItem[] = [
  {
    context: 'strategy',
    label: 'Strategy',
    description: 'Projects, goals, and planning',
  },
  {
    context: 'knowledge',
    label: 'Knowledge',
    description: 'Notes, ideas, and references',
  },
  {
    context: 'execution',
    label: 'Execution',
    description: 'Tasks, habits, and focus',
  },
];

const DRAG_TARGETS: DragTarget[] = [
  { id: 'execution', context: 'execution', label: 'Execution', offset: [-96, 0] },
  { id: 'knowledge', context: 'knowledge', label: 'Knowledge', offset: [96, 0] },
  { id: 'strategy', context: 'strategy', label: 'Strategy', offset: [0, -96] },
  { id: 'today', context: 'today', label: 'Home', offset: [0, 96] },
];

const CONTEXT_TITLES: Record<NavigationContext, string> = {
  today: 'Today',
  strategy: 'Strategy',
  knowledge: 'Knowledge',
  execution: 'Execution',
};

const LONG_PRESS_MS = 500;
const HIT_RADIUS = 48;

const triggerHaptic = () => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(10);
  }
};

export function AppShell({ children }: AppShellProps) {
  const { context, stack } = useNavigationState();
  const { switchContext, goBack } = useNavigationActions();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isFocusOpen, setIsFocusOpen] = useState(false);

  // Drag-to-navigate state
  const [dragActive, setDragActive] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [dragOrigin, setDragOrigin] = useState({ x: 0, y: 0 });
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

  const handleOpenMenu = () => {
    triggerHaptic();
    setIsMenuOpen(true);
  };

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
        switchContext(target.context);
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

  const touchEnabled =
    typeof window !== 'undefined' &&
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

  return (
    <div className={styles['app-shell']}>
      <header className={styles['app-shell__topbar']}>
        <div className={styles['app-shell__topbar-left']}>
          {isRoot ? (
            <button
              type="button"
              className={styles['app-shell__icon-button']}
              onClick={handleOpenMenu}
              aria-label="Open menu"
            >
              <MenuIcon />
            </button>
          ) : (
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
      <div className={styles['app-shell__topbar-spacer']} aria-hidden="true" />

      <main className={styles['app-shell__content']}>{children}</main>

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
                left: `${dragPosition.x - dragOffsetRef.current.x}px`,
                top: `${dragPosition.y - dragOffsetRef.current.y}px`,
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

      <SheetManager />

      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent side="left" className={styles['app-shell__menu']} asChild>
          <motion.div
            drag="x"
            dragConstraints={{ left: -140, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x < -80 || info.velocity.x < -500) {
                setIsMenuOpen(false);
              }
            }}
          >
            <SheetTitle className={styles['app-shell__menu-title']}>
              Navigate
            </SheetTitle>
            <nav className={styles['app-shell__menu-nav']}>
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.context}
                  type="button"
                  className={styles['app-shell__menu-link']}
                  data-active={context === item.context}
                  onClick={() => {
                    triggerHaptic();
                    switchContext(item.context);
                    setIsMenuOpen(false);
                  }}
                >
                  <span className={styles['app-shell__menu-label']}>
                    {item.label}
                  </span>
                  <span className={styles['app-shell__menu-description']}>
                    {item.description}
                  </span>
                </button>
              ))}
            </nav>
          </motion.div>
        </SheetContent>
      </Sheet>

      <CaptureModal open={isCommandOpen} onOpenChange={setIsCommandOpen} />

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
  );
}

function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={styles['app-shell__icon']}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h12" />
    </svg>
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
