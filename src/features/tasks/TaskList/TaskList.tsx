import { useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import type { ItemRow } from '@/lib/db';
import { insertItem, patchItem } from '@/lib/db';
import { TaskDetailSheet } from '@/features/tasks/TaskDetailSheet/TaskDetailSheet';
import { formatRelativeTime } from '@/features/notes/noteUtils';
import { useNavigationState, useNavigationActions } from '@/components/providers';
import {
  matchesTaskFilter,
  sortByDeadline,
  getUpcomingItems,
  getTodaySections,
  type TaskListFilter,
  type UpcomingItem,
} from '@/features/tasks/taskBuckets';
import { nowIso } from '@/lib/time';
import { BackIcon, PlusIcon } from '@/components/ui/icons';
import styles from './TaskList.module.css';

function formatDateLabel(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(iso));
}

function isStartDateToday(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const offsetMs = d.getTimezoneOffset() * 60000;
  const now = new Date();
  const nowOffsetMs = now.getTimezoneOffset() * 60000;
  return (
    new Date(d.getTime() - offsetMs).toISOString().slice(0, 10) ===
    new Date(now.getTime() - nowOffsetMs).toISOString().slice(0, 10)
  );
}

export function TaskList() {
  const [showNextOnly, setShowNextOnly] = useState(false);
  const pendingTimersRef = useRef<Map<string, number>>(new Map());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const { stack } = useNavigationState();
  const { pushLayer, popLayer, goBack } = useNavigationActions();

  const taskDetailLayer = stack.find((layer) => layer.view === 'task-detail');
  const selectedTaskId = taskDetailLayer?.view === 'task-detail' ? taskDetailLayer.taskId : null;
  const taskListLayer = [...stack].reverse().find((layer) => layer.view === 'tasks-list');
  const layerFilter = taskListLayer?.view === 'tasks-list' ? (taskListLayer.filter ?? 'backlog') : 'backlog';
  const [filter, setFilter] = useState<TaskListFilter>(layerFilter);

  useEffect(() => { setFilter(layerFilter); }, [layerFilter]);

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: async (): Promise<ItemRow[]> => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('type', 'task')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ItemRow[];
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
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

  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.id, p.title ?? ''])),
    [projects]
  );
  const projectOptions = useMemo(
    () => [...projects].sort((a, b) => (a.title ?? '').localeCompare(b.title ?? '')),
    [projects]
  );

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId]
  );

  const todaySections = useMemo(() => {
    if (filter !== 'today') return null;
    return getTodaySections(tasks);
  }, [filter, tasks]);

  const upcomingItems = useMemo((): UpcomingItem[] => {
    if (filter !== 'upcoming') return [];
    return getUpcomingItems(tasks);
  }, [filter, tasks]);

  const filteredTasks = useMemo(() => {
    if (filter === 'today' || filter === 'upcoming') return [];
    const base = tasks.filter((t) => matchesTaskFilter(t, filter));
    if (filter === 'backlog' && showNextOnly) {
      return [...base.filter((t) => t.is_next)].sort(sortByDeadline);
    }
    return [...base].sort(sortByDeadline);
  }, [filter, tasks, showNextOnly]);

  const invalidateTasks = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['tasks', 'counts-raw'] });
  };

  const handleCreateTask = async () => {
    const timestamp = nowIso();
    const taskId = uuidv4();
    await insertItem({
      id: taskId,
      type: 'task',
      parent_id: null,
      title: 'Untitled task',
      content: null,
      is_pinned: false,
      item_status: 'backlog',
      completed: false,
      is_next: false,
      is_someday: false,
      is_waiting: false,
      processed: false,
      created_at: timestamp,
      updated_at: timestamp,
    });
    invalidateTasks();
    pushLayer({ view: 'task-detail', taskId });
  };

  const handleOpenTask = (taskId: string) => pushLayer({ view: 'task-detail', taskId });
  const handleDetailOpenChange = (open: boolean) => { if (!open) popLayer(); };

  const handleSaveTask = async (
    taskId: string,
    updates: {
      title: string;
      description: string;
      parentId: string | null;
      isNext: boolean;
      startDate: string | null;
      dueDate: string | null;
      isSomeday: boolean;
      isWaiting: boolean;
      waitingNote: string | null;
      tags: string[];
    }
  ) => {
    const trimmedTitle = updates.title.trim();
    if (!trimmedTitle) return;
    await patchItem(taskId, {
      title: trimmedTitle,
      content: updates.description.trim() || null,
      parent_id: updates.parentId,
      is_next: updates.isNext,
      start_date: updates.startDate,
      due_date: updates.dueDate,
      is_someday: updates.isSomeday,
      is_waiting: updates.isWaiting,
      waiting_note: updates.waitingNote,
      tags: updates.tags,
      updated_at: nowIso(),
    });
    invalidateTasks();
  };

  const handleDeleteTask = async (taskId: string) => {
    const timestamp = nowIso();
    await patchItem(taskId, { is_trashed: true, trashed_at: timestamp, updated_at: timestamp });
    invalidateTasks();
  };

  const handleToggleComplete = async (taskId: string, nextValue: boolean) => {
    await patchItem(taskId, { completed: nextValue, updated_at: nowIso() });
    invalidateTasks();
  };

  useEffect(() => {
    const timers = pendingTimersRef.current;
    return () => { timers.forEach((id) => window.clearTimeout(id)); };
  }, []);

  const handleCheckboxChange = (taskId: string, checked: boolean) => {
    if (checked) {
      const timerId = window.setTimeout(async () => {
        pendingTimersRef.current.delete(taskId);
        setPendingIds((prev) => { const s = new Set(prev); s.delete(taskId); return s; });
        await handleToggleComplete(taskId, true);
      }, 4000);
      pendingTimersRef.current.set(taskId, timerId);
      setPendingIds((prev) => new Set([...prev, taskId]));
    } else {
      const timerId = pendingTimersRef.current.get(taskId);
      if (timerId !== undefined) {
        window.clearTimeout(timerId);
        pendingTimersRef.current.delete(taskId);
        setPendingIds((prev) => { const s = new Set(prev); s.delete(taskId); return s; });
      } else {
        void handleToggleComplete(taskId, false);
      }
    }
  };

  const renderTaskRow = (task: ItemRow, dateLabel?: string) => {
    const projectLabel = task.parent_id ? projectMap.get(task.parent_id) : null;
    const snippet = task.content?.trim() ?? '';
    const isPending = pendingIds.has(task.id);

    return (
      <div
        key={`${task.id}${dateLabel ?? ''}`}
        className={`${styles.item}${task.is_next ? ` ${styles.itemNext}` : ''}${isPending ? ` ${styles.itemPending}` : ''}`}
      >
        <label className={styles.itemCheckboxLabel} aria-label="Mark complete">
          <input
            type="checkbox"
            className={styles.itemCheckbox}
            checked={!!task.completed || isPending}
            onChange={(e) => handleCheckboxChange(task.id, e.target.checked)}
          />
        </label>
        <button type="button" className={styles.itemContent} onClick={() => handleOpenTask(task.id)}>
          <div className={styles.itemHeader}>
            <div className={styles.itemTitle}>{task.title}</div>
          </div>
          {snippet ? <div className={styles.itemSnippet}>{snippet}</div> : null}
          <div className={styles.itemMeta}>
            {dateLabel ? <span className={styles.itemDateLabel}>{dateLabel}</span> : null}
            {!task.is_waiting && !task.is_someday && isStartDateToday(task.start_date) ? (
              <span className={styles.itemBadge}>Today</span>
            ) : null}
            {task.is_waiting ? <span className={styles.itemWaiting}>Waiting</span> : null}
            {task.is_someday ? <span className={styles.itemBadge}>Someday</span> : null}
            {task.is_next ? <span className={styles.itemNextBadge}>Next</span> : null}
            {projectLabel ? <span className={styles.itemProject}>{projectLabel}</span> : null}
            {task.completed ? <span className={styles.itemCompleted}>{formatRelativeTime(task.updated_at)}</span> : null}
          </div>
        </button>
      </div>
    );
  };

  const renderSection = (label: string, sectionTasks: ItemRow[]) => {
    if (sectionTasks.length === 0) return null;
    return (
      <div key={label} className={styles.section}>
        <div className={styles.sectionLabel}>{label}</div>
        {sectionTasks.map((t) => renderTaskRow(t))}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button type="button" className={styles.backButton} onClick={goBack} aria-label="Go back">
          <BackIcon />
        </button>
        <h1 className={styles.title}>Tasks</h1>
        <button type="button" className={styles.newButton} onClick={handleCreateTask} aria-label="New task">
          <PlusIcon />
        </button>
      </div>

      {filter === 'backlog' && (
        <div className={styles.viewToggle}>
          <button
            type="button"
            className={styles.viewToggleBtn}
            data-active={showNextOnly}
            onClick={() => setShowNextOnly((v) => !v)}
          >
            Next only
          </button>
        </div>
      )}

      <div className={styles.list}>
        {filter === 'today' && todaySections ? (
          <>
            {renderSection('Overdue', todaySections.overdue)}
            {todaySections.main.length > 0
              ? todaySections.main.map((t) => renderTaskRow(t))
              : todaySections.overdue.length === 0 && todaySections.waiting.length === 0
              ? <p className={styles.empty}>Nothing scheduled for today.</p>
              : null}
            {renderSection('Waiting', todaySections.waiting)}
          </>
        ) : filter === 'upcoming' ? (
          upcomingItems.length === 0 ? (
            <p className={styles.empty}>No upcoming dates.</p>
          ) : (
            upcomingItems.map((item) => {
              const prefix = item.dateType === 'start' ? 'Start:' : 'Due:';
              const label = `${prefix} ${formatDateLabel(item.task[item.dateType === 'start' ? 'start_date' : 'due_date']!)}`;
              return renderTaskRow(item.task, label);
            })
          )
        ) : filteredTasks.length === 0 ? (
          <p className={styles.empty}>No tasks in this view yet.</p>
        ) : (
          filteredTasks.map((task) => renderTaskRow(task))
        )}
      </div>

      {selectedTask ? (
        <TaskDetailSheet
          key={selectedTask.id}
          open={Boolean(selectedTask)}
          onOpenChange={handleDetailOpenChange}
          task={selectedTask}
          projects={projectOptions}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
          onToggleComplete={handleToggleComplete}
        />
      ) : null}
    </div>
  );
}
