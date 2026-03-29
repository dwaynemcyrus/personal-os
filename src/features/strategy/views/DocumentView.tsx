import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ItemRow } from '@/lib/db';
import { formatDisplayDate } from '../strategyUtils';
import { ViewShell, viewStyles } from './ViewShell';
import { StrategyEditor } from './StrategyEditor';
import { ArenaDocumentView } from './ArenaDocumentView';
import styles from './DocumentView.module.css';

type Props = { documentId: string; onBack: () => void };

function useDocument(id: string) {
  return useQuery({
    queryKey: ['strategy', 'document', id],
    queryFn: async (): Promise<ItemRow | null> => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as ItemRow | null;
    },
    staleTime: 5 * 60_000,
  });
}

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    area: 'Area',
    'annual-outcomes': 'Annual Outcomes',
    '12-week-overview': 'Cycle Overview',
    '12-week-goal': 'Goal',
    'weekly-plan': 'Weekly Plan',
    'daily-review': 'Daily Review',
    'weekly-review': 'Weekly Review',
    '12-week-review': 'Cycle Review',
    '13th-week-review': '13th Week Review',
    'annual-review': 'Annual Review',
  };
  return map[type] ?? type;
}

export function DocumentView({ documentId, onBack }: Props) {
  const { data: doc, isLoading } = useDocument(documentId);

  // Arena documents get their own dedicated view
  if (!isLoading && doc?.type === 'area') {
    return <ArenaDocumentView doc={doc} onBack={onBack} />;
  }

  const title = doc?.title ?? (doc?.type ? typeLabel(doc.type) : 'Document');

  return (
    <ViewShell title={title} onBack={onBack}>
      {isLoading && <p className={viewStyles.loadingState}>Loading…</p>}

      {!isLoading && !doc && (
        <p className={viewStyles.emptyState}>Document not found.</p>
      )}

      {!isLoading && doc && (
        <>
          <div className={styles.meta}>
            <span className={styles.typeLabel}>{typeLabel(doc.type ?? '')}</span>
            {doc.period_start && (
              <span className={styles.date}>{formatDisplayDate(doc.period_start)}</span>
            )}
            {doc.progress != null && (
              <span className={styles.score}>{doc.progress}%</span>
            )}
          </div>

          <div className={viewStyles.divider} />
          <StrategyEditor itemId={doc.id} fallbackContent={doc.content} />
        </>
      )}
    </ViewShell>
  );
}
