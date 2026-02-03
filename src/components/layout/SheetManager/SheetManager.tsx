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
  // popLayer will be used in Phase 4 when sheets are implemented
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { popLayer } = useNavigationActions();

  return (
    <>
      {stack.map((layer, index) => {
        // zIndex will be used in Phase 4 when sheets are implemented
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const zIndex = 100 + index * 100;

        switch (layer.view) {
          case 'execution-tasks':
            // TODO: Implement TaskListSheet in Phase 4
            return null;

          case 'execution-projects':
            // TODO: Implement ProjectListSheet in Phase 4
            return null;

          case 'knowledge-notes':
            // TODO: Implement NoteListSheet in Phase 4
            return null;

          case 'task-detail':
            // TODO: Implement TaskDetailSheet in Phase 4
            return null;

          case 'note-detail':
            // TODO: Implement NoteDetailSheet in Phase 4
            return null;

          case 'project-detail':
            // TODO: Implement ProjectDetailSheet in Phase 4
            return null;

          case 'context-picker':
            // Context picker is handled separately in AppShell
            return null;

          case 'command-center':
            // Command center is handled separately in AppShell
            return null;

          default:
            return null;
        }
      })}
    </>
  );
}
