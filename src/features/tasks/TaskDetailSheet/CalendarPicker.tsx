import { useEffect, useState } from 'react';
import styles from './CalendarPicker.module.css';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

type CalendarPickerProps = {
  value: string; // '' or 'YYYY-MM-DD'
  onChange: (value: string) => void;
};

export function CalendarPicker({ value, onChange }: CalendarPickerProps) {
  const today = getLocalDateStr(new Date());

  const [viewYear, setViewYear] = useState(() =>
    value ? parseInt(value.slice(0, 4), 10) : new Date().getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(() =>
    value ? parseInt(value.slice(5, 7), 10) - 1 : new Date().getMonth()
  );

  // Sync view when an external value change comes in (e.g. "Today" quick action)
  useEffect(() => {
    if (!value) return;
    setViewYear(parseInt(value.slice(0, 4), 10));
    setViewMonth(parseInt(value.slice(5, 7), 10) - 1);
  }, [value]);

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();
  const viewMonthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;

  const handlePrev = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };

  const handleNext = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  return (
    <div className={styles.root}>
      <div className={styles.nav}>
        <button type="button" className={styles.navBtn} onClick={handlePrev} aria-label="Previous month">
          ‹
        </button>
        <span className={styles.monthLabel}>{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button type="button" className={styles.navBtn} onClick={handleNext} aria-label="Next month">
          ›
        </button>
      </div>

      <div className={styles.weekdays}>
        {WEEKDAY_LABELS.map((label, i) => (
          <span key={i} className={styles.weekday}>{label}</span>
        ))}
      </div>

      <div className={styles.grid}>
        {Array.from({ length: firstWeekday }, (_, i) => (
          <span key={`pad-${i}`} />
        ))}
        {Array.from({ length: totalDays }, (_, i) => {
          const day = i + 1;
          const dateStr = `${viewMonthPrefix}-${String(day).padStart(2, '0')}`;
          const isSelected = dateStr === value;
          const isToday = dateStr === today;
          return (
            <button
              key={day}
              type="button"
              className={[
                styles.day,
                isSelected ? styles.daySelected : '',
                isToday && !isSelected ? styles.dayToday : '',
              ].filter(Boolean).join(' ')}
              onClick={() => onChange(dateStr)}
              aria-pressed={isSelected}
              aria-label={`${day} ${MONTH_NAMES[viewMonth]} ${viewYear}`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function getLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
