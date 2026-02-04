'use client';

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
  const [currentIndex, setCurrentIndex] = useState(0);
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
        setInboxNotes(docs.map((doc) => doc.toJSON()));
      });
    return () => subscription.unsubscribe();
  }, [db, isReady]);

  // When notes change, clamp index and sync title
  useEffect(() => {
    if (inboxNotes.length === 0) {
      setCurrentIndex(0);
      setEditTitle('');
      return;
    }
    const idx = Math.min(currentIndex, inboxNotes.length - 1);
    setCurrentIndex(idx);
    const note = inboxNotes[idx];
    if (note) {
      setEditTitle(extractNoteTitle(note.content, note.title));
    }
  }, [inboxNotes, currentIndex]);

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

  const currentNote = inboxNotes[currentIndex];
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
      title: editTitle.trim() || 'Untitled',
      description: currentNote.content,
      status: 'backlog',
      completed: false,
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

  const handleConvertToProject = async () => {
    if (!db || !currentNote) return;
    const timestamp = new Date().toISOString();
    await db.projects.insert({
      id: uuidv4(),
      title: editTitle.trim() || 'Untitled',
      description: null,
      status: 'backlog',
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
