'use client';

import { useEffect, useState } from 'react';
import type { RxDatabase } from 'rxdb';
import type { DatabaseCollections } from '@/lib/db';
import { getBacklinks } from '@/lib/noteLinks';
import styles from './BacklinksPanel.module.css';

type BacklinksPanelProps = {
  noteId: string;
  db: RxDatabase<DatabaseCollections> | null;
  onNavigate: (noteId: string) => void;
};

type Backlink = {
  sourceId: string;
  title: string;
  position: number;
};

export function BacklinksPanel({ noteId, db, onNavigate }: BacklinksPanelProps) {
  const [backlinks, setBacklinks] = useState<Backlink[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!db || !noteId) {
      setBacklinks([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const loadBacklinks = async () => {
      setIsLoading(true);
      try {
        const links = await getBacklinks(db, noteId);
        if (!cancelled) {
          // Dedupe by sourceId (a note may link multiple times)
          const seen = new Set<string>();
          const unique = links.filter((link) => {
            if (seen.has(link.sourceId)) return false;
            seen.add(link.sourceId);
            return true;
          });
          setBacklinks(unique);
        }
      } catch {
        if (!cancelled) {
          setBacklinks([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadBacklinks();

    return () => {
      cancelled = true;
    };
  }, [db, noteId]);

  if (isLoading) {
    return null;
  }

  if (backlinks.length === 0) {
    return null;
  }

  return (
    <div className={styles.panel}>
      <button
        type="button"
        className={styles.header}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span className={styles.count}>{backlinks.length}</span>
        <span className={styles.label}>
          {backlinks.length === 1 ? 'Backlink' : 'Backlinks'}
        </span>
        <span className={styles.chevron} data-expanded={isExpanded}>
          <ChevronIcon />
        </span>
      </button>

      {isExpanded && (
        <ul className={styles.list}>
          {backlinks.map((link) => (
            <li key={link.sourceId}>
              <button
                type="button"
                className={styles.link}
                onClick={() => onNavigate(link.sourceId)}
              >
                {link.title}
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
