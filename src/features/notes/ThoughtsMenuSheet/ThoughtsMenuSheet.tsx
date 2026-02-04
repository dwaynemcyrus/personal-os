'use client';

import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { showToast } from '@/components/ui/Toast';
import styles from './ThoughtsMenuSheet.module.css';

type ThoughtsMenuSheetProps = {
  open: boolean;
  isNotesActive: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenNotes: () => void;
};

const QUICK_ITEMS = [
  { id: 'untagged', label: 'Untagged', icon: 'archive' },
  { id: 'todo', label: 'Todo', icon: 'check' },
  { id: 'today', label: 'Today', icon: 'calendar' },
  { id: 'locked', label: 'Locked', icon: 'lock' },
  { id: 'pinned', label: 'Pinned', icon: 'pin' },
  { id: 'trash', label: 'Trash', icon: 'trash' },
] as const;

const TAG_ITEMS = [
  { id: 'mocs', label: 'mocs' },
  { id: 'ai', label: 'ai' },
  { id: 'anchor', label: 'anchor' },
  { id: 'anchored', label: 'anchored' },
  { id: 'business', label: 'business' },
  { id: 'checklist', label: 'checklist' },
  { id: 'dev', label: 'dev' },
  { id: 'documentation', label: 'documentation' },
  { id: 'git', label: 'git' },
  { id: 'islam', label: 'islam' },
] as const;

const handleComingSoon = (label: string) => {
  showToast(`${label} is coming soon`);
};

export function ThoughtsMenuSheet({
  open,
  isNotesActive,
  onOpenChange,
  onOpenNotes,
}: ThoughtsMenuSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className={styles.sheet}
        overlayClassName={styles.overlay}
        aria-label="Thoughts menu"
      >
        <div className={styles.header}>
          <button
            type="button"
            className={styles.headerButton}
            onClick={() => handleComingSoon('Menu options')}
            aria-label="Menu options"
          >
            <DotsIcon />
          </button>
          <button
            type="button"
            className={styles.headerButton}
            onClick={() => handleComingSoon('Filters')}
            aria-label="Filters"
          >
            <FilterIcon />
          </button>
        </div>

        <button
          type="button"
          className={styles.primaryRow}
          data-active={isNotesActive}
          onClick={onOpenNotes}
        >
          <span className={styles.primaryIcon}>
            <NotesIcon />
          </span>
          <span className={styles.primaryLabel}>Notes</span>
          <span className={styles.primaryCaret} aria-hidden="true">
            <CaretIcon />
          </span>
        </button>

        <div className={styles.section}>
          {QUICK_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={styles.row}
              onClick={() => handleComingSoon(item.label)}
            >
              <span className={styles.rowIcon}>
                <RowIcon type={item.icon} />
              </span>
              <span className={styles.rowLabel}>{item.label}</span>
            </button>
          ))}
        </div>

        <div className={styles.sectionLabel}>Tags</div>
        <div className={styles.section}>
          {TAG_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={styles.row}
              onClick={() => handleComingSoon(item.label)}
            >
              <span className={styles.rowIcon}>
                <TagIcon />
              </span>
              <span className={styles.rowLabel}>{item.label}</span>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DotsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="6" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="18" cy="12" r="2" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </svg>
  );
}

function NotesIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 4h7l4 4v12H7z" />
      <path d="M14 4v4h4" />
      <path d="M9 12h6" />
      <path d="M9 16h6" />
    </svg>
  );
}

function CaretIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 10l5 5 5-5" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M20 12l-8 8-8-8V4h8l8 8z" />
      <circle cx="9" cy="9" r="1.5" />
    </svg>
  );
}

function RowIcon({ type }: { type: (typeof QUICK_ITEMS)[number]['icon'] }) {
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
          <path d="M4 7h16l-2 10H6L4 7z" />
          <path d="M8 7V4h8v3" />
        </svg>
      );
  }
}
