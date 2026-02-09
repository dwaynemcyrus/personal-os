import { Extension, RangeSetBuilder, StateField } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView } from '@codemirror/view';

const FRONTMATTER_DELIMITER = /^---\s*$/;
const FRONTMATTER_END = /^(---|\.\.\.)\s*$/;

type FrontmatterRange = {
  startLine: number;
  endLine: number;
  startPos: number;
  endPos: number;
};

type DocLike = {
  line: (n: number) => { from: number; to: number; text: string; number: number };
  lines: number;
};

const findFrontmatterRange = (doc: DocLike): FrontmatterRange | null => {
  if (doc.lines < 2) return null;
  if (!FRONTMATTER_DELIMITER.test(doc.line(1).text)) return null;

  for (let i = 2; i <= doc.lines; i += 1) {
    if (FRONTMATTER_END.test(doc.line(i).text)) {
      const startLine = doc.line(1);
      const endLine = doc.line(i);
      const endPos = endLine.number < doc.lines ? endLine.to + 1 : endLine.to;
      return { startLine: 1, endLine: i, startPos: startLine.from, endPos };
    }
  }

  return null;
};

const buildFrontmatterDecorations = (doc: DocLike): DecorationSet => {
  const range = findFrontmatterRange(doc);
  if (!range) {
    return Decoration.none;
  }

  const lineBuilder = new RangeSetBuilder<Decoration>();
  for (let lineNumber = range.startLine; lineNumber <= range.endLine; lineNumber += 1) {
    const line = doc.line(lineNumber);
    lineBuilder.add(
      line.from,
      line.from,
      Decoration.line({ class: 'cm-frontmatter-hidden' })
    );
  }

  return lineBuilder.finish();
};

const buildFrontmatterAtomicRanges = (doc: DocLike): DecorationSet => {
  const range = findFrontmatterRange(doc);
  if (!range) {
    return Decoration.none;
  }

  const atomicBuilder = new RangeSetBuilder<Decoration>();
  atomicBuilder.add(range.startPos, range.endPos, Decoration.mark({}));
  return atomicBuilder.finish();
};

const frontmatterDecorationsField = StateField.define<DecorationSet>({
  create(state) {
    return buildFrontmatterDecorations(state.doc);
  },
  update(value, tr) {
    if (tr.docChanged) {
      return buildFrontmatterDecorations(tr.state.doc);
    }
    return value;
  },
  provide: (field) => EditorView.decorations.from(field),
});

const frontmatterAtomicField = StateField.define<DecorationSet>({
  create(state) {
    return buildFrontmatterAtomicRanges(state.doc);
  },
  update(value, tr) {
    if (tr.docChanged) {
      return buildFrontmatterAtomicRanges(tr.state.doc);
    }
    return value;
  },
});

const frontmatterTheme = EditorView.theme({
  '.cm-frontmatter-hidden': {
    display: 'none !important',
  },
});

export const frontmatterExtension = (): Extension[] => [
  frontmatterDecorationsField,
  frontmatterAtomicField,
  EditorView.atomicRanges.of((view) => view.state.field(frontmatterAtomicField)),
  frontmatterTheme,
];
