/**
 * WeeklyReviewWizard — 3-screen wizard for weekly review creation.
 *
 * Screen 1: Scorecard summary, auto-populated from tactic entries for the week.
 *           Shows per-tactic daily completion grid + overall score.
 * Screen 2: Reflection fields (wins, what didn't go well, lessons, 1% better).
 * Screen 3: Next week focus + adjustments + save.
 */

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigationActions, useRegisterWizard } from '@/components/providers';
import { useActiveCycle } from '../hooks/useActiveCycle';
import { useCurrentWeekPlan, useWeeklyPlans } from '../hooks/useWeeklyPlans';
import { useGoals } from '../hooks/useGoals';
import { useTacticEntries } from '../hooks/useTacticEntries';
import { createWeeklyReview } from '../strategyMutations';
import type { WeeklyScorecardRow } from '../strategyMutations';
import {
  formatWeekRange,
  weekDays,
  frequencyMatchesDay,
} from '../strategyUtils';
import type { WeeklyPlanItem } from '../types';
import styles from './WeeklyReviewWizard.module.css';

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weeklyPlanId?: string;
};

// ── Main export (guard) ───────────────────────────────────────────────────────

export function WeeklyReviewWizard({ open, onOpenChange, weeklyPlanId }: Props) {
  useRegisterWizard(open);
  if (!open) return null;
  return (
    <WeeklyReviewWizardInner
      onClose={() => onOpenChange(false)}
      weeklyPlanId={weeklyPlanId}
    />
  );
}

// ── Inner component ───────────────────────────────────────────────────────────

function WeeklyReviewWizardInner({
  onClose,
  weeklyPlanId: propPlanId,
}: {
  onClose: () => void;
  weeklyPlanId?: string;
}) {
  const queryClient = useQueryClient();
  const { pushLayer } = useNavigationActions();

  const { data: cycle, isLoading: cycleLoading } = useActiveCycle();
  const { data: currentWeekPlan } = useCurrentWeekPlan();
  const { data: allPlans = [], isLoading: plansLoading } = useWeeklyPlans(cycle?.id);

  // Resolve the weekly plan to review
  const [selectedPlanId, setSelectedPlanId] = useState<string>(propPlanId ?? '');
  const effectivePlan: WeeklyPlanItem | undefined =
    allPlans.find((p) => p.id === (selectedPlanId || currentWeekPlan?.id)) ??
    allPlans[0];

  const weekStart = effectivePlan?.period_start ?? null;
  const weekEnd = effectivePlan?.period_end ?? null;

  // Fetch goals + lead measures for the cycle
  const { data: goals = [], isLoading: goalsLoading } = useGoals(cycle?.id);
  const allLeadMeasures = goals.flatMap((g) => g.leadMeasures);
  const allLMIds = allLeadMeasures.map((lm) => lm.id);

  // Fetch tactic entries for the week
  const { data: tacticEntries = [], isLoading: entriesLoading } = useTacticEntries(
    allLMIds,
    weekStart ?? '1970-01-01',
    weekEnd ?? '1970-01-01',
  );

  // ── Build scorecard rows ───────────────────────────────────────────────────

  const days = weekStart ? weekDays(weekStart) : []; // 7 ISO dates Mon–Sun

  const scorecardRows: WeeklyScorecardRow[] = allLeadMeasures.map((lm) => {
    const dayStatuses = days.map((date, i): 'complete' | 'incomplete' | 'none' => {
      const dow = (i + 1) % 7; // Mon=1 … Sun=0
      if (!frequencyMatchesDay(lm.frequency, dow)) return 'none';
      const entry = tacticEntries.find(
        (e) => e.parent_id === lm.id && e.period_start === date,
      );
      if (!entry) return 'incomplete';
      return entry.completed ? 'complete' : 'incomplete';
    });

    const completedSlots = dayStatuses.filter((d) => d === 'complete').length;
    const totalSlots = dayStatuses.filter((d) => d !== 'none').length;

    return {
      tacticTitle: lm.title ?? '',
      days: dayStatuses,
      score: totalSlots > 0 ? `${completedSlots}/${totalSlots}` : '0/0',
    };
  });

  const totalSlots = scorecardRows.reduce(
    (acc, r) => acc + r.days.filter((d) => d !== 'none').length,
    0,
  );
  const completedSlots = scorecardRows.reduce(
    (acc, r) => acc + r.days.filter((d) => d === 'complete').length,
    0,
  );
  const scoreAuto = totalSlots > 0 ? Math.round((completedSlots / totalSlots) * 100) : 0;

  // ── Form state ─────────────────────────────────────────────────────────────

  const [step, setStep] = useState<Step>(1);
  const [showManualScore, setShowManualScore] = useState(false);
  const [manualScoreInput, setManualScoreInput] = useState('');
  const [wins, setWins] = useState('');
  const [whatDidntGoWell, setWhatDidntGoWell] = useState('');
  const [lessons, setLessons] = useState('');
  const [onePercentBetter, setOnePercentBetter] = useState('');
  const [nextWeekFocus, setNextWeekFocus] = useState('');
  const [adjustments, setAdjustments] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const scoreManual =
    showManualScore && manualScoreInput !== ''
      ? Math.max(0, Math.min(100, parseInt(manualScoreInput, 10) || 0))
      : null;
  const displayScore = scoreManual ?? scoreAuto;

  // ── Save ───────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!effectivePlan || !cycle?.id || !cycle.period_start || !weekStart) {
      setError('No weekly plan found. Select a plan to continue.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const id = await createWeeklyReview({
        weeklyPlanId: effectivePlan.id,
        cycleId: cycle.id,
        cycleStartDate: cycle.period_start,
        weekStartDate: weekStart,
        scorecard: scorecardRows,
        reflection: {
          wins,
          whatDidntGoWell,
          lessons,
          onePercentBetter,
          nextWeekFocus,
          adjustments,
          scoreManual,
        },
      });

      queryClient.invalidateQueries({ queryKey: ['strategy', 'reviews'] });
      queryClient.invalidateQueries({ queryKey: ['strategy', 'weekly-reviews-for-plans'] });
      queryClient.invalidateQueries({ queryKey: ['strategy', 'list'] });

      onClose();
      pushLayer({ view: 'strategy-detail', strategyId: `document:${id}` });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const isLoading = cycleLoading || plansLoading || goalsLoading || entriesLoading;

  const weekLabel =
    weekStart && weekEnd ? formatWeekRange(weekStart, weekEnd) : 'This week';

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={styles.overlay}>
      {/* Topbar */}
      <div className={styles.topbar}>
        <div className={styles.stepDots}>
          {([1, 2, 3] as Step[]).map((s) => (
            <span
              key={s}
              className={`${styles.dot}${s === step ? ` ${styles['dot--active']}` : s < step ? ` ${styles['dot--done']}` : ''}`}
            />
          ))}
        </div>
        <span className={styles.wizardTitle}>Weekly Review</span>
        <button type="button" className={styles.dismissBtn} onClick={onClose}>
          Done
        </button>
      </div>

      {/* Body */}
      <div className={styles.scrollBody}>
        {isLoading ? (
          <div className={styles.loading}>Loading…</div>
        ) : (
          <>
            {step === 1 && (
              <Step1Scorecard
                weekLabel={weekLabel}
                allPlans={allPlans}
                effectivePlan={effectivePlan}
                selectedPlanId={selectedPlanId}
                setSelectedPlanId={setSelectedPlanId}
                scorecardRows={scorecardRows}
                scoreAuto={scoreAuto}
                completedSlots={completedSlots}
                totalSlots={totalSlots}
                showManualScore={showManualScore}
                setShowManualScore={setShowManualScore}
                manualScoreInput={manualScoreInput}
                setManualScoreInput={setManualScoreInput}
                displayScore={displayScore}
                noCycle={!cycle}
              />
            )}
            {step === 2 && (
              <Step2Reflection
                wins={wins}
                setWins={setWins}
                whatDidntGoWell={whatDidntGoWell}
                setWhatDidntGoWell={setWhatDidntGoWell}
                lessons={lessons}
                setLessons={setLessons}
                onePercentBetter={onePercentBetter}
                setOnePercentBetter={setOnePercentBetter}
              />
            )}
            {step === 3 && (
              <Step3NextWeek
                nextWeekFocus={nextWeekFocus}
                setNextWeekFocus={setNextWeekFocus}
                adjustments={adjustments}
                setAdjustments={setAdjustments}
                displayScore={displayScore}
              />
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        {error && <div className={styles.errorBanner}>{error}</div>}
        <div className={styles.footerBtns}>
          {step > 1 ? (
            <button
              type="button"
              className={styles.btnBack}
              onClick={() => setStep((s) => (s - 1) as Step)}
            >
              ← Back
            </button>
          ) : (
            <button type="button" className={styles.btnBack} onClick={onClose}>
              Cancel
            </button>
          )}
          {step < 3 ? (
            <button
              type="button"
              className={styles.btnNext}
              onClick={() => setStep((s) => (s + 1) as Step)}
            >
              Next →
            </button>
          ) : (
            <button
              type="button"
              className={styles.btnSave}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save ✓'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Step 1: Scorecard ─────────────────────────────────────────────────────────

const DAY_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function Step1Scorecard({
  weekLabel,
  allPlans,
  effectivePlan,
  selectedPlanId,
  setSelectedPlanId,
  scorecardRows,
  scoreAuto,
  completedSlots,
  totalSlots,
  showManualScore,
  setShowManualScore,
  manualScoreInput,
  setManualScoreInput,
  displayScore,
  noCycle,
}: {
  weekLabel: string;
  allPlans: WeeklyPlanItem[];
  effectivePlan: WeeklyPlanItem | undefined;
  selectedPlanId: string;
  setSelectedPlanId: (id: string) => void;
  scorecardRows: WeeklyScorecardRow[];
  scoreAuto: number;
  completedSlots: number;
  totalSlots: number;
  showManualScore: boolean;
  setShowManualScore: (v: boolean) => void;
  manualScoreInput: string;
  setManualScoreInput: (v: string) => void;
  displayScore: number;
  noCycle: boolean;
}) {
  return (
    <>
      <div className={styles.stepHeader}>
        <div className={styles.stepTitle}>{weekLabel}</div>
        <div className={styles.stepSubtitle}>Scorecard</div>
      </div>

      {/* Plan picker if multiple plans */}
      {allPlans.length > 1 && (
        <div className={styles.planPicker}>
          <div className={styles.planPickerLabel}>Weekly Plan</div>
          <select
            className={styles.planSelect}
            value={selectedPlanId || effectivePlan?.id || ''}
            onChange={(e) => setSelectedPlanId(e.target.value)}
          >
            {allPlans.map((p) => (
              <option key={p.id} value={p.id}>
                Week {p.sort_order ?? '?'}{' '}
                {p.period_start ? `· ${p.period_start}` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {noCycle && (
        <div className={styles.noDataState}>No active cycle found.</div>
      )}

      {!noCycle && scorecardRows.length === 0 && (
        <div className={styles.noDataState}>
          No lead measures found for this cycle.
          <br />
          You can still continue to record your reflection.
        </div>
      )}

      {scorecardRows.length > 0 && (
        <>
          <div className={styles.sectionLabel}>Lead Measures</div>
          <div className={styles.scorecardCard}>
            {/* Header */}
            <div className={styles.scorecardHeader}>
              <div className={styles.scorecardHeaderTactic}>Tactic</div>
              <div className={styles.scorecardHeaderDays}>
                {DAY_HEADERS.map((d, i) => (
                  <div key={i} className={styles.scorecardDayLabel}>
                    {d}
                  </div>
                ))}
              </div>
              <div className={styles.scorecardHeaderScore}>Score</div>
            </div>
            {/* Rows */}
            {scorecardRows.map((row, ri) => (
              <div key={ri} className={styles.scorecardRow}>
                <div className={styles.scorecardTactic}>{row.tacticTitle}</div>
                <div className={styles.scorecardDays}>
                  {row.days.map((d, di) => (
                    <div
                      key={di}
                      className={`${styles.scorecardCell} ${
                        d === 'complete'
                          ? styles['scorecardCell--complete']
                          : d === 'incomplete'
                            ? styles['scorecardCell--incomplete']
                            : styles['scorecardCell--none']
                      }`}
                    >
                      {d === 'complete' ? '✓' : d === 'incomplete' ? '✗' : '·'}
                    </div>
                  ))}
                </div>
                <div className={styles.scorecardScore}>{row.score}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Score summary */}
      <div className={styles.scoreSummary}>
        <div className={styles.scoreSummaryLeft}>
          <span className={styles.scoreNumber}>{displayScore}%</span>
          {totalSlots > 0 && (
            <span className={styles.scoreSub}>
              {completedSlots}/{totalSlots} completed
            </span>
          )}
        </div>
        {!showManualScore ? (
          <button
            type="button"
            className={styles.adjustToggle}
            onClick={() => {
              setShowManualScore(true);
              setManualScoreInput(String(scoreAuto));
            }}
          >
            Adjust
          </button>
        ) : (
          <button
            type="button"
            className={styles.adjustToggle}
            onClick={() => {
              setShowManualScore(false);
              setManualScoreInput('');
            }}
          >
            Use auto
          </button>
        )}
      </div>
      {showManualScore && (
        <div className={styles.manualScoreRow}>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            className={styles.manualScoreInput}
            value={manualScoreInput}
            onChange={(e) => setManualScoreInput(e.target.value)}
          />
          <span className={styles.manualScoreUnit}>%</span>
        </div>
      )}
    </>
  );
}

// ── Step 2: Reflection ────────────────────────────────────────────────────────

function Step2Reflection({
  wins,
  setWins,
  whatDidntGoWell,
  setWhatDidntGoWell,
  lessons,
  setLessons,
  onePercentBetter,
  setOnePercentBetter,
}: {
  wins: string;
  setWins: (v: string) => void;
  whatDidntGoWell: string;
  setWhatDidntGoWell: (v: string) => void;
  lessons: string;
  setLessons: (v: string) => void;
  onePercentBetter: string;
  setOnePercentBetter: (v: string) => void;
}) {
  return (
    <>
      <div className={styles.stepHeader}>
        <div className={styles.stepTitle}>Reflection</div>
      </div>

      <div className={styles.field}>
        <div className={styles.fieldLabel}>Wins this week</div>
        <textarea
          className={styles.fieldTextarea}
          rows={3}
          placeholder="…"
          value={wins}
          onChange={(e) => setWins(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <div className={styles.fieldLabel}>What didn't go well?</div>
        <textarea
          className={styles.fieldTextarea}
          rows={3}
          placeholder="…"
          value={whatDidntGoWell}
          onChange={(e) => setWhatDidntGoWell(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <div className={styles.fieldLabel}>Lessons learned</div>
        <textarea
          className={styles.fieldTextarea}
          rows={3}
          placeholder="…"
          value={lessons}
          onChange={(e) => setLessons(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <div className={styles.fieldLabel}>How can I get 1% better next week?</div>
        <textarea
          className={styles.fieldTextarea}
          rows={2}
          placeholder="…"
          value={onePercentBetter}
          onChange={(e) => setOnePercentBetter(e.target.value)}
        />
      </div>
    </>
  );
}

// ── Step 3: Next Week ─────────────────────────────────────────────────────────

function Step3NextWeek({
  nextWeekFocus,
  setNextWeekFocus,
  adjustments,
  setAdjustments,
  displayScore,
}: {
  nextWeekFocus: string;
  setNextWeekFocus: (v: string) => void;
  adjustments: string;
  setAdjustments: (v: string) => void;
  displayScore: number;
}) {
  return (
    <>
      <div className={styles.stepHeader}>
        <div className={styles.stepTitle}>Next Week</div>
      </div>

      <div className={styles.field}>
        <div className={styles.fieldLabel}>Top priorities for next week</div>
        <textarea
          className={styles.fieldTextarea}
          rows={3}
          placeholder="…"
          value={nextWeekFocus}
          onChange={(e) => setNextWeekFocus(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <div className={styles.fieldLabel}>
          Anything to adjust in your lead measures or approach?
        </div>
        <textarea
          className={styles.fieldTextarea}
          rows={3}
          placeholder="…"
          value={adjustments}
          onChange={(e) => setAdjustments(e.target.value)}
        />
      </div>

      <div className={styles.scoreDivider} />

      <div className={styles.finalScore}>
        <span className={styles.finalScoreLabel}>Week Score:</span>
        <span className={styles.finalScoreNum}>{displayScore}%</span>
      </div>
    </>
  );
}
