import { useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { queryClient } from '@/lib/queryClient';
import { useNavigationActions } from '@/components/providers';
import { showToast } from '@/components/ui/Toast';
import { useGroupedNotes } from '../hooks/useGroupedNotes';
import type { NoteGroup } from '../hooks/useGroupedNotes';
import {
  extractNoteSnippet,
  extractNoteTitle,
  formatNoteTitle,
  formatRelativeTime,
} from '../noteUtils';
import { nowIso } from '@/lib/time';
import { generateSlug } from '@/lib/slug';
import { insertItem } from '@/lib/db';
import { BackIcon, PlusIcon } from '@/components/ui/icons';
import styles from './NotesList.module.css';

const GROUP_LABELS: Record<NoteGroup, string> = {
  all: 'Notes',
  todo: 'Todo',
  today: 'Today',
  locked: 'Locked',
  pinned: 'Pinned',
  trash: 'Trash',
};

type NotesListProps = {
  group: NoteGroup;
};

export function NotesList({ group }: NotesListProps) {
  const { pushLayer, goBack } = useNavigationActions();
  const { notes, isLoading } = useGroupedNotes(group);

  const handleNotePress = (noteId: string) => {
    pushLayer({ view: 'note-detail', noteId });
  };

  const handleCreateNote = async () => {
    const timestamp = nowIso();
    const noteId = uuidv4();
    await insertItem({
      id: noteId,
      type: 'note',
      parent_id: null,
      title: 'Untitled',
      filename: generateSlug('Untitled'),
      content: '',
      inbox_at: null,
      subtype: null,
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
    queryClient.invalidateQueries({ queryKey: ['notes', 'list'] });
    queryClient.invalidateQueries({ queryKey: ['notes', 'counts'] });
    pushLayer({ view: 'note-detail', noteId });
  };

  const label = GROUP_LABELS[group] ?? 'Notes';
  const canCreate = group !== 'trash' && group !== 'locked';

  useEffect(() => {
    if (group === 'locked') {
      showToast('Locked notes coming soon');
    }
  }, [group]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.backButton}
          onClick={goBack}
          aria-label="Go back"
        >
          <BackIcon />
        </button>
        <h1 className={styles.title}>{label}</h1>
        {canCreate && (
          <button
            type="button"
            className={styles.newButton}
            onClick={handleCreateNote}
            aria-label="New note"
          >
            <PlusIcon />
          </button>
        )}
      </div>

      <div className={styles.list}>
        {isLoading ? (
          <p className={styles.empty}>Loading...</p>
        ) : notes.length === 0 ? (
          <p className={styles.empty}>No notes here yet.</p>
        ) : (
          notes.map((note) => {
            const title = formatNoteTitle(extractNoteTitle(note.content ?? null, note.title ?? ''));
            const snippet = extractNoteSnippet(note.content ?? null);
            const updatedLabel = formatRelativeTime(note.updated_at);
            return (
              <button
                key={note.id}
                type="button"
                className={styles.item}
                onClick={() => handleNotePress(note.id)}
              >
                <div className={styles.itemHeader}>
                  <div className={styles.itemTitle}>{title}</div>
                </div>
                {snippet ? (
                  <div className={styles.itemSnippet}>{snippet}</div>
                ) : null}
                <div className={styles.itemMeta}>
                  <span className={styles.itemDate}>{updatedLabel}</span>
                  {note.is_pinned ? (
                    <span className={styles.itemPinned}>Pinned</span>
                  ) : null}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
