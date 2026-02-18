'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import type { EditorView } from '@codemirror/view';
import { useDatabase } from '@/hooks/useDatabase';
import type { NoteDocument } from '@/lib/db';
import {
  Dropdown,
  DropdownCheckboxItem,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownTrigger,
} from '@/components/ui/Dropdown';
import { showToast } from '@/components/ui/Toast';
import type { BacklinkEntry } from 'codemirror-for-writers';
import {
  toggleTheme, getTheme,
  toggleHybridMode, getMode,
  toggleReadOnly, isReadOnly,
  toggleWritingModeSheet, isTypewriter, isFocusMode,
  toggleToolbar, isToolbar,
  toggleWordCount, isWordCount,
  toggleScrollPastEnd, isScrollPastEnd,
  toggleFrontmatterSheet, isFrontmatterSheet,
  actions,
} from 'codemirror-for-writers';
import {
  CodeMirrorEditor,
  type CodeMirrorEditorHandle,
  TemplatePicker,
  VersionHistory,
} from '@/components/editor';
import {
  saveVersion,
  shouldAutoSaveVersion,
  markVersionSaved,
} from '@/lib/versions';
import type { NoteProperties } from '@/lib/db';
import {
  parseFrontmatter,
  replaceFrontmatterBlock,
} from '@/lib/markdown/frontmatter';
import { syncNoteLinks, getBacklinks } from '@/lib/noteLinks';
import { extractNoteTitle } from '../noteUtils';
import styles from './NoteEditor.module.css';

const nowIso = () => new Date().toISOString();
const SAVE_DEBOUNCE_MS = 1000;

type NoteEditorProps = {
  noteId: string;
  onClose?: () => void;
};

function useCurrentGroup(): string {
  const pathname = usePathname();
  // pathname like /notes/all/noteId → group is "all"
  const parts = pathname?.replace(/^\/notes\/?/, '').split('/').filter(Boolean) ?? [];
  return parts[0] ?? 'all';
}

type EditorToggles = {
  isDark: boolean;
  isRaw: boolean;
  isReadOnlyMode: boolean;
  isWritingMode: boolean;
  isToolbarOn: boolean;
  isWordCountOn: boolean;
  isScrollPastEndOn: boolean;
  isFrontmatterOn: boolean;
};

const DEFAULT_TOGGLES: EditorToggles = {
  isDark: false,
  isRaw: false,
  isReadOnlyMode: false,
  isWritingMode: false,
  isToolbarOn: false,
  isWordCountOn: false,
  isScrollPastEndOn: true,
  isFrontmatterOn: false,
};

export function NoteEditor({ noteId, onClose }: NoteEditorProps) {
  const { db, isReady } = useDatabase();
  const router = useRouter();
  const currentGroup = useCurrentGroup();
  const [note, setNote] = useState<NoteDocument | null>(null);
  const [content, setContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [editorToggles, setEditorToggles] = useState<EditorToggles>(DEFAULT_TOGGLES);
  const cmRef = useRef<CodeMirrorEditorHandle>(null);
  const isDirtyRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContentRef = useRef('');

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    if (!db || !isReady || !noteId) return;

    const subscription = db.notes.findOne(noteId).$.subscribe((doc) => {
      setHasLoaded(true);
      const nextNote = doc ? (doc.toJSON() as NoteDocument) : null;
      setNote(nextNote);
      if (nextNote && !isDirtyRef.current) {
        const nextContent = nextNote.content ?? '';
        setContent(nextContent);
        lastSavedContentRef.current = nextContent;
      }
    });

    return () => subscription.unsubscribe();
  }, [db, isReady, noteId]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const derivedTitle = useMemo(
    () => extractNoteTitle(content, note?.title),
    [content, note?.title]
  );

  const handleClose = () => {
    onClose?.();
  };

  const handleDelete = async () => {
    if (!db || !note) return;
    const doc = await db.notes.findOne(note.id).exec();
    if (!doc) return;
    const timestamp = nowIso();
    await doc.patch({
      is_trashed: true,
      trashed_at: timestamp,
      updated_at: timestamp,
    });
    onClose?.();
  };

  const handleTogglePinned = async () => {
    if (!db || !note) return;
    const doc = await db.notes.findOne(note.id).exec();
    if (!doc) return;
    const timestamp = nowIso();
    await doc.patch({
      is_pinned: !note.is_pinned,
      updated_at: timestamp,
    });
  };

  const handleWikiLinkClick = useCallback(
    async (target: string, existingNoteId: string | null) => {
      if (!db) return;

      if (existingNoteId) {
        router.push(`/notes/${currentGroup}/${existingNoteId}`);
      } else {
        const shouldCreate = window.confirm(
          `Create new note "${target}"?`
        );
        if (!shouldCreate) return;

        const newNoteId = uuidv4();
        const timestamp = nowIso();
        await db.notes.insert({
          id: newNoteId,
          title: target,
          content: `# ${target}\n`,
          inbox_at: null,
          note_type: null,
          is_pinned: false,
          properties: null,
          created_at: timestamp,
          updated_at: timestamp,
          is_trashed: false,
          trashed_at: null,
        });
        router.push(`/notes/${currentGroup}/${newNoteId}`);
      }
    },
    [db, router, currentGroup]
  );

  // Use ref to always have latest save function available
  const saveContentRef = useRef<(content: string) => Promise<void>>(async () => {});

  saveContentRef.current = async (nextContent: string) => {
    if (!db || !noteId) return;
    if (nextContent === lastSavedContentRef.current) {
      setIsDirty(false);
      return;
    }
    const doc = await db.notes.findOne(noteId).exec();
    if (!doc) return;
    const timestamp = nowIso();
    let title = extractNoteTitle(nextContent, note?.title);
    let contentToSave = nextContent;
    let propertiesToSave = note?.properties ?? null;

    const frontmatterResult = parseFrontmatter(nextContent);
    if (frontmatterResult.errors.length > 0) {
      showToast('Frontmatter is invalid. Fix YAML to sync properties.');
      console.error('Frontmatter parse error', frontmatterResult.errors);
    } else {
      const parsedProperties = frontmatterResult.properties ?? null;
      const hasProperties =
        parsedProperties && Object.keys(parsedProperties).length > 0;
      propertiesToSave = hasProperties ? (parsedProperties as NoteProperties) : null;

      if (!hasProperties && frontmatterResult.hasFrontmatter) {
        contentToSave = replaceFrontmatterBlock(nextContent, null);
        title = extractNoteTitle(contentToSave, note?.title);
      }
    }

    await doc.patch({
      title,
      content: contentToSave,
      properties: propertiesToSave,
      updated_at: timestamp,
    });
    lastSavedContentRef.current = contentToSave;
    if (contentToSave !== nextContent) {
      setContent(contentToSave);
    }
    setIsDirty(false);

    syncNoteLinks(db, noteId, contentToSave).catch(() => {});

    if (shouldAutoSaveVersion(noteId)) {
      saveVersion(db, noteId, contentToSave, propertiesToSave, 'auto', 'Auto-save').catch(() => {});
    }
  };

  const scheduleSave = useCallback((nextContent: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveContentRef.current?.(nextContent);
    }, SAVE_DEBOUNCE_MS);
  }, []);

  const handleChange = useCallback((nextContent: string) => {
    setContent(nextContent);
    setIsDirty(true);
    scheduleSave(nextContent);
  }, [scheduleSave]);

  const handleBlur = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    if (isDirtyRef.current) {
      setContent((currentContent) => {
        saveContentRef.current?.(currentContent);
        return currentContent;
      });
    }
  }, []);

  const handleTemplateSelect = useCallback((templateContent: string) => {
    const currentContent = content.trim();
    const newContent = currentContent
      ? `${templateContent}\n\n${currentContent}`
      : templateContent;

    setContent(newContent);
    setIsDirty(true);
    scheduleSave(newContent);

    setEditorKey((k) => k + 1);
  }, [content, scheduleSave]);

  const handleSaveVersion = useCallback(async () => {
    if (!db || !noteId || !note) return;

    if (isDirtyRef.current) {
      await saveContentRef.current?.(content);
    }

    await saveVersion(
      db,
      noteId,
      note.content,
      note.properties,
      'manual',
      'Manual save'
    );
  }, [db, noteId, note, content]);

  const handleVersionRestore = useCallback(() => {
    setEditorKey((k) => k + 1);
    markVersionSaved(noteId);
  }, [noteId]);

  const handleMenuOpenChange = useCallback((open: boolean) => {
    if (!open) return;
    const view = cmRef.current?.view;
    if (!view) return;
    setEditorToggles({
      isDark: getTheme(view) === 'dark',
      isRaw: getMode(view) === 'raw',
      isReadOnlyMode: isReadOnly(view),
      isWritingMode: isTypewriter(view) || isFocusMode(view),
      isToolbarOn: isToolbar(view),
      isWordCountOn: isWordCount(view),
      isScrollPastEndOn: isScrollPastEnd(view),
      isFrontmatterOn: isFrontmatterSheet(view),
    });
  }, []);

  const cmToggle = useCallback((fn: (v: EditorView) => void) => {
    const view = cmRef.current?.view;
    if (view) fn(view);
  }, []);

  const handleBacklinksRequested = useCallback(
    async (title: string): Promise<BacklinkEntry[]> => {
      if (!db || !noteId) return [];
      try {
        const links = await getBacklinks(db, noteId);
        return links.map((link) => ({ title: link.title }));
      } catch {
        return [];
      }
    },
    [db, noteId]
  );

  const handleBacklinkClick = useCallback(
    (backlink: BacklinkEntry) => {
      if (!db) return;
      db.notes
        .find({ selector: { title: backlink.title, is_trashed: false } })
        .exec()
        .then((docs) => {
          if (docs.length > 0) {
            router.push(`/notes/${currentGroup}/${docs[0].id}`);
          }
        })
        .catch(() => {});
    },
    [db, router, currentGroup]
  );

  if (!noteId) {
    return (
      <section className={styles.editor}>
        <p className={styles.empty}>Note not found.</p>
      </section>
    );
  }

  if (!hasLoaded) {
    return (
      <section className={styles.editor}>
        <p className={styles.empty}>Loading note...</p>
      </section>
    );
  }

  if (!note) {
    return (
      <section className={styles.editor}>
        <p className={styles.empty}>Note not found.</p>
      </section>
    );
  }

  return (
    <section className={styles.editor}>
      <header className={styles.header}>
        {onClose ? (
          <>
            <div className={`${styles.headerActions} ${styles.headerActionsLeft}`}>
              <button
                type="button"
                className={styles.actionButton}
                aria-label="Go back"
                onClick={handleClose}
              >
                <BackIcon />
              </button>
            </div>
            <div className={`${styles.headerActions} ${styles.headerActionsRight}`}>
              <Dropdown onOpenChange={handleMenuOpenChange}>
                <DropdownTrigger asChild>
                  <button
                    type="button"
                    className={styles.actionButton}
                    aria-label="Note actions"
                  >
                    <MoreIcon />
                  </button>
                </DropdownTrigger>
                <DropdownContent align="end" sideOffset={12}>
                  <DropdownItem onSelect={handleClose}>Close</DropdownItem>
                  <DropdownItem onSelect={() => setIsTemplatePickerOpen(true)}>
                    Insert Template
                  </DropdownItem>
                  <DropdownItem onSelect={() => setIsVersionHistoryOpen(true)}>
                    Version History
                  </DropdownItem>
                  <DropdownItem onSelect={handleTogglePinned}>
                    {note.is_pinned ? 'Unpin' : 'Pin'}
                  </DropdownItem>
                  <DropdownSeparator />
                  <DropdownItem data-variant="danger" onSelect={handleDelete}>
                    Trash
                  </DropdownItem>
                  <DropdownSeparator />
                  <DropdownCheckboxItem
                    checked={editorToggles.isDark}
                    onCheckedChange={() => cmToggle(toggleTheme)}
                  >
                    Dark mode
                  </DropdownCheckboxItem>
                  <DropdownCheckboxItem
                    checked={editorToggles.isRaw}
                    onCheckedChange={() => cmToggle(toggleHybridMode)}
                  >
                    Raw markdown
                  </DropdownCheckboxItem>
                  <DropdownCheckboxItem
                    checked={editorToggles.isReadOnlyMode}
                    onCheckedChange={() => cmToggle(toggleReadOnly)}
                  >
                    Read-only
                  </DropdownCheckboxItem>
                  <DropdownCheckboxItem
                    checked={editorToggles.isWritingMode}
                    onCheckedChange={() => cmToggle(toggleWritingModeSheet)}
                  >
                    Writing mode
                  </DropdownCheckboxItem>
                  <DropdownSeparator />
                  <DropdownCheckboxItem
                    checked={editorToggles.isToolbarOn}
                    onCheckedChange={() => cmToggle(toggleToolbar)}
                  >
                    Toolbar
                  </DropdownCheckboxItem>
                  <DropdownCheckboxItem
                    checked={editorToggles.isWordCountOn}
                    onCheckedChange={() => cmToggle(toggleWordCount)}
                  >
                    Word count
                  </DropdownCheckboxItem>
                  <DropdownCheckboxItem
                    checked={editorToggles.isScrollPastEndOn}
                    onCheckedChange={() => cmToggle(toggleScrollPastEnd)}
                  >
                    Scroll past end
                  </DropdownCheckboxItem>
                  <DropdownCheckboxItem
                    checked={editorToggles.isFrontmatterOn}
                    onCheckedChange={() => cmToggle(toggleFrontmatterSheet)}
                  >
                    Frontmatter
                  </DropdownCheckboxItem>
                  <DropdownSeparator />
                  <DropdownItem onSelect={() => cmToggle((v) => actions.search(v))}>
                    Find &amp; Replace
                  </DropdownItem>
                </DropdownContent>
              </Dropdown>
            </div>
          </>
        ) : null}
      </header>

      <div className={styles.editorPane}>
        <CodeMirrorEditor
          ref={cmRef}
          key={editorKey}
          initialContent={content}
          content={isDirty ? undefined : content}
          onChange={handleChange}
          onBlur={handleBlur}
          onWikiLinkClick={handleWikiLinkClick}
          onBacklinksRequested={handleBacklinksRequested}
          onBacklinkClick={handleBacklinkClick}
          noteTitle={derivedTitle !== 'Untitled' ? derivedTitle : undefined}
          placeholderText="Start writing..."
          autoFocus
          db={db}
          onSaveVersion={handleSaveVersion}
        />
      </div>

      <TemplatePicker
        open={isTemplatePickerOpen}
        onOpenChange={setIsTemplatePickerOpen}
        onSelect={handleTemplateSelect}
        customTitle={derivedTitle !== 'Untitled' ? derivedTitle : undefined}
      />

      <VersionHistory
        open={isVersionHistoryOpen}
        onOpenChange={setIsVersionHistoryOpen}
        noteId={noteId}
        db={db}
        onRestore={handleVersionRestore}
      />
    </section>
  );
}

function BackIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={styles.actionIcon}
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="currentColor"
      className={styles.actionIcon}
    >
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  );
}
