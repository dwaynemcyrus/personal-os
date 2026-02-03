/**
 * useNavigation Hook
 *
 * Main navigation hook with localStorage persistence and browser history integration.
 * Pattern based on useTimer: init from storage, sync on change, SSR-safe.
 */

'use client';

import { useReducer, useEffect, useCallback } from 'react';
import {
  navigationReducer,
  navigationActions,
} from '@/lib/navigation/reducer';
import type { NavigationState, NavigationLayer, NavigationContext } from '@/lib/navigation/types';
import { initialNavigationState } from '@/lib/navigation/types';

const STORAGE_KEY = 'personal-os-navigation-state';

function loadNavigationState(): NavigationState {
  if (typeof window === 'undefined') {
    return initialNavigationState;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return initialNavigationState;
    }

    const parsed = JSON.parse(stored) as NavigationState;
    // Validate basic structure
    if (parsed.context && Array.isArray(parsed.stack)) {
      return parsed;
    }
    return initialNavigationState;
  } catch (error) {
    console.error('Failed to load navigation state:', error);
    return initialNavigationState;
  }
}

function saveNavigationState(state: NavigationState): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save navigation state:', error);
  }
}

export function useNavigation() {
  const [state, dispatch] = useReducer(
    navigationReducer,
    initialNavigationState,
    loadNavigationState
  );

  // Persist to localStorage on state change
  useEffect(() => {
    saveNavigationState(state);
  }, [state]);

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
