/**
 * Template variable replacement and merge utilities.
 *
 * Supported variables:
 * - {{date}}           - Current date using configured date format (default YYYY-MM-DD)
 * - {{date:FORMAT}}    - Current date with explicit format (overrides configured format)
 * - {{time}}           - Current time using configured time format (default HH:mm:ss)
 * - {{time:FORMAT}}    - Current time with explicit format
 * - {{datetime}}       - Current date and time (YYYY-MM-DD HH:mm)
 * - {{title}}          - Note title
 * - {{year}}           - Current year
 * - {{month}}          - Current month (01-12)
 * - {{day}}            - Current day (01-31)
 * - {{weekday}}        - Day of week (Monday, Tuesday, etc.)
 *
 * Format tokens: YYYY MM DD HH mm ss YY MMMM MMM M D dddd ddd
 */

import {
  parseFrontmatter,
  addMissingFrontmatterKeys,
  serializeFrontmatter,
  replaceFrontmatterBlock,
} from './markdown/frontmatter';

export type TemplateVariables = {
  title?: string;
  date?: Date;
  dateFormat?: string;
  timeFormat?: string;
};

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function formatDate(date: Date, format?: string): string {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const weekday = WEEKDAYS[date.getDay()];
  const monthName = MONTHS[date.getMonth()];

  if (!format) return `${year}-${month}-${day}`;

  return format
    .replace(/YYYY/g, year.toString())
    .replace(/YY/g, year.toString().slice(-2))
    .replace(/MMMM/g, monthName)
    .replace(/MMM/g, monthName.slice(0, 3))
    .replace(/MM/g, month)
    .replace(/M/g, (date.getMonth() + 1).toString())
    .replace(/DD/g, day)
    .replace(/D/g, date.getDate().toString())
    .replace(/dddd/g, weekday)
    .replace(/ddd/g, weekday.slice(0, 3));
}

function formatTime(date: Date, format?: string): string {
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());

  if (!format) return `${hh}:${mm}:${ss}`;

  return format
    .replace(/HH/g, hh)
    .replace(/H/g, date.getHours().toString())
    .replace(/mm/g, mm)
    .replace(/m/g, date.getMinutes().toString())
    .replace(/ss/g, ss)
    .replace(/s/g, date.getSeconds().toString());
}

function formatDateTime(date: Date): string {
  return `${formatDate(date)} ${formatTime(date, 'HH:mm')}`;
}

/**
 * Replace all template variables in content.
 * `dateFormat` and `timeFormat` are the globally configured formats used when
 * `{{date}}` / `{{time}}` appear without an explicit format suffix.
 */
export function replaceTemplateVariables(
  content: string,
  variables: TemplateVariables = {}
): string {
  const date = variables.date ?? new Date();
  const title = variables.title ?? 'Untitled';
  const dateFormat = variables.dateFormat ?? 'YYYY-MM-DD';
  const timeFormat = variables.timeFormat ?? 'HH:mm:ss';

  let result = content;

  // Replace {{date:FORMAT}} and {{time:FORMAT}} first (more specific)
  result = result.replace(/\{\{date:([^}]+)\}\}/g, (_, fmt) => formatDate(date, fmt));
  result = result.replace(/\{\{time:([^}]+)\}\}/g, (_, fmt) => formatTime(date, fmt));

  // Replace simple variables using the configured formats
  const replacements: Record<string, string> = {
    date: formatDate(date, dateFormat),
    time: formatTime(date, timeFormat),
    datetime: formatDateTime(date),
    title,
    year: date.getFullYear().toString(),
    month: pad(date.getMonth() + 1),
    day: pad(date.getDate()),
    weekday: WEEKDAYS[date.getDay()],
  };

  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }

  return result;
}

/**
 * Merge a resolved template into existing note content (Option B):
 * - Frontmatter: template keys are added to note frontmatter only if missing.
 *   Existing note keys are never overwritten.
 * - Body: template body is inserted at cursorOffset within the note.
 *
 * For empty notes the full template content is returned as-is.
 */
export function mergeTemplateIntoNote(
  noteContent: string,
  resolvedTemplate: string,
  cursorOffset: number = 0
): string {
  const trimmedNote = noteContent.trim();

  // Empty note: return the full template
  if (!trimmedNote) return resolvedTemplate;

  const noteParsed = parseFrontmatter(noteContent);
  const templateParsed = parseFrontmatter(resolvedTemplate);

  let mergedNote = noteContent;
  let bodyInsertOffset = cursorOffset;

  // Step 1: handle frontmatter merge
  if (templateParsed.hasFrontmatter && templateParsed.properties) {
    if (noteParsed.hasFrontmatter && noteParsed.document) {
      // Both have frontmatter — add missing template keys to note
      const mergedDoc = addMissingFrontmatterKeys(noteParsed.document, templateParsed.properties);
      mergedNote = replaceFrontmatterBlock(noteContent, mergedDoc);
      // Cursor offset may have shifted if frontmatter grew; recalculate from original fm length
      const originalFmLength = noteContent.length - noteParsed.body.length;
      const newFmLength = mergedNote.length - noteParsed.body.length;
      const fmDelta = newFmLength - originalFmLength;
      bodyInsertOffset = Math.min(
        Math.max(0, cursorOffset + (cursorOffset >= originalFmLength ? fmDelta : 0)),
        mergedNote.length
      );
    } else if (!noteParsed.hasFrontmatter) {
      // Note has no frontmatter — prepend template's frontmatter block
      const fmBlock = serializeFrontmatter(
        addMissingFrontmatterKeys(null, templateParsed.properties),
        '\n'
      );
      mergedNote = fmBlock + noteContent;
      bodyInsertOffset = cursorOffset + fmBlock.length;
    }
  }

  // Step 2: insert template body at cursor
  const templateBody = templateParsed.body;
  if (!templateBody.trim()) return mergedNote;

  // Ensure a newline boundary between existing content and inserted body
  const insertText = '\n' + templateBody.trimStart();
  const clampedOffset = Math.min(Math.max(0, bodyInsertOffset), mergedNote.length);

  return mergedNote.slice(0, clampedOffset) + insertText + mergedNote.slice(clampedOffset);
}

/**
 * Find the position to place cursor after template insertion.
 * Returns the position after the first empty task item or first empty line after a heading.
 */
export function findCursorPosition(content: string): number {
  const emptyTaskMatch = content.match(/- \[ \] (\n|$)/);
  if (emptyTaskMatch && emptyTaskMatch.index !== undefined) {
    return emptyTaskMatch.index + 6;
  }

  const lines = content.split('\n');
  let position = 0;
  let foundHeading = false;

  for (const line of lines) {
    if (line.startsWith('#')) {
      foundHeading = true;
    } else if (foundHeading && line.trim() === '') {
      return position + line.length + 1;
    }
    position += line.length + 1;
  }

  return content.length;
}
