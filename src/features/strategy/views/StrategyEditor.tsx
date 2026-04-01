import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { CodeMirrorEditor } from '@/components/editor';
import { patchStrategyItem } from '../strategyMutations';
import styles from './StrategyEditor.module.css';

const SAVE_DEBOUNCE_MS = 1200;

type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

type Props = {
  /** The items.id of the document being edited. */
  itemId: string;
  /**
   * Initial content from the parent's existing items query — used immediately
   * while the latest item row is still loading.
   */
  fallbackContent?: string | null;
};

/** Fetches the freshest content from items table. */
function useItemContent(itemId: string) {
  return useQuery({
    queryKey: ['strategy-item-content', itemId],
    queryFn: async (): Promise<string> => {
      const { data } = await supabase
        .from('items')
        .select('content')
        .eq('id', itemId)
        .maybeSingle();
      return data?.content ?? '';
    },
    staleTime: 0, // always fetch latest for editable docs
    refetchOnWindowFocus: false,
  });
}

export function StrategyEditor({ itemId, fallbackContent }: Props) {
  const { data: freshContent, isLoading } = useItemContent(itemId);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  const saveTimerRef = useRef<number | undefined>(undefined);
  const latestContentRef = useRef<string | null>(null);

  const flushSave = useCallback(
    async (value: string) => {
      clearTimeout(saveTimerRef.current);
      setSaveState('saving');
      try {
        await patchStrategyItem(itemId, { content: value });
        queryClient.invalidateQueries({ queryKey: ['strategy', 'document', itemId] });
        setSaveState('saved');
        // Fade out "Saved" after 2 s
        setTimeout(() => setSaveState('idle'), 2000);
      } catch {
        setSaveState('error');
      }
    },
    [itemId],
  );

  const handleChange = useCallback(
    (value: string) => {
      latestContentRef.current = value;
      setSaveState('dirty');
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(() => {
        flushSave(value);
      }, SAVE_DEBOUNCE_MS);
    },
    [flushSave],
  );

  const handleBlur = useCallback(() => {
    if (saveState === 'dirty' && latestContentRef.current !== null) {
      flushSave(latestContentRef.current);
    }
  }, [saveState, flushSave]);

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      clearTimeout(saveTimerRef.current);
    };
  }, []);

  // Determine what content to show
  const initialContent = isLoading ? (fallbackContent ?? '') : (freshContent ?? fallbackContent ?? '');

  const indicatorText =
    saveState === 'saving'
      ? 'Saving…'
      : saveState === 'saved'
        ? 'Saved'
        : saveState === 'error'
          ? 'Save failed'
          : '';

  const indicatorHidden = saveState === 'idle' || saveState === 'dirty';

  return (
    <>
      <div className={styles.saveRow}>
        <span
          className={`${styles.saveIndicator} ${indicatorHidden ? styles['saveIndicator--hidden'] : ''}`}
        >
          {indicatorText}
        </span>
      </div>
      <div className={styles.container}>
        {/* key=itemId so the editor remounts when navigating between docs */}
        <CodeMirrorEditor
          key={itemId}
          initialBody={initialContent}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Start writing…"
          autoFocus={false}
        />
      </div>
    </>
  );
}
