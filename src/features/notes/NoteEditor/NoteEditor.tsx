import { useCallback, useEffect, useRef, useState } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import type { ItemDocument } from '@/lib/db';
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownTrigger,
} from '@/components/ui/Dropdown';
import { CodeMirrorEditor } from '@/components/editor';
import { saveVersion, shouldAutoSaveVersion } from '@/lib/versions';
import { nowIso } from '@/lib/time';
import { extractNoteTitle, formatRelativeTime } from '../noteUtils';
import { parseFrontmatter } from '@/lib/markdown/frontmatter';
import { useHeaderSlot } from '@/components/layout/AppShell/HeaderSlot';
import styles from './NoteEditor.module.css';

const SAVE_DEBOUNCE_MS = 1000;

type NoteEditorProps = {
  noteId: string;
  onClose?: () => void;
};

export function NoteEditor({ noteId, onClose }: NoteEditorProps) {
  const { db, isReady } = useDatabase();
  const { setSlot } = useHeaderSlot();
  const [note, setNote] = useState<ItemDocument | null>(null);
  const [content, setContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const isDirtyRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContentRef = useRef('');

  useEffect(() => { isDirtyRef.current = isDirty; }, [isDirty]);

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

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

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

  const saveContentRef = useRef<(c: string) => Promise<void>>(async () => {});
  saveContentRef.current = async (nextContent: string) => {
    if (!db || !noteId) return;
    if (nextContent === lastSavedContentRef.current) { setIsDirty(false); return; }
    const doc = await db.items.findOne(noteId).exec();
    if (!doc) return;
    const title = extractNoteTitle(nextContent, note?.title);
    const fm = parseFrontmatter(nextContent);
    const fmProps = fm.properties ?? {};
    const fmPatch: Partial<ItemDocument> = {};
    if ('tags' in fmProps) fmPatch.tags = Array.isArray(fmProps.tags) ? fmProps.tags as string[] : undefined;
    if ('due_date' in fmProps) fmPatch.due_date = typeof fmProps.due_date === 'string' ? fmProps.due_date : null;
    if ('start_date' in fmProps) fmPatch.start_date = typeof fmProps.start_date === 'string' ? fmProps.start_date : null;
    if ('priority' in fmProps) fmPatch.priority = typeof fmProps.priority === 'string' ? fmProps.priority as ItemDocument['priority'] : null;
    await doc.patch({ title, content: nextContent, updated_at: nowIso(), ...fmPatch });
    lastSavedContentRef.current = nextContent;
    setIsDirty(false);
    if (shouldAutoSaveVersion(noteId)) {
      saveVersion(db, noteId, nextContent, null, 'auto', 'Auto-save').catch(() => {});
    }
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

  return (
    <CodeMirrorEditor
      initialBody={content}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder="Start writing…"
      autoFocus
    />
  );
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
