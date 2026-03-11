import { Compartment } from '@codemirror/state';
import type { EditorState, Extension } from '@codemirror/state';
import {
  EditorView,
  ViewPlugin,
  ViewUpdate,
  Decoration,
  DecorationSet,
  GutterMarker,
  WidgetType,
  gutter,
} from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import type { SyntaxNodeRef } from '@lezer/common';
import { GUTTER_WIDTH, CONTENT_PADDING_LEFT } from './layoutBase';

// ─── Task token model ─────────────────────────────────────────────────────────

const TASK_CYCLE = [' ', 'x', 'i', '!', '?', '*', '>', '<'] as const;
type TaskToken = typeof TASK_CYCLE[number];

const TASK_META: Record<string, { emoji: string; label: string }> = {
  ' ': { emoji: '⬜️', label: 'Incomplete task' },
  'x': { emoji: '✅', label: 'Completed task' },
  'i': { emoji: '🧠', label: 'Idea' },
  '!': { emoji: '⚠️', label: 'Urgent' },
  '?': { emoji: '❓', label: 'Question' },
  '*': { emoji: '⭐', label: 'Important' },
  '>': { emoji: '➡️', label: 'Forwarded' },
  '<': { emoji: '📅', label: 'Scheduled' },
};

function nextTaskToken(current: string): string {
  const idx = TASK_CYCLE.indexOf(current as TaskToken);
  return TASK_CYCLE[(idx === -1 ? 0 : idx + 1) % TASK_CYCLE.length];
}

// ─── Block type model ────────────────────────────────────────────────────────

export type BlockType =
  | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  | 'bullet' | 'ordered'
  | 'task' // token stored separately
  | 'blockquote' | 'frontmatter';

export interface LineBlock {
  type: BlockType;
  /** Document ranges of the raw mark characters to suppress. */
  marks: Array<{ from: number; to: number }>;
  orderNum?: number;
  /** For type === 'task': the raw token character (' ', 'x', 'i', etc.) */
  taskToken?: string;
}

// ─── Inline widget types ──────────────────────────────────────────────────────

class OrderedWidget extends WidgetType {
  constructor(private num: number) { super(); }
  toDOM() {
    const el = document.createElement('span');
    el.className = 'cm-bear-ordered-widget';
    el.textContent = `${this.num}.`;
    el.setAttribute('aria-hidden', 'true');
    return el;
  }
  eq(other: OrderedWidget) { return other.num === this.num; }
}

const orderedWidgetCache = new Map<number, OrderedWidget>();
function getOrderedWidget(num: number) {
  if (!orderedWidgetCache.has(num)) orderedWidgetCache.set(num, new OrderedWidget(num));
  return orderedWidgetCache.get(num)!;
}

class TaskWidget extends WidgetType {
  constructor(
    private token: string,
    private lineFrom: number,
  ) { super(); }

  toDOM(view: EditorView) {
    const meta = TASK_META[this.token] ?? TASK_META[' '];
    const el = document.createElement('span');
    el.className = 'cm-bear-task-widget';
    el.textContent = meta.emoji;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', meta.label);
    el.setAttribute('title', meta.label);

    el.addEventListener('mousedown', (e) => {
      // Prevent focus loss on click
      e.preventDefault();
    });

    el.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const line = view.state.doc.lineAt(this.lineFrom);
      // Match `prefix[token]` to find the exact bracket content position
      const m = line.text.match(/^(\s*(?:[-*+]|\d+\.)\s+\[)([ xXiI!?*><])/);
      if (!m) return;
      const tokenPos = line.from + m[1].length;
      const next = nextTaskToken(this.token);
      view.dispatch({
        changes: { from: tokenPos, to: tokenPos + 1, insert: next },
      });
    });

    return el;
  }

  eq(other: TaskWidget) {
    return other.token === this.token && other.lineFrom === this.lineFrom;
  }

  // Allow CM to process events (cursor positioning) but our click handler
  // calls stopPropagation so CM won't receive it after the toggle
  ignoreEvent() { return false; }
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
            // Lezer recognises [ ] and [x] as GFM TaskMarker
            const markerText = state.doc.sliceString(taskMarker.from, taskMarker.to);
            const tokenMatch = markerText.match(/\[([ xXiI!?*><])\]/);
            const token = tokenMatch ? tokenMatch[1].toLowerCase() : ' ';
            const trailingEnd = Math.min(taskMarker.to + 1, line.to);
            result = {
              type: 'task',
              taskToken: token,
              marks: [
                { from: node.from, to: node.to },
                { from: taskMarker.from, to: trailingEnd },
              ],
            };
          } else {
            // Lezer does NOT recognise custom tokens ([i], [!], etc.) as TaskMarker.
            // Fall back to regex on the raw line text.
            const customMatch = line.text.match(/^(\s*[-*+]\s+)(\[[ xXiI!?*><]\])/);
            if (customMatch) {
              const token = customMatch[2][1].toLowerCase();
              const markerFrom = line.from + customMatch[1].length;
              const markerTo   = markerFrom + customMatch[2].length;
              const trailingEnd = Math.min(markerTo + 1, line.to);
              result = {
                type: 'task',
                taskToken: token,
                marks: [
                  { from: node.from, to: node.to },
                  { from: markerFrom, to: trailingEnd },
                ],
              };
            }
            // else: plain bullet — no result, raw `-` stays visible
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
  for (let i = 2; i <= Math.min(state.doc.lines, 60); i++) {
    const ln = state.doc.line(i);
    if (ln.text.trim() === '---' || ln.text.trim() === '...') {
      return { type: 'frontmatter', marks: [] };
    }
  }
  return null;
}

// ─── Gutter markers (headings + frontmatter only) ─────────────────────────────

function makeMarkerEl(label: string, ariaLabel: string, extraClass = ''): HTMLElement {
  const el = document.createElement('div');
  el.className = `cm-bear-gutter-marker${extraClass ? ` ${extraClass}` : ''}`;
  el.setAttribute('aria-label', ariaLabel);
  el.setAttribute('role', 'img');
  el.textContent = label;
  return el;
}

class HeadingGutterMarker extends GutterMarker {
  constructor(private level: number) { super(); }
  toDOM() {
    return makeMarkerEl(`H${this.level}`, `Heading level ${this.level}`, 'cm-bear-gutter-heading');
  }
  eq(other: HeadingGutterMarker) { return other.level === this.level; }
}

class FrontmatterGutterMarker extends GutterMarker {
  toDOM() { return makeMarkerEl('⋯', 'Frontmatter', 'cm-bear-gutter-frontmatter'); }
  eq(other: FrontmatterGutterMarker) { return other instanceof FrontmatterGutterMarker; }
}

const frontmatterMarkerInstance = new FrontmatterGutterMarker();

const headingMarkerCache: HeadingGutterMarker[] = [
  null!,
  ...Array.from({ length: 6 }, (_, i) => new HeadingGutterMarker(i + 1)),
];

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
  const decos: { from: number; to: number; deco: Decoration }[] = [];

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
          const line = state.doc.lineAt(node.from);

          if (taskMarker) {
            // Lezer-recognised GFM task ([ ] or [x])
            const markerText = state.doc.sliceString(taskMarker.from, taskMarker.to);
            const tokenMatch = markerText.match(/\[([ xXiI!?*><])\]/);
            const token = tokenMatch ? tokenMatch[1].toLowerCase() : ' ';
            const widgetEnd = Math.min(taskMarker.to + 1, line.to);
            addDeco(
              node.from,
              widgetEnd,
              Decoration.replace({ widget: new TaskWidget(token, line.from) }),
            );
            if (token === 'x') addDeco(line.from, undefined, taskDoneLineDeco);
          } else {
            // Custom task token not recognised by Lezer — check raw line text
            const customMatch = line.text.match(/^(\s*[-*+]\s+)(\[[ xXiI!?*><]\])/);
            if (customMatch) {
              const token = customMatch[2][1].toLowerCase();
              const markerFrom = line.from + customMatch[1].length;
              const markerTo   = markerFrom + customMatch[2].length;
              const widgetEnd  = Math.min(markerTo + 1, line.to);
              addDeco(
                node.from,
                widgetEnd,
                Decoration.replace({ widget: new TaskWidget(token, line.from) }),
              );
            }
            // else: plain bullet — leave raw `-` visible, no decoration
          }
          return false;
        }

        if (list?.name === 'OrderedList') {
          const markText = state.doc.sliceString(node.from, node.to);
          const num = parseInt(markText.trim(), 10);
          addDeco(
            node.from,
            node.to,
            Decoration.replace({ widget: getOrderedWidget(isNaN(num) ? 1 : num) }),
          );
          return false;
        }
      }

      if (node.name === 'QuoteMark') {
        const line = state.doc.lineAt(node.from);
        // Hide the `>` mark atomically, line class provides border-left
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
    if (update.docChanged || update.viewportChanged || update.selectionSet) {
      this.decorations = buildDecorations(update.view);
    }
  }
}

const gutterIconsPlugin = ViewPlugin.fromClass(GutterIconsPlugin, {
  decorations: (v) => v.decorations,
});

// ─── CM6 gutter (headings + frontmatter only) ─────────────────────────────────

const bearGutter = gutter({
  class: 'cm-bear-gutter',
  lineMarker(view, line) {
    const block = getLineBlock(view.state, line.from);
    if (!block) return null;
    switch (block.type) {
      case 'h1': return headingMarkerCache[1];
      case 'h2': return headingMarkerCache[2];
      case 'h3': return headingMarkerCache[3];
      case 'h4': return headingMarkerCache[4];
      case 'h5': return headingMarkerCache[5];
      case 'h6': return headingMarkerCache[6];
      case 'frontmatter': return frontmatterMarkerInstance;
      default: return null;
    }
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
  '.cm-bear-gutter-heading':    { color: '#c792ea', fontSize: '10px', fontWeight: '700' },
  '.cm-bear-gutter-frontmatter': { color: 'rgba(252,251,248,0.38)', fontSize: '14px' },

  // Heading line decorations — size scaling in rendered mode
  '.cm-bear-heading-1': { fontSize: '1.5em',  fontWeight: 'bold', color: '#c792ea', lineHeight: '1.3' },
  '.cm-bear-heading-2': { fontSize: '1.3em',  fontWeight: 'bold', color: '#c792ea', lineHeight: '1.3' },
  '.cm-bear-heading-3': { fontSize: '1.15em', fontWeight: 'bold', color: '#c792ea', lineHeight: '1.3' },
  '.cm-bear-heading-4': { fontWeight: 'bold', color: '#c792ea' },
  '.cm-bear-heading-5': { fontWeight: 'bold', color: '#c792ea' },
  '.cm-bear-heading-6': { fontWeight: 'bold', color: '#c792ea' },

  // Inline ordered number widget
  '.cm-bear-ordered-widget': {
    color: 'rgba(252,251,248,0.7)',
    display: 'inline-block',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    marginRight: '4px',
  },

  // Inline task emoji widget
  '.cm-bear-task-widget': {
    fontSize: '0.64em',
    lineHeight: '1',
    display: 'inline-block',
    cursor: 'pointer',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    marginRight: '4px',
  },

  // Task done — strike through content
  '.cm-bear-task-done': {
    textDecoration: 'line-through',
    color: 'rgba(252,251,248,0.4)',
  },

  // Blockquote — full-height left accent border
  '.cm-bear-blockquote': {
    borderLeft: `3px solid rgba(252,251,248,0.22)`,
    paddingLeft: `${CONTENT_PADDING_LEFT + 8}px`,
    color: 'rgba(252,251,248,0.7)',
  },
});

// ─── Export ──────────────────────────────────────────────────────────────────

export const gutterIconsCompartment = new Compartment();

/** Inner extension — pass to gutterIconsCompartment.of() or .reconfigure(). */
export function gutterIconsExtension(): Extension {
  return [bearGutter, gutterIconsPlugin, gutterTheme];
}
