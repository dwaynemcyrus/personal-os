'use client';

import { useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useDatabase } from '@/hooks/useDatabase';
import {
  HabitCompletionDocument,
  HabitDocument,
  NoteDocument,
  ProjectDocument,
  SyncTestDocument,
  TaskDocument,
  TimeEntryDocument,
} from '@/lib/db';
import styles from './page.module.css';

const nowIso = () => new Date().toISOString();

const todayDate = () => new Date().toISOString().slice(0, 10);

const triggerHaptic = () => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(10);
  }
};

const toInputDateTime = (iso: string | null) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const fromInputDateTime = (value: string) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const formatDate = (iso: string | null) => {
  if (!iso) return '-';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
};

export default function DevValidationPage() {
  const { db, isReady } = useDatabase();

  const [syncTests, setSyncTests] = useState<SyncTestDocument[]>([]);
  const [projects, setProjects] = useState<ProjectDocument[]>([]);
  const [tasks, setTasks] = useState<TaskDocument[]>([]);
  const [notes, setNotes] = useState<NoteDocument[]>([]);
  const [habits, setHabits] = useState<HabitDocument[]>([]);
  const [habitCompletions, setHabitCompletions] = useState<
    HabitCompletionDocument[]
  >([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntryDocument[]>([]);

  const projectMap = useMemo(
    () => new Map(projects.map((project) => [project.id, project.title])),
    [projects]
  );
  const habitMap = useMemo(
    () => new Map(habits.map((habit) => [habit.id, habit.title])),
    [habits]
  );
  const taskMap = useMemo(
    () => new Map(tasks.map((task) => [task.id, task.title])),
    [tasks]
  );

  useEffect(() => {
    if (!isReady || !db) return;

    const subscriptions = [
      db.sync_test
        .find({
          selector: { is_trashed: false },
          sort: [{ updated_at: 'desc' }, { id: 'asc' }],
        })
        .$.subscribe((docs) => setSyncTests(docs.map((doc) => doc.toJSON()))),
      db.projects
        .find({
          selector: { is_trashed: false },
          sort: [{ updated_at: 'desc' }, { id: 'asc' }],
        })
        .$.subscribe((docs) => setProjects(docs.map((doc) => doc.toJSON()))),
      db.tasks
        .find({
          selector: { is_trashed: false },
          sort: [{ updated_at: 'desc' }, { id: 'asc' }],
        })
        .$.subscribe((docs) => setTasks(docs.map((doc) => doc.toJSON()))),
      db.notes
        .find({
          selector: { is_trashed: false },
          sort: [{ updated_at: 'desc' }, { id: 'asc' }],
        })
        .$.subscribe((docs) => setNotes(docs.map((doc) => doc.toJSON()))),
      db.habits
        .find({
          selector: { is_trashed: false },
          sort: [{ updated_at: 'desc' }, { id: 'asc' }],
        })
        .$.subscribe((docs) => setHabits(docs.map((doc) => doc.toJSON()))),
      db.habit_completions
        .find({
          selector: { is_trashed: false },
          sort: [{ updated_at: 'desc' }, { id: 'asc' }],
        })
        .$.subscribe((docs) =>
          setHabitCompletions(docs.map((doc) => doc.toJSON()))
        ),
      db.time_entries
        .find({
          selector: { is_trashed: false },
          sort: [{ updated_at: 'desc' }, { id: 'asc' }],
        })
        .$.subscribe((docs) => setTimeEntries(docs.map((doc) => doc.toJSON()))),
    ];

    return () => {
      subscriptions.forEach((subscription) => subscription.unsubscribe());
    };
  }, [db, isReady]);

  const [syncContent, setSyncContent] = useState('');
  const [syncEditingId, setSyncEditingId] = useState<string | null>(null);

  const saveSyncTest = async () => {
    if (!db) return;
    const trimmed = syncContent.trim();
    if (!trimmed) return;

    const timestamp = nowIso();
    if (syncEditingId) {
      const doc = await db.sync_test.findOne(syncEditingId).exec();
      if (!doc) return;
      await doc.patch({ content: trimmed, updated_at: timestamp });
    } else {
      await db.sync_test.insert({
        id: uuidv4(),
        content: trimmed,
        created_at: timestamp,
        updated_at: timestamp,
        is_trashed: false,
        trashed_at: null,
      });
    }

    triggerHaptic();
    setSyncContent('');
    setSyncEditingId(null);
  };

  const deleteSyncTest = async (id: string) => {
    if (!db) return;
    const doc = await db.sync_test.findOne(id).exec();
    if (!doc) return;
    const timestamp = nowIso();
    await doc.patch({ is_trashed: true, trashed_at: timestamp, updated_at: timestamp });
    triggerHaptic();
  };

  const startEditSyncTest = (item: SyncTestDocument) => {
    setSyncEditingId(item.id);
    setSyncContent(item.content);
  };

  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectEditingId, setProjectEditingId] = useState<string | null>(null);

  const saveProject = async () => {
    if (!db) return;
    const trimmedTitle = projectTitle.trim();
    if (!trimmedTitle) return;
    const description = projectDescription.trim() || null;
    const timestamp = nowIso();

    if (projectEditingId) {
      const doc = await db.projects.findOne(projectEditingId).exec();
      if (!doc) return;
      await doc.patch({
        title: trimmedTitle,
        description,
        updated_at: timestamp,
      });
    } else {
      await db.projects.insert({
        id: uuidv4(),
        title: trimmedTitle,
        description,
        created_at: timestamp,
        updated_at: timestamp,
        is_trashed: false,
        trashed_at: null,
      });
    }

    triggerHaptic();
    setProjectTitle('');
    setProjectDescription('');
    setProjectEditingId(null);
  };

  const deleteProject = async (id: string) => {
    if (!db) return;
    const doc = await db.projects.findOne(id).exec();
    if (!doc) return;
    const timestamp = nowIso();
    await doc.patch({ is_trashed: true, trashed_at: timestamp, updated_at: timestamp });
    triggerHaptic();
  };

  const startEditProject = (item: ProjectDocument) => {
    setProjectEditingId(item.id);
    setProjectTitle(item.title);
    setProjectDescription(item.description ?? '');
  };

  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskProjectId, setTaskProjectId] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskCompleted, setTaskCompleted] = useState(false);
  const [taskEditingId, setTaskEditingId] = useState<string | null>(null);

  const saveTask = async () => {
    if (!db) return;
    const trimmedTitle = taskTitle.trim();
    if (!trimmedTitle) return;
    const description = taskDescription.trim() || null;
    const projectId = taskProjectId || null;
    const dueDate = fromInputDateTime(taskDueDate);
    const timestamp = nowIso();

    if (taskEditingId) {
      const doc = await db.tasks.findOne(taskEditingId).exec();
      if (!doc) return;
      await doc.patch({
        title: trimmedTitle,
        description,
        project_id: projectId,
        completed: taskCompleted,
        due_date: dueDate,
        updated_at: timestamp,
      });
    } else {
      await db.tasks.insert({
        id: uuidv4(),
        project_id: projectId,
        title: trimmedTitle,
        description,
        completed: taskCompleted,
        due_date: dueDate,
        created_at: timestamp,
        updated_at: timestamp,
        is_trashed: false,
        trashed_at: null,
      });
    }

    triggerHaptic();
    setTaskTitle('');
    setTaskDescription('');
    setTaskProjectId('');
    setTaskDueDate('');
    setTaskCompleted(false);
    setTaskEditingId(null);
  };

  const deleteTask = async (id: string) => {
    if (!db) return;
    const doc = await db.tasks.findOne(id).exec();
    if (!doc) return;
    const timestamp = nowIso();
    await doc.patch({ is_trashed: true, trashed_at: timestamp, updated_at: timestamp });
    triggerHaptic();
  };

  const startEditTask = (item: TaskDocument) => {
    setTaskEditingId(item.id);
    setTaskTitle(item.title);
    setTaskDescription(item.description ?? '');
    setTaskProjectId(item.project_id ?? '');
    setTaskDueDate(toInputDateTime(item.due_date));
    setTaskCompleted(item.completed);
  };

  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteEditingId, setNoteEditingId] = useState<string | null>(null);

  const saveNote = async () => {
    if (!db) return;
    const trimmedTitle = noteTitle.trim();
    if (!trimmedTitle) return;
    const content = noteContent.trim() || null;
    const timestamp = nowIso();

    if (noteEditingId) {
      const doc = await db.notes.findOne(noteEditingId).exec();
      if (!doc) return;
      await doc.patch({
        title: trimmedTitle,
        content,
        updated_at: timestamp,
      });
    } else {
      await db.notes.insert({
        id: uuidv4(),
        title: trimmedTitle,
        content,
        created_at: timestamp,
        updated_at: timestamp,
        is_trashed: false,
        trashed_at: null,
      });
    }

    triggerHaptic();
    setNoteTitle('');
    setNoteContent('');
    setNoteEditingId(null);
  };

  const deleteNote = async (id: string) => {
    if (!db) return;
    const doc = await db.notes.findOne(id).exec();
    if (!doc) return;
    const timestamp = nowIso();
    await doc.patch({ is_trashed: true, trashed_at: timestamp, updated_at: timestamp });
    triggerHaptic();
  };

  const startEditNote = (item: NoteDocument) => {
    setNoteEditingId(item.id);
    setNoteTitle(item.title);
    setNoteContent(item.content ?? '');
  };

  const [habitTitle, setHabitTitle] = useState('');
  const [habitDescription, setHabitDescription] = useState('');
  const [habitEditingId, setHabitEditingId] = useState<string | null>(null);

  const saveHabit = async () => {
    if (!db) return;
    const trimmedTitle = habitTitle.trim();
    if (!trimmedTitle) return;
    const description = habitDescription.trim() || null;
    const timestamp = nowIso();

    if (habitEditingId) {
      const doc = await db.habits.findOne(habitEditingId).exec();
      if (!doc) return;
      await doc.patch({
        title: trimmedTitle,
        description,
        updated_at: timestamp,
      });
    } else {
      await db.habits.insert({
        id: uuidv4(),
        title: trimmedTitle,
        description,
        created_at: timestamp,
        updated_at: timestamp,
        is_trashed: false,
        trashed_at: null,
      });
    }

    triggerHaptic();
    setHabitTitle('');
    setHabitDescription('');
    setHabitEditingId(null);
  };

  const deleteHabit = async (id: string) => {
    if (!db) return;
    const doc = await db.habits.findOne(id).exec();
    if (!doc) return;
    const timestamp = nowIso();
    await doc.patch({ is_trashed: true, trashed_at: timestamp, updated_at: timestamp });
    triggerHaptic();
  };

  const startEditHabit = (item: HabitDocument) => {
    setHabitEditingId(item.id);
    setHabitTitle(item.title);
    setHabitDescription(item.description ?? '');
  };

  const [completionHabitId, setCompletionHabitId] = useState('');
  const [completionDate, setCompletionDate] = useState(todayDate());
  const [completionEditingId, setCompletionEditingId] = useState<string | null>(null);

  const saveHabitCompletion = async () => {
    if (!db) return;
    if (!completionHabitId) return;
    const date = completionDate || todayDate();
    const timestamp = nowIso();

    if (completionEditingId) {
      const doc = await db.habit_completions.findOne(completionEditingId).exec();
      if (!doc) return;
      await doc.patch({
        habit_id: completionHabitId,
        completed_date: date,
        updated_at: timestamp,
      });
    } else {
      await db.habit_completions.insert({
        id: uuidv4(),
        habit_id: completionHabitId,
        completed_date: date,
        created_at: timestamp,
        updated_at: timestamp,
        is_trashed: false,
        trashed_at: null,
      });
    }

    triggerHaptic();
    setCompletionHabitId('');
    setCompletionDate(todayDate());
    setCompletionEditingId(null);
  };

  const deleteHabitCompletion = async (id: string) => {
    if (!db) return;
    const doc = await db.habit_completions.findOne(id).exec();
    if (!doc) return;
    const timestamp = nowIso();
    await doc.patch({ is_trashed: true, trashed_at: timestamp, updated_at: timestamp });
    triggerHaptic();
  };

  const startEditHabitCompletion = (item: HabitCompletionDocument) => {
    setCompletionEditingId(item.id);
    setCompletionHabitId(item.habit_id);
    setCompletionDate(item.completed_date);
  };

  const [timeTaskId, setTimeTaskId] = useState('');
  const [timeStartedAt, setTimeStartedAt] = useState(toInputDateTime(nowIso()));
  const [timeStoppedAt, setTimeStoppedAt] = useState('');
  const [timeDuration, setTimeDuration] = useState('');
  const [timeEditingId, setTimeEditingId] = useState<string | null>(null);

  const saveTimeEntry = async () => {
    if (!db) return;
    const startedAt = fromInputDateTime(timeStartedAt);
    if (!startedAt) return;
    const stoppedAt = fromInputDateTime(timeStoppedAt);
    const timestamp = nowIso();

    let durationSeconds: number | null = null;
    if (timeDuration.trim()) {
      const parsed = Number(timeDuration);
      if (Number.isFinite(parsed)) {
        durationSeconds = Math.max(0, Math.floor(parsed));
      }
    } else if (stoppedAt) {
      const diff =
        new Date(stoppedAt).getTime() - new Date(startedAt).getTime();
      durationSeconds = Math.max(0, Math.floor(diff / 1000));
    }

    const payload = {
      task_id: timeTaskId || null,
      started_at: startedAt,
      stopped_at: stoppedAt,
      duration_seconds: durationSeconds,
      updated_at: timestamp,
    };

    if (timeEditingId) {
      const doc = await db.time_entries.findOne(timeEditingId).exec();
      if (!doc) return;
      await doc.patch(payload);
    } else {
      await db.time_entries.insert({
        id: uuidv4(),
        ...payload,
        created_at: timestamp,
        is_trashed: false,
        trashed_at: null,
      });
    }

    triggerHaptic();
    setTimeTaskId('');
    setTimeStartedAt(toInputDateTime(nowIso()));
    setTimeStoppedAt('');
    setTimeDuration('');
    setTimeEditingId(null);
  };

  const deleteTimeEntry = async (id: string) => {
    if (!db) return;
    const doc = await db.time_entries.findOne(id).exec();
    if (!doc) return;
    const timestamp = nowIso();
    await doc.patch({ is_trashed: true, trashed_at: timestamp, updated_at: timestamp });
    triggerHaptic();
  };

  const startEditTimeEntry = (item: TimeEntryDocument) => {
    setTimeEditingId(item.id);
    setTimeTaskId(item.task_id ?? '');
    setTimeStartedAt(toInputDateTime(item.started_at));
    setTimeStoppedAt(toInputDateTime(item.stopped_at));
    setTimeDuration(item.duration_seconds?.toString() ?? '');
  };

  if (!isReady) {
    return <div className={styles.page}>Loading database...</div>;
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Dev Validation</h1>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>sync_test</h2>
        </div>
        <div className={styles.formRow}>
          <input
            className={styles.input}
            value={syncContent}
            onChange={(event) => setSyncContent(event.target.value)}
            placeholder="Content"
          />
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={saveSyncTest}
          >
            {syncEditingId ? 'Update' : 'Add'}
          </button>
        </div>
        <ul className={styles.list}>
          {syncTests.map((item) => (
            <li key={item.id} className={styles.listItem}>
              <div className={styles.itemRow}>
                <strong>{item.content}</strong>
                <div className={styles.actions}>
                  <button className={styles.button} onClick={() => startEditSyncTest(item)}>
                    Edit
                  </button>
                  <button
                    className={`${styles.button} ${styles.buttonDanger}`}
                    onClick={() => deleteSyncTest(item.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className={styles.itemMeta}>Updated {formatDate(item.updated_at)}</div>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>projects</h2>
        </div>
        <div className={styles.formRow}>
          <input
            className={styles.input}
            value={projectTitle}
            onChange={(event) => setProjectTitle(event.target.value)}
            placeholder="Title"
          />
          <input
            className={styles.input}
            value={projectDescription}
            onChange={(event) => setProjectDescription(event.target.value)}
            placeholder="Description (optional)"
          />
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={saveProject}
          >
            {projectEditingId ? 'Update' : 'Add'}
          </button>
        </div>
        <ul className={styles.list}>
          {projects.map((item) => (
            <li key={item.id} className={styles.listItem}>
              <div className={styles.itemRow}>
                <div>
                  <strong>{item.title}</strong>
                  <div className={styles.itemMeta}>{item.description || 'No description'}</div>
                </div>
                <div className={styles.actions}>
                  <button className={styles.button} onClick={() => startEditProject(item)}>
                    Edit
                  </button>
                  <button
                    className={`${styles.button} ${styles.buttonDanger}`}
                    onClick={() => deleteProject(item.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className={styles.itemMeta}>Updated {formatDate(item.updated_at)}</div>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>tasks</h2>
        </div>
        <div className={styles.formRow}>
          <input
            className={styles.input}
            value={taskTitle}
            onChange={(event) => setTaskTitle(event.target.value)}
            placeholder="Title"
          />
          <input
            className={styles.input}
            value={taskDescription}
            onChange={(event) => setTaskDescription(event.target.value)}
            placeholder="Description (optional)"
          />
          <select
            className={styles.select}
            value={taskProjectId}
            onChange={(event) => setTaskProjectId(event.target.value)}
          >
            <option value="">No project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
          <input
            className={styles.input}
            type="datetime-local"
            value={taskDueDate}
            onChange={(event) => setTaskDueDate(event.target.value)}
            placeholder="Due date"
          />
          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={taskCompleted}
              onChange={(event) => setTaskCompleted(event.target.checked)}
            />
            Completed
          </label>
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={saveTask}
          >
            {taskEditingId ? 'Update' : 'Add'}
          </button>
        </div>
        <ul className={styles.list}>
          {tasks.map((item) => (
            <li key={item.id} className={styles.listItem}>
              <div className={styles.itemRow}>
                <div>
                  <strong>{item.title}</strong>
                  <div className={styles.itemMeta}>
                {projectMap.get(item.project_id ?? '') || 'No project'} |{' '}
                {item.completed ? 'Completed' : 'Active'}
              </div>
                </div>
                <div className={styles.actions}>
                  <button className={styles.button} onClick={() => startEditTask(item)}>
                    Edit
                  </button>
                  <button
                    className={`${styles.button} ${styles.buttonDanger}`}
                    onClick={() => deleteTask(item.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className={styles.itemMeta}>
                Due {item.due_date ? formatDate(item.due_date) : '-'} | Updated{' '}
                {formatDate(item.updated_at)}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>notes</h2>
        </div>
        <div className={styles.formRow}>
          <input
            className={styles.input}
            value={noteTitle}
            onChange={(event) => setNoteTitle(event.target.value)}
            placeholder="Title"
          />
          <textarea
            className={styles.textarea}
            value={noteContent}
            onChange={(event) => setNoteContent(event.target.value)}
            placeholder="Content (optional)"
          />
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={saveNote}
          >
            {noteEditingId ? 'Update' : 'Add'}
          </button>
        </div>
        <ul className={styles.list}>
          {notes.map((item) => (
            <li key={item.id} className={styles.listItem}>
              <div className={styles.itemRow}>
                <div>
                  <strong>{item.title}</strong>
                  <div className={styles.itemMeta}>
                    {(item.content || '').slice(0, 120) || 'No content'}
                  </div>
                </div>
                <div className={styles.actions}>
                  <button className={styles.button} onClick={() => startEditNote(item)}>
                    Edit
                  </button>
                  <button
                    className={`${styles.button} ${styles.buttonDanger}`}
                    onClick={() => deleteNote(item.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className={styles.itemMeta}>Updated {formatDate(item.updated_at)}</div>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>habits</h2>
        </div>
        <div className={styles.formRow}>
          <input
            className={styles.input}
            value={habitTitle}
            onChange={(event) => setHabitTitle(event.target.value)}
            placeholder="Title"
          />
          <input
            className={styles.input}
            value={habitDescription}
            onChange={(event) => setHabitDescription(event.target.value)}
            placeholder="Description (optional)"
          />
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={saveHabit}
          >
            {habitEditingId ? 'Update' : 'Add'}
          </button>
        </div>
        <ul className={styles.list}>
          {habits.map((item) => (
            <li key={item.id} className={styles.listItem}>
              <div className={styles.itemRow}>
                <div>
                  <strong>{item.title}</strong>
                  <div className={styles.itemMeta}>{item.description || 'No description'}</div>
                </div>
                <div className={styles.actions}>
                  <button className={styles.button} onClick={() => startEditHabit(item)}>
                    Edit
                  </button>
                  <button
                    className={`${styles.button} ${styles.buttonDanger}`}
                    onClick={() => deleteHabit(item.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className={styles.itemMeta}>Updated {formatDate(item.updated_at)}</div>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>habit_completions</h2>
        </div>
        <div className={styles.formRow}>
          <select
            className={styles.select}
            value={completionHabitId}
            onChange={(event) => setCompletionHabitId(event.target.value)}
          >
            <option value="">Select habit</option>
            {habits.map((habit) => (
              <option key={habit.id} value={habit.id}>
                {habit.title}
              </option>
            ))}
          </select>
          <input
            className={styles.input}
            type="date"
            value={completionDate}
            onChange={(event) => setCompletionDate(event.target.value)}
          />
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={saveHabitCompletion}
          >
            {completionEditingId ? 'Update' : 'Add'}
          </button>
        </div>
        <ul className={styles.list}>
          {habitCompletions.map((item) => (
            <li key={item.id} className={styles.listItem}>
              <div className={styles.itemRow}>
                <div>
                  <strong>{habitMap.get(item.habit_id) || 'Unknown habit'}</strong>
                  <div className={styles.itemMeta}>Date {item.completed_date}</div>
                </div>
                <div className={styles.actions}>
                  <button
                    className={styles.button}
                    onClick={() => startEditHabitCompletion(item)}
                  >
                    Edit
                  </button>
                  <button
                    className={`${styles.button} ${styles.buttonDanger}`}
                    onClick={() => deleteHabitCompletion(item.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className={styles.itemMeta}>Updated {formatDate(item.updated_at)}</div>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>time_entries</h2>
        </div>
        <div className={styles.formRow}>
          <select
            className={styles.select}
            value={timeTaskId}
            onChange={(event) => setTimeTaskId(event.target.value)}
          >
            <option value="">No task</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
          <input
            className={styles.input}
            type="datetime-local"
            value={timeStartedAt}
            onChange={(event) => setTimeStartedAt(event.target.value)}
          />
          <input
            className={styles.input}
            type="datetime-local"
            value={timeStoppedAt}
            onChange={(event) => setTimeStoppedAt(event.target.value)}
            placeholder="Stopped at"
          />
          <input
            className={styles.input}
            type="number"
            min="0"
            value={timeDuration}
            onChange={(event) => setTimeDuration(event.target.value)}
            placeholder="Duration (sec)"
          />
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={saveTimeEntry}
          >
            {timeEditingId ? 'Update' : 'Add'}
          </button>
        </div>
        <ul className={styles.list}>
          {timeEntries.map((item) => (
            <li key={item.id} className={styles.listItem}>
              <div className={styles.itemRow}>
                <div>
                  <strong>{taskMap.get(item.task_id ?? '') || 'No task'}</strong>
                  <div className={styles.itemMeta}>
                    Started {formatDate(item.started_at)} | Stopped {formatDate(item.stopped_at)}
                  </div>
                </div>
                <div className={styles.actions}>
                  <button className={styles.button} onClick={() => startEditTimeEntry(item)}>
                    Edit
                  </button>
                  <button
                    className={`${styles.button} ${styles.buttonDanger}`}
                    onClick={() => deleteTimeEntry(item.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className={styles.itemMeta}>
                Duration {item.duration_seconds ?? '-'}s | Updated {formatDate(item.updated_at)}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
