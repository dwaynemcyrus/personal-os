'use client';

import type React from 'react';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetClose,
} from '@/components/ui/Sheet';
import styles from './FocusSheet.module.css';

type FocusState = 'idle' | 'running' | 'paused';

type FocusSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: FocusState;
  elapsedLabel: string;
  activityLabel: string;
  projectLabel?: string | null;
  isLog?: boolean;
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
};

export function FocusSheet({
  open,
  onOpenChange,
  state,
  elapsedLabel,
  activityLabel,
  projectLabel,
  isLog = false,
  onStart,
  onPause,
  onResume,
  onStop,
}: FocusSheetProps) {
  const statusLabel = state === 'running' ? 'Running' : state === 'paused' ? 'Paused' : 'Idle';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={styles['focus-sheet__content']}
        aria-label="Focus timer"
      >
        <header className={styles['focus-sheet__header']}>
          <SheetTitle className={styles['focus-sheet__title']}>Focus</SheetTitle>
          <SheetClose asChild>
            <button
              type="button"
              className={styles['focus-sheet__close']}
              aria-label="Close focus sheet"
            >
              <CloseIcon />
            </button>
          </SheetClose>
        </header>

        <div className={styles['focus-sheet__status']}>
          <div className={styles['focus-sheet__elapsed']}>{elapsedLabel}</div>
          <div className={styles['focus-sheet__state']} data-state={state}>
            {statusLabel}
          </div>
        </div>

        <div className={styles['focus-sheet__activity']}>
          <div className={styles['focus-sheet__activity-label']}>Activity</div>
          <div className={styles['focus-sheet__activity-title']}>
            {activityLabel}
            {isLog ? (
              <span className={styles['focus-sheet__badge']}>Log</span>
            ) : null}
          </div>
          {projectLabel ? (
            <div className={styles['focus-sheet__activity-subtitle']}>
              {projectLabel}
            </div>
          ) : null}
        </div>

        <div className={styles['focus-sheet__actions']}>
          {state === 'idle' ? (
            <button
              type="button"
              className={`${styles['focus-sheet__button']} ${styles['focus-sheet__button--primary']}`}
              onClick={onStart}
            >
              Start
            </button>
          ) : null}
          {state === 'running' ? (
            <>
              <button
                type="button"
                className={styles['focus-sheet__button']}
                onClick={onPause}
              >
                Pause
              </button>
              <button
                type="button"
                className={`${styles['focus-sheet__button']} ${styles['focus-sheet__button--danger']}`}
                onClick={onStop}
              >
                Stop
              </button>
            </>
          ) : null}
          {state === 'paused' ? (
            <>
              <button
                type="button"
                className={`${styles['focus-sheet__button']} ${styles['focus-sheet__button--primary']}`}
                onClick={onResume}
              >
                Resume
              </button>
              <button
                type="button"
                className={`${styles['focus-sheet__button']} ${styles['focus-sheet__button--danger']}`}
                onClick={onStop}
              >
                Stop
              </button>
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={styles['focus-sheet__icon']}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M6 6l12 12" />
      <path d="M18 6l-12 12" />
    </svg>
  );
}
