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
  'medium', 'format', 'asset_type',
  'for_sale', 'sold', 'exhibited',
  'price', 'deal_value', 'lag_target', 'lag_actual', 'attendees',
  'total_sent', 'total_comments', 'total_responses',
  'chapter_count', 'series_position', 'episode', 'season',
  'date_delivered', 'contacted_last', 'next_follow_up',
  'frequency', 'stack', 'modules', 'be_and_feel', 'chains', 'platforms',
  'author', 'bookmark', 'certificate_link', 'collection',
  'contact_status', 'contact_type', 'course',
  'cover_alt_text', 'cover_link',
  'currency', 'currency_primary', 'currency_secondary',
  'date', 'deal_status', 'delivery', 'description', 'dimensions',
  'duration_target', 'genre', 'institution', 'instructor', 'isbn',
  'issue', 'lag_measure', 'lag_unit', 'manuscript', 'month',
  'month_expenses_chf', 'month_profit_chf', 'month_revenue_chf',
  'mood', 'outcome', 'platform', 'principle', 'problem', 'project',
  'recording_link', 'repo', 'score_overall', 'series',
  'solution', 'source', 'subtitle', 'target', 'theme',
  'unit', 'url', 'week', 'year',
  'start_date', 'end_date', 'date_created', 'date_modified', 'date_trashed',
  'tags',
];

// Keys patchable via DocumentPatch (no type/cuid — those are identity).
const PATCHABLE = new Set<string>([
  'title', 'status', 'subtype', 'content', 'area', 'workbench',
  'resources', 'dependencies', 'blocked', 'slug', 'published',
  'tier', 'growth', 'rating',
  'medium', 'format', 'asset_type',
  'for_sale', 'sold', 'exhibited',
  'price', 'deal_value', 'lag_target', 'lag_actual', 'attendees',
  'total_sent', 'total_comments', 'total_responses',
  'chapter_count', 'series_position', 'episode', 'season',
  'date_delivered', 'contacted_last', 'next_follow_up',
  'frequency', 'stack', 'modules', 'be_and_feel', 'chains', 'platforms',
  'author', 'bookmark', 'certificate_link', 'collection',
  'contact_status', 'contact_type', 'course',
  'cover_alt_text', 'cover_link',
  'currency', 'currency_primary', 'currency_secondary',
  'date', 'deal_status', 'delivery', 'description', 'dimensions',
  'duration_target', 'genre', 'institution', 'instructor', 'isbn',
  'issue', 'lag_measure', 'lag_unit', 'manuscript', 'month',
  'month_expenses_chf', 'month_profit_chf', 'month_revenue_chf',
  'mood', 'outcome', 'platform', 'principle', 'problem', 'project',
  'recording_link', 'repo', 'score_overall', 'series',
  'solution', 'source', 'subtitle', 'target', 'theme',
  'unit', 'url', 'week', 'year',
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
