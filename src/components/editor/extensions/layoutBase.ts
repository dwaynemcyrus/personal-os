import { Compartment } from '@codemirror/state';
import type { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

export const GUTTER_WIDTH = 40;
// Gap between gutter edge and the start of text in the content column.
export const CONTENT_PADDING_LEFT = 8;

export const layoutBaseCompartment = new Compartment();

// Source mode: no gutter DOM element — reserve space with padding-left.
export function layoutSourceTheme(): Extension {
  return EditorView.theme({
    '&': {
      '--editor-gutter-width': `${GUTTER_WIDTH}px`,
      '--editor-content-padding': `${CONTENT_PADDING_LEFT}px`,
    },
    '.cm-content': {
      paddingLeft: `${GUTTER_WIDTH + CONTENT_PADDING_LEFT}px`,
      paddingRight: '20px',
      paddingTop: '16px',
      paddingBottom: 'calc(32px + env(safe-area-inset-bottom))',
    },
    '.cm-line': {
      paddingLeft: '0',
      paddingRight: '0',
      wordBreak: 'break-word',
    },
  });
}

// Rendered mode: no gutter element, same padding as source mode.
export function layoutRenderedTheme(): Extension {
  return EditorView.theme({
    '&': {
      '--editor-gutter-width': `${GUTTER_WIDTH}px`,
      '--editor-content-padding': `${CONTENT_PADDING_LEFT}px`,
    },
    '.cm-content': {
      paddingLeft: `${GUTTER_WIDTH + CONTENT_PADDING_LEFT}px`,
      paddingRight: '20px',
      paddingTop: '16px',
      paddingBottom: 'calc(32px + env(safe-area-inset-bottom))',
    },
    '.cm-line': {
      paddingLeft: '0',
      paddingRight: '0',
      wordBreak: 'break-word',
    },
  });
}
