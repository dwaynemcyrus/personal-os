# Markdown-First Editor Build Spec
**Version:** 1.0  
**Scope:** Markdown-first editor and reader mode for Notes  
**Status:** Draft (approved for execution)  
**Primary Device:** iPhone 15 Pro (393px width), scales to desktop  
**Architecture:** Offline-first, sheet-based navigation, single-route app

## Summary
We are shifting the Notes editor to a **markdown-first** model where the markdown text is canonical. Editing is done in **CodeMirror 6** (raw markdown), and reading is done in a **Reader mode** rendered with **markdown-it** (sanitized with DOMPurify and syntax highlighted with Shiki).  

Key additions:
- Reader mode toggle (global/temporary) in the More menu  
- Frontmatter round-trip to `note.properties`  
- Wiki-link extraction from **frontmatter and body**, grouped by source and by frontmatter property name  
- Full Markdown Guide extensions enabled in reader mode  
- Code highlighting for: **js, typescript, yaml, html, css, json, markdown, python**  
- Interactive task toggles in reader mode only (cycle through all states)

Instant render (in-editor rendered markdown) is **explicitly a later opt-in** phase and not part of the core rollout.

---

## Current Stack (What We Already Have)
### Editor
- CodeMirror 6 editor (`src/components/editor/CodeMirrorEditor.tsx`)
- Markdown language support (`@codemirror/lang-markdown`)
- Custom extensions:
  - `instantRender` (hide markdown syntax while editing)
  - `callouts` (Obsidian-style callouts)
  - `wikilink` (autocomplete + clickable)
  - `typewriter`, `focus`
- `NoteEditor` integrates:
  - More menu
  - Properties sheet
  - Backlinks panel / Unlinked mentions
  - Version history

### Wiki-links
- Parser: `src/lib/markdown/wikilinks.ts`
- Sync: `src/lib/noteLinks.ts` (currently **body-only**)

### Properties
- `note.properties` JSON exists (stored in DB)
- `PropertiesSheet` edits `note.properties`
- No frontmatter in markdown content yet

### Missing (Not Yet Implemented)
- markdown-it
- DOMPurify
- Shiki
- Frontmatter parsing / round-trip
- Reader mode view
- Full Markdown Guide extensions
- Wiki-link extraction from frontmatter

---

## Goals (What We Are Building)
1. **Markdown-first editing** in CM6 (no task toggles while editing).
2. **Reader mode** rendered by markdown-it, with:
   - DOMPurify sanitation
   - Shiki syntax highlighting
   - Interactive task toggles (cycle through all states)
3. **Frontmatter round-trip**:
   - YAML frontmatter lives in markdown
   - Parsed JSON stored in `note.properties`
   - Editing properties updates the frontmatter block in markdown
4. **Wiki-link extraction**:
   - From markdown body
   - From frontmatter values
   - Grouped by:
     - Source: `body` vs `frontmatter`
     - Property name (Obsidian style)
5. **Markdown Guide extensions**:
   - Enable **all** extended syntax in reader mode

---

## Non-Goals (Now)
- Instant render overhaul (kept as a later opt-in)
- Multi-user collaboration
- Real-time shared editing
- New DB tables or schema changes (use existing `note.properties`)

---

## Architecture Overview
### Modes
1. **Edit Mode**
   - CodeMirror 6
   - Raw markdown visible
   - No task toggles in edit mode
2. **Reader Mode**
   - markdown-it render pipeline
   - DOMPurify sanitize
   - Shiki highlighting
   - Interactive tasks (cycle through all states)

Reader mode is **global/temporary** and toggled from the More menu. It does not persist per-note.

---

## Frontmatter Round-Trip
### Source of Truth
- Markdown content is canonical.
- YAML frontmatter block at top of note (if present).
- `note.properties` stores the parsed frontmatter JSON for fast UI access.

### Behavior
- When note is loaded:
  - Parse frontmatter YAML if present
  - Update `note.properties`
- When properties change:
  - Update frontmatter block in markdown
  - Update `note.properties`
  - Preserve original markdown body order and whitespace

### UI
- Frontmatter block is **hidden** by default.
- More menu includes **Show Frontmatter** toggle (edit mode only).

---

## Reader Mode Pipeline
1. Build markdown-it instance with full Markdown Guide extensions
2. Use Shiki for code highlighting (language set: js, typescript, yaml, html, css, json, markdown, python)
3. Render to HTML
4. Sanitize with DOMPurify
5. Inject into reader view
6. Attach task toggle handlers (cycle states)

### Task State Cycle
Use the same cycle as editor code:
`' ', 'x', '>', '/', '!', '?', '-', '<'`

Reader mode toggles **only** when tapped in reader view.

---

## Markdown Guide Extensions (All)
Reader mode must support all extended syntax listed on Markdown Guide:
- Tables
- Fenced code blocks
- Syntax highlighting
- Footnotes
- Strikethrough
- Task lists
- Emoji
- Definition lists
- Heading IDs
- Abbreviations
- Subscript / superscript (if applicable)
- Highlight / mark (if applicable)
- Any others listed in the guide (confirm plugin coverage)

**Note:** markdown-it defaults cover only a subset. The rest require plugins.

---

## Wiki-Link Extraction & Grouping
### Extraction
1. Body:
   - Parse markdown body with existing `parseWikiLinks`
2. Frontmatter:
   - Extract wiki-links from all frontmatter values
   - Supports string and arrays
   - If a frontmatter value contains `[[...]]`, parse links

### Grouping
1. Group by source:
   - `body`
   - `frontmatter`
2. For frontmatter links, group by **property name**
   - Example: frontmatter `related: [[Note A]]` groups under `related`

### Storage
Continue using `note_links`:
- Add metadata in memory or via extended query (no DB schema change unless needed)

---

## What We Reuse vs Change
### Reuse
- CodeMirror editor
- Wiki-link parser + extension
- Callouts extension (edit mode)
- PropertiesSheet UI
- noteLinks sync infrastructure

### Change
- Add Reader mode component
- Add markdown-it rendering pipeline
- Add DOMPurify sanitation
- Add Shiki highlighting
- Add frontmatter parsing + round-trip
- Extend noteLinks sync to include frontmatter-derived links
- Add reader-mode task toggle behavior

---

## Phased Implementation Plan (Small, Testable Chunks)

### Phase 1 — Reader Mode Scaffolding
**Goal:** Add reader mode toggle and skeleton view without rendering logic.  
**Key tasks:**
- Add global/temporary reader mode toggle in More menu
- Add reader view container (empty state) for notes
- Ensure navigation + sheet behavior remains stable
**Verify:**
- Toggle shows/hides reader view
- No regressions in edit mode

### Phase 2 — markdown-it Rendering + DOMPurify
**Goal:** Render markdown safely.  
**Key tasks:**
- Introduce markdown-it pipeline
- Render markdown to HTML
- Sanitize with DOMPurify
**Verify:**
- Basic markdown renders
- No unsafe HTML leaks

### Phase 3 — Shiki Highlighting
**Goal:** Syntax highlight in reader mode.  
**Key tasks:**
- Integrate Shiki
- Limit languages to js, typescript, yaml, html, css, json, markdown, python
- Lazy load highlighter
**Verify:**
- Code fences render with correct language highlighting
- No major bundle/perf regression

### Phase 4 — Frontmatter Parsing + Round-Trip
**Goal:** Frontmatter is canonical and syncs with properties.  
**Key tasks:**
- Parse YAML frontmatter
- Sync parsed JSON to `note.properties`
- Update frontmatter when properties change
- Add “Show Frontmatter” toggle in More menu
**Verify:**
- Properties edits reflect in markdown
- Markdown edits reflect in properties
- Frontmatter hidden by default

### Phase 5 — Markdown Guide Extensions
**Goal:** Full extended syntax in reader mode.  
**Key tasks:**
- Add markdown-it plugins for all Markdown Guide extensions
**Verify:**
- Each extension renders correctly

### Phase 6 — Wiki-Link Extraction (Body + Frontmatter)
**Goal:** Extract wiki-links from frontmatter and body.  
**Key tasks:**
- Extend link extraction to parse frontmatter values
- Group links by source and property name
**Verify:**
- Link panels show grouped entries
- Backlinks/outgoing links still correct

### Phase 7 — Reader-Mode Task Toggles
**Goal:** Interactive tasks in reader mode.  
**Key tasks:**
- Attach click/tap handlers for tasks
- Cycle through all states
- Update markdown source accordingly
**Verify:**
- Tasks toggle in reader view
- Markdown updates persist

### Phase 8 — Instant Render (Opt-In, Later)
**Goal:** Offer optional instant render preview within edit mode.  
**Key tasks:**
- Leave current `instantRender` extension behind a toggle
**Verify:**
- No regressions in core editing
- Cursor stability remains acceptable

---

## Risks & Mitigations
- **Bundle size** (markdown-it + Shiki): mitigate with lazy loading.
- **Frontmatter merge conflicts**: maintain robust parsing/serialization and preserve body.
- **Task toggle correctness**: only in reader mode to avoid edit-mode issues.
- **Markdown extensions scope**: ensure plugin coverage matches Markdown Guide.

---

## Testing & Verification
After each phase:
- Toggle reader mode on/off
- Verify editor stability
- Confirm no breaking changes in note save/sync
- Spot check rendering and task toggles

---

## Instant Render Policy
Instant render is **not part of the core rollout**.  
It is explicitly a **later opt-in** feature after markdown-first + reader mode stabilize.

