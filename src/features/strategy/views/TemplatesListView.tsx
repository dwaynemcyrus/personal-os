import { useNavigationActions } from '@/components/providers';
import { useStrategyTemplates } from '../hooks/useStrategyTemplates';
import { ViewShell, viewStyles } from './ViewShell';

type Props = { onBack: () => void };

export function TemplatesListView({ onBack }: Props) {
  const { pushLayer } = useNavigationActions();
  const { data: templates, isLoading } = useStrategyTemplates();

  const navigate = (templateId: string) => {
    pushLayer({ view: 'strategy-detail', strategyId: `template:${templateId}` });
  };

  return (
    <ViewShell title="Templates" onBack={onBack}>
      {isLoading && <p className={viewStyles.loadingState}>Loading…</p>}

      {!isLoading && (
        <>
          <div className={viewStyles.sectionLabel}>Strategy Document Templates</div>
          {(templates ?? []).map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              className={viewStyles.row}
              onClick={() => navigate(tpl.id)}
            >
              <div className={viewStyles.rowBody}>
                <div className={viewStyles.rowTitle}>{tpl.title}</div>
              </div>
              <div className={viewStyles.rowRight}>
                <span className={viewStyles.rowChevron}>›</span>
              </div>
            </button>
          ))}
        </>
      )}
    </ViewShell>
  );
}
