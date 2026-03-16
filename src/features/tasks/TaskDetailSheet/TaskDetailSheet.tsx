import { useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/Sheet';
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
} from '@/components/ui/Dropdown';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import type { ItemRow } from '@/lib/db';
import { parseTags } from '@/lib/db';
import { CalendarPicker } from './CalendarPicker';
import { nowIso } from '@/lib/time';
import styles from './TaskDetailSheet.module.css';

type TagDocument = { id: string; name: string; is_trashed: number; trashed_at: string | null; created_at: string; updated_at: string };
const NOTES_MAX_ROWS = 4;

type TaskDetailSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: ItemRow | null;
  projects: ItemRow[];
  onSave: (taskId: string, updates: {
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
  // Form state
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.content ?? '');
  const [parentId, setParentId] = useState(task?.parent_id ?? '');
  const [isNext, setIsNext] = useState(!!task?.is_next);
  const [startDateInput, setStartDateInput] = useState(toDateInputValue(task?.start_date ?? null));
  const [dueDateInput, setDueDateInput] = useState(toDateInputValue(task?.due_date ?? null));
  const [isSomeday, setIsSomeday] = useState(!!task?.is_someday);
  const [isWaiting, setIsWaiting] = useState(!!task?.is_waiting);
  const [waitingNote, setWaitingNote] = useState(task?.waiting_note ?? '');
  const [tags, setTags] = useState<string[]>(dedupeTags(parseTags(task?.tags ?? null)));

  // Catalogs via react-query
  const { data: tagCatalog = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: async (): Promise<TagDocument[]> => {
      const { data } = await supabase
        .from('tags')
        .select('*')
        .eq('is_trashed', false)
        .order('name', { ascending: true });
      return (data ?? []) as unknown as TagDocument[];
    },
    staleTime: 60_000,
  });

  const { data: areas = [] } = useQuery({
    queryKey: ['areas'],
    queryFn: async (): Promise<ItemRow[]> => {
      const { data } = await supabase
        .from('items')
        .select('*')
        .eq('type', 'area')
        .eq('is_trashed', false)
        .order('title', { ascending: true });
      return (data ?? []) as unknown as ItemRow[];
    },
    staleTime: 60_000,
  });

  // Tag sheet state
  const [tagInput, setTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [isTagEditMode, setIsTagEditMode] = useState(false);

  // Move sheet state
  const [moveSearch, setMoveSearch] = useState('');

  // Sub-sheet open state
  const [isTagsSheetOpen, setIsTagsSheetOpen] = useState(false);
  const [isWhenSheetOpen, setIsWhenSheetOpen] = useState(false);
  const [isDueSheetOpen, setIsDueSheetOpen] = useState(false);
  const [isMoveSheetOpen, setIsMoveSheetOpen] = useState(false);
  const notesTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const subSheetJustClosedRef = useRef(false);

  const resizeNotesTextarea = (elementArg?: HTMLTextAreaElement | null) => {
    const element = elementArg ?? notesTextareaRef.current;
    if (!element) return;

    element.style.height = 'auto';

    const styles = window.getComputedStyle(element);
    const lineHeight = Number.parseFloat(styles.lineHeight) || 25.6;
    const paddingTop = Number.parseFloat(styles.paddingTop) || 0;
    const paddingBottom = Number.parseFloat(styles.paddingBottom) || 0;
    const borderTop = Number.parseFloat(styles.borderTopWidth) || 0;
    const borderBottom = Number.parseFloat(styles.borderBottomWidth) || 0;
    const maxHeight =
      lineHeight * NOTES_MAX_ROWS +
      paddingTop +
      paddingBottom +
      borderTop +
      borderBottom;

    const nextHeight = Math.min(element.scrollHeight, maxHeight);
    element.style.height = `${nextHeight}px`;
    element.style.overflowX = 'hidden';
    element.style.overflowY = element.scrollHeight > maxHeight ? 'auto' : 'hidden';
  };

  // Reset form when task changes
  useEffect(() => {
    if (!task) return;
    setTitle(task.title ?? '');
    setDescription(task.content ?? '');
    setParentId(task.parent_id ?? '');
    setIsNext(!!task.is_next);
    setStartDateInput(toDateInputValue(task.start_date ?? null));
    setDueDateInput(toDateInputValue(task.due_date ?? null));
    setIsSomeday(!!task.is_someday);
    setIsWaiting(!!task.is_waiting);
    setWaitingNote(task.waiting_note ?? '');
    setTags(dedupeTags(parseTags(task.tags ?? null)));
    setTagInput('');
    setShowTagInput(false);
    setIsTagEditMode(false);
  }, [task]);

  useEffect(() => {
    resizeNotesTextarea();
  }, [description, open]);

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


  // ─── Derived state ───────────────────────────────────────────────────────

  const canSave = useMemo(() => Boolean(title.trim()), [title]);

  const existingTagKeys = useMemo(
    () => new Set(tags.map(t => t.toLowerCase())),
    [tags]
  );

  const filteredTagSuggestions = useMemo(() => {
    const query = normalizeTag(tagInput).toLowerCase();
    return tagCatalog
      .map(t => t.name)
      .filter(name => !existingTagKeys.has(name.toLowerCase()))
      .filter(name => (query ? name.toLowerCase().includes(query) : true))
      .slice(0, 6);
  }, [tagCatalog, existingTagKeys, tagInput]);

  const tagsListAll = useMemo(() => {
    const catalogKeys = new Set(tagCatalog.map(t => t.name.toLowerCase()));
    const legacy = tags.filter(t => !catalogKeys.has(t.toLowerCase()));
    return [...tagCatalog.map(t => t.name), ...legacy];
  }, [tagCatalog, tags]);

  // Move sheet derived state
  const activeProjects = useMemo(
    () => projects.filter(p => !p.is_trashed),
    [projects]
  );


  // Build a combined parent map for display (projects + areas)
  const parentMap = useMemo(() => {
    const map = new Map<string, { title: string; type: 'project' | 'area' }>();
    for (const p of activeProjects) {
      map.set(p.id, { title: p.title ?? '', type: 'project' });
    }
    for (const a of areas) {
      map.set(a.id, { title: a.title ?? '', type: 'area' });
    }
    return map;
  }, [activeProjects, areas]);

  // Projects that have no area parent
  const ungroupedProjects = useMemo(
    () => activeProjects.filter(p => !p.parent_id || !areas.some(a => a.id === p.parent_id)),
    [activeProjects, areas]
  );

  // Map area id → projects belonging to that area
  const areaProjectsMap = useMemo(() => {
    const map = new Map<string, ItemRow[]>();
    for (const p of activeProjects) {
      if (p.parent_id && areas.some(a => a.id === p.parent_id)) {
        const list = map.get(p.parent_id) ?? [];
        list.push(p);
        map.set(p.parent_id, list);
      }
    }
    return map;
  }, [activeProjects, areas]);

  const moveSearchResults = useMemo(() => {
    if (!moveSearch.trim()) return null;
    const q = moveSearch.toLowerCase();
    return {
      areas: areas.filter(a => (a.title ?? '').toLowerCase().includes(q)),
      projects: activeProjects.filter(p => (p.title ?? '').toLowerCase().includes(q)),
    };
  }, [moveSearch, areas, activeProjects]);

  const moveLabel = useMemo(() => {
    if (parentId) return parentMap.get(parentId)?.title ?? null;
    return null;
  }, [parentId, parentMap]);
  const hasMove = Boolean(parentId);
  const moveDisplayLabel = moveLabel ?? 'move to...';

  // Determine if current parent is a project or an area (for clear button label)
  const currentParentType = parentId ? parentMap.get(parentId)?.type ?? null : null;

  // Meta label values
  const isStartToday = startDateInput === getTodayDateInputValue();
  const whenLabel = isWaiting
    ? 'Waiting'
    : isSomeday
    ? 'Someday'
    : isStartToday
    ? 'Today'
    : formatMetaDateLabel(fromDateInputValue(startDateInput));
  const dueLabel = formatMetaDateLabel(fromDateInputValue(dueDateInput));
  const hasWhen = isSomeday || isWaiting || Boolean(startDateInput);
  const hasDue = Boolean(dueDateInput);

  // ─── Auto-save helper ────────────────────────────────────────────────────

  const saveQueue = useRef<Promise<void>>(Promise.resolve());

  const doSave = (opts: {
    isNext?: boolean;
    startDate?: string | null;
    dueDate?: string | null;
    isSomeday?: boolean;
    isWaiting?: boolean;
    waitingNote?: string | null;
    tags?: string[];
    parentId?: string | null;
  } = {}): Promise<void> => {
    if (!task || !title.trim()) return Promise.resolve();
    const resolvedIsSomeday = opts.isSomeday ?? isSomeday;
    const resolvedIsWaiting = opts.isWaiting ?? isWaiting;
    const resolvedStartDate = opts.startDate !== undefined
      ? opts.startDate
      : (resolvedIsSomeday || resolvedIsWaiting ? null : fromDateInputValue(startDateInput));
    const resolvedDueDate = opts.dueDate !== undefined ? opts.dueDate : fromDateInputValue(dueDateInput);
    const resolvedParentId = opts.parentId !== undefined ? opts.parentId : (parentId || null);
    const resolvedIsNext = opts.isNext ?? isNext;
    const resolvedWaitingNote = opts.waitingNote !== undefined ? opts.waitingNote : (waitingNote || null);
    const payload = {
      title: title.trim(),
      description: description.trim(),
      parentId: resolvedParentId,
      isNext: resolvedIsNext,
      startDate: resolvedStartDate,
      dueDate: resolvedDueDate,
      isSomeday: resolvedIsSomeday,
      isWaiting: resolvedIsWaiting,
      waitingNote: resolvedWaitingNote,
      tags: dedupeTags(opts.tags ?? tags),
    };
    const taskId = task.id;
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

  const handleToggleNext = async () => {
    const next = !isNext;
    setIsNext(next);
    await doSave({ isNext: next });
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
    const existing = tagCatalog.find(t => t.name.toLowerCase() === normalized.toLowerCase());
    if (!existing) {
      const timestamp = nowIso();
      await supabase.from('tags').insert({
        id: uuidv4(),
        name: normalized,
        created_at: timestamp,
        updated_at: timestamp,
        is_trashed: false,
        trashed_at: null,
      });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
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
      subSheetJustClosedRef.current = true;
      queueMicrotask(() => { subSheetJustClosedRef.current = false; });
      setIsTagEditMode(false);
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
    const normalized = normalizeTag(newName);
    if (!normalized || normalized.toLowerCase() === tagDoc.name.toLowerCase()) return;

    const timestamp = nowIso();
    await supabase.from('tags').update({ name: normalized, updated_at: timestamp }).eq('id', tagDoc.id);

    setTags(current =>
      current.map(t => t.toLowerCase() === tagDoc.name.toLowerCase() ? normalized : t)
    );

    // Update tags JSON in all items that reference the old tag name
    const { data: allItems } = await supabase.from('items').select('id, tags').eq('is_trashed', false);
    const oldName = tagDoc.name.toLowerCase();
    for (const item of allItems ?? []) {
      const itemTags = parseTags(item.tags);
      if (!itemTags.some((t: string) => t.toLowerCase() === oldName)) continue;
      const newTags = JSON.stringify(itemTags.map((t: string) =>
        t.toLowerCase() === oldName ? normalized : t
      ));
      await supabase.from('items').update({ tags: newTags, updated_at: timestamp }).eq('id', item.id);
    }
    queryClient.invalidateQueries({ queryKey: ['tags'] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

  const handleDeleteTag = async (tagDoc: TagDocument) => {
    const timestamp = nowIso();
    await supabase.from('tags').update({ is_trashed: true, trashed_at: timestamp, updated_at: timestamp }).eq('id', tagDoc.id);

    setTags(current => current.filter(t => t.toLowerCase() !== tagDoc.name.toLowerCase()));

    // Remove tag from all items that reference it
    const { data: allItems } = await supabase.from('items').select('id, tags').eq('is_trashed', false);
    const oldName = tagDoc.name.toLowerCase();
    for (const item of allItems ?? []) {
      const itemTags = parseTags(item.tags);
      if (!itemTags.some((t: string) => t.toLowerCase() === oldName)) continue;
      const newTagsArr = itemTags.filter((t: string) => t.toLowerCase() !== oldName);
      const newTags = newTagsArr.length > 0 ? JSON.stringify(newTagsArr) : null;
      await supabase.from('items').update({ tags: newTags, updated_at: timestamp }).eq('id', item.id);
    }
    queryClient.invalidateQueries({ queryKey: ['tags'] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

  // ─── Move sheet ───────────────────────────────────────────────────────────

  type MoveTarget =
    | { type: 'project'; id: string }
    | { type: 'area'; id: string }
    | { type: 'clear' };

  const handleMoveSelect = (target: MoveTarget) => {
    switch (target.type) {
      case 'project':
        setParentId(target.id);
        break;
      case 'area':
        setParentId(target.id);
        break;
      case 'clear':
        setParentId('');
        break;
    }
  };

  const handleMoveSheetOpenChange = (open: boolean) => {
    setIsMoveSheetOpen(open);
    if (!open) {
      subSheetJustClosedRef.current = true;
      queueMicrotask(() => { subSheetJustClosedRef.current = false; });
      setMoveSearch('');
      void doSave();
    }
  };

  // ─── When sheet ──────────────────────────────────────────────────────────

  const handleWhenToday = async () => {
    const today = getTodayDateInputValue();
    setStartDateInput(today);
    setIsSomeday(false);
    setIsNext(false);
    setIsWaiting(false);
    setWaitingNote('');
    setIsWhenSheetOpen(false);
    await doSave({ startDate: fromDateInputValue(today), isSomeday: false, isNext: false, isWaiting: false, waitingNote: null });
  };

  const handleWhenSomeday = async () => {
    setIsSomeday(true);
    setStartDateInput('');
    setIsWaiting(false);
    setWaitingNote('');
    setIsWhenSheetOpen(false);
    await doSave({ startDate: null, isSomeday: true, isWaiting: false, waitingNote: null });
  };

  const handleWhenWaiting = () => {
    setIsWaiting(true);
    setIsSomeday(false);
    setStartDateInput('');
  };

  const handleWhenClear = async () => {
    setStartDateInput('');
    setIsSomeday(false);
    setIsWaiting(false);
    setWaitingNote('');
    setIsWhenSheetOpen(false);
    await doSave({ startDate: null, isSomeday: false, isWaiting: false, waitingNote: null });
  };

  const handleWhenSheetOpenChange = (open: boolean) => {
    setIsWhenSheetOpen(open);
    if (!open) {
      subSheetJustClosedRef.current = true;
      queueMicrotask(() => { subSheetJustClosedRef.current = false; });
      void doSave();
    }
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
    if (!open) {
      subSheetJustClosedRef.current = true;
      queueMicrotask(() => { subSheetJustClosedRef.current = false; });
      void doSave();
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  if (!task) return null;

  const isAnySubSheetOpen = isTagsSheetOpen || isWhenSheetOpen || isDueSheetOpen || isMoveSheetOpen;

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
            if (isAnySubSheetOpen || subSheetJustClosedRef.current) e.preventDefault();
          }}
        >
          <header className={styles['task-detail__header']}>
            <div className={styles['task-detail__headerDates']}>
              <button
                type="button"
                className={`${styles['task-detail__headerDateButton']}${hasWhen ? ` ${styles['task-detail__headerDateButton--set']}` : ''}`}
                onClick={() => setIsWhenSheetOpen(true)}
              >
                {hasWhen ? whenLabel : 'When?'}
              </button>
              <span className={styles['task-detail__headerDateArrow']} aria-hidden="true">›</span>
              <button
                type="button"
                className={`${styles['task-detail__headerDateButton']}${hasDue ? ` ${styles['task-detail__headerDateButton--set']}` : ''}`}
                onClick={() => setIsDueSheetOpen(true)}
              >
                {hasDue ? dueLabel : 'Due'}
              </button>
            </div>

            <Dropdown>
              <DropdownTrigger asChild>
                <button
                  type="button"
                  className={styles['task-detail__close']}
                  aria-label="Task actions"
                >
                  <MoreIcon />
                </button>
              </DropdownTrigger>
              <DropdownContent align="end" sideOffset={8}>
                <DropdownItem onSelect={() => void handleSave()}>
                  Save
                </DropdownItem>
                <DropdownItem onSelect={() => void handleToggleNext()}>
                  {isNext ? 'Unmark Next' : 'Mark Next'}
                </DropdownItem>
                <DropdownItem data-variant="danger" onSelect={() => void handleDelete()}>
                  Delete
                </DropdownItem>
              </DropdownContent>
            </Dropdown>
          </header>

          <div className={styles['task-detail__body']}>
            <div className={styles['task-detail__topRow']}>
              <label className={styles['task-detail__completion']} aria-label="Completion">
                <input
                  className={styles['task-detail__checkbox']}
                  type="checkbox"
                  checked={!!task.completed}
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

            <div className={styles['task-detail__field']}>
              <textarea
                ref={notesTextareaRef}
                className={styles['task-detail__textarea']}
                value={description}
                onChange={e => {
                  setDescription(e.target.value);
                  resizeNotesTextarea(e.currentTarget);
                }}
                onBlur={() => void doSave()}
                placeholder="Notes"
                aria-label="Notes"
                rows={1}
                wrap="soft"
              />
            </div>

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

            {/* Meta row */}
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
                className={`${styles['task-detail__metaButton']}${hasMove ? ` ${styles['task-detail__metaButton--set']}` : ''}`}
                onClick={() => setIsMoveSheetOpen(true)}
              >
                {moveDisplayLabel}
              </button>

              <button
                type="button"
                className={styles['task-detail__metaButton']}
              >
                Priority
              </button>

              <button
                type="button"
                className={styles['task-detail__metaButton']}
              >
                Checklist
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

      {/* ── Move sheet ── */}
      <Sheet open={isMoveSheetOpen} onOpenChange={handleMoveSheetOpenChange}>
        <SheetContent
          side="bottom"
          className={styles['task-detail__metaSheet']}
          aria-label="Move task"
        >
          <div className={styles['task-detail__metaSheetHeader']}>
            <span className={styles['task-detail__metaSheetTitle']}>Move</span>
          </div>

          {/* Search — outside scrollable area so it stays pinned */}
          <div className={styles['task-detail__moveSearchRow']}>
            <div className={styles['task-detail__moveSearchWrap']}>
              <SearchIcon />
              <input
                type="search"
                className={styles['task-detail__moveSearch']}
                placeholder="Search"
                value={moveSearch}
                onChange={e => setMoveSearch(e.target.value)}
                aria-label="Search areas and projects"
              />
            </div>
          </div>

          <div className={styles['task-detail__moveList']}>
            {moveSearchResults ? (
              /* Flat filtered results */
              <>
                {moveSearchResults.areas.map(area => (
                  <button
                    key={area.id}
                    type="button"
                    className={`${styles['task-detail__moveItem']}${parentId === area.id ? ` ${styles['task-detail__moveItem--selected']}` : ''}`}
                    onClick={() => handleMoveSelect({ type: 'area', id: area.id })}
                  >
                    <AreaIcon />
                    <span className={styles['task-detail__moveItemName']}>{area.title}</span>
                    {parentId === area.id && <CheckIcon className={styles['task-detail__moveItemCheck']} />}
                  </button>
                ))}
                {moveSearchResults.projects.map(project => (
                  <button
                    key={project.id}
                    type="button"
                    className={`${styles['task-detail__moveItem']}${parentId === project.id ? ` ${styles['task-detail__moveItem--selected']}` : ''}`}
                    onClick={() => handleMoveSelect({ type: 'project', id: project.id })}
                  >
                    <ProjectIcon />
                    <span className={styles['task-detail__moveItemName']}>{project.title}</span>
                    {parentId === project.id && <CheckIcon className={styles['task-detail__moveItemCheck']} />}
                  </button>
                ))}
                {moveSearchResults.areas.length === 0 && moveSearchResults.projects.length === 0 && (
                  <p className={styles['task-detail__metaEmpty']}>No results.</p>
                )}
              </>
            ) : (
              /* Grouped view */
              <>
                {/* Clear option */}
                {parentId && (
                  <button
                    type="button"
                    className={styles['task-detail__moveClearOption']}
                    onClick={() => handleMoveSelect({ type: 'clear' })}
                  >
                    <ClearIcon />
                    <span className={styles['task-detail__moveItemName']}>
                      {currentParentType === 'area' ? 'No Area' : 'No Project'}
                    </span>
                  </button>
                )}
                {parentId && (
                  <div className={styles['task-detail__moveDivider']} />
                )}

                {/* Ungrouped projects */}
                {ungroupedProjects.map(project => (
                  <button
                    key={project.id}
                    type="button"
                    className={`${styles['task-detail__moveItem']}${parentId === project.id ? ` ${styles['task-detail__moveItem--selected']}` : ''}`}
                    onClick={() => handleMoveSelect({ type: 'project', id: project.id })}
                  >
                    <ProjectIcon />
                    <span className={styles['task-detail__moveItemName']}>{project.title}</span>
                    {parentId === project.id && <CheckIcon className={styles['task-detail__moveItemCheck']} />}
                  </button>
                ))}

                {/* Areas with nested projects */}
                {areas.map(area => (
                  <div key={area.id}>
                    <button
                      type="button"
                      className={`${styles['task-detail__moveAreaHeader']}${parentId === area.id ? ` ${styles['task-detail__moveItem--selected']}` : ''}`}
                      onClick={() => handleMoveSelect({ type: 'area', id: area.id })}
                    >
                      <AreaIcon />
                      <span className={styles['task-detail__moveItemName']}>{area.title}</span>
                      {parentId === area.id && <CheckIcon className={styles['task-detail__moveItemCheck']} />}
                    </button>
                    {(areaProjectsMap.get(area.id) ?? []).map(project => (
                      <button
                        key={project.id}
                        type="button"
                        className={`${styles['task-detail__moveItem']} ${styles['task-detail__moveItem--indent']}${parentId === project.id ? ` ${styles['task-detail__moveItem--selected']}` : ''}`}
                        onClick={() => handleMoveSelect({ type: 'project', id: project.id })}
                      >
                        <ProjectIcon />
                        <span className={styles['task-detail__moveItemName']}>{project.title}</span>
                        {parentId === project.id && <CheckIcon className={styles['task-detail__moveItemCheck']} />}
                      </button>
                    ))}
                  </div>
                ))}

                {areas.length === 0 && activeProjects.length === 0 && (
                  <p className={styles['task-detail__metaEmpty']}>No projects or areas yet.</p>
                )}
              </>
            )}
          </div>
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
              <button type="button" className={`${styles['task-detail__metaAction']}${isWaiting ? '' : ''}`} onClick={handleWhenToday}>
                Today
              </button>
              <button type="button" className={styles['task-detail__metaAction']} onClick={handleWhenSomeday}>
                Someday
              </button>
              <button
                type="button"
                className={`${styles['task-detail__metaAction']}${isWaiting ? ` ${styles['task-detail__metaAction--active']}` : ''}`}
                onClick={handleWhenWaiting}
              >
                Waiting
              </button>
              {hasWhen && (
                <button type="button" className={styles['task-detail__metaAction']} onClick={handleWhenClear}>
                  Clear
                </button>
              )}
            </div>

            {isWaiting ? (
              <div className={styles['task-detail__waitingSection']}>
                <label className={styles['task-detail__waitingLabel']}>
                  Waiting on
                </label>
                <textarea
                  className={styles['task-detail__waitingInput']}
                  value={waitingNote}
                  onChange={e => setWaitingNote(e.target.value)}
                  placeholder="What are you waiting for?"
                  rows={3}
                />
              </div>
            ) : (
              <CalendarPicker
                value={startDateInput}
                onChange={v => {
                  setStartDateInput(v);
                  setIsSomeday(false);
                  setIsWaiting(false);
                }}
              />
            )}
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

  useEffect(() => { setName(tagDoc.name); }, [tagDoc.name]);

  const handleBlur = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setName(tagDoc.name);
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

function MoreIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none">
      <circle cx="5" cy="12" r="1.75" fill="currentColor" />
      <circle cx="12" cy="12" r="1.75" fill="currentColor" />
      <circle cx="19" cy="12" r="1.75" fill="currentColor" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg className={styles['task-detail__tagListIcon']} width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="7" y1="7" x2="7.01" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? styles['task-detail__tagListCheck']} width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none">
      <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className={styles['task-detail__moveSearchIcon']} width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none">
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ProjectIcon() {
  return (
    <svg className={styles['task-detail__moveIcon']} width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function AreaIcon() {
  return (
    <svg className={styles['task-detail__moveIcon']} width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 9h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg className={styles['task-detail__moveIcon']} width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
