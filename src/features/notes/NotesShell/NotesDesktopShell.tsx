import { useNavigationState } from '@/components/providers';
import { NotesOverview } from '../NotesOverview/NotesOverview';
import { NotesList } from '../NotesList/NotesList';
import { NoteDetailPage } from '../NoteDetailPage/NoteDetailPage';
import type { NoteGroup } from '../hooks/useGroupedNotes';
import styles from './NotesDesktopShell.module.css';

export function NotesDesktopShell() {
  const { stack } = useNavigationState();

  const notesListLayer = stack.find(
    (l) => l.view === 'notes-list'
  ) as { view: 'notes-list'; group: NoteGroup } | undefined;

  const noteDetailLayer = stack.find(
    (l) => l.view === 'note-detail'
  ) as { view: 'note-detail'; noteId: string } | undefined;

  return (
    <div className={styles.shell}>
      <div className={styles.paneOverview}>
        <NotesOverview />
      </div>
      <div className={styles.paneList}>
        {notesListLayer ? <NotesList group={notesListLayer.group} /> : null}
      </div>
      <div className={styles.paneDetail}>
        {noteDetailLayer ? (
          <NoteDetailPage noteId={noteDetailLayer.noteId} />
        ) : null}
      </div>
    </div>
  );
}
