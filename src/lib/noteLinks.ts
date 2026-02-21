/**
 * Note Links Utilities
 *
 * Functions to extract, store, and query wiki-links between notes.
 */

import { v4 as uuidv4 } from 'uuid';
import type { RxDatabase } from 'rxdb';
import type { DatabaseCollections } from './db';
import { parseWikiLinks } from './markdown/wikilinks';

const nowIso = () => new Date().toISOString();

/**
 * Extract and save wiki-links from a note's content
 *
 * This should be called whenever a note's content is saved.
 * It will:
 * 1. Parse all [[wiki-links]] from the content
 * 2. Resolve link targets to existing notes
 * 3. Store the links in the note_links collection
 * 4. Remove any links that no longer exist
 */
export async function syncNoteLinks(
  db: RxDatabase<DatabaseCollections>,
  sourceNoteId: string,
  content: string
): Promise<void> {
  const links = parseWikiLinks(content);

  // Get all existing notes for link resolution
  const allNotes = await db.notes
    .find({ selector: { is_trashed: false } })
    .exec();

  // Create a map of lowercase title -> note id
  const notesByTitle = new Map<string, string>();
  for (const doc of allNotes) {
    notesByTitle.set(doc.title.toLowerCase(), doc.id);
  }

  // Get existing links for this source note
  const existingLinks = await db.note_links
    .find({ selector: { source_id: sourceNoteId, is_trashed: false } })
    .exec();

  const existingLinkMap = new Map<string, typeof existingLinks[0]>();
  for (const link of existingLinks) {
    // Key: target_title + header + alias + position (to handle duplicates)
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
      // Update if target_id changed (note was created/renamed)
      if (existing.target_id !== targetNoteId) {
        await existing.patch({
          target_id: targetNoteId,
          updated_at: timestamp,
        });
      }
    } else {
      // Create new link
      await db.note_links.insert({
        id: uuidv4(),
        source_id: sourceNoteId,
        target_id: targetNoteId,
        target_title: link.target,
        header: link.header ?? null,
        alias: link.alias ?? null,
        position: link.start,
        created_at: timestamp,
        updated_at: timestamp,
        is_trashed: false,
        trashed_at: null,
      });
    }
  }

  // Trash links that no longer exist in content
  for (const [key, link] of existingLinkMap) {
    if (!processedKeys.has(key)) {
      await link.patch({
        is_trashed: true,
        trashed_at: timestamp,
        updated_at: timestamp,
      });
    }
  }
}

/**
 * Get all notes that link TO a specific note (backlinks)
 */
export async function getBacklinks(
  db: RxDatabase<DatabaseCollections>,
  noteId: string
): Promise<Array<{ sourceId: string; title: string; position: number }>> {
  const links = await db.note_links
    .find({
      selector: {
        target_id: noteId,
        is_trashed: false,
      },
    })
    .exec();

  // Get source note titles
  const sourceIds = [...new Set(links.map((l) => l.source_id))];
  const sourceNotes = await Promise.all(
    sourceIds.map((id) => db.notes.findOne(id).exec())
  );

  const noteTitles = new Map<string, string>();
  for (const note of sourceNotes) {
    if (note) {
      noteTitles.set(note.id, note.title);
    }
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
  db: RxDatabase<DatabaseCollections>,
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
  const links = await db.note_links
    .find({
      selector: {
        source_id: sourceNoteId,
        is_trashed: false,
      },
    })
    .exec();

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
 *
 * This updates the target_title field for links that point to this note.
 */
export async function updateLinksOnNoteRename(
  db: RxDatabase<DatabaseCollections>,
  noteId: string,
  newTitle: string
): Promise<void> {
  const links = await db.note_links
    .find({
      selector: {
        target_id: noteId,
        is_trashed: false,
      },
    })
    .exec();

  const timestamp = nowIso();

  for (const link of links) {
    await link.patch({
      target_title: newTitle,
      updated_at: timestamp,
    });
  }
}

/**
 * Resolve unlinked mentions
 *
 * Find text in notes that matches a note title but isn't linked.
 */
export async function findUnlinkedMentions(
  db: RxDatabase<DatabaseCollections>,
  noteTitle: string
): Promise<Array<{ noteId: string; noteTitle: string; positions: number[] }>> {
  const mentions: Array<{
    noteId: string;
    noteTitle: string;
    positions: number[];
  }> = [];

  const notes = await db.notes
    .find({ selector: { is_trashed: false } })
    .exec();

  const searchTerm = noteTitle.toLowerCase();

  for (const note of notes) {
    if (!note.content) continue;

    const content = note.content.toLowerCase();
    const positions: number[] = [];

    let pos = 0;
    while ((pos = content.indexOf(searchTerm, pos)) !== -1) {
      // Check if this is already a wiki-link
      const before = content.slice(Math.max(0, pos - 2), pos);
      const after = content.slice(
        pos + searchTerm.length,
        pos + searchTerm.length + 2
      );

      if (before !== '[[' && after !== ']]') {
        positions.push(pos);
      }

      pos += searchTerm.length;
    }

    if (positions.length > 0) {
      mentions.push({
        noteId: note.id,
        noteTitle: note.title,
        positions,
      });
    }
  }

  return mentions;
}
