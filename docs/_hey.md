Here's a practical test plan in order of risk (safe → destructive):

  ---
  1. Export Notes
  - Create 2-3 test notes with different content, one with frontmatter (title:, tags:, due_date:)
  - Open Settings → "Export Notes as ZIP"
  - Unzip the downloaded file and verify:
    - Filenames match the note slugs (e.g. my-note.md)
    - File content matches what you wrote
    - Frontmatter is preserved as-is in the markdown

  ---
  2. Import from Obsidian
  - Take one of the exported .md files, change the slug in the filename (e.g. rename it to imported-test.md) so it won't be treated as a
  duplicate
  - Open Settings → "Import from Obsidian" → pick that file
  - Verify it appears in Notes with the correct title and content
  - Try importing the same file again → should say "skipped 1"
  - If you have an Obsidian vault, export it as a ZIP and import the whole thing

  ---
  3. Backup
  - Open Settings → "Create Backup"
  - Open the downloaded JSON and spot-check: it should have a collections key with items, item_links, etc., and your notes should be in
  collections.items

  ---
  4. Restore — Merge (safe, additive)
  - Delete one test note from the app
  - Open Settings → "Restore — Merge" → pick the backup you just created
  - Confirm the deleted note reappears
  - Verify existing notes were not duplicated

  ---
  5. Restore — Replace All (destructive — test last)
  - Create a backup first
  - Add a couple of throwaway notes
  - Open Settings → "Restore — Replace All" → pick the backup
  - Confirm the throwaway notes are gone and your original data is back

  ---
  Things most likely to surface bugs:
  - Notes with emoji or special characters in the title (slug generation edge case)
  - Very large notes or many notes (ZIP memory/performance)
  - Obsidian vaults with nested folders in the ZIP (the importer flattens them — filenames come from the last path segment)
  - A backup file from a future schema version being restored to an older build