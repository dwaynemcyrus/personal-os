import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { showToast } from '@/components/ui/Toast';
import { createItemHistorySnapshot, listItemHistory } from '@/lib/itemHistory';
import { queryClient } from '@/lib/queryClient';
import { formatRelativeTime } from '@/features/notes/noteUtils';
import type { ItemHistoryRow } from '@/lib/db';
import styles from './DocumentHistorySheet.module.css';

type DocumentHistorySheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  getCurrentSnapshot: () => string;
  getSourceUpdatedAt: () => string | null;
  onRestoreSnapshot: (snapshot: string) => Promise<void>;
};

export function DocumentHistorySheet({
  open,
  onOpenChange,
  itemId,
  getCurrentSnapshot,
  getSourceUpdatedAt,
  onRestoreSnapshot,
}: DocumentHistorySheetProps) {
  const [selected, setSelected] = useState<ItemHistoryRow | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isSavingCheckpoint, setIsSavingCheckpoint] = useState(false);

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['item-history', itemId],
    queryFn: () => listItemHistory(itemId),
    enabled: open,
    staleTime: 30_000,
  });

  const handleClose = () => {
    setSelected(null);
    onOpenChange(false);
  };

  const handleManualCheckpoint = async () => {
    setIsSavingCheckpoint(true);
    try {
      const { created } = await createItemHistorySnapshot({
        itemId,
        snapshot: getCurrentSnapshot(),
        createdBy: 'manual',
        changeSummary: 'Manual checkpoint',
        sourceUpdatedAt: getSourceUpdatedAt(),
      });
      await queryClient.invalidateQueries({ queryKey: ['item-history', itemId] });
      showToast(created ? 'Checkpoint saved.' : 'No changes since the latest snapshot.');
    } catch {
      showToast('Could not save checkpoint — try again.');
    } finally {
      setIsSavingCheckpoint(false);
    }
  };

  const handleRestore = async () => {
    if (!selected) return;
    setIsRestoring(true);
    try {
      await createItemHistorySnapshot({
        itemId,
        snapshot: getCurrentSnapshot(),
        createdBy: 'restore_guard',
        changeSummary: 'Before restore',
        sourceUpdatedAt: getSourceUpdatedAt(),
      });
      await onRestoreSnapshot(selected.snapshot);
      await queryClient.invalidateQueries({ queryKey: ['item-history', itemId] });
      handleClose();
    } catch {
      showToast('Could not restore snapshot — try again.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => { if (!nextOpen) handleClose(); }}>
      <SheetContent side="bottom" ariaLabel="Version history" className={styles.sheet}>
        {selected ? (
          <>
            <div className={styles.header}>
              <button type="button" className={styles.backBtn} onClick={() => setSelected(null)}>
                Back
              </button>
              <div className={styles.headerMeta}>
                <span className={styles.createdBy} data-type={selected.created_by}>
                  {selected.created_by}
                </span>
                <span className={styles.timestamp}>{formatRelativeTime(selected.created_at)}</span>
              </div>
              <button
                type="button"
                className={styles.restoreBtn}
                onClick={() => void handleRestore()}
                disabled={isRestoring}
              >
                {isRestoring ? 'Restoring…' : 'Restore'}
              </button>
            </div>
            {selected.change_summary ? (
              <p className={styles.summary}>{selected.change_summary}</p>
            ) : null}
            <div className={styles.preview}>
              <pre className={styles.previewContent}>{selected.snapshot}</pre>
            </div>
          </>
        ) : (
          <>
            <div className={styles.header}>
              <div className={styles.headerMeta}>
                <span className={styles.title}>Version History</span>
                {!isLoading ? <span className={styles.count}>{history.length}</span> : null}
              </div>
              <button
                type="button"
                className={styles.restoreBtn}
                onClick={() => void handleManualCheckpoint()}
                disabled={isSavingCheckpoint}
              >
                {isSavingCheckpoint ? 'Saving…' : 'Checkpoint'}
              </button>
            </div>
            {isLoading ? (
              <p className={styles.empty}>Loading…</p>
            ) : history.length === 0 ? (
              <p className={styles.empty}>No saved versions yet. Auto snapshots are created every 10 minutes while editing, and you can save checkpoints manually.</p>
            ) : (
              <ul className={styles.list}>
                {history.map((entry, index) => (
                  <li key={entry.id}>
                    <button
                      type="button"
                      className={styles.item}
                      onClick={() => setSelected(entry)}
                    >
                      <div className={styles.itemLeft}>
                        <span className={styles.versionNum}>v{history.length - index}</span>
                        <span className={styles.createdBy} data-type={entry.created_by}>
                          {entry.created_by}
                        </span>
                        {entry.change_summary ? (
                          <span className={styles.itemSummary}>{entry.change_summary}</span>
                        ) : null}
                      </div>
                      <span className={styles.timestamp}>{formatRelativeTime(entry.created_at)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
