import { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { showToast } from '@/components/ui/Toast';
import { useNavigationActions } from '@/components/providers';
import { useNoteGroupCounts } from '@/features/notes/hooks/useNoteGroupCounts';
import type { NoteGroup } from '@/features/notes/hooks/useGroupedNotes';
import styles from './ContextSheet.module.css';

type ContextSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type Tab = 'notes' | 'tasks' | 'plans';

type NoteGroupRow = {
  id: NoteGroup;
  label: string;
  comingSoon?: boolean;
};

const NOTE_GROUPS: NoteGroupRow[] = [
  { id: 'all', label: 'Notes' },
  { id: 'todo', label: 'Todo' },
  { id: 'today', label: 'Today' },
  { id: 'pinned', label: 'Pinned' },
  { id: 'locked', label: 'Locked', comingSoon: true },
  { id: 'trash', label: 'Trash' },
];

export function ContextSheet({ open, onOpenChange }: ContextSheetProps) {
  const [activeTab, setActiveTab] = useState<Tab>('tasks');
  const { pushLayer } = useNavigationActions();
  const counts = useNoteGroupCounts();

  const handleNoteGroupPress = (row: NoteGroupRow) => {
    if (row.comingSoon) {
      showToast(`${row.label} is coming soon`);
      return;
    }
    onOpenChange(false);
    pushLayer({ view: 'notes-list', group: row.id });
  };

  const handleTasksPress = () => {
    onOpenChange(false);
    pushLayer({ view: 'tasks-list' });
  };

  const handlePlansPress = () => {
    onOpenChange(false);
    pushLayer({ view: 'plans-list' });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" ariaLabel="Context" className={styles.sheet}>
        <div className={styles.handle} />

        <div className={styles.tabs}>
          {(['tasks', 'plans', 'notes'] as Tab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className={styles.content}>
          {activeTab === 'notes' && (
            <div className={styles.list}>
              {NOTE_GROUPS.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  className={`${styles.row} ${row.comingSoon ? styles.rowDisabled : ''}`}
                  onClick={() => handleNoteGroupPress(row)}
                >
                  <span className={styles.rowLabel}>{row.label}</span>
                  {counts[row.id] > 0 && !row.comingSoon ? (
                    <span className={styles.rowCount}>{counts[row.id]}</span>
                  ) : null}
                  {row.comingSoon ? (
                    <span className={styles.rowSoon}>Soon</span>
                  ) : (
                    <span className={styles.rowCaret} aria-hidden="true">›</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className={styles.list}>
              <button
                type="button"
                className={styles.row}
                onClick={handleTasksPress}
              >
                <span className={styles.rowLabel}>All Tasks</span>
                <span className={styles.rowCaret} aria-hidden="true">›</span>
              </button>
            </div>
          )}

          {activeTab === 'plans' && (
            <div className={styles.list}>
              <button
                type="button"
                className={styles.row}
                onClick={handlePlansPress}
              >
                <span className={styles.rowLabel}>All Plans</span>
                <span className={styles.rowCaret} aria-hidden="true">›</span>
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
