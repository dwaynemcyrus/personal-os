import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { DocumentRow } from '@/lib/db';
import type { TaskBucketCounts } from '@/features/tasks/taskBuckets';

const EMPTY_COUNTS: TaskBucketCounts = {
  today: 0,
  upcoming: 0,
  backlog: 0,
  someday: 0,
  logbook: 0,
  trash: 0,
};

export function useTaskBucketCounts(): TaskBucketCounts {
  const today = useMemo(() => {
    const now = new Date();
    return [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-');
  }, []);

  const { data: counts } = useQuery({
    queryKey: ['tasks', 'counts-raw'],
    queryFn: async (): Promise<TaskBucketCounts> => {
      const { data, error } = await supabase
        .from('items')
        .select('id, type, subtype, status, end_date, date_trashed')
        .eq('type', 'action')
        .eq('subtype', 'task');
      if (error) throw error;
      const tasks = (data ?? []) as DocumentRow[];
      return tasks.reduce<TaskBucketCounts>((acc, task) => {
        const isTrashed = task.date_trashed !== null;
        if (isTrashed) {
          acc.trash += 1;
          return acc;
        }
        if (task.status === 'done') {
          acc.logbook += 1;
          return acc;
        }
        if (task.status === 'someday') {
          acc.someday += 1;
          return acc;
        }
        if (task.end_date === today) {
          acc.today += 1;
        } else if (task.end_date && task.end_date > today) {
          acc.upcoming += 1;
        } else if (task.end_date === null && (task.status === 'active' || task.status === 'next' || task.status === 'waiting')) {
          acc.backlog += 1;
        }
        return acc;
      }, { ...EMPTY_COUNTS });
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  return useMemo(() => {
    return counts ?? EMPTY_COUNTS;
  }, [counts]);
}
