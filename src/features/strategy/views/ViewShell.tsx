import type React from 'react';
import { BackIcon } from '@/components/ui/icons';
import { useStrategyMenu } from '../StrategyMenuContext';
import styles from './ViewShell.module.css';

type ViewShellProps = {
  title: string;
  onBack: () => void;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
};

export function ViewShell({ title, onBack, rightSlot, children }: ViewShellProps) {
  const menu = useStrategyMenu();
  const hasRight = rightSlot != null || menu != null;

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <button type="button" className={styles.back} onClick={onBack} aria-label="Back">
          <BackIcon />
        </button>
        <span className={styles.title}>{title}</span>
        {hasRight ? (
          <div className={styles.right}>
            {rightSlot}
            {menu && (
              <button
                type="button"
                className={styles.menuBtn}
                onClick={menu.openMenu}
                aria-label="More options"
              >
                <DotsIcon />
              </button>
            )}
          </div>
        ) : (
          <span />
        )}
      </header>
      <div className={styles.body}>{children}</div>
    </div>
  );
}

function DotsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
      <circle cx="10" cy="4" r="1.5" />
      <circle cx="10" cy="10" r="1.5" />
      <circle cx="10" cy="16" r="1.5" />
    </svg>
  );
}

// Re-export shared style classes for use by views
export { styles as viewStyles };
