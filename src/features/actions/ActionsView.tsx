import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useNavigationState, useNavigationActions } from '@/components/providers';
import { BackIcon } from '@/components/ui/icons';
import { showToast } from '@/components/ui/Toast';
import { createAndOpen } from '@/features/documents/createAndOpen';
import type { DocumentRow } from '@/lib/db';
import type { ActionsFilter } from '@/lib/navigation/types';
import styles from './ActionsView.module.css';

function PlusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" width="20" height="20">
      <path d="M10 4v12M4 10h12" />
    </svg>
  );
}

function todayIso(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

const FILTERS: { key: ActionsFilter; label: string }[] = [
  { key: 'today',     label: 'Today'     },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'anytime',   label: 'Anytime'   },
  { key: 'someday',   label: 'Someday'   },
  { key: 'projects',  label: 'Projects'  },
];

function useActionsDocs(filter: ActionsFilter): DocumentRow[] {
  const today = todayIso();

  const { data = [] } = useQuery({
    queryKey: ['actions', filter, today],
    queryFn: async (): Promise<DocumentRow[]> => {
      let q = supabase
        .from('items')
        .select('id, cuid, type, subtype, title, status, end_date, date_created')
        .is('date_trashed', null)
        .order('end_date', { ascending: true, nullsFirst: false });

      if (filter === 'projects') {
        q = q.eq('type', 'action').eq('subtype', 'project');
      } else {
        q = q.eq('type', 'action').eq('subtype', 'task');
        if (filter === 'today')     q = q.eq('end_date', today);
        if (filter === 'scheduled') q = q.gt('end_date', today);
        if (filter === 'anytime')   q = q.is('end_date', null).eq('status', 'open');
        if (filter === 'someday')   q = q.eq('status', 'someday');
      }

      const { data, error } = await q.limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as DocumentRow[];
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  return data;
}

export function ActionsView() {
  const { stack } = useNavigationState();
  const { goBack, pushLayer } = useNavigationActions();

  const topLayer = stack[stack.length - 1];
  const activeFilter: ActionsFilter =
    topLayer?.view === 'actions' ? topLayer.filter : 'today';

  const [localFilter, setLocalFilter] = useState<ActionsFilter>(activeFilter);
  const [creating, setCreating] = useState(false);
  const docs = useActionsDocs(localFilter);

  const handleFilterChange = (f: ActionsFilter) => setLocalFilter(f);

  const handleOpen = (id: string) => {
    pushLayer({ view: 'document-detail', documentId: id });
  };

  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const isProject = localFilter === 'projects';
      const id = await createAndOpen({
        type: 'action',
        subtype: isProject ? 'project' : 'task',
        defaultStatus: isProject ? 'active' : 'open',
      });
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
        <span className={styles.title}>Actions</span>
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

      <div className={styles.filterRow}>
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={`${styles.filterChip} ${localFilter === key ? styles.filterChipActive : ''}`}
            onClick={() => handleFilterChange(key)}
          >
            {label}
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
              {doc.end_date && (
                <span className={styles.rowMeta}>{doc.end_date}</span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
