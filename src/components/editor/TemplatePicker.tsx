

import { useEffect, useMemo, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetClose,
} from '@/components/ui/Sheet';
import { useDatabase } from '@/hooks/useDatabase';
import type { TemplateDocument } from '@/lib/db';
import { replaceTemplateVariables } from '@/lib/templates';
import styles from './TemplatePicker.module.css';

type TemplatePickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (content: string) => void;
  customTitle?: string;
};

const ALL_CATEGORY = 'all';

export function TemplatePicker({
  open,
  onOpenChange,
  onSelect,
  customTitle,
}: TemplatePickerProps) {
  const { db, isReady } = useDatabase();
  const [templates, setTemplates] = useState<TemplateDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY);

  // Load templates
  useEffect(() => {
    if (!db || !isReady) return;

    setIsLoading(true);
    const subscription = db.templates
      .find({
        selector: { is_trashed: false },
        sort: [{ category: 'asc' }, { sort_order: 'asc' }, { title: 'asc' }],
      })
      .$.subscribe((docs) => {
        setTemplates(docs.map((doc) => doc.toJSON() as TemplateDocument));
        setIsLoading(false);
      });

    return () => subscription.unsubscribe();
  }, [db, isReady]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    for (const template of templates) {
      if (template.category) {
        cats.add(template.category);
      }
    }
    return Array.from(cats).sort();
  }, [templates]);

  // Filter templates by category
  const filteredTemplates = useMemo(() => {
    if (selectedCategory === ALL_CATEGORY) {
      return templates;
    }
    return templates.filter((t) => t.category === selectedCategory);
  }, [templates, selectedCategory]);

  const handleSelect = (template: TemplateDocument) => {
    const processedContent = replaceTemplateVariables(template.content, {
      title: customTitle || template.title,
      date: new Date(),
    });
    onSelect(processedContent);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={styles.sheet}
        aria-label="Choose template"
      >
        <header className={styles.header}>
          <SheetTitle className={styles.title}>Templates</SheetTitle>
          <SheetClose asChild>
            <button
              type="button"
              className={styles.close}
              aria-label="Close templates"
            >
              <CloseIcon />
            </button>
          </SheetClose>
        </header>

        {categories.length > 0 && (
          <div className={styles.categories}>
            <button
              type="button"
              className={styles.categoryButton}
              data-active={selectedCategory === ALL_CATEGORY}
              onClick={() => setSelectedCategory(ALL_CATEGORY)}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={styles.categoryButton}
                data-active={selectedCategory === category}
                onClick={() => setSelectedCategory(category)}
              >
                {formatCategoryLabel(category)}
              </button>
            ))}
          </div>
        )}

        <div className={styles.list}>
          {isLoading ? (
            <p className={styles.loading}>Loading templates...</p>
          ) : filteredTemplates.length === 0 ? (
            <p className={styles.empty}>No templates available</p>
          ) : (
            <ul className={styles.templateList}>
              {filteredTemplates.map((template) => (
                <li key={template.id}>
                  <button
                    type="button"
                    className={styles.template}
                    onClick={() => handleSelect(template)}
                  >
                    <span className={styles.templateTitle}>
                      {template.title}
                    </span>
                    {template.description && (
                      <span className={styles.templateDescription}>
                        {template.description}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function formatCategoryLabel(category: string): string {
  return category
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={styles.icon}
    >
      <path d="M6 6l12 12M18 6l-12 12" />
    </svg>
  );
}
