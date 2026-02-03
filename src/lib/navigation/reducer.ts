/**
 * Navigation Reducer
 *
 * State machine for SPA navigation with stack-based sheet management.
 * Critical behavior: Context switches clear the stack.
 */

import type {
  NavigationState,
  NavigationAction,
  NavigationLayer,
  NavigationContext,
} from './types';
import { initialNavigationState } from './types';

export function navigationReducer(
  state: NavigationState,
  action: NavigationAction
): NavigationState {
  switch (action.type) {
    case 'PUSH_LAYER':
      return {
        ...state,
        stack: [...state.stack, action.layer],
      };

    case 'POP_LAYER':
      if (state.stack.length === 0) {
        return state;
      }
      return {
        ...state,
        stack: state.stack.slice(0, -1),
      };

    case 'SWITCH_CONTEXT':
      // Critical: Context switch clears the stack
      return {
        context: action.context,
        stack: [],
      };

    case 'GO_BACK':
      // Same as POP_LAYER, provided for semantic clarity
      if (state.stack.length === 0) {
        return state;
      }
      return {
        ...state,
        stack: state.stack.slice(0, -1),
      };

    case 'RESET_TO_TODAY':
      return initialNavigationState;

    case 'RESTORE_STATE':
      return action.state;

    default:
      return state;
  }
}

// Action creators for convenience
export const navigationActions = {
  pushLayer: (layer: NavigationLayer): NavigationAction => ({
    type: 'PUSH_LAYER',
    layer,
  }),

  popLayer: (): NavigationAction => ({
    type: 'POP_LAYER',
  }),

  switchContext: (context: NavigationContext): NavigationAction => ({
    type: 'SWITCH_CONTEXT',
    context,
  }),

  goBack: (): NavigationAction => ({
    type: 'GO_BACK',
  }),

  resetToToday: (): NavigationAction => ({
    type: 'RESET_TO_TODAY',
  }),

  restoreState: (state: NavigationState): NavigationAction => ({
    type: 'RESTORE_STATE',
    state,
  }),
};
