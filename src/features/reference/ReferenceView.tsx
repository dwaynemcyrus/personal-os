import { useDeferredValue, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useNavigationActions } from '@/components/providers';
import { BackIcon } from '@/components/ui/icons';
import { showToast } from '@/components/ui/Toast';
import { createAndOpen } from '@/features/documents/createAndOpen';
import type { DocumentRow } from '@/lib/db';
import styles from './ReferenceView.module.css';

function PlusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" width="20" height="20">
      <path d="M10 4v12M4 10h12" />
    </svg>
  );
}

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
  const [creating, setCreating] = useState(false);
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

  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const config =
        subtype === 'literature'
          ? { type: 'reference', subtype: 'literature', defaultStatus: 'active' }
          : { type: 'reference', subtype: 'slip',       defaultStatus: 'active' };
      const id = await createAndOpen(config);
      pushLayer({ view: 'document-detail', documentId: id });
    } catch {
      showToast('Could not create — try again');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <button type="button" className={styles.iconBtn} onClick={goBack} aria-label="Back">
          <BackIcon />
        </button>
        <span className={styles.title}>Reference</span>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={() => void handleCreate()}
          disabled={creating}
          aria-label="New document"
        >
          <PlusIcon />
        </button>
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
