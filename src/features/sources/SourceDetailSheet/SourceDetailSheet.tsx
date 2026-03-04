import { useRef, useState } from 'react';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from '@/components/ui/Sheet';
import type { ContentType, ReadStatus, ItemDocument } from '@/lib/db';
import { contentTypes, readStatuses } from '@/lib/db';
import { CloseIcon } from '@/components/ui/icons';
import styles from './SourceDetailSheet.module.css';

type SourceDetailSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: ItemDocument;
  onSave: (updates: Partial<ItemDocument>) => Promise<void>;
  onDelete: () => Promise<void>;
};

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  audio: 'Audio',
  video: 'Video',
  text: 'Text',
  live: 'Live',
};

const READ_STATUS_LABELS: Record<ReadStatus, string> = {
  inbox: 'Inbox',
  reading: 'Reading',
  read: 'Read',
};

export function SourceDetailSheet({
  open,
  onOpenChange,
  source,
  onSave,
  onDelete,
}: SourceDetailSheetProps) {
  const [title, setTitle] = useState(source.title ?? '');
  const [url, setUrl] = useState(source.url ?? '');
  const [contentType, setContentType] = useState<ContentType>((source.content_type ?? 'text') as ContentType);
  const [readStatus, setReadStatus] = useState<ReadStatus>((source.read_status ?? 'inbox') as ReadStatus);
  const [editingUrl, setEditingUrl] = useState(false);
  const pendingRef = useRef<Partial<ItemDocument>>({});

  const accumulate = (updates: Partial<ItemDocument>) => {
    pendingRef.current = { ...pendingRef.current, ...updates };
  };

  const handleOpenChange = async (next: boolean) => {
    if (!next) {
      const updates: Partial<ItemDocument> = {
        title: title.trim() || null,
        url,
        content_type: contentType,
        read_status: readStatus,
        ...pendingRef.current,
      };
      await onSave(updates);
      pendingRef.current = {};
    }
    onOpenChange(next);
  };

  const handleContentTypeChange = (ct: ContentType) => {
    setContentType(ct);
    accumulate({ content_type: ct });
  };

  const handleReadStatusChange = (rs: ReadStatus) => {
    setReadStatus(rs);
    accumulate({ read_status: rs });
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className={styles.content}
        aria-label="Source details"
      >
        <header className={styles.header}>
          <SheetTitle className={styles.sheetTitle}>Source</SheetTitle>
          <SheetClose asChild>
            <button
              type="button"
              className={styles.closeButton}
              aria-label="Close source"
            >
              <CloseIcon className={styles.icon} />
            </button>
          </SheetClose>
        </header>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Title</span>
          <input
            className={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Source title"
          />
        </label>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>URL</span>
          {editingUrl ? (
            <input
              className={styles.input}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={() => setEditingUrl(false)}
              placeholder="https://…"
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
          ) : (
            <div className={styles.urlRow}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.urlLink}
              >
                {url || '(no URL)'}
              </a>
              <button
                type="button"
                className={styles.editUrlButton}
                onClick={() => setEditingUrl(true)}
                aria-label="Edit URL"
              >
                <EditIcon />
              </button>
            </div>
          )}
        </div>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>Type</span>
          <div className={styles.pills}>
            {contentTypes.map((ct) => (
              <button
                key={ct}
                type="button"
                className={`${styles.pill} ${contentType === ct ? styles.pillActive : ''}`}
                onClick={() => handleContentTypeChange(ct)}
              >
                {CONTENT_TYPE_LABELS[ct]}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>Status</span>
          <div className={styles.pills}>
            {readStatuses.map((rs) => (
              <button
                key={rs}
                type="button"
                className={`${styles.pill} ${readStatus === rs ? styles.pillActive : ''}`}
                onClick={() => handleReadStatusChange(rs)}
              >
                {READ_STATUS_LABELS[rs]}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.button} ${styles.buttonDanger}`}
            onClick={onDelete}
          >
            Delete
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}


function EditIcon() {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
