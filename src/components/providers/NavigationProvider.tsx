/**
 * NavigationProvider
 *
 * React Context wrapper for navigation state and actions.
 * Provides access to navigation from any component.
 */

'use client';

import React, { createContext, useContext, type ReactNode } from 'react';
import { useNavigation } from '@/hooks/useNavigation';
import type { NavigationState, NavigationLayer, NavigationContext } from '@/lib/navigation/types';

interface NavigationContextValue {
  state: NavigationState;
  actions: {
    pushLayer: (layer: NavigationLayer) => void;
    popLayer: () => void;
    switchContext: (context: NavigationContext) => void;
    goBack: () => void;
    resetToToday: () => void;
  };
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const navigation = useNavigation();

  return (
    <NavigationContext.Provider value={navigation}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigationState(): NavigationState {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigationState must be used within NavigationProvider');
  }
  return context.state;
}

export function useNavigationActions() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigationActions must be used within NavigationProvider');
  }
  return context.actions;
}
