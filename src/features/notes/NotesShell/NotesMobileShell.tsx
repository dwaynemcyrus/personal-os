import { useNavigationState, useNavigationActions } from '@/components/providers';
import { DocumentDetailView } from '@/features/documents/DocumentDetailView';
import { useSwipeBack } from '@/hooks/useSwipeBack';
import { NotesList } from '../NotesList/NotesList';
import styles from './NotesMobileShell.module.css';

export function NotesMobileShell() {
  const { stack } = useNavigationState();
  const { goBack } = useNavigationActions();

  useSwipeBack({ onBack: goBack, enabled: stack.length > 0 });

  const topLayer = stack[stack.length - 1];

  // Document detail stays inside the notes shell on mobile so the AppShell content area can scroll.
  if (topLayer?.view === 'document-detail') {
    return <DocumentDetailView documentId={topLayer.documentId} />;
  }

  return (
    <div className={styles.shell}>
      {topLayer?.view === 'notes-list' && (
        <div className={styles.page}>
          <NotesList group={topLayer.group} />
        </div>
      )}
    </div>
  );
}
