import { lazy, Suspense, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { AppShell } from '@/components/layout/AppShell';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useNavigationState, useNavigationActions } from '@/components/providers';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from '@/components/ui/Sheet';
import { CloseIcon } from '@/components/ui/icons';
import type { ItemRow } from '@/lib/db';
import { createNoteFromTemplate } from '@/features/notes/hooks/useCreateNoteFromTemplate';
import { fetchUserSettings } from '@/lib/userSettings';
import type { NavigationLayer } from '@/lib/navigation/types';
import { WizardProvider } from '@/components/providers';
import { StrategyHomeSection } from '@/features/strategy/StrategyHomeSection';
import styles from './App.module.css';

const SettingsPage = lazy(() =>
  import('@/features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);

const NotesMobileShell = lazy(() =>
  import('@/features/notes/NotesShell/NotesMobileShell').then((m) => ({ default: m.NotesMobileShell }))
);
const NotesDesktopShell = lazy(() =>
  import('@/features/notes/NotesShell/NotesDesktopShell').then((m) => ({ default: m.NotesDesktopShell }))
);
const TaskList = lazy(() =>
  import('@/features/tasks/TaskList/TaskList').then((m) => ({ default: m.TaskList }))
);
const StrategyView = lazy(() =>
  import('@/features/strategy/StrategyView').then((m) => ({ default: m.StrategyView }))
);

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
  return (
    <Suspense fallback={null}>
      {isDesktop ? <NotesDesktopShell /> : <NotesMobileShell />}
    </Suspense>
  );
}

function NowView({ onOpenInbox }: { onOpenInbox: () => void }) {
  const { pushLayer } = useNavigationActions();
  const [isWorkbenchOpen, setIsWorkbenchOpen] = useState(false);

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
  const nowTitle = nowIsoDate;

  const { data: nowNoteRows = [] } = useQuery({
    queryKey: ['notes', 'today-note', nowNoteType],
    queryFn: async (): Promise<ItemRow[]> => {
      const { data } = await supabase
        .from('items')
        .select('id, title, subtype, updated_at')
        .eq('type', 'note')
        .eq('subtype', nowNoteType)
        .eq('is_trashed', false)
        .limit(1);
      return (data ?? []) as unknown as ItemRow[];
    },
    staleTime: 5 * 60_000,
  });
  const nowNote = nowNoteRows[0] ?? null;

  const { data: inboxNotes = [] } = useQuery({
    queryKey: ['inbox'],
    queryFn: async (): Promise<ItemRow[]> => {
      const { data } = await supabase
        .from('items')
        .select('id')
        .eq('type', 'note')
        .not('inbox_at', 'is', null)
        .eq('is_trashed', false);
      return (data ?? []) as unknown as ItemRow[];
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const { data: workbenchNotes = [] } = useQuery({
    queryKey: ['notes', 'workbench'],
    queryFn: async (): Promise<ItemRow[]> => {
      const { data } = await supabase
        .from('items')
        .select('id, title, updated_at')
        .eq('type', 'note')
        .eq('is_pinned', true)
        .eq('is_trashed', false)
        .order('updated_at', { ascending: false });
      return (data ?? []) as unknown as ItemRow[];
    },
    staleTime: 30_000,
  });

  const handleNowNote = async () => {
    if (nowNote) {
      pushLayer({ view: 'note-detail', noteId: nowNote.id });
    } else {
      const settings = await fetchUserSettings();
      const templateId = settings?.daily_note_template_id ?? null;
      const noteId = await createNoteFromTemplate(templateId, {
        title: nowTitle,
        filename: nowIsoDate,
        subtype: nowNoteType,
      });
      queryClient.invalidateQueries({ queryKey: ['notes', 'today-note'] });
      pushLayer({ view: 'note-detail', noteId });
    }
  };

  const handleOpenNextTasks = () => pushLayer({ view: 'tasks-list', filter: 'backlog' });

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

      <StrategyHomeSection />

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

      <button
        type="button"
        className={styles.homeInboxLink}
        onClick={() => pushLayer({ view: 'settings' })}
        aria-label="Settings"
      >
        <span className={styles.homeInboxTitle}>Settings</span>
        <span className={styles.homeLinkArrow} aria-hidden="true">&rsaquo;</span>
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
  if (topLayer.view === 'tasks-list' || topLayer.view === 'task-detail') return <Suspense fallback={null}><TaskList /></Suspense>;
  if (topLayer.view === 'strategy-detail') return <Suspense fallback={null}><StrategyView /></Suspense>;
  if (topLayer.view === 'settings') return <Suspense fallback={null}><SettingsPage /></Suspense>;
  return <NowView onOpenInbox={onOpenInbox} />;
}

export function App() {
  const { stack } = useNavigationState();
  const topLayer = stack[stack.length - 1];
  const [isInboxOpen, setIsInboxOpen] = useState(false);

  return (
    <WizardProvider>
      <AppShell isInboxOpen={isInboxOpen} onInboxOpenChange={setIsInboxOpen}>
        <ActiveView topLayer={topLayer} onOpenInbox={() => setIsInboxOpen(true)} />
      </AppShell>
    </WizardProvider>
  );
}
