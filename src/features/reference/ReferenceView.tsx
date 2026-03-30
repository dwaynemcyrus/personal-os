import { useDeferredValue, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useNavigationActions } from '@/components/providers';
import { BackIcon } from '@/components/ui/icons';
import type { DocumentRow } from '@/lib/db';
import styles from './ReferenceView.module.css';

const SUBTYPES = ['all', 'slip', 'literature'] as const;
type Subtype = (typeof SUBTYPES)[number];

function useReferenceDocs(subtype: Subtype): DocumentRow[] {
  const { data = [] } = useQuery({
    queryKey: ['reference', subtype],
    queryFn: async (): Promise<DocumentRow[]> => {
      let q = supabase
        .from('items')
        .select('id, cuid, type, subtype, title, tags, updated_at')
        .eq('type', 'reference')
        .is('date_trashed', null)
        .order('updated_at', { ascending: false });

      if (subtype !== 'all') q = q.eq('subtype', subtype);

      const { data, error } = await q.limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as DocumentRow[];
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
  return data;
}

export function ReferenceView() {
  const { goBack, pushLayer } = useNavigationActions();
  const [subtype, setSubtype] = useState<Subtype>('all');
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const allDocs = useReferenceDocs(subtype);

  const docs = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return allDocs;
    return allDocs.filter((d) => {
      const inTitle = (d.title ?? '').toLowerCase().includes(q);
      const inTags  = (d.tags ?? []).some((t) => t.toLowerCase().includes(q));
      return inTitle || inTags;
    });
  }, [allDocs, deferredSearch]);

  const handleOpen = (id: string) => {
    pushLayer({ view: 'document-detail', documentId: id });
  };

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <button type="button" className={styles.iconBtn} onClick={goBack} aria-label="Back">
          <BackIcon />
        </button>
        <span className={styles.title}>Reference</span>
        <span />
      </header>

      <div className={styles.searchRow}>
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Search titles and tags…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      <div className={styles.filterRow}>
        {SUBTYPES.map((s) => (
          <button
            key={s}
            type="button"
            className={`${styles.filterChip} ${subtype === s ? styles.filterChipActive : ''}`}
            onClick={() => setSubtype(s)}
          >
            {s === 'all' ? 'All' : s === 'slip' ? 'Slip' : 'Literature'}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {docs.length === 0 ? (
          <p className={styles.empty}>
            {deferredSearch.trim() ? `No results for "${deferredSearch.trim()}"` : 'Nothing here'}
          </p>
        ) : (
          docs.map((doc) => (
            <button
              key={doc.id}
              type="button"
              className={styles.row}
              onClick={() => handleOpen(doc.id)}
            >
              <span className={styles.rowTitle}>{doc.title ?? 'Untitled'}</span>
              <span className={styles.rowMeta}>{doc.subtype ?? 'reference'}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
