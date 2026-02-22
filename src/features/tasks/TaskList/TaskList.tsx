import { useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useDatabase } from '@/hooks/useDatabase';
import type { ProjectDocument, TaskDocument } from '@/lib/db';
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
import styles from './TaskList.module.css';

const nowIso = () => new Date().toISOString();

const FILTER_ORDER: TaskListFilter[] = [
  'today',
  'upcoming',
  'backlog',
  'someday',
  'logbook',
  'trash',
];

function formatDateLabel(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(iso));
}

export function TaskList() {
  const { db, isReady } = useDatabase();
  const [tasks, setTasks] = useState<TaskDocument[]>([]);
  const [projects, setProjects] = useState<ProjectDocument[]>([]);
  const [showNextOnly, setShowNextOnly] = useState(false);

  const { stack } = useNavigationState();
  const { pushLayer, popLayer, goBack } = useNavigationActions();

  const taskDetailLayer = stack.find((layer) => layer.view === 'task-detail');
  const selectedTaskId =
    taskDetailLayer && taskDetailLayer.view === 'task-detail'
      ? taskDetailLayer.taskId
      : null;
  const taskListLayer = [...stack]
    .reverse()
    .find((layer) => layer.view === 'tasks-list');
  const layerFilter =
    taskListLayer && taskListLayer.view === 'tasks-list'
      ? taskListLayer.filter ?? 'backlog'
      : 'backlog';
  const [filter, setFilter] = useState<TaskListFilter>(layerFilter);

  useEffect(() => {
    setFilter(layerFilter);
  }, [layerFilter]);

  useEffect(() => {
    if (!db || !isReady) return;
    const subscription = db.tasks
      .find({ sort: [{ updated_at: 'desc' }, { id: 'asc' }] })
      .$.subscribe((docs) => setTasks(docs.map((doc) => doc.toJSON())));
    return () => subscription.unsubscribe();
  }, [db, isReady]);

  useEffect(() => {
    if (!db || !isReady) return;
    const subscription = db.projects
      .find({ selector: { is_trashed: false }, sort: [{ updated_at: 'desc' }, { id: 'asc' }] })
      .$.subscribe((docs) => setProjects(docs.map((doc) => doc.toJSON())));
    return () => subscription.unsubscribe();
  }, [db, isReady]);

  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.id, p.title])),
    [projects]
  );
  const projectOptions = useMemo(
    () => [...projects].sort((a, b) => a.title.localeCompare(b.title)),
    [projects]
  );

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId]
  );

  // ─── Sections ────────────────────────────────────────────────────────────

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

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleCreateTask = async () => {
    if (!db) return;
    const timestamp = nowIso();
    const taskId = uuidv4();
    await db.tasks.insert({
      id: taskId,
      project_id: null,
      area_id: null,
      title: 'Untitled task',
      description: null,
      completed: false,
      is_someday: false,
      is_next: false,
      is_waiting: false,
      waiting_note: null,
      waiting_started_at: null,
      start_date: null,
      due_date: null,
      tags: [],
      content: null,
      priority: null,
      depends_on: null,
      okr_id: null,
      created_at: timestamp,
      updated_at: timestamp,
      is_trashed: false,
      trashed_at: null,
    });
    pushLayer({ view: 'task-detail', taskId });
  };

  const handleOpenTask = (taskId: string) => {
    pushLayer({ view: 'task-detail', taskId });
  };

  const handleDetailOpenChange = (open: boolean) => {
    if (!open) popLayer();
  };

  const handleSaveTask = async (
    taskId: string,
    updates: {
      title: string;
      description: string;
      projectId: string | null;
      areaId: string | null;
      isNext: boolean;
      startDate: string | null;
      dueDate: string | null;
      isSomeday: boolean;
      isWaiting: boolean;
      waitingNote: string | null;
      waitingStartedAt: string | null;
      tags: string[];
    }
  ) => {
    if (!db) return;
    const trimmedTitle = updates.title.trim();
    if (!trimmedTitle) return;
    const doc = await db.tasks.findOne(taskId).exec();
    if (!doc) return;
    await doc.patch({
      title: trimmedTitle,
      description: updates.description.trim() || null,
      project_id: updates.projectId,
      area_id: updates.areaId,
      is_next: updates.isNext,
      start_date: updates.startDate,
      due_date: updates.dueDate,
      is_someday: updates.isSomeday,
      is_waiting: updates.isWaiting,
      waiting_note: updates.waitingNote,
      waiting_started_at: updates.waitingStartedAt,
      tags: updates.tags,
      updated_at: nowIso(),
    });
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!db) return;
    const doc = await db.tasks.findOne(taskId).exec();
    if (!doc) return;
    const timestamp = nowIso();
    await doc.patch({ is_trashed: true, trashed_at: timestamp, updated_at: timestamp });
  };

  const handleToggleComplete = async (taskId: string, nextValue: boolean) => {
    if (!db) return;
    const doc = await db.tasks.findOne(taskId).exec();
    if (!doc) return;
    await doc.patch({ completed: nextValue, updated_at: nowIso() });
  };

  // ─── Render helpers ───────────────────────────────────────────────────────

  const renderTaskRow = (task: TaskDocument, dateLabel?: string) => {
    const projectLabel = task.project_id ? projectMap.get(task.project_id) : null;
    const snippet = task.description?.trim() ?? '';

    return (
      <button
        key={`${task.id}${dateLabel ?? ''}`}
        type="button"
        className={`${styles.item}${task.is_next ? ` ${styles.itemNext}` : ''}`}
        onClick={() => handleOpenTask(task.id)}
      >
        <div className={styles.itemHeader}>
          <div className={styles.itemTitle}>{task.title}</div>
        </div>
        {snippet ? <div className={styles.itemSnippet}>{snippet}</div> : null}
        <div className={styles.itemMeta}>
          {dateLabel ? (
            <span className={styles.itemDateLabel}>{dateLabel}</span>
          ) : null}
          {task.is_waiting ? (
            <span className={styles.itemWaiting}>Waiting</span>
          ) : null}
          {task.is_someday ? (
            <span className={styles.itemBadge}>Someday</span>
          ) : null}
          {task.is_next ? (
            <span className={styles.itemNextBadge}>Next</span>
          ) : null}
          {projectLabel ? (
            <span className={styles.itemProject}>{projectLabel}</span>
          ) : null}
          {task.completed ? (
            <span className={styles.itemCompleted}>{formatRelativeTime(task.updated_at)}</span>
          ) : null}
        </div>
      </button>
    );
  };

  const renderSection = (label: string, sectionTasks: TaskDocument[]) => {
    if (sectionTasks.length === 0) return null;
    return (
      <div key={label} className={styles.section}>
        <div className={styles.sectionLabel}>{label}</div>
        {sectionTasks.map((t) => renderTaskRow(t))}
      </div>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.backButton}
          onClick={goBack}
          aria-label="Go back"
        >
          <BackIcon />
        </button>
        <h1 className={styles.title}>Tasks</h1>
        <button
          type="button"
          className={styles.newButton}
          onClick={handleCreateTask}
          disabled={!db || !isReady}
          aria-label="New task"
        >
          <PlusIcon />
        </button>
      </div>

      <div className={styles.filters} role="group" aria-label="Task filters">
        {FILTER_ORDER.map((value) => (
          <button
            key={value}
            type="button"
            className={styles.filterButton}
            data-active={filter === value}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </button>
        ))}
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

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
