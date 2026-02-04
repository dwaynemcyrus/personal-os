/**
 * RootView
 *
 * Renders the appropriate view based on navigation context.
 * Single entry point for all context-based content.
 */

'use client';

import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useNavigationState, useNavigationActions } from '@/components/providers';
import { useDatabase } from '@/hooks/useDatabase';
import type { NoteDocument } from '@/lib/db';
import styles from '../page.module.css';

// Lazy load context views for better performance
const ExecutionView = lazy(() =>
  import('./ExecutionView').then((mod) => ({ default: mod.ExecutionView }))
);
const ThoughtsView = lazy(() =>
  import('./ThoughtsView').then((mod) => ({ default: mod.ThoughtsView }))
);
const StrategyView = lazy(() =>
  import('./StrategyView').then((mod) => ({ default: mod.StrategyView }))
);

function TodayView() {
  const { db, isReady } = useDatabase();
  const { pushLayer } = useNavigationActions();

  const handleOpenInbox = () => {
    window.dispatchEvent(new CustomEvent('inbox-wizard:open'));
  };

  const todayLabel = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const todayNoteType = `daily:${todayIso}`;
  const todayTitle = `daily_${todayIso}`;

  const [todayNote, setTodayNote] = useState<NoteDocument | null>(null);
  useEffect(() => {
    if (!db || !isReady) return;
    const subscription = db.notes
      .findOne({
        selector: { note_type: todayNoteType, is_trashed: false },
      })
      .$.subscribe((doc) => {
        setTodayNote(doc ? doc.toJSON() : null);
      });
    return () => subscription.unsubscribe();
  }, [db, isReady, todayNoteType]);

  const handleTodayNote = async () => {
    if (!db) return;
    if (todayNote) {
      pushLayer({ view: 'thoughts-note', noteId: todayNote.id });
    } else {
      const noteId = uuidv4();
      const timestamp = new Date().toISOString();
      await db.notes.insert({
        id: noteId,
        title: todayTitle,
        content: `# ${todayTitle}\n`,
        inbox_at: null,
        note_type: todayNoteType,
        is_pinned: false,
        created_at: timestamp,
        updated_at: timestamp,
        is_trashed: false,
        trashed_at: null,
      });
      pushLayer({ view: 'thoughts-note', noteId });
    }
  };

  const [inboxNotes, setInboxNotes] = useState<NoteDocument[]>([]);
  useEffect(() => {
    if (!db || !isReady) return;
    const subscription = db.notes
      .find({
        selector: { inbox_at: { $ne: null }, is_trashed: false },
      })
      .$.subscribe((docs) => {
        setInboxNotes(docs.map((doc) => doc.toJSON()));
      });
    return () => subscription.unsubscribe();
  }, [db, isReady]);

  const inboxCount = inboxNotes.length;

  return (
    <section className={styles.home}>
      {/* ── Now ── */}
      <div>
        <h1 className={styles['home__now-title']}>Now</h1>
      </div>

      <button
        type="button"
        className={styles['home__now-card']}
        onClick={handleTodayNote}
        aria-label="Open today's working surface"
      >
        <div>
          <div className={styles['home__now-date']}>{todayLabel}</div>
          <div className={styles['home__now-subtitle']}>
            Your daily working surface
          </div>
        </div>
        <div className={styles['home__now-button']}>
          {todayNote ? "Open Today's Note" : 'Create Today Note'}
        </div>
      </button>

      {/* ── Inbox ── */}
      <div>
        <div className={styles['home__section-label']}>Inbox</div>
        <button
          type="button"
          className={styles['home__inbox-card']}
          onClick={handleOpenInbox}
          aria-label="Process inbox"
        >
          <div className={styles['home__inbox-text']}>
            <div className={styles['home__inbox-title']}>Process Inbox</div>
            <div className={styles['home__inbox-subtitle']}>
              Items waiting to be sorted
            </div>
          </div>
          <div className={styles['home__inbox-right']}>
            {inboxCount > 0 && (
              <span className={styles['home__inbox-badge']}>{inboxCount}</span>
            )}
            <span className={styles['home__inbox-arrow']}>&rsaquo;</span>
          </div>
        </button>
      </div>

      {/* ── Workbench ── */}
      <div>
        <div className={styles['home__section-label']}>Workbench</div>
        <div className={styles['home__workbench-empty']}>
          No pinned documents yet
        </div>
        <button
          type="button"
          className={styles['home__workbench-add']}
          onClick={handleTodayNote}
          aria-label="Add to workbench"
        >
          + Add to Workbench
        </button>
      </div>
    </section>
  );
}

function LoadingFallback() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      Loading...
    </div>
  );
}

export function RootView() {
  const { context } = useNavigationState();

  switch (context) {
    case 'execution':
      return (
        <Suspense fallback={<LoadingFallback />}>
          <ExecutionView />
        </Suspense>
      );
    case 'thoughts':
      return (
        <Suspense fallback={<LoadingFallback />}>
          <ThoughtsView />
        </Suspense>
      );
    case 'strategy':
      return (
        <Suspense fallback={<LoadingFallback />}>
          <StrategyView />
        </Suspense>
      );
    case 'today':
    default:
      return <TodayView />;
  }
}
