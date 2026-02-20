/**
 * SheetManager
 *
 * Maps navigation stack to rendered sheet layers.
 * Extend this as new sheet-based views are added.
 */

import { useNavigationState } from '@/components/providers';

export function SheetManager() {
  const { stack } = useNavigationState();

  return (
    <>
      {stack.map((layer) => {
        switch (layer.view) {
          case 'task-detail':
          case 'plan-detail':
            // TODO: implement detail sheets
            return null;
          default:
            return null;
        }
      })}
    </>
  );
}
