'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './CaptureModal.module.css';

type CaptureModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const PLACEHOLDER_RECENTS = [
  'Weekly review notes',
  'Project brainstorm',
  'Meeting takeaways',
];

export function CaptureModal({ open, onOpenChange }: CaptureModalProps) {
  const [text, setText] = useState('');
  const [rapidCapture, setRapidCapture] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea on open
  useEffect(() => {
    if (!open) return;
    // Use rAF to ensure the DOM has painted before focusing
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
    onOpenChange(false);
  }, [onOpenChange]);

  // Escape: clear text first, then close if empty
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (text.length > 0) {
          setText('');
        } else {
          handleClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, text, handleClose]);

  const handleSave = () => {
    // Placeholder stub — will be wired to actual save logic later
    if (!text.trim()) return;
    setText('');
    if (!rapidCapture) {
      onOpenChange(false);
    }
  };

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

        {/* Recently Edited section */}
        <div className={styles.results}>
          <span className={styles.sectionTitle}>Recently Edited</span>
          {PLACEHOLDER_RECENTS.length > 0 ? (
            <ul className={styles.list} role="list">
              {PLACEHOLDER_RECENTS.map((title) => (
                <li key={title} className={styles.listItem}>
                  <button type="button" className={styles.listButton}>
                    {title}
                  </button>
                </li>
              ))}
            </ul>
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
