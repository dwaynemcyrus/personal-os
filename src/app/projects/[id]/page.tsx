'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { useDatabase } from '@/hooks/useDatabase';
import type { ProjectDocument, TaskDocument } from '@/lib/db';
import { TaskDetailSheet } from '@/features/tasks/TaskDetailSheet/TaskDetailSheet';
import { usePageTitle } from '@/components/layout/pageTitleStore';
import sectionStyles from '../../section.module.css';
import styles from './page.module.css';

const nowIso = () => new Date().toISOString();

const toInputDateTime = (iso: string | null) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const fromInputDateTime = (value: string) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

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
  if (aDue !== null && bDue === null) return -1;
  if (aDue === null && bDue !== null) return 1;

  const aUpdated = getTime(a.updated_at) ?? 0;
  const bUpdated = getTime(b.updated_at) ?? 0;
  if (aUpdated !== bUpdated) {
    return bUpdated - aUpdated;
  }

  return a.id.localeCompare(b.id);
};

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = Array.isArray(id) ? id[0] : id;
  const pathname = usePathname();
  const router = useRouter();
  const { db, isReady } = useDatabase();
  const { setTitle } = usePageTitle(pathname ?? '');

  const [project, setProject] = useState<ProjectDocument | null>(null);
  const [projects, setProjects] = useState<ProjectDocument[]>([]);
  const [tasks, setTasks] = useState<TaskDocument[]>([]);
  const [title, setTitleInput] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'backlog' | 'next' | 'active' | 'hold'>(
    'backlog'
  );
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (!db || !isReady || !projectId) return;

    const subscription = db.projects
      .findOne(projectId)
      .$.subscribe((doc) => {
        const nextProject = doc?.toJSON() ?? null;
        setProject(nextProject);
        if (nextProject) {
          setTitle(nextProject.title);
          setTitleInput(nextProject.title);
          setDescription(nextProject.description ?? '');
          setStatus(nextProject.status);
          setStartDate(toInputDateTime(nextProject.start_date));
          setDueDate(toInputDateTime(nextProject.due_date));
        } else {
          setTitle('Project');
        }
      });

    return () => subscription.unsubscribe();
  }, [db, isReady, projectId, setTitle]);

  useEffect(() => {
    if (!db || !isReady || !projectId) return;

    const subscription = db.tasks
      .find({
        selector: { is_trashed: false, project_id: projectId },
        sort: [{ updated_at: 'desc' }, { id: 'asc' }],
      })
      .$.subscribe((docs) => {
        setTasks(docs.map((doc) => doc.toJSON()));
      });

    return () => subscription.unsubscribe();
  }, [db, isReady, projectId]);

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

  const projectTasks = useMemo(() => [...tasks].sort(sortTasks), [tasks]);
  const activeTasks = projectTasks.filter((task) => !task.completed);
  const completedTasks = projectTasks.filter((task) => task.completed);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [selectedTaskId, tasks]
  );

  const canSave = useMemo(() => Boolean(title.trim()), [title]);

  const handleSave = async () => {
    if (!db || !project || !canSave) return;
    const trimmedTitle = title.trim();
    const timestamp = nowIso();
    const doc = await db.projects.findOne(project.id).exec();
    if (!doc) return;
    await doc.patch({
      title: trimmedTitle,
      description: description.trim() || null,
      status,
      start_date: fromInputDateTime(startDate),
      due_date: fromInputDateTime(dueDate),
      updated_at: timestamp,
    });
  };

  const handleDelete = async () => {
    if (!db || !project) return;
    const timestamp = nowIso();
    const doc = await db.projects.findOne(project.id).exec();
    if (!doc) return;
    await doc.patch({
      is_trashed: true,
      trashed_at: timestamp,
      updated_at: timestamp,
    });
    router.push('/execution');
  };

  const handleQuickAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!db || !project) return;
    const trimmed = taskTitle.trim();
    if (!trimmed) return;
    const timestamp = nowIso();
    await db.tasks.insert({
      id: uuidv4(),
      project_id: project.id,
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
    setTaskTitle('');
  };

  const handleToggleTaskComplete = async (taskId: string, nextValue: boolean) => {
    if (!db) return;
    const doc = await db.tasks.findOne(taskId).exec();
    if (!doc) return;
    const timestamp = nowIso();
    await doc.patch({
      completed: nextValue,
      updated_at: timestamp,
    });
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

  if (!projectId) {
    return (
      <section className={sectionStyles.section}>
        <p className={styles.empty}>Project not found.</p>
      </section>
    );
  }

  return (
    <section className={sectionStyles.section}>
      {!project ? (
        <p className={styles.empty}>Loading project...</p>
      ) : (
        <>
          <div className={styles.card}>
            <label className={styles.field}>
              <span className={styles.label}>Title</span>
              <input
                className={styles.input}
                value={title}
                onChange={(event) => setTitleInput(event.target.value)}
                placeholder="Project title"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Description</span>
              <textarea
                className={styles.textarea}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Project description"
                rows={4}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Status</span>
              <select
                className={styles.input}
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as 'backlog' | 'next' | 'active' | 'hold'
                  )
                }
              >
                <option value="backlog">Backlog</option>
                <option value="next">Next</option>
                <option value="active">Active</option>
                <option value="hold">Hold</option>
              </select>
            </label>

            <div className={styles.row}>
              <label className={styles.field}>
                <span className={styles.label}>Start</span>
                <div className={styles.inputRow}>
                  <input
                    className={styles.input}
                    type="datetime-local"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                  />
                  <button
                    type="button"
                    className={styles.clear}
                    onClick={() => setStartDate('')}
                    disabled={!startDate}
                  >
                    Clear
                  </button>
                </div>
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Due</span>
                <div className={styles.inputRow}>
                  <input
                    className={styles.input}
                    type="datetime-local"
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                  />
                  <button
                    type="button"
                    className={styles.clear}
                    onClick={() => setDueDate('')}
                    disabled={!dueDate}
                  >
                    Clear
                  </button>
                </div>
              </label>
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.button}
                onClick={handleSave}
                disabled={!canSave}
              >
                Save
              </button>
              <button
                type="button"
                className={`${styles.button} ${styles.buttonDanger}`}
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.sectionTitle}>Tasks</div>
            <form className={styles.composer} onSubmit={handleQuickAdd}>
              <input
                className={styles.composerInput}
                type="text"
                placeholder="Add a task"
                value={taskTitle}
                onChange={(event) => setTaskTitle(event.target.value)}
              />
              <button className={styles.composerButton} type="submit">
                Add
              </button>
            </form>
            {activeTasks.length === 0 ? (
              <p className={styles.empty}>No tasks for this project yet.</p>
            ) : (
              <div className={styles.list}>
                {activeTasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    className={styles.item}
                    onClick={() => setSelectedTaskId(task.id)}
                  >
                    <span className={styles.itemToggle}>
                      <input
                        className={styles.itemCheckbox}
                        type="checkbox"
                        checked={task.completed}
                        onChange={(event) =>
                          handleToggleTaskComplete(task.id, event.target.checked)
                        }
                        onClick={(event) => event.stopPropagation()}
                        aria-label={`Mark ${task.title} as completed`}
                      />
                    </span>
                    <div className={styles.itemTitle}>{task.title}</div>
                  </button>
                ))}
              </div>
            )}

            {completedTasks.length > 0 ? (
              <div className={styles.completed}>
                <div className={styles.sectionTitle}>Completed</div>
                <div className={styles.list}>
                  {completedTasks.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      className={styles.item}
                      onClick={() => setSelectedTaskId(task.id)}
                    >
                      <span className={styles.itemToggle}>
                        <input
                          className={styles.itemCheckbox}
                          type="checkbox"
                          checked={task.completed}
                          onChange={(event) =>
                            handleToggleTaskComplete(task.id, event.target.checked)
                          }
                          onClick={(event) => event.stopPropagation()}
                          aria-label={`Mark ${task.title} as active`}
                        />
                      </span>
                      <div className={styles.itemTitle}>{task.title}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </>
      )}

      {selectedTask ? (
        <TaskDetailSheet
          key={selectedTask.id}
          open={Boolean(selectedTask)}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setSelectedTaskId(null);
          }}
          task={selectedTask}
          projects={projects}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
          onToggleComplete={handleToggleTaskComplete}
        />
      ) : null}
    </section>
  );
}
