import { unzipSync } from 'fflate';
import { v4 as uuidv4 } from 'uuid';
import type { RxDatabase } from 'rxdb';
import type { DatabaseCollections, ItemPriority } from './db';
import { parseFrontmatter } from './markdown/frontmatter';
import { extractNoteTitle } from '../features/notes/noteUtils';
import { generateSlug } from './slug';
import { nowIso } from './time';

const VALID_PRIORITIES = new Set<string>(['low', 'medium', 'high', 'urgent']);

export type ImportResult = { imported: number; skipped: number };

async function processMarkdown(
  db: RxDatabase<DatabaseCollections>,
  filename: string,
  content: string
): Promise<'imported' | 'skipped'> {
  const fm = parseFrontmatter(content);
  const fmProps = fm.properties ?? {};

  const title =
    typeof fmProps.title === 'string' && fmProps.title.trim()
      ? fmProps.title.trim()
      : extractNoteTitle(content, undefined);

  const slugFromFile = filename
    .replace(/\.md$/, '')
    .split('/')
    .pop() ?? 'untitled';
  const slug =
    typeof fmProps.slug === 'string' && fmProps.slug.trim()
      ? fmProps.slug.trim()
      : slugFromFile;

  // Skip if a non-trashed note with this slug already exists
  const existing = await db.items
    .find({ selector: { slug, is_trashed: false } })
    .exec();
  if (existing.length > 0) return 'skipped';

  const timestamp = nowIso();
  const rawPriority =
    typeof fmProps.priority === 'string' && VALID_PRIORITIES.has(fmProps.priority)
      ? (fmProps.priority as ItemPriority)
      : null;

  await db.items.insert({
    id: uuidv4(),
    type: 'note',
    parent_id: null,
    title,
    slug,
    content,
    inbox_at: null,
    subtype: null,
    is_pinned: false,
    item_status: 'backlog',
    tags: Array.isArray(fmProps.tags)
      ? (fmProps.tags as unknown[]).filter((t): t is string => typeof t === 'string')
      : undefined,
    due_date: typeof fmProps.due_date === 'string' ? fmProps.due_date : null,
    start_date: typeof fmProps.start_date === 'string' ? fmProps.start_date : null,
    priority: rawPriority,
    completed: false,
    is_next: false,
    is_someday: false,
    is_waiting: false,
    processed: false,
    created_at: timestamp,
    updated_at: timestamp,
    is_trashed: false,
    trashed_at: null,
  });

  return 'imported';
}

export async function importNotesFromFiles(
  db: RxDatabase<DatabaseCollections>,
  files: File[]
): Promise<ImportResult> {
  let imported = 0;
  let skipped = 0;
  const mdFiles: Array<{ name: string; content: string }> = [];

  for (const file of files) {
    if (file.name.endsWith('.zip')) {
      const buf = await file.arrayBuffer();
      const unzipped = unzipSync(new Uint8Array(buf));
      for (const [name, data] of Object.entries(unzipped)) {
        if (name.endsWith('.md') && !name.includes('__MACOSX')) {
          mdFiles.push({ name, content: new TextDecoder().decode(data) });
        }
      }
    } else if (file.name.endsWith('.md')) {
      mdFiles.push({ name: file.name, content: await file.text() });
    }
  }

  for (const { name, content } of mdFiles) {
    const result = await processMarkdown(db, name, content);
    if (result === 'imported') imported++;
    else skipped++;
  }

  return { imported, skipped };
}
