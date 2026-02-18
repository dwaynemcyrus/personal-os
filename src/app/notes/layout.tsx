'use client';

import { useEffect, useState } from 'react';
import { NotesMobileShell } from '@/features/notes/NotesShell/NotesMobileShell';
import { NotesDesktopShell } from '@/features/notes/NotesShell/NotesDesktopShell';

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isDesktop;
}

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return <NotesDesktopShell>{children}</NotesDesktopShell>;
  }

  return <NotesMobileShell>{children}</NotesMobileShell>;
}
