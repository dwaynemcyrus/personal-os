import { lazy, Suspense } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useVisualViewportFix } from '@/hooks/useVisualViewportFix';
import { useNavigationState } from '@/components/providers';
import type { NavigationLayer } from '@/lib/navigation/types';
import { WizardProvider } from '@/components/providers';
const SHOW_STRATEGY = import.meta.env.VITE_SHOW_STRATEGY === 'true';

const SettingsPage = lazy(() =>
  import('@/features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);

const NotesMobileShell = lazy(() =>
  import('@/features/notes/NotesShell/NotesMobileShell').then((m) => ({ default: m.NotesMobileShell }))
);
const NotesDesktopShell = lazy(() =>
  import('@/features/notes/NotesShell/NotesDesktopShell').then((m) => ({ default: m.NotesDesktopShell }))
);
const StrategyView = SHOW_STRATEGY
  ? lazy(() => import('@/features/strategy/StrategyView').then((m) => ({ default: m.StrategyView })))
  : null;

const DocumentDetailView = lazy(() =>
  import('@/features/documents/DocumentDetailView').then((m) => ({ default: m.DocumentDetailView }))
);
const HomeView = lazy(() =>
  import('@/features/home/HomeView').then((m) => ({ default: m.HomeView }))
);
const ActionsView = lazy(() =>
  import('@/features/actions/ActionsView').then((m) => ({ default: m.ActionsView }))
);
const TaskList = lazy(() =>
  import('@/features/tasks/TaskList/TaskList').then((m) => ({ default: m.TaskList }))
);
const InboxListView = lazy(() =>
  import('@/features/inbox/InboxListView').then((m) => ({ default: m.InboxListView }))
);

function NotesShell() {
  const isDesktop = useIsDesktop();
  return (
    <Suspense fallback={null}>
      {isDesktop ? <NotesDesktopShell /> : <NotesMobileShell />}
    </Suspense>
  );
}

function isNotesDocumentStack(stack: NavigationLayer[]): boolean {
  const topLayer = stack[stack.length - 1];

  if (!topLayer) return false;
  if (topLayer.view === 'notes-list') return true;
  if (topLayer.view !== 'document-detail') return false;

  const lastNotesListIndex = stack.findLastIndex((layer) => layer.view === 'notes-list');
  if (lastNotesListIndex === -1) return false;

  return stack
    .slice(lastNotesListIndex + 1)
    .every((layer) => layer.view === 'document-detail');
}

function ActiveView({
  stack,
  topLayer,
}: {
  stack: NavigationLayer[];
  topLayer: NavigationLayer | undefined;
}) {
  if (!topLayer) return <Suspense fallback={null}><HomeView /></Suspense>;
  if (isNotesDocumentStack(stack)) return <NotesShell />;
  if (topLayer.view === 'tasks-list') return <Suspense fallback={null}><ActionsView /></Suspense>;
  if (topLayer.view === 'task-detail') return <Suspense fallback={null}><TaskList /></Suspense>;
  if (topLayer.view === 'strategy-detail' && SHOW_STRATEGY && StrategyView) return <Suspense fallback={null}><StrategyView /></Suspense>;
  if (topLayer.view === 'document-detail') return <Suspense fallback={null}><DocumentDetailView documentId={topLayer.documentId} /></Suspense>;
  if (topLayer.view === 'inbox-list') return <Suspense fallback={null}><InboxListView /></Suspense>;
  if (topLayer.view === 'settings') return <Suspense fallback={null}><SettingsPage /></Suspense>;
  return null;
}

export function App() {
  useVisualViewportFix();
  const { stack } = useNavigationState();
  const topLayer = stack[stack.length - 1];

  return (
    <WizardProvider>
      <AppShell>
        <ActiveView stack={stack} topLayer={topLayer} />
      </AppShell>
    </WizardProvider>
  );
}
