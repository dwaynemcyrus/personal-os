import { supabase } from './supabase';
import { parseWikilinks } from './wikilinks';

export type DocumentBacklink = {
  sourceId: string;
  title: string | null;
  updatedAt: string;
  count: number;
};

type BacklinkCandidate = {
  id: string;
  title: string | null;
  updated_at: string;
  content: string | null;
};

export async function getDocumentBacklinks(
  documentId: string,
  targetTitle: string | null | undefined
): Promise<DocumentBacklink[]> {
  const normalizedTargetTitle = targetTitle?.trim().toLowerCase();
  if (!normalizedTargetTitle) return [];

  const { data, error } = await supabase
    .from('items')
    .select('id, title, updated_at, content')
    .eq('type', 'note')
    .is('date_trashed', null)
    .neq('id', documentId);

  if (error) throw error;

  const candidates = (data ?? []) as BacklinkCandidate[];
  const backlinks: DocumentBacklink[] = [];

  for (const candidate of candidates) {
    const content = candidate.content ?? '';
    if (!content) continue;

    const matchCount = parseWikilinks(content).filter(
      (link) => link.title.trim().toLowerCase() === normalizedTargetTitle
    ).length;

    if (matchCount === 0) continue;

    backlinks.push({
      sourceId: candidate.id,
      title: candidate.title,
      updatedAt: candidate.updated_at,
      count: matchCount,
    });
  }

  return backlinks.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}
