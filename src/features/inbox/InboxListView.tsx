import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useNavigationActions } from '@/components/providers';
import { BackIcon } from '@/components/ui/icons';
import { formatRelativeTime } from '@/features/notes/noteUtils';
import type { DocumentRow } from '@/lib/db';
import styles from './InboxListView.module.css';

function useInboxDocs(): DocumentRow[] {
  const { data = [] } = useQuery({
    queryKey: ['inbox-list'],
    queryFn: async (): Promise<DocumentRow[]> => {
      const { data, error } = await supabase
        .from('items')
        .select('id, cuid, type, title, status, processed, date_created, updated_at')
        .eq('type', 'inbox')
        .eq('processed', false)
        .is('date_trashed', null)
        .order('date_created', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as DocumentRow[];
    },
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  });
  return data;
}

export function InboxListView() {
  const { goBack, pushLayer } = useNavigationActions();
  const docs = useInboxDocs();

  const handleOpen = (id: string) => {
    pushLayer({ view: 'document-detail', documentId: id });
  };

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <button type="button" className={styles.iconBtn} onClick={goBack} aria-label="Back">
          <BackIcon />
        </button>
        <span className={styles.title}>
          Inbox
          {docs.length > 0 && <span className={styles.count}>{docs.length}</span>}
        </span>
        <span />
      </header>

      <div className={styles.list}>
        {docs.length === 0 ? (
          <p className={styles.empty}>Inbox is empty</p>
        ) : (
          docs.map((doc) => (
            <button
              key={doc.id}
              type="button"
              className={styles.row}
              onClick={() => handleOpen(doc.id)}
            >
              <span className={styles.rowTitle}>{doc.title ?? 'Untitled'}</span>
              <span className={styles.rowMeta}>
                {doc.updated_at ? formatRelativeTime(doc.updated_at) : ''}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
