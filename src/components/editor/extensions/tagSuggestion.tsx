import { Extension, type Editor, type Range } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import Suggestion from '@tiptap/suggestion';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import { computePosition, flip, offset } from '@floating-ui/dom';

// ── Popup ─────────────────────────────────────────────────────────────────────

type TagItem = { tag: string };

type TagPopupProps = {
  items: TagItem[];
  command: (item: TagItem) => void;
};

type TagPopupHandle = {
  onKeyDown: (e: KeyboardEvent) => boolean;
};

const TagSuggestionPopup = forwardRef<TagPopupHandle, TagPopupProps>(
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

    if (items.length === 0) return null;

    return (
      <div style={popupStyle} role="listbox">
        {items.map((item, i) => (
          <button
            key={item.tag}
            role="option"
            aria-selected={i === selected}
            style={{ ...itemStyle, ...(i === selected ? itemActiveStyle : {}) }}
            onMouseEnter={() => setSelected(i)}
            onMouseDown={(e) => { e.preventDefault(); command(item); }}
          >
            <span style={hashStyle}>#</span>{item.tag}
          </button>
        ))}
      </div>
    );
  },
);
TagSuggestionPopup.displayName = 'TagSuggestionPopup';

// ── Render lifecycle ──────────────────────────────────────────────────────────

function renderTagSuggestion() {
  let renderer: ReactRenderer<TagPopupHandle, TagPopupProps>;
  let wrapper: HTMLDivElement;

  return {
    onStart(props: { editor: Editor; clientRect?: (() => DOMRect | null) | null; items: TagItem[]; command: (item: TagItem) => void }) {
      wrapper = document.createElement('div');
      document.body.appendChild(wrapper);
      renderer = new ReactRenderer(TagSuggestionPopup, { props, editor: props.editor });
      wrapper.appendChild(renderer.element);
      position(wrapper, props.clientRect);
    },
    onUpdate(props: { clientRect?: (() => DOMRect | null) | null; items: TagItem[] }) {
      renderer.updateProps(props);
      position(wrapper, props.clientRect);
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

function position(el: HTMLElement, clientRect?: (() => DOMRect | null) | null) {
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

// ── Extension ─────────────────────────────────────────────────────────────────

export function tagSuggestionExtension(getTags: () => string[]) {
  return Extension.create({
    name: 'tagSuggestion',

    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          char: '#',
          allowSpaces: false,
          startOfLine: false,
          allowedPrefixes: null,
          // Don't trigger inside a heading syntax (e.g. `# ` at line start)
          shouldShow({ editor, range }) {
            const $pos = editor.state.doc.resolve(range.from);
            const node = $pos.parent;
            if (node.type.name === 'heading') return false;
            return true;
          },
          command({ editor, range, props }: { editor: Editor; range: Range; props: TagItem }) {
            editor.chain().focus().deleteRange(range).insertContent(`#${props.tag} `).run();
          },
          items({ query }: { query: string }) {
            const tags = getTags();
            const q = query.toLowerCase();
            return tags
              .filter((t) => t.toLowerCase().includes(q))
              .sort((a, b) => {
                const aStart = a.toLowerCase().startsWith(q) ? 0 : 1;
                const bStart = b.toLowerCase().startsWith(q) ? 0 : 1;
                return aStart !== bStart ? aStart - bStart : a.localeCompare(b);
              })
              .slice(0, 8)
              .map((t) => ({ tag: t }));
          },
          render: renderTagSuggestion,
        }),
      ];
    },
  });
}

// ── Inline styles ─────────────────────────────────────────────────────────────

const popupStyle: React.CSSProperties = {
  background: '#1e1e1e',
  border: '1px solid rgba(252,251,248,0.12)',
  borderRadius: '10px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  padding: '4px',
  minWidth: '160px',
  maxHeight: '240px',
  overflowY: 'auto',
  fontFamily: 'var(--font-family-primary, system-ui, sans-serif)',
};

const itemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
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

const hashStyle: React.CSSProperties = {
  color: '#73daca',
  marginRight: '1px',
  fontWeight: 600,
};
