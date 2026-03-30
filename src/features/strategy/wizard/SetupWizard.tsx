import { useState } from 'react';
import { useRegisterWizard } from '@/components/providers';
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
import {
  useWizardDraft,
  makeNewAreaDraft,
  type AreaDraft,
  type AreaAssessment,
  type GoalDraft,
  type WizardDraft,
} from './useWizardDraft';
import styles from './SetupWizard.module.css';

// ── Types ─────────────────────────────────────────────────────────────────────

type StepProps = {
  draft: WizardDraft;
  setDraft: (updater: (prev: WizardDraft) => WizardDraft) => void;
};

// ── Step 1: Life Arenas ───────────────────────────────────────────────────────

function Step1Areas({ draft, setDraft }: StepProps) {
  const updateField = (idx: number, field: 'name' | 'vision', value: string) => {
    setDraft((d) => {
      const areas = [...d.areas];
      areas[idx] = { ...areas[idx], [field]: value };
      return { ...d, areas };
    });
  };

  const updateBeAndFeel = (areaIdx: number, bfIdx: number, value: string) => {
    setDraft((d) => {
      const areas = [...d.areas];
      const baf = [...areas[areaIdx].beAndFeel];
      baf[bfIdx] = value;
      areas[areaIdx] = { ...areas[areaIdx], beAndFeel: baf };
      return { ...d, areas };
    });
  };

  const addBeAndFeel = (areaIdx: number) => {
    setDraft((d) => {
      const areas = [...d.areas];
      areas[areaIdx] = { ...areas[areaIdx], beAndFeel: [...areas[areaIdx].beAndFeel, ''] };
      return { ...d, areas };
    });
  };

  const removeBeAndFeel = (areaIdx: number, bfIdx: number) => {
    setDraft((d) => {
      const areas = [...d.areas];
      const baf = areas[areaIdx].beAndFeel.filter((_, i) => i !== bfIdx);
      areas[areaIdx] = { ...areas[areaIdx], beAndFeel: baf.length ? baf : [''] };
      return { ...d, areas };
    });
  };

  const addArea = () => {
    setDraft((d) => ({ ...d, areas: [...d.areas, makeNewAreaDraft()] }));
  };

  const removeArea = (idx: number) => {
    if (draft.areas.length <= 1) return;
    setDraft((d) => ({ ...d, areas: d.areas.filter((_, i) => i !== idx) }));
  };

  return (
    <div>
      <div className={styles.stepMeta}>Step 1 of 7</div>
      <h2 className={styles.stepTitle}>Life Arenas</h2>
      <p className={styles.stepDesc}>
        Define the major domains of your life. You can add more later.
      </p>

      {draft.areas.map((area, idx) => (
        <div key={area.tempId} className={styles.areaCard}>
          <div className={styles.areaCardHeader}>
            <span className={styles.areaCardTitle}>Arena {idx + 1}</span>
            {draft.areas.length > 1 && (
              <button type="button" className={styles.removeBtn} onClick={() => removeArea(idx)}>
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
              onChange={(e) => updateField(idx, 'name', e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Vision (where do you want to be?)</label>
            <textarea
              className={styles.textarea}
              placeholder="I run a profitable software product business…"
              value={area.vision}
              onChange={(e) => updateField(idx, 'vision', e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>
              Be and Feel <span className={styles.labelHint}>(up to 6)</span>
            </label>
            <div className={styles.outcomesGroup}>
              {area.beAndFeel.map((bf, bfIdx) => (
                <div key={bfIdx} className={styles.outcomeRow}>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="e.g. energetic, confident…"
                    value={bf}
                    onChange={(e) => updateBeAndFeel(idx, bfIdx, e.target.value)}
                  />
                  {area.beAndFeel.length > 1 && (
                    <button
                      type="button"
                      className={styles.outcomeRemoveBtn}
                      onClick={() => removeBeAndFeel(idx, bfIdx)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            {area.beAndFeel.length < 6 && (
              <button type="button" className={styles.addBtn} onClick={() => addBeAndFeel(idx)}>
                + Add
              </button>
            )}
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

// ── Step 2: Arena Details (Milestones + Assessment) ───────────────────────────

const EXPERIENCE_OPTIONS = ['Satisfied', 'Unsatisfied', 'Very Unsatisfied', 'Very Satisfied'];

function Step2ArenaDetails({ draft, setDraft }: StepProps) {
  const [arenaIdx, setArenaIdx] = useState(0);
  const validAreas = draft.areas.filter((a) => a.name.trim());

  if (validAreas.length === 0) {
    return (
      <div>
        <div className={styles.stepMeta}>Step 2 of 7</div>
        <h2 className={styles.stepTitle}>Arena Details</h2>
        <p className={styles.stepDesc}>Add life arenas in Step 1 first.</p>
        <div className={styles.bodySpacer} />
      </div>
    );
  }

  const currentIdx = Math.min(arenaIdx, validAreas.length - 1);
  const area = validAreas[currentIdx];
  // Find true index in the full areas array for mutations
  const fullIdx = draft.areas.indexOf(area);

  const updateMilestone = (mIdx: number, val: string) => {
    setDraft((d) => {
      const areas = [...d.areas];
      const ms = [...areas[fullIdx].milestones];
      ms[mIdx] = val;
      areas[fullIdx] = { ...areas[fullIdx], milestones: ms };
      return { ...d, areas };
    });
  };

  const addMilestone = () => {
    setDraft((d) => {
      const areas = [...d.areas];
      areas[fullIdx] = { ...areas[fullIdx], milestones: [...areas[fullIdx].milestones, ''] };
      return { ...d, areas };
    });
  };

  const removeMilestone = (mIdx: number) => {
    setDraft((d) => {
      const areas = [...d.areas];
      const ms = areas[fullIdx].milestones.filter((_, i) => i !== mIdx);
      areas[fullIdx] = { ...areas[fullIdx], milestones: ms.length ? ms : [''] };
      return { ...d, areas };
    });
  };

  const updateAssessment = (field: keyof AreaAssessment, val: string) => {
    setDraft((d) => {
      const areas = [...d.areas];
      areas[fullIdx] = {
        ...areas[fullIdx],
        assessment: { ...areas[fullIdx].assessment, [field]: val },
      };
      return { ...d, areas };
    });
  };

  return (
    <div>
      <div className={styles.stepMeta}>Step 2 of 7</div>
      <h2 className={styles.stepTitle}>Arena Details</h2>
      <p className={styles.stepDesc}>
        Fill in milestones and assessment for each arena. These can be edited later.
      </p>

      {validAreas.length > 1 && (
        <div className={styles.arenaNav}>
          <button
            type="button"
            className={styles.arenaNavBtn}
            disabled={currentIdx === 0}
            onClick={() => setArenaIdx(currentIdx - 1)}
          >
            ←
          </button>
          <span className={styles.arenaNavLabel}>
            {area.name} ({currentIdx + 1} / {validAreas.length})
          </span>
          <button
            type="button"
            className={styles.arenaNavBtn}
            disabled={currentIdx === validAreas.length - 1}
            onClick={() => setArenaIdx(currentIdx + 1)}
          >
            →
          </button>
        </div>
      )}

      {validAreas.length === 1 && (
        <div className={styles.arenaNavLabel}>{area.name}</div>
      )}

      <div className={styles.field}>
        <label className={styles.label}>Milestones</label>
        <div className={styles.outcomesGroup}>
          {area.milestones.map((m, mIdx) => (
            <div key={mIdx} className={styles.outcomeRow}>
              <input
                className={styles.input}
                type="text"
                placeholder="e.g. Run first 5K"
                value={m}
                onChange={(e) => updateMilestone(mIdx, e.target.value)}
              />
              {area.milestones.length > 1 && (
                <button
                  type="button"
                  className={styles.outcomeRemoveBtn}
                  onClick={() => removeMilestone(mIdx)}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
        <button type="button" className={styles.addBtn} onClick={addMilestone}>
          + Add milestone
        </button>
      </div>

      <div className={styles.sectionLabel}>Assessment</div>

      <div className={styles.field}>
        <label className={styles.label}>Experience</label>
        <select
          className={styles.input}
          value={area.assessment.experience}
          onChange={(e) => updateAssessment('experience', e.target.value)}
        >
          <option value="">Select…</option>
          {EXPERIENCE_OPTIONS.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Problem</label>
        <textarea
          className={styles.textarea}
          rows={3}
          placeholder="What's the main problem in this area?"
          value={area.assessment.problem}
          onChange={(e) => updateAssessment('problem', e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Pain</label>
        <textarea
          className={styles.textarea}
          rows={3}
          placeholder="What pain does this problem cause?"
          value={area.assessment.pain}
          onChange={(e) => updateAssessment('pain', e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Relief</label>
        <textarea
          className={styles.textarea}
          rows={3}
          placeholder="What would relief look like?"
          value={area.assessment.relief}
          onChange={(e) => updateAssessment('relief', e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Reward</label>
        <textarea
          className={styles.textarea}
          rows={3}
          placeholder="What's the reward for solving this?"
          value={area.assessment.reward}
          onChange={(e) => updateAssessment('reward', e.target.value)}
        />
      </div>

      <div className={styles.bodySpacer} />
    </div>
  );
}

// ── Step 3: Annual Outcomes ───────────────────────────────────────────────────

function Step3Outcomes({ draft, setDraft }: StepProps) {
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
      <div className={styles.stepMeta}>Step 3 of 7</div>
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

// ── Step 4: Arena Priorities ──────────────────────────────────────────────────

type AreaStatus = 'active' | 'maintenance' | 'waiting';

function Step4Priorities({ draft, setDraft }: StepProps) {
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
      <div className={styles.stepMeta}>Step 4 of 7</div>
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

// ── Step 5: 12-Week Cycle ─────────────────────────────────────────────────────

function Step5Cycle({ draft, setDraft }: StepProps) {
  const endDate = draft.cycle.startDate
    ? calcCycleEndDate(draft.cycle.startDate)
    : '';

  return (
    <div>
      <div className={styles.stepMeta}>Step 5 of 7</div>
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

// ── Step 6: Goals + Lead Measures ─────────────────────────────────────────────

function Step6Goals({ draft, setDraft }: StepProps) {
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
      <div className={styles.stepMeta}>Step 6 of 7</div>
      <h2 className={styles.stepTitle}>Goals</h2>
      <p className={styles.stepDesc}>Define 1 goal per active arena.</p>

      {activeAreas.length === 0 && (
        <p style={{ color: 'rgba(252,251,248,0.4)', fontSize: 14 }}>
          No active arenas. Set priorities in Step 4.
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
                    placeholder="e.g. Code 2hrs every weekday"
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

// ── Step 7: First Weekly Plan ─────────────────────────────────────────────────

function Step7WeeklyPlan({ draft, setDraft }: StepProps) {
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
      <div className={styles.stepMeta}>Step 7 of 7</div>
      <h2 className={styles.stepTitle}>Weekly Plan</h2>
      <p className={styles.stepDesc}>
        Your first weekly plan, based on your lead measures.
      </p>

      {allTactics.length === 0 ? (
        <p style={{ color: 'rgba(252,251,248,0.4)', fontSize: 14 }}>
          No lead measures defined yet. Add goals in Step 6.
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
    const realId = await createArea({
      name: area.name.trim(),
      vision: area.vision.trim(),
      beAndFeel: area.beAndFeel.filter(Boolean),
      milestones: area.milestones.filter(Boolean),
      assessment: area.assessment,
    });
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

const TOTAL_STEPS = 7;

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
        {step === 2 && <Step2ArenaDetails draft={draft} setDraft={setDraft} />}
        {step === 3 && <Step3Outcomes draft={draft} setDraft={setDraft} />}
        {step === 4 && <Step4Priorities draft={draft} setDraft={setDraft} />}
        {step === 5 && <Step5Cycle draft={draft} setDraft={setDraft} />}
        {step === 6 && <Step6Goals draft={draft} setDraft={setDraft} />}
        {step === 7 && <Step7WeeklyPlan draft={draft} setDraft={setDraft} />}
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
