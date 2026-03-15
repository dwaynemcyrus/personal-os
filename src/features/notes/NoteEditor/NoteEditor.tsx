import { useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useQuery, usePowerSync } from '@powersync/react';
import { useNavigationActions } from '@/components/providers';
import type { ItemRow } from '@/lib/db';
import { insertItem, insertItemLink, patchItem, parseTags, serializeTags } from '@/lib/db';
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownTrigger,
} from '@/components/ui/Dropdown';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { CodeMirrorEditor } from '@/components/editor';
import { saveVersion, shouldAutoSaveVersion } from '@/lib/versions';
import { nowIso } from '@/lib/time';
import { extractNoteTitle, formatRelativeTime } from '../noteUtils';
import { parseFrontmatter } from '@/lib/markdown/frontmatter';
import { generateSlug } from '@/lib/slug';
import { parseWikilinks, renameWikilinks } from '@/lib/wikilinks';
import { useHeaderSlot } from '@/components/layout/AppShell/HeaderSlot';
import { BacklinksSheet } from './BacklinksSheet';
import styles from './NoteEditor.module.css';

const SAVE_DEBOUNCE_MS = 1000;

type NoteEditorProps = {
  noteId: string;
  onClose?: () => void;
};

export function NoteEditor({ noteId, onClose }: NoteEditorProps) {
  const db = usePowerSync();
  const { setSlot } = useHeaderSlot();
  const { pushLayer } = useNavigationActions();

  // Reactive note query
  const { data: noteRows, isLoading: noteLoading } = useQuery<ItemRow>(
    'SELECT * FROM items WHERE id = ? LIMIT 1',
    [noteId]
  );
  const note = noteRows[0] ?? null;
  const hasLoaded = !noteLoading;

  // All notes for wikilink autocomplete + resolution
  const { data: allNotes } = useQuery<ItemRow>(
    `SELECT id, title, filename FROM items WHERE type = 'note' AND is_trashed = 0`
  );

  // Duplicate title detection
  const { data: dupRows } = useQuery<{ id: string }>(
    `SELECT id FROM items WHERE type = 'note' AND is_trashed = 0 AND title = ? AND id != ?`,
    [note?.title ?? '', noteId]
  );
  const hasDuplicateTitle = dupRows.length > 0;

  const [content, setContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [backlinksOpen, setBacklinksOpen] = useState(false);
  const [disambigMatches, setDisambigMatches] = useState<ItemRow[] | null>(null);
  const [confirmCreateTitle, setConfirmCreateTitle] = useState<string | null>(null);
  const [pendingHeader, setPendingHeader] = useState<string | undefined>(undefined);
  const [filenameSheetOpen, setFilenameSheetOpen] = useState(false);
  const [editingFilename, setEditingFilename] = useState('');

  const isDirtyRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContentRef = useRef('');
  const contentRef = useRef('');
  const allNotesRef = useRef(allNotes);
  const noteRef = useRef(note);

  useEffect(() => { isDirtyRef.current = isDirty; }, [isDirty]);
  useEffect(() => { allNotesRef.current = allNotes; }, [allNotes]);
  useEffect(() => { noteRef.current = note; }, [note]);

  // Apply note content when not dirty (avoids overwriting in-progress edits)
  useEffect(() => {
    if (!note || isDirtyRef.current) return;
    const nextContent = note.content ?? '';
    setContent(nextContent);
    lastSavedContentRef.current = nextContent;
  }, [note]);

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
    if (nextContent === lastSavedContentRef.current) { setIsDirty(false); return; }
    const fm = parseFrontmatter(nextContent);
    const fmProps = fm.properties ?? {};

    const title = typeof fmProps.title === 'string' && fmProps.title.trim()
      ? fmProps.title.trim()
      : extractNoteTitle(nextContent, noteRef.current?.title ?? undefined);

    const filename = typeof fmProps.filename === 'string' && fmProps.filename.trim()
      ? fmProps.filename.trim()
      : (noteRef.current?.filename ?? generateSlug(title));

    const patch: Parameters<typeof patchItem>[2] = {
      title,
      content: nextContent,
      filename,
      updated_at: nowIso(),
    };

    if ('tags' in fmProps) {
      patch.tags = Array.isArray(fmProps.tags)
        ? (fmProps.tags as unknown[]).filter((t): t is string => typeof t === 'string')
        : [];
    }
    if ('due_date' in fmProps) patch.due_date = typeof fmProps.due_date === 'string' ? fmProps.due_date : null;
    if ('start_date' in fmProps) patch.start_date = typeof fmProps.start_date === 'string' ? fmProps.start_date : null;
    if ('priority' in fmProps) patch.priority = typeof fmProps.priority === 'string' ? fmProps.priority : null;

    const oldTitle = noteRef.current?.title;
    if (oldTitle && oldTitle !== title) {
      propagateRename(db, oldTitle, title, noteId).catch(() => {});
    }

    await patchItem(db, noteId, patch);
    lastSavedContentRef.current = nextContent;
    setIsDirty(false);

    if (shouldAutoSaveVersion(noteId)) {
      saveVersion(db, noteId, nextContent, null, 'auto', 'Auto-save').catch(() => {});
    }

    syncItemLinks(db, noteId, nextContent, allNotesRef.current).catch(() => {});
  };

  const scheduleSave = useCallback((nextContent: string) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveContentRef.current(nextContent), SAVE_DEBOUNCE_MS);
  }, []);

  const handleChange = useCallback((nextContent: string) => {
    contentRef.current = nextContent;
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
      setContent((curr) => { saveContentRef.current(curr); return curr; });
    }
  }, []);

  const handleDelete = useCallback(async () => {
    if (!note) return;
    const timestamp = nowIso();
    await patchItem(db, note.id, { is_trashed: true, trashed_at: timestamp, updated_at: timestamp });
    onClose?.();
  }, [db, note, onClose]);

  const handleTogglePinned = useCallback(async () => {
    if (!note) return;
    await patchItem(db, note.id, { is_pinned: !note.is_pinned, updated_at: nowIso() });
  }, [db, note]);

  const handleSaveFilename = useCallback(async () => {
    if (!note) return;
    const trimmed = editingFilename.trim();
    if (!trimmed) return;
    await patchItem(db, note.id, { filename: trimmed, updated_at: nowIso() });
    setFilenameSheetOpen(false);
  }, [db, note, editingFilename]);

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
    await insertItem(db, {
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
    setConfirmCreateTitle(null);
    pushLayer({ view: 'note-detail', noteId: newId });
  }, [db, confirmCreateTitle, pushLayer]);

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
            <DropdownItem onSelect={handleTogglePinned}>
              {note.is_pinned ? 'Unpin' : 'Pin'}
            </DropdownItem>
            <DropdownItem onSelect={() => setBacklinksOpen(true)}>
              Backlinks
            </DropdownItem>
            <DropdownItem onSelect={() => {
              setEditingFilename(note.filename ?? generateSlug(note.title ?? 'untitled'));
              setFilenameSheetOpen(true);
            }}>
              Edit Filename
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem disabled>Created {formatRelativeTime(note.created_at)}</DropdownItem>
            <DropdownItem disabled>Updated {formatRelativeTime(note.updated_at)}</DropdownItem>
            <DropdownSeparator />
            <DropdownItem data-variant="danger" onSelect={handleDelete}>Trash</DropdownItem>
          </DropdownContent>
        </Dropdown>
      ),
    });
    return () => setSlot({});
  }, [note, setSlot, handleTogglePinned, handleDelete]);

  if (!hasLoaded) {
    return <p className={styles.state}>Loading…</p>;
  }

  if (!note) {
    return <p className={styles.state}>Note not found.</p>;
  }

  void pendingHeader;

  return (
    <>
      {hasDuplicateTitle && (
        <p className={styles.duplicateWarning}>
          Another note shares this title — export filenames may conflict.
        </p>
      )}
      <CodeMirrorEditor
        initialBody={content}
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
                  <span className={styles.sheetItemMeta}>{formatRelativeTime(n.updated_at)}</span>
                </button>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>

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

      {/* Edit filename sheet */}
      <Sheet open={filenameSheetOpen} onOpenChange={(o) => { if (!o) setFilenameSheetOpen(false); }}>
        <SheetContent side="bottom" ariaLabel="Edit filename" className={styles.sheet}>
          <p className={styles.sheetTitle}>Edit Filename</p>
          <div className={styles.sheetInputRow}>
            <input
              type="text"
              className={styles.sheetInput}
              value={editingFilename}
              onChange={(e) => setEditingFilename(e.target.value)}
              placeholder="e.g. my-note"
              autoFocus
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
            <p className={styles.sheetInputHint}>Used as the export filename (.md). No spaces recommended.</p>
          </div>
          <div className={styles.sheetActions}>
            <button type="button" className={styles.sheetBtnCancel} onClick={() => setFilenameSheetOpen(false)}>
              Cancel
            </button>
            <button type="button" className={styles.sheetBtnCreate} onClick={handleSaveFilename} disabled={!editingFilename.trim()}>
              Save
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

import type { AbstractPowerSyncDatabase } from '@powersync/web';

async function syncItemLinks(
  db: AbstractPowerSyncDatabase,
  sourceId: string,
  content: string,
  allNotes: ItemRow[]
) {
  const wikilinks = parseWikilinks(content);

  const byTitle = new Map<string, ItemRow[]>();
  for (const n of allNotes) {
    if (!n.title) continue;
    const key = n.title.toLowerCase();
    byTitle.set(key, [...(byTitle.get(key) ?? []), n]);
  }

  await db.execute('DELETE FROM item_links WHERE source_id = ?', [sourceId]);

  const timestamp = nowIso();
  for (const wl of wikilinks) {
    const matches = byTitle.get(wl.title.toLowerCase()) ?? [];
    const targetId = matches.length === 1 ? (matches[0].id ?? null) : null;
    await insertItemLink(db, {
      id: uuidv4(),
      source_id: sourceId,
      target_id: targetId,
      target_title: wl.title,
      header: wl.header ?? null,
      alias: wl.alias ?? null,
      position: wl.from,
      created_at: timestamp,
      updated_at: timestamp,
    });
  }
}

async function propagateRename(
  db: AbstractPowerSyncDatabase,
  oldTitle: string,
  newTitle: string,
  skipId: string
) {
  const docs = await db.getAll<{ id: string; content: string | null }>(
    `SELECT id, content FROM items WHERE type = 'note' AND is_trashed = 0`
  );

  for (const doc of docs) {
    if (doc.id === skipId) continue;
    const c = doc.content ?? '';
    if (!c.includes(`[[${oldTitle}`)) continue;
    const updated = renameWikilinks(c, oldTitle, newTitle);
    if (updated !== c) {
      await db.execute(
        'UPDATE items SET content = ?, updated_at = ? WHERE id = ?',
        [updated, nowIso(), doc.id]
      );
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
