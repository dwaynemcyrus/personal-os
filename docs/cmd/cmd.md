# Quick Capture / Global Search Sheet — Build Spec (cmd)

This spec describes the quick capture / global search sheet with recently edited results,
keyboard navigation, rapid capture mode, and archive/trash toggles. It is a direct, code-heavy
replication guide for rebuilding the feature in another app.

> Scope: the sheet UI + behavior only (not the FAB trigger, not long-press drag targets).

---

## 0) Dependencies (required)
The sheet integrates with:
- Documents store / repo (list, create, update)
- Local search index (normalize + search + ranking)
- Routing (open selected document)

**Minimum data fields expected for search + recents**
- id, title, slug, body
- createdAt, updatedAt
- deletedAt, archivedAt, inboxAt
- type

---

## 1) UX Summary (exact behavior)

### Open/close
- When opened: autofocus the input.
- Escape:
  1) If in selection mode -> exit selection mode and focus input.
  2) If input has text -> clear input.
  3) Otherwise -> close sheet.

### Input modes
- Empty input: show “Recently edited” list.
- Non-empty input: show search results (debounced).

### Enter key behavior
- Selection mode active: open the selected result.
- Search mode:
  - If best match tier === 0 -> open that note.
  - Otherwise -> create new note from query text.
- Empty input: save new note from input.

### Tab behavior
- Tab enters selection mode (focuses list).
- Arrow keys move selection.
- Escape or Ctrl+Tab exits selection mode.

### Rapid capture
- When enabled, saving clears input and keeps the sheet open (refocus input).
- When disabled, saving closes the sheet.

### Archived/trashed toggles
- Archived and trashed matches are hidden by default.
- If they exist in results, show toggles:
  - “Archived matches: N [Show/Hide]”
  - “Trashed matches: N [Show/Hide]”

---

## 2) Recents rules (exact)
Recents are derived from the documents store list, which is already sorted by updatedAt DESC.
Filtering rules in the sheet:
- Exclude inbox items (inboxAt != null).
- Exclude items processed from inbox without edits.
- Exclude archived unless includeArchived is enabled.
- Limit to 9.

Pseudo:
```js
const filtered = documents.filter(
  doc => doc.inboxAt == null &&
    !(doc.processedFromInboxAt && doc.processedFromInboxAt === doc.updatedAt) &&
    (includeArchived || doc.archivedAt == null)
);
return filtered.slice(0, 9);
```

---

## 3) Search rules (exact)
- Debounce: 60ms.
- Limit results: 12.
- Search index built from all docs (archived + trashed included, filtering happens after).
- Exclude type="inbox" unless trashed.
- Apply includeArchived/includeTrashed toggles.
- If query is empty: no search, show recents.

---

## 4) Data flow / integration
- Search uses repo search index:
  - ensureSearchIndex(docs)
  - searchDocuments(query, limit)
- Selection opens route: /knowledge/notes/[id].
- Capture creation uses capture template if available:
  - getCaptureTemplate() -> createFromTemplate()
  - else fallback to createDocument()

---

## 5) Full implementation code (copy-ready)

### 5.1 QuickCaptureModal.js
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

### 5.2 QuickCaptureModal.module.css
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

### 5.3 Search normalization (normalize.js)
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

### 5.4 Search engine (searchDocuments.js)
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

---

## 6) Store support (reference)
The sheet relies on the documents store being kept in updatedAt order. In this app that comes
from documentsStore.js sorting and list updates.

```js
import { create } from "zustand";
import { getDocumentsRepo } from "../lib/repo/getDocumentsRepo";
import {
  buildSearchIndex,
  clearSearchIndex,
  updateSearchIndex,
} from "../lib/search/searchDocuments";
import { deriveDocumentTitle } from "../lib/documents/deriveTitle";
import { DOCUMENT_TYPE_NOTE, DOCUMENT_TYPE_DAILY, DOCUMENT_TYPE_STAGED } from "../types/document";
import { ensureBuiltInTemplates } from "../lib/templates/seedTemplates";
import {
  addSyncListener,
  enqueueSyncOperation,
  initSyncListeners,
  saveDocument,
  saveDocumentBody,
  scheduleSync,
} from "../lib/sync/syncManager";
import { useSyncStore } from "./syncStore";
import { getSyncMeta, setSyncMeta } from "../lib/sync/syncQueue";
import { fetchDocumentBodiesByIds, fetchDocumentsUpdatedSince } from "../lib/supabase/documents";

const sortDocuments = (documents) => documents.slice().sort((a, b) => b.updatedAt - a.updatedAt);

const toListItem = (document) => ({
  id: document.id,
  type: document.type,
  title: deriveDocumentTitle(document),
  updatedAt: document.updatedAt,
  archivedAt: document.archivedAt ?? null,
  inboxAt: document.inboxAt ?? null,
});

const shouldIncludeInList = (document, includeArchived) =>
  document.deletedAt == null && (includeArchived || document.archivedAt == null);

const upsertListItem = (documents, item) => {
  const next = documents.slice();
  const index = next.findIndex((doc) => doc.id === item.id);
  if (index === -1) {
    next.push(item);
  } else {
    next[index] = { ...next[index], ...item };
  }
  return sortDocuments(next);
};

const removeListItem = (documents, id) => documents.filter((doc) => doc.id !== id);

export const getDerivedTitle = (document) => deriveDocumentTitle(document);

export const useDocumentsStore = create((set, get) => ({
  documents: [],
  documentsById: {},
  hasHydrated: false,
  hydrateError: null,
  listIncludeArchived: false,
  inboxCount: 0,
  inboxCountLoaded: false,
  inboxVersion: 0,
  fetchFromServer: async () => {
    const { setLastSyncedAt } = useSyncStore.getState();
    const repo = getDocumentsRepo();
    let lastSyncedAt = await getSyncMeta("lastSyncedAt");
    const forceFull = get().forceFullFetch;
    const now = Date.now();
    if (lastSyncedAt && Date.parse(lastSyncedAt) > now + 5 * 60 * 1000) {
      lastSyncedAt = null;
      await setSyncMeta("lastSyncedAt", null);
    }
    if (forceFull) {
      lastSyncedAt = null;
      await setSyncMeta("lastSyncedAt", null);
      set({ forceFullFetch: false });
    }
    const remoteDocs = await fetchDocumentsUpdatedSince({ since: lastSyncedAt });
    if (!remoteDocs || remoteDocs.length === 0) return;
    const ids = remoteDocs
      .map((doc) => doc.id)
      .filter((id) => typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id));
    const bodies = await fetchDocumentBodiesByIds(ids);
    const bodiesById = new Map(bodies.map((body) => [body.document_id, body.content]));

    const localDocs = remoteDocs.map((doc) => ({
      id: doc.id,
      type: doc.type,
      subtype: doc.subtype ?? null,
      title: doc.title ?? null,
      body: bodiesById.get(doc.id) ?? "",
      meta: {
        ...(doc.frontmatter ?? {}),
        status: doc.status ?? "active",
        tags: Array.isArray(doc.frontmatter?.tags) ? doc.frontmatter.tags : [],
        subtype: doc.subtype ?? null,
        frontmatter: doc.frontmatter ?? {},
      },
      status: doc.status ?? "active",
      frontmatter: doc.frontmatter ?? {},
      version: typeof doc.version === "number" ? doc.version : 1,
      created_at: doc.created_at ?? null,
      updated_at: doc.updated_at ?? null,
      createdAt: Date.parse(doc.created_at) || Date.now(),
      updatedAt: Date.parse(doc.updated_at) || Date.now(),
      deletedAt: doc.deleted_at ? Date.parse(doc.deleted_at) || Date.now() : null,
      archivedAt: doc.status === "archived" ? Date.parse(doc.updated_at) || Date.now() : null,
      inboxAt: null,
    }));

    await repo.bulkUpsert(localDocs);
    buildSearchIndex(await repo.getSearchableDocs({ includeArchived: true, includeTrashed: true }));
    const latest = remoteDocs.reduce((max, doc) => {
      const timestamp = Date.parse(doc.updated_at || "") || 0;
      return Math.max(max, timestamp);
    }, Date.parse(lastSyncedAt || "") || 0);
    const nextSync = latest ? new Date(latest).toISOString() : new Date().toISOString();
    await setSyncMeta("lastSyncedAt", nextSync);
    setLastSyncedAt(nextSync);
  },
  forceFullFetch: false,
  resetLocalCache: async ({ force = false } = {}) => {
    if (typeof window === "undefined") return;
    const resetKey = "anchored_sync_reset_done";
    if (!force && window.localStorage.getItem(resetKey)) return;
    try {
      const repo = getDocumentsRepo();
      await repo.deleteAllNotes();
      clearSearchIndex();
      await setSyncMeta("lastSyncedAt", null);
      set({
        documents: [],
        documentsById: {},
        hasHydrated: false,
        hydrateError: null,
        forceFullFetch: true,
      });
      window.localStorage.setItem(resetKey, "true");
    } catch (error) {
      console.error("Failed to reset local cache", error);
    }
  },
  resetLocalCacheOnce: async () => get().resetLocalCache(),
  loadInboxCount: async () => {
    try {
      const repo = getDocumentsRepo();
      const documents = await repo.listInboxNotes();
      // Exclude daily documents from inbox count
      const filtered = documents.filter((doc) => doc.type !== DOCUMENT_TYPE_DAILY);
      set({ inboxCount: filtered.length, inboxCountLoaded: true });
    } catch (error) {
      console.error("Failed to load inbox count:", error);
      set({ inboxCountLoaded: true });
    }
  },
  decrementInboxCount: () => {
    set((state) => ({
      inboxCount: Math.max(0, state.inboxCount - 1),
    }));
  },
  incrementInboxVersion: () => {
    set((state) => ({ inboxVersion: state.inboxVersion + 1 }));
  },
  hydrate: async (options = {}) => {
    const { includeArchived, force = false } = options;
    const currentIncludeArchived = get().listIncludeArchived;
    const nextIncludeArchived =
      typeof includeArchived === "boolean" ? includeArchived : currentIncludeArchived;
    // Skip if already hydrated successfully and no changes requested
    if (get().hasHydrated && !get().hydrateError && !force && nextIncludeArchived === currentIncludeArchived) {
      return { success: true };
    }
    try {
      // Ensure built-in templates exist before any operations
      await ensureBuiltInTemplates();

      await get().resetLocalCacheOnce();
      await get().fetchFromServer();
      await scheduleSync({ reason: "hydrate" });
      const repo = getDocumentsRepo();
      const list = await repo.list({
        type: [DOCUMENT_TYPE_NOTE, DOCUMENT_TYPE_STAGED],
        includeArchived: nextIncludeArchived,
      });
      const searchableDocs = await repo.getSearchableDocs({
        type: [DOCUMENT_TYPE_NOTE, DOCUMENT_TYPE_STAGED],
        includeArchived: true,
        includeTrashed: true,
      });
      buildSearchIndex(searchableDocs);
      set({
        documents: sortDocuments(list),
        hasHydrated: true,
        hydrateError: null,
        listIncludeArchived: nextIncludeArchived,
      });
      initSyncListeners();
      scheduleSync({ reason: "hydrate" });
      return { success: true };
    } catch (error) {
      console.error("Failed to hydrate documents list", error);
      set({
        documents: [],
        hasHydrated: true,
        hydrateError: error.message,
        listIncludeArchived: nextIncludeArchived,
      });
      return { success: false, error: error.message };
    }
  },
  loadDocument: async (id) => {
    if (typeof id !== "string") return null;
    const cached = get().documentsById[id];
    if (cached) return cached;
    try {
      const repo = getDocumentsRepo();
      const document = await repo.get(id);
      if (!document) return null;
      set((state) => ({
        documentsById: { ...state.documentsById, [id]: document },
        documents: shouldIncludeInList(document, state.listIncludeArchived)
          ? upsertListItem(state.documents, toListItem(document))
          : removeListItem(state.documents, document.id),
      }));
      return document;
    } catch (error) {
      console.error("Failed to load document", error);
      return null;
    }
  },
  createDocument: async (input = {}, options = {}) => {
    const { suppressListUpdate = false } = options;
    const { body = "", title = null, meta = {}, inboxAt = null } = input;
    try {
      const repo = getDocumentsRepo();
      const document = await repo.create({
        type: DOCUMENT_TYPE_NOTE,
        body,
        title,
        meta,
        version: 1,
        archivedAt: input.archivedAt ?? null,
        inboxAt,
      });
      updateSearchIndex(document);
      set((state) => ({
        documentsById: { ...state.documentsById, [document.id]: document },
        documents: suppressListUpdate
          ? state.documents
          : shouldIncludeInList(document, state.listIncludeArchived)
            ? upsertListItem(state.documents, toListItem(document))
            : state.documents,
        inboxCount: inboxAt != null ? state.inboxCount + 1 : state.inboxCount,
      }));
      await enqueueSyncOperation({
        type: "create",
        documentId: document.id,
        payload: { document },
      });
      return document.id;
    } catch (error) {
      console.error("Failed to create document", error);
      return null;
    }
  },
  updateDocumentBody: async (id, body) => {
    if (typeof id !== "string") return { success: false, error: "Invalid id" };
    const now = Date.now();
    const previousState = {
      document: get().documentsById[id],
      documents: get().documents,
    };
    const nextVersion = (get().documentsById[id]?.version ?? 1) + 1;
    set((state) => {
      const existing = state.documentsById[id];
      const updated = existing
        ? { ...existing, body, updatedAt: now, version: nextVersion }
        : {
            id,
            type: DOCUMENT_TYPE_NOTE,
            title: null,
            body,
            meta: {},
            createdAt: now,
            updatedAt: now,
            version: 1,
            deletedAt: null,
            archivedAt: null,
          };
      return {
        documentsById: { ...state.documentsById, [id]: updated },
        documents: shouldIncludeInList(updated, state.listIncludeArchived)
          ? upsertListItem(state.documents, toListItem(updated))
          : removeListItem(state.documents, id),
      };
    });
    try {
      await saveDocumentBody(id, body, { version: nextVersion });
      const updated = get().documentsById[id];
      if (updated) {
        updateSearchIndex(updated);
      }
      return { success: true };
    } catch (error) {
      console.error("Failed to update document body", error);
      // Rollback to previous state
      set((state) => ({
        documentsById: previousState.document
          ? { ...state.documentsById, [id]: previousState.document }
          : state.documentsById,
        documents: previousState.documents,
      }));
      return { success: false, error: error.message };
    }
  },
  updateDocument: async (id, updates) => {
    if (typeof id !== "string" || !updates) return { success: false, error: "Invalid input" };
    const now = Date.now();
    const previousState = {
      document: get().documentsById[id],
      documents: get().documents,
    };
    set((state) => {
      const existing = state.documentsById[id];
      if (!existing) return state;
      const nextVersion = (existing.version ?? 1) + 1;
      const updated = { ...existing, ...updates, updatedAt: now, version: nextVersion };
      return {
        documentsById: { ...state.documentsById, [id]: updated },
        documents: shouldIncludeInList(updated, state.listIncludeArchived)
          ? upsertListItem(state.documents, toListItem(updated))
          : removeListItem(state.documents, id),
      };
    });
    try {
      const nextVersion = (get().documentsById[id]?.version ?? 1);
      const updated = get().documentsById[id];
      if (updated) {
        await saveDocument(updated, undefined, { version: nextVersion });
        updateSearchIndex(updated);
      }
      return { success: true };
    } catch (error) {
      console.error("Failed to update document", error);
      // Rollback to previous state
      set((state) => ({
        documentsById: previousState.document
          ? { ...state.documentsById, [id]: previousState.document }
          : state.documentsById,
        documents: previousState.documents,
      }));
      return { success: false, error: error.message };
    }
  },
  archiveDocument: async (id, options = {}) => {
    if (typeof id !== "string") return;
    const { wasInInbox = false } = options;
    const now = Date.now();
    set((state) => {
      const existing = state.documentsById[id];
      const nextVersion = existing ? (existing.version ?? 1) + 1 : null;
      // Check if document was in inbox (from cache or caller)
      const docWasInInbox = wasInInbox || (existing?.inboxAt != null);
      // Update documentsById if the document is cached there
      const nextDocumentsById = existing
        ? {
            ...state.documentsById,
            [id]: {
              ...existing,
              archivedAt: now,
              updatedAt: now,
              inboxAt: null,
              ...(nextVersion ? { version: nextVersion } : {}),
            },
          }
        : state.documentsById;
      // Always update the list - remove if not showing archived, otherwise update archivedAt
      const nextDocuments = state.listIncludeArchived
        ? state.documents.map((doc) =>
            doc.id === id ? { ...doc, archivedAt: now, updatedAt: now } : doc
          )
        : removeListItem(state.documents, id);
      return {
        documentsById: nextDocumentsById,
        documents: nextDocuments,
        // Decrement inbox count if document was in inbox
        inboxCount: docWasInInbox ? Math.max(0, state.inboxCount - 1) : state.inboxCount,
      };
    });
    try {
      const repo = getDocumentsRepo();
      await repo.archive(id);
      const refreshed = await repo.get(id);
      if (refreshed) {
        updateSearchIndex(refreshed);
        await enqueueSyncOperation({
          type: "update",
          documentId: refreshed.id,
          payload: { document: refreshed, baseVersion: (refreshed.version ?? 1) - 1 },
        });
      }
    } catch (error) {
      console.error("Failed to archive document", error);
    }
  },
  unarchiveDocument: async (id) => {
    if (typeof id !== "string") return;
    const now = Date.now();
    set((state) => {
      const existing = state.documentsById[id];
      const nextVersion = existing ? (existing.version ?? 1) + 1 : null;
      // Update documentsById if the document is cached there
      const nextDocumentsById = existing
        ? {
            ...state.documentsById,
            [id]: {
              ...existing,
              archivedAt: null,
              updatedAt: now,
              ...(nextVersion ? { version: nextVersion } : {}),
            },
          }
        : state.documentsById;
      // Update the list item to clear archivedAt
      const nextDocuments = state.documents.map((doc) =>
        doc.id === id ? { ...doc, archivedAt: null, updatedAt: now } : doc
      );
      return {
        documentsById: nextDocumentsById,
        documents: sortDocuments(nextDocuments),
      };
    });
    try {
      const repo = getDocumentsRepo();
      await repo.unarchive(id);
      const refreshed = await repo.get(id);
      if (refreshed) {
        updateSearchIndex(refreshed);
        await enqueueSyncOperation({
          type: "update",
          documentId: refreshed.id,
          payload: { document: refreshed, baseVersion: (refreshed.version ?? 1) - 1 },
        });
      }
    } catch (error) {
      console.error("Failed to unarchive document", error);
    }
  },
  trashDocument: async (id, options = {}) => {
    if (typeof id !== "string") return;
    const { wasInInbox = false } = options;
    const now = Date.now();
    set((state) => {
      const existing = state.documentsById[id];
      const nextVersion = existing ? (existing.version ?? 1) + 1 : null;
      // Check if document was in inbox (from cache or caller)
      const docWasInInbox = wasInInbox || (existing?.inboxAt != null);
      // Update documentsById if the document is cached there
      const nextDocumentsById = existing
        ? {
            ...state.documentsById,
            [id]: {
              ...existing,
              deletedAt: now,
              updatedAt: now,
              inboxAt: null,
              ...(nextVersion ? { version: nextVersion } : {}),
            },
          }
        : state.documentsById;
      // Always remove from list - trashed documents never show in list
      return {
        documentsById: nextDocumentsById,
        documents: removeListItem(state.documents, id),
        // Decrement inbox count if document was in inbox
        inboxCount: docWasInInbox ? Math.max(0, state.inboxCount - 1) : state.inboxCount,
      };
    });
    try {
      const repo = getDocumentsRepo();
      await repo.trash(id);
      const refreshed = await repo.get(id);
      if (refreshed) {
        updateSearchIndex(refreshed);
        await enqueueSyncOperation({
          type: "update",
          documentId: refreshed.id,
          payload: { document: refreshed, baseVersion: (refreshed.version ?? 1) - 1 },
        });
      }
    } catch (error) {
      console.error("Failed to trash document", error);
    }
  },
  restoreDocument: async (id) => {
    if (typeof id !== "string") return;
    // For restore, we need to re-fetch the document to get full data for the list
    // Since trashed documents aren't in the list, we may not have the data
    try {
      const repo = getDocumentsRepo();
      await repo.restore(id);
      // Fetch the restored document to get current data
      const restored = await repo.get(id);
      if (!restored) return;
      updateSearchIndex(restored);
      await enqueueSyncOperation({
        type: "update",
        documentId: restored.id,
        payload: { document: restored, baseVersion: (restored.version ?? 1) - 1 },
      });
      set((state) => {
        const nextDocumentsById = { ...state.documentsById, [id]: restored };
        const nextDocuments = shouldIncludeInList(restored, state.listIncludeArchived)
          ? upsertListItem(state.documents, toListItem(restored))
          : state.documents;
        return {
          documentsById: nextDocumentsById,
          documents: nextDocuments,
        };
      });
    } catch (error) {
      console.error("Failed to restore document", error);
    }
  },
}));

addSyncListener((event) => {
  if (event?.type !== "remoteApplied") return;
  const { fetchFromServer, loadInboxCount, incrementInboxVersion } =
    useDocumentsStore.getState();
  fetchFromServer();
  loadInboxCount();
  incrementInboxVersion();
});

// Deprecated aliases for backward compatibility
// @deprecated Use useDocumentsStore instead
export const useNotesStore = useDocumentsStore;
```

---

## 7) Replication checklist
- Match debounce (60ms) and result limits (12 search, 9 recents).
- Preserve keyboard behavior and selection mode.
- Keep archive/trash toggles and counts.
- Ensure input autofocus and scroll lock behavior.
- Ensure routing on selection uses the document id.
- Maintain search index parity with normalize + ranking functions.
