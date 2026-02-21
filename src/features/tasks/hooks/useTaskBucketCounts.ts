import { useEffect, useMemo, useState } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import type { ProjectDocument, TaskDocument } from '@/lib/db';
import {
  buildProjectStartMap,
  getTaskBucketCounts,
  type TaskBucketCounts,
} from '@/features/tasks/taskBuckets';

const EMPTY_COUNTS: TaskBucketCounts = {
  today: 0,
  upcoming: 0,
  next: 0,
  backlog: 0,
  someday: 0,
  logbook: 0,
  trash: 0,
};

export function useTaskBucketCounts(): TaskBucketCounts {
  const { db, isReady } = useDatabase();
  const [tasks, setTasks] = useState<TaskDocument[]>([]);
  const [projects, setProjects] = useState<ProjectDocument[]>([]);

  useEffect(() => {
    if (!db || !isReady) return;

    const subscription = db.tasks
      .find({
        sort: [{ updated_at: 'desc' }, { id: 'asc' }],
      })
      .$.subscribe((docs) => {
        setTasks(docs.map((doc) => doc.toJSON()));
      });

    return () => subscription.unsubscribe();
  }, [db, isReady]);

  useEffect(() => {
    if (!db || !isReady) return;

    const subscription = db.projects
      .find({
        selector: { is_trashed: false },
        sort: [{ updated_at: 'desc' }, { id: 'asc' }],
      })
      .$.subscribe((docs) => {
        setProjects(docs.map((doc) => doc.toJSON()));
      });

    return () => subscription.unsubscribe();
  }, [db, isReady]);

  return useMemo(() => {
    if (!db || !isReady) return EMPTY_COUNTS;
    const projectStartById = buildProjectStartMap(projects);
    return getTaskBucketCounts(tasks, projectStartById);
  }, [db, isReady, projects, tasks]);
}
