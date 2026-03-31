import { useNavigationState } from '@/components/providers';
import { DocumentDetailView } from '@/features/documents/DocumentDetailView';
import { NotesOverview } from '../NotesOverview/NotesOverview';
import { NotesList } from '../NotesList/NotesList';
import type { NoteGroup } from '../hooks/useGroupedNotes';
import styles from './NotesDesktopShell.module.css';

export function NotesDesktopShell() {
  const { stack } = useNavigationState();

  const notesListIndex = stack.findLastIndex((layer) => layer.view === 'notes-list');
  const notesListLayer = notesListIndex === -1
    ? undefined
    : stack[notesListIndex] as { view: 'notes-list'; group: NoteGroup };

  const noteDocumentLayer = notesListIndex === -1
    ? undefined
    : stack
      .slice(notesListIndex + 1)
      .findLast((layer) => layer.view === 'document-detail') as
        | { view: 'document-detail'; documentId: string }
        | undefined;

  return (
    <div className={styles.shell}>
      <div className={styles.paneOverview}>
        <NotesOverview />
      </div>
      <div className={styles.paneList}>
        {notesListLayer ? <NotesList group={notesListLayer.group} /> : null}
      </div>
      <div className={styles.paneDetail}>
        {noteDocumentLayer ? (
          <DocumentDetailView documentId={noteDocumentLayer.documentId} />
        ) : null}
      </div>
    </div>
  );
}
