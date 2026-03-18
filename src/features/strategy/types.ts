import type { ItemRow } from '@/lib/db';

// ── Strategy document type constants ──────────────────────────────────────────

export const STRATEGY_TYPES = {
  AREA: 'area',
  ANNUAL_OUTCOMES: 'annual-outcomes',
  CYCLE_OVERVIEW: '12-week-overview',
  GOAL: '12-week-goal',
  LEAD_MEASURE: 'lead-measure',
  WEEKLY_PLAN: 'weekly-plan',
  DAILY_REVIEW: 'daily-review',
  WEEKLY_REVIEW: 'weekly-review',
  CYCLE_REVIEW: '12-week-review',
  THIRTEENTH_WEEK_REVIEW: '13th-week-review',
  ANNUAL_REVIEW: 'annual-review',
  TACTIC_ENTRY: 'tactic-entry',
  CYCLE_TRANSITION_STATE: 'cycle-transition-state',
} as const;

export type StrategyItemType = (typeof STRATEGY_TYPES)[keyof typeof STRATEGY_TYPES];

// ── Branded document types ────────────────────────────────────────────────────
// Aliases over ItemRow — no runtime overhead, just type-level documentation.
// Column semantics per type:
//   area:               item_status=active|maintenance|waiting, parent_id→active cycle
//   annual-outcomes:    subtype=year, parent_id→area
//   12-week-overview:   period_start/end=cycle dates, item_status=active|archived
//   12-week-goal:       parent_id→cycle, description=lag measure
//   lead-measure:       parent_id→goal, subtype=binary|numeric, target, frequency
//   weekly-plan:        parent_id→cycle, subtype=ISO week, sort_order=cycle week, period_start/end
//   daily-review:       parent_id→weekly-plan, period_start=date, progress=score
//   weekly-review:      parent_id→weekly-plan, sort_order=cycle week, progress=scorecard
//   12-week-review:     parent_id→cycle, progress=overall score
//   13th-week-review:   parent_id→completed cycle
//   annual-review:      subtype=year, progress=avg score
//   tactic-entry:       parent_id→lead-measure, period_start=date, completed, progress=actual value

export type AreaItem = ItemRow & { type: 'area' };
export type AnnualOutcomesItem = ItemRow & { type: 'annual-outcomes' };
export type CycleOverviewItem = ItemRow & { type: '12-week-overview' };
export type GoalItem = ItemRow & { type: '12-week-goal' };
export type LeadMeasureItem = ItemRow & { type: 'lead-measure' };
export type WeeklyPlanItem = ItemRow & { type: 'weekly-plan' };
export type DailyReviewItem = ItemRow & { type: 'daily-review' };
export type WeeklyReviewItem = ItemRow & { type: 'weekly-review' };
export type CycleReviewItem = ItemRow & { type: '12-week-review' };
export type ThirteenthWeekReviewItem = ItemRow & { type: '13th-week-review' };
export type AnnualReviewItem = ItemRow & { type: 'annual-review' };
export type TacticEntryItem = ItemRow & { type: 'tactic-entry' };
export type CycleTransitionStateItem = ItemRow & { type: 'cycle-transition-state' };

// ── Tactic sub-types ──────────────────────────────────────────────────────────

export type TacticType = 'binary' | 'numeric';

// ── Lead measure frequency values ─────────────────────────────────────────────

export type FrequencyValue =
  | 'Mon–Fri'
  | 'daily'
  | 'weekly'
  | 'Mon'
  | 'Tue'
  | 'Wed'
  | 'Thu'
  | 'Fri'
  | 'Sat'
  | 'Sun';

// ── Area cycle status ─────────────────────────────────────────────────────────

export type AreaStatus = 'active' | 'maintenance' | 'waiting';

// ── Well-known section keys for strategy-detail navigation ────────────────────

export type StrategyDetailSection =
  | 'current-cycle'
  | 'scorecard'
  | 'weekly-plans'
  | 'reviews'
  | 'life-areas'
  | 'archive'
  | 'templates';

export const STRATEGY_SECTIONS: StrategyDetailSection[] = [
  'current-cycle',
  'scorecard',
  'weekly-plans',
  'reviews',
  'life-areas',
  'archive',
  'templates',
];

export function isStrategySection(id: string): id is StrategyDetailSection {
  return (STRATEGY_SECTIONS as string[]).includes(id);
}

// ── Aggregate return type for useStrategyList ─────────────────────────────────

export type StrategyListData = {
  activeCycle: CycleOverviewItem | null;
  currentWeekPlan: WeeklyPlanItem | null;
  currentWeekScore: number | null; // from weekly-review.progress; null = no review yet
  goalCount: number;
  weeklyPlanCount: number; // plans for current cycle
  reviewCount: number;
  areaCount: number;
  archivedCycleCount: number;
};

// ── Tactic score used in daily review wizard ──────────────────────────────────

export type TacticScore = {
  leadMeasureId: string;
  completed: boolean;
  actual: number | null; // numeric measures only
  note: string;
};

// ── Daily review reflection fields ────────────────────────────────────────────

export type DailyReviewReflection = {
  whatWentWell: string;
  whatDidntGoWell: string;
  wins: string;
  onePercentBetter: string;
  tomorrowsPriority: string;
  scoreManual: number | null;
};

// ── Weekly review reflection fields ──────────────────────────────────────────

export type WeeklyReviewReflection = {
  wins: string;
  whatDidntGoWell: string;
  lessons: string;
  onePercentBetter: string;
  nextWeekFocus: string;
  adjustments: string;
  scoreManual: number | null;
};
