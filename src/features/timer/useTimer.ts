'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useDatabase } from '@/hooks/useDatabase';
import type {
  ProjectDocument,
  TaskDocument,
  TimeEntryDocument,
} from '@/lib/db';

type FocusState = 'idle' | 'running' | 'paused';

type EntryType = 'planned' | 'log';

type StartConfig =
  | { entryType: 'planned'; taskId: string }
  | { entryType: 'log'; label: string };

type StartResult = { ok: boolean; blocked?: boolean };

type PausedFocus = {
  entryType: EntryType;
  taskId: string | null;
  label: string | null;
  accumulatedSeconds: number;
  stoppedAt: string;
};

type TaskOption = {
  id: string;
  title: string;
  projectTitle: string | null;
};

const PAUSED_FOCUS_KEY = 'personal-os:paused-focus';
const ACCUMULATED_SECONDS_KEY = 'personal-os:timer-accumulated-seconds';

const timeEntryTypes: EntryType[] = ['planned', 'log'];

const isEntryType = (value: string): value is EntryType =>
  timeEntryTypes.includes(value as EntryType);

const parsePausedFocus = (raw: string | null): PausedFocus | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PausedFocus>;
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.stoppedAt || !parsed.entryType) return null;
    if (!isEntryType(parsed.entryType)) return null;
    if (parsed.entryType === 'log' && !parsed.label) return null;
    if (typeof parsed.accumulatedSeconds !== 'number') return null;

    return {
      entryType: parsed.entryType,
      taskId: parsed.taskId ?? null,
      label: parsed.label ?? null,
      accumulatedSeconds: parsed.accumulatedSeconds,
      stoppedAt: parsed.stoppedAt,
    };
  } catch {
    return null;
  }
};

const formatDuration = (seconds: number) => {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(secs).padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${paddedMinutes}:${paddedSeconds}`;
  }

  return `${paddedMinutes}:${paddedSeconds}`;
};

const computeDurationSeconds = (startIso: string, endIso: string) => {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.max(0, Math.floor((end - start) / 1000));
};

export function useTimer() {
  const { db, isReady } = useDatabase();
  const [activeEntry, setActiveEntry] = useState<TimeEntryDocument | null>(null);
  const [pausedFocus, setPausedFocus] = useState<PausedFocus | null>(() => {
    if (typeof window === 'undefined') return null;
    return parsePausedFocus(window.localStorage.getItem(PAUSED_FOCUS_KEY));
  });
  const [accumulatedSeconds, setAccumulatedSeconds] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    const raw = window.localStorage.getItem(ACCUMULATED_SECONDS_KEY);
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  });
  const [tasks, setTasks] = useState<TaskDocument[]>([]);
  const [projects, setProjects] = useState<ProjectDocument[]>([]);
  const [tick, setTick] = useState(0);

  const setPausedFocusState = useCallback((value: PausedFocus | null) => {
    setPausedFocus(value);

    if (typeof window === 'undefined') return;
    if (value) {
      window.localStorage.setItem(PAUSED_FOCUS_KEY, JSON.stringify(value));
    } else {
      window.localStorage.removeItem(PAUSED_FOCUS_KEY);
    }
  }, []);

  const setAccumulatedSecondsState = useCallback((value: number) => {
    const nextValue = Math.max(0, Math.floor(value));
    setAccumulatedSeconds(nextValue);

    if (typeof window === 'undefined') return;
    if (nextValue > 0) {
      window.localStorage.setItem(ACCUMULATED_SECONDS_KEY, String(nextValue));
    } else {
      window.localStorage.removeItem(ACCUMULATED_SECONDS_KEY);
    }
  }, []);
  useEffect(() => {
    if (!isReady || !db) return;

    const subscription = db.tasks
      .find({
        selector: { is_trashed: false },
        sort: [{ updated_at: 'desc' }, { id: 'asc' }],
      })
      .$.subscribe((docs) => {
        setTasks(docs.map((doc) => doc.toJSON()));
      });

    return () => subscription.unsubscribe();
  }, [db, isReady]);

  useEffect(() => {
    if (!isReady || !db) return;

    const subscription = db.projects
      .find({
        selector: { is_trashed: false },
        sort: [{ updated_at: 'desc' }, { id: 'asc' }],
      })
      .$.subscribe((docs) => {
        setProjects(docs.map((doc) => doc.toJSON()));
      });

    return () => subscription.unsubscribe();
  }, [db, isReady]);

  const stopEntry = useCallback(
    async (entry: TimeEntryDocument) => {
      if (!db) return null;
      const timestamp = new Date().toISOString();
      const durationSeconds = computeDurationSeconds(
        entry.started_at,
        timestamp
      );
      const doc = await db.time_entries.findOne(entry.id).exec();
      if (!doc) return null;

      await doc.patch({
        stopped_at: timestamp,
        duration_seconds: durationSeconds,
        updated_at: timestamp,
      });

      return { durationSeconds, stoppedAt: timestamp };
    },
    [db]
  );

  useEffect(() => {
    if (!isReady || !db) return;

    const subscription = db.time_entries
      .find({
        selector: { is_trashed: false, stopped_at: null },
        sort: [{ started_at: 'desc' }, { id: 'asc' }],
      })
      .$.subscribe((docs) => {
        const entries = docs.map((doc) => doc.toJSON());
        if (entries.length > 1) {
          const [primary, ...rest] = entries;
          setActiveEntry(primary);
          setTick(Date.now());
          if (pausedFocus) {
            setPausedFocusState(null);
          }
          rest.forEach((entry) => {
            void stopEntry(entry);
          });
          return;
        }
        const nextEntry = entries[0] ?? null;
        setActiveEntry(nextEntry);
        if (nextEntry && pausedFocus) {
          setTick(Date.now());
          setPausedFocusState(null);
        }
        if (nextEntry && !pausedFocus) {
          setTick(Date.now());
        }
      });

    return () => subscription.unsubscribe();
  }, [db, isReady, pausedFocus, setPausedFocusState, stopEntry]);

  useEffect(() => {
    if (!activeEntry) return;
    const interval = window.setInterval(() => {
      setTick(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [activeEntry]);

  const projectMap = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects]
  );

  const taskMap = useMemo(
    () => new Map(tasks.map((task) => [task.id, task])),
    [tasks]
  );

  const focusContext = useMemo(() => {
    if (activeEntry) {
      return {
        entryType: activeEntry.entry_type,
        taskId: activeEntry.task_id ?? null,
        label: activeEntry.label ?? null,
      };
    }
    if (pausedFocus) {
      return {
        entryType: pausedFocus.entryType,
        taskId: pausedFocus.taskId,
        label: pausedFocus.label,
      };
    }
    return null;
  }, [activeEntry, pausedFocus]);

  const focusTask = focusContext?.taskId
    ? taskMap.get(focusContext.taskId) ?? null
    : null;
  const focusProject = focusTask?.project_id
    ? projectMap.get(focusTask.project_id) ?? null
    : null;

  const focusState: FocusState = activeEntry
    ? 'running'
    : pausedFocus
      ? 'paused'
      : 'idle';

  const elapsedSeconds = useMemo(() => {
    if (activeEntry) {
      const timestamp = tick;
      const startedAt = new Date(activeEntry.started_at).getTime();
      if (Number.isNaN(startedAt)) return accumulatedSeconds;
      const runningSeconds = Math.max(
        0,
        Math.floor((timestamp - startedAt) / 1000)
      );
      return accumulatedSeconds + runningSeconds;
    }
    if (pausedFocus) {
      return accumulatedSeconds;
    }
    return 0;
  }, [activeEntry, accumulatedSeconds, pausedFocus, tick]);

  const elapsedLabel = formatDuration(elapsedSeconds);

  const activityLabel = useMemo(() => {
    if (!focusContext) return 'Select a task or add a log entry';
    if (focusContext.entryType === 'log') {
      return focusContext.label ?? 'Log entry';
    }
    return focusTask?.title ?? 'Select a task';
  }, [focusContext, focusTask]);

  const projectLabel = focusProject?.title ?? null;
  const isLog = focusContext?.entryType === 'log';

  const taskOptions: TaskOption[] = useMemo(
    () =>
      tasks.map((task) => ({
        id: task.id,
        title: task.title,
        projectTitle: task.project_id
          ? projectMap.get(task.project_id)?.title ?? null
          : null,
      })),
    [tasks, projectMap]
  );

  const startEntry = useCallback(
    async (
      config: StartConfig,
      options?: { force?: boolean; preserveAccumulated?: boolean }
    ): Promise<StartResult> => {
      if (!db) return { ok: false };
      if (activeEntry && !options?.force) return { ok: false, blocked: true };

      if (activeEntry && options?.force) {
        await stopEntry(activeEntry);
      }

      const timestamp = new Date().toISOString();
      const payload: TimeEntryDocument = {
        id: uuidv4(),
        task_id: config.entryType === 'planned' ? config.taskId : null,
        entry_type: config.entryType,
        label: config.entryType === 'log' ? config.label.trim() : null,
        started_at: timestamp,
        stopped_at: null,
        duration_seconds: null,
        created_at: timestamp,
        updated_at: timestamp,
        is_trashed: false,
        trashed_at: null,
      };

      await db.time_entries.insert(payload);
      setPausedFocusState(null);
      if (!options?.preserveAccumulated) {
        setAccumulatedSecondsState(0);
      }
      return { ok: true };
    },
    [activeEntry, db, setAccumulatedSecondsState, setPausedFocusState, stopEntry]
  );

  const pause = useCallback(async () => {
    if (!activeEntry) return;
    const result = await stopEntry(activeEntry);
    if (!result) return;

    const nextAccumulated = accumulatedSeconds + result.durationSeconds;
    setAccumulatedSecondsState(nextAccumulated);
    setPausedFocusState({
      entryType: activeEntry.entry_type,
      taskId: activeEntry.task_id ?? null,
      label: activeEntry.label ?? null,
      accumulatedSeconds: nextAccumulated,
      stoppedAt: result.stoppedAt,
    });
  }, [
    activeEntry,
    accumulatedSeconds,
    setAccumulatedSecondsState,
    setPausedFocusState,
    stopEntry,
  ]);

  const resume = useCallback(async () => {
    if (!pausedFocus) return;
    if (pausedFocus.entryType === 'planned' && !pausedFocus.taskId) return;
    if (pausedFocus.entryType === 'log' && !pausedFocus.label) return;

    const config: StartConfig =
      pausedFocus.entryType === 'planned'
        ? { entryType: 'planned', taskId: pausedFocus.taskId! }
        : { entryType: 'log', label: pausedFocus.label! };

    await startEntry(config, { force: true, preserveAccumulated: true });
  }, [pausedFocus, startEntry]);

  const stop = useCallback(async () => {
    if (activeEntry) {
      await stopEntry(activeEntry);
      setPausedFocusState(null);
      setAccumulatedSecondsState(0);
      return;
    }
    if (pausedFocus) {
      setPausedFocusState(null);
      setAccumulatedSecondsState(0);
    }
  }, [
    activeEntry,
    pausedFocus,
    setAccumulatedSecondsState,
    setPausedFocusState,
    stopEntry,
  ]);

  return {
    isReady,
    state: focusState,
    elapsedSeconds,
    elapsedLabel,
    activityLabel,
    projectLabel,
    isLog,
    taskOptions,
    startEntry,
    pause,
    resume,
    stop,
  };
}

export type { EntryType, FocusState, StartConfig, TaskOption };
