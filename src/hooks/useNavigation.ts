/**
 * useNavigation Hook
 *
 * Main navigation hook with browser history integration.
 * Always starts at the home (today) context on page load.
 */

'use client';

import { useReducer, useEffect, useCallback } from 'react';
import {
  navigationReducer,
  navigationActions,
} from '@/lib/navigation/reducer';
import type { NavigationLayer, NavigationContext } from '@/lib/navigation/types';
import { initialNavigationState } from '@/lib/navigation/types';

export function useNavigation() {
  const [state, dispatch] = useReducer(
    navigationReducer,
    initialNavigationState
  );

  // Browser history integration
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handlePopState = () => {
      dispatch(navigationActions.goBack());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Wrapped action creators
  const pushLayer = useCallback((layer: NavigationLayer) => {
    dispatch(navigationActions.pushLayer(layer));

    // Push to browser history
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '');
    }
  }, []);

  const popLayer = useCallback(() => {
    dispatch(navigationActions.popLayer());
  }, []);

  const switchContext = useCallback((context: NavigationContext) => {
    dispatch(navigationActions.switchContext(context));
  }, []);

  const goBack = useCallback(() => {
    dispatch(navigationActions.goBack());
  }, []);

  const resetToToday = useCallback(() => {
    dispatch(navigationActions.resetToToday());
  }, []);

  return {
    state,
    actions: {
      pushLayer,
      popLayer,
      switchContext,
      goBack,
      resetToToday,
    },
  };
}
