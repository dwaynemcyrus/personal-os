import { useNavigationState, useNavigationActions } from '@/components/providers';
import { useSwipeBack } from '@/hooks/useSwipeBack';
import { NotesList } from '../NotesList/NotesList';
import { NoteDetailPage } from '../NoteDetailPage/NoteDetailPage';
import styles from './NotesMobileShell.module.css';

export function NotesMobileShell() {
  const { stack } = useNavigationState();
  const { goBack } = useNavigationActions();

  useSwipeBack({ onBack: goBack, enabled: stack.length > 0 });

  const topLayer = stack[stack.length - 1];

  // Note detail: no overflow:hidden wrappers — AppShell content area scrolls
  if (topLayer?.view === 'note-detail') {
    return <NoteDetailPage noteId={topLayer.noteId} />;
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
