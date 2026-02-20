/**
 * useNavigation Hook
 *
 * Main navigation hook. Always starts at Now (empty stack) on page load.
 */

import { useReducer, useEffect, useCallback } from 'react';
import {
  navigationReducer,
  navigationActions,
} from '@/lib/navigation/reducer';
import type { NavigationLayer } from '@/lib/navigation/types';
import { initialNavigationState } from '@/lib/navigation/types';

export function useNavigation() {
  const [state, dispatch] = useReducer(
    navigationReducer,
    initialNavigationState
  );

  // Browser history integration — back button pops a layer
  useEffect(() => {
    const handlePopState = () => {
      dispatch(navigationActions.goBack());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const pushLayer = useCallback((layer: NavigationLayer) => {
    dispatch(navigationActions.pushLayer(layer));
    window.history.pushState({}, '');
  }, []);

  const popLayer = useCallback(() => {
    dispatch(navigationActions.popLayer());
  }, []);

  const goBack = useCallback(() => {
    dispatch(navigationActions.goBack());
  }, []);

  const resetToNow = useCallback(() => {
    dispatch(navigationActions.resetToNow());
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
