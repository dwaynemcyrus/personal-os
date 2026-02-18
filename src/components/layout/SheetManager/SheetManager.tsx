/**
 * SheetManager
 *
 * Maps navigation stack to rendered sheet layers with correct z-indexing.
 * Each layer type renders its corresponding sheet component.
 */

'use client';

import { useNavigationState, useNavigationActions } from '@/components/providers';

export function SheetManager() {
  const { stack } = useNavigationState();
  const { popLayer } = useNavigationActions();

  return (
    <>
      {stack.map((layer, index) => {
        switch (layer.view) {
          case 'execution-tasks':
            // TODO: Implement TaskListSheet
            return null;

          case 'execution-projects':
            // TODO: Implement ProjectListSheet
            return null;

          case 'task-detail':
            // TODO: Implement TaskDetailSheet
            return null;

          case 'project-detail':
            // TODO: Implement ProjectDetailSheet
            return null;

          case 'context-picker':
            // Context picker is handled separately in AppShell
            return null;

          case 'command-center':
            // Command center is handled separately in AppShell
            return null;

          case 'inbox-wizard':
            // Inbox wizard is handled separately in AppShell
            return null;

          default:
            return null;
        }
      })}
    </>
  );
}
