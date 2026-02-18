/**
 * Navigation Types
 *
 * Core type definitions for the SPA navigation state machine.
 */

export type NavigationContext = 'today' | 'execution' | 'thoughts' | 'strategy';

export type NavigationLayer =
  | { view: 'execution-tasks' }
  | { view: 'execution-projects' }
  | { view: 'task-detail'; taskId: string }
  | { view: 'project-detail'; projectId: string }
  | { view: 'context-picker' }
  | { view: 'command-center' }
  | { view: 'inbox-wizard' };

export interface NavigationState {
  context: NavigationContext;
  stack: NavigationLayer[];
}

export type NavigationAction =
  | { type: 'PUSH_LAYER'; layer: NavigationLayer }
  | { type: 'POP_LAYER' }
  | { type: 'SWITCH_CONTEXT'; context: NavigationContext }
  | { type: 'GO_BACK' }
  | { type: 'RESET_TO_TODAY' }
  | { type: 'RESTORE_STATE'; state: NavigationState };

export const initialNavigationState: NavigationState = {
  context: 'today',
  stack: [],
};
