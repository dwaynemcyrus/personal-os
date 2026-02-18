'use client';

import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, placeholder } from '@codemirror/view';
import { autocompletion } from '@codemirror/autocomplete';
import type { RxDatabase } from 'rxdb';
import type { DatabaseCollections, NoteDocument } from '@/lib/db';
import {
  hybridMarkdown,
  actions,
  createNoteIndex,
  wikiLinkAutocomplete,
  tagAutocomplete,
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
  toggleScrollPastEnd,
  isScrollPastEnd,
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

export type CodeMirrorEditorHandle = {
  view: EditorView | null;
};

export const CodeMirrorEditor = forwardRef<CodeMirrorEditorHandle, CodeMirrorEditorProps>(
function CodeMirrorEditor({
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
}: CodeMirrorEditorProps, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useImperativeHandle(ref, () => ({
    get view() { return viewRef.current; },
  }), []);
  const dbRef = useRef(db);
  const onChangeRef = useRef(onChange);
  const onBlurRef = useRef(onBlur);
  const onWikiLinkClickRef = useRef(onWikiLinkClick);
  const onBacklinkClickRef = useRef(onBacklinkClick);
  const onBacklinksRequestedRef = useRef(onBacklinksRequested);
  const onSaveVersionRef = useRef(onSaveVersion);
  const noteIndexRef = useRef(createNoteIndex([]));
  // Stable proxy so wikiLinkAutocomplete always reads the latest index
  const noteIndexProxyRef = useRef({
    search: (q: string) => noteIndexRef.current.search(q),
    resolve: (q: string) => noteIndexRef.current.resolve(q),
  });
  // Mutable array so tagAutocomplete always reads the latest tags
  const tagsArrayRef = useRef<string[]>([]);

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
        const notes = docs.map((doc) => doc.toJSON() as NoteDocument);
        noteIndexRef.current = createNoteIndex(notes.map((n) => ({ title: n.title })));

        // Collect tags from properties and inline #tag usage — mutate in-place
        // so the tagAutocomplete closure always sees the current array contents
        const tagSet = new Set<string>();
        for (const note of notes) {
          for (const tag of note.properties?.tags ?? []) tagSet.add(tag);
          const matches = (note.content ?? '').matchAll(/#([\w/-]+)/g);
          for (const match of matches) tagSet.add(match[1]);
        }
        const next = Array.from(tagSet).sort();
        tagsArrayRef.current.splice(0, tagsArrayRef.current.length, ...next);
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
          wordCount: false,
          backlinks: true,
          docTitle: noteTitle,
          onBacklinksRequested: async (title: string) => {
            return onBacklinksRequestedRef.current?.(title) ?? [];
          },
          onBacklinkClick: (backlink: BacklinkEntry) => {
            onBacklinkClickRef.current?.(backlink);
          },
          frontmatterKeys: ['tags', 'status', 'project_id', 'due_date', 'priority'],
          scrollPastEnd: true,
        }),

        autocompletion({
          override: [
            wikiLinkAutocomplete({ noteIndex: noteIndexProxyRef.current }),
            tagAutocomplete({ tags: tagsArrayRef.current }),
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
            padding: '0 20px',
            paddingTop: 'calc(64px + env(safe-area-inset-top))',
            paddingBottom: 'calc(32px + env(safe-area-inset-bottom))',
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

    // Allow react-remove-scroll (used by Radix Dialog) to permit
    // scrolling inside the CodeMirror scroller.
    const scroller = view.scrollDOM;
    scroller.setAttribute('data-scroll-lock-scrollable', '');

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
});
