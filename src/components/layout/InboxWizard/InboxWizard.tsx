

import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useDatabase } from '@/hooks/useDatabase';
import type { NoteDocument } from '@/lib/db';
import { extractNoteTitle, extractTitleFromFirstLine } from '@/features/notes/noteUtils';
import styles from './InboxWizard.module.css';

type InboxWizardProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function InboxWizard({ open, onOpenChange }: InboxWizardProps) {
  const { db, isReady } = useDatabase();
  const [inboxNotes, setInboxNotes] = useState<NoteDocument[]>([]);
  const [trashedCaptures, setTrashedCaptures] = useState<NoteDocument[]>([]);
  const [editTitle, setEditTitle] = useState('');

  // Subscribe to inbox notes
  useEffect(() => {
    if (!db || !isReady) return;
    const subscription = db.notes
      .find({
        selector: { inbox_at: { $ne: null }, is_trashed: false },
        sort: [{ inbox_at: 'asc' }, { id: 'asc' }],
      })
      .$.subscribe((docs) => {
        const nextNotes = docs.map((doc) => doc.toJSON() as NoteDocument);
        setInboxNotes(nextNotes);
        if (nextNotes.length === 0) {
          setEditTitle('');
          return;
        }
        const note = nextNotes[0];
        setEditTitle(extractNoteTitle(note.content, note.title));
      });
    return () => subscription.unsubscribe();
  }, [db, isReady]);

  // Subscribe to trashed captures
  useEffect(() => {
    if (!db || !isReady) return;
    const subscription = db.notes
      .find({
        selector: { note_type: 'capture', is_trashed: true },
        sort: [{ trashed_at: 'desc' }, { id: 'asc' }],
      })
      .$.subscribe((docs) => {
        setTrashedCaptures(docs.map((doc) => doc.toJSON() as NoteDocument));
      });
    return () => subscription.unsubscribe();
  }, [db, isReady]);

  // Body scroll lock
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const currentNote = inboxNotes[0];
  const remaining = inboxNotes.length;

  const advanceToNext = () => {
    // The reactive subscription will update the list.
    // Keep currentIndex the same — the processed item will be removed from the list.
  };

  const handleKeep = async () => {
    if (!db || !currentNote) return;
    const doc = await db.notes.findOne(currentNote.id).exec();
    if (!doc) return;
    await doc.patch({
      title: editTitle.trim() || 'Untitled',
      inbox_at: null,
      note_type: null,
      updated_at: new Date().toISOString(),
    });
    advanceToNext();
  };

  const handleConvertToTask = async () => {
    if (!db || !currentNote) return;
    const timestamp = new Date().toISOString();
    await db.tasks.insert({
      id: uuidv4(),
      project_id: null,
      area_id: null,
      title: editTitle.trim() || 'Untitled',
      description: currentNote.content,
      completed: false,
      is_someday: false,
      is_next: false,
      is_waiting: false,
      waiting_note: null,
      waiting_started_at: null,
      start_date: null,
      due_date: null,
      tags: [],
      content: null,
      priority: null,
      depends_on: null,
      okr_id: null,
      created_at: timestamp,
      updated_at: timestamp,
      is_trashed: false,
      trashed_at: null,
    });
    const doc = await db.notes.findOne(currentNote.id).exec();
    if (doc) {
      await doc.patch({
        is_trashed: true,
        trashed_at: timestamp,
        inbox_at: null,
        updated_at: timestamp,
      });
    }
    advanceToNext();
  };

  const handleConvertToSource = async () => {
    if (!db || !currentNote) return;
    const timestamp = new Date().toISOString();
    await db.sources.insert({
      id: uuidv4(),
      url: currentNote.content?.trim() ?? '',
      title: editTitle.trim() || null,
      content_type: 'article',
      read_status: 'inbox',
      created_at: timestamp,
      updated_at: timestamp,
      is_trashed: false,
      trashed_at: null,
    });
    const doc = await db.notes.findOne(currentNote.id).exec();
    if (doc) {
      await doc.patch({
        is_trashed: true,
        trashed_at: timestamp,
        inbox_at: null,
        updated_at: timestamp,
      });
    }
    advanceToNext();
  };

  const handleConvertToProject = async () => {
    if (!db || !currentNote) return;
    const timestamp = new Date().toISOString();
    await db.projects.insert({
      id: uuidv4(),
      title: editTitle.trim() || 'Untitled',
      description: null,
      status: 'backlog',
      area_id: null,
      okr_id: null,
      start_date: null,
      due_date: null,
      created_at: timestamp,
      updated_at: timestamp,
      is_trashed: false,
      trashed_at: null,
    });
    const doc = await db.notes.findOne(currentNote.id).exec();
    if (doc) {
      await doc.patch({
        is_trashed: true,
        trashed_at: timestamp,
        inbox_at: null,
        updated_at: timestamp,
      });
    }
    advanceToNext();
  };

  const handleTrash = async () => {
    if (!db || !currentNote) return;
    const timestamp = new Date().toISOString();
    const doc = await db.notes.findOne(currentNote.id).exec();
    if (doc) {
      await doc.patch({
        is_trashed: true,
        trashed_at: timestamp,
        inbox_at: null,
        updated_at: timestamp,
      });
    }
    advanceToNext();
  };

  const handleExtractTitle = () => {
    if (!currentNote) return;
    setEditTitle(extractTitleFromFirstLine(currentNote.content));
  };

  // Empty state
  if (remaining === 0) {
    return (
      <div className={styles.backdrop}>
        <div className={styles.container}>
          <div className={styles.header}>
            <span className={styles.headerTitle}>Inbox</span>
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => onOpenChange(false)}
            >
              Close
            </button>
          </div>
          <div className={styles.emptyState}>
            <div className={styles.emptyTitle}>Inbox empty</div>
            <div className={styles.emptySubtitle}>
              All items have been processed
            </div>
            <button
              type="button"
              className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
              onClick={() => onOpenChange(false)}
            >
              Done
            </button>
          </div>
          {trashedCaptures.length > 0 && (
            <div className={styles.trashSection}>
              <span className={styles.trashSectionTitle}>Inbox Trash</span>
              <div className={styles.trashList}>
                {trashedCaptures.map((note) => (
                  <div key={note.id} className={styles.trashItem}>
                    <span className={styles.trashItemContent}>
                      {note.content?.trim() || '(empty)'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.backdrop}>
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.headerTitle}>Inbox</span>
          <span className={styles.remaining}>{remaining} remaining</span>
          <button
            type="button"
            className={styles.closeButton}
            onClick={() => onOpenChange(false)}
          >
            Close
          </button>
        </div>

        <input
          type="text"
          className={styles.titleInput}
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="Title"
        />

        <button
          type="button"
          className={styles.extractButton}
          onClick={handleExtractTitle}
        >
          Use first line as title
        </button>

        <div className={styles.bodyPreview}>
          {currentNote?.content || '(empty)'}
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
            onClick={handleKeep}
          >
            Keep
          </button>
          <button
            type="button"
            className={styles.actionButton}
            onClick={handleConvertToTask}
          >
            To Task
          </button>
          <button
            type="button"
            className={styles.actionButton}
            onClick={handleConvertToProject}
          >
            To Project
          </button>
          <button
            type="button"
            className={styles.actionButton}
            onClick={handleConvertToSource}
          >
            To Source
          </button>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.actionButtonDanger}`}
            onClick={handleTrash}
          >
            Trash
          </button>
        </div>
      </div>
    </div>
  );
}
