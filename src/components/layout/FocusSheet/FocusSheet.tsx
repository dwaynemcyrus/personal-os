'use client';

import type React from 'react';
import { useCallback, useMemo, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetClose,
} from '@/components/ui/Sheet';
import styles from './FocusSheet.module.css';
import type { EntryType, FocusState, StartConfig, TaskOption } from '@/features/timer';

type FocusSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: FocusState;
  elapsedLabel: string;
  activityLabel: string;
  projectLabel?: string | null;
  isLog?: boolean;
  taskOptions: TaskOption[];
  onStart: (
    config: StartConfig,
    options?: { force?: boolean }
  ) => Promise<{ ok: boolean; blocked?: boolean }>;
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
  taskOptions,
  onStart,
  onPause,
  onResume,
  onStop,
}: FocusSheetProps) {
  const [entryType, setEntryType] = useState<EntryType>('planned');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [logLabel, setLogLabel] = useState('');
  const [pendingStart, setPendingStart] = useState<StartConfig | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const canStart = useMemo(() => {
    if (entryType === 'planned') {
      return Boolean(selectedTaskId);
    }
    return Boolean(logLabel.trim());
  }, [entryType, logLabel, selectedTaskId]);

  const statusLabel = state === 'running' ? 'Running' : state === 'paused' ? 'Paused' : 'Idle';

  const resetDraft = useCallback(() => {
    setEntryType('planned');
    setSelectedTaskId('');
    setLogLabel('');
    setPendingStart(null);
    setShowConfirm(false);
  }, []);

  const handleStart = async () => {
    if (!canStart) return;
    const config: StartConfig =
      entryType === 'planned'
        ? { entryType: 'planned', taskId: selectedTaskId }
        : { entryType: 'log', label: logLabel.trim() };

    const result = await onStart(config);
    if (result.blocked) {
      setPendingStart(config);
      setShowConfirm(true);
      return;
    }
    resetDraft();
  };

  const handleConfirmStart = async () => {
    if (!pendingStart) return;
    await onStart(pendingStart, { force: true });
    resetDraft();
  };

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

        <section className={styles['focus-sheet__new']}>
          <div className={styles['focus-sheet__activity-label']}>Start new</div>
          <div className={styles['focus-sheet__toggle']}>
            <button
              type="button"
              className={styles['focus-sheet__toggle-button']}
              data-active={entryType === 'planned'}
              onClick={() => setEntryType('planned')}
            >
              Planned
            </button>
            <button
              type="button"
              className={styles['focus-sheet__toggle-button']}
              data-active={entryType === 'log'}
              onClick={() => setEntryType('log')}
            >
              Log
            </button>
          </div>
          {entryType === 'planned' ? (
            <label className={styles['focus-sheet__field']}>
              <span className={styles['focus-sheet__field-label']}>Task</span>
              <select
                className={styles['focus-sheet__input']}
                value={selectedTaskId}
                onChange={(event) => setSelectedTaskId(event.target.value)}
              >
                <option value="">Select a task</option>
                {taskOptions.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                    {task.projectTitle ? ` · ${task.projectTitle}` : ''}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className={styles['focus-sheet__field']}>
              <span className={styles['focus-sheet__field-label']}>Label</span>
              <input
                className={styles['focus-sheet__input']}
                value={logLabel}
                onChange={(event) => setLogLabel(event.target.value)}
                placeholder="Walk, call, research"
              />
            </label>
          )}
          <button
            type="button"
            className={`${styles['focus-sheet__button']} ${styles['focus-sheet__button--primary']}`}
            onClick={handleStart}
            disabled={!canStart}
          >
            Start
          </button>
        </section>

        {showConfirm ? (
          <section className={styles['focus-sheet__confirm']}>
            <div className={styles['focus-sheet__confirm-text']}>
              An active timer is running. Stop it to start a new one.
            </div>
            <div className={styles['focus-sheet__confirm-actions']}>
              <button
                type="button"
                className={`${styles['focus-sheet__button']} ${styles['focus-sheet__button--danger']}`}
                onClick={handleConfirmStart}
              >
                Stop & Start New
              </button>
              <button
                type="button"
                className={styles['focus-sheet__button']}
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </section>
        ) : null}

        <div className={styles['focus-sheet__actions']}>
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
