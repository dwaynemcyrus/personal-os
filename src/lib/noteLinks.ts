/**
 * Note Links Utilities
 *
 * Functions to extract, store, and query wiki-links between notes.
 */

import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import type { ItemRow, ItemLinkRow } from './db';
import { parseWikiLinks } from './markdown/wikilinks';
import { nowIso } from './time';

// ── Title cache ────────────────────────────────────────────────────────────────

let noteTitleCache: Map<string, string> | null = null;

export function invalidateNoteTitleCache(): void {
  noteTitleCache = null;
}

async function getNoteTitleMap(): Promise<Map<string, string>> {
  if (noteTitleCache) return noteTitleCache;
  const { data } = await supabase
    .from('items')
    .select('id, title')
    .eq('type', 'note')
    .eq('is_trashed', false);
  noteTitleCache = new Map(
    (data ?? []).map((d: { id: string; title: string | null }) => [
      (d.title ?? '').toLowerCase(),
      d.id,
    ])
  );
  return noteTitleCache;
}

/**
 * Extract and save wiki-links from a note's content
 */
export async function syncNoteLinks(
  sourceNoteId: string,
  content: string
): Promise<void> {
  const links = parseWikiLinks(content);
  const notesByTitle = await getNoteTitleMap();

  // Get existing links for this source note
  const { data: existingLinksData } = await supabase
    .from('item_links')
    .select('*')
    .eq('source_id', sourceNoteId)
    .eq('is_trashed', false);
  const existingLinks = (existingLinksData ?? []) as unknown as ItemLinkRow[];

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
        await supabase
          .from('item_links')
          .update({ target_id: targetNoteId, updated_at: timestamp })
          .eq('id', existing.id);
      }
    } else {
      await supabase.from('item_links').insert({
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
      await supabase
        .from('item_links')
        .update({ is_trashed: true, trashed_at: timestamp, updated_at: timestamp })
        .eq('id', link.id);
    }
  }
}

/**
 * Get all notes that link TO a specific note (backlinks)
 */
export async function getBacklinks(
  noteId: string
): Promise<Array<{ sourceId: string; title: string; position: number }>> {
  const { data: linksData } = await supabase
    .from('item_links')
    .select('*')
    .eq('target_id', noteId)
    .eq('is_trashed', false);
  const links = (linksData ?? []) as unknown as ItemLinkRow[];

  const sourceIds = [...new Set(links.map((l) => l.source_id))];
  if (sourceIds.length === 0) return [];

  const { data: sourceNotesData } = await supabase
    .from('items')
    .select('id, title')
    .in('id', sourceIds);

  const noteTitles = new Map<string, string>();
  for (const note of (sourceNotesData ?? []) as { id: string; title: string | null }[]) {
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
  const { data: linksData } = await supabase
    .from('item_links')
    .select('*')
    .eq('source_id', sourceNoteId)
    .eq('is_trashed', false);
  const links = (linksData ?? []) as unknown as ItemLinkRow[];

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
  noteId: string,
  newTitle: string
): Promise<void> {
  const timestamp = nowIso();
  await supabase
    .from('item_links')
    .update({ target_title: newTitle, updated_at: timestamp })
    .eq('target_id', noteId)
    .eq('is_trashed', false);
  invalidateNoteTitleCache();
}
