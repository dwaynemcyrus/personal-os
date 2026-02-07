/**
 * Callouts CodeMirror Extension
 *
 * Renders Obsidian-style callouts:
 * > [!note] Optional Title
 * > Content here
 *
 * Supported types: note, tip, warning, danger, info, success, question, quote
 */

import { Extension, RangeSetBuilder, StateField } from '@codemirror/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  WidgetType,
} from '@codemirror/view';

/**
 * Callout type configuration
 */
const CALLOUT_TYPES: Record<string, { icon: string; color: string; bg: string }> = {
  note: { icon: '📝', color: '#1e40af', bg: 'rgba(59, 130, 246, 0.1)' },
  tip: { icon: '💡', color: '#065f46', bg: 'rgba(16, 185, 129, 0.1)' },
  warning: { icon: '⚠️', color: '#92400e', bg: 'rgba(245, 158, 11, 0.1)' },
  danger: { icon: '🚨', color: '#991b1b', bg: 'rgba(239, 68, 68, 0.1)' },
  info: { icon: 'ℹ️', color: '#1e40af', bg: 'rgba(59, 130, 246, 0.1)' },
  success: { icon: '✅', color: '#166534', bg: 'rgba(34, 197, 94, 0.1)' },
  question: { icon: '❓', color: '#6b21a8', bg: 'rgba(168, 85, 247, 0.1)' },
  quote: { icon: '💬', color: '#4b5563', bg: 'rgba(107, 114, 128, 0.1)' },
  example: { icon: '📋', color: '#4338ca', bg: 'rgba(99, 102, 241, 0.1)' },
  abstract: { icon: '📄', color: '#0891b2', bg: 'rgba(6, 182, 212, 0.1)' },
  todo: { icon: '📌', color: '#0891b2', bg: 'rgba(6, 182, 212, 0.1)' },
  bug: { icon: '🐛', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)' },
};

/**
 * Widget for callout header (first line with type and title)
 */
class CalloutHeaderWidget extends WidgetType {
  constructor(
    readonly type: string,
    readonly title: string,
    readonly isOnlyLine: boolean
  ) {
    super();
  }

  toDOM(): HTMLElement {
    const config = CALLOUT_TYPES[this.type] || CALLOUT_TYPES.note;
    const div = document.createElement('div');
    div.className = `cm-callout-header cm-callout-header--${this.type}`;
    if (this.isOnlyLine) div.classList.add('cm-callout-header--only');
    div.style.setProperty('--callout-bg', config.bg);
    div.style.setProperty('--callout-color', config.color);
    div.textContent = `${config.icon} ${this.title || this.type.charAt(0).toUpperCase() + this.type.slice(1)}`;
    return div;
  }

  ignoreEvent(): boolean {
    return false;
  }

  eq(other: CalloutHeaderWidget): boolean {
    return this.type === other.type && this.title === other.title && this.isOnlyLine === other.isOnlyLine;
  }
}

/**
 * Widget for callout content lines
 */
class CalloutContentWidget extends WidgetType {
  constructor(
    readonly content: string,
    readonly type: string,
    readonly isLast: boolean
  ) {
    super();
  }

  toDOM(): HTMLElement {
    const config = CALLOUT_TYPES[this.type] || CALLOUT_TYPES.note;
    const div = document.createElement('div');
    div.className = `cm-callout-content cm-callout-content--${this.type}`;
    if (this.isLast) div.classList.add('cm-callout-content--last');
    div.style.setProperty('--callout-bg', config.bg);
    div.style.setProperty('--callout-color', config.color);
    div.textContent = this.content;
    return div;
  }

  ignoreEvent(): boolean {
    return false;
  }

  eq(other: CalloutContentWidget): boolean {
    return (
      this.content === other.content &&
      this.type === other.type &&
      this.isLast === other.isLast
    );
  }
}

/**
 * Check if cursor is within the given line range
 */
function isCursorInRange(
  selection: { head: number },
  doc: { lineAt: (pos: number) => { number: number } },
  startLine: number,
  endLine: number
): boolean {
  const cursorLine = doc.lineAt(selection.head).number;
  return cursorLine >= startLine && cursorLine <= endLine;
}

/**
 * Parse callouts from document and create decorations
 */
function createCalloutDecorations(
  doc: { lines: number; line: (n: number) => { from: number; to: number; text: string }; lineAt: (pos: number) => { number: number } },
  selection: { head: number }
): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();

  // Regex to match callout start: > [!type] or > [!type] Title
  const calloutStartRegex = /^>\s*\[!(\w+)\]\s*(.*)$/;

  let i = 1;
  while (i <= doc.lines) {
    const line = doc.line(i);
    const match = line.text.match(calloutStartRegex);

    if (match) {
      const calloutType = match[1].toLowerCase();
      const calloutTitle = match[2].trim();
      const calloutStartLine = i;
      let calloutEndLine = i;

      // Find all continuation lines (lines starting with >)
      let j = i + 1;
      while (j <= doc.lines) {
        const nextLine = doc.line(j);
        if (nextLine.text.match(/^>\s*/) && !nextLine.text.match(/^>\s*\[!/)) {
          calloutEndLine = j;
          j++;
        } else {
          break;
        }
      }

      // Skip rendering if cursor is within the callout
      if (isCursorInRange(selection, doc, calloutStartLine, calloutEndLine)) {
        i = calloutEndLine + 1;
        continue;
      }

      const isOnlyLine = calloutStartLine === calloutEndLine;

      // Decorate the header line with block widget and hide the original line
      builder.add(
        line.from,
        line.from,
        Decoration.widget({
          widget: new CalloutHeaderWidget(calloutType, calloutTitle, isOnlyLine),
          block: true,
        })
      );

      // Add line decoration to hide the cm-line element
      builder.add(
        line.from,
        line.from,
        Decoration.line({ class: 'cm-callout-line-hidden' })
      );

      // Decorate content lines
      for (let k = calloutStartLine + 1; k <= calloutEndLine; k++) {
        const contentLine = doc.line(k);
        const contentMatch = contentLine.text.match(/^>\s*(.*)$/);
        if (contentMatch) {
          const content = contentMatch[1];
          const isLast = k === calloutEndLine;

          builder.add(
            contentLine.from,
            contentLine.from,
            Decoration.widget({
              widget: new CalloutContentWidget(content, calloutType, isLast),
              block: true,
            })
          );

          // Add line decoration to hide the cm-line element
          builder.add(
            contentLine.from,
            contentLine.from,
            Decoration.line({ class: 'cm-callout-line-hidden' })
          );
        }
      }

      i = calloutEndLine + 1;
    } else {
      i++;
    }
  }

  return builder.finish();
}

/**
 * Callouts state field - required for block decorations
 */
const calloutsField = StateField.define<DecorationSet>({
  create(state) {
    return createCalloutDecorations(state.doc, state.selection.main);
  },
  update(decorations, tr) {
    if (tr.docChanged || tr.selection) {
      return createCalloutDecorations(tr.state.doc, tr.state.selection.main);
    }
    return decorations;
  },
  provide: (f) => EditorView.decorations.from(f),
});

/**
 * Theme styles for callouts - no border-left, uses background color only
 */
const calloutsTheme = EditorView.theme({
  // Hide the original cm-line elements for callout lines
  '.cm-callout-line-hidden': {
    display: 'none !important',
  },

  // Header styles
  '.cm-callout-header': {
    display: 'block',
    padding: '8px 12px',
    marginTop: '8px',
    borderRadius: '6px 6px 0 0',
    background: 'var(--callout-bg)',
    color: 'var(--callout-color)',
    fontWeight: 'var(--font-semibold)',
    fontSize: '0.95em',
  },
  '.cm-callout-header--only': {
    borderRadius: '6px',
    marginBottom: '8px',
  },

  // Content styles
  '.cm-callout-content': {
    display: 'block',
    padding: '4px 12px',
    background: 'var(--callout-bg)',
    color: 'var(--callout-color)',
    fontSize: '0.95em',
    lineHeight: '1.5',
  },
  '.cm-callout-content--last': {
    paddingBottom: '8px',
    marginBottom: '8px',
    borderRadius: '0 0 6px 6px',
  },
});

/**
 * Create the callouts extension
 */
export function calloutsExtension(): Extension[] {
  return [calloutsField, calloutsTheme];
}
