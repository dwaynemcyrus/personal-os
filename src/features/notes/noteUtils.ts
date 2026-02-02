const TITLE_FALLBACK = 'Untitled';
const TITLE_MAX_LENGTH = 80;

const getTrimmedLines = (content: string | null | undefined) => {
  if (!content) return [];
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
};

export const extractNoteTitle = (
  content: string | null | undefined,
  fallback?: string | null
) => {
  const lines = getTrimmedLines(content);
  const fallbackTitle = (fallback ?? '').trim();
  if (lines[0]) return lines[0];
  if (fallbackTitle) return fallbackTitle;
  return TITLE_FALLBACK;
};

export const formatNoteTitle = (title: string) => {
  const trimmed = title.trim() || TITLE_FALLBACK;
  if (trimmed.length <= TITLE_MAX_LENGTH) return trimmed;
  return `${trimmed.slice(0, TITLE_MAX_LENGTH - 1)}…`;
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
