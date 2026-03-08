import { Compartment } from '@codemirror/state';
import type { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

// The gutter column is a fixed 32px wide. All content (headings, lists,
// paragraphs) starts at the same left edge after the gutter.
export const GUTTER_WIDTH = 40;
// Gap between the gutter edge and the start of text.
export const CONTENT_PADDING_LEFT = 8;

export const layoutBaseCompartment = new Compartment();

export function layoutBaseExtension(): Extension {
  return layoutBaseCompartment.of(
    EditorView.theme({
      // Expose as CSS custom properties so Phase 3+ can reference them.
      '&': {
        '--editor-gutter-width': `${GUTTER_WIDTH}px`,
        '--editor-content-padding': `${CONTENT_PADDING_LEFT}px`,
      },
      // Reserve gutter space via padding-left. Phase 3 replaces this with a
      // real CM6 gutter element and removes this padding.
      '.cm-content': {
        paddingLeft: `${GUTTER_WIDTH + CONTENT_PADDING_LEFT}px`,
        paddingRight: '20px',
        paddingTop: '16px',
        paddingBottom: 'calc(32px + env(safe-area-inset-bottom))',
      },
      // Zero out per-line padding so all lines — including list continuation
      // lines that CM6 would otherwise indent — start at the content edge.
      '.cm-line': {
        paddingLeft: '0',
        paddingRight: '0',
        wordBreak: 'break-word',
      },
    }),
  );
}
