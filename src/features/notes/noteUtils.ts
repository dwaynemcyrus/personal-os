const TITLE_FALLBACK = 'Untitled';
const TITLE_MAX_LENGTH = 80;
const FRONTMATTER_DELIMITER = /^---\s*$/;
const FRONTMATTER_END = /^(---|\.\.\.)\s*$/;

const getTrimmedLines = (content: string | null | undefined) => {
  if (!content) return [];
  const lines = content.split(/\r?\n/);
  let startIndex = 0;

  if (lines.length > 0 && FRONTMATTER_DELIMITER.test(lines[0] ?? '')) {
    let endIndex = -1;
    for (let i = 1; i < lines.length; i += 1) {
      if (FRONTMATTER_END.test(lines[i] ?? '')) {
        endIndex = i;
        break;
      }
    }
    if (endIndex === -1) {
      return [];
    }
    startIndex = endIndex + 1;
  }

  return lines
    .slice(startIndex)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
};

/**
 * Strip common markdown syntax from a line to get clean title text
 */
const stripMarkdown = (line: string) => {
  return line
    .replace(/^#{1,6}\s+/, '') // Headers: # ## ### etc
    .replace(/^[-*+]\s+/, '') // Unordered list items
    .replace(/^\d+\.\s+/, '') // Ordered list items
    .replace(/^>\s*/, '') // Block quotes
    .replace(/\*\*(.+?)\*\*/g, '$1') // Bold **text**
    .replace(/\*(.+?)\*/g, '$1') // Italic *text*
    .replace(/__(.+?)__/g, '$1') // Bold __text__
    .replace(/_(.+?)_/g, '$1') // Italic _text_
    .replace(/~~(.+?)~~/g, '$1') // Strikethrough
    .replace(/`(.+?)`/g, '$1') // Inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links [text](url)
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2') // Wiki-links with alias
    .replace(/\[\[([^\]]+)\]\]/g, '$1') // Wiki-links without alias
    .trim();
};

export const extractNoteTitle = (
  content: string | null | undefined,
  fallback?: string | null
) => {
  const lines = getTrimmedLines(content);
  const fallbackTitle = (fallback ?? '').trim();
  if (lines[0]) {
    const stripped = stripMarkdown(lines[0]);
    if (stripped) return stripped;
  }
  if (fallbackTitle) return stripMarkdown(fallbackTitle);
  return TITLE_FALLBACK;
};

export const formatNoteTitle = (title: string) => {
  const trimmed = title.trim() || TITLE_FALLBACK;
  if (trimmed.length <= TITLE_MAX_LENGTH) return trimmed;
  return `${trimmed.slice(0, TITLE_MAX_LENGTH - 3)}...`;
};

export const extractTitleFromFirstLine = (content: string | null | undefined) => {
  const lines = getTrimmedLines(content);
  if (!lines[0]) return TITLE_FALLBACK;
  const stripped = stripMarkdown(lines[0]);
  if (!stripped) return TITLE_FALLBACK;
  if (stripped.length <= TITLE_MAX_LENGTH) return stripped;
  return stripped.slice(0, TITLE_MAX_LENGTH);
};

export const extractNoteSnippet = (content: string | null | undefined) => {
  const lines = getTrimmedLines(content);
  if (lines.length <= 1) return '';
  return lines.slice(1, 3).join(' ');
};

export const formatRelativeTime = (iso: string | null | undefined) => {
  if (!iso) return 'unknown';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'unknown';
  const diffMs = Date.now() - date.getTime();
  const tense = diffMs < 0 ? -1 : 1;
  const absMs = Math.abs(diffMs);
  if (absMs < 60_000) return 'just now';

  const minutes = Math.round(absMs / 60_000);
  if (minutes < 60) return `${minutes}m ${tense < 0 ? 'from now' : 'ago'}`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ${tense < 0 ? 'from now' : 'ago'}`;

  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ${tense < 0 ? 'from now' : 'ago'}`;

  const weeks = Math.round(days / 7);
  if (weeks < 5) return `${weeks}w ${tense < 0 ? 'from now' : 'ago'}`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
};
