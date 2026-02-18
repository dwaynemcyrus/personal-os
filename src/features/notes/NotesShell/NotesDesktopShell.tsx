'use client';

import { usePathname } from 'next/navigation';
import { NotesOverview } from '../NotesOverview/NotesOverview';
import { NotesList } from '../NotesList/NotesList';
import { NoteDetailPage } from '../NoteDetailPage/NoteDetailPage';
import type { NoteGroup } from '../hooks/useGroupedNotes';
import styles from './NotesDesktopShell.module.css';

const VALID_GROUPS = new Set(['all', 'todo', 'today', 'locked', 'pinned', 'trash']);

function parseNotesPath(pathname: string): {
  group: NoteGroup | null;
  noteId: string | null;
} {
  const parts = pathname.replace(/^\/notes\/?/, '').split('/').filter(Boolean);
  const group = parts[0] && VALID_GROUPS.has(parts[0]) ? (parts[0] as NoteGroup) : null;
  const noteId = parts[1] ?? null;
  return { group, noteId };
}

export function NotesDesktopShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { group, noteId } = parseNotesPath(pathname);

  return (
    <div className={styles.shell}>
      <div className={styles.paneOverview}>
        <NotesOverview />
      </div>
      <div className={styles.paneList}>
        {group ? <NotesList group={group} /> : null}
      </div>
      <div className={styles.paneDetail}>
        {noteId && group ? (
          <NoteDetailPage noteId={noteId} group={group} />
        ) : null}
      </div>
    </div>
  );
}
