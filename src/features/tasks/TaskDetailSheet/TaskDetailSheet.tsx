import { useEffect, useMemo, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import {
  Sheet,
  SheetClose,
  SheetContent,
} from '@/components/ui/Sheet';
import { useDatabase } from '@/hooks/useDatabase';
import type { NoteDocument, ProjectDocument, TaskDocument } from '@/lib/db';
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
    status: 'backlog' | 'next';
    startDate: string | null;
    dueDate: string | null;
    isSomeday: boolean;
    tags: string[];
  }) => Promise<void> | void;
  onDelete: (taskId: string) => Promise<void> | void;
  onToggleComplete?: (taskId: string, completed: boolean) => Promise<void> | void;
  variant?: 'full' | 'sheet';
};

function toDateInputValue(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10);
}

function fromDateInputValue(value: string): string | null {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day, 0, 0, 0, 0);
  return date.toISOString();
}

function getTodayDateInputValue(): string {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

function normalizeTag(raw: string): string {
  return raw.trim().replace(/^#+/, '').replace(/\s+/g, '-');
}

function dedupeTags(tags: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const tag of tags) {
    const normalized = normalizeTag(tag);
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }

  return result;
}

function buildTagSuggestions(notes: NoteDocument[], tasks: TaskDocument[]): string[] {
  const map = new Map<string, string>();

  const addTag = (value: string) => {
    const normalized = normalizeTag(value);
    if (!normalized) return;
    const key = normalized.toLowerCase();
    if (!map.has(key)) map.set(key, normalized);
  };

  for (const note of notes) {
    for (const tag of note.properties?.tags ?? []) addTag(tag);

    const matches = (note.content ?? '').matchAll(/#([\w/-]+)/g);
    for (const match of matches) {
      if (match[1]) addTag(match[1]);
    }
  }

  for (const task of tasks) {
    for (const tag of task.tags ?? []) addTag(tag);
  }

  return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
}

function formatMetaDateLabel(value: string | null, fallback: string): string {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

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
  const { db, isReady } = useDatabase();
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [projectId, setProjectId] = useState(task?.project_id ?? '');
  const [status, setStatus] = useState<'backlog' | 'next'>(task?.status ?? 'backlog');
  const [startDateInput, setStartDateInput] = useState(toDateInputValue(task?.start_date ?? null));
  const [dueDateInput, setDueDateInput] = useState(toDateInputValue(task?.due_date ?? null));
  const [isSomeday, setIsSomeday] = useState(task?.is_someday ?? false);
  const [tags, setTags] = useState<string[]>(dedupeTags(task?.tags ?? []));
  const [tagInput, setTagInput] = useState('');
  const [allTagSuggestions, setAllTagSuggestions] = useState<string[]>([]);

  const [isTagsSheetOpen, setIsTagsSheetOpen] = useState(false);
  const [isWhenSheetOpen, setIsWhenSheetOpen] = useState(false);
  const [isDueSheetOpen, setIsDueSheetOpen] = useState(false);

  useEffect(() => {
    if (!task) return;
    setTitle(task.title ?? '');
    setDescription(task.description ?? '');
    setProjectId(task.project_id ?? '');
    setStatus(task.status ?? 'backlog');
    setStartDateInput(toDateInputValue(task.start_date));
    setDueDateInput(toDateInputValue(task.due_date));
    setIsSomeday(task.is_someday ?? false);
    setTags(dedupeTags(task.tags ?? []));
    setTagInput('');
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

  useEffect(() => {
    if (!db || !isReady) return;

    let latestNotes: NoteDocument[] = [];
    let latestTasks: TaskDocument[] = [];

    const updateSuggestions = () => {
      setAllTagSuggestions(buildTagSuggestions(latestNotes, latestTasks));
    };

    const notesSubscription = db.notes
      .find({
        selector: { is_trashed: false },
        sort: [{ updated_at: 'desc' }, { id: 'asc' }],
      })
      .$.subscribe((docs) => {
        latestNotes = docs.map((doc) => doc.toJSON() as NoteDocument);
        updateSuggestions();
      });

    const tasksSubscription = db.tasks
      .find({
        selector: { is_trashed: false },
        sort: [{ updated_at: 'desc' }, { id: 'asc' }],
      })
      .$.subscribe((docs) => {
        latestTasks = docs.map((doc) => doc.toJSON() as TaskDocument);
        updateSuggestions();
      });

    return () => {
      notesSubscription.unsubscribe();
      tasksSubscription.unsubscribe();
    };
  }, [db, isReady]);

  const canSave = useMemo(() => Boolean(title.trim()), [title]);

  const existingTagKeys = useMemo(() => {
    return new Set(tags.map((tag) => tag.toLowerCase()));
  }, [tags]);

  const filteredTagSuggestions = useMemo(() => {
    const query = normalizeTag(tagInput).toLowerCase();

    return allTagSuggestions
      .filter((tag) => !existingTagKeys.has(tag.toLowerCase()))
      .filter((tag) => (query ? tag.toLowerCase().includes(query) : true))
      .slice(0, 8);
  }, [allTagSuggestions, existingTagKeys, tagInput]);

  const handleAddTag = (rawTag: string) => {
    const normalized = normalizeTag(rawTag);
    if (!normalized) return;
    const key = normalized.toLowerCase();
    if (existingTagKeys.has(key)) {
      setTagInput('');
      return;
    }
    setTags((current) => [...current, normalized]);
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const key = tagToRemove.toLowerCase();
    setTags((current) => current.filter((tag) => tag.toLowerCase() !== key));
  };

  const handleTagInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' && event.key !== ',') return;
    event.preventDefault();
    handleAddTag(tagInput);
  };

  const handleWhenToday = () => {
    setStartDateInput(getTodayDateInputValue());
    setIsSomeday(false);
    setIsWhenSheetOpen(false);
  };

  const handleWhenSomeday = () => {
    setIsSomeday(true);
    setStartDateInput('');
    setIsWhenSheetOpen(false);
  };

  const handleWhenClear = () => {
    setStartDateInput('');
    setIsSomeday(false);
    setIsWhenSheetOpen(false);
  };

  const handleDueToday = () => {
    setDueDateInput(getTodayDateInputValue());
    setIsDueSheetOpen(false);
  };

  const handleDueClear = () => {
    setDueDateInput('');
    setIsDueSheetOpen(false);
  };

  const handleSave = async () => {
    if (!task || !canSave) return;

    const normalizedTags = dedupeTags(tags);
    const nextStartDate = isSomeday ? null : fromDateInputValue(startDateInput);

    await onSave(task.id, {
      title,
      description,
      projectId: projectId ? projectId : null,
      status,
      startDate: nextStartDate,
      dueDate: fromDateInputValue(dueDateInput),
      isSomeday,
      tags: normalizedTags,
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

  const whenLabel = isSomeday
    ? 'Someday'
    : formatMetaDateLabel(isSomeday ? null : fromDateInputValue(startDateInput), 'When?');
  const dueLabel = formatMetaDateLabel(fromDateInputValue(dueDateInput), 'Due');

  return (
    <>
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

            <div className={styles['task-detail__metaRow']}>
              <button
                type="button"
                className={styles['task-detail__metaButton']}
                onClick={() => setIsTagsSheetOpen(true)}
              >
                <span>Tags</span>
                <span className={styles['task-detail__metaValue']}>
                  {tags.length > 0 ? String(tags.length) : 'None'}
                </span>
              </button>

              <button
                type="button"
                className={styles['task-detail__metaButton']}
                onClick={() => setIsWhenSheetOpen(true)}
              >
                <span>When?</span>
                <span className={styles['task-detail__metaValue']}>{whenLabel}</span>
              </button>

              <button
                type="button"
                className={styles['task-detail__metaButton']}
                onClick={() => setIsDueSheetOpen(true)}
              >
                <span>Due</span>
                <span className={styles['task-detail__metaValue']}>{dueLabel}</span>
              </button>
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
                  setStatus(event.target.value as 'backlog' | 'next')
                }
              >
                <option value="backlog">Backlog</option>
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

      <Sheet open={isTagsSheetOpen} onOpenChange={setIsTagsSheetOpen}>
        <SheetContent
          side="bottom"
          className={styles['task-detail__metaSheet']}
          aria-label="Task tags"
        >
          <div className={styles['task-detail__metaSheetHeader']}>
            <div className={styles['task-detail__metaSheetTitle']}>Tags</div>
          </div>

          <div className={styles['task-detail__metaSheetContent']}>
            <input
              type="text"
              className={styles['task-detail__metaInput']}
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
              onKeyDown={handleTagInputKeyDown}
              placeholder="Add a tag"
              autoFocus
            />

            {filteredTagSuggestions.length > 0 ? (
              <div className={styles['task-detail__tagSuggestionList']}>
                {filteredTagSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className={styles['task-detail__tagSuggestion']}
                    onClick={() => handleAddTag(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}

            {tags.length > 0 ? (
              <div className={styles['task-detail__tagList']}>
                {tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={styles['task-detail__tagChip']}
                    onClick={() => handleRemoveTag(tag)}
                  >
                    <span>{tag}</span>
                    <span aria-hidden="true">×</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className={styles['task-detail__metaEmpty']}>No tags yet.</p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={isWhenSheetOpen} onOpenChange={setIsWhenSheetOpen}>
        <SheetContent
          side="bottom"
          className={styles['task-detail__metaSheet']}
          aria-label="Task start date"
        >
          <div className={styles['task-detail__metaSheetHeader']}>
            <div className={styles['task-detail__metaSheetTitle']}>When?</div>
          </div>

          <div className={styles['task-detail__metaSheetContent']}>
            <div className={styles['task-detail__metaActions']}>
              <button type="button" className={styles['task-detail__metaAction']} onClick={handleWhenToday}>
                Today
              </button>
              <button type="button" className={styles['task-detail__metaAction']} onClick={handleWhenSomeday}>
                Someday
              </button>
              <button type="button" className={styles['task-detail__metaAction']} onClick={handleWhenClear}>
                Clear
              </button>
            </div>

            <input
              type="date"
              className={styles['task-detail__metaInput']}
              value={startDateInput}
              onChange={(event) => {
                setStartDateInput(event.target.value);
                if (event.target.value) setIsSomeday(false);
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={isDueSheetOpen} onOpenChange={setIsDueSheetOpen}>
        <SheetContent
          side="bottom"
          className={styles['task-detail__metaSheet']}
          aria-label="Task due date"
        >
          <div className={styles['task-detail__metaSheetHeader']}>
            <div className={styles['task-detail__metaSheetTitle']}>Due</div>
          </div>

          <div className={styles['task-detail__metaSheetContent']}>
            <div className={styles['task-detail__metaActions']}>
              <button type="button" className={styles['task-detail__metaAction']} onClick={handleDueToday}>
                Today
              </button>
              <button type="button" className={styles['task-detail__metaAction']} onClick={handleDueClear}>
                Clear
              </button>
            </div>

            <input
              type="date"
              className={styles['task-detail__metaInput']}
              value={dueDateInput}
              onChange={(event) => setDueDateInput(event.target.value)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
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
