'use client';

import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useRef } from 'react';
import { useSwipeBack } from '@/hooks/useSwipeBack';
import styles from './NotesMobileShell.module.css';

function getDepth(pathname: string): number {
  // /notes → 0, /notes/all → 1, /notes/all/noteId → 2
  const parts = pathname.replace(/^\/notes\/?/, '').split('/').filter(Boolean);
  return parts.length;
}

const SPRING = { type: 'spring', stiffness: 300, damping: 30 } as const;

type NotesMobileShellProps = {
  children: React.ReactNode;
};

export function NotesMobileShell({ children }: NotesMobileShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const prevDepthRef = useRef(getDepth(pathname));
  const currentDepth = getDepth(pathname);
  const isForward = currentDepth >= prevDepthRef.current;
  prevDepthRef.current = currentDepth;

  useSwipeBack({ onBack: () => router.back() });

  // Forward: enter from right (x: 100% → 0), exit to left (x: 0 → -30%)
  // Backward: enter from left (x: -30% → 0), exit to right (x: 0 → 100%)
  const variants = {
    enter: (forward: boolean) => ({
      x: forward ? '100%' : '-30%',
    }),
    center: { x: '0%' },
    exit: (forward: boolean) => ({
      x: forward ? '-30%' : '100%',
    }),
  };

  return (
    <div className={styles.shell}>
      <AnimatePresence initial={false} custom={isForward} mode="popLayout">
        <motion.div
          key={pathname}
          className={styles.page}
          custom={isForward}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={SPRING}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
