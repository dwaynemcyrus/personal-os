/**
 * SheetManager
 *
 * Maps navigation stack to rendered sheet layers with correct z-indexing.
 * Each layer type renders its corresponding sheet component.
 */

'use client';

import { useNavigationState, useNavigationActions } from '@/components/providers';
import { NoteDetailSheet } from '@/features/notes/NoteDetailSheet/NoteDetailSheet';
import { ThoughtsListSheet } from '@/features/notes/ThoughtsListSheet/ThoughtsListSheet';
import { ThoughtsMenuSheet } from '@/features/notes/ThoughtsMenuSheet/ThoughtsMenuSheet';

export function SheetManager() {
  const { stack } = useNavigationState();
  const { popLayer, pushLayer } = useNavigationActions();
  const hasThoughtsList = stack.some((layer) => layer.view === 'thoughts-list');

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

          case 'thoughts-menu':
            return (
              <ThoughtsMenuSheet
                key={`thoughts-menu-${index}`}
                open
                isNotesActive={hasThoughtsList}
                onOpenChange={(open) => {
                  if (!open) popLayer();
                }}
                onOpenNotes={() => {
                  if (!hasThoughtsList) {
                    pushLayer({ view: 'thoughts-list' });
                  }
                }}
              />
            );

          case 'thoughts-list':
            return (
              <ThoughtsListSheet
                key={`thoughts-list-${index}`}
                open
                onOpenChange={(open) => {
                  if (!open) popLayer();
                }}
              />
            );

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
              />
            );

          case 'thoughts-note':
            return (
              <NoteDetailSheet
                key={`thoughts-note-${layer.noteId}-${index}`}
                noteId={layer.noteId}
                open
                onOpenChange={(open) => {
                  if (!open) popLayer();
                }}
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
