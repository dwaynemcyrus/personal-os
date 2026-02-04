/**
 * NoteDetailSheet
 *
 * Sheet wrapper for NoteEditor, used in SPA navigation stack.
 */

'use client';

import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { NoteEditor } from '../NoteEditor/NoteEditor';
import styles from './NoteDetailSheet.module.css';

interface NoteDetailSheetProps {
  noteId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zIndex?: number;
}

export function NoteDetailSheet({
  noteId,
  open,
  onOpenChange,
  zIndex,
}: NoteDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={styles.sheet}
        zIndex={zIndex}
        enableGestures
        gestureDismissThreshold={0.3}
        gestureEdgeExclusion={48}
        onDismiss={() => onOpenChange(false)}
        aria-label="Note editor"
      >
        <NoteEditor
          noteId={noteId}
          onClose={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
