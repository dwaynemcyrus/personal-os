/**
 * useNavigation Hook
 *
 * Stack-based navigation synced to the browser URL.
 *
 * - pushLayer  → history.pushState with real path (adds history entry)
 * - goBack     → speculative dispatch for instant UI update + history.back()
 *               for correct URL; popstate handler is suppressed for that call
 * - popstate   → restores state from current URL (browser back/forward)
 * - on mount   → restores state from URL so deep links work
 */

import { useReducer, useEffect, useCallback, useRef } from 'react';
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

  // Prevents the popstate handler from double-dispatching when the UI
  // back button calls history.back() after an optimistic dispatch.
  const suppressNextPopState = useRef(false);

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
      if (suppressNextPopState.current) {
        suppressNextPopState.current = false;
        return;
      }
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

      // Optimistic state update so the UI responds instantly.
      dispatch(action);

      if (window.history.length > 1) {
        // Let the browser navigate back — URL will be correct.
        suppressNextPopState.current = true;
        window.history.back();
      } else {
        // Deep-link entry: no prior history, update URL via replaceState.
        const newStack = state.stack.slice(0, -1);
        const newTop = newStack[newStack.length - 1];
        window.history.replaceState(null, '', newTop ? layerToPath(newTop) : '/');
      }
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
