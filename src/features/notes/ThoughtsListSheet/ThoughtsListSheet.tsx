'use client';

import { useEffect } from 'react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/Sheet';
import { NoteList } from '../NoteList/NoteList';
import styles from './ThoughtsListSheet.module.css';

type ThoughtsListSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const MENU_OFFSET_PX = 48;

export function ThoughtsListSheet({ open, onOpenChange }: ThoughtsListSheetProps) {
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    root.style.setProperty('--thoughts-menu-offset', `${-MENU_OFFSET_PX}px`);
    return () => {
      root.style.setProperty('--thoughts-menu-offset', '0px');
    };
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={styles.sheet}
        overlayClassName={styles.overlay}
        enableGestures
        gestureDismissThreshold={0.3}
        gestureEdgeExclusion={48}
        onDragProgress={(value) => {
          const nextOffset = Math.min(0, -MENU_OFFSET_PX + value);
          document.documentElement.style.setProperty(
            '--thoughts-menu-offset',
            `${nextOffset}px`
          );
        }}
        onDismiss={() => onOpenChange(false)}
        aria-label="Notes list"
      >
        <SheetTitle className="sr-only">Notes list</SheetTitle>
        <div className={styles.content}>
          <NoteList />
        </div>
      </SheetContent>
    </Sheet>
  );
}
