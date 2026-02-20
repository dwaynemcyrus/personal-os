import { useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AppShell } from '@/components/layout/AppShell';
import { useNavigationState, useNavigationActions } from '@/components/providers';
import { NotesMobileShell } from '@/features/notes/NotesShell/NotesMobileShell';
import { NotesDesktopShell } from '@/features/notes/NotesShell/NotesDesktopShell';
import { useDatabase } from '@/hooks/useDatabase';
import type { NoteDocument } from '@/lib/db';
import type { NavigationLayer } from '@/lib/navigation/types';
import styles from './App.module.css';

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isDesktop;
}

function NotesShell() {
  const isDesktop = useIsDesktop();
  if (isDesktop) return <NotesDesktopShell />;
  return <NotesMobileShell />;
}

function TasksView() {
  return (
    <section className={styles.placeholder}>
      <h1 className={styles.placeholderTitle}>Tasks</h1>
      <p className={styles.placeholderBody}>Tasks view coming soon.</p>
    </section>
  );
}

function PlansView() {
  return (
    <section className={styles.placeholder}>
      <h1 className={styles.placeholderTitle}>Plans</h1>
      <p className={styles.placeholderBody}>Plans view coming soon.</p>
    </section>
  );
}

function NowView() {
  const { db, isReady } = useDatabase();
  const { pushLayer } = useNavigationActions();

  const handleOpenInbox = () => {
    window.dispatchEvent(new CustomEvent('inbox-wizard:open'));
  };

  const nowLabel = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  const nowIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const nowNoteType = `daily:${nowIso}`;
  const nowTitle = `daily_${nowIso}`;

  const [nowNote, setNowNote] = useState<NoteDocument | null>(null);
  useEffect(() => {
    if (!db || !isReady) return;
    const subscription = db.notes
      .findOne({
        selector: { note_type: nowNoteType, is_trashed: false },
      })
      .$.subscribe((doc) => {
        setNowNote(doc ? (doc.toJSON() as NoteDocument) : null);
      });
    return () => subscription.unsubscribe();
  }, [db, isReady, nowNoteType]);

  const handleNowNote = async () => {
    if (!db) return;
    if (nowNote) {
      pushLayer({ view: 'note-detail', noteId: nowNote.id });
    } else {
      const noteId = uuidv4();
      const timestamp = new Date().toISOString();
      await db.notes.insert({
        id: noteId,
        title: nowTitle,
        content: `# ${nowTitle}\n`,
        inbox_at: null,
        note_type: nowNoteType,
        is_pinned: false,
        properties: null,
        created_at: timestamp,
        updated_at: timestamp,
        is_trashed: false,
        trashed_at: null,
      });
      pushLayer({ view: 'note-detail', noteId });
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
        setInboxNotes(docs.map((doc) => doc.toJSON() as NoteDocument));
      });
    return () => subscription.unsubscribe();
  }, [db, isReady]);

  const inboxCount = inboxNotes.length;

  return (
    <section className={styles.home}>
      <div>
        <h1 className={styles.homeNowTitle}>Now</h1>
      </div>

      <button
        type="button"
        className={styles.homeNowCard}
        onClick={handleNowNote}
        aria-label="Open now working surface"
      >
        <div>
          <div className={styles.homeNowDate}>{nowLabel}</div>
          <div className={styles.homeNowSubtitle}>Your daily working surface</div>
        </div>
        <div className={styles.homeNowButton}>
          {nowNote ? 'Open Now Note' : 'Create Now Note'}
        </div>
      </button>

      <div>
        <div className={styles.homeSectionLabel}>Inbox</div>
        <button
          type="button"
          className={styles.homeInboxCard}
          onClick={handleOpenInbox}
          aria-label="Process inbox"
        >
          <div className={styles.homeInboxText}>
            <div className={styles.homeInboxTitle}>Process Inbox</div>
            <div className={styles.homeInboxSubtitle}>Items waiting to be sorted</div>
          </div>
          <div className={styles.homeInboxRight}>
            {inboxCount > 0 && (
              <span className={styles.homeInboxBadge}>{inboxCount}</span>
            )}
            <span className={styles.homeInboxArrow}>&rsaquo;</span>
          </div>
        </button>
      </div>

      <div>
        <div className={styles.homeSectionLabel}>Workbench</div>
        <div className={styles.homeWorkbenchEmpty}>No pinned documents yet</div>
        <button
          type="button"
          className={styles.homeWorkbenchAdd}
          onClick={handleNowNote}
          aria-label="Add to workbench"
        >
          + Add to Workbench
        </button>
      </div>
    </section>
  );
}

function ActiveView({ topLayer }: { topLayer: NavigationLayer | undefined }) {
  if (!topLayer) {
    return <NowView />;
  }

  if (topLayer.view === 'notes-list' || topLayer.view === 'note-detail') {
    return <NotesShell />;
  }

  if (topLayer.view === 'tasks-list' || topLayer.view === 'task-detail') {
    return <TasksView />;
  }

  if (topLayer.view === 'plans-list' || topLayer.view === 'plan-detail') {
    return <PlansView />;
  }

  return <NowView />;
}

export function App() {
  const { stack } = useNavigationState();
  const topLayer = stack[stack.length - 1];

  return (
    <AppShell>
      <ActiveView topLayer={topLayer} />
    </AppShell>
  );
}
