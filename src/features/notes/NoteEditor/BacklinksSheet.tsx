import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
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
  const { data: backlinks = [] } = useQuery({
    queryKey: ['note', noteId, 'backlinks'],
    queryFn: async () => {
      // Get links pointing to this note
      let linksQuery = supabase
        .from('item_links')
        .select('*')
        .eq('is_trashed', false)
        .eq('target_id', noteId);

      // Also include unresolved links by title
      if (noteTitle) {
        linksQuery = supabase
          .from('item_links')
          .select('*')
          .eq('is_trashed', false)
          .or(`target_id.eq.${noteId},and(target_title.eq.${noteTitle},target_id.is.null)`);
      }

      const { data: links } = await linksQuery;
      if (!links?.length) return [];

      const sourceIds = [...new Set(links.map((l) => l.source_id))];
      const { data: sourceNotes } = await supabase
        .from('items')
        .select('id, title, updated_at')
        .in('id', sourceIds)
        .eq('is_trashed', false);

      const noteMap = new Map((sourceNotes ?? []).map((n) => [n.id, n]));
      return (links as unknown as ItemLinkRow[]).flatMap((link) => {
        const note = noteMap.get(link.source_id) as Pick<ItemRow, 'id' | 'title' | 'updated_at'> | undefined;
        return note ? [{ link, note }] : [];
      });
    },
    enabled: open,
    staleTime: 30_000,
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
                    {extractNoteTitle(null, note.title)}
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
