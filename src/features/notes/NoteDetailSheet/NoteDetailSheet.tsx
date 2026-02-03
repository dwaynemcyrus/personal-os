/**
 * NoteDetailSheet
 *
 * Sheet wrapper for NoteEditor, used in SPA navigation stack.
 */

'use client';

import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { NoteEditor } from '../NoteEditor/NoteEditor';

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
        side="bottom"
        zIndex={zIndex}
        enableGestures
        aria-label="Note editor"
      >
        <NoteEditor
          noteId={noteId}
          variant="inline"
          onClose={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
