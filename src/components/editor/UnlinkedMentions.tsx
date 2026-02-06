'use client';

import { useEffect, useState } from 'react';
import type { RxDatabase } from 'rxdb';
import type { DatabaseCollections } from '@/lib/db';
import { findUnlinkedMentions } from '@/lib/noteLinks';
import styles from './UnlinkedMentions.module.css';

type UnlinkedMentionsProps = {
  noteTitle: string;
  db: RxDatabase<DatabaseCollections> | null;
  onNavigate: (noteId: string) => void;
};

type Mention = {
  noteId: string;
  noteTitle: string;
  count: number;
};

export function UnlinkedMentions({ noteTitle, db, onNavigate }: UnlinkedMentionsProps) {
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!db || !noteTitle || noteTitle === 'Untitled') {
      setMentions([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const loadMentions = async () => {
      setIsLoading(true);
      try {
        const found = await findUnlinkedMentions(db, noteTitle);
        if (!cancelled) {
          setMentions(
            found.map((m) => ({
              noteId: m.noteId,
              noteTitle: m.noteTitle,
              count: m.positions.length,
            }))
          );
        }
      } catch {
        if (!cancelled) {
          setMentions([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadMentions();

    return () => {
      cancelled = true;
    };
  }, [db, noteTitle]);

  if (isLoading) {
    return null;
  }

  if (mentions.length === 0) {
    return null;
  }

  const totalCount = mentions.reduce((sum, m) => sum + m.count, 0);

  return (
    <div className={styles.panel}>
      <button
        type="button"
        className={styles.header}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span className={styles.count}>{totalCount}</span>
        <span className={styles.label}>
          Unlinked {totalCount === 1 ? 'mention' : 'mentions'}
        </span>
        <span className={styles.chevron} data-expanded={isExpanded}>
          <ChevronIcon />
        </span>
      </button>

      {isExpanded && (
        <ul className={styles.list}>
          {mentions.map((mention) => (
            <li key={mention.noteId}>
              <button
                type="button"
                className={styles.link}
                onClick={() => onNavigate(mention.noteId)}
              >
                <span className={styles.linkTitle}>{mention.noteTitle}</span>
                <span className={styles.linkCount}>
                  {mention.count} {mention.count === 1 ? 'mention' : 'mentions'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
