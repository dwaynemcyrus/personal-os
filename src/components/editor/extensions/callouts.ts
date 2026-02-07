/**
 * Callouts CodeMirror Extension
 *
 * Renders Obsidian-style callouts:
 * > [!note] Optional Title
 * > Content here
 *
 * Supported types: note, tip, warning, danger, info, success, question, quote
 */

import { Extension, RangeSetBuilder } from '@codemirror/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
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
    readonly title: string
  ) {
    super();
  }

  toDOM(): HTMLElement {
    const config = CALLOUT_TYPES[this.type] || CALLOUT_TYPES.note;
    const div = document.createElement('div');
    div.className = `cm-callout-header cm-callout-header--${this.type}`;
    div.style.setProperty('--callout-color', config.color);
    div.textContent = `${config.icon} ${this.title || this.type.charAt(0).toUpperCase() + this.type.slice(1)}`;
    return div;
  }

  ignoreEvent(): boolean {
    return false;
  }

  eq(other: CalloutHeaderWidget): boolean {
    return this.type === other.type && this.title === other.title;
  }
}

/**
 * Widget for callout content lines
 */
class CalloutContentWidget extends WidgetType {
  constructor(
    readonly content: string,
    readonly type: string,
    readonly isFirst: boolean,
    readonly isLast: boolean
  ) {
    super();
  }

  toDOM(): HTMLElement {
    const div = document.createElement('div');
    div.className = `cm-callout-content cm-callout-content--${this.type}`;
    if (this.isFirst) div.classList.add('cm-callout-content--first');
    if (this.isLast) div.classList.add('cm-callout-content--last');
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
      this.isFirst === other.isFirst &&
      this.isLast === other.isLast
    );
  }
}

/**
 * Check if cursor is within the given line range
 */
function isCursorInRange(view: EditorView, startLine: number, endLine: number): boolean {
  const selection = view.state.selection.main;
  const cursorLine = view.state.doc.lineAt(selection.head).number;
  return cursorLine >= startLine && cursorLine <= endLine;
}

/**
 * Parse callouts from document and create decorations
 */
function createCalloutDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const doc = view.state.doc;

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
        if (nextLine.text.match(/^>\s*/)) {
          calloutEndLine = j;
          j++;
        } else {
          break;
        }
      }

      // Skip rendering if cursor is within the callout
      if (isCursorInRange(view, calloutStartLine, calloutEndLine)) {
        i = calloutEndLine + 1;
        continue;
      }

      // Decorate the header line
      builder.add(
        line.from,
        line.to,
        Decoration.replace({
          widget: new CalloutHeaderWidget(calloutType, calloutTitle),
        })
      );

      // Decorate content lines
      for (let k = calloutStartLine + 1; k <= calloutEndLine; k++) {
        const contentLine = doc.line(k);
        const contentMatch = contentLine.text.match(/^>\s*(.*)$/);
        if (contentMatch) {
          const content = contentMatch[1];
          const isFirst = k === calloutStartLine + 1;
          const isLast = k === calloutEndLine;

          builder.add(
            contentLine.from,
            contentLine.to,
            Decoration.replace({
              widget: new CalloutContentWidget(content, calloutType, isFirst, isLast),
            })
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
 * Callouts view plugin
 */
const calloutsPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = createCalloutDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.selectionSet || update.viewportChanged) {
        this.decorations = createCalloutDecorations(update.view);
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

/**
 * Theme styles for callouts
 */
const calloutsTheme = EditorView.theme({
  '.cm-callout-header': {
    display: 'block',
    padding: '8px 12px',
    marginTop: '8px',
    borderLeft: '4px solid var(--callout-color, #3b82f6)',
    borderTopLeftRadius: '4px',
    borderTopRightRadius: '4px',
    fontWeight: 'var(--font-semibold)',
    fontSize: '0.95em',
  },
  '.cm-callout-header--note': {
    background: 'rgba(59, 130, 246, 0.1)',
    borderColor: '#3b82f6',
    color: '#1e40af',
  },
  '.cm-callout-header--tip': {
    background: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10b981',
    color: '#065f46',
  },
  '.cm-callout-header--warning': {
    background: 'rgba(245, 158, 11, 0.1)',
    borderColor: '#f59e0b',
    color: '#92400e',
  },
  '.cm-callout-header--danger': {
    background: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#ef4444',
    color: '#991b1b',
  },
  '.cm-callout-header--info': {
    background: 'rgba(59, 130, 246, 0.1)',
    borderColor: '#3b82f6',
    color: '#1e40af',
  },
  '.cm-callout-header--success': {
    background: 'rgba(34, 197, 94, 0.1)',
    borderColor: '#22c55e',
    color: '#166534',
  },
  '.cm-callout-header--question': {
    background: 'rgba(168, 85, 247, 0.1)',
    borderColor: '#a855f7',
    color: '#6b21a8',
  },
  '.cm-callout-header--quote': {
    background: 'rgba(107, 114, 128, 0.1)',
    borderColor: '#6b7280',
    color: '#4b5563',
  },
  '.cm-callout-header--example': {
    background: 'rgba(99, 102, 241, 0.1)',
    borderColor: '#6366f1',
    color: '#4338ca',
  },
  '.cm-callout-header--abstract': {
    background: 'rgba(6, 182, 212, 0.1)',
    borderColor: '#06b6d4',
    color: '#0891b2',
  },
  '.cm-callout-header--todo': {
    background: 'rgba(6, 182, 212, 0.1)',
    borderColor: '#06b6d4',
    color: '#0891b2',
  },
  '.cm-callout-header--bug': {
    background: 'rgba(220, 38, 38, 0.1)',
    borderColor: '#dc2626',
    color: '#dc2626',
  },
  '.cm-callout-content': {
    display: 'block',
    padding: '4px 12px',
    borderLeft: '4px solid',
    borderColor: 'inherit',
    fontSize: '0.95em',
    lineHeight: '1.5',
  },
  '.cm-callout-content--first': {
    paddingTop: '0',
  },
  '.cm-callout-content--last': {
    paddingBottom: '8px',
    marginBottom: '8px',
    borderBottomLeftRadius: '4px',
    borderBottomRightRadius: '4px',
  },
  '.cm-callout-content--note': {
    background: 'rgba(59, 130, 246, 0.1)',
    borderColor: '#3b82f6',
    color: '#1e3a5f',
  },
  '.cm-callout-content--tip': {
    background: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10b981',
    color: '#14532d',
  },
  '.cm-callout-content--warning': {
    background: 'rgba(245, 158, 11, 0.1)',
    borderColor: '#f59e0b',
    color: '#78350f',
  },
  '.cm-callout-content--danger': {
    background: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#ef4444',
    color: '#7f1d1d',
  },
  '.cm-callout-content--info': {
    background: 'rgba(59, 130, 246, 0.1)',
    borderColor: '#3b82f6',
    color: '#1e3a5f',
  },
  '.cm-callout-content--success': {
    background: 'rgba(34, 197, 94, 0.1)',
    borderColor: '#22c55e',
    color: '#14532d',
  },
  '.cm-callout-content--question': {
    background: 'rgba(168, 85, 247, 0.1)',
    borderColor: '#a855f7',
    color: '#581c87',
  },
  '.cm-callout-content--quote': {
    background: 'rgba(107, 114, 128, 0.1)',
    borderColor: '#6b7280',
    color: '#374151',
  },
  '.cm-callout-content--example': {
    background: 'rgba(99, 102, 241, 0.1)',
    borderColor: '#6366f1',
    color: '#3730a3',
  },
  '.cm-callout-content--abstract': {
    background: 'rgba(6, 182, 212, 0.1)',
    borderColor: '#06b6d4',
    color: '#164e63',
  },
  '.cm-callout-content--todo': {
    background: 'rgba(6, 182, 212, 0.1)',
    borderColor: '#06b6d4',
    color: '#164e63',
  },
  '.cm-callout-content--bug': {
    background: 'rgba(220, 38, 38, 0.1)',
    borderColor: '#dc2626',
    color: '#991b1b',
  },
});

/**
 * Create the callouts extension
 */
export function calloutsExtension(): Extension[] {
  return [calloutsPlugin, calloutsTheme];
}
