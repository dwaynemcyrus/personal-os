import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getCurrentUserId } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { generateDocumentContent } from '../strategyUtils';

// ── Template type registry ────────────────────────────────────────────────────

export type StrategyTemplateEntry = {
  docType: string;
  label: string;
  defaultContent: string;
};

export const STRATEGY_TEMPLATE_DEFS: StrategyTemplateEntry[] = [
  {
    docType: 'area',
    label: 'Life Area',
    defaultContent: generateDocumentContent('area', { vision: '{{vision}}' }),
  },
  {
    docType: 'annual-outcomes',
    label: 'Annual Outcomes',
    defaultContent: generateDocumentContent('annual-outcomes', {
      areaFilename: '{{area}}',
      outcomes: '{{outcomes}}',
    }),
  },
  {
    docType: '12-week-overview',
    label: '12-Week Cycle Overview',
    defaultContent: generateDocumentContent('12-week-overview', { goalNames: '' }),
  },
  {
    docType: '12-week-goal',
    label: '12-Week Goal',
    defaultContent: generateDocumentContent('12-week-goal', {
      lagMeasure: '{{lag_measure}}',
      leadMeasures: [],
    }),
  },
  {
    docType: 'weekly-plan',
    label: 'Weekly Plan',
    defaultContent: generateDocumentContent('weekly-plan', {
      tactics: '{{tactics}}',
      notes: '',
    }),
  },
  {
    docType: 'daily-review',
    label: 'Daily Review',
    defaultContent: generateDocumentContent('daily-review', {
      tableRows: '{{lead_measures_table}}',
      whatWentWell: '',
      whatDidntGoWell: '',
      wins: '',
      onePercentBetter: '',
      tomorrowsPriority: '',
    }),
  },
  {
    docType: 'weekly-review',
    label: 'Weekly Review',
    defaultContent: generateDocumentContent('weekly-review', {
      scorecard: '{{score}}',
      tableRows: '{{scorecard_table}}',
      wins: '',
      whatDidntGoWell: '',
      lessons: '',
      onePercentBetter: '',
      nextWeekFocus: '',
      adjustments: '',
    }),
  },
  {
    docType: '12-week-review',
    label: '12-Week Review',
    defaultContent: generateDocumentContent('12-week-review', {
      goalResults: '',
      overallScore: 0,
      whatWorked: '',
      whatToChange: '',
      inputsForNextCycle: '',
    }),
  },
  {
    docType: '13th-week-review',
    label: '13th-Week Review',
    defaultContent: generateDocumentContent('13th-week-review', {
      celebrate: '',
      rest: '',
      reflect: '',
      nextCycleDraft: '',
    }),
  },
  {
    docType: 'annual-review',
    label: 'Annual Review',
    defaultContent: generateDocumentContent('annual-review', {
      cycleScores: '',
      byArea: '',
      biggestWins: '',
      biggestChallenges: '',
      patternsAndLessons: '',
      visionUpdates: '',
      inputsForNextYear: '',
    }),
  },
];

// ── DB type for fetched templates ─────────────────────────────────────────────

export type StrategyTemplateItem = {
  id: string;
  subtype: string; // the docType
  title: string;
  content: string | null;
};

// ── Seed helper ───────────────────────────────────────────────────────────────

async function seedMissingTemplates(
  existing: StrategyTemplateItem[],
): Promise<StrategyTemplateItem[]> {
  const existingTypes = new Set(existing.map((t) => t.subtype));
  const missing = STRATEGY_TEMPLATE_DEFS.filter(
    (def) => !existingTypes.has(def.docType),
  );
  if (missing.length === 0) return existing;

  const owner = await getCurrentUserId();
  const now = new Date().toISOString();
  const created: StrategyTemplateItem[] = [];

  for (const def of missing) {
    const id = uuidv4();
    await supabase.from('items').insert({
      id,
      type: 'strategy-template',
      subtype: def.docType,
      title: `${def.label} Template`,
      content: def.defaultContent,
      owner,
      is_pinned: false,
      completed: false,
      is_next: false,
      is_someday: false,
      is_waiting: false,
      is_trashed: false,
      trashed_at: null,
      processed: false,
      has_todos: false,
      created_at: now,
      updated_at: now,
    });
    created.push({ id, subtype: def.docType, title: `${def.label} Template`, content: def.defaultContent });
  }

  return [...existing, ...created];
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useStrategyTemplates() {
  return useQuery({
    queryKey: ['strategy', 'templates'],
    queryFn: async (): Promise<StrategyTemplateItem[]> => {
      const { data, error } = await supabase
        .from('items')
        .select('id, subtype, title, content')
        .eq('type', 'strategy-template')
        .eq('is_trashed', false);

      if (error) throw error;

      const existing = (data ?? []) as StrategyTemplateItem[];
      return seedMissingTemplates(existing);
    },
    staleTime: 5 * 60_000,
  });
}
