import { Compartment } from '@codemirror/state';
import type { Extension } from '@codemirror/state';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import type { MarkdownConfig } from '@lezer/markdown';
import { Tag } from '@lezer/highlight';

export const superscriptContentTag = Tag.define();
export const superscriptMarkTag = Tag.define();

const SuperscriptDelim = { resolve: 'Superscript', mark: 'SuperscriptMark' };

// Lezer MarkdownConfig — parser extension for ^text^
// Subscript (_text_) conflicts with italic emphasis and is left as TBD.
export const superSubMarkdownConfig: MarkdownConfig = {
  defineNodes: [
    { name: 'Superscript', style: { 'Superscript/...': superscriptContentTag } },
    { name: 'SuperscriptMark', style: superscriptMarkTag },
  ],
  parseInline: [{
    name: 'Superscript',
    parse(cx, next, pos) {
      if (next !== 94 /* ^ */) return -1;
      return cx.addDelimiter(SuperscriptDelim, pos, pos + 1, true, true);
    },
  }],
};

const superSubStyle = HighlightStyle.define([
  { tag: superscriptContentTag, color: '#fb923c', fontSize: '0.85em', verticalAlign: 'super' },
  { tag: superscriptMarkTag, color: 'rgba(251, 146, 60, 0.45)' },
]);

export const syntaxSuperSubCompartment = new Compartment();

export function syntaxSuperSubExtension(): Extension {
  return syntaxSuperSubCompartment.of(syntaxHighlighting(superSubStyle));
}
