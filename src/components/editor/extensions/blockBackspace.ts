import { Compartment } from '@codemirror/state';
import type { Extension } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import type { Command } from '@codemirror/view';
import { getLineBlock } from './gutterIcons';

/**
 * Bear-style backspace: when the cursor is at the content-start of a block
 * line (right after the atomic mark decoration), pressing Backspace strips
 * the block mark and leaves plain text rather than merging with the previous
 * line.
 */
const bearBackspace: Command = (view) => {
  const { state } = view;
  const sel = state.selection.main;

  // Only act on a single cursor with no selection
  if (!sel.empty) return false;

  const line = state.doc.lineAt(sel.from);
  const block = getLineBlock(state, line.from);
  if (!block || block.marks.length === 0) return false;

  const firstMark = block.marks[0];
  const lastMark  = block.marks[block.marks.length - 1];

  // Cursor must be at line start OR immediately after the last mark char
  // (both positions appear at the same visual location in rendered mode)
  if (sel.from !== line.from && sel.from !== lastMark.to) return false;

  // Delete from start of first mark to end of last mark
  view.dispatch({
    changes: { from: firstMark.from, to: lastMark.to, insert: '' },
    scrollIntoView: true,
  });

  return true;
};

export const blockBackspaceCompartment = new Compartment();

/** Inner extension — pass to blockBackspaceCompartment.of() or .reconfigure(). */
export function blockBackspaceExtension(): Extension {
  return keymap.of([{ key: 'Backspace', run: bearBackspace }]);
}
