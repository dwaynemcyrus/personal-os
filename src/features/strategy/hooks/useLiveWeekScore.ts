import { useMemo } from 'react';
import { useActiveCycle } from './useActiveCycle';
import { useAllLeadMeasures } from './useGoals';
import { useTacticEntries } from './useTacticEntries';
import { todayIsoDate, calcWeekBounds, weekDays, frequencyMatchesDay } from '../strategyUtils';

/**
 * Computes the live scorecard score for the current week from tactic entries.
 * Returns null when no tactic entries exist yet (shows — instead of 0%).
 */
export function useLiveWeekScore(): number | null {
  const { data: cycle } = useActiveCycle();
  const { data: allLms } = useAllLeadMeasures(cycle?.id);

  const today = useMemo(() => todayIsoDate(), []);
  const { start: weekStart, end: weekEnd } = useMemo(() => calcWeekBounds(today), [today]);
  const days = useMemo(() => weekDays(today), [today]);

  const allLmIds = useMemo(() => (allLms ?? []).map((lm) => lm.id), [allLms]);

  const { data: tacticEntries } = useTacticEntries(allLmIds, weekStart, weekEnd);

  return useMemo(() => {
    if ((tacticEntries ?? []).length === 0) return null;

    const entryByLmDate = new Map<string, Map<string, boolean>>();
    (tacticEntries ?? []).forEach((e) => {
      if (!e.parent_id || !e.period_start) return;
      if (!entryByLmDate.has(e.parent_id)) entryByLmDate.set(e.parent_id, new Map());
      entryByLmDate.get(e.parent_id)!.set(e.period_start.slice(0, 10), !!e.completed);
    });

    let scheduled = 0;
    let completed = 0;
    (allLms ?? []).forEach((lm) => {
      days.forEach((dayIso, i) => {
        const dow = (i + 1) % 7;
        if (!frequencyMatchesDay(lm.frequency, dow)) return;
        scheduled++;
        if (entryByLmDate.get(lm.id)?.get(dayIso)) completed++;
      });
    });

    return scheduled > 0 ? Math.round((completed / scheduled) * 100) : null;
  }, [allLms, days, tacticEntries]);
}
