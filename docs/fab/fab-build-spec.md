# Global Quick Capture FAB Spec (xfer)

This document is the replication spec for the global quick capture/search FAB and its search index.
It is derived directly from the current implementation in this repo (Anchored App).

## Scope
- Global floating action button (FAB) that opens quick capture.
- Full-screen quick capture/search modal.
- Long-press drag-to-navigate targets.
- Local search index implementation (normalize + search + ranking).

## Non-goals
- New UI variations or redesign.
- New features beyond the current behavior.
- New data models, new storage backends, or new sync logic.

## Source of truth (files)
- `src/components/shell/Shell.js`
- `src/components/shell/Shell.module.css`
- `src/components/shell/AppShell.module.css`
- `src/components/shell/QuickCaptureModal.js`
- `src/components/shell/QuickCaptureModal.module.css`
- `src/app/globals.css`
- `src/hooks/useVisualViewportInsets.js`
- `src/lib/search/normalize.js`
- `src/lib/search/searchDocuments.js`

## Overview
The FAB is globally mounted in the App Shell overlay layer and is always visible on non-public routes.
Pressing the FAB opens a full-screen quick capture modal with a combined capture + search UI.
Long-pressing the FAB (300ms) activates a drag mode that reveals three radial targets
(Command, Knowledge, Strategy). Dropping the FAB over a target navigates to that route.

The quick capture modal supports:
- Capture-only (empty query) with recent documents.
- Search mode (non-empty query) with debounced local search.
- Rapid capture mode (keep modal open after saving).
- Keyboard navigation (Enter, Escape, Tab, Arrow keys) for desktop.

The search index is local-only and fully in-memory. It normalizes, tokenizes, and ranks
matches by tiers and scores. It also produces snippets for results.

## Layout + layering
- Shell overlay layer: `z-index: 20` (FAB + header).
- Drag targets layer: `z-index: 21`.
- Menu overlay: `z-index: 25` (unrelated to FAB).
- Quick capture modal: `z-index: 40` (full-screen, fixed).

## Safe-area + keyboard insets
- CSS variables drive header and FAB spacing.
- `useVisualViewportInsets` updates `--shell-keyboard-inset` and `--vv-offset-top` to keep
  content and FAB positioned correctly when the keyboard opens.

## Behavior specification
### Open/close
- FAB click -> opens quick capture modal.
- Cmd/Ctrl + K -> opens quick capture modal (disabled on public routes).
- Escape key:
  - If selection mode: exits selection mode back to input.
  - If input has text: clears input.
  - Otherwise: closes modal.

### Capture create behavior
- Save or Enter (in input mode) creates an inbox document.
- Uses capture template when available (`getCaptureTemplate`).
- Falls back to `createDocument` (documents store).
- Signals inbox list reload via `incrementInboxVersion`.

### Search behavior
- Input non-empty -> debounced search (60ms).
- Uses `ensureSearchIndex` + `searchDocuments` with limit 12.
- Filters out inbox (unless trashed) and filters archived/trashed based on toggles.
- Best match (tier 0) opens directly on Enter.
- If no best match, Enter creates a new note from query text.

### Drag-to-navigate behavior
- Long-press (300ms) activates drag mode.
- Radial targets positioned at offsets: [-96, 0], [96, 0], [0, -96].
- Drop detection uses a 48px hit radius around target centers.

### Accessibility
- FAB has `aria-label="Quick capture"`.
- Modal uses `role="dialog"` and `aria-modal="true"`.
- Results list uses `role="listbox"` and `aria-activedescendant`.
- Toggle buttons use `aria-pressed`.
- Focus rings defined via `:focus-visible`.

### Motion + haptics
- No explicit animations on the FAB or modal (aside from toggle transitions).
- No haptics in current implementation.

## Data contract (for replication)
Search index expects each document to provide:
- `id: string`
- `title: string | null`
- `slug: string | null`
- `body: string`
- `updatedAt: number`
- `createdAt: number`
- `deletedAt: number | null`
- `archivedAt: number | null`
- `inboxAt: number | null`
- `type: string`

The quick capture modal expects functions and stores that can:
- list/search documents (`getSearchableDocs`)
- create documents (`createDocument`, `createFromTemplate`)
- update the search index (`ensureSearchIndex`, `updateSearchIndex`, `removeFromSearchIndex`)

---

# Implementation Code (copy-ready)

## Shell (FAB + modal orchestration)
```js
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QuickCaptureModal from "./QuickCaptureModal";
import { useShellHeaderStore } from "../../store/shellHeaderStore";
import { SYNC_STATUS, useSyncStore } from "../../store/syncStore";
import SyncToast from "./SyncToast";
import AuthGate from "../auth/AuthGate";
import { useEditorSettingsStore } from "../../store/editorSettingsStore";
import { useDocumentsStore } from "../../store/documentsStore";
import { useTimerStore } from "../../store/timerStore";
import { getCaptureTemplate, createFromTemplate } from "../../lib/templates";
import { useServerSync } from "../../lib/sync/useServerSync";
import { signOut } from "../../lib/supabase/auth";
import styles from "./Shell.module.css";
import layout from "./AppShell.module.css";
import useVisualViewportInsets from "../../hooks/useVisualViewportInsets";

const routes = {
  "/": "Home",
  "/command": "Command",
  "/knowledge": "Knowledge",
  "/strategy": "Strategy",
};

function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={styles.icon}
    >
      <path
        d="M4 6h16M4 12h16M4 18h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={styles.icon}
    >
      <path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FocusModeIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={styles.icon}
    >
      <path
        d="M5 7h14M5 12h9M5 17h12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="17" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={styles.icon}
    >
      <path
        d="M7 5.5v13l11-6.5-11-6.5z"
        fill="currentColor"
      />
    </svg>
  );
}

function TextSizeIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={styles.icon}
    >
      <path
        d="M6 17l3-10h2l3 10M8 13h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M16 17l1.5-5h1.5l1.5 5M16.5 15h3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export default function Shell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const title = routes[pathname] ?? "";
  const overrideTitle = useShellHeaderStore((state) => state.title);
  const headerStatus = useShellHeaderStore((state) => state.status);
  const syncStatus = useSyncStore((state) => state.status);
  const syncPending = useSyncStore((state) => state.pendingCount);
  const headerTitle = overrideTitle ?? title;
  const statusBadge = useMemo(() => {
    if (headerStatus) return headerStatus;
    if (syncStatus === SYNC_STATUS.ERROR) return "Sync error";
    if (syncStatus === SYNC_STATUS.OFFLINE) return "Offline";
    if (syncStatus === SYNC_STATUS.SYNCING) {
      return syncPending > 0 ? `Syncing · ${syncPending}` : "Syncing";
    }
    if (syncPending > 0) return `Queued · ${syncPending}`;
    return "Synced";
  }, [headerStatus, syncPending, syncStatus]);
  const hydrateEditorSettings = useEditorSettingsStore((state) => state.hydrate);
  const focusMode = useEditorSettingsStore((state) => state.focusMode);
  const fontSize = useEditorSettingsStore((state) => state.fontSize);
  const toggleFocusMode = useEditorSettingsStore((state) => state.toggleFocusMode);
  const cycleFontSize = useEditorSettingsStore((state) => state.cycleFontSize);
  const createDocument = useDocumentsStore((state) => state.createDocument);
  const loadInboxCount = useDocumentsStore((state) => state.loadInboxCount);
  const incrementInboxVersion = useDocumentsStore((state) => state.incrementInboxVersion);
  const hydrateTimer = useTimerStore((state) => state.hydrate);
  const startTimerPolling = useTimerStore((state) => state.startPolling);
  const stopTimerPolling = useTimerStore((state) => state.stopPolling);
  const isHome = pathname === "/";
  const isNoteEditorRoute =
    typeof pathname === "string" &&
    pathname.startsWith("/knowledge/notes/") &&
    pathname !== "/knowledge/notes";
  const noteId = useMemo(() => {
    if (!isNoteEditorRoute || typeof pathname !== "string") return null;
    const parts = pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || null;
  }, [isNoteEditorRoute, pathname]);
  const focusHref = noteId
    ? `/focus?entityId=${noteId}&entityType=note`
    : "/focus";
  const isPublicRoute = pathname === "/login" || pathname === "/debug/env";
  useServerSync({ enabled: !isPublicRoute });

  // Determine back link based on current route
  const backHref = isNoteEditorRoute ? "/knowledge/notes" : "/";
  const [captureOpen, setCaptureOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [captureValue, setCaptureValue] = useState("");
  const [captureShouldFocus, setCaptureShouldFocus] = useState(false);
  const [rapidEnabled, setRapidEnabled] = useState(false);
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [dragOrigin, setDragOrigin] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [activeTarget, setActiveTarget] = useState(null);
  const longPressTimerRef = useRef(null);
  const dragPointerIdRef = useRef(null);
  const longPressTriggeredRef = useRef(false);
  const fabRef = useRef(null);
  const pointerStartRef = useRef({ x: 0, y: 0 });
  const shellRootRef = useRef(null);
  const contentScrollerRef = useRef(null);

  const targets = useMemo(
    () => [
      { id: "command", label: "Command", href: "/command", offset: [-96, 0] },
      { id: "knowledge", label: "Knowledge", href: "/knowledge", offset: [96, 0] },
      { id: "strategy", label: "Strategy", href: "/strategy", offset: [0, -96] },
    ],
    []
  );

  const menuLinks = useMemo(
    () => [
      { href: "/", label: "Home" },
      { href: "/command", label: "Command" },
      { href: "/inbox", label: "Inbox" },
      { href: "/logbook", label: "Logbook" },
      { href: "/focus", label: "Focus Timer" },
      { href: "/knowledge", label: "Knowledge" },
      { href: "/knowledge/notes", label: "Notes (v0)" },
      { href: "/strategy", label: "Strategy" },
      { href: "/settings", label: "Settings" },
    ],
    []
  );

  useEffect(() => {
    hydrateEditorSettings();
  }, [hydrateEditorSettings]);

  useEffect(() => {
    if (isPublicRoute) return undefined;
    hydrateTimer();
    startTimerPolling();
    return () => {
      stopTimerPolling();
    };
  }, [hydrateTimer, isPublicRoute, startTimerPolling, stopTimerPolling]);

  useVisualViewportInsets(shellRootRef, contentScrollerRef);

  useEffect(() => {
    if (!menuOpen) return;
    if (isPublicRoute) return;
    const handleKeydown = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [isPublicRoute, menuOpen]);

  const handleLogout = useCallback(
    async (event) => {
      event.preventDefault();
      try {
        await signOut();
      } catch (error) {
        console.error("Sign out failed", error);
      } finally {
        setMenuOpen(false);
        router.push("/login");
      }
    },
    [router]
  );

  useEffect(() => {
    if (!captureOpen) return;
    const previousOverflow = document.body.style.overflow;
    const previousPosition = document.body.style.position;
    const previousTop = document.body.style.top;
    const previousWidth = document.body.style.width;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousHtmlHeight = document.documentElement.style.height;
    const scrollY = window.scrollY;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.height = "100%";

    return () => {
      const offset = parseInt(document.body.style.top || "0", 10) * -1;
      document.body.style.overflow = previousOverflow;
      document.body.style.position = previousPosition;
      document.body.style.top = previousTop;
      document.body.style.width = previousWidth;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.documentElement.style.height = previousHtmlHeight;
      window.scrollTo(0, Number.isNaN(offset) ? scrollY : offset);
    };
  }, [captureOpen]);

  useEffect(() => {
    if (!dragActive) return;
    const previousTouchAction = document.body.style.touchAction;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.touchAction = "none";
    document.body.style.userSelect = "none";
    return () => {
      document.body.style.touchAction = previousTouchAction;
      document.body.style.userSelect = previousUserSelect;
    };
  }, [dragActive]);

  const touchEnabled =
    typeof window !== "undefined" &&
    (window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(hover: none)").matches);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const resetDragState = useCallback(() => {
    clearLongPressTimer();
    setDragActive(false);
    setActiveTarget(null);
    dragPointerIdRef.current = null;
  }, [clearLongPressTimer]);

  const handleOpenCapture = useCallback(() => {
    resetDragState();
    clearLongPressTimer();
    setCaptureShouldFocus(true);
    setCaptureOpen(true);
  }, [clearLongPressTimer, resetDragState]);

  useEffect(() => {
    if (isPublicRoute) return;
    const handleSearchShortcut = (event) => {
      const isK = event.key === "k" || event.key === "K";
      if (!isK || (!event.metaKey && !event.ctrlKey)) return;
      event.preventDefault();
      handleOpenCapture();
    };
    window.addEventListener("keydown", handleSearchShortcut);
    return () => window.removeEventListener("keydown", handleSearchShortcut);
  }, [handleOpenCapture, isPublicRoute]);

  const handleCloseCapture = () => {
    resetDragState();
    setCaptureOpen(false);
    setCaptureValue("");
    setCaptureShouldFocus(false);
  };

  const handleSaveCapture = async () => {
    const trimmed = captureValue.trim();
    const body = trimmed ? `${trimmed}\n\n` : "\n";
    const now = Date.now();

    // Use capture template for quick capture
    const captureTemplate = await getCaptureTemplate();
    if (captureTemplate) {
      await createFromTemplate(captureTemplate.id, { body, inboxAt: now });
      // Reload inbox count since createFromTemplate bypasses the store
      void loadInboxCount();
    } else {
      // Fallback if template not found - uses store which updates inbox count
      await createDocument({ body, title: null, inboxAt: now });
    }
    // Signal inbox list to reload
    incrementInboxVersion();

    if (rapidEnabled) {
      setCaptureValue("");
      setCaptureShouldFocus(true);
      return;
    }
    handleCloseCapture();
  };

  const handleCreateFromQuery = async (query) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const body = `${trimmed}\n\n`;
    const now = Date.now();

    // Use capture template - adds to inbox without navigation
    const captureTemplate = await getCaptureTemplate();
    if (captureTemplate) {
      await createFromTemplate(captureTemplate.id, { body, inboxAt: now });
      void loadInboxCount();
    } else {
      await createDocument({ body, title: null, inboxAt: now });
    }
    // Signal inbox list to reload
    incrementInboxVersion();

    if (rapidEnabled) {
      setCaptureValue("");
      setCaptureShouldFocus(true);
      return;
    }
    handleCloseCapture();
  };

  const handleBackdrop = (event) => {
    if (event.target !== event.currentTarget) return;
    if (captureValue.trim().length === 0) {
      handleCloseCapture();
    }
  };

  const activateDrag = () => {
    if (captureOpen) return;
    if (!fabRef.current) return;
    const rect = fabRef.current.getBoundingClientRect();
    const origin = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    setDragOrigin(origin);
    setDragPosition({ x: pointerStartRef.current.x, y: pointerStartRef.current.y });
    setDragActive(true);
    longPressTriggeredRef.current = true;
  };

  const handleFabPointerDown = (event) => {
    if (captureOpen) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    longPressTriggeredRef.current = false;
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    const rect = event.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
    dragPointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    longPressTimerRef.current = window.setTimeout(() => {
      activateDrag();
    }, 300);
  };

  const handleFabPointerMove = (event) => {
    if (!dragActive) {
      if (!longPressTimerRef.current) return;
      pointerStartRef.current = { x: event.clientX, y: event.clientY };
      const rect = event.currentTarget.getBoundingClientRect();
      setDragOffset({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
      return;
    }
    if (!dragActive) return;
    event.preventDefault();
    setDragPosition({ x: event.clientX, y: event.clientY });
    const hitTarget = targets.find((target) => {
      const [offsetX, offsetY] = target.offset;
      const centerX = dragOrigin.x + offsetX;
      const centerY = dragOrigin.y + offsetY;
      const distance = Math.hypot(event.clientX - centerX, event.clientY - centerY);
      return distance < 48;
    });
    setActiveTarget(hitTarget?.id ?? null);
  };

  const handleFabPointerUp = () => {
    if (dragActive && activeTarget) {
      const target = targets.find((item) => item.id === activeTarget);
      if (target) router.push(target.href);
    }
    resetDragState();
  };

  const handleFabPointerCancel = () => {
    resetDragState();
  };

  const handleFabClick = () => {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    clearLongPressTimer();
    handleOpenCapture();
  };

  const handleMenuToggle = () => {
    if (captureOpen) return;
    setMenuOpen((prev) => !prev);
  };

  const handleMenuBackdrop = (event) => {
    if (event.target !== event.currentTarget) return;
    setMenuOpen(false);
  };

  const handleMenuLinkClick = useCallback(
    (event, href) => {
      if (!href) return;
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return;

      const targetUrl = new URL(href, window.location.origin);
      const targetPath = `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;
      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (targetPath === currentPath) {
        setMenuOpen(false);
        return;
      }

      event.preventDefault();
      setMenuOpen(false);
      router.push(targetPath);

      window.setTimeout(() => {
        const nextPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        if (nextPath === currentPath) {
          window.location.assign(targetPath);
        }
      }, 300);
    },
    [router]
  );

  const handleTouchStart = (event) => {
    if (captureOpen) return;
    const touch = event.touches[0];
    if (!touch) return;
    longPressTriggeredRef.current = false;
    pointerStartRef.current = { x: touch.clientX, y: touch.clientY };
    const rect = event.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    });
    longPressTimerRef.current = window.setTimeout(() => {
      activateDrag();
    }, 300);
  };

  const handleTouchMove = (event) => {
    const touch = event.touches[0];
    if (!touch) return;
    if (!dragActive) {
      if (!longPressTimerRef.current) return;
      pointerStartRef.current = { x: touch.clientX, y: touch.clientY };
      const rect = event.currentTarget.getBoundingClientRect();
      setDragOffset({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      });
      return;
    }
    setDragPosition({ x: touch.clientX, y: touch.clientY });
    const hitTarget = targets.find((target) => {
      const [offsetX, offsetY] = target.offset;
      const centerX = dragOrigin.x + offsetX;
      const centerY = dragOrigin.y + offsetY;
      const distance = Math.hypot(touch.clientX - centerX, touch.clientY - centerY);
      return distance < 48;
    });
    setActiveTarget(hitTarget?.id ?? null);
  };

  const handleTouchEnd = () => {
    handleFabPointerUp();
  };

  const touchHandlers = touchEnabled
    ? {
        onTouchStart: handleTouchStart,
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd,
      }
    : {};

  const preventPointerFocus = (event) => {
    event.preventDefault();
  };

  return (
    <div className={layout.shell} data-shell-root ref={shellRootRef}>
      {isPublicRoute ? null : <SyncToast />}
      <AuthGate>
        <div className={layout.contentViewport} data-content-viewport>
          <main
            className={layout.contentScroller}
            data-content-scroller
            ref={contentScrollerRef}
          >
            {children}
          </main>
        </div>
      </AuthGate>
      {isPublicRoute ? null : (
      <>
      <div className={layout.overlayLayer} data-overlay-layer aria-hidden="false">
        <header className={`${layout.shellHeader} ${styles.header}`}>
          <div className={styles.headerLeft}>
            {isHome ? (
              <button
                type="button"
                className={styles.headerButton}
                aria-label="Open menu"
                aria-expanded={menuOpen}
                onClick={handleMenuToggle}
              >
                <MenuIcon />
              </button>
            ) : (
              <Link
                href={backHref}
                className={styles.headerButton}
                aria-label={isNoteEditorRoute ? "Back to notes" : "Back to home"}
              >
                <BackIcon />
              </Link>
            )}
            <div className={styles.headerTitle}>{headerTitle}</div>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.headerActionsTop}>
              {statusBadge ? (
                <div
                  className={`${styles.headerStatus} ${
                    syncStatus === SYNC_STATUS.ERROR ? styles.headerStatusError : ""
                  }`}
                >
                  {statusBadge}
                </div>
              ) : null}
              {isNoteEditorRoute ? (
                <button
                  type="button"
                  className={styles.headerButton}
                  aria-label={`Font size: ${fontSize}`}
                  onPointerDown={preventPointerFocus}
                  onClick={cycleFontSize}
                >
                  <TextSizeIcon />
                </button>
              ) : (
                <div className={styles.headerButton} aria-hidden="true" />
              )}
            </div>
            {isNoteEditorRoute ? (
              <div className={styles.headerActionsBottom}>
                <Link
                  href={focusHref}
                  className={styles.headerButton}
                  aria-label="Start timer in focus mode"
                >
                  <PlayIcon />
                </Link>
                <button
                  type="button"
                  className={`${styles.headerButton} ${
                    focusMode ? styles.headerButtonActive : ""
                  }`}
                  aria-label="Toggle focus mode"
                  aria-pressed={focusMode}
                  onPointerDown={preventPointerFocus}
                  onClick={toggleFocusMode}
                >
                  <FocusModeIcon />
                </button>
              </div>
            ) : null}
          </div>
        </header>
        <button
          type="button"
          className={`${layout.fab} ${styles.fab} ${
            dragActive ? styles.fabDragging : ""
          } ${captureOpen ? styles.fabHidden : ""}`}
          aria-label="Quick capture"
          ref={fabRef}
          onClick={handleFabClick}
          onContextMenu={(event) => event.preventDefault()}
          onPointerDown={handleFabPointerDown}
          onPointerMove={handleFabPointerMove}
          onPointerUp={handleFabPointerUp}
          onPointerCancel={handleFabPointerCancel}
          {...touchHandlers}
          disabled={captureOpen}
          style={
            dragActive
              ? {
                  left: `${dragPosition.x - dragOffset.x}px`,
                  top: `${dragPosition.y - dragOffset.y}px`,
                  transform: "none",
                }
              : undefined
          }
        >
          +
        </button>
      </div>
      {dragActive && !captureOpen ? (
        <div className={styles.targetsLayer} aria-hidden="true">
          {targets.map((target) => {
            const [offsetX, offsetY] = target.offset;
            return (
              <div
                key={target.id}
                className={`${styles.target} ${
                  activeTarget === target.id ? styles.targetActive : ""
                }`}
                style={{
                  left: `${dragOrigin.x + offsetX}px`,
                  top: `${dragOrigin.y + offsetY}px`,
                }}
              >
                {target.label}
              </div>
            );
          })}
        </div>
      ) : null}
      <QuickCaptureModal
        isOpen={captureOpen}
        value={captureValue}
        inputRef={inputRef}
        shouldFocus={captureShouldFocus}
        onFocused={() => setCaptureShouldFocus(false)}
        rapidEnabled={rapidEnabled}
        onToggleRapid={() => {
          setRapidEnabled((prev) => !prev);
          setCaptureShouldFocus(true);
        }}
        onChange={setCaptureValue}
        onSave={handleSaveCapture}
        onCreateFromQuery={handleCreateFromQuery}
        onCancel={handleCloseCapture}
        onBackdrop={handleBackdrop}
      />
      {menuOpen ? (
        <div className={styles.menuOverlay} onClick={handleMenuBackdrop}>
          <nav className={styles.menuPanel} aria-label="Primary">
            <div className={styles.menuTitle}>Navigate</div>
            <div className={styles.menuLinks}>
              {menuLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={styles.menuLink}
                  onClick={(event) => handleMenuLinkClick(event, link.href)}
                >
                  {link.label}
                </Link>
              ))}
              <button
                type="button"
                className={styles.menuLink}
                onClick={handleLogout}
              >
                Log out
              </button>
            </div>
          </nav>
        </div>
      ) : null}
      </>
      )}
    </div>
  );
}

```

## FAB + header styles
```css
.header {
  display: flex;
  /* align-items: center; */
  align-items: flex-start;
  justify-content: space-between;
  /* background: rgba(246, 242, 234, 0.88); */
  /* backdrop-filter: blur(10px); */
}

.headerLeft {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
  padding-right: 12px;
}

.headerTitle {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: #3b3227;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.headerActions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 6px;
  gap: 12px;
  min-width: 72px;
}

.headerStatus {
  font-size: 12px;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: #6a5f54;
  white-space: nowrap;
}

.headerStatusError {
  color: #b3261e;
}

.headerActionsTop {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  min-height: 36px;
}

.headerActionsBottom {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.headerButton {
  appearance: none;
  border: 1px solid rgba(20, 17, 15, 0.15);
  /* background: rgba(255, 255, 255, 0.7); */
  background: #14110f;
  /* color: #14110f; */
  color: #ffffff;
  flex: 0 0 36px;
  min-width: 36px;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.headerButtonActive {
  border-color: rgba(20, 17, 15, 0.4);
  background: #14110f;
  color: #f6f2ea;
}

.headerButton:focus-visible {
  outline: 2px solid #14110f;
  outline-offset: 2px;
}

.fab {
  width: 56px;
  height: 56px;
  border-radius: 20px;
  border: none;
  background: #14110f;
  color: #f6f2ea;
  font-size: 22px;
  font-weight: 600;
  box-shadow: 0 12px 24px rgba(20, 17, 15, 0.28);
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

.fab:disabled {
  opacity: 0.6;
}

.fabHidden {
  opacity: 0;
  pointer-events: none;
}

.fab:focus-visible {
  outline: 2px solid #f6f2ea;
  outline-offset: 2px;
}

.fabDragging {
  position: fixed;
  z-index: 30;
  transform: none;
}

.icon {
  width: 18px;
  height: 18px;
  display: block;
}

.targetsLayer {
  position: fixed;
  inset: 0;
  z-index: 21;
  pointer-events: none;
}

.target {
  position: absolute;
  transform: translate(-50%, -50%);
  padding: 12px 16px;
  border-radius: 999px;
  background: rgba(20, 17, 15, 0.9);
  color: #f6f2ea;
  font-size: 13px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border: 1px solid transparent;
  box-shadow: 0 12px 24px rgba(15, 12, 10, 0.28);
}

.targetActive {
  background: #f6f2ea;
  color: #14110f;
  border-color: rgba(20, 17, 15, 0.25);
}

.menuOverlay {
  position: fixed;
  inset: 0;
  z-index: 25;
  background: rgba(20, 17, 15, 0.2);
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding: calc(16px + env(safe-area-inset-top)) 16px 16px;
}

.menuPanel {
  width: min(260px, 80vw);
  background: #fcfbf8;
  border-radius: 18px;
  border: 1px solid rgba(20, 17, 15, 0.15);
  box-shadow: 0 16px 32px rgba(20, 17, 15, 0.2);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.menuTitle {
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #6a5f54;
  font-weight: 600;
}

.menuLinks {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.menuLink {
  display: block;
  padding: 10px 12px;
  border-radius: 12px;
  text-decoration: none;
  color: #14110f;
  font-size: 15px;
  font-weight: 600;
  background: rgba(20, 17, 15, 0.05);
}

.menuLink:hover {
  background: rgba(20, 17, 15, 0.12);
}

@media (min-width: 900px) {
}

```

## Shell layout styles
```css
.shell {
  height: 100vh;
  height: 100dvh;
  display: block;
  position: relative;
  overflow: hidden;
}

.contentViewport {
  height: 100%;
  position: relative;
}

.contentScroller {
  height: 100%;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
  padding-top: calc(var(--shell-header-h) + env(safe-area-inset-top));
  padding-bottom: calc(var(--shell-fab-safe) + var(--shell-keyboard-inset) + env(safe-area-inset-bottom));
}

.overlayLayer {
  position: absolute;
  inset: 0;
  z-index: 20;
  pointer-events: none;
}

.overlayLayer * {
  pointer-events: auto;
}

.shellHeader {
  position: absolute;
  top: var(--vv-offset-top, 0);
  left: 0;
  right: 0;
  height: calc(var(--shell-header-h) + env(safe-area-inset-top));
  padding: calc(12px + env(safe-area-inset-top)) 16px 12px;
  pointer-events: auto;
}

.fab {
  position: absolute;
  left: 50%;
  bottom: calc(var(--shell-fab-y) + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  pointer-events: auto;
  touch-action: manipulation;
}

@media (min-width: 900px) {
  .shellHeader {
    padding-left: 32px;
    padding-right: 32px;
  }
}

```

## Quick Capture modal (UI + behavior)
```js
"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDocumentsStore } from "../../store/documentsStore";
import { getDocumentsRepo } from "../../lib/repo/getDocumentsRepo";
import { ensureSearchIndex, searchDocuments } from "../../lib/search/searchDocuments";
import styles from "./QuickCaptureModal.module.css";

const SEARCH_DEBOUNCE_MS = 60;
const RESULTS_LIMIT = 12;
const RECENTS_LIMIT = 9;

export default function QuickCaptureModal({
  isOpen,
  value,
  inputRef,
  shouldFocus,
  onFocused,
  rapidEnabled,
  onToggleRapid,
  onChange,
  onSave,
  onCreateFromQuery,
  onCancel,
  onBackdrop,
}) {
  const router = useRouter();
  const documents = useDocumentsStore((state) => state.documents);
  const hydrate = useDocumentsStore((state) => state.hydrate);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [includeTrashed, setIncludeTrashed] = useState(false);
  const [showSnippets, setShowSnippets] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchDebounceRef = useRef(null);
  const listRef = useRef(null);

  useLayoutEffect(() => {
    if (!isOpen || !inputRef?.current || !shouldFocus) return;
    const focusInput = () => {
      if (!inputRef.current) return;
      inputRef.current.focus();
      if (document.activeElement !== inputRef.current) {
        setTimeout(() => {
          if (!inputRef.current) return;
          inputRef.current.focus();
          if (document.activeElement === inputRef.current) {
            onFocused?.();
          }
        }, 0);
        return;
      }
      onFocused?.();
    };
    focusInput();
  }, [isOpen, inputRef, shouldFocus, onFocused]);

  useEffect(() => {
    if (!isOpen) return;
    void hydrate();
  }, [hydrate, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSearchResults([]);
      setIsSearching(false);
      setIncludeArchived(false);
      setIncludeTrashed(false);
      setShowSnippets(false);
      setSelectionMode(false);
      setSelectedIndex(0);
      return;
    }
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    const trimmedQuery = value.trim();
    if (trimmedQuery.length === 0) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const repo = getDocumentsRepo();
        const docs = await repo.getSearchableDocs({
          includeTrashed: true,
          includeArchived: true,
        });
        ensureSearchIndex(docs);
        const results = searchDocuments(trimmedQuery, RESULTS_LIMIT);
        const docsById = new Map(docs.map((doc) => [doc.id, doc]));
        const withStatus = results.map((result) => {
          const match = docsById.get(result.id);
          return {
            ...result,
            type: match?.type ?? null,
            deletedAt: match?.deletedAt ?? null,
            archivedAt: match?.archivedAt ?? null,
            inboxAt: match?.inboxAt ?? null,
          };
        });
        setSearchResults(withStatus);
      } catch (error) {
        console.error("Quick capture search failed:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [isOpen, value]);

  const trimmedValue = value.trim();
  const isSearchMode = trimmedValue.length > 0;
  const displayRecents = useMemo(() => {
    // Filter out inbox items (inboxAt != null) and optionally archived
    // Also exclude items just processed from inbox (no edits since processing)
    const filtered = documents.filter(
      (doc) =>
        doc.inboxAt == null &&
        !(doc.processedFromInboxAt && doc.processedFromInboxAt === doc.updatedAt) &&
        (includeArchived || doc.archivedAt == null)
    );
    return filtered.slice(0, RECENTS_LIMIT);
  }, [includeArchived, documents]);
  const visibleSearchResults = useMemo(() => {
    // Exclude type=inbox unless trashed, and optionally include trashed/archived
    const filtered = searchResults.filter((result) => {
      // Exclude non-trashed inbox items
      if (result.type === "inbox" && result.deletedAt == null) {
        return false;
      }
      // Filter trashed items unless includeTrashed is enabled
      if (result.deletedAt != null && !includeTrashed) {
        return false;
      }
      // Filter archived items unless includeArchived is enabled
      if (result.archivedAt != null && !includeArchived) {
        return false;
      }
      return true;
    });
    return filtered.slice(0, RESULTS_LIMIT);
  }, [includeArchived, includeTrashed, searchResults]);
  const displayList = isSearchMode ? visibleSearchResults : displayRecents;

  const trashedMatchCount = useMemo(
    () => searchResults.filter((result) => result.deletedAt != null).length,
    [searchResults]
  );
  const archivedMatchCount = useMemo(
    () =>
      searchResults.filter(
        (result) =>
          result.deletedAt == null &&
          result.archivedAt != null &&
          result.type !== "inbox"
      ).length,
    [searchResults]
  );
  const shouldShowArchiveToggle =
    isSearchMode && (archivedMatchCount > 0 || includeArchived);
  const shouldShowTrashToggle =
    isSearchMode && (trashedMatchCount > 0 || includeTrashed);

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (selectionMode) {
        const selected = displayList[selectedIndex];
        if (selected) {
          handleOpenNote(selected.id);
        }
        return;
      }
      if (isSearchMode) {
        const bestMatch = visibleSearchResults[0];
        if (bestMatch?.matchMeta?.tier === 0) {
          handleOpenNote(bestMatch.id);
          return;
        }
        if (trimmedValue.length > 0) {
          onCreateFromQuery?.(trimmedValue);
        }
        return;
      }
      onSave();
    }
    if (event.key === "Tab" && displayList.length > 0) {
      event.preventDefault();
      setSelectionMode(true);
      setSelectedIndex(0);
      requestAnimationFrame(() => {
        listRef.current?.focus();
      });
    }
    if (event.key === "Escape") {
      event.preventDefault();
      if (selectionMode) {
        setSelectionMode(false);
        inputRef?.current?.focus();
        return;
      }
      if (trimmedValue.length > 0) {
        onChange("");
        return;
      }
      onCancel();
    }
  };

  const handleOpenNote = useCallback(
    (id) => {
      if (!id) return;
      router.push(`/knowledge/notes/${id}`);
      onCancel?.();
    },
    [router, onCancel]
  );

  const handleListKeyDown = (event) => {
    if (!selectionMode) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((prev) =>
        displayList.length === 0 ? 0 : (prev + 1) % displayList.length
      );
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((prev) =>
        displayList.length === 0
          ? 0
          : (prev - 1 + displayList.length) % displayList.length
      );
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const selected = displayList[selectedIndex];
      if (selected) {
        handleOpenNote(selected.id);
      }
    }
    if (event.key === "Escape" || (event.key === "Tab" && event.ctrlKey)) {
      event.preventDefault();
      setSelectionMode(false);
      inputRef?.current?.focus();
    }
  };

  useEffect(() => {
    if (!selectionMode) return;
    if (displayList.length === 0) {
      setSelectionMode(false);
      setSelectedIndex(0);
      return;
    }
    if (selectedIndex > displayList.length - 1) {
      setSelectedIndex(0);
    }
  }, [displayList.length, selectedIndex, selectionMode]);

  const helperText = "";

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onPointerDown={onBackdrop}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Quick capture"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <textarea
            ref={inputRef}
            className={styles.input}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Capture..."
            autoFocus
          />
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.toggle}
              aria-pressed={rapidEnabled}
              onClick={onToggleRapid}
              onMouseDown={(event) => event.preventDefault()}
              onTouchStart={(event) => event.preventDefault()}
            >
              <span
                className={`${styles.toggleTrack} ${
                  rapidEnabled ? styles.toggleTrackActive : ""
                }`}
                aria-hidden="true"
              >
                <span
                  className={`${styles.toggleThumb} ${
                    rapidEnabled ? styles.toggleThumbActive : ""
                  }`}
                />
              </span>
              <span className={styles.toggleText}>Rapid capture</span>
            </button>
            <div className={styles.actionButtons}>
              <button type="button" className={styles.button} onClick={onCancel}>
                Cancel
              </button>
              <button
                type="button"
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={onSave}
              >
                Save
              </button>
            </div>
          </div>
        </div>
        <div className={styles.results}>
          <div className={styles.resultsHeader}>
            <div className={styles.sectionTitle}>
              {isSearchMode ? "Results" : "Recently edited"}
            </div>
            <div className={styles.resultsHeaderActions}>
              {isSearchMode ? (
                <button
                  type="button"
                  className={styles.snippetToggle}
                  aria-pressed={showSnippets}
                  onClick={() => setShowSnippets((prev) => !prev)}
                >
                  {showSnippets ? "Hide snippets" : "Show snippets"}
                </button>
              ) : null}
              {helperText ? <div className={styles.helper}>{helperText}</div> : null}
            </div>
          </div>
          {shouldShowArchiveToggle ? (
            <div className={styles.matchLine}>
              Archived matches: {archivedMatchCount}{" "}
              <button
                type="button"
                className={styles.matchToggle}
                onClick={() => setIncludeArchived((prev) => !prev)}
              >
                {includeArchived ? "Hide" : "Show"}
              </button>
            </div>
          ) : null}
          {shouldShowTrashToggle ? (
            <div className={styles.matchLine}>
              Trashed matches: {trashedMatchCount}{" "}
              <button
                type="button"
                className={styles.matchToggle}
                onClick={() => setIncludeTrashed((prev) => !prev)}
              >
                {includeTrashed ? "Hide" : "Show"}
              </button>
            </div>
          ) : null}
          {displayList.length === 0 ? (
            <div className={styles.emptyState}>
              {isSearchMode
                ? isSearching
                  ? "Searching..."
                  : `No matches. Press Enter to create: ${trimmedValue}`
                : "No recent notes yet"}
            </div>
          ) : (
            <ul
              className={styles.list}
              role="listbox"
              aria-label="Quick capture results"
              aria-activedescendant={
                selectionMode && displayList[selectedIndex]
                  ? `quick-capture-option-${displayList[selectedIndex].id}`
                  : undefined
              }
              tabIndex={selectionMode ? 0 : -1}
              ref={listRef}
              onKeyDown={handleListKeyDown}
              onBlur={() => setSelectionMode(false)}
            >
              {displayList.map((item, index) => {
                const isSelected = selectionMode && index === selectedIndex;
                return (
                  <li key={item.id} className={styles.listItem}>
                    <button
                      type="button"
                      id={`quick-capture-option-${item.id}`}
                      role="option"
                      aria-selected={isSelected}
                      className={`${styles.listButton} ${
                        isSelected ? styles.listButtonSelected : ""
                      }`}
                    tabIndex={-1}
                    onClick={() => handleOpenNote(item.id)}
                  >
                      <span className={styles.listButtonContent}>
                        <span className={styles.listButtonTitle}>
                          {item.title || "Untitled"}
                        </span>
                        {showSnippets && isSearchMode && item.snippet ? (
                          <span className={styles.listButtonSnippet}>
                            {item.snippet}
                          </span>
                        ) : null}
                      </span>
                      {item.deletedAt != null ? (
                        <span className={styles.trashBadge} aria-label="Trashed">
                          T
                        </span>
                      ) : item.archivedAt != null ? (
                        <span className={styles.archiveBadge} aria-label="Archived">
                          A
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

```

## Quick Capture modal styles
```css
.backdrop {
  position: fixed;
  inset: 0;
  background: #f6f2ea;
  display: block;
  padding: 0;
  z-index: 40;
}

.modal {
  width: 100%;
  height: 100vh;
  height: 100dvh;
  background: #f6f2ea;
  border-radius: 0;
  border: none;
  padding: calc(20px + env(safe-area-inset-top)) 16px
    calc(20px + env(safe-area-inset-bottom));
  box-shadow: none;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.label {
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #5a4e41;
}

.header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input {
  width: 100%;
  min-height: 3.2em;
  line-height: 1.6;
  resize: vertical;
  border-radius: 16px;
  border: 1px solid rgba(20, 17, 15, 0.12);
  background: #ffffff;
  padding: 12px 14px;
  font-size: 16px;
  color: #14110f;
}

.input:focus {
  outline: 2px solid #14110f;
  outline-offset: 2px;
}

.results {
  flex: 1;
  border-radius: 18px;
  border: 1px dashed rgba(20, 17, 15, 0.12);
  background: #fcfbf8;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: auto;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px 16px;
  align-items: center;
}

.button {
  border-radius: 999px;
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid rgba(20, 17, 15, 0.2);
  background: transparent;
  color: #14110f;
}

.buttonPrimary {
  background: #14110f;
  color: #f6f2ea;
  border-color: transparent;
}

.buttonDisabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.resultsHeader {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
}

.resultsHeaderActions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.sectionTitle {
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #5a4e41;
}

.helper {
  font-size: 12px;
  color: #7b6f61;
}

.matchLine {
  font-size: 13px;
  color: #5a4e41;
}

.matchToggle {
  border: none;
  background: none;
  color: #14110f;
  text-decoration: underline;
  padding: 0;
  font-size: 13px;
  cursor: pointer;
}

.matchToggle:focus-visible {
  outline: 2px solid #14110f;
  outline-offset: 2px;
}

.snippetToggle {
  border: none;
  background: none;
  color: #14110f;
  text-decoration: underline;
  padding: 0;
  font-size: 12px;
  cursor: pointer;
}

.snippetToggle:focus-visible {
  outline: 2px solid #14110f;
  outline-offset: 2px;
}

.emptyState {
  font-size: 14px;
  color: #7b6f61;
  padding: 8px;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.listItem {
  margin: 0;
  padding: 0;
}

.listButton {
  width: 100%;
  text-align: left;
  border-radius: 12px;
  border: 1px solid transparent;
  background: #ffffff;
  color: #14110f;
  padding: 10px 12px;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: -0.01em;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.listButton:hover {
  border-color: rgba(20, 17, 15, 0.2);
}

.listButtonSelected {
  border-color: #14110f;
  background: #f6f2ea;
}

.listButton:focus-visible {
  outline: 2px solid #14110f;
  outline-offset: 2px;
}

.listButtonTitle {
  font-weight: 600;
}

.listButtonContent {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.listButtonSnippet {
  font-size: 12px;
  font-weight: 400;
  color: #5a4e41;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.archiveBadge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 6px;
  border: 1px solid rgba(20, 17, 15, 0.25);
  color: #5a4e41;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.trashBadge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 6px;
  border: 1px solid rgba(20, 17, 15, 0.25);
  color: #5a4e41;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.toggle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  letter-spacing: 0.02em;
  color: #5a4e41;
  border: none;
  background: transparent;
  padding: 0;
}

.toggle:focus-visible {
  outline: 2px solid #14110f;
  outline-offset: 2px;
}

.toggleTrack {
  width: 42px;
  height: 24px;
  border-radius: 999px;
  background: rgba(20, 17, 15, 0.12);
  display: inline-flex;
  align-items: center;
  padding: 2px;
  transition: background 0.2s ease;
}

.toggleTrackActive {
  background: #14110f;
}

.toggleThumb {
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: #ffffff;
  box-shadow: 0 2px 6px rgba(15, 12, 10, 0.2);
  transform: translateX(0);
  transition: transform 0.2s ease;
}

.toggleThumbActive {
  transform: translateX(18px);
}

.toggleText {
  text-transform: uppercase;
}

.actionButtons {
  display: inline-flex;
  gap: 10px;
  align-items: center;
}

@media (min-width: 700px) {
  .modal {
    padding-left: 32px;
    padding-right: 32px;
  }
}

```

## Global CSS variables
```css
:root {
  --background: #ffffff;
  --foreground: #171717;
  --shell-header-h: 56px;
  --shell-fab-safe: 96px;
  --shell-fab-x: 16px;
  --shell-fab-y: 16px;
  --shell-keyboard-inset: 0px;
}

@media (prefers-color-scheme: dark) {
  :root {
    /* --background: #0a0a0a; */
    --background: #f6f2eb;
    --foreground: #ededed;
  }
}

html,
body {
  max-width: 100vw;
  height: 100%;
  overflow: hidden;
}

body {
  color: var(--foreground);
  background: var(--background);
  font-family: var(--font-atten), ui-sans-serif, system-ui, -apple-system,
    "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

a {
  color: inherit;
  text-decoration: none;
}

@media (prefers-color-scheme: dark) {
  html {
    color-scheme: dark;
  }
}

```

## Visual viewport insets helper
```js
"use client";

import { useEffect, useRef } from "react";

const clampInset = (value) => Math.min(500, Math.max(0, value));

export default function useVisualViewportInsets(shellRootRef, scrollerRef) {
  const lastInsetRef = useRef(0);

  useEffect(() => {
    const shellRoot = shellRootRef?.current ?? document.documentElement;
    if (!shellRoot) return;

    const updateInsets = () => {
      const layoutHeight = window.innerHeight;
      const visualViewport = window.visualViewport;
      const visualHeight = visualViewport?.height ?? layoutHeight;
      const keyboardInset = clampInset(layoutHeight - visualHeight);
      const offsetTop = visualViewport?.offsetTop ?? 0;
      shellRoot.style.setProperty("--vvh", `${visualHeight}px`);
      shellRoot.style.setProperty("--shell-keyboard-inset", `${keyboardInset}px`);
      shellRoot.style.setProperty("--vv-offset-top", `${offsetTop}px`);

      const insetDelta = keyboardInset - lastInsetRef.current;
      if (insetDelta > 40 && scrollerRef?.current) {
        const active = document.activeElement;
        const scroller = scrollerRef.current;
        if (active && scroller.contains(active)) {
          const rect = active.getBoundingClientRect();
          const headerHeight =
            parseFloat(getComputedStyle(shellRoot).getPropertyValue("--shell-header-h")) || 0;
          const visibleTop = headerHeight + 8;
          const visibleBottom = visualHeight - 8;
          let delta = 0;
          if (rect.top < visibleTop) {
            delta = rect.top - visibleTop;
          } else if (rect.bottom > visibleBottom) {
            delta = rect.bottom - visibleBottom;
          }
          if (delta !== 0) {
            scroller.scrollBy({ top: delta, behavior: "smooth" });
          }
        }
      }

      lastInsetRef.current = keyboardInset;
    };

    updateInsets();

    const viewport = window.visualViewport;
    viewport?.addEventListener("resize", updateInsets);
    viewport?.addEventListener("scroll", updateInsets);
    window.addEventListener("resize", updateInsets);

    return () => {
      viewport?.removeEventListener("resize", updateInsets);
      viewport?.removeEventListener("scroll", updateInsets);
      window.removeEventListener("resize", updateInsets);
    };
  }, [shellRootRef, scrollerRef]);

  useEffect(() => {
    const scroller = scrollerRef?.current;
    if (!scroller) return;

    const handleFocusIn = (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      requestAnimationFrame(() => {
        const rect = target.getBoundingClientRect();
        const visualHeight = window.visualViewport?.height ?? window.innerHeight;
        const headerHeight =
          parseFloat(
            getComputedStyle(document.documentElement).getPropertyValue("--shell-header-h")
          ) || 0;
        const visibleTop = headerHeight + 8;
        const visibleBottom = visualHeight - 8;
        let delta = 0;
        if (rect.top < visibleTop) {
          delta = rect.top - visibleTop;
        } else if (rect.bottom > visibleBottom) {
          delta = rect.bottom - visibleBottom;
        }
        if (delta !== 0) {
          scroller.scrollBy({ top: delta, behavior: "smooth" });
        }
      });
    };

    scroller.addEventListener("focusin", handleFocusIn);
    return () => {
      scroller.removeEventListener("focusin", handleFocusIn);
    };
  }, [scrollerRef]);
}

```

---

# Search Index Implementation (copy-ready)

## normalize.js
```js
/**
 * Normalize a search query for matching.
 * - Lowercase
 * - Trim whitespace
 * - Collapse multiple whitespace to single space
 *
 * @param {string} query
 * @returns {string}
 */
export function normalizeQuery(query) {
  if (typeof query !== "string") return "";
  return query.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Normalize text for search matching.
 * @param {string} text
 * @returns {string}
 */
export function normalizeText(text) {
  if (typeof text !== "string") return "";
  return text.toLowerCase().replace(/\s+/g, " ");
}

const NON_WORD_BOUNDARY_REGEX = /[^a-z0-9\s]/gi;

/**
 * Normalize text for search indexing and matching.
 * - Lowercase
 * - Trim whitespace
 * - Strip punctuation boundaries
 * - Collapse whitespace
 *
 * @param {string} text
 * @returns {string}
 */
export function normalizeForSearch(text) {
  if (typeof text !== "string") return "";
  return text
    .toLowerCase()
    .trim()
    .replace(NON_WORD_BOUNDARY_REGEX, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Tokenize text for search matching.
 *
 * @param {string} text
 * @returns {Array<string>}
 */
export function tokenizeForSearch(text) {
  const normalized = normalizeForSearch(text);
  if (!normalized) return [];
  return normalized.split(" ").filter(Boolean);
}

```

## searchDocuments.js
```js
import { normalizeForSearch, tokenizeForSearch } from "./normalize";

const DEFAULT_LIMIT = 12;
const SNIPPET_LENGTH = 120;
const SNIPPET_LEADING = 40;
const SNIPPET_TRAILING = 60;

const FIELD_WEIGHT = {
  title: 30,
  slug: 20,
  body: 10,
};

const indexState = {
  entries: [],
  indexById: new Map(),
  ready: false,
};

function rebuildIndexMap(entries) {
  const next = new Map();
  entries.forEach((entry, index) => {
    next.set(entry.id, index);
  });
  return next;
}

function buildIndexEntry(doc) {
  const title = doc.title || "Untitled";
  const slug = doc.slug || null;
  const body = doc.body || "";
  const normalizedTitle = normalizeForSearch(title);
  const normalizedSlug = normalizeForSearch(slug || "");
  const normalizedBody = normalizeForSearch(body);
  const titleTokens = tokenizeForSearch(normalizedTitle);
  const slugTokens = tokenizeForSearch(normalizedSlug);
  const bodyTokens = tokenizeForSearch(normalizedBody);

  return {
    id: doc.id,
    slug,
    title,
    body,
    createdAt: doc.createdAt ?? 0,
    updatedAt: doc.updatedAt ?? 0,
    normalizedTitle,
    normalizedSlug,
    normalizedBody,
    titleTokens,
    slugTokens,
    bodyTokens,
    titleTokenSet: new Set(titleTokens),
    slugTokenSet: new Set(slugTokens),
    bodyTokenSet: new Set(bodyTokens),
  };
}

export function buildSearchIndex(docs = []) {
  const entries = Array.isArray(docs) ? docs.map(buildIndexEntry) : [];
  indexState.entries = entries;
  indexState.indexById = rebuildIndexMap(entries);
  indexState.ready = true;
}

export function ensureSearchIndex(docs = []) {
  if (indexState.ready) return;
  buildSearchIndex(docs);
}

export function updateSearchIndex(doc) {
  if (!doc || typeof doc.id !== "string") return;
  const entry = buildIndexEntry(doc);
  const existingIndex = indexState.indexById.get(entry.id);
  if (existingIndex == null) {
    indexState.entries = indexState.entries.concat(entry);
  } else {
    const next = indexState.entries.slice();
    next[existingIndex] = entry;
    indexState.entries = next;
  }
  indexState.indexById = rebuildIndexMap(indexState.entries);
  indexState.ready = true;
}

export function removeFromSearchIndex(id) {
  if (typeof id !== "string") return;
  const index = indexState.indexById.get(id);
  if (index == null) return;
  const next = indexState.entries.slice();
  next.splice(index, 1);
  indexState.entries = next;
  indexState.indexById = rebuildIndexMap(next);
}

export function clearSearchIndex() {
  indexState.entries = [];
  indexState.indexById = new Map();
  indexState.ready = false;
}

function normalizeWithMap(text) {
  const chars = [];
  const indexMap = [];
  let lastWasSpace = true;
  for (let i = 0; i < text.length; i += 1) {
    const lower = text[i].toLowerCase();
    if (/[a-z0-9]/.test(lower)) {
      chars.push(lower);
      indexMap.push(i);
      lastWasSpace = false;
    } else if (!lastWasSpace) {
      chars.push(" ");
      indexMap.push(i);
      lastWasSpace = true;
    }
  }
  while (chars[0] === " ") {
    chars.shift();
    indexMap.shift();
  }
  while (chars[chars.length - 1] === " ") {
    chars.pop();
    indexMap.pop();
  }
  return {
    normalized: chars.join(""),
    map: indexMap,
  };
}

function limitSnippet(text) {
  if (text.length <= SNIPPET_LENGTH) return text;
  return `${text.slice(0, SNIPPET_LENGTH).trimEnd()}...`;
}

function getFirstNonEmptyLine(body) {
  if (!body) return "";
  const lines = body.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed) return limitSnippet(trimmed);
  }
  return "";
}

function getBodySnippet(body, matchText) {
  if (!body) return "";
  const { normalized, map } = normalizeWithMap(body);
  if (!normalized) return "";
  const matchIndex = normalized.indexOf(matchText);
  if (matchIndex === -1) {
    return getFirstNonEmptyLine(body);
  }
  const startIndex = Math.max(0, matchIndex - SNIPPET_LEADING);
  const endIndex = Math.min(
    normalized.length,
    matchIndex + matchText.length + SNIPPET_TRAILING
  );
  const originalStart = map[startIndex] ?? 0;
  const originalEnd = map[endIndex - 1] != null ? map[endIndex - 1] + 1 : body.length;
  let snippet = body.slice(originalStart, originalEnd).replace(/[\r\n]+/g, " ").trim();
  if (originalStart > 0) snippet = `...${snippet}`;
  if (originalEnd < body.length) snippet = `${snippet}...`;
  return limitSnippet(snippet);
}

function getMatchedRanges(text, matchText) {
  if (!text || !matchText) return null;
  const { normalized, map } = normalizeWithMap(text);
  const matchIndex = normalized.indexOf(matchText);
  if (matchIndex === -1) return null;
  const start = map[matchIndex];
  const endIndex = matchIndex + matchText.length - 1;
  const end = map[endIndex] != null ? map[endIndex] + 1 : start + matchText.length;
  if (start == null || end == null) return null;
  return [{ start, end }];
}

function getMatchScore(base, field, matchIndex = 0, matchedTokens = 0) {
  const positionBoost = Math.max(0, 30 - matchIndex);
  return base + FIELD_WEIGHT[field] + matchedTokens * 5 + positionBoost;
}

function getExactTokenMatch(queryTokens, tokenSet, normalizedField) {
  let matchedCount = 0;
  let earliestIndex = Number.POSITIVE_INFINITY;
  let matchToken = "";
  for (const token of queryTokens) {
    if (!tokenSet.has(token)) continue;
    matchedCount += 1;
    const index = normalizedField.indexOf(token);
    if (index !== -1 && index < earliestIndex) {
      earliestIndex = index;
      matchToken = token;
    }
  }
  if (matchedCount === 0) return null;
  return {
    matchedCount,
    matchIndex: Number.isFinite(earliestIndex) ? earliestIndex : 0,
    matchToken,
  };
}

function getPartialTokenMatch(queryTokens, fieldTokens, normalizedField) {
  let matchedCount = 0;
  let earliestIndex = Number.POSITIVE_INFINITY;
  let matchToken = "";
  for (const queryToken of queryTokens) {
    if (!queryToken) continue;
    for (const token of fieldTokens) {
      if (!token.includes(queryToken)) continue;
      matchedCount += 1;
      const index = normalizedField.indexOf(token);
      if (index !== -1 && index < earliestIndex) {
        earliestIndex = index;
        matchToken = token;
      }
      break;
    }
  }
  if (matchedCount === 0) return null;
  return {
    matchedCount,
    matchIndex: Number.isFinite(earliestIndex) ? earliestIndex : 0,
    matchToken,
  };
}

function getMaxDistance(token) {
  const length = token.length;
  if (length >= 3 && length <= 5) return 1;
  if (length >= 6 && length <= 10) return 2;
  if (length > 10) return 2;
  return 0;
}

function boundedEditDistance(a, b, maxDistance) {
  if (Math.abs(a.length - b.length) > maxDistance) return maxDistance + 1;
  const prev = new Array(b.length + 1).fill(0);
  const next = new Array(b.length + 1).fill(0);
  for (let j = 0; j <= b.length; j += 1) {
    prev[j] = j;
  }
  for (let i = 1; i <= a.length; i += 1) {
    next[0] = i;
    let rowMin = next[0];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      next[j] = Math.min(
        prev[j] + 1,
        next[j - 1] + 1,
        prev[j - 1] + cost
      );
      rowMin = Math.min(rowMin, next[j]);
    }
    if (rowMin > maxDistance) return maxDistance + 1;
    for (let j = 0; j <= b.length; j += 1) {
      prev[j] = next[j];
    }
  }
  return prev[b.length];
}

function getFuzzyMatch(queryTokens, fieldTokens, normalizedField) {
  let matchedCount = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  let matchToken = "";
  let matchIndex = Number.POSITIVE_INFINITY;
  for (const queryToken of queryTokens) {
    const maxDistance = getMaxDistance(queryToken);
    if (maxDistance === 0) continue;
    let tokenMatched = false;
    for (const token of fieldTokens) {
      const distance = boundedEditDistance(queryToken, token, maxDistance);
      if (distance > maxDistance) continue;
      tokenMatched = true;
      if (distance < bestDistance) {
        bestDistance = distance;
        matchToken = token;
        matchIndex = normalizedField.indexOf(token);
      }
    }
    if (tokenMatched) matchedCount += 1;
  }
  if (matchedCount === 0) return null;
  return {
    matchedCount,
    bestDistance,
    matchToken,
    matchIndex: Number.isFinite(matchIndex) ? matchIndex : 0,
  };
}

function evaluateMatch(entry, normalizedQuery, queryTokens) {
  if (entry.normalizedSlug && entry.normalizedSlug === normalizedQuery) {
    return {
      tier: 0,
      field: "slug",
      score: getMatchScore(1000, "slug"),
      matchText: normalizedQuery,
    };
  }

  if (entry.normalizedTitle === normalizedQuery) {
    return {
      tier: 0,
      field: "title",
      score: getMatchScore(900, "title"),
      matchText: normalizedQuery,
    };
  }

  if (entry.normalizedSlug && entry.normalizedSlug.startsWith(normalizedQuery)) {
    return {
      tier: 1,
      field: "slug",
      score: getMatchScore(800, "slug", 0, queryTokens.length),
      matchText: normalizedQuery,
    };
  }

  if (entry.normalizedTitle.startsWith(normalizedQuery)) {
    return {
      tier: 1,
      field: "title",
      score: getMatchScore(780, "title", 0, queryTokens.length),
      matchText: normalizedQuery,
    };
  }

  const titleExact = getExactTokenMatch(
    queryTokens,
    entry.titleTokenSet,
    entry.normalizedTitle
  );
  if (titleExact) {
    return {
      tier: 2,
      field: "title",
      score: getMatchScore(720, "title", titleExact.matchIndex, titleExact.matchedCount),
      matchText: titleExact.matchToken || normalizedQuery,
    };
  }

  const slugExact = getExactTokenMatch(
    queryTokens,
    entry.slugTokenSet,
    entry.normalizedSlug
  );
  if (slugExact) {
    return {
      tier: 2,
      field: "slug",
      score: getMatchScore(700, "slug", slugExact.matchIndex, slugExact.matchedCount),
      matchText: slugExact.matchToken || normalizedQuery,
    };
  }

  if (entry.normalizedTitle.includes(normalizedQuery)) {
    const index = entry.normalizedTitle.indexOf(normalizedQuery);
    return {
      tier: 2,
      field: "title",
      score: getMatchScore(680, "title", index, queryTokens.length),
      matchText: normalizedQuery,
    };
  }

  if (entry.normalizedBody.includes(normalizedQuery)) {
    const index = entry.normalizedBody.indexOf(normalizedQuery);
    return {
      tier: 2,
      field: "body",
      score: getMatchScore(660, "body", index, queryTokens.length),
      matchText: normalizedQuery,
    };
  }

  const titlePartial = getPartialTokenMatch(
    queryTokens,
    entry.titleTokens,
    entry.normalizedTitle
  );
  if (titlePartial) {
    return {
      tier: 3,
      field: "title",
      score: getMatchScore(600, "title", titlePartial.matchIndex, titlePartial.matchedCount),
      matchText: titlePartial.matchToken || normalizedQuery,
    };
  }

  const slugPartial = getPartialTokenMatch(
    queryTokens,
    entry.slugTokens,
    entry.normalizedSlug
  );
  if (slugPartial) {
    return {
      tier: 3,
      field: "slug",
      score: getMatchScore(580, "slug", slugPartial.matchIndex, slugPartial.matchedCount),
      matchText: slugPartial.matchToken || normalizedQuery,
    };
  }

  const bodyPartial = getPartialTokenMatch(
    queryTokens,
    entry.bodyTokens,
    entry.normalizedBody
  );
  if (bodyPartial) {
    return {
      tier: 3,
      field: "body",
      score: getMatchScore(560, "body", bodyPartial.matchIndex, bodyPartial.matchedCount),
      matchText: bodyPartial.matchToken || normalizedQuery,
    };
  }

  return null;
}

function evaluateFuzzyMatch(entry, queryTokens) {
  const titleFuzzy = getFuzzyMatch(queryTokens, entry.titleTokens, entry.normalizedTitle);
  if (titleFuzzy) {
    return {
      tier: 4,
      field: "title",
      score:
        getMatchScore(400, "title", titleFuzzy.matchIndex, titleFuzzy.matchedCount) -
        titleFuzzy.bestDistance * 15,
      matchText: titleFuzzy.matchToken,
    };
  }

  const slugFuzzy = getFuzzyMatch(queryTokens, entry.slugTokens, entry.normalizedSlug);
  if (slugFuzzy) {
    return {
      tier: 4,
      field: "slug",
      score:
        getMatchScore(380, "slug", slugFuzzy.matchIndex, slugFuzzy.matchedCount) -
        slugFuzzy.bestDistance * 15,
      matchText: slugFuzzy.matchToken,
    };
  }

  const bodyFuzzy = getFuzzyMatch(queryTokens, entry.bodyTokens, entry.normalizedBody);
  if (bodyFuzzy) {
    return {
      tier: 4,
      field: "body",
      score:
        getMatchScore(360, "body", bodyFuzzy.matchIndex, bodyFuzzy.matchedCount) -
        bodyFuzzy.bestDistance * 15,
      matchText: bodyFuzzy.matchToken,
    };
  }

  return null;
}

function toSearchResult(entry, match) {
  const field = match?.field || "title";
  const matchText = match?.matchText || "";
  const snippet = field === "body"
    ? getBodySnippet(entry.body, matchText)
    : getFirstNonEmptyLine(entry.body);
  const matchedRanges = match?.field === "title" || match?.field === "slug"
    ? getMatchedRanges(field === "title" ? entry.title : entry.slug || "", matchText)
    : null;

  return {
    id: entry.id,
    slug: entry.slug,
    title: entry.title,
    snippet,
    updatedAt: entry.updatedAt,
    createdAt: entry.createdAt,
    matchMeta: match
      ? {
          tier: match.tier,
          field: match.field,
          matchedRanges: matchedRanges || undefined,
        }
      : null,
    score: match?.score ?? 0,
  };
}

function sortResults(a, b) {
  if (a.matchMeta?.tier !== b.matchMeta?.tier) {
    return (a.matchMeta?.tier ?? 99) - (b.matchMeta?.tier ?? 99);
  }
  const scoreDiff = b.score - a.score;
  const maxScore = Math.max(Math.abs(a.score), Math.abs(b.score));
  if (maxScore > 0 && Math.abs(scoreDiff) / maxScore < 0.05) {
    const aTime = a.updatedAt || a.createdAt || 0;
    const bTime = b.updatedAt || b.createdAt || 0;
    if (aTime !== bTime) return bTime - aTime;
  } else if (scoreDiff !== 0) {
    return scoreDiff;
  }
  const aTime = a.updatedAt || a.createdAt || 0;
  const bTime = b.updatedAt || b.createdAt || 0;
  if (aTime !== bTime) return bTime - aTime;
  const aSlug = a.slug || a.id || "";
  const bSlug = b.slug || b.id || "";
  return aSlug.localeCompare(bSlug);
}

function getRecentResults(limit) {
  return indexState.entries
    .slice()
    .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0))
    .slice(0, limit)
    .map((entry) => toSearchResult(entry, null));
}

export function searchDocuments(query, limit = DEFAULT_LIMIT) {
  if (!indexState.ready) return [];
  const normalizedQuery = normalizeForSearch(query);
  if (!normalizedQuery) {
    return getRecentResults(limit);
  }

  const queryTokens = tokenizeForSearch(normalizedQuery);
  const results = [];
  const matchedIds = new Set();
  let tier0to2Count = 0;

  for (const entry of indexState.entries) {
    const match = evaluateMatch(entry, normalizedQuery, queryTokens);
    if (!match) continue;
    if (match.tier <= 2) tier0to2Count += 1;
    matchedIds.add(entry.id);
    results.push(toSearchResult(entry, match));
  }

  const shouldFuzzy =
    normalizedQuery.length >= 3 && tier0to2Count < 3;
  if (shouldFuzzy) {
    for (const entry of indexState.entries) {
      if (matchedIds.has(entry.id)) continue;
      const match = evaluateFuzzyMatch(entry, queryTokens);
      if (!match) continue;
      results.push(toSearchResult(entry, match));
    }
  }

  return results.sort(sortResults).slice(0, limit);
}

// Deprecated alias for backward compatibility
// @deprecated Use searchDocuments instead
export const searchNotes = searchDocuments;

```
