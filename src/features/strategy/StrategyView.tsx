import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigationState, useNavigationActions } from '@/components/providers';
import { StrategyDetailRouter } from './StrategyDetailRouter';
import { SetupWizard } from './wizard/SetupWizard';
import { CreateDocSheet } from './create/CreateDocSheet';
import { StrategyMenuSheet } from './menu/StrategyMenuSheet';
import { StrategyMenuContext } from './StrategyMenuContext';
import type { DocType } from './create/CreateDocSheet';

export function StrategyView() {
  const { stack } = useNavigationState();
  const { pushLayer } = useNavigationActions();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [createInitialType, setCreateInitialType] = useState<DocType | undefined>(undefined);

  const topLayer = stack[stack.length - 1];

  const menuCtxValue = useMemo(
    () => ({ openMenu: () => setIsMenuOpen(true) }),
    []
  );

  if (topLayer?.view !== 'strategy-detail') return null;

  return (
    <StrategyMenuContext.Provider value={menuCtxValue}>
      <StrategyDetailRouter strategyId={topLayer.strategyId} />

      {typeof document !== 'undefined' &&
        createPortal(
          <SetupWizard open={isWizardOpen} onOpenChange={setIsWizardOpen} />,
          document.body,
        )}

      {typeof document !== 'undefined' &&
        createPortal(
          <CreateDocSheet
            open={isCreateOpen}
            onOpenChange={(open) => {
              setIsCreateOpen(open);
              if (!open) setCreateInitialType(undefined);
            }}
            initialType={createInitialType}
          />,
          document.body,
        )}

      {typeof document !== 'undefined' &&
        createPortal(
          <StrategyMenuSheet
            open={isMenuOpen}
            onOpenChange={setIsMenuOpen}
            onWizard={() => setIsWizardOpen(true)}
            onCreate={(type) => {
              setCreateInitialType(type);
              setIsCreateOpen(true);
            }}
            onTemplates={() => pushLayer({ view: 'strategy-detail', strategyId: 'templates' })}
          />,
          document.body,
        )}
    </StrategyMenuContext.Provider>
  );
}
