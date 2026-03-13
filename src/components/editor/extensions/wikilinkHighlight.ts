import {
  MatchDecorator,
  ViewPlugin,
  Decoration,
  DecorationSet,
  ViewUpdate,
  EditorView,
} from '@codemirror/view';
import { WIKILINK_RE_SOURCE } from '@/lib/wikilinks';

const bracketMark = Decoration.mark({ class: 'cm-wikilink-bracket' });
const titleMark = Decoration.mark({ class: 'cm-wikilink-title' });
const headerMark = Decoration.mark({ class: 'cm-wikilink-header' });
const aliasMark = Decoration.mark({ class: 'cm-wikilink-alias' });
const punctMark = Decoration.mark({ class: 'cm-wikilink-punct' });

const decorator = new MatchDecorator({
  regexp: new RegExp(WIKILINK_RE_SOURCE, 'g'),
  decorate(add, from, to, match) {
    let pos = from;
    // [[
    add(pos, pos + 2, bracketMark); pos += 2;
    // title
    const titleLen = (match[1] ?? '').length;
    add(pos, pos + titleLen, titleMark); pos += titleLen;
    // #header
    if (match[2]) {
      add(pos, pos + 1, punctMark); pos += 1;
      add(pos, pos + match[2].length, headerMark); pos += match[2].length;
    }
    // |alias
    if (match[3]) {
      add(pos, pos + 1, punctMark); pos += 1;
      add(pos, pos + match[3].length, aliasMark);
    }
    // ]]
    add(to - 2, to, bracketMark);
  },
});

export const wikilinkHighlight = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = decorator.createDeco(view);
    }
    update(update: ViewUpdate) {
      this.decorations = decorator.updateDeco(update, this.decorations);
    }
  },
  { decorations: (v) => v.decorations }
);
