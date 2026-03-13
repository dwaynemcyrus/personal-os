export type ParsedWikilink = {
  raw: string;
  title: string;
  header: string | undefined;
  alias: string | undefined;
  from: number;
  to: number;
};

// Matches [[Title]], [[Title#Heading]], [[Title|Alias]], [[Title#Heading|Alias]]
const WIKILINK_PATTERN = /\[\[([^\]#|[\n]+?)(?:#([^\]|[\n]+?))?(?:\|([^\][\n]+?))?\]\]/g;

export function parseWikilinks(content: string): ParsedWikilink[] {
  const results: ParsedWikilink[] = [];
  const re = new RegExp(WIKILINK_PATTERN.source, 'g');
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    const title = match[1]?.trim();
    if (!title) continue;
    results.push({
      raw: match[0],
      title,
      header: match[2]?.trim() || undefined,
      alias: match[3]?.trim() || undefined,
      from: match.index,
      to: match.index + match[0].length,
    });
  }
  return results;
}

export function renameWikilinks(content: string, oldTitle: string, newTitle: string): string {
  const escaped = oldTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`\\[\\[${escaped}((?:#[^\\]|]*)?(?:\\|[^\\]]*)?)\\]\\]`, 'g');
  return content.replace(re, `[[${newTitle}$1]]`);
}

export const WIKILINK_RE_SOURCE = WIKILINK_PATTERN.source;
