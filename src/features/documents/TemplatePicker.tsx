import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAllDocumentTemplates } from '@/hooks/useDocumentTemplate';
import {
  TEMPLATE_TYPE_LABELS,
  TEMPLATE_TYPE_ORDER,
  splitTemplateKey,
} from '@/lib/templateSeed';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import styles from './TemplatePicker.module.css';

export type TemplateOption = {
  label: string;
  type: string;
  subtype: string | null;
  content: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (template: TemplateOption) => void;
};

export function TemplatePicker({ open, onOpenChange, onSelect }: Props) {
  const { data: storedTemplates = [] } = useQuery({
    queryKey: ['document-templates'],
    queryFn: fetchAllDocumentTemplates,
    staleTime: 60_000,
    enabled: open,
  });

  const groupedTemplates = useMemo(() => {
    const grouped = new Map<string, TemplateOption[]>();

    for (const template of storedTemplates) {
      if (!template.subtype) continue;
      const [type, subtype] = splitTemplateKey(template.subtype);
      const next = grouped.get(type) ?? [];
      next.push({
        label: template.title ?? template.subtype,
        type,
        subtype,
        content: template.content ?? '',
      });
      grouped.set(type, next);
    }

    const orderedTypes = [
      ...TEMPLATE_TYPE_ORDER.filter((type) => grouped.has(type)),
      ...Array.from(grouped.keys()).filter((type) => !TEMPLATE_TYPE_ORDER.includes(type as typeof TEMPLATE_TYPE_ORDER[number])).sort(),
    ];

    return orderedTypes.map((type) => ({
      type,
      label: TEMPLATE_TYPE_LABELS[type as keyof typeof TEMPLATE_TYPE_LABELS] ?? type,
      templates: (grouped.get(type) ?? []).sort((a, b) => a.label.localeCompare(b.label)),
    }));
  }, [storedTemplates]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" ariaLabel="Apply template" className={styles.sheet}>
        <div className={styles.header}>
          <span className={styles.title}>Apply Template</span>
          <p className={styles.hint}>Inserts body content. Existing content is replaced.</p>
        </div>
        <div className={styles.list}>
          {groupedTemplates.length === 0 && (
            <p className={styles.empty}>No templates available. Seed or create templates in Settings first.</p>
          )}
          {groupedTemplates.map((group) => (
            <section key={group.type} className={styles.group} aria-label={group.label}>
              <div className={styles.groupLabel}>{group.label}</div>
              <ul className={styles.groupList} role="list">
                {group.templates.map((template) => (
                  <li key={`${template.type}:${template.subtype ?? ''}`}>
                    <button
                      type="button"
                      className={styles.row}
                      onClick={() => {
                        onSelect(template);
                        onOpenChange(false);
                      }}
                    >
                      <span className={styles.rowLabel}>{template.label}</span>
                      <span className={styles.rowMeta}>
                        {template.type}
                        {template.subtype ? `:${template.subtype}` : ''}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
