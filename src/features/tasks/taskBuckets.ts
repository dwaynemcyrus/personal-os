import type { TaskDocument } from '@/lib/db';

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

// Primary: due_date asc (nulls last). Secondary: start_date asc (nulls last).
export function sortByDeadline(a: TaskDocument, b: TaskDocument): number {
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

export function matchesTaskFilter(
  task: TaskDocument,
  filter: TaskListFilter
): boolean {
  const { startOfDayMs, endOfDayMs } = getWindow();
  const dueMs = parseMs(task.due_date);
  const startMs = parseMs(task.start_date);
  const active = !task.is_trashed && !task.completed;

  switch (filter) {
    case 'today':
      // Backlog tasks scheduled for today or earlier (includes waiting tasks)
      if (active && !task.is_someday && startMs !== null && startMs <= endOfDayMs) return true;
      // Waiting tasks always surface in Today (regardless of start_date)
      if (active && !task.is_someday && task.is_waiting) return true;
      // Overdue due dates from backlog or someday
      if (active && dueMs !== null && dueMs < startOfDayMs) return true;
      return false;

    case 'upcoming':
      if (!active) return false;
      // Future start dates (backlog only, not someday)
      if (!task.is_someday && startMs !== null && startMs > endOfDayMs) return true;
      // Future due dates (backlog + someday + waiting)
      if (dueMs !== null && dueMs > endOfDayMs) return true;
      return false;

    case 'backlog':
      return active && !task.is_someday;

    case 'someday':
      return !task.is_trashed && !task.completed && task.is_someday;

    case 'logbook':
      return !task.is_trashed && task.completed;

    case 'trash':
      return task.is_trashed;

    default:
      return false;
  }
}

// ─── Upcoming items ───────────────────────────────────────────────────────────

export type UpcomingItem = {
  task: TaskDocument;
  dateType: 'start' | 'due';
  dateMs: number;
};

export function getUpcomingItems(tasks: TaskDocument[]): UpcomingItem[] {
  const { endOfDayMs } = getWindow();
  const rows: UpcomingItem[] = [];

  for (const task of tasks) {
    if (task.is_trashed || task.completed) continue;

    const startMs = parseMs(task.start_date);
    const dueMs = parseMs(task.due_date);

    // Future start dates — backlog only (not someday)
    if (!task.is_someday && startMs !== null && startMs > endOfDayMs) {
      rows.push({ task, dateType: 'start', dateMs: startMs });
    }

    // Future due dates — all active tasks (backlog + someday + waiting)
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
  overdue: TaskDocument[];   // past due_date, from backlog or someday
  main: TaskDocument[];      // start_date <= today, not someday, not waiting, not in overdue
  waiting: TaskDocument[];   // is_waiting tasks from backlog
};

export function getTodaySections(tasks: TaskDocument[]): TodaySections {
  const { startOfDayMs, endOfDayMs } = getWindow();
  const overdue: TaskDocument[] = [];
  const main: TaskDocument[] = [];
  const waiting: TaskDocument[] = [];

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

export function getTaskBucketCounts(tasks: TaskDocument[]): TaskBucketCounts {
  const counts: TaskBucketCounts = { ...EMPTY_COUNTS };

  for (const task of tasks) {
    if (matchesTaskFilter(task, 'today')) counts.today += 1;
    if (matchesTaskFilter(task, 'upcoming')) counts.upcoming += 1;
    if (matchesTaskFilter(task, 'backlog')) counts.backlog += 1;
    if (matchesTaskFilter(task, 'someday')) counts.someday += 1;
    if (matchesTaskFilter(task, 'logbook')) counts.logbook += 1;
    if (matchesTaskFilter(task, 'trash')) counts.trash += 1;
  }

  return counts;
}
