'use client';

import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { NoteList } from '../NoteList/NoteList';
import styles from './ThoughtsListSheet.module.css';

type ThoughtsListSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ThoughtsListSheet({ open, onOpenChange }: ThoughtsListSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={styles.sheet}
        overlayClassName={styles.overlay}
        enableGestures
        gestureDismissThreshold={0.3}
        gestureEdgeExclusion={48}
        onDismiss={() => onOpenChange(false)}
        aria-label="Notes list"
      >
        <div className={styles.content}>
          <NoteList />
        </div>
      </SheetContent>
    </Sheet>
  );
}
