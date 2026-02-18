'use client';

import { useRouter } from 'next/navigation';
import { showToast } from '@/components/ui/Toast';
import { useNoteGroupCounts } from '../hooks/useNoteGroupCounts';
import type { NoteGroup } from '../hooks/useGroupedNotes';
import styles from './NotesOverview.module.css';

type GroupRow = {
  id: NoteGroup;
  label: string;
  icon: 'notes' | 'check' | 'calendar' | 'lock' | 'pin' | 'trash';
  comingSoon?: boolean;
};

const GROUP_ROWS: GroupRow[] = [
  { id: 'all', label: 'Notes', icon: 'notes' },
  { id: 'todo', label: 'Todo', icon: 'check' },
  { id: 'today', label: 'Today', icon: 'calendar' },
  { id: 'locked', label: 'Locked', icon: 'lock', comingSoon: true },
  { id: 'pinned', label: 'Pinned', icon: 'pin' },
  { id: 'trash', label: 'Trash', icon: 'trash' },
];

export function NotesOverview() {
  const router = useRouter();
  const counts = useNoteGroupCounts();

  const handleGroupPress = (row: GroupRow) => {
    if (row.comingSoon) {
      showToast(`${row.label} is coming soon`);
      return;
    }
    router.push(`/notes/${row.id}`);
  };

  return (
    <div className={styles.overview}>
      <div className={styles.header}>
        <h1 className={styles.title}>Notes</h1>
      </div>
      <div className={styles.list}>
        {GROUP_ROWS.map((row) => (
          <button
            key={row.id}
            type="button"
            className={styles.row}
            onClick={() => handleGroupPress(row)}
          >
            <span className={styles.rowIcon}>
              <RowIcon type={row.icon} />
            </span>
            <span className={styles.rowLabel}>{row.label}</span>
            {counts[row.id] > 0 && !row.comingSoon ? (
              <span className={styles.rowCount}>{counts[row.id]}</span>
            ) : null}
            <span className={styles.rowCaret} aria-hidden="true">
              <CaretIcon />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function RowIcon({ type }: { type: GroupRow['icon'] }) {
  switch (type) {
    case 'check':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M6 12l4 4 8-8" />
        </svg>
      );
    case 'calendar':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M7 4v3" />
          <path d="M17 4v3" />
          <rect x="4" y="7" width="16" height="13" rx="2" />
        </svg>
      );
    case 'lock':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <rect x="6" y="10" width="12" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
      );
    case 'pin':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M8 4h8l-1.6 3.2c-.2.4-.2.8 0 1.2L16 12v4l-4-2.2L8 16v-4l1.6-3.6c.2-.4.2-.8 0-1.2L8 4z" />
        </svg>
      );
    case 'trash':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M5 7h14" />
          <path d="M9 7V5h6v2" />
          <rect x="7" y="7" width="10" height="12" rx="2" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M7 4h7l4 4v12H7z" />
          <path d="M14 4v4h4" />
          <path d="M9 12h6" />
          <path d="M9 16h6" />
        </svg>
      );
  }
}

function CaretIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
