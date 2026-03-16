/**
 * useNavigation Hook
 *
 * Stack-based navigation synced to the browser URL.
 *
 * - pushLayer  → history.pushState with real path (adds history entry)
 * - goBack     → dispatches state update + history.replaceState (never history.back())
 * - popstate   → restores state from current URL (browser back/forward button)
 * - on mount   → restores state from URL so deep links work
 */

import { useReducer, useEffect, useCallback } from 'react';
import {
  navigationReducer,
  navigationActions,
} from '@/lib/navigation/reducer';
import type { NavigationLayer } from '@/lib/navigation/types';
import { initialNavigationState } from '@/lib/navigation/types';
import { layerToPath, pathToLayer } from '@/lib/navigation/paths';

export function useNavigation() {
  const [state, dispatch] = useReducer(
    navigationReducer,
    initialNavigationState
  );

  // On mount: restore navigation state from the current URL (supports deep links).
  useEffect(() => {
    const layer = pathToLayer(window.location.pathname);
    if (layer) {
      dispatch(navigationActions.restoreState({ stack: [layer] }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Browser back / forward button — read the URL and restore matching state.
  useEffect(() => {
    const handlePopState = () => {
      const layer = pathToLayer(window.location.pathname);
      dispatch(navigationActions.restoreState({ stack: layer ? [layer] : [] }));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const pushLayer = useCallback((layer: NavigationLayer) => {
    dispatch(navigationActions.pushLayer(layer));
    window.history.pushState(null, '', layerToPath(layer));
  }, []);

  const _goBackOrPop = useCallback(
    (actionType: 'GO_BACK' | 'POP_LAYER') => {
      const action =
        actionType === 'GO_BACK'
          ? navigationActions.goBack()
          : navigationActions.popLayer();

      // Update internal state immediately.
      dispatch(action);

      // Update the URL via replaceState — never call history.back() from the
      // UI button, which would bleed into external browser history and also
      // trigger the popstate handler (causing the wrong note to be restored).
      const newStack = state.stack.slice(0, -1);
      const newTop = newStack[newStack.length - 1];
      window.history.replaceState(null, '', newTop ? layerToPath(newTop) : '/');
    },
    [state.stack]
  );

  const popLayer = useCallback(() => _goBackOrPop('POP_LAYER'), [_goBackOrPop]);
  const goBack = useCallback(() => _goBackOrPop('GO_BACK'), [_goBackOrPop]);

  const resetToNow = useCallback(() => {
    dispatch(navigationActions.resetToNow());
    window.history.pushState(null, '', '/');
  }, []);

  return {
    state,
    actions: {
      pushLayer,
      popLayer,
      goBack,
      resetToNow,
    },
  };
}
