import { Sheet, SheetContent } from '@/components/ui/Sheet';
import styles from './TemplatePicker.module.css';

export type TemplateOption = {
  label: string;
  type: string;
  subtype: string | null;
};

export const TEMPLATE_OPTIONS: TemplateOption[] = [
  { label: 'Daily Journal',   type: 'journal',      subtype: 'daily'      },
  { label: 'Task',            type: 'action',        subtype: 'task'       },
  { label: 'Project',         type: 'action',        subtype: 'project'    },
  { label: 'Scratch',         type: 'journal',       subtype: 'scratch'    },
  { label: 'Essay',           type: 'creation',      subtype: 'essay'      },
  { label: 'Framework',       type: 'creation',      subtype: 'framework'  },
  { label: 'Workshop',        type: 'transmission',  subtype: 'workshop'   },
  { label: 'Slip',            type: 'reference',     subtype: 'slip'       },
  { label: 'Literature',      type: 'reference',     subtype: 'literature' },
  { label: 'Weekly Review',   type: 'review',        subtype: 'weekly'     },
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: string, subtype: string | null) => void;
};

export function TemplatePicker({ open, onOpenChange, onSelect }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" ariaLabel="Apply template" className={styles.sheet}>
        <div className={styles.header}>
          <span className={styles.title}>Apply Template</span>
          <p className={styles.hint}>Inserts body content. Existing content is replaced.</p>
        </div>
        <ul className={styles.list} role="list">
          {TEMPLATE_OPTIONS.map((opt) => (
            <li key={`${opt.type}:${opt.subtype}`}>
              <button
                type="button"
                className={styles.row}
                onClick={() => {
                  onSelect(opt.type, opt.subtype);
                  onOpenChange(false);
                }}
              >
                <span className={styles.rowLabel}>{opt.label}</span>
                <span className={styles.rowMeta}>{opt.type}{opt.subtype ? `:${opt.subtype}` : ''}</span>
              </button>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
