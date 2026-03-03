import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AppShell } from '@/components/layout/AppShell';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useNavigationState, useNavigationActions } from '@/components/providers';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from '@/components/ui/Sheet';
import { CloseIcon, GearIcon } from '@/components/ui/icons';
import { NotesMobileShell } from '@/features/notes/NotesShell/NotesMobileShell';
import { NotesDesktopShell } from '@/features/notes/NotesShell/NotesDesktopShell';
import { TaskList } from '@/features/tasks/TaskList/TaskList';
import { useDatabase } from '@/hooks/useDatabase';
import type { ItemDocument } from '@/lib/db';
import type { NavigationLayer } from '@/lib/navigation/types';
import styles from './App.module.css';

function useTodayDate() {
  const [today, setToday] = useState(() => new Date());
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timer = setTimeout(() => setToday(new Date()), tomorrow.getTime() - now.getTime());
    return () => clearTimeout(timer);
  }, [today]);
  return today;
}


function NotesShell() {
  const isDesktop = useIsDesktop();
  if (isDesktop) return <NotesDesktopShell />;
  return <NotesMobileShell />;
}

function PlansView() {
  return (
    <section className={styles.placeholder}>
      <h1 className={styles.placeholderTitle}>Plans</h1>
      <p className={styles.placeholderBody}>Plans view coming soon.</p>
    </section>
  );
}

function NowView({ onOpenInbox }: { onOpenInbox: () => void }) {
  const { db, isReady } = useDatabase();
  const { pushLayer } = useNavigationActions();
  const [isWorkbenchOpen, setIsWorkbenchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleRefreshAndSync = async () => {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    if ('databases' in indexedDB) {
      const dbs = await (indexedDB as typeof indexedDB & { databases: () => Promise<{ name?: string }[]> }).databases();
      await Promise.all(
        dbs
          .filter((d) => d.name?.includes('personalos'))
          .map((d) => new Promise<void>((resolve) => {
            const req = indexedDB.deleteDatabase(d.name!);
            req.onsuccess = () => resolve();
            req.onerror = () => resolve();
          }))
      );
    }
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((r) => r.unregister()));
    }
    window.location.reload();
  };


  const today = useTodayDate();
  const nowLabel = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const nowIso = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');
  const nowNoteType = `daily:${nowIso}`;
  const nowTitle = `daily_${nowIso}`;

  const [nowNote, setNowNote] = useState<ItemDocument | null>(null);
  useEffect(() => {
    if (!db || !isReady) return;
    const subscription = db.items
      .findOne({
        selector: { type: 'note', subtype: nowNoteType, is_trashed: false },
      })
      .$.subscribe((doc) => {
        setNowNote(doc ? (doc.toJSON() as ItemDocument) : null);
      });
    return () => subscription.unsubscribe();
  }, [db, isReady, nowNoteType]);

  const handleNowNote = async () => {
    if (!db) return;
    // Re-query immediately before insert — handles the race where sync pulls
    // the note between the reactive state firing (null) and the user tapping.
    const existing = nowNote ?? await db.items.findOne({
      selector: { type: 'note', subtype: nowNoteType, is_trashed: false },
    }).exec();
    if (existing) {
      pushLayer({ view: 'note-detail', noteId: existing.id });
    } else {
      const noteId = uuidv4();
      const timestamp = new Date().toISOString();
      await db.items.insert({
        id: noteId,
        type: 'note',
        parent_id: null,
        title: nowTitle,
        content: `# ${nowTitle}\n`,
        inbox_at: null,
        subtype: nowNoteType,
        is_pinned: false,
        item_status: 'active',
        completed: false,
        is_next: false,
        is_someday: false,
        is_waiting: false,
        processed: false,
        created_at: timestamp,
        updated_at: timestamp,
        is_trashed: false,
        trashed_at: null,
      });
      pushLayer({ view: 'note-detail', noteId });
    }
  };

  const [inboxNotes, setInboxNotes] = useState<ItemDocument[]>([]);
  useEffect(() => {
    if (!db || !isReady) return;
    const subscription = db.items
      .find({
        selector: { type: 'note', inbox_at: { $ne: null }, is_trashed: false },
      })
      .$.subscribe((docs) => {
        setInboxNotes(docs.map((doc) => doc.toJSON() as ItemDocument));
      });
    return () => subscription.unsubscribe();
  }, [db, isReady]);

  const [workbenchNotes, setWorkbenchNotes] = useState<ItemDocument[]>([]);
  useEffect(() => {
    if (!db || !isReady) return;
    const subscription = db.items
      .find({
        selector: { type: 'note', is_pinned: true, is_trashed: false },
        sort: [{ updated_at: 'desc' }, { id: 'asc' }],
      })
      .$.subscribe((docs) => {
        setWorkbenchNotes(docs.map((doc) => doc.toJSON() as ItemDocument));
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

  const handleOpenNextTasks = () => {
    pushLayer({ view: 'tasks-list', filter: 'backlog' });
  };

  const inboxCount = inboxNotes.length;
  const workbenchCount = workbenchNotes.length;
  const todayActionLabel = nowNote ? "Open Today's Note" : "Create Today's Note";
  const workbenchLineLabel =
    workbenchCount === 0 ? 'Your Workbench Empty' : 'Your Workbench';

  return (
    <section className={styles.home}>
      <div className={styles.homeHeader}>
        <div className={styles.homeNowDate}>{nowLabel}</div>
        <button
          type="button"
          className={styles.homeSettingsButton}
          onClick={() => setIsSettingsOpen(true)}
          aria-label="Settings"
        >
          <GearIcon />
        </button>
      </div>

      <div className={styles.homeNowGroup}>
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

      <div className={styles.homeFocusBlock}>
        <div className={styles.homeFocusLabel}>Now</div>
        <button
          type="button"
          className={styles.homeFocusLink}
          onClick={handleOpenNextTasks}
          aria-label="Fill your 2 slots for today"
        >
          Fill your 2 slots for today
          {' '}
          <span className={styles.homeLinkArrow} aria-hidden="true">
            &rsaquo;
          </span>
        </button>
      </div>

      <button
        type="button"
        className={styles.homeInboxLink}
        onClick={onOpenInbox}
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
                <CloseIcon className={styles.workbenchCloseIcon} />
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

      <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <SheetContent side="bottom" className={styles.workbenchSheet} aria-label="Settings">
          <header className={styles.workbenchSheetHeader}>
            <SheetTitle className={styles.workbenchSheetTitle}>Settings</SheetTitle>
            <SheetClose asChild>
              <button type="button" className={styles.workbenchClose} aria-label="Close settings">
                <CloseIcon className={styles.workbenchCloseIcon} />
              </button>
            </SheetClose>
          </header>
          <div className={styles.settingsSection}>
            <div className={styles.settingsSectionLabel}>Sync</div>
            <button
              type="button"
              className={styles.settingsRow}
              onClick={handleRefreshAndSync}
            >
              Refresh &amp; Sync
            </button>
          </div>
        </SheetContent>
      </Sheet>

    </section>
  );
}


function ActiveView({
  topLayer,
  onOpenInbox,
}: {
  topLayer: NavigationLayer | undefined;
  onOpenInbox: () => void;
}) {
  if (!topLayer) {
    return <NowView onOpenInbox={onOpenInbox} />;
  }

  if (topLayer.view === 'notes-list' || topLayer.view === 'note-detail') {
    return <NotesShell />;
  }

  if (topLayer.view === 'tasks-list' || topLayer.view === 'task-detail') {
    return <TaskList />;
  }

  if (topLayer.view === 'plans-list' || topLayer.view === 'plan-detail') {
    return <PlansView />;
  }

  return <NowView onOpenInbox={onOpenInbox} />;
}

export function App() {
  const { stack } = useNavigationState();
  const topLayer = stack[stack.length - 1];
  const [isInboxOpen, setIsInboxOpen] = useState(false);

  return (
    <AppShell isInboxOpen={isInboxOpen} onInboxOpenChange={setIsInboxOpen}>
      <ActiveView topLayer={topLayer} onOpenInbox={() => setIsInboxOpen(true)} />
    </AppShell>
  );
}
