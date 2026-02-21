import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useDatabase } from '@/hooks/useDatabase';
import { useNavigationActions } from '@/components/providers';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { searchNotes, type SearchResult } from '@/lib/search';
import type { NoteDocument } from '@/lib/db';
import {
  extractNoteTitle,
  extractNoteSnippet,
  extractTitleFromFirstLine,
  formatNoteTitle,
  formatRelativeTime,
} from '@/features/notes/noteUtils';
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

  const { db, isReady } = useDatabase();
  const { pushLayer } = useNavigationActions();

  // Subscribe to recent notes
  const [allNotes, setAllNotes] = useState<NoteDocument[]>([]);
  useEffect(() => {
    if (!db || !isReady) return;
    const subscription = db.notes
      .find({
        selector: { is_trashed: false, inbox_at: null },
        sort: [{ updated_at: 'desc' }, { id: 'asc' }],
      })
      .$.subscribe((docs) => {
        setAllNotes(docs.map((doc) => doc.toJSON() as NoteDocument));
      });
    return () => subscription.unsubscribe();
  }, [db, isReady]);

  const recentNotes = useMemo(() => allNotes.slice(0, 12), [allNotes]);

  const deferredText = useDeferredValue(text);
  const deferredQuery = deferredText.trim();
  const isSearching = deferredQuery.length >= 2;
  const searchResults: SearchResult[] = useMemo(() => {
    if (!isSearching) return [];
    return searchNotes(allNotes, deferredQuery);
  }, [allNotes, deferredQuery, isSearching]);

  // Build display list
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
        isPinned: r.note.is_pinned,
      }));
    }
    return recentNotes.map((note) => ({
      id: note.id,
      noteId: note.id,
      title: formatNoteTitle(extractNoteTitle(note.content, note.title)),
      snippet: extractNoteSnippet(note.content),
      updatedLabel: formatRelativeTime(note.updated_at),
      isPinned: note.is_pinned,
    }));
  }, [isSearching, searchResults, recentNotes]);

  // Auto-focus textarea on open
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

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
    if (!text.trim() || !db) return;
    const noteId = uuidv4();
    const timestamp = new Date().toISOString();
    const trimmedText = text.trim();
    await db.notes.insert({
      id: noteId,
      title: extractTitleFromFirstLine(trimmedText),
      content: trimmedText,
      inbox_at: timestamp,
      note_type: null,
      is_pinned: false,
      properties: null,
      created_at: timestamp,
      updated_at: timestamp,
      is_trashed: false,
      trashed_at: null,
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

  // Keyboard navigation
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
        setSelectedIndex((prev) => {
          if (prev === null) return 0;
          return Math.min(prev + 1, displayItems.length - 1);
        });
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => {
          if (prev === null || prev <= 0) return null;
          return prev - 1;
        });
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
  }, [
    open,
    text,
    selectedIndex,
    displayItems,
    handleClose,
    handleSave,
    handleOpenNote,
  ]);

  const canSave = text.trim().length > 0;

  return (
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
      <SheetContent
        side="bottom"
        ariaLabel="Quick capture"
        className={styles.sheet}
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
              <span
                className={`${styles.toggleTrack} ${
                  rapidCapture ? styles.toggleTrackActive : ''
                }`}
              >
                <span
                  className={`${styles.toggleThumb} ${
                    rapidCapture ? styles.toggleThumbActive : ''
                  }`}
                />
              </span>
              <span className={styles.toggleText}>Rapid</span>
            </button>

            <div className={styles.actionButtons}>
              <button
                type="button"
                className={styles.button}
                onClick={handleClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${styles.button} ${styles.buttonPrimary} ${
                  !canSave ? styles.buttonDisabled : ''
                }`}
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
                      className={`${styles.listButton} ${
                        selectedIndex === index ? styles.listButtonSelected : ''
                      }`}
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
