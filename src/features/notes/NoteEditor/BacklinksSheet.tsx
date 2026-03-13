import { useEffect, useState } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import type { ItemDocument, ItemLinkDocument } from '@/lib/db';
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
  const { db, isReady } = useDatabase();
  const [backlinks, setBacklinks] = useState<Array<{ link: ItemLinkDocument; note: ItemDocument }>>([]);

  useEffect(() => {
    if (!db || !isReady || !open) return;
    const sub = db.item_links.find({
      selector: { is_trashed: false },
    }).$.subscribe(async (allLinks) => {
      const relevant = allLinks.filter(
        (l) => l.target_id === noteId || (l.target_title === noteTitle && !l.target_id)
      );
      const pairs: Array<{ link: ItemLinkDocument; note: ItemDocument }> = [];
      for (const link of relevant) {
        const sourceDoc = await db.items.findOne(link.source_id).exec();
        if (sourceDoc && !sourceDoc.is_trashed) {
          pairs.push({ link: link.toJSON() as ItemLinkDocument, note: sourceDoc.toJSON() as ItemDocument });
        }
      }
      setBacklinks(pairs);
    });
    return () => sub.unsubscribe();
  }, [db, isReady, open, noteId, noteTitle]);

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
