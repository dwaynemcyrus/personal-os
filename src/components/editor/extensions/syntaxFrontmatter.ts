import type { Extension } from '@codemirror/state';
import { RangeSetBuilder } from '@codemirror/state';
import {
  EditorView,
  ViewPlugin,
  ViewUpdate,
  Decoration,
  DecorationSet,
} from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

// ─── Mark decorations ─────────────────────────────────────────────────────────

const d = {
  delimiter: Decoration.mark({ class: 'cm-yaml-delim' }),
  key:       Decoration.mark({ class: 'cm-yaml-key' }),
  sep:       Decoration.mark({ class: 'cm-yaml-sep' }),
  string:    Decoration.mark({ class: 'cm-yaml-string' }),
  number:    Decoration.mark({ class: 'cm-yaml-number' }),
  bool:      Decoration.mark({ class: 'cm-yaml-bool' }),
  comment:   Decoration.mark({ class: 'cm-yaml-comment' }),
  bullet:    Decoration.mark({ class: 'cm-yaml-bullet' }),
};

// ─── Frontmatter detection ────────────────────────────────────────────────────

function frontmatterLineRange(state: EditorView['state']): [number, number] | null {
  if (state.doc.lines < 3) return null;
  if (state.doc.line(1).text.trim() !== '---') return null;
  for (let i = 2; i <= Math.min(state.doc.lines, 60); i++) {
    const t = state.doc.line(i).text.trim();
    if (t === '---' || t === '...') return [1, i];
  }
  return null;
}

// ─── Value token classifier ───────────────────────────────────────────────────

function valueDeco(value: string): typeof d[keyof typeof d] {
  const t = value.trim();
  if (!t) return d.string;
  // Booleans / null
  if (/^(true|false|null|yes|no|on|off)$/i.test(t)) return d.bool;
  // Numbers and ISO dates
  if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(t) || /^\d{4}-\d{2}-\d{2}/.test(t)) return d.number;
  // Everything else treated as a string
  return d.string;
}

// ─── Decoration builder ───────────────────────────────────────────────────────

function buildDecorations(view: EditorView): DecorationSet {
  const { state } = view;
  const range = frontmatterLineRange(state);
  if (!range) return Decoration.none;
  const [startLine, endLine] = range;

  const builder = new RangeSetBuilder<Decoration>();

  for (let i = startLine; i <= endLine; i++) {
    const line = state.doc.line(i);
    const text = line.text;
    const base = line.from;

    // --- / ... delimiter lines
    const trimmed = text.trim();
    if (trimmed === '---' || trimmed === '...') {
      builder.add(base, base + text.length, d.delimiter);
      continue;
    }

    // Comment line
    const commentIdx = text.search(/^\s*#/);
    if (commentIdx !== -1) {
      const start = text.length - text.trimStart().length;
      builder.add(base + start, base + text.length, d.comment);
      continue;
    }

    // Array item:  - value
    const arrMatch = text.match(/^(\s*)(-)( +)(.*)?$/);
    if (arrMatch) {
      const indent = arrMatch[1].length;
      const bulletEnd = indent + 1;
      builder.add(base + indent, base + bulletEnd, d.bullet);
      const value = arrMatch[4] ?? '';
      if (value.length) {
        const valueFrom = base + indent + 1 + arrMatch[3].length;
        builder.add(valueFrom, base + text.length, valueDeco(value));
      }
      continue;
    }

    // Key-value:  key: value
    const kvMatch = text.match(/^(\s*)([\w][\w .-]*)(\s*:\s?)(.*)?$/);
    if (kvMatch) {
      const indent = kvMatch[1].length;
      const keyEnd = indent + kvMatch[2].length;
      const sepEnd = keyEnd + kvMatch[3].length;
      const value = kvMatch[4] ?? '';

      builder.add(base + indent, base + keyEnd, d.key);
      builder.add(base + keyEnd, base + sepEnd, d.sep);
      if (value.length) {
        builder.add(base + sepEnd, base + text.length, valueDeco(value));
      }
    }
  }

  return builder.finish();
}

// ─── ViewPlugin ───────────────────────────────────────────────────────────────

class FrontmatterHighlightPlugin {
  decorations: DecorationSet;
  constructor(view: EditorView) {
    this.decorations = buildDecorations(view);
  }
  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = buildDecorations(update.view);
    }
  }
}

const frontmatterPlugin = ViewPlugin.fromClass(FrontmatterHighlightPlugin, {
  decorations: (v) => v.decorations,
});

// ─── Theme ────────────────────────────────────────────────────────────────────

const frontmatterTheme = EditorView.theme({
  '.cm-yaml-delim':   { color: 'rgba(252,251,248,0.3)' },
  '.cm-yaml-key':     { color: '#7aa2f7' },
  '.cm-yaml-sep':     { color: 'rgba(252,251,248,0.35)' },
  '.cm-yaml-string':  { color: '#9ece6a' },
  '.cm-yaml-number':  { color: '#ff9e64' },
  '.cm-yaml-bool':    { color: '#c792ea' },
  '.cm-yaml-comment': { color: 'rgba(252,251,248,0.35)', fontStyle: 'italic' },
  '.cm-yaml-bullet':  { color: 'rgba(252,251,248,0.35)' },
});

// ─── Export ───────────────────────────────────────────────────────────────────

export function syntaxFrontmatterExtension(): Extension {
  return [frontmatterPlugin, frontmatterTheme];
}
