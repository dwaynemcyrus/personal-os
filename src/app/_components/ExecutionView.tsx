'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import type {
  ProjectDocument,
  TaskDocument,
  TimeEntryDocument,
} from '@/lib/db';
import { TaskList } from '@/features/tasks/TaskList/TaskList';
import { ProjectList } from '@/features/projects/ProjectList/ProjectList';
import sectionStyles from '../section.module.css';
import styles from '../execution/page.module.css';

type SessionGroup = {
  id: string;
  entries: TimeEntryDocument[];
  entryType: TimeEntryDocument['entry_type'];
  taskId: string | null;
  label: string | null;
  startedAt: string;
  endedAt: string | null;
};

type DateGroup = {
  key: string;
  label: string;
  sessions: SessionGroup[];
  sortValue: number;
};

const formatDuration = (seconds: number) => {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainingSeconds = total % 60;
  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(remainingSeconds).padStart(2, '0');
  if (hours > 0) {
    return `${hours}:${paddedMinutes}:${paddedSeconds}`;
  }
  return `${paddedMinutes}:${paddedSeconds}`;
};

const formatTime = (iso: string | null) => {
  if (!iso) return '--:--';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const formatDateHeading = (date: Date | null) => {
  if (!date) return 'Unknown date';
  const now = new Date();
  const includeYear = date.getFullYear() !== now.getFullYear();
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: includeYear ? 'numeric' : undefined,
  });
};

const getDateKey = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'unknown';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const computeEntryDurationSeconds = (
  entry: TimeEntryDocument,
  nowMs: number
) => {
  if (entry.duration_seconds !== null && entry.duration_seconds !== undefined) {
    return entry.duration_seconds;
  }
  const startMs = new Date(entry.started_at).getTime();
  if (Number.isNaN(startMs)) return 0;
  const endMs = entry.stopped_at
    ? new Date(entry.stopped_at).getTime()
    : nowMs;
  if (!Number.isFinite(endMs)) return 0;
  return Math.max(0, Math.floor((endMs - startMs) / 1000));
};

export function ExecutionView() {
  const { db, isReady } = useDatabase();
  const [entries, setEntries] = useState<TimeEntryDocument[]>([]);
  const [tasks, setTasks] = useState<TaskDocument[]>([]);
  const [projects, setProjects] = useState<ProjectDocument[]>([]);
  const [expandedSessions, setExpandedSessions] = useState<
    Record<string, boolean>
  >({});
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!db || !isReady) return;

    const subscription = db.time_entries
      .find({
        selector: { is_trashed: false },
        sort: [{ started_at: 'desc' }, { id: 'asc' }],
      })
      .$.subscribe((docs) => {
        setEntries(docs.map((doc) => doc.toJSON()));
      });

    return () => subscription.unsubscribe();
  }, [db, isReady]);

  useEffect(() => {
    if (!db || !isReady) return;

    const subscription = db.tasks
      .find({
        selector: { is_trashed: false },
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

  const sessions = useMemo(() => {
    const sessionMap = new Map<string, SessionGroup>();

    entries.forEach((entry) => {
      const sessionId = entry.session_id ?? entry.id;
      const existing = sessionMap.get(sessionId);
      if (!existing) {
        sessionMap.set(sessionId, {
          id: sessionId,
          entries: [entry],
          entryType: entry.entry_type,
          taskId: entry.task_id ?? null,
          label: entry.label ?? null,
          startedAt: entry.started_at,
          endedAt: entry.stopped_at ?? null,
        });
        return;
      }

      existing.entries.push(entry);
      if (entry.started_at < existing.startedAt) {
        existing.startedAt = entry.started_at;
      }
      if (entry.stopped_at) {
        if (!existing.endedAt || entry.stopped_at > existing.endedAt) {
          existing.endedAt = entry.stopped_at;
        }
      }
      if (entry.entry_type === 'unplanned') {
        existing.entryType = 'unplanned';
      }
      if (!existing.taskId && entry.task_id) {
        existing.taskId = entry.task_id;
      }
      if (!existing.label && entry.label) {
        existing.label = entry.label;
      }
    });

    return Array.from(sessionMap.values())
      .map((session) => ({
        ...session,
        entries: [...session.entries].sort((a, b) => {
          const aTime = new Date(a.started_at).getTime();
          const bTime = new Date(b.started_at).getTime();
          return aTime - bTime;
        }),
      }))
      .sort((a, b) => {
        const aTime = new Date(a.startedAt).getTime();
        const bTime = new Date(b.startedAt).getTime();
        return bTime - aTime;
      });
  }, [entries]);

  const hasActiveSession = useMemo(
    () => sessions.some((session) => session.entries.some((entry) => !entry.stopped_at)),
    [sessions]
  );

  useEffect(() => {
    if (!hasActiveSession) return;
    const updateTick = () => {
      setTick(Date.now());
    };
    const interval = window.setInterval(updateTick, 1000);
    const timeout = window.setTimeout(updateTick, 0);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [hasActiveSession]);

  const taskMap = useMemo(
    () => new Map(tasks.map((task) => [task.id, task])),
    [tasks]
  );

  const projectMap = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects]
  );

  const dateGroups = useMemo(() => {
    const groups = new Map<string, DateGroup>();

    sessions.forEach((session) => {
      const date = new Date(session.startedAt);
      const validDate = Number.isFinite(date.getTime());
      const key = validDate ? getDateKey(session.startedAt) : 'unknown';
      const label = validDate ? formatDateHeading(date) : 'Unknown date';
      const sortValue = validDate
        ? new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
        : -Infinity;
      const existing = groups.get(key);
      if (existing) {
        existing.sessions.push(session);
        return;
      }
      groups.set(key, { key, label, sessions: [session], sortValue });
    });

    return Array.from(groups.values()).sort((a, b) => b.sortValue - a.sortValue);
  }, [sessions]);

  const nowMs = hasActiveSession ? tick : 0;

  const toggleSession = useCallback((sessionId: string) => {
    setExpandedSessions((prev) => ({
      ...prev,
      [sessionId]: !prev[sessionId],
    }));
  }, []);

  return (
    <section className={sectionStyles.section}>
      <h1 className={sectionStyles.section__title}>Execution</h1>
      <p className={sectionStyles.section__subtitle}>
        Focus on the tasks and habits that move the needle.
      </p>

      <div className={sectionStyles.section__card}>
        <div className={sectionStyles['section__card-title']}>Tasks</div>
        <TaskList />
      </div>

      <div className={sectionStyles.section__card}>
        <div className={sectionStyles['section__card-title']}>Projects</div>
        <ProjectList />
      </div>

      <div className={sectionStyles.section__card}>
        <div className={sectionStyles['section__card-title']}>Time entries</div>
        <p className={sectionStyles['section__card-body']}>
          Planned and unplanned sessions grouped by day.
        </p>
        <div className={styles.sessions}>
          {dateGroups.length === 0 ? (
            <p className={styles.empty}>No time entries yet.</p>
          ) : (
            dateGroups.map((group) => (
              <div key={group.key} className={styles.dateGroup}>
                <div className={styles.dateHeader}>{group.label}</div>
                {group.sessions.map((session) => {
                  const isExpanded = Boolean(expandedSessions[session.id]);
                  const isActive = session.entries.some(
                    (entry) => !entry.stopped_at
                  );
                  const totalSeconds = session.entries.reduce(
                    (total, entry) =>
                      total + computeEntryDurationSeconds(entry, nowMs),
                    0
                  );
                  const task = session.taskId
                    ? taskMap.get(session.taskId) ?? null
                    : null;
                  const project = task?.project_id
                    ? projectMap.get(task.project_id) ?? null
                    : null;
                  const title =
                    session.entryType === 'unplanned'
                      ? session.label ?? 'Unplanned entry'
                      : task?.title ?? 'Planned entry';
                  const subtitle =
                    session.entryType === 'planned'
                      ? project?.title ?? 'No project'
                      : 'Unplanned';
                  const sessionStart = formatTime(session.startedAt);
                  const sessionEnd = isActive
                    ? 'Active'
                    : formatTime(session.endedAt);
                  const detailsId = `session-${session.id}`;

                  return (
                    <div key={session.id} className={styles.sessionCard}>
                      <button
                        type="button"
                        className={styles.sessionToggle}
                        onClick={() => toggleSession(session.id)}
                        aria-expanded={isExpanded}
                        aria-controls={detailsId}
                      >
                        <div className={styles.sessionMain}>
                          <div className={styles.sessionTitleRow}>
                            <span className={styles.sessionTitle}>{title}</span>
                            {session.entryType === 'unplanned' ? (
                              <span className={styles.badge}>u</span>
                            ) : null}
                          </div>
                          <div className={styles.sessionSubtitle}>{subtitle}</div>
                        </div>
                        <div className={styles.sessionTotal}>
                          <span className={styles.sessionDuration}>
                            {formatDuration(totalSeconds)}
                          </span>
                          <span className={styles.sessionRange}>
                            {sessionStart}–{sessionEnd}
                          </span>
                        </div>
                      </button>
                      {isExpanded ? (
                        <div
                          id={detailsId}
                          className={styles.sessionDetails}
                        >
                          {session.entries.map((entry) => {
                            const entryDuration = computeEntryDurationSeconds(
                              entry,
                              nowMs
                            );
                            const entryStart = formatTime(entry.started_at);
                            const entryEnd = entry.stopped_at
                              ? formatTime(entry.stopped_at)
                              : 'Active';
                            const entryTask = entry.task_id
                              ? taskMap.get(entry.task_id) ?? null
                              : null;
                            const entryProject = entryTask?.project_id
                              ? projectMap.get(entryTask.project_id) ?? null
                              : null;
                            const entryTypeLabel =
                              entry.entry_type === 'unplanned'
                                ? 'Unplanned'
                                : 'Planned';

                            return (
                              <div key={entry.id} className={styles.segmentRow}>
                                <div className={styles.segmentHeader}>
                                  <span className={styles.segmentTimes}>
                                    {entryStart}–{entryEnd}
                                  </span>
                                  <span className={styles.segmentDuration}>
                                    {formatDuration(entryDuration)}
                                  </span>
                                </div>
                                <div className={styles.segmentMeta}>
                                  <span className={styles.segmentType}>
                                    {entryTypeLabel}
                                  </span>
                                  {entry.entry_type === 'planned' ? (
                                    <span>
                                      Project:{' '}
                                      {entryProject?.title ?? 'None'}
                                    </span>
                                  ) : entry.label ? (
                                    <span>Label: {entry.label}</span>
                                  ) : null}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
