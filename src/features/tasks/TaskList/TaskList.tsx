'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useDatabase } from '@/hooks/useDatabase';
import type { ProjectDocument, TaskDocument } from '@/lib/db';
import { TaskDetailSheet } from '@/features/tasks/TaskDetailSheet/TaskDetailSheet';
import { useNavigationState, useNavigationActions } from '@/components/providers';
import styles from './TaskList.module.css';

type TaskFilter = 'all' | 'next' | 'backlog' | 'waiting' | 'completed';

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

export function TaskList() {
  const { db, isReady } = useDatabase();
  const [tasks, setTasks] = useState<TaskDocument[]>([]);
  const [projects, setProjects] = useState<ProjectDocument[]>([]);
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [titleInput, setTitleInput] = useState('');

  const { stack } = useNavigationState();
  const { pushLayer, popLayer } = useNavigationActions();

  // Find if task-detail is in stack
  const taskDetailLayer = stack.find((layer) => layer.view === 'task-detail');
  const selectedTaskId = taskDetailLayer && taskDetailLayer.view === 'task-detail'
    ? taskDetailLayer.taskId
    : null;

  useEffect(() => {
    if (!db || !isReady) return;

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

  const sortedTasks = useMemo(() => [...tasks].sort(sortTasks), [tasks]);
  const activeTasks = sortedTasks.filter((task) => !task.completed);
  const completedTasks = sortedTasks.filter((task) => task.completed);
  const nextTasks = activeTasks.filter((task) => task.status === 'next');
  const backlogTasks = activeTasks.filter((task) => task.status === 'backlog');
  const waitingTasks = activeTasks.filter((task) => task.status === 'waiting');
  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId]
  );

  const showAllActive = filter === 'all';
  const showNext = filter === 'next';
  const showBacklog = filter === 'backlog';
  const showWaiting = filter === 'waiting';
  const showCompleted = filter === 'completed' || filter === 'all';

  const createTask = async () => {
    if (!db) return;
    const trimmed = titleInput.trim();
    if (!trimmed) return;

    const timestamp = nowIso();
    await db.tasks.insert({
      id: uuidv4(),
      project_id: null,
      title: trimmed,
      description: null,
      status: 'backlog',
      completed: false,
      due_date: null,
      created_at: timestamp,
      updated_at: timestamp,
      is_trashed: false,
      trashed_at: null,
    });
    setTitleInput('');
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await createTask();
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
    <div className={styles.tasks}>
      <form className={styles.composer} onSubmit={onSubmit}>
        <input
          className={styles.composerInput}
          type="text"
          placeholder="Add a task"
          value={titleInput}
          onChange={(event) => setTitleInput(event.target.value)}
        />
        <button className={styles.composerButton} type="submit">
          Add
        </button>
      </form>

      <div className={styles.filters} role="tablist" aria-label="Task filters">
        {(['all', 'next', 'backlog', 'waiting', 'completed'] as const).map(
          (value) => (
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
          )
        )}
      </div>

      {showAllActive ? (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Open</div>
          {activeTasks.length === 0 ? (
            <p className={styles.empty}>No open tasks yet.</p>
          ) : (
            <div className={styles.list}>
              {activeTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  className={styles.item}
                  onClick={() => handleOpenTask(task.id)}
                >
                  <span className={styles.itemToggle}>
                    <input
                      className={styles.itemCheckbox}
                      type="checkbox"
                      checked={task.completed}
                      onChange={(event) =>
                        handleToggleComplete(task.id, event.target.checked)
                      }
                      onClick={(event) => event.stopPropagation()}
                      aria-label={`Mark ${task.title} as completed`}
                    />
                  </span>
                  <div className={styles.itemTitle}>{task.title}</div>
                  <div className={styles.itemMeta}>
                    {task.project_id
                      ? projectMap.get(task.project_id) ?? 'No project'
                      : 'No project'}
                    <span className={styles.itemStatus}>{task.status}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {showNext ? (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Next</div>
          {nextTasks.length === 0 ? (
            <p className={styles.empty}>No next tasks yet.</p>
          ) : (
            <div className={styles.list}>
              {nextTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  className={styles.item}
                  onClick={() => handleOpenTask(task.id)}
                >
                  <span className={styles.itemToggle}>
                    <input
                      className={styles.itemCheckbox}
                      type="checkbox"
                      checked={task.completed}
                      onChange={(event) =>
                        handleToggleComplete(task.id, event.target.checked)
                      }
                      onClick={(event) => event.stopPropagation()}
                      aria-label={`Mark ${task.title} as completed`}
                    />
                  </span>
                  <div className={styles.itemTitle}>{task.title}</div>
                  <div className={styles.itemMeta}>
                    {task.project_id
                      ? projectMap.get(task.project_id) ?? 'No project'
                      : 'No project'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {showBacklog ? (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Backlog</div>
          {backlogTasks.length === 0 ? (
            <p className={styles.empty}>No backlog tasks yet.</p>
          ) : (
            <div className={styles.list}>
              {backlogTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  className={styles.item}
                  onClick={() => handleOpenTask(task.id)}
                >
                  <span className={styles.itemToggle}>
                    <input
                      className={styles.itemCheckbox}
                      type="checkbox"
                      checked={task.completed}
                      onChange={(event) =>
                        handleToggleComplete(task.id, event.target.checked)
                      }
                      onClick={(event) => event.stopPropagation()}
                      aria-label={`Mark ${task.title} as completed`}
                    />
                  </span>
                  <div className={styles.itemTitle}>{task.title}</div>
                  <div className={styles.itemMeta}>
                    {task.project_id
                      ? projectMap.get(task.project_id) ?? 'No project'
                      : 'No project'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {showWaiting ? (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Waiting</div>
          {waitingTasks.length === 0 ? (
            <p className={styles.empty}>No waiting tasks yet.</p>
          ) : (
            <div className={styles.list}>
              {waitingTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  className={styles.item}
                  onClick={() => handleOpenTask(task.id)}
                >
                  <span className={styles.itemToggle}>
                    <input
                      className={styles.itemCheckbox}
                      type="checkbox"
                      checked={task.completed}
                      onChange={(event) =>
                        handleToggleComplete(task.id, event.target.checked)
                      }
                      onClick={(event) => event.stopPropagation()}
                      aria-label={`Mark ${task.title} as completed`}
                    />
                  </span>
                  <div className={styles.itemTitle}>{task.title}</div>
                  <div className={styles.itemMeta}>
                    {task.project_id
                      ? projectMap.get(task.project_id) ?? 'No project'
                      : 'No project'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {showCompleted ? (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Completed</div>
          {completedTasks.length === 0 ? (
            <p className={styles.empty}>No completed tasks yet.</p>
          ) : (
            <div className={styles.list}>
              {completedTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  className={styles.item}
                  onClick={() => handleOpenTask(task.id)}
                >
                  <span className={styles.itemToggle}>
                    <input
                      className={styles.itemCheckbox}
                      type="checkbox"
                      checked={task.completed}
                      onChange={(event) =>
                        handleToggleComplete(task.id, event.target.checked)
                      }
                      onClick={(event) => event.stopPropagation()}
                      aria-label={`Mark ${task.title} as active`}
                    />
                  </span>
                  <div className={styles.itemTitle}>{task.title}</div>
                  <div className={styles.itemMeta}>
                    {task.project_id
                      ? projectMap.get(task.project_id) ?? 'No project'
                      : 'No project'}
                    <span className={styles.itemStatus}>{task.status}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}

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
