import { useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useNavigationActions } from '@/components/providers';
import type { ItemRow } from '@/lib/db';
import { insertItem, patchItem } from '@/lib/db';
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownTrigger,
} from '@/components/ui/Dropdown';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { CodeMirrorEditor } from '@/components/editor';
import type { CodeMirrorEditorHandle } from '@/components/editor';
import { saveVersion, shouldAutoSaveVersion } from '@/lib/versions';
import { nowIso } from '@/lib/time';
import { extractNoteTitle, formatRelativeTime } from '../noteUtils';
import { parseFrontmatter } from '@/lib/markdown/frontmatter';
import { generateSlug } from '@/lib/slug';
import { parseWikilinks, renameWikilinks } from '@/lib/wikilinks';
import { useHeaderSlot } from '@/components/layout/AppShell/HeaderSlot';
import { BacklinksSheet } from './BacklinksSheet';
import { VersionHistorySheet } from './VersionHistorySheet';
import { TagsDialog } from './TagsDialog';
import { TemplatePicker } from '../TemplatePicker/TemplatePicker';
import { mergeTemplateIntoNote, replaceTemplateVariables } from '@/lib/templates';
import { fetchUserSettings, DEFAULT_USER_SETTINGS } from '@/lib/userSettings';
import { showToast } from '@/components/ui/Toast';
import styles from './NoteEditor.module.css';

const SAVE_DEBOUNCE_MS = 1000;

type NoteEditorProps = {
  noteId: string;
  onClose?: () => void;
};

export function NoteEditor({ noteId, onClose }: NoteEditorProps) {
  const { setSlot } = useHeaderSlot();
  const { pushLayer } = useNavigationActions();

  // Note metadata (no content)
  const { data: note, isLoading: noteLoading } = useQuery({
    queryKey: ['note', noteId],
    queryFn: async (): Promise<ItemRow | null> => {
      const { data, error } = await supabase
        .from('items')
        .select('id, title, filename, updated_at, created_at, is_pinned, is_trashed, item_status, tags, priority, due_date, start_date, inbox_at, subtype, type, owner, completed, is_next, is_someday, is_waiting, waiting_note, body, capture_source, processed, processed_at, result_type, result_id, description, category, sort_order, parent_id, trashed_at, content_type, read_status, url, depends_on, waiting_started_at, period_start, period_end, progress, frequency, target, active, streak, last_completed_at, has_todos')
        .eq('id', noteId)
        .maybeSingle();
      if (error) return null;
      return data as unknown as ItemRow;
    },
    staleTime: 30_000,
  });

  // Note content from item_content table
  const { data: contentRow, isLoading: contentLoading } = useQuery({
    queryKey: ['note', noteId, 'content'],
    queryFn: async (): Promise<{ content: string | null } | null> => {
      const { data } = await supabase
        .from('item_content')
        .select('content')
        .eq('item_id', noteId)
        .maybeSingle();
      return data ?? { content: null };
    },
    staleTime: Infinity, // Editor manages its own content state
    refetchOnWindowFocus: false,
  });

  // All notes for wikilink autocomplete (titles only, no content)
  const { data: allNotes = [] } = useQuery({
    queryKey: ['notes', 'titles'],
    queryFn: async (): Promise<Pick<ItemRow, 'id' | 'title' | 'filename'>[]> => {
      const { data } = await supabase
        .from('items')
        .select('id, title, filename')
        .eq('type', 'note')
        .eq('is_trashed', false);
      return (data ?? []) as Pick<ItemRow, 'id' | 'title' | 'filename'>[];
    },
    staleTime: 5 * 60_000,
  });

  // Duplicate title detection
  const { data: dupRows = [] } = useQuery({
    queryKey: ['note', noteId, 'dups', note?.title ?? ''],
    queryFn: async () => {
      if (!note?.title) return [];
      const { data } = await supabase
        .from('items')
        .select('id')
        .eq('type', 'note')
        .eq('is_trashed', false)
        .eq('title', note.title)
        .neq('id', noteId);
      return data ?? [];
    },
    enabled: Boolean(note?.title),
    staleTime: 60_000,
  });
  const hasDuplicateTitle = dupRows.length > 0;

  const hasLoaded = !noteLoading && !contentLoading;

  const [content, setContent] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [backlinksOpen, setBacklinksOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [disambigMatches, setDisambigMatches] = useState<Pick<ItemRow, 'id' | 'title' | 'filename'>[] | null>(null);
  const [confirmCreateTitle, setConfirmCreateTitle] = useState<string | null>(null);
  const [pendingHeader, setPendingHeader] = useState<string | undefined>(undefined);
  const [editingFilename, setEditingFilename] = useState('');
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
  const filenameFocusedRef = useRef(false);
  const editorRef = useRef<CodeMirrorEditorHandle>(null);

  const isDirtyRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContentRef = useRef('');
  const contentRef = useRef('');
  const allNotesRef = useRef(allNotes);
  const noteRef = useRef(note);

  useEffect(() => { isDirtyRef.current = isDirty; }, [isDirty]);
  useEffect(() => { allNotesRef.current = allNotes; }, [allNotes]);
  useEffect(() => { noteRef.current = note ?? null; }, [note]);

  // Sync filename strip from note metadata when strip is not being edited
  useEffect(() => {
    if (!filenameFocusedRef.current && note?.filename) {
      setEditingFilename(note.filename);
    }
  }, [note?.filename]);

  // Clear the 'imported' review tag the first time this note is opened
  useEffect(() => {
    if (!note?.id) return;
    const tags: string[] = Array.isArray(note.tags) ? note.tags as string[] : [];
    if (!tags.includes('imported')) return;
    const nextTags = tags.filter((t) => t !== 'imported');
    patchItem(note.id, { tags: nextTags, updated_at: nowIso() }).then(() => {
      queryClient.invalidateQueries({ queryKey: ['note', note.id] });
      queryClient.invalidateQueries({ queryKey: ['notes', 'list'] });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note?.id]);

  // Apply content when note loads (or refreshes) if editor is not dirty
  useEffect(() => {
    if (!contentRow || isDirtyRef.current) return;
    const nextContent = contentRow.content ?? '';
    setContent(nextContent);
    lastSavedContentRef.current = nextContent;
  }, [contentRow]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (isDirtyRef.current) {
        saveContentRef.current(contentRef.current).catch(() => {});
      }
    };
  }, []);

  const saveContentRef = useRef<(c: string) => Promise<void>>(async () => {});
  saveContentRef.current = async (nextContent: string) => {
    if (noteRef.current?.is_trashed) return;
    if (nextContent === lastSavedContentRef.current) { setIsDirty(false); return; }
    const fm = parseFrontmatter(nextContent);
    const fmProps = fm.properties ?? {};

    const title = typeof fmProps.title === 'string' && fmProps.title.trim()
      ? fmProps.title.trim()
      : extractNoteTitle(nextContent, noteRef.current?.title ?? undefined);

    const filename = typeof fmProps.filename === 'string' && fmProps.filename.trim()
      ? fmProps.filename.trim()
      : (noteRef.current?.filename ?? generateSlug(title));

    const patch: Parameters<typeof patchItem>[1] = {
      title,
      content: nextContent,
      filename,
      updated_at: nowIso(),
    };

    if ('due_date' in fmProps) patch.due_date = typeof fmProps.due_date === 'string' ? fmProps.due_date : null;
    if ('start_date' in fmProps) patch.start_date = typeof fmProps.start_date === 'string' ? fmProps.start_date : null;
    if ('priority' in fmProps) patch.priority = typeof fmProps.priority === 'string' ? fmProps.priority : null;
    if ('tags' in fmProps) {
      patch.tags = Array.isArray(fmProps.tags)
        ? (fmProps.tags as unknown[]).filter((t): t is string => typeof t === 'string')
        : [];
    }

    const oldTitle = noteRef.current?.title;
    if (oldTitle && oldTitle !== title) {
      propagateRename(oldTitle, title, noteId).catch(() => {});
    }

    await patchItem(noteId, patch);
    lastSavedContentRef.current = nextContent;
    setIsDirty(false);

    // Invalidate note metadata and list caches
    queryClient.invalidateQueries({ queryKey: ['note', noteId] });
    queryClient.invalidateQueries({ queryKey: ['notes', 'list'] });
    queryClient.invalidateQueries({ queryKey: ['notes', 'counts'] });
    queryClient.invalidateQueries({ queryKey: ['notes', 'titles'] });

    if (shouldAutoSaveVersion(noteId)) {
      saveVersion(noteId, nextContent, null, 'auto', 'Auto-save').catch(() => {});
    }

    syncItemLinks(noteId, nextContent, allNotesRef.current).catch(() => {});
  };

  const scheduleSave = useCallback((nextContent: string) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveContentRef.current(nextContent), SAVE_DEBOUNCE_MS);
  }, []);

  const handleChange = useCallback((nextContent: string) => {
    contentRef.current = nextContent;
    isDirtyRef.current = true;
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
      setContent((curr) => { saveContentRef.current(curr ?? ''); return curr; });
    }
  }, []);

  const handleRestore = useCallback(async () => {
    if (!note) return;
    await patchItem(note.id, { is_trashed: false, trashed_at: null, updated_at: nowIso() });
    queryClient.invalidateQueries({ queryKey: ['note', noteId] });
    queryClient.invalidateQueries({ queryKey: ['notes', 'list'] });
    queryClient.invalidateQueries({ queryKey: ['notes', 'counts'] });
  }, [note, noteId]);

  const handleDelete = useCallback(async () => {
    if (!note) return;
    const timestamp = nowIso();
    await patchItem(note.id, { is_trashed: true, trashed_at: timestamp, updated_at: timestamp });
    queryClient.invalidateQueries({ queryKey: ['note', noteId] });
    queryClient.invalidateQueries({ queryKey: ['notes', 'list'] });
    queryClient.invalidateQueries({ queryKey: ['notes', 'counts'] });
    onClose?.();
  }, [note, noteId, onClose]);

  const handleTogglePinned = useCallback(async () => {
    if (!note) return;
    await patchItem(note.id, { is_pinned: !note.is_pinned, updated_at: nowIso() });
    queryClient.invalidateQueries({ queryKey: ['note', noteId] });
    queryClient.invalidateQueries({ queryKey: ['notes', 'list'] });
  }, [note, noteId]);

  const handleRestoreVersion = useCallback((restoredContent: string) => {
    contentRef.current = restoredContent;
    lastSavedContentRef.current = restoredContent + '\0'; // sentinel — force save
    setContent(restoredContent);
    setIsDirty(false);
    saveContentRef.current(restoredContent).catch(() => {});
  }, []);

  const handleExport = useCallback((ext: 'md' | 'txt') => {
    const filename = (note?.filename ?? generateSlug(note?.title ?? 'untitled')) + '.' + ext;
    const mime = ext === 'md' ? 'text/markdown' : 'text/plain';
    const blob = new Blob([contentRef.current], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [note]);

  const handleWikilinkClick = useCallback((title: string, header?: string) => {
    const matches = allNotesRef.current.filter(
      (n) => n.title?.toLowerCase() === title.toLowerCase()
    );
    if (matches.length === 0) {
      setPendingHeader(header);
      setConfirmCreateTitle(title);
    } else if (matches.length === 1) {
      pushLayer({ view: 'note-detail', noteId: matches[0].id });
    } else {
      setPendingHeader(header);
      setDisambigMatches(matches);
    }
  }, [pushLayer]);

  const handleConfirmCreate = useCallback(async () => {
    if (!confirmCreateTitle) return;
    const newId = uuidv4();
    const timestamp = nowIso();
    await insertItem({
      id: newId,
      type: 'note',
      parent_id: null,
      title: confirmCreateTitle,
      filename: generateSlug(confirmCreateTitle),
      content: `# ${confirmCreateTitle}\n`,
      inbox_at: null,
      subtype: null,
      is_pinned: false,
      item_status: 'backlog',
      completed: false,
      is_next: false,
      is_someday: false,
      is_waiting: false,
      processed: false,
      created_at: timestamp,
      updated_at: timestamp,
    });
    queryClient.invalidateQueries({ queryKey: ['notes'] });
    setConfirmCreateTitle(null);
    pushLayer({ view: 'note-detail', noteId: newId });
  }, [confirmCreateTitle, pushLayer]);

  const handleInsertTemplate = useCallback(async (templateId: string | null) => {
    setIsTemplatePickerOpen(false);
    if (!templateId) return;
    try {
      const { data: contentRow } = await supabase
        .from('item_content')
        .select('content')
        .eq('item_id', templateId)
        .maybeSingle();
      const rawTemplate = contentRow?.content ?? '';
      if (!rawTemplate) return;

      const settings = await fetchUserSettings();
      const resolvedTemplate = replaceTemplateVariables(rawTemplate, {
        title: noteRef.current?.title ?? 'Untitled',
        date: new Date(),
        dateFormat: settings?.template_date_format ?? DEFAULT_USER_SETTINGS.template_date_format,
        timeFormat: settings?.template_time_format ?? DEFAULT_USER_SETTINGS.template_time_format,
      });

      const cursorOffset = editorRef.current?.getCursorOffset() ?? contentRef.current.length;
      const merged = mergeTemplateIntoNote(contentRef.current, resolvedTemplate, cursorOffset);

      editorRef.current?.replaceContent(merged);
      // Trigger onChange so the save cycle picks it up
      handleChange(merged);
    } catch {
      showToast('Could not insert template — please try again.');
    }
  }, [handleChange]);

  const noteTitles = allNotes
    .filter((n) => n.id !== noteId && n.title)
    .map((n) => n.title as string);

  // Push note actions into the AppShell topbar
  useEffect(() => {
    if (!note) { setSlot({}); return; }
    setSlot({
      right: (
        <Dropdown>
          <DropdownTrigger asChild>
            <button type="button" className={styles.actionBtn} aria-label="Note actions">
              <DotsIcon />
            </button>
          </DropdownTrigger>
          <DropdownContent align="end" sideOffset={12}>
            {note.is_trashed ? (
              <>
                <DropdownItem onSelect={handleRestore}>Restore</DropdownItem>
                <DropdownItem onSelect={() => setBacklinksOpen(true)}>Backlinks</DropdownItem>
                <DropdownSeparator />
                <DropdownItem disabled>Trashed {formatRelativeTime(note.trashed_at ?? note.updated_at)}</DropdownItem>
              </>
            ) : (
              <>
                <DropdownItem onSelect={handleTogglePinned}>
                  {note.is_pinned ? 'Unpin' : 'Pin'}
                </DropdownItem>
                <DropdownItem onSelect={() => setTagsOpen(true)}>
                  Tags
                </DropdownItem>
                <DropdownItem onSelect={() => setIsTemplatePickerOpen(true)}>
                  Insert Template…
                </DropdownItem>
                <DropdownItem onSelect={() => setBacklinksOpen(true)}>
                  Backlinks
                </DropdownItem>
                <DropdownItem onSelect={() => setVersionsOpen(true)}>
                  Version History
                </DropdownItem>
                <DropdownSeparator />
                <DropdownItem onSelect={() => handleExport('md')}>Export as .md</DropdownItem>
                <DropdownItem onSelect={() => handleExport('txt')}>Export as .txt</DropdownItem>
                <DropdownSeparator />
                <DropdownItem disabled>Created {formatRelativeTime(note.created_at)}</DropdownItem>
                <DropdownItem disabled>Updated {formatRelativeTime(note.updated_at)}</DropdownItem>
                <DropdownSeparator />
                <DropdownItem data-variant="danger" onSelect={handleDelete}>Trash</DropdownItem>
              </>
            )}
          </DropdownContent>
        </Dropdown>
      ),
    });
    return () => setSlot({});
  }, [note, setSlot, handleTogglePinned, handleDelete, handleRestore, handleExport]);

  if (!hasLoaded || content === null) {
    return <p className={styles.state}>Loading…</p>;
  }

  if (!note) {
    return <p className={styles.state}>Note not found.</p>;
  }

  if (note.is_trashed) {
    return (
      <>
        <div className={styles.trashedBanner}>
          <span>This note is in the trash.</span>
          <button type="button" className={styles.trashedRestoreBtn} onClick={() => void handleRestore()}>
            Restore
          </button>
        </div>
        <div className={styles.trashedContent}>{content || '(empty)'}</div>
        <BacklinksSheet
          open={backlinksOpen}
          onOpenChange={setBacklinksOpen}
          noteId={noteId}
          noteTitle={note.title}
          onOpenNote={(id) => pushLayer({ view: 'note-detail', noteId: id })}
        />
      </>
    );
  }

  void pendingHeader;

  return (
    <>
      {hasDuplicateTitle && (
        <p className={styles.duplicateWarning}>
          Another note shares this title — export filenames may conflict.
        </p>
      )}

      {/* Bear-style filename strip */}
      <div className={styles.filenameStrip}>
        <span className={styles.filenameLabel} aria-hidden>filename</span>
        <input
          type="text"
          className={styles.filenameInput}
          value={editingFilename}
          onChange={(e) => setEditingFilename(e.target.value)}
          onFocus={() => { filenameFocusedRef.current = true; }}
          onBlur={async () => {
            filenameFocusedRef.current = false;
            const trimmed = editingFilename.trim();
            if (!trimmed || trimmed === note.filename) return;
            await patchItem(noteId, { filename: trimmed, updated_at: nowIso() });
            queryClient.invalidateQueries({ queryKey: ['note', noteId] });
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            if (e.key === 'Escape') {
              setEditingFilename(note.filename ?? '');
              filenameFocusedRef.current = false;
              (e.target as HTMLInputElement).blur();
            }
          }}
          placeholder="filename"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Note filename"
        />
      </div>

      <CodeMirrorEditor
        ref={editorRef}
        initialBody={content!}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="Start writing…"
        autoFocus
        noteTitles={noteTitles}
        onWikilinkClick={handleWikilinkClick}
      />

      <BacklinksSheet
        open={backlinksOpen}
        onOpenChange={setBacklinksOpen}
        noteId={noteId}
        noteTitle={note.title}
        onOpenNote={(id) => pushLayer({ view: 'note-detail', noteId: id })}
      />

      <VersionHistorySheet
        open={versionsOpen}
        onOpenChange={setVersionsOpen}
        noteId={noteId}
        currentContent={contentRef.current}
        onRestore={handleRestoreVersion}
      />

      <TagsDialog
        open={tagsOpen}
        onOpenChange={setTagsOpen}
        noteId={noteId}
        tags={(note.tags as string[] | null) ?? []}
      />

      {/* Disambiguation sheet */}
      <Sheet open={disambigMatches !== null} onOpenChange={(o) => { if (!o) setDisambigMatches(null); }}>
        <SheetContent side="bottom" ariaLabel="Multiple notes found" className={styles.sheet}>
          <p className={styles.sheetTitle}>Multiple notes found — which one?</p>
          <ul className={styles.sheetList}>
            {(disambigMatches ?? []).map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  className={styles.sheetItem}
                  onClick={() => {
                    setDisambigMatches(null);
                    pushLayer({ view: 'note-detail', noteId: n.id });
                  }}
                >
                  <span className={styles.sheetItemTitle}>{n.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>

      <TemplatePicker
        open={isTemplatePickerOpen}
        onOpenChange={setIsTemplatePickerOpen}
        onSelect={(id) => void handleInsertTemplate(id)}
        showBlankOption={false}
      />

      {/* Confirm create sheet */}
      <Sheet open={confirmCreateTitle !== null} onOpenChange={(o) => { if (!o) setConfirmCreateTitle(null); }}>
        <SheetContent side="bottom" ariaLabel="Create new note" className={styles.sheet}>
          <p className={styles.sheetTitle}>
            No note found for <strong>"{confirmCreateTitle}"</strong>. Create it?
          </p>
          <div className={styles.sheetActions}>
            <button type="button" className={styles.sheetBtnCancel} onClick={() => setConfirmCreateTitle(null)}>
              Cancel
            </button>
            <button type="button" className={styles.sheetBtnCreate} onClick={handleConfirmCreate}>
              Create Note
            </button>
          </div>
        </SheetContent>
      </Sheet>

    </>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function syncItemLinks(
  sourceId: string,
  content: string,
  allNotes: Pick<ItemRow, 'id' | 'title' | 'filename'>[]
) {
  const wikilinks = parseWikilinks(content);

  const byTitle = new Map<string, Pick<ItemRow, 'id' | 'title' | 'filename'>[]>();
  for (const n of allNotes) {
    if (!n.title) continue;
    const key = n.title.toLowerCase();
    byTitle.set(key, [...(byTitle.get(key) ?? []), n]);
  }

  await supabase.from('item_links').delete().eq('source_id', sourceId);

  const timestamp = nowIso();
  const links = wikilinks.map((wl) => {
    const matches = byTitle.get(wl.title.toLowerCase()) ?? [];
    const targetId = matches.length === 1 ? (matches[0].id ?? null) : null;
    return {
      id: uuidv4(),
      source_id: sourceId,
      target_id: targetId,
      target_title: wl.title,
      header: wl.header ?? null,
      alias: wl.alias ?? null,
      position: wl.from,
      created_at: timestamp,
      updated_at: timestamp,
      is_trashed: false,
      trashed_at: null,
    };
  });

  if (links.length > 0) {
    await supabase.from('item_links').insert(
      links.map((l) => ({ ...l, owner: null }))
    );
  }
}

async function propagateRename(
  oldTitle: string,
  newTitle: string,
  skipId: string
) {
  // Find all note content that might contain the old wikilink
  const { data: contentRows } = await supabase
    .from('item_content')
    .select('item_id, content')
    .ilike('content', `%[[${oldTitle}%`);

  if (!contentRows?.length) return;

  const timestamp = nowIso();
  for (const row of contentRows) {
    if (row.item_id === skipId) continue;
    const c = row.content ?? '';
    if (!c.includes(`[[${oldTitle}`)) continue;
    const updated = renameWikilinks(c, oldTitle, newTitle);
    if (updated !== c) {
      await supabase
        .from('item_content')
        .update({ content: updated, updated_at: timestamp })
        .eq('item_id', row.item_id);
      await supabase
        .from('items')
        .update({ updated_at: timestamp })
        .eq('id', row.item_id);
    }
  }
}

function DotsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" width={20} height={20}>
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  );
}
