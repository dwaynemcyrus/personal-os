import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { useTemplates } from '../hooks/useTemplates';
import styles from './TemplatePicker.module.css';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with a template note ID, or null for "blank / no template" */
  onSelect: (templateId: string | null) => void;
  /** Whether to show a blank/none option at the top. Default true. */
  showBlankOption?: boolean;
  /** Label for the blank option. Default "Blank note" */
  blankLabel?: string;
};

export function TemplatePicker({
  open,
  onOpenChange,
  onSelect,
  showBlankOption = true,
  blankLabel = 'Blank note',
}: Props) {
  const { data: templates = [], isLoading } = useTemplates({ enabled: open });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" ariaLabel="Choose template" className={styles.sheet}>
        <p className={styles.heading}>Choose template</p>

        {showBlankOption && (
          <button
            type="button"
            className={`${styles.item} ${styles.itemBlank}`}
            onClick={() => onSelect(null)}
          >
            {blankLabel}
          </button>
        )}

        {isLoading && <p className={styles.empty}>Loading…</p>}

        {!isLoading && templates.length === 0 && (
          <p className={styles.empty}>
            No templates yet. Use the + button in the Templates section to create one.
          </p>
        )}

        {templates.map((t) => (
          <button
            key={t.id}
            type="button"
            className={styles.item}
            onClick={() => onSelect(t.id)}
          >
            {t.title ?? 'Untitled template'}
          </button>
        ))}
      </SheetContent>
    </Sheet>
  );
}
