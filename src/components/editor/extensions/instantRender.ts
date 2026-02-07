/**
 * Instant Render CodeMirror Extension
 *
 * Styles markdown syntax to appear rendered while keeping characters in DOM.
 * Uses mark decorations (not replacement widgets) to preserve cursor positions.
 * This fixes iOS trackpad cursor navigation issues.
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
 * Custom checkbox states and their display
 */
const CHECKBOX_STATES: Record<string, { className: string }> = {
  ' ': { className: 'cm-ir-checkbox' },
  'x': { className: 'cm-ir-checkbox-checked' },
  'X': { className: 'cm-ir-checkbox-checked' },
  '>': { className: 'cm-ir-checkbox-forwarded' },
  '<': { className: 'cm-ir-checkbox-cancelled' },
  '!': { className: 'cm-ir-checkbox-important' },
  '?': { className: 'cm-ir-checkbox-question' },
  '/': { className: 'cm-ir-checkbox-progress' },
  '-': { className: 'cm-ir-checkbox-irrelevant' },
};

// Cycle order for clicking checkboxes
const CHECKBOX_CYCLE = [' ', 'x', '>', '/', '!', '?', '-', '<'];

/**
 * Widget for rendering horizontal rules (the only widget we keep)
 */
class HorizontalRuleWidget extends WidgetType {
  toDOM(): HTMLElement {
    const hr = document.createElement('div');
    hr.className = 'cm-ir-hr';
    return hr;
  }

  ignoreEvent(): boolean {
    return false;
  }

  eq(): boolean {
    return true;
  }
}

/**
 * Check if a line is the active line (has cursor)
 */
function isActiveLine(view: EditorView, lineNumber: number): boolean {
  const selection = view.state.selection.main;
  const cursorLine = view.state.doc.lineAt(selection.head).number;
  return cursorLine === lineNumber;
}

/**
 * Add mark decorations for inline markdown
 * Uses marks to style text while preserving character positions
 */
function parseInlineMarkdown(
  lineText: string,
  lineFrom: number,
  decorations: Array<{ from: number; to: number; decoration: Decoration }>,
  isActive: boolean
): void {
  let match;

  // Bold: **text** or __text__
  const boldRegex = /(\*\*|__)(.+?)\1/g;
  while ((match = boldRegex.exec(lineText)) !== null) {
    const from = lineFrom + match.index;
    const markerLen = match[1].length;
    const contentStart = from + markerLen;
    const contentEnd = contentStart + match[2].length;
    const to = contentEnd + markerLen;

    // Hide opening marker
    decorations.push({
      from,
      to: contentStart,
      decoration: Decoration.mark({ class: isActive ? 'cm-ir-syntax-active' : 'cm-ir-syntax-hidden' }),
    });
    // Style content
    decorations.push({
      from: contentStart,
      to: contentEnd,
      decoration: Decoration.mark({ class: 'cm-ir-bold' }),
    });
    // Hide closing marker
    decorations.push({
      from: contentEnd,
      to,
      decoration: Decoration.mark({ class: isActive ? 'cm-ir-syntax-active' : 'cm-ir-syntax-hidden' }),
    });
  }

  // Italic: *text* or _text_ (single markers)
  const italicRegex = /(?<!\*|_)(\*|_)(?!\*|_)(.+?)(?<!\*|_)\1(?!\*|_)/g;
  while ((match = italicRegex.exec(lineText)) !== null) {
    const from = lineFrom + match.index;
    const contentStart = from + 1;
    const contentEnd = contentStart + match[2].length;
    const to = contentEnd + 1;

    // Check overlap with bold
    const overlaps = decorations.some(
      (d) => (from >= d.from && from < d.to) || (to > d.from && to <= d.to)
    );
    if (overlaps) continue;

    decorations.push({
      from,
      to: contentStart,
      decoration: Decoration.mark({ class: isActive ? 'cm-ir-syntax-active' : 'cm-ir-syntax-hidden' }),
    });
    decorations.push({
      from: contentStart,
      to: contentEnd,
      decoration: Decoration.mark({ class: 'cm-ir-italic' }),
    });
    decorations.push({
      from: contentEnd,
      to,
      decoration: Decoration.mark({ class: isActive ? 'cm-ir-syntax-active' : 'cm-ir-syntax-hidden' }),
    });
  }

  // Strikethrough: ~~text~~
  const strikethroughRegex = /~~(.+?)~~/g;
  while ((match = strikethroughRegex.exec(lineText)) !== null) {
    const from = lineFrom + match.index;
    const contentStart = from + 2;
    const contentEnd = contentStart + match[1].length;
    const to = contentEnd + 2;

    decorations.push({
      from,
      to: contentStart,
      decoration: Decoration.mark({ class: isActive ? 'cm-ir-syntax-active' : 'cm-ir-syntax-hidden' }),
    });
    decorations.push({
      from: contentStart,
      to: contentEnd,
      decoration: Decoration.mark({ class: 'cm-ir-strikethrough' }),
    });
    decorations.push({
      from: contentEnd,
      to,
      decoration: Decoration.mark({ class: isActive ? 'cm-ir-syntax-active' : 'cm-ir-syntax-hidden' }),
    });
  }

  // Highlight: ==text==
  const highlightRegex = /==(.+?)==/g;
  while ((match = highlightRegex.exec(lineText)) !== null) {
    const from = lineFrom + match.index;
    const contentStart = from + 2;
    const contentEnd = contentStart + match[1].length;
    const to = contentEnd + 2;

    const overlaps = decorations.some(
      (d) => (from >= d.from && from < d.to) || (to > d.from && to <= d.to)
    );
    if (overlaps) continue;

    decorations.push({
      from,
      to: contentStart,
      decoration: Decoration.mark({ class: isActive ? 'cm-ir-syntax-active' : 'cm-ir-syntax-hidden' }),
    });
    decorations.push({
      from: contentStart,
      to: contentEnd,
      decoration: Decoration.mark({ class: 'cm-ir-highlight' }),
    });
    decorations.push({
      from: contentEnd,
      to,
      decoration: Decoration.mark({ class: isActive ? 'cm-ir-syntax-active' : 'cm-ir-syntax-hidden' }),
    });
  }

  // Inline code: `code`
  const codeRegex = /`([^`\n]+)`/g;
  while ((match = codeRegex.exec(lineText)) !== null) {
    const from = lineFrom + match.index;
    const contentStart = from + 1;
    const contentEnd = contentStart + match[1].length;
    const to = contentEnd + 1;

    decorations.push({
      from,
      to: contentStart,
      decoration: Decoration.mark({ class: isActive ? 'cm-ir-syntax-active' : 'cm-ir-syntax-hidden' }),
    });
    decorations.push({
      from: contentStart,
      to: contentEnd,
      decoration: Decoration.mark({ class: 'cm-ir-code' }),
    });
    decorations.push({
      from: contentEnd,
      to,
      decoration: Decoration.mark({ class: isActive ? 'cm-ir-syntax-active' : 'cm-ir-syntax-hidden' }),
    });
  }

  // Links: [text](url)
  const linkRegex = /\[([^\]^][^\]]*)\]\(([^)]+)\)/g;
  while ((match = linkRegex.exec(lineText)) !== null) {
    const from = lineFrom + match.index;
    const textStart = from + 1;
    const textEnd = textStart + match[1].length;
    const urlStart = textEnd + 2; // ](
    const urlEnd = urlStart + match[2].length;
    const to = urlEnd + 1; // )

    // Hide [
    decorations.push({
      from,
      to: textStart,
      decoration: Decoration.mark({ class: isActive ? 'cm-ir-syntax-active' : 'cm-ir-syntax-hidden' }),
    });
    // Style link text
    decorations.push({
      from: textStart,
      to: textEnd,
      decoration: Decoration.mark({ class: 'cm-ir-link' }),
    });
    // Hide ](url)
    decorations.push({
      from: textEnd,
      to,
      decoration: Decoration.mark({ class: isActive ? 'cm-ir-syntax-active' : 'cm-ir-syntax-hidden' }),
    });
  }

  // Footnote references: [^id]
  const footnoteRefRegex = /\[\^([^\]]+)\](?!:)/g;
  while ((match = footnoteRefRegex.exec(lineText)) !== null) {
    const from = lineFrom + match.index;
    const to = from + match[0].length;

    const overlaps = decorations.some(
      (d) => (from >= d.from && from < d.to) || (to > d.from && to <= d.to)
    );
    if (overlaps) continue;

    decorations.push({
      from,
      to,
      decoration: Decoration.mark({ class: 'cm-ir-footnote-ref' }),
    });
  }
}

/**
 * Find all line ranges that are part of callouts
 */
function getCalloutLineRanges(doc: { lines: number; line: (n: number) => { text: string } }): Set<number> {
  const calloutLines = new Set<number>();
  const calloutStartRegex = /^>\s*\[!\w+\]/;

  let i = 1;
  while (i <= doc.lines) {
    const line = doc.line(i);
    if (calloutStartRegex.test(line.text)) {
      // This is a callout start, mark it and find continuation lines
      calloutLines.add(i);
      let j = i + 1;
      while (j <= doc.lines) {
        const nextLine = doc.line(j);
        if (nextLine.text.match(/^>\s*/) && !calloutStartRegex.test(nextLine.text)) {
          calloutLines.add(j);
          j++;
        } else {
          break;
        }
      }
      i = j;
    } else {
      i++;
    }
  }

  return calloutLines;
}

/**
 * Create decorations for a document
 */
function createInstantRenderDecorations(view: EditorView): DecorationSet {
  const decorations: Array<{ from: number; to: number; decoration: Decoration }> = [];
  const lineDecorations: Array<{ from: number; decoration: Decoration }> = [];
  const doc = view.state.doc;

  // Pre-compute which lines are part of callouts (to skip blockquote styling)
  const calloutLines = getCalloutLineRanges(doc);

  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i);
    const lineText = line.text;
    const lineFrom = line.from;
    const isActive = isActiveLine(view, i);

    // Headers: # to ######
    const headerMatch = lineText.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const prefixEnd = lineFrom + headerMatch[1].length + 1; // "# " including space

      // Style/hide the "# " prefix
      decorations.push({
        from: lineFrom,
        to: prefixEnd,
        decoration: Decoration.mark({ class: isActive ? 'cm-ir-syntax-active' : 'cm-ir-syntax-hidden' }),
      });

      // Style the header content
      decorations.push({
        from: prefixEnd,
        to: line.to,
        decoration: Decoration.mark({ class: `cm-ir-header cm-ir-header-${level}` }),
      });

      // Parse inline markdown in header content
      parseInlineMarkdown(headerMatch[2], prefixEnd, decorations, isActive);
      continue;
    }

    // Horizontal rule: --- or *** or ___
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(lineText.trim())) {
      // Keep using widget for HR since it's a visual element
      if (!isActive) {
        decorations.push({
          from: lineFrom,
          to: line.to,
          decoration: Decoration.replace({
            widget: new HorizontalRuleWidget(),
          }),
        });
      }
      continue;
    }

    // Block quotes: > text (but NOT callouts)
    const blockquoteMatch = lineText.match(/^(>\s*)(.*)$/);
    if (blockquoteMatch) {
      // Skip if this line is part of a callout
      if (calloutLines.has(i)) {
        continue;
      }

      const prefix = blockquoteMatch[1];
      const prefixEnd = lineFrom + prefix.length;

      // Style/hide the "> " prefix
      decorations.push({
        from: lineFrom,
        to: prefixEnd,
        decoration: Decoration.mark({ class: isActive ? 'cm-ir-syntax-active' : 'cm-ir-syntax-hidden' }),
      });

      // Line decoration for blockquote styling
      lineDecorations.push({
        from: lineFrom,
        decoration: Decoration.line({ class: 'cm-ir-blockquote-line' }),
      });

      // Parse inline markdown in content
      if (blockquoteMatch[2]) {
        parseInlineMarkdown(blockquoteMatch[2], prefixEnd, decorations, isActive);
      }
      continue;
    }

    // Task list: - [ ] or - [x] or custom states
    const taskMatch = lineText.match(/^(\s*)([-*+])\s+(\[([ xX><!?/\-])\])\s*(.*)$/);
    if (taskMatch) {
      const indent = taskMatch[1];
      const bullet = taskMatch[2];
      const checkbox = taskMatch[3];
      const checkboxState = taskMatch[4];
      const content = taskMatch[5];

      const bulletStart = lineFrom + indent.length;
      const bulletEnd = bulletStart + bullet.length + 1; // bullet + space
      const checkboxStart = bulletEnd;
      const checkboxEnd = checkboxStart + checkbox.length;
      const contentStart = checkboxEnd + (content ? 1 : 0); // +1 for space if there's content

      if (isActive) {
        // Show raw markdown on active line, just dim the syntax
        decorations.push({
          from: bulletStart,
          to: checkboxEnd,
          decoration: Decoration.mark({ class: 'cm-ir-syntax-active' }),
        });
      } else {
        // Hide bullet
        decorations.push({
          from: bulletStart,
          to: bulletEnd,
          decoration: Decoration.mark({ class: 'cm-ir-syntax-hidden' }),
        });

        // Style checkbox with interactive class and icon
        const stateClass = CHECKBOX_STATES[checkboxState]?.className || 'cm-ir-checkbox';
        decorations.push({
          from: checkboxStart,
          to: checkboxEnd,
          decoration: Decoration.mark({
            class: `cm-ir-checkbox-widget ${stateClass}`,
            attributes: {
              'data-checkbox-state': checkboxState,
              'data-line-from': String(lineFrom),
            },
          }),
        });
      }

      // Parse inline markdown in content
      if (content) {
        parseInlineMarkdown(content, contentStart, decorations, isActive);

        // Add strikethrough and fade for completed tasks
        if ((checkboxState === 'x' || checkboxState === 'X') && !isActive) {
          decorations.push({
            from: contentStart,
            to: contentStart + content.length,
            decoration: Decoration.mark({ class: 'cm-ir-task-completed' }),
          });
        }
      }
      continue;
    }

    // Unordered list: - item, * item, + item
    const ulMatch = lineText.match(/^(\s*)([-*+])\s+(.*)$/);
    if (ulMatch) {
      const indent = ulMatch[1];
      const bullet = ulMatch[2];
      const content = ulMatch[3];
      const bulletFrom = lineFrom + indent.length;
      const bulletTo = bulletFrom + bullet.length;
      const contentStart = bulletTo + 1; // +1 for space

      // Style bullet
      decorations.push({
        from: bulletFrom,
        to: bulletTo,
        decoration: Decoration.mark({ class: 'cm-ir-bullet' }),
      });

      // Parse inline markdown in content
      if (content) {
        parseInlineMarkdown(content, contentStart, decorations, isActive);
      }
      continue;
    }

    // Ordered list: 1. item
    const olMatch = lineText.match(/^(\s*)(\d+)\.\s+(.*)$/);
    if (olMatch) {
      const indent = olMatch[1];
      const number = olMatch[2];
      const content = olMatch[3];
      const numFrom = lineFrom + indent.length;
      const numTo = numFrom + number.length + 1; // number + "."
      const contentStart = numTo + 1; // +1 for space

      // Style number
      decorations.push({
        from: numFrom,
        to: numTo,
        decoration: Decoration.mark({ class: 'cm-ir-list-number' }),
      });

      // Parse inline markdown in content
      if (content) {
        parseInlineMarkdown(content, contentStart, decorations, isActive);
      }
      continue;
    }

    // Parse inline markdown for regular lines
    parseInlineMarkdown(lineText, lineFrom, decorations, isActive);
  }

  // Combine and sort decorations
  const allDecorations = [
    ...decorations,
    ...lineDecorations.map((ld) => ({ from: ld.from, to: ld.from, decoration: ld.decoration })),
  ];

  allDecorations.sort((a, b) => {
    if (a.from !== b.from) return a.from - b.from;
    return a.to - b.to;
  });

  // Build decoration set, handling overlaps
  const builder = new RangeSetBuilder<Decoration>();
  let lastTo = 0;

  for (const dec of allDecorations) {
    // Line decorations (point decorations) don't conflict
    if (dec.from === dec.to) {
      builder.add(dec.from, dec.to, dec.decoration);
      continue;
    }
    // Skip overlapping range decorations
    if (dec.from < lastTo) continue;
    builder.add(dec.from, dec.to, dec.decoration);
    lastTo = dec.to;
  }

  return builder.finish();
}

/**
 * Instant render view plugin
 */
const instantRenderPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = createInstantRenderDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.selectionSet || update.viewportChanged) {
        this.decorations = createInstantRenderDecorations(update.view);
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

/**
 * Theme styles for instant render
 */
const instantRenderTheme = EditorView.theme({
  // Hidden syntax (non-active lines) - keeps characters but visually hides them
  '.cm-ir-syntax-hidden': {
    fontSize: '0',
    opacity: '0',
    width: '0',
    display: 'inline-block',
    overflow: 'hidden',
  },

  // Active line syntax - visible but dimmed
  '.cm-ir-syntax-active': {
    color: 'var(--color-ink-300)',
  },

  // Headers
  '.cm-ir-header': {
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-ink-900)',
  },
  '.cm-ir-header-1': {
    fontSize: '1.75em',
    lineHeight: '1.3',
  },
  '.cm-ir-header-2': {
    fontSize: '1.5em',
    lineHeight: '1.35',
  },
  '.cm-ir-header-3': {
    fontSize: '1.25em',
    lineHeight: '1.4',
  },
  '.cm-ir-header-4': {
    fontSize: '1.125em',
    lineHeight: '1.45',
  },
  '.cm-ir-header-5': {
    fontSize: '1em',
    lineHeight: '1.5',
  },
  '.cm-ir-header-6': {
    fontSize: '0.95em',
    lineHeight: '1.5',
    color: 'var(--color-ink-700)',
  },

  // Inline styles
  '.cm-ir-bold': {
    fontWeight: 'var(--font-semibold)',
  },
  '.cm-ir-italic': {
    fontStyle: 'italic',
  },
  '.cm-ir-strikethrough': {
    textDecoration: 'line-through',
    color: 'var(--color-ink-500)',
  },
  '.cm-ir-code': {
    fontFamily: 'var(--font-family-mono)',
    fontSize: '0.9em',
    background: 'var(--color-ink-alpha-08)',
    padding: '2px 4px',
    borderRadius: '3px',
  },

  // Links
  '.cm-ir-link': {
    color: 'var(--color-link)',
    textDecoration: 'underline',
    cursor: 'pointer',
  },

  // Lists
  '.cm-ir-bullet': {
    color: 'var(--color-ink-500)',
  },
  '.cm-ir-list-number': {
    color: 'var(--color-ink-500)',
    fontVariantNumeric: 'tabular-nums',
  },

  // Highlight
  '.cm-ir-highlight': {
    background: 'var(--color-highlight, rgba(255, 235, 59, 0.4))',
    padding: '1px 2px',
    borderRadius: '2px',
  },

  // Footnotes
  '.cm-ir-footnote-ref': {
    color: 'var(--color-link)',
    cursor: 'pointer',
    fontSize: '0.85em',
  },

  // Checkboxes - hide text, show icon via ::before
  '.cm-ir-checkbox-widget': {
    cursor: 'pointer',
    userSelect: 'none',
    fontSize: '0',
    position: 'relative',
  },
  '.cm-ir-checkbox-widget::before': {
    fontSize: '16px',
    display: 'inline',
  },
  '.cm-ir-checkbox::before': {
    content: '"☐"',
    color: 'var(--color-ink-400)',
  },
  '.cm-ir-checkbox-checked::before': {
    content: '"☑"',
    color: 'var(--color-success)',
  },
  '.cm-ir-checkbox-forwarded::before': {
    content: '"➡"',
    color: 'var(--color-info, #3b82f6)',
  },
  '.cm-ir-checkbox-cancelled::before': {
    content: '"✖"',
    color: 'var(--color-danger, #ef4444)',
  },
  '.cm-ir-checkbox-important::before': {
    content: '"❗"',
    color: 'var(--color-warning, #f59e0b)',
  },
  '.cm-ir-checkbox-question::before': {
    content: '"❓"',
    color: 'var(--color-info, #8b5cf6)',
  },
  '.cm-ir-checkbox-progress::before': {
    content: '"◔"',
    color: 'var(--color-warning, #f59e0b)',
  },
  '.cm-ir-checkbox-irrelevant::before': {
    content: '"—"',
    color: 'var(--color-ink-300)',
    opacity: '0.6',
  },

  // Completed task content
  '.cm-ir-task-completed': {
    textDecoration: 'line-through',
    opacity: '0.4',
  },

  // Blockquotes
  '.cm-ir-blockquote-line': {
    borderLeft: '3px solid var(--color-ink-400)',
    paddingLeft: '12px',
    color: 'var(--color-ink-600)',
    fontStyle: 'italic',
  },

  // Horizontal rule
  '.cm-ir-hr': {
    height: '1px',
    background: 'var(--color-border-300)',
    margin: '8px 0',
  },
});

/**
 * Click handler for interactive checkboxes
 */
const checkboxClickHandler = EditorView.domEventHandlers({
  click: (event, view) => {
    const target = event.target as HTMLElement;

    // Check if click was on a checkbox widget (now a mark, not a widget)
    if (!target.classList.contains('cm-ir-checkbox-widget')) {
      return false;
    }

    // Get data from the mark's attributes
    const lineFromStr = target.getAttribute('data-line-from');
    const currentState = target.getAttribute('data-checkbox-state');

    if (!lineFromStr || currentState === null) {
      return false;
    }

    const lineFrom = parseInt(lineFromStr, 10);
    const line = view.state.doc.lineAt(lineFrom);
    const lineText = line.text;

    // Find the checkbox pattern in the line
    const checkboxMatch = lineText.match(/^(\s*[-*+]\s+\[)([ xX><!?/\-])(\].*)$/);
    if (!checkboxMatch) {
      return false;
    }

    // Determine next state in cycle
    const currentIndex = CHECKBOX_CYCLE.indexOf(currentState);
    const nextIndex = (currentIndex + 1) % CHECKBOX_CYCLE.length;
    const nextState = CHECKBOX_CYCLE[nextIndex];

    // Build the new line with updated checkbox state
    const newLine = checkboxMatch[1] + nextState + checkboxMatch[3];

    // Apply the change
    view.dispatch({
      changes: {
        from: line.from,
        to: line.to,
        insert: newLine,
      },
    });

    event.preventDefault();
    return true;
  },
});

/**
 * Create the instant render extension
 */
export function instantRenderExtension(): Extension[] {
  return [instantRenderPlugin, instantRenderTheme, checkboxClickHandler];
}
