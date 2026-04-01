import { createDocument } from '@/lib/db';
import { generateCuid } from '@/lib/cuid';
import { queryClient } from '@/lib/queryClient';
import { instantiateDocumentFromTemplate } from '@/hooks/useDocumentTemplate';

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
  const now = new Date();
  const document = await instantiateDocumentFromTemplate(config.type, config.subtype, {
    cuid: generateCuid(),
    defaultStatus: config.defaultStatus,
    title: config.title ?? null,
    date: now,
  });
  if (document === null) {
    throw new Error(`Missing template for ${config.type}${config.subtype ? `:${config.subtype}` : ''}`);
  }

  const id = await createDocument(document);
  queryClient.invalidateQueries({ queryKey: ['command-sheet', 'recent'] });
  return id;
}
