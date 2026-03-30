/**
 * Utilities for converting a DocumentRow to/from raw markdown format.
 *
 * Raw format:
 * ```
 * ---
 * cuid: ...
 * type: ...
 * ...
 * ---
 *
 * <body content>
 * ```
 *
 * On save the raw string is parsed: known keys map to DB columns,
 * unknown keys are stored in the `frontmatter` jsonb column.
 */

import { stringify } from 'yaml';
import { parseFrontmatter } from './markdown/frontmatter';
import type { DocumentRow, DocumentPatch } from './db';

// Keys that are represented as frontmatter in the raw document.
// `id`, `owner`, `created_at`, `updated_at` are system columns — not exposed.
const FM_KEYS: (keyof DocumentRow)[] = [
  'cuid', 'type', 'subtype', 'title', 'status', 'access',
  'area', 'workbench', 'resources', 'dependencies', 'blocked',
  'slug', 'published', 'tier', 'growth', 'rating',
  'start_date', 'end_date', 'date_created', 'date_modified', 'date_trashed',
  'tags',
];

// Keys patchable via DocumentPatch (no type/cuid — those are identity).
const PATCHABLE = new Set<string>([
  'title', 'status', 'subtype', 'content', 'area', 'workbench',
  'resources', 'dependencies', 'blocked', 'slug', 'published',
  'tier', 'growth', 'rating',
  'start_date', 'end_date', 'date_created', 'date_modified', 'date_trashed',
  'tags', 'access', 'frontmatter',
]);

/**
 * Build the full raw document string (frontmatter block + body) from a DocumentRow.
 * Extra keys stored in `doc.frontmatter` jsonb are appended after the known keys.
 */
export function buildRawDocument(doc: DocumentRow): string {
  const fm: Record<string, unknown> = {};

  for (const key of FM_KEYS) {
    fm[key] = doc[key] ?? null;
  }

  // Append any extra keys from the frontmatter jsonb column
  if (doc.frontmatter) {
    for (const [k, v] of Object.entries(doc.frontmatter)) {
      if (!(k in fm)) {
        fm[k] = v;
      }
    }
  }

  const yamlStr = stringify(fm, { lineWidth: 0 }).trimEnd();
  const body = doc.content ?? '';
  return `---\n${yamlStr}\n---\n${body}`;
}

/**
 * Parse a raw document string back into a DocumentPatch.
 * Known keys map to DB columns. Unknown keys (beyond cuid/type) go to `frontmatter` jsonb.
 */
export function parseRawToDocumentPatch(raw: string): DocumentPatch {
  const parsed = parseFrontmatter(raw);
  const patch: DocumentPatch = { content: parsed.body || null };

  if (parsed.properties) {
    const extra: Record<string, unknown> = {};

    for (const [k, v] of Object.entries(parsed.properties)) {
      if (k === 'cuid' || k === 'type') {
        // Identity columns — skip (not patchable)
        continue;
      }
      if (PATCHABLE.has(k)) {
        (patch as Record<string, unknown>)[k] = v ?? null;
      } else {
        extra[k] = v;
      }
    }

    if (Object.keys(extra).length > 0) {
      patch.frontmatter = extra;
    }
  }

  return patch;
}
