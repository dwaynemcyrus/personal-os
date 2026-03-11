# CodeMirror 6 Bear/Obsidian Editor — Build Specification

> **For AI agents:** Build in strict phase order. Each phase must pass its acceptance criteria before the next begins. Use existing CodeMirror 6 extensions wherever available. All custom extensions must be isolated in their own files, independently toggleable, and must not break the editor if disabled.

---

## Architecture Overview

### Two-Column Layout Model

The entire editor is built on a **fixed-width gutter + content column** layout. This is the foundational constraint that all phases build on top of.

```
┌──────────┬────────────────────────────────────┐
│  GUTTER  │  CONTENT COLUMN                    │
│  ~32px   │  All text starts here, flush left  │
│          │  regardless of block type          │
│    ●     │  List item text                    │
│    ☐     │  Task text                         │
│   H2↓    │  Heading text                      │
│    ▏     │  Blockquote text                   │
│          │  Paragraph text (no icon)          │
└──────────┴────────────────────────────────────┘
```

- The gutter is a **fixed pixel-width column** — not relative, not inline
- All block-level marks (`##`, `-`, `>`, `- [ ]`) are suppressed; their visual replacement lives in the gutter
- Paragraph text has no gutter icon but still respects the same left content edge
- Native CodeMirror list indentation must be **overridden** — indentation is managed manually

### Two Editor Modes

| Mode | Description |
|------|-------------|
| **Source** | Raw markdown, no icons, no rendering. Obsidian-style. Syntax highlighted only. |
| **Rendered** | Two-column layout, gutter icons, inline formatting applied, marks hidden. Bear-style. |

Mode is **per-note**, stored with note metadata. Toggled via a persistent toolbar button.

### Extension Isolation Rule

Every custom CodeMirror extension must:
- Live in its own file (e.g. `extensions/gutterIcons.ts`)
- Export a single `extension()` function that returns a CodeMirror `Extension`
- Be added/removed from the editor via `editor.dispatch({ effects: ... })` without reloading
- Not share mutable state with other extensions
- Have a corresponding `enabled: boolean` flag in editor config

---

## Technology Stack

| Concern | Package |
|---------|---------|
| Editor core | `@codemirror/view`, `@codemirror/state` |
| Markdown parsing | `@codemirror/lang-markdown`, `@lezer/markdown` |
| Syntax highlighting | `@codemirror/language`, `@codemirror/highlight` |
| Gutter | `@codemirror/view` — `gutter()`, `GutterMarker` |
| Decorations | `@codemirror/view` — `Decoration`, `ViewPlugin` |
| Math rendering | `@codemirror/lang-markdown` + `katex` |
| Table editing | `@codemirror/lang-markdown` (built-in GFM tables) |
| History/undo | `@codemirror/commands` — `history()` |
| Keybindings | `@codemirror/commands` — `defaultKeymap`, `markdownKeymap` |

> **Agent note:** Install all packages via `npm install`. Do not write custom parsers for anything that an existing CM6 extension already handles.

---

## Phase 1 — Source Mode Foundation

**Goal:** A working CodeMirror 6 editor in raw/source mode. No rendering. No icons. This is the base all other phases build on.

### Tasks

1. Initialize CodeMirror 6 with `@codemirror/lang-markdown`
2. Enable GitHub Flavored Markdown (GFM) via the markdown extension's `extensions` option — gets tables, strikethrough for free
3. Apply syntax highlighting with `@codemirror/language` `syntaxHighlighting()`
4. Implement the two-column DOM structure as a CSS layout wrapper — gutter column exists but is empty in source mode
5. Override default CodeMirror list indentation styles so all text aligns to the content column left edge
6. Implement per-note state model: each note has `{ content: string, mode: 'source' | 'rendered' }`
7. Add toolbar with mode toggle button — in Phase 1 it switches the `mode` field but rendered mode is not yet built
8. Wire undo/redo via `history()` and `defaultKeymap`

### Acceptance Criteria

- [ ] Editor loads and accepts text input
- [ ] Markdown syntax highlighting visible in source mode (headings, bold, lists are coloured differently)
- [ ] All text in source mode aligns to a consistent left edge (no CM6 default list indent)
- [ ] Mode toggle button is present in toolbar and toggles the `mode` value (rendered mode can be a no-op at this stage)
- [ ] Undo/redo works

### Extension Files Created This Phase

- `extensions/sourceMode.ts` — syntax highlighting config, GFM options
- `extensions/layoutBase.ts` — CSS custom property definitions for gutter width and content column offset

---

## Phase 2 — Extended Markdown Support

**Goal:** All required markdown variants parse and highlight correctly in source mode before any rendering is added.

### Tasks

1. Enable GFM strikethrough (`~~text~~`) — already included in GFM, verify it highlights
2. Add highlight syntax (`==text==`) via a custom Lezer inline parser extension
3. Add underline syntax (`~text~`) via a custom Lezer inline parser extension
4. Add superscript (`^text^`) and subscript (`_text_` variant TBD) via custom inline parsers
5. Add footnote syntax (`[^1]`) via custom Lezer parser or markdown extension
6. Integrate `katex` for math — parse `$...$` inline and `$$...$$` block; in source mode highlight the delimiters only
7. Verify code blocks (` ``` ``` `) highlight via existing CM6 language support
8. Verify tables highlight via GFM

### Notes for Agent

- Use `@lezer/markdown`'s `InlineParser` and `BlockParser` APIs for custom syntax — do not write regex-based decorations for parsing
- Each custom syntax extension goes in its own file
- Strikethrough, tables, and code blocks should require zero custom code — verify before writing any

### Acceptance Criteria

- [ ] All 9 extended syntax types highlight distinctly in source mode
- [ ] No existing syntax breaks when new parsers are added
- [ ] Each custom parser can be toggled off without affecting others
- [ ] Math delimiters `$` and `$$` are visually distinct from body text

### Extension Files Created This Phase

- `extensions/syntaxHighlight.ts` — highlight (`==`)
- `extensions/syntaxUnderline.ts` — underline (`~`)
- `extensions/syntaxSuperSub.ts` — superscript/subscript
- `extensions/syntaxFootnote.ts` — footnotes
- `extensions/syntaxMath.ts` — math delimiter detection

---

## Phase 3 — Gutter Icon System (Rendered Mode)

**Goal:** Implement the core Bear-style gutter. This is the most architecturally significant phase.

### Behaviour Spec

| Block Type | Gutter Icon | Content Column Behaviour |
|------------|-------------|--------------------------|
| H1 | Large heading indicator | `#` mark suppressed, text rendered at H1 size |
| H2 | Medium heading indicator | `##` suppressed |
| H3 | Small heading indicator | `###` suppressed |
| Unordered list (`-`) | Filled dot `●` | `-` suppressed |
| Ordered list (`1.`) | Number label | `1.` suppressed |
| Task open (`- [ ]`) | Empty checkbox `☐` | marks suppressed |
| Task done (`- [x]`) | Checked checkbox `☑` | marks suppressed, text struck through |
| Blockquote (`>`) | Vertical bar `▏` | `>` suppressed, left border style applied |
| YAML frontmatter | Collapse icon | Block hidden by default (Phase 5) |
| Paragraph | _(none)_ | No change |

### Virtual Character Model (Bear Backspace Behaviour)

Block marks are replaced with a **zero-width atomic decoration** (CodeMirror `Decoration.replace`) that:
- Makes the mark invisible and non-selectable
- Behaves as a single character for cursor movement and backspace
- When backspaced from line start: removes the decoration and the underlying mark characters, leaving plain text
- Is **never revealed by cursor position** — the icon is always visible in rendered mode regardless of cursor

> **Agent note:** Use `Decoration.replace({ atomic: true })` on the mark range. The gutter icon is a separate `GutterMarker` — these two are linked by line number, not by decoration position.

### Tasks

1. Create a `ViewPlugin` that scans the syntax tree on each update and identifies all block-level mark ranges
2. For each marked line, apply `Decoration.replace({ atomic: true })` to the mark characters
3. Register a `gutter()` with a `GutterMarker` that renders the correct icon SVG/emoji for each line type
4. Implement backspace command: if cursor is at position immediately after an atomic decoration at line start, delete the decoration and the underlying mark text
5. Ensure all text in the content column aligns to the same left edge — test with mixed heading/list/paragraph content
6. Render mode switcher now actually enables/disables this extension

### Acceptance Criteria

- [ ] All 8 block types show correct gutter icons
- [ ] Raw marks are invisible in rendered mode
- [ ] Backspace at line start removes block type and leaves plain text
- [ ] Text column is flush across all block types — no ragged left edges
- [ ] Disabling the extension reverts to source mode with no visual artifacts
- [ ] Icons are crisp on high-DPI (retina) mobile screens

### Extension Files Created This Phase

- `extensions/gutterIcons.ts` — ViewPlugin + GutterMarker + atomic decorations
- `extensions/blockBackspace.ts` — custom backspace command handler

---

## Phase 4 — Inline Rendering (Rendered Mode)

**Goal:** Inline formatting marks are hidden and formatting is applied. Marks reappear only when the cursor is inside the specific token.

### Behaviour Spec

| Syntax | Rendered Appearance | Cursor-on-token behaviour |
|--------|--------------------|-----------------------------|
| `**bold**` | **bold** (marks hidden) | `**` marks appear |
| `*italic*` | *italic* (marks hidden) | `*` marks appear |
| `==highlight==` | highlighted background | `==` marks appear |
| `~~strikethrough~~` | ~~strikethrough~~ | `~~` marks appear |
| `~underline~` | underlined | `~` marks appear |
| `^super^` | superscript | `^` marks appear |
| `` `code` `` | inline code style | backticks appear |
| `[[wikilink]]` | styled link text, marks hidden | `[[` `]]` marks appear |
| `#tag` | `#` always visible, tag styled | — |
| `$math$` | KaTeX rendered inline | cursor inside reveals raw |
| `$$math$$` | KaTeX rendered block | cursor inside reveals raw |

### Tasks

1. Create a `ViewPlugin` that tracks cursor position each update
2. For each inline mark range: apply `Decoration.replace` to hide marks, apply `Decoration.mark` for formatting class
3. On each update, check if cursor is inside a token — if so, remove the replace decorations for that token's marks only
4. Implement KaTeX rendering: replace `$...$` with a `Decoration.widget` that renders a KaTeX DOM node; reveal raw on cursor entry
5. Implement wiki-link rendering: hide `[[` and `]]`, apply link style to inner text; reveal marks on cursor entry
6. Implement inline code: apply code style, keep backticks visible in all modes (matches Bear behaviour)

### Acceptance Criteria

- [ ] All inline marks hidden when cursor is not inside the token
- [ ] Marks appear immediately when cursor enters the token, disappear when cursor leaves
- [ ] KaTeX renders correctly inline and in blocks
- [ ] Wiki-links styled distinctly from regular text
- [ ] `#tag` always shows the `#` character, styled
- [ ] No flicker when moving cursor rapidly

### Extension Files Created This Phase

- `extensions/inlineMarks.ts` — cursor-aware inline decoration ViewPlugin
- `extensions/wikiLinks.ts` — wiki-link hide/reveal
- `extensions/mathRender.ts` — KaTeX widget decorations

---

## Phase 5 — Gutter Icon Interactions

**Goal:** Gutter icons are interactive. Each block type has appropriate tap/click behaviour.

### Interaction Map

| Icon | Tap | Long-press / secondary |
|------|-----|------------------------|
| H1 / H2 / H3 | Opens level picker dropdown (H1–H6) | — |
| Bullet `●` | — | _(future: convert to task)_ |
| Ordered number | — | — |
| Task `☐` | Cycle: open → done → open (updates `[ ]` ↔ `[x]`) | — |
| Blockquote `▏` | — | — |
| YAML frontmatter | Toggle expand/collapse | — |

### Tasks

1. Attach `mousedown`/`touchstart` event listeners to gutter marker DOM nodes
2. Heading icon tap: render a small floating dropdown with H1–H6 options; on selection, replace the `#` marks in the underlying text with the new level
3. Task icon tap: toggle `[ ]` ↔ `[x]` in the underlying text; update decoration immediately
4. YAML frontmatter icon: implement fold/unfold using CodeMirror `foldEffect` — fold the frontmatter range except the first line
5. Prevent gutter interactions from moving the editor cursor

### Acceptance Criteria

- [ ] Tapping heading icon shows level picker, selection changes heading level
- [ ] Tapping task icon toggles state; done tasks show strikethrough on text
- [ ] YAML frontmatter folds/unfolds; collapsed state shows a single summary line
- [ ] Gutter taps do not move cursor or trigger text selection
- [ ] Works correctly with touch events on mobile (no 300ms tap delay)

### Extension Files Created This Phase

- `extensions/gutterInteractions.ts` — event handling, dropdown, task toggle
- `extensions/frontmatterFold.ts` — YAML block fold/unfold

---

## Phase 6 — Typewriter Mode

**Goal:** Active line is locked to the vertical center of the viewport. Scrolling happens automatically as the user types.

### Behaviour Spec

- When enabled: after every cursor move or keystroke, the editor scrolls so the active line is at **50% viewport height**
- Smooth scroll (CSS `scroll-behavior: smooth` or `requestAnimationFrame`)
- Does not activate during programmatic content changes (e.g. find/replace)
- Toggle stored in note state alongside `mode`

### Tasks

1. Create a `ViewPlugin` that listens for `update.selectionSet`
2. On cursor change: calculate the y-position of the active line, compute the scroll offset needed to center it, apply via `editor.scrollDOM.scrollTop`
3. Add typewriter mode toggle to toolbar
4. Ensure smooth scroll does not conflict with programmatic scroll (e.g. initial load scroll position)

### Acceptance Criteria

- [ ] Active line stays at vertical center as user types through a long document
- [ ] Scroll is smooth, not jumpy
- [ ] Toggle enables/disables correctly per note
- [ ] Does not interfere with normal scroll when typewriter mode is off

### Extension Files Created This Phase

- `extensions/typewriterMode.ts`

---

## Phase 7 — Focus Mode

**Goal:** Non-active content is dimmed. Three sub-modes selectable by the user.

### Sub-modes

| Sub-mode | What stays full opacity |
|----------|------------------------|
| Line | Active line only |
| Paragraph | Active paragraph (block) |
| Sentence | Active sentence (period-bounded) |

### Tasks

1. Create a `ViewPlugin` that tracks cursor position and computes the "active range" per sub-mode
2. Apply `Decoration.mark({ class: 'cm-focus-dimmed' })` to all ranges outside the active range
3. CSS: `.cm-focus-dimmed { opacity: 0.3; transition: opacity 0.15s; }`
4. Add focus mode toggle + sub-mode selector to toolbar
5. Sentence detection: split paragraph text on `. `, `! `, `? ` boundaries — does not need to be perfect

### Acceptance Criteria

- [ ] All three sub-modes dim correctly
- [ ] Transitions are smooth (0.15s opacity fade)
- [ ] Active range updates immediately on cursor move
- [ ] Disabling focus mode removes all dimming instantly
- [ ] Works in both source and rendered modes

### Extension Files Created This Phase

- `extensions/focusMode.ts`

---

## Phase 8 — Tables (Rendered Mode)

**Goal:** Markdown tables render cleanly in the content column with alignment support.

### Tasks

1. GFM tables are already parsed in Phase 1 — verify the AST nodes are available
2. In rendered mode, apply `Decoration.replace` to raw table pipe characters and replace with a `Decoration.widget` that renders an HTML table DOM node
3. Widget must re-render when content changes (cursor inside table reveals raw source)
4. Support column alignment (`:---`, `:---:`, `---:`)
5. In source mode: apply column-alignment styling to pipe characters only (no widget)

### Acceptance Criteria

- [ ] Tables render as visual tables in rendered mode
- [ ] Cursor inside table reveals raw markdown
- [ ] Column alignment respected
- [ ] Source mode shows raw pipes with alignment hints

### Extension Files Created This Phase

- `extensions/tableRender.ts`

---

## Phase 9 — Code Blocks (Rendered Mode)

**Goal:** Fenced code blocks render with syntax highlighting, language label, and copy button.

### Tasks

1. Code blocks are already parsed — apply a `Decoration.widget` that wraps the block in a styled container
2. Show language label from the fence info string (e.g. ` ```javascript `)
3. Add copy-to-clipboard button in the block header
4. Apply language-specific syntax highlighting inside the block using CodeMirror's existing language support packages
5. Gutter shows a copy icon for code block lines

### Acceptance Criteria

- [ ] Code blocks visually distinct from body text
- [ ] Language label displayed
- [ ] Copy button works
- [ ] Syntax highlighting inside block matches the declared language
- [ ] Cursor inside block reveals raw fence marks

### Extension Files Created This Phase

- `extensions/codeBlockRender.ts`

---

## Global Constraints (All Phases)

These rules apply throughout the entire build:

**Performance**
- Decorations must use `RangeSet` and only update changed ranges — never rebuild the full decoration set on every keystroke
- `ViewPlugin.update()` must check `update.docChanged || update.selectionSet` before doing work

**Mobile**
- Touch targets in the gutter must be minimum 44×44px
- No hover-only interactions — all interactions must work with touch
- Test on iOS Safari (PWA context)

**Accessibility**
- Gutter icons must have `aria-label` attributes
- Focus mode and typewriter mode must not break keyboard navigation

**State**
- Per-note state shape: `{ content: string, mode: 'source' | 'rendered', focusMode: false | 'line' | 'paragraph' | 'sentence', typewriterMode: boolean }`
- State persists with the note — not global app state

**Toggling Extensions**
- Every custom extension must be removable at runtime via a `Compartment`
- Pattern: `const myExtension = new Compartment()` — reconfigure via `myExtension.reconfigure([])`

---

## Build Order Summary

| Phase | What | Key Risk |
|-------|------|----------|
| 1 | Source mode foundation | Layout CSS getting the two-column model right |
| 2 | Extended markdown parsing | Custom Lezer parsers conflicting |
| 3 | Gutter icon system | Atomic decoration + backspace interaction |
| 4 | Inline rendering | Cursor-tracking performance |
| 5 | Gutter interactions | Touch event handling on mobile |
| 6 | Typewriter mode | Scroll conflict with other scroll behaviour |
| 7 | Focus mode | Sentence detection edge cases |
| 8 | Table rendering | Widget re-render on edit |
| 9 | Code block rendering | Language detection + copy button |

---

## Notes / Additions

- **Undo/redo toolbar buttons:** Add undo and redo buttons to the Bear-inspired editor toolbar for both mobile and desktop. Keyboard shortcuts (`Cmd+Z`, `Cmd+Shift+Z`) are already wired via `historyKeymap`, but touch-only mobile users have no access without UI buttons.
