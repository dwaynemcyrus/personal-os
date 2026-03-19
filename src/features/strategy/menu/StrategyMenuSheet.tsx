import { Sheet, SheetContent, SheetTitle } from '@/components/ui/Sheet';
import type { DocType } from '../create/CreateDocSheet';
import styles from './StrategyMenuSheet.module.css';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWizard: () => void;
  onCreate: (type: DocType) => void;
  onTemplates: () => void;
};

type QuickAction = {
  type: DocType;
  label: string;
  hint: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  { type: 'area', label: 'Add Life Arena', hint: 'Step 1' },
  { type: 'annual-outcomes', label: 'Set Annual Outcomes', hint: 'Step 2' },
  { type: '12-week-overview', label: 'New 12-Week Cycle', hint: 'Step 4' },
  { type: '12-week-goal', label: 'Add Goal', hint: 'Step 5' },
  { type: 'weekly-plan', label: 'New Weekly Plan', hint: 'Step 6' },
];

export function StrategyMenuSheet({
  open,
  onOpenChange,
  onWizard,
  onCreate,
  onTemplates,
}: Props) {
  const close = () => onOpenChange(false);

  const handleWizard = () => {
    close();
    onWizard();
  };

  const handleCreate = (type: DocType) => {
    close();
    onCreate(type);
  };

  const handleTemplates = () => {
    close();
    onTemplates();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" aria-label="Plans menu">
        <div className={styles.handle} />

        <div className={styles.header}>
          <SheetTitle className={styles.title}>Plans</SheetTitle>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={close}
            aria-label="Close menu"
          >
            ×
          </button>
        </div>

        {/* Wizard */}
        <div className={styles.section}>
          <button
            type="button"
            className={`${styles.row} ${styles.wizardRow}`}
            onClick={handleWizard}
          >
            <div className={styles.rowBody}>
              <div className={styles.rowLabel}>Re-run full setup wizard</div>
            </div>
            <span className={styles.rowChevron}>›</span>
          </button>
        </div>

        <div className={styles.sectionDivider} />

        {/* Quick actions */}
        <div className={styles.section}>
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.type}
              type="button"
              className={styles.row}
              onClick={() => handleCreate(action.type)}
            >
              <div className={styles.rowBody}>
                <div className={styles.rowLabel}>{action.label}</div>
                <div className={styles.rowHint}>{action.hint}</div>
              </div>
              <span className={styles.rowChevron}>›</span>
            </button>
          ))}
        </div>

        <div className={styles.sectionDivider} />

        {/* Templates */}
        <div className={styles.section}>
          <button
            type="button"
            className={styles.row}
            onClick={handleTemplates}
          >
            <div className={styles.rowBody}>
              <div className={styles.rowLabel}>Edit Templates</div>
            </div>
            <span className={styles.rowChevron}>›</span>
          </button>
        </div>

        <div className={styles.safeArea} />
      </SheetContent>
    </Sheet>
  );
}
