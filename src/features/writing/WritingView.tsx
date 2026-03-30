import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useNavigationActions } from '@/components/providers';
import { BackIcon } from '@/components/ui/icons';
import type { DocumentRow } from '@/lib/db';
import styles from './WritingView.module.css';

type SortKey = 'date_modified' | 'date_created' | 'growth';

const SUBTYPES = ['all', 'essay', 'framework', 'workshop'] as const;
type Subtype = (typeof SUBTYPES)[number];

function useWritingDocs(subtype: Subtype, sort: SortKey): DocumentRow[] {
  const { data = [] } = useQuery({
    queryKey: ['writing', subtype, sort],
    queryFn: async (): Promise<DocumentRow[]> => {
      let q = supabase
        .from('items')
        .select('id, cuid, type, subtype, title, status, growth, date_created, date_modified, updated_at')
        .in('type', ['creation', 'transmission'])
        .is('date_trashed', null);

      if (subtype !== 'all') q = q.eq('subtype', subtype);

      const col = sort === 'growth' ? 'growth' : sort === 'date_created' ? 'date_created' : 'updated_at';
      q = q.order(col, { ascending: false, nullsFirst: false });

      const { data, error } = await q.limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as DocumentRow[];
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
  return data;
}

function subtypeLabel(s: string): string {
  const map: Record<string, string> = { essay: 'Essay', framework: 'Framework', workshop: 'Workshop' };
  return map[s] ?? s;
}

export function WritingView() {
  const { goBack, pushLayer } = useNavigationActions();
  const [subtype, setSubtype] = useState<Subtype>('all');
  const [sort, setSort] = useState<SortKey>('date_modified');
  const docs = useWritingDocs(subtype, sort);

  const handleOpen = (id: string) => {
    pushLayer({ view: 'document-detail', documentId: id });
  };

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <button type="button" className={styles.iconBtn} onClick={goBack} aria-label="Back">
          <BackIcon />
        </button>
        <span className={styles.title}>Writing</span>
        <select
          className={styles.sortSelect}
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          aria-label="Sort by"
        >
          <option value="date_modified">Modified</option>
          <option value="date_created">Created</option>
          <option value="growth">Growth</option>
        </select>
      </header>

      <div className={styles.filterRow}>
        {SUBTYPES.map((s) => (
          <button
            key={s}
            type="button"
            className={`${styles.filterChip} ${subtype === s ? styles.filterChipActive : ''}`}
            onClick={() => setSubtype(s)}
          >
            {s === 'all' ? 'All' : subtypeLabel(s)}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {docs.length === 0 ? (
          <p className={styles.empty}>Nothing here</p>
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
                {doc.subtype ?? doc.type}
                {doc.status ? ` · ${doc.status}` : ''}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
