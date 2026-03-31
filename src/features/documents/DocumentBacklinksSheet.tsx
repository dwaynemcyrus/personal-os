import { useQuery } from '@tanstack/react-query';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { getDocumentBacklinks } from '@/lib/documentBacklinks';
import { extractNoteTitle, formatRelativeTime } from '@/features/notes/noteUtils';
import styles from './DocumentBacklinksSheet.module.css';

type DocumentBacklinksSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentTitle: string | null | undefined;
  onOpenDocument: (documentId: string) => void;
};

export function DocumentBacklinksSheet({
  open,
  onOpenChange,
  documentId,
  documentTitle,
  onOpenDocument,
}: DocumentBacklinksSheetProps) {
  const { data: backlinks = [] } = useQuery({
    queryKey: ['document-backlinks', documentId, documentTitle ?? ''],
    queryFn: () => getDocumentBacklinks(documentId, documentTitle),
    enabled: open && Boolean(documentTitle?.trim()),
    staleTime: 30_000,
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" ariaLabel="Backlinks" className={styles.sheet}>
        <div className={styles.header}>
          <span className={styles.title}>Backlinks</span>
          <span className={styles.count}>{backlinks.length}</span>
        </div>

        {!documentTitle?.trim() ? (
          <p className={styles.empty}>Add a title before using backlinks.</p>
        ) : backlinks.length === 0 ? (
          <p className={styles.empty}>No notes link here yet.</p>
        ) : (
          <ul className={styles.list}>
            {backlinks.map((backlink) => (
              <li key={backlink.sourceId}>
                <button
                  type="button"
                  className={styles.item}
                  onClick={() => {
                    onOpenChange(false);
                    onOpenDocument(backlink.sourceId);
                  }}
                >
                  <span className={styles.noteTitle}>
                    {extractNoteTitle(null, backlink.title)}
                  </span>
                  <span className={styles.meta}>
                    {backlink.count > 1 ? `${backlink.count} links` : formatRelativeTime(backlink.updatedAt)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  );
}
