'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useDatabase } from '@/hooks/useDatabase';
import { useNavigationActions } from '@/components/providers';
import { searchNotes, type SearchResult } from '@/lib/search';
import type { NoteDocument } from '@/lib/db';
import {
  extractNoteTitle,
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
        setAllNotes(docs.map((doc) => doc.toJSON()));
      });
    return () => subscription.unsubscribe();
  }, [db, isReady]);

  const recentNotes = useMemo(() => allNotes.slice(0, 12), [allNotes]);

  // Debounced search
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    if (text.trim().length < 2) {
      setDebouncedQuery('');
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => setDebouncedQuery(text.trim()), 250);
    return () => clearTimeout(timer);
  }, [text]);

  useEffect(() => {
    if (!debouncedQuery) {
      setSearchResults([]);
      return;
    }
    setSearchResults(searchNotes(allNotes, debouncedQuery));
  }, [debouncedQuery, allNotes]);

  const isSearching = text.trim().length >= 2;

  // Build display list
  type DisplayItem = {
    id: string;
    noteId: string;
    title: string;
    subtitle: string;
  };

  const displayItems: DisplayItem[] = useMemo(() => {
    if (isSearching) {
      return searchResults.map((r) => ({
        id: r.note.id,
        noteId: r.note.id,
        title: formatNoteTitle(extractNoteTitle(r.note.content, r.note.title)),
        subtitle: r.snippet,
      }));
    }
    return recentNotes.map((note) => ({
      id: note.id,
      noteId: note.id,
      title: formatNoteTitle(extractNoteTitle(note.content, note.title)),
      subtitle: formatRelativeTime(note.updated_at),
    }));
  }, [isSearching, searchResults, recentNotes]);

  // Reset selection on text change
  useEffect(() => {
    setSelectedIndex(null);
  }, [text]);

  // Auto-focus textarea on open
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  // Body scroll lock
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleClose = useCallback(() => {
    setText('');
    setSelectedIndex(null);
    onOpenChange(false);
  }, [onOpenChange]);

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
      created_at: timestamp,
      updated_at: timestamp,
      is_trashed: false,
      trashed_at: null,
    });
    setText('');
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

  if (!open) return null;

  return (
    <div className={styles.backdrop}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Quick capture"
      >
        {/* Header: label + textarea */}
        <div className={styles.header}>
          <span className={styles.label}>Capture</span>
          <textarea
            ref={textareaRef}
            className={styles.input}
            placeholder="What's on your mind?"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        {/* Results section */}
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
                    {item.title}
                    <div className={styles.listButtonSubtitle}>
                      {item.subtitle}
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

        {/* Actions: toggle + buttons */}
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
      </div>
    </div>
  );
}
