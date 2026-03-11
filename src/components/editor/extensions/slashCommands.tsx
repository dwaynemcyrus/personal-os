import {
  Extension,
  type Editor,
  type Range,
} from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import Suggestion from '@tiptap/suggestion';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { computePosition, flip, offset } from '@floating-ui/dom';

// ── Command definitions ───────────────────────────────────────────────────────

type SlashCommand = {
  title: string;
  keywords: string[];
  icon: string;
  action: (editor: Editor, range: Range) => void;
};

const COMMANDS: SlashCommand[] = [
  {
    title: 'Heading 1',
    keywords: ['h1', 'heading', 'title'],
    icon: 'H1',
    action: (e, r) => e.chain().focus().deleteRange(r).toggleHeading({ level: 1 }).run(),
  },
  {
    title: 'Heading 2',
    keywords: ['h2', 'heading', 'subtitle'],
    icon: 'H2',
    action: (e, r) => e.chain().focus().deleteRange(r).toggleHeading({ level: 2 }).run(),
  },
  {
    title: 'Heading 3',
    keywords: ['h3', 'heading'],
    icon: 'H3',
    action: (e, r) => e.chain().focus().deleteRange(r).toggleHeading({ level: 3 }).run(),
  },
  {
    title: 'Bullet List',
    keywords: ['bullet', 'ul', 'unordered', 'list'],
    icon: '•',
    action: (e, r) => e.chain().focus().deleteRange(r).toggleBulletList().run(),
  },
  {
    title: 'Numbered List',
    keywords: ['numbered', 'ol', 'ordered', 'list', '1'],
    icon: '1.',
    action: (e, r) => e.chain().focus().deleteRange(r).toggleOrderedList().run(),
  },
  {
    title: 'Task List',
    keywords: ['task', 'todo', 'checklist', 'checkbox'],
    icon: '☑',
    action: (e, r) => e.chain().focus().deleteRange(r).toggleTaskList().run(),
  },
  {
    title: 'Blockquote',
    keywords: ['quote', 'blockquote', '>'],
    icon: '"',
    action: (e, r) => e.chain().focus().deleteRange(r).toggleBlockquote().run(),
  },
  {
    title: 'Code Block',
    keywords: ['code', 'codeblock', 'pre', '```'],
    icon: '</>',
    action: (e, r) => e.chain().focus().deleteRange(r).toggleCodeBlock().run(),
  },
  {
    title: 'Divider',
    keywords: ['divider', 'hr', 'rule', 'line', '---'],
    icon: '─',
    action: (e, r) => e.chain().focus().deleteRange(r).setHorizontalRule().run(),
  },
  {
    title: 'Table',
    keywords: ['table', 'grid'],
    icon: '▦',
    action: (e, r) =>
      e.chain().focus().deleteRange(r).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
];

function filterCommands(query: string): SlashCommand[] {
  const q = query.toLowerCase();
  if (!q) return COMMANDS;
  return COMMANDS.filter(
    (c) =>
      c.title.toLowerCase().includes(q) ||
      c.keywords.some((k) => k.includes(q)),
  );
}

// ── Popup component ───────────────────────────────────────────────────────────

type PopupProps = {
  items: SlashCommand[];
  command: (item: SlashCommand) => void;
};

type PopupHandle = {
  onKeyDown: (e: KeyboardEvent) => boolean;
};

const SlashCommandPopup = forwardRef<PopupHandle, PopupProps>(
  ({ items, command }, ref) => {
    const [selected, setSelected] = useState(0);

    useEffect(() => setSelected(0), [items]);

    useImperativeHandle(ref, () => ({
      onKeyDown(e: KeyboardEvent) {
        if (e.key === 'ArrowUp') {
          setSelected((s) => (s - 1 + items.length) % items.length);
          return true;
        }
        if (e.key === 'ArrowDown') {
          setSelected((s) => (s + 1) % items.length);
          return true;
        }
        if (e.key === 'Enter') {
          const item = items[selected];
          if (item) command(item);
          return true;
        }
        return false;
      },
    }));

    if (items.length === 0) return null;

    return (
      <div style={popupStyle} role="listbox">
        {items.map((item, i) => (
          <button
            key={item.title}
            style={{ ...itemStyle, ...(i === selected ? itemActiveStyle : {}) }}
            role="option"
            aria-selected={i === selected}
            onMouseEnter={() => setSelected(i)}
            onMouseDown={(e) => { e.preventDefault(); command(item); }}
          >
            <span style={iconStyle}>{item.icon}</span>
            <span style={labelStyle}>{item.title}</span>
          </button>
        ))}
      </div>
    );
  },
);
SlashCommandPopup.displayName = 'SlashCommandPopup';

// ── Suggestion render ─────────────────────────────────────────────────────────

function renderSuggestion() {
  let renderer: ReactRenderer<PopupHandle, PopupProps>;
  let wrapper: HTMLDivElement;

  return {
    onStart(props: { editor: Editor; clientRect?: (() => DOMRect | null) | null; items: SlashCommand[]; command: (item: SlashCommand) => void }) {
      wrapper = document.createElement('div');
      document.body.appendChild(wrapper);

      renderer = new ReactRenderer(SlashCommandPopup, {
        props,
        editor: props.editor,
      });
      wrapper.appendChild(renderer.element);
      positionPopup(wrapper, props.clientRect);
    },
    onUpdate(props: { clientRect?: (() => DOMRect | null) | null; items: SlashCommand[] }) {
      renderer.updateProps(props);
      positionPopup(wrapper, props.clientRect);
    },
    onKeyDown({ event }: { event: KeyboardEvent }) {
      if (event.key === 'Escape') {
        cleanup();
        return true;
      }
      return renderer.ref?.onKeyDown(event) ?? false;
    },
    onExit() {
      cleanup();
    },
  };

  function cleanup() {
    if (renderer) renderer.destroy();
    if (wrapper && wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
  }
}

function positionPopup(
  el: HTMLElement,
  clientRect?: (() => DOMRect | null) | null,
) {
  if (!clientRect) return;
  const rect = clientRect();
  if (!rect) return;

  const virtual = {
    getBoundingClientRect: () => rect,
  } as Element;

  computePosition(virtual, el, {
    placement: 'bottom-start',
    middleware: [offset(8), flip()],
  }).then(({ x, y }) => {
    Object.assign(el.style, {
      position: 'fixed',
      left: `${x}px`,
      top: `${y}px`,
      zIndex: '9999',
    });
  });
}

// ── Inline styles ─────────────────────────────────────────────────────────────

const popupStyle: React.CSSProperties = {
  background: '#1e1e1e',
  border: '1px solid rgba(252,251,248,0.12)',
  borderRadius: '10px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  padding: '4px',
  minWidth: '180px',
  maxHeight: '320px',
  overflowY: 'auto',
  fontFamily: 'var(--font-family-primary, system-ui, sans-serif)',
};

const itemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  width: '100%',
  padding: '7px 10px',
  borderRadius: '7px',
  border: 'none',
  background: 'transparent',
  color: 'rgba(252,251,248,0.85)',
  cursor: 'pointer',
  textAlign: 'left',
  fontSize: '14px',
};

const itemActiveStyle: React.CSSProperties = {
  background: 'rgba(252,251,248,0.08)',
  color: '#fcfbf8',
};

const iconStyle: React.CSSProperties = {
  width: '26px',
  height: '26px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(252,251,248,0.06)',
  borderRadius: '5px',
  fontSize: '11px',
  fontWeight: 700,
  flexShrink: 0,
  color: 'rgba(252,251,248,0.6)',
  fontFamily: 'monospace',
};

const labelStyle: React.CSSProperties = {
  fontWeight: 500,
};

// ── Extension ─────────────────────────────────────────────────────────────────

export const SlashCommands = Extension.create({
  name: 'slashCommands',

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: '/',
        startOfLine: false,
        allowedPrefixes: null,
        command: ({ editor, range, props }) => {
          props.action(editor, range);
        },
        items: ({ query }: { query: string }) => filterCommands(query),
        render: renderSuggestion,
      }),
    ];
  },
});
