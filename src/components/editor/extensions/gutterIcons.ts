import { Compartment } from '@codemirror/state';
import type { EditorState, Extension } from '@codemirror/state';
import {
  EditorView,
  ViewPlugin,
  ViewUpdate,
  Decoration,
  DecorationSet,
  GutterMarker,
  gutter,
} from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import type { SyntaxNodeRef } from '@lezer/common';
import { GUTTER_WIDTH, CONTENT_PADDING_LEFT } from './layoutBase';

// ─── Block type model ────────────────────────────────────────────────────────

export type BlockType =
  | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  | 'bullet' | 'ordered' | 'task-open' | 'task-done'
  | 'blockquote' | 'frontmatter';

export interface LineBlock {
  type: BlockType;
  /** Document ranges of the raw mark characters to suppress. */
  marks: Array<{ from: number; to: number }>;
  orderNum?: number;
}

// ─── Syntax tree helpers ─────────────────────────────────────────────────────

/** Return the block info for the text line starting at lineFrom, or null. */
export function getLineBlock(state: EditorState, lineFrom: number): LineBlock | null {
  const line = state.doc.lineAt(lineFrom);
  const tree = syntaxTree(state);
  let result: LineBlock | null = null;

  tree.iterate({
    from: line.from,
    to: line.to,
    enter(node: SyntaxNodeRef) {
      if (result) return false;

      if (node.name === 'ATXHeadingMark') {
        const parent = node.node.parent;
        const level = parent ? parseInt(parent.name.replace('ATXHeading', ''), 10) : 1;
        result = {
          type: `h${level}` as BlockType,
          marks: [{ from: node.from, to: node.to }],
        };
        return false;
      }

      if (node.name === 'ListMark') {
        const listItem = node.node.parent;
        const list = listItem?.parent;

        if (list?.name === 'OrderedList') {
          const markText = state.doc.sliceString(node.from, node.to);
          const num = parseInt(markText.trim(), 10);
          result = {
            type: 'ordered',
            marks: [{ from: node.from, to: node.to }],
            orderNum: isNaN(num) ? 1 : num,
          };
          return false;
        }

        if (list?.name === 'BulletList') {
          const task = listItem?.getChild('Task');
          const taskMarker = task?.getChild('TaskMarker');
          if (taskMarker) {
            const markerText = state.doc.sliceString(taskMarker.from, taskMarker.to);
            const isDone = /\[x\]/i.test(markerText);
            result = {
              type: isDone ? 'task-done' : 'task-open',
              marks: [
                { from: node.from, to: node.to },
                { from: taskMarker.from, to: taskMarker.to },
              ],
            };
          } else {
            result = {
              type: 'bullet',
              marks: [{ from: node.from, to: node.to }],
            };
          }
          return false;
        }
      }

      if (node.name === 'QuoteMark') {
        result = {
          type: 'blockquote',
          marks: [{ from: node.from, to: node.to }],
        };
        return false;
      }
    },
  });

  if (!result) result = detectFrontmatter(state, line.from);
  return result;
}

/** Show the frontmatter collapse icon only on the opening --- line. */
function detectFrontmatter(state: EditorState, lineFrom: number): LineBlock | null {
  if (state.doc.lines < 3) return null;
  const firstLine = state.doc.line(1);
  if (firstLine.text.trim() !== '---') return null;
  if (lineFrom !== firstLine.from) return null;
  // Confirm there is a closing --- within a reasonable range
  for (let i = 2; i <= Math.min(state.doc.lines, 60); i++) {
    const ln = state.doc.line(i);
    if (ln.text.trim() === '---' || ln.text.trim() === '...') {
      return { type: 'frontmatter', marks: [] };
    }
  }
  return null;
}

// ─── Gutter markers ──────────────────────────────────────────────────────────

function makeMarkerEl(label: string, ariaLabel: string, extraClass = ''): HTMLElement {
  const el = document.createElement('div');
  el.className = `cm-bear-gutter-marker${extraClass ? ` ${extraClass}` : ''}`;
  el.setAttribute('aria-label', ariaLabel);
  el.setAttribute('role', 'img');
  el.textContent = label;
  return el;
}

class SimpleGutterMarker extends GutterMarker {
  constructor(
    private label: string,
    private ariaLabel: string,
    private extraClass = '',
  ) { super(); }
  toDOM() { return makeMarkerEl(this.label, this.ariaLabel, this.extraClass); }
  eq(other: SimpleGutterMarker) {
    return other.label === this.label && other.extraClass === this.extraClass;
  }
}

class HeadingGutterMarker extends GutterMarker {
  constructor(private level: number) { super(); }
  toDOM() {
    return makeMarkerEl(`H${this.level}`, `Heading level ${this.level}`, 'cm-bear-gutter-heading');
  }
  eq(other: HeadingGutterMarker) { return other.level === this.level; }
}

class OrderedGutterMarker extends GutterMarker {
  constructor(private num: number) { super(); }
  toDOM() {
    return makeMarkerEl(`${this.num}.`, `Ordered list item ${this.num}`, 'cm-bear-gutter-ordered');
  }
  eq(other: OrderedGutterMarker) { return other.num === this.num; }
}

// Singletons for fixed icons
const bulletMarker      = new SimpleGutterMarker('●', 'Bullet list item', 'cm-bear-gutter-bullet');
const taskOpenMarker    = new SimpleGutterMarker('☐', 'Incomplete task', 'cm-bear-gutter-task');
const taskDoneMarker    = new SimpleGutterMarker('☑', 'Completed task',  'cm-bear-gutter-task');
const blockquoteMarker  = new SimpleGutterMarker('▏', 'Blockquote',       'cm-bear-gutter-blockquote');
const frontmatterMarker = new SimpleGutterMarker('⋯', 'Frontmatter',      'cm-bear-gutter-frontmatter');

const headingMarkerCache: HeadingGutterMarker[] = [
  null!,
  ...Array.from({ length: 6 }, (_, i) => new HeadingGutterMarker(i + 1)),
];

const orderedMarkerCache = new Map<number, OrderedGutterMarker>();
function getOrderedMarker(num: number) {
  if (!orderedMarkerCache.has(num)) orderedMarkerCache.set(num, new OrderedGutterMarker(num));
  return orderedMarkerCache.get(num)!;
}

function blockToMarker(block: LineBlock): GutterMarker | null {
  switch (block.type) {
    case 'h1': return headingMarkerCache[1];
    case 'h2': return headingMarkerCache[2];
    case 'h3': return headingMarkerCache[3];
    case 'h4': return headingMarkerCache[4];
    case 'h5': return headingMarkerCache[5];
    case 'h6': return headingMarkerCache[6];
    case 'bullet':     return bulletMarker;
    case 'ordered':    return getOrderedMarker(block.orderNum ?? 1);
    case 'task-open':  return taskOpenMarker;
    case 'task-done':  return taskDoneMarker;
    case 'blockquote': return blockquoteMarker;
    case 'frontmatter':return frontmatterMarker;
    default:           return null;
  }
}

// ─── Atomic decorations + line class decorations ─────────────────────────────

const atomicMark = Decoration.replace({ atomic: true });

function headingLineDeco(level: number) {
  return Decoration.line({ class: `cm-bear-heading-${level}` });
}
const taskDoneLineDeco   = Decoration.line({ class: 'cm-bear-task-done' });
const blockquoteLineDeco = Decoration.line({ class: 'cm-bear-blockquote' });

function buildDecorations(view: EditorView): DecorationSet {
  const { state } = view;
  const tree = syntaxTree(state);
  // Collect ranges; use a flat array then sort before building the set.
  const decos: { from: number; to: number; deco: Decoration }[] = [];

  // Helper: add one entry, avoiding duplicates on same position+type
  function addDeco(from: number, to: number | undefined, deco: Decoration) {
    decos.push({ from, to: to ?? from, deco });
  }

  tree.iterate({
    from: view.viewport.from,
    to: view.viewport.to,
    enter(node: SyntaxNodeRef) {
      if (node.name === 'ATXHeadingMark') {
        const line = state.doc.lineAt(node.from);
        const parent = node.node.parent;
        const level = parent ? parseInt(parent.name.replace('ATXHeading', ''), 10) : 1;
        addDeco(node.from, node.to, atomicMark);
        addDeco(line.from, undefined, headingLineDeco(level));
        return false;
      }

      if (node.name === 'ListMark') {
        const listItem = node.node.parent;
        const list = listItem?.parent;

        if (list?.name === 'BulletList') {
          const task = listItem?.getChild('Task');
          const taskMarker = task?.getChild('TaskMarker');
          if (taskMarker) {
            const markerText = state.doc.sliceString(taskMarker.from, taskMarker.to);
            const isDone = /\[x\]/i.test(markerText);
            // Suppress ListMark (-) and TaskMarker ([ ] or [x])
            addDeco(node.from, node.to, atomicMark);
            addDeco(taskMarker.from, taskMarker.to, atomicMark);
            const line = state.doc.lineAt(node.from);
            if (isDone) addDeco(line.from, undefined, taskDoneLineDeco);
          } else {
            addDeco(node.from, node.to, atomicMark);
          }
          return false;
        }

        if (list?.name === 'OrderedList') {
          addDeco(node.from, node.to, atomicMark);
          return false;
        }
      }

      if (node.name === 'QuoteMark') {
        const line = state.doc.lineAt(node.from);
        addDeco(node.from, node.to, atomicMark);
        addDeco(line.from, undefined, blockquoteLineDeco);
        return false;
      }
    },
  });

  if (decos.length === 0) return Decoration.none;

  // Sort: by from asc, then line decos (to === from) before range decos
  decos.sort((a, b) => a.from - b.from || (a.to === a.from ? -1 : 1));

  return Decoration.set(decos.map(({ from, to, deco }) =>
    from === to ? deco.range(from) : deco.range(from, to),
  ));
}

// ─── ViewPlugin ───────────────────────────────────────────────────────────────

class GutterIconsPlugin {
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

const gutterIconsPlugin = ViewPlugin.fromClass(GutterIconsPlugin, {
  decorations: (v) => v.decorations,
});

// ─── CM6 gutter ──────────────────────────────────────────────────────────────

const bearGutter = gutter({
  class: 'cm-bear-gutter',
  lineMarker(view, line) {
    const block = getLineBlock(view.state, line.from);
    return block ? blockToMarker(block) : null;
  },
  lineMarkerChange(update) {
    return update.docChanged;
  },
  renderEmptyElements: false,
});

// ─── Theme ───────────────────────────────────────────────────────────────────

const gutterTheme = EditorView.theme({
  // Gutter column sizing
  '.cm-bear-gutter': {
    minWidth: `${GUTTER_WIDTH}px`,
    width: `${GUTTER_WIDTH}px`,
  },
  '.cm-gutters': {
    border: 'none',
    background: 'transparent',
  },
  // Marker base style — min 44px touch target height
  '.cm-bear-gutter-marker': {
    width: `${GUTTER_WIDTH}px`,
    minHeight: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: '600',
    color: 'rgba(252,251,248,0.38)',
    cursor: 'default',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    letterSpacing: '0',
  },
  // Per-type colour accents
  '.cm-bear-gutter-heading': { color: '#c792ea', fontSize: '10px', fontWeight: '700' },
  '.cm-bear-gutter-bullet':  { color: 'rgba(252,251,248,0.55)', fontSize: '10px' },
  '.cm-bear-gutter-task':    { color: 'rgba(252,251,248,0.55)', fontSize: '16px' },
  '.cm-bear-gutter-blockquote': { color: 'rgba(252,251,248,0.38)', fontSize: '16px' },
  '.cm-bear-gutter-frontmatter': { color: 'rgba(252,251,248,0.38)', fontSize: '14px' },
  // Heading line decorations — size scaling in rendered mode
  '.cm-bear-heading-1': { fontSize: '1.5em',  fontWeight: 'bold', color: '#c792ea', lineHeight: '1.3' },
  '.cm-bear-heading-2': { fontSize: '1.3em',  fontWeight: 'bold', color: '#c792ea', lineHeight: '1.3' },
  '.cm-bear-heading-3': { fontSize: '1.15em', fontWeight: 'bold', color: '#c792ea', lineHeight: '1.3' },
  '.cm-bear-heading-4': { fontWeight: 'bold', color: '#c792ea' },
  '.cm-bear-heading-5': { fontWeight: 'bold', color: '#c792ea' },
  '.cm-bear-heading-6': { fontWeight: 'bold', color: '#c792ea' },
  // Task done — strike through content
  '.cm-bear-task-done': {
    textDecoration: 'line-through',
    color: 'rgba(252,251,248,0.4)',
  },
  // Blockquote — left accent border
  '.cm-bear-blockquote': {
    borderLeft: `3px solid rgba(252,251,248,0.22)`,
    paddingLeft: `${CONTENT_PADDING_LEFT}px`,
    color: 'rgba(252,251,248,0.7)',
  },
});

// ─── Export ──────────────────────────────────────────────────────────────────

export const gutterIconsCompartment = new Compartment();

/** Inner extension — pass to gutterIconsCompartment.of() or .reconfigure(). */
export function gutterIconsExtension(): Extension {
  return [bearGutter, gutterIconsPlugin, gutterTheme];
}
