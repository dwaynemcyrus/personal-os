import { useQuery } from '@tanstack/react-query';
import { useNavigationActions } from '@/components/providers';
import { supabase } from '@/lib/supabase';
import type { CycleOverviewItem } from '../types';
import { formatDisplayDate } from '../strategyUtils';
import { ViewShell, viewStyles } from './ViewShell';

type Props = { onBack: () => void };

function useArchivedCycles() {
  return useQuery({
    queryKey: ['strategy', 'archived-cycles'],
    queryFn: async (): Promise<CycleOverviewItem[]> => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('type', '12-week-overview')
        .eq('item_status', 'archived')
        .eq('is_trashed', false)
        .order('period_start', { ascending: false });
      if (error) throw error;
      return (data ?? []) as CycleOverviewItem[];
    },
    staleTime: 5 * 60_000,
  });
}

export function ArchiveView({ onBack }: Props) {
  const { pushLayer } = useNavigationActions();
  const { data: cycles, isLoading } = useArchivedCycles();

  const navigate = (cycleId: string) => {
    pushLayer({ view: 'strategy-detail', strategyId: `document:${cycleId}` });
  };

  return (
    <ViewShell title="Archive" onBack={onBack}>
      {isLoading && <p className={viewStyles.loadingState}>Loading…</p>}

      {!isLoading && (cycles ?? []).length === 0 && (
        <p className={viewStyles.emptyState}>No archived cycles.</p>
      )}

      {!isLoading &&
        (cycles ?? []).map((cycle) => (
          <button
            key={cycle.id}
            type="button"
            className={viewStyles.row}
            onClick={() => navigate(cycle.id)}
          >
            <div className={viewStyles.rowBody}>
              <div className={viewStyles.rowTitle}>{cycle.title}</div>
              {cycle.period_start && cycle.period_end && (
                <div className={viewStyles.rowSubtitle}>
                  {formatDisplayDate(cycle.period_start)} – {formatDisplayDate(cycle.period_end)}
                </div>
              )}
            </div>
            <div className={viewStyles.rowRight}>
              {cycle.progress != null && (
                <span className={viewStyles.rowCount}>{cycle.progress}%</span>
              )}
              <span className={viewStyles.rowChevron}>›</span>
            </div>
          </button>
        ))}
    </ViewShell>
  );
}
