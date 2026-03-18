import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';
import {
  createCycleReview,
  createThirteenthWeekReview,
  createCycleOverview,
  createGoal,
  createWeeklyPlan,
  patchAreaStatus,
  archiveCycle,
  createTransitionState,
  advanceTransitionState,
  completeTransition,
} from '../strategyMutations';
import type { CompletedSteps } from '../strategyMutations';
import { calcCycleEndDate, todayIsoDate } from '../strategyUtils';
import type { AreaItem } from '../types';
import type { LeadMeasureInput } from '../strategyUtils';
import styles from './TransitionWizard.module.css';

// ── Constants ─────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 5;
const DRAFT_KEY = 'strategy-transition-draft';

const STEP_KEYS: Record<number, string> = {
  1: '12-week-review',
  2: '13th-week-review',
  3: 'area-reassessment',
  4: 'new-cycle',
  5: 'weekly-plan',
};

// ── Draft types ───────────────────────────────────────────────────────────────

type LmDraft = {
  id: string;
  title: string;
  subtype: 'binary' | 'numeric';
  target: string;
  frequency: string;
};

type GoalDraft = {
  id: string;
  areaId: string;
  areaName: string;
  goalName: string;
  lagMeasure: string;
  leadMeasures: LmDraft[];
};

type TransitionDraft = {
  s1_goalResults: string;
  s1_whatWorked: string;
  s1_whatToChange: string;
  s1_inputsForNextCycle: string;
  s1_overallScore: string;
  s2_celebrate: string;
  s2_rest: string;
  s2_reflect: string;
  s2_nextCycleDraft: string;
  s3_areaStatuses: Record<string, 'active' | 'maintenance' | 'waiting'>;
  s4_cycleName: string;
  s4_startDate: string;
  s5_goals: GoalDraft[];
};

function makeDefaultDraft(): TransitionDraft {
  const year = new Date().getFullYear();
  return {
    s1_goalResults: '',
    s1_whatWorked: '',
    s1_whatToChange: '',
    s1_inputsForNextCycle: '',
    s1_overallScore: '0',
    s2_celebrate: '',
    s2_rest: '',
    s2_reflect: '',
    s2_nextCycleDraft: '',
    s3_areaStatuses: {},
    s4_cycleName: `12-Week ${year}-2`,
    s4_startDate: todayIsoDate(),
    s5_goals: [],
  };
}

function useTransitionDraft() {
  const [draft, setDraftState] = useState<TransitionDraft>(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      return raw ? { ...makeDefaultDraft(), ...JSON.parse(raw) } : makeDefaultDraft();
    } catch {
      return makeDefaultDraft();
    }
  });

  const setDraft = (updater: (prev: TransitionDraft) => TransitionDraft) => {
    setDraftState((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
    setDraftState(makeDefaultDraft());
  };

  return { draft, setDraft, clearDraft };
}

// ── Shared queries ────────────────────────────────────────────────────────────

function useCycleAvgScore(cycleId: string) {
  return useQuery({
    queryKey: ['strategy', 'cycle-avg-score', cycleId],
    queryFn: async (): Promise<number | null> => {
      const { data: plans } = await supabase
        .from('items')
        .select('id')
        .eq('type', 'weekly-plan')
        .eq('parent_id', cycleId)
        .eq('is_trashed', false);

      if (!plans?.length) return null;
      const planIds = plans.map((p: { id: string }) => p.id);

      const { data: reviews } = await supabase
        .from('items')
        .select('progress')
        .eq('type', 'weekly-review')
        .in('parent_id', planIds)
        .eq('is_trashed', false)
        .not('progress', 'is', null);

      if (!reviews?.length) return null;
      const total = reviews.reduce(
        (sum: number, r: { progress: number | null }) => sum + (r.progress ?? 0),
        0,
      );
      return Math.round(total / reviews.length);
    },
    staleTime: 60_000,
  });
}

function useAreasQuery() {
  return useQuery({
    queryKey: ['strategy', 'areas'],
    queryFn: async (): Promise<AreaItem[]> => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('type', 'area')
        .eq('is_trashed', false)
        .order('title', { ascending: true });
      if (error) throw error;
      return (data ?? []) as AreaItem[];
    },
    staleTime: 60_000,
  });
}

// ── Step 1: 12-Week Review ────────────────────────────────────────────────────

type StepBasicProps = {
  draft: TransitionDraft;
  setDraft: (fn: (d: TransitionDraft) => TransitionDraft) => void;
};

function Step1Review({
  draft,
  setDraft,
  cycleId,
  cycleName,
}: StepBasicProps & { cycleId: string; cycleName: string }) {
  const { data: avgScore } = useCycleAvgScore(cycleId);

  return (
    <div>
      <div className={styles.stepMeta}>Step 1 of {TOTAL_STEPS}</div>
      <h2 className={styles.stepTitle}>12-Week Review</h2>
      <p className={styles.stepDesc}>Reflect on the completed cycle before moving on.</p>

      <div className={styles.summaryCard}>
        <div className={styles.summaryLabel}>Cycle</div>
        <div className={styles.summaryValue}>{cycleName}</div>
        {avgScore != null && (
          <>
            <div className={styles.summaryLabel}>Avg weekly score</div>
            <div className={styles.summaryValue}>{avgScore}%</div>
          </>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Goal results (what did you achieve?)</label>
        <textarea
          className={styles.textarea}
          placeholder="Goal 1: Completed 80% of lead measures…"
          value={draft.s1_goalResults}
          onChange={(e) => setDraft((d) => ({ ...d, s1_goalResults: e.target.value }))}
        />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>What worked</label>
        <textarea
          className={styles.textarea}
          value={draft.s1_whatWorked}
          onChange={(e) => setDraft((d) => ({ ...d, s1_whatWorked: e.target.value }))}
        />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>What to change next cycle</label>
        <textarea
          className={styles.textarea}
          value={draft.s1_whatToChange}
          onChange={(e) => setDraft((d) => ({ ...d, s1_whatToChange: e.target.value }))}
        />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Inputs for next cycle</label>
        <textarea
          className={styles.textarea}
          value={draft.s1_inputsForNextCycle}
          onChange={(e) => setDraft((d) => ({ ...d, s1_inputsForNextCycle: e.target.value }))}
        />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Overall score (0–100)</label>
        <input
          className={styles.input}
          type="number"
          min="0"
          max="100"
          value={draft.s1_overallScore}
          onChange={(e) => setDraft((d) => ({ ...d, s1_overallScore: e.target.value }))}
        />
      </div>
      <div className={styles.bodySpacer} />
    </div>
  );
}

// ── Step 2: 13th-Week Review ──────────────────────────────────────────────────

function Step2ThirteenthWeek({ draft, setDraft }: StepBasicProps) {
  return (
    <div>
      <div className={styles.stepMeta}>Step 2 of {TOTAL_STEPS}</div>
      <h2 className={styles.stepTitle}>13th-Week Review</h2>
      <p className={styles.stepDesc}>The 13th week is your recovery and planning week.</p>

      <div className={styles.field}>
        <label className={styles.label}>Celebrate (what are you proud of?)</label>
        <textarea
          className={styles.textarea}
          value={draft.s2_celebrate}
          onChange={(e) => setDraft((d) => ({ ...d, s2_celebrate: e.target.value }))}
        />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Rest (how will you recharge?)</label>
        <textarea
          className={styles.textarea}
          value={draft.s2_rest}
          onChange={(e) => setDraft((d) => ({ ...d, s2_rest: e.target.value }))}
        />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Reflect (what patterns emerged?)</label>
        <textarea
          className={styles.textarea}
          value={draft.s2_reflect}
          onChange={(e) => setDraft((d) => ({ ...d, s2_reflect: e.target.value }))}
        />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Next cycle draft notes</label>
        <textarea
          className={styles.textarea}
          placeholder="Ideas for the next cycle…"
          value={draft.s2_nextCycleDraft}
          onChange={(e) => setDraft((d) => ({ ...d, s2_nextCycleDraft: e.target.value }))}
        />
      </div>
      <div className={styles.bodySpacer} />
    </div>
  );
}

// ── Step 3: Area Status Reassessment ──────────────────────────────────────────

function Step3AreaStatus({ draft, setDraft }: StepBasicProps) {
  const { data: areas, isLoading } = useAreasQuery();

  const getStatus = (area: AreaItem): 'active' | 'maintenance' | 'waiting' =>
    (draft.s3_areaStatuses[area.id] as 'active' | 'maintenance' | 'waiting') ??
    (area.item_status as 'active' | 'maintenance' | 'waiting') ??
    'waiting';

  const setAreaStatus = (
    areaId: string,
    status: 'active' | 'maintenance' | 'waiting',
  ) => {
    setDraft((d) => ({
      ...d,
      s3_areaStatuses: { ...d.s3_areaStatuses, [areaId]: status },
    }));
  };

  const activeCount = (areas ?? []).filter((a) => getStatus(a) === 'active').length;

  return (
    <div>
      <div className={styles.stepMeta}>Step 3 of {TOTAL_STEPS}</div>
      <h2 className={styles.stepTitle}>Area Status</h2>
      <p className={styles.stepDesc}>Set each area's status for the next cycle. Aim for 2–3 active areas.</p>

      {isLoading && <p className={styles.stepDesc}>Loading areas…</p>}
      {!isLoading && (areas ?? []).length === 0 && (
        <p className={styles.stepDesc}>No life areas found. Add areas first.</p>
      )}

      {activeCount > 3 && (
        <div className={styles.warningBanner}>
          {activeCount} active areas — the 12 Week Year recommends 2–3 for focus.
        </div>
      )}

      {(areas ?? []).map((area) => {
        const current =
          (area.item_status as 'active' | 'maintenance' | 'waiting') ?? 'waiting';
        const next = getStatus(area);
        return (
          <div key={area.id} className={styles.areaStatusRow}>
            <div className={styles.areaStatusInfo}>
              <div className={styles.areaStatusName}>{area.title}</div>
              <div className={styles.areaStatusWas}>was: {current}</div>
            </div>
            <select
              className={styles.select}
              value={next}
              onChange={(e) =>
                setAreaStatus(
                  area.id,
                  e.target.value as 'active' | 'maintenance' | 'waiting',
                )
              }
            >
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="waiting">Waiting</option>
            </select>
          </div>
        );
      })}

      <div className={styles.areaStatusCount}>Active: {activeCount} of 3 max</div>
      <div className={styles.bodySpacer} />
    </div>
  );
}

// ── Step 4: New Cycle Setup ───────────────────────────────────────────────────

function Step4NewCycle({ draft, setDraft }: StepBasicProps) {
  const endDate = draft.s4_startDate ? calcCycleEndDate(draft.s4_startDate) : '';

  return (
    <div>
      <div className={styles.stepMeta}>Step 4 of {TOTAL_STEPS}</div>
      <h2 className={styles.stepTitle}>New Cycle</h2>
      <p className={styles.stepDesc}>Set up your next 12-week cycle.</p>

      <div className={styles.field}>
        <label className={styles.label}>Cycle name</label>
        <input
          className={styles.input}
          type="text"
          placeholder="12-Week 2026-2"
          value={draft.s4_cycleName}
          onChange={(e) => setDraft((d) => ({ ...d, s4_cycleName: e.target.value }))}
        />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Start date</label>
        <input
          className={styles.input}
          type="date"
          value={draft.s4_startDate}
          onChange={(e) => setDraft((d) => ({ ...d, s4_startDate: e.target.value }))}
        />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>End date (auto-calculated)</label>
        <input
          className={`${styles.input} ${styles.inputReadonly}`}
          type="date"
          value={endDate}
          readOnly
        />
      </div>
      <div className={styles.bodySpacer} />
    </div>
  );
}

// ── Step 5: Goals + First Weekly Plan ────────────────────────────────────────

function Step5Goals({ draft, setDraft }: StepBasicProps) {
  const { data: areas } = useAreasQuery();

  const activeAreas = (areas ?? []).filter((area) => {
    const status =
      draft.s3_areaStatuses[area.id] ?? (area.item_status as string);
    return status === 'active';
  });

  // Ensure a GoalDraft exists for each active area
  useEffect(() => {
    if (!areas || activeAreas.length === 0) return;
    const existingIds = new Set(draft.s5_goals.map((g) => g.areaId));
    const missing = activeAreas.filter((a) => !existingIds.has(a.id));
    if (missing.length === 0) return;
    setDraft((d) => ({
      ...d,
      s5_goals: [
        ...d.s5_goals,
        ...missing.map((a) => ({
          id: `goal-${a.id}`,
          areaId: a.id,
          areaName: a.title ?? '',
          goalName: '',
          lagMeasure: '',
          leadMeasures: [
            {
              id: `lm-${a.id}-0`,
              title: '',
              subtype: 'binary' as const,
              target: '',
              frequency: 'daily',
            },
          ],
        })),
      ],
    }));
  }, [areas]);

  const goals = draft.s5_goals.filter((g) =>
    activeAreas.some((a) => a.id === g.areaId),
  );

  const updateGoal = (
    areaId: string,
    field: 'goalName' | 'lagMeasure',
    value: string,
  ) => {
    setDraft((d) => ({
      ...d,
      s5_goals: d.s5_goals.map((g) =>
        g.areaId === areaId ? { ...g, [field]: value } : g,
      ),
    }));
  };

  const updateLm = (areaId: string, lmId: string, field: string, value: string) => {
    setDraft((d) => ({
      ...d,
      s5_goals: d.s5_goals.map((g) =>
        g.areaId === areaId
          ? {
              ...g,
              leadMeasures: g.leadMeasures.map((lm) =>
                lm.id === lmId ? { ...lm, [field]: value } : lm,
              ),
            }
          : g,
      ),
    }));
  };

  const addLm = (areaId: string) => {
    setDraft((d) => ({
      ...d,
      s5_goals: d.s5_goals.map((g) =>
        g.areaId === areaId
          ? {
              ...g,
              leadMeasures: [
                ...g.leadMeasures,
                {
                  id: `lm-${Date.now()}`,
                  title: '',
                  subtype: 'binary' as const,
                  target: '',
                  frequency: 'daily',
                },
              ],
            }
          : g,
      ),
    }));
  };

  const removeLm = (areaId: string, lmId: string) => {
    setDraft((d) => ({
      ...d,
      s5_goals: d.s5_goals.map((g) =>
        g.areaId === areaId && g.leadMeasures.length > 1
          ? { ...g, leadMeasures: g.leadMeasures.filter((lm) => lm.id !== lmId) }
          : g,
      ),
    }));
  };

  if (activeAreas.length === 0) {
    return (
      <div>
        <div className={styles.stepMeta}>Step 5 of {TOTAL_STEPS}</div>
        <h2 className={styles.stepTitle}>Goals</h2>
        <p className={styles.stepDesc}>
          No active areas selected. Go back to step 3 to set area statuses.
        </p>
        <div className={styles.bodySpacer} />
      </div>
    );
  }

  return (
    <div>
      <div className={styles.stepMeta}>Step 5 of {TOTAL_STEPS}</div>
      <h2 className={styles.stepTitle}>Goals</h2>
      <p className={styles.stepDesc}>One goal per active area, with lead measures.</p>

      {goals.map((goal) => (
        <div key={goal.id} className={styles.goalCard}>
          <div className={styles.goalCardArea}>{goal.areaName}</div>

          <div className={styles.field}>
            <label className={styles.label}>Goal name</label>
            <input
              className={styles.input}
              type="text"
              placeholder="What outcome do you want to achieve?"
              value={goal.goalName}
              onChange={(e) => updateGoal(goal.areaId, 'goalName', e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Lag measure (how will you know you succeeded?)</label>
            <input
              className={styles.input}
              type="text"
              placeholder="e.g. Ship v1.0 to 100 users"
              value={goal.lagMeasure}
              onChange={(e) => updateGoal(goal.areaId, 'lagMeasure', e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Lead measures (tactics)</label>
            <div className={styles.listGroup}>
              {goal.leadMeasures.map((lm) => (
                <div key={lm.id} className={styles.lmRow}>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="Tactic name"
                    value={lm.title}
                    onChange={(e) =>
                      updateLm(goal.areaId, lm.id, 'title', e.target.value)
                    }
                  />
                  <select
                    className={styles.select}
                    value={lm.subtype}
                    onChange={(e) =>
                      updateLm(goal.areaId, lm.id, 'subtype', e.target.value)
                    }
                  >
                    <option value="binary">Binary</option>
                    <option value="numeric">Numeric</option>
                  </select>
                  <input
                    className={styles.inputFreq}
                    type="text"
                    placeholder="daily"
                    value={lm.frequency}
                    onChange={(e) =>
                      updateLm(goal.areaId, lm.id, 'frequency', e.target.value)
                    }
                  />
                  {goal.leadMeasures.length > 1 && (
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => removeLm(goal.areaId, lm.id)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              className={styles.addBtn}
              onClick={() => addLm(goal.areaId)}
            >
              + Add lead measure
            </button>
          </div>
        </div>
      ))}

      <div className={styles.bodySpacer} />
    </div>
  );
}

// ── Main wizard component ─────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  cycleId: string;
  cycleName: string;
  cycleIndex: number;
  stateId: string | null;
  initialStep: number;
  initialCompletedSteps?: CompletedSteps;
};

export function TransitionWizard({
  open,
  onOpenChange,
  cycleId,
  cycleName,
  cycleIndex,
  stateId,
  initialStep,
  initialCompletedSteps = {},
}: Props) {
  const { draft, setDraft, clearDraft } = useTransitionDraft();
  const [step, setStep] = useState(Math.max(1, initialStep));
  const [minStep] = useState(Math.max(1, initialStep)); // can't back past where we started
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [internalStateId, setInternalStateId] = useState<string | null>(stateId);
  const [completedSteps, setCompletedSteps] =
    useState<CompletedSteps>(initialCompletedSteps);

  const today = todayIsoDate();

  if (!open) return null;

  // Ensure state item exists and persist progress
  const persistStep = async (nextStep: number, newEntries: CompletedSteps) => {
    const merged = { ...completedSteps, ...newEntries };
    let sid = internalStateId;
    if (!sid) {
      sid = await createTransitionState({ fromCycleId: cycleId, cycleName });
      setInternalStateId(sid);
    }
    if (nextStep <= TOTAL_STEPS) {
      await advanceTransitionState(sid, nextStep, merged);
    } else {
      await completeTransition(sid);
    }
    setCompletedSteps(merged);
  };

  const isAlreadyDone = (s: number) =>
    Boolean(completedSteps[STEP_KEYS[s]]);

  const handleNext = async () => {
    setError(null);

    // If this step was already persisted, just advance
    if (isAlreadyDone(step)) {
      setStep(step + 1);
      return;
    }

    setSaving(true);
    try {
      switch (step) {
        case 1: {
          const score = Math.min(
            100,
            Math.max(0, parseInt(draft.s1_overallScore || '0', 10)),
          );
          const reviewId = await createCycleReview({
            cycleId,
            cycleName,
            cycleIndex,
            date: today,
            goalResults: draft.s1_goalResults,
            overallScore: score,
            whatWorked: draft.s1_whatWorked,
            whatToChange: draft.s1_whatToChange,
            inputsForNextCycle: draft.s1_inputsForNextCycle,
          });
          await archiveCycle(cycleId);
          await persistStep(2, { '12-week-review': reviewId });
          setStep(2);
          break;
        }
        case 2: {
          const reviewId = await createThirteenthWeekReview({
            fromCycleId: cycleId,
            cycleName,
            cycleIndex,
            date: today,
            celebrate: draft.s2_celebrate,
            rest: draft.s2_rest,
            reflect: draft.s2_reflect,
            nextCycleDraft: draft.s2_nextCycleDraft,
          });
          await persistStep(3, { '13th-week-review': reviewId });
          setStep(3);
          break;
        }
        case 3: {
          for (const [areaId, status] of Object.entries(draft.s3_areaStatuses)) {
            await patchAreaStatus(
              areaId,
              status as 'active' | 'maintenance' | 'waiting',
            );
          }
          await persistStep(4, { 'area-reassessment': 'done' });
          setStep(4);
          break;
        }
        case 4: {
          if (!draft.s4_cycleName.trim() || !draft.s4_startDate) {
            setError('Cycle name and start date are required.');
            return;
          }
          const newCycleId = await createCycleOverview({
            name: draft.s4_cycleName,
            startDate: draft.s4_startDate,
            cycleIndex: cycleIndex + 1,
          });
          await persistStep(5, { 'new-cycle': newCycleId });
          setStep(5);
          break;
        }
        case 5: {
          const newCycleId = completedSteps['new-cycle'];
          if (!newCycleId) {
            setError('New cycle not found. Please go back to step 4.');
            return;
          }
          const validGoals = draft.s5_goals.filter((g) => g.goalName.trim());
          for (const goal of validGoals) {
            const measures: LeadMeasureInput[] = goal.leadMeasures
              .filter((lm) => lm.title.trim())
              .map((lm) => ({
                title: lm.title,
                subtype: lm.subtype,
                target:
                  lm.subtype === 'numeric' && lm.target
                    ? parseFloat(lm.target)
                    : null,
                frequency: lm.frequency || null,
              }));
            await createGoal({
              cycleId: newCycleId,
              areaId: goal.areaId,
              name: goal.goalName,
              lagMeasure: goal.lagMeasure,
              leadMeasures: measures,
            });
          }
          const tacticLines = validGoals
            .flatMap((g) =>
              g.leadMeasures
                .filter((lm) => lm.title.trim())
                .map((lm) => `- [ ] ${lm.title}`),
            )
            .join('\n');
          const planId = await createWeeklyPlan({
            cycleId: newCycleId,
            cycleStartDate: draft.s4_startDate,
            weekStartDate: draft.s4_startDate,
            tacticLines,
          });
          await persistStep(TOTAL_STEPS + 1, { 'weekly-plan': planId });
          clearDraft();
          queryClient.invalidateQueries({ queryKey: ['strategy'] });
          onOpenChange(false);
          break;
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (step > minStep) setStep(step - 1);
  };

  const isLastStep = step === TOTAL_STEPS;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.topbar}>
        <div className={styles.stepDots}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <span
              key={i}
              className={[
                styles.dot,
                i + 1 === step ? styles['dot--active'] : '',
                i + 1 < step ? styles['dot--done'] : '',
              ]
                .filter(Boolean)
                .join(' ')}
            />
          ))}
        </div>
        <span className={styles.wizardTitle}>Cycle Transition</span>
        <button
          type="button"
          className={styles.dismissBtn}
          onClick={() => onOpenChange(false)}
        >
          Exit
        </button>
      </div>

      <div className={styles.body}>
        {step === 1 && (
          <Step1Review
            draft={draft}
            setDraft={setDraft}
            cycleId={cycleId}
            cycleName={cycleName}
          />
        )}
        {step === 2 && <Step2ThirteenthWeek draft={draft} setDraft={setDraft} />}
        {step === 3 && <Step3AreaStatus draft={draft} setDraft={setDraft} />}
        {step === 4 && <Step4NewCycle draft={draft} setDraft={setDraft} />}
        {step === 5 && <Step5Goals draft={draft} setDraft={setDraft} />}
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.footer}>
        {step > minStep && (
          <button
            type="button"
            className={styles.btnBack}
            onClick={handleBack}
            disabled={saving}
          >
            ← Back
          </button>
        )}
        <button
          type="button"
          className={styles.btnSave}
          onClick={handleNext}
          disabled={saving}
        >
          {saving ? 'Saving…' : isLastStep ? 'Finish ✓' : 'Next →'}
        </button>
      </div>
    </div>
  );
}
