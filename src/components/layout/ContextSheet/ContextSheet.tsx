import { useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useQuery, usePowerSync } from '@powersync/react';
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
import type { ItemRow } from '@/lib/db';
import { insertItem, patchItem } from '@/lib/db';
import { ProjectDetailSheet } from '@/features/projects/ProjectDetailSheet/ProjectDetailSheet';
import { AreaDetailSheet } from '@/features/projects/AreaDetailSheet/AreaDetailSheet';
import { SourceDetailSheet } from '@/features/sources/SourceDetailSheet/SourceDetailSheet';
import { nowIso } from '@/lib/time';
import styles from './ContextSheet.module.css';

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
  const db = usePowerSync();

  const { data: projects } = useQuery<ItemRow>(
    "SELECT id, title, is_trashed, item_status, parent_id FROM items WHERE type = 'project' AND is_trashed = 0 ORDER BY title ASC, id ASC"
  );
  const { data: areas } = useQuery<ItemRow>(
    "SELECT id, title, is_trashed FROM items WHERE type = 'area' AND is_trashed = 0 ORDER BY title ASC, id ASC"
  );
  const { data: tasks } = useQuery<ItemRow>(
    "SELECT id, title, is_trashed, item_status, is_next, is_someday, is_waiting, completed, parent_id FROM items WHERE type = 'task' AND is_trashed = 0"
  );
  const { data: sources } = useQuery<ItemRow>(
    "SELECT id, title, url, content_type, read_status, updated_at, is_trashed FROM items WHERE type = 'source' AND is_trashed = 0 ORDER BY updated_at DESC"
  );

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [createMode, setCreateMode] = useState<'project' | 'area' | null>(null);
  const [createTitle, setCreateTitle] = useState('');
  const submittingRef = useRef(false);

  // Group projects: ungrouped first, then by area
  const { ungroupedProjects, projectsByArea } = useMemo(() => {
    const areaIds = new Set(areas.map((a) => a.id));
    const ungrouped = projects.filter((p) => !p.parent_id || !areaIds.has(p.parent_id));
    const byArea = new Map<string, ItemRow[]>();
    for (const area of areas) {
      byArea.set(area.id, []);
    }
    for (const project of projects) {
      if (project.parent_id && byArea.has(project.parent_id)) {
        byArea.get(project.parent_id)!.push(project);
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
      await insertItem(db, {
        id: uuidv4(),
        type: 'project',
        parent_id: null,
        title: trimmed,
        item_status: 'backlog',
        is_pinned: false,
        completed: false,
        is_next: false,
        is_someday: false,
        is_waiting: false,
        processed: false,
        created_at: timestamp,
        updated_at: timestamp,
      });
    } else {
      await insertItem(db, {
        id: uuidv4(),
        type: 'area',
        parent_id: null,
        title: trimmed,
        item_status: 'active',
        is_pinned: false,
        completed: false,
        is_next: false,
        is_someday: false,
        is_waiting: false,
        processed: false,
        created_at: timestamp,
        updated_at: timestamp,
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
      content: string;
      item_status: string;
      startDate: string | null;
      dueDate: string | null;
      parentId: string | null;
    }
  ) => {
    if (!db) return;
    const trimmed = updates.title.trim();
    if (!trimmed) return;
    await patchItem(db, projectId, {
      title: trimmed,
      content: updates.content.trim() || null,
      item_status: updates.item_status,
      start_date: updates.startDate,
      due_date: updates.dueDate,
      updated_at: nowIso(),
    });
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!db) return;
    const timestamp = nowIso();
    await patchItem(db, projectId, { is_trashed: true, trashed_at: timestamp, updated_at: timestamp });
  };

  const handleToggleTaskComplete = async (taskId: string, nextValue: boolean) => {
    if (!db) return;
    await patchItem(db, taskId, { completed: nextValue, updated_at: nowIso() });
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
    const trimmed = updates.title.trim();
    if (!trimmed) return;
    await patchItem(db, taskId, {
      title: trimmed,
      content: updates.description.trim() || null,
      tags: updates.tags,
      is_next: updates.isNext,
      start_date: updates.startDate,
      due_date: updates.dueDate,
      is_someday: updates.isSomeday,
      is_waiting: updates.isWaiting,
      updated_at: nowIso(),
    });
    // parent_id is not in ItemPatch — update directly
    await db.execute('UPDATE items SET parent_id = ? WHERE id = ?', [updates.parentId, taskId]);
    // waiting_note is not in ItemPatch — update directly
    await db.execute('UPDATE items SET waiting_note = ? WHERE id = ?', [updates.waitingNote, taskId]);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!db) return;
    const timestamp = nowIso();
    await patchItem(db, taskId, { is_trashed: true, trashed_at: timestamp, updated_at: timestamp });
  };

  const handleCreateTask = async (projectId: string, title: string) => {
    if (!db) return;
    const trimmed = title.trim();
    if (!trimmed) return;
    const timestamp = nowIso();
    await insertItem(db, {
      id: uuidv4(),
      type: 'task',
      parent_id: projectId,
      title: trimmed,
      tags: null,
      is_pinned: false,
      item_status: 'backlog',
      completed: false,
      is_next: false,
      is_someday: false,
      is_waiting: false,
      processed: false,
      created_at: timestamp,
      updated_at: timestamp,
    });
  };

  const handleSaveArea = async (areaId: string, title: string) => {
    if (!db) return;
    await patchItem(db, areaId, { title: title.trim(), updated_at: nowIso() });
  };

  const handleDeleteArea = async (areaId: string) => {
    if (!db) return;
    const timestamp = nowIso();
    await patchItem(db, areaId, { is_trashed: true, trashed_at: timestamp, updated_at: timestamp });
  };

  const handleSaveSource = async (updates: Partial<ItemRow>) => {
    if (!db || !selectedSourceId) return;
    // Build a patch from the updates object — only pass known patch fields
    const { title, content, subtype, url } = updates;
    await db.execute(
      'UPDATE items SET title = ?, content = ?, subtype = ?, url = ?, updated_at = ? WHERE id = ?',
      [title ?? null, content ?? null, subtype ?? null, url ?? null, nowIso(), selectedSourceId]
    );
  };

  const handleDeleteSource = async () => {
    if (!db || !selectedSourceId) return;
    const timestamp = nowIso();
    await patchItem(db, selectedSourceId, { is_trashed: true, trashed_at: timestamp, updated_at: timestamp });
    setSelectedSourceId(null);
  };

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
