'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Compartment, EditorState } from '@codemirror/state';
import { EditorView, keymap, placeholder } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import type { RxDatabase } from 'rxdb';
import type { DatabaseCollections } from '@/lib/db';
import { wikiLinkExtension } from './extensions/wikilink';
import { instantRenderExtension } from './extensions/instantRender';
import { calloutsExtension } from './extensions/callouts';
import { typewriterExtension } from './extensions/typewriter';
import { focusExtension, type FocusLevel } from './extensions/focus';
import type { WritingMode } from './FocusSettings';
import styles from './CodeMirrorEditor.module.css';

type CodeMirrorEditorProps = {
  initialContent: string;
  onChange: (content: string) => void;
  onBlur?: () => void;
  onWikiLinkClick?: (target: string, noteId: string | null) => void;
  placeholderText?: string;
  autoFocus?: boolean;
  db?: RxDatabase<DatabaseCollections> | null;
  writingMode?: WritingMode;
  focusLevel?: FocusLevel;
  focusIntensity?: number;
  onToggleTypewriter?: () => void;
  onToggleFocus?: () => void;
  onSaveVersion?: () => void;
};

export function CodeMirrorEditor({
  initialContent,
  onChange,
  onBlur,
  onWikiLinkClick,
  placeholderText = 'Start writing...',
  autoFocus = true,
  db = null,
  writingMode = 'normal',
  focusLevel = 'sentence',
  focusIntensity = 0.3,
  onToggleTypewriter,
  onToggleFocus,
  onSaveVersion,
}: CodeMirrorEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const writingModeCompartmentRef = useRef(new Compartment());
  const onChangeRef = useRef(onChange);
  const onBlurRef = useRef(onBlur);
  const onWikiLinkClickRef = useRef(onWikiLinkClick);
  const onToggleTypewriterRef = useRef(onToggleTypewriter);
  const onToggleFocusRef = useRef(onToggleFocus);
  const onSaveVersionRef = useRef(onSaveVersion);

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

  useEffect(() => {
    onToggleTypewriterRef.current = onToggleTypewriter;
  }, [onToggleTypewriter]);

  useEffect(() => {
    onToggleFocusRef.current = onToggleFocus;
  }, [onToggleFocus]);

  useEffect(() => {
    onSaveVersionRef.current = onSaveVersion;
  }, [onSaveVersion]);

  // Build writing mode extensions based on settings
  const getWritingModeExtensions = useCallback(() => {
    const extensions: ReturnType<typeof typewriterExtension> = [];

    if (writingMode === 'typewriter' || writingMode === 'both') {
      extensions.push(...typewriterExtension());
    }

    if (writingMode === 'focus' || writingMode === 'both') {
      extensions.push(...focusExtension(focusLevel, focusIntensity));
    }

    return extensions;
  }, [writingMode, focusLevel, focusIntensity]);

  // Update writing mode extensions when settings change
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    view.dispatch({
      effects: writingModeCompartmentRef.current.reconfigure(getWritingModeExtensions()),
    });
  }, [getWritingModeExtensions]);

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

    // Keyboard shortcuts for writing modes and version saving
    const customKeymap = keymap.of([
      {
        key: 'Mod-Shift-t',
        run: () => {
          onToggleTypewriterRef.current?.();
          return true;
        },
      },
      {
        key: 'Mod-Shift-f',
        run: () => {
          onToggleFocusRef.current?.();
          return true;
        },
      },
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
        // Core
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        customKeymap,

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

        // Callouts (Obsidian-style)
        ...calloutsExtension(),

        // Writing modes (typewriter, focus) - dynamically reconfigurable
        writingModeCompartmentRef.current.of([]),

        // UI
        EditorView.lineWrapping,
        placeholder(placeholderText),

        // iOS spell check and autocorrect
        EditorView.contentAttributes.of({
          spellcheck: 'true',
          autocorrect: 'on',
          autocapitalize: 'sentences',
        }),

        // Listeners
        updateListener,
        blurHandler,

        // Theme
        EditorView.theme({
          '&': {
            height: '100%',
          },
          '.cm-content': {
            fontFamily: 'var(--font-atten), ui-sans-serif, system-ui, sans-serif',
            fontSize: '16px',
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
