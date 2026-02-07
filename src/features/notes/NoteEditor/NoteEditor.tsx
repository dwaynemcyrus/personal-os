'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useDatabase } from '@/hooks/useDatabase';
import { useNavigationActions } from '@/components/providers';
import type { NoteDocument } from '@/lib/db';
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownTrigger,
} from '@/components/ui/Dropdown';
import {
  CodeMirrorEditor,
  PropertiesSheet,
  BacklinksPanel,
  UnlinkedMentions,
  TemplatePicker,
  FocusSettings,
  VersionHistory,
  type WritingModeSettings,
} from '@/components/editor';
import {
  saveVersion,
  shouldAutoSaveVersion,
  markVersionSaved,
} from '@/lib/versions';
import type { NoteProperties } from '@/lib/db';
import { syncNoteLinks } from '@/lib/noteLinks';
import {
  extractNoteTitle,
  formatNoteTitle,
  formatRelativeTime,
} from '../noteUtils';
import styles from './NoteEditor.module.css';

const nowIso = () => new Date().toISOString();
const SAVE_DEBOUNCE_MS = 1000;

type NoteEditorProps = {
  noteId: string;
  onClose?: () => void;
};

export function NoteEditor({ noteId, onClose }: NoteEditorProps) {
  const { db, isReady } = useDatabase();
  const { pushLayer } = useNavigationActions();
  const [note, setNote] = useState<NoteDocument | null>(null);
  const [content, setContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
  const [isFocusSettingsOpen, setIsFocusSettingsOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [writingModeSettings, setWritingModeSettings] = useState<WritingModeSettings>({
    mode: 'normal',
    focusLevel: 'sentence',
    focusIntensity: 0.3,
  });
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

  const displayTitle = useMemo(
    () => formatNoteTitle(derivedTitle),
    [derivedTitle]
  );

  const updatedLabel = useMemo(
    () => formatRelativeTime(note?.updated_at),
    [note?.updated_at]
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

  const handleSaveProperties = async (properties: NoteProperties) => {
    if (!db || !note) return;
    const doc = await db.notes.findOne(note.id).exec();
    if (!doc) return;
    const timestamp = nowIso();
    await doc.patch({
      properties,
      updated_at: timestamp,
    });
  };

  const handleWikiLinkClick = useCallback(
    async (target: string, existingNoteId: string | null) => {
      if (!db) return;

      if (existingNoteId) {
        // Note exists, navigate to it
        pushLayer({ view: 'thoughts-note', noteId: existingNoteId });
      } else {
        // Note doesn't exist, ask user to confirm creation
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
        pushLayer({ view: 'thoughts-note', noteId: newNoteId });
      }
    },
    [db, pushLayer]
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
    const title = extractNoteTitle(nextContent, note?.title);
    await doc.patch({
      title,
      content: nextContent,
      updated_at: timestamp,
    });
    lastSavedContentRef.current = nextContent;
    setIsDirty(false);

    // Sync wiki-links in background (don't await)
    syncNoteLinks(db, noteId, nextContent).catch(() => {
      // Ignore errors - link sync is non-critical
    });

    // Check if we should auto-save a version (30 min interval)
    if (shouldAutoSaveVersion(noteId)) {
      saveVersion(db, noteId, nextContent, note?.properties ?? null, 'auto', 'Auto-save').catch(() => {
        // Ignore errors - version save is non-critical
      });
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
      // Get latest content from state
      setContent((currentContent) => {
        saveContentRef.current?.(currentContent);
        return currentContent;
      });
    }
  }, []);

  const handleTemplateSelect = useCallback((templateContent: string) => {
    // If note is empty, replace content; otherwise prepend template
    const currentContent = content.trim();
    const newContent = currentContent
      ? `${templateContent}\n\n${currentContent}`
      : templateContent;

    setContent(newContent);
    setIsDirty(true);
    scheduleSave(newContent);

    // Force editor remount with new content
    setEditorKey((k) => k + 1);
  }, [content, scheduleSave]);

  const handleToggleTypewriter = useCallback(() => {
    setWritingModeSettings((prev) => {
      if (prev.mode === 'normal') return { ...prev, mode: 'typewriter' };
      if (prev.mode === 'typewriter') return { ...prev, mode: 'normal' };
      if (prev.mode === 'focus') return { ...prev, mode: 'both' };
      if (prev.mode === 'both') return { ...prev, mode: 'focus' };
      return prev;
    });
  }, []);

  const handleToggleFocus = useCallback(() => {
    setWritingModeSettings((prev) => {
      if (prev.mode === 'normal') return { ...prev, mode: 'focus' };
      if (prev.mode === 'focus') return { ...prev, mode: 'normal' };
      if (prev.mode === 'typewriter') return { ...prev, mode: 'both' };
      if (prev.mode === 'both') return { ...prev, mode: 'typewriter' };
      return prev;
    });
  }, []);

  // Manual version save (Cmd+S)
  const handleSaveVersion = useCallback(async () => {
    if (!db || !noteId || !note) return;

    // First save any pending content changes
    if (isDirtyRef.current) {
      await saveContentRef.current?.(content);
    }

    // Then save a version snapshot
    await saveVersion(
      db,
      noteId,
      note.content,
      note.properties,
      'manual',
      'Manual save'
    );
  }, [db, noteId, note, content]);

  // Called when a version is restored
  const handleVersionRestore = useCallback(() => {
    // Force editor to reload with restored content
    setEditorKey((k) => k + 1);
    // Mark version saved to reset auto-save timer
    markVersionSaved(noteId);
  }, [noteId]);

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
        <div>
          <div className={styles.title}>{displayTitle}</div>
          <div className={styles.meta}>Updated {updatedLabel}</div>
        </div>
        {onClose ? (
          <Dropdown>
            <DropdownTrigger asChild>
              <button
                type="button"
                className={styles.more}
                aria-label="Note actions"
              >
                <MoreIcon />
              </button>
            </DropdownTrigger>
            <DropdownContent align="end" sideOffset={12}>
              <DropdownItem onSelect={handleClose}>Close</DropdownItem>
              <DropdownItem onSelect={() => setIsPropertiesOpen(true)}>
                Properties
              </DropdownItem>
              <DropdownItem onSelect={() => setIsTemplatePickerOpen(true)}>
                Insert Template
              </DropdownItem>
              <DropdownItem onSelect={() => setIsFocusSettingsOpen(true)}>
                Writing Mode
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
            </DropdownContent>
          </Dropdown>
        ) : null}
      </header>

      <CodeMirrorEditor
        key={editorKey}
        initialContent={content}
        content={isDirty ? undefined : content}
        onChange={handleChange}
        onBlur={handleBlur}
        onWikiLinkClick={handleWikiLinkClick}
        placeholderText="Start writing..."
        autoFocus
        db={db}
        writingMode={writingModeSettings.mode}
        focusLevel={writingModeSettings.focusLevel}
        focusIntensity={writingModeSettings.focusIntensity}
        onToggleTypewriter={handleToggleTypewriter}
        onToggleFocus={handleToggleFocus}
        onSaveVersion={handleSaveVersion}
      />

      <BacklinksPanel
        noteId={noteId}
        db={db}
        onNavigate={(targetNoteId) => {
          pushLayer({ view: 'thoughts-note', noteId: targetNoteId });
        }}
      />

      <UnlinkedMentions
        noteTitle={derivedTitle}
        db={db}
        onNavigate={(targetNoteId) => {
          pushLayer({ view: 'thoughts-note', noteId: targetNoteId });
        }}
      />

      <PropertiesSheet
        open={isPropertiesOpen}
        onOpenChange={setIsPropertiesOpen}
        noteId={noteId}
        properties={note.properties ?? null}
        onSave={handleSaveProperties}
      />

      <TemplatePicker
        open={isTemplatePickerOpen}
        onOpenChange={setIsTemplatePickerOpen}
        onSelect={handleTemplateSelect}
        customTitle={derivedTitle !== 'Untitled' ? derivedTitle : undefined}
      />

      <FocusSettings
        open={isFocusSettingsOpen}
        onOpenChange={setIsFocusSettingsOpen}
        settings={writingModeSettings}
        onSettingsChange={setWritingModeSettings}
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

function MoreIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="currentColor"
      className={styles.moreIcon}
    >
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  );
}
