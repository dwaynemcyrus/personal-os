import type React from 'react';
import { BackIcon } from '@/components/ui/icons';
import styles from './ViewShell.module.css';

type ViewShellProps = {
  title: string;
  onBack: () => void;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
};

export function ViewShell({ title, onBack, rightSlot, children }: ViewShellProps) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <button type="button" className={styles.back} onClick={onBack} aria-label="Back">
          <BackIcon />
        </button>
        <span className={styles.title}>{title}</span>
        {rightSlot != null ? <div className={styles.right}>{rightSlot}</div> : <span />}
      </header>
      <div className={styles.body}>{children}</div>
    </div>
  );
}

// Re-export shared style classes for use by views
export { styles as viewStyles };
