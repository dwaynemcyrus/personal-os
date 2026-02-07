/**
 * Typewriter Mode CodeMirror Extension
 *
 * Keeps the cursor vertically centered as you type.
 * Text scrolls up, cursor stays in place - like a typewriter.
 */

import { Extension } from '@codemirror/state';
import { EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view';

/**
 * Typewriter mode plugin - scrolls to keep cursor centered
 */
const typewriterPlugin = ViewPlugin.fromClass(
  class {
    private scrollPending = false;

    update(update: ViewUpdate) {
      // Only scroll on doc changes or cursor movement
      if (!update.docChanged && !update.selectionSet) return;
      if (this.scrollPending) return;

      this.scrollPending = true;
      const view = update.view;

      // Schedule scroll after the update cycle completes
      requestAnimationFrame(() => {
        this.scrollPending = false;
        this.centerCursor(view);
      });
    }

    centerCursor(view: EditorView) {
      const selection = view.state.selection.main;

      // Get cursor position in viewport
      const cursorCoords = view.coordsAtPos(selection.head);
      if (!cursorCoords) return;

      // Get viewport dimensions
      const viewportHeight = view.dom.clientHeight;
      const targetY = viewportHeight / 2;

      // Calculate scroll offset to center cursor
      const currentScrollTop = view.scrollDOM.scrollTop;
      const cursorY = cursorCoords.top - view.dom.getBoundingClientRect().top + currentScrollTop;
      const targetScrollTop = cursorY - targetY;

      // Smooth scroll to center
      view.scrollDOM.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth',
      });
    }
  }
);

/**
 * Theme extension for typewriter mode
 * Adds padding at bottom so content can scroll past end
 */
const typewriterTheme = EditorView.theme({
  '.cm-content': {
    paddingBottom: '50vh',
  },
});

/**
 * Create typewriter mode extension
 */
export function typewriterExtension(): Extension[] {
  return [typewriterPlugin, typewriterTheme];
}
