import { useQuery } from '@powersync/react';
import type { ItemRow, ItemLinkRow } from '@/lib/db';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { extractNoteTitle, formatRelativeTime } from '../noteUtils';
import styles from './BacklinksSheet.module.css';

type BacklinksSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noteId: string;
  noteTitle: string | null | undefined;
  onOpenNote: (noteId: string) => void;
};

export function BacklinksSheet({
  open,
  onOpenChange,
  noteId,
  noteTitle,
  onOpenNote,
}: BacklinksSheetProps) {
  const { data: links } = useQuery<ItemLinkRow>(
    `SELECT il.* FROM item_links il
     WHERE il.is_trashed = 0
       AND (il.target_id = ? OR (il.target_title = ? AND il.target_id IS NULL))`,
    [noteId, noteTitle ?? '']
  );

  const sourceIds = links.map((l) => l.source_id);
  const placeholders = sourceIds.length > 0 ? sourceIds.map(() => '?').join(',') : 'NULL';
  const { data: sourceNotes } = useQuery<ItemRow>(
    `SELECT * FROM items WHERE id IN (${placeholders}) AND is_trashed = 0`,
    sourceIds
  );

  const noteMap = new Map(sourceNotes.map((n) => [n.id, n]));
  const backlinks = links.flatMap((link) => {
    const note = noteMap.get(link.source_id);
    return note ? [{ link, note }] : [];
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" ariaLabel="Backlinks" className={styles.sheet}>
        <div className={styles.header}>
          <span className={styles.title}>Backlinks</span>
          <span className={styles.count}>{backlinks.length}</span>
        </div>
        {backlinks.length === 0 ? (
          <p className={styles.empty}>No notes link here yet.</p>
        ) : (
          <ul className={styles.list}>
            {backlinks.map(({ link, note }) => (
              <li key={link.id}>
                <button
                  type="button"
                  className={styles.item}
                  onClick={() => { onOpenChange(false); onOpenNote(note.id); }}
                >
                  <span className={styles.noteTitle}>
                    {extractNoteTitle(note.content, note.title)}
                  </span>
                  <span className={styles.meta}>{formatRelativeTime(note.updated_at)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  );
}
