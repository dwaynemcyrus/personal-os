'use client';

import { useMemo, useState } from 'react';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
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
  }) => Promise<void> | void;
  onDelete: (taskId: string) => Promise<void> | void;
};

export function TaskDetailSheet({
  open,
  onOpenChange,
  task,
  projects,
  onSave,
  onDelete,
}: TaskDetailSheetProps) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [projectId, setProjectId] = useState(task?.project_id ?? '');

  const canSave = useMemo(() => Boolean(title.trim()), [title]);

  const handleSave = async () => {
    if (!task || !canSave) return;
    await onSave(task.id, {
      title,
      description,
      projectId: projectId ? projectId : null,
    });
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!task) return;
    await onDelete(task.id);
    onOpenChange(false);
  };

  if (!task) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={styles['task-detail__content']}
        aria-label="Task details"
      >
        <header className={styles['task-detail__header']}>
          <SheetTitle className={styles['task-detail__title']}>Task</SheetTitle>
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

        <label className={styles['task-detail__field']}>
          <span className={styles['task-detail__label']}>Title</span>
          <input
            className={styles['task-detail__input']}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Task title"
          />
        </label>

        <label className={styles['task-detail__field']}>
          <span className={styles['task-detail__label']}>Details</span>
          <textarea
            className={styles['task-detail__textarea']}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Notes or details"
            rows={4}
          />
        </label>

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
