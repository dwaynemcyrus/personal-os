import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useQuery, usePowerSync } from '@powersync/react';
import { useNavigationActions } from '@/components/providers';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { searchNotes, type SearchResult } from '@/lib/search';
import type { ItemRow } from '@/lib/db';
import { insertItem } from '@/lib/db';
import {
  extractNoteTitle,
  extractNoteSnippet,
  extractTitleFromFirstLine,
  formatNoteTitle,
  formatRelativeTime,
} from '@/features/notes/noteUtils';
import { generateSlug } from '@/lib/slug';
import { nowIso } from '@/lib/time';
import styles from './CaptureModal.module.css';

type CaptureModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CaptureModal({ open, onOpenChange }: CaptureModalProps) {
  const [text, setText] = useState('');
  const [rapidCapture, setRapidCapture] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const db = usePowerSync();
  const { pushLayer } = useNavigationActions();

  // Only query when open; truncate content to avoid loading megabytes into memory on iPhone
  const { data: allNotes } = useQuery<ItemRow>(
    `SELECT id, title, updated_at, is_pinned, SUBSTR(content, 1, 500) AS content
     FROM items WHERE type = 'note' AND is_trashed = 0 AND inbox_at IS NULL AND ? = 1
     ORDER BY updated_at DESC`,
    [open ? 1 : 0]
  );

  const recentNotes = useMemo(() => allNotes.slice(0, 12), [allNotes]);

  const deferredText = useDeferredValue(text);
  const deferredQuery = deferredText.trim();
  const isSearching = deferredQuery.length >= 2;
  const searchResults: SearchResult[] = useMemo(() => {
    if (!isSearching) return [];
    return searchNotes(allNotes, deferredQuery);
  }, [allNotes, deferredQuery, isSearching]);

  type DisplayItem = {
    id: string;
    noteId: string;
    title: string;
    snippet: string;
    updatedLabel: string;
    isPinned: boolean;
  };

  const displayItems: DisplayItem[] = useMemo(() => {
    if (isSearching) {
      return searchResults.map((r) => ({
        id: r.note.id,
        noteId: r.note.id,
        title: formatNoteTitle(extractNoteTitle(r.note.content, r.note.title)),
        snippet: r.snippet,
        updatedLabel: formatRelativeTime(r.note.updated_at),
        isPinned: !!r.note.is_pinned,
      }));
    }
    return recentNotes.map((note) => ({
      id: note.id,
      noteId: note.id,
      title: formatNoteTitle(extractNoteTitle(note.content, note.title)),
      snippet: extractNoteSnippet(note.content),
      updatedLabel: formatRelativeTime(note.updated_at),
      isPinned: !!note.is_pinned,
    }));
  }, [isSearching, searchResults, recentNotes]);

  const handleOpenAutoFocus = useCallback((e: Event) => {
    e.preventDefault();
    textareaRef.current?.focus();
  }, []);

  const handleClose = useCallback(() => {
    setText('');
    setSelectedIndex(null);
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSheetOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setText('');
        setSelectedIndex(null);
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange]
  );

  const handleSave = useCallback(async () => {
    if (!text.trim()) return;
    const captureId = uuidv4();
    const noteId = uuidv4();
    const timestamp = nowIso();
    const trimmedText = text.trim();
    const noteTitle = extractTitleFromFirstLine(trimmedText);

    // Insert note first (FK constraint)
    await insertItem(db, {
      id: noteId,
      type: 'note',
      parent_id: null,
      title: noteTitle,
      filename: generateSlug(noteTitle),
      content: trimmedText,
      inbox_at: timestamp,
      subtype: 'capture',
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

    await insertItem(db, {
      id: captureId,
      type: 'capture',
      parent_id: null,
      body: trimmedText,
      capture_source: 'quick',
      processed: false,
      result_type: null,
      result_id: noteId,
      is_pinned: false,
      item_status: 'backlog',
      completed: false,
      is_next: false,
      is_someday: false,
      is_waiting: false,
      created_at: timestamp,
      updated_at: timestamp,
    });

    setText('');
    setSelectedIndex(null);
    if (!rapidCapture) onOpenChange(false);
  }, [text, db, rapidCapture, onOpenChange]);

  const handleOpenNote = useCallback(
    (noteId: string) => {
      onOpenChange(false);
      pushLayer({ view: 'note-detail', noteId });
    },
    [onOpenChange, pushLayer]
  );

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (selectedIndex !== null) {
          setSelectedIndex(null);
        } else if (text.length > 0) {
          setText('');
        } else {
          handleClose();
        }
        return;
      }
      if (e.key === 'Tab' && displayItems.length > 0) {
        e.preventDefault();
        setSelectedIndex(0);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev === null ? 0 : Math.min(prev + 1, displayItems.length - 1)));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev === null || prev <= 0 ? null : prev - 1));
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        if (selectedIndex !== null && displayItems[selectedIndex]) {
          e.preventDefault();
          handleOpenNote(displayItems[selectedIndex].noteId);
        } else if (text.trim()) {
          e.preventDefault();
          handleSave();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, text, selectedIndex, displayItems, handleClose, handleSave, handleOpenNote]);

  const canSave = text.trim().length > 0;

  return (
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
      <SheetContent
        side="bottom"
        ariaLabel="Quick capture"
        className={styles.sheet}
        onOpenAutoFocus={handleOpenAutoFocus}
      >
        <div className={styles.content}>
          <div className={styles.header}>
            <textarea
              ref={textareaRef}
              className={styles.input}
              placeholder="What's on your mind?"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setSelectedIndex(null);
              }}
            />
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.toggle}
              aria-pressed={rapidCapture}
              onClick={() => setRapidCapture((v) => !v)}
            >
              <span className={`${styles.toggleTrack} ${rapidCapture ? styles.toggleTrackActive : ''}`}>
                <span className={`${styles.toggleThumb} ${rapidCapture ? styles.toggleThumbActive : ''}`} />
              </span>
              <span className={styles.toggleText}>Rapid Entry</span>
            </button>

            <div className={styles.actionButtons}>
              <button type="button" className={styles.button} onClick={handleClose}>
                Cancel
              </button>
              <button
                type="button"
                className={`${styles.button} ${styles.buttonPrimary} ${!canSave ? styles.buttonDisabled : ''}`}
                disabled={!canSave}
                onClick={handleSave}
              >
                Save
              </button>
            </div>
          </div>

          <div className={styles.results}>
            <span className={styles.sectionTitle}>
              {isSearching ? 'Search Results' : 'Recently Edited'}
            </span>
            {displayItems.length > 0 ? (
              <ul className={styles.list} role="list">
                {displayItems.map((item, index) => (
                  <li key={item.id} className={styles.listItem}>
                    <button
                      type="button"
                      className={`${styles.listButton} ${selectedIndex === index ? styles.listButtonSelected : ''}`}
                      onClick={() => handleOpenNote(item.noteId)}
                    >
                      <div className={styles.listItemHeader}>
                        <div className={styles.listItemTitle}>{item.title}</div>
                      </div>
                      {item.snippet ? (
                        <div className={styles.listItemSnippet}>{item.snippet}</div>
                      ) : null}
                      <div className={styles.listItemMeta}>
                        <span className={styles.listItemDate}>{item.updatedLabel}</span>
                        {item.isPinned ? (
                          <span className={styles.listItemPinned}>Pinned</span>
                        ) : null}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : isSearching ? (
              <p className={styles.emptyState}>No results</p>
            ) : (
              <p className={styles.emptyState}>No recent documents</p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
