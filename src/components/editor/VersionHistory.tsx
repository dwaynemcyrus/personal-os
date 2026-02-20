

import { useCallback, useEffect, useState } from 'react';
import type { RxDatabase } from 'rxdb';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetClose,
} from '@/components/ui/Sheet';
import type { DatabaseCollections, NoteVersionDocument } from '@/lib/db';
import { getVersions, restoreVersion } from '@/lib/versions';
import { formatRelativeTime } from '@/features/notes/noteUtils';
import styles from './VersionHistory.module.css';

type VersionHistoryProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noteId: string;
  db: RxDatabase<DatabaseCollections> | null;
  onRestore?: () => void;
};

type ViewMode = 'list' | 'preview' | 'compare';

export function VersionHistory({
  open,
  onOpenChange,
  noteId,
  db,
  onRestore,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<NoteVersionDocument[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<NoteVersionDocument | null>(null);
  const [currentContent, setCurrentContent] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isRestoring, setIsRestoring] = useState(false);

  // Load versions when opened
  useEffect(() => {
    if (!open || !db || !noteId) return;

    const loadData = async () => {
      const [versionList, noteDoc] = await Promise.all([
        getVersions(db, noteId),
        db.notes.findOne(noteId).exec(),
      ]);
      setVersions(versionList);
      setCurrentContent(noteDoc?.content ?? '');
    };

    loadData();
  }, [open, db, noteId]);

  // Reset view when closed
  useEffect(() => {
    if (!open) {
      setSelectedVersion(null);
      setViewMode('list');
    }
  }, [open]);

  const handleSelectVersion = useCallback((version: NoteVersionDocument) => {
    setSelectedVersion(version);
    setViewMode('preview');
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedVersion(null);
    setViewMode('list');
  }, []);

  const handleCompare = useCallback(() => {
    setViewMode('compare');
  }, []);

  const handleRestore = useCallback(async () => {
    if (!db || !selectedVersion) return;

    const confirmed = window.confirm(
      `Restore to version ${selectedVersion.version_number}?\n\nYour current content will be saved as a new version.`
    );
    if (!confirmed) return;

    setIsRestoring(true);
    try {
      const success = await restoreVersion(db, selectedVersion.id);
      if (success) {
        onRestore?.();
        onOpenChange(false);
      }
    } finally {
      setIsRestoring(false);
    }
  }, [db, selectedVersion, onRestore, onOpenChange]);

  const renderList = () => (
    <div className={styles.list}>
      {/* Current (unsaved) */}
      <div className={styles.item} data-current="true">
        <span className={styles.indicator}>●</span>
        <div className={styles.itemContent}>
          <strong>Current</strong>
          <span className={styles.itemTime}>Unsaved changes</span>
        </div>
      </div>

      {/* Past versions */}
      {versions.map((version) => (
        <button
          key={version.id}
          type="button"
          className={styles.item}
          onClick={() => handleSelectVersion(version)}
        >
          <span className={styles.indicator}>○</span>
          <div className={styles.itemContent}>
            <div className={styles.itemHeader}>
              <strong>v{version.version_number}</strong>
              {version.created_by === 'manual' && (
                <span className={styles.badge}>Saved</span>
              )}
            </div>
            {version.change_summary && (
              <p className={styles.summary}>{version.change_summary}</p>
            )}
            <span className={styles.itemTime}>
              {formatRelativeTime(version.created_at)}
            </span>
          </div>
          <ChevronIcon />
        </button>
      ))}

      {versions.length === 0 && (
        <p className={styles.empty}>No saved versions yet</p>
      )}
    </div>
  );

  const renderPreview = () => {
    if (!selectedVersion) return null;

    return (
      <div className={styles.preview}>
        <div className={styles.previewHeader}>
          <button
            type="button"
            className={styles.backButton}
            onClick={handleBackToList}
          >
            <BackIcon />
            Back
          </button>
          <span className={styles.previewTitle}>
            Version {selectedVersion.version_number}
          </span>
        </div>

        <div className={styles.previewContent}>
          <pre className={styles.previewText}>
            {selectedVersion.content || '(empty)'}
          </pre>
        </div>

        <div className={styles.previewActions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={handleCompare}
          >
            Compare
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleRestore}
            disabled={isRestoring}
          >
            {isRestoring ? 'Restoring...' : 'Restore'}
          </button>
        </div>
      </div>
    );
  };

  const renderCompare = () => {
    if (!selectedVersion) return null;

    return (
      <div className={styles.compare}>
        <div className={styles.previewHeader}>
          <button
            type="button"
            className={styles.backButton}
            onClick={() => setViewMode('preview')}
          >
            <BackIcon />
            Back
          </button>
          <span className={styles.previewTitle}>Compare</span>
        </div>

        <div className={styles.compareColumns}>
          <div className={styles.compareColumn}>
            <div className={styles.compareHeader}>
              Version {selectedVersion.version_number}
            </div>
            <pre className={styles.compareText}>
              {selectedVersion.content || '(empty)'}
            </pre>
          </div>
          <div className={styles.compareColumn}>
            <div className={styles.compareHeader}>Current</div>
            <pre className={styles.compareText}>
              {currentContent || '(empty)'}
            </pre>
          </div>
        </div>

        <div className={styles.previewActions}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleRestore}
            disabled={isRestoring}
          >
            {isRestoring ? 'Restoring...' : 'Restore Version'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={styles.sheet}
        aria-label="Version history"
      >
        <header className={styles.header}>
          <SheetTitle className={styles.title}>Version History</SheetTitle>
          <SheetClose asChild>
            <button
              type="button"
              className={styles.close}
              aria-label="Close version history"
            >
              <CloseIcon />
            </button>
          </SheetClose>
        </header>

        {viewMode === 'list' && renderList()}
        {viewMode === 'preview' && renderPreview()}
        {viewMode === 'compare' && renderCompare()}
      </SheetContent>
    </Sheet>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={styles.icon}
    >
      <path d="M6 6l12 12M18 6l-12 12" />
    </svg>
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
      className={styles.chevron}
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={styles.backIcon}
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
