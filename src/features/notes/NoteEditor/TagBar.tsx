import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { patchItem } from '@/lib/db';
import { queryClient } from '@/lib/queryClient';
import { nowIso } from '@/lib/time';
import styles from './TagBar.module.css';

type Props = {
  noteId: string;
  tags: string[];
};

export function TagBar({ noteId, tags }: Props) {
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
    if (!trimmedInput) return available.slice(0, 8);
    return available.filter((t) => t.toLowerCase().includes(trimmedInput)).slice(0, 8);
  }, [catalogTags, tags, trimmedInput]);

  const canCreate =
    trimmedInput.length > 0 &&
    !tags.includes(trimmedInput) &&
    !catalogTags.map((t) => t.toLowerCase()).includes(trimmedInput);

  const showDropdown = isOpen && (suggestions.length > 0 || canCreate);

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
    setIsOpen(false);
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
      setIsOpen(false);
      setInput('');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      (containerRef.current?.querySelector(`.${styles.dropdownItem}`) as HTMLElement)?.focus();
    }
  };

  const handleDropdownKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, tag: string) => {
    if (e.key === 'Enter') { e.preventDefault(); void addTag(tag); }
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      (e.currentTarget.parentElement?.nextElementSibling?.querySelector('button') as HTMLElement)?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = e.currentTarget.parentElement?.previousElementSibling?.querySelector('button') as HTMLElement;
      if (prev) prev.focus(); else inputRef.current?.focus();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.focus();
    }
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={containerRef} className={styles.root}>
      <div className={styles.bar} onClick={() => inputRef.current?.focus()}>
        {tags.map((tag) => (
          <span key={tag} className={styles.pill}>
            <span className={styles.pillHash}>#</span>{tag}
            <button
              type="button"
              className={styles.pillRemove}
              onMouseDown={(e) => { e.preventDefault(); void removeTag(tag); }}
              aria-label={`Remove tag ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          value={input}
          onChange={(e) => { setInput(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? 'Add tags…' : ''}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Add tag"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
        />
      </div>

      {showDropdown && (
        <ul className={styles.dropdown} role="listbox">
          {canCreate && (
            <li role="option">
              <button
                type="button"
                className={styles.dropdownItem}
                onMouseDown={(e) => { e.preventDefault(); void addTag(trimmedInput); }}
                onKeyDown={(e) => handleDropdownKeyDown(e, trimmedInput)}
              >
                Create <strong className={styles.dropdownNew}>#{trimmedInput}</strong>
              </button>
            </li>
          )}
          {suggestions.map((tag) => (
            <li key={tag} role="option">
              <button
                type="button"
                className={styles.dropdownItem}
                onMouseDown={(e) => { e.preventDefault(); void addTag(tag); }}
                onKeyDown={(e) => handleDropdownKeyDown(e, tag)}
              >
                <span className={styles.dropdownHash}>#</span>{tag}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
