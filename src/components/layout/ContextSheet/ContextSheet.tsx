import { useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { showToast } from '@/components/ui/Toast';
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
} from '@/components/ui/Dropdown';
import { useNavigationActions } from '@/components/providers';
import { useNoteGroupCounts } from '@/features/notes/hooks/useNoteGroupCounts';
import type { NoteGroup } from '@/features/notes/hooks/useGroupedNotes';
import { useTaskBucketCounts } from '@/features/tasks/hooks/useTaskBucketCounts';
import type { TaskListFilter } from '@/features/tasks/taskBuckets';
import { useDatabase } from '@/hooks/useDatabase';
import type { AreaDocument, ProjectDocument, SourceDocument, TaskDocument } from '@/lib/db';
import { ProjectDetailSheet } from '@/features/projects/ProjectDetailSheet/ProjectDetailSheet';
import { AreaDetailSheet } from '@/features/projects/AreaDetailSheet/AreaDetailSheet';
import { SourceDetailSheet } from '@/features/sources/SourceDetailSheet/SourceDetailSheet';
import styles from './ContextSheet.module.css';

const nowIso = () => new Date().toISOString();

type ContextSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type Tab = 'notes' | 'tasks' | 'plans' | 'sources';

type NoteGroupRow = {
  id: NoteGroup;
  label: string;
  comingSoon?: boolean;
};

type TaskGroupRow = {
  id: TaskListFilter;
  label: string;
};

const NOTE_GROUPS: NoteGroupRow[] = [
  { id: 'all', label: 'Notes' },
  { id: 'todo', label: 'Todo' },
  { id: 'today', label: 'Today' },
  { id: 'pinned', label: 'Pinned' },
  { id: 'locked', label: 'Locked', comingSoon: true },
  { id: 'trash', label: 'Trash' },
];

const TASK_GROUPS: TaskGroupRow[] = [
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'backlog', label: 'Backlog' },
  { id: 'someday', label: 'Someday' },
  { id: 'logbook', label: 'Logbook' },
  { id: 'trash', label: 'Trash' },
];

export function ContextSheet({ open, onOpenChange }: ContextSheetProps) {
  const [activeTab, setActiveTab] = useState<Tab>('tasks');
  const { pushLayer } = useNavigationActions();
  const noteCounts = useNoteGroupCounts();
  const taskCounts = useTaskBucketCounts();
  const { db, isReady } = useDatabase();

  const [projects, setProjects] = useState<ProjectDocument[]>([]);
  const [areas, setAreas] = useState<AreaDocument[]>([]);
  const [tasks, setTasks] = useState<TaskDocument[]>([]);
  const [sources, setSources] = useState<SourceDocument[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [createMode, setCreateMode] = useState<'project' | 'area' | null>(null);
  const [createTitle, setCreateTitle] = useState('');
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!db || !isReady) return;

    const sub = db.projects
      .find({ selector: { is_trashed: false }, sort: [{ title: 'asc' }, { id: 'asc' }] })
      .$.subscribe((docs) => setProjects(docs.map((d) => d.toJSON())));

    return () => sub.unsubscribe();
  }, [db, isReady]);

  useEffect(() => {
    if (!db || !isReady) return;

    const sub = db.areas
      .find({ selector: { is_trashed: false }, sort: [{ title: 'asc' }, { id: 'asc' }] })
      .$.subscribe((docs) => setAreas(docs.map((d) => d.toJSON())));

    return () => sub.unsubscribe();
  }, [db, isReady]);

  useEffect(() => {
    if (!db || !isReady) return;

    const sub = db.tasks
      .find({ selector: { is_trashed: false } })
      .$.subscribe((docs) => setTasks(docs.map((d) => d.toJSON())));

    return () => sub.unsubscribe();
  }, [db, isReady]);

  useEffect(() => {
    if (!db || !isReady) return;

    const sub = db.sources
      .find({ selector: { is_trashed: false }, sort: [{ updated_at: 'desc' }] })
      .$.subscribe((docs) => setSources(docs.map((d) => d.toJSON() as SourceDocument)));

    return () => sub.unsubscribe();
  }, [db, isReady]);

  // Group projects: ungrouped first, then by area
  const { ungroupedProjects, projectsByArea } = useMemo(() => {
    const ungrouped = projects.filter((p) => !p.area_id);
    const byArea = new Map<string, ProjectDocument[]>();
    for (const area of areas) {
      byArea.set(area.id, []);
    }
    for (const project of projects) {
      if (project.area_id && byArea.has(project.area_id)) {
        byArea.get(project.area_id)!.push(project);
      }
    }
    return { ungroupedProjects: ungrouped, projectsByArea: byArea };
  }, [projects, areas]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  const selectedArea = useMemo(
    () => areas.find((a) => a.id === selectedAreaId) ?? null,
    [areas, selectedAreaId]
  );

  // --- Handlers ---

  const handleCreateSubmit = async () => {
    if (submittingRef.current || !createMode) return;
    submittingRef.current = true;
    const mode = createMode;
    const trimmed = createTitle.trim();
    setCreateMode(null);
    setCreateTitle('');
    submittingRef.current = false;
    if (!trimmed || !db) return;
    const timestamp = nowIso();
    if (mode === 'project') {
      await db.projects.insert({
        id: uuidv4(),
        title: trimmed,
        description: null,
        status: 'backlog',
        area_id: null,
        okr_id: null,
        start_date: null,
        due_date: null,
        created_at: timestamp,
        updated_at: timestamp,
        is_trashed: false,
        trashed_at: null,
      });
    } else {
      await db.areas.insert({
        id: uuidv4(),
        title: trimmed,
        created_at: timestamp,
        updated_at: timestamp,
        is_trashed: false,
        trashed_at: null,
      });
    }
  };

  const handleNoteGroupPress = (row: NoteGroupRow) => {
    if (row.comingSoon) {
      showToast(`${row.label} is coming soon`);
      return;
    }
    onOpenChange(false);
    pushLayer({ view: 'notes-list', group: row.id });
  };

  const handleTaskGroupPress = (row: TaskGroupRow) => {
    onOpenChange(false);
    pushLayer({ view: 'tasks-list', filter: row.id });
  };

  const handlePlansPress = () => {
    onOpenChange(false);
    pushLayer({ view: 'plans-list' });
  };

  const handleSaveProject = async (
    projectId: string,
    updates: {
      title: string;
      description: string;
      status: 'backlog' | 'next' | 'active' | 'hold';
      startDate: string | null;
      dueDate: string | null;
      areaId: string | null;
    }
  ) => {
    if (!db) return;
    const trimmed = updates.title.trim();
    if (!trimmed) return;
    const doc = await db.projects.findOne(projectId).exec();
    if (!doc) return;
    await doc.patch({
      title: trimmed,
      description: updates.description.trim() || null,
      status: updates.status,
      start_date: updates.startDate,
      due_date: updates.dueDate,
      area_id: updates.areaId,
      updated_at: nowIso(),
    });
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!db) return;
    const doc = await db.projects.findOne(projectId).exec();
    if (!doc) return;
    const timestamp = nowIso();
    await doc.patch({ is_trashed: true, trashed_at: timestamp, updated_at: timestamp });
  };

  const handleToggleTaskComplete = async (taskId: string, nextValue: boolean) => {
    if (!db) return;
    const doc = await db.tasks.findOne(taskId).exec();
    if (!doc) return;
    await doc.patch({ completed: nextValue, updated_at: nowIso() });
  };

  const handleSaveTask = async (
    taskId: string,
    updates: {
      title: string;
      description: string;
      projectId: string | null;
      areaId: string | null;
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
    const trimmed = updates.title.trim();
    if (!trimmed) return;
    const doc = await db.tasks.findOne(taskId).exec();
    if (!doc) return;
    await doc.patch({
      title: trimmed,
      description: updates.description.trim() || null,
      project_id: updates.projectId,
      area_id: updates.areaId,
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
    const doc = await db.tasks.findOne(taskId).exec();
    if (!doc) return;
    const timestamp = nowIso();
    await doc.patch({ is_trashed: true, trashed_at: timestamp, updated_at: timestamp });
  };

  const handleCreateTask = async (projectId: string, title: string) => {
    if (!db) return;
    const trimmed = title.trim();
    if (!trimmed) return;
    const timestamp = nowIso();
    await db.tasks.insert({
      id: uuidv4(),
      project_id: projectId,
      area_id: null,
      title: trimmed,
      description: null,
      completed: false,
      is_someday: false,
      is_next: false,
      is_waiting: false,
      waiting_note: null,
      waiting_started_at: null,
      start_date: null,
      due_date: null,
      tags: [],
      content: null,
      priority: null,
      depends_on: null,
      okr_id: null,
      created_at: timestamp,
      updated_at: timestamp,
      is_trashed: false,
      trashed_at: null,
    });
  };

  const handleSaveArea = async (areaId: string, title: string) => {
    if (!db) return;
    const doc = await db.areas.findOne(areaId).exec();
    if (!doc) return;
    await doc.patch({ title: title.trim(), updated_at: nowIso() });
  };

  const handleDeleteArea = async (areaId: string) => {
    if (!db) return;
    const doc = await db.areas.findOne(areaId).exec();
    if (!doc) return;
    const timestamp = nowIso();
    await doc.patch({ is_trashed: true, trashed_at: timestamp, updated_at: timestamp });
  };

  const handleSaveSource = async (updates: Partial<SourceDocument>) => {
    if (!db || !selectedSourceId) return;
    const doc = await db.sources.findOne(selectedSourceId).exec();
    if (!doc) return;
    await doc.patch({ ...updates, updated_at: nowIso() });
  };

  const handleDeleteSource = async () => {
    if (!db || !selectedSourceId) return;
    const doc = await db.sources.findOne(selectedSourceId).exec();
    if (!doc) return;
    const timestamp = nowIso();
    await doc.patch({ is_trashed: true, trashed_at: timestamp, updated_at: timestamp });
    setSelectedSourceId(null);
  };

  const selectedSource = useMemo(
    () => sources.find((s) => s.id === selectedSourceId) ?? null,
    [sources, selectedSourceId]
  );

  const sourcesByStatus = useMemo(() => {
    const inbox = sources.filter((s) => s.read_status === 'inbox');
    const reading = sources.filter((s) => s.read_status === 'reading');
    const read = sources.filter((s) => s.read_status === 'read');
    return { inbox, reading, read };
  }, [sources]);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" ariaLabel="Context" className={styles.sheet}>
          <div className={styles.content}>
            {activeTab === 'notes' && (
              <div className={styles.list}>
                {NOTE_GROUPS.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    className={`${styles.row} ${row.comingSoon ? styles.rowDisabled : ''}`}
                    onClick={() => handleNoteGroupPress(row)}
                  >
                    <span className={styles.rowLabel}>{row.label}</span>
                    {noteCounts[row.id] > 0 && !row.comingSoon ? (
                      <span className={styles.rowCount}>{noteCounts[row.id]}</span>
                    ) : null}
                    {row.comingSoon ? (
                      <span className={styles.rowSoon}>Soon</span>
                    ) : (
                      <span className={styles.rowCaret} aria-hidden="true">›</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className={styles.list}>
                {TASK_GROUPS.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    className={styles.row}
                    onClick={() => handleTaskGroupPress(row)}
                  >
                    <span className={styles.rowLabel}>{row.label}</span>
                    {taskCounts[row.id] > 0 ? (
                      <span className={styles.rowCount}>{taskCounts[row.id]}</span>
                    ) : null}
                    <span className={styles.rowCaret} aria-hidden="true">›</span>
                  </button>
                ))}

                <div className={styles.divider} />

                {createMode ? (
                  <div className={styles.createRow}>
                    <span className={styles.createLabel}>
                      {createMode === 'project' ? 'New Project' : 'New Area'}
                    </span>
                    <input
                      className={styles.createInput}
                      value={createTitle}
                      onChange={(e) => setCreateTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void handleCreateSubmit();
                        if (e.key === 'Escape') { setCreateMode(null); setCreateTitle(''); }
                      }}
                      onBlur={() => void handleCreateSubmit()}
                      placeholder={createMode === 'project' ? 'Project name…' : 'Area name…'}
                      // eslint-disable-next-line jsx-a11y/no-autofocus
                      autoFocus
                    />
                  </div>
                ) : (
                  <Dropdown>
                    <DropdownTrigger asChild>
                      <button type="button" className={styles.createButton}>
                        Create new…
                      </button>
                    </DropdownTrigger>
                    <DropdownContent align="start" sideOffset={4}>
                      <DropdownItem onSelect={() => { setCreateMode('project'); setCreateTitle(''); }}>
                        New Project
                      </DropdownItem>
                      <DropdownItem onSelect={() => { setCreateMode('area'); setCreateTitle(''); }}>
                        New Area
                      </DropdownItem>
                    </DropdownContent>
                  </Dropdown>
                )}

                {ungroupedProjects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    className={styles.row}
                    onClick={() => setSelectedProjectId(project.id)}
                  >
                    <span className={styles.rowLabel}>{project.title}</span>
                    <span className={styles.rowCaret} aria-hidden="true">›</span>
                  </button>
                ))}

                {areas.map((area) => (
                  <div key={area.id} className={styles.areaGroup}>
                    <button
                      type="button"
                      className={`${styles.row} ${styles.areaHeader}`}
                      onClick={() => setSelectedAreaId(area.id)}
                    >
                      <span className={styles.rowLabel}>{area.title}</span>
                      <span className={styles.rowCaret} aria-hidden="true">›</span>
                    </button>
                    {(projectsByArea.get(area.id) ?? []).map((project) => (
                      <button
                        key={project.id}
                        type="button"
                        className={`${styles.row} ${styles.nestedProject}`}
                        onClick={() => setSelectedProjectId(project.id)}
                      >
                        <span className={styles.rowLabel}>{project.title}</span>
                        <span className={styles.rowCaret} aria-hidden="true">›</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'plans' && (
              <div className={styles.list}>
                <button
                  type="button"
                  className={styles.row}
                  onClick={handlePlansPress}
                >
                  <span className={styles.rowLabel}>All Plans</span>
                  <span className={styles.rowCaret} aria-hidden="true">›</span>
                </button>
              </div>
            )}

            {activeTab === 'sources' && (
              <div className={styles.list}>
                {sources.length === 0 && (
                  <span className={styles.rowLabel} style={{ opacity: 0.5 }}>
                    No sources yet
                  </span>
                )}
                {sourcesByStatus.inbox.length > 0 && (
                  <>
                    <span className={styles.createLabel}>Inbox</span>
                    {sourcesByStatus.inbox.map((source) => (
                      <button
                        key={source.id}
                        type="button"
                        className={styles.row}
                        onClick={() => setSelectedSourceId(source.id)}
                      >
                        <span className={styles.rowLabel}>
                          {source.title || source.url}
                        </span>
                        <span className={styles.rowSoon}>{source.content_type}</span>
                        <span className={styles.rowCaret} aria-hidden="true">›</span>
                      </button>
                    ))}
                  </>
                )}
                {sourcesByStatus.reading.length > 0 && (
                  <>
                    <span className={styles.createLabel}>Reading</span>
                    {sourcesByStatus.reading.map((source) => (
                      <button
                        key={source.id}
                        type="button"
                        className={styles.row}
                        onClick={() => setSelectedSourceId(source.id)}
                      >
                        <span className={styles.rowLabel}>
                          {source.title || source.url}
                        </span>
                        <span className={styles.rowSoon}>{source.content_type}</span>
                        <span className={styles.rowCaret} aria-hidden="true">›</span>
                      </button>
                    ))}
                  </>
                )}
                {sourcesByStatus.read.length > 0 && (
                  <>
                    <span className={styles.createLabel}>Read</span>
                    {sourcesByStatus.read.map((source) => (
                      <button
                        key={source.id}
                        type="button"
                        className={styles.row}
                        onClick={() => setSelectedSourceId(source.id)}
                      >
                        <span className={styles.rowLabel}>
                          {source.title || source.url}
                        </span>
                        <span className={styles.rowSoon}>{source.content_type}</span>
                        <span className={styles.rowCaret} aria-hidden="true">›</span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          <div className={styles.tabs}>
            {(['tasks', 'plans', 'notes', 'sources'] as Tab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {selectedProject ? (
        <ProjectDetailSheet
          key={selectedProject.id}
          open={Boolean(selectedProject)}
          onOpenChange={(next) => { if (!next) setSelectedProjectId(null); }}
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

      {selectedArea ? (
        <AreaDetailSheet
          key={selectedArea.id}
          open={Boolean(selectedArea)}
          onOpenChange={(next) => { if (!next) setSelectedAreaId(null); }}
          area={selectedArea}
          onSave={handleSaveArea}
          onDelete={handleDeleteArea}
        />
      ) : null}

      {selectedSource ? (
        <SourceDetailSheet
          key={selectedSource.id}
          open={Boolean(selectedSource)}
          onOpenChange={(next) => { if (!next) setSelectedSourceId(null); }}
          source={selectedSource}
          onSave={handleSaveSource}
          onDelete={handleDeleteSource}
        />
      ) : null}
    </>
  );
}
