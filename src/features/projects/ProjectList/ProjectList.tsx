
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useDatabase } from '@/hooks/useDatabase';
import type { ItemDocument } from '@/lib/db';
import { ProjectDetailSheet } from '@/features/projects/ProjectDetailSheet/ProjectDetailSheet';
import styles from './ProjectList.module.css';

type ProjectFilter = 'all' | 'backlog' | 'active' | 'someday' | 'archived';

const nowIso = () => new Date().toISOString();

const getTime = (value: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.getTime();
};

const sortProjects = (a: ItemDocument, b: ItemDocument) => {
  const aDue = getTime(a.due_date ?? null);
  const bDue = getTime(b.due_date ?? null);

  if (aDue !== null && bDue !== null && aDue !== bDue) {
    return aDue - bDue;
  }
  if (aDue !== null && bDue === null) return -1;
  if (aDue === null && bDue !== null) return 1;

  const aUpdated = getTime(a.updated_at) ?? 0;
  const bUpdated = getTime(b.updated_at) ?? 0;
  if (aUpdated !== bUpdated) {
    return bUpdated - aUpdated;
  }

  return a.id.localeCompare(b.id);
};

export function ProjectList() {
  const { db, isReady } = useDatabase();
  const [projects, setProjects] = useState<ItemDocument[]>([]);
  const [tasks, setTasks] = useState<ItemDocument[]>([]);
  const [filter, setFilter] = useState<ProjectFilter>('all');
  const [titleInput, setTitleInput] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (!db || !isReady) return;

    const subscription = db.items
      .find({
        selector: { type: 'project', is_trashed: false },
        sort: [{ updated_at: 'desc' }, { id: 'asc' }],
      })
      .$.subscribe((docs) => {
        setProjects(docs.map((doc) => doc.toJSON() as ItemDocument));
      });

    return () => subscription.unsubscribe();
  }, [db, isReady]);

  useEffect(() => {
    if (!db || !isReady) return;

    const subscription = db.items
      .find({
        selector: { type: 'task', is_trashed: false },
        sort: [{ updated_at: 'desc' }, { id: 'asc' }],
      })
      .$.subscribe((docs) => {
        setTasks(docs.map((doc) => doc.toJSON() as ItemDocument));
      });

    return () => subscription.unsubscribe();
  }, [db, isReady]);

  const activeTaskCounts = useMemo(() => {
    const counts = new Map<string, number>();
    tasks.forEach((task) => {
      if (task.completed) return;
      if (!task.parent_id) return;
      counts.set(task.parent_id, (counts.get(task.parent_id) ?? 0) + 1);
    });
    return counts;
  }, [tasks]);

  const sortedProjects = useMemo(
    () => [...projects].sort(sortProjects),
    [projects]
  );

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  const filteredProjects = useMemo(() => {
    if (filter === 'all') return sortedProjects;
    return sortedProjects.filter((project) => project.item_status === filter);
  }, [filter, sortedProjects]);

  const createProject = async () => {
    if (!db) return;
    const trimmed = titleInput.trim();
    if (!trimmed) return;

    const timestamp = nowIso();
    await db.items.insert({
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
      is_trashed: false,
      trashed_at: null,
    });
    setTitleInput('');
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await createProject();
  };

  const handleOpenProject = (projectId: string) => {
    setSelectedProjectId(projectId);
  };

  const handleDetailOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedProjectId(null);
    }
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
    if (!db) return;
    const trimmedTitle = updates.title.trim();
    if (!trimmedTitle) return;
    const doc = await db.items.findOne(projectId).exec();
    if (!doc) return;
    const timestamp = nowIso();
    await doc.patch({
      title: trimmedTitle,
      content: updates.content.trim() || null,
      item_status: updates.item_status,
      start_date: updates.startDate,
      due_date: updates.dueDate,
      parent_id: updates.parentId,
      updated_at: timestamp,
    });
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!db) return;
    const doc = await db.items.findOne(projectId).exec();
    if (!doc) return;
    const timestamp = nowIso();
    await doc.patch({
      is_trashed: true,
      trashed_at: timestamp,
      updated_at: timestamp,
    });
  };

  const handleToggleTaskComplete = async (taskId: string, nextValue: boolean) => {
    if (!db) return;
    const doc = await db.items.findOne(taskId).exec();
    if (!doc) return;
    const timestamp = nowIso();
    await doc.patch({
      completed: nextValue,
      updated_at: timestamp,
    });
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
    if (!db) return;
    const trimmedTitle = updates.title.trim();
    if (!trimmedTitle) return;
    const doc = await db.items.findOne(taskId).exec();
    if (!doc) return;
    await doc.patch({
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
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!db) return;
    const doc = await db.items.findOne(taskId).exec();
    if (!doc) return;
    const timestamp = nowIso();
    await doc.patch({
      is_trashed: true,
      trashed_at: timestamp,
      updated_at: timestamp,
    });
  };

  const handleCreateTask = async (projectId: string, title: string) => {
    if (!db) return;
    const trimmed = title.trim();
    if (!trimmed) return;
    const timestamp = nowIso();
    await db.items.insert({
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
      waiting_note: null,
      waiting_started_at: null,
      start_date: null,
      due_date: null,
      tags: [],
      priority: null,
      depends_on: null,
      processed: false,
      created_at: timestamp,
      updated_at: timestamp,
      is_trashed: false,
      trashed_at: null,
    });
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
              onClick={() => handleOpenProject(project.id)}
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
