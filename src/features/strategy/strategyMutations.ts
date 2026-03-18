/**
 * Strategy mutations
 *
 * All writes go directly through supabase.from('items').insert/update because
 * the generic insertItem/patchItem helpers in db.ts don't expose strategy-specific
 * columns (period_start, period_end, progress, frequency, target, sort_order,
 * description). Content is mirrored to item_content per the app convention.
 */

import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { getCurrentUserId } from '@/lib/db';
import {
  calcCycleEndDate,
  calcCycleWeek,
  calcWeekIso,
  calcWeekBounds,
  calcDailyReviewScore,
  generateFilename,
  generateDocumentContent,
  todayIsoDate,
} from './strategyUtils';
import type { TacticScore, DailyReviewReflection, WeeklyReviewReflection } from './types';
import type { LeadMeasureInput } from './strategyUtils';

// ── Internal helpers ──────────────────────────────────────────────────────────

function nowIso(): string {
  return new Date().toISOString();
}

/** Mirrors content to item_content table (same as insertItem does). */
async function mirrorContent(itemId: string, content: string, owner: string | null): Promise<void> {
  const now = nowIso();
  const { error } = await supabase.from('item_content').upsert(
    { item_id: itemId, content, updated_at: now, owner },
    { onConflict: 'item_id' },
  );
  if (error) console.error('[strategy] item_content mirror error:', error);
}

/** Base row shape common to all strategy items. */
function baseRow(owner: string | null) {
  const now = nowIso();
  return {
    is_pinned: false,
    completed: false,
    is_next: false,
    is_someday: false,
    is_waiting: false,
    is_trashed: false,
    trashed_at: null,
    processed: false,
    created_at: now,
    updated_at: now,
    owner,
  };
}

// ── Life Areas ────────────────────────────────────────────────────────────────

export type CreateAreaInput = {
  name: string;
  vision: string;
};

export async function createArea({ name, vision }: CreateAreaInput): Promise<string> {
  const owner = await getCurrentUserId();
  const id = uuidv4();
  const filename = generateFilename('area', { name });
  const content = generateDocumentContent('area', { vision });

  const { error } = await supabase.from('items').insert({
    ...baseRow(owner),
    id,
    type: 'area',
    title: name,
    filename,
    content,
    item_status: 'waiting',
    has_todos: false,
  });
  if (error) throw error;

  await mirrorContent(id, content, owner);
  return id;
}

export async function patchAreaStatus(areaId: string, status: 'active' | 'maintenance' | 'waiting'): Promise<void> {
  const { error } = await supabase
    .from('items')
    .update({ item_status: status, updated_at: nowIso() })
    .eq('id', areaId);
  if (error) throw error;
}

// ── Annual Outcomes ───────────────────────────────────────────────────────────

export type CreateAnnualOutcomesInput = {
  areaId: string;
  areaName: string;
  year: number | string;
  outcomes: string[]; // one outcome per line
};

export async function createAnnualOutcomes({
  areaId,
  areaName,
  year,
  outcomes,
}: CreateAnnualOutcomesInput): Promise<string> {
  const owner = await getCurrentUserId();
  const id = uuidv4();
  const filename = generateFilename('annual-outcomes', { area: areaName, year });
  const areaFilename = generateFilename('area', { name: areaName });
  const content = generateDocumentContent('annual-outcomes', {
    areaFilename,
    outcomes: outcomes.join('\n'),
  });

  const { error } = await supabase.from('items').insert({
    ...baseRow(owner),
    id,
    type: 'annual-outcomes',
    title: `${areaName} — ${year} Outcomes`,
    filename,
    content,
    item_status: 'active',
    subtype: String(year),
    parent_id: areaId,
    has_todos: false,
  });
  if (error) throw error;

  await mirrorContent(id, content, owner);
  return id;
}

// ── 12-Week Cycle Overview ────────────────────────────────────────────────────

export type CreateCycleOverviewInput = {
  name: string;
  startDate: string; // YYYY-MM-DD
  cycleIndex?: number;
};

export async function createCycleOverview({
  name,
  startDate,
  cycleIndex = 1,
}: CreateCycleOverviewInput): Promise<string> {
  const owner = await getCurrentUserId();
  const id = uuidv4();
  const endDate = calcCycleEndDate(startDate);
  const year = startDate.slice(0, 4);
  const filename = generateFilename('12-week-overview', { year, cycleIndex });
  const content = generateDocumentContent('12-week-overview', { goalNames: '' });

  const { error } = await supabase.from('items').insert({
    ...baseRow(owner),
    id,
    type: '12-week-overview',
    title: name,
    filename,
    content,
    item_status: 'active',
    period_start: startDate,
    period_end: endDate,
    has_todos: false,
  });
  if (error) throw error;

  await mirrorContent(id, content, owner);
  return id;
}

export async function archiveCycle(cycleId: string): Promise<void> {
  const now = nowIso();

  // Archive the cycle
  const { error: cycleError } = await supabase
    .from('items')
    .update({ item_status: 'archived', updated_at: now })
    .eq('id', cycleId);
  if (cycleError) throw cycleError;

  // Archive all goals in the cycle
  const { error: goalError } = await supabase
    .from('items')
    .update({ item_status: 'archived', updated_at: now })
    .eq('type', '12-week-goal')
    .eq('parent_id', cycleId);
  if (goalError) throw goalError;
}

// ── 12-Week Goals ─────────────────────────────────────────────────────────────

export type CreateGoalInput = {
  cycleId: string;
  areaId: string;
  name: string;
  lagMeasure: string;
  leadMeasures: LeadMeasureInput[];
};

export async function createGoal({
  cycleId,
  areaId,
  name,
  lagMeasure,
  leadMeasures,
}: CreateGoalInput): Promise<string> {
  const owner = await getCurrentUserId();
  const id = uuidv4();
  const filename = generateFilename('12-week-goal', { goalName: name });
  const content = generateDocumentContent('12-week-goal', {
    lagMeasure,
    leadMeasures,
  });

  const { error } = await supabase.from('items').insert({
    ...baseRow(owner),
    id,
    type: '12-week-goal',
    title: name,
    filename,
    content,
    item_status: 'active',
    parent_id: cycleId,
    description: lagMeasure,
    has_todos: false,
  });
  if (error) throw error;

  await mirrorContent(id, content, owner);

  // Create lead-measure child items
  for (let i = 0; i < leadMeasures.length; i++) {
    await createLeadMeasure({
      goalId: id,
      title: leadMeasures[i].title,
      subtype: leadMeasures[i].subtype,
      target: leadMeasures[i].target ?? null,
      frequency: leadMeasures[i].frequency ?? null,
      sortOrder: i,
    });
  }

  return id;
}

// ── Lead Measures ─────────────────────────────────────────────────────────────

export type CreateLeadMeasureInput = {
  goalId: string;
  title: string;
  subtype: 'binary' | 'numeric';
  target?: number | null;
  frequency?: string | null;
  sortOrder?: number;
};

export async function createLeadMeasure({
  goalId,
  title,
  subtype,
  target,
  frequency,
  sortOrder = 0,
}: CreateLeadMeasureInput): Promise<string> {
  const owner = await getCurrentUserId();
  const id = uuidv4();

  const { error } = await supabase.from('items').insert({
    ...baseRow(owner),
    id,
    type: 'lead-measure',
    title,
    item_status: 'active',
    parent_id: goalId,
    subtype,
    target: target ?? null,
    frequency: frequency ?? null,
    sort_order: sortOrder,
    has_todos: false,
  });
  if (error) throw error;

  return id;
}

// ── Weekly Plans ──────────────────────────────────────────────────────────────

export type CreateWeeklyPlanInput = {
  cycleId: string;
  cycleStartDate: string;
  weekStartDate?: string; // defaults to this Monday
  tacticLines: string; // pre-formatted markdown tactics block
  additionalItems?: string;
  notes?: string;
};

export async function createWeeklyPlan({
  cycleId,
  cycleStartDate,
  weekStartDate,
  tacticLines,
  additionalItems = '',
  notes = '',
}: CreateWeeklyPlanInput): Promise<string> {
  const owner = await getCurrentUserId();
  const id = uuidv4();

  const startDate = weekStartDate ?? calcWeekBounds(todayIsoDate()).start;
  const { end: endDate } = calcWeekBounds(startDate);
  const weekIso = calcWeekIso(startDate);
  const cycleWeek = calcCycleWeek(cycleStartDate, startDate);
  const year = startDate.slice(0, 4);

  const filename = generateFilename('weekly-plan', { weekIso });
  const content = generateDocumentContent('weekly-plan', {
    tactics: tacticLines,
    notes,
  });

  const { error } = await supabase.from('items').insert({
    ...baseRow(owner),
    id,
    type: 'weekly-plan',
    title: `Week ${cycleWeek}`,
    filename,
    content,
    item_status: 'active',
    parent_id: cycleId,
    subtype: weekIso,
    period_start: startDate,
    period_end: endDate,
    sort_order: cycleWeek,
    has_todos: content.includes('- [ ]'),
  });
  if (error) throw error;

  await mirrorContent(id, content, owner);
  return id;
}

// ── Daily Reviews ─────────────────────────────────────────────────────────────

export type CreateDailyReviewInput = {
  weeklyPlanId: string | null;
  date: string; // YYYY-MM-DD
  tacticScores: TacticScore[];
  reflection: DailyReviewReflection;
  leadMeasureTitles: Record<string, string>; // id → title
  leadMeasureTargets: Record<string, number | null>; // id → target
  leadMeasureSubtypes: Record<string, 'binary' | 'numeric'>; // id → subtype
};

export async function createDailyReview({
  weeklyPlanId,
  date,
  tacticScores,
  reflection,
  leadMeasureTitles,
  leadMeasureTargets,
  leadMeasureSubtypes,
}: CreateDailyReviewInput): Promise<string> {
  const owner = await getCurrentUserId();
  const id = uuidv4();

  // Build the lead measures table rows
  const tableRows = tacticScores
    .map((s) => {
      const title = leadMeasureTitles[s.leadMeasureId] ?? '';
      const subtype = leadMeasureSubtypes[s.leadMeasureId] ?? 'binary';
      const target = subtype === 'numeric' && leadMeasureTargets[s.leadMeasureId] != null
        ? String(leadMeasureTargets[s.leadMeasureId])
        : '—';
      const actual = subtype === 'numeric' && s.actual != null ? `${s.actual}` : '—';
      const done = s.completed ? '✅' : '❌';
      return `| ${title} | ${target} | ${actual} | ${done} | ${s.note} |`;
    })
    .join('\n');

  // Calculate score
  const mockEntries = tacticScores.map((s) => ({
    completed: s.completed,
  })) as import('./types').TacticEntryItem[];
  const scoreAuto = calcDailyReviewScore(mockEntries);
  const score = reflection.scoreManual ?? scoreAuto;

  const content = generateDocumentContent('daily-review', {
    tableRows,
    whatWentWell: reflection.whatWentWell,
    whatDidntGoWell: reflection.whatDidntGoWell,
    wins: reflection.wins,
    onePercentBetter: reflection.onePercentBetter,
    tomorrowsPriority: reflection.tomorrowsPriority,
  });

  // Insert daily review
  const { error } = await supabase.from('items').insert({
    ...baseRow(owner),
    id,
    type: 'daily-review',
    title: `Daily Review — ${date}`,
    filename: generateFilename('daily-review', { date }),
    content,
    item_status: 'active',
    parent_id: weeklyPlanId,
    period_start: date,
    progress: score,
    description: `score_auto:${scoreAuto},score_manual:${reflection.scoreManual ?? 'null'}`,
    has_todos: false,
  });
  if (error) throw error;

  await mirrorContent(id, content, owner);

  // Insert tactic-entry rows (one per scored lead measure)
  for (const score of tacticScores) {
    const entryId = uuidv4();
    const { error: entryError } = await supabase.from('items').insert({
      ...baseRow(owner),
      id: entryId,
      type: 'tactic-entry',
      title: leadMeasureTitles[score.leadMeasureId] ?? '',
      item_status: 'active',
      parent_id: score.leadMeasureId,
      period_start: date,
      completed: score.completed,
      progress: score.actual ?? null,
      body: score.note || null,
      description: id, // reference back to the daily-review item
      has_todos: false,
    });
    if (entryError) {
      console.error('[strategy] tactic-entry insert error:', entryError);
    }
  }

  return id;
}

// ── Weekly Reviews ────────────────────────────────────────────────────────────

export type WeeklyScorecardRow = {
  tacticTitle: string;
  days: ('complete' | 'incomplete' | 'none')[]; // Mon–Sun
  score: string; // e.g. '5/5'
};

export type CreateWeeklyReviewInput = {
  weeklyPlanId: string;
  cycleId: string;
  cycleStartDate: string;
  weekStartDate: string;
  scorecard: WeeklyScorecardRow[];
  reflection: WeeklyReviewReflection;
};

export async function createWeeklyReview({
  weeklyPlanId,
  cycleId,
  cycleStartDate,
  weekStartDate,
  scorecard,
  reflection,
}: CreateWeeklyReviewInput): Promise<string> {
  const owner = await getCurrentUserId();
  const id = uuidv4();

  const cycleWeek = calcCycleWeek(cycleStartDate, weekStartDate);
  const weekIso = calcWeekIso(weekStartDate);

  const totalSlots = scorecard.reduce((acc, row) => {
    return acc + row.days.filter((d) => d !== 'none').length;
  }, 0);
  const completedSlots = scorecard.reduce((acc, row) => {
    return acc + row.days.filter((d) => d === 'complete').length;
  }, 0);
  const scoreAuto = totalSlots > 0 ? Math.round((completedSlots / totalSlots) * 100) : 0;
  const score = reflection.scoreManual ?? scoreAuto;

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const tableRows = scorecard
    .map((row) => {
      const dayCells = row.days
        .map((d, i) => {
          if (d === 'none') return '·';
          if (d === 'complete') return '✅';
          return '❌';
        })
        .join(' | ');
      return `| ${row.tacticTitle} | ${dayCells} | ${row.score} |`;
    })
    .join('\n');

  const tableHeader = `| Tactic | ${dayLabels.join(' | ')} | Score |\n|---|---|---|---|---|---|---|---|---|`;

  const content = generateDocumentContent('weekly-review', {
    scorecard: score,
    tableRows: `${tableHeader}\n${tableRows}`,
    wins: reflection.wins,
    whatDidntGoWell: reflection.whatDidntGoWell,
    lessons: reflection.lessons,
    onePercentBetter: reflection.onePercentBetter,
    nextWeekFocus: reflection.nextWeekFocus,
    adjustments: reflection.adjustments,
  });

  const { error } = await supabase.from('items').insert({
    ...baseRow(owner),
    id,
    type: 'weekly-review',
    title: `Weekly Review — Week ${cycleWeek}`,
    filename: generateFilename('weekly-review', { weekIso }),
    content,
    item_status: 'active',
    parent_id: weeklyPlanId,
    period_start: weekStartDate,
    sort_order: cycleWeek,
    progress: score,
    description: `score_auto:${scoreAuto},score_manual:${reflection.scoreManual ?? 'null'}`,
    has_todos: false,
  });
  if (error) throw error;

  await mirrorContent(id, content, owner);
  return id;
}

// ── 12-Week Review ────────────────────────────────────────────────────────────

export type CreateCycleReviewInput = {
  cycleId: string;
  cycleName: string;
  cycleIndex: number;
  date: string; // YYYY-MM-DD
  goalResults: string;
  overallScore: number;
  whatWorked: string;
  whatToChange: string;
  inputsForNextCycle: string;
};

export async function createCycleReview({
  cycleId,
  cycleName,
  cycleIndex,
  date,
  goalResults,
  overallScore,
  whatWorked,
  whatToChange,
  inputsForNextCycle,
}: CreateCycleReviewInput): Promise<string> {
  const owner = await getCurrentUserId();
  const id = uuidv4();
  const year = date.slice(0, 4);
  const filename = generateFilename('12-week-review', { year, cycleIndex });
  const content = generateDocumentContent('12-week-review', {
    goalResults,
    overallScore,
    whatWorked,
    whatToChange,
    inputsForNextCycle,
  });

  const { error } = await supabase.from('items').insert({
    ...baseRow(owner),
    id,
    type: '12-week-review',
    title: `12-Week Review — ${cycleName}`,
    filename,
    content,
    item_status: 'active',
    parent_id: cycleId,
    period_start: date,
    progress: overallScore,
    has_todos: false,
  });
  if (error) throw error;

  await mirrorContent(id, content, owner);
  return id;
}

// ── 13th-Week Review ──────────────────────────────────────────────────────────

export type CreateThirteenthWeekReviewInput = {
  fromCycleId: string;
  cycleName: string;
  cycleIndex: number;
  date: string;
  celebrate: string;
  rest: string;
  reflect: string;
  nextCycleDraft: string;
};

export async function createThirteenthWeekReview({
  fromCycleId,
  cycleName,
  cycleIndex,
  date,
  celebrate,
  rest,
  reflect,
  nextCycleDraft,
}: CreateThirteenthWeekReviewInput): Promise<string> {
  const owner = await getCurrentUserId();
  const id = uuidv4();
  const year = date.slice(0, 4);
  const filename = generateFilename('13th-week-review', { year, cycleIndex });
  const content = generateDocumentContent('13th-week-review', {
    celebrate,
    rest,
    reflect,
    nextCycleDraft,
  });

  const { error } = await supabase.from('items').insert({
    ...baseRow(owner),
    id,
    type: '13th-week-review',
    title: `13th Week — ${cycleName}`,
    filename,
    content,
    item_status: 'active',
    parent_id: fromCycleId,
    period_start: date,
    has_todos: false,
  });
  if (error) throw error;

  await mirrorContent(id, content, owner);
  return id;
}

// ── Annual Review ─────────────────────────────────────────────────────────────

export type CreateAnnualReviewInput = {
  year: number | string;
  date: string;
  cycleScores: string;
  byArea: string;
  biggestWins: string;
  biggestChallenges: string;
  patternsAndLessons: string;
  visionUpdates: string;
  inputsForNextYear: string;
  averageScore: number;
};

export async function createAnnualReview({
  year,
  date,
  cycleScores,
  byArea,
  biggestWins,
  biggestChallenges,
  patternsAndLessons,
  visionUpdates,
  inputsForNextYear,
  averageScore,
}: CreateAnnualReviewInput): Promise<string> {
  const owner = await getCurrentUserId();
  const id = uuidv4();
  const filename = generateFilename('annual-review', { year });
  const content = generateDocumentContent('annual-review', {
    cycleScores,
    byArea,
    biggestWins,
    biggestChallenges,
    patternsAndLessons,
    visionUpdates,
    inputsForNextYear,
  });

  const { error } = await supabase.from('items').insert({
    ...baseRow(owner),
    id,
    type: 'annual-review',
    title: `${year} Annual Review`,
    filename,
    content,
    item_status: 'active',
    subtype: String(year),
    period_start: date,
    progress: averageScore,
    has_todos: false,
  });
  if (error) throw error;

  await mirrorContent(id, content, owner);
  return id;
}

// ── Cycle Transition State ─────────────────────────────────────────────────────

export type CompletedSteps = Partial<Record<string, string>>;

export async function createTransitionState({
  fromCycleId,
  cycleName,
}: {
  fromCycleId: string;
  cycleName: string;
}): Promise<string> {
  const owner = await getCurrentUserId();
  const id = uuidv4();
  const body = JSON.stringify({
    from_cycle_id: fromCycleId,
    started_at: nowIso(),
    completed_steps: {},
  });

  const { error } = await supabase.from('items').insert({
    ...baseRow(owner),
    id,
    type: 'cycle-transition-state',
    title: `Transition: ${cycleName}`,
    subtype: 'active',
    parent_id: fromCycleId,
    sort_order: 1,
    body,
    has_todos: false,
  });
  if (error) throw error;

  return id;
}

export async function advanceTransitionState(
  stateId: string,
  nextStep: number,
  completedSteps: CompletedSteps,
): Promise<void> {
  const body = JSON.stringify({ completed_steps: completedSteps });
  const { error } = await supabase
    .from('items')
    .update({ sort_order: nextStep, body, updated_at: nowIso() })
    .eq('id', stateId);
  if (error) throw error;
}

export async function completeTransition(stateId: string): Promise<void> {
  const now = nowIso();
  const { error } = await supabase
    .from('items')
    .update({ is_trashed: true, trashed_at: now, updated_at: now })
    .eq('id', stateId);
  if (error) throw error;
}

// ── Generic item patch for strategy fields ────────────────────────────────────

export type StrategyPatch = {
  title?: string;
  content?: string;
  item_status?: string;
  progress?: number | null;
  period_start?: string | null;
  period_end?: string | null;
  sort_order?: number | null;
  description?: string | null;
  parent_id?: string | null;
};

export async function patchStrategyItem(id: string, patch: StrategyPatch): Promise<void> {
  const update: Record<string, unknown> = { ...patch, updated_at: nowIso() };
  if ('content' in patch && patch.content !== undefined) {
    update.has_todos = patch.content?.includes('- [ ]') ?? false;
  }

  const { error } = await supabase.from('items').update(update).eq('id', id);
  if (error) throw error;

  if (patch.content !== undefined) {
    const owner = await getCurrentUserId();
    await mirrorContent(id, patch.content ?? '', owner);
  }
}
