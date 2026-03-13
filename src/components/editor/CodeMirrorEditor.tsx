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
import { wikilinkHighlight } from './extensions/wikilinkHighlight';
import { wikilinkAutocomplete } from './extensions/wikilinkAutocomplete';
import { WIKILINK_RE_SOURCE } from '@/lib/wikilinks';

const baseTheme = EditorView.theme({
  '&': { backgroundColor: 'transparent' },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': {
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
    fontSize: '17px',
    lineHeight: '1.75',
    overflow: 'visible',
  },
  '.cm-content': {
    padding: '20px 20px 120px',
    caretColor: 'var(--color-accent)',
    color: 'var(--color-ink)',
  },
  '.cm-line': { padding: '0' },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: 'var(--color-accent)',
    borderLeftWidth: '2px',
  },
  '.cm-placeholder': { color: 'var(--color-ink-faint, #b0a898)' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: 'var(--color-highlight, rgba(255, 220, 50, 0.4))',
  },
  '.cm-gutters': { display: 'none' },
  // Wikilink highlighting
  '.cm-wikilink-bracket': { color: 'var(--color-ink-faint, #999)', opacity: '0.7' },
  '.cm-wikilink-title': {
    color: 'var(--color-accent)',
    textDecoration: 'underline',
    textUnderlineOffset: '2px',
    cursor: 'pointer',
  },
  '.cm-wikilink-header': {
    color: 'var(--color-accent)',
    opacity: '0.75',
    fontStyle: 'italic',
    cursor: 'pointer',
  },
  '.cm-wikilink-alias': { color: 'var(--color-accent)', opacity: '0.85', cursor: 'pointer' },
  '.cm-wikilink-punct': { color: 'var(--color-ink-faint, #999)', opacity: '0.6' },
  // Autocomplete dropdown
  '.cm-tooltip.cm-tooltip-autocomplete': {
    border: '1px solid var(--color-border-200, #e0dcd6)',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: 'var(--color-surface, #fff)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul': {
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
    fontSize: '15px',
    maxHeight: '240px',
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul > li': {
    padding: '6px 12px',
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]': {
    backgroundColor: 'var(--color-accent, #5b7cf7)',
    color: 'white',
  },
});

type Props = {
  initialBody: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  noteTitles?: string[];
  onWikilinkClick?: (title: string, header?: string) => void;
};

export function CodeMirrorEditor({
  initialBody,
  onChange,
  onBlur,
  placeholder: placeholderText,
  autoFocus = false,
  noteTitles,
  onWikilinkClick,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onBlurRef = useRef(onBlur);
  const noteTitlesRef = useRef<string[]>(noteTitles ?? []);
  const onWikilinkClickRef = useRef(onWikilinkClick);

  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => { onBlurRef.current = onBlur; }, [onBlur]);
  useEffect(() => { noteTitlesRef.current = noteTitles ?? []; }, [noteTitles]);
  useEffect(() => { onWikilinkClickRef.current = onWikilinkClick; }, [onWikilinkClick]);

  useEffect(() => {
    if (!containerRef.current) return;

    const wikilinkRe = new RegExp(WIKILINK_RE_SOURCE, 'g');

    const extensions = [
      history(),
      EditorView.lineWrapping,
      markdown({ base: markdownLanguage }),
      keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap, indentWithTab]),
      baseTheme,
      wikilinkHighlight,
      wikilinkAutocomplete(() => noteTitlesRef.current),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChangeRef.current?.(update.state.doc.toString());
        }
      }),
      EditorView.domEventHandlers({
        blur: () => { onBlurRef.current?.(); return false; },
        click: (e, view) => {
          const pos = view.posAtCoords({ x: e.clientX, y: e.clientY });
          if (pos === null) return false;
          const line = view.state.doc.lineAt(pos);
          const relPos = pos - line.from;
          wikilinkRe.lastIndex = 0;
          let match: RegExpExecArray | null;
          while ((match = wikilinkRe.exec(line.text)) !== null) {
            if (relPos >= match.index && relPos <= match.index + match[0].length) {
              e.preventDefault();
              onWikilinkClickRef.current?.(
                (match[1] ?? '').trim(),
                match[2]?.trim()
              );
              return true;
            }
          }
          return false;
        },
      }),
    ];

    if (placeholderText) extensions.push(cmPlaceholder(placeholderText));

    const state = EditorState.create({ doc: initialBody, extensions });
    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;

    if (autoFocus) requestAnimationFrame(() => view.focus());

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={containerRef} />;
}
