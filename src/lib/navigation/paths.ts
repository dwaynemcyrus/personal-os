import type { NavigationLayer } from './types';
import type { TaskListFilter } from '@/features/tasks/taskBuckets';

const NOTE_GROUPS = new Set(['all', 'today', 'todo', 'pinned', 'locked', 'trash']);

const TASK_FILTERS = new Set<string>([
  'backlog', 'next', 'today', 'someday', 'waiting', 'logbook',
]);

export function layerToPath(layer: NavigationLayer): string {
  switch (layer.view) {
    case 'notes-list':  return `/notes/${layer.group}`;
    case 'tasks-list':  return layer.filter ? `/tasks/${layer.filter}` : '/tasks';
    case 'task-detail': return `/task/${layer.taskId}`;
    case 'strategy-detail':  return `/strategy/${layer.strategyId}`;
    case 'document-detail':  return `/document/${layer.documentId}`;
    case 'actions':          return `/actions/${layer.filter}`;
    case 'writing':          return '/writing';
    case 'reference':        return '/reference';
    case 'inbox-list':       return '/inbox';
    case 'settings':         return '/settings';
  }
}

export function pathToLayer(pathname: string): NavigationLayer | null {
  const parts = pathname.replace(/^\/+/, '').split('/');
  const [seg0, seg1] = parts;

  if (!seg0) return null;

  if (seg0 === 'notes') {
    if (seg1 && NOTE_GROUPS.has(seg1)) {
      return {
        view: 'notes-list',
        group: seg1 as 'all' | 'today' | 'todo' | 'pinned' | 'locked' | 'trash',
      };
    }
    return { view: 'notes-list', group: 'all' };
  }

  if (seg0 === 'note' && seg1) return { view: 'document-detail', documentId: seg1 };
  if (seg0 === 'document' && seg1) return { view: 'document-detail', documentId: seg1 };

  if (seg0 === 'tasks') {
    if (seg1 && TASK_FILTERS.has(seg1)) {
      return { view: 'tasks-list', filter: seg1 as TaskListFilter };
    }
    return { view: 'tasks-list' };
  }

  if (seg0 === 'task' && seg1) return { view: 'task-detail', taskId: seg1 };
  if (seg0 === 'strategy' && seg1) return { view: 'strategy-detail', strategyId: seg1 };
  if (seg0 === 'settings') return { view: 'settings' };

  return null;
}
