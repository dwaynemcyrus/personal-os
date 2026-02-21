import { useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useDatabase } from '@/hooks/useDatabase';
import type { ProjectDocument, TaskDocument } from '@/lib/db';
import { TaskDetailSheet } from '@/features/tasks/TaskDetailSheet/TaskDetailSheet';
import { formatRelativeTime } from '@/features/notes/noteUtils';
import { useNavigationState, useNavigationActions } from '@/components/providers';
import {
  buildProjectStartMap,
  matchesTaskFilter,
  type TaskListFilter,
} from '@/features/tasks/taskBuckets';
import styles from './TaskList.module.css';

const nowIso = () => new Date().toISOString();

const getTime = (value: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.getTime();
};

const sortTasks = (a: TaskDocument, b: TaskDocument) => {
  const aDue = getTime(a.due_date);
  const bDue = getTime(b.due_date);

  if (aDue !== null && bDue !== null && aDue !== bDue) {
    return aDue - bDue;
  }
  if (aDue !== null && bDue === null) {
    return -1;
  }
  if (aDue === null && bDue !== null) {
    return 1;
  }

  const aUpdated = getTime(a.updated_at) ?? 0;
  const bUpdated = getTime(b.updated_at) ?? 0;
  if (aUpdated !== bUpdated) {
    return bUpdated - aUpdated;
  }

  return a.id.localeCompare(b.id);
};

const formatStatusLabel = (status: TaskDocument['status']) => {
  switch (status) {
    case 'next':
      return 'Next';
    case 'waiting':
      return 'Someday';
    default:
      return 'Backlog';
  }
};

const FILTER_ORDER: TaskListFilter[] = [
  'today',
  'upcoming',
  'next',
  'backlog',
  'someday',
  'logbook',
  'trash',
];

export function TaskList() {
  const { db, isReady } = useDatabase();
  const [tasks, setTasks] = useState<TaskDocument[]>([]);
  const [projects, setProjects] = useState<ProjectDocument[]>([]);

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
      ? taskListLayer.filter ?? 'next'
      : 'next';
  const [filter, setFilter] = useState<TaskListFilter>(layerFilter);

  useEffect(() => {
    setFilter(layerFilter);
  }, [layerFilter]);

  useEffect(() => {
    if (!db || !isReady) return;

    const subscription = db.tasks
      .find({
        sort: [{ updated_at: 'desc' }, { id: 'asc' }],
      })
      .$.subscribe((docs) => {
        setTasks(docs.map((doc) => doc.toJSON()));
      });

    return () => subscription.unsubscribe();
  }, [db, isReady]);

  useEffect(() => {
    if (!db || !isReady) return;

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

  const projectMap = useMemo(
    () => new Map(projects.map((project) => [project.id, project.title])),
    [projects]
  );
  const projectOptions = useMemo(
    () => [...projects].sort((a, b) => a.title.localeCompare(b.title)),
    [projects]
  );
  const projectStartById = useMemo(
    () => buildProjectStartMap(projects),
    [projects]
  );

  const sortedTasks = useMemo(() => [...tasks].sort(sortTasks), [tasks]);
  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId]
  );

  const filteredTasks = useMemo(
    () =>
      sortedTasks.filter((task) =>
        matchesTaskFilter(
          task,
          filter,
          task.project_id ? projectStartById.get(task.project_id) : null
        )
      ),
    [filter, projectStartById, sortedTasks]
  );

  const handleCreateTask = async () => {
    if (!db) return;
    const timestamp = nowIso();
    const taskId = uuidv4();
    await db.tasks.insert({
      id: taskId,
      project_id: null,
      title: 'Untitled task',
      description: null,
      status: 'backlog',
      completed: false,
      due_date: null,
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
    if (!open) {
      popLayer();
    }
  };

  const handleSaveTask = async (
    taskId: string,
    updates: {
      title: string;
      description: string;
      projectId: string | null;
      status: 'backlog' | 'waiting' | 'next';
    }
  ) => {
    if (!db) return;
    const trimmedTitle = updates.title.trim();
    if (!trimmedTitle) return;
    const doc = await db.tasks.findOne(taskId).exec();
    if (!doc) return;
    const timestamp = nowIso();
    await doc.patch({
      title: trimmedTitle,
      description: updates.description.trim() || null,
      project_id: updates.projectId,
      status: updates.status,
      updated_at: timestamp,
    });
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!db) return;
    const doc = await db.tasks.findOne(taskId).exec();
    if (!doc) return;
    const timestamp = nowIso();
    await doc.patch({
      is_trashed: true,
      trashed_at: timestamp,
      updated_at: timestamp,
    });
  };

  const handleToggleComplete = async (taskId: string, nextValue: boolean) => {
    if (!db) return;
    const doc = await db.tasks.findOne(taskId).exec();
    if (!doc) return;
    const timestamp = nowIso();
    await doc.patch({
      completed: nextValue,
      updated_at: timestamp,
    });
  };

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
            {value}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {filteredTasks.length === 0 ? (
          <p className={styles.empty}>No tasks in this view yet.</p>
        ) : (
          filteredTasks.map((task) => {
            const projectLabel = task.project_id
              ? projectMap.get(task.project_id) ?? 'No project'
              : 'No project';
            const snippet = task.description?.trim() ?? '';
            const updatedLabel = formatRelativeTime(task.updated_at);

            return (
              <button
                key={task.id}
                type="button"
                className={styles.item}
                onClick={() => handleOpenTask(task.id)}
              >
                <div className={styles.itemHeader}>
                  <div className={styles.itemTitle}>{task.title}</div>
                </div>
                {snippet ? (
                  <div className={styles.itemSnippet}>{snippet}</div>
                ) : null}
                <div className={styles.itemMeta}>
                  <span className={styles.itemDate}>{updatedLabel}</span>
                  <span className={styles.itemStatus}>
                    {formatStatusLabel(task.status)}
                  </span>
                  <span className={styles.itemProject}>{projectLabel}</span>
                  {task.completed ? (
                    <span className={styles.itemCompleted}>Completed</span>
                  ) : null}
                </div>
              </button>
            );
          })
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
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
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

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
