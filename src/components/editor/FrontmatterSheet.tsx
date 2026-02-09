'use client';

import { useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetClose,
} from '@/components/ui/Sheet';
import styles from './FrontmatterSheet.module.css';

type FrontmatterSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string | null;
};

export function FrontmatterSheet({
  open,
  onOpenChange,
  value,
  onChange,
  onBlur,
  error,
}: FrontmatterSheetProps) {
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(event.target.value);
    },
    [onChange]
  );

  const errorId = error ? 'frontmatter-error' : undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={styles.sheet}
        aria-label="Edit frontmatter"
      >
        <header className={styles.header}>
          <SheetTitle className={styles.title}>Frontmatter</SheetTitle>
          <SheetClose asChild>
            <button
              type="button"
              className={styles.close}
              aria-label="Close frontmatter"
            >
              <CloseIcon />
            </button>
          </SheetClose>
        </header>

        <p className={styles.help}>
          Edit YAML key/value pairs that power properties and metadata.
        </p>

        <textarea
          className={styles.editor}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          spellCheck="false"
          aria-label="Frontmatter YAML"
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
        />

        {error ? (
          <div id={errorId} role="alert" className={styles.error}>
            {error}
          </div>
        ) : null}
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
