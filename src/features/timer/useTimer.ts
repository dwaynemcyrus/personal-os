import { useCallback, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import type { ItemRow, TimeEntryRow } from '@/lib/db';

type FocusState = 'idle' | 'running' | 'paused';

type EntryType = 'planned' | 'unplanned';

type StartConfig =
  | { entryType: 'planned'; taskId: string }
  | { entryType: 'unplanned'; label: string };

type StartResult = { ok: boolean; blocked?: boolean };

type PausedFocus = {
  entryType: EntryType;
  taskId: string | null;
  label: string | null;
  sessionId: string | null;
  accumulatedSeconds: number;
  stoppedAt: string;
};

type TaskOption = {
  id: string;
  title: string;
  projectTitle: string | null;
};

type UnplannedSuggestion = {
  label: string;
  normalized: string;
};

const PAUSED_FOCUS_KEY = 'personal-os:paused-focus';
const ACCUMULATED_SECONDS_KEY = 'personal-os:timer-accumulated-seconds';

const timeEntryTypes: EntryType[] = ['planned', 'unplanned'];

const isEntryType = (value: string): value is EntryType =>
  timeEntryTypes.includes(value as EntryType);

const parsePausedFocus = (raw: string | null): PausedFocus | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PausedFocus>;
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.stoppedAt || !parsed.entryType) return null;
    if (!isEntryType(parsed.entryType)) return null;
    if (parsed.entryType === 'unplanned' && !parsed.label) return null;
    if (typeof parsed.accumulatedSeconds !== 'number') return null;
    return {
      entryType: parsed.entryType,
      taskId: parsed.taskId ?? null,
      label: parsed.label ?? null,
      sessionId: parsed.sessionId ?? null,
      accumulatedSeconds: parsed.accumulatedSeconds,
      stoppedAt: parsed.stoppedAt,
    };
  } catch {
    return null;
  }
};

const normalizeLabel = (value: string) => value.trim().toLowerCase();

const formatDuration = (seconds: number) => {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(secs).padStart(2, '0');
  if (hours > 0) return `${hours}:${paddedMinutes}:${paddedSeconds}`;
  return `${paddedMinutes}:${paddedSeconds}`;
};

const computeDurationSeconds = (startIso: string, endIso: string) => {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.max(0, Math.floor((end - start) / 1000));
};

export function useTimer() {
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
  const [tick, setTick] = useState(0);

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: async (): Promise<ItemRow[]> => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('type', 'task')
        .eq('is_trashed', false)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ItemRow[];
    },
    staleTime: 30_000,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async (): Promise<ItemRow[]> => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('type', 'project')
        .eq('is_trashed', false)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ItemRow[];
    },
    staleTime: 60_000,
  });

  const cutoff = useMemo(
    () => new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const { data: unplannedEntries = [] } = useQuery({
    queryKey: ['timer', 'unplanned', cutoff],
    queryFn: async (): Promise<TimeEntryRow[]> => {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('is_trashed', false)
        .eq('entry_type', 'unplanned')
        .gte('started_at', cutoff)
        .order('started_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as TimeEntryRow[];
    },
    staleTime: 5 * 60_000,
  });

  const { data: activeEntries = [] } = useQuery({
    queryKey: ['timer', 'active'],
    queryFn: async (): Promise<TimeEntryRow[]> => {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('is_trashed', false)
        .is('stopped_at', null)
        .order('started_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as TimeEntryRow[];
    },
    staleTime: 0,
    refetchInterval: 5_000,
  });

  const invalidateTimer = () => {
    queryClient.invalidateQueries({ queryKey: ['timer', 'active'] });
    queryClient.invalidateQueries({ queryKey: ['timer', 'unplanned'] });
  };

  const activeEntry: TimeEntryRow | null = useMemo(() => {
    if (activeEntries.length === 0) return null;
    if (activeEntries.length > 1) {
      // Stop all but the first — fire and forget
      const [, ...rest] = activeEntries;
      for (const entry of rest) {
        const timestamp = new Date().toISOString();
        const durationSeconds = computeDurationSeconds(entry.started_at, timestamp);
        void supabase
          .from('time_entries')
          .update({ stopped_at: timestamp, duration_seconds: durationSeconds, updated_at: timestamp })
          .eq('id', entry.id);
      }
    }
    return activeEntries[0];
  }, [activeEntries]);

  // Tick timer
  useMemo(() => {
    if (!activeEntry) return;
    const interval = window.setInterval(() => {
      setTick(Date.now());
    }, 1000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEntry?.id]);

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

  const stopEntry = useCallback(
    async (entry: TimeEntryRow) => {
      const timestamp = new Date().toISOString();
      const durationSeconds = computeDurationSeconds(entry.started_at, timestamp);
      const sessionId = entry.session_id ?? uuidv4();
      const { error } = await supabase
        .from('time_entries')
        .update({ stopped_at: timestamp, duration_seconds: durationSeconds, session_id: sessionId, updated_at: timestamp })
        .eq('id', entry.id);
      if (error) throw error;
      return { durationSeconds, stoppedAt: timestamp, sessionId };
    },
    []
  );

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
        taskId: activeEntry.item_id ?? null,
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
  const focusProject = focusTask?.parent_id
    ? projectMap.get(focusTask.parent_id) ?? null
    : null;

  const focusState: FocusState = activeEntry
    ? 'running'
    : pausedFocus
      ? 'paused'
      : 'idle';

  const elapsedSeconds = useMemo(() => {
    if (activeEntry) {
      const timestamp = tick || Date.now();
      const startedAt = new Date(activeEntry.started_at).getTime();
      if (Number.isNaN(startedAt)) return accumulatedSeconds;
      const runningSeconds = Math.max(0, Math.floor((timestamp - startedAt) / 1000));
      return accumulatedSeconds + runningSeconds;
    }
    if (pausedFocus) return accumulatedSeconds;
    return 0;
  }, [activeEntry, accumulatedSeconds, pausedFocus, tick]);

  const elapsedLabel = formatDuration(elapsedSeconds);

  const activityLabel = useMemo(() => {
    if (!focusContext) return 'Select a task or add an unplanned entry';
    if (focusContext.entryType === 'unplanned') return focusContext.label ?? 'Unplanned entry';
    return focusTask?.title ?? 'Select a task';
  }, [focusContext, focusTask]);

  const projectLabel = focusProject?.title ?? null;
  const isUnplanned = focusContext?.entryType === 'unplanned';

  const taskOptions: TaskOption[] = useMemo(
    () => tasks.map((task) => ({
      id: task.id,
      title: task.title ?? '',
      projectTitle: task.parent_id ? projectMap.get(task.parent_id)?.title ?? null : null,
    })),
    [tasks, projectMap]
  );

  const unplannedSuggestions: UnplannedSuggestion[] = useMemo(() => {
    const suggestionMap = new Map<string, { label: string; normalized: string; count: number; lastUsedAt: number }>();
    unplannedEntries.forEach((entry) => {
      const label = entry.label ?? '';
      const normalized = entry.label_normalized ?? (label ? normalizeLabel(label) : '');
      if (!normalized) return;
      const lastUsedAt = new Date(entry.started_at).getTime();
      const existing = suggestionMap.get(normalized);
      if (!existing) {
        suggestionMap.set(normalized, { label: label || normalized, normalized, count: 1, lastUsedAt: Number.isFinite(lastUsedAt) ? lastUsedAt : 0 });
        return;
      }
      existing.count += 1;
      if (Number.isFinite(lastUsedAt) && lastUsedAt > existing.lastUsedAt) {
        existing.lastUsedAt = lastUsedAt;
        if (label) existing.label = label;
      }
    });
    return Array.from(suggestionMap.values())
      .sort((a, b) => b.count !== a.count ? b.count - a.count : b.lastUsedAt - a.lastUsedAt)
      .map(({ label, normalized }) => ({ label, normalized }));
  }, [unplannedEntries]);

  const startEntry = useCallback(
    async (
      config: StartConfig,
      options?: { force?: boolean; preserveAccumulated?: boolean; sessionId?: string }
    ): Promise<StartResult> => {
      if (activeEntry && !options?.force) return { ok: false, blocked: true };
      if (activeEntry && options?.force) await stopEntry(activeEntry);

      const timestamp = new Date().toISOString();
      const sessionId = options?.sessionId ?? uuidv4();
      const label = config.entryType === 'unplanned' ? config.label.trim() : null;
      const labelNormalized = label ? normalizeLabel(label) : null;
      const owner = (await supabase.auth.getUser()).data.user?.id ?? null;

      const { error } = await supabase.from('time_entries').insert({
        id: uuidv4(),
        item_id: config.entryType === 'planned' ? config.taskId : null,
        session_id: sessionId,
        entry_type: config.entryType,
        label,
        label_normalized: labelNormalized,
        started_at: timestamp,
        stopped_at: null,
        duration_seconds: null,
        created_at: timestamp,
        updated_at: timestamp,
        is_trashed: false,
        trashed_at: null,
        owner,
      });
      if (error) throw error;

      setPausedFocusState(null);
      if (!options?.preserveAccumulated) setAccumulatedSecondsState(0);
      invalidateTimer();
      return { ok: true };
    },
    [activeEntry, setAccumulatedSecondsState, setPausedFocusState, stopEntry]
  );

  const pause = useCallback(async () => {
    if (!activeEntry) return;
    const result = await stopEntry(activeEntry);
    const nextAccumulated = accumulatedSeconds + result.durationSeconds;
    setAccumulatedSecondsState(nextAccumulated);
    setPausedFocusState({
      entryType: activeEntry.entry_type as EntryType,
      taskId: activeEntry.item_id ?? null,
      label: activeEntry.label ?? null,
      sessionId: result.sessionId,
      accumulatedSeconds: nextAccumulated,
      stoppedAt: result.stoppedAt,
    });
    invalidateTimer();
  }, [activeEntry, accumulatedSeconds, setAccumulatedSecondsState, setPausedFocusState, stopEntry]);

  const resume = useCallback(async () => {
    if (!pausedFocus) return;
    if (pausedFocus.entryType === 'planned' && !pausedFocus.taskId) return;
    if (pausedFocus.entryType === 'unplanned' && !pausedFocus.label) return;
    const config: StartConfig =
      pausedFocus.entryType === 'planned'
        ? { entryType: 'planned', taskId: pausedFocus.taskId! }
        : { entryType: 'unplanned', label: pausedFocus.label! };
    await startEntry(config, { force: true, preserveAccumulated: true, sessionId: pausedFocus.sessionId ?? undefined });
  }, [pausedFocus, startEntry]);

  const stop = useCallback(async () => {
    if (activeEntry) {
      await stopEntry(activeEntry);
      setPausedFocusState(null);
      setAccumulatedSecondsState(0);
      invalidateTimer();
      return;
    }
    if (pausedFocus) {
      setPausedFocusState(null);
      setAccumulatedSecondsState(0);
    }
  }, [activeEntry, pausedFocus, setAccumulatedSecondsState, setPausedFocusState, stopEntry]);

  return {
    isReady: true,
    state: focusState,
    elapsedSeconds,
    elapsedLabel,
    activityLabel,
    projectLabel,
    isUnplanned,
    taskOptions,
    unplannedSuggestions,
    startEntry,
    pause,
    resume,
    stop,
  };
}

export type { EntryType, FocusState, StartConfig, TaskOption, UnplannedSuggestion };
