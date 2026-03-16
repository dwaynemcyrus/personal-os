import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import type { ItemRow } from '@/lib/db';
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
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['notes', 'templates'],
    queryFn: async (): Promise<Pick<ItemRow, 'id' | 'title'>[]> => {
      const { data } = await supabase
        .from('items')
        .select('id, title')
        .eq('type', 'note')
        .eq('subtype', 'template')
        .eq('is_trashed', false)
        .order('title', { ascending: true });
      return (data ?? []) as Pick<ItemRow, 'id' | 'title'>[];
    },
    staleTime: 60_000,
    enabled: open,
  });

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
            No templates yet. Create a note and set its subtype to "template" in the frontmatter.
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
