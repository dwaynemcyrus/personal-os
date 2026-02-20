import { useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useDatabase } from '@/hooks/useDatabase';
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
import styles from './NotesList.module.css';

const GROUP_LABELS: Record<NoteGroup, string> = {
  all: 'Notes',
  todo: 'Todo',
  today: 'Today',
  locked: 'Locked',
  pinned: 'Pinned',
  trash: 'Trash',
};

const nowIso = () => new Date().toISOString();

type NotesListProps = {
  group: NoteGroup;
};

export function NotesList({ group }: NotesListProps) {
  const { db, isReady } = useDatabase();
  const { pushLayer, goBack } = useNavigationActions();
  const { notes, isLoading } = useGroupedNotes(group);

  const handleNotePress = (noteId: string) => {
    pushLayer({ view: 'note-detail', noteId });
  };

  const handleCreateNote = async () => {
    if (!db) return;
    const timestamp = nowIso();
    const noteId = uuidv4();
    await db.notes.insert({
      id: noteId,
      title: 'Untitled',
      content: '',
      inbox_at: null,
      note_type: null,
      is_pinned: false,
      properties: null,
      created_at: timestamp,
      updated_at: timestamp,
      is_trashed: false,
      trashed_at: null,
    });
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
            disabled={!db || !isReady}
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
            const title = formatNoteTitle(extractNoteTitle(note.content, note.title));
            const snippet = extractNoteSnippet(note.content);
            const updatedLabel = formatRelativeTime(note.updated_at);
            return (
              <button
                key={note.id}
                type="button"
                className={styles.item}
                onClick={() => handleNotePress(note.id)}
              >
                <div className={styles.itemTitleRow}>
                  <div className={styles.itemTitle}>{title}</div>
                  {note.is_pinned && <PinIcon />}
                </div>
                {snippet ? (
                  <div className={styles.itemSnippet}>{snippet}</div>
                ) : null}
                <div className={styles.itemMeta}>Updated {updatedLabel}</div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function BackIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function PinIcon() {
  return (
    <span className={styles.pinIcon} aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <path
          d="M8 4h8l-1.6 3.2c-.2.4-.2.8 0 1.2L16 12v4l-4-2.2L8 16v-4l1.6-3.6c.2-.4.2-.8 0-1.2L8 4z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}
