import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { supabase } from '@/lib/supabase';
import { patchItem } from '@/lib/db';
import { queryClient } from '@/lib/queryClient';
import { nowIso } from '@/lib/time';
import styles from './TagsDialog.module.css';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noteId: string;
  tags: string[];
};

export function TagsDialog({ open, onOpenChange, noteId, tags }: Props) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setInput('');
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const { data: catalogTags = [] } = useQuery({
    queryKey: ['tags', 'catalog'],
    queryFn: async (): Promise<string[]> => {
      const { data } = await supabase
        .from('tags')
        .select('name')
        .eq('is_trashed', false)
        .order('name');
      return (data ?? []).map((t) => t.name as string);
    },
    staleTime: 60_000,
  });

  const trimmedInput = input.trim().toLowerCase();

  const suggestions = useMemo(() => {
    const available = catalogTags.filter((t) => !tags.includes(t));
    if (!trimmedInput) return available.slice(0, 12);
    return available.filter((t) => t.toLowerCase().includes(trimmedInput)).slice(0, 12);
  }, [catalogTags, tags, trimmedInput]);

  const canCreate =
    trimmedInput.length > 0 &&
    !tags.includes(trimmedInput) &&
    !catalogTags.map((t) => t.toLowerCase()).includes(trimmedInput);

  const saveTags = async (next: string[]) => {
    await patchItem(noteId, { tags: next, updated_at: nowIso() });
    queryClient.invalidateQueries({ queryKey: ['note', noteId] });
    queryClient.invalidateQueries({ queryKey: ['notes', 'list'] });
  };

  const addTag = async (name: string) => {
    const tag = name.trim().toLowerCase();
    if (!tag || tags.includes(tag)) return;
    if (!catalogTags.includes(tag)) {
      const now = nowIso();
      await supabase.from('tags').insert({ id: uuidv4(), name: tag, created_at: now, updated_at: now });
      queryClient.invalidateQueries({ queryKey: ['tags', 'catalog'] });
    }
    await saveTags([...tags, tag]);
    setInput('');
    inputRef.current?.focus();
  };

  const removeTag = async (name: string) => {
    await saveTags(tags.filter((t) => t !== name));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (trimmedInput) void addTag(trimmedInput);
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      void removeTag(tags[tags.length - 1]);
    } else if (e.key === 'Escape') {
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" ariaLabel="Tags" className={styles.dialog}>
        <div className={styles.header}>
          <span className={styles.title}>Tags</span>
          <button type="button" className={styles.doneBtn} onClick={() => onOpenChange(false)}>
            Done
          </button>
        </div>

        {/* Current tags */}
        <div className={styles.pillsArea}>
          {tags.length === 0 && (
            <span className={styles.noneLabel}>No tags yet</span>
          )}
          {tags.map((tag) => (
            <span key={tag} className={styles.pill}>
              <span className={styles.pillHash}>#</span>{tag}
              <button
                type="button"
                className={styles.pillRemove}
                onClick={() => void removeTag(tag)}
                aria-label={`Remove ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>

        {/* Input */}
        <div className={styles.inputRow}>
          <input
            ref={inputRef}
            type="text"
            className={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add tag…"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>

        {/* Suggestions */}
        {(suggestions.length > 0 || canCreate) && (
          <ul className={styles.suggestions}>
            {canCreate && (
              <li>
                <button
                  type="button"
                  className={styles.suggestion}
                  onClick={() => void addTag(trimmedInput)}
                >
                  Create <strong className={styles.newTag}>#{trimmedInput}</strong>
                </button>
              </li>
            )}
            {suggestions.map((tag) => (
              <li key={tag}>
                <button
                  type="button"
                  className={styles.suggestion}
                  onClick={() => void addTag(tag)}
                >
                  <span className={styles.suggestionHash}>#</span>{tag}
                </button>
              </li>
            ))}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  );
}
