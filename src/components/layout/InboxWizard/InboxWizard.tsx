import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import type { ItemRow } from '@/lib/db';
import { insertItem, patchItem } from '@/lib/db';
import { extractNoteTitle, extractTitleFromFirstLine } from '@/features/notes/noteUtils';
import styles from './InboxWizard.module.css';

type InboxWizardProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function InboxWizard({ open, onOpenChange }: InboxWizardProps) {
  const [editTitle, setEditTitle] = useState('');

  const { data: inboxNotes = [] } = useQuery({
    queryKey: ['inbox'],
    queryFn: async (): Promise<ItemRow[]> => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('type', 'note')
        .not('inbox_at', 'is', null)
        .eq('is_trashed', false)
        .order('inbox_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as ItemRow[];
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const { data: trashedCaptures = [] } = useQuery({
    queryKey: ['captures', 'trashed'],
    queryFn: async (): Promise<ItemRow[]> => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('type', 'capture')
        .eq('is_trashed', true)
        .order('trashed_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ItemRow[];
    },
    staleTime: 60_000,
  });

  const currentNote = inboxNotes[0];
  const currentContent = currentNote?.content ?? null;

  useEffect(() => {
    if (inboxNotes.length === 0) { setEditTitle(''); return; }
    const note = inboxNotes[0];
    setEditTitle(extractNoteTitle(currentContent, note.title ?? ''));
  }, [inboxNotes, currentContent]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  const remaining = inboxNotes.length;

  const invalidateInbox = () => {
    queryClient.invalidateQueries({ queryKey: ['inbox'] });
    queryClient.invalidateQueries({ queryKey: ['notes', 'list'] });
    queryClient.invalidateQueries({ queryKey: ['notes', 'counts'] });
  };

  const markCaptureProcessed = async (
    noteId: string,
    resultType: string,
    resultId: string | null,
    timestamp: string,
  ) => {
    const { data: captures } = await supabase
      .from('items')
      .select('id')
      .eq('type', 'capture')
      .eq('result_id', noteId)
      .limit(1);
    if (captures && captures.length > 0) {
      await patchItem(captures[0].id, {
        processed: true,
        processed_at: timestamp,
        result_type: resultType,
        result_id: resultId,
        updated_at: timestamp,
      });
      queryClient.invalidateQueries({ queryKey: ['captures', 'trashed'] });
    }
  };

  const handleKeep = async () => {
    if (!currentNote) return;
    const timestamp = new Date().toISOString();
    await patchItem(currentNote.id, {
      title: editTitle.trim() || 'Untitled',
      inbox_at: null,
      subtype: null,
      updated_at: timestamp,
    });
    await markCaptureProcessed(currentNote.id, 'note', currentNote.id, timestamp);
    invalidateInbox();
  };

  const handleConvertToTask = async () => {
    if (!currentNote) return;
    const timestamp = new Date().toISOString();
    const taskId = uuidv4();
    await insertItem({
      id: taskId,
      type: 'action',
      subtype: 'task',
      status: 'active',
      date_trashed: null,
      parent_id: null,
      title: editTitle.trim() || 'Untitled',
      content: currentContent ?? null,
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
    await patchItem(currentNote.id, { inbox_at: null, is_trashed: true, trashed_at: timestamp, updated_at: timestamp });
    await markCaptureProcessed(currentNote.id, 'task', taskId, timestamp);
    invalidateInbox();
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

  const handleConvertToSource = async () => {
    if (!currentNote) return;
    const timestamp = new Date().toISOString();
    const sourceId = uuidv4();
    await insertItem({
      id: sourceId,
      type: 'source',
      parent_id: null,
      title: editTitle.trim() || null,
      url: currentContent?.trim() ?? '',
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
    await patchItem(currentNote.id, { inbox_at: null, is_trashed: true, trashed_at: timestamp, updated_at: timestamp });
    await markCaptureProcessed(currentNote.id, 'source', sourceId, timestamp);
    invalidateInbox();
    queryClient.invalidateQueries({ queryKey: ['sources'] });
  };

  const handleConvertToProject = async () => {
    if (!currentNote) return;
    const timestamp = new Date().toISOString();
    const projectId = uuidv4();
    await insertItem({
      id: projectId,
      type: 'action',
      subtype: 'project',
      status: 'backlog',
      date_trashed: null,
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
    await patchItem(currentNote.id, { inbox_at: null, is_trashed: true, trashed_at: timestamp, updated_at: timestamp });
    await markCaptureProcessed(currentNote.id, 'project', projectId, timestamp);
    invalidateInbox();
    queryClient.invalidateQueries({ queryKey: ['projects'] });
  };

  const handleTrash = async () => {
    if (!currentNote) return;
    const timestamp = new Date().toISOString();
    await patchItem(currentNote.id, { is_trashed: true, trashed_at: timestamp, inbox_at: null, updated_at: timestamp });
    await markCaptureProcessed(currentNote.id, 'discarded', null, timestamp);
    invalidateInbox();
  };

  const handleExtractTitle = () => {
    if (!currentNote) return;
    setEditTitle(extractTitleFromFirstLine(currentContent));
  };

  // Empty state
  if (remaining === 0) {
    return (
      <div className={styles.backdrop}>
        <div className={styles.container}>
          <div className={styles.header}>
            <span className={styles.headerTitle}>Inbox</span>
            <button type="button" className={styles.closeButton} onClick={() => onOpenChange(false)}>
              Close
            </button>
          </div>
          <div className={styles.emptyState}>
            <div className={styles.emptyTitle}>Inbox empty</div>
            <div className={styles.emptySubtitle}>All items have been processed</div>
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
          <button type="button" className={styles.closeButton} onClick={() => onOpenChange(false)}>
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

        <button type="button" className={styles.extractButton} onClick={handleExtractTitle}>
          Use first line as title
        </button>

        <div className={styles.bodyPreview}>
          {currentContent || '(empty)'}
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
            onClick={() => void handleKeep()}
          >
            Keep
          </button>
          <button type="button" className={styles.actionButton} onClick={() => void handleConvertToTask()}>
            To Task
          </button>
          <button type="button" className={styles.actionButton} onClick={() => void handleConvertToProject()}>
            To Project
          </button>
          <button type="button" className={styles.actionButton} onClick={() => void handleConvertToSource()}>
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
