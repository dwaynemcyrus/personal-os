import { useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AppShell } from '@/components/layout/AppShell';
import { useNavigationState, useNavigationActions } from '@/components/providers';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from '@/components/ui/Sheet';
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
  const [isWorkbenchOpen, setIsWorkbenchOpen] = useState(false);

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

  const [workbenchNotes, setWorkbenchNotes] = useState<NoteDocument[]>([]);
  useEffect(() => {
    if (!db || !isReady) return;
    const subscription = db.notes
      .find({
        selector: { is_pinned: true, is_trashed: false },
        sort: [{ updated_at: 'desc' }, { id: 'asc' }],
      })
      .$.subscribe((docs) => {
        setWorkbenchNotes(docs.map((doc) => doc.toJSON() as NoteDocument));
      });
    return () => subscription.unsubscribe();
  }, [db, isReady]);

  const handleOpenWorkbench = () => {
    setIsWorkbenchOpen(true);
  };

  const handleOpenWorkbenchNote = (noteId: string) => {
    setIsWorkbenchOpen(false);
    pushLayer({ view: 'note-detail', noteId });
  };

  const handleOpenAllNotesForPinning = () => {
    setIsWorkbenchOpen(false);
    pushLayer({ view: 'notes-list', group: 'all' });
  };

  const inboxCount = inboxNotes.length;
  const workbenchCount = workbenchNotes.length;
  const todayActionLabel = nowNote ? "Open Today's Note" : "Create Today's Note";
  const workbenchLineLabel =
    workbenchCount === 0 ? 'Your Workbench Empty' : 'Your Workbench';

  return (
    <section className={styles.home}>
      <div className={styles.homeNowGroup}>
        <div className={styles.homeNowDate}>{nowLabel}</div>
        <button
          type="button"
          className={styles.homeNowLink}
          onClick={handleNowNote}
          aria-label={todayActionLabel}
        >
          <span className={styles.homeNowAction}>
            {todayActionLabel}
            <span className={styles.homeLinkArrow} aria-hidden="true">
              &rsaquo;
            </span>
          </span>
        </button>
      </div>

      <button
        type="button"
        className={styles.homeInboxLink}
        onClick={handleOpenInbox}
        aria-label="Process inbox"
      >
        <span className={styles.homeInboxTitle}>Process inbox</span>
        <span className={styles.homeInboxRight}>
          <span className={styles.homeInboxCount}>{inboxCount}</span>
          <span className={styles.homeLinkArrow} aria-hidden="true">
            &rsaquo;
          </span>
        </span>
      </button>

      <button
        type="button"
        className={styles.homeInboxLink}
        onClick={handleOpenWorkbench}
        aria-label={workbenchLineLabel}
      >
        <span className={styles.homeInboxTitle}>{workbenchLineLabel}</span>
        <span className={styles.homeInboxRight}>
          <span className={styles.homeInboxCount}>{workbenchCount}</span>
          <span className={styles.homeLinkArrow} aria-hidden="true">
            &rsaquo;
          </span>
        </span>
      </button>

      <Sheet open={isWorkbenchOpen} onOpenChange={setIsWorkbenchOpen}>
        <SheetContent
          side="bottom"
          className={styles.workbenchSheet}
          aria-label="Workbench"
        >
          <header className={styles.workbenchSheetHeader}>
            <SheetTitle className={styles.workbenchSheetTitle}>Workbench</SheetTitle>
            <SheetClose asChild>
              <button
                type="button"
                className={styles.workbenchClose}
                aria-label="Close workbench"
              >
                <CloseIcon />
              </button>
            </SheetClose>
          </header>

          {workbenchCount > 0 ? (
            <ul className={styles.workbenchList}>
              {workbenchNotes.map((note) => (
                <li key={note.id}>
                  <button
                    type="button"
                    className={styles.workbenchNoteButton}
                    onClick={() => handleOpenWorkbenchNote(note.id)}
                  >
                    <span className={styles.workbenchNoteTitle}>{note.title}</span>
                    <span className={styles.homeLinkArrow} aria-hidden="true">
                      &rsaquo;
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.workbenchEmpty}>
              <div className={styles.workbenchEmptyTitle}>Pin Notes To Add</div>
              <button
                type="button"
                className={styles.workbenchAddLink}
                onClick={handleOpenAllNotesForPinning}
              >
                Add 4 Notes Max
                <span className={styles.homeLinkArrow} aria-hidden="true">
                  &rsaquo;
                </span>
              </button>
            </div>
          )}
        </SheetContent>
      </Sheet>

    </section>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={styles.workbenchCloseIcon}
    >
      <path d="M6 6l12 12M18 6l-12 12" />
    </svg>
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
