/**
 * Typewriter Mode CodeMirror Extension
 *
 * Keeps the cursor at ~35% from the top as you type.
 * Positioned higher than center to compensate for on-screen keyboard.
 */

import { Extension } from '@codemirror/state';
import { EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view';

// Position cursor at 35% from top (compensates for keyboard)
const CURSOR_POSITION_RATIO = 0.35;

/**
 * Typewriter mode plugin - scrolls to keep cursor at target position
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
        this.positionCursor(view);
      });
    }

    positionCursor(view: EditorView) {
      const selection = view.state.selection.main;

      // Get cursor position in viewport
      const cursorCoords = view.coordsAtPos(selection.head);
      if (!cursorCoords) return;

      // Get viewport dimensions - position at 35% from top
      const viewportHeight = view.dom.clientHeight;
      const targetY = viewportHeight * CURSOR_POSITION_RATIO;

      // Calculate scroll offset to position cursor
      const currentScrollTop = view.scrollDOM.scrollTop;
      const cursorY = cursorCoords.top - view.dom.getBoundingClientRect().top + currentScrollTop;
      const targetScrollTop = cursorY - targetY;

      // Smooth scroll to target position
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
    paddingBottom: '65vh',
  },
});

/**
 * Create typewriter mode extension
 */
export function typewriterExtension(): Extension[] {
  return [typewriterPlugin, typewriterTheme];
}
