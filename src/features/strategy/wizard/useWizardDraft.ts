import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'strategy-wizard-draft';

export type AreaDraft = {
  tempId: string;
  name: string;
  vision: string;
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

function makeDefaultDraft(): WizardDraft {
  const year = new Date().getFullYear();
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return {
    step: 1,
    areas: [{ tempId: uuidv4(), name: '', vision: '' }],
    annualOutcomes: {},
    areaPriorities: {},
    cycle: { name: `${year} Cycle 1`, startDate: `${yyyy}-${mm}-${dd}` },
    goals: {},
    weeklyPlanNotes: '',
  };
}

function loadDraft(): WizardDraft {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as WizardDraft;
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
