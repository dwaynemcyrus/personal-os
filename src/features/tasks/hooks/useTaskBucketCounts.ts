import { useMemo } from 'react';
import { useQuery } from '@powersync/react';
import type { ItemRow } from '@/lib/db';
import {
  getTaskBucketCounts,
  type TaskBucketCounts,
} from '@/features/tasks/taskBuckets';

const EMPTY_COUNTS: TaskBucketCounts = {
  today: 0,
  upcoming: 0,
  backlog: 0,
  someday: 0,
  logbook: 0,
  trash: 0,
};

export function useTaskBucketCounts(): TaskBucketCounts {
  const { data: tasks } = useQuery<ItemRow>(
    "SELECT * FROM items WHERE type = 'task' ORDER BY updated_at DESC, id ASC"
  );

  return useMemo(() => {
    if (!tasks.length) return EMPTY_COUNTS;
    return getTaskBucketCounts(tasks);
  }, [tasks]);
}
