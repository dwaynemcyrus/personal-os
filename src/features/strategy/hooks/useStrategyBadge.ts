import { useTransitionState } from './useTransitionState';

/** Returns true when a cycle transition is due — used to show the Plans tab badge. */
export function useStrategyBadge(): boolean {
  const { isDue } = useTransitionState();
  return isDue;
}
