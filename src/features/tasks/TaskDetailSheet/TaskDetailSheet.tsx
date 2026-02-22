import { useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/Sheet';
import { useDatabase } from '@/hooks/useDatabase';
import type { NoteDocument, ProjectDocument, TagDocument, TaskDocument } from '@/lib/db';
import { CalendarPicker } from './CalendarPicker';
import styles from './TaskDetailSheet.module.css';

const nowIso = () => new Date().toISOString();

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

// ─── Date helpers ────────────────────────────────────────────────────────────

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
  return new Date(year, month - 1, day, 0, 0, 0, 0).toISOString();
}

function getTodayDateInputValue(): string {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

function formatMetaDateLabel(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}

// ─── Tag helpers ─────────────────────────────────────────────────────────────

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

// ─── Component ───────────────────────────────────────────────────────────────

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

  // Form state
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [projectId, setProjectId] = useState(task?.project_id ?? '');
  const [status, setStatus] = useState<'backlog' | 'next'>(task?.status ?? 'backlog');
  const [startDateInput, setStartDateInput] = useState(toDateInputValue(task?.start_date ?? null));
  const [dueDateInput, setDueDateInput] = useState(toDateInputValue(task?.due_date ?? null));
  const [isSomeday, setIsSomeday] = useState(task?.is_someday ?? false);
  const [tags, setTags] = useState<string[]>(dedupeTags(task?.tags ?? []));

  // Tag catalog (all non-trashed tags from db.tags)
  const [tagCatalog, setTagCatalog] = useState<TagDocument[]>([]);

  // Tag sheet state
  const [tagInput, setTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [isTagEditMode, setIsTagEditMode] = useState(false);

  // Sub-sheet open state
  const [isTagsSheetOpen, setIsTagsSheetOpen] = useState(false);
  const [isWhenSheetOpen, setIsWhenSheetOpen] = useState(false);
  const [isDueSheetOpen, setIsDueSheetOpen] = useState(false);

  // Reset form when task changes
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
    setShowTagInput(false);
    setIsTagEditMode(false);
  }, [task]);

  // Notify AppShell that this sheet is open (hides FAB)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent<{ open: boolean }>('task-detail-sheet:open-change', { detail: { open } })
    );
    return () => {
      window.dispatchEvent(
        new CustomEvent<{ open: boolean }>('task-detail-sheet:open-change', { detail: { open: false } })
      );
    };
  }, [open]);

  // Subscribe to the tags catalog
  useEffect(() => {
    if (!db || !isReady) return;
    const sub = db.tags
      .find({ selector: { is_trashed: false }, sort: [{ name: 'asc' }] })
      .$.subscribe(docs => setTagCatalog(docs.map(d => d.toJSON() as TagDocument)));
    return () => sub.unsubscribe();
  }, [db, isReady]);

  // ─── Derived state ───────────────────────────────────────────────────────

  const canSave = useMemo(() => Boolean(title.trim()), [title]);

  const existingTagKeys = useMemo(
    () => new Set(tags.map(t => t.toLowerCase())),
    [tags]
  );

  // Catalog tag names for suggestions (filtered by input, excluding already-selected)
  const filteredTagSuggestions = useMemo(() => {
    const query = normalizeTag(tagInput).toLowerCase();
    return tagCatalog
      .map(t => t.name)
      .filter(name => !existingTagKeys.has(name.toLowerCase()))
      .filter(name => (query ? name.toLowerCase().includes(query) : true))
      .slice(0, 6);
  }, [tagCatalog, existingTagKeys, tagInput]);

  // All tags to show in the toggle list: catalog tags + any legacy task tags not in catalog
  const tagsListAll = useMemo(() => {
    const catalogKeys = new Set(tagCatalog.map(t => t.name.toLowerCase()));
    const legacy = tags.filter(t => !catalogKeys.has(t.toLowerCase()));
    const allNames = [...tagCatalog.map(t => t.name), ...legacy];
    return allNames;
  }, [tagCatalog, tags]);

  // Meta label values
  const whenLabel = isSomeday
    ? 'Someday'
    : formatMetaDateLabel(fromDateInputValue(startDateInput));
  const dueLabel = formatMetaDateLabel(fromDateInputValue(dueDateInput));
  const hasWhen = isSomeday || Boolean(startDateInput);
  const hasDue = Boolean(dueDateInput);

  // ─── Auto-save helper ────────────────────────────────────────────────────

  // Serialize saves so concurrent calls don't race on the same RxDB revision
  const saveQueue = useRef<Promise<void>>(Promise.resolve());

  const doSave = (opts: {
    startDate?: string | null;
    dueDate?: string | null;
    isSomeday?: boolean;
    tags?: string[];
  } = {}): Promise<void> => {
    if (!task || !title.trim()) return Promise.resolve();
    // Capture all values at call-time before queuing
    const resolvedIsSomeday = opts.isSomeday ?? isSomeday;
    const resolvedStartDate = opts.startDate !== undefined
      ? opts.startDate
      : (resolvedIsSomeday ? null : fromDateInputValue(startDateInput));
    const resolvedDueDate = opts.dueDate !== undefined
      ? opts.dueDate
      : fromDateInputValue(dueDateInput);
    const payload = {
      title: title.trim(),
      description: description.trim(),
      projectId: projectId || null,
      status,
      startDate: resolvedStartDate,
      dueDate: resolvedDueDate,
      isSomeday: resolvedIsSomeday,
      tags: dedupeTags(opts.tags ?? tags),
    };
    const taskId = task.id;
    // Chain onto the queue — each save waits for the previous to finish
    const next = saveQueue.current
      .then(() => onSave(taskId, payload) ?? Promise.resolve())
      .catch(() => {});
    saveQueue.current = next;
    return next;
  };

  // ─── Main sheet ──────────────────────────────────────────────────────────

  const handleMainSheetOpenChange = (open: boolean) => {
    if (!open) void doSave();
    onOpenChange(open);
  };

  const handleSave = async () => {
    if (!canSave) return;
    await doSave();
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

  // ─── Tags sheet ──────────────────────────────────────────────────────────

  const handleToggleTag = (tagName: string) => {
    const key = tagName.toLowerCase();
    if (existingTagKeys.has(key)) {
      setTags(current => current.filter(t => t.toLowerCase() !== key));
    } else {
      setTags(current => [...current, normalizeTag(tagName)]);
    }
  };

  const handleAddTagFromInput = async () => {
    const normalized = normalizeTag(tagInput);
    if (!normalized) return;
    // Create catalog entry if it doesn't already exist
    if (db && isReady) {
      const existing = tagCatalog.find(t => t.name.toLowerCase() === normalized.toLowerCase());
      if (!existing) {
        await db.tags.insert({
          id: uuidv4(),
          name: normalized,
          created_at: nowIso(),
          updated_at: nowIso(),
          is_trashed: false,
          trashed_at: null,
        });
      }
    }
    if (!existingTagKeys.has(normalized.toLowerCase())) {
      setTags(current => [...current, normalized]);
    }
    setTagInput('');
    setShowTagInput(false);
  };

  const handleTagInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      void handleAddTagFromInput();
    }
    if (event.key === 'Escape') {
      setTagInput('');
      setShowTagInput(false);
    }
  };

  const handleTagsSheetOpenChange = (open: boolean) => {
    setIsTagsSheetOpen(open);
    if (!open) {
      setIsTagEditMode(false);
      // Commit any pending typed tag
      let finalTags = tags;
      if (tagInput.trim()) {
        const normalized = normalizeTag(tagInput);
        if (normalized && !existingTagKeys.has(normalized.toLowerCase())) {
          finalTags = [...tags, normalized];
          setTags(finalTags);
        }
        setTagInput('');
      }
      setShowTagInput(false);
      void doSave({ tags: finalTags });
    }
  };

  // ─── Tag catalog management ───────────────────────────────────────────────

  const handleRenameTag = async (tagDoc: TagDocument, newName: string) => {
    if (!db || !isReady) return;
    const normalized = normalizeTag(newName);
    if (!normalized || normalized.toLowerCase() === tagDoc.name.toLowerCase()) return;

    const doc = await db.tags.findOne(tagDoc.id).exec();
    if (!doc) return;
    await doc.patch({ name: normalized, updated_at: nowIso() });

    // Update local task tags
    setTags(current =>
      current.map(t => t.toLowerCase() === tagDoc.name.toLowerCase() ? normalized : t)
    );

    // Cascade to all tasks
    const allTasks = await db.tasks.find({ selector: { is_trashed: false } }).exec();
    for (const task of allTasks) {
      const data = task.toJSON();
      const oldName = tagDoc.name.toLowerCase();
      if (!(data.tags as string[]).some((t: string) => t.toLowerCase() === oldName)) continue;
      await task.patch({
        tags: (data.tags as string[]).map((t: string) =>
          t.toLowerCase() === oldName ? normalized : t
        ),
        updated_at: nowIso(),
      });
    }

    // Cascade to all notes
    const allNotes = await db.notes.find({ selector: { is_trashed: false } }).exec();
    for (const note of allNotes) {
      const data = note.toJSON() as NoteDocument;
      const noteTags: string[] = data.properties?.tags ?? [];
      const oldName = tagDoc.name.toLowerCase();
      if (!noteTags.some(t => t.toLowerCase() === oldName)) continue;
      await note.patch({
        properties: {
          ...data.properties,
          tags: noteTags.map(t => t.toLowerCase() === oldName ? normalized : t),
        },
        updated_at: nowIso(),
      });
    }
  };

  const handleDeleteTag = async (tagDoc: TagDocument) => {
    if (!db || !isReady) return;

    const doc = await db.tags.findOne(tagDoc.id).exec();
    if (!doc) return;
    await doc.patch({ is_trashed: true, trashed_at: nowIso(), updated_at: nowIso() });

    // Remove from local task tags
    setTags(current => current.filter(t => t.toLowerCase() !== tagDoc.name.toLowerCase()));

    // Cascade to all tasks
    const allTasks = await db.tasks.find({ selector: { is_trashed: false } }).exec();
    for (const task of allTasks) {
      const data = task.toJSON();
      const oldName = tagDoc.name.toLowerCase();
      if (!(data.tags as string[]).some((t: string) => t.toLowerCase() === oldName)) continue;
      await task.patch({
        tags: (data.tags as string[]).filter((t: string) => t.toLowerCase() !== oldName),
        updated_at: nowIso(),
      });
    }

    // Cascade to all notes
    const allNotes = await db.notes.find({ selector: { is_trashed: false } }).exec();
    for (const note of allNotes) {
      const data = note.toJSON() as NoteDocument;
      const noteTags: string[] = data.properties?.tags ?? [];
      const oldName = tagDoc.name.toLowerCase();
      if (!noteTags.some(t => t.toLowerCase() === oldName)) continue;
      await note.patch({
        properties: {
          ...data.properties,
          tags: noteTags.filter(t => t.toLowerCase() !== oldName),
        },
        updated_at: nowIso(),
      });
    }
  };

  // ─── When sheet ──────────────────────────────────────────────────────────

  const handleWhenToday = async () => {
    const today = getTodayDateInputValue();
    setStartDateInput(today);
    setIsSomeday(false);
    setIsWhenSheetOpen(false);
    await doSave({ startDate: fromDateInputValue(today), isSomeday: false });
  };

  const handleWhenSomeday = async () => {
    setIsSomeday(true);
    setStartDateInput('');
    setIsWhenSheetOpen(false);
    await doSave({ startDate: null, isSomeday: true });
  };

  const handleWhenClear = async () => {
    setStartDateInput('');
    setIsSomeday(false);
    setIsWhenSheetOpen(false);
    await doSave({ startDate: null, isSomeday: false });
  };

  const handleWhenSheetOpenChange = (open: boolean) => {
    setIsWhenSheetOpen(open);
    if (!open) void doSave();
  };

  // ─── Due sheet ───────────────────────────────────────────────────────────

  const handleDueToday = async () => {
    const today = getTodayDateInputValue();
    setDueDateInput(today);
    setIsDueSheetOpen(false);
    await doSave({ dueDate: fromDateInputValue(today) });
  };

  const handleDueClear = async () => {
    setDueDateInput('');
    setIsDueSheetOpen(false);
    await doSave({ dueDate: null });
  };

  const handleDueSheetOpenChange = (open: boolean) => {
    setIsDueSheetOpen(open);
    if (!open) void doSave();
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  if (!task) return null;

  const contentClassName =
    variant === 'sheet'
      ? `${styles['task-detail__content']} ${styles['task-detail__content--sheet']}`
      : styles['task-detail__content'];

  return (
    <>
      {/* ── Main sheet ── */}
      <Sheet open={open} onOpenChange={handleMainSheetOpenChange}>
        <SheetContent
          side="bottom"
          className={contentClassName}
          aria-label="Task details"
          onPointerDownOutside={(e) => {
            // Prevent the main sheet from closing when a sub-sheet overlay is tapped
            if (isTagsSheetOpen || isWhenSheetOpen || isDueSheetOpen) {
              e.preventDefault();
            }
          }}
        >
          <header className={styles['task-detail__header']}>
            <button
              type="button"
              className={styles['task-detail__close']}
              aria-label="Close task"
              onClick={() => handleMainSheetOpenChange(false)}
            >
              <CloseIcon />
            </button>
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
                onChange={e => setTitle(e.target.value)}
                onBlur={() => void doSave()}
                placeholder="Task title"
                aria-label="Title"
              />
            </div>

            {/* Meta row: shows label when empty, value replaces label when set */}
            <div className={styles['task-detail__metaRow']}>
              <button
                type="button"
                className={styles['task-detail__metaButton']}
                onClick={() => setIsTagsSheetOpen(true)}
              >
                Tags
              </button>

              <button
                type="button"
                className={`${styles['task-detail__metaButton']}${hasWhen ? ` ${styles['task-detail__metaButton--set']}` : ''}`}
                onClick={() => setIsWhenSheetOpen(true)}
              >
                {hasWhen ? whenLabel : 'When?'}
              </button>

              <button
                type="button"
                className={`${styles['task-detail__metaButton']}${hasDue ? ` ${styles['task-detail__metaButton--set']}` : ''}`}
                onClick={() => setIsDueSheetOpen(true)}
              >
                {hasDue ? dueLabel : 'Due'}
              </button>
            </div>

            <div className={styles['task-detail__field']}>
              <textarea
                className={styles['task-detail__textarea']}
                value={description}
                onChange={e => setDescription(e.target.value)}
                onBlur={() => void doSave()}
                placeholder="Notes"
                aria-label="Notes"
                rows={4}
              />
            </div>

            {/* Tag pills row — tapping any pill opens the tags sheet */}
            {tags.length > 0 && (
              <div className={styles['task-detail__tagPills']}>
                {tags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    className={styles['task-detail__tagPill']}
                    onClick={() => setIsTagsSheetOpen(true)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            <label className={styles['task-detail__field']}>
              <span className={styles['task-detail__label']}>Project</span>
              <select
                className={styles['task-detail__input']}
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                onBlur={() => void doSave()}
              >
                <option value="">No project</option>
                {projects.map(project => (
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
                onChange={e => setStatus(e.target.value as 'backlog' | 'next')}
                onBlur={() => void doSave()}
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

      {/* ── Tags sheet ── */}
      <Sheet open={isTagsSheetOpen} onOpenChange={handleTagsSheetOpenChange}>
        <SheetContent
          side="bottom"
          className={styles['task-detail__metaSheet']}
          aria-label="Task tags"
        >
          <div className={styles['task-detail__metaSheetHeader']}>
            <span className={styles['task-detail__metaSheetTitle']}>Tags</span>
            <button
              type="button"
              className={styles['task-detail__metaSheetEditBtn']}
              onClick={() => setIsTagEditMode(m => !m)}
            >
              {isTagEditMode ? 'Done' : 'Edit'}
            </button>
          </div>

          <div className={styles['task-detail__metaSheetContent']}>
            {!isTagEditMode && showTagInput ? (
              <div className={styles['task-detail__newTagRow']}>
                <input
                  type="text"
                  className={styles['task-detail__metaInput']}
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  placeholder="Tag name"
                  autoFocus
                />
                {filteredTagSuggestions.length > 0 && (
                  <div className={styles['task-detail__tagSuggestions']}>
                    {filteredTagSuggestions.map(suggestion => (
                      <button
                        key={suggestion}
                        type="button"
                        className={styles['task-detail__tagSuggestion']}
                        onClick={() => {
                          setTags(current => {
                            const key = suggestion.toLowerCase();
                            if (current.some(t => t.toLowerCase() === key)) return current;
                            return [...current, suggestion];
                          });
                          setTagInput('');
                          setShowTagInput(false);
                        }}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {isTagEditMode ? (
              /* Edit mode: catalog tags with rename input + delete button */
              tagCatalog.length > 0 ? (
                <div className={styles['task-detail__tagList']}>
                  {tagCatalog.map(tagDoc => (
                    <EditableTagRow
                      key={tagDoc.id}
                      tagDoc={tagDoc}
                      onRename={handleRenameTag}
                      onDelete={handleDeleteTag}
                    />
                  ))}
                </div>
              ) : (
                <p className={styles['task-detail__metaEmpty']}>No tags in catalog yet.</p>
              )
            ) : (
              /* Normal mode: toggle list */
              tagsListAll.length > 0 ? (
                <div className={styles['task-detail__tagList']}>
                  {tagsListAll.map(tagName => {
                    const selected = existingTagKeys.has(tagName.toLowerCase());
                    return (
                      <button
                        key={tagName}
                        type="button"
                        className={`${styles['task-detail__tagListItem']}${selected ? ` ${styles['task-detail__tagListItem--selected']}` : ''}`}
                        onClick={() => handleToggleTag(tagName)}
                      >
                        <TagIcon />
                        <span className={styles['task-detail__tagListName']}>{tagName}</span>
                        {selected && <CheckIcon />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                !showTagInput && (
                  <p className={styles['task-detail__metaEmpty']}>No tags yet.</p>
                )
              )
            )}
          </div>

          {!isTagEditMode && (
            <div className={styles['task-detail__metaSheetFooter']}>
              <button
                type="button"
                className={styles['task-detail__newTagBtn']}
                onClick={() => {
                  setShowTagInput(true);
                  setTagInput('');
                }}
              >
                New Tag
              </button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ── When sheet ── */}
      <Sheet open={isWhenSheetOpen} onOpenChange={handleWhenSheetOpenChange}>
        <SheetContent
          side="bottom"
          className={styles['task-detail__metaSheet']}
          aria-label="Task start date"
        >
          <div className={styles['task-detail__metaSheetHeader']}>
            <span className={styles['task-detail__metaSheetTitle']}>When?</span>
          </div>

          <div className={styles['task-detail__metaSheetContent']}>
            <div className={styles['task-detail__metaActions']}>
              <button type="button" className={styles['task-detail__metaAction']} onClick={handleWhenToday}>
                Today
              </button>
              <button type="button" className={styles['task-detail__metaAction']} onClick={handleWhenSomeday}>
                Someday
              </button>
              {hasWhen && (
                <button type="button" className={styles['task-detail__metaAction']} onClick={handleWhenClear}>
                  Clear
                </button>
              )}
            </div>

            <CalendarPicker
              value={startDateInput}
              onChange={v => {
                setStartDateInput(v);
                setIsSomeday(false);
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Due sheet ── */}
      <Sheet open={isDueSheetOpen} onOpenChange={handleDueSheetOpenChange}>
        <SheetContent
          side="bottom"
          className={styles['task-detail__metaSheet']}
          aria-label="Task due date"
        >
          <div className={styles['task-detail__metaSheetHeader']}>
            <span className={styles['task-detail__metaSheetTitle']}>Due</span>
          </div>

          <div className={styles['task-detail__metaSheetContent']}>
            <div className={styles['task-detail__metaActions']}>
              <button type="button" className={styles['task-detail__metaAction']} onClick={handleDueToday}>
                Today
              </button>
              {hasDue && (
                <button type="button" className={styles['task-detail__metaAction']} onClick={handleDueClear}>
                  Clear
                </button>
              )}
            </div>

            <CalendarPicker
              value={dueDateInput}
              onChange={v => setDueDateInput(v)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

// ─── Editable tag row (edit mode) ─────────────────────────────────────────────

type EditableTagRowProps = {
  tagDoc: TagDocument;
  onRename: (tagDoc: TagDocument, newName: string) => Promise<void>;
  onDelete: (tagDoc: TagDocument) => Promise<void>;
};

function EditableTagRow({ tagDoc, onRename, onDelete }: EditableTagRowProps) {
  const [name, setName] = useState(tagDoc.name);

  // Sync if catalog changes externally
  useEffect(() => { setName(tagDoc.name); }, [tagDoc.name]);

  const handleBlur = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setName(tagDoc.name); // revert to original if cleared
    } else if (trimmed !== tagDoc.name) {
      void onRename(tagDoc, trimmed);
    }
  };

  return (
    <div className={styles['task-detail__tagEditRow']}>
      <TagIcon />
      <input
        type="text"
        className={styles['task-detail__tagNameInput']}
        value={name}
        onChange={e => setName(e.target.value)}
        onBlur={handleBlur}
        aria-label={`Rename tag ${tagDoc.name}`}
      />
      <button
        type="button"
        className={styles['task-detail__tagDeleteBtn']}
        aria-label={`Delete tag ${tagDoc.name}`}
        onClick={() => void onDelete(tagDoc)}
      >
        <TrashIcon />
      </button>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
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

function TagIcon() {
  return (
    <svg
      className={styles['task-detail__tagListIcon']}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
    >
      <path
        d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="7" y1="7" x2="7.01" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className={styles['task-detail__tagListCheck']}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M20 6L9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none">
      <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M19 6l-1 14H6L5 6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 11v6M14 11v6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
