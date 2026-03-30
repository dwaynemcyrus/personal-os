import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'strategy-wizard-draft';

export type AreaAssessment = {
  experience: string;
  problem: string;
  pain: string;
  relief: string;
  reward: string;
};

export type AreaDraft = {
  tempId: string;
  name: string;
  vision: string;
  beAndFeel: string[];
  milestones: string[];
  assessment: AreaAssessment;
};

export type GoalDraft = {
  name: string;
  lagMeasure: string;
  leadMeasures: string[];
};

export type WizardDraft = {
  step: number;
  areas: AreaDraft[];
  annualOutcomes: Record<string, string[]>; // tempId → outcome lines
  areaPriorities: Record<string, 'active' | 'maintenance' | 'waiting'>; // tempId → status
  cycle: { name: string; startDate: string };
  goals: Record<string, GoalDraft>; // tempId → goal
  weeklyPlanNotes: string;
};

function makeDefaultAssessment(): AreaAssessment {
  return { experience: '', problem: '', pain: '', relief: '', reward: '' };
}

export function makeNewAreaDraft(): AreaDraft {
  return {
    tempId: uuidv4(),
    name: '',
    vision: '',
    beAndFeel: [''],
    milestones: [''],
    assessment: makeDefaultAssessment(),
  };
}

function makeDefaultDraft(): WizardDraft {
  const year = new Date().getFullYear();
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return {
    step: 1,
    areas: [makeNewAreaDraft()],
    annualOutcomes: {},
    areaPriorities: {},
    cycle: { name: `${year} Cycle 1`, startDate: `${yyyy}-${mm}-${dd}` },
    goals: {},
    weeklyPlanNotes: '',
  };
}

/** Migrates an old area draft (missing new fields) to the current shape. */
function normalizeArea(a: Partial<AreaDraft>): AreaDraft {
  return {
    tempId: a.tempId ?? uuidv4(),
    name: a.name ?? '',
    vision: a.vision ?? '',
    beAndFeel: Array.isArray(a.beAndFeel) && a.beAndFeel.length > 0 ? a.beAndFeel : [''],
    milestones: Array.isArray(a.milestones) && a.milestones.length > 0 ? a.milestones : [''],
    assessment: {
      experience: a.assessment?.experience ?? '',
      problem: a.assessment?.problem ?? '',
      pain: a.assessment?.pain ?? '',
      relief: a.assessment?.relief ?? '',
      reward: a.assessment?.reward ?? '',
    },
  };
}

/** Migrates old localStorage drafts that lack new fields. */
function normalizeDraft(raw: Partial<WizardDraft>): WizardDraft {
  const def = makeDefaultDraft();
  return {
    step: raw.step ?? 1,
    areas:
      Array.isArray(raw.areas) && raw.areas.length > 0
        ? raw.areas.map((a) => normalizeArea(a as Partial<AreaDraft>))
        : def.areas,
    annualOutcomes: raw.annualOutcomes ?? {},
    areaPriorities: raw.areaPriorities ?? {},
    cycle: raw.cycle ?? def.cycle,
    goals: raw.goals ?? {},
    weeklyPlanNotes: raw.weeklyPlanNotes ?? '',
  };
}

function loadDraft(): WizardDraft {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return normalizeDraft(JSON.parse(stored) as Partial<WizardDraft>);
  } catch {
    // ignore
  }
  return makeDefaultDraft();
}

export function useWizardDraft() {
  const [draft, setDraftState] = useState<WizardDraft>(loadDraft);

  const setDraft = (updater: (prev: WizardDraft) => WizardDraft) => {
    setDraftState((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore quota errors
      }
      return next;
    });
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setDraftState(makeDefaultDraft());
  };

  return { draft, setDraft, clearDraft };
}
