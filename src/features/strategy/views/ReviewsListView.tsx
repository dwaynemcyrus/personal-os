import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigationActions } from '@/components/providers';
import { useReviews } from '../hooks/useReviews';
import { formatDisplayDate, formatWeekRange } from '../strategyUtils';
import { CreateDocSheet } from '../create/CreateDocSheet';
import { DailyReviewWizard } from '../reviews/DailyReviewWizard';
import { WeeklyReviewWizard } from '../reviews/WeeklyReviewWizard';
import { ViewShell, viewStyles } from './ViewShell';

type Props = { onBack: () => void };

// Mini picker sheet options
type ReviewQuickType = 'daily' | 'weekly' | 'other';

export function ReviewsListView({ onBack }: Props) {
  const { pushLayer } = useNavigationActions();
  const { data, isLoading } = useReviews(20);
  const [isDailyOpen, setIsDailyOpen] = useState(false);
  const [isWeeklyOpen, setIsWeeklyOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const navigate = (id: string) => {
    pushLayer({ view: 'strategy-detail', strategyId: `document:${id}` });
  };

  const total =
    (data?.dailyReviews.length ?? 0) +
    (data?.weeklyReviews.length ?? 0) +
    (data?.cycleReviews.length ?? 0) +
    (data?.thirteenthWeekReviews.length ?? 0) +
    (data?.annualReviews.length ?? 0);

  const handlePickReviewType = (type: ReviewQuickType) => {
    setIsPickerOpen(false);
    if (type === 'daily') setIsDailyOpen(true);
    else if (type === 'weekly') setIsWeeklyOpen(true);
    else setIsCreateOpen(true);
  };

  const addButton = (
    <button
      type="button"
      className={viewStyles.addBtn}
      aria-label="Create review"
      onClick={() => setIsPickerOpen(true)}
    >
      +
    </button>
  );

  return (
    <>
    <ViewShell title="Reviews" onBack={onBack} rightSlot={addButton}>
      {isLoading && <p className={viewStyles.loadingState}>Loading…</p>}

      {!isLoading && total === 0 && (
        <p className={viewStyles.emptyState}>No reviews yet.</p>
      )}

      {!isLoading && data && (
        <>
          {data.annualReviews.length > 0 && (
            <>
              <div className={viewStyles.sectionLabel}>Annual</div>
              {data.annualReviews.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={viewStyles.row}
                  onClick={() => navigate(r.id)}
                >
                  <div className={viewStyles.rowBody}>
                    <div className={viewStyles.rowTitle}>{r.title ?? `Annual Review ${r.subtype ?? ''}`}</div>
                    {r.progress != null && (
                      <div className={viewStyles.rowSubtitle}>Avg score: {r.progress}%</div>
                    )}
                  </div>
                  <div className={viewStyles.rowRight}>
                    <span className={viewStyles.rowChevron}>›</span>
                  </div>
                </button>
              ))}
              <div className={viewStyles.divider} />
            </>
          )}

          {data.cycleReviews.length > 0 && (
            <>
              <div className={viewStyles.sectionLabel}>12-week cycle</div>
              {data.cycleReviews.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={viewStyles.row}
                  onClick={() => navigate(r.id)}
                >
                  <div className={viewStyles.rowBody}>
                    <div className={viewStyles.rowTitle}>{r.title ?? 'Cycle Review'}</div>
                    {r.progress != null && (
                      <div className={viewStyles.rowSubtitle}>Score: {r.progress}%</div>
                    )}
                  </div>
                  <div className={viewStyles.rowRight}>
                    <span className={viewStyles.rowChevron}>›</span>
                  </div>
                </button>
              ))}
              <div className={viewStyles.divider} />
            </>
          )}

          {data.thirteenthWeekReviews.length > 0 && (
            <>
              <div className={viewStyles.sectionLabel}>13th week</div>
              {data.thirteenthWeekReviews.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={viewStyles.row}
                  onClick={() => navigate(r.id)}
                >
                  <div className={viewStyles.rowBody}>
                    <div className={viewStyles.rowTitle}>{r.title ?? '13th Week Review'}</div>
                    {r.period_start && (
                      <div className={viewStyles.rowSubtitle}>{formatDisplayDate(r.period_start)}</div>
                    )}
                  </div>
                  <div className={viewStyles.rowRight}>
                    <span className={viewStyles.rowChevron}>›</span>
                  </div>
                </button>
              ))}
              <div className={viewStyles.divider} />
            </>
          )}

          {data.weeklyReviews.length > 0 && (
            <>
              <div className={viewStyles.sectionLabel}>Weekly</div>
              {data.weeklyReviews.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={viewStyles.row}
                  onClick={() => navigate(r.id)}
                >
                  <div className={viewStyles.rowBody}>
                    <div className={viewStyles.rowTitle}>
                      {r.period_start && r.period_end
                        ? formatWeekRange(r.period_start, r.period_end)
                        : r.title ?? 'Weekly Review'}
                    </div>
                    {r.progress != null && (
                      <div className={viewStyles.rowSubtitle}>Score: {r.progress}%</div>
                    )}
                  </div>
                  <div className={viewStyles.rowRight}>
                    <span className={viewStyles.rowChevron}>›</span>
                  </div>
                </button>
              ))}
              <div className={viewStyles.divider} />
            </>
          )}

          {data.dailyReviews.length > 0 && (
            <>
              <div className={viewStyles.sectionLabel}>Daily</div>
              {data.dailyReviews.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={viewStyles.row}
                  onClick={() => navigate(r.id)}
                >
                  <div className={viewStyles.rowBody}>
                    <div className={viewStyles.rowTitle}>
                      {formatDisplayDate(r.period_start)}
                    </div>
                    {r.progress != null && (
                      <div className={viewStyles.rowSubtitle}>Score: {r.progress}%</div>
                    )}
                  </div>
                  <div className={viewStyles.rowRight}>
                    <span className={viewStyles.rowChevron}>›</span>
                  </div>
                </button>
              ))}
            </>
          )}
        </>
      )}
    </ViewShell>

      {/* Quick-pick bottom sheet */}
      {isPickerOpen && typeof document !== 'undefined' &&
        createPortal(
          <ReviewTypePicker
            onSelect={handlePickReviewType}
            onClose={() => setIsPickerOpen(false)}
          />,
          document.body,
        )}

      {typeof document !== 'undefined' &&
        createPortal(
          <DailyReviewWizard open={isDailyOpen} onOpenChange={setIsDailyOpen} />,
          document.body,
        )}

      {typeof document !== 'undefined' &&
        createPortal(
          <WeeklyReviewWizard open={isWeeklyOpen} onOpenChange={setIsWeeklyOpen} />,
          document.body,
        )}

      {typeof document !== 'undefined' &&
        createPortal(
          <CreateDocSheet
            open={isCreateOpen}
            onOpenChange={setIsCreateOpen}
            onCreated={(id) => {
              setIsCreateOpen(false);
              navigate(id);
            }}
          />,
          document.body,
        )}
    </>
  );
}

// ── Review type picker overlay ────────────────────────────────────────────────

import styles from './ReviewsListView.module.css';

function ReviewTypePicker({
  onSelect,
  onClose,
}: {
  onSelect: (type: ReviewQuickType) => void;
  onClose: () => void;
}) {
  return (
    <div className={styles.pickerOverlay} onClick={onClose}>
      <div className={styles.pickerSheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.pickerHandle} />
        <div className={styles.pickerTitle}>New Review</div>
        <button
          type="button"
          className={styles.pickerRow}
          onClick={() => onSelect('daily')}
        >
          <span className={styles.pickerRowLabel}>Daily Review</span>
          <span className={styles.pickerRowHint}>Today's lead measures + reflection</span>
          <span className={styles.pickerRowChevron}>›</span>
        </button>
        <button
          type="button"
          className={styles.pickerRow}
          onClick={() => onSelect('weekly')}
        >
          <span className={styles.pickerRowLabel}>Weekly Review</span>
          <span className={styles.pickerRowHint}>Scorecard + weekly reflection</span>
          <span className={styles.pickerRowChevron}>›</span>
        </button>
        <button
          type="button"
          className={styles.pickerRow}
          onClick={() => onSelect('other')}
        >
          <span className={styles.pickerRowLabel}>Other…</span>
          <span className={styles.pickerRowHint}>12-week, annual, etc.</span>
          <span className={styles.pickerRowChevron}>›</span>
        </button>
        <div className={styles.pickerSafeArea} />
      </div>
    </div>
  );
}
