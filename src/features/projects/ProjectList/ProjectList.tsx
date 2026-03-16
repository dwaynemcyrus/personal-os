
import { useMemo, useState, type FormEvent } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import type { ItemRow } from '@/lib/db';
import { insertItem, patchItem } from '@/lib/db';
import { nowIso } from '@/lib/time';
import { ProjectDetailSheet } from '@/features/projects/ProjectDetailSheet/ProjectDetailSheet';
import styles from './ProjectList.module.css';

type ProjectFilter = 'all' | 'backlog' | 'active' | 'someday' | 'archived';

const getTime = (value: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.getTime();
};

const sortProjects = (a: ItemRow, b: ItemRow) => {
  const aDue = getTime(a.due_date ?? null);
  const bDue = getTime(b.due_date ?? null);
  if (aDue !== null && bDue !== null && aDue !== bDue) return aDue - bDue;
  if (aDue !== null && bDue === null) return -1;
  if (aDue === null && bDue !== null) return 1;
  const aUpdated = getTime(a.updated_at) ?? 0;
  const bUpdated = getTime(b.updated_at) ?? 0;
  if (aUpdated !== bUpdated) return bUpdated - aUpdated;
  return a.id.localeCompare(b.id);
};

export function ProjectList() {
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async (): Promise<ItemRow[]> => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('type', 'project')
        .eq('is_trashed', false)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ItemRow[];
    },
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: async (): Promise<ItemRow[]> => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('type', 'task')
        .eq('is_trashed', false)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ItemRow[];
    },
    staleTime: 30_000,
  });

  const [filter, setFilter] = useState<ProjectFilter>('all');
  const [titleInput, setTitleInput] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const invalidateProjects = () => {
    queryClient.invalidateQueries({ queryKey: ['projects'] });
  };
  const invalidateTasks = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['tasks', 'counts-raw'] });
  };

  const activeTaskCounts = useMemo(() => {
    const counts = new Map<string, number>();
    tasks.forEach((task) => {
      if (task.completed) return;
      if (!task.parent_id) return;
      counts.set(task.parent_id, (counts.get(task.parent_id) ?? 0) + 1);
    });
    return counts;
  }, [tasks]);

  const sortedProjects = useMemo(() => [...projects].sort(sortProjects), [projects]);
  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );
  const filteredProjects = useMemo(() => {
    if (filter === 'all') return sortedProjects;
    return sortedProjects.filter((project) => project.item_status === filter);
  }, [filter, sortedProjects]);

  const createProject = async () => {
    const trimmed = titleInput.trim();
    if (!trimmed) return;
    const timestamp = nowIso();
    await insertItem({
      id: uuidv4(),
      type: 'project',
      parent_id: null,
      title: trimmed,
      content: null,
      item_status: 'backlog',
      is_pinned: false,
      completed: false,
      is_next: false,
      is_someday: false,
      is_waiting: false,
      processed: false,
      start_date: null,
      due_date: null,
      created_at: timestamp,
      updated_at: timestamp,
    });
    invalidateProjects();
    setTitleInput('');
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await createProject();
  };

  const handleDetailOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setSelectedProjectId(null);
  };

  const handleSaveProject = async (
    projectId: string,
    updates: {
      title: string;
      content: string;
      item_status: 'backlog' | 'active' | 'someday' | 'archived';
      startDate: string | null;
      dueDate: string | null;
      parentId: string | null;
    }
  ) => {
    const trimmedTitle = updates.title.trim();
    if (!trimmedTitle) return;
    await patchItem(projectId, {
      title: trimmedTitle,
      content: updates.content.trim() || null,
      item_status: updates.item_status,
      start_date: updates.startDate,
      due_date: updates.dueDate,
      parent_id: updates.parentId,
      updated_at: nowIso(),
    });
    invalidateProjects();
  };

  const handleDeleteProject = async (projectId: string) => {
    const timestamp = nowIso();
    await patchItem(projectId, { is_trashed: true, trashed_at: timestamp, updated_at: timestamp });
    invalidateProjects();
  };

  const handleToggleTaskComplete = async (taskId: string, nextValue: boolean) => {
    await patchItem(taskId, { completed: nextValue, updated_at: nowIso() });
    invalidateTasks();
  };

  const handleSaveTask = async (
    taskId: string,
    updates: {
      title: string;
      description: string;
      parentId: string | null;
      isNext: boolean;
      startDate: string | null;
      dueDate: string | null;
      isSomeday: boolean;
      isWaiting: boolean;
      waitingNote: string | null;
      tags: string[];
    }
  ) => {
    const trimmedTitle = updates.title.trim();
    if (!trimmedTitle) return;
    await patchItem(taskId, {
      title: trimmedTitle,
      content: updates.description.trim() || null,
      parent_id: updates.parentId,
      is_next: updates.isNext,
      start_date: updates.startDate,
      due_date: updates.dueDate,
      is_someday: updates.isSomeday,
      is_waiting: updates.isWaiting,
      waiting_note: updates.waitingNote,
      tags: updates.tags,
      updated_at: nowIso(),
    });
    invalidateTasks();
  };

  const handleDeleteTask = async (taskId: string) => {
    const timestamp = nowIso();
    await patchItem(taskId, { is_trashed: true, trashed_at: timestamp, updated_at: timestamp });
    invalidateTasks();
  };

  const handleCreateTask = async (projectId: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const timestamp = nowIso();
    await insertItem({
      id: uuidv4(),
      type: 'task',
      parent_id: projectId,
      title: trimmed,
      content: null,
      item_status: 'backlog',
      is_pinned: false,
      completed: false,
      is_someday: false,
      is_next: false,
      is_waiting: false,
      processed: false,
      start_date: null,
      due_date: null,
      created_at: timestamp,
      updated_at: timestamp,
    });
    invalidateTasks();
  };

  return (
    <div className={styles.projects}>
      <form className={styles.composer} onSubmit={onSubmit}>
        <input
          className={styles.composerInput}
          type="text"
          placeholder="Add a project"
          value={titleInput}
          onChange={(event) => setTitleInput(event.target.value)}
        />
        <button className={styles.composerButton} type="submit">
          Add
        </button>
      </form>

      <div className={styles.filters} role="tablist" aria-label="Project filters">
        {(['all', 'active', 'backlog', 'someday', 'archived'] as const).map(
          (value) => (
            <button
              key={value}
              type="button"
              className={styles.filterButton}
              data-active={filter === value}
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {value}
            </button>
          )
        )}
      </div>

      {filteredProjects.length === 0 ? (
        <p className={styles.empty}>No projects yet.</p>
      ) : (
        <div className={styles.list}>
          {filteredProjects.map((project) => (
            <button
              key={project.id}
              type="button"
              className={styles.item}
              onClick={() => setSelectedProjectId(project.id)}
            >
              <div className={styles.itemTitle}>{project.title}</div>
              <div className={styles.itemMeta}>
                <span className={styles.itemStatus}>{project.item_status}</span>
                <span>{activeTaskCounts.get(project.id) ?? 0} open tasks</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedProject ? (
        <ProjectDetailSheet
          key={selectedProject.id}
          open={Boolean(selectedProject)}
          onOpenChange={handleDetailOpenChange}
          project={selectedProject}
          projects={projects}
          tasks={tasks}
          onSave={handleSaveProject}
          onDelete={handleDeleteProject}
          onToggleTaskComplete={handleToggleTaskComplete}
          onSaveTask={handleSaveTask}
          onDeleteTask={handleDeleteTask}
          onCreateTask={handleCreateTask}
        />
      ) : null}
    </div>
  );
}
