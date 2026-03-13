import { useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useDatabase } from '@/hooks/useDatabase';
import { useNavigationActions } from '@/components/providers';
import type { ItemDocument } from '@/lib/db';
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
  const { db, isReady } = useDatabase();
  const { setSlot } = useHeaderSlot();
  const { pushLayer } = useNavigationActions();
  const [note, setNote] = useState<ItemDocument | null>(null);
  const [content, setContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [hasDuplicateTitle, setHasDuplicateTitle] = useState(false);
  const [allNotes, setAllNotes] = useState<ItemDocument[]>([]);
  const [backlinksOpen, setBacklinksOpen] = useState(false);
  const [disambigMatches, setDisambigMatches] = useState<ItemDocument[] | null>(null);
  const [confirmCreateTitle, setConfirmCreateTitle] = useState<string | null>(null);
  const [pendingHeader, setPendingHeader] = useState<string | undefined>(undefined);
  const isDirtyRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContentRef = useRef('');

  useEffect(() => { isDirtyRef.current = isDirty; }, [isDirty]);

  // Subscribe to current note
  useEffect(() => {
    if (!db || !isReady || !noteId) return;
    const sub = db.items.findOne(noteId).$.subscribe((doc) => {
      setHasLoaded(true);
      const nextNote = doc ? (doc.toJSON() as ItemDocument) : null;
      setNote(nextNote);
      if (nextNote && !isDirtyRef.current) {
        const nextContent = nextNote.content ?? '';
        setContent(nextContent);
        lastSavedContentRef.current = nextContent;
      }
    });
    return () => sub.unsubscribe();
  }, [db, isReady, noteId]);

  // Subscribe to all notes for wikilink autocomplete + resolution
  useEffect(() => {
    if (!db || !isReady) return;
    const sub = db.items.find({
      selector: { type: 'note', is_trashed: false },
      sort: [{ updated_at: 'desc' }],
    }).$.subscribe((docs) => {
      setAllNotes(docs.map((d) => d.toJSON() as ItemDocument));
    });
    return () => sub.unsubscribe();
  }, [db, isReady]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // Warn when another note shares the same title
  useEffect(() => {
    if (!db || !isReady || !note?.title) { setHasDuplicateTitle(false); return; }
    const sub = db.items.find({
      selector: { type: 'note', is_trashed: false, title: note.title },
    }).$.subscribe((docs) => {
      setHasDuplicateTitle(docs.some((d) => d.id !== note.id));
    });
    return () => sub.unsubscribe();
  }, [db, isReady, note?.title, note?.id]);

  const handleDelete = useCallback(async () => {
    if (!db || !note) return;
    const doc = await db.items.findOne(note.id).exec();
    if (!doc) return;
    const timestamp = nowIso();
    await doc.patch({ is_trashed: true, trashed_at: timestamp, updated_at: timestamp });
    onClose?.();
  }, [db, note, onClose]);

  const handleTogglePinned = useCallback(async () => {
    if (!db || !note) return;
    const doc = await db.items.findOne(note.id).exec();
    if (!doc) return;
    await doc.patch({ is_pinned: !note.is_pinned, updated_at: nowIso() });
  }, [db, note]);

  const allNotesRef = useRef(allNotes);
  useEffect(() => { allNotesRef.current = allNotes; }, [allNotes]);
  const noteRef = useRef(note);
  useEffect(() => { noteRef.current = note; }, [note]);

  const saveContentRef = useRef<(c: string) => Promise<void>>(async () => {});
  saveContentRef.current = async (nextContent: string) => {
    if (!db || !noteId) return;
    if (nextContent === lastSavedContentRef.current) { setIsDirty(false); return; }
    const doc = await db.items.findOne(noteId).exec();
    if (!doc) return;
    const fm = parseFrontmatter(nextContent);
    const fmProps = fm.properties ?? {};

    const title = typeof fmProps.title === 'string' && fmProps.title.trim()
      ? fmProps.title.trim()
      : extractNoteTitle(nextContent, noteRef.current?.title);

    const slug = typeof fmProps.slug === 'string' && fmProps.slug.trim()
      ? fmProps.slug.trim()
      : (noteRef.current?.slug ?? generateSlug(title));

    const fmPatch: Partial<ItemDocument> = { slug };
    if ('tags' in fmProps) fmPatch.tags = Array.isArray(fmProps.tags) ? fmProps.tags as string[] : undefined;
    if ('due_date' in fmProps) fmPatch.due_date = typeof fmProps.due_date === 'string' ? fmProps.due_date : null;
    if ('start_date' in fmProps) fmPatch.start_date = typeof fmProps.start_date === 'string' ? fmProps.start_date : null;
    if ('priority' in fmProps) fmPatch.priority = typeof fmProps.priority === 'string' ? fmProps.priority as ItemDocument['priority'] : null;

    // Detect rename → propagate to other notes
    const oldTitle = noteRef.current?.title;
    if (oldTitle && oldTitle !== title) {
      propagateRename(db, oldTitle, title, noteId).catch(() => {});
    }

    await doc.patch({ title, content: nextContent, updated_at: nowIso(), ...fmPatch });
    lastSavedContentRef.current = nextContent;
    setIsDirty(false);

    if (shouldAutoSaveVersion(noteId)) {
      saveVersion(db, noteId, nextContent, null, 'auto', 'Auto-save').catch(() => {});
    }

    // Sync item_links async
    syncItemLinks(db, noteId, nextContent, allNotesRef.current).catch(() => {});
  };

  const scheduleSave = useCallback((nextContent: string) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveContentRef.current(nextContent), SAVE_DEBOUNCE_MS);
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
      setContent((curr) => { saveContentRef.current(curr); return curr; });
    }
  }, []);

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
    if (!db || !confirmCreateTitle) return;
    const newId = uuidv4();
    const timestamp = nowIso();
    await db.items.insert({
      id: newId,
      type: 'note',
      parent_id: null,
      title: confirmCreateTitle,
      slug: generateSlug(confirmCreateTitle),
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
      is_trashed: false,
      trashed_at: null,
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

  // Suppress unused variable warning for pendingHeader (used for future header-aware navigation)
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
    </>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function syncItemLinks(
  db: { items: any; item_links: any },
  sourceId: string,
  content: string,
  allNotes: ItemDocument[]
) {
  const wikilinks = parseWikilinks(content);

  // Build title → notes map for resolution
  const byTitle = new Map<string, ItemDocument[]>();
  for (const n of allNotes) {
    if (!n.title) continue;
    const key = n.title.toLowerCase();
    byTitle.set(key, [...(byTitle.get(key) ?? []), n]);
  }

  // Delete existing item_links for this source
  const existing = await db.item_links.find({ selector: { source_id: sourceId } }).exec();
  await Promise.all(existing.map((l: any) => l.remove()));

  // Insert new item_links
  const timestamp = nowIso();
  for (const wl of wikilinks) {
    const matches = byTitle.get(wl.title.toLowerCase()) ?? [];
    const targetId = matches.length === 1 ? (matches[0].id ?? null) : null;
    await db.item_links.insert({
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
    });
  }
}

async function propagateRename(
  db: { items: any; item_links: any },
  oldTitle: string,
  newTitle: string,
  skipId: string
) {
  const docs = await db.items.find({
    selector: { type: 'note', is_trashed: false },
  }).exec();

  for (const doc of docs) {
    if (doc.id === skipId) continue;
    const c = doc.content ?? '';
    if (!c.includes(`[[${oldTitle}`)) continue;
    const updated = renameWikilinks(c, oldTitle, newTitle);
    if (updated !== c) {
      await doc.patch({ content: updated, updated_at: nowIso() });
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
