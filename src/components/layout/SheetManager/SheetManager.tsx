/**
 * SheetManager
 *
 * Maps navigation stack to rendered sheet layers with correct z-indexing.
 * Each layer type renders its corresponding sheet component.
 */

'use client';

import { useNavigationState, useNavigationActions } from '@/components/providers';
import { NoteDetailSheet } from '@/features/notes/NoteDetailSheet/NoteDetailSheet';

export function SheetManager() {
  const { stack } = useNavigationState();
  const { popLayer } = useNavigationActions();

  return (
    <>
      {stack.map((layer, index) => {
        const zIndex = 100 + index * 100;

        switch (layer.view) {
          case 'execution-tasks':
            // TODO: Implement TaskListSheet
            return null;

          case 'execution-projects':
            // TODO: Implement ProjectListSheet
            return null;

          case 'knowledge-notes':
            // TODO: Implement NoteListSheet
            return null;

          case 'task-detail':
            // TODO: Implement TaskDetailSheet
            return null;

          case 'note-detail':
            return (
              <NoteDetailSheet
                key={`note-${layer.noteId}-${index}`}
                noteId={layer.noteId}
                open
                onOpenChange={(open) => {
                  if (!open) popLayer();
                }}
                zIndex={zIndex}
              />
            );

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
