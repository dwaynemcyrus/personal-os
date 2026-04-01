import { useQuery } from '@tanstack/react-query';
import { useNavigationActions } from '@/components/providers';
import {
  DEFAULT_TEMPLATES,
  TEMPLATE_TYPE_LABELS,
  TEMPLATE_TYPE_ORDER,
  getTemplateLookupKey,
  splitTemplateKey,
} from '@/lib/templateSeed';
import { fetchAllDocumentTemplates } from '@/hooks/useDocumentTemplate';
import styles from './SettingsPage.module.css';

export function TemplatesSection() {
  const { pushLayer } = useNavigationActions();
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['document-templates'],
    queryFn: fetchAllDocumentTemplates,
    staleTime: 60_000,
  });

  const templateMap = new Map(
    templates.map((template) => [getTemplateLookupKey(template.type, template.subtype), template])
  );

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
                const metaLabel = isLoading ? 'Loading…' : existing?.id ? 'Edit' : 'Missing';
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

      {isLoading && <p className={styles.templateHint}>Loading templates…</p>}
      {!isLoading && (
        <p className={styles.templateHint}>
          Template rows are provisioned from the schema migration and open in the existing document editor.
        </p>
      )}
    </section>
  );
}
