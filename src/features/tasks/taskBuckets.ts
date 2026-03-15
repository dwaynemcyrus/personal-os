import type { ItemDocument } from '@/lib/db';

export type TaskListFilter =
  | 'today'
  | 'upcoming'
  | 'backlog'
  | 'someday'
  | 'logbook'
  | 'trash';

export type TaskBucketCounts = Record<TaskListFilter, number>;

const EMPTY_COUNTS: TaskBucketCounts = {
  today: 0,
  upcoming: 0,
  backlog: 0,
  someday: 0,
  logbook: 0,
  trash: 0,
};

// ─── Date helpers ─────────────────────────────────────────────────────────────

export const parseMs = (iso: string | null | undefined): number | null => {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
};

const getWindow = () => {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);
  return {
    startOfDayMs: startOfDay.getTime(),
    endOfDayMs: endOfDay.getTime() - 1,
  };
};

// ─── Sort ─────────────────────────────────────────────────────────────────────

export function sortByDeadline(a: ItemDocument, b: ItemDocument): number {
  const aDue = parseMs(a.due_date);
  const bDue = parseMs(b.due_date);

  if (aDue !== null && bDue !== null && aDue !== bDue) return aDue - bDue;
  if (aDue !== null && bDue === null) return -1;
  if (aDue === null && bDue !== null) return 1;

  const aStart = parseMs(a.start_date);
  const bStart = parseMs(b.start_date);

  if (aStart !== null && bStart !== null && aStart !== bStart) return aStart - bStart;
  if (aStart !== null && bStart === null) return -1;
  if (aStart === null && bStart !== null) return 1;

  return a.id.localeCompare(b.id);
}

// ─── Filter ───────────────────────────────────────────────────────────────────

type Window = { startOfDayMs: number; endOfDayMs: number };

export function matchesTaskFilter(
  task: ItemDocument,
  filter: TaskListFilter,
  window?: Window
): boolean {
  const { startOfDayMs, endOfDayMs } = window ?? getWindow();
  const dueMs = parseMs(task.due_date);
  const startMs = parseMs(task.start_date);
  const isTrashed = !!task.is_trashed;
  const isCompleted = !!task.completed;
  const isSomeday = !!task.is_someday;
  const isWaiting = !!task.is_waiting;
  const active = !isTrashed && !isCompleted;

  switch (filter) {
    case 'today':
      if (active && !isSomeday && startMs !== null && startMs <= endOfDayMs) return true;
      if (active && !isSomeday && isWaiting) return true;
      if (active && dueMs !== null && dueMs < startOfDayMs) return true;
      return false;

    case 'upcoming':
      if (!active) return false;
      if (!isSomeday && startMs !== null && startMs > endOfDayMs) return true;
      if (dueMs !== null && dueMs > endOfDayMs) return true;
      return false;

    case 'backlog':
      return active && !isSomeday;

    case 'someday':
      return !isTrashed && !isCompleted && isSomeday;

    case 'logbook':
      return !isTrashed && isCompleted;

    case 'trash':
      return isTrashed;

    default:
      return false;
  }
}

// ─── Upcoming items ───────────────────────────────────────────────────────────

export type UpcomingItem = {
  task: ItemDocument;
  dateType: 'start' | 'due';
  dateMs: number;
};

export function getUpcomingItems(tasks: ItemDocument[]): UpcomingItem[] {
  const { endOfDayMs } = getWindow();
  const rows: UpcomingItem[] = [];

  for (const task of tasks) {
    if (task.is_trashed || task.completed) continue;

    const startMs = parseMs(task.start_date);
    const dueMs = parseMs(task.due_date);

    if (!task.is_someday && startMs !== null && startMs > endOfDayMs) {
      rows.push({ task, dateType: 'start', dateMs: startMs });
    }

    if (dueMs !== null && dueMs > endOfDayMs) {
      rows.push({ task, dateType: 'due', dateMs: dueMs });
    }
  }

  rows.sort((a, b) => {
    if (a.dateMs !== b.dateMs) return a.dateMs - b.dateMs;
    return a.task.id.localeCompare(b.task.id);
  });

  return rows;
}

// ─── Today sections ───────────────────────────────────────────────────────────

export type TodaySections = {
  overdue: ItemDocument[];
  main: ItemDocument[];
  waiting: ItemDocument[];
};

export function getTodaySections(tasks: ItemDocument[]): TodaySections {
  const { startOfDayMs, endOfDayMs } = getWindow();
  const overdue: ItemDocument[] = [];
  const main: ItemDocument[] = [];
  const waiting: ItemDocument[] = [];

  const overdueIds = new Set<string>();

  for (const task of tasks) {
    if (task.is_trashed || task.completed) continue;

    const dueMs = parseMs(task.due_date);
    if (dueMs !== null && dueMs < startOfDayMs) {
      overdue.push(task);
      overdueIds.add(task.id);
    }
  }

  for (const task of tasks) {
    if (task.is_trashed || task.completed || task.is_someday) continue;
    if (overdueIds.has(task.id)) continue;

    if (task.is_waiting) {
      waiting.push(task);
      continue;
    }

    const startMs = parseMs(task.start_date);
    if (startMs !== null && startMs <= endOfDayMs) {
      main.push(task);
    }
  }

  overdue.sort(sortByDeadline);
  main.sort(sortByDeadline);
  waiting.sort(sortByDeadline);

  return { overdue, main, waiting };
}

// ─── Counts ───────────────────────────────────────────────────────────────────

export function getTaskBucketCounts(tasks: ItemDocument[]): TaskBucketCounts {
  const counts: TaskBucketCounts = { ...EMPTY_COUNTS };
  const win = getWindow();

  for (const task of tasks) {
    if (matchesTaskFilter(task, 'today', win)) counts.today += 1;
    if (matchesTaskFilter(task, 'upcoming', win)) counts.upcoming += 1;
    if (matchesTaskFilter(task, 'backlog', win)) counts.backlog += 1;
    if (matchesTaskFilter(task, 'someday', win)) counts.someday += 1;
    if (matchesTaskFilter(task, 'logbook', win)) counts.logbook += 1;
    if (matchesTaskFilter(task, 'trash', win)) counts.trash += 1;
  }

  return counts;
}
