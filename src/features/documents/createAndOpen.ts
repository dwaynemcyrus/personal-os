import { createDocument } from '@/lib/db';
import { generateCuid } from '@/lib/cuid';
import { getDocumentTemplate } from '@/lib/templates';
import { queryClient } from '@/lib/queryClient';

type Config = {
  type: string;
  subtype: string | null;
  defaultStatus: string;
  title?: string | null;
};

/**
 * Creates a new document with the correct template and returns its id.
 * Invalidates recent-docs cache so CommandSheet search stays fresh.
 */
export async function createAndOpen(config: Config): Promise<string> {
  const now = new Date().toISOString();
  const id = await createDocument({
    cuid: generateCuid(),
    type: config.type,
    subtype: config.subtype,
    title: config.title ?? null,
    status: config.defaultStatus,
    access: 'private',
    workbench: false,
    resources: [],
    dependencies: [],
    blocked: false,
    slug: null,
    published: false,
    tier: null,
    growth: null,
    rating: null,
    processed: config.type === 'inbox' ? false : null,
    start_date: null,
    end_date: null,
    date_created: now,
    date_modified: null,
    date_trashed: null,
    tags: [],
    content: getDocumentTemplate(config.type, config.subtype),
    frontmatter: null,
    area: null,
  });
  queryClient.invalidateQueries({ queryKey: ['command-sheet', 'recent'] });
  return id;
}
