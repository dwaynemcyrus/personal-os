import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { createDocument } from '@/lib/db';
import { generateCuid } from '@/lib/cuid';
import { getDocumentTemplate } from '@/lib/templates';
import { queryClient } from '@/lib/queryClient';
import { useNavigationActions } from '@/components/providers';
import type { DocumentRow } from '@/lib/db';
import styles from './HomeView.module.css';

function todayIso(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

function todayLabel(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function useTodayDailyNote() {
  const today = todayIso();
  const todayStart = `${today}T00:00:00`;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStart = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}T00:00:00`;

  return useQuery({
    queryKey: ['daily-note', today],
    queryFn: async (): Promise<DocumentRow | null> => {
      const { data } = await supabase
        .from('items')
        .select('id, cuid, type, subtype, title, date_created')
        .eq('type', 'journal')
        .eq('subtype', 'daily')
        .is('date_trashed', null)
        .gte('date_created', todayStart)
        .lt('date_created', tomorrowStart)
        .order('date_created', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data as DocumentRow | null;
    },
    staleTime: 5 * 60_000,
  });
}

function useInboxCount() {
  return useQuery({
    queryKey: ['inbox-count'],
    queryFn: async (): Promise<number> => {
      const { count } = await supabase
        .from('items')
        .select('id', { count: 'exact', head: true })
        .eq('type', 'inbox')
        .eq('status', 'unprocessed')
        .is('date_trashed', null);
      return count ?? 0;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function HomeView() {
  const { pushLayer } = useNavigationActions();
  const { data: dailyNote } = useTodayDailyNote();
  const { data: inboxCount = 0 } = useInboxCount();
  const [creatingDaily, setCreatingDaily] = useState(false);

  const handleDailyNote = async () => {
    if (creatingDaily) return;
    if (dailyNote) {
      pushLayer({ view: 'document-detail', documentId: dailyNote.id });
      return;
    }
    setCreatingDaily(true);
    try {
      const today = todayIso();
      const now = new Date().toISOString();
      const id = await createDocument({
        cuid: generateCuid(),
        type: 'journal',
        subtype: 'daily',
        title: today,
        status: 'active',
        access: 'private',
        workbench: false,
        resources: [],
        dependencies: [],
        blocked: false,
        slug: null,
        published: false,
        tier: null,
        growth: null,
        rating: null,
        start_date: null,
        end_date: null,
        date_created: now,
        date_modified: null,
        date_trashed: null,
        tags: [],
        content: getDocumentTemplate('journal', 'daily'),
        frontmatter: null,
        area: null,
      });
      queryClient.invalidateQueries({ queryKey: ['daily-note'] });
      pushLayer({ view: 'document-detail', documentId: id });
    } finally {
      setCreatingDaily(false);
    }
  };

  return (
    <div className={styles.home}>
      <div className={styles.dateLabel}>{todayLabel()}</div>

      <nav className={styles.nav}>
        {/* Daily Note */}
        <button
          type="button"
          className={`${styles.navRow} ${styles.navRowPrimary}`}
          onClick={() => void handleDailyNote()}
          disabled={creatingDaily}
        >
          <span className={styles.navRowLabel}>
            {dailyNote ? "Today's Note" : "Create Today's Note"}
          </span>
          <span className={styles.navRowChevron}>›</span>
        </button>

        <div className={styles.divider} />

        {/* Actions */}
        <button
          type="button"
          className={styles.navRow}
          onClick={() => pushLayer({ view: 'actions', filter: 'today' })}
        >
          <span className={styles.navRowLabel}>Actions</span>
          <span className={styles.navRowChevron}>›</span>
        </button>

        {/* Writing */}
        <button
          type="button"
          className={styles.navRow}
          onClick={() => pushLayer({ view: 'writing' })}
        >
          <span className={styles.navRowLabel}>Writing</span>
          <span className={styles.navRowChevron}>›</span>
        </button>

        {/* Reference */}
        <button
          type="button"
          className={styles.navRow}
          onClick={() => pushLayer({ view: 'reference' })}
        >
          <span className={styles.navRowLabel}>Reference</span>
          <span className={styles.navRowChevron}>›</span>
        </button>

        <div className={styles.divider} />

        {/* Inbox */}
        <button
          type="button"
          className={styles.navRow}
          onClick={() => pushLayer({ view: 'inbox-list' })}
        >
          <span className={styles.navRowLabel}>Inbox</span>
          <span className={styles.navRowRight}>
            {inboxCount > 0 && (
              <span className={styles.badge}>{inboxCount}</span>
            )}
            <span className={styles.navRowChevron}>›</span>
          </span>
        </button>

        <div className={styles.divider} />

        {/* Settings */}
        <button
          type="button"
          className={styles.navRow}
          onClick={() => pushLayer({ view: 'settings' })}
        >
          <span className={styles.navRowLabel}>Settings</span>
          <span className={styles.navRowChevron}>›</span>
        </button>
      </nav>
    </div>
  );
}
