export type CanonicalTaskStatus = 'active' | 'next' | 'waiting' | 'someday' | 'done';

type TaskStatusSource = {
  status?: string | null;
  completed?: boolean | null;
  is_next?: boolean | null;
  is_someday?: boolean | null;
  is_waiting?: boolean | null;
};

export function deriveCanonicalTaskStatus(task: TaskStatusSource): CanonicalTaskStatus {
  if (task.status === 'done' || task.completed) return 'done';
  if (task.status === 'someday' || task.is_someday) return 'someday';
  if (task.status === 'waiting' || task.is_waiting) return 'waiting';
  if (task.status === 'next' || task.is_next) return 'next';
  return 'active';
}

export function getLegacyTaskFields(status: CanonicalTaskStatus): {
  completed: boolean;
  is_next: boolean;
  is_someday: boolean;
  is_waiting: boolean;
} {
  return {
    completed: status === 'done',
    is_next: status === 'next',
    is_someday: status === 'someday',
    is_waiting: status === 'waiting',
  };
}
