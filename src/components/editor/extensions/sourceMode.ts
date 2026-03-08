import { Compartment } from '@codemirror/state';
import type { Extension } from '@codemirror/state';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { GFM } from '@lezer/markdown';

export const sourceModeCompartment = new Compartment();

export function sourceModeExtension(): Extension {
  return sourceModeCompartment.of([
    markdown({
      base: markdownLanguage,
      extensions: [GFM],
    }),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  ]);
}
