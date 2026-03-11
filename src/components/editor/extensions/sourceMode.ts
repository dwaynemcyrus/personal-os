import { Compartment } from '@codemirror/state';
import type { Extension } from '@codemirror/state';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { GFM } from '@lezer/markdown';
import { tags } from '@lezer/highlight';
import { highlightMarkdownConfig } from './syntaxHighlight';
import { underlineMarkdownConfig } from './syntaxUnderline';
import { superSubMarkdownConfig } from './syntaxSuperSub';
import { footnoteMarkdownConfig } from './syntaxFootnote';
import { mathMarkdownConfig } from './syntaxMath';

// Dark-mode markdown highlight style. Replaces defaultHighlightStyle (which
// targets light backgrounds) so marks, headings, and inline formatting are
// visible on the #282828 editor background.
const darkMarkdownStyle = HighlightStyle.define([
  // Headings — soft violet, bold, flat size (IA Writer style: hierarchy via
  // colour + weight only; size scaling belongs in rendered mode)
  { tag: [tags.heading1, tags.heading2, tags.heading3, tags.heading4, tags.heading5, tags.heading6], color: '#c792ea', fontWeight: 'bold' },
  // Inline formatting — no colour change, just typographic treatment
  { tag: tags.strong, fontWeight: 'bold' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.strikethrough, textDecoration: 'line-through', color: 'rgba(252,251,248,0.5)' },
  // Inline / fenced code
  { tag: tags.monospace, color: '#7aa2f7', fontFamily: 'monospace', fontSize: '0.9em' },
  // Links
  { tag: tags.link, color: '#73daca' },
  { tag: tags.url, color: '#73daca', textDecoration: 'underline' },
  // Markdown syntax marks: **, *, #, >, -, [ ], etc.
  { tag: tags.processingInstruction, color: 'rgba(252,251,248,0.35)' },
  { tag: tags.meta, color: 'rgba(252,251,248,0.35)' },
  // Blockquote content
  { tag: tags.quote, color: 'rgba(252,251,248,0.65)' },
  // Horizontal rule / thematic break
  { tag: tags.contentSeparator, color: 'rgba(252,251,248,0.3)' },
]);

// sourceModeCompartment wraps the markdown language definition (parser + base
// highlight). Individual syntax highlight styles live in their own Compartments
// (see each syntaxX.ts) and are added at the top level in CodeMirrorEditor.tsx
// so they can be toggled independently.
export const sourceModeCompartment = new Compartment();

export function sourceModeExtension(): Extension {
  return sourceModeCompartment.of([
    markdown({
      base: markdownLanguage,
      extensions: [
        GFM,
        highlightMarkdownConfig,
        underlineMarkdownConfig,
        superSubMarkdownConfig,
        footnoteMarkdownConfig,
        mathMarkdownConfig,
      ],
    }),
    syntaxHighlighting(darkMarkdownStyle),
  ]);
}
