import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useLeadMeasures } from '../hooks/useGoals';
import type { GoalItem } from '../types';
import { ViewShell, viewStyles } from './ViewShell';
import { StrategyEditor } from './StrategyEditor';
import styles from './GoalDetailView.module.css';

type Props = { goalId: string; onBack: () => void };

function useGoal(goalId: string) {
  return useQuery({
    queryKey: ['strategy', 'goal', goalId],
    queryFn: async (): Promise<GoalItem | null> => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', goalId)
        .maybeSingle();
      if (error) throw error;
      return data as GoalItem | null;
    },
    staleTime: 5 * 60_000,
  });
}

const TYPE_LABELS: Record<string, string> = {
  binary: 'Binary',
  numeric: 'Numeric',
};

export function GoalDetailView({ goalId, onBack }: Props) {
  const { data: goal, isLoading: goalLoading } = useGoal(goalId);
  const { data: measures, isLoading: measuresLoading } = useLeadMeasures(goalId);

  const loading = goalLoading || measuresLoading;

  return (
    <ViewShell title={goal?.title ?? 'Goal'} onBack={onBack}>
      {loading && <p className={viewStyles.loadingState}>Loading…</p>}

      {!loading && goal && (
        <>
          <div className={styles.lagSection}>
            <div className={styles.lagLabel}>Lag measure (outcome)</div>
            <div className={styles.lagText}>
              {goal.description || <span className={styles.placeholder}>No lag measure set</span>}
            </div>
          </div>

          <div className={viewStyles.divider} />

          <div className={viewStyles.sectionLabel}>Lead measures</div>

          {(measures ?? []).length === 0 ? (
            <p className={viewStyles.emptyState}>No lead measures yet.</p>
          ) : (
            <div className={styles.measureList}>
              {(measures ?? []).map((lm) => (
                <div key={lm.id} className={styles.measure}>
                  <div className={styles.measureTitle}>{lm.title}</div>
                  <div className={styles.measureMeta}>
                    <span className={styles.metaChip}>
                      {TYPE_LABELS[lm.subtype ?? ''] ?? lm.subtype ?? 'binary'}
                    </span>
                    {lm.target != null && (
                      <span className={styles.metaChip}>Target: {lm.target}</span>
                    )}
                    {lm.frequency && (
                      <span className={styles.metaChip}>{lm.frequency}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className={viewStyles.divider} />
          <div className={viewStyles.sectionLabel}>Progress notes</div>
          <StrategyEditor itemId={goal.id} fallbackContent={goal.content} />
        </>
      )}
    </ViewShell>
  );
}
