'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import type { NoteDocument } from '@/lib/db';
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
  const [note, setNote] = useState<NoteDocument | null>(null);
  const [content, setContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
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
      const nextNote = doc?.toJSON() ?? null;
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

  const saveContent = async (nextContent: string) => {
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
  };

  const scheduleSave = (nextContent: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveContent(nextContent);
    }, SAVE_DEBOUNCE_MS);
  };

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const nextContent = event.target.value;
    setContent(nextContent);
    setIsDirty(true);
    scheduleSave(nextContent);
  };

  const handleBlur = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    if (isDirty) {
      saveContent(content);
    }
  };

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
          <button type="button" className={styles.close} onClick={onClose}>
            Close
          </button>
        ) : null}
      </header>

      <textarea
        className={styles.textarea}
        value={content}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="Start writing..."
      />
    </section>
  );
}
