import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { showToast } from '@/components/ui/Toast';
import { useNavigationActions } from '@/components/providers';
import { createDocument } from '@/lib/db';
import { generateCuid } from '@/lib/cuid';
import { formatRelativeTime } from '@/features/notes/noteUtils';
import type { DocumentRow } from '@/lib/db';
import styles from './CommandSheet.module.css';

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildInboxDoc(trimmed: string) {
  const now = new Date().toISOString();
  return {
    cuid: generateCuid(),
    type: 'inbox' as const,
    subtype: null,
    title: trimmed.split('\n')[0].slice(0, 200) || null,
    status: 'unprocessed',
    access: 'private',
    workbench: false,
    resources: [] as string[],
    dependencies: [] as string[],
    blocked: false,
    slug: null,
    published: false,
    tier: null,
    growth: null,
    rating: null,
    processed: false as boolean | null,
    start_date: null,
    end_date: null,
    date_created: now,
    date_modified: null,
    date_trashed: null,
    tags: [] as string[],
    content: trimmed,
    frontmatter: null,
    area: null,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

type CommandSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CommandSheet({ open, onOpenChange }: CommandSheetProps) {
  const [text, setText]               = useState('');
  const [rapidLog, setRapidLog]       = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  // Tracks explicit Cancel presses so auto-capture on dismiss is skipped
  const cancelledRef = useRef(false);
  const { pushLayer } = useNavigationActions();

  // ── Recent docs query ────────────────────────────────────────────────────

  const { data: recentDocs = [] } = useQuery({
    queryKey: ['command-sheet', 'recent'],
    queryFn: async (): Promise<DocumentRow[]> => {
      const { data, error } = await supabase
        .from('items')
        .select('id, cuid, type, subtype, title, status, updated_at, date_trashed')
        .is('date_trashed', null)
        .neq('type', 'inbox')
        .order('updated_at', { ascending: false })
        .limit(12);
      if (error) throw error;
      return (data ?? []) as unknown as DocumentRow[];
    },
    enabled: open,
    staleTime: 30_000,
  });

  const deferredText = useDeferredValue(text);
  const query        = deferredText.trim().toLowerCase();
  const isSearching  = query.length >= 2;

  const displayDocs = useMemo(() => {
    if (!isSearching) return recentDocs;
    return recentDocs.filter((d) =>
      (d.title ?? '').toLowerCase().includes(query)
    );
  }, [recentDocs, query, isSearching]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setText('');
      setSelectedIndex(null);
      cancelledRef.current = false;
    }
  }, [open]);

  const handleOpenAutoFocus = useCallback((e: Event) => {
    e.preventDefault();
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  // ── Cancel — dismiss without saving ──────────────────────────────────────

  const handleCancel = useCallback(() => {
    cancelledRef.current = true;
    onOpenChange(false);
  }, [onOpenChange]);

  // ── Save — save as inbox item ─────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      await createDocument(buildInboxDoc(trimmed));
      showToast('Saved to inbox');
      if (rapidLog) {
        setText('');
        setSelectedIndex(null);
        inputRef.current?.focus();
      } else {
        cancelledRef.current = true; // already saved — skip auto-capture on close
        onOpenChange(false);
      }
    } catch {
      showToast('Could not save — try again');
    }
  }, [text, rapidLog, onOpenChange]);

  // ── Auto-capture on dismiss (swipe / backdrop) ────────────────────────────

  const handleSheetOpenChange = useCallback(async (nextOpen: boolean) => {
    if (!nextOpen && text.trim() && !cancelledRef.current) {
      try {
        await createDocument(buildInboxDoc(text.trim()));
        showToast('Saved to inbox');
      } catch {
        showToast('Could not save — try again');
      }
    }
    setText('');
    setSelectedIndex(null);
    cancelledRef.current = false;
    onOpenChange(nextOpen);
  }, [text, onOpenChange]);

  // ── Open doc ──────────────────────────────────────────────────────────────

  const handleOpenDoc = useCallback((docId: string) => {
    cancelledRef.current = true;
    onOpenChange(false);
    pushLayer({ view: 'document-detail', documentId: docId });
  }, [onOpenChange, pushLayer]);

  // ── Keyboard navigation ───────────────────────────────────────────────────

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (text.trim()) { setText(''); } else { handleCancel(); }
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((p) => p === null ? 0 : Math.min(p + 1, displayDocs.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((p) => (p === null || p <= 0) ? null : p - 1);
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        if (selectedIndex !== null && displayDocs[selectedIndex]) {
          e.preventDefault();
          handleOpenDoc(displayDocs[selectedIndex].id);
        } else if (text.trim()) {
          e.preventDefault();
          void handleSave();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, text, selectedIndex, displayDocs, handleCancel, handleOpenDoc, handleSave]);

  const canSave = text.trim().length > 0;

  return (
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
      <SheetContent
        side="bottom"
        ariaLabel="Command"
        className={styles.sheet}
        onOpenAutoFocus={handleOpenAutoFocus}
      >
        <div className={styles.content}>

          {/* Input */}
          <div className={styles.inputRow}>
            <input
              ref={inputRef}
              type="text"
              className={styles.input}
              placeholder="Search or create…"
              value={text}
              onChange={(e) => { setText(e.target.value); setSelectedIndex(null); }}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>

          {/* Results */}
          <div className={styles.results}>
            {displayDocs.length > 0 ? (
              <>
                <div className={styles.sectionLabel}>
                  {isSearching ? 'Results' : 'Recent'}
                </div>
                <ul className={styles.resultList} role="list">
                  {displayDocs.map((doc, index) => (
                    <li key={doc.id} className={styles.resultItem}>
                      <button
                        type="button"
                        className={`${styles.resultButton} ${selectedIndex === index ? styles.resultButtonSelected : ''}`}
                        onClick={() => handleOpenDoc(doc.id)}
                      >
                        <span className={styles.resultTitle}>
                          {doc.title ?? 'Untitled'}
                        </span>
                        <span className={styles.resultMeta}>
                          {doc.subtype ?? doc.type}
                          {doc.updated_at ? ` · ${formatRelativeTime(doc.updated_at)}` : ''}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : isSearching ? (
              <p className={styles.emptyState}>No results for "{deferredText.trim()}"</p>
            ) : (
              <p className={styles.emptyState}>No recent documents</p>
            )}
          </div>

          {/* Actions row */}
          <div className={styles.actionsRow}>
            <button
              type="button"
              className={styles.rapidToggle}
              aria-pressed={rapidLog}
              onClick={() => setRapidLog((v) => !v)}
            >
              <span className={`${styles.toggleTrack} ${rapidLog ? styles.toggleTrackOn : ''}`}>
                <span className={`${styles.toggleThumb} ${rapidLog ? styles.toggleThumbOn : ''}`} />
              </span>
              <span className={styles.rapidLabel}>Rapid Log</span>
            </button>

            <div className={styles.actionButtons}>
              <button type="button" className={styles.actionBtn} onClick={handleCancel}>
                Cancel
              </button>
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.actionBtnSave} ${!canSave ? styles.actionBtnDisabled : ''}`}
                disabled={!canSave}
                onClick={() => void handleSave()}
              >
                Save
              </button>
            </div>
          </div>

        </div>
      </SheetContent>
    </Sheet>
  );
}
