'use client';

import { useEffect, useRef, useCallback } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, placeholder } from '@codemirror/view';
import { autocompletion } from '@codemirror/autocomplete';
import type { RxDatabase } from 'rxdb';
import type { DatabaseCollections, NoteDocument } from '@/lib/db';
import {
  hybridMarkdown,
  moreMenu,
  actions,
  createNoteIndex,
  wikiLinkAutocomplete,
  toggleTheme,
  getTheme,
  toggleHybridMode,
  getMode,
  toggleReadOnly,
  isReadOnly,
  toggleWritingModeSheet,
  isTypewriter,
  isFocusMode,
  toggleToolbar,
  isToolbar,
  toggleWordCount,
  isWordCount,
  toggleFrontmatterSheet,
  isFrontmatterSheet,
  type BacklinkEntry,
} from 'codemirror-for-writers';
import 'katex/dist/katex.min.css';
import styles from './CodeMirrorEditor.module.css';

type CodeMirrorEditorProps = {
  initialContent: string;
  content?: string;
  onChange: (content: string) => void;
  onBlur?: () => void;
  onWikiLinkClick?: (target: string, noteId: string | null) => void;
  onBacklinkClick?: (backlink: BacklinkEntry) => void;
  onBacklinksRequested?: (title: string) => Promise<BacklinkEntry[]>;
  placeholderText?: string;
  autoFocus?: boolean;
  db?: RxDatabase<DatabaseCollections> | null;
  noteTitle?: string;
  onSaveVersion?: () => void;
};

export function CodeMirrorEditor({
  initialContent,
  content,
  onChange,
  onBlur,
  onWikiLinkClick,
  onBacklinkClick,
  onBacklinksRequested,
  placeholderText = 'Start writing...',
  autoFocus = true,
  db = null,
  noteTitle,
  onSaveVersion,
}: CodeMirrorEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const dbRef = useRef(db);
  const onChangeRef = useRef(onChange);
  const onBlurRef = useRef(onBlur);
  const onWikiLinkClickRef = useRef(onWikiLinkClick);
  const onBacklinkClickRef = useRef(onBacklinkClick);
  const onBacklinksRequestedRef = useRef(onBacklinksRequested);
  const onSaveVersionRef = useRef(onSaveVersion);
  const noteIndexRef = useRef(createNoteIndex([]));

  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => { onBlurRef.current = onBlur; }, [onBlur]);
  useEffect(() => { onWikiLinkClickRef.current = onWikiLinkClick; }, [onWikiLinkClick]);
  useEffect(() => { onBacklinkClickRef.current = onBacklinkClick; }, [onBacklinkClick]);
  useEffect(() => { onBacklinksRequestedRef.current = onBacklinksRequested; }, [onBacklinksRequested]);
  useEffect(() => { onSaveVersionRef.current = onSaveVersion; }, [onSaveVersion]);
  useEffect(() => { dbRef.current = db; }, [db]);

  // Keep note index in sync with DB
  useEffect(() => {
    if (!db) return;

    const subscription = db.notes
      .find({ selector: { is_trashed: false } })
      .$.subscribe((docs) => {
        const notes = docs.map((doc) => ({ title: (doc.toJSON() as NoteDocument).title }));
        noteIndexRef.current = createNoteIndex(notes);
      });

    return () => subscription.unsubscribe();
  }, [db]);

  // Create editor once on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChangeRef.current(update.state.doc.toString());
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
          enableTags: true,
          enableCustomTasks: true,
          toolbar: false,
          wordCount: true,
          backlinks: true,
          docTitle: noteTitle,
          onBacklinksRequested: async (title: string) => {
            return onBacklinksRequestedRef.current?.(title) ?? [];
          },
          onBacklinkClick: (backlink: BacklinkEntry) => {
            onBacklinkClickRef.current?.(backlink);
          },
          frontmatterKeys: ['tags', 'status', 'project_id', 'due_date', 'priority'],
        }),

        ...moreMenu({
          items: [
            { label: 'Dark mode', handler: (v) => toggleTheme(v), getState: (v) => getTheme(v) === 'dark' },
            { label: 'Raw mode', handler: (v) => toggleHybridMode(v), getState: (v) => getMode(v) === 'raw' },
            { label: 'Read-only', handler: (v) => toggleReadOnly(v), getState: (v) => isReadOnly(v) },
            { type: 'separator' },
            { label: 'Writing Mode', handler: (v) => toggleWritingModeSheet(v), getState: (v) => isTypewriter(v) || isFocusMode(v) },
            { label: 'Toolbar', handler: (v) => toggleToolbar(v), getState: (v) => isToolbar(v) },
            { label: 'Word count', handler: (v) => toggleWordCount(v), getState: (v) => isWordCount(v) },
            { label: 'Properties', handler: (v) => toggleFrontmatterSheet(v), getState: (v) => isFrontmatterSheet(v) },
            { type: 'separator' },
            { type: 'action', label: 'Find & Replace', handler: (v) => actions.replace(v) },
          ],
        }),

        // Wiki-link autocomplete
        autocompletion({
          override: [
            wikiLinkAutocomplete({ noteIndex: noteIndexRef.current }),
          ],
        }),

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

  useEffect(() => {
    // @ts-expect-error - attaching to ref for imperative access
    if (containerRef.current) containerRef.current.setContent = setContent;
  }, [setContent]);

  useEffect(() => {
    if (content === undefined) return;
    setContent(content);
  }, [content, setContent]);

  return (
    <div ref={containerRef} className={styles.editor} />
  );
}
