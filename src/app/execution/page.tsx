'use client';

import { useEffect, useState } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import type { TimeEntryDocument } from '@/lib/db';
import sectionStyles from '../section.module.css';
import styles from './page.module.css';

const formatDateTime = (iso: string | null) => {
  if (!iso) return '-';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
};

const formatDuration = (seconds: number | null) => {
  if (seconds === null || seconds === undefined) return '-';
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

export default function ExecutionPage() {
  const { db, isReady } = useDatabase();
  const [logs, setLogs] = useState<TimeEntryDocument[]>([]);

  useEffect(() => {
    if (!db || !isReady) return;

    const subscription = db.time_entries
      .find({
        selector: { is_trashed: false, entry_type: 'log' },
        sort: [{ started_at: 'desc' }, { id: 'asc' }],
      })
      .$.subscribe((docs) => {
        setLogs(docs.map((doc) => doc.toJSON()));
      });

    return () => subscription.unsubscribe();
  }, [db, isReady]);

  return (
    <section className={sectionStyles.section}>
      <h1 className={sectionStyles.section__title}>Execution</h1>
      <p className={sectionStyles.section__subtitle}>
        Focus on the tasks and habits that move the needle.
      </p>

      <div className={sectionStyles.section__card}>
        <div className={sectionStyles['section__card-title']}>Tasks</div>
        <p className={sectionStyles['section__card-body']}>
          Task lists, habits, and timers will live here.
        </p>
      </div>

      <div className={sectionStyles.section__card}>
        <div className={sectionStyles['section__card-title']}>Logs</div>
        <p className={sectionStyles['section__card-body']}>
          Unplanned activity tracking from the focus timer.
        </p>
        <div className={styles.logs}>
          {logs.length === 0 ? (
            <p className={styles.empty}>No log entries yet.</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className={styles.logItem}>
                <div className={styles.logTitle}>{log.label ?? 'Log entry'}</div>
                <div className={styles.logMeta}>
                  <span>Started {formatDateTime(log.started_at)}</span>
                  <span>
                    {log.stopped_at
                      ? `Stopped ${formatDateTime(log.stopped_at)}`
                      : 'Active'}
                  </span>
                  <span>Duration {formatDuration(log.duration_seconds)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
