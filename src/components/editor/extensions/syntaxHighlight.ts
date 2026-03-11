import { Compartment } from '@codemirror/state';
import type { Extension } from '@codemirror/state';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import type { MarkdownConfig } from '@lezer/markdown';
import { Tag } from '@lezer/highlight';

// Tags defined at module level so NodeSpec.style and HighlightStyle reference
// the same Tag instances.
export const highlightContentTag = Tag.define();
export const highlightMarkTag = Tag.define();

const HighlightDelim = { resolve: 'Highlight', mark: 'HighlightMark' };

// Lezer MarkdownConfig — parser extension for ==text==
export const highlightMarkdownConfig: MarkdownConfig = {
  defineNodes: [
    // Highlight/... covers the node and all its children (content + marks)
    { name: 'Highlight', style: { 'Highlight/...': highlightContentTag } },
    // HighlightMark overrides with the mark tag for == delimiters specifically
    { name: 'HighlightMark', style: highlightMarkTag },
  ],
  parseInline: [{
    name: 'Highlight',
    parse(cx, next, pos) {
      // Require == but not ===
      if (next !== 61 /* = */ || cx.char(pos + 1) !== 61 || cx.char(pos + 2) === 61) return -1;
      return cx.addDelimiter(HighlightDelim, pos, pos + 2, true, true);
    },
  }],
};

const highlightStyle = HighlightStyle.define([
  { tag: highlightContentTag, color: '#3dd6b5', fontWeight: '500' },
  { tag: highlightMarkTag, color: 'rgba(61, 214, 181, 0.45)' },
]);

export const syntaxHighlightCompartment = new Compartment();

export function syntaxHighlightExtension(): Extension {
  return syntaxHighlightCompartment.of(syntaxHighlighting(highlightStyle));
}
