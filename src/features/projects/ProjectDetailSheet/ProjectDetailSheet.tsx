

import { useMemo, useState, type FormEvent } from 'react';
import { sortByDeadline } from '@/features/tasks/taskBuckets';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from '@/components/ui/Sheet';
import type { ProjectDocument, TaskDocument } from '@/lib/db';
import { TaskDetailSheet } from '@/features/tasks/TaskDetailSheet/TaskDetailSheet';
import styles from './ProjectDetailSheet.module.css';

type ProjectDetailSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectDocument | null;
  projects: ProjectDocument[];
  tasks: TaskDocument[];
  onSave: (projectId: string, updates: {
    title: string;
    description: string;
    status: 'backlog' | 'next' | 'active' | 'hold';
    startDate: string | null;
    dueDate: string | null;
  }) => Promise<void> | void;
  onDelete: (projectId: string) => Promise<void> | void;
  onToggleTaskComplete: (taskId: string, completed: boolean) => Promise<void> | void;
  onSaveTask: (taskId: string, updates: {
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
  }) => Promise<void> | void;
  onDeleteTask: (taskId: string) => Promise<void> | void;
  onCreateTask: (projectId: string, title: string) => Promise<void> | void;
};

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


export function ProjectDetailSheet({
  open,
  onOpenChange,
  project,
  projects,
  tasks,
  onSave,
  onDelete,
  onToggleTaskComplete,
  onSaveTask,
  onDeleteTask,
  onCreateTask,
}: ProjectDetailSheetProps) {
  const [title, setTitle] = useState(project?.title ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [status, setStatus] = useState<'backlog' | 'next' | 'active' | 'hold'>(
    project?.status ?? 'backlog'
  );
  const [startDate, setStartDate] = useState(
    toInputDateTime(project?.start_date ?? null)
  );
  const [dueDate, setDueDate] = useState(
    toInputDateTime(project?.due_date ?? null)
  );
  const [taskTitle, setTaskTitle] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showHidden, setShowHidden] = useState(false);

  const canSave = useMemo(() => Boolean(title.trim()), [title]);

  const projectTasks = useMemo(() => {
    if (!project) return [];
    return [...tasks
      .filter((task) => task.project_id === project.id)]
      .sort(sortByDeadline);
  }, [project, tasks]);

  // is_next floats to top within active non-someday tasks
  const activeTasks = useMemo(() => {
    const base = projectTasks.filter((t) => !t.completed && !t.is_someday);
    const next = base.filter((t) => t.is_next);
    const rest = base.filter((t) => !t.is_next);
    return [...next, ...rest];
  }, [projectTasks]);

  const somedayTasks = projectTasks.filter((t) => !t.completed && t.is_someday);
  const completedTasks = projectTasks.filter((t) => t.completed);
  const hiddenCount = somedayTasks.length + completedTasks.length;

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [selectedTaskId, tasks]
  );

  const handleSave = async () => {
    if (!project || !canSave) return;
    await onSave(project.id, {
      title,
      description,
      status,
      startDate: fromInputDateTime(startDate),
      dueDate: fromInputDateTime(dueDate),
    });
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!project) return;
    await onDelete(project.id);
    onOpenChange(false);
  };

  const handleQuickAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!project) return;
    const trimmed = taskTitle.trim();
    if (!trimmed) return;
    await onCreateTask(project.id, trimmed);
    setTaskTitle('');
  };

  if (!project) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={styles['project-detail__content']}
        aria-label="Project details"
      >
        <header className={styles['project-detail__header']}>
          <SheetTitle className={styles['project-detail__title']}>
            Project
          </SheetTitle>
          <SheetClose asChild>
            <button
              type="button"
              className={styles['project-detail__close']}
              aria-label="Close project"
            >
              <CloseIcon />
            </button>
          </SheetClose>
        </header>

        <label className={styles['project-detail__field']}>
          <span className={styles['project-detail__label']}>Title</span>
          <input
            className={styles['project-detail__input']}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Project title"
          />
        </label>

        <label className={styles['project-detail__field']}>
          <span className={styles['project-detail__label']}>Description</span>
          <textarea
            className={styles['project-detail__textarea']}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Project description"
            rows={4}
          />
        </label>

        <label className={styles['project-detail__field']}>
          <span className={styles['project-detail__label']}>Status</span>
          <select
            className={styles['project-detail__input']}
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as 'backlog' | 'next' | 'active' | 'hold')
            }
          >
            <option value="backlog">Backlog</option>
            <option value="next">Next</option>
            <option value="active">Active</option>
            <option value="hold">Hold</option>
          </select>
        </label>

        <div className={styles['project-detail__row']}>
          <label className={styles['project-detail__field']}>
            <span className={styles['project-detail__label']}>Start</span>
            <div className={styles['project-detail__input-row']}>
              <input
                className={styles['project-detail__input']}
                type="datetime-local"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
              <button
                type="button"
                className={styles['project-detail__clear']}
                onClick={() => setStartDate('')}
                disabled={!startDate}
              >
                Clear
              </button>
            </div>
          </label>
          <label className={styles['project-detail__field']}>
            <span className={styles['project-detail__label']}>Due</span>
            <div className={styles['project-detail__input-row']}>
              <input
                className={styles['project-detail__input']}
                type="datetime-local"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
              <button
                type="button"
                className={styles['project-detail__clear']}
                onClick={() => setDueDate('')}
                disabled={!dueDate}
              >
                Clear
              </button>
            </div>
          </label>
        </div>

        <section className={styles['project-detail__tasks']}>
          <div className={styles['project-detail__section-title']}>Tasks</div>
          <form className={styles['project-detail__composer']} onSubmit={handleQuickAdd}>
            <input
              className={styles['project-detail__composer-input']}
              type="text"
              placeholder="Add a task"
              value={taskTitle}
              onChange={(event) => setTaskTitle(event.target.value)}
            />
            <button
              className={styles['project-detail__composer-button']}
              type="submit"
            >
              Add
            </button>
          </form>
          {activeTasks.length === 0 ? (
            <p className={styles['project-detail__empty']}>
              No tasks for this project yet.
            </p>
          ) : (
            <div className={styles['project-detail__list']}>
              {activeTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  className={styles['project-detail__item']}
                  onClick={() => setSelectedTaskId(task.id)}
                >
                  <span className={styles['project-detail__item-toggle']}>
                    <input
                      className={styles['project-detail__item-checkbox']}
                      type="checkbox"
                      checked={task.completed}
                      onChange={(event) =>
                        onToggleTaskComplete(task.id, event.target.checked)
                      }
                      onClick={(event) => event.stopPropagation()}
                      aria-label={`Mark ${task.title} as completed`}
                    />
                  </span>
                  <div className={styles['project-detail__item-title']}>
                    {task.title}
                  </div>
                </button>
              ))}
            </div>
          )}

          {hiddenCount > 0 && (
            <div className={styles['project-detail__completed']}>
              <button
                type="button"
                className={styles['project-detail__hidden-toggle']}
                onClick={() => setShowHidden((v) => !v)}
              >
                {showHidden ? `Hide ${hiddenCount} item${hiddenCount !== 1 ? 's' : ''}` : `Show ${hiddenCount} item${hiddenCount !== 1 ? 's' : ''}`}
              </button>

              {showHidden && (
                <div className={styles['project-detail__list']}>
                  {somedayTasks.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      className={styles['project-detail__item']}
                      onClick={() => setSelectedTaskId(task.id)}
                    >
                      <span className={styles['project-detail__item-toggle']}>
                        <input
                          className={styles['project-detail__item-checkbox']}
                          type="checkbox"
                          checked={false}
                          onChange={() => {}}
                          onClick={(event) => event.stopPropagation()}
                          aria-label={`Open ${task.title}`}
                        />
                      </span>
                      <div className={styles['project-detail__item-title']}>
                        {task.title}
                        <span className={styles['project-detail__item-badge']}> Someday</span>
                      </div>
                    </button>
                  ))}
                  {completedTasks.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      className={styles['project-detail__item']}
                      onClick={() => setSelectedTaskId(task.id)}
                    >
                      <span className={styles['project-detail__item-toggle']}>
                        <input
                          className={styles['project-detail__item-checkbox']}
                          type="checkbox"
                          checked={task.completed}
                          onChange={(event) =>
                            onToggleTaskComplete(task.id, event.target.checked)
                          }
                          onClick={(event) => event.stopPropagation()}
                          aria-label={`Mark ${task.title} as active`}
                        />
                      </span>
                      <div className={styles['project-detail__item-title']}>
                        {task.title}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        <div className={styles['project-detail__actions']}>
          <button
            type="button"
            className={styles['project-detail__button']}
            onClick={handleSave}
            disabled={!canSave}
          >
            Save
          </button>
          <button
            type="button"
            className={`${styles['project-detail__button']} ${styles['project-detail__button--danger']}`}
            onClick={handleDelete}
          >
            Delete
          </button>
        </div>
      </SheetContent>

      {selectedTask ? (
        <TaskDetailSheet
          key={selectedTask.id}
          open={Boolean(selectedTask)}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setSelectedTaskId(null);
          }}
          task={selectedTask}
          projects={projects}
          onSave={onSaveTask}
          onDelete={onDeleteTask}
          onToggleComplete={onToggleTaskComplete}
        />
      ) : null}
    </Sheet>
  );
}

function CloseIcon() {
  return (
    <svg
      className={styles['project-detail__icon']}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M18 6L6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
