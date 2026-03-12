import { createContext, useContext, type ReactNode } from 'react';

export type HeaderSlot = { right?: ReactNode };

export const HeaderSlotCtx = createContext<{
  setSlot: (s: HeaderSlot) => void;
}>({ setSlot: () => {} });

export const useHeaderSlot = () => useContext(HeaderSlotCtx);
