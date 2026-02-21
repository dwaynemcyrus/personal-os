import type { TaskDocument } from '@/lib/db';

export type TaskListFilter =
  | 'today'
  | 'upcoming'
  | 'next'
  | 'backlog'
  | 'someday'
  | 'logbook'
  | 'trash';

export type TaskBucketCounts = Record<TaskListFilter, number>;

const EMPTY_COUNTS: TaskBucketCounts = {
  today: 0,
  upcoming: 0,
  next: 0,
  backlog: 0,
  someday: 0,
  logbook: 0,
  trash: 0,
};

const parseTime = (iso: string | null | undefined) => {
  if (!iso) return null;
  const date = new Date(iso);
  const time = date.getTime();
  return Number.isNaN(time) ? null : time;
};

const getDateWindow = () => {
  const now = new Date();
  const nowMs = now.getTime();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const nextDay = new Date(startOfDay);
  nextDay.setDate(nextDay.getDate() + 1);
  const endOfDayMs = nextDay.getTime() - 1;
  return { nowMs, endOfDayMs };
};

export function matchesTaskFilter(
  task: TaskDocument,
  filter: TaskListFilter
): boolean {
  const { nowMs, endOfDayMs } = getDateWindow();
  const dueMs = parseTime(task.due_date);
  const startMs = parseTime(task.start_date);
  const isActive = !task.is_trashed && !task.completed;

  switch (filter) {
    case 'today':
      return isActive && dueMs !== null && dueMs <= endOfDayMs;
    case 'upcoming':
      return (
        isActive &&
        ((dueMs !== null && dueMs > endOfDayMs) ||
          (startMs !== null && startMs > nowMs))
      );
    case 'next':
      return isActive && task.status === 'next';
    case 'backlog':
      return isActive && task.status === 'backlog';
    case 'someday':
      return isActive && task.status === 'someday';
    case 'logbook':
      return !task.is_trashed && task.completed;
    case 'trash':
      return task.is_trashed;
    default:
      return false;
  }
}

export function getTaskBucketCounts(
  tasks: TaskDocument[]
): TaskBucketCounts {
  const counts: TaskBucketCounts = { ...EMPTY_COUNTS };

  for (const task of tasks) {
    if (matchesTaskFilter(task, 'today')) counts.today += 1;
    if (matchesTaskFilter(task, 'upcoming')) counts.upcoming += 1;
    if (matchesTaskFilter(task, 'next')) counts.next += 1;
    if (matchesTaskFilter(task, 'backlog')) counts.backlog += 1;
    if (matchesTaskFilter(task, 'someday')) counts.someday += 1;
    if (matchesTaskFilter(task, 'logbook')) counts.logbook += 1;
    if (matchesTaskFilter(task, 'trash')) counts.trash += 1;
  }

  return counts;
}
