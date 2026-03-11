import { Mark, Extension, mergeAttributes, type Editor, type Range } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import Suggestion from '@tiptap/suggestion';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { computePosition, flip, offset } from '@floating-ui/dom';

// ── Types ─────────────────────────────────────────────────────────────────────

export type WikilinkNavigateCallback = (title: string, exists: boolean) => void;

// ── Wikilink mark ─────────────────────────────────────────────────────────────

export const WikilinkMark = Mark.create<{ onNavigate?: WikilinkNavigateCallback }>({
  name: 'wikilink',
  inclusive: false,
  excludes: '_',

  addOptions() {
    return { onNavigate: undefined };
  },

  addAttributes() {
    return {
      title: { default: null },
      exists: { default: true },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-wikilink]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(
        { 'data-wikilink': HTMLAttributes.title, class: 'wikilink' },
        HTMLAttributes,
      ),
      0,
    ];
  },

  // Click handler — shows a confirmation popover before navigating
  addProseMirrorPlugins() {
    const options = this.options;
    return [
      new Plugin({
        key: new PluginKey('wikilinkClick'),
        props: {
          handleClick(view, _pos, event) {
            const target = event.target as HTMLElement;
            const span = target.closest('[data-wikilink]') as HTMLElement | null;
            if (!span) return false;
            event.preventDefault();
            const title = span.getAttribute('data-wikilink') ?? '';
            if (!title) return false;
            showWikilinkConfirm(span, title, options.onNavigate);
            return true;
          },
        },
      }),
    ];
  },

  // Serializes back to [[title]] in markdown (tiptap-markdown)
  addStorage() {
    return {
      markdown: {
        serialize(state: { write: (s: string) => void; renderContent: (n: unknown) => void }, mark: { attrs: Record<string, unknown> }, parent: unknown, index: number) {
          void parent; void index;
          state.write(`[[${mark.attrs.title}]]`);
        },
        parse: {},
      },
    };
  },
});

// ── Confirmation popover ──────────────────────────────────────────────────────

let activeConfirm: { el: HTMLElement; cleanup: () => void } | null = null;

function showWikilinkConfirm(
  anchor: HTMLElement,
  title: string,
  onNavigate?: WikilinkNavigateCallback,
) {
  // Dismiss any existing confirm
  activeConfirm?.cleanup();

  const el = document.createElement('div');
  Object.assign(el.style, {
    position: 'fixed',
    zIndex: '9999',
    background: '#1e1e1e',
    border: '1px solid rgba(252,251,248,0.15)',
    borderRadius: '10px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    padding: '10px 12px',
    fontFamily: 'var(--font-family-primary, system-ui, sans-serif)',
    fontSize: '13px',
    color: 'rgba(252,251,248,0.85)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    whiteSpace: 'nowrap',
  });

  const label = document.createElement('span');
  label.textContent = title;
  Object.assign(label.style, { maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' });

  const openBtn = document.createElement('button');
  openBtn.textContent = 'Open';
  Object.assign(openBtn.style, {
    background: '#73daca',
    color: '#1e1e1e',
    border: 'none',
    borderRadius: '6px',
    padding: '3px 10px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '12px',
  });
  openBtn.addEventListener('click', () => {
    onNavigate?.(title, true);
    cleanup();
  });

  el.appendChild(label);
  el.appendChild(openBtn);
  document.body.appendChild(el);

  computePosition(anchor, el, {
    placement: 'bottom-start',
    middleware: [offset(6), flip()],
  }).then(({ x, y }) => {
    Object.assign(el.style, { left: `${x}px`, top: `${y}px` });
  });

  function cleanup() {
    el.remove();
    document.removeEventListener('mousedown', outsideClick);
    activeConfirm = null;
  }

  function outsideClick(e: MouseEvent) {
    if (!el.contains(e.target as Node)) cleanup();
  }

  // Slight delay so the click that opened this doesn't immediately close it
  setTimeout(() => document.addEventListener('mousedown', outsideClick), 0);
  activeConfirm = { el, cleanup };
}

// ── Suggestion popup ──────────────────────────────────────────────────────────

type NoteItem = { title: string };

type WikiSuggestionProps = {
  items: NoteItem[];
  command: (item: NoteItem) => void;
};

type WikiSuggestionHandle = {
  onKeyDown: (e: KeyboardEvent) => boolean;
};

const WikiSuggestionPopup = forwardRef<WikiSuggestionHandle, WikiSuggestionProps>(
  ({ items, command }, ref) => {
    const [selected, setSelected] = useState(0);
    useEffect(() => setSelected(0), [items]);

    useImperativeHandle(ref, () => ({
      onKeyDown(e: KeyboardEvent) {
        if (e.key === 'ArrowUp') { setSelected((s) => (s - 1 + items.length) % items.length); return true; }
        if (e.key === 'ArrowDown') { setSelected((s) => (s + 1) % items.length); return true; }
        if (e.key === 'Enter') { if (items[selected]) command(items[selected]); return true; }
        return false;
      },
    }));

    if (items.length === 0) {
      return (
        <div style={popupStyle}>
          <div style={{ padding: '8px 12px', color: 'rgba(252,251,248,0.45)', fontSize: '13px' }}>
            No matching notes
          </div>
        </div>
      );
    }

    return (
      <div style={popupStyle} role="listbox">
        {items.map((item, i) => (
          <button
            key={item.title}
            role="option"
            aria-selected={i === selected}
            style={{ ...itemStyle, ...(i === selected ? itemActiveStyle : {}) }}
            onMouseEnter={() => setSelected(i)}
            onMouseDown={(e) => { e.preventDefault(); command(item); }}
          >
            <span style={{ opacity: 0.5, fontSize: '12px' }}>[[</span>
            {item.title}
            <span style={{ opacity: 0.5, fontSize: '12px' }}>]]</span>
          </button>
        ))}
      </div>
    );
  },
);
WikiSuggestionPopup.displayName = 'WikiSuggestionPopup';

function renderWikiSuggestion() {
  let renderer: ReactRenderer<WikiSuggestionHandle, WikiSuggestionProps>;
  let wrapper: HTMLDivElement;

  return {
    onStart(props: { editor: Editor; clientRect?: (() => DOMRect | null) | null; items: NoteItem[]; command: (item: NoteItem) => void }) {
      wrapper = document.createElement('div');
      document.body.appendChild(wrapper);
      renderer = new ReactRenderer(WikiSuggestionPopup, { props, editor: props.editor });
      wrapper.appendChild(renderer.element);
      positionWrapper(wrapper, props.clientRect);
    },
    onUpdate(props: { clientRect?: (() => DOMRect | null) | null; items: NoteItem[] }) {
      renderer.updateProps(props);
      positionWrapper(wrapper, props.clientRect);
    },
    onKeyDown({ event }: { event: KeyboardEvent }) {
      if (event.key === 'Escape') { cleanup(); return true; }
      return renderer.ref?.onKeyDown(event) ?? false;
    },
    onExit() { cleanup(); },
  };

  function cleanup() {
    renderer?.destroy();
    wrapper?.parentNode?.removeChild(wrapper);
  }
}

function positionWrapper(el: HTMLElement, clientRect?: (() => DOMRect | null) | null) {
  if (!clientRect) return;
  const rect = clientRect();
  if (!rect) return;
  computePosition({ getBoundingClientRect: () => rect } as Element, el, {
    placement: 'bottom-start',
    middleware: [offset(8), flip()],
  }).then(({ x, y }) => {
    Object.assign(el.style, { position: 'fixed', left: `${x}px`, top: `${y}px`, zIndex: '9999' });
  });
}

const popupStyle: React.CSSProperties = {
  background: '#1e1e1e',
  border: '1px solid rgba(252,251,248,0.12)',
  borderRadius: '10px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  padding: '4px',
  minWidth: '200px',
  maxHeight: '280px',
  overflowY: 'auto',
  fontFamily: 'var(--font-family-primary, system-ui, sans-serif)',
};

const itemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  width: '100%',
  padding: '7px 12px',
  borderRadius: '7px',
  border: 'none',
  background: 'transparent',
  color: 'rgba(252,251,248,0.85)',
  cursor: 'pointer',
  textAlign: 'left',
  fontSize: '14px',
  fontWeight: 500,
};

const itemActiveStyle: React.CSSProperties = {
  background: 'rgba(252,251,248,0.08)',
  color: '#73daca',
};

// ── Extension that combines mark + suggestion ─────────────────────────────────

export function wikilinkExtension(options: {
  getNotes: () => { title: string }[];
  onNavigate?: WikilinkNavigateCallback;
}) {
  const mark = WikilinkMark.configure({ onNavigate: options.onNavigate });

  const suggestionExt = Extension.create({
    name: 'wikilinkSuggestion',
    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          char: '[[',
          allowSpaces: true,
          startOfLine: false,
          allowedPrefixes: null,
          command({ editor, range, props }: { editor: Editor; range: Range; props: NoteItem }) {
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .insertContent({
                type: 'text',
                text: `[[${props.title}]]`,
                marks: [{ type: 'wikilink', attrs: { title: props.title, exists: true } }],
              })
              .run();
          },
          items({ query }: { query: string }) {
            const notes = options.getNotes();
            const q = query.toLowerCase();
            return notes
              .filter((n) => n.title.toLowerCase().includes(q))
              .slice(0, 10);
          },
          render: renderWikiSuggestion,
        }),
      ];
    },
  });

  return [mark, suggestionExt];
}
