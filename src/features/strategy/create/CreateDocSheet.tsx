/**
 * CreateDocSheet — full-screen form for creating any strategy document type.
 *
 * Props:
 *   open           — visibility
 *   onOpenChange   — close callback
 *   initialType    — if provided, skips the type picker
 *   context        — pre-bound IDs (cycleId, etc.)
 *   onCreated      — called with (newId, type) so callers can navigate to it
 */
import { useState } from 'react';
import { useRegisterWizard } from '@/components/providers';
import { v4 as uuidv4 } from 'uuid';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';
import { useActiveCycle } from '../hooks/useActiveCycle';
import { useAreas } from '../hooks/useAreas';
import { useGoals } from '../hooks/useGoals';
import { useWeeklyPlans } from '../hooks/useWeeklyPlans';
import {
  createArea,
  createAnnualOutcomes,
  createCycleOverview,
  createGoal,
  createWeeklyPlan,
  createDailyReview,
  createWeeklyReview,
  createCycleReview,
  createThirteenthWeekReview,
  createAnnualReview,
} from '../strategyMutations';
import { calcCycleEndDate, formatDisplayDate, todayIsoDate, calcWeekBounds } from '../strategyUtils';
import type { WeeklyPlanItem } from '../types';
import styles from './CreateDocSheet.module.css';

// ── Types ─────────────────────────────────────────────────────────────────────

export type DocType =
  | 'area'
  | 'annual-outcomes'
  | '12-week-overview'
  | '12-week-goal'
  | 'weekly-plan'
  | 'daily-review'
  | 'weekly-review'
  | '12-week-review'
  | '13th-week-review'
  | 'annual-review';

const TYPE_LABELS: Record<DocType, string> = {
  'area': 'Life Arena',
  'annual-outcomes': 'Annual Outcomes',
  '12-week-overview': '12-Week Cycle',
  '12-week-goal': '12-Week Goal',
  'weekly-plan': 'Weekly Plan',
  'daily-review': 'Daily Review',
  'weekly-review': 'Weekly Review',
  '12-week-review': '12-Week Review',
  '13th-week-review': '13th-Week Review',
  'annual-review': 'Annual Review',
};

const ALL_TYPES: DocType[] = [
  'area',
  'annual-outcomes',
  '12-week-overview',
  '12-week-goal',
  'weekly-plan',
  'daily-review',
  'weekly-review',
  '12-week-review',
  '13th-week-review',
  'annual-review',
];

export type CreateContext = {
  cycleId?: string;
  cycleStartDate?: string;
  weeklyPlanId?: string;
};

type FormProps = {
  context: CreateContext;
  onSaved: (id: string) => void;
  onBack?: () => void;
};

// ── Shared helpers ────────────────────────────────────────────────────────────

function useAllWeeklyPlans() {
  return useQuery({
    queryKey: ['strategy', 'all-weekly-plans'],
    queryFn: async (): Promise<WeeklyPlanItem[]> => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('type', 'weekly-plan')
        .eq('is_trashed', false)
        .order('period_start', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as WeeklyPlanItem[];
    },
    staleTime: 60_000,
  });
}

function todayDefault(): string {
  return todayIsoDate();
}

function thisMonday(): string {
  return calcWeekBounds(todayIsoDate()).start;
}

// ── Form: Life Arena ──────────────────────────────────────────────────────────

function AreaForm({ onSaved, onBack }: FormProps) {
  const [name, setName] = useState('');
  const [vision, setVision] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required.'); return; }
    setSaving(true); setError('');
    try {
      const id = await createArea({ name: name.trim(), vision: vision.trim() });
      queryClient.invalidateQueries({ queryKey: ['strategy', 'areas'] });
      queryClient.invalidateQueries({ queryKey: ['strategy', 'list'] });
      onSaved(id);
    } catch (e) { setError(e instanceof Error ? e.message : 'Save failed.'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <h2 className={styles.formTitle}>New Life Arena</h2>
      <div className={styles.field}>
        <label className={styles.label}>Name</label>
        <input className={styles.input} placeholder="e.g. Career, Health…" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Vision (optional)</label>
        <textarea className={styles.textarea} placeholder="Where do you want to be in this area?" value={vision} onChange={e => setVision(e.target.value)} />
      </div>
      <div className={styles.bodySpacer} />
      {error && <div className={styles.errorBanner}>{error}</div>}
      <div className={styles.footer}>
        {onBack && <button type="button" className={styles.btnBack} onClick={onBack}>← Back</button>}
        <button type="button" className={styles.btnSave} onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Create Area'}</button>
      </div>
    </>
  );
}

// ── Form: Annual Outcomes ─────────────────────────────────────────────────────

function AnnualOutcomesForm({ onSaved, onBack }: FormProps) {
  const { data: areas = [] } = useAreas();
  const year = new Date().getFullYear();
  const [areaId, setAreaId] = useState('');
  const [outcomes, setOutcomes] = useState(['']);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedArea = areas.find(a => a.id === areaId);

  const updateOutcome = (idx: number, val: string) => {
    const next = [...outcomes]; next[idx] = val; setOutcomes(next);
  };

  const handleSave = async () => {
    if (!areaId) { setError('Select an area.'); return; }
    const filtered = outcomes.filter(o => o.trim());
    if (filtered.length === 0) { setError('Add at least one outcome.'); return; }
    setSaving(true); setError('');
    try {
      const id = await createAnnualOutcomes({ areaId, areaName: selectedArea!.title ?? '', year, outcomes: filtered });
      queryClient.invalidateQueries({ queryKey: ['strategy'] });
      onSaved(id);
    } catch (e) { setError(e instanceof Error ? e.message : 'Save failed.'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <h2 className={styles.formTitle}>Annual Outcomes</h2>
      <div className={styles.field}>
        <label className={styles.label}>Life arena</label>
        <select className={`${styles.input} ${styles.select}`} value={areaId} onChange={e => setAreaId(e.target.value)}>
          <option value="">Select arena…</option>
          {areas.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
        </select>
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Year</label>
        <input className={`${styles.input} ${styles.inputReadonly}`} readOnly value={year} />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Outcomes</label>
        <div className={styles.listGroup}>
          {outcomes.map((o, idx) => (
            <div key={idx} className={styles.listRow}>
              <input className={styles.input} placeholder={`Outcome ${idx + 1}`} value={o} onChange={e => updateOutcome(idx, e.target.value)} />
              {outcomes.length > 1 && <button type="button" className={styles.removeBtn} onClick={() => setOutcomes(outcomes.filter((_, i) => i !== idx))}>×</button>}
            </div>
          ))}
        </div>
        <button type="button" className={styles.addBtn} onClick={() => setOutcomes([...outcomes, ''])}>+ Add outcome</button>
      </div>
      <div className={styles.bodySpacer} />
      {error && <div className={styles.errorBanner}>{error}</div>}
      <div className={styles.footer}>
        {onBack && <button type="button" className={styles.btnBack} onClick={onBack}>← Back</button>}
        <button type="button" className={styles.btnSave} onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Create'}</button>
      </div>
    </>
  );
}

// ── Form: 12-Week Cycle ───────────────────────────────────────────────────────

function CycleForm({ onSaved, onBack }: FormProps) {
  const year = new Date().getFullYear();
  const [name, setName] = useState(`${year} Cycle 1`);
  const [startDate, setStartDate] = useState(todayDefault());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const endDate = startDate ? calcCycleEndDate(startDate) : '';

  const handleSave = async () => {
    if (!name.trim() || !startDate) { setError('Name and start date are required.'); return; }
    setSaving(true); setError('');
    try {
      const id = await createCycleOverview({ name: name.trim(), startDate });
      queryClient.invalidateQueries({ queryKey: ['strategy'] });
      onSaved(id);
    } catch (e) { setError(e instanceof Error ? e.message : 'Save failed.'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <h2 className={styles.formTitle}>New 12-Week Cycle</h2>
      <div className={styles.field}>
        <label className={styles.label}>Cycle name</label>
        <input className={styles.input} placeholder="2026 Cycle 1" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Start date</label>
        <input className={styles.input} type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>End date (auto-calculated)</label>
        <input className={`${styles.input} ${styles.inputReadonly}`} readOnly value={endDate ? formatDisplayDate(endDate) : '—'} />
      </div>
      <div className={styles.bodySpacer} />
      {error && <div className={styles.errorBanner}>{error}</div>}
      <div className={styles.footer}>
        {onBack && <button type="button" className={styles.btnBack} onClick={onBack}>← Back</button>}
        <button type="button" className={styles.btnSave} onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Create Cycle'}</button>
      </div>
    </>
  );
}

// ── Form: 12-Week Goal ────────────────────────────────────────────────────────

function GoalForm({ context, onSaved, onBack }: FormProps) {
  const { data: cycle } = useActiveCycle();
  const { data: areas = [] } = useAreas();

  const cycleId = context.cycleId ?? cycle?.id ?? '';
  const [areaId, setAreaId] = useState('');
  const [name, setName] = useState('');
  const [lagMeasure, setLagMeasure] = useState('');
  const [leadMeasures, setLeadMeasures] = useState(['']);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const updateLM = (idx: number, val: string) => {
    const next = [...leadMeasures]; next[idx] = val; setLeadMeasures(next);
  };

  const handleSave = async () => {
    if (!cycleId) { setError('No active cycle.'); return; }
    if (!name.trim()) { setError('Goal name is required.'); return; }
    setSaving(true); setError('');
    try {
      const lms = leadMeasures.filter(lm => lm.trim()).map(title => ({ title: title.trim(), subtype: 'binary' as const }));
      const id = await createGoal({ cycleId, areaId: areaId || '', name: name.trim(), lagMeasure: lagMeasure.trim(), leadMeasures: lms });
      queryClient.invalidateQueries({ queryKey: ['strategy', 'goals'] });
      queryClient.invalidateQueries({ queryKey: ['strategy', 'all-lead-measures'] });
      queryClient.invalidateQueries({ queryKey: ['strategy', 'list'] });
      onSaved(id);
    } catch (e) { setError(e instanceof Error ? e.message : 'Save failed.'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <h2 className={styles.formTitle}>New Goal</h2>
      {!cycleId && <div className={styles.errorBanner}>No active cycle found. Create a cycle first.</div>}
      <div className={styles.field}>
        <label className={styles.label}>Life arena (optional)</label>
        <select className={`${styles.input} ${styles.select}`} value={areaId} onChange={e => setAreaId(e.target.value)}>
          <option value="">No arena</option>
          {areas.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
        </select>
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Goal name</label>
        <input className={styles.input} placeholder="e.g. Launch MVP" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Lag measure (the outcome)</label>
        <textarea className={styles.textarea} placeholder="e.g. Ship to 5 beta testers by end of cycle" value={lagMeasure} onChange={e => setLagMeasure(e.target.value)} />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Lead measures (tactics)</label>
        <div className={styles.listGroup}>
          {leadMeasures.map((lm, idx) => (
            <div key={idx} className={styles.listRow}>
              <input className={styles.input} placeholder="e.g. Code 2hrs daily" value={lm} onChange={e => updateLM(idx, e.target.value)} />
              {leadMeasures.length > 1 && <button type="button" className={styles.removeBtn} onClick={() => setLeadMeasures(leadMeasures.filter((_, i) => i !== idx))}>×</button>}
            </div>
          ))}
        </div>
        <button type="button" className={styles.addBtn} onClick={() => setLeadMeasures([...leadMeasures, ''])}>+ Add lead measure</button>
      </div>
      <div className={styles.bodySpacer} />
      {error && <div className={styles.errorBanner}>{error}</div>}
      <div className={styles.footer}>
        {onBack && <button type="button" className={styles.btnBack} onClick={onBack}>← Back</button>}
        <button type="button" className={styles.btnSave} onClick={handleSave} disabled={saving || !cycleId}>{saving ? 'Saving…' : 'Create Goal'}</button>
      </div>
    </>
  );
}

// ── Form: Weekly Plan ─────────────────────────────────────────────────────────

function buildTacticLines(goals: ReturnType<typeof useGoals>['data']): string {
  if (!goals || goals.length === 0) return '';
  const sections: string[] = [];
  for (const goal of goals) {
    if (goal.leadMeasures.length === 0) continue;
    const items = goal.leadMeasures
      .map((lm) => `- [ ] ${lm.title}${lm.frequency ? ` (${lm.frequency})` : ''}`)
      .join('\n');
    sections.push(`### ${goal.title ?? 'Goal'}\n${items}`);
  }
  return sections.join('\n\n');
}

function WeeklyPlanForm({ context, onSaved, onBack }: FormProps) {
  const { data: cycle } = useActiveCycle();
  const cycleId = context.cycleId ?? cycle?.id ?? '';
  const cycleStartDate = context.cycleStartDate ?? cycle?.period_start ?? '';
  const { data: goals } = useGoals(cycleId || null);

  const [startDate, setStartDate] = useState(thisMonday());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!cycleId || !cycleStartDate) { setError('No active cycle.'); return; }
    setSaving(true); setError('');
    try {
      const tacticLines = buildTacticLines(goals);
      const id = await createWeeklyPlan({ cycleId, cycleStartDate, weekStartDate: startDate, tacticLines, notes });
      queryClient.invalidateQueries({ queryKey: ['strategy', 'weekly-plans'] });
      queryClient.invalidateQueries({ queryKey: ['strategy', 'current-week-plan'] });
      queryClient.invalidateQueries({ queryKey: ['strategy', 'list'] });
      onSaved(id);
    } catch (e) { setError(e instanceof Error ? e.message : 'Save failed.'); }
    finally { setSaving(false); }
  };

  const tacticPreview = buildTacticLines(goals);
  const goalCount = (goals ?? []).filter(g => g.leadMeasures.length > 0).length;

  return (
    <>
      <h2 className={styles.formTitle}>New Weekly Plan</h2>
      {!cycleId && <div className={styles.errorBanner}>No active cycle. Create a cycle first.</div>}
      <div className={styles.field}>
        <label className={styles.label}>Week start (Monday)</label>
        <input className={styles.input} type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
      </div>
      {goalCount > 0 && (
        <div className={styles.field}>
          <label className={styles.label}>
            Tactics ({goalCount} goal{goalCount !== 1 ? 's' : ''} · auto-filled)
          </label>
          <textarea
            className={`${styles.textarea} ${styles.textareaReadonly}`}
            readOnly
            value={tacticPreview}
            rows={Math.min(tacticPreview.split('\n').length + 1, 10)}
          />
        </div>
      )}
      <div className={styles.field}>
        <label className={styles.label}>Notes (optional)</label>
        <textarea className={styles.textarea} placeholder="Anything extra for this week…" value={notes} onChange={e => setNotes(e.target.value)} />
      </div>
      <div className={styles.bodySpacer} />
      {error && <div className={styles.errorBanner}>{error}</div>}
      <div className={styles.footer}>
        {onBack && <button type="button" className={styles.btnBack} onClick={onBack}>← Back</button>}
        <button type="button" className={styles.btnSave} onClick={handleSave} disabled={saving || !cycleId}>{saving ? 'Saving…' : 'Create Plan'}</button>
      </div>
    </>
  );
}

// ── Form: Daily Review ────────────────────────────────────────────────────────

function DailyReviewForm({ context, onSaved, onBack }: FormProps) {
  const { data: allPlans = [] } = useAllWeeklyPlans();
  const today = todayDefault();
  const [date, setDate] = useState(today);
  const [planId, setPlanId] = useState(context.weeklyPlanId ?? '');
  const [whatWentWell, setWhatWentWell] = useState('');
  const [tomorrowsPriority, setTomorrowsPriority] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Auto-select plan that covers the selected date
  const coveringPlan = allPlans.find(p => p.period_start && p.period_end && date >= p.period_start && date <= p.period_end);
  const effectivePlanId = planId || coveringPlan?.id || '';

  const handleSave = async () => {
    if (!effectivePlanId) { setError('No weekly plan found for this date. Create a weekly plan first.'); return; }
    setSaving(true); setError('');
    try {
      const id = await createDailyReview({
        weeklyPlanId: effectivePlanId,
        date,
        tacticScores: [],
        reflection: { whatWentWell, whatDidntGoWell: '', wins: '', onePercentBetter: '', tomorrowsPriority, scoreManual: null },
        leadMeasureTitles: {},
        leadMeasureTargets: {},
        leadMeasureSubtypes: {},
      });
      queryClient.invalidateQueries({ queryKey: ['strategy', 'reviews'] });
      queryClient.invalidateQueries({ queryKey: ['strategy', 'daily-reviews-for-week'] });
      queryClient.invalidateQueries({ queryKey: ['strategy', 'list'] });
      onSaved(id);
    } catch (e) { setError(e instanceof Error ? e.message : 'Save failed.'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <h2 className={styles.formTitle}>Daily Review</h2>
      <div className={styles.field}>
        <label className={styles.label}>Date</label>
        <input className={styles.input} type="date" value={date} onChange={e => setDate(e.target.value)} />
      </div>
      {!effectivePlanId && date && <div style={{ padding: '0 20px 12px', fontSize: 12, color: 'rgba(252,251,248,0.45)' }}>No weekly plan covers this date.</div>}
      <div className={styles.field}>
        <label className={styles.label}>What went well?</label>
        <textarea className={styles.textarea} placeholder="…" value={whatWentWell} onChange={e => setWhatWentWell(e.target.value)} />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Tomorrow's priority</label>
        <textarea className={styles.textarea} placeholder="…" value={tomorrowsPriority} onChange={e => setTomorrowsPriority(e.target.value)} />
      </div>
      <div className={styles.bodySpacer} />
      {error && <div className={styles.errorBanner}>{error}</div>}
      <div className={styles.footer}>
        {onBack && <button type="button" className={styles.btnBack} onClick={onBack}>← Back</button>}
        <button type="button" className={styles.btnSave} onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Create Review'}</button>
      </div>
    </>
  );
}

// ── Form: Weekly Review ───────────────────────────────────────────────────────

function WeeklyReviewForm({ context, onSaved, onBack }: FormProps) {
  const { data: cycle } = useActiveCycle();
  const { data: plans = [] } = useWeeklyPlans(cycle?.id);
  const [planId, setPlanId] = useState(context.weeklyPlanId ?? '');
  const [wins, setWins] = useState('');
  const [nextWeekFocus, setNextWeekFocus] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedPlan = plans.find(p => p.id === planId) ?? plans[0];
  const effectivePlanId = planId || selectedPlan?.id || '';

  const handleSave = async () => {
    if (!effectivePlanId || !cycle?.id || !cycle.period_start) { setError('Select a weekly plan.'); return; }
    const plan = plans.find(p => p.id === effectivePlanId);
    if (!plan?.period_start) { setError('Plan is missing dates.'); return; }
    setSaving(true); setError('');
    try {
      const id = await createWeeklyReview({
        weeklyPlanId: effectivePlanId,
        cycleId: cycle.id,
        cycleStartDate: cycle.period_start,
        weekStartDate: plan.period_start,
        scorecard: [],
        reflection: { wins, whatDidntGoWell: '', lessons: '', onePercentBetter: '', nextWeekFocus, adjustments: '', scoreManual: null },
      });
      queryClient.invalidateQueries({ queryKey: ['strategy', 'reviews'] });
      queryClient.invalidateQueries({ queryKey: ['strategy', 'weekly-reviews-for-plans'] });
      queryClient.invalidateQueries({ queryKey: ['strategy', 'list'] });
      onSaved(id);
    } catch (e) { setError(e instanceof Error ? e.message : 'Save failed.'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <h2 className={styles.formTitle}>Weekly Review</h2>
      <div className={styles.field}>
        <label className={styles.label}>Weekly plan</label>
        <select className={`${styles.input} ${styles.select}`} value={effectivePlanId} onChange={e => setPlanId(e.target.value)}>
          {plans.length === 0 && <option value="">No plans available</option>}
          {plans.map(p => <option key={p.id} value={p.id}>Week {p.sort_order} {p.period_start ? `(${p.period_start})` : ''}</option>)}
        </select>
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Wins</label>
        <textarea className={styles.textarea} placeholder="What went well this week?" value={wins} onChange={e => setWins(e.target.value)} />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Next week focus</label>
        <textarea className={styles.textarea} placeholder="What's most important next week?" value={nextWeekFocus} onChange={e => setNextWeekFocus(e.target.value)} />
      </div>
      <div className={styles.bodySpacer} />
      {error && <div className={styles.errorBanner}>{error}</div>}
      <div className={styles.footer}>
        {onBack && <button type="button" className={styles.btnBack} onClick={onBack}>← Back</button>}
        <button type="button" className={styles.btnSave} onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Create Review'}</button>
      </div>
    </>
  );
}

// ── Form: 12-Week Review ──────────────────────────────────────────────────────

function CycleReviewForm({ context, onSaved, onBack }: FormProps) {
  const { data: cycle } = useActiveCycle();
  const cycleId = context.cycleId ?? cycle?.id ?? '';
  const cycleName = cycle?.title ?? 'Current Cycle';
  const today = todayDefault();
  const [whatWorked, setWhatWorked] = useState('');
  const [whatToChange, setWhatToChange] = useState('');
  const [inputsForNextCycle, setInputsForNextCycle] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!cycleId) { setError('No active cycle.'); return; }
    setSaving(true); setError('');
    try {
      const id = await createCycleReview({ cycleId, cycleName, cycleIndex: 1, date: today, goalResults: '', overallScore: 0, whatWorked, whatToChange, inputsForNextCycle });
      queryClient.invalidateQueries({ queryKey: ['strategy', 'reviews'] });
      queryClient.invalidateQueries({ queryKey: ['strategy', 'list'] });
      onSaved(id);
    } catch (e) { setError(e instanceof Error ? e.message : 'Save failed.'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <h2 className={styles.formTitle}>12-Week Review</h2>
      <div className={styles.field}>
        <label className={styles.label}>Cycle</label>
        <input className={`${styles.input} ${styles.inputReadonly}`} readOnly value={cycleName || 'No active cycle'} />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>What worked</label>
        <textarea className={styles.textarea} placeholder="…" value={whatWorked} onChange={e => setWhatWorked(e.target.value)} />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>What to change next cycle</label>
        <textarea className={styles.textarea} placeholder="…" value={whatToChange} onChange={e => setWhatToChange(e.target.value)} />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Inputs for next cycle</label>
        <textarea className={styles.textarea} placeholder="…" value={inputsForNextCycle} onChange={e => setInputsForNextCycle(e.target.value)} />
      </div>
      <div className={styles.bodySpacer} />
      {error && <div className={styles.errorBanner}>{error}</div>}
      <div className={styles.footer}>
        {onBack && <button type="button" className={styles.btnBack} onClick={onBack}>← Back</button>}
        <button type="button" className={styles.btnSave} onClick={handleSave} disabled={saving || !cycleId}>{saving ? 'Saving…' : 'Create Review'}</button>
      </div>
    </>
  );
}

// ── Form: 13th-Week Review ────────────────────────────────────────────────────

function ThirteenthWeekForm({ context, onSaved, onBack }: FormProps) {
  const { data: cycle } = useActiveCycle();
  const cycleId = context.cycleId ?? cycle?.id ?? '';
  const cycleName = cycle?.title ?? 'Current Cycle';
  const today = todayDefault();
  const [celebrate, setCelebrate] = useState('');
  const [rest, setRest] = useState('');
  const [reflect, setReflect] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!cycleId) { setError('No active cycle.'); return; }
    setSaving(true); setError('');
    try {
      const id = await createThirteenthWeekReview({ fromCycleId: cycleId, cycleName, cycleIndex: 1, date: today, celebrate, rest, reflect, nextCycleDraft: '' });
      queryClient.invalidateQueries({ queryKey: ['strategy', 'reviews'] });
      queryClient.invalidateQueries({ queryKey: ['strategy', 'list'] });
      onSaved(id);
    } catch (e) { setError(e instanceof Error ? e.message : 'Save failed.'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <h2 className={styles.formTitle}>13th-Week Review</h2>
      <div className={styles.field}>
        <label className={styles.label}>Celebrate — what are you proud of?</label>
        <textarea className={styles.textarea} placeholder="…" value={celebrate} onChange={e => setCelebrate(e.target.value)} />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Rest — how will you recharge?</label>
        <textarea className={styles.textarea} placeholder="…" value={rest} onChange={e => setRest(e.target.value)} />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Reflect — what patterns emerged?</label>
        <textarea className={styles.textarea} placeholder="…" value={reflect} onChange={e => setReflect(e.target.value)} />
      </div>
      <div className={styles.bodySpacer} />
      {error && <div className={styles.errorBanner}>{error}</div>}
      <div className={styles.footer}>
        {onBack && <button type="button" className={styles.btnBack} onClick={onBack}>← Back</button>}
        <button type="button" className={styles.btnSave} onClick={handleSave} disabled={saving || !cycleId}>{saving ? 'Saving…' : 'Create Review'}</button>
      </div>
    </>
  );
}

// ── Form: Annual Review ───────────────────────────────────────────────────────

function AnnualReviewForm({ onSaved, onBack }: FormProps) {
  const year = new Date().getFullYear();
  const today = todayDefault();
  const [biggestWins, setBiggestWins] = useState('');
  const [biggestChallenges, setBiggestChallenges] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const id = await createAnnualReview({ year, date: today, cycleScores: '', byArea: '', biggestWins, biggestChallenges, patternsAndLessons: '', visionUpdates: '', inputsForNextYear: '', averageScore: 0 });
      queryClient.invalidateQueries({ queryKey: ['strategy', 'reviews'] });
      queryClient.invalidateQueries({ queryKey: ['strategy', 'list'] });
      onSaved(id);
    } catch (e) { setError(e instanceof Error ? e.message : 'Save failed.'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <h2 className={styles.formTitle}>Annual Review {year}</h2>
      <div className={styles.field}>
        <label className={styles.label}>Biggest wins</label>
        <textarea className={styles.textarea} placeholder="…" value={biggestWins} onChange={e => setBiggestWins(e.target.value)} />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Biggest challenges</label>
        <textarea className={styles.textarea} placeholder="…" value={biggestChallenges} onChange={e => setBiggestChallenges(e.target.value)} />
      </div>
      <div className={styles.bodySpacer} />
      {error && <div className={styles.errorBanner}>{error}</div>}
      <div className={styles.footer}>
        {onBack && <button type="button" className={styles.btnBack} onClick={onBack}>← Back</button>}
        <button type="button" className={styles.btnSave} onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Create Review'}</button>
      </div>
    </>
  );
}

// ── Type Picker ───────────────────────────────────────────────────────────────

function TypePicker({ onSelect }: { onSelect: (type: DocType) => void }) {
  return (
    <>
      <h2 className={styles.pickerTitle}>Create New</h2>
      {ALL_TYPES.map(type => (
        <button key={type} type="button" className={styles.pickerRow} onClick={() => onSelect(type)}>
          <span className={styles.pickerRowLabel}>{TYPE_LABELS[type]}</span>
          <span className={styles.pickerRowChevron}>›</span>
        </button>
      ))}
      <div className={styles.bodySpacer} />
    </>
  );
}

// ── Form router ───────────────────────────────────────────────────────────────

function FormRouter({ type, context, onSaved, onBack }: { type: DocType } & FormProps) {
  const props = { context, onSaved, onBack };
  switch (type) {
    case 'area':                return <AreaForm {...props} />;
    case 'annual-outcomes':     return <AnnualOutcomesForm {...props} />;
    case '12-week-overview':    return <CycleForm {...props} />;
    case '12-week-goal':        return <GoalForm {...props} />;
    case 'weekly-plan':         return <WeeklyPlanForm {...props} />;
    case 'daily-review':        return <DailyReviewForm {...props} />;
    case 'weekly-review':       return <WeeklyReviewForm {...props} />;
    case '12-week-review':      return <CycleReviewForm {...props} />;
    case '13th-week-review':    return <ThirteenthWeekForm {...props} />;
    case 'annual-review':       return <AnnualReviewForm {...props} />;
  }
}

// ── Main component ────────────────────────────────────────────────────────────

type CreateDocSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialType?: DocType;
  context?: CreateContext;
  onCreated?: (id: string, type: DocType) => void;
};

export function CreateDocSheet({
  open,
  onOpenChange,
  initialType,
  context = {},
  onCreated,
}: CreateDocSheetProps) {
  useRegisterWizard(open);
  const [selectedType, setSelectedType] = useState<DocType | null>(initialType ?? null);

  if (!open) return null;

  const showPicker = selectedType === null && !initialType;
  const activeType = selectedType ?? initialType ?? null;

  const handleSaved = (id: string) => {
    onCreated?.(id, activeType!);
    onOpenChange(false);
    setSelectedType(null);
  };

  const handleBack = initialType
    ? () => onOpenChange(false) // go back = close if opened with fixed type
    : () => setSelectedType(null);

  const handleCancel = () => {
    onOpenChange(false);
    setSelectedType(null);
  };

  const heading = activeType ? TYPE_LABELS[activeType] : 'New Document';

  return (
    <div className={styles.overlay}>
      <div className={styles.topbar}>
        <span className={styles.heading}>{showPicker ? 'Create' : heading}</span>
        <button type="button" className={styles.cancelBtn} onClick={handleCancel}>Cancel</button>
      </div>

      <div className={styles.body}>
        {showPicker && <TypePicker onSelect={type => setSelectedType(type)} />}
        {!showPicker && activeType && (
          <FormRouter
            type={activeType}
            context={context}
            onSaved={handleSaved}
            onBack={initialType ? undefined : handleBack}
          />
        )}
      </div>
    </div>
  );
}
