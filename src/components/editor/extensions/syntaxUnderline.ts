import { Compartment } from '@codemirror/state';
import type { Extension } from '@codemirror/state';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import type { MarkdownConfig } from '@lezer/markdown';
import { Tag } from '@lezer/highlight';

export const underlineContentTag = Tag.define();
export const underlineMarkTag = Tag.define();

const UnderlineDelim = { resolve: 'Underline', mark: 'UnderlineMark' };

// Lezer MarkdownConfig — parser extension for ~text~
// Single tilde only — ~~ is already claimed by GFM Strikethrough.
export const underlineMarkdownConfig: MarkdownConfig = {
  defineNodes: [
    { name: 'Underline', style: { 'Underline/...': underlineContentTag } },
    { name: 'UnderlineMark', style: underlineMarkTag },
  ],
  parseInline: [{
    name: 'Underline',
    parse(cx, next, pos) {
      // Single ~ only — bail if the next char is also ~ (that's strikethrough)
      if (next !== 126 /* ~ */ || cx.char(pos + 1) === 126) return -1;
      return cx.addDelimiter(UnderlineDelim, pos, pos + 1, true, true);
    },
  }],
};

const underlineStyle = HighlightStyle.define([
  { tag: underlineContentTag, textDecoration: 'underline', color: '#93c5fd' },
  { tag: underlineMarkTag, color: 'rgba(147, 197, 253, 0.45)' },
]);

export const syntaxUnderlineCompartment = new Compartment();

export function syntaxUnderlineExtension(): Extension {
  return syntaxUnderlineCompartment.of(syntaxHighlighting(underlineStyle));
}
