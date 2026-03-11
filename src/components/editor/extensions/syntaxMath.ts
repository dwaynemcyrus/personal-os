import { Compartment } from '@codemirror/state';
import type { Extension } from '@codemirror/state';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import type { MarkdownConfig } from '@lezer/markdown';
import { Tag } from '@lezer/highlight';

export const inlineMathTag = Tag.define();
export const inlineMathMarkTag = Tag.define();
export const blockMathTag = Tag.define();
export const blockMathMarkTag = Tag.define();

// Lezer MarkdownConfig — parser extension for $...$ inline and $$...$$ block math.
// In source mode: marks the delimiters and content for syntax highlighting only.
// Actual KaTeX rendering is added in Phase 4.
export const mathMarkdownConfig: MarkdownConfig = {
  defineNodes: [
    { name: 'InlineMath', style: { 'InlineMath/...': inlineMathTag } },
    { name: 'InlineMathMark', style: inlineMathMarkTag },
    { name: 'BlockMath', block: true, style: { 'BlockMath/...': blockMathTag } },
    { name: 'BlockMathMark', style: blockMathMarkTag },
  ],

  parseInline: [{
    name: 'InlineMath',
    parse(cx, next, pos) {
      if (next !== 36 /* $ */) return -1;
      const isDouble = cx.char(pos + 1) === 36;
      const delimLen = isDouble ? 2 : 1;
      // Content must not start with a space
      if (cx.char(pos + delimLen) === 32) return -1;

      for (let i = pos + delimLen; i < cx.end; i++) {
        if (cx.char(i) !== 36) continue;
        if (isDouble) {
          if (cx.char(i + 1) === 36) {
            return cx.addElement(cx.elt('InlineMath', pos, i + 2, [
              cx.elt('InlineMathMark', pos, pos + 2),
              cx.elt('InlineMathMark', i, i + 2),
            ]));
          }
        } else {
          // Single $ closing: must not be preceded by a space, must not be followed by $
          if (cx.char(i - 1) !== 32 && cx.char(i + 1) !== 36) {
            return cx.addElement(cx.elt('InlineMath', pos, i + 1, [
              cx.elt('InlineMathMark', pos, pos + 1),
              cx.elt('InlineMathMark', i, i + 1),
            ]));
          }
        }
      }
      return -1;
    },
  }],

  parseBlock: [{
    name: 'BlockMath',
    // Only match a line containing exactly $$
    parse(cx, line) {
      if (line.text !== '$$') return false;
      const blockStart = cx.lineStart;
      const openMarkEnd = blockStart + 2;

      while (cx.nextLine()) {
        if (line.text === '$$') {
          const closeMarkStart = cx.lineStart;
          cx.nextLine();
          cx.addElement(cx.elt('BlockMath', blockStart, cx.prevLineEnd(), [
            cx.elt('BlockMathMark', blockStart, openMarkEnd),
            cx.elt('BlockMathMark', closeMarkStart, closeMarkStart + 2),
          ]));
          return true;
        }
      }
      // No closing $$ found — don't claim this block
      return false;
    },
  }],
};

const mathStyle = HighlightStyle.define([
  { tag: inlineMathTag, color: '#fbbf24' },
  { tag: inlineMathMarkTag, color: 'rgba(251, 191, 36, 0.55)' },
  { tag: blockMathTag, color: '#fbbf24' },
  { tag: blockMathMarkTag, color: 'rgba(251, 191, 36, 0.55)', fontWeight: '600' },
]);

export const syntaxMathCompartment = new Compartment();

export function syntaxMathExtension(): Extension {
  return syntaxMathCompartment.of(syntaxHighlighting(mathStyle));
}
