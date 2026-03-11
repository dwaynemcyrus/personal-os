import { Compartment } from '@codemirror/state';
import type { Extension } from '@codemirror/state';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import type { MarkdownConfig } from '@lezer/markdown';
import { Tag } from '@lezer/highlight';

export const footnoteRefTag = Tag.define();
export const footnoteMarkTag = Tag.define();

// Lezer MarkdownConfig — parser extension for [^label] footnote references.
// Footnote definitions ([^label]: text) are block-level and left for a future phase.
export const footnoteMarkdownConfig: MarkdownConfig = {
  defineNodes: [
    { name: 'FootnoteRef', style: { 'FootnoteRef/...': footnoteRefTag } },
    { name: 'FootnoteRefMark', style: footnoteMarkTag },
  ],
  parseInline: [{
    name: 'FootnoteRef',
    parse(cx, next, pos) {
      // Must be [^
      if (next !== 91 /* [ */ || cx.char(pos + 1) !== 94 /* ^ */) return -1;
      // Scan for closing ] on the same line
      for (let i = pos + 2; i < cx.end; i++) {
        const ch = cx.char(i);
        if (ch === 10 /* \n */ || ch === 13 /* \r */) return -1;
        if (ch === 93 /* ] */) {
          return cx.addElement(cx.elt('FootnoteRef', pos, i + 1, [
            cx.elt('FootnoteRefMark', pos, pos + 2),  // [^
            cx.elt('FootnoteRefMark', i, i + 1),       // ]
          ]));
        }
      }
      return -1;
    },
  }],
};

const footnoteStyle = HighlightStyle.define([
  { tag: footnoteRefTag, color: '#a3e635' },
  { tag: footnoteMarkTag, color: 'rgba(163, 230, 53, 0.55)' },
]);

export const syntaxFootnoteCompartment = new Compartment();

export function syntaxFootnoteExtension(): Extension {
  return syntaxFootnoteCompartment.of(syntaxHighlighting(footnoteStyle));
}
