# Editor Features — Parked for Later

Features currently in the editor that have been removed for MVP. Re-introduce as needed.

---

## From `codemirror-for-writers` (`hybridMarkdown`)

| Feature | Description |
|---|---|
| Hybrid markdown rendering | Toggle between raw markdown and a rendered/preview mode in-place |
| WikiLink rendering | `[[links]]` rendered as styled chips inside the editor |
| Frontmatter sheet | Slide-out panel for editing YAML frontmatter as structured fields |
| Writing mode | Typewriter scroll + focus mode (dims surrounding lines) |
| Toolbar | Formatting toolbar (bold, italic, headings, etc.) |
| Word count | Live word/character count display |
| KaTeX math | Render `$inline$` and `$$block$$` LaTeX math via katex |
| Backlinks panel | Shows notes that link to the current note, inline at the bottom of the editor |
| Custom tasks | Extended `- [x]` task syntax beyond standard GFM |
| Dark/light theme toggle | `toggleTheme` — per-editor dark mode |
| Raw mode toggle | `toggleHybridMode` — switch to plain text view |
| Read-only mode | `toggleReadOnly` — lock the editor against edits |
| Scroll past end | `toggleScrollPastEnd` — allow scrolling below the last line |

---

## From `NoteEditor.tsx`

| Feature | Description |
|---|---|
| `TemplatePicker` | Modal to pick a saved template and insert it into the current note |
| `VersionHistory` | Browse, preview, and restore past auto/manual versions of a note |
| Manual version save | `Mod-S` keybinding + menu item to snapshot the current content |
| Auto version save | Saves a version automatically on a time-based interval (`shouldAutoSaveVersion`) |
| `syncNoteLinks` | On every save, parses `[[wikilinks]]` and syncs them to the `note_links` collection |
| Backlinks navigation | `onBacklinksRequested` + `onBacklinkClick` — clicking a backlink navigates to that note |
| Frontmatter → properties sync | Parses YAML frontmatter on save and writes it to `note.properties` |
| Editor toggle dropdown | 8-item dropdown: dark mode, raw markdown, read-only, writing mode, toolbar, word count, scroll past end, frontmatter |
| Find & Replace | `actions.search(view)` — opens CM's built-in search/replace panel |

---

## Files with no current role after simplification

| File | What it was for |
|---|---|
| `src/components/editor/BacklinksPanel.module.css` | Backlinks panel styles |
| `src/components/editor/FocusSettings.module.css` | Writing/focus mode settings styles |
| `src/components/editor/PropertiesSheet.module.css` | Properties/frontmatter sheet styles |
| `src/components/editor/FrontmatterSheet.module.css` | Frontmatter sheet styles |
| `src/components/editor/UnlinkedMentions.module.css` | Unlinked mentions panel styles |
| `src/lib/versions.ts` | Version save logic (`saveVersion`, `shouldAutoSaveVersion`, `markVersionSaved`) |
| `src/lib/noteLinks.ts` | WikiLink sync to `note_links` collection + backlinks query |
| `src/lib/markdown/frontmatter.ts` | Parse and replace YAML frontmatter blocks |
