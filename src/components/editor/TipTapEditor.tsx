import { useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import { Placeholder } from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { Markdown } from 'tiptap-markdown';
import type { RxDatabase } from 'rxdb';
import type { DatabaseCollections, ItemDocument } from '@/lib/db';
import { BearTaskItem } from './extensions/bearTaskItem';
import { SlashCommands } from './extensions/slashCommands';
import { WikilinkMark, wikilinkExtension, type WikilinkNavigateCallback } from './extensions/wikilink';
import { tagSuggestionExtension } from './extensions/tagSuggestion';
import styles from './TipTapEditor.module.css';

const lowlight = createLowlight(common);

// tiptap-markdown adds .markdown to storage but doesn't ship types for it
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getMarkdown(editor: { storage: any }): string {
  return editor.storage.markdown?.getMarkdown?.() ?? '';
}

export type EditorMode = 'rendered' | 'source';

type TipTapEditorProps = {
  initialContent: string;
  content?: string;
  mode: EditorMode;
  onChange: (content: string) => void;
  onBlur?: () => void;
  onSaveVersion?: () => void;
  onScrollPositionChange?: (scrollTop: number) => void;
  onEditorReady?: (editor: Editor) => void;
  onWikilinkNavigate?: WikilinkNavigateCallback;
  placeholderText?: string;
  autoFocus?: boolean;
  db?: RxDatabase<DatabaseCollections> | null;
};

export function TipTapEditor({
  initialContent,
  content,
  mode,
  onChange,
  onBlur,
  onSaveVersion,
  onScrollPositionChange,
  onEditorReady,
  onWikilinkNavigate,
  placeholderText = 'Start writing...',
  autoFocus = true,
  db = null,
}: TipTapEditorProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  const onBlurRef = useRef(onBlur);
  const onSaveVersionRef = useRef(onSaveVersion);
  const onScrollPositionChangeRef = useRef(onScrollPositionChange);
  const onEditorReadyRef = useRef(onEditorReady);
  const onWikilinkNavigateRef = useRef(onWikilinkNavigate);
  const prevModeRef = useRef(mode);
  const currentMarkdownRef = useRef(initialContent);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Live indexes for autocomplete — mutated in place so extensions always have fresh data
  const noteIndexRef = useRef<{ title: string }[]>([]);
  const tagIndexRef = useRef<string[]>([]);

  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => { onBlurRef.current = onBlur; }, [onBlur]);
  useEffect(() => { onSaveVersionRef.current = onSaveVersion; }, [onSaveVersion]);
  useEffect(() => { onScrollPositionChangeRef.current = onScrollPositionChange; }, [onScrollPositionChange]);
  useEffect(() => { onEditorReadyRef.current = onEditorReady; }, [onEditorReady]);
  useEffect(() => { onWikilinkNavigateRef.current = onWikilinkNavigate; }, [onWikilinkNavigate]);

  // Keep note + tag indexes in sync with DB
  useEffect(() => {
    if (!db) return;
    const sub = db.items
      .find({ selector: { type: 'note', is_trashed: false } })
      .$.subscribe((docs) => {
        const notes = docs.map((d) => d.toJSON() as ItemDocument);
        noteIndexRef.current = notes.map((n) => ({ title: n.title ?? '' })).filter((n) => n.title);
        const tagSet = new Set<string>();
        for (const note of notes) {
          const matches = (note.content ?? '').matchAll(/#([\w/-]+)/g);
          for (const m of matches) tagSet.add(m[1]);
        }
        tagIndexRef.current.splice(0, tagIndexRef.current.length, ...Array.from(tagSet).sort());
      });
    return () => sub.unsubscribe();
  }, [db]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        // TaskItem replaced by BearTaskItem
      }),
      TaskList,
      BearTaskItem.configure({ nested: false }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      CodeBlockLowlight.configure({ lowlight }),
      Placeholder.configure({
        placeholder: placeholderText,
        showOnlyWhenEditable: true,
      }),
      Markdown.configure({
        html: false,
        tightLists: true,
        bulletListMarker: '-',
        transformPastedText: true,
        transformCopiedText: false,
      }),
      SlashCommands,
      WikilinkMark.configure({
        onNavigate: (title, exists) => onWikilinkNavigateRef.current?.(title, exists),
      }),
      ...wikilinkExtension({
        getNotes: () => noteIndexRef.current,
        onNavigate: (title, exists) => onWikilinkNavigateRef.current?.(title, exists),
      }),
      tagSuggestionExtension(() => tagIndexRef.current),
    ],
    content: initialContent,
    autofocus: autoFocus ? 'end' : false,
    editable: mode === 'rendered',
    onUpdate: ({ editor }) => {
      const md = getMarkdown(editor);
      currentMarkdownRef.current = md;
      onChangeRef.current(md);
    },
    onBlur: () => {
      onBlurRef.current?.();
    },
    onCreate: ({ editor }) => {
      onEditorReadyRef.current?.(editor);
    },
  });

  // Scroll tracking
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const handleScroll = () => onScrollPositionChangeRef.current?.(el.scrollTop);
    el.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  // Cmd+S save version shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        onSaveVersionRef.current?.();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle mode changes
  useEffect(() => {
    if (mode === prevModeRef.current) return;
    prevModeRef.current = mode;

    if (mode === 'source') {
      if (editor) {
        const md = getMarkdown(editor);
        currentMarkdownRef.current = md;
        editor.setEditable(false);
      }
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.value = currentMarkdownRef.current;
          textareaRef.current.focus();
        }
      });
    } else {
      if (textareaRef.current) {
        currentMarkdownRef.current = textareaRef.current.value;
      }
      if (editor) {
        editor.commands.setContent(currentMarkdownRef.current);
        editor.setEditable(true);
        requestAnimationFrame(() => editor.commands.focus('end'));
      }
    }
  }, [mode, editor]);

  // Accept external content updates (e.g. version restore)
  useEffect(() => {
    if (content === undefined) return;
    if (mode !== 'rendered') return;
    if (!editor) return;
    const current = getMarkdown(editor);
    if (current === content) return;
    editor.commands.setContent(content);
    currentMarkdownRef.current = content;
  }, [content, mode, editor]);

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    currentMarkdownRef.current = e.target.value;
    onChangeRef.current(e.target.value);
  }, []);

  const handleTextareaBlur = useCallback(() => {
    onBlurRef.current?.();
  }, []);

  return (
    <div className={styles.scrollContainer} ref={scrollContainerRef}>
      <div className={styles.contentColumn}>
        {/* Rendered mode — TipTap */}
        <div
          className={styles.editor}
          style={{ display: mode === 'rendered' ? undefined : 'none' }}
        >
          <EditorContent editor={editor} />
        </div>

        {/* Source mode — plain textarea */}
        {mode === 'source' && (
          <textarea
            ref={textareaRef}
            className={styles.sourceTextarea}
            defaultValue={currentMarkdownRef.current}
            onChange={handleTextareaChange}
            onBlur={handleTextareaBlur}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
          />
        )}
      </div>
    </div>
  );
}
