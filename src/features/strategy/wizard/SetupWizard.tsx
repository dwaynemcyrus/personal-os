import { useState } from 'react';
import { useRegisterWizard } from '@/components/providers';
import { v4 as uuidv4 } from 'uuid';
import { queryClient } from '@/lib/queryClient';
import {
  createArea,
  createAnnualOutcomes,
  createCycleOverview,
  createGoal,
  createWeeklyPlan,
  patchAreaStatus,
} from '../strategyMutations';
import { calcCycleEndDate, formatDisplayDate } from '../strategyUtils';
import { useWizardDraft, type AreaDraft, type GoalDraft, type WizardDraft } from './useWizardDraft';
import styles from './SetupWizard.module.css';

// ── Types ─────────────────────────────────────────────────────────────────────

type StepProps = {
  draft: WizardDraft;
  setDraft: (updater: (prev: WizardDraft) => WizardDraft) => void;
};

// ── Step 1: Life Arenas ───────────────────────────────────────────────────────

function Step1Areas({ draft, setDraft }: StepProps) {
  const updateArea = (idx: number, field: keyof AreaDraft, value: string) => {
    setDraft((d) => {
      const areas = [...d.areas];
      areas[idx] = { ...areas[idx], [field]: value };
      return { ...d, areas };
    });
  };

  const addArea = () => {
    setDraft((d) => ({
      ...d,
      areas: [...d.areas, { tempId: uuidv4(), name: '', vision: '' }],
    }));
  };

  const removeArea = (idx: number) => {
    if (draft.areas.length <= 1) return;
    setDraft((d) => {
      const areas = d.areas.filter((_, i) => i !== idx);
      return { ...d, areas };
    });
  };

  return (
    <div>
      <div className={styles.stepMeta}>Step 1 of 6</div>
      <h2 className={styles.stepTitle}>Life Arenas</h2>
      <p className={styles.stepDesc}>
        Define the major domains of your life. You can add more later.
      </p>

      {draft.areas.map((area, idx) => (
        <div key={area.tempId} className={styles.areaCard}>
          <div className={styles.areaCardHeader}>
            <span className={styles.areaCardTitle}>Arena {idx + 1}</span>
            {draft.areas.length > 1 && (
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => removeArea(idx)}
              >
                Remove
              </button>
            )}
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Name</label>
            <input
              className={styles.input}
              type="text"
              placeholder="e.g. Career, Health, Finance…"
              value={area.name}
              onChange={(e) => updateArea(idx, 'name', e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Vision (where do you want to be?)</label>
            <textarea
              className={styles.textarea}
              placeholder="I run a profitable software product business…"
              value={area.vision}
              onChange={(e) => updateArea(idx, 'vision', e.target.value)}
            />
          </div>
        </div>
      ))}

      <button type="button" className={styles.addBtn} onClick={addArea}>
        + Add another arena
      </button>
      <div className={styles.bodySpacer} />
    </div>
  );
}

// ── Step 2: Annual Outcomes ───────────────────────────────────────────────────

function Step2Outcomes({ draft, setDraft }: StepProps) {
  const validAreas = draft.areas.filter((a) => a.name.trim());

  const getOutcomes = (tempId: string): string[] =>
    draft.annualOutcomes[tempId] ?? [''];

  const updateOutcome = (tempId: string, idx: number, value: string) => {
    setDraft((d) => {
      const outcomes = [...(d.annualOutcomes[tempId] ?? [''])];
      outcomes[idx] = value;
      return { ...d, annualOutcomes: { ...d.annualOutcomes, [tempId]: outcomes } };
    });
  };

  const addOutcome = (tempId: string) => {
    setDraft((d) => {
      const outcomes = [...(d.annualOutcomes[tempId] ?? ['']), ''];
      return { ...d, annualOutcomes: { ...d.annualOutcomes, [tempId]: outcomes } };
    });
  };

  const removeOutcome = (tempId: string, idx: number) => {
    setDraft((d) => {
      const outcomes = (d.annualOutcomes[tempId] ?? ['']).filter((_, i) => i !== idx);
      return {
        ...d,
        annualOutcomes: { ...d.annualOutcomes, [tempId]: outcomes.length ? outcomes : [''] },
      };
    });
  };

  return (
    <div>
      <div className={styles.stepMeta}>Step 2 of 6</div>
      <h2 className={styles.stepTitle}>Annual Outcomes</h2>
      <p className={styles.stepDesc}>
        What do you want to achieve this year in each arena?
      </p>

      {validAreas.length === 0 && (
        <p style={{ color: 'rgba(252,251,248,0.4)', fontSize: 14 }}>
          Add life arenas in Step 1 first.
        </p>
      )}

      {validAreas.map((area) => {
        const outcomes = getOutcomes(area.tempId);
        return (
          <div key={area.tempId}>
            <div className={styles.sectionHeader}>{area.name}</div>
            <div className={styles.outcomesGroup}>
              {outcomes.map((outcome, idx) => (
                <div key={idx} className={styles.outcomeRow}>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder={`Outcome ${idx + 1}`}
                    value={outcome}
                    onChange={(e) => updateOutcome(area.tempId, idx, e.target.value)}
                  />
                  {outcomes.length > 1 && (
                    <button
                      type="button"
                      className={styles.outcomeRemoveBtn}
                      onClick={() => removeOutcome(area.tempId, idx)}
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
              onClick={() => addOutcome(area.tempId)}
            >
              + Add outcome
            </button>
          </div>
        );
      })}

      <div className={styles.bodySpacer} />
    </div>
  );
}

// ── Step 3: Arena Priorities ──────────────────────────────────────────────────

type AreaStatus = 'active' | 'maintenance' | 'waiting';

function Step3Priorities({ draft, setDraft }: StepProps) {
  const validAreas = draft.areas.filter((a) => a.name.trim());
  const activeCount = validAreas.filter(
    (a) => (draft.areaPriorities[a.tempId] ?? 'waiting') === 'active',
  ).length;

  const setStatus = (tempId: string, status: AreaStatus) => {
    setDraft((d) => ({
      ...d,
      areaPriorities: { ...d.areaPriorities, [tempId]: status },
    }));
  };

  return (
    <div>
      <div className={styles.stepMeta}>Step 3 of 6</div>
      <h2 className={styles.stepTitle}>Arena Priorities</h2>
      <p className={styles.stepDesc}>
        Which arenas will you focus on this cycle? Pick 2–3 active.
      </p>

      {validAreas.map((area) => {
        const status = (draft.areaPriorities[area.tempId] ?? 'waiting') as AreaStatus;
        return (
          <div key={area.tempId} className={styles.priorityRow}>
            <span className={styles.priorityAreaName}>{area.name}</span>
            <select
              className={styles.prioritySelect}
              value={status}
              onChange={(e) => setStatus(area.tempId, e.target.value as AreaStatus)}
            >
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="waiting">Waiting</option>
            </select>
          </div>
        );
      })}

      <p className={`${styles.priorityCount} ${activeCount > 3 ? styles['priorityCount--warn'] : ''}`}>
        Active: {activeCount} of 3 max
      </p>

      <div className={styles.bodySpacer} />
    </div>
  );
}

// ── Step 4: 12-Week Cycle ─────────────────────────────────────────────────────

function Step4Cycle({ draft, setDraft }: StepProps) {
  const endDate = draft.cycle.startDate
    ? calcCycleEndDate(draft.cycle.startDate)
    : '';

  return (
    <div>
      <div className={styles.stepMeta}>Step 4 of 6</div>
      <h2 className={styles.stepTitle}>12-Week Cycle</h2>
      <p className={styles.stepDesc}>Set up your first 12-week cycle.</p>

      <div className={styles.field}>
        <label className={styles.label}>Cycle name</label>
        <input
          className={styles.input}
          type="text"
          placeholder="2026 Cycle 1"
          value={draft.cycle.name}
          onChange={(e) =>
            setDraft((d) => ({ ...d, cycle: { ...d.cycle, name: e.target.value } }))
          }
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Start date</label>
        <input
          className={styles.input}
          type="date"
          value={draft.cycle.startDate}
          onChange={(e) =>
            setDraft((d) => ({ ...d, cycle: { ...d.cycle, startDate: e.target.value } }))
          }
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>End date (auto-calculated, 12 weeks)</label>
        <input
          className={`${styles.input} ${styles.inputReadonly}`}
          type="text"
          readOnly
          value={endDate ? formatDisplayDate(endDate) : '—'}
        />
      </div>

      <div className={styles.bodySpacer} />
    </div>
  );
}

// ── Step 5: Goals + Lead Measures ─────────────────────────────────────────────

function Step5Goals({ draft, setDraft }: StepProps) {
  const activeAreas = draft.areas.filter(
    (a) => a.name.trim() && (draft.areaPriorities[a.tempId] ?? 'waiting') === 'active',
  );

  const getGoal = (tempId: string): GoalDraft =>
    draft.goals[tempId] ?? { name: '', lagMeasure: '', leadMeasures: [''] };

  const updateGoal = (tempId: string, field: keyof GoalDraft, value: string | string[]) => {
    setDraft((d) => ({
      ...d,
      goals: {
        ...d.goals,
        [tempId]: { ...getGoal(tempId), [field]: value },
      },
    }));
  };

  const updateLeadMeasure = (tempId: string, idx: number, value: string) => {
    const lms = [...getGoal(tempId).leadMeasures];
    lms[idx] = value;
    updateGoal(tempId, 'leadMeasures', lms);
  };

  const addLeadMeasure = (tempId: string) => {
    const lms = [...getGoal(tempId).leadMeasures, ''];
    updateGoal(tempId, 'leadMeasures', lms);
  };

  const removeLeadMeasure = (tempId: string, idx: number) => {
    const lms = getGoal(tempId).leadMeasures.filter((_, i) => i !== idx);
    updateGoal(tempId, 'leadMeasures', lms.length ? lms : ['']);
  };

  return (
    <div>
      <div className={styles.stepMeta}>Step 5 of 6</div>
      <h2 className={styles.stepTitle}>Goals</h2>
      <p className={styles.stepDesc}>Define 1 goal per active arena.</p>

      {activeAreas.length === 0 && (
        <p style={{ color: 'rgba(252,251,248,0.4)', fontSize: 14 }}>
          No active arenas. Set priorities in Step 3.
        </p>
      )}

      {activeAreas.map((area) => {
        const goal = getGoal(area.tempId);
        return (
          <div key={area.tempId} className={styles.goalSection}>
            <div className={styles.goalAreaLabel}>{area.name} (Active)</div>

            <div className={styles.field}>
              <label className={styles.label}>Goal name</label>
              <input
                className={styles.input}
                type="text"
                placeholder="e.g. Launch MVP"
                value={goal.name}
                onChange={(e) => updateGoal(area.tempId, 'name', e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Lag measure (the outcome)</label>
              <textarea
                className={styles.textarea}
                placeholder="e.g. Ship to 5 beta testers by end of cycle"
                value={goal.lagMeasure}
                onChange={(e) => updateGoal(area.tempId, 'lagMeasure', e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Lead measures (tactics you do)</label>
              {goal.leadMeasures.map((lm, idx) => (
                <div key={idx} className={styles.leadMeasureRow}>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder={`e.g. Code 2hrs every weekday`}
                    value={lm}
                    onChange={(e) => updateLeadMeasure(area.tempId, idx, e.target.value)}
                  />
                  {goal.leadMeasures.length > 1 && (
                    <button
                      type="button"
                      className={styles.outcomeRemoveBtn}
                      onClick={() => removeLeadMeasure(area.tempId, idx)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className={styles.addBtn}
                onClick={() => addLeadMeasure(area.tempId)}
              >
                + Add lead measure
              </button>
            </div>
          </div>
        );
      })}

      <div className={styles.bodySpacer} />
    </div>
  );
}

// ── Step 6: First Weekly Plan ─────────────────────────────────────────────────

function Step6WeeklyPlan({ draft, setDraft }: StepProps) {
  const activeAreas = draft.areas.filter(
    (a) => a.name.trim() && (draft.areaPriorities[a.tempId] ?? 'waiting') === 'active',
  );

  const allTactics = activeAreas.flatMap((area) => {
    const goal = draft.goals[area.tempId];
    if (!goal) return [];
    return goal.leadMeasures
      .filter((lm) => lm.trim())
      .map((lm) => ({ areaName: area.name, goalName: goal.name, tactic: lm.trim() }));
  });

  return (
    <div>
      <div className={styles.stepMeta}>Step 6 of 6</div>
      <h2 className={styles.stepTitle}>Weekly Plan</h2>
      <p className={styles.stepDesc}>
        Your first weekly plan, based on your lead measures.
      </p>

      {allTactics.length === 0 ? (
        <p style={{ color: 'rgba(252,251,248,0.4)', fontSize: 14 }}>
          No lead measures defined yet. Add goals in Step 5.
        </p>
      ) : (
        <div className={styles.tacticList}>
          {allTactics.map(({ tactic }, idx) => (
            <div key={idx} className={styles.tacticItem}>
              ☑ {tactic}
            </div>
          ))}
        </div>
      )}

      <div className={styles.field}>
        <label className={styles.label}>Add anything else this week?</label>
        <textarea
          className={styles.textarea}
          placeholder="e.g. Schedule dentist appointment"
          value={draft.weeklyPlanNotes}
          onChange={(e) =>
            setDraft((d) => ({ ...d, weeklyPlanNotes: e.target.value }))
          }
        />
      </div>

      <div className={styles.bodySpacer} />
    </div>
  );
}

// ── Save all wizard data ──────────────────────────────────────────────────────

async function saveAll(draft: WizardDraft): Promise<void> {
  const year = new Date().getFullYear();

  // 1. Create areas
  const areaIdMap = new Map<string, string>(); // tempId → real DB id
  for (const area of draft.areas.filter((a) => a.name.trim())) {
    const realId = await createArea({ name: area.name.trim(), vision: area.vision.trim() });
    areaIdMap.set(area.tempId, realId);
  }

  // 2. Create annual outcomes per area
  for (const area of draft.areas.filter((a) => a.name.trim())) {
    const realId = areaIdMap.get(area.tempId);
    if (!realId) continue;
    const outcomes = (draft.annualOutcomes[area.tempId] ?? []).filter((o) => o.trim());
    if (outcomes.length > 0) {
      await createAnnualOutcomes({ areaId: realId, areaName: area.name.trim(), year, outcomes });
    }
  }

  // 3. Patch area statuses
  for (const area of draft.areas.filter((a) => a.name.trim())) {
    const realId = areaIdMap.get(area.tempId);
    if (!realId) continue;
    const status = (draft.areaPriorities[area.tempId] ?? 'waiting') as 'active' | 'maintenance' | 'waiting';
    await patchAreaStatus(realId, status);
  }

  // 4. Create cycle overview
  const cycleName = draft.cycle.name.trim();
  const cycleStartDate = draft.cycle.startDate;
  if (!cycleName || !cycleStartDate) throw new Error('Cycle name and start date are required.');
  const cycleId = await createCycleOverview({ name: cycleName, startDate: cycleStartDate });

  // 5. Create goals for active areas
  const activeAreas = draft.areas.filter(
    (a) => a.name.trim() && (draft.areaPriorities[a.tempId] ?? 'waiting') === 'active',
  );

  for (const area of activeAreas) {
    const goal = draft.goals[area.tempId];
    if (!goal?.name.trim()) continue;
    const areaRealId = areaIdMap.get(area.tempId) ?? '';
    const leadMeasures = goal.leadMeasures
      .filter((lm) => lm.trim())
      .map((title) => ({ title: title.trim(), subtype: 'binary' as const }));
    await createGoal({
      cycleId,
      areaId: areaRealId,
      name: goal.name.trim(),
      lagMeasure: goal.lagMeasure.trim(),
      leadMeasures,
    });
  }

  // 6. Create first weekly plan
  const tacticLines = activeAreas
    .flatMap((area) => {
      const goal = draft.goals[area.tempId];
      if (!goal) return [];
      return goal.leadMeasures.filter((lm) => lm.trim()).map((lm) => `- [ ] ${lm.trim()}`);
    })
    .join('\n');

  await createWeeklyPlan({
    cycleId,
    cycleStartDate,
    tacticLines,
    notes: draft.weeklyPlanNotes.trim(),
  });
}

// ── Main Wizard Component ─────────────────────────────────────────────────────

const TOTAL_STEPS = 6;

type SetupWizardProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SetupWizard({ open, onOpenChange }: SetupWizardProps) {
  useRegisterWizard(open);
  const { draft, setDraft, clearDraft } = useWizardDraft();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (!open) return null;

  const step = draft.step;

  const goNext = () =>
    setDraft((d) => ({ ...d, step: Math.min(d.step + 1, TOTAL_STEPS) }));
  const goBack = () =>
    setDraft((d) => ({ ...d, step: Math.max(d.step - 1, 1) }));

  const handleDismiss = () => {
    onOpenChange(false);
    // draft persists so user can resume
  };

  const handleFinish = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await saveAll(draft);
      clearDraft();
      queryClient.invalidateQueries({ queryKey: ['strategy'] });
      onOpenChange(false);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.overlay}>
      {/* Progress dots + dismiss */}
      <div className={styles.topbar}>
        <div className={styles.stepDots}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => {
            const n = i + 1;
            const cls =
              n === step
                ? `${styles.dot} ${styles['dot--active']}`
                : n < step
                  ? `${styles.dot} ${styles['dot--done']}`
                  : styles.dot;
            return <span key={n} className={cls} />;
          })}
        </div>
        <button type="button" className={styles.dismissBtn} onClick={handleDismiss}>
          Dismiss
        </button>
      </div>

      {/* Step content */}
      <div className={styles.body}>
        {step === 1 && <Step1Areas draft={draft} setDraft={setDraft} />}
        {step === 2 && <Step2Outcomes draft={draft} setDraft={setDraft} />}
        {step === 3 && <Step3Priorities draft={draft} setDraft={setDraft} />}
        {step === 4 && <Step4Cycle draft={draft} setDraft={setDraft} />}
        {step === 5 && <Step5Goals draft={draft} setDraft={setDraft} />}
        {step === 6 && <Step6WeeklyPlan draft={draft} setDraft={setDraft} />}
      </div>

      {/* Navigation footer */}
      <div className={styles.footer}>
        {step > 1 && (
          <button type="button" className={styles.btnBack} onClick={goBack} disabled={isSaving}>
            ← Back
          </button>
        )}
        {step < TOTAL_STEPS ? (
          <button type="button" className={styles.btnNext} onClick={goNext}>
            Next →
          </button>
        ) : (
          <button
            type="button"
            className={styles.btnFinish}
            onClick={handleFinish}
            disabled={isSaving}
          >
            {isSaving ? 'Saving…' : 'Finish ✓'}
          </button>
        )}
      </div>

      {saveError && <div className={styles.errorBanner}>{saveError}</div>}
    </div>
  );
}
