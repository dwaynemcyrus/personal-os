import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
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
  const { data: tasks } = useQuery({
    queryKey: ['tasks', 'counts-raw'],
    queryFn: async (): Promise<ItemRow[]> => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('type', 'task')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ItemRow[];
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  return useMemo(() => {
    if (!tasks?.length) return EMPTY_COUNTS;
    return getTaskBucketCounts(tasks);
  }, [tasks]);
}
