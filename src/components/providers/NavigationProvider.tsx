/**
 * NavigationProvider
 *
 * React Context wrapper for navigation state and actions.
 * Provides access to navigation from any component.
 */

'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { useNavigation } from '@/hooks/useNavigation';
import type { NavigationState, NavigationLayer, NavigationContext } from '@/lib/navigation/types';

interface NavigationContextValue {
  state: NavigationState;
  readerMode: boolean;
  actions: {
    pushLayer: (layer: NavigationLayer) => void;
    popLayer: () => void;
    switchContext: (context: NavigationContext) => void;
    goBack: () => void;
    resetToToday: () => void;
    setReaderMode: (nextValue: boolean) => void;
    toggleReaderMode: () => void;
  };
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const navigation = useNavigation();
  const [readerMode, setReaderMode] = useState(false);
  const toggleReaderMode = useCallback(() => {
    setReaderMode((prev) => !prev);
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        state: navigation.state,
        readerMode,
        actions: {
          ...navigation.actions,
          setReaderMode,
          toggleReaderMode,
        },
      }}
    >
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

export function useReaderMode() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useReaderMode must be used within NavigationProvider');
  }
  return {
    readerMode: context.readerMode,
    setReaderMode: context.actions.setReaderMode,
    toggleReaderMode: context.actions.toggleReaderMode,
  };
}
