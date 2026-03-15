import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { sortByDeadline } from '@/features/tasks/taskBuckets';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import {
  Dropdown,
  DropdownCheckboxItem,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownTrigger,
} from '@/components/ui/Dropdown';
import { useQuery } from '@powersync/react';
import type { ItemDocument } from '@/lib/db';
import { TaskDetailSheet } from '@/features/tasks/TaskDetailSheet/TaskDetailSheet';
import { CalendarPicker } from '@/features/tasks/TaskDetailSheet/CalendarPicker';
import styles from './ProjectDetailSheet.module.css';

const NOTES_MAX_ROWS = 4;

// ─── Date helpers ─────────────────────────────────────────────────────────────

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

// ─── Types ────────────────────────────────────────────────────────────────────

type ProjectStatus = 'backlog' | 'active' | 'someday' | 'archived';

type ProjectDetailSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ItemDocument | null;
  projects: ItemDocument[];
  tasks: ItemDocument[];
  onSave: (
    projectId: string,
    updates: {
      title: string;
      content: string;
      item_status: ProjectStatus;
      startDate: string | null;
      dueDate: string | null;
      parentId: string | null;
    }
  ) => Promise<void> | void;
  onDelete: (projectId: string) => Promise<void> | void;
  onToggleTaskComplete: (taskId: string, completed: boolean) => Promise<void> | void;
  onSaveTask: (
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
  ) => Promise<void> | void;
  onDeleteTask: (taskId: string) => Promise<void> | void;
  onCreateTask: (projectId: string, title: string) => Promise<void> | void;
};

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'active', label: 'Active' },
  { value: 'someday', label: 'Someday' },
  { value: 'archived', label: 'Archived' },
];

// ─── Component ────────────────────────────────────────────────────────────────

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
  const { data: areas } = useQuery<ItemDocument>(
    'SELECT * FROM items WHERE type = ? AND is_trashed = 0 ORDER BY title ASC, id ASC',
    ['area']
  );

  // Form state
  const [title, setTitle] = useState(project?.title ?? '');
  const [content, setContent] = useState(project?.content ?? '');
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>(
    (project?.item_status as ProjectStatus) ?? 'backlog'
  );
  const [startDateInput, setStartDateInput] = useState(toDateInputValue(project?.start_date ?? null));
  const [dueDateInput, setDueDateInput] = useState(toDateInputValue(project?.due_date ?? null));
  const [parentId, setParentId] = useState(project?.parent_id ?? '');

  // Task state
  const [taskTitle, setTaskTitle] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showHidden, setShowHidden] = useState(false);

  // Sub-sheet open state
  const [isStartSheetOpen, setIsStartSheetOpen] = useState(false);
  const [isDueSheetOpen, setIsDueSheetOpen] = useState(false);
  const [isMoveSheetOpen, setIsMoveSheetOpen] = useState(false);
  const subSheetJustClosedRef = useRef(false);

  const notesTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (!project) return;
    setTitle(project.title ?? '');
    setContent(project.content ?? '');
    setProjectStatus((project.item_status as ProjectStatus) ?? 'backlog');
    setStartDateInput(toDateInputValue(project.start_date ?? null));
    setDueDateInput(toDateInputValue(project.due_date ?? null));
    setParentId(project.parent_id ?? '');
  }, [project]);

  useEffect(() => {
    resizeNotesTextarea();
  }, [content, open]);

  // ─── Task derived state ───────────────────────────────────────────────────

  const projectTasks = useMemo(() => {
    if (!project) return [];
    return [...tasks.filter((t) => t.parent_id === project.id)].sort(sortByDeadline);
  }, [project, tasks]);

  const activeTasks = useMemo(() => {
    const base = projectTasks.filter((t) => !t.completed && !t.is_someday);
    return [...base.filter((t) => t.is_next), ...base.filter((t) => !t.is_next)];
  }, [projectTasks]);

  const somedayTasks = projectTasks.filter((t) => !t.completed && t.is_someday);
  const completedTasks = projectTasks.filter((t) => t.completed);
  const hiddenCount = somedayTasks.length + completedTasks.length;

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId) ?? null,
    [selectedTaskId, tasks]
  );

  // ─── Derived labels ───────────────────────────────────────────────────────

  const areaLabel = useMemo(
    () => areas.find((a) => a.id === parentId)?.title ?? null,
    [areas, parentId]
  );
  const startLabel = formatMetaDateLabel(fromDateInputValue(startDateInput));
  const dueLabel = formatMetaDateLabel(fromDateInputValue(dueDateInput));
  const hasStart = Boolean(startDateInput);
  const hasDue = Boolean(dueDateInput);
  const hasArea = Boolean(parentId);

  // ─── Textarea resize ──────────────────────────────────────────────────────

  const resizeNotesTextarea = (element?: HTMLTextAreaElement | null) => {
    const el = element ?? notesTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const cs = window.getComputedStyle(el);
    const lineHeight = Number.parseFloat(cs.lineHeight) || 25.6;
    const pt = Number.parseFloat(cs.paddingTop) || 0;
    const pb = Number.parseFloat(cs.paddingBottom) || 0;
    const bt = Number.parseFloat(cs.borderTopWidth) || 0;
    const bb = Number.parseFloat(cs.borderBottomWidth) || 0;
    const maxH = lineHeight * NOTES_MAX_ROWS + pt + pb + bt + bb;
    const nextH = Math.min(el.scrollHeight, maxH);
    el.style.height = `${nextH}px`;
    el.style.overflowY = el.scrollHeight > maxH ? 'auto' : 'hidden';
  };

  // ─── Auto-save ────────────────────────────────────────────────────────────

  const doSave = (opts: {
    item_status?: ProjectStatus;
    startDate?: string | null;
    dueDate?: string | null;
    parentId?: string | null;
  } = {}): Promise<void> => {
    if (!project || !title.trim()) return Promise.resolve();
    const payload = {
      title: title.trim(),
      content: content.trim(),
      item_status: opts.item_status ?? projectStatus,
      startDate: opts.startDate !== undefined ? opts.startDate : fromDateInputValue(startDateInput),
      dueDate: opts.dueDate !== undefined ? opts.dueDate : fromDateInputValue(dueDateInput),
      parentId: opts.parentId !== undefined ? opts.parentId : (parentId || null),
    };
    const projectId = project.id;
    const next = saveQueue.current
      .then(() => onSave(projectId, payload) ?? Promise.resolve())
      .catch(() => {});
    saveQueue.current = next;
    return next;
  };

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleMainSheetOpenChange = (open: boolean) => {
    if (!open) void doSave();
    onOpenChange(open);
  };

  const handleDelete = async () => {
    if (!project) return;
    await onDelete(project.id);
    onOpenChange(false);
  };

  const handleStatusSelect = async (newStatus: ProjectStatus) => {
    setProjectStatus(newStatus);
    await doSave({ item_status: newStatus });
  };

  const handleQuickAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!project) return;
    const trimmed = taskTitle.trim();
    if (!trimmed) return;
    await onCreateTask(project.id, trimmed);
    setTaskTitle('');
  };

  // Start date handlers
  const handleStartSheetOpenChange = (open: boolean) => {
    setIsStartSheetOpen(open);
    if (!open) {
      subSheetJustClosedRef.current = true;
      queueMicrotask(() => { subSheetJustClosedRef.current = false; });
      void doSave();
    }
  };

  const handleStartToday = async () => {
    const today = getTodayDateInputValue();
    setStartDateInput(today);
    setIsStartSheetOpen(false);
    await doSave({ startDate: fromDateInputValue(today) });
  };

  const handleStartClear = async () => {
    setStartDateInput('');
    setIsStartSheetOpen(false);
    await doSave({ startDate: null });
  };

  // Due date handlers
  const handleDueSheetOpenChange = (open: boolean) => {
    setIsDueSheetOpen(open);
    if (!open) {
      subSheetJustClosedRef.current = true;
      queueMicrotask(() => { subSheetJustClosedRef.current = false; });
      void doSave();
    }
  };

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

  // Move handlers
  const handleMoveSheetOpenChange = (open: boolean) => {
    setIsMoveSheetOpen(open);
    if (!open) {
      subSheetJustClosedRef.current = true;
      queueMicrotask(() => { subSheetJustClosedRef.current = false; });
      void doSave();
    }
  };

  const handleMoveSelectArea = async (id: string) => {
    setParentId(id);
    setIsMoveSheetOpen(false);
    await doSave({ parentId: id });
  };

  const handleMoveClearArea = async () => {
    setParentId('');
    setIsMoveSheetOpen(false);
    await doSave({ parentId: null });
  };

  if (!project) return null;

  const isAnySubSheetOpen = isStartSheetOpen || isDueSheetOpen || isMoveSheetOpen;

  return (
    <>
      {/* ── Main sheet ── */}
      <Sheet open={open} onOpenChange={handleMainSheetOpenChange}>
        <SheetContent
          side="right"
          className={styles.content}
          aria-label="Project details"
          onPointerDownOutside={(e) => {
            if (isAnySubSheetOpen || subSheetJustClosedRef.current) e.preventDefault();
          }}
        >
          <header className={styles.header}>
            <div className={styles.headerDates}>
              <button
                type="button"
                className={`${styles.headerDateBtn}${hasStart ? ` ${styles['headerDateBtn--set']}` : ''}`}
                onClick={() => setIsStartSheetOpen(true)}
              >
                {hasStart ? startLabel : 'Start'}
              </button>
              <span className={styles.headerDateArrow} aria-hidden="true">›</span>
              <button
                type="button"
                className={`${styles.headerDateBtn}${hasDue ? ` ${styles['headerDateBtn--set']}` : ''}`}
                onClick={() => setIsDueSheetOpen(true)}
              >
                {hasDue ? dueLabel : 'Due'}
              </button>
            </div>

            <Dropdown>
              <DropdownTrigger asChild>
                <button type="button" className={styles.moreBtn} aria-label="Project actions">
                  <MoreIcon />
                </button>
              </DropdownTrigger>
              <DropdownContent align="end" sideOffset={8}>
                {STATUS_OPTIONS.map(({ value, label }) => (
                  <DropdownCheckboxItem
                    key={value}
                    checked={projectStatus === value}
                    onCheckedChange={() => void handleStatusSelect(value)}
                  >
                    {label}
                  </DropdownCheckboxItem>
                ))}
                <DropdownSeparator />
                <DropdownItem onSelect={() => setIsMoveSheetOpen(true)}>
                  {hasArea ? `Area: ${areaLabel}` : 'Move to Area'}
                </DropdownItem>
                <DropdownSeparator />
                <DropdownItem data-variant="danger" onSelect={() => void handleDelete()}>
                  Delete
                </DropdownItem>
              </DropdownContent>
            </Dropdown>
          </header>

          <div className={styles.body}>
            <input
              className={styles.titleInput}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => void doSave()}
              placeholder="Project title"
              aria-label="Title"
            />

            <textarea
              ref={notesTextareaRef}
              className={styles.notesTextarea}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                resizeNotesTextarea(e.currentTarget);
              }}
              onBlur={() => void doSave()}
              placeholder="Notes"
              aria-label="Notes"
              rows={1}
              wrap="soft"
            />

            <section className={styles.tasksSection}>
              <p className={styles.sectionLabel}>Tasks</p>
              <form className={styles.composer} onSubmit={handleQuickAdd}>
                <input
                  className={styles.composerInput}
                  type="text"
                  placeholder="New task"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                />
              </form>

              {activeTasks.length === 0 && hiddenCount === 0 && (
                <p className={styles.empty}>No tasks yet.</p>
              )}

              {activeTasks.map((task) => (
                <div key={task.id} className={styles.taskRow}>
                  <label className={styles.taskCheckLabel} aria-label="Mark complete">
                    <input
                      type="checkbox"
                      className={styles.taskCheckbox}
                      checked={!!task.completed}
                      onChange={(e) => void onToggleTaskComplete(task.id, e.target.checked)}
                    />
                  </label>
                  <button
                    type="button"
                    className={styles.taskContent}
                    onClick={() => setSelectedTaskId(task.id)}
                  >
                    <span className={styles.taskTitle}>{task.title}</span>
                    {task.is_next && <span className={styles.taskBadge}>Next</span>}
                  </button>
                </div>
              ))}

              {hiddenCount > 0 && (
                <>
                  <button
                    type="button"
                    className={styles.hiddenToggle}
                    onClick={() => setShowHidden((v) => !v)}
                  >
                    {showHidden
                      ? `Hide ${hiddenCount} item${hiddenCount !== 1 ? 's' : ''}`
                      : `Show ${hiddenCount} more`}
                  </button>
                  {showHidden && (
                    <>
                      {somedayTasks.map((task) => (
                        <div key={task.id} className={styles.taskRow}>
                          <label className={styles.taskCheckLabel}>
                            <input type="checkbox" className={styles.taskCheckbox} checked={false} onChange={() => {}} />
                          </label>
                          <button type="button" className={styles.taskContent} onClick={() => setSelectedTaskId(task.id)}>
                            <span className={styles.taskTitle}>{task.title}</span>
                            <span className={styles.taskBadge}>Someday</span>
                          </button>
                        </div>
                      ))}
                      {completedTasks.map((task) => (
                        <div key={task.id} className={`${styles.taskRow} ${styles['taskRow--completed']}`}>
                          <label className={styles.taskCheckLabel}>
                            <input
                              type="checkbox"
                              className={styles.taskCheckbox}
                              checked={true}
                              onChange={(e) => void onToggleTaskComplete(task.id, e.target.checked)}
                            />
                          </label>
                          <button type="button" className={styles.taskContent} onClick={() => setSelectedTaskId(task.id)}>
                            <span className={styles.taskTitle}>{task.title}</span>
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
            </section>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Start date sheet ── */}
      <Sheet open={isStartSheetOpen} onOpenChange={handleStartSheetOpenChange}>
        <SheetContent side="bottom" className={styles.metaSheet} aria-label="Project start date">
          <div className={styles.metaSheetHeader}>
            <span className={styles.metaSheetTitle}>Start</span>
          </div>
          <div className={styles.metaSheetContent}>
            <div className={styles.metaActions}>
              <button type="button" className={styles.metaAction} onClick={handleStartToday}>
                Today
              </button>
              {hasStart && (
                <button type="button" className={styles.metaAction} onClick={handleStartClear}>
                  Clear
                </button>
              )}
            </div>
            <CalendarPicker value={startDateInput} onChange={(v) => setStartDateInput(v)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Due date sheet ── */}
      <Sheet open={isDueSheetOpen} onOpenChange={handleDueSheetOpenChange}>
        <SheetContent side="bottom" className={styles.metaSheet} aria-label="Project due date">
          <div className={styles.metaSheetHeader}>
            <span className={styles.metaSheetTitle}>Due</span>
          </div>
          <div className={styles.metaSheetContent}>
            <div className={styles.metaActions}>
              <button type="button" className={styles.metaAction} onClick={handleDueToday}>
                Today
              </button>
              {hasDue && (
                <button type="button" className={styles.metaAction} onClick={handleDueClear}>
                  Clear
                </button>
              )}
            </div>
            <CalendarPicker value={dueDateInput} onChange={(v) => setDueDateInput(v)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Move to Area sheet ── */}
      <Sheet open={isMoveSheetOpen} onOpenChange={handleMoveSheetOpenChange}>
        <SheetContent side="bottom" className={styles.metaSheet} aria-label="Move to area">
          <div className={styles.metaSheetHeader}>
            <span className={styles.metaSheetTitle}>Move to Area</span>
          </div>
          <div className={styles.moveList}>
            {hasArea && (
              <button type="button" className={styles.moveItem} onClick={() => void handleMoveClearArea()}>
                <ClearIcon />
                <span className={styles.moveItemName}>No Area</span>
              </button>
            )}
            {areas.length === 0 ? (
              <p className={styles.metaEmpty}>No areas yet.</p>
            ) : (
              areas.map((area) => (
                <button
                  key={area.id}
                  type="button"
                  className={`${styles.moveItem}${parentId === area.id ? ` ${styles['moveItem--selected']}` : ''}`}
                  onClick={() => void handleMoveSelectArea(area.id)}
                >
                  <AreaIcon />
                  <span className={styles.moveItemName}>{area.title}</span>
                  {parentId === area.id && <CheckIcon />}
                </button>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Task detail sheet ── */}
      {selectedTask ? (
        <TaskDetailSheet
          key={selectedTask.id}
          open={Boolean(selectedTask)}
          onOpenChange={(nextOpen) => { if (!nextOpen) setSelectedTaskId(null); }}
          task={selectedTask}
          projects={projects}
          onSave={onSaveTask}
          onDelete={onDeleteTask}
          onToggleComplete={onToggleTaskComplete}
        />
      ) : null}
    </>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function MoreIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none">
      <circle cx="5" cy="12" r="1.75" fill="currentColor" />
      <circle cx="12" cy="12" r="1.75" fill="currentColor" />
      <circle cx="19" cy="12" r="1.75" fill="currentColor" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AreaIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 9h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
