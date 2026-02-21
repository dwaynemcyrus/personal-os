

import { useEffect, useRef, useCallback } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, placeholder } from '@codemirror/view';
import { autocompletion, type CompletionContext } from '@codemirror/autocomplete';
import { markdown } from '@codemirror/lang-markdown';
import type { RxDatabase } from 'rxdb';
import type { DatabaseCollections, NoteDocument } from '@/lib/db';
import styles from './CodeMirrorEditor.module.css';

// --- Wikilink autocomplete ---

type NoteEntry = { title: string; normalized: string };

function buildNoteIndex(notes: { title: string }[]): NoteEntry[] {
  return notes.map(n => ({ title: n.title, normalized: n.title.toLowerCase() }));
}

function searchNotes(entries: NoteEntry[], query: string): NoteEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return entries;
  return entries
    .map(e => ({ entry: e, score: e.normalized.indexOf(q) }))
    .filter(({ score }) => score !== -1)
    .sort((a, b) => a.score - b.score)
    .map(({ entry }) => entry);
}

function wikilinkCompletions(noteEntriesRef: { current: NoteEntry[] }) {
  return (context: CompletionContext) => {
    const match = context.matchBefore(/\[\[[^\]]*$/);
    if (!match) return null;
    const query = match.text.slice(2);
    const results = searchNotes(noteEntriesRef.current, query);
    return {
      from: match.from + 2,
      options: results.map(r => ({
        label: r.title,
        apply: `${r.title}]]`,
        type: 'text',
      })),
      validFor: /^[^\]]*$/,
    };
  };
}

// --- Tag autocomplete ---

function tagCompletions(tags: string[]) {
  return (context: CompletionContext) => {
    const match = context.matchBefore(/#[\w/-]*$/);
    if (!match) return null;
    const lineText = context.state.doc.lineAt(match.from).text;
    if (/^#{1,6}\s/.test(lineText)) return null;
    const query = match.text.slice(1).toLowerCase();
    const filtered = tags
      .filter(t => t.toLowerCase().includes(query))
      .sort((a, b) => {
        const aStart = a.toLowerCase().startsWith(query) ? 0 : 1;
        const bStart = b.toLowerCase().startsWith(query) ? 0 : 1;
        return aStart !== bStart ? aStart - bStart : a.localeCompare(b);
      });
    return {
      from: match.from,
      options: filtered.map(t => ({ label: `#${t}`, apply: `#${t}`, type: 'keyword' })),
      validFor: /^#[\w/-]*$/,
    };
  };
}

// --- Component ---

type CodeMirrorEditorProps = {
  initialContent: string;
  content?: string;
  onChange: (content: string) => void;
  onBlur?: () => void;
  onSaveVersion?: () => void;
  onScrollPositionChange?: (scrollTop: number) => void;
  placeholderText?: string;
  autoFocus?: boolean;
  db?: RxDatabase<DatabaseCollections> | null;
};

export function CodeMirrorEditor({
  initialContent,
  content,
  onChange,
  onBlur,
  onSaveVersion,
  onScrollPositionChange,
  placeholderText = 'Start writing...',
  autoFocus = true,
  db = null,
}: CodeMirrorEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onBlurRef = useRef(onBlur);
  const onSaveVersionRef = useRef(onSaveVersion);
  const onScrollPositionChangeRef = useRef(onScrollPositionChange);
  const dbRef = useRef(db);
  const noteEntriesRef = useRef<NoteEntry[]>([]);
  const tagsArrayRef = useRef<string[]>([]);

  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => { onBlurRef.current = onBlur; }, [onBlur]);
  useEffect(() => { onSaveVersionRef.current = onSaveVersion; }, [onSaveVersion]);
  useEffect(() => { onScrollPositionChangeRef.current = onScrollPositionChange; }, [onScrollPositionChange]);
  useEffect(() => { dbRef.current = db; }, [db]);

  // Keep note index and tag list in sync with DB
  useEffect(() => {
    if (!db) return;
    const subscription = db.notes
      .find({ selector: { is_trashed: false } })
      .$.subscribe((docs) => {
        const notes = docs.map(doc => doc.toJSON() as NoteDocument);
        noteEntriesRef.current = buildNoteIndex(notes.map(n => ({ title: n.title })));

        const tagSet = new Set<string>();
        for (const note of notes) {
          for (const tag of note.properties?.tags ?? []) tagSet.add(tag);
          const matches = (note.content ?? '').matchAll(/#([\w/-]+)/g);
          for (const m of matches) tagSet.add(m[1]);
        }
        const next = Array.from(tagSet).sort();
        tagsArrayRef.current.splice(0, tagsArrayRef.current.length, ...next);
      });
    return () => subscription.unsubscribe();
  }, [db]);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateListener = EditorView.updateListener.of(update => {
      if (update.docChanged) onChangeRef.current(update.state.doc.toString());
    });

    const blurHandler = EditorView.domEventHandlers({
      blur: () => { onBlurRef.current?.(); return false; },
    });

    const saveKeymap = keymap.of([{
      key: 'Mod-s',
      run: () => { onSaveVersionRef.current?.(); return true; },
      preventDefault: true,
    }]);

    const state = EditorState.create({
      doc: initialContent,
      extensions: [
        saveKeymap,
        markdown(),
        autocompletion({
          override: [
            wikilinkCompletions(noteEntriesRef),
            tagCompletions(tagsArrayRef.current),
          ],
        }),
        placeholder(placeholderText),
        EditorView.lineWrapping,
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
            backgroundColor: '#282828',
            color: '#fcfbf8',
          },
          '.cm-content': {
            fontFamily: 'var(--font-family-primary)',
            fontSize: '16px',
            padding: '0 20px',
            paddingTop: '16px',
            paddingBottom: 'calc(32px + env(safe-area-inset-bottom))',
            lineHeight: 'normal',
            caretColor: '#fcfbf8',
          },
          '.cm-line': {
            padding: '0',
            wordBreak: 'break-word',
          },
          '.cm-cursor': {
            borderLeftColor: '#fcfbf8',
            borderLeftWidth: '2px',
          },
          '.cm-selectionBackground': {
            backgroundColor: 'rgba(252, 251, 248, 0.22) !important',
          },
          '&.cm-focused .cm-selectionBackground': {
            backgroundColor: 'rgba(252, 251, 248, 0.22) !important',
          },
          '.cm-placeholder': {
            color: 'rgba(252, 251, 248, 0.55)',
            fontStyle: 'italic',
          },
          '.cm-scroller': {
            overflowY: 'auto',
            overflowX: 'hidden',
          },
          '&.cm-focused': { outline: 'none' },
        }),
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;

    view.scrollDOM.setAttribute('data-scroll-lock-scrollable', '');
    const handleScroll = () => {
      onScrollPositionChangeRef.current?.(view.scrollDOM.scrollTop);
    };
    view.scrollDOM.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    if (autoFocus) {
      requestAnimationFrame(() => view.focus());
    }

    return () => {
      view.scrollDOM.removeEventListener('scroll', handleScroll);
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setContent = useCallback((newContent: string) => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current === newContent) return;
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: newContent } });
  }, []);

  useEffect(() => {
    if (content === undefined) return;
    setContent(content);
  }, [content, setContent]);

  return <div ref={containerRef} className={styles.editor} />;
}
