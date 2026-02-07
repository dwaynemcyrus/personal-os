'use client';

import { useEffect, useRef, useCallback } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, placeholder } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import type { RxDatabase } from 'rxdb';
import type { DatabaseCollections } from '@/lib/db';
import { wikiLinkExtension } from './extensions/wikilink';
import { instantRenderExtension } from './extensions/instantRender';
import styles from './CodeMirrorEditor.module.css';

type CodeMirrorEditorProps = {
  initialContent: string;
  onChange: (content: string) => void;
  onBlur?: () => void;
  onWikiLinkClick?: (target: string, noteId: string | null) => void;
  placeholderText?: string;
  autoFocus?: boolean;
  db?: RxDatabase<DatabaseCollections> | null;
};

export function CodeMirrorEditor({
  initialContent,
  onChange,
  onBlur,
  onWikiLinkClick,
  placeholderText = 'Start writing...',
  autoFocus = true,
  db = null,
}: CodeMirrorEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onBlurRef = useRef(onBlur);
  const onWikiLinkClickRef = useRef(onWikiLinkClick);

  // Keep refs updated without recreating editor
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onBlurRef.current = onBlur;
  }, [onBlur]);

  useEffect(() => {
    onWikiLinkClickRef.current = onWikiLinkClick;
  }, [onWikiLinkClick]);

  // Create editor once on mount
  useEffect(() => {
    if (!containerRef.current) return;

    // Extension to listen for document changes
    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const content = update.state.doc.toString();
        onChangeRef.current(content);
      }
    });

    // Extension to listen for blur events
    const blurHandler = EditorView.domEventHandlers({
      blur: () => {
        onBlurRef.current?.();
        return false;
      },
    });

    const state = EditorState.create({
      doc: initialContent,
      extensions: [
        // Core
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),

        // Markdown
        markdown(),
        syntaxHighlighting(defaultHighlightStyle),

        // Wiki-links
        ...wikiLinkExtension({
          db,
          onLinkClick: (target, noteId) => {
            onWikiLinkClickRef.current?.(target, noteId);
          },
        }),

        // Instant render (hide markdown when not editing)
        ...instantRenderExtension(),

        // UI
        EditorView.lineWrapping,
        placeholder(placeholderText),

        // Listeners
        updateListener,
        blurHandler,

        // Theme
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '16px',
          },
          '.cm-content': {
            fontFamily: 'var(--font-family-primary)',
            padding: 'var(--space-16) var(--space-4)',
            lineHeight: 'var(--leading-relaxed)',
            caretColor: 'var(--color-ink-900)',
          },
          '.cm-line': {
            padding: '0',
          },
          '.cm-cursor': {
            borderLeftColor: 'var(--color-ink-900)',
            borderLeftWidth: '2px',
          },
          '.cm-selectionBackground': {
            backgroundColor: 'var(--color-highlight) !important',
          },
          '&.cm-focused .cm-selectionBackground': {
            backgroundColor: 'var(--color-highlight) !important',
          },
          '.cm-placeholder': {
            color: 'var(--color-ink-300)',
            fontStyle: 'italic',
          },
          '.cm-scroller': {
            overflow: 'auto',
          },
          '&.cm-focused': {
            outline: 'none',
          },
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    // Auto-focus on mount
    if (autoFocus) {
      // Small delay to ensure DOM is ready
      requestAnimationFrame(() => {
        view.focus();
      });
    }

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Only run on mount - content updates handled via transactions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle external content updates (e.g., from sync)
  const setContent = useCallback((newContent: string) => {
    const view = viewRef.current;
    if (!view) return;

    const currentContent = view.state.doc.toString();
    if (currentContent === newContent) return;

    // Use transaction to update content without losing cursor position
    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: newContent,
      },
    });
  }, []);

  // Expose setContent for parent component if needed
  useEffect(() => {
    // @ts-expect-error - attaching to ref for imperative access
    if (containerRef.current) containerRef.current.setContent = setContent;
  }, [setContent]);

  return (
    <div ref={containerRef} className={styles.editor} />
  );
}
