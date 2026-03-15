import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useQuery, usePowerSync } from '@powersync/react';
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
import { SettingsSheet } from '@/features/settings/SettingsSheet';
import { NotesMobileShell } from '@/features/notes/NotesShell/NotesMobileShell';
import { NotesDesktopShell } from '@/features/notes/NotesShell/NotesDesktopShell';
import { TaskList } from '@/features/tasks/TaskList/TaskList';
import { PlansView } from '@/features/plans/PlansView';
import type { ItemRow } from '@/lib/db';
import { insertItem } from '@/lib/db';
import { generateSlug } from '@/lib/slug';
import { nowIso } from '@/lib/time';
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

function NowView({ onOpenInbox }: { onOpenInbox: () => void }) {
  const db = usePowerSync();
  const { pushLayer } = useNavigationActions();
  const [isWorkbenchOpen, setIsWorkbenchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const today = useTodayDate();
  const nowLabel = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const nowIsoDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');
  const nowNoteType = `daily:${nowIsoDate}`;
  const nowTitle = `daily_${nowIsoDate}`;

  const { data: nowNoteRows } = useQuery<ItemRow>(
    `SELECT * FROM items WHERE type = 'note' AND subtype = ? AND is_trashed = 0 LIMIT 1`,
    [nowNoteType]
  );
  const nowNote = nowNoteRows[0] ?? null;

  const { data: inboxNotes } = useQuery<ItemRow>(
    `SELECT * FROM items WHERE type = 'note' AND inbox_at IS NOT NULL AND is_trashed = 0`
  );

  const { data: workbenchNotes } = useQuery<ItemRow>(
    `SELECT * FROM items WHERE type = 'note' AND is_pinned = 1 AND is_trashed = 0
     ORDER BY updated_at DESC`
  );

  const handleNowNote = async () => {
    if (nowNote) {
      pushLayer({ view: 'note-detail', noteId: nowNote.id });
    } else {
      const noteId = uuidv4();
      const timestamp = nowIso();
      await insertItem(db, {
        id: noteId,
        type: 'note',
        parent_id: null,
        title: nowTitle,
        content: `# ${nowTitle}\n`,
        filename: generateSlug(nowTitle),
        inbox_at: null,
        subtype: nowNoteType,
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
      pushLayer({ view: 'note-detail', noteId });
    }
  };

  const handleOpenNextTasks = () => {
    pushLayer({ view: 'tasks-list', filter: 'backlog' });
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
  const workbenchLineLabel = workbenchCount === 0 ? 'Your Workbench Empty' : 'Your Workbench';

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
            <span className={styles.homeLinkArrow} aria-hidden="true">&rsaquo;</span>
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
          <span className={styles.homeLinkArrow} aria-hidden="true">&rsaquo;</span>
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
          <span className={styles.homeLinkArrow} aria-hidden="true">&rsaquo;</span>
        </span>
      </button>

      <button
        type="button"
        className={styles.homeInboxLink}
        onClick={() => setIsWorkbenchOpen(true)}
        aria-label={workbenchLineLabel}
      >
        <span className={styles.homeInboxTitle}>{workbenchLineLabel}</span>
        <span className={styles.homeInboxRight}>
          <span className={styles.homeInboxCount}>{workbenchCount}</span>
          <span className={styles.homeLinkArrow} aria-hidden="true">&rsaquo;</span>
        </span>
      </button>

      <Sheet open={isWorkbenchOpen} onOpenChange={setIsWorkbenchOpen}>
        <SheetContent side="bottom" className={styles.workbenchSheet} aria-label="Workbench">
          <header className={styles.workbenchSheetHeader}>
            <SheetTitle className={styles.workbenchSheetTitle}>Workbench</SheetTitle>
            <SheetClose asChild>
              <button type="button" className={styles.workbenchClose} aria-label="Close workbench">
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
                    <span className={styles.homeLinkArrow} aria-hidden="true">&rsaquo;</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.workbenchEmpty}>
              <div className={styles.workbenchEmptyTitle}>Pin Notes To Add</div>
              <button type="button" className={styles.workbenchAddLink} onClick={handleOpenAllNotesForPinning}>
                Add 4 Notes Max
                <span className={styles.homeLinkArrow} aria-hidden="true">&rsaquo;</span>
              </button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <SettingsSheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
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
  if (!topLayer) return <NowView onOpenInbox={onOpenInbox} />;
  if (topLayer.view === 'notes-list' || topLayer.view === 'note-detail') return <NotesShell />;
  if (topLayer.view === 'tasks-list' || topLayer.view === 'task-detail') return <TaskList />;
  if (topLayer.view === 'plans-list' || topLayer.view === 'plan-detail') return <PlansView />;
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
