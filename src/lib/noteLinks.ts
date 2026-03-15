/**
 * Note Links Utilities
 *
 * Functions to extract, store, and query wiki-links between notes.
 */

import { v4 as uuidv4 } from 'uuid';
import type { AbstractPowerSyncDatabase } from '@powersync/web';
import type { ItemRow, ItemLinkRow } from './db';
import { parseWikiLinks } from './markdown/wikilinks';
import { nowIso } from './time';

// ── Title cache ────────────────────────────────────────────────────────────────

let noteTitleCache: Map<string, string> | null = null;

export function invalidateNoteTitleCache(): void {
  noteTitleCache = null;
}

async function getNoteTitleMap(db: AbstractPowerSyncDatabase): Promise<Map<string, string>> {
  if (noteTitleCache) return noteTitleCache;
  const docs = await db.getAll<ItemRow>(
    'SELECT id, title FROM items WHERE type = ? AND is_trashed = 0',
    ['note']
  );
  noteTitleCache = new Map(docs.map((d) => [(d.title ?? '').toLowerCase(), d.id]));
  return noteTitleCache;
}

/**
 * Extract and save wiki-links from a note's content
 */
export async function syncNoteLinks(
  db: AbstractPowerSyncDatabase,
  sourceNoteId: string,
  content: string
): Promise<void> {
  const links = parseWikiLinks(content);
  const notesByTitle = await getNoteTitleMap(db);

  // Get existing links for this source note
  const existingLinks = await db.getAll<ItemLinkRow>(
    'SELECT * FROM item_links WHERE source_id = ? AND is_trashed = 0',
    [sourceNoteId]
  );

  const existingLinkMap = new Map<string, ItemLinkRow>();
  for (const link of existingLinks) {
    const key = `${link.target_title}|${link.header ?? ''}|${link.alias ?? ''}|${link.position}`;
    existingLinkMap.set(key, link);
  }

  const timestamp = nowIso();
  const processedKeys = new Set<string>();

  // Upsert links
  for (const link of links) {
    const targetNoteId = notesByTitle.get(link.target.toLowerCase()) ?? null;
    const key = `${link.target}|${link.header ?? ''}|${link.alias ?? ''}|${link.start}`;
    processedKeys.add(key);

    const existing = existingLinkMap.get(key);

    if (existing) {
      if (existing.target_id !== targetNoteId) {
        await db.execute(
          'UPDATE item_links SET target_id = ?, updated_at = ? WHERE id = ?',
          [targetNoteId, timestamp, existing.id]
        );
      }
    } else {
      await db.execute(
        `INSERT INTO item_links (id, source_id, target_id, target_title, header, alias, position, created_at, updated_at, is_trashed, trashed_at, owner)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, NULL)`,
        [
          uuidv4(),
          sourceNoteId,
          targetNoteId,
          link.target,
          link.header ?? null,
          link.alias ?? null,
          link.start,
          timestamp,
          timestamp,
        ]
      );
    }
  }

  // Trash links that no longer exist in content
  for (const [key, link] of existingLinkMap) {
    if (!processedKeys.has(key)) {
      await db.execute(
        'UPDATE item_links SET is_trashed = 1, trashed_at = ?, updated_at = ? WHERE id = ?',
        [timestamp, timestamp, link.id]
      );
    }
  }
}

/**
 * Get all notes that link TO a specific note (backlinks)
 */
export async function getBacklinks(
  db: AbstractPowerSyncDatabase,
  noteId: string
): Promise<Array<{ sourceId: string; title: string; position: number }>> {
  const links = await db.getAll<ItemLinkRow>(
    'SELECT * FROM item_links WHERE target_id = ? AND is_trashed = 0',
    [noteId]
  );

  const sourceIds = [...new Set(links.map((l) => l.source_id))];
  if (sourceIds.length === 0) return [];

  const placeholders = sourceIds.map(() => '?').join(', ');
  const sourceNotes = await db.getAll<ItemRow>(
    `SELECT id, title FROM items WHERE id IN (${placeholders})`,
    sourceIds
  );

  const noteTitles = new Map<string, string>();
  for (const note of sourceNotes) {
    noteTitles.set(note.id, note.title ?? '');
  }

  return links.map((link) => ({
    sourceId: link.source_id,
    title: noteTitles.get(link.source_id) ?? 'Unknown',
    position: link.position,
  }));
}

/**
 * Get all notes that a specific note links TO (outgoing links)
 */
export async function getOutgoingLinks(
  db: AbstractPowerSyncDatabase,
  sourceNoteId: string
): Promise<
  Array<{
    targetId: string | null;
    targetTitle: string;
    header: string | null;
    alias: string | null;
    resolved: boolean;
  }>
> {
  const links = await db.getAll<ItemLinkRow>(
    'SELECT * FROM item_links WHERE source_id = ? AND is_trashed = 0',
    [sourceNoteId]
  );

  return links.map((link) => ({
    targetId: link.target_id,
    targetTitle: link.target_title,
    header: link.header,
    alias: link.alias,
    resolved: link.target_id !== null,
  }));
}

/**
 * Update all links when a note is renamed
 */
export async function updateLinksOnNoteRename(
  db: AbstractPowerSyncDatabase,
  noteId: string,
  newTitle: string
): Promise<void> {
  const timestamp = nowIso();
  await db.execute(
    'UPDATE item_links SET target_title = ?, updated_at = ? WHERE target_id = ? AND is_trashed = 0',
    [newTitle, timestamp, noteId]
  );
  invalidateNoteTitleCache();
}
