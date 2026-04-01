import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { updateDocument } from '@/lib/db';
import { queryClient } from '@/lib/queryClient';
import { buildRawDocument, parseRawToDocumentPatch } from '@/lib/documentRaw';
import {
  mergeTemplatePatchIntoDocument,
  resolveTemplateDocumentPatch,
} from '@/hooks/useDocumentTemplate';
import { maybeCreateAutoItemHistorySnapshot } from '@/lib/itemHistory';
import { CodeMirrorEditor, type CodeMirrorEditorHandle } from '@/components/editor';
import { BackIcon, HistoryIcon, LinkIcon } from '@/components/ui/icons';
import { useNavigationActions } from '@/components/providers';
import { showToast } from '@/components/ui/Toast';
import { TemplatePicker, type TemplateOption } from './TemplatePicker';
import { DocumentBacklinksSheet } from './DocumentBacklinksSheet';
import { DocumentHistorySheet } from './DocumentHistorySheet';
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
  const { goBack, pushLayer } = useNavigationActions();
  const { data: doc, isLoading } = useDocumentRow(documentId);

  const [rawMode, setRawMode]               = useState(false);
  const [saveState, setSaveState]           = useState<SaveState>('idle');
  const [templateOpen, setTemplateOpen]     = useState(false);
  const [backlinksOpen, setBacklinksOpen]   = useState(false);
  const [historyOpen, setHistoryOpen]       = useState(false);

  const saveTimerRef   = useRef<number | undefined>(undefined);
  const latestValueRef = useRef<string | null>(null);
  const rawModeRef     = useRef(rawMode);
  const editorRef      = useRef<CodeMirrorEditorHandle>(null);

  useEffect(() => { rawModeRef.current = rawMode; }, [rawMode]);

  // Flush any pending save on unmount
  useEffect(() => () => { clearTimeout(saveTimerRef.current); }, []);

  const buildSnapshotFromValue = useCallback((value: string, isRaw: boolean) => {
    if (!doc) return value;
    const patch = isRaw
      ? parseRawToDocumentPatch(value)
      : { content: value || null };
    return buildRawDocument({ ...doc, ...patch });
  }, [doc]);

  const getCurrentSnapshot = useCallback(() => {
    if (!doc) return '';
    const latestValue = latestValueRef.current;
    if (latestValue !== null) {
      return buildSnapshotFromValue(latestValue, rawModeRef.current);
    }
    return buildSnapshotFromValue(rawMode ? buildRawDocument(doc) : (doc.content ?? ''), rawMode);
  }, [buildSnapshotFromValue, doc, rawMode]);

  const flushSave = useCallback(async (value: string, isRaw: boolean) => {
    clearTimeout(saveTimerRef.current);
    setSaveState('saving');
    try {
      const patch = isRaw
        ? parseRawToDocumentPatch(value)
        : { content: value || null };
      await updateDocument(documentId, patch);
      const savedSnapshot = buildSnapshotFromValue(value, isRaw);
      if (doc?.type === 'note') {
        await maybeCreateAutoItemHistorySnapshot(documentId, savedSnapshot, doc.updated_at);
      }
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
      queryClient.invalidateQueries({ queryKey: ['document-backlinks'] });
      queryClient.invalidateQueries({ queryKey: ['item-history', documentId] });
      queryClient.invalidateQueries({ queryKey: ['command-sheet', 'recent'] });
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      queryClient.invalidateQueries({ queryKey: ['document-template'] });
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    } catch {
      setSaveState('error');
      showToast('Could not save — try again');
    }
  }, [buildSnapshotFromValue, doc?.type, doc?.updated_at, documentId]);

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

  // Apply a template — replaces body content and merges missing template defaults.
  const handleApplyTemplate = useCallback(async (template: TemplateOption) => {
    const editor = editorRef.current;
    if (!editor || !doc) return;

    try {
      const templatePatch = await resolveTemplateDocumentPatch(template.type, template.subtype, {
        title: doc?.title ?? '',
      });
      if (!templatePatch) {
        showToast('Could not apply template — try again');
        return;
      }

      const mergedPatch = mergeTemplatePatchIntoDocument(doc, templatePatch);
      await updateDocument(documentId, mergedPatch);
      const nextDoc = { ...doc, ...mergedPatch };

      if (rawModeRef.current && doc) {
        const newRaw = buildRawDocument(nextDoc);
        editor.replaceContent(newRaw);
        latestValueRef.current = newRaw;
      } else {
        editor.replaceContent(mergedPatch.content ?? '');
        latestValueRef.current = mergedPatch.content ?? '';
      }

      clearTimeout(saveTimerRef.current);
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
      queryClient.invalidateQueries({ queryKey: ['document-backlinks'] });
      queryClient.invalidateQueries({ queryKey: ['item-history', documentId] });
      queryClient.invalidateQueries({ queryKey: ['command-sheet', 'recent'] });
      setSaveState('saved');
      window.setTimeout(() => setSaveState('idle'), 2000);
    } catch {
      showToast('Could not apply template — try again');
    }
  }, [doc, documentId]);

  const title = doc?.title ?? (doc ? `${doc.type}${doc.subtype ? `:${doc.subtype}` : ''}` : 'Document');
  const isNoteDocument = doc?.type === 'note';

  const handleRestoreSnapshot = useCallback(async (snapshot: string) => {
    if (!doc) return;

    const patch = parseRawToDocumentPatch(snapshot);
    await updateDocument(documentId, patch);
    queryClient.invalidateQueries({ queryKey: ['document', documentId] });
    queryClient.invalidateQueries({ queryKey: ['document-backlinks'] });
    queryClient.invalidateQueries({ queryKey: ['item-history', documentId] });

    if (rawModeRef.current) {
      editorRef.current?.replaceContent(snapshot);
      latestValueRef.current = snapshot;
    } else {
      editorRef.current?.replaceContent(patch.content ?? '');
      latestValueRef.current = patch.content ?? '';
    }

    setSaveState('saved');
    window.setTimeout(() => setSaveState('idle'), 2000);
  }, [doc, documentId]);

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
          {isNoteDocument ? (
            <button
              type="button"
              className={styles.modeToggle}
              onClick={() => setBacklinksOpen(true)}
              title="Show backlinks"
              aria-label="Show backlinks"
            >
              <LinkIcon />
            </button>
          ) : null}
          {isNoteDocument ? (
            <button
              type="button"
              className={styles.modeToggle}
              onClick={() => setHistoryOpen(true)}
              title="Show version history"
              aria-label="Show version history"
            >
              <HistoryIcon />
            </button>
          ) : null}
          <button
            type="button"
            className={styles.modeToggle}
            onClick={() => setTemplateOpen(true)}
            title="Apply template"
            aria-label="Apply template"
          >
            ¶
          </button>
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
            ref={editorRef}
            key={editorKey}
            initialBody={initialContent}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={rawMode ? '' : 'Start writing…'}
            autoFocus={false}
          />
        )}
      </div>

      <TemplatePicker
        open={templateOpen}
        onOpenChange={setTemplateOpen}
        onSelect={handleApplyTemplate}
      />

      <DocumentBacklinksSheet
        open={backlinksOpen}
        onOpenChange={setBacklinksOpen}
        documentId={documentId}
        documentTitle={doc?.title}
        onOpenDocument={(id) => pushLayer({ view: 'document-detail', documentId: id })}
      />

      <DocumentHistorySheet
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        itemId={documentId}
        getCurrentSnapshot={getCurrentSnapshot}
        getSourceUpdatedAt={() => doc?.updated_at ?? null}
        onRestoreSnapshot={handleRestoreSnapshot}
      />
    </div>
  );
}
