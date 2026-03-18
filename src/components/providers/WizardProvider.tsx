import { createContext, useCallback, useContext, useEffect, useId, useState } from 'react';

type WizardContextValue = {
  register: (id: string, open: boolean) => void;
  anyOpen: boolean;
};

const WizardContext = createContext<WizardContextValue>({
  register: () => {},
  anyOpen: false,
});

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const register = useCallback((id: string, open: boolean) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (open) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  return (
    <WizardContext.Provider value={{ register, anyOpen: openIds.size > 0 }}>
      {children}
    </WizardContext.Provider>
  );
}

/** Returns true when any wizard is currently open. Used by FAB to hide itself. */
export function useAnyWizardOpen(): boolean {
  return useContext(WizardContext).anyOpen;
}

/** Call this at the top of any wizard component. Registers it with the global wizard tracker. */
export function useRegisterWizard(open: boolean): void {
  const id = useId();
  const { register } = useContext(WizardContext);

  useEffect(() => {
    register(id, open);
    return () => register(id, false);
  }, [id, open, register]);
}
