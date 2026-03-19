import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigationActions } from '@/components/providers';
import { useAreas, useAreasByStatus } from '../hooks/useAreas';
import type { AreaItem } from '../types';
import { CreateDocSheet } from '../create/CreateDocSheet';
import { ViewShell, viewStyles } from './ViewShell';
import styles from './LifeAreasListView.module.css';

type Props = { onBack: () => void };

const STATUS_LABELS = {
  active: 'Active',
  maintenance: 'Maintenance',
  waiting: 'Waiting',
} as const;

function AreaRow({ area, onClick }: { area: AreaItem; onClick: () => void }) {
  const status = area.item_status as keyof typeof STATUS_LABELS | null;
  return (
    <button type="button" className={viewStyles.row} onClick={onClick}>
      <div className={viewStyles.rowBody}>
        <div className={viewStyles.rowTitle}>{area.title}</div>
        {status && STATUS_LABELS[status] && (
          <div className={viewStyles.rowSubtitle}>{STATUS_LABELS[status]}</div>
        )}
      </div>
      <div className={viewStyles.rowRight}>
        <span className={viewStyles.rowChevron}>›</span>
      </div>
    </button>
  );
}

export function LifeAreasListView({ onBack }: Props) {
  const { pushLayer } = useNavigationActions();
  const { data: areas, isLoading } = useAreas();
  const grouped = useAreasByStatus(areas ?? []);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const navigate = (areaId: string) => {
    pushLayer({ view: 'strategy-detail', strategyId: `document:${areaId}` });
  };

  const addButton = (
    <button
      type="button"
      className={viewStyles.addBtn}
      aria-label="Add life arena"
      onClick={() => setIsCreateOpen(true)}
    >
      +
    </button>
  );

  return (
    <>
    <ViewShell title="Life Arenas" onBack={onBack} rightSlot={addButton}>
      {isLoading && <p className={viewStyles.loadingState}>Loading…</p>}

      {!isLoading && (areas ?? []).length === 0 && (
        <p className={viewStyles.emptyState}>No life arenas yet.</p>
      )}

      {!isLoading && grouped.active.length > 0 && (
        <>
          <div className={viewStyles.sectionLabel}>Active</div>
          {grouped.active.map((area) => (
            <AreaRow key={area.id} area={area} onClick={() => navigate(area.id)} />
          ))}
          <div className={viewStyles.divider} />
        </>
      )}

      {!isLoading && grouped.maintenance.length > 0 && (
        <>
          <div className={viewStyles.sectionLabel}>Maintenance</div>
          {grouped.maintenance.map((area) => (
            <AreaRow key={area.id} area={area} onClick={() => navigate(area.id)} />
          ))}
          <div className={viewStyles.divider} />
        </>
      )}

      {!isLoading && grouped.waiting.length > 0 && (
        <>
          <div className={viewStyles.sectionLabel}>Waiting</div>
          {grouped.waiting.map((area) => (
            <AreaRow key={area.id} area={area} onClick={() => navigate(area.id)} />
          ))}
        </>
      )}
    </ViewShell>

      {typeof document !== 'undefined' &&
        createPortal(
          <CreateDocSheet
            open={isCreateOpen}
            onOpenChange={setIsCreateOpen}
            initialType="area"
            onCreated={(id) => {
              setIsCreateOpen(false);
              navigate(id);
            }}
          />,
          document.body,
        )}
    </>
  );
}
