import { Compartment } from '@codemirror/state';
import type { Extension } from '@codemirror/state';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { GFM } from '@lezer/markdown';
import { highlightMarkdownConfig } from './syntaxHighlight';
import { underlineMarkdownConfig } from './syntaxUnderline';
import { superSubMarkdownConfig } from './syntaxSuperSub';
import { footnoteMarkdownConfig } from './syntaxFootnote';
import { mathMarkdownConfig } from './syntaxMath';

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
    // defaultHighlightStyle covers standard markdown nodes (headings, bold,
    // italic, code, etc.). Custom node styles are in their own extensions below.
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  ]);
}
