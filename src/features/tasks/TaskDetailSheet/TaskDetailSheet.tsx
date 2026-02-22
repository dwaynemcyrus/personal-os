

import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import {
  Sheet,
  SheetClose,
  SheetContent,
} from '@/components/ui/Sheet';
import type { ProjectDocument, TaskDocument } from '@/lib/db';
import styles from './TaskDetailSheet.module.css';

type TaskDetailSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskDocument | null;
  projects: ProjectDocument[];
  onSave: (taskId: string, updates: {
    title: string;
    description: string;
    projectId: string | null;
    status: 'backlog' | 'someday' | 'next';
  }) => Promise<void> | void;
  onDelete: (taskId: string) => Promise<void> | void;
  onToggleComplete?: (taskId: string, completed: boolean) => Promise<void> | void;
  variant?: 'full' | 'sheet';
};

export function TaskDetailSheet({
  open,
  onOpenChange,
  task,
  projects,
  onSave,
  onDelete,
  onToggleComplete,
  variant = 'sheet',
}: TaskDetailSheetProps) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [projectId, setProjectId] = useState(task?.project_id ?? '');
  const [status, setStatus] = useState<'backlog' | 'someday' | 'next'>(
    task?.status ?? 'backlog'
  );

  // Sync state when task prop changes
  useEffect(() => {
    if (task) {
      setTitle(task.title ?? '');
      setDescription(task.description ?? '');
      setProjectId(task.project_id ?? '');
      setStatus(task.status ?? 'backlog');
    }
  }, [task]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent<{ open: boolean }>('task-detail-sheet:open-change', {
        detail: { open },
      })
    );

    return () => {
      window.dispatchEvent(
        new CustomEvent<{ open: boolean }>('task-detail-sheet:open-change', {
          detail: { open: false },
        })
      );
    };
  }, [open]);

  const canSave = useMemo(() => Boolean(title.trim()), [title]);

  const handleSave = async () => {
    if (!task || !canSave) return;
    await onSave(task.id, {
      title,
      description,
      projectId: projectId ? projectId : null,
      status,
    });
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!task) return;
    await onDelete(task.id);
    onOpenChange(false);
  };

  const handleToggleComplete = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!task || !onToggleComplete) return;
    await onToggleComplete(task.id, event.target.checked);
  };

  if (!task) return null;

  const contentClassName =
    variant === 'sheet'
      ? `${styles['task-detail__content']} ${styles['task-detail__content--sheet']}`
      : styles['task-detail__content'];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={contentClassName}
        aria-label="Task details"
      >
        <header className={styles['task-detail__header']}>
          <SheetClose asChild>
            <button
              type="button"
              className={styles['task-detail__close']}
              aria-label="Close task"
            >
              <CloseIcon />
            </button>
          </SheetClose>
        </header>

        <div className={styles['task-detail__body']}>
          <div className={styles['task-detail__topRow']}>
            <label className={styles['task-detail__completion']} aria-label="Completion">
              <input
                className={styles['task-detail__checkbox']}
                type="checkbox"
                checked={task.completed}
                onChange={handleToggleComplete}
                aria-label="Completion"
              />
            </label>
            <input
              className={`${styles['task-detail__input']} ${styles['task-detail__titleInput']}`}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Task title"
              aria-label="Title"
            />
          </div>

          <div className={styles['task-detail__field']}>
            <textarea
              className={styles['task-detail__textarea']}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Notes"
              aria-label="Notes"
              rows={4}
            />
          </div>

          <label className={styles['task-detail__field']}>
            <span className={styles['task-detail__label']}>Project</span>
            <select
              className={styles['task-detail__input']}
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
            >
              <option value="">No project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </label>

          <label className={styles['task-detail__field']}>
            <span className={styles['task-detail__label']}>Status</span>
            <select
              className={styles['task-detail__input']}
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as 'backlog' | 'someday' | 'next')
              }
            >
              <option value="backlog">Backlog</option>
              <option value="someday">Someday</option>
              <option value="next">Next</option>
            </select>
          </label>

          <div className={styles['task-detail__actions']}>
            <button
              type="button"
              className={styles['task-detail__button']}
              onClick={handleSave}
              disabled={!canSave}
            >
              Save
            </button>
            <button
              type="button"
              className={`${styles['task-detail__button']} ${styles['task-detail__button--danger']}`}
              onClick={handleDelete}
            >
              Delete
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CloseIcon() {
  return (
    <svg
      className={styles['task-detail__icon']}
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
