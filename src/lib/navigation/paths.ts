import type { NavigationLayer } from './types';
import type { TaskListFilter } from '@/features/tasks/taskBuckets';

const NOTE_GROUPS = new Set(['all', 'today', 'todo', 'pinned', 'locked', 'trash']);

const TASK_FILTERS = new Set<string>([
  'backlog', 'next', 'today', 'someday', 'waiting', 'logbook',
]);

export function layerToPath(layer: NavigationLayer): string {
  switch (layer.view) {
    case 'notes-list':  return `/notes/${layer.group}`;
    case 'note-detail': return `/note/${layer.noteId}`;
    case 'tasks-list':  return layer.filter ? `/tasks/${layer.filter}` : '/tasks';
    case 'task-detail': return `/task/${layer.taskId}`;
    case 'plans-list':  return '/plans';
    case 'plan-detail': return `/plan/${layer.planId}`;
    case 'settings':    return '/settings';
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

  if (seg0 === 'note' && seg1) return { view: 'note-detail', noteId: seg1 };

  if (seg0 === 'tasks') {
    if (seg1 && TASK_FILTERS.has(seg1)) {
      return { view: 'tasks-list', filter: seg1 as TaskListFilter };
    }
    return { view: 'tasks-list' };
  }

  if (seg0 === 'task' && seg1) return { view: 'task-detail', taskId: seg1 };
  if (seg0 === 'plans') return { view: 'plans-list' };
  if (seg0 === 'plan' && seg1) return { view: 'plan-detail', planId: seg1 };
  if (seg0 === 'settings') return { view: 'settings' };

  return null;
}
