/**
 * Focus Mode CodeMirror Extension
 *
 * Dims everything except the current sentence, paragraph, or line.
 * Creates a distraction-free writing experience like iA Writer.
 */

import { Extension, Facet } from '@codemirror/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
} from '@codemirror/view';

export type FocusLevel = 'line' | 'sentence' | 'paragraph';

export type FocusConfig = {
  level: FocusLevel;
  intensity: number; // 0-1, where lower = more dimmed
};

/**
 * Facet to configure focus mode
 */
export const focusConfigFacet = Facet.define<FocusConfig, FocusConfig>({
  combine: (values) => values[0] ?? { level: 'sentence', intensity: 0.3 },
});

/**
 * Find the active range based on focus level
 */
function findActiveRange(
  view: EditorView,
  level: FocusLevel
): { from: number; to: number } | null {
  const doc = view.state.doc;
  const pos = view.state.selection.main.head;
  const text = doc.toString();

  switch (level) {
    case 'line': {
      const line = doc.lineAt(pos);
      return { from: line.from, to: line.to };
    }

    case 'sentence': {
      // Find sentence boundaries (. ! ? followed by space or end)
      let sentenceStart = pos;
      while (sentenceStart > 0) {
        const char = text[sentenceStart - 1];
        if ((char === '.' || char === '!' || char === '?') &&
            (sentenceStart === 1 || /\s/.test(text[sentenceStart] || ''))) {
          break;
        }
        sentenceStart--;
      }
      // Skip leading whitespace
      while (sentenceStart < pos && /\s/.test(text[sentenceStart])) {
        sentenceStart++;
      }

      let sentenceEnd = pos;
      while (sentenceEnd < text.length) {
        const char = text[sentenceEnd];
        if (char === '.' || char === '!' || char === '?') {
          sentenceEnd++;
          break;
        }
        sentenceEnd++;
      }

      return { from: sentenceStart, to: sentenceEnd };
    }

    case 'paragraph': {
      // Find paragraph boundaries (empty lines)
      let paraStart = pos;
      while (paraStart > 0) {
        const line = doc.lineAt(paraStart);
        if (line.text.trim() === '' && paraStart !== pos) {
          paraStart = line.to + 1;
          break;
        }
        if (line.from === 0) {
          paraStart = 0;
          break;
        }
        paraStart = line.from - 1;
      }

      let paraEnd = pos;
      while (paraEnd < doc.length) {
        const line = doc.lineAt(paraEnd);
        if (line.text.trim() === '') {
          paraEnd = line.from;
          break;
        }
        if (line.to >= doc.length) {
          paraEnd = doc.length;
          break;
        }
        paraEnd = line.to + 1;
      }

      return { from: Math.max(0, paraStart), to: Math.min(doc.length, paraEnd) };
    }

    default:
      return null;
  }
}

/**
 * Build decorations to dim unfocused text
 */
function buildFocusDecorations(view: EditorView): DecorationSet {
  const config = view.state.facet(focusConfigFacet);
  const doc = view.state.doc;
  const activeRange = findActiveRange(view, config.level);

  if (!activeRange) return Decoration.none;

  const decorations: Array<{ from: number; to: number; decoration: Decoration }> = [];

  // Dim everything before active range
  if (activeRange.from > 0) {
    decorations.push({
      from: 0,
      to: activeRange.from,
      decoration: Decoration.mark({
        class: 'cm-focus-dimmed',
        attributes: { style: `opacity: ${config.intensity}` },
      }),
    });
  }

  // Dim everything after active range
  if (activeRange.to < doc.length) {
    decorations.push({
      from: activeRange.to,
      to: doc.length,
      decoration: Decoration.mark({
        class: 'cm-focus-dimmed',
        attributes: { style: `opacity: ${config.intensity}` },
      }),
    });
  }

  return Decoration.set(
    decorations.map((d) => d.decoration.range(d.from, d.to)),
    true
  );
}

/**
 * Focus mode view plugin
 */
const focusPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildFocusDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.selectionSet) {
        this.decorations = buildFocusDecorations(update.view);
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

/**
 * Theme styles for focus mode
 */
const focusTheme = EditorView.theme({
  '.cm-focus-dimmed': {
    transition: 'opacity 0.2s ease',
  },
});

/**
 * Create focus mode extension with configuration
 */
export function focusExtension(level: FocusLevel, intensity: number = 0.3): Extension[] {
  return [
    focusConfigFacet.of({ level, intensity }),
    focusPlugin,
    focusTheme,
  ];
}
