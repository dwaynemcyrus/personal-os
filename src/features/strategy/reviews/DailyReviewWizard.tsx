/**
 * DailyReviewWizard — 3-screen wizard for daily review creation.
 *
 * Screen 1: Score today's lead measures (auto-populated from active cycle,
 *           filtered by day of week).
 * Screen 2: Reflection fields (what went well, what didn't, wins, 1% better).
 * Screen 3: Tomorrow's priority + auto-calculated score + save.
 */

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigationActions, useRegisterWizard } from '@/components/providers';
import { useActiveCycle } from '../hooks/useActiveCycle';
import { useCurrentWeekPlan } from '../hooks/useWeeklyPlans';
import { useGoals } from '../hooks/useGoals';
import { createDailyReview } from '../strategyMutations';
import {
  filterLeadMeasuresByDay,
  formatDisplayDate,
  todayIsoDate,
} from '../strategyUtils';
import type { TacticScore } from '../types';
import type { GoalWithMeasures } from '../hooks/useGoals';
import type { LeadMeasureItem } from '../types';
import styles from './DailyReviewWizard.module.css';

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3;

type GoalWithFiltered = Omit<GoalWithMeasures, 'leadMeasures'> & {
  filteredMeasures: LeadMeasureItem[];
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date?: string;
};

// ── Main export (guard) ───────────────────────────────────────────────────────

export function DailyReviewWizard({ open, onOpenChange, date }: Props) {
  useRegisterWizard(open);
  if (!open) return null;
  return <DailyReviewWizardInner onClose={() => onOpenChange(false)} date={date} />;
}

// ── Inner component (always mounted when visible) ─────────────────────────────

function DailyReviewWizardInner({
  onClose,
  date: propDate,
}: {
  onClose: () => void;
  date?: string;
}) {
  const today = propDate ?? todayIsoDate();
  const queryClient = useQueryClient();
  const { pushLayer } = useNavigationActions();

  const { data: cycle, isLoading: cycleLoading } = useActiveCycle();
  const { data: weekPlan } = useCurrentWeekPlan();
  const { data: goals = [], isLoading: goalsLoading } = useGoals(cycle?.id);

  const dayOfWeek = new Date(`${today}T12:00:00`).getDay();

  const todayGoals: GoalWithFiltered[] = goals
    .map((g) => ({
      ...g,
      filteredMeasures: filterLeadMeasuresByDay(g.leadMeasures, dayOfWeek),
    }))
    .filter((g) => g.filteredMeasures.length > 0);

  const allTodayMeasures = todayGoals.flatMap((g) => g.filteredMeasures);

  // ── Form state ─────────────────────────────────────────────────────────────

  const [step, setStep] = useState<Step>(1);
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>({});
  const [actualMap, setActualMap] = useState<Record<string, string>>({});
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});
  const [whatWentWell, setWhatWentWell] = useState('');
  const [whatDidntGoWell, setWhatDidntGoWell] = useState('');
  const [wins, setWins] = useState('');
  const [onePercentBetter, setOnePercentBetter] = useState('');
  const [tomorrowsPriority, setTomorrowsPriority] = useState('');
  const [showManualScore, setShowManualScore] = useState(false);
  const [manualScoreInput, setManualScoreInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // ── Score calculation ──────────────────────────────────────────────────────

  function isMeasureComplete(lm: LeadMeasureItem): boolean {
    if ((lm.subtype as string) === 'numeric') {
      const actual = parseFloat(actualMap[lm.id] ?? '');
      return !isNaN(actual) && actual >= (lm.target ?? 0);
    }
    return completedMap[lm.id] ?? false;
  }

  const completedCount = allTodayMeasures.filter(isMeasureComplete).length;
  const totalCount = allTodayMeasures.length;
  const scoreAuto = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // ── Save ───────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const tacticScores: TacticScore[] = allTodayMeasures.map((lm) => ({
        leadMeasureId: lm.id,
        completed: isMeasureComplete(lm),
        actual:
          (lm.subtype as string) === 'numeric' && actualMap[lm.id]
            ? parseFloat(actualMap[lm.id])
            : null,
        note: noteMap[lm.id] ?? '',
      }));

      const leadMeasureTitles: Record<string, string> = {};
      const leadMeasureTargets: Record<string, number | null> = {};
      const leadMeasureSubtypes: Record<string, 'binary' | 'numeric'> = {};
      for (const lm of allTodayMeasures) {
        leadMeasureTitles[lm.id] = lm.title ?? '';
        leadMeasureTargets[lm.id] = lm.target ?? null;
        leadMeasureSubtypes[lm.id] = ((lm.subtype as string) ?? 'binary') as 'binary' | 'numeric';
      }

      const scoreManual =
        showManualScore && manualScoreInput !== ''
          ? Math.max(0, Math.min(100, parseInt(manualScoreInput, 10)))
          : null;

      const id = await createDailyReview({
        weeklyPlanId: weekPlan?.id ?? null,
        date: today,
        tacticScores,
        reflection: {
          whatWentWell,
          whatDidntGoWell,
          wins,
          onePercentBetter,
          tomorrowsPriority,
          scoreManual,
        },
        leadMeasureTitles,
        leadMeasureTargets,
        leadMeasureSubtypes,
      });

      queryClient.invalidateQueries({ queryKey: ['strategy', 'reviews'] });
      queryClient.invalidateQueries({ queryKey: ['strategy', 'daily-reviews-for-week'] });
      queryClient.invalidateQueries({ queryKey: ['strategy', 'tactic-entries'] });
      queryClient.invalidateQueries({ queryKey: ['strategy', 'list'] });

      onClose();
      pushLayer({ view: 'strategy-detail', strategyId: `document:${id}` });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const isLoading = cycleLoading || goalsLoading;

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
        <span className={styles.wizardTitle}>Daily Review</span>
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
              <Step1LeadMeasures
                today={today}
                todayGoals={todayGoals}
                allMeasures={allTodayMeasures}
                completedMap={completedMap}
                setCompletedMap={setCompletedMap}
                actualMap={actualMap}
                setActualMap={setActualMap}
                noteMap={noteMap}
                setNoteMap={setNoteMap}
                isMeasureComplete={isMeasureComplete}
                noCycle={!cycle}
                noWeekPlan={!weekPlan}
              />
            )}
            {step === 2 && (
              <Step2Reflection
                whatWentWell={whatWentWell}
                setWhatWentWell={setWhatWentWell}
                whatDidntGoWell={whatDidntGoWell}
                setWhatDidntGoWell={setWhatDidntGoWell}
                wins={wins}
                setWins={setWins}
                onePercentBetter={onePercentBetter}
                setOnePercentBetter={setOnePercentBetter}
              />
            )}
            {step === 3 && (
              <Step3WrapUp
                today={today}
                tomorrowsPriority={tomorrowsPriority}
                setTomorrowsPriority={setTomorrowsPriority}
                scoreAuto={scoreAuto}
                completedCount={completedCount}
                totalCount={totalCount}
                showManualScore={showManualScore}
                setShowManualScore={setShowManualScore}
                manualScoreInput={manualScoreInput}
                setManualScoreInput={setManualScoreInput}
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

// ── Step 1: Lead Measures ─────────────────────────────────────────────────────

function Step1LeadMeasures({
  today,
  todayGoals,
  allMeasures,
  completedMap,
  setCompletedMap,
  actualMap,
  setActualMap,
  noteMap,
  setNoteMap,
  isMeasureComplete,
  noCycle,
  noWeekPlan,
}: {
  today: string;
  todayGoals: GoalWithFiltered[];
  allMeasures: LeadMeasureItem[];
  completedMap: Record<string, boolean>;
  setCompletedMap: (m: Record<string, boolean>) => void;
  actualMap: Record<string, string>;
  setActualMap: (m: Record<string, string>) => void;
  noteMap: Record<string, string>;
  setNoteMap: (m: Record<string, string>) => void;
  isMeasureComplete: (lm: LeadMeasureItem) => boolean;
  noCycle: boolean;
  noWeekPlan: boolean;
}) {
  const toggleBinary = (id: string) => {
    setCompletedMap({ ...completedMap, [id]: !completedMap[id] });
  };

  const setActual = (id: string, val: string) => {
    setActualMap({ ...actualMap, [id]: val });
  };

  const setNote = (id: string, val: string) => {
    setNoteMap({ ...noteMap, [id]: val });
  };

  return (
    <>
      <div className={styles.stepHeader}>
        <div className={styles.stepDate}>{formatDisplayDate(today)}</div>
        <div className={styles.stepSubtitle}>Lead Measures</div>
      </div>

      {noCycle && (
        <div className={styles.emptyState}>
          No active cycle. Set up a cycle to track lead measures here.
        </div>
      )}

      {!noCycle && noWeekPlan && (
        <div className={styles.warnBanner}>
          No weekly plan covers today. The review will be saved without a plan link.
        </div>
      )}

      {!noCycle && allMeasures.length === 0 && (
        <div className={styles.emptyState}>
          No lead measures scheduled for today.
          <br />
          You can still continue to record your reflection.
        </div>
      )}

      {todayGoals.map((goal) => (
        <div key={goal.id}>
          <div className={styles.sectionLabel}>From: {goal.title}</div>
          {goal.filteredMeasures.map((lm) => {
            const isNumeric = (lm.subtype as string) === 'numeric';
            const done = isMeasureComplete(lm);
            return (
              <div key={lm.id} className={styles.tacticCard}>
                <div className={styles.tacticRow}>
                  <div style={{ flex: 1 }}>
                    <div className={styles.tacticTitle}>{lm.title}</div>
                    {isNumeric && lm.target != null && (
                      <div className={styles.tacticMeta}>target: {lm.target}</div>
                    )}
                  </div>
                  {isNumeric ? (
                    <span className={styles.doneIndicator}>{done ? '✅' : '❌'}</span>
                  ) : (
                    <button
                      type="button"
                      className={`${styles.toggle}${completedMap[lm.id] ? ` ${styles['toggle--on']}` : ''}`}
                      onClick={() => toggleBinary(lm.id)}
                      aria-label={completedMap[lm.id] ? 'Mark incomplete' : 'Mark complete'}
                    />
                  )}
                </div>
                {isNumeric && (
                  <div className={styles.numericRow}>
                    <span className={styles.numericLabel}>Actual:</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      className={styles.numericInput}
                      value={actualMap[lm.id] ?? ''}
                      onChange={(e) => setActual(lm.id, e.target.value)}
                      placeholder="0"
                    />
                  </div>
                )}
                <textarea
                  className={styles.noteInput}
                  rows={1}
                  placeholder="Add a note…"
                  value={noteMap[lm.id] ?? ''}
                  onChange={(e) => setNote(lm.id, e.target.value)}
                />
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
}

// ── Step 2: Reflection ────────────────────────────────────────────────────────

function Step2Reflection({
  whatWentWell,
  setWhatWentWell,
  whatDidntGoWell,
  setWhatDidntGoWell,
  wins,
  setWins,
  onePercentBetter,
  setOnePercentBetter,
}: {
  whatWentWell: string;
  setWhatWentWell: (v: string) => void;
  whatDidntGoWell: string;
  setWhatDidntGoWell: (v: string) => void;
  wins: string;
  setWins: (v: string) => void;
  onePercentBetter: string;
  setOnePercentBetter: (v: string) => void;
}) {
  return (
    <>
      <div className={styles.stepHeader}>
        <div className={styles.stepDate}>Reflection</div>
      </div>

      <div className={styles.field}>
        <div className={styles.fieldLabel}>What went well today?</div>
        <textarea
          className={styles.fieldTextarea}
          rows={3}
          placeholder="…"
          value={whatWentWell}
          onChange={(e) => setWhatWentWell(e.target.value)}
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
        <div className={styles.fieldLabel}>Wins (things to celebrate)</div>
        <textarea
          className={styles.fieldTextarea}
          rows={2}
          placeholder="…"
          value={wins}
          onChange={(e) => setWins(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <div className={styles.fieldLabel}>How can I get 1% better tomorrow?</div>
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

// ── Step 3: Wrap Up ───────────────────────────────────────────────────────────

function Step3WrapUp({
  today,
  tomorrowsPriority,
  setTomorrowsPriority,
  scoreAuto,
  completedCount,
  totalCount,
  showManualScore,
  setShowManualScore,
  manualScoreInput,
  setManualScoreInput,
}: {
  today: string;
  tomorrowsPriority: string;
  setTomorrowsPriority: (v: string) => void;
  scoreAuto: number;
  completedCount: number;
  totalCount: number;
  showManualScore: boolean;
  setShowManualScore: (v: boolean) => void;
  manualScoreInput: string;
  setManualScoreInput: (v: string) => void;
}) {
  // Next day display
  const nextDay = (() => {
    const d = new Date(`${today}T12:00:00`);
    d.setDate(d.getDate() + 1);
    return d.toLocaleDateString('en-US', { weekday: 'long' });
  })();

  return (
    <>
      <div className={styles.stepHeader}>
        <div className={styles.stepDate}>Wrap Up</div>
      </div>

      <div className={styles.field}>
        <div className={styles.fieldLabel}>{nextDay}'s #1 priority</div>
        <textarea
          className={styles.fieldTextarea}
          rows={3}
          placeholder="What's most important tomorrow?"
          value={tomorrowsPriority}
          onChange={(e) => setTomorrowsPriority(e.target.value)}
        />
      </div>

      <div className={styles.scoreDivider} />

      <div className={styles.scoreSection}>
        <div className={styles.scoreSectionTitle}>Today's Score</div>
        <div className={styles.scoreDisplay}>
          <span className={styles.scoreNumber}>
            {showManualScore && manualScoreInput !== ''
              ? Math.max(0, Math.min(100, parseInt(manualScoreInput, 10) || 0))
              : scoreAuto}%
          </span>
          {totalCount > 0 && (
            <span className={styles.scoreSub}>
              {completedCount} of {totalCount} lead measures
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
            Adjust score manually
          </button>
        ) : (
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
          </div>
        )}
      </div>

      <div className={styles.nudge}>
        💡 Don't forget to prep tomorrow's tasks in your daily note.
      </div>
    </>
  );
}
