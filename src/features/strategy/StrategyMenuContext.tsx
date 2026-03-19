import { createContext, useContext } from 'react';

type StrategyMenuContextValue = {
  openMenu: () => void;
};

export const StrategyMenuContext = createContext<StrategyMenuContextValue | null>(null);

export function useStrategyMenu(): StrategyMenuContextValue | null {
  return useContext(StrategyMenuContext);
}
