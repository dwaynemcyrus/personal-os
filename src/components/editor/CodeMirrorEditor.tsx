import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import {
  EditorView,
  keymap,
  placeholder as cmPlaceholder,
} from '@codemirror/view';
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { searchKeymap } from '@codemirror/search';

const baseTheme = EditorView.theme({
  '&': {
    height: '100%',
    backgroundColor: 'transparent',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-scroller': {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
    fontSize: '17px',
    lineHeight: '1.75',
    overflow: 'auto',
  },
  '.cm-content': {
    padding: '20px 20px 120px',
    caretColor: 'var(--color-accent)',
    color: 'var(--color-ink)',
    minHeight: '100%',
  },
  '.cm-line': {
    padding: '0',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: 'var(--color-accent)',
    borderLeftWidth: '2px',
  },
  '.cm-placeholder': {
    color: 'var(--color-ink-faint, #b0a898)',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: 'var(--color-highlight, rgba(255, 220, 50, 0.4))',
  },
  '.cm-gutters': {
    display: 'none',
  },
});

type Props = {
  initialBody: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onScrollPositionChange?: (scrollTop: number) => void;
  placeholder?: string;
  autoFocus?: boolean;
};

export function CodeMirrorEditor({
  initialBody,
  onChange,
  onBlur,
  onScrollPositionChange,
  placeholder: placeholderText,
  autoFocus = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onBlurRef = useRef(onBlur);
  const onScrollRef = useRef(onScrollPositionChange);

  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => { onBlurRef.current = onBlur; }, [onBlur]);
  useEffect(() => { onScrollRef.current = onScrollPositionChange; }, [onScrollPositionChange]);

  useEffect(() => {
    if (!containerRef.current) return;

    const extensions = [
      history(),
      EditorView.lineWrapping,
      markdown({ base: markdownLanguage }),
      keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap, indentWithTab]),
      baseTheme,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChangeRef.current?.(update.state.doc.toString());
        }
      }),
      EditorView.domEventHandlers({
        blur: () => {
          onBlurRef.current?.();
          return false;
        },
      }),
    ];

    if (placeholderText) extensions.push(cmPlaceholder(placeholderText));

    const state = EditorState.create({ doc: initialBody, extensions });
    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;

    const handleScroll = () => onScrollRef.current?.(view.scrollDOM.scrollTop);
    view.scrollDOM.addEventListener('scroll', handleScroll, { passive: true });

    if (autoFocus) requestAnimationFrame(() => view.focus());

    return () => {
      view.scrollDOM.removeEventListener('scroll', handleScroll);
      view.destroy();
      viewRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={containerRef} className="h-full w-full overflow-hidden" />;
}
