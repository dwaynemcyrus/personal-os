import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useDatabase } from '@/hooks/useDatabase';
import type { ItemDocument } from '@/lib/db';
import { extractNoteTitle, extractTitleFromFirstLine } from '@/features/notes/noteUtils';
import styles from './InboxWizard.module.css';

type InboxWizardProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function InboxWizard({ open, onOpenChange }: InboxWizardProps) {
  const { db, isReady } = useDatabase();
  const [inboxNotes, setInboxNotes] = useState<ItemDocument[]>([]);
  const [trashedCaptures, setTrashedCaptures] = useState<ItemDocument[]>([]);
  const [editTitle, setEditTitle] = useState('');

  // Subscribe to inbox notes
  useEffect(() => {
    if (!db || !isReady) return;
    const subscription = db.items
      .find({
        selector: { type: 'note', inbox_at: { $ne: null }, is_trashed: false },
        sort: [{ inbox_at: 'asc' }, { id: 'asc' }],
      })
      .$.subscribe((docs) => {
        const nextNotes = docs.map((doc) => doc.toJSON() as ItemDocument);
        setInboxNotes(nextNotes);
        if (nextNotes.length === 0) {
          setEditTitle('');
          return;
        }
        const note = nextNotes[0];
        setEditTitle(extractNoteTitle(note.content ?? null, note.title ?? ''));
      });
    return () => subscription.unsubscribe();
  }, [db, isReady]);

  // Subscribe to trashed captures (for trash section)
  useEffect(() => {
    if (!db || !isReady) return;
    const subscription = db.items
      .find({
        selector: { type: 'capture', is_trashed: true },
        sort: [{ trashed_at: 'desc' }, { id: 'asc' }],
      })
      .$.subscribe((docs) => {
        setTrashedCaptures(docs.map((doc) => doc.toJSON() as ItemDocument));
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
    // The reactive subscription will update the list automatically.
  };

  const markCaptureProcessed = async (
    noteId: string,
    resultType: string,
    resultId: string | null,
    timestamp: string,
  ) => {
    if (!db) return;
    const capture = await db.items.findOne({ selector: { type: 'capture', result_id: noteId } }).exec();
    if (capture) {
      await capture.patch({
        processed: true,
        processed_at: timestamp,
        result_type: resultType,
        result_id: resultId,
        updated_at: timestamp,
      });
    }
  };

  const handleKeep = async () => {
    if (!db || !currentNote) return;
    const timestamp = new Date().toISOString();
    const doc = await db.items.findOne(currentNote.id).exec();
    if (!doc) return;
    await doc.patch({
      title: editTitle.trim() || 'Untitled',
      inbox_at: null,
      subtype: null,
      updated_at: timestamp,
    });
    await markCaptureProcessed(currentNote.id, 'note', currentNote.id, timestamp);
    advanceToNext();
  };

  const handleConvertToTask = async () => {
    if (!db || !currentNote) return;
    const timestamp = new Date().toISOString();
    const taskId = uuidv4();
    await db.items.insert({
      id: taskId,
      type: 'task',
      parent_id: null,
      title: editTitle.trim() || 'Untitled',
      content: currentNote.content ?? null,
      tags: [],
      is_pinned: false,
      item_status: 'backlog',
      completed: false,
      is_next: false,
      is_someday: false,
      is_waiting: false,
      processed: false,
      created_at: timestamp,
      updated_at: timestamp,
      is_trashed: false,
      trashed_at: null,
    });
    const doc = await db.items.findOne(currentNote.id).exec();
    if (doc) {
      await doc.patch({ inbox_at: null, is_trashed: true, trashed_at: timestamp, updated_at: timestamp });
    }
    await markCaptureProcessed(currentNote.id, 'task', taskId, timestamp);
    advanceToNext();
  };

  const handleConvertToSource = async () => {
    if (!db || !currentNote) return;
    const timestamp = new Date().toISOString();
    const sourceId = uuidv4();
    await db.items.insert({
      id: sourceId,
      type: 'source',
      parent_id: null,
      title: editTitle.trim() || null,
      url: currentNote.content?.trim() ?? '',
      content_type: 'text',
      read_status: 'inbox',
      is_pinned: false,
      item_status: 'active',
      completed: false,
      is_next: false,
      is_someday: false,
      is_waiting: false,
      processed: false,
      created_at: timestamp,
      updated_at: timestamp,
      is_trashed: false,
      trashed_at: null,
    });
    const doc = await db.items.findOne(currentNote.id).exec();
    if (doc) {
      await doc.patch({ inbox_at: null, is_trashed: true, trashed_at: timestamp, updated_at: timestamp });
    }
    await markCaptureProcessed(currentNote.id, 'source', sourceId, timestamp);
    advanceToNext();
  };

  const handleConvertToProject = async () => {
    if (!db || !currentNote) return;
    const timestamp = new Date().toISOString();
    const projectId = uuidv4();
    await db.items.insert({
      id: projectId,
      type: 'project',
      parent_id: null,
      title: editTitle.trim() || 'Untitled',
      item_status: 'backlog',
      is_pinned: false,
      completed: false,
      is_next: false,
      is_someday: false,
      is_waiting: false,
      processed: false,
      created_at: timestamp,
      updated_at: timestamp,
      is_trashed: false,
      trashed_at: null,
    });
    const doc = await db.items.findOne(currentNote.id).exec();
    if (doc) {
      await doc.patch({ inbox_at: null, is_trashed: true, trashed_at: timestamp, updated_at: timestamp });
    }
    await markCaptureProcessed(currentNote.id, 'project', projectId, timestamp);
    advanceToNext();
  };

  const handleTrash = async () => {
    if (!db || !currentNote) return;
    const timestamp = new Date().toISOString();
    const doc = await db.items.findOne(currentNote.id).exec();
    if (doc) {
      await doc.patch({
        is_trashed: true,
        trashed_at: timestamp,
        inbox_at: null,
        updated_at: timestamp,
      });
    }
    await markCaptureProcessed(currentNote.id, 'discarded', null, timestamp);
    advanceToNext();
  };

  const handleExtractTitle = () => {
    if (!currentNote) return;
    setEditTitle(extractTitleFromFirstLine(currentNote.content ?? null));
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
                {trashedCaptures.map((capture) => (
                  <div key={capture.id} className={styles.trashItem}>
                    <span className={styles.trashItemContent}>
                      {capture.body?.trim() || '(empty)'}
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
