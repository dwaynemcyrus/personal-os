import { useState } from 'react';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from '@/components/ui/Sheet';
import type { AreaDocument } from '@/lib/db';
import styles from './AreaDetailSheet.module.css';

type AreaDetailSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  area: AreaDocument | null;
  onSave: (areaId: string, title: string) => Promise<void> | void;
  onDelete: (areaId: string) => Promise<void> | void;
};

export function AreaDetailSheet({
  open,
  onOpenChange,
  area,
  onSave,
  onDelete,
}: AreaDetailSheetProps) {
  const [title, setTitle] = useState(area?.title ?? '');

  const handleSave = async () => {
    if (!area || !title.trim()) return;
    await onSave(area.id, title.trim());
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!area) return;
    await onDelete(area.id);
    onOpenChange(false);
  };

  if (!area) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={styles['area-detail__content']}
        aria-label="Area details"
      >
        <header className={styles['area-detail__header']}>
          <SheetTitle className={styles['area-detail__title']}>
            Area
          </SheetTitle>
          <SheetClose asChild>
            <button
              type="button"
              className={styles['area-detail__close']}
              aria-label="Close area"
            >
              <CloseIcon />
            </button>
          </SheetClose>
        </header>

        <label className={styles['area-detail__field']}>
          <span className={styles['area-detail__label']}>Title</span>
          <input
            className={styles['area-detail__input']}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Area title"
          />
        </label>

        <div className={styles['area-detail__actions']}>
          <button
            type="button"
            className={styles['area-detail__button']}
            onClick={handleSave}
            disabled={!title.trim()}
          >
            Save
          </button>
          <button
            type="button"
            className={`${styles['area-detail__button']} ${styles['area-detail__button--danger']}`}
            onClick={handleDelete}
          >
            Delete
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CloseIcon() {
  return (
    <svg
      className={styles['area-detail__icon']}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M18 6L6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
