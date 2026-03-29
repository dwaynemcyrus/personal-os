import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { updateDocument } from '@/lib/db';
import { queryClient } from '@/lib/queryClient';
import { buildRawDocument, parseRawToDocumentPatch } from '@/lib/documentRaw';
import { CodeMirrorEditor } from '@/components/editor';
import { BackIcon } from '@/components/ui/icons';
import { useNavigationActions } from '@/components/providers';
import { showToast } from '@/components/ui/Toast';
import type { DocumentRow } from '@/lib/db';
import styles from './DocumentDetailView.module.css';

const SAVE_DEBOUNCE_MS = 1200;
type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

// ── Data hook ─────────────────────────────────────────────────────────────────

function useDocumentRow(id: string) {
  return useQuery({
    queryKey: ['document', id],
    queryFn: async (): Promise<DocumentRow | null> => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as DocumentRow | null;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

type Props = { documentId: string };

export function DocumentDetailView({ documentId }: Props) {
  const { goBack } = useNavigationActions();
  const { data: doc, isLoading } = useDocumentRow(documentId);

  const [rawMode, setRawMode] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  const saveTimerRef    = useRef<number | undefined>(undefined);
  const latestValueRef  = useRef<string | null>(null);
  const rawModeRef      = useRef(rawMode);

  useEffect(() => { rawModeRef.current = rawMode; }, [rawMode]);

  // Flush any pending save on unmount
  useEffect(() => () => { clearTimeout(saveTimerRef.current); }, []);

  const flushSave = useCallback(async (value: string, isRaw: boolean) => {
    clearTimeout(saveTimerRef.current);
    setSaveState('saving');
    try {
      const patch = isRaw
        ? parseRawToDocumentPatch(value)
        : { content: value || null };
      await updateDocument(documentId, patch);
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
      queryClient.invalidateQueries({ queryKey: ['command-sheet', 'recent'] });
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    } catch {
      setSaveState('error');
      showToast('Could not save — try again');
    }
  }, [documentId]);

  const handleChange = useCallback((value: string) => {
    latestValueRef.current = value;
    setSaveState('dirty');
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      void flushSave(value, rawModeRef.current);
    }, SAVE_DEBOUNCE_MS);
  }, [flushSave]);

  const handleBlur = useCallback(() => {
    if (saveState === 'dirty' && latestValueRef.current !== null) {
      void flushSave(latestValueRef.current, rawModeRef.current);
    }
  }, [saveState, flushSave]);

  // When toggling modes, flush any pending edit first
  const handleToggleRaw = useCallback(() => {
    if (saveState === 'dirty' && latestValueRef.current !== null) {
      void flushSave(latestValueRef.current, rawModeRef.current);
    }
    clearTimeout(saveTimerRef.current);
    latestValueRef.current = null;
    setSaveState('idle');
    setRawMode((v) => !v);
  }, [saveState, flushSave]);

  const title = doc?.title ?? (doc ? `${doc.type}${doc.subtype ? `:${doc.subtype}` : ''}` : 'Document');

  const indicatorText =
    saveState === 'saving' ? 'Saving…' :
    saveState === 'saved'  ? 'Saved'   :
    saveState === 'error'  ? 'Failed'  : '';
  const indicatorHidden = saveState === 'idle' || saveState === 'dirty';

  // Build the initial content for the editor
  const editorKey = `${documentId}-${rawMode ? 'raw' : 'body'}`;
  const initialContent = doc
    ? (rawMode ? buildRawDocument(doc) : (doc.content ?? ''))
    : '';

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <button type="button" className={styles.iconBtn} onClick={goBack} aria-label="Back">
          <BackIcon />
        </button>
        <span className={styles.title}>{isLoading ? '' : title}</span>
        <div className={styles.headerRight}>
          <span
            className={`${styles.saveIndicator} ${indicatorHidden ? styles.saveIndicatorHidden : ''}`}
            aria-live="polite"
          >
            {indicatorText}
          </span>
          <button
            type="button"
            className={`${styles.modeToggle} ${rawMode ? styles.modeToggleActive : ''}`}
            onClick={handleToggleRaw}
            aria-pressed={rawMode}
            title={rawMode ? 'Switch to body view' : 'Switch to raw view'}
          >
            {'{ }'}
          </button>
        </div>
      </header>

      <div className={styles.body}>
        {isLoading && <p className={styles.loadingState}>Loading…</p>}

        {!isLoading && !doc && (
          <p className={styles.emptyState}>Document not found.</p>
        )}

        {!isLoading && doc && (
          <CodeMirrorEditor
            key={editorKey}
            initialBody={initialContent}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={rawMode ? '' : 'Start writing…'}
            autoFocus={false}
          />
        )}
      </div>
    </div>
  );
}
