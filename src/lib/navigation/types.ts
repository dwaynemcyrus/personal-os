/**
 * Navigation Types
 *
 * Core type definitions for the SPA navigation state machine.
 */

export type NavigationLayer =
  | { view: 'notes-list'; group: 'all' | 'pinned' | 'today' | 'locked' | 'todo' | 'trash' }
  | { view: 'note-detail'; noteId: string }
  | { view: 'tasks-list' }
  | { view: 'task-detail'; taskId: string }
  | { view: 'plans-list' }
  | { view: 'plan-detail'; planId: string };

export interface NavigationState {
  stack: NavigationLayer[];
}

export type NavigationAction =
  | { type: 'PUSH_LAYER'; layer: NavigationLayer }
  | { type: 'POP_LAYER' }
  | { type: 'GO_BACK' }
  | { type: 'RESET_TO_NOW' }
  | { type: 'RESTORE_STATE'; state: NavigationState };

export const initialNavigationState: NavigationState = {
  stack: [],
};
