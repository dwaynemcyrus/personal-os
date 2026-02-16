'use client';

import { useEffect, useRef, useCallback } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, placeholder } from '@codemirror/view';
import type { RxDatabase } from 'rxdb';
import type { DatabaseCollections } from '@/lib/db';
import { wikiLinkExtension } from './extensions/wikilink';
import { frontmatterExtension } from './extensions/frontmatter';
import { hybridMarkdown } from 'codemirror-for-writers';
import 'katex/dist/katex.min.css';
import styles from './CodeMirrorEditor.module.css';

type CodeMirrorEditorProps = {
  initialContent: string;
  /** External content for sync updates - when this changes, editor updates if not dirty */
  content?: string;
  onChange: (content: string) => void;
  onBlur?: () => void;
  onWikiLinkClick?: (target: string, noteId: string | null) => void;
  placeholderText?: string;
  autoFocus?: boolean;
  db?: RxDatabase<DatabaseCollections> | null;
  onSaveVersion?: () => void;
};

export function CodeMirrorEditor({
  initialContent,
  content,
  onChange,
  onBlur,
  onWikiLinkClick,
  placeholderText = 'Start writing...',
  autoFocus = true,
  db = null,
  onSaveVersion,
}: CodeMirrorEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const dbRef = useRef(db);
  const onChangeRef = useRef(onChange);
  const onBlurRef = useRef(onBlur);
  const onWikiLinkClickRef = useRef(onWikiLinkClick);
  const onSaveVersionRef = useRef(onSaveVersion);

  // Keep refs updated without recreating editor
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => { onBlurRef.current = onBlur; }, [onBlur]);
  useEffect(() => { onWikiLinkClickRef.current = onWikiLinkClick; }, [onWikiLinkClick]);
  useEffect(() => { onSaveVersionRef.current = onSaveVersion; }, [onSaveVersion]);
  useEffect(() => { dbRef.current = db; }, [db]);

  // Create editor once on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const content = update.state.doc.toString();
        onChangeRef.current(content);
      }
    });

    const blurHandler = EditorView.domEventHandlers({
      blur: () => {
        onBlurRef.current?.();
        return false;
      },
    });

    const customKeymap = keymap.of([
      {
        key: 'Mod-s',
        run: () => {
          onSaveVersionRef.current?.();
          return true;
        },
        preventDefault: true,
      },
    ]);

    const state = EditorState.create({
      doc: initialContent,
      extensions: [
        customKeymap,

        ...hybridMarkdown({
          theme: 'light',
          enableWikiLinks: true,
          renderWikiLinks: true,
          onWikiLinkClick: async (link: { title: string }) => {
            const currentDb = dbRef.current;
            if (!currentDb) {
              onWikiLinkClickRef.current?.(link.title, null);
              return;
            }

            try {
              const docs = await currentDb.notes.find({
                selector: { is_trashed: false },
              }).exec();

              const existing = docs.find(
                (doc) => doc.title.toLowerCase() === link.title.toLowerCase()
              );

              onWikiLinkClickRef.current?.(link.title, existing?.id ?? null);
            } catch {
              onWikiLinkClickRef.current?.(link.title, null);
            }
          },
          enableCustomTasks: true,
        }),

        // Wiki-link autocomplete (app-specific, not in package)
        ...wikiLinkExtension({
          db,
          enableDecorations: false,
          enableClickHandler: false,
          enableTheme: false,
        }),

        // Hide frontmatter block
        ...frontmatterExtension(),

        placeholder(placeholderText),

        EditorView.contentAttributes.of({
          spellcheck: 'true',
          autocorrect: 'on',
          autocapitalize: 'sentences',
        }),

        updateListener,
        blurHandler,

        EditorView.theme({
          '&': {
            height: '100%',
          },
          '.cm-content': {
            fontFamily: 'var(--font-atten), ui-sans-serif, system-ui, sans-serif',
            fontSize: '16px',
            padding: '0',
            paddingTop: '64px',
            lineHeight: 'normal',
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

    if (autoFocus) {
      requestAnimationFrame(() => {
        view.focus();
      });
    }

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle external content updates (e.g., from sync)
  const setContent = useCallback((newContent: string) => {
    const view = viewRef.current;
    if (!view) return;

    const currentContent = view.state.doc.toString();
    if (currentContent === newContent) return;

    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: newContent,
      },
    });
  }, []);

  // Expose setContent for parent component
  useEffect(() => {
    // @ts-expect-error - attaching to ref for imperative access
    if (containerRef.current) containerRef.current.setContent = setContent;
  }, [setContent]);

  // Sync external content changes
  useEffect(() => {
    if (content === undefined) return;
    setContent(content);
  }, [content, setContent]);

  return (
    <div ref={containerRef} className={styles.editor} />
  );
}
