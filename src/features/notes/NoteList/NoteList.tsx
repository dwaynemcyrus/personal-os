'use client';

import { useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useDatabase } from '@/hooks/useDatabase';
import type { NoteDocument } from '@/lib/db';
import { useNavigationActions } from '@/components/providers';
import {
  extractNoteSnippet,
  extractNoteTitle,
  formatNoteTitle,
  formatRelativeTime,
} from '../noteUtils';
import styles from './NoteList.module.css';

const nowIso = () => new Date().toISOString();

export function NoteList() {
  const { db, isReady } = useDatabase();
  const [notes, setNotes] = useState<NoteDocument[]>([]);

  const { pushLayer } = useNavigationActions();

  useEffect(() => {
    if (!db || !isReady) return;

    const subscription = db.notes
      .find({
        selector: { is_trashed: false },
        sort: [{ updated_at: 'desc' }, { id: 'asc' }],
      })
      .$.subscribe((docs) => {
        setNotes(docs.map((doc) => doc.toJSON()));
      });

    return () => subscription.unsubscribe();
  }, [db, isReady]);

  const notePreviews = useMemo(
    () =>
      notes.map((note) => {
        const rawTitle = extractNoteTitle(note.content, note.title);
        return {
          id: note.id,
          title: formatNoteTitle(rawTitle),
          snippet: extractNoteSnippet(note.content),
          updatedLabel: formatRelativeTime(note.updated_at),
        };
      }),
    [notes]
  );

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
      created_at: timestamp,
      updated_at: timestamp,
      is_trashed: false,
      trashed_at: null,
    });
    pushLayer({ view: 'note-detail', noteId });
  };

  const handleOpenNote = (noteId: string) => {
    pushLayer({ view: 'note-detail', noteId });
  };

  return (
    <div className={styles.notes}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>Notes</div>
        <button
          type="button"
          className={styles.newButton}
          onClick={handleCreateNote}
          disabled={!db || !isReady}
        >
          New note
        </button>
      </div>

      {notePreviews.length === 0 ? (
        <p className={styles.empty}>No notes yet.</p>
      ) : (
        <div className={styles.list}>
          {notePreviews.map((note) => (
            <button
              key={note.id}
              type="button"
              className={styles.item}
              onClick={() => handleOpenNote(note.id)}
            >
              <div className={styles.itemTitle}>{note.title}</div>
              {note.snippet ? (
                <div className={styles.itemSnippet}>{note.snippet}</div>
              ) : null}
              <div className={styles.itemMeta}>Updated {note.updatedLabel}</div>
            </button>
          ))}
        </div>
      )}

    </div>
  );
}
