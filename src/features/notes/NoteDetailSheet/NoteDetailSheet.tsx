/**
 * NoteDetailSheet
 *
 * Sheet wrapper for NoteEditor, used in SPA navigation stack.
 */

'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/Sheet';
import { NoteEditor } from '../NoteEditor/NoteEditor';
import styles from './NoteDetailSheet.module.css';

interface NoteDetailSheetProps {
  noteId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NoteDetailSheet({
  noteId,
  open,
  onOpenChange,
}: NoteDetailSheetProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const closeInProgressRef = useRef(false);

  useEffect(() => {
    if (open) {
      closeInProgressRef.current = false;
    }
  }, [open]);

  const handleCloseWithSwipe = useCallback(() => {
    if (closeInProgressRef.current) return;
    const node = contentRef.current;
    if (!node) {
      onOpenChange(false);
      return;
    }

    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      onOpenChange(false);
      return;
    }

    const width = node.getBoundingClientRect().width;
    if (!Number.isFinite(width) || width <= 0 || typeof node.animate !== 'function') {
      onOpenChange(false);
      return;
    }

    closeInProgressRef.current = true;
    const animation = node.animate(
      [
        { transform: 'translateX(0px)' },
        { transform: `translateX(${width}px)` },
      ],
      {
        duration: 220,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        fill: 'forwards',
      }
    );

    const finalize = () => {
      onOpenChange(false);
    };

    animation.addEventListener('finish', finalize, { once: true });
    animation.addEventListener('cancel', finalize, { once: true });
  }, [onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={styles.sheet}
        overlayClassName={styles.overlay}
        ref={contentRef}
        enableGestures
        gestureDismissThreshold={0.3}
        gestureEdgeExclusion={48}
        onDismiss={() => onOpenChange(false)}
      >
        <SheetTitle className={styles.visuallyHidden}>Note editor</SheetTitle>
        <NoteEditor
          noteId={noteId}
          onClose={handleCloseWithSwipe}
        />
      </SheetContent>
    </Sheet>
  );
}
