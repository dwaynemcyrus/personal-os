'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/Sheet';
import { FocusSheet } from '@/components/layout/FocusSheet';
import { useTimer } from '@/features/timer';
import styles from './AppShell.module.css';

type AppShellProps = {
  children: React.ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  description: string;
};

const NAV_ITEMS: NavItem[] = [
  {
    href: '/strategy',
    label: 'Strategy',
    description: 'Projects, goals, and planning',
  },
  {
    href: '/knowledge',
    label: 'Knowledge',
    description: 'Notes, ideas, and references',
  },
  {
    href: '/execution',
    label: 'Execution',
    description: 'Tasks, habits, and focus',
  },
];

const PAGE_TITLES: Record<string, string> = {
  '/': 'Today',
  '/strategy': 'Strategy',
  '/knowledge': 'Knowledge',
  '/execution': 'Execution',
  '/dev': 'Dev',
};

const triggerHaptic = () => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(10);
  }
};

const getBackHref = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length <= 1) return '/';
  return `/${segments[0]}`;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isFocusOpen, setIsFocusOpen] = useState(false);

  const {
    state: focusState,
    elapsedLabel: focusElapsedLabel,
    activityLabel: focusActivityLabel,
    projectLabel: focusProjectLabel,
    isUnplanned: focusIsUnplanned,
    taskOptions,
    unplannedSuggestions,
    startEntry,
    pause,
    resume,
    stop,
  } = useTimer();

  const isRoot = pathname === '/';
  const pageTitle = PAGE_TITLES[pathname] ?? 'Personal OS';

  const activeHref = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return '/';
    return `/${segments[0]}`;
  }, [pathname]);

  const handleBack = () => {
    triggerHaptic();
    router.push(getBackHref(pathname));
  };

  const handleOpenMenu = () => {
    triggerHaptic();
    setIsMenuOpen(true);
  };

  const handleOpenCommand = () => {
    triggerHaptic();
    setIsCommandOpen(true);
  };

  const handleOpenFocus = () => {
    triggerHaptic();
    setIsFocusOpen(true);
  };

  useEffect(() => {
    const handleOpen = () => {
      triggerHaptic();
      setIsFocusOpen(true);
    };

    window.addEventListener('focus-sheet:open', handleOpen);
    return () => {
      window.removeEventListener('focus-sheet:open', handleOpen);
    };
  }, []);

  const handleOpenFocusFromCommand = () => {
    triggerHaptic();
    setIsCommandOpen(false);
    setIsFocusOpen(true);
  };

  const focusStatusLabel = formatFocusStatus(focusState);
  const showFocusChip = focusState !== 'idle';

  return (
    <div className={styles['app-shell']}>
      <header className={styles['app-shell__topbar']}>
        <div className={styles['app-shell__topbar-left']}>
          {isRoot ? (
            <button
              type="button"
              className={styles['app-shell__icon-button']}
              onClick={handleOpenMenu}
              aria-label="Open menu"
            >
              <MenuIcon />
            </button>
          ) : (
            <button
              type="button"
              className={styles['app-shell__icon-button']}
              onClick={handleBack}
              aria-label="Go back"
            >
              <BackIcon />
            </button>
          )}
        </div>
        <div className={styles['app-shell__topbar-title']}>{pageTitle}</div>
        <div className={styles['app-shell__topbar-right']}>
          {showFocusChip ? (
            <button
              type="button"
              className={styles['app-shell__focus-chip']}
              data-status={focusState}
              onClick={handleOpenFocus}
              aria-label={`Open focus timer, ${focusStatusLabel}, ${focusElapsedLabel}`}
            >
              <span className={styles['app-shell__focus-time']}>
                {focusElapsedLabel}
              </span>
              <span className={styles['app-shell__focus-status']}>
                {focusStatusLabel}
              </span>
            </button>
          ) : null}
        </div>
      </header>
      <div className={styles['app-shell__topbar-spacer']} aria-hidden="true" />

      <main className={styles['app-shell__content']}>{children}</main>

      <button
        type="button"
        className={styles['app-shell__fab']}
        onClick={handleOpenCommand}
        aria-label="Open command center"
      >
        <PlusIcon />
      </button>

      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent side="left" className={styles['app-shell__menu']} asChild>
          <motion.div
            drag="x"
            dragConstraints={{ left: -140, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x < -80 || info.velocity.x < -500) {
                setIsMenuOpen(false);
              }
            }}
          >
            <SheetTitle className={styles['app-shell__menu-title']}>
              Navigate
            </SheetTitle>
            <nav className={styles['app-shell__menu-nav']}>
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={styles['app-shell__menu-link']}
                  data-active={activeHref === item.href}
                  onClick={() => {
                    triggerHaptic();
                    setIsMenuOpen(false);
                  }}
                >
                  <span className={styles['app-shell__menu-label']}>
                    {item.label}
                  </span>
                  <span className={styles['app-shell__menu-description']}>
                    {item.description}
                  </span>
                </Link>
              ))}
            </nav>
          </motion.div>
        </SheetContent>
      </Sheet>

      <Sheet open={isCommandOpen} onOpenChange={setIsCommandOpen}>
        <SheetContent
          side="bottom"
          className={styles['app-shell__command']}
          aria-label="Command center"
        >
          <div className={styles['app-shell__command-actions']}>
            <button
              type="button"
              className={styles['app-shell__command-action']}
              onClick={handleOpenFocusFromCommand}
            >
              <span>Focus Timer</span>
              <span className={styles['app-shell__command-meta']}>
                {focusStatusLabel}
              </span>
            </button>
          </div>
          <div className={styles['app-shell__command-header']}>
            Command Center
          </div>
          <p className={styles['app-shell__command-body']}>
            Stub: quick capture and search will land here.
          </p>
        </SheetContent>
      </Sheet>

      <FocusSheet
        key={isFocusOpen ? 'focus-open' : 'focus-closed'}
        open={isFocusOpen}
        onOpenChange={setIsFocusOpen}
        state={focusState}
        elapsedLabel={focusElapsedLabel}
        activityLabel={focusActivityLabel}
        projectLabel={focusProjectLabel}
        isUnplanned={focusIsUnplanned}
        taskOptions={taskOptions}
        unplannedSuggestions={unplannedSuggestions}
        onStart={startEntry}
        onPause={pause}
        onResume={resume}
        onStop={stop}
      />
    </div>
  );
}

function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={styles['app-shell__icon']}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h12" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={styles['app-shell__icon']}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={styles['app-shell__fab-icon']}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function formatFocusStatus(state: 'idle' | 'running' | 'paused') {
  switch (state) {
    case 'running':
      return 'Running';
    case 'paused':
      return 'Paused';
    default:
      return 'Idle';
  }
}
