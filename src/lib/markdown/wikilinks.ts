/**
 * Wiki-Links Parser
 *
 * Parses wiki-link syntax: [[Note Name]], [[Note#Section]], [[Note|alias]], [[Note#Section|alias]]
 */

export interface WikiLink {
  raw: string; // Full [[...]] text
  target: string; // Note name
  header?: string; // Section name (if #header)
  alias?: string; // Display text (if |alias)
  start: number; // Character position in document
  end: number;
}

/**
 * Parse wiki-links from text
 * Supports:
 * - Basic: [[Note Name]]
 * - With header: [[Note Name#Section]]
 * - With alias: [[Note Name|display text]]
 * - Combined: [[Note Name#Section|alias]]
 */
export function parseWikiLinks(text: string): WikiLink[] {
  const links: WikiLink[] = [];

  // Regex: [[target#header|alias]]
  // Groups: 1=target, 2=header (optional), 3=alias (optional)
  const regex = /\[\[([^\]#|]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g;

  let match;
  while ((match = regex.exec(text)) !== null) {
    links.push({
      raw: match[0],
      target: match[1].trim(),
      header: match[2]?.trim(),
      alias: match[3]?.trim(),
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return links;
}

/**
 * Get display text for a wiki-link
 * Returns alias if present, otherwise target name
 */
export function getWikiLinkDisplayText(link: WikiLink): string {
  if (link.alias) {
    return link.alias;
  }
  if (link.header) {
    return `${link.target} > ${link.header}`;
  }
  return link.target;
}

/**
 * Check if text position is inside a wiki-link
 */
export function isInsideWikiLink(text: string, position: number): boolean {
  // Find the most recent [[ before position
  const before = text.slice(0, position);
  const lastOpen = before.lastIndexOf('[[');
  if (lastOpen === -1) return false;

  // Check if there's a ]] between [[ and position
  const between = text.slice(lastOpen, position);
  if (between.includes(']]')) return false;

  // Check if there's a ]] after position
  const after = text.slice(position);
  return after.includes(']]');
}

/**
 * Extract partial wiki-link query for autocomplete
 * Returns the text after [[ that user is typing
 */
export function extractPartialWikiLink(
  text: string,
  position: number
): { query: string; start: number } | null {
  const before = text.slice(0, position);

  // Match [[ followed by any chars that aren't ] or newline
  const match = before.match(/\[\[([^\]\n]*)$/);
  if (!match) return null;

  return {
    query: match[1],
    start: position - match[1].length,
  };
}
