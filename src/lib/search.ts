import type { NoteDocument } from './db';

const SNIPPET_LENGTH = 120;
const MAX_RESULTS = 20;

function normalize(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

export type SearchResult = {
  note: NoteDocument;
  matchField: 'title' | 'content';
  snippet: string;
};

function buildSnippet(text: string, query: string): string {
  const normalizedText = normalize(text);
  const normalizedQuery = normalize(query);
  const index = normalizedText.indexOf(normalizedQuery);
  if (index === -1) return text.slice(0, SNIPPET_LENGTH);

  const halfWindow = Math.floor((SNIPPET_LENGTH - query.length) / 2);
  const start = Math.max(0, index - halfWindow);
  const end = Math.min(text.length, start + SNIPPET_LENGTH);

  let snippet = text.slice(start, end).trim();
  if (start > 0) snippet = `...${snippet}`;
  if (end < text.length) snippet = `${snippet}...`;
  return snippet;
}

export function searchNotes(
  notes: NoteDocument[],
  query: string
): SearchResult[] {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return [];

  const results: { result: SearchResult; rank: number }[] = [];

  for (const note of notes) {
    const normalizedTitle = normalize(note.title || '');
    const normalizedContent = normalize(note.content || '');

    const titleIndex = normalizedTitle.indexOf(normalizedQuery);
    const contentIndex = normalizedContent.indexOf(normalizedQuery);

    if (titleIndex !== -1) {
      results.push({
        result: {
          note,
          matchField: 'title',
          snippet: buildSnippet(note.content || '', normalizedQuery),
        },
        rank: titleIndex,
      });
    } else if (contentIndex !== -1) {
      results.push({
        result: {
          note,
          matchField: 'content',
          snippet: buildSnippet(note.content || '', normalizedQuery),
        },
        rank: 1000 + contentIndex,
      });
    }
  }

  results.sort((a, b) => a.rank - b.rank);

  return results.slice(0, MAX_RESULTS).map((r) => r.result);
}
