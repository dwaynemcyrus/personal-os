import type { LeadMeasureItem, TacticEntryItem, WeeklyPlanItem } from './types';

// ── Display formatters ────────────────────────────────────────────────────────

/** "Jan 15, 2026" */
export function formatDisplayDate(isoDate: string | null | undefined): string {
  if (!isoDate) return '';
  const d = new Date(`${isoDate.slice(0, 10)}T12:00:00`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** "Jan 13–19" (same month) or "Jan 27–Feb 2" (cross-month) */
export function formatWeekRange(start: string, end: string): string {
  const s = new Date(`${start}T12:00:00`);
  const e = new Date(`${end}T12:00:00`);
  const sMonth = s.toLocaleDateString('en-US', { month: 'short' });
  const eMonth = e.toLocaleDateString('en-US', { month: 'short' });
  const sDay = s.getDate();
  const eDay = e.getDate();
  if (sMonth === eMonth) return `${sMonth} ${sDay}–${eDay}`;
  return `${sMonth} ${sDay}–${eMonth} ${eDay}`;
}

/** "Mon", "Tue", … from 0-based day-of-week (0=Sun) */
export const DAY_ABBREVS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/** Returns the 7 ISO date strings (Mon–Sun) for the week containing `date`. */
export function weekDays(date: string): string[] {
  const { start } = calcWeekBounds(date);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(`${start}T12:00:00`);
    d.setDate(d.getDate() + i);
    return toIsoDate(d);
  });
}

// ── Local date helpers ────────────────────────────────────────────────────────

/** Returns an ISO date string (YYYY-MM-DD) for a Date in local time */
export function toIsoDate(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

/** Today's date as YYYY-MM-DD (local time) */
export function todayIsoDate(): string {
  return toIsoDate(new Date());
}

/** Adds N days to an ISO date string. Uses noon to avoid DST edge cases. */
function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

// ── Cycle date arithmetic ─────────────────────────────────────────────────────

/**
 * 12-week cycle end date: start + 83 days (inclusive, so 84 total days = 12 weeks).
 */
export function calcCycleEndDate(startDate: string): string {
  return addDays(startDate, 83);
}

/**
 * Returns which week of the cycle (1–12) a given weekStartDate falls in.
 * Clamps to 1 minimum.
 */
export function calcCycleWeek(cycleStartDate: string, weekStartDate: string): number {
  const cycleStart = new Date(`${cycleStartDate}T12:00:00`);
  const weekStart = new Date(`${weekStartDate}T12:00:00`);
  const diffDays = Math.round(
    (weekStart.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24),
  );
  return Math.max(1, Math.floor(diffDays / 7) + 1);
}

/** Returns the current week number within the cycle based on today's date. */
export function calcCurrentCycleWeek(cycleStartDate: string): number {
  return calcCycleWeek(cycleStartDate, todayIsoDate());
}

/**
 * Returns the ISO 8601 week string (YYYY-Wnn) for a given date.
 * Week starts Monday; week number is determined by the Thursday rule.
 */
export function calcWeekIso(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  const dayOfWeek = d.getDay(); // 0=Sun … 6=Sat
  const thursday = new Date(d);
  thursday.setDate(d.getDate() - ((dayOfWeek + 6) % 7) + 3); // shift to Thursday
  const yearStart = new Date(thursday.getFullYear(), 0, 1);
  const weekNum = Math.ceil(
    ((thursday.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
  );
  return `${thursday.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

/**
 * Returns the Monday (start) and Sunday (end) of the week containing the given date.
 */
export function calcWeekBounds(date: string): { start: string; end: string } {
  const d = new Date(`${date}T12:00:00`);
  const dayOfWeek = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((dayOfWeek + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: toIsoDate(monday), end: toIsoDate(sunday) };
}

// ── Scoring ───────────────────────────────────────────────────────────────────

/**
 * Calculates a review score (0–100) from an array of tactic entries.
 * Returns 0 if no entries provided.
 */
export function calcDailyReviewScore(entries: TacticEntryItem[]): number {
  if (entries.length === 0) return 0;
  const completed = entries.filter((e) => e.completed).length;
  return Math.round((completed / entries.length) * 100);
}

// ── Cycle state checks ────────────────────────────────────────────────────────

/** Returns true if today has passed the cycle's end date. */
export function isCycleTransitionDue(cycleEndDate: string): boolean {
  return todayIsoDate() > cycleEndDate;
}

/**
 * Returns true if it is Saturday and there is no weekly plan covering next week.
 * Used to show the Saturday nudge.
 */
export function isWeeklyPlanDue(plans: WeeklyPlanItem[], today: string): boolean {
  const d = new Date(`${today}T12:00:00`);
  if (d.getDay() !== 6) return false; // only nudge on Saturday

  // Next week's Monday
  const nextMonday = new Date(d);
  nextMonday.setDate(d.getDate() + 2); // Sat → Mon
  const nextWeekIso = calcWeekIso(toIsoDate(nextMonday));
  return !plans.some((p) => p.subtype === nextWeekIso);
}

// ── Frequency parsing ─────────────────────────────────────────────────────────

const DAY_ALIASES: Record<number, string[]> = {
  0: ['sun', 'sunday'],
  1: ['mon', 'monday'],
  2: ['tue', 'tuesday', 'tues'],
  3: ['wed', 'wednesday'],
  4: ['thu', 'thursday', 'thur', 'thurs'],
  5: ['fri', 'friday'],
  6: ['sat', 'saturday'],
};

/**
 * Returns true if a lead measure with the given frequency string applies
 * on the given day of week (0=Sun … 6=Sat).
 */
export function frequencyMatchesDay(frequency: string | null, dayOfWeek: number): boolean {
  if (!frequency) return true;
  const f = frequency.toLowerCase().trim();

  if (f === 'daily' || f === 'every day') return true;
  if (f === 'weekly') return true; // weekly = show every day; user picks when to complete

  if (f === 'mon–fri' || f === 'mon-fri' || f === 'weekdays') {
    return dayOfWeek >= 1 && dayOfWeek <= 5;
  }

  if (f === 'weekends') return dayOfWeek === 0 || dayOfWeek === 6;

  const aliases = DAY_ALIASES[dayOfWeek] ?? [];
  return aliases.some((alias) => f.includes(alias));
}

/** Filters lead measures to those applicable on a given day of week (0–6). */
export function filterLeadMeasuresByDay(
  lms: LeadMeasureItem[],
  dayOfWeek: number,
): LeadMeasureItem[] {
  return lms.filter((lm) => frequencyMatchesDay(lm.frequency, dayOfWeek));
}

// ── Filename generation ───────────────────────────────────────────────────────

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export type FilenameParams = {
  name?: string;
  area?: string;
  year?: number | string;
  cycleIndex?: number;
  goalName?: string;
  weekIso?: string;  // e.g. '2026-W03'
  date?: string;     // YYYY-MM-DD
};

/** Generates a deterministic kebab-case filename per the spec's naming convention. */
export function generateFilename(type: string, params: FilenameParams): string {
  switch (type) {
    case 'area':
      return `area-${slugify(params.name ?? 'unknown')}`;
    case 'annual-outcomes':
      return `annual-outcomes-${slugify(params.area ?? 'unknown')}-${params.year ?? ''}`;
    case '12-week-overview':
      return `12-week-${params.year ?? ''}-${params.cycleIndex ?? 1}`;
    case '12-week-goal':
      return `12w-goal-${slugify(params.goalName ?? 'unknown')}`;
    case 'weekly-plan': {
      // '2026-W03' → 'weekly-plan-2026-w03'
      const wk = (params.weekIso ?? '').replace('W', 'w');
      return `weekly-plan-${wk}`;
    }
    case 'daily-review':
      return `daily-review-${params.date ?? ''}`;
    case 'weekly-review': {
      const wk = (params.weekIso ?? '').replace('W', 'w');
      return `weekly-review-${wk}`;
    }
    case '12-week-review':
      return `12-week-review-${params.year ?? ''}-${params.cycleIndex ?? 1}`;
    case '13th-week-review':
      return `13th-week-review-${params.year ?? ''}-${params.cycleIndex ?? 1}`;
    case 'annual-review':
      return `annual-review-${params.year ?? ''}`;
    default:
      return slugify(params.name ?? type);
  }
}

// ── Document content generation ───────────────────────────────────────────────

export type LeadMeasureInput = {
  title: string;
  subtype: 'binary' | 'numeric';
  target?: number | null;
  frequency?: string | null;
};

function buildLeadMeasuresTable(measures: LeadMeasureInput[]): string {
  if (measures.length === 0) return '';
  const header = '| Tactic | Type | Target | Frequency |\n|---|---|---|---|';
  const rows = measures
    .map((m) => {
      const target = m.subtype === 'numeric' && m.target != null ? String(m.target) : '—';
      return `| ${m.title} | ${m.subtype} | ${target} | ${m.frequency ?? 'weekly'} |`;
    })
    .join('\n');
  return `${header}\n${rows}`;
}

export type DocContentVars = Record<
  string,
  string | number | LeadMeasureInput[] | null | undefined
>;

/**
 * Generates the markdown body content for each strategy document type.
 * This is what gets stored in the `content` column (frontmatter is stored separately
 * in individual columns and reconstructed on export).
 */
export function generateDocumentContent(type: string, vars: DocContentVars): string {
  switch (type) {
    case 'area':
      return `## Vision\n\n${vars.vision ?? ''}`;

    case 'annual-outcomes': {
      const lines = String(vars.outcomes ?? '')
        .split('\n')
        .filter(Boolean);
      const numbered = lines.map((o, i) => `${i + 1}. ${o}`).join('\n');
      return `Vision: [[${vars.areaFilename ?? ''}]]\n\n## Outcomes\n${numbered}`;
    }

    case '12-week-overview': {
      const goalLines = String(vars.goalNames ?? '')
        .split('\n')
        .filter(Boolean);
      const goalLinks = goalLines.map((g, i) => `${i + 1}. [[${g}]]`).join('\n');
      return [
        '## Goals',
        goalLinks || '_(no goals yet)_',
        '',
        '## Schedule',
        '- Weeks 1–4: Foundation phase',
        '- Weeks 5–8: Build phase',
        '- Weeks 9–12: Ship phase',
        '- Week 13: Recovery & planning',
      ].join('\n');
    }

    case '12-week-goal': {
      const measures = (vars.leadMeasures as LeadMeasureInput[]) ?? [];
      return [
        '## Lag Measure (Outcome)',
        String(vars.lagMeasure ?? ''),
        '',
        '## Lead Measures (Tactics)',
        buildLeadMeasuresTable(measures),
        '',
        '## Progress Notes',
        '',
      ].join('\n');
    }

    case 'weekly-plan':
      return [
        '## Tactics This Week',
        String(vars.tactics ?? ''),
        '',
        '## Additional',
        '',
        '## Notes',
        String(vars.notes ?? ''),
      ].join('\n');

    case 'daily-review':
      return [
        '## Lead Measures',
        '| Tactic | Target | Actual | Done | Note |',
        '|---|---|---|---|---|',
        String(vars.tableRows ?? ''),
        '',
        '## What went well',
        String(vars.whatWentWell ?? ''),
        '',
        "## What didn't go well",
        String(vars.whatDidntGoWell ?? ''),
        '',
        '## Wins',
        String(vars.wins ?? ''),
        '',
        '## How to get 1% better',
        String(vars.onePercentBetter ?? ''),
        '',
        "## Tomorrow's priority",
        String(vars.tomorrowsPriority ?? ''),
      ].join('\n');

    case 'weekly-review':
      return [
        `## Scorecard: ${vars.scorecard ?? 0}%`,
        String(vars.tableRows ?? ''),
        '',
        '## Wins',
        String(vars.wins ?? ''),
        '',
        "## What didn't go well",
        String(vars.whatDidntGoWell ?? ''),
        '',
        '## Lessons',
        String(vars.lessons ?? ''),
        '',
        '## How to get 1% better',
        String(vars.onePercentBetter ?? ''),
        '',
        '## Next week focus',
        String(vars.nextWeekFocus ?? ''),
        '',
        '## Adjustments',
        String(vars.adjustments ?? ''),
      ].join('\n');

    case '12-week-review':
      return [
        '## Goal Results',
        String(vars.goalResults ?? ''),
        '',
        `## Overall Score: ${vars.overallScore ?? 0}%`,
        '',
        '## What worked',
        String(vars.whatWorked ?? ''),
        '',
        '## What to change next cycle',
        String(vars.whatToChange ?? ''),
        '',
        '## Inputs for next cycle',
        String(vars.inputsForNextCycle ?? ''),
      ].join('\n');

    case '13th-week-review':
      return [
        '## Celebrate',
        String(vars.celebrate ?? ''),
        '',
        '## Rest',
        String(vars.rest ?? ''),
        '',
        '## Reflect',
        String(vars.reflect ?? ''),
        '',
        '## Next Cycle Draft',
        String(vars.nextCycleDraft ?? ''),
        '',
        '## Arena Status Reassessment',
        '| Arena | Current Status | Next Cycle Status | Reason |',
        '|---|---|---|---|',
      ].join('\n');

    case 'annual-review':
      return [
        '## Cycle Scores',
        String(vars.cycleScores ?? ''),
        '',
        '## By Area',
        String(vars.byArea ?? ''),
        '',
        '## Biggest wins',
        String(vars.biggestWins ?? ''),
        '',
        '## Biggest challenges',
        String(vars.biggestChallenges ?? ''),
        '',
        '## Patterns and lessons',
        String(vars.patternsAndLessons ?? ''),
        '',
        '## Vision updates',
        String(vars.visionUpdates ?? ''),
        '',
        '## Inputs for next year',
        String(vars.inputsForNextYear ?? ''),
      ].join('\n');

    default:
      return '';
  }
}

