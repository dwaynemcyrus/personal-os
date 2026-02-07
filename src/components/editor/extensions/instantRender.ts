/**
 * Instant Render CodeMirror Extension
 *
 * Hides markdown syntax when not editing and shows formatted text.
 * Reveals syntax when cursor moves to that line.
 * Creates a Bear-like editing experience.
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
 * Widget for rendering formatted inline content
 */
class FormattedTextWidget extends WidgetType {
  constructor(
    readonly text: string,
    readonly className: string
  ) {
    super();
  }

  toDOM(): HTMLElement {
    const span = document.createElement('span');
    span.className = this.className;
    span.textContent = this.text;
    return span;
  }

  ignoreEvent(): boolean {
    return false;
  }

  eq(other: FormattedTextWidget): boolean {
    return this.text === other.text && this.className === other.className;
  }
}

/**
 * Widget for rendering headers with proper styling
 */
class HeaderWidget extends WidgetType {
  constructor(
    readonly text: string,
    readonly level: number
  ) {
    super();
  }

  toDOM(): HTMLElement {
    const span = document.createElement('span');
    span.className = `cm-ir-header cm-ir-header-${this.level}`;
    span.textContent = this.text;
    return span;
  }

  ignoreEvent(): boolean {
    return false;
  }

  eq(other: HeaderWidget): boolean {
    return this.text === other.text && this.level === other.level;
  }
}

/**
 * Widget for rendering links
 */
class LinkWidget extends WidgetType {
  constructor(
    readonly text: string,
    readonly url: string
  ) {
    super();
  }

  toDOM(): HTMLElement {
    const span = document.createElement('span');
    span.className = 'cm-ir-link';
    span.textContent = this.text;
    span.title = this.url;
    return span;
  }

  ignoreEvent(): boolean {
    return false;
  }

  eq(other: LinkWidget): boolean {
    return this.text === other.text && this.url === other.url;
  }
}

/**
 * Widget for rendering horizontal rules
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
 * Patterns for inline markdown syntax
 */
const INLINE_PATTERNS = {
  // Bold: **text** or __text__
  bold: /(\*\*|__)(?=\S)([^\*_]+?)(?<=\S)\1/g,
  // Italic: *text* or _text_ (but not inside bold)
  italic: /(?<!\*|_)(\*|_)(?!\*|_)(?=\S)([^\*_]+?)(?<=\S)\1(?!\*|_)/g,
  // Strikethrough: ~~text~~
  strikethrough: /~~(?=\S)(.+?)(?<=\S)~~/g,
  // Inline code: `code`
  inlineCode: /`([^`\n]+)`/g,
  // Links: [text](url)
  link: /\[([^\]]+)\]\(([^)]+)\)/g,
  // Images: ![alt](url)
  image: /!\[([^\]]*)\]\(([^)]+)\)/g,
};

/**
 * Check if a line is the active line (has cursor)
 */
function isActiveLine(view: EditorView, lineNumber: number): boolean {
  const selection = view.state.selection.main;
  const cursorLine = view.state.doc.lineAt(selection.head).number;
  return cursorLine === lineNumber;
}

/**
 * Parse inline markdown and create decorations
 */
function parseInlineMarkdown(
  lineText: string,
  lineFrom: number,
  decorations: Array<{ from: number; to: number; decoration: Decoration }>
): void {
  // Bold
  let match;
  const boldRegex = /(\*\*|__)(.+?)\1/g;
  while ((match = boldRegex.exec(lineText)) !== null) {
    const fullMatch = match[0];
    const content = match[2];
    const from = lineFrom + match.index;
    const to = from + fullMatch.length;

    decorations.push({
      from,
      to,
      decoration: Decoration.replace({
        widget: new FormattedTextWidget(content, 'cm-ir-bold'),
      }),
    });
  }

  // Italic (avoid matching inside bold markers)
  const italicRegex = /(?<!\*)(\*)(?!\*)(.+?)(?<!\*)\1(?!\*)|(?<!_)(_)(?!_)(.+?)(?<!_)\3(?!_)/g;
  while ((match = italicRegex.exec(lineText)) !== null) {
    const fullMatch = match[0];
    const content = match[2] || match[4];
    if (!content) continue;
    const from = lineFrom + match.index;
    const to = from + fullMatch.length;

    // Check if this overlaps with a bold decoration
    const overlaps = decorations.some(
      (d) => (from >= d.from && from < d.to) || (to > d.from && to <= d.to)
    );
    if (overlaps) continue;

    decorations.push({
      from,
      to,
      decoration: Decoration.replace({
        widget: new FormattedTextWidget(content, 'cm-ir-italic'),
      }),
    });
  }

  // Strikethrough
  const strikethroughRegex = /~~(.+?)~~/g;
  while ((match = strikethroughRegex.exec(lineText)) !== null) {
    const fullMatch = match[0];
    const content = match[1];
    const from = lineFrom + match.index;
    const to = from + fullMatch.length;

    decorations.push({
      from,
      to,
      decoration: Decoration.replace({
        widget: new FormattedTextWidget(content, 'cm-ir-strikethrough'),
      }),
    });
  }

  // Inline code
  const codeRegex = /`([^`\n]+)`/g;
  while ((match = codeRegex.exec(lineText)) !== null) {
    const fullMatch = match[0];
    const content = match[1];
    const from = lineFrom + match.index;
    const to = from + fullMatch.length;

    decorations.push({
      from,
      to,
      decoration: Decoration.replace({
        widget: new FormattedTextWidget(content, 'cm-ir-code'),
      }),
    });
  }

  // Links [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  while ((match = linkRegex.exec(lineText)) !== null) {
    const fullMatch = match[0];
    const text = match[1];
    const url = match[2];
    const from = lineFrom + match.index;
    const to = from + fullMatch.length;

    decorations.push({
      from,
      to,
      decoration: Decoration.replace({
        widget: new LinkWidget(text, url),
      }),
    });
  }
}

/**
 * Create decorations for a document
 */
function createInstantRenderDecorations(view: EditorView): DecorationSet {
  const decorations: Array<{ from: number; to: number; decoration: Decoration }> = [];
  const doc = view.state.doc;

  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i);
    const lineText = line.text;
    const lineFrom = line.from;

    // Skip active line - show raw markdown
    if (isActiveLine(view, i)) {
      continue;
    }

    // Headers: # to ######
    const headerMatch = lineText.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const content = headerMatch[2];

      decorations.push({
        from: lineFrom,
        to: line.to,
        decoration: Decoration.replace({
          widget: new HeaderWidget(content, level),
        }),
      });
      continue;
    }

    // Horizontal rule: --- or *** or ___
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(lineText.trim())) {
      decorations.push({
        from: lineFrom,
        to: line.to,
        decoration: Decoration.replace({
          widget: new HorizontalRuleWidget(),
        }),
      });
      continue;
    }

    // Block quotes: > text
    const blockquoteMatch = lineText.match(/^(>\s*)(.*)$/);
    if (blockquoteMatch) {
      const prefix = blockquoteMatch[1];
      const content = blockquoteMatch[2];

      // Hide the > prefix
      decorations.push({
        from: lineFrom,
        to: lineFrom + prefix.length,
        decoration: Decoration.replace({}),
      });

      // Style the line as blockquote
      decorations.push({
        from: lineFrom,
        to: line.to,
        decoration: Decoration.line({ class: 'cm-ir-blockquote-line' }),
      });

      // Parse inline markdown in the content
      if (content) {
        parseInlineMarkdown(content, lineFrom + prefix.length, decorations);
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
      const bulletTo = bulletFrom + bullet.length + 1; // +1 for space

      // Replace bullet with styled bullet
      decorations.push({
        from: bulletFrom,
        to: bulletTo,
        decoration: Decoration.replace({
          widget: new FormattedTextWidget('\u2022 ', 'cm-ir-bullet'),
        }),
      });

      // Parse inline markdown in content
      if (content) {
        parseInlineMarkdown(content, bulletTo, decorations);
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
      const numTo = numFrom + number.length + 2; // +2 for ". "

      // Style the number
      decorations.push({
        from: numFrom,
        to: numTo,
        decoration: Decoration.replace({
          widget: new FormattedTextWidget(`${number}. `, 'cm-ir-list-number'),
        }),
      });

      // Parse inline markdown in content
      if (content) {
        parseInlineMarkdown(content, numTo, decorations);
      }
      continue;
    }

    // Task list: - [ ] or - [x]
    const taskMatch = lineText.match(/^(\s*[-*+])\s+\[([ xX])\]\s+(.*)$/);
    if (taskMatch) {
      const prefix = taskMatch[1];
      const checked = taskMatch[2].toLowerCase() === 'x';
      const content = taskMatch[3];
      const checkboxStart = lineFrom + prefix.length + 1;
      const checkboxEnd = checkboxStart + 3; // [ ] or [x]

      // Replace entire prefix and checkbox with styled checkbox
      decorations.push({
        from: lineFrom,
        to: checkboxEnd + 1, // +1 for space after checkbox
        decoration: Decoration.replace({
          widget: new FormattedTextWidget(
            checked ? '\u2611 ' : '\u2610 ',
            checked ? 'cm-ir-checkbox-checked' : 'cm-ir-checkbox'
          ),
        }),
      });

      // Parse inline markdown in content
      if (content) {
        parseInlineMarkdown(content, checkboxEnd + 1, decorations);
      }
      continue;
    }

    // Parse inline markdown for regular lines
    parseInlineMarkdown(lineText, lineFrom, decorations);
  }

  // Sort decorations by from position and filter overlaps
  decorations.sort((a, b) => a.from - b.from);

  // Build decoration set
  const builder = new RangeSetBuilder<Decoration>();
  let lastTo = 0;

  for (const dec of decorations) {
    // Skip overlapping decorations
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

  // Checkboxes
  '.cm-ir-checkbox': {
    color: 'var(--color-ink-400)',
  },
  '.cm-ir-checkbox-checked': {
    color: 'var(--color-success)',
  },

  // Blockquotes
  '.cm-ir-blockquote-line': {
    borderLeft: '3px solid var(--color-ink-200)',
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
 * Create the instant render extension
 */
export function instantRenderExtension(): Extension[] {
  return [instantRenderPlugin, instantRenderTheme];
}
