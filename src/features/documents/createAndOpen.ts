import { createDocument } from '@/lib/db';
import { generateCuid } from '@/lib/cuid';
import { queryClient } from '@/lib/queryClient';
import { resolveDocumentTemplateContent } from '@/hooks/useDocumentTemplate';

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
  const content = await resolveDocumentTemplateContent(config.type, config.subtype, {
    title: config.title ?? null,
  });
  if (content === null) {
    throw new Error(`Missing template for ${config.type}${config.subtype ? `:${config.subtype}` : ''}`);
  }

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
    start_date: null,
    end_date: null,
    date_created: now,
    date_modified: null,
    date_trashed: null,
    tags: [],
    content,
    frontmatter: null,
    area: null,
  });
  queryClient.invalidateQueries({ queryKey: ['command-sheet', 'recent'] });
  return id;
}
