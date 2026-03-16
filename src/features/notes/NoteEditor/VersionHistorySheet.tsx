import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { getVersions, saveVersion } from '@/lib/versions';
import { formatRelativeTime } from '../noteUtils';
import type { ItemVersionRow } from '@/lib/db';
import styles from './VersionHistorySheet.module.css';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noteId: string;
  currentContent: string;
  onRestore: (content: string) => void;
};

export function VersionHistorySheet({ open, onOpenChange, noteId, currentContent, onRestore }: Props) {
  const [selected, setSelected] = useState<ItemVersionRow | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['note', noteId, 'versions'],
    queryFn: () => getVersions(noteId),
    enabled: open,
    staleTime: 30_000,
  });

  const handleClose = () => {
    setSelected(null);
    onOpenChange(false);
  };

  const handleRestore = async () => {
    if (!selected) return;
    setIsRestoring(true);
    try {
      // Save current state as a manual checkpoint before overwriting
      await saveVersion(noteId, currentContent, null, 'manual', 'Before version restore');
      onRestore(selected.content ?? '');
      handleClose();
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <SheetContent side="bottom" ariaLabel="Version history" className={styles.sheet}>
        {selected ? (
          <>
            <div className={styles.header}>
              <button type="button" className={styles.backBtn} onClick={() => setSelected(null)}>
                ← Back
              </button>
              <div className={styles.headerMeta}>
                <span className={styles.versionNum}>v{selected.version_number}</span>
                <span className={styles.createdBy} data-type={selected.created_by}>
                  {selected.created_by === 'auto' ? 'Auto' : 'Manual'}
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
            {selected.change_summary && (
              <p className={styles.summary}>{selected.change_summary}</p>
            )}
            <div className={styles.preview}>
              <pre className={styles.previewContent}>{selected.content ?? '(empty)'}</pre>
            </div>
          </>
        ) : (
          <>
            <div className={styles.header}>
              <span className={styles.title}>Version History</span>
              {!isLoading && (
                <span className={styles.count}>{versions.length}</span>
              )}
            </div>
            {isLoading ? (
              <p className={styles.empty}>Loading…</p>
            ) : versions.length === 0 ? (
              <p className={styles.empty}>No saved versions yet. Versions are saved automatically every 30 minutes while editing.</p>
            ) : (
              <ul className={styles.list}>
                {versions.map((v) => (
                  <li key={v.id}>
                    <button
                      type="button"
                      className={styles.item}
                      onClick={() => setSelected(v)}
                    >
                      <div className={styles.itemLeft}>
                        <span className={styles.versionNum}>v{v.version_number}</span>
                        <span className={styles.createdBy} data-type={v.created_by}>
                          {v.created_by === 'auto' ? 'Auto' : 'Manual'}
                        </span>
                        {v.change_summary && (
                          <span className={styles.itemSummary}>{v.change_summary}</span>
                        )}
                      </div>
                      <span className={styles.timestamp}>{formatRelativeTime(v.created_at)}</span>
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
