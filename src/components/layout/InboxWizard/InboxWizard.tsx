import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useQuery, usePowerSync } from '@powersync/react';
import type { ItemRow } from '@/lib/db';
import { insertItem, patchItem } from '@/lib/db';
import { extractNoteTitle, extractTitleFromFirstLine } from '@/features/notes/noteUtils';
import styles from './InboxWizard.module.css';

type InboxWizardProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function InboxWizard({ open, onOpenChange }: InboxWizardProps) {
  const db = usePowerSync();
  const [editTitle, setEditTitle] = useState('');

  // Reactive inbox notes query
  const { data: inboxNotes } = useQuery<ItemRow>(
    "SELECT * FROM items WHERE type = 'note' AND inbox_at IS NOT NULL AND is_trashed = 0 ORDER BY inbox_at ASC, id ASC"
  );

  // Reactive trashed captures query
  const { data: trashedCaptures } = useQuery<ItemRow>(
    "SELECT * FROM items WHERE type = 'capture' AND is_trashed = 1 ORDER BY trashed_at DESC, id ASC"
  );

  // Keep editTitle in sync with the first inbox note
  useEffect(() => {
    if (inboxNotes.length === 0) {
      setEditTitle('');
      return;
    }
    const note = inboxNotes[0];
    setEditTitle(extractNoteTitle(note.content ?? null, note.title ?? ''));
  }, [inboxNotes]);

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

  const markCaptureProcessed = async (
    noteId: string,
    resultType: string,
    resultId: string | null,
    timestamp: string,
  ) => {
    if (!db) return;
    const captures = await db.getAll<ItemRow>(
      "SELECT * FROM items WHERE type = 'capture' AND result_id = ? LIMIT 1",
      [noteId]
    );
    if (captures.length > 0) {
      await patchItem(db, captures[0].id, {
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
    await patchItem(db, currentNote.id, {
      title: editTitle.trim() || 'Untitled',
      inbox_at: null,
      subtype: null,
      updated_at: timestamp,
    });
    await markCaptureProcessed(currentNote.id, 'note', currentNote.id, timestamp);
  };

  const handleConvertToTask = async () => {
    if (!db || !currentNote) return;
    const timestamp = new Date().toISOString();
    const taskId = uuidv4();
    await insertItem(db, {
      id: taskId,
      type: 'task',
      parent_id: null,
      title: editTitle.trim() || 'Untitled',
      content: currentNote.content ?? null,
      tags: null,
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
    await patchItem(db, currentNote.id, { inbox_at: null, is_trashed: true, trashed_at: timestamp, updated_at: timestamp });
    await markCaptureProcessed(currentNote.id, 'task', taskId, timestamp);
  };

  const handleConvertToSource = async () => {
    if (!db || !currentNote) return;
    const timestamp = new Date().toISOString();
    const sourceId = uuidv4();
    await insertItem(db, {
      id: sourceId,
      type: 'source',
      parent_id: null,
      title: editTitle.trim() || null,
      url: currentNote.content?.trim() ?? '',
      subtype: 'text',
      inbox_at: null,
      is_pinned: false,
      item_status: 'active',
      completed: false,
      is_next: false,
      is_someday: false,
      is_waiting: false,
      processed: false,
      created_at: timestamp,
      updated_at: timestamp,
    });
    await patchItem(db, currentNote.id, { inbox_at: null, is_trashed: true, trashed_at: timestamp, updated_at: timestamp });
    await markCaptureProcessed(currentNote.id, 'source', sourceId, timestamp);
  };

  const handleConvertToProject = async () => {
    if (!db || !currentNote) return;
    const timestamp = new Date().toISOString();
    const projectId = uuidv4();
    await insertItem(db, {
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
    });
    await patchItem(db, currentNote.id, { inbox_at: null, is_trashed: true, trashed_at: timestamp, updated_at: timestamp });
    await markCaptureProcessed(currentNote.id, 'project', projectId, timestamp);
  };

  const handleTrash = async () => {
    if (!db || !currentNote) return;
    const timestamp = new Date().toISOString();
    await patchItem(db, currentNote.id, {
      is_trashed: true,
      trashed_at: timestamp,
      inbox_at: null,
      updated_at: timestamp,
    });
    await markCaptureProcessed(currentNote.id, 'discarded', null, timestamp);
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
            onClick={() => void handleKeep()}
          >
            Keep
          </button>
          <button
            type="button"
            className={styles.actionButton}
            onClick={() => void handleConvertToTask()}
          >
            To Task
          </button>
          <button
            type="button"
            className={styles.actionButton}
            onClick={() => void handleConvertToProject()}
          >
            To Project
          </button>
          <button
            type="button"
            className={styles.actionButton}
            onClick={() => void handleConvertToSource()}
          >
            To Source
          </button>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.actionButtonDanger}`}
            onClick={() => void handleTrash()}
          >
            Trash
          </button>
        </div>
      </div>
    </div>
  );
}
