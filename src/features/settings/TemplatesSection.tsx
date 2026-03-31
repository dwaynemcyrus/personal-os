import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigationActions } from '@/components/providers';
import { showToast } from '@/components/ui/Toast';
import { queryClient } from '@/lib/queryClient';
import {
  DEFAULT_TEMPLATES,
  TEMPLATE_TYPE_LABELS,
  TEMPLATE_TYPE_ORDER,
  seedDefaultTemplates,
  splitTemplateKey,
} from '@/lib/templateSeed';
import { fetchAllDocumentTemplates } from '@/hooks/useDocumentTemplate';
import styles from './SettingsPage.module.css';

export function TemplatesSection() {
  const { pushLayer } = useNavigationActions();
  const [isSeeding, setIsSeeding] = useState(false);
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['document-templates'],
    queryFn: fetchAllDocumentTemplates,
    staleTime: 60_000,
  });

  const templateMap = new Map(templates.map((template) => [template.subtype, template]));

  const handleSeedDefaults = async () => {
    if (isSeeding) return;

    setIsSeeding(true);
    try {
      const inserted = await seedDefaultTemplates();
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      queryClient.invalidateQueries({ queryKey: ['document-template'] });
      showToast(inserted > 0 ? `Added ${inserted} templates.` : 'All templates already seeded.');
    } catch {
      showToast('Could not seed templates — please try again.');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.sectionLabel}>Templates</div>

      {TEMPLATE_TYPE_ORDER.map((type) => {
        const group = DEFAULT_TEMPLATES.filter((template) => splitTemplateKey(template.subtype)[0] === type);
        if (group.length === 0) return null;

        return (
          <div key={type} className={styles.templateGroup}>
            <div className={styles.templateGroupLabel}>{TEMPLATE_TYPE_LABELS[type]}</div>
            <div className={styles.templateGroupRows}>
              {group.map((template) => {
                const existing = templateMap.get(template.subtype) ?? null;
                const metaLabel = isLoading ? 'Loading…' : existing?.id ? 'Edit' : 'Not seeded';
                const isDisabled = isLoading || !existing?.id;

                return (
                  <button
                    key={template.subtype}
                    type="button"
                    className={styles.templateItem}
                    onClick={() => {
                      if (!existing?.id) return;
                      pushLayer({ view: 'document-detail', documentId: existing.id });
                    }}
                    disabled={isDisabled}
                  >
                    <span className={styles.templateItemLabel}>{template.title}</span>
                    <span className={`${styles.templateItemMeta} ${isDisabled ? styles.templateItemMetaDim : ''}`}>
                      {metaLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <button
        type="button"
        className={styles.seedButton}
        onClick={() => void handleSeedDefaults()}
        disabled={isSeeding}
        aria-busy={isSeeding}
      >
        {isSeeding ? 'Seeding…' : 'Seed Defaults'}
      </button>

      {isLoading && <p className={styles.templateHint}>Loading templates…</p>}
      {!isLoading && <p className={styles.templateHint}>Template rows open in the existing document editor.</p>}
    </section>
  );
}
